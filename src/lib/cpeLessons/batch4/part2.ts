import { defineCpeLesson } from "@/lib/cpeLessonBuilder";

export const lessons = [
  defineCpeLesson("a668", {
    topic: "dp",
    level: "medium",
    concept: "樹上最小頂點覆蓋",
    goal: "以父節點是否駐兵為條件，讓每條邊至少一端被選。",
    explanation: [
      "任選 0 為根，把每條輸入道路加成雙向邊，再用父節點陣列建立走訪順序。定義 dp[u][0] 為 u 不駐兵時其子樹的最少士兵數，dp[u][1] 為 u 駐兵時的最少數；葉節點分別是 0、1。",
      "若 u 不駐兵，所有子節點 v 都必須駐兵，否則邊 u−v 無人看守，故累加 dp[v][1]。若 u 駐兵，子節點可任選，累加 min(dp[v][0],dp[v][1]) 並加 u 的 1。將走訪順序倒轉即可由葉向根計算，答案取根的較小值。解析 u:(k) 的標點，輸入直到 EOF；節點列順序不影響樹結構。",
    ],
    complexity: "時間 O(n)，空間 O(n)。",
    pitfall:
      "輸入每條邊只出現一次，但列出的方向不保證就是從根到葉；要建無向圖再定父子。",
    traceLabel: "示意：路徑 0−1−2",
    trace: [
      {
        title: "葉 2",
        description: "不選或選葉子，成本為 0、1。",
        cells: ["2:0/1"],
        active: [0],
        variables: [["dp2", "(0,1)"]],
      },
      {
        title: "節點 1",
        description: "不選 1 必須選 2；選 1 可不選 2。",
        cells: ["1:1/1", "2:0/1"],
        active: [0],
        variables: [["dp1", "(1,1)"]],
      },
      {
        title: "根 0",
        description: "不選根只需選 1，共一位士兵。",
        cells: ["0:1/2", "1:駐兵", "2:不選"],
        active: [1],
        variables: [["答案", "1"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <array>
#include <algorithm>
using namespace std;
int main() {
    int n;
    while (cin >> n) {
        vector<vector<int>> g(n);
        for (int i = 0; i < n; i++) {
            int u, k;
            char ch;
            cin >> u >> ch >> ch >> k >> ch;
            while (k--) {
                int v;
                cin >> v;
                g[u].push_back(v);
                g[v].push_back(u);
            }
        }
        vector<int> parent(n, -2), order{0};
        parent[0] = -1;
        for (int i = 0; i < (int)order.size(); i++) {
            int u = order[i];
            for (int v : g[u])
                if (parent[v] == -2) {
                    parent[v] = u;
                    order.push_back(v);
                }
        }
        vector<array<int, 2>> dp(n, {0, 1});
        for (int i = n - 1; i >= 0; i--) {
            int u = order[i];
            for (int v : g[u])
                if (parent[v] == u) {
                    dp[u][0] += dp[v][1];
                    dp[u][1] += min(dp[v][0], dp[v][1]);
                }
        }
        cout << min(dp[0][0], dp[0][1]) << '\n';
    }
}`,
    python: String.raw`import sys, re

it = iter(map(int, re.findall(rb'\d+', sys.stdin.buffer.read())))
for n in it:
    g = [[] for _ in range(n)]
    for _ in range(n):
        u, k = next(it), next(it)
        for _ in range(k):
            v = next(it)
            g[u].append(v)
            g[v].append(u)
    parent = [-2] * n
    parent[0] = -1
    order = [0]
    for u in order:
        for v in g[u]:
            if parent[v] == -2:
                parent[v] = u
                order.append(v)
    dp = [[0, 1] for _ in range(n)]
    for u in reversed(order):
        for v in g[u]:
            if parent[v] == u:
                dp[u][0] += dp[v][1]
                dp[u][1] += min(dp[v])
    print(min(dp[0]))
`,
  }),
  defineCpeLesson("a669", {
    topic: "dp",
    level: "easy",
    concept: "Kadane 連續最大和",
    goal: "以最佳結尾區段在線性時間找出最大獲利。",
    explanation: [
      "令 ending 表示目前位置結尾的最大非負區段和。遇到 x 時，最佳選擇是延續先前區段再加 x；若結果為負，這段只會拖累後面的獲利，直接捨棄並令 ending=0。因此轉移是 max(0,ending+x)。",
      "best 保存所有已掃位置的 ending 最大值，就涵蓋每個可能結尾的最佳區段。允許空區段只是計算方便，因為題目將沒有正獲利的情形一律視為 Losing streak.，所以 best=0 時不輸出獲利句子。資料數 N 決定讀幾個整數，不可假設全在同一行；N=0 結束。",
    ],
    complexity: "時間 O(N)，額外空間 O(1)。",
    pitfall: "最大子序列可跳過元素，但本題必須連續；不能只加正數。",
    traceLabel: "示意：4,−6,5,2",
    trace: [
      {
        title: "先獲利",
        description: "讀 4，最佳結尾與全域答案皆 4。",
        cells: ["4", "-6", "5", "2"],
        active: [0],
        variables: [
          ["ending", "4"],
          ["best", "4"],
        ],
      },
      {
        title: "捨棄負段",
        description: "4−6<0，結尾歸零。",
        cells: ["4", "-6", "5", "2"],
        active: [1],
        variables: [
          ["ending", "0"],
          ["best", "4"],
        ],
      },
      {
        title: "新區段",
        description: "5+2=7，更新全域最大和。",
        cells: ["4", "-6", "5", "2"],
        active: [2, 3],
        variables: [
          ["ending", "7"],
          ["best", "7"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <algorithm>
using namespace std;
int main() {
    int n;
    while (cin >> n && n) {
        long long ending = 0, best = 0;
        while (n--) {
            long long x;
            cin >> x;
            ending = max(0LL, ending + x);
            best = max(best, ending);
        }
        if (best)
            cout << "The maximum winning streak is " << best << ".\n";
        else
            cout << "Losing streak.\n";
    }
}`,
    python: String.raw`import sys

it = iter(map(int, sys.stdin.buffer.read().split()))
for n in it:
    if n == 0:
        break
    ending = best = 0
    for _ in range(n):
        ending = max(0, ending + next(it))
        best = max(best, ending)
    print(f'The maximum winning streak is {best}.' if best else 'Losing streak.')
`,
  }),
  defineCpeLesson("a670", {
    topic: "strings",
    level: "easy",
    concept: "鍵盤同列左鄰映射",
    goal: "以固定字元表還原錯位輸入並保留空白。",
    explanation: [
      "將鍵盤每列從左至右寫成字串。對每個不是該列第一鍵的字元 row[i]，建立 row[i]→row[i−1] 的映射，這正是右移一鍵輸入的逆操作。各列分開建立，避免跨列把 Q 對應到上一列最後一鍵。",
      "逐字元讀入整份文字，有映射就替換，沒有映射就原樣輸出。這樣空白、連續空白、空行和換行都保留，不會被分詞輸入吃掉。題目保證不會輸入沒有左鄰的 Q、A、Z、反引號，所以每個非空白合法鍵都可還原。讀到 EOF，不印其他說明。",
    ],
    complexity: "輸入長度 L，時間 O(L)，固定字元表空間 O(1)。",
    pitfall: "不要用 split() 或 cin>>字串處理訊息，否則多個空白與換行會消失。",
    traceLabel: "示意：輸入 O S,",
    trace: [
      {
        title: "字母 O",
        description: "O 左側為 I。",
        cells: ["O", "空白", "S", ","],
        active: [0],
        variables: [
          ["已處理字元", "1"],
          ["已還原", "I"],
        ],
      },
      {
        title: "空白與 S",
        description: "保留空白；S 左側為 A。",
        cells: ["I", "空白", "A", ","],
        active: [1, 2],
        variables: [
          ["已處理字元", "3"],
          ["已還原", "I A"],
        ],
      },
      {
        title: "逗號",
        description: "逗號左側為 M，結果 I AM。",
        cells: ["I", "空白", "A", "M"],
        active: [3],
        variables: [["輸出長度", "4"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <string>
#include <vector>
using namespace std;
int main() {
    vector<string> rows = {"\x60"
                           "1234567890-=",
                           "QWERTYUIOP[]", "ASDFGHJKL;'", "ZXCVBNM,./"};
    char mapping[256];
    for (int i = 0; i < 256; i++)
        mapping[i] = char(i);
    for (auto row : rows)
        for (int i = 1; i < (int)row.size(); i++)
            mapping[(unsigned char)row[i]] = row[i - 1];
    char c;
    while (cin.get(c))
        cout.put(mapping[(unsigned char)c]);
}`,
    python: String.raw`import sys

rows = [chr(96) + '1234567890-=', 'QWERTYUIOP[]', 'ASDFGHJKL;' + chr(39), 'ZXCVBNM,./']
mapping = {ord(row[i]): row[i - 1] for row in rows for i in range(1, len(row))}
sys.stdout.write(sys.stdin.read().translate(mapping))
`,
  }),
  defineCpeLesson("a671", {
    topic: "number-theory",
    level: "medium",
    concept: "質數測試與比例前綴和",
    goal: "預先分類 Euler 多項式值，快速回答多筆區間比例。",
    explanation: [
      "對 n=0…10000 計算 f(n)=n²+n+41。最大值約一億，不必配置到一億的質數表；只要先篩出不超過 sqrt(f(10000)) 的質數，用這些質數試除每個 f(n)。若沒有質因數 ≤平方根，它就是質數。",
      "設 prefix[k] 是 0 到 k−1 的成功個數，區間 [a,b] 的成功數為 prefix[b+1]−prefix[a]。比例是成功數除以 b−a+1，再乘 100。為精確四捨五入到百分比小數兩位，可直接將 10000·count/length 捨入為整數百分之一，再拆整數與兩位小數，避開浮點半分界。輸入直到 EOF。",
    ],
    complexity:
      "令 K=10000、P≈sqrt(f(K))，預算 O(P log log P+K·π(P)) 上界，查詢 O(1)，空間 O(K+P)。",
    pitfall: "分母是 b−a+1；n=40 產生 41²，必須判成合數。",
    traceLabel: "示意：查詢 [39,40]",
    trace: [
      {
        title: "n=39",
        description: "39²+39+41=1601，是質數。",
        cells: ["n=39", "1601"],
        active: [1],
        variables: [["成功", "1"]],
      },
      {
        title: "n=40",
        description: "40²+40+41=1681=41²，不是質數。",
        cells: ["n=40", "1681", "41×41"],
        active: [1, 2],
        variables: [
          ["成功", "1"],
          ["總數", "2"],
        ],
      },
      {
        title: "比例",
        description: "1/2×100=50.00。",
        cells: ["1", "2", "50.00"],
        active: [2],
        variables: [["百分之一單位", "5000"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <iomanip>
using namespace std;
int main() {
    const int limit = 10001;
    vector<bool> prime(limit + 1, true);
    prime[0] = prime[1] = false;
    vector<int> primes;
    for (int p = 2; p <= limit; p++)
        if (prime[p]) {
            primes.push_back(p);
            if (p * p <= limit)
                for (int x = p * p; x <= limit; x += p)
                    prime[x] = false;
        }
    vector<int> prefix(10002);
    for (int n = 0; n <= 10000; n++) {
        int x = n * n + n + 41;
        bool ok = true;
        for (int p : primes) {
            if (1LL * p * p > x)
                break;
            if (x % p == 0) {
                ok = false;
                break;
            }
        }
        prefix[n + 1] = prefix[n] + ok;
    }
    int a, b;
    while (cin >> a >> b) {
        long long count = prefix[b + 1] - prefix[a], len = b - a + 1;
        long long units = (20000 * count + len) / (2 * len);
        cout << units / 100 << '.' << setw(2) << setfill('0') << units % 100 << '\n';
    }
}`,
    python: String.raw`import sys

limit = 10001
prime = bytearray(b'\x01') * (limit + 1)
prime[0:2] = b'\x00\x00'
for p in range(2, 101):
    if prime[p]:
        prime[p * p :: p] = b'\x00' * ((limit - p * p) // p + 1)
primes = [p for p in range(2, limit + 1) if prime[p]]
prefix = [0]
for n in range(10001):
    x = n * n + n + 41
    ok = True
    for p in primes:
        if p * p > x:
            break
        if x % p == 0:
            ok = False
            break
    prefix.append(prefix[-1] + ok)
it = iter(map(int, sys.stdin.buffer.read().split()))
for a, b in zip(it, it):
    count = prefix[b + 1] - prefix[a]
    length = b - a + 1
    units = (20000 * count + length) // (2 * length)
    print(f'{units // 100}.{units % 100:02d}')
`,
  }),
  defineCpeLesson("a672", {
    topic: "graphs",
    level: "medium",
    concept: "刪邊破環與最大生成樹",
    goal: "保留成本最高的無環道路，求攝影機最小總成本。",
    explanation: [
      "在原題通常採用的簡單道路圖模型中，沒有攝影機的道路不能留下任何環，否則賽車可完全沿該環避開攝影機。故這些道路必須形成森林。總安裝成本等於所有道路成本總和減去未安裝道路的成本，因此要最大化保留森林的權重。正成本且原圖連通，最優森林能擴充為生成樹。",
      "將邊依成本由大到小排序，使用並查集。若兩端尚未連通就保留該邊並合併；否則加入會形成環，必須在此邊安裝攝影機並累加成本。最大生成樹的交換性質保證保留較昂貴的可行邊不會損失最佳解。依開頭的組數處理資料，最後的 0 不再讀成新案例。",
    ],
    complexity: "時間 O(m log m)，空間 O(n+m)。",
    pitfall:
      "要保留最大生成樹。規格未明訂平行道路；本解採簡單圖，若允許同兩端多條道路，只有兩條邊的環路是否需要監控須平台另行定義。",
    traceLabel: "示意：三角形成本 7、5、2",
    trace: [
      {
        title: "保留 7",
        description: "先連接 1、2。",
        cells: ["1−2:7", "2−3:5", "1−3:2"],
        active: [0],
        variables: [["安裝", "0"]],
      },
      {
        title: "保留 5",
        description: "再連接 2、3，仍無環。",
        cells: ["1−2:留", "2−3:留", "1−3:2"],
        active: [1],
        variables: [["保留成本", "12"]],
      },
      {
        title: "拒絕 2",
        description: "第三邊形成環，在成本 2 的邊裝攝影機。",
        cells: ["7", "5", "2:攝影機"],
        active: [2],
        variables: [["答案", "2"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <algorithm>
#include <numeric>
using namespace std;
struct Edge {
    int u, v, w;
};
struct DSU {
    vector<int> p, size;
    DSU(int n) : p(n), size(n, 1) {
        iota(p.begin(), p.end(), 0);
    }
    int find(int x) {
        return p[x] == x ? x : p[x] = find(p[x]);
    }
    bool join(int a, int b) {
        a = find(a);
        b = find(b);
        if (a == b)
            return false;
        if (size[a] < size[b])
            swap(a, b);
        p[b] = a;
        size[a] += size[b];
        return true;
    }
};
int main() {
    int tests;
    cin >> tests;
    while (tests--) {
        int n, m;
        cin >> n >> m;
        vector<Edge> e(m);
        for (auto &x : e) {
            cin >> x.u >> x.v >> x.w;
            --x.u;
            --x.v;
        }
        sort(e.begin(), e.end(), [](Edge a, Edge b) { return a.w > b.w; });
        DSU d(n);
        long long answer = 0;
        for (auto x : e)
            if (!d.join(x.u, x.v))
                answer += x.w;
        cout << answer << '\n';
    }
}`,
    python: String.raw`import sys

it = iter(map(int, sys.stdin.buffer.read().split()))
for _ in range(next(it)):
    n, m = next(it), next(it)
    edges = [(next(it) - 1, next(it) - 1, next(it)) for _ in range(m)]
    parent = list(range(n))
    size = [1] * n

    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    answer = 0
    for u, v, w in sorted(edges, key=lambda e: -e[2]):
        u, v = find(u), find(v)
        if u == v:
            answer += w
        else:
            if size[u] < size[v]:
                u, v = v, u
            parent[v] = u
            size[u] += size[v]
    print(answer)
`,
  }),
  defineCpeLesson("a673", {
    topic: "dp",
    level: "medium",
    concept: "等分行李的 0/1 子集合和",
    goal: "把分兩車問題轉為能否湊出總重的一半。",
    explanation: [
      "若總重 S 是奇數，兩車不可能等重；若為偶數，只要選出總重 S/2 的子集合，剩下的行李自動也重 S/2。用 reachable[s] 表示目前處理過的行李能否恰好湊出 s，初始只有 reachable[0] 為真。",
      "每件重量 w 由大到小更新 s：reachable[s] |= reachable[s−w]。倒序使右側狀態仍屬於加入本行李之前，保證每件只能用一次。總重至多 200，這比枚舉 2^20 個子集合更直接。每筆行李由一整行界定，沒有件數，所以必須逐行讀而不是把所有整數混成一串。",
    ],
    complexity: "每組 k 件、總重 S，時間 O(kS)，空間 O(S)。",
    pitfall:
      "不能把每行第一個重量誤認為行李件數；正序更新會變成同件可重複使用。",
    traceLabel: "示意：1,2,3",
    trace: [
      {
        title: "放入 1",
        description: "可達重量為 0、1。",
        cells: ["0✓", "1✓", "2", "3"],
        active: [1],
        variables: [["目標", "3"]],
      },
      {
        title: "放入 2",
        description: "由 0、1 可擴充到 2、3。",
        cells: ["0✓", "1✓", "2✓", "3✓"],
        active: [2, 3],
        variables: [["reachable[3]", "1"]],
      },
      {
        title: "判定",
        description: "1+2 與 3 可各放一車，輸出 YES。",
        cells: ["車A:1+2=3", "車B:3"],
        active: [0, 1],
        variables: [["總重", "6"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <sstream>
#include <string>
#include <vector>
#include <numeric>
using namespace std;
int main() {
    int tests;
    cin >> tests;
    string line;
    getline(cin, line);
    while (tests--) {
        getline(cin, line);
        istringstream in(line);
        vector<int> a;
        int x;
        while (in >> x)
            a.push_back(x);
        int sum = accumulate(a.begin(), a.end(), 0), target = sum / 2;
        vector<bool> dp(target + 1);
        dp[0] = true;
        for (int w : a)
            for (int s = target; s >= w; s--)
                dp[s] = dp[s] || dp[s - w];
        cout << (!(sum % 2) && dp[target] ? "YES" : "NO") << '\n';
    }
}`,
    python: String.raw`import sys

lines = sys.stdin.buffer
tests = int(lines.readline())
for _ in range(tests):
    a = list(map(int, lines.readline().split()))
    total = sum(a)
    target = total // 2
    dp = [False] * (target + 1)
    dp[0] = True
    for w in a:
        for s in range(target, w - 1, -1):
            dp[s] |= dp[s - w]
    print('YES' if total % 2 == 0 and dp[target] else 'NO')
`,
  }),
  defineCpeLesson("a674", {
    topic: "dp",
    level: "medium",
    concept: "符號配置的餘數狀態壓縮",
    goal: "只記錄模 K 的結果，而不枚舉指數數量的算式。",
    explanation: [
      "兩個部分算式若模 K 相同，之後加減同樣數字仍同餘，對是否整除的影響完全一致。因此把大量可能總和壓成 K 個布林餘數狀態。初始只令第一個數字模 K 的狀態可達，因為第一數前不能另外選符號。",
      "讀到後續 x，對每個舊餘數 r，在新的陣列標記 (r+x) mod K 與 (r−x) mod K。使用新陣列避免同一個數重複轉移；負數餘數在 C++ 要先加 K 再取模。全部處理後若餘數 0 可達就輸出 Divisible，否則 Not divisible，大小寫依題意。",
    ],
    complexity: "時間 O(NK)，空間 O(K)。",
    pitfall: "C++ 的負數 % 可能為負；陣列索引必須正規化到 0…K−1。",
    traceLabel: "示意：3,2,1，K=4",
    trace: [
      {
        title: "第一數",
        description: "3 mod 4=3，只有餘數 3。",
        cells: ["0", "1", "2", "3✓"],
        active: [3],
        variables: [["已讀", "1"]],
      },
      {
        title: "加入 2",
        description: "3+2 與 3−2 模 4 都是 1。",
        cells: ["0", "1✓", "2", "3"],
        active: [1],
        variables: [["已讀", "2"]],
      },
      {
        title: "加入 1",
        description: "從 1 可到 0、2；3−2−1=0。",
        cells: ["0✓", "1", "2✓", "3"],
        active: [0, 2],
        variables: [["可整除", "1"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
using namespace std;
int main() {
    int tests;
    cin >> tests;
    while (tests--) {
        int n, k, x;
        cin >> n >> k >> x;
        vector<bool> dp(k);
        dp[(x % k + k) % k] = true;
        for (int i = 1; i < n; i++) {
            cin >> x;
            x = (x % k + k) % k;
            vector<bool> next(k);
            for (int r = 0; r < k; r++)
                if (dp[r]) {
                    next[(r + x) % k] = true;
                    next[(r - x + k) % k] = true;
                }
            dp.swap(next);
        }
        cout << (dp[0] ? "Divisible" : "Not divisible") << '\n';
    }
}`,
    python: String.raw`import sys

it = iter(map(int, sys.stdin.buffer.read().split()))
for _ in range(next(it)):
    n, k = next(it), next(it)
    possible = {next(it) % k}
    for _ in range(n - 1):
        x = next(it) % k
        possible = {(r + s * x) % k for r in possible for s in (-1, 1)}
    print('Divisible' if 0 in possible else 'Not divisible')
`,
  }),
  defineCpeLesson("a675", {
    topic: "dp",
    level: "medium",
    concept: "可重複半徑的最長共同子序列",
    goal: "比較兩塔前綴，決定保留或略過最後一塊磚。",
    explanation: [
      "設 dp[i][j] 為第一塔前 i 塊與第二塔前 j 塊可保留的最多共同磚數。任一前綴為空時答案是 0。若最後兩塊半徑相等，可以接在較短前綴的共同序列後，得 dp[i−1][j−1]+1。",
      "若最後半徑不同，這兩塊不可能同時作為共同序列的最後一塊，必須至少略過其中一塊，所以取 max(dp[i−1][j],dp[i][j−1])。逐列計算，只需保留前一列。半徑可重複，不能像唯一格子的題目直接映射成單一位置。讀到 0 0 結束，兩行答案後加空白行。",
    ],
    complexity:
      "每筆時間 O(N₁N₂)，DP 工作空間 O(N₂)；C++ 含兩塔輸入共 O(N₁+N₂)，Python 另有整份輸入切詞緩衝 O(T)，T 為全部輸入長度。",
    pitfall: "共同子序列不必連續，但順序不可重排；不是共同半徑的集合大小。",
    traceLabel: "示意：第一塔 1,2,1；第二塔 2,1",
    trace: [
      {
        title: "第一列",
        description: "只看第一塔的 1，與第二塔前綴的 LCS 為 0、0、1。",
        cells: ["0", "0", "1"],
        active: [2],
        variables: [["i", "1"]],
      },
      {
        title: "第二列",
        description: "加入 2，可配上第二塔的第一塊。",
        cells: ["0", "1", "1"],
        active: [1],
        variables: [["i", "2"]],
      },
      {
        title: "第三列",
        description: "最後 1 接在 2 後面，得到長度 2。",
        cells: ["0", "1", "2"],
        active: [2],
        variables: [
          ["i", "3"],
          ["答案", "2"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;
int main() {
    int n, m, tc = 0;
    while (cin >> n >> m && (n || m)) {
        vector<int> a(n), b(m), dp(m + 1);
        for (int &x : a)
            cin >> x;
        for (int &x : b)
            cin >> x;
        for (int x : a) {
            vector<int> next(m + 1);
            for (int j = 1; j <= m; j++)
                next[j] = x == b[j - 1] ? dp[j - 1] + 1 : max(dp[j], next[j - 1]);
            dp.swap(next);
        }
        cout << "Twin Towers #" << ++tc << "\nNumber of Tiles : " << dp[m] << "\n\n";
    }
}`,
    python: String.raw`import sys

it = iter(map(int, sys.stdin.buffer.read().split()))
tc = 0
for n, m in zip(it, it):
    if n == m == 0:
        break
    a = [next(it) for _ in range(n)]
    b = [next(it) for _ in range(m)]
    dp = [0] * (m + 1)
    for x in a:
        row = [0] * (m + 1)
        for j, y in enumerate(b, 1):
            row[j] = dp[j - 1] + 1 if x == y else max(dp[j], row[j - 1])
        dp = row
    tc += 1
    print(f'Twin Towers #{tc}\nNumber of Tiles : {dp[m]}\n')
`,
  }),
  defineCpeLesson("a676", {
    topic: "dp",
    level: "medium",
    concept: "編輯距離的三種最後操作",
    goal: "用前綴動態規劃求最少插入、刪除與替換次數。",
    explanation: [
      "令 dp[i][j] 為 x 前 i 字元轉成 y 前 j 字元的最小成本。若一邊為空，只能全刪或全插，所以邊界為 dp[i][0]=i、dp[0][j]=j。一般位置考慮最後操作：刪 x[i−1]、插入 y[j−1]、或把最後字元配對。",
      "三種成本依序為 dp[i−1][j]+1、dp[i][j−1]+1、dp[i−1][j−1]+(x[i−1]≠y[j−1])，取最小即可。每個最優編輯方案都能依最後操作歸入其中一類，故不會漏解。每筆兩行以長度帶字串，程式也處理長度 0 時的空字串欄位，讀到 EOF，每筆輸出一個整數。",
    ],
    complexity:
      "時間 O(mn)，DP 工作空間 O(n)；C++ 含單組輸入共 O(m+n)，Python 另有整份輸入緩衝 O(T)，T 為全部輸入長度。",
    pitfall:
      "相同字元配對成本為 0，替換才是 1；不能用只會插刪的 LCS 公式代替。",
    traceLabel: "示意：AG 轉成 ATG",
    trace: [
      {
        title: "空前綴",
        description: "空字串變成空、A、AT、ATG，成本為 0、1、2、3。",
        cells: ["0", "1", "2", "3"],
        active: [0, 1, 2, 3],
        variables: [["i", "0"]],
      },
      {
        title: "處理 A",
        description: "A 可免費配對 A，後面各需插入。",
        cells: ["1", "0", "1", "2"],
        active: [1],
        variables: [["i", "1"]],
      },
      {
        title: "處理 G",
        description: "保留 A、G，中間插入 T，最小成本 1。",
        cells: ["2", "1", "1", "1"],
        active: [3],
        variables: [
          ["i", "2"],
          ["答案", "1"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <sstream>
#include <string>
#include <vector>
#include <algorithm>
#include <numeric>
using namespace std;
int main() {
    string first, second;
    while (getline(cin, first)) {
        if (first.empty())
            continue;
        if (!getline(cin, second))
            break;
        int m, n;
        string x, y;
        istringstream a(first), b(second);
        a >> m >> x;
        b >> n >> y;
        vector<int> dp(n + 1);
        iota(dp.begin(), dp.end(), 0);
        for (int i = 1; i <= m; i++) {
            vector<int> row(n + 1);
            row[0] = i;
            for (int j = 1; j <= n; j++)
                row[j] = min({dp[j] + 1, row[j - 1] + 1, dp[j - 1] + (x[i - 1] != y[j - 1])});
            dp.swap(row);
        }
        cout << dp[n] << '\n';
    }
}`,
    python: String.raw`import sys

lines = iter(sys.stdin.read().splitlines())
for first in lines:
    if not first.strip():
        continue
    second = next(lines)
    a, b = first.split(), second.split()
    m, n = int(a[0]), int(b[0])
    x = a[1] if m else ''
    y = b[1] if n else ''
    dp = list(range(n + 1))
    for i, c in enumerate(x, 1):
        row = [i] + [0] * n
        for j, d in enumerate(y, 1):
            row[j] = min(dp[j] + 1, row[j - 1] + 1, dp[j - 1] + (c != d))
        dp = row
    print(dp[n])
`,
  }),
  defineCpeLesson("a677", {
    topic: "dp",
    level: "hard",
    concept: "找零與守恆金額壓縮狀態",
    goal: "記住剩餘瓶數、5 元與 10 元硬幣，推回 1 元硬幣數。",
    explanation: [
      "購買過程的總金額每瓶恰減 8。若還要買 r 瓶、持有 f 枚 5 元與 t 枚 10 元，則 1 元數可由初始總金額 V 推回：one=V−8(C−r)−5f−10t。以 (r,f,t) 作記憶化狀態，避免多記一維；r=0 時後續成本為 0。",
      "只需考慮五種不被支配的付款：8 個 1 元；1 個 5 元加 3 個 1 元；2 個 5 元找 2 個 1 元；1 個 10 元找 2 個 1 元；1 個 10 元加 3 個 1 元找 1 個 5 元。最後一種雖多投硬幣，可能為未來保留 5 元，不能省略。其他多付方式可去掉多餘硬幣，或調整到後續購買而不增加總投入。對持幣足夠的轉移，加付款枚數取最小。",
    ],
    complexity:
      "設實際到達狀態數為 S，每狀態五個轉移，時間與空間 O(S)；狀態界 O(C(n5+n10+1)(n10+1))。",
    pitfall:
      "每次只買一瓶；找回的硬幣立刻改變後續狀態，不能把 C 瓶合成一次付款。",
    traceLabel: "示意：C=2，持有 2 個1元、1個5元、1個10元",
    trace: [
      {
        title: "初始",
        description: "總金額 17，可支付兩瓶的 16。",
        cells: ["1元:2", "5元:1", "10元:1"],
        active: [0, 1, 2],
        variables: [
          ["r", "2"],
          ["投入", "0"],
        ],
      },
      {
        title: "先投 10",
        description: "用一枚 10 元買一瓶，找回兩枚 1 元。",
        cells: ["1元:4", "5元:1", "10元:0"],
        active: [0, 2],
        variables: [
          ["r", "1"],
          ["投入", "1"],
        ],
      },
      {
        title: "再投 5+1+1+1",
        description: "再投入四枚，共五枚完成兩瓶。",
        cells: ["1元:1", "5元:0", "10元:0"],
        active: [0, 1],
        variables: [
          ["r", "0"],
          ["最少投入", "5"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <unordered_map>
#include <functional>
#include <algorithm>
using namespace std;
int main() {
    int tests;
    cin >> tests;
    while (tests--) {
        int c, n1, n5, n10;
        cin >> c >> n1 >> n5 >> n10;
        int value = n1 + 5 * n5 + 10 * n10;
        unordered_map<long long, int> memo;
        function<int(int, int, int)> solve = [&](int r, int f, int t) {
            if (r == 0)
                return 0;
            long long key = (1LL * r * 256 + f) * 64 + t;
            if (memo.count(key))
                return memo[key];
            int one = value - 8 * (c - r) - 5 * f - 10 * t, answer = 1000000;
            if (one >= 8)
                answer = min(answer, 8 + solve(r - 1, f, t));
            if (f >= 1 && one >= 3)
                answer = min(answer, 4 + solve(r - 1, f - 1, t));
            if (f >= 2)
                answer = min(answer, 2 + solve(r - 1, f - 2, t));
            if (t >= 1)
                answer = min(answer, 1 + solve(r - 1, f, t - 1));
            if (t >= 1 && one >= 3)
                answer = min(answer, 4 + solve(r - 1, f + 1, t - 1));
            return memo[key] = answer;
        };
        cout << solve(c, n5, n10) << '\n';
    }
}`,
    python: String.raw`import sys
from functools import lru_cache

it = iter(map(int, sys.stdin.buffer.read().split()))
for _ in range(next(it)):
    c, n1, n5, n10 = next(it), next(it), next(it), next(it)
    value = n1 + 5 * n5 + 10 * n10

    @lru_cache(None)
    def solve(r, f, t):
        if r == 0:
            return 0
        one = value - 8 * (c - r) - 5 * f - 10 * t
        answer = 10**9
        if one >= 8:
            answer = min(answer, 8 + solve(r - 1, f, t))
        if f and one >= 3:
            answer = min(answer, 4 + solve(r - 1, f - 1, t))
        if f >= 2:
            answer = min(answer, 2 + solve(r - 1, f - 2, t))
        if t:
            answer = min(answer, 1 + solve(r - 1, f, t - 1))
        if t and one >= 3:
            answer = min(answer, 4 + solve(r - 1, f + 1, t - 1))
        return answer

    print(solve(c, n5, n10))
    solve.cache_clear()
`,
  }),
  defineCpeLesson("a678", {
    topic: "trees",
    level: "medium",
    concept: "團隊佇列的兩層 FIFO",
    goal: "每次入隊、出隊只更新隊伍順序與隊內順序。",
    explanation: [
      "同隊成員在整條佇列中總是連成一段：新成員只插在該段尾端，出隊只刪除最前一段的首位。因此不必在大佇列中搜尋隊友，只需維護 active 佇列記錄非空團隊順序，並為每隊維護一個成員佇列。",
      "ENQUEUE x 時先查 x 的團隊；該隊原本為空才將隊號放到 active 尾端，之後把 x 加入隊內尾端。DEQUEUE 時從 active 首隊取出首位成員，若該隊變空，再把隊號取走。每組 STOP 結束、t=0 結束全部；先印 Scenario #k，每組最後空一行。",
    ],
    complexity:
      "建表 O(總成員數)，每次操作平均 O(1)，空間 O(總成員數+佇列長度)。",
    pitfall: "一個團隊清空後再次出現，必須重新排在目前所有團隊後方。",
    traceLabel: "示意：隊0含101,102，隊1含201",
    trace: [
      {
        title: "加入 101",
        description: "隊0首次非空，active=[0]。",
        cells: ["隊0:[101]", "隊1:[]"],
        active: [0],
        variables: [["active", "[0]"]],
      },
      {
        title: "加入 201、102",
        description: "102 排在隊友101後面，整列是101,102,201。",
        cells: ["隊0:[101,102]", "隊1:[201]"],
        active: [0, 1],
        variables: [["active", "[0,1]"]],
      },
      {
        title: "連續取出兩次",
        description: "輸出101、102，隊0清空並離開active。",
        cells: ["隊0:[]", "隊1:[201]"],
        active: [1],
        variables: [["active", "[1]"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <queue>
#include <string>
#include <unordered_map>
using namespace std;
int main() {
    int t, tc = 0;
    while (cin >> t && t) {
        unordered_map<int, int> team;
        for (int i = 0; i < t; i++) {
            int k, x;
            cin >> k;
            while (k--) {
                cin >> x;
                team[x] = i;
            }
        }
        vector<queue<int>> members(t);
        queue<int> active;
        string command;
        cout << "Scenario #" << ++tc << '\n';
        while (cin >> command && command != "STOP") {
            if (command == "ENQUEUE") {
                int x;
                cin >> x;
                int id = team[x];
                if (members[id].empty())
                    active.push(id);
                members[id].push(x);
            } else {
                int id = active.front();
                cout << members[id].front() << '\n';
                members[id].pop();
                if (members[id].empty())
                    active.pop();
            }
        }
        cout << '\n';
    }
}`,
    python: String.raw`import sys
from collections import deque

it = iter(sys.stdin.buffer.read().split())
out = []
tc = 0
for token in it:
    t = int(token)
    if t == 0:
        break
    team = {}
    for i in range(t):
        for _ in range(int(next(it))):
            team[int(next(it))] = i
    members = [deque() for _ in range(t)]
    active = deque()
    tc += 1
    out.append(f'Scenario #{tc}')
    for command in it:
        if command == b'STOP':
            break
        if command == b'ENQUEUE':
            x = int(next(it))
            group = team[x]
            if not members[group]:
                active.append(group)
            members[group].append(x)
        else:
            group = active[0]
            out.append(str(members[group].popleft()))
            if not members[group]:
                active.popleft()
    out.append('')
sys.stdout.write('\n'.join(out) + '\n' if out else '')
`,
  }),
  defineCpeLesson("a679", {
    topic: "combinatorics",
    level: "hard",
    concept: "Stirling 奇偶化成二項係數的進位判斷",
    goal: "以兩個整數的位元 AND 回答十億規模的奇偶性。",
    explanation: [
      "固定 m，S(m+k,m) 的生成函數是 ∏(1−ix)⁻¹（i=1…m）。在模2下，偶數 i 的因子變1，奇數 i 的因子皆為 (1−x)⁻¹，共 q=ceil(m/2) 個，故係數等於 C(k+q−1,k) mod2，其中 k=n−m。這讓原本無法建立的巨大 DP 化為二項係數奇偶問題。",
      "由二進位的 Lucas 定理，C(k+r,k) 為奇數，恰當 k 與 r 相加沒有進位，也就是 (k&r)=0。這裡 r=q−1=floor((m−1)/2)，所以答案為 ((n−m)&((m−1)//2))==0。讀開頭測試數，空白行可視為一般空白；答案之間必須空一行。",
    ],
    complexity: "固定寬度整數下每筆時間 O(1)，空間 O(1)。",
    pitfall: "公式中是 (m−1)/2，不是 m/2；m=1 時必為奇數。",
    traceLabel: "示意：n=5，m=3，S(5,3)=25",
    trace: [
      {
        title: "位移",
        description: "k=n−m=2。",
        cells: ["n=5", "m=3", "k=2"],
        active: [2],
        variables: [["k二進位", "10"]],
      },
      {
        title: "生成函數",
        description: "q=2，r=q−1=1，係數為 C(3,2)=3 的奇偶。",
        cells: ["q=2", "r=1", "C(3,2)=3"],
        active: [1, 2],
        variables: [["r二進位", "01"]],
      },
      {
        title: "無進位",
        description: "10 AND 01=00，所以 S(5,3) 為奇數。",
        cells: ["10", "01", "00"],
        active: [2],
        variables: [["輸出", "1"]],
      },
    ],
    cpp: String.raw`#include <iostream>
using namespace std;
int main() {
    int tests;
    cin >> tests;
    for (int i = 0; i < tests; i++) {
        long long n, m;
        cin >> n >> m;
        if (i)
            cout << '\n';
        cout << (((n - m) & ((m - 1) / 2)) == 0 ? 1 : 0) << '\n';
    }
}`,
    python: String.raw`import sys

it = iter(map(int, sys.stdin.buffer.read().split()))
out = []
for _ in range(next(it)):
    n, m = next(it), next(it)
    out.append(str(int(((n - m) & ((m - 1) // 2)) == 0)))
print('\n\n'.join(out))
`,
  }),
  defineCpeLesson("a680", {
    topic: "math",
    level: "medium",
    concept: "十進位大整數加法的費波那契預算",
    goal: "逐項相加產生最長千位的完整整數。",
    explanation: [
      "遞迴式 f(n)=f(n−1)+f(n−2) 只依賴前兩項，依 n 由小到大計算就不會重複求子問題。但答案超過固定 64 位元範圍，C++ 以十進位字串保存數字，從尾端向前做直式加法，維護進位 carry。Python 可直接使用任意精度整數。",
      "先讀完所有 EOF 查詢，預算到最大的項次並保存，之後依原順序輸出。字串加法每位取 digitA+digitB+carry，寫入個位並將 carry 更新為除以10的商，最後反轉結果；不可漏掉最高位進位。題目從 f(1)=f(2)=1 起算，沒有案例標籤或科學記號。",
    ],
    complexity: "最大項次 K、最大位數 D，時間 O(KD)，保存全部項空間 O(KD)。",
    pitfall: "double 無法精確輸出千位整數；通項公式也不適用精確大數答案。",
    traceLabel: "示意：計算 f(5)",
    trace: [
      {
        title: "初值",
        description: "f(1)=1，f(2)=1。",
        cells: ["1", "1"],
        active: [0, 1],
        variables: [["項次", "2"]],
      },
      {
        title: "中間項",
        description: "f(3)=2，f(4)=3。",
        cells: ["1", "1", "2", "3"],
        active: [2, 3],
        variables: [["項次", "4"]],
      },
      {
        title: "第五項",
        description: "f(5)=f(4)+f(3)=3+2=5。",
        cells: ["2", "3", "5"],
        active: [2],
        variables: [["答案", "5"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <string>
#include <vector>
#include <algorithm>
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
    vector<int> queries;
    int n, limit = 2;
    while (cin >> n) {
        queries.push_back(n);
        limit = max(limit, n);
    }
    vector<string> f(limit + 1);
    f[0] = "0";
    f[1] = f[2] = "1";
    for (int i = 3; i <= limit; i++)
        f[i] = add(f[i - 1], f[i - 2]);
    for (int x : queries)
        cout << f[x] << '\n';
}`,
    python: String.raw`import sys

queries = list(map(int, sys.stdin.buffer.read().split()))
f = [0, 1, 1]
for i in range(3, max(queries, default=2) + 1):
    f.append(f[-1] + f[-2])
for n in queries:
    print(f[n])
`,
  }),
  defineCpeLesson("a681", {
    topic: "number-theory",
    level: "medium",
    concept: "重複質因數的數位和",
    goal: "由 n+1 起依序分解，排除質數並尋找第一個 Smith 數。",
    explanation: [
      "候選 x 以試除分解：只要 d 整除剩餘值，就除一次並加上 digitsum(d)，同一個 d 可以重複使用。當 d² 超過剩餘值時，若仍有剩餘質因數，最後加它的數位和。重複次數必須保留，例如 4=2×2 的因數數位和是 4。",
      "同時計算質因數個數；只有個數至少 2 的候選才是合數。否則每個質數都會因數位和等於自己而被錯收。由 n+1 遞增檢查，第一個符合兩邊數位和相同的合數，就是嚴格大於 n 的最小解。輸入以測試數控制，每筆只輸出找到的整數。",
    ],
    complexity: "若試 G 個候選、最大值 A，試除上界 O(G√A)，空間 O(1)。",
    pitfall: "原數 n 即使是 Smith 數也不能直接回傳；質因數必須按重數累加。",
    traceLabel: "示意：輸入 n=21",
    trace: [
      {
        title: "候選 22",
        description: "原數位和 2+2=4。",
        cells: ["22", "2+2=4"],
        active: [1],
        variables: [["目標和", "4"]],
      },
      {
        title: "除以 2",
        description: "取一個質因數 2，剩 11。",
        cells: ["2", "11"],
        active: [0],
        variables: [
          ["因數和", "2"],
          ["因數數", "1"],
        ],
      },
      {
        title: "剩餘質因數",
        description: "11 的數位和為 2，共 4，且有兩個質因數。",
        cells: ["2", "11", "2+(1+1)=4"],
        active: [2],
        variables: [["答案", "22"]],
      },
    ],
    cpp: String.raw`#include <iostream>
using namespace std;
int digit_sum(long long x) {
    int sum = 0;
    while (x) {
        sum += x % 10;
        x /= 10;
    }
    return sum;
}
bool smith(long long x) {
    long long remain = x;
    int sum = 0, count = 0;
    for (long long d = 2; d * d <= remain; d += (d == 2 ? 1 : 2))
        while (remain % d == 0) {
            remain /= d;
            sum += digit_sum(d);
            count++;
        }
    if (remain > 1) {
        sum += digit_sum(remain);
        count++;
    }
    return count >= 2 && sum == digit_sum(x);
}
int main() {
    int tests;
    cin >> tests;
    while (tests--) {
        long long n;
        cin >> n;
        do {
            ++n;
        } while (!smith(n));
        cout << n << '\n';
    }
}
`,
    python: String.raw`import sys


def digit_sum(x):
    return sum(map(int, str(x)))


def smith(x):
    remain = x
    total = count = 0
    d = 2
    while d * d <= remain:
        while remain % d == 0:
            remain //= d
            total += digit_sum(d)
            count += 1
        d += 1 if d == 2 else 2
    if remain > 1:
        total += digit_sum(remain)
        count += 1
    return count >= 2 and total == digit_sum(x)


it = iter(map(int, sys.stdin.buffer.read().split()))
for _ in range(next(it)):
    n = next(it) + 1
    while not smith(n):
        n += 1
    print(n)
`,
  }),
  defineCpeLesson("a682", {
    topic: "number-theory",
    level: "medium",
    concept: "雙重質數條件的前綴計數",
    goal: "將五十萬次區間查詢化為兩次陣列讀取。",
    explanation: [
      "先以 Eratosthenes 篩標記一百萬以下的質數。從每個質數 p 的 p² 起劃掉倍數，因為更小倍數已被更小質因數處理。0、1 不是質數，必須預先排除。",
      "對每個 x，檢查 prime[x] 且 prime[digitsum(x)]。定義 prefix[x] 為 1…x 中符合兩條件的個數，則閉區間 [l,r] 的數量為 prefix[r]−prefix[l−1]。數位和可用 digitsum(x)=digitsum(x//10)+x%10 預算。每筆輸出數量，不加標籤；先讀測試數，再讀對應區間。",
    ],
    complexity:
      "令上界 U=10⁶，預處理 O(U log log U)，Q 筆查詢 O(Q)，空間 O(U)。",
    pitfall: "數字本身與數位和都要是質數；17 雖是質數，1+7=8 因而不合格。",
    traceLabel: "示意：區間 [10,20]",
    trace: [
      {
        title: "候選質數",
        description: "只有 11、13、17、19 需再檢查數位和。",
        cells: ["11", "13", "17", "19"],
        active: [0, 1, 2, 3],
        variables: [["候選數", "4"]],
      },
      {
        title: "檢查數位和",
        description: "數位和依序為 2、4、8、10，只有 2 是質數。",
        cells: ["11→2✓", "13→4", "17→8", "19→10"],
        active: [0],
        variables: [["符合", "1"]],
      },
      {
        title: "前綴相減",
        description: "prefix[20]=5，prefix[9]=4，差為 1。",
        cells: ["5", "4", "1"],
        active: [2],
        variables: [["答案", "1"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
using namespace std;
int main() {
    const int limit = 1000000;
    vector<bool> prime(limit, true);
    prime[0] = prime[1] = false;
    for (int p = 2; p * p < limit; p++)
        if (prime[p])
            for (int x = p * p; x < limit; x += p)
                prime[x] = false;
    vector<int> digits(limit), prefix(limit);
    for (int x = 1; x < limit; x++) {
        digits[x] = digits[x / 10] + x % 10;
        prefix[x] = prefix[x - 1] + (prime[x] && prime[digits[x]]);
    }
    int tests, l, r;
    cin >> tests;
    while (tests--) {
        cin >> l >> r;
        cout << prefix[r] - prefix[l - 1] << '\n';
    }
}`,
    python: String.raw`import sys
from array import array

limit = 1000000
prime = bytearray(b'\x01') * limit
prime[:2] = b'\x00\x00'
for p in range(2, 1000):
    if prime[p]:
        prime[p * p :: p] = b'\x00' * ((limit - 1 - p * p) // p + 1)
digits = bytearray(limit)
prefix = array('I', [0]) * limit
for x in range(1, limit):
    digits[x] = digits[x // 10] + x % 10
    prefix[x] = prefix[x - 1] + bool(prime[x] and prime[digits[x]])
it = iter(map(int, sys.stdin.buffer.read().split()))
out = []
for _ in range(next(it)):
    l, r = next(it), next(it)
    out.append(str(prefix[r] - prefix[l - 1]))
sys.stdout.write('\n'.join(out) + '\n')
`,
  }),
  defineCpeLesson("a683", {
    topic: "number-theory",
    level: "medium",
    concept: "循環移位質數表與區間計數",
    goal: "確認每個數字旋轉仍為質數，預算每段的數量。",
    explanation: [
      "先篩出一百萬以內的質數。對質數 x 將十進位字串最左字元移到最右，重複到所有位數都檢查過，只要有一次轉出的數字不是質數，x 就不是 circular prime。旋轉不會增加位數，因此仍可查同一張質數表。",
      "逐數建立 prefix[x]，把通過所有旋轉的 x 各計一次。查詢 [i,j] 時相減 prefix[j]−prefix[i−1]。像 197、971、719 在同一區間中是三個不同整數，不能把整組只算一次。依數量分成 0、1、複數三種固定句子；讀到單獨的 −1 結束。",
    ],
    complexity:
      "令 U=10⁶、十進位位數 D≤6，篩 O(U log log U)，字串旋轉上界 O(U D²)，空間 O(U)。",
    pitfall:
      "輸出 1 時是 Prime.，其餘正數是 Primes.；0 時另用 No Circular Primes.。",
    traceLabel: "示意：檢查 197",
    trace: [
      {
        title: "原數",
        description: "197 是質數。",
        cells: ["197", "971", "719"],
        active: [0],
        variables: [["已通過旋轉", "1"]],
      },
      {
        title: "左旋一次",
        description: "971 也是質數。",
        cells: ["197", "971", "719"],
        active: [1],
        variables: [["已通過旋轉", "2"]],
      },
      {
        title: "左旋兩次",
        description: "719 是質數，所以 197 符合。",
        cells: ["197", "971", "719"],
        active: [2],
        variables: [
          ["已通過旋轉", "3"],
          ["197的貢獻", "1"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <string>
using namespace std;
int main() {
    const int limit = 1000000;
    vector<bool> prime(limit, true);
    prime[0] = prime[1] = false;
    for (int p = 2; p * p < limit; p++)
        if (prime[p])
            for (int x = p * p; x < limit; x += p)
                prime[x] = false;
    vector<int> prefix(limit);
    for (int x = 1; x < limit; x++) {
        bool ok = prime[x];
        if (ok) {
            string s = to_string(x);
            for (int k = 0; k < (int)s.size(); k++) {
                if (!prime[stoi(s)]) {
                    ok = false;
                    break;
                }
                s = s.substr(1) + s[0];
            }
        }
        prefix[x] = prefix[x - 1] + ok;
    }
    int l, r;
    while (cin >> l && l != -1) {
        cin >> r;
        int count = prefix[r] - prefix[l - 1];
        if (!count)
            cout << "No Circular Primes.\n";
        else
            cout << count << (count == 1 ? " Circular Prime.\n" : " Circular Primes.\n");
    }
}`,
    python: String.raw`import sys
from array import array

limit = 1000000
prime = bytearray(b'\x01') * limit
prime[:2] = b'\x00\x00'
for p in range(2, 1000):
    if prime[p]:
        prime[p * p :: p] = b'\x00' * ((limit - 1 - p * p) // p + 1)
prefix = array('I', [0]) * limit
for x in range(1, limit):
    ok = bool(prime[x])
    if ok:
        s = str(x)
        for _ in s:
            if not prime[int(s)]:
                ok = False
                break
            s = s[1:] + s[0]
    prefix[x] = prefix[x - 1] + ok
it = iter(map(int, sys.stdin.buffer.read().split()))
for l in it:
    if l == -1:
        break
    r = next(it)
    count = prefix[r] - prefix[l - 1]
    if count == 0:
        print('No Circular Primes.')
    elif count == 1:
        print('1 Circular Prime.')
    else:
        print(f'{count} Circular Primes.')
`,
  }),
];
