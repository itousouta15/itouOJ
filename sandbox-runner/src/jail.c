// M3: adds a user namespace + uid/gid mapping + full capability drop on top
// of M1 (PID/mount/UTS namespaces, pivot_root) and M2 (cgroup v2 limits,
// wall-clock timeout). Still no seccomp -- that's M4.
//
// Note on why this matters even though the runner is already host root:
// root is only needed for the brief bootstrap (mount/pivot_root/cgroup
// setup). The untrusted submission itself must never hold any of that
// privilege, even transiently -- it runs as an unprivileged uid inside its
// own user namespace, with an empty capability set, after everything
// privileged is already done. Must still be run as root (creating the
// initial namespaces and writing the cgroup files requires it).
#define _GNU_SOURCE
#include <sched.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <errno.h>
#include <fcntl.h>
#include <time.h>
#include <sys/prctl.h>
#include <sys/wait.h>
#include <sys/mount.h>
#include <sys/stat.h>
#include <sys/syscall.h>

#include "caps.h"
#include "cgroup.h"
#include "seccomp.h"

#define STACK_SIZE (1024 * 1024)
#define POLL_INTERVAL_US 5000 // 5ms -- see NOTE in wait_with_timeout()

// In-namespace identity the submission actually runs as, once dropped from
// ns-root. Must fall inside the uid_map/gid_map range written below.
#define SANDBOX_UID 1000
#define SANDBOX_GID 1000

// Host uid/gid range that ns-uids 0..65535 map onto. Picked far away from
// any real host account (oj=995, system users are all <1000).
#define HOST_ID_BASE 200000
#define HOST_ID_RANGE 65536

struct child_args {
  const char *rootfs;
  const char *cgroup_path;
  const char *seccomp_profile;
  int sync_read_fd;
  char *const *argv;
};

static int write_file(const char *path, const char *content) {
  int fd = open(path, O_WRONLY | O_TRUNC);
  if (fd == -1) {
    fprintf(stderr, "[jail] open %s: %s\n", path, strerror(errno));
    return -1;
  }
  size_t len = strlen(content);
  ssize_t n = write(fd, content, len);
  close(fd);
  if (n != (ssize_t)len) {
    fprintf(stderr, "[jail] write %s: %s\n", path, strerror(errno));
    return -1;
  }
  return 0;
}

static int pivot_into_rootfs(const char *rootfs) {
  // Detach from the host's mount propagation tree before touching anything,
  // otherwise later mounts/unmounts here would propagate back to the host.
  if (mount(NULL, "/", NULL, MS_REC | MS_PRIVATE, NULL) == -1) {
    perror("mount MS_PRIVATE /");
    return -1;
  }

  // pivot_root requires the new root to be a mount point distinct from its
  // parent, so bind-mount rootfs onto itself first. Stays writable for now
  // -- pivot_root still needs to create/remove the .old_root staging dir
  // inside it; read-only gets applied at the very end, once we're done
  // setting up and right before untrusted code runs.
  if (mount(rootfs, rootfs, NULL, MS_BIND | MS_REC, NULL) == -1) {
    perror("bind mount rootfs");
    return -1;
  }

  if (chdir(rootfs) == -1) {
    perror("chdir rootfs");
    return -1;
  }

  if (mkdir(".old_root", 0700) == -1 && errno != EEXIST) {
    perror("mkdir .old_root");
    return -1;
  }

  // glibc doesn't wrap pivot_root(2); go through syscall() directly.
  if (syscall(SYS_pivot_root, ".", ".old_root") == -1) {
    perror("pivot_root");
    return -1;
  }

  if (chdir("/") == -1) {
    perror("chdir /");
    return -1;
  }

  // Fresh /proc for this PID namespace -- must be mounted from inside the
  // new PID namespace to reflect it, not bind-mounted from the host.
  if (mkdir("/proc", 0555) == -1 && errno != EEXIST) {
    perror("mkdir /proc");
    return -1;
  }
  if (mount("proc", "/proc", "proc", 0, NULL) == -1) {
    perror("mount proc");
    return -1;
  }

  if (umount2("/.old_root", MNT_DETACH) == -1) {
    perror("umount2 .old_root");
    return -1;
  }
  if (rmdir("/.old_root") == -1) {
    perror("rmdir .old_root");
    return -1;
  }

  // Everything above needed the rootfs writable (staging/removing
  // .old_root). Lock it down now, right before the untrusted program runs.
  // A plain MS_BIND mount ignores MS_RDONLY, so making it stick needs a
  // second MS_REMOUNT pass -- a well-known bind-mount gotcha.
  if (mount(NULL, "/", NULL, MS_BIND | MS_REMOUNT | MS_RDONLY | MS_REC,
            NULL) == -1) {
    perror("remount / read-only");
    return -1;
  }

  return 0;
}

