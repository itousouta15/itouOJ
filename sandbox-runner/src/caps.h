#ifndef SANDBOX_CAPS_H
#define SANDBOX_CAPS_H

// Clears effective/permitted/inheritable capability sets to empty and drops
// every capability from the bounding set. Call this LAST, after all
// privileged setup (mount/pivot_root, uid/gid drop) is done -- once this
// returns, the calling process holds no Linux capabilities at all, and
// setuid()-class syscalls can no longer regain any (also set
// PR_SET_NO_NEW_PRIVS separately so execve can't regain privilege either).
int caps_drop_all(void);

#endif
