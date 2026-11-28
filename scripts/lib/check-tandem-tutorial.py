"""Independent exhaustive and maximum-size regressions for b004; Linux only."""
import hashlib
import itertools
import json
import pathlib
import random
import runpy
import subprocess
import sys
import tempfile
import time

if sys.platform == "win32":
    raise SystemExit("Run in WSL kali-linux/Linux; never generate Windows test executables.")

root = pathlib.Path(__file__).resolve().parents[2]
lesson = next(x for x in json.loads((root / "src/lib/newProblemLessons/data/practice1.json").read_text()) if x["code"] == "b004")

# This oracle enumerates every period and every start. It does not use the
# lesson's sparse-table queries or periodic-boundary enumeration.
quadratic_cpp = r"""
#include <bits/stdc++.h>
using namespace std;
pair<string,int> solve(const string &s) {
    int n=s.size(); vector<int> sa(n), rank(n), nextRank(n);
    iota(sa.begin(),sa.end(),0);
    for(int i=0;i<n;i++) rank[i]=(unsigned char)s[i];
    for(int width=1;width<n;width*=2) {
        auto key=[&](int i){return pair<int,int>{rank[i],i+width<n?rank[i+width]:-1};};
        sort(sa.begin(),sa.end(),[&](int a,int b){return key(a)<key(b);});
        nextRank[sa[0]]=0;
        for(int j=1;j<n;j++) nextRank[sa[j]]=nextRank[sa[j-1]]+(key(sa[j-1])!=key(sa[j]));
        rank=nextRank; if(rank[sa.back()]==n-1) break;
    }
    int best=1,length=n,position=0;
    for(int period=1;period<=n/2;period++) {
        int run=0;
        for(int i=n-period-1;i>=0;i--) {
            run=s[i]==s[i+period]?run+1:0;
            int count=1+run/period;
            if(count>best || (count==best && (period>length || (period==length && rank[i]<rank[position])))) {
                best=count;length=period;position=i;
            }
        }
    }
    return {s.substr(position,length),best};
}
int main(){int n;string s;while(cin>>n>>s){auto [unit,count]=solve(s);cout<<unit<<'\n'<<count<<'\n';}}
"""


def brute(text):
    best_count, best_length, best_unit = 1, len(text), text
    for width in range(1, len(text) // 2 + 1):
        for start in range(len(text) - width + 1):
            unit = text[start:start + width]
            count = 1
            while text[start + count * width:start + (count + 1) * width] == unit:
                count += 1
            if count > best_count or count == best_count and (width > best_length or width == best_length and unit < best_unit):
                best_count, best_length, best_unit = count, width, unit
    return best_unit, best_count


def run(command, data):
    result = subprocess.run(command, input=data, text=True, capture_output=True, timeout=30)
    assert result.returncode == 0, result.stderr
    return result.stdout.splitlines()


with tempfile.TemporaryDirectory(prefix="itouoj-tandem-", dir="/tmp") as folder:
    folder = pathlib.Path(folder)
    python = folder / "lesson.py"
    python.write_text(lesson["python"], encoding="utf-8")
    solve = runpy.run_path(str(python))["solve"]
    sources = [("lesson", lesson["cpp"]), ("oracle", quadratic_cpp)]
    for name, source in sources:
        path = folder / (name + ".cpp")
        path.write_text(source, encoding="utf-8")
        subprocess.run(["g++", "-std=c++17", "-O2", str(path), "-o", str(folder / name)], check=True, capture_output=True, timeout=120)
    small = []
    for n in range(1, 9):
        for letters in itertools.product("abc", repeat=n):
            text = "".join(letters)
            expected = brute(text)
            unit, count = solve(text.encode())
            assert (unit.decode(), count) == expected, (text, expected, unit, count)
            small.append((text, expected))
    data = "".join(f"{len(text)}\n{text}\n" for text, _ in small)
    for name in ["lesson", "oracle"]:
        lines = run([str(folder / name)], data)
        assert len(lines) == len(small) * 2
        for index, (text, expected) in enumerate(small):
            assert (lines[index * 2], int(lines[index * 2 + 1])) == expected, (name, text, expected)
    rng = random.Random(20261103)
    large = ["a" * 9999, ("ab" * 5000)[:9999], ("abcde" * 2000)[:9999], "".join(rng.choices("abc", k=9999)), "".join(rng.choices("abcdefghijklmnopqrstuvwxyz", k=9999)), ("a" * 4998 + "b") * 2 + "c"]
    timings = []
    for text in large:
        data = f"{len(text)}\n{text}\n"
        expected = run([str(folder / "oracle")], data)
        assert run([str(folder / "lesson")], data) == expected
        start = time.monotonic()
        unit, count = solve(text.encode())
        elapsed = time.monotonic() - start
        assert [unit.decode(), str(count)] == expected
        timings.append(round(elapsed, 4))
print(json.dumps({"code": "b004", "cppSha256": hashlib.sha256(lesson["cpp"].encode()).hexdigest(), "pythonSha256": hashlib.sha256(lesson["python"].encode()).hexdigest(), "ternaryStringsExhaustedPerLanguage": len(small), "maximumSizeCasesPerLanguage": len(large), "maximumN": 9999, "pythonObservedSeconds": timings, "failures": 0, "timingNote": "Observed Linux host timings, not a production judge verdict; no host-dependent timing assertion."}))
