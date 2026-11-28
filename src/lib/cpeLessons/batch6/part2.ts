import { defineCpeLesson } from "@/lib/cpeLessonBuilder";

export const lessons = [
  defineCpeLesson("a796", {
    topic: "dp",
    level: "medium",
    concept: "金額縮放與不限張數組合",
    goal: "用整數金額計算包含紙鈔的所有組合數。",
    explanation: [
      "所有金額都是 5 分的倍數，除以 5 後上限只有 6000。十一種面額縮為 1、2、4、10、20、40、100、200、400、1000、2000。令 ways[0]=1，逐面額處理並由小到大更新 ways[s]+=ways[s−v]。",
      "處理完某種面額後，ways[s] 就是只用已加入面額的組合數；金額正向更新容許重複使用，面額外迴圈則避免把排列重複計算。先一次預算所有金額，再回答 EOF 前、零金額之前的查詢。金額按十進位小數的位置解析成分：0.5、.5、0.50 都是 50 分，小數不足兩位在右側補零，整數 1 是 100 分。輸出寬度 6 的兩位小數與寬度 17 的方法數，C++ 使用 64 位元整數。",
    ],
    complexity: "A=6000；預處理時間 O(11A)、空間 O(A)，每次查詢 O(1)。",
    pitfall: "金額欄與方法數欄直接相接，不額外插入分隔空格；0.00 是終止標記。",
    traceLabel: "示意：0.20 元，縮為 4 單位",
    trace: [
      {
        title: "只用 5 分",
        description: "只能用四枚 5 分，ways[4]=1。",
        cells: ["1+1+1+1", "1"],
        active: [1],
        variables: [
          ["已加入面額", "1"],
          ["ways[4]", "1"],
        ],
      },
      {
        title: "加入 10 分",
        description: "新增 2+1+1 與 2+2，合計 3 種。",
        cells: ["1+1+1+1", "2+1+1", "2+2"],
        active: [1, 2],
        variables: [["ways[4]", "3"]],
      },
      {
        title: "加入 20 分",
        description: "新增一枚 20 分，總共 4 種。",
        cells: ["4", "ways[4]=4"],
        active: [0, 1],
        variables: [
          ["金額", "0.20"],
          ["答案", "4"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <string>
#include <iomanip>
using namespace std;
int main() {
    vector<long long> ways(6001);
    ways[0] = 1;
    for (int v : {1, 2, 4, 10, 20, 40, 100, 200, 400, 1000, 2000})
        for (int s = v; s <= 6000; ++s)
            ways[s] += ways[s - v];
    string token;
    while (cin >> token) {
        size_t p = token.find('.');
        string whole = token.substr(0, p);
        string fraction = p == string::npos ? "" : token.substr(p + 1);
        if (whole.empty()) whole = "0";
        fraction += "00";
        int cents = stoi(whole) * 100 + 10 * (fraction[0] - '0') + fraction[1] - '0';
        if (!cents)
            break;
        string money =
            to_string(cents / 100) + "." + (cents % 100 < 10 ? "0" : "") + to_string(cents % 100);
        cout << setw(6) << money << setw(17) << ways[cents / 5] << '\n';
    }
}`,
    python: String.raw`import sys

ways = [0] * 6001
ways[0] = 1
for v in (1, 2, 4, 10, 20, 40, 100, 200, 400, 1000, 2000):
    for s in range(v, 6001):
        ways[s] += ways[s - v]
for token in sys.stdin.read().split():
    whole, _, fraction = token.partition('.')
    cents = int(whole or '0') * 100 + int((fraction + '00')[:2])
    if cents == 0:
        break
    money = f'{cents // 100}.{cents % 100:02d}'
    print(f'{money:>6}{ways[cents // 5]:17d}')
`,
  }),
  defineCpeLesson("a797", {
    topic: "simulation",
    level: "medium",
    concept: "跨機器人共享的格點氣味",
    goal: "正確處理轉向、越界忽略與消失停止。",
    explanation: [
      "以 N,E,S,W 的索引 0,1,2,3 表示方向，L 與 R 分別減一、加一取模。F 先算候選座標，若在範圍內就移動；若越界且目前格點有氣味，整條 F 被忽略，位置與朝向都不變。",
      "越界而無氣味時，在目前格點留下氣味、標記 LOST 並停止該機器人的後續指令。氣味集合跨機器人保存，且只記座標，不記朝向。世界範圍含 0 與右上角兩端，所以只有小於 0 或大於上限才算越界。每個機器人的指令用整行讀取，也能接受空指令列；輸入直到 EOF，每個機器人用一行印出最終狀態。",
    ],
    complexity: "總指令數 L，時間 O(L)，氣味空間 O(XY)。",
    pitfall:
      "機器人消失後要輸出越界前座標，不是候選座標；氣味不能在每個機器人開始時清空。",
    traceLabel: "示意：世界 (1,1)，兩台從 (0,1) 朝北",
    trace: [
      {
        title: "第一台前進",
        description: "候選 (0,2) 越界，(0,1) 原本無氣味。",
        cells: ["(0,1)", "(0,2) 越界"],
        active: [1],
        variables: [["氣味數", "0"]],
      },
      {
        title: "第一台消失",
        description: "留在 (0,1) 的最後狀態輸出 LOST，並留下氣味。",
        cells: ["(0,1):氣味", "LOST"],
        active: [0, 1],
        variables: [["氣味數", "1"]],
      },
      {
        title: "第二台執行 FRF",
        description: "F 被氣味忽略，R 轉東，再 F 移到 (1,1)。",
        cells: ["(0,1) N", "(0,1) E", "(1,1) E"],
        active: [2],
        variables: [
          ["LOST", "0"],
          ["x,y", "1,1"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <string>
#include <set>
#include <utility>
using namespace std;
int main() {
    int xmax, ymax;
    if (!(cin >> xmax >> ymax))
        return 0;
    set<pair<int, int>> scent;
    string dirs = "NESW", commands;
    char face;
    int x, y;
    int dx[] = {0, 1, 0, -1}, dy[] = {1, 0, -1, 0};
    string rest;
    while (cin >> x >> y >> face) {
        getline(cin, rest);
        getline(cin, commands);
        int d = int(dirs.find(face));
        bool lost = false;
        for (char cmd : commands) {
            if (cmd == 'L')
                d = (d + 3) % 4;
            else if (cmd == 'R')
                d = (d + 1) % 4;
            else if (cmd == 'F') {
                int nx = x + dx[d], ny = y + dy[d];
                if (nx < 0 || nx > xmax || ny < 0 || ny > ymax) {
                    if (scent.count({x, y}))
                        continue;
                    scent.insert({x, y});
                    lost = true;
                    break;
                }
                x = nx;
                y = ny;
            }
        }
        cout << x << ' ' << y << ' ' << dirs[d] << (lost ? " LOST" : "") << '\n';
    }
}`,
    python: String.raw`import sys

lines = iter(sys.stdin.read().splitlines())
xmax, ymax = map(int, next(lines).split())
scent = set()
dirs = 'NESW'
delta = [(0, 1), (1, 0), (0, -1), (-1, 0)]
for header in lines:
    if not header.strip():
        continue
    sx, sy, face = header.split()
    x, y = int(sx), int(sy)
    d, commands = dirs.index(face), next(lines, '').strip()
    lost = False
    for cmd in commands:
        if cmd == 'L':
            d = (d - 1) % 4
        elif cmd == 'R':
            d = (d + 1) % 4
        elif cmd == 'F':
            nx, ny = x + delta[d][0], y + delta[d][1]
            if not (0 <= nx <= xmax and 0 <= ny <= ymax):
                if (x, y) in scent:
                    continue
                scent.add((x, y))
                lost = True
                break
            x, y = nx, ny
    print(x, y, dirs[d] + (' LOST' if lost else ''))
`,
  }),
  defineCpeLesson("a798", {
    topic: "graphs",
    level: "medium",
    concept: "入度條件與從根可達性",
    goal: "連空圖、重邊、環與不連通分量都能辨認。",
    explanation: [
      "只把出現在邊兩端的編號當作節點。非空樹必須恰有一個入度為 0 的根，其餘每點入度恰為 1；重複輸入同一條邊也會增加入度，不能先用集合去重。空邊集合依題意直接判為樹。",
      "通過入度檢查後，從根沿有向邊走訪，要求所有節點都可達。單靠根與入度條件仍可能漏掉與根分離的環；加入可達性後，任何可達環都會迫使根有入邊或某點有兩個入邊，因此這些條件充分。0 0 結束一筆，負數對結束整份輸入，案例編號從 1 起。",
    ],
    complexity:
      "每筆 C++ 有序 map/set 時間 O((V+E)log(V+1))，Python 雜湊平均 O(V+E)；圖與走訪空間 O(V+E)，Python 另有整份輸入緩衝。",
    pitfall: "邊是有向的；有一個根不代表整張圖連通。",
    traceLabel: "示意：1→2、1→3",
    trace: [
      {
        title: "統計入度",
        description: "節點 1、2、3 的入度分別為 0、1、1。",
        cells: ["1:0", "2:1", "3:1"],
        active: [0, 1, 2],
        variables: [["根數", "1"]],
      },
      {
        title: "從根展開",
        description: "由 1 走到 2 與 3。",
        cells: ["1", "2", "3"],
        active: [1, 2],
        variables: [
          ["已到達", "3"],
          ["V", "3"],
        ],
      },
      {
        title: "判定",
        description: "入度條件與可達性均滿足，所以是樹。",
        cells: ["根 1", "邊 2", "節點 3"],
        active: [0, 1, 2],
        variables: [["is tree", "1"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <map>
#include <vector>
#include <set>
using namespace std;
int main() {
    int u, v, tc = 0;
    map<int, vector<int>> g;
    map<int, int> indeg;
    while (cin >> u >> v && u >= 0 && v >= 0) {
        if (u || v) {
            g[u].push_back(v);
            indeg.try_emplace(u, 0);
            ++indeg[v];
            continue;
        }
        bool ok = true;
        vector<int> roots;
        for (auto [node, d] : indeg) {
            if (!d)
                roots.push_back(node);
            else if (d != 1)
                ok = false;
        }
        if (!indeg.empty()) {
            if (roots.size() != 1)
                ok = false;
            else {
                set<int> seen;
                vector<int> todo{roots[0]};
                while (!todo.empty()) {
                    int x = todo.back();
                    todo.pop_back();
                    if (!seen.insert(x).second)
                        continue;
                    for (int y : g[x])
                        todo.push_back(y);
                }
                if (seen.size() != indeg.size())
                    ok = false;
            }
        }
        cout << "Case " << ++tc << (ok ? " is a tree.\n" : " is not a tree.\n");
        g.clear();
        indeg.clear();
    }
}`,
    python: String.raw`import sys

it = iter(map(int, sys.stdin.buffer.read().split()))
g, indeg, tc = {}, {}, 0
for u in it:
    v = next(it)
    if u < 0 or v < 0:
        break
    if u or v:
        g.setdefault(u, []).append(v)
        indeg.setdefault(u, 0)
        indeg[v] = indeg.get(v, 0) + 1
        continue
    roots = [x for x, d in indeg.items() if d == 0]
    ok = all(d <= 1 for d in indeg.values())
    if indeg:
        ok = ok and len(roots) == 1
        if len(roots) == 1:
            seen, todo = set(), [roots[0]]
            while todo:
                x = todo.pop()
                if x not in seen:
                    seen.add(x)
                    todo.extend(g.get(x, []))
            ok = ok and len(seen) == len(indeg)
    tc += 1
    print(f"Case {tc} is {'a tree' if ok else 'not a tree'}.")
    g, indeg = {}, {}
`,
  }),
  defineCpeLesson("a799", {
    topic: "dp",
    level: "medium",
    concept: "Collatz 路徑記憶與區間最大值",
    goal: "重用已知尾段長度，同時保留輸入端點順序。",
    explanation: [
      "定義 length(1)=1。對尚未記錄的 n，沿奇數 3n+1、偶數 n/2 的規則走，將遇到的值存入 path；一旦抵達已知長度的值，就能倒著回填，每往前一個值長度加 1。這避免不同起點的共同尾段一再計算。",
      "每筆在 min(i,j) 到 max(i,j) 的閉區間逐一取最大長度，但輸出開頭仍用原始 i、j。記憶表跨查詢保留，中間值可能比端點大，不能只配置長度 10000 的陣列後直接索引；使用映射儲存。本地保證運算在 32 位元內，C++ 仍以 long long 計算 3n+1。",
    ],
    complexity:
      "新造訪狀態 U、區間長 R，總時間 O(U+ΣR)（雜湊平均），空間 O(U)。",
    pitfall: "cycle-length 包含起點與最後的 1；1 的長度是 1，不是 0。",
    traceLabel: "示意：起點 3",
    trace: [
      {
        title: "向前走",
        description: "3→10→5→16，先記住尚未定案的路徑。",
        cells: ["3", "10", "5", "16"],
        active: [3],
        variables: [["已走步數", "3"]],
      },
      {
        title: "到已知尾端",
        description: "接著 8→4→2→1，length(1)=1。",
        cells: ["8", "4", "2", "1"],
        active: [3],
        variables: [["length(1)", "1"]],
      },
      {
        title: "反向回填",
        description: "length(2)=2，逐一回填，最後 length(3)=8。",
        cells: ["2:2", "16:5", "10:7", "3:8"],
        active: [3],
        variables: [["答案", "8"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <unordered_map>
#include <vector>
#include <algorithm>
using namespace std;
int main() {
    unordered_map<long long, int> memo{{1, 1}};
    auto length = [&](long long x) {
        vector<long long> path;
        while (!memo.count(x)) {
            path.push_back(x);
            x = x % 2 ? 3 * x + 1 : x / 2;
        }
        int len = memo[x];
        for (auto p = path.rbegin(); p != path.rend(); ++p)
            memo[*p] = ++len;
        return len;
    };
    int i, j;
    while (cin >> i >> j) {
        int best = 0;
        for (int n = min(i, j); n <= max(i, j); ++n)
            best = max(best, length(n));
        cout << i << ' ' << j << ' ' << best << '\n';
    }
}`,
    python: String.raw`import sys

memo = {1: 1}


def length(x):
    path = []
    while x not in memo:
        path.append(x)
        x = 3 * x + 1 if x % 2 else x // 2
    size = memo[x]
    for v in reversed(path):
        size += 1
        memo[v] = size
    return size


it = iter(map(int, sys.stdin.buffer.read().split()))
for i in it:
    j = next(it)
    print(i, j, max(length(n) for n in range(min(i, j), max(i, j) + 1)))
`,
  }),
  defineCpeLesson("a800", {
    topic: "math",
    level: "easy",
    concept: "連續時針與圓周短角",
    goal: "包含分鐘對時針的影響，輸出兩針較小夾角。",
    explanation: [
      "分針每分鐘走 6 度，角度是 6M。時針每小時走 30 度、每分鐘走 0.5 度，所以角度為 30(H%12)+0.5M。12 點要先視為 0 點，將兩個角度都放在同一個完整圓周內。",
      "先取角度差的絕對值 d，再選 min(d,360−d)，得到介於 0 到 180 度的答案。所有輸入只會產生整數或半度，二進位浮點可精確表示，不需額外 epsilon。0:00 結束，其餘每筆固定印三位小數。",
    ],
    complexity: "每筆時間 O(1)，空間 O(1)。",
    pitfall: "8:10 的時針不是 240 度，而是 245 度；不能把時針當作整點固定。",
    traceLabel: "示意：8:10",
    trace: [
      {
        title: "分針位置",
        description: "10×6=60 度。",
        cells: ["10", "6", "60"],
        active: [2],
        variables: [["minute angle", "60"]],
      },
      {
        title: "時針位置",
        description: "8×30+10×0.5=245 度。",
        cells: ["240", "5", "245"],
        active: [2],
        variables: [["hour angle", "245"]],
      },
      {
        title: "取短角",
        description: "角差 185 度，另一側 360−185=175 度。",
        cells: ["185", "175", "175.000"],
        active: [1, 2],
        variables: [["答案", "175.000"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <iomanip>
#include <cmath>
#include <algorithm>
using namespace std;
int main() {
    int h, m;
    char colon;
    while (cin >> h >> colon >> m && (h || m)) {
        double d = abs(30.0 * (h % 12) + 0.5 * m - 6 * m);
        cout << fixed << setprecision(3) << min(d, 360 - d) << '\n';
    }
}`,
    python: String.raw`import sys

for token in sys.stdin.read().split():
    h, m = map(int, token.split(':'))
    if h == m == 0:
        break
    d = abs(30 * (h % 12) + 0.5 * m - 6 * m)
    print(f'{min(d, 360 - d):.3f}')
`,
  }),
  defineCpeLesson("a801", {
    topic: "number-theory",
    level: "medium",
    concept: "質數篩與最小左加數",
    goal: "找出差距最大的奇質數分解。",
    explanation: [
      "先用埃氏篩建立小於一百萬的質數表。對每個仍為質數的 p，從 p² 開始將其倍數標為合數，因為更小倍數已有更小質因數處理。這讓每次檢查 n−a 是否質數只需常數時間。",
      "令 a 由 3 開始只走奇數，且 a≤n/2；找到 a 與 n−a 都是質數就停止。因為 b−a=n−2a，a 越小差距越大，所以第一組就是指定答案。本題要求兩個奇質數，不納入 2。n=0 停止；若遍歷完仍無解，輸出指定的英文句子。",
    ],
    complexity:
      "上限 U=10⁶，篩表 O(U log log U) 時間、O(U) 空間；每筆搜尋最壞 O(n)。",
    pitfall: "不能任意找到一組就輸出，搜尋順序必須保證 a 最小。",
    traceLabel: "示意：n=42",
    trace: [
      {
        title: "嘗試 a=3",
        description: "42−3=39=3×13，不是質數。",
        cells: ["3", "39", "3×13"],
        active: [1],
        variables: [
          ["a", "3"],
          ["找到", "0"],
        ],
      },
      {
        title: "嘗試 a=5",
        description: "42−5=37，5 與 37 均為質數。",
        cells: ["5", "37"],
        active: [0, 1],
        variables: [
          ["a", "5"],
          ["找到", "1"],
        ],
      },
      {
        title: "停止",
        description: "首個合法 a 最小，差距 37−5=32 最大。",
        cells: ["42 = 5 + 37", "32"],
        active: [0],
        variables: [["b-a", "32"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
using namespace std;
int main() {
    const int limit = 1000000;
    vector<bool> prime(limit, true);
    prime[0] = prime[1] = false;
    for (int p = 2; p * p < limit; ++p)
        if (prime[p])
            for (int x = p * p; x < limit; x += p)
                prime[x] = false;
    int n;
    while (cin >> n && n) {
        int a = 3;
        while (a <= n / 2 && !(prime[a] && prime[n - a]))
            a += 2;
        if (a <= n / 2)
            cout << n << " = " << a << " + " << n - a << '\n';
        else
            cout << "Goldbach's conjecture is wrong.\n";
    }
}`,
    python: String.raw`import sys

limit = 1000000
prime = bytearray(b'\x01') * limit
prime[0:2] = b'\x00\x00'
for p in range(2, 1000):
    if prime[p]:
        start = p * p
        prime[start:limit:p] = b'\x00' * (((limit - 1 - start) // p) + 1)
for n in map(int, sys.stdin.buffer.read().split()):
    if n == 0:
        break
    for a in range(3, n // 2 + 1, 2):
        if prime[a] and prime[n - a]:
            print(f'{n} = {a} + {n - a}')
            break
    else:
        print("Goldbach's conjecture is wrong.")
`,
  }),
  defineCpeLesson("a802", {
    topic: "graphs",
    level: "hard",
    concept: "瓶頸路徑的 minimax Dijkstra",
    goal: "最小化沿途最大一跳，而不是跳躍長度總和。",
    explanation: [
      "dist[v] 定義為從石頭 1 到 v 的最小瓶頸平方距離。初始 dist[0]=0，其餘無限大。每次取尚未定案且 dist 最小的石頭 u，經 u 跳到 v 的新瓶頸為 max(dist[u],平方距離(u,v))，若比 dist[v] 小就更新。",
      "路徑延長不可能降低既有瓶頸，因此與一般 Dijkstra 相同，當前最小候選可以定案；只是加法改成 max。完全圖不必建立所有邊，選點與更新各用線性掃描，總共 O(n²)。先用整數平方距離比較，最後才對 dist[1] 開根號，減少浮點誤差。每個 Scenario 後包含空白行。",
    ],
    complexity: "每筆時間 O(n²)，空間 O(n)。",
    pitfall: "答案不是最短路總長，也不一定是兩石頭的直接距離。",
    traceLabel: "示意：起點 (0,0)、終點 (6,0)、中繼 (3,0)",
    trace: [
      {
        title: "從起點更新",
        description: "直達終點平方距離 36，中繼平方距離 9。",
        cells: ["起點:0", "終點:36", "中繼:9"],
        active: [0],
        variables: [["定案數", "1"]],
      },
      {
        title: "選中繼",
        description: "瓶頸 9 最小，經中繼到終點為 max(9,9)=9。",
        cells: ["起點:0", "終點:9", "中繼:9"],
        active: [1, 2],
        variables: [["終點瓶頸平方", "9"]],
      },
      {
        title: "終點定案",
        description: "開根號得到 3.000，每一跳都是 3。",
        cells: ["0→3→6", "3.000"],
        active: [1],
        variables: [["答案", "3.000"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <algorithm>
#include <cmath>
#include <iomanip>
#include <utility>
using namespace std;
int main() {
    int n, tc = 0;
    while (cin >> n && n) {
        vector<pair<int, int>> p(n);
        for (auto &[x, y] : p)
            cin >> x >> y;
        vector<int> d(n, 1000000000);
        vector<bool> used(n);
        d[0] = 0;
        for (int step = 0; step < n; ++step) {
            int u = -1;
            for (int i = 0; i < n; ++i)
                if (!used[i] && (u < 0 || d[i] < d[u]))
                    u = i;
            used[u] = true;
            for (int v = 0; v < n; ++v) {
                int dx = p[u].first - p[v].first, dy = p[u].second - p[v].second;
                d[v] = min(d[v], max(d[u], dx * dx + dy * dy));
            }
        }
        cout << "Scenario #" << ++tc << "\nFrog Distance = " << fixed << setprecision(3)
             << sqrt(double(d[1])) << "\n\n";
    }
}`,
    python: String.raw`import sys
import math

it = iter(map(int, sys.stdin.buffer.read().split()))
tc = 0
for n in it:
    if not n:
        break
    points = [(next(it), next(it)) for _ in range(n)]
    d, used = [10**18] * n, [False] * n
    d[0] = 0
    for _ in range(n):
        u = min((i for i in range(n) if not used[i]), key=lambda i: d[i])
        used[u] = True
        x, y = points[u]
        for v, (a, b) in enumerate(points):
            d[v] = min(d[v], max(d[u], (x - a) ** 2 + (y - b) ** 2))
    tc += 1
    print(f'Scenario #{tc}\nFrog Distance = {math.sqrt(d[1]):.3f}\n')
`,
  }),
  defineCpeLesson("a803", {
    topic: "number-theory",
    level: "easy",
    concept: "成對枚舉真因數",
    goal: "以平方根界線求真因數和並分類。",
    explanation: [
      "對 n≥2，先把真因數 1 加入。從 d=2 枚舉到 d²≤n，若能整除，便找到一對因數 d 與 n/d；兩者都小於 n，因此可以加入總和。每個大於平方根的因數都有一個小於平方根的配對，所以不會漏掉。",
      "當 d²=n 時兩個因數相同，只加一次，避免完全平方數重複計數。最後直接比較總和與 n，依序輸出 deficient、perfect 或 abundant。第一個整數是測試數，並非待分類的數字；本題輸出全小寫，與另一題 Perfection 的版型不同。",
    ],
    complexity: "每筆時間 O(√n)，空間 O(1)。",
    pitfall: "真因數不包含 n；完全平方數的平方根只能算一次。",
    traceLabel: "示意：n=16",
    trace: [
      {
        title: "加入 1",
        description: "16 的初始真因數和為 1。",
        cells: ["1"],
        active: [0],
        variables: [
          ["sum", "1"],
          ["n", "16"],
        ],
      },
      {
        title: "因數對 2、8",
        description: "2×8=16，總和變 11。",
        cells: ["1", "2", "8"],
        active: [1, 2],
        variables: [["sum", "11"]],
      },
      {
        title: "平方根 4",
        description: "4×4=16，只加一次 4，總和 15<16，屬於 deficient。",
        cells: ["1", "2", "4", "8"],
        active: [2],
        variables: [
          ["sum", "15"],
          ["分類", "deficient"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
using namespace std;
int main() {
    int t;
    cin >> t;
    while (t--) {
        int n;
        cin >> n;
        int sum = 1;
        for (int d = 2; d * d <= n; ++d)
            if (n % d == 0) {
                sum += d;
                if (d != n / d)
                    sum += n / d;
            }
        cout << (sum < n ? "deficient" : sum == n ? "perfect" : "abundant") << '\n';
    }
}`,
    python: String.raw`import sys
import math

data = list(map(int, sys.stdin.buffer.read().split()))
for n in data[1 : 1 + data[0]]:
    total = 1
    for d in range(2, math.isqrt(n) + 1):
        if n % d == 0:
            total += d
            if d != n // d:
                total += n // d
    print('deficient' if total < n else 'perfect' if total == n else 'abundant')
`,
  }),
  defineCpeLesson("a804", {
    topic: "basics",
    level: "easy",
    concept: "循環分配分數與平手選後者",
    goal: "把回合順序映射到玩家，找最高總分的最大編號。",
    explanation: [
      "共有 J×R 次出手，第 k 個輸入分數屬於索引 k%J 的玩家，因此可以直接累加到長度 J 的總分陣列，不需要保存每一回合。所有分數非負，總分最大為 50000，整數足夠。",
      "結算時由小編號往大編號掃描，遇到總分大於或等於目前最佳就更新答案。等於時更新，正好把平手留給最後出手、也就是編號較大的玩家。資料讀至 EOF，沒有 0 0 終止列；內部索引從 0 開始，輸出要加 1。",
    ],
    complexity: "每筆時間 O(JR)，空間 O(J)。",
    pitfall: "輸入是回合優先而非玩家優先；同分時不能保留較早玩家。",
    traceLabel: "示意：J=3、R=2，分數 1,2,3,4,3,2",
    trace: [
      {
        title: "第一回合",
        description: "三位玩家總分為 1、2、3。",
        cells: ["1", "2", "3"],
        active: [0, 1, 2],
        variables: [["已讀分數", "3"]],
      },
      {
        title: "第二回合",
        description: "分別加上 4、3、2，三人都得到 5。",
        cells: ["5", "5", "5"],
        active: [0, 1, 2],
        variables: [["已讀分數", "6"]],
      },
      {
        title: "解決平手",
        description: "依序更新到玩家 3，最大編號獲勝。",
        cells: ["玩家1:5", "玩家2:5", "玩家3:5"],
        active: [2],
        variables: [["winner", "3"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
using namespace std;
int main() {
    int j, r;
    while (cin >> j >> r) {
        vector<int> score(j, 0);
        for (int k = 0, x; k < j * r; ++k) {
            cin >> x;
            score[k % j] += x;
        }
        int win = 0;
        for (int i = 1; i < j; ++i)
            if (score[i] >= score[win])
                win = i;
        cout << win + 1 << '\n';
    }
}`,
    python: String.raw`import sys

it = iter(map(int, sys.stdin.buffer.read().split()))
for j in it:
    r = next(it)
    score = [0] * j
    for k in range(j * r):
        score[k % j] += next(it)
    print(max(range(j), key=lambda i: (score[i], i)) + 1)
`,
  }),
  defineCpeLesson("a805", {
    topic: "simulation",
    level: "hard",
    concept: "原始儲存格座標逐指令追蹤",
    goal: "正確處理同批插刪的共同參照座標。",
    explanation: [
      "先保存操作，再對每個查詢的原始座標獨立重播。交換 EX 若碰到追蹤位置就換到另一端；刪除列或欄若直接刪到追蹤座標便標記 GONE，否則減去嚴格小於目前編號的刪除數。資料一旦刪除便不會被後續插入復原。",
      "插入是在指定編號之前，因此追蹤座標要加上小於或等於目前編號的插入數。對同一道指令，先用舊座標算完全部影響才一次更新，不能邊處理清單邊移動，否則會把同批編號錯當成更新後座標。重播和真正移動表格等價，但只需維護兩個整數。試算表間留一個空白行，標頭與座標標點依題目格式。",
    ],
    complexity:
      "Q 個查詢、K 道操作、每道最多 A 個編號；時間 O(QKA)，保存操作 O(KA)。",
    pitfall: "刪除比較 <，插入比較 ≤；同一指令的全部編號都參照執行前的表格。",
    traceLabel: "示意：追蹤 (4,3)，IR 2 2 4，再 DC 1 1，再 EX 6 2 1 1",
    trace: [
      {
        title: "插入列",
        description: "原列 4 之前插入在 2、4 的兩列，列號變成 6。",
        cells: ["(4,3)", "+2 列", "(6,3)"],
        active: [2],
        variables: [
          ["r", "6"],
          ["c", "3"],
        ],
      },
      {
        title: "刪除欄",
        description: "欄 1 在左邊，欄號減 1 成為 2。",
        cells: ["(6,3)", "-1 欄", "(6,2)"],
        active: [2],
        variables: [
          ["r", "6"],
          ["c", "2"],
        ],
      },
      {
        title: "交換內容",
        description: "(6,2) 的資料被換到 (1,1)。",
        cells: ["(6,2)", "(1,1)"],
        active: [1],
        variables: [
          ["最後 r", "1"],
          ["最後 c", "1"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
using namespace std;
struct Operation {
    string kind;
    vector<int> a;
};
int main() {
    int rows, cols, tc = 0;
    while (cin >> rows >> cols && (rows || cols)) {
        int n;
        cin >> n;
        vector<Operation> ops(n);
        for (auto &op : ops) {
            cin >> op.kind;
            int count = 4;
            if (op.kind != "EX")
                cin >> count;
            op.a.resize(count);
            for (int &x : op.a)
                cin >> x;
        }
        if (tc)
            cout << '\n';
        cout << "Spreadsheet #" << ++tc << '\n';
        int q;
        cin >> q;
        while (q--) {
            int r, c;
            cin >> r >> c;
            int x = r, y = c;
            bool gone = false;
            for (auto &op : ops) {
                auto &a = op.a;
                if (op.kind == "EX") {
                    if (x == a[0] && y == a[1]) {
                        x = a[2];
                        y = a[3];
                    } else if (x == a[2] && y == a[3]) {
                        x = a[0];
                        y = a[1];
                    }
                } else {
                    int &v = op.kind[1] == 'R' ? x : y;
                    bool erase = op.kind[0] == 'D';
                    if (erase && find(a.begin(), a.end(), v) != a.end()) {
                        gone = true;
                        break;
                    }
                    int shift = 0;
                    for (int p : a)
                        if (erase ? p < v : p <= v)
                            ++shift;
                    v += erase ? -shift : shift;
                }
            }
            cout << "Cell data in (" << r << ',' << c << ") ";
            if (gone)
                cout << "GONE\n";
            else
                cout << "moved to (" << x << ',' << y << ")\n";
        }
    }
}`,
    python: String.raw`import sys

it = iter(sys.stdin.read().split())
tc = 0
for token in it:
    rows, cols = int(token), int(next(it))
    if rows == cols == 0:
        break
    ops = []
    for _ in range(int(next(it))):
        kind = next(it)
        count = 4 if kind == 'EX' else int(next(it))
        ops.append((kind, [int(next(it)) for _ in range(count)]))
    if tc:
        print()
    tc += 1
    print(f'Spreadsheet #{tc}')
    for _ in range(int(next(it))):
        r, c = int(next(it)), int(next(it))
        pos, gone = [r, c], False
        for kind, a in ops:
            if kind == 'EX':
                if pos == a[:2]:
                    pos = a[2:]
                elif pos == a[2:]:
                    pos = a[:2]
            else:
                axis = 0 if kind[1] == 'R' else 1
                v = pos[axis]
                if kind[0] == 'D':
                    if v in a:
                        gone = True
                        break
                    pos[axis] -= sum(p < v for p in a)
                else:
                    pos[axis] += sum(p <= v for p in a)
        result = 'GONE' if gone else f'moved to ({pos[0]},{pos[1]})'
        print(f'Cell data in ({r},{c}) {result}')
`,
  }),
  defineCpeLesson("a806", {
    topic: "dp",
    level: "medium",
    concept: "大整數費氏遞推與直式加法",
    goal: "完整計算直到 F₅₀₀₀，避免固定寬度溢位。",
    explanation: [
      "費氏遞推只需要前兩項，但本題有多次查詢，可預存 F₀ 到 F₅₀₀₀。Python 整數可直接相加；標準 C++17 沒有內建任意精度整數，因此用十進位字串保存每項，實作從個位向高位的直式加法。",
      "字串加法逐位取兩個數字與進位，將餘數加入反向答案，再以除以 10 得到下個進位；其中一個字串用完就補 0，最後反轉結果。從字串 0、1 出發，逐項相加即可保持精確。讀到 EOF，包含 n=0，輸出題目指定句子和完整值。",
    ],
    complexity:
      "最大索引 N、最大十進位位數 D；預處理時間 O(ND)，儲存全部項目 O(ND)。",
    pitfall: "F₅₀₀₀ 超過千位，long long 或 double 都無法保存完整答案。",
    traceLabel: "示意：計算 F₅ 至 F₇",
    trace: [
      {
        title: "F₅",
        description: "F₃=2、F₄=3，相加得到 5。",
        cells: ["2", "3", "5"],
        active: [2],
        variables: [
          ["n", "5"],
          ["F", "5"],
        ],
      },
      {
        title: "F₆",
        description: "3+5=8。",
        cells: ["3", "5", "8"],
        active: [2],
        variables: [
          ["n", "6"],
          ["F", "8"],
        ],
      },
      {
        title: "F₇",
        description: "5+8=13，個位 3、進位 1。",
        cells: ["5", "8", "13"],
        active: [2],
        variables: [
          ["n", "7"],
          ["F", "13"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
using namespace std;
string add(const string &a, const string &b) {
    string out;
    int i = int(a.size()) - 1, j = int(b.size()) - 1, carry = 0;
    while (i >= 0 || j >= 0 || carry) {
        int s = carry;
        if (i >= 0)
            s += a[i--] - '0';
        if (j >= 0)
            s += b[j--] - '0';
        out += char('0' + s % 10);
        carry = s / 10;
    }
    reverse(out.begin(), out.end());
    return out;
}
int main() {
    vector<string> f(5001);
    f[0] = "0";
    f[1] = "1";
    for (int i = 2; i <= 5000; ++i)
        f[i] = add(f[i - 1], f[i - 2]);
    int n;
    while (cin >> n)
        cout << "The Fibonacci number for " << n << " is " << f[n] << '\n';
}`,
    python: String.raw`import sys

f = [0, 1]
for i in range(2, 5001):
    f.append(f[-1] + f[-2])
for n in map(int, sys.stdin.buffer.read().split()):
    print(f'The Fibonacci number for {n} is {f[n]}')
`,
  }),
  defineCpeLesson("a807", {
    topic: "strings",
    level: "easy",
    concept: "保留分隔字元的區段反轉",
    goal: "僅反轉每個單字，原封保留空白與換行。",
    explanation: [
      "單字是兩個空白字元之間的最大連續片段，標點與撇號也在片段內。掃描字元時，非空白就累積到 word，遇到空白便先反轉輸出 word，再原樣輸出該空白。這樣不需要重建詞間距離，因此多個空白與 tab 都能保留。",
      "EOF 也要輸出尚未結束的 word，才能處理最後一行沒有換行的輸入。Python 可用正規表示式只替換非空白片段，C++ 則逐字元串流處理。不要使用一般 split 後用單一空白 join，因為那會合併空白、遺失原本排版。",
    ],
    complexity:
      "總字元數 L，時間 O(L)；C++ 額外空間 O(最長單字)，Python O(L)。",
    pitfall: "you. 要反轉成 .uoy；換行不屬於單字，不能一起反轉。",
    traceLabel: "示意：ab  cd!",
    trace: [
      {
        title: "讀第一詞",
        description: "收集 ab，尚未輸出。",
        cells: ["a", "b"],
        active: [0, 1],
        variables: [["word 長度", "2"]],
      },
      {
        title: "遇雙空白",
        description: "輸出 ba，兩個空白都照原樣保留。",
        cells: ["ba", "空白×2"],
        active: [1],
        variables: [["已處理字元", "4"]],
      },
      {
        title: "EOF 收尾",
        description: "cd! 反轉為 !dc，得到 ba  !dc。",
        cells: ["ba", "空白×2", "!dc"],
        active: [2],
        variables: [["輸出長度", "7"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <string>
#include <algorithm>
#include <cctype>
using namespace std;
int main() {
    string word;
    char ch;
    auto flush = [&]() {
        reverse(word.begin(), word.end());
        cout << word;
        word.clear();
    };
    while (cin.get(ch)) {
        if (isspace(static_cast<unsigned char>(ch))) {
            flush();
            cout << ch;
        } else
            word += ch;
    }
    flush();
}`,
    python: String.raw`import sys
import re

text = sys.stdin.read()
sys.stdout.write(re.sub(r'\S+', lambda m: m.group()[::-1], text))
`,
  }),
  defineCpeLesson("a808", {
    topic: "strings",
    level: "easy",
    concept: "整除長度的週期檢查",
    goal: "找最短能完整重複組成字串的區塊。",
    explanation: [
      "長度 n 的字串若能由長度 k 的區塊重複構成，首先必須有 n%k=0。對每個合法候選 k，檢查所有位置 i 是否等於字串的 i%k 位置；通過時，每一個區塊都和第一塊相同，所以確實有週期 k。",
      "按 k 從小到大檢查，第一個成功的就是最小週期。k=n 一定成功，所以一定能停止。本地字串最多 80 字元，O(n²) 的直接檢查簡單且足夠。以空白分詞即可跳過資料間空白行；答案之間再印一個空白行。",
    ],
    complexity: "每筆時間 O(n²)，額外空間 O(1)，不含輸入字串。",
    pitfall: "局部重複不夠，例如 ababa 的長度不被 2 整除，週期不是 2。",
    traceLabel: "示意：ababab",
    trace: [
      {
        title: "試 k=1",
        description: "位置 1 的 b 不等於位置 0 的 a，失敗。",
        cells: ["a", "b", "a", "b", "a", "b"],
        active: [0, 1],
        variables: [
          ["k", "1"],
          ["通過", "0"],
        ],
      },
      {
        title: "試 k=2",
        description: "6 可以被 2 整除，候選區塊是 ab。",
        cells: ["ab", "ab", "ab"],
        active: [0],
        variables: [
          ["k", "2"],
          ["重複次數", "3"],
        ],
      },
      {
        title: "逐格驗證",
        description: "所有字元都符合 s[i]=s[i%2]，最小週期為 2。",
        cells: ["ab", "ab", "ab"],
        active: [0, 1, 2],
        variables: [["答案", "2"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <string>
using namespace std;
int main() {
    int t;
    cin >> t;
    for (int tc = 0; tc < t; ++tc) {
        string s;
        cin >> s;
        int n = int(s.size()), ans = n;
        for (int k = 1; k <= n; ++k)
            if (n % k == 0) {
                bool ok = true;
                for (int i = 0; i < n; ++i)
                    if (s[i] != s[i % k])
                        ok = false;
                if (ok) {
                    ans = k;
                    break;
                }
            }
        if (tc)
            cout << '\n';
        cout << ans << '\n';
    }
}`,
    python: String.raw`import sys

data = sys.stdin.read().split()
out = []
for s in data[1 : 1 + int(data[0])]:
    n = len(s)
    for k in range(1, n + 1):
        if n % k == 0 and all(s[i] == s[i % k] for i in range(n)):
            out.append(str(k))
            break
print('\n\n'.join(out))
`,
  }),
  defineCpeLesson("a809", {
    topic: "dp",
    level: "hard",
    concept: "旋轉方塊的嚴格底面偏序",
    goal: "在無限供應的積木種類下求最高可堆塔。",
    explanation: [
      "每種長方體選三種高度，各把另外兩邊排序為短邊 a、長邊 b。這涵蓋所有旋轉，因為底面兩邊互換不改變能否疊放。若上層的 a、b 都嚴格小於下層，就建立可堆關係；底面嚴格縮小使狀態圖沒有環，即使種類無限也不會無限堆高。",
      "將所有朝向依底面字典序由小到大排序。dp[i] 表示以第 i 朝向作為最下面一塊的最高塔，先設為自身高度，再從所有更小底面 j 更新 height[i]+dp[j]。合法上層必已在前面算好，所以是 DAG 動態規劃。答案是全部 dp 的最大值，同一種類可以在不同合法朝向再次出現。",
    ],
    complexity: "K=3n；時間 O(K²)，空間 O(K)。",
    pitfall: "兩個底面邊長都要嚴格小於；題目不是每種只能用一次的背包。",
    traceLabel: "示意：單一種類 1×2×3",
    trace: [
      {
        title: "底面 1×2",
        description: "高度 3，沒有更小底面能放上去，dp=3。",
        cells: ["(1,2):h3"],
        active: [0],
        variables: [["dp", "3"]],
      },
      {
        title: "底面 1×3",
        description: "高度 2，短邊與 1×2 相等，不能疊放，所以 dp=2。",
        cells: ["(1,2):3", "(1,3):2"],
        active: [1],
        variables: [["dp", "2"]],
      },
      {
        title: "底面 2×3",
        description: "高度 1，上面可放底面 1×2、高度 3，總高 4。",
        cells: ["底 2×3 高1", "頂 1×2 高3"],
        active: [0, 1],
        variables: [["最高", "4"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <array>
#include <algorithm>
using namespace std;
int main() {
    int n, tc = 0;
    while (cin >> n && n) {
        vector<array<long long, 3>> blocks;
        for (int i = 0; i < n; ++i) {
            long long d[3];
            cin >> d[0] >> d[1] >> d[2];
            for (int k = 0; k < 3; ++k) {
                long long a = d[(k + 1) % 3], b = d[(k + 2) % 3];
                blocks.push_back({min(a, b), max(a, b), d[k]});
            }
        }
        sort(blocks.begin(), blocks.end());
        vector<long long> dp(blocks.size());
        long long best = 0;
        for (int i = 0; i < int(blocks.size()); ++i) {
            dp[i] = blocks[i][2];
            for (int j = 0; j < i; ++j)
                if (blocks[j][0] < blocks[i][0] && blocks[j][1] < blocks[i][1])
                    dp[i] = max(dp[i], blocks[i][2] + dp[j]);
            best = max(best, dp[i]);
        }
        cout << "Case " << ++tc << ": maximum height = " << best << '\n';
    }
}`,
    python: String.raw`import sys

it = iter(map(int, sys.stdin.buffer.read().split()))
tc = 0
for n in it:
    if not n:
        break
    blocks = []
    for _ in range(n):
        d = [next(it) for _ in range(3)]
        for k in range(3):
            a, b = sorted((d[(k + 1) % 3], d[(k + 2) % 3]))
            blocks.append((a, b, d[k]))
    blocks.sort()
    dp = []
    for i, (a, b, h) in enumerate(blocks):
        dp.append(
            h + max((dp[j] for j in range(i) if blocks[j][0] < a and blocks[j][1] < b), default=0)
        )
    tc += 1
    print(f'Case {tc}: maximum height = {max(dp)}')
`,
  }),
  defineCpeLesson("a810", {
    topic: "number-theory",
    level: "easy",
    concept: "二十六進位 Horner 累積",
    goal: "比較車牌英文字母值與十進位尾碼。",
    explanation: [
      "把三個字母各轉為 A=0 到 Z=25。從 value=0 開始，讀到一個字母就更新 value=value×26+digit，三次後得到第一字母×26²+第二字母×26+第三字母。這是進位表示的 Horner 計算，不必手寫每個次方。",
      "連字號後四個字元則照十進位解讀，前導零不影響數值。計算兩者差的絕對值，若不超過 100 就輸出 nice，否則 not nice。輸入第一行是筆數，只處理對應數量的車牌；邊界差恰為 100 仍算 nice。",
    ],
    complexity: "每筆固定七個有效字元，時間與空間 O(1)。",
    pitfall: "A 的值是 0，不是 1；後四位必須用十進位，不能把前導零視為八進位。",
    traceLabel: "示意：ABC-0123",
    trace: [
      {
        title: "讀 A、B",
        description: "0×26+0=0，再做 0×26+1=1。",
        cells: ["A:0", "B:1", "value:1"],
        active: [2],
        variables: [["已讀字母", "2"]],
      },
      {
        title: "讀 C",
        description: "1×26+2=28。",
        cells: ["C:2", "28", "0123→123"],
        active: [1, 2],
        variables: [
          ["字母值", "28"],
          ["數字值", "123"],
        ],
      },
      {
        title: "比較差距",
        description: "|28−123|=95≤100，所以 nice。",
        cells: ["95", "100", "nice"],
        active: [2],
        variables: [["差", "95"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <string>
#include <cstdlib>
using namespace std;
int main() {
    int t;
    cin >> t;
    while (t--) {
        string s;
        cin >> s;
        int value = 0;
        for (int i = 0; i < 3; ++i)
            value = value * 26 + s[i] - 'A';
        int number = stoi(s.substr(4));
        cout << (abs(value - number) <= 100 ? "nice" : "not nice") << '\n';
    }
}`,
    python: String.raw`import sys

data = sys.stdin.read().split()
for s in data[1 : 1 + int(data[0])]:
    value = 0
    for ch in s[:3]:
        value = value * 26 + ord(ch) - ord('A')
    print('nice' if abs(value - int(s[4:])) <= 100 else 'not nice')
`,
  }),
  defineCpeLesson("a811", {
    topic: "simulation",
    level: "easy",
    concept: "把引用指令解析為單步位移",
    goal: "以已解析歷史避免 SAME AS 的遞迴回查。",
    explanation: [
      "第 i 條指令用 step[i] 儲存實際位移：LEFT 是 −1，RIGHT 是 +1。SAME AS j 直接複製 step[j]；因為 j 保證指向先前指令，而先前指令都已解析成 ±1，所以不必沿多重引用反覆追蹤。",
      "執行時把每個解析出的位移加到 position，維持『position 等於目前所有 step 的總和』的不變量。每筆重新初始化歷史與位置，輸出最後總和即可。可使用一基底歷史陣列，令第 0 格為占位值，這樣 SAME AS 的編號不需要額外減 1。",
    ],
    complexity: "每筆時間 O(n)，空間 O(n)。",
    pitfall:
      "SAME AS 引用的是某條指令的動作，不是當時位置；跨案例不能沿用歷史。",
    traceLabel: "示意：LEFT、SAME AS 1、RIGHT",
    trace: [
      {
        title: "LEFT",
        description: "step[1]=−1，位置從 0 到 −1。",
        cells: ["-1"],
        active: [0],
        variables: [
          ["i", "1"],
          ["position", "-1"],
        ],
      },
      {
        title: "SAME AS 1",
        description: "直接複製 −1，位置變 −2。",
        cells: ["-1", "-1"],
        active: [1],
        variables: [
          ["i", "2"],
          ["position", "-2"],
        ],
      },
      {
        title: "RIGHT",
        description: "加入 +1，最後回到 −1。",
        cells: ["-1", "-1", "+1"],
        active: [2],
        variables: [
          ["i", "3"],
          ["position", "-1"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <string>
#include <vector>
using namespace std;
int main() {
    int t;
    cin >> t;
    while (t--) {
        int n;
        cin >> n;
        vector<int> step(n + 1);
        int position = 0;
        for (int i = 1; i <= n; ++i) {
            string cmd;
            cin >> cmd;
            if (cmd == "LEFT")
                step[i] = -1;
            else if (cmd == "RIGHT")
                step[i] = 1;
            else {
                string as;
                int j;
                cin >> as >> j;
                step[i] = step[j];
            }
            position += step[i];
        }
        cout << position << '\n';
    }
}`,
    python: String.raw`import sys

it = iter(sys.stdin.read().split())
for _ in range(int(next(it))):
    n = int(next(it))
    steps = [0]
    position = 0
    for _ in range(n):
        cmd = next(it)
        if cmd == 'LEFT':
            delta = -1
        elif cmd == 'RIGHT':
            delta = 1
        else:
            next(it)
            delta = steps[int(next(it))]
        steps.append(delta)
        position += delta
    print(position)
`,
  }),
];
