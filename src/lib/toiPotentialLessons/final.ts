import type { ToiPotentialLesson } from "@/lib/toiPotentialLessonTypes";
import { defineToiPotentialLesson } from "@/lib/toiPotentialLessonBuilder";

export const lessons: ToiPotentialLesson[] = [
  defineToiPotentialLesson("a353", {
    topic: "graphs",
    level: "medium",
    concept: "多源 BFS・最近商店距離",
    goal: "同時從所有商店出發，只走訪每個格子一次，找出最不便利的空地。",
    explanation: [
      "若對每塊空地各做一次搜尋，最壞要重複走訪整張地圖。把問題反向：同時將所有商店以距離 0 加入佇列，每次往上下左右可通行的格子擴張。因為每條邊成本均為 1，BFS 依距離遞增取出格子，空地第一次被發現時的距離，就是到最近任一家商店的最短距離。障礙物不會加入佇列。",
      "用一維陣列保存地圖，在四周補一圈不可走的哨兵。未發現空地記為 -1，商店距離為 0，障礙與哨兵記為 -2；發現空地時立刻寫入距離並加入佇列，避免從不同方向重複加入。每次更新空地距離也更新最大值。題目保證每塊空地都可到達商店，因此最後不需要為不可達格子定義額外輸出。Python 用 array('i') 保存整張距離表，逐行讀取，避免為百萬格保留多份大型整數表。",
    ],
    complexity: "時間 O(N²)，空間 O(N²)；每個格子最多入列一次。",
    pitfall:
      "先把所有商店一起入列，再開始 BFS；不能從單一商店的結果取最大，也不能穿過 -1 障礙物。",
    traceLabel: "公開範例一：多個商店的距離波前",
    trace: [
      {
        title: "距離 0 的起點",
        description:
          "3×3 地圖的商店位於 (1,3)、(3,2)，兩個起點同時加入佇列。座標以 1 起算。",
        cells: ["(1,3):0", "(3,2):0"],
        active: [0, 1],
        variables: [
          ["距離", "0"],
          ["最大值", "0"],
        ],
      },
      {
        title: "擴張到距離 1",
        description:
          "得到 (1,2)、(2,3)、(3,3)；(2,2) 與 (3,1) 是障礙，不能通行。",
        cells: ["(1,2):1", "(2,3):1", "(3,3):1"],
        active: [0, 1, 2],
        variables: [
          ["新空地", "3 格"],
          ["最大值", "1"],
        ],
      },
      {
        title: "最遠的空地",
        description:
          "接著 (1,1) 距離為 2，再由它到 (2,1) 得到距離 3；所有空地均已走訪，答案為 3。",
        cells: ["(1,1):2", "(2,1):3"],
        active: [1],
        variables: [
          ["佇列", "最後清空"],
          ["答案", "3"],
        ],
      },
    ],
    cpp: String.raw`#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    int stride = n + 2;
    vector<int> distance(stride * stride, -2);
    vector<int> queue;
    queue.reserve(n * n);
    for (int row = 1; row <= n; ++row) {
        for (int col = 1; col <= n; ++col) {
            int value;
            cin >> value;
            int position = row * stride + col;
            if (value == 0)
                distance[position] = -1;
            else if (value == 1) {
                distance[position] = 0;
                queue.push_back(position);
            }
        }
    }
    int answer = 0;
    const int offsets[] = {-stride, stride, -1, 1};
    for (size_t head = 0; head < queue.size(); ++head) {
        int current = queue[head];
        for (int offset : offsets) {
            int next = current + offset;
            if (distance[next] != -1)
                continue;
            distance[next] = distance[current] + 1;
            answer = max(answer, distance[next]);
            queue.push_back(next);
        }
    }
    cout << answer << '\n';
}
`,
    python: String.raw`from array import array
from collections import deque
import sys

read = sys.stdin.buffer.readline
n = int(read())
stride = n + 2
distance = array('i', [-2]) * (stride * stride)
queue = deque()
for row in range(1, n + 1):
    for col, value in enumerate(map(int, read().split()), 1):
        position = row * stride + col
        if value == 0:
            distance[position] = -1
        elif value == 1:
            distance[position] = 0
            queue.append(position)

answer = 0
offsets = (-stride, stride, -1, 1)
while queue:
    current = queue.popleft()
    next_distance = distance[current] + 1
    for offset in offsets:
        neighbor = current + offset
        if distance[neighbor] == -1:
            distance[neighbor] = next_distance
            answer = max(answer, next_distance)
            queue.append(neighbor)
print(answer)
`,
  }),
  defineToiPotentialLesson("a354", {
    topic: "dp",
    level: "hard",
    concept: "前序區間 DP・單調候選與二分交會",
    goal: "先推導最小加權樹高的區間轉移，再把三層迴圈優化為 O(N² log N)。",
    explanation: [
      "枯枝程度就是根到葉路徑上節點值總和的最大值。因節點值非負，最大可能值為全部值的總和，將樹排成單鏈即可達到。最小值則令 dp[l][r] 表示前序連續區間的最小程度。根必定是 d[l]，左子樹為 [l+1,k]，右子樹為 [k+1,r]，因此 dp[l][r]=d[l]+min_k max(dp[l+1][k],dp[k+1][r])；右子樹可為空，程度為 0。只考慮非空左子樹即可，因為只有右子樹的形狀可改成只有左子樹而保持前序及程度不變。",
      "固定 l、r 後，A(k)=dp[l+1][k] 隨 k 不減：任一前序區間的最後節點必為葉子，刪去它不會增加程度。但 B(k)=dp[k+1][r] 不一定單調，不能直接對 A(k) 與 B(k) 二分。若較早的切點 j≤k 滿足 B(j)≤B(k)，又有 A(j)≤A(k)，則 k 被 j 完全支配。只保留由左到右 B 嚴格下降的前綴最小候選。對這些候選，A 遞增、B 遞減，max(A,B) 的最小值只可能在兩者交會處兩側。",
      "依右端 r 遞增、左端 l 遞減計算。每次將新切點 l+1 從左側加入候選，用堆疊移除 B 大於或等於新值的舊切點；每個切點在同一欄最多進出一次。堆疊中的切點由右到左排列，A 遞減而 B 遞增，二分第一個 A≤B 的位置，再比較該位置與前一個候選。這不是對原本不單調的 B 二分，而是對支配刪除後的候選二分。N=1000 時需 O(N²) 表格；總和可到 10¹²，C++ 使用 long long。",
    ],
    complexity: "時間 O(N² log N)，空間 O(N²)；同一右端的候選維護合計 O(N)。",
    pitfall:
      "B(k) 不保證單調，例如刪除零權根可能增加最小樹高；必須先刪除被支配候選，不能直接二分全部切點。",
    traceLabel: "範例二：序列 3、1、1、0、2、0、5",
    trace: [
      {
        title: "根節點固定",
        description:
          "前序第一個值 3 是根。任意樹都包含根與值 5 的節點，因此程度至少為 3+5=8。",
        cells: ["根:3", "最大節點:5"],
        active: [0, 1],
        variables: [
          ["最小值下界", "8"],
          ["全部總和", "12"],
        ],
      },
      {
        title: "左子樹的連續區間",
        description:
          "選擇左區間 [1,1,0,2]。令第一個 1 為根，左側是 1→0，右側是 2，程度為 1+max(1,2)=3。",
        cells: ["根:1", "左:1→0", "右:2"],
        active: [0, 2],
        variables: [["dp[1][4]", "3"]],
      },
      {
        title: "合併左右子樹",
        description:
          "右區間 [0,5] 的程度為 5。合併得到 3+max(3,5)=8，達到下界，最小值確定為 8。",
        cells: ["左:3", "根:3", "右:5"],
        active: [1, 2],
        variables: [
          ["切點 k", "4（0 起算）"],
          ["最小程度", "8"],
        ],
      },
      {
        title: "最大值用單鏈",
        description:
          "依序把所有節點接在同一條鏈上，保持前序順序，程度就是 3+1+1+0+2+0+5=12。",
        cells: ["3→1→1→0→2→0→5"],
        active: [0],
        variables: [["輸出", "8 12"]],
      },
    ],
    cpp: String.raw`#include <algorithm>
#include <iostream>
#include <limits>
#include <numeric>
#include <vector>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    vector<long long> weight(n);
    for (auto &value : weight)
        cin >> value;
    vector<vector<long long>> dp(n, vector<long long>(n));
    for (int right = 0; right < n; ++right) {
        dp[right][right] = weight[right];
        vector<int> cuts;
        vector<long long> costs;
        for (int left = right - 1; left >= 0; --left) {
            int cut = left + 1;
            long long rightCost = cut < right ? dp[cut + 1][right] : 0;
            while (!costs.empty() && costs.back() >= rightCost) {
                cuts.pop_back();
                costs.pop_back();
            }
            cuts.push_back(cut);
            costs.push_back(rightCost);
            const auto &row = dp[left + 1];
            int low = 0, high = static_cast<int>(cuts.size());
            while (low < high) {
                int middle = (low + high) / 2;
                if (row[cuts[middle]] <= costs[middle])
                    high = middle;
                else
                    low = middle + 1;
            }
            long long best = numeric_limits<long long>::max();
            if (low < static_cast<int>(cuts.size()))
                best = max(row[cuts[low]], costs[low]);
            if (low > 0)
                best = min(best, max(row[cuts[low - 1]], costs[low - 1]));
            dp[left][right] = weight[left] + best;
        }
    }
    cout << dp[0][n - 1] << ' ' << accumulate(weight.begin(), weight.end(), 0LL) << '\n';
}
`,
    python: String.raw`import sys


def main():
    data = list(map(int, sys.stdin.buffer.read().split()))
    n = data[0]
    weight = data[1:]
    dp = [[0] * n for _ in range(n)]
    for right in range(n):
        dp[right][right] = weight[right]
        cuts = []
        costs = []
        for left in range(right - 1, -1, -1):
            cut = left + 1
            right_cost = dp[cut + 1][right] if cut < right else 0
            while costs and costs[-1] >= right_cost:
                cuts.pop()
                costs.pop()
            cuts.append(cut)
            costs.append(right_cost)
            row = dp[left + 1]
            low, high = 0, len(cuts)
            while low < high:
                middle = (low + high) // 2
                if row[cuts[middle]] <= costs[middle]:
                    high = middle
                else:
                    low = middle + 1
            best = 10**30
            if low < len(cuts):
                best = max(row[cuts[low]], costs[low])
            if low:
                best = min(best, max(row[cuts[low - 1]], costs[low - 1]))
            dp[left][right] = weight[left] + best
    print(dp[0][-1], sum(weight))


main()
`,
  }),
  defineToiPotentialLesson("a355", {
    topic: "graphs",
    level: "medium",
    concept: "有向可達性・位元集合傳遞閉包",
    goal: "先算出所有國家間的可達關係，讓兩萬筆查詢都能直接回答。",
    explanation: [
      "航班是有向邊，A→B 不表示 B→A。N≤200 而 Q 可到 20000，與其每次查詢重新走訪，不如先求所有點對可達性。reach[u] 的第 v 個位元表示 u 可到達 v；讀入航班時設定對應位元。教材採可達性的通常定義：留在原地也可到達自己，因此初始設定對角線；本地題敘沒有另行定義 A=B 必須搭乘至少一次的情形。",
      "依序允許 k 當中繼點。若 u 已可到 k，就將 reach[k] 的所有目的地用 OR 合併進 reach[u]。處理 k 前，每列已包含只經由更早中繼點的路徑；處理後便包含也可經過 k 的路徑，這是 Warshall 的傳遞閉包轉移。C++ 用 bitset<200>，Python 用任意精度整數當位元集合，不需第三方套件。查詢只測試一個位元並輸出 YES 或 NO；相同航班重複出現也不影響 OR 的結果。",
    ],
    complexity:
      "閉包時間 O(N²⌈N/w⌉)，讀入與輸出 O(M+Q)；位元表空間 O(N⌈N/w⌉)，Python 整批輸入與答案另佔 O(M+Q)。",
    pitfall:
      "不可當成無向圖；必須讓中繼點 k 在最外層。自我可達採零段路徑定義，不把未明訂的至少一段航班條件偷偷加入。",
    traceLabel: "範例一：0→1→2 的傳遞閉包",
    trace: [
      {
        title: "保存直接航班",
        description:
          "有 0→1、1→2，以及每個點到自身的零段路徑，尚未合併轉機資訊。",
        cells: ["0:{0,1}", "1:{1,2}", "2:{2}"],
        active: [0, 1],
        variables: [
          ["N", "3"],
          ["航班", "2 條"],
        ],
      },
      {
        title: "允許在 1 轉機",
        description:
          "因為 0 可到 1，將 1 可到達的集合 OR 進 0 的集合，得到 0 也可到 2。",
        cells: ["0:{0,1,2}", "1:{1,2}", "2:{2}"],
        active: [0],
        variables: [
          ["中繼 k", "1"],
          ["新增關係", "0→2"],
        ],
      },
      {
        title: "回答兩個方向",
        description: "0→2 可經由 1 轉機，輸出 YES；1→0 沒有航班路徑，輸出 NO。",
        cells: ["0→2:YES", "1→0:NO"],
        active: [0, 1],
        variables: [["查詢成本", "一個位元測試"]],
      },
    ],
    cpp: String.raw`#include <bitset>
#include <iostream>
#include <vector>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, m, q;
    cin >> n >> m >> q;
    vector<bitset<200>> reach(n);
    for (int u = 0; u < n; ++u)
        reach[u].set(u);
    for (int edge = 0; edge < m; ++edge) {
        int from, to;
        cin >> from >> to;
        reach[from].set(to);
    }
    for (int k = 0; k < n; ++k) {
        for (int u = 0; u < n; ++u) {
            if (reach[u].test(k))
                reach[u] |= reach[k];
        }
    }
    while (q--) {
        int from, to;
        cin >> from >> to;
        cout << (reach[from].test(to) ? "YES" : "NO") << '\n';
    }
}
`,
    python: String.raw`import sys

data = iter(map(int, sys.stdin.buffer.read().split()))
n, m, q = next(data), next(data), next(data)
reach = [1 << u for u in range(n)]
for _ in range(m):
    start, end = next(data), next(data)
    reach[start] |= 1 << end

for k in range(n):
    bit = 1 << k
    destinations = reach[k]
    for start in range(n):
        if reach[start] & bit:
            reach[start] |= destinations

answers = []
for _ in range(q):
    start, end = next(data), next(data)
    answers.append("YES" if (reach[start] >> end) & 1 else "NO")
print('\n'.join(answers))
`,
  }),
];
