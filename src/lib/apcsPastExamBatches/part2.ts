import { definePastExamLesson } from "@/lib/apcsPastExamLessonBuilder";

export const lessonsPart2 = [
  definePastExamLesson("a375", {
    concept: "狀態模擬・方向與模數",
    goal: "依序更新分數、寶石、方向與位置，統計實際取走的顆數。",
    explanation: [
      "以右、下、左、上編成 0、1、2、3，右轉就是 (d+1)%4。每回合先檢查目前格是否為 0，再把取走前的寶石數加到分數，格子減 1，取走顆數加 1；三個量的意義不同。",
      "判斷轉向只用到分數是否為 k 的倍數，因此保存 scoreMod=(scoreMod+目前寶石數)%k 即可。完成倍數轉向後，才檢查前方的邊界與牆，必要時繼續右轉，最後前進。這個順序逐步對應題目，因此每次迭代後的狀態都與實際機器人一致。",
      "每回合消耗一顆寶石，所以若每次都能找到可通行的鄰格，至多消耗初始寶石總量 G 後遇到 0。規格未說明四周皆為牆或邊界的正值起點：該情形的『持續右轉直到可進入』不會結束。以下程式偵測四次轉向仍無出口時結束並回報已撿顆數，這是防止無窮迴圈的防護，並非題目有定義的額外答案。",
    ],
    complexity:
      "時間 O(MN + G)，G 為初始寶石總量；空間 O(MN)。單格上限未提供，不能只以地圖大小估計模擬次數。",
    pitfall:
      "分數加上的是減少前的整格寶石數，輸出卻是取走顆數；孤立正值起點的停止規則未定義。C++ 假設單格數量與總顆數可用 64 位元表示。",
    traceLabel: "公開範例 1：一列地圖，k=3，從欄 4 朝右",
    trace: [
      {
        title: "第一次撿取",
        description: "欄 4 原有 2 顆，分數變 2，留下 1 顆，向右到欄 5。",
        cells: ["1", "牆", "2", "1", "1", "1", "0"],
        active: [4, 5],
        variables: [
          ["分數餘數", "2"],
          ["顆數", "1"],
        ],
      },
      {
        title: "倍數轉向再避障",
        description: "欄 5 加 1 後分數為 3，先朝下，再因越界朝左，移到欄 4。",
        cells: ["1", "牆", "2", "1", "1", "0", "0"],
        active: [4, 5],
        variables: [
          ["方向", "右 → 下 → 左"],
          ["顆數", "2"],
        ],
      },
      {
        title: "沿左側前進",
        description: "欄 4 與欄 3 各取一顆，分數依序為 4、5，抵達欄 2。",
        cells: ["1", "牆", "2", "0", "0", "0", "0"],
        active: [2, 3, 4],
        variables: [
          ["分數餘數", "2"],
          ["顆數", "4"],
        ],
      },
      {
        title: "第五顆後停止",
        description: "欄 2 加 2，分數變 7；左方為牆，轉到右方欄 3，該格為 0。",
        cells: ["1", "牆", "1", "0", "0", "0", "0"],
        active: [2, 3],
        variables: [
          ["分數", "7"],
          ["輸出", "5"],
        ],
      },
    ],
    cpp: String.raw`#include <bits/stdc++.h>
using namespace std;
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int m, n, k, r, c;
    cin >> m >> n >> k >> r >> c;
    vector<vector<long long>> a(m, vector<long long>(n));
    for (auto &row : a)
        for (auto &v : row)
            cin >> v;
    int dr[] = {0, 1, 0, -1}, dc[] = {1, 0, -1, 0};
    int d = 0, rem = 0;
    long long count = 0;
    while (a[r][c] > 0) {
        rem = (rem + a[r][c] % k) % k;
        --a[r][c];
        ++count;
        if (rem == 0)
            d = (d + 1) % 4;
        int turns = 0;
        while (turns < 4) {
            int nr = r + dr[d], nc = c + dc[d];
            if (nr >= 0 && nr < m && nc >= 0 && nc < n && a[nr][nc] != -1)
                break;
            d = (d + 1) % 4;
            ++turns;
        }
        if (turns == 4)
            break; // Specification has no move for an isolated cell.
        r += dr[d];
        c += dc[d];
    }
    cout << count << '\n';
}`,
    python: String.raw`import sys
data = iter(map(int, sys.stdin.buffer.read().split()))
m, n, k, r, c = (next(data) for _ in range(5))
a = [[next(data) for _ in range(n)] for _ in range(m)]
dr, dc = (0, 1, 0, -1), (1, 0, -1, 0)
d = rem = count = 0
while a[r][c] > 0:
    rem = (rem + a[r][c]) % k
    a[r][c] -= 1
    count += 1
    if rem == 0:
        d = (d + 1) % 4
    for _ in range(4):
        nr, nc = r + dr[d], c + dc[d]
        if 0 <= nr < m and 0 <= nc < n and a[nr][nc] != -1:
            break
        d = (d + 1) % 4
    else:
        break  # Isolated cell: the statement defines no next move.
    r, c = nr, nc
print(count)
`,
  }),
  definePastExamLesson("a376", {
    concept: "分段體積函數・容量截斷",
    goal: "把累積飲料體積轉成高度，取相鄰兩次高度差的最大值。",
    explanation: [
      "下層底面積為 A1=w1²，容量 C1=A1×h1；上層面積為 A2=w2²。總體積 V 不超過 C1 時高度為 V/A1，超過時為 h1+(V-C1)/A2。先把 V 截斷在總容量，便同時處理滿杯與溢出。",
      "每倒入一份，只須計算新高度減舊高度，再更新最大值。體積到高度的函數精確描述兩個相通方柱，所以兩次函數值的差就是該次水位上升量。題目保證每次上升為整數，從空杯開始便保證所有倒入後的高度為整數，可以用整數除法。",
      "倒入體積未另給上限，但超過整杯容量的部分不影響任何後續水位。因此讀取每份體積的十進位數字時，就將數值飽和至總容量，避免 C++ 整數溢位，也避免 Python 對超長十進位整數的轉換限制。",
    ],
    complexity:
      "以一般整數輸入模型計為 O(n) 時間；若計入體積字串總長 D，時間 O(n+D)。C++ 額外空間為最長單筆體積字串長度，Python 整批讀入用 O(n+D) 空間。",
    pitfall:
      "倒入體積不可全部除以下層面積；跨越接縫時兩段面積不同，滿杯後的上升量為 0。",
    traceLabel: "公開範例 2：下層 5×5×12，上層 10×10×8",
    trace: [
      {
        title: "計算兩段容量",
        description: "下層容量 25×12=300，上層容量 100×8=800。",
        cells: ["下層 300", "上層 800", "總容量 1100"],
        variables: [
          ["體積", "0"],
          ["高度", "0"],
        ],
      },
      {
        title: "倒入 400",
        description: "300 填滿下層，剩下 100 使上層升 1，高度為 13。",
        cells: ["下層滿：12", "上層：1", "高度 13"],
        active: [0, 1, 2],
        variables: [
          ["上升", "13"],
          ["最大值", "13"],
        ],
      },
      {
        title: "再倒入 600",
        description: "累積體積 1000，高度 12+700/100=19，這次只升 6。",
        cells: ["下層滿：12", "上層：7", "高度 19"],
        active: [1, 2],
        variables: [
          ["上升", "6"],
          ["輸出", "13"],
        ],
      },
    ],
    cpp: String.raw`#include <bits/stdc++.h>
using namespace std;
int main() {
    int n;
    long long w1, w2, h1, h2;
    cin >> n >> w1 >> w2 >> h1 >> h2;
    long long a = w1 * w1, b = w2 * w2, low = a * h1, cap = low + b * h2;
    long long volume = 0, height = 0, answer = 0;
    while (n--) {
        string token;
        cin >> token;
        long long poured = 0;
        for (char digit : token) poured = min(cap, poured * 10 + digit - '0');
        volume += min(poured, cap - volume);
        long long now = volume <= low ? volume / a : h1 + (volume - low) / b;
        answer = max(answer, now - height);
        height = now;
    }
    cout << answer << '\n';
}`,
    python: String.raw`import sys
it = iter(sys.stdin.buffer.read().split())
n, w1, w2, h1, h2 = (int(next(it)) for _ in range(5))
a, b = w1*w1, w2*w2
low = a*h1
cap = low+b*h2
volume = height = answer = 0
for _ in range(n):
    poured = 0
    for digit in next(it):
        poured = min(cap, poured*10+digit-48)
    volume = min(cap, volume+poured)
    now = volume//a if volume <= low else h1+(volume-low)//b
    answer = max(answer, now-height)
    height = now
print(answer)
`,
  }),
  definePastExamLesson("a377", {
    concept: "前綴和・奇偶差分桶・二分搜尋",
    goal: "把兩端選取改寫成留下一個中段，在平衡條件下找最小可保留總和。",
    explanation: [
      "取走左邊 i 個與右邊 N-t 個，必須有 i≤t。令 P[t] 為前 t 個的總和，B[t] 為其中奇數個數減偶數個數。取走的總和為 P[i]+P[N]-P[t]，奇偶相等則等價於 B[t]=B[N]+B[i]。空集合也包含在 i=0、t=N 的選法中。",
      "將每個 P[t] 放進鍵值 B[t] 的桶。所有數字為正，所以各桶內的 P[t] 嚴格遞增。固定 i 後，要同時滿足 t≥i 與取走總和≤K，等價於 P[t]≥max(P[i],P[i]+P[N]-K)。在所需差值的桶中二分搜尋第一個達到門檻的前綴和。",
      "固定 i 時，取走的總和隨 P[t] 增加而減少，因此第一個合法 P[t] 正是該 i 的最佳選擇。列舉全部 i 就涵蓋所有不重疊的前綴、後綴組合。桶數最多 4001，搜尋不到所需差值或門檻時跳過即可。",
    ],
    complexity:
      "時間 O(N log N)，空間 O(N)。不用 O(NK) 背包，也不枚舉所有左右端點對。",
    pitfall:
      "奇偶差的目標是 B[N]+B[i]；只要求總和門檻卻漏掉 t≥i，會重複取走重疊位置。",
    traceLabel: "公開範例 1：P[N]=35、B[N]=2、K=22",
    trace: [
      {
        title: "建立前綴資料",
        description: "前四項 1,5,2,2 的前綴和是 10，奇偶差為 0。",
        cells: ["P:0,1,6,8,10,19,22,27,35", "B:0,1,2,1,0,1,2,3,2"],
        variables: [
          ["總和", "35"],
          ["總奇偶差", "2"],
        ],
      },
      {
        title: "固定左邊四項",
        description: "i=4，需要 B[t]=2，門檻是 max(10,10+35-22)=23。",
        cells: ["i=4", "差值 2 的桶：6,22,35", "門檻 23"],
        active: [1, 2],
        variables: [
          ["選到 P[t]", "35"],
          ["候選總和", "10"],
        ],
      },
      {
        title: "改選左邊兩項",
        description: "i=2 時需要差值 4，沒有該桶，因此不可能從右端補出平衡。",
        cells: ["左取 1,5", "B[i]=2", "目標 B[t]=4"],
        active: [2],
        variables: [["候選", "不存在"]],
      },
      {
        title: "找到最大值",
        description:
          "i=3 時目標差值 3、門檻 21，桶內選到 P[7]=27。取左端 1,5,2 與右端 8，共兩奇兩偶。",
        cells: ["左：1,5,2", "保留：2,9,3,5", "右：8"],
        active: [0, 2],
        variables: [
          ["候選總和", "8+35-27=16"],
          ["全域最佳", "16"],
        ],
      },
    ],
    cpp: String.raw`#include <bits/stdc++.h>
using namespace std;
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    long long k;
    cin >> n >> k;
    vector<long long> p(n + 1);
    vector<int> b(n + 1);
    map<int, vector<long long>> buckets;
    buckets[0].push_back(0);
    for (int i = 1; i <= n; i++) {
        long long x;
        cin >> x;
        p[i] = p[i - 1] + x;
        b[i] = b[i - 1] + (x % 2 ? 1 : -1);
        buckets[b[i]].push_back(p[i]);
    }
    long long ans = 0;
    for (int i = 0; i <= n; i++) {
        auto found = buckets.find(b[n] + b[i]);
        if (found == buckets.end())
            continue;
        auto &v = found->second;
        long long need = max(p[i], p[i] + p[n] - k);
        auto pos = lower_bound(v.begin(), v.end(), need);
        if (pos != v.end())
            ans = max(ans, p[i] + p[n] - *pos);
    }
    cout << ans << '\n';
}`,
    python: String.raw`import sys
from bisect import bisect_left
from collections import defaultdict
it = iter(map(int, sys.stdin.buffer.read().split()))
n, k = next(it), next(it)
p, b = [0]*(n+1), [0]*(n+1)
buckets = defaultdict(list)
buckets[0].append(0)
for i in range(1, n+1):
    x = next(it)
    p[i] = p[i-1]+x
    b[i] = b[i-1]+(1 if x % 2 else -1)
    buckets[b[i]].append(p[i])
answer = 0
for i in range(n+1):
    values = buckets.get(b[n]+b[i])
    if values is None:
        continue
    need = max(p[i], p[i]+p[n]-k)
    j = bisect_left(values, need)
    if j < len(values):
        answer = max(answer, p[i]+p[n]-values[j])
print(answer)
`,
  }),
  definePastExamLesson("a378", {
    concept: "曼哈頓距離・小範圍直接累加",
    goal: "用距離條件逐格判斷每次染色的菱形範圍。",
    explanation: [
      "從中心 (r,c) 到 (i,j) 的上下左右最短距離為 |i-r|+|j-c|。因此一次操作只要掃過畫布內各格，對距離≤t 的格子加上 x，不需要模擬顏色隨時間擴散的每一秒。",
      "最多 20×20 格、100 次操作，直接檢查最多 40000 次即可。每次只對符合該操作條件的格子累加一次，歸納可知處理完前 s 次操作後，每格恰為前 s 次涵蓋它的顏色值總和；最後就是所求畫布。",
    ],
    complexity: "時間 O(NHW)，空間 O(HW)；Python 一次讀入另需 O(N) 空間。",
    pitfall: "重疊是相加而不是覆蓋；距離等於 t 的邊界也要染色，t=0 只改中心。",
    traceLabel: "示意：3×3 畫布，先 (1,1,1,2)，再 (0,0,1,3)",
    trace: [
      {
        title: "全零畫布",
        description: "兩個操作都尚未執行。",
        cells: ["0 0 0", "0 0 0", "0 0 0"],
        variables: [["操作數", "0"]],
      },
      {
        title: "中心十字加 2",
        description: "距 (1,1) 不超過 1 的五格各加 2，角落距離為 2。",
        cells: ["0 2 0", "2 2 2", "0 2 0"],
        active: [0, 1, 2],
        variables: [
          ["中心", "(1,1)"],
          ["半徑", "1"],
        ],
      },
      {
        title: "左上角再加 3",
        description: "(0,0)、(0,1)、(1,0) 加 3，後兩格由 2 變 5。",
        cells: ["3 5 0", "5 2 2", "0 2 0"],
        active: [0, 1],
        variables: [["重疊格", "2+3=5"]],
      },
    ],
    cpp: String.raw`#include <bits/stdc++.h>
using namespace std;
int main() {
    int h, w, n;
    cin >> h >> w >> n;
    vector<vector<int>> a(h, vector<int>(w));
    while (n--) {
        int r, c, t, x;
        cin >> r >> c >> t >> x;
        for (int i = 0; i < h; i++)
            for (int j = 0; j < w; j++)
                if (abs(i - r) + abs(j - c) <= t)
                    a[i][j] += x;
    }
    for (auto &row : a) {
        for (int j = 0; j < w; j++)
            cout << (j ? " " : "") << row[j];
        cout << '\n';
    }
}`,
    python: String.raw`import sys
it = iter(map(int, sys.stdin.buffer.read().split()))
h, w, n = next(it), next(it), next(it)
a = [[0]*w for _ in range(h)]
for _ in range(n):
    r, c, t, x = (next(it) for _ in range(4))
    for i in range(h):
        for j in range(w):
            if abs(i-r)+abs(j-c) <= t:
                a[i][j] += x
print('\n'.join(' '.join(map(str, row)) for row in a))
`,
  }),
  definePastExamLesson("a380", {
    concept: "拓樸排序・邏輯值與最長延遲同步傳遞",
    goal: "等所有前置訊號完成後計算閘值，並累計通往輸出的最大閘數。",
    explanation: [
      "電路雖然無環，編號卻不保證就是計算順序。建立每點的出邊與入度，用佇列從輸入端開始處理。AND 的累積值初始為 1，OR、XOR 初始為 0；每條入邊送來一個位元後更新累積值，NOT 則反轉唯一輸入。入度降到 0 才表示可以送出訊號。",
      "同時記錄 delay[v]。從 u 傳到 v 時，若 v 是閘，候選延遲為 delay[u]+1；若 v 是輸出端則不加 1，並取各前驅候選的最大值。拓樸處理確保計算 v 前所有來源都已完成，所以邏輯值與最長路徑都正確。最後僅在輸出端取最大延遲，依輸出編號列出值。",
    ],
    complexity: "時間與空間皆 O(p+q+r+m)，每條連線只處理一次。",
    pitfall: "NOT 只有一個輸入；輸出端與導線不增加延遲。不可直接按閘編號計算。",
    traceLabel: "公開範例 1：輸入為 1,0,1,0",
    trace: [
      {
        title: "輸入訊號就緒",
        description: "四個輸入端延遲均為 0。",
        cells: ["1:1", "2:0", "3:1", "4:0"],
        variables: [["輸入延遲", "0"]],
      },
      {
        title: "第一層閘",
        description: "5=1 AND 0=0；6=0 OR 1=1；7=1 XOR 0=1；8=NOT 0=1。",
        cells: ["5:0", "6:1", "7:1", "8:1"],
        active: [0, 1, 2, 3],
        variables: [["延遲", "1"]],
      },
      {
        title: "第二層 AND",
        description: "9 接收 6 與 7，兩者均為 1，所以輸出 1，延遲為 2。",
        cells: ["6:1", "7:1", "9:1"],
        active: [2],
        variables: [["delay[9]", "max(1,1)+1=2"]],
      },
      {
        title: "回報端口",
        description:
          "10、11、12、13 分別由 5、6、9、8 接入，輸出值為 0 1 1 1。",
        cells: ["10:0 / 1", "11:1 / 1", "12:1 / 2", "13:1 / 1"],
        active: [2],
        variables: [["最大延遲", "2"]],
      },
    ],
    cpp: String.raw`#include <bits/stdc++.h>
using namespace std;
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int p, q, r, m;
    cin >> p >> q >> r >> m;
    int n = p + q + r;
    vector<int> value(n + 1), type(n + 1), degree(n + 1), delay(n + 1);
    vector<vector<int>> edges(n + 1);
    for (int i = 1; i <= p; i++)
        cin >> value[i];
    for (int i = p + 1; i <= p + q; i++) {
        cin >> type[i];
        value[i] = (type[i] == 1);
    }
    while (m--) {
        int u, v;
        cin >> u >> v;
        edges[u].push_back(v);
        ++degree[v];
    }
    queue<int> ready;
    for (int i = 1; i <= p; i++)
        ready.push(i);
    while (!ready.empty()) {
        int u = ready.front();
        ready.pop();
        for (int v : edges[u]) {
            if (type[v] == 1)
                value[v] &= value[u];
            else if (type[v] == 2)
                value[v] |= value[u];
            else if (type[v] == 3)
                value[v] ^= value[u];
            else if (type[v] == 4)
                value[v] = 1 - value[u];
            else
                value[v] = value[u];
            delay[v] = max(delay[v], delay[u] + (v <= p + q));
            if (--degree[v] == 0)
                ready.push(v);
        }
    }
    cout << *max_element(delay.begin() + p + q + 1, delay.end()) << '\n';
    for (int i = p + q + 1; i <= n; i++)
        cout << (i == p + q + 1 ? "" : " ") << value[i];
    cout << '\n';
}`,
    python: String.raw`import sys
from collections import deque
it = iter(map(int, sys.stdin.buffer.read().split()))
p, q, r, m = (next(it) for _ in range(4))
n = p+q+r
value, kind, degree, delay = ([0]*(n+1) for _ in range(4))
edges = [[] for _ in range(n+1)]
for i in range(1, p+1):
    value[i] = next(it)
for i in range(p+1, p+q+1):
    kind[i] = next(it)
    value[i] = int(kind[i] == 1)
for _ in range(m):
    u, v = next(it), next(it)
    edges[u].append(v)
    degree[v] += 1
ready = deque(range(1, p+1))
while ready:
    u = ready.popleft()
    for v in edges[u]:
        t = kind[v]
        if t == 1:
            value[v] &= value[u]
        elif t == 2:
            value[v] |= value[u]
        elif t == 3:
            value[v] ^= value[u]
        elif t == 4:
            value[v] = 1-value[u]
        else:
            value[v] = value[u]
        delay[v] = max(delay[v], delay[u]+int(v <= p+q))
        degree[v] -= 1
        if degree[v] == 0:
            ready.append(v)
print(max(delay[p+q+1:]))
print(*value[p+q+1:])
`,
  }),
  definePastExamLesson("a381", {
    concept: "蜂巢座標・越界停留",
    goal: "依站上明定的六個座標向量行走，記錄每步完成後的字元。",
    explanation: [
      "本站已直接給出六方向的座標差，不必再依奇偶列改變位移：依序為 (-1,0)、(0,1)、(1,1)、(1,0)、(0,-1)、(-1,-1)。起點是 (m-1,0)，也就是輸入的最後一列第一格。",
      "每步先算候選座標，合法才更新位置，否則保留原位；接著一定記錄當前字元。如此每一方向恰好產生一個字元，含越界停留，卻不多記初始位置。把記錄字元放入集合，即可在大小寫分開的前提下統計種類。",
    ],
    complexity: "時間 O(mn+k)，空間 O(mn+k)，字元集合最多 52 種。",
    pitfall: "不要套用其他蜂巢題的奇偶列位移；越界步仍記錄一字元，起點不先記。",
    traceLabel: "公開範例 1：從 ABaB 的 A 出發",
    trace: [
      {
        title: "方向 0、1",
        description: "(1,0) 右上到 (0,0) 記 T，再向右到 (0,1) 記 y。",
        cells: ["TyuI", "ABaB", "記錄 Ty"],
        active: [0, 2],
        variables: [
          ["座標", "(0,1)"],
          ["種類", "2"],
        ],
      },
      {
        title: "方向 2",
        description: "右下向量為 (1,1)，到 (1,2) 記小寫 a。",
        cells: ["TyuI", "ABaB", "記錄 Tya"],
        active: [1, 2],
        variables: [
          ["座標", "(1,2)"],
          ["種類", "3"],
        ],
      },
      {
        title: "方向 3 越界",
        description: "嘗試 (2,2) 超出兩列，原地再記一次 a。",
        cells: ["TyuI", "ABaB", "記錄 Tyaa"],
        active: [1, 2],
        variables: [
          ["座標", "仍為 (1,2)"],
          ["種類", "3"],
        ],
      },
      {
        title: "最後方向 0",
        description: "右上到 (0,2) 記 u，得到 Tyaau，共 4 種。",
        cells: ["TyuI", "ABaB", "記錄 Tyaau"],
        active: [0, 2],
        variables: [["輸出種類", "4"]],
      },
    ],
    cpp: String.raw`#include <bits/stdc++.h>
using namespace std;
int main() {
    int m, n, k;
    cin >> m >> n >> k;
    vector<string> grid(m);
    for (auto &row : grid)
        cin >> row;
    int dr[] = {-1, 0, 1, 1, 0, -1};
    int dc[] = {0, 1, 1, 0, -1, -1};
    int r = m - 1, c = 0;
    string path;
    set<char> seen;
    for (int i = 0; i < k; ++i) {
        int d;
        cin >> d;
        int nr = r + dr[d], nc = c + dc[d];
        if (0 <= nr && nr < m && 0 <= nc && nc < n) {
            r = nr;
            c = nc;
        }
        path += grid[r][c];
        seen.insert(grid[r][c]);
    }
    cout << path << '\n' << seen.size() << '\n';
}`,
    python: String.raw`import sys
it = iter(sys.stdin.buffer.read().split())
m, n, k = (int(next(it)) for _ in range(3))
grid = [next(it).decode() for _ in range(m)]
dr = (-1, 0, 1, 1, 0, -1)
dc = (0, 1, 1, 0, -1, -1)
r, c = m-1, 0
path = []
for _ in range(k):
    d = int(next(it))
    nr, nc = r+dr[d], c+dc[d]
    if 0 <= nr < m and 0 <= nc < n:
        r, c = nr, nc
    path.append(grid[r][c])
print(''.join(path))
print(len(set(path)))
`,
  }),
  definePastExamLesson("a382", {
    concept: "排序・保留原始資料",
    goal: "以平方和排名角色，再輸出第二名的原始攻防數值。",
    explanation: [
      "每個角色的比較鍵是 a²+d²，不是 a+d，也不需開根號。把這個鍵與原本的 a、d 一起存成紀錄，依鍵由大到小排序後，索引 1 就是第二高者。",
      "題目保證能力值互異，所以不用處理並列名次。排序使前面的角色能力嚴格較高，因此第二筆恰有一個角色比它強；輸出其 a、d 而非平方和即可。n≤20，直接排序足夠且容易查核。",
    ],
    complexity: "時間 O(n log n)，空間 O(n)。",
    pitfall: "必須輸出原始攻防；平方和與攻防總和的排序可能不同。",
    traceLabel: "公開範例 1：三個角色",
    trace: [
      {
        title: "建立排序鍵",
        description: "三筆能力依序為 3²+1²=10、5²+2²=29、1²+4²=17。",
        cells: ["(3,1):10", "(5,2):29", "(1,4):17"],
        variables: [["角色數", "3"]],
      },
      {
        title: "由大到小排列",
        description: "29 最大，17 第二，10 第三。",
        cells: ["(5,2):29", "(1,4):17", "(3,1):10"],
        active: [1],
        variables: [["第二高能力", "17"]],
      },
      {
        title: "取出原始欄位",
        description: "第二名的攻擊是 1、防禦是 4，輸出 1 4。",
        cells: ["攻擊 1", "防禦 4"],
        active: [0, 1],
        variables: [["輸出", "1 4"]],
      },
    ],
    cpp: String.raw`#include <bits/stdc++.h>
using namespace std;
struct Hero {
    int power, attack, defense;
};
int main() {
    int n;
    cin >> n;
    vector<Hero> heroes(n);
    for (auto &hero : heroes) {
        cin >> hero.attack >> hero.defense;
        hero.power = hero.attack * hero.attack + hero.defense * hero.defense;
    }
    sort(heroes.begin(), heroes.end(),
         [](const Hero &a, const Hero &b) { return a.power > b.power; });
    cout << heroes[1].attack << ' ' << heroes[1].defense << '\n';
}`,
    python: String.raw`import sys
it = iter(map(int, sys.stdin.buffer.read().split()))
n = next(it)
heroes = []
for _ in range(n):
    a, d = next(it), next(it)
    heroes.append((a*a+d*d, a, d))
heroes.sort(reverse=True)
print(heroes[1][1], heroes[1][2])
`,
  }),
  definePastExamLesson("a383", {
    concept: "動態規劃・可跳過 k 天的最大連續和",
    goal: "保留一個連續投資期間，以金牌跳過期間內的負收益日。",
    explanation: [
      "令 dp[j] 為已處理到前一天、投資期間延伸至該天、最多用 j 張金牌的最佳收益，允許空收益 0。今天收益為 x 時，可以領取：max(0,dp[j]+x)；若 j>0，也能跳過今天，從舊 dp[j-1] 轉移。每個 j 取這些選項的最大值。",
      "從 j=k 向下更新，才能保證 dp[j-1] 仍是昨天的值，避免同一天消耗多次金牌。遇到收益太差時可歸零，代表捨棄舊期間、之後重新開始；正值則只能由昨天延伸，或用一張金牌跨過今天，因此不會免費連接兩段投資。所有日期與 j 的最大值，加上不投資的 0，就是答案。",
    ],
    complexity:
      "時間 O(n(k+1))，DP 額外空間 O(k+1)；提供的整批讀入使用 O(n) 空間。",
    pitfall:
      "只能用金牌連接被跳過的日子，不能任意把所有正數相加；更新 j 必須倒序。",
    traceLabel: "示意：收益 3,-5,4，最多一張金牌",
    trace: [
      {
        title: "尚未投資",
        description: "最多 0 或 1 張金牌都能選空期間，初始收益為 0。",
        cells: ["dp[0]=0", "dp[1]=0"],
        variables: [["答案", "0"]],
      },
      {
        title: "第一天領取 3",
        description: "兩種預算都可以直接領取 3。",
        cells: ["dp[0]=3", "dp[1]=3"],
        active: [0, 1],
        variables: [["答案", "3"]],
      },
      {
        title: "第二天跳過 -5",
        description: "零張預算歸零；一張預算由舊 dp[0]=3 跳過今天而保留 3。",
        cells: ["dp[0]=0", "dp[1]=3"],
        active: [1],
        variables: [
          ["金牌", "使用 1 張"],
          ["答案", "3"],
        ],
      },
      {
        title: "第三天領取 4",
        description: "不跳日最多為 4；跳過第二天則得到 3+4=7。",
        cells: ["dp[0]=4", "dp[1]=7"],
        active: [1],
        variables: [["輸出", "7"]],
      },
    ],
    cpp: String.raw`#include <bits/stdc++.h>
using namespace std;
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, k;
    cin >> n >> k;
    vector<long long> dp(k + 1, 0);
    long long answer = 0;
    for (int i = 0; i < n; ++i) {
        int x;
        cin >> x;
        for (int j = k; j >= 0; --j) {
            long long best = max(0LL, dp[j] + x);
            if (j > 0)
                best = max(best, dp[j - 1]);
            dp[j] = best;
            answer = max(answer, best);
        }
    }
    cout << answer << '\n';
}`,
    python: String.raw`import sys
def solve():
    it = iter(map(int, sys.stdin.buffer.read().split()))
    n, k = next(it), next(it)
    dp = [0]*(k+1)
    answer = 0
    for _ in range(n):
        x = next(it)
        for j in range(k, 0, -1):
            # Skipping today preserves nonnegative dp[j-1].
            keep, skip = dp[j]+x, dp[j-1]
            dp[j] = keep if keep > skip else skip
        dp[0] = max(0, dp[0]+x)
        # At-most-k includes every solution using fewer gold medals.
        answer = max(answer, dp[k])
    print(answer)
solve()
`,
  }),
  definePastExamLesson("a384", {
    concept: "圖的連通塊・雙向開口驗證",
    goal: "只沿兩端互相朝向的水管連接走訪，求最大連通塊。",
    explanation: [
      "以位元 0、1、2、3 分別代表上、右、下、左，將 F,H,7,I,X,L,J 編成開口遮罩。格子 u 向方向 d 有開口還不夠，相鄰 v 也必須向 (d+2)%4 有開口，兩者才有圖上的邊。0 沒有開口，也不是水管節點。",
      "對每個尚未拜訪的水管啟動迭代 DFS，入堆疊時立即標記，每走訪一格就將此區塊大小加 1。DFS 恰好沿合法連接到達同一塊所有水管，不會越過沒有互通的邊。每一格只歸屬一個區塊，逐塊取最大值；全為 0 時保持答案 0。",
    ],
    complexity:
      "時間 O(nm)，空間 O(nm)。每格至多檢查四個方向，迭代堆疊避免 250000 層遞迴。",
    pitfall: "相鄰不代表相連；例如兩個並排的 I 都只開上下，不能橫向互通。",
    traceLabel: "公開範例 1：FHH7 / IIII / LHHJ",
    trace: [
      {
        title: "沿上緣出發",
        description: "左上 F 向右連接兩個 H 與右上 7，先到達四格。",
        cells: ["F H H 7", "I I I I", "L H H J"],
        active: [0],
        variables: [["上緣水管", "4"]],
      },
      {
        title: "轉往兩側與下緣",
        description: "左右外側 I 能上下相連，與整條下緣構成同一圈。",
        cells: ["上緣 4 格", "外側 I：2 格", "下緣 4 格"],
        active: [0, 1, 2],
        variables: [["區塊大小", "10"]],
      },
      {
        title: "檢查中間 I",
        description:
          "中間兩個 I 的上、下方都是 H，H 無上下開口，因此各自獨立。",
        cells: ["外圈 10", "中間 I：1", "中間 I：1"],
        active: [1, 2],
        variables: [["最大連通塊", "10"]],
      },
    ],
    cpp: String.raw`#include <bits/stdc++.h>
using namespace std;
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, m;
    cin >> n >> m;
    vector<int> mask(n * m), seen(n * m);
    map<char, int> openings = {{'0', 0}, {'F', 6},  {'H', 10}, {'7', 12},
                               {'I', 5}, {'X', 15}, {'L', 3},  {'J', 9}};
    for (int &v : mask) {
        char ch;
        cin >> ch;
        v = openings[ch];
    }
    int dr[] = {-1, 0, 1, 0}, dc[] = {0, 1, 0, -1};
    int answer = 0;
    for (int start = 0; start < n * m; ++start) {
        if (!mask[start] || seen[start])
            continue;
        vector<int> stack = {start};
        seen[start] = 1;
        int count = 0;
        while (!stack.empty()) {
            int u = stack.back();
            stack.pop_back();
            ++count;
            for (int d = 0; d < 4; ++d) {
                int r = u / m + dr[d], c = u % m + dc[d];
                if (r < 0 || r >= n || c < 0 || c >= m)
                    continue;
                int v = r * m + c;
                if (!seen[v] && (mask[u] & (1 << d)) && (mask[v] & (1 << ((d + 2) % 4)))) {
                    seen[v] = 1;
                    stack.push_back(v);
                }
            }
        }
        answer = max(answer, count);
    }
    cout << answer << '\n';
}`,
    python: String.raw`import sys
def solve():
    it = iter(sys.stdin.buffer.read().split())
    n, m = int(next(it)), int(next(it))
    chars = b''.join(it)
    opening = dict(zip(b'0FH7IXLJ', (0, 6, 10, 12, 5, 15, 3, 9)))
    mask = [opening[ch] for ch in chars]
    seen = bytearray(n*m)
    dr, dc = (-1, 0, 1, 0), (0, 1, 0, -1)
    answer = 0
    for start in range(n*m):
        if not mask[start] or seen[start]:
            continue
        stack = [start]
        seen[start] = 1
        count = 0
        while stack:
            u = stack.pop()
            row, col = divmod(u, m)
            count += 1
            for d in range(4):
                r, c = row+dr[d], col+dc[d]
                if not (0 <= r < n and 0 <= c < m):
                    continue
                v = r*m+c
                if (not seen[v] and mask[u] & (1 << d)
                        and mask[v] & (1 << ((d+2) % 4))):
                    seen[v] = 1
                    stack.append(v)
        answer = max(answer, count)
    print(answer)
solve()
`,
  }),
  definePastExamLesson("a385", {
    concept: "單調消除・列行雙向鏈結與佇列",
    goal: "維護每張牌在列、行的相鄰存活牌，讓新形成的可消除牌對進入佇列。",
    explanation: [
      "同列或同行的兩張相同牌，中間全空，等價於它們在該列或該行的『存活牌串列』中相鄰。為每格建立左、右、上、下四個鏈結；一張牌刪除時，把左右鄰居互接、上下鄰居互接，就能直接跨過空格。初始掃描相鄰格，將相同值的牌對放入佇列。",
      "每取出一對仍存活的牌就消除並加分，再檢查刪除過程中新成為鄰居的左右與上下牌。每種值恰有兩張，不會出現爭奪同值配對；刪除只會解除阻擋，不會讓已可消除的牌失效。又因分數非負，儘早消除任何可消對都不會損害未來選擇。",
      "若另一種消除順序還能消掉更多牌，考慮其中第一對未被本演算法消除的牌：它的阻擋牌都已經在本演算法消掉，因此它一定曾成為相鄰牌並入列，矛盾。所以佇列清空時得到所有可能消除的牌對與最大分數。0 也維持存活標記，不能被當成空格。",
    ],
    complexity:
      "時間 O(nm)，空間 O(nm)。每張牌只刪一次，每次只產生常數個鄰接檢查；重複入列也只有 O(nm) 次。",
    pitfall:
      "0 分牌仍必須消除才能解鎖其他牌；用 alive 判斷空格，不能用數值是否為 0。",
    traceLabel: "公開範例 1：一列 0,2,3,3,0,2,5,5",
    trace: [
      {
        title: "初始鄰接對",
        description: "只有兩張 3 與兩張 5 各自相鄰；兩張 0 之間仍有牌阻擋。",
        cells: ["0", "2", "3", "3", "0", "2", "5", "5"],
        active: [2, 3, 6, 7],
        variables: [
          ["佇列", "(3,3),(5,5)"],
          ["分數", "0"],
        ],
      },
      {
        title: "刪去兩張 3",
        description: "左右鏈結把欄 1 的 2 與欄 4 的 0 接起來，數值不同。",
        cells: ["0", "2", "空", "空", "0", "2", "5", "5"],
        active: [1, 4],
        variables: [["分數", "3"]],
      },
      {
        title: "刪去兩張 5",
        description: "兩張 5 加 5 分，剩下 0,2,0,2，沒有同值相鄰牌。",
        cells: ["0", "2", "空", "空", "0", "2", "空", "空"],
        active: [6, 7],
        variables: [
          ["分數", "8"],
          ["佇列", "空"],
        ],
      },
    ],
    cpp: String.raw`#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, m;
    cin >> n >> m;
    int size = n * m;
    vector<int> a(size), left(size), right(size), up(size), down(size);
    vector<bool> alive(size, true);
    for (int &x : a)
        cin >> x;
    for (int u = 0; u < size; ++u) {
        left[u] = u % m ? u - 1 : -1;
        right[u] = u % m + 1 < m ? u + 1 : -1;
        up[u] = u >= m ? u - m : -1;
        down[u] = u + m < size ? u + m : -1;
    }
    queue<pair<int, int>> ready;
    auto offer = [&](int u, int v) {
        if (u != -1 && v != -1 && alive[u] && alive[v] && a[u] == a[v])
            ready.push({u, v});
    };
    for (int u = 0; u < size; ++u) {
        offer(u, right[u]);
        offer(u, down[u]);
    }
    int answer = 0;
    while (!ready.empty()) {
        auto [u, v] = ready.front();
        ready.pop();
        if (!alive[u] || !alive[v])
            continue;
        answer += a[u];
        for (int x : {u, v}) {
            alive[x] = false;
            int l = left[x], r = right[x], t = up[x], b = down[x];
            if (l != -1)
                right[l] = r;
            if (r != -1)
                left[r] = l;
            if (t != -1)
                down[t] = b;
            if (b != -1)
                up[b] = t;
            offer(l, r);
            offer(t, b);
        }
    }
    cout << answer << '\n';
}`,
    python: String.raw`import sys
from collections import deque
it = iter(map(int, sys.stdin.buffer.read().split()))
n, m = next(it), next(it)
size = n*m
a = list(it)
left = [u-1 if u % m else -1 for u in range(size)]
right = [u+1 if u % m+1 < m else -1 for u in range(size)]
up = [u-m if u >= m else -1 for u in range(size)]
down = [u+m if u+m < size else -1 for u in range(size)]
alive = bytearray([1])*size
ready = deque()
def offer(u, v):
    if u != -1 and v != -1 and alive[u] and alive[v] and a[u] == a[v]:
        ready.append((u, v))
for u in range(size):
    offer(u, right[u])
    offer(u, down[u])
answer = 0
while ready:
    u, v = ready.popleft()
    if not alive[u] or not alive[v]:
        continue
    answer += a[u]
    for x in (u, v):
        alive[x] = 0
        l, r, t, b = left[x], right[x], up[x], down[x]
        if l != -1:
            right[l] = r
        if r != -1:
            left[r] = l
        if t != -1:
            down[t] = b
        if b != -1:
            up[b] = t
        offer(l, r)
        offer(t, b)
print(answer)
`,
  }),
  definePastExamLesson("a386", {
    concept: "分類計數・方向極值",
    goal: "分別統計左右食物份數，選較多的一側並停在該側最遠食物。",
    explanation: [
      "老鼠不能掉頭，所以選左只能吃座標小於 x 的所有食物，選右只能吃座標大於 x 的所有食物。掃描時各自累計份數；左側最後位置是最小座標，右側最後位置是最大座標。無需真的逐份排序或模擬移動。",
      "每份食物都不在 x，而總份數是奇數，所以左右數量不可能相同。較多的一側就是唯一最佳方向；沿該方向前進到極值座標時，該側所有食物都已經經過，即達成該側的份數上界。",
    ],
    complexity: "時間 O(n)，額外空間 O(1)；Python 整批讀入需 O(n) 空間。",
    pitfall: "比較的是食物份數，不是距離；同一座標若有多份食物也應逐份計數。",
    traceLabel: "公開範例 2：起點 10",
    trace: [
      {
        title: "分類左側",
        description: "-1,-9,7,8 都小於 10，共四份；左側最遠為 -9。",
        cells: ["左：-1,-9,7,8", "起點 10", "右：13,12,16,100,25"],
        active: [0],
        variables: [
          ["左份數", "4"],
          ["左終點", "-9"],
        ],
      },
      {
        title: "分類右側",
        description: "右邊共有五份，極大座標為 100。",
        cells: ["左：4 份", "起點 10", "右：5 份"],
        active: [2],
        variables: [
          ["右份數", "5"],
          ["右終點", "100"],
        ],
      },
      {
        title: "選擇右方",
        description: "5 大於 4，向右到 100 即可吃完五份。",
        cells: ["10 → 12 → 13 → 16 → 25 → 100"],
        active: [0],
        variables: [["輸出", "5 100"]],
      },
    ],
    cpp: String.raw`#include <bits/stdc++.h>
using namespace std;
int main() {
    int x, n;
    cin >> x >> n;
    int leftCount = 0, rightCount = 0, low = x, high = x;
    for (int i = 0; i < n; ++i) {
        int p;
        cin >> p;
        if (p < x) {
            ++leftCount;
            low = min(low, p);
        } else {
            ++rightCount;
            high = max(high, p);
        }
    }
    if (leftCount > rightCount)
        cout << leftCount << ' ' << low << '\n';
    else
        cout << rightCount << ' ' << high << '\n';
}`,
    python: String.raw`import sys
it = iter(map(int, sys.stdin.buffer.read().split()))
x, n = next(it), next(it)
left_count = right_count = 0
low = high = x
for _ in range(n):
    p = next(it)
    if p < x:
        left_count += 1
        low = min(low, p)
    else:
        right_count += 1
        high = max(high, p)
if left_count > right_count:
    print(left_count, low)
else:
    print(right_count, high)
`,
  }),
  definePastExamLesson("a387", {
    concept: "依賴計數・鑰匙事件佇列",
    goal: "每種新鑰匙只傳播一次，當寶盒缺少的鑰匙數歸零就開盒。",
    explanation: [
      "為每種鑰匙建立『需要它的寶盒』反向清單，每盒保存尚未處理到的需求數。把初始鑰匙去重放入佇列，每取出一把鑰匙，就令等待該鑰匙的各盒需求數減 1；降為 0 的盒子立刻開啟，將其中尚未擁有的鑰匙加入佇列。",
      "鑰匙不消耗，因此已可開的盒子永遠不會變得不可開。每種鑰匙只在第一次取得時入列，需求數才不會重複減少。當佇列清空，所有取得的鑰匙都已傳播；任何仍關閉的盒子至少缺一種永遠未取得的鑰匙，所以不存在還能繼續開盒的方法。",
      "程式將每盒需求去重，避免同一編號重複列出時誤認為要有兩把鑰匙；盒內鑰匙依題意互異，初始清單也仍做去重。循環依賴若沒有初始鑰匙突破，就自然維持關閉。",
    ],
    complexity:
      "時間 O(m+nk)，空間 O(m+nk)。k≤5，各需求關係與盒內鑰匙至多處理一次。",
    pitfall:
      "擁有與已傳播是不同時刻；只在首次取得時入列，同盒需求降至 0 也只能開一次。",
    traceLabel: "示意：三盒需求 [0,1]、[2,3]、[4,5]，初始有 0,1",
    trace: [
      {
        title: "傳播初始鑰匙",
        description: "處理 0 使第一盒缺 1 種；處理 1 後缺 0 種，開啟得到 2,3。",
        cells: ["盒0：缺0", "盒1：缺2", "盒2：缺2"],
        active: [0],
        variables: [
          ["新鑰匙", "2,3"],
          ["開盒數", "1"],
        ],
      },
      {
        title: "傳播 2、3",
        description:
          "第二盒依序從缺 2 種降為 1、0，開啟取得 0,4；0 已持有，不再入列。",
        cells: ["盒0：已開", "盒1：缺0", "盒2：缺2"],
        active: [1],
        variables: [
          ["新鑰匙", "4"],
          ["開盒數", "2"],
        ],
      },
      {
        title: "處理 4 後停止",
        description: "第三盒還缺 5；前兩盒都不會提供 5，因此無法再開。",
        cells: ["盒0：已開", "盒1：已開", "盒2：缺5"],
        active: [2],
        variables: [
          ["佇列", "空"],
          ["輸出", "2"],
        ],
      },
    ],
    cpp: String.raw`#include <bits/stdc++.h>
using namespace std;
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, m, k, t;
    cin >> n >> m >> k >> t;
    vector<bool> have(m, false);
    queue<int> ready;
    auto acquire = [&](int key) {
        if (!have[key]) {
            have[key] = true;
            ready.push(key);
        }
    };
    for (int i = 0; i < t; ++i) {
        int key;
        cin >> key;
        acquire(key);
    }
    vector<vector<int>> waiting(m), contents(n);
    vector<int> missing(n);
    for (int box = 0; box < n; ++box) {
        set<int> required;
        for (int j = 0; j < k; ++j) {
            int key;
            cin >> key;
            required.insert(key);
        }
        missing[box] = required.size();
        for (int key : required)
            waiting[key].push_back(box);
    }
    for (auto &keys : contents) {
        keys.resize(k);
        for (int &key : keys)
            cin >> key;
    }
    int answer = 0;
    while (!ready.empty()) {
        int key = ready.front();
        ready.pop();
        for (int box : waiting[key]) {
            if (--missing[box] == 0) {
                ++answer;
                for (int found : contents[box])
                    acquire(found);
            }
        }
    }
    cout << answer << '\n';
}`,
    python: String.raw`import sys
from collections import deque
it = iter(map(int, sys.stdin.buffer.read().split()))
n, m, k, t = (next(it) for _ in range(4))
have = bytearray(m)
ready = deque()
def acquire(key):
    if not have[key]:
        have[key] = 1
        ready.append(key)
for _ in range(t):
    acquire(next(it))
waiting = [[] for _ in range(m)]
missing = [0]*n
for box in range(n):
    required = {next(it) for _ in range(k)}
    missing[box] = len(required)
    for key in required:
        waiting[key].append(box)
contents = [[next(it) for _ in range(k)] for _ in range(n)]
answer = 0
while ready:
    key = ready.popleft()
    for box in waiting[key]:
        missing[box] -= 1
        if missing[box] == 0:
            answer += 1
            for found in contents[box]:
                acquire(found)
print(answer)
`,
  }),
  definePastExamLesson("a388", {
    concept: "堆疊・可合併的路徑摘要",
    goal: "用起點、終點與內部距離摘要巢狀迴圈，避免展開指令。",
    explanation: [
      "一段含 T 的指令可摘要成 (first,last,cost)：第一個目標磁軌、最後目標磁軌，以及從第一個目標開始執行到最後的內部移動距離。將 B 接到 A 後，距離為 A.cost+|A.last-B.first|+B.cost，起點取 A.first、終點取 B.last。單一 Txx 的摘要是 (xx,xx,0)。",
      "迴圈內容重複 x 次時，內部距離為 x×cost+(x-1)×|last-first|，因為相鄰兩輪間必須從上一輪的最後磁軌回到下一輪的第一磁軌。首尾磁軌保持不變。用明確堆疊保存各層摘要：L 開新層、E 將該層重複後合併到父層，因此能處理長達十萬字元的深巢狀輸入。",
      "以上摘要刻意不含進入此段前的移動，才可放到任意上下文。最外層完成後，另加 |10-first|；若整串沒有 T 則距離為 0。所有合併都恰好計入段內與段間的移動，既不重複也不漏掉。",
    ],
    complexity:
      "時間 O(L)，空間 O(L)，L 為指令長度；不受展開後指令數影響。C++ 使用 64 位元整數。",
    pitfall:
      "不能直接將第一次執行的全部距離乘 x，第一輪之前的位置與後續輪之前的位置不同。本站迴圈次數為 1 到 9。",
    traceLabel: "示意：L3T20T30E，初始磁軌 10",
    trace: [
      {
        title: "開啟三次迴圈",
        description: "遇到 L3 壓入空摘要，先不展開三份指令。",
        cells: ["外層：空", "內層：repeat=3"],
        active: [1],
        variables: [["堆疊深度", "2"]],
      },
      {
        title: "讀兩個 T",
        description: "T20 接 T30，摘要為 first=20、last=30、cost=10。",
        cells: ["20 → 30", "摘要 (20,30,10)"],
        active: [1],
        variables: [["內部移動", "|30-20|=10"]],
      },
      {
        title: "結束迴圈",
        description:
          "三輪各移動 10，兩個輪間各由 30 回 20，總內部距離 3×10+2×10=50。",
        cells: ["20→30", "30→20→30", "30→20→30"],
        active: [1, 2],
        variables: [["合併摘要", "(20,30,50)"]],
      },
      {
        title: "補最初移動",
        description: "初始在 10，進入第一個 20 另移動 10，最終距離 60。",
        cells: ["10 → 20", "迴圈內 50", "總共 60"],
        active: [0, 2],
        variables: [["輸出", "60"]],
      },
    ],
    cpp: String.raw`#include <bits/stdc++.h>
using namespace std;
struct Frame {
    long long repeat = 1, cost = 0;
    int first = -1, last = -1;
};
void append(Frame &a, const Frame &b) {
    if (b.first == -1)
        return;
    if (a.first == -1)
        a.first = b.first;
    else
        a.cost += abs(a.last - b.first);
    a.cost += b.cost;
    a.last = b.last;
}
int main() {
    string s;
    cin >> s;
    vector<Frame> stack(1);
    for (size_t i = 0; i < s.size();) {
        if (s[i] == 'T') {
            int target = (s[i + 1] - '0') * 10 + s[i + 2] - '0';
            Frame item;
            item.first = item.last = target;
            append(stack.back(), item);
            i += 3;
        } else if (s[i] == 'L') {
            Frame item;
            item.repeat = s[i + 1] - '0';
            stack.push_back(item);
            i += 2;
        } else {
            Frame item = stack.back();
            stack.pop_back();
            item.cost = item.repeat * item.cost + (item.repeat - 1) * abs(item.last - item.first);
            append(stack.back(), item);
            ++i;
        }
    }
    Frame result = stack.back();
    cout << (result.first == -1 ? 0 : result.cost + abs(10 - result.first)) << '\n';
}`,
    python: String.raw`import sys
s = sys.stdin.buffer.read().strip().decode()
# Each frame: repetition count, first track, last track, internal distance.
stack = [[1, -1, -1, 0]]
def append(frame, first, last, cost):
    if first == -1:
        return
    if frame[1] == -1:
        frame[1] = first
    else:
        frame[3] += abs(frame[2]-first)
    frame[2] = last
    frame[3] += cost
i = 0
while i < len(s):
    if s[i] == 'T':
        target = int(s[i+1:i+3])
        append(stack[-1], target, target, 0)
        i += 3
    elif s[i] == 'L':
        stack.append([int(s[i+1]), -1, -1, 0])
        i += 2
    else:
        times, first, last, cost = stack.pop()
        cost = times*cost+(times-1)*abs(last-first)
        append(stack[-1], first, last, cost)
        i += 1
_, first, last, cost = stack[0]
print(0 if first == -1 else cost+abs(10-first))
`,
  }),
  definePastExamLesson("a389", {
    concept: "曼哈頓鄰域・半徑有界枚舉",
    goal: "對每個候選格只加總半徑 x 的菱形區域，再判斷個位數。",
    explanation: [
      "候選中心 (i,j) 的半徑就是該格數字 x，最多只有 9。對距中心列差 d 的列 r，剩餘水平半徑為 x-|r-i|，因此該列需加總的欄範圍是 j-(x-|r-i|) 到 j+(x-|r-i|)，再截斷到矩陣內。",
      "這些列區間互不重複且聯集恰是 |r-i|+|c-j|≤x 的所有格，包含中心，因此加總後以 sum%10==x 判斷即可。按 i 再按 j 遞增枚舉，成功位置的加入順序已經符合輸出順序，不必額外排序。x=0 時只加中心 0，所以該格必定是特殊位置。",
    ],
    complexity:
      "令 D=9，時間 O(nm(D+1)²)，空間 O(nm)，含答案；單個完整菱形最多 181 格。",
    pitfall:
      "半徑與比較目標都取原矩陣值，不修改矩陣；不是方形鄰域，也不是只加外框。",
    traceLabel: "公開範例 1：單列 1,2,3,4,5,6,7,8",
    trace: [
      {
        title: "檢查欄 0",
        description: "x=1，範圍截為欄 0 到 1，和為 1+2=3，3%10 不等於 1。",
        cells: ["1", "2", "3", "4", "5", "6", "7", "8"],
        active: [0, 1],
        variables: [
          ["總和", "3"],
          ["特殊？", "否"],
        ],
      },
      {
        title: "檢查欄 3",
        description: "x=4，範圍涵蓋整列，總和 36，餘數 6 不等於 4。",
        cells: ["1", "2", "3", "4", "5", "6", "7", "8"],
        active: [0, 1, 2, 3, 4, 5, 6, 7],
        variables: [
          ["總和", "36"],
          ["特殊？", "否"],
        ],
      },
      {
        title: "檢查欄 5",
        description:
          "x=6 同樣涵蓋整列，36%10=6，記錄 (0,5)，其他位置均不符合。",
        cells: ["1", "2", "3", "4", "5", "6", "7", "8"],
        active: [5],
        variables: [
          ["輸出數量", "1"],
          ["座標", "0 5"],
        ],
      },
    ],
    cpp: String.raw`#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, m;
    cin >> n >> m;
    vector<vector<int>> a(n, vector<int>(m));
    for (auto &row : a)
        for (int &x : row)
            cin >> x;
    vector<pair<int, int>> answer;
    for (int i = 0; i < n; ++i) {
        for (int j = 0; j < m; ++j) {
            int x = a[i][j], sum = 0;
            for (int r = max(0, i - x); r <= min(n - 1, i + x); ++r) {
                int radius = x - abs(r - i);
                for (int c = max(0, j - radius); c <= min(m - 1, j + radius); ++c)
                    sum += a[r][c];
            }
            if (sum % 10 == x)
                answer.push_back({i, j});
        }
    }
    cout << answer.size() << '\n';
    for (auto [r, c] : answer)
        cout << r << ' ' << c << '\n';
}`,
    python: String.raw`import sys
it = iter(map(int, sys.stdin.buffer.read().split()))
n, m = next(it), next(it)
a = [[next(it) for _ in range(m)] for _ in range(n)]
answer = []
for i in range(n):
    for j in range(m):
        x = a[i][j]
        total = 0
        for r in range(max(0, i-x), min(n, i+x+1)):
            radius = x-abs(r-i)
            for c in range(max(0, j-radius), min(m, j+radius+1)):
                total += a[r][c]
        if total % 10 == x:
            answer.append((i, j))
print(len(answer))
for r, c in answer:
    print(r, c)
`,
  }),
  definePastExamLesson("a390", {
    concept: "排序貪心・最晚可用機器",
    goal: "依活動結束時間安排，將每場活動交給最晚但仍能接上的機器。",
    explanation: [
      "依結束時間 R 遞增處理活動，為每台機器保存最後結束時間，空機器設為 -1。對 [L,R]，必須找結束時間嚴格小於 L 的機器；在排序陣列中二分找第一個≥L 的位置，它的前一個就是『最晚但仍可用』者。沒有這種機器便略過活動。",
      "先選較早結束的活動能讓機器較早空出：若最佳排程在某台機器的下一場選了更晚結束者，可用目前的早結束活動替換，不影響之後安排，也不減少場數。若多台可用，使用其中最晚空出的機器，會保留較早空出的機器接未來開始較早的活動；交換這兩台機器在該時點之前的排程即可得到這種安排。因此兩個貪心選擇都可維持某個最佳排程。",
      "K≤100，直接使用排序陣列即可。刪除被使用的舊結束時間後，新 R 因活動已依 R 排序，必定不小於陣列其他元素，可直接附在尾端。每次搬動至多 K 個元素，無須額外平衡樹套件。",
    ],
    complexity:
      "時間 O(N log N + NK)，空間 O(N+K)，含活動排序。K≤100，陣列移動至多約一千萬個元素。",
    pitfall:
      "區間包含兩端，R=L 的兩場仍重疊；搜尋必須是嚴格小於 L，不能用小於等於。",
    traceLabel: "示意：K=2，活動 (1,2),(0,3),(3,4),(2,5),(5,6)",
    trace: [
      {
        title: "配置前兩場",
        description: "先接 (1,2)，再接 (0,3)，兩台機器最後結束時間排序為 2,3。",
        cells: ["機器結束 2", "機器結束 3"],
        variables: [["已接場數", "2"]],
      },
      {
        title: "接 (3,4)",
        description: "僅結束於 2 的機器滿足 2<3；結束於 3 的機器不能同時開始。",
        cells: ["機器結束 3", "機器結束 4"],
        active: [1],
        variables: [["已接場數", "3"]],
      },
      {
        title: "略過 (2,5)",
        description: "兩個結束時間都不小於 2，沒有機器可接。",
        cells: ["機器結束 3", "機器結束 4"],
        variables: [["已接場數", "3"]],
      },
      {
        title: "接 (5,6)",
        description: "兩台都可用，選最晚空出的 4，保留較早空出的 3。",
        cells: ["機器結束 3", "機器結束 6"],
        active: [1],
        variables: [["輸出", "4"]],
      },
    ],
    cpp: String.raw`#include <bits/stdc++.h>
using namespace std;
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, k;
    cin >> n >> k;
    vector<int> starts(n);
    for (int &x : starts)
        cin >> x;
    vector<pair<int, int>> events;
    for (int i = 0; i < n; ++i) {
        int end;
        cin >> end;
        events.push_back({end, starts[i]});
    }
    sort(events.begin(), events.end());
    vector<int> freeTime(k, -1);
    int answer = 0;
    for (auto [end, start] : events) {
        auto position = lower_bound(freeTime.begin(), freeTime.end(), start);
        if (position == freeTime.begin())
            continue;
        freeTime.erase(prev(position));
        freeTime.push_back(end);
        ++answer;
    }
    cout << answer << '\n';
}`,
    python: String.raw`import sys
from bisect import bisect_left
it = iter(map(int, sys.stdin.buffer.read().split()))
n, k = next(it), next(it)
starts = [next(it) for _ in range(n)]
events = sorted((next(it), starts[i]) for i in range(n))
free_time = [-1]*k
answer = 0
for end, start in events:
    j = bisect_left(free_time, start)-1
    if j < 0:
        continue
    free_time.pop(j)
    free_time.append(end)
    answer += 1
print(answer)
`,
  }),
  definePastExamLesson("a391", {
    concept: "遞迴下降剖析・自訂運算優先序",
    goal: "以文法分層實作加法優先於乘法，並遞迴求函數的參數極差。",
    explanation: [
      "把文法分成 expression=sum ('*' sum)*、sum=atom ('+' atom)*；atom 則是整數或 f(expression,...)。expression 先呼叫 sum，便會先把加法算完再相乘。例如 2+3*1+2+1 分成 (2+3) 與 (1+2+1)，結果是 5×4=20。",
      "atom 讀到 f 時跳過 f(，反覆呼叫 expression 取得完整參數，遇逗號再讀下一個、遇右括號就結束，回傳最大參數值減最小參數值。expression 只消耗自己的 + 與 *，會自然停在逗號或右括號，因此巢狀函數不會混淆外層參數。",
      "每一層函式都完整消耗其文法片段並回傳正確值，從整數原子往外歸納，就能證明所有函數與運算式結果正確。單一參數的最大與最小值相同，結果自然是 0；使用 64 位元或 Python 整數處理超過 32 位元的值。",
    ],
    complexity:
      "時間 O(L)，空間 O(L)，L≤500；每個字元只被常數次檢查，函數參數用極值累積，不儲存全部。",
    pitfall:
      "本題加法比乘法優先，不能用一般 eval；函數計算最大減最小，不是相加，也不是固定兩個參數。",
    traceLabel: "示意：f(2+3*4,7,f(9,1))*2",
    trace: [
      {
        title: "第一個參數",
        description: "依加法優先，2+3*4 算成 (2+3)×4=20。",
        cells: ["2+3=5", "5×4=20", "第一參數 20"],
        active: [2],
        variables: [["外層最小/最大", "20 / 20"]],
      },
      {
        title: "第二與第三個參數",
        description: "第二參數為 7；內層 f(9,1)=8，成為外層第三參數。",
        cells: ["20", "7", "f(9,1)=8"],
        active: [1, 2],
        variables: [["外層最小/最大", "7 / 20"]],
      },
      {
        title: "外層 f 完成",
        description: "外層 f 回傳 20-7=13，右括號結束函數原子。",
        cells: ["f(...)=13", "*2"],
        active: [0],
        variables: [["函數結果", "13"]],
      },
      {
        title: "完成乘法",
        description: "最後 13×2=26。",
        cells: ["13", "×", "2", "26"],
        active: [3],
        variables: [["輸出", "26"]],
      },
    ],
    cpp: String.raw`#include <bits/stdc++.h>
using namespace std;
string text;
size_t pos = 0;
long long expression();
long long atom() {
    if (text[pos] == 'f') {
        pos += 2; // f(
        long long low = expression(), high = low;
        while (pos < text.size() && text[pos] == ',') {
            ++pos;
            long long value = expression();
            low = min(low, value);
            high = max(high, value);
        }
        ++pos; // )
        return high - low;
    }
    long long value = 0;
    while (pos < text.size() && isdigit(text[pos])) {
        value = value * 10 + text[pos] - '0';
        ++pos;
    }
    return value;
}
long long sum() {
    long long value = atom();
    while (pos < text.size() && text[pos] == '+') {
        ++pos;
        value += atom();
    }
    return value;
}
long long expression() {
    long long value = sum();
    while (pos < text.size() && text[pos] == '*') {
        ++pos;
        value *= sum();
    }
    return value;
}
int main() {
    string piece;
    while (cin >> piece)
        text += piece;
    cout << expression() << '\n';
}`,
    python: String.raw`import sys
sys.setrecursionlimit(5000)
text = ''.join(sys.stdin.read().split())
pos = 0
def atom():
    global pos
    if text[pos] == 'f':
        pos += 2
        low = high = expression()
        while pos < len(text) and text[pos] == ',':
            pos += 1
            value = expression()
            low = min(low, value)
            high = max(high, value)
        pos += 1
        return high-low
    value = 0
    while pos < len(text) and text[pos].isdigit():
        value = value*10+int(text[pos])
        pos += 1
    return value
def addition():
    global pos
    value = atom()
    while pos < len(text) and text[pos] == '+':
        pos += 1
        value += atom()
    return value
def expression():
    global pos
    value = addition()
    while pos < len(text) and text[pos] == '*':
        pos += 1
        value *= addition()
    return value
print(expression())
`,
  }),
  definePastExamLesson("a392", {
    concept: "最小瓶頸路徑・限制邊的 BFS",
    goal: "先求最小可能的最大相鄰高度差，再於該限制下求最短步數。",
    explanation: [
      "把格子當節點，相鄰邊權為高度差絕對值。第一階段用 Dijkstra 的形式求瓶頸：best[v] 表示到 v 的最小可能最大邊權，從 u 經權重 w 的邊延伸時，新候選是 max(best[u],w)，而不是兩者相加。最小堆積優先佇列每次取出瓶頸最小者，抵達終點時便得到最小限制 D。",
      "此更新具有單調性：延伸路徑不會讓瓶頸降低，因此 Dijkstra 的確定最小值論證仍成立。接著只允許高度差≤D 的邊，對整張圖另做一次 BFS；每條邊代表一步，BFS 第一次到終點的距離就是達到最優瓶頸下的最少步數。",
      "兩個目標必須分兩階段。到某中繼格時瓶頸較小但步數較多的路，往後可能被更大的邊權蓋過優勢，這時原本瓶頸稍大卻較短的路反而較好。不能只在第一階段為每格保留一組 (瓶頸,步數) 就認為次要目標也已最佳化。N=1 時起終點相同，兩階段都得到 0。",
    ],
    complexity:
      "時間 O(N² log(N²))，空間 O(N²)，含優先佇列；第二階段 BFS 為 O(N²)。",
    pitfall:
      "第一行是路徑上最大相鄰差的最小值，不是全路最高減最低；第二行要重新 BFS 求步數。",
    traceLabel: "示意：2×2 高度 [1,10] / [3,4]",
    trace: [
      {
        title: "起點初始化",
        description: "起點瓶頸為 0，右邊邊權 9，下邊邊權 2。",
        cells: ["1:best0", "10:best9", "3:best2", "4:未到達"],
        active: [0, 1, 2],
        variables: [["佇列", "(2,左下),(9,右上)"]],
      },
      {
        title: "先取左下",
        description: "經左下到右下，候選瓶頸 max(2,|4-3|)=2。",
        cells: ["1:best0", "10:best9", "3:best2", "4:best2"],
        active: [2, 3],
        variables: [["最優限制 D", "2"]],
      },
      {
        title: "以 D=2 做 BFS",
        description: "右上兩條邊權 9、6 都被排除；唯一路徑是起點→左下→右下。",
        cells: ["起點 dist0", "右上不可達", "左下 dist1", "終點 dist2"],
        active: [0, 2, 3],
        variables: [["輸出", "2 與 2"]],
      },
    ],
    cpp: String.raw`#include <bits/stdc++.h>
using namespace std;
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    int size = n * n;
    vector<int> height(size), best(size, INT_MAX);
    for (int &x : height)
        cin >> x;
    int dr[] = {-1, 0, 1, 0}, dc[] = {0, 1, 0, -1};
    priority_queue<pair<int, int>, vector<pair<int, int>>, greater<pair<int, int>>> heap;
    best[0] = 0;
    heap.push({0, 0});
    while (!heap.empty()) {
        auto [cost, u] = heap.top();
        heap.pop();
        if (cost != best[u])
            continue;
        if (u == size - 1)
            break;
        for (int d = 0; d < 4; ++d) {
            int r = u / n + dr[d], c = u % n + dc[d];
            if (r < 0 || r >= n || c < 0 || c >= n)
                continue;
            int v = r * n + c;
            int candidate = max(cost, abs(height[u] - height[v]));
            if (candidate < best[v]) {
                best[v] = candidate;
                heap.push({candidate, v});
            }
        }
    }
    int limit = best.back();
    vector<int> distance(size, -1);
    queue<int> ready;
    ready.push(0);
    distance[0] = 0;
    while (!ready.empty()) {
        int u = ready.front();
        ready.pop();
        if (u == size - 1)
            break;
        for (int d = 0; d < 4; ++d) {
            int r = u / n + dr[d], c = u % n + dc[d];
            if (r < 0 || r >= n || c < 0 || c >= n)
                continue;
            int v = r * n + c;
            if (distance[v] == -1 && abs(height[u] - height[v]) <= limit) {
                distance[v] = distance[u] + 1;
                ready.push(v);
            }
        }
    }
    cout << limit << '\n' << distance.back() << '\n';
}`,
    python: String.raw`import sys
from heapq import heappush, heappop
from collections import deque
it = iter(map(int, sys.stdin.buffer.read().split()))
n = next(it)
height = list(it)
size = n*n
best = [10**9]*size
best[0] = 0
heap = [(0, 0)]
def neighbors(u):
    r, c = divmod(u, n)
    if r:
        yield u-n
    if r+1 < n:
        yield u+n
    if c:
        yield u-1
    if c+1 < n:
        yield u+1
while heap:
    cost, u = heappop(heap)
    if cost != best[u]:
        continue
    if u == size-1:
        break
    for v in neighbors(u):
        candidate = max(cost, abs(height[u]-height[v]))
        if candidate < best[v]:
            best[v] = candidate
            heappush(heap, (candidate, v))
limit = best[-1]
distance = [-1]*size
distance[0] = 0
ready = deque([0])
while ready:
    u = ready.popleft()
    if u == size-1:
        break
    for v in neighbors(u):
        if distance[v] == -1 and abs(height[u]-height[v]) <= limit:
            distance[v] = distance[u]+1
            ready.append(v)
print(limit)
print(distance[-1])
`,
  }),
  definePastExamLesson("a393", {
    concept: "前序樹解碼・待填分支堆疊",
    goal: "從包含死路 0 的前序序列還原父子關係，逐條邊加上編號差。",
    explanation: [
      "前序記錄會先出現父節點，再依序完整記錄各子分支，因此可用堆疊保存尚有分支待填的祖先。每個非零偶數開兩個分支，奇數開三個。讀下一筆前先彈出已填滿的祖先，此時頂端就是該筆的父親，將父親待填數減 1。",
      "若本筆為 0，只消耗一個分支，不產生石室也不加邊權；若非 0，與父親的差絕對值加入答案，再將自己的分支數壓入堆疊。根節點沒有父親所以不加差值。即使父親的待填數已降為 0，也要等剛讀入的子樹完整結束後才彈出它。",
      "堆疊依前序順序始終保存從根到當前位置的未完成路徑，每個石室除根外恰在首次讀入時連到其直接父親，因此每條真正的石室邊被計算一次。死路不會誤連到下一個兄弟，亦無需建立整棵樹。",
    ],
    complexity:
      "時間 O(S)，S 為輸入整數數量。C++ 串流讀入用 O(D) 空間；Python 整批切詞用 O(S+D) 空間，D≤40。答案用 64 位元整數。",
    pitfall:
      "0 沒有自己的分支；不能只把相鄰兩個非零輸入相減，它們可能是兄弟或不同子樹的節點。",
    traceLabel: "公開範例 1：2 6 0 8 14 0 0 0 10 0 4 0 0",
    trace: [
      {
        title: "根 2 連到 6",
        description: "2 開兩分支，讀到 6 時加 |2-6|=4，再把 6 的兩分支壓入。",
        cells: ["2：剩1", "6：剩2"],
        active: [1],
        variables: [["累計", "4"]],
      },
      {
        title: "6 左死路、右連 8",
        description: "0 消耗 6 的左分支；8 是右孩子，加 |6-8|=2。",
        cells: ["2：剩1", "6：剩0", "8：剩2"],
        active: [2],
        variables: [["累計", "6"]],
      },
      {
        title: "8 連 14",
        description:
          "加 |8-14|=6；14 的兩分支與 8 的右分支都是 0，該子樹結束。",
        cells: ["2：剩1", "6、8、14 子樹完成"],
        active: [1],
        variables: [["累計", "12"]],
      },
      {
        title: "回到根的右分支",
        description: "10 連到 2，加 8；10 的右孩子 4 加 6，總和 26。",
        cells: ["2 → 10：8", "10 → 4：6", "其餘為死路"],
        active: [0, 1],
        variables: [["累計", "12+8+6=26"]],
      },
    ],
    cpp: String.raw`#include <bits/stdc++.h>
using namespace std;
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    vector<pair<long long, int>> stack;
    long long answer = 0, value;
    while (cin >> value) {
        while (!stack.empty() && stack.back().second == 0)
            stack.pop_back();
        if (!stack.empty()) {
            --stack.back().second;
            if (value != 0)
                answer += abs(stack.back().first - value);
        }
        if (value != 0)
            stack.push_back({value, value % 2 == 0 ? 2 : 3});
    }
    cout << answer << '\n';
}`,
    python: String.raw`import sys
stack = []
answer = 0
for token in sys.stdin.buffer.read().split():
    value = int(token)
    while stack and stack[-1][1] == 0:
        stack.pop()
    if stack:
        stack[-1][1] -= 1
        if value:
            answer += abs(stack[-1][0]-value)
    if value:
        stack.append([value, 2 if value % 2 == 0 else 3])
print(answer)
`,
  }),
];
