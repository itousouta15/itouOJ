"""Execute the actual lesson programs; no network or judge submissions.

Called by verify-cpe-lessons.mjs with lesson JSON on stdin. Python subprocesses
avoid Node's intermittent Windows spawn errors for freshly linked executables.
"""
import argparse
from contextlib import nullcontext
import json
import pathlib
import re
import subprocess
import sys
import tempfile


def normalized(text):
    # Preserve internal spaces and blank lines (including ASCII diagrams).
    return "\n".join(line.rstrip(" \t") for line in text.replace("\r\n", "\n").split("\n")).rstrip("\n")


def run(command, **options):
    result = subprocess.run(command, text=True, encoding="utf-8", capture_output=True, **options)
    if result.returncode:
        raise RuntimeError(f"Command failed ({result.returncode}): {command[0]}\n{result.stderr[-6000:]}")
    return result.stdout


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--cxx")
    parser.add_argument("--temp-root")
    parser.add_argument("--no-pch", action="store_true")
    parser.add_argument("--compile-only-cxx", action="store_true")
    args = parser.parse_args()
    lessons = json.load(sys.stdin)
    sample_count = 0
    headers = "algorithm array bitset cassert cctype cerrno cfenv cfloat chrono climits cmath complex cstdint cstdio cstdlib cstring deque functional iomanip iostream iterator limits list map memory numeric optional queue random regex set sstream stack string tuple type_traits unordered_map unordered_set utility vector".split()
    standard_headers = "\n".join("#include <" + header + ">" for header in headers)
    workspace = tempfile.TemporaryDirectory(prefix="itouoj-cpe-check-", dir=args.temp_root) if args.cxx else nullcontext(None)
    with workspace as folder:
        root = pathlib.Path(folder) if folder else None
        precompiled = None
        if args.cxx and sys.platform == "win32" and "clang" in pathlib.Path(args.cxx).name.lower() and not args.no_pch:
            common = root / "common.hpp"
            common.write_text(standard_headers + "\n", encoding="utf-8")
            precompiled = root / "common.pch"
            run([args.cxx, "-std=c++17", "-O2", "-x", "c++-header", str(common), "-o", str(precompiled)], timeout=180)
        for lesson in lessons:
            code = lesson["code"]
            executable = None
            if args.cxx:
                source = root / (code + ".cpp")
                executable = root / (code + (".exe" if sys.platform == "win32" else ""))
                cpp = lesson["cpp"]
                if sys.platform == "win32":
                    cpp = re.sub(r"#include\s*<bits/stdc\+\+\.h>", "" if precompiled else standard_headers, cpp)
                source.write_text(cpp, encoding="utf-8")
                compile_args = [args.cxx, "-std=c++17", "-O2"]
                if precompiled:
                    compile_args += ["-include-pch", str(precompiled)]
                run(compile_args + [str(source), "-o", str(executable)], timeout=180)
            for index, sample in enumerate(lesson["samples"], 1):
                programs = [("Python", [sys.executable, "-c", lesson["python"]])]
                if executable and not args.compile_only_cxx:
                    programs.append(("C++", [str(executable)]))
                for language, command in programs:
                    actual = run(command, input=sample["input"], timeout=30)
                    if normalized(actual) != normalized(sample["output"]):
                        raise AssertionError(f"{code} {language} sample {index}\nExpected: {sample['output']!r}\nActual: {actual!r}")
                sample_count += 1
            cpp_status = " (C++ compiled only)" if executable and args.compile_only_cxx else " (C++)" if executable else ""
            print(f"{code}: {len(lesson['samples'])} public samples passed (Python){cpp_status}", flush=True)
    print(f"Validated {len(lessons)} programs and {sample_count} public samples.", flush=True)


if __name__ == "__main__":
    main()
