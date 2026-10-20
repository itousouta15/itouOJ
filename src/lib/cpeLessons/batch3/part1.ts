import { defineCpeLesson } from "@/lib/cpeLessonBuilder";

export const lessons = [
  defineCpeLesson("a588", {
    topic: "dp",
    level: "medium",
    concept: "自相似分割與列前綴計數",
    goal: "不建立指數大小的格子，求連續列的紅氣球數。",
    explanation: [
      "第 k 小時的圖由三塊紅色子圖和一塊全藍子圖組成。上半部每一列包含兩份 k−1 小時的列；下半部只有左側一份。令 F(k,x) 計算前 x 列紅球數，h=2^(k−1)，上半部有 F=2F(k−1,x)，下半部則是 2·3^(k−1)+F(k−1,x−h)。",
      "邊界 F(k,0)=0、F(0,1)=1；整張共有 3^k 個紅球。答案取 F(K,B)−F(K,A−1)，每次遞迴只選一側，深度為 K。讀取 T 筆並輸出 Case k:；3^30 已超過 32 位元，C++ 使用 long long。",
    ],
    complexity: "每筆時間 O(K)，遞迴空間 O(K)。",
    pitfall: "A、B 是列而非單一格子；下半部不能再乘 2。",
    traceLabel: "示意：K=2，查詢第 2 到 3 列",
    trace: [
      {
        title: "列權重",
        description: "四列紅球數依序為 4、2、2、1。",
        cells: ["4", "2", "2", "1"],
        active: [1, 2],
        variables: [
          ["K", "2"],
          ["A,B", "2,3"],
        ],
      },
      {
        title: "前 3 列",
        description: "F(2,3)=2×3+F(1,1)=6+2=8。",
        cells: ["4", "2", "2", "1"],
        active: [0, 1, 2],
        variables: [["F(2,3)", "8"]],
      },
      {
        title: "扣除前 1 列",
        description: "F(2,1)=4，所以範圍內有 8−4=4 顆紅球。",
        cells: ["4", "2", "2", "1"],
        active: [1, 2],
        variables: [
          ["F(2,1)", "4"],
          ["答案", "4"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
using namespace std;
long long power3[31];
long long prefix(int k, long long rows) {
    if (rows == 0)
        return 0;
    if (k == 0)
        return 1;
    long long half = 1LL << (k - 1);
    if (rows <= half)
        return 2 * prefix(k - 1, rows);
    return 2 * power3[k - 1] + prefix(k - 1, rows - half);
}
int main() {
    power3[0] = 1;
    for (int i = 1; i <= 30; ++i)
        power3[i] = 3 * power3[i - 1];
    int t;
    cin >> t;
    for (int cs = 1; cs <= t; ++cs) {
        int k;
        long long a, b;
        cin >> k >> a >> b;
        cout << "Case " << cs << ": " << prefix(k, b) - prefix(k, a - 1) << '\n';
    }
}`,
    python: String.raw`import sys


def prefix(k, rows):
    if rows == 0:
        return 0
    if k == 0:
        return 1
    half = 1 << (k - 1)
    if rows <= half:
        return 2 * prefix(k - 1, rows)
    return 2 * 3 ** (k - 1) + prefix(k - 1, rows - half)


it = iter(map(int, sys.stdin.buffer.read().split()))
t = next(it)
for cs in range(1, t + 1):
    k, a, b = next(it), next(it), next(it)
    print(f"Case {cs}: {prefix(k, b) - prefix(k, a - 1)}")
`,
  }),
  defineCpeLesson("a589", {
    topic: "sorting",
    level: "medium",
    concept: "固定起始方向的峰谷貪心",
    goal: "以一次掃描找出先降再升的最長交錯子序列。",
    explanation: [
      "維護最後一個候選端點及下一段需要的方向。起初需要下降；若新值更大，就用它替換起點，長度不增。若新值較小，便完成第一個下降，長度加一，接著改找上升。往後每次達成需要的方向才增加長度並翻轉方向。",
      "尚未轉向時，持續把端點替換成更極端的峰或谷：找下降時留較高的峰，找上升時留較低的谷，能讓所有後續選擇至少一樣容易。這個交換論證保證貪心不會失去最優解。讀 T 筆，完全遞增的序列答案只能是 1，不能套用允許任意起始方向的擺動長度。",
    ],
    complexity: "時間 O(n)，演算法額外空間 O(1)。",
    pitfall: "第一個比較必須下降；遇到同方向延伸只替換端點，不加長。",
    traceLabel: "示意：2、4、1、3、5",
    trace: [
      {
        title: "提高起點",
        description: "2 到 4 是上升，仍等待下降，改以 4 當起點。",
        cells: ["2", "4", "1", "3", "5"],
        active: [1],
        variables: [
          ["長度", "1"],
          ["端點", "4"],
        ],
      },
      {
        title: "完成下降",
        description: "4>1，形成長度 2，下一段要上升。",
        cells: ["4", "1", "3", "5"],
        active: [0, 1],
        variables: [
          ["長度", "2"],
          ["方向", "上升"],
        ],
      },
      {
        title: "上升後延伸",
        description: "1<3 增至 3；3<5 只把最後峰換成 5。答案 3。",
        cells: ["4", "1", "5"],
        active: [2],
        variables: [
          ["長度", "3"],
          ["下一段", "下降"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
using namespace std;
int main() {
    int t;
    cin >> t;
    while (t--) {
        int n, last;
        cin >> n >> last;
        int answer = 1;
        bool down = true;
        for (int i = 1, x; i < n; ++i) {
            cin >> x;
            if ((down && x < last) || (!down && x > last)) {
                ++answer;
                down = !down;
            }
            last = x;
        }
        cout << answer << '\n';
    }
}`,
    python: String.raw`import sys

it = iter(map(int, sys.stdin.buffer.read().split()))
for _ in range(next(it)):
    n = next(it)
    last = next(it)
    down, answer = True, 1
    for i in range(1, n):
        x = next(it)
        if (down and x < last) or (not down and x > last):
            answer += 1
            down = not down
        last = x
    print(answer)
`,
  }),
  defineCpeLesson("a590", {
    topic: "sorting",
    level: "medium",
    concept: "交換論證與有界乘方",
    goal: "將昂貴土地提早購買，安全判斷總價是否超出預算。",
    explanation: [
      "年份愈晚，價格 L 的指數愈大。對 x≥y≥1 及相鄰年份 t、t+1，先買 x 的花費比先買 y 少：差值由 x^t(x−1)≥y^t(y−1) 得證。因此將 L 遞減排序，依序支付 2L^1、2L^2……就是最低總價。",
      "預算只有 5000000，不必計算天文數字。以連乘求冪，每一步若 value>預算/L 就立刻判定超額；所有價格非負，任何單筆或累計超額都不可能挽回。即使已知超額，仍須先讀完該組的 0 哨兵，避免下一組錯位。",
    ],
    complexity: "排序 O(n log n)，乘方最多 O(n²) 次但會提早截斷；空間 O(n)。",
    pitfall: "年份從 1 開始；不要用浮點 pow 後轉整數，也不要先溢位再比較。",
    traceLabel: "示意：價格 7、2、10",
    trace: [
      {
        title: "排序",
        description: "依價格遞減為 10、7、2。",
        cells: ["10", "7", "2"],
        active: [0],
        variables: [
          ["年", "1"],
          ["成本", "20"],
        ],
      },
      {
        title: "第二年",
        description: "買 7，支付 2×7²=98，累計 118。",
        cells: ["20", "98", "未買"],
        active: [1],
        variables: [
          ["年", "2"],
          ["總價", "118"],
        ],
      },
      {
        title: "第三年",
        description: "買 2，支付 2×2³=16，最低總價 134。",
        cells: ["20", "98", "16"],
        active: [2],
        variables: [
          ["年", "3"],
          ["總價", "134"],
        ],
      },
    ],
    cpp: String.raw`#include <algorithm>
#include <functional>
#include <iostream>
#include <vector>
using namespace std;
int main() {
    int t;
    cin >> t;
    const long long limit = 5000000;
    while (t--) {
        vector<long long> land;
        long long x;
        while (cin >> x && x)
            land.push_back(x);
        sort(land.begin(), land.end(), greater<long long>());
        long long total = 0;
        bool over = false;
        for (int i = 0; i < (int)land.size() && !over; ++i) {
            long long value = 2;
            for (int j = 0; j <= i; ++j) {
                if (value > limit / land[i]) {
                    over = true;
                    break;
                }
                value *= land[i];
            }
            if (!over) {
                total += value;
                over = total > limit;
            }
        }
        if (over)
            cout << "Too expensive\n";
        else
            cout << total << '\n';
    }
}`,
    python: String.raw`import sys

it = iter(map(int, sys.stdin.buffer.read().split()))
for _ in range(next(it)):
    land = []
    while True:
        x = next(it)
        if x == 0:
            break
        land.append(x)
    total = 0
    for year, price in enumerate(sorted(land, reverse=True), 1):
        value = 2
        for _ in range(year):
            value *= price
            if value > 5000000:
                break
        total += value
        if total > 5000000:
            break
    print(total if total <= 5000000 else "Too expensive")
`,
  }),
  defineCpeLesson("a591", {
    topic: "dp",
    level: "medium",
    concept: "障礙網格的單調路徑計數",
    goal: "用到達點的最後一步推導安全路徑數。",
    explanation: [
      "令 dp[y][x] 是從 (0,0) 到 (x,y) 的安全路徑數。非狼點的最後一步只能來自 (x−1,y) 或 (x,y−1)，兩種情況互斥且完備，所以將兩者相加；狼點則強制為 0。起點初始化為 1，按 y、x 遞增處理即可。",
      "網格交叉點包含兩側端點，因此尺寸是 (h+1)×(w+1)。使用一列滾動陣列，更新前 dp[x] 代表下方，更新後 dp[x−1] 代表左方。讀到 0 0 結束；答案 0、1、多條各有不同完整英文句型。中間值可能超過最終答案，因此程式將計數飽和於 2^32，仍能保留題目保證範圍內的最終值。",
    ],
    complexity: "時間 O(wh+n)，額外空間 O(wh) 儲存障礙與 O(w) 計數。",
    pitfall: "不是 w×h 個點；單數 one path 與複數 paths 的句型不同。",
    traceLabel: "示意：w=h=2，狼在 (1,1)",
    trace: [
      {
        title: "底列",
        description: "起點一路向右，各點只有一條路徑。",
        cells: ["1", "1", "1"],
        active: [0, 1, 2],
        variables: [
          ["y", "0"],
          ["dp", "1,1,1"],
        ],
      },
      {
        title: "中間列",
        description: "狼點歸零，(2,1) 僅能由下方到達。",
        cells: ["1", "0 狼", "1"],
        active: [1, 2],
        variables: [
          ["y", "1"],
          ["dp", "1,0,1"],
        ],
      },
      {
        title: "最上列",
        description: "(1,2) 有 1 條，終點得到 1+1=2。",
        cells: ["1", "1", "2"],
        active: [2],
        variables: [
          ["y", "2"],
          ["答案", "2"],
        ],
      },
    ],
    cpp: String.raw`#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;
int main() {
    int w, h;
    while (cin >> w >> h && (w || h)) {
        int n;
        cin >> n;
        vector<vector<bool>> wolf(h + 1, vector<bool>(w + 1));
        while (n--) {
            int x, y;
            cin >> x >> y;
            wolf[y][x] = true;
        }
        vector<long long> dp(w + 1);
        dp[0] = 1;
        for (int y = 0; y <= h; ++y)
            for (int x = 0; x <= w; ++x) {
                if (wolf[y][x])
                    dp[x] = 0;
                else if (x)
                    dp[x] = min(1LL << 32, dp[x] + dp[x - 1]);
            }
        long long a = dp[w];
        if (!a)
            cout << "There is no path.\n";
        else if (a == 1)
            cout << "There is one path from Little Red Riding Hood's house to her "
                    "grandmother's house.\n";
        else
            cout << "There are " << a
                 << " paths from Little Red Riding Hood's house to her grandmother's "
                    "house.\n";
    }
}`,
    python: String.raw`import sys

it = iter(map(int, sys.stdin.buffer.read().split()))
for w in it:
    h = next(it)
    if w == h == 0:
        break
    wolves = {(next(it), next(it)) for _ in range(next(it))}
    dp = [0] * (w + 1)
    dp[0] = 1
    for y in range(h + 1):
        for x in range(w + 1):
            if (x, y) in wolves:
                dp[x] = 0
            elif x:
                dp[x] += dp[x - 1]
    a = dp[w]
    if a == 0:
        print("There is no path.")
    elif a == 1:
        print("There is one path from Little Red Riding Hood's house to her grandmother's house.")
    else:
        print(
            f"There are {a} paths from Little Red Riding Hood's house to her grandmother's house."
        )
`,
  }),
  defineCpeLesson("a592", {
    topic: "number-theory",
    level: "medium",
    concept: "淘汰樹的祖先數與子樹大小",
    goal: "以二進位特徵計算隊伍可得到的名次範圍。",
    explanation: [
      "每場比賽由小編號勝出，所以隊伍 X 的直接敗者關係構成以 0 為根的樹。X 的父親是清掉最低有效 1 位後的數；反覆清位走向 0，因此祖先數等於 popcount(X)，這些隊伍必須排在 X 之前。其餘隊伍可往後放，最好名次便是 popcount(X)+1。",
      "若 X 非 0，令 t 為末尾連續 0 的數量。X 會贏得大小 2^t 的整個區段，故嚴格後代共有 2^t−1 隊；把所有非後代排在它前方，最差名次是 2^N−2^t+1。X=0 必為冠軍，直接輸出 1 1。每筆僅輸出兩個名次，不附案例標籤。",
    ],
    complexity: "時間 O(N)，空間 O(1)。",
    pitfall: "最好名次不是 X+1；冠軍 0 沒有最低有效 1，需單獨處理。",
    traceLabel: "示意：N=4，X=10（二進位 1010）",
    trace: [
      {
        title: "祖先鏈",
        description: "10 清最低 1 得 8，再清為 0，有兩個祖先。",
        cells: ["10", "8", "0"],
        active: [1, 2],
        variables: [
          ["popcount", "2"],
          ["最好", "3"],
        ],
      },
      {
        title: "可擊敗的後代",
        description: "末尾有一個 0，子樹為 {10,11}。",
        cells: ["10", "11"],
        active: [1],
        variables: [
          ["t", "1"],
          ["後代數", "1"],
        ],
      },
      {
        title: "延後排入",
        description: "除 11 外其他 14 隊可先排，10 最差排第 15。",
        cells: ["14 隊", "10", "11"],
        active: [1],
        variables: [
          ["總隊數", "16"],
          ["最差", "15"],
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
        long long x;
        cin >> n >> x;
        if (x == 0) {
            cout << "1 1\n";
            continue;
        }
        int ones = 0;
        for (long long v = x; v; v >>= 1)
            ones += v & 1;
        long long low = x & -x;
        cout << ones + 1 << ' ' << (1LL << n) - low + 1 << '\n';
    }
}`,
    python: String.raw`import sys

it = iter(map(int, sys.stdin.buffer.read().split()))
for _ in range(next(it)):
    n, x = next(it), next(it)
    if x == 0:
        print(1, 1)
    else:
        print(x.bit_count() + 1, (1 << n) - (x & -x) + 1)
`,
  }),
  defineCpeLesson("a593", {
    topic: "geometry",
    level: "medium",
    concept: "點在多邊形內與分離牆計數",
    goal: "以內外狀態不同的多邊形數計算最少跳牆次數。",
    explanation: [
      "每一道簡單閉合牆將平面分成內外。起終點位於不同側時，任何路線至少穿越該牆一次；在同側則不必穿越它。由於邊界互不相交，隔間只可能分離或巢狀，沿包含關係樹從起點區域走到終點區域，恰能只跨越所有狀態不同的牆。",
      "逐一以水平射線判定兩點是否在多邊形內：僅在邊的兩端分處射線高度兩側時測試交點，若交點在右方就翻轉奇偶值。半開的高度判斷避免頂點重算；水平邊不會進行除法。題目保證查詢不在牆上。每組先印 Case k:，每個查詢再印計數。",
    ],
    complexity: "每組時間 O(QnS)，空間 O(nS)。",
    pitfall: "不是算起終點直線與牆的交點數；凹多邊形可能讓直線多次穿牆。",
    traceLabel: "示意：外正方形 [1,5]、內正方形 [2,4]，(3,3) 到 (8,8)",
    trace: [
      {
        title: "外牆",
        description: "(3,3) 在外正方形內，(8,8) 在外，必跨一道。",
        cells: ["外牆：1", "內牆：待查"],
        active: [0],
        variables: [
          ["起點內外", "1"],
          ["終點內外", "0"],
        ],
      },
      {
        title: "內牆",
        description: "起點也在內正方形內，終點不在，再加一道。",
        cells: ["外牆：1", "內牆：1"],
        active: [1],
        variables: [["累計", "2"]],
      },
      {
        title: "可達下界",
        description: "先離開內牆再離開外牆，總共 2 次。",
        cells: ["內區", "外牆內區", "房間"],
        active: [0, 1, 2],
        variables: [["最少跳牆", "2"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
using namespace std;
struct Point {
    double x, y;
};
bool inside(const vector<Point> &p, Point q) {
    bool answer = false;
    int n = p.size();
    for (int i = 0, j = n - 1; i < n; j = i++) {
        Point a = p[i], b = p[j];
        if ((a.y > q.y) != (b.y > q.y)) {
            double x = a.x + (b.x - a.x) * (q.y - a.y) / (b.y - a.y);
            if (x > q.x)
                answer = !answer;
        }
    }
    return answer;
}
int main() {
    int t;
    cin >> t;
    for (int cs = 1; cs <= t; ++cs) {
        int n;
        cin >> n;
        vector<vector<Point>> walls(n);
        for (auto &p : walls) {
            int s;
            cin >> s;
            p.resize(s);
            for (auto &v : p)
                cin >> v.x >> v.y;
        }
        cout << "Case " << cs << ":\n";
        int q;
        cin >> q;
        while (q--) {
            Point a, b;
            cin >> a.x >> a.y >> b.x >> b.y;
            int ans = 0;
            for (auto &p : walls)
                ans += inside(p, a) != inside(p, b);
            cout << ans << '\n';
        }
    }
}`,
    python: String.raw`import sys


def inside(poly, q):
    x, y = q
    answer = False
    for i, (ax, ay) in enumerate(poly):
        bx, by = poly[i - 1]
        if (ay > y) != (by > y):
            cross = ax + (bx - ax) * (y - ay) / (by - ay)
            if cross > x:
                answer = not answer
    return answer


it = iter(map(int, sys.stdin.buffer.read().split()))
for cs in range(1, next(it) + 1):
    walls = []
    for _ in range(next(it)):
        walls.append([(next(it), next(it)) for _ in range(next(it))])
    print(f"Case {cs}:")
    for _ in range(next(it)):
        a = (next(it), next(it))
        b = (next(it), next(it))
        print(sum(inside(p, a) != inside(p, b) for p in walls))
`,
  }),
  defineCpeLesson("a594", {
    topic: "sorting",
    level: "easy",
    concept: "集合差與交換瓶頸",
    goal: "只計算不同卡號，找出兩方都能提供的新種類數。",
    explanation: [
      "將兩人的持有卡號分別做成集合 A、B。Alice 能給的有效種類恰為 A−B，Betty 能給的恰為 B−A；同編號的多張卡只算一種，不能增加交換量。",
      "每次交換各出一張，因此上界為兩個集合差大小的較小者。任選這麼多個互異卡號配對，就能同時滿足對方原先沒有及收到不重複，所以上界可以達到。輸入原本已排序，但集合方法也能直接處理；讀到 0 0 不再讀卡號。",
    ],
    complexity:
      "C++ 有序集合 O((A+B) log(A+B))；Python 集合平均 O(A+B)，空間 O(A+B)。",
    pitfall: "比較種類數而非張數，答案不是兩個集合差的總和。",
    traceLabel: "示意：Alice={1,1,3,5}，Betty={3,4,4}",
    trace: [
      {
        title: "去除重複",
        description: "Alice 有 3 種，Betty 有 2 種。",
        cells: ["1", "3", "5", "3", "4"],
        active: [0, 1, 2, 3, 4],
        variables: [
          ["|A|", "3"],
          ["|B|", "2"],
        ],
      },
      {
        title: "取集合差",
        description: "Alice 可出 1、5；Betty 只能出 4。",
        cells: ["1", "5", "4"],
        active: [0, 1, 2],
        variables: [
          ["|A−B|", "2"],
          ["|B−A|", "1"],
        ],
      },
      {
        title: "配對",
        description: "例如以 1 換 4，最多各交換 1 張。",
        cells: ["1 ↔ 4", "5 保留"],
        active: [0],
        variables: [["答案", "1"]],
      },
    ],
    cpp: String.raw`#include <algorithm>
#include <iostream>
#include <set>
using namespace std;
int main() {
    int a, b;
    while (cin >> a >> b && (a || b)) {
        set<int> x, y;
        int v;
        for (int i = 0; i < a; ++i) {
            cin >> v;
            x.insert(v);
        }
        for (int i = 0; i < b; ++i) {
            cin >> v;
            y.insert(v);
        }
        int u = 0, w = 0;
        for (int z : x)
            u += !y.count(z);
        for (int z : y)
            w += !x.count(z);
        cout << min(u, w) << '\n';
    }
}`,
    python: String.raw`import sys

it = iter(map(int, sys.stdin.buffer.read().split()))
for a in it:
    b = next(it)
    if a == b == 0:
        break
    x = {next(it) for _ in range(a)}
    y = {next(it) for _ in range(b)}
    print(min(len(x - y), len(y - x)))
`,
  }),
  defineCpeLesson("a595", {
    topic: "dp",
    level: "hard",
    concept: "已取寶藏區間與左右端點狀態",
    goal: "在嚴格期限下，以線性記憶體計算最早完成時間。",
    explanation: [
      "位置已排序，走過一個寶藏時立刻取得不會有壞處，所以已取得的寶藏總可視為連續區間。令 L(l,r)、R(l,r) 分別表示取完 [l,r] 且停在左、右端的最早時間。初始任選起點，單點狀態為 0，但期限必須大於 0。從 [l+1,r] 走到 l，或從 [l,r−1] 走到 r，分別比較兩個舊端點的移動距離。",
      "轉移得到的時間必須嚴格小於新寶藏期限，因為到達期限當下就消失；失敗狀態設為無限大。對同一區間及端點，較早到達永遠不劣，因此只保留最早值即可。依區間長度遞增，用兩組長度 n 的陣列滾動保存上一層，避免 O(n²) 記憶體。若一整層都無法到達，較大區間也不可能合法，可提早結束。另先檢查從任一端直走能否符合全部期限：若可行，時間恰等於兩端距離，已達必走距離下界，可直接輸出。其餘才做 DP，最後兩端取小；讀至 EOF，無解輸出 No solution。",
    ],
    complexity:
      "時間 O(n²)，額外空間 O(n)；n=10000 時 Python 的平方迴圈成本較高。",
    pitfall:
      "判斷是 arrival < deadline，不能接受等於；起點可任選，不固定在最左端。不可達狀態不能再加距離。C++ 輸入座標／期限須可存入有號 64 位元，並用 GNU __int128 擴充計算距離與加法，超過可用期限才飽和；Python 的不可達標記大於所有期限，不用固定常數假裝無限大。",
    traceLabel: "示意：位置 1、3、5，期限 3、1、8",
    trace: [
      {
        title: "單點起步",
        description: "可在三個位置的任一點以時間 0 開始。",
        cells: ["1@0", "3@0", "5@0"],
        active: [0, 1, 2],
        variables: [
          ["區間長", "1"],
          ["最早時間", "0"],
        ],
      },
      {
        title: "取得前兩個",
        description: "從 3 出發到 1，時間 2<3；反向到 3 時 2≥1 不合法。",
        cells: ["1@2", "3@0", "5"],
        active: [0, 1],
        variables: [
          ["L(0,1)", "2"],
          ["R(0,1)", "∞"],
        ],
      },
      {
        title: "移至右端",
        description: "從 1 走到 5 多花 4，時間 6<8，完成所有寶藏。",
        cells: ["1@2", "3@0", "5@6"],
        active: [2],
        variables: [
          ["R(0,2)", "6"],
          ["答案", "6"],
        ],
      },
    ],
    cpp: String.raw`#include <algorithm>
#include <iostream>
#include <limits>
#include <vector>
using namespace std;
int main() {
    int n;
    const long long inf = numeric_limits<long long>::max();
    auto advance = [](long long time, __int128 distance) -> long long {
        if (time == inf) return inf;
        __int128 arrival = (__int128)time + distance;
        return arrival >= inf ? inf : (long long)arrival;
    };
    while (cin >> n) {
        vector<long long> x(n), deadline(n), left(n), right(n);
        for (int i = 0; i < n; ++i) {
            cin >> x[i] >> deadline[i];
            left[i] = right[i] = deadline[i] > 0 ? 0 : inf;
        }
        bool forward = true, backward = true;
        for (int i = 0; i < n; ++i) {
            forward = forward && (__int128)x[i] - x[0] < deadline[i];
            backward = backward && (__int128)x[n - 1] - x[i] < deadline[i];
        }
        if (forward || backward) {
            cout << (long long)((__int128)x[n - 1] - x[0]) << '\n';
            continue;
        }
        for (int len = 2; len <= n; ++len) {
            vector<long long> nl(n, inf), nr(n, inf);
            bool reachable = false;
            for (int l = 0, r = len - 1; r < n; ++l, ++r) {
                long long a = min(advance(left[l + 1], (__int128)x[l + 1] - x[l]),
                                  advance(right[l + 1], (__int128)x[r] - x[l]));
                long long b = min(advance(left[l], (__int128)x[r] - x[l]),
                                  advance(right[l], (__int128)x[r] - x[r - 1]));
                if (a < deadline[l]) {
                    nl[l] = a;
                    reachable = true;
                }
                if (b < deadline[r]) {
                    nr[l] = b;
                    reachable = true;
                }
            }
            left.swap(nl);
            right.swap(nr);
            if (!reachable)
                break;
        }
        long long ans = min(left[0], right[0]);
        if (ans == inf)
            cout << "No solution\n";
        else
            cout << ans << '\n';
    }
}`,
    python: String.raw`import sys

it = iter(map(int, sys.stdin.buffer.read().split()))
for n in it:
    x, deadline = [], []
    for _ in range(n):
        x.append(next(it))
        deadline.append(next(it))
    INF = max(0, max(deadline)) + 1
    if all(v - x[0] < d for v, d in zip(x, deadline)) or all(
        x[-1] - v < d for v, d in zip(x, deadline)
    ):
        print(x[-1] - x[0])
        continue
    left = [0 if d > 0 else INF for d in deadline]
    right = left[:]
    for length in range(2, n + 1):
        size = n - length + 1
        nl, nr = [INF] * size, [INF] * size
        reachable = False
        for l in range(size):
            r = l + length - 1
            a = min(left[l + 1] + x[l + 1] - x[l] if left[l + 1] != INF else INF,
                    right[l + 1] + x[r] - x[l] if right[l + 1] != INF else INF)
            b = min(left[l] + x[r] - x[l] if left[l] != INF else INF,
                    right[l] + x[r] - x[r - 1] if right[l] != INF else INF)
            if a < deadline[l]:
                nl[l] = a
                reachable = True
            if b < deadline[r]:
                nr[l] = b
                reachable = True
        left, right = nl, nr
        if not reachable:
            break
    answer = min(left[0], right[0])
    print("No solution" if answer == INF else answer)
`,
  }),
  defineCpeLesson("a596", {
    topic: "search",
    level: "easy",
    concept: "固定中心逐圈擴張",
    goal: "只檢查新增外框，找出最大的同字元奇數正方形。",
    explanation: [
      "半徑 0 是中心一格，一定合法。假設半徑 d−1 的正方形已全相同，擴張到 d 時，只需驗證新增的上下兩列及左右兩欄。先確認沒有超出矩陣，再比較所有外框字元是否等於中心。",
      "任一外框失敗，所有更大正方形都包含這個失敗格，因此可立刻停止；最大半徑 d 對應邊長 2d+1。每組輸出前要原樣印出 M N Q，座標從 0 開始。每圈 O(d) 而不是重新檢查整個內部，總工作量為最大正方形面積量級。",
    ],
    complexity: "每查詢 O(min(M,N)²)，儲存方格 O(MN)。",
    pitfall: "中心靠邊時答案仍至少為 1；輸出的是邊長，不是半徑或面積。",
    traceLabel: "示意：5×5 全 a，中心 (2,2)",
    trace: [
      {
        title: "半徑 0",
        description: "中心字元 a，初始邊長 1。",
        cells: ["a"],
        active: [0],
        variables: [
          ["半徑", "0"],
          ["邊長", "1"],
        ],
      },
      {
        title: "第一圈",
        description: "新增 8 格都是 a，擴張成 3×3。",
        cells: ["aaa", "aaa", "aaa"],
        active: [0, 1, 2],
        variables: [
          ["半徑", "1"],
          ["邊長", "3"],
        ],
      },
      {
        title: "第二圈",
        description: "新增 16 格也相同，邊長 5；下一圈超界停止。",
        cells: ["aaaaa", "aaaaa", "aaaaa", "aaaaa", "aaaaa"],
        active: [0, 4],
        variables: [
          ["半徑", "2"],
          ["答案", "5"],
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
        int m, n, q;
        cin >> m >> n >> q;
        vector<string> g(m);
        for (auto &s : g)
            cin >> s;
        cout << m << ' ' << n << ' ' << q << '\n';
        while (q--) {
            int r, c;
            cin >> r >> c;
            int d = 1;
            for (;; ++d) {
                if (r - d < 0 || r + d >= m || c - d < 0 || c + d >= n)
                    break;
                bool ok = true;
                char ch = g[r][c];
                for (int i = -d; i <= d; ++i)
                    if (g[r - d][c + i] != ch || g[r + d][c + i] != ch || g[r + i][c - d] != ch ||
                        g[r + i][c + d] != ch)
                        ok = false;
                if (!ok)
                    break;
            }
            cout << 2 * d - 1 << '\n';
        }
    }
}`,
    python: String.raw`import sys

it = iter(sys.stdin.buffer.read().split())
for _ in range(int(next(it))):
    m, n, q = int(next(it)), int(next(it)), int(next(it))
    g = [next(it) for _ in range(m)]
    print(m, n, q)
    for _ in range(q):
        r, c = int(next(it)), int(next(it))
        d = 1
        while r - d >= 0 and r + d < m and c - d >= 0 and c + d < n:
            ch = g[r][c]
            if any(
                g[r - d][c + i] != ch
                or g[r + d][c + i] != ch
                or g[r + i][c - d] != ch
                or g[r + i][c + d] != ch
                for i in range(-d, d + 1)
            ):
                break
            d += 1
        print(2 * d - 1)
`,
  }),
  defineCpeLesson("a597", {
    topic: "simulation",
    level: "easy",
    concept: "有限狀態與首次重複偵測",
    goal: "以整數除餘實作平方取中法，計算不同狀態數。",
    explanation: [
      "四位數平方補為八位後，取中間四位等同於 (a×a//100)%10000。整數運算會自然處理前導零，不必真的把平方轉字串補零。狀態總共只有 10000 種。",
      "用集合保存已見的數字；目前值尚未出現就加入並轉移，第一次重複便停止。因為下一個狀態完全由現在值決定，重複後永遠只會循環，不再產生新值。初始值也要計入；輸入的 0 是結束標記，但運算途中產生 0 是合法狀態，必須計一次。",
    ],
    complexity: "每筆最多 O(10000) 時間與空間。",
    pitfall: "取中間四位不是平方後取最後四位；初始值不能漏算。",
    traceLabel: "示意：a₀=1000",
    trace: [
      {
        title: "初始狀態",
        description: "先記錄 1000，平方為 01000000。",
        cells: ["1000"],
        active: [0],
        variables: [
          ["不同值", "1"],
          ["下一個", "0"],
        ],
      },
      {
        title: "出現零",
        description: "中間四位是 0000，加入狀態 0。",
        cells: ["1000", "0"],
        active: [1],
        variables: [
          ["不同值", "2"],
          ["0²", "0"],
        ],
      },
      {
        title: "重複停止",
        description: "0 再次變成 0，已經出現，答案為 2。",
        cells: ["1000", "0", "0 重複"],
        active: [2],
        variables: [["答案", "2"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <set>
using namespace std;
int main() {
    int a;
    while (cin >> a && a) {
        set<int> seen;
        while (!seen.count(a)) {
            seen.insert(a);
            a = (a * a / 100) % 10000;
        }
        cout << seen.size() << '\n';
    }
}`,
    python: String.raw`import sys

for token in sys.stdin.buffer.read().split():
    a = int(token)
    if a == 0:
        break
    seen = set()
    while a not in seen:
        seen.add(a)
        a = (a * a // 100) % 10000
    print(len(seen))
`,
  }),
  defineCpeLesson("a598", {
    topic: "number-theory",
    level: "hard",
    concept: "固定乘法數的進位表示與壓縮字典序",
    goal: "不枚舉巨大指令字串，找出最短且字典序最小的程式。",
    explanation: [
      "固定使用 t 次 M，令 P=m^t。整段程式是 y=Px+a·z；在尚餘 i 次 M 前做一次 A，會對 z 貢獻 m^i。要讓整個 [p,q] 進入 [r,s]，必須有 L=max(0,ceil((r−pP)/a))≤z≤U=floor((s−qP)/a)。對固定 z，用 m 進位的低 t 位加上可大於 m−1 的最高位，得到最少 A 數；每 m 個低位 A 換成一個高位 A 都可減少長度。",
      "不需枚舉 [L,U]：最優 z 只需考慮 L，以及將 L 向上取整為 m^j 倍數的值（1≤j≤t）。任何其他 z 與 L 的第一個不同高位若多增，或仍有非零低位，都不可能優於這些候選的位數和；相同長度則偏好把 A 放得更前。把候選表示成連續 A/M 的段落，以段落比較完整字串字典序，避免展開數十億指令。當 pP>s 就停止增加 t。m=1 時 M 無效，只需最少 A；所有案例輸出 Case k:，並區分 empty、impossible。",
    ],
    complexity: "m>1 時設 H=⌊log_m(s/p)⌋，時間 O(H³)、空間 O(H)；m=1 為 O(1)。",
    pitfall: "比較的是未壓縮指令長度及字典序，不能直接比較像 10A 這樣的文字。",
    traceLabel: "示意：a=1,m=2，[2,3] 送入 [10,20]",
    trace: [
      {
        title: "不乘法",
        description: "t=0 時需至少 8 個 A，將區間移至 [10,11]。",
        cells: ["2", "3", "8A"],
        active: [2],
        variables: [
          ["長度", "8"],
          ["z", "8"],
        ],
      },
      {
        title: "兩次乘法",
        description: "P=4，z 可在 [2,8]；選 z=4，進位係數為 1,0,0。",
        cells: ["1×4", "0×2", "0×1"],
        active: [0],
        variables: [
          ["A 數", "1"],
          ["M 數", "2"],
        ],
      },
      {
        title: "執行最短解",
        description: "先 A 得 [3,4]，再 M、M 得 [12,16]，長度 3。",
        cells: ["[2,3]", "[3,4]", "[6,8]", "[12,16]"],
        active: [1, 2, 3],
        variables: [
          ["輸出", "1A 2M"],
          ["長度", "3"],
        ],
      },
    ],
    cpp: String.raw`#include <algorithm>
#include <iostream>
#include <string>
#include <vector>
using namespace std;
using Run = pair<char, long long>;
void add(vector<Run> &v, char ch, long long n) {
    if (!n)
        return;
    if (!v.empty() && v.back().first == ch)
        v.back().second += n;
    else
        v.push_back({ch, n});
}
bool lexLess(vector<Run> a, vector<Run> b) {
    size_t i = 0, j = 0;
    while (i < a.size() && j < b.size()) {
        if (a[i].first != b[j].first)
            return a[i].first < b[j].first;
        long long z = min(a[i].second, b[j].second);
        a[i].second -= z;
        b[j].second -= z;
        if (!a[i].second)
            ++i;
        if (!b[j].second)
            ++j;
    }
    return i == a.size() && j < b.size();
}
int main() {
    long long a, m, p, q, r, s;
    int cs = 0;
    while (cin >> a >> m >> p >> q >> r >> s && a) {
        long long bestLen = 4000000000000000000LL;
        vector<Run> best;
        long long power = 1;
        for (int t = 0;; ++t) {
            if (power > s / p)
                break;
            long long low = max(0LL, (r - p * power + a - 1) / a);
            long long high = (s - q * power >= 0) ? (s - q * power) / a : -1;
            if (low <= high) {
                long long unit = 1;
                for (int j = 0; j <= t; ++j) {
                    long long z = (low + unit - 1) / unit * unit;
                    if (z <= high) {
                        vector<long long> digit(t + 1);
                        long long v = z;
                        for (int i = 0; i < t; ++i) {
                            digit[i] = v % m;
                            v /= m;
                        }
                        digit[t] = v;
                        vector<Run> runs;
                        long long length = t;
                        for (int i = t; i >= 0; --i) {
                            add(runs, 'A', digit[i]);
                            length += digit[i];
                            if (i)
                                add(runs, 'M', 1);
                        }
                        if (length < bestLen || (length == bestLen && lexLess(runs, best))) {
                            bestLen = length;
                            best = runs;
                        }
                    }
                    if (j < t)
                        unit *= m;
                }
            }
            if (m == 1 || power > s / m)
                break;
            power *= m;
        }
        cout << "Case " << ++cs << ": ";
        if (bestLen == 4000000000000000000LL)
            cout << "impossible";
        else if (!bestLen)
            cout << "empty";
        else
            for (size_t i = 0; i < best.size(); ++i) {
                if (i)
                    cout << ' ';
                cout << best[i].second << best[i].first;
            }
        cout << '\n';
    }
}`,
    python: String.raw`import sys


def lex_less(a, b):
    a, b = [list(x) for x in a], [list(x) for x in b]
    i = j = 0
    while i < len(a) and j < len(b):
        if a[i][0] != b[j][0]:
            return a[i][0] < b[j][0]
        z = min(a[i][1], b[j][1])
        a[i][1] -= z
        b[j][1] -= z
        if not a[i][1]:
            i += 1
        if not b[j][1]:
            j += 1
    return i == len(a) and j < len(b)


def solve(a, m, p, q, r, s):
    power, t, best_len, best = 1, 0, 10**30, []
    while p * power <= s:
        low = max(0, (r - p * power + a - 1) // a)
        high = (s - q * power) // a
        unit = 1
        for j in range(t + 1):
            z = (low + unit - 1) // unit * unit
            if z <= high:
                digits, v = [], z
                for _ in range(t):
                    digits.append(v % m)
                    v //= m
                digits.append(v)
                runs = []
                for i in range(t, -1, -1):
                    if digits[i]:
                        runs.append(('A', digits[i]))
                    if i:
                        if runs and runs[-1][0] == 'M':
                            runs[-1] = ('M', runs[-1][1] + 1)
                        else:
                            runs.append(('M', 1))
                length = t + sum(digits)
                if length < best_len or (length == best_len and lex_less(runs, best)):
                    best_len, best = length, runs
            unit *= m
        if m == 1:
            break
        power *= m
        t += 1
    if best_len == 10**30:
        return 'impossible'
    if best_len == 0:
        return 'empty'
    return ' '.join(str(n) + ch for ch, n in best)


it = iter(map(int, sys.stdin.buffer.read().split()))
cs = 0
for a in it:
    m, p, q, r, s = [next(it) for _ in range(5)]
    if a == 0:
        break
    cs += 1
    print(f"Case {cs}: {solve(a, m, p, q, r, s)}")
`,
  }),
  defineCpeLesson("a599", {
    topic: "dp",
    level: "medium",
    concept: "有上界的正整數組成",
    goal: "把條碼計數轉成 k 個正寬度之和為 n 的方法數。",
    explanation: [
      "第一條顏色固定、之後顏色交替，因此只要給定各條寬度，條碼便唯一決定。令 dp[j][s] 表示用 j 條組成寬度 s 的方法數；最後一條寬度 w 可取 1 到 m，所以 dp[j][s]=Σdp[j−1][s−w]。",
      "從 dp[0][0]=1 出發，每增加一條都使用全新的陣列，避免同一層重複使用。總寬不足 k 或超過 k·m 的狀態自然為零。每組讀 n k m 至 EOF，輸出 dp[k][n]；C++ 必須以 long long 保存計數。",
    ],
    complexity: "時間 O(knm)，滾動陣列空間 O(n)。",
    pitfall: "條紋寬度不可為 0；不能再乘 2 計入淺色起頭。",
    traceLabel: "示意：n=4,k=2,m=3",
    trace: [
      {
        title: "尚無條紋",
        description: "寬度 0 有一種空組成。",
        cells: ["1", "0", "0", "0", "0"],
        active: [0],
        variables: [["條數", "0"]],
      },
      {
        title: "加入第一條",
        description: "寬 1、2、3 各有一種。",
        cells: ["0", "1", "1", "1", "0"],
        active: [1, 2, 3],
        variables: [["條數", "1"]],
      },
      {
        title: "加入第二條",
        description: "總寬 4 對應 (1,3)、(2,2)、(3,1)，共有 3 種。",
        cells: ["1+3", "2+2", "3+1"],
        active: [0, 1, 2],
        variables: [["dp[2][4]", "3"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
using namespace std;
int main() {
    int n, k, m;
    while (cin >> n >> k >> m) {
        vector<long long> dp(n + 1);
        dp[0] = 1;
        for (int j = 0; j < k; ++j) {
            vector<long long> next(n + 1);
            for (int s = 1; s <= n; ++s)
                for (int w = 1; w <= m && w <= s; ++w)
                    next[s] += dp[s - w];
            dp.swap(next);
        }
        cout << dp[n] << '\n';
    }
}`,
    python: String.raw`import sys

it = iter(map(int, sys.stdin.buffer.read().split()))
for n in it:
    k, m = next(it), next(it)
    dp = [1] + [0] * n
    for _ in range(k):
        nd = [0] * (n + 1)
        for s in range(1, n + 1):
            nd[s] = sum(dp[s - w] for w in range(1, min(m, s) + 1))
        dp = nd
    print(dp[n])
`,
  }),
  defineCpeLesson("a600", {
    topic: "geometry",
    level: "easy",
    concept: "三軸區間交集",
    goal: "逐步收縮共同包圍盒並計算正體積。",
    explanation: [
      "每個立方體可寫成三個區間 [x,x+d]、[y,y+d]、[z,z+d] 的笛卡兒積。所有立方體的共同交集仍是軸平行長方體；每軸的左端取所有左端最大值，右端取所有右端最小值。",
      "每一軸的交集長度為 max(0,right−left)，三軸相乘就是體積。某一軸不相交或僅接觸時答案為 0；即使已經空交集，仍需讀完剩餘立方體。以第一個立方體初始化邊界，可支援負座標而不用任意哨兵。讀到 n=0 停止。",
    ],
    complexity: "每組時間 O(n)，額外空間 O(1)。",
    pitfall: "輸入是角點加邊長，不是兩個相對角點；面或邊接觸的體積為零。",
    traceLabel: "示意：兩立方體 (0,0,0,3)、(2,1,1,2)",
    trace: [
      {
        title: "第一個範圍",
        description: "三軸都是 [0,3]，體積 27。",
        cells: ["x:[0,3]", "y:[0,3]", "z:[0,3]"],
        active: [0, 1, 2],
        variables: [["體積", "27"]],
      },
      {
        title: "取交集",
        description: "第二個範圍為 [2,4]、[1,3]、[1,3]。",
        cells: ["x:[2,3]", "y:[1,3]", "z:[1,3]"],
        active: [0, 1, 2],
        variables: [["邊長", "1,2,2"]],
      },
      {
        title: "乘長度",
        description: "共同交集體積為 1×2×2=4。",
        cells: ["1", "2", "2"],
        active: [0, 1, 2],
        variables: [["答案", "4"]],
      },
    ],
    cpp: String.raw`#include <algorithm>
#include <iostream>
using namespace std;
int main() {
    int n;
    while (cin >> n && n) {
        long long lo[3], hi[3];
        for (int i = 0; i < n; ++i) {
            long long p[3], d;
            cin >> p[0] >> p[1] >> p[2] >> d;
            for (int j = 0; j < 3; ++j) {
                if (!i) {
                    lo[j] = p[j];
                    hi[j] = p[j] + d;
                } else {
                    lo[j] = max(lo[j], p[j]);
                    hi[j] = min(hi[j], p[j] + d);
                }
            }
        }
        long long volume = 1;
        for (int j = 0; j < 3; ++j)
            volume *= max(0LL, hi[j] - lo[j]);
        cout << volume << '\n';
    }
}`,
    python: String.raw`import sys

it = iter(map(int, sys.stdin.buffer.read().split()))
for n in it:
    if n == 0:
        break
    lo, hi = None, None
    for _ in range(n):
        p = [next(it) for _ in range(3)]
        d = next(it)
        if lo is None:
            lo, hi = p[:], [v + d for v in p]
        else:
            lo = [max(lo[j], p[j]) for j in range(3)]
            hi = [min(hi[j], p[j] + d) for j in range(3)]
    volume = 1
    for j in range(3):
        volume *= max(0, hi[j] - lo[j])
    print(volume)
`,
  }),
  defineCpeLesson("a601", {
    topic: "strings",
    level: "easy",
    concept: "相鄰單字的最長後綴前綴重疊",
    goal: "沿用螢幕上的字母，減少每次捲入的長度。",
    explanation: [
      "第一個單字需要輸入 k 個字母。從前一個單字 A 切換到下一個 B，若 A 的長度 j 後綴等於 B 的長度 j 前綴，只要再輸入 B 的剩餘 k−j 個字母即可；取最大的 j 就最省。",
      "顯示完整 B 時，螢幕狀態必定恰為 B，所以採用最長重疊不會影響往後的選擇，每對相鄰單字可獨立求最小成本。重複單字允許 j=k，新增成本為 0。k≤100，從 k 遞減檢查即可；讀取首行測試筆數，每組只印總輸入字母數。",
    ],
    complexity: "時間 O(wk²)，空間 O(k)。",
    pitfall: "要比較前字尾端與後字開頭；相同單字可完全重疊。",
    traceLabel: "示意：CAT → ATE → TEA",
    trace: [
      {
        title: "顯示 CAT",
        description: "初始空白，輸入三個字母。",
        cells: ["C", "A", "T"],
        active: [0, 1, 2],
        variables: [["成本", "3"]],
      },
      {
        title: "接上 ATE",
        description: "CAT 後綴 AT 等於 ATE 前綴 AT，只輸入 E。",
        cells: ["A", "T", "E"],
        active: [2],
        variables: [
          ["重疊", "2"],
          ["累計", "4"],
        ],
      },
      {
        title: "接上 TEA",
        description: "重疊 TE，再輸入 A，累計 5。",
        cells: ["T", "E", "A"],
        active: [2],
        variables: [
          ["重疊", "2"],
          ["答案", "5"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <string>
using namespace std;
int main() {
    int t;
    cin >> t;
    while (t--) {
        int k, w;
        cin >> k >> w;
        string previous;
        cin >> previous;
        int answer = k;
        for (int i = 1; i < w; ++i) {
            string word;
            cin >> word;
            int overlap = k;
            while (previous.substr(k - overlap) != word.substr(0, overlap))
                --overlap;
            answer += k - overlap;
            previous = word;
        }
        cout << answer << '\n';
    }
}`,
    python: String.raw`import sys

it = iter(sys.stdin.buffer.read().split())
for _ in range(int(next(it))):
    k, w = int(next(it)), int(next(it))
    previous = next(it)
    answer = k
    for _ in range(w - 1):
        word = next(it)
        overlap = k
        while previous[k - overlap :] != word[:overlap]:
            overlap -= 1
        answer += k - overlap
        previous = word
    print(answer)
`,
  }),
  defineCpeLesson("a602", {
    topic: "graphs",
    level: "medium",
    concept: "骰子與點數的雙層連通塊",
    goal: "分別以非背景區與 X 區辨認骰子及其點數。",
    explanation: [
      "一顆骰子是所有非點號像素的四方向連通塊，先用迭代 DFS 取得其所有格子。此時不能把 X 當成障礙，因為骰子的表面可能透過點像素相連。將整顆骰子格子收集後，再在其中找尚未消去的 X。",
      "每遇到一個 X 就把點數加一，再以另一個洪水填充把同一 X 連通塊改成 *，因此一大片 X 只會計為一點。全圖骰子都完成後將點數排序。每張輸出 Throw k、下一行點數，最後留一個空白行；0 0 結束，不印額外案例。",
    ],
    complexity: "每張時間 O(wh+d log d)，空間 O(wh)，d 為骰子數。",
    pitfall: "只能四方向連接；先辨認骰子，再消除點，避免把骰子切碎。",
    traceLabel: "示意：骰子圖案 XX* / *** / *X*",
    trace: [
      {
        title: "找骰子",
        description: "9 個非背景格四方向相連，是同一顆骰子。",
        cells: ["XX*", "***", "*X*"],
        active: [0, 1, 2],
        variables: [
          ["骰子格數", "9"],
          ["點數", "0"],
        ],
      },
      {
        title: "第一個點",
        description: "頂列兩個 X 彼此相連，只算 1 點並改成 *。",
        cells: ["***", "***", "*X*"],
        active: [0],
        variables: [["點數", "1"]],
      },
      {
        title: "第二個點",
        description: "底列的 X 是另一個連通塊，這顆骰子共 2 點。",
        cells: ["***", "***", "***"],
        active: [2],
        variables: [["點數", "2"]],
      },
    ],
    cpp: String.raw`#include <algorithm>
#include <iostream>
#include <string>
#include <vector>
using namespace std;
int main() {
    int w, h, cs = 0;
    int dr[] = {1, -1, 0, 0}, dc[] = {0, 0, 1, -1};
    while (cin >> w >> h && (w || h)) {
        vector<string> g(h);
        for (auto &s : g)
            cin >> s;
        vector<vector<bool>> seen(h, vector<bool>(w));
        vector<int> answer;
        for (int r = 0; r < h; ++r)
            for (int c = 0; c < w; ++c)
                if (g[r][c] != '.' && !seen[r][c]) {
                    vector<pair<int, int>> cells, stack = {{r, c}};
                    seen[r][c] = true;
                    while (!stack.empty()) {
                        auto [x, y] = stack.back();
                        stack.pop_back();
                        cells.push_back({x, y});
                        for (int k = 0; k < 4; ++k) {
                            int a = x + dr[k], b = y + dc[k];
                            if (a >= 0 && a < h && b >= 0 && b < w && !seen[a][b] &&
                                g[a][b] != '.') {
                                seen[a][b] = true;
                                stack.push_back({a, b});
                            }
                        }
                    }
                    int pips = 0;
                    for (auto [x, y] : cells)
                        if (g[x][y] == 'X') {
                            ++pips;
                            stack = {{x, y}};
                            g[x][y] = '*';
                            while (!stack.empty()) {
                                auto [a, b] = stack.back();
                                stack.pop_back();
                                for (int k = 0; k < 4; ++k) {
                                    int u = a + dr[k], v = b + dc[k];
                                    if (u >= 0 && u < h && v >= 0 && v < w && g[u][v] == 'X') {
                                        g[u][v] = '*';
                                        stack.push_back({u, v});
                                    }
                                }
                            }
                        }
                    answer.push_back(pips);
                }
        sort(answer.begin(), answer.end());
        cout << "Throw " << ++cs << '\n';
        for (int i = 0; i < (int)answer.size(); ++i) {
            if (i)
                cout << ' ';
            cout << answer[i];
        }
        cout << "\n\n";
    }
}`,
    python: String.raw`import sys

it = iter(sys.stdin.buffer.read().split())
cs = 0
for token in it:
    w, h = int(token), int(next(it))
    if w == h == 0:
        break
    g = [bytearray(next(it)) for _ in range(h)]
    seen = set()
    answers = []

    def neighbors(r, c):
        for a, b in ((r - 1, c), (r + 1, c), (r, c - 1), (r, c + 1)):
            if 0 <= a < h and 0 <= b < w:
                yield a, b

    for r in range(h):
        for c in range(w):
            if g[r][c] == 46 or (r, c) in seen:
                continue
            stack, cells = [(r, c)], []
            seen.add((r, c))
            while stack:
                x, y = stack.pop()
                cells.append((x, y))
                for a, b in neighbors(x, y):
                    if g[a][b] != 46 and (a, b) not in seen:
                        seen.add((a, b))
                        stack.append((a, b))
            pips = 0
            for x, y in cells:
                if g[x][y] != 88:
                    continue
                pips += 1
                stack = [(x, y)]
                g[x][y] = 42
                while stack:
                    a, b = stack.pop()
                    for u, v in neighbors(a, b):
                        if g[u][v] == 88:
                            g[u][v] = 42
                            stack.append((u, v))
            answers.append(pips)
    cs += 1
    print(f"Throw {cs}")
    print(*sorted(answers))
    print()
`,
  }),
  defineCpeLesson("a603", {
    topic: "graphs",
    level: "easy",
    concept: "多起點有向可達性",
    goal: "一次走訪所有手推起點可到達的骨牌，避免重複計數。",
    explanation: [
      "把 x 推倒 y 建成有向邊 x→y，所有手動推倒的骨牌都是搜尋起點。使用同一份 visited，對每個尚未拜訪的起點開始 DFS，沿著出邊擴展，即可取得所有最終會倒下的骨牌。",
      "入堆疊時便標記，可避免多條邊同時將同一點推入而重複計數。每個節點至多展開一次，每條邊至多看一次；迭代堆疊也避免長鏈超過 Python 遞迴限制。讀 T 筆，每組只印已拜訪節點數，不能替每個起點分開相加。",
    ],
    complexity: "時間 O(n+m+l)，空間 O(n+m)。",
    pitfall: "影響是有方向的，不能自動補反向邊；重複手推不應重算。",
    traceLabel: "示意：1→2→3，手推 2 與 3",
    trace: [
      {
        title: "手推 2",
        description: "先記錄骨牌 2 已倒。",
        cells: ["1 未倒", "2 倒", "3 未倒"],
        active: [1],
        variables: [["計數", "1"]],
      },
      {
        title: "沿邊擴展",
        description: "2 推倒 3，因此已倒集合變成 {2,3}。",
        cells: ["1 未倒", "2 倒", "3 倒"],
        active: [2],
        variables: [["計數", "2"]],
      },
      {
        title: "處理另一個起點",
        description: "3 早已拜訪，略過；1 不會被反向推倒。",
        cells: ["1 未倒", "2 倒", "3 倒"],
        active: [2],
        variables: [["最終答案", "2"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
using namespace std;
int main() {
    int t;
    cin >> t;
    while (t--) {
        int n, m, l;
        cin >> n >> m >> l;
        vector<vector<int>> g(n + 1);
        while (m--) {
            int x, y;
            cin >> x >> y;
            g[x].push_back(y);
        }
        vector<bool> seen(n + 1);
        int ans = 0;
        while (l--) {
            int z;
            cin >> z;
            if (seen[z])
                continue;
            vector<int> stack = {z};
            seen[z] = true;
            while (!stack.empty()) {
                int u = stack.back();
                stack.pop_back();
                ++ans;
                for (int v : g[u])
                    if (!seen[v]) {
                        seen[v] = true;
                        stack.push_back(v);
                    }
            }
        }
        cout << ans << '\n';
    }
}`,
    python: String.raw`import sys

it = iter(map(int, sys.stdin.buffer.read().split()))
for _ in range(next(it)):
    n, m, l = next(it), next(it), next(it)
    graph = [[] for _ in range(n + 1)]
    for _ in range(m):
        graph[next(it)].append(next(it))
    seen = bytearray(n + 1)
    answer = 0
    for _ in range(l):
        z = next(it)
        if seen[z]:
            continue
        stack = [z]
        seen[z] = 1
        while stack:
            u = stack.pop()
            answer += 1
            for v in graph[u]:
                if not seen[v]:
                    seen[v] = 1
                    stack.append(v)
    print(answer)
`,
  }),
];
