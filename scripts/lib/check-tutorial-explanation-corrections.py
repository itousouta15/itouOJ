"""Execute authored snippets and independent expense oracles using Linux binaries."""
import argparse
import itertools
import json
import pathlib
import random
import re
import subprocess
import sys
import tempfile


def run(command, data=""):
    result = subprocess.run(command, input=data, text=True, capture_output=True, timeout=60)
    if result.returncode:
        raise AssertionError(f"{command[0]} failed: {result.stderr[-4000:]}")
    return result.stdout.replace("\r\n", "\n").rstrip("\n")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--cxx", default="g++")
    args = parser.parse_args()
    if sys.platform != "linux":
        parser.error("Use Linux/WSL to compile and execute; do not create Windows executables.")
    payload = json.load(sys.stdin)
    questions = {q["number"]: q for q in payload["questions"]}
    snippets = {}
    for number in (6, 13):
        blocks = re.findall(r"```cpp\n(.*?)\n```", questions[number]["explanation"], re.S)
        assert len(blocks) == 1, f"question {number}: expected one authored snippet"
        snippets[number] = blocks[0]

    with tempfile.TemporaryDirectory(prefix="itouoj-explanation-check-", dir="/tmp") as folder:
        root = pathlib.Path(folder)

        def compiled(name, source):
            path = root / (name + ".cpp")
            binary = root / name
            path.write_text(source, encoding="utf8")
            run([args.cxx, "-std=c++17", "-O2", str(path), "-o", str(binary)])
            return [str(binary)]

        linked = """#include <cassert>
#include <vector>
struct element { int data; int next; };
void removeNext(element list[], int current) {
    if (list[current].next != -1) {
""" + snippets[6] + """
    }
}
int main() {
    for (int n = 1; n <= 20; ++n) for (int current = 0; current < n; ++current) {
        std::vector<element> a(n);
        for (int i = 0; i < n; ++i) a[i] = {100 + i, i + 1 < n ? i + 1 : -1};
        removeNext(a.data(), current);
        for (int i = 0; i < n; ++i) {
            int expected = i + 1 < n ? i + 1 : -1;
            if (i == current) expected = current + 2 < n ? current + 2 : -1;
            assert(a[i].next == expected && a[i].data == 100 + i);
        }
    }
    element example[4] = {{0,-1},{1,2},{2,-1},{3,1}};
    removeNext(example, 3);
    assert(example[3].next == 2 && example[2].next == -1 && example[1].data == 1);
}
"""
        run(compiled("linked-list", linked))
        gcd = """#include <cassert>
#include <numeric>
int solve(int i, int j) {
    int k;
    while (i % j != 0) {
""" + snippets[13] + """
    }
    return j;
}
int main() {
    assert(solve(76,48) == 4);
    for (int a = 1; a <= 100; ++a) for (int b = 1; b <= 100; ++b)
        assert(solve(a,b) == std::gcd(a,b));
}
"""
        run(compiled("gcd", gcd))

        rng = random.Random(20261022663)
        cases = [[1000, 2000], [1500, 1501, 300, 301], [0], [0, 0],
                 [1000000, 0], [1, 2, 3], [1000000] * 1000,
                 [0] * 500 + [1000000] * 500]
        cases += [[rng.randrange(51) for _ in range(rng.randrange(1, 8))] for _ in range(200)]
        inputs, outputs = [], []
        for amounts in cases:
            n = len(amounts)
            low, remainder = divmod(sum(amounts), n)
            # Exhaust all assignments of rounded-up target burdens, not the
            # reference programs' max(need, give) formula.
            best = min(
                sum(max(0, low + (i in high) - value) for i, value in enumerate(amounts))
                for high in itertools.combinations(range(n), remainder)
            )
            inputs += [str(n)] + [f"{v // 100}.{v % 100:02d}" for v in amounts]
            outputs.append(f"${best // 100}.{best % 100:02d}")
        inputs.append("0")
        expected = "\n".join(outputs)
        lesson = payload["lesson"]
        commands = [[sys.executable, "-c", lesson["python"]], compiled("a663", lesson["cpp"])]
        for command in commands:
            assert run(command, "\n".join(inputs) + "\n") == expected
        print(f"Recognition snippets: 211 linked-list cases and 10001 GCD cases passed (Linux C++).")
        print(f"a663: {len(cases)} independent cases passed (Python and Linux C++).")


if __name__ == "__main__":
    main()
