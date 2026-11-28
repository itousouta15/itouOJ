#!/usr/bin/env python3
"""Build and independently verify a883/a904 replacement candidates.

--build is safe on Windows. --verify rejects Windows before compiling anything.
Uses only checked-in snapshots and Linux /tmp binaries, never submissions/DB.
"""
import argparse
import hashlib
import itertools
import json
import pathlib
import random
import subprocess
import sys
import tempfile
import time

ROOT = pathlib.Path(__file__).resolve().parents[3]
HERE = pathlib.Path(__file__).resolve().parent
SHA = lambda s: hashlib.sha256(s.encode()).hexdigest()

PY883 = r'''import sys


def maximum_assignment(a):
    n = len(a)
    # A coefficient uses a 16-bit lane: 15 value bits and one borrow guard.
    # Feasible labels remain in [0,W], W<=1000; reduced costs are <=2W.
    width = 16
    value_mask = 32767
    one = int.from_bytes(b'\x01\x00' * n, 'little')
    guard = one << 15
    all_values = one * value_mask
    infinity = all_values

    def pack(values):
        return int.from_bytes(b''.join(x.to_bytes(2, 'little') for x in values), 'little')

    rows = [pack(row) for row in a]
    columns = [pack([a[i][j] for i in range(n)]) for j in range(n)]
    u = pack([max(row) for row in a])
    v = 0
    bound = max(max(row) for row in a)
    row_match = [-1] * n
    column_match = [-1] * n
    free_columns = guard

    for root in range(n):
        s_one = 1 << (width * root)
        t_one = 0
        unvisited_one = one
        unvisited_values = all_values
        parent = [-1] * n
        slack = infinity
        row = root
        while True:
            label = (u >> (width * row)) & value_mask
            candidate = label * one + v - rows[row]
            candidate = ((candidate & unvisited_values)
                         | (infinity & (all_values ^ unvisited_values)))
            # Per-lane min(slack,candidate). No cross-lane borrow is possible.
            choose = (((slack | guard) - candidate) & guard) >> 15
            choose *= value_mask
            slack = (slack & (all_values ^ choose)) | (candidate & choose)

            zero = (guard - slack) & guard
            if not zero:
                low, high = 0, bound
                while low < high:
                    middle = (low + high) // 2
                    if ((guard + middle * one - slack) & guard):
                        high = middle
                    else:
                        low = middle + 1
                delta = low
                # Scalar Hungarian label/slack updates, in parallel lanes.
                u -= delta * s_one
                v += delta * t_one
                slack -= delta * unvisited_one
                zero = (guard - slack) & guard

            # An equally tight unmatched column ends the augmenting path now.
            available = zero & free_columns
            flags = available if available else zero
            bit = flags & -flags
            column = (bit.bit_length() - 1) // width
            shift = width * column
            column_label = (v >> shift) & value_mask
            differences = u + column_label * one - columns[column]
            tight_rows = (guard - differences) & guard & (s_one << 15)
            bit = tight_rows & -tight_rows
            parent[column] = (bit.bit_length() - 1) // width

            if column_match[column] == -1:
                free_columns ^= 1 << (shift + 15)
                while column != -1:
                    row = parent[column]
                    previous = row_match[row]
                    row_match[row] = column
                    column_match[column] = row
                    column = previous
                break

            t_one |= 1 << shift
            unvisited_one ^= 1 << shift
            field = value_mask << shift
            unvisited_values ^= field
            slack = (slack & ~field) | field
            row = column_match[column]
            s_one |= 1 << (width * row)

    return sum(a[i][row_match[i]] for i in range(n))


def main():
    values = iter(map(int, sys.stdin.buffer.read().split()))
    n = next(values)
    a = [[next(values) for _ in range(n)] for _ in range(n)]
    print(maximum_assignment(a))


if __name__ == '__main__':
    main()
'''

