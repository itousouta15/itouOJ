// M2: namespace isolation (M1) + cgroup v2 resource limits and wall-clock
// timeout. Still one language, still no seccomp -- those come later.
// Must be run as root (mount/pivot_root/cgroup setup require privilege at
// this stage; user namespace + capability drop land in M3).
#define _GNU_SOURCE
#include <sched.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <errno.h>
#include <fcntl.h>
#include <time.h>
#include <sys/wait.h>
#include <sys/mount.h>
#include <sys/stat.h>
#include <sys/syscall.h>

#include "cgroup.h"

#define STACK_SIZE (1024 * 1024)
#define POLL_INTERVAL_US 5000 // 5ms -- see NOTE in wait_with_timeout()

struct child_args {
  const char *rootfs;
  const char *cgroup_path;
  char *const *argv;
};

static int pivot_into_rootfs(const char *rootfs) {
  // Detach from the host's mount propagation tree before touching anything,
  // otherwise later mounts/unmounts here would propagate back to the host.
  if (mount(NULL, "/", NULL, MS_REC | MS_PRIVATE, NULL) == -1) {
    perror("mount MS_PRIVATE /");
    return -1;
  }

  // pivot_root requires the new root to be a mount point distinct from its
  // parent, so bind-mount rootfs onto itself first.
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

  return 0;
}

static int child_main(void *arg) {
  struct child_args *a = (struct child_args *)arg;

  // Join the cgroup as the very first action, before anything else runs,
  // so there's no window where this process executes unaccounted.
  if (cg_join_self(a->cgroup_path) == -1) {
    _exit(126);
  }

  if (sethostname("jail", 4) == -1) {
    perror("sethostname");
  }

  if (pivot_into_rootfs(a->rootfs) == -1) {
    _exit(127);
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
// wait -- simplest thing that works for M2's demo. Tightening this to
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

int main(int argc, char *argv[]) {
  if (argc < 6) {
    fprintf(stderr,
            "usage: %s <rootfs-dir> <mem-limit-mb> <pids-max> <timeout-ms> "
            "<program-path-in-rootfs> [args...]\n",
            argv[0]);
    return 2;
  }

  const char *rootfs = argv[1];
  long mem_limit_bytes = atol(argv[2]) * 1024 * 1024;
  long pids_max = atol(argv[3]);
  long timeout_ms = atol(argv[4]);

  if (cg_ensure_parent() == -1) {
    return 1;
  }

  char cgroup_path[CGROUP_PATH_MAX];
  if (cg_create_run(cgroup_path, sizeof(cgroup_path), mem_limit_bytes,
                     pids_max) == -1) {
    return 1;
  }

  struct child_args cargs = {
      .rootfs = rootfs,
      .cgroup_path = cgroup_path,
      .argv = &argv[5],
  };

  char *stack = malloc(STACK_SIZE);
  if (!stack) {
    perror("malloc");
    cg_destroy(cgroup_path);
    return 1;
  }
  char *stack_top = stack + STACK_SIZE;

  pid_t pid = clone(child_main, stack_top,
                     CLONE_NEWPID | CLONE_NEWNS | CLONE_NEWUTS | SIGCHLD,
                     &cargs);
  if (pid == -1) {
    perror("clone");
    free(stack);
    cg_destroy(cgroup_path);
    return 1;
  }

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

  fprintf(stderr, "[jail] wall_time_ms=%ld memory_peak_bytes=%ld\n", wall_ms,
          mem_peak);

  if (timed_out) {
    fprintf(stderr, "[jail] TIMEOUT: killed via cgroup.kill after %ldms\n",
            timeout_ms);
    return 124; // conventional timeout exit code
  }
  if (WIFEXITED(status)) {
    int code = WEXITSTATUS(status);
    fprintf(stderr, "[jail] child exited with code %d\n", code);
    return code;
  }
  if (WIFSIGNALED(status)) {
    int sig = WTERMSIG(status);
    // A SIGKILL that wasn't our own timeout kill, before the timeout
    // elapsed, is the cgroup memory controller's OOM kill.
    if (sig == SIGKILL) {
      fprintf(stderr, "[jail] child killed by signal SIGKILL (likely cgroup OOM)\n");
    } else {
      fprintf(stderr, "[jail] child killed by signal %d\n", sig);
    }
    return 128 + sig;
  }
  fprintf(stderr, "[jail] child ended in unknown state\n");
  return 1;
}
