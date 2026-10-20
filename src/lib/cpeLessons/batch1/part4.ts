import { defineCpeLesson } from "@/lib/cpeLessonBuilder";

export const lessons = [
  defineCpeLesson("a508", {
    topic: "graphs",
    level: "hard",
    concept: "二分圖下限度數的切割界",
    goal: "直接計算滿足列欄下限所需的最少1數量。",
    explanation: [
      "把亮燈視為列與欄之間的一條邊，每對列欄最多一條。選t個列集合R，這些列至少需要Σr_i盞燈；欄j在R內最多接t盞，故在R外至少還要max(0,c_j−t)盞。因此總數至少為Σr_i+Σmax(0,c_j−t)。固定t時選下限最大的t列，得到最強下界。",
      "這些界也充分：將每列至少r_i、每欄至少c_j、列欄邊容量1的問題建為有下限的二分圖流，整數流的切割可行條件正是上述各列集合的界；所以所有t=0到M的最大值就是最小亮燈數。實作將列下限遞減排序，建立欄下限頻率的後綴cnt[t]=欄下限≥t的欄數。從t−1移到t，額外項Σmax(0,c_j−t)恰減cnt[t]，不必每次掃整排欄。",
    ],
    complexity: "時間 O(M log M+M+N)，空間 O(M+N)。",
    pitfall: "只取max(列總和,欄總和)可能不夠：2×2的[2,0]與[0,2]需要3盞。",
    traceLabel: "示意：2×2，列[2,0]、欄[0,2]",
    trace: [
      {
        title: "t=0",
        description: "沒選列，欄需求總和為2，給出下界2。",
        cells: ["列前綴0", "欄外需求2"],
        active: [1],
        variables: [
          ["t", "0"],
          ["best", "2"],
        ],
      },
      {
        title: "t=1",
        description: "選需求2的列，欄2在它外面仍需1盞，下界2+1=3。",
        cells: ["列前綴2", "欄外需求1"],
        active: [0, 1],
        variables: [
          ["t", "1"],
          ["best", "3"],
        ],
      },
      {
        title: "t=2",
        description: "下界2，最大值仍3；矩陣11/01確實可行。",
        cells: ["1", "1", "0", "1"],
        active: [0, 1, 3],
        variables: [
          ["t", "2"],
          ["最少亮燈", "3"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <algorithm>
#include <functional>
using namespace std;
int main() {
    int T;
    cin >> T;
    while (T--) {
        int m, n;
        cin >> m >> n;
        vector<int> rows(m), suffix(m + 2);
        for (int &r : rows)
            cin >> r;
        long long extra = 0;
        for (int j = 0, c; j < n; ++j) {
            cin >> c;
            ++suffix[c];
            extra += c;
        }
        for (int t = m; t >= 1; --t)
            suffix[t] += suffix[t + 1];
        sort(rows.begin(), rows.end(), greater<int>());
        long long prefix = 0, answer = extra;
        for (int t = 1; t <= m; ++t) {
            prefix += rows[t - 1];
            extra -= suffix[t];
            answer = max(answer, prefix + extra);
        }
        cout << answer << '\n';
    }
}`,
    python: String.raw`import sys

data = iter(map(int, sys.stdin.buffer.read().split()))
for _ in range(next(data)):
    m, n = next(data), next(data)
    rows = sorted((next(data) for _ in range(m)), reverse=True)
    suffix = [0] * (m + 2)
    extra = 0
    for _ in range(n):
        c = next(data)
        suffix[c] += 1
        extra += c
    for t in range(m, 0, -1):
        suffix[t] += suffix[t + 1]
    answer = extra
    prefix = 0
    for t, r in enumerate(rows, 1):
        prefix += r
        extra -= suffix[t]
        answer = max(answer, prefix + extra)
    print(answer)
`,
  }),
  defineCpeLesson("a509", {
    topic: "trees",
    level: "hard",
    concept: "加權距離總和的樹形換根",
    goal: "一次求出每個車站當住處的全年旅行成本。",
    explanation: [
      "把造訪次數當作車站權重f，單程成本D(u)=Σf[v]·dist(u,v)，最終再乘2。先以1為根，用迭代走訪記下父子順序與到根距離，直接求D(1)，再倒序累積每棵子樹權重sub。總權重記為F。",
      "住處沿長度w的邊由父u移到子v，子樹內每次造訪近w，子樹外每次遠w，所以D(v)=D(u)+w(F−2sub[v])。按父先子的順序計算全部成本，找出最小值並遞增輸出所有並列站點。m=0時F=0，每站成本都是0，須全部列出。使用64位元成本，迭代避免深鏈的遞迴限制。",
    ],
    complexity: "每筆時間 O(n+m)，空間 O(n)。",
    pitfall:
      "每次都往返，最後成本要乘2；不可只找單一最佳站，可能整段路徑都並列。",
    traceLabel: "示意：1—17—2，造訪次數5與10",
    trace: [
      {
        title: "以1為根",
        description: "單程成本只有到2的10次，各17秒，D(1)=170。",
        cells: ["1:f=5", "邊17", "2:f=10"],
        active: [0],
        variables: [
          ["F", "15"],
          ["D(1)", "170"],
        ],
      },
      {
        title: "換根到2",
        description: "sub[2]=10，變化17×(15−20)=−85。",
        cells: ["170", "−85", "D(2)=85"],
        active: [2],
        variables: [
          ["sub[2]", "10"],
          ["D(2)", "85"],
        ],
      },
      {
        title: "轉成往返",
        description: "站2最佳，全年往返成本85×2=170。",
        cells: ["站1:340", "站2:170"],
        active: [1],
        variables: [
          ["最小往返", "170"],
          ["最佳站", "2"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <utility>
#include <algorithm>
using namespace std;
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int T;
    cin >> T;
    while (T--) {
        int n;
        cin >> n;
        vector<vector<pair<int, int>>> g(n + 1);
        for (int i = 1, a, b, w; i < n; ++i) {
            cin >> a >> b >> w;
            g[a].push_back({b, w});
            g[b].push_back({a, w});
        }
        int m;
        cin >> m;
        vector<long long> freq(n + 1), sub(n + 1), distance(n + 1), cost(n + 1);
        for (int i = 0, a, f; i < m; ++i) {
            cin >> a >> f;
            freq[a] = f;
        }
        vector<int> parent(n + 1), edge(n + 1), order{1};
        parent[1] = -1;
        for (size_t i = 0; i < order.size(); ++i) {
            int u = order[i];
            for (auto [v, w] : g[u])
                if (v != parent[u]) {
                    parent[v] = u;
                    edge[v] = w;
                    distance[v] = distance[u] + w;
                    order.push_back(v);
                }
        }
        long long total = 0;
        for (int u = 1; u <= n; ++u) {
            total += freq[u];
            cost[1] += freq[u] * distance[u];
            sub[u] = freq[u];
        }
        for (int i = n - 1; i > 0; --i) {
            int u = order[i];
            sub[parent[u]] += sub[u];
        }
        for (int i = 1; i < n; ++i) {
            int v = order[i];
            cost[v] = cost[parent[v]] + edge[v] * (total - 2 * sub[v]);
        }
        long long best = *min_element(cost.begin() + 1, cost.end());
        cout << 2 * best << '\n';
        bool first = true;
        for (int u = 1; u <= n; ++u)
            if (cost[u] == best) {
                if (!first)
                    cout << ' ';
                cout << u;
                first = false;
            }
        cout << '\n';
    }
}`,
    python: String.raw`import sys

data = iter(map(int, sys.stdin.buffer.read().split()))
for _ in range(next(data)):
    n = next(data)
    g = [[] for _ in range(n + 1)]
    for _ in range(n - 1):
        a, b, w = next(data), next(data), next(data)
        g[a].append((b, w))
        g[b].append((a, w))
    freq = [0] * (n + 1)
    for _ in range(next(data)):
        a, f = next(data), next(data)
        freq[a] = f
    parent, edge, distance = [0] * (n + 1), [0] * (n + 1), [0] * (n + 1)
    order = [1]
    parent[1] = -1
    for u in order:
        for v, w in g[u]:
            if v != parent[u]:
                parent[v], edge[v], distance[v] = u, w, distance[u] + w
                order.append(v)
    sub = freq[:]
    for u in reversed(order[1:]):
        sub[parent[u]] += sub[u]
    total = sum(freq)
    cost = [0] * (n + 1)
    cost[1] = sum(freq[u] * distance[u] for u in range(1, n + 1))
    for v in order[1:]:
        cost[v] = cost[parent[v]] + edge[v] * (total - 2 * sub[v])
    best = min(cost[1:])
    print(2 * best)
    print(*(u for u in range(1, n + 1) if cost[u] == best))
`,
  }),
  defineCpeLesson("a510", {
    topic: "dp",
    level: "medium",
    concept: "只向上的棋盤路徑DP",
    goal: "依列高低的拓樸順序累加普通步與跳躍路徑。",
    explanation: [
      "設dp[r][c]為從白棋起點到此格的路徑數，起點為1。每次往左上、右上檢查：相鄰格若不是黑棋，就走一格；若是黑棋，只能沿同方向跳兩格，而且落點須在棋盤內且不是黑棋。兩種情況互斥，不能在空格上也任意跳躍。",
      "每一步都讓列號減少1或2，因此從下往上處理各列時，所有到達該格的路徑都已累積完成，不會形成環。黑棋不移動也不吃掉，原始棋盤保持不變。每次加法對1000007取模，最後加總最上列；白棋原本在頂列時，空路徑也算1。",
    ],
    complexity: "每筆時間 O(N²)，空間 O(N²)。",
    pitfall:
      "模數是1000007，不是1000000007；跳過一顆黑棋後落點仍需檢查空格與邊界。",
    traceLabel: "示意：3×3空棋盤，W在(3,2)",
    trace: [
      {
        title: "起點",
        description: "dp[3][2]=1。",
        cells: ["頂0,0,0", "中0,0,0", "底0,1,0"],
        active: [2],
        variables: [["起始路徑", "1"]],
      },
      {
        title: "向上走一步",
        description: "可到(2,1)、(2,3)，各1條。",
        cells: ["頂0,0,0", "中1,0,1", "底0,1,0"],
        active: [1],
        variables: [["中列總數", "2"]],
      },
      {
        title: "到頂列",
        description: "兩個中列格都只能到(1,2)，累加成2。",
        cells: ["頂0,2,0", "中1,0,1", "底0,1,0"],
        active: [0],
        variables: [["答案", "2"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <string>
using namespace std;
int main() {
    const int MOD = 1000007;
    int T;
    cin >> T;
    for (int tc = 1; tc <= T; ++tc) {
        int n;
        cin >> n;
        vector<string> g(n);
        vector<vector<int>> dp(n, vector<int>(n));
        for (int r = 0; r < n; ++r) {
            cin >> g[r];
            for (int c = 0; c < n; ++c)
                if (g[r][c] == 'W')
                    dp[r][c] = 1;
        }
        for (int r = n - 1; r > 0; --r)
            for (int c = 0; c < n; ++c)
                if (dp[r][c])
                    for (int d : {-1, 1}) {
                        int y = r - 1, x = c + d;
                        if (x < 0 || x >= n)
                            continue;
                        if (g[y][x] == 'B') {
                            --y;
                            x += d;
                        }
                        if (y >= 0 && x >= 0 && x < n && g[y][x] != 'B')
                            dp[y][x] = (dp[y][x] + dp[r][c]) % MOD;
                    }
        int answer = 0;
        for (int value : dp[0])
            answer = (answer + value) % MOD;
        cout << "Case " << tc << ": " << answer << '\n';
    }
}`,
    python: String.raw`import sys

MOD = 1000007
data = iter(sys.stdin.read().split())
for tc in range(1, int(next(data)) + 1):
    n = int(next(data))
    grid = [next(data) for _ in range(n)]
    dp = [[0] * n for _ in range(n)]
    for r in range(n):
        for c in range(n):
            if grid[r][c] == 'W':
                dp[r][c] = 1
    for r in range(n - 1, 0, -1):
        for c in range(n):
            if not dp[r][c]:
                continue
            for d in (-1, 1):
                y, x = r - 1, c + d
                if not 0 <= x < n:
                    continue
                if grid[y][x] == 'B':
                    y, x = y - 1, x + d
                if y >= 0 and 0 <= x < n and grid[y][x] != 'B':
                    dp[y][x] = (dp[y][x] + dp[r][c]) % MOD
    print(f'Case {tc}: {sum(dp[0]) % MOD}')
`,
  }),
  defineCpeLesson("a511", {
    topic: "dp",
    level: "hard",
    concept: "加權區間排程與二分前驅",
    goal: "在互不重疊廣告中選出最大總收益。",
    explanation: [
      "將占用A到A+B−1的廣告改寫成半開區間[A,A+B)，按結束位置排序。dp[i]表示前i份廣告的最大收益。對第i份，要嘛不選它而沿用dp[i−1]，要嘛選它並接上所有結束位置≤它起點的前綴最佳解。",
      "用二分在先前的結束位置中找出相容廣告數j，轉移dp[i]=max(dp[i−1],dp[j]+C)。半開表示讓一份剛好在另一份結束後開始的廣告可以相接。收益不同時不能用最早結束的單純貪心；排序加二分能處理3萬份訂單，輸出Case k: P。",
    ],
    complexity: "每筆時間 O(N log N)，空間 O(N)。",
    pitfall:
      "結束點是A+B，查詢用≤A；若用A+B−1卻仍沿用同個不等式，會錯判相鄰或重疊。",
    traceLabel: "示意：廣告[1,3)收益4、[2,5)收益7、[3,6)收益5",
    trace: [
      {
        title: "第一份",
        description: "選[1,3)，dp[1]=4。",
        cells: ["end3:4", "end5:待算", "end6:待算"],
        active: [0],
        variables: [
          ["j", "0"],
          ["dp", "4"],
        ],
      },
      {
        title: "第二份",
        description: "起點2無相容前份，max(4,7)=7。",
        cells: ["end3:4", "end5:7", "end6:待算"],
        active: [1],
        variables: [
          ["j", "0"],
          ["dp", "7"],
        ],
      },
      {
        title: "第三份",
        description: "起點3可接第一份，4+5=9勝過7。",
        cells: ["end3:4", "end5:7", "end6:9"],
        active: [0, 2],
        variables: [
          ["j", "1"],
          ["答案", "9"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <array>
#include <algorithm>
using namespace std;
int main() {
    int T;
    cin >> T;
    for (int tc = 1; tc <= T; ++tc) {
        int n;
        cin >> n;
        vector<array<int, 3>> jobs(n);
        for (auto &job : jobs) {
            int a, b, c;
            cin >> a >> b >> c;
            job = {a + b, a, c};
        }
        sort(jobs.begin(), jobs.end());
        vector<int> ends(n);
        for (int i = 0; i < n; ++i)
            ends[i] = jobs[i][0];
        vector<long long> dp(n + 1);
        for (int i = 0; i < n; ++i) {
            int j = (int)(upper_bound(ends.begin(), ends.begin() + i, jobs[i][1]) - ends.begin());
            dp[i + 1] = max(dp[i], dp[j] + jobs[i][2]);
        }
        cout << "Case " << tc << ": " << dp[n] << '\n';
    }
}`,
    python: String.raw`import sys
from bisect import bisect_right

data = iter(map(int, sys.stdin.buffer.read().split()))
for tc in range(1, next(data) + 1):
    n = next(data)
    jobs = []
    for _ in range(n):
        a, b, c = next(data), next(data), next(data)
        jobs.append((a + b, a, c))
    jobs.sort()
    ends = [job[0] for job in jobs]
    dp = [0] * (n + 1)
    for i, (end, start, value) in enumerate(jobs):
        j = bisect_right(ends, start, 0, i)
        dp[i + 1] = max(dp[i], dp[j] + value)
    print(f'Case {tc}: {dp[n]}')
`,
  }),
  defineCpeLesson("a512", {
    topic: "number-theory",
    level: "easy",
    concept: "因數和篩與反向查表",
    goal: "先算每個整數的因數和，再保留對應總和的最大整數。",
    explanation: [
      "正因數包含n本身，因此sigma(n)≥n；若要找sigma(n)=S≤1000，只需考慮n≤1000。對每個d，把d加到它所有倍數的因數和上，便能一次算好sigma(1)到sigma(1000)。",
      "接著依n遞增掃描，若sigma(n)≤1000，就令answer[sigma(n)]=n。後面的較大n覆蓋前面較小n，自然保留最大答案；未被填過的S維持−1。輸入0結束，案例標號從1開始，S=1時答案是1。",
    ],
    complexity: "預處理 O(L log L)，空間 O(L)，L=1000；每筆查詢 O(1)。",
    pitfall: "要找最大的原整數，不是最多因數的整數；不存在輸出−1。",
    traceLabel: "示意：查詢S=12",
    trace: [
      {
        title: "檢查n=6",
        description: "因數1、2、3、6總和12，暫存答案6。",
        cells: ["1", "2", "3", "6"],
        active: [0, 1, 2, 3],
        variables: [
          ["sigma(6)", "12"],
          ["answer[12]", "6"],
        ],
      },
      {
        title: "檢查n=11",
        description: "11為質數，因數和1+11=12，覆蓋為11。",
        cells: ["1", "11"],
        active: [0, 1],
        variables: [
          ["sigma(11)", "12"],
          ["answer[12]", "11"],
        ],
      },
      {
        title: "查表輸出",
        description: "n>12不可能有因數和12，最終最大解11。",
        cells: ["S=12", "答案11"],
        active: [1],
        variables: [["最大解", "11"]],
      },
    ],
    cpp: String.raw`#include <iostream>
using namespace std;
int main() {
    int sigma[1001] = {}, answer[1001];
    for (int &x : answer)
        x = -1;
    for (int d = 1; d <= 1000; ++d)
        for (int n = d; n <= 1000; n += d)
            sigma[n] += d;
    for (int n = 1; n <= 1000; ++n)
        if (sigma[n] <= 1000)
            answer[sigma[n]] = n;
    int s, tc = 0;
    while (cin >> s && s)
        cout << "Case " << ++tc << ": " << answer[s] << '\n';
}`,
    python: String.raw`import sys

sigma = [0] * 1001
answer = [-1] * 1001
for d in range(1, 1001):
    for n in range(d, 1001, d):
        sigma[n] += d
for n in range(1, 1001):
    if sigma[n] <= 1000:
        answer[sigma[n]] = n
tc = 0
for s in map(int, sys.stdin.buffer.read().split()):
    if s == 0:
        break
    tc += 1
    print(f'Case {tc}: {answer[s]}')
`,
  }),
  defineCpeLesson("a513", {
    topic: "math",
    level: "hard",
    concept: "份量斷點枚舉與精確有理數",
    goal: "在實數份量中找最小成本，最後化成最簡分數。",
    explanation: [
      "給定份量S，學生i最少領ceil(yi/S)份，必須≤3。領餐次數在相鄰斷點之間固定，總成本a·(S×總份數−總需求)+b×總份數便隨S嚴格增加。因此最優解必在某個yi/k，k=1、2、3；全員可行的最小S=max(yi)/3也在這些候選中。",
      "候選寫成p/q，學生份數可用整數ceil(yi·q/p)計算，總成本的分子是a·(份數總和×p−需求總和×q)+b·份數總和×q，分母q。用交叉相乘比較候選，最後除以gcd約分。需求僅1到100，先統計頻率後每候選只掃100種需求，避免對1000名學生重複計算。n=0停止，整數答案不印/1。",
    ],
    complexity: "每組 O(n+U²) 時間，空間 O(U)，U≤100，候選至多3U個。",
    pitfall: "S不限整數，不能只試1到100；用浮點ceil會在yi恰為kS時多算一份。",
    traceLabel: "示意：需求6、3，a=2、b=3",
    trace: [
      {
        title: "候選S=2",
        description: "領3與2份，總10單位浪費1，成本2×1+3×5=17。",
        cells: ["6:3份", "3:2份"],
        active: [0, 1],
        variables: [
          ["總份數", "5"],
          ["成本", "17"],
        ],
      },
      {
        title: "候選S=3",
        description: "領2與1份，零浪費，成本9。",
        cells: ["6:2份", "3:1份"],
        active: [0, 1],
        variables: [
          ["總份數", "3"],
          ["成本", "9"],
        ],
      },
      {
        title: "候選S=6",
        description: "各領1份，浪費3，成本12；最小仍為9。",
        cells: ["6:1份", "3:1份"],
        active: [0, 1],
        variables: [
          ["總份數", "2"],
          ["最佳成本", "9"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <numeric>
#include <algorithm>
using namespace std;
int main() {
    int n;
    while (cin >> n && n) {
        long long a, b;
        cin >> a >> b;
        int freq[101] = {}, maximum = 0;
        long long demand = 0;
        for (int i = 0, y; i < n; ++i) {
            cin >> y;
            ++freq[y];
            demand += y;
            maximum = max(maximum, y);
        }
        long long bestNum = -1, bestDen = 1;
        for (int p = 1; p <= 100; ++p)
            if (freq[p])
                for (int q = 1; q <= 3; ++q) {
                    if (3 * p < maximum * q)
                        continue;
                    long long servings = 0;
                    for (int y = 1; y <= 100; ++y)
                        servings += freq[y] * ((y * q + p - 1) / p);
                    long long num = a * (servings * p - demand * q) + b * servings * q;
                    if (bestNum < 0 || num * bestDen < bestNum * q) {
                        bestNum = num;
                        bestDen = q;
                    }
                }
        long long g = gcd(bestNum, bestDen);
        bestNum /= g;
        bestDen /= g;
        cout << bestNum;
        if (bestDen != 1)
            cout << " / " << bestDen;
        cout << '\n';
    }
}`,
    python: String.raw`import sys
from math import gcd
from collections import Counter

data = iter(map(int, sys.stdin.buffer.read().split()))
for n in data:
    if n == 0:
        break
    a, b = next(data), next(data)
    freq = Counter(next(data) for _ in range(n))
    maximum = max(freq)
    demand = sum(y * f for y, f in freq.items())
    best_num, best_den = None, 1
    for p in freq:
        for q in (1, 2, 3):
            if 3 * p < maximum * q:
                continue
            servings = sum(f * ((y * q + p - 1) // p) for y, f in freq.items())
            num = a * (servings * p - demand * q) + b * servings * q
            if best_num is None or num * best_den < best_num * q:
                best_num, best_den = num, q
    g = gcd(best_num, best_den)
    best_num //= g
    best_den //= g
    print(best_num if best_den == 1 else f'{best_num} / {best_den}')
`,
  }),
  defineCpeLesson("a514", {
    topic: "dp",
    level: "hard",
    concept: "相鄰差1的數字路徑與端點覆蓋",
    goal: "利用已訪數字必連續的性質，把集合狀態壓成兩個旗標。",
    explanation: [
      "相鄰位數只能差1，所以已使用過的數字一定形成連續區間。因而『0到N−1都出現』等價於『0與N−1都曾出現』，不必記錄2^N種完整集合。設dp[d][mask]為目前長度、末位d、兩端點覆蓋旗標mask的方案數，mask的兩位分別代表0與N−1。",
      "初始只放最高位1到N−1，避免前導0；每次接d−1或d+1，只要還在進位範圍內，就更新末位與端點旗標。對長度1到M，每次把mask=3的方案加到答案，因為題目是位數不超過M，而不是恰好M。M=0回傳0，所有計數對1000000007取模。",
    ],
    complexity: "每筆時間 O(MN)，空間 O(N)，旗標只有4種。",
    pitfall:
      "末位為0合法，只有最高位不能為0；若只輸出最後一層，會漏掉較短的beautiful numbers。",
    traceLabel: "示意：二進位N=2、M=4",
    trace: [
      {
        title: "長度1",
        description: "只能是1，尚未看過0，不計答案。",
        cells: ["1:mask2"],
        active: [0],
        variables: [
          ["長度", "1"],
          ["累積答案", "0"],
        ],
      },
      {
        title: "長度2與3",
        description: "依序只有10、101，兩者均覆蓋0與1。",
        cells: ["10:mask3", "101:mask3"],
        active: [0, 1],
        variables: [
          ["長度", "3"],
          ["累積答案", "2"],
        ],
      },
      {
        title: "長度4",
        description: "再加1010，共3個不超過4位的數。",
        cells: ["10", "101", "1010"],
        active: [2],
        variables: [
          ["長度", "4"],
          ["答案", "3"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <array>
using namespace std;
int main() {
    const long long MOD = 1000000007;
    int T;
    cin >> T;
    while (T--) {
        int n, m;
        cin >> n >> m;
        vector<array<long long, 4>> dp(n, array<long long, 4>{});
        for (int d = 1; d < n; ++d)
            dp[d][d == n - 1 ? 2 : 0] = 1;
        long long answer = 0;
        for (int len = 1; len <= m; ++len) {
            for (int d = 0; d < n; ++d)
                answer = (answer + dp[d][3]) % MOD;
            vector<array<long long, 4>> next(n, array<long long, 4>{});
            for (int d = 0; d < n; ++d)
                for (int mask = 0; mask < 4; ++mask)
                    for (int v : {d - 1, d + 1})
                        if (v >= 0 && v < n) {
                            int mark = mask | (v == 0 ? 1 : 0) | (v == n - 1 ? 2 : 0);
                            next[v][mark] = (next[v][mark] + dp[d][mask]) % MOD;
                        }
            dp.swap(next);
        }
        cout << answer << '\n';
    }
}`,
    python: String.raw`import sys

MOD = 1000000007
data = iter(map(int, sys.stdin.buffer.read().split()))
for _ in range(next(data)):
    n, m = next(data), next(data)
    dp = [[0] * 4 for _ in range(n)]
    for d in range(1, n):
        dp[d][2 if d == n - 1 else 0] = 1
    answer = 0
    for length in range(1, m + 1):
        answer = (answer + sum(row[3] for row in dp)) % MOD
        nxt = [[0] * 4 for _ in range(n)]
        for d in range(n):
            for mask in range(4):
                for v in (d - 1, d + 1):
                    if 0 <= v < n:
                        mark = mask | (1 if v == 0 else 0) | (2 if v == n - 1 else 0)
                        nxt[v][mark] = (nxt[v][mark] + dp[d][mask]) % MOD
        dp = nxt
    print(answer)
`,
  }),
  defineCpeLesson("a515", {
    topic: "simulation",
    level: "easy",
    concept: "矩陣操作的依序組合",
    goal: "清楚區分列、欄、數值與轉置操作。",
    explanation: [
      "N小於10，直接以整數矩陣逐條執行即可。row交換兩個橫列，col對每列交換指定兩格；inc與dec分別加1或加9後取模10；transpose把a[r][c]改成舊a[c][r]，可用新矩陣，或只交換主對角線上方的成對格。",
      "指令不可重排，因為轉置會改變後續row與col指向的位置。輸入列欄從1開始，交換前轉成0起算。每筆輸出Case #k且沒有冒號，矩陣每列不插空白，最後都再印一個空白行，包含最後一筆。",
    ],
    complexity: "每筆時間 O(MN²)，空間 O(N²)。",
    pitfall: "dec的0必須變9；轉置若雙重迴圈交換所有格，會交換兩次而回到原狀。",
    traceLabel: "示意：矩陣12/34，transpose後inc",
    trace: [
      {
        title: "初始",
        description: "第一列12、第二列34。",
        cells: ["1", "2", "3", "4"],
        active: [],
        variables: [
          ["N", "2"],
          ["已執行", "0"],
        ],
      },
      {
        title: "轉置",
        description: "交換右上2與左下3，得到13/24。",
        cells: ["1", "3", "2", "4"],
        active: [1, 2],
        variables: [["已執行", "1"]],
      },
      {
        title: "每格加1",
        description: "得到24/35。",
        cells: ["2", "4", "3", "5"],
        active: [0, 1, 2, 3],
        variables: [["已執行", "2"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <string>
#include <utility>
using namespace std;
int main() {
    int T;
    cin >> T;
    for (int tc = 1; tc <= T; ++tc) {
        int n;
        cin >> n;
        vector<vector<int>> a(n, vector<int>(n));
        for (auto &row : a) {
            string s;
            cin >> s;
            for (int c = 0; c < n; ++c)
                row[c] = s[c] - '0';
        }
        int m;
        cin >> m;
        while (m--) {
            string op;
            cin >> op;
            if (op == "row" || op == "col") {
                int x, y;
                cin >> x >> y;
                --x;
                --y;
                if (op == "row")
                    swap(a[x], a[y]);
                else
                    for (auto &row : a)
                        swap(row[x], row[y]);
            } else if (op == "transpose") {
                for (int r = 0; r < n; ++r)
                    for (int c = r + 1; c < n; ++c)
                        swap(a[r][c], a[c][r]);
            } else
                for (auto &row : a)
                    for (int &x : row)
                        x = (x + (op == "inc" ? 1 : 9)) % 10;
        }
        cout << "Case #" << tc << '\n';
        for (const auto &row : a) {
            for (int x : row)
                cout << x;
            cout << '\n';
        }
        cout << '\n';
    }
}`,
    python: String.raw`import sys

data = iter(sys.stdin.read().split())
for tc in range(1, int(next(data)) + 1):
    n = int(next(data))
    a = [list(map(int, next(data))) for _ in range(n)]
    for _ in range(int(next(data))):
        op = next(data)
        if op in ('row', 'col'):
            x, y = int(next(data)) - 1, int(next(data)) - 1
            if op == 'row':
                a[x], a[y] = a[y], a[x]
            else:
                for row in a:
                    row[x], row[y] = row[y], row[x]
        elif op == 'transpose':
            a = [list(row) for row in zip(*a)]
        else:
            delta = 1 if op == 'inc' else -1
            a = [[(x + delta) % 10 for x in row] for row in a]
    print(f'Case #{tc}')
    for row in a:
        print(''.join(map(str, row)))
    print()
`,
  }),
  defineCpeLesson("a516", {
    topic: "sorting",
    level: "hard",
    concept: "保留較小總和的硬幣種類貪心",
    goal: "選出提款時不會被更大面額取代的最多種類。",
    explanation: [
      "設目前挑選的小面額總和為sum。掃到非最大面額C[i]時，只有sum+C[i]<C[i+1]才收下它；否則跳過。最後最大面額一定收。這樣選中任一面額時，比它更小的已選金額都不足以觸發下一面額，提款選中面額的總和時，銀行會從大到小恰好給出這些面額。",
      "為何可以貪心：在同樣已選種類數下，較小總和只會讓以後更容易符合嚴格不等式；若加上當前面額已跨到下一面額，保留先前較小面額比用當前較大面額替換更有利。因而每次能選就選、否則略過，不減少未來可達的種類數。n=1時直接是1，sum用64位元避免加總溢位。",
    ],
    complexity: "每筆時間 O(n)，空間 O(n)。",
    pitfall:
      "目標是不同面額種類，不是硬幣枚數；條件必須嚴格小於，等於時銀行會直接給下一面額。",
    traceLabel: "示意：面額1、3、6、8、15、20",
    trace: [
      {
        title: "選1與3",
        description: "1<3，1+3=4<6，兩者都可收。",
        cells: ["1✓", "3✓", "6", "8", "15", "20"],
        active: [0, 1],
        variables: [
          ["sum", "4"],
          ["種類數", "2"],
        ],
      },
      {
        title: "略過6、收8",
        description: "4+6=10≥8不收6；4+8=12<15可收8。",
        cells: ["1✓", "3✓", "6×", "8✓", "15", "20"],
        active: [2, 3],
        variables: [
          ["sum", "12"],
          ["種類數", "3"],
        ],
      },
      {
        title: "略過15、收20",
        description:
          "12+15≥20，不收15；最大面額20必收，提款32可得20、8、3、1。",
        cells: ["20", "8", "3", "1"],
        active: [0, 1, 2, 3],
        variables: [
          ["提款額", "32"],
          ["答案", "4"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
using namespace std;
int main() {
    int T;
    cin >> T;
    while (T--) {
        int n;
        cin >> n;
        vector<long long> c(n);
        for (auto &x : c)
            cin >> x;
        long long sum = 0;
        int answer = 1;
        for (int i = 0; i + 1 < n; ++i)
            if (sum + c[i] < c[i + 1]) {
                sum += c[i];
                ++answer;
            }
        cout << answer << '\n';
    }
}`,
    python: String.raw`import sys

data = iter(map(int, sys.stdin.buffer.read().split()))
for _ in range(next(data)):
    n = next(data)
    coins = [next(data) for _ in range(n)]
    total = 0
    answer = 1
    for i in range(n - 1):
        if total + coins[i] < coins[i + 1]:
            total += coins[i]
            answer += 1
    print(answer)
`,
  }),
  defineCpeLesson("a517", {
    topic: "strings",
    level: "easy",
    concept: "單字長度篩選與遞增字元位置",
    goal: "不足長度的字跳過，但不消耗下一個取字位置。",
    explanation: [
      "每行把下一個要取的位置設為0起算的k=0。依序掃描單字，只有len(word)>k才取word[k]並讓k加1；長度不足則完全略過，k維持不變。因此輸出每增加一個字母，下一次才改取更後面的位置。",
      "換行代表一個解碼單字完成，所以k必須每行重設。輸入的空行分隔訊息，不是待解碼的普通文字行；保留英文字母大小寫，單字間多個空白可以split處理。每組印Case #k:，組與組之間一空行，最後一組可直接到EOF。",
    ],
    complexity: "每則訊息時間 O(L)，額外空間 O(單行長度)，L為總字元數。",
    pitfall:
      "跳過短字時不能增加k；也不能把整則訊息當成一條不斷增加位置的長串。",
    traceLabel: "示意：First I give money to Teresa",
    trace: [
      {
        title: "取第一個字母",
        description: "First[0]=F，之後I太短，仍等待第2個字母。",
        cells: ["First→F", "I跳過", "give", "money", "to", "Teresa"],
        active: [0, 1],
        variables: [
          ["k", "1"],
          ["結果", "F"],
        ],
      },
      {
        title: "取第2與第3個字母",
        description: "give[1]=i，money[2]=n，to不足4字母。",
        cells: ["F", "give→i", "money→n", "to跳過", "Teresa"],
        active: [1, 2, 3],
        variables: [
          ["k", "3"],
          ["結果", "Fin"],
        ],
      },
      {
        title: "取第4個字母",
        description: "Teresa[3]=e，完成Fine。",
        cells: ["F", "i", "n", "e"],
        active: [3],
        variables: [
          ["k", "4"],
          ["結果", "Fine"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <string>
#include <sstream>
#include <limits>
using namespace std;
int main() {
    int T;
    cin >> T;
    cin.ignore(numeric_limits<streamsize>::max(), '\n');
    for (int tc = 1; tc <= T; ++tc) {
        if (tc > 1)
            cout << '\n';
        cout << "Case #" << tc << ":\n";
        string line;
        bool started = false;
        while (getline(cin, line)) {
            if (!line.empty() && line.back() == '\r')
                line.pop_back();
            if (line.empty()) {
                if (started)
                    break;
                else
                    continue;
            }
            started = true;
            istringstream in(line);
            string word, result;
            while (in >> word)
                if (word.size() > result.size())
                    result += word[result.size()];
            cout << result << '\n';
        }
    }
}`,
    python: String.raw`import sys

T = int(sys.stdin.readline())
for tc in range(1, T + 1):
    if tc > 1:
        print()
    print(f'Case #{tc}:')
    started = False
    for line in sys.stdin:
        line = line.rstrip('\r\n')
        if not line:
            if started:
                break
            continue
        started = True
        result = []
        for word in line.split():
            if len(word) > len(result):
                result.append(word[len(result)])
        print(''.join(result))
`,
  }),
  defineCpeLesson("a518", {
    topic: "sorting",
    level: "hard",
    concept: "大石複製與交錯兩條路徑",
    goal: "把往返轉成兩條單向路徑，求必需的最大跨兩格距離。",
    explanation: [
      "將回程反向看，問題等價於兩條從0到D的路徑，小石只能分給其中一條，大石可共用。把大石位置放兩次，小石放一次，兩岸0、D也各放兩次，得到非遞減位置列x。把奇偶索引交錯分給兩條路徑，每條相鄰跳躍就是x[i+2]−x[i]。",
      "答案是所有跨兩格距離的最大值。它也是下界：任何相鄰三個資源位置中，中間單次資源無法同時服務兩條路徑，因此至少一條須跨過它；若中間是可共用的大石，複製後的零距離位置已反映另一份容量，同樣由鄰近兩步距離涵蓋必要區間。交錯分配達到此下界，所以最優。N=0時直接跳D，輸出Case k: L。",
    ],
    complexity: "輸入已排序，每筆時間 O(N)，空間 O(N)。",
    pitfall: "不是只看相鄰石距；一顆小石無法去回都踩。大石與兩岸必須複製。",
    traceLabel: "示意：D=10，B-3、S-6",
    trace: [
      {
        title: "展開位置",
        description: "大石與兩岸複製，小石只留一份。",
        cells: ["0", "0", "3", "3", "6", "10", "10"],
        active: [0, 1, 2, 3, 5, 6],
        variables: [["展開長度", "7"]],
      },
      {
        title: "跨兩格距離",
        description: "依序為3、3、3、7、4，最大7。",
        cells: ["3", "3", "3", "7", "4"],
        active: [3],
        variables: [["下界", "7"]],
      },
      {
        title: "交錯分配",
        description: "去程0→3→6→10，回程10→3→0；小石6只用一次。",
        cells: ["去程最大4", "回程最大7"],
        active: [1],
        variables: [
          ["可達最大跳距", "7"],
          ["答案", "7"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
using namespace std;
int main() {
    int T;
    cin >> T;
    for (int tc = 1; tc <= T; ++tc) {
        int n, d;
        cin >> n >> d;
        vector<int> x{0, 0};
        for (int i = 0; i < n; ++i) {
            string stone;
            cin >> stone;
            int position = stoi(stone.substr(2));
            x.push_back(position);
            if (stone[0] == 'B')
                x.push_back(position);
        }
        x.push_back(d);
        x.push_back(d);
        int answer = 0;
        for (size_t i = 2; i < x.size(); ++i)
            answer = max(answer, x[i] - x[i - 2]);
        cout << "Case " << tc << ": " << answer << '\n';
    }
}`,
    python: String.raw`import sys

data = iter(sys.stdin.read().split())
for tc in range(1, int(next(data)) + 1):
    n, d = int(next(data)), int(next(data))
    x = [0, 0]
    for _ in range(n):
        stone = next(data)
        position = int(stone[2:])
        x.append(position)
        if stone[0] == 'B':
            x.append(position)
    x.extend((d, d))
    answer = max(x[i] - x[i - 2] for i in range(2, len(x)))
    print(f'Case {tc}: {answer}')
`,
  }),
  defineCpeLesson("a519", {
    topic: "search",
    level: "medium",
    concept: "枚舉92個八皇后解與位置差異",
    goal: "把最少移動問題轉成對所有合法目標的最小漢明距離。",
    explanation: [
      "每欄始終一個皇后，而且只能在原欄上下移，所以任何合法目標與輸入的差異欄數，就是到該目標所需的移動數。先回溯枚舉所有八皇后解：逐欄選列，若與前面任一皇后同列，或列差絕對值等於欄差，就剪枝。",
      "八欄填完即得到一個合法排列，總共92個，預先保存供所有測資共用。每筆對這些解計算八個位置中有多少不同，取最小值即可，原本已合法時為0。輸入沒有測試筆數，讀到EOF，每8個整數為一組，輸出Case k: M。",
    ],
    complexity: "預處理最多 O(8!·8²)，每筆 O(92×8)，空間 O(92×8)。",
    pitfall:
      "一次能直接移到任意另一列，成本是不同皇后的數量，不是上下移動距離。",
    traceLabel: "示意：輸入1,5,8,6,3,7,2,5，對照合法解1,5,8,6,3,7,2,4",
    trace: [
      {
        title: "比較前四欄",
        description: "1、5、8、6都與合法目標相同，不需移動。",
        cells: ["1=1", "5=5", "8=8", "6=6"],
        active: [0, 1, 2, 3],
        variables: [
          ["已比較欄數", "4"],
          ["移動數", "0"],
        ],
      },
      {
        title: "比較到第七欄",
        description: "3、7、2也都相同。",
        cells: ["3=3", "7=7", "2=2"],
        active: [0, 1, 2],
        variables: [
          ["已比較欄數", "7"],
          ["移動數", "0"],
        ],
      },
      {
        title: "最後一欄",
        description:
          "第8欄由5移到4即可。輸入兩皇后同列5，故不可能0次，最小為1。",
        cells: ["第8欄5→4", "合法目標"],
        active: [0],
        variables: [
          ["已比較欄數", "8"],
          ["最少移動", "1"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <array>
#include <cstdlib>
#include <algorithm>
using namespace std;
vector<array<int, 8>> solutions;
array<int, 8> board;
void generate(int col) {
    if (col == 8) {
        solutions.push_back(board);
        return;
    }
    for (int row = 1; row <= 8; ++row) {
        bool ok = true;
        for (int j = 0; j < col; ++j)
            if (board[j] == row || abs(board[j] - row) == col - j)
                ok = false;
        if (ok) {
            board[col] = row;
            generate(col + 1);
        }
    }
}
int main() {
    generate(0);
    array<int, 8> input;
    int tc = 0;
    while (cin >> input[0]) {
        for (int i = 1; i < 8; ++i)
            cin >> input[i];
        int answer = 8;
        for (const auto &target : solutions) {
            int cost = 0;
            for (int i = 0; i < 8; ++i)
                cost += (input[i] != target[i]);
            answer = min(answer, cost);
        }
        cout << "Case " << ++tc << ": " << answer << '\n';
    }
}`,
    python: String.raw`import sys

solutions = []


def generate(rows):
    col = len(rows)
    if col == 8:
        solutions.append(tuple(rows))
        return
    for row in range(1, 9):
        if all(row != r and abs(row - r) != col - j for j, r in enumerate(rows)):
            generate(rows + [row])


generate([])
data = list(map(int, sys.stdin.buffer.read().split()))
for i in range(0, len(data), 8):
    board = data[i : i + 8]
    answer = min(sum(x != y for x, y in zip(board, target)) for target in solutions)
    print(f'Case {i // 8 + 1}: {answer}')
`,
  }),
  defineCpeLesson("a520", {
    topic: "sorting",
    level: "medium",
    concept: "街道切割的前綴流量守恆",
    goal: "把最小搬運成本化成每條相鄰邊的必要流量絕對值。",
    explanation: [
      "在第i戶與第i+1戶之間切開街道，左邊的總需求prefix=a1+…+ai必須跨過這條邊補足。無論怎麼配對買家與賣家，至少有|prefix|瓶酒經過這裡，每瓶每邊成本1，故所有切線的絕對前綴和是下界。",
      "從左到右把目前多餘或不足的酒量交給下一戶，恰好讓每條邊只承擔這個必要流量，所以下界可達。掃描時prefix加上當前需求，answer加|prefix|；最後總和為0，加上它也不改答案。n達10萬，成本可能超過32位元，必須用64位元，n=0結束。",
    ],
    complexity: "每筆時間 O(n)，額外空間 O(1)（Python輸入緩衝除外）。",
    pitfall: "不能只加每戶需求絕對值；工作量取決於酒跨越了幾條街道邊。",
    traceLabel: "示意：5、−4、1、−3、1",
    trace: [
      {
        title: "前兩條邊",
        description: "前綴5、1，必要流量分別5、1。",
        cells: ["5", "1", "待算", "待算"],
        active: [0, 1],
        variables: [
          ["prefix", "1"],
          ["work", "6"],
        ],
      },
      {
        title: "第三條邊",
        description: "再加1得到前綴2，成本累積8。",
        cells: ["5", "1", "2", "待算"],
        active: [2],
        variables: [
          ["prefix", "2"],
          ["work", "8"],
        ],
      },
      {
        title: "第四條邊",
        description: "再加−3得−1，絕對流量1，總成本9；最後加1歸零。",
        cells: ["5", "1", "2", "−1"],
        active: [3],
        variables: [
          ["最終prefix", "0"],
          ["work", "9"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <cstdlib>
using namespace std;
int main() {
    int n;
    while (cin >> n && n) {
        long long prefix = 0, answer = 0;
        for (int i = 0, x; i < n; ++i) {
            cin >> x;
            prefix += x;
            answer += llabs(prefix);
        }
        cout << answer << '\n';
    }
}`,
    python: String.raw`import sys

data = iter(map(int, sys.stdin.buffer.read().split()))
for n in data:
    if n == 0:
        break
    prefix = answer = 0
    for _ in range(n):
        prefix += next(data)
        answer += abs(prefix)
    print(answer)
`,
  }),
  defineCpeLesson("a521", {
    topic: "dp",
    level: "hard",
    concept: "倒序處理箱號與最輕可行堆疊",
    goal: "以最小重量狀態比較不同選箱方式，得到最多箱數。",
    explanation: [
      "題目規定底到頂編號遞增，所以從大編號往小編號處理，新箱只能加到現有堆疊底部。設dp[k]為已處理箱子能形成k箱合法堆疊的最小總重量，dp[0]=0，其餘無限大。新箱重量w、承載l，若dp[k]≤l，就可更新dp[k+1]=min(dp[k+1],dp[k]+w)。",
      "只保留最小重量是安全的：同樣k箱，較輕的堆疊對所有未來底箱都不會更難承載。k須倒序更新，避免同一箱被重複使用。承載只限制上方箱總重，不含自己。最後取有限的最大k，n=0停止；不排序輸入，因為編號順序本身是限制。",
    ],
    complexity: "每筆時間 O(N²)，空間 O(N)。",
    pitfall:
      "本地規格明確為底到頂編號遞增，應倒序讀入後處理；按重量或承載排序會破壞編號限制。",
    traceLabel: "示意：箱1(重5承7)、箱2(重6承8)、箱3(重1承2)",
    trace: [
      {
        title: "先處理箱3",
        description: "空堆疊可放上箱3，dp[1]=1。",
        cells: ["dp0=0", "dp1=1", "dp2=∞", "dp3=∞"],
        active: [1],
        variables: [
          ["目前箱號", "3"],
          ["最多箱數", "1"],
        ],
      },
      {
        title: "加入箱2作底",
        description: "上方重量1≤8，形成2箱總重7。",
        cells: ["dp0=0", "dp1=1", "dp2=7", "dp3=∞"],
        active: [2],
        variables: [
          ["目前箱號", "2"],
          ["最多箱數", "2"],
        ],
      },
      {
        title: "加入箱1作底",
        description: "上方7≤承載7，形成1→2→3，共3箱重12。",
        cells: ["dp0=0", "dp1=1", "dp2=6", "dp3=12"],
        active: [3],
        variables: [
          ["目前箱號", "1"],
          ["最多箱數", "3"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <utility>
#include <algorithm>
using namespace std;
int main() {
    int n;
    while (cin >> n && n) {
        vector<pair<int, int>> boxes(n);
        for (auto &box : boxes)
            cin >> box.first >> box.second;
        const long long INF = 1000000000000000LL;
        vector<long long> dp(n + 1, INF);
        dp[0] = 0;
        int best = 0;
        for (int i = n - 1; i >= 0; --i) {
            auto [w, load] = boxes[i];
            for (int k = best; k >= 0; --k)
                if (dp[k] <= load) {
                    dp[k + 1] = min(dp[k + 1], dp[k] + w);
                    best = max(best, k + 1);
                }
        }
        cout << best << '\n';
    }
}`,
    python: String.raw`import sys

data = iter(map(int, sys.stdin.buffer.read().split()))
for n in data:
    if n == 0:
        break
    boxes = [(next(data), next(data)) for _ in range(n)]
    dp = [10**18] * (n + 1)
    dp[0] = 0
    best = 0
    for weight, load in reversed(boxes):
        for k in range(best, -1, -1):
            if dp[k] <= load:
                dp[k + 1] = min(dp[k + 1], dp[k] + weight)
                best = max(best, k + 1)
    print(best)
`,
  }),
  defineCpeLesson("a522", {
    topic: "search",
    level: "hard",
    concept: "連續區間枚舉與有理誤差比較",
    goal: "精確比較加權溫度誤差，保留最早的最佳區間。",
    explanation: [
      "固定起點l後向右延伸，累加水量V與偏差熱量E=Σvolume·(temperature−target)。混合溫度與目標的距離正好是|E|/V；只評估ceil(capacity/2)≤V≤capacity的區間，並要求誤差≤5。水量為非負物理量，一旦V超過容量，後面不會減少，可停止此起點的延伸。",
      "最多3000罐，O(N²)枚舉可行。按l遞增、r遞增掃描，只在誤差嚴格改善時更新，所以同誤差自然保留較小起點再較小終點。Python用整數交叉乘；C++用64位元累積量，分數比較採商餘數與倒數交替比較，避免兩個分數交叉乘溢位。沒有有效方案輸出Not possible；零水量區間不能定義溫度，略過。",
    ],
    complexity: "枚舉 O(N²)；C++ 每次分數比較另需 O(log V)，空間 O(N)。",
    pitfall:
      "不是平均各罐溫度，必須以水量加權；容量奇數時半滿門檻應向上取整。本地題敘未列水量、溫度上限，C++版本假設累積水量與帶符號偏差熱量可存入64位元；Python整數沒有此限制。",
    traceLabel: "示意：容量10、目標20，水罐(3,10)、(3,30)、(4,20)",
    trace: [
      {
        title: "只取罐0",
        description: "V=3、E=−30，水量不足半滿。",
        cells: ["0:(3,10)", "1:(3,30)", "2:(4,20)"],
        active: [0],
        variables: [
          ["V", "3"],
          ["E", "−30"],
        ],
      },
      {
        title: "取0到1",
        description: "V=6、E=0，誤差0，記錄區間0 1。",
        cells: ["0:(3,10)", "1:(3,30)", "2:(4,20)"],
        active: [0, 1],
        variables: [
          ["V", "6"],
          ["最佳誤差", "0/6"],
        ],
      },
      {
        title: "再加入罐2",
        description: "V=10、E=0同樣最佳，但終點較大，仍保留0 1。",
        cells: ["0:(3,10)", "1:(3,30)", "2:(4,20)"],
        active: [0, 1, 2],
        variables: [
          ["V", "10"],
          ["輸出", "0 1"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <utility>
#include <cstdlib>
using namespace std;
bool lessFraction(unsigned long long a, unsigned long long b, unsigned long long c,
                  unsigned long long d) {
    bool reversed = false;
    while (true) {
        if (a / b != c / d)
            return reversed ? a / b > c / d : a / b < c / d;
        auto r = a % b, s = c % d;
        if (!r || !s) {
            if (!r && !s)
                return false;
            return reversed ? r != 0 : r == 0;
        }
        a = b;
        b = r;
        c = d;
        d = s;
        reversed = !reversed;
    }
}
int main() {
    int T;
    cin >> T;
    while (T--) {
        long long capacity, target;
        int n;
        cin >> capacity >> target >> n;
        vector<pair<long long, long long>> jars(n);
        for (auto &jar : jars)
            cin >> jar.first >> jar.second;
        int left = -1, right = -1;
        unsigned long long bestError = 0, bestVolume = 1;
        for (int l = 0; l < n; ++l) {
            long long volume = 0, error = 0;
            for (int r = l; r < n; ++r) {
                volume += jars[r].first;
                error += jars[r].first * (jars[r].second - target);
                if (volume > capacity)
                    break;
                if (volume <= 0 || volume < capacity / 2 + capacity % 2)
                    continue;
                unsigned long long e = llabs(error), v = volume;
                if (e / v > 5 || (e / v == 5 && e % v))
                    continue;
                if (left < 0 || lessFraction(e, v, bestError, bestVolume)) {
                    left = l;
                    right = r;
                    bestError = e;
                    bestVolume = v;
                }
            }
        }
        if (left < 0)
            cout << "Not possible\n";
        else
            cout << left << ' ' << right << '\n';
    }
}`,
    python: String.raw`import sys

data = iter(map(int, sys.stdin.buffer.read().split()))
for _ in range(next(data)):
    capacity, target, n = next(data), next(data), next(data)
    jars = [(next(data), next(data)) for _ in range(n)]
    best = None
    best_error, best_volume = 0, 1
    for left in range(n):
        volume = error = 0
        for right in range(left, n):
            v, t = jars[right]
            volume += v
            error += v * (t - target)
            if volume > capacity:
                break
            if volume <= 0 or 2 * volume < capacity:
                continue
            e = abs(error)
            if e > 5 * volume:
                continue
            if best is None or e * best_volume < best_error * volume:
                best = (left, right)
                best_error, best_volume = e, volume
    if best is None:
        print('Not possible')
    else:
        print(*best)
`,
  }),
  defineCpeLesson("a523", {
    topic: "trees",
    level: "medium",
    concept: "最小堆與最佳合併樹",
    goal: "每次合併最小兩個數，最小化所有中間總和的成本。",
    explanation: [
      "每個原數對總成本的貢獻，等於它的值乘以它在合併樹中的深度。交換論證指出，可把最小的兩個權重安排成最深層的兄弟葉，成本不會增加；先把它們合成一個新權重後，剩下仍是同樣的最佳合併問題。",
      "因此維護最小堆，每次取出最小兩數a、b，累加a+b並將它放回，直到只剩一數。必須把中間總和重新參與比較，不能只排序後依序線性累加。N最多5000，合併總成本使用64位元；N=0結束，輸出最小成本。",
    ],
    complexity: "每筆時間 O(N log N)，空間 O(N)。",
    pitfall:
      "C++ priority_queue預設是最大堆，須指定greater；答案可能超過32位元。",
    traceLabel: "示意：1、2、3、4",
    trace: [
      {
        title: "合併1與2",
        description: "成本3，新集合為3、3、4。",
        cells: ["3", "3", "4"],
        active: [0],
        variables: [
          ["本次成本", "3"],
          ["總成本", "3"],
        ],
      },
      {
        title: "合併兩個3",
        description: "成本6，新集合為4、6。",
        cells: ["4", "6"],
        active: [1],
        variables: [
          ["本次成本", "6"],
          ["總成本", "9"],
        ],
      },
      {
        title: "最後合併",
        description: "4+6=10，總成本3+6+10=19。",
        cells: ["10"],
        active: [0],
        variables: [
          ["本次成本", "10"],
          ["總成本", "19"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <queue>
#include <vector>
#include <functional>
using namespace std;
int main() {
    int n;
    while (cin >> n && n) {
        priority_queue<long long, vector<long long>, greater<long long>> heap;
        for (int i = 0; i < n; ++i) {
            long long x;
            cin >> x;
            heap.push(x);
        }
        long long answer = 0;
        while (heap.size() > 1) {
            long long a = heap.top();
            heap.pop();
            long long b = heap.top();
            heap.pop();
            answer += a + b;
            heap.push(a + b);
        }
        cout << answer << '\n';
    }
}`,
    python: String.raw`import sys
from heapq import heapify, heappop, heappush

data = iter(map(int, sys.stdin.buffer.read().split()))
for n in data:
    if n == 0:
        break
    heap = [next(data) for _ in range(n)]
    heapify(heap)
    answer = 0
    while len(heap) > 1:
        value = heappop(heap) + heappop(heap)
        answer += value
        heappush(heap, value)
    print(answer)
`,
  }),
];
