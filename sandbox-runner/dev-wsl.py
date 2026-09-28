#!/usr/bin/env python3
"""Local WSL2 launcher. Run as root; mount changes stay in a private namespace.

Build jail first. Uses distro Python/Node instead of production Piston packages.
"""
import os
from pathlib import Path
import subprocess
import sys

BASE = Path(__file__).resolve().parent
WORK = BASE / "interactive-work-local"

if os.geteuid() != 0:
    raise SystemExit("請用 wsl -u root 執行此啟動程式")
if "--private-mounts" not in sys.argv:
    os.execvp("unshare", ["unshare", "--mount", "--propagation", "private", sys.executable, __file__, "--private-mounts"])

# WSL mounts GPU drivers/modules underneath /usr. Linux forbids a non-recursive
# bind of a tree with these locked submounts into a user namespace. Detach only
# those WSL-specific mounts in this private namespace; the host is unaffected.
mounts = subprocess.check_output(["findmnt", "-rn", "-o", "TARGET"], text=True).splitlines()
for target in sorted(mounts, key=len, reverse=True):
    if target.startswith(("/usr/lib/wsl/", "/usr/lib/modules/")):
        subprocess.run(["umount", target], check=True)

# Windows/DrvFS cannot host jail's bind mounts. All per-run files instead live in
# this temporary Linux filesystem, automatically discarded when the service exits.
WORK.mkdir(exist_ok=True)
subprocess.run(["mount", "-t", "tmpfs", "-o", "size=512m", "tmpfs", str(WORK)], check=True)
os.environ["INTERACTIVE_WORK_ROOT"] = str(WORK)
os.environ["PYTHON_HOME"] = "/usr"
os.environ["NODE_HOME"] = "/usr"
os.execv(sys.executable, [sys.executable, str(BASE / "interactive.py")])
