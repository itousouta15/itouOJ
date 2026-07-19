// M1 verification binary: prints its own pid/hostname and every PID visible
// under /proc. Run outside the jail it should show the whole host process
// table; run inside the jail it should show exactly one entry (itself).
// Build statically (-static) so it needs nothing from the rootfs but itself.
#include <ctype.h>
#include <dirent.h>
#include <stdio.h>
#include <sys/utsname.h>
#include <unistd.h>

int main(void) {
  printf("[probe] pid = %d\n", getpid());

  struct utsname u;
  if (uname(&u) == 0) {
    printf("[probe] hostname = %s\n", u.nodename);
  }

  DIR *d = opendir("/proc");
  if (!d) {
    perror("[probe] opendir /proc");
    return 1;
  }

  printf("[probe] visible PIDs in /proc:\n");
  struct dirent *e;
  int count = 0;
  while ((e = readdir(d)) != NULL) {
    int is_pid = 1;
    for (const char *p = e->d_name; *p; p++) {
      if (!isdigit((unsigned char)*p)) {
        is_pid = 0;
        break;
      }
    }
    if (is_pid) {
      printf("  - %s\n", e->d_name);
      count++;
    }
  }
  closedir(d);
  printf("[probe] total visible PIDs: %d\n", count);
  return 0;
}
