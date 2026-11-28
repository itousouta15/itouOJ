"""Read-only reference benchmark. Run with Linux Python >=3.12 in WSL.

All generated inputs, sources and executables live in a Linux /tmp directory.
Writes only the two a980 sidecar JSON files beside this script.
"""
import hashlib
from datetime import datetime, timezone
import json
import math
import os
from pathlib import Path
import platform
import random
import re
import subprocess
import sys
import tempfile
import time
import urllib.request

BASE = Path(__file__).resolve().parent
ROOT = BASE.parents[2]
if sys.platform != "linux":
    raise SystemExit("Linux only: run in WSL kali-linux; never compile or execute Windows test binaries.")
if not hasattr(math, "sumprod"):
    raise SystemExit("Python >=3.12 with integer math.sumprod is required.")

PACKED_TRIALS = r'''import sys, random, math
from array import array
from math import sumprod

def numbers():
    for line in sys.stdin.buffer:
        yield from map(int, line.split())

it = numbers()
sub, n, P = next(it), next(it), next(it)
A = [array("I", (next(it) for _ in range(n))) for _ in range(n)]
B = [array("I", (next(it) for _ in range(n))) for _ in range(n)]
T = math.ceil(42 / math.log(P))
# Each lane contains sum_{k,j} A[i,k]*B[k,j]*v[j].
# Its integer value is <=n*n*(P-1)^3; no lane can carry.
lane_bytes = ( (n*n*(P-1)**3).bit_length() + 7) // 8
lane_bits = 8*lane_bytes
rng = random.SystemRandom()
out = []

def solve(l, r, rows):
    if not rows:
        return
    if r-l == 1:
        column = array("I", (row[l] for row in B))
        for i in rows:
            value = sumprod(A[i], column) % P
            if value:
                out.append((i+1, l+1, value))
        return
    vectors = [int.from_bytes(b"".join(rng.randrange(P).to_bytes(lane_bytes, "little")
                                      for _ in range(T)), "little") for j in range(l, r)]
    w = [sumprod(row[l:r], vectors) for row in B]
    keep = []
    for i in rows:
        packed = sumprod(A[i], w)
        data = packed.to_bytes(lane_bytes*T, "little")
        if any(int.from_bytes(data[q:q+lane_bytes], "little") % P
               for q in range(0, len(data), lane_bytes)):
            keep.append(i)
    mid = (l+r)//2
    solve(l, mid, keep)
    solve(mid, r, keep)

solve(0, n, list(range(n)))
print("\n".join(" ".join(map(str, t)) for t in sorted(out)))
'''

PACKED_SHARED = r'''import sys, random, math
from array import array
from math import sumprod

def numbers():
    for line in sys.stdin.buffer:
        yield from map(int, line.split())

it = numbers()
sub, n, P = next(it), next(it), next(it)
A = [array("I", (next(it) for _ in range(n))) for _ in range(n)]
B = [array("I", (next(it) for _ in range(n))) for _ in range(n)]
T = math.ceil(42 / math.log(P))
width = ((n*n*(P-1)**3).bit_length()+7)//8
size = width*T
rng = random.SystemRandom()
vectors = []
inverses = []
for j in range(n):
    values = [rng.randrange(P) for _ in range(T)]
    vectors.append(int.from_bytes(b"".join(x.to_bytes(width,"little") for x in values),"little"))
    inverses.append(next(((t*width, pow(x,-1,P)) for t,x in enumerate(values) if x), (0,0)))
out = []

def nonzero(z):
    data = z.to_bytes(size,"little")
    return any(int.from_bytes(data[q:q+width],"little")%P for q in range(0,size,width))

def solve(l,r,w,rows):
    if not rows:
        return
    if r-l == 1:
        offset, inv = inverses[l]
        for i,z in rows:
            data = z.to_bytes(size,"little")
            value = int.from_bytes(data[offset:offset+width],"little")%P*inv%P
            if value:
                out.append((i+1,l+1,value))
        return
    mid=(l+r)//2
    v=vectors[l:mid]
    leftw=[sumprod(row[l:mid],v) for row in B]
    rightw=[x-y for x,y in zip(w,leftw)]
    left=[]
    right=[]
    for i,z in rows:
        a=sumprod(A[i],leftw)
        b=z-a
        if nonzero(a):
            left.append((i,a))
        if nonzero(b):
            right.append((i,b))
    solve(l,mid,leftw,left)
    solve(mid,r,rightw,right)

w=[sumprod(row,vectors) for row in B]
rows=[]
for i,row in enumerate(A):
    z=sumprod(row,w)
    if nonzero(z):
        rows.append((i,z))
solve(0,n,w,rows)
print("\n".join(" ".join(map(str,t)) for t in sorted(out)))
'''

PACKED_DETERMINISTIC = r'''import sys
from array import array
from math import sumprod
from struct import iter_unpack

def numbers():
    for line in sys.stdin.buffer:
        yield from map(int,line.split())

it=numbers()
sub,n,P=next(it),next(it),next(it)
A=[array("I",(next(it) for _ in range(n))) for _ in range(n)]
width=((n*(P-1)**2).bit_length()+7)//8
B=[int.from_bytes(b"".join(next(it).to_bytes(width,"little") for _ in range(n)),"little") for _ in range(n)]
out=[]
for i,row in enumerate(A):
    data=sumprod(row,B).to_bytes(n*width,"little")
    if width==8:
        values=(v[0] for v in iter_unpack("<Q",data))
    else:
        values=(int.from_bytes(data[j:j+width],"little") for j in range(0,len(data),width))
    for j,x in enumerate(values):
        x%=P
        if x:
            out.append(f"{i+1} {j+1} {x}")
print("\n".join(out))
'''

PACKED_SHARED_OPT = PACKED_SHARED.replace("from array import array", "from array import array\nfrom itertools import islice")
PACKED_SHARED_OPT = PACKED_SHARED_OPT.replace('array("I", (next(it) for _ in range(n)))', 'array("I", islice(it, n))')
PACKED_SHARED_OPT = PACKED_SHARED_OPT.replace('width = ((n*n*(P-1)**3).bit_length()+7)//8\nsize = width*T',
    'row_sums = [sum(row) for row in B]\nH = (P-1)*max(max(row_sums), max(sumprod(row, row_sums) for row in A))\nbits = H.bit_length()\nmask = (1 << bits)-1')
PACKED_SHARED_OPT = PACKED_SHARED_OPT.replace('int.from_bytes(b"".join(x.to_bytes(width,"little") for x in values),"little")',
    'sum(x << (t*bits) for t,x in enumerate(values))')
PACKED_SHARED_OPT = PACKED_SHARED_OPT.replace('t*width, pow(x,-1,P)', 't*bits, pow(x,-1,P)')
PACKED_SHARED_OPT = PACKED_SHARED_OPT.replace('    data = z.to_bytes(size,"little")\n    return any(int.from_bytes(data[q:q+width],"little")%P for q in range(0,size,width))',
    '    for _ in range(T):\n        if (z & mask) % P:\n            return True\n        z >>= bits\n    return False')
