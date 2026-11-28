import { defineCpeLesson } from "@/lib/cpeLessonBuilder";

export const lessons = [
  defineCpeLesson("a780", {
    topic: "basics",
    level: "easy",
    concept: "總量守恆與多餘積木",
    goal: "只統計高於平均的部分，求最少搬動數。",
    explanation: [
      "設總高度為 S，目標高度必為 S/n。每個高於平均的堆至少要移走 h−S/n 塊，這些必要搬動相加就是答案的下界。低於平均的堆總缺額恰等於總多餘量，因為搬動不改變總積木數。",
      "將每一塊多餘積木直接搬到尚有缺額的堆，每塊只搬一次，就能達到下界。因此不用模擬搬運順序。讀到 n=0 停止；依序印 Set #k、含句點的答案句，且每筆後面保留空白行。",
    ],
    complexity: "每筆時間 O(n)，空間 O(n) 儲存高度。",
    pitfall: "不能把缺額與多餘量一起相加，否則每次搬動會算兩遍。",
    traceLabel: "示意：高度 1、2、6",
    trace: [
      {
        title: "求目標",
        description: "總數 9，三堆的目標高度為 3。",
        cells: ["1", "2", "6"],
        active: [0, 1, 2],
        variables: [
          ["S", "9"],
          ["平均", "3"],
        ],
      },
      {
        title: "累加多餘量",
        description: "前兩堆不需移出，第三堆多 6−3=3 塊。",
        cells: ["缺 2", "缺 1", "多 3"],
        active: [2],
        variables: [["moves", "3"]],
      },
      {
        title: "達到下界",
        description: "由第三堆搬 2 塊到第一堆，再搬 1 塊到第二堆。",
        cells: ["3", "3", "3"],
        active: [0, 1, 2],
        variables: [["搬動次數", "3"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
using namespace std;
int main() {
    int n, tc = 0;
    while (cin >> n && n) {
        vector<int> h(n);
        int sum = 0, moves = 0;
        for (int &x : h) {
            cin >> x;
            sum += x;
        }
        for (int x : h)
            if (x > sum / n)
                moves += x - sum / n;
        cout << "Set #" << ++tc << "\nThe minimum number of moves is " << moves << ".\n\n";
    }
}`,
    python: String.raw`import sys

it = iter(map(int, sys.stdin.buffer.read().split()))
out = []
for n in it:
    if n == 0:
        break
    h = [next(it) for _ in range(n)]
    avg = sum(h) // n
    moves = sum(max(0, x - avg) for x in h)
    out.append(f"Set #{len(out) + 1}\nThe minimum number of moves is {moves}.\n\n")
sys.stdout.write(''.join(out))
`,
  }),
  defineCpeLesson("a781", {
    topic: "number-theory",
    level: "medium",
    concept: "數字因數分解與字典序",
    goal: "由大到小拆出數字，再由小到大組成最小正整數。",
    explanation: [
      "多位正整數若含 0，其數字乘積就是 0，所以 N=0 的最小答案是 10；N=1 則是 1。對 N>1，從 9 到 2 反覆除盡，記錄每個作為因數的數字；最後若還有大於 1 的餘因數，就無法用十進位非零數字組成。",
      "先使用較大的數字可把小質因數合併，減少位數：例如 2×2×2 可縮成 8，3×3 可縮成 9，2×3 可縮成 6。只含 2、3、5、7 的分解中，這些合併優先減少位數；同位數時再把所得數字升序排列即可最小化數值。答案當字串輸出，避免組合時溢位。",
    ],
    complexity: "每筆時間 O(log N)，空間 O(log N)。",
    pitfall:
      "0 的答案不是 0，題目要求正整數；不可直接把除出的 9、8、…照原順序輸出。",
    traceLabel: "示意：N=36",
    trace: [
      {
        title: "先除 9",
        description: "36÷9=4，收下一個數字 9。",
        cells: ["36", "9", "4"],
        active: [1],
        variables: [
          ["剩餘", "4"],
          ["數字", "9"],
        ],
      },
      {
        title: "再除 4",
        description: "4÷4=1，分解完成。",
        cells: ["9", "4", "1"],
        active: [1, 2],
        variables: [
          ["剩餘", "1"],
          ["位數", "2"],
        ],
      },
      {
        title: "升序輸出",
        description: "49 小於 94，且 4×9=36。",
        cells: ["4", "9", "49"],
        active: [2],
        variables: [["答案", "49"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <string>
#include <algorithm>
using namespace std;
int main() {
    int t;
    cin >> t;
    while (t--) {
        long long n;
        cin >> n;
        if (n < 2) {
            cout << (n == 0 ? "10" : "1") << '\n';
            continue;
        }
        string ans;
        for (int d = 9; d >= 2; --d)
            while (n % d == 0) {
                ans += char('0' + d);
                n /= d;
            }
        reverse(ans.begin(), ans.end());
        cout << (n == 1 ? ans : "-1") << '\n';
    }
}`,
    python: String.raw`import sys

data = list(map(int, sys.stdin.buffer.read().split()))
for n in data[1 : 1 + data[0]]:
    if n < 2:
        print(10 if n == 0 else 1)
        continue
    digits = []
    for d in range(9, 1, -1):
        while n % d == 0:
            digits.append(str(d))
            n //= d
    print(''.join(reversed(digits)) if n == 1 else '-1')
`,
  }),
  defineCpeLesson("a782", {
    topic: "search",
    level: "easy",
    concept: "遞增索引組合回溯",
    goal: "依字典序列出恰選六個數字的所有組合。",
    explanation: [
      "把已選數字放入 path，並以 start 記錄下一個可選索引。每次只能挑 start 之後的位置，因此同一組數字不會因排列不同而重複出現，也不會選到相同元素兩次。path 長度到 6 時就輸出。",
      "輸入集合已經排序，候選索引也由小到大展開，所以回溯輸出天然就是字典序。若還缺 need 個數字，起點最晚只能是 k−need，超過就不足以選滿，可直接剪枝。k=0 結束；只在相鄰兩筆資料之間印空白行。",
    ],
    complexity: "時間 O(6×C(k,6))，遞迴額外空間 O(6)，不含輸出。",
    pitfall: "這是組合而非排列，遞迴下一層必須使用 i+1。",
    traceLabel: "示意：集合 1 至 7",
    trace: [
      {
        title: "第一條分支",
        description: "依序選最小六個數字。",
        cells: ["1", "2", "3", "4", "5", "6"],
        active: [5],
        variables: [
          ["已選", "6"],
          ["輸出序號", "1"],
        ],
      },
      {
        title: "回退一層",
        description: "把末位 6 換成 7。",
        cells: ["1", "2", "3", "4", "5", "7"],
        active: [5],
        variables: [
          ["已選", "6"],
          ["輸出序號", "2"],
        ],
      },
      {
        title: "再回退",
        description: "第五位改選 6，末位只能選 7。",
        cells: ["1", "2", "3", "4", "6", "7"],
        active: [4, 5],
        variables: [["輸出序號", "3"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <functional>
using namespace std;
int main() {
    int k;
    bool first = true;
    while (cin >> k && k) {
        vector<int> a(k), path;
        for (int &x : a)
            cin >> x;
        if (!first)
            cout << '\n';
        first = false;
        function<void(int)> dfs = [&](int start) {
            if (path.size() == 6) {
                for (int i = 0; i < 6; ++i)
                    cout << (i ? " " : "") << path[i];
                cout << '\n';
                return;
            }
            int need = 6 - int(path.size());
            for (int i = start; i <= k - need; ++i) {
                path.push_back(a[i]);
                dfs(i + 1);
                path.pop_back();
            }
        };
        dfs(0);
    }
}`,
    python: String.raw`import sys
from itertools import combinations

it = iter(map(int, sys.stdin.buffer.read().split()))
first = True
for k in it:
    if k == 0:
        break
    a = [next(it) for _ in range(k)]
    if not first:
        print()
    first = False
    for row in combinations(a, 6):
        print(*row)
`,
  }),
  defineCpeLesson("a783", {
    topic: "graphs",
    level: "hard",
    concept: "非負頂點費用的 Dijkstra",
    goal: "在大網格中求包含兩端費用的最短路徑。",
    explanation: [
      "每個格子視為節點，走到相鄰格子的邊權是目的格的數字。起點距離初始化為左上格費用，而不是 0。dist[v] 表示已找到的最小總費用，最小堆每次取出其中最小的候選距離，向四個方向鬆弛。",
      "所有費用非負，因此堆中最小且未過期的距離不可能再被繞路改善，這是 Dijkstra 的定案不變量。堆可能留下舊紀錄，必須以 d!=dist[u] 跳過。目的地定案即可停止。Python 逐列讀取矩陣並將座標壓成單一索引，避免一次 split 整份大型輸入的額外記憶體。",
    ],
    complexity: "V=N×M；時間 O(V log V)，空間 O(V)。",
    pitfall: "一般 BFS 只適合等權重；零費用合法，且起點也要計費。",
    traceLabel: "示意：2×2 費用 [1,8;2,3]",
    trace: [
      {
        title: "起點定案",
        description: "左上費用 1，更新右格為 9、下格為 3。",
        cells: ["1", "9", "3", "∞"],
        active: [0],
        variables: [
          ["取出 d", "1"],
          ["終點", "∞"],
        ],
      },
      {
        title: "下格定案",
        description: "距離 3 比 9 小，往終點得到 3+3=6。",
        cells: ["1", "9", "3", "6"],
        active: [2],
        variables: [
          ["取出 d", "3"],
          ["終點候選", "6"],
        ],
      },
      {
        title: "終點定案",
        description: "下一個最小候選為終點 6，路徑總費用是 1+2+3。",
        cells: ["1", "9", "3", "6"],
        active: [3],
        variables: [["答案", "6"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <queue>
#include <functional>
#include <utility>
using namespace std;
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int t;
    cin >> t;
    while (t--) {
        int n, m;
        cin >> n >> m;
        vector<int> cost(n * m), dist(n * m, 1000000000);
        for (int &x : cost)
            cin >> x;
        priority_queue<pair<int, int>, vector<pair<int, int>>, greater<pair<int, int>>> pq;
        dist[0] = cost[0];
        pq.push({dist[0], 0});
        while (!pq.empty()) {
            auto [d, u] = pq.top();
            pq.pop();
            if (d != dist[u])
                continue;
            if (u == n * m - 1)
                break;
            int r = u / m, c = u % m;
            int dr[] = {-1, 1, 0, 0}, dc[] = {0, 0, -1, 1};
            for (int k = 0; k < 4; ++k) {
                int x = r + dr[k], y = c + dc[k];
                if (x < 0 || x >= n || y < 0 || y >= m)
                    continue;
                int v = x * m + y, nd = d + cost[v];
                if (nd < dist[v]) {
                    dist[v] = nd;
                    pq.push({nd, v});
                }
            }
        }
        cout << dist.back() << '\n';
    }
}`,
    python: String.raw`import sys
import heapq


def numbers():
    for line in sys.stdin.buffer:
        yield from map(int, line.split())


it = numbers()
for _ in range(next(it)):
    n, m = next(it), next(it)
    cost = [next(it) for _ in range(n * m)]
    dist = [10**18] * (n * m)
    dist[0] = cost[0]
    heap = [(cost[0], 0)]
    while heap:
        d, u = heapq.heappop(heap)
        if d != dist[u]:
            continue
        if u == n * m - 1:
            break
        r, c = divmod(u, m)
        for x, y in ((r - 1, c), (r + 1, c), (r, c - 1), (r, c + 1)):
            if 0 <= x < n and 0 <= y < m:
                v = x * m + y
                nd = d + cost[v]
                if nd < dist[v]:
                    dist[v] = nd
                    heapq.heappush(heap, (nd, v))
    print(dist[-1])
`,
  }),
  defineCpeLesson("a784", {
    topic: "dp",
    level: "medium",
    concept: "列壓縮與非空 Kadane",
    goal: "將最大子矩形化為多次最大連續子陣列。",
    explanation: [
      "固定上邊界 top，將下邊界 bottom 逐列往下擴張，維護每一欄在 top 到 bottom 之間的總和。任一左右連續區間在這個壓縮陣列上的和，正好就是對應矩形的總和，因此只需在每對上下邊界執行一次 Kadane。",
      "Kadane 維護以目前欄結尾的最佳非空區間：cur=max(x,cur+x)，再更新全域最大值。初始化使用第一個元素而不是 0，才能處理全負矩陣。總共有 O(N²) 對列邊界，每次 O(N)，把四邊枚舉的成本降到 O(N³)。本地題目只有一個矩陣，讀滿 N² 個值即可。",
    ],
    complexity: "時間 O(N³)，空間 O(N²)，額外壓縮陣列 O(N)。",
    pitfall: "不可允許空矩形，否則全負資料會錯誤輸出 0。",
    traceLabel: "示意：矩陣 [-2,3;4,-1]",
    trace: [
      {
        title: "只看第一列",
        description: "壓縮值 −2、3，最佳區間為 3。",
        cells: ["-2", "3"],
        active: [1],
        variables: [
          ["top,bottom", "0,0"],
          ["best", "3"],
        ],
      },
      {
        title: "加入第二列",
        description: "欄和變為 2、2，整段和為 4。",
        cells: ["2", "2"],
        active: [0, 1],
        variables: [
          ["top,bottom", "0,1"],
          ["best", "4"],
        ],
      },
      {
        title: "只看第二列",
        description: "4、−1 的最佳區間為 4，最終答案保持 4。",
        cells: ["4", "-1"],
        active: [0],
        variables: [
          ["top,bottom", "1,1"],
          ["答案", "4"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;
int main() {
    int n;
    if (!(cin >> n))
        return 0;
    vector<vector<int>> a(n, vector<int>(n));
    for (auto &row : a)
        for (int &x : row)
            cin >> x;
    int best = a[0][0];
    for (int top = 0; top < n; ++top) {
        vector<int> sum(n, 0);
        for (int bottom = top; bottom < n; ++bottom) {
            for (int c = 0; c < n; ++c)
                sum[c] += a[bottom][c];
            int cur = sum[0];
            best = max(best, cur);
            for (int c = 1; c < n; ++c) {
                cur = max(sum[c], cur + sum[c]);
                best = max(best, cur);
            }
        }
    }
    cout << best << '\n';
}`,
    python: String.raw`import sys

it = iter(map(int, sys.stdin.buffer.read().split()))
n = next(it)
a = [[next(it) for _ in range(n)] for _ in range(n)]
best = a[0][0]
for top in range(n):
    sums = [0] * n
    for bottom in range(top, n):
        for c in range(n):
            sums[c] += a[bottom][c]
        cur = sums[0]
        best = max(best, cur)
        for x in sums[1:]:
            cur = max(x, cur + x)
            best = max(best, cur)
print(best)
`,
  }),
  defineCpeLesson("a785", {
    topic: "strings",
    level: "easy",
    concept: "多項式逐項格式化",
    goal: "分離正負號、係數與次方，組合精確輸出。",
    explanation: [
      "依次從 8 次到 0 次掃描九個係數，零係數直接略過。對每個非零項先輸出符號：第一項只有負號，後續項才使用兩側帶空格的加減號；項的大小一律使用係數絕對值，避免產生 + - 的形式。",
      "非常數項若係數絕對值為 1，省略數字；次方為 1 時只寫 x，為 2 以上時才寫 x^p。常數項一定輸出數值。用已產生字串是否為空判斷第一項，最後仍為空代表零多項式。每九個係數一筆，讀至 EOF，每筆只輸出一行。",
    ],
    complexity: "每筆處理九項，時間與額外空間 O(1)。",
    pitfall: "常數 1 不可省略；負的第一項不能多出前導空格。",
    traceLabel: "示意：2x²−x+3",
    trace: [
      {
        title: "二次項",
        description: "係數 2，第一個正項不加正號。",
        cells: ["2", "2", "2x^2"],
        active: [2],
        variables: [
          ["次方", "2"],
          ["已輸出項數", "1"],
        ],
      },
      {
        title: "一次項",
        description: "係數 −1，接上減號與 x，省略 1。",
        cells: ["-1", "1", "2x^2 - x"],
        active: [2],
        variables: [
          ["次方", "1"],
          ["項數", "2"],
        ],
      },
      {
        title: "常數項",
        description: "常數 3 要保留數字，結果為 2x^2 - x + 3。",
        cells: ["3", "0", "2x^2 - x + 3"],
        active: [2],
        variables: [
          ["次方", "0"],
          ["項數", "3"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <string>
#include <cstdlib>
using namespace std;
int main() {
    int a[9];
    while (cin >> a[0]) {
        for (int i = 1; i < 9; ++i)
            cin >> a[i];
        string out;
        for (int i = 0; i < 9; ++i) {
            int c = a[i], p = 8 - i;
            if (!c)
                continue;
            out += out.empty() ? (c < 0 ? "-" : "") : (c < 0 ? " - " : " + ");
            if (p == 0 || abs(c) != 1)
                out += to_string(abs(c));
            if (p)
                out += "x";
            if (p > 1)
                out += "^" + to_string(p);
        }
        cout << (out.empty() ? "0" : out) << '\n';
    }
}`,
    python: String.raw`import sys

it = iter(map(int, sys.stdin.buffer.read().split()))
for first in it:
    a = [first] + [next(it) for _ in range(8)]
    out = ''
    for i, c in enumerate(a):
        p = 8 - i
        if c == 0:
            continue
        out += ('-' if c < 0 else '') if not out else (' - ' if c < 0 else ' + ')
        if p == 0 or abs(c) != 1:
            out += str(abs(c))
        if p:
            out += 'x'
        if p > 1:
            out += '^' + str(p)
    print(out or '0')
`,
  }),
  defineCpeLesson("a786", {
    topic: "math",
    level: "easy",
    concept: "三角數定位與斜線奇偶",
    goal: "不建立分數表，直接定位第 n 項。",
    explanation: [
      "第 d 條斜線含 d 個分數，走完前 d 條共 d(d+1)/2 項。從 d=1 遞增，找第一個三角數不小於 n 的 d；減去前 d−1 條總長，得到本條斜線的第 k 項。",
      "由前幾項可見偶數斜線的分子由 1 遞增，故分子 k、分母 d+1−k；奇數斜線反向，分子 d+1−k、分母 k。這裡是在列舉表格格子，分數不可約分。輸入讀至 EOF，原 n 保留於 TERM n IS a/b 的輸出。",
    ],
    complexity: "每筆時間 O(√n)，額外空間 O(1)。",
    pitfall: "斜線從 1 編號，k 也從 1 開始；三角數端點仍屬於原斜線。",
    traceLabel: "示意：第 8 項",
    trace: [
      {
        title: "略過前三條",
        description: "前三條共 1+2+3=6 項。",
        cells: ["1", "3", "6"],
        active: [2],
        variables: [
          ["n", "8"],
          ["已走", "6"],
        ],
      },
      {
        title: "定位第四條",
        description: "第四條走到第 10 項，8−6=2。",
        cells: ["7", "8", "9", "10"],
        active: [1],
        variables: [
          ["d", "4"],
          ["k", "2"],
        ],
      },
      {
        title: "計算分數",
        description: "偶數斜線向下走，分子 2，分母 5−2=3。",
        cells: ["1/4", "2/3", "3/2", "4/1"],
        active: [1],
        variables: [["答案", "2/3"]],
      },
    ],
    cpp: String.raw`#include <iostream>
using namespace std;
int main() {
    long long n;
    while (cin >> n) {
        long long d = 1;
        while (d * (d + 1) / 2 < n)
            ++d;
        long long k = n - d * (d - 1) / 2;
        long long a = d % 2 ? d + 1 - k : k;
        cout << "TERM " << n << " IS " << a << '/' << d + 1 - a << '\n';
    }
}`,
    python: String.raw`import sys

for n in map(int, sys.stdin.buffer.read().split()):
    d = 1
    while d * (d + 1) // 2 < n:
        d += 1
    k = n - d * (d - 1) // 2
    a = d + 1 - k if d % 2 else k
    print(f"TERM {n} IS {a}/{d + 1 - a}")
`,
  }),
  defineCpeLesson("a787", {
    topic: "sorting",
    level: "medium",
    concept: "曼哈頓距離與下中位數",
    goal: "分別選兩軸中位數以最小化總步行距離。",
    explanation: [
      "總距離可拆成 Σ|s−sᵢ|+Σ|a−aᵢ|，兩軸可以獨立最佳化。對單一座標，把集合點向右移一格，左方朋友的距離增加、右方朋友的距離減少；在中位數之前，向中間靠攏不會增加總和，超過中位數後則不會更好。",
      "排序後取索引 (F−1)/2 的元素。奇數人時是唯一中位數；偶數人時兩個中央值之間都最優，而題目要求編號小者，故選下中位數。兩軸都用同一規則即可滿足街道優先的平手條件，不必枚舉 S×A 個交叉口。",
    ],
    complexity: "每筆時間 O(F log F)，空間 O(F)。",
    pitfall: "偶數個朋友不可取中央兩數平均或上中位數，因為要選最小的最優座標。",
    traceLabel: "示意：朋友 (1,4)、(5,2)、(3,6)、(7,8)",
    trace: [
      {
        title: "分離座標",
        description: "街道與大道可以各自排序。",
        cells: ["1,5,3,7", "4,2,6,8"],
        active: [0, 1],
        variables: [
          ["F", "4"],
          ["索引", "1"],
        ],
      },
      {
        title: "取下中位數",
        description: "街道 1,3,5,7 取 3；大道 2,4,6,8 取 4。",
        cells: ["1,3,5,7", "2,4,6,8"],
        active: [0, 1],
        variables: [
          ["s", "3"],
          ["a", "4"],
        ],
      },
      {
        title: "驗算距離",
        description: "到 (3,4) 的距離依序為 2、4、2、8，總和 16。",
        cells: ["2", "4", "2", "8"],
        active: [0, 1, 2, 3],
        variables: [["總距離", "16"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;
int main() {
    int t;
    cin >> t;
    while (t--) {
        int s, a, f;
        cin >> s >> a >> f;
        vector<int> x(f), y(f);
        for (int i = 0; i < f; ++i)
            cin >> x[i] >> y[i];
        sort(x.begin(), x.end());
        sort(y.begin(), y.end());
        cout << "(Street: " << x[(f - 1) / 2] << ", Avenue: " << y[(f - 1) / 2] << ")\n";
    }
}`,
    python: String.raw`import sys

it = iter(map(int, sys.stdin.buffer.read().split()))
for _ in range(next(it)):
    s, a, f = next(it), next(it), next(it)
    points = [(next(it), next(it)) for _ in range(f)]
    x = sorted(p[0] for p in points)
    y = sorted(p[1] for p in points)
    print(f"(Street: {x[(f - 1) // 2]}, Avenue: {y[(f - 1) // 2]})")
`,
  }),
  defineCpeLesson("a788", {
    topic: "graphs",
    level: "medium",
    concept: "Floyd–Warshall 與有序點對平均",
    goal: "計算所有不同頁面之間的平均最短點擊數。",
    explanation: [
      "只收集真正出現在邊端點的頁面，不能把 1 到 100 全當成有效節點。距離矩陣的自己到自己為 0，有向連結為 1，其餘為無限大。依序允許節點 k 作為中繼，以 dist[i][j]=min(dist[i][j],dist[i][k]+dist[k][j]) 更新。",
      "第 k 輪結束後，距離已涵蓋只用前 k 個節點當內部中繼的所有路徑，因此最後得到全點對最短路。題目保證強連通，總和除以 P(P−1)，不包含自己到自己的距離。每筆 0 0 結束；若尚未讀入任何邊便遇到 0 0，代表整份輸入結束。",
    ],
    complexity: "P≤100；每筆時間 O(P³)，空間 O(P²)。",
    pitfall: "連結有方向，分母是有序配對 P(P−1)，不是組合數。",
    traceLabel: "示意：1→2→3→1",
    trace: [
      {
        title: "直接邊",
        description: "三條直接邊的距離都是 1。",
        cells: ["1→2:1", "2→3:1", "3→1:1"],
        active: [0, 1, 2],
        variables: [
          ["P", "3"],
          ["已知距離和", "3"],
        ],
      },
      {
        title: "補上兩步路",
        description: "1→3、2→1、3→2 的最短距離各為 2。",
        cells: ["1→3:2", "2→1:2", "3→2:2"],
        active: [0, 1, 2],
        variables: [["距離和", "9"]],
      },
      {
        title: "平均",
        description: "共有 3×2=6 個不同端點的有序配對，平均 9/6。",
        cells: ["9", "6", "1.500"],
        active: [2],
        variables: [["平均", "1.500"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <set>
#include <iomanip>
#include <algorithm>
using namespace std;
int main() {
    int a, b, tc = 0;
    while (cin >> a >> b && (a || b)) {
        vector<vector<int>> d(101, vector<int>(101, 1000000));
        set<int> nodes;
        for (int i = 1; i <= 100; ++i)
            d[i][i] = 0;
        do {
            nodes.insert(a);
            nodes.insert(b);
            d[a][b] = 1;
            cin >> a >> b;
        } while (a || b);
        for (int k : nodes)
            for (int i : nodes)
                for (int j : nodes)
                    d[i][j] = min(d[i][j], d[i][k] + d[k][j]);
        int sum = 0, p = int(nodes.size());
        for (int i : nodes)
            for (int j : nodes)
                if (i != j)
                    sum += d[i][j];
        double avg = p > 1 ? double(sum) / (p * (p - 1)) : 0;
        cout << "Case " << ++tc << ": average length between pages = " << fixed << setprecision(3)
             << avg << " clicks\n";
    }
}`,
    python: String.raw`import sys

it = iter(map(int, sys.stdin.buffer.read().split()))
tc = 0
for a in it:
    b = next(it)
    if a == b == 0:
        break
    edges = [(a, b)]
    while True:
        a, b = next(it), next(it)
        if a == b == 0:
            break
        edges.append((a, b))
    nodes = sorted({x for e in edges for x in e})
    idx = {x: i for i, x in enumerate(nodes)}
    p = len(nodes)
    d = [[10**6] * p for _ in nodes]
    for i in range(p):
        d[i][i] = 0
    for a, b in edges:
        d[idx[a]][idx[b]] = 1
    for k in range(p):
        for i in range(p):
            for j in range(p):
                d[i][j] = min(d[i][j], d[i][k] + d[k][j])
    avg = sum(d[i][j] for i in range(p) for j in range(p) if i != j) / (p * (p - 1)) if p > 1 else 0
    tc += 1
    print(f"Case {tc}: average length between pages = {avg:.3f} clicks")
`,
  }),
  defineCpeLesson("a789", {
    topic: "graphs",
    level: "hard",
    concept: "有向轉接可達性與最大二分配對",
    goal: "在可串接且無限量的轉接器下，最大化供電電器數。",
    explanation: [
      "先以插頭類型建有向圖：A B 代表 A 型電器能接向 B 型插座，因此邊為 A→B。由每件電器的插頭做搜尋，找出所有可到達的類型，包含零次轉接的原類型。轉接器數量無限，所以只需知道可達性，不需分配轉接器本身。",
      "再建二分圖，左側為電器個體，右側為實際插座個體；能轉接相容就連邊。逐件電器找增廣路：遇到已配對插座時嘗試替原電器改接，成功才讓新電器佔用。每次增廣增加一件供電電器，無增廣路後就是最大配對；答案為 m 減配對數。重複類型的插座仍須分開計數，資料間印一個空白行。",
    ],
    complexity:
      "類型數 V、轉接邊 K、m 件電器與 n 插座；C++ 有序容器時間 O((K+m(V+K+n))log(V+1)+m²n)，名稱比較成本另計；Python 雜湊平均 O(m(V+K+n)+m²n)。圖與配對空間 O(mn+V+K)，Python 另含輸入緩衝。",
    pitfall: "A B 不可反向解讀；只依序貪心搶插座可能阻擋需要特定插座的電器。",
    traceLabel: "示意：插座 B,C；電器 A,B；轉接 A→B、A→C",
    trace: [
      {
        title: "建立相容邊",
        description: "電器 A 可接 B 或 C，電器 B 只能接 B。",
        cells: ["A→B,C", "B→B"],
        active: [0, 1],
        variables: [
          ["插座數", "2"],
          ["電器數", "2"],
        ],
      },
      {
        title: "第一次配對",
        description: "先讓 A 使用 B 插座。",
        cells: ["B:A", "C:空"],
        active: [0],
        variables: [["已配對", "1"]],
      },
      {
        title: "增廣調整",
        description: "B 要接 B 時，把 A 改到 C，兩件都能供電。",
        cells: ["B:B", "C:A"],
        active: [0, 1],
        variables: [
          ["已配對", "2"],
          ["無法供電", "0"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <string>
#include <map>
#include <set>
#include <functional>
using namespace std;
int main() {
    int t;
    cin >> t;
    for (int tc = 0; tc < t; ++tc) {
        int n, m, k;
        cin >> n;
        vector<string> sockets(n);
        for (auto &s : sockets)
            cin >> s;
        cin >> m;
        vector<string> plugs(m);
        string name;
        for (auto &s : plugs)
            cin >> name >> s;
        cin >> k;
        map<string, vector<string>> graph;
        while (k--) {
            string a, b;
            cin >> a >> b;
            graph[a].push_back(b);
        }
        vector<vector<int>> adj(m);
        for (int i = 0; i < m; ++i) {
            set<string> seen{plugs[i]};
            vector<string> todo{plugs[i]};
            while (!todo.empty()) {
                string u = todo.back();
                todo.pop_back();
                for (auto &v : graph[u])
                    if (seen.insert(v).second)
                        todo.push_back(v);
            }
            for (int j = 0; j < n; ++j)
                if (seen.count(sockets[j]))
                    adj[i].push_back(j);
        }
        vector<int> match(n, -1), seen(n);
        function<bool(int)> augment = [&](int u) {
            for (int v : adj[u])
                if (!seen[v]) {
                    seen[v] = 1;
                    if (match[v] < 0 || augment(match[v])) {
                        match[v] = u;
                        return true;
                    }
                }
            return false;
        };
        int count = 0;
        for (int i = 0; i < m; ++i) {
            seen.assign(n, 0);
            count += augment(i);
        }
        if (tc)
            cout << '\n';
        cout << m - count << '\n';
    }
}`,
    python: String.raw`import sys

it = iter(sys.stdin.read().split())
answers = []
for _ in range(int(next(it))):
    n = int(next(it))
    sockets = [next(it) for _ in range(n)]
    m = int(next(it))
    plugs = []
    for _ in range(m):
        next(it)
        plugs.append(next(it))
    graph = {}
    for _ in range(int(next(it))):
        a, b = next(it), next(it)
        graph.setdefault(a, []).append(b)
    adj = []
    for plug in plugs:
        seen, todo = {plug}, [plug]
        while todo:
            for v in graph.get(todo.pop(), []):
                if v not in seen:
                    seen.add(v)
                    todo.append(v)
        adj.append([j for j, s in enumerate(sockets) if s in seen])
    match = [-1] * n

    def augment(u):
        for v in adj[u]:
            if v not in used:
                used.add(v)
                if match[v] == -1 or augment(match[v]):
                    match[v] = u
                    return True
        return False

    count = 0
    for u in range(m):
        used = set()
        count += augment(u)
    answers.append(str(m - count))
print('\n\n'.join(answers))
`,
  }),
  defineCpeLesson("a790", {
    topic: "graphs",
    level: "easy",
    concept: "四方向洪水填充",
    goal: "只計算查詢水格所在的連通水域面積。",
    explanation: [
      "將起點從一基底座標轉成零基底，放入堆疊並立刻把它標為已訪問。每次取出一格就增加面積，檢查四個上下左右鄰格；只有仍是 0 且在網格內的格子才能加入。標記在入堆疊時完成，避免同一水格被不同鄰居重複加入。",
      "搜尋只會走到與起點連通的水格；反過來，任何連通水格都有一條水路通往起點，沿路都會被擴展，因此恰好計算整片水域。用迭代堆疊可避開長水道的遞迴深度問題。每筆網格讀到空白行或 EOF，答案之間留一個空白行。",
    ],
    complexity: "R×C 網格的時間 O(RC)，空間 O(RC)。",
    pitfall: "對角不連通；前導零的座標仍是十進位，邊界外不能計入面積。",
    traceLabel: "示意：網格 001 / 011，查詢 (1,1)",
    trace: [
      {
        title: "放入起點",
        description: "(1,1) 是水，計數 1，標記為陸地。",
        cells: ["101", "011"],
        active: [0],
        variables: [["面積", "1"]],
      },
      {
        title: "擴展右方",
        description: "走到 (1,2)，其餘可走鄰格只有已訪問的起點。",
        cells: ["111", "011"],
        active: [0],
        variables: [["面積", "2"]],
      },
      {
        title: "擴展下方",
        description: "(2,1) 也與起點相連，總面積為 3。",
        cells: ["111", "111"],
        active: [1],
        variables: [
          ["面積", "3"],
          ["待處理", "0"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <string>
#include <sstream>
#include <vector>
#include <utility>
using namespace std;
int main() {
    int t;
    cin >> t;
    string line;
    getline(cin, line);
    for (int tc = 0; tc < t; ++tc) {
        do {
            getline(cin, line);
            if (!line.empty() && line.back() == '\r') line.pop_back();
        } while (line.empty());
        int r, c;
        istringstream(line) >> r >> c;
        --r;
        --c;
        vector<string> g;
        while (getline(cin, line)) {
            if (!line.empty() && line.back() == '\r') line.pop_back();
            if (line.empty()) break;
            g.push_back(line);
        }
        vector<pair<int, int>> stack{{r, c}};
        g[r][c] = '1';
        int area = 0;
        while (!stack.empty()) {
            auto [x, y] = stack.back();
            stack.pop_back();
            ++area;
            int dx[] = {-1, 1, 0, 0}, dy[] = {0, 0, -1, 1};
            for (int k = 0; k < 4; ++k) {
                int a = x + dx[k], b = y + dy[k];
                if (a >= 0 && a < int(g.size()) && b >= 0 && b < int(g[0].size()) &&
                    g[a][b] == '0') {
                    g[a][b] = '1';
                    stack.push_back({a, b});
                }
            }
        }
        if (tc)
            cout << '\n';
        cout << area << '\n';
    }
}`,
    python: String.raw`import sys

lines = iter(sys.stdin.read().splitlines())
t = int(next(lines))
out = []
for _ in range(t):
    line = next(lines)
    while not line.strip():
        line = next(lines)
    r, c = (int(x) - 1 for x in line.split())
    g = []
    for line in lines:
        if not line.strip():
            break
        g.append(list(line.strip()))
    stack = [(r, c)]
    g[r][c] = '1'
    area = 0
    while stack:
        x, y = stack.pop()
        area += 1
        for a, b in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if 0 <= a < len(g) and 0 <= b < len(g[0]) and g[a][b] == '0':
                g[a][b] = '1'
                stack.append((a, b))
    out.append(str(area))
print('\n\n'.join(out))
`,
  }),
  defineCpeLesson("a791", {
    topic: "simulation",
    level: "medium",
    concept: "七段查表與固定畫布",
    goal: "以段位元表繪製任意大小的數字顯示器。",
    explanation: [
      "把七段依序命名為上、左上、右上、中、左下、右下、下，為每個數字建立是否亮起的七個布林值。每個數字佔 s+2 欄、2s+3 列；水平段在第 0、s+1、2s+2 列的中間 s 欄，垂直段在上半或下半的左右邊。",
      "每列先依數字產生固定寬度的小片段，再用一個空白連接，便能保留未亮段的位置及最後一個數字的尾端空白。列號決定要查哪一段，不需要為十種數字各寫整幅圖。讀到 0 0 停止，每幅圖後輸出一個空白行；不得對畫面使用 rstrip。",
    ],
    complexity: "d 個數字，時間 O(ds²) 等於輸出量；逐列空間 O(ds)。",
    pitfall:
      "0 本身也是一個數字；中段與上下段不可混用，尾端空白是本地規格的一部分。",
    traceLabel: "示意：s=1，數字 2",
    trace: [
      {
        title: "上緣",
        description: "寬度 3，上段亮起，第一列為空白、橫線、空白。",
        cells: [" - ", "   ", "   ", "   ", "   "],
        active: [0],
        variables: [
          ["s", "1"],
          ["寬", "3"],
        ],
      },
      {
        title: "上半與中段",
        description: "2 亮右上與中段，補出第 1、2 列。",
        cells: [" - ", "  |", " - ", "   ", "   "],
        active: [1, 2],
        variables: [["已畫列數", "3"]],
      },
      {
        title: "下半與底段",
        description: "亮左下與底段，完成 5 列。",
        cells: [" - ", "  |", " - ", "|  ", " - "],
        active: [3, 4],
        variables: [["總列數", "5"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <string>
using namespace std;
int main() {
    string seg[] = {"1110111", "0010010", "1011101", "1011011", "0111010",
                    "1101011", "1101111", "1010010", "1111111", "1111011"};
    int s;
    string n;
    while (cin >> s >> n && s) {
        for (int r = 0; r < 2 * s + 3; ++r) {
            for (int j = 0; j < int(n.size()); ++j) {
                if (j)
                    cout << ' ';
                string bits = seg[n[j] - '0'], row(s + 2, ' ');
                if (r == 0 || r == s + 1 || r == 2 * s + 2) {
                    int k = r == 0 ? 0 : (r == s + 1 ? 3 : 6);
                    if (bits[k] == '1')
                        for (int c = 1; c <= s; ++c)
                            row[c] = '-';
                } else {
                    int k = r < s + 1 ? 1 : 4;
                    if (bits[k] == '1')
                        row[0] = '|';
                    if (bits[k + 1] == '1')
                        row[s + 1] = '|';
                }
                cout << row;
            }
            cout << '\n';
        }
        cout << '\n';
    }
}`,
    python: String.raw`import sys

seg = [
    '1110111',
    '0010010',
    '1011101',
    '1011011',
    '0111010',
    '1101011',
    '1101111',
    '1010010',
    '1111111',
    '1111011',
]
it = iter(sys.stdin.read().split())
for token in it:
    s, n = int(token), next(it)
    if s == 0:
        break
    for r in range(2 * s + 3):
        pieces = []
        for ch in n:
            bits = seg[int(ch)]
            row = [' '] * (s + 2)
            if r in (0, s + 1, 2 * s + 2):
                k = 0 if r == 0 else 3 if r == s + 1 else 6
                if bits[k] == '1':
                    row[1 : s + 1] = ['-'] * s
            else:
                k = 1 if r < s + 1 else 4
                if bits[k] == '1':
                    row[0] = '|'
                if bits[k + 1] == '1':
                    row[-1] = '|'
            pieces.append(''.join(row))
        print(' '.join(pieces))
    print()
`,
  }),
  defineCpeLesson("a792", {
    topic: "math",
    level: "easy",
    concept: "曆法轉換的共同日序",
    goal: "先轉絕對日數，再以取模還原三個 Tzolkin 欄位。",
    explanation: [
      "把 Haab 的月份名稱映射為從 0 開始的索引 m。因為前十八月各 20 日，日期對應的絕對日數為 D=365×year+20×m+day，連最後的 uayet 也可使用同一公式；第一天的 D 是 0。",
      "Tzolkin 數字每 13 日循環，故為 D%13+1；日名每 20 日循環，取 D%20 的名稱；年份每 260 日遞增，為 D//260。兩個循環都從絕對日數計算，不要先扣掉某種曆法的年份。輸入日數後有句點，先移除；輸出第一行必須回印日期筆數。",
    ],
    complexity: "每筆時間 O(1)，月份與日名表空間 O(1)。",
    pitfall: "Haab 日期從 0 起算，Tzolkin 數字從 1 起算，兩種年份都從 0 起算。",
    traceLabel: "示意：10. zac 0",
    trace: [
      {
        title: "月份索引",
        description: "zac 是索引 10，前面經過 200 日。",
        cells: ["10", "20", "200"],
        active: [2],
        variables: [
          ["m", "10"],
          ["day", "10"],
        ],
      },
      {
        title: "絕對日數",
        description: "365×0+200+10=210。",
        cells: ["0", "200", "10", "210"],
        active: [3],
        variables: [["D", "210"]],
      },
      {
        title: "分別取模",
        description: "210%13+1=3，210%20=10 對應 chuen，年份 0。",
        cells: ["3", "chuen", "0"],
        active: [0, 1, 2],
        variables: [["輸出", "3 chuen 0"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <string>
#include <vector>
#include <algorithm>
using namespace std;
int main() {
    vector<string> months = {"pop",  "no",   "zip",   "zotz",  "tzec", "xul", "yoxkin",
                             "mol",  "chen", "yax",   "zac",   "ceh",  "mac", "kankin",
                             "muan", "pax",  "koyab", "cumhu", "uayet"};
    vector<string> names = {"imix",  "ik",    "akbal", "kan",   "chicchan", "cimi", "manik",
                            "lamat", "muluk", "ok",    "chuen", "eb",       "ben",  "ix",
                            "mem",   "cib",   "caban", "eznab", "canac",    "ahau"};
    int t;
    cin >> t;
    cout << t << '\n';
    while (t--) {
        int day, year;
        char dot;
        string month;
        cin >> day >> dot >> month >> year;
        int m = int(find(months.begin(), months.end(), month) - months.begin());
        int d = year * 365 + m * 20 + day;
        cout << d % 13 + 1 << ' ' << names[d % 20] << ' ' << d / 260 << '\n';
    }
}`,
    python: String.raw`import sys

months = 'pop no zip zotz tzec xul yoxkin mol chen yax zac ceh mac kankin muan pax koyab cumhu uayet'.split()
names = 'imix ik akbal kan chicchan cimi manik lamat muluk ok chuen eb ben ix mem cib caban eznab canac ahau'.split()
it = iter(sys.stdin.read().split())
t = int(next(it))
print(t)
for _ in range(t):
    day = int(next(it).rstrip('.'))
    month, year = next(it), int(next(it))
    d = year * 365 + months.index(month) * 20 + day
    print(d % 13 + 1, names[d % 20], d // 260)
`,
  }),
  defineCpeLesson("a793", {
    topic: "simulation",
    level: "medium",
    concept: "有優先順序的棋步合法性",
    goal: "依序區分重疊、非法移動、禁入鄰格與困住國王。",
    explanation: [
      "先檢查國王與皇后是否起始重疊。合法皇后移動必須改變位置、同列或同行，且路徑含終點不能碰到國王。可沿唯一的水平或垂直方向逐格走，最多七步，因此最直接的模擬就足夠。合法後，再檢查新位置到國王的曼哈頓距離是否為 1，若是便是 Move not allowed。",
      "其餘情況枚舉國王的四個鄰格，忽略棋盤外位置；若有一格與皇后不同列且不同欄，該格不受皇后攻擊，國王還能動，輸出 Continue。全部鄰格都受攻擊則為 Stop。判斷必須按照題目的優先順序，不能先用最終棋盤判斷而掩蓋非法起始狀態。",
    ],
    complexity: "每筆時間 O(1)，空間 O(1)，棋盤固定 8×8。",
    pitfall: "格號相差 1 不一定水平相鄰，例如 7 與 8 跨列；皇后本題不能斜走。",
    traceLabel: "示意：國王 56，皇后 48→49",
    trace: [
      {
        title: "起始狀態",
        description: "56=(7,0)，48=(6,0)，兩棋不重疊。",
        cells: ["K:56", "Q:48", "新:49"],
        active: [0, 1],
        variables: [["重疊", "0"]],
      },
      {
        title: "合法且非鄰格",
        description: "48 到 49 是水平一步；49=(6,1)，到國王距離 2。",
        cells: ["48→49", "距離 2"],
        active: [0, 1],
        variables: [
          ["合法移動", "1"],
          ["鄰格禁入", "0"],
        ],
      },
      {
        title: "國王無路",
        description: "國王僅有 48、57 兩個盤內鄰格，分別受皇后的列、欄攻擊。",
        cells: ["48:受攻擊", "57:受攻擊", "Stop"],
        active: [0, 1, 2],
        variables: [["安全鄰格數", "0"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <cstdlib>
using namespace std;
int main() {
    int k, q, n;
    while (cin >> k >> q >> n) {
        if (k == q) {
            cout << "Illegal state\n";
            continue;
        }
        bool legal = q != n && (q / 8 == n / 8 || q % 8 == n % 8);
        if (legal) {
            int step = q / 8 == n / 8 ? (n > q ? 1 : -1) : (n > q ? 8 : -8);
            for (int p = q + step;; p += step) {
                if (p == k)
                    legal = false;
                if (p == n)
                    break;
            }
        }
        if (!legal) {
            cout << "Illegal move\n";
            continue;
        }
        if (abs(k / 8 - n / 8) + abs(k % 8 - n % 8) == 1) {
            cout << "Move not allowed\n";
            continue;
        }
        bool can = false;
        int dr[] = {-1, 1, 0, 0}, dc[] = {0, 0, -1, 1};
        for (int i = 0; i < 4; ++i) {
            int r = k / 8 + dr[i], c = k % 8 + dc[i];
            if (r >= 0 && r < 8 && c >= 0 && c < 8 && r != n / 8 && c != n % 8)
                can = true;
        }
        cout << (can ? "Continue" : "Stop") << '\n';
    }
}`,
    python: String.raw`import sys

it = iter(map(int, sys.stdin.buffer.read().split()))
for k in it:
    q, n = next(it), next(it)
    if k == q:
        print('Illegal state')
        continue
    legal = q != n and (q // 8 == n // 8 or q % 8 == n % 8)
    if legal:
        step = (1 if n > q else -1) * (1 if q // 8 == n // 8 else 8)
        legal = k not in range(q + step, n + step, step)
    if not legal:
        print('Illegal move')
    elif abs(k // 8 - n // 8) + abs(k % 8 - n % 8) == 1:
        print('Move not allowed')
    else:
        safe = any(
            0 <= r < 8 and 0 <= c < 8 and r != n // 8 and c != n % 8
            for r, c in (
                (k // 8 - 1, k % 8),
                (k // 8 + 1, k % 8),
                (k // 8, k % 8 - 1),
                (k // 8, k % 8 + 1),
            )
        )
        print('Continue' if safe else 'Stop')
`,
  }),
  defineCpeLesson("a794", {
    topic: "dp",
    level: "hard",
    concept: "有限付款與無限找零的雙動態規劃",
    goal: "枚舉實際付額，最小化付出與找回的硬幣總數。",
    explanation: [
      "把金額統一除以 5 分，面額變為 1、2、4、10、20、40，價格 p<100。p=0 時不必交換硬幣，答案為 0。p>0 時，任意逐枚取錢包硬幣直到首次達到 p；因每枚至少 1 單位，至多付 p 枚，且最後一枚至多 40 單位，故溢付至多 39。店家用 1 單位硬幣找零至多 39 枚，因此必存在總交換數不超過 B=p+39≤138 的解。",
      "最優解的付出枚數不超過總交換數，因此至多 B 枚，付額至多 W=40B≤5520。各面額只需保留 min(原數量,B) 枚；先移除數量字串可選的前導正號，再逐字讀數量並飽和到 B，之後才做任何數量乘法，不將巨大數量轉成固定長度整數，也不計算整個錢包總值。這個裁切仍保留至少一個最優解。",
      "pay[s] 表示有限硬幣付出 s 的最少枚數，pay[0]=0，只計算到 W。將裁切後數量二進位分組，對每組做由大到小的 0/1 背包轉移，確保不超用；一組 g 枚的重量為 gv、成本為 g。店家的 change[s] 則以各面額無限、由小到大的轉移求最少找零枚數。",
      "對每個可達且 p≤s≤W 的付額，取 pay[s]+change[s−p] 的最小值。價格以字串轉成整數分，小數不足兩位時在右側補零，例如 0.5 是 50 分；不使用浮點數。六個數量字串全為 0 時立即結束，不再讀價格；答案靠右寬度 3。",
    ],
    complexity:
      "B=p+39≤138、W=40B≤5520、cᵢ′=min(cᵢ,B)；DP 時間 O(WΣlog(cᵢ′+1)+6W)，工作空間 O(W)。另以 O(I) 時間讀取輸入字元；C++ 保存當筆數量字串，Python 另有整份輸入緩衝 O(I)。",
    pitfall:
      "價格上限不是錢包總值上限；必須先裁切數量再乘面額。仍須考慮超額付款與找零，有限硬幣轉移不可正向更新。",
    traceLabel: "示意：有一枚 1 元、售價 0.95 元",
    trace: [
      {
        title: "縮放單位",
        description: "1 元變 20 單位，價格變 19 單位。",
        cells: ["20", "19"],
        active: [0, 1],
        variables: [["錢包枚數", "1"]],
      },
      {
        title: "有限付款",
        description: "可付金額只有 0、20，唯一足額付款為 20，使用 1 枚。",
        cells: ["pay[0]=0", "pay[20]=1"],
        active: [1],
        variables: [
          ["s", "20"],
          ["付出枚數", "1"],
        ],
      },
      {
        title: "加上找零",
        description: "店家找 20−19=1 單位，即一枚 5 分，合計 2 枚。",
        cells: ["1", "1", "2"],
        active: [2],
        variables: [
          ["change[1]", "1"],
          ["答案", "2"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
#include <iomanip>
using namespace std;
int main() {
    int v[] = {1, 2, 4, 10, 20, 40};
    string raw[6];
    while (cin >> raw[0]) {
        for (int i = 1; i < 6; ++i)
            cin >> raw[i];
        for (string &s : raw)
            if (!s.empty() && s[0] == '+')
                s.erase(0, 1);
        bool empty = true;
        for (const string &s : raw)
            if (s.find_first_not_of('0') != string::npos)
                empty = false;
        if (empty)
            break;
        string price;
        cin >> price;
        size_t pos = price.find('.');
        string whole = price.substr(0, pos);
        if (whole.empty()) whole = "0";
        string fraction = pos == string::npos ? "" : price.substr(pos + 1);
        fraction += "00";
        int p = (stoi(whole) * 100 +
                 10 * (fraction[0] - '0') + fraction[1] - '0') / 5;
        if (p == 0) {
            cout << setw(3) << 0 << '\n';
            continue;
        }
        int bound = p + 39, w = 40 * bound, c[6] = {};
        for (int i = 0; i < 6; ++i)
            for (char digit : raw[i])
                c[i] = min(bound, 10 * c[i] + digit - '0');
        const int inf = 100000000;
        vector<int> pay(w + 1, inf), change(w + 1, inf);
        pay[0] = change[0] = 0;
        for (int i = 0; i < 6; ++i) {
            int left = c[i];
            for (int group = 1; left; group *= 2) {
                int g = min(group, left);
                left -= g;
                for (int s = w; s >= g * v[i]; --s)
                    pay[s] = min(pay[s], pay[s - g * v[i]] + g);
            }
            for (int s = v[i]; s <= w; ++s)
                change[s] = min(change[s], change[s - v[i]] + 1);
        }
        int ans = inf;
        for (int s = p; s <= w; ++s)
            ans = min(ans, pay[s] + change[s - p]);
        cout << setw(3) << ans << '\n';
    }
}`,
    python: String.raw`import sys

it = iter(sys.stdin.read().split())
values = [1, 2, 4, 10, 20, 40]
for token in it:
    raw_counts = [token] + [next(it) for _ in range(5)]
    raw_counts = [count.removeprefix('+') for count in raw_counts]
    if all(not count.strip('0') for count in raw_counts):
        break
    whole, _, fraction = next(it).partition('.')
    p = (int(whole or '0') * 100 + int((fraction + '00')[:2])) // 5
    if p == 0:
        print(f'{0:3d}')
        continue
    bound = p + 39
    w = 40 * bound
    counts = []
    for raw in raw_counts:
        count = 0
        for digit in raw:
            count = min(bound, 10 * count + ord(digit) - ord('0'))
        counts.append(count)
    inf = 10**9
    pay, change = [inf] * (w + 1), [inf] * (w + 1)
    pay[0] = change[0] = 0
    for count, v in zip(counts, values):
        group = 1
        while count:
            g = min(group, count)
            count -= g
            for s in range(w, g * v - 1, -1):
                pay[s] = min(pay[s], pay[s - g * v] + g)
            group *= 2
        for s in range(v, w + 1):
            change[s] = min(change[s], change[s - v] + 1)
    print(f'{min(pay[s] + change[s - p] for s in range(p, w + 1)):3d}')
`,
  }),
  defineCpeLesson("a795", {
    topic: "dp",
    level: "medium",
    concept: "硬幣組合數的一維完全背包",
    goal: "預算到 7489 分，回答不計排列的湊錢方法數。",
    explanation: [
      "ways[0]=1 代表完全不選硬幣的唯一方法，其餘先設為 0。依序處理面額 1、5、10、25、50，每加入一個面額 v，就從 v 到上限正向更新 ways[s]+=ways[s−v]。正向更新讓同一面額能使用多次。",
      "完成某一面額後，ways[s] 恰為只用已處理面額湊成 s 的組合數。最外層固定面額，能讓同一組硬幣只有一個加入順序；若把金額放最外層就會計入排列。預先處理一次後，每筆 EOF 查詢直接查表；0 是合法查詢，不是結束標記。",
    ],
    complexity: "上限 A=7489；預處理時間 O(5A)、空間 O(A)，查詢 O(1)。",
    pitfall: "ways[0] 必須是 1；C++ 使用 long long 儲存方法數。",
    traceLabel: "示意：只觀察 5 分的 ways",
    trace: [
      {
        title: "尚未加入硬幣",
        description: "0 分有空集合一種，5 分尚無方法。",
        cells: ["ways[0]=1", "ways[5]=0"],
        active: [0],
        variables: [["已處理面額數", "0"]],
      },
      {
        title: "加入 1 分",
        description: "5 分只能用五枚 1 分，方法數成為 1。",
        cells: ["1+1+1+1+1", "ways[5]=1"],
        active: [1],
        variables: [["面額", "1"]],
      },
      {
        title: "加入 5 分",
        description: "再加一種單枚 5 分，ways[5]+=ways[0]，得到 2。",
        cells: ["1+1+1+1+1", "5", "ways[5]=2"],
        active: [2],
        variables: [
          ["面額", "5"],
          ["答案", "2"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
using namespace std;
int main() {
    vector<long long> ways(7490);
    ways[0] = 1;
    for (int v : {1, 5, 10, 25, 50})
        for (int s = v; s <= 7489; ++s)
            ways[s] += ways[s - v];
    int n;
    while (cin >> n)
        cout << ways[n] << '\n';
}`,
    python: String.raw`import sys

ways = [0] * 7490
ways[0] = 1
for v in (1, 5, 10, 25, 50):
    for s in range(v, 7490):
        ways[s] += ways[s - v]
for n in map(int, sys.stdin.buffer.read().split()):
    print(ways[n])
`,
  }),
];
