"""Verify actual authored programs against public examples and independent cases.

Uses a Linux temporary directory. Never compiles unsigned Windows executables,
connects to a database, or sends judge submissions.
"""
import json
import hashlib
import pathlib
import subprocess
import sys
import tempfile
import time

if sys.platform == "win32":
    raise SystemExit("Run this helper in Linux/WSL; Windows binaries are prohibited.")


def normalized(text):
    return "\n".join(line.rstrip() for line in text.replace("\r\n", "\n").split("\n")).rstrip()


lessons = json.load(sys.stdin)
failures = []
programs = []
public_count = oracle_count = 0
started = time.monotonic()
with tempfile.TemporaryDirectory(prefix="itouoj-new-lessons-", dir="/tmp") as folder:
    root = pathlib.Path(folder)
    for lesson in lessons:
        code = lesson["code"]
        failure_start = len(failures)
        case_digest = hashlib.sha256()
        for kind in ["samples", "checks"]:
            case_digest.update(kind.encode())
            for case in lesson[kind]:
                for field in ["input", "output"]:
                    data = case[field].encode()
                    case_digest.update(len(data).to_bytes(8, "big"))
                    case_digest.update(data)
        source, executable, python = root / (code + ".cpp"), root / code, root / (code + ".py")
        source.write_text(lesson["cpp"], encoding="utf-8")
        python.write_text(lesson["python"], encoding="utf-8")
        compile_result = subprocess.run(["g++", "-std=c++17", "-O2", str(source), "-o", str(executable)], capture_output=True, text=True, timeout=120)
        if compile_result.returncode:
            failures.append({"code": code, "language": "C++", "compilation": compile_result.stderr[-5000:]})
        for kind in ["samples", "checks"]:
            for i, case in enumerate(lesson[kind]):
                if kind == "samples":
                    public_count += 1
                else:
                    oracle_count += 1
                commands = [("Python", [sys.executable, str(python)])]
                if compile_result.returncode == 0:
                    commands.append(("C++", [str(executable)]))
                for language, command in commands:
                    try:
                        result = subprocess.run(command, input=case["input"], capture_output=True, text=True, timeout=30)
                        if result.returncode or normalized(result.stdout) != normalized(case["output"]):
                            failures.append({"code": code, "language": language, "kind": kind, "case": i + 1, "input": case["input"][:2000], "expected": case["output"][:2000], "actual": result.stdout[:2000], "stderr": result.stderr[-2000:], "returncode": result.returncode})
                    except subprocess.TimeoutExpired:
                        failures.append({"code": code, "language": language, "kind": kind, "case": i + 1, "error": "30 second timeout"})
        status = "PASS" if len(failures) == failure_start else "FAIL"
        print(f"{code}: {status}; {len(lesson['samples'])} samples, {len(lesson['checks'])} independent cases checked in Python/C++", file=sys.stderr, flush=True)
        programs.append({"code": code, "cppSha256": hashlib.sha256(lesson["cpp"].encode()).hexdigest(), "pythonSha256": hashlib.sha256(lesson["python"].encode()).hexdigest(), "casesSha256": case_digest.hexdigest(), "publicSamples": len(lesson["samples"]), "independentCases": len(lesson["checks"]), "status": "pass" if len(failures) == failure_start else "fail"})
report = {"schemaVersion": 1, "platform": sys.platform, "pythonVersion": sys.version, "compiler": "g++ -std=c++17 -O2", "compilerVersion": subprocess.check_output(["g++", "--version"], text=True).splitlines()[0], "tutorials": len(lessons), "publicSamplesPerLanguage": public_count, "independentCasesPerLanguage": oracle_count, "seconds": round(time.monotonic() - started, 2), "programs": programs, "failures": failures}
print("REPORT_JSON=" + json.dumps(report, ensure_ascii=False))
if failures:
    raise SystemExit(1)
