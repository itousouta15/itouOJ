import type { ToiPotentialLesson } from "@/lib/toiPotentialLessonTypes";
import { defineToiPotentialLesson } from "@/lib/toiPotentialLessonBuilder";

export const lessons: ToiPotentialLesson[] = [
  defineToiPotentialLesson("a108", {
    topic: "dp",
    level: "hard",
    concept: "二元搜尋樹・左右子樹交錯計數",
    goal: "把相同房間分配轉成相同搜尋樹，計算保持祖先先於後代的排列。",
    explanation: [
      "編號較小往左、較大往右，正是二元搜尋樹插入。房號可能長達千位元，完全不用真的計算：只記錄每個節點的左右孩子即可。依原順序建樹，後插入的節點索引必較大，因此反向掃描插入索引就是合法的由下往上計算順序。",
      "每個子樹的根必須先入住，否則其房間會被別人拿走。根固定後，左子樹 L 人和右子樹 R 人互不干涉；從 L+R 個位置挑 L 個放左側序列，有 C(L+R,L) 種。因此 ways[u]=C(L+R,L)×ways[left]×ways[right]。反過來，任何保持兩側內部合法順序的交錯都會重建同一棵樹，故不重不漏。階乘及模反元素讓每次組合數查詢只需常數時間。",
    ],
    complexity:
      "建樹最壞 O(N²)，計數 O(N+log MOD)，空間 O(N)；N≤1000，MOD=1000000007。",
    pitfall:
      "不能用 64 位元整數儲存房號；退化樹深度可達 1000，也應避免 Python 遞迴。",
    traceLabel: "公開範例：3 1 2 5 4 的子樹計數",
    trace: [
      {
        title: "建立搜尋樹",
        description: "3 是根，左側為 1→右孩子 2，右側為 5→左孩子 4。",
        cells: ["根3", "左1→2", "右5←4"],
        active: [0],
        variables: [["N", "5"]],
      },
      {
        title: "兩側各只有一種順序",
        description: "左側必須先 1 後 2，右側必須先 5 後 4。",
        cells: ["1,2", "5,4"],
        active: [0, 1],
        variables: [
          ["L,R", "2,2"],
          ["兩側 ways", "1,1"],
        ],
      },
      {
        title: "交錯四個位置",
        description: "3 固定第一位，後面挑兩個位置放 1、2，共 C(4,2)=6。",
        cells: ["3", "左/右", "左/右", "左/右", "左/右"],
        active: [1, 2, 3, 4],
        variables: [["答案", "6"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
using namespace std;
const long long MOD = 1000000007;
long long power(long long a, long long e) {
    long long r = 1;
    for (; e; e >>= 1, a = a * a % MOD)
        if (e & 1)
            r = r * a % MOD;
    return r;
}
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    vector<int> p(n), left(n, -1), right(n, -1), size(n, 1);
    for (int &x : p)
        cin >> x;
    for (int i = 1; i < n; ++i) {
        int u = 0;
        while (true) {
            int &v = p[i] < p[u] ? left[u] : right[u];
            if (v == -1) {
                v = i;
                break;
            }
            u = v;
        }
    }
    vector<long long> fac(n + 1, 1), inv(n + 1, 1), ways(n, 1);
    for (int i = 1; i <= n; ++i)
        fac[i] = fac[i - 1] * i % MOD;
    inv[n] = power(fac[n], MOD - 2);
    for (int i = n; i; --i)
        inv[i - 1] = inv[i] * i % MOD;
    for (int u = n - 1; u >= 0; --u) {
        int l = left[u], r = right[u];
        int a = l < 0 ? 0 : size[l], b = r < 0 ? 0 : size[r];
        size[u] = a + b + 1;
        ways[u] = fac[a + b] * inv[a] % MOD * inv[b] % MOD;
        if (l >= 0)
            ways[u] = ways[u] * ways[l] % MOD;
        if (r >= 0)
            ways[u] = ways[u] * ways[r] % MOD;
    }
    cout << ways[0] << '\n';
}`,
    python: String.raw`import sys

MOD = 1000000007
data = list(map(int, sys.stdin.buffer.read().split()))
n, p = data[0], data[1:]
left, right = [-1] * n, [-1] * n
for i in range(1, n):
    u = 0
    while True:
        child = left if p[i] < p[u] else right
        if child[u] == -1:
            child[u] = i
            break
        u = child[u]
fac = [1] * (n + 1)
for i in range(1, n + 1):
    fac[i] = fac[i - 1] * i % MOD
inv = [1] * (n + 1)
inv[n] = pow(fac[n], MOD - 2, MOD)
for i in range(n, 0, -1):
    inv[i - 1] = inv[i] * i % MOD
size, ways = [1] * n, [1] * n
for u in range(n - 1, -1, -1):
    l, r = left[u], right[u]
    a = 0 if l < 0 else size[l]
    b = 0 if r < 0 else size[r]
    size[u] = a + b + 1
    ways[u] = fac[a + b] * inv[a] % MOD * inv[b] % MOD
    if l >= 0:
        ways[u] = ways[u] * ways[l] % MOD
    if r >= 0:
        ways[u] = ways[u] * ways[r] % MOD
print(ways[0])
`,
  }),
  defineToiPotentialLesson("a109", {
    topic: "graphs",
    level: "easy",
    concept: "等權網格最短路・廣度優先搜尋",
    goal: "以佇列逐層擴張，求 S 到 E 的最少步數。",
    explanation: [
      "每走一格都花 1，所以先走完距離 d 的格子，再處理距離 d+1 的格子即可。把起點距離設為 0 並放進 FIFO 佇列；每次取出一格，檢查四個鄰居是否在範圍內、不是 # 且尚未發現。",
      "鄰居第一次被發現時，距離就是目前距離加 1。若存在更短路徑，其前一格必在更早的層被處理，矛盾。因此第一次入隊即可固定最短距離並標記，避免同格重複入隊。結束後終點仍為 -1 就表示不連通。",
    ],
    complexity: "時間 O(N²)、空間 O(N²)；每格最多入隊一次，N≤500。",
    pitfall: "起點距離是 0，不是 1；標記要在入隊時做，並且不能把 E 當障礙物。",
    traceLabel: "較小示例：2×2 全通迷宮 S0 / 0E",
    trace: [
      {
        title: "從 S 出發",
        description: "只有左上角已知距離。",
        cells: ["S:0", "?", "?", "E: ?"],
        active: [0],
        variables: [["queue", "(0,0)"]],
      },
      {
        title: "擴張第一層",
        description: "右邊與下邊都能在一步抵達。",
        cells: ["S:0", "1", "1", "E: ?"],
        active: [1, 2],
        variables: [["距離", "1"]],
      },
      {
        title: "發現終點",
        description: "由任一距離 1 的鄰居走到 E，最短時間為 2。",
        cells: ["S:0", "1", "1", "E:2"],
        active: [3],
        variables: [["答案", "2"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <string>
#include <queue>
using namespace std;
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    vector<string> g(n);
    for (auto &s : g)
        cin >> s;
    vector<int> dist(n * n, -1);
    queue<int> q;
    dist[0] = 0;
    q.push(0);
    int dr[] = {-1, 1, 0, 0}, dc[] = {0, 0, -1, 1};
    while (!q.empty()) {
        int u = q.front();
        q.pop();
        for (int d = 0; d < 4; ++d) {
            int r = u / n + dr[d], c = u % n + dc[d];
            if (r < 0 || r >= n || c < 0 || c >= n)
                continue;
            int v = r * n + c;
            if (g[r][c] != '#' && dist[v] == -1) {
                dist[v] = dist[u] + 1;
                q.push(v);
            }
        }
    }
    cout << dist.back() << '\n';
}`,
    python: String.raw`import sys
from collections import deque

read = sys.stdin.buffer.readline
n = int(read())
grid = [read().strip() for _ in range(n)]
dist = [-1] * (n * n)
dist[0] = 0
queue = deque([0])
while queue:
    u = queue.popleft()
    r, c = divmod(u, n)
    for nr, nc in ((r - 1, c), (r + 1, c), (r, c - 1), (r, c + 1)):
        if 0 <= nr < n and 0 <= nc < n:
            v = nr * n + nc
            if grid[nr][nc] != ord('#') and dist[v] == -1:
                dist[v] = dist[u] + 1
                queue.append(v)
print(dist[-1])
`,
  }),
  defineToiPotentialLesson("a110", {
    topic: "dp",
    level: "hard",
    concept: "位元遮罩・末位狀態・多筆預處理",
    goal: "同時記錄已出現的 1～9 與最後一位，計算全部詢問。",
    explanation: [
      "令 dp[mask][d] 表示目前長度、末位為 d+1、已出現數字集合恰為 mask 的數量。長度 1 時每個數字各有一種。加上新末位 e+1 時，只能從 |d-e|≤2 的狀態轉移，集合變成 mask OR (1<<e)。這恰好記住未來需要的兩件事：相鄰限制及是否九種都出現。",
      "每個合法字串刪除末位後會落在唯一的前一狀態，因此轉移不重不漏。每層儲存完整集合 511 的九種末位答案，即可回答相同長度的所有查詢。長度本身用迴圈推進，兩層滾動陣列即可，不必保存全部遮罩歷史。少於九位必然沒有答案。",
    ],
    complexity:
      "設最大詢問長度為 P：時間 O(P×2⁹×9×5+N)，空間 O(2⁹×9+9P+N)；P≤1000、N≤10000。",
    pitfall: "只限制相鄰差並不足夠，必須檢查 mask=511；數字 0 完全不能使用。",
    traceLabel: "具體前綴 1→3→2 的遮罩轉移（非完整答案）",
    trace: [
      {
        title: "第一位 1",
        description: "數字 1 對應最低位元。",
        cells: ["1", "mask=1"],
        active: [0, 1],
        variables: [
          ["長度", "1"],
          ["末位", "1"],
        ],
      },
      {
        title: "接上 3",
        description: "|1-3|=2 合法，集合新增數字 3 的位元 4。",
        cells: ["13", "mask=5"],
        active: [0, 1],
        variables: [
          ["長度", "2"],
          ["末位", "3"],
        ],
      },
      {
        title: "接上 2",
        description:
          "|3-2|=1 合法，mask=5 OR 2=7；尚缺 4～9，不能計入全數出現答案。",
        cells: ["132", "mask=7", "目標511"],
        active: [1, 2],
        variables: [
          ["長度", "3"],
          ["全數出現", "否"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <array>
#include <algorithm>
using namespace std;
const int MOD = 1000000007;
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    vector<pair<int, int>> queries(n);
    int limit = 0;
    for (auto &[p, q] : queries) {
        cin >> p >> q;
        limit = max(limit, p);
    }
    vector<array<int, 9>> answers(limit + 1);
    vector<array<int, 9>> dp(512), next(512);
    for (int d = 0; d < 9; ++d)
        dp[1 << d][d] = 1;
    for (int length = 1; length <= limit; ++length) {
        answers[length] = dp[511];
        if (length == limit)
            break;
        fill(next.begin(), next.end(), array<int, 9>{});
        for (int mask = 1; mask < 512; ++mask)
            for (int d = 0; d < 9; ++d) {
                int value = dp[mask][d];
                if (!value)
                    continue;
                for (int e = max(0, d - 2); e <= min(8, d + 2); ++e) {
                    int &x = next[mask | (1 << e)][e];
                    x += value;
                    if (x >= MOD)
                        x -= MOD;
                }
            }
        dp.swap(next);
    }
    for (auto [p, q] : queries)
        cout << answers[p][q - 1] << '\n';
}`,
    python: String.raw`import sys

MOD = 1000000007
data = list(map(int, sys.stdin.buffer.read().split()))
queries = list(zip(data[1::2], data[2::2]))
limit = max(p for p, _ in queries)
neighbors = [range(max(0, d - 2), min(8, d + 2) + 1) for d in range(9)]
dp = [[0] * 9 for _ in range(512)]
for d in range(9):
    dp[1 << d][d] = 1
answers = [[0] * 9 for _ in range(limit + 1)]
for length in range(1, limit + 1):
    answers[length] = dp[511][:]
    if length == limit:
        break
    nxt = [[0] * 9 for _ in range(512)]
    for mask in range(1, 512):
        for d, value in enumerate(dp[mask]):
            if value:
                for e in neighbors[d]:
                    row = nxt[mask | (1 << e)]
                    row[e] = (row[e] + value) % MOD
    dp = nxt
print('\n'.join(str(answers[p][q - 1]) for p, q in queries))
`,
  }),
  defineToiPotentialLesson("a111", {
    topic: "dp",
    level: "hard",
    concept: "子集合最短 Hamilton 路徑・字典序重建",
    goal: "在 N≤17 時以集合 DP 找最小衝突，再逐位選最小可行編號。",
    explanation: [
      "定義 dp[mask][v]：從 v 出發、恰好走過 mask 中每個士兵一次的最小衝突，其中 v 必須在 mask。單點集合成本為 0；其餘情況先移除 v，枚舉下一位 u，取 A[v][u]+dp[mask去掉v][u] 的最小值。移除一個位元後數值一定較小，按 mask 遞增就能迭代完成。",
      "整體最優值為 min dp[全集][v]。先選能達最優值的最小起點，再從小到大找滿足最優轉移等式的下一位。每次都保留某個全域最優解，且在第一個能選的位置使用最小編號，故所得排列是所有最佳排列中字典序最小者。最大衝突僅 16×100=1600，可用緊密的 16 位元 DP 陣列。",
    ],
    complexity: "時間 O(N²2ᴺ)，空間 O(N2ᴺ)；N=17 時約 223 萬個 16 位元狀態。",
    pitfall:
      "不能只在局部衝突相同時選小編號；必須用完整剩餘成本判斷。N=1 也須輸出兩行。",
    traceLabel: "公開範例：1–2 為 8、1–3 為 1、2–3 為 2",
    trace: [
      {
        title: "兩人子問題",
        description: "走完 {2,3} 的成本從任一人出發都是 2。",
        cells: ["dp[{2,3}][2]=2", "dp[{2,3}][3]=2"],
        active: [0, 1],
        variables: [["剩餘集合", "{2,3}"]],
      },
      {
        title: "比較起點",
        description:
          "起點 1 可走 1→3→2，成本 3；起點 2 也可達 3，但起點 3 至少為 9。",
        cells: ["起點1:3", "起點2:3", "起點3:9"],
        active: [0],
        variables: [
          ["最小成本", "3"],
          ["起點", "1"],
        ],
      },
      {
        title: "重建下一位",
        description: "選 2 需 8+2=10，選 3 只需 1+2=3，因此輸出 1 3 2。",
        cells: ["1", "3", "2"],
        active: [1, 2],
        variables: [
          ["排列", "1 3 2"],
          ["總和", "3"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <cstdint>
#include <algorithm>
using namespace std;
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    vector<vector<int>> a(n, vector<int>(n));
    for (auto &row : a)
        for (int &x : row)
            cin >> x;
    int total = 1 << n;
    vector<uint16_t> dp(total * n, 65535);
    for (int mask = 1; mask < total; ++mask) {
        for (int v = 0; v < n; ++v)
            if (mask & (1 << v)) {
                int rem = mask ^ (1 << v), best = 65535;
                if (!rem)
                    best = 0;
                for (int u = 0; u < n; ++u)
                    if (rem & (1 << u))
                        best = min(best, a[v][u] + dp[rem * n + u]);
                dp[mask * n + v] = best;
            }
    }
    int mask = total - 1, v = 0;
    for (int u = 1; u < n; ++u)
        if (dp[mask * n + u] < dp[mask * n + v])
            v = u;
    cout << dp[mask * n + v] << '\n';
    for (int step = 0; step < n; ++step) {
        if (step)
            cout << ' ';
        cout << v + 1;
        int rem = mask ^ (1 << v);
        for (int u = 0; u < n; ++u)
            if ((rem & (1 << u)) && a[v][u] + dp[rem * n + u] == dp[mask * n + v]) {
                v = u;
                break;
            }
        mask = rem;
    }
    cout << '\n';
}`,
    python: String.raw`import sys
from array import array

data = list(map(int, sys.stdin.buffer.read().split()))
n = data[0]
a = [data[1 + i * n : 1 + (i + 1) * n] for i in range(n)]
total = 1 << n
dp = array('H', [65535]) * (total * n)
for mask in range(1, total):
    bits = mask
    base = mask * n
    while bits:
        bit = bits & -bits
        v = bit.bit_length() - 1
        bits -= bit
        rem = mask ^ bit
        best = 65535 if rem else 0
        rest = rem
        row = a[v]
        rem_base = rem * n
        while rest:
            low = rest & -rest
            u = low.bit_length() - 1
            rest -= low
            value = row[u] + dp[rem_base + u]
            if value < best:
                best = value
        dp[base + v] = best
mask = total - 1
v = min(range(n), key=lambda u: dp[mask * n + u])
print(dp[mask * n + v])
order = []
while mask:
    order.append(v + 1)
    rem = mask ^ (1 << v)
    for u in range(n):
        if rem & (1 << u) and a[v][u] + dp[rem * n + u] == dp[mask * n + v]:
            v = u
            break
    mask = rem
print(*order)
`,
  }),
  defineToiPotentialLesson("a112", {
    topic: "dp",
    level: "medium",
    concept: "重量背包・保留與丟棄的成本",
    goal: "枚舉保留總重量，找出清運費與超重費的最佳平衡。",
    explanation: [
      "令 dp[w] 為已處理行李中，恰保留重量 w 的最少清運費。起初只有 dp[0]=0。對重量 W、清運費 L 的行李，丟棄時重量不變且加 L，保留時重量增加 W 且不加清運費。使用新陣列承接兩種選擇，確保每件行李恰選一次。",
      "處理完所有物品後，同一個保留重量的超重費固定為 max(0,w-T)×V，因此只需保留該重量最小的清運費；這正是 DP 的最佳子結構。對所有可達重量加上超重費取最小即可，不可貪心地單看每件行李的費用重量比。",
    ],
    complexity:
      "令 S=ΣWi≤10000，時間 O(NS)、空間 O(S)；費用計算使用 64 位元整數。",
    pitfall:
      "重量等於 T 不收超重費；不能直接把所有超過 T 的重量狀態丟掉，保留超重可能更便宜。",
    traceLabel: "公開範例：T=6、V=2，列出具體候選",
    trace: [
      {
        title: "全部保留",
        description: "保留重量 4+5+2=11，超重 5，費用 10。",
        cells: ["4保留", "5保留", "2保留"],
        active: [0, 1, 2],
        variables: [
          ["重量", "11"],
          ["總費用", "10"],
        ],
      },
      {
        title: "丟棄第一件",
        description: "清運費 6，保留 5+2=7，超重費 2，總費用 8。",
        cells: ["4丟棄:6", "5保留", "2保留"],
        active: [0],
        variables: [
          ["重量", "7"],
          ["總費用", "8"],
        ],
      },
      {
        title: "另一個最佳解",
        description: "丟棄重量 5 的行李付 8，剩下重量 6 不超重，仍為 8。",
        cells: ["4保留", "5丟棄:8", "2保留"],
        active: [1],
        variables: [
          ["重量", "6"],
          ["最小值", "8"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, t;
    long long v;
    cin >> n >> t >> v;
    const long long INF = 1LL << 60;
    vector<long long> dp(1, 0);
    for (int i = 0; i < n; ++i) {
        int w, l;
        cin >> w >> l;
        vector<long long> next(dp.size() + w, INF);
        for (int x = 0; x < (int)dp.size(); ++x)
            if (dp[x] != INF) {
                next[x] = min(next[x], dp[x] + l);
                next[x + w] = min(next[x + w], dp[x]);
            }
        dp.swap(next);
    }
    long long answer = INF;
    for (int w = 0; w < (int)dp.size(); ++w)
        answer = min(answer, dp[w] + max(0, w - t) * v);
    cout << answer << '\n';
}`,
    python: String.raw`import sys

data = list(map(int, sys.stdin.buffer.read().split()))
n, t, v = data[:3]
INF = 10**30
dp = [0]
for i in range(n):
    w, fee = data[3 + 2 * i : 5 + 2 * i]
    nxt = [INF] * (len(dp) + w)
    for weight, cost in enumerate(dp):
        if cost == INF:
            continue
        nxt[weight] = min(nxt[weight], cost + fee)
        nxt[weight + w] = min(nxt[weight + w], cost)
    dp = nxt
print(min(cost + max(0, weight - t) * v for weight, cost in enumerate(dp)))
`,
  }),
  defineToiPotentialLesson("a113", {
    topic: "graphs",
    level: "easy",
    concept: "高度差建邊・連通區塊搜尋",
    goal: "從零起算座標的起點，數出所有能沿合法高度差到達的格子。",
    explanation: [
      "每個格子視為頂點，只有上下左右且高度差絕對值≤2 才有邊。用顯式堆疊做 DFS：先標記起點，再逐一加入尚未看過的合法鄰居。高度限制比較的是相鄰兩格，不是每格與起點的差。",
      "搜尋中每個已標記格子都有一條由起點接來的合法路徑，所以不會多算；任何可達格子沿路徑往回看，其前一格必會把它加入，因此也不會漏算。入堆疊立即標記能保證每格只加入一次。採用 bytearray 及一維索引可控制百萬格的額外記憶體。",
    ],
    complexity:
      "時間 O(N²)、空間 O(N²)，包含高度陣列、標記和最壞大小的堆疊；N≤1000。",
    pitfall: "起點本身必須計入；座標從 0 起算。不要用遞迴走百萬格。",
    traceLabel: "公開範例：從 (1,1) 高度 5 出發",
    trace: [
      {
        title: "起點與第一圈",
        description: "5 可接到上方 3、左方 4、右方 7、下方 7，已有 5 格可達。",
        cells: ["3", "4", "5", "7", "7"],
        active: [2],
        variables: [["已知可達", "5"]],
      },
      {
        title: "繼續沿相鄰高度走",
        description: "3 可接高度 1；兩個 7 可接上方 8、左下 8、右下 9。",
        cells: ["1", "3", "8", "4", "5", "7", "8", "7", "9"],
        active: [0, 2, 6, 8],
        variables: [["已知可達", "9"]],
      },
      {
        title: "連通區塊完成",
        description:
          "所有九格都能到達；高度 1 和起點 5 差 4 仍合法，因為可經過 3。",
        cells: ["5→3→1", "共9格"],
        active: [0, 1],
        variables: [["答案", "9"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <cstdlib>
using namespace std;
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, h, l;
    cin >> n >> h >> l;
    vector<int> height(n * n);
    for (int &x : height)
        cin >> x;
    vector<unsigned char> seen(n * n, 0);
    vector<int> stack = {h * n + l};
    seen[h * n + l] = 1;
    int count = 0, dr[] = {-1, 1, 0, 0}, dc[] = {0, 0, -1, 1};
    while (!stack.empty()) {
        int u = stack.back();
        stack.pop_back();
        ++count;
        for (int d = 0; d < 4; ++d) {
            int r = u / n + dr[d], c = u % n + dc[d];
            if (r < 0 || r >= n || c < 0 || c >= n)
                continue;
            int v = r * n + c;
            if (!seen[v] && llabs((long long)height[u] - height[v]) <= 2) {
                seen[v] = 1;
                stack.push_back(v);
            }
        }
    }
    cout << count << '\n';
}`,
    python: String.raw`import sys
from array import array

read = sys.stdin.buffer.readline
n = int(read())
h, l = map(int, read().split())
height = array('i')
for _ in range(n):
    height.extend(map(int, read().split()))
seen = bytearray(n * n)
start = h * n + l
seen[start] = 1
stack = [start]
count = 0
while stack:
    u = stack.pop()
    count += 1
    r, c = divmod(u, n)
    for nr, nc in ((r - 1, c), (r + 1, c), (r, c - 1), (r, c + 1)):
        if 0 <= nr < n and 0 <= nc < n:
            v = nr * n + nc
            if not seen[v] and abs(height[u] - height[v]) <= 2:
                seen[v] = 1
                stack.append(v)
print(count)
`,
  }),
  defineToiPotentialLesson("a114", {
    topic: "geometry",
    level: "easy",
    concept: "折線下方面積・兩倍梯形面積",
    goal: "以整數加總兩條折線的梯形面積，避免浮點數誤差。",
    explanation: [
      "一段折線由 (x₁,y₁) 接到 (x₂,y₂)，其與 x 軸間的兩倍面積是 (x₂-x₁)(y₁+y₂)。x 不遞減，各段下方面積沒有橫向重疊；垂直段寬為 0，直接貢獻 0，不需要除以斜率。",
      "兩條折線不相交，所以它們上下關係不會改變。分別積分再取差的絕對值，即為中間面積的兩倍；蛋糕高為 1，因此也就是要求的兩倍體積。兩線頂點不必對齊，也不需要合併斷點。總寬≤10⁹、最高 y≤10⁹，所以每條兩倍面積≤2×10¹⁸，64 位元有號整數足夠。",
    ],
    complexity:
      "時間 O(M+N)，額外空間 O(1)（C++ 串流）；Python 逐行讀頂點，輸入暫存 O(M+N)。",
    pitfall:
      "乘法前先轉為 64 位元；不能把垂直線段視為輸入錯誤，也不要用浮點數再四捨五入。",
    traceLabel: "公開範例：上折線 (0,8)→(3,5)→(6,8)，下線 y=2",
    trace: [
      {
        title: "上方第一段",
        description: "寬 3，上下高度和 13，兩倍面積為 39。",
        cells: ["(0,8)", "(3,5)", "累計39"],
        active: [0, 1],
        variables: [["上方面積×2", "39"]],
      },
      {
        title: "上方第二段",
        description: "第二段也是 3×(5+8)=39，合計 78。",
        cells: ["(3,5)", "(6,8)", "累計78"],
        active: [0, 1],
        variables: [["上方面積×2", "78"]],
      },
      {
        title: "扣除下方",
        description: "下線的兩倍面積是 6×(2+2)=24；相差 54。",
        cells: ["78", "−24", "54"],
        active: [2],
        variables: [["兩倍體積", "54"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <cstdlib>
using namespace std;
long long area(int count) {
    long long x, y, sum = 0;
    cin >> x >> y;
    for (int i = 1; i < count; ++i) {
        long long nx, ny;
        cin >> nx >> ny;
        sum += (nx - x) * (y + ny);
        x = nx;
        y = ny;
    }
    return sum;
}
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int m, n;
    cin >> m >> n;
    long long a = area(m), b = area(n);
    cout << llabs(a - b) << '\n';
}`,
    python: String.raw`import sys

read = sys.stdin.buffer.readline
m, n = map(int, read().split())


def area(count):
    points = list(map(int, read().split()))
    total = 0
    for i in range(2, 2 * count, 2):
        total += (points[i] - points[i - 2]) * (points[i + 1] + points[i - 1])
    return total


upper = area(m)
lower = area(n)
print(abs(upper - lower))
`,
  }),
  defineToiPotentialLesson("a115", {
    topic: "graphs",
    level: "medium",
    concept: "有優先順序的多源 BFS・同步擴散",
    goal: "按時間、編號排序的探索順序，一次求出 T 分鐘內的菌落。",
    explanation: [
      "先把所有初始細菌依編號 1 到 K 放進佇列，時間皆為 0。依序取出 (格子,時間)，向可生存且尚未占據的鄰居擴散，立即寫入同一菌種並以時間加 1 入隊。時間等於 T 時不再擴張；不必真的模擬最多二十億分鐘。",
      "FIFO 先處理時間較小的一層。在同一層，初始順序按菌種遞增，且每個父格只產生相同菌種的孩子，所以這個順序逐層保持。故同分鐘競爭一格時，最小編號一定先寫入。已占據的格子不再改寫，也就符合題目的永久占有規則。",
    ],
    complexity:
      "時間 O(MN+K)，空間 O(MN+K)；每格最多入隊一次，與 T 的數值大小無關。",
    pitfall:
      "初始佇列不能直接按盤面列順序加入，否則同分鐘的編號優先會錯；-1 永遠不能入隊。",
    traceLabel: "公開範例：中心礁格，T=2",
    trace: [
      {
        title: "時間 0",
        description: "1 在右下、2 在左上；先將菌種 1 入隊。",
        cells: ["2 0 0", "0 # 0", "0 0 1"],
        active: [0, 2],
        variables: [["數量1,2", "1,1"]],
      },
      {
        title: "時間 1",
        description: "1 占右中與下中，2 占上中與左中。",
        cells: ["2 2 0", "2 # 1", "0 1 1"],
        active: [0, 1, 2],
        variables: [["數量1,2", "3,3"]],
      },
      {
        title: "時間 2",
        description: "右上、左下都同時被兩種抵達，歸編號較小的 1。",
        cells: ["2 2 1", "2 # 1", "1 1 1"],
        active: [0, 2],
        variables: [["數量1,2", "5,3"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <queue>
using namespace std;
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int m, n, k, t;
    cin >> m >> n >> k >> t;
    vector<int> g(m * n), start(k + 1), count(k + 1, 1), dist(m * n, -1);
    for (int u = 0; u < m * n; ++u) {
        cin >> g[u];
        if (g[u] > 0)
            start[g[u]] = u;
    }
    queue<int> q;
    for (int id = 1; id <= k; ++id) {
        q.push(start[id]);
        dist[start[id]] = 0;
    }
    int dr[] = {-1, 1, 0, 0}, dc[] = {0, 0, -1, 1};
    while (!q.empty()) {
        int u = q.front();
        q.pop();
        if (dist[u] == t)
            continue;
        for (int d = 0; d < 4; ++d) {
            int r = u / n + dr[d], c = u % n + dc[d];
            if (r < 0 || r >= m || c < 0 || c >= n)
                continue;
            int v = r * n + c;
            if (g[v] == 0) {
                g[v] = g[u];
                ++count[g[u]];
                dist[v] = dist[u] + 1;
                q.push(v);
            }
        }
    }
    for (int id = 1; id <= k; ++id)
        cout << (id == 1 ? "" : " ") << count[id];
    cout << '\n';
}`,
    python: String.raw`import sys
from collections import deque

data = list(map(int, sys.stdin.buffer.read().split()))
m, n, k, t = data[:4]
grid = data[4:]
start = [0] * (k + 1)
for u, value in enumerate(grid):
    if value > 0:
        start[value] = u
queue = deque(start[1:])
dist = [-1] * (m * n)
count = [1] * (k + 1)
for u in queue:
    dist[u] = 0
while queue:
    u = queue.popleft()
    if dist[u] == t:
        continue
    r, c = divmod(u, n)
    for nr, nc in ((r - 1, c), (r + 1, c), (r, c - 1), (r, c + 1)):
        if 0 <= nr < m and 0 <= nc < n:
            v = nr * n + nc
            if grid[v] == 0:
                grid[v] = grid[u]
                count[grid[u]] += 1
                dist[v] = dist[u] + 1
                queue.append(v)
print(*count[1:])
`,
  }),
  defineToiPotentialLesson("a116", {
    topic: "graphs",
    level: "medium",
    concept: "島嶼標記・多源最短橋",
    goal: "把第一座島的所有陸地當作距離 0 的起點，搜尋第二座島。",
    explanation: [
      "先從任一陸地用迭代 DFS 標記整座第一島，並把這些陸地全加入 BFS 起點。從島內哪一格出發都不花建材，所以它們的距離都是 0。礁石不能進入；每擴張一格海水，距離加 1。",
      "第一島外的陸地必屬於第二島。當 BFS 從距離 d 的海水碰到它時，答案就是 d，不必為終點陸地再加 1。所有被搜尋的中間格都是單位成本海水，多源 BFS 仍依使用海水數遞增，因此首次碰到第二島即為最少建材；搜尋完仍未碰到則輸出 -1。",
    ],
    complexity:
      "時間 O(HW)、空間 O(HW)；H、W 最大各 1000，使用迭代搜尋避免呼叫堆疊溢位。",
    pitfall:
      "只從第一島任意一格出發並把島內移動算成距離會錯；第二島陸地不消耗建材。",
    traceLabel: "公開範例：第一島左側、第二島右側",
    trace: [
      {
        title: "第一島全設為 0",
        description: "(0,0)、(1,0) 都是免費起點。",
        cells: ["0 ? # ?", "0 ? ? B", "# # ? B"],
        active: [0, 1],
        variables: [["起點數", "2"]],
      },
      {
        title: "第一層海水",
        description: "可進入 (0,1)、(1,1)，各花 1 格建材。",
        cells: ["0 1 # ?", "0 1 ? B", "# # ? B"],
        active: [0, 1],
        variables: [["海水距離", "1"]],
      },
      {
        title: "經第二層抵達",
        description: "(1,2) 的距離是 2，右鄰為第二島，故答案是 2。",
        cells: ["0 1 # ?", "0 1 2 B", "# # ? B"],
        active: [1],
        variables: [["最少建材", "2"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <queue>
using namespace std;
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int h, w;
    cin >> h >> w;
    vector<int> g(h * w), dist(h * w, -1);
    int start = -1;
    for (int i = 0; i < h * w; ++i) {
        cin >> g[i];
        if (g[i] == 1)
            start = i;
    }
    vector<int> stack = {start};
    queue<int> q;
    dist[start] = 0;
    int dr[] = {-1, 1, 0, 0}, dc[] = {0, 0, -1, 1};
    while (!stack.empty()) {
        int u = stack.back();
        stack.pop_back();
        q.push(u);
        for (int d = 0; d < 4; ++d) {
            int r = u / w + dr[d], c = u % w + dc[d];
            if (r < 0 || r >= h || c < 0 || c >= w)
                continue;
            int v = r * w + c;
            if (g[v] == 1 && dist[v] == -1) {
                dist[v] = 0;
                stack.push_back(v);
            }
        }
    }
    while (!q.empty()) {
        int u = q.front();
        q.pop();
        for (int d = 0; d < 4; ++d) {
            int r = u / w + dr[d], c = u % w + dc[d];
            if (r < 0 || r >= h || c < 0 || c >= w)
                continue;
            int v = r * w + c;
            if (g[v] == 2 || dist[v] != -1)
                continue;
            if (g[v] == 1) {
                cout << dist[u] << '\n';
                return 0;
            }
            dist[v] = dist[u] + 1;
            q.push(v);
        }
    }
    cout << -1 << '\n';
}`,
    python: String.raw`import sys
from array import array
from collections import deque

read = sys.stdin.buffer.readline
h, w = map(int, read().split())
grid = array('b')
for _ in range(h):
    grid.extend(map(int, read().split()))
start = grid.index(1)
dist = array('i', [-1]) * (h * w)
dist[start] = 0
stack = [start]
queue = deque()


def neighbors(u):
    r, c = divmod(u, w)
    if r:
        yield u - w
    if r + 1 < h:
        yield u + w
    if c:
        yield u - 1
    if c + 1 < w:
        yield u + 1


while stack:
    u = stack.pop()
    queue.append(u)
    for v in neighbors(u):
        if grid[v] == 1 and dist[v] == -1:
            dist[v] = 0
            stack.append(v)
answer = -1
while queue and answer == -1:
    u = queue.popleft()
    for v in neighbors(u):
        if grid[v] == 2 or dist[v] != -1:
            continue
        if grid[v] == 1:
            answer = dist[u]
            break
        dist[v] = dist[u] + 1
        queue.append(v)
print(answer)
`,
  }),
  defineToiPotentialLesson("a117", {
    topic: "graphs",
    level: "medium",
    concept: "依賴 DAG・反向邊與拓樸計算",
    goal: "先算出原料，再把乘上用量的成本傳給使用它的材料。",
    explanation: [
      "每種材料先把成本設成加工費，未完成原料數設為 Mi。為每筆依賴建立反向邊：原料 s 指向使用它的材料 i，邊上存需求數量 a。沒有原料的材料已能確定成本，先放入佇列。",
      "取出成本已確定的 s，把 cost[s]×a 加到每個使用者 i，再將其未完成數減 1；降至 0 時，i 的全部原料成本已累加完，可繼續傳播。不變量是每條已處理原料邊恰貢獻一次。無環保證所有節點最後都能完成，不需要重複展開共享原料或冒險使用深遞迴。",
    ],
    complexity:
      "令 E=ΣMi，時間 O(N+E)、空間 O(N+E)；N≤1000。答案≤2×10⁹，累加使用 64 位元整數。",
    pitfall:
      "需求量必須乘上原料完整單位成本，不只是加工費；輸出依材料編號而非拓樸順序。",
    traceLabel: "公開範例：1 用 2×材料2 與 1×材料3",
    trace: [
      {
        title: "先完成材料 2",
        description: "材料 2 不需原料，成本是加工費 3。",
        cells: ["1:加工2", "2:完成3", "3:加工4"],
        active: [1],
        variables: [["queue", "2"]],
      },
      {
        title: "完成材料 3",
        description:
          "材料 3 用三單位材料 2，成本 4+3×3=13；材料 1 先收到 2×3=6。",
        cells: ["1:暫計8", "2:3", "3:13"],
        active: [2],
        variables: [["材料1未完成原料", "1"]],
      },
      {
        title: "完成材料 1",
        description: "再加材料 3 的 13，材料 1 成本為 2+6+13=21。",
        cells: ["1:21", "2:3", "3:13"],
        active: [0],
        variables: [["輸出", "21 / 3 / 13"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <queue>
using namespace std;
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    vector<long long> cost(n);
    for (auto &x : cost)
        cin >> x;
    vector<int> pending(n);
    vector<vector<pair<int, int>>> users(n);
    queue<int> q;
    for (int i = 0; i < n; ++i) {
        cin >> pending[i];
        for (int j = 0; j < pending[i]; ++j) {
            int s, a;
            cin >> s >> a;
            users[s - 1].push_back({i, a});
        }
        if (pending[i] == 0)
            q.push(i);
    }
    while (!q.empty()) {
        int s = q.front();
        q.pop();
        for (auto [i, a] : users[s]) {
            cost[i] += cost[s] * a;
            if (--pending[i] == 0)
                q.push(i);
        }
    }
    for (auto x : cost)
        cout << x << '\n';
}`,
    python: String.raw`import sys
from collections import deque

it = iter(map(int, sys.stdin.buffer.read().split()))
n = next(it)
cost = [next(it) for _ in range(n)]
users = [[] for _ in range(n)]
pending = [0] * n
for i in range(n):
    pending[i] = next(it)
    for _ in range(pending[i]):
        s, amount = next(it) - 1, next(it)
        users[s].append((i, amount))
queue = deque(i for i in range(n) if pending[i] == 0)
while queue:
    s = queue.popleft()
    for i, amount in users[s]:
        cost[i] += cost[s] * amount
        pending[i] -= 1
        if pending[i] == 0:
            queue.append(i)
print('\n'.join(map(str, cost)))
`,
  }),
  defineToiPotentialLesson("a118", {
    topic: "graphs",
    level: "medium",
    concept: "瓶頸最短路・min-max Dijkstra",
    goal: "把路徑成本改成最大單段氧氣需求，求最小可行容量。",
    explanation: [
      "每到一座島就能補滿，所以一條路線需要的容量等於沿途最大邊權，不是所有邊權之和。令 dist[v] 為目前找到的最小瓶頸值，起點為 0。由 u 經需求 w 的路到 v，候選值為 max(dist[u],w)，用較小者更新。",
      "選目前 dist 最小的未確定頂點後，未來經由更大瓶頸的頂點無法改善它：沿路加入一條邊只會使最大值不減。因此 Dijkstra 的貪心確定性仍成立，只要把加法換為 max。佇列清空仍無法到達就輸出 -1；A=B 時空路徑的容量為 0。",
    ],
    complexity:
      "二元堆實作時間 O((N+M)log(N+M))、空間 O(N+M)，包含可能的過期堆項目；N≤500。",
    pitfall: "最少總氧氣的路線未必有最小瓶頸；雙向道路需加入兩個方向。",
    traceLabel: "公開範例：0 到 3 的兩條候選路線",
    trace: [
      {
        title: "從 0 更新",
        description: "直達 1 需要 9，直達 2 需要 5。",
        cells: ["0:0", "1:9", "2:5", "3:∞"],
        active: [1, 2],
        variables: [["下一個確定", "2"]],
      },
      {
        title: "從 2 更新 3",
        description: "經 0→2→3 的瓶頸是 max(5,6)=6。",
        cells: ["0:0", "1:9", "2:5", "3:6"],
        active: [3],
        variables: [["候選容量", "6"]],
      },
      {
        title: "確定終點",
        description: "6 小於尚未確定的 9，先取出 3；另一條 0→1→3 瓶頸為 9。",
        cells: ["路線0→2→3", "容量6"],
        active: [0, 1],
        variables: [["答案", "6"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <queue>
#include <functional>
#include <algorithm>
using namespace std;
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, m;
    cin >> n >> m;
    vector<vector<pair<int, int>>> g(n);
    for (int i = 0; i < m; ++i) {
        int u, v, w;
        cin >> u >> v >> w;
        g[u].push_back({v, w});
        g[v].push_back({u, w});
    }
    int a, b;
    cin >> a >> b;
    const int INF = 1000000000;
    vector<int> dist(n, INF);
    dist[a] = 0;
    priority_queue<pair<int, int>, vector<pair<int, int>>, greater<pair<int, int>>> pq;
    pq.push({0, a});
    while (!pq.empty()) {
        auto [d, u] = pq.top();
        pq.pop();
        if (d != dist[u])
            continue;
        if (u == b)
            break;
        for (auto [v, w] : g[u])
            if (max(d, w) < dist[v]) {
                dist[v] = max(d, w);
                pq.push({dist[v], v});
            }
    }
    cout << (dist[b] == INF ? -1 : dist[b]) << '\n';
}`,
    python: String.raw`import sys
import heapq

it = iter(map(int, sys.stdin.buffer.read().split()))
n, m = next(it), next(it)
graph = [[] for _ in range(n)]
for _ in range(m):
    u, v, w = next(it), next(it), next(it)
    graph[u].append((v, w))
    graph[v].append((u, w))
a, b = next(it), next(it)
INF = 10**30
dist = [INF] * n
dist[a] = 0
heap = [(0, a)]
while heap:
    d, u = heapq.heappop(heap)
    if d != dist[u]:
        continue
    if u == b:
        break
    for v, w in graph[u]:
        candidate = max(d, w)
        if candidate < dist[v]:
            dist[v] = candidate
            heapq.heappush(heap, (candidate, v))
print(-1 if dist[b] == INF else dist[b])
`,
  }),
];