CPP883 = r'''#include <bits/stdc++.h>
using namespace std;
int main() {
    ios::sync_with_stdio(false); cin.tie(nullptr);
    int n; cin >> n;
    vector<vector<int>> a(n, vector<int>(n));
    vector<int> u(n), v(n), row_match(n,-1), column_match(n,-1);
    for(int i=0;i<n;i++) for(int j=0;j<n;j++) {
        cin >> a[i][j]; u[i]=max(u[i],a[i][j]);
    }
    for(int root=0;root<n;root++) {
        vector<int> slack(n,INT_MAX), from(n,-1), parent(n,-1);
        vector<bool> S(n), T(n); S[root]=true;
        int row=root;
        while(true) {
            for(int j=0;j<n;j++) if(!T[j]) {
                int candidate=u[row]+v[j]-a[row][j];
                if(candidate<slack[j]) slack[j]=candidate,from[j]=row;
            }
            int delta=INT_MAX,column=-1;
            for(int j=0;j<n;j++) if(!T[j]) {
                if(slack[j]<delta || (slack[j]==delta && column_match[j]<0
                    && column>=0 && column_match[column]>=0)) {
                    delta=slack[j]; column=j;
                }
            }
            if(delta) {
                for(int i=0;i<n;i++) if(S[i]) u[i]-=delta;
                for(int j=0;j<n;j++) {
                    if(T[j]) v[j]+=delta;
                    else slack[j]-=delta;
                }
            }
            parent[column]=from[column];
            if(column_match[column]<0) {
                while(column>=0) {
                    int i=parent[column],previous=row_match[i];
                    row_match[i]=column;column_match[column]=i;column=previous;
                }
                break;
            }
            T[column]=true;row=column_match[column];S[row]=true;
        }
    }
    int answer=0;
    for(int i=0;i<n;i++) answer+=a[i][row_match[i]];
    cout << answer << '\n';
}
'''

PY904 = r'''import sys
from collections import deque


def glcs(a, b, gap):
    # The gap constraint is symmetric in the two strings.
    if len(a) > len(b):
        a, b = b, a
    n, m = len(a), len(b)
    size = 1 << (n - 1).bit_length()
    tree = [0] * (2 * size)
    # DP values <=800, so 15 value bits plus one guard bit are ample.
    one = int.from_bytes(b'\x01\x00' * m, 'little')
    guard = one << 15
    all_values = one * 32767

    def merge(x, y):
        choose_x = ((((x | guard) - y) & guard) >> 15) * 32767
        return (x & choose_x) | (y & (all_values ^ choose_x))

    answer = 0
    for i, c in enumerate(a):
        g = gap[ord(c) - 65]
        left, right = size + max(0, i - g - 1), size + i
        best = 0
        # Componentwise maximum of all completed rows in the legal row window.
        while left < right:
            if left & 1:
                best = merge(best, tree[left]); left += 1
            if right & 1:
                right -= 1; best = merge(best, tree[right])
            left //= 2; right //= 2

        packed = best.to_bytes(2 * m, 'little')
        vertical = [packed[2*j] | (packed[2*j+1] << 8) for j in range(m)]
        horizontal = deque()
        output = bytearray(2 * m)
        for j, x in enumerate(b):
            if j:
                value = vertical[j-1]
                while horizontal and horizontal[-1][1] <= value:
                    horizontal.pop()
                horizontal.append((j-1, value))
            minimum_column = j - g - 1
            while horizontal and horizontal[0][0] < minimum_column:
                horizontal.popleft()
            if c == x:
                value = 1 + (horizontal[0][1] if horizontal else 0)
                output[2*j] = value & 255
                output[2*j+1] = value >> 8
                if value > answer:
                    answer = value

        node = size + i
        tree[node] = int.from_bytes(output, 'little')
        node //= 2
        # Publish the row only after every matching endpoint has been computed.
        while node:
            tree[node] = merge(tree[2*node], tree[2*node+1])
            node //= 2
    return answer


def main():
    tokens = iter(sys.stdin.read().split())
    a, b = next(tokens), next(tokens)
    count = int(next(tokens))
    output = []
    for _ in range(count):
        gap = [max(len(a),len(b))] * 26
        while True:
            symbol = next(tokens)
            if symbol == '$':
                break
            gap[ord(symbol)-65] = int(next(tokens))
        output.append(glcs(a,b,gap))
    print(*output)


if __name__ == '__main__':
    main()
'''

