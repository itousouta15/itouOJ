#ifndef SANDBOX_SECCOMP_H
#define SANDBOX_SECCOMP_H

// Installs the run-phase seccomp-bpf allowlist for the calling process.
// Default action is SCMP_ACT_KILL_PROCESS: any syscall not explicitly
// allowed kills every thread in the process immediately. Call this LAST,
// right before execve() of the submission binary -- once installed, it
// covers the execve() call itself and everything the submission does
// afterwards (seccomp filters are inherited across execve).
int seccomp_install_run_filter(void);

#endif
