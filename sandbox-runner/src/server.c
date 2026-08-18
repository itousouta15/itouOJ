// M5: HTTP service wrapping the already-built `jail` binary (M1-M4), with a
// JSON request/response shape matching Piston's /api/v2/execute -- so this
// can later be curl-diffed against Piston directly, and eventually swapped
// in for it in src/lib/piston.ts without changing judge.ts's call sites.
//
// Scope for M5: C and C++ only (mirrors what's already hardened through
// M4). Python/Java/JavaScript are M7's job.
//
// SECURITY FIX (itouoj-critical-compiler-file-read): compilation (gcc/g++)
// used to run directly on the host, NOT through the namespace/cgroup/
// seccomp sandbox -- only the compiled binary's RUN phase went through
// `jail`. The reasoning at the time was "asymmetric strictness" (the
// compiler operates on attacker-controlled *source*, not attacker-
// controlled *machine code*), but that missed that the C preprocessor's
// #include is itself attacker-steerable: a submission could #include an
// arbitrary host path and have gcc's compile-error diagnostics echo that
// file's content back through /api/run's compileError, up to and
// including this app's own .env. Compilation now goes through `jail` too
// -- see setup_compiler_rootfs() and the "compile" seccomp profile in
// seccomp.c -- with its own, more permissive-but-still-jailed rootfs
// (jail.c's pivot_into_rootfs compile_mode path) since it needs to write
// its output binary, unlike the run phase.
//
// Single-threaded by construction (MHD_USE_INTERNAL_POLLING_THREAD without
// thread-per-connection): one request judged at a time. This is a
// deliberate, simple concurrency guard -- see the plan's risk note about
// /api/run having none today.
//
// M9: compile-once caching. judge.ts judges one test case per request, and
// with no caching that meant recompiling identical source from scratch for
// every test case of the same submission. An optional `precompiled_binary`
// request field (base64) skips straight to the run phase using those bytes
// instead of invoking the compiler; a successful fresh compile echoes the
// binary back as `compiled_binary` so the caller can hand it back on the
// submission's remaining test cases. Doesn't change the trust boundary:
// this API is loopback-only, so the only caller is judge.ts itself, and the
// cached bytes are always exactly what the real compiler already produced
// from that submission's own source earlier in the same judging pass --
// never anything supplied by the student directly.
#define _GNU_SOURCE
#include <arpa/inet.h>
#include <cjson/cJSON.h>
#include <errno.h>
#include <fcntl.h>
#include <microhttpd.h>
#include <netinet/in.h>
#include <poll.h>
#include <signal.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/mount.h>
#include <sys/stat.h>
#include <sys/wait.h>
#include <time.h>
#include <unistd.h>

#define PORT 8090
#define JAIL_BIN "./jail"
#define WORK_ROOT "./work"
#define DEFAULT_PIDS_MAX "32"
// Compile-phase jail limits -- independent of the per-problem run_mem_mb
// (which bounds the *submission's own* program, not the compiler). gcc/g++
// with -O2 can need a few hundred MB on complex templates; generous
// headroom here isn't a correctness concern the way the run phase's limit
// is, it's just a backstop against a compile that's gone pathological.
#define COMPILE_MEM_MB 1024
#define COMPILE_PIDS_MAX "64" // cc1/cc1plus, as, collect2, ld -- a handful
#define PYTHON_HOME "/opt/piston-data/packages/python/3.12.0"
#define NODE_HOME "/opt/piston-data/packages/node/20.11.1"

struct lang_info {
  const char *key; // matches src/lib/languages.ts's `lang.piston` value
  const char *compiler; // NULL if there's no compile step (e.g. Python/Node)
  const char *filename;        // source filename inside the workdir
  const char *seccomp_profile; // see src/seccomp.c
  const char *runtime_home;     // host path bind-mounted at /opt/runtime, or
                                 // NULL for natively-compiled languages
  const char *interpreter_path; // path inside the rootfs to execve, or NULL
                                 // to run the compiled /bin/prog directly
};

static const struct lang_info LANGS[] = {
    // Absolute paths, not bare "gcc"/"g++": the compile phase now runs
    // inside `jail` (see the compile_mode path below), whose child_main
    // execve()s directly -- no $PATH lookup like the old host-side
    // run_child()'s execvp() got away with. Same absolute paths as the
    // host's `which gcc`/`which g++`, which resolve identically inside
    // the jail since /usr is bind-mounted at that same absolute path
    // (see setup_compiler_rootfs).
    {"c", "/usr/bin/gcc", "main.c", "native", NULL, NULL},
    {"c++", "/usr/bin/g++", "main.cpp", "native", NULL, NULL},
    {"python", NULL, "main.py", "python", PYTHON_HOME,
     "/opt/runtime/bin/python3.12"},
    {"javascript", NULL, "main.js", "node", NODE_HOME,
     "/opt/runtime/bin/node"},
};

static const struct lang_info *find_lang(const char *key) {
  for (size_t i = 0; i < sizeof(LANGS) / sizeof(LANGS[0]); i++) {
    if (strcmp(LANGS[i].key, key) == 0) return &LANGS[i];
  }
  return NULL;
}