CPP904 = r'''#include <bits/stdc++.h>
using namespace std;
int main() {
    ios::sync_with_stdio(false); cin.tie(nullptr);
    string a,b;int queries;cin>>a>>b>>queries;
    if(a.size()>b.size())swap(a,b);
    int n=a.size(),m=b.size(),size=1;while(size<n)size*=2;
    for(int query=0;query<queries;query++) {
        vector<int> gap(26,max(n,m));string symbol;
        while(cin>>symbol && symbol!="$")cin>>gap[symbol[0]-'A'];
        vector<vector<unsigned short>> tree(2*size,vector<unsigned short>(m));
        int answer=0;
        for(int i=0;i<n;i++) {
            int g=gap[a[i]-'A'],l=size+max(0,i-g-1),r=size+i;
            vector<unsigned short> vertical(m),row(m);
            auto combine=[&](int node) {
                for(int j=0;j<m;j++)vertical[j]=max(vertical[j],tree[node][j]);
            };
            while(l<r) {
                if(l&1)combine(l++);
                if(r&1)combine(--r);
                l/=2;r/=2;
            }
            deque<int> q;
            for(int j=0;j<m;j++) {
                if(j) {
                    while(!q.empty()&&vertical[q.back()]<=vertical[j-1])q.pop_back();
                    q.push_back(j-1);
                }
                while(!q.empty()&&q.front()<j-g-1)q.pop_front();
                if(a[i]==b[j]) {
                    row[j]=1+(q.empty()?0:vertical[q.front()]);
                    answer=max(answer,int(row[j]));
                }
            }
            int node=size+i;tree[node]=move(row);
            for(node/=2;node;node/=2)
                for(int j=0;j<m;j++)tree[node][j]=max(tree[2*node][j],tree[2*node+1][j]);
        }
        if(query)cout<<' ';cout<<answer;
    }
    cout<<'\n';
}
'''


