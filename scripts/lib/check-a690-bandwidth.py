"""Independent min-cut oracle and in-spec 32-bit overflow regression for a690.

UVa 820: https://onlinejudge.org/external/8/820.pdf
Parallel connections are allowed; each capacity <= 1000, no count bound given.
All binaries and generated large inputs live only in a Linux temporary folder.
"""
import json
import pathlib
import random
import subprocess
import sys
import tempfile


def min_cut(n, source, sink, edges):
    """Enumerate cuts, independently of the tutorial's augmenting-path method."""
    middle = [v for v in range(n) if v not in (source, sink)]
    answer = None
    for mask in range(1 << len(middle)):
        side = {source} | {v for bit, v in enumerate(middle) if mask >> bit & 1}
        capacity = sum(c for u, v, c in edges if (u in side) != (v in side))
        answer = capacity if answer is None else min(answer, capacity)
    return answer


def encode(n, source, sink, edges):
    return (f"{n}\n{source + 1} {sink + 1} {len(edges)}\n"
            + "".join(f"{u + 1} {v + 1} {c}\n" for u, v, c in edges))


def expected_output(values):
    return "".join(f"Network {i}\nThe bandwidth is {value}.\n\n"
                   for i, value in enumerate(values, 1))


def main():
    if sys.platform != "linux":
        raise SystemExit("Run in Linux/WSL, never compile or execute Windows .exe files.")
    payload = json.loads(pathlib.Path(sys.argv[1]).read_text() if len(sys.argv) > 1
                         else sys.stdin.read())
    rng = random.Random(690)
    cases = [
        (2, 0, 1, []),
        (2, 0, 1, [(0, 1, 0)]),
        (4, 0, 3, [(0, 1, 1000), (2, 3, 1000)]),
        (3, 0, 2, [(0, 1, 3), (1, 2, 2), (0, 2, 1)]),
    ]
    for _ in range(300):
        n = rng.randint(2, 8)
        source, sink = rng.sample(range(n), 2)
        edges = []
        for _ in range(rng.randint(0, n * n * 2)):
            u, v = rng.sample(range(n), 2)
            edges.append((u, v, rng.choice([0, 1, 2, 999, 1000, rng.randint(0, 1000)])))
        cases.append((n, source, sink, edges))
    data = "".join(encode(*case) for case in cases) + "0\n"
    expected = expected_output([min_cut(*case) for case in cases])
    # At n=100, 98 independent two-hop paths plus a direct edge certify 99000.
    edges = [(0, 99, 1000)]
    for v in range(1, 99):
        edges.extend([(0, v, 1000), (v, 99, 1000)])
    maximum_n = encode(100, 0, 99, edges) + "0\n"
    with tempfile.TemporaryDirectory(prefix="a690-regression-", dir="/tmp") as tmp:
        root = pathlib.Path(tmp)
        cpp, py, executable = root / "solution.cpp", root / "solution.py", root / "solution"
        cpp.write_text(payload["cpp"])
        py.write_text(payload["python"])
        subprocess.run(["g++", "-std=c++17", "-O2", "-fsanitize=undefined",
                        "-fno-sanitize-recover=undefined", str(cpp), "-o", str(executable)],
                       check=True, timeout=60)
        # Just above INT_MAX using only legal capacities (1000) and parallel edges.
        # A single-edge cut proves the answer, not the other language's program.
        count = (2**31 - 1) // 1000 + 1
        overflow = root / "parallel.in"
        with overflow.open("w") as stream:
            stream.write(f"2\n1 2 {count}\n")
            block = "1 2 1000\n" * 10000
            for _ in range(count // 10000):
                stream.write(block)
            stream.write("1 2 1000\n" * (count % 10000) + "0\n")
        for language, command in [("C++ (UBSan)", [str(executable)]),
                                  ("Python", [sys.executable, str(py)])]:
            def check(input_text, want, label):
                result = subprocess.run(command, input=input_text, text=True,
                                        capture_output=True, timeout=90, check=True)
                assert result.stdout.split() == want.split(), (language, label, result.stdout[:500])
                assert not result.stderr, (language, label, result.stderr)
            for sample in payload["samples"]:
                check(sample["input"], sample["output"], "public sample")
            check(data, expected, "304 independently enumerated min-cuts")
            check(maximum_n, expected_output([99000]), "maximum n certificate")
            with overflow.open() as stream:
                result = subprocess.run(command, stdin=stream, text=True,
                                        capture_output=True, timeout=90, check=True)
            assert result.stdout == expected_output([count * 1000]), (language, result.stdout)
            assert not result.stderr, (language, result.stderr)
            print(f"{language}: {len(payload['samples'])} public samples + 304 min-cut cases + "
                  f"n=100 certificate + {count} parallel connections (answer {count * 1000}) passed.")


if __name__ == "__main__":
    main()
