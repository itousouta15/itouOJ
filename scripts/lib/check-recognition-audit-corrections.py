"""Independent regressions; no database, network or judge submissions."""
import argparse
import contextlib
import io
import json
import pathlib
import random
import re
import subprocess
import sys
import tempfile
import tracemalloc

parser = argparse.ArgumentParser()
parser.add_argument("--python-only", action="store_true")
parser.add_argument("--cxx-only", action="store_true")
args = parser.parse_args()
payload = json.load(sys.stdin)
questions = {(q["file"], q["number"]): q for q in payload["questions"]}
lesson = payload["lesson"]
rng = random.Random(20261031)
numbers = ["11", "1122", "1", "00", "0011", "9" * 1000]
numbers += ["".join(str(rng.randrange(10)) for _ in range(rng.randrange(1, 1001))).lstrip("0") or "1" for _ in range(250)]
expected = "".join(s + (" is a multiple of 11.\n" if int(s) % 11 == 0 else " is not a multiple of 11.\n") for s in numbers)
input_text = "\n\n".join(numbers) + "\n0\n999\n"

def run(command, text=""):
    p = subprocess.run(command, input=text, text=True, capture_output=True, timeout=60)
    if p.returncode:
        raise AssertionError(p.stderr)
    return p.stdout

if not args.cxx_only:
    assert run([sys.executable, "-c", lesson["python"]], input_text) == expected

    class StreamingInput:
        def __init__(self, count):
            self.count = count
        def read(self, *unused):
            raise AssertionError("Reference program must not buffer the whole input")
        def __iter__(self):
            for _ in range(self.count):
                yield "1" * 1000 + "\n"
            yield "0\n"
            raise AssertionError("Reference program must stop at the sentinel")

    class Sink:
        def write(self, value):
            return len(value)
        def flush(self):
            pass

    def peak(count):
        before = sys.stdin
        sys.stdin = StreamingInput(count)
        try:
            tracemalloc.start()
            with contextlib.redirect_stdout(Sink()):
                exec(lesson["python"], {})
            return tracemalloc.get_traced_memory()[1]
        finally:
            tracemalloc.stop()
            sys.stdin = before

    small, large = peak(100), peak(8000)
    assert large < small + 128 * 1024, (small, large)
    print(f"a646 Python: {len(numbers)} oracle cases; streaming/sentinel verified; peak bytes {small}/{large} for 100/8000 queries")

if not args.python_only:
    if sys.platform == "win32":
        raise RuntimeError("Compile and run C/C++ in Linux/WSL only")
    with tempfile.TemporaryDirectory(prefix="recognition-corrections-") as folder:
        root = pathlib.Path(folder)

        def compile_program(name, source, compiler="g++", syntax_only=False):
            file = root / (name + (".c" if compiler == "gcc" else ".cpp"))
            file.write_text("#include <stdio.h>\n#include <string.h>\n" + source, encoding="utf-8")
            executable = root / name
            command = [compiler, "-std=c11" if compiler == "gcc" else "-std=c++17", "-O0"]
            command += ["-fsyntax-only", str(file)] if syntax_only else [str(file), "-o", str(executable)]
            run(command)
            return [str(executable)]

        q = questions[("apcs-2017-03", 17)]
        cmd = compile_program("loops", q["code"] + '\nint main(){for(int n=1;n<=100;n++)printf("%d\\n",F(n));}')
        assert list(map(int, run(cmd).split())) == [n * (n + 1) // 2 * n.bit_length() for n in range(1, 101)]
        q = questions[("apcs-2020-10-1", 3)]
        assert run(compile_program("sieve", "int main(){" + q["code"] + "}")) == "0"
        q = questions[("apcs-2020-10-1", 7)]
        first, second = q["code"].split("// 程式碼2")
        first = first.replace("char f(", "char original(")
        second = second.replace("char f(", "char simplified(").replace("____________________", q["options"][q["answerIndex"]].strip("`"))
        body = '\nint main(){for(int x=-20;x<=40;x++)for(int y=-20;y<=40;y++)if(original(x,y)!=simplified(x,y))return 1;}'
        for compiler in ["gcc", "g++"]:
            assert run(compile_program("boolean", first + second + body, compiler)) == ""
        q = questions[("apcs-2021-01-a", 5)]
        source = q["code"].replace("__________", "(n+1)/2")
        body = '\nint main(){printf("%d %d %d",f(14),f(10),f(6));}'
        for compiler in ["gcc", "g++"]:
            assert run(compile_program("recursion", source + body, compiler)) == "28 21 12"
        q = questions[("apcs-2021-01-a", 13)]
        assert run(compile_program("operators", q["code"])).strip() == q["options"][q["answerIndex"]]
        q = questions[("apcs-2021-01-a", 14)]
        a, b = q["options"][q["answerIndex"]].split(",")
        source = q["code"].replace("_____", a.strip(), 1).replace("_____", b.strip(), 1)
        index = source.rfind("}")
        source = source[:index] + 'for(int r=0;r<n;r++)for(int c=0;c<n;c++)printf("%d ",mat[r][c]);' + source[index:]
        for compiler in ["gcc", "g++"]:
            cmd = compile_program("magic", source, compiler)
            for n in range(1, 100, 2):
                cells = list(map(int, run(cmd, str(n) + "\n").split()))
                assert sorted(cells) == list(range(1, n*n+1))
                matrix = [cells[i*n:(i+1)*n] for i in range(n)]
                assert matrix[0][n//2] == 1
                target = n * (n*n+1) // 2
                assert all(sum(row) == target for row in matrix)
                assert all(sum(matrix[r][c] for r in range(n)) == target for c in range(n))
                assert sum(matrix[i][i] for i in range(n)) == target
                assert sum(matrix[i][n-1-i] for i in range(n)) == target
        q = questions[("apcs-2021-01-b", 4)]
        source = 'int main(){' + q["code"] + 'for(int i=0;i<10;i++)printf("%d ",num[i]);}'
        for compiler in ["gcc", "g++"]:
            assert run(compile_program("rotate", source, compiler), "10 9 8 7 6 5 4 3 2 1\n").split() == "6 5 4 3 2 1 10 9 8 7".split()
        q = questions[("apcs-2021-01-b", 7)]
        # Intentionally a bounds-error exercise: syntax-check only, never execute UB.
        for compiler in ["gcc", "g++"]:
            compile_program("bounds", "int main(){" + q["code"] + "}", compiler, syntax_only=True)
        assert q["answerIndex"] == 3
        assert "10, 9, 7" in q["code"] and "b[ a[i] ]" in q["code"]
        assert "b[10]" in q["explanation"]
        assert run(compile_program("a646", lesson["cpp"]), input_text) == expected
        print("Linux C/C++: 8 corrected recognition questions checked; 100 loop cases, 3721 boolean pairs, all 50 odd magic-square sizes in both languages; a646 oracle cases passed")
