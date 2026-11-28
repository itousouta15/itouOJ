import { defineCpeLesson } from "@/lib/cpeLessonBuilder";

export const lessons = [
  defineCpeLesson("a652", {
    topic: "combinatorics",
    level: "medium",
    concept: "按攻擊直線計算有序皇后對",
    goal: "將大量棋格配對化為等差對角線長度的封閉公式。",
    explanation: [
      "長度 l 的一條直線可放 l(l−1) 對有顏色區別的皇后。同列共 M·N(N−1)，同欄共 N·M(M−1)；不同格不可能同時同列又同欄，也不可能同時屬於兩個對角方向，因此可直接相加。",
      "先交換使 m≤n。一個對角方向的長度為 1,…,m−1，各出現兩次，再加 n−m+1 條長度 m。兩個方向總和為 4(m−1)m(m−2)/3 + 2(n−m+1)m(m−1)。與列欄項相加即可，不必走訪百萬平方的棋盤。讀到 0 0 停止，所有乘法用 64 位元整數。",
    ],
    complexity: "每筆時間 O(1)，額外空間 O(1)。",
    pitfall: "黑白有別，不可再除以 2；m=1 的對角線貢獻為 0。",
    traceLabel: "示意：2×3 棋盤",
    trace: [
      {
        title: "橫向",
        description: "兩列各有 3·2 對。",
        cells: ["3", "3", "12"],
        active: [2],
        variables: [["橫向", "12"]],
      },
      {
        title: "直向",
        description: "三欄各有 2·1 對。",
        cells: ["2", "2", "2", "6"],
        active: [3],
        variables: [["累計", "18"]],
      },
      {
        title: "對角",
        description: "每方向兩條長 2 的線，共增加 8。",
        cells: ["2·2", "2·2", "26"],
        active: [2],
        variables: [["答案", "26"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <algorithm>
using namespace std;
int main() {
    long long m, n;
    while (cin >> m >> n && (m || n)) {
        if (m > n)
            swap(m, n);
        long long answer = m * n * (m + n - 2);
        answer += 4 * (m - 1) * m * (m - 2) / 3;
        answer += 2 * (n - m + 1) * m * (m - 1);
        cout << answer << '\n';
    }
}`,
    python: String.raw`import sys

it = iter(map(int, sys.stdin.buffer.read().split()))
for m, n in zip(it, it):
    if m == n == 0:
        break
    m, n = sorted((m, n))
    answer = m * n * (m + n - 2)
    answer += 4 * (m - 1) * m * (m - 2) // 3
    answer += 2 * (n - m + 1) * m * (m - 1)
    print(answer)
`,
  }),
  defineCpeLesson("a653", {
    topic: "graphs",
    level: "easy",
    concept: "BFS 二著色與奇環衝突",
    goal: "以相鄰頂點顏色必須相反的不變量判定二分圖。",
    explanation: [
      "把未染色的起點設為 0，以佇列向外擴張。處理邊 u−v 時，若 v 尚未染色，就令 color[v]=1−color[u]。如此 BFS 樹上的每條邊都符合不同色的要求。",
      "若 v 已有顏色，必須檢查是否與 u 相同；相同表示路徑加上此邊形成奇環，任何兩色配置都無法滿足。為每個未染色頂點啟動 BFS 也能涵蓋不連通圖。輸入 n=0 結束，輸出字串的句點不可省略。",
    ],
    complexity: "時間 O(n+l)，空間 O(n+l)。",
    pitfall: "不能只檢查新走訪的邊；連回已染色頂點的邊才可能揭露衝突。",
    traceLabel: "示意：三角形 0−1−2−0",
    trace: [
      {
        title: "起點",
        description: "指定 0 為顏色 0。",
        cells: ["0:0", "1:-1", "2:-1"],
        active: [0],
        variables: [["queue", "[0]"]],
      },
      {
        title: "擴張",
        description: "0 的兩鄰居都須是顏色 1。",
        cells: ["0:0", "1:1", "2:1"],
        active: [1, 2],
        variables: [["queue", "[1,2]"]],
      },
      {
        title: "衝突",
        description: "邊 1−2 兩端同為 1，無法二著色。",
        cells: ["0:0", "1:1", "2:1"],
        active: [1, 2],
        variables: [["可行", "0"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <queue>
using namespace std;
int main() {
    int n, m;
    while (cin >> n && n) {
        cin >> m;
        vector<vector<int>> g(n);
        while (m--) {
            int u, v;
            cin >> u >> v;
            g[u].push_back(v);
            g[v].push_back(u);
        }
        vector<int> color(n, -1);
        bool ok = true;
        for (int s = 0; s < n; s++)
            if (color[s] < 0) {
                queue<int> q;
                q.push(s);
                color[s] = 0;
                while (!q.empty()) {
                    int u = q.front();
                    q.pop();
                    for (int v : g[u]) {
                        if (color[v] < 0) {
                            color[v] = 1 - color[u];
                            q.push(v);
                        } else if (color[v] == color[u])
                            ok = false;
                    }
                }
            }
        cout << (ok ? "BICOLORABLE." : "NOT BICOLORABLE.") << '\n';
    }
}`,
    python: String.raw`import sys
from collections import deque

it = iter(map(int, sys.stdin.buffer.read().split()))
for n in it:
    if n == 0:
        break
    g = [[] for _ in range(n)]
    for _ in range(next(it)):
        u, v = next(it), next(it)
        g[u].append(v)
        g[v].append(u)
    color = [-1] * n
    ok = True
    for s in range(n):
        if color[s] != -1:
            continue
        color[s] = 0
        q = deque([s])
        while q:
            u = q.popleft()
            for v in g[u]:
                if color[v] == -1:
                    color[v] = 1 - color[u]
                    q.append(v)
                elif color[v] == color[u]:
                    ok = False
    print('BICOLORABLE.' if ok else 'NOT BICOLORABLE.')
`,
  }),
  defineCpeLesson("a654", {
    topic: "simulation",
    level: "easy",
    concept: "免費格與首次完成連線的狀態模擬",
    goal: "依公告順序標記棋盤，記住第一個勝利時刻。",
    explanation: [
      "用 5×5 布林陣列記錄標記狀態，中央一開始為真。讀卡片時遇到中央不要讀數字，因為輸入只提供 24 個數。每次公告若數字在卡片上，就將對應格設為真。",
      "每次標記後檢查五橫列、五直欄與兩條主對角線，只要任一組全真即獲勝。標記只會增加，第一次成功的公告序號就是答案。找到答案後仍必須讀完 75 個公告，否則下一張卡片會錯位；輸出固定句子且沒有句點。",
    ],
    complexity: "每局 75 次固定大小檢查，時間 O(75·25)，空間 O(25)。",
    pitfall: "公告數計入未出現在卡片上的號碼；中央免費不算一次公告。",
    traceLabel: "示意：中央列為 3,18,免費,48,63，其餘公告不連線",
    trace: [
      {
        title: "前兩次",
        description: "先叫 3、18，中央列已標記三格。",
        cells: ["3✓", "18✓", "免費✓", "48", "63"],
        active: [0, 1, 2],
        variables: [
          ["k", "2"],
          ["列標記數", "3"],
        ],
      },
      {
        title: "第三次",
        description: "叫 48，尚缺 63。",
        cells: ["3✓", "18✓", "免費✓", "48✓", "63"],
        active: [3],
        variables: [
          ["k", "3"],
          ["列標記數", "4"],
        ],
      },
      {
        title: "第四次",
        description: "叫 63，首次完成中央橫列。",
        cells: ["3✓", "18✓", "免費✓", "48✓", "63✓"],
        active: [4],
        variables: [["答案", "4"]],
      },
    ],
    cpp: String.raw`#include <iostream>
using namespace std;
int main() {
    int tests;
    cin >> tests;
    while (tests--) {
        int a[5][5] = {};
        bool mark[5][5] = {};
        mark[2][2] = true;
        for (int r = 0; r < 5; r++)
            for (int c = 0; c < 5; c++)
                if (r != 2 || c != 2)
                    cin >> a[r][c];
        int answer = 0;
        for (int k = 1; k <= 75; k++) {
            int x;
            cin >> x;
            for (int r = 0; r < 5; r++)
                for (int c = 0; c < 5; c++)
                    if (a[r][c] == x)
                        mark[r][c] = true;
            bool win = false, d1 = true, d2 = true;
            for (int r = 0; r < 5; r++) {
                bool row = true, col = true;
                for (int c = 0; c < 5; c++) {
                    row &= mark[r][c];
                    col &= mark[c][r];
                }
                win |= row || col;
                d1 &= mark[r][r];
                d2 &= mark[r][4 - r];
            }
            if (!answer && (win || d1 || d2))
                answer = k;
        }
        cout << "BINGO after " << answer << " numbers announced\n";
    }
}`,
    python: String.raw`import sys

it = iter(map(int, sys.stdin.buffer.read().split()))
for _ in range(next(it)):
    pos = {}
    mark = [[False] * 5 for _ in range(5)]
    mark[2][2] = True
    for r in range(5):
        for c in range(5):
            if (r, c) != (2, 2):
                pos[next(it)] = (r, c)
    answer = 0
    for k in range(1, 76):
        x = next(it)
        if x in pos:
            r, c = pos[x]
            mark[r][c] = True
        win = any(all(row) for row in mark)
        win |= any(all(mark[r][c] for r in range(5)) for c in range(5))
        win |= all(mark[i][i] for i in range(5))
        win |= all(mark[i][4 - i] for i in range(5))
        if win and answer == 0:
            answer = k
    print(f'BINGO after {answer} numbers announced')
`,
  }),
  defineCpeLesson("a655", {
    topic: "trees",
    level: "medium",
    concept: "逆序數決定遊戲步數的奇偶",
    goal: "用 Fenwick tree 計算逆序數，消除看似需要博弈搜尋的選擇。",
    explanation: [
      "一次合法操作只交換相鄰的 a>b。這一對逆序消失，它們與其他元素的相對順序不變，所以逆序數恰減 1。終局排序序列逆序數為 0，因此不管怎麼選，操作總數都等於起始逆序數。奇數步由先手 Marcelo 下最後一步，偶數步則由 Carlos 獲勝。",
      "由左到右讀排列，Fenwick tree 記錄已出現值的次數。已讀 i 個數時，新值 x 產生 i−prefix(x) 個逆序，再將 x 的計數加 1。N 可達十萬，不能真的泡沫排序；逆序總數最多 N(N−1)/2，C++ 需 long long。讀到 N=0 結束。",
    ],
    complexity: "時間 O(N log N)，空間 O(N)。",
    pitfall: "排序完成時是輪到的人輸；零次操作時先手輸。",
    traceLabel: "示意：排列 3,1,2",
    trace: [
      {
        title: "讀 3",
        description: "左側尚無數，新增 0 個逆序。",
        cells: ["3", "1", "2"],
        active: [0],
        variables: [
          ["i", "0"],
          ["逆序", "0"],
        ],
      },
      {
        title: "讀 1",
        description: "左側的 3 大於 1，新增 1。",
        cells: ["3", "1", "2"],
        active: [1],
        variables: [
          ["prefix(1)", "0"],
          ["逆序", "1"],
        ],
      },
      {
        title: "讀 2",
        description: "左側只有 3 大於 2，總共 2 步。",
        cells: ["3", "1", "2"],
        active: [2],
        variables: [
          ["逆序", "2"],
          ["贏家", "Carlos"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
using namespace std;
int main() {
    int n;
    while (cin >> n && n) {
        vector<int> bit(n + 1);
        long long inversions = 0;
        for (int i = 0; i < n; i++) {
            int x;
            cin >> x;
            int count = 0;
            for (int j = x; j > 0; j -= j & -j)
                count += bit[j];
            inversions += i - count;
            for (int j = x; j <= n; j += j & -j)
                bit[j]++;
        }
        cout << (inversions % 2 ? "Marcelo" : "Carlos") << '\n';
    }
}`,
    python: String.raw`import sys

it = iter(map(int, sys.stdin.buffer.read().split()))
for n in it:
    if n == 0:
        break
    bit = [0] * (n + 1)
    inversions = 0
    for i in range(n):
        x = next(it)
        count = 0
        j = x
        while j:
            count += bit[j]
            j -= j & -j
        inversions += i - count
        j = x
        while j <= n:
            bit[j] += 1
            j += j & -j
    print('Marcelo' if inversions % 2 else 'Carlos')
`,
  }),
  defineCpeLesson("a656", {
    topic: "graphs",
    level: "hard",
    concept: "拆點最大流求最小頂點割",
    goal: "以容量 1 限制可刪除的站，求網路的頂點連通度。",
    explanation: [
      "若圖不是完全圖，任何造成不連通的刪站集合都會留下某兩個不相鄰的 s,t。反過來，分隔這樣的 s,t 的最小頂點割也會使圖不連通。因此枚舉不相鄰點對，取最小 s−t 頂點割；完全圖無法留下不連通的網路，依題意答案為 n。",
      "把每個 v 拆成 vin→vout，容量設 1，原本雙向道路改為兩條容量 n 的有向邊。從 sout 流到 tin，便不會刪除端點。最大流最小割定理使流量等於最少刪除的中間站數。Dinic 用層次 BFS 與阻塞流加速，達目前最小答案即可停止該次流；若某對流量為 0，原圖已不連通。讀至 EOF，0 0 是空圖，仍輸出 0。",
    ],
    complexity:
      "最多 O(n²) 次 Dinic；一般上界 O(n⁴(n+m))，每次網路空間 O(n+m)，n≤50。",
    pitfall:
      "不可對相鄰點直接算頂點割：連接端點的邊無法透過刪中間站切斷。括號逗號須當分隔符解析。",
    traceLabel: "示意：四站環 0−1−2−3−0",
    trace: [
      {
        title: "選端點",
        description: "0 與 2 不相鄰，站 1、3 容量各為 1。",
        cells: ["s=0", "1:1", "3:1", "t=2"],
        active: [1, 2],
        variables: [["flow", "0"]],
      },
      {
        title: "第一條路",
        description: "經 0→1→2 送出一單位。",
        cells: ["0", "1:剩0", "3:剩1", "2"],
        active: [1],
        variables: [["flow", "1"]],
      },
      {
        title: "第二條路",
        description: "再經 3 送出一單位，必須刪兩站才能分隔。",
        cells: ["0", "1:剩0", "3:剩0", "2"],
        active: [2],
        variables: [
          ["flow", "2"],
          ["答案", "2"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <queue>
#include <algorithm>
using namespace std;
struct Edge {
    int to, rev, cap;
};
struct Dinic {
    vector<vector<Edge>> g;
    vector<int> level, at;
    Dinic(int n) : g(n), level(n), at(n) {}
    void add(int u, int v, int c) {
        int a = g[u].size(), b = g[v].size();
        g[u].push_back({v, b, c});
        g[v].push_back({u, a, 0});
    }
    int dfs(int u, int t, int f) {
        if (u == t)
            return f;
        for (int &i = at[u]; i < (int)g[u].size(); i++) {
            Edge &e = g[u][i];
            if (e.cap && level[e.to] == level[u] + 1) {
                int got = dfs(e.to, t, min(f, e.cap));
                if (got) {
                    e.cap -= got;
                    g[e.to][e.rev].cap += got;
                    return got;
                }
            }
        }
        return 0;
    }
    int flow(int s, int t, int limit) {
        int total = 0;
        while (total < limit) {
            fill(level.begin(), level.end(), -1);
            queue<int> q;
            level[s] = 0;
            q.push(s);
            while (!q.empty()) {
                int u = q.front();
                q.pop();
                for (auto e : g[u])
                    if (e.cap && level[e.to] < 0) {
                        level[e.to] = level[u] + 1;
                        q.push(e.to);
                    }
            }
            if (level[t] < 0)
                break;
            fill(at.begin(), at.end(), 0);
            while (total < limit) {
                int f = dfs(s, t, limit - total);
                if (!f)
                    break;
                total += f;
            }
        }
        return total;
    }
};
int main() {
    int n, m;
    while (cin >> n >> m) {
        vector<pair<int, int>> edges;
        vector<vector<bool>> adj(n, vector<bool>(n));
        for (int i = 0; i < m; i++) {
            char ch;
            int u, v;
            cin >> ch >> u >> ch >> v >> ch;
            edges.push_back({u, v});
            adj[u][v] = adj[v][u] = true;
        }
        int answer = n;
        for (int s = 0; s < n && answer; s++)
            for (int t = s + 1; t < n && answer; t++)
                if (!adj[s][t]) {
                    Dinic d(2 * n);
                    for (int v = 0; v < n; v++)
                        d.add(2 * v, 2 * v + 1, 1);
                    for (auto [u, v] : edges) {
                        d.add(2 * u + 1, 2 * v, n);
                        d.add(2 * v + 1, 2 * u, n);
                    }
                    answer = min(answer, d.flow(2 * s + 1, 2 * t, answer));
                }
        cout << answer << '\n';
    }
}`,
    python: String.raw`import sys, re
from collections import deque

sys.setrecursionlimit(10000)


def min_cut(n, edges, s, t, limit):
    g = [[] for _ in range(2 * n)]

    def add(u, v, c):
        a, b = len(g[u]), len(g[v])
        g[u].append([v, b, c])
        g[v].append([u, a, 0])

    for v in range(n):
        add(2 * v, 2 * v + 1, 1)
    for u, v in edges:
        add(2 * u + 1, 2 * v, n)
        add(2 * v + 1, 2 * u, n)
    s, t = 2 * s + 1, 2 * t
    total = 0
    while total < limit:
        level = [-1] * (2 * n)
        level[s] = 0
        q = deque([s])
        while q:
            u = q.popleft()
            for v, rev, cap in g[u]:
                if cap and level[v] < 0:
                    level[v] = level[u] + 1
                    q.append(v)
        if level[t] < 0:
            break
        at = [0] * (2 * n)

        def dfs(u, f):
            if u == t:
                return f
            while at[u] < len(g[u]):
                e = g[u][at[u]]
                v, rev, cap = e
                if cap and level[v] == level[u] + 1:
                    got = dfs(v, min(f, cap))
                    if got:
                        e[2] -= got
                        g[v][rev][2] += got
                        return got
                at[u] += 1
            return 0

        while total < limit:
            f = dfs(s, limit - total)
            if not f:
                break
            total += f
    return total


it = iter(map(int, re.findall(rb'\d+', sys.stdin.buffer.read())))
for n in it:
    m = next(it)
    edges = [(next(it), next(it)) for _ in range(m)]
    adj = {tuple(sorted(e)) for e in edges}
    answer = n
    for s in range(n):
        for t in range(s + 1, n):
            if answer and (s, t) not in adj:
                answer = min(answer, min_cut(n, edges, s, t, answer))
    print(answer)
`,
  }),
  defineCpeLesson("a657", {
    topic: "math",
    level: "easy",
    concept: "前 k 個奇數和為 k²",
    goal: "把閉區間奇數和轉為兩個前綴和相減。",
    explanation: [
      "1+3+…+(2k−1)=k²。對非負 x，1 到 x 共有 floor((x+1)/2) 個奇數，因此奇數前綴和是 floor((x+1)/2)²，不需要逐個檢查奇偶。",
      "閉區間 [a,b] 的答案為 F(b)−F(a−1)。代入可得到 ((b+1)//2)²−(a//2)²，a=0 時也自然成立。依第一個 T 讀取兩端點，不依賴換行位置；輸出 Case k: S，編號從 1 開始。",
    ],
    complexity: "每筆時間 O(1)，額外空間 O(1)。",
    pitfall: "減掉的是 a 之前的奇數和，不能減 F(a) 而漏掉奇數左端點。",
    traceLabel: "示意：區間 [3,9]",
    trace: [
      {
        title: "右側前綴",
        description: "到 9 共五個奇數，總和 25。",
        cells: ["1", "3", "5", "7", "9"],
        active: [0, 1, 2, 3, 4],
        variables: [["F(9)", "25"]],
      },
      {
        title: "左側前綴",
        description: "3 之前只有奇數 1。",
        cells: ["1", "3", "5", "7", "9"],
        active: [0],
        variables: [["F(2)", "1"]],
      },
      {
        title: "相減",
        description: "25−1=24，即 3+5+7+9。",
        cells: ["3", "5", "7", "9", "24"],
        active: [4],
        variables: [["答案", "24"]],
      },
    ],
    cpp: String.raw`#include <iostream>
using namespace std;
int main() {
    int t;
    cin >> t;
    for (int k = 1; k <= t; k++) {
        long long a, b;
        cin >> a >> b;
        long long r = (b + 1) / 2, l = a / 2;
        cout << "Case " << k << ": " << r * r - l * l << '\n';
    }
}`,
    python: String.raw`import sys

it = iter(map(int, sys.stdin.buffer.read().split()))
for k in range(1, next(it) + 1):
    a, b = next(it), next(it)
    print(f'Case {k}: {((b + 1) // 2) ** 2 - (a // 2) ** 2}')
`,
  }),
  defineCpeLesson("a658", {
    topic: "number-theory",
    level: "hard",
    concept: "逐位高低段分析與零的前導修正",
    goal: "在 O(log b) 時間計算整段數字出現次數。",
    explanation: [
      "先定義 F(x) 為 1 到 x 的十個數字計數。枚舉位值 p=1,10,100,…，拆出 high=x//(10p)、cur=x//p%10、low=x%p。對非零數字 d，每個完整循環提供 high·p 次；cur>d 再加 p，cur=d 再加 low+1。這等於依高位分組，計算目前位能固定為 d 的數量。",
      "0 不可當前導位，所以 high>0 時基底改為 (high−1)p，然後依 cur 是否為 0 補 low+1 或 p；high=0 的這一位完全不貢獻 0。先排序端點，再輸出 F(b)−F(a−1)。輸入正數範圍不含整數 0，0 0 是終止標記。",
    ],
    complexity: "每筆時間 O(10 log b)，空間 O(10)。",
    pitfall: "把 1 寫成 00000001 會多計大量 0；F(0) 必須回傳全零。",
    traceLabel: "示意：統計 1 到 13",
    trace: [
      {
        title: "個位",
        description: "high=1,cur=3,low=0；個位的 1 出現於 1、11。",
        cells: ["p=1", "high=1", "cur=3", "low=0"],
        active: [0, 2],
        variables: [
          ["個位1", "2"],
          ["個位0", "1"],
        ],
      },
      {
        title: "十位",
        description: "high=0,cur=1,low=3，十位的 1 有四次，0 不計。",
        cells: ["10", "11", "12", "13"],
        active: [0, 1, 2, 3],
        variables: [
          ["十位1", "4"],
          ["十位0", "0"],
        ],
      },
      {
        title: "合併",
        description: "數字 1 共 6 次，0 共 1 次。",
        cells: ["0:1", "1:6", "2:2", "3:2", "4～9:各1"],
        active: [0, 1],
        variables: [["總字元數", "17"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <array>
#include <algorithm>
using namespace std;
array<long long, 10> count_digits(long long x) {
    array<long long, 10> a{};
    for (long long p = 1; p <= x; p *= 10) {
        long long h = x / (p * 10), c = x / p % 10, l = x % p;
        for (int d = 1; d <= 9; d++)
            a[d] += h * p + (c > d ? p : (c == d ? l + 1 : 0));
        if (h)
            a[0] += (h - 1) * p + (c == 0 ? l + 1 : p);
    }
    return a;
}
int main() {
    long long a, b;
    while (cin >> a >> b && (a || b)) {
        if (a > b)
            swap(a, b);
        auto r = count_digits(b), l = count_digits(a - 1);
        for (int d = 0; d < 10; d++)
            cout << (d ? " " : "") << r[d] - l[d];
        cout << '\n';
    }
}`,
    python: String.raw`import sys


def count_digits(x):
    a = [0] * 10
    p = 1
    while p <= x:
        h, c, low = x // (10 * p), x // p % 10, x % p
        for d in range(1, 10):
            a[d] += h * p + (p if c > d else low + 1 if c == d else 0)
        if h:
            a[0] += (h - 1) * p + (low + 1 if c == 0 else p)
        p *= 10
    return a


it = iter(map(int, sys.stdin.buffer.read().split()))
for a, b in zip(it, it):
    if a == b == 0:
        break
    a, b = sorted((a, b))
    left, right = count_digits(a - 1), count_digits(b)
    print(*(right[d] - left[d] for d in range(10)))
`,
  }),
  defineCpeLesson("a659", {
    topic: "combinatorics",
    level: "medium",
    concept: "固定最大邊，累加新增三角形",
    goal: "由三角不等式推導每個最大邊的貢獻。",
    explanation: [
      "每組邊長唯一寫成 a<b<c。固定最大邊 c 後，只需 a+b>c；對每個 b，a 從 c−b+1 到 b−1，合法數為 max(0,2b−c−1)。依 b 加總形成 1,3,5,… 或 2,4,6,… 的級數。",
      "將級數化簡，最大邊 c 的新增數量為 floor((c−2)²/4)。因此 answer[c]=answer[c−1]+floor((c−2)²/4)，先讀完直到 n<3 的查詢，再預算到最大 n。所有三邊互異，等號 a+b=c 是退化形必須排除；答案用 64 位元。",
    ],
    complexity: "最大查詢 K：預處理時間與空間 O(K)，每次查詢 O(1)。",
    pitfall: "不是任選三根都成三角形；c 的平方運算也要先升為 64 位元。",
    traceLabel: "示意：n=5",
    trace: [
      {
        title: "最大邊 3",
        description: "1+2=3，沒有非退化三角形。",
        cells: ["1", "2", "3"],
        active: [2],
        variables: [
          ["新增", "0"],
          ["累計", "0"],
        ],
      },
      {
        title: "最大邊 4",
        description: "只有 (2,3,4)，新增 1。",
        cells: ["2", "3", "4"],
        active: [0, 1, 2],
        variables: [
          ["新增", "1"],
          ["累計", "1"],
        ],
      },
      {
        title: "最大邊 5",
        description: "(2,4,5)、(3,4,5)，新增 2。",
        cells: ["2,4,5", "3,4,5", "總數3"],
        active: [2],
        variables: [
          ["新增", "2"],
          ["累計", "3"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;
int main() {
    vector<int> queries;
    int n, limit = 2;
    while (cin >> n && n >= 3) {
        queries.push_back(n);
        limit = max(limit, n);
    }
    vector<long long> answer(limit + 1);
    for (long long c = 3; c <= limit; c++)
        answer[c] = answer[c - 1] + (c - 2) * (c - 2) / 4;
    for (int x : queries)
        cout << answer[x] << '\n';
}`,
    python: String.raw`import sys

queries = []
for n in map(int, sys.stdin.buffer.read().split()):
    if n < 3:
        break
    queries.append(n)
answer = [0] * (max(queries, default=2) + 1)
for c in range(3, len(answer)):
    answer[c] = answer[c - 1] + (c - 2) ** 2 // 4
for n in queries:
    print(answer[n])
`,
  }),
  defineCpeLesson("a660", {
    topic: "math",
    level: "medium",
    concept: "平方層邊界與奇偶座標交換",
    goal: "不模擬逐秒行走，直接定位所在正方形層。",
    explanation: [
      "第 k 層涵蓋 (k−1)²+1 到 k²，故 k=ceil(sqrt(N))。這層拐角在 t=k²−k+1，兩座標都為 k。先按偶數層規則計算：N≤t 時位置為 (N−(k−1)²,k)，N>t 時為 (k,k²−N+1)。",
      "奇數層的行走方向與偶數層對稱，只要交換上述 x,y。以整數平方比較校正平方根，就能避免完全平方數附近誤差。N 最大二十億，平方與中間值用 64 位元；讀到 0 停止，每行只輸出 x y。",
    ],
    complexity: "每筆時間 O(1)，空間 O(1)；整數平方根亦可用 O(log N)。",
    pitfall: "x 是欄、y 是列；奇數層必須交換兩軸。",
    traceLabel: "示意：第 3 層的 5、7、9",
    trace: [
      {
        title: "層起點",
        description: "N=5，k=3；先得 (1,3)，奇數層交換成 (3,1)。",
        cells: ["N=5", "k=3", "(3,1)"],
        active: [2],
        variables: [
          ["t", "7"],
          ["N−4", "1"],
        ],
      },
      {
        title: "拐角",
        description: "N=7，兩座標皆為 3。",
        cells: ["N=7", "k=3", "(3,3)"],
        active: [2],
        variables: [["t", "7"]],
      },
      {
        title: "層終點",
        description: "N=9，位於 (1,3)，符合 3×3 平方層終點。",
        cells: ["N=9", "k=3", "(1,3)"],
        active: [2],
        variables: [["k²−N+1", "1"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <cmath>
#include <algorithm>
using namespace std;
int main() {
    long long n;
    while (cin >> n && n) {
        long long k = sqrt((long double)n);
        while (k * k < n)
            ++k;
        long long x, y, t = k * k - k + 1;
        if (n <= t) {
            x = n - (k - 1) * (k - 1);
            y = k;
        } else {
            x = k;
            y = k * k - n + 1;
        }
        if (k % 2)
            swap(x, y);
        cout << x << ' ' << y << '\n';
    }
}`,
    python: String.raw`import sys
from math import isqrt

for n in map(int, sys.stdin.buffer.read().split()):
    if n == 0:
        break
    k = isqrt(n - 1) + 1
    t = k * k - k + 1
    if n <= t:
        x, y = n - (k - 1) ** 2, k
    else:
        x, y = k, k * k - n + 1
    if k % 2:
        x, y = y, x
    print(x, y)
`,
  }),
  defineCpeLesson("a661", {
    topic: "trees",
    level: "easy",
    concept: "佇列的刪除與循環移動",
    goal: "用先進先出的容器直接表達牌堆操作。",
    explanation: [
      "佇列由前到後就是牌堆由上到下。每回合先取出隊首記入丟牌清單，再把新的隊首移到隊尾，這兩個操作恰好對應題目的兩個動作。牌堆剩至少兩張時才進行完整回合。",
      "每回合少一張牌，所以一定在 n−1 回合後留下最後一張。用逗號加空白連接丟牌清單，避免尾端多逗號；n=1 時清單為空，第一行只有 Discarded cards:，冒號後不能留下空白。輸入以 0 結束。",
    ],
    complexity: "時間 O(n)，空間 O(n)。",
    pitfall: "移到底端的牌沒有被丟掉，不能把兩個隊首都加入丟牌清單。",
    traceLabel: "示意：n=4",
    trace: [
      {
        title: "第一回合",
        description: "丟 1，把 2 移到底端。",
        cells: ["3", "4", "2"],
        active: [0],
        variables: [["已丟", "1"]],
      },
      {
        title: "第二回合",
        description: "丟 3，把 4 移到底端。",
        cells: ["2", "4"],
        active: [0],
        variables: [["已丟", "1,3"]],
      },
      {
        title: "第三回合",
        description: "丟 2，只剩 4，移動後仍為 4。",
        cells: ["4"],
        active: [0],
        variables: [
          ["已丟", "1,3,2"],
          ["剩下", "4"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <queue>
#include <vector>
using namespace std;
int main() {
    int n;
    while (cin >> n && n) {
        queue<int> q;
        vector<int> discarded;
        for (int i = 1; i <= n; i++)
            q.push(i);
        while (q.size() > 1) {
            discarded.push_back(q.front());
            q.pop();
            int x = q.front();
            q.pop();
            q.push(x);
        }
        cout << "Discarded cards:";
        for (int i = 0; i < (int)discarded.size(); i++)
            cout << (i ? ", " : " ") << discarded[i];
        cout << "\nRemaining card: " << q.front() << '\n';
    }
}`,
    python: String.raw`import sys
from collections import deque

for n in map(int, sys.stdin.buffer.read().split()):
    if n == 0:
        break
    q = deque(range(1, n + 1))
    discarded = []
    while len(q) > 1:
        discarded.append(str(q.popleft()))
        q.append(q.popleft())
    print('Discarded cards:' + (' ' + ', '.join(discarded) if discarded else ''))
    print(f'Remaining card: {q[0]}')
`,
  }),
  defineCpeLesson("a662", {
    topic: "sorting",
    level: "hard",
    concept: "高位優先的可行前綴貪心",
    goal: "同時滿足區間限制、最大 OR 與最小遮罩。",
    explanation: [
      "由第 31 位向低位決定 M，高位 OR 的收益大於所有低位總和。若 N 此位為 0，優先把 M 此位設 1，只要目前前綴加該位不超過 U；若連所有低位設 0 都超過 U，就只能設 0。此前綴始終保留至少一種區間內完成方式。",
      "若 N 此位為 1，OR 已是 1，應優先讓 M 此位為 0 以取得最小 M。但若目前前綴加上所有較低位（bit−1）仍小於 L，這位就被下界強迫設 1。如此每步在維持可行性下選最優高位；到第 0 位得到唯一的最小最佳解。輸入直到 EOF，C++ 用 64 位元無號數承接 1ULL<<31。",
    ],
    complexity: "每筆時間 O(32)，空間 O(1)。",
    pitfall: "N 的 1 位也可能被 L 強迫選 1；不能直接取 (~N)&U。",
    traceLabel: "示意：N=5(101)，L=2，U=6",
    trace: [
      {
        title: "位 2",
        description: "N 的此位為 1；低位最大 3≥L，M 此位取 0。",
        cells: ["N=101", "M=0??", "L=010", "U=110"],
        active: [1],
        variables: [["M", "0"]],
      },
      {
        title: "位 1",
        description: "N 的此位為 0，設 1 後 M=2≤6。",
        cells: ["N=101", "M=01?", "OR=111"],
        active: [1],
        variables: [["M", "2"]],
      },
      {
        title: "位 0",
        description: "N 已有 1，M 取 0 仍達下界，答案 2。",
        cells: ["N=101", "M=010", "OR=111"],
        active: [1, 2],
        variables: [
          ["M", "2"],
          ["最大OR", "7"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
using namespace std;
int main() {
    unsigned long long n, l, u;
    while (cin >> n >> l >> u) {
        unsigned long long m = 0;
        for (int i = 31; i >= 0; i--) {
            unsigned long long bit = 1ULL << i;
            if (!(n & bit)) {
                if ((m | bit) <= u)
                    m |= bit;
            } else if (m + bit - 1 < l)
                m |= bit;
        }
        cout << m << '\n';
    }
}`,
    python: String.raw`import sys

it = iter(map(int, sys.stdin.buffer.read().split()))
for n, low, high in zip(it, it, it):
    mask = 0
    for i in range(31, -1, -1):
        bit = 1 << i
        if not n & bit:
            if mask | bit <= high:
                mask |= bit
        elif mask + bit - 1 < low:
            mask |= bit
    print(mask)
`,
  }),
  defineCpeLesson("a663", {
    topic: "math",
    level: "medium",
    concept: "整數美分與上下平均界限",
    goal: "處理不能整除的平均費用，求最少移轉金額。",
    explanation: [
      "把美元字串拆成整數美分，總和為 S，平均下界 lo=S//n，上界 hi=ceil(S/n)。每人的最終負擔可設為 lo 或 hi，其中 S%n 人負擔 hi，其餘負擔 lo。原本付不到 lo 的人，至少還須支付 need=sum(max(0,lo−x))；原本付超過 hi 的人，至少應獲補償 give=sum(max(0,x−hi))。金錢由少付者轉給多付者，讓少付者的負擔增加、多付者的負擔減少。",
      "最少移轉是 max(need,give)。因為兩者都是必要下界，而將較高目標 hi 優先給原本花費較多者，即可在不增加往返轉交的情況下達到較大的下界。若直接把平均四捨五入，可能多收或少收幾美分。讀 n=0 結束，以 $ 加兩位小數輸出。",
    ],
    complexity: "每筆時間 O(n)，空間 O(n)。",
    pitfall:
      "不能用浮點數乘 100 後直接截斷；例如某些十進位小數的二進位表示略小。",
    traceLabel: "示意：15.00、15.01、3.00、3.01 美元",
    trace: [
      {
        title: "美分總和",
        description: "四人合計 3602 美分。",
        cells: ["1500", "1501", "300", "301"],
        active: [0, 1, 2, 3],
        variables: [
          ["S", "3602"],
          ["n", "4"],
        ],
      },
      {
        title: "平均邊界",
        description: "每人的最終負擔為 900 或 901 美分；不是手上剩餘的現金。",
        cells: ["lo=900", "hi=901"],
        active: [0, 1],
        variables: [
          ["need", "1199"],
          ["give", "1199"],
        ],
      },
      {
        title: "最少轉交",
        description:
          "由少付者補款給多付者，共 1199 美分。原付 300、301 的人分別再付 600、599，原付 1500、1501 的人分別收回 599、600；圖中顯示最終負擔。",
        cells: ["901", "901", "900", "900"],
        active: [2, 3],
        variables: [
          ["再付（原付300）", "600"],
          ["再付（原付301）", "599"],
          ["收回（原付1500）", "599"],
          ["收回（原付1501）", "600"],
          ["答案", "$11.99"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <string>
#include <iomanip>
#include <algorithm>
using namespace std;
int main() {
    int n;
    while (cin >> n && n) {
        vector<long long> a(n);
        long long sum = 0;
        for (auto &x : a) {
            string s;
            cin >> s;
            auto p = s.find('.');
            x = stoll(s.substr(0, p)) * 100 + stoll(s.substr(p + 1));
            sum += x;
        }
        long long lo = sum / n, hi = (sum + n - 1) / n, need = 0, give = 0;
        for (auto x : a) {
            need += max(0LL, lo - x);
            give += max(0LL, x - hi);
        }
        long long answer = max(need, give);
        cout << '$' << answer / 100 << '.' << setw(2) << setfill('0') << answer % 100 << '\n';
    }
}`,
    python: String.raw`import sys

it = iter(sys.stdin.buffer.read().split())
for token in it:
    n = int(token)
    if n == 0:
        break
    a = []
    for _ in range(n):
        dollars, cents = next(it).split(b'.')
        a.append(int(dollars) * 100 + int(cents))
    total = sum(a)
    low, high = total // n, (total + n - 1) // n
    need = sum(max(0, low - x) for x in a)
    give = sum(max(0, x - high) for x in a)
    answer = max(need, give)
    print('$' + f'{answer // 100}.{answer % 100:02d}')
`,
  }),
  defineCpeLesson("a664", {
    topic: "dp",
    level: "hard",
    concept: "唯一元素 LCS 轉為 LIS",
    goal: "利用路徑不重複格子的性質，避開平方級 LCS。",
    explanation: [
      "將王子路徑的每個格子映射到它的出現位置 pos。依公主路徑順序掃描，只保留王子也走過的格子，換成 pos 序列。共同子序列必須在兩路徑中保持順序，因此恰好對應這串位置的嚴格遞增子序列。唯一格子的條件讓這個映射不會有重複匹配歧義。",
      "用 tails[k] 保存長度 k+1 遞增子序列的最小結尾。對每個位置 x，二分找到第一個 ≥x 的尾端並取代，或接在最尾端；較小尾端永遠不會降低後續延伸能力。tails 的長度就是答案，起終點和其他格子同樣計數。每筆實際讀 p+1、q+1 個格子，輸出 Case k: L。",
    ],
    complexity:
      "時間 O(n²+(p+q)log(p+1))，陣列映射空間 O(n²+p)；Python 字典映射空間 O(p)。",
    pitfall: "p、q 是跳躍次數而非格子數；不可直接對原本格子編號求 LIS。",
    traceLabel: "示意：n=2，王子 1,2,4；公主 1,3,2,4",
    trace: [
      {
        title: "位置映射",
        description: "公主的 3 不在王子路徑，轉換後是 0,1,2。",
        cells: ["1→0", "3→略過", "2→1", "4→2"],
        active: [0],
        variables: [["tails", "[0]"]],
      },
      {
        title: "延伸到 2",
        description: "位置 1 大於現有尾端 0。",
        cells: ["0", "1"],
        active: [1],
        variables: [["長度", "2"]],
      },
      {
        title: "保留終點",
        description: "位置 2 再延伸，得到共同路徑 1,2,4。",
        cells: ["0", "1", "2"],
        active: [2],
        variables: [["答案", "3"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;
int main() {
    int tests;
    cin >> tests;
    for (int tc = 1; tc <= tests; tc++) {
        int n, p, q;
        cin >> n >> p >> q;
        vector<int> pos(n * n + 1, -1), tails;
        for (int i = 0; i <= p; i++) {
            int x;
            cin >> x;
            pos[x] = i;
        }
        for (int i = 0; i <= q; i++) {
            int x;
            cin >> x;
            x = pos[x];
            if (x < 0)
                continue;
            auto at = lower_bound(tails.begin(), tails.end(), x);
            if (at == tails.end())
                tails.push_back(x);
            else
                *at = x;
        }
        cout << "Case " << tc << ": " << tails.size() << '\n';
    }
}`,
    python: String.raw`import sys
from bisect import bisect_left

it = iter(map(int, sys.stdin.buffer.read().split()))
for tc in range(1, next(it) + 1):
    n, p, q = next(it), next(it), next(it)
    pos = {next(it): i for i in range(p + 1)}
    tails = []
    for _ in range(q + 1):
        value = next(it)
        if value not in pos:
            continue
        x = pos[value]
        at = bisect_left(tails, x)
        if at == len(tails):
            tails.append(x)
        else:
            tails[at] = x
    print(f'Case {tc}: {len(tails)}')
`,
  }),
  defineCpeLesson("a665", {
    topic: "strings",
    level: "easy",
    concept: "Hamming 距離按欄獨立最佳化",
    goal: "每個位置選最多數字元，同票依字典序決定。",
    explanation: [
      "總 Hamming 距離可以按位置分開相加。若第 j 欄選字元 c，該欄的代價為 m−count[j][c]。所以每欄獨立選出現最多的字元，就能讓所有欄的代價總和最小，完全不必枚舉 4^n 個候選字串。",
      "同票時按 A,C,G,T 的順序檢查，只在次數嚴格更多時更新最佳字元，便保留最小字典序。各欄都採最小的最佳字元，也使整串在所有最優解中字典序最小。每筆輸出代表字串，下一行輸出各欄 m−最高次數之和，沒有額外案例標籤。",
    ],
    complexity: "時間 O(mn)，儲存字串時空間 O(mn)。",
    pitfall: "同票若用 ≥ 更新，會偏向較大的字母而違反字典序要求。",
    traceLabel: "示意：ACGT、ACGA、TCGT、TCGA",
    trace: [
      {
        title: "第一欄",
        description: "A、T 各兩次，選 A，代價 2。",
        cells: ["A:2", "C:0", "G:0", "T:2"],
        active: [0],
        variables: [
          ["前綴", "A"],
          ["距離", "2"],
        ],
      },
      {
        title: "中間兩欄",
        description: "C、G 各全票，沒有新增距離。",
        cells: ["A", "C:4", "G:4"],
        active: [1, 2],
        variables: [
          ["前綴", "ACG"],
          ["距離", "2"],
        ],
      },
      {
        title: "第四欄",
        description: "A、T 再平手，選 A，總距離 4。",
        cells: ["A:2", "T:2", "ACGA"],
        active: [0, 2],
        variables: [["答案距離", "4"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <string>
using namespace std;
int main() {
    int t;
    cin >> t;
    string alphabet = "ACGT";
    while (t--) {
        int m, n;
        cin >> m >> n;
        vector<string> a(m);
        for (auto &s : a)
            cin >> s;
        string answer;
        int distance = 0;
        for (int j = 0; j < n; j++) {
            int count[4] = {};
            for (auto &s : a)
                count[alphabet.find(s[j])]++;
            int best = 0;
            for (int c = 1; c < 4; c++)
                if (count[c] > count[best])
                    best = c;
            answer += alphabet[best];
            distance += m - count[best];
        }
        cout << answer << '\n' << distance << '\n';
    }
}`,
    python: String.raw`import sys

it = iter(sys.stdin.buffer.read().split())
for _ in range(int(next(it))):
    m, n = int(next(it)), int(next(it))
    rows = [next(it).decode() for _ in range(m)]
    answer = []
    distance = 0
    for col in zip(*rows):
        best = min('ACGT', key=lambda c: (-col.count(c), c))
        answer.append(best)
        distance += m - col.count(best)
    print(''.join(answer))
    print(distance)
`,
  }),
  defineCpeLesson("a666", {
    topic: "graphs",
    level: "medium",
    concept: "最大瓶頸路徑與導遊席位",
    goal: "最大化路線最窄道路容量，再以有效座位計算趟數。",
    explanation: [
      "一條路線每趟的載客上限是沿途最小道路容量。要最少趟數，就要找最大瓶頸路徑。將 Dijkstra 的距離改成 best[v]：目前可達 v 的最大瓶頸，延伸 u→v 時候選值為 min(best[u],capacity)，只在更大時更新。",
      "每次固定未處理頂點中 best 最大者，因為其他路徑必須先經過瓶頸不超過它的未處理點，不可能再改善它。得到容量 B 後，導遊每趟占一席，遊客容量為 B−1，答案 ceil(T/(B−1))。來源與目的相同時不需運送，回傳 0；一般運送資料須有可達路線。依規格印 Scenario #k、趟數句子與空白行。",
    ],
    complexity: "此陣列版時間 O(N²+R)，空間 O(N+R)。",
    pitfall:
      "導遊只從瓶頸扣一席。題敘未定義 S≠D 且不可達時的輸出，本解依可運送情境假設存在路徑；平台若納入不可達資料，須先補明輸出規則。",
    traceLabel: "示意：1−2 容量30、2−3 容量20、1−3 容量10，T=38",
    trace: [
      {
        title: "來源",
        description: "從 1 可到 2 的瓶頸 30、到 3 的瓶頸 10。",
        cells: ["1:∞", "2:30", "3:10"],
        active: [0],
        variables: [["T", "38"]],
      },
      {
        title: "經過 2",
        description: "經 2 到 3 的瓶頸 min(30,20)=20，比 10 好。",
        cells: ["1:∞", "2:30", "3:20"],
        active: [1, 2],
        variables: [["B", "20"]],
      },
      {
        title: "計算趟數",
        description: "每趟載 19 位遊客，38 人需 2 趟。",
        cells: ["20−1=19", "38÷19=2"],
        active: [1],
        variables: [["趟數", "2"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <algorithm>
#include <limits>
using namespace std;
int main() {
    int n, r, tc = 0;
    while (cin >> n >> r && (n || r)) {
        vector<vector<pair<int, int>>> g(n);
        while (r--) {
            int u, v, c;
            cin >> u >> v >> c;
            --u;
            --v;
            g[u].push_back({v, c});
            g[v].push_back({u, c});
        }
        int s, t;
        long long tourists;
        cin >> s >> t >> tourists;
        --s;
        --t;
        vector<int> best(n), used(n);
        best[s] = numeric_limits<int>::max();
        for (int i = 0; i < n; i++) {
            int u = -1;
            for (int v = 0; v < n; v++)
                if (!used[v] && (u < 0 || best[v] > best[u]))
                    u = v;
            if (u < 0 || best[u] == 0)
                break;
            used[u] = 1;
            for (auto [v, c] : g[u])
                best[v] = max(best[v], min(best[u], c));
        }
        long long trips = s == t ? 0 : (tourists + best[t] - 2) / (best[t] - 1);
        cout << "Scenario #" << ++tc << "\nMinimum Number of Trips = " << trips << "\n\n";
    }
}`,
    python: String.raw`import sys

it = iter(map(int, sys.stdin.buffer.read().split()))
tc = 0
for n, roads in zip(it, it):
    if n == roads == 0:
        break
    g = [[] for _ in range(n)]
    for _ in range(roads):
        u, v, c = next(it) - 1, next(it) - 1, next(it)
        g[u].append((v, c))
        g[v].append((u, c))
    s, t, tourists = next(it) - 1, next(it) - 1, next(it)
    best = [0] * n
    used = [False] * n
    best[s] = float('inf')
    for _ in range(n):
        u = max((v for v in range(n) if not used[v]), key=lambda v: best[v], default=-1)
        if u < 0 or best[u] == 0:
            break
        used[u] = True
        for v, c in g[u]:
            best[v] = max(best[v], min(best[u], c))
    trips = 0 if s == t else (tourists + best[t] - 2) // (best[t] - 1)
    tc += 1
    print(f'Scenario #{tc}\nMinimum Number of Trips = {trips}\n')
`,
  }),
  defineCpeLesson("a667", {
    topic: "search",
    level: "medium",
    concept: "排序兩數和，二分查詢最近鄰",
    goal: "預算所有不同位置的兩數和，讓每次查詢只檢查相鄰候選。",
    explanation: [
      "列舉 i<j，將 a[i]+a[j] 存成陣列後排序。這個條件保證使用兩個不同元素，不會拿同一格兩次。排序後對查詢 q，二分找到第一個 ≥q 的和，所有更右側數都不會更接近 q。",
      "另一個可能最佳值是該位置左鄰，因為它是所有 <q 的和中最大者。因此只需比較這兩個候選，並處理查詢落在範圍外的情形。題目保證沒有最近答案平手。N=0 結束，每組先印 Case k:，每個查詢句子最後加句點。",
    ],
    complexity: "預處理 O(n² log n)，每個查詢 O(log n)，空間 O(n²)。",
    pitfall: "二分回傳尾端或開頭時，不能直接讀取不存在的鄰居。",
    traceLabel: "示意：集合 3,12,17，查詢 q=27",
    trace: [
      {
        title: "列舉",
        description: "三種不同位置配對得到 15、20、29。",
        cells: ["3+12=15", "3+17=20", "12+17=29"],
        active: [0, 1, 2],
        variables: [["和數量", "3"]],
      },
      {
        title: "二分",
        description: "第一個 ≥27 的和是 29。",
        cells: ["15", "20", "29"],
        active: [2],
        variables: [["右差", "2"]],
      },
      {
        title: "比較左鄰",
        description: "20 與 27 差 7，故取 29。",
        cells: ["20:差7", "29:差2"],
        active: [1],
        variables: [["答案", "29"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <algorithm>
#include <cstdlib>
using namespace std;
int main() {
    int n, tc = 0;
    while (cin >> n && n) {
        vector<long long> a(n), sums;
        for (auto &x : a)
            cin >> x;
        for (int i = 0; i < n; i++)
            for (int j = i + 1; j < n; j++)
                sums.push_back(a[i] + a[j]);
        sort(sums.begin(), sums.end());
        int m;
        cin >> m;
        cout << "Case " << ++tc << ":\n";
        while (m--) {
            long long q;
            cin >> q;
            auto it = lower_bound(sums.begin(), sums.end(), q);
            long long answer = it == sums.end() ? sums.back() : *it;
            if (it != sums.begin() && llabs(*(it - 1) - q) < llabs(answer - q))
                answer = *(it - 1);
            cout << "Closest sum to " << q << " is " << answer << ".\n";
        }
    }
}`,
    python: String.raw`import sys
from bisect import bisect_left

it = iter(map(int, sys.stdin.buffer.read().split()))
tc = 0
for n in it:
    if n == 0:
        break
    a = [next(it) for _ in range(n)]
    sums = sorted(a[i] + a[j] for i in range(n) for j in range(i + 1, n))
    tc += 1
    print(f'Case {tc}:')
    for _ in range(next(it)):
        q = next(it)
        at = bisect_left(sums, q)
        candidates = sums[max(0, at - 1) : min(len(sums), at + 1)]
        answer = min(candidates, key=lambda x: abs(x - q))
        print(f'Closest sum to {q} is {answer}.')
`,
  }),
];
