// M2 sanity check: a normal, quick, low-resource program -- confirms the
// cgroup plumbing doesn't get in the way of an ordinary run.
#include <stdio.h>

int main(void) {
  printf("[wellbehaved] ok\n");
  return 0;
}
