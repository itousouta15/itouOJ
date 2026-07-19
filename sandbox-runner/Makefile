CC := cc
CFLAGS := -Wall -Wextra -O2

BIN := jail
SRC := src/jail.c src/cgroup.c src/caps.c src/seccomp.c
LDLIBS := -lseccomp

SERVER_BIN := sandbox-server
SERVER_SRC := src/server.c
SERVER_LDLIBS := -lmicrohttpd -lcjson

.PHONY: all clean

all: $(BIN) $(SERVER_BIN)

$(BIN): $(SRC) src/cgroup.h src/caps.h src/seccomp.h
	$(CC) $(CFLAGS) -o $@ $(SRC) $(LDLIBS)

$(SERVER_BIN): $(SERVER_SRC)
	$(CC) $(CFLAGS) -o $@ $(SERVER_SRC) $(SERVER_LDLIBS)

clean:
	rm -f $(BIN) $(SERVER_BIN)