static const char *signal_name(int sig) {
  switch (sig) {
    case SIGKILL: return "SIGKILL";
    case SIGSEGV: return "SIGSEGV";
    case SIGABRT: return "SIGABRT";
    case SIGFPE: return "SIGFPE";
    case SIGSYS: return "SIGSYS";
    case SIGPIPE: return "SIGPIPE";
    case SIGBUS: return "SIGBUS";
    case SIGILL: return "SIGILL";
    case SIGXCPU: return "SIGXCPU";
    case SIGXFSZ: return "SIGXFSZ";
    default: {
      static char buf[16];
      snprintf(buf, sizeof(buf), "SIG%d", sig);
      return buf;
    }
  }
}

// ---- growable buffer ----

static void buf_append(char **buf, size_t *len, const char *data, size_t n) {
  char *grown = realloc(*buf, *len + n + 1);
  if (!grown) return; // best-effort; drop the append rather than crash
  *buf = grown;
  memcpy(*buf + *len, data, n);
  *len += n;
  (*buf)[*len] = '\0';
}

// ---- subprocess execution with non-blocking multiplexed I/O ----
//
// Handles stdin/stdout/stderr (and optionally a 4th "meta" fd, fd 3 in the
// child) concurrently via poll() so writing stdin can never deadlock
// against a full stdout/stderr pipe, in either direction. A plain
// sequential "write all stdin, then read all stdout" approach deadlocks
// once either side fills the kernel pipe buffer (64KB by default) before
// the other side starts draining it.

struct captured_output {
  char *stdout_buf;
  size_t stdout_len;
  char *stderr_buf;
  size_t stderr_len;
  char *meta_buf;
  size_t meta_len;
};

static void free_captured(struct captured_output *o) {
  free(o->stdout_buf);
  free(o->stderr_buf);
  free(o->meta_buf);
}

static int run_child(char *const argv[], const char *stdin_data,
                      size_t stdin_len, int use_meta_fd, long timeout_ms,
                      struct captured_output *out, int *exit_code,
                      int *term_signal) {
  int in_pipe[2], out_pipe[2], err_pipe[2], meta_pipe[2] = {-1, -1};
  if (pipe(in_pipe) == -1 || pipe(out_pipe) == -1 || pipe(err_pipe) == -1) {
    return -1;
  }
  if (use_meta_fd && pipe(meta_pipe) == -1) {
    return -1;
  }

  pid_t pid = fork();
  if (pid < 0) {
    return -1;
  }
  if (pid == 0) {
    dup2(in_pipe[0], 0);
    dup2(out_pipe[1], 1);
    dup2(err_pipe[1], 2);
    if (use_meta_fd) dup2(meta_pipe[1], 3);
    close(in_pipe[0]);
    close(in_pipe[1]);
    close(out_pipe[0]);
    close(out_pipe[1]);
    close(err_pipe[0]);
    close(err_pipe[1]);
    if (use_meta_fd) {
      close(meta_pipe[0]);
      close(meta_pipe[1]);
    }
    execvp(argv[0], argv);
    _exit(127);
  }

  close(in_pipe[0]);
  close(out_pipe[1]);
  close(err_pipe[1]);
  if (use_meta_fd) close(meta_pipe[1]);

  fcntl(in_pipe[1], F_SETFL, O_NONBLOCK);
  fcntl(out_pipe[0], F_SETFL, O_NONBLOCK);
  fcntl(err_pipe[0], F_SETFL, O_NONBLOCK);
  if (use_meta_fd) fcntl(meta_pipe[0], F_SETFL, O_NONBLOCK);

  size_t stdin_written = 0;
  int stdin_open = stdin_len > 0;
  if (!stdin_open) close(in_pipe[1]);
  int out_open = 1, err_open = 1, meta_open = use_meta_fd;

  struct timespec start;
  clock_gettime(CLOCK_MONOTONIC, &start);
  int killed_for_timeout = 0;

  while (out_open || err_open || meta_open) {
    struct pollfd fds[4];
    int nfds = 0, i_in = -1, i_out = -1, i_err = -1, i_meta = -1;
    if (stdin_open) {
      fds[nfds] = (struct pollfd){in_pipe[1], POLLOUT, 0};
      i_in = nfds++;
    }
    if (out_open) {
      fds[nfds] = (struct pollfd){out_pipe[0], POLLIN, 0};
      i_out = nfds++;
    }
    if (err_open) {
      fds[nfds] = (struct pollfd){err_pipe[0], POLLIN, 0};
      i_err = nfds++;
    }
    if (meta_open) {
      fds[nfds] = (struct pollfd){meta_pipe[0], POLLIN, 0};
      i_meta = nfds++;
    }

    int pr = poll(fds, nfds, 100);
    if (pr < 0) {
      if (errno == EINTR) continue;
      break;
    }

    if (timeout_ms > 0 && !killed_for_timeout) {
      struct timespec now;
      clock_gettime(CLOCK_MONOTONIC, &now);
      long elapsed = (now.tv_sec - start.tv_sec) * 1000 +
                     (now.tv_nsec - start.tv_nsec) / 1000000;
      if (elapsed >= timeout_ms) {
        kill(pid, SIGKILL);
        killed_for_timeout = 1;
      }
    }

    if (i_in >= 0 && (fds[i_in].revents & (POLLOUT | POLLERR | POLLHUP))) {
      ssize_t n = write(in_pipe[1], stdin_data + stdin_written,
                         stdin_len - stdin_written);
      if (n > 0) {
        stdin_written += (size_t)n;
        if (stdin_written >= stdin_len) {
          close(in_pipe[1]);
          stdin_open = 0;
        }
      } else if (n < 0 && errno != EAGAIN) {
        close(in_pipe[1]);
        stdin_open = 0;
      }
    }
    if (i_out >= 0 && (fds[i_out].revents & (POLLIN | POLLHUP | POLLERR))) {
      char tmp[4096];
      ssize_t n = read(out_pipe[0], tmp, sizeof(tmp));
      if (n > 0) {
        buf_append(&out->stdout_buf, &out->stdout_len, tmp, (size_t)n);
      } else {
        close(out_pipe[0]);
        out_open = 0;
      }
    }
    if (i_err >= 0 && (fds[i_err].revents & (POLLIN | POLLHUP | POLLERR))) {
      char tmp[4096];
      ssize_t n = read(err_pipe[0], tmp, sizeof(tmp));
      if (n > 0) {
        buf_append(&out->stderr_buf, &out->stderr_len, tmp, (size_t)n);
      } else {
        close(err_pipe[0]);
        err_open = 0;
      }
    }
    if (i_meta >= 0 && (fds[i_meta].revents & (POLLIN | POLLHUP | POLLERR))) {
      char tmp[4096];
      ssize_t n = read(meta_pipe[0], tmp, sizeof(tmp));
      if (n > 0) {
        buf_append(&out->meta_buf, &out->meta_len, tmp, (size_t)n);
      } else {
        close(meta_pipe[0]);
        meta_open = 0;
      }
    }
  }
  if (stdin_open) close(in_pipe[1]);

  int status;
  waitpid(pid, &status, 0);
  if (WIFEXITED(status)) {
    *exit_code = WEXITSTATUS(status);
    *term_signal = -1;
  } else if (WIFSIGNALED(status)) {
    *exit_code = -1;
    *term_signal = WTERMSIG(status);
  } else {
    *exit_code = -1;
    *term_signal = -1;
  }
  return 0;
}

