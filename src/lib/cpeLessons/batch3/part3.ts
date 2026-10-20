import { defineCpeLesson } from "@/lib/cpeLessonBuilder";

export const lessons = [
  defineCpeLesson("a620", {
    topic: "search",
    level: "medium",
    concept: "數字多重集合回溯與質數篩",
    goal: "枚舉所有不同正整數，去除前導零與重複紙片造成的重算。",
    explanation: [
      "最多七張紙片，可形成的數字小於 10^7。先用埃氏篩建立這個範圍的質數表，供所有測試共用。每組統計 0–9 紙片數，回溯時選仍有剩的數字 d，將目前值 v 更新成 10v+d；每個非空前綴本身也是候選。",
      "以剩餘數量分支，而非把相同數字紙片視為不同位置，就不會重複產生同一位數排列。起頭的 0 可以略過，因為移除前導零的同一整數必定能用更少紙片產生；如此每個正整數只產生一次。篩表中 0、1 為非質數，直接累計質數候選。第一行 T，逐筆輸出數量。",
    ],
    complexity:
      "一次篩 O(U log log U) 時間、O(U) 空間，U=10^7；每筆至多 O(Σₖ7!/(7−k)!) 個搜尋狀態。",
    pitfall: "011 與 11 只能算一次；1 不是質數，且可使用部分紙片。",
    traceLabel: "示意：紙片 0、1、1",
    trace: [
      {
        title: "一位數",
        description: "只產生 1，0 不可能是質數。",
        cells: ["0×1", "1×2", "候選 1"],
        active: [2],
        variables: [["質數數", "0"]],
      },
      {
        title: "兩位數",
        description: "候選 10、11，其中只有 11 是質數。",
        cells: ["10", "11"],
        active: [1],
        variables: [["質數數", "1"]],
      },
      {
        title: "三位數",
        description: "候選 101、110，只有 101 是質數；011 不另算。",
        cells: ["101", "110", "011=11"],
        active: [0],
        variables: [["答案", "2"]],
      },
    ],
    cpp: String.raw`#include <functional>
#include <iostream>
#include <string>
#include <vector>
using namespace std;
int main() {
    const int limit = 10000000;
    vector<bool> prime(limit, true);
    prime[0] = prime[1] = false;
    for (int p = 2; p * p < limit; ++p)
        if (prime[p])
            for (int j = p * p; j < limit; j += p)
                prime[j] = false;
    int t;
    cin >> t;
    while (t--) {
        string s;
        cin >> s;
        int count[10] = {};
        for (char ch : s)
            ++count[ch - '0'];
        int answer = 0;
        function<void(int)> dfs = [&](int value) {
            for (int d = 0; d < 10; ++d)
                if (count[d] && (value || d)) {
                    --count[d];
                    int next = value * 10 + d;
                    if (prime[next])
                        ++answer;
                    dfs(next);
                    ++count[d];
                }
        };
        dfs(0);
        cout << answer << '\n';
    }
}`,
    python: String.raw`import sys, math

LIMIT = 10000000
prime = bytearray(b'\x01') * LIMIT
prime[0:2] = b'\x00\x00'
for p in range(2, math.isqrt(LIMIT - 1) + 1):
    if prime[p]:
        prime[p * p : LIMIT : p] = b'\x00' * ((LIMIT - 1 - p * p) // p + 1)
it = iter(sys.stdin.buffer.read().split())
for _ in range(int(next(it))):
    counts = [0] * 10
    for ch in next(it):
        counts[ch - 48] += 1

    def dfs(value):
        answer = 0
        for d in range(10):
            if counts[d] and (value or d):
                counts[d] -= 1
                nxt = value * 10 + d
                answer += prime[nxt] + dfs(nxt)
                counts[d] += 1
        return answer

    print(dfs(0))
`,
  }),
  defineCpeLesson("a621", {
    topic: "dp",
    level: "hard",
    concept: "最短路壓縮與子集合購物路線",
    goal: "比較任意優惠子集的折扣與往返油錢，求最大淨節省。",
    explanation: [
      "先以整數分讀取道路費與折扣，避免小數誤差。Floyd–Warshall 求任兩站最便宜路費，平行道路先取最小；同店多張 DVD 折扣可全部取得而無額外路程，所以先加總成一個優惠店。將家與優惠店作為路線 DP 的節點。",
      "定義 best(u,mask) 為目前在 u、mask 中優惠尚未使用時，接下來直到回家可得到的最大淨收益。可以立即回家，收益 −dist[u][0]；或選一個未訪店 v，得到 save[v]−dist[u][v]+best(v,mask−v)。每次少一個位元，因此記憶化能避免重複排列；起點 best(0,full) 也包含不出門的 0。輸出正金額才說 Daniel can save $D.CC，否則 Don't leave the house。",
    ],
    complexity: "時間 O(N³+P²2^P)，空間 O(N²+P2^P)，P≤12。",
    pitfall:
      "不能只去單店淨利為正的店，多店共享路程可能一起划算；重複商店要合併折扣。",
    traceLabel: "示意：家到店 1 成本 100 分，店 1 折扣 250 分",
    trace: [
      {
        title: "不出門",
        description: "保持在家可節省 0。",
        cells: ["家 0", "店 1"],
        active: [0],
        variables: [["基準", "0 分"]],
      },
      {
        title: "到店購買",
        description: "去程花 100，優惠得 250，暫時淨額 150。",
        cells: ["−100", "+250"],
        active: [0, 1],
        variables: [["暫計", "150 分"]],
      },
      {
        title: "扣回程",
        description: "再付 100 回家，淨省 50 分，輸出 $0.50。",
        cells: ["150", "−100", "50"],
        active: [2],
        variables: [["答案", "0.50"]],
      },
    ],
    cpp: String.raw`#include <algorithm>
#include <functional>
#include <iomanip>
#include <iostream>
#include <map>
#include <string>
#include <vector>
using namespace std;
long long cents(string s) {
    auto p = s.find('.');
    if (p == string::npos)
        return stoll(s) * 100;
    string f = s.substr(p + 1) + "00";
    return stoll(s.substr(0, p)) * 100 + stoll(f.substr(0, 2));
}
int main() {
    int t;
    cin >> t;
    while (t--) {
        int n, m;
        cin >> n >> m;
        const long long INF = 4000000000000000000LL;
        vector<vector<long long>> d(n + 1, vector<long long>(n + 1, INF));
        for (int i = 0; i <= n; ++i)
            d[i][i] = 0;
        while (m--) {
            int u, v;
            string cost;
            cin >> u >> v >> cost;
            d[u][v] = d[v][u] = min(d[u][v], cents(cost));
        }
        for (int k = 0; k <= n; ++k)
            for (int i = 0; i <= n; ++i)
                for (int j = 0; j <= n; ++j)
                    d[i][j] = min(d[i][j], d[i][k] + d[k][j]);
        int p;
        cin >> p;
        map<int, long long> savings;
        while (p--) {
            int v;
            string value;
            cin >> v >> value;
            savings[v] += cents(value);
        }
        vector<int> node = {0};
        vector<long long> save = {0};
        for (auto [v, s] : savings) {
            node.push_back(v);
            save.push_back(s);
        }
        p = savings.size();
        vector<vector<long long>> memo(p + 1, vector<long long>(1 << p, -INF));
        function<long long(int, int)> best = [&](int u, int mask) {
            long long &ans = memo[u][mask];
            if (ans != -INF)
                return ans;
            ans = -d[node[u]][0];
            for (int v = 1; v <= p; ++v)
                if (mask & (1 << (v - 1)))
                    ans = max(ans, save[v] - d[node[u]][node[v]] + best(v, mask ^ (1 << (v - 1))));
            return ans;
        };
        long long answer = best(0, (1 << p) - 1);
        if (answer <= 0)
            cout << "Don't leave the house\n";
        else
            cout << "Daniel can save $" << answer / 100 << '.' << setw(2) << setfill('0')
                 << answer % 100 << setfill(' ') << '\n';
    }
}`,
    python: String.raw`import sys
from functools import lru_cache


def cents(token):
    s = token.decode()
    whole, _, fraction = s.partition('.')
    return int(whole) * 100 + int((fraction + '00')[:2])


it = iter(sys.stdin.buffer.read().split())
for _ in range(int(next(it))):
    n, m = int(next(it)), int(next(it))
    dist = [[10**60] * (n + 1) for _ in range(n + 1)]
    for i in range(n + 1):
        dist[i][i] = 0
    for _ in range(m):
        u, v, cost = int(next(it)), int(next(it)), cents(next(it))
        dist[u][v] = dist[v][u] = min(dist[u][v], cost)
    for k in range(n + 1):
        for i in range(n + 1):
            for j in range(n + 1):
                dist[i][j] = min(dist[i][j], dist[i][k] + dist[k][j])
    savings = {}
    for _ in range(int(next(it))):
        v, value = int(next(it)), cents(next(it))
        savings[v] = savings.get(v, 0) + value
    nodes = [0] + list(savings)
    save = [0] + list(savings.values())
    p = len(savings)

    @lru_cache(None)
    def best(u, mask):
        answer = -dist[nodes[u]][0]
        for v in range(1, p + 1):
            bit = 1 << (v - 1)
            if mask & bit:
                answer = max(answer, save[v] - dist[nodes[u]][nodes[v]] + best(v, mask ^ bit))
        return answer

    answer = best(0, (1 << p) - 1)
    print(
        'Daniel can save $' + f'{answer // 100}.{answer % 100:02d}'
        if answer > 0
        else "Don't leave the house"
    )
`,
  }),
  defineCpeLesson("a622", {
    topic: "trees",
    level: "hard",
    concept: "集合正規化編號與堆疊語意",
    goal: "用唯一集合編號表示巢狀集合，使相等判斷可重用。",
    explanation: [
      "直接保存無限層巢狀結構很難比較相等。改把每個不同集合對應到唯一整數 ID，而一個集合的內容就是其元素集合的 ID 集合。空集合也有 ID。每次產生新內容，先查正規化字典；內容相同就沿用同一 ID，否則建立新 ID。",
      "堆疊只存 ID。PUSH 放空集合；DUP 複製頂端；UNION、INTERSECT 對兩個內容集合運算。ADD 先彈 A 再彈 B，向 B 加入的是 ID(A) 這一個元素，而非 A 的所有元素。每次操作印頂端內容大小，每組結束印 ***；正規化表可每組重新建立。",
    ],
    complexity:
      "每次集合運算與查表依集合大小 s 而定；C++ 約 O(s log U)，Python 平均 O(s)，U 為已建立集合數。",
    pitfall: "ADD 的方向與層次要分清；空集合與含空集合的集合不是同一個。",
    traceLabel: "示意：PUSH、DUP、ADD、DUP、ADD",
    trace: [
      {
        title: "建立空集合",
        description: "PUSH 後 ID 0 表示 {}；DUP 得兩份 ID 0。",
        cells: ["0:{}", "0:{}"],
        active: [0, 1],
        variables: [["頂端大小", "0"]],
      },
      {
        title: "第一次 ADD",
        description: "把空集合 ID 0 加入另一空集合，得到 ID 1={0}。",
        cells: ["1:{0}"],
        active: [0],
        variables: [["頂端大小", "1"]],
      },
      {
        title: "再次 DUP、ADD",
        description: "把 ID 1 作為元素加入 {0}，得到 {0,1}，大小 2。",
        cells: ["2:{0,1}"],
        active: [0],
        variables: [["頂端大小", "2"]],
      },
    ],
    cpp: String.raw`#include <algorithm>
#include <iostream>
#include <iterator>
#include <map>
#include <set>
#include <string>
#include <vector>
using namespace std;
int main() {
    int t;
    cin >> t;
    while (t--) {
        map<set<int>, int> ids;
        vector<set<int>> values;
        vector<int> stack;
        auto intern = [&](const set<int> &s) {
            auto it = ids.find(s);
            if (it != ids.end())
                return it->second;
            int id = values.size();
            values.push_back(s);
            ids[s] = id;
            return id;
        };
        int empty = intern({}), n;
        cin >> n;
        while (n--) {
            string op;
            cin >> op;
            if (op == "PUSH")
                stack.push_back(empty);
            else if (op == "DUP")
                stack.push_back(stack.back());
            else {
                int a = stack.back();
                stack.pop_back();
                int b = stack.back();
                stack.pop_back();
                set<int> s;
                if (op == "ADD") {
                    s = values[b];
                    s.insert(a);
                } else if (op == "UNION")
                    set_union(values[a].begin(), values[a].end(), values[b].begin(),
                              values[b].end(), inserter(s, s.end()));
                else
                    set_intersection(values[a].begin(), values[a].end(), values[b].begin(),
                                     values[b].end(), inserter(s, s.end()));
                stack.push_back(intern(s));
            }
            cout << values[stack.back()].size() << '\n';
        }
        cout << "***\n";
    }
}`,
    python: String.raw`import sys

it = iter(sys.stdin.buffer.read().split())
for _ in range(int(next(it))):
    values, ids, stack = [], {}, []

    def intern(s):
        if s not in ids:
            ids[s] = len(values)
            values.append(s)
        return ids[s]

    empty = intern(frozenset())
    for _ in range(int(next(it))):
        op = next(it)
        if op == b'PUSH':
            stack.append(empty)
        elif op == b'DUP':
            stack.append(stack[-1])
        else:
            a, b = stack.pop(), stack.pop()
            if op == b'ADD':
                s = values[b] | {a}
            elif op == b'UNION':
                s = values[a] | values[b]
            else:
                s = values[a] & values[b]
            stack.append(intern(frozenset(s)))
        print(len(values[stack[-1]]))
    print('***')
`,
  }),
  defineCpeLesson("a623", {
    topic: "dp",
    level: "medium",
    concept: "最長共同子序列與單列壓縮",
    goal: "保留空白字元，求兩行字串共有的最長子序列長度。",
    explanation: [
      "令 D[i][j] 是第一字串前 i 字與第二字串前 j 字的 LCS 長度。末字相同可接在兩邊都少一字的最佳解後，得到 D[i−1][j−1]+1；不同時至少捨棄其中一個末字，取 max(D[i−1][j],D[i][j−1])。空前綴長度皆為 0。",
      "按列計算時只需上一列；一維 dp[j] 在覆寫前是上方值，dp[j−1] 已是左方值，再用 diagonal 保存左上方舊值。輸入必須兩行成對讀取，空白甚至空行都是字串內容，不能 strip 或以 token 解析。每對輸出一個整數，沒有案例標籤。",
    ],
    complexity: "時間 O(nm)，額外空間 O(m)。",
    pitfall: "共同子序列不必連續；滾動更新前要先保存被覆寫的左上角值。",
    traceLabel: "示意：abc 與 ac",
    trace: [
      {
        title: "處理 a",
        description: "對第二字串前綴 空、a、ac，長度為 0、1、1。",
        cells: ["0", "1", "1"],
        active: [1, 2],
        variables: [["第一字串前綴", "a"]],
      },
      {
        title: "處理 b",
        description: "b 無匹配，新的一列仍是 0、1、1。",
        cells: ["0", "1", "1"],
        active: [1, 2],
        variables: [["第一字串前綴", "ab"]],
      },
      {
        title: "處理 c",
        description: "末字 c 匹配，左上角 1 加一，LCS 長度為 2。",
        cells: ["0", "1", "2"],
        active: [2],
        variables: [
          ["共同子序列", "ac"],
          ["答案", "2"],
        ],
      },
    ],
    cpp: String.raw`#include <algorithm>
#include <iostream>
#include <string>
#include <vector>
using namespace std;
int main() {
    string a, b;
    while (getline(cin, a) && getline(cin, b)) {
        if (!a.empty() && a.back() == '\r')
            a.pop_back();
        if (!b.empty() && b.back() == '\r')
            b.pop_back();
        vector<int> dp(b.size() + 1);
        for (char x : a) {
            int diagonal = 0;
            for (int j = 1; j <= (int)b.size(); ++j) {
                int above = dp[j];
                if (x == b[j - 1])
                    dp[j] = diagonal + 1;
                else
                    dp[j] = max(dp[j], dp[j - 1]);
                diagonal = above;
            }
        }
        cout << dp.back() << '\n';
    }
}`,
    python: String.raw`import sys

lines = iter(sys.stdin.read().splitlines())
for a in lines:
    b = next(lines)
    dp = [0] * (len(b) + 1)
    for x in a:
        diagonal = 0
        for j, y in enumerate(b, 1):
            above = dp[j]
            dp[j] = diagonal + 1 if x == y else max(dp[j], dp[j - 1])
            diagonal = above
    print(dp[-1])
`,
  }),
  defineCpeLesson("a624", {
    topic: "strings",
    level: "easy",
    concept: "有優先序的字尾規則",
    goal: "以互斥條件依序套用英文複數轉換規則。",
    explanation: [
      "先把 L 組不規則對應存成字典，這一層優先於任何字尾規則。若查不到，再檢查字尾是否為 y 且前一字母是子音；只有這種情況把 y 換成 ies，像 turkey 的前一字母是 e，應直接加 s。",
      "其餘再判定 o、s、ch、sh、x 字尾，符合時加 es，最後才是一般加 s。條件必須以 if/else 串接，避免一次套用多條。讀 L、N 後精確處理 N 個單字；長度為 1 的 y 沒有前字母，不可越界讀取。",
    ],
    complexity: "每字 O(Len)，字典儲存 O(L·Len)。",
    pitfall: "不規則詞優先；以 y 結尾不一定換 ies，前一字必須是子音。",
    traceLabel: "示意：city、toy、box",
    trace: [
      {
        title: "city",
        description: "y 前是子音 t，移除 y 後加 ies。",
        cells: ["cit", "y", "ies"],
        active: [1, 2],
        variables: [
          ["輸出", "cities"],
          ["新長度", "6"],
        ],
      },
      {
        title: "toy",
        description: "y 前是母音 o，不套用 ies，直接加 s。",
        cells: ["toy", "s"],
        active: [1],
        variables: [
          ["輸出", "toys"],
          ["新長度", "4"],
        ],
      },
      {
        title: "box",
        description: "以 x 結尾，接上 es。",
        cells: ["box", "es"],
        active: [1],
        variables: [
          ["輸出", "boxes"],
          ["新長度", "5"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <map>
#include <string>
using namespace std;
bool ends(const string &s, const string &tail) {
    return s.size() >= tail.size() && s.compare(s.size() - tail.size(), tail.size(), tail) == 0;
}
int main() {
    int l, n;
    cin >> l >> n;
    map<string, string> irregular;
    string a, b;
    while (l--) {
        cin >> a >> b;
        irregular[a] = b;
    }
    while (n--) {
        cin >> a;
        if (irregular.count(a))
            b = irregular[a];
        else if (a.size() > 1 && a.back() == 'y' &&
                 string("aeiou").find(a[a.size() - 2]) == string::npos)
            b = a.substr(0, a.size() - 1) + "ies";
        else if (ends(a, "o") || ends(a, "s") || ends(a, "ch") || ends(a, "sh") || ends(a, "x"))
            b = a + "es";
        else
            b = a + "s";
        cout << b << '\n';
    }
}`,
    python: String.raw`import sys

it = iter(sys.stdin.read().split())
l, n = int(next(it)), int(next(it))
irregular = {next(it): next(it) for _ in range(l)}
for _ in range(n):
    word = next(it)
    if word in irregular:
        answer = irregular[word]
    elif len(word) > 1 and word.endswith('y') and word[-2] not in 'aeiou':
        answer = word[:-1] + 'ies'
    elif word.endswith(('o', 's', 'ch', 'sh', 'x')):
        answer = word + 'es'
    else:
        answer = word + 's'
    print(answer)
`,
  }),
  defineCpeLesson("a625", {
    topic: "graphs",
    level: "medium",
    concept: "Kruskal 拒絕邊與環上唯一最大邊",
    goal: "找出存在於某個環且最重的邊，並依權重列出。",
    explanation: [
      "邊權互異，將邊由小到大處理。若目前邊兩端已由更輕邊連通，這條邊加上那條連通路徑形成環，且它必為環上最重邊，所以應輸出。若兩端尚未連通，就以並查集合併。",
      "反過來，若一邊是某個環的唯一最重邊，環上其餘邊都較早處理；即使部分被拒絕，Kruskal 仍維持所有已處理邊的連通性，因此其兩端必早已連通而被拒絕。這證明拒絕邊恰好就是答案。圖可不連通，所以建立的是最小生成森林；無拒絕邊輸出 forest。",
    ],
    complexity: "時間 O(m log m+mα(n))，空間 O(n+m)。",
    pitfall: "結論依賴題目保證權重互異；不能只找全圖最大的幾條邊。",
    traceLabel: "示意：三角形邊權 1、2、3",
    trace: [
      {
        title: "加入權 1",
        description: "0 與 1 尚未連通，合併。",
        cells: ["0−1:1", "1−2:2", "2−0:3"],
        active: [0],
        variables: [["分量", "{0,1},{2}"]],
      },
      {
        title: "加入權 2",
        description: "1 與 2 不同根，再合併。",
        cells: ["1 接受", "2 接受", "3 待查"],
        active: [1],
        variables: [["分量數", "1"]],
      },
      {
        title: "拒絕權 3",
        description: "2 與 0 已由 1、2 連通，權 3 為環上最重邊。",
        cells: ["1", "2", "3 拒絕"],
        active: [2],
        variables: [["輸出", "3"]],
      },
    ],
    cpp: String.raw`#include <algorithm>
#include <iostream>
#include <numeric>
#include <tuple>
#include <vector>
using namespace std;
int root(vector<int> &p, int x) {
    while (p[x] != x) {
        p[x] = p[p[x]];
        x = p[x];
    }
    return x;
}
int main() {
    int n, m;
    while (cin >> n >> m && (n || m)) {
        vector<tuple<int, int, int>> edges;
        for (int i = 0; i < m; ++i) {
            int u, v, w;
            cin >> u >> v >> w;
            edges.emplace_back(w, u, v);
        }
        sort(edges.begin(), edges.end());
        vector<int> p(n), size(n, 1), answer;
        iota(p.begin(), p.end(), 0);
        for (auto [w, u, v] : edges) {
            u = root(p, u);
            v = root(p, v);
            if (u == v)
                answer.push_back(w);
            else {
                if (size[u] < size[v])
                    swap(u, v);
                p[v] = u;
                size[u] += size[v];
            }
        }
        if (answer.empty())
            cout << "forest";
        else
            for (int i = 0; i < (int)answer.size(); ++i) {
                if (i)
                    cout << ' ';
                cout << answer[i];
            }
        cout << '\n';
    }
}`,
    python: String.raw`import sys

it = iter(map(int, sys.stdin.buffer.read().split()))
for n in it:
    m = next(it)
    if n == m == 0:
        break
    edges = []
    for _ in range(m):
        u, v, w = next(it), next(it), next(it)
        edges.append((w, u, v))
    parent, size = list(range(n)), [1] * n

    def root(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    answer = []
    for w, u, v in sorted(edges):
        u, v = root(u), root(v)
        if u == v:
            answer.append(w)
        else:
            if size[u] < size[v]:
                u, v = v, u
            parent[v] = u
            size[u] += size[v]
    print(' '.join(map(str, answer)) if answer else 'forest')
`,
  }),
  defineCpeLesson("a626", {
    topic: "graphs",
    level: "hard",
    concept: "多源火勢 BFS 與帶時間限制的逃生 BFS",
    goal: "先算每格著火時間，再找 Joe 能安全離開的最短路。",
    explanation: [
      "把所有 F 同時放進佇列，以多源 BFS 求 fire[v]，即每格最早起火分鐘；牆不可通行，永遠不到的格子時間為無限。這一步把持續變動的火勢轉成靜態的格子截止時間。",
      "再從 J 做 BFS，走到鄰格 v 的時間 t+1 必須嚴格小於 fire[v]，同分鐘到達不安全。若目前位在邊界，下一步走出格外便完成，所以答案是目前時間加一，起點在邊界時為 1。BFS 首次安全到達某格就是最早時間，不需再次入列。Python 以一維編號及緊密整數陣列保存百萬格火勢時間，避免大量座標物件；無路可走印 IMPOSSIBLE。",
    ],
    complexity: "時間 O(RC)，空間 O(RC)。",
    pitfall: "可能有多個火源，必須同時擴散；Joe 不可與火同時進入同一格。",
    traceLabel: "示意：3×3 空地，J=(1,1)，F=(0,0)",
    trace: [
      {
        title: "火勢時間",
        description: "火抵各列時間為 0,1,2／1,2,3／2,3,4。",
        cells: ["0 1 2", "1 2 3", "2 3 4"],
        active: [0],
        variables: [["Joe 起始時間", "0"]],
      },
      {
        title: "安全移動",
        description: "Joe 在第 1 分鐘到 (1,2)，火到此需 3 分鐘。",
        cells: ["(1,1):0", "(1,2):1", "fire(1,2):3"],
        active: [1, 2],
        variables: [["安全判斷", "1<3"]],
      },
      {
        title: "走出邊界",
        description: "下一步在第 2 分鐘離開，最短逃生時間為 2。",
        cells: ["中心 0", "邊界 1", "格外 2"],
        active: [2],
        variables: [["答案", "2"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <queue>
#include <string>
#include <vector>
using namespace std;
int main() {
    int t;
    cin >> t;
    while (t--) {
        int r, c;
        cin >> r >> c;
        vector<string> g(r);
        for (auto &s : g)
            cin >> s;
        vector<int> fire(r * c, -1), time(r * c, -1);
        queue<int> q;
        int start = 0;
        for (int i = 0; i < r; ++i)
            for (int j = 0; j < c; ++j) {
                int v = i * c + j;
                if (g[i][j] == 'F') {
                    fire[v] = 0;
                    q.push(v);
                }
                if (g[i][j] == 'J')
                    start = v;
            }
        int dr[] = {-1, 1, 0, 0}, dc[] = {0, 0, -1, 1};
        while (!q.empty()) {
            int u = q.front();
            q.pop();
            int x = u / c, y = u % c;
            for (int k = 0; k < 4; ++k) {
                int a = x + dr[k], b = y + dc[k];
                if (a < 0 || a >= r || b < 0 || b >= c || g[a][b] == '#')
                    continue;
                int v = a * c + b;
                if (fire[v] < 0) {
                    fire[v] = fire[u] + 1;
                    q.push(v);
                }
            }
        }
        q.push(start);
        time[start] = 0;
        int answer = -1;
        while (!q.empty()) {
            int u = q.front();
            q.pop();
            int x = u / c, y = u % c;
            if (x == 0 || x == r - 1 || y == 0 || y == c - 1) {
                answer = time[u] + 1;
                break;
            }
            for (int k = 0; k < 4; ++k) {
                int a = x + dr[k], b = y + dc[k], v = a * c + b, nt = time[u] + 1;
                if (g[a][b] != '#' && time[v] < 0 && (fire[v] < 0 || nt < fire[v])) {
                    time[v] = nt;
                    q.push(v);
                }
            }
        }
        if (answer < 0)
            cout << "IMPOSSIBLE\n";
        else
            cout << answer << '\n';
    }
}`,
    python: String.raw`import sys
from collections import deque
from array import array

it = iter(sys.stdin.buffer.read().split())
for _ in range(int(next(it))):
    rows, cols = int(next(it)), int(next(it))
    grid = b''.join(next(it) for _ in range(rows))
    size = rows * cols
    fire = array('i', [-1]) * size
    queue = deque()
    start = 0
    for v, ch in enumerate(grid):
        if ch == 70:
            fire[v] = 0
            queue.append(v)
        elif ch == 74:
            start = v

    def neighbors(v):
        x, y = divmod(v, cols)
        if x:
            yield v - cols
        if x + 1 < rows:
            yield v + cols
        if y:
            yield v - 1
        if y + 1 < cols:
            yield v + 1

    while queue:
        u = queue.popleft()
        for v in neighbors(u):
            if grid[v] != 35 and fire[v] < 0:
                fire[v] = fire[u] + 1
                queue.append(v)
    seen = bytearray(size)
    seen[start] = 1
    queue.append(start)
    minute, answer = 0, None
    while queue and answer is None:
        for _ in range(len(queue)):
            u = queue.popleft()
            x, y = divmod(u, cols)
            if x == 0 or x == rows - 1 or y == 0 or y == cols - 1:
                answer = minute + 1
                break
            for v in neighbors(u):
                if grid[v] != 35 and not seen[v] and (fire[v] < 0 or minute + 1 < fire[v]):
                    seen[v] = 1
                    queue.append(v)
        minute += 1
    print(answer if answer is not None else 'IMPOSSIBLE')
`,
  }),
  defineCpeLesson("a627", {
    topic: "graphs",
    level: "hard",
    concept: "有向線圖的出鄰集合條件",
    goal: "以出邊集合相等或互斥判斷是否可還原原圖。",
    explanation: [
      "E 的頂點代表 D 的有向邊。若兩條原邊有同一終點，它們在 E 的出鄰集合必完全相同，都是從該終點出發的邊。若終點不同，出鄰集合則互不相交，因為同一條原邊不可能有兩個起點。因此必要條件是任兩列鄰接集合要麼相同、要麼不相交。",
      "這個條件也充分：把具有相同非空出鄰集合的列視為同一個 D 終點，集合中的 E 頂點均以該點為原邊起點；不同集合互斥，故每個起點指派不衝突。沒有前驅的邊可給新起點，空出鄰集合可接到沒有出邊的終點。允許平行邊及自環使此構造沒有額外限制。以 bitset 儲存每列，檢查交集非空時是否相等；輸出 Case #x: Yes/No。",
    ],
    complexity: "時間 O(m²·⌈m/word⌉+k)，空間 O(m²/word)。",
    pitfall: "不能要求所有列都相同；互不相交的兩列是合法的，空集合也合法。",
    traceLabel: "示意：出鄰 N(0)={1}，N(2)={1,3}",
    trace: [
      {
        title: "建立位元列",
        description: "四個頂點的列中，0 指向 1、2 指向 1 和 3。",
        cells: ["0:0100", "2:0101"],
        active: [0, 1],
        variables: [["共同鄰居數", "1"]],
      },
      {
        title: "共同後繼",
        description: "共享後繼 1，代表原邊 0、2 的終點必相同。",
        cells: ["N(0):{1}", "N(2):{1,3}"],
        active: [0, 1],
        variables: [["交集", "{1}"]],
      },
      {
        title: "發現矛盾",
        description: "相同終點應有相同後繼，但只有 2 能到 3，因此 No。",
        cells: ["1 共同", "3 不一致"],
        active: [1],
        variables: [["判定", "No"]],
      },
    ],
    cpp: String.raw`#include <bitset>
#include <iostream>
#include <vector>
using namespace std;
int main() {
    int t;
    cin >> t;
    for (int cs = 1; cs <= t; ++cs) {
        int m, k;
        cin >> m >> k;
        vector<bitset<300>> out(m);
        while (k--) {
            int x, y;
            cin >> x >> y;
            out[x][y] = 1;
        }
        bool ok = true;
        for (int i = 0; i < m; ++i)
            for (int j = 0; j < i; ++j)
                if ((out[i] & out[j]).any() && out[i] != out[j])
                    ok = false;
        cout << "Case #" << cs << ": " << (ok ? "Yes" : "No") << '\n';
    }
}`,
    python: String.raw`import sys

it = iter(map(int, sys.stdin.buffer.read().split()))
for cs in range(1, next(it) + 1):
    m, k = next(it), next(it)
    out = [0] * m
    for _ in range(k):
        x, y = next(it), next(it)
        out[x] |= 1 << y
    ok = all(not (out[i] & out[j]) or out[i] == out[j] for i in range(m) for j in range(i))
    print(f"Case #{cs}: {'Yes' if ok else 'No'}")
`,
  }),
  defineCpeLesson("a628", {
    topic: "dp",
    level: "medium",
    concept: "有限數值上界的字串切割 DP",
    goal: "以每段最多十位的限制求最大總和。",
    explanation: [
      "令 dp[i] 表示前 i 個數字已完整切分時的最大總和，dp[0]=0。從每個 i 往右延伸下一段，逐字計算 value=10value+digit；若 value≤2147483647，就以 dp[i]+value 更新段落末端。合法切法的最後一段一定會在某次轉移被枚舉，所以遞推能包含所有解。",
      "若段落從 0 開始，只准取單一 0，不能繼續延伸。其他段最多十位，超出整數上限就停止，於是 n≤200 時只需約 10n 次轉移。最大總和可能超過 32 位元，C++ 使用 long long。讀 T 個數字字串，每組輸出 dp[n]，不能把整串直接讀成整數而失去前導零。",
    ],
    complexity: "時間 O(10n)，空間 O(n)。",
    pitfall: "2147483648 不合法，即使只有十位；前導零段只能是單獨的 0。",
    traceLabel: "示意：字串 2147483648",
    trace: [
      {
        title: "整段嘗試",
        description: "2147483648 比上限大 1，不能當成一個數。",
        cells: ["2147483648", "2147483647"],
        active: [0],
        variables: [["整段合法", "否"]],
      },
      {
        title: "候選切法",
        description: "214748364|8 得 214748372；2|147483648 得 147483650。",
        cells: ["214748364+8", "2+147483648"],
        active: [0, 1],
        variables: [["候選值", "214748372,147483650"]],
      },
      {
        title: "最佳總和",
        description: "DP 保留最大可達值，答案為 214748372。",
        cells: ["214748364", "8", "214748372"],
        active: [2],
        variables: [["dp[10]", "214748372"]],
      },
    ],
    cpp: String.raw`#include <algorithm>
#include <iostream>
#include <string>
#include <vector>
using namespace std;
int main() {
    int t;
    cin >> t;
    while (t--) {
        string s;
        cin >> s;
        int n = s.size();
        vector<long long> dp(n + 1, -1);
        dp[0] = 0;
        for (int i = 0; i < n; ++i) {
            long long value = 0;
            for (int j = i; j < n && j < i + 10; ++j) {
                if (j > i && s[i] == '0')
                    break;
                value = value * 10 + s[j] - '0';
                if (value > 2147483647LL)
                    break;
                dp[j + 1] = max(dp[j + 1], dp[i] + value);
            }
        }
        cout << dp[n] << '\n';
    }
}`,
    python: String.raw`import sys

it = iter(sys.stdin.buffer.read().split())
for _ in range(int(next(it))):
    s = next(it)
    n = len(s)
    dp = [-1] * (n + 1)
    dp[0] = 0
    for i in range(n):
        value = 0
        for j in range(i, min(n, i + 10)):
            if j > i and s[i] == 48:
                break
            value = value * 10 + s[j] - 48
            if value > 2147483647:
                break
            dp[j + 1] = max(dp[j + 1], dp[i] + value)
    print(dp[n])
`,
  }),
  defineCpeLesson("a629", {
    topic: "search",
    level: "hard",
    concept: "兩數和配對與互異索引檢查",
    goal: "用 a+b=d−c 將四數搜尋降成二次規模。",
    explanation: [
      "先排序 S，列出所有 i<j 的兩數和。再由大到小枚舉 d，並枚舉不同於它的 c，在已排序的兩數和中二分搜尋 d−c。只要對應配對的兩個索引都與 c、d 不同，就得到合法 a+b+c=d；第一個成功的 d 即最大。",
      "同一和可能有許多配對，但元素互異時，每個索引對固定目標和最多出現在一個配對中，所以 c、d 合計最多排除兩個配對。只檢查該和的前三個配對就足夠判斷是否存在合法配對，避免重複和造成三次方掃描。程式把和加偏移後與配對索引打包成一個 64 位整數排序，Python 也能降低 tuple 記憶體。n=0 結束，無解印 no solution。",
    ],
    complexity: "時間 O(n² log n)，空間 O(n²)。",
    pitfall: "四個值必須來自四個不同索引；不能只測到相同和就接受。",
    traceLabel: "示意：S={2,3,5,7,12}",
    trace: [
      {
        title: "先測最大 d",
        description: "先選 d=12，嘗試 c=7，需要兩數和 5。",
        cells: ["d=12", "c=7", "目標 5"],
        active: [0, 1, 2],
        variables: [["d−c", "5"]],
      },
      {
        title: "二分找到配對",
        description: "2+3=5，配對索引與 7、12 都不同。",
        cells: ["2", "3", "7", "12"],
        active: [0, 1],
        variables: [["互異元素數", "4"]],
      },
      {
        title: "確認答案",
        description: "2+3+7=12，且已由大往小搜尋，所以答案 12。",
        cells: ["2+3+7", "12"],
        active: [1],
        variables: [["最大 d", "12"]],
      },
    ],
    cpp: String.raw`#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;
int main() {
    int n;
    const long long bias = 1LL << 30;
    while (cin >> n && n) {
        vector<long long> a(n);
        for (auto &x : a)
            cin >> x;
        sort(a.begin(), a.end());
        long long base = 1LL * n * n;
        vector<long long> pairs;
        pairs.reserve(n * (n - 1) / 2);
        for (int i = 0; i < n; ++i)
            for (int j = i + 1; j < n; ++j)
                pairs.push_back((a[i] + a[j] + bias) * base + i * n + j);
        sort(pairs.begin(), pairs.end());
        bool found = false;
        long long answer = 0;
        for (int d = n - 1; d >= 0 && !found; --d)
            for (int c = 0; c < n && !found; ++c)
                if (c != d) {
                    long long key = (a[d] - a[c] + bias) * base;
                    auto it = lower_bound(pairs.begin(), pairs.end(), key);
                    for (int k = 0; k < 3 && it != pairs.end() && *it < key + base; ++k, ++it) {
                        long long code = *it % base;
                        int i = code / n, j = code % n;
                        if (i != c && i != d && j != c && j != d) {
                            found = true;
                            answer = a[d];
                            break;
                        }
                    }
                }
        if (found)
            cout << answer << '\n';
        else
            cout << "no solution\n";
    }
}`,
    python: String.raw`import sys
from bisect import bisect_left

it = iter(map(int, sys.stdin.buffer.read().split()))
for n in it:
    if n == 0:
        break
    a = sorted(next(it) for _ in range(n))
    base, bias = n * n, 1 << 30
    pairs = sorted(
        (a[i] + a[j] + bias) * base + i * n + j for i in range(n) for j in range(i + 1, n)
    )
    answer = None
    for d in range(n - 1, -1, -1):
        for c in range(n):
            if c == d:
                continue
            key = (a[d] - a[c] + bias) * base
            at = bisect_left(pairs, key)
            for k in range(at, min(at + 3, len(pairs))):
                if pairs[k] >= key + base:
                    break
                i, j = divmod(pairs[k] % base, n)
                if i != c and i != d and j != c and j != d:
                    answer = a[d]
                    break
            if answer is not None:
                break
        if answer is not None:
            break
    print('no solution' if answer is None else answer)
`,
  }),
  defineCpeLesson("a630", {
    topic: "graphs",
    level: "medium",
    concept: "左右環接地圖的連通塊",
    goal: "先排除國王大陸，再統計其他同字元大陸的最大面積。",
    explanation: [
      "國王所在格的字元定義陸地，不能假設一定是 l。先從國王位置做洪水填充，將其整塊陸地標為已訪；再掃描全圖，每遇到未訪陸地就填充並計數，取最大的分量。",
      "上下座標必須落在 [0,M)，左右則以 (c±1+N)%N 處理，所以同列兩側可以相連。入堆疊時標記，每個陸地只計一次；若剩下沒有其他大陸，初始最大值 0 即答案。輸入組間有空白行，以 token 讀取方格和座標可自然略過，直到 EOF。",
    ],
    complexity: "每組 O(MN) 時間、O(MN) 空間。",
    pitfall: "左右可環接但上下不行；國王自己的整個大陸都不能列入答案。",
    traceLabel: "示意：三列 lwl／www／llw，國王 (0,0)",
    trace: [
      {
        title: "辨認陸地",
        description: "國王字元 l，第一列左右兩格透過環接相連。",
        cells: ["lwl", "www", "llw"],
        active: [0],
        variables: [["國王大陸大小", "2"]],
      },
      {
        title: "排除國王區",
        description: "移除第一列兩塊 l，第三列仍有兩格相連陸地。",
        cells: ["###", "www", "llw"],
        active: [2],
        variables: [["待計大陸", "1"]],
      },
      {
        title: "取得最大",
        description: "剩餘大陸大小 2，答案為 2。",
        cells: ["2 格", "最大 2"],
        active: [1],
        variables: [["答案", "2"]],
      },
    ],
    cpp: String.raw`#include <algorithm>
#include <iostream>
#include <string>
#include <vector>
using namespace std;
int main() {
    int m, n;
    while (cin >> m >> n) {
        vector<string> g(m);
        for (auto &s : g)
            cin >> s;
        int x, y;
        cin >> x >> y;
        char land = g[x][y];
        vector<vector<bool>> seen(m, vector<bool>(n));
        auto flood = [&](int r, int c) {
            vector<pair<int, int>> stack = {{r, c}};
            seen[r][c] = true;
            int count = 0;
            while (!stack.empty()) {
                auto [a, b] = stack.back();
                stack.pop_back();
                ++count;
                int rr[] = {a - 1, a + 1, a, a}, cc[] = {b, b, (b + n - 1) % n, (b + 1) % n};
                for (int k = 0; k < 4; ++k) {
                    int u = rr[k], v = cc[k];
                    if (u >= 0 && u < m && !seen[u][v] && g[u][v] == land) {
                        seen[u][v] = true;
                        stack.push_back({u, v});
                    }
                }
            }
            return count;
        };
        flood(x, y);
        int answer = 0;
        for (int r = 0; r < m; ++r)
            for (int c = 0; c < n; ++c)
                if (g[r][c] == land && !seen[r][c])
                    answer = max(answer, flood(r, c));
        cout << answer << '\n';
    }
}`,
    python: String.raw`import sys

it = iter(sys.stdin.buffer.read().split())
for token in it:
    m, n = int(token), int(next(it))
    g = [next(it) for _ in range(m)]
    x, y = int(next(it)), int(next(it))
    land = g[x][y]
    seen = set()

    def flood(r, c):
        stack = [(r, c)]
        seen.add((r, c))
        count = 0
        while stack:
            a, b = stack.pop()
            count += 1
            for u, v in ((a - 1, b), (a + 1, b), (a, (b - 1) % n), (a, (b + 1) % n)):
                if 0 <= u < m and (u, v) not in seen and g[u][v] == land:
                    seen.add((u, v))
                    stack.append((u, v))
        return count

    flood(x, y)
    answer = 0
    for r in range(m):
        for c in range(n):
            if g[r][c] == land and (r, c) not in seen:
                answer = max(answer, flood(r, c))
    print(answer)
`,
  }),
  defineCpeLesson("a631", {
    topic: "number-theory",
    level: "hard",
    concept: "擴展歐幾里得與最小絕對值係數",
    goal: "求 Bézout 係數後，依本地規則最小化 |X|+|Y|。",
    explanation: [
      "擴展歐幾里得由 A=qB+r 逐層回代，求出 Ax₀+By₀=g。全部整數解是 X=x₀+(B/g)t、Y=y₀−(A/g)t。僅輸出任意係數未必充分，因為本地題敘另外要求最小 |X|+|Y|，並在同分時偏好 X≤Y。",
      "f(t)=|x₀+ut|+|y₀−vt| 是分段線性的凸函數，轉折只在 t=−x₀/u 與 t=y₀/v。因此只需檢查兩轉折附近的 floor 及相鄰整數，選絕對值和最小者。若轉折間形成平坦區，端點仍可取得最小值與要求的方向。程式使用整數向下除法，避免負數除法截斷錯位；A=B 時選 0 1 g。輸入至 EOF，輸出 X Y D。",
    ],
    complexity: "時間 O(log min(A,B))，遞迴空間 O(log min(A,B))。",
    pitfall: "C++ 負數除法向零截斷，不等於 floor；同分要處理 X≤Y 的條件。",
    traceLabel: "示意：A=4、B=6",
    trace: [
      {
        title: "求 gcd",
        description: "6=1×4+2，4=2×2，gcd=2。",
        cells: ["6", "4", "2"],
        active: [2],
        variables: [["D", "2"]],
      },
      {
        title: "回代係數",
        description: "2=6−4，所以可取 X=−1、Y=1。",
        cells: ["4×(−1)", "6×1", "2"],
        active: [0, 1],
        variables: [["|X|+|Y|", "2"]],
      },
      {
        title: "檢查鄰解",
        description: "t=1 時 X=2、Y=−1，和為 3，不如原解。",
        cells: ["(−1,1):2", "(2,−1):3"],
        active: [0],
        variables: [["輸出", "−1 1 2"]],
      },
    ],
    cpp: String.raw`#include <cstdlib>
#include <iostream>
#include <tuple>
#include <vector>
using namespace std;
tuple<long long, long long, long long> egcd(long long a, long long b) {
    if (!b)
        return {a, 1, 0};
    auto [g, x, y] = egcd(b, a % b);
    return {g, y, x - (a / b) * y};
}
long long floorDiv(long long a, long long b) {
    long long q = a / b;
    if (a % b < 0)
        --q;
    return q;
}
int main() {
    long long a, b;
    while (cin >> a >> b) {
        auto [g, x, y] = egcd(a, b);
        long long u = b / g, v = a / g;
        long long bestX = x, bestY = y, best = llabs(x) + llabs(y);
        for (long long center : {floorDiv(-x, u), floorDiv(y, v)})
            for (long long t = center - 1; t <= center + 1; ++t) {
                long long nx = x + u * t, ny = y - v * t, value = llabs(nx) + llabs(ny);
                if (value < best || (value == best && nx <= ny && bestX > bestY)) {
                    best = value;
                    bestX = nx;
                    bestY = ny;
                }
            }
        cout << bestX << ' ' << bestY << ' ' << g << '\n';
    }
}`,
    python: String.raw`import sys


def egcd(a, b):
    if b == 0:
        return a, 1, 0
    g, x, y = egcd(b, a % b)
    return g, y, x - (a // b) * y


it = iter(map(int, sys.stdin.buffer.read().split()))
for a in it:
    b = next(it)
    g, x, y = egcd(a, b)
    u, v = b // g, a // g
    candidates = []
    for center in ((-x) // u, y // v):
        for t in range(center - 1, center + 2):
            nx, ny = x + u * t, y - v * t
            candidates.append((abs(nx) + abs(ny), nx > ny, nx, ny))
    _, _, x, y = min(candidates)
    print(x, y, g)
`,
  }),
  defineCpeLesson("a632", {
    topic: "number-theory",
    level: "medium",
    concept: "質數冪預處理與區間二分",
    goal: "枚舉每個質數的二次以上冪，快速計算閉區間數量。",
    explanation: [
      "只有質數 p 的 p²、p³……才是幾乎質數。上界小於 10^12，所以底數只需篩到 10^6。對每個質數從平方開始反覆乘 p，只要仍小於 10^12 就加入列表；不同質數的正次方不會相等，因此不需額外去重。",
      "將全部質數冪排序後，每個 [low,high] 的數量是 upper_bound(high)−lower_bound(low)。C++ 在乘法前檢查 value>limit/p 就停止，避免超過 64 位元；1 與一次方不加入。一次預處理可服務最多 600 個查詢，每筆輸出整數。",
    ],
    complexity:
      "預處理 O(U log log U+P log P)，每查詢 O(log P)，空間 O(U+P)，U=10^6。",
    pitfall: "像 36 有兩種質因數，不算；質數本身和 1 也不算。",
    traceLabel: "示意：範圍 [1,20]",
    trace: [
      {
        title: "底數 2",
        description: "列出 2²=4、2³=8、2⁴=16。",
        cells: ["4", "8", "16"],
        active: [0, 1, 2],
        variables: [["目前數量", "3"]],
      },
      {
        title: "底數 3",
        description: "3²=9 在區間，3³=27 超出。",
        cells: ["4", "8", "9", "16"],
        active: [2],
        variables: [["目前數量", "4"]],
      },
      {
        title: "其他底數",
        description: "5²=25 已大於 20，最終共 4 個。",
        cells: ["4", "8", "9", "16"],
        active: [0, 1, 2, 3],
        variables: [["答案", "4"]],
      },
    ],
    cpp: String.raw`#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;
int main() {
    const int U = 1000000;
    const long long LIMIT = 999999999999LL;
    vector<bool> prime(U + 1, true);
    prime[0] = prime[1] = false;
    for (int p = 2; p * p <= U; ++p)
        if (prime[p])
            for (int j = p * p; j <= U; j += p)
                prime[j] = false;
    vector<long long> powers;
    for (int p = 2; p <= U; ++p)
        if (prime[p]) {
            long long v = 1LL * p * p;
            while (v <= LIMIT) {
                powers.push_back(v);
                if (v > LIMIT / p)
                    break;
                v *= p;
            }
        }
    sort(powers.begin(), powers.end());
    int t;
    cin >> t;
    while (t--) {
        long long lo, hi;
        cin >> lo >> hi;
        cout << upper_bound(powers.begin(), powers.end(), hi) -
                    lower_bound(powers.begin(), powers.end(), lo)
             << '\n';
    }
}`,
    python: String.raw`import sys, math
from bisect import bisect_left, bisect_right

U, LIMIT = 1000000, 10**12 - 1
prime = bytearray(b'\x01') * (U + 1)
prime[0:2] = b'\x00\x00'
for p in range(2, math.isqrt(U) + 1):
    if prime[p]:
        prime[p * p : U + 1 : p] = b'\x00' * ((U - p * p) // p + 1)
powers = []
for p in range(2, U + 1):
    if prime[p]:
        v = p * p
        while v <= LIMIT:
            powers.append(v)
            v *= p
powers.sort()
it = iter(map(int, sys.stdin.buffer.read().split()))
for _ in range(next(it)):
    lo, hi = next(it), next(it)
    print(bisect_right(powers, hi) - bisect_left(powers, lo))
`,
  }),
  defineCpeLesson("a633", {
    topic: "search",
    level: "easy",
    concept: "正遞增條件與所有二項和唯一性",
    goal: "完整檢查 B2 數列定義，包含同索引相加的組合。",
    explanation: [
      "B2 要求正整數且嚴格遞增，先檢查第一個值大於 0，之後每個值都大於前項；不能排序後才驗證，因為原本順序就是判定條件的一部分。",
      "接著枚舉所有 i≤j 的和，放入集合。若某和已出現，就代表兩個不同配對產生相同和，立刻標記失敗。包含 i=j 才能抓出像 1+3=2+2 的衝突。輸入組間可能空行，整數 token 讀取即可；輸出 Case #k: It is a B2-Sequence. 或否定句，並在每組後留一空行。",
    ],
    complexity: "時間 O(N² log N)（C++ set），Python 平均 O(N²)；空間 O(N²)。",
    pitfall: "不可漏掉 bi+bi；數列要正且原順序嚴格遞增。",
    traceLabel: "示意：數列 1、2、3",
    trace: [
      {
        title: "檢查順序",
        description: "1>0 且 1<2<3，先通過基本條件。",
        cells: ["1", "2", "3"],
        active: [0, 1, 2],
        variables: [["順序合法", "1"]],
      },
      {
        title: "第一列配對",
        description: "1+1=2、1+2=3、1+3=4，三者互異。",
        cells: ["2", "3", "4"],
        active: [0, 1, 2],
        variables: [["已見和數", "3"]],
      },
      {
        title: "找到重複",
        description: "2+2=4，與 1+3 衝突，因此不是 B2。",
        cells: ["1+3=4", "2+2=4"],
        active: [0, 1],
        variables: [["判定", "否"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <set>
#include <vector>
using namespace std;
int main() {
    int n, cs = 0;
    while (cin >> n) {
        vector<int> a(n);
        for (int &x : a)
            cin >> x;
        bool ok = a[0] > 0;
        for (int i = 1; i < n; ++i)
            if (a[i] <= a[i - 1])
                ok = false;
        set<int> sums;
        for (int i = 0; i < n; ++i)
            for (int j = i; j < n; ++j)
                if (!sums.insert(a[i] + a[j]).second)
                    ok = false;
        cout << "Case #" << ++cs << ": It is " << (ok ? "" : "not ") << "a B2-Sequence.\n\n";
    }
}`,
    python: String.raw`import sys

it = iter(map(int, sys.stdin.buffer.read().split()))
cs = 0
for n in it:
    a = [next(it) for _ in range(n)]
    ok = a[0] > 0 and all(a[i] > a[i - 1] for i in range(1, n))
    seen = set()
    for i in range(n):
        for j in range(i, n):
            value = a[i] + a[j]
            if value in seen:
                ok = False
            seen.add(value)
    cs += 1
    print(f"Case #{cs}: It is {'' if ok else 'not '}a B2-Sequence.\n")
`,
  }),
  defineCpeLesson("a634", {
    topic: "number-theory",
    level: "hard",
    concept: "線性丟番圖方程的可行區間與成本斜率",
    goal: "在非負整數盒數中求恰好裝滿且花費最小的解。",
    explanation: [
      "要解 n₁x+n₂y=n。擴展歐幾里得先求 n₁u+n₂v=g；若 n 不被 g 整除，立即 failed。否則特解為 x₀=u(n/g)、y₀=v(n/g)，全部解為 x=x₀+(n₂/g)t、y=y₀−(n₁/g)t。",
      "非負條件形成 t 的閉區間：lo=ceil(−x₀/(n₂/g))，hi=floor(y₀/(n₁/g))，若 lo>hi 無解。成本對 t 的斜率為 c₁(n₂/g)−c₂(n₁/g)，斜率正選 lo，負選 hi；不需枚舉數十億個盒子。使用精確整數 floor/ceil 與 64 位元乘積；題目保證最優解唯一。n=0 結束，輸出 x y。",
    ],
    complexity: "時間 O(log min(n₁,n₂))，空間為擴展歐幾里得遞迴深度。",
    pitfall:
      "價格和容量欄位不要顛倒；直接比較 c₁/n₁ 的浮點單價不能保證整除配置。",
    traceLabel: "示意：n=43，(c₁,n₁)=(1,3)，(c₂,n₂)=(2,4)",
    trace: [
      {
        title: "一個可行解",
        description: "3×1+4×10=43，所以可從 (1,10) 開始。",
        cells: ["x=1", "y=10"],
        active: [0, 1],
        variables: [["成本", "21"]],
      },
      {
        title: "參數化",
        description: "x=1+4t，y=10−3t，非負要求 0≤t≤3。",
        cells: ["t=0", "t=1", "t=2", "t=3"],
        active: [0, 3],
        variables: [["斜率", "4−6=−2"]],
      },
      {
        title: "選右端點",
        description: "斜率負，選 t=3，得到 x=13、y=1，成本 15。",
        cells: ["13×3=39", "1×4=4", "成本 15"],
        active: [0, 1, 2],
        variables: [["輸出", "13 1"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <tuple>
using namespace std;
tuple<long long, long long, long long> egcd(long long a, long long b) {
    if (!b)
        return {a, 1, 0};
    auto [g, x, y] = egcd(b, a % b);
    return {g, y, x - (a / b) * y};
}
long long floorDiv(long long a, long long b) {
    long long q = a / b;
    if (a % b < 0)
        --q;
    return q;
}
int main() {
    long long n;
    while (cin >> n && n) {
        long long c1, n1, c2, n2;
        cin >> c1 >> n1 >> c2 >> n2;
        auto [g, x, y] = egcd(n1, n2);
        if (n % g) {
            cout << "failed\n";
            continue;
        }
        x *= n / g;
        y *= n / g;
        long long dx = n2 / g, dy = n1 / g;
        long long lo = -floorDiv(x, dx), hi = floorDiv(y, dy);
        if (lo > hi) {
            cout << "failed\n";
            continue;
        }
        long long t = (c1 * dx - c2 * dy >= 0) ? lo : hi;
        cout << x + dx * t << ' ' << y - dy * t << '\n';
    }
}`,
    python: String.raw`import sys


def egcd(a, b):
    if b == 0:
        return a, 1, 0
    g, x, y = egcd(b, a % b)
    return g, y, x - (a // b) * y


it = iter(map(int, sys.stdin.buffer.read().split()))
for n in it:
    if n == 0:
        break
    c1, n1, c2, n2 = [next(it) for _ in range(4)]
    g, x, y = egcd(n1, n2)
    if n % g:
        print('failed')
        continue
    x *= n // g
    y *= n // g
    dx, dy = n2 // g, n1 // g
    lo, hi = -(x // dx), y // dy
    if lo > hi:
        print('failed')
        continue
    t = lo if c1 * dx - c2 * dy >= 0 else hi
    print(x + dx * t, y - dy * t)
`,
  }),
  defineCpeLesson("a635", {
    topic: "number-theory",
    level: "medium",
    concept: "變動質數步長的逆向 Josephus 遞推",
    goal: "不用刪除整個圓圈，反向還原最後存活者位置。",
    explanation: [
      "預先篩出至少 3500 個質數，依序作為淘汰步長。一般 Josephus 遞推在剩 size 人時，以零起算的倖存索引 j，補回剛被刪掉的人後會變成 (j+step)%size；這裡步長依淘汰次數改變，所以必須從最後一次淘汰倒著使用質數。",
      "先設只剩一人的 j=0。當重新建立 size=2、3……n 人時，對應正向淘汰次數為 n−size，因此步長是 primes[n−size]。每步更新 j=(j+step)%size，最後轉成一基編號 j+1。n=1 不需淘汰，直接得到 1；輸入 0 結束。",
    ],
    complexity:
      "一次篩 O(U log log U)，每筆 O(n) 時間、O(1) 額外空間，U=40000。",
    pitfall: "倒推時質數也要倒序使用；每次計數從被淘汰者下一人重新開始。",
    traceLabel: "示意：n=4，步長依序 2、3、5",
    trace: [
      {
        title: "補回第二人",
        description: "從 j=0 開始，最後一次步長 5，(0+5)%2=1。",
        cells: ["size=1:j0", "size=2:j1"],
        active: [1],
        variables: [["步長", "5"]],
      },
      {
        title: "補回第三人",
        description: "上一輪步長 3，(1+3)%3=1。",
        cells: ["size=2:j1", "size=3:j1"],
        active: [1],
        variables: [["步長", "3"]],
      },
      {
        title: "補回第四人",
        description: "第一輪步長 2，(1+2)%4=3，一基編號為 4。",
        cells: ["size=3:j1", "size=4:j3", "編號4"],
        active: [2],
        variables: [["答案", "4"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
using namespace std;
int main() {
    const int U = 40000;
    vector<bool> prime(U + 1, true);
    prime[0] = prime[1] = false;
    for (int p = 2; p * p <= U; ++p)
        if (prime[p])
            for (int j = p * p; j <= U; j += p)
                prime[j] = false;
    vector<int> primes;
    for (int i = 2; i <= U; ++i)
        if (prime[i])
            primes.push_back(i);
    int n;
    while (cin >> n && n) {
        int j = 0;
        for (int size = 2; size <= n; ++size)
            j = (j + primes[n - size]) % size;
        cout << j + 1 << '\n';
    }
}`,
    python: String.raw`import sys, math

U = 40000
prime = bytearray(b'\x01') * (U + 1)
prime[0:2] = b'\x00\x00'
for p in range(2, math.isqrt(U) + 1):
    if prime[p]:
        prime[p * p : U + 1 : p] = b'\x00' * ((U - p * p) // p + 1)
primes = [i for i in range(2, U + 1) if prime[i]]
for token in sys.stdin.buffer.read().split():
    n = int(token)
    if n == 0:
        break
    j = 0
    for size in range(2, n + 1):
        j = (j + primes[n - size]) % size
    print(j + 1)
`,
  }),
];