PACKED_SHARED_OPT = PACKED_SHARED_OPT.replace('            data = z.to_bytes(size,"little")\n            value = int.from_bytes(data[offset:offset+width],"little")%P*inv%P',
    '            value = ((z >> offset) & mask)%P*inv%P')
assert 'width' not in PACKED_SHARED_OPT and 'size' not in PACKED_SHARED_OPT

CPP_SHARED = r'''#include <bits/stdc++.h>
using namespace std;
using ll = long long;
int n, P;
vector<vector<int>> A, B;
vector<array<int,3>> answer;
int power(int a, int b) {
    ll r=1;
    for (;b;b>>=1,a=ll(a)*a%P) if(b&1) r=r*a%P;
    return int(r);
}
template<int T> void run() {
    using Vec=array<int,T>;
    struct Row { int i; Vec z; };
    vector<Vec> v(n);
    vector<pair<int,int>> inv(n,{-1,0});
    random_device rng;
    uniform_int_distribution<int> dist(0,P-1);
    for(int j=0;j<n;j++) for(int t=0;t<T;t++) {
        v[j][t]=dist(rng);
        if(inv[j].first<0 && v[j][t]) inv[j]={t,power(v[j][t],P-2)};
    }
    auto nonzero=[](const Vec &z) { for(int x:z) if(x) return true; return false; };
    auto projectB=[&](int l,int r) {
        vector<Vec> w(n);
        for(int k=0;k<n;k++) {
            array<ll,T> z{};
            for(int j=l;j<r;j++) for(int t=0;t<T;t++) z[t]+=ll(B[k][j])*v[j][t];
            for(int t=0;t<T;t++) w[k][t]=z[t]%P;
        }
        return w;
    };
    auto projectA=[&](int i,const vector<Vec> &w) {
        array<ll,T> z{};
        for(int k=0;k<n;k++) for(int t=0;t<T;t++) z[t]+=ll(A[i][k])*w[k][t];
        Vec result;
        for(int t=0;t<T;t++) result[t]=z[t]%P;
        return result;
    };
    function<void(int,int,const vector<Vec>&,const vector<Row>&)> solve;
    solve=[&](int l,int r,const vector<Vec> &w,const vector<Row> &rows) {
        if(rows.empty()) return;
        if(r-l==1) {
            auto [t,u]=inv[l];
            if(t<0) return;
            for(auto &row:rows) {
                int value=ll(row.z[t])*u%P;
                if(value) answer.push_back({row.i+1,l+1,value});
            }
            return;
        }
        int mid=(l+r)/2;
        auto lw=projectB(l,mid), rw=w;
        for(int k=0;k<n;k++) for(int t=0;t<T;t++) {
            rw[k][t]-=lw[k][t];
            if(rw[k][t]<0) rw[k][t]+=P;
        }
        vector<Row> left,right;
        for(auto &row:rows) {
            Vec a=projectA(row.i,lw), b;
            for(int t=0;t<T;t++) { b[t]=row.z[t]-a[t]; if(b[t]<0) b[t]+=P; }
            if(nonzero(a)) left.push_back({row.i,a});
            if(nonzero(b)) right.push_back({row.i,b});
        }
        solve(l,mid,lw,left);
        solve(mid,r,rw,right);
    };
    auto w=projectB(0,n);
    vector<Row> rows;
    for(int i=0;i<n;i++) { auto z=projectA(i,w); if(nonzero(z)) rows.push_back({i,z}); }
    solve(0,n,w,rows);
}
int main() {
    ios::sync_with_stdio(false); cin.tie(nullptr);
    int sub; cin>>sub>>n>>P;
    A.assign(n,vector<int>(n)); B=A;
    for(auto &row:A) for(int &x:row) cin>>x;
    for(auto &row:B) for(int &x:row) cin>>x;
    int T=ceil(42/log(double(P)));
    switch(T) {
        case 3:run<3>();break; case 4:run<4>();break;
        case 5:run<5>();break; case 6:run<6>();break;
        case 7:run<7>();break; case 8:run<8>();break;
        case 9:run<9>();break; case 10:run<10>();break;
        case 11:run<11>();break; case 12:run<12>();break;
    }
    sort(answer.begin(),answer.end());
    for(auto [i,j,x]:answer) cout<<i<<' '<<j<<' '<<x<<'\n';
}
'''