static long parse_meta_long(const char *meta, const char *key) {
  if (!meta) return 0;
  const char *p = strstr(meta, key);
  if (!p) return 0;
  return atol(p + strlen(key));
}

// ---- minimal base64 (no external dependency) ----
//
// Used to shuttle a compiled binary between server and judge process so the
// same submission's later test cases can skip recompiling. Both ends are on
// loopback only -- see the "compile-once" note in process_execute() for why
// this doesn't change the trust boundary.

static const char B64_TABLE[] =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

static char *base64_encode(const unsigned char *data, size_t len) {
  size_t out_len = 4 * ((len + 2) / 3);
  char *out = malloc(out_len + 1);
  if (!out) return NULL;
  size_t i = 0, j = 0;
  while (i + 3 <= len) {
    unsigned int n = ((unsigned int)data[i] << 16) |
                      ((unsigned int)data[i + 1] << 8) | data[i + 2];
    out[j++] = B64_TABLE[(n >> 18) & 0x3F];
    out[j++] = B64_TABLE[(n >> 12) & 0x3F];
    out[j++] = B64_TABLE[(n >> 6) & 0x3F];
    out[j++] = B64_TABLE[n & 0x3F];
    i += 3;
  }
  size_t rem = len - i;
  if (rem == 1) {
    unsigned int n = (unsigned int)data[i] << 16;
    out[j++] = B64_TABLE[(n >> 18) & 0x3F];
    out[j++] = B64_TABLE[(n >> 12) & 0x3F];
    out[j++] = '=';
    out[j++] = '=';
  } else if (rem == 2) {
    unsigned int n =
        ((unsigned int)data[i] << 16) | ((unsigned int)data[i + 1] << 8);
    out[j++] = B64_TABLE[(n >> 18) & 0x3F];
    out[j++] = B64_TABLE[(n >> 12) & 0x3F];
    out[j++] = B64_TABLE[(n >> 6) & 0x3F];
    out[j++] = '=';
  }
  out[j] = '\0';
  return out;
}

static int base64_val(char c) {
  if (c >= 'A' && c <= 'Z') return c - 'A';
  if (c >= 'a' && c <= 'z') return c - 'a' + 26;
  if (c >= '0' && c <= '9') return c - '0' + 52;
  if (c == '+') return 62;
  if (c == '/') return 63;
  return -1;
}

// NULL on malformed input (caller must treat that the same as "compile
// failed" -- never silently fall back to compiling from source once a
// precompiled_binary field was present, that would defeat the point of
// the caller's cache and mask a real bug).
static unsigned char *base64_decode(const char *in, size_t *out_len) {
  size_t in_len = strlen(in);
  if (in_len == 0 || in_len % 4 != 0) return NULL;
  size_t pad = 0;
  if (in[in_len - 1] == '=') pad++;
  if (in_len > 1 && in[in_len - 2] == '=') pad++;
  size_t out_cap = (in_len / 4) * 3 - pad;
  unsigned char *out = malloc(out_cap > 0 ? out_cap : 1);
  if (!out) return NULL;
  size_t j = 0;
  for (size_t i = 0; i < in_len; i += 4) {
    int v0 = base64_val(in[i]);
    int v1 = base64_val(in[i + 1]);
    int is_pad2 = in[i + 2] == '=';
    int is_pad3 = in[i + 3] == '=';
    int v2 = is_pad2 ? 0 : base64_val(in[i + 2]);
    int v3 = is_pad3 ? 0 : base64_val(in[i + 3]);
    if (v0 < 0 || v1 < 0 || (!is_pad2 && v2 < 0) || (!is_pad3 && v3 < 0)) {
      free(out);
      return NULL;
    }
    unsigned int n = ((unsigned int)v0 << 18) | ((unsigned int)v1 << 12) |
                      ((unsigned int)v2 << 6) | (unsigned int)v3;
    if (j < out_cap) out[j++] = (n >> 16) & 0xFF;
    if (!is_pad2 && j < out_cap) out[j++] = (n >> 8) & 0xFF;
    if (!is_pad3 && j < out_cap) out[j++] = n & 0xFF;
  }
  *out_len = j;
  return out;
}