static int child_main(void *arg) {
  struct child_args *a = (struct child_args *)arg;

  // Block until the parent has written uid_map/gid_map for us -- until
  // then, our identity inside this new user namespace isn't established
  // yet and none of the steps below can be trusted to behave correctly.
  char sync_byte;
  if (read(a->sync_read_fd, &sync_byte, 1) != 1) {
    fprintf(stderr, "[jail] child: sync pipe read failed\n");
    _exit(125);
  }
  close(a->sync_read_fd);

  // Join the cgroup next, before anything else runs, so there's no window
  // where this process executes unaccounted.
  if (cg_join_self(a->cgroup_path) == -1) {
    _exit(126);
  }

  if (sethostname("jail", 4) == -1) {
    perror("sethostname");
  }

  // Mount/pivot_root work needs CAP_SYS_ADMIN, which we still hold as
  // ns-root at this point -- must happen BEFORE dropping to an unprivileged
  // uid below, since setuid() away from 0 clears the effective capability
  // set immediately.
  if (pivot_into_rootfs(a->rootfs) == -1) {
    _exit(127);
  }

  // Drop from ns-root to an unprivileged in-namespace uid/gid. Group first,
  // then user -- the reverse order can leave us unable to change gid.
  if (setgid(SANDBOX_GID) == -1) {
    perror("setgid");
    _exit(125);
  }
  if (setuid(SANDBOX_UID) == -1) {
    perror("setuid");
    _exit(125);
  }

  // Now strip every remaining capability and block regaining any via
  // execve of a setuid/setcap binary.
  if (caps_drop_all() == -1) {
    _exit(125);
  }
  if (prctl(PR_SET_NO_NEW_PRIVS, 1, 0, 0, 0) == -1) {
    perror("prctl PR_SET_NO_NEW_PRIVS");
    _exit(125);
  }

  // Last line of defense, installed immediately before exec: from this
  // point on, any syscall not on the allowlist kills the process outright.
  if (seccomp_install_run_filter(a->seccomp_profile) == -1) {
    _exit(125);
  }

  char *envp[] = {"PATH=/bin:/usr/bin", "HOME=/", NULL};
  execve(a->argv[0], a->argv, envp);
  perror("execve");
  _exit(127);
}

static long elapsed_ms(const struct timespec *start) {
  struct timespec now;
  clock_gettime(CLOCK_MONOTONIC, &now);
  return (now.tv_sec - start->tv_sec) * 1000 +
         (now.tv_nsec - start->tv_nsec) / 1000000;
}

// Polls the child with WNOHANG until it exits or the wall-clock timeout is
// hit. On timeout, kills the whole cgroup atomically via cgroup.kill (safe
// against the child having forked -- no need to enumerate descendants).
//
// NOTE: this is a plain poll loop (5ms granularity), not a timerfd/signalfd
// wait -- simplest thing that works for the demo. Tightening this to
// sub-ms precision with timerfd is M9 hardening material, not required for
// correctness here.
static int wait_with_timeout(pid_t pid, const char *cgroup_path,
                              long timeout_ms, int *out_status,
                              int *out_timed_out, long *out_elapsed_ms) {
  struct timespec start;
  clock_gettime(CLOCK_MONOTONIC, &start);
  *out_timed_out = 0;

  for (;;) {
    pid_t wp = waitpid(pid, out_status, WNOHANG);
    if (wp == pid) {
      *out_elapsed_ms = elapsed_ms(&start);
      return 0;
    }
    if (wp == -1) {
      perror("waitpid");
      return -1;
    }

    if (elapsed_ms(&start) >= timeout_ms) {
      *out_timed_out = 1;
      cg_kill(cgroup_path);
      if (waitpid(pid, out_status, 0) == -1) {
        perror("waitpid after cgroup.kill");
        return -1;
      }
      *out_elapsed_ms = elapsed_ms(&start);
      return 0;
    }

    usleep(POLL_INTERVAL_US);
  }
}

static int write_id_map(pid_t pid, const char *map_name) {
  char path[64];
  snprintf(path, sizeof(path), "/proc/%d/%s", pid, map_name);
  char value[64];
  snprintf(value, sizeof(value), "0 %d %d", HOST_ID_BASE, HOST_ID_RANGE);
  return write_file(path, value);
}

