import { defineCpeLesson } from "@/lib/cpeLessonBuilder";

export const lessons = [
  defineCpeLesson("a636", {
    topic: "number-theory",
    level: "easy",
    concept: "逐進位拆位與符號成本",
    goal: "對 2 到 36 進位比較印字成本並列出全部最優解。",
    explanation: [
      "固定進位 b 後，以 n%b 取得最低位符號，累加該符號成本，再用 n//=b 移除最低位。位數順序不影響總成本，因此無須建出實際表示字串。對每個 b=2…36 都做一次即可。",
      "特別處理 n=0：其表示是單一 0，成本為 cost[0]，而不是空字串成本 0。求所有進位成本的最小值，按遞增順序列出同分者。每組先印 Case X:，查詢以 Cheapest base(s) for number Y: 開頭，兩組之間留一空行；36 個成本雖分四行，token 讀法不依賴換行。",
    ],
    complexity: "每查詢 O(35 log₂ n) 時間，O(35) 空間。",
    pitfall:
      "輸入的查詢值一直是十進位；餘數代表符號索引，不是它的 ASCII 編碼。",
    traceLabel: "示意：所有符號成本皆 1，查詢 10",
    trace: [
      {
        title: "二進位",
        description: "10 表示為 1010，共四個符號，成本 4。",
        cells: ["1", "0", "1", "0"],
        active: [0, 1, 2, 3],
        variables: [
          ["base", "2"],
          ["成本", "4"],
        ],
      },
      {
        title: "十進位",
        description: "10 表示為 10，共兩個符號，成本 2。",
        cells: ["1", "0"],
        active: [0, 1],
        variables: [
          ["base", "10"],
          ["成本", "2"],
        ],
      },
      {
        title: "較大進位",
        description: "11 到 36 進位都只需一個符號 A，成本 1，全部並列最便宜。",
        cells: ["A", "11…36"],
        active: [0, 1],
        variables: [
          ["最小成本", "1"],
          ["最優進位數", "26"],
        ],
      },
    ],
    cpp: String.raw`#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;
int main() {
    int t;
    cin >> t;
    for (int cs = 1; cs <= t; ++cs) {
        int cost[36];
        for (int &x : cost)
            cin >> x;
        if (cs > 1)
            cout << '\n';
        cout << "Case " << cs << ":\n";
        int q;
        cin >> q;
        while (q--) {
            long long n;
            cin >> n;
            vector<int> value(37);
            for (int b = 2; b <= 36; ++b) {
                long long x = n;
                do {
                    value[b] += cost[x % b];
                    x /= b;
                } while (x);
            }
            int best = *min_element(value.begin() + 2, value.end());
            cout << "Cheapest base(s) for number " << n << ':';
            for (int b = 2; b <= 36; ++b)
                if (value[b] == best)
                    cout << ' ' << b;
            cout << '\n';
        }
    }
}`,
    python: String.raw`import sys

it = iter(map(int, sys.stdin.buffer.read().split()))
for cs in range(1, next(it) + 1):
    cost = [next(it) for _ in range(36)]
    if cs > 1:
        print()
    print(f'Case {cs}:')
    for _ in range(next(it)):
        n = next(it)
        values = []
        for base in range(2, 37):
            x, total = n, 0
            while True:
                total += cost[x % base]
                x //= base
                if x == 0:
                    break
            values.append(total)
        best = min(values)
        bases = [base for base, value in enumerate(values, 2) if value == best]
        print(f'Cheapest base(s) for number {n}:', *bases)
`,
  }),
  defineCpeLesson("a637", {
    topic: "trees",
    level: "hard",
    concept: "逐列直方圖與單調堆疊最大矩形",
    goal: "將全零矩形轉成以每一列為底的最高連續柱形。",
    explanation: [
      "掃描每列，若格子是 0 就把該欄 height 加一，否則歸零。任何全零矩形都有最底列，因此只要在每列的直方圖中求最大矩形，就涵蓋所有候選。直方圖矩形高度等於涵蓋區間的最小柱高。",
      "以遞增高度的索引堆疊處理每個柱子；遇到較矮柱時彈出高柱 h，右邊界是目前位置 i，左邊界是彈出後的堆疊頂端加一，面積為 h·(i−left)。尾端補高度 0 讓所有柱結算，等高柱可保留，之後最左一根仍會得到完整寬度。每索引入出一次，所以每列線性；0 0 結束，沒有空地輸出 0。",
    ],
    complexity: "時間 O(MN)，額外空間 O(N)。",
    pitfall: "1 是樹、0 才能累加；彈出柱後要以新的堆疊頂端計算寬度。",
    traceLabel: "示意：某列累積高度 [2,1,2]",
    trace: [
      {
        title: "讀入低柱",
        description: "索引 1 高度 1 使索引 0 的高度 2 結算，面積 2。",
        cells: ["2", "1", "2", "0 哨兵"],
        active: [0, 1],
        variables: [["目前最大", "2"]],
      },
      {
        title: "右側高柱",
        description: "索引 2 高度 2 入堆疊，直到尾端 0 才彈出。",
        cells: ["2", "1", "2", "0"],
        active: [2, 3],
        variables: [["高 2 寬 1", "2"]],
      },
      {
        title: "全寬矩形",
        description: "高度 1 彈出後左界 0，右界 3，面積 3。",
        cells: ["1×1", "1×1", "1×1"],
        active: [0, 1, 2],
        variables: [["最大面積", "3"]],
      },
    ],
    cpp: String.raw`#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;
int main() {
    int m, n;
    while (cin >> m >> n && (m || n)) {
        vector<int> height(n + 1);
        int answer = 0;
        for (int r = 0; r < m; ++r) {
            for (int c = 0; c < n; ++c) {
                int x;
                cin >> x;
                height[c] = x ? 0 : height[c] + 1;
            }
            vector<int> stack;
            for (int i = 0; i <= n; ++i) {
                while (!stack.empty() && height[stack.back()] > height[i]) {
                    int h = height[stack.back()];
                    stack.pop_back();
                    int left = stack.empty() ? 0 : stack.back() + 1;
                    answer = max(answer, h * (i - left));
                }
                stack.push_back(i);
            }
        }
        cout << answer << '\n';
    }
}`,
    python: String.raw`import sys

it = iter(map(int, sys.stdin.buffer.read().split()))
for m in it:
    n = next(it)
    if m == n == 0:
        break
    height, answer = [0] * (n + 1), 0
    for _ in range(m):
        for c in range(n):
            height[c] = 0 if next(it) else height[c] + 1
        stack = []
        for i in range(n + 1):
            while stack and height[stack[-1]] > height[i]:
                h = height[stack.pop()]
                left = stack[-1] + 1 if stack else 0
                answer = max(answer, h * (i - left))
            stack.append(i)
    print(answer)
`,
  }),
  defineCpeLesson("a638", {
    topic: "graphs",
    level: "hard",
    concept: "最小生成樹切成 S 個叢集",
    goal: "以 MST 的邊權順序找出最低無線電通訊門檻。",
    explanation: [
      "若距離門檻為 D，普通無線電把站點分成若干連通分量。每個分量選一站裝衛星即可讓分量互通，所以只需把分量數降到不超過 S。這等同以最小瓶頸方式選 P−S 條連接邊。",
      "先用稠密 Prim 在完整距離圖求 MST，每輪取距離已選集合最近的站並更新其他站的最近距離。MST 刪掉最大的 S−1 條邊後形成 S 個分量，保留邊的最大值正是最佳 D；用交換論證，任何更小門檻都無法合併到 S 個分量。距離以平方保存，最後才開根號，並輸出兩位小數。S<P 保證至少保留一條邊。",
    ],
    complexity: "時間 O(P²)，空間 O(P)。",
    pitfall:
      "要取第 P−S 小的 MST 邊，不是最大 S 條的平均；衛星不會降低分量內連線成本。",
    traceLabel: "示意：直線站點 0、2、5、9，S=2",
    trace: [
      {
        title: "建 MST",
        description: "三條連接邊長依序為 2、3、4。",
        cells: ["0−2:2", "2−5:3", "5−9:4"],
        active: [0, 1, 2],
        variables: [["站數", "4"]],
      },
      {
        title: "切去最大邊",
        description: "移除長度 4 的邊，形成 {0,2,5} 與 {9}。",
        cells: ["{0,2,5}", "{9}"],
        active: [0, 1],
        variables: [["分量數", "2"]],
      },
      {
        title: "取保留瓶頸",
        description: "保留邊最大為 3，兩分量各有一個衛星站即可互通。",
        cells: ["2", "3", "衛星跨分量"],
        active: [1],
        variables: [["D", "3.00"]],
      },
    ],
    cpp: String.raw`#include <algorithm>
#include <cmath>
#include <iomanip>
#include <iostream>
#include <vector>
using namespace std;
int main() {
    int t;
    cin >> t;
    cout << fixed << setprecision(2);
    while (t--) {
        int s, p;
        cin >> s >> p;
        vector<long long> x(p), y(p);
        for (int i = 0; i < p; ++i)
            cin >> x[i] >> y[i];
        vector<long long> dist(p, 4000000000000000000LL), edges;
        vector<bool> used(p);
        dist[0] = 0;
        for (int i = 0; i < p; ++i) {
            int u = -1;
            for (int v = 0; v < p; ++v)
                if (!used[v] && (u < 0 || dist[v] < dist[u]))
                    u = v;
            used[u] = true;
            if (i)
                edges.push_back(dist[u]);
            for (int v = 0; v < p; ++v)
                if (!used[v]) {
                    long long dx = x[u] - x[v], dy = y[u] - y[v];
                    dist[v] = min(dist[v], dx * dx + dy * dy);
                }
        }
        sort(edges.begin(), edges.end());
        cout << sqrt((double)edges[p - s - 1]) << '\n';
    }
}`,
    python: String.raw`import sys, math

it = iter(map(int, sys.stdin.buffer.read().split()))
for _ in range(next(it)):
    s, p = next(it), next(it)
    points = [(next(it), next(it)) for _ in range(p)]
    dist, used = [10**30] * p, bytearray(p)
    dist[0] = 0
    edges = []
    for step in range(p):
        u = min((i for i in range(p) if not used[i]), key=dist.__getitem__)
        used[u] = 1
        if step:
            edges.append(dist[u])
        x, y = points[u]
        for v, (a, b) in enumerate(points):
            if not used[v]:
                dist[v] = min(dist[v], (x - a) ** 2 + (y - b) ** 2)
    edges.sort()
    print(f'{math.sqrt(edges[p - s - 1]):.2f}')
`,
  }),
  defineCpeLesson("a639", {
    topic: "combinatorics",
    level: "medium",
    concept: "欄位交集與混合進位字典序反排名",
    goal: "直接取得第 K 個不同密碼，不重複枚舉相同欄字母。",
    explanation: [
      "每一欄可用字母必須同時出現在兩張表的該欄，因此先做集合交集並排序。各欄彼此獨立，密碼總數等於五個欄位候選數的乘積；某欄為空就完全無解。重複列字母只算一次。",
      "把 K 改成零起算順位 r=K−1。固定當前欄一個字母後，後面所有欄形成 block 個組合，所以當前字母索引為 r//block，再更新 r%=block；逐欄如此就得到字典序第 K 個。若 K 大於總數先輸出 NO，避免除以零或越界。每組精確讀入兩份六行五欄表格。",
    ],
    complexity: "每組 O(60+5·26 log 26) 時間，O(5·26) 空間。",
    pitfall: "每欄可自由取自任意列，不能要求五字母出自同一列；K 是一基順位。",
    traceLabel: "示意：五欄候選 {A,B}、{C,D}、{E}、{F}、{G}，K=3",
    trace: [
      {
        title: "零起算",
        description: "共 2×2×1×1×1=4 組，r=2。",
        cells: ["AB", "CD", "E", "F", "G"],
        active: [0, 1],
        variables: [
          ["r", "2"],
          ["總數", "4"],
        ],
      },
      {
        title: "選第一欄",
        description: "每個首字母有 2 組，2//2=1，選 B，餘順位 0。",
        cells: ["B", "CD", "E", "F", "G"],
        active: [0],
        variables: [
          ["block", "2"],
          ["r", "0"],
        ],
      },
      {
        title: "填其餘欄",
        description: "順位 0 皆選最小字母，得到 BCEFG。",
        cells: ["B", "C", "E", "F", "G"],
        active: [1, 2, 3, 4],
        variables: [["答案", "BCEFG"]],
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
        int k;
        cin >> k;
        vector<string> a(6), b(6);
        for (auto &s : a)
            cin >> s;
        for (auto &s : b)
            cin >> s;
        vector<string> options(5);
        for (int c = 0; c < 5; ++c)
            for (char ch = 'A'; ch <= 'Z'; ++ch) {
                bool x = false, y = false;
                for (int r = 0; r < 6; ++r) {
                    x |= a[r][c] == ch;
                    y |= b[r][c] == ch;
                }
                if (x && y)
                    options[c] += ch;
            }
        int total = 1;
        for (auto &s : options)
            total *= s.size();
        if (k > total) {
            cout << "NO\n";
            continue;
        }
        int rank = k - 1;
        string answer;
        for (int c = 0; c < 5; ++c) {
            int block = 1;
            for (int j = c + 1; j < 5; ++j)
                block *= options[j].size();
            answer += options[c][rank / block];
            rank %= block;
        }
        cout << answer << '\n';
    }
}`,
    python: String.raw`import sys, math

it = iter(sys.stdin.read().split())
for _ in range(int(next(it))):
    k = int(next(it))
    a, b = [next(it) for _ in range(6)], [next(it) for _ in range(6)]
    options = [sorted({row[c] for row in a} & {row[c] for row in b}) for c in range(5)]
    total = math.prod(map(len, options))
    if k > total:
        print('NO')
        continue
    rank, answer = k - 1, []
    for c in range(5):
        block = math.prod(len(options[j]) for j in range(c + 1, 5))
        index, rank = divmod(rank, block)
        answer.append(options[c][index])
    print(''.join(answer))
`,
  }),
  defineCpeLesson("a640", {
    topic: "search",
    level: "medium",
    concept: "答案二分與最少天數貪心",
    goal: "將最大單日距離最佳化轉為可行門檻判斷。",
    explanation: [
      "給定單日上限 D，由左至右盡可能把相鄰路段裝進同一天，下一段會超過 D 時才在目前營地過夜。這種晚停策略使每天到達位置至少不比任何其他可行切法更早，因此所用天數最少。若最少天數≤K+1，D 就可行。",
      "可行性隨 D 增大只會更容易，所以在最大單段距離與總距離之間二分找第一個可行值。若 K≤N，少用的天數可再把路段切開，補成恰好 K 夜而不增加最大值。本地輸入沒有明言 K≤N；程式對 K>N 採可多休息但不增加步行的自然延伸，回傳最大單段距離，若要求每夜不同營地則該情況未定義。多組讀至 EOF，只印最佳距離。",
    ],
    complexity: "時間 O(N log Σdistance)，空間 O(N)。",
    pitfall: "共有 N+1 段距離；不是 N 段。K 夜代表 K+1 天。",
    traceLabel: "示意：路段 7、2、6、4、5，K=3",
    trace: [
      {
        title: "試上限 7",
        description: "分成 [7]、[2]、[6]、[4]、[5]，需 5 天，超過 4 天。",
        cells: ["7", "2", "6", "4", "5"],
        active: [0, 1, 2, 3, 4],
        variables: [
          ["D", "7"],
          ["天數", "5"],
        ],
      },
      {
        title: "試上限 8",
        description: "可分成 [7]、[2,6]、[4]、[5]，恰 4 天。",
        cells: ["7", "2+6=8", "4", "5"],
        active: [1],
        variables: [
          ["D", "8"],
          ["天數", "4"],
        ],
      },
      {
        title: "最小可行",
        description: "7 不可行而 8 可行，最佳最大單日距離是 8。",
        cells: ["7:否", "8:是"],
        active: [1],
        variables: [["答案", "8"]],
      },
    ],
    cpp: String.raw`#include <algorithm>
#include <iostream>
#include <numeric>
#include <vector>
using namespace std;
int main() {
    int n, k;
    while (cin >> n >> k) {
        vector<long long> a(n + 1);
        for (auto &x : a)
            cin >> x;
        long long lo = *max_element(a.begin(), a.end()), hi = accumulate(a.begin(), a.end(), 0LL);
        while (lo < hi) {
            long long mid = lo + (hi - lo) / 2, current = 0;
            int days = 1;
            for (long long x : a) {
                if (current + x > mid) {
                    ++days;
                    current = 0;
                }
                current += x;
            }
            if (days <= k + 1)
                hi = mid;
            else
                lo = mid + 1;
        }
        cout << lo << '\n';
    }
}`,
    python: String.raw`import sys

it = iter(map(int, sys.stdin.buffer.read().split()))
for n in it:
    k = next(it)
    a = [next(it) for _ in range(n + 1)]
    lo, hi = max(a), sum(a)
    while lo < hi:
        mid = (lo + hi) // 2
        days, current = 1, 0
        for x in a:
            if current + x > mid:
                days += 1
                current = 0
            current += x
        if days <= k + 1:
            hi = mid
        else:
            lo = mid + 1
    print(lo)
`,
  }),
  defineCpeLesson("a641", {
    topic: "math",
    level: "medium",
    concept: "無限等比級數與穩定機率計算",
    goal: "累加所有輪次中第 I 位玩家首次成功的機率。",
    explanation: [
      "令 q=1−p。第 I 位在第一輪獲勝需前 I−1 人失敗而自己成功，機率是 q^(I−1)p；若整整 N 人都失敗，遊戲回到同一狀態，乘上一個 q^N。因此最終機率為 q^(I−1)p·Σₖ(q^N)^k=q^(I−1)p/(1−q^N)。",
      "p=0 時永無成功，所有玩家獲勝機率為 0；p=1 時只有第一人獲勝。其餘情況用 log1p(−p) 計算 log q，再用 −expm1(N log q) 算分母，可減少 p 極小時 1−q^N 的相減誤差。讀首行筆數，答案固定四位小數。",
    ],
    complexity: "每筆 O(1) 時間與空間。",
    pitfall: "分母是 1−(1−p)^N；p=0 不能直接除以零。",
    traceLabel: "示意：N=2、p=0.5、I=2",
    trace: [
      {
        title: "首輪獲勝",
        description: "玩家 1 失敗且玩家 2 成功，機率 0.5×0.5=0.25。",
        cells: ["失敗 0.5", "成功 0.5"],
        active: [0, 1],
        variables: [["首項", "0.25"]],
      },
      {
        title: "整輪失敗",
        description: "兩人皆失敗機率 0.25，下一輪同位置勝率再乘此值。",
        cells: ["0.25", "0.0625", "0.015625"],
        active: [0, 1, 2],
        variables: [["公比", "0.25"]],
      },
      {
        title: "等比和",
        description: "0.25/(1−0.25)=1/3，輸出 0.3333。",
        cells: ["0.25", "0.75", "0.3333"],
        active: [2],
        variables: [["答案", "0.3333"]],
      },
    ],
    cpp: String.raw`#include <cmath>
#include <iomanip>
#include <iostream>
using namespace std;
int main() {
    int t;
    cin >> t;
    cout << fixed << setprecision(4);
    while (t--) {
        int n, i;
        double p;
        cin >> n >> p >> i;
        double answer;
        if (p == 0)
            answer = 0;
        else if (p == 1)
            answer = i == 1 ? 1 : 0;
        else {
            double logq = log1p(-p);
            answer = exp((i - 1) * logq) * p / (-expm1(n * logq));
        }
        cout << answer << '\n';
    }
}`,
    python: String.raw`import sys, math

it = iter(sys.stdin.buffer.read().split())
for _ in range(int(next(it))):
    n, p, i = int(next(it)), float(next(it)), int(next(it))
    if p == 0:
        answer = 0.0
    elif p == 1:
        answer = float(i == 1)
    else:
        logq = math.log1p(-p)
        answer = math.exp((i - 1) * logq) * p / (-math.expm1(n * logq))
    print(f'{answer:.4f}')
`,
  }),
  defineCpeLesson("a642", {
    topic: "number-theory",
    level: "medium",
    concept: "依末位分類的前綴遞迴",
    goal: "用每十個數的規律計算最右非零數字總和。",
    explanation: [
      "定義 G(n)=Σ₀≤x≤n F(x)。寫 n=10q+r。所有非十倍數的末位每完整一組貢獻 1+…+9=45，共 q 組；最後不完整組貢獻 1+…+r=r(r+1)/2。",
      "剩下十倍數 10、20……10q 的 F 值與 1、2……q 完全相同，因此 G(n)=45q+r(r+1)/2+G(q)。每次除以 10，只有位數那麼多層。範圍答案取 G(q)−G(p−1)，令負參數前綴為 0；兩個負數是結束標記，不處理。C++ 的總和使用 64 位元。",
    ],
    complexity: "每筆時間 O(log₁₀q)，迭代額外空間 O(1)。",
    pitfall: "F(100)=1 而非 0；不可枚舉可能長達二十億的範圍。",
    traceLabel: "示意：計算 S(10,20)",
    trace: [
      {
        title: "計算前 20",
        description: "q=2,r=0，非十倍數貢獻 90，再加 G(2)=3。",
        cells: ["45×2=90", "G(2)=3"],
        active: [0, 1],
        variables: [["G(20)", "93"]],
      },
      {
        title: "扣前 9",
        description: "G(9)=1+…+9=45。",
        cells: ["93", "45"],
        active: [1],
        variables: [["G(9)", "45"]],
      },
      {
        title: "區間相減",
        description: "93−45=48，其中端點 10、20 分別貢獻 1、2。",
        cells: ["1", "45", "2"],
        active: [0, 1, 2],
        variables: [["答案", "48"]],
      },
    ],
    cpp: String.raw`#include <iostream>
using namespace std;
long long prefix(long long n) {
    long long answer = 0;
    while (n > 0) {
        long long q = n / 10, r = n % 10;
        answer += 45 * q + r * (r + 1) / 2;
        n = q;
    }
    return answer;
}
int main() {
    long long p, q;
    while (cin >> p >> q) {
        if (p < 0 && q < 0)
            break;
        cout << prefix(q) - prefix(p - 1) << '\n';
    }
}`,
    python: String.raw`import sys


def prefix(n):
    answer = 0
    while n > 0:
        q, r = divmod(n, 10)
        answer += 45 * q + r * (r + 1) // 2
        n = q
    return answer


it = iter(map(int, sys.stdin.buffer.read().split()))
for p in it:
    q = next(it)
    if p < 0 and q < 0:
        break
    print(prefix(q) - prefix(p - 1))
`,
  }),
  defineCpeLesson("a643", {
    topic: "graphs",
    level: "hard",
    concept: "中國郵差：奇度點最小配對",
    goal: "以最少補走距離讓所有步道能形成封閉 Euler 路線。",
    explanation: [
      "每條步道至少走一次，先把全部邊長相加得到必付成本。無向圖有封閉 Euler 路線的條件是所有有邊頂點皆連通且度數為偶；題目保證步道連通，因此只須補走路線，使原本奇度頂點都變成偶度。補走一條兩端為奇點的路，恰會翻轉兩端奇偶性。",
      "先 Floyd 求最短路，平行邊的總長都要加入必付成本，但距離矩陣只留最短一條。列出奇度點，用 mask DP 配對：選尚未配對的第一點 i，嘗試與每個 j 配對，代價 dist[i][j]+match(mask−i−j)，取小。任何補走集合都能分解成奇點間路徑，故最短配對達到最優。單獨 0 結束；原本全偶度時補走成本為 0。",
    ],
    complexity: "時間 O(n³+o²2^o)，空間 O(n²+2^o)，o 為奇度點數且 o≤14。",
    pitfall: "平行邊全部都必須走；不能把較長平行邊從基本總長刪掉。",
    traceLabel: "示意：路徑 1−2 長 3、2−3 長 4",
    trace: [
      {
        title: "基本總長",
        description: "所有邊各走一次需 3+4=7。",
        cells: ["1−2:3", "2−3:4"],
        active: [0, 1],
        variables: [["基本成本", "7"]],
      },
      {
        title: "奇度頂點",
        description: "1、3 度數為 1，2 度數為 2；須配對 1、3。",
        cells: ["1:奇", "2:偶", "3:奇"],
        active: [0, 2],
        variables: [["最短配對距離", "7"]],
      },
      {
        title: "補成封閉路線",
        description: "沿 1→2→3→2→1，總長 14。",
        cells: ["3", "4", "4", "3"],
        active: [0, 1, 2, 3],
        variables: [["答案", "14"]],
      },
    ],
    cpp: String.raw`#include <algorithm>
#include <functional>
#include <iostream>
#include <vector>
using namespace std;
int main() {
    int n;
    while (cin >> n && n) {
        int m;
        cin >> m;
        const long long INF = 4000000000000000LL;
        vector<vector<long long>> d(n, vector<long long>(n, INF));
        vector<int> degree(n);
        long long total = 0;
        for (int i = 0; i < n; ++i)
            d[i][i] = 0;
        while (m--) {
            int u, v;
            long long w;
            cin >> u >> v >> w;
            --u;
            --v;
            total += w;
            ++degree[u];
            ++degree[v];
            d[u][v] = d[v][u] = min(d[u][v], w);
        }
        for (int k = 0; k < n; ++k)
            for (int i = 0; i < n; ++i)
                for (int j = 0; j < n; ++j)
                    d[i][j] = min(d[i][j], d[i][k] + d[k][j]);
        vector<int> odd;
        for (int i = 0; i < n; ++i)
            if (degree[i] % 2)
                odd.push_back(i);
        int count = odd.size();
        vector<long long> memo(1 << count, -1);
        memo[0] = 0;
        function<long long(int)> match = [&](int mask) {
            if (memo[mask] >= 0)
                return memo[mask];
            int i = 0;
            while (!(mask & (1 << i)))
                ++i;
            long long answer = INF;
            for (int j = i + 1; j < count; ++j)
                if (mask & (1 << j))
                    answer = min(answer, d[odd[i]][odd[j]] + match(mask ^ (1 << i) ^ (1 << j)));
            return memo[mask] = answer;
        };
        cout << total + match((1 << count) - 1) << '\n';
    }
}`,
    python: String.raw`import sys
from functools import lru_cache

it = iter(map(int, sys.stdin.buffer.read().split()))
for n in it:
    if n == 0:
        break
    m = next(it)
    dist = [[10**30] * n for _ in range(n)]
    degree = [0] * n
    total = 0
    for i in range(n):
        dist[i][i] = 0
    for _ in range(m):
        u, v, w = next(it) - 1, next(it) - 1, next(it)
        total += w
        degree[u] += 1
        degree[v] += 1
        dist[u][v] = dist[v][u] = min(dist[u][v], w)
    for k in range(n):
        for i in range(n):
            for j in range(n):
                dist[i][j] = min(dist[i][j], dist[i][k] + dist[k][j])
    odd = [i for i in range(n) if degree[i] % 2]

    @lru_cache(None)
    def match(mask):
        if mask == 0:
            return 0
        first = mask & -mask
        i = first.bit_length() - 1
        rest = mask ^ first
        answer = 10**30
        choices = rest
        while choices:
            bit = choices & -choices
            j = bit.bit_length() - 1
            answer = min(answer, dist[odd[i]][odd[j]] + match(rest ^ bit))
            choices ^= bit
        return answer

    print(total + match((1 << len(odd)) - 1))
`,
  }),
  defineCpeLesson("a644", {
    topic: "dp",
    level: "hard",
    concept: "四柱河內塔差分區塊與大整數",
    goal: "利用最佳分割的增量規律預算到一萬個盤子。",
    explanation: [
      "題目指定策略的遞推是 H(0)=0，H(n)=min₀≤k<n(2H(k)+2^(n−k)−1)。直接做一萬乘一萬次大整數比較成本高。此遞推的相鄰差分可分成區塊：1 出現 1 次、2 出現 2 次、4 出現 3 次，亦即 2^r 連續出現 r+1 次。",
      "這個規律可由遞推的相鄰候選比較歸納：當前區塊結束於三角數 T(r)=(r+1)(r+2)/2，最優三柱部分的盤數維持 r+1 或 r+2；跨過三角數後，新增盤子的最小成本才翻倍。因此逐區塊累加差分即可產生所有 H(n)。Python 用內建大整數，C++ 以十進位字串加法實作倍增及累加，完全符合 C++17 而不依賴額外大數庫。n=0 輸出 0，輸入至 EOF。",
    ],
    complexity: "設答案位數 D=O(√N)，預處理 O(ND) 時間、O(ND) 儲存所有答案。",
    pitfall: "不可使用固定 64 位整數；三柱 2^n−1 不是四柱策略的答案。",
    traceLabel: "示意：前六個盤數的增量",
    trace: [
      {
        title: "第一區塊",
        description: "增量 1 出現一次，H(1)=1。",
        cells: ["Δ1=1", "H1=1"],
        active: [0, 1],
        variables: [["r", "0"]],
      },
      {
        title: "第二區塊",
        description: "增量 2 出現兩次，H(2)=3、H(3)=5。",
        cells: ["1", "3", "5"],
        active: [1, 2],
        variables: [
          ["r", "1"],
          ["增量", "2"],
        ],
      },
      {
        title: "第三區塊",
        description: "增量 4 出現三次，H(4)=9、H(5)=13、H(6)=17。",
        cells: ["9", "13", "17"],
        active: [0, 1, 2],
        variables: [
          ["r", "2"],
          ["增量", "4"],
        ],
      },
    ],
    cpp: String.raw`#include <algorithm>
#include <iostream>
#include <string>
#include <vector>
using namespace std;
string add(string a, string b) {
    string out;
    int i = (int)a.size() - 1, j = (int)b.size() - 1, carry = 0;
    while (i >= 0 || j >= 0 || carry) {
        int value = carry;
        if (i >= 0)
            value += a[i--] - '0';
        if (j >= 0)
            value += b[j--] - '0';
        out += char('0' + value % 10);
        carry = value / 10;
    }
    reverse(out.begin(), out.end());
    return out;
}
int main() {
    vector<string> answer(10001);
    answer[0] = "0";
    string step = "1";
    int index = 1;
    for (int repeat = 1; index <= 10000; ++repeat) {
        for (int j = 0; j < repeat && index <= 10000; ++j, ++index)
            answer[index] = add(answer[index - 1], step);
        step = add(step, step);
    }
    int n;
    while (cin >> n)
        cout << answer[n] << '\n';
}`,
    python: String.raw`import sys

answer = [0]
step, repeat = 1, 1
while len(answer) <= 10000:
    for _ in range(repeat):
        if len(answer) > 10000:
            break
        answer.append(answer[-1] + step)
    step *= 2
    repeat += 1
for token in sys.stdin.buffer.read().split():
    print(answer[int(token)])
`,
  }),
  defineCpeLesson("a645", {
    topic: "sorting",
    level: "medium",
    concept: "相鄰工作交換與精確比值排序",
    goal: "以交叉乘積安排最低延遲罰款，並處理字典序平手。",
    explanation: [
      "考慮兩相鄰工作 i、j，忽略前面已造成的固定延遲。i 先做時，j 額外等 Ti 天，罰款 Ti·Sj；j 先做時則是 Tj·Si。因此 i 應在 j 前的條件為 Ti·Sj<Tj·Si，相當於時間/罰款比值遞增。",
      "依這個比較器排序，任何不符合順序的相鄰對交換都不會增加成本，故可達整體最優。交叉乘積相等時兩種順序成本一樣，選原工作編號小者在前，得到字典序最小最優序列。用整數比較避免浮點誤差，空白行讓 token 讀法自動略過；輸出組間也留一空白行。",
    ],
    complexity: "時間 O(N log N)，空間 O(N)。",
    pitfall: "比較的是延遲開始的罰款；排序比值的方向不能顛倒，同比分數依編號。",
    traceLabel: "示意：工作 1=(3,4)，2=(1,1000)，3=(2,2)",
    trace: [
      {
        title: "比較 1、2",
        description: "3×1000=3000 大於 1×4=4，2 應在 1 前。",
        cells: ["1:3/4", "2:1/1000", "3:2/2"],
        active: [0, 1],
        variables: [["較佳順序", "2,1"]],
      },
      {
        title: "比較 1、3",
        description: "3×2=6 小於 2×4=8，所以 1 在 3 前。",
        cells: ["2", "1", "3"],
        active: [1, 2],
        variables: [["排序", "2,1,3"]],
      },
      {
        title: "計算延遲成本",
        description: "2 等 0 天、1 等 1 天、3 等 4 天，罰款 0+4+8=12。",
        cells: ["0", "4", "8"],
        active: [0, 1, 2],
        variables: [["總罰款", "12"]],
      },
    ],
    cpp: String.raw`#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;
struct Job {
    long long time, fine;
    int id;
};
int main() {
    int t;
    cin >> t;
    for (int cs = 0; cs < t; ++cs) {
        int n;
        cin >> n;
        vector<Job> a(n);
        for (int i = 0; i < n; ++i) {
            cin >> a[i].time >> a[i].fine;
            a[i].id = i + 1;
        }
        sort(a.begin(), a.end(), [](const Job &x, const Job &y) {
            long long left = x.time * y.fine, right = y.time * x.fine;
            return left != right ? left < right : x.id < y.id;
        });
        if (cs)
            cout << '\n';
        for (int i = 0; i < n; ++i) {
            if (i)
                cout << ' ';
            cout << a[i].id;
        }
        cout << '\n';
    }
}`,
    python: String.raw`import sys
from functools import cmp_to_key

it = iter(map(int, sys.stdin.buffer.read().split()))


def compare(x, y):
    difference = x[0] * y[1] - y[0] * x[1]
    return (difference > 0) - (difference < 0) if difference else x[2] - y[2]


for cs in range(next(it)):
    n = next(it)
    jobs = [(next(it), next(it), i + 1) for i in range(n)]
    jobs.sort(key=cmp_to_key(compare))
    if cs:
        print()
    print(*(job[2] for job in jobs))
`,
  }),
  defineCpeLesson("a646", {
    topic: "number-theory",
    level: "easy",
    concept: "十進位串流取餘",
    goal: "不用大整數也能判斷千位數是否為 11 的倍數。",
    explanation: [
      "從左到右讀數字字元，若已讀前綴餘數為 r，加入新數字 d 後的新前綴是 10×前綴+d，因此新餘數為 (10r+d)%11。歸納可知，讀完整串後 r 就是整數除以 11 的餘數。",
      "每一步 r 都在 0–10，永遠不會溢位，也無須把長達 1000 位的輸入轉成機器整數。保留原字串供輸出，餘數為 0 就印 is a multiple of 11.，否則印 is not a multiple of 11.。單獨的 0 結束，不輸出該行。",
    ],
    complexity: "每筆時間 O(L)，除原字串外空間 O(1)。",
    pitfall: "輸出必須保留輸入數字；結束標記是字串 0，不應先轉成有界整數。",
    traceLabel: "示意：1122",
    trace: [
      {
        title: "讀前兩位",
        description: "先得 r=1，再算 (10×1+1)%11=0。",
        cells: ["1", "1", "2", "2"],
        active: [0, 1],
        variables: [
          ["前綴", "11"],
          ["r", "0"],
        ],
      },
      {
        title: "讀第三位",
        description: "(10×0+2)%11=2。",
        cells: ["1", "1", "2", "2"],
        active: [2],
        variables: [
          ["前綴", "112"],
          ["r", "2"],
        ],
      },
      {
        title: "讀第四位",
        description: "(10×2+2)%11=0，因此 1122 是 11 的倍數。",
        cells: ["22", "mod 11", "0"],
        active: [2],
        variables: [["判定", "是"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <string>
using namespace std;
int main() {
    string s;
    while (cin >> s && s != "0") {
        int r = 0;
        for (char ch : s)
            r = (10 * r + ch - '0') % 11;
        cout << s << (r == 0 ? " is a multiple of 11.\n" : " is not a multiple of 11.\n");
    }
}`,
    python: String.raw`import sys

for s in sys.stdin.read().split():
    if s == '0':
        break
    remainder = 0
    for ch in s:
        remainder = (10 * remainder + ord(ch) - 48) % 11
    print(s + (' is a multiple of 11.' if remainder == 0 else ' is not a multiple of 11.'))
`,
  }),
  defineCpeLesson("a647", {
    topic: "dp",
    level: "hard",
    concept: "費氏快速倍增與模運算",
    goal: "以對數時間求大索引的 Fibonacci 模 2ᵐ。",
    explanation: [
      "同時求 (F(k),F(k+1))，可用倍增恆等式 F(2k)=F(k)(2F(k+1)−F(k))、F(2k+1)=F(k)²+F(k+1)²。若 n 為偶數，答案對就是這兩者；若 n 為奇數，則取 (F(2k+1),F(2k)+F(2k+1))。",
      "每層先遞迴到 n//2，所以即使 n 接近 2^31 也只需約 31 層。所有乘法與加法立即對 M=2^m 取模，C++ 用 long long 保存兩個小於 2^19 的數相乘。差值可能負，先加 M 再取模；m=0 時 M=1，包含基底 F(1) 也須取模為 0。多組讀至 EOF，每行印餘數。",
    ],
    complexity: "時間 O(log n)，遞迴空間 O(log n)。",
    pitfall: "模數是 2 的 m 次方；不是對 m 取餘，也不能線性算到 n。",
    traceLabel: "示意：n=5、m=3，模數 8",
    trace: [
      {
        title: "基底與 n=1",
        description: "(F0,F1)=(0,1)，得到 (F1,F2)=(1,1)。",
        cells: ["0", "1", "1"],
        active: [1, 2],
        variables: [["模數", "8"]],
      },
      {
        title: "倍增至 n=2",
        description: "c=1×(2×1−1)=1，d=1²+1²=2。",
        cells: ["F2=1", "F3=2"],
        active: [0, 1],
        variables: [["配對", "(1,2)"]],
      },
      {
        title: "奇數 n=5",
        description: "F4=1×(4−1)=3，F5=1+4=5，F6=8 mod 8=0。",
        cells: ["F4=3", "F5=5", "F6=0"],
        active: [1],
        variables: [["答案", "5"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <utility>
using namespace std;
pair<long long, long long> fib(long long n, long long mod) {
    if (!n)
        return {0, 1 % mod};
    auto [a, b] = fib(n / 2, mod);
    long long c = a * ((2 * b - a + mod) % mod) % mod, d = (a * a + b * b) % mod;
    if (n % 2)
        return {d, (c + d) % mod};
    return {c, d};
}
int main() {
    long long n;
    int m;
    while (cin >> n >> m)
        cout << fib(n, 1LL << m).first << '\n';
}`,
    python: String.raw`import sys


def fib(n, mod):
    if n == 0:
        return 0, 1 % mod
    a, b = fib(n // 2, mod)
    c = a * (2 * b - a) % mod
    d = (a * a + b * b) % mod
    return (d, (c + d) % mod) if n % 2 else (c, d)


it = iter(map(int, sys.stdin.buffer.read().split()))
for n in it:
    m = next(it)
    print(fib(n, 1 << m)[0])
`,
  }),
  defineCpeLesson("a648", {
    topic: "math",
    level: "medium",
    concept: "兩層磚塊關係的代數還原",
    goal: "先求最底列缺值，再用相鄰相加重建整面牆。",
    explanation: [
      "設某三塊相鄰底磚為 a、b、c，兩層上方的磚就是 (a+b)+(b+c)=a+2b+c。第九列的奇數位置 a、c 已知，而第七列對應位置也已知，所以可直接求中間缺磚 b=(upper−a−c)/2。四個這樣的方程便能補齊最底列的偶數位置。",
      "最底列完整後，從第八列往上，每塊都等於下方相鄰兩塊之和，不需要再解其他方程。題目保證整數解，因此除以 2 必能整除，且即使值是 0 也不可當成未知標記。依輸入五行把數字放到零基偶數列、偶數欄；每組輸出九行，沒有額外空白行。C++ 用 long long 保留中間加總。",
    ],
    complexity: "固定 9 列，時間與空間 O(9²)。",
    pitfall: "零可能是合法磚值；輸入的第 3 列只有第 1、3 塊，不是連續兩塊。",
    traceLabel: "示意：底列全 1 的九列牆",
    trace: [
      {
        title: "已知底列奇位",
        description: "第九列位置 1、3、5、7、9 都是 1，第七列對應值是 4。",
        cells: ["1", "?", "1", "?", "1", "?", "1", "?", "1"],
        active: [0, 2, 4, 6, 8],
        variables: [["第七列已知值", "4"]],
      },
      {
        title: "補底列偶位",
        description: "每個缺值 (4−1−1)/2=1，底列全 1。",
        cells: ["1", "1", "1", "1", "1", "1", "1", "1", "1"],
        active: [1, 3, 5, 7],
        variables: [["缺磚值", "1"]],
      },
      {
        title: "向上相加",
        description: "第八列全 2、第七列全 4，逐列加倍，頂端為 256。",
        cells: ["第9列 1", "第8列 2", "第7列 4", "第1列 256"],
        active: [3],
        variables: [["頂磚", "256"]],
      },
    ],
    cpp: String.raw`#include <iostream>
using namespace std;
int main() {
    int t;
    cin >> t;
    while (t--) {
        long long wall[9][9] = {};
        for (int r = 0; r < 9; r += 2)
            for (int c = 0; c <= r; c += 2)
                cin >> wall[r][c];
        for (int c = 1; c < 9; c += 2)
            wall[8][c] = (wall[6][c - 1] - wall[8][c - 1] - wall[8][c + 1]) / 2;
        for (int r = 7; r >= 0; --r)
            for (int c = 0; c <= r; ++c)
                wall[r][c] = wall[r + 1][c] + wall[r + 1][c + 1];
        for (int r = 0; r < 9; ++r) {
            for (int c = 0; c <= r; ++c) {
                if (c)
                    cout << ' ';
                cout << wall[r][c];
            }
            cout << '\n';
        }
    }
}`,
    python: String.raw`import sys

it = iter(map(int, sys.stdin.buffer.read().split()))
for _ in range(next(it)):
    wall = [[0] * (r + 1) for r in range(9)]
    for r in range(0, 9, 2):
        for c in range(0, r + 1, 2):
            wall[r][c] = next(it)
    for c in range(1, 9, 2):
        wall[8][c] = (wall[6][c - 1] - wall[8][c - 1] - wall[8][c + 1]) // 2
    for r in range(7, -1, -1):
        for c in range(r + 1):
            wall[r][c] = wall[r + 1][c] + wall[r + 1][c + 1]
    for row in wall:
        print(*row)
`,
  }),
  defineCpeLesson("a649", {
    topic: "simulation",
    level: "easy",
    concept: "反轉相加的必做第一步與回文檢查",
    goal: "逐次模擬反轉加法，正確記錄操作次數與結果。",
    explanation: [
      "將目前數字的十進位表示反轉，轉回整數後相加；反轉時前導零會自然消失，例如 120 的反轉是 21。每做一次加法，次數加一，再檢查新數字左右讀是否相同。",
      "題目要求進行反轉再相加後才測試結果，所以即使起始值已經是回文，也至少做一次。使用 do-while 型態可直接表達這個順序。保證少於 1000 次就結束且最終值不超過 4294967295；C++ 用 unsigned long long，避免超過有號 32 位元。讀首行 N，每組印次數、空白、最終回文。",
    ],
    complexity: "若迭代 t 次、每數 d 位，時間 O(td)，空間 O(d)。",
    pitfall: "起始回文仍先相加一次；反轉後的前導零不保留。",
    traceLabel: "示意：起始 195",
    trace: [
      {
        title: "前兩次",
        description: "195+591=786；786+687=1473。",
        cells: ["195", "786", "1473"],
        active: [1, 2],
        variables: [["次數", "2"]],
      },
      {
        title: "第三次",
        description: "1473+3741=5214，仍非回文。",
        cells: ["1473", "3741", "5214"],
        active: [2],
        variables: [["次數", "3"]],
      },
      {
        title: "第四次",
        description: "5214+4125=9339，左右讀相同，停止。",
        cells: ["5214", "4125", "9339"],
        active: [2],
        variables: [
          ["次數", "4"],
          ["答案", "9339"],
        ],
      },
    ],
    cpp: String.raw`#include <algorithm>
#include <iostream>
#include <string>
using namespace std;
int main() {
    int t;
    cin >> t;
    while (t--) {
        unsigned long long n;
        cin >> n;
        int count = 0;
        for (;;) {
            string reverseNumber = to_string(n);
            reverse(reverseNumber.begin(), reverseNumber.end());
            n += stoull(reverseNumber);
            ++count;
            string s = to_string(n), r = s;
            reverse(r.begin(), r.end());
            if (s == r)
                break;
        }
        cout << count << ' ' << n << '\n';
    }
}`,
    python: String.raw`import sys

it = iter(map(int, sys.stdin.buffer.read().split()))
for _ in range(next(it)):
    n = next(it)
    count = 0
    while True:
        n += int(str(n)[::-1])
        count += 1
        s = str(n)
        if s == s[::-1]:
            break
    print(count, n)
`,
  }),
  defineCpeLesson("a650", {
    topic: "combinatorics",
    level: "medium",
    concept: "高維等邊形體與所有盒體的差",
    goal: "由每軸區間選擇推導二至四維矩形與立方體數量。",
    explanation: [
      "一軸上從 N+1 條格線選兩條，區間數是 C(N+1,2)=N(N+1)/2。d 維軸平行盒體可在每軸獨立選區間，因此總數為 C(N+1,2)^d。這包含所有等邊和不等邊情況。",
      "固定等邊邊長 k，每軸可選的起點數為 N−k+1，所以 d 維等邊形體數是 Σₖ₌₁ᴺ(N−k+1)^d=Σᵢ₌₁ᴺi^d。對 d=2、3、4 分別求和，再從總盒體數扣除等邊數，按 S₂ R₂ S₃ R₃ S₄ R₄ 輸出。N=0 是合法資料，要輸出六個 0；最大四維總數超出 32 位元，使用 long long。",
    ],
    complexity: "每筆時間 O(N)，空間 O(1)。",
    pitfall: "R 類計數必須排除正方形、正立方體與超立方體；0 不是終止標記。",
    traceLabel: "示意：N=2",
    trace: [
      {
        title: "一軸區間",
        description: "三條格線可選出 3 個區間，各維總數為 3²、3³、3⁴。",
        cells: ["9", "27", "81"],
        active: [0, 1, 2],
        variables: [["一軸區間數", "3"]],
      },
      {
        title: "等邊形體",
        description: "S₂=1²+2²=5，S₃=1+8=9，S₄=1+16=17。",
        cells: ["5", "9", "17"],
        active: [0, 1, 2],
        variables: [["維度", "2,3,4"]],
      },
      {
        title: "扣除等邊",
        description: "9−5=4，27−9=18，81−17=64。",
        cells: ["5 4", "9 18", "17 64"],
        active: [0, 1, 2],
        variables: [["輸出", "5 4 9 18 17 64"]],
      },
    ],
    cpp: String.raw`#include <iostream>
using namespace std;
int main() {
    long long n;
    while (cin >> n) {
        long long base = n * (n + 1) / 2, total = base;
        for (int d = 2; d <= 4; ++d) {
            total *= base;
            long long equal = 0;
            for (long long i = 1; i <= n; ++i) {
                long long power = 1;
                for (int k = 0; k < d; ++k)
                    power *= i;
                equal += power;
            }
            if (d > 2)
                cout << ' ';
            cout << equal << ' ' << total - equal;
        }
        cout << '\n';
    }
}`,
    python: String.raw`import sys

for token in sys.stdin.buffer.read().split():
    n = int(token)
    base = n * (n + 1) // 2
    answer = []
    for d in (2, 3, 4):
        equal = sum(i**d for i in range(1, n + 1))
        answer.extend((equal, base**d - equal))
    print(*answer)
`,
  }),
  defineCpeLesson("a651", {
    topic: "sorting",
    level: "medium",
    concept: "串接比較器與相鄰交換",
    goal: "以 ab 與 ba 的大小決定數字字串的最佳順序。",
    explanation: [
      "兩個數字字串 a、b 的順序只能影響局部串接 ab 或 ba。若 ab>ba，就應讓 a 在 b 前；交換這一對不改變總長度，也不改變其他字元，因此能讓整體結果更大。依此比較器排序，再直接串接所有字串。",
      "不能按整數值或一般字典序排序，例如 9 與 90，990 比 909 大，因此 9 要先放。比較器可理解為比較無限重複字串 aaaa… 與 bbbb…，具有排序所需的一致性；ab=ba 時兩種順序輸出完全相同。輸入與答案都以字串保存，不受整數位數限制；N=0 結束。",
    ],
    complexity: "時間 O(N log N·L)，空間 O(NL)，L 為單數字最大位數。",
    pitfall: "比較必須是 a+b 與 b+a；不能只比較第一位或數值大小。",
    traceLabel: "示意：9、90、56",
    trace: [
      {
        title: "比較 9、90",
        description: "990>909，所以 9 應在 90 前。",
        cells: ["990", "909"],
        active: [0],
        variables: [["較佳順序", "9,90"]],
      },
      {
        title: "比較 90、56",
        description: "9056>5690，所以 90 在 56 前。",
        cells: ["9056", "5690"],
        active: [0],
        variables: [["排序", "9,90,56"]],
      },
      {
        title: "串接",
        description: "依序相接得到 99056，不放空白。",
        cells: ["9", "90", "56", "99056"],
        active: [3],
        variables: [["答案位數", "5"]],
      },
    ],
    cpp: String.raw`#include <algorithm>
#include <iostream>
#include <string>
#include <vector>
using namespace std;
int main() {
    int n;
    while (cin >> n && n) {
        vector<string> a(n);
        for (auto &s : a)
            cin >> s;
        sort(a.begin(), a.end(), [](const string &x, const string &y) { return x + y > y + x; });
        for (auto &s : a)
            cout << s;
        cout << '\n';
    }
}`,
    python: String.raw`import sys
from functools import cmp_to_key


def compare(a, b):
    return (a + b < b + a) - (a + b > b + a)


it = iter(sys.stdin.read().split())
for token in it:
    n = int(token)
    if n == 0:
        break
    numbers = [next(it) for _ in range(n)]
    numbers.sort(key=cmp_to_key(compare))
    print(''.join(numbers))
`,
  }),
];
