import type { ToiPotentialLesson } from "@/lib/toiPotentialLessonTypes";
import { defineToiPotentialLesson } from "@/lib/toiPotentialLessonBuilder";

export const lessons: ToiPotentialLesson[] = [
  defineToiPotentialLesson("a298", {
    topic: "graphs",
    level: "medium",
    concept: "拓樸排序的可選節點數與唯一性",
    goal: "在已知有合法安裝順序的 DAG 中，判斷是否曾出現多個可立即安裝的軟體。",
    explanation: [
      "維護每套軟體尚未安裝的先決條件數，也就是剩餘入度。入度為 0 的軟體可以立即安裝；取出一套後，把它所指向的軟體入度各減一，剛變成 0 的軟體加入佇列。佇列始終恰好包含當下所有合法的下一步。",
      "若某一步有至少兩個入度 0 的節點 u、v，它們彼此沒有尚存的相依關係，可以選 u 先或 v 先。原圖保證無環，兩種選擇都能補成完整順序，因此一定多解。若每一步只有一個選擇，任何合法序列的下一套軟體都被強迫決定，歸納得整個順序唯一。不能只看一開始的入度 0 數量，分歧可能在後面才出現。",
    ],
    complexity: "時間與空間 O(N+M)，N、M≤200000，每條相依關係只處理一次。",
    pitfall:
      "輸出 1 代表多種順序，0 代表唯一；佇列大小要在每次取出節點之前檢查。",
    traceLabel: "公開範例：3 之後可先安裝 1 或 2",
    trace: [
      {
        title: "初始可安裝",
        description: "只有軟體 3 沒有先決條件。",
        cells: ["1:1", "2:1", "3:0", "4:1", "5:2"],
        active: [2],
        variables: [
          ["佇列", "3"],
          ["多解", "否"],
        ],
      },
      {
        title: "安裝 3",
        description: "移除 3→1、3→2 後，1、2 都可選。",
        cells: ["1:0", "2:0", "3:完成", "4:1", "5:2"],
        active: [0, 1],
        variables: [
          ["佇列大小", "2"],
          ["多解", "是"],
        ],
      },
      {
        title: "兩個合法序列",
        description: "3,1,2,5,4 與 3,2,1,5,4 都符合條件。",
        cells: ["3 1 2 5 4", "3 2 1 5 4"],
        active: [0, 1],
        variables: [
          ["不同處", "第 2 套"],
          ["輸出", "1"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <queue>
#include <vector>
using namespace std;
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, m;
    cin >> n >> m;
    vector<vector<int>> g(n);
    vector<int> in(n);
    while (m--) {
        int a, b;
        cin >> a >> b;
        g[a - 1].push_back(b - 1);
        ++in[b - 1];
    }
    queue<int> q;
    for (int i = 0; i < n; i++)
        if (!in[i])
            q.push(i);
    bool multiple = false;
    while (!q.empty()) {
        if (q.size() > 1)
            multiple = true;
        int u = q.front();
        q.pop();
        for (int v : g[u])
            if (--in[v] == 0)
                q.push(v);
    }
    cout << (multiple ? 1 : 0) << '\n';
}`,
    python: String.raw`import sys
from collections import deque


def main():
    read = sys.stdin.buffer.readline
    n, m = map(int, read().split())
    g = [[] for _ in range(n)]
    degree = [0] * n
    for _ in range(m):
        a, b = map(int, read().split())
        g[a - 1].append(b - 1)
        degree[b - 1] += 1
    q = deque(i for i in range(n) if degree[i] == 0)
    multiple = False
    while q:
        if len(q) > 1:
            multiple = True
        u = q.popleft()
        for v in g[u]:
            degree[v] -= 1
            if degree[v] == 0:
                q.append(v)
    print(int(multiple))


if __name__ == '__main__':
    main()
`,
  }),
  defineToiPotentialLesson("a299", {
    topic: "math",
    level: "hard",
    concept: "兩兩奇偶關係不變與對稱狀態",
    goal: "由奇偶性推導最高獲勝機率者，避免對 10^18 的靈氣逐回合模擬。",
    explanation: [
      "每回合三人的奇偶性都翻轉，所以任意兩人『奇偶相同或不同』的關係永遠不變。比賽尚未結束時至多一個 0，它必定是唯一最小者，下一步會加 1，故不會出現負值；總靈氣每回合減 1，必定有限步結束。終局為一人正值、另外兩人 0；若起始有一人的奇偶性與其餘兩人不同，終局兩個 0 必是原本奇偶相同的兩人。因此奇偶獨特者必勝，無須計算機率。",
      "若三人同奇偶，排序為 x≤y≤z。x<y 時，唯一最小者持續加 1，其餘減 1；因 y−x 為偶數，會先到達兩個最小值相等的狀態，且此時它們仍為正。當兩個最小值皆為 t、第三人為 z>t，任選一位最小者後，另一位變成唯一最小者，下一回合必選他；兩回合後兩人恢復 t，第三人減 2。差值為偶數，所以最後必先到達三人相等的正值狀態，尚未有人獲勝。從該狀態起規則完全對稱，三人勝率皆為 1/3，所以全都輸出。",
    ],
    complexity:
      "每場 O(1)，總時間 O(R)，C++ 額外空間 O(1)；Python 批次輸出 O(R)。R≤100000，靈氣≤10^18，C++ 使用 long long。",
    pitfall:
      "最大初始值不一定最有利；要比較三人的奇偶關係，三人同奇偶時即使數值不同也全列出。",
    traceLabel: "公開範例第一場：3、5、7（縮短強制回合）",
    trace: [
      {
        title: "唯一最小 A",
        description: "A 被選中，(3,5,7) 變為 (4,4,6)。",
        cells: ["A=4", "B=4", "C=6"],
        active: [0],
        variables: [
          ["相對奇偶", "三人相同"],
          ["最小者", "A、B"],
        ],
      },
      {
        title: "假設選 A",
        description: "等機率選 A 或 B。這條分支選 A，變成 (5,3,5)。",
        cells: ["A=5", "B=3", "C=5"],
        active: [0, 1],
        variables: [
          ["選 A 機率", "1/2"],
          ["下一步必選", "B"],
        ],
      },
      {
        title: "到達對稱狀態",
        description: "B 被選中後成為 (4,4,4)；先選 B 的另一分支也到此狀態。",
        cells: ["A=4", "B=4", "C=4"],
        active: [0, 1, 2],
        variables: [
          ["各人勝率", "1/3"],
          ["輸出", "A B C"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
using namespace std;
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int r;
    cin >> r;
    while (r--) {
        long long a, b, c;
        cin >> a >> b >> c;
        int x = a % 2, y = b % 2, z = c % 2;
        if (x == y && y == z)
            cout << "A B C\n";
        else if (y == z)
            cout << "A\n";
        else if (x == z)
            cout << "B\n";
        else
            cout << "C\n";
    }
}`,
    python: String.raw`import sys


def main():
    read = sys.stdin.buffer.readline
    r = int(read())
    out = []
    for _ in range(r):
        a, b, c = map(int, read().split())
        x, y, z = a % 2, b % 2, c % 2
        if x == y == z:
            out.append('A B C')
        elif y == z:
            out.append('A')
        elif x == z:
            out.append('B')
        else:
            out.append('C')
    print('\n'.join(out))


if __name__ == '__main__':
    main()
`,
  }),
  defineToiPotentialLesson("a300", {
    topic: "data-structures",
    level: "medium",
    concept: "按待滿足門檻排列的最小堆",
    goal: "由時間順序掃描，在條件首次成立的當天立即回答所有可賣出的買入日。",
    explanation: [
      "每個買入日 i 產生門檻 Ai+K，存成 (門檻,買入日) 放入最小堆。掃描今天價格 Aj 時，反覆查看堆頂：若最小門檻≤Aj，就代表那筆問題第一次遇到足夠高的價格，答案設為 j 並移除。直到堆頂門檻仍太高，其他門檻更高的問題也一定不能回答。",
      "不變量是堆內恰為所有過去買入、至今尚無合法賣出日的問題。因為按日期遞增掃描，移除當天必然是最早可賣日。先回答舊問題，再加入今天的新問題，明確保證 j>i。最後仍在堆內者保持 −1。這裡 K 可能很大，不能直接把普通『下一個較大元素』當作答案。",
    ],
    complexity:
      "時間 O(N log N)，空間 O(N)。N≤200000，價格與 K≤10^9；門檻以 64 位元計算。",
    pitfall:
      "答案是最早日期而非最低足夠價格；每天要移除所有已達標門檻，不能只處理一筆。",
    traceLabel: "公開範例：K=3，價格 6、2、4、9、5",
    trace: [
      {
        title: "前三日尚未達標",
        description:
          "三筆買入日的門檻分別為 9、5、7，前三日都找不到之後的達標價格。",
        cells: ["日1→9", "日2→5", "日3→7"],
        active: [1],
        variables: [
          ["堆頂門檻", "5"],
          ["已回答", "0"],
        ],
      },
      {
        title: "第 4 日價格 9",
        description: "門檻 5、7、9 都達標，三筆答案依序填回各自的買入日。",
        cells: ["日1:4", "日2:4", "日3:4", "日4→12"],
        active: [0, 1, 2],
        variables: [
          ["今天", "4"],
          ["填入答案", "4 4 4"],
        ],
      },
      {
        title: "第 5 日價格 5",
        description: "未達第 4 日的門檻 12；今天門檻為 8，往後已無交易日。",
        cells: ["4", "4", "4", "-1", "-1"],
        active: [3, 4],
        variables: [
          ["未解門檻", "8、12"],
          ["輸出", "4 4 4 -1 -1"],
        ],
      },
    ],
    cpp: String.raw`#include <functional>
#include <iostream>
#include <queue>
#include <utility>
#include <vector>
using namespace std;
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    long long k;
    cin >> n >> k;
    vector<int> ans(n, -1);
    priority_queue<pair<long long, int>, vector<pair<long long, int>>,
                   greater<pair<long long, int>>>
        q;
    for (int j = 0; j < n; j++) {
        long long price;
        cin >> price;
        while (!q.empty() && q.top().first <= price) {
            ans[q.top().second] = j + 1;
            q.pop();
        }
        q.push({price + k, j});
    }
    for (int i = 0; i < n; i++)
        cout << (i ? " " : "") << ans[i];
    cout << '\n';
}`,
    python: String.raw`import sys
import heapq


def main():
    data = list(map(int, sys.stdin.buffer.read().split()))
    n, k = data[:2]
    answer = [-1] * n
    heap = []
    for j, price in enumerate(data[2:]):
        while heap and heap[0][0] <= price:
            threshold, i = heapq.heappop(heap)
            answer[i] = j + 1
        heapq.heappush(heap, (price + k, j))
    print(*answer)


if __name__ == '__main__':
    main()
`,
  }),
  defineToiPotentialLesson("a301", {
    topic: "data-structures",
    level: "hard",
    concept: "直方圖最大矩形與四方向前綴最佳值",
    goal: "在線性網格時間內求一個或恰好兩個不重疊的全 1 矩形。",
    explanation: [
      "先求每個方向前綴區域內，最大全 1 矩形的面積。由上往下掃描時，各欄高度記錄連續 1 的格數，每列用單調堆疊求直方圖最大矩形。高度下降時彈出柱子，其左右最近較矮柱限定了可延展寬度；每根柱子至多入堆疊、出堆疊各一次。Python 以 (高度,最左位置) 合併相同高度，省去同高矩形的重複計算。累計截至該列的最佳面積，得到 top；反向掃描得 bottom，以欄為主軸再做兩次得 left、right。",
      "兩個不共用格子的軸對齊矩形，其列區間或欄區間至少一組互不相交，否則兩個投影都相交就會共用格子。所以它們必能被某條水平或垂直格線分開。枚舉水平切線，合併 top[r]+bottom[r+1]，垂直切線則合併 left[c]+right[c+1]。兩側面積都要大於 0，才能符合恰好兩個非空矩形；K=1 直接取全圖最大矩形。這涵蓋所有合法兩矩形，也不會把有重疊的矩形相加。",
    ],
    complexity:
      "時間 O(HW)，空間 O(HW+H+W)。H、W≤2000；Python 用 bytes 儲存每列，避免將四百萬格全部存成 Python 整數物件。",
    pitfall:
      "K=2 是恰好兩個，不能讓其中一個為空；不能只考慮水平切割，也不能貪心先選全圖最大矩形。",
    traceLabel: "公開範例以第 2、3 欄間的垂直線分開",
    trace: [
      {
        title: "由上而下的高度",
        description: "第 2 列的高度為 2、2、0、2，最大直方圖矩形為左側 2×2。",
        cells: ["2", "2", "0", "2"],
        active: [0, 1],
        variables: [
          ["top[2]", "4"],
          ["矩形", "列1..2、欄1..2"],
        ],
      },
      {
        title: "右側區域",
        description: "第 3..4 欄中，最右欄三格全為 1，最大面積為 3。",
        cells: ["左側最大=4", "切線", "右側最大=3"],
        active: [2],
        variables: [
          ["left[2]", "4"],
          ["right[3]", "3"],
        ],
      },
      {
        title: "合併兩側",
        description:
          "左矩形面積 4 加右矩形面積 3，不共用格子，總面積 7；枚舉其餘切線不會更大。",
        cells: ["1101", "1101", "0111"],
        active: [0, 1, 2],
        variables: [
          ["K", "2"],
          ["答案", "7"],
        ],
      },
    ],
    cpp: String.raw`#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;
vector<int> prefixes(const vector<vector<unsigned char>> &a, bool columns, bool backwards) {
    int h = a.size(), w = a[0].size(), rows = columns ? w : h, cols = columns ? h : w;
    vector<int> height(cols + 1), ans(rows), st;
    int best = 0;
    for (int step = 0; step < rows; step++) {
        int r = backwards ? rows - 1 - step : step;
        for (int c = 0; c < cols; c++) {
            bool one = columns ? a[c][r] : a[r][c];
            height[c] = one ? height[c] + 1 : 0;
        }
        st.clear();
        for (int c = 0; c <= cols; c++) {
            while (!st.empty() && height[st.back()] >= height[c]) {
                int x = st.back();
                st.pop_back();
                int left = st.empty() ? 0 : st.back() + 1;
                best = max(best, height[x] * (c - left));
            }
            st.push_back(c);
        }
        ans[r] = best;
    }
    return ans;
}
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int h, w, k;
    cin >> h >> w >> k;
    vector<vector<unsigned char>> a(h, vector<unsigned char>(w));
    for (auto &row : a)
        for (auto &x : row) {
            int v;
            cin >> v;
            x = v;
        }
    auto top = prefixes(a, false, false);
    if (k == 1) {
        cout << top.back() << '\n';
        return 0;
    }
    auto bottom = prefixes(a, false, true), left = prefixes(a, true, false),
         right = prefixes(a, true, true);
    int ans = 0;
    for (int r = 0; r + 1 < h; r++)
        if (top[r] && bottom[r + 1])
            ans = max(ans, top[r] + bottom[r + 1]);
    for (int c = 0; c + 1 < w; c++)
        if (left[c] && right[c + 1])
            ans = max(ans, left[c] + right[c + 1]);
    cout << ans << '\n';
}`,
    python: String.raw`import sys


def prefixes(a, columns=False, backwards=False):
    h, w = len(a), len(a[0])
    rows, cols = (w, h) if columns else (h, w)
    heights = [0] * (cols + 1)
    answer = [0] * rows
    best = 0
    indices = range(rows - 1, -1, -1) if backwards else range(rows)
    for r in indices:
        if columns:
            for c in range(cols):
                heights[c] = heights[c] + 1 if a[c][r] else 0
        else:
            for c, one in enumerate(a[r]):
                heights[c] = heights[c] + 1 if one else 0
        stack = []
        for c in range(cols + 1):
            height = heights[c]
            start = c
            while stack and stack[-1][0] > height:
                old_height, start = stack.pop()
                area = old_height * (c - start)
                if area > best:
                    best = area
            if height and (not stack or stack[-1][0] < height):
                stack.append((height, start))
        answer[r] = best
    return answer


def main():
    read = sys.stdin.buffer.readline
    h, w, k = map(int, read().split())
    a = [bytes(map(int, read().split())) for _ in range(h)]
    top = prefixes(a)
    if k == 1:
        print(top[-1])
        return
    bottom = prefixes(a, backwards=True)
    left = prefixes(a, columns=True)
    right = prefixes(a, columns=True, backwards=True)
    answer = 0
    for r in range(h - 1):
        if top[r] and bottom[r + 1]:
            answer = max(answer, top[r] + bottom[r + 1])
    for c in range(w - 1):
        if left[c] and right[c + 1]:
            answer = max(answer, left[c] + right[c + 1])
    print(answer)


if __name__ == '__main__':
    main()
`,
  }),
  defineToiPotentialLesson("a302", {
    topic: "greedy",
    level: "easy",
    concept: "目標位置映射與必須剪斷的相鄰邊界",
    goal: "直接計算不能保留的相鄰關係，證明最少剪刀數。",
    explanation: [
      "記錄每個數字在目標 b 中的位置 pos。原紙帶相鄰兩數 a[i]、a[i+1] 若不滿足 pos[a[i+1]]=pos[a[i]]+1，就不能留在同一片段，因為片段內不能重排或翻轉。因此每個這樣的邊界都必須剪開，得到答案的下界。",
      "把所有不連續的目標位置邊界都剪開後，每個剩餘片段在 b 中恰好也是同順序的連續區段。由於數字互異且 b 是排列，這些區段不重疊並完整涵蓋 b；依片段第一個數在 b 的位置重新排序，就能直接拼成目標。所以所有必剪邊界的數量同時也是可達的上界，不必真的模擬剪紙和接合。",
    ],
    complexity:
      "以雜湊表建位置映射，期望 O(N) 時間、O(N) 空間；N≤200000、數值≤10^9。",
    pitfall:
      "位置差必須恰為 +1，不能取絕對值；片段不可以翻轉，剪刀數也不是片段數。",
    traceLabel: "公開範例：a=8,2,9,5,1；b=5,1,8,2,9",
    trace: [
      {
        title: "映射目標位置",
        description: "原序列的數字在目標中的位置依序為 3、4、5、1、2。",
        cells: ["8→3", "2→4", "9→5", "5→1", "1→2"],
        active: [0, 1, 2, 3, 4],
        variables: [
          ["目標位置", "3 4 5 1 2"],
          ["剪刀數", "0"],
        ],
      },
      {
        title: "檢查四個邊界",
        description: "3→4、4→5、1→2 可保留，只有 5→1 不是加一。",
        cells: ["8 2 9", "剪", "5 1"],
        active: [1],
        variables: [
          ["必剪邊界", "9 | 5"],
          ["剪刀數", "1"],
        ],
      },
      {
        title: "重排兩片段",
        description: "把 [5,1] 放在 [8,2,9] 前面即為目標。",
        cells: ["5 1", "8 2 9"],
        active: [0, 1],
        variables: [
          ["片段數", "2"],
          ["答案", "1"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <unordered_map>
#include <vector>
using namespace std;
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    vector<int> a(n);
    for (int &x : a)
        cin >> x;
    unordered_map<int, int> pos;
    pos.reserve(n * 2);
    for (int i = 0; i < n; i++) {
        int x;
        cin >> x;
        pos[x] = i;
    }
    int ans = 0;
    for (int i = 1; i < n; i++)
        if (pos[a[i]] != pos[a[i - 1]] + 1)
            ++ans;
    cout << ans << '\n';
}`,
    python: String.raw`import sys


def main():
    data = list(map(int, sys.stdin.buffer.read().split()))
    n = data[0]
    a = data[1 : n + 1]
    pos = {x: i for i, x in enumerate(data[n + 1 :])}
    print(sum(pos[a[i]] != pos[a[i - 1]] + 1 for i in range(1, n)))


if __name__ == '__main__':
    main()
`,
  }),
  defineToiPotentialLesson("a303", {
    topic: "greedy",
    level: "medium",
    concept: "固定覆蓋長度的最右放置與整數電費",
    goal: "對五種電力等級各自求最少裝置數，再精確比較總費用與同價規則。",
    explanation: [
      "固定等級 k，每台最多覆蓋連續 2k−1 格。找到最左邊尚未被灌溉的作物位置 i，將裝置盡量放右，中心為 min(i+k−1,L−1)，如此仍涵蓋 i，且能向右延伸最遠，覆蓋至 min(i+2k−2,L−1)。跳過已覆蓋範圍，再找下一個 0。道路尾端截斷不影響正確性，因為沒有更右的作物需要顧及。",
      "任何可行配置都有一台涵蓋 i；把它移到上述最右中心，不會失去 i 右方原本涵蓋的作物，而 i 左側的作物已由前面裝置涵蓋。因此可逐台交換成貪心配置，裝置數不增加。對 k=1..5 分別求最少台數，乘上以分為單位的 132k+107；只用整數比較，費用相同時選較大的 k。沒有作物時五種費用都是 0，依同價規則選 5。",
    ],
    complexity:
      "五次線性掃描，時間 O(5L)=O(L)，空間 O(L) 儲存字串。L≤5000000；總電費以 64 位元的分計算。",
    pitfall:
      "字元 0 才有作物；所有裝置必須同級，不能混搭。最後固定輸出兩位小數，同價選較大等級。",
    traceLabel: "公開範例：0011100011，固定 k=2，覆蓋寬度 3",
    trace: [
      {
        title: "第一個未覆蓋作物",
        description: "以 1 起算，位置 1 有作物，把裝置放在位置 2，覆蓋 1..3。",
        cells: ["001", "11", "000", "11"],
        active: [0],
        variables: [
          ["裝置數", "1"],
          ["費用（分）", "371"],
        ],
      },
      {
        title: "下一個作物在 6",
        description: "裝置放在 7，覆蓋 6..8，所有作物已獲灌溉。",
        cells: ["001", "11", "000", "11"],
        active: [2],
        variables: [
          ["裝置數", "2"],
          ["費用（分）", "742"],
        ],
      },
      {
        title: "比較五種等級",
        description: "各級最低費用為 1195、742、1006、1270、767 分，選 k=2。",
        cells: ["k1:1195", "k2:742", "k3:1006", "k4:1270", "k5:767"],
        active: [1],
        variables: [
          ["最低費用", "7.42"],
          ["輸出", "7.42 2"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <string>
using namespace std;
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int l;
    string s;
    cin >> l >> s;
    long long best = -1;
    int chosen = 0;
    for (int k = 1; k <= 5; k++) {
        long long count = 0;
        size_t pos = s.find('0');
        while (pos != string::npos) {
            ++count;
            pos = s.find('0', pos + 2 * k - 1);
        }
        long long cost = count * (132 * k + 107);
        if (best < 0 || cost <= best) {
            best = cost;
            chosen = k;
        }
    }
    cout << best / 100 << '.' << (best % 100 < 10 ? "0" : "") << best % 100 << ' ' << chosen
         << '\n';
}`,
    python: String.raw`import sys


def main():
    read = sys.stdin.buffer.readline
    length = int(read())
    s = read().strip()
    best = None
    chosen = 0
    for k in range(1, 6):
        count = 0
        pos = s.find(b'0')
        while pos != -1:
            count += 1
            pos = s.find(b'0', pos + 2 * k - 1)
        cost = count * (132 * k + 107)
        if best is None or cost <= best:
            best, chosen = cost, k
    print(f'{best // 100}.{best % 100:02d} {chosen}')


if __name__ == '__main__':
    main()
`,
  }),
  defineToiPotentialLesson("a304", {
    topic: "data-structures",
    level: "easy",
    concept: "閉區間加權差分與由左至右的平手規則",
    goal: "把每個團體的人數區間加法轉成兩個事件，再找出最早最大總和。",
    explanation: [
      "團體 i 對 Li..Ri 每個整數座標都貢獻 Ai 人。用差分陣列，在 Li 加 Ai、在 Ri+1 減 Ai，前綴累加後，座標 x 的值就等於所有涵蓋 x 的團體人數總和。Ri 是包含的端點，所以停止貢獻的位置必須是 Ri+1。",
      "由 0 到 M 掃描，令 current 為差分前綴和；不變量是處理完 x 的事件後，current 正好為該點可取締的人數。只有 current 嚴格大於歷史最佳值時才更新位置，如此同分時自然保留較小座標。差分開 M+2 格，讓 Ri=M 的減法事件也有合法位置，雖然不必掃描 M+1。",
    ],
    complexity:
      "時間 O(N+M)，空間 O(M)。N≤200000、M≤1000000；總人數上限 2×10^9，使用 64 位元累加。",
    pitfall:
      "不能在 Ri 就扣除，也不能以 >= 更新最佳位置，否則會選到最大的平手座標。",
    traceLabel: "公開範例的差分事件與人數",
    trace: [
      {
        title: "座標 0、1",
        description: "在 0 加 3，座標 1 再加 4，所以人數由 3 變 7。",
        cells: ["0:3", "1:7", "2:7", "3:4", "4:10"],
        active: [0, 1],
        variables: [
          ["最佳位置", "1"],
          ["最佳人數", "7"],
        ],
      },
      {
        title: "座標 2、3",
        description:
          "2 仍為 7，不更新平手；3 扣掉第一個結束的 3 人團體，剩 4。",
        cells: ["0:3", "1:7", "2:7", "3:4", "4:10"],
        active: [2, 3],
        variables: [
          ["current", "4"],
          ["最佳位置", "1"],
        ],
      },
      {
        title: "座標 4",
        description: "加入 6 人，與仍活動的 4 人重疊，合計 10，之後不會更高。",
        cells: ["3:4", "4:10", "5:6", "6:6", "7:6", "8:0"],
        active: [1],
        variables: [
          ["最佳位置", "4"],
          ["輸出", "4 10"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
using namespace std;
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, m;
    cin >> n >> m;
    vector<long long> d(m + 2);
    while (n--) {
        long long a;
        int l, r;
        cin >> a >> l >> r;
        d[l] += a;
        d[r + 1] -= a;
    }
    long long current = 0, best = -1;
    int pos = 0;
    for (int x = 0; x <= m; x++) {
        current += d[x];
        if (current > best) {
            best = current;
            pos = x;
        }
    }
    cout << pos << ' ' << best << '\n';
}`,
    python: String.raw`import sys


def main():
    read = sys.stdin.buffer.readline
    n, m = map(int, read().split())
    delta = [0] * (m + 2)
    for _ in range(n):
        a, l, r = map(int, read().split())
        delta[l] += a
        delta[r + 1] -= a
    current = 0
    best = -1
    position = 0
    for x in range(m + 1):
        current += delta[x]
        if current > best:
            best, position = current, x
    print(position, best)


if __name__ == '__main__':
    main()
`,
  }),
  defineToiPotentialLesson("a305", {
    topic: "graphs",
    level: "medium",
    concept: "Kahn 拓樸排序與未處理點的環判定",
    goal: "輸出完整的合法處室順序，並在相依條件互相矛盾時輸出 NO。",
    explanation: [
      "對條件 a→b 建立出邊並增加 b 的入度。入度 0 的處室沒有尚未完成的前置要求，可以先處理；完成它後，把每個後繼的入度減一。佇列保存所有可執行的處室，取出的順序即是候選拓樸順序。因為題目保證至多一種合法順序，有解時不必另外處理字典序或多解問題。",
      "每次輸出的節點都沒有剩餘前置條件，因此候選順序不會違反任何邊。若佇列已空但仍有未處理處室，剩下每點都有入邊；不斷往前找前驅必定重複節點，形成有向環，環上的條件無法全部完成。所以最後處理數等於 N 才能輸出 YES 與完整順序，否則只輸出 NO；不能先把部分順序印出去。",
    ],
    complexity:
      "時間與空間 O(N+M)。N≤1000，M 最多 N(N−1)，即使相依條件密集也只掃描每條邊一次。",
    pitfall:
      "YES 後每個處室各占一行；存在部分可處理節點仍可能有環，必須檢查是否處理全部 N 個。",
    traceLabel: "公開範例：3→1→4→2，另有 3→2",
    trace: [
      {
        title: "只有 3 入度為 0",
        description: "初始入度為 1、2、0、1，先處理 3。",
        cells: ["1:1", "2:2", "3:0", "4:1"],
        active: [2],
        variables: [
          ["順序", "3"],
          ["下個可選", "1"],
        ],
      },
      {
        title: "接著處理 1、4",
        description: "1 完成後 4 可處理；4 完成後 2 的最後一個前置要求解除。",
        cells: ["3", "1", "4", "2 待處理"],
        active: [1, 2],
        variables: [
          ["順序", "3,1,4"],
          ["入度[2]", "0"],
        ],
      },
      {
        title: "完成全部處室",
        description: "再處理 2，共處理 4 個，依序輸出。",
        cells: ["YES", "3", "1", "4", "2"],
        active: [0, 4],
        variables: [
          ["處理數", "4=N"],
          ["有環", "否"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <queue>
#include <vector>
using namespace std;
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, m;
    cin >> n >> m;
    vector<vector<int>> g(n + 1);
    vector<int> in(n + 1), order;
    while (m--) {
        int a, b;
        cin >> a >> b;
        g[a].push_back(b);
        ++in[b];
    }
    queue<int> q;
    for (int i = 1; i <= n; i++)
        if (!in[i])
            q.push(i);
    while (!q.empty()) {
        int u = q.front();
        q.pop();
        order.push_back(u);
        for (int v : g[u])
            if (--in[v] == 0)
                q.push(v);
    }
    if ((int)order.size() != n)
        cout << "NO\n";
    else {
        cout << "YES\n";
        for (int u : order)
            cout << u << '\n';
    }
}`,
    python: String.raw`import sys
from collections import deque


def main():
    read = sys.stdin.buffer.readline
    n, m = map(int, read().split())
    g = [[] for _ in range(n + 1)]
    degree = [0] * (n + 1)
    for _ in range(m):
        a, b = map(int, read().split())
        g[a].append(b)
        degree[b] += 1
    q = deque(i for i in range(1, n + 1) if degree[i] == 0)
    order = []
    while q:
        u = q.popleft()
        order.append(u)
        for v in g[u]:
            degree[v] -= 1
            if degree[v] == 0:
                q.append(v)
    if len(order) != n:
        print('NO')
    else:
        sys.stdout.write('YES\n' + '\n'.join(map(str, order)) + '\n')


if __name__ == '__main__':
    main()
`,
  }),
  defineToiPotentialLesson("a306", {
    topic: "geometry",
    level: "hard",
    concept: "障礙成本化、二維前綴和與最大邊長單調掃描",
    goal: "以 O(N²) 而非枚舉所有邊長，找出預算內且沒有大樹的最大正方形。",
    explanation: [
      "把大樹的成本改成 U+1，其餘成本保持非負。如此任何含樹的區域必定超過預算，不必另外開障礙前綴陣列。建立二維前綴和 P，任何正方形的總成本可用四個前綴值在 O(1) 算出。全圖前綴和可能因很多大樹達到約 9×10^15，所以即使 U≤10^9，仍需 64 位元；Python 使用 array('q') 儲存緊密的 64 位元數值。",
      "按列、欄掃描右下角，維護已找到的最大可行邊長 best。每格只檢查以它為右下角、邊長 best+1 的正方形，合預算才把 best 加一。若有邊長更大的可行正方形，它去掉最下面一列與最右面一欄後仍可行，且右下角已在前一列被處理，因此在目前格之前 best 至少已等於該大正方形邊長減一。非負成本保證縮小可行區域仍可行，所以每格最多增加一就足夠，不需在同格反覆試更多邊長。最後輸出 best²。",
    ],
    complexity:
      "時間 O(N²)，空間 O(N²)；N≤3000，前綴陣列約 8(N+1)² 位元組（N=3000 時約 72 MB），不用儲存完整原圖。",
    pitfall:
      "不能直接把 −1 累入成本；零成本格合法，找不到任何可行單格時應輸出 0。",
    traceLabel: "公開範例：U=4，追蹤右下角",
    trace: [
      {
        title: "右下角 (1,1)",
        description: "單格成本 1≤4，best 從 0 變 1。",
        cells: ["1 0 2", "1 1 樹", "0 2 1"],
        active: [0],
        variables: [
          ["best", "1"],
          ["最大面積", "1"],
        ],
      },
      {
        title: "右下角 (2,2)",
        description: "左上 2×2 的成本為 1+0+1+1=3，可把 best 提升為 2。",
        cells: ["1 0", "1 1"],
        active: [0, 1],
        variables: [
          ["候選成本", "3"],
          ["best", "2"],
        ],
      },
      {
        title: "右下角 (3,3)",
        description: "3×3 包含大樹，替代成本為 5，其餘成本合計 8，總和 13>4。",
        cells: ["1 0 2", "1 1 5", "0 2 1"],
        active: [1],
        variables: [
          ["候選成本", "13"],
          ["答案", "2²=4"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
using namespace std;
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    long long budget;
    cin >> n >> budget;
    int stride = n + 1, best = 0;
    vector<long long> p((size_t)stride * stride);
    for (int r = 1; r <= n; r++) {
        long long row = 0;
        for (int c = 1; c <= n; c++) {
            int x;
            cin >> x;
            row += x == -1 ? budget + 1 : x;
            p[(size_t)r * stride + c] = p[(size_t)(r - 1) * stride + c] + row;
            int s = best + 1;
            if (s <= r && s <= c) {
                long long cost = p[(size_t)r * stride + c] - p[(size_t)(r - s) * stride + c] -
                                 p[(size_t)r * stride + c - s] +
                                 p[(size_t)(r - s) * stride + c - s];
                if (cost <= budget)
                    best = s;
            }
        }
    }
    cout << best * best << '\n';
}`,
    python: String.raw`import sys
from array import array


def main():
    read = sys.stdin.buffer.readline
    n, budget = map(int, read().split())
    stride = n + 1
    prefix = array('q', [0]) * (stride * stride)
    best = 0
    for r in range(1, n + 1):
        row_sum = 0
        base = r * stride
        above = base - stride
        for c, x in enumerate(map(int, read().split()), 1):
            row_sum += budget + 1 if x == -1 else x
            prefix[base + c] = prefix[above + c] + row_sum
            s = best + 1
            if 0 <= x <= budget and s <= r and s <= c:
                top = (r - s) * stride
                cost = (
                    prefix[base + c] - prefix[top + c] - prefix[base + c - s] + prefix[top + c - s]
                )
                if cost <= budget:
                    best = s
    print(best * best)


if __name__ == '__main__':
    main()
`,
  }),
  defineToiPotentialLesson("a307", {
    topic: "graphs",
    level: "hard",
    concept: "糧食來源預先合併的 Kruskal 最小生成樹",
    goal: "將多源供應需求轉成零成本超級節點連通，避免強迫糧食城鎮彼此修路。",
    explanation: [
      "想像增加一個超級節點，以免費道路連到每個生產糧食的城鎮。原圖的合法方案等價於新增圖中把所有點連通：每個城鎮透過某個糧食城鎮到超級節點即可。反向看，移除這些免費邊後，每個道路連通塊仍至少含一個糧食來源，符合原題，而且真實便道總成本不變。",
      "因此先用並查集合併所有糧食城鎮，再將候選道路按成本遞增，只有兩端目前屬不同集合才興建並合併。這就是先選完所有免費邊的 Kruskal；切割性質保證每次選取跨集合的最低成本邊可以包含在某棵最小生成樹中。生產城鎮之間的道路可能被直接略過，因為它們在模型中已免費相連。題目保證可行，不需額外輸出無解。",
    ],
    complexity:
      "時間 O(M log M+(N+M)α(N))，空間 O(N+M)。N≤200000、M≤1000000，總成本使用 64 位元；Python 逐行讀邊以避免同時持有全部輸入字串 token。",
    pitfall:
      "對原圖直接做 MST 會多修糧食城鎮間的道路；合併來源是免費的模型操作，不可把它們當成必須實際修建的便道。",
    traceLabel: "公開範例：糧食城鎮為 1、4",
    trace: [
      {
        title: "免費合併來源",
        description: "先將 1、4 視為同一集合；成本 1 的 1–4 邊不必興建。",
        cells: ["{1,4}", "{2}", "{3}"],
        active: [0],
        variables: [
          ["已付成本", "0"],
          ["來源", "1、4"],
        ],
      },
      {
        title: "選 2–3",
        description: "成本 1 的 2–3 邊連結兩個不同集合，選取。",
        cells: ["{1,4}", "{2,3}"],
        active: [1],
        variables: [
          ["選邊", "2–3，成本1"],
          ["累計", "1"],
        ],
      },
      {
        title: "選 3–4",
        description: "再花 3 連到糧食城鎮 4，所有城鎮皆能取得糧食，總成本 4。",
        cells: ["1（自產）", "2—3—4（自產）"],
        active: [1],
        variables: [
          ["選邊", "3–4，成本3"],
          ["答案", "4"],
        ],
      },
    ],
    cpp: String.raw`#include <algorithm>
#include <array>
#include <iostream>
#include <numeric>
#include <vector>
using namespace std;
struct DSU {
    vector<int> p, sz;
    DSU(int n) : p(n + 1), sz(n + 1, 1) {
        iota(p.begin(), p.end(), 0);
    }
    int find(int x) {
        while (x != p[x]) {
            p[x] = p[p[x]];
            x = p[x];
        }
        return x;
    }
    bool unite(int a, int b) {
        a = find(a);
        b = find(b);
        if (a == b)
            return false;
        if (sz[a] < sz[b])
            swap(a, b);
        p[b] = a;
        sz[a] += sz[b];
        return true;
    }
};
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, m, k;
    cin >> n >> m >> k;
    DSU d(n);
    int root;
    cin >> root;
    for (int i = 1; i < k; i++) {
        int x;
        cin >> x;
        d.unite(root, x);
    }
    vector<array<int, 3>> edges(m);
    for (auto &e : edges)
        cin >> e[1] >> e[2] >> e[0];
    sort(edges.begin(), edges.end());
    long long ans = 0;
    for (auto [cost, a, b] : edges)
        if (d.unite(a, b))
            ans += cost;
    cout << ans << '\n';
}`,
    python: String.raw`import sys


def main():
    read = sys.stdin.buffer.readline
    n, m, k = map(int, read().split())
    sources = list(map(int, read().split()))
    parent = list(range(n + 1))
    size = [1] * (n + 1)

    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    def unite(a, b):
        a, b = find(a), find(b)
        if a == b:
            return False
        if size[a] < size[b]:
            a, b = b, a
        parent[b] = a
        size[a] += size[b]
        return True

    for s in sources[1:]:
        unite(sources[0], s)
    edges = []
    for _ in range(m):
        a, b, c = map(int, read().split())
        edges.append((c, a, b))
    edges.sort()
    answer = 0
    for cost, a, b in edges:
        if unite(a, b):
            answer += cost
    print(answer)


if __name__ == '__main__':
    main()
`,
  }),
  defineToiPotentialLesson("a308", {
    topic: "dp",
    level: "hard",
    concept: "雙維嚴格遞增鏈與同長反向排序",
    goal: "把長寬都嚴格增加的最大木板鏈轉成 O(N log N) 的 LIS。",
    explanation: [
      "由上往下觀察金字塔，木板的長與寬都要嚴格增加。先依長度遞增排序，但長度相同時依寬度遞減排序，再對寬度做嚴格遞增最長子序列。相同長度那一組的寬度不遞增，所以任何嚴格遞增寬度子序列最多挑其中一片，不會誤用同長木板。不同長度的板只要寬也增加，就符合上下關係。",
      "維護 tails[t]：目前長度 t+1 的合法寬度遞增子序列，能達到的最小結尾寬度。對新寬度 w，以 lower_bound 找第一個≥w 的位置並替換；若不存在則新增一層。較小的結尾能接納至少同樣多的後續寬度，因此替換不會失去最佳長度。用第一個≥w 而非>w，才能排除等寬堆疊；木板不旋轉，輸入的長寬角色保持固定。",
    ],
    complexity:
      "排序與 LIS 總時間 O(N log N)，空間 O(N)。N≤100000，長寬≤10^9，不需面積乘法。",
    pitfall:
      "同長寬度必須遞減排序；使用 upper_bound 會容許等寬，且不能自行旋轉木板。",
    traceLabel: "公開範例排序後：(2,3)、(3,4)、(4,3)、(5,7)",
    trace: [
      {
        title: "讀入前兩片",
        description: "寬度 3、4 可形成兩層，tails=[3,4]。",
        cells: ["(2,3)", "(3,4)", "(4,3)", "(5,7)"],
        active: [0, 1],
        variables: [
          ["tails", "3,4"],
          ["最長", "2"],
        ],
      },
      {
        title: "處理 (4,3)",
        description: "寬度 3 替換第一個≥3 的位置，不增加層數。",
        cells: ["tails[0]=3", "tails[1]=4"],
        active: [0],
        variables: [
          ["lower_bound(3)", "0"],
          ["最長", "2"],
        ],
      },
      {
        title: "處理 (5,7)",
        description: "7 大於所有 tails，可接在 (2,3)、(3,4) 之後形成三層。",
        cells: ["3", "4", "7"],
        active: [2],
        variables: [
          ["tails", "3,4,7"],
          ["答案", "3"],
        ],
      },
    ],
    cpp: String.raw`#include <algorithm>
#include <iostream>
#include <utility>
#include <vector>
using namespace std;
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    vector<pair<int, int>> a(n);
    for (auto &[l, w] : a)
        cin >> l >> w;
    sort(a.begin(), a.end(), [](auto x, auto y) {
        return x.first != y.first ? x.first < y.first : x.second > y.second;
    });
    vector<int> tails;
    for (auto [l, w] : a) {
        auto it = lower_bound(tails.begin(), tails.end(), w);
        if (it == tails.end())
            tails.push_back(w);
        else
            *it = w;
    }
    cout << tails.size() << '\n';
}`,
    python: String.raw`import sys
from bisect import bisect_left


def main():
    read = sys.stdin.buffer.readline
    n = int(read())
    boards = [tuple(map(int, read().split())) for _ in range(n)]
    boards.sort(key=lambda p: (p[0], -p[1]))
    tails = []
    for length, width in boards:
        i = bisect_left(tails, width)
        if i == len(tails):
            tails.append(width)
        else:
            tails[i] = width
    print(len(tails))


if __name__ == '__main__':
    main()
`,
  }),
];
