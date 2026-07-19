CC := cc
CFLAGS := -Wall -Wextra -O2
LDLIBS :=

BIN := jail
SRC := src/jail.c

.PHONY: all clean

all: $(BIN)

$(BIN): $(SRC)
	$(CC) $(CFLAGS) -o $@ $(SRC) $(LDLIBS)

clean:
	rm -f $(BIN)
