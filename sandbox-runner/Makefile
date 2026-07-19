CC := cc
CFLAGS := -Wall -Wextra -O2
LDLIBS :=

BIN := jail
SRC := src/jail.c src/cgroup.c

.PHONY: all clean

all: $(BIN)

$(BIN): $(SRC) src/cgroup.h
	$(CC) $(CFLAGS) -o $@ $(SRC) $(LDLIBS)

clean:
	rm -f $(BIN)
