// M1 verification binary: exits with the code given as argv[1] (default 0),
// used to confirm jail correctly propagates the sandboxed process's exit
// status back out to the caller.
#include <stdlib.h>

int main(int argc, char **argv) {
  if (argc > 1) {
    return atoi(argv[1]);
  }
  return 0;
}
