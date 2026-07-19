// M1: minimal namespace sandbox driver.
// Isolation only (PID/mount/UTS namespaces via a single clone() call +
// pivot_root into a caller-supplied rootfs). No cgroups, no seccomp, no
// user namespace yet -- those come in later milestones. Must be run as
// root (mount/pivot_root require privilege at this stage).
#define _GNU_SOURCE
#include <sched.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <errno.h>
#include <fcntl.h>
#include <sys/wait.h>
#include <sys/mount.h>
#include <sys/stat.h>
#include <sys/syscall.h>

#define STACK_SIZE (1024 * 1024)

struct child_args {
  const char *rootfs;
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

int main(int argc, char *argv[]) {
  if (argc < 3) {
    fprintf(stderr, "usage: %s <rootfs-dir> <program-path-in-rootfs> [args...]\n",
            argv[0]);
    return 2;
  }

  struct child_args cargs = {
      .rootfs = argv[1],
      .argv = &argv[2],
  };

  char *stack = malloc(STACK_SIZE);
  if (!stack) {
    perror("malloc");
    return 1;
  }
  char *stack_top = stack + STACK_SIZE;

  pid_t pid = clone(child_main, stack_top,
                     CLONE_NEWPID | CLONE_NEWNS | CLONE_NEWUTS | SIGCHLD,
                     &cargs);
  if (pid == -1) {
    perror("clone");
    free(stack);
    return 1;
  }

  int status;
  if (waitpid(pid, &status, 0) == -1) {
    perror("waitpid");
    free(stack);
    return 1;
  }
  free(stack);

  if (WIFEXITED(status)) {
    int code = WEXITSTATUS(status);
    fprintf(stderr, "[jail] child exited with code %d\n", code);
    return code;
  }
  if (WIFSIGNALED(status)) {
    int sig = WTERMSIG(status);
    fprintf(stderr, "[jail] child killed by signal %d\n", sig);
    return 128 + sig;
  }
  fprintf(stderr, "[jail] child ended in unknown state\n");
  return 1;
}
