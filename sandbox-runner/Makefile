CC := cc
CFLAGS := -Wall -Wextra -O2
LDLIBS := -lseccomp

BIN := jail
SRC := src/jail.c src/cgroup.c src/caps.c src/seccomp.c

.PHONY: all clean

all: $(BIN)

$(BIN): $(SRC) src/cgroup.h src/caps.h src/seccomp.h
	$(CC) $(CFLAGS) -o $@ $(SRC) $(LDLIBS)

clean:
	rm -f $(BIN)
