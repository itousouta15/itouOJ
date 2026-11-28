"""End-to-end sandbox benchmark/regression. Run as root on Linux with a built jail.

Example: python3 test/test_compile_cache.py --server ./sandbox-server --jail ./jail --port 18090 --mode cache
Build the server with -DPORT=18090 so this test never touches the live judge.
"""

import argparse
import json
import os
import statistics
import shutil
import subprocess
import tempfile
import time
import urllib.error
import urllib.request
from pathlib import Path


SOURCE = '#include <iostream>\nint main() { int n; std::cin >> n; std::cout << n * 2 << "\\n"; }\n'


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--server", type=Path, required=True)
    parser.add_argument("--jail", type=Path, required=True)
    parser.add_argument("--port", type=int, default=18090)
    parser.add_argument("--mode", choices=("legacy", "cache"), required=True)
    parser.add_argument("--samples", type=int, default=4)
    args = parser.parse_args()
    assert 2 <= args.samples <= 100

    server = args.server.resolve(strict=True)
    jail = args.jail.resolve(strict=True)
    with tempfile.TemporaryDirectory(prefix="oj-cache-test-") as work:
        shutil.copy2(jail, Path(work) / "jail")
        def start_server():
            child = subprocess.Popen([str(server)], cwd=work, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
            for attempt in range(50):
                if child.poll() is not None:
                    raise RuntimeError(f"sandbox-server exited: {child.stderr.read().decode()}")
                try:
                    urllib.request.urlopen(url, timeout=1)
                except urllib.error.HTTPError as error:
                    if error.code == 405:
                        return child
                except urllib.error.URLError:
                    time.sleep(0.1)
            child.terminate()
            child.communicate(timeout=5)
            raise RuntimeError("sandbox-server did not start")

        url = f"http://127.0.0.1:{args.port}/api/v2/execute"
        process = start_server()
        compiled_binary = None
        handle = None
        requests = 0
        responses = 0
        timings = []
        peak_kb = 0

        def server_cpu_ms():
            fields = Path(f"/proc/{process.pid}/stat").read_text().rsplit(")", 1)[1].split()
            return round((int(fields[11]) + int(fields[12])) * 1000 / os.sysconf("SC_CLK_TCK"))

        def sample_peak():
            nonlocal peak_kb
            status = Path(f"/proc/{process.pid}/status").read_text()
            peak_kb = max(peak_kb, int(next(line.split()[1] for line in status.splitlines()
                                       if line.startswith("VmHWM:"))))

        def execute(source, number, *, token=None, binary=None, expected=None,
                    stdin=None, timeout=1500, memory=256 * 1024 * 1024,
                    check=True, language="c++"):
            nonlocal requests, responses
            payload = {
                "language": language, "version": "10.2.0",
                "files": [{"name": "main.cpp", "content": source}],
                "stdin": f"{number}\n" if stdin is None else stdin,
                "run_timeout": timeout, "run_memory_limit": memory,
                "compile_timeout": 15000,
            }
            if args.mode == "cache":
                payload["want_compiled_handle"] = True
                if token:
                    payload["compiled_handle"] = token
            elif binary:
                payload["precompiled_binary"] = binary
            body = json.dumps(payload).encode()
            requests += len(body)
            start = time.monotonic()
            request = urllib.request.Request(url, data=body, headers={"Content-Type": "application/json"})
            with urllib.request.urlopen(request, timeout=40) as response:
                data = response.read()
            timings.append(round((time.monotonic() - start) * 1000))
            responses += len(data)
            result = json.loads(data)
            if check:
                assert result["compile"]["code"] == 0, result
                assert result["run"]["code"] == 0, result
                assert result["run"]["stdout"].strip() == str(expected if expected is not None else number * 2), result
            return result

        try:
            start_cpu_ms = server_cpu_ms()
            cleanup_times = []
            for number in range(1, args.samples + 1):
                result = execute(SOURCE, number, token=handle, binary=compiled_binary)
                if "metrics" in result:
                    cleanup_times.append(result["metrics"]["cleanup_ms"])
                if args.mode == "cache":
                    handle = result.get("compiled_handle")
                    assert handle and len(handle) == 32, result
                    assert "compiled_binary" not in result
                    assert result["compiled_cache_hit"] == (number != 1), result
                else:
                    compiled_binary = result.get("compiled_binary") or compiled_binary
                    assert compiled_binary

            sample_peak()
            benchmark = {"request_bytes": requests, "response_bytes": responses,
                         "latency_ms": timings[:], "server_peak_rss_kb": peak_kb,
                         "server_cpu_ms": server_cpu_ms() - start_cpu_ms,
                         "warm_median_ms": round(statistics.median(timings[1:]), 1),
                         "cleanup_median_ms": round(statistics.median(cleanup_times[1:]), 1) if cleanup_times else None}

            if args.mode == "cache":
                # A handle must never execute an executable built from different source.
                altered = SOURCE.replace("n * 2", "n * 3")
                result = execute(altered, 7, token=handle, expected=21)
                assert result["run"]["stdout"].strip() == "21"
                assert result["compiled_handle"] != handle
                assert result["compiled_cache_hit"] is False
                assert execute(SOURCE, 10, token=handle)["compiled_cache_hit"] is True
                # Unknown/evicted handles must fall back to compiling, not IE/CE.
                result = execute(SOURCE, 8, token="0" * 32)
                assert result["compiled_handle"]
                assert result["compiled_cache_hit"] is False
                # A large input stays a normal request; compiled executables
                # are not needlessly attached to it.
                execute(SOURCE, 2, token=handle, stdin="2 " + " " * 1_000_000 + "\n", expected=4)
                ce = execute("int main(\n", 1, token=handle, check=False)
                assert ce["compile"]["code"] != 0 and "compiled_handle" not in ce
                re = execute("int main() { return 7; }", 1, check=False)
                assert re["compile"]["code"] == 0 and re["run"]["code"] == 7
                tle = execute("int main() { volatile int i=0; while (1) i++; }", 1,
                              timeout=200, check=False)
                assert tle["run"]["signal"] == "SIGKILL", tle
                mle = execute("volatile char a[64*1024*1024]; int main() { for (int i=0;i<64*1024*1024;i+=4096) a[i]=1; }",
                              1, memory=8 * 1024 * 1024, check=False)
                assert mle["run"]["signal"] == "SIGKILL", mle
                execute("#include <stdio.h>\nint main(){int n;scanf(\"%d\",&n);printf(\"%d\\n\",n*2);}",
                        5, language="c")
                execute("import sys\nprint(int(sys.stdin.readline()) * 2)\n", 5, language="python")
                execute("console.log(Number(require('fs').readFileSync(0, 'utf8')) * 2)",
                        5, language="javascript")
                # A server restart also invalidates handles safely.
                sample_peak()
                process.terminate()
                process.communicate(timeout=5)
                process = start_server()
                result = execute(SOURCE, 9, token=handle)
                assert result["compiled_cache_hit"] is False
                assert result["compiled_handle"] != handle
                cache_files = list((Path(work) / "work" / "compiled-cache").iterdir())
                assert len(cache_files) == 1, cache_files

            sample_peak()
            print(json.dumps({"mode": args.mode, "benchmark": benchmark,
                              "regression_cases": len(timings) - len(benchmark["latency_ms"]),
                              "regression_peak_rss_kb": peak_kb}))
        finally:
            process.terminate()
            try:
                process.communicate(timeout=5)
            except subprocess.TimeoutExpired:
                process.kill()
                process.communicate()


if __name__ == "__main__":
    main()
