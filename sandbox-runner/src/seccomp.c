// M4/M7: run-phase seccomp-bpf policies, one per language runtime, built
// from two sources each -- see sandbox-runner/harvest/ (C++) and
// sandbox-runner/harvest-py/ (Python):
//   1. A documented baseline of syscalls every glibc-based program needs
//      for process startup/teardown, memory management, and basic I/O.
//   2. An empirical pass: every real submission for that language in the
//      production DB was recompiled/rerun under `strace -f`, and every
//      syscall actually observed was folded into the baseline below.
#define _GNU_SOURCE
#include "seccomp.h"

#include <seccomp.h>
#include <stdio.h>
#include <string.h>
#include <sys/ioctl.h>

#define ALLOW(name)                                                    \
  do {                                                                  \
    if (seccomp_rule_add(ctx, SCMP_ACT_ALLOW, SCMP_SYS(name), 0) < 0) { \
      fprintf(stderr, "[seccomp] failed to allow " #name "\n");         \
      return -1;                                                        \
    }                                                                   \
  } while (0)

// Shared by every language: process startup/teardown, memory management,
// signals, basic I/O, thread/TLS primitives, and jail's own bootstrap
// execve() of the submission (see the M4 note on why execve is safe to
// allow here -- it's a mount-namespace/rootfs concern, not a seccomp one).
static int add_common_rules(scmp_filter_ctx ctx) {
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
  // judged submission needs to change its own identity (see caps.c).
  ALLOW(getdents64);
  ALLOW(uname);
  ALLOW(execve);

  // ioctl is needed for isatty()-style stdio buffering checks (TCGETS),
  // and nothing else -- restrict by argument instead of blanket-allowing
  // every ioctl request code.
  if (seccomp_rule_add(ctx, SCMP_ACT_ALLOW, SCMP_SYS(ioctl), 1,
                        SCMP_A1(SCMP_CMP_EQ, TCGETS)) < 0) {
    fprintf(stderr, "[seccomp] failed to allow ioctl(TCGETS)\n");
    return -1;
  }
  return 0;
}

// M4: statically-linked C/C++ binaries. Materially narrower than the
// python profile below -- no dynamic import machinery, no interpreter.
static int add_native_rules(scmp_filter_ctx ctx) {
  (void)ctx;
  return 0; // common baseline already covers everything M4's corpus needed
}

// M7: CPython 3.12 interpreter. Broader than native -- module import
// machinery walks sys.path doing access()/stat() on many candidate paths
// (most ENOENT), reads bytecode via pread64, resolves argv0/cwd, etc.
static int add_python_rules(scmp_filter_ctx ctx) {
  ALLOW(access);
  ALLOW(stat);
  ALLOW(newfstatat);
  ALLOW(fcntl);
  ALLOW(getcwd);
  ALLOW(pread64);
  ALLOW(readlink);
  // Only shows up with large inputs (found via a real ~590KB stdin test
  // case, not the small hand-run samples): CPython's buffer/object growth
  // resizes an existing mapping via mremap() instead of a fresh mmap once
  // it's big enough. Small-input testing alone would have missed this --
  // exactly why the harvest corpus needs to include realistic input sizes,
  // not just "does it run at all."
  ALLOW(mremap);
  // CPython sets close-on-exec on file descriptors it opens (module
  // search, stdio wrapping) via ioctl(fd, FIOCLEX) as an alternative to
  // fcntl(F_SETFD) -- same argument-filtering approach as TCGETS in the
  // common rules, not a blanket ioctl allow.
  if (seccomp_rule_add(ctx, SCMP_ACT_ALLOW, SCMP_SYS(ioctl), 1,
                        SCMP_A1(SCMP_CMP_EQ, FIOCLEX)) < 0) {
    fprintf(stderr, "[seccomp] failed to allow ioctl(FIOCLEX)\n");
    return -1;
  }
  // Deliberately NOT allowed: clone/clone3/fork -- none of the 8 harvested
  // real Python submissions used threading or multiprocessing. This means
  // `threading`/`multiprocessing` will not work under this profile; not
  // needed for competitive-programming-style submissions, and tightening
  // this is straightforward later if a real use case needs it.
  return 0;
}

int seccomp_install_run_filter(const char *profile) {
  scmp_filter_ctx ctx = seccomp_init(SCMP_ACT_KILL_PROCESS);
  if (!ctx) {
    fprintf(stderr, "[seccomp] seccomp_init failed\n");
    return -1;
  }

  int rc = add_common_rules(ctx);
  if (rc == 0) {
    if (strcmp(profile, "python") == 0) {
      rc = add_python_rules(ctx);
    } else if (strcmp(profile, "native") == 0) {
      rc = add_native_rules(ctx);
    } else {
      fprintf(stderr, "[seccomp] unknown profile: %s\n", profile);
      rc = -1;
    }
  }

  if (rc == 0 && seccomp_load(ctx) < 0) {
    fprintf(stderr, "[seccomp] seccomp_load failed\n");
    rc = -1;
  }

  seccomp_release(ctx);
  return rc;
}
