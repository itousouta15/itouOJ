// M2 demo: classic fork bomb. Without pids.max this would exhaust the
// host's process table; with it, fork() starts failing (EAGAIN) once the
// cgroup's process count hits the limit, and the whole thing is eventually
// reaped by the wall-clock timeout via cgroup.kill.
#include <unistd.h>

int main(void) {
  for (;;) {
    fork();
  }
}