def packed_research(variant="packed-independent-trials"):
    report_path = BASE / "a980-performance.json"
    evidence = json.loads(report_path.read_text())
    old = json.loads((BASE / "a980-candidate.json").read_text())
    history = evidence.setdefault("candidateHistory", [])
    if not any(x.get("python") == old.get("python") for x in history):
        history.append(old)
    experiment = {"name": variant, "pythonSha256": hashlib.sha256(PACKED_TRIALS.encode()).hexdigest(),
                  "python": sys.version, "benchmarks": [], "checks": [],
                  "contention": "Parent production build may run concurrently. Shared heterogeneous Windows/WSL host; CPU contention, scheduling and thermals are not controlled. Do not infer a production TLE or a stable speedup from these timings.",
                  "proof": "Lane radix Q=256^lane_bytes > n^2(P-1)^3. With nonnegative A,B,v every lane of each Bv and A(Bv) stays below Q, so ordinary integer products/sums perform all T independent exact integer projections without inter-lane carry. Reduce only extracted final lanes mod P; associativity gives C v. Fresh SystemRandom components are sampled independently for every lane and node. Union bound <=72800 exp(-42), unchanged. Exact leaf dot products prevent incorrect emitted values.",
                  "complexity": "O(n^2 log n) Python-level scalar product terms, each on O(T log(n^2 P^3)) bit packed integers; this is not O(n^2) bit work or a unit-cost big-int complexity claim. O(n^2 + n*T*log(nP)*log n) bits of auxiliary storage plus matrix payload; transient slices are O(n)."}
    experiment["pythonCode"] = PACKED_TRIALS
    if variant.startswith("packed-shared"):
        experiment["proof"]="Q=256^width>n^2(P-1)^3 prevents all carries in integer A(Bv). Draw T independent vectors once globally and restrict them to each fixed dyadic interval. Every true row/interval pair has miss probability P^(-T); union over <=72800 fixed pairs requires no independence between intervals or adaptive conditioning. A row can be pruned incorrectly only if one such fixed event occurs. At a node, raw left and right projections add exactly to the stored parent projection, so compute left and obtain right by subtraction. At a singleton column, any nonzero component v gives exact C[i,j]=projection/v mod P. Thus emitted entries are always correct and total omission probability <=72800 exp(-42)."
        experiment["complexity"]="O(n^2 log n) scalar-by-packed-integer multiply-adds, with O(T log(n^2 P^3)) bits per packed operand. Both B and A projection work are approximately halved by additive child recovery; singleton values need no dense dot product. This is not O(n^2) bit work. Memory: two 32-bit n*n matrices plus O(n*T*log(nP)*log n) packed recursion bits and O(n log n) row records."
        if variant == "packed-shared-bit-tight":
            experiment["proof"] = "Let s[k]=sum_j B[k,j] and H=(P-1)*max(max_k s[k], max_i sum_k A[i,k]*s[k]). Every raw Bv coefficient is <=(P-1)*s[k]<=H, including rows with A[:,k]=0. Every raw A(Bv) coefficient is <=(P-1)*sum_k A[i,k]*s[k]<=H. Q=2^H.bit_length()>H therefore prevents all inter-lane carries. Packed integer linearity and nonnegative coefficients give w(parent)=w(left)+w(right) and z(parent)=z(left)+z(right), so subtraction yields the exact nonnegative right projection. T=ceil(42/log(P)) independent SystemRandom vectors are sampled globally once; restrict them to fixed dyadic intervals. Each true row/interval pair is missed with probability P^(-T). Union over at most 72800 fixed true pairs gives <=72800 exp(-42)<5e-14 without requiring interval independence or adaptive conditioning. Singleton division by a nonzero vector component recovers an exact C entry. H>0 follows from the promised nonzero product. Computing H costs an extra ordinary n*n matrix-vector multiplication, without modulo. No input-family detection or weakened error bound is used."
    elif variant == "packed-deterministic-rows":
        experiment["proof"]="Q=256^width>n(P-1)^2. Encode row k of B as b[k]=sum_j B[k,j] Q^j. For row i, z=sum_k A[i,k] b[k]=sum_j D[i,j]Q^j with D[i,j]=sum_k A[i,k]B[k,j]<Q, so there are no inter-slot carries. Decode every slot and reduce mod P to obtain all C entries exactly; no probability or sparsity assumption is used in recovery."
        experiment["complexity"]="n^2 Python/native scalar-by-big-int terms and n^2 modulo operations. Each encoded row has O(n log(nP)) bits, so bit/limb work is O(n^3 log(nP)), not quadratic runtime. Store A as n^2 32-bit entries and B as n packed rows (n^2*width payload bytes); row result O(n*width)."
    evidence.setdefault("research", []).append(experiment)
    def save_research():
        report_path.write_text(json.dumps(evidence, ensure_ascii=False, indent=2)+"\n")
    candidate = {"code": "a980", "status": "experimental-not-yet-recommended", "python": PACKED_TRIALS,
                 "explanation": ["將T個獨立隨機投影放進同一個整數的T個區塊。每區塊使用足夠位元，保證A(Bv)在未取模前也不會進位到其他區塊。", "兩次整數內積後逐區塊取模，所得結果與分別計算T次投影完全相同；非零列保留並二分，單欄時精確計算輸出。"],
                 "proof": experiment["proof"], "complexity": experiment["complexity"],
                 "compatibility": "Python >=3.12; standard library only; integer sumprod; no NumPy."}
    if variant.startswith("packed-shared"):
        candidate["explanation"]=["全域產生T個獨立隨機向量，限制到每個二分欄區間；將T個投影打包成大整數，區塊位元數以非負原始乘加總和的嚴格上界決定。", "只計算左半區間投影，右半由父投影減左投影取得。單欄時用非零隨機係數的反元素還原元素，所得值精確；僅可能因投影全部為零而漏項。", "各區間共用向量不影響聯合界：對所有固定的真實非零列與區間作聯集，總漏判機率仍小於72800 exp(-42)<5e-14；不是確定性演算法。"]
    elif variant == "packed-deterministic-rows":
        candidate["explanation"]=["令Q為256的冪且Q>n(P−1)²，把B每列編成以Q為底的大整數。", "對A第i列計算sum_k A[i,k]*packed_B[k]；第j區塊精確等於尚未取模的乘積元素總和，因小於Q而不會互相進位。解出每個區塊後取模並依列、欄順序輸出。", "這是確定性算法，完全沒有漏判機率；但n²個大整數乘加各自處理O(n log(nP))位元，不能宣稱二次時間。"]
    if variant == "cpp-shared-subtraction":
        candidate=dict(old)
        candidate["cpp"]=CPP_SHARED
        experiment["cppCode"]=CPP_SHARED
        experiment["cppSha256"]=hashlib.sha256(CPP_SHARED.encode()).hexdigest()
        experiment["proof"]="All T vectors are drawn once with uniform_int_distribution driven directly by random_device. Restricted interval projections are linear over F_P. Compute only left Bv and left A(Bv); subtract from parent residues to get right projections exactly. At singleton divide projection by a nonzero vector component. The same fixed-interval union bound <=72800 exp(-42) applies under the ideal independent uniform random-source assumption. Every emitted entry is exact. Each inner sum contains <=n products of residues <=P-1, so n(P-1)^2<2^63 prevents overflow. random_device quality is implementation-dependent; Linux libstdc++ uses the OS random source."
        experiment["complexity"]="O(T*n^2*log n) 64-bit scalar work, O(T*n^2) modulo operations, O(n^2+T*n*log n) words. T=ceil(42/log(P)) is 3..12 for allowed P; template specialization changes constants, not T."
    (BASE/"a980-candidate.json").write_text(json.dumps(candidate, ensure_ascii=False, indent=2)+"\n")
    source = next(x for x in json.loads((BASE/"source.json").read_text())["problems"] if x["code"] == "a980")
    with tempfile.TemporaryDirectory(prefix="a980-packed-", dir="/tmp") as tmp_name:
        tmp = Path(tmp_name)
        main = tmp/"main.py"
        main.write_text(PACKED_TRIALS)
        command=[sys.executable,str(main)]
        if variant == "cpp-shared-subtraction":
            if sys.platform != "linux":
                raise SystemExit("Refusing non-Linux C++ compilation")
            (tmp/"main.cpp").write_text(CPP_SHARED)
            subprocess.run(["g++","-O2","-std=c++17",str(tmp/"main.cpp"),"-o",str(tmp/"main")],check=True,timeout=60)
            command=[str(tmp/"main")]
            experiment["compiler"]=subprocess.check_output(["g++","--version"],text=True).splitlines()[0]
        def run(inp, expected, label, timeout=90):
            infile = tmp/"input"
            if isinstance(inp, str):
                infile.write_text(inp)
            else:
                infile = inp
            start=time.monotonic()
            with infile.open("rb") as f, (tmp/"out").open("wb") as o, (tmp/"err").open("wb") as e:
                p=subprocess.Popen(command, stdin=f, stdout=o, stderr=e)
                while True:
                    pid, status, usage=os.wait4(p.pid, os.WNOHANG)
                    if pid:
                        break
                    if time.monotonic()-start > timeout:
                        p.kill()
                        pid,status,usage=os.wait4(p.pid,0)
                        break
                    time.sleep(.02)
                p.returncode=os.waitstatus_to_exitcode(status)
            result={"case":label,"wallSeconds":time.monotonic()-start,"cpuSeconds":usage.ru_utime+usage.ru_stime,
                    "peakRssKiB":usage.ru_maxrss,"timeoutSeconds":timeout,"returncode":p.returncode,
                    "outputVerified":p.returncode==0 and (tmp/"out").read_text().strip()==expected.strip(),
                    "stderr":(tmp/"err").read_text()[:1000]}
            print(json.dumps(result),flush=True)
            return result
        rng=random.Random(98003)
        for x in source["samples"]:
            experiment["checks"].append(run(x["input"],x["output"],"sample",15))
        for n in (2,3,7,12,38):
            for P in (37,2801,49999991):
                if (n+1)%P == 0:
                    continue
                q=pow(n+1,-1,P)
                A=[[((1+int(i==j))*(-1 if i%2 else 1))%P for j in range(n)] for i in range(n)]
                C=[[0]*n for _ in range(n)]
                for i,j in rng.sample([(i,j) for i in range(n) for j in range(n)],2*n):
                    C[i][j]=rng.randrange(1,P)
                D=[[C[i][j]*(-1 if i%2 else 1)%P for j in range(n)] for i in range(n)]
                sums=[sum(D[k][j] for k in range(n)) for j in range(n)]
                B=[[(D[i][j]-q*sums[j])%P for j in range(n)] for i in range(n)]
                assert all(sum(A[i][k]*B[k][j] for k in range(n))%P==C[i][j] for i in range(n) for j in range(n))
                inp=f"3\n{n} {P}\n"+"\n".join(" ".join(map(str,row)) for row in A+B)+"\n"
                exp="\n".join(f"{i+1} {j+1} {C[i][j]}" for i in range(n) for j in range(n) if C[i][j])
                experiment["checks"].append(run(inp,exp,f"signed-dense-n{n}-P{P}",15))
        for n,P in ((38,37),(38,49999991)):
            A=[[0]*n for _ in range(n)]
            A[0][0]=1
            A[1][0]=2
            B=[[P-1]*n for _ in range(n)]
            B[0]=[0]*n
            B[0][0]=1
            B[0][-1]=P-1
            inp=f"3\n{n} {P}\n"+"\n".join(" ".join(map(str,row)) for row in A+B)+"\n"
            exp=f"1 1 1\n1 {n} {P-1}\n2 1 2\n2 {n} {P-2}"
            experiment["checks"].append(run(inp,exp,f"unused-large-B-rows-n{n}-P{P}",15))
        save_research()
        assert all(x["outputVerified"] for x in experiment["checks"])
        max_cases = [(2800,37),(2800,49999991)]
        if "--stress-only" in sys.argv:
            max_cases=[]
        if variant == "packed-deterministic-rows":
            max_cases = [(1000,37),(1000,49999991)]+max_cases
        for n,P in max_cases:
            q=pow(n+1,-1,P)
            infile=tmp/"max.in"
            with infile.open("w") as f:
                f.write(f"3\n{n} {P}\n")
                for i in range(n):
                    f.write(" ".join(str(1+int(i==j)) for j in range(n))+"\n")
                for i in range(n):
                    f.write(" ".join(str((int(i==j)+int(j==(i+1)%n)-2*q)%P) for j in range(n))+"\n")
            exp="\n".join(f"{i+1} {j+1} 1" for i in range(n) for j in sorted((i,(i+1)%n)))
            experiment["benchmarks"].append(run(infile,exp,f"dense-cycle-n{n}-P{P}"))
            save_research()
        if variant in ("packed-shared-bit-tight","cpp-shared-subtraction"):
            for P in (37,49999991):
                n=2800
                q=pow(n+1,-1,P)
                # Two far-separated nonzeros per row force twice as many
                # live row/interval pairs as adjacent-cycle constructions.
                shift=n//2
                scales=[1+(17*i)%(P-1) for i in range(n)]
                invscales=[pow(x,-1,P) for x in scales]
                colsums=[(invscales[j]+invscales[(j-shift)%n])%P for j in range(n)]
                infile=tmp/"wide-scaled.in"
                with infile.open("w") as f:
                    f.write(f"3\n{n} {P}\n")
                    for i in range(n):
                        f.write(" ".join(str((scales[i]*(1+int(i==j)))%P) for j in range(n))+"\n")
                    for i in range(n):
                        f.write(" ".join(str(((invscales[i] if i==j or j==(i+shift)%n else 0)-q*colsums[j])%P) for j in range(n))+"\n")
                exp="\n".join(f"{i+1} {j+1} 1" for i in range(n) for j in sorted((i,(i+shift)%n)))
                experiment["benchmarks"].append(run(infile,exp,f"dense-scaled-wide-n{n}-P{P}"))
                save_research()
    evidence["recommendation"]="Packed-trial research is experimental; assess its new timings against 19.5s before recommending. Existing 188s/240s reference and 78s sumprod evidence is preserved and neither is a suitable maximum-limit Python recommendation."
    save_research()

