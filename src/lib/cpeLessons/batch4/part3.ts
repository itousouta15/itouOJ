import { defineCpeLesson } from "@/lib/cpeLessonBuilder";

export const lessons = [
  defineCpeLesson("a684", {
    topic: "sorting",
    level: "medium",
    concept: "區間覆蓋的最遠延伸貪心",
    goal: "每次從能接上已覆蓋區域的線段中，挑右端最遠者。",
    explanation: [
      "將所有線段依左端點排序，維護已連續覆蓋 [0,end]。下一條線段必須滿足 L≤end，否則會留下缺口。在所有符合條件的候選中選 R 最大者，因為它用同樣一條線段能覆蓋最遠；任何最優解的下一條都可被它替換而不增加後續需求。",
      "掃描指標持續向右，檢查所有 L≤end 的線段，選出的線段必須使 R>end 才有進展。若沒有則輸出 0；若 end≥M，輸出選段數與依 L 排序的端點。每筆的 0 0 是線段結束符，輸入空白行可忽略，輸出案例間空一行。本地固定比對只採最優集合唯一的測資；一般原題多解可任選。",
    ],
    complexity: "k 條線段：時間 O(k log k)，空間 O(k)。",
    pitfall:
      "只碰到目前端點但右端沒有增加的線段不能推進；[0,M] 必須完整覆蓋而非只覆蓋整數點。",
    traceLabel: "示意：M=7，線段 [-1,3]、[0,2]、[2,5]、[4,7]",
    trace: [
      {
        title: "起點 0",
        description: "可用前兩段，選右端 3 者。",
        cells: ["[-1,3]", "[0,2]", "[2,5]", "[4,7]"],
        active: [0],
        variables: [
          ["end", "3"],
          ["條數", "1"],
        ],
      },
      {
        title: "延伸到 5",
        description: "[2,5] 接上已覆蓋部分。",
        cells: ["[-1,3]", "[2,5]", "[4,7]"],
        active: [1],
        variables: [
          ["end", "5"],
          ["條數", "2"],
        ],
      },
      {
        title: "完成",
        description: "選 [4,7]，三條覆蓋 [0,7]。",
        cells: ["[-1,3]", "[2,5]", "[4,7]"],
        active: [2],
        variables: [
          ["end", "7"],
          ["答案", "3"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;
int main() {
    int tests;
    cin >> tests;
    for (int tc = 0; tc < tests; tc++) {
        int target, l, r;
        cin >> target;
        vector<pair<int, int>> a, chosen;
        while (cin >> l >> r && (l || r))
            a.push_back({l, r});
        sort(a.begin(), a.end());
        int end = 0, i = 0;
        while (end < target) {
            int far = end;
            pair<int, int> best;
            while (i < (int)a.size() && a[i].first <= end) {
                if (a[i].second > far) {
                    far = a[i].second;
                    best = a[i];
                }
                i++;
            }
            if (far == end)
                break;
            chosen.push_back(best);
            end = far;
        }
        if (tc)
            cout << '\n';
        if (end < target)
            cout << "0\n";
        else {
            sort(chosen.begin(), chosen.end());
            cout << chosen.size() << '\n';
            for (auto [x, y] : chosen)
                cout << x << ' ' << y << '\n';
        }
    }
}`,
    python: String.raw`import sys

it = iter(map(int, sys.stdin.buffer.read().split()))
out = []
for _ in range(next(it)):
    target = next(it)
    intervals = []
    for l, r in zip(it, it):
        if l == r == 0:
            break
        intervals.append((l, r))
    intervals.sort()
    end = i = 0
    chosen = []
    while end < target:
        far = end
        best = None
        while i < len(intervals) and intervals[i][0] <= end:
            if intervals[i][1] > far:
                far = intervals[i][1]
                best = intervals[i]
            i += 1
        if far == end:
            break
        chosen.append(best)
        end = far
    if end < target:
        out.append('0')
    else:
        out.append(str(len(chosen)) + '\n' + '\n'.join(f'{l} {r}' for l, r in sorted(chosen)))
print('\n\n'.join(out))
`,
  }),
  defineCpeLesson("a685", {
    topic: "geometry",
    level: "medium",
    concept: "向量叉積判定無限直線交會",
    goal: "不用斜率，統一處理垂直線、平行線與交點。",
    explanation: [
      "兩線寫成 A+t·u 與 C+s·v，其中 u=B−A、v=D−C。二維叉積 cross(u,v)=ux·vy−uy·vx。若此值為 0，方向平行；再檢查 cross(C−A,u)，也是 0 才表示重合，否則沒有交點。輸入整數座標，可先用整數叉積精確分類。",
      "若方向叉積不為 0，對等式取與 v 的叉積，得到 t=cross(C−A,v)/cross(u,v)，代回 A+t·u 算交點。最後才使用浮點數並輸出兩位小數，接近 0 的輸出先正規成 0，避免 −0.00。每批先印固定標題，全部案例後印 END OF OUTPUT；本題是直線，不限制 t 在 [0,1]。",
    ],
    complexity: "每筆時間與空間 O(1)。",
    pitfall: "用斜率相除會遇到垂直線；平行與重合必須分開判斷。",
    traceLabel: "示意：(0,0)→(4,4) 與 (0,4)→(4,0)",
    trace: [
      {
        title: "方向",
        description: "u=(4,4)，v=(4,−4)。",
        cells: ["u=(4,4)", "v=(4,-4)"],
        active: [0, 1],
        variables: [["cross(u,v)", "-32"]],
      },
      {
        title: "參數",
        description: "cross((0,4),v)=−16，t=1/2。",
        cells: ["-16", "-32", "t=0.5"],
        active: [2],
        variables: [["t", "0.5"]],
      },
      {
        title: "交點",
        description: "(0,0)+0.5(4,4)=(2,2)。",
        cells: ["x=2.00", "y=2.00"],
        active: [0, 1],
        variables: [["輸出", "POINT 2.00 2.00"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <iomanip>
#include <cmath>
using namespace std;
long long cross(long long ax, long long ay, long long bx, long long by) {
    return ax * by - ay * bx;
}
int main() {
    int tests;
    cin >> tests;
    cout << "INTERSECTING LINES OUTPUT\n";
    while (tests--) {
        long long ax, ay, bx, by, cx, cy, dx, dy;
        cin >> ax >> ay >> bx >> by >> cx >> cy >> dx >> dy;
        long long ux = bx - ax, uy = by - ay, vx = dx - cx, vy = dy - cy;
        long long den = cross(ux, uy, vx, vy);
        if (!den)
            cout << (cross(cx - ax, cy - ay, ux, uy) == 0 ? "LINE\n" : "NONE\n");
        else {
            long double t = (long double)cross(cx - ax, cy - ay, vx, vy) / den;
            long double x = ax + t * ux, y = ay + t * uy;
            if (fabsl(x) < 0.0005L)
                x = 0;
            if (fabsl(y) < 0.0005L)
                y = 0;
            cout << fixed << setprecision(2) << "POINT " << x << ' ' << y << '\n';
        }
    }
    cout << "END OF OUTPUT\n";
}`,
    python: String.raw`import sys


def cross(ax, ay, bx, by):
    return ax * by - ay * bx


it = iter(map(int, sys.stdin.buffer.read().split()))
print('INTERSECTING LINES OUTPUT')
for _ in range(next(it)):
    ax, ay, bx, by, cx, cy, dx, dy = [next(it) for _ in range(8)]
    ux, uy, vx, vy = bx - ax, by - ay, dx - cx, dy - cy
    den = cross(ux, uy, vx, vy)
    if den == 0:
        print('LINE' if cross(cx - ax, cy - ay, ux, uy) == 0 else 'NONE')
    else:
        t = cross(cx - ax, cy - ay, vx, vy) / den
        x, y = ax + t * ux, ay + t * uy
        if abs(x) < 0.0005:
            x = 0.0
        if abs(y) < 0.0005:
            y = 0.0
        print(f'POINT {x:.2f} {y:.2f}')
print('END OF OUTPUT')
`,
  }),
  defineCpeLesson("a686", {
    topic: "math",
    level: "medium",
    concept: "山形步長與平方距離門檻",
    goal: "根據固定步數的最大可達距離反推最少步數。",
    explanation: [
      "第一步與最後一步為1，相鄰步長最多差1。若有 2k−1 步，最大步長形狀是 1,2,…,k,…,2,1，總距離為 k²；若有 2k 步，頂端可重複 k，最大距離為 k(k+1)。這些上界來自每步同時受距離首尾的步數限制。",
      "令 d=y−x、k=floor(sqrt(d))。d=0 時為0步；d=k² 時答案2k−1；k²<d≤k²+k 時為2k；其餘為2k+1。中間距離可從最大山形減少部分步長得到，仍維持相鄰差不超過1，所以門檻可達。平方與 k(k+1) 使用64位元，避免接近2³¹時溢位。",
    ],
    complexity: "每筆平方根計算後 O(1) 時間，空間 O(1)。",
    pitfall: "x=y 是0步；完全平方數落在2k−1步，而不是2k步。",
    traceLabel: "示意：距離 4、5、7",
    trace: [
      {
        title: "距離 4",
        description: "1,2,1 共3步，恰好2²。",
        cells: ["1", "2", "1"],
        active: [0, 1, 2],
        variables: [
          ["d", "4"],
          ["步數", "3"],
        ],
      },
      {
        title: "距離 5",
        description: "1,2,1,1 共4步，未超過2·3=6。",
        cells: ["1", "2", "1", "1"],
        active: [0, 1, 2, 3],
        variables: [
          ["d", "5"],
          ["步數", "4"],
        ],
      },
      {
        title: "距離 7",
        description: "1,2,2,1,1 共5步，4步最多只能走6。",
        cells: ["1", "2", "2", "1", "1"],
        active: [0, 1, 2, 3, 4],
        variables: [
          ["d", "7"],
          ["步數", "5"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <cmath>
using namespace std;
int main() {
    int tests;
    cin >> tests;
    while (tests--) {
        long long x, y;
        cin >> x >> y;
        long long d = y - x, k = sqrt((long double)d);
        while ((k + 1) * (k + 1) <= d)
            ++k;
        while (k * k > d)
            --k;
        long long answer = !d ? 0 : (d == k * k ? 2 * k - 1 : (d <= k * k + k ? 2 * k : 2 * k + 1));
        cout << answer << '\n';
    }
}`,
    python: String.raw`import sys
from math import isqrt

it = iter(map(int, sys.stdin.buffer.read().split()))
for _ in range(next(it)):
    x, y = next(it), next(it)
    d = y - x
    k = isqrt(d)
    answer = 0 if d == 0 else 2 * k - 1 if d == k * k else 2 * k if d <= k * k + k else 2 * k + 1
    print(answer)
`,
  }),
  defineCpeLesson("a687", {
    topic: "search",
    level: "hard",
    concept: "枚舉圓順序與所有前圓的幾何限制",
    goal: "用相切圓心水平距離求每種排列的最緊密擺法。",
    explanation: [
      "半徑 r、s 的圓都碰底邊，圓心高度差是 r−s。不重疊需要中心距離至少 r+s，因此水平距離至少 sqrt((r+s)²−(r−s)²)=2√(rs)。固定由左至右的圓心順序後，新圓中心 x 取 max(r, max_j(xj+2√(rj·r)))，第一項防止超過盒子左邊。",
      "檢查所有先前圓，因為中間小圓可能無法隔開兩個大圓。每個圓都往左擺到限制最緊的位置不會妨礙後續圓，故對固定排列此法最優。枚舉最多8!個排列，寬度為 max(xi+ri)，取最小；若目前寬度已不小於已知答案可剪枝，相同半徑同層只選一次。輸出三位小數。",
    ],
    complexity: "最壞時間 O(m!·m²)，遞迴與距離表空間 O(m²)。",
    pitfall: "不能只讓相鄰圓相切；非相鄰的大圓仍可能重疊。半徑可以是小數。",
    traceLabel: "示意：固定順序半徑 2,1,2",
    trace: [
      {
        title: "第一圓",
        description: "中心 x=2，右界4。",
        cells: ["r=2,x=2"],
        active: [0],
        variables: [["寬", "4"]],
      },
      {
        title: "第二圓",
        description: "中心2+2√2≈4.828427，右界5.828427。",
        cells: ["r=2,x=2", "r=1,x=4.828427"],
        active: [1],
        variables: [["寬", "5.828427"]],
      },
      {
        title: "第三圓",
        description: "須同時超過6與7.656854，故中心7.656854、寬9.656854。",
        cells: ["x=2", "x=4.828427", "x=7.656854"],
        active: [2],
        variables: [["此排列寬", "9.657"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <cmath>
#include <iomanip>
#include <functional>
#include <algorithm>
using namespace std;
int main() {
    int tests;
    cin >> tests;
    while (tests--) {
        int n;
        cin >> n;
        vector<double> r(n);
        double best = 0;
        for (double &v : r) {
            cin >> v;
            best += 2 * v;
        }
        sort(r.begin(), r.end());
        vector<vector<double>> gap(n, vector<double>(n));
        for (int i = 0; i < n; i++)
            for (int j = 0; j < n; j++)
                gap[i][j] = 2 * sqrt(r[i] * r[j]);
        vector<int> order;
        vector<double> x;
        vector<bool> used(n);
        function<void(double)> dfs = [&](double width) {
            if (order.size() == r.size()) {
                best = min(best, width);
                return;
            }
            for (int i = 0; i < n; i++)
                if (!used[i]) {
                    if (i && r[i] == r[i - 1] && !used[i - 1])
                        continue;
                    double center = r[i];
                    for (int j = 0; j < (int)order.size(); j++)
                        center = max(center, x[j] + gap[order[j]][i]);
                    double next = max(width, center + r[i]);
                    if (next >= best)
                        continue;
                    used[i] = true;
                    order.push_back(i);
                    x.push_back(center);
                    dfs(next);
                    x.pop_back();
                    order.pop_back();
                    used[i] = false;
                }
        };
        dfs(0);
        cout << fixed << setprecision(3) << best << '\n';
    }
}`,
    python: String.raw`import sys, math

it = iter(sys.stdin.buffer.read().split())
for _ in range(int(next(it))):
    n = int(next(it))
    radii = sorted(float(next(it)) for _ in range(n))
    gaps = [[2 * math.sqrt(a * b) for b in radii] for a in radii]
    best = 2 * sum(radii)
    order = []
    centers = []
    used = [False] * n

    def dfs(width):
        global best
        if len(order) == n:
            best = min(best, width)
            return
        for i in range(n):
            if used[i] or (i and radii[i] == radii[i - 1] and not used[i - 1]):
                continue
            x = max([radii[i]] + [centers[j] + gaps[k][i] for j, k in enumerate(order)])
            new_width = max(width, x + radii[i])
            if new_width >= best:
                continue
            used[i] = True
            order.append(i)
            centers.append(x)
            dfs(new_width)
            used[i] = False
            order.pop()
            centers.pop()

    dfs(0)
    print(f'{best:.3f}')
`,
  }),
  defineCpeLesson("a688", {
    topic: "dp",
    level: "medium",
    concept: "名次反解後的最長遞增子序列",
    goal: "辨認輸入是事件名次，依學生先後轉換為正確名次。",
    explanation: [
      "第 i 個數是事件 i 的排名，不是第 i 位事件。先反解學生排名，令 studentOrder[r_i−1]=i，得到學生認為的事件先後；再將此事件序列映成正確名次 c_i。選出的事件在學生序列中依序出現，且正確名次也遞增，才是可給分的共同相對順序。",
      "所以答案是轉換序列的 LIS。n≤20，可用 dp[i]=1+max(dp[j])，條件 j<i 且 value[j]<value[i]，直接平方時間計算最清楚。輸入以行為單位，一個整數的行表示新資料組 n，下一行是正解，之後每行是一名學生；不能把新 n 誤讀成學生的一個排名。",
    ],
    complexity: "每名學生時間 O(n²)，空間 O(n)。",
    pitfall:
      "直接對兩個排名陣列做 LCS，並不等於對事件先後做 LCS；必須先反解名次。",
    traceLabel: "示意：n=3，正確排名 [2,3,1]，學生排名 [1,3,2]",
    trace: [
      {
        title: "學生先後",
        description: "學生依序排列事件1、3、2。",
        cells: ["事件1", "事件3", "事件2"],
        active: [0, 1, 2],
        variables: [["學生名次", "1,3,2"]],
      },
      {
        title: "映射正確排名",
        description: "這些事件的正確名次是2、1、3。",
        cells: ["2", "1", "3"],
        active: [0, 1, 2],
        variables: [["轉換序列", "2,1,3"]],
      },
      {
        title: "遞增子序列",
        description: "可選2,3或1,3，最長2個事件。",
        cells: ["dp=1", "dp=1", "dp=2"],
        active: [2],
        variables: [["分數", "2"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <sstream>
#include <string>
#include <vector>
#include <algorithm>
using namespace std;
int main() {
    string line;
    int n = 0;
    bool needCorrect = false;
    vector<int> correct;
    while (getline(cin, line)) {
        istringstream in(line);
        vector<int> values;
        int x;
        while (in >> x)
            values.push_back(x);
        if (values.empty())
            continue;
        if (values.size() == 1) {
            n = values[0];
            needCorrect = true;
            continue;
        }
        if (needCorrect) {
            correct = values;
            needCorrect = false;
            continue;
        }
        vector<int> sequence(n), dp(n, 1);
        for (int event = 0; event < n; event++)
            sequence[values[event] - 1] = correct[event];
        int answer = 0;
        for (int i = 0; i < n; i++) {
            for (int j = 0; j < i; j++)
                if (sequence[j] < sequence[i])
                    dp[i] = max(dp[i], dp[j] + 1);
            answer = max(answer, dp[i]);
        }
        cout << answer << '\n';
    }
}`,
    python: String.raw`import sys

correct = None
need_correct = False
for line in sys.stdin.buffer:
    values = list(map(int, line.split()))
    if not values:
        continue
    if len(values) == 1:
        n = values[0]
        need_correct = True
        continue
    if need_correct:
        correct = values
        need_correct = False
        continue
    sequence = [0] * n
    for event, rank in enumerate(values):
        sequence[rank - 1] = correct[event]
    dp = [1] * n
    for i in range(n):
        for j in range(i):
            if sequence[j] < sequence[i]:
                dp[i] = max(dp[i], dp[j] + 1)
    print(max(dp))
`,
  }),
  defineCpeLesson("a689", {
    topic: "dp",
    level: "medium",
    concept: "精確時間的完全背包與兩層目標",
    goal: "先最少剩餘時間，再最多漢堡數。",
    explanation: [
      "用 dp[s] 表示恰用 s 分鐘能吃的最多漢堡數，不可達記為 −1，只有 dp[0]=0。依時間由小到大計算，若 s−m 或 s−n 可達，就可再吃對應漢堡，更新 dp[s] 的最大值。正向時間順序讓同種漢堡可重複吃。",
      "完成後從 t 往下找到第一個可達時間 s，這使 t−s 最小；dp[s] 已在該時間內最大化漢堡數。不可直接挑全表最多的漢堡數，因為它可能浪費更多時間。輸入每行三個整數直到 EOF；若剩餘時間為0只印數量，否則再印空白和剩餘分鐘。",
    ],
    complexity: "每筆時間 O(t)，空間 O(t)。",
    pitfall: "優先目標是少剩時間，不是先多吃較快的漢堡。",
    traceLabel: "示意：m=3,n=5,t=7",
    trace: [
      {
        title: "初始化",
        description: "時間0可達，其他先標−1。",
        cells: ["0:0", "3:-1", "5:-1", "6:-1", "7:-1"],
        active: [0],
        variables: [["dp[0]", "0"]],
      },
      {
        title: "可達時間",
        description: "3、5可各吃1個，6可吃兩個3分鐘漢堡。",
        cells: ["0:0", "3:1", "5:1", "6:2", "7:-1"],
        active: [1, 2, 3],
        variables: [["dp[6]", "2"]],
      },
      {
        title: "倒查",
        description: "7不可達，6可達，因此吃2個、剩1分鐘。",
        cells: ["7:不可達", "6:2", "剩1"],
        active: [1, 2],
        variables: [["輸出", "2 1"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;
int main() {
    int m, n, t;
    while (cin >> m >> n >> t) {
        vector<int> dp(t + 1, -1);
        dp[0] = 0;
        for (int s = 1; s <= t; s++) {
            if (s >= m && dp[s - m] >= 0)
                dp[s] = max(dp[s], dp[s - m] + 1);
            if (s >= n && dp[s - n] >= 0)
                dp[s] = max(dp[s], dp[s - n] + 1);
        }
        int used = t;
        while (dp[used] < 0)
            --used;
        cout << dp[used];
        if (used < t)
            cout << ' ' << t - used;
        cout << '\n';
    }
}`,
    python: String.raw`import sys

it = iter(map(int, sys.stdin.buffer.read().split()))
for m, n, t in zip(it, it, it):
    dp = [-1] * (t + 1)
    dp[0] = 0
    for s in range(1, t + 1):
        if s >= m and dp[s - m] >= 0:
            dp[s] = max(dp[s], dp[s - m] + 1)
        if s >= n and dp[s - n] >= 0:
            dp[s] = max(dp[s], dp[s - n] + 1)
    used = t
    while dp[used] < 0:
        used -= 1
    print(dp[used], t - used) if used < t else print(dp[used])
`,
  }),
  defineCpeLesson("a690", {
    topic: "graphs",
    level: "hard",
    concept: "無向容量的殘餘網路最大流",
    goal: "利用增廣路徑同時累加多條路線的可用頻寬。",
    explanation: [
      "將每條無向連線的兩方向殘餘容量都加上 c；多條平行連線需累加。一次從 u 向 v 送 f，便將 residual[u][v] 減 f、residual[v][u] 加 f。這裡反向容量同時代表原本可反向使用的容量與取消既有流的能力，等價於一條容量 c、允許有號淨流的無向邊。",
      "用 BFS 尋找來源到終點的最短增廣路，沿路最小殘餘容量就是本次可增加流量。更新每條邊與其反向邊並累加，直到終點不可達。此時可達與不可達頂點形成飽和割，依最大流最小割定理得到最優總頻寬。n=0結束；輸出 Network k、The bandwidth is B. 以及空白行。",
    ],
    complexity: "Edmonds–Karp 時間 O(VE²)，容量矩陣空間 O(V²)。",
    pitfall:
      "不能只找最大單一路徑；反向殘餘邊能撤回先前分配，平行邊容量也不可覆蓋掉。",
    traceLabel: "示意：1−2容量3、2−3容量2、1−3容量1",
    trace: [
      {
        title: "直接路徑",
        description: "先沿1→3送1。",
        cells: ["1−3:剩0", "1−2:剩3", "2−3:剩2"],
        active: [0],
        variables: [["總流", "1"]],
      },
      {
        title: "繞經2",
        description: "沿1→2→3送 min(3,2)=2。",
        cells: ["1−3:剩0", "1−2:剩1", "2−3:剩0"],
        active: [1, 2],
        variables: [["總流", "3"]],
      },
      {
        title: "終點不可達",
        description: "終點所有輸入容量2+1已用完，最大頻寬3。",
        cells: ["來源側:{1,2}", "終點側:{3}", "割容量3"],
        active: [2],
        variables: [["答案", "3"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <queue>
#include <algorithm>
using namespace std;
int main() {
    int n, tc = 0;
    while (cin >> n && n) {
        int s, t, m;
        cin >> s >> t >> m;
        --s;
        --t;
        vector<vector<int>> cap(n, vector<int>(n)), g(n);
        while (m--) {
            int u, v, c;
            cin >> u >> v >> c;
            --u;
            --v;
            cap[u][v] += c;
            cap[v][u] += c;
        }
        for (int u = 0; u < n; u++)
            for (int v = 0; v < n; v++)
                if (cap[u][v])
                    g[u].push_back(v);
        int total = 0;
        while (true) {
            vector<int> parent(n, -1);
            parent[s] = s;
            queue<int> q;
            q.push(s);
            while (!q.empty() && parent[t] < 0) {
                int u = q.front();
                q.pop();
                for (int v : g[u])
                    if (cap[u][v] > 0 && parent[v] < 0) {
                        parent[v] = u;
                        q.push(v);
                    }
            }
            if (parent[t] < 0)
                break;
            int flow = 1000000000;
            for (int v = t; v != s; v = parent[v])
                flow = min(flow, cap[parent[v]][v]);
            for (int v = t; v != s; v = parent[v]) {
                cap[parent[v]][v] -= flow;
                cap[v][parent[v]] += flow;
            }
            total += flow;
        }
        cout << "Network " << ++tc << "\nThe bandwidth is " << total << ".\n\n";
    }
}`,
    python: String.raw`import sys
from collections import deque

it = iter(map(int, sys.stdin.buffer.read().split()))
tc = 0
for n in it:
    if n == 0:
        break
    s, t, m = next(it) - 1, next(it) - 1, next(it)
    cap = [[0] * n for _ in range(n)]
    for _ in range(m):
        u, v, c = next(it) - 1, next(it) - 1, next(it)
        cap[u][v] += c
        cap[v][u] += c
    g = [[v for v in range(n) if cap[u][v]] for u in range(n)]
    total = 0
    while True:
        parent = [-1] * n
        parent[s] = s
        q = deque([s])
        while q and parent[t] < 0:
            u = q.popleft()
            for v in g[u]:
                if cap[u][v] and parent[v] < 0:
                    parent[v] = u
                    q.append(v)
        if parent[t] < 0:
            break
        flow = 10**18
        v = t
        while v != s:
            flow = min(flow, cap[parent[v]][v])
            v = parent[v]
        v = t
        while v != s:
            u = parent[v]
            cap[u][v] -= flow
            cap[v][u] += flow
            v = u
        total += flow
    tc += 1
    print(f'Network {tc}\nThe bandwidth is {total}.\n')
`,
  }),
  defineCpeLesson("a691", {
    topic: "number-theory",
    level: "hard",
    concept: "最大集合是全部因數，整除分塊加總",
    goal: "把 MSLCM 前綴化為加權 floor(N/d) 的平方根時間求和。",
    explanation: [
      "若集合最小公倍數是 k，每個成員必須整除 k。所有正因數皆為正值且不可重複，將 k 的全部因數放入集合必然得到最大的總和，且含 k 保證最小公倍數正是 k。因此 MSLCM(k)=σ(k)，即正因數和。",
      "交換求和次序，Σ(k=1…N)σ(k)=Σ(d=1…N)d·floor(N/d)，因為 d 出現在它的每個倍數中。floor(N/d) 在區間 [l,r] 相同，令 q=N//l、r=N//q，一次加入 q·(l+r)(r−l+1)/2，再跳至 r+1。不同商僅 O(√N) 個。最後減去 σ(1)=1，因為題目從2開始；0結束，使用64位元。",
    ],
    complexity: "每筆時間 O(√N)，額外空間 O(1)。",
    pitfall:
      "集合不可重複，否則總和沒有上界；不能枚舉到兩千萬做每筆的因數分解。",
    traceLabel: "示意：N=5",
    trace: [
      {
        title: "d=1",
        description: "商5、區間[1,1]，貢獻5。",
        cells: ["[1,1]×5", "sum=5"],
        active: [0],
        variables: [
          ["l", "1"],
          ["q", "5"],
        ],
      },
      {
        title: "d=2",
        description: "商2、區間[2,2]，貢獻4。",
        cells: ["5", "+4", "sum=9"],
        active: [1],
        variables: [
          ["l", "2"],
          ["q", "2"],
        ],
      },
      {
        title: "d=3…5",
        description: "商皆1，增加3+4+5=12，再減1得到20。",
        cells: ["9", "+12", "−1", "20"],
        active: [3],
        variables: [["答案", "20"]],
      },
    ],
    cpp: String.raw`#include <iostream>
using namespace std;
int main() {
    long long n;
    while (cin >> n && n) {
        long long answer = -1;
        for (long long l = 1, r; l <= n; l = r + 1) {
            long long q = n / l;
            r = n / q;
            long long a = l + r, b = r - l + 1;
            if (a % 2 == 0)
                a /= 2;
            else
                b /= 2;
            answer += q * a * b;
        }
        cout << answer << '\n';
    }
}`,
    python: String.raw`import sys

for n in map(int, sys.stdin.buffer.read().split()):
    if n == 0:
        break
    answer = -1
    left = 1
    while left <= n:
        quotient = n // left
        right = n // quotient
        answer += quotient * (left + right) * (right - left + 1) // 2
        left = right + 1
    print(answer)
`,
  }),
  defineCpeLesson("a692", {
    topic: "search",
    level: "medium",
    concept: "非遞減乘法分解的回溯",
    goal: "依最小允許因數搜尋，避免排列重複並輸出字典序。",
    explanation: [
      "維護剩餘乘積 remain、最小允許因數 low 與已選路徑。枚舉 low≤d≤sqrt(remain) 中可整除 remain 的 d，選 d 後遞迴處理 remain/d，新的 low=d。非遞減限制讓每種因數多重集合只會被找到一次，也不會出現因數1。",
      "處理完所有可再拆的小因數後，若路徑非空，就可把 remain 作為最後因數加入一筆解。先遞迴再輸出這個終止分支，且 d 由小到大，產生的解自然按數值序列字典序排列，例如 2,2,5 在 2,10 之前。最外層路徑為空時不輸出 N 本身，N=1或質數因此沒有分解。0結束，每筆先印解數。",
    ],
    complexity:
      "依搜尋節點總和 Σ√remain 的時間，加上輸出長度；保存解需 O(總輸出長度)，遞迴深度 O(log N)。",
    pitfall: "若先記錄路徑加 remain，再搜尋更小下一因數，會破壞字典順序。",
    traceLabel: "示意：N=20",
    trace: [
      {
        title: "先選2再選2",
        description: "20→10→5，記錄2,2,5。",
        cells: ["2", "2", "5"],
        active: [0, 1, 2],
        variables: [["解數", "1"]],
      },
      {
        title: "回到10",
        description: "不再拆10，記錄2,10。",
        cells: ["2", "10"],
        active: [1],
        variables: [["解數", "2"]],
      },
      {
        title: "外層選4",
        description: "20=4×5，最後記錄4,5。",
        cells: ["4", "5"],
        active: [0, 1],
        variables: [["總解數", "3"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <functional>
using namespace std;
int main() {
    int n;
    while (cin >> n && n) {
        vector<vector<int>> answers;
        vector<int> path;
        function<void(int, int)> dfs = [&](int remain, int low) {
            for (int d = low; 1LL * d * d <= remain; d++)
                if (remain % d == 0) {
                    path.push_back(d);
                    dfs(remain / d, d);
                    path.pop_back();
                }
            if (!path.empty()) {
                path.push_back(remain);
                answers.push_back(path);
                path.pop_back();
            }
        };
        dfs(n, 2);
        cout << answers.size() << '\n';
        for (auto row : answers) {
            for (int i = 0; i < (int)row.size(); i++)
                cout << (i ? " " : "") << row[i];
            cout << '\n';
        }
    }
}`,
    python: String.raw`import sys
from math import isqrt

for n in map(int, sys.stdin.buffer.read().split()):
    if n == 0:
        break
    answers = []
    path = []

    def dfs(remain, low):
        for d in range(low, isqrt(remain) + 1):
            if remain % d == 0:
                path.append(d)
                dfs(remain // d, d)
                path.pop()
        if path:
            answers.append(path + [remain])

    dfs(n, 2)
    print(len(answers))
    for row in answers:
        print(*row)
`,
  }),
  defineCpeLesson("a693", {
    topic: "math",
    level: "medium",
    concept: "移除小數點後的精確大數乘方",
    goal: "以整數乘冪和小數位數還原精確十進位輸出。",
    explanation: [
      "把 R 視為十進位字串，移除小數點得到整數 A，原本小數位數為 d，則 Rⁿ=Aⁿ/10^(dn)。計算時不使用浮點數：Python直接求整數冪，C++以十進位字串反覆乘小整數A，逐位維護進位。",
      "若整數結果位數不大於 dn，先在左側補零，確保能在倒數 dn 位插入小數點。只刪除小數部分的尾零，再刪不必要的小數點，最後省略小於1時的整數0；整數部分的尾零不可刪。讀到EOF，輸出完整數字，不可科學記號。R>0，所以不會遇到零的空字串問題，程式仍保留0的防護。",
    ],
    complexity:
      "A有B位、結果最多D位；此小整數乘法時間 O(nD)，空間 O(D)，n≤25。",
    pitfall: "不能對沒有小數點的結果使用 rstrip('0')，否則整數100會被改成1。",
    traceLabel: "示意：R=0.50，n=3",
    trace: [
      {
        title: "縮放",
        description: "移除小數點，A=50，d=2。",
        cells: ["0.50", "A=50", "d=2"],
        active: [1, 2],
        variables: [["總小數位", "6"]],
      },
      {
        title: "整數冪",
        description: "50³=125000，補成0.125000。",
        cells: ["125000", "0.125000"],
        active: [1],
        variables: [["scale", "6"]],
      },
      {
        title: "正規化",
        description: "刪小數尾零與前導0，輸出.125。",
        cells: ["0.125", ".125"],
        active: [1],
        variables: [["答案", ".125"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <string>
#include <algorithm>
using namespace std;
string multiply(string s, int factor) {
    string out;
    long long carry = 0;
    for (int i = (int)s.size() - 1; i >= 0; i--) {
        long long v = (s[i] - '0') * 1LL * factor + carry;
        out += char('0' + v % 10);
        carry = v / 10;
    }
    while (carry) {
        out += char('0' + carry % 10);
        carry /= 10;
    }
    reverse(out.begin(), out.end());
    return out;
}
int main() {
    string r;
    int n;
    while (cin >> r >> n) {
        auto point = r.find('.');
        int digits = point == string::npos ? 0 : (int)r.size() - (int)point - 1;
        if (point != string::npos)
            r.erase(point, 1);
        int base = stoi(r), scale = digits * n;
        string answer = "1";
        for (int i = 0; i < n; i++)
            answer = multiply(answer, base);
        if (scale) {
            if ((int)answer.size() <= scale)
                answer = string(scale + 1 - answer.size(), '0') + answer;
            answer.insert(answer.size() - scale, 1, '.');
            while (answer.back() == '0')
                answer.pop_back();
            if (answer.back() == '.')
                answer.pop_back();
        }
        while (answer.size() > 1 && answer[0] == '0')
            answer.erase(0, 1);
        cout << answer << '\n';
    }
}`,
    python: String.raw`import sys

it = iter(sys.stdin.buffer.read().split())
for token, power in zip(it, it):
    r = token.decode()
    n = int(power)
    digits = len(r.split('.')[1]) if '.' in r else 0
    answer = str(int(r.replace('.', '')) ** n)
    scale = digits * n
    if scale:
        answer = answer.zfill(scale + 1)
        answer = (answer[:-scale] + '.' + answer[-scale:]).rstrip('0').rstrip('.')
    answer = answer.lstrip('0') or '0'
    print(answer)
`,
  }),
  defineCpeLesson("a694", {
    topic: "simulation",
    level: "easy",
    concept: "手指狀態的0→1轉換計數",
    goal: "按鍵持續按住不重計，只計新音符新增的按鍵。",
    explanation: [
      "為14種音符建立所需手指集合，維護前一音符的按住狀態 previous。演奏下一音符 current 時，只有 current 中存在而 previous 不存在的手指才增加一次計數；集合差 current−previous 就是本次新按下的手指。",
      "更新計數後直接將 previous 換成 current，所以不需要分別模擬抬起動作。每首歌從空集合重新開始。題目允許空歌行，必須逐行讀且不能跳過空行，空歌的十個計數都是0。依手指1至10輸出十個整數，中間單一空白。",
    ],
    complexity: "歌長L，時間 O(10L)，固定十根手指空間 O(1)。",
    pitfall: "C和c的按法不同；連續兩個相同音符不會再次按鍵。",
    traceLabel: "示意：歌曲 bCb",
    trace: [
      {
        title: "b",
        description: "b需要手指2，第一次按下。",
        cells: ["指2:按住", "指3:鬆開"],
        active: [0],
        variables: [
          ["指2次數", "1"],
          ["指3次數", "0"],
        ],
      },
      {
        title: "C",
        description: "C只需手指3，放開2並按3。",
        cells: ["指2:鬆開", "指3:按住"],
        active: [1],
        variables: [
          ["指2次數", "1"],
          ["指3次數", "1"],
        ],
      },
      {
        title: "再b",
        description: "手指2重新按下，次數變2。",
        cells: ["指2:按住", "指3:鬆開"],
        active: [0],
        variables: [
          ["指2次數", "2"],
          ["指3次數", "1"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <string>
#include <vector>
#include <array>
using namespace std;
int main() {
    string notes = "cdefgabCDEFGAB";
    vector<vector<int>> fingers = {{2, 3, 4, 7, 8, 9, 10},
                                   {2, 3, 4, 7, 8, 9},
                                   {2, 3, 4, 7, 8},
                                   {2, 3, 4, 7},
                                   {2, 3, 4},
                                   {2, 3},
                                   {2},
                                   {3},
                                   {1, 2, 3, 4, 7, 8, 9},
                                   {1, 2, 3, 4, 7, 8},
                                   {1, 2, 3, 4, 7},
                                   {1, 2, 3, 4},
                                   {1, 2, 3},
                                   {1, 2}};
    int tests;
    cin >> tests;
    string song;
    getline(cin, song);
    while (tests--) {
        getline(cin, song);
        array<int, 11> count{}, previous{};
        for (char note : song) {
            auto at = notes.find(note);
            if (at == string::npos)
                continue;
            array<int, 11> current{};
            for (int f : fingers[at])
                current[f] = 1;
            for (int f = 1; f <= 10; f++)
                if (current[f] && !previous[f])
                    count[f]++;
            previous = current;
        }
        for (int f = 1; f <= 10; f++)
            cout << (f == 1 ? "" : " ") << count[f];
        cout << '\n';
    }
}`,
    python: String.raw`import sys

notes = 'cdefgabCDEFGAB'
keys = [
    (2, 3, 4, 7, 8, 9, 10),
    (2, 3, 4, 7, 8, 9),
    (2, 3, 4, 7, 8),
    (2, 3, 4, 7),
    (2, 3, 4),
    (2, 3),
    (2,),
    (3,),
    (1, 2, 3, 4, 7, 8, 9),
    (1, 2, 3, 4, 7, 8),
    (1, 2, 3, 4, 7),
    (1, 2, 3, 4),
    (1, 2, 3),
    (1, 2),
]
mapping = {note: set(fingers) for note, fingers in zip(notes, keys)}
tests = int(sys.stdin.readline())
for _ in range(tests):
    song = sys.stdin.readline().rstrip('\r\n')
    count = [0] * 11
    previous = set()
    for note in song:
        current = mapping[note]
        for f in current - previous:
            count[f] += 1
        previous = current
    print(*count[1:])
`,
  }),
  defineCpeLesson("a695", {
    topic: "dp",
    level: "hard",
    concept: "末項排名DP與前綴和加速",
    goal: "計算長達1000個升降條件的排列數，無須枚舉排列。",
    explanation: [
      "處理k個數時，dp[r]表示最後一個數在這k個數中的0起算排名為r的合法排列數。加入新末項後，它在k+1個數中的排名可為j。原末項排名若小於j，在插入新數後仍比新末項小；若大於等於j，重新編號後會比新末項大。",
      "因此I的轉移是 sum(dp[r],r<j)，D是 sum(dp[r],r≥j)，?則可接所有舊排列。用前綴和prefix[j]與總和計算這兩段，每次條件O(k)即可；初始只有一個數，dp=[1]。每步取模1000000007，最後加總所有末項排名。輸入字串長度L，實際排列長度是L+1，讀到EOF。",
    ],
    complexity: "時間 O(L²)，空間 O(L)。",
    pitfall: "D的範圍包含舊排名j；因插入新值會讓舊排名≥j的值向上移一名。",
    traceLabel: "示意：特徵字串 ID",
    trace: [
      {
        title: "一個數",
        description: "長度1只有排名0，計數1。",
        cells: ["rank0:1"],
        active: [0],
        variables: [["k", "1"]],
      },
      {
        title: "條件I",
        description: "加入更大的末項，長度2的dp=[0,1]。",
        cells: ["rank0:0", "rank1:1"],
        active: [1],
        variables: [["k", "2"]],
      },
      {
        title: "條件D",
        description: "後綴和得到[1,1,0]，總共2種：132、231。",
        cells: ["rank0:1", "rank1:1", "rank2:0"],
        active: [0, 1],
        variables: [["答案", "2"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <string>
#include <vector>
using namespace std;
int main() {
    const long long mod = 1000000007;
    string s;
    while (cin >> s) {
        vector<long long> dp(1, 1);
        for (char ch : s) {
            int k = dp.size();
            vector<long long> prefix(k + 1), next(k + 1);
            for (int i = 0; i < k; i++)
                prefix[i + 1] = (prefix[i] + dp[i]) % mod;
            for (int j = 0; j <= k; j++)
                next[j] = ch == 'I' ? prefix[j]
                                    : (ch == 'D' ? (prefix[k] - prefix[j] + mod) % mod : prefix[k]);
            dp.swap(next);
        }
        long long answer = 0;
        for (auto x : dp)
            answer = (answer + x) % mod;
        cout << answer << '\n';
    }
}`,
    python: String.raw`import sys

MOD = 1000000007
for line in sys.stdin.buffer:
    s = line.strip().decode()
    if not s:
        continue
    dp = [1]
    for ch in s:
        prefix = [0]
        for value in dp:
            prefix.append((prefix[-1] + value) % MOD)
        total = prefix[-1]
        if ch == 'I':
            dp = prefix
        elif ch == 'D':
            dp = [(total - value) % MOD for value in prefix]
        else:
            dp = [total] * len(prefix)
    print(sum(dp) % MOD)
`,
  }),
  defineCpeLesson("a696", {
    topic: "trees",
    level: "medium",
    concept: "最小堆排程與同時事件排序",
    goal: "只維護每個查詢下一次發生時間，不逐秒模擬。",
    explanation: [
      "每個查詢初次回傳於period秒，此後是2period、3period…。最小堆存 (nextTime,id,period)，依時間優先、編號次之排序，堆頂就是目前尚未輸出的最早回傳。所有查詢同時登記，不存在登記時間偏移。",
      "取出堆頂並輸出id，再把它的nextTime加period後放回，其他查詢完全不動。這維持每個查詢恰有一次未來候選事件，因此可依序列出前K次，且時間相同時小id先出。Register讀至#，再讀K；每次結果單獨一行，不加時間。",
    ],
    complexity: "R個登記、K次輸出：時間 O((R+K)log R)，空間 O(R)。",
    pitfall:
      "同一查詢可以反覆輸出；回填時間要加原本period，不能加目前全域時間。",
    traceLabel: "示意：查詢1週期2，查詢2週期3",
    trace: [
      {
        title: "第一次",
        description: "時間2取出查詢1，回填時間4。",
        cells: ["(2,id1)", "(3,id2)"],
        active: [0],
        variables: [["輸出", "1"]],
      },
      {
        title: "第二次",
        description: "時間3取出查詢2，回填時間6。",
        cells: ["(3,id2)", "(4,id1)"],
        active: [0],
        variables: [["輸出", "2"]],
      },
      {
        title: "同時事件",
        description: "先在4輸出1；時間6再依id1、id2排序。",
        cells: ["(4,id1)", "(6,id1)", "(6,id2)"],
        active: [1, 2],
        variables: [["前五次", "1,2,1,1,2"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <queue>
#include <tuple>
#include <vector>
#include <functional>
#include <string>
using namespace std;
int main() {
    using Event = tuple<long long, int, int>;
    priority_queue<Event, vector<Event>, greater<Event>> heap;
    string command;
    while (cin >> command && command != "#") {
        int id, period;
        cin >> id >> period;
        heap.push({period, id, period});
    }
    int k;
    cin >> k;
    while (k--) {
        auto [time, id, period] = heap.top();
        heap.pop();
        cout << id << '\n';
        heap.push({time + period, id, period});
    }
}`,
    python: String.raw`import sys, heapq

heap = []
for line in sys.stdin.buffer:
    parts = line.split()
    if parts == [b'#']:
        break
    if not parts:
        continue
    _, identifier, period = parts
    identifier, period = int(identifier), int(period)
    heap.append((period, identifier, period))
heapq.heapify(heap)
k = int(sys.stdin.buffer.readline())
for _ in range(k):
    time, identifier, period = heapq.heappop(heap)
    print(identifier)
    heapq.heappush(heap, (time + period, identifier, period))
`,
  }),
  defineCpeLesson("a697", {
    topic: "combinatorics",
    level: "medium",
    concept: "窄棋盤特例與棋盤黑白格",
    goal: "依最短邊分類推導最多互不攻擊騎士數。",
    explanation: [
      "騎士每次改變格子的黑白色，當兩邊都至少3時，選較多的同色格可放 ceil(MN/2) 個，標準騎士圖的配對上界也不允許更多。最短邊為1時，騎士完全不能合法跳躍，所以每格都能放；若有零邊則答案0。",
      "最短邊為2時要另外處理：騎士只會跨兩欄跳到另一列，每四欄可放四隻，餘下一、二、三欄分別再放2、4、4隻。因此若長邊為b，答案4·floor(b/4)+2·min(2,b%4)。計算時可交換長短邊，但輸出句子的M列N欄必須保持原輸入順序，0 0終止。",
    ],
    complexity: "每筆時間、空間 O(1)。",
    pitfall: "2×3可放4隻，直接套 ceil(MN/2)=3會少算。",
    traceLabel: "示意：2×7 棋盤",
    trace: [
      {
        title: "完整四欄",
        description: "前四欄選兩個連續欄的四格，放4隻。",
        cells: ["欄1:2隻", "欄2:2隻", "欄3:0", "欄4:0"],
        active: [0, 1],
        variables: [
          ["完整組", "1"],
          ["已放", "4"],
        ],
      },
      {
        title: "剩三欄",
        description: "欄5、6各放2隻，欄7不放。",
        cells: ["欄5:2隻", "欄6:2隻", "欄7:0"],
        active: [0, 1],
        variables: [["新增", "4"]],
      },
      {
        title: "合計",
        description: "4+4=8，所有已放格間沒有騎士攻擊。",
        cells: ["4", "+4", "8"],
        active: [2],
        variables: [["答案", "8"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <algorithm>
using namespace std;
int main() {
    long long m, n;
    while (cin >> m >> n && (m || n)) {
        long long a = min(m, n), b = max(m, n), answer;
        if (a == 0)
            answer = 0;
        else if (a == 1)
            answer = b;
        else if (a == 2)
            answer = 4 * (b / 4) + 2 * min(2LL, b % 4);
        else
            answer = (a * b + 1) / 2;
        cout << answer << " knights may be placed on a " << m << " row " << n << " column board.\n";
    }
}`,
    python: String.raw`import sys

it = iter(map(int, sys.stdin.buffer.read().split()))
for m, n in zip(it, it):
    if m == n == 0:
        break
    a, b = sorted((m, n))
    if a == 0:
        answer = 0
    elif a == 1:
        answer = b
    elif a == 2:
        answer = 4 * (b // 4) + 2 * min(2, b % 4)
    else:
        answer = (a * b + 1) // 2
    print(f'{answer} knights may be placed on a {m} row {n} column board.')
`,
  }),
  defineCpeLesson("a698", {
    topic: "dp",
    level: "medium",
    concept: "取石遊戲的必勝與必敗狀態",
    goal: "從空桌的必敗狀態向上推導最佳策略。",
    explanation: [
      "win[s]表示輪到操作且剩s顆時是否有必勝策略。win[0]=false，因為已沒有石頭可取；若存在合法取量a≤s使win[s−a]為false，就能把必敗局面交給對手，因此win[s]=true。若所有合法後繼都必勝，目前就必敗。",
      "取量都是正數，所以每個後繼石頭數更小，從1算到n即可，無須搜尋整棵博弈樹。集合含1確保正數局面都有操作。先排序取量，遇到比s大者即可停止；找到一個必敗後繼也可提早停止。輸入直到EOF，n的狀態為真印 Stan wins，否則 Ollie wins。",
    ],
    complexity: "每局時間 O(nm)，空間 O(n)。",
    pitfall: "不是有任一必勝後繼就必勝，應找能讓對手陷入必敗的操作。",
    traceLabel: "示意：可取1、3顆，n=4",
    trace: [
      {
        title: "0與1",
        description: "0必敗；1可取1交給0，所以必勝。",
        cells: ["0:敗", "1:勝"],
        active: [0, 1],
        variables: [["win[1]", "1"]],
      },
      {
        title: "2與3",
        description: "2只能到1所以敗；3可直接取3所以勝。",
        cells: ["0:敗", "1:勝", "2:敗", "3:勝"],
        active: [2, 3],
        variables: [
          ["win[2]", "0"],
          ["win[3]", "1"],
        ],
      },
      {
        title: "4顆",
        description: "取1到3、取3到1，都是對手必勝，故先手敗。",
        cells: ["4→3:勝", "4→1:勝", "4:敗"],
        active: [2],
        variables: [["輸出", "Ollie wins"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;
int main() {
    int n, m;
    while (cin >> n >> m) {
        vector<int> moves(m);
        for (int &x : moves)
            cin >> x;
        sort(moves.begin(), moves.end());
        vector<unsigned char> win(n + 1);
        for (int s = 1; s <= n; s++)
            for (int a : moves) {
                if (a > s)
                    break;
                if (!win[s - a]) {
                    win[s] = 1;
                    break;
                }
            }
        cout << (win[n] ? "Stan wins" : "Ollie wins") << '\n';
    }
}`,
    python: String.raw`import sys

it = iter(map(int, sys.stdin.buffer.read().split()))
for n, m in zip(it, it):
    moves = sorted(next(it) for _ in range(m))
    win = bytearray(n + 1)
    for s in range(1, n + 1):
        for a in moves:
            if a > s:
                break
            if not win[s - a]:
                win[s] = 1
                break
    print('Stan wins' if win[n] else 'Ollie wins')
`,
  }),
  defineCpeLesson("a699", {
    topic: "trees",
    level: "easy",
    concept: "同步模擬與候選排除",
    goal: "讓三種結構各自驗證操作紀錄，最後計算仍可能的種類。",
    explanation: [
      "建立stack、queue與最大優先佇列，開始三者都可能。每次放入x，就把x放進所有仍可能的結構。每次取出紀錄x，分別檢查候選是否為空、其應取出的值是否等於x；不合就永久排除，符合才執行取出。",
      "因為每個結構的取出規則固定，同一串操作對它的模擬結果是唯一的，遇到一次矛盾就不可能由後續操作補救。全部讀完，候選0個印impossible，1個印名稱，2或3個印not sure。Python以負值最小堆模擬最大優先佇列，避免誤取最小值。每組獨立初始化，讀到EOF。",
    ],
    complexity: "n次操作時間 O(n log n)，空間 O(n)。",
    pitfall: "只有放入而沒有取出的紀錄可同時符合三種結構，不能任意選一個名稱。",
    traceLabel: "示意：放2、放1、取1、取2",
    trace: [
      {
        title: "放入",
        description: "stack頂1、queue首2、最大堆頂2。",
        cells: ["stack:1", "queue:2", "priority:2"],
        active: [0, 1, 2],
        variables: [["候選數", "3"]],
      },
      {
        title: "取1",
        description: "只有stack的預測是1，排除另外兩者。",
        cells: ["stack:可行", "queue:排除", "priority:排除"],
        active: [0],
        variables: [["候選數", "1"]],
      },
      {
        title: "取2",
        description: "stack剩2，與紀錄吻合，確定stack。",
        cells: ["stack:空", "答案stack"],
        active: [1],
        variables: [["候選數", "1"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <stack>
#include <queue>
#include <string>
using namespace std;
int main() {
    int n;
    while (cin >> n) {
        stack<int> s;
        queue<int> q;
        priority_queue<int> p;
        bool a = true, b = true, c = true;
        while (n--) {
            int op, x;
            cin >> op >> x;
            if (op == 1) {
                if (a)
                    s.push(x);
                if (b)
                    q.push(x);
                if (c)
                    p.push(x);
            } else {
                if (a) {
                    if (s.empty() || s.top() != x)
                        a = false;
                    else
                        s.pop();
                }
                if (b) {
                    if (q.empty() || q.front() != x)
                        b = false;
                    else
                        q.pop();
                }
                if (c) {
                    if (p.empty() || p.top() != x)
                        c = false;
                    else
                        p.pop();
                }
            }
        }
        int count = a + b + c;
        cout << (count == 0  ? "impossible"
                 : count > 1 ? "not sure"
                 : a         ? "stack"
                 : b         ? "queue"
                             : "priority queue")
             << '\n';
    }
}`,
    python: String.raw`import sys, heapq
from collections import deque

it = iter(map(int, sys.stdin.buffer.read().split()))
for n in it:
    stack = []
    queue = deque()
    heap = []
    possible = [True] * 3
    for _ in range(n):
        op, x = next(it), next(it)
        if op == 1:
            if possible[0]:
                stack.append(x)
            if possible[1]:
                queue.append(x)
            if possible[2]:
                heapq.heappush(heap, -x)
        else:
            if possible[0]:
                if not stack or stack.pop() != x:
                    possible[0] = False
            if possible[1]:
                if not queue or queue.popleft() != x:
                    possible[1] = False
            if possible[2]:
                if not heap or -heapq.heappop(heap) != x:
                    possible[2] = False
    names = ['stack', 'queue', 'priority queue']
    candidates = [names[i] for i in range(3) if possible[i]]
    print(candidates[0] if len(candidates) == 1 else 'not sure' if candidates else 'impossible')
`,
  }),
];
