"""Compile the independent references only as Linux binaries, in Linux /tmp."""
import json
import pathlib
import subprocess
import sys
import tempfile

if sys.platform == "win32":
    raise RuntimeError("Use WSL/Linux; Windows C++ binaries are prohibited")
specs = json.load(sys.stdin)
sources = pathlib.Path(__file__).resolve().parents[1] / "fixtures" / "hackmd-three"
with tempfile.TemporaryDirectory(prefix="itouoj-hackmd-three-") as folder:
    for spec in specs:
        executable = pathlib.Path(folder) / spec["key"]
        compile_result = subprocess.run(
            ["g++", "-std=c++17", "-O2", str(sources / (spec["key"] + ".cpp")), "-o", str(executable)],
            capture_output=True, text=True, timeout=60,
        )
        assert compile_result.returncode == 0, compile_result.stderr
        for i, case in enumerate(spec["cases"]):
            result = subprocess.run([str(executable)], input=case["input"], capture_output=True, text=True, timeout=30)
            assert result.returncode == 0, result.stderr
            assert result.stdout.rstrip("\r\n") == case["output"], (spec["key"], i, result.stdout, case["output"])
        print(f'{spec["key"]}: {len(spec["cases"])} Linux C++ cases passed')
