import { defineCpeLesson } from "@/lib/cpeLessonBuilder";

export const lessons = [
  defineCpeLesson("a524", {
    topic: "geometry",
    level: "hard",
    concept: "邊界掃描與並查集",
    goal: "只列舉可能接觸的邊界，把接觸關係轉成集合合併。",
    explanation: [
      "矩形內部不重疊，因此相接處必在邊界。先以四個角的座標合併共角矩形；再把左右邊依 x 分組、上下邊依 y 分組。同一座標中只需比較朝向相反的邊，其投影區間有交集就代表接觸，包含端點落在另一條邊內的 T 字接點。",
      "同方向的邊投影內部不會重疊，否則兩矩形內部也會重疊，所以兩組區間排序後可用雙指標列出接觸：每次移動右端較早結束的一邊。相同端點的額外角落關係已由角座標處理。並查集在根保存總面積，每次合併相加，最後取最大根面積；多筆資料讀至 EOF。",
    ],
    complexity: "時間 O(N log N)，空間 O(N)。",
    pitfall:
      "僅角落接觸也相連；只檢查嚴格邊重疊或只比矩形中心距離都不夠。面積乘法用 64 位元。",
    traceLabel: "示意：三片面積 4、2、1 的石板",
    trace: [
      {
        title: "建立面積",
        description: "A=(0,0,2,2)、B=(2,1,1,2)、C=(3,3,1,1)。",
        cells: ["A:4", "B:2", "C:1"],
        active: [0, 1, 2],
        variables: [["最大面積", "4"]],
      },
      {
        title: "共同邊界",
        description: "A 右邊與 B 左邊在 x=2，投影 [0,2] 與 [1,3] 相交。",
        cells: ["A+B:6", "C:1"],
        active: [0, 1],
        variables: [
          ["交集", "[1,2]"],
          ["最大面積", "6"],
        ],
      },
      {
        title: "共同角落",
        description: "B 與 C 都有角 (3,3)，三片合成一個集合。",
        cells: ["A+B+C:7"],
        active: [0],
        variables: [
          ["集合數", "1"],
          ["答案", "7"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <string>
#include <sstream>
#include <algorithm>
#include <numeric>
#include <cmath>
#include <iomanip>
#include <queue>
#include <deque>
#include <map>
#include <set>
#include <unordered_map>
#include <unordered_set>
#include <array>
#include <tuple>
#include <functional>
#include <limits>
#include <cstdint>
#include <cctype>
#include <utility>
using namespace std;

struct DSU {
    vector<int> p;
    vector<long long> area;
    DSU(int n) : p(n), area(n) {
        iota(p.begin(), p.end(), 0);
    }
    int find(int x) {
        return p[x] == x ? x : p[x] = find(p[x]);
    }
    void join(int a, int b) {
        a = find(a);
        b = find(b);
        if (a == b)
            return;
        if (area[a] < area[b])
            swap(a, b);
        p[b] = a;
        area[a] += area[b];
    }
};
using Edge = tuple<int, int, int>; // start, end, rectangle
void sweep(map<int, array<vector<Edge>, 2>> &groups, DSU &d) {
    for (auto &[coord, sides] : groups) {
        auto &a = sides[0];
        auto &b = sides[1];
        sort(a.begin(), a.end());
        sort(b.begin(), b.end());
        size_t i = 0, j = 0;
        while (i < a.size() && j < b.size()) {
            auto [l, r, id] = a[i];
            auto [u, v, jd] = b[j];
            if (max(l, u) <= min(r, v))
                d.join(id, jd);
            if (r < v)
                ++i;
            else
                ++j;
        }
    }
}
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    while (cin >> n) {
        DSU d(n);
        map<pair<int, int>, int> corners;
        map<int, array<vector<Edge>, 2>> vertical, horizontal;
        for (int i = 0; i < n; ++i) {
            int x, y, w, h;
            cin >> x >> y >> w >> h;
            d.area[i] = 1LL * w * h;
            // Delay all unions until every initial area is assigned.
            vertical[x][0].emplace_back(y, y + h, i);
            vertical[x + w][1].emplace_back(y, y + h, i);
            horizontal[y][0].emplace_back(x, x + w, i);
            horizontal[y + h][1].emplace_back(x, x + w, i);
        }
        for (auto &[x, sides] : vertical)
            for (auto &side : sides)
                for (auto [lo, hi, id] : side)
                    for (int y : {lo, hi}) {
                        auto [it, fresh] = corners.emplace(make_pair(x, y), id);
                        if (!fresh)
                            d.join(id, it->second);
                    }
        sweep(vertical, d);
        sweep(horizontal, d);
        long long best = 0;
        for (int i = 0; i < n; ++i)
            if (d.find(i) == i)
                best = max(best, d.area[i]);
        cout << best << '\n';
    }
}
`,
    python: String.raw`import sys
from collections import defaultdict

it = iter(map(int, sys.stdin.buffer.read().split()))
answers = []
for n in it:
    parent = list(range(n))
    area = [0] * n
    vertical = defaultdict(lambda: [[], []])
    horizontal = defaultdict(lambda: [[], []])
    corners = {}

    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    def join(a, b):
        a, b = find(a), find(b)
        if a == b:
            return
        if area[a] < area[b]:
            a, b = b, a
        parent[b] = a
        area[a] += area[b]

    for i in range(n):
        x, y, w, h = next(it), next(it), next(it), next(it)
        area[i] = w * h
        vertical[x][0].append((y, y + h, i))
        vertical[x + w][1].append((y, y + h, i))
        horizontal[y][0].append((x, x + w, i))
        horizontal[y + h][1].append((x, x + w, i))
    for x, sides in vertical.items():
        for side in sides:
            for lo, hi, i in side:
                for y in (lo, hi):
                    point = (x, y)
                    if point in corners:
                        join(i, corners[point])
                    else:
                        corners[point] = i
    for groups in (vertical, horizontal):
        for a, b in groups.values():
            a.sort()
            b.sort()
            i = j = 0
            while i < len(a) and j < len(b):
                lo, hi, u = a[i]
                left, right, v = b[j]
                if max(lo, left) <= min(hi, right):
                    join(u, v)
                if hi < right:
                    i += 1
                else:
                    j += 1
    answers.append(str(max(area[i] for i in range(n) if find(i) == i)))
print("\n".join(answers))
`,
  }),
  defineCpeLesson("a525", {
    topic: "simulation",
    level: "easy",
    concept: "有勝負才納入分母",
    goal: "分開累計每位玩家的勝與敗，正確跳過平手。",
    explanation: [
      "勝率分母不是總場數，而是勝場加敗場。每場若兩個手勢相同，任何人的計數都不變；否則用 rock→scissors、scissors→paper、paper→rock 的克制表判斷勝者，再同時增加勝者的勝場與敗者的敗場。",
      "一組固定讀取 k×n×(n−1)/2 場，不能因平手而少讀一場。輸出依編號排序，分母為零印 -；其餘先將勝率乘1000，以整數餘數四捨五入，再印固定三位小數，避免1/16=0.0625的中點誤差。只有組與組之間留一空行，n=0時不再讀k。",
    ],
    complexity: "時間 O(kn²)，額外空間 O(n)。",
    pitfall: "平手不計入分母；不要把三位小數輸出成有效位數。",
    traceLabel: "示意：兩人進行三場",
    trace: [
      {
        title: "第一場",
        description: "1 出 rock、2 出 paper，2 勝。",
        cells: ["1:0勝1敗", "2:1勝0敗"],
        active: [0, 1],
        variables: [["已處理", "1"]],
      },
      {
        title: "第二場",
        description: "兩人同出 rock，計數維持。",
        cells: ["1:0勝1敗", "2:1勝0敗"],
        active: [0, 1],
        variables: [["平手", "1"]],
      },
      {
        title: "第三場",
        description: "1 出 scissors、2 出 paper，1 勝。",
        cells: ["1:1勝1敗", "2:1勝1敗"],
        active: [0, 1],
        variables: [["勝率", "0.500、0.500"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <string>
#include <sstream>
#include <algorithm>
#include <numeric>
#include <cmath>
#include <iomanip>
#include <queue>
#include <deque>
#include <map>
#include <set>
#include <unordered_map>
#include <unordered_set>
#include <array>
#include <tuple>
#include <functional>
#include <limits>
#include <cstdint>
#include <cctype>
#include <utility>
using namespace std;

int main() {
    int n, k;
    bool first = true;
    map<string, string> beats{{"rock", "scissors"}, {"scissors", "paper"}, {"paper", "rock"}};
    while (cin >> n && n) {
        cin >> k;
        vector<int> w(n + 1), l(n + 1);
        for (int z = 0; z < k * n * (n - 1) / 2; ++z) {
            int a, b;
            string x, y;
            cin >> a >> x >> b >> y;
            if (x == y)
                continue;
            if (beats[x] != y)
                swap(a, b);
            ++w[a];
            ++l[b];
        }
        if (!first)
            cout << '\n';
        first = false;
        for (int i = 1; i <= n; ++i) {
            if (w[i] + l[i] == 0)
                cout << "-\n";
            else {
                int total = w[i] + l[i];
                int thousandths = (1000 * w[i] + total / 2) / total;
                cout << thousandths / 1000 << '.' << setw(3) << setfill('0') << thousandths % 1000
                     << '\n';
            }
        }
    }
}
`,
    python: String.raw`import sys

it = iter(sys.stdin.read().split())
groups = []
beats = {"rock": "scissors", "scissors": "paper", "paper": "rock"}
for token in it:
    n = int(token)
    if n == 0:
        break
    k = int(next(it))
    wins, losses = [0] * (n + 1), [0] * (n + 1)
    for _ in range(k * n * (n - 1) // 2):
        a, x, b, y = int(next(it)), next(it), int(next(it)), next(it)
        if x == y:
            continue
        if beats[x] != y:
            a, b = b, a
        wins[a] += 1
        losses[b] += 1
    output = []
    for i in range(1, n + 1):
        total = wins[i] + losses[i]
        if total == 0:
            output.append("-")
        else:
            units = (1000 * wins[i] + total // 2) // total
            output.append(f"{units // 1000}.{units % 1000:03d}")
    groups.append("\n".join(output))
print("\n\n".join(groups))
`,
  }),
  defineCpeLesson("a526", {
    topic: "sorting",
    level: "easy",
    concept: "最早結束的區間排程",
    goal: "用交換論證理解選最早結束活動的貪心。",
    explanation: [
      "把活動按結束時間遞增排序。維持 last 表示已選活動最後的結束時刻；遇到開始時間 s≥last 的活動就接受。選最早結束者讓後續可用時間最多，而不是選最早開始或最短活動。",
      "設任何最佳解的第一場為 B，排序後能選的最早結束活動為 A。用 A 替換 B 不會擋住原本後面的活動，因此仍有一個最佳解以 A 開頭。對剩下時間重複這個論證即可。每一天以 0 0 結束，即使當天沒有活動也輸出 0。",
    ],
    complexity: "每筆時間 O(m log m)，空間 O(m)。",
    pitfall: "相接端點可以共用，條件是 s≥last，不是 s>last。",
    traceLabel: "示意：活動 [0,3]、[1,2]、[2,4]",
    trace: [
      {
        title: "排序",
        description: "依結束時間排列。",
        cells: ["[1,2]", "[0,3]", "[2,4]"],
        active: [0, 1, 2],
        variables: [
          ["last", "0"],
          ["已選", "0"],
        ],
      },
      {
        title: "選第一場",
        description: "[1,2] 能接在 0 之後；[0,3] 與它重疊。",
        cells: ["選 [1,2]", "跳過 [0,3]"],
        active: [0, 1],
        variables: [
          ["last", "2"],
          ["已選", "1"],
        ],
      },
      {
        title: "端點接續",
        description: "[2,4] 的開始等於 last，仍然可選。",
        cells: ["[1,2]", "[2,4]"],
        active: [0, 1],
        variables: [
          ["last", "4"],
          ["答案", "2"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <string>
#include <sstream>
#include <algorithm>
#include <numeric>
#include <cmath>
#include <iomanip>
#include <queue>
#include <deque>
#include <map>
#include <set>
#include <unordered_map>
#include <unordered_set>
#include <array>
#include <tuple>
#include <functional>
#include <limits>
#include <cstdint>
#include <cctype>
#include <utility>
using namespace std;

int main() {
    int t;
    cin >> t;
    while (t--) {
        vector<pair<int, int>> a;
        int s, f;
        while (cin >> s >> f && (s || f))
            a.emplace_back(f, s);
        sort(a.begin(), a.end());
        int last = 0, ans = 0;
        for (auto [end, start] : a)
            if (start >= last) {
                ++ans;
                last = end;
            }
        cout << ans << '\n';
    }
}
`,
    python: String.raw`import sys

it = iter(map(int, sys.stdin.read().split()))
t = next(it)
for _ in range(t):
    activities = []
    while True:
        s, f = next(it), next(it)
        if s == f == 0:
            break
        activities.append((f, s))
    last = answer = 0
    for end, start in sorted(activities):
        if start >= last:
            answer += 1
            last = end
    print(answer)
`,
  }),
  defineCpeLesson("a527", {
    topic: "graphs",
    level: "hard",
    concept: "枚舉十個字母的大小寫選擇後 BFS",
    goal: "把路徑相容性改成全域遮罩，避免搜尋所有走法。",
    explanation: [
      "每個字母只有小寫或大寫二選一，總共 2¹⁰=1024 種配置。對某個遮罩，把大小寫不符的格子視為牆，從左上角執行 BFS。任何一致路徑都能補成其中一種配置；反過來，配置下的每條路徑都不會混用大小寫，所以枚舉不會漏解。",
      "BFS 距離起點設為 1，因為題目數的是經過格子而非邊。起點或終點被遮罩禁用時直接略過。可先讓遮罩符合起終點，再搜尋；若答案已達 2N−1 的曼哈頓下界便停止。多筆 N 與方格讀至 EOF，完全不可達輸出 -1。",
    ],
    complexity: "最壞時間 O(2¹⁰N²)，空間 O(N²)。",
    pitfall:
      "不能只對格子做一次 BFS 卻忽略走過的大小寫選擇；同一字母重複使用同一大小寫合法。",
    traceLabel: "示意：2×2 方格 ab／AB",
    trace: [
      {
        title: "固定起終點",
        description: "起點 a 要求 a 小寫，終點 B 要求 b 大寫。",
        cells: ["a", "b", "A", "B"],
        active: [0, 1, 2, 3],
        variables: [
          ["a 位", "0"],
          ["b 位", "1"],
        ],
      },
      {
        title: "檢查鄰居",
        description: "右邊 b 與 B 衝突，下邊 A 與 a 衝突，都不能通過。",
        cells: ["a:距離1", "b:禁用", "A:禁用", "B:未達"],
        active: [0, 1, 2, 3],
        variables: [["佇列大小", "0"]],
      },
      {
        title: "枚舉結束",
        description: "起終點要求固定了 a、b，其他八位如何選都無法連通。",
        cells: ["1024 種配置", "答案 -1"],
        active: [0, 1],
        variables: [
          ["有效的起終點配置", "256"],
          ["答案", "-1"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <string>
#include <sstream>
#include <algorithm>
#include <numeric>
#include <cmath>
#include <iomanip>
#include <queue>
#include <deque>
#include <map>
#include <set>
#include <unordered_map>
#include <unordered_set>
#include <array>
#include <tuple>
#include <functional>
#include <limits>
#include <cstdint>
#include <cctype>
#include <utility>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    while (cin >> n) {
        vector<string> g(n);
        for (auto &s : g)
            cin >> s;
        vector<int> bit(n * n), upper(n * n);
        for (int r = 0; r < n; ++r)
            for (int c = 0; c < n; ++c) {
                char ch = g[r][c];
                upper[r * n + c] = (ch >= 'A' && ch <= 'J');
                bit[r * n + c] = 1 << (upper[r * n + c] ? ch - 'A' : ch - 'a');
            }
        int best = 1000000000;
        for (int mask = 0; mask < 1024; ++mask) {
            auto ok = [&](int v) { return bool(mask & bit[v]) == bool(upper[v]); };
            if (!ok(0) || !ok(n * n - 1))
                continue;
            vector<int> d(n * n, 0);
            queue<int> q;
            d[0] = 1;
            q.push(0);
            while (!q.empty()) {
                int v = q.front();
                q.pop();
                if (v == n * n - 1) {
                    best = min(best, d[v]);
                    break;
                }
                int r = v / n, c = v % n;
                for (auto [dr, dc] : vector<pair<int, int>>{{1, 0}, {-1, 0}, {0, 1}, {0, -1}}) {
                    int x = r + dr, y = c + dc;
                    if (x < 0 || x >= n || y < 0 || y >= n)
                        continue;
                    int u = x * n + y;
                    if (!d[u] && ok(u)) {
                        d[u] = d[v] + 1;
                        q.push(u);
                    }
                }
            }
            if (best == 2 * n - 1)
                break;
        }
        cout << (best == 1000000000 ? -1 : best) << '\n';
    }
}
`,
    python: String.raw`import sys
from collections import deque

it = iter(sys.stdin.read().split())
for token in it:
    n = int(token)
    grid = [next(it) for _ in range(n)]
    letters = "".join(grid)
    bits = [1 << (ord(ch.lower()) - 97) for ch in letters]
    upper = [ch.isupper() for ch in letters]
    neighbors = [[] for _ in letters]
    for v in range(n * n):
        r, c = divmod(v, n)
        for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            x, y = r + dr, c + dc
            if 0 <= x < n and 0 <= y < n:
                neighbors[v].append(x * n + y)
    best = n * n + 1
    for mask in range(1024):
        if bool(mask & bits[0]) != upper[0] or bool(mask & bits[-1]) != upper[-1]:
            continue
        allowed = [bool(mask & bit) == up for bit, up in zip(bits, upper)]
        dist = [0] * (n * n)
        dist[0] = 1
        queue = deque([0])
        while queue:
            v = queue.popleft()
            if v == n * n - 1:
                best = min(best, dist[v])
                break
            for u in neighbors[v]:
                if allowed[u] and not dist[u]:
                    dist[u] = dist[v] + 1
                    queue.append(u)
        if best == 2 * n - 1:
            break
    print(-1 if best == n * n + 1 else best)
`,
  }),
  defineCpeLesson("a528", {
    topic: "combinatorics",
    level: "hard",
    concept: "把多餘邊集中在最小核心",
    goal: "二分最小稠密核心大小，保留其外的所有橋。",
    explanation: [
      "樹有 N−1 條邊且每條都是橋。令 E=M−(N−1)，代表超過樹的邊數；當 E=0 時答案就是 N−1。若用 s 個點承擔所有環，其餘 N−s 個點以樹枝接出，就能保留 N−s 條橋。核心至少需容納 E 條額外邊，因此 (s−1)(s−2)/2≥E。",
      "將所有非橋連通塊收縮後仍是一棵樹。給定相同的非橋頂點預算，把環集中在一塊的額外邊容量最大，因為二次函數具有凸性；拆成多塊不會增加容量。因此找到滿足不等式的最小 s 即可達到上界。容量函數單調，用二分搜尋，乘法與 M 都使用 64 位元。",
    ],
    complexity: "每筆時間 O(log N)，空間 O(1)。",
    pitfall: "N=100000 時完整圖的邊數超過有號 32 位元；E=0 要獨立處理。",
    traceLabel: "示意：N=6、M=7",
    trace: [
      {
        title: "計算額外邊",
        description: "樹需要 5 條，現在多出 2 條。",
        cells: ["N=6", "M=7", "E=2"],
        active: [0, 1, 2],
        variables: [["樹邊", "5"]],
      },
      {
        title: "測試核心",
        description: "s=3 容量為 1，s=4 容量為 3，因此至少 4 個核心點。",
        cells: ["s=3:1", "s=4:3"],
        active: [0, 1],
        variables: [["最小 s", "4"]],
      },
      {
        title: "接出樹枝",
        description: "四點核心放 5 條邊，另兩點各用一條橋接出。",
        cells: ["核心:4點5邊", "外部:2點2橋"],
        active: [0, 1],
        variables: [
          ["總邊數", "7"],
          ["答案", "2"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <string>
#include <sstream>
#include <algorithm>
#include <numeric>
#include <cmath>
#include <iomanip>
#include <queue>
#include <deque>
#include <map>
#include <set>
#include <unordered_map>
#include <unordered_set>
#include <array>
#include <tuple>
#include <functional>
#include <limits>
#include <cstdint>
#include <cctype>
#include <utility>
using namespace std;

int main() {
    int t;
    cin >> t;
    while (t--) {
        long long n, m;
        cin >> n >> m;
        long long e = m - n + 1;
        if (e == 0) {
            cout << n - 1 << '\n';
            continue;
        }
        long long lo = 3, hi = n;
        while (lo < hi) {
            long long s = (lo + hi) / 2;
            if ((s - 1) * (s - 2) / 2 >= e)
                hi = s;
            else
                lo = s + 1;
        }
        cout << n - lo << '\n';
    }
}
`,
    python: String.raw`import sys

it = iter(map(int, sys.stdin.read().split()))
for _ in range(next(it)):
    n, m = next(it), next(it)
    extra = m - n + 1
    if extra == 0:
        print(n - 1)
        continue
    lo, hi = 3, n
    while lo < hi:
        s = (lo + hi) // 2
        if (s - 1) * (s - 2) // 2 >= extra:
            hi = s
        else:
            lo = s + 1
    print(n - lo)
`,
  }),
  defineCpeLesson("a529", {
    topic: "search",
    level: "medium",
    concept: "可靠集合的位元遮罩",
    goal: "只要求被選為可靠者的證詞全部成立。",
    explanation: [
      "用 n 位遮罩表示可靠者集合。對每位線人 x，預先建立正證詞 pos[x] 與負證詞 neg[x] 的遮罩。若 x 被選入，必須同時滿足 pos[x] 完全包含於集合、neg[x] 與集合沒有交集；未被選入的人不限制他的證詞。",
      "枚舉全部 2ⁿ 個集合，每個集合只檢查已選的人。任一證詞衝突立即淘汰；通過的集合更新最大位元數。可以跳過人數不可能改善答案的集合。自稱不可靠會使該人無法入選，但不會使整筆資料無解，空集合永遠合法。0 0 結束。",
    ],
    complexity: "時間 O(n2ⁿ+a)，空間 O(n)。",
    pitfall: "不可靠者可以說真話，不能把他的每句話強制反轉。",
    traceLabel: "示意：三人，1 說 2 可靠，2 說 3 不可靠",
    trace: [
      {
        title: "選集合 {1}",
        description: "1 要求 2 入選，目前沒有，集合不合法。",
        cells: ["mask=001", "pos[1]=010"],
        active: [0, 1],
        variables: [
          ["人數", "1"],
          ["合法", "0"],
        ],
      },
      {
        title: "選集合 {1,2}",
        description: "1 的正證詞成立，2 要求排除 3 也成立。",
        cells: ["mask=011", "neg[2]=100"],
        active: [0, 1],
        variables: [
          ["人數", "2"],
          ["最佳", "2"],
        ],
      },
      {
        title: "選全部",
        description: "2 說 3 不可靠卻選入 3，發生衝突。",
        cells: ["mask=111", "111 & 100=100"],
        active: [0, 1],
        variables: [
          ["人數", "3"],
          ["答案", "2"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <string>
#include <sstream>
#include <algorithm>
#include <numeric>
#include <cmath>
#include <iomanip>
#include <queue>
#include <deque>
#include <map>
#include <set>
#include <unordered_map>
#include <unordered_set>
#include <array>
#include <tuple>
#include <functional>
#include <limits>
#include <cstdint>
#include <cctype>
#include <utility>
using namespace std;

int main() {
    int n, a;
    while (cin >> n >> a && (n || a)) {
        vector<int> pos(n), neg(n);
        while (a--) {
            int x, y;
            cin >> x >> y;
            --x;
            if (y > 0)
                pos[x] |= 1 << (y - 1);
            else
                neg[x] |= 1 << (-y - 1);
        }
        int ans = 0;
        for (int mask = 0; mask < (1 << n); ++mask) {
            int count = 0;
            for (int v = mask; v; v &= v - 1)
                ++count;
            if (count <= ans)
                continue;
            bool ok = true;
            for (int i = 0; i < n && ok; ++i)
                if (mask & (1 << i))
                    if ((mask & pos[i]) != pos[i] || (mask & neg[i]))
                        ok = false;
            if (ok)
                ans = count;
        }
        cout << ans << '\n';
    }
}
`,
    python: String.raw`import sys

it = iter(map(int, sys.stdin.read().split()))
for n in it:
    a = next(it)
    if n == a == 0:
        break
    positive, negative = [0] * n, [0] * n
    for _ in range(a):
        x, y = next(it) - 1, next(it)
        if y > 0:
            positive[x] |= 1 << (y - 1)
        else:
            negative[x] |= 1 << (-y - 1)
    best = 0
    for mask in range(1 << n):
        count = mask.bit_count()
        if count <= best:
            continue
        remaining = mask
        valid = True
        while remaining:
            bit = remaining & -remaining
            i = bit.bit_length() - 1
            if mask & positive[i] != positive[i] or mask & negative[i]:
                valid = False
                break
            remaining ^= bit
        if valid:
            best = count
    print(best)
`,
  }),
  defineCpeLesson("a530", {
    topic: "graphs",
    level: "medium",
    concept: "每個起點 BFS 比較有向距離",
    goal: "完整檢查所有有順序的路口對及不可達情形。",
    explanation: [
      "每行鄰接列表只建立從第一個編號指向後續編號的有向邊，不可自行補成雙向。所有邊長為 1，因此分別對原路網與新路網，從每一個起點做 BFS 得到最短路徑。",
      "對每個有順序的點對 (s,v)，先確認新距離不是不可達，再檢查 new≤A×old+B。任何一對不符合就輸出 No，全部符合才是 Yes。鄰接表每行長度不固定，必須整行讀取；n=0 結束。BFS 比 Floyd 更直接利用道路皆為單位權重的特性。",
    ],
    complexity: "時間 O(n(n+m₁+m₂))，空間 O(n+m₁+m₂)。",
    pitfall: "A=0 不代表可以接受斷路；新路網不可達時一律不合格。",
    traceLabel: "示意：原本三點兩兩相通，新圖 1→2→3→1，A=1、B=0",
    trace: [
      {
        title: "原距離",
        description: "從 1 到另外兩點都只需一條邊。",
        cells: ["d(1,1)=0", "d(1,2)=1", "d(1,3)=1"],
        active: [0, 1, 2],
        variables: [["上限 1→3", "1"]],
      },
      {
        title: "新 BFS",
        description: "從 1 先到 2，再到 3。",
        cells: ["new(1,1)=0", "new(1,2)=1", "new(1,3)=2"],
        active: [0, 1, 2],
        variables: [["佇列層數", "2"]],
      },
      {
        title: "比較",
        description: "2>1×1+0，已找到反例，可判定 No。",
        cells: ["2 > 1"],
        active: [0],
        variables: [
          ["違規點對", "(1,3)"],
          ["結果", "No"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <string>
#include <sstream>
#include <algorithm>
#include <numeric>
#include <cmath>
#include <iomanip>
#include <queue>
#include <deque>
#include <map>
#include <set>
#include <unordered_map>
#include <unordered_set>
#include <array>
#include <tuple>
#include <functional>
#include <limits>
#include <cstdint>
#include <cctype>
#include <utility>
using namespace std;

vector<int> bfs(const vector<vector<int>> &g, int s) {
    vector<int> d(g.size(), -1);
    queue<int> q;
    d[s] = 0;
    q.push(s);
    while (!q.empty()) {
        int u = q.front();
        q.pop();
        for (int v : g[u])
            if (d[v] < 0) {
                d[v] = d[u] + 1;
                q.push(v);
            }
    }
    return d;
}
int main() {
    int n;
    string line;
    while (cin >> n && n) {
        getline(cin, line);
        vector<vector<int>> old(n), fresh(n);
        for (auto *graph : {&old, &fresh})
            for (int row = 0; row < n; ++row) {
                getline(cin, line);
                istringstream in(line);
                int u, v;
                in >> u;
                while (in >> v)
                    (*graph)[u - 1].push_back(v - 1);
            }
        int a, b;
        cin >> a >> b;
        bool ok = true;
        for (int s = 0; s < n && ok; ++s) {
            auto x = bfs(old, s), y = bfs(fresh, s);
            for (int v = 0; v < n; ++v)
                if (y[v] < 0 || y[v] > a * x[v] + b)
                    ok = false;
        }
        cout << (ok ? "Yes" : "No") << '\n';
    }
}
`,
    python: String.raw`import sys
from collections import deque

lines = iter(sys.stdin.read().splitlines())


def bfs(g, source):
    distance = [-1] * len(g)
    distance[source] = 0
    queue = deque([source])
    while queue:
        u = queue.popleft()
        for v in g[u]:
            if distance[v] == -1:
                distance[v] = distance[u] + 1
                queue.append(v)
    return distance


for line in lines:
    if not line.strip():
        continue
    n = int(line)
    if n == 0:
        break
    graphs = []
    for _ in range(2):
        g = [[] for _ in range(n)]
        for _ in range(n):
            row = list(map(int, next(lines).split()))
            g[row[0] - 1] = [v - 1 for v in row[1:]]
        graphs.append(g)
    a, b = map(int, next(lines).split())
    valid = True
    for s in range(n):
        old, new = bfs(graphs[0], s), bfs(graphs[1], s)
        if any(y < 0 or y > a * x + b for x, y in zip(old, new)):
            valid = False
            break
    print("Yes" if valid else "No")
`,
  }),
  defineCpeLesson("a531", {
    topic: "strings",
    level: "hard",
    concept: "兩端逐層剝除引文",
    goal: "用引號段長度辨認最外層深度，保留至少一個內層引文。",
    explanation: [
      "對候選深度 k，必須先從字串左右端各取連續 k 個引號；接著內部需形成一個以上的 (k−1) 層引文。當層數大於 1 時，多段同層引文可以重新解讀成單段同層引文：保留最外側的逐層開閉符號，把中間偶數個引號改配成一層引文。因此只需從兩端依序扣除 k、k−1、…、2 個連續引號。",
      "扣除時，端點所在引號段不足當層需求就失敗，不能跨過非引號字元湊數。剝到第一層時，剩餘引號必須為正偶數，才能配成一個以上的一層引文；外層 k=1 則整串只能恰有兩個引號。最少引號數是 k(k+1)，配合首尾段長度界限，由大到小試 k。輸入本地版本有多筆，讀至 EOF。",
    ],
    complexity: "設最大候選 K≤100，時間 O(K(n+K))，空間 O(n)。",
    pitfall:
      "總引號數為偶數只是必要條件；中間非引號會阻止把兩段接成同一個開閉符號。",
    traceLabel: "示意：只有一段 22 個引號",
    trace: [
      {
        title: "嘗試 k=4",
        description: "先各扣 4 個最外層引號，共減少 8。",
        cells: ["22 → 14"],
        active: [0],
        variables: [
          ["剩餘", "14"],
          ["層數", "4"],
        ],
      },
      {
        title: "繼續剝除",
        description: "兩端各扣 3，再各扣 2。",
        cells: ["14 → 8 → 4"],
        active: [0],
        variables: [
          ["剩餘", "4"],
          ["下一層", "1"],
        ],
      },
      {
        title: "配成內層",
        description:
          "4 個引號可配成兩個一層引文；k=5 至少要 30 個，故最大為 4。",
        cells: ["4=2+2", "22<30"],
        active: [0, 1],
        variables: [["答案", "4"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <string>
#include <sstream>
#include <algorithm>
#include <numeric>
#include <cmath>
#include <iomanip>
#include <queue>
#include <deque>
#include <map>
#include <set>
#include <unordered_map>
#include <unordered_set>
#include <array>
#include <tuple>
#include <functional>
#include <limits>
#include <cstdint>
#include <cctype>
#include <utility>
using namespace std;

bool possible(vector<int> a, int k) {
    int total = accumulate(a.begin(), a.end(), 0);
    if (k == 1)
        return total == 2;
    int l = 0, r = int(a.size()) - 1;
    for (int level = k; level >= 2; --level) {
        while (l <= r && a[l] == 0)
            ++l;
        if (l > r || a[l] < level)
            return false;
        a[l] -= level;
        total -= level;
        while (l <= r && a[r] == 0)
            --r;
        if (l > r || a[r] < level)
            return false;
        a[r] -= level;
        total -= level;
    }
    return total >= 2 && total % 2 == 0;
}
int main() {
    int n;
    while (cin >> n) {
        vector<int> a(n);
        for (int &x : a)
            cin >> x;
        int sum = accumulate(a.begin(), a.end(), 0), ans = 0;
        for (int k = min(a.front(), a.back()); k >= 1; --k)
            if (k * (k + 1) <= sum && possible(a, k)) {
                ans = k;
                break;
            }
        if (ans)
            cout << ans << '\n';
        else
            cout << "no quotation\n";
    }
}
`,
    python: String.raw`import sys


def possible(runs, k):
    total = sum(runs)
    if k == 1:
        return total == 2
    a = runs[:]
    left, right = 0, len(a) - 1
    for level in range(k, 1, -1):
        while left <= right and a[left] == 0:
            left += 1
        if left > right or a[left] < level:
            return False
        a[left] -= level
        total -= level
        while left <= right and a[right] == 0:
            right -= 1
        if left > right or a[right] < level:
            return False
        a[right] -= level
        total -= level
    return total >= 2 and total % 2 == 0


it = iter(map(int, sys.stdin.read().split()))
for n in it:
    runs = [next(it) for _ in range(n)]
    total = sum(runs)
    answer = 0
    for k in range(min(runs[0], runs[-1]), 0, -1):
        if k * (k + 1) <= total and possible(runs, k):
            answer = k
            break
    print(answer if answer else "no quotation")
`,
  }),
  defineCpeLesson("a532", {
    topic: "math",
    level: "easy",
    concept: "有理數交叉乘與約分",
    goal: "完全用整數判斷先後並輸出平均到達時間。",
    explanation: [
      "兩架飛機時間為 d₁/v₁ 與 d₂/v₂。速度皆正，第一架先到等價於 d₁v₂<d₂v₁；交叉乘避免浮點誤判。平均時間則是 (d₁v₂+d₂v₁)/(2v₁v₂)，不需要先分別計算小數。",
      "對分子分母取 gcd 後同除，得到最簡分數。分母若為 1 只印整數。最大乘積量級為 10¹⁸，兩個乘積相加及兩倍分母最多 2×10¹⁸，C++ 需 long long。四個零結束，每筆固定兩行並正確保留 Case #k 與標點。",
    ],
    complexity: "每筆時間 O(log(max(v₁,v₂,d₁,d₂)))，空間 O(1)。",
    pitfall: "不要用整數除法先算各自飛行時間，也不能把整數結果印成 x/1。",
    traceLabel: "示意：v₁=2、d₁=4、v₂=1、d₂=3",
    trace: [
      {
        title: "比較先後",
        description: "比較 4×1 與 3×2。",
        cells: ["4", "6"],
        active: [0, 1],
        variables: [["第一架先到", "1"]],
      },
      {
        title: "平均分數",
        description: "時間平均為 (4+6)/(2×2×1)。",
        cells: ["10/4"],
        active: [0],
        variables: [
          ["分子", "10"],
          ["分母", "4"],
        ],
      },
      {
        title: "約分輸出",
        description: "gcd(10,4)=2，平均為 5/2。",
        cells: ["5/2"],
        active: [0],
        variables: [
          ["Case", "1"],
          ["先到時間", "2"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <string>
#include <sstream>
#include <algorithm>
#include <numeric>
#include <cmath>
#include <iomanip>
#include <queue>
#include <deque>
#include <map>
#include <set>
#include <unordered_map>
#include <unordered_set>
#include <array>
#include <tuple>
#include <functional>
#include <limits>
#include <cstdint>
#include <cctype>
#include <utility>
using namespace std;

int main() {
    long long v1, d1, v2, d2;
    int tc = 0;
    while (cin >> v1 >> d1 >> v2 >> d2 && (v1 || d1 || v2 || d2)) {
        cout << "Case #" << ++tc << ": "
             << (d1 * v2 < d2 * v1 ? "You owe me a beer!" : "No beer for the captain.") << '\n';
        long long p = d1 * v2 + d2 * v1, q = 2 * v1 * v2, g = gcd(p, q);
        p /= g;
        q /= g;
        cout << "Avg. arrival time: " << p;
        if (q != 1)
            cout << '/' << q;
        cout << '\n';
    }
}
`,
    python: String.raw`import sys
from math import gcd

it = iter(map(int, sys.stdin.read().split()))
case = 0
for v1 in it:
    d1, v2, d2 = next(it), next(it), next(it)
    if v1 == d1 == v2 == d2 == 0:
        break
    case += 1
    message = "You owe me a beer!" if d1 * v2 < d2 * v1 else "No beer for the captain."
    print(f"Case #{case}: {message}")
    p, q = d1 * v2 + d2 * v1, 2 * v1 * v2
    divisor = gcd(p, q)
    p, q = p // divisor, q // divisor
    print("Avg. arrival time: " + (str(p) if q == 1 else f"{p}/{q}"))
`,
  }),
  defineCpeLesson("a533", {
    topic: "number-theory",
    level: "medium",
    concept: "二進位每個位元的週期計數",
    goal: "把區間總位元數拆成前綴函數相減。",
    explanation: [
      "定義 F(n) 為 0 到 n 所有二進位表示中的 1 總數，n<0 時為 0。第 b 位以長度 2^(b+1) 為週期，前半全 0、後半全 1。設 half=2^b、count=n+1，完整週期貢獻 count//(2half)×half，剩餘部分貢獻 max(0,count%(2half)−half)。",
      "每一位獨立累加就是 F(n)，所以 [a,b] 答案為 F(b)−F(a−1)。只需計算不超過 n 的二次冪，避免逐一枚舉數字。0 0 是終止資料，不輸出 Case；答案可能超過 32 位元，使用 long long。",
    ],
    complexity: "每筆時間 O(log b)，空間 O(1)。",
    pitfall: "閉區間要用 b+1 個前綴元素來計算週期；a=0 時必須讓 F(-1)=0。",
    traceLabel: "示意：計算 [2,5]",
    trace: [
      {
        title: "最低位",
        description: "0..5 有 6 個數，第 0 位完整三個週期，貢獻 3。",
        cells: ["0", "1", "10", "11", "100", "101"],
        active: [0, 1, 2, 3, 4, 5],
        variables: [
          ["half", "1"],
          ["F(5)累計", "3"],
        ],
      },
      {
        title: "更高位",
        description: "第 1 位貢獻 2，第 2 位貢獻 2，F(5)=7。",
        cells: ["位0:3", "位1:2", "位2:2"],
        active: [0, 1, 2],
        variables: [["F(5)", "7"]],
      },
      {
        title: "前綴相減",
        description: "F(1)=1，所以 10、11、100、101 合計 6 個 1。",
        cells: ["7−1=6"],
        active: [0],
        variables: [
          ["F(1)", "1"],
          ["答案", "6"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <string>
#include <sstream>
#include <algorithm>
#include <numeric>
#include <cmath>
#include <iomanip>
#include <queue>
#include <deque>
#include <map>
#include <set>
#include <unordered_map>
#include <unordered_set>
#include <array>
#include <tuple>
#include <functional>
#include <limits>
#include <cstdint>
#include <cctype>
#include <utility>
using namespace std;

long long prefix(long long n) {
    if (n < 0)
        return 0;
    long long ans = 0, count = n + 1;
    for (long long half = 1; half <= n; half *= 2) {
        long long period = 2 * half;
        ans += count / period * half + max(0LL, count % period - half);
    }
    return ans;
}
int main() {
    long long a, b;
    int tc = 0;
    while (cin >> a >> b && (a || b))
        cout << "Case " << ++tc << ": " << prefix(b) - prefix(a - 1) << '\n';
}
`,
    python: String.raw`import sys


def prefix(n):
    if n < 0:
        return 0
    count, half, answer = n + 1, 1, 0
    while half <= n:
        period = 2 * half
        answer += count // period * half + max(0, count % period - half)
        half *= 2
    return answer


it = iter(map(int, sys.stdin.read().split()))
case = 0
for a in it:
    b = next(it)
    if a == b == 0:
        break
    case += 1
    print(f"Case {case}: {prefix(b) - prefix(a - 1)}")
`,
  }),
  defineCpeLesson("a534", {
    topic: "combinatorics",
    level: "hard",
    concept: "反向還原排列的 Lehmer 編碼",
    goal: "由排列名次推知每個字母在剩餘字母中的排名。",
    explanation: [
      "將 k 改成從零開始的 rank=k−1。首字母在尚未決定的字母中，前面每一個較小字母都會產生 (n−1)! 個排列，因此 rank//(n−1)! 就是 s[0] 在剩餘字母中的相對排名；餘數交給下一個位置，以此類推。",
      "這次並不知道字母表本身，維護的是由小至大排列的空槽。每次取相對排名指向的空槽，把當前字母填入，再刪除該槽。所有位置完成後按槽順序讀出外星字母表。20! 小於 2⁶³，C++ long long 足夠；輸出 Case i: alphabet。",
    ],
    complexity: "每筆時間 O(n²)，空間 O(n)。",
    pitfall:
      "不是依一般英文字母順序把 s 取第 k 個排列；未知的是字母表，已知的是 s 的名次。",
    traceLabel: "示意：s=bac、k=3",
    trace: [
      {
        title: "首字母排名",
        description: "rank=2，2!=2，b 在剩餘字母中排名 1。",
        cells: ["空槽0", "b", "空槽2"],
        active: [0, 1, 2],
        variables: [
          ["rank", "0"],
          ["空槽", "0,2"],
        ],
      },
      {
        title: "第二字母",
        description: "rank//1!=0，把 a 放在最小空槽。",
        cells: ["a", "b", "空槽2"],
        active: [0, 1, 2],
        variables: [
          ["rank", "0"],
          ["空槽", "2"],
        ],
      },
      {
        title: "最後字母",
        description: "c 放入唯一空槽，字母表為 abc；bac 正好是第 3 個排列。",
        cells: ["a", "b", "c"],
        active: [0, 1, 2],
        variables: [
          ["答案", "abc"],
          ["名次", "3"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <string>
#include <sstream>
#include <algorithm>
#include <numeric>
#include <cmath>
#include <iomanip>
#include <queue>
#include <deque>
#include <map>
#include <set>
#include <unordered_map>
#include <unordered_set>
#include <array>
#include <tuple>
#include <functional>
#include <limits>
#include <cstdint>
#include <cctype>
#include <utility>
using namespace std;

int main() {
    long long fact[21] = {1};
    for (int i = 1; i <= 20; ++i)
        fact[i] = fact[i - 1] * i;
    int t;
    cin >> t;
    for (int tc = 1; tc <= t; ++tc) {
        string s;
        long long k;
        cin >> s >> k;
        --k;
        int n = s.size();
        vector<int> slots(n);
        iota(slots.begin(), slots.end(), 0);
        string ans(n, '?');
        for (int i = 0; i < n; ++i) {
            long long f = fact[n - i - 1];
            int r = int(k / f);
            k %= f;
            ans[slots[r]] = s[i];
            slots.erase(slots.begin() + r);
        }
        cout << "Case " << tc << ": " << ans << '\n';
    }
}
`,
    python: String.raw`import sys
from math import factorial

it = iter(sys.stdin.read().split())
for case in range(1, int(next(it)) + 1):
    s, rank = next(it), int(next(it)) - 1
    slots = list(range(len(s)))
    alphabet = [""] * len(s)
    for i, ch in enumerate(s):
        index, rank = divmod(rank, factorial(len(s) - i - 1))
        alphabet[slots.pop(index)] = ch
    print(f"Case {case}: {''.join(alphabet)}")
`,
  }),
  defineCpeLesson("a535", {
    topic: "strings",
    level: "hard",
    concept: "費氏字串的長度導引查詢",
    goal: "只展開查詢區間，並用同奇偶的大前綴縮小超大 N。",
    explanation: [
      "BFS(n) 的左段是 BFS(n−2)、右段是 BFS(n−1)，長度也滿足費氏遞迴。先預算到長度首次大於 2³¹−1 的位置 H。對 n>H+1，所有合法查詢索引都還在左段，因此可以反覆令 n減2，直接縮成 H 或 H+1，保留奇偶性。",
      "對縮小後的字串，用堆疊保存 (n,l,r)。若區間碰到左段，加入其交集；若碰到右段，把索引減去左段長度再加入。堆疊先放右段再放左段，輸出才會按原順序。n=0、1 時才真的輸出單一字元，避免建立指數長度的完整字串。",
    ],
    complexity: "設輸出長度 L，時間 O(L+log j)，空間 O(L+log j)（含輸出）。",
    pitfall:
      "串接順序是 n−2 接 n−1；超大 N 縮減時要保留奇偶性，不能一律截成同一值。",
    traceLabel: "示意：BFS(4)=01101，查詢 [1,3]",
    trace: [
      {
        title: "切分",
        description: "左段 BFS(2)=01 長 2，右段 BFS(3)=101 長 3。",
        cells: ["01", "101"],
        active: [0, 1],
        variables: [
          ["n", "4"],
          ["區間", "1..3"],
        ],
      },
      {
        title: "分配索引",
        description: "左段取 [1,1] 得 1；右段改取 [0,1]。",
        cells: ["左:1", "右:10"],
        active: [0, 1],
        variables: [
          ["左段長", "2"],
          ["右段區間", "0..1"],
        ],
      },
      {
        title: "接合結果",
        description: "依左至右接成 110。",
        cells: ["1", "10", "110"],
        active: [0, 1, 2],
        variables: [
          ["字元數", "3"],
          ["答案", "110"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <string>
#include <sstream>
#include <algorithm>
#include <numeric>
#include <cmath>
#include <iomanip>
#include <queue>
#include <deque>
#include <map>
#include <set>
#include <unordered_map>
#include <unordered_set>
#include <array>
#include <tuple>
#include <functional>
#include <limits>
#include <cstdint>
#include <cctype>
#include <utility>
using namespace std;

int main() {
    vector<long long> len{1, 1};
    while (len.back() <= 2147483647LL)
        len.push_back(len[len.size() - 2] + len.back());
    int h = int(len.size()) - 1;
    len.push_back(len[h - 1] + len[h]);
    int t;
    cin >> t;
    while (t--) {
        long long n, l, r;
        cin >> n >> l >> r;
        if (n > h + 1)
            n = h + (n - h) % 2;
        vector<tuple<int, long long, long long>> st{{int(n), l, r}};
        string ans;
        while (!st.empty()) {
            auto [v, a, b] = st.back();
            st.pop_back();
            if (v < 2) {
                ans.push_back(char('0' + v));
                continue;
            }
            long long left = len[v - 2];
            if (b >= left)
                st.emplace_back(v - 1, max(0LL, a - left), b - left);
            if (a < left)
                st.emplace_back(v - 2, a, min(b, left - 1));
        }
        cout << ans << '\n';
    }
}
`,
    python: String.raw`import sys

length = [1, 1]
while length[-1] <= 2**31 - 1:
    length.append(length[-2] + length[-1])
h = len(length) - 1
length.append(length[-2] + length[-1])
it = iter(map(int, sys.stdin.read().split()))
for _ in range(next(it)):
    n, left, right = next(it), next(it), next(it)
    if n > h + 1:
        n = h + (n - h) % 2
    stack = [(n, left, right)]
    answer = []
    while stack:
        v, a, b = stack.pop()
        if v < 2:
            answer.append(str(v))
            continue
        split = length[v - 2]
        if b >= split:
            stack.append((v - 1, max(0, a - split), b - split))
        if a < split:
            stack.append((v - 2, a, min(b, split - 1)))
    print("".join(answer))
`,
  }),
  defineCpeLesson("a536", {
    topic: "simulation",
    level: "medium",
    concept: "記錄每個時間欄的繪製高度",
    goal: "先模擬高度，再由高至低輸出保留空間的圖形。",
    explanation: [
      "每個指令對應一個欄位。R 在目前高度畫 / 後升高；F 先降一格再畫反斜線；C 在目前高度畫 _。保存每欄實際畫字元的高度，並追蹤最低與最高繪製列，而不是直接拿走勢頂點當畫布範圍。",
      "輸出從最高繪製列到最低列，每列先放 | 與一個空白，再依欄位放圖字元或空白，最後刪除行尾空白。最低圖列下方立刻畫 + 與 len+2 個減號。每組先印 Case #k:，圖後再空一行；負高度只影響列的相對位置。",
    ],
    complexity: "每筆時間 O(L²)，空間 O(L)（逐列輸出）。",
    pitfall:
      "F 的下降發生在繪圖之前；最高價格未必是最高繪製列。行內空白不可縮排。",
    traceLabel: "示意：指令 RCF",
    trace: [
      {
        title: "R",
        description: "在高度 0 畫 /，之後高度變 1。",
        cells: ["欄0:/@0"],
        active: [0],
        variables: [
          ["目前高度", "1"],
          ["最低繪製列", "0"],
        ],
      },
      {
        title: "C",
        description: "在高度 1 畫 _，高度不變。",
        cells: ["欄0:/@0", "欄1:_@1"],
        active: [0, 1],
        variables: [
          ["目前高度", "1"],
          ["最高繪製列", "1"],
        ],
      },
      {
        title: "F",
        description: "先降回 0 再畫反斜線，上列只有 _，下列是 / 與反斜線。",
        cells: ["欄0:/@0", "欄1:_@1", "欄2:反斜線@0"],
        active: [0, 1, 2],
        variables: [
          ["最終高度", "0"],
          ["x軸減號數", "5"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <string>
#include <sstream>
#include <algorithm>
#include <numeric>
#include <cmath>
#include <iomanip>
#include <queue>
#include <deque>
#include <map>
#include <set>
#include <unordered_map>
#include <unordered_set>
#include <array>
#include <tuple>
#include <functional>
#include <limits>
#include <cstdint>
#include <cctype>
#include <utility>
using namespace std;

int main() {
    int t;
    cin >> t;
    for (int tc = 1; tc <= t; ++tc) {
        string s;
        cin >> s;
        vector<int> y;
        string glyph;
        int h = 0;
        for (char c : s) {
            if (c == 'F')
                --h;
            y.push_back(h);
            glyph.push_back(c == 'R' ? '/' : c == 'F' ? '\\' : '_');
            if (c == 'R')
                ++h;
        }
        int low = *min_element(y.begin(), y.end()), high = *max_element(y.begin(), y.end());
        cout << "Case #" << tc << ":\n";
        for (int row = high; row >= low; --row) {
            string line = "| ";
            for (int col = 0; col < int(s.size()); ++col)
                line += y[col] == row ? glyph[col] : ' ';
            while (line.back() == ' ')
                line.pop_back();
            cout << line << '\n';
        }
        cout << '+' << string(s.size() + 2, '-') << "\n\n";
    }
}
`,
    python: String.raw`import sys

it = iter(sys.stdin.read().split())
for case in range(1, int(next(it)) + 1):
    s = next(it)
    heights, glyphs = [], []
    height = 0
    for ch in s:
        if ch == "F":
            height -= 1
        heights.append(height)
        glyphs.append({"R": "/", "F": "\\", "C": "_"}[ch])
        if ch == "R":
            height += 1
    print(f"Case #{case}:")
    for row in range(max(heights), min(heights) - 1, -1):
        print(
            (
                "| " + "".join(glyphs[i] if heights[i] == row else " " for i in range(len(s)))
            ).rstrip()
        )
    print("+" + "-" * (len(s) + 2))
    print()
`,
  }),
  defineCpeLesson("a537", {
    topic: "graphs",
    level: "hard",
    concept: "每個頂點最多擴展 k 次的 Dijkstra",
    goal: "保留相同長度的不同走法，找到第 k 次抵達終點。",
    explanation: [
      "堆積中的 (距離,頂點) 代表一條具體走法的尾端，不能像一般最短路徑只保存一個最短距離。每次彈出某點，就累計它已被取出幾次；前 k 次抵達都向外擴展。第 k 次取出終點的距離，就是按走法重數計算的答案。",
      "邊權非負，堆積取出的距離非遞減。對同一頂點，第 k 次之後的前綴接任意後綴，都已有至少 k 個不更長的前綴可替代，因此不用再擴展。零權環和重邊也照次數保留；走到終點後仍可離開再回來，所以前 k−1 次抵達終點也要擴展。堆積耗盡則不足 k 條，輸出 -1。",
    ],
    complexity: "時間 O(km log(km))，空間 O(km+n)。",
    pitfall: "不可用距離去重；題目容許重複點與邊，同長的不同走法各占一個排名。",
    traceLabel: "示意：1→2 權5、2→2 權2，找第3短的1→2",
    trace: [
      {
        title: "第一條",
        description: "由 1 到 2 距離 5。",
        cells: ["(5,2)"],
        active: [0],
        variables: [
          ["終點取出次數", "1"],
          ["新候選", "7"],
        ],
      },
      {
        title: "第二條",
        description: "多走一次自環，距離 7。",
        cells: ["(7,2)"],
        active: [0],
        variables: [
          ["終點取出次數", "2"],
          ["新候選", "9"],
        ],
      },
      {
        title: "第三條",
        description: "再走一次自環，距離 9，正好是第 3 條。",
        cells: ["(9,2)"],
        active: [0],
        variables: [
          ["終點取出次數", "3"],
          ["答案", "9"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <string>
#include <sstream>
#include <algorithm>
#include <numeric>
#include <cmath>
#include <iomanip>
#include <queue>
#include <deque>
#include <map>
#include <set>
#include <unordered_map>
#include <unordered_set>
#include <array>
#include <tuple>
#include <functional>
#include <limits>
#include <cstdint>
#include <cctype>
#include <utility>
using namespace std;

int main() {
    int n, m;
    while (cin >> n >> m && (n || m)) {
        int x, y, k;
        cin >> x >> y >> k;
        --x;
        --y;
        vector<vector<pair<int, int>>> g(n);
        while (m--) {
            int u, v, w;
            cin >> u >> v >> w;
            g[u - 1].emplace_back(v - 1, w);
        }
        using State = pair<long long, int>;
        priority_queue<State, vector<State>, greater<State>> pq;
        vector<int> count(n);
        pq.emplace(0, x);
        long long answer = -1;
        while (!pq.empty()) {
            auto [d, u] = pq.top();
            pq.pop();
            if (count[u] >= k)
                continue;
            ++count[u];
            if (u == y && count[u] == k) {
                answer = d;
                break;
            }
            for (auto [v, w] : g[u])
                if (count[v] < k)
                    pq.emplace(d + w, v);
        }
        cout << answer << '\n';
    }
}
`,
    python: String.raw`import sys
import heapq

it = iter(map(int, sys.stdin.read().split()))
for n in it:
    m = next(it)
    if n == m == 0:
        break
    source, target, k = next(it) - 1, next(it) - 1, next(it)
    graph = [[] for _ in range(n)]
    for _ in range(m):
        u, v, w = next(it) - 1, next(it) - 1, next(it)
        graph[u].append((v, w))
    count = [0] * n
    heap = [(0, source)]
    answer = -1
    while heap:
        distance, u = heapq.heappop(heap)
        if count[u] >= k:
            continue
        count[u] += 1
        if u == target and count[u] == k:
            answer = distance
            break
        for v, weight in graph[u]:
            if count[v] < k:
                heapq.heappush(heap, (distance + weight, v))
    print(answer)
`,
  }),
  defineCpeLesson("a538", {
    topic: "sorting",
    level: "medium",
    concept: "合併排序計算逆序對",
    goal: "一次算出右半較小元素跨越多少左半元素。",
    explanation: [
      "若 i<j 而 a[i]>a[j]，這對元素就是逆序對。交換相鄰逆序元素恰使逆序對減一；其他相鄰交換不會讓數量下降更多。因此排序最少交換次數等於初始逆序對數，而不是排序時任意交換兩元素的次數。",
      "合併排序先遞迴計算左右兩半的逆序對。合併時，如果右側元素比左側目前元素小，左半尚未取出的全部元素都比它大，一次增加 mid−i；否則取左側，不增加。各層總合併量為 n，且共 log n 層。n=0 結束，最大答案近 n(n−1)/2，必須用 64 位元。",
    ],
    complexity: "時間 O(n log n)，空間 O(n)。",
    pitfall: "跨半部計數是左半剩餘元素數；不能只在每次取右邊時加 1。",
    traceLabel: "示意：序列 3、1、2",
    trace: [
      {
        title: "分割",
        description: "左半 [3]、右半 [1,2]，兩邊各自沒有逆序。",
        cells: ["3", "1", "2"],
        active: [0, 1, 2],
        variables: [["內部逆序", "0"]],
      },
      {
        title: "取右側 1",
        description: "1<3，右側 1 跨越左側尚未取出的 3。",
        cells: ["已合併:1", "左剩:3", "右剩:2"],
        active: [0, 1, 2],
        variables: [
          ["新增", "1"],
          ["累計", "1"],
        ],
      },
      {
        title: "取右側 2",
        description: "2<3 再增加 1，最後放 3，得到 [1,2,3]。",
        cells: ["1", "2", "3"],
        active: [0, 1, 2],
        variables: [
          ["新增", "1"],
          ["答案", "2"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <string>
#include <sstream>
#include <algorithm>
#include <numeric>
#include <cmath>
#include <iomanip>
#include <queue>
#include <deque>
#include <map>
#include <set>
#include <unordered_map>
#include <unordered_set>
#include <array>
#include <tuple>
#include <functional>
#include <limits>
#include <cstdint>
#include <cctype>
#include <utility>
using namespace std;

long long mergeCount(vector<int> &a, vector<int> &tmp, int l, int r) {
    if (r - l <= 1)
        return 0;
    int mid = (l + r) / 2;
    long long ans = mergeCount(a, tmp, l, mid) + mergeCount(a, tmp, mid, r);
    int i = l, j = mid, k = l;
    while (i < mid && j < r) {
        if (a[i] <= a[j])
            tmp[k++] = a[i++];
        else {
            tmp[k++] = a[j++];
            ans += mid - i;
        }
    }
    while (i < mid)
        tmp[k++] = a[i++];
    while (j < r)
        tmp[k++] = a[j++];
    copy(tmp.begin() + l, tmp.begin() + r, a.begin() + l);
    return ans;
}
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    while (cin >> n && n) {
        vector<int> a(n), tmp(n);
        for (int &x : a)
            cin >> x;
        cout << mergeCount(a, tmp, 0, n) << '\n';
    }
}
`,
    python: String.raw`import sys


def count_inversions(a):
    n = len(a)
    temp = [0] * n
    width, total = 1, 0
    while width < n:
        for left in range(0, n, 2 * width):
            mid, right = min(left + width, n), min(left + 2 * width, n)
            i, j, k = left, mid, left
            while i < mid and j < right:
                if a[i] <= a[j]:
                    temp[k] = a[i]
                    i += 1
                else:
                    temp[k] = a[j]
                    j += 1
                    total += mid - i
                k += 1
            while i < mid:
                temp[k] = a[i]
                i += 1
                k += 1
            while j < right:
                temp[k] = a[j]
                j += 1
                k += 1
        a, temp = temp, a
        width *= 2
    return total


it = iter(map(int, sys.stdin.buffer.read().split()))
for n in it:
    if n == 0:
        break
    print(count_inversions([next(it) for _ in range(n)]))
`,
  }),
  defineCpeLesson("a539", {
    topic: "graphs",
    level: "medium",
    concept: "把目的站費用放進有向邊權",
    goal: "最短路徑同時還原路線與計算每人票價。",
    explanation: [
      "從 u 行駛到 v 需付 2×公里數 加上 v 的站費。起點費用單獨加入初始距離，這樣每經過一站就恰好計費一次。道路雖然雙向，兩個方向的邊權可能因目的站費不同而不同。",
      "對每個查詢做Dijkstra，鬆弛成功時記錄前驅。由終點沿前驅回到起點再反轉，就得到唯一最佳路線。最小成本乘1.1，再除以座位數，最後才四捨五入到兩位小數；例如成本15、4個座位時4.125應印4.13。Python用Decimal明確指定四捨五入，C++在百分位上加半取下整數。輸入空白行可略過；輸出僅地圖間一空行。",
    ],
    complexity: "每查詢時間 O((n+m) log n)，空間 O(n+m)。",
    pitfall: "出發與目的站都收費；不要將 10% 利潤當成只對油費加價。",
    traceLabel: "示意：A站費2、B站費3、C站費1，道路AB=4、BC=2、AC=10",
    trace: [
      {
        title: "到 B",
        description: "先支付 A 費 2，再加油費 8 與 B 費 3。",
        cells: ["A:2", "B:13", "C:23"],
        active: [0, 1, 2],
        variables: [["A→B 成本", "13"]],
      },
      {
        title: "經 B 到 C",
        description: "再加 4+1，共 18，優於直達的 23。",
        cells: ["A→B→C:18", "A→C:23"],
        active: [0, 1],
        variables: [
          ["C前驅", "B"],
          ["成本", "18"],
        ],
      },
      {
        title: "分攤票價",
        description: "若 3 個座位，18×1.1÷3=6.60。",
        cells: ["A", "B", "C"],
        active: [0, 1, 2],
        variables: [
          ["座位", "3"],
          ["票價", "6.60"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <string>
#include <sstream>
#include <algorithm>
#include <numeric>
#include <cmath>
#include <iomanip>
#include <queue>
#include <deque>
#include <map>
#include <set>
#include <unordered_map>
#include <unordered_set>
#include <array>
#include <tuple>
#include <functional>
#include <limits>
#include <cstdint>
#include <cctype>
#include <utility>
using namespace std;

int main() {
    int maps;
    cin >> maps;
    for (int tc = 1; tc <= maps; ++tc) {
        int n;
        cin >> n;
        vector<string> name(n);
        vector<long double> fee(n);
        map<string, int> id;
        for (int i = 0; i < n; ++i) {
            cin >> name[i] >> fee[i];
            id[name[i]] = i;
        }
        vector<vector<pair<int, long double>>> g(n);
        int m;
        cin >> m;
        while (m--) {
            string a, b;
            long double km;
            cin >> a >> b >> km;
            int u = id[a], v = id[b];
            g[u].emplace_back(v, 2 * km + fee[v]);
            g[v].emplace_back(u, 2 * km + fee[u]);
        }
        if (tc > 1)
            cout << '\n';
        cout << "Map #" << tc << '\n';
        int q;
        cin >> q;
        for (int z = 1; z <= q; ++z) {
            string a, b;
            long double seats;
            cin >> a >> b >> seats;
            int s = id[a], t = id[b];
            vector<long double> d(n, 1e100);
            vector<int> parent(n, -1);
            using P = pair<long double, int>;
            priority_queue<P, vector<P>, greater<P>> pq;
            d[s] = fee[s];
            pq.emplace(d[s], s);
            while (!pq.empty()) {
                auto [cost, u] = pq.top();
                pq.pop();
                if (cost != d[u])
                    continue;
                for (auto [v, w] : g[u])
                    if (d[v] > cost + w) {
                        d[v] = cost + w;
                        parent[v] = u;
                        pq.emplace(d[v], v);
                    }
            }
            vector<int> path;
            for (int v = t; v != -1; v = parent[v])
                path.push_back(v);
            reverse(path.begin(), path.end());
            cout << "Query #" << z << '\n';
            for (size_t i = 0; i < path.size(); ++i) {
                if (i)
                    cout << ' ';
                cout << name[path[i]];
            }
            long long cents = static_cast<long long>(floor(d[t] * 110.0L / seats + 0.5L));
            cout << "\nEach passenger has to pay : " << cents / 100 << '.' << setw(2)
                 << setfill('0') << cents % 100 << " taka\n";
        }
    }
}
`,
    python: String.raw`import sys
import heapq
from decimal import Decimal, ROUND_HALF_UP

it = iter(sys.stdin.read().split())
for case in range(1, int(next(it)) + 1):
    n = int(next(it))
    names, fees, index = [], [], {}
    for i in range(n):
        name, fee = next(it), Decimal(next(it))
        index[name] = i
        names.append(name)
        fees.append(fee)
    graph = [[] for _ in range(n)]
    for _ in range(int(next(it))):
        a, b, km = next(it), next(it), Decimal(next(it))
        u, v = index[a], index[b]
        graph[u].append((v, 2 * km + fees[v]))
        graph[v].append((u, 2 * km + fees[u]))
    if case > 1:
        print()
    print(f"Map #{case}")
    for query in range(1, int(next(it)) + 1):
        a, b, seats = next(it), next(it), Decimal(next(it))
        source, target = index[a], index[b]
        distance, parent = [Decimal("Infinity")] * n, [-1] * n
        distance[source] = fees[source]
        heap = [(fees[source], source)]
        while heap:
            cost, u = heapq.heappop(heap)
            if cost != distance[u]:
                continue
            for v, weight in graph[u]:
                candidate = cost + weight
                if candidate < distance[v]:
                    distance[v] = candidate
                    parent[v] = u
                    heapq.heappush(heap, (candidate, v))
        path, v = [], target
        while v != -1:
            path.append(names[v])
            v = parent[v]
        print(f"Query #{query}")
        print(" ".join(reversed(path)))
        fare = (distance[target] * Decimal("1.1") / seats).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )
        print(f"Each passenger has to pay : {fare:.2f} taka")
`,
  }),
];