def integration_checks():
    """Small, paste-ready fixtures; expected outputs use independent cubic AB."""
    checks=[]
    def add(raw,reason,claimed=None):
        d=list(map(int,raw.split()))
        n,P=d[1:3]
        assert len(d)==3+2*n*n
        A=[d[3+i*n:3+(i+1)*n] for i in range(n)]
        B=[d[3+n*n+i*n:3+n*n+(i+1)*n] for i in range(n)]
        entries=[]
        for i in range(n):
            for j in range(n):
                v=sum(A[i][k]*B[k][j] for k in range(n))%P
                if v:
                    entries.append(f"{i+1} {j+1} {v}")
        assert 1<=len(entries)<=2*n
        expected="\n".join(entries)
        if claimed is not None:
            assert expected==claimed.strip()
        checks.append({"code":"a980","input":raw.strip()+"\n","output":expected,"reason":reason})
    src=next(x for x in json.loads((BASE/"source.json").read_text())["problems"] if x["code"]=="a980")
    for i,case in enumerate(src["samples"],1):
        add(case["input"],f"公開範例{i}；預期輸出另以獨立三層迴圈乘法核對。",case["output"])
    add("3\n2 37\n1 0\n0 1\n0 3\n2 0\n","最小模數、零元素與輸出排序。")
    add("3\n2 37\n1 1\n1 1\n1 36\n36 2\n","投影可能抵銷；乘積只有第二欄非零。")
    def matrices(A,B,P,reason):
        n=len(A)
        add(f"3\n{n} {P}\n"+"\n".join(" ".join(map(str,row)) for row in A+B),reason)
    # Exercise the intermediate C++ T=5,7,8,9,10,11 specializations.
    for P in (47,73,113,211,997,10007):
        n=4
        q=pow(n+1,-1,P)
        inv=[pow(i+2,-1,P) for i in range(n)]
        C=[[int(j==i)+int(j==(i+2)%n) for j in range(n)] for i in range(n)]
        D=[[inv[i]*C[i][j]%P for j in range(n)] for i in range(n)]
        sums=[sum(D[k][j] for k in range(n)) for j in range(n)]
        A=[[(i+2)*(1+int(i==j))%P for j in range(n)] for i in range(n)]
        B=[[(D[i][j]-q*sums[j])%P for j in range(n)] for i in range(n)]
        matrices(A,B,P,f"中間模數P={P}，獨立乘法核對跨區間非零與縮放矩陣。")
    for P in (37,49999991):
        n=38
        A=[[0]*n for _ in range(n)]
        A[0][0]=1
        A[1][0]=2
        B=[[P-1]*n for _ in range(n)]
        B[0]=[0]*n
        B[0][0]=1
        B[0][-1]=P-1
        matrices(A,B,P,"A僅一個有效欄，B未使用的列很大；打包上界必須涵蓋Bv。")
    n,P=8,37
    q=pow(n+1,-1,P)
    A=[[1+int(i==j) for j in range(n)] for i in range(n)]
    for shape in ("single","rows","columns"):
        C=[[int((i==0 and j==n-1) if shape=="single" else (i<2 if shape=="rows" else j in (0,n-1))) for j in range(n)] for i in range(n)]
        sums=[sum(C[k][j] for k in range(n)) for j in range(n)]
        B=[[(C[i][j]-q*sums[j])%P for j in range(n)] for i in range(n)]
        matrices(A,B,P,{"single":"乘積只有1個非零元素，測試空區間剪枝。","rows":"恰2n個非零元素集中於兩列。","columns":"恰2n個非零元素集中於兩個相距很遠的欄。"}[shape])
    return checks

