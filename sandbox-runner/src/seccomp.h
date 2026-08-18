#ifndef SANDBOX_SECCOMP_H
#define SANDBOX_SECCOMP_H

// Installs a seccomp-bpf filter for the calling process, selected by
// `profile`. Call this LAST, right before execve() of whatever the caller
// is about to run -- once installed, it covers that execve() call itself
// and everything runs afterwards (seccomp filters are inherited across
// execve).
//
// profile: "native" (C/C++ run phase, statically-linked, M4's original
// policy), "python"/"node" (interpreter run phases, materially broader
// syscall surface -- dynamic import machinery etc.), or "compile" (gcc/g++
// compiling a submission -- see seccomp.c's add_compile_deny_rules for why
// this one inverts the model: default ALLOW plus an explicit deny-list,
// not a harvested default-KILL allowlist like the other three).
//
// The three run profiles default to SCMP_ACT_KILL_PROCESS: any syscall not
// explicitly allowed kills every thread in the process immediately. The
// compile profile defaults to SCMP_ACT_ALLOW instead, killing only on the
// specific syscalls in its deny-list.
int seccomp_install_run_filter(const char *profile);

#endif
