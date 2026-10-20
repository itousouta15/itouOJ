import type { ToiPotentialLesson } from "@/lib/toiPotentialLessonTypes";
import { defineToiPotentialLesson } from "@/lib/toiPotentialLessonBuilder";

export const lessons: ToiPotentialLesson[] = [
  defineToiPotentialLesson("a119", {
    topic: "search",
    level: "medium",
    concept: "循環時間・出現位置二分搜尋",
    goal: "每張頂牌直接跳到下一次可出的回合，避免逐回合模擬。",
    explanation: [
      "先為輪盤上的每種數字建立遞增的出現位置表，位置從 1 起算。牌面只有 0～49，所以更大的輪盤數字不需要保存；C++ 讀成十進位字串並截斷到 50，避免題敘未限制輪盤值上限造成溢位。若某張牌在輪盤上完全沒出現，該玩家永遠無法完成。否則給定上一張出牌回合 t，令 t=cycle×K+rem，在位置表二分找第一個大於 rem 的位置；沒有就跳到下一圈第一個位置。",
      "每回合最多出一張，因此必須嚴格晚於 t，不能讓兩張相同的牌共用同回合。盡早打出頂牌不會阻礙後續牌：任何較晚的打法，其剩餘牌能使用的回合也能由較早打法等待取得。逐張選最早可用回合即為全體最早完成時間，各玩家獨立計算。",
    ],
    complexity:
      "預處理 O(K+輪盤輸入字元數)，所有玩家 O(NM log K)，空間 O(K+M+N)（Python 另有全部輸入字元的暫存）；K≤3000、NM≤10⁶。",
    pitfall:
      "輪盤位置由第 1 回合開始；上一張出牌的同一回合不可再次使用。讀到不可能的牌仍須消耗該玩家其餘輸入。",
    traceLabel: "公開範例：輪盤 1 2 1 3，第二位玩家 3 2 1",
    trace: [
      {
        title: "先出牌 3",
        description: "輪盤的數字 3 只在位置 4，第一張於第 4 回合出。",
        cells: ["1", "2", "1", "3"],
        active: [3],
        variables: [["已用回合", "4"]],
      },
      {
        title: "下一圈出牌 2",
        description: "第 4 回合後，下一個 2 在第二圈的位置 2，即第 6 回合。",
        cells: ["第5回合:1", "第6回合:2", "第7回合:1", "第8回合:3"],
        active: [1],
        variables: [["已用回合", "6"]],
      },
      {
        title: "第 7 回合出完",
        description: "下一個 1 在位置 3，故完成回合為 7。",
        cells: ["牌3:回合4", "牌2:回合6", "牌1:回合7"],
        active: [2],
        variables: [["答案", "7"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <algorithm>
#include <string>
using namespace std;
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int k, n, m;
    cin >> k >> n >> m;
    vector<vector<int>> pos(50);
    for (int i = 1; i <= k; ++i) {
        string token;
        cin >> token;
        int x = 0;
        for (char digit : token)
            x = min(50, x * 10 + (digit - '0'));
        if (x < 50)
            pos[x].push_back(i);
    }
    for (int player = 0; player < n; ++player) {
        long long t = 0;
        bool possible = true;
        for (int j = 0; j < m; ++j) {
            int x;
            cin >> x;
            if (!possible)
                continue;
            if (pos[x].empty()) {
                possible = false;
                continue;
            }
            long long cycle = t / k;
            int rem = t % k;
            auto it = upper_bound(pos[x].begin(), pos[x].end(), rem);
            if (it == pos[x].end())
                t = (cycle + 1) * k + pos[x][0];
            else
                t = cycle * k + *it;
        }
        cout << (possible ? t : -1) << '\n';
    }
}`,
    python: String.raw`import sys
from bisect import bisect_right

it = iter(sys.stdin.buffer.read().split())
k, n, m = int(next(it)), int(next(it)), int(next(it))
positions = [[] for _ in range(50)]
for i in range(1, k + 1):
    token = next(it).lstrip(b'0')
    if len(token) <= 2:
        x = int(token or b'0')
        if x < 50:
            positions[x].append(i)
answers = []
for _ in range(n):
    time = 0
    possible = True
    for _ in range(m):
        x = int(next(it))
        if not possible:
            continue
        pos = positions[x]
        if not pos:
            possible = False
            continue
        cycle, rem = divmod(time, k)
        j = bisect_right(pos, rem)
        time = (cycle + 1) * k + pos[0] if j == len(pos) else cycle * k + pos[j]
    answers.append(str(time if possible else -1))
print('\n'.join(answers))
`,
  }),
  defineToiPotentialLesson("a120", {
    topic: "dp",
    level: "hard",
    concept: "滑動最大值・單調佇列最佳化 DP",
    goal: "以最近 D 個停靠點的最佳收益，線性算完二十萬鄉鎮。",
    explanation: [
      "令 dp[i] 為最後停靠在 i 的最大收益，起點 dp[1]=0。上一個停靠點只能在 [i-D,i-1]，故 dp[i]=Pi+max dp[j]；終點的收益設為 0。即使收益全負也必須沿合法距離抵達終點，不能把狀態隨意重設成 0。",
      "用遞減的雙端佇列維護候選 dp。先移除距離太遠的隊首，再取隊首計算；加入 i 前，移除隊尾所有 dp≤dp[i] 的點。較新的 i 收益不低且更晚過期，完全支配這些隊尾，所以刪除安全。每個點至多入隊、出隊一次，使區間最大值從 O(D) 降到攤銷 O(1)。",
    ],
    complexity:
      "時間 O(N)、空間 O(N)（佇列最多 O(D)）；N≤200000，收益絕對值最多約 2×10⁸。",
    pitfall: "起點、終點收益都是 0；負收益不能直接略過，D 小時可能必須停靠。",
    traceLabel: "公開範例：N=6、D=2，收益 4 -8 5 -2",
    trace: [
      {
        title: "算到第 3 鎮",
        description: "dp[2]=4，dp[3]=max(0,4)-8=-4。",
        cells: ["1:0", "2:4", "3:-4"],
        active: [1, 2],
        variables: [["候選佇列", "2:4,3:-4"]],
      },
      {
        title: "算到第 4 鎮",
        description: "可接第 2、3 鎮，dp[4]=max(4,-4)+5=9；9 支配舊候選。",
        cells: ["2:4", "3:-4", "4:9"],
        active: [2],
        variables: [["候選佇列", "4:9"]],
      },
      {
        title: "終點取最大值",
        description: "dp[5]=7，dp[6]=max(dp[4],dp[5])=9；最佳停靠 1→2→4→6。",
        cells: ["4:9", "5:7", "6:9"],
        active: [2],
        variables: [["答案", "9"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <deque>
using namespace std;
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, d;
    cin >> n >> d;
    vector<long long> profit(n, 0), dp(n);
    for (int i = 1; i < n - 1; ++i)
        cin >> profit[i];
    deque<int> q = {0};
    for (int i = 1; i < n; ++i) {
        while (q.front() < i - d)
            q.pop_front();
        dp[i] = dp[q.front()] + profit[i];
        while (!q.empty() && dp[q.back()] <= dp[i])
            q.pop_back();
        q.push_back(i);
    }
    cout << dp.back() << '\n';
}`,
    python: String.raw`import sys
from collections import deque

data = list(map(int, sys.stdin.buffer.read().split()))
n, d = data[:2]
profit = [0] + data[2:] + [0]
dp = [0] * n
queue = deque([0])
for i in range(1, n):
    while queue[0] < i - d:
        queue.popleft()
    dp[i] = dp[queue[0]] + profit[i]
    while queue and dp[queue[-1]] <= dp[i]:
        queue.pop()
    queue.append(i)
print(dp[-1])
`,
  }),
  defineToiPotentialLesson("a121", {
    topic: "greedy",
    level: "easy",
    concept: "容量排序・人數可行性",
    goal: "選擇最能接受大團體的員工，找出最大的可行參加人數。",
    explanation: [
      "若要邀請 k 人，每個人的上限都必須至少是 k。因此 k 可行的充要條件是至少 k 個 ai≥k。把 ai 由大到小排序後，只要檢查第 k 大的值是否≥k：若成立，前 k 位就是一組可行選擇；若不成立，全公司也找不到 k 位合格員工。",
      "依序增加 k，第一次失敗即可停止。因為後面的上限只會更小，而要求的人數更大，不可能重新變可行。這個推導直接使用題目『包含自己』的人數上限，並不涉及是否邀請其他員工的意願推測。",
    ],
    complexity:
      "排序時間 O(N log N)，掃描 O(N)，空間 O(N)（含排序實作）；N≤200000。",
    pitfall: "ai 是包含自己的參加總人數上限；條件是 ai≥k，不能反向比較。",
    traceLabel: "公開範例：上限 2 4 4 1",
    trace: [
      {
        title: "排序",
        description: "優先考慮上限較大的員工。",
        cells: ["4", "4", "2", "1"],
        active: [0, 1, 2, 3],
        variables: [["排序", "遞減"]],
      },
      {
        title: "兩人可行",
        description: "第 2 大上限 4≥2，邀請兩位上限 4 的員工。",
        cells: ["4", "4", "2", "1"],
        active: [0, 1],
        variables: [
          ["k", "2"],
          ["可行", "是"],
        ],
      },
      {
        title: "三人不可行",
        description:
          "第 3 大上限為 2<3，只有兩個人接受三人活動，因此答案為 2。",
        cells: ["4", "4", "2", "1"],
        active: [2],
        variables: [
          ["k", "3"],
          ["答案", "2"],
        ],
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
    vector<int> a(n);
    for (int &x : a)
        cin >> x;
    sort(a.begin(), a.end(), greater<int>());
    int answer = 0;
    for (int k = 1; k <= n; ++k) {
        if (a[k - 1] < k)
            break;
        answer = k;
    }
    cout << answer << '\n';
}`,
    python: String.raw`import sys

data = list(map(int, sys.stdin.buffer.read().split()))
a = sorted(data[1:], reverse=True)
answer = 0
for k, upper in enumerate(a, 1):
    if upper < k:
        break
    answer = k
print(answer)
`,
  }),
  defineToiPotentialLesson("a122", {
    topic: "data-structures",
    level: "hard",
    concept: "排列排名・Fenwick 樹統計未使用小數字",
    goal: "把字典序中排在前面的序列按第一個不同位置分組計數。",
    explanation: [
      "固定前 i 個數後，若下一位改放一個比 ai 小且尚未使用的數字，剩餘 N-i-1 位可以從 M-i-1 個數排列填入，數量為下降階乘 P(M-i-1,N-i-1)（i 從 0 起算）。每個較早序列都有唯一第一個不同位置，因此加總各位置的『較小未用個數×後綴排列數』就是零起算排名。",
      "Fenwick 樹記錄已使用數字的頻率。ai-1 減去已使用且小於 ai 的個數，就是本位可替代的數量。後綴權重從最後一位的 1 往前乘 M-i-1 預處理，不必對模數做除法。每次先查詢再標記 ai 使用，全部計數都取模。",
    ],
    complexity: "時間 O(N log M)，空間 O(N+M)；N≤M≤200000，乘法使用 64 位元。",
    pitfall:
      "是從 1～M 取 N 個不同數的部分排列；後綴權重不是單純 (N-i-1)!，而且排名從 0 開始。",
    traceLabel: "公開範例：N=3、M=5，序列 2 5 1",
    trace: [
      {
        title: "第一位 2",
        description: "未用且小於 2 的只有 1，後兩位共有 4×3=12 種。",
        cells: ["2", "5", "1"],
        active: [0],
        variables: [
          ["本位貢獻", "1×12=12"],
          ["累計", "12"],
        ],
      },
      {
        title: "第二位 5",
        description: "已用 2，小於 5 的未用數是 1、3、4；每種後綴有 3 個選擇。",
        cells: ["已用2", "候選1,3,4", "權重3"],
        active: [1, 2],
        variables: [
          ["本位貢獻", "3×3=9"],
          ["累計", "21"],
        ],
      },
      {
        title: "第三位 1",
        description: "沒有更小可用數，貢獻 0，零起算排名為 21。",
        cells: ["2", "5", "1"],
        active: [2],
        variables: [
          ["本位貢獻", "0"],
          ["答案", "21"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
using namespace std;
const long long MOD = 1000000007;
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, m;
    cin >> n >> m;
    vector<int> a(n), bit(m + 1);
    for (int &x : a)
        cin >> x;
    vector<long long> weight(n, 1);
    for (int i = n - 2; i >= 0; --i)
        weight[i] = weight[i + 1] * (m - i - 1) % MOD;
    long long rank = 0;
    for (int i = 0; i < n; ++i) {
        int used = 0;
        for (int x = a[i] - 1; x > 0; x -= x & -x)
            used += bit[x];
        rank = (rank + (a[i] - 1 - used) * weight[i]) % MOD;
        for (int x = a[i]; x <= m; x += x & -x)
            ++bit[x];
    }
    cout << rank << '\n';
}`,
    python: String.raw`import sys

MOD = 1000000007
data = list(map(int, sys.stdin.buffer.read().split()))
n, m = data[:2]
a = data[2:]
weight = [1] * n
for i in range(n - 2, -1, -1):
    weight[i] = weight[i + 1] * (m - i - 1) % MOD
bit = [0] * (m + 1)
rank = 0
for i, value in enumerate(a):
    used = 0
    x = value - 1
    while x:
        used += bit[x]
        x -= x & -x
    rank = (rank + (value - 1 - used) * weight[i]) % MOD
    x = value
    while x <= m:
        bit[x] += 1
        x += x & -x
print(rank)
`,
  }),
  defineToiPotentialLesson("a123", {
    topic: "graphs",
    level: "hard",
    concept: "方向擴充狀態・非負權 Dijkstra",
    goal: "將格子與進入方向合併，正確計算轉彎增加的損傷。",
    explanation: [
      "同一格若由不同方向抵達，下一步是否轉彎可能不同，因此不能只為一格保存一個距離。令 dist[格子][方向] 為以該方向駛入的最小損傷。從 (u,d) 往方向 e 走到 v，增加格值 grid[v]，另加上 d≠e 的 1。禁止格不能建立轉移。",
      "所有邊權介於 0～10，可使用 Dijkstra。把起點四個方向都設為 0，等同允許自由選擇第一次方向，不收首次轉彎費；之後每條轉移都按真實方向計費。擴充圖中的每條路徑對應實際駕駛路線，反之亦然，因此首次取出的任一終點方向就是最小總損傷。",
    ],
    complexity:
      "令 V=MN，狀態 4V、邊數≤16V；時間 O(V log V)、空間 O(V)，M、N≤500。Python 使用緊密陣列保存距離。",
    pitfall:
      "抵達同一格的較低損傷不一定支配其他方向；第一次移動不加轉彎費。堆中過期距離應跳過。",
    traceLabel: "公開範例：沿左邊及下邊避開數值 2",
    trace: [
      {
        title: "第一次往下",
        description: "(0,0)→(1,0)，格值 0，首次選方向免費。",
        cells: ["(0,0)", "(1,0),向下"],
        active: [1],
        variables: [["累積損傷", "0"]],
      },
      {
        title: "沿左邊到底",
        description: "(1,0)→(2,0) 仍向下，不轉彎。",
        cells: ["(1,0)", "(2,0),向下"],
        active: [1],
        variables: [["累積損傷", "0"]],
      },
      {
        title: "向右抵達終點",
        description: "在 (2,0) 改向右增加 1，再直行到 (2,2)，總損傷 1。",
        cells: ["(2,0)", "(2,1),向右", "(2,2),向右"],
        active: [1, 2],
        variables: [
          ["轉彎次數", "1"],
          ["答案", "1"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <queue>
#include <functional>
using namespace std;
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int m, n;
    cin >> m >> n;
    int cells = m * n;
    vector<int> g(cells);
    for (int &x : g)
        cin >> x;
    const int INF = 1000000000;
    vector<int> dist(4 * cells, INF);
    priority_queue<pair<int, int>, vector<pair<int, int>>, greater<pair<int, int>>> pq;
    for (int d = 0; d < 4; ++d) {
        dist[d] = 0;
        pq.push({0, d});
    }
    int dr[] = {-1, 1, 0, 0}, dc[] = {0, 0, -1, 1};
    while (!pq.empty()) {
        auto [cost, state] = pq.top();
        pq.pop();
        if (cost != dist[state])
            continue;
        int u = state / 4, d = state % 4;
        if (u == cells - 1) {
            cout << cost << '\n';
            return 0;
        }
        for (int e = 0; e < 4; ++e) {
            int r = u / n + dr[e], c = u % n + dc[e];
            if (r < 0 || r >= m || c < 0 || c >= n)
                continue;
            int v = r * n + c;
            if (g[v] < 0)
                continue;
            int next = 4 * v + e, candidate = cost + g[v] + (d != e);
            if (candidate < dist[next]) {
                dist[next] = candidate;
                pq.push({candidate, next});
            }
        }
    }
    cout << -1 << '\n';
}`,
    python: String.raw`import sys
import heapq
from array import array

read = sys.stdin.buffer.readline
m, n = map(int, read().split())
grid = array('b')
for _ in range(m):
    grid.extend(map(int, read().split()))


def minimum_damage(grid, m, n):
    cells = m * n
    INF = 10**9
    dist = array('i', [INF]) * (4 * cells)
    heap = []
    for d in range(4):
        dist[d] = 0
        heapq.heappush(heap, (0, d))
    directions = ((-1, 0), (1, 0), (0, -1), (0, 1))
    while heap:
        cost, state = heapq.heappop(heap)
        if cost != dist[state]:
            continue
        u, direction = divmod(state, 4)
        if u == cells - 1:
            return cost
        r, c = divmod(u, n)
        for e, (dr, dc) in enumerate(directions):
            nr, nc = r + dr, c + dc
            if not (0 <= nr < m and 0 <= nc < n):
                continue
            v = nr * n + nc
            if grid[v] < 0:
                continue
            nxt = 4 * v + e
            candidate = cost + grid[v] + (direction != e)
            if candidate < dist[nxt]:
                dist[nxt] = candidate
                heapq.heappush(heap, (candidate, nxt))
    return -1


print(minimum_damage(grid, m, n))
`,
  }),
  defineToiPotentialLesson("a124", {
    topic: "strings",
    level: "hard",
    concept: "枚舉主角・雙指標限制其他字母",
    goal: "正確處理超限字母指定分數的規則，用線性滑窗枚舉主角。",
    explanation: [
      "固定某字母 c 當候選主角，讓它的次數不限，但其他字母不得超過各自上限，且窗口最多三種字母。每個右端點加入新字母後，只要種類超過三種或有非主角超限，就右移左端點直到合法。次數、種類數及超限的非主角種數都可在加入、刪除一字時 O(1) 更新；字串中未出現的字母不可能成為主角，可以略過。",
      "對固定右端點，最左的合法左端點給出最多的 c，任何更短窗口都不可能含更多 c。若此最大窗口不足三種，縮短也不會變成三種；恰三種時用 c 的次數更新答案。若 c 超限，它正是唯一超限字母，分數等於其次數；若 c 未超限，三者皆合法，真實分數至少為 c 的次數。另一方面，每個漂亮片段取其真正主角 c，都會被這次滑窗涵蓋或改善，因此枚舉 26 個 c 後所得最大值恰為答案。",
    ],
    complexity:
      "時間 O(26N)，額外空間 O(N+26)（儲存字元編號）；N≤400000，每次枚舉左、右指標都最多走 N 步。",
    pitfall:
      "有一種超限時，分數是該字母次數，即使另一種未超限字母出現更多也不能取它；只有兩種字母的窗口不能計分。",
    traceLabel: "公開範例 aaabbc，所有上限為 1，固定 b 為主角",
    trace: [
      {
        title: "右端到第三個 a",
        description: "a 不是主角，不能超過 1；左端移到第三個 a，窗口只剩 a。",
        cells: ["a已刪", "a已刪", "a", "b", "b", "c"],
        active: [2],
        variables: [
          ["窗口", "a"],
          ["種類", "1"],
        ],
      },
      {
        title: "加入兩個 b",
        description: "b 為主角可超限，窗口 abb，但還只有兩種字母。",
        cells: ["a", "b", "b"],
        active: [0, 1, 2],
        variables: [
          ["b次數", "2"],
          ["可計分", "否"],
        ],
      },
      {
        title: "加入 c",
        description: "窗口 abbc 恰三種，a、c 各一次不超限，b 的分數是 2。",
        cells: ["a:1", "b:2", "c:1"],
        active: [1],
        variables: [
          ["主角", "b"],
          ["答案", "2"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
using namespace std;
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    vector<int> limit(26);
    for (int &x : limit)
        cin >> x;
    string s;
    cin >> s;
    int answer = 0;
    for (int hero = 0; hero < 26; ++hero) {
        vector<int> count(26, 0);
        int left = 0, kinds = 0, bad = 0;
        for (int right = 0; right < n; ++right) {
            int x = s[right] - 'a';
            if (count[x]++ == 0)
                ++kinds;
            if (x != hero && count[x] == limit[x] + 1)
                ++bad;
            while (kinds > 3 || bad) {
                int y = s[left++] - 'a';
                if (y != hero && count[y] == limit[y] + 1)
                    --bad;
                if (--count[y] == 0)
                    --kinds;
            }
            if (kinds == 3)
                answer = max(answer, count[hero]);
        }
    }
    cout << answer << '\n';
}`,
    python: String.raw`import sys


def solve():
    read = sys.stdin.buffer.readline
    n = int(read())
    # over[x] is the first disallowed count; the hero never reaches its bound.
    limits = [int(x) + 1 for x in read().split()]
    letters = [x - 97 for x in read().strip()]
    present = set(letters)
    if len(present) < 3:
        print(0)
        return
    answer = 0
    for hero in present:
        over = limits[:]
        over[hero] = n + 1
        count = [0] * 26
        left = kinds = bad = 0
        for x in letters:
            if count[x] == 0:
                kinds += 1
            count[x] += 1
            if count[x] == over[x]:
                bad += 1
            while kinds > 3 or bad:
                y = letters[left]
                left += 1
                old = count[y]
                if old == over[y]:
                    bad -= 1
                count[y] = old - 1
                if old == 1:
                    kinds -= 1
            if kinds == 3 and count[hero] > answer:
                answer = count[hero]
    print(answer)


solve()
`,
  }),
  defineToiPotentialLesson("a125", {
    topic: "graphs",
    level: "hard",
    concept: "路程最短路閉包・加油站壓縮圖",
    goal: "用兩階段最短路，避開容量 F 高達一百萬的油量狀態。",
    explanation: [
      "先用 Floyd–Warshall 計算任兩城市間的最短道路距離 road[u][v]。如果距離≤F，代表一桶油可以從 u 到 v，中途經過其他城市也不必加油。建立壓縮圖：每個城市是一次補滿油的候選地點，一桶可達就能連邊。",
      "在壓縮圖上由 1 出發，移動到中途城市 v 的邊成本設為 tv，表示在 v 補滿後形成下一個狀態；抵達終點的成本設為 0，起點初始滿油也免費。任何實際路線可依加油點切成每段長度≤F 的區段，因此會有對應壓縮路徑；反過來每條壓縮邊都能以最短道路走完。邊權非負，再做 Dijkstra 即得最少等待時間。",
    ],
    complexity:
      "Floyd 時間 O(N³)，稠密 Dijkstra O(N²)，空間 O(N²)；N≤200，與 F 的大小無關。",
    pitfall:
      "允許剛好耗盡，條件為距離≤F；路過城市不代表必須加油，不能把每個路過城市的等待都算進去。",
    traceLabel: "公開範例：F=3，路段 1–2:2、2–3:1、3–4:2",
    trace: [
      {
        title: "求一桶油可達範圍",
        description:
          "1→2→3 共長 3，可不停靠加油就到 3；1 到 4 長 5，不可直達。",
        cells: ["road[1][2]=2", "road[1][3]=3", "road[1][4]=5"],
        active: [1],
        variables: [["F", "3"]],
      },
      {
        title: "比較加油點",
        description: "在 2 加油需 9 分鐘，在 3 加油只需 2 分鐘。",
        cells: ["城市2:9", "城市3:2"],
        active: [1],
        variables: [["下一個狀態", "3"]],
      },
      {
        title: "3 到 4 免費結束",
        description: "3→4 長 2≤F，抵達終點不需再加油，總等待 2。",
        cells: ["1滿油", "3加油:2", "4終點:0"],
        active: [2],
        variables: [["答案", "2"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, m, f;
    cin >> n >> m >> f;
    vector<int> wait(n, 0);
    for (int i = 1; i < n - 1; ++i)
        cin >> wait[i];
    const int INF = 1000000000;
    vector<vector<int>> road(n, vector<int>(n, INF));
    for (int i = 0; i < n; ++i)
        road[i][i] = 0;
    for (int i = 0; i < m; ++i) {
        int a, b, c;
        cin >> a >> b >> c;
        --a;
        --b;
        road[a][b] = road[b][a] = c;
    }
    for (int k = 0; k < n; ++k)
        for (int i = 0; i < n; ++i)
            for (int j = 0; j < n; ++j)
                road[i][j] = min(road[i][j], road[i][k] + road[k][j]);
    vector<int> dist(n, INF);
    vector<bool> done(n, false);
    dist[0] = 0;
    for (int step = 0; step < n; ++step) {
        int u = -1;
        for (int i = 0; i < n; ++i)
            if (!done[i] && (u == -1 || dist[i] < dist[u]))
                u = i;
        if (u == -1 || dist[u] == INF)
            break;
        done[u] = true;
        for (int v = 0; v < n; ++v)
            if (road[u][v] <= f)
                dist[v] = min(dist[v], dist[u] + wait[v]);
    }
    cout << (dist[n - 1] == INF ? -1 : dist[n - 1]) << '\n';
}`,
    python: String.raw`import sys

it = iter(map(int, sys.stdin.buffer.read().split()))
n, m, fuel = next(it), next(it), next(it)
wait = [0] + [next(it) for _ in range(n - 2)] + [0]
INF = 10**12
road = [[INF] * n for _ in range(n)]
for i in range(n):
    road[i][i] = 0
for _ in range(m):
    a, b, length = next(it) - 1, next(it) - 1, next(it)
    road[a][b] = road[b][a] = length


def shortest_roads(road):
    n = len(road)
    for k in range(n):
        via = road[k]
        for row in road:
            prefix = row[k]
            if prefix == INF:
                continue
            for j in range(n):
                candidate = prefix + via[j]
                if candidate < row[j]:
                    row[j] = candidate


shortest_roads(road)
dist = [INF] * n
dist[0] = 0
done = [False] * n
for _ in range(n):
    u = min((i for i in range(n) if not done[i]), key=dist.__getitem__, default=-1)
    if u == -1 or dist[u] == INF:
        break
    done[u] = True
    for v in range(n):
        if road[u][v] <= fuel:
            dist[v] = min(dist[v], dist[u] + wait[v])
print(-1 if dist[-1] == INF else dist[-1])
`,
  }),
  defineToiPotentialLesson("a126", {
    topic: "math",
    level: "medium",
    concept: "超平面切割・維度遞推",
    goal: "由新增切割面上的區域數，推導高維空間的最大區域數。",
    explanation: [
      "令 regions[d][c] 為 d 維空間以 c 個切割面的最大區域數。加入第 c 個面時，原本的 c-1 個面會在新面上留下 d-1 維切割；新面被分成多少部分，就會把原空間的多少個區域各切成兩份。因此 regions[d][c]=regions[d][c-1]+regions[d-1][c-1]。",
      "無切割時只有 1 區；0 維的輔助狀態也設為 1。在一般位置下，避免平行、過多面共交等退化情形，可以同時達到這個上界，所以此遞推算的是可實現最大值。預先填滿 0～50 的表後，每個詢問直接查表。上界是 2^C≤2^50，64 位元整數足夠，不需要大數函式庫。",
    ],
    complexity: "預處理時間 O(50²)、空間 O(50²)，每筆查詢 O(1)，共 O(50²+N)。",
    pitfall:
      "不能一律使用 2^C；維度小時不能讓每一刀都把所有現有區域再切一半。答案不可取模。",
    traceLabel: "公開範例中的 D=2、C=4，逐刀增加區域",
    trace: [
      {
        title: "第一條線",
        description: "平面原有 1 區，新直線完整一段，增加 1 區，得到 2。",
        cells: ["C=0:1", "C=1:2"],
        active: [1],
        variables: [["增加", "1"]],
      },
      {
        title: "第二、三條線",
        description:
          "第二線最多被切成 2 段，總數 4；第三線被切成 3 段，總數 7。",
        cells: ["C=1:2", "C=2:4", "C=3:7"],
        active: [1, 2],
        variables: [["本次增加", "2、3"]],
      },
      {
        title: "第四條線",
        description: "第四線被前三條切成 4 段，再增加 4，得到 11。",
        cells: ["原有7", "+4", "11"],
        active: [2],
        variables: [["regions[2][4]", "11"]],
      },
    ],
    cpp: String.raw`#include <iostream>
using namespace std;
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    long long regions[51][51];
    for (int d = 0; d <= 50; ++d)
        regions[d][0] = 1;
    for (int c = 0; c <= 50; ++c)
        regions[0][c] = 1;
    for (int d = 1; d <= 50; ++d)
        for (int c = 1; c <= 50; ++c)
            regions[d][c] = regions[d][c - 1] + regions[d - 1][c - 1];
    int n;
    cin >> n;
    while (n--) {
        int d, c;
        cin >> d >> c;
        cout << regions[d][c] << '\n';
    }
}`,
    python: String.raw`import sys

regions = [[1] * 51 for _ in range(51)]
for d in range(1, 51):
    for c in range(1, 51):
        regions[d][c] = regions[d][c - 1] + regions[d - 1][c - 1]
data = list(map(int, sys.stdin.buffer.read().split()))
print('\n'.join(str(regions[d][c]) for d, c in zip(data[1::2], data[2::2])))
`,
  }),
  defineToiPotentialLesson("a127", {
    topic: "dp",
    level: "medium",
    concept: "座標前綴 DP・加權區間選擇",
    goal: "利用路段座標最多 10000，直接計算不重疊種植的最大長度。",
    explanation: [
      "依終點把作物區間分組，令 dp[x] 為所有終點≤x 的可選作物中，最大不重疊總長度。不選在 x 結束的作物時，可延用 dp[x-1]；若選區間 [s,x]，之前最多接到 s，所以候選是 dp[s]+x-s。區間長度為 0 時無法增加答案，可以略過。",
      "任何最佳方案若有作物在 x 結束，取最後一個非零長區間 [s,x]，其他作物必在 s 前結束，故其總長度不超過 dp[s]。反之，把 dp[s] 的方案接上 [s,x] 一定不重疊，因為允許端點相接。兩種情況涵蓋全部方案，按座標遞增填表即可。",
    ],
    complexity: "時間 O(M+T)、空間 O(M+T)，M、T≤10000；比逐對檢查區間更直接。",
    pitfall:
      "不能以最早結束的貪心法最大化總長度，那只適合最大區間數；端點相同可以銜接。",
    traceLabel: "公開範例：選 [1,4]、[4,8]、[8,10]",
    trace: [
      {
        title: "到座標 4",
        description: "選 [1,4] 可得長度 3，所以 dp[4]=3。",
        cells: ["[1,4]:3", "dp[4]=3"],
        active: [0, 1],
        variables: [["總長度", "3"]],
      },
      {
        title: "到座標 8",
        description: "[1,6] 只能得 5；[1,4] 接 [4,8] 得 3+4=7。",
        cells: ["dp[6]=5", "dp[8]=7"],
        active: [1],
        variables: [["所選", "[1,4],[4,8]"]],
      },
      {
        title: "到座標 10",
        description: "再接 [8,10] 長度 2，總和 9。",
        cells: ["3", "+4", "+2", "=9"],
        active: [3],
        variables: [["答案", "9"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int m, t;
    cin >> m >> t;
    vector<vector<int>> ending(m + 1);
    for (int i = 0; i < t; ++i) {
        int s, e;
        cin >> s >> e;
        if (s < e)
            ending[e].push_back(s);
    }
    vector<int> dp(m + 1, 0);
    for (int x = 1; x <= m; ++x) {
        dp[x] = dp[x - 1];
        for (int s : ending[x])
            dp[x] = max(dp[x], dp[s] + x - s);
    }
    cout << dp[m] << '\n';
}`,
    python: String.raw`import sys

it = iter(map(int, sys.stdin.buffer.read().split()))
m, t = next(it), next(it)
ending = [[] for _ in range(m + 1)]
for _ in range(t):
    s, e = next(it), next(it)
    if s < e:
        ending[e].append(s)
dp = [0] * (m + 1)
for x in range(1, m + 1):
    dp[x] = dp[x - 1]
    for s in ending[x]:
        dp[x] = max(dp[x], dp[s] + x - s)
print(dp[m])
`,
  }),
  defineToiPotentialLesson("a128", {
    topic: "graphs",
    level: "hard",
    concept: "公式解析・拓樸求值與循環依賴",
    goal: "讓可求值的儲存格逐步解鎖，並辨識受循環影響的全部 ERROR。",
    explanation: [
      "解析每格的兩個運算元：數字直接加到該格的暫存值，位址則建立『被引用格→公式格』的邊並增加待完成數。一般數字格沒有依賴。從待完成數為 0 的格子開始，將其值取模後傳給所有引用者；引用者收到全部運算元後才入隊。",
      "每個出隊格都只依賴已完成格，因此值正確。若兩個運算元引用同一格，保留兩條邊與兩份待完成數，才能正確加兩次。最後沒有出隊的格子必在循環內或依賴未完成的循環：若剩餘圖沒有循環，它就會有待完成數 0 的節點，與演算法已停止矛盾。這些格子全部輸出 ERROR，包含循環下游。",
    ],
    complexity:
      "令 V=MN≤2600，每格最多兩條引用邊；時間 O(V+輸入字元數)、空間 O(V)。",
    pitfall:
      "只標記循環本身會漏掉依賴循環的公式；位址列號可有兩、三位，B100 不能只讀一個數字。",
    traceLabel: "公開範例：A1=3，B1=A1+4，A2=B1+B1，B2=B2+1",
    trace: [
      {
        title: "初始可算格",
        description: "A1 無依賴，B1 尚待 A1，A2 需要兩份 B1，B2 自我依賴。",
        cells: ["A1:3", "B1:待1", "A2:待2", "B2:待1"],
        active: [0],
        variables: [["queue", "A1"]],
      },
      {
        title: "傳遞 A1",
        description: "B1 取得 3+4=7，待完成數降到 0。",
        cells: ["A1:3", "B1:7", "A2:待2", "B2:待1"],
        active: [1],
        variables: [["queue", "B1"]],
      },
      {
        title: "重複引用與循環",
        description:
          "B1 沿兩條邊傳給 A2，得到 14；B2 一直無法入隊，因此 ERROR。",
        cells: ["A1:3", "B1:7", "A2:14", "B2:ERROR"],
        active: [2, 3],
        variables: [["queue", "空"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <string>
#include <queue>
using namespace std;
const long long MOD = 1000000007;
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int m, n;
    cin >> m >> n;
    int total = m * n;
    vector<long long> value(total, 0);
    vector<int> pending(total, 0);
    vector<vector<int>> users(total);
    auto addOperand = [&](int u, const string &operand) {
        if (operand[0] >= '0' && operand[0] <= '9')
            value[u] += stoi(operand);
        else {
            int col = operand[0] - 'A', row = stoi(operand.substr(1)) - 1;
            users[row * n + col].push_back(u);
            ++pending[u];
        }
    };
    for (int u = 0; u < total; ++u) {
        string token;
        cin >> token;
        if (token[0] != '=')
            addOperand(u, token);
        else {
            auto plus = token.find('+');
            addOperand(u, token.substr(1, plus - 1));
            addOperand(u, token.substr(plus + 1));
        }
    }
    queue<int> q;
    vector<bool> ready(total, false);
    for (int u = 0; u < total; ++u)
        if (!pending[u])
            q.push(u);
    while (!q.empty()) {
        int u = q.front();
        q.pop();
        ready[u] = true;
        value[u] %= MOD;
        for (int v : users[u]) {
            value[v] = (value[v] + value[u]) % MOD;
            if (--pending[v] == 0)
                q.push(v);
        }
    }
    for (int r = 0; r < m; ++r) {
        for (int c = 0; c < n; ++c) {
            if (c)
                cout << ' ';
            int u = r * n + c;
            if (ready[u])
                cout << value[u];
            else
                cout << "ERROR";
        }
        cout << '\n';
    }
}`,
    python: String.raw`import sys
from collections import deque

tokens = sys.stdin.buffer.read().decode().split()
m, n = map(int, tokens[:2])
total = m * n
MOD = 1000000007
value = [0] * total
pending = [0] * total
users = [[] for _ in range(total)]
for u, token in enumerate(tokens[2:]):
    operands = token[1:].split('+') if token.startswith('=') else [token]
    for operand in operands:
        if operand[0].isdigit():
            value[u] += int(operand)
        else:
            col = ord(operand[0]) - ord('A')
            row = int(operand[1:]) - 1
            users[row * n + col].append(u)
            pending[u] += 1
queue = deque(u for u in range(total) if pending[u] == 0)
ready = [False] * total
while queue:
    u = queue.popleft()
    ready[u] = True
    value[u] %= MOD
    for v in users[u]:
        value[v] = (value[v] + value[u]) % MOD
        pending[v] -= 1
        if pending[v] == 0:
            queue.append(v)
for r in range(m):
    print(' '.join(str(value[u]) if ready[u] else 'ERROR' for u in range(r * n, (r + 1) * n)))
`,
  }),
  defineToiPotentialLesson("a129", {
    topic: "dp",
    level: "medium",
    concept: "不交錯配對・加權 LCS",
    goal: "比較跳過兩端或連接兩端三種情況，最大化總流量。",
    explanation: [
      "令 dp[i][j] 為前 i 個出水口與前 j 個進水口可得的最大總流量。若不用出水口 i，取 dp[i-1][j]；若不用進水口 j，取 dp[i][j-1]；若兩者相接，所有更早的水管必在兩側都更早，所以取 dp[i-1][j-1]+min(ai,bj)。三者取最大。",
      "若兩個最後接口都使用卻沒有彼此相接，就必分別接到對面更早的接口，形成交錯，與限制矛盾。因此三種轉移完整涵蓋所有合法方案。每次計算只讀上一列及本列左方，可以滾動成一維陣列；用變數保存被覆寫前的左上角值。",
    ],
    complexity:
      "時間 O(N²)、空間 O(N)，N≤2000；總流量≤N×10⁶≤2×10⁹，C++ 仍使用 64 位元累加。",
    pitfall:
      "不必把所有接口都接上；兩側排序會改變位置，不能先依流量重排。原地 DP 要保留上一列左上角。",
    traceLabel: "公開範例：a=1 8 2 6，b=7 2 5 1 的 DP 列",
    trace: [
      {
        title: "處理 a1=1",
        description: "只接一條最多流量 1，各前綴答案為 0,1,1,1,1。",
        cells: ["0", "1", "1", "1", "1"],
        active: [1, 2, 3, 4],
        variables: [["已處理出水口", "1"]],
      },
      {
        title: "處理 a2=8、a3=2",
        description: "第二列是 0,7,7,7,7；第三列為 0,7,9,9,9。",
        cells: ["0", "7", "9", "9", "9"],
        active: [2, 3, 4],
        variables: [["已處理出水口", "3"]],
      },
      {
        title: "處理 a4=6",
        description:
          "末列為 0,7,9,14,14；最佳接 a2→b1、a3→b2、a4→b3，流量 7+2+5=14。",
        cells: ["0", "7", "9", "14", "14"],
        active: [3, 4],
        variables: [["答案", "14"]],
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
    cin >> n;
    vector<int> a(n), b(n);
    for (int &x : a)
        cin >> x;
    for (int &x : b)
        cin >> x;
    vector<long long> dp(n + 1, 0);
    for (int x : a) {
        long long diagonal = 0;
        for (int j = 1; j <= n; ++j) {
            long long old = dp[j];
            dp[j] = max({old, dp[j - 1], diagonal + min(x, b[j - 1])});
            diagonal = old;
        }
    }
    cout << dp[n] << '\n';
}`,
    python: String.raw`import sys

data = list(map(int, sys.stdin.buffer.read().split()))
n = data[0]
a = data[1 : n + 1]
b = data[n + 1 :]


def maximum_flow(a, b):
    dp = [0] * (len(b) + 1)
    for x in a:
        diagonal = 0
        for j, y in enumerate(b, 1):
            old = dp[j]
            candidate = diagonal + (x if x < y else y)
            best = old if old > dp[j - 1] else dp[j - 1]
            dp[j] = candidate if candidate > best else best
            diagonal = old
    return dp[-1]


print(maximum_flow(a, b))
`,
  }),
];