def finalize_candidate():
    path=BASE/"a980-performance.json"
    evidence=json.loads(path.read_text())
    py=next(x for x in reversed(evidence["research"]) if x["name"]=="packed-shared-bit-tight" and len(x["benchmarks"])==4)
    cpp=next(x for x in reversed(evidence["research"]) if x["name"]=="cpp-shared-subtraction" and len(x["benchmarks"])==4)
    assert py["pythonCode"]==PACKED_SHARED_OPT, "Latest corrected bound must be benchmarked before release"
    assert cpp["cppCode"]==CPP_SHARED, "Latest C++ must be benchmarked before release"
    assert all(x["outputVerified"] for result in (py,cpp) for key in ("checks","benchmarks") for x in result[key])
    pymax=max(x["wallSeconds"] for x in py["benchmarks"])
    cppmax=max(x["wallSeconds"] for x in cpp["benchmarks"])
    note=(f"C++共享投影版本在本機四組n=2800測資最慢{cppmax:.2f}秒；Python打包版最慢{pymax:.2f}秒，"
          "而本站Python有效時限為19.5秒。因此Python版不適合作為最大範圍可通過時限的提交建議，宜以C++為建議提交版本，Python保留作教學及較小規模參考。"
          "本機為共享Windows/WSL環境，父流程可能同時建置；Python實測3.13.12、C++實測GCC16.2，與設定的Python3.12/GCC10.2不同。這些紀錄不等於正式評測TLE或AC保證。")
    candidate={
        "code":"a980", "status":"cpp-ready-python-unsuitable-for-max-limit-recommendation",
        "concept":"全域隨機投影、區間線性相減與整數打包",
        "goal":"利用乘積最多2n個非零元素定位答案，並分別理解C++模運算與Python大整數打包的成本及機率保證。",
        "explanation":[
            "A、B可能都很稠密，只有C=AB稀疏。對任意欄區間S與向量v，以A(B_S v)取得C_S v，不必先算整個乘積。",
            "全域只產生一次T=ceil(42/log(P))組獨立均勻向量，之後限制到各固定二分欄區間。非零列的每個投影為均勻分布；只有全部T個分量都為0才捨棄。",
            "每個節點保留父區間投影，只計算左半投影；右半由父減左取得。單欄時，任一非零隨機係數的反元素都能從投影精確還原C[i,j]，省去最後一次長內積。最後依列、欄排序。",
            "C++：T個投影分量分開存成模P整數，乘加用64位元累積後才取模；右半投影直接在模P下相減。n(P−1)²≤6999999440000011200<2^63，因此不溢位。random_device直接作均勻抽樣來源，沒有固定種子；機率界仍以底層提供理想獨立均勻亂數為前提。",
            "Python：令s[k]=sum_j B[k,j]、H=(P−1)max(max_k s[k], max_i sum_k A[i,k]s[k])，b=bit_length(H)、Q=2^b。將T個投影係數放入同一整數的T個Q進位區塊，用Python3.12的math.sumprod一次完成所有投影。",
            "H同時涵蓋每個Bv與A(Bv)的未取模係數，包含A完全沒有使用到的B列，因此所有區塊都小於Q、不互相進位。先精確作整數乘加與相減，再逐區塊取模；不經浮點近似，也不減少T。",
            "正確性是Monte Carlo保證：對所有固定的真實非零列與二分區間作聯合界，最多72800個事件，漏項機率≤72800/P^T≤72800 exp(-42)<5×10^−14。區間可以共用向量，聯合界不要求區間彼此獨立；輸出的每個值都精確，但仍可能漏項。",
            "參考原理：https://nhspc2020.twpca.org/editorial/editorial.html 。Python實際最大範圍效能限制請見performanceNote，不應把大整數乘加視為常數成本。"
        ],
        "complexity":"C++：O(Tn² log n)次64位元乘加、O(Tn²+n log P)次取模，O(n²+Tn log n)個機器字空間。Python：O(n² log n)個純量乘打包整數的乘加；打包長度L=Tb=O(T log(nP))位元，每次仍需O(L/word)機器字工作，不能宣稱二次位元時間；矩陣使用2n²個32位元整數，額外O(nL log n)位元及O(n log n)筆列資料。T介於3與12。",
        "pitfall":"不能假設A、B稀疏；不能把共用區間當成獨立事件證明；Python上界H必須同時涵蓋Bv與A(Bv)，尤其A有全零欄時。不能將大整數操作當成常數時間，也不能把有限測試通過說成確定性正確或最大範圍通過時限。",
        "performanceNote":note,
        "traceLabel":"P=37，A=I，B=[[0,3],[2,0]]。只展示第一個全域投影分量v=(1,1)；程式仍使用完整T=12個獨立分量。",
        "trace":[
            {"title":"父區間投影","description":"全域第一個向量為(1,1)，所以父投影A(Bv)=(3,2)。H=108，Python可用Q=128打包各分量。","cells":["列1投影3","列2投影2"],"active":[0,1],"variables":[["T","12"],["Q","128"]]},
            {"title":"只計算左半","description":"左半只含第1欄，其投影為(0,2)，所以左半只保留第2列。","cells":["左列1:0","左列2:2"],"active":[1],"variables":[["左投影","(0,2)"]]},
            {"title":"相減取得右半","description":"右投影=(3,2)−(0,2)=(3,0)，不必重算另一個完整內積。右半只保留第1列。","cells":["右列1:3","右列2:0"],"active":[0],"variables":[["右投影","(3,0)"]]},
            {"title":"單欄還原並排序","description":"示例係數都是1，除回係數後得到C[1,2]=3、C[2,1]=2；依位置排序輸出。","cells":["1 2 3","2 1 2"],"active":[0,1],"variables":[["非零數","2"]]}
        ],
        "python":py["pythonCode"], "cpp":cpp["cppCode"],
        "proof":{"python":py["proof"],"cpp":cpp["proof"]},
        "compatibility":{"minimumPython":"3.12", "configuredPython":"3.12.0", "testedPython":sys.version,
            "python312Execution":"Not available on this host; runtime execution was Python3.13.12. All submitted APIs are documented in Python3.12, and no Python3.13-only helper is used. math.sumprod was introduced in3.12; integer inputs stay exact. islice, array, int.bit_length and pow(a,-1,P) predate3.12.",
            "pythonDocs":"https://docs.python.org/3.12/library/math.html#math.sumprod", "fallback":"No optional package or 3.13 helper requires a fallback; math.sumprod requires the site's configured Python>=3.12.",
            "python312CiCommand":"python3.12 scripts/fixtures/new-problem-lessons/a980-performance.py --compatibility-smoke",
            "compatibilitySmoke":"Two official samples and exact integer sumprod with >180-bit operands pass on the installed3.13.12. The same Linux-only smoke mode is available for actual3.12 CI; no3.12 execution is claimed.",
            "testedCompiler":cpp.get("compiler"),"configuredCompiler":"GCC10.2; not locally executed", "linuxGuard":"a980-performance.py explicitly rejects non-Linux before any compilation or execution."},
        "verification":{"pythonSha256":py["pythonSha256"],"cppSha256":cpp["cppSha256"],
                        "pythonChecks":py["checks"],"cppChecks":cpp["checks"],"pythonMax":py["benchmarks"],"cppMax":cpp["benchmarks"],
                        "finiteLimit":"Independent finite examples and algebraically certified maximum-size constructions are not an exhaustive proof or an empirical validation of a 5e-14 error probability."}}
    candidate["performanceNote"]="建議使用C++。Python版在本機部分最大測資超過本站19.5秒額度，尚不適合作為最大範圍可通過時限的提交建議，宜作教學與較小規模參考；本機計時不代表正式評測結果。"
    candidate["checks"]=integration_checks()
    candidate["checksProvenance"]="每筆皆包含完整input/output/reason，可直接加入既有checks陣列。公開範例預期輸出另以獨立O(n³)整數乘法核對；其他預期輸出完全由該獨立乘法產生，不使用候選程式當oracle。最大測資只在Linux/tmp生成，不嵌入JSON。"
    (BASE/"a980-candidate.json").write_text(json.dumps(candidate,ensure_ascii=False,indent=2)+"\n")
    evidence["recommendation"]=note
    evidence["releaseReviewAtUtc"]=datetime.now(timezone.utc).isoformat()
    evidence["releaseSummary"]={"status":candidate["status"],"pythonSha256":py["pythonSha256"],"cppSha256":cpp["cppSha256"],
        "pythonChecks":len(py["checks"]),"cppChecks":len(cpp["checks"]),"pythonMax":py["benchmarks"],"cppMax":cpp["benchmarks"],
        "proofCorrection":"Final H includes both max B-row sum and A*(B-row sums); pathological unused B rows are explicitly tested.",
        "maxStressProof":"A=D(I+J), q=(n+1)^(-1), C=I+S_shift, B=(I-qJ)D^(-1)C. Hence AB=C exactly. D nonzero diagonal; cycle shift1 and scaled half-width shift1400 both produce exactly2n nonzeros. Small cases additionally use independent cubic multiplication, and unused-B cases have only A[0,0]=1,A[1,0]=2 with arbitrary large other B rows."}
    evidence["releaseSummary"]["maxPeakRssMiB"]={"python":max(x["peakRssKiB"] for x in py["benchmarks"])/1024,"cpp":max(x["peakRssKiB"] for x in cpp["benchmarks"])/1024}
    evidence["releaseSummary"]["limits"]={"nominalCppSeconds":6.5,"effectivePythonSeconds":19.5,"liveMemoryMiB":1024,"alsoBelowRequested512MiBOnMeasuredInputs":True}
    evidence["releaseSummary"]["idealRandomnessGlobalErrorBound"]=72800*math.exp(-42)
    evidence["releaseSummary"]["integrationChecks"]=len(candidate["checks"])
    evidence["learnerPerformanceNote"]=candidate["performanceNote"]
    path.write_text(json.dumps(evidence,ensure_ascii=False,indent=2)+"\n")
    print(json.dumps(evidence["releaseSummary"],ensure_ascii=False))

