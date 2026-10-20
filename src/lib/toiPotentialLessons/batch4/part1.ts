import type { ToiPotentialLesson } from "@/lib/toiPotentialLessonTypes";
import { defineToiPotentialLesson } from "@/lib/toiPotentialLessonBuilder";

export const lessons: ToiPotentialLesson[] = [
  defineToiPotentialLesson("a287", {
    topic: "data-structures",
    level: "hard",
    concept: "分塊、區塊排序與整數平均門檻",
    goal: "同時維護區間總和與大於平均的人數，讓單點修改和區間查詢都不必掃描整段。",
    explanation: [
      "A、B 各自建立原陣列，初始 B[i]=500−A[i]，之後只修改指令指定的一欄。將每欄分成長度約 √N 的區塊，每塊保存總和與排序副本；更新時從排序副本刪除舊值、插入新值並修改總和。因此每個區塊始終精確表示目前那一欄的資料。",
      "查詢先以整塊總和及兩端零散元素算出 S，令長度為 L。整數 x 嚴格高於平均等價於 x>floor(S/L)，即使 S 為負也成立。第二次走訪區間，完整區塊用 upper_bound 找出大於門檻的元素數，零散位置直接比較。兩次走訪使用同一個固定門檻，不能改用各區塊自己的平均。C++ 對負數除法需補成向下取整。",
    ],
    complexity:
      "設區塊長 B=⌊√N⌋+1。建置 O(N log B)，單次修改 O(B)，查詢 O(B+(N/B)log B)，空間 O(N)。N、Q≤100000；總和用 64 位元，避免浮點平均。",
    pitfall:
      "B 欄更新後不再是 500−A；負總和的整數除法與等於平均時不計入，都是常見錯誤。",
    traceLabel: "公開範例：兩欄獨立維護（以完整區間呈現）",
    trace: [
      {
        title: "查詢 A",
        description: "A 的總和為 1000，四人的平均為 250。",
        cells: ["100", "200", "300", "400"],
        active: [2, 3],
        variables: [
          ["門檻", "250"],
          ["答案", "2"],
        ],
      },
      {
        title: "只增加 B[1]",
        description: "B 原為 400、300、200、100，第一人增加 20。",
        cells: ["420", "300", "200", "100"],
        active: [0],
        variables: [
          ["B[1]", "420"],
          ["A[1]", "100"],
        ],
      },
      {
        title: "查詢 B[1..3]",
        description: "總和 920，floor(920/3)=306，只有 420 嚴格超過平均。",
        cells: ["420", "300", "200"],
        active: [0],
        variables: [
          ["整數門檻", "306"],
          ["答案", "1"],
        ],
      },
    ],
    cpp: String.raw`#include <algorithm>
#include <cmath>
#include <iostream>
#include <vector>
using namespace std;
struct Blocks {
    int n, b;
    vector<long long> a, sum;
    vector<vector<long long>> sorted;
    Blocks(vector<long long> v)
        : n(v.size()), b((int)sqrt(n) + 1), a(v), sum((n + b - 1) / b), sorted(sum.size()) {
        for (int i = 0; i < n; i++) {
            sum[i / b] += a[i];
            sorted[i / b].push_back(a[i]);
        }
        for (auto &s : sorted)
            sort(s.begin(), s.end());
    }
    void add(int i, long long p) {
        auto &s = sorted[i / b];
        s.erase(lower_bound(s.begin(), s.end(), a[i]));
        a[i] += p;
        sum[i / b] += p;
        s.insert(upper_bound(s.begin(), s.end(), a[i]), a[i]);
    }
    int query(int l, int r) {
        long long total = 0;
        for (int i = l; i <= r;) {
            if (i % b == 0 && i + b - 1 <= r) {
                total += sum[i / b];
                i += b;
            } else
                total += a[i++];
        }
        long long len = r - l + 1, t = total / len;
        if (total < 0 && total % len)
            --t;
        int ans = 0;
        for (int i = l; i <= r;) {
            if (i % b == 0 && i + b - 1 <= r) {
                auto &s = sorted[i / b];
                ans += s.end() - upper_bound(s.begin(), s.end(), t);
                i += b;
            } else
                ans += a[i++] > t;
        }
        return ans;
    }
};
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, q;
    cin >> n >> q;
    vector<long long> a(n), b(n);
    for (int i = 0; i < n; i++) {
        cin >> a[i];
        b[i] = 500 - a[i];
    }
    Blocks A(a), B(b);
    while (q--) {
        int op, x, y;
        char f;
        cin >> op >> x >> y >> f;
        Blocks &v = (f == 'A' ? A : B);
        if (op == 1)
            v.add(x - 1, y);
        else
            cout << v.query(x - 1, y - 1) << '\n';
    }
}`,
    python: String.raw`import sys
from math import isqrt
from bisect import bisect_right, bisect_left, insort


class Blocks:
    def __init__(self, a):
        self.a = a
        self.b = isqrt(len(a)) + 1
        self.sorted = [sorted(a[i : i + self.b]) for i in range(0, len(a), self.b)]
        self.sums = [sum(s) for s in self.sorted]

    def add(self, i, p):
        k = i // self.b
        s = self.sorted[k]
        s.pop(bisect_left(s, self.a[i]))
        self.a[i] += p
        self.sums[k] += p
        insort(s, self.a[i])

    def query(self, l, r):
        a, b = self.a, self.b
        first = min(r + 1, ((l + b - 1) // b) * b)
        last = max(first, ((r + 1) // b) * b)
        total = sum(a[l:first]) + sum(a[last : r + 1])
        total += sum(self.sums[first // b : last // b])
        t = total // (r - l + 1)
        ans = sum(x > t for x in a[l:first]) + sum(x > t for x in a[last : r + 1])
        for k in range(first // b, last // b):
            s = self.sorted[k]
            ans += len(s) - bisect_right(s, t)
        return ans


def main():
    read = sys.stdin.buffer.readline
    n, q = map(int, read().split())
    a = list(map(int, read().split()))
    fields = {b'A': Blocks(a), b'B': Blocks([500 - x for x in a])}
    out = []
    for _ in range(q):
        op, x, y, f = read().split()
        x, y = int(x), int(y)
        v = fields[f]
        if op == b'1':
            v.add(x - 1, y)
        else:
            out.append(str(v.query(x - 1, y - 1)))
    print('\n'.join(out))


if __name__ == '__main__':
    main()
`,
  }),
  defineToiPotentialLesson("a288", {
    topic: "graphs",
    level: "easy",
    concept: "四方向洪水填色與入列標記",
    goal: "從指定像素擴展同色連通區塊，安全處理整張影像同色的情形。",
    explanation: [
      "把像素視為頂點，只允許走向上下左右且原色相同的鄰格。從指定位置用佇列搜尋，第一次找到一格就立刻改色並入列；佇列中的每一格都是與起點同色相連的像素，因此不會塗到別的區塊。",
      "當新色不等於舊色，改色本身就是已造訪標記，能保證每格最多入列一次。搜尋結束時，任何原色可達格若未被塗色，其到起點路徑上第一個未塗色格必然曾被前一格發現，產生矛盾。新舊色相同時直接輸出，避免用失效的標記反覆入列；用迭代搜尋避免 250000 格造成遞迴溢位。",
    ],
    complexity: "時間 O(HW)，空間 O(HW)，包含影像與最壞情況的佇列；H、W≤500。",
    pitfall:
      "座標由 1 開始，必須轉成陣列索引；斜對角不相連，新色等於原色時不要繼續擴展。",
    traceLabel: "公開範例的 0 色區塊",
    trace: [
      {
        title: "標記起點",
        description: "(2,2) 的原色為 0，改為 9 並放入佇列。",
        cells: ["1 0 1", "0 9 2", "1 2 2"],
        active: [1],
        variables: [
          ["原色", "0"],
          ["佇列", "(2,2)"],
        ],
      },
      {
        title: "發現兩個鄰格",
        description: "上方 (1,2) 與左方 (2,1) 都是 0，立即改色。",
        cells: ["1 9 1", "9 9 2", "1 2 2"],
        active: [0, 1],
        variables: [
          ["已改色", "3 格"],
          ["佇列", "(1,2),(2,1)"],
        ],
      },
      {
        title: "搜尋完成",
        description: "兩格周圍沒有尚未塗色的 0；右下的 2 區塊保持原色。",
        cells: ["1 9 1", "9 9 2", "1 2 2"],
        active: [2],
        variables: [
          ["佇列", "空"],
          ["改色總數", "3"],
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
    int h, w, si, sj, z;
    cin >> h >> w >> si >> sj >> z;
    --si;
    --sj;
    vector<vector<int>> a(h, vector<int>(w));
    for (auto &row : a)
        for (int &x : row)
            cin >> x;
    int old = a[si][sj];
    if (old != z) {
        queue<pair<int, int>> q;
        q.push({si, sj});
        a[si][sj] = z;
        int dr[] = {-1, 1, 0, 0}, dc[] = {0, 0, -1, 1};
        while (!q.empty()) {
            auto [r, c] = q.front();
            q.pop();
            for (int d = 0; d < 4; d++) {
                int nr = r + dr[d], nc = c + dc[d];
                if (nr >= 0 && nr < h && nc >= 0 && nc < w && a[nr][nc] == old) {
                    a[nr][nc] = z;
                    q.push({nr, nc});
                }
            }
        }
    }
    for (auto &row : a) {
        for (int j = 0; j < w; j++)
            cout << (j ? " " : "") << row[j];
        cout << '\n';
    }
}`,
    python: String.raw`import sys
from collections import deque


def main():
    read = sys.stdin.buffer.readline
    h, w, si, sj, z = map(int, read().split())
    si -= 1
    sj -= 1
    a = [list(map(int, read().split())) for _ in range(h)]
    old = a[si][sj]
    if old != z:
        q = deque([(si, sj)])
        a[si][sj] = z
        while q:
            r, c = q.popleft()
            for nr, nc in ((r - 1, c), (r + 1, c), (r, c - 1), (r, c + 1)):
                if 0 <= nr < h and 0 <= nc < w and a[nr][nc] == old:
                    a[nr][nc] = z
                    q.append((nr, nc))
    sys.stdout.write('\n'.join(' '.join(map(str, row)) for row in a) + '\n')


if __name__ == '__main__':
    main()
`,
  }),
  defineToiPotentialLesson("a289", {
    topic: "data-structures",
    level: "medium",
    concept: "至多 K 種元素的雙指標視窗",
    goal: "維護地主出現次數，以線性移動找到最長合法連續土地。",
    explanation: [
      "令左右指標夾住目前土地，字典記錄每位地主在視窗內的出現次數。右端加入新土地，若某地主次數從 0 變 1，種類數加一。當種類數超過 K，持續移除最左土地，直到恢復合法；只有次數從 1 變 0 才能刪掉一種地主。",
      "右端固定時，左端停在第一個合法的位置，故目前視窗是以該右端結束的最長合法區段。此前被排除的左端，在加入更多土地後也不可能重新變合法，因此左端不必倒退。每個位置各加入、移除至多一次，取所有右端的最大長度即為答案。",
    ],
    complexity:
      "雜湊表下期望 O(N) 時間；字典 O(min(N,K+1))，加上輸入陣列總空間 O(N)。N≤200000，地主編號可達 10^9，不能直接用編號開陣列。",
    pitfall:
      "需要最多 K 種而非恰好 K 種；同一地主可能重複出現，移除一塊土地不一定減少種類。",
    traceLabel: "公開範例：K=2",
    trace: [
      {
        title: "前 3 塊合法",
        description: "[1,2,2] 只有兩位地主。",
        cells: ["1", "2", "2", "3", "2", "4", "4"],
        active: [0, 1, 2],
        variables: [
          ["左端", "1"],
          ["最長", "3"],
        ],
      },
      {
        title: "加入地主 3",
        description: "加入第 4 塊後有三種，移除第 1 塊恢復合法。",
        cells: ["1", "2", "2", "3", "2", "4", "4"],
        active: [1, 2, 3],
        variables: [
          ["視窗", "2..4"],
          ["地主", "2、3"],
        ],
      },
      {
        title: "延長至第 5 塊",
        description: "[2,2,3,2] 長度為 4；後續含 4 的合法視窗至多長 3。",
        cells: ["1", "2", "2", "3", "2", "4", "4"],
        active: [1, 2, 3, 4],
        variables: [
          ["視窗", "2..5"],
          ["答案", "4"],
        ],
      },
    ],
    cpp: String.raw`#include <algorithm>
#include <iostream>
#include <unordered_map>
#include <vector>
using namespace std;
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, k;
    cin >> n >> k;
    vector<int> a(n);
    for (int &x : a)
        cin >> x;
    unordered_map<int, int> count;
    count.reserve(n * 2);
    int l = 0, ans = 0;
    for (int r = 0; r < n; r++) {
        ++count[a[r]];
        while ((int)count.size() > k) {
            int x = a[l++];
            if (--count[x] == 0)
                count.erase(x);
        }
        ans = max(ans, r - l + 1);
    }
    cout << ans << '\n';
}`,
    python: String.raw`import sys


def main():
    data = list(map(int, sys.stdin.buffer.read().split()))
    n, k = data[:2]
    a = data[2:]
    counts = {}
    left = answer = 0
    for right, x in enumerate(a):
        counts[x] = counts.get(x, 0) + 1
        while len(counts) > k:
            y = a[left]
            counts[y] -= 1
            if counts[y] == 0:
                del counts[y]
            left += 1
        answer = max(answer, right - left + 1)
    print(answer)


if __name__ == '__main__':
    main()
`,
  }),
  defineToiPotentialLesson("a290", {
    topic: "math",
    level: "medium",
    concept: "逆推可償還上限與避免乘法溢位",
    goal: "將含無條件進位利息的還款過程倒推成一次掃描。",
    explanation: [
      "由最後一個月之後開始，容許剩餘欠款上限為 0。若本月還款後最多可欠 X，本月可還 A，則計息後的欠款最多 B=X+A。因此本月計息前的最大整數欠款 Y 滿足 Y+ceil(Y/R)≤B。因為 B−Y 是整數，這等價於 Y≤R(B−Y)，所以 Y=floor(BR/(R+1))。",
      "實作改寫為 Y=B−ceil(B/(R+1))，不用計算可能超過 64 位元的 BR。依月份反向套用，始終保持『從這個月開始，所有 0 到 X 的欠款都能還清，而更大者不能』的不變量。每月欠款轉移單調，且允許提早還清，因此上限能完整代表所有可行狀態。",
    ],
    complexity:
      "時間 O(N)，空間 O(N) 儲存還款序列以倒序處理。N≤200000，ΣAi≤2×10^14，使用 64 位元；不計算 B×R。",
    pitfall:
      "先計息才還款；不能用實數利息或把 ceil 當 floor，也不能直接乘 B×R。",
    traceLabel: "公開範例由第 4 月倒推，R=4",
    trace: [
      {
        title: "第 4 月",
        description: "最後要剩 0，本月可還 3，B=3，可借上限變 3−ceil(3/5)=2。",
        cells: ["5", "0", "12", "3"],
        active: [3],
        variables: [
          ["B", "3"],
          ["X", "2"],
        ],
      },
      {
        title: "第 3 月",
        description: "B=2+12=14，上限為 14−ceil(14/5)=11。",
        cells: ["5", "0", "12", "3"],
        active: [2],
        variables: [
          ["B", "14"],
          ["X", "11"],
        ],
      },
      {
        title: "第 2、1 月",
        description: "第 2 月上限為 11−3=8；第 1 月 B=13，上限 13−3=10。",
        cells: ["5", "0", "12", "3"],
        active: [0, 1],
        variables: [
          ["第 2 月前", "8"],
          ["答案", "10"],
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
    long long r;
    cin >> n >> r;
    vector<long long> a(n);
    for (auto &x : a)
        cin >> x;
    long long x = 0;
    for (int i = n - 1; i >= 0; i--) {
        long long b = x + a[i];
        x = b - (b + r) / (r + 1);
    }
    cout << x << '\n';
}`,
    python: String.raw`import sys


def main():
    data = list(map(int, sys.stdin.buffer.read().split()))
    n, r = data[:2]
    x = 0
    for a in reversed(data[2:]):
        b = x + a
        x = b - (b + r) // (r + 1)
    print(x)


if __name__ == '__main__':
    main()
`,
  }),
  defineToiPotentialLesson("a291", {
    topic: "data-structures",
    level: "medium",
    concept: "帶類別排序與覆蓋所有類別的最短值域",
    goal: "將每類挑一件轉成排序陣列上包含全部類別的最窄區間。",
    explanation: [
      "把每個型號記為 (明暗值,家具種類)，全部按明暗值排序。一組合法選擇必定落在包含全部 N 種類的某個值域；反過來，任何包含全部種類的區間，都能從每類任挑一個型號，得到差異度不超過區間兩端差。因此只需找涵蓋全部類別且兩端差最小的連續排序區段。",
      "右指標逐一加入型號，維護各類次數與已涵蓋種類數。當全部種類都出現，就更新右值減左值，然後移除左端，直到某一類消失。固定右端時會檢查所有仍覆蓋全部類別的左端；被移除的左端往後只會讓值域更寬，無須回頭。即使不同類別明暗值相等也能得到差異度 0。",
    ],
    complexity:
      "設型號總數 S≤200000。排序 O(S log S)，視窗 O(S)，空間 O(S+N)。",
    pitfall:
      "種類數是 N，不能把不同明暗值當不同種類；每類有多個型號時必須維護出現次數。",
    traceLabel: "公開範例排序後的覆蓋區間（括號為家具類別）",
    trace: [
      {
        title: "第一次涵蓋三類",
        description: "1(1)、3(2)、6(3) 已包含三類，差異度為 5。",
        cells: ["1(1)", "3(2)", "6(3)", "8(1)", "9(3)", "10(2)"],
        active: [0, 1, 2],
        variables: [
          ["涵蓋", "3"],
          ["最佳", "5"],
        ],
      },
      {
        title: "加入 8",
        description: "[3,6,8] 仍含三類，差異度為 5。",
        cells: ["1(1)", "3(2)", "6(3)", "8(1)", "9(3)", "10(2)"],
        active: [1, 2, 3],
        variables: [
          ["左右值", "3、8"],
          ["最佳", "5"],
        ],
      },
      {
        title: "收縮到 [8,10]",
        description: "加入 10(2) 後可移除 6(3)，保留 8(1)、9(3)、10(2)。",
        cells: ["1(1)", "3(2)", "6(3)", "8(1)", "9(3)", "10(2)"],
        active: [3, 4, 5],
        variables: [
          ["差異度", "10−8=2"],
          ["答案", "2"],
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
    vector<pair<int, int>> a;
    for (int i = 0; i < n; i++) {
        int m;
        cin >> m;
        while (m--) {
            int x;
            cin >> x;
            a.push_back({x, i});
        }
    }
    sort(a.begin(), a.end());
    vector<int> count(n);
    int have = 0, l = 0, ans = 1000000000;
    for (int r = 0; r < (int)a.size(); r++) {
        if (count[a[r].second]++ == 0)
            ++have;
        while (have == n) {
            ans = min(ans, a[r].first - a[l].first);
            if (--count[a[l++].second] == 0)
                --have;
        }
    }
    cout << ans << '\n';
}`,
    python: String.raw`import sys


def main():
    it = iter(map(int, sys.stdin.buffer.read().split()))
    n = next(it)
    a = []
    for kind in range(n):
        m = next(it)
        for _ in range(m):
            a.append((next(it), kind))
    a.sort()
    count = [0] * n
    have = left = 0
    answer = 10**9
    for value, kind in a:
        if count[kind] == 0:
            have += 1
        count[kind] += 1
        while have == n:
            answer = min(answer, value - a[left][0])
            old = a[left][1]
            count[old] -= 1
            if count[old] == 0:
                have -= 1
            left += 1
    print(answer)


if __name__ == '__main__':
    main()
`,
  }),
  defineToiPotentialLesson("a292", {
    topic: "data-structures",
    level: "hard",
    concept: "加權逆序對與雙 Fenwick tree",
    goal: "證明每個逆序對恰交換一次，並用數量與重量前綴和計算耗電。",
    explanation: [
      "交換相鄰且逆序的雕像，只改變這兩座的相對順序；它們交換後已正序，不可能再次互相交換。原本逆序的一對若要完成排序，一定得跨越彼此。因此每個原始逆序對恰好交換一次，總耗電就是所有 i<j 且 Wi>Wj 的 Wi+Wj，與實際選哪一對先交換無關。",
      "由左往右掃描，兩棵 Fenwick tree 分別保存先前重量的出現數與重量總和。遇到 x 時，以已處理總數減去重量≤x 的前綴數，得到嚴格大於 x 的數量 c；同理得到它們的重量總和 s。新增電力為 s+c×x，再把 x 插入兩棵樹。相等重量不是逆序，必須從前綴中完整扣除。",
    ],
    complexity:
      "令 V=max Wi≤10^6。時間 O(V+N log V)，空間 O(V)（Python 另存 O(N) 輸入）；總電力可能約 4×10^16，C++ 使用 64 位元。",
    pitfall:
      "只數逆序對再乘固定常數不對，每一對的代價不同；Fenwick tree 的重量和與答案都要用 64 位元。",
    traceLabel: "公開範例：4、1、3、2",
    trace: [
      {
        title: "處理 4、1",
        description: "4 前面無元素；1 與前面的 4 形成逆序對，增加 4+1=5。",
        cells: ["4", "1", "3", "2"],
        active: [0, 1],
        variables: [
          ["新增", "5"],
          ["總電力", "5"],
        ],
      },
      {
        title: "處理 3",
        description: "前面只有 4 大於 3，增加 4+3=7。",
        cells: ["4", "1", "3", "2"],
        active: [0, 2],
        variables: [
          ["c、s", "1、4"],
          ["總電力", "12"],
        ],
      },
      {
        title: "處理 2",
        description: "4、3 都大於 2，增加 (4+3)+2×2=11。",
        cells: ["4", "1", "3", "2"],
        active: [0, 2, 3],
        variables: [
          ["c、s", "2、7"],
          ["答案", "23"],
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
    vector<int> a(n);
    int v = 0;
    for (int &x : a) {
        cin >> x;
        v = max(v, x);
    }
    vector<long long> cnt(v + 1), weight(v + 1);
    long long seen = 0, total = 0, ans = 0;
    for (int x : a) {
        long long c = 0, s = 0;
        for (int i = x; i > 0; i -= i & -i) {
            c += cnt[i];
            s += weight[i];
        }
        ans += total - s + (seen - c) * x;
        for (int i = x; i <= v; i += i & -i) {
            ++cnt[i];
            weight[i] += x;
        }
        ++seen;
        total += x;
    }
    cout << ans << '\n';
}`,
    python: String.raw`import sys


def main():
    data = list(map(int, sys.stdin.buffer.read().split()))
    a = data[1:]
    v = max(a)
    count = [0] * (v + 1)
    weight = [0] * (v + 1)
    seen = total = answer = 0
    for x in a:
        c = s = 0
        i = x
        while i:
            c += count[i]
            s += weight[i]
            i -= i & -i
        answer += total - s + (seen - c) * x
        i = x
        while i <= v:
            count[i] += 1
            weight[i] += x
            i += i & -i
        seen += 1
        total += x
    print(answer)


if __name__ == '__main__':
    main()
`,
  }),
  defineToiPotentialLesson("a293", {
    topic: "greedy",
    level: "hard",
    concept: "期限排序與刪除最長工作的貪心",
    goal: "以最大堆維護可準時完成的工作集合，必要時換掉耗時最長的一筆。",
    explanation: [
      "先按期限遞增排序。任何可行集合都能改成這個順序：相鄰兩筆期限顛倒時交換它們，較早期限的工作提早完成，較晚期限的工作也不會晚於交換前兩筆的結束時間。因此只需在期限排序後挑選子集合。",
      "依序把工作加入最大堆並累加時間；若超過目前期限，就刪除集合內耗時最長的工作。加入前已可行，刪除的時間至少等於本次加入的時間，故刪一次便恢復可行。以交換論證維護：處理每個期限前綴後，保留的集合能達到最大筆數；需要捨棄一筆時捨棄最長者，讓相同筆數的總時間最小，留給後續最多餘裕。刪除既有工作只會使之前的完成時間提早。",
    ],
    complexity:
      "時間 O(N log N)，空間 O(N)。N≤100000、Pi≤10^9，累加時間可達 10^14，使用 64 位元。",
    pitfall:
      "不能只依耗時或期限選取且永不撤回；Pi>Ti 的工作應能在加入後自動被移除。",
    traceLabel: "公開範例按期限排列：(2,3)、(1,4)、(4,5)、(5,7)",
    trace: [
      {
        title: "接受前兩筆",
        description: "依序花 2、1 單位時間，總時間 3，兩筆都準時。",
        cells: ["2/3", "1/4", "4/5", "5/7"],
        active: [0, 1],
        variables: [
          ["總時間", "3"],
          ["筆數", "2"],
        ],
      },
      {
        title: "加入 4/5",
        description: "總時間變 7>5，刪去最長的 4，回到時間 3。",
        cells: ["2/3", "1/4", "刪 4/5", "5/7"],
        active: [2],
        variables: [
          ["刪除耗時", "4"],
          ["總時間", "3"],
        ],
      },
      {
        title: "加入 5/7",
        description: "總時間變 8>7，刪去耗時 5，最後可完成兩筆。",
        cells: ["2/3", "1/4", "刪 4/5", "刪 5/7"],
        active: [3],
        variables: [
          ["總時間", "3"],
          ["答案", "2"],
        ],
      },
    ],
    cpp: String.raw`#include <algorithm>
#include <iostream>
#include <queue>
#include <utility>
#include <vector>
using namespace std;
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    vector<pair<long long, long long>> a(n);
    for (auto &[t, p] : a)
        cin >> p >> t;
    sort(a.begin(), a.end());
    priority_queue<long long> q;
    long long sum = 0;
    for (auto [t, p] : a) {
        q.push(p);
        sum += p;
        if (sum > t) {
            sum -= q.top();
            q.pop();
        }
    }
    cout << q.size() << '\n';
}`,
    python: String.raw`import sys
import heapq


def main():
    read = sys.stdin.buffer.readline
    n = int(read())
    jobs = []
    for _ in range(n):
        p, t = map(int, read().split())
        jobs.append((t, p))
    jobs.sort()
    heap = []
    total = 0
    for deadline, duration in jobs:
        total += duration
        heapq.heappush(heap, -duration)
        if total > deadline:
            total += heapq.heappop(heap)
    print(len(heap))


if __name__ == '__main__':
    main()
`,
  }),
  defineToiPotentialLesson("a294", {
    topic: "graphs",
    level: "hard",
    concept: "強連通分量縮點與從起點出發的 DAG 最長路徑",
    goal: "區別『每點都可達』與『一趟旅程全部走完』，用縮點後的路徑判定。",
    explanation: [
      "同一強連通分量內，任意兩點互相可達，所以能從任意入口繞行所有點，再走到任意出口。把每個分量縮成一點後得到 DAG；旅程一旦離開分量就不能再回來，否則它們原本應屬於同一分量。因此原題等價於：縮點圖是否有從國家 1 所屬分量出發、包含所有分量的有向路徑。只有可達性並不足夠，例如 1→2、1→3 無法在一趟旅程拜訪兩個分支。",
      "用兩趟迭代 DFS 求 Kosaraju 分量：先在原圖記錄完成順序，再按完成順序反向走反圖。此順序得到的分量編號本身就是拓樸順序。設 dp[c] 為從起點分量出發，到 c 最多經過多少個分量；只對可達分量做 dp[d]=max(dp[d],dp[c]+1)。若最大值等於分量總數，就存在完整旅程。程式按分量內原頂點的出邊轉移，不另外複製縮點邊，重複道路也不影響最大值。",
    ],
    complexity:
      "時間 O(N+M)，空間 O(N+M)。N≤100000、M≤1000000；使用顯式堆疊，避免長鏈造成遞迴溢位。",
    pitfall:
      "從 1 做一次搜尋確認全部可達仍可能答錯；dp 起點必須是國家 1 的分量，而非任意 DAG 起點。",
    traceLabel: "公開範例縮點：{1,2} → {3,4} → {5}",
    trace: [
      {
        title: "合併可互達國家",
        description: "1↔2 為 C0，3↔4 為 C1，5 自成 C2。",
        cells: ["C0={1,2}", "C1={3,4}", "C2={5}"],
        active: [0],
        variables: [
          ["分量數", "3"],
          ["dp[C0]", "1"],
        ],
      },
      {
        title: "經由 2→3",
        description: "從 C0 到 C1，可連續拜訪兩個分量。",
        cells: ["C0:1", "C1:2", "C2:0"],
        active: [1],
        variables: [
          ["dp[C1]", "2"],
          ["代表道路", "2→3"],
        ],
      },
      {
        title: "經由 4→5",
        description: "dp[C2]=3 等於分量數，存在拜訪全部國家的旅程。",
        cells: ["C0:1", "C1:2", "C2:3"],
        active: [2],
        variables: [
          ["最長路徑", "3 個分量"],
          ["輸出", "Yes"],
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
    int n, m;
    cin >> n >> m;
    vector<vector<int>> g(n), rg(n);
    while (m--) {
        int a, b;
        cin >> a >> b;
        --a;
        --b;
        g[a].push_back(b);
        rg[b].push_back(a);
    }
    vector<char> seen(n);
    vector<int> order;
    for (int s = 0; s < n; s++)
        if (!seen[s]) {
            vector<pair<int, int>> st{{s, 0}};
            seen[s] = 1;
            while (!st.empty()) {
                int u = st.back().first;
                int &i = st.back().second;
                if (i == (int)g[u].size()) {
                    order.push_back(u);
                    st.pop_back();
                } else {
                    int v = g[u][i++];
                    if (!seen[v]) {
                        seen[v] = 1;
                        st.push_back({v, 0});
                    }
                }
            }
        }
    vector<int> comp(n, -1);
    vector<vector<int>> groups;
    for (auto it = order.rbegin(); it != order.rend(); ++it)
        if (comp[*it] < 0) {
            int id = groups.size();
            groups.push_back({});
            vector<int> st{*it};
            comp[*it] = id;
            while (!st.empty()) {
                int u = st.back();
                st.pop_back();
                groups[id].push_back(u);
                for (int v : rg[u])
                    if (comp[v] < 0) {
                        comp[v] = id;
                        st.push_back(v);
                    }
            }
        }
    int c = groups.size();
    vector<int> dp(c);
    dp[comp[0]] = 1;
    int best = 1;
    for (int id = 0; id < c; id++)
        if (dp[id]) {
            best = max(best, dp[id]);
            for (int u : groups[id])
                for (int v : g[u])
                    if (comp[v] != id)
                        dp[comp[v]] = max(dp[comp[v]], dp[id] + 1);
        }
    cout << (best == c ? "Yes" : "No") << '\n';
}`,
    python: String.raw`import sys


def main():
    read = sys.stdin.buffer.readline
    n, m = map(int, read().split())
    g = [[] for _ in range(n)]
    rg = [[] for _ in range(n)]
    for _ in range(m):
        u, v = map(int, read().split())
        u -= 1
        v -= 1
        g[u].append(v)
        rg[v].append(u)
    seen = bytearray(n)
    order = []
    for s in range(n):
        if seen[s]:
            continue
        seen[s] = 1
        stack = [(s, 0)]
        while stack:
            u, i = stack[-1]
            if i == len(g[u]):
                order.append(u)
                stack.pop()
            else:
                v = g[u][i]
                stack[-1] = (u, i + 1)
                if not seen[v]:
                    seen[v] = 1
                    stack.append((v, 0))
    comp = [-1] * n
    groups = []
    for s in reversed(order):
        if comp[s] != -1:
            continue
        cid = len(groups)
        group = []
        groups.append(group)
        comp[s] = cid
        stack = [s]
        while stack:
            u = stack.pop()
            group.append(u)
            for v in rg[u]:
                if comp[v] == -1:
                    comp[v] = cid
                    stack.append(v)
    dp = [0] * len(groups)
    dp[comp[0]] = 1
    for cid, group in enumerate(groups):
        if dp[cid]:
            for u in group:
                for v in g[u]:
                    d = comp[v]
                    if d != cid:
                        dp[d] = max(dp[d], dp[cid] + 1)
    print('Yes' if max(dp) == len(groups) else 'No')


if __name__ == '__main__':
    main()
`,
  }),
  defineToiPotentialLesson("a295", {
    topic: "graphs",
    level: "medium",
    concept: "反向剝除出度為零的節點",
    goal: "不必列出所有環，直接找出能沿道路走到環的全部起點。",
    explanation: [
      "出度為 0 的點沒有下一步，不可能抵達任何環。把它移除後，若某點所有出邊也都指向已移除點，該點同樣不能到環。記錄反向鄰接串列與剩餘出度，將所有出度 0 的點入列；每移除一點，就把其前驅的出度減一。",
      "被刪除的點都不可能到環，這可按刪除順序歸納。另一方面，最後留下的每一點至少有一條邊仍在剩餘圖內，從它持續沿任意剩餘邊前進，在有限節點中必定重複一點，也就抵達環。因此留下的點恰好是答案，包含環本身及通往環的上游節點，但不包含只被環指向的死路。",
    ],
    complexity:
      "時間與空間皆 O(N+M)。N≤100000、M≤500000，每條邊只在刪除終點時處理一次。",
    pitfall:
      "要刪的是出度 0 而非入度 0；一般拓樸排序刪入度 0 會保留『環能到達』的點，方向相反。",
    traceLabel: "公開範例：0→1→2→1，另有 2→3，4 孤立",
    trace: [
      {
        title: "初始化出度",
        description: "3 與 4 沒有出邊，先入列。",
        cells: ["0:1", "1:1", "2:2", "3:0", "4:0"],
        active: [3, 4],
        variables: [
          ["佇列", "3、4"],
          ["剩餘點數", "5"],
        ],
      },
      {
        title: "移除 3",
        description: "刪除 2→3，2 還有通往 1 的邊，不入列。",
        cells: ["0:1", "1:1", "2:1", "3:刪", "4:0"],
        active: [2, 3],
        variables: [
          ["出度[2]", "1"],
          ["佇列", "4"],
        ],
      },
      {
        title: "移除 4 後停止",
        description: "0 可到 1↔2，三點都留下，依編號輸出。",
        cells: ["0:留", "1:留", "2:留", "3:刪", "4:刪"],
        active: [0, 1, 2],
        variables: [
          ["佇列", "空"],
          ["答案", "0 1 2"],
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
    vector<vector<int>> rev(n);
    vector<int> degree(n);
    while (m--) {
        int s, t;
        cin >> s >> t;
        rev[t].push_back(s);
        ++degree[s];
    }
    queue<int> q;
    for (int i = 0; i < n; i++)
        if (!degree[i])
            q.push(i);
    while (!q.empty()) {
        int u = q.front();
        q.pop();
        for (int v : rev[u])
            if (--degree[v] == 0)
                q.push(v);
    }
    bool first = true;
    for (int i = 0; i < n; i++)
        if (degree[i]) {
            if (!first)
                cout << ' ';
            cout << i;
            first = false;
        }
    if (first)
        cout << -1;
    cout << '\n';
}`,
    python: String.raw`import sys
from collections import deque


def main():
    read = sys.stdin.buffer.readline
    n, m = map(int, read().split())
    rev = [[] for _ in range(n)]
    degree = [0] * n
    for _ in range(m):
        s, t = map(int, read().split())
        rev[t].append(s)
        degree[s] += 1
    q = deque(i for i in range(n) if degree[i] == 0)
    while q:
        u = q.popleft()
        for v in rev[u]:
            degree[v] -= 1
            if degree[v] == 0:
                q.append(v)
    answer = [str(i) for i in range(n) if degree[i] > 0]
    print(' '.join(answer) if answer else '-1')


if __name__ == '__main__':
    main()
`,
  }),
  defineToiPotentialLesson("a296", {
    topic: "data-structures",
    level: "hard",
    concept: "反轉後序與單調祖先堆疊",
    goal: "在線性建樹時間內恢復父節點，並安全處理二十萬點的退化樹。",
    explanation: [
      "後序是左、右、根，反向讀取就是根、右、左。先將最後一個值當根放進堆疊，之後每個值 x 若大於堆疊頂端，就進入該頂端的右子樹，父節點為頂端。若 x 小於頂端，代表該右側分支已走完，需要沿祖先回退。",
      "持續彈出所有大於 x 的頂端，最後被彈出的節點就是要轉入左子樹的父節點，將 x 接在其左側；再把 x 入堆疊。堆疊保存反向走訪中尚待處理左側的候選祖先，由底至頂遞增。輸入保證合法 BST，故比較能唯一決定轉向，不需反覆切割陣列。每點最多入堆疊、出堆疊一次，最後另將 (節點值,父值) 排序輸出。",
    ],
    complexity:
      "恢復父節點 O(N)，依節點值排序輸出 O(N log N)，總空間 O(N)。N≤200000；不用遞迴，退化成鏈也安全。",
    pitfall:
      "反向讀取時右子樹先於左子樹；彈出多個祖先後，父節點是最後彈出的值，並非剩下的堆疊頂端。",
    traceLabel: "縮小示例：後序 1、3、2、5、4",
    trace: [
      {
        title: "先讀根與右子",
        description: "反向先讀 4、5：4 為根，5>4，父節點是 4。",
        cells: ["4", "5"],
        active: [1],
        variables: [
          ["堆疊", "4,5"],
          ["父[5]", "4"],
        ],
      },
      {
        title: "讀到 2",
        description: "2<5 且 2<4，依序彈出 5、4；最後彈出 4 是父節點。",
        cells: ["4", "5", "2"],
        active: [0, 2],
        variables: [
          ["堆疊", "2"],
          ["父[2]", "4"],
        ],
      },
      {
        title: "完成 3、1",
        description: "3>2，父為 2；讀 1 時彈出 3、2，所以父也為 2。",
        cells: ["1→2", "2→4", "3→2", "4→-1", "5→4"],
        active: [0, 2],
        variables: [
          ["最終堆疊", "1"],
          ["輸出順序", "1,2,3,4,5"],
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
    vector<int> p(n), st;
    for (int &x : p)
        cin >> x;
    vector<pair<int, int>> answer;
    st.push_back(p.back());
    answer.push_back({p.back(), -1});
    for (int i = n - 2; i >= 0; i--) {
        int x = p[i], parent = -1;
        while (!st.empty() && x < st.back()) {
            parent = st.back();
            st.pop_back();
        }
        if (parent == -1)
            parent = st.back();
        answer.push_back({x, parent});
        st.push_back(x);
    }
    sort(answer.begin(), answer.end());
    for (auto [u, f] : answer)
        cout << u << ' ' << f << '\n';
}`,
    python: String.raw`import sys


def main():
    data = list(map(int, sys.stdin.buffer.read().split()))
    p = data[1:]
    stack = [p[-1]]
    answer = [(p[-1], -1)]
    for x in reversed(p[:-1]):
        parent = -1
        while stack and x < stack[-1]:
            parent = stack.pop()
        if parent == -1:
            parent = stack[-1]
        answer.append((x, parent))
        stack.append(x)
    answer.sort()
    sys.stdout.write('\n'.join(f'{u} {f}' for u, f in answer) + '\n')


if __name__ == '__main__':
    main()
`,
  }),
  defineToiPotentialLesson("a297", {
    topic: "data-structures",
    level: "hard",
    concept: "依右端離線排序與最後出現位置",
    goal: "用一棵 Fenwick tree 回答四十萬筆區間相異種類查詢。",
    explanation: [
      "把查詢依右端 r 排序，再把陣列從左向右加入。每種建材只在目前最後出現的位置放 1，舊位置放 0；Fenwick tree 維護這些標記的區間總和。加入第 i 個建材時，若它曾在 p 出現，就先在 p 加 −1，再在 i 加 1，並更新最後位置。",
      "處理右端 r 時，某建材出現在 [l,r] 中，恰好等價於它在前綴 [1,r] 的最後出現位置≥l。每種建材只有一個標記，因此 prefix(r)−prefix(l−1) 正好計算相異種類，不受重複次數影響。儲存原查詢編號，最後按原順序輸出，而非排序後的順序。",
    ],
    complexity:
      "時間 O(Q log Q+(N+Q)log N)，空間 O(N+Q)。N、Q≤400000；建材編號≤N，可用陣列記最後位置。",
    pitfall:
      "標記舊出現位置必須取消；查詢右端尚未加入完畢前不能回答，也不能用整段全域最後出現位置。",
    traceLabel: "公開範例：1、3、1、4、3、6",
    trace: [
      {
        title: "掃到 r=3",
        description: "建材 1 的標記從位置 1 移到 3；[3,3] 只有一種。",
        cells: ["0", "1", "1", "未加入", "未加入", "未加入"],
        active: [2],
        variables: [
          ["標記位置", "2、3"],
          ["查詢[3,3]", "1"],
        ],
      },
      {
        title: "掃到 r=4",
        description: "在 4 新增建材 4，位置 2、3、4 的標記總和為 3。",
        cells: ["0", "1", "1", "1", "未加入", "未加入"],
        active: [1, 2, 3],
        variables: [
          ["標記位置", "2、3、4"],
          ["查詢[2,4]", "3"],
        ],
      },
      {
        title: "掃到 r=6",
        description: "3 的標記移到 5，6 在 6 新增標記；全段四種，[4,6] 三種。",
        cells: ["0", "0", "1", "1", "1", "1"],
        active: [3, 4, 5],
        variables: [
          ["查詢[1,6]", "4"],
          ["查詢[4,6]", "3"],
        ],
      },
    ],
    cpp: String.raw`#include <algorithm>
#include <array>
#include <iostream>
#include <vector>
using namespace std;
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    vector<int> a(n + 1), last(n + 1), bit(n + 1);
    for (int i = 1; i <= n; i++)
        cin >> a[i];
    int q;
    cin >> q;
    vector<array<int, 3>> queries(q);
    vector<int> ans(q);
    for (int i = 0; i < q; i++) {
        int l, r;
        cin >> l >> r;
        queries[i] = {r, l, i};
    }
    sort(queries.begin(), queries.end());
    auto add = [&](int i, int v) {
        for (; i <= n; i += i & -i)
            bit[i] += v;
    };
    auto sum = [&](int i) {
        int s = 0;
        for (; i; i -= i & -i)
            s += bit[i];
        return s;
    };
    int pos = 0;
    for (auto [r, l, id] : queries) {
        while (pos < r) {
            ++pos;
            int x = a[pos];
            if (last[x])
                add(last[x], -1);
            add(pos, 1);
            last[x] = pos;
        }
        ans[id] = sum(r) - sum(l - 1);
    }
    for (int x : ans)
        cout << x << '\n';
}`,
    python: String.raw`import sys


def main():
    read = sys.stdin.buffer.readline
    n = int(read())
    a = [0] + list(map(int, read().split()))
    q = int(read())
    queries = []
    for index in range(q):
        l, r = map(int, read().split())
        queries.append((r, l, index))
    queries.sort()
    last = [0] * (n + 1)
    bit = [0] * (n + 1)

    def add(i, value):
        while i <= n:
            bit[i] += value
            i += i & -i

    def prefix(i):
        result = 0
        while i:
            result += bit[i]
            i -= i & -i
        return result

    answer = [0] * q
    pos = 0
    for r, l, index in queries:
        while pos < r:
            pos += 1
            x = a[pos]
            if last[x]:
                add(last[x], -1)
            add(pos, 1)
            last[x] = pos
        answer[index] = prefix(r) - prefix(l - 1)
    print('\n'.join(map(str, answer)))


if __name__ == '__main__':
    main()
`,
  }),
];
