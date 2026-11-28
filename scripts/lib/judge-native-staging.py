"""Owned WSL native-sandbox lifecycle for stage-judge-native.mjs.

Only builds the sibling's sources; never writes its checkout. JSON-lines stdin
commands are probe/stop. EOF, SIGINT, SIGTERM and setup failures all clean up the
exclusive cgroup subtree, including orphaned compiler/jail descendants.
"""
import argparse
import json
import os
from pathlib import Path
import resource
import selectors
import shutil
import signal
import socket
import subprocess
import sys
import tempfile
import time


def emit(event, **data):
    print(json.dumps({"event": event, **data}), flush=True)


class NativeSandboxes:
    def __init__(self, source, scratch_parent, deps):
        self.source = source.resolve()
        self.scratch_parent = scratch_parent.resolve()
        self.deps = deps.resolve()
        self.root = None
        self.parent = None
        self.mounted = False
        self.servers = []

    def setup(self):
        if sys.platform != "linux" or os.geteuid() != 0:
            raise RuntimeError("native staging requires Linux root inside WSL")
        if not all(shutil.which(tool) for tool in ("cc", "gcc", "g++", "mount", "umount")):
            raise RuntimeError("cc/gcc/g++ and mount/umount are required")
        if os.readlink("/proc/self/ns/mnt") == os.readlink("/proc/1/ns/mnt"):
            raise RuntimeError("run the helper inside unshare --mount --propagation private")
        control = Path("/sys/fs/cgroup/cgroup.subtree_control")
        if not control.is_file() or not {"cpu", "memory", "pids"} <= set(control.read_text().split()):
            raise RuntimeError("existing root cpu/memory/pids delegation required; host controllers were not changed")
        if not self.scratch_parent.is_dir() or not (self.source / "src/server.c").is_file():
            raise RuntimeError("source or existing scratch parent missing")
        if not (self.deps / "include/cjson/cJSON.h").is_file():
            raise RuntimeError("cJSON/microhttpd dependency prefix missing")
        resource.setrlimit(resource.RLIMIT_CORE, (0, 0))
        self.root = Path(tempfile.mkdtemp(prefix="itouoj-native-", dir=self.scratch_parent))
        self.root.chmod(0o755)
        # DrvFS makes native static compilation slow enough to hit the actual
        # 15-second compiler limit. Keep all native files on a bounded tmpfs,
        # mounted only in this helper's private mount namespace. The backing
        # directory is still under the controller's approved temp parent.
        subprocess.run(["mount", "-t", "tmpfs", "-o", "size=256m,mode=0755", "itouoj-staging", str(self.root)],
                       check=True, timeout=15)
        self.mounted = True
        parent = Path("/sys/fs/cgroup") / self.root.name
        parent.mkdir()  # exclusive; set ownership only after successful creation
        self.parent = parent
        (parent / "cgroup.subtree_control").write_text("+cpu +memory +pids")
        (parent / "memory.max").write_text(str(1024 * 1024 * 1024))
        (parent / "memory.swap.max").write_text("0")
        (parent / "pids.max").write_text("256")
        lib = self.deps / "lib/x86_64-linux-gnu"
        common = ["cc", "-I" + str(self.deps / "include"), "-Wall", "-Wextra", "-Werror", "-O2"]
        ldflags = ["-L" + str(lib), "-Wl,-rpath," + str(lib)]
        compiler_tmp = self.root / "compiler-tmp"
        compiler_tmp.mkdir()
        env = {"PATH": "/usr/local/bin:/usr/bin:/bin", "LC_ALL": "C", "HOME": str(self.root),
               "TMPDIR": str(compiler_tmp)}
        for index in range(2):
            work = self.root / ("sandbox-%d" % index)
            work.mkdir()
            service = parent / ("service-%d" % index)
            service.mkdir()
            runs = parent / ("runs-%d" % index)

            def enter_group(group=service):
                (group / "cgroup.procs").write_text("0")

            def build(command):
                done = subprocess.run(command, cwd=work, env=env, capture_output=True,
                                      text=True, timeout=90, preexec_fn=enter_group,
                                      start_new_session=True)
                if done.returncode:
                    raise RuntimeError("native build failed:\n" + done.stdout + done.stderr)

            build([*common, '-DCGROUP_PARENT="%s"' % runs, "-o", str(work / "jail"),
                   *(str(self.source / "src" / name) for name in ("jail.c", "cgroup.c", "caps.c", "seccomp.c")),
                   *ldflags, "-lseccomp"])
            with socket.socket() as reservation:
                reservation.bind(("127.0.0.1", 0))
                port = reservation.getsockname()[1]
                if port == 8090:
                    raise RuntimeError("refusing the default sandbox port")
                build([*common, "-pthread", "-DPORT=%d" % port, "-o", str(work / "sandbox-server"),
                       str(self.source / "src/server.c"), *ldflags, "-lmicrohttpd", "-lcjson"])
            log_path = work / "server.log"
            with log_path.open("wb") as log:
                process = subprocess.Popen([str(work / "sandbox-server")], cwd=work, env=env,
                                           stdin=subprocess.DEVNULL, stdout=log, stderr=log,
                                           preexec_fn=enter_group, start_new_session=True)
            entry = {"process": process, "work": work, "runs": runs, "port": port, "log": log_path}
            self.servers.append(entry)
            deadline = time.monotonic() + 15
            marker = "[sandbox-server] listening on 127.0.0.1:%d" % port
            while marker not in log_path.read_text(errors="replace"):
                if process.poll() is not None or time.monotonic() >= deadline:
                    raise RuntimeError("private native server failed to start:\n" + log_path.read_text(errors="replace"))
                time.sleep(0.025)
        emit("ready", urls=["http://127.0.0.1:%d" % row["port"] for row in self.servers],
             private_cgroup=str(self.parent), scratch=str(self.root))

    def probe(self):
        rows = []
        for entry in self.servers:
            runs = list(entry["runs"].glob("run-*")) if entry["runs"].exists() else []
            active = 0
            for run in runs:
                try:
                    active += "populated 1" in (run / "cgroup.events").read_text()
                except FileNotFoundError:
                    pass  # the jail completed between listing and reading
            work = entry["work"] / "work"
            rows.append({"alive": entry["process"].poll() is None, "activeRuns": active,
                         "runGroups": len(runs), "workdirs": len(list(work.iterdir())) if work.exists() else 0})
        return rows

    def cleanup(self):
        errors = []
        if self.parent is not None:
            try:
                (self.parent / "cgroup.kill").write_text("1")
                for entry in self.servers:
                    entry["process"].wait(timeout=15)
                deadline = time.monotonic() + 15
                while "populated 1" in (self.parent / "cgroup.events").read_text():
                    if time.monotonic() >= deadline:
                        raise RuntimeError("private cgroup did not drain")
                    time.sleep(0.025)
                for path in sorted((p for p in self.parent.rglob("*") if p.is_dir()),
                                   key=lambda p: len(p.parts), reverse=True):
                    path.rmdir()
                self.parent.rmdir()
            except Exception as error:
                errors.append(str(error))
        if self.mounted and not errors:
            try:
                subprocess.run(["umount", str(self.root)], check=True, timeout=15)
                self.mounted = False
            except Exception as error:
                errors.append(str(error))
        if self.root is not None and not errors:
            try:
                shutil.rmtree(self.root)
            except Exception as error:
                errors.append(str(error))
        result = {"privateCgroupRemoved": self.parent is None or not self.parent.exists(),
                  "scratchRemoved": self.root is None or not self.root.exists(),
                  "privateMountRemoved": not self.mounted,
                  "serversReaped": all(row["process"].poll() is not None for row in self.servers),
                  "errors": errors}
        emit("cleanup", **result)
        if errors:
            raise RuntimeError("native cleanup incomplete: " + "; ".join(errors))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", type=Path, required=True)
    parser.add_argument("--scratch-parent", type=Path, required=True)
    parser.add_argument("--deps", type=Path, required=True)
    args = parser.parse_args()
    sandboxes = NativeSandboxes(args.source, args.scratch_parent, args.deps)

    def interrupted(_signal, _frame):
        raise InterruptedError("native staging interrupted")

    signal.signal(signal.SIGINT, interrupted)
    signal.signal(signal.SIGTERM, interrupted)
    try:
        sandboxes.setup()
        with selectors.DefaultSelector() as selector:
            selector.register(sys.stdin, selectors.EVENT_READ)
            while True:
                if not selector.select(timeout=180):
                    raise TimeoutError("staging controller stopped sending commands")
                line = sys.stdin.readline()
                if not line:
                    break
                command = json.loads(line)
                if command.get("action") == "stop":
                    break
                if command.get("action") != "probe":
                    raise ValueError("unknown staging command")
                emit("probe", id=command["id"], servers=sandboxes.probe())
    finally:
        sandboxes.cleanup()


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print("native staging failed: " + str(error), file=sys.stderr)
        sys.exit(1)