static void cleanup_workdir(const char *workdir) {
  char *argv[] = {"rm", "-rf", (char *)workdir, NULL};
  int exit_code, term_signal;
  struct captured_output discard = {0};
  run_child(argv, NULL, 0, 0, 5000, &discard, &exit_code, &term_signal);
  free_captured(&discard);
}

// ---- interpreter rootfs bind mounts (Python, unlike statically-linked
// C/C++, needs its own package tree + host shared libs present at runtime)
//
// Host is a merged-/usr layout (/lib -> usr/lib, /lib64 -> usr/lib64), so
// bind-mounting /usr and replicating those two symlinks is enough to
// satisfy the dynamic linker -- no need to separately mount /lib, /lib64,
// and /usr/lib/x86_64-linux-gnu as three different bind mounts.

static int bind_mount_ro(const char *src, const char *dst) {
  if (mkdir(dst, 0755) == -1 && errno != EEXIST) {
    fprintf(stderr, "[server] mkdir %s: %s\n", dst, strerror(errno));
    return -1;
  }
  if (mount(src, dst, NULL, MS_BIND | MS_REC, NULL) == -1) {
    fprintf(stderr, "[server] bind mount %s -> %s: %s\n", src, dst,
            strerror(errno));
    return -1;
  }
  return 0;
}

// Generic across interpreted languages: mounts the given runtime package
// (Python's or Node's piston-data tree) at /opt/runtime, plus host /usr for
// shared libs, replicating the merged-/usr symlinks so the dynamic linker
// resolves them normally inside the pivot_root'd rootfs.
static void setup_interpreter_rootfs(const char *rootfs_dir,
                                      const char *runtime_home) {
  char dst[400];
  snprintf(dst, sizeof(dst), "%s/opt", rootfs_dir);
  mkdir(dst, 0755);
  snprintf(dst, sizeof(dst), "%s/opt/runtime", rootfs_dir);
  bind_mount_ro(runtime_home, dst);

  snprintf(dst, sizeof(dst), "%s/usr", rootfs_dir);
  bind_mount_ro("/usr", dst);

  char link[400];
  snprintf(link, sizeof(link), "%s/lib", rootfs_dir);
  if (symlink("usr/lib", link) == -1 && errno != EEXIST) {
    fprintf(stderr, "[server] symlink %s: %s\n", link, strerror(errno));
  }
  snprintf(link, sizeof(link), "%s/lib64", rootfs_dir);
  if (symlink("usr/lib64", link) == -1 && errno != EEXIST) {
    fprintf(stderr, "[server] symlink %s: %s\n", link, strerror(errno));
  }
}

static void teardown_interpreter_rootfs(const char *rootfs_dir) {
  char dst[400];
  snprintf(dst, sizeof(dst), "%s/usr", rootfs_dir);
  umount2(dst, MNT_DETACH);
  snprintf(dst, sizeof(dst), "%s/opt/runtime", rootfs_dir);
  umount2(dst, MNT_DETACH);
}

// ---- compiler rootfs bind mounts ----
//
// Same merged-/usr trick as the interpreter rootfs above, but without a
// /opt/runtime package tree: gcc/g++ and their whole toolchain (cc1/
// cc1plus, as, collect2/ld, crt startup objects, headers) all live under
// the host's /usr on this distro's layout (confirmed against the actual
// deployed toolchain: `gcc -print-prog-name=cc1plus` etc. all resolve
// under /usr/libexec/gcc and /usr/lib/gcc), so bind-mounting just /usr is
// sufficient -- nothing from the app's own deployment directory, .env, or
// any other host path is ever exposed to the compiler. This is the fix
// for itouoj-critical-compiler-file-read: the compile step used to run
// directly on the host with the real filesystem visible, so a
// submission's #include could pull in and echo back any file the
// sandbox-server process (root) could read.
static void setup_compiler_rootfs(const char *rootfs_dir) {
  char dst[400];
  snprintf(dst, sizeof(dst), "%s/usr", rootfs_dir);
  bind_mount_ro("/usr", dst);

  char link[400];
  snprintf(link, sizeof(link), "%s/lib", rootfs_dir);
  if (symlink("usr/lib", link) == -1 && errno != EEXIST) {
    fprintf(stderr, "[server] symlink %s: %s\n", link, strerror(errno));
  }
  snprintf(link, sizeof(link), "%s/lib64", rootfs_dir);
  if (symlink("usr/lib64", link) == -1 && errno != EEXIST) {
    fprintf(stderr, "[server] symlink %s: %s\n", link, strerror(errno));
  }

  // gcc writes scratch files (assembler intermediate output etc.) to
  // $TMPDIR, defaulting to /tmp when unset -- this minimal rootfs has no
  // /tmp otherwise. World-writable (like a real /tmp): the in-jail
  // process runs as an unprivileged mapped uid that doesn't own this
  // root-created directory, so it needs the "other" write bit to use it
  // at all -- see the same reasoning on bin_dir below.
  //
  // mkdir()'s mode argument is masked by the caller's umask (sandbox-
  // server's systemd unit runs with the standard 0022, which silently
  // drops exactly the "other write" bit this needs) -- chmod() afterward
  // sets the exact bits requested, unaffected by umask. Learned this the
  // hard way: an interactive root shell's manual test of this same mkdir
  // call didn't reproduce the bug because the test script had its own
  // explicit chmod, masking the real gap until it hit the actual service.
  snprintf(dst, sizeof(dst), "%s/tmp", rootfs_dir);
  mkdir(dst, 01777);
  chmod(dst, 01777);
}

