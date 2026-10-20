import type { ToiPotentialLesson } from "@/lib/toiPotentialLessonTypes";
import { defineToiPotentialLesson } from "@/lib/toiPotentialLessonBuilder";

export const lessons: ToiPotentialLesson[] = [
  defineToiPotentialLesson("a130", {
    topic: "dp",
    level: "hard",
    concept: "每類重設計數的 0/1 背包",
    goal: "同時維護總預算與目前料理類別的取用數量。",
    explanation: [
      "令 best[b] 表示先前類別、總花費不超過 b 的最大美味。開始新類別時設 dp[0][b]=best[b]，其他取用數為不可達；dp[k][b] 表示在這一類恰取 k 道且總花費不超過 b。每道 (c,d) 由 k 大到小、b 大到小更新 dp[k][b]=max(dp[k][b],dp[k-1][b-c]+d)，所以不會重複選同一道。",
      "完成一類後，對 k=0..R 取最大值成為新的 best，再把計數歸零。這樣不買該類的情形由 k=0 保留，且前面類別的份數不會占用新類別上限。依已處理料理數歸納，每個合法選法都由選或不選最後一道的轉移涵蓋；所有轉移也都維持預算與每類份數限制。",
    ],
    complexity:
      "令 M 為料理總數。時間 O((M+N)RP)，空間 O(RP)；M≤1000、R≤10、P≤2000。",
    pitfall:
      "R 是每類上限。不可沿用上一類的 k，也不可把每種料理當成可重複購買。",
    traceLabel: "公開範例：預算 9，每類最多 1 道",
    trace: [
      {
        title: "第一類選擇",
        description: "花 3 得 5、花 4 得 9，但不能兩道都買。",
        cells: ["(4,9)", "(3,5)"],
        active: [0],
        variables: [
          ["best[4]", "9"],
          ["best[9]", "9"],
        ],
      },
      {
        title: "重設類內數量",
        description: "第二類的 (5,11) 可以接在第一類花 4 的解後面。",
        cells: ["第一類 4→9", "第二類 5→11"],
        active: [0, 1],
        variables: [["dp[1][9]", "9+11=20"]],
      },
      {
        title: "比較較便宜選法",
        description: "第二類花 2 得 6，搭配第一類最多得 15，因此答案仍是 20。",
        cells: ["4+5=9", "9+11=20", "4+2=6", "9+6=15"],
        active: [1],
        variables: [["best[9]", "20"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, p, r;
    cin >> n >> p >> r;
    const int NEG = -1000000000;
    vector<int> best(p + 1, 0);
    for (int group = 0; group < n; ++group) {
        int m;
        cin >> m;
        vector<vector<int>> dp(r + 1, vector<int>(p + 1, NEG));
        dp[0] = best;
        for (int j = 0; j < m; ++j) {
            int c, d;
            cin >> c >> d;
            for (int k = min(r, j + 1); k >= 1; --k)
                for (int b = p; b >= c; --b)
                    if (dp[k - 1][b - c] != NEG)
                        dp[k][b] = max(dp[k][b], dp[k - 1][b - c] + d);
        }
        for (int b = 0; b <= p; ++b)
            for (int k = 0; k <= r; ++k)
                best[b] = max(best[b], dp[k][b]);
    }
    cout << best[p] << '\n';
}
`,
    python: String.raw`import sys


def main():
    it = iter(map(int, sys.stdin.buffer.read().split()))
    n, p, r = next(it), next(it), next(it)
    neg = -(10**9)
    best = [0] * (p + 1)
    for _ in range(n):
        m = next(it)
        dp = [[neg] * (p + 1) for _ in range(r + 1)]
        dp[0] = best[:]
        for j in range(m):
            c, d = next(it), next(it)
            for k in range(min(r, j + 1), 0, -1):
                row, prev = dp[k], dp[k - 1]
                for b in range(p, c - 1, -1):
                    if prev[b - c] != neg:
                        value = prev[b - c] + d
                        if value > row[b]:
                            row[b] = value
        best = [max(dp[k][b] for k in range(r + 1)) for b in range(p + 1)]
    print(best[p])


if __name__ == "__main__":
    main()
`,
  }),
  defineToiPotentialLesson("a131", {
    topic: "search",
    level: "hard",
    concept: "差值轉換與折半枚舉",
    goal: "將 36 件道具的子集合搜尋拆成兩個至多 18 件的搜尋。",
    explanation: [
      "每件道具只需記 UA−UD，目標是選出總差 D−A。將道具分成左右兩半，各自從集合 {0} 開始，每讀到差值 v 就加入所有舊和加 v 的結果。這樣包含空集合，且每件只使用一次。",
      "把右半所有子集合和放入集合，對每個左半和 s 查找 target−s。任何完整子集合都唯一分成左右兩部分，因此找到互補和等價於原題可達。差值可為負數，不能用只支援非負索引的背包；36×10^15 仍在有號 64 位元範圍內。",
    ],
    complexity:
      "C++ 排序加二分時間 O(N·2^(N/2))、空間 O(2^(N/2))；Python 雜湊集合平均時間 O(2^(N/2))、同階空間。N≤36。",
    pitfall:
      "初始 A=D 時，不用任何道具便成功；不要排除子集合和 0，也不要用 32 位元差值。",
    traceLabel: "公開範例：目標差 −5",
    trace: [
      {
        title: "轉成差值",
        description: "目前攻防差為 5，三件道具差值是 −3、3、−2。",
        cells: ["−3", "3", "−2"],
        active: [0, 1, 2],
        variables: [["target", "−5"]],
      },
      {
        title: "分成兩半",
        description: "左半只有 −3；右半由 3、−2 產生四個子集合和。",
        cells: ["左：0,−3", "右：0,3,−2,1"],
        active: [0, 1],
        variables: [
          ["左 s", "−3"],
          ["需右和", "−2"],
        ],
      },
      {
        title: "找到互補",
        description: "使用第一及第三件：攻擊 8+1+0=9，防禦 3+4+2=9。",
        cells: ["道具1", "道具3", "9=9"],
        active: [0, 1, 2],
        variables: [["輸出", "1"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;
vector<long long> sums(const vector<long long> &v, int l, int r) {
    vector<long long> s{0};
    for (int i = l; i < r; ++i) {
        size_t old = s.size();
        for (size_t j = 0; j < old; ++j)
            s.push_back(s[j] + v[i]);
    }
    return s;
}
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    long long a, d;
    int n;
    cin >> a >> d >> n;
    vector<long long> v(n);
    for (auto &x : v) {
        long long ua, ud;
        cin >> ua >> ud;
        x = ua - ud;
    }
    auto left = sums(v, 0, n / 2), right = sums(v, n / 2, n);
    sort(right.begin(), right.end());
    for (long long s : left)
        if (binary_search(right.begin(), right.end(), d - a - s)) {
            cout << 1 << '\n';
            return 0;
        }
    cout << 0 << '\n';
}
`,
    python: String.raw`import sys


def subset_sums(values):
    sums = [0]
    for value in values:
        sums += [s + value for s in sums]
    return sums


def main():
    it = iter(map(int, sys.stdin.buffer.read().split()))
    a, d, n = next(it), next(it), next(it)
    values = [next(it) - next(it) for _ in range(n)]
    right = set(subset_sums(values[n // 2 :]))
    print(int(any(d - a - s in right for s in subset_sums(values[: n // 2]))))


if __name__ == "__main__":
    main()
`,
  }),
  defineToiPotentialLesson("a132", {
    topic: "dp",
    level: "medium",
    concept: "至少需求的無限次方案 DP",
    goal: "允許超額取得，用尚缺包數避免多開上界。",
    explanation: [
      "令 dp[c] 為至少取得 c 包的最少費用，dp[0]=0。若先購買方案 (A,B)，剩下仍需至少 max(0,c−A−B) 包，因此 dp[c]=min(A+dp[max(0,c−A−B)])。按 c 遞增計算，所有依賴都較小，方案自然可以反覆使用。",
      "取任一最優購買序列的第一個方案，剩餘方案必須滿足上述剩餘需求，故其費用不會低於轉移候選；反過來，每個候選都實際足夠 c 包，兩方向合起來證明最優。把超額需求截到 0，而非要求剛好 c 包，正是符合本題的關鍵。",
    ],
    complexity: "時間 O(NC)，空間 O(C)；N≤100、C≤10000，至多約一百萬次轉移。",
    pitfall: "付款是 A，取得是 A+B；不可方案外單買，也不可只選單價最低的一種。",
    traceLabel: "公開範例：5 包付 3、10 包付 5，需求 13",
    trace: [
      {
        title: "小需求可超買",
        description: "需求 1 到 5 包時，一次五包方案就足夠。",
        cells: ["dp[0]=0", "dp[1]=3", "dp[5]=3"],
        active: [1, 2],
        variables: [["方案", "(3,2)"]],
      },
      {
        title: "十包的最佳費用",
        description: "兩個五包要 6 元，一個十包只要 5 元。",
        cells: ["3+dp[5]=6", "5+dp[0]=5"],
        active: [1],
        variables: [["dp[10]", "5"]],
      },
      {
        title: "需求十三包",
        description:
          "五包加至少八包，或十包加至少三包，都要 8 元且實得 15 包。",
        cells: ["3+dp[8]=8", "5+dp[3]=8"],
        active: [0, 1],
        variables: [["dp[13]", "8"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, c;
    cin >> n >> c;
    vector<pair<int, int>> offers(n);
    for (auto &[cost, count] : offers) {
        int b;
        cin >> cost >> b;
        count = cost + b;
    }
    vector<int> dp(c + 1, 1000000000);
    dp[0] = 0;
    for (int need = 1; need <= c; ++need)
        for (auto [cost, count] : offers)
            dp[need] = min(dp[need], cost + dp[max(0, need - count)]);
    cout << dp[c] << '\n';
}
`,
    python: String.raw`import sys


def main():
    it = iter(map(int, sys.stdin.buffer.read().split()))
    n, c = next(it), next(it)
    offers = []
    for _ in range(n):
        a, b = next(it), next(it)
        offers.append((a, a + b))
    dp = [0] + [10**9] * c
    for need in range(1, c + 1):
        dp[need] = min(cost + dp[max(0, need - count)] for cost, count in offers)
    print(dp[c])


if __name__ == "__main__":
    main()
`,
  }),
  defineToiPotentialLesson("a133", {
    topic: "dp",
    level: "hard",
    concept: "位元集合與逐桶填滿",
    goal: "以已選寶物集合壓縮三人分配，而非枚舉巨大價值座標。",
    explanation: [
      "總價值必須能被 3 整除，設每人目標為 target。把三人的份額依序填滿：dp[mask] 是使用 mask 內寶物後，目前尚未填滿那一份的價值；−1 表不可達。起點 dp[0]=0，加入未用寶物 v 時只能使目前值不超過 target，新的值是 (dp[mask]+v) mod target。",
      "同一個 mask 的總價值固定，所以可達時的餘數也固定，不需再記分配人數。每當到達 target 就清為 0，下一件交給下一人。若三等分存在，可依三人的寶物順序逐桶加入，因此完整 mask 必可達；若完整 mask 可達，總和為 3target，恰好完成三桶，亦給出合法分配。",
    ],
    complexity:
      "時間 O(N·2^N)，空間 O(2^N)；N≤16，只需 65536 個狀態，與最高 1.6 億的總價值無關。",
    pitfall:
      "寶物不可拆開；大於 target 的單件立即無解。不可把同一件在不同桶重複計入。",
    traceLabel: "公開範例：2、2、4、4、6，每份 6",
    trace: [
      {
        title: "第一份先放 2",
        description: "選第一件 2，目前尚未填滿值為 2。",
        cells: ["2", "2", "4", "4", "6"],
        active: [0],
        variables: [
          ["mask", "00001"],
          ["餘數", "2"],
        ],
      },
      {
        title: "再放 4 完成一份",
        description: "選第三件 4，2+4=6，餘數歸零。",
        cells: ["2+4=6", "尚餘 2,4,6"],
        active: [0],
        variables: [
          ["mask", "00101"],
          ["餘數", "0"],
        ],
      },
      {
        title: "完成另兩份",
        description: "第二、四件組成 6，最後一件本身為 6。",
        cells: ["2+4", "2+4", "6"],
        active: [0, 1, 2],
        variables: [
          ["mask", "11111"],
          ["輸出", "YES"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <numeric>
#include <algorithm>
using namespace std;
int main() {
    int n;
    cin >> n;
    vector<int> v(n);
    for (int &x : v)
        cin >> x;
    int total = accumulate(v.begin(), v.end(), 0);
    if (total % 3) {
        cout << "NO\n";
        return 0;
    }
    int target = total / 3;
    if (*max_element(v.begin(), v.end()) > target) {
        cout << "NO\n";
        return 0;
    }
    vector<int> dp(1 << n, -1);
    dp[0] = 0;
    for (int mask = 0; mask < (1 << n); ++mask)
        if (dp[mask] >= 0)
            for (int j = 0; j < n; ++j)
                if (!(mask & (1 << j)) && dp[mask] + v[j] <= target)
                    dp[mask | (1 << j)] = (dp[mask] + v[j]) % target;
    cout << (dp.back() == 0 ? "YES" : "NO") << '\n';
}
`,
    python: String.raw`import sys


def main():
    data = list(map(int, sys.stdin.buffer.read().split()))
    n, values = data[0], data[1:]
    total = sum(values)
    if total % 3:
        print("NO")
        return
    target = total // 3
    if max(values) > target:
        print("NO")
        return
    dp = [-1] * (1 << n)
    dp[0] = 0
    for mask in range(1 << n):
        if dp[mask] < 0:
            continue
        for j, value in enumerate(values):
            if not mask >> j & 1 and dp[mask] + value <= target:
                dp[mask | (1 << j)] = (dp[mask] + value) % target
    print("YES" if dp[-1] == 0 else "NO")


if __name__ == "__main__":
    main()
`,
  }),
  defineToiPotentialLesson("a134", {
    topic: "math",
    level: "hard",
    concept: "含常數項遞迴的矩陣快速冪",
    goal: "在 N 可達 2^60 時，以對數次矩陣乘法求出四位密碼。",
    explanation: [
      "把狀態寫成直行向量 [A[n],A[n−1],1]。一步轉移矩陣為 [[P,Q,R],[1,0,0],[0,0,1]]，最後的常數 1 使 R 每一步都正確加入。從 [A[1],A[0],1] 出發，乘矩陣的 N−1 次方，第一個分量就是答案。",
      "以二進位快速冪反覆平方矩陣，指數該位為 1 時乘進答案矩陣。模運算與加乘相容，每步模 10000 不會改變最終餘數。N=1 時指數為 0，單位矩陣保留 A[1]，不需要另猜起點；輸出時固定四位補零。",
    ],
    complexity:
      "3×3 矩陣乘法為常數成本；時間 O(log N)、額外空間 O(1)，N≤2^60。",
    pitfall: "若只用二階矩陣會漏掉常數 R。指數應是 N−1；密碼 786 要印成 0786。",
    traceLabel: "公開範例：P=2、Q=3、R=4，A0=5、A1=6",
    trace: [
      {
        title: "第一步",
        description: "A2=2×6+3×5+4=31。",
        cells: ["6", "5", "1", "→31"],
        active: [3],
        variables: [
          ["n", "2"],
          ["A[n]", "31"],
        ],
      },
      {
        title: "繼續核算",
        description: "A3=2×31+3×6+4=84；A4=2×84+3×31+4=265。",
        cells: ["31", "84", "265"],
        active: [1, 2],
        variables: [["A4", "265"]],
      },
      {
        title: "固定四位輸出",
        description: "A5=2×265+3×84+4=786，補前導零。",
        cells: ["530", "+252", "+4", "0786"],
        active: [3],
        variables: [
          ["指數 N−1", "4"],
          ["輸出", "0786"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <array>
#include <iomanip>
using namespace std;
using Mat = array<array<long long, 3>, 3>;
Mat mul(const Mat &a, const Mat &b) {
    Mat c{};
    for (int i = 0; i < 3; ++i)
        for (int k = 0; k < 3; ++k)
            for (int j = 0; j < 3; ++j)
                c[i][j] = (c[i][j] + a[i][k] * b[k][j]) % 10000;
    return c;
}
int main() {
    long long p, q, r, a0, a1, n;
    cin >> p >> q >> r >> a0 >> a1 >> n;
    Mat base{{{p, q, r}, {1, 0, 0}, {0, 0, 1}}}, result{};
    for (int i = 0; i < 3; ++i)
        result[i][i] = 1;
    for (--n; n; n >>= 1) {
        if (n & 1)
            result = mul(result, base);
        base = mul(base, base);
    }
    long long answer = (result[0][0] * a1 + result[0][1] * a0 + result[0][2]) % 10000;
    cout << setfill('0') << setw(4) << answer << '\n';
}
`,
    python: String.raw`import sys


def mul(a, b):
    return [[sum(a[i][k] * b[k][j] for k in range(3)) % 10000 for j in range(3)] for i in range(3)]


def main():
    p, q, r, a0, a1, n = map(int, sys.stdin.buffer.read().split())
    base = [[p, q, r], [1, 0, 0], [0, 0, 1]]
    result = [[1, 0, 0], [0, 1, 0], [0, 0, 1]]
    exponent = n - 1
    while exponent:
        if exponent & 1:
            result = mul(result, base)
        base = mul(base, base)
        exponent >>= 1
    answer = (result[0][0] * a1 + result[0][1] * a0 + result[0][2]) % 10000
    print(f"{answer:04d}")


if __name__ == "__main__":
    main()
`,
  }),
  defineToiPotentialLesson("a135", {
    topic: "greedy",
    level: "medium",
    concept: "容量由大到小的交換論證",
    goal: "讓最大捕捉器拿走剩餘可捕捉隕石中最重的一顆。",
    explanation: [
      "把隕石重量與捕捉器容量都由小到大排序，再從尾端處理。面對目前最大容量，先丟掉比它更重的隕石，因為剩下捕捉器更小，也不可能捕捉這些隕石。接著把剩下最重的一顆配給目前捕捉器。",
      "設這顆重量為 w。若最優解沒有選 w，可以用 w 換掉目前捕捉器抓的較輕隕石，總重不減；若 w 配給另一個較小捕捉器，交換兩者捕捉對象仍合法，因為另一顆不重於 w。故存在遵從貪心選擇的最優解，刪掉這對後可歸納處理剩餘問題。",
    ],
    complexity:
      "排序時間 O(N log N+M log M)，雙指標 O(N+M)，空間 O(N+M) 儲存輸入；總重可達 10^14，需 64 位元。",
    pitfall:
      "不是只追求捕捉數量。容量相等也能抓；找不到任何可抓隕石時總重為 0。",
    traceLabel: "公開範例：重量 3,6,7,9；容量 5,6,10",
    trace: [
      {
        title: "最大容量先抓",
        description: "容量 10 抓目前最重的 9。",
        cells: ["3", "6", "7", "9"],
        active: [3],
        variables: [["已抓總重", "9"]],
      },
      {
        title: "捨棄不可用的 7",
        description: "剩下最大容量 6，7 不可能再被抓，改抓 6。",
        cells: ["3", "6", "7（略過）"],
        active: [1],
        variables: [["已抓總重", "15"]],
      },
      {
        title: "最小容量抓 3",
        description: "容量 5 抓 3，三顆總重 9+6+3=18。",
        cells: ["10→9", "6→6", "5→3"],
        active: [2],
        variables: [["答案", "18"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, m;
    cin >> n >> m;
    vector<long long> w(n), c(m);
    for (auto &x : w)
        cin >> x;
    for (auto &x : c)
        cin >> x;
    sort(w.begin(), w.end());
    sort(c.begin(), c.end());
    int j = n - 1;
    long long answer = 0;
    for (int i = m - 1; i >= 0; --i) {
        while (j >= 0 && w[j] > c[i])
            --j;
        if (j < 0)
            break;
        answer += w[j--];
    }
    cout << answer << '\n';
}
`,
    python: String.raw`import sys


def main():
    data = list(map(int, sys.stdin.buffer.read().split()))
    n, m = data[:2]
    weights = sorted(data[2 : 2 + n])
    capacities = sorted(data[2 + n : 2 + n + m], reverse=True)
    j = n - 1
    answer = 0
    for capacity in capacities:
        while j >= 0 and weights[j] > capacity:
            j -= 1
        if j < 0:
            break
        answer += weights[j]
        j -= 1
    print(answer)


if __name__ == "__main__":
    main()
`,
  }),
  defineToiPotentialLesson("a136", {
    topic: "data-structures",
    level: "medium",
    concept: "固定極值區間的最後出現位置",
    goal: "每個右端點一次計算所有合法左端點。",
    explanation: [
      "掃描右端點 r，記 bad 為最後一個不在 [Hmin,Hmax] 內的位置，lo、hi 為最後出現 Hmin、Hmax 的位置。以 r 結尾的區間若要合法，左端點必須大於 bad，且不大於 lo 與 hi，才能同時包含兩個指定極值。",
      "因此這一輪貢獻 max(0,min(lo,hi)−bad)。這個條件既必要又充分：避開 bad 及之前的違規點保證所有高度在範圍內，包含 lo、hi 保證極值確實達到。每個區間只在其唯一右端點計數；當兩個極值相等時，同一格可同時更新 lo 和 hi，公式仍適用。",
    ],
    complexity:
      "時間 O(N)，核心額外空間 O(1)；目前程式儲存輸入為 O(N)。答案最高 N(N+1)/2，N=100000 時需 64 位元。",
    pitfall:
      "高度超界會切斷區間；只要求落在高度範圍內仍不夠，必須兩個極值都出現。Hmin>Hmax 時答案為 0。",
    traceLabel: "公開範例：高度 2,4,3,2,5,4；極值 2 與 4",
    trace: [
      {
        title: "右端點 2",
        description: "以 1 起算，lo=1、hi=2、bad=0，只有 [1,2]。",
        cells: ["2", "4", "3", "2", "5", "4"],
        active: [0, 1],
        variables: [
          ["本輪", "1"],
          ["累計", "1"],
        ],
      },
      {
        title: "右端點 3、4",
        description: "r=3 再加 [1,3]；r=4 可選左端 1 或 2，增加兩段。",
        cells: ["[1,3]", "[1,4]", "[2,4]"],
        active: [1, 2],
        variables: [["累計", "4"]],
      },
      {
        title: "高度 5 切斷",
        description: "r=5 設 bad=5；r=6 雖出現 4，卻沒有切斷後的 2，不能新增。",
        cells: ["5：bad=5", "4：hi=6", "lo=4"],
        active: [0],
        variables: [
          ["min(lo,hi)−bad", "−1"],
          ["答案", "4"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
using namespace std;
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    long long low, high;
    cin >> n >> low >> high;
    int bad = 0, lo = 0, hi = 0;
    long long answer = 0;
    for (int r = 1; r <= n; ++r) {
        long long x;
        cin >> x;
        if (x < low || x > high)
            bad = r;
        if (x == low)
            lo = r;
        if (x == high)
            hi = r;
        int end = lo < hi ? lo : hi;
        if (end > bad)
            answer += end - bad;
    }
    cout << answer << '\n';
}
`,
    python: String.raw`import sys


def main():
    data = list(map(int, sys.stdin.buffer.read().split()))
    n, low, high = data[:3]
    bad = lo = hi = answer = 0
    for r, x in enumerate(data[3 : 3 + n], 1):
        if x < low or x > high:
            bad = r
        if x == low:
            lo = r
        if x == high:
            hi = r
        answer += max(0, min(lo, hi) - bad)
    print(answer)


if __name__ == "__main__":
    main()
`,
  }),
  defineToiPotentialLesson("a137", {
    topic: "graphs",
    level: "medium",
    concept: "多源 BFS 與週期距離分層",
    goal: "同時從全部作品格出發，求每格到最近作品的距離。",
    explanation: [
      "把每個作品格的距離設為 0，全部放進同一個佇列。取出一格後，將尚未到訪的上下左右鄰格設為距離加一並加入佇列。所有邊的代價都是 1，BFS 按距離遞增處理，因此第一次到達某格時就已找到到最近作品的最短距離。",
      "距離為 d>0 的格子使用陣列下標 (d−1)%T，對應題目的第 ((d−1) mod T)+1 種磁磚。每格只入列一次；作品不是磁磚，不能把距離 0 算進任何種類。實作把二維座標攤成整數索引，佇列與距離陣列都只儲存索引或整數。",
    ],
    complexity:
      "時間 O(HW+T)，空間 O(HW+T)；H、W≤1000，最多一百萬格。Python 用 array 儲存距離與佇列，避免百萬個座標 tuple。",
    pitfall:
      "必須從所有 '-' 同時出發；只從第一個作品搜尋會算錯最近距離。H=1、T 大於最大距離時也要輸出所有 T 個數量。",
    traceLabel: "公開範例：3×3 中央為作品，T=2",
    trace: [
      {
        title: "作品入列",
        description: "中央 (2,2) 距離為 0，不需要磁磚。",
        cells: ["? ? ?", "? 0 ?", "? ? ?"],
        active: [1],
        variables: [["佇列格數", "1"]],
      },
      {
        title: "第一圈",
        description: "上下左右四格距離 1，全部使用第 1 種。",
        cells: ["? 1 ?", "1 0 1", "? 1 ?"],
        active: [0, 1, 2],
        variables: [["第1種", "4"]],
      },
      {
        title: "第二圈",
        description: "四個角距離 2，全部使用第 2 種。",
        cells: ["2 1 2", "1 0 1", "2 1 2"],
        active: [0, 2],
        variables: [
          ["第2種", "4"],
          ["輸出", "4 4"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <string>
using namespace std;
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int h, w;
    cin >> h >> w;
    vector<int> dist(h * w, -1), q;
    q.reserve(h * w);
    for (int r = 0; r < h; ++r) {
        string s;
        cin >> s;
        for (int c = 0; c < w; ++c)
            if (s[c] == '-') {
                dist[r * w + c] = 0;
                q.push_back(r * w + c);
            }
    }
    int t;
    cin >> t;
    vector<int> counts(t, 0);
    auto visit = [&](int next, int d) {
        if (dist[next] < 0) {
            dist[next] = d;
            q.push_back(next);
            ++counts[(d - 1) % t];
        }
    };
    for (size_t head = 0; head < q.size(); ++head) {
        int u = q[head], r = u / w, c = u % w, d = dist[u] + 1;
        if (r > 0)
            visit(u - w, d);
        if (r + 1 < h)
            visit(u + w, d);
        if (c > 0)
            visit(u - 1, d);
        if (c + 1 < w)
            visit(u + 1, d);
    }
    for (int i = 0; i < t; ++i)
        cout << (i ? " " : "") << counts[i];
    cout << '\n';
}
`,
    python: String.raw`import sys
from array import array


def main():
    read = sys.stdin.buffer.readline
    h, w = map(int, read().split())
    dist = array('i', [-1]) * (h * w)
    queue = array('i')
    for r in range(h):
        row = read().strip()
        for c, ch in enumerate(row):
            if ch == 45:
                index = r * w + c
                dist[index] = 0
                queue.append(index)
    t = int(read())
    counts = [0] * t
    head = 0
    while head < len(queue):
        u = queue[head]
        head += 1
        r, c = divmod(u, w)
        neighbors = []
        if r:
            neighbors.append(u - w)
        if r + 1 < h:
            neighbors.append(u + w)
        if c:
            neighbors.append(u - 1)
        if c + 1 < w:
            neighbors.append(u + 1)
        d = dist[u] + 1
        for v in neighbors:
            if dist[v] == -1:
                dist[v] = d
                queue.append(v)
                counts[(d - 1) % t] += 1
    print(*counts)


if __name__ == "__main__":
    main()
`,
  }),
  defineToiPotentialLesson("a138", {
    topic: "math",
    level: "easy",
    concept: "同回答分桶與向上取整",
    goal: "區分受訪人數與全校人數，為每種回答補足完整顏色群。",
    explanation: [
      "回答 x 的學生所屬顏色恰有 x+1 人。同一個顏色的人必定回答相同數字，所以不同回答不能混成一群。若回答 x 的受訪者有 f 人，一種顏色最多容納 x+1 位受訪者，至少要 ceil(f/(x+1)) 種這樣的顏色。",
      "每種顏色總人數固定為 x+1，因此貢獻 ceil(f/(x+1))×(x+1)。把受訪者每 x+1 人填一群，最後不足部分補未受訪者，就能達成這個下界；各回答分開使用顏色即可合併成全校最小人數。用整數 (f+x)//(x+1) 避免浮點向上取整。",
    ],
    complexity: "時間 O(N+K)，空間 O(K)，K=1001 種可能回答，N≤200000。",
    pitfall:
      "回答 x 是不包含自己的同色人數；x=0 的每位受訪者都各自需要一個不同顏色。",
    traceLabel: "公開範例：2,2,2,2,0,1",
    trace: [
      {
        title: "四人回答 2",
        description: "每種顏色共 3 人，四位受訪者至少分成兩種顏色。",
        cells: ["2:4人", "每群3人", "需2群"],
        active: [0, 2],
        variables: [["貢獻", "6"]],
      },
      {
        title: "一人回答 0",
        description: "這位學生的顏色只有自己，額外需要 1 人。",
        cells: ["目前6人", "+1人"],
        active: [1],
        variables: [["累計", "7"]],
      },
      {
        title: "一人回答 1",
        description: "此色共 2 人，需要再補一位未受訪者。",
        cells: ["6", "+1", "+2"],
        active: [2],
        variables: [["答案", "9"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <array>
using namespace std;
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    array<int, 1001> count{};
    for (int i = 0, x; i < n; ++i) {
        cin >> x;
        ++count[x];
    }
    long long answer = 0;
    for (int x = 0; x <= 1000; ++x)
        answer += (count[x] + x) / (x + 1) * (x + 1);
    cout << answer << '\n';
}
`,
    python: String.raw`import sys


def main():
    data = list(map(int, sys.stdin.buffer.read().split()))
    count = [0] * 1001
    for x in data[1 : 1 + data[0]]:
        count[x] += 1
    print(sum((f + x) // (x + 1) * (x + 1) for x, f in enumerate(count)))


if __name__ == "__main__":
    main()
`,
  }),
  defineToiPotentialLesson("a139", {
    topic: "greedy",
    level: "hard",
    concept: "排序交換與前插的邊際收益",
    goal: "判斷負價值寶物是否能藉延後高價寶物而帶來淨收益。",
    explanation: [
      "固定選中的種類，若相鄰取出值 u>v，交換後總價值增加 u−v，所以最佳順序應由小到大，係數依序為 2、3、…。實作反過來由大到小考慮新種類，每次把新值 v 放在已選順序最前面；舊種類全部晚一天，若它們單件價值和為 sum，收益增加 sum+2v。",
      "同樣的交換思想也保證固定選 k 種時應選最大的 k 個值，因為每個位置係數為正，換成更大的未選值不會變差。因此只需檢查排序後的前綴。所有非負值都可加入；一旦遇到 sum+2v≤0，此時 v≤0，繼續納入更小值只會讓 sum 更低、下一次邊際收益更小，可以停止。空集合初始收益 0，處理全負值也正確。",
    ],
    complexity:
      "排序 O(N log N)、掃描 O(N)，空間 O(N)。N≤100000，總價值可達約 10^13，C++ 使用 long long。",
    pitfall:
      "每晚每種只增加一件，並非翻倍；負值不一定都該排除，例如 −3 可讓價值 8 多長一天。",
    traceLabel: "公開範例：8,−3,2；由大到小前插",
    trace: [
      {
        title: "只放 8",
        description: "第二天取出 2 件，收益為 16。",
        cells: ["8×2"],
        active: [0],
        variables: [
          ["sum", "8"],
          ["收益", "16"],
        ],
      },
      {
        title: "前插 2",
        description: "先取 2 再取 8，收益 2×2+3×8=28，增加 8+4=12。",
        cells: ["2×2=4", "8×3=24"],
        active: [0, 1],
        variables: [
          ["sum", "10"],
          ["收益", "28"],
        ],
      },
      {
        title: "前插 −3",
        description: "順序 −3,2,8，收益 −6+6+32=32，增加 10−6=4。",
        cells: ["−3×2=−6", "2×3=6", "8×4=32"],
        active: [0, 1, 2],
        variables: [["收益", "32"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <algorithm>
#include <functional>
using namespace std;
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    vector<long long> values(n);
    for (auto &x : values)
        cin >> x;
    sort(values.begin(), values.end(), greater<long long>());
    long long sum = 0, answer = 0;
    for (long long v : values) {
        long long gain = sum + 2 * v;
        if (gain <= 0)
            break;
        answer += gain;
        sum += v;
    }
    cout << answer << '\n';
}
`,
    python: String.raw`import sys


def main():
    data = list(map(int, sys.stdin.buffer.read().split()))
    values = sorted(data[1 : 1 + data[0]], reverse=True)
    total = answer = 0
    for value in values:
        gain = total + 2 * value
        if gain <= 0:
            break
        answer += gain
        total += value
    print(answer)


if __name__ == "__main__":
    main()
`,
  }),
  defineToiPotentialLesson("a140", {
    topic: "data-structures",
    level: "hard",
    concept: "前綴和與滑動最小值佇列",
    goal: "處理有負分且長度至多 K 的最大連續區間。",
    explanation: [
      "設 prefix[r] 是前 r 塊總分，區間 (l,r] 得分為 prefix[r]−prefix[l]。長度至多 K 表示 l∈[max(0,r−K),r−1]，所以固定右端 r 時，找這個範圍內最小前綴和即可。",
      "用雙端佇列保存索引，索引遞增且前綴和嚴格遞增。先移除超過 K 距離的隊首，再用隊首求候選；加入 r 前，移除隊尾前綴和不小於 prefix[r] 的索引，因為它們值更差且更早過期。被刪除的索引永遠不可能勝過新索引，故不影響最優；每個索引至多進出一次。",
    ],
    complexity:
      "時間 O(N)，空間 O(N) 儲存前綴和；佇列最多 O(K) 個索引。N≤100000。",
    pitfall:
      "長度是最多 K，不能只枚舉恰 K 塊。答案從 0 開始，允許全不取；計算候選後才加入當前索引。",
    traceLabel: "公開範例：5,−8,7,6,−2,3；K=3",
    trace: [
      {
        title: "前三個前綴",
        description:
          "prefix[0..3]=0,5,−3,4。r=3 時最小可用前綴為 −3，取單塊 7。",
        cells: ["0", "5", "−3", "4"],
        active: [2, 3],
        variables: [
          ["候選", "4−(−3)=7"],
          ["best", "7"],
        ],
      },
      {
        title: "右端到第 4 塊",
        description: "prefix[4]=10，合法左前綴索引 1..3 中最小是索引 2。",
        cells: ["prefix[2]=−3", "7", "6", "prefix[4]=10"],
        active: [1, 2],
        variables: [
          ["候選", "13"],
          ["best", "13"],
        ],
      },
      {
        title: "最後一輪",
        description:
          "r=6 時索引 2 已過期，prefix[6]=11，最小合法前綴為 prefix[3]=4，候選僅 7。",
        cells: ["4", "10", "8", "11"],
        active: [0, 3],
        variables: [["best", "13"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <deque>
#include <algorithm>
using namespace std;
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, k;
    cin >> n >> k;
    vector<long long> prefix(n + 1);
    for (int i = 1; i <= n; ++i) {
        long long x;
        cin >> x;
        prefix[i] = prefix[i - 1] + x;
    }
    deque<int> q{0};
    long long answer = 0;
    for (int r = 1; r <= n; ++r) {
        while (!q.empty() && q.front() < r - k)
            q.pop_front();
        answer = max(answer, prefix[r] - prefix[q.front()]);
        while (!q.empty() && prefix[q.back()] >= prefix[r])
            q.pop_back();
        q.push_back(r);
    }
    cout << answer << '\n';
}
`,
    python: String.raw`import sys
from collections import deque


def main():
    data = list(map(int, sys.stdin.buffer.read().split()))
    n, k = data[:2]
    prefix = [0]
    for value in data[2 : 2 + n]:
        prefix.append(prefix[-1] + value)
    queue = deque([0])
    answer = 0
    for r in range(1, n + 1):
        while queue and queue[0] < r - k:
            queue.popleft()
        answer = max(answer, prefix[r] - prefix[queue[0]])
        while queue and prefix[queue[-1]] >= prefix[r]:
            queue.pop()
        queue.append(r)
    print(answer)


if __name__ == "__main__":
    main()
`,
  }),
];
