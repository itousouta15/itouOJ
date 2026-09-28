#!/usr/bin/env python3
"""Loopback-only interactive sessions. All compilation/execution goes through jail.

The Next.js proxy supplies the authenticated owner; never expose this port to
the browser. Long polling delivers output without re-running the user's code.
"""
import codecs
import errno
import json
import os
from pathlib import Path
import pty
import secrets
import selectors
import shutil
import signal
import subprocess
import tempfile
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlsplit

BASE = Path(__file__).resolve().parent
JAIL = BASE / "jail"
WORK = Path(os.environ.get("INTERACTIVE_WORK_ROOT", str(BASE / "interactive-work")))
OUTPUT_LIMIT = 256 * 1024
INPUT_LIMIT = 64 * 1024
WALL_MS = 120_000
DISCONNECT_SECONDS = 30
LANGUAGES = {
    "c": ("main.c", "native", None, ["/bin/prog"]),
    "cpp": ("main.cpp", "native", None, ["/bin/prog"]),
    "python": ("main.py", "python", os.environ.get("PYTHON_HOME", "/opt/piston-data/packages/python/3.12.0"),
               ["/opt/runtime/bin/python3.12", "-u", "/work/main.py"]),
    "javascript": ("main.js", "node", os.environ.get("NODE_HOME", "/opt/piston-data/packages/node/20.11.1"),
                   ["/opt/runtime/bin/node", "/work/main.js"]),
}


class RequestError(Exception):
    def __init__(self, status, message):
        self.status, self.message = status, message