static void teardown_compiler_rootfs(const char *rootfs_dir) {
  char dst[400];
  snprintf(dst, sizeof(dst), "%s/usr", rootfs_dir);
  umount2(dst, MNT_DETACH);
}

// ---- HTTP layer ----

static enum MHD_Result send_text_response(struct MHD_Connection *conn,
                                           int status, const char *text) {
  struct MHD_Response *resp = MHD_create_response_from_buffer(
      strlen(text), (void *)text, MHD_RESPMEM_MUST_COPY);
  enum MHD_Result rc = MHD_queue_response(conn, status, resp);
  MHD_destroy_response(resp);
  return rc;
}

static enum MHD_Result send_json_response(struct MHD_Connection *conn,
                                           int status, cJSON *json) {
  char *text = cJSON_PrintUnformatted(json);
  struct MHD_Response *resp = MHD_create_response_from_buffer(
      strlen(text), text, MHD_RESPMEM_MUST_FREE);
  MHD_add_response_header(resp, "Content-Type", "application/json");
  enum MHD_Result rc = MHD_queue_response(conn, status, resp);
  MHD_destroy_response(resp);
  return rc;
}

static cJSON *build_phase_json(struct captured_output *o, int exit_code,
                                int term_signal, long memory_bytes,
                                double wall_time_ms) {
  cJSON *j = cJSON_CreateObject();
  cJSON_AddStringToObject(j, "stdout", o->stdout_buf ? o->stdout_buf : "");
  cJSON_AddStringToObject(j, "stderr", o->stderr_buf ? o->stderr_buf : "");

  size_t combined_len = o->stdout_len + o->stderr_len;
  char *combined = malloc(combined_len + 1);
  size_t p = 0;
  if (o->stdout_buf) {
    memcpy(combined + p, o->stdout_buf, o->stdout_len);
    p += o->stdout_len;
  }
  if (o->stderr_buf) {
    memcpy(combined + p, o->stderr_buf, o->stderr_len);
    p += o->stderr_len;
  }
  combined[p] = '\0';
  cJSON_AddStringToObject(j, "output", combined);
  free(combined);

  if (term_signal >= 0) {
    cJSON_AddItemToObject(j, "code", cJSON_CreateNull());
    cJSON_AddStringToObject(j, "signal", signal_name(term_signal));
  } else {
    cJSON_AddNumberToObject(j, "code", exit_code);
    cJSON_AddItemToObject(j, "signal", cJSON_CreateNull());
  }
  cJSON_AddNumberToObject(j, "memory", (double)memory_bytes);
  // M5 doesn't separate true CPU time from wall time (would need cgroup
  // cpu.stat's usage_usec) -- approximated as equal, a known simplification.
  cJSON_AddNumberToObject(j, "cpu_time", wall_time_ms);
  cJSON_AddNumberToObject(j, "wall_time", wall_time_ms);
  return j;
}

