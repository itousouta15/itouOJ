// M4: run-phase seccomp-bpf policy for C/C++ submissions, built from two
// sources -- see sandbox-runner/harvest/:
//   1. A documented baseline of syscalls every dynamically-or-statically
//      linked glibc/libstdc++ program needs for process startup/teardown,
//      memory management, and basic I/O.
//   2. An empirical pass: every AC C++ submission in the production DB
//      (18 of them) was recompiled and run under `strace -f`, and every
//      syscall actually observed was folded into the baseline below.
//      (`ioctl`, `readlinkat`, and `rseq` were not anticipated up front and
//      only turned up this way -- glibc's stdio isatty() check, /proc/self
//      resolution, and restartable-sequence TLS setup respectively.)
#define _GNU_SOURCE
#include "seccomp.h"

#include <seccomp.h>
#include <stdio.h>
#include <sys/ioctl.h>

#define ALLOW(name)                                                    \
  do {                                                                  \
    if (seccomp_rule_add(ctx, SCMP_ACT_ALLOW, SCMP_SYS(name), 0) < 0) { \
      fprintf(stderr, "[seccomp] failed to allow " #name "\n");         \
      goto fail;                                                        \
    }                                                                   \
  } while (0)

int seccomp_install_run_filter(void) {
  scmp_filter_ctx ctx = seccomp_init(SCMP_ACT_KILL_PROCESS);
  if (!ctx) {
    fprintf(stderr, "[seccomp] seccomp_init failed\n");
    return -1;
  }

  // Process startup/teardown, memory management, signals, basic I/O.
  ALLOW(read);
  ALLOW(write);
  ALLOW(close);
  ALLOW(fstat);
  ALLOW(lseek);
  ALLOW(mmap);
  ALLOW(mprotect);
  ALLOW(munmap);
  ALLOW(brk);
  ALLOW(rt_sigaction);
  ALLOW(rt_sigprocmask);
  ALLOW(rt_sigreturn);
  ALLOW(sigaltstack);
  ALLOW(openat);
  ALLOW(exit);
  ALLOW(exit_group);
  ALLOW(arch_prctl);
  ALLOW(set_tid_address);
  ALLOW(set_robust_list);
  ALLOW(prlimit64);
  ALLOW(getrandom);
  ALLOW(clock_gettime);
  ALLOW(clock_nanosleep);
  ALLOW(futex);
  ALLOW(rseq);
  ALLOW(readlinkat);
  ALLOW(madvise);
  ALLOW(getpid);
  ALLOW(gettid);
  ALLOW(tgkill);
  ALLOW(getuid);
  ALLOW(geteuid);
  ALLOW(getgid);
  ALLOW(getegid);
  // Deliberately NOT allowed: setuid/setgid/setresuid/... -- no legitimate
  // judged submission needs to change its own identity, and by the time a
  // submission runs it's already unprivileged (capabilities dropped, see
  // caps.c) so these calls could only ever be an attempted no-op or an
  // attack; seccomp kills the process outright rather than letting it even
  // observe an EPERM.

  // Not seen in the AC corpus itself, but needed by test/probe.c (this
  // repo's own verification tooling, which enumerates /proc and reads
  // uname() to prove namespace isolation) -- harmless to allow generally.
  ALLOW(getdents64);
  ALLOW(uname);

  // Needed for jail's OWN bootstrap exec of the submission binary -- this
  // filter is installed and then immediately execve()'d over. NOT a hole
  // for spawning a shell afterwards: seccomp can only see raw syscall
  // arguments (integers/pointers), never the string content a pointer
  // refers to, so it structurally cannot tell "our bootstrap execve" apart
  // from "the submission execve'ing /bin/sh" by argument filtering. That
  // access control has to -- and does -- live one layer down, in the mount
  // namespace: the run-phase rootfs simply contains no shell/interpreter
  // for such an execve to target (see test/escape.c). The two layers are
  // complementary, not redundant.
  ALLOW(execve);

  // ioctl is needed for isatty()-style stdio buffering checks (TCGETS),
  // and nothing else -- restrict by argument instead of blanket-allowing
  // every ioctl request code (e.g. TIOCSTI, which can inject terminal
  // input, or the various block/char-device ioctls).
  if (seccomp_rule_add(ctx, SCMP_ACT_ALLOW, SCMP_SYS(ioctl), 1,
                        SCMP_A1(SCMP_CMP_EQ, TCGETS)) < 0) {
    fprintf(stderr, "[seccomp] failed to allow ioctl(TCGETS)\n");
    goto fail;
  }

  if (seccomp_load(ctx) < 0) {
    fprintf(stderr, "[seccomp] seccomp_load failed\n");
    goto fail;
  }

  seccomp_release(ctx);
  return 0;

fail:
  seccomp_release(ctx);
  return -1;
}
