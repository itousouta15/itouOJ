// M2: thin wrapper around the cgroup v2 filesystem for one sandboxed run.
// Assumes a pre-existing delegated parent cgroup at CGROUP_PARENT with
// memory/pids/cpu already enabled in its cgroup.subtree_control (see
// cg_ensure_parent()).
#ifndef SANDBOX_CGROUP_H
#define SANDBOX_CGROUP_H

#include <stddef.h>

#define CGROUP_PARENT "/sys/fs/cgroup/oj-sandbox"
#define CGROUP_PATH_MAX 256

// Makes sure /sys/fs/cgroup/oj-sandbox exists and has memory/pids/cpu
// delegated to its children. Safe to call every run (idempotent).
int cg_ensure_parent(void);

// Creates a fresh leaf cgroup under CGROUP_PARENT for this run and writes
// memory.max / memory.swap.max / pids.max into it. out_path must be at
// least CGROUP_PATH_MAX bytes; receives the created cgroup's path.
int cg_create_run(char *out_path, size_t out_path_len, long mem_limit_bytes,
                   long pids_max);

// Moves the calling process (must be called BY the process joining, so the
// pid is resolved in the caller's own pid namespace) into the given cgroup.
int cg_join_self(const char *cgroup_path);

// Atomically SIGKILLs every process in the cgroup (cgroup.kill, kernel >=5.14).
int cg_kill(const char *cgroup_path);

// Reads memory.peak (peak memory usage in bytes) for the cgroup. Returns -1
// if unavailable.
long cg_read_memory_peak(const char *cgroup_path);

// Removes the leaf cgroup directory. Must be called after all member
// processes have exited (rmdir fails otherwise).
int cg_destroy(const char *cgroup_path);

#endif
