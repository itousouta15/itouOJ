// M4 verification binary: attempts one specific sandbox-escape-flavored
// syscall, selected by argv[1], and reports whether it succeeded. Under
// the seccomp filter every one of these should kill the process outright
// (SIGSYS, default action SCMP_ACT_KILL_PROCESS) before the "succeeded"
// print can even run -- so seeing this program's own output at all after
// a given case, instead of the caller observing a bare signal death, is
// itself a finding.
#define _GNU_SOURCE
#include <errno.h>
#include <sched.h>
#include <stdio.h>
#include <string.h>
#include <sys/mount.h>
#include <sys/ptrace.h>
#include <sys/socket.h>
#include <unistd.h>

int main(int argc, char **argv) {
  if (argc < 2) {
    fprintf(stderr, "usage: %s <unshare|ptrace|socket|mount|shell>\n", argv[0]);
    return 2;
  }

  if (strcmp(argv[1], "unshare") == 0) {
    int rc = unshare(CLONE_NEWNS);
    printf("[escape] unshare(CLONE_NEWNS) returned %d (should not print)\n", rc);
  } else if (strcmp(argv[1], "ptrace") == 0) {
    long rc = ptrace(PTRACE_TRACEME, 0, NULL, NULL);
    printf("[escape] ptrace(PTRACE_TRACEME) returned %ld (should not print)\n", rc);
  } else if (strcmp(argv[1], "socket") == 0) {
    int rc = socket(AF_INET, SOCK_STREAM, 0);
    printf("[escape] socket(AF_INET) returned %d (should not print)\n", rc);
  } else if (strcmp(argv[1], "mount") == 0) {
    int rc = mount("none", "/", NULL, MS_REMOUNT, NULL);
    printf("[escape] mount() returned %d (should not print)\n", rc);
  } else if (strcmp(argv[1], "shell") == 0) {
    execl("/bin/sh", "/bin/sh", "-c", "echo pwned", (char *)NULL);
    printf("[escape] execl(/bin/sh) failed to even launch: %s (expected -- no "
           "shell in the run-phase rootfs)\n",
           strerror(errno));
  } else {
    fprintf(stderr, "unknown case: %s\n", argv[1]);
    return 2;
  }

  return 0;
}