static enum MHD_Result process_execute(struct MHD_Connection *conn,
                                        const char *body, size_t body_len) {
  cJSON *req = cJSON_ParseWithLength(body, body_len);
  if (!req) {
    return send_text_response(conn, 400, "invalid json\n");
  }

  cJSON *j_language = cJSON_GetObjectItemCaseSensitive(req, "language");
  cJSON *j_files = cJSON_GetObjectItemCaseSensitive(req, "files");
  cJSON *j_stdin = cJSON_GetObjectItemCaseSensitive(req, "stdin");
  cJSON *j_run_timeout = cJSON_GetObjectItemCaseSensitive(req, "run_timeout");
  cJSON *j_run_mem = cJSON_GetObjectItemCaseSensitive(req, "run_memory_limit");
  cJSON *j_compile_timeout =
      cJSON_GetObjectItemCaseSensitive(req, "compile_timeout");
  // 選填：呼叫端快取住的上一次編譯結果（base64），同一筆 submission
  // 後續測資帶著這個欄位來就跳過重新編譯，直接拿這份執行檔去跑。
  cJSON *j_precompiled =
      cJSON_GetObjectItemCaseSensitive(req, "precompiled_binary");

  if (!cJSON_IsString(j_language) || !cJSON_IsArray(j_files) ||
      cJSON_GetArraySize(j_files) < 1) {
    cJSON_Delete(req);
    return send_text_response(conn, 400, "missing language/files\n");
  }

  const struct lang_info *lang = find_lang(j_language->valuestring);
  if (!lang) {
    cJSON_Delete(req);
    return send_text_response(
        conn, 400,
        "unsupported language (c, c++, python, javascript only so far)\n");
  }

  cJSON *file0 = cJSON_GetArrayItem(j_files, 0);
  cJSON *j_content = cJSON_GetObjectItemCaseSensitive(file0, "content");
  if (!cJSON_IsString(j_content)) {
    cJSON_Delete(req);
    return send_text_response(conn, 400, "missing files[0].content\n");
  }

  const char *stdin_data = cJSON_IsString(j_stdin) ? j_stdin->valuestring : "";
  size_t stdin_len = strlen(stdin_data);
  long run_timeout_ms =
      cJSON_IsNumber(j_run_timeout) ? (long)j_run_timeout->valuedouble : 5000;
  long run_mem_bytes = cJSON_IsNumber(j_run_mem)
                            ? (long)j_run_mem->valuedouble
                            : (256L * 1024 * 1024);
  long run_mem_mb = run_mem_bytes / (1024 * 1024);
  if (run_mem_mb < 4) run_mem_mb = 4;
  long compile_timeout_ms = cJSON_IsNumber(j_compile_timeout)
                                 ? (long)j_compile_timeout->valuedouble
                                 : 15000;

  int is_interpreted = lang->compiler == NULL;
  int has_precompiled = !is_interpreted && cJSON_IsString(j_precompiled) &&
                         j_precompiled->valuestring[0] != '\0';

  // --- per-request scratch workdir ---
  mkdir(WORK_ROOT, 0755);
  char workdir[256];
  snprintf(workdir, sizeof(workdir), "%s/%ld-%d", WORK_ROOT, (long)time(NULL),
           rand());
  mkdir(workdir, 0755);
  char rootfs_dir[300], bin_dir[320], src_path[400], bin_path[360];
  char work_dir_in_rootfs[340], interp_src_path[380];
  char script_path_in_rootfs[64], src_path_in_rootfs[64];
  snprintf(rootfs_dir, sizeof(rootfs_dir), "%s/rootfs", workdir);
  mkdir(rootfs_dir, 0755);

  char *run_program_argv[3]; // up to: interpreter, script -- or just binary
  int run_program_argc = 0;

  if (is_interpreted) {
    snprintf(work_dir_in_rootfs, sizeof(work_dir_in_rootfs), "%s/work",
             rootfs_dir);
    mkdir(work_dir_in_rootfs, 0755);
    snprintf(interp_src_path, sizeof(interp_src_path), "%s/%s",
             work_dir_in_rootfs, lang->filename);
    FILE *sf = fopen(interp_src_path, "w");
    if (sf) {
      fwrite(j_content->valuestring, 1, strlen(j_content->valuestring), sf);
      fclose(sf);
    }
    setup_interpreter_rootfs(rootfs_dir, lang->runtime_home);
    snprintf(script_path_in_rootfs, sizeof(script_path_in_rootfs),
             "/work/%s", lang->filename);
    run_program_argv[run_program_argc++] = (char *)lang->interpreter_path;
    run_program_argv[run_program_argc++] = script_path_in_rootfs;
  } else {
    // Written to /bin (world-writable -- see setup_compiler_rootfs's /tmp
    // comment for why, including the umask gotcha this chmod works
    // around) so the compile jail can write /bin/prog there; the run
    // phase later execve()s that same path under its own, separately-
    // jailed, fully read-only-locked view of this rootfs.
    snprintf(bin_dir, sizeof(bin_dir), "%s/bin", rootfs_dir);
    mkdir(bin_dir, 0777);
    chmod(bin_dir, 0777);
    // Source lives inside rootfs_dir (not the parent workdir) so the
    // compile jail's pivoted view can see it at /work/<filename> --
    // mirrors the interpreted branch above.
    snprintf(work_dir_in_rootfs, sizeof(work_dir_in_rootfs), "%s/work",
             rootfs_dir);
    mkdir(work_dir_in_rootfs, 0755);
    snprintf(src_path, sizeof(src_path), "%s/%s", work_dir_in_rootfs,
             lang->filename);
    snprintf(src_path_in_rootfs, sizeof(src_path_in_rootfs), "/work/%s",
             lang->filename);
    snprintf(bin_path, sizeof(bin_path), "%s/prog", bin_dir);
    FILE *sf = fopen(src_path, "w");
    if (sf) {
      fwrite(j_content->valuestring, 1, strlen(j_content->valuestring), sf);
      fclose(sf);
    }
    run_program_argv[run_program_argc++] = "/bin/prog";
  }

  cJSON *resp = cJSON_CreateObject();
  cJSON_AddStringToObject(resp, "language", j_language->valuestring);
  cJSON_AddStringToObject(resp, "version", "sandbox-runner-m7");

  int compile_failed = 0;
  if (is_interpreted) {
    // No compile phase for interpreted languages -- report a trivial
    // success so the response shape stays identical to Piston's.
    struct captured_output empty = {0};
    cJSON_AddItemToObject(resp, "compile",
                           build_phase_json(&empty, 0, -1, 0, 0));
  } else if (has_precompiled) {
    // compile-once: caller already has this exact submission compiled from
    // an earlier test case in the same judging pass and is handing the
    // binary straight back instead of source -- write it directly where
    // the freshly-compiled binary would have gone and skip invoking the
    // compiler entirely. Doesn't touch the run-phase sandboxing at all
    // (jail below runs /bin/prog exactly the same either way), so this
    // only changes how the binary gets into that path, not what's allowed
    // to happen once jail takes over.
    size_t decoded_len = 0;
    unsigned char *decoded =
        base64_decode(j_precompiled->valuestring, &decoded_len);
    struct captured_output empty = {0};
    if (decoded && decoded_len > 0) {
      FILE *bf = fopen(bin_path, "wb");
      if (bf) {
        fwrite(decoded, 1, decoded_len, bf);
        fclose(bf);
        chmod(bin_path, 0755);
      } else {
        compile_failed = 1;
      }
    } else {
      // Malformed cache value from the caller -- treat as a hard failure
      // rather than silently falling back to compiling from source, so a
      // bug on the caller's side surfaces immediately instead of masking
      // itself as "just a bit slower than expected".
      compile_failed = 1;
    }
    free(decoded);
    cJSON_AddItemToObject(
        resp, "compile",
        build_phase_json(&empty, compile_failed ? -1 : 0, -1, 0, 0));
  } else {
    // --- compile, jailed (fix for itouoj-critical-compiler-file-read) ---
    // Used to run directly on the host via run_child(); now goes through
    // the same `jail` binary the run phase uses below, pointed at this
    // request's own rootfs_dir with /usr bind-mounted read-only by
    // setup_compiler_rootfs. The compiler can now only ever see that
    // read-only toolchain plus this one request's own /work (source) and
    // /bin (output) -- no app deployment directory, .env, or other host
    // path is reachable, however a submission's #include is crafted.
    setup_compiler_rootfs(rootfs_dir);

    struct captured_output compile_out = {0};
    int compile_exit = 0, compile_sig = -1;
    char compile_mem_s[16], compile_to_s[16];
    snprintf(compile_mem_s, sizeof(compile_mem_s), "%d", COMPILE_MEM_MB);
    snprintf(compile_to_s, sizeof(compile_to_s), "%ld", compile_timeout_ms);

    char *compile_jail_argv[] = {JAIL_BIN,
                                  rootfs_dir,
                                  compile_mem_s,
                                  (char *)COMPILE_PIDS_MAX,
                                  compile_to_s,
                                  "compile",
                                  (char *)lang->compiler,
                                  "-O2",
                                  "-static",
                                  "-o",
                                  "/bin/prog",
                                  src_path_in_rootfs,
                                  NULL};
    // Outer timeout generous relative to compile_timeout_ms for the same
    // reason the run phase's is below -- jail enforces the real limit
    // itself via cgroup.kill.
    //
    // Known simplification: compile_exit/compile_sig below are now
    // jail's own exit status, not gcc's directly -- jail folds a signaled
    // or timed-out inner process into its own plain exit code (128+sig,
    // or 124 for timeout; see jail.c's main()), so a compiler crash shows
    // up here as e.g. code=139 rather than signal=SIGSEGV. Doesn't affect
    // compile_failed below (still correctly true either way) or any
    // caller (judge.ts/route.ts only ever check compile.code !== 0), just
    // the cosmetic shape of a failed compile's JSON.
    run_child(compile_jail_argv, NULL, 0, 1, compile_timeout_ms + 3000,
              &compile_out, &compile_exit, &compile_sig);
    cJSON_AddItemToObject(
        resp, "compile",
        build_phase_json(&compile_out, compile_exit, compile_sig, 0, 0));
    compile_failed = compile_sig >= 0 || compile_exit != 0;
    free_captured(&compile_out);
    teardown_compiler_rootfs(rootfs_dir);

    // 編譯成功就把執行檔位元組回傳給呼叫端快取，下一筆測資才能省掉
    // 重新編譯——只有「這次真的重新編譯」才回傳，呼叫端已經有的話
    // （帶 precompiled_binary 進來那些請求）沒必要再送一次。
    if (!compile_failed) {
      FILE *bf = fopen(bin_path, "rb");
      if (bf) {
        fseek(bf, 0, SEEK_END);
        long bin_size = ftell(bf);
        fseek(bf, 0, SEEK_SET);
        if (bin_size > 0) {
          unsigned char *bin_data = malloc((size_t)bin_size);
          if (bin_data && fread(bin_data, 1, (size_t)bin_size, bf) ==
                              (size_t)bin_size) {
            char *encoded = base64_encode(bin_data, (size_t)bin_size);
            if (encoded) {
              cJSON_AddStringToObject(resp, "compiled_binary", encoded);
              free(encoded);
            }
          }
          free(bin_data);
        }
        fclose(bf);
      }
    }
  }

  if (compile_failed) {
    struct captured_output empty = {0};
    cJSON_AddItemToObject(resp, "run", build_phase_json(&empty, -1, -1, 0, 0));
  } else {
    struct captured_output run_out = {0};
    int run_exit = 0, run_sig = -1;
    char mem_s[16], to_s[16];
    snprintf(mem_s, sizeof(mem_s), "%ld", run_mem_mb);
    snprintf(to_s, sizeof(to_s), "%ld", run_timeout_ms);

    char *jail_argv[10];
    int n = 0;
    jail_argv[n++] = JAIL_BIN;
    jail_argv[n++] = rootfs_dir;
    jail_argv[n++] = mem_s;
    jail_argv[n++] = (char *)DEFAULT_PIDS_MAX;
    jail_argv[n++] = to_s;
    jail_argv[n++] = (char *)lang->seccomp_profile;
    for (int i = 0; i < run_program_argc; i++) jail_argv[n++] = run_program_argv[i];
    jail_argv[n] = NULL;

    // Outer timeout is generous relative to run_timeout_ms -- jail enforces
    // the real limit itself via cgroup.kill; this is just a backstop in
    // case jail itself somehow wedges.
    run_child(jail_argv, stdin_data, stdin_len, 1, run_timeout_ms + 3000,
              &run_out, &run_exit, &run_sig);

    long wall_ms = parse_meta_long(run_out.meta_buf, "wall_time_ms=");
    long mem_peak = parse_meta_long(run_out.meta_buf, "memory_peak_bytes=");

    int run_code, run_signal;
    if (run_exit == 124) {
      // jail's own convention for "wall-clock timeout, killed via
      // cgroup.kill" -- matches Piston's SIGKILL-on-timeout shape so
      // judge.ts's existing runVerdict() needs no changes.
      run_code = -1;
      run_signal = SIGKILL;
    } else if (run_exit >= 128) {
      run_code = -1;
      run_signal = run_exit - 128;
    } else {
      run_code = run_exit;
      run_signal = -1;
    }

    cJSON_AddItemToObject(
        resp, "run",
        build_phase_json(&run_out, run_code, run_signal, mem_peak, (double)wall_ms));
    free_captured(&run_out);
  }

  if (is_interpreted) {
    teardown_interpreter_rootfs(rootfs_dir);
  }
  cJSON_Delete(req);
  cleanup_workdir(workdir);

  enum MHD_Result rc = send_json_response(conn, 200, resp);
  cJSON_Delete(resp);
  return rc;
}

