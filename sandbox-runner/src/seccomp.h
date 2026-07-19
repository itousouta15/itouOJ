#ifndef SANDBOX_SECCOMP_H
#define SANDBOX_SECCOMP_H

// Installs the run-phase seccomp-bpf allowlist for the calling process,
// selected by `profile`. Default action is SCMP_ACT_KILL_PROCESS: any
// syscall not explicitly allowed kills every thread in the process
// immediately. Call this LAST, right before execve() of the submission
// binary/interpreter -- once installed, it covers the execve() call itself
// and everything the submission does afterwards (seccomp filters are
// inherited across execve).
//
// profile: "native" (C/C++, statically-linked, M4's original policy) or
// "python" (CPython interpreter, a materially broader syscall surface --
// dynamic import machinery, etc.).
int seccomp_install_run_filter(const char *profile);

#endif