def compatibility_smoke():
    candidate=json.loads((BASE/"a980-candidate.json").read_text())
    source=next(x for x in json.loads((BASE/"source.json").read_text())["problems"] if x["code"]=="a980")
    from math import sumprod
    a=[2**180+13,2**119+7,37]
    b=[49999990,37,2**170+3]
    assert sumprod(a,b)==sum(x*y for x,y in zip(a,b))
    with tempfile.TemporaryDirectory(prefix="a980-compat-",dir="/tmp") as tmp:
        main=Path(tmp)/"main.py"
        main.write_text(candidate["python"])
        for case in source["samples"]:
            p=subprocess.run([sys.executable,str(main)],input=case["input"],text=True,capture_output=True,timeout=15,check=True)
            assert p.stdout.strip()==case["output"].strip(),p.stderr
    print(json.dumps({"python":sys.version,"exactBigIntegerSumprod":True,"samples":len(source["samples"]),"pythonSha256":hashlib.sha256(candidate["python"].encode()).hexdigest()}))

def verify_release_checks():
    candidate=json.loads((BASE/"a980-candidate.json").read_text())
    assert candidate["checks"]==integration_checks()
    result={"pythonSha256":hashlib.sha256(candidate["python"].encode()).hexdigest(),
            "cppSha256":hashlib.sha256(candidate["cpp"].encode()).hexdigest(),"cases":[],
            "oracle":"Independent cubic integer matrix multiplication; expected data regenerated and compared before executing either candidate.",
            "python":sys.version}
    with tempfile.TemporaryDirectory(prefix="a980-release-",dir="/tmp") as tmp_name:
        tmp=Path(tmp_name)
        (tmp/"main.py").write_text(candidate["python"])
        (tmp/"main.cpp").write_text(candidate["cpp"])
        if sys.platform!="linux":
            raise SystemExit("Refusing non-Linux C++ compilation")
        subprocess.run(["g++","-O2","-std=c++17",str(tmp/"main.cpp"),"-o",str(tmp/"main")],check=True,timeout=60)
        result["compiler"]=subprocess.check_output(["g++","--version"],text=True).splitlines()[0]
        commands={"python":[sys.executable,str(tmp/"main.py")],"cpp":[str(tmp/"main")]}
        for number,case in enumerate(candidate["checks"],1):
            for language,cmd in commands.items():
                p=subprocess.run(cmd,input=case["input"],text=True,capture_output=True,timeout=15,check=True)
                assert p.stdout.strip()==case["output"],(number,language,p.stdout,p.stderr)
            result["cases"].append({"index":number,"reason":case["reason"],"pythonPassed":True,"cppPassed":True})
    path=BASE/"a980-performance.json"
    evidence=json.loads(path.read_text())
    evidence["releaseIntegrationVerification"]=result
    evidence["releaseReviewAtUtc"]=datetime.now(timezone.utc).isoformat()
    path.write_text(json.dumps(evidence,ensure_ascii=False,indent=2)+"\n")
    print(json.dumps({"status":candidate["status"],"pythonSha256":result["pythonSha256"],"cppSha256":result["cppSha256"],"independentChecks":len(result["cases"]),"bothLanguagesPassed":True}))

if "--release-checks" in sys.argv:
    verify_release_checks()
    sys.exit()
if "--compatibility-smoke" in sys.argv:
    compatibility_smoke()
    sys.exit()
if "--finalize" in sys.argv:
    finalize_candidate()
    sys.exit()
if "--packed-research" in sys.argv:
    packed_research()
    sys.exit()
if "--packed-shared" in sys.argv:
    PACKED_TRIALS=PACKED_SHARED
    packed_research("packed-shared-subtraction")
    sys.exit()
