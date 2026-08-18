// M4/M7: run-phase seccomp-bpf policies, one per language runtime, built
// from two sources each -- see sandbox-runner/harvest/ (C++),
// sandbox-runner/harvest-py/ (Python), sandbox-runner/harvest-js/ (Node,
// synthetic samples -- no real submissions existed yet to harvest from):
//   1. A documented baseline of syscalls every glibc-based program needs
//      for process startup/teardown, memory management, and basic I/O.
//   2. An empirical pass: every real (or, for Node, representative
//      synthetic) submission for that language was run under `strace -f`
//      -- including at least one large-input case, since small hello-world
//      samples alone miss things like mremap-based buffer growth -- and
//      every syscall actually observed was folded into the baseline below.
#define _GNU_SOURCE
#include "seccomp.h"

#include <seccomp.h>
#include <stddef.h>
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
// Also includes syscalls that turned out to be needed by every interpreted
// runtime tried so far (Python and Node both independently needed
// access/fcntl/getcwd/pread64/readlink), even though native C/C++ doesn't
// use them -- promoted here once two unrelated runtimes converged on them.
static int add_common_rules(scmp_filter_ctx ctx) {
  ALLOW(read);
  ALLOW(write);
  ALLOW(close);
  ALLOW(fstat);
  ALLOW(lseek);
  ALLOW(mmap);
  ALLOW(mprotect);
  ALLOW(munmap);
  ALLOW(mremap);
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
  ALLOW(access);
  ALLOW(fcntl);
  ALLOW(getcwd);
  ALLOW(pread64);
  ALLOW(readlink);
  ALLOW(newfstatat); // needed by both Python and Node independently

  // ioctl is needed for isatty()-style stdio buffering checks (TCGETS),
  // CPython's close-on-exec setup (FIOCLEX), and libuv making stdout/
  // stderr non-blocking (FIONBIO) -- restrict by argument instead of
  // blanket-allowing every ioctl request code (e.g. TIOCSTI, which can
  // inject terminal input).
  int ioctl_cmds[] = {TCGETS, FIOCLEX, FIONBIO};
  for (size_t i = 0; i < sizeof(ioctl_cmds) / sizeof(ioctl_cmds[0]); i++) {
    if (seccomp_rule_add(ctx, SCMP_ACT_ALLOW, SCMP_SYS(ioctl), 1,
                          SCMP_A1(SCMP_CMP_EQ, ioctl_cmds[i])) < 0) {
      fprintf(stderr, "[seccomp] failed to allow ioctl(%d)\n", ioctl_cmds[i]);
      return -1;
    }
  }
  return 0;
}

// M4: statically-linked C/C++ binaries. Materially narrower than the
// interpreted-language profiles below -- no dynamic import machinery, no
// interpreter/VM, no thread pool.
static int add_native_rules(scmp_filter_ctx ctx) {
  (void)ctx;
  return 0; // common baseline already covers everything M4's corpus needed
}

// M7: CPython 3.12 interpreter. Module import machinery walks sys.path
// doing access()/stat() on many candidate paths (most ENOENT), reads
// bytecode via pread64, resolves argv0/cwd, etc.
static int add_python_rules(scmp_filter_ctx ctx) {
  ALLOW(stat);
  // Deliberately NOT allowed: clone/clone3/fork -- none of the 8 harvested
  // real Python submissions used threading or multiprocessing. This means
  // `threading`/`multiprocessing` will not work under this profile; not
  // needed for competitive-programming-style submissions, and tightening
  // this is straightforward later if a real use case needs it.
  return 0;
}

// M7: Node 20 / V8. The heaviest profile so far -- V8 runs background
// JIT-compiler and GC threads, and libuv keeps its own worker thread pool
// for fs/dns/etc, so (unlike Python) this genuinely needs clone3. That
// means, for Node specifically, fork-bomb containment relies entirely on
// cgroup pids.max (M2) rather than seccomp denying process creation
// outright -- seccomp can't reliably distinguish "spawn a thread" from
// "spawn a process" by clone3's flags argument without fragile
// libc-version-specific filtering, so this doesn't try to.
static int add_node_rules(scmp_filter_ctx ctx) {
  ALLOW(clone3);
  ALLOW(epoll_create1);
  ALLOW(epoll_ctl);
  ALLOW(epoll_pwait);
  ALLOW(eventfd2);
  ALLOW(pipe2);
  ALLOW(pkey_alloc); // V8 memory-protects its JIT code pages
  ALLOW(capget);      // libuv/V8 startup probes the process's own capabilities
  ALLOW(sched_getaffinity); // libuv sizes its thread pool off this
  ALLOW(statx);
  return 0;
}

