import type { ToiPotentialLesson } from "@/lib/toiPotentialLessonTypes";
import { defineToiPotentialLesson } from "@/lib/toiPotentialLessonBuilder";

export const lessons: ToiPotentialLesson[] = [
  defineToiPotentialLesson("a331", {
    topic: "dp",
    level: "hard",
    concept: "尾端連續零狀態與矩陣快速冪",
    goal: "計算長達 2^60、完全不含 0000 的位元字串數。",
    explanation: [
      "以 d[j] 表示目前合法字串中，尾端恰有 j 個連續零的數量，j=0,1,2,3。加入 1 時四種狀態全部轉入 0；加入 0 時只能由 j 轉入 j+1，狀態 3 不得再接零。每個合法字串有唯一的最後一步，因此轉移不重複也不遺漏。空字串的初始向量是 (1,0,0,0)。",
      "固定轉移可寫成 4×4 矩陣 M，第一列全為 1，其餘三列的左下副對角為 1。答案是 M^N 乘初始向量後的四項總和。把 N 二進位分解，每次平方矩陣，遇到位元 1 就乘入向量；最多處理 61 個位元，不可逐個訊號模擬。所有乘加均對 1000000007 取餘數。",
    ],
    complexity:
      "時間 O(4³ log N)，空間 O(4²)；C++ 每次乘加取模，避免多個乘積累積溢位。",
    pitfall:
      "尾端零數不能取到 4；N 超過 32 位元，C++ 使用 long long。答案是四種尾端狀態之和。",
    traceLabel: "示例 N=5：尾端零的計數",
    trace: [
      {
        title: "空字串",
        description: "還沒送出訊號，唯一字串的尾端零數為 0。",
        cells: ["j=0:1", "j=1:0", "j=2:0", "j=3:0"],
        active: [0],
        variables: [
          ["長度", "0"],
          ["總數", "1"],
        ],
      },
      {
        title: "長度 3",
        description: "尚不可能出現四連零，八個字串都合法。",
        cells: ["4", "2", "1", "1"],
        active: [0, 1, 2, 3],
        variables: [
          ["長度", "3"],
          ["總數", "8"],
        ],
      },
      {
        title: "長度 4",
        description: "0000 被排除；狀態 3 的前驅只能是狀態 2。",
        cells: ["8", "4", "2", "1"],
        active: [3],
        variables: [
          ["長度", "4"],
          ["總數", "15"],
        ],
      },
      {
        title: "長度 5",
        description: "接 1 得 15 種，接零的三種尾端分別為 8、4、2。",
        cells: ["15", "8", "4", "2"],
        active: [0, 1, 2, 3],
        variables: [
          ["長度", "5"],
          ["答案", "29"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <array>
using namespace std;
using Matrix = array<array<long long, 4>, 4>;
const long long MOD = 1000000007;
Matrix mul(const Matrix &a, const Matrix &b) {
    Matrix c{};
    for (int i = 0; i < 4; i++)
        for (int k = 0; k < 4; k++)
            for (int j = 0; j < 4; j++)
                c[i][j] = (c[i][j] + a[i][k] * b[k][j]) % MOD;
    return c;
}
int main() {
    long long n;
    cin >> n;
    Matrix m{}, r{};
    for (int i = 0; i < 4; i++) {
        m[0][i] = 1;
        r[i][i] = 1;
    }
    for (int i = 1; i < 4; i++)
        m[i][i - 1] = 1;
    while (n) {
        if (n & 1)
            r = mul(r, m);
        m = mul(m, m);
        n >>= 1;
    }
    long long ans = 0;
    for (int i = 0; i < 4; i++)
        ans = (ans + r[i][0]) % MOD;
    cout << ans << '\n';
}`,
    python: String.raw`import sys

MOD = 1000000007


def mul(a, b):
    return [[sum(a[i][k] * b[k][j] for k in range(4)) % MOD for j in range(4)] for i in range(4)]


n = int(sys.stdin.buffer.readline())
m = [[1, 1, 1, 1], [1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0]]
r = [[int(i == j) for j in range(4)] for i in range(4)]
while n:
    if n & 1:
        r = mul(r, m)
    m = mul(m, m)
    n >>= 1
print(sum(row[0] for row in r) % MOD)
`,
  }),
  defineToiPotentialLesson("a332", {
    topic: "graphs",
    level: "medium",
    concept: "有向樹的換根計數",
    goal: "一次走訪求出所有電廠作為來源時的反轉數。",
    explanation: [
      "把 S→T 同時記為鄰接邊 (S,T,0) 與 (T,S,1)。從根 1 往外走時，權重就是這條邊是否需要反轉；樹上每個節點到根的路徑唯一，因此把所有父子邊權重相加就是 ans[1]。用陣列當走訪佇列建立父節點順序，避免鏈狀樹的遞迴深度問題。",
      "根由 u 移到相鄰的 v 時，只有 u-v 這一條邊改變所需方向，其他邊不變。若原方向 u→v，原先不用反轉、換根後需要，答案加 1；反方向則減 1。所以 ans[v]=ans[u]+1−2w。依父節點在前的順序算完所有答案，再按照查詢順序輸出；每次查詢都對原圖獨立計算。",
    ],
    complexity: "時間 O(N+K)，空間 O(N)；N≤10000，不為每個候選重新搜尋。",
    pitfall: "存反向鄰接邊時權重必須變成 1；換根不是把目前網路永久翻轉。",
    traceLabel: "小例：1→2、3→2",
    trace: [
      {
        title: "根在 1",
        description: "1→2 正確，2→3 需要翻轉。",
        cells: ["1→2", "3→2"],
        active: [1],
        variables: [["ans[1]", "1"]],
      },
      {
        title: "換根到 2",
        description: "跨過原本順向的 1→2，反轉數增加一。",
        cells: ["1→2", "3→2"],
        active: [0],
        variables: [["ans[2]", "2"]],
      },
      {
        title: "換根到 3",
        description: "由 2 跨過逆向邊抵達 3，反轉數減一。",
        cells: ["1→2", "3→2"],
        active: [1],
        variables: [
          ["ans[3]", "1"],
          ["三個答案", "1 2 1"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <utility>
using namespace std;
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, k;
    cin >> n >> k;
    vector<vector<pair<int, int>>> g(n);
    for (int i = 1, u, v; i < n; i++) {
        cin >> u >> v;
        --u;
        --v;
        g[u].push_back({v, 0});
        g[v].push_back({u, 1});
    }
    vector<int> parent(n, -1), weight(n), order{0}, ans(n);
    parent[0] = 0;
    for (size_t i = 0; i < order.size(); i++) {
        int u = order[i];
        for (auto [v, w] : g[u])
            if (parent[v] == -1) {
                parent[v] = u;
                weight[v] = w;
                ans[0] += w;
                order.push_back(v);
            }
    }
    for (size_t i = 1; i < order.size(); i++) {
        int v = order[i];
        ans[v] = ans[parent[v]] + 1 - 2 * weight[v];
    }
    for (int i = 0, p; i < k; i++) {
        cin >> p;
        if (i)
            cout << ' ';
        cout << ans[p - 1];
    }
    cout << '\n';
}`,
    python: String.raw`import sys


def main():
    data = iter(map(int, sys.stdin.buffer.read().split()))
    n, k = next(data), next(data)
    g = [[] for _ in range(n)]
    for _ in range(n - 1):
        u, v = next(data) - 1, next(data) - 1
        g[u].append((v, 0))
        g[v].append((u, 1))
    parent, weight = [-1] * n, [0] * n
    parent[0] = 0
    order, base = [0], 0
    for u in order:
        for v, w in g[u]:
            if parent[v] == -1:
                parent[v], weight[v] = u, w
                base += w
                order.append(v)
    ans = [base] * n
    for v in order[1:]:
        ans[v] = ans[parent[v]] + 1 - 2 * weight[v]
    print(' '.join(str(ans[next(data) - 1]) for _ in range(k)))


if __name__ == '__main__':
    main()
`,
  }),
  defineToiPotentialLesson("a333", {
    topic: "strings",
    level: "medium",
    concept: "環狀括號配對與前綴最小值",
    goal: "以一次掃描找出白花冠能獨自留下的所有插入縫隙。",
    explanation: [
      "字串沿左方列出，W 往後面的方向走，R 往前面的方向走，因此相鄰 WR 會互相消去。把 W 視為 +1、R 視為 −1。巧巧插入後若不被消去，從她後面開始讀原本 2N 人，必須是一個每個前綴和皆非負、總和為零的括號序列；若某前綴為負，就有紅花冠越過所有原本的白花冠而遇到巧巧。",
      "設原字串前綴和為 P，P[0]=P[2N]=0。從第 i 個字元前的縫隙切開後，所有環狀前綴非負，恰好等價於 P[i] 是全域最小值；跨過尾端時總和為零，所以仍是相對同一基準比較。只計算 i=0..2N−1，末端與開頭是同一個縫隙，不可算兩遍。",
    ],
    complexity:
      "時間 O(N)，輸入字串空間 O(N)，計數額外空間 O(1)，可處理 400000 個字元。",
    pitfall:
      "方向取決於題目『往左方依序看到』；此處是消去 WR，而非 RW。前綴起點有 2N 個。",
    traceLabel: "範例 WRRWWR：各縫隙的高度",
    trace: [
      {
        title: "前兩字",
        description: "起點高度 0，讀 W 後為 1，讀 R 回到 0。",
        cells: ["P0=0", "P1=1", "P2=0"],
        active: [0, 1, 2],
        variables: [["最低高度", "0"]],
      },
      {
        title: "第三字 R",
        description: "高度降為 −1；目前唯一的最低縫隙在第三字之後。",
        cells: ["P2=0", "P3=-1", "P4=0", "P5=1"],
        active: [1],
        variables: [
          ["最低高度", "-1"],
          ["次數", "1"],
        ],
      },
      {
        title: "從最低處切開",
        description: "旋轉成 WWRWRR，前綴 1,2,1,2,1,0 均非負。",
        cells: ["W", "W", "R", "W", "R", "R"],
        active: [0, 1, 2, 3, 4, 5],
        variables: [["合法縫隙數", "1"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <string>
using namespace std;
int main() {
    int n;
    string s;
    cin >> n >> s;
    int height = 0, low = 0, count = 0;
    for (char ch : s) {
        if (height < low) {
            low = height;
            count = 1;
        } else if (height == low)
            ++count;
        height += (ch == 'W' ? 1 : -1);
    }
    cout << count << '\n';
}`,
    python: String.raw`import sys

n = int(sys.stdin.buffer.readline())
s = sys.stdin.buffer.readline().strip()
height = low = count = 0
for ch in s:
    if height < low:
        low, count = height, 1
    elif height == low:
        count += 1
    height += 1 if ch == ord('W') else -1
print(count)
`,
  }),
  defineToiPotentialLesson("a334", {
    topic: "dp",
    level: "hard",
    concept: "子集合與最後一船人數的狀態壓縮",
    goal: "同時滿足重量與人數限制，精確求 N≤17 的最少船數。",
    explanation: [
      "任意分船方案都可排成逐人加入最後一船的順序。以 mask 表示已安排的旅客、c 表示最後一船人數，保存 (船數,最後一船重量) 中字典序最小的狀態。加入旅客時，若 c<M 且總重不超過 L，就接到最後一船；同時也允許直接開新船，不能因為目前裝得下就禁止另開一船。空集合用零艘船、零人、零重量表示。",
      "固定 mask,c 時，同船數下較輕的最後一船一定較好；較少船數的狀態也可支配較多船數的狀態：在下一位上船前另開一船，就至多追平較多船數的方案，而新船人數與重量都是零，能模仿該方案的全部後續安排。不同 c 仍可能各有優勢，不能只留一組 (船數,重量)。程式把狀態編碼為 船數×(L+1)+重量；每個 mask 只展開最少船數的狀態，並依 c 遞增，略過重量不比先前更輕的狀態，因為它們的人數和重量都已被支配。最壞複雜度不變，但可明顯減少無益轉移。",
    ],
    complexity:
      "時間 O(NM2^N)，空間 O(M2^N)。最大約 236 萬個狀態；Python 用 64 位元 array，避免每格 Python 物件的額外負擔。",
    pitfall:
      "不能直接套只有重量限制的電梯 DP；最後一船的人數也會影響能否加入下一人。",
    traceLabel: "範例 80,70,35,30；M=2、L=100",
    trace: [
      {
        title: "安排 80",
        description: "第一位必須開第一艘船。",
        cells: ["80", "70", "35", "30"],
        active: [0],
        variables: [
          ["船數", "1"],
          ["末船人數/重量", "1 / 80"],
        ],
      },
      {
        title: "70 與 30 共船",
        description: "另開一船放 70，再加入 30，重量剛好 100。",
        cells: ["[80]", "[70,30]", "35 未安排"],
        active: [1],
        variables: [
          ["船數", "2"],
          ["末船人數/重量", "2 / 100"],
        ],
      },
      {
        title: "35 開第三船",
        description: "總重量 215 大於兩船的 200，三船已達下界。",
        cells: ["[80]", "[70,30]", "[35]"],
        active: [2],
        variables: [
          ["答案", "3"],
          ["總重量", "215"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <algorithm>
#include <limits>
using namespace std;
int main() {
    int n, m, L;
    cin >> n >> m >> L;
    vector<int> w(n);
    for (int &x : w)
        cin >> x;
    int width = m + 1, full = (1 << n) - 1;
    long long base = L + 1, INF = n * base + L + 1;
    vector<long long> dp((full + 1) * width, INF);
    dp[0] = 0;
    for (int mask = 0; mask <= full; mask++) {
        long long bestBoats =
            *min_element(dp.begin() + mask * width, dp.begin() + (mask + 1) * width) / base;
        long long bestLoad = base;
        for (int c = 0; c <= m; c++) {
            long long state = dp[mask * width + c];
            if (state == INF)
                continue;
            long long boats = state / base, load = state % base;
            if (boats != bestBoats || load >= bestLoad)
                continue;
            bestLoad = load;
            for (int i = 0; i < n; i++)
                if (!(mask >> i & 1)) {
                    int pos = (mask | (1 << i)) * width;
                    dp[pos + 1] = min(dp[pos + 1], (boats + 1) * base + w[i]);
                    if (c > 0 && c < m && load + w[i] <= L)
                        dp[pos + c + 1] = min(dp[pos + c + 1], boats * base + load + w[i]);
                }
        }
    }
    cout << *min_element(dp.begin() + full * width, dp.end()) / base << '\n';
}`,
    python: String.raw`import sys
from array import array


def main():
    it = iter(map(int, sys.stdin.buffer.read().split()))
    n, m, limit = next(it), next(it), next(it)
    weights = [next(it) for _ in range(n)]
    width, base = m + 1, limit + 1
    full = (1 << n) - 1
    inf = n * base + limit + 1
    dp = array('q', [inf]) * ((full + 1) * width)
    dp[0] = 0
    for mask in range(full + 1):
        remaining = [(1 << i, weights[i]) for i in range(n) if not mask >> i & 1]
        offset = mask * width
        best_boats = min(dp[offset : offset + width]) // base
        best_load = base
        for count in range(width):
            state = dp[offset + count]
            if state == inf:
                continue
            boats, load = divmod(state, base)
            if boats != best_boats or load >= best_load:
                continue
            best_load = load
            for bit, weight in remaining:
                pos = (mask | bit) * width
                new = (boats + 1) * base + weight
                if new < dp[pos + 1]:
                    dp[pos + 1] = new
                if 0 < count < m and load + weight <= limit:
                    new = boats * base + load + weight
                    if new < dp[pos + count + 1]:
                        dp[pos + count + 1] = new
    print(min(dp[full * width :]) // base)


if __name__ == '__main__':
    main()
`,
  }),
  defineToiPotentialLesson("a335", {
    topic: "dp",
    level: "medium",
    concept: "矩形切割 DP 與第一刀分類",
    goal: "容許旋轉與廢料，求直線切到底的最高收益。",
    explanation: [
      "dp[r][c] 是 r×c 板材的最高營收。先把每種買家的直接收購價放入對應尺寸，重複尺寸取最大值，旋轉後能放進主板的尺寸也要登記。沒有買家收購的板材收益先設為零，對應可以整片留下當廢料。",
      "任何最優方案若沒有切割，就直接出售或留下；若有切割，第一刀一定將矩形分成上下或左右兩塊。因此枚舉水平切點 x，考慮 dp[x][c]+dp[r−x][c]，垂直切點同理。依 r、c 遞增計算，兩子矩形都已完成。反過來每種轉移都能實際切出，故不會高估。相對稱的兩個切點相同，只枚舉到一半即可。",
    ],
    complexity:
      "時間 O(N+RC(R+C))，空間 O(RC)；R,C≤200。最高收入不超過 RC×10000=4×10^8，C++ 仍使用 long long。",
    pitfall: "輸入順序是 v,w,h，不是 w,h,v；同尺寸最後讀到的價格可能比較低。",
    traceLabel: "小例 2×3：1×1 售 2、2×2 售 10",
    trace: [
      {
        title: "小矩形",
        description: "1×2 可切為兩塊 1×1，因此收入為 4。",
        cells: ["1×1:2", "1×2:4", "2×1:4"],
        active: [1, 2],
        variables: [["dp[1][2]", "4"]],
      },
      {
        title: "2×2",
        description: "直接賣 10，比切成四個單格的 8 更好。",
        cells: ["直接:10", "切割:8"],
        active: [0],
        variables: [["dp[2][2]", "10"]],
      },
      {
        title: "2×3",
        description: "切出 2×2 與 2×1，收入 10+4=14。",
        cells: ["2×2:10", "2×1:4"],
        active: [0, 1],
        variables: [["dp[2][3]", "14"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;
int main() {
    int R, C, n;
    cin >> R >> C >> n;
    vector<vector<long long>> dp(R + 1, vector<long long>(C + 1));
    while (n--) {
        int v, w, h;
        cin >> v >> w >> h;
        if (w <= R && h <= C)
            dp[w][h] = max(dp[w][h], (long long)v);
        if (h <= R && w <= C)
            dp[h][w] = max(dp[h][w], (long long)v);
    }
    for (int r = 1; r <= R; r++)
        for (int c = 1; c <= C; c++) {
            for (int x = 1; x <= r / 2; x++)
                dp[r][c] = max(dp[r][c], dp[x][c] + dp[r - x][c]);
            for (int y = 1; y <= c / 2; y++)
                dp[r][c] = max(dp[r][c], dp[r][y] + dp[r][c - y]);
        }
    cout << dp[R][C] << '\n';
}`,
    python: String.raw`import sys

it = iter(map(int, sys.stdin.buffer.read().split()))
rows, cols, n = next(it), next(it), next(it)
dp = [[0] * (cols + 1) for _ in range(rows + 1)]
for _ in range(n):
    value, w, h = next(it), next(it), next(it)
    if w <= rows and h <= cols:
        dp[w][h] = max(dp[w][h], value)
    if h <= rows and w <= cols:
        dp[h][w] = max(dp[h][w], value)
for r in range(1, rows + 1):
    row = dp[r]
    for c in range(1, cols + 1):
        best = row[c]
        for x in range(1, r // 2 + 1):
            best = max(best, dp[x][c] + dp[r - x][c])
        for y in range(1, c // 2 + 1):
            best = max(best, row[y] + row[c - y])
        row[c] = best
print(dp[rows][cols])
`,
  }),
  defineToiPotentialLesson("a336", {
    topic: "math",
    level: "easy",
    concept: "異色配對與總位移不變量",
    goal: "不用建棋盤，以 L、R 推導完成交換的操作數。",
    explanation: [
      "每枚紅棋都必須與每枚白棋交換相對次序，而且只准向前，所以每對異色棋必須恰好發生一次跳躍。跳躍總數固定是 LR；移動一格不改變任何異色配對的相對次序。",
      "每枚紅棋總共向右 R+1 格，每枚白棋總共向左 L+1 格，總位移為 L(R+1)+R(L+1)=2LR+L+R。一次跳躍提供兩格位移，因此剩下的一格移動總數為 L+R，操作數就是 LR+L+R。標準交換過程可交替把空格推過一批棋子，完成所有異色交叉；題目求完成時的步數，任何成功過程都受上述不變量約束。",
    ],
    complexity:
      "時間 O(1)，空間 O(1)；答案最大 10^18+2×10^9，必須使用 64 位元有號整數。",
    pitfall:
      "先以 long long 讀 L、R，避免整數乘法先在 32 位元溢位才轉型。不能跳過同色棋。",
    traceLabel: "小例 L=R=1，空格記為 _",
    trace: [
      {
        title: "起始 R_W",
        description: "紅棋向右移一格。",
        cells: ["R", "_", "W"],
        active: [0, 1],
        variables: [
          ["操作數", "0"],
          ["總需求位移", "4"],
        ],
      },
      {
        title: "_RW",
        description: "白棋跳過紅棋到左側空格，交換唯一的異色配對。",
        cells: ["_", "R", "W"],
        active: [0, 2],
        variables: [
          ["操作數", "1"],
          ["跳躍需求", "1"],
        ],
      },
      {
        title: "W_R 完成",
        description: "跳後為 WR_，紅棋再右移，合計一跳、兩次單步。",
        cells: ["W", "_", "R"],
        active: [1, 2],
        variables: [
          ["操作數", "3"],
          ["公式", "1×1+1+1=3"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
using namespace std;
int main() {
    long long L, R;
    cin >> L >> R;
    cout << L * R + L + R << '\n';
}`,
    python: String.raw`left, right = map(int, input().split())
print(left * right + left + right)
`,
  }),
  defineToiPotentialLesson("a337", {
    topic: "dp",
    level: "medium",
    concept: "帶權區間排程與二分前驅",
    goal: "在端點也占用會議室的規則下，選出收入最大的相容申請。",
    explanation: [
      "依結束時間排序，定義 dp[i] 為前 i 筆申請能獲得的最高收入。若不接受第 i 筆，保留 dp[i−1]；若接受 [a,b]、收入 c，之前接受的申請都必須在 a 之前結束。用二分搜尋找出結束時間嚴格小於 a 的申請數 p，這些前驅能提供的最佳收入是 dp[p]。",
      "轉移 dp[i]=max(dp[i−1],dp[p]+c)。最優解必然屬於是否接受最後一筆的其中一類；選取最後一筆後，剩餘部分若不是前 p 筆的最優解，就能替換成更好的方案，與最優性矛盾。結束時間相同時怎麼排序都不影響答案，因為 a≤b 使可用前驅必定更早結束。",
    ],
    complexity:
      "時間 O(N log N)，空間 O(N)；N≤200000，收入總和可達 2×10^9，C++ 使用 long long。",
    pitfall:
      "兩端點都包含，因此 b=a 仍衝突。使用 lower_bound(a)，不是 upper_bound(a)。",
    traceLabel: "範例 [1,4]:6、[2,7]:8、[5,6]:3",
    trace: [
      {
        title: "先看結束於 4",
        description: "接受第一筆可得 6。",
        cells: ["[1,4]:6", "[5,6]:3", "[2,7]:8"],
        active: [0],
        variables: [["dp[1]", "6"]],
      },
      {
        title: "再看結束於 6",
        description: "前驅結束 4<5，可接續得到 6+3。",
        cells: ["[1,4]:6", "[5,6]:3", "[2,7]:8"],
        active: [0, 1],
        variables: [
          ["p", "1"],
          ["dp[2]", "9"],
        ],
      },
      {
        title: "最後看結束於 7",
        description: "開始於 2，不能接前兩筆；單獨收入 8 不如 9。",
        cells: ["取第一筆", "取第二筆", "略過第三筆"],
        active: [2],
        variables: [["dp[3]", "9"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <tuple>
#include <algorithm>
using namespace std;
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    vector<tuple<int, int, int>> jobs;
    for (int i = 0, a, b, c; i < n; i++) {
        cin >> a >> b >> c;
        jobs.emplace_back(b, a, c);
    }
    sort(jobs.begin(), jobs.end());
    vector<int> ends;
    vector<long long> dp(n + 1);
    for (int i = 0; i < n; i++) {
        auto [b, a, c] = jobs[i];
        int p = lower_bound(ends.begin(), ends.end(), a) - ends.begin();
        dp[i + 1] = max(dp[i], dp[p] + c);
        ends.push_back(b);
    }
    cout << dp[n] << '\n';
}`,
    python: String.raw`import sys
from bisect import bisect_left

it = iter(map(int, sys.stdin.buffer.read().split()))
n = next(it)
jobs = []
for _ in range(n):
    a, b, c = next(it), next(it), next(it)
    jobs.append((b, a, c))
jobs.sort()
ends, dp = [], [0]
for b, a, c in jobs:
    p = bisect_left(ends, a)
    dp.append(max(dp[-1], dp[p] + c))
    ends.append(b)
print(dp[-1])
`,
  }),
  defineToiPotentialLesson("a338", {
    topic: "greedy",
    level: "hard",
    concept: "可完成性檢查引導字典序貪心",
    goal: "必須用完全部字母，逐位選出仍可完成的最大字元。",
    explanation: [
      "只挑目前能接的最大字母可能把大量 A 留到最後而無法排完。設剩餘字母數為 cnt，已輸出的尾端字母為 last、連續數為 run。對任何字母 x，其他字母數為 others，它們最多隔出 others+1 個槽，每槽可放 k 個 x；若 x=last，第一槽還要扣掉 run 的已用容量。因此必要條件是 cnt[x]≤k(others+1)−(x=last?run:0)。",
      "此條件也充分。設剩餘總數為 t；若某字母 y 滿足 cnt[y]>k(t−cnt[y])，下一位不能選其他字母，因為那會少掉一個分隔者而使 y 容量不足。這種字母至多一種，因為 k≥1 時它的數量嚴格超過 t/2。選 y 後自身容量條件仍成立；若 y 正是尾端且已連續 k 個，原本容量條件就會禁止上述嚴格不等式，所以不會被迫違規。若沒有這種字母，任選目前連續數允許的字母都保留全部容量條件。每次能少用一個字母並維持條件，歸納到空字串，證明存在合法完成方式。",
      "每一位依 C、B、A 嘗試，暫扣字母後檢查三個不等式，選第一個仍有合法後綴者。因為可完成性判準既必要又充分，這只排除不可能完成的前綴；在與任何其他合法排列的第一個不同位置，選到的字母必定最大。",
    ],
    complexity:
      "字母種類固定為 3，時間 O(a+b+c)，空間 O(a+b+c) 儲存輸出；容量乘積可達 3×10^10，C++ 用 long long。",
    pitfall:
      "不能丟棄剩餘字母；初始或任何候選後綴不合法時都必須回退，無解輸出精確字串 No Solution。",
    traceLabel: "小例 a=3,b=1,c=1,k=1",
    trace: [
      {
        title: "不能先放 C",
        description: "放 C 後剩 A=3,B=1，A 的槽只有兩個，容量 2<3。",
        cells: ["嘗試 C", "剩 A:3", "剩 B:1"],
        active: [0, 1],
        variables: [["可完成", "否"]],
      },
      {
        title: "先放 A",
        description: "B 同理也不能先放。A 後剩 A=2,B=1,C=1，有足夠分隔。",
        cells: ["前綴 A", "剩 A:2", "剩 B:1", "剩 C:1"],
        active: [0],
        variables: [["選擇", "A"]],
      },
      {
        title: "完成 ACABA",
        description: "A 後選 C，再用 A、B、A 交錯，全部用完且無相鄰相同字母。",
        cells: ["A", "C", "A", "B", "A"],
        active: [0, 1, 2, 3, 4],
        variables: [["答案", "ACABA"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <array>
#include <string>
using namespace std;
int main() {
    array<long long, 3> cnt;
    long long k;
    cin >> cnt[0] >> cnt[1] >> cnt[2] >> k;
    auto feasible = [&](int last, long long run) {
        long long total = cnt[0] + cnt[1] + cnt[2];
        for (int x = 0; x < 3; x++)
            if (cnt[x] > k * (total - cnt[x] + 1) - (x == last ? run : 0))
                return false;
        return true;
    };
    if (!feasible(-1, 0)) {
        cout << "No Solution\n";
        return 0;
    }
    int last = -1;
    long long run = 0, total = cnt[0] + cnt[1] + cnt[2];
    string out;
    while (total--) {
        for (int x = 2; x >= 0; x--) {
            if (!cnt[x] || (x == last && run == k))
                continue;
            long long nr = (x == last ? run + 1 : 1);
            --cnt[x];
            if (feasible(x, nr)) {
                out += char('A' + x);
                last = x;
                run = nr;
                break;
            }
            ++cnt[x];
        }
    }
    cout << out << '\n';
}`,
    python: String.raw`import sys


def main():
    a, b, c, k = map(int, sys.stdin.buffer.readline().split())
    count = [a, b, c]

    def feasible(last, run):
        total = sum(count)
        return all(
            count[x] <= k * (total - count[x] + 1) - (run if x == last else 0) for x in range(3)
        )

    if not feasible(-1, 0):
        print('No Solution')
        return
    last, run, out = -1, 0, []
    for _ in range(a + b + c):
        for x in (2, 1, 0):
            if not count[x] or (x == last and run == k):
                continue
            nr = run + 1 if x == last else 1
            count[x] -= 1
            if feasible(x, nr):
                out.append('ABC'[x])
                last, run = x, nr
                break
            count[x] += 1
    print(''.join(out))


if __name__ == '__main__':
    main()
`,
  }),
  defineToiPotentialLesson("a339", {
    topic: "dp",
    level: "medium",
    concept: "二進位數值解析與 0/1 子集合和",
    goal: "每張卡只能用一次，以位元集合維護所有可達總和。",
    explanation: [
      "二進位只是輸入寫法，先把每張卡與答案轉成整數。設可達總和集合最初只有 0；處理值 v 時，新集合是舊集合與『舊集合每個值加 v』的聯集。每一步都從更新前的集合產生新值，所以一張卡不會被重複使用。答案非零且卡皆為正，命中目標也自然代表至少選了一張。",
      "用 bitset 的第 s 個位元代表總和 s 是否可達，轉移為 bits |= bits << v。C++ 使用固定 2^19 位元的標準 bitset；Python 整數可直接當位元集合，但每次以遮罩保留不超過目標的位元，避免把無關的大總和也存下來。所有值為正，被截掉的大總和往後不可能降回目標。",
    ],
    complexity:
      "設 U=2^19。位元運算時間約 O(NU/w)、空間 O(U/w) 個機器字；Python 截到目標 S 時為 O(NS/w)，N≤100。",
    pitfall:
      "不是逐位 XOR：題目使用有進位的普通加法。也不能用由小到大的背包更新而讓同一卡重複選取。",
    traceLabel: "小例卡片 1、10，目標 100（二進位）",
    trace: [
      {
        title: "空集合",
        description: "數值 0 可達，目標數值為 4。",
        cells: ["0"],
        active: [0],
        variables: [["可達總和", "{0}"]],
      },
      {
        title: "使用第一張 1",
        description: "不選或選 1，得到 0、1。",
        cells: ["0", "1"],
        active: [1],
        variables: [["可達總和", "{0,1}"]],
      },
      {
        title: "使用第二張 10",
        description: "增加數值 2，可達集合為 0、1、2、3，沒有 4。",
        cells: ["0", "1", "10", "11"],
        active: [2, 3],
        variables: [
          ["目標 100", "不可達"],
          ["輸出", "NO"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <bitset>
#include <string>
using namespace std;
int main() {
    int n;
    cin >> n;
    bitset<(1 << 19)> possible;
    possible[0] = 1;
    string s;
    for (int i = 0; i < n; i++) {
        cin >> s;
        int v = stoi(s, nullptr, 2);
        possible |= (possible << v);
    }
    cin >> s;
    int target = stoi(s, nullptr, 2);
    cout << (possible[target] ? "YES" : "NO") << '\n';
}`,
    python: String.raw`import sys

lines = sys.stdin.buffer.read().split()
n = int(lines[0])
target = int(lines[n + 1], 2)
mask = (1 << (target + 1)) - 1
possible = 1
for text in lines[1 : n + 1]:
    v = int(text, 2)
    if v <= target:
        possible = (possible | (possible << v)) & mask
print('YES' if possible >> target & 1 else 'NO')
`,
  }),
  defineToiPotentialLesson("a340", {
    topic: "data-structures",
    level: "medium",
    concept: "等同關係並查集與互補雕像",
    goal: "將相同與不同狀態線索化為合併，偵測邏輯矛盾。",
    explanation: [
      "每個房間恰好破壞一座雕像，因此左、右狀態互補。將 2N 座雕像各當作一個並查集節點，編號為 2(room−1)+side，互補節點只要編號 XOR 1。S 線索合併 u 與 v，也合併 u 的互補與 v 的互補；D 線索則合併 u 與 v 的互補，以及 u 的互補與 v。",
      "合併的意義始終是『狀態必須相同』。若某座雕像與自己的互補在同一集合，就被迫同時相同又不同，故無解。反之，所有集合都可兩兩配對成互補集合，各對任選一邊破壞、另一邊保留，能同時滿足所有關係。因此最後檢查每個房間的兩節點即可。以逐行讀取處理最多 N² 條線索，不保留整份文字輸入。",
    ],
    complexity:
      "時間 O((N+T)α(N))，空間 O(N)；N≤2000、T≤4000000，輸入以串流處理。",
    pitfall:
      "D 不是只合併兩座雕像；要合併其中一座的互補。輸出大小寫與空白必須是 Easy Peasy 或 Impossible。",
    traceLabel: "小例：1L=2L、2L=3R、3L≠1R",
    trace: [
      {
        title: "第一條相同",
        description: "建立兩個互補集合。",
        cells: ["{1L,2L}", "{1R,2R}", "{3L}", "{3R}"],
        active: [0, 1],
        variables: [["矛盾", "尚無"]],
      },
      {
        title: "第二條相同",
        description: "3R 加入左集合，3L 加入右集合。",
        cells: ["{1L,2L,3R}", "{1R,2R,3L}"],
        active: [0, 1],
        variables: [["3L 與 1R", "已被迫相同"]],
      },
      {
        title: "加入不同線索",
        description: "要求 3L≠1R，迫使兩個互補集合合併，產生矛盾。",
        cells: ["{1L,1R,2L,2R,3L,3R}"],
        active: [0],
        variables: [["輸出", "Impossible"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <numeric>
#include <string>
#include <algorithm>
using namespace std;
struct DSU {
    vector<int> p, s;
    DSU(int n) : p(n), s(n, 1) {
        iota(p.begin(), p.end(), 0);
    }
    int find(int x) {
        while (p[x] != x) {
            p[x] = p[p[x]];
            x = p[x];
        }
        return x;
    }
    void join(int a, int b) {
        a = find(a);
        b = find(b);
        if (a == b)
            return;
        if (s[a] < s[b])
            swap(a, b);
        p[b] = a;
        s[a] += s[b];
    }
};
int id(string s) {
    return 2 * (stoi(s.substr(0, s.size() - 1)) - 1) + (s.back() == 'R');
}
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, t;
    cin >> n >> t;
    DSU d(2 * n);
    while (t--) {
        string a, b;
        char c;
        cin >> a >> b >> c;
        int u = id(a), v = id(b);
        if (c == 'D')
            v ^= 1;
        d.join(u, v);
        d.join(u ^ 1, v ^ 1);
    }
    bool ok = true;
    for (int i = 0; i < n; i++)
        if (d.find(2 * i) == d.find(2 * i + 1))
            ok = false;
    cout << (ok ? "Easy Peasy" : "Impossible") << '\n';
}`,
    python: String.raw`import sys


def main():
    read = sys.stdin.buffer.readline
    n, t = map(int, read().split())
    parent, size = list(range(2 * n)), [1] * (2 * n)

    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    def join(a, b):
        a, b = find(a), find(b)
        if a == b:
            return
        if size[a] < size[b]:
            a, b = b, a
        parent[b] = a
        size[a] += size[b]

    def ident(text):
        return 2 * (int(text[:-1]) - 1) + (text[-1] == ord('R'))

    for _ in range(t):
        a, b, kind = read().split()
        u, v = ident(a), ident(b)
        if kind == b'D':
            v ^= 1
        join(u, v)
        join(u ^ 1, v ^ 1)
    print('Easy Peasy' if all(find(2 * i) != find(2 * i + 1) for i in range(n)) else 'Impossible')


if __name__ == '__main__':
    main()
`,
  }),
  defineToiPotentialLesson("a341", {
    topic: "dp",
    level: "hard",
    concept: "遞迴數列增廣前綴和矩陣",
    goal: "用兩次快速冪求十億下標的區間和，不使用模逆元除法。",
    explanation: [
      "令 S_n=x_1+…+x_n，狀態為 (x_n,x_(n−1),S_n)。下一項是 a×x_n+b×x_(n−1)，新前綴和還要加上它。因此轉移矩陣三列依序為 (a,b,0)、(1,0,0)、(a,b,1)，起點 n=2 的向量為 (1,1,2)。這個增廣狀態同時維持原數列與精確前綴和不變量。",
      "用矩陣快速冪算 S(ub) 與 S(lb−1)，相減即為要求的區間和。這個方法對任意合法 a、b 都適用，不需要推導可能包含不可逆分母的等比級數公式。乘法與加法每次對 1000000009 取模，最後差加上模數再取模，避免 C++ 的負餘數。",
    ],
    complexity:
      "時間 O(3³ log ub)，空間 O(3²)。每個模乘積小於約 10^18，C++ long long 可容納，但每次乘加立即取模。",
    pitfall:
      "初始下標是 2，所以矩陣指數為 n−2；區間扣掉的是 S(lb−1)，不是 S(lb)。",
    traceLabel: "小例 a=b=1，區間 [4,6]",
    trace: [
      {
        title: "從 n=2 開始",
        description: "兩個初始項都是 1，前綴和為 2。",
        cells: ["x2=1", "x1=1", "S2=2"],
        active: [0, 1, 2],
        variables: [["指數起點", "2"]],
      },
      {
        title: "推到 n=3",
        description: "新項 2、前一項 1、總和 4，這是要扣除的前綴。",
        cells: ["x3=2", "x2=1", "S3=4"],
        active: [2],
        variables: [["S(lb−1)", "4"]],
      },
      {
        title: "推到 n=6",
        description: "前六項 1,1,2,3,5,8 的總和為 20。",
        cells: ["x6=8", "x5=5", "S6=20"],
        active: [2],
        variables: [["答案", "20−4=16"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <array>
using namespace std;
using Mat = array<array<long long, 3>, 3>;
const long long MOD = 1000000009;
Mat mul(const Mat &a, const Mat &b) {
    Mat c{};
    for (int i = 0; i < 3; i++)
        for (int k = 0; k < 3; k++)
            for (int j = 0; j < 3; j++)
                c[i][j] = (c[i][j] + a[i][k] * b[k][j]) % MOD;
    return c;
}
long long prefix(long long n, long long a, long long b) {
    if (n <= 2)
        return n;
    Mat m{{{a, b, 0}, {1, 0, 0}, {a, b, 1}}}, r{};
    for (int i = 0; i < 3; i++)
        r[i][i] = 1;
    for (n -= 2; n; n >>= 1) {
        if (n & 1)
            r = mul(r, m);
        m = mul(m, m);
    }
    return (r[2][0] + r[2][1] + 2 * r[2][2]) % MOD;
}
int main() {
    long long a, b, l, r;
    cin >> a >> b >> l >> r;
    cout << (prefix(r, a, b) - prefix(l - 1, a, b) + MOD) % MOD << '\n';
}
`,
    python: String.raw`import sys

MOD = 1000000009


def mul(a, b):
    return [[sum(a[i][k] * b[k][j] for k in range(3)) % MOD for j in range(3)] for i in range(3)]


def prefix(n, a, b):
    if n <= 2:
        return n
    m = [[a, b, 0], [1, 0, 0], [a, b, 1]]
    result = [[int(i == j) for j in range(3)] for i in range(3)]
    n -= 2
    while n:
        if n & 1:
            result = mul(result, m)
        m = mul(m, m)
        n >>= 1
    return (result[2][0] + result[2][1] + 2 * result[2][2]) % MOD


a, b, lo, hi = map(int, sys.stdin.buffer.readline().split())
print((prefix(hi, a, b) - prefix(lo - 1, a, b)) % MOD)
`,
  }),
];
