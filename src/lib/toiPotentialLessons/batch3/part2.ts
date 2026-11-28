import type { ToiPotentialLesson } from "@/lib/toiPotentialLessonTypes";
import { defineToiPotentialLesson } from "@/lib/toiPotentialLessonBuilder";

export const lessons: ToiPotentialLesson[] = [
  defineToiPotentialLesson("a276", {
    topic: "search",
    level: "medium",
    concept: "最低山形成本・等差級數・二分",
    goal: "固定觀景台高度後，用兩側最低必要高度判斷是否超過總預算。",
    explanation: [
      "假設第 K 段高度為 h，相鄰差最多 1，距離 d 的段至少要有 max(1,h−d)。把每段都設成這個下界就已符合相鄰限制，因此這個截平山形既是必要下界，也是可行的最小總和；兩端不必降到 1。",
      "一側有 L 段，令 t=min(L,h−1)，前 t 段的高度是 h−1 到 h−t，總和為 t(2h−t−1)/2，其餘 L−t 段各高 1。把左右兩側與中央 h 相加得到 need(h)。need 隨 h 單調不減，用上取整中點二分最後一個 need(h)≤M 的高度。",
    ],
    complexity:
      "每筆 O(log M) 時間、O(1) 額外計算空間；共 O(T log M)。乘積以 64 位元計算，N、M ≤ 10⁹；T=0 不輸出。",
    pitfall:
      "K 在端點時一側長度為 0；不可強迫端點等於 1。二分找最大可行值要避免中點不前進。",
    traceLabel: "範例 N=5、M=12、K=3",
    trace: [
      {
        title: "試高度 2",
        description: "距離中心一格以上都能降到 1，最低總和為 6。",
        cells: ["1", "1", "2", "1", "1"],
        active: [2],
        variables: [["need(2)", "6≤12"]],
      },
      {
        title: "試高度 3",
        description: "兩側依序降為 2、1，最低總和為 9。",
        cells: ["1", "2", "3", "2", "1"],
        active: [2],
        variables: [["need(3)", "9≤12"]],
      },
      {
        title: "試高度 4",
        description: "最低總和為 14，已超過 12，因此最高只能是 3。",
        cells: ["2", "3", "4", "3", "2"],
        active: [0, 1, 2, 3, 4],
        variables: [
          ["need(4)", "14>12"],
          ["答案", "3"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <algorithm>
using namespace std;
long long side(long long h, long long length) {
    long long t = min(length, h - 1);
    return t * (2 * h - t - 1) / 2 + length - t;
}
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int t;
    cin >> t;
    while (t--) {
        long long n, m, k;
        cin >> n >> m >> k;
        long long lo = 1, hi = m - n + 1;
        while (lo < hi) {
            long long mid = (lo + hi + 1) / 2;
            long long need = mid + side(mid, k - 1) + side(mid, n - k);
            if (need <= m)
                lo = mid;
            else
                hi = mid - 1;
        }
        cout << lo << '\n';
    }
}`,
    python: String.raw`import sys


def side(h, length):
    t = min(length, h - 1)
    return t * (2 * h - t - 1) // 2 + length - t


stream = sys.stdin.buffer
t = int(stream.readline())
out = []
for _ in range(t):
    n, m, k = map(int, stream.readline().split())
    lo, hi = 1, m - n + 1
    while lo < hi:
        mid = (lo + hi + 1) // 2
        need = mid + side(mid, k - 1) + side(mid, n - k)
        if need <= m:
            lo = mid
        else:
            hi = mid - 1
    out.append(str(lo))
if out:
    sys.stdout.write('\n'.join(out) + '\n')
`,
  }),
  defineToiPotentialLesson("a277", {
    topic: "data-structures",
    level: "medium",
    concept: "同類料理佇列・逆序對・Fenwick tree",
    goal: "將料理出餐順序轉成客人編號排列，計算先到卻晚吃的配對。",
    explanation: [
      "每種料理建立點餐客人的編號佇列，編號依到店順序加入。沿料理做好順序 C 掃描，每道料理配給該種類佇列最前面的客人，就得到實際上菜的客人排列 P。即使料理要等到某位客人到店才能繼續送出，規則仍不允許後一道超車，因此排列只由 C 與同類客人的順序決定。",
      "排列中先出現的較大編號 j 與之後的較小編號 i，恰好讓客人 i 因晚到的 j 先吃而增加 1 怒氣。若 j 能收到菜，時間已至少是 j，到店較早的 i 必已在場，所以每個逆序對都確實產生怒氣。掃描 P，用 Fenwick tree 記錄已送餐編號；目前 x 造成的新增配對是已處理數減去前綴計數 sum(x)。",
    ],
    complexity:
      "時間 O(N log N)、空間 O(N)。最多 N(N−1)/2，N=100000 時需 64 位元答案。",
    pitfall:
      "同種類料理必須配給最早尚未上菜的人；同一分鐘連續上菜的順序也算逆序對，不可合併成同時事件。",
    traceLabel: "範例配對後的上菜客人順序 [2,1,4,3]",
    trace: [
      {
        title: "先服務客人 2",
        description: "第一道料理是 2 類，配給第 2 位客人；目前沒有逆序對。",
        cells: ["2", "1", "4", "3"],
        active: [0],
        variables: [
          ["已處理", "1"],
          ["怒氣總和", "0"],
        ],
      },
      {
        title: "接著服務客人 1",
        description: "已服務的 2 大於 1，客人 1 增加一點怒氣。",
        cells: ["2", "1", "4", "3"],
        active: [1],
        variables: [
          ["新增", "1"],
          ["怒氣總和", "1"],
        ],
      },
      {
        title: "最後服務 4、3",
        description: "4 之前沒有更大編號；服務 3 時前面只有 4 比它大。",
        cells: ["2", "1", "4", "3"],
        active: [2, 3],
        variables: [
          ["新增", "0+1"],
          ["怒氣總和", "2"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
using namespace std;
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    vector<int> c(n), head(n + 1), bit(n + 1);
    vector<vector<int>> waiting(n + 1);
    for (int i = 0, d; i < n; ++i) {
        cin >> c[i] >> d;
        waiting[d].push_back(i + 1);
    }
    long long answer = 0;
    for (int i = 0; i < n; ++i) {
        int x = waiting[c[i]][head[c[i]]++], prefix = 0;
        for (int p = x; p > 0; p -= p & -p)
            prefix += bit[p];
        answer += i - prefix;
        for (int p = x; p <= n; p += p & -p)
            ++bit[p];
    }
    cout << answer << '\n';
}`,
    python: String.raw`import sys

it = iter(map(int, sys.stdin.buffer.read().split()))
n = next(it)
c = []
waiting = [[] for _ in range(n + 1)]
for i in range(1, n + 1):
    dish, order = next(it), next(it)
    c.append(dish)
    waiting[order].append(i)
head = [0] * (n + 1)
bit = [0] * (n + 1)
answer = 0
for served, dish in enumerate(c):
    x = waiting[dish][head[dish]]
    head[dish] += 1
    p, prefix = x, 0
    while p:
        prefix += bit[p]
        p -= p & -p
    answer += served - prefix
    p = x
    while p <= n:
        bit[p] += 1
        p += p & -p
print(answer)
`,
  }),
  defineToiPotentialLesson("a278", {
    topic: "graphs",
    level: "medium",
    concept: "生成森林・連通分量邊數",
    goal: "分辨每個鐵路網原本是樹，還是有必須停用的多餘邊。",
    explanation: [
      "原本能互相到達的站不能被拆成不同網路，故先以迭代 DFS 找出各連通分量。搜尋分量時累計頂點數 v 與度數和，除以 2 得到軌道數 e；每條無向軌道會在兩端各計一次。",
      "任意兩站恰有一條路徑等價於分量是一棵樹，而 v 個頂點的樹恰有 v−1 條邊。原分量本來連通，所以 e=v−1 時不必停用；e>v−1 時必須停用 e−(v−1) 條邊。本題只問這兩類網路的個數，不是所有停用軌道總數。",
    ],
    complexity:
      "時間 O(N+M)、空間 O(N+M)。N ≤ 1000，最多約 50 萬條軌道；迭代搜尋避免遞迴堆疊。",
    pitfall:
      "輸出先列需要停用的網路數，再列不必停用的網路數；這個順序與『總分量、含環分量』不同。",
    traceLabel: "範例：三角形 0、1、2 與單邊 3—4",
    trace: [
      {
        title: "找到三角形",
        description: "頂點 3、軌道 3，比樹所需的 2 條多一條。",
        cells: ["0—1", "1—2", "2—0"],
        active: [0, 1, 2],
        variables: [
          ["需停用網路", "1"],
          ["不需停用網路", "0"],
        ],
      },
      {
        title: "找到單邊分量",
        description: "兩站一邊已是一棵樹，不必改動。",
        cells: ["3", "4", "3—4"],
        active: [2],
        variables: [
          ["v,e", "2,1"],
          ["不需停用網路", "1"],
        ],
      },
      {
        title: "依指定順序輸出",
        description: "有一個網路需要停用，也有一個完全不需停用。",
        cells: ["需要:1", "不需要:1"],
        active: [0, 1],
        variables: [["輸出", "1 1"]],
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
    int remove = 0, keep = 0;
    for (int s = 0; s < n; ++s)
        if (!seen[s]) {
            vector<int> stack = {s};
            seen[s] = true;
            int vertices = 0, degree = 0;
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
            if (degree / 2 > vertices - 1)
                ++remove;
            else
                ++keep;
        }
    cout << remove << ' ' << keep << '\n';
}`,
    python: String.raw`import sys

stream = sys.stdin.buffer
n, m = map(int, stream.readline().split())
g = [[] for _ in range(n)]
for _ in range(m):
    a, b = map(int, stream.readline().split())
    g[a].append(b)
    g[b].append(a)
seen = bytearray(n)
remove = keep = 0
for s in range(n):
    if seen[s]:
        continue
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
    if degree // 2 > vertices - 1:
        remove += 1
    else:
        keep += 1
print(remove, keep)
`,
  }),
  defineToiPotentialLesson("a279", {
    topic: "graphs",
    level: "hard",
    concept: "橋・low-link・DFS 子樹大小",
    goal: "預處理每條線被剪斷時會掉落多少串珠，讓獨立詢問直接查表。",
    explanation: [
      "以掛鉤 0 為 DFS 根，記錄進入時間 tin[u]、子樹大小 size[u]，以及子樹不經父邊能回到的最早時間 low[u]。樹邊 p—u 若 low[u]>tin[p]，表示整棵 u 子樹沒有其他線通回掛鉤側，這條邊就是橋。",
      "剪斷橋 p—u 時，掉落的恰是 u 子樹，所以留下 N−size[u] 顆；非橋邊仍有替代路徑，留下 N 顆。迭代 DFS 必須在子節點退出時才把 low 與 size 回傳父節點。每個詢問都從完整吊飾開始，直接回覆預處理值，不累積刪邊。",
    ],
    complexity:
      "DFS 時間 O(N+M)、儲存 O(N+M)。端點到邊編號查詢：Python 雜湊期望 O(Q)，C++ map 為 O((M+Q) log M)。不使用深度可達 50000 的遞迴。",
    pitfall:
      "橋的判斷是嚴格大於；詢問端點可能反向，例如範例 4 3，要先正規化。留下的數量包含掛鉤 0。",
    traceLabel: "範例：0—1，1、2、3 成環，3—4",
    trace: [
      {
        title: "子樹 4 完成",
        description: "4 沒有回邊，3—4 是橋，剪掉後只掉 4。",
        cells: ["3", "4"],
        active: [1],
        variables: [
          ["size[4]", "1"],
          ["留下", "5−1=4"],
        ],
      },
      {
        title: "檢查環內邊 1—2",
        description: "2 能沿 2—3—1 回到祖先，該邊不是橋。",
        cells: ["1", "2", "3"],
        active: [0, 1, 2],
        variables: [["剪 1—2", "留下5"]],
      },
      {
        title: "子樹 1 完成",
        description: "1 的子樹包含 1、2、3、4，只有 0—1 連到掛鉤。",
        cells: ["0", "{1,2,3,4}"],
        active: [1],
        variables: [
          ["size[1]", "4"],
          ["剪 0—1 留下", "1"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <map>
#include <algorithm>
using namespace std;
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, m, q;
    cin >> n >> m >> q;
    vector<vector<pair<int, int>>> g(n);
    map<pair<int, int>, int> ids;
    for (int i = 0, a, b; i < m; ++i) {
        cin >> a >> b;
        g[a].push_back({b, i});
        g[b].push_back({a, i});
        ids[{min(a, b), max(a, b)}] = i;
    }
    vector<int> tin(n, -1), low(n), parent(n, -1), parentEdge(n, -1), size(n, 1), next(n),
        answer(m, n), stack = {0};
    int timer = 0;
    tin[0] = low[0] = timer++;
    while (!stack.empty()) {
        int u = stack.back();
        if (next[u] < int(g[u].size())) {
            auto [v, e] = g[u][next[u]++];
            if (e == parentEdge[u])
                continue;
            if (tin[v] < 0) {
                parent[v] = u;
                parentEdge[v] = e;
                tin[v] = low[v] = timer++;
                stack.push_back(v);
            } else
                low[u] = min(low[u], tin[v]);
        } else {
            stack.pop_back();
            int p = parent[u];
            if (p >= 0) {
                if (low[u] > tin[p])
                    answer[parentEdge[u]] = n - size[u];
                low[p] = min(low[p], low[u]);
                size[p] += size[u];
            }
        }
    }
    while (q--) {
        int a, b;
        cin >> a >> b;
        cout << answer[ids.at({min(a, b), max(a, b)})] << '\n';
    }
}`,
    python: String.raw`import sys

it = iter(map(int, sys.stdin.buffer.read().split()))
n, m, q = next(it), next(it), next(it)
g = [[] for _ in range(n)]
ids = {}
for e in range(m):
    a, b = next(it), next(it)
    g[a].append((b, e))
    g[b].append((a, e))
    ids[min(a, b), max(a, b)] = e
tin = [-1] * n
low = [0] * n
parent = [-1] * n
parent_edge = [-1] * n
size = [1] * n
cursor = [0] * n
answer = [n] * m
stack = [0]
timer = 1
tin[0] = low[0] = 0
while stack:
    u = stack[-1]
    if cursor[u] < len(g[u]):
        v, e = g[u][cursor[u]]
        cursor[u] += 1
        if e == parent_edge[u]:
            continue
        if tin[v] == -1:
            parent[v], parent_edge[v] = u, e
            tin[v] = low[v] = timer
            timer += 1
            stack.append(v)
        else:
            low[u] = min(low[u], tin[v])
    else:
        stack.pop()
        p = parent[u]
        if p != -1:
            if low[u] > tin[p]:
                answer[parent_edge[u]] = n - size[u]
            low[p] = min(low[p], low[u])
            size[p] += size[u]
out = []
for _ in range(q):
    a, b = next(it), next(it)
    out.append(str(answer[ids[min(a, b), max(a, b)]]))
print('\n'.join(out))
`,
  }),
  defineToiPotentialLesson("a280", {
    topic: "dp",
    level: "medium",
    concept: "後綴子集合和・可行性引導字典序還原",
    goal: "在仍有解的前提下優先填加號，找出字典序最小算式。",
    explanation: [
      "設全部數字總和 S。若加號側總和為 P、減號側總和為 S−P，要等於 0 必須 P=S/2；第一個數字固定在加號側。因此 S 必須為偶數，且後 N−1 個數字中要選出總和 S/2−a₁ 的子集合。",
      "從右往左建立 suffix[i]，表示 a[i] 到末尾可以選出的所有總和。空後綴只能湊 0；每加入 x，就把原集合與所有值加 x 的集合聯集。還原時若選當前數字作加號後，剩下目標仍可由下一個後綴湊出，就選 +；否則選 −。每一步保留至少一個可行完成法，且在第一個可分歧處優先 +，因此得到字典序最小答案。",
    ],
    complexity:
      "令 S≤10000。C++ 時間與空間 O(NS)；Python 用整數位元集合，時間 O(NS/w)、空間 O(NS/w) 個機器字，另有 O(N) 還原。",
    pitfall:
      "第一項不能改成負號；不能只求出任意可行子集合。無解只輸出 0，有解才輸出 1 與無空白算式。",
    traceLabel: "範例 [15,29,14]，後綴加號目標為 14",
    trace: [
      {
        title: "檢查總和",
        description: "總和 58，一側需要 29；第一個 15 已固定為正，還需 14。",
        cells: ["15", "29", "14"],
        active: [0],
        variables: [["target", "29−15=14"]],
      },
      {
        title: "決定 29 的符號",
        description: "若選 +29，剩餘目標會是 −15，不可行，因此填 −。",
        cells: ["15", "−29", "14"],
        active: [1],
        variables: [["target", "14"]],
      },
      {
        title: "決定 14 的符號",
        description: "選 +14 後目標變 0，空後綴可以完成。",
        cells: ["15", "−29", "+14"],
        active: [2],
        variables: [
          ["target", "0"],
          ["算式", "15−29+14=0"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <numeric>
#include <string>
using namespace std;
int main() {
    int n;
    cin >> n;
    vector<int> a(n);
    for (int &x : a)
        cin >> x;
    int sum = accumulate(a.begin(), a.end(), 0), target = sum / 2 - a[0];
    if (sum % 2 || target < 0) {
        cout << 0 << '\n';
        return 0;
    }
    vector<vector<unsigned char>> suffix(n + 1, vector<unsigned char>(sum + 1));
    suffix[n][0] = 1;
    for (int i = n - 1; i >= 1; --i)
        for (int s = 0; s <= sum; ++s)
            suffix[i][s] = suffix[i + 1][s] || (s >= a[i] && suffix[i + 1][s - a[i]]);
    if (!suffix[1][target]) {
        cout << 0 << '\n';
        return 0;
    }
    cout << 1 << '\n' << a[0];
    for (int i = 1; i < n; ++i) {
        if (target >= a[i] && suffix[i + 1][target - a[i]]) {
            cout << '+' << a[i];
            target -= a[i];
        } else
            cout << '-' << a[i];
    }
    cout << '\n';
}`,
    python: String.raw`import sys

data = list(map(int, sys.stdin.buffer.read().split()))
n, a = data[0], data[1:]
total = sum(a)
target = total // 2 - a[0]
suffix = [0] * (n + 1)
suffix[n] = 1
for i in range(n - 1, 0, -1):
    suffix[i] = suffix[i + 1] | (suffix[i + 1] << a[i])
if total % 2 or target < 0 or not (suffix[1] >> target & 1):
    print(0)
else:
    parts = [str(a[0])]
    for i in range(1, n):
        if target >= a[i] and (suffix[i + 1] >> (target - a[i]) & 1):
            parts.append('+' + str(a[i]))
            target -= a[i]
        else:
            parts.append('-' + str(a[i]))
    print(1)
    print(''.join(parts))
`,
  }),
  defineToiPotentialLesson("a281", {
    topic: "search",
    level: "hard",
    concept: "矩形錨點編碼・位元盤面・BFS",
    goal: "搜尋每次完整物件平移一格的最短步數，控制狀態儲存大小。",
    explanation: [
      "每個矩形的長寬固定，所以只要記錄各物件左上角位置，就能完整還原盤面。令 B=M×N≤20，把 K 個位置視為 B 進位數字編成一個整數，最多 B^K≤3200000 個編碼。預先算出每個物件在每個合法左上角所占用的格子位元遮罩與可移動的相鄰錨點。",
      "BFS 每次解碼物件位置，聯集成占用遮罩。移動物件 i 時先移除自身遮罩，再檢查新遮罩與其他物件不相交；這同時保證物件完整平移而非逐格搬動。每條狀態邊都代表一步，依 BFS 層數首次到目標即是最短步數；起點等於目標時為 0。用 bytearray/位元組陣列標記編碼、緊湊整數陣列存佇列，避免 Python tuple 集合的額外負擔。",
    ],
    complexity:
      "令 R 為可達盤面數、B=M×N。預處理 O(KB²)，搜尋 O(RK)，空間 O(B^K+R+KB)；不把 B^K 誤寫成多項式。B≤20、K≤5。",
    pitfall:
      "相同形狀但不同編號仍是不同物件，不能排序位置去重；不得旋轉，也不可讓水平移動跨過列邊界。",
    traceLabel: "範例 2×3 盤面：先移物件 1，再移物件 2",
    trace: [
      {
        title: "初始盤面",
        description: "物件 1 是橫向兩格矩形，物件 2 是單格。",
        cells: ["1", "1", "0", "0", "2", "0"],
        active: [0, 1],
        variables: [
          ["錨點(1,2)", "(0,4)"],
          ["距離", "0"],
        ],
      },
      {
        title: "物件 1 右移",
        description: "完整移到第 0 列第 1、2 欄，沒有碰到物件 2。",
        cells: ["0", "1", "1", "0", "2", "0"],
        active: [1, 2],
        variables: [
          ["錨點(1,2)", "(1,4)"],
          ["距離", "1"],
        ],
      },
      {
        title: "物件 2 右移",
        description: "物件 2 由編號格 4 移到格 5，到達目標盤面。",
        cells: ["0", "1", "1", "0", "0", "2"],
        active: [5],
        variables: [
          ["錨點(1,2)", "(1,5)"],
          ["最少步數", "2"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <algorithm>
#include <cstdint>
using namespace std;
int main() {
    int m, n, k;
    cin >> m >> n >> k;
    int b = m * n;
    vector<int> initial(b), target(b);
    for (int &x : initial)
        cin >> x;
    for (int &x : target)
        cin >> x;
    vector<int> height(k), width(k), start(k), goal(k), power(k, 1);
    for (int i = 0; i < k; ++i) {
        int r0 = m, c0 = n, r1 = -1, c1 = -1;
        for (int p = 0; p < b; ++p)
            if (initial[p] == i + 1) {
                r0 = min(r0, p / n);
                c0 = min(c0, p % n);
                r1 = max(r1, p / n);
                c1 = max(c1, p % n);
            }
        height[i] = r1 - r0 + 1;
        width[i] = c1 - c0 + 1;
        start[i] = r0 * n + c0;
        goal[i] = int(find(target.begin(), target.end(), i + 1) - target.begin());
        if (i)
            power[i] = power[i - 1] * b;
    }
    vector<vector<uint32_t>> mask(k, vector<uint32_t>(b));
    vector<vector<vector<int>>> moves(k, vector<vector<int>>(b));
    for (int i = 0; i < k; ++i) {
        for (int r = 0; r + height[i] <= m; ++r)
            for (int c = 0; c + width[i] <= n; ++c) {
                int p = r * n + c;
                for (int dr = 0; dr < height[i]; ++dr)
                    for (int dc = 0; dc < width[i]; ++dc)
                        mask[i][p] |= 1u << ((r + dr) * n + c + dc);
            }
        for (int p = 0; p < b; ++p)
            if (mask[i][p]) {
                int r = p / n, c = p % n;
                for (auto d : vector<pair<int, int>>{{-1, 0}, {1, 0}, {0, -1}, {0, 1}}) {
                    int rr = r + d.first, cc = c + d.second;
                    if (rr >= 0 && rr < m && cc >= 0 && cc < n && mask[i][rr * n + cc])
                        moves[i][p].push_back(rr * n + cc);
                }
            }
    }
    int s = 0, t = 0;
    for (int i = 0; i < k; ++i) {
        s += start[i] * power[i];
        t += goal[i] * power[i];
    }
    if (s == t) {
        cout << 0 << '\n';
        return 0;
    }
    vector<unsigned char> seen(power.back() * b);
    seen[s] = 1;
    vector<uint32_t> queue = {uint32_t(s)};
    size_t head = 0;
    int distance = 0;
    while (head < queue.size()) {
        size_t end = queue.size();
        ++distance;
        while (head < end) {
            int state = int(queue[head++]), x = state;
            vector<int> pos(k);
            uint32_t occupied = 0;
            for (int i = 0; i < k; ++i) {
                pos[i] = x % b;
                x /= b;
                occupied |= mask[i][pos[i]];
            }
            for (int i = 0; i < k; ++i) {
                uint32_t other = occupied ^ mask[i][pos[i]];
                for (int p : moves[i][pos[i]])
                    if (!(mask[i][p] & other)) {
                        int next = state + (p - pos[i]) * power[i];
                        if (seen[next])
                            continue;
                        if (next == t) {
                            cout << distance << '\n';
                            return 0;
                        }
                        seen[next] = 1;
                        queue.push_back(uint32_t(next));
                    }
            }
        }
    }
    cout << -1 << '\n';
}`,
    python: String.raw`import sys
from array import array

it = iter(map(int, sys.stdin.buffer.read().split()))
m, n, k = next(it), next(it), next(it)
b = m * n
initial = [next(it) for _ in range(b)]
target = [next(it) for _ in range(b)]
start, goal, masks, moves = [], [], [], []
for i in range(1, k + 1):
    cells = [p for p in range(b) if initial[p] == i]
    r0, r1 = min(p // n for p in cells), max(p // n for p in cells)
    c0, c1 = min(p % n for p in cells), max(p % n for p in cells)
    h, w = r1 - r0 + 1, c1 - c0 + 1
    start.append(r0 * n + c0)
    goal.append(target.index(i))
    mask = [0] * b
    for r in range(m - h + 1):
        for c in range(n - w + 1):
            for dr in range(h):
                for dc in range(w):
                    mask[r * n + c] |= 1 << ((r + dr) * n + c + dc)
    adjacent = [[] for _ in range(b)]
    for p in range(b):
        if not mask[p]:
            continue
        r, c = divmod(p, n)
        for dr, dc in ((-1, 0), (1, 0), (0, -1), (0, 1)):
            rr, cc = r + dr, c + dc
            if 0 <= rr < m and 0 <= cc < n and mask[rr * n + cc]:
                adjacent[p].append(rr * n + cc)
    masks.append(mask)
    moves.append(adjacent)
power = [b**i for i in range(k)]
s = sum(start[i] * power[i] for i in range(k))
t = sum(goal[i] * power[i] for i in range(k))


def solve():
    if s == t:
        return 0
    seen = bytearray(b**k)
    seen[s] = 1
    queue = array('I', [s])
    head = distance = 0
    while head < len(queue):
        end = len(queue)
        distance += 1
        while head < end:
            state = queue[head]
            head += 1
            x, occupied = state, 0
            pos = []
            for i in range(k):
                p = x % b
                x //= b
                pos.append(p)
                occupied |= masks[i][p]
            for i in range(k):
                old = pos[i]
                other = occupied ^ masks[i][old]
                for p in moves[i][old]:
                    if masks[i][p] & other:
                        continue
                    new = state + (p - old) * power[i]
                    if seen[new]:
                        continue
                    if new == t:
                        return distance
                    seen[new] = 1
                    queue.append(new)
    return -1


print(solve())
`,
  }),
  defineToiPotentialLesson("a282", {
    topic: "dp",
    level: "hard",
    concept: "加權編輯距離・滾動陣列・平手更新",
    goal: "依插刪 2、替換 3 的實際成本比較三隻猴子，平手選最大編號。",
    explanation: [
      "令 dp[i][j] 為來源前 i 字元改成目標前 j 字元的最低成本。最後一步若刪來源字元，從 dp[i−1][j]+2 轉移；插入目標字元，從 dp[i][j−1]+2 轉移；對齊最後字元，從 dp[i−1][j−1] 加上相同為 0、不同為 3。所有編輯序列都能依最後一步歸入這三類，取最小值就不會漏掉更便宜的解。",
      "C++ 只保留上一列與本列。共同前綴與共同後綴可以先移除：相同端點保留的成本為 0，繞開它再編輯不會更便宜。若去除後兩側使用的字元集合完全不相交，任何對齊都要替換；盡量以成本 3 的替換配對，剩餘長度用成本 2 的插刪，得到 3×min(n,m)+2×|n−m|。依序算三隻猴子，每當成本 ≤ 最佳成本就更新，確保平手選編號最大者。",
      "Python 利用大整數平行處理一整列。改定義分數 L[i][j]=2i+2j−dp[i][j]，轉移是 max(上方、左方、左上方+w)，相同字元 w=4，不同 w=1。相鄰欄的分數增量 h 只可能為 0 到 4，用五個位元集合記錄。新舊列差 v 滿足 v[j]=max(0,w[j]−h[j],v[j−1]−h[j])，亦只在 0 到 4；從門檻 4 倒算到 1，正 h 的轉移依賴已算好的較高門檻，h=0 的連續傳遞則以整數加法的進位一次完成。最後用 h新=h舊+v[j]−v[j−1] 更新位元集合。這是同一個 DP 的位元平行表示，並非改變編輯成本。",
    ],
    complexity:
      "每隻 C++ 時間 O(nm)、額外空間 O(min(n,m))，三隻最多約 3×10⁸ 次格子更新。Python 以固定 4 個門檻及位元加減平行化，時間 O(n·ceil(m/w)+n+m)、空間 O(Σ·ceil(m/w)+n+m)，Σ 為字元種類數、w 為大整數機器字位數。",
    pitfall:
      "不能套用單位成本 Levenshtein；替換是 3，而先刪再插是 4。並列最低時要選較大的猴子編號。",
    traceLabel: "範例目標 cat，來源 cut、cats、at",
    trace: [
      {
        title: "猴子 1：cut",
        description: "共同 c、t 保留，把 u 替換成 a，成本為 3。",
        cells: ["c→c:0", "u→a:3", "t→t:0"],
        active: [1],
        variables: [["best", "猴子1，3"]],
      },
      {
        title: "猴子 2：cats",
        description: "共同 cat 保留，刪除最後的 s，成本為 2。",
        cells: ["cat:0", "刪s:2"],
        active: [1],
        variables: [["best", "猴子2，2"]],
      },
      {
        title: "猴子 3：at",
        description: "在前面插入 c 只需 2，與猴子 2 平手，更新為編號 3。",
        cells: ["插c:2", "at:0"],
        active: [0],
        variables: [["輸出", "3 2"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <string>
#include <vector>
#include <algorithm>
#include <climits>
#include <unordered_set>
#include <cstdint>
using namespace std;
u32string decode(const string &text) {
    u32string result;
    for (size_t i = 0; i < text.size();) {
        uint32_t c = static_cast<unsigned char>(text[i++]);
        if (c >= 128) {
            int remaining = c < 224 ? 1 : c < 240 ? 2 : 3;
            c &= (1u << (6 - remaining)) - 1;
            while (remaining--)
                c = (c << 6) | (static_cast<unsigned char>(text[i++]) & 63u);
        }
        result.push_back(char32_t(c));
    }
    return result;
}
int distanceCost(u32string a, u32string b) {
    size_t first = 0;
    while (first < a.size() && first < b.size() && a[first] == b[first])
        ++first;
    a.erase(0, first);
    b.erase(0, first);
    while (!a.empty() && !b.empty() && a.back() == b.back()) {
        a.pop_back();
        b.pop_back();
    }
    if (a.size() < b.size())
        swap(a, b);
    int n = int(a.size()), m = int(b.size());
    unordered_set<char32_t> present(a.begin(), a.end());
    bool common = false;
    for (char32_t c : b)
        if (present.count(c))
            common = true;
    if (!common)
        return 3 * m + 2 * (n - m);
    vector<int> previous(m + 1), current(m + 1);
    for (int j = 0; j <= m; ++j)
        previous[j] = 2 * j;
    for (int i = 1; i <= n; ++i) {
        current[0] = 2 * i;
        for (int j = 1; j <= m; ++j)
            current[j] = min({previous[j] + 2, current[j - 1] + 2,
                              previous[j - 1] + (a[i - 1] == b[j - 1] ? 0 : 3)});
        swap(previous, current);
    }
    return previous[m];
}
int main() {
    string text;
    cin >> text;
    u32string target = decode(text);
    int best = INT_MAX, winner = 0;
    for (int i = 1; i <= 3; ++i) {
        cin >> text;
        int cost = distanceCost(decode(text), target);
        if (cost <= best) {
            best = cost;
            winner = i;
        }
    }
    cout << winner << ' ' << best << '\n';
}`,
    python: String.raw`import sys


def distance_cost(a, b):
    first = 0
    while first < len(a) and first < len(b) and a[first] == b[first]:
        first += 1
    a, b = a[first:], b[first:]
    end_a, end_b = len(a), len(b)
    while end_a and end_b and a[end_a - 1] == b[end_b - 1]:
        end_a -= 1
        end_b -= 1
    a, b = a[:end_a], b[:end_b]
    if len(a) < len(b):
        a, b = b, a
    n, m = len(a), len(b)
    if set(a).isdisjoint(b):
        return 3 * m + 2 * (n - m)
    full = (1 << m) - 1
    matches = {}
    for j, c in enumerate(b):
        matches[c] = matches.get(c, 0) | (1 << j)
    # exact[h]: columns whose horizontal score increment is h.
    exact = [full, 0, 0, 0, 0]
    for ca in a:
        match = matches.get(ca, 0)
        vertical = [0] * 5  # vertical[k]: new-old score >= k.
        for threshold in range(4, 0, -1):
            eligible = 0
            for h in range(5 - threshold):
                eligible |= exact[h]
            source = match & eligible
            if threshold == 1:
                source |= exact[0]
            for h in range(1, 5 - threshold):
                source |= exact[h] & (vertical[threshold + h] << 1)
            # Solve V = source | ((V << 1) & exact[0]).
            # Addition carries through zero-increment runs; a source starts a carry.
            propagate = exact[0] & ~source
            vertical[threshold] = ((propagate ^ ((propagate | source) + source)) >> 1) & full
        # Convert h and v to bit-sliced binary, then compute h + v - (v << 1).
        hbits = [exact[1] | exact[3], exact[2] | exact[3], exact[4], 0]
        vbits = [
            vertical[1] ^ vertical[2] ^ vertical[3] ^ vertical[4],
            vertical[2] ^ vertical[4],
            vertical[4],
            0,
        ]
        summed = []
        carry = 0
        for hb, vb in zip(hbits, vbits):
            summed.append(hb ^ vb ^ carry)
            carry = (hb & vb) | ((hb ^ vb) & carry)
        result = []
        borrow = 0
        for sb, vb in zip(summed, vbits):
            shifted = vb << 1
            result.append((sb ^ shifted ^ borrow) & full)
            borrow = ((~sb) & (shifted | borrow)) | (shifted & borrow)
        x, y, z = result[:3]
        exact = [
            full & ~(x | y | z),
            full & x & ~y & ~z,
            full & ~x & y & ~z,
            full & x & y & ~z,
            full & ~x & ~y & z,
        ]
    score = sum(h * bits.bit_count() for h, bits in enumerate(exact))
    return 2 * (n + m) - score


stream = sys.stdin.buffer
target = stream.readline().decode('utf-8').rstrip('\r\n')
best, winner = 10**9, 0
for i in range(1, 4):
    source = stream.readline().decode('utf-8').rstrip('\r\n')
    cost = distance_cost(source, target)
    if cost <= best:
        best, winner = cost, i
print(winner, best)
`,
  }),
  defineToiPotentialLesson("a283", {
    topic: "math",
    level: "easy",
    concept: "河內塔遞迴結構・最低有效位",
    goal: "直接由步數 S 的二進位形式求出移動圓盤編號。",
    explanation: [
      "N 層最短解先搬 N−1 層，再於第 2^(N−1) 步搬最大盤，最後再搬 N−1 層。於是盤 1 出現在所有奇數步，盤 2 出現在除以 2 後為奇數的步數，盤 k 的步數恰為 (奇數)×2^(k−1)。",
      "將 S 反覆除以 2，直到得到奇數，除的次數加 1 就是盤號；等價於 S 的最低有效 1 位之位置。因 S 已保證在 1 到 2^N−1，N 只用來限定合法範圍，不需要模擬柱子，也不需產生指數多步驟。",
    ],
    complexity:
      "C++ 每筆 O(log S) 時間、O(1) 空間，最多除 29 次；Python 最低位與 bit_length 對此 30 位範圍可視為 O(1)。總共 T≤100000 筆。",
    pitfall: "盤號從 1 開始，所以尾端零個數要加 1；不要實際產生 2^N−1 次搬動。",
    traceLabel: "示意詢問 N=4，分別觀察 S=1、2、12",
    trace: [
      {
        title: "第 1 步",
        description: "1 的二進位是 0001，沒有尾端零，移動盤 1。",
        cells: ["0", "0", "0", "1"],
        active: [3],
        variables: [
          ["S", "1"],
          ["盤號", "1"],
        ],
      },
      {
        title: "第 2 步",
        description: "2 的二進位是 0010，有一個尾端零，移動盤 2。",
        cells: ["0", "0", "1", "0"],
        active: [2],
        variables: [
          ["S", "2"],
          ["盤號", "2"],
        ],
      },
      {
        title: "第 12 步",
        description: "12 的二進位是 1100，除以 2 兩次得到 3，移動盤 3。",
        cells: ["1", "1", "0", "0"],
        active: [1],
        variables: [
          ["S", "12"],
          ["盤號", "3"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
using namespace std;
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int t;
    cin >> t;
    while (t--) {
        int n, s;
        cin >> n >> s;
        int disk = 1;
        while (s % 2 == 0) {
            s /= 2;
            ++disk;
        }
        cout << disk << '\n';
    }
}`,
    python: String.raw`import sys

it = iter(map(int, sys.stdin.buffer.read().split()))
t = next(it)
out = []
for _ in range(t):
    n, s = next(it), next(it)
    out.append(str((s & -s).bit_length()))
print('\n'.join(out))
`,
  }),
  defineToiPotentialLesson("a284", {
    topic: "graphs",
    level: "hard",
    concept: "割點・low-link・稠密圖位元鄰接表",
    goal: "一次 DFS 找出移除後會切斷星圖的頂點，按編號遞減輸出。",
    explanation: [
      "DFS 記錄 tin 與 low。非根頂點 u 若有樹子節點 v 滿足 low[v]≥tin[u]，則 v 子樹沒有不經 u 回到 u 祖先的路，移除 u 會斷開星圖。根沒有祖先，必須另外判斷：DFS 樹子節點至少兩個才是割點。只有一顆或兩顆星時也遵守這些規則。",
      "V≤10000，但 E 可達 V(V−1)/2，不能在 Python 把整份輸入 split 後儲存數千萬個端點整數。程式逐行讀取，使用每列 V 位的鄰接矩陣。C++ 迭代 DFS 掃描每列；Python 以大整數找尚未造訪鄰居，進入節點時，利用『已造訪頂點前綴遮罩』二分出最早的非父鄰居作為回邊 low 初值。無向 DFS 沒有跨分支邊，因此後來才被造訪的鄰居只能是後代，其 tin 更大，不會改善 low；子樹完成時仍照常向父節點傳遞 low。",
    ],
    complexity:
      "C++ 時間 O(E+V²)、位元矩陣空間 O(V²/64+V)。Python 設 W=ceil(V/機器字位數)，讀圖 O(EW)、搜尋 O(VW log V)，空間 O(VW)；大整數位元運算不是 O(1)。V=10000 的純矩陣約 12.5 MB。",
    pitfall:
      "割點用 ≥，橋才用 >；DFS 根要獨立判斷。沒有割點輸出大寫 FAIL，答案按編號由大到小。",
    traceLabel: "範例三角形接到 3，3 再接 4、5",
    trace: [
      {
        title: "三角形回邊",
        description: "以 0 為根，0→1→2 後，2 可回到 0，所以 low[2]=0。",
        cells: ["0:tin0", "1:tin1", "2:tin2/low0"],
        active: [0, 2],
        variables: [["1 是割點", "否"]],
      },
      {
        title: "葉節點回傳",
        description: "3 的子節點 4、5 都不能回到 3 的祖先，3 是割點。",
        cells: ["3:tin3", "4:low4", "5:low5"],
        active: [0],
        variables: [["low[4]≥tin[3]", "4≥3"]],
      },
      {
        title: "子樹 3 回傳到 2",
        description:
          "low[3]=3≥tin[2]=2，2 也是割點；根 0 只有一個 DFS 子節點。",
        cells: ["割點3", "割點2", "根0非割點"],
        active: [0, 1],
        variables: [["輸出", "3 2"]],
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
    long long m;
    cin >> n >> m;
    int words = (n + 63) / 64;
    vector<vector<uint64_t>> g(n, vector<uint64_t>(words));
    for (long long i = 0; i < m; ++i) {
        int a, b;
        cin >> a >> b;
        g[a][b / 64] |= 1ULL << (b % 64);
        g[b][a / 64] |= 1ULL << (a % 64);
    }
    vector<int> tin(n, -1), low(n), parent(n, -1), cursor(n), children(n), stack;
    vector<bool> cut(n, false);
    int timer = 0;
    for (int root = 0; root < n; ++root)
        if (tin[root] < 0) {
            stack.push_back(root);
            tin[root] = low[root] = timer++;
            while (!stack.empty()) {
                int u = stack.back();
                while (cursor[u] < n && !(g[u][cursor[u] / 64] >> (cursor[u] % 64) & 1ULL))
                    ++cursor[u];
                if (cursor[u] < n) {
                    int v = cursor[u]++;
                    if (v == parent[u])
                        continue;
                    if (tin[v] < 0) {
                        parent[v] = u;
                        ++children[u];
                        tin[v] = low[v] = timer++;
                        stack.push_back(v);
                    } else
                        low[u] = min(low[u], tin[v]);
                } else {
                    stack.pop_back();
                    int p = parent[u];
                    if (p >= 0) {
                        low[p] = min(low[p], low[u]);
                        if (parent[p] >= 0 && low[u] >= tin[p])
                            cut[p] = true;
                    } else
                        cut[u] = children[u] > 1;
                }
            }
        }
    bool any = false;
    for (int u = n - 1; u >= 0; --u)
        if (cut[u]) {
            if (any)
                cout << ' ';
            cout << u;
            any = true;
        }
    if (!any)
        cout << "FAIL";
    cout << '\n';
}`,
    python: String.raw`import sys

stream = sys.stdin.buffer
n, m = map(int, stream.readline().split())
adj = [0] * n
for _ in range(m):
    a, b = map(int, stream.readline().split())
    adj[a] |= 1 << b
    adj[b] |= 1 << a
tin = [-1] * n
low = [0] * n
parent = [-1] * n
children = [0] * n
cut = bytearray(n)
seen = 0
prefix = [0]


def enter(u, p):
    global seen
    tin[u] = low[u] = len(prefix) - 1
    back = adj[u] & seen
    if p != -1:
        back &= ~(1 << p)
    if back:
        lo, hi = 1, len(prefix) - 1
        while lo < hi:
            mid = (lo + hi) // 2
            if back & prefix[mid]:
                hi = mid
            else:
                lo = mid + 1
        low[u] = lo - 1
    seen |= 1 << u
    prefix.append(seen)


for root in range(n):
    if tin[root] != -1:
        continue
    enter(root, -1)
    stack = [root]
    while stack:
        u = stack[-1]
        remaining = adj[u] & ~seen
        if remaining:
            bit = remaining & -remaining
            v = bit.bit_length() - 1
            parent[v] = u
            children[u] += 1
            enter(v, u)
            stack.append(v)
        else:
            stack.pop()
            p = parent[u]
            if p != -1:
                low[p] = min(low[p], low[u])
                if parent[p] != -1 and low[u] >= tin[p]:
                    cut[p] = 1
            else:
                cut[u] = children[u] > 1
answer = [str(u) for u in range(n - 1, -1, -1) if cut[u]]
print(' '.join(answer) if answer else 'FAIL')
`,
  }),
  defineToiPotentialLesson("a285", {
    topic: "strings",
    level: "easy",
    concept: "自訂字母順序・計數排序區間",
    goal: "只計算每個字母的次數，不真的建立五百萬字元的排序結果。",
    explanation: [
      "掃描待排序字串，統計每個大寫字母出現幾次。依指定規則順序走訪字母，把次數加到累積值 end；該字母在排序後恰好占據上一個累積值加 1 到 end 的位置。沒有出現的字母占空區間，不影響後續位置。",
      "查詢 X 時，找到第一個累積 end≥X 的字母就是答案，因為它的前面總共只有小於 X 個字元。規則至多 26 種字母、詢問至多 100 筆，逐查詢掃描規則已足夠快，不需一般比較排序，也不需把同字母反覆串接。",
    ],
    complexity:
      "令 L≤5000000、A≤26。時間 O(L+A·Q)，計數與查詢額外空間 O(A+Q)；程式讀入原始字串仍使用 O(L) 記憶體。",
    pitfall:
      "位置是從 1 開始，判斷要用 X≤end；排序規則不一定含全部 26 字母，也不一定是英文字典序。",
    traceLabel: "範例規則 DBAC，字串 ABCDDBCA",
    trace: [
      {
        title: "統計四字母",
        description: "D、B、A、C 各出現兩次。",
        cells: ["D:2", "B:2", "A:2", "C:2"],
        active: [0, 1, 2, 3],
        variables: [["總長度", "8"]],
      },
      {
        title: "轉成位置區間",
        description:
          "依 DBAC 累加，區間為 D 的 1–2、B 的 3–4、A 的 5–6、C 的 7–8。",
        cells: ["D:1–2", "B:3–4", "A:5–6", "C:7–8"],
        active: [0, 1, 2, 3],
        variables: [["累積終點", "2,4,6,8"]],
      },
      {
        title: "查詢位置 5",
        description: "5 大於 2、4，但不大於 6，因此第 5 字元是 A。",
        cells: ["2<5", "4<5", "6≥5", "8"],
        active: [2],
        variables: [["答案", "A"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <string>
using namespace std;
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    string order, text;
    cin >> order >> text;
    int count[26] = {};
    for (char c : text)
        ++count[c - 'A'];
    int q;
    cin >> q;
    while (q--) {
        int x;
        cin >> x;
        int end = 0;
        for (char c : order) {
            end += count[c - 'A'];
            if (x <= end) {
                cout << c << '\n';
                break;
            }
        }
    }
}`,
    python: String.raw`import sys

stream = sys.stdin.buffer
order = stream.readline().strip()
text = stream.readline().strip()
count = [0] * 26
for c in text:
    count[c - 65] += 1
q = int(stream.readline())
out = []
for _ in range(q):
    x = int(stream.readline())
    end = 0
    for c in order:
        end += count[c - 65]
        if x <= end:
            out.append(chr(c))
            break
print('\n'.join(out))
`,
  }),
  defineToiPotentialLesson("a286", {
    topic: "greedy",
    level: "medium",
    concept: "加權完成時間・相鄰交換證明",
    goal: "以工期與每日罰金的交叉乘積決定拆除順序。",
    explanation: [
      "建築 i 在完成當天仍罰款，若它在第 Cᵢ 天完成，總罰金就是 aᵢ×Cᵢ；目標為所有加權完成時間總和。沒有理由空等，因為所有罰金均為正，提早開始只會降低成本。",
      "比較相鄰兩棟 i、j，假設前面已耗時 t。i 先做的貢獻為 aᵢ(t+bᵢ)+aⱼ(t+bᵢ+bⱼ)，j 先做則為 aⱼ(t+bⱼ)+aᵢ(t+bⱼ+bᵢ)，差是 aⱼbᵢ−aᵢbⱼ。因此當 bᵢaⱼ≤bⱼaᵢ 時應讓 i 在前。按此比較器排序可消除所有逆序，相鄰交換不增加成本，得到全域最佳；比例相等時任意先後都同成本。",
    ],
    complexity:
      "時間 O(N log N)、空間 O(N)。累積天數最多 2×10⁸，總罰金上界小於 4×10¹⁶，使用 64 位元；比較交叉乘積也先轉成 64 位元。",
    pitfall:
      "不可只依每日罰金或工期單獨排序；完成當天仍罰款，應先把 b 加入累積時間再累加 a×time。避免用浮點比例比較。",
    traceLabel: "範例依 (a,b) 排為 (6,1)、(4,2)、(1,3)",
    trace: [
      {
        title: "先拆每日罰金 6 的建築",
        description: "花 1 天，在第 1 天完成，貢獻 6×1=6。",
        cells: ["(6,1)", "(4,2)", "(1,3)"],
        active: [0],
        variables: [
          ["累積天數", "1"],
          ["罰金", "6"],
        ],
      },
      {
        title: "再拆每日罰金 4 的建築",
        description: "再花 2 天，在第 3 天完成，貢獻 4×3=12。",
        cells: ["完成", "(4,2)", "(1,3)"],
        active: [1],
        variables: [
          ["累積天數", "3"],
          ["罰金", "18"],
        ],
      },
      {
        title: "最後拆每日罰金 1 的建築",
        description: "在第 6 天完成，再加 1×6，最少總罰金為 24。",
        cells: ["完成", "完成", "(1,3)"],
        active: [2],
        variables: [
          ["累積天數", "6"],
          ["罰金", "24"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;
struct Building {
    long long a, b;
};
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    vector<Building> v(n);
    for (auto &x : v)
        cin >> x.a >> x.b;
    sort(v.begin(), v.end(),
         [](const Building &x, const Building &y) { return x.b * y.a < y.b * x.a; });
    long long time = 0, answer = 0;
    for (auto x : v) {
        time += x.b;
        answer += x.a * time;
    }
    cout << answer << '\n';
}`,
    python: String.raw`import sys
from functools import cmp_to_key

it = iter(map(int, sys.stdin.buffer.read().split()))
n = next(it)
buildings = [(next(it), next(it)) for _ in range(n)]


def compare(x, y):
    difference = x[1] * y[0] - y[1] * x[0]
    return (difference > 0) - (difference < 0)


buildings.sort(key=cmp_to_key(compare))
time = answer = 0
for a, b in buildings:
    time += b
    answer += a * time
print(answer)
`,
  }),
];