def build():
    originals = {x['code']:x for x in json.loads((ROOT/'src/lib/newProblemLessons/data/national1.json').read_text(encoding='utf8'))}
    checks = json.loads((HERE/'national1-checks.json').read_text(encoding='utf8'))
    for code,cpp,py in [('a883',CPP883,PY883),('a904',CPP904,PY904)]:
        lesson=dict(originals[code]);lesson['cpp']=cpp;lesson['python']=py
        if code=='a883':
            lesson.update(concept='指派對偶、交錯樹與整數欄位打包',goal='以精確最大權匹配求最小標記覆蓋，並避免相同鬆弛量造成的冗長掃描。',explanation=[
                '任一完美匹配的邊權和都是覆蓋花費的下界；指派問題的整數對偶性保證最大權匹配值正好等於最小整數標記花費。標記不需要另外限制非負。',
                'Hungarian 維持可行標記 u[i]+v[j]≥A[i][j]，以及只使用相等邊的匹配。從一個未匹配列建立交錯樹，S 是已加入列、T 是已加入行，slack[j] 是所有 S 列到未加入行 j 的最小差 u[i]+v[j]−A[i][j]。',
                '若沒有零鬆弛行，取最小鬆弛 δ，對 S 的 u 減 δ、T 的 v 加 δ、其他行的 slack 減 δ。所有差仍非負，既有相等匹配邊仍相等，且至少產生一條可擴張的相等邊。遇到未匹配行就沿父指標增廣；相同鬆弛量時優先選未匹配行是一般的正確選擇，並非特例判斷。',
                'C++ 直接維護各行鬆弛量及來源。Python 把整列數值放進大整數的 16 位元欄位，低 15 位儲存值、最高位作減法保護位；所有輸入權重≤1000，可行標記 u、v 始終介於 0 與 1000，差最多 2000，因此不會跨欄進借位。',
                '令 ONE 的每欄最低位是 1、GUARD=ONE<<15。對非負欄值 x、y，((x|GUARD)−y)&GUARD 的該欄保護位為 1 恰在 x≥y；把這些旗標展開成低 15 位遮罩，就能一次求出所有欄的 min 或 max。Python 以這個公式更新整列 slack，並用對閾值的二分找其最小值。',
                'Python 不必逐欄保存每次改善鬆弛量的來源：選到零鬆弛行 j 時，將整個 u 向量加上 v[j] 再減第 j 行的權重向量，從 S 中找差為零的列作父節點。交錯樹加入順序確保回溯不成環。所有運算只是同一 Hungarian 不變量的精確批次執行。',
                '標記界線的理由：尚未匹配的行其 v 永遠為 0，因此 δ 不大於任一 S 列的 u，u 不會變負；每個正 v 的行都有相等匹配邊，所以 v=A−u≤1000。最後完美匹配全部相等，匹配值與可行覆蓋值相同，因而同時達到最優。'
            ],complexity='C++ 時間 O(n³)、空間 O(n²)。Python 每輪最多加入 n 行，共 n 輪；令 L=ceil(16n/w) 為一個打包整數的機器字數，W=max A≤1000，位元操作時間 O(n² L(1+log(W+1))+n²)，空間 O(n²) 個輸入整數及 O(n²) 個打包位元；不是把任意長整數運算當 O(1)。兩語言另計輸入儲存，Python read().split() 的文字與詞元為 O(I)。',pitfall='不能把每列最大值直接相加。欄位寬度依已知權重上限設計，不能無理由縮小；保護位與值位的遮罩必須分開。')
        else:
            lesson.update(concept='端點 DP、列區間樹與分欄最大值打包',goal='每列只查一次合法前驅矩形，消除不同間距種類數的額外掃描因子。',explanation=[
                'dp[i][j] 只表示以 a[i]=b[j] 作最後匹配的最佳長度，其他位置記 0。若新字母間距為 g，合法前驅恰在 [i−g−1,i−1]×[j−g−1,j−1]，取矩形最大值加 1；空矩形最大值視為 0，允許從這個匹配重新開始。',
                '以 a 的位置作線段樹索引，每個葉節點保存一整列 dp 的向量；內部節點保存各欄分別取最大後的向量。處理第 i 列時，只查列範圍 [max(0,i−g−1),i)，就一次得到所有欄的垂直最大值。g 只依當列字母決定，不需要同時為其他 25 種間距計算。',
                '對取得的欄向量用單調佇列維護前 g+1 欄最大值，便得到每個 j 的完整前驅矩形最大值。先查完當列全部匹配，再把整列寫入樹，確保不會重複使用當前 a 位置；水平窗也只包含 j 之前的位置。',
                '每個合法鏈的最後匹配一定由上述合法矩形內某個前驅延伸；反之矩形內的合法鏈加上新匹配必符合兩邊間距，因此 DP 不漏解也不高估。線段樹只是把垂直區間最大值拆成互不重疊節點，逐欄最大值的結合性保證結果與直接掃描一致。',
                'C++ 以 uint16_t 向量儲存節點；Python 將各欄打包為 16 位元欄位，DP 值最多 800，低 15 位足夠，最高位作保護。令 GUARD 的每欄最高位為 1，((x|GUARD)−y)&GUARD 的該欄為 1 恰在 x≥y；展開此比較遮罩後，在各欄分別選 x 或 y，可一次完成節點向量合併，完全沒有浮點或跨欄進借位。',
                '兩字串可互換，因此以較短者作樹的列數。未給間距的字母用不小於兩序列長度的值表示無限制；這只是精確等價的表示，不是截斷合法搜尋。每組限制各自重建 DP。'
            ],complexity='令 a=min(|S|,|T|)、b=max(|S|,|T|)、Q≤5。C++ 總時間 O(Qab log(a+1))、空間 O(ab)。Python 令 L=ceil(16b/w) 為打包向量的機器字數，總時間 O(Q(ab+a log(a+1)L))，空間 O(ab) 位元及 O(b) 暫存整數；大整數合併不是 O(1)。輸入字串與 read().split() 詞元另需 O(I) 空間。',pitfall='限制屬於新加入的字母，且兩邊前驅索引都必須嚴格小於目前位置。不能在列尚未算完時提前更新樹，也不能把水平窗含入當前 j。')
        candidate=dict(code=code,lesson=lesson,checks=[x for x in checks if x['code']==code],limits=dict(liveUrl='https://oj.itousouta.me/problems/'+code,baseTimeLimitMs=6000 if code=='a883' else 2000,pythonTimeMultiplier=3,effectivePythonLimitMs=18000 if code=='a883' else 6000,memoryLimitMb=512,multiplierEvidence='src/lib/languages.ts python.timeMultiplier=3; src/lib/judgeCore.ts multiplies job.timeLimitMs by lang.timeMultiplier'),validation=dict(status='not-yet-verified'))
        (HERE/(code+'-candidate.json')).write_text(json.dumps(candidate,ensure_ascii=False,indent=2)+'\n',encoding='utf8')