class Session:
    def __init__(self, owner, language, code, memory_mb, cpu_ms):
        self.id = secrets.token_urlsafe(32)
        self.owner, self.language, self.code = owner, language, code
        self.memory_mb, self.cpu_ms = memory_mb, cpu_ms
        self.condition = threading.Condition()
        self.events = []
        self.output_size = self.input_size = 0
        self.pending = bytearray()
        self.eof = False
        self.stopping = False
        self.done = False
        self.state = "compiling"
        self.last_seen = time.monotonic()
        self.finished_at = None
        self.thread = threading.Thread(target=self.run, daemon=True)

    def emit(self, kind, **fields):
        with self.condition:
            self.events.append({"type": kind, **fields})
            self.condition.notify_all()

    def output(self, text):
        if not text:
            return
        size = len(text.encode("utf-8"))
        with self.condition:
            if self.output_size + size > OUTPUT_LIMIT or len(self.events) >= 8192:
                if not self.stopping:
                    self.emit("error", message="輸出超過上限，程式已停止")
                self.stopping = True
                return
            self.output_size += size
            self.emit("output", text=text)

    def stop(self):
        with self.condition:
            self.stopping = True
            self.condition.notify_all()

    def input(self, text, eof):
        data = text.encode("utf-8")
        with self.condition:
            if self.done or self.stopping or self.state != "running" or self.eof:
                raise RequestError(409, "程式目前無法接受輸入")
            if self.input_size + len(data) > INPUT_LIMIT:
                raise RequestError(413, "輸入超過 64 KiB 上限")
            self.input_size += len(data)
            self.pending.extend(data)
            self.eof = eof
            self.last_seen = time.monotonic()

    def poll(self, cursor):
        with self.condition:
            self.last_seen = time.monotonic()
            if cursor < 0 or cursor > len(self.events):
                raise RequestError(400, "無效的輸出位置")
            if cursor == len(self.events) and not self.done:
                self.condition.wait_for(lambda: cursor < len(self.events) or self.done, timeout=10)
            # Bound individual HTTP responses; cursor advances only over delivered events.
            events = self.events[cursor:cursor + 128]
            return {"events": events, "cursor": cursor + len(events),
                    "done": self.done and cursor + len(events) == len(self.events)}

    def execute(self, root, profile, runtime, program, memory, wall_ms, cpu_ms, interactive):
        """One live jail process. stdin stays open until explicit EOF/stop/exit."""
        env = {"PATH": "/usr/bin:/bin", "JAIL_QUIET": "1", "JAIL_CPU_LIMIT_MS": str(cpu_ms)}
        argv = [str(JAIL), str(root), str(memory), "64" if profile == "compile" else "32",
                str(wall_ms), profile, runtime or "-", *program]
        # Node flushes its streams without a tty. A pipe also avoids libuv's
        # terminal-control ioctls, intentionally absent from the seccomp policy.
        master, slave = os.pipe() if profile == "node" else pty.openpty()
        process = None
        try:
            # A terminal on stdout gives native stdio line buffering; stdin is a
            # pipe so EOF is reliable even for read-to-EOF programs such as Node's template.
            process = subprocess.Popen(argv, stdin=subprocess.PIPE, stdout=slave, stderr=slave,
                                       env=env, close_fds=True, start_new_session=True)
            os.close(slave)
            slave = -1
            os.set_blocking(master, False)
            os.set_blocking(process.stdin.fileno(), False)
            decoder = codecs.getincrementaldecoder("utf-8")("replace")
            with selectors.DefaultSelector() as selector:
                selector.register(master, selectors.EVENT_READ)
                input_open = True
                output_open = True
                start = time.monotonic()
                termination_sent = False
                while output_open or process.poll() is None:
                    with self.condition:
                        stop = self.stopping or time.monotonic() - self.last_seen > DISCONNECT_SECONDS
                    if stop and not termination_sent:
                        process.terminate()  # jail handles SIGTERM by killing its cgroup
                        termination_sent = True
                    if time.monotonic() - start > wall_ms / 1000 + 5 and not termination_sent:
                        process.terminate()
                        termination_sent = True
                    if input_open:
                        with self.condition:
                            try:
                                if interactive and self.pending:
                                    written = os.write(process.stdin.fileno(), self.pending[:4096])
                                    del self.pending[:written]
                                if not interactive or (self.eof and not self.pending):
                                    process.stdin.close()
                                    input_open = False
                            except BlockingIOError:
                                pass
                            except BrokenPipeError:
                                process.stdin.close()
                                input_open = False
                    for key, _ in selector.select(0.02):
                        try:
                            data = os.read(key.fd, 4096)
                        except BlockingIOError:
                            continue
                        except OSError as error:
                            if error.errno != errno.EIO:
                                raise
                            data = b""
                        if data:
                            self.output(decoder.decode(data))
                        else:
                            selector.unregister(master)
                            output_open = False
                    if process.poll() is not None and not output_open:
                        break
                self.output(decoder.decode(b"", final=True))
            return process.wait()
        finally:
            if slave >= 0:
                os.close(slave)
            os.close(master)
            if process:
                if process.poll() is None:
                    process.terminate()
                    process.wait(timeout=5)
                if not process.stdin.closed:
                    process.stdin.close()

    def run(self):
        root = None
        try:
            WORK.mkdir(mode=0o755, exist_ok=True)
            root = Path(tempfile.mkdtemp(prefix="session-", dir=WORK))
            root.chmod(0o755)
            for name in ("work", "bin", "tmp"):
                (root / name).mkdir()
            (root / "bin").chmod(0o777)
            (root / "tmp").chmod(0o1777)
            filename, profile, runtime, program = LANGUAGES[self.language]
            (root / "work" / filename).write_text(self.code, encoding="utf-8")
            self.code = ""
            if self.language in ("c", "cpp"):
                self.emit("state", state="compiling")
                compiler = "/usr/bin/gcc" if self.language == "c" else "/usr/bin/g++"
                result = self.execute(root, "compile", None,
                                      [compiler, "-O2", "-static", "-o", "/bin/prog", f"/work/{filename}"],
                                      1024, 15_000, 15_000, False)
                if result != 0:
                    self.emit("exit", code=result, reason="stopped" if self.stopping else "compile-error")
                    return
            with self.condition:
                if self.stopping:
                    self.emit("exit", code=None, reason="stopped")
                    return
                self.state = "running"
                self.emit("state", state="running")
            result = self.execute(root, profile, runtime, program, self.memory_mb, WALL_MS, self.cpu_ms, True)
            self.emit("exit", code=result, reason="stopped" if self.stopping else "timeout" if result == 124 else "exited")
        except Exception as error:
            print(f"[terminal] {self.id}: {error}", flush=True)
            self.emit("error", message="互動沙箱執行失敗，請確認服務與語言環境已安裝")
        finally:
            if root:
                shutil.rmtree(root, ignore_errors=True)
            with self.condition:
                self.done = True
                self.finished_at = time.monotonic()
                self.condition.notify_all()