if "--packed-deterministic" in sys.argv:
    PACKED_TRIALS=PACKED_DETERMINISTIC
    packed_research("packed-deterministic-rows")
    sys.exit()
if "--packed-tight" in sys.argv:
    PACKED_TRIALS=PACKED_SHARED_OPT
    packed_research("packed-shared-bit-tight")
    sys.exit()
if "--cpp-shared" in sys.argv:
    packed_research("cpp-shared-subtraction")
    sys.exit()
if not any(x in sys.argv for x in ("--legacy-benchmark","--reference-max-only","--enrich-existing")):
    print("Linux-only a980 sidecar. Select --packed-tight, --cpp-shared, --packed-deterministic, --finalize; optional --stress-only. No files changed.")
    sys.exit()
lessons = json.loads((ROOT / "src/lib/newProblemLessons/data/national2.json").read_text())
lesson = next(x for x in lessons if x["code"] == "a980")
source = next(x for x in json.loads((BASE / "source.json").read_text())["problems"] if x["code"] == "a980")
report = {"problem": "a980", "host": platform.platform(), "python": sys.version,
          "referenceSha256": {k: hashlib.sha256(lesson[k].encode()).hexdigest() for k in ("cpp", "python")},
          "benchmarks": [], "checks": []}
report["correctnessReview"] = {
    "algorithm": "For each column interval use independent uniform F_P vectors; associativity gives A(Bv)=Cv. A nonzero row has a uniform projection by conditioning on all but one nonzero coefficient. Only unknown rows need further rounds. Exact leaf products prevent false-positive entries; failures can only omit entries.",
    "adaptiveUnionBound": "Condition on previous recursion decisions. Fresh vectors at each node retain the 1/P per-trial miss probability. At most 2n(ceil(log2(n))+1)<=72800 true row/interval pairs exist. T=ceil(42/log(P)) gives total miss probability <=72800/P^T<=72800*exp(-42)<5e-14.",
    "globalBound": 72800*math.exp(-42), "P37T": 12, "P37Bound": 72800/37**12,
    "randomnessCaveat": "The exact probability statement assumes ideal independent uniform samples. Python uses OS-backed SystemRandom.randrange (unbiased rejection sampling). C++ uses mt19937 seeded by random_device; its pseudorandom stream is conventional contest practice, but literal statistical independence/the numerical theorem is not established for that finite-state generator.",
    "arithmeticComplexity": "O(T*n^2*log n) scalar multiply-add work; O(T*n^2) modulo operations because every B projection uses n modulo operations per interval, at most n-1 internal intervals exist, and A-row checks total O(T*n*log n). Leaves add O(n) modulo operations and O(n^2) multiply-add work. T<=12 for allowed P, so this meets the source's O(n^2) modulo-count premise.",
    "overflow": {"safeUpperBound": 2800*49999998**2, "signed64Maximum": 2**63-1,
                 "reason": "All exact dot products have <=n terms, each <=(P-1)^2. C++ casts with 1LL before multiplication. Max admissible P<50000000; no intermediate signed 64-bit overflow."},
    "pythonMemory": "Two array('I') matrices use 2*2800^2*4=62,720,000 payload bytes, plus row/array overhead, recursion vectors and candidate/output lists. Input is parsed by lines, so row-formatted input retains O(n) token objects rather than O(n^2); an adversarial one-line whitespace layout can raise tokenizer memory and is not covered by the measured peak. Candidate B slices are transient <=4n bytes. Integer-only sumprod is exact and has no float conversion.",
    "finiteTesting": "Passing these algebraically certified cases is implementation evidence, not an exhaustive proof or an empirical validation of a 5e-14 failure probability.",
    "editorial": "https://nhspc2020.twpca.org/editorial/editorial.html"}
report["environmentReview"] = {
    "repoRuntime": "Python 3.12.0 in src/lib/languages.ts; sumprod was added in Python 3.12",
    "pythonTimeMultiplier": 3, "pythonMemoryMultiplier": 1,
    "execution": "src/lib/judgeCore.ts evaluateJudgeJob multiplies timeLimitMs by language timeMultiplier and passes it as runTimeoutMs; memory is multiplied then converted from MiB to bytes",
    "hostCpu": "Intel Core Ultra 7 258V; WSL kali-linux; GCC -O2 -std=c++17",
    "limitations": "Sequential benchmarks on a shared Windows/WSL host, without fixed CPU affinity or control of background load/thermal state. Local Python is 3.13.12, not the configured judge 3.12.0. Compatibility is checked against repo and official Python 3.12 docs; deployed interpreter was not queried. Inputs maximize n and use P=37 (maximal T=12), but are not proved to maximize wall time over all valid inputs. Separate unseeded SystemRandom runs can follow different rejection/pruning paths. Timings do not establish a production TLE verdict.",
    "measurement": "time.monotonic wall clock includes process startup and input parsing. Per-child os.wait4 ru_maxrss in KiB; fork-inherited parent memory may impose a baseline, especially for tiny tests."}
reference_only = "--reference-max-only" in sys.argv
if reference_only:
    existing = json.loads((BASE / "a980-performance.json").read_text())
    report["benchmarks"] = existing["benchmarks"]
    report["checks"] = existing["checks"]

def save():
    (BASE / "a980-performance.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")

if "--enrich-existing" in sys.argv:
    existing = json.loads((BASE / "a980-performance.json").read_text())
    existing["referenceStillCurrent"] = existing["referenceSha256"] == report["referenceSha256"]
    existing["correctnessReview"] = report["correctnessReview"]
    existing["environmentReview"] = report["environmentReview"]
    report = existing
    report["reviewedAtUtc"] = datetime.now(timezone.utc).isoformat()
    report["environmentReview"]["compilerVersion"] = subprocess.check_output(["g++", "--version"], text=True).splitlines()[0]
    report["environmentReview"]["observedRunVariation"] = "The original Python first exceeded a 240s controlled cap, then completed in 188.22s under a 600s cap. Both records are retained. Shared heterogeneous host scheduling/thermal state and independent random paths were not controlled, so neither a deterministic speedup ratio nor a judge verdict follows."
    metadata = report["liveMetadata"]
    if "matches" in metadata:
        text = "\n".join(metadata.pop("matches"))
        metadata["additionalProperty"] = [{"name": name, "value": value} for name, value in
            re.findall(r'"name":"(Time limit|Memory limit)","value":"([^"]+)"', text)]
    props = {x["name"]: x["value"] for x in metadata["additionalProperty"]}
    report["environmentReview"]["liveNominalTimeMs"] = int(props["Time limit"].split()[0])
    report["environmentReview"]["liveMemoryMiB"] = int(props["Memory limit"].split()[0])
    report["environmentReview"]["effectivePythonTimeMs"] = 3*report["environmentReview"]["liveNominalTimeMs"]
    report["environmentReview"]["memoryNote"] = "User mentioned a 512 MB budget; the actual live page reports 1024 MB. Measured peaks are below either budget for this row-formatted dense input."
    report["recommendation"] = "Keep national2.json untouched. Candidate is a safe same-algorithm Python constant-factor optimization with full code/proof/complexity provided separately, but the measured max-size candidate still exceeds the nominal 19.5s Python allowance on this host. Do not advertise full-limit Python performance without representative judge-hardware verification. No deterministic output bug found in tested cases."
    save()
    print(json.dumps({"referenceStillCurrent": report["referenceStillCurrent"], "benchmarks": report["benchmarks"]}))
    sys.exit()

