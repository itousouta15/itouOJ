import type { ToiPotentialLesson } from "@/lib/toiPotentialLessonTypes";
import { defineToiPotentialLesson } from "@/lib/toiPotentialLessonBuilder";

export const lessons: ToiPotentialLesson[] = [
  defineToiPotentialLesson("a141", {
    topic: "math",
    level: "medium",
    concept: "可分配位元與最高位支配",
    goal: "從 OR、AND 找出 x、y 可以不同的位元，直接計算差值極限。",
    explanation: [
      "b 的 1 位元在兩數中都為 1，a 的 0 位元在兩數中都為 0；只有 c=a XOR b 的 1 位元可自由指定給其中一數。共同部分 b 在相減時抵消，所以最大差就是把 c 全部分給同一邊，得到 c。",
      "若 c=0，兩數相等。否則設 c 的最高 1 位元權值為 h。將 h 給較大的一數後，所有較低權值合計 c−h<h，不可能翻轉大小；要縮小差，就把所有較低位元給另一數。因此最小差為 h−(c−h)=2h−c，且這樣的位元分配確實同時符合 OR 與 AND。",
    ],
    complexity:
      "每筆 O(log a) 時間、O(1) 計算空間，位寬最多 30；Python 使用 bit_length 尋最高位。批次輸入輸出額外 O(T)。",
    pitfall: "答案列印順序是最大值、最小值。c=0 時不可對零尋最高位或做負位移。",
    traceLabel: "公開範例第一筆：a=13、b=8",
    trace: [
      {
        title: "區分固定與自由位元",
        description: "13=1101、8=1000，自由位元是 0101。",
        cells: ["a:1101", "b:1000", "c:0101"],
        active: [2],
        variables: [["c", "5"]],
      },
      {
        title: "最大差",
        description: "自由位元都給 x，取 x=13、y=8，差為 5。",
        cells: ["x=13", "y=8", "差5"],
        active: [2],
        variables: [["最大", "5"]],
      },
      {
        title: "最小差",
        description: "最高自由位 4 給 x、低位 1 給 y，得到 x=12、y=9，差為 3。",
        cells: ["x:1100", "y:1001", "2×4−5=3"],
        active: [2],
        variables: [
          ["最小", "3"],
          ["輸出", "5 3"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
using namespace std;
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int t;
    cin >> t;
    while (t--) {
        long long a, b;
        cin >> a >> b;
        long long c = a ^ b;
        if (c == 0) {
            cout << "0 0\n";
            continue;
        }
        long long h = 1;
        while ((h << 1) <= c)
            h <<= 1;
        cout << c << ' ' << 2 * h - c << '\n';
    }
}
`,
    python: String.raw`import sys


def main():
    it = iter(map(int, sys.stdin.buffer.read().split()))
    t = next(it)
    output = []
    for _ in range(t):
        a, b = next(it), next(it)
        c = a ^ b
        minimum = 0 if c == 0 else 2 * (1 << (c.bit_length() - 1)) - c
        output.append(f"{c} {minimum}")
    print("\n".join(output))


if __name__ == "__main__":
    main()
`,
  }),
  defineToiPotentialLesson("a142", {
    topic: "math",
    level: "medium",
    concept: "整數乘積分拆的局部替換證明",
    goal: "將最大乘積化成 3 的快速冪，處理餘數 1 的例外。",
    explanation: [
      "因允許只有一項，x≤4 時直接取 x 就是最佳。對更大 x，若某項 k≥5，把它改為 3 與 k−3，乘積 3(k−3)>k；因此最佳分拆可限於 2、3、4。1 與其他項合併會提升乘積，4 可視為兩個 2，而三個 2 的乘積 8 小於兩個 3 的乘積 9，所以應盡量使用 3。",
      "若 x=3q，答案為 3^q；餘 2 時為 3^q×2；餘 1 時不留 1，改把一個 3 與它合為 4，答案為 3^(q−1)×4。先由交換證明決定真正最大乘積的結構，再模 1000000007；不能比較模後的大小來決定分拆。指數可達 10^18 的量級，以快速冪處理。",
    ],
    complexity:
      "每筆時間 O(log x)、計算額外空間 O(1)，T≤10000、x≤10^18；批次輸出 O(T)。",
    pitfall: "允許不拆，因此 x=2、3 的答案是 2、3；不是至少拆成兩項的版本。",
    traceLabel: "公開範例 x=10：處理餘數 1",
    trace: [
      {
        title: "先盡量用 3",
        description: "10=3+3+3+1，乘積只有 27。",
        cells: ["3", "3", "3", "1"],
        active: [2, 3],
        variables: [["乘積", "27"]],
      },
      {
        title: "把 3+1 換成 4",
        description: "3×1=3 小於 4，改為 3+3+4。",
        cells: ["3", "3", "4"],
        active: [2],
        variables: [["乘積", "36"]],
      },
      {
        title: "快速冪公式",
        description: "q=3、r=1，計算 3^(3−1)×4=36。",
        cells: ["3^2=9", "9×4=36"],
        active: [0, 1],
        variables: [["輸出", "36"]],
      },
    ],
    cpp: String.raw`#include <iostream>
using namespace std;
const long long MOD = 1000000007;
long long power(long long a, long long e) {
    long long result = 1;
    while (e) {
        if (e & 1)
            result = result * a % MOD;
        a = a * a % MOD;
        e >>= 1;
    }
    return result;
}
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int t;
    cin >> t;
    while (t--) {
        long long x;
        cin >> x;
        if (x <= 4) {
            cout << x << '\n';
            continue;
        }
        long long q = x / 3, r = x % 3;
        long long answer = r == 0   ? power(3, q)
                           : r == 1 ? power(3, q - 1) * 4 % MOD
                                    : power(3, q) * 2 % MOD;
        cout << answer << '\n';
    }
}
`,
    python: String.raw`import sys


def main():
    data = list(map(int, sys.stdin.buffer.read().split()))
    mod = 1000000007
    output = []
    for x in data[1 : 1 + data[0]]:
        if x <= 4:
            answer = x
        else:
            q, r = divmod(x, 3)
            if r == 0:
                answer = pow(3, q, mod)
            elif r == 1:
                answer = pow(3, q - 1, mod) * 4 % mod
            else:
                answer = pow(3, q, mod) * 2 % mod
        output.append(str(answer))
    print("\n".join(output))


if __name__ == "__main__":
    main()
`,
  }),
  defineToiPotentialLesson("a143", {
    topic: "math",
    level: "easy",
    concept: "切點與有序分拆的一一對應",
    goal: "把無限磁磚的排列計數轉成 L−1 個獨立二元選擇。",
    explanation: [
      "把長 L 的路看成 L 個單位格，相鄰格之間共有 L−1 個內部邊界。每個邊界可選擇切開或不切開；相鄰切點間的長度就是一片磁磚，而且所有 1..L 的長度都供應無限片。",
      "任一鋪法唯一決定切點，任一切點集合也唯一決定由左至右的磁磚序列，所以方法數恰是 2^(L−1)。順序不同通常對應不同切點，例如長 3 的 [1,2] 與 [2,1]。L 可達 10^9，使用模快速冪，不可逐格 DP 或真的建立道路。",
    ],
    complexity: "每筆 O(log L) 時間、O(1) 計算空間；T≤10000，批次輸出 O(T)。",
    pitfall: "不是不計順序的整數分割。L=1 沒有內部邊界，仍有一種鋪法。",
    traceLabel: "示意輸入：L=3",
    trace: [
      {
        title: "找兩個內部邊界",
        description: "三個單位格之間有兩處可以切。",
        cells: ["1", "邊界A", "1", "邊界B", "1"],
        active: [1, 3],
        variables: [["邊界數", "2"]],
      },
      {
        title: "A 不切",
        description: "B 不切得到 [3]；B 切開得到 [2,1]。",
        cells: ["[3]", "[2,1]"],
        active: [0, 1],
        variables: [["目前方法", "2"]],
      },
      {
        title: "A 切開",
        description: "B 不切得到 [1,2]；B 切開得到 [1,1,1]，共四種。",
        cells: ["[1,2]", "[1,1,1]"],
        active: [0, 1],
        variables: [["2^2", "4"]],
      },
    ],
    cpp: String.raw`#include <iostream>
using namespace std;
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    const long long MOD = 1000000007;
    int t;
    cin >> t;
    while (t--) {
        long long length;
        cin >> length;
        long long e = length - 1, base = 2, answer = 1;
        while (e) {
            if (e & 1)
                answer = answer * base % MOD;
            base = base * base % MOD;
            e >>= 1;
        }
        cout << answer << '\n';
    }
}
`,
    python: String.raw`import sys


def main():
    data = list(map(int, sys.stdin.buffer.read().split()))
    print("\n".join(str(pow(2, length - 1, 1000000007)) for length in data[1 : 1 + data[0]]))


if __name__ == "__main__":
    main()
`,
  }),
  defineToiPotentialLesson("a144", {
    topic: "search",
    level: "medium",
    concept: "單調費用的整數二分",
    goal: "找出總平方升等費用不超過 C 的最大共同最低等級。",
    explanation: [
      "給定目標 U，費用 cost(U)=Σmax(0,U−a[i])²；原本已高於 U 的士兵不用降級也不用付款。每一項隨 U 單調不減，所以可行目標形成連續前綴，可二分最大可行值。累加費用一旦超過 C 就停止，此後非負費用無法使它回到可行。",
      "令最小初始等級為 m，m 一定可行；至少有一位士兵初始為 m，故 U 不可能大於 m+floor(sqrt(C))。取超過這個界的一點作不可行右界，維持 lo 可行、hi 不可行；測試中點後只移動相應邊界。兩界相鄰時 lo 就是所求最大值。C++ 依 C≤10^14 使用 m+10000001 作安全右界。",
    ],
    complexity:
      "每次檢查 O(N)，二分 O(log 10^7) 輪，空間 O(N)。N≤20000、C≤10^14；平方與累加用 64 位元，且超預算立即停止。",
    pitfall:
      "只支付低於 U 者的平方差，不是把全體差值相加後平方。二分上界不能只取最高原始等級。",
    traceLabel: "公開範例：等級 1,4,7；金幣 22",
    trace: [
      {
        title: "測試 U=4",
        description: "只有第一位需升等，費用 (4−1)²=9，可行。",
        cells: ["1→4：9", "4：0", "7：0"],
        active: [0],
        variables: [["cost(4)", "9≤22"]],
      },
      {
        title: "測試 U=5",
        description: "費用 (5−1)²+(5−4)²=16+1=17，可行。",
        cells: ["16", "1", "0"],
        active: [0, 1],
        variables: [["cost(5)", "17≤22"]],
      },
      {
        title: "測試 U=6",
        description: "僅第一位就需 25 枚，已超過 22；因此最大可行是 5。",
        cells: ["25>22", "停止累加", "答案5"],
        active: [0, 2],
        variables: [["最大 U", "5"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    long long budget;
    cin >> n >> budget;
    vector<long long> a(n);
    for (auto &x : a)
        cin >> x;
    auto possible = [&](long long u) {
        long long cost = 0;
        for (long long x : a)
            if (x < u) {
                long long delta = u - x;
                cost += delta * delta;
                if (cost > budget)
                    return false;
            }
        return true;
    };
    long long lo = *min_element(a.begin(), a.end()), hi = lo + 10000001;
    while (lo + 1 < hi) {
        long long mid = lo + (hi - lo) / 2;
        if (possible(mid))
            lo = mid;
        else
            hi = mid;
    }
    cout << lo << '\n';
}
`,
    python: String.raw`import sys
from math import isqrt


def main():
    data = list(map(int, sys.stdin.buffer.read().split()))
    n, budget = data[:2]
    levels = data[2 : 2 + n]

    def possible(u):
        cost = 0
        for level in levels:
            if level < u:
                cost += (u - level) ** 2
                if cost > budget:
                    return False
        return True

    lo = min(levels)
    hi = lo + isqrt(budget) + 1
    while lo + 1 < hi:
        mid = (lo + hi) // 2
        if possible(mid):
            lo = mid
        else:
            hi = mid
    print(lo)


if __name__ == "__main__":
    main()
`,
  }),
  defineToiPotentialLesson("a145", {
    topic: "search",
    level: "hard",
    concept: "三色回溯、群組對稱與人數下界剪枝",
    goal: "完整搜尋合法三分組，並在搜尋過程排除不可能改善的人數差。",
    explanation: [
      "將朋友關係存為每位學生的鄰接位元集合，先依朋友數由多到少安排學生。每次嘗試加入某組，若該組成員位元集合與此學生的朋友集合交集為空，就沒有組內朋友。三組名稱不影響結果，因此多個空組只需嘗試第一個；每種沒有名稱的分組仍有一個代表，不會漏解。",
      "已放置的人數不能減少。若尚餘 r 人，最終最大組至少是 max(目前最大人數,ceil(N/3))，最終最小組至多是 min(目前最小人數+r,floor(N/3))，兩者之差是樂觀下界。下界已不小於最佳答案時即可剪枝。完整分組時更新最大減最小；一旦達到理論最佳 N 能被 3 整除時的 0、否則的 1，就不用再搜尋。所有分支皆失敗則輸出 −1。",
    ],
    complexity:
      "最壞時間 O(3^N+N²)，額外空間 O(N)，N≤16；排序、合法性與對稱剪枝減少實際分支，但不宣稱多項式時間。",
    pitfall:
      "這不是二分圖判斷；三角形仍可三分組。不可找到第一個合法分組就停止，必須最佳化人數差。",
    traceLabel: "公開範例：朋友三角形 1,2,3 與邊 4−5",
    trace: [
      {
        title: "三角形分居三組",
        description: "學生 1、2、3 兩兩為朋友，分別放 A、B、C。",
        cells: ["A:{1}", "B:{2}", "C:{3}"],
        active: [0, 1, 2],
        variables: [["人數", "1,1,1"]],
      },
      {
        title: "處理 4 與 5",
        description: "4 放 A、5 放 B，避免朋友 4−5 同組。",
        cells: ["A:{1,4}", "B:{2,5}", "C:{3}"],
        active: [0, 1],
        variables: [["人數", "2,2,1"]],
      },
      {
        title: "無朋友的 6 補最小組",
        description: "6 放 C，三組各 2 人；差 0 已達下界。",
        cells: ["A:{1,4}", "B:{2,5}", "C:{3,6}"],
        active: [2],
        variables: [["答案", "0"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <array>
#include <algorithm>
#include <numeric>
#include <functional>
using namespace std;
int main() {
    int n, m;
    cin >> n >> m;
    vector<int> adj(n, 0), degree(n, 0), order(n);
    for (int i = 0; i < m; ++i) {
        int u, v;
        cin >> u >> v;
        --u;
        --v;
        adj[u] |= 1 << v;
        adj[v] |= 1 << u;
        ++degree[u];
        ++degree[v];
    }
    iota(order.begin(), order.end(), 0);
    stable_sort(order.begin(), order.end(), [&](int u, int v) { return degree[u] > degree[v]; });
    array<int, 3> groups{}, sizes{};
    int best = n + 1, optimum = (n % 3 != 0);
    function<void(int)> dfs = [&](int index) {
        if (best == optimum)
            return;
        int small = *min_element(sizes.begin(), sizes.end()),
            large = *max_element(sizes.begin(), sizes.end());
        int lower = max(large, (n + 2) / 3) - min(small + n - index, n / 3);
        if (lower >= best)
            return;
        if (index == n) {
            if (small > 0)
                best = min(best, large - small);
            return;
        }
        int u = order[index];
        array<int, 3> choices{0, 1, 2};
        stable_sort(choices.begin(), choices.end(),
                    [&](int a, int b) { return sizes[a] < sizes[b]; });
        bool usedEmpty = false;
        for (int g : choices) {
            if (sizes[g] == 0) {
                if (usedEmpty)
                    continue;
                usedEmpty = true;
            }
            if (groups[g] & adj[u])
                continue;
            groups[g] |= 1 << u;
            ++sizes[g];
            dfs(index + 1);
            --sizes[g];
            groups[g] ^= 1 << u;
        }
    };
    dfs(0);
    cout << (best == n + 1 ? -1 : best) << '\n';
}
`,
    python: String.raw`import sys


def main():
    it = iter(map(int, sys.stdin.buffer.read().split()))
    n, m = next(it), next(it)
    adj = [0] * n
    for _ in range(m):
        u, v = next(it) - 1, next(it) - 1
        adj[u] |= 1 << v
        adj[v] |= 1 << u
    order = sorted(range(n), key=lambda u: adj[u].bit_count(), reverse=True)
    groups, sizes = [0] * 3, [0] * 3
    best = n + 1
    optimum = int(n % 3 != 0)

    def dfs(index):
        nonlocal best
        if best == optimum:
            return
        small, large = min(sizes), max(sizes)
        lower = max(large, (n + 2) // 3) - min(small + n - index, n // 3)
        if lower >= best:
            return
        if index == n:
            if small:
                best = min(best, large - small)
            return
        u = order[index]
        used_empty = False
        for g in sorted(range(3), key=lambda g: sizes[g]):
            if sizes[g] == 0:
                if used_empty:
                    continue
                used_empty = True
            if groups[g] & adj[u]:
                continue
            groups[g] |= 1 << u
            sizes[g] += 1
            dfs(index + 1)
            sizes[g] -= 1
            groups[g] ^= 1 << u

    dfs(0)
    print(-1 if best == n + 1 else best)


if __name__ == "__main__":
    main()
`,
  }),
  defineToiPotentialLesson("a146", {
    topic: "dp",
    level: "medium",
    concept: "等重二分的 0/1 子集合和",
    goal: "由全部砝碼的半總重判斷兩堆是否能平衡。",
    explanation: [
      "所有砝碼都必須使用，若總重 S 是奇數就不可能平分。若 S 是偶數，只要找到一個子集合總重 S/2，剩下所有砝碼的總重也會自動是 S/2，不必同時追蹤兩堆。",
      "C++ 令 reachable[s] 記錄能否用已讀砝碼湊出 s，每件 w 由大到小更新 reachable[s] |= reachable[s−w]，確保每件最多一次。Python 用整數位元集合，bit s=1 表示 s 可達，每件更新 bits |= bits<<w，右側只依賴更新前的集合；遮罩保留到 S/2 即可。兩者都把選或不選一件的狀態取聯集。",
    ],
    complexity:
      "S≤100000、目標≤50000。C++ 時間 O(NS)、空間 O(S)；Python 位元集合約 O(NS/word) 個機器字操作、O(S) 位元，另需 O(N) 存輸入。",
    pitfall:
      "不能漏用或重用砝碼。C++ 的容量若由小到大更新，就會錯把同一個砝碼使用多次。",
    traceLabel: "公開範例：2,3,4,5，目標 7",
    trace: [
      {
        title: "加入 2 與 3",
        description: "從 {0} 開始，可達重量成為 {0,2,3,5}。",
        cells: ["0", "2", "3", "5"],
        active: [1, 2, 3],
        variables: [["target", "7"]],
      },
      {
        title: "加入 4",
        description: "舊的 3 加上 4 得到 7，找到其中一堆。",
        cells: ["3+4=7", "剩下2,5"],
        active: [0],
        variables: [["reachable[7]", "true"]],
      },
      {
        title: "分配全部砝碼",
        description: "兩堆為 {3,4} 與 {2,5}，每堆重 7。",
        cells: ["3+4=7", "2+5=7"],
        active: [0, 1],
        variables: [["輸出", "1"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <numeric>
using namespace std;
int main() {
    int n;
    cin >> n;
    vector<int> w(n);
    for (auto &x : w)
        cin >> x;
    int total = accumulate(w.begin(), w.end(), 0);
    if (total % 2) {
        cout << "0\n";
        return 0;
    }
    int target = total / 2;
    vector<unsigned char> reachable(target + 1, 0);
    reachable[0] = 1;
    for (int x : w)
        for (int s = target; s >= x; --s)
            reachable[s] |= reachable[s - x];
    cout << int(reachable[target]) << '\n';
}
`,
    python: String.raw`import sys


def main():
    data = list(map(int, sys.stdin.buffer.read().split()))
    weights = data[1 : 1 + data[0]]
    total = sum(weights)
    if total % 2:
        print(0)
        return
    target = total // 2
    bits = 1
    mask = (1 << (target + 1)) - 1
    for weight in weights:
        bits = (bits | (bits << weight)) & mask
    print((bits >> target) & 1)


if __name__ == "__main__":
    main()
`,
  }),
  defineToiPotentialLesson("a147", {
    topic: "search",
    level: "hard",
    concept: "騎士圖上的勝負位元狀態搜尋",
    goal: "列舉所有合法取子邊，以記憶化搜尋判斷雙方最佳策略。",
    explanation: [
      "只替有棋子的格子編號，兩棋子差一個騎士步時連邊。剩餘棋子用 K 位元 mask 表示，一步就是刪除某條邊的兩個端點；沒有可用邊就是必敗。有任一步能使對手進入必敗狀態，當前就是必勝；所有步都送對手到必勝狀態則為必敗。每步少兩子，因此遞迴不會成環。",
      "棋子若在目前 mask 中已沒有任何鄰居，之後也不可能重新獲得鄰居，故可安全移除這些孤立點以合併等價狀態。用 bytearray 或 unsigned char 陣列記錄未知、必敗、必勝三種值，避免每個狀態建立雜湊物件。初始最多 25 子，狀態上界為 2^25；不能僅憑棋子總數或某個最大匹配的奇偶判勝，因為玩家會選擇不同的合法邊。",
    ],
    complexity:
      "令 K≤25、E 為初始合法騎士邊數。最壞時間 O((K+E)2^K)、空間 O(2^K+K+E)，密集快取最多 32 MiB，遞迴深度至多 floor(K/2)+1。",
    pitfall:
      "一次移除的是一對相差騎士步的現有棋子。空棋盤或只剩孤立棋子時，先手直接輸，輸出 Dave。",
    traceLabel: "公開範例：棋子在 (1,1)、(2,2)、(2,3)",
    trace: [
      {
        title: "建立合法邊",
        description: "只有 (1,1) 與 (2,3) 相差騎士步；(2,2) 是孤立點。",
        cells: ["A=(1,1)", "B=(2,2)", "C=(2,3)"],
        active: [0, 2],
        variables: [["合法邊", "A−C"]],
      },
      {
        title: "Charlie 取走 A、C",
        description: "移除這兩枚棋子，只剩無法搭配的 B。",
        cells: ["A移除", "B保留", "C移除"],
        active: [0, 2],
        variables: [["下一位", "Dave"]],
      },
      {
        title: "Dave 無路可走",
        description: "剩餘圖沒有邊，是必敗狀態；Charlie 的這一步保證勝利。",
        cells: ["B孤立", "無合法邊"],
        active: [1],
        variables: [["勝者", "Charlie"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <string>
#include <functional>
#include <cstdlib>
using namespace std;
int main() {
    int r, c;
    cin >> r >> c;
    vector<pair<int, int>> pos;
    for (int i = 0; i < r; ++i) {
        string row;
        cin >> row;
        for (int j = 0; j < c; ++j)
            if (row[j] == '@')
                pos.push_back({i, j});
    }
    int k = int(pos.size());
    vector<unsigned int> adj(k, 0), edges;
    for (int i = 0; i < k; ++i)
        for (int j = i + 1; j < k; ++j) {
            int dr = abs(pos[i].first - pos[j].first), dc = abs(pos[i].second - pos[j].second);
            if ((dr == 1 && dc == 2) || (dr == 2 && dc == 1)) {
                adj[i] |= 1u << j;
                adj[j] |= 1u << i;
                edges.push_back((1u << i) | (1u << j));
            }
        }
    vector<unsigned char> memo(1u << k, 0);
    memo[0] = 1;
    function<bool(unsigned int)> win = [&](unsigned int mask) {
        if (memo[mask])
            return memo[mask] == 2;
        unsigned int original = mask;
        unsigned int live = 0;
        for (int i = 0; i < k; ++i)
            if ((mask & (1u << i)) && (mask & adj[i]))
                live |= 1u << i;
        mask = live;
        if (memo[mask]) {
            memo[original] = memo[mask];
            return memo[mask] == 2;
        }
        for (unsigned int edge : edges)
            if ((mask & edge) == edge && !win(mask ^ edge)) {
                memo[original] = memo[mask] = 2;
                return true;
            }
        memo[original] = memo[mask] = 1;
        return false;
    };
    cout << (win((1u << k) - 1) ? "Charlie" : "Dave") << '\n';
}
`,
    python: String.raw`import sys


def main():
    read = sys.stdin.buffer.readline
    r, c = map(int, read().split())
    positions = []
    for i in range(r):
        for j, ch in enumerate(read().strip()):
            if ch == 64:
                positions.append((i, j))
    k = len(positions)
    adj = [0] * k
    edges = []
    for i, (ri, ci) in enumerate(positions):
        for j in range(i + 1, k):
            rj, cj = positions[j]
            if (abs(ri - rj), abs(ci - cj)) in ((1, 2), (2, 1)):
                adj[i] |= 1 << j
                adj[j] |= 1 << i
                edges.append((1 << i) | (1 << j))
    memo = bytearray(1 << k)
    memo[0] = 1

    def win(mask):
        if memo[mask]:
            return memo[mask] == 2
        original = mask
        live = 0
        for i in range(k):
            if mask >> i & 1 and mask & adj[i]:
                live |= 1 << i
        mask = live
        if memo[mask]:
            memo[original] = memo[mask]
            return memo[mask] == 2
        for edge in edges:
            if mask & edge == edge and not win(mask ^ edge):
                memo[original] = memo[mask] = 2
                return True
        memo[original] = memo[mask] = 1
        return False

    print("Charlie" if win((1 << k) - 1) else "Dave")


if __name__ == "__main__":
    main()
`,
  }),
  defineToiPotentialLesson("a148", {
    topic: "search",
    level: "medium",
    concept: "河內塔第 i 步的分治定位",
    goal: "只走包含查詢步數的遞迴分支，不輸出之前的搬動。",
    explanation: [
      "將 n 個箱子由 source 移到 target 的最短流程分成：先把 n−1 個小箱移到 auxiliary，再移動第 n 個箱，最後把 n−1 個小箱移到 target。中間這步的編號是 2^(n−1)，總長為 2^n−1。",
      "若 i 小於中間編號，問題縮成 source→auxiliary，交換 target 與 auxiliary；若大於，扣掉中間及前半共 2^(n−1) 步，縮成 auxiliary→target，交換 source 與 auxiliary。若剛好相等，直接輸出箱 n 的來源與目的。每輪減少 n，一直維持 i 是目前子問題中的步數，因此無需模擬指數多次搬動。",
    ],
    complexity:
      "時間 O(N)、額外空間 O(1)，N≤60，查詢 i 與 2^(N−1) 均可用有號 64 位元儲存。",
    pitfall:
      "步數從 1 開始。來源、目標、輔助倉庫會隨子問題交換，不能一直寫成倉庫 1 到 3。",
    traceLabel: "公開範例：N=4，查第 6 步",
    trace: [
      {
        title: "落在前半段",
        description: "n=4 的中間步是 8，6<8，所以改查三箱從 1 移到 2。",
        cells: ["n=4,i=6", "source=1", "target=2", "aux=3"],
        active: [2],
        variables: [["新 n", "3"]],
      },
      {
        title: "落在後半段",
        description:
          "n=3 中間步是 4，6>4；扣 4 後查兩箱從 3 移到 2 的第 2 步。",
        cells: ["n=2,i=2", "source=3", "target=2", "aux=1"],
        active: [0, 1],
        variables: [["新 i", "2"]],
      },
      {
        title: "命中中間步",
        description: "n=2 的中間步恰為 2，搬箱 2，來源 3、目的 2。",
        cells: ["箱2", "3→2"],
        active: [0, 1],
        variables: [["輸出", "move 2 from 3 to 2"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <utility>
using namespace std;
int main() {
    int n;
    long long i;
    cin >> n >> i;
    int source = 1, target = 3, auxiliary = 2;
    while (n >= 1) {
        long long middle = 1LL << (n - 1);
        if (i == middle) {
            cout << "move " << n << " from " << source << " to " << target << '\n';
            break;
        }
        if (i < middle)
            swap(target, auxiliary);
        else {
            i -= middle;
            swap(source, auxiliary);
        }
        --n;
    }
}
`,
    python: String.raw`import sys


def main():
    n, i = map(int, sys.stdin.buffer.read().split())
    source, target, auxiliary = 1, 3, 2
    while n:
        middle = 1 << (n - 1)
        if i == middle:
            print(f"move {n} from {source} to {target}")
            return
        if i < middle:
            target, auxiliary = auxiliary, target
        else:
            i -= middle
            source, auxiliary = auxiliary, source
        n -= 1


if __name__ == "__main__":
    main()
`,
  }),
  defineToiPotentialLesson("a149", {
    topic: "geometry",
    level: "medium",
    concept: "圓的交點上界與新增區域數",
    goal: "推導最大有界區域公式，並避免巨大 N 的平方溢位。",
    explanation: [
      "第一個圓形成一個計分區域。加入第 k≥2 個圓時，與前 k−1 個圓最多有 2(k−1) 個相異交點；這些點把新圓切成同樣多的弧，每段弧最多切開一個既有區域，因此全平面區域數最多增加 2(k−1)。扣掉一定不計的無界外部區域，計分區域上界是 1+Σ(k=2..N)2(k−1)=N(N−1)+1。",
      "要達到上界，可選同半徑、彼此很接近但不同的圓心，微調成兩兩相交且沒有三圓共點，並讓全部圓內有共同點。圓的聯集因此對共同點呈星狀，外部不會出現不計分的有界洞，所以上界確實可達。N 可達 2^60，直接算平方會超過 64 位元；先把 N 與 N−1 各自模 1000000007 再乘，乘積小於約 10^18，可安全放入 long long。",
    ],
    complexity: "時間 O(1)、額外空間 O(1)，只做固定次數整數模與乘法。",
    pitfall:
      "不能把所有圓外的無界區域算進去；公式是 N(N−1)+1。相切或三圓共點會減少區域。",
    traceLabel: "示意：依序畫 1、2、3 個一般位置的圓",
    trace: [
      {
        title: "一個圓",
        description: "圓內只有一區，外部不計。",
        cells: ["內部1", "外部不計"],
        active: [0],
        variables: [["F(1)", "1"]],
      },
      {
        title: "第二圓相交兩次",
        description: "新圓切出兩段弧，新增 2 區。",
        cells: ["原有1", "+2", "合計3"],
        active: [1, 2],
        variables: [["F(2)", "3"]],
      },
      {
        title: "第三圓相交四次",
        description: "與前兩圓各相交兩次且交點不重合，新增 4 區。",
        cells: ["原有3", "+4", "合計7"],
        active: [1, 2],
        variables: [["F(3)", "7"]],
      },
    ],
    cpp: String.raw`#include <iostream>
using namespace std;
int main() {
    long long n;
    cin >> n;
    const long long MOD = 1000000007;
    long long answer = ((n % MOD) * ((n - 1) % MOD) + 1) % MOD;
    cout << answer << '\n';
}
`,
    python: String.raw`import sys


def main():
    n = int(sys.stdin.buffer.read())
    mod = 1000000007
    print(((n % mod) * ((n - 1) % mod) + 1) % mod)


if __name__ == "__main__":
    main()
`,
  }),
  defineToiPotentialLesson("a150", {
    topic: "dp",
    level: "medium",
    concept: "合法前綴的括號餘額 DP",
    goal: "累計問號替換方法，同時保證每個前綴都不出現負餘額。",
    explanation: [
      "令 dp[b] 為讀完目前前綴後，尚未配對左括號數為 b 的合法方法數，起點 dp[0]=1。遇到 '[' 或 '?' 可使 b 增 1；遇到 ']' 或 '?' 只能在 b>0 時使 b 減 1。每個字元都建立新的陣列，以免同一個問號被連續使用多次。",
      "dp 只保存所有前綴都不為負的替換方式。任一合法替換都按最後一字的選擇進入唯一轉移，因此不重複也不漏計；完整字串後只有 b=0 算合法。若剩下 remaining 個字元，b>remaining 已無法歸零，可直接捨棄，並在每次加總對 1000000007 取模。",
    ],
    complexity: "時間 O(N²)、空間 O(N)，N≤2000；可用剩餘長度界縮小實際狀態數。",
    pitfall:
      "只讓左右總數相同仍可能有負前綴。固定括號不可更改，問號的左右兩種選擇分別累計。",
    traceLabel: "公開範例：?[]???，以下列出前綴可達的餘額與方法數",
    trace: [
      {
        title: "前三個字元",
        description: "首字只能選 '['；讀完 '[[]'，餘額為 1，只有一種。",
        cells: ["?→[", "[", "]"],
        active: [0, 1, 2],
        variables: [["dp[1]", "1"]],
      },
      {
        title: "第四字元問號",
        description: "可選 ']' 回到 0，或選 '[' 到 2；各有一種。",
        cells: ["餘額0：1", "餘額2：1"],
        active: [0, 1],
        variables: [["已讀", "4"]],
      },
      {
        title: "最後兩個字元",
        description: "餘額0只能走 0→1→0；餘額2只能走 2→1→0，得到兩種合法替換。",
        cells: ["0→1→0", "2→1→0"],
        active: [0, 1],
        variables: [["dp[0]", "2"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <string>
using namespace std;
int main() {
    int n;
    string s;
    cin >> n >> s;
    const int MOD = 1000000007;
    vector<int> dp(n + 1, 0);
    dp[0] = 1;
    for (int i = 0; i < n; ++i) {
        vector<int> next(n + 1, 0);
        int remaining = n - i - 1;
        auto add = [&](int balance, int value) {
            next[balance] += value;
            if (next[balance] >= MOD)
                next[balance] -= MOD;
        };
        for (int b = 0; b <= i; ++b)
            if (dp[b]) {
                if (s[i] != ']' && b + 1 <= remaining)
                    add(b + 1, dp[b]);
                if (s[i] != '[' && b > 0 && b - 1 <= remaining)
                    add(b - 1, dp[b]);
            }
        dp.swap(next);
    }
    cout << dp[0] << '\n';
}
`,
    python: String.raw`import sys


def main():
    data = sys.stdin.buffer.read().split()
    n, s = int(data[0]), data[1].decode()
    mod = 1000000007
    dp = [0] * (n + 1)
    dp[0] = 1
    for i, ch in enumerate(s):
        next_dp = [0] * (n + 1)
        remaining = n - i - 1
        for balance in range(min(i, n - i) + 1):
            value = dp[balance]
            if not value:
                continue
            if ch != ']' and balance + 1 <= remaining:
                next_dp[balance + 1] = (next_dp[balance + 1] + value) % mod
            if ch != '[' and balance > 0 and balance - 1 <= remaining:
                next_dp[balance - 1] = (next_dp[balance - 1] + value) % mod
        dp = next_dp
    print(dp[0])


if __name__ == "__main__":
    main()
`,
  }),
  defineToiPotentialLesson("a151", {
    topic: "greedy",
    level: "medium",
    concept: "先全選女生，再排序改選男生的差額",
    goal: "在每班恰選一人的條件下，使男女人數精確符合需求。",
    explanation: [
      "先假設每班都派女生，基準時間是所有 G 的總和。若某班改派男生，總時間只會增加差額 B−G。總共 N+M 班，要求恰 N 名男生，等同恰選 N 個差額加入基準；剩餘自然是 M 名女生。",
      "把差額由小到大排序並選前 N 個。若某個選中的差額大於未選中的差額，交換兩班性別後男女人數與每班一人的條件不變，總時間卻下降，故最優選法必能取排序最小的 N 個。差額相等時任選，不影響總時間，也不需要輸出名單。",
    ],
    complexity:
      "令 K=N+M≤4000。時間 O(K log K)，空間 O(K)；N、M 皆≤2000，總時間最多 4×10^7。",
    pitfall:
      "不能只選每班較快者，因為男女名額必須剛好。差額可能為負，而且就算剩下正差額也仍可能必須選滿 N 人。",
    traceLabel: "公開範例：N=2、M=3",
    trace: [
      {
        title: "全女生基準",
        description: "女生時間為 2,8,5,9,1，總和 25。",
        cells: ["2", "8", "5", "9", "1"],
        active: [0, 1, 2, 3, 4],
        variables: [["基準", "25"]],
      },
      {
        title: "計算改派差額",
        description: "五班差額依序為 7,−5,1,−5,4。",
        cells: ["7", "−5", "1", "−5", "4"],
        active: [1, 3],
        variables: [["要取", "最小2個"]],
      },
      {
        title: "派第二、四班男生",
        description: "總時間 25−5−5=15，對應 2+3+5+4+1。",
        cells: ["女生2", "男生3", "女生5", "男生4", "女生1"],
        active: [1, 3],
        variables: [["答案", "15"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;
int main() {
    int n, m;
    cin >> n >> m;
    vector<int> differences(n + m);
    long long answer = 0;
    for (int &diff : differences) {
        int b, g;
        cin >> b >> g;
        answer += g;
        diff = b - g;
    }
    sort(differences.begin(), differences.end());
    for (int i = 0; i < n; ++i)
        answer += differences[i];
    cout << answer << '\n';
}
`,
    python: String.raw`import sys


def main():
    it = iter(map(int, sys.stdin.buffer.read().split()))
    n, m = next(it), next(it)
    differences = []
    answer = 0
    for _ in range(n + m):
        b, g = next(it), next(it)
        answer += g
        differences.append(b - g)
    differences.sort()
    print(answer + sum(differences[:n]))


if __name__ == "__main__":
    main()
`,
  }),
];
