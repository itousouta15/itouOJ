// cc -O2 -Isrc -o /tmp/test-cleanup test/test_cleanup.c -lmicrohttpd -lcjson
// Run in an isolated Linux test environment, not inside the judge service.
#define main sandbox_server_main
#include "server.c"
#undef main

#include <assert.h>

int main(void) {
  char path[] = "/tmp/oj-cleanup-XXXXXX";
  assert(mkdtemp(path));
  int original = open(".", O_RDONLY | O_DIRECTORY);
  assert(original >= 0 && chdir(path) == 0);
  assert(mkdir("work", 0700) == 0);
  assert(mkdir("work/case", 0700) == 0);
  assert(mkdir("work/case/rootfs", 0700) == 0);
  assert(mkdir("work/case/rootfs/bin", 0777) == 0);
  assert(mkdir("external", 0700) == 0);
  int file = open("external/keep", O_WRONLY | O_CREAT, 0600);
  assert(file >= 0 && close(file) == 0);

  char outside[256];
  snprintf(outside, sizeof(outside), "%s/external", path);
  assert(symlink(outside, "work/case/rootfs/bin/escape") == 0);
  assert(cleanup_workdir("./work/case") == 0);
  assert(access("work/case", F_OK) == -1 && errno == ENOENT);
  assert(access("external/keep", F_OK) == 0);
  assert(cleanup_workdir("./work/../external") == -1 && errno == EINVAL);
  assert(access("external/keep", F_OK) == 0);
  assert(cleanup_workdir("./work/missing") == 0);

  assert(fchdir(original) == 0);
  close(original);
  int tmp = open("/tmp", O_RDONLY | O_DIRECTORY);
  assert(tmp >= 0);
  assert(remove_tree_at(tmp, path + strlen("/tmp/")) == 0);
  close(tmp);
  puts("sandbox cleanup: symlink, missing path and boundary OK");
  return 0;
}
