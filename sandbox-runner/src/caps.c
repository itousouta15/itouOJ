#define _GNU_SOURCE
#include "caps.h"

#include <errno.h>
#include <linux/capability.h>
#include <stdio.h>
#include <string.h>
#include <sys/prctl.h>
#include <sys/syscall.h>
#include <unistd.h>

// Generous upper bound on capability numbers -- prctl() just returns EINVAL
// for anything past the kernel's actual CAP_LAST_CAP, which we treat as
// harmless rather than pinning to a specific kernel's exact constant.
#define SANDBOX_CAP_UPPER_BOUND 40

int caps_drop_all(void) {
  for (int cap = 0; cap <= SANDBOX_CAP_UPPER_BOUND; cap++) {
    if (prctl(PR_CAPBSET_DROP, cap, 0, 0, 0) == -1 && errno != EINVAL) {
      fprintf(stderr, "[caps] PR_CAPBSET_DROP %d: %s\n", cap, strerror(errno));
    }
  }

  // glibc doesn't declare capset() itself (that's libcap); go straight to
  // the syscall with an all-zero capability set for every category.
  struct __user_cap_header_struct hdr = {
      .version = _LINUX_CAPABILITY_VERSION_3,
      .pid = 0,
  };
  struct __user_cap_data_struct data[2] = {{0, 0, 0}, {0, 0, 0}};

  if (syscall(SYS_capset, &hdr, data) == -1) {
    perror("[caps] capset");
    return -1;
  }
  return 0;
}
