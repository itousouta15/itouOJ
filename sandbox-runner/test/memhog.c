// M2 demo: grows RSS forever until the cgroup memory controller SIGKILLs
// it (memory.max exceeded) -- expected to die well before the wall-clock
// timeout given a small memory limit.
#include <stdlib.h>
#include <string.h>
#include <unistd.h>

int main(void) {
  for (;;) {
    char *p = malloc(1024 * 1024);
    if (p) {
      memset(p, 1, 1024 * 1024); // touch pages so they're actually committed
    }
    usleep(1000);
  }
}