struct conn_ctx {
  char *body;
  size_t body_len;
};

static enum MHD_Result handle_request(void *cls, struct MHD_Connection *conn,
                                       const char *url, const char *method,
                                       const char *version,
                                       const char *upload_data,
                                       size_t *upload_data_size,
                                       void **con_cls) {
  (void)cls;
  (void)version;

  if (strcmp(method, "POST") != 0) {
    return send_text_response(conn, 405, "method not allowed\n");
  }
  if (strcmp(url, "/api/v2/execute") != 0) {
    return send_text_response(conn, 404, "not found\n");
  }

  if (*con_cls == NULL) {
    struct conn_ctx *ctx = calloc(1, sizeof(*ctx));
    *con_cls = ctx;
    return MHD_YES;
  }

  struct conn_ctx *ctx = *con_cls;
  if (*upload_data_size > 0) {
    char *grown = realloc(ctx->body, ctx->body_len + *upload_data_size + 1);
    if (!grown) return MHD_NO;
    ctx->body = grown;
    memcpy(ctx->body + ctx->body_len, upload_data, *upload_data_size);
    ctx->body_len += *upload_data_size;
    ctx->body[ctx->body_len] = '\0';
    *upload_data_size = 0;
    return MHD_YES;
  }

  enum MHD_Result rc = process_execute(conn, ctx->body ? ctx->body : "",
                                        ctx->body_len);
  free(ctx->body);
  free(ctx);
  *con_cls = NULL;
  return rc;
}

