"""Real-jail integration tests: run as root on a Linux cgroup-v2 host.

    PYTHON_HOME=/usr python3 -m unittest discover -s test -p test_interactive.py -v
"""
import importlib.util
import json
import os
from pathlib import Path
import tempfile
import subprocess
import threading
import time
import unittest
from urllib.error import HTTPError
from urllib.request import Request, urlopen

BASE = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("interactive", BASE / "interactive.py")
runner = importlib.util.module_from_spec(spec)
spec.loader.exec_module(runner)


@unittest.skipUnless(os.geteuid() == 0 and runner.JAIL.exists(), "requires root and built jail")
class InteractiveTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp = tempfile.TemporaryDirectory(prefix="interactive-work-test-", dir=BASE)
        # WSL's /mnt/c (DrvFS) cannot host the user-namespace bind mounts used by
        # jail. Run these tests in a private mount namespace with a tmpfs workdir.
        if os.environ.get("INTERACTIVE_TEST_TMPFS"):
            subprocess.run(["mount", "-t", "tmpfs", "-o", "size=256m", "tmpfs", cls.temp.name], check=True)
        runner.WORK = Path(cls.temp.name)
        cls.server = runner.ThreadingHTTPServer(("127.0.0.1", 0), runner.Handler)
        cls.server.daemon_threads = True
        cls.url = f"http://127.0.0.1:{cls.server.server_port}"
        cls.server_thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.server_thread.start()

    @classmethod
    def tearDownClass(cls):
        for session in list(runner.sessions.values()):
            session.stop()
            session.thread.join(timeout=5)
        cls.server.shutdown()
        cls.server.server_close()
        if os.environ.get("INTERACTIVE_TEST_TMPFS"):
            subprocess.run(["umount", cls.temp.name], check=True)
        cls.temp.cleanup()

    def setUp(self):
        self.owner = self.id()
        self.ids = []

    def tearDown(self):
        for sid in self.ids:
            session = runner.sessions[sid]
            session.stop()
            session.thread.join(timeout=5)
            self.assertFalse(session.thread.is_alive(), "session cleanup stuck")

    def request(self, method, path, data=None, owner=None):
        body = None if data is None else json.dumps(data).encode()
        request = Request(self.url + path, data=body, method=method,
                          headers={"Content-Type": "application/json", "X-Terminal-User": owner or self.owner})
        try:
            with urlopen(request, timeout=15) as response:
                return response.status, json.load(response)
        except HTTPError as error:
            return error.code, json.load(error)

    def start(self, code, language="cpp", cpu_ms=2000):
        status, result = self.request("POST", "/sessions", {
            "language": language, "code": code, "memoryMb": 256, "cpuMs": cpu_ms,
        })
        self.assertEqual(status, 201, result)
        self.ids.append(result["id"])
        return result["id"]

    def wait(self, sid, predicate, seconds=20):
        deadline = time.monotonic() + seconds
        session = runner.sessions[sid]
        while time.monotonic() < deadline:
            with session.condition:
                if predicate(session):
                    return session
                if session.done:
                    self.fail(f"program ended before expected output: {session.events}")
                session.last_seen = time.monotonic()
            time.sleep(0.03)
        self.fail(f"timed out: {session.events}")

    @staticmethod
    def output(session):
        return "".join(e.get("text", "") for e in session.events)

    def test_cpp_two_round_trips_and_utf8(self):
        sid = self.start('#include <iostream>\n#include <string>\nint main(){std::string s; '
                         'std::cout<<"name?"<<std::flush; std::getline(std::cin,s); '
                         'std::cout<<"hello "<<s<<std::endl; std::getline(std::cin,s); '
                         'std::cout<<"age "<<s<<std::endl;}')
        session = self.wait(sid, lambda s: "name?" in self.output(s))
        self.assertFalse(session.done)
        self.assertEqual(self.request("POST", f"/sessions/{sid}", {"text": "小明\n"})[0], 200)
        session = self.wait(sid, lambda s: "hello 小明" in self.output(s))
        self.assertFalse(session.done)
        self.request("POST", f"/sessions/{sid}", {"text": "18\n"})
        session = self.wait(sid, lambda s: s.done)
        self.assertIn("age 18", self.output(session))
        self.assertEqual(session.events[-1]["code"], 0)
        _, first = self.request("GET", f"/sessions/{sid}?cursor=0")
        _, second = self.request("GET", f"/sessions/{sid}?cursor={first['cursor']}")
        self.assertEqual(second["events"], [])
        self.assertTrue(second["done"])

    def test_eof_is_not_sent_automatically(self):
        sid = self.start('#include <stdio.h>\nint main(){int c,n=0;while((c=getchar())!=EOF)n++;printf("count=%d\\n",n);}', "c")
        self.wait(sid, lambda s: s.state == "running")
        self.request("POST", f"/sessions/{sid}", {"text": "abc\n"})
        time.sleep(0.2)
        self.assertFalse(runner.sessions[sid].done)
        self.request("POST", f"/sessions/{sid}", {"eof": True})
        session = self.wait(sid, lambda s: s.done)
        self.assertIn("count=4", self.output(session))

    def test_compile_error_and_owner_isolation(self):
        sid = self.start("int main( broken")
        self.assertEqual(self.request("GET", f"/sessions/{sid}", owner="another-user")[0], 404)
        self.assertEqual(self.request("POST", f"/sessions/{sid}", {"text": "x"}, owner="another-user")[0], 404)
        self.assertEqual(self.request("DELETE", f"/sessions/{sid}", owner="another-user")[0], 404)
        session = self.wait(sid, lambda s: s.done)
        self.assertEqual(session.events[-1]["reason"], "compile-error")
        self.assertIn("error", self.output(session))

    def test_stop_waiting_program_and_duplicate_session(self):
        sid = self.start('#include <stdio.h>\nint main(){puts("ready");getchar();}', "c")
        self.wait(sid, lambda s: "ready" in self.output(s))
        status, _ = self.request("POST", "/sessions", {"language": "c", "code": "int main(){}", "memoryMb": 256, "cpuMs": 2000})
        self.assertEqual(status, 429)
        self.assertEqual(self.request("DELETE", f"/sessions/{sid}")[0], 200)
        session = self.wait(sid, lambda s: s.done)
        self.assertEqual(session.events[-1]["reason"], "stopped")

    def test_immediate_stop_during_startup(self):
        sid = self.start('#include <iostream>\nint main(){for(;;){}}')
        self.request("DELETE", f"/sessions/{sid}")
        session = self.wait(sid, lambda s: s.done, seconds=5)
        self.assertEqual(session.events[-1]["reason"], "stopped")

    def test_cpu_limit_and_output_limit(self):
        sid = self.start('int main(){for(;;){}}', "c", cpu_ms=100)
        session = self.wait(sid, lambda s: s.done)
        self.assertEqual(session.events[-1]["reason"], "timeout")
        sid = self.start('#include <stdio.h>\nint main(){for(;;)puts("123456789012345678901234567890");}', "c")
        session = self.wait(sid, lambda s: s.done)
        self.assertLessEqual(session.output_size, runner.OUTPUT_LIMIT)
        self.assertTrue(any(e["type"] == "error" for e in session.events))

    def test_disconnect_cleanup_and_input_limit(self):
        sid = self.start('#include <stdio.h>\nint main(){puts("ready");getchar();}', "c")
        self.wait(sid, lambda s: "ready" in self.output(s))
        self.assertEqual(self.request("POST", f"/sessions/{sid}", {"text": "x" * 65537})[0], 413)
        session = runner.sessions[sid]
        with session.condition:
            session.last_seen = time.monotonic() - runner.DISCONNECT_SECONDS - 1
        session.thread.join(timeout=5)
        self.assertTrue(session.done)

    @unittest.skipUnless(os.environ.get("PYTHON_HOME"), "set PYTHON_HOME to installed Python 3.12 tree")
    def test_python_prompt_before_input(self):
        sid = self.start('name=input("名字？")\nprint("你好，"+name)', "python")
        self.wait(sid, lambda s: "名字？" in self.output(s))
        self.request("POST", f"/sessions/{sid}", {"text": "小明\n"})
        session = self.wait(sid, lambda s: s.done)
        self.assertIn("你好，小明", self.output(session))

    @unittest.skipUnless(os.environ.get("NODE_HOME"), "set NODE_HOME to installed Node tree")
    def test_node_readline_and_read_to_eof(self):
        sid = self.start('const r=require("readline").createInterface({input:process.stdin});'
                         'console.log("ready");r.on("line",s=>{console.log("echo:"+s);r.close();process.stdin.destroy();});', "javascript")
        self.wait(sid, lambda s: "ready" in self.output(s))
        self.request("POST", f"/sessions/{sid}", {"text": "hello\n"})
        session = self.wait(sid, lambda s: s.done)
        self.assertIn("echo:hello", self.output(session))
        sid = self.start('console.log(require("fs").readFileSync(0,"utf8"));', "javascript")
        self.wait(sid, lambda s: s.state == "running")
        self.request("POST", f"/sessions/{sid}", {"text": "abc\n", "eof": True})
        session = self.wait(sid, lambda s: s.done)
        self.assertIn("abc", self.output(session))


if __name__ == "__main__":
    unittest.main()
