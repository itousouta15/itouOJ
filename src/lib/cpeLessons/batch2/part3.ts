import { defineCpeLesson } from "@/lib/cpeLessonBuilder";

export const lessons = [
  defineCpeLesson("a556", {
    topic: "dp",
    level: "medium",
    concept: "運算式區間的最大與最小值",
    goal: "枚舉最外層運算符號，涵蓋所有加括號方式。",
    explanation: [
      "先把運算式切成數字陣列與運算符號陣列，多位數必須整段解析。對每個數字區間 [l,r] 保存 mn、mx；單一數字的兩值就是它本身。任意括號結構最後都會在某個運算符號 k 合併左右兩段，因此枚舉 k 就涵蓋所有結構。",
      "所有數字皆為正，+ 與 * 對兩個參數都單調，所以該切點的最小值由兩側最小值結合，最大值由兩側最大值結合。區間由短到長填寫，最後取整段兩值。最多12個數字，三次方 DP 足夠；C++用64位元，完整保留 The maximum and minimum are X and Y. 的句型。",
    ],
    complexity: "每筆時間 O(p³+L)，空間 O(p²)，p為數字個數。",
    pitfall:
      "不可依程式語言內建優先序只計算一次；題目允許加入不同括號，多位數不能拆開。",
    traceLabel: "示意：運算式 1+2*3",
    trace: [
      {
        title: "單點區間",
        description: "三個數字的最小最大分別為自身。",
        cells: ["1..1:1", "2..2:2", "3..3:3"],
        active: [0, 1, 2],
        variables: [["長度", "1"]],
      },
      {
        title: "兩數區間",
        description: "1+2=3，2*3=6。",
        cells: ["[1,2]:3", "[2,3]:6"],
        active: [0, 1],
        variables: [["長度", "2"]],
      },
      {
        title: "整段合併",
        description: "以+切得1+6=7，以*切得3*3=9。",
        cells: ["1+(2*3)=7", "(1+2)*3=9"],
        active: [0, 1],
        variables: [
          ["最大", "9"],
          ["最小", "7"],
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
        string s;
        cin >> s;
        vector<long long> a;
        vector<char> op;
        long long value = 0;
        for (char c : s) {
            if (isdigit(static_cast<unsigned char>(c)))
                value = value * 10 + c - '0';
            else {
                a.push_back(value);
                value = 0;
                op.push_back(c);
            }
        }
        a.push_back(value);
        int n = a.size();
        vector<vector<long long>> mn(n, vector<long long>(n)), mx = mn;
        for (int i = 0; i < n; ++i)
            mn[i][i] = mx[i][i] = a[i];
        for (int len = 2; len <= n; ++len)
            for (int l = 0; l + len <= n; ++l) {
                int r = l + len - 1;
                mn[l][r] = numeric_limits<long long>::max();
                for (int k = l; k < r; ++k) {
                    long long low =
                        op[k] == '+' ? mn[l][k] + mn[k + 1][r] : mn[l][k] * mn[k + 1][r];
                    long long high =
                        op[k] == '+' ? mx[l][k] + mx[k + 1][r] : mx[l][k] * mx[k + 1][r];
                    mn[l][r] = min(mn[l][r], low);
                    mx[l][r] = max(mx[l][r], high);
                }
            }
        cout << "The maximum and minimum are " << mx[0][n - 1] << " and " << mn[0][n - 1] << ".\n";
    }
}
`,
    python: String.raw`import sys
import re

it = iter(sys.stdin.read().split())
for _ in range(int(next(it))):
    expression = next(it)
    numbers = list(map(int, re.findall(r"\d+", expression)))
    operators = re.findall(r"[+*]", expression)
    n = len(numbers)
    low, high = [[0] * n for _ in range(n)], [[0] * n for _ in range(n)]
    for i, value in enumerate(numbers):
        low[i][i] = high[i][i] = value
    for length in range(2, n + 1):
        for left in range(n - length + 1):
            right = left + length - 1
            minimum, maximum = float("inf"), 0
            for split in range(left, right):
                if operators[split] == "+":
                    a = low[left][split] + low[split + 1][right]
                    b = high[left][split] + high[split + 1][right]
                else:
                    a = low[left][split] * low[split + 1][right]
                    b = high[left][split] * high[split + 1][right]
                minimum, maximum = min(minimum, a), max(maximum, b)
            low[left][right], high[left][right] = minimum, maximum
    print(f"The maximum and minimum are {high[0][-1]} and {low[0][-1]}.")
`,
  }),
  defineCpeLesson("a557", {
    topic: "math",
    level: "medium",
    concept: "凹二次函數的整數最佳點",
    goal: "平方比較項鍊長度，免除浮點平手誤差。",
    explanation: [
      "若做 n 個圓盤，總長 L=0.3n√(Vtotal/n−V0)，因此 L²/0.09=nVtotal−n²V0。對有效的正整數 n，最大化長度等價於最大化這個整數凹二次函數，不需要計算平方根。",
      "頂點在 Vtotal/(2V0)，整數最佳點只可能是它的下整數與上整數。逐一檢查 n≥1 且 nV0<Vtotal 的候選，以整數值比較；若兩個候選同分，或沒有候選可製作，就輸出0。當頂點恰為整數時候選去重，不能因重複檢查同一 n 誤判為平手。0 0 結束。",
    ],
    complexity: "每筆時間 O(1)，空間 O(1)。",
    pitfall: "最佳個數不唯一時輸出0；V=V0時直徑為0，不是可製作的圓盤。",
    traceLabel: "示意：Vtotal=10、V0=2",
    trace: [
      {
        title: "連續頂點",
        description: "10/(2×2)=2.5，候選為2與3。",
        cells: ["n=2", "n=3"],
        active: [0, 1],
        variables: [["頂點", "2.5"]],
      },
      {
        title: "比較平方量",
        description: "n=2得20−8=12；n=3得30−18=12。",
        cells: ["f(2)=12", "f(3)=12"],
        active: [0, 1],
        variables: [["最佳值", "12"]],
      },
      {
        title: "平手輸出",
        description: "兩個不同的有效個數都達最大長度，答案為0。",
        cells: ["2×2<10", "3×2<10"],
        active: [0, 1],
        variables: [
          ["最佳個數數量", "2"],
          ["答案", "0"],
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
    long long v, c;
    while (cin >> v >> c && (v || c)) {
        long long q = v / (2 * c), best = -1;
        int answer = 0, count = 0;
        for (long long n : {q, q + 1})
            if (n >= 1 && n * c < v) {
                long long value = n * v - n * n * c;
                if (value > best) {
                    best = value;
                    answer = int(n);
                    count = 1;
                } else if (value == best)
                    ++count;
            }
        cout << (count == 1 ? answer : 0) << '\n';
    }
}
`,
    python: String.raw`import sys

it = iter(map(int, sys.stdin.read().split()))
for volume in it:
    loss = next(it)
    if volume == loss == 0:
        break
    q = volume // (2 * loss)
    candidates = [
        (n * volume - n * n * loss, n) for n in (q, q + 1) if n >= 1 and n * loss < volume
    ]
    if not candidates:
        print(0)
        continue
    best = max(value for value, _ in candidates)
    winners = [n for value, n in candidates if value == best]
    print(winners[0] if len(winners) == 1 else 0)
`,
  }),
  defineCpeLesson("a558", {
    topic: "dp",
    level: "easy",
    concept: "零一子集合和",
    goal: "倒序更新可達長度，讓每根棒最多使用一次。",
    explanation: [
      "定義 reachable[s] 表示目前已讀棒子能否組成總長 s。初始只有 reachable[0]=真，對應一根棒都不選。讀到長度 x 後，所有原本能做到 s−x 的狀態都能增加 x 到達 s。",
      "用一維陣列時，s 必須從目標 n 向下更新到 x，讓 s−x 仍然只用過前面的棒子。如果正向更新，剛新增的可達狀態會再次被使用，相當於同一根棒可用多次。超過目標的長度不需保存；n=0永遠可行，仍須把本筆 p 根棒全部讀完。",
    ],
    complexity: "每筆時間 O(pn)，空間 O(n)。",
    pitfall: "這是每根限用一次的零一問題；目標0可選空集合，不能誤判成NO。",
    traceLabel: "示意：目標7，棒長2、3、4",
    trace: [
      {
        title: "只用2",
        description: "由0新增2。",
        cells: ["可達0", "可達2"],
        active: [0, 1],
        variables: [["棒數", "1"]],
      },
      {
        title: "加入3",
        description: "由0得到3，由2得到5。",
        cells: ["0", "2", "3", "5"],
        active: [0, 1, 2, 3],
        variables: [
          ["棒數", "2"],
          ["可達7", "0"],
        ],
      },
      {
        title: "加入4",
        description: "原本3可接4到7，因此YES。",
        cells: ["0", "2", "3", "4", "5", "6", "7"],
        active: [0, 1, 2, 3, 4, 5, 6],
        variables: [
          ["棒數", "3"],
          ["可達7", "1"],
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
        int n, p;
        cin >> n >> p;
        vector<bool> ok(n + 1);
        ok[0] = true;
        while (p--) {
            int x;
            cin >> x;
            for (int s = n; s >= x; --s)
                if (ok[s - x])
                    ok[s] = true;
        }
        cout << (ok[n] ? "YES" : "NO") << '\n';
    }
}
`,
    python: String.raw`import sys

it = iter(map(int, sys.stdin.read().split()))
for _ in range(next(it)):
    target, p = next(it), next(it)
    reachable = [False] * (target + 1)
    reachable[0] = True
    for _ in range(p):
        x = next(it)
        for total in range(target, x - 1, -1):
            reachable[total] |= reachable[total - x]
    print("YES" if reachable[target] else "NO")
`,
  }),
  defineCpeLesson("a559", {
    topic: "search",
    level: "medium",
    concept: "覆蓋1到K的滑動視窗",
    goal: "用缺少種類數判斷合法，左右端點各掃描一次。",
    explanation: [
      "先依定義產生序列，前三項固定是1、2、3，其後才套用三項和模M加1。維持一個視窗與1..K的出現次數；右端加入某個所需值時，若原本次數為0，就讓已涵蓋種類增加1。範圍外的值不影響種類數。",
      "視窗一旦含齊 K 種，就記錄長度並持續移動左端，直到移走某值最後一次出現而失效。對每個右端，這樣找出的就是最短合法尾段。左右指標都只向前走，所以不是二次方。找不到時輸出 Case k: sequence nai，否則輸出長度；不要因K>M就直接判無解，固定前三項仍可能提供2與3。",
    ],
    complexity: "每筆時間 O(N+K)，空間 O(N+K)。",
    pitfall: "縮窗要先記錄合法長度，再移除左端；頻率降至0才失去一種必要值。",
    traceLabel: "示意：N=6、M=5、K=3，序列1、2、3、2、4、5",
    trace: [
      {
        title: "加入1、2",
        description: "尚缺3，不能記錄答案。",
        cells: ["1", "2"],
        active: [0, 1],
        variables: [
          ["涵蓋種類", "2"],
          ["左端", "0"],
        ],
      },
      {
        title: "加入3",
        description: "視窗[1,2,3]長3，含齊全部必要值。",
        cells: ["1", "2", "3"],
        active: [0, 1, 2],
        variables: [
          ["涵蓋種類", "3"],
          ["最佳", "3"],
        ],
      },
      {
        title: "縮小與後續",
        description: "移去1後失效；後面再無1，最佳保持3。",
        cells: ["2", "3", "2", "4", "5"],
        active: [0, 1, 2, 3, 4],
        variables: [
          ["涵蓋種類", "2"],
          ["答案", "3"],
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
    for (int tc = 1; tc <= t; ++tc) {
        int n, m, k;
        cin >> n >> m >> k;
        vector<int> a(n);
        a[0] = 1;
        a[1] = 2;
        a[2] = 3;
        for (int i = 3; i < n; ++i)
            a[i] = (a[i - 1] + a[i - 2] + a[i - 3]) % m + 1;
        vector<int> freq(k + 1);
        int covered = 0, left = 0, best = n + 1;
        for (int right = 0; right < n; ++right) {
            int v = a[right];
            if (v <= k && freq[v]++ == 0)
                ++covered;
            while (covered == k) {
                best = min(best, right - left + 1);
                int x = a[left++];
                if (x <= k && --freq[x] == 0)
                    --covered;
            }
        }
        cout << "Case " << tc << ": ";
        if (best == n + 1)
            cout << "sequence nai\n";
        else
            cout << best << '\n';
    }
}
`,
    python: String.raw`import sys

it = iter(map(int, sys.stdin.read().split()))
for case in range(1, next(it) + 1):
    n, modulus, k = next(it), next(it), next(it)
    values = [1, 2, 3]
    for i in range(3, n):
        values.append((values[i - 1] + values[i - 2] + values[i - 3]) % modulus + 1)
    frequency = [0] * (k + 1)
    covered = left = 0
    best = n + 1
    for right, value in enumerate(values):
        if value <= k:
            if frequency[value] == 0:
                covered += 1
            frequency[value] += 1
        while covered == k:
            best = min(best, right - left + 1)
            old = values[left]
            left += 1
            if old <= k:
                frequency[old] -= 1
                if frequency[old] == 0:
                    covered -= 1
    result = "sequence nai" if best == n + 1 else str(best)
    print(f"Case {case}: {result}")
`,
  }),
  defineCpeLesson("a560", {
    topic: "trees",
    level: "medium",
    concept: "子樹盈餘的後序流量",
    goal: "每條樹邊必須運送子樹淨盈餘的絕對值。",
    explanation: [
      "定義 balance[u] 為 u 子樹原有彈珠數減子樹頂點數。它等於 u 自己的 marbles−1 加上所有孩子的 balance。因樹上子樹與外界只有一條父邊，balance>0 時必須向外運出這麼多顆，balance<0 時必須由外界補入。",
      "因此父子邊的最低成本恰好是 |balance[child]|，各邊相加即可，並能以由葉往根調整的方式達成。輸入行可能不按編號，先建孩子列表與父親，找真正根；用顯式堆疊得到前序後反轉成後序，避免一萬層鏈讓Python遞迴溢位。n=0結束。",
    ],
    complexity: "時間 O(n)，空間 O(n)。",
    pitfall:
      "根不保證是1；總彈珠數等於n只表示根盈餘0，不表示其他子樹都不需搬運。",
    traceLabel: "示意：根1有0顆，孩子2有3顆、3有0顆",
    trace: [
      {
        title: "處理孩子2",
        description: "子樹只一點，盈餘3−1=2，需沿2→1搬2顆。",
        cells: ["balance2=2"],
        active: [0],
        variables: [["成本", "2"]],
      },
      {
        title: "處理孩子3",
        description: "子樹缺一顆，沿1→3搬1顆。",
        cells: ["balance2=2", "balance3=−1"],
        active: [0, 1],
        variables: [["成本", "3"]],
      },
      {
        title: "處理根",
        description: "根自身−1，加孩子盈餘2與−1，最後為0。",
        cells: ["balance1=0", "balance2=2", "balance3=−1"],
        active: [0, 1, 2],
        variables: [
          ["總顆數", "3"],
          ["答案", "3"],
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
        vector<vector<int>> children(n);
        vector<int> parent(n, -1);
        vector<long long> balance(n);
        for (int z = 0; z < n; ++z) {
            int v, balls, d;
            cin >> v >> balls >> d;
            --v;
            balance[v] = balls - 1;
            while (d--) {
                int u;
                cin >> u;
                --u;
                children[v].push_back(u);
                parent[u] = v;
            }
        }
        int root = find(parent.begin(), parent.end(), -1) - parent.begin();
        vector<int> order{root};
        for (size_t i = 0; i < order.size(); ++i)
            for (int u : children[order[i]])
                order.push_back(u);
        long long ans = 0;
        for (auto it = order.rbegin(); it != order.rend(); ++it) {
            int u = *it;
            if (parent[u] != -1) {
                ans += abs(balance[u]);
                balance[parent[u]] += balance[u];
            }
        }
        cout << ans << '\n';
    }
}
`,
    python: String.raw`import sys

it = iter(map(int, sys.stdin.buffer.read().split()))
for n in it:
    if n == 0:
        break
    children = [[] for _ in range(n)]
    parent, balance = [-1] * n, [0] * n
    for _ in range(n):
        v, balls, degree = next(it) - 1, next(it), next(it)
        balance[v] = balls - 1
        for _ in range(degree):
            u = next(it) - 1
            children[v].append(u)
            parent[u] = v
    root = parent.index(-1)
    order = [root]
    for u in order:
        order.extend(children[u])
    answer = 0
    for u in reversed(order):
        if parent[u] != -1:
            answer += abs(balance[u])
            balance[parent[u]] += balance[u]
    print(answer)
`,
  }),
  defineCpeLesson("a561", {
    topic: "graphs",
    level: "hard",
    concept: "倒水狀態圖的 Dijkstra",
    goal: "以實際倒水量當邊權，先選水量再選最小成本。",
    explanation: [
      "總水量固定為 c，所以狀態只需記錄前兩壺水量 (x,y)，第三壺就是 c−x−y。選來源 i 與目的 j 時，一次只能倒 delta=min(水量i,容量j−水量j)，這恰好對應一條邊，邊權為實際倒出的 delta，不是操作次數。",
      "以 (0,0) 和成本0執行 Dijkstra。每次取出已確定最短成本的狀態，將其中每個壺的水量 v 更新 best[v]；再產生六種有向倒水操作。最後從 d 向下找第一個有有限成本的水量，才符合先最大化不超過d、再最小化倒水量的題意。初始狀態也可直接達成目標或備選0。",
    ],
    complexity: "時間 O(ab log(ab))，空間 O(ab+c)。",
    pitfall:
      "BFS只最少化倒水次數，無法保證總倒水量最少；無法得到d時不是選距離d最近且可超過d的水量。",
    traceLabel: "示意：容量2、3、4，目標2",
    trace: [
      {
        title: "初始",
        description: "三壺水量(0,0,4)，累計成本0。",
        cells: ["A:0/2", "B:0/3", "C:4/4"],
        active: [0, 1, 2],
        variables: [
          ["成本", "0"],
          ["可達水量", "0,4"],
        ],
      },
      {
        title: "倒 C→A",
        description: "delta=min(4,2)=2，得到(2,0,2)。",
        cells: ["A:2/2", "B:0/3", "C:2/4"],
        active: [0, 1, 2],
        variables: [
          ["本次倒量", "2"],
          ["成本", "2"],
        ],
      },
      {
        title: "目標達成",
        description: "至少一壺有2，該狀態的Dijkstra成本為2。",
        cells: ["best[2]=2"],
        active: [0],
        variables: [
          ["輸出成本", "2"],
          ["實際水量", "2"],
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
        array<int, 3> cap;
        int target;
        cin >> cap[0] >> cap[1] >> cap[2] >> target;
        const int INF = 1000000000;
        vector<vector<int>> dist(cap[0] + 1, vector<int>(cap[1] + 1, INF));
        vector<int> best(cap[2] + 1, INF);
        using S = tuple<int, int, int>;
        priority_queue<S, vector<S>, greater<S>> pq;
        dist[0][0] = 0;
        pq.emplace(0, 0, 0);
        while (!pq.empty()) {
            auto [cost, x, y] = pq.top();
            pq.pop();
            if (cost != dist[x][y])
                continue;
            array<int, 3> v{x, y, cap[2] - x - y};
            for (int z : v)
                best[z] = min(best[z], cost);
            for (int i = 0; i < 3; ++i)
                for (int j = 0; j < 3; ++j)
                    if (i != j) {
                        int delta = min(v[i], cap[j] - v[j]);
                        if (!delta)
                            continue;
                        auto next = v;
                        next[i] -= delta;
                        next[j] += delta;
                        int a = next[0], b = next[1], nc = cost + delta;
                        if (nc < dist[a][b]) {
                            dist[a][b] = nc;
                            pq.emplace(nc, a, b);
                        }
                    }
        }
        int volume = min(target, cap[2]);
        while (best[volume] == INF)
            --volume;
        cout << best[volume] << ' ' << volume << '\n';
    }
}
`,
    python: String.raw`import sys
import heapq

it = iter(map(int, sys.stdin.read().split()))
for _ in range(next(it)):
    capacity = [next(it), next(it), next(it)]
    target = next(it)
    infinity = 10**18
    distance = {(0, 0): 0}
    best = [infinity] * (capacity[2] + 1)
    heap = [(0, 0, 0)]
    while heap:
        cost, x, y = heapq.heappop(heap)
        if cost != distance[(x, y)]:
            continue
        water = [x, y, capacity[2] - x - y]
        for volume in water:
            best[volume] = min(best[volume], cost)
        for source in range(3):
            for destination in range(3):
                if source == destination:
                    continue
                delta = min(water[source], capacity[destination] - water[destination])
                if delta == 0:
                    continue
                after = water[:]
                after[source] -= delta
                after[destination] += delta
                state = (after[0], after[1])
                new_cost = cost + delta
                if new_cost < distance.get(state, infinity):
                    distance[state] = new_cost
                    heapq.heappush(heap, (new_cost, *state))
    volume = min(target, capacity[2])
    while best[volume] == infinity:
        volume -= 1
    print(best[volume], volume)
`,
  }),
  defineCpeLesson("a562", {
    topic: "sorting",
    level: "medium",
    concept: "最早完成區間的線性貪心",
    goal: "一旦找到重複值就選取區間，保留共同端點。",
    explanation: [
      "由左往右掃描，seen 保存上次已選區間終點以後出現過的值。若目前值 x 不在 seen，就加入；若 x 已出現，就找到一段以目前位置結束的有趣區間，立即選取，計數加一。",
      "這是最早結束區間的貪心：任何尚未選擇的第一段都不會比目前找到的區間更早結束，以這段替換不會減少後續可選數量。選完要清空舊seen，再放入當前 x，因為下一段允許與本段共用終點；若全部清掉，會漏算 x,x,x 形成的兩段。",
    ],
    complexity: "期望時間 O(N)，空間 O(min(N,V))，V為值域。",
    pitfall: "區間需兩個不同位置，但相鄰相同值合法；前後兩段能共用一個端點。",
    traceLabel: "示意：1、2、1、3、1",
    trace: [
      {
        title: "掃到位置2",
        description: "seen含1與2，尚未重複。",
        cells: ["1", "2"],
        active: [0, 1],
        variables: [["已選", "0"]],
      },
      {
        title: "位置3重複1",
        description: "選[1,3]，清空後保留終點1。",
        cells: ["[1,3]", "seen={1}"],
        active: [0, 1],
        variables: [
          ["已選", "1"],
          ["新起點", "3"],
        ],
      },
      {
        title: "位置5再重複1",
        description: "掃過3再遇1，選[3,5]，與前段共用位置3。",
        cells: ["[1,3]", "[3,5]"],
        active: [0, 1],
        variables: [
          ["已選", "2"],
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
        int n;
        cin >> n;
        unordered_set<int> seen;
        int ans = 0;
        while (n--) {
            int x;
            cin >> x;
            if (seen.count(x)) {
                ++ans;
                seen.clear();
            }
            seen.insert(x);
        }
        cout << ans << '\n';
    }
}
`,
    python: String.raw`import sys

it = iter(map(int, sys.stdin.buffer.read().split()))
for _ in range(next(it)):
    n = next(it)
    seen = set()
    answer = 0
    for _ in range(n):
        value = next(it)
        if value in seen:
            answer += 1
            seen.clear()
        seen.add(value)
    print(answer)
`,
  }),
  defineCpeLesson("a563", {
    topic: "geometry",
    level: "medium",
    concept: "圓覆蓋轉區間與最遠延伸貪心",
    goal: "先求能覆蓋草地全寬的水平範圍，再最少區間覆蓋。",
    explanation: [
      "草地上下邊離中心線 w/2。半徑 r 的灑水器只有在 r>w/2 時能覆蓋正長度的全寬區間；由畢氏定理，水平半長為 √(r²−(w/2)²)，有效區間是 [x−半長,x+半長]。r≤w/2 的裝置無法推進覆蓋，可略過。",
      "把區間按左端排序，維持已完整覆蓋到 reach 的位置。每輪將左端≤reach的全部區間納入，選右端最遠者，這個選擇不會比任何其他候選少留下可用覆蓋。若無法延伸就有缺口，輸出−1；直到reach≥l。小容差只處理浮點相接誤差，不能改變幾何半徑公式。多筆讀至EOF。",
    ],
    complexity: "時間 O(n log n)，空間 O(n)。",
    pitfall:
      "不能把有效範圍寫成[x−r,x+r]，那只覆蓋中心線；等於半寬的半徑無法覆蓋任何正長度。",
    traceLabel: "示意：長4、寬6，灑水器(0,5)、(4,5)",
    trace: [
      {
        title: "換算半長",
        description: "半寬3，√(25−9)=4。",
        cells: ["左器[-4,4]", "右器[0,8]"],
        active: [0, 1],
        variables: [["半長", "4"]],
      },
      {
        title: "選候選",
        description: "reach=0，兩區間左端都≤0，選可到8者。",
        cells: ["[-4,4]", "選[0,8]"],
        active: [0, 1],
        variables: [
          ["reach", "8"],
          ["已選", "1"],
        ],
      },
      {
        title: "完成",
        description: "8≥草地終點4，只需開右側一個。",
        cells: ["覆蓋[0,4]"],
        active: [0],
        variables: [["答案", "1"]],
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
    double length, width;
    while (cin >> n >> length >> width) {
        vector<pair<double, double>> a;
        for (int i = 0; i < n; ++i) {
            double x, r;
            cin >> x >> r;
            if (2 * r <= width)
                continue;
            double delta = sqrt(r * r - width * width / 4);
            a.emplace_back(x - delta, x + delta);
        }
        sort(a.begin(), a.end());
        double reach = 0;
        size_t i = 0;
        int count = 0;
        while (reach + 1e-9 < length) {
            double far = reach;
            while (i < a.size() && a[i].first <= reach + 1e-9) {
                far = max(far, a[i].second);
                ++i;
            }
            if (far <= reach + 1e-12) {
                count = -1;
                break;
            }
            reach = far;
            ++count;
        }
        cout << count << '\n';
    }
}
`,
    python: String.raw`import sys
from math import sqrt

it = iter(map(int, sys.stdin.read().split()))
for n in it:
    length, width = next(it), next(it)
    intervals = []
    for _ in range(n):
        x, radius = next(it), next(it)
        if 2 * radius <= width:
            continue
        half = sqrt(radius * radius - width * width / 4)
        intervals.append((x - half, x + half))
    intervals.sort()
    reach, i, answer = 0.0, 0, 0
    while reach + 1e-9 < length:
        farthest = reach
        while i < len(intervals) and intervals[i][0] <= reach + 1e-9:
            farthest = max(farthest, intervals[i][1])
            i += 1
        if farthest <= reach + 1e-12:
            answer = -1
            break
        reach = farthest
        answer += 1
    print(answer)
`,
  }),
  defineCpeLesson("a564", {
    topic: "math",
    level: "easy",
    concept: "對角線編號與三角形數",
    goal: "把二維路徑位置轉成單調的一維索引。",
    explanation: [
      "所有 x+y=s 的格點都在同一條對角線，該線共有s+1個點。在它之前的線共有1+2+…+s=s(s+1)/2個點，且本地敘述在同一線從x=0走到x=s，因此 (x,y) 的從零索引為 s(s+1)/2+x。",
      "沿固定方向每走一步索引恰增加1，所以答案直接是 index(終點)−index(起點)。不需要實際枚舉最多數百億個點，也不應把同線偏移寫成y；本題輸入保證能到終點。x、y各可十萬，三角形數需64位元，輸出 Case k: D。",
    ],
    complexity: "每筆時間 O(1)，空間 O(1)。",
    pitfall:
      "本地定義同線按x增加，不能套用反方向的三角編號；乘法前先使用64位元。",
    traceLabel: "示意：(0,1)走到(1,1)",
    trace: [
      {
        title: "起點索引",
        description: "s=1，index=1×2/2+0=1。",
        cells: ["(0,1):1"],
        active: [0],
        variables: [["起點索引", "1"]],
      },
      {
        title: "終點索引",
        description: "s=2，index=2×3/2+1=4。",
        cells: ["(1,1):4"],
        active: [0],
        variables: [["終點索引", "4"]],
      },
      {
        title: "沿路驗證",
        description: "依序(0,1)→(1,0)→(0,2)→(1,1)，共3步。",
        cells: ["1", "2", "3", "4"],
        active: [0, 1, 2, 3],
        variables: [["答案", "4−1=3"]],
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

long long indexOf(long long x, long long y) {
    long long s = x + y;
    return s * (s + 1) / 2 + x;
}
int main() {
    int t;
    cin >> t;
    for (int tc = 1; tc <= t; ++tc) {
        long long x, y, a, b;
        cin >> x >> y >> a >> b;
        cout << "Case " << tc << ": " << indexOf(a, b) - indexOf(x, y) << '\n';
    }
}
`,
    python: String.raw`import sys


def index_of(x, y):
    s = x + y
    return s * (s + 1) // 2 + x


it = iter(map(int, sys.stdin.read().split()))
for case in range(1, next(it) + 1):
    x, y, a, b = next(it), next(it), next(it), next(it)
    print(f"Case {case}: {index_of(a, b) - index_of(x, y)}")
`,
  }),
  defineCpeLesson("a565", {
    topic: "strings",
    level: "easy",
    concept: "固定查表與哨兵終止",
    goal: "把有限的問候語與語言映射集中管理。",
    explanation: [
      "六個已知字串各對應唯一語言，建立問候語到語言名稱的字典即可。對其他字串使用UNKNOWN，不需要用前綴、長度或字母相似程度推測，也不必轉換大小寫，輸入本來就是指定大寫。",
      "讀到#先結束，不增加案例編號。其餘每讀一個問候語才把編號加1，按照Case k: LANGUAGE輸出。字典查不到時回傳預設值，避免無意插入空值而輸出空白。若EOF先出現，也自然結束。",
    ],
    complexity: "每筆時間 O(L)，空間 O(1)，L為問候語長度。",
    pitfall: "HALLO對應GERMAN，HELLO才是ENGLISH；終止#沒有對應輸出。",
    traceLabel: "示意：HELLO、XYZ、HOLA、#",
    trace: [
      {
        title: "第一筆",
        description: "HELLO在表內，輸出ENGLISH。",
        cells: ["HELLO→ENGLISH"],
        active: [0],
        variables: [["Case", "1"]],
      },
      {
        title: "第二筆",
        description: "XYZ沒有對應，輸出UNKNOWN。",
        cells: ["XYZ→UNKNOWN"],
        active: [0],
        variables: [["Case", "2"]],
      },
      {
        title: "第三筆及終止",
        description: "HOLA對應SPANISH；之後#停止，總共3行。",
        cells: ["HOLA→SPANISH", "#→停止"],
        active: [0, 1],
        variables: [
          ["Case", "3"],
          ["輸出行數", "3"],
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
    map<string, string> lang{{"HELLO", "ENGLISH"}, {"HOLA", "SPANISH"},
                             {"HALLO", "GERMAN"},  {"BONJOUR", "FRENCH"},
                             {"CIAO", "ITALIAN"},  {"ZDRAVSTVUJTE", "RUSSIAN"}};
    string s;
    int tc = 0;
    while (cin >> s && s != "#") {
        auto it = lang.find(s);
        cout << "Case " << ++tc << ": " << (it == lang.end() ? "UNKNOWN" : it->second) << '\n';
    }
}
`,
    python: String.raw`import sys

language = {
    "HELLO": "ENGLISH",
    "HOLA": "SPANISH",
    "HALLO": "GERMAN",
    "BONJOUR": "FRENCH",
    "CIAO": "ITALIAN",
    "ZDRAVSTVUJTE": "RUSSIAN",
}
case = 0
for greeting in sys.stdin.read().split():
    if greeting == "#":
        break
    case += 1
    print(f"Case {case}: {language.get(greeting, 'UNKNOWN')}")
`,
  }),
  defineCpeLesson("a566", {
    topic: "trees",
    level: "medium",
    concept: "正權樹直徑的兩次走訪",
    goal: "由任一點找到直徑端點，再找最遠距離。",
    explanation: [
      "樹上任兩點只有一條路，因此從任意點出發，用堆疊累加道路長度就能取得到所有點的距離，無須一般圖的Dijkstra。第一趟取最遠點u；正權樹中，這種最遠點必為某條直徑的端點。",
      "第二趟從u出發，最遠距離就是直徑長度。直覺上若u不是端點，把任一最長路徑與起點到u的分岔路比較，就能延伸出不短於原直徑的路。輸入空白行是分組依據，不能把全部token合成一棵樹；EOF時也要處理最後一組，連續空白行不產生額外空圖。",
    ],
    complexity: "每組時間 O(V+E)，空間 O(V+E)。",
    pitfall: "道路有權重，不能以邊數當距離；最後一組不一定以空白行結束。",
    traceLabel: "示意：1—2長3，2—3長4，2—4長2",
    trace: [
      {
        title: "從1出發",
        description: "到1、2、3、4的距離為0、3、7、5。",
        cells: ["1:0", "2:3", "3:7", "4:5"],
        active: [0, 1, 2, 3],
        variables: [["最遠u", "3"]],
      },
      {
        title: "從3出發",
        description: "距離分別為7、4、0、6。",
        cells: ["1:7", "2:4", "3:0", "4:6"],
        active: [0, 1, 2, 3],
        variables: [["最遠點", "1"]],
      },
      {
        title: "直徑",
        description: "3→2→1長4+3=7。",
        cells: ["3", "2", "1"],
        active: [0, 1, 2],
        variables: [["答案", "7"]],
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

using Graph = map<int, vector<pair<int, long long>>>;
pair<long long, int> farthest(const Graph &g, int s) {
    pair<long long, int> best{0, s};
    vector<tuple<int, int, long long>> st{{s, -1, 0}};
    while (!st.empty()) {
        auto [u, p, d] = st.back();
        st.pop_back();
        best = max(best, make_pair(d, u));
        for (auto [v, w] : g.at(u))
            if (v != p)
                st.emplace_back(v, u, d + w);
    }
    return best;
}
int main() {
    Graph g;
    string line;
    auto finish = [&]() {
        if (g.empty())
            return;
        auto u = farthest(g, g.begin()->first).second;
        cout << farthest(g, u).first << '\n';
        g.clear();
    };
    while (getline(cin, line)) {
        istringstream in(line);
        int a, b;
        long long w;
        if (!(in >> a >> b >> w)) {
            finish();
            continue;
        }
        g[a].emplace_back(b, w);
        g[b].emplace_back(a, w);
    }
    finish();
}
`,
    python: String.raw`import sys
from collections import defaultdict


def farthest(graph, source):
    best = (0, source)
    stack = [(source, -1, 0)]
    while stack:
        u, parent, distance = stack.pop()
        best = max(best, (distance, u))
        for v, weight in graph[u]:
            if v != parent:
                stack.append((v, u, distance + weight))
    return best


def diameter(graph):
    if graph:
        _, endpoint = farthest(graph, next(iter(graph)))
        print(farthest(graph, endpoint)[0])


graph = defaultdict(list)
for line in sys.stdin.read().splitlines():
    if not line.strip():
        diameter(graph)
        graph = defaultdict(list)
    else:
        u, v, w = map(int, line.split())
        graph[u].append((v, w))
        graph[v].append((u, w))
diameter(graph)
`,
  }),
  defineCpeLesson("a567", {
    topic: "dp",
    level: "medium",
    concept: "按保留位置計數的回文子序列",
    goal: "以兩端是否相同建立不重複的區間計數。",
    explanation: [
      "令 dp[l][r] 為該區間的非空回文子序列位置選法。單字元有1種，空區間有0種。若兩端不同，回文不能同時保留兩端，所以把去左端與去右端的答案相加，再減去兩邊都去掉的重複區間。",
      "若兩端相同，除去至少一個端點的選法總共有 dp[l+1][r]+dp[l][r−1]−dp[l+1][r−1]；同時保留兩端又有 dp[l+1][r−1]+1 種，額外的1是只留兩端。合併後轉移簡化為 dp[l+1][r]+dp[l][r−1]+1。長度最多60，最多2⁶⁰−1種，64位元足夠。",
    ],
    complexity: "時間 O(n²)，空間 O(n²)。",
    pitfall: "不是計算不同回文字串；AAAA的15個非空位置子集合全部算不同。",
    traceLabel: "示意：字串 ABA",
    trace: [
      {
        title: "單字元",
        description: "三個位置各有1個回文選法。",
        cells: ["A₁:1", "B₂:1", "A₃:1"],
        active: [0, 1, 2],
        variables: [["長度", "1"]],
      },
      {
        title: "長度2",
        description: "AB與BA兩端不同，各有2種單字元選法。",
        cells: ["dp[0,1]=2", "dp[1,2]=2"],
        active: [0, 1],
        variables: [["長度", "2"]],
      },
      {
        title: "整段",
        description: "兩端A相同，2+2+1=5；包含A₁、B、A₃、AA、ABA。",
        cells: ["A₁", "B", "A₃", "AA", "ABA"],
        active: [0, 1, 2, 3, 4],
        variables: [["答案", "5"]],
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
        string s;
        cin >> s;
        int n = s.size();
        vector<vector<long long>> dp(n, vector<long long>(n));
        for (int l = n - 1; l >= 0; --l) {
            dp[l][l] = 1;
            for (int r = l + 1; r < n; ++r) {
                if (s[l] == s[r])
                    dp[l][r] = dp[l + 1][r] + dp[l][r - 1] + 1;
                else
                    dp[l][r] = dp[l + 1][r] + dp[l][r - 1] - (r - l > 1 ? dp[l + 1][r - 1] : 0);
            }
        }
        cout << dp[0][n - 1] << '\n';
    }
}
`,
    python: String.raw`import sys

it = iter(sys.stdin.read().split())
for _ in range(int(next(it))):
    s = next(it)
    n = len(s)
    dp = [[0] * n for _ in range(n)]
    for left in range(n - 1, -1, -1):
        dp[left][left] = 1
        for right in range(left + 1, n):
            if s[left] == s[right]:
                dp[left][right] = dp[left + 1][right] + dp[left][right - 1] + 1
            else:
                inner = dp[left + 1][right - 1] if right - left > 1 else 0
                dp[left][right] = dp[left + 1][right] + dp[left][right - 1] - inner
    print(dp[0][-1])
`,
  }),
  defineCpeLesson("a568", {
    topic: "number-theory",
    level: "medium",
    concept: "模3不變量與剩餘合法步數奇偶",
    goal: "第一步修正餘數後，後續只能刪除3的倍數數字。",
    explanation: [
      "一個數能被3整除等價於各位和為3的倍數。若起始位數和餘數為r，第一步必須刪掉一個同餘r的數字，否則無法把和改成0；沒有這種數字就由T獲勝。只剩一位時刪成空字串的和為0，也包含在這個規則裡。",
      "第一步之後位數和固定為0，往後每次只能刪除3、6、9，所以這些數字的個數決定剩餘步數。若r=0，合法總步數就是原本可被3整除的數字數，奇數時S勝；若r≠0，第一步消耗非零餘數數字，再加上全部零餘數數字，故其個數為偶數時S勝。輸出Case k:贏家。",
    ],
    complexity: "每筆時間 O(位數)，空間 O(1)。",
    pitfall: "不能只看整個數是否為3的倍數；起始不整除時仍可能藉第一步修正。",
    traceLabel: "示意：數字123",
    trace: [
      {
        title: "統計餘數",
        description: "位數和6，餘數0；可被3整除的數字只有3。",
        cells: ["1 mod3=1", "2 mod3=2", "3 mod3=0"],
        active: [0, 1, 2],
        variables: [
          ["和mod3", "0"],
          ["零餘數個數", "1"],
        ],
      },
      {
        title: "S的合法步",
        description: "刪掉3，剩12，位數和3仍可被3整除。",
        cells: ["12"],
        active: [0],
        variables: [["已走步數", "1"]],
      },
      {
        title: "T無步可走",
        description: "再刪1或2都不合法，T輸，所以S勝。",
        cells: ["刪1→2:非法", "刪2→1:非法"],
        active: [0, 1],
        variables: [["贏家", "S"]],
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
        int sum = 0;
        array<int, 3> count{};
        for (char c : s) {
            int d = c - '0';
            sum += d;
            ++count[d % 3];
        }
        int r = sum % 3;
        bool win;
        if (r == 0)
            win = count[0] % 2 == 1;
        else
            win = count[r] > 0 && count[0] % 2 == 0;
        cout << "Case " << tc << ": " << (win ? 'S' : 'T') << '\n';
    }
}
`,
    python: String.raw`import sys

it = iter(sys.stdin.read().split())
for case in range(1, int(next(it)) + 1):
    digits = [int(ch) for ch in next(it)]
    count = [0, 0, 0]
    for digit in digits:
        count[digit % 3] += 1
    remainder = sum(digits) % 3
    if remainder == 0:
        first_wins = count[0] % 2 == 1
    else:
        first_wins = count[remainder] > 0 and count[0] % 2 == 0
    print(f"Case {case}: {'S' if first_wins else 'T'}")
`,
  }),
  defineCpeLesson("a569", {
    topic: "math",
    level: "easy",
    concept: "以64分音符為整數單位",
    goal: "把分數加法改成整數累加，遇分隔符就結算。",
    explanation: [
      "所有音符時值分母都是64的因數，因此把一小節長度1換成64。W、H、Q、E、S、T、X分別對應64、32、16、8、4、2、1，完全不需要浮點數。",
      "掃描音符時把權重加到current；碰到/時，若current恰為64便把合法數加1，再把current歸零。開頭的/只會結算0，不影響答案；結尾的/會結算最後一節，不能漏掉。單獨*終止，每段只輸出一個整數。",
    ],
    complexity: "每筆時間 O(L)，空間 O(1)。",
    pitfall:
      "不要以音符數量判合法；H和Q各自的時值不同，浮點比較也可由整數化避免。",
    traceLabel: "示意：/HH/QQQ/W/",
    trace: [
      {
        title: "第一小節",
        description: "H+H=32+32=64，合法。",
        cells: ["HH:64"],
        active: [0],
        variables: [["合法數", "1"]],
      },
      {
        title: "第二小節",
        description: "Q+Q+Q=16×3=48，不合法。",
        cells: ["HH:64", "QQQ:48"],
        active: [0, 1],
        variables: [["合法數", "1"]],
      },
      {
        title: "第三小節",
        description: "W=64合法，結尾斜線完成結算。",
        cells: ["HH:64", "QQQ:48", "W:64"],
        active: [0, 1, 2],
        variables: [
          ["合法數", "2"],
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
    map<char, int> value{{'W', 64}, {'H', 32}, {'Q', 16}, {'E', 8}, {'S', 4}, {'T', 2}, {'X', 1}};
    string s;
    while (cin >> s && s != "*") {
        int sum = 0, ans = 0;
        for (char c : s) {
            if (c == '/') {
                ans += sum == 64;
                sum = 0;
            } else
                sum += value[c];
        }
        cout << ans << '\n';
    }
}
`,
    python: String.raw`import sys

value = dict(zip("WHQESTX", (64, 32, 16, 8, 4, 2, 1)))
for music in sys.stdin.read().split():
    if music == "*":
        break
    total = answer = 0
    for note in music:
        if note == "/":
            answer += total == 64
            total = 0
        else:
            total += value[note]
    print(answer)
`,
  }),
  defineCpeLesson("a570", {
    topic: "strings",
    level: "easy",
    concept: "先精確比對，再比較數字字元流",
    goal: "保留完整行結構，區分答案錯誤與排版錯誤。",
    explanation: [
      "先各讀取指定行數的標準答案與參賽者輸出，保存成字串陣列。兩個陣列逐行完全相同才是Accepted；連空白、空行與行數都必須一致，不可預先trim。",
      "若不完全相同，再把兩邊所有ASCII數字0到9依原順序串起來比較。相同是Presentation Error，否則是Wrong Answer。這裡比較的是數字字元，不是數值，所以01與1不同、15 0與150相同。兩邊沒有任何數字時，其數字流都為空，雖文字不同也屬排版錯誤。n=0結束，輸出Run #k:。",
    ],
    complexity: "時間 O(總字元數)，空間 O(總字元數)。",
    pitfall:
      "不能以split消除空白後才判Accepted，也不能將數字解析成整數而遺失前導零。",
    traceLabel: "示意：標準答案兩行『10』『5』",
    trace: [
      {
        title: "精確相同",
        description: "提交兩行10與5，逐行相同。",
        cells: ["10↵5", "10↵5"],
        active: [0, 1],
        variables: [
          ["行數", "2、2"],
          ["結果", "Accepted"],
        ],
      },
      {
        title: "格式不同",
        description: "提交一行105，文字結構不同但數字流同為105。",
        cells: ["10↵5", "105"],
        active: [0, 1],
        variables: [
          ["行數", "2、1"],
          ["結果", "Presentation Error"],
        ],
      },
      {
        title: "數字不同",
        description: "提交兩行10與15，數字流1015不同於105。",
        cells: ["105", "1015"],
        active: [0, 1],
        variables: [
          ["結果", "Wrong Answer"],
          ["數字長度", "3、4"],
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

string digits(const vector<string> &lines) {
    string out;
    for (auto &s : lines)
        for (char c : s)
            if (c >= '0' && c <= '9')
                out += c;
    return out;
}
int main() {
    int n, m, tc = 0;
    string line;
    while (cin >> n && n) {
        getline(cin, line);
        vector<string> a(n);
        for (auto &s : a)
            getline(cin, s);
        cin >> m;
        getline(cin, line);
        vector<string> b(m);
        for (auto &s : b)
            getline(cin, s);
        string result = a == b                   ? "Accepted"
                        : digits(a) == digits(b) ? "Presentation Error"
                                                 : "Wrong Answer";
        cout << "Run #" << ++tc << ": " << result << '\n';
    }
}
`,
    python: String.raw`import sys

lines = iter(sys.stdin.read().splitlines())
case = 0


def digits(text):
    return "".join(ch for line in text for ch in line if "0" <= ch <= "9")


for line in lines:
    n = int(line)
    if n == 0:
        break
    expected = [next(lines) for _ in range(n)]
    m = int(next(lines))
    actual = [next(lines) for _ in range(m)]
    if expected == actual:
        result = "Accepted"
    elif digits(expected) == digits(actual):
        result = "Presentation Error"
    else:
        result = "Wrong Answer"
    case += 1
    print(f"Run #{case}: {result}")
`,
  }),
  defineCpeLesson("a571", {
    topic: "dp",
    level: "medium",
    concept: "以第一節車廂為中心的雙向單調子序列",
    goal: "從後往前求可接到前端與後端的最大車廂數。",
    explanation: [
      "固定某節i為第一個保留的車廂，之後抵達且比它重的車廂只能依越來越重的順序接前端；比它輕的只能依越來越輕的順序接後端。這兩側互不影響，因此可以把從i開始、依抵達順序的最長遞增與最長遞減子序列相加，再減去重複的i。",
      "由右往左算inc[i]、dec[i]。對所有j>i，若w[j]>w[i]，用1+inc[j]更新inc[i]；若較小則更新dec[i]。最後取max(inc[i]+dec[i]−1)。陣列向右代表未來抵達者，不能誤用已抵達而被放棄的車廂。n=0時沒有中心點，答案0。",
    ],
    complexity: "時間 O(n²)，空間 O(n)。",
    pitfall: "兩種子序列都包含中心車廂，要減1；嚴格遞減不允許相等重量。",
    traceLabel: "示意：依序抵達3、1、4、2",
    trace: [
      {
        title: "最右兩節",
        description: "2本身長1；4之後可接較輕的2，dec(4)=2。",
        cells: ["4:inc1 dec2", "2:inc1 dec1"],
        active: [0, 1],
        variables: [["已算位置", "2、3"]],
      },
      {
        title: "處理重量1",
        description: "未來4或2可接前端，inc(1)=2，dec(1)=1。",
        cells: ["1:inc2 dec1"],
        active: [0],
        variables: [["中心1的長度", "2"]],
      },
      {
        title: "中心重量3",
        description: "前端可接4，後端可接1或2，inc=2、dec=2，合計3。",
        cells: ["4", "3", "1"],
        active: [0, 1, 2],
        variables: [
          ["2+2−1", "3"],
          ["答案", "3"],
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
        int n;
        cin >> n;
        vector<long long> w(n);
        for (auto &x : w)
            cin >> x;
        vector<int> inc(n, 1), dec(n, 1);
        int ans = 0;
        for (int i = n - 1; i >= 0; --i) {
            for (int j = i + 1; j < n; ++j) {
                if (w[j] > w[i])
                    inc[i] = max(inc[i], inc[j] + 1);
                if (w[j] < w[i])
                    dec[i] = max(dec[i], dec[j] + 1);
            }
            ans = max(ans, inc[i] + dec[i] - 1);
        }
        cout << ans << '\n';
    }
}
`,
    python: String.raw`import sys

it = iter(map(int, sys.stdin.read().split()))
for _ in range(next(it)):
    n = next(it)
    weight = [next(it) for _ in range(n)]
    increasing, decreasing = [1] * n, [1] * n
    answer = 0
    for i in range(n - 1, -1, -1):
        for j in range(i + 1, n):
            if weight[j] > weight[i]:
                increasing[i] = max(increasing[i], increasing[j] + 1)
            elif weight[j] < weight[i]:
                decreasing[i] = max(decreasing[i], decreasing[j] + 1)
        answer = max(answer, increasing[i] + decreasing[i] - 1)
    print(answer)
`,
  }),
];
