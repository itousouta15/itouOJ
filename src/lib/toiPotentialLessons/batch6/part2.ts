import type { ToiPotentialLesson } from "@/lib/toiPotentialLessonTypes";
import { defineToiPotentialLesson } from "@/lib/toiPotentialLessonBuilder";

export const lessons: ToiPotentialLesson[] = [
  defineToiPotentialLesson("a342", {
    topic: "data-structures",
    level: "hard",
    concept: "連續分組貪心與 Fenwick 前綴搜尋",
    goal: "在單點增減後，利用答案不超過 30 的保證快速回答最少搬運人數。",
    explanation: [
      "每位服務生都從當下最上層開始，應搬走總重不超過 A 的最長前綴。任一可行方案第一人搬得較少時，可以把後面幾人的前段移交給第一人；重量非負，其他人的負擔只會減少，故最長前綴的選擇不會增加人數。反覆套用即可得到最少連續分組。即使整疊重量為零，N≥1 個盒子仍需一人搬走。",
      "Fenwick tree 維護各盒重量的前綴和，單點增減為 O(log N)。已搬完前 p 盒、其前綴重量為 used 時，用 Fenwick 二進位提升找最大的 j，使 prefix(j)≤used+A；下一人一次搬完 p+1..j。每次查詢至多做 30 次搜尋，不必掃描 N 個盒子。更新不必立即求分組，範例中第一盒曾暫時超重但在下次詢問前恢復。",
      "來源保留的範例 2 有 D=15>A=12，與文字界限矛盾；本程式不把更新量截成 A，照輸入執行。最長前綴搜尋要求詢問時所有重量非負且單盒不超過 A。題目沒有給無法搬運時的輸出，程式遇到搜尋不能前進就報錯，不捏造答案；規格外的負重量也未定義。",
    ],
    complexity:
      "建樹 O(N)，每次更新 O(log N)，答案為 s 的詢問 O(s log N)，s≤30；空間 O(N)。總重量可能達 2×10^14，C++ 使用 long long。",
    pitfall:
      "直接對 Fenwick 樹做二進位提升才是 O(log N)；二分索引再查前綴和會多一個 log。零重量盒子也必須讓位置前進。",
    traceLabel: "範例 A=12，各盒 9,4,2 → 6,4,2",
    trace: [
      {
        title: "第一人",
        description: "9 可搬，但 9+4=13 超過上限，先搬第一盒。",
        cells: ["9", "4", "2"],
        active: [0],
        variables: [
          ["已搬盒數", "1"],
          ["人數", "1"],
        ],
      },
      {
        title: "第二人",
        description: "剩下 4+2=6，一起搬走。",
        cells: ["9", "4", "2"],
        active: [1, 2],
        variables: [
          ["已搬盒數", "3"],
          ["答案", "2"],
        ],
      },
      {
        title: "取出重量 3 後",
        description: "重量變成 6,4,2，總重恰好 12，一人即可搬完。",
        cells: ["6", "4", "2"],
        active: [0, 1, 2],
        variables: [
          ["總重量", "12"],
          ["答案", "1"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <stdexcept>
using namespace std;
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, q;
    long long capacity;
    cin >> n >> q >> capacity;
    vector<long long> bit(n + 1);
    for (int i = 1; i <= n; i++) {
        long long x;
        cin >> x;
        bit[i] += x;
        int p = i + (i & -i);
        if (p <= n)
            bit[p] += bit[i];
    }
    int top = 1;
    while (top <= n / 2)
        top *= 2;
    while (q--) {
        int op;
        cin >> op;
        if (op) {
            int i;
            long long d;
            cin >> i >> d;
            if (op == 2)
                d = -d;
            for (; i <= n; i += i & -i)
                bit[i] += d;
        } else {
            int pos = 0, people = 0;
            long long used = 0;
            while (pos < n) {
                long long target = used + capacity, sum = 0;
                int j = 0;
                for (int step = top; step; step /= 2) {
                    int next = j + step;
                    if (next <= n && sum + bit[next] <= target) {
                        j = next;
                        sum += bit[next];
                    }
                }
                if (j == pos)
                    throw runtime_error("Unspecified: a box exceeds capacity");
                pos = j;
                used = sum;
                ++people;
            }
            cout << people << '\n';
        }
    }
}`,
    python: String.raw`import sys


def main():
    read = sys.stdin.buffer.readline
    n, q, capacity = map(int, read().split())
    bit = [0] * (n + 1)
    for i in range(1, n + 1):
        bit[i] += int(read())
        parent = i + (i & -i)
        if parent <= n:
            bit[parent] += bit[i]
    top = 1 << (n.bit_length() - 1)
    for _ in range(q):
        command = list(map(int, read().split()))
        if command[0]:
            op, i, delta = command
            if op == 2:
                delta = -delta
            while i <= n:
                bit[i] += delta
                i += i & -i
        else:
            pos = used = people = 0
            while pos < n:
                target, j, total, step = used + capacity, 0, 0, top
                while step:
                    nxt = j + step
                    if nxt <= n and total + bit[nxt] <= target:
                        j, total = nxt, total + bit[nxt]
                    step >>= 1
                if j == pos:
                    raise ValueError('Unspecified: a box exceeds capacity')
                pos, used = j, total
                people += 1
            print(people)


if __name__ == '__main__':
    main()
`,
  }),
  defineToiPotentialLesson("a343", {
    topic: "dp",
    level: "hard",
    concept: "時間分層最短路與陷阱事件",
    goal: "保留停留動作，精確計算在期限內抵達的最小逐時傷害。",
    explanation: [
      "dp[t][v] 定義為時間恰為 t、位於草地 v 的最小損失。時間 t 的前驅只有 v 自己與上下左右四格；取五者最小值，再加上 v 在時間 t 的陷阱傷害。只靠最小累積傷害挑格子而不記時間會錯，因為同一陷阱可能稍後解除。每次轉移只讀上一層，使用兩個陣列輪替即可。",
      "每個陷阱 [S,E] 轉成 S 時加入 A、E+1 時扣除 A 的事件，依時間排序，掃描每層之前先更新各格的當前傷害，避免配置 T×N×M 的傷害表。起點與終點沒有陷阱，因此提早抵達後可以無損停留至 T，最後一層的終點答案就等於期限內最小值。障礙以不可達值包邊，五個前驅可直接以索引讀取。",
      "來源示範路線的文字曾把一個 10 傷害的陷阱寫成 15；本教學依實際輸入、輸出及已核對的官方轉移逐時間扣血，停留在陷阱上也會再次受傷。不可為了配合那段敘述改寫範例數值。",
    ],
    complexity:
      "時間 O(Q log Q+TNM)，空間 O(NM+Q)；最大 4000 萬個格時狀態，每格檢查五個前驅，Python 最大案例須實測。損失上界 T×10000≤10^7。",
    pitfall:
      "陷阱的結束時間 E 仍有效，必須在 E+1 才關閉。不可在更新同一層時使用剛算出的鄰格。",
    traceLabel: "小例 2×2、T=3：兩個中繼格在 t=1 各傷 5、9，之後失效",
    trace: [
      {
        title: "t=0",
        description: "起點損失為零，其餘格尚未到達。",
        cells: ["起點:0", "右:∞", "下:∞", "終點:∞"],
        active: [0],
        variables: [["時間", "0"]],
      },
      {
        title: "t=1",
        description: "往右損失 5、往下損失 9，也可以留在起點不受傷。",
        cells: ["起點:0", "右:5", "下:9", "終點:∞"],
        active: [0, 1, 2],
        variables: [["時間", "1"]],
      },
      {
        title: "t=2",
        description: "陷阱已關閉，等待後出發能零傷抵達中繼格；終點目前最少 5。",
        cells: ["起點:0", "右:0", "下:0", "終點:5"],
        active: [1, 2],
        variables: [["時間", "2"]],
      },
      {
        title: "t=3",
        description: "從零傷的中繼格走到終點，答案為 0。",
        cells: ["起點:0", "右:0", "下:0", "終點:0"],
        active: [3],
        variables: [["答案", "0"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <tuple>
#include <string>
#include <algorithm>
using namespace std;
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, m, T, q;
    cin >> n >> m >> T >> q;
    int width = m + 2, size = (n + 2) * width;
    vector<int> cells;
    for (int r = 0; r < n; r++) {
        string row;
        cin >> row;
        for (int c = 0; c < m; c++)
            if (row[c] != '#')
                cells.push_back((r + 1) * width + c + 1);
    }
    vector<tuple<int, int, int>> events;
    for (int i = 0, h, w, s, e, a; i < q; i++) {
        cin >> h >> w >> s >> e >> a;
        int v = (h + 1) * width + w + 1;
        events.emplace_back(s, v, a);
        events.emplace_back(e + 1, v, -a);
    }
    sort(events.begin(), events.end());
    vector<int> damage(size);
    const int INF = 1000000000;
    vector<int> dp(size, INF), next(size, INF);
    dp[width + 1] = 0;
    size_t p = 0;
    for (int t = 1; t <= T; t++) {
        while (p < events.size() && get<0>(events[p]) <= t) {
            auto [time, v, a] = events[p++];
            damage[v] += a;
        }
        for (int v : cells) {
            int best = min({dp[v], dp[v - 1], dp[v + 1], dp[v - width], dp[v + width]});
            next[v] = best == INF ? INF : best + damage[v];
        }
        dp.swap(next);
    }
    int ans = dp[n * width + m];
    cout << (ans == INF ? -1 : ans) << '\n';
}`,
    python: String.raw`import sys


def main():
    read = sys.stdin.buffer.readline
    n, m, deadline, q = map(int, read().split())
    width, size = m + 2, (n + 2) * (m + 2)
    cells = []
    for r in range(n):
        row = read().strip()
        cells.extend((r + 1) * width + c + 1 for c in range(m) if row[c] != ord('#'))
    events = []
    for _ in range(q):
        h, w, start, end, loss = map(int, read().split())
        v = (h + 1) * width + w + 1
        events.append((start, v, loss))
        events.append((end + 1, v, -loss))
    events.sort()
    damage, inf = [0] * size, 10**9
    dp, nxt = [inf] * size, [inf] * size
    dp[width + 1] = 0
    p = 0
    for time in range(1, deadline + 1):
        while p < len(events) and events[p][0] <= time:
            _, v, loss = events[p]
            damage[v] += loss
            p += 1
        for v in cells:
            best = min(dp[v], dp[v - 1], dp[v + 1], dp[v - width], dp[v + width])
            nxt[v] = inf if best == inf else best + damage[v]
        dp, nxt = nxt, dp
    answer = dp[n * width + m]
    print(-1 if answer == inf else answer)


if __name__ == '__main__':
    main()
`,
  }),
  defineToiPotentialLesson("a344", {
    topic: "math",
    level: "hard",
    concept: "巢狀費式索引、矩陣乘法與可驗證週期",
    goal: "依題目公式計算包雞數列，明示無法同時滿足的官方範例。",
    explanation: [
      "先區分題目 F_i=f_(i+1) 與標準費式 f_0=0,f_1=1。令 Q=[[1,1],[1,0]]，Q^u 的左上角是 f_(u+1)=F_u。相鄰內層指數為 F_i,F_(i+1)，下一個是兩者之和，所以 Q^(F_(i+2))=Q^(F_i)Q^(F_(i+1))。用兩個標準費式值 (f_u,f_(u+1)) 表示 Q^u，只需四個純量模乘即可得到指數相加後的矩陣，不必存巨大索引。",
      "模數 M=1080494663 有可直接驗證的週期界 P=2160989328：快速倍增計得 (f_P,f_(P+1)) mod M=(0,1)，故 Q^P=I。再驗證 (f_L,f_(L+1)) mod P=(0,1)，其中 L=1639680，內層索引每 L 項重複。這兩個等式已足以證明 L 是巢狀項的合法週期，不需聲稱是最小週期或依賴質數判定。程式也會自行驗證等式，計算一個週期的總和與餘段，將 n≤10^8 降為最多 L 次迭代。",
      "公式含 i=0..n，共 n+1 項，因此 T_0=1、T_1=2、T_2=4、T_5=49。官方第一個範例卻是輸入 1 輸出 1，與明示公式矛盾。本程式忠實實作公式，所以第一範例會輸出 2；另外兩個範例吻合。在來源未澄清前，不能宣稱此程式通過全部官方範例或能匹配未知評測。輸入上限與分組上限也不一致，此處依較大的 10^8 設計。",
    ],
    complexity:
      "時間 O(min(n+1,1639680)+log P)，額外空間 O(1)。模乘與兩個乘積之和都低於 2M²<2.4×10^18，C++ long long 可容納。",
    pitfall:
      "不要偷偷對 n=1 特判成官方答案，這會隱藏定義矛盾。也不能把內層索引直接對 M 取模。",
    traceLabel: "依公式：內層 1,1,2,3,5,8",
    trace: [
      {
        title: "i=0、1",
        description: "兩個內層索引都為 1，外層項各為 F1=1。",
        cells: ["1", "1"],
        active: [0, 1],
        variables: [
          ["T1（公式）", "2"],
          ["官方範例1", "1，矛盾"],
        ],
      },
      {
        title: "i=2、3",
        description: "接著加入 F2=2、F3=3。",
        cells: ["1", "1", "2", "3"],
        active: [2, 3],
        variables: [
          ["T2", "4"],
          ["T3", "7"],
        ],
      },
      {
        title: "i=4、5",
        description: "再加 F5=8、F8=34，得到 49。",
        cells: ["1", "1", "2", "3", "8", "34"],
        active: [4, 5],
        variables: [["T5", "49"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <utility>
#include <algorithm>
#include <stdexcept>
using namespace std;
using ll = long long;
pair<ll, ll> fib(ll n, ll mod) {
    if (n == 0)
        return {0, 1};
    auto [a, b] = fib(n / 2, mod);
    ll c = a * ((2 * b - a + mod) % mod) % mod, d = (a * a % mod + b * b % mod) % mod;
    return n & 1 ? make_pair(d, (c + d) % mod) : make_pair(c, d);
}
int main() {
    ll n;
    cin >> n;
    const ll MOD = 1080494663, P = 2160989328, PERIOD = 1639680;
    if (fib(P, MOD) != make_pair(0LL, 1LL) || fib(PERIOD, P) != make_pair(0LL, 1LL))
        throw runtime_error("Invalid period");
    ll count = n + 1, steps = min(count, PERIOD), rem = count % PERIOD;
    ll a = 1, b = 1, c = 1, d = 1, sum = 0, prefix = 0;
    for (ll i = 0; i < steps; i++) {
        sum = (sum + b) % MOD;
        if (i + 1 == rem)
            prefix = sum;
        ll nextA = (a * d + ((b - a + MOD) % MOD) * c) % MOD, nextB = (b * d + a * c) % MOD;
        a = c;
        b = d;
        c = nextA;
        d = nextB;
    }
    ll ans = count < PERIOD ? sum : ((count / PERIOD) * sum + prefix) % MOD;
    cout << ans << '\n';
}`,
    python: String.raw`import sys

MOD, P, PERIOD = 1080494663, 2160989328, 1639680


def fib(n, mod):
    a, b = 0, 1
    for bit in bin(n)[2:]:
        c = a * ((2 * b - a) % mod) % mod
        d = (a * a + b * b) % mod
        a, b = (d, (c + d) % mod) if bit == '1' else (c, d)
    return a, b


def main():
    if fib(P, MOD) != (0, 1) or fib(PERIOD, P) != (0, 1):
        raise ValueError('Invalid period')
    count = int(sys.stdin.buffer.readline()) + 1
    steps, rem = min(count, PERIOD), count % PERIOD
    a = b = c = d = 1
    total = prefix = 0
    for i in range(steps):
        total = (total + b) % MOD
        if i + 1 == rem:
            prefix = total
        a, b, c, d = c, d, (a * d + (b - a) * c) % MOD, (b * d + a * c) % MOD
    print(total if count < PERIOD else ((count // PERIOD) * total + prefix) % MOD)


if __name__ == '__main__':
    main()
`,
  }),
  defineToiPotentialLesson("a345", {
    topic: "graphs",
    level: "medium",
    concept: "血量維度擴充的最短路 BFS",
    goal: "同一格保留不同受傷次數，找到仍存活的最短逃離路徑。",
    explanation: [
      "血量只有 3，所以用狀態 (位置,已受傷次數 h)，h=0,1,2。起點以 h=0 入隊，每走到一格陷阱就把 h 加一，到 3 就不能入隊。所有邊的步數成本都為 1，廣度優先搜尋第一次到達終點時，就是全部存活狀態中的最少步數。",
      "同一位置的 h 不同不能合併成單一 visited：較早到達但僅剩 1 血的路徑，可能無法通過後面的陷阱。最多 3xy 個狀態，每個只處理一次。用一維編碼 3×位置+h，逐層 BFS 記步數；棋盤只保存障礙、陷阱兩個標記，不建立大型鄰接表。再次踏入同一陷阱仍照常加 h。",
      "來源未明定起終點陷阱與障礙重疊。本程式按『進入陷阱才扣血』使初始站立不扣血，若終點是陷阱則到達時扣血；障礙不能進入，也不允許從障礙起點出發。這是依已明示移動規則作出的解讀，來源未提供特殊情況的唯一評測行為，不能聲稱該部分已獲保證。",
    ],
    complexity:
      "讀入 O(B+T)，搜尋時間與空間 O(xy)，狀態上限 3xy<300萬；Python visited 用 bytearray，不配置數百萬個整數距離。B、T 未列上限，讀取為串流。",
    pitfall:
      "剩 0 血即失敗，不能允許走過第三次陷阱；不要把陷阱當成只扣一次的可消耗物件。",
    traceLabel: "小例 3×2：起點(0,0)、終點(2,0)，中間(1,0)是陷阱",
    trace: [
      {
        title: "起點",
        description: "起始血量 3，步數為 0。",
        cells: ["(0,0)", "陷阱(1,0)", "終點(2,0)"],
        active: [0],
        variables: [
          ["h", "0"],
          ["步數", "0"],
        ],
      },
      {
        title: "進入陷阱",
        description: "沿下排向右，傷害次數變成 1。",
        cells: ["(0,0)", "陷阱(1,0)", "終點(2,0)"],
        active: [1],
        variables: [
          ["剩餘血量", "2"],
          ["步數", "1"],
        ],
      },
      {
        title: "抵達終點",
        description: "再向右一步，保有 2 血；繞上排雖零傷但需 4 步。",
        cells: ["(0,0)", "陷阱(1,0)", "終點(2,0)"],
        active: [2],
        variables: [
          ["最短步數", "2"],
          ["h", "1"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <queue>
using namespace std;
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int x, y, sx, sy, ex, ey, b, t;
    cin >> x >> y >> sx >> sy >> ex >> ey >> b >> t;
    int size = x * y, start = sy * x + sx, goal = ey * x + ex;
    vector<unsigned char> board(size), seen(3 * size);
    for (int i = 0, a, c; i < b; i++) {
        cin >> a >> c;
        board[c * x + a] |= 1;
    }
    for (int i = 0, a, c; i < t; i++) {
        cin >> a >> c;
        board[c * x + a] |= 2;
    }
    if ((board[start] & 1) || (board[goal] & 1)) {
        cout << -1 << '\n';
        return 0;
    }
    queue<int> q;
    q.push(start * 3);
    seen[start * 3] = 1;
    int steps = 0;
    int dx[] = {1, -1, 0, 0}, dy[] = {0, 0, 1, -1};
    while (!q.empty()) {
        int count = q.size();
        while (count--) {
            int state = q.front();
            q.pop();
            int v = state / 3, h = state % 3;
            if (v == goal) {
                cout << steps << '\n';
                return 0;
            }
            for (int d = 0; d < 4; d++) {
                int a = v % x + dx[d], c = v / x + dy[d];
                if (a < 0 || a >= x || c < 0 || c >= y)
                    continue;
                int u = c * x + a;
                if (board[u] & 1)
                    continue;
                int nh = h + bool(board[u] & 2), ns = u * 3 + nh;
                if (nh < 3 && !seen[ns]) {
                    seen[ns] = 1;
                    q.push(ns);
                }
            }
        }
        ++steps;
    }
    cout << -1 << '\n';
}`,
    python: String.raw`import sys
from collections import deque


def main():
    read = sys.stdin.buffer.readline
    width, height = map(int, read().split())
    sx, sy = map(int, read().split())
    ex, ey = map(int, read().split())
    obstacles, traps = map(int, read().split())
    size = width * height
    board = bytearray(size)
    for _ in range(obstacles):
        x, y = map(int, read().split())
        board[y * width + x] |= 1
    for _ in range(traps):
        x, y = map(int, read().split())
        board[y * width + x] |= 2
    start, goal = sy * width + sx, ey * width + ex
    if board[start] & 1 or board[goal] & 1:
        print(-1)
        return
    seen, queue, steps = bytearray(3 * size), deque([start * 3]), 0
    seen[start * 3] = 1
    while queue:
        for _ in range(len(queue)):
            v, damage = divmod(queue.popleft(), 3)
            if v == goal:
                print(steps)
                return
            x, y = v % width, v // width
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                a, b = x + dx, y + dy
                if not (0 <= a < width and 0 <= b < height):
                    continue
                u = b * width + a
                if board[u] & 1:
                    continue
                nh = damage + bool(board[u] & 2)
                ns = 3 * u + nh
                if nh < 3 and not seen[ns]:
                    seen[ns] = 1
                    queue.append(ns)
        steps += 1
    print(-1)


if __name__ == '__main__':
    main()
`,
  }),
  defineToiPotentialLesson("a346", {
    topic: "graphs",
    level: "hard",
    concept: "指定起點的字典序最小歐拉迴路",
    goal: "把每條延長線視為有編號的有向邊，使用全部邊串回型號 T。",
    explanation: [
      "延長線的插座 A 接到前面的插頭，插頭 B 再接後面，所以它代表有向邊 A→B。全部使用且從 T 回到 T，正是從 T 出發的有向歐拉迴路。必要條件是每個型號入度等於出度；此外全部有邊的型號都必須屬於 T 所能遍歷的部分。用 Hierholzer 實際消耗全部邊，最後核對長度為 N，即可同時檢查連通性。",
      "每個型號的出邊依延長線編號排序，走訪時先取最小編號，走不下去時才把進入該節點的邊加入答案，最後反轉。這個後序拼接會把必須留到最後的片段放到後面；每個尚能接上迴路的分歧都優先使用最小邊，等價於把各子迴路依最早可插入的位置拼回。若另一條完整迴路在第一個不同位置使用更大邊，可把包含較小邊的閉合繞路先拼入而維持可行，故此構造取得字典序最小的完整邊序列。",
    ],
    complexity:
      "時間 O(N log N)，空間 O(N)；只有 10 種型號，N≤1000。以顯式堆疊避開 Python 遞迴深度。",
    pitfall:
      "字典序比較的是延長線編號，不是型號。度數平衡仍可能有兩個互不相連的迴路。C=1 只能輸出一行。",
    traceLabel: "小例：1號1→2、2號2→1、3號1→3、4號3→1",
    trace: [
      {
        title: "由 T=1 出發",
        description: "型號 1 的出邊有 1、3，先取編號 1。",
        cells: ["1:1→2", "2:2→1", "3:1→3", "4:3→1"],
        active: [0],
        variables: [["走訪前綴", "1"]],
      },
      {
        title: "回到型號 1",
        description: "接編號 2，接著可選的出邊只剩 3。",
        cells: ["1", "2", "3", "4"],
        active: [1, 2],
        variables: [["走訪前綴", "1 2 3"]],
      },
      {
        title: "後序反轉",
        description: "接 4 回到 1，回溯依序收集 4,3,2,1，反轉得到最小排列。",
        cells: ["1", "2", "3", "4"],
        active: [0, 1, 2, 3],
        variables: [["輸出", "1 / 1 2 3 4"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <utility>
#include <algorithm>
using namespace std;
int main() {
    int n, c, T;
    cin >> n >> c >> T;
    vector<vector<pair<int, int>>> g(11);
    vector<int> balance(11);
    for (int i = 1, a, b; i <= n; i++) {
        cin >> a >> b;
        g[a].push_back({i, b});
        ++balance[a];
        --balance[b];
    }
    for (int b : balance)
        if (b) {
            cout << 0 << '\n';
            return 0;
        }
    for (auto &edges : g)
        sort(edges.rbegin(), edges.rend());
    vector<pair<int, int>> stack{{T, 0}};
    vector<int> answer;
    while (!stack.empty()) {
        int v = stack.back().first;
        if (!g[v].empty()) {
            auto [id, u] = g[v].back();
            g[v].pop_back();
            stack.push_back({u, id});
        } else {
            int id = stack.back().second;
            stack.pop_back();
            if (id)
                answer.push_back(id);
        }
    }
    if ((int)answer.size() != n) {
        cout << 0 << '\n';
        return 0;
    }
    reverse(answer.begin(), answer.end());
    cout << 1 << '\n';
    if (c == 2) {
        for (int i = 0; i < n; i++) {
            if (i)
                cout << ' ';
            cout << answer[i];
        }
        cout << '\n';
    }
}`,
    python: String.raw`import sys


def main():
    read = sys.stdin.buffer.readline
    n, command = map(int, read().split())
    start = int(read())
    graph, balance = [[] for _ in range(11)], [0] * 11
    for i in range(1, n + 1):
        a, b = map(int, read().split())
        graph[a].append((i, b))
        balance[a] += 1
        balance[b] -= 1
    if any(balance):
        print(0)
        return
    for edges in graph:
        edges.sort(reverse=True)
    stack, answer = [(start, 0)], []
    while stack:
        v = stack[-1][0]
        if graph[v]:
            edge, u = graph[v].pop()
            stack.append((u, edge))
        else:
            _, edge = stack.pop()
            if edge:
                answer.append(edge)
    if len(answer) != n:
        print(0)
        return
    print(1)
    if command == 2:
        print(*reversed(answer))


if __name__ == '__main__':
    main()
`,
  }),
  defineToiPotentialLesson("a347", {
    topic: "data-structures",
    level: "hard",
    concept: "離線反向加邊與連通分量大小",
    goal: "將不易處理的航班刪除，反轉成並查集擅長的合併。",
    explanation: [
      "先讀完全部操作，標記最後已取消的航班，只用最後仍存在的邊建立並查集。把操作倒過來看，原本取消某條航班，現在就變成把這條邊加回；原本查詢某國時，其連通分量大小減一就是能到達的其他國家數。每個航班不會重複取消，倒序加回恰好一次。",
      "反向處理第 i 個操作之前，並查集恰好表示正向完成第 i 個操作後的網路；查詢不改圖，加回被刪的邊則回到前一時刻，因此可用歸納法證明每個答案正確。答案也依倒序得到，最後反轉輸出。相同國家對之間可以有多個航班，必須依邊編號記取消，不能把端點相同的所有邊一起刪掉。",
    ],
    complexity:
      "時間 O((N+M+Q)α(N))，空間 O(N+M+Q)。N≤40萬、M,Q≤100萬；Python 用 array 儲存端點、操作和答案，並串流讀取，避免整份 split 與百萬個 tuple。",
    pitfall: "並查集不支援直接刪邊，必須從最終圖開始；答案要扣掉出發國家本身。",
    traceLabel: "範例 1：1—2—3，取消第二班",
    trace: [
      {
        title: "最終網路",
        description: "第二班 2—3 已取消，只合併 1、2。",
        cells: ["{1,2}", "{3}"],
        active: [0],
        variables: [["最後查詢 1", "2−1=1"]],
      },
      {
        title: "反向恢復第二班",
        description: "加回 2—3，兩個集合合併。",
        cells: ["{1,2,3}"],
        active: [0],
        variables: [["分量大小", "3"]],
      },
      {
        title: "回答最早查詢",
        description: "國家 1 原本可到另外兩國；最後把反向答案 1,2 反轉。",
        cells: ["最早:2", "最後:1"],
        active: [0, 1],
        variables: [["正向輸出", "2 換行 1"]],
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
    vector<int> a(m + 1), b(m + 1);
    for (int i = 1; i <= m; i++)
        cin >> a[i] >> b[i];
    int q;
    cin >> q;
    vector<int> ops(q);
    vector<unsigned char> removed(m + 1);
    for (int i = 0, t, v; i < q; i++) {
        cin >> t >> v;
        ops[i] = (t == 1 ? -v : v);
        if (t == 1)
            removed[v] = 1;
    }
    vector<int> parent(n + 1, -1);
    auto find = [&](int x) {
        int root = x;
        while (parent[root] >= 0)
            root = parent[root];
        while (x != root) {
            int next = parent[x];
            parent[x] = root;
            x = next;
        }
        return root;
    };
    auto join = [&](int u, int v) {
        u = find(u);
        v = find(v);
        if (u == v)
            return;
        if (parent[u] > parent[v])
            swap(u, v);
        parent[u] += parent[v];
        parent[v] = u;
    };
    for (int i = 1; i <= m; i++)
        if (!removed[i])
            join(a[i], b[i]);
    vector<int> answer;
    for (auto it = ops.rbegin(); it != ops.rend(); ++it) {
        int v = *it;
        if (v < 0)
            join(a[-v], b[-v]);
        else
            answer.push_back(-parent[find(v)] - 1);
    }
    for (auto it = answer.rbegin(); it != answer.rend(); ++it)
        cout << *it << '\n';
}`,
    python: String.raw`import sys
from array import array


def main():
    read = sys.stdin.buffer.readline
    n, m = map(int, read().split())
    left, right = array('i', [0]), array('i', [0])
    for _ in range(m):
        a, b = map(int, read().split())
        left.append(a)
        right.append(b)
    q = int(read())
    ops, removed = array('i'), bytearray(m + 1)
    for _ in range(q):
        kind, value = map(int, read().split())
        ops.append(-value if kind == 1 else value)
        if kind == 1:
            removed[value] = 1
    parent = array('i', [-1]) * (n + 1)

    def find(x):
        root = x
        while parent[root] >= 0:
            root = parent[root]
        while x != root:
            nxt = parent[x]
            parent[x] = root
            x = nxt
        return root

    def join(a, b):
        a, b = find(a), find(b)
        if a == b:
            return
        if parent[a] > parent[b]:
            a, b = b, a
        parent[a] += parent[b]
        parent[b] = a

    for i in range(1, m + 1):
        if not removed[i]:
            join(left[i], right[i])
    answer = array('i')
    for op in reversed(ops):
        if op < 0:
            join(left[-op], right[-op])
        else:
            answer.append(-parent[find(op)] - 1)
    for value in reversed(answer):
        print(value)


if __name__ == '__main__':
    main()
`,
  }),
  defineToiPotentialLesson("a348", {
    topic: "strings",
    level: "hard",
    concept: "非遞迴 JSON 邊界掃描與原文擷取",
    goal: "不正規化 JSON，依存取路徑輸出原字串對應片段。",
    explanation: [
      "先掃描原文，為每個值的開頭記錄 end[start]，代表它結束位置的下一格。遇到雙引號就完整跳過字串，字串內的括號、逗號都不視為結構；題目不含跳脫字元，所以找到下一個雙引號即可。左右中括號與大括號用堆疊配對，數字和布林值讀到逗號、結尾括號或空白停止。這樣即使巢狀上萬層也不需要函式遞迴。",
      "從 obj 指向的根值開始。陣列查詢就用 end 跳過前面幾個完整元素；物件查詢則讀鍵字串、跳過冒號，若鍵不符便以 end 跳過整個值。找到後把目前範圍縮到該值，繼續下一個查詢。掃過而排除的兄弟區塊不會再進入，沿途被選中的容器只處理它的開頭，因此全部跳躍與比較總長為線性。最後直接輸出 s[start:end[start]]，保留引號、內部空白與物件鍵順序；只有 obj 時輸出整行原文。",
      "來源沒有定義不存在的鍵、越界索引或對純量繼續存取的輸出。本程式對有效存取完成求值；遇到無效存取會報錯，沒有自行指定 null 或其他可能被誤認為題目規定的結果。",
    ],
    complexity:
      "時間 O(|s|+|o|)，空間 O(|s|)，兩行各小於 65525 字元；顯式堆疊避免最深巢狀造成遞迴溢位。",
    pitfall:
      "不能 json.loads 後再 dumps，否則可能改動空白、鍵順序或布林表示。字串中的括號不參與配對。",
    traceLabel: '範例 {"Kirito":[{"Busna":"OAO"},"startburst"]}',
    trace: [
      {
        title: "根物件",
        description: "先配對所有容器邊界，obj 目前指向整份 JSON。",
        cells: ['{"Kirito":[{"Busna":"OAO"},"startburst"]}'],
        active: [0],
        variables: [["剩餘路徑", '["Kirito"][0]']],
      },
      {
        title: "查詢物件鍵",
        description: "找到 Kirito，範圍縮到陣列，內部表示完全保留。",
        cells: ['[{"Busna":"OAO"},"startburst"]'],
        active: [0],
        variables: [["剩餘路徑", "[0]"]],
      },
      {
        title: "查詢第零項",
        description: "陣列索引從 0 起算，取第一個物件原文。",
        cells: ['{"Busna":"OAO"}'],
        active: [0],
        variables: [["輸出", '{"Busna":"OAO"}']],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <string>
#include <vector>
#include <cctype>
#include <algorithm>
#include <stdexcept>
using namespace std;
int main() {
    string s, o;
    getline(cin, s);
    getline(cin, o);
    int n = s.size();
    vector<int> end(n, -1), stack;
    auto white = [](char c) { return isspace((unsigned char)c); };
    auto skip = [&](int p) {
        while (p < n && white(s[p]))
            ++p;
        return p;
    };
    for (int i = 0; i < n;) {
        if (white(s[i]) || s[i] == ',' || s[i] == ':') {
            ++i;
            continue;
        }
        if (s[i] == '"') {
            int j = i + 1;
            while (j < n && s[j] != '"')
                ++j;
            end[i] = j + 1;
            i = j + 1;
        } else if (s[i] == '[' || s[i] == '{') {
            stack.push_back(i++);
        } else if (s[i] == ']' || s[i] == '}') {
            end[stack.back()] = i + 1;
            stack.pop_back();
            ++i;
        } else {
            int j = i;
            while (j < n && !white(s[j]) && s[j] != ',' && s[j] != ']' && s[j] != '}')
                ++j;
            end[i] = j;
            i = j;
        }
    }
    int current = skip(0), p = 3;
    bool accessed = false;
    while (p < (int)o.size()) {
        if (white(o[p])) {
            ++p;
            continue;
        }
        if (o[p++] != '[')
            throw runtime_error("Invalid access");
        accessed = true;
        while (p < (int)o.size() && white(o[p]))
            ++p;
        if (o[p] == '"') {
            int begin = ++p;
            while (p < (int)o.size() && o[p] != '"')
                ++p;
            string key = o.substr(begin, p - begin);
            ++p;
            if (s[current] != '{')
                throw runtime_error("Invalid object access");
            int j = skip(current + 1);
            bool found = false;
            while (j < n && s[j] != '}') {
                int keyEnd = end[j];
                string actual = s.substr(j + 1, keyEnd - j - 2);
                j = skip(keyEnd);
                if (s[j++] != ':')
                    throw runtime_error("Invalid JSON");
                j = skip(j);
                if (actual == key) {
                    current = j;
                    found = true;
                    break;
                }
                j = skip(end[j]);
                if (s[j] == ',')
                    j = skip(j + 1);
                else
                    break;
            }
            if (!found)
                throw runtime_error("Unspecified missing key");
        } else {
            long long index = 0;
            bool digits = false;
            while (p < (int)o.size() && isdigit((unsigned char)o[p])) {
                digits = true;
                index = min(65526LL, index * 10 + o[p++] - '0');
            }
            if (!digits || s[current] != '[')
                throw runtime_error("Invalid array access");
            int j = skip(current + 1);
            while (index--) {
                if (j >= n || s[j] == ']')
                    throw runtime_error("Unspecified array index");
                j = skip(end[j]);
                if (s[j] != ',')
                    throw runtime_error("Unspecified array index");
                j = skip(j + 1);
            }
            if (j >= n || s[j] == ']')
                throw runtime_error("Unspecified array index");
            current = j;
        }
        while (p < (int)o.size() && white(o[p]))
            ++p;
        if (p == (int)o.size() || o[p++] != ']')
            throw runtime_error("Invalid access");
    }
    cout << (accessed ? s.substr(current, end[current] - current) : s) << '\n';
}`,
    python: String.raw`import sys


def main():
    s = sys.stdin.readline().rstrip('\r\n')
    query = sys.stdin.readline().rstrip('\r\n')
    n, end, stack, i = len(s), [-1] * len(s), [], 0

    def skip(p):
        while p < n and s[p].isspace():
            p += 1
        return p

    while i < n:
        ch = s[i]
        if ch.isspace() or ch in ',:':
            i += 1
        elif ch == '"':
            j = s.index('"', i + 1)
            end[i], i = j + 1, j + 1
        elif ch in '[{':
            stack.append(i)
            i += 1
        elif ch in ']}':
            end[stack.pop()] = i + 1
            i += 1
        else:
            j = i
            while j < n and not s[j].isspace() and s[j] not in ',]}':
                j += 1
            end[i], i = j, j
    current, p, accessed = skip(0), 3, False
    while p < len(query):
        if query[p].isspace():
            p += 1
            continue
        if query[p] != '[':
            raise ValueError('Invalid access')
        p += 1
        accessed = True
        while query[p].isspace():
            p += 1
        if query[p] == '"':
            finish = query.index('"', p + 1)
            key, p = query[p + 1 : finish], finish + 1
            if s[current] != '{':
                raise ValueError('Invalid object access')
            j, found = skip(current + 1), False
            while s[j] != '}':
                actual = s[j + 1 : end[j] - 1]
                j = skip(end[j])
                if s[j] != ':':
                    raise ValueError('Invalid JSON')
                j = skip(j + 1)
                if actual == key:
                    current, found = j, True
                    break
                j = skip(end[j])
                if s[j] != ',':
                    break
                j = skip(j + 1)
            if not found:
                raise ValueError('Unspecified missing key')
        else:
            begin = p
            while p < len(query) and query[p].isdigit():
                p += 1
            if begin == p or s[current] != '[':
                raise ValueError('Invalid array access')
            digits = query[begin:p].lstrip('0') or '0'
            index = int(digits) if len(digits) < 6 else n + 1
            j = skip(current + 1)
            for _ in range(index):
                if s[j] == ']':
                    raise ValueError('Unspecified array index')
                j = skip(end[j])
                if s[j] != ',':
                    raise ValueError('Unspecified array index')
                j = skip(j + 1)
            if s[j] == ']':
                raise ValueError('Unspecified array index')
            current = j
        while p < len(query) and query[p].isspace():
            p += 1
        if p == len(query) or query[p] != ']':
            raise ValueError('Invalid access')
        p += 1
    print(s[current : end[current]] if accessed else s)


if __name__ == '__main__':
    main()
`,
  }),
  defineToiPotentialLesson("a349", {
    topic: "graphs",
    level: "easy",
    concept: "有限棋盤的八方向 BFS",
    goal: "將騎士的日字移動視為等權邊，求最少步數或判定不可達。",
    explanation: [
      "每個合法棋盤格是一個節點，騎士能從它走到的八個落點就是鄰點，位移為 (±1,±2) 或 (±2,±1)。從起點做 BFS，第一次發現某格時就保存最少步數，因為 BFS 按距離逐層擴展，較長的路徑不會先發現它。",
      "落點必須同時滿足 0≤nx<x、0≤ny<y；中途跨過的格子不影響移動。把座標編成 ny×x+nx，用一維距離陣列與佇列，不需真的存八倍大的邊集合。起點就是終點時在第零層回傳 0；所有可達格處理完仍找不到終點就輸出 −1。",
    ],
    complexity:
      "時間 O(xy)，空間 O(xy)，棋盤小於 1000×1000；Python 使用固定寬度整數陣列保存距離。",
    pitfall:
      "窄棋盤可能不連通，不能套無限棋盤的距離公式。座標從左下角 0 開始，但 BFS 不需要翻轉 y 軸。",
    traceLabel: "8×8：從 (4,3) 到 (3,1)",
    trace: [
      {
        title: "第零層",
        description: "起點入隊，距離為 0。",
        cells: ["(4,3)", "(3,1)"],
        active: [0],
        variables: [["距離", "0"]],
      },
      {
        title: "產生合法落點",
        description: "位移 (−1,−2) 使騎士抵達 (3,1)，位於棋盤內。",
        cells: ["(4,3)", "位移(-1,-2)", "(3,1)"],
        active: [1, 2],
        variables: [["新距離", "1"]],
      },
      {
        title: "終點出隊",
        description: "最早抵達的 BFS 層數是 1，因此不必再搜尋。",
        cells: ["起點距離0", "終點距離1"],
        active: [1],
        variables: [["輸出", "1"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <queue>
using namespace std;
int main() {
    int x, y, sx, sy, ex, ey;
    cin >> x >> y >> sx >> sy >> ex >> ey;
    int start = sy * x + sx, goal = ey * x + ex;
    vector<int> d(x * y, -1);
    queue<int> q;
    q.push(start);
    d[start] = 0;
    int dx[] = {1, 1, -1, -1, 2, 2, -2, -2}, dy[] = {2, -2, 2, -2, 1, -1, 1, -1};
    while (!q.empty()) {
        int v = q.front();
        q.pop();
        if (v == goal) {
            cout << d[v] << '\n';
            return 0;
        }
        for (int k = 0; k < 8; k++) {
            int a = v % x + dx[k], b = v / x + dy[k];
            if (a < 0 || a >= x || b < 0 || b >= y)
                continue;
            int u = b * x + a;
            if (d[u] == -1) {
                d[u] = d[v] + 1;
                q.push(u);
            }
        }
    }
    cout << -1 << '\n';
}`,
    python: String.raw`import sys
from collections import deque
from array import array


def main():
    width, height, sx, sy, ex, ey = map(int, sys.stdin.buffer.read().split())
    start, goal = sy * width + sx, ey * width + ex
    distance = array('i', [-1]) * (width * height)
    distance[start] = 0
    queue = deque([start])
    moves = ((1, 2), (1, -2), (-1, 2), (-1, -2), (2, 1), (2, -1), (-2, 1), (-2, -1))
    while queue:
        v = queue.popleft()
        if v == goal:
            print(distance[v])
            return
        x, y = v % width, v // width
        for dx, dy in moves:
            a, b = x + dx, y + dy
            if 0 <= a < width and 0 <= b < height:
                u = b * width + a
                if distance[u] == -1:
                    distance[u] = distance[v] + 1
                    queue.append(u)
    print(-1)


if __name__ == '__main__':
    main()
`,
  }),
  defineToiPotentialLesson("a350", {
    topic: "geometry",
    level: "medium",
    concept: "稀疏差分事件與整數區間長度",
    goal: "紙條長達十億格時，只在著色端點處更新覆蓋次數。",
    explanation: [
      "一次著色 [X,Y] 對覆蓋次數的影響，在 X 加一、在 Y+1 減一。把全部 2N 個事件依座標排序，兩個相鄰事件座標 prev、pos 之間的所有格子，覆蓋次數都相同，因此只要看目前 count 是否至少 K，再決定是否把 pos−prev 加到答案。",
      "掃描時先結算 [prev,pos) 的長度，再把 pos 上的事件加進 count，保持 count 是上一段覆蓋次數的不變量。同座標有多個事件時可逐一更新，因為中間段長為零，不會重複計數。最後一個事件之後覆蓋為零，K≥1，不需補算到 M。這是整數格 [X,Y] 轉成半開座標 [X,Y+1) 的精確計數，不用枚舉十億格。",
    ],
    complexity:
      "時間 O(N log N)，空間 O(N)；N≤10^5。座標 Y+1 可能等於 M+1，答案最大 M≤10^9。",
    pitfall:
      "右端點必須在 Y+1 才扣一，否則單格區間會完全消失；達到 K 次就破損，判斷是 ≥K。",
    traceLabel: "範例 [3,3]、[6,9]、[7,10]，K=2",
    trace: [
      {
        title: "單格著色",
        description: "3 加一、4 減一，格子 3 只被畫一次。",
        cells: ["[3,4):1", "[4,6):0"],
        active: [0],
        variables: [["破損數", "0"]],
      },
      {
        title: "抵達座標 7",
        description: "[6,7) 覆蓋一次；7 開始第二條長區間，覆蓋變成 2。",
        cells: ["[6,7):1", "[7,10):2"],
        active: [1],
        variables: [["count", "2"]],
      },
      {
        title: "抵達座標 10",
        description: "[7,10) 長度為 3，對應格子 7、8、9。之後覆蓋降為 1。",
        cells: ["7", "8", "9", "10"],
        active: [0, 1, 2],
        variables: [["答案", "3"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <utility>
#include <algorithm>
using namespace std;
int main() {
    int m, n, k;
    cin >> m >> n >> k;
    vector<pair<int, int>> events;
    for (int i = 0, x, y; i < n; i++) {
        cin >> x >> y;
        events.push_back({x, 1});
        events.push_back({y + 1, -1});
    }
    sort(events.begin(), events.end());
    long long answer = 0;
    int previous = 1, count = 0;
    for (auto [pos, delta] : events) {
        if (count >= k)
            answer += pos - previous;
        count += delta;
        previous = pos;
    }
    cout << answer << '\n';
}`,
    python: String.raw`import sys

read = sys.stdin.buffer.readline
length, n, threshold = map(int, read().split())
events = []
for _ in range(n):
    left, right = map(int, read().split())
    events.append((left, 1))
    events.append((right + 1, -1))
events.sort()
answer, previous, count = 0, 1, 0
for position, delta in events:
    if count >= threshold:
        answer += position - previous
    count += delta
    previous = position
print(answer)
`,
  }),
  defineToiPotentialLesson("a351", {
    topic: "search",
    level: "hard",
    concept: "第 K 大區間和的答案二分與雙指標計數",
    goal: "不列出平方數量的區間，以非負損失的單調性求第 K 大值。",
    explanation: [
      "對候選損失 X，計算有多少個非空區間總和至少 X。固定右端點 r，因 d_i≥0，從左邊逐格刪除時總和只會不增。維持視窗和 total，當 total≥X 就刪除最左項並前進 left；停止後，起點 0..left−1 都能形成和至少 X 的區間，共 left 個。left 隨右端點只往右走，因此一次計數是 O(N)。",
      "若計數至少 K，表示第 K 大區間和≥X；反之第 K 大值<X。此條件對 X 單調，用上中位數二分最大的可行 X，範圍是 [0,sum(d)]。同和的不同區間各計一次，自動保留重複名次。X=0 時全部非空區間都合法，while 仍需限制 left≤r，避免空視窗繼續前進；計數一旦達 K 就可提早回傳。",
    ],
    complexity:
      "時間 O(N log(S+1))，空間 O(N)，S=sum(d)≤5×10^14，最多約 49 次線性計數。K 可達 125000250000，C++ 和與計數都使用 long long。",
    pitfall:
      "非負條件是雙指標成立的關鍵，不能套到有負數的數列。不要去重區間和，也不要把 K 存為 int。",
    traceLabel: "範例 d=[1,2,4]、K=2",
    trace: [
      {
        title: "檢查 X=4",
        description: "至少 4 的區間為 [4]、[2,4]、[1,2,4]，共三個。",
        cells: ["4", "6", "7"],
        active: [0, 1, 2],
        variables: [
          ["count", "3≥2"],
          ["可行", "是"],
        ],
      },
      {
        title: "檢查 X=6",
        description: "只剩總和 6、7 的兩個區間。",
        cells: ["6", "7"],
        active: [0, 1],
        variables: [
          ["count", "2≥2"],
          ["可行", "是"],
        ],
      },
      {
        title: "檢查 X=7",
        description: "只有整段總和 7，數量不足 K，最大可行值為 6。",
        cells: ["7"],
        active: [0],
        variables: [
          ["count", "1<2"],
          ["答案", "6"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <numeric>
using namespace std;
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    long long k;
    cin >> n >> k;
    vector<long long> a(n);
    long long high = 0;
    for (auto &x : a) {
        cin >> x;
        high += x;
    }
    auto enough = [&](long long target) {
        long long total = 0, count = 0;
        int left = 0;
        for (int r = 0; r < n; r++) {
            total += a[r];
            while (left <= r && total >= target)
                total -= a[left++];
            count += left;
            if (count >= k)
                return true;
        }
        return false;
    };
    long long low = 0;
    while (low < high) {
        long long mid = low + (high - low + 1) / 2;
        if (enough(mid))
            low = mid;
        else
            high = mid - 1;
    }
    cout << low << '\n';
}`,
    python: String.raw`import sys


def main():
    read = sys.stdin.buffer.readline
    n, k = map(int, read().split())
    values = list(map(int, sys.stdin.buffer.read().split()))

    def enough(target):
        total = count = left = 0
        for right, value in enumerate(values):
            total += value
            while left <= right and total >= target:
                total -= values[left]
                left += 1
            count += left
            if count >= k:
                return True
        return False

    lo, hi = 0, sum(values)
    while lo < hi:
        mid = (lo + hi + 1) // 2
        if enough(mid):
            lo = mid
        else:
            hi = mid - 1
    print(lo)


if __name__ == '__main__':
    main()
`,
  }),
  defineToiPotentialLesson("a352", {
    topic: "foundations",
    level: "medium",
    concept: "有界時間差分與同時上課數",
    goal: "面對千萬門課程，以固定時間軸求包含原有教室的最少總數。",
    explanation: [
      "課程 [S,E) 在 S 開始使用一間教室、在 E 釋放。同一時間下課即可接著上課，所以結束端必須排除。用 delta[S]++、delta[E]--，掃描時間時累加，就得到每個時間點同時上課的門數。輸入可達 10^7 門，但時間上界同樣只有 10^7−1，直接做差分比儲存全部區間後排序更適合。",
      "任何時刻同時進行 c 門課都至少需要 c 間教室，因此最大同時數是下界；按開始時間安排課程，若當下有空教室就重用，否則新增，每次新增都代表同時數創新高，所以此下界可達。系上原本已有一間教室，N=0 時仍有一間，答案為 max(1,最大同時數)。程式只掃到讀到的最大結束時間。",
    ],
    complexity:
      "設 U=10^7，時間 O(N+U)，空間 O(U)。C++ int 與 Python array('i') 各約 40 MB 儲存差分；逐行讀入避免把千萬行同時留在記憶體。",
    pitfall:
      "要求總教室數，不是增建數。空課表應輸出 1，首尾相接的課程不重疊；Python 不可使用千萬個獨立整數物件的差分更新方式。",
    traceLabel: "小例 [0,2)、[1,3)、[2,4)",
    trace: [
      {
        title: "時間 0",
        description: "第一門開始，使用一間。",
        cells: ["t0:+1", "t1:+1", "t2:0", "t3:-1", "t4:-1"],
        active: [0],
        variables: [
          ["同時數", "1"],
          ["最大值", "1"],
        ],
      },
      {
        title: "時間 1",
        description: "第二門開始，兩門同時上課。",
        cells: ["第一門", "第二門", "第三門未開始"],
        active: [0, 1],
        variables: [
          ["同時數", "2"],
          ["最大值", "2"],
        ],
      },
      {
        title: "時間 2",
        description: "第一門結束、第三門開始，delta[2]=0，教室可直接重用。",
        cells: ["第一門結束", "第二門", "第三門"],
        active: [1, 2],
        variables: [
          ["同時數", "2"],
          ["答案", "2"],
        ],
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
    const int U = 10000000;
    vector<int> delta(U);
    int last = 0;
    for (int i = 0, s, e; i < n; i++) {
        cin >> s >> e;
        ++delta[s];
        --delta[e];
        last = max(last, e);
    }
    int current = 0, answer = 1;
    for (int t = 0; t <= last; t++) {
        current += delta[t];
        answer = max(answer, current);
    }
    cout << answer << '\n';
}`,
    python: String.raw`import sys
from array import array


def main():
    read = sys.stdin.buffer.readline
    n = int(read())
    delta = array('i', [0]) * 10000000
    last = 0
    for _ in range(n):
        start, end = map(int, read().split())
        delta[start] += 1
        delta[end] -= 1
        if end > last:
            last = end
    current, answer = 0, 1
    for time in range(last + 1):
        current += delta[time]
        if current > answer:
            answer = current
    print(answer)


if __name__ == '__main__':
    main()
`,
  }),
];
