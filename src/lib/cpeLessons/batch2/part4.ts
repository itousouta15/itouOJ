import { defineCpeLesson } from "@/lib/cpeLessonBuilder";

export const lessons = [
  defineCpeLesson("a572", {
    topic: "dp",
    level: "hard",
    concept: "列前綴、欄前綴與階梯邊界DP",
    goal: "把兩種直線輸送帶的相容安排化成矩形子問題。",
    explanation: [
      "某格的yeyenum要送到西邊，該列從西邊到它的輸送帶都必須向西；bloggium送北邊則要求該欄上方都向北。因此可收成的西向區域是每列前綴，北向區域是每欄前綴。非負礦量使我們可以將無收益的衝突部分整理成一條單調階梯邊界，而不減少收益。",
      "令dp[i][j]為西北i×j矩形的最大收成。邊界最後一步若加入第i列的西向部分，就取dp[i−1][j]+該列前j格yeyenum總和；若加入第j欄的北向部分，就取dp[i][j−1]+該欄前i格bloggium總和，兩者取大。先算列與欄前綴即可常數轉移；空矩形為0，0 0結束。",
    ],
    complexity: "時間 O(nm)，空間 O(nm)，DP本身可壓成O(m)。",
    pitfall:
      "不能讓礦物轉彎或越過不同方向的輸送帶；逐格取兩種礦物較大者可能破壞整段輸送。",
    traceLabel: "示意：2×2，Y=[1,2;3,4]，B=[4,3;2,1]",
    trace: [
      {
        title: "第一格",
        description: "取西向1或北向4，dp[1,1]=4。",
        cells: ["Y列前綴1", "B欄前綴4"],
        active: [0, 1],
        variables: [["dp11", "4"]],
      },
      {
        title: "第一列與欄",
        description: "dp[1,2]=7；dp[2,1]=max(4+3,4+2)=7。",
        cells: ["dp12=7", "dp21=7"],
        active: [0, 1],
        variables: [
          ["Y第二列前2格", "7"],
          ["B第二欄前2格", "4"],
        ],
      },
      {
        title: "完整矩形",
        description: "取上方7加底列7得14；另一路7加右欄4得11。",
        cells: ["7+7=14", "7+4=11"],
        active: [0, 1],
        variables: [
          ["dp22", "14"],
          ["答案", "14"],
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
    int n, m;
    while (cin >> n >> m && (n || m)) {
        vector<vector<long long>> y(n + 1, vector<long long>(m + 1)), b = y;
        for (int i = 1; i <= n; ++i)
            for (int j = 1; j <= m; ++j) {
                cin >> y[i][j];
                y[i][j] += y[i][j - 1];
            }
        for (int i = 1; i <= n; ++i)
            for (int j = 1; j <= m; ++j) {
                cin >> b[i][j];
                b[i][j] += b[i - 1][j];
            }
        vector<long long> dp(m + 1);
        for (int i = 1; i <= n; ++i)
            for (int j = 1; j <= m; ++j)
                dp[j] = max(dp[j] + y[i][j], dp[j - 1] + b[i][j]);
        cout << dp[m] << '\n';
    }
}
`,
    python: String.raw`import sys

it = iter(map(int, sys.stdin.buffer.read().split()))
for n in it:
    m = next(it)
    if n == m == 0:
        break
    west = [[0] * (m + 1) for _ in range(n + 1)]
    north = [[0] * (m + 1) for _ in range(n + 1)]
    for i in range(1, n + 1):
        for j in range(1, m + 1):
            west[i][j] = west[i][j - 1] + next(it)
    for i in range(1, n + 1):
        for j in range(1, m + 1):
            north[i][j] = north[i - 1][j] + next(it)
    dp = [0] * (m + 1)
    for i in range(1, n + 1):
        for j in range(1, m + 1):
            dp[j] = max(dp[j] + west[i][j], dp[j - 1] + north[i][j])
    print(dp[m])
`,
  }),
  defineCpeLesson("a573", {
    topic: "simulation",
    level: "easy",
    concept: "雙緩衝的同步格點更新",
    goal: "所有勝負都讀取同一天的舊地圖。",
    explanation: [
      "每個物種只有一種天敵：R怕P、P怕S、S怕R。檢查一格的四個舊鄰居，只要有天敵，下一天就改成天敵，否則保持原物種。不需比較鄰居多寡，因為所有能打敗它的鄰居都是同一物種。",
      "每一天建立新地圖next，全部格子都以old讀取，完成後才交換。若直接在old逐格修改，早先變化會影響後面格子的判斷，變成錯誤的連鎖更新。做滿指定天數，n=0時原圖直接輸出；兩組地圖之間留一空行。",
    ],
    complexity: "時間 O(天數×列數×欄數)，空間 O(列數×欄數)。",
    pitfall: "只能上下左右交戰，不含對角；同日所有變化必須同步。",
    traceLabel: "示意：一列 RSP，模擬兩天",
    trace: [
      {
        title: "第0天",
        description: "R剋S，S剋P，但尚未更新。",
        cells: ["R", "S", "P"],
        active: [0, 1, 2],
        variables: [["天數", "0"]],
      },
      {
        title: "第1天",
        description: "左R沒有P鄰居保留；中S被R取代；右P被原本中S取代。",
        cells: ["R", "R", "S"],
        active: [0, 1, 2],
        variables: [["天數", "1"]],
      },
      {
        title: "第2天",
        description: "右S被旁邊R取代，變RRR。",
        cells: ["R", "R", "R"],
        active: [0, 1, 2],
        variables: [
          ["天數", "2"],
          ["R個數", "3"],
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
    for (int tc = 0; tc < t; ++tc) {
        int r, c, days;
        cin >> r >> c >> days;
        vector<string> g(r);
        for (auto &s : g)
            cin >> s;
        while (days--) {
            auto next = g;
            for (int i = 0; i < r; ++i)
                for (int j = 0; j < c; ++j) {
                    char enemy = g[i][j] == 'R' ? 'P' : g[i][j] == 'P' ? 'S' : 'R';
                    for (auto [di, dj] : vector<pair<int, int>>{{1, 0}, {-1, 0}, {0, 1}, {0, -1}}) {
                        int x = i + di, y = j + dj;
                        if (x >= 0 && x < r && y >= 0 && y < c && g[x][y] == enemy)
                            next[i][j] = enemy;
                    }
                }
            g.swap(next);
        }
        if (tc)
            cout << '\n';
        for (auto &s : g)
            cout << s << '\n';
    }
}
`,
    python: String.raw`import sys

it = iter(sys.stdin.read().split())
groups = []
enemy = {"R": "P", "P": "S", "S": "R"}
for _ in range(int(next(it))):
    rows, cols, days = int(next(it)), int(next(it)), int(next(it))
    grid = [next(it) for _ in range(rows)]
    for _ in range(days):
        after = [list(row) for row in grid]
        for r in range(rows):
            for c in range(cols):
                predator = enemy[grid[r][c]]
                for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    x, y = r + dr, c + dc
                    if 0 <= x < rows and 0 <= y < cols and grid[x][y] == predator:
                        after[r][c] = predator
                        break
        grid = ["".join(row) for row in after]
    groups.append("\n".join(grid))
print("\n\n".join(groups))
`,
  }),
  defineCpeLesson("a574", {
    topic: "basics",
    level: "easy",
    concept: "年內序號對7取餘數",
    goal: "把2011年的日期換成距離已知星期的日數。",
    explanation: [
      "2011不是閏年，二月固定28天。將給定日期轉成從1月1日起算的零起點日數day=前面月份總天數+D−1。日期每增加一天，星期也向後一格，因此只需要day對7取餘數。",
      "由題目已知4月4日星期一可回推1月1日星期六；以Monday到Sunday編號0..6，1月1日偏移為5，答案為week[(day+5)%7]。預先保存十二個月長即可，不用套用一般年份的複雜曆法公式。每筆只印完整英文星期名，不加Case標籤。",
    ],
    complexity: "每筆時間 O(12)=O(1)，空間 O(1)。",
    pitfall: "輸入順序是月、日；2011不是閏年，二月不能用29天。",
    traceLabel: "示意：2011年1月1日、1月3日、1月8日",
    trace: [
      {
        title: "基準日",
        description: "1月1日day=0，(0+5)%7=5，Saturday。",
        cells: ["day0", "索引5"],
        active: [0, 1],
        variables: [["星期", "Saturday"]],
      },
      {
        title: "加兩天",
        description: "1月3日day=2，(2+5)%7=0，Monday。",
        cells: ["day2", "索引0"],
        active: [0, 1],
        variables: [["星期", "Monday"]],
      },
      {
        title: "整週循環",
        description: "1月8日day=7，(7+5)%7=5，又是Saturday。",
        cells: ["day7", "索引5"],
        active: [0, 1],
        variables: [
          ["相差天數", "7"],
          ["星期", "Saturday"],
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
    vector<int> month{31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31};
    vector<string> week{"Monday", "Tuesday",  "Wednesday", "Thursday",
                        "Friday", "Saturday", "Sunday"};
    int t;
    cin >> t;
    while (t--) {
        int m, d;
        cin >> m >> d;
        int day = d - 1;
        for (int i = 0; i < m - 1; ++i)
            day += month[i];
        cout << week[(day + 5) % 7] << '\n';
    }
}
`,
    python: String.raw`import sys

month = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
week = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
it = iter(map(int, sys.stdin.read().split()))
for _ in range(next(it)):
    m, d = next(it), next(it)
    day = sum(month[: m - 1]) + d - 1
    print(week[(day + 5) % 7])
`,
  }),
  defineCpeLesson("a575", {
    topic: "sorting",
    level: "medium",
    concept: "排序地形後逐層注水",
    goal: "用已納入低地面積求水位，嚴格判定淹沒比例。",
    explanation: [
      "每格面積100平方公尺，水量V先除以100，換成所有格子的高度增量總和。將高度由小到大排序，假設最低k格已連通，且其高度總和為S，若水只分在這k格，水位就是 (V/100+S)/k。",
      "逐一加入低地，檢查目前水量是否足以升到下一個高度：所需體積為100×(k×下一高度−S)。若不夠或恰好到達，水位是(V+100S)/(100k)；超過才繼續納入下一格。最後以100k×高度<V+100S精確判斷淹沒，恰等於水面不算，V=0時淹沒率0。輸出將有理數直接四捨五入到百分位，避免−7.835的浮點誤差；每組末尾空一行。",
    ],
    complexity: "時間 O(mn log(mn))，空間 O(mn)。",
    pitfall:
      "一格面積是100而不是10；淹沒條件是高度<水位，不是≤。負高度照常排序。",
    traceLabel: "示意：三格高度0、10、20，水量1000",
    trace: [
      {
        title: "最低一格",
        description: "升到第二格高度10需要(10−0)×100=1000。",
        cells: ["0", "10", "20"],
        active: [0, 1, 2],
        variables: [
          ["水量", "1000"],
          ["所需", "1000"],
        ],
      },
      {
        title: "平衡水位",
        description: "水恰好到10，第二格仍不算完全淹沒。",
        cells: ["水面10", "高度0:淹沒", "高度10:未淹沒"],
        active: [0, 1, 2],
        variables: [["水位", "10.00"]],
      },
      {
        title: "百分比",
        description: "只有一格高度嚴格小於10，比例100/3=33.33%。",
        cells: ["淹沒1格", "總共3格"],
        active: [0, 1],
        variables: [
          ["比例", "33.33"],
          ["水位", "10.00"],
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

string cents(long long numerator, long long denominator) {
    bool negative = numerator < 0;
    long long value = abs(numerator), whole = value / denominator;
    if (2 * (value % denominator) >= denominator)
        ++whole;
    ostringstream out;
    if (negative && whole)
        out << '-';
    out << whole / 100 << '.' << setw(2) << setfill('0') << whole % 100;
    return out.str();
}
int main() {
    int m, n, tc = 0;
    while (cin >> m >> n && (m || n)) {
        int total = m * n;
        vector<long long> h(total);
        for (auto &x : h)
            cin >> x;
        long long volume;
        cin >> volume;
        sort(h.begin(), h.end());
        long long sum = 0, numerator = 0;
        int wetArea = 1;
        for (int k = 1; k <= total; ++k) {
            sum += h[k - 1];
            if (k == total || 100LL * (k * h[k] - sum) >= volume) {
                // Exact level is numerator/(100*wetArea).
                numerator = volume + 100 * sum;
                wetArea = k;
                break;
            }
        }
        int under = 0;
        for (long long x : h)
            if (100 * x * wetArea < numerator)
                ++under;
        cout << "Region " << ++tc << "\nWater level is " << cents(numerator, wetArea)
             << " meters.\n";
        cout << cents(10000LL * under, total) << " percent of the region is under water.\n\n";
    }
}
`,
    python: String.raw`import sys


def cents(numerator, denominator):
    whole, remainder = divmod(abs(numerator), denominator)
    if 2 * remainder >= denominator:
        whole += 1
    sign = "-" if numerator < 0 and whole else ""
    return f"{sign}{whole // 100}.{whole % 100:02d}"


it = iter(map(int, sys.stdin.read().split()))
case = 0
for rows in it:
    cols = next(it)
    if rows == cols == 0:
        break
    height = sorted(next(it) for _ in range(rows * cols))
    volume = next(it)
    total, prefix = len(height), 0
    for k in range(1, total + 1):
        prefix += height[k - 1]
        if k == total or 100 * (k * height[k] - prefix) >= volume:
            numerator = volume + 100 * prefix
            wet_area = k
            break
    under = sum(100 * value * wet_area < numerator for value in height)
    case += 1
    print(f"Region {case}")
    print(f"Water level is {cents(numerator, wet_area)} meters.")
    print(f"{cents(10000 * under, total)} percent of the region is under water.")
    print()
`,
  }),
  defineCpeLesson("a576", {
    topic: "sorting",
    level: "medium",
    concept: "相反順序配對的交換論證",
    goal: "讓短早班搭配長晚班，平衡超時的總成本。",
    explanation: [
      "把早班由短到長排、晚班由長到短排，再逐對計算max(0,早+晚−d)×r。這種配對把大工作量互相分散，避免兩條長路線擠在同一人身上，而另一人工作量仍未超過門檻。",
      "令a≤b、x≤y，超時函數f(t)=max(0,t−d)是凸的，故f(a+x)+f(b+y)≥f(a+y)+f(b+x)。交換同向配對為反向配對不會增加成本，反覆交換後即可得到排序方案，因此它達到全域最小。0 0 0結束，不能把所有長度總和減nd後直接當超時量。",
    ],
    complexity: "時間 O(n log n)，空間 O(n)。",
    pitfall: "低於d的空閒時間不能抵銷另一位的超時；每對先max(0,...)再累加。",
    traceLabel: "示意：早班5、15，晚班5、15，d=20、r=2",
    trace: [
      {
        title: "同向配對",
        description: "5+5=10不超時，15+15=30超時10，費用20。",
        cells: ["10→0", "30→20"],
        active: [0, 1],
        variables: [["總費用", "20"]],
      },
      {
        title: "反向配對",
        description: "短早班搭長晚班，5+15=20；另一對15+5=20。",
        cells: ["20", "20"],
        active: [0, 1],
        variables: [["兩人超時", "0、0"]],
      },
      {
        title: "總成本",
        description: "兩人都沒超過20，最少費用0。",
        cells: ["0+0=0"],
        active: [0],
        variables: [["答案", "0"]],
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
    int n, d, r;
    while (cin >> n >> d >> r && (n || d || r)) {
        vector<int> a(n), b(n);
        for (int &x : a)
            cin >> x;
        for (int &x : b)
            cin >> x;
        sort(a.begin(), a.end());
        sort(b.rbegin(), b.rend());
        long long ans = 0;
        for (int i = 0; i < n; ++i)
            ans += 1LL * max(0, a[i] + b[i] - d) * r;
        cout << ans << '\n';
    }
}
`,
    python: String.raw`import sys

it = iter(map(int, sys.stdin.read().split()))
for n in it:
    limit, rate = next(it), next(it)
    if n == limit == rate == 0:
        break
    morning = sorted(next(it) for _ in range(n))
    evening = sorted((next(it) for _ in range(n)), reverse=True)
    print(sum(max(0, a + b - limit) * rate for a, b in zip(morning, evening)))
`,
  }),
  defineCpeLesson("a577", {
    topic: "graphs",
    level: "medium",
    concept: "既有線權重為零的最小生成樹",
    goal: "用稠密Prim避免儲存所有建築對。",
    explanation: [
      "新接兩棟建築的成本是歐式距離，但既有線路的追加成本為0。把既有邊視為零權邊後，在完全圖上求最小生成樹，所選正權邊的總和就是需要新增的最少長度，因為零權連通部分可以免費保留。",
      "用Prim維持每個未加入點與目前樹之間的最小成本，每次選最小者再更新全部剩餘點。比較時可保存距離平方，因平方根嚴格單調，只有真正加入邊時才開根號累加；既有線的平方成本仍為0。N≤750，O(N²)足夠且不用儲存約N²/2條浮點邊。每組讀至EOF，輸出兩位小數。",
    ],
    complexity: "時間 O(N²+M)，空間 O(N²)，其中既有邊矩陣佔O(N²)。",
    pitfall:
      "既有線不需重新付長度；線段交叉不代表相連，只有建築物端點建立連通。",
    traceLabel: "示意：A(0,0)、B(3,0)、C(3,4)，已有AB",
    trace: [
      {
        title: "從A開始",
        description: "A到B已有線，成本0；A到C距離5，平方25。",
        cells: ["keyB=0", "keyC=25"],
        active: [0, 1],
        variables: [["已加長度", "0"]],
      },
      {
        title: "加入B",
        description: "免費接B，再更新C到B的平方距離為16。",
        cells: ["A—B:0", "keyC=16"],
        active: [0, 1],
        variables: [["已加長度", "0"]],
      },
      {
        title: "加入C",
        description: "新增BC長sqrt(16)=4，全校連通。",
        cells: ["AB既有", "BC新增4"],
        active: [0, 1],
        variables: [["總新增長度", "4.00"]],
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
    int n;
    while (cin >> n) {
        vector<long long> x(n), y(n);
        for (int i = 0; i < n; ++i)
            cin >> x[i] >> y[i];
        vector<vector<bool>> existing(n, vector<bool>(n));
        int m;
        cin >> m;
        while (m--) {
            int u, v;
            cin >> u >> v;
            existing[u - 1][v - 1] = existing[v - 1][u - 1] = true;
        }
        vector<long long> key(n, numeric_limits<long long>::max());
        vector<bool> used(n);
        key[0] = 0;
        double ans = 0;
        for (int step = 0; step < n; ++step) {
            int u = -1;
            for (int i = 0; i < n; ++i)
                if (!used[i] && (u == -1 || key[i] < key[u]))
                    u = i;
            used[u] = true;
            ans += sqrt(double(key[u]));
            for (int v = 0; v < n; ++v)
                if (!used[v]) {
                    long long dx = x[u] - x[v], dy = y[u] - y[v];
                    long long cost = existing[u][v] ? 0 : dx * dx + dy * dy;
                    key[v] = min(key[v], cost);
                }
        }
        cout << fixed << setprecision(2) << ans << '\n';
    }
}
`,
    python: String.raw`import sys
from math import sqrt

it = iter(map(int, sys.stdin.read().split()))
for n in it:
    points = [(next(it), next(it)) for _ in range(n)]
    existing = [bytearray(n) for _ in range(n)]
    for _ in range(next(it)):
        u, v = next(it) - 1, next(it) - 1
        existing[u][v] = existing[v][u] = 1
    key, used = [10**30] * n, [False] * n
    key[0] = 0
    answer = 0.0
    for _ in range(n):
        u = min((i for i in range(n) if not used[i]), key=key.__getitem__)
        used[u] = True
        answer += sqrt(key[u])
        x, y = points[u]
        for v, (a, b) in enumerate(points):
            if not used[v]:
                cost = 0 if existing[u][v] else (x - a) ** 2 + (y - b) ** 2
                if cost < key[v]:
                    key[v] = cost
    print(f"{answer:.2f}")
`,
  }),
  defineCpeLesson("a578", {
    topic: "number-theory",
    level: "medium",
    concept: "因數倍數篩與前綴最佳值",
    goal: "一次預算支援五萬次含平手規則的查詢。",
    explanation: [
      "要算1..U的因數個數，逐一枚舉d，再把d的每個倍數的計數加1。每個正因數都會且只會為它的倍數貢獻一次，所以得到所有divisors[x]，總迭代量是U(1+1/2+…+1/U)，即O(U log U)。",
      "接著由1往U掃描，best保存目前因數數量最多且值最大的整數。遇到divisors[x]≥divisors[best]就更新成x，等號恰好實現平手取較大者。保存prefix[x]=best，每個查詢直接索引。讀完全部查詢後只預算到最大N即可；Python以array壓縮計數與答案記憶體。",
    ],
    complexity: "預算時間 O(U log U)，查詢 O(1)，空間 O(U+T)。",
    pitfall: "更新條件需要≥；若只用>，N=10時會停在6而漏掉平手較大的10。",
    traceLabel: "示意：查詢N=10",
    trace: [
      {
        title: "走到6",
        description: "6的因數1、2、3、6，共4個，成為最佳。",
        cells: ["d(6)=4"],
        active: [0],
        variables: [["best", "6"]],
      },
      {
        title: "走到8",
        description: "8也有1、2、4、8四個因數，平手更新成8。",
        cells: ["d(8)=4"],
        active: [0],
        variables: [["best", "8"]],
      },
      {
        title: "走到10",
        description: "10的因數1、2、5、10也是4個，再更新為10。",
        cells: ["d(10)=4"],
        active: [0],
        variables: [
          ["prefix[10]", "10"],
          ["答案", "10"],
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
    int t;
    cin >> t;
    vector<int> q(t);
    for (int &x : q)
        cin >> x;
    int limit = q.empty() ? 0 : *max_element(q.begin(), q.end());
    vector<int> divisors(limit + 1), prefix(limit + 1);
    for (int d = 1; d <= limit; ++d)
        for (int v = d; v <= limit; v += d)
            ++divisors[v];
    int best = 0;
    for (int v = 1; v <= limit; ++v) {
        if (divisors[v] >= divisors[best])
            best = v;
        prefix[v] = best;
    }
    for (int v : q)
        cout << prefix[v] << '\n';
}
`,
    python: String.raw`import sys
from array import array

data = list(map(int, sys.stdin.buffer.read().split()))
queries = data[1 : 1 + data[0]]
limit = max(queries, default=0)
divisors = array("H", [0]) * (limit + 1)
prefix = array("I", [0]) * (limit + 1)
for divisor in range(1, limit + 1):
    for value in range(divisor, limit + 1, divisor):
        divisors[value] += 1
best = 0
for value in range(1, limit + 1):
    if divisors[value] >= divisors[best]:
        best = value
    prefix[value] = best
print("\n".join(str(prefix[value]) for value in queries))
`,
  }),
  defineCpeLesson("a579", {
    topic: "number-theory",
    level: "easy",
    concept: "大整數字串模最小公倍數",
    goal: "只維護餘數即可判斷所有指定整除條件。",
    explanation: [
      "一個整數能被集合S的所有數整除，等價於能被它們的最小公倍數L整除。S只包含1到12，所以L最多是lcm(1..12)=27720，不需要建立上千位的大整數。",
      "由左向右讀M的十進位數字，維持目前前綴的餘數rem；加入數字d後更新(rem×10+d)%L。這是把前綴擴大十倍再加新個位數的直接推導。最後餘數0印原字串加 - Wonderful.，否則印 - Simple.；M=0可被所有正數整除。保留原數字字串作輸出。",
    ],
    complexity: "每筆時間 O(|M|+|S| log 12)，空間 O(|M|)。",
    pitfall: "不能把M讀入64位元，也不能以所有除數的乘積代替LCM造成不必要溢位。",
    traceLabel: "示意：M=132，S={3,4,11}",
    trace: [
      {
        title: "合併條件",
        description: "lcm(3,4)=12，再與11合成132。",
        cells: ["L=132"],
        active: [0],
        variables: [["除數個數", "3"]],
      },
      {
        title: "逐位取餘",
        description: "讀1得1，接3得13。",
        cells: ["1→1", "13→13"],
        active: [0, 1],
        variables: [["rem", "13"]],
      },
      {
        title: "完成",
        description: "接2為132，132 mod132=0，因此Wonderful。",
        cells: ["132→0"],
        active: [0],
        variables: [
          ["rem", "0"],
          ["輸出", "132 - Wonderful."],
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
        string m;
        int count;
        cin >> m >> count;
        int multiple = 1;
        while (count--) {
            int x;
            cin >> x;
            multiple = lcm(multiple, x);
        }
        int remainder = 0;
        for (char c : m)
            remainder = (remainder * 10 + c - '0') % multiple;
        cout << m << " - " << (remainder == 0 ? "Wonderful." : "Simple.") << '\n';
    }
}
`,
    python: String.raw`import sys
from math import gcd

it = iter(sys.stdin.read().split())
for _ in range(int(next(it))):
    number, count = next(it), int(next(it))
    multiple = 1
    for _ in range(count):
        x = int(next(it))
        multiple = multiple // gcd(multiple, x) * x
    remainder = 0
    for digit in number:
        remainder = (remainder * 10 + ord(digit) - 48) % multiple
    print(number + " - " + ("Wonderful." if remainder == 0 else "Simple."))
`,
  }),
  defineCpeLesson("a580", {
    topic: "geometry",
    level: "hard",
    concept: "線段參數化與球體交集",
    goal: "把三維長度比例改成參數區間長度，正確截取端點。",
    explanation: [
      "將路徑寫成P(t)=A+t(B−A)，0≤t≤1。對球心C、半徑r，令D=B−A、F=A−C，球內條件為(D·D)t²+2(F·D)t+(F·F−r²)≤0。解二次方程得到進出球體的兩個參數t₁、t₂；判別式≤0時沒有正長度的球內部分。",
      "把每個交集截成[max(0,t₁),min(1,t₂)]，只有右端大於左端才累加。參數長度乘整條線段長才是實際污染長，但除以總長後正好抵消，因此百分比是參數長總和×100。球體互不重疊，可直接相加。讀至EOF，每組先印城市名，再印兩位小數且不加百分號；零長路徑無正長度部分，程式約定輸出0。",
    ],
    complexity: "每筆時間 O(球數)，空間 O(1)（不含輸出）。",
    pitfall:
      "必須裁切到有限線段[0,1]，不能把無限直線穿球的整條弦長都算進去；相切不貢獻長度。",
    traceLabel: "示意：路徑(0,0,0)到(10,0,0)，球心(5,0,0)、r=2",
    trace: [
      {
        title: "建立方程",
        description: "D=(10,0,0)，F=(−5,0,0)，方程100t²−100t+21=0。",
        cells: ["a=100", "b=−100", "c=21"],
        active: [0, 1, 2],
        variables: [["判別式", "1600"]],
      },
      {
        title: "解交點",
        description: "兩根為(100±40)/200，即0.3與0.7，都在線段內。",
        cells: ["t進=0.3", "t出=0.7"],
        active: [0, 1],
        variables: [["污染參數長", "0.4"]],
      },
      {
        title: "計算百分比",
        description: "實際污染長4、全長10，比率40%。",
        cells: ["4/10", "0.4×100"],
        active: [0, 1],
        variables: [["輸出", "40.00"]],
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
    string name;
    while (cin >> name) {
        array<double, 3> a, b;
        for (auto &x : a)
            cin >> x;
        for (auto &x : b)
            cin >> x;
        array<double, 3> d;
        double aa = 0;
        for (int i = 0; i < 3; ++i) {
            d[i] = b[i] - a[i];
            aa += d[i] * d[i];
        }
        int n;
        cin >> n;
        double fraction = 0;
        while (n--) {
            array<double, 3> center;
            double radius;
            for (auto &x : center)
                cin >> x;
            cin >> radius;
            if (aa == 0)
                continue;
            double bb = 0, cc = -radius * radius;
            for (int i = 0; i < 3; ++i) {
                double f = a[i] - center[i];
                bb += 2 * f * d[i];
                cc += f * f;
            }
            double discriminant = bb * bb - 4 * aa * cc;
            if (discriminant <= 0)
                continue;
            double root = sqrt(discriminant), left = max(0.0, (-bb - root) / (2 * aa)),
                   right = min(1.0, (-bb + root) / (2 * aa));
            fraction += max(0.0, right - left);
        }
        cout << name << '\n' << fixed << setprecision(2) << min(100.0, 100 * fraction) << '\n';
    }
}
`,
    python: String.raw`import sys
from math import sqrt

it = iter(sys.stdin.read().split())
for name in it:
    start = [float(next(it)) for _ in range(3)]
    end = [float(next(it)) for _ in range(3)]
    direction = [b - a for a, b in zip(start, end)]
    aa = sum(x * x for x in direction)
    fraction = 0.0
    for _ in range(int(next(it))):
        center = [float(next(it)) for _ in range(3)]
        radius = float(next(it))
        if aa == 0:
            continue
        offset = [a - c for a, c in zip(start, center)]
        bb = 2 * sum(f * d for f, d in zip(offset, direction))
        cc = sum(f * f for f in offset) - radius * radius
        discriminant = bb * bb - 4 * aa * cc
        if discriminant <= 0:
            continue
        root = sqrt(discriminant)
        left = max(0.0, (-bb - root) / (2 * aa))
        right = min(1.0, (-bb + root) / (2 * aa))
        fraction += max(0.0, right - left)
    print(name)
    print(f"{min(100.0, 100 * fraction):.2f}")
`,
  }),
  defineCpeLesson("a581", {
    topic: "basics",
    level: "easy",
    concept: "字典查詢與兩個期限邊界",
    goal: "先查專長，再按準時、寬限、無法完成三段判斷。",
    explanation: [
      "把科目名稱對應到所需天數。查詢科目若存在，將天數t與期限D比較：t≤D為Yesss；D<t≤D+5為Late；t>D+5才是Do your own homework!。這三個區間互斥且涵蓋所有可能。",
      "若字典沒有該科目，無論D多大都不能請她完成，直接用最後一種回覆。查不到時可使用無限大預設值，統一落入超時分支。每筆重建專長表，編號從1起，輸出Case k:結果，注意Yesss的三個s與最後訊息的驚嘆號。",
    ],
    complexity: "C++時間 O(N log N)，Python期望 O(N)；空間 O(N)。",
    pitfall: "D+5仍可接受為Late；未知科目不能當作0天而判準時。",
    traceLabel: "示意：math需9天，期限D=4",
    trace: [
      {
        title: "讀取專長",
        description: "表中math對應9天。",
        cells: ["math→9"],
        active: [0],
        variables: [["所需t", "9"]],
      },
      {
        title: "比較期限",
        description: "9>4，因此不是準時。",
        cells: ["t=9", "D=4"],
        active: [0, 1],
        variables: [["準時", "0"]],
      },
      {
        title: "比較寬限",
        description: "D+5=9，9≤9仍在寬限內，輸出Late。",
        cells: ["9≤4+5"],
        active: [0],
        variables: [["結果", "Late"]],
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
        int n;
        cin >> n;
        map<string, int> days;
        while (n--) {
            string s;
            int d;
            cin >> s >> d;
            days[s] = d;
        }
        int limit;
        string subject;
        cin >> limit >> subject;
        auto it = days.find(subject);
        int need = it == days.end() ? 1000000 : it->second;
        string answer = need <= limit       ? "Yesss"
                        : need <= limit + 5 ? "Late"
                                            : "Do your own homework!";
        cout << "Case " << tc << ": " << answer << '\n';
    }
}
`,
    python: String.raw`import sys

it = iter(sys.stdin.read().split())
for case in range(1, int(next(it)) + 1):
    n = int(next(it))
    days = {}
    for _ in range(n):
        subject, duration = next(it), int(next(it))
        days[subject] = duration
    limit, subject = int(next(it)), next(it)
    required = days.get(subject, float("inf"))
    answer = (
        "Yesss"
        if required <= limit
        else "Late"
        if required <= limit + 5
        else "Do your own homework!"
    )
    print(f"Case {case}: {answer}")
`,
  }),
  defineCpeLesson("a582", {
    topic: "search",
    level: "hard",
    concept: "枚舉第一列後逐列強制消燈",
    goal: "用位元遮罩推導後續按法，找出總按鈕數最少者。",
    explanation: [
      "按同一個開關兩次會抵銷，而且操作可交換順序，因此每格只需考慮按0或1次。枚舉第一列的2¹⁰種按法後，第二列必須在第一列仍亮的位置按下，否則再往後的列已無法影響第一列；如此逐列強制決定。",
      "以10位遮罩表示一列。當本列按法為p、前列按法為prev，本列初始燈為g時，下一列必須按 (g xor p xor (p<<1) xor (p>>1) xor prev)&1023。完成第10列後，下一個需求必須為0才是合法解。加總各列遮罩的1數取最小，找不到輸出−1，名稱end結束。",
    ],
    complexity: "每組時間 O(2¹⁰×10)，空間 O(10)。",
    pitfall:
      "左右移位後須遮回10位，防止跨欄；最後一列下方不存在開關，不能繼續按來補救。",
    traceLabel: "示意：只有按(0,0)會影響的三盞燈亮",
    trace: [
      {
        title: "初始燈",
        description: "第一列前兩格亮，第二列第一格亮，其餘滅。",
        cells: ["row0 mask=3", "row1 mask=1", "row2..9=0"],
        active: [0, 1, 2],
        variables: [["亮燈數", "3"]],
      },
      {
        title: "枚舉首列按1",
        description: "p0=1會翻轉本列mask3與下一列mask1。",
        cells: ["首列需求3 xor1 xor2=0", "第二列翻轉1"],
        active: [0, 1],
        variables: [
          ["首列按次", "1"],
          ["p1", "0"],
        ],
      },
      {
        title: "後續均不用按",
        description: "第二列初始1已被上列按法抵銷，所有後續需求0。",
        cells: ["p1..p9=0", "最後需求0"],
        active: [0, 1],
        variables: [
          ["總按次", "1"],
          ["答案", "1"],
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
    string name;
    while (cin >> name && name != "end") {
        array<int, 10> g{};
        for (int r = 0; r < 10; ++r) {
            string s;
            cin >> s;
            for (int c = 0; c < 10; ++c)
                if (s[c] == 'O')
                    g[r] |= 1 << c;
        }
        int best = 101;
        for (int first = 0; first < 1024; ++first) {
            int previous = 0, current = first, count = 0;
            for (int r = 0; r < 10; ++r) {
                for (int v = current; v; v &= v - 1)
                    ++count;
                int next = (g[r] ^ current ^ (current << 1) ^ (current >> 1) ^ previous) & 1023;
                previous = current;
                current = next;
            }
            if (current == 0)
                best = min(best, count);
        }
        cout << name << ' ' << (best <= 100 ? best : -1) << '\n';
    }
}
`,
    python: String.raw`import sys

it = iter(sys.stdin.read().split())
for name in it:
    if name == "end":
        break
    grid = [sum(1 << c for c, ch in enumerate(next(it)) if ch == "O") for _ in range(10)]
    best = 101
    for first in range(1024):
        previous, current, presses = 0, first, 0
        for row in range(10):
            presses += current.bit_count()
            after = (grid[row] ^ current ^ (current << 1) ^ (current >> 1) ^ previous) & 1023
            previous, current = current, after
        if current == 0:
            best = min(best, presses)
    print(name, best if best <= 100 else -1)
`,
  }),
  defineCpeLesson("a583", {
    topic: "sorting",
    level: "easy",
    concept: "排序正規化與最高頻率總人數",
    goal: "把不同排列的同一課程集合映成同一鍵。",
    explanation: [
      "每位學生的五門課先由小到大排序，將排序後的五元組當作組合鍵。因為課程皆不同，兩人選同一組課若且唯若排序結果相同，所以可以用計數映射累計人氣。",
      "讀完先找最高頻率best，再將所有頻率等於best的組合人數相加。若三種組合各一人，best=1但答案是3，不是1；若只有一種最高頻率2，答案才是2。n=0結束，每組只印總人數一行，不印課程或最高頻率。",
    ],
    complexity:
      "C++時間 O(n log n)，Python期望 O(n)（每人固定5門）；空間 O(n)。",
    pitfall:
      "答案是並列最熱門組合的學生總數，不是組合數，也不是只取一個最大頻率。",
    traceLabel: "示意：四人分別選A、A、B、B兩種五門課組合",
    trace: [
      {
        title: "前兩人",
        description: "兩人的課程排序後相同，A人氣2。",
        cells: ["A:2"],
        active: [0],
        variables: [["學生數", "2"]],
      },
      {
        title: "後兩人",
        description: "另一組B也有2人，與A並列。",
        cells: ["A:2", "B:2"],
        active: [0, 1],
        variables: [["最高頻率", "2"]],
      },
      {
        title: "合計",
        description: "兩個熱門組合各2人，答案4。",
        cells: ["2+2=4"],
        active: [0],
        variables: [
          ["熱門組合數", "2"],
          ["學生答案", "4"],
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
    int n;
    while (cin >> n && n) {
        map<array<int, 5>, int> freq;
        while (n--) {
            array<int, 5> a;
            for (int &x : a)
                cin >> x;
            sort(a.begin(), a.end());
            ++freq[a];
        }
        int best = 0, ans = 0;
        for (auto &entry : freq)
            best = max(best, entry.second);
        for (auto &entry : freq)
            if (entry.second == best)
                ans += entry.second;
        cout << ans << '\n';
    }
}
`,
    python: String.raw`import sys
from collections import Counter

it = iter(map(int, sys.stdin.read().split()))
for n in it:
    if n == 0:
        break
    popularity = Counter(tuple(sorted(next(it) for _ in range(5))) for _ in range(n))
    best = max(popularity.values())
    print(sum(count for count in popularity.values() if count == best))
`,
  }),
  defineCpeLesson("a584", {
    topic: "graphs",
    level: "medium",
    concept: "重要站之間的距離總和最小化",
    goal: "只從跨路線車站做BFS，平均值比較化成總和。",
    explanation: [
      "每條路線中相鄰兩站連雙向邊，行車時間都為2，因此以邊數做BFS再乘2即可。出現在至少兩條不同路線的站才是候選重要站；統計時同一路線內要先去重，避免把單一路線重複列出的站誤算成跨線。",
      "設重要站有I個，各候選平均距離分母都是I−1，且邊長倍數2也相同，所以只要比較到全部重要站的BFS邊數總和。由站號小到大枚舉，只有總和嚴格變小才更新，可自然保留平手最小站。若只有一個重要站，它到其餘站的總和為0，直接成為答案。輸出Krochanska is in: X。",
    ],
    complexity: "時間 O(I(N+E))，空間 O(N+E)，I≤100。",
    pitfall:
      "重要站是出現在多條路線，不是度數至少2；平均只計算重要站，不能對所有站求和。",
    traceLabel: "示意：路線1為1 2 3，路線2為1 4 2 5 3",
    trace: [
      {
        title: "辨認重要站",
        description: "1、2、3各出現兩線，4、5只在第二線。",
        cells: ["重要1", "重要2", "重要3", "一般4、5"],
        active: [0, 1, 2, 3],
        variables: [["重要站數", "3"]],
      },
      {
        title: "BFS距離和",
        description: "1到2、3為1、2，和3；2到1、3皆1，和2。",
        cells: ["sum1=3", "sum2=2"],
        active: [0, 1],
        variables: [["目前最佳", "2"]],
      },
      {
        title: "比較站3",
        description: "3到1、2為2、1，和3，仍以2最佳。",
        cells: ["sum1=3", "sum2=2", "sum3=3"],
        active: [0, 1, 2],
        variables: [
          ["站2平均小時", "2"],
          ["答案站", "2"],
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
    int tests;
    cin >> tests;
    while (tests--) {
        int n, s;
        cin >> n >> s;
        vector<vector<int>> g(n + 1);
        vector<int> routes(n + 1);
        while (s--) {
            vector<int> line;
            int v;
            while (cin >> v && v)
                line.push_back(v);
            for (size_t i = 1; i < line.size(); ++i) {
                g[line[i - 1]].push_back(line[i]);
                g[line[i]].push_back(line[i - 1]);
            }
            sort(line.begin(), line.end());
            line.erase(unique(line.begin(), line.end()), line.end());
            for (int u : line)
                ++routes[u];
        }
        vector<int> important;
        for (int u = 1; u <= n; ++u)
            if (routes[u] >= 2)
                important.push_back(u);
        long long best = numeric_limits<long long>::max();
        int answer = -1;
        for (int source : important) {
            vector<int> d(n + 1, -1);
            queue<int> q;
            d[source] = 0;
            q.push(source);
            while (!q.empty()) {
                int u = q.front();
                q.pop();
                for (int v : g[u])
                    if (d[v] < 0) {
                        d[v] = d[u] + 1;
                        q.push(v);
                    }
            }
            long long total = 0;
            for (int v : important)
                total += d[v];
            if (total < best) {
                best = total;
                answer = source;
            }
        }
        cout << "Krochanska is in: " << answer << '\n';
    }
}
`,
    python: String.raw`import sys
from collections import deque

it = iter(map(int, sys.stdin.read().split()))
for _ in range(next(it)):
    n, number_of_routes = next(it), next(it)
    graph = [[] for _ in range(n + 1)]
    frequency = [0] * (n + 1)
    for _ in range(number_of_routes):
        route = []
        while True:
            station = next(it)
            if station == 0:
                break
            route.append(station)
        for a, b in zip(route, route[1:]):
            graph[a].append(b)
            graph[b].append(a)
        for station in set(route):
            frequency[station] += 1
    important = [station for station in range(1, n + 1) if frequency[station] >= 2]
    best, answer = float("inf"), -1
    for source in important:
        distance = [-1] * (n + 1)
        distance[source] = 0
        queue = deque([source])
        while queue:
            u = queue.popleft()
            for v in graph[u]:
                if distance[v] == -1:
                    distance[v] = distance[u] + 1
                    queue.append(v)
        total = sum(distance[v] for v in important)
        if total < best:
            best, answer = total, source
    print(f"Krochanska is in: {answer}")
`,
  }),
  defineCpeLesson("a585", {
    topic: "trees",
    level: "hard",
    concept: "Move-to-front與Fenwick排名查詢",
    goal: "用時間槽維護單字清單，支援無上限字典的快速解壓縮。",
    explanation: [
      "先將文字切成英文字母段、十進位數字段與其他字元段，單字大小寫有別，非字母符號與換行原樣輸出。文字單字是首次出現的新詞，加入清單最前；數字k則取目前清單第k個詞，輸出它後移到最前。位置是當下的排名，不能當成首次出現的固定編號。",
      "為避免每次搬動長清單，先計算單字與引用的總次數P，準備P個槽，由大到小分配新槽；槽號越小代表越新。Fenwick樹以1標記仍在清單中的槽，前綴和表示排名，可用二進位提升找第k個1。引用時將舊槽減1，再給該詞一個更小的新槽並加1。原文字串與槽共O(L)空間，單獨一行0終止而不輸出。",
    ],
    complexity:
      "總時間 O(L+P log P)，空間 O(L+P)，L為文字長度、P為單字與引用次數。",
    pitfall:
      "多位數是完整排名；標點、空白與換行不能重新排版，清單也不能在換行時清空。",
    traceLabel: "示意：壓縮文字『red blue 2 2』",
    trace: [
      {
        title: "讀兩個新詞",
        description: "先red後blue，清單前到後為blue、red。",
        cells: ["1:blue", "2:red"],
        active: [0, 1],
        variables: [["已輸出單字", "2"]],
      },
      {
        title: "第一個2",
        description: "取排名2的red並移到前端。",
        cells: ["1:red", "2:blue"],
        active: [0, 1],
        variables: [
          ["本次輸出", "red"],
          ["已輸出單字", "3"],
        ],
      },
      {
        title: "第二個2",
        description: "現在排名2已變成blue，完整還原red blue red blue。",
        cells: ["1:blue", "2:red"],
        active: [0, 1],
        variables: [
          ["本次輸出", "blue"],
          ["已輸出單字", "4"],
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

bool letter(char c) {
    return (c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z');
}
bool digit(char c) {
    return c >= '0' && c <= '9';
}
struct Fenwick {
    int n;
    vector<int> tree;
    Fenwick(int size) : n(size), tree(size + 1) {}
    void add(int p, int delta) {
        for (; p <= n; p += p & -p)
            tree[p] += delta;
    }
    int kth(int k) {
        int p = 0, step = 1;
        while (step <= n / 2)
            step *= 2;
        for (; step; step /= 2) {
            int next = p + step;
            if (next <= n && tree[next] < k) {
                p = next;
                k -= tree[next];
            }
        }
        return p + 1;
    }
};
int main() {
    string text, line;
    while (getline(cin, line) && line != "0")
        text += line + '\n';
    int count = 0;
    for (size_t i = 0; i < text.size();) {
        if (letter(text[i]) || digit(text[i])) {
            bool word = letter(text[i]);
            ++count;
            do {
                ++i;
            } while (i < text.size() && (word ? letter(text[i]) : digit(text[i])));
        } else
            ++i;
    }
    Fenwick bit(count);
    vector<string> at(count + 1);
    int next = count;
    for (size_t i = 0; i < text.size();) {
        if (!letter(text[i]) && !digit(text[i])) {
            cout << text[i++];
            continue;
        }
        bool word = letter(text[i]);
        size_t start = i;
        do {
            ++i;
        } while (i < text.size() && (word ? letter(text[i]) : digit(text[i])));
        string token = text.substr(start, i - start), value;
        if (word)
            value = token;
        else {
            int old = bit.kth(stoi(token));
            value = move(at[old]);
            bit.add(old, -1);
        }
        cout << value;
        at[next] = move(value);
        bit.add(next, 1);
        --next;
    }
}
`,
    python: String.raw`import sys
import re

text_parts = []
for line in sys.stdin:
    if line.rstrip("\r\n") == "0":
        break
    text_parts.append(line)
tokens = re.findall(r"[A-Za-z]+|[0-9]+|[^A-Za-z0-9]+", "".join(text_parts))
count = sum(token[0].isascii() and token[0].isalnum() for token in tokens)
tree = [0] * (count + 1)
words = [""] * (count + 1)


def add(position, delta):
    while position <= count:
        tree[position] += delta
        position += position & -position


def kth(rank):
    position = 0
    step = 1 << (count.bit_length() - 1)
    while step:
        after = position + step
        if after <= count and tree[after] < rank:
            position = after
            rank -= tree[after]
        step >>= 1
    return position + 1


slot = count
output = []
for token in tokens:
    if "A" <= token[0] <= "Z" or "a" <= token[0] <= "z":
        value = token
    elif "0" <= token[0] <= "9":
        old = kth(int(token))
        value = words[old]
        words[old] = ""
        add(old, -1)
    else:
        output.append(token)
        continue
    output.append(value)
    words[slot] = value
    add(slot, 1)
    slot -= 1
sys.stdout.write("".join(output))
`,
  }),
  defineCpeLesson("a586", {
    topic: "graphs",
    level: "medium",
    concept: "以適當質因數為邊的BFS",
    goal: "在只會遞增的整數狀態圖上找最少步數。",
    explanation: [
      "對每個整數v預先建立可用質因數清單。可用的是質數p且p整除v，同時p<v，不能使用1或v本身；因此質數狀態沒有任何下一步。用質數篩枚舉p，再把p放到2p、3p等倍數的清單中就恰好排除了它自己。",
      "每條轉換v→v+p成本都是一步，所以從S做BFS即可。轉換嚴格增加，超過T的狀態不可能再回來，可以直接捨棄。S=T立即是0；S>T一定無法達成。每筆新建距離，找到T輸出距離，否則−1；0 0結束，案例格式Case X: Y。",
    ],
    complexity:
      "預算 O(U log log U)，每筆時間 O(T log T)的寬鬆上界、空間 O(T+U log log U)，U=1000。",
    pitfall:
      "不能加入所有真因數，例如12的可用值只有2、3，不包含4、6；同一質因數不需要重複。",
    traceLabel: "示意：S=6、T=12",
    trace: [
      {
        title: "展開6",
        description: "質因數2、3，下一步是8與9。",
        cells: ["6→8", "6→9"],
        active: [0, 1],
        variables: [
          ["距離6", "0"],
          ["距離8、9", "1"],
        ],
      },
      {
        title: "展開第一層",
        description: "8只能加2到10；9只能加3到12。",
        cells: ["8→10", "9→12"],
        active: [0, 1],
        variables: [
          ["距離10", "2"],
          ["距離12", "2"],
        ],
      },
      {
        title: "最短抵達",
        description: "BFS第一次抵達12是在第2層，路徑6→9→12。",
        cells: ["6", "9", "12"],
        active: [0, 1, 2],
        variables: [["答案", "2"]],
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
    const int U = 1000;
    vector<vector<int>> factor(U + 1);
    vector<bool> prime(U + 1, true);
    for (int p = 2; p <= U; ++p)
        if (prime[p])
            for (int v = 2 * p; v <= U; v += p) {
                prime[v] = false;
                factor[v].push_back(p);
            }
    int s, t, tc = 0;
    while (cin >> s >> t && (s || t)) {
        int ans = -1;
        if (s <= t) {
            vector<int> d(t + 1, -1);
            queue<int> q;
            d[s] = 0;
            q.push(s);
            while (!q.empty()) {
                int v = q.front();
                q.pop();
                if (v == t) {
                    ans = d[v];
                    break;
                }
                for (int p : factor[v])
                    if (v + p <= t && d[v + p] == -1) {
                        d[v + p] = d[v] + 1;
                        q.push(v + p);
                    }
            }
        }
        cout << "Case " << ++tc << ": " << ans << '\n';
    }
}
`,
    python: String.raw`import sys
from collections import deque

limit = 1000
factor = [[] for _ in range(limit + 1)]
prime = [True] * (limit + 1)
for p in range(2, limit + 1):
    if prime[p]:
        for value in range(2 * p, limit + 1, p):
            prime[value] = False
            factor[value].append(p)
it = iter(map(int, sys.stdin.read().split()))
case = 0
for source in it:
    target = next(it)
    if source == target == 0:
        break
    answer = -1
    if source <= target:
        distance = [-1] * (target + 1)
        distance[source] = 0
        queue = deque([source])
        while queue:
            value = queue.popleft()
            if value == target:
                answer = distance[value]
                break
            for p in factor[value]:
                after = value + p
                if after <= target and distance[after] == -1:
                    distance[after] = distance[value] + 1
                    queue.append(after)
    case += 1
    print(f"Case {case}: {answer}")
`,
  }),
  defineCpeLesson("a587", {
    topic: "math",
    level: "medium",
    concept: "導數係數的Horner法",
    goal: "不計算冪次，線性累積多項式導數值。",
    explanation: [
      "若原係數依最高次到常數排列為a₀..aₙ，導數係數就是na₀、(n−1)a₁、…、aₙ₋₁。常數項消失，所以只處理前n個係數；只有一個係數時n=0，結果為0。",
      "用Horner法從高次到低次，反覆令answer=answer×x+(n−i)aᵢ。處理到i時，answer等於已處理導數係數構成的前綴多項式在x的值，下一次乘x就把既有項提升一階。每筆係數個數由整行決定，不能跨行讀到下一筆x；讀至EOF。",
      "本地敘述未限制多項式次數，只保證最後答案在有號32位元內。Python整數可直接算；C++改在模2³²下做相同的加乘，使用uint32_t使溢位有明確定義，最後將最高位為1的結果減2³²還原負數。因真實答案已保證落在此範圍，模數結果能唯一還原，不必假設中間值也放得進64位元。",
    ],
    complexity: "每筆時間 O(n)，空間 O(n)保存係數，計算本身O(1)。",
    pitfall:
      "常數係數不參與導數；最後答案有界不代表中間值有界。C++以無號模運算避免未定義的有號溢位，Python用任意精度整數。",
    traceLabel: "示意：P(x)=2x³−3x²+4x+5，在x=2求導數",
    trace: [
      {
        title: "首係數",
        description: "導數為6x²−6x+4，先處理6。",
        cells: ["原2,-3,4,5", "導6,-6,4"],
        active: [0, 1],
        variables: [["answer", "6"]],
      },
      {
        title: "加入下一項",
        description: "6×2−6=6，表示6x−6在2的值。",
        cells: ["6×2−6=6"],
        active: [0],
        variables: [["answer", "6"]],
      },
      {
        title: "加入常數導數項",
        description: "6×2+4=16；原常數5不參與。",
        cells: ["6×2+4=16"],
        active: [0],
        variables: [
          ["直接檢查", "6×4−6×2+4=16"],
          ["答案", "16"],
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
    long long x;
    string line;
    while (cin >> x) {
        getline(cin, line);
        if (!getline(cin, line))
            break;
        istringstream in(line);
        vector<long long> a;
        long long value;
        while (in >> value)
            a.push_back(value);
        int n = int(a.size()) - 1;
        // All arithmetic is modulo 2^32; unsigned overflow is defined.
        uint32_t answer = 0, base = static_cast<uint32_t>(x);
        for (int i = 0; i < n; ++i)
            answer = answer * base + static_cast<uint32_t>(n - i) * static_cast<uint32_t>(a[i]);
        long long signedAnswer = answer;
        if (answer >= 0x80000000u)
            signedAnswer -= 4294967296LL;
        cout << signedAnswer << '\n';
    }
}
`,
    python: String.raw`import sys

lines = iter(sys.stdin.read().splitlines())
for line in lines:
    if not line.strip():
        continue
    x = int(line)
    coefficients = list(map(int, next(lines).split()))
    degree = len(coefficients) - 1
    answer = 0
    for i, coefficient in enumerate(coefficients[:-1]):
        answer = answer * x + (degree - i) * coefficient
    print(answer)
`,
  }),
];