// Compile-phase policy: gcc/g++ launch a multi-process toolchain (cc1/
// cc1plus, as, collect2/ld) with a syscall surface far broader than any of
// the harvested run-phase profiles above -- fork/exec chains, scratch-file
// I/O under /work, /bin, /tmp, etc. Building a tight allowlist the same
// way those profiles were built (strace-harvest real submissions, see the
// file header) isn't done yet -- no Linux box was available to harvest
// against when this was written (see the vulnerability report this
// responds to: itouoj-critical-compiler-file-read). Until that harvest
// happens, this profile inverts the model: default ALLOW, with an
// explicit kill-list of syscalls that have no legitimate use during
// compilation and still matter even after the mount namespace (see
// jail.c's pivot_into_rootfs compile_mode path), full capability drop,
// and cgroup limits already in place by the time this installs --
// namespace/capability-escape primitives, network (the compiler needs
// none), kernel/module control, and system time changes. This is
// deliberately less strict than the harvested profiles above; replacing
// it with a real harvested allowlist is the tracked follow-up hardening
// once a Linux dev environment is available.
static int add_compile_deny_rules(scmp_filter_ctx ctx) {
  int denied[] = {
      SCMP_SYS(ptrace),
      SCMP_SYS(mount),
      SCMP_SYS(umount2),
      SCMP_SYS(pivot_root),
      SCMP_SYS(chroot),
      SCMP_SYS(reboot),
      SCMP_SYS(init_module),
      SCMP_SYS(finit_module),
      SCMP_SYS(delete_module),
      SCMP_SYS(kexec_load),
      SCMP_SYS(kexec_file_load),
      SCMP_SYS(swapon),
      SCMP_SYS(swapoff),
      SCMP_SYS(acct),
      SCMP_SYS(settimeofday),
      SCMP_SYS(clock_settime),
      SCMP_SYS(clock_adjtime),
      SCMP_SYS(adjtimex),
      SCMP_SYS(sethostname),
      SCMP_SYS(setdomainname),
      SCMP_SYS(socket),
      SCMP_SYS(socketpair),
      SCMP_SYS(connect),
      SCMP_SYS(bind),
      SCMP_SYS(listen),
      SCMP_SYS(accept),
      SCMP_SYS(accept4),
      SCMP_SYS(sendto),
      SCMP_SYS(recvfrom),
      SCMP_SYS(sendmsg),
      SCMP_SYS(recvmsg),
      SCMP_SYS(unshare),
      SCMP_SYS(setns),
      SCMP_SYS(personality),
      SCMP_SYS(iopl),
      SCMP_SYS(ioperm),
      SCMP_SYS(syslog),
      SCMP_SYS(quotactl),
      SCMP_SYS(add_key),
      SCMP_SYS(request_key),
      SCMP_SYS(keyctl),
      SCMP_SYS(bpf),
      SCMP_SYS(perf_event_open),
  };
  for (size_t i = 0; i < sizeof(denied) / sizeof(denied[0]); i++) {
    if (seccomp_rule_add(ctx, SCMP_ACT_KILL_PROCESS, denied[i], 0) < 0) {
      fprintf(stderr, "[seccomp] failed to deny syscall #%d\n", denied[i]);
      return -1;
    }
  }
  return 0;
}

int seccomp_install_run_filter(const char *profile) {
  // TEMPORARY debug escape hatch for diagnosing a new profile's real
  // syscall needs inside the actual sandboxed mount/namespace environment
  // (as opposed to a bare strace outside it, which can miss
  // environment-dependent codepaths). Not a security-relevant profile --
  // remove once the caller's real profile is fully built out.
  if (strcmp(profile, "debug-allow-all") == 0) {
    scmp_filter_ctx ctx = seccomp_init(SCMP_ACT_ALLOW);
    if (!ctx) return -1;
    int rc = seccomp_load(ctx);
    seccomp_release(ctx);
    return rc;
  }

  if (strcmp(profile, "compile") == 0) {
    scmp_filter_ctx ctx = seccomp_init(SCMP_ACT_ALLOW);
    if (!ctx) {
      fprintf(stderr, "[seccomp] seccomp_init failed\n");
      return -1;
    }
    int rc = add_compile_deny_rules(ctx);
    if (rc == 0 && seccomp_load(ctx) < 0) {
      fprintf(stderr, "[seccomp] seccomp_load failed\n");
      rc = -1;
    }
    seccomp_release(ctx);
    return rc;
  }

  scmp_filter_ctx ctx = seccomp_init(SCMP_ACT_KILL_PROCESS);
  if (!ctx) {
    fprintf(stderr, "[seccomp] seccomp_init failed\n");
    return -1;
  }

  int rc = add_common_rules(ctx);
  if (rc == 0) {
    if (strcmp(profile, "python") == 0) {
      rc = add_python_rules(ctx);
    } else if (strcmp(profile, "node") == 0) {
      rc = add_node_rules(ctx);
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