int main(int argc, char *argv[]) {
  if (argc < 7) {
    fprintf(stderr,
            "usage: %s <rootfs-dir> <mem-limit-mb> <pids-max> <timeout-ms> "
            "<seccomp-profile> <program-path-in-rootfs> [args...]\n",
            argv[0]);
    return 2;
  }

  const char *rootfs = argv[1];
  long mem_limit_bytes = atol(argv[2]) * 1024 * 1024;
  long pids_max = atol(argv[3]);
  long timeout_ms = atol(argv[4]);
  const char *seccomp_profile = argv[5];

  if (cg_ensure_parent() == -1) {
    return 1;
  }

  char cgroup_path[CGROUP_PATH_MAX];
  if (cg_create_run(cgroup_path, sizeof(cgroup_path), mem_limit_bytes,
                     pids_max) == -1) {
    return 1;
  }

  int sync_pipe[2];
  if (pipe(sync_pipe) == -1) {
    perror("pipe");
    cg_destroy(cgroup_path);
    return 1;
  }

  struct child_args cargs = {
      .rootfs = rootfs,
      .cgroup_path = cgroup_path,
      .seccomp_profile = seccomp_profile,
      .sync_read_fd = sync_pipe[0],
      .argv = &argv[6],
  };

  char *stack = malloc(STACK_SIZE);
  if (!stack) {
    perror("malloc");
    cg_destroy(cgroup_path);
    return 1;
  }
  char *stack_top = stack + STACK_SIZE;

  pid_t pid = clone(child_main, stack_top,
                     CLONE_NEWUSER | CLONE_NEWPID | CLONE_NEWNS |
                         CLONE_NEWUTS | SIGCHLD,
                     &cargs);
  if (pid == -1) {
    perror("clone");
    free(stack);
    cg_destroy(cgroup_path);
    return 1;
  }
  close(sync_pipe[0]); // parent doesn't read from it

  // Deny setgroups before writing gid_map -- required by the kernel for an
  // unprivileged gid_map write, harmless (and good hygiene) since we're
  // privileged here anyway.
  char setgroups_path[64];
  snprintf(setgroups_path, sizeof(setgroups_path), "/proc/%d/setgroups", pid);
  write_file(setgroups_path, "deny");

  if (write_id_map(pid, "uid_map") == -1 || write_id_map(pid, "gid_map") == -1) {
    fprintf(stderr, "[jail] failed to establish uid/gid map for child\n");
    close(sync_pipe[1]);
    free(stack);
    cg_kill(cgroup_path);
    waitpid(pid, NULL, 0);
    cg_destroy(cgroup_path);
    return 1;
  }

  // Unblock the child now that its namespace identity is established.
  char sync_byte = 'x';
  if (write(sync_pipe[1], &sync_byte, 1) != 1) {
    perror("[jail] write sync pipe");
  }
  close(sync_pipe[1]);

  int status = 0, timed_out = 0;
  long wall_ms = 0;
  int rc = wait_with_timeout(pid, cgroup_path, timeout_ms, &status,
                              &timed_out, &wall_ms);
  free(stack);
  if (rc == -1) {
    cg_destroy(cgroup_path);
    return 1;
  }

  long mem_peak = cg_read_memory_peak(cgroup_path);
  cg_destroy(cgroup_path);

  // When jail is spawned by sandbox-server (M5), fd 3 is an inherited pipe
  // dedicated to structured results -- fd 2 is left completely clean as a
  // passthrough for the SUBMISSION's own stderr (the child inherited it
  // directly via execve, so anything we print to fd 2 here would otherwise
  // land mixed into the submission's captured stderr). Falls back to a
  // human-readable stderr summary for plain CLI/manual use, where fd 3 was
  // never opened by the caller.
  int have_meta_fd = (fcntl(3, F_GETFD) != -1);
  if (have_meta_fd) {
    dprintf(3, "wall_time_ms=%ld\nmemory_peak_bytes=%ld\ntimed_out=%d\n",
            wall_ms, mem_peak, timed_out);
  } else {
    fprintf(stderr, "[jail] wall_time_ms=%ld memory_peak_bytes=%ld\n",
            wall_ms, mem_peak);
  }

  if (timed_out) {
    if (!have_meta_fd) {
      fprintf(stderr, "[jail] TIMEOUT: killed via cgroup.kill after %ldms\n",
              timeout_ms);
    }
    return 124; // conventional timeout exit code
  }
  if (WIFEXITED(status)) {
    int code = WEXITSTATUS(status);
    if (!have_meta_fd) {
      fprintf(stderr, "[jail] child exited with code %d\n", code);
    }
    return code;
  }
  if (WIFSIGNALED(status)) {
    int sig = WTERMSIG(status);
    if (!have_meta_fd) {
      // A SIGKILL that wasn't our own timeout kill, before the timeout
      // elapsed, is the cgroup memory controller's OOM kill.
      if (sig == SIGKILL) {
        fprintf(stderr,
                "[jail] child killed by signal SIGKILL (likely cgroup OOM)\n");
      } else {
        fprintf(stderr, "[jail] child killed by signal %d\n", sig);
      }
    }
    return 128 + sig;
  }
  if (!have_meta_fd) {
    fprintf(stderr, "[jail] child ended in unknown state\n");
  }
  return 1;
}
