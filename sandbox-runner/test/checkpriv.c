// M3 verification binary: confirms the sandboxed process actually ended up
// unprivileged -- can't regain root, can't write to its own rootfs.
#include <errno.h>
#include <stdio.h>
#include <string.h>
#include <unistd.h>

int main(void) {
  printf("[checkpriv] uid=%d gid=%d euid=%d egid=%d\n", getuid(), getgid(),
         geteuid(), getegid());

  if (setuid(0) == -1) {
    printf("[checkpriv] setuid(0) failed as expected: %s\n", strerror(errno));
  } else {
    printf("[checkpriv] setuid(0) SUCCEEDED -- privilege drop is broken!\n");
  }

  FILE *f = fopen("/testfile", "w");
  if (f) {
    printf("[checkpriv] write to rootfs SUCCEEDED -- should be read-only!\n");
    fclose(f);
  } else {
    printf("[checkpriv] write to rootfs failed as expected: %s\n",
           strerror(errno));
  }

  return 0;
}
