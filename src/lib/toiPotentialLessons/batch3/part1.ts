import type { ToiPotentialLesson } from "@/lib/toiPotentialLessonTypes";
import { defineToiPotentialLesson } from "@/lib/toiPotentialLessonBuilder";

export const lessons: ToiPotentialLesson[] = [
  defineToiPotentialLesson("a152", {
    topic: "search",
    level: "medium",
    concept: "位元集合・最大獨立集",
    goal: "利用 N ≤ 17 枚舉所有人選，避免把局部挑選誤認為最佳答案。",
    explanation: [
      "將每人的朋友編成位元遮罩 friend[i]。集合 mask 取出最低有效位代表的人 v，剩餘集合 rest 若本來就合法，而且 rest 與 friend[v] 沒有交集，加入 v 後仍然沒有任何朋友對；反之，任一條件不成立都不能選。",
      "令 ok[0] 為真，依 mask 從小到大計算。rest 一定比 mask 小，故需要的子問題已完成。每個集合都有唯一的 v、rest 分解，歸納可知 ok 精確辨識所有獨立集，再取合法集合人數的最大值。",
    ],
    complexity:
      "時間 O(N² + 2^N)，空間 O(N + 2^N)；N ≤ 17，最多 131072 個集合。",
    pitfall:
      "不能只挑朋友最少的人；朋友關係要檢查整個已選集合，而不是只檢查上一個人。",
    traceLabel: "範例路徑圖：1—2—3—4—5",
    trace: [
      {
        title: "空集合",
        description: "沒有朋友對，先建立合法基底。",
        cells: ["1", "2", "3", "4", "5"],
        active: [],
        variables: [
          ["mask", "00000"],
          ["best", "0"],
        ],
      },
      {
        title: "挑選 1、3",
        description: "3 的朋友是 2、4，與集合 {1} 不相交。",
        cells: ["選1", "2", "選3", "4", "5"],
        active: [0, 2],
        variables: [
          ["mask", "00101"],
          ["ok", "true"],
          ["best", "2"],
        ],
      },
      {
        title: "挑選 1、3、5",
        description: "三人之間都沒有邊；枚舉結束後最大人數為 3。",
        cells: ["選1", "2", "選3", "4", "選5"],
        active: [0, 2, 4],
        variables: [
          ["mask", "10101"],
          ["best", "3"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;
int main() {
    int n;
    cin >> n;
    vector<int> friends(n);
    for (int i = 0; i < n; ++i)
        for (int j = 0, x; j < n; ++j) {
            cin >> x;
            if (x)
                friends[i] |= 1 << j;
        }
    vector<unsigned char> ok(1 << n), count(1 << n);
    ok[0] = 1;
    int answer = 0;
    for (int mask = 1; mask < (1 << n); ++mask) {
        int bit = mask & -mask, v = 0;
        while ((1 << v) != bit)
            ++v;
        int rest = mask ^ bit;
        count[mask] = count[rest] + 1;
        ok[mask] = ok[rest] && !(friends[v] & rest);
        if (ok[mask])
            answer = max(answer, int(count[mask]));
    }
    cout << answer << '\n';
}`,
    python: String.raw`import sys

data = iter(map(int, sys.stdin.buffer.read().split()))
n = next(data)
friends = [0] * n
for i in range(n):
    for j in range(n):
        if next(data):
            friends[i] |= 1 << j
ok = bytearray(1 << n)
ok[0] = 1
answer = 0
for mask in range(1, 1 << n):
    bit = mask & -mask
    v = bit.bit_length() - 1
    rest = mask ^ bit
    if ok[rest] and not (friends[v] & rest):
        ok[mask] = 1
        answer = max(answer, mask.bit_count())
print(answer)
`,
  }),
  defineToiPotentialLesson("a153", {
    topic: "graphs",
    level: "medium",
    concept: "固定圖建模・Floyd–Warshall",
    goal: "依題目的 30 條邊編號建圖，求兩面間的最小能量。",
    explanation: [
      "把 12 個面視為頂點，公共邊視為雙向加權邊。輸入的第 i 個成本只能配給題目列出的第 i 條邊，不能按自己畫圖時的順序重新編號。相同頂點距離為 0，其餘未直接相鄰者先設為無限大。",
      "Floyd 的第 k 輪允許路徑使用面 1 到 k 作為中繼點。最短路徑若經過 k，就能拆成 i 到 k 與 k 到 j；因此以 d[i][k]+d[k][j] 更新。所有邊成本為正，最短路徑不用繞圈，完成 12 輪就涵蓋答案。",
    ],
    complexity:
      "時間 O(12³ + 30)、空間 O(12²)，固定大小；最短簡單路徑最多 11 條邊，仍以 64 位元整數存距離。",
    pitfall:
      "面 2 的下方鄰居是 9、8；不可從直覺猜球面連接，也要同時設定反向邊。",
    traceLabel: "範例：全部邊成本為 3，從面 1 到面 7",
    trace: [
      {
        title: "建立直接距離",
        description: "面 1 與面 7 不相鄰，面 1 到面 3 的距離為 3。",
        cells: ["1→3:3", "3→7:3", "1→7:∞"],
        active: [0, 1],
        variables: [["d[1][7]", "∞"]],
      },
      {
        title: "允許面 3 中繼",
        description: "1→3→7 成本 3+3=6，得到可行路徑。",
        cells: ["1", "3", "7"],
        active: [0, 1, 2],
        variables: [
          ["候選成本", "6"],
          ["d[1][7]", "6"],
        ],
      },
      {
        title: "完成全部中繼",
        description: "沒有一條直接邊能到 7，至少要跨兩邊；6 已達此下界。",
        cells: ["至少2邊", "每邊3", "答案6"],
        active: [2],
        variables: [["輸出", "6"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <algorithm>
using namespace std;
int main() {
    int s, t;
    cin >> s >> t;
    const int edges[30][2] = {
        {1, 2}, {1, 3}, {1, 4},  {1, 5},   {1, 6},  {2, 3},  {3, 4},  {4, 5},  {5, 6},   {6, 2},
        {2, 9}, {2, 8}, {3, 8},  {3, 7},   {4, 7},  {4, 11}, {5, 11}, {5, 10}, {6, 10},  {6, 9},
        {7, 8}, {8, 9}, {9, 10}, {10, 11}, {11, 7}, {7, 12}, {8, 12}, {9, 12}, {10, 12}, {11, 12}};
    long long d[13][13];
    for (int i = 1; i <= 12; ++i)
        for (int j = 1; j <= 12; ++j)
            d[i][j] = i == j ? 0 : (1LL << 50);
    for (auto &e : edges) {
        long long w;
        cin >> w;
        d[e[0]][e[1]] = d[e[1]][e[0]] = w;
    }
    for (int k = 1; k <= 12; ++k)
        for (int i = 1; i <= 12; ++i)
            for (int j = 1; j <= 12; ++j)
                d[i][j] = min(d[i][j], d[i][k] + d[k][j]);
    cout << d[s][t] << '\n';
}`,
    python: String.raw`import sys

it = iter(map(int, sys.stdin.buffer.read().split()))
s, t = next(it), next(it)
edges = [
    (1, 2),
    (1, 3),
    (1, 4),
    (1, 5),
    (1, 6),
    (2, 3),
    (3, 4),
    (4, 5),
    (5, 6),
    (6, 2),
    (2, 9),
    (2, 8),
    (3, 8),
    (3, 7),
    (4, 7),
    (4, 11),
    (5, 11),
    (5, 10),
    (6, 10),
    (6, 9),
    (7, 8),
    (8, 9),
    (9, 10),
    (10, 11),
    (11, 7),
    (7, 12),
    (8, 12),
    (9, 12),
    (10, 12),
    (11, 12),
]
d = [[0 if i == j else 10**15 for j in range(13)] for i in range(13)]
for a, b in edges:
    d[a][b] = d[b][a] = next(it)
for k in range(1, 13):
    for i in range(1, 13):
        for j in range(1, 13):
            d[i][j] = min(d[i][j], d[i][k] + d[k][j])
print(d[s][t])
`,
  }),
  defineToiPotentialLesson("a154", {
    topic: "graphs",
    level: "medium",
    concept: "字典序約束・拓樸排序",
    goal: "從相鄰單字第一個不同字元推導先後關係。",
    explanation: [
      "兩個已排序的相鄰字串，只能由第一個不同的位置得知 u 排在 v 前，因此加一條 u→v。後面的位置無法推論；若一字串為另一個的前綴，也沒有新的字元關係。先記錄所有出現字元，即使某字元沒有邊也不能漏掉。",
      "對這些關係做 Kahn 拓樸排序：取出入度為 0 的字元、輸出並刪去出邊。每次取出者都沒有尚未輸出的前置限制，故輸出合法。相鄰比較足以保證整串單字有序，題目又保證出現字元的順序唯一，因此不需要額外決定平手規則。重複的邊只計一次入度。",
    ],
    complexity:
      "令 L 為所有字串總長度、Σ ≤ 64。時間 O(L + Σ²)、空間 O(Σ² + 最長字串)，程式逐行讀取，不儲存 N 個單字。",
    pitfall:
      "大小寫、+、/ 都是不同字元；不要用 ASCII 大小代替外星順序，也不能把相同邊重複增加入度。",
    traceLabel: "範例：xx、xy、y、z",
    trace: [
      {
        title: "比較前兩字",
        description: "xx 與 xy 的第二個字元不同，加入 x→y。",
        cells: ["x", "y", "z"],
        active: [0, 1],
        variables: [
          ["邊", "x→y"],
          ["入度", "0,1,0"],
        ],
      },
      {
        title: "完成關係",
        description: "xy 與 y 重複得到 x→y；y 與 z 加入 y→z。",
        cells: ["x:0", "y:1", "z:1"],
        active: [1, 2],
        variables: [["佇列", "x"]],
      },
      {
        title: "依序解除限制",
        description: "取 x 後 y 入度變 0，取 y 後 z 入度變 0，結果為 xyz。",
        cells: ["x", "y", "z"],
        active: [0, 1, 2],
        variables: [["輸出", "xyz"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <string>
#include <queue>
using namespace std;
int main() {
    int n;
    cin >> n;
    string line, previous;
    getline(cin, line);
    bool used[128] = {}, edge[128][128] = {};
    int indegree[128] = {};
    for (int i = 0; i < n; ++i) {
        getline(cin, line);
        if (!line.empty() && line.back() == '\r')
            line.pop_back();
        for (unsigned char c : line)
            used[c] = true;
        if (i) {
            size_t j = 0;
            while (j < previous.size() && j < line.size() && previous[j] == line[j])
                ++j;
            if (j < previous.size() && j < line.size()) {
                int a = previous[j], b = line[j];
                if (!edge[a][b]) {
                    edge[a][b] = true;
                    ++indegree[b];
                }
            }
        }
        previous = line;
    }
    queue<int> q;
    for (int c = 0; c < 128; ++c)
        if (used[c] && indegree[c] == 0)
            q.push(c);
    while (!q.empty()) {
        int u = q.front();
        q.pop();
        cout << char(u);
        for (int v = 0; v < 128; ++v)
            if (edge[u][v] && --indegree[v] == 0)
                q.push(v);
    }
    cout << '\n';
}`,
    python: String.raw`import sys
from collections import deque

stream = sys.stdin.buffer
n = int(stream.readline())
used = set()
edge = [set() for _ in range(128)]
degree = [0] * 128
previous = b''
for i in range(n):
    word = stream.readline().rstrip(b'\r\n')
    used.update(word)
    if i:
        for a, b in zip(previous, word):
            if a != b:
                if b not in edge[a]:
                    edge[a].add(b)
                    degree[b] += 1
                break
    previous = word
q = deque(c for c in used if degree[c] == 0)
answer = []
while q:
    u = q.popleft()
    answer.append(chr(u))
    for v in edge[u]:
        degree[v] -= 1
        if degree[v] == 0:
            q.append(v)
print(''.join(answer))
`,
  }),
  defineToiPotentialLesson("a155", {
    topic: "math",
    level: "medium",
    concept: "質因數指數・枚舉混合因數 6",
    goal: "同時滿足因數數量最少與排序後字典序最小。",
    explanation: [
      "先分解出 2、3、5、7 的指數。若還有剩餘質因數就無解，因為 2 到 9 不含它。5、7 只能各自成為一位因數；只有 6 會同時使用 2 與 3，所以枚舉 6 的個數 x，就將剩餘問題分離成純 2 冪與純 3 冪。",
      "固定 x 後，3 的指數優先兩個合成 9，剩一個用 3。2 的指數以 8、4、2 分組，數量為 ceil(e/3)。當 e 除以 3 餘 1 時，也可能用兩個 4 取代 2 與 8，但排序後以 2 開頭更小，因此保留 2、8 的組合即可。每個 x 的最少因數候選排序後，依序比較長度與字典序，所有解都被某個 x 涵蓋。",
    ],
    complexity:
      "設 B = log₂ P ≤ 60，最多枚舉 38 個 x；時間 O(B² log B)、空間 O(B)。不使用浮點對數分解。",
    pitfall:
      "答案不是任意最少因數組合。例如 16 的 2、8 與 4、4 都有兩個因數，應選 2、8。",
    traceLabel: "範例 P=72=2³×3²",
    trace: [
      {
        title: "不用 6",
        description: "三個 2 合成 8，兩個 3 合成 9。",
        cells: ["8", "9"],
        active: [0, 1],
        variables: [
          ["x", "0"],
          ["數量", "2"],
        ],
      },
      {
        title: "使用一個 6",
        description: "剩餘 2²×3，候選排序後為 3、4、6，共三個。",
        cells: ["3", "4", "6"],
        active: [0, 1, 2],
        variables: [
          ["x", "1"],
          ["數量", "3"],
          ["best", "8 9"],
        ],
      },
      {
        title: "使用兩個 6",
        description: "剩餘一個 2，得到 2、6、6；仍比兩因數方案長。",
        cells: ["2", "6", "6"],
        active: [0, 1, 2],
        variables: [
          ["x", "2"],
          ["輸出", "8 9"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;
int main() {
    long long p;
    cin >> p;
    int exponent[4] = {}, primes[4] = {2, 3, 5, 7};
    for (int i = 0; i < 4; ++i)
        while (p % primes[i] == 0) {
            p /= primes[i];
            ++exponent[i];
        }
    if (p != 1) {
        cout << -1 << '\n';
        return 0;
    }
    vector<int> best;
    for (int x = 0; x <= min(exponent[0], exponent[1]); ++x) {
        int a = exponent[0] - x, b = exponent[1] - x;
        vector<int> v(x, 6);
        v.insert(v.end(), a / 3, 8);
        if (a % 3 == 1)
            v.push_back(2);
        if (a % 3 == 2)
            v.push_back(4);
        v.insert(v.end(), b / 2, 9);
        if (b % 2)
            v.push_back(3);
        v.insert(v.end(), exponent[2], 5);
        v.insert(v.end(), exponent[3], 7);
        sort(v.begin(), v.end());
        if (best.empty() || v.size() < best.size() || (v.size() == best.size() && v < best))
            best = v;
    }
    for (size_t i = 0; i < best.size(); ++i)
        cout << (i ? " " : "") << best[i];
    cout << '\n';
}`,
    python: String.raw`p = int(input())
exponent = []
for prime in (2, 3, 5, 7):
    count = 0
    while p % prime == 0:
        p //= prime
        count += 1
    exponent.append(count)
if p != 1:
    print(-1)
else:
    e2, e3, e5, e7 = exponent
    best = None
    for x in range(min(e2, e3) + 1):
        a, b = e2 - x, e3 - x
        candidate = [6] * x + [8] * (a // 3) + [9] * (b // 2)
        if a % 3:
            candidate.append(2 if a % 3 == 1 else 4)
        if b % 2:
            candidate.append(3)
        candidate += [5] * e5 + [7] * e7
        candidate.sort()
        if best is None or (len(candidate), candidate) < (len(best), best):
            best = candidate
    print(*best)
`,
  }),
  defineToiPotentialLesson("a269", {
    topic: "dp",
    level: "hard",
    concept: "高度 DAG・最長路徑計數・大整數",
    goal: "只累加達到最長長度的路線數，完整輸出不取餘數。",
    explanation: [
      "將每條鋼索從高基地指向低基地，相同高度的鋼索直接忽略。沿路高度嚴格下降，所以不會有環。依高度由高到低處理，就是一個合法拓樸順序；每個節點處理前，所有可進入它的較高節點都已處理。",
      "令 length[v] 為 1 到 v 的最多鋼索數，ways[v] 為達到該長度的路線數。從可達的 u 到 v，若 length[u]+1 較大便覆蓋長度與計數，相等才累加。不可達初值為 −1、計數為 0；起點是長度 0、計數 1。路線數可能呈指數成長，Python 用任意精度整數，C++ 以十進位分塊實作加法。",
    ],
    complexity:
      "設 D 為答案最大十進位位數（O(N)）。時間 O(N log N + M·D)，空間 O(N + M + N·D)；分塊大整數的加法不能當作 O(1)。",
    pitfall:
      "題目求最長路線的數量，不是最長長度，也不是所有可達路線數；不能模除 1000000007。",
    traceLabel: "範例的最長長度與路線數",
    trace: [
      {
        title: "由基地 1 出發",
        description: "1→2、1→3 都是一條鋼索；直達 5 的長度也先設為 1。",
        cells: ["1:0/1", "2:1/1", "3:1/1", "4:−1/0", "5:1/1"],
        active: [1, 2, 4],
        variables: [["格式", "長度/計數"]],
      },
      {
        title: "兩條路匯入 4",
        description: "經 2 或 3 到 4 都長 2，計數相加為 2。",
        cells: ["1", "2", "3", "4:2/2", "5:1/1"],
        active: [3],
        variables: [["ways[4]", "1+1=2"]],
      },
      {
        title: "延伸到終點",
        description: "4→5 得長度 3，覆蓋原本長度 1 的直達路線。",
        cells: ["4:2/2", "5:3/2"],
        active: [1],
        variables: [
          ["最多鋼索", "3"],
          ["輸出路線數", "2"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <algorithm>
#include <numeric>
#include <iomanip>
using namespace std;
struct Big {
    static const int base = 1000000000;
    vector<int> d;
    Big(int x = 0) {
        if (x)
            d.push_back(x);
    }
    void add(const Big &b) {
        d.resize(max(d.size(), b.d.size()), 0);
        long long carry = 0;
        for (size_t i = 0; i < d.size(); ++i) {
            long long sum = d[i] + carry + (i < b.d.size() ? b.d[i] : 0);
            d[i] = int(sum % base);
            carry = sum / base;
        }
        if (carry)
            d.push_back(int(carry));
    }
    void print() const {
        if (d.empty()) {
            cout << 0;
            return;
        }
        cout << d.back();
        for (int i = int(d.size()) - 2; i >= 0; --i)
            cout << setw(9) << setfill('0') << d[i];
    }
};
int main() {
    int n, m;
    cin >> n >> m;
    vector<long long> h(n);
    for (auto &x : h)
        cin >> x;
    vector<vector<int>> g(n);
    for (int i = 0, a, b; i < m; ++i) {
        cin >> a >> b;
        --a;
        --b;
        if (h[a] < h[b])
            swap(a, b);
        if (h[a] > h[b])
            g[a].push_back(b);
    }
    vector<int> order(n), length(n, -1);
    iota(order.begin(), order.end(), 0);
    sort(order.begin(), order.end(), [&](int a, int b) { return h[a] > h[b]; });
    vector<Big> ways(n);
    length[0] = 0;
    ways[0] = Big(1);
    for (int u : order)
        if (length[u] >= 0)
            for (int v : g[u]) {
                int candidate = length[u] + 1;
                if (candidate > length[v]) {
                    length[v] = candidate;
                    ways[v] = ways[u];
                } else if (candidate == length[v])
                    ways[v].add(ways[u]);
            }
    ways[n - 1].print();
    cout << '\n';
}`,
    python: String.raw`import sys

it = iter(map(int, sys.stdin.buffer.read().split()))
n, m = next(it), next(it)
h = [next(it) for _ in range(n)]
g = [[] for _ in range(n)]
for _ in range(m):
    a, b = next(it) - 1, next(it) - 1
    if h[a] < h[b]:
        a, b = b, a
    if h[a] > h[b]:
        g[a].append(b)
length = [-1] * n
ways = [0] * n
length[0], ways[0] = 0, 1
for u in sorted(range(n), key=lambda v: -h[v]):
    if length[u] < 0:
        continue
    for v in g[u]:
        candidate = length[u] + 1
        if candidate > length[v]:
            length[v], ways[v] = candidate, ways[u]
        elif candidate == length[v]:
            ways[v] += ways[u]
print(ways[-1])
`,
  }),
  defineToiPotentialLesson("a270", {
    topic: "graphs",
    level: "medium",
    concept: "二分圖染色・分量獨立翻轉",
    goal: "檢查能否分隊，並把每個連通分量較大的色群放入同一隊。",
    explanation: [
      "把認識關係視為無向邊，兩端必須在不同隊。從每個尚未染色的人進行 BFS，鄰居染相反顏色；若遇到同色邊，這個圖不能二分，直接回答 0。孤立的人也自成一個分量。",
      "一個連通二分圖的兩色分組在整體交換後就完全確定。不同分量間沒有邊，因此可各自交換方向，把每個分量較大的一色放入目標大隊。各分量可同時達到各自上界，答案就是 max(count0,count1) 的總和；不必讓兩隊一樣大。",
    ],
    complexity: "時間 O(N+M)、空間 O(N+M)，BFS 不受 N=10000 的遞迴深度影響。",
    pitfall:
      "不能只從社員 1 搜尋；孤立社員可以全部加入大隊，奇環則必須讓整題輸出 0。",
    traceLabel: "範例七人：星形、單邊、兩位孤立社員",
    trace: [
      {
        title: "處理 1、2、3",
        description: "1 一色，2、3 另一色，較大色群有 2 人。",
        cells: ["{1}", "{2,3}"],
        active: [1],
        variables: [["累計", "2"]],
      },
      {
        title: "處理 4、5",
        description: "兩色各 1 人，任選一色放到大隊。",
        cells: ["{4}", "{5}"],
        active: [0],
        variables: [
          ["增加", "1"],
          ["累計", "3"],
        ],
      },
      {
        title: "處理孤立 6、7",
        description: "兩個獨立分量各提供 1 人，因此最大隊伍有 5 人。",
        cells: ["6", "7", "大隊5人"],
        active: [0, 1, 2],
        variables: [["累計", "3+1+1=5"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <queue>
#include <algorithm>
using namespace std;
int main() {
    int n, m;
    cin >> n >> m;
    vector<vector<int>> g(n);
    for (int i = 0, a, b; i < m; ++i) {
        cin >> a >> b;
        --a;
        --b;
        g[a].push_back(b);
        g[b].push_back(a);
    }
    vector<int> color(n, -1);
    int answer = 0;
    for (int s = 0; s < n; ++s)
        if (color[s] < 0) {
            queue<int> q;
            q.push(s);
            color[s] = 0;
            int count[2] = {1, 0};
            while (!q.empty()) {
                int u = q.front();
                q.pop();
                for (int v : g[u]) {
                    if (color[v] < 0) {
                        color[v] = color[u] ^ 1;
                        ++count[color[v]];
                        q.push(v);
                    } else if (color[v] == color[u]) {
                        cout << 0 << '\n';
                        return 0;
                    }
                }
            }
            answer += max(count[0], count[1]);
        }
    cout << answer << '\n';
}`,
    python: String.raw`import sys
from collections import deque

it = iter(map(int, sys.stdin.buffer.read().split()))
n, m = next(it), next(it)
g = [[] for _ in range(n)]
for _ in range(m):
    a, b = next(it) - 1, next(it) - 1
    g[a].append(b)
    g[b].append(a)
color = [-1] * n
answer = 0
for s in range(n):
    if color[s] != -1:
        continue
    color[s] = 0
    count = [1, 0]
    q = deque([s])
    while q:
        u = q.popleft()
        for v in g[u]:
            if color[v] == -1:
                color[v] = color[u] ^ 1
                count[color[v]] += 1
                q.append(v)
            elif color[v] == color[u]:
                print(0)
                sys.exit()
    answer += max(count)
print(answer)
`,
  }),
  defineToiPotentialLesson("a271", {
    topic: "search",
    level: "hard",
    concept: "單調性二分・逐次取整・浮點邊界",
    goal: "對初始耐心做二分，逐輪模擬實際可以釣幾竿。",
    explanation: [
      "每輪恢復耐心是上一輪乘上一個介於 0 與 1 的固定係數後取 floor。初始耐心增加時，每輪結果都不會減少，總竿數也不會減少，所以『總竿數至少 K』是單調判定。V0=K 本身一定可行，二分範圍可直接設為 1 到 K。",
      "判定時要每輪取整，不能先加總等比級數；耐心成為 0 就停止，總和已達 K 也可提早返回。F+1 ≥ 2³⁰ 時係數恰為 1；F+1 為二的冪時使用整數 V×指數/30，避免例如 30×(1/30) 的誤差。其他情況先算對數，若結果距整數小於 10⁻⁵，Python 改用 60 位 Decimal 重算；C++ 則以標準整數分塊實作固定小數對數上下界，不依賴額外大數函式庫。",
      "C++ 的精確邊界檢查把 F+1 正規化為 [1,2)，以反覆平方抽取 log₂ 的二進位小數。每次固定小數向下截斷，得到下界；保留 B 位、平方 B 次後，對數誤差小於 3×2^(−B)，故加 3 個最小單位就是上界。把兩個界都乘耐心並整數除以 30，若 floor 相同即可確定答案，否則倍增精度重算。非二冪整數的 log₂ 不可能為有理數，所以上下界終會分離 floor 邊界。",
      "另有可完全整數化的區間：2³⁰−8 ≤ F+1 < 2³⁰ 時，對 1≤V≤2×10⁹，恢復值恰為 V−1。因 −ln(1−x)≤x/(1−x)、ln 2>1/2，可知損失 V×log₂(2³⁰/(F+1))/30 嚴格介於 0 與 1。連續 r 次此類鼓勵可直接累加 V−1、V−2……，只加到 0 為止。其他相同 F 的連續區段也合併儲存；若目前已進入每輪恰減 1 的範圍，後續較小耐心仍會恰減 1，同樣可用等差級數跳過。",
    ],
    complexity:
      "一般判定最壞時間 O(N + Q·N·log K)，空間 O(N+Q)；N=40000、Q=100。重複 K 與連續 F 都快取或合併。另計 C++ B 位精度對數的 O(B·ceil(B/32)²) 建立成本及 O(ceil(B/32)) 邊界乘除，通常 B=96；Python 邊界使用固定 60 位 Decimal。",
    pitfall:
      "鼓勵倍率作用在上一輪恢復的耐心，不是 V0，也不是所有剩餘耐心；逐輪 floor 不能省略。",
    traceLabel: "範例 F=[1,3]，詢問 K=100",
    trace: [
      {
        title: "試 V0=96",
        description: "第一輪 floor(96/30)=3，第二輪 floor(3×2/30)=0。",
        cells: ["96", "3", "0"],
        active: [0, 1, 2],
        variables: [
          ["總竿數", "99"],
          ["可行", "否"],
        ],
      },
      {
        title: "試 V0=97",
        description: "第一輪仍恢復 3，第二輪為 0，總數剛好 100。",
        cells: ["97", "3", "0"],
        active: [0, 1, 2],
        variables: [
          ["總竿數", "100"],
          ["可行", "是"],
        ],
      },
      {
        title: "二分收斂",
        description: "96 不可行而 97 可行，由單調性得到最小初始耐心 97。",
        cells: ["96:不行", "97:可行"],
        active: [1],
        variables: [["答案", "97"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <cmath>
#include <map>
#include <algorithm>
#include <cstdint>
using namespace std;
// Little-endian base-2^32 fixed point, with 'words' fractional limbs.
vector<uint32_t> logLower(uint32_t f, int words) {
    int exponent = 0;
    for (uint32_t t = f; t > 1; t >>= 1)
        ++exponent;
    int bits = 32 * words;
    vector<uint32_t> x(words + 1), result(words + 1);
    result[words] = uint32_t(exponent);
    for (int j = 0; j <= exponent; ++j)
        if (f >> j & 1u) {
            int at = bits - exponent + j;
            x[at / 32] |= uint32_t(1) << (at % 32);
        }
    for (int bit = bits - 1; bit >= 0; --bit) {
        vector<uint32_t> square(2 * words + 2);
        for (int i = 0; i <= words; ++i) {
            uint64_t carry = 0;
            for (int j = 0; j <= words; ++j) {
                uint64_t value = uint64_t(x[i]) * x[j] + square[i + j] + carry;
                square[i + j] = uint32_t(value);
                carry = value >> 32;
            }
            square[i + words + 1] = uint32_t(carry);
        }
        bool high = square[2 * words] >= 2;
        if (high)
            result[bit / 32] |= uint32_t(1) << (bit % 32);
        for (int j = 0; j <= words; ++j) {
            x[j] =
                high ? (square[words + j] >> 1) | (square[words + j + 1] << 31) : square[words + j];
        }
    }
    return result;
}
long long scaledFloor(const vector<uint32_t> &logarithm, long long v, bool upper) {
    auto a = logarithm;
    if (upper) {
        uint64_t carry = 3;
        for (size_t i = 0; i < a.size() && carry; ++i) {
            carry += a[i];
            a[i] = uint32_t(carry);
            carry >>= 32;
        }
    }
    vector<uint32_t> product(a.size() + 1);
    uint64_t carry = 0;
    for (size_t i = 0; i < a.size(); ++i) {
        uint64_t value = uint64_t(a[i]) * uint64_t(v) + carry;
        product[i] = uint32_t(value);
        carry = value >> 32;
    }
    product[a.size()] = uint32_t(carry);
    uint64_t remainder = 0;
    for (int i = int(product.size()) - 1; i >= 0; --i) {
        uint64_t value = (remainder << 32) | product[i];
        product[i] = uint32_t(value / 30);
        remainder = value % 30;
    }
    return product[a.size() - 1];
}
map<uint32_t, vector<uint32_t>> preciseLogs;
long long preciseFloor(uint32_t f, long long v) {
    auto &lower = preciseLogs[f];
    if (lower.empty())
        lower = logLower(f, 3);
    while (true) {
        long long a = scaledFloor(lower, v, false), b = scaledFloor(lower, v, true);
        if (a == b)
            return a;
        lower = logLower(f, 2 * (int(lower.size()) - 1));
    }
}
struct Step {
    long long f;
    int power, repeat;
    long double logarithm;
};
int main() {
    int n;
    cin >> n;
    vector<Step> steps;
    for (int i = 0; i < n; ++i) {
        long long f;
        cin >> f;
        ++f;
        if (f >= (1LL << 30)) {
            if (!steps.empty() && steps.back().power == 30)
                ++steps.back().repeat;
            else
                steps.push_back({f, 30, 1, 30});
        } else if (f >= (1LL << 30) - 8) {
            if (!steps.empty() && steps.back().power == -2)
                ++steps.back().repeat;
            else
                steps.push_back({f, -2, 1, 0});
        } else {
            int power = -1;
            if ((f & (f - 1)) == 0) {
                power = 0;
                for (long long t = f; t > 1; t /= 2)
                    ++power;
            }
            if (!steps.empty() && steps.back().f == f)
                ++steps.back().repeat;
            else
                steps.push_back({f, power, 1, log2l((long double)f)});
        }
    }
    auto enough = [&](long long v, long long k) {
        long long total = v;
        if (total >= k)
            return true;
        for (const auto &s : steps) {
            if (s.power == 30)
                total += v * s.repeat;
            else if (s.power == -2) {
                long long count = min(v, (long long)s.repeat);
                total += count * (2 * v - count - 1) / 2;
                v -= count;
            } else {
                int remaining = s.repeat;
                while (remaining > 0 && v > 0) {
                    long long next;
                    if (s.power >= 0)
                        next = v * s.power / 30;
                    else {
                        long double value = (long double)v * s.logarithm / 30;
                        if (fabsl(value - roundl(value)) < 0.00001L)
                            next = preciseFloor(uint32_t(s.f), v);
                        else
                            next = (long long)floorl(value);
                    }
                    if (next == v - 1) {
                        long long count = min(v, (long long)remaining);
                        total += count * (2 * v - count - 1) / 2;
                        v -= count;
                        remaining -= int(count);
                    } else {
                        v = next;
                        total += v;
                        --remaining;
                    }
                    if (total >= k)
                        return true;
                }
            }
            if (total >= k)
                return true;
            if (v == 0)
                return false;
        }
        return false;
    };
    int q;
    cin >> q;
    map<long long, long long> cache;
    while (q--) {
        long long k;
        cin >> k;
        if (!cache.count(k)) {
            long long lo = 1, hi = k;
            while (lo < hi) {
                long long mid = (lo + hi) / 2;
                if (enough(mid, k))
                    hi = mid;
                else
                    lo = mid + 1;
            }
            cache[k] = lo;
        }
        cout << cache[k] << '\n';
    }
}`,
    python: String.raw`import sys
import math
from decimal import Decimal, localcontext

it = iter(map(int, sys.stdin.buffer.read().split()))
n = next(it)
steps = []
for _ in range(n):
    f = next(it) + 1
    if f >= 1 << 30:
        if steps and steps[-1][0] == 30:
            steps[-1][2] += 1
        else:
            steps.append([30, 30.0, 1, f])
    elif f >= (1 << 30) - 8:
        if steps and steps[-1][0] == -2:
            steps[-1][2] += 1
        else:
            steps.append([-2, 0.0, 1, f])
    else:
        power = f.bit_length() - 1 if f & (f - 1) == 0 else -1
        if steps and steps[-1][3] == f:
            steps[-1][2] += 1
        else:
            steps.append([power, math.log2(f), 1, f])
precise = {}


def enough(v, k):
    total = v
    if total >= k:
        return True
    for power, logarithm, repeat, f in steps:
        if power == 30:
            total += v * repeat
        elif power == -2:
            count = min(v, repeat)
            total += count * (2 * v - count - 1) // 2
            v -= count
        else:
            while repeat and v:
                if power >= 0:
                    restored = v * power // 30
                else:
                    value = v * logarithm / 30
                    if abs(value - round(value)) < 0.00001:
                        with localcontext() as ctx:
                            ctx.prec = 60
                            if f not in precise:
                                precise[f] = Decimal(f).ln() / Decimal(2).ln()
                            restored = int(Decimal(v) * precise[f] / 30)
                    else:
                        restored = int(value)
                if restored == v - 1:
                    count = min(v, repeat)
                    total += count * (2 * v - count - 1) // 2
                    v -= count
                    repeat -= count
                else:
                    v = restored
                    total += v
                    repeat -= 1
                if total >= k:
                    return True
        if total >= k:
            return True
        if v == 0:
            return False
    return False


q = next(it)
cache = {}
out = []
for _ in range(q):
    k = next(it)
    if k not in cache:
        lo, hi = 1, k
        while lo < hi:
            mid = (lo + hi) // 2
            if enough(mid, k):
                hi = mid
            else:
                lo = mid + 1
        cache[k] = lo
    out.append(str(cache[k]))
print('\n'.join(out))
`,
  }),
  defineToiPotentialLesson("a272", {
    topic: "graphs",
    level: "medium",
    concept: "連通分量・樹的邊數判定",
    goal: "用分量的點數與邊數判斷是否存在環。",
    explanation: [
      "用迭代 DFS 找出每個朋友連通分量，搜尋時累計頂點數 v 與所有頂點的度數和。每條無向邊會在兩端各計一次，因此分量的邊數 e 是度數和除以 2。",
      "連通無向簡單圖至少有 v−1 條邊；恰有 v−1 條時就是樹，不含環。若 e≥v，任取一棵生成樹後還有額外邊，額外邊與樹上路徑形成環。故每找到一個分量就增加組數，並在 e≥v 時增加默契較高組數。",
    ],
    complexity:
      "時間 O(N+M)、空間 O(N+M)，可處理 N=30000、M=100000；採堆疊避免遞迴深度問題。",
    pitfall:
      "朋友編號從 0 開始；度數和要除以 2，且輸出順序是總組數在前、含環組數在後。",
    traceLabel: "範例：三角形與四點路徑",
    trace: [
      {
        title: "搜尋 0、1、2",
        description: "三個頂點度數均為 2，度數和 6，邊數為 3。",
        cells: ["0:度2", "1:度2", "2:度2"],
        active: [0, 1, 2],
        variables: [
          ["v,e", "3,3"],
          ["含環", "是"],
        ],
      },
      {
        title: "搜尋 3、4、5、6",
        description: "度數和為 1+2+2+1=6，有 3 條邊，恰為 v−1。",
        cells: ["3", "4", "5", "6"],
        active: [0, 1, 2, 3],
        variables: [
          ["v,e", "4,3"],
          ["含環", "否"],
        ],
      },
      {
        title: "彙整",
        description: "全部七人已走訪，兩組中只有一組有環。",
        cells: ["三角形", "路徑"],
        active: [0],
        variables: [
          ["總組數", "2"],
          ["含環組數", "1"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
using namespace std;
int main() {
    int n, m;
    cin >> n >> m;
    vector<vector<int>> g(n);
    for (int i = 0, a, b; i < m; ++i) {
        cin >> a >> b;
        g[a].push_back(b);
        g[b].push_back(a);
    }
    vector<bool> seen(n, false);
    int groups = 0, cyclic = 0;
    for (int s = 0; s < n; ++s)
        if (!seen[s]) {
            ++groups;
            int vertices = 0, degree = 0;
            vector<int> stack = {s};
            seen[s] = true;
            while (!stack.empty()) {
                int u = stack.back();
                stack.pop_back();
                ++vertices;
                degree += int(g[u].size());
                for (int v : g[u])
                    if (!seen[v]) {
                        seen[v] = true;
                        stack.push_back(v);
                    }
            }
            if (degree / 2 >= vertices)
                ++cyclic;
        }
    cout << groups << ' ' << cyclic << '\n';
}`,
    python: String.raw`import sys

it = iter(map(int, sys.stdin.buffer.read().split()))
n, m = next(it), next(it)
g = [[] for _ in range(n)]
for _ in range(m):
    a, b = next(it), next(it)
    g[a].append(b)
    g[b].append(a)
seen = bytearray(n)
groups = cyclic = 0
for s in range(n):
    if seen[s]:
        continue
    groups += 1
    stack = [s]
    seen[s] = 1
    vertices = degree = 0
    while stack:
        u = stack.pop()
        vertices += 1
        degree += len(g[u])
        for v in g[u]:
            if not seen[v]:
                seen[v] = 1
                stack.append(v)
    cyclic += degree // 2 >= vertices
print(groups, cyclic)
`,
  }),
  defineToiPotentialLesson("a273", {
    topic: "graphs",
    level: "medium",
    concept: "最大瓶頸生成樹・降序 Kruskal",
    goal: "最大化保留樹中最小的邊，而不是求所有邊容量總和。",
    explanation: [
      "任意兩點恰有一條路徑，表示保留圖必須是一棵生成樹。樹中每條邊的兩端本身也是一對中心，所以所有點對的最差路徑瓶頸，恰好等於整棵樹最小的邊容量。問題因此化為最大化生成樹的最小邊。",
      "把邊按容量由大到小加入 DSU，只有不同分量的邊才保留。當成功合併到 N−1 條時，最後一條的容量 f 就是答案。容量嚴格大於 f 的所有邊尚不足以連通全圖，任何生成樹都必須用到不大於 f 的邊；目前構造已達此上界。",
    ],
    complexity:
      "時間 O(M log M + M α(N))、空間 O(N+M)；容量 ≤ 10⁹，無須把容量總和當成答案。",
    pitfall: "Kruskal 必須降序；只保留容量最大的 N−1 條邊可能成環而漏掉中心。",
    traceLabel: "範例容量 9、8、7、2",
    trace: [
      {
        title: "加入 2—3",
        description: "最大容量 9，先合併兩個單點分量。",
        cells: ["{1}", "{2,3}", "{4}"],
        active: [1],
        variables: [
          ["已選邊", "1"],
          ["目前瓶頸", "9"],
        ],
      },
      {
        title: "加入 1—4",
        description: "容量 8，兩端原本不同分量。",
        cells: ["{1,4}", "{2,3}"],
        active: [0],
        variables: [
          ["已選邊", "2"],
          ["目前瓶頸", "8"],
        ],
      },
      {
        title: "加入 3—4",
        description: "容量 7 連通全圖，保留樹最小容量為 7。",
        cells: ["{1,2,3,4}"],
        active: [0],
        variables: [
          ["已選邊", "3"],
          ["答案", "7"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <algorithm>
#include <numeric>
using namespace std;
struct Edge {
    int a, b, w;
};
int main() {
    int n, m;
    cin >> n >> m;
    vector<Edge> e(m);
    for (auto &x : e)
        cin >> x.a >> x.b >> x.w;
    sort(e.begin(), e.end(), [](const Edge &a, const Edge &b) { return a.w > b.w; });
    vector<int> p(n + 1), size(n + 1, 1);
    iota(p.begin(), p.end(), 0);
    auto find = [&](int x) {
        while (x != p[x]) {
            p[x] = p[p[x]];
            x = p[x];
        }
        return x;
    };
    int count = 0;
    for (auto x : e) {
        int a = find(x.a), b = find(x.b);
        if (a == b)
            continue;
        if (size[a] < size[b])
            swap(a, b);
        p[b] = a;
        size[a] += size[b];
        if (++count == n - 1) {
            cout << x.w << '\n';
            break;
        }
    }
}`,
    python: String.raw`import sys

it = iter(map(int, sys.stdin.buffer.read().split()))
n, m = next(it), next(it)
edges = []
for _ in range(m):
    a, b, w = next(it), next(it), next(it)
    edges.append((w, a, b))
parent = list(range(n + 1))
size = [1] * (n + 1)


def find(x):
    while parent[x] != x:
        parent[x] = parent[parent[x]]
        x = parent[x]
    return x


count = 0
for w, a, b in sorted(edges, reverse=True):
    a, b = find(a), find(b)
    if a == b:
        continue
    if size[a] < size[b]:
        a, b = b, a
    parent[b] = a
    size[a] += size[b]
    count += 1
    if count == n - 1:
        print(w)
        break
`,
  }),
  defineToiPotentialLesson("a274", {
    topic: "graphs",
    level: "hard",
    concept: "二分圖最大獨立集・分層增廣匹配",
    goal: "用最大匹配求出最多互不衝突的列、欄砲台。",
    explanation: [
      "左側放 M 個列砲台、右側放 N 個欄砲台，每個陷阱連成一條衝突邊。合法砲台集合不能同時選邊的兩端，正是二分圖獨立集。其補集必須覆蓋每條邊，因此最大獨立集大小等於 M+N 減最小頂點覆蓋。",
      "Kőnig 定理指出二分圖最小頂點覆蓋大小等於最大匹配。Hopcroft–Karp 先從所有未匹配列做 BFS，找出最短增廣路的分層；再用 DFS 只沿層數增加的邊，同一輪盡量加入多條最短增廣路。匹配邊反轉後，匹配數每條增加 1。若 BFS 再也碰不到未匹配欄，就沒有增廣路，匹配已最大，輸出 M+N−matching。每輪的鄰邊游標避免重複掃描失敗分支。",
    ],
    complexity:
      "時間 O((T+M+N)√(M+N))、空間 O(T+M+N)。M、N ≤ 500，T ≤ 250000；分層搜尋深度最多 500，Python 明確設定足夠遞迴上限。",
    pitfall:
      "答案不是 M+N−陷阱數；多個陷阱可能由同一列砲台的移除同時解決，T=0 時答案就是 M+N。",
    traceLabel: "範例陷阱 (0,0)、(0,1)、(1,1)、(2,1)",
    trace: [
      {
        title: "匹配列 0",
        description: "將列 0 配給欄 0，得到第一條匹配邊。",
        cells: ["列0↔欄0", "欄1空", "列1空", "列2空"],
        active: [0],
        variables: [["matching", "1"]],
      },
      {
        title: "匹配列 1",
        description: "列 1 配給欄 1；兩條邊端點均不重複。",
        cells: ["列0↔欄0", "列1↔欄1", "列2空"],
        active: [1],
        variables: [["matching", "2"]],
      },
      {
        title: "列 2 無法增廣",
        description: "列 2 只有欄 1 可用，而列 1 沒有其他欄；最大匹配為 2。",
        cells: ["匹配2", "候選7", "可放5"],
        active: [2],
        variables: [["答案", "3+4−2=5"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <functional>
#include <queue>
#include <algorithm>
using namespace std;
int main() {
    int m, n, t;
    cin >> m >> n >> t;
    vector<vector<int>> g(m);
    for (int i = 0, r, c; i < t; ++i) {
        cin >> r >> c;
        g[r].push_back(c);
    }
    vector<int> left(m, -1), right(n, -1), distance(m), cursor(m);
    int shortest = 0, matching = 0;
    auto layers = [&]() {
        queue<int> q;
        fill(distance.begin(), distance.end(), -1);
        for (int r = 0; r < m; ++r)
            if (left[r] < 0) {
                distance[r] = 0;
                q.push(r);
            }
        shortest = m + 1;
        while (!q.empty()) {
            int r = q.front();
            q.pop();
            if (distance[r] >= shortest)
                continue;
            for (int c : g[r]) {
                int next = right[c];
                if (next < 0)
                    shortest = distance[r] + 1;
                else if (distance[next] < 0) {
                    distance[next] = distance[r] + 1;
                    q.push(next);
                }
            }
        }
        return shortest <= m;
    };
    function<bool(int)> augment = [&](int r) {
        while (cursor[r] < int(g[r].size())) {
            int c = g[r][cursor[r]++], next = right[c];
            if ((next < 0 && distance[r] + 1 == shortest) ||
                (next >= 0 && distance[next] == distance[r] + 1 && augment(next))) {
                left[r] = c;
                right[c] = r;
                return true;
            }
        }
        distance[r] = -1;
        return false;
    };
    while (layers()) {
        fill(cursor.begin(), cursor.end(), 0);
        for (int r = 0; r < m; ++r)
            if (left[r] < 0 && augment(r))
                ++matching;
    }
    cout << m + n - matching << '\n';
}`,
    python: String.raw`import sys
from collections import deque

sys.setrecursionlimit(5000)
it = iter(map(int, sys.stdin.buffer.read().split()))
m, n, t = next(it), next(it), next(it)
g = [[] for _ in range(m)]
for _ in range(t):
    r, c = next(it), next(it)
    g[r].append(c)
left = [-1] * m
right = [-1] * n
distance = [-1] * m
cursor = [0] * m
shortest = m + 1


def layers():
    global shortest
    q = deque()
    for r in range(m):
        distance[r] = 0 if left[r] == -1 else -1
        if left[r] == -1:
            q.append(r)
    shortest = m + 1
    while q:
        r = q.popleft()
        if distance[r] >= shortest:
            continue
        for c in g[r]:
            nxt = right[c]
            if nxt == -1:
                shortest = distance[r] + 1
            elif distance[nxt] == -1:
                distance[nxt] = distance[r] + 1
                q.append(nxt)
    return shortest <= m


def augment(r):
    while cursor[r] < len(g[r]):
        c = g[r][cursor[r]]
        cursor[r] += 1
        nxt = right[c]
        if (nxt == -1 and distance[r] + 1 == shortest) or (
            nxt != -1 and distance[nxt] == distance[r] + 1 and augment(nxt)
        ):
            left[r] = c
            right[c] = r
            return True
    distance[r] = -1
    return False


matching = 0
while layers():
    cursor = [0] * m
    for r in range(m):
        if left[r] == -1:
            matching += augment(r)
print(m + n - matching)
`,
  }),
  defineToiPotentialLesson("a275", {
    topic: "graphs",
    level: "hard",
    concept: "調價前綴二分・重新計算 MST",
    goal: "在累積調價下找出最小生成樹成本首次嚴格大於 K 的時刻。",
    explanation: [
      "所有維護成本為正，因此最佳連通方案一定可以刪去多餘環邊，成為最小生成樹。某條邊只會漲價，每棵固定樹的成本都不減，故所有樹中的最小成本也不減。『發生前 t 次調價後 MST > K』具單調性，可以二分首次成立的 t。",
      "每次判定都複製初始成本，套用前 t 次調價，再用升序 Kruskal 求 MST；不要在二分各回合繼續累加上一回合的成本。先判斷 t=0，再判斷 t=Q，分別處理答案 0 與 −1，其他情況才二分 1 到 Q。即使原 MST 的邊漲價後被替換，重新計算也能正確反映最佳方案。",
    ],
    complexity:
      "時間 O((Q + M log M + M α(N)) log(Q+1))，空間 O(N+M+Q)；N、M ≤ 10000，Q ≤ 100000。成本總和使用 64 位元。",
    pitfall:
      "必須是嚴格超過 K；不能只更新初始 MST 上的邊，也不能假設每次調價都會影響最佳成本。",
    traceLabel: "範例：K=6，依序調高三條邊",
    trace: [
      {
        title: "尚未調價",
        description: "成本為 2、6、3，MST 選 0—1 與 1—2，成本 5。",
        cells: ["0—1:2", "0—2:6", "1—2:3"],
        active: [0, 2],
        variables: [
          ["t", "0"],
          ["MST", "5≤6"],
        ],
      },
      {
        title: "第一次調價",
        description: "0—1 增加 3 變為 5，MST 成本 5+3=8，首次超過 6。",
        cells: ["0—1:5", "0—2:6", "1—2:3"],
        active: [0, 2],
        variables: [
          ["t", "1"],
          ["MST", "8>6"],
        ],
      },
      {
        title: "全部調價後",
        description:
          "成本成為 5、7、5，MST 為 10；單調性允許回頭二分，答案是 1。",
        cells: ["0—1:5", "0—2:7", "1—2:5"],
        active: [0, 2],
        variables: [
          ["t", "3"],
          ["MST", "10"],
          ["答案", "1"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <map>
#include <algorithm>
#include <numeric>
using namespace std;
struct Edge {
    int a, b;
    long long w;
};
struct Update {
    int id, delta;
};
int main() {
    int n, m, q;
    cin >> n >> m >> q;
    vector<Edge> edges(m);
    map<pair<int, int>, int> id;
    for (int i = 0; i < m; ++i) {
        cin >> edges[i].a >> edges[i].b >> edges[i].w;
        id[{edges[i].a, edges[i].b}] = i;
    }
    vector<Update> updates(q);
    for (auto &u : updates) {
        int a, b;
        cin >> a >> b >> u.delta;
        if (a > b)
            swap(a, b);
        u.id = id.at({a, b});
    }
    long long k;
    cin >> k;
    auto cost = [&](int t) {
        auto current = edges;
        for (int i = 0; i < t; ++i)
            current[updates[i].id].w += updates[i].delta;
        sort(current.begin(), current.end(),
             [](const Edge &a, const Edge &b) { return a.w < b.w; });
        vector<int> p(n), size(n, 1);
        iota(p.begin(), p.end(), 0);
        auto find = [&](int x) {
            while (x != p[x]) {
                p[x] = p[p[x]];
                x = p[x];
            }
            return x;
        };
        long long sum = 0;
        int count = 0;
        for (auto e : current) {
            int a = find(e.a), b = find(e.b);
            if (a == b)
                continue;
            if (size[a] < size[b])
                swap(a, b);
            p[b] = a;
            size[a] += size[b];
            sum += e.w;
            if (++count == n - 1)
                break;
        }
        return sum;
    };
    if (cost(0) > k) {
        cout << 0 << '\n';
        return 0;
    }
    if (cost(q) <= k) {
        cout << -1 << '\n';
        return 0;
    }
    int lo = 1, hi = q;
    while (lo < hi) {
        int mid = (lo + hi) / 2;
        if (cost(mid) > k)
            hi = mid;
        else
            lo = mid + 1;
    }
    cout << lo << '\n';
}`,
    python: String.raw`import sys

it = iter(map(int, sys.stdin.buffer.read().split()))
n, m, q = next(it), next(it), next(it)
edges = []
ids = {}
for i in range(m):
    a, b, w = next(it), next(it), next(it)
    edges.append((a, b, w))
    ids[a, b] = i
updates = []
for _ in range(q):
    a, b, delta = next(it), next(it), next(it)
    updates.append((ids[min(a, b), max(a, b)], delta))
k = next(it)


def cost(t):
    weight = [w for a, b, w in edges]
    for i in range(t):
        edge, delta = updates[i]
        weight[edge] += delta
    parent = list(range(n))
    size = [1] * n

    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    total = count = 0
    for i in sorted(range(m), key=weight.__getitem__):
        a, b, _ = edges[i]
        a, b = find(a), find(b)
        if a == b:
            continue
        if size[a] < size[b]:
            a, b = b, a
        parent[b] = a
        size[a] += size[b]
        total += weight[i]
        count += 1
        if count == n - 1:
            break
    return total


if cost(0) > k:
    print(0)
elif cost(q) <= k:
    print(-1)
else:
    lo, hi = 1, q
    while lo < hi:
        mid = (lo + hi) // 2
        if cost(mid) > k:
            hi = mid
        else:
            lo = mid + 1
    print(lo)
`,
  }),
];