try:
    with urllib.request.urlopen("https://oj.itousouta.me/problems/a980", timeout=30) as r:
        html = r.read().decode()
    props = []
    for data in re.findall(r'<script type="application/ld\+json">(.*?)</script>', html):
        props.extend(json.loads(data).get("additionalProperty", []))
    report["liveMetadata"] = {"url": "https://oj.itousouta.me/problems/a980", "htmlBytes": len(html),
                              "additionalProperty": props}
except Exception as e:
    report["liveMetadata"] = {"error": str(e)}

candidate = lesson["python"].replace("from array import array", "from array import array\nfrom math import sumprod")
candidate = candidate.replace("sum(A[i][k] * B[k][l] for k in range(n))", "sumprod(A[i], (row[l] for row in B))")
candidate = candidate.replace("sum(row[j] * v[j - l] for j in range(l, r))", "sumprod(row[l:r], v)")
candidate = candidate.replace("sum(x * y for x, y in zip(A[i], w))", "sumprod(A[i], w)")
assert candidate != lesson["python"] and "sum(" not in candidate
proposal = {"code": "a980", "python": candidate,
    "explanation": lesson["explanation"] + ["Python 3.12 以上用 math.sumprod 計算整數內積，將乘加迴圈交給原生程式，保留完全相同的抽樣、獨立試驗次數與遞迴；整數輸入不經浮點近似。"],
    "complexity": lesson["complexity"] + " Python 3.12+ 的 math.sumprod 僅改善常數；B列切片是暫時的array，最大額外O(n)空間，不減少T、不限制搜尋、不特判輸入。",
    "proof": "Every replacement computes the same integer dot product before % P. All SystemRandom draws, T, early exits, recursion, exact leaves and output sorting are unchanged. Thus the same ideal-independent-randomness Monte Carlo bound applies.",
    "compatibility": {"repo": "src/lib/languages.ts: python 3.12.0; timeMultiplier 3; memoryMultiplier 1", "docs": "https://docs.python.org/3.12/library/math.html#math.sumprod", "tested": sys.version}}
(BASE / "a980-candidate.json").write_text(json.dumps(proposal, ensure_ascii=False, indent=2) + "\n")

with tempfile.TemporaryDirectory(prefix="a980-", dir="/tmp") as tmp:
    tmp = Path(tmp)
    (tmp / "reference.cpp").write_text(lesson["cpp"])
    (tmp / "reference.py").write_text(lesson["python"])
    (tmp / "candidate.py").write_text(candidate)
    subprocess.run(["g++", "-O2", "-std=c++17", str(tmp / "reference.cpp"), "-o", str(tmp / "reference")], check=True, timeout=60)
    commands = {"cpp": [str(tmp / "reference")], "python": [sys.executable, str(tmp / "reference.py")],
                "candidate": [sys.executable, str(tmp / "candidate.py")]}

    def run(name, inp, expected, timeout, label):
        infile, out, err, stats = (tmp / x for x in ("input", "output", "stderr", "stats"))
        if isinstance(inp, str):
            infile.write_text(inp)
        else:
            infile = inp
        start = time.monotonic()
        with infile.open("rb") as f, out.open("wb") as o, err.open("wb") as e:
            p = subprocess.Popen(commands[name], stdin=f, stdout=o, stderr=e)
            while True:
                pid, status, usage = os.wait4(p.pid, os.WNOHANG)
                if pid:
                    break
                if time.monotonic() - start > timeout:
                    p.kill()
                    pid, status, usage = os.wait4(p.pid, 0)
                    break
                time.sleep(0.02)
            p.returncode = os.waitstatus_to_exitcode(status)
        elapsed = time.monotonic() - start
        actual = out.read_text().strip()
        result = {"case": label, "implementation": name, "timeoutSeconds": timeout,
                  "wallSeconds": elapsed, "returncode": p.returncode,
                  "outputVerified": p.returncode == 0 and actual == expected.strip(),
                  "peakRssKiB": usage.ru_maxrss, "cpuSeconds": usage.ru_utime + usage.ru_stime,
                  "stderr": err.read_text()[:1000]}
        print(json.dumps(result), flush=True)
        return result

    # Independent cubic oracle for valid small dense inputs: invert I+J,
    # multiply arbitrary sparse C, and verify AB independently again.
    rng = random.Random(980)
    cases = [(x["input"], x["output"], "sample") for x in source["samples"]]
    for n in (2, 3, 7, 12):
        for P in (37, 2801, 49999991):
            q = pow(n+1, -1, P)
            A = [[1+int(i == j) for j in range(n)] for i in range(n)]
            C = [[0]*n for _ in range(n)]
            for i, j in rng.sample([(i,j) for i in range(n) for j in range(n)], 2*n):
                C[i][j] = rng.randrange(1,P)
            B = [[(C[i][j]-q*sum(C[k][j] for k in range(n)))%P for j in range(n)] for i in range(n)]
            assert all(sum(A[i][k]*B[k][j] for k in range(n))%P == C[i][j] for i in range(n) for j in range(n))
            inp = f"3\n{n} {P}\n" + "\n".join(" ".join(map(str,row)) for row in A+B) + "\n"
            expected = "\n".join(f"{i+1} {j+1} {C[i][j]}" for i in range(n) for j in range(n) if C[i][j])
            cases.append((inp, expected, f"dense-small-n{n}-P{P}"))
    for inp, expected, label in ([] if reference_only else cases):
        for name in commands:
            result = run(name, inp, expected, 15, label)
            report["checks"].append(result)
            assert result["outputVerified"], result
    n, P = 2800, 37
    q = pow(n+1, -1, P)
    matrix = tmp / "dense-max.in"
    with matrix.open("w") as f:
        f.write(f"3\n{n} {P}\n")
        for i in range(n):
            f.write(" ".join(str(1+int(i == j)) for j in range(n)) + "\n")
        for i in range(n):
            f.write(" ".join(str((int(i == j)+int(j == (i+1)%n)-2*q)%P) for j in range(n)) + "\n")
    expected = "\n".join(f"{i+1} {j+1} 1" for i in range(n) for j in sorted((i,(i+1)%n)))
    report["construction"] = {"n": n, "P": P, "q": q, "inputBytes": matrix.stat().st_size,
        "proof": "A=I+J, B=I+S-2qJ, q=(n+1)^(-1) mod P. J^2=nJ and JS=J, so AB=I+S+[2-2q(n+1)]J=I+S. Both input matrices are dense; exactly 2n nonzeros, all 1.",
        "expectedLines": 2*n, "expectedSha256": hashlib.sha256(expected.encode()).hexdigest()}
    save()
    for name, timeout in (("cpp", 120), ("candidate", 180), ("python", 600)):
        if reference_only and name != "python":
            continue
        report["benchmarks"].append(run(name, matrix, expected, timeout, "dense-max-n2800-P37"))
        save()
save()
