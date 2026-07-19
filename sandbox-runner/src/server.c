// M5: HTTP service wrapping the already-built `jail` binary (M1-M4), with a
// JSON request/response shape matching Piston's /api/v2/execute -- so this
// can later be curl-diffed against Piston directly, and eventually swapped
// in for it in src/lib/piston.ts without changing judge.ts's call sites.
//
// Scope for M5: C and C++ only (mirrors what's already hardened through
// M4). Python/Java/JavaScript are M7's job.
//
// Known simplification, called out explicitly: compilation (gcc/g++) runs
// directly on the host, NOT through the namespace/cgroup/seccomp sandbox --
// only the compiled binary's RUN phase goes through `jail`. This mirrors
// the plan's "asymmetric strictness" reasoning (the compiler operates on
// attacker-controlled *source*, not attacker-controlled *machine code*),
// but sandboxing the compiler too is legitimate future hardening, not done
// here.
//
// Single-threaded by construction (MHD_USE_INTERNAL_POLLING_THREAD without
// thread-per-connection): one request judged at a time. This is a
// deliberate, simple concurrency guard -- see the plan's risk note about
// /api/run having none today.
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
#include <sys/stat.h>
#include <sys/wait.h>
#include <time.h>
#include <unistd.h>

#define PORT 8090
#define JAIL_BIN "./jail"
#define WORK_ROOT "./work"
#define DEFAULT_PIDS_MAX "32"

struct lang_info {
  const char *key;      // matches src/lib/languages.ts's `lang.piston` value
  const char *compiler;
  const char *filename; // source filename inside the workdir
};

static const struct lang_info LANGS[] = {
    {"c", "gcc", "main.c"},
    {"c++", "g++", "main.cpp"},
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

static void cleanup_workdir(const char *workdir) {
  char *argv[] = {"rm", "-rf", (char *)workdir, NULL};
  int exit_code, term_signal;
  struct captured_output discard = {0};
  run_child(argv, NULL, 0, 0, 5000, &discard, &exit_code, &term_signal);
  free_captured(&discard);
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

  if (!cJSON_IsString(j_language) || !cJSON_IsArray(j_files) ||
      cJSON_GetArraySize(j_files) < 1) {
    cJSON_Delete(req);
    return send_text_response(conn, 400, "missing language/files\n");
  }

  const struct lang_info *lang = find_lang(j_language->valuestring);
  if (!lang) {
    cJSON_Delete(req);
    return send_text_response(
        conn, 400, "unsupported language (M5 supports c, c++ only)\n");
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

  // --- per-request scratch workdir ---
  mkdir(WORK_ROOT, 0755);
  char workdir[256];
  snprintf(workdir, sizeof(workdir), "%s/%ld-%d", WORK_ROOT, (long)time(NULL),
           rand());
  mkdir(workdir, 0755);
  char rootfs_dir[300], bin_dir[320], src_path[340], bin_path[360];
  snprintf(rootfs_dir, sizeof(rootfs_dir), "%s/rootfs", workdir);
  snprintf(bin_dir, sizeof(bin_dir), "%s/bin", rootfs_dir);
  mkdir(rootfs_dir, 0755);
  mkdir(bin_dir, 0755);
  snprintf(src_path, sizeof(src_path), "%s/%s", workdir, lang->filename);
  snprintf(bin_path, sizeof(bin_path), "%s/prog", bin_dir);

  FILE *sf = fopen(src_path, "w");
  if (sf) {
    fwrite(j_content->valuestring, 1, strlen(j_content->valuestring), sf);
    fclose(sf);
  }

  // --- compile (host-side, not sandboxed -- see file header) ---
  struct captured_output compile_out = {0};
  int compile_exit = 0, compile_sig = -1;
  char *compile_argv[] = {(char *)lang->compiler, "-O2", "-static",
                           "-o",  bin_path,        src_path, NULL};
  run_child(compile_argv, NULL, 0, 0, compile_timeout_ms, &compile_out,
            &compile_exit, &compile_sig);

  cJSON *resp = cJSON_CreateObject();
  cJSON_AddStringToObject(resp, "language", j_language->valuestring);
  cJSON_AddStringToObject(resp, "version", "sandbox-runner-m5");
  cJSON_AddItemToObject(
      resp, "compile",
      build_phase_json(&compile_out, compile_exit, compile_sig, 0, 0));

  int compile_failed = compile_sig >= 0 || compile_exit != 0;

  if (compile_failed) {
    struct captured_output empty = {0};
    cJSON_AddItemToObject(resp, "run", build_phase_json(&empty, -1, -1, 0, 0));
  } else {
    struct captured_output run_out = {0};
    int run_exit = 0, run_sig = -1;
    char mem_s[16], to_s[16];
    snprintf(mem_s, sizeof(mem_s), "%ld", run_mem_mb);
    snprintf(to_s, sizeof(to_s), "%ld", run_timeout_ms);
    char *jail_argv[] = {JAIL_BIN,  rootfs_dir, mem_s, (char *)DEFAULT_PIDS_MAX,
                          to_s,      "/bin/prog", NULL};
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

  free_captured(&compile_out);
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