sessions = {}
sessions_lock = threading.Lock()


def reap_sessions():
    while True:
        time.sleep(1)
        with sessions_lock:
            for key, session in list(sessions.items()):
                with session.condition:
                    if session.done and time.monotonic() - session.finished_at > 30:
                        del sessions[key]
                    elif not session.done and time.monotonic() - session.last_seen > DISCONNECT_SECONDS:
                        session.stop()


class Handler(BaseHTTPRequestHandler):
    def log_message(self, *_):
        pass

    def respond(self, status, body):
        data = json.dumps(body, ensure_ascii=True).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def body(self):
        length = int(self.headers.get("Content-Length", "0"))
        if length < 0 or length > 256 * 1024:
            raise RequestError(413, "請求過大")
        data = json.loads(self.rfile.read(length))
        if not isinstance(data, dict):
            raise RequestError(400, "無效的請求")
        return data

    def handle_api(self):
        self.connection.settimeout(20)
        try:
            owner = self.headers.get("X-Terminal-User", "")
            if not owner or len(owner) > 128:
                raise RequestError(401, "缺少使用者")
            url = urlsplit(self.path)
            if self.command == "POST" and url.path == "/sessions":
                data = self.body()
                language, code = data.get("language"), data.get("code")
                memory, cpu = data.get("memoryMb"), data.get("cpuMs")
                if (language not in LANGUAGES or not isinstance(code, str) or not code or
                        len(code.encode("utf-8")) > INPUT_LIMIT or
                        type(memory) is not int or not 4 <= memory <= 2048 or
                        type(cpu) is not int or not 100 <= cpu <= 30_000):
                    raise RequestError(400, "不支援的語言或執行參數")
                with sessions_lock:
                    active = [s for s in sessions.values() if not s.done]
                    if any(s.owner == owner for s in active):
                        raise RequestError(429, "已有互動程式正在執行")
                    if len(active) >= 4 or len(sessions) >= 128:
                        raise RequestError(503, "互動沙箱忙碌中，請稍後再試")
                    session = Session(owner, language, code, memory, cpu)
                    sessions[session.id] = session
                    session.thread.start()
                self.respond(201, {"id": session.id})
                return
            parts = url.path.strip("/").split("/")
            if len(parts) != 2 or parts[0] != "sessions":
                raise RequestError(404, "找不到互動工作階段")
            with sessions_lock:
                session = sessions.get(parts[1])
            if not session or session.owner != owner:
                raise RequestError(404, "找不到互動工作階段")
            if self.command == "GET":
                cursor = int(parse_qs(url.query).get("cursor", ["0"])[0])
                self.respond(200, session.poll(cursor))
            elif self.command == "POST":
                data = self.body()
                text, eof = data.get("text", ""), data.get("eof", False)
                if not isinstance(text, str) or type(eof) is not bool:
                    raise RequestError(400, "無效的輸入")
                session.input(text, eof)
                self.respond(200, {"ok": True})
            elif self.command == "DELETE":
                session.stop()
                self.respond(200, {"ok": True})
            else:
                raise RequestError(405, "不支援的方法")
        except RequestError as error:
            self.respond(error.status, {"error": error.message})
        except (ValueError, TypeError, UnicodeError):
            self.respond(400, {"error": "無效的請求"})
        except (BrokenPipeError, ConnectionResetError, TimeoutError):
            pass

    do_GET = do_POST = do_DELETE = handle_api


def main():
    if os.geteuid() != 0:
        raise SystemExit("interactive.py requires root to invoke jail namespaces/cgroups")
    server = ThreadingHTTPServer(("127.0.0.1", 8091), Handler)
    server.daemon_threads = True
    threading.Thread(target=reap_sessions, daemon=True).start()
    def shutdown(_sig, _frame):
        with sessions_lock:
            active = list(sessions.values())
        for session in active:
            session.stop()
        for session in active:
            session.thread.join(timeout=5)
        raise SystemExit(0)
    signal.signal(signal.SIGTERM, shutdown)
    signal.signal(signal.SIGINT, shutdown)
    print("[terminal] listening on 127.0.0.1:8091", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