static void request_completed(void *cls, struct MHD_Connection *conn,
                               void **con_cls,
                               enum MHD_RequestTerminationCode toe) {
  (void)cls;
  (void)conn;
  (void)toe;
  struct conn_ctx *ctx = *con_cls;
  if (ctx) {
    free(ctx->body);
    free(ctx);
    *con_cls = NULL;
  }
}

int main(void) {
  srand((unsigned)time(NULL) ^ (unsigned)getpid());

  // Bind loopback-only, matching Piston's own trust boundary today (nothing
  // routes here through nginx) -- MHD_start_daemon defaults to 0.0.0.0
  // unless a specific sockaddr is supplied via MHD_OPTION_SOCK_ADDR.
  struct sockaddr_in addr;
  memset(&addr, 0, sizeof(addr));
  addr.sin_family = AF_INET;
  addr.sin_port = htons(PORT);
  addr.sin_addr.s_addr = inet_addr("127.0.0.1");

  struct MHD_Daemon *daemon = MHD_start_daemon(
      MHD_USE_INTERNAL_POLLING_THREAD, PORT, NULL, NULL, &handle_request,
      NULL, MHD_OPTION_SOCK_ADDR, &addr, MHD_OPTION_NOTIFY_COMPLETED,
      &request_completed, NULL, MHD_OPTION_END);
  if (!daemon) {
    fprintf(stderr, "[sandbox-server] failed to start on port %d\n", PORT);
    return 1;
  }

  fprintf(stderr, "[sandbox-server] listening on 127.0.0.1:%d\n", PORT);
  pause(); // block forever; systemd/manual SIGTERM ends the process
  MHD_stop_daemon(daemon);
  return 0;
}