def verify():
    if sys.platform=='win32':raise SystemExit('Run --verify in WSL kali-linux/Linux; no Windows C++ compilation or binaries.')
    candidates={code:json.loads((HERE/(code+'-candidate.json')).read_text(encoding='utf8')) for code in ['a883','a904']}
    rng=random.Random(88390420261103)
    # In-process function probes expose a defect quickly without repeatedly
    # launching interpreters; full programs are tested separately below.
    env={'__name__':'probe'};exec(PY883,env)
    for trial in range(200):
        n=rng.randint(1,7);a=[[rng.randrange(1001) for _ in range(n)] for _ in range(n)]
        expected=max(sum(a[i][p[i]] for i in range(n)) for p in itertools.permutations(range(n)))
        actual=env['maximum_assignment'](a)
        assert actual==expected,('a883',a,expected,actual)
    env={'__name__':'probe'};exec(PY904,env)
    for trial in range(200):
        a=''.join(rng.choice('ABCD') for _ in range(rng.randint(1,9)))
        b=''.join(rng.choice('ABCD') for _ in range(rng.randint(1,9)))
        gap=[rng.randrange(5) for _ in range(26)]
        # Deliberately independent O(a²b²) endpoint predecessor enumeration.
        d=[[0]*len(b) for _ in a];expected=0
        for i,c in enumerate(a):
            g=gap[ord(c)-65]
            for j,x in enumerate(b):
                if c==x:
                    d[i][j]=1+max([0]+[d[u][v] for u in range(max(0,i-g-1),i) for v in range(max(0,j-g-1),j)])
                    expected=max(expected,d[i][j])
        actual=env['glcs'](a,b,gap)
        assert actual==expected,('a904',a,b,gap,expected,actual)
    print('400 independent in-process probes passed.',flush=True)
    with tempfile.TemporaryDirectory(prefix='performance-candidates-',dir='/tmp') as folder:
        for code,candidate in candidates.items():
            path=pathlib.Path(folder)/code;lesson=candidate['lesson']
            cpp=path.with_suffix('.cpp');python=path.with_suffix('.py')
            cpp.write_text(lesson['cpp']);python.write_text(lesson['python'])
            result=subprocess.run(['g++','-std=c++17','-O2',str(cpp),'-o',str(path)],capture_output=True,text=True,timeout=90)
            assert result.returncode==0,result.stderr
            source=next(x for x in json.loads((HERE/'source.json').read_text(encoding='utf8'))['problems'] if x['code']==code)
            tests=candidate['checks']+[dict(input=x['input'],output=x['output'],reason='Public sample') for x in source['samples']]
            if code=='a883':
                n=500;inp=str(n)+'\n'+'\n'.join(' '.join(['0']*n) for _ in range(n))
                tests.append(dict(input=inp,output='0',reason='Maximum500 all-zero tie matrix; every assignment weight0.'))
            else:
                s=('ABCDEFGHIJKLMNOPQRSTUVWXYZ'*31)[:800]
                config=' '.join(f'{c} {i}' for i,c in enumerate('ABCDEFGHIJKLMNOPQRSTUVWXYZ'))+' $'
                inp=s+'\n'+s+'\n5\n'+'\n'.join([config]*5)
                tests.append(dict(input=inp,output='800 800 800 800 800',reason='Maximum800 identical sequences,5 configurations,26 gap kinds; full diagonal achieves upper bound800.'))
            tests=list({(x['input'],x['output']):x for x in tests}.values())
            results=[]
            for i,test in enumerate(tests):
                for lang,command,limit in [('cpp',[str(path)],candidate['limits']['baseTimeLimitMs']/1000),('python',['python3',str(python)],candidate['limits']['effectivePythonLimitMs']/1000)]:
                    start=time.monotonic()
                    try:
                        p=subprocess.run(command,input=test['input'],capture_output=True,text=True,timeout=limit)
                        elapsed=time.monotonic()-start
                        row=dict(case=i,language=lang,inputSha256=SHA(test['input']),expectedSha256=SHA(test['output']),actual=p.stdout.strip(),seconds=round(elapsed,4),limitSeconds=limit,passed=p.returncode==0 and p.stdout.strip()==test['output'].strip())
                    except subprocess.TimeoutExpired:
                        row=dict(case=i,language=lang,inputSha256=SHA(test['input']),passed=False,timeoutSeconds=limit)
                    results.append(row)
                    print(code,lang,i,row,flush=True)
            candidate['checks']=[dict(code=code,**{k:v for k,v in x.items() if k!='code'}) for x in tests if x['reason']!='Public sample']
            candidate['validation']=dict(status='pass' if all(x['passed'] for x in results) else 'failed',environment='WSL kali-linux/Linux; g++ -std=c++17 -O2 and Python3',codeHashes={lang:SHA(lesson[lang]) for lang in ['cpp','python']},independentProbeCount=200,runtime=results)
            (HERE/(code+'-candidate.json')).write_text(json.dumps(candidate,ensure_ascii=False,indent=2)+'\n',encoding='utf8')


if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--build',action='store_true');p.add_argument('--verify',action='store_true');args=p.parse_args()
    if args.build:build()
    if args.verify:verify()
