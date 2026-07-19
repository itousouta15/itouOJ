#define _GNU_SOURCE
#include "cgroup.h"

#include <errno.h>
#include <fcntl.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/stat.h>
#include <sys/types.h>
#include <time.h>
#include <unistd.h>

static int write_file(const char *path, const char *content) {
  int fd = open(path, O_WRONLY | O_TRUNC);
  if (fd == -1) {
    fprintf(stderr, "[cgroup] open %s: %s\n", path, strerror(errno));
    return -1;
  }
  size_t len = strlen(content);
  ssize_t n = write(fd, content, len);
  close(fd);
  if (n != (ssize_t)len) {
    fprintf(stderr, "[cgroup] write %s: %s\n", path, strerror(errno));
    return -1;
  }
  return 0;
}

static long read_file_long(const char *path) {
  int fd = open(path, O_RDONLY);
  if (fd == -1) {
    return -1;
  }
  char buf[64] = {0};
  ssize_t n = read(fd, buf, sizeof(buf) - 1);
  close(fd);
  if (n <= 0) {
    return -1;
  }
  return atol(buf);
}

int cg_ensure_parent(void) {
  if (mkdir(CGROUP_PARENT, 0755) == -1 && errno != EEXIST) {
    fprintf(stderr, "[cgroup] mkdir %s: %s\n", CGROUP_PARENT, strerror(errno));
    return -1;
  }
  // Delegate memory/pids/cpu down to children of oj-sandbox. Re-adding an
  // already-enabled controller is a harmless no-op, so this is safe to call
  // every run rather than tracking whether it was done before.
  char path[CGROUP_PATH_MAX];
  snprintf(path, sizeof(path), "%s/cgroup.subtree_control", CGROUP_PARENT);
  return write_file(path, "+memory +pids +cpu");
}

int cg_create_run(char *out_path, size_t out_path_len, long mem_limit_bytes,
                   long pids_max) {
  struct timespec ts;
  clock_gettime(CLOCK_MONOTONIC, &ts);
  snprintf(out_path, out_path_len, "%s/run-%d-%ld", CGROUP_PARENT, getpid(),
           ts.tv_nsec);

  if (mkdir(out_path, 0755) == -1) {
    fprintf(stderr, "[cgroup] mkdir %s: %s\n", out_path, strerror(errno));
    return -1;
  }

  char file[CGROUP_PATH_MAX + 32];
  char value[32];

  snprintf(file, sizeof(file), "%s/memory.max", out_path);
  snprintf(value, sizeof(value), "%ld", mem_limit_bytes);
  if (write_file(file, value) == -1) return -1;

  // Host has no swap, but be explicit rather than relying on that.
  snprintf(file, sizeof(file), "%s/memory.swap.max", out_path);
  if (write_file(file, "0") == -1) return -1;

  snprintf(file, sizeof(file), "%s/pids.max", out_path);
  snprintf(value, sizeof(value), "%ld", pids_max);
  if (write_file(file, value) == -1) return -1;

  return 0;
}

int cg_join_self(const char *cgroup_path) {
  char file[CGROUP_PATH_MAX + 32];
  snprintf(file, sizeof(file), "%s/cgroup.procs", cgroup_path);
  // "0" is the kernel's shorthand for "the writing process itself" -- this
  // sidesteps having to reason about which pid-namespace view of our own
  // pid the kernel would otherwise expect here.
  return write_file(file, "0");
}

int cg_kill(const char *cgroup_path) {
  char file[CGROUP_PATH_MAX + 32];
  snprintf(file, sizeof(file), "%s/cgroup.kill", cgroup_path);
  return write_file(file, "1");
}

long cg_read_memory_peak(const char *cgroup_path) {
  char file[CGROUP_PATH_MAX + 32];
  snprintf(file, sizeof(file), "%s/memory.peak", cgroup_path);
  return read_file_long(file);
}

int cg_destroy(const char *cgroup_path) {
  if (rmdir(cgroup_path) == -1) {
    fprintf(stderr, "[cgroup] rmdir %s: %s\n", cgroup_path, strerror(errno));
    return -1;
  }
  return 0;
}
