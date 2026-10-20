import { defineCpeLesson } from "@/lib/cpeLessonBuilder";

export const lessons = [
  defineCpeLesson("a540", {
    topic: "graphs",
    level: "hard",
    concept: "倒序加點的 Floyd",
    goal: "將刪除路徑中繼點改為逐一允許中繼點。",
    explanation: [
      "直接刪除一座塔後重新求最短路徑會花 O(n⁴)。改把拆除順序倒過來：初始沒有塔，每次加回一座 k，使用 Floyd 轉移 d[i][j]=min(d[i][j],d[i][k]+d[k][j])。距離矩陣對全部端點都更新，只有允許的中繼點逐步增加。",
      "加回 k 後，活躍塔恰好對應正向拆除 k 之前的狀態。此時將所有活躍有序點對的距離相加，再加到總能量；對角為 0 不影響。不要先把原圖完整 Floyd 化，否則會允許已拆除的塔當中繼。n=500 時總和需要 64 位元，塔編號直接用本地的 0..n−1。",
    ],
    complexity: "時間 O(n³)，空間 O(n²)。",
    pitfall:
      "反向每次的加點轉移要更新全部 i、j，不能只更新當時活躍端點，否則未來加點距離會缺漏。",
    traceLabel: "示意：兩塔距離 0→1=4、1→0=7，拆除順序0、1",
    trace: [
      {
        title: "反向起點",
        description: "沒有活躍塔，總能量 0。",
        cells: ["活躍數0"],
        active: [0],
        variables: [["總能量", "0"]],
      },
      {
        title: "加回塔1",
        description: "只存在塔1，有序異點對為零組。",
        cells: ["活躍{1}", "本輪0"],
        active: [0, 1],
        variables: [["總能量", "0"]],
      },
      {
        title: "加回塔0",
        description: "存在兩塔，本輪需 4+7=11。",
        cells: ["0→1:4", "1→0:7"],
        active: [0, 1],
        variables: [
          ["本輪", "11"],
          ["答案", "11"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <string>
#include <sstream>
#include <algorithm>
#include <numeric>
#include <cmath>
#include <iomanip>
#include <queue>
#include <deque>
#include <map>
#include <set>
#include <unordered_map>
#include <unordered_set>
#include <array>
#include <tuple>
#include <functional>
#include <limits>
#include <cstdint>
#include <cctype>
#include <utility>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int t;
    cin >> t;
    while (t--) {
        int n;
        cin >> n;
        vector<vector<long long>> d(n, vector<long long>(n));
        for (auto &row : d)
            for (auto &x : row)
                cin >> x;
        vector<int> order(n), active;
        for (int &x : order)
            cin >> x;
        long long ans = 0;
        for (int pos = n - 1; pos >= 0; --pos) {
            int k = order[pos];
            active.push_back(k);
            for (int i = 0; i < n; ++i)
                for (int j = 0; j < n; ++j)
                    d[i][j] = min(d[i][j], d[i][k] + d[k][j]);
            for (int i : active)
                for (int j : active)
                    ans += d[i][j];
        }
        cout << ans << '\n';
    }
}
`,
    python: String.raw`import sys

it = iter(map(int, sys.stdin.buffer.read().split()))
for _ in range(next(it)):
    n = next(it)
    distance = [[next(it) for _ in range(n)] for _ in range(n)]
    order = [next(it) for _ in range(n)]
    active = []
    answer = 0
    for k in reversed(order):
        active.append(k)
        row_k = distance[k]
        for row in distance:
            via = row[k]
            for j, tail in enumerate(row_k):
                candidate = via + tail
                if candidate < row[j]:
                    row[j] = candidate
        answer += sum(distance[i][j] for i in active for j in active)
    print(answer)
`,
  }),
  defineCpeLesson("a541", {
    topic: "simulation",
    level: "medium",
    concept: "二維畫布與迭代洪水填色",
    goal: "按照命令更新像素，保持座標、連通性與整行解析正確。",
    explanation: [
      "用 N 列、M 欄的字元矩陣表示畫布，外部座標 (X,Y) 對應陣列 [Y−1][X−1]。L、V、H、K 分別處理單點、直線與矩形；V、H 兩端可能反向，先取 min/max。I 重新建立白色畫布，C 只清色。",
      "F 從指定點取原色，用堆疊走訪四方向同色格，入堆疊前立即改色以免重複。新色等於原色時直接略過，避免無限走訪。每次整行解析，未知指令整行忽略；S 先印名稱，再逐列連續印字元，沒有格間空白。X 結束。",
    ],
    complexity: "矩形與清除最壞 O(MN)，填色 O(MN)，空間 O(MN)。",
    pitfall: "X 是欄、Y 是列；不可把未知命令後的參數當成下一個命令。",
    traceLabel: "示意：3×2 畫布，點(2,1)先塗A",
    trace: [
      {
        title: "初始化",
        description: "I 3 2 建立六個 O。",
        cells: ["OOO", "OOO"],
        active: [0, 1],
        variables: [
          ["寬", "3"],
          ["高", "2"],
        ],
      },
      {
        title: "單點",
        description: "L 2 1 A 只修改第一列第二欄。",
        cells: ["OAO", "OOO"],
        active: [0, 1],
        variables: [["A個數", "1"]],
      },
      {
        title: "填色",
        description: "F 1 1 B，五個 O 經下列連通，全部變 B。",
        cells: ["BAB", "BBB"],
        active: [0, 1],
        variables: [
          ["B個數", "5"],
          ["A個數", "1"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <string>
#include <sstream>
#include <algorithm>
#include <numeric>
#include <cmath>
#include <iomanip>
#include <queue>
#include <deque>
#include <map>
#include <set>
#include <unordered_map>
#include <unordered_set>
#include <array>
#include <tuple>
#include <functional>
#include <limits>
#include <cstdint>
#include <cctype>
#include <utility>
using namespace std;

int main() {
    vector<string> g;
    int m = 0, n = 0;
    string line;
    while (getline(cin, line)) {
        istringstream in(line);
        char op;
        if (!(in >> op))
            continue;
        if (op == 'X')
            break;
        if (op == 'I') {
            in >> m >> n;
            g.assign(n, string(m, 'O'));
        } else if (op == 'C')
            for (auto &r : g)
                r.assign(m, 'O');
        else if (op == 'L') {
            int x, y;
            char c;
            in >> x >> y >> c;
            g[y - 1][x - 1] = c;
        } else if (op == 'V') {
            int x, a, b;
            char c;
            in >> x >> a >> b >> c;
            for (int y = min(a, b); y <= max(a, b); ++y)
                g[y - 1][x - 1] = c;
        } else if (op == 'H') {
            int a, b, y;
            char c;
            in >> a >> b >> y >> c;
            for (int x = min(a, b); x <= max(a, b); ++x)
                g[y - 1][x - 1] = c;
        } else if (op == 'K') {
            int a, b, x, y;
            char c;
            in >> a >> b >> x >> y >> c;
            for (int r = min(b, y); r <= max(b, y); ++r)
                for (int s = min(a, x); s <= max(a, x); ++s)
                    g[r - 1][s - 1] = c;
        } else if (op == 'F') {
            int x, y;
            char c;
            in >> x >> y >> c;
            --x;
            --y;
            char old = g[y][x];
            if (old == c)
                continue;
            vector<pair<int, int>> st{{y, x}};
            g[y][x] = c;
            while (!st.empty()) {
                auto [r, s] = st.back();
                st.pop_back();
                for (auto [dr, dc] : vector<pair<int, int>>{{1, 0}, {-1, 0}, {0, 1}, {0, -1}}) {
                    int a = r + dr, b = s + dc;
                    if (a >= 0 && a < n && b >= 0 && b < m && g[a][b] == old) {
                        g[a][b] = c;
                        st.emplace_back(a, b);
                    }
                }
            }
        } else if (op == 'S') {
            string name;
            in >> name;
            cout << name << '\n';
            for (auto &r : g)
                cout << r << '\n';
        }
    }
}
`,
    python: String.raw`import sys

grid = []
for line in sys.stdin.read().splitlines():
    p = line.split()
    if not p:
        continue
    op = p[0]
    if op == "X":
        break
    if op == "I":
        width, height = map(int, p[1:])
        grid = [["O"] * width for _ in range(height)]
    elif op == "C":
        grid = [["O"] * width for _ in range(height)]
    elif op == "L":
        x, y = int(p[1]) - 1, int(p[2]) - 1
        grid[y][x] = p[3]
    elif op in ("V", "H", "K"):
        if op == "V":
            x, a, b = map(int, p[1:4])
            x1 = x2 = x
            y1, y2 = sorted((a, b))
        elif op == "H":
            a, b, y = map(int, p[1:4])
            x1, x2 = sorted((a, b))
            y1 = y2 = y
        else:
            a, b, x, y = map(int, p[1:5])
            x1, x2 = sorted((a, x))
            y1, y2 = sorted((b, y))
        for row in range(y1 - 1, y2):
            for col in range(x1 - 1, x2):
                grid[row][col] = p[-1]
    elif op == "F":
        x, y, color = int(p[1]) - 1, int(p[2]) - 1, p[3]
        old = grid[y][x]
        if old == color:
            continue
        stack = [(y, x)]
        grid[y][x] = color
        while stack:
            r, c = stack.pop()
            for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                a, b = r + dr, c + dc
                if 0 <= a < height and 0 <= b < width and grid[a][b] == old:
                    grid[a][b] = color
                    stack.append((a, b))
    elif op == "S":
        print(p[1])
        for row in grid:
            print("".join(row))
`,
  }),
  defineCpeLesson("a542", {
    topic: "basics",
    level: "easy",
    concept: "混色需求分解成三個累積器",
    goal: "把每種顏色對應到所需原色，再逐一扣除。",
    explanation: [
      "依顏色需求表分解：M、R、V、B 需洋紅，Y、R、G、B 需黃，C、G、V、B 需青。白色 W 不使用任何原色。三種顏料獨立統計，因此不需要模擬混色順序或尋找配方。",
      "掃描完整像素字串，對所需原色各減 1。最後若任一剩餘值小於 0，表示有一種原料不足，輸出 NO；全部非負就依 M、Y、C 次序輸出 YES 與剩餘量。即使提早知道不足，仍要讀完整幅畫，不能讓後續資料錯位。",
    ],
    complexity: "每筆時間 O(|S|)，額外空間 O(1)（不含輸入字串）。",
    pitfall: "黑色 B 三種各用一單位，紫色字元是 V；YES 後的順序是 M、Y、C。",
    traceLabel: "示意：庫存 M=3、Y=2、C=2，畫 RVC",
    trace: [
      {
        title: "畫 R",
        description: "紅色用 M+Y。",
        cells: ["M:2", "Y:1", "C:2"],
        active: [0, 1, 2],
        variables: [["已處理", "1"]],
      },
      {
        title: "畫 V",
        description: "紫色用 M+C。",
        cells: ["M:1", "Y:1", "C:1"],
        active: [0, 1, 2],
        variables: [["已處理", "2"]],
      },
      {
        title: "畫 C",
        description: "青色只用 C，全部仍非負。",
        cells: ["M:1", "Y:1", "C:0"],
        active: [0, 1, 2],
        variables: [
          ["已處理", "3"],
          ["輸出", "YES 1 1 0"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <string>
#include <sstream>
#include <algorithm>
#include <numeric>
#include <cmath>
#include <iomanip>
#include <queue>
#include <deque>
#include <map>
#include <set>
#include <unordered_map>
#include <unordered_set>
#include <array>
#include <tuple>
#include <functional>
#include <limits>
#include <cstdint>
#include <cctype>
#include <utility>
using namespace std;

int main() {
    int t;
    cin >> t;
    while (t--) {
        long long m, y, c;
        string s;
        cin >> m >> y >> c >> s;
        for (char ch : s) {
            if (string("MRVB").find(ch) != string::npos)
                --m;
            if (string("YRGB").find(ch) != string::npos)
                --y;
            if (string("CGVB").find(ch) != string::npos)
                --c;
        }
        if (min({m, y, c}) < 0)
            cout << "NO\n";
        else
            cout << "YES " << m << ' ' << y << ' ' << c << '\n';
    }
}
`,
    python: String.raw`import sys

it = iter(sys.stdin.read().split())
for _ in range(int(next(it))):
    m, y, c, picture = int(next(it)), int(next(it)), int(next(it)), next(it)
    for color in picture:
        m -= color in "MRVB"
        y -= color in "YRGB"
        c -= color in "CGVB"
    if min(m, y, c) < 0:
        print("NO")
    else:
        print("YES", m, y, c)
`,
  }),
  defineCpeLesson("a543", {
    topic: "search",
    level: "hard",
    concept: "二分最大工作量與反向重建",
    goal: "先最小化最大段和，再讓前段在最佳限制下盡量短。",
    explanation: [
      "猜測上限 B 後，從左至右把能放的書盡量放在同一人，超過 B 才開新段。這會使使用段數最少，所以所需段數≤k 時 B 可行；因 k≤m，也可再拆成恰好 k 段。可行性對 B 單調，在最大單本頁數到總頁數間二分。",
      "得到最佳 B 後由右向左重建，讓最後一段盡量多拿。當加入下一本會超過 B，或剩下書數必須保留給左方每人一本，就切段。右邊盡量滿，等價於把左邊各段頁數依序最小化。每個分隔符號 / 與數字之間都用單一空白，恰好 k−1 個分隔符號。",
    ],
    complexity: "時間 O(m log Σp)，空間 O(m)。",
    pitfall:
      "只按容量切可能留下不足一本的空段；重建還要保留剩餘抄寫員所需的最少書數。總和使用 64 位元。",
    traceLabel: "示意：頁數100、100、100、100、100，k=4",
    trace: [
      {
        title: "二分界限",
        description: "單本下界100，總和上界500；B=100 要5人，B=200只需3人。",
        cells: ["100", "100", "100", "100", "100"],
        active: [0, 1, 2, 3, 4],
        variables: [["最佳上限", "200"]],
      },
      {
        title: "反向填最後一段",
        description: "最後兩本共200，已達上限。",
        cells: ["左剩3本", "最後段100+100"],
        active: [0, 1],
        variables: [
          ["剩餘人數", "3"],
          ["最後段和", "200"],
        ],
      },
      {
        title: "強制各留一本",
        description: "左邊3本恰分給3人，結果為100 / 100 / 100 / 100 100。",
        cells: ["100", "100", "100", "100+100"],
        active: [0, 1, 2, 3],
        variables: [
          ["段數", "4"],
          ["最大段和", "200"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <string>
#include <sstream>
#include <algorithm>
#include <numeric>
#include <cmath>
#include <iomanip>
#include <queue>
#include <deque>
#include <map>
#include <set>
#include <unordered_map>
#include <unordered_set>
#include <array>
#include <tuple>
#include <functional>
#include <limits>
#include <cstdint>
#include <cctype>
#include <utility>
using namespace std;

int main() {
    int t;
    cin >> t;
    while (t--) {
        int m, k;
        cin >> m >> k;
        vector<long long> a(m);
        for (auto &x : a)
            cin >> x;
        long long lo = *max_element(a.begin(), a.end()), hi = accumulate(a.begin(), a.end(), 0LL);
        while (lo < hi) {
            long long mid = (lo + hi) / 2, sum = 0;
            int groups = 1;
            for (long long x : a) {
                if (sum + x > mid) {
                    ++groups;
                    sum = 0;
                }
                sum += x;
            }
            if (groups <= k)
                hi = mid;
            else
                lo = mid + 1;
        }
        vector<bool> cut(m, false);
        long long sum = 0;
        int groups = k;
        for (int i = m - 1; i >= 0; --i) {
            if (sum + a[i] > lo || i + 1 < groups) {
                cut[i] = true;
                --groups;
                sum = 0;
            }
            sum += a[i];
        }
        for (int i = 0; i < m; ++i) {
            if (i)
                cout << ' ';
            cout << a[i];
            if (cut[i])
                cout << " /";
        }
        cout << '\n';
    }
}
`,
    python: String.raw`import sys

it = iter(map(int, sys.stdin.read().split()))
for _ in range(next(it)):
    m, k = next(it), next(it)
    pages = [next(it) for _ in range(m)]
    low, high = max(pages), sum(pages)
    while low < high:
        bound = (low + high) // 2
        groups, load = 1, 0
        for page in pages:
            if load + page > bound:
                groups += 1
                load = 0
            load += page
        if groups <= k:
            high = bound
        else:
            low = bound + 1
    cuts = set()
    groups, load = k, 0
    for i in range(m - 1, -1, -1):
        if load + pages[i] > low or i + 1 < groups:
            cuts.add(i)
            groups -= 1
            load = 0
        load += pages[i]
    output = []
    for i, page in enumerate(pages):
        output.append(str(page))
        if i in cuts:
            output.append("/")
    print(" ".join(output))
`,
  }),
  defineCpeLesson("a544", {
    topic: "math",
    level: "easy",
    concept: "最壞嘗試次數的等差和",
    goal: "把每次排除一把鑰匙後的測試成本相加。",
    explanation: [
      "第一把鑰匙有 m 扇候選門，最壞測試 m−1 次後即可由排除法確定最後一扇，不需要真的再插一次。確定後移除一把鑰匙與一扇門，第二把最多 m−2 次；第 n 把最多 m−n 次。",
      "每輪在答案揭曉前都可能連續失敗，因此這些次數既能達成也不能再少。總和是 (m−1)+(m−2)+…+(m−n)=n(2m−n−1)/2。先做整數乘法再除二，n=m=1 時自然是 0。最多十萬筆資料，每筆只用常數次運算。",
    ],
    complexity: "每筆時間 O(1)，空間 O(1)。",
    pitfall:
      "唯一候選門可直接推知，不能把各輪成本誤寫成 m、m−1、…。乘積使用 64 位元。",
    traceLabel: "示意：n=3、m=5",
    trace: [
      {
        title: "第一把",
        description: "5 扇門最壞先排除4扇。",
        cells: ["候選5", "成本4"],
        active: [0, 1],
        variables: [["累計", "4"]],
      },
      {
        title: "第二把",
        description: "移除已確定的一對，剩4扇門，最多3次。",
        cells: ["候選4", "成本3"],
        active: [0, 1],
        variables: [["累計", "7"]],
      },
      {
        title: "第三把",
        description: "剩3扇門，最多2次，總共9次。",
        cells: ["候選3", "成本2"],
        active: [0, 1],
        variables: [
          ["累計", "9"],
          ["公式", "3×(10−3−1)/2=9"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <string>
#include <sstream>
#include <algorithm>
#include <numeric>
#include <cmath>
#include <iomanip>
#include <queue>
#include <deque>
#include <map>
#include <set>
#include <unordered_map>
#include <unordered_set>
#include <array>
#include <tuple>
#include <functional>
#include <limits>
#include <cstdint>
#include <cctype>
#include <utility>
using namespace std;

int main() {
    int t;
    cin >> t;
    while (t--) {
        long long n, m;
        cin >> n >> m;
        cout << n * (2 * m - n - 1) / 2 << '\n';
    }
}
`,
    python: String.raw`import sys

it = iter(map(int, sys.stdin.read().split()))
for _ in range(next(it)):
    n, m = next(it), next(it)
    print(n * (2 * m - n - 1) // 2)
`,
  }),
  defineCpeLesson("a545", {
    topic: "simulation",
    level: "medium",
    concept: "游標、模式與固定尺寸畫面",
    goal: "逐字解析控制序列，把寫字與游標移動明確分離。",
    explanation: [
      "狀態包括十列十欄的畫面、游標列欄與插入模式旗標。普通字元在覆寫模式直接替換；插入模式要從右往左搬移同列字元，再填游標格。兩種模式寫完都只把欄位加一且截在 9，不會換列。",
      "遇到 ^ 先讀下一個字元；若是數字，再讀一個數字當欄座標；^^ 則把 ^ 送入一般寫字程序。其他控制命令只改指定狀態，例如 ^c 清畫面卻不重設游標，^h 只回原點。N 行間換行忽略，但空白必須當文字讀進來；N=0 結束，輸出每列完整十字元及邊框。",
    ],
    complexity: "輸入字元數 L 的時間 O(L)，空間 O(1)，每次插入最多搬9字元。",
    pitfall:
      "用 getline 保留空白；清畫面不等於回原點，插入時要由右往左搬，避免覆蓋來源。",
    traceLabel: "示意：輸入 ABC^h^iZ",
    trace: [
      {
        title: "覆寫 ABC",
        description: "第一列成為 ABC 加七個空白，游標在第3欄。",
        cells: ["A", "B", "C", "空白×7"],
        active: [0, 1, 2, 3],
        variables: [
          ["列", "0"],
          ["欄", "3"],
        ],
      },
      {
        title: "回原點與切模式",
        description: "^h 回(0,0)，^i 切換插入。",
        cells: ["A", "B", "C", "空白×7"],
        active: [0, 1, 2, 3],
        variables: [
          ["列", "0"],
          ["欄", "0"],
          ["插入", "1"],
        ],
      },
      {
        title: "插入 Z",
        description: "原有 ABC 右移，得到 ZABC 加六個空白，游標到1。",
        cells: ["Z", "A", "B", "C", "空白×6"],
        active: [0, 1, 2, 3, 4],
        variables: [
          ["欄", "1"],
          ["列寬", "10"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <string>
#include <sstream>
#include <algorithm>
#include <numeric>
#include <cmath>
#include <iomanip>
#include <queue>
#include <deque>
#include <map>
#include <set>
#include <unordered_map>
#include <unordered_set>
#include <array>
#include <tuple>
#include <functional>
#include <limits>
#include <cstdint>
#include <cctype>
#include <utility>
using namespace std;

int main() {
    int n, tc = 0;
    string line;
    while (cin >> n && n) {
        getline(cin, line);
        vector<string> g(10, string(10, ' '));
        int r = 0, c = 0;
        bool insert = false;
        auto write = [&](char ch) {
            if (insert)
                for (int j = 9; j > c; --j)
                    g[r][j] = g[r][j - 1];
            g[r][c] = ch;
            c = min(9, c + 1);
        };
        for (int row = 0; row < n; ++row) {
            getline(cin, line);
            for (size_t i = 0; i < line.size(); ++i) {
                char ch = line[i];
                if (ch != '^') {
                    write(ch);
                    continue;
                }
                ch = line[++i];
                if (ch >= '0' && ch <= '9') {
                    r = ch - '0';
                    c = line[++i] - '0';
                } else if (ch == '^')
                    write('^');
                else if (ch == 'b')
                    c = 0;
                else if (ch == 'c')
                    for (auto &s : g)
                        s.assign(10, ' ');
                else if (ch == 'd')
                    r = min(9, r + 1);
                else if (ch == 'u')
                    r = max(0, r - 1);
                else if (ch == 'l')
                    c = max(0, c - 1);
                else if (ch == 'r')
                    c = min(9, c + 1);
                else if (ch == 'e')
                    for (int j = c; j < 10; ++j)
                        g[r][j] = ' ';
                else if (ch == 'h')
                    r = c = 0;
                else if (ch == 'i')
                    insert = true;
                else if (ch == 'o')
                    insert = false;
            }
        }
        cout << "Case " << ++tc << "\n+----------+\n";
        for (auto &s : g)
            cout << '|' << s << "|\n";
        cout << "+----------+\n";
    }
}
`,
    python: String.raw`import sys

lines = iter(sys.stdin.read().splitlines())
case = 0
for line in lines:
    n = int(line)
    if n == 0:
        break
    screen = [[" "] * 10 for _ in range(10)]
    r = c = 0
    insert = False
    for _ in range(n):
        text = next(lines)
        i = 0
        while i < len(text):
            ch = text[i]
            i += 1
            writing = True
            if ch == "^":
                command = text[i]
                i += 1
                writing = False
                if command.isdigit():
                    r, c = int(command), int(text[i])
                    i += 1
                elif command == "^":
                    ch, writing = "^", True
                elif command == "b":
                    c = 0
                elif command == "c":
                    screen = [[" "] * 10 for _ in range(10)]
                elif command == "d":
                    r = min(9, r + 1)
                elif command == "u":
                    r = max(0, r - 1)
                elif command == "l":
                    c = max(0, c - 1)
                elif command == "r":
                    c = min(9, c + 1)
                elif command == "e":
                    screen[r][c:] = [" "] * (10 - c)
                elif command == "h":
                    r = c = 0
                elif command == "i":
                    insert = True
                elif command == "o":
                    insert = False
            if writing:
                if insert:
                    for j in range(9, c, -1):
                        screen[r][j] = screen[r][j - 1]
                screen[r][c] = ch
                c = min(9, c + 1)
    case += 1
    print(f"Case {case}")
    print("+----------+")
    for row in screen:
        print("|" + "".join(row) + "|")
    print("+----------+")
`,
  }),
  defineCpeLesson("a546", {
    topic: "trees",
    level: "hard",
    concept: "邏輯元素與並查集節點分離",
    goal: "用新節點代表移動後的元素，避免搬走整棵子樹。",
    explanation: [
      "一般並查集中的節點可能有其他節點掛在下面，直接改 p 的父親會把整個子樹一起搬走。因此增加 id[p]，指向元素 p 目前有效的實體節點。根額外保存有效元素個數與元素值總和，這兩個量不等於實體節點數。",
      "合併時查找 id[p]、id[q] 的根並更新統計。移動時先從舊根扣掉一個元素與 p，再配置全新節點，更新 id[p]，把新節點接到 q 的根並增加統計；舊節點保留為結構上的空殼。最多每次操作新增一個節點，配合路徑壓縮與實體樹大小合併，仍是近常數攤銷時間。每筆讀至 EOF，查詢總和用64位元。",
    ],
    complexity: "時間 O((n+m)α(n+m))，空間 O(n+m)。",
    pitfall: "同集合的移動與合併要直接忽略；並查集的根值總和不能以根編號推算。",
    traceLabel: "示意：初始1、2、3，先合併1與2，再把1移到3",
    trace: [
      {
        title: "合併",
        description: "集合為 {1,2} 與 {3}。",
        cells: ["{1,2}:數2和3", "{3}:數1和3"],
        active: [0, 1],
        variables: [["id[1]", "1"]],
      },
      {
        title: "搬離舊集合",
        description: "舊根統計扣去1，為元素1建立新節點4。",
        cells: ["{2}:數1和2", "新節點4代表1"],
        active: [0, 1],
        variables: [
          ["id[1]", "4"],
          ["舊集合和", "2"],
        ],
      },
      {
        title: "接到目標",
        description: "新節點4掛到3的根；查詢1得到2個、總和4。",
        cells: ["{2}", "{1,3}"],
        active: [0, 1],
        variables: [
          ["查詢1", "2 4"],
          ["查詢2", "1 2"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <string>
#include <sstream>
#include <algorithm>
#include <numeric>
#include <cmath>
#include <iomanip>
#include <queue>
#include <deque>
#include <map>
#include <set>
#include <unordered_map>
#include <unordered_set>
#include <array>
#include <tuple>
#include <functional>
#include <limits>
#include <cstdint>
#include <cctype>
#include <utility>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, m;
    while (cin >> n >> m) {
        int cap = n + m + 1, last = n;
        vector<int> parent(cap), weight(cap, 1), id(n + 1), count(cap, 1);
        vector<long long> sum(cap);
        iota(parent.begin(), parent.end(), 0);
        iota(id.begin(), id.end(), 0);
        for (int i = 1; i <= n; ++i)
            sum[i] = i;
        auto find = [&](int x) {
            while (parent[x] != x) {
                parent[x] = parent[parent[x]];
                x = parent[x];
            }
            return x;
        };
        while (m--) {
            int op, p, q;
            cin >> op >> p;
            int a = find(id[p]);
            if (op == 3) {
                cout << count[a] << ' ' << sum[a] << '\n';
                continue;
            }
            cin >> q;
            int b = find(id[q]);
            if (a == b)
                continue;
            if (op == 1) {
                if (weight[a] < weight[b])
                    swap(a, b);
                parent[b] = a;
                weight[a] += weight[b];
                count[a] += count[b];
                sum[a] += sum[b];
            } else {
                --count[a];
                sum[a] -= p;
                id[p] = ++last;
                parent[last] = b;
                ++weight[b];
                ++count[b];
                sum[b] += p;
            }
        }
    }
}
`,
    python: String.raw`import sys

it = iter(map(int, sys.stdin.buffer.read().split()))
for n in it:
    m = next(it)
    capacity, last = n + m + 1, n
    parent = list(range(capacity))
    weight, count = [1] * capacity, [1] * capacity
    total = list(range(capacity))
    node = list(range(n + 1))

    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    output = []
    for _ in range(m):
        op, p = next(it), next(it)
        a = find(node[p])
        if op == 3:
            output.append(f"{count[a]} {total[a]}")
            continue
        q = next(it)
        b = find(node[q])
        if a == b:
            continue
        if op == 1:
            if weight[a] < weight[b]:
                a, b = b, a
            parent[b] = a
            weight[a] += weight[b]
            count[a] += count[b]
            total[a] += total[b]
        else:
            count[a] -= 1
            total[a] -= p
            last += 1
            node[p] = last
            parent[last] = b
            weight[b] += 1
            count[b] += 1
            total[b] += p
    if output:
        print("\n".join(output))
`,
  }),
  defineCpeLesson("a547", {
    topic: "number-theory",
    level: "medium",
    concept: "階乘尾零只在5的倍數處改變",
    goal: "計算函數的變化次數，避免把跳過的尾零數也算進去。",
    explanation: [
      "階乘尾零個數等於質因數5的數量，因此 fzero(n)=⌊n/5⌋+⌊n/25⌋+…。從 n−1 到 n，只有當 n 是5的倍數時才會增加；每次增加量可能大於1，例如25!比24!多兩個尾零。",
      "函數單調，而且每個5的倍數都嚴格產生一個新值，不論它跳升幾格。區間內第一個值先算1，之後的改變點數等於 (low,high] 中5的倍數數量，因此答案為 high//5−low//5+1。這不是 fzero(high)−fzero(low)+1。0 0 結束，9×10¹⁸仍在有號64位元範圍內。",
    ],
    complexity: "每筆時間 O(1)，空間 O(1)。",
    pitfall: "low 本身若是5的倍數，它的值已在最初那1種中，不可重複算改變點。",
    traceLabel: "示意：區間 [24,26]",
    trace: [
      {
        title: "起點",
        description: "24! 尾零為 floor(24/5)=4。",
        cells: ["24→4"],
        active: [0],
        variables: [["不同值數", "1"]],
      },
      {
        title: "跨過25",
        description: "25! 尾零為5+1=6，直接跳過5。",
        cells: ["24→4", "25→6"],
        active: [0, 1],
        variables: [["不同值數", "2"]],
      },
      {
        title: "26不改變",
        description: "26! 仍有6個尾零，公式5−4+1=2。",
        cells: ["24→4", "25→6", "26→6"],
        active: [0, 1, 2],
        variables: [
          ["答案", "2"],
          ["不是", "6−4+1=3"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <string>
#include <sstream>
#include <algorithm>
#include <numeric>
#include <cmath>
#include <iomanip>
#include <queue>
#include <deque>
#include <map>
#include <set>
#include <unordered_map>
#include <unordered_set>
#include <array>
#include <tuple>
#include <functional>
#include <limits>
#include <cstdint>
#include <cctype>
#include <utility>
using namespace std;

int main() {
    long long lo, hi;
    while (cin >> lo >> hi && (lo || hi))
        cout << hi / 5 - lo / 5 + 1 << '\n';
}
`,
    python: String.raw`import sys

it = iter(map(int, sys.stdin.read().split()))
for low in it:
    high = next(it)
    if low == high == 0:
        break
    print(high // 5 - low // 5 + 1)
`,
  }),
  defineCpeLesson("a548", {
    topic: "strings",
    level: "medium",
    concept: "位元集合記錄不同子序列",
    goal: "以字母組合去重，而不是累計位置選法。",
    explanation: [
      "掃描字元 c 之前，seen 是已出現的單字母集合，pairs[b] 是已可形成 ab 的所有首字母 a。triples[b][c] 是已形成 abc 的首字母集合。看到 c 時，對每個 b 做 triples[b][c] |= pairs[b]，用位元 OR 自動消除不同位置產生的同一字串。",
      "接著更新 pairs[c] |= seen，最後把 c 加進 seen。必須先更新三字母、再雙字母、再單字母，才能保證三個選取位置嚴格遞增，不會重用當前字元。最後把26×26個位元集合的位元數相加；答案最多26³，短於3的字串自然為0。",
    ],
    complexity: "時間 O(26|S|+26²)，空間 O(26²)。",
    pitfall: "題目數的是不同的三字母字串，AAAAAAA 的答案為1，不是 C(7,3)。",
    traceLabel: "示意：字串 ABAB",
    trace: [
      {
        title: "前兩字",
        description: "讀 A、B 後，seen={A,B}，雙字母只有 AB。",
        cells: ["seen:A,B", "pairs[B]:A"],
        active: [0, 1],
        variables: [["不同三字母", "0"]],
      },
      {
        title: "讀第三字 A",
        description: "AB 接 A 產生 ABA，再新增 AA、BA。",
        cells: ["ABA", "AA", "AB", "BA"],
        active: [0, 1, 2, 3],
        variables: [["不同三字母", "1"]],
      },
      {
        title: "讀第四字 B",
        description: "原有 AA、AB、BA 分別接 B，新增 AAB、ABB、BAB。",
        cells: ["ABA", "AAB", "ABB", "BAB"],
        active: [0, 1, 2, 3],
        variables: [["答案", "4"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <string>
#include <sstream>
#include <algorithm>
#include <numeric>
#include <cmath>
#include <iomanip>
#include <queue>
#include <deque>
#include <map>
#include <set>
#include <unordered_map>
#include <unordered_set>
#include <array>
#include <tuple>
#include <functional>
#include <limits>
#include <cstdint>
#include <cctype>
#include <utility>
using namespace std;

int main() {
    int t;
    cin >> t;
    while (t--) {
        string s;
        cin >> s;
        uint32_t seen = 0;
        array<uint32_t, 26> pairs{};
        array<array<uint32_t, 26>, 26> triples{};
        for (char ch : s) {
            int c = ch - 'A';
            for (int b = 0; b < 26; ++b)
                triples[b][c] |= pairs[b];
            pairs[c] |= seen;
            seen |= uint32_t(1) << c;
        }
        int ans = 0;
        for (auto &row : triples)
            for (uint32_t mask : row)
                while (mask) {
                    ++ans;
                    mask &= mask - 1;
                }
        cout << ans << '\n';
    }
}
`,
    python: String.raw`import sys

it = iter(sys.stdin.read().split())
for _ in range(int(next(it))):
    s = next(it)
    seen = 0
    pairs = [0] * 26
    triples = [[0] * 26 for _ in range(26)]
    for ch in s:
        c = ord(ch) - 65
        for b in range(26):
            triples[b][c] |= pairs[b]
        pairs[c] |= seen
        seen |= 1 << c
    print(sum(mask.bit_count() for row in triples for mask in row))
`,
  }),
  defineCpeLesson("a549", {
    topic: "dp",
    level: "hard",
    concept: "圓周展開與兩種補片的後綴DP",
    goal: "枚舉第一個洞，讓補片從未覆蓋的最左洞開始。",
    explanation: [
      "先排序洞位置，再複製一份並加上周長 C，把跨起點的補片變成一般直線區間。任何方案都可以讓某片從它覆蓋的第一個洞開始而不變差，因此枚舉這個第一洞 s，處理展開後恰好 N 個洞 [s,s+N)。",
      "固定 s 時，dp[i] 是覆蓋第 i 個到最後洞的最小總長。從 i 開始放長 t 的補片，會涵蓋所有位置≤F[i]+t 的洞；令 next_t[i] 為第一個嚴格超出的洞，轉移取 t+dp[min(next_t[i],s+N)]。兩種 t 取小。next 用雙指標預算，每個切點做一次線性 DP，總共 O(N²)。EOF 結束。",
    ],
    complexity: "時間 O(N²+N log N)，空間 O(N)。",
    pitfall:
      "距離恰等補片長度的兩洞可一起覆蓋，所以 next 判斷必須是 >，而不是 ≥；洞未必已排序。",
    traceLabel: "示意：C=12，洞0、3、9，補片3或5",
    trace: [
      {
        title: "展開圓周",
        description: "排序並複製成0、3、9、12、15、21。",
        cells: ["0", "3", "9", "12", "15", "21"],
        active: [0, 1, 2, 3, 4, 5],
        variables: [["N", "3"]],
      },
      {
        title: "切在9",
        description: "處理9、12、15；長3補片從9可蓋9與12。",
        cells: ["9→12:長3", "剩15"],
        active: [0, 1],
        variables: [
          ["下一洞", "15"],
          ["已付", "3"],
        ],
      },
      {
        title: "補最後洞",
        description: "15另用長3，總長6；其他切點也不會低於6。",
        cells: ["[9,12]", "[15,18]"],
        active: [0, 1],
        variables: [
          ["總長", "6"],
          ["答案", "6"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <string>
#include <sstream>
#include <algorithm>
#include <numeric>
#include <cmath>
#include <iomanip>
#include <queue>
#include <deque>
#include <map>
#include <set>
#include <unordered_map>
#include <unordered_set>
#include <array>
#include <tuple>
#include <functional>
#include <limits>
#include <cstdint>
#include <cctype>
#include <utility>
using namespace std;

int main() {
    int n;
    long long c, t1, t2;
    while (cin >> n >> c >> t1 >> t2) {
        vector<long long> x(2 * n);
        for (int i = 0; i < n; ++i)
            cin >> x[i];
        sort(x.begin(), x.begin() + n);
        for (int i = 0; i < n; ++i)
            x[i + n] = x[i] + c;
        vector<vector<int>> next(2, vector<int>(2 * n));
        long long lengths[2] = {t1, t2};
        for (int z = 0; z < 2; ++z) {
            int j = 0;
            for (int i = 0; i < 2 * n; ++i) {
                j = max(j, i);
                while (j < 2 * n && x[j] <= x[i] + lengths[z])
                    ++j;
                next[z][i] = j;
            }
        }
        long long ans = n * min(t1, t2);
        vector<long long> dp(2 * n + 1);
        for (int s = 0; s < n; ++s) {
            int end = s + n;
            dp[end] = 0;
            for (int i = end - 1; i >= s; --i)
                dp[i] = min(t1 + dp[min(end, next[0][i])], t2 + dp[min(end, next[1][i])]);
            ans = min(ans, dp[s]);
        }
        cout << ans << '\n';
    }
}
`,
    python: String.raw`import sys

it = iter(map(int, sys.stdin.read().split()))
for n in it:
    circumference, t1, t2 = next(it), next(it), next(it)
    first = sorted(next(it) for _ in range(n))
    x = first + [v + circumference for v in first]
    jumps = []
    for length in (t1, t2):
        jump, j = [0] * (2 * n), 0
        for i in range(2 * n):
            j = max(j, i)
            while j < 2 * n and x[j] <= x[i] + length:
                j += 1
            jump[i] = j
        jumps.append(jump)
    answer = n * min(t1, t2)
    dp = [0] * (2 * n + 1)
    for start in range(n):
        end = start + n
        dp[end] = 0
        for i in range(end - 1, start - 1, -1):
            dp[i] = min(t1 + dp[min(end, jumps[0][i])], t2 + dp[min(end, jumps[1][i])])
        answer = min(answer, dp[start])
    print(answer)
`,
  }),
  defineCpeLesson("a550", {
    topic: "combinatorics",
    level: "hard",
    concept: "四邊空缺事件的容斥",
    goal: "用16個邊界子集合計算四邊都被占用的方案。",
    explanation: [
      "先不限制邊界，共有 C(MN,K) 種選格法。把某一邊沒人的情況視為壞事件，用容斥枚舉上、下、左、右四個事件的16種子集合。若選了 t 條水平邊與 l 條垂直邊禁止放人，可用格數是 (M−t)(N−l)。",
      "每個子集合貢獻 (−1)^(t+l) C((M−t)(N−l),K)。角落同時屬兩邊，其交集已包含在縮小矩形的計算中，不用額外修正。模數1000007不必假設為質數，直接用 Pascal 三角形預算到400，K超過可用格數就回傳0。輸出 Case k: A。",
    ],
    complexity: "預算時間與空間 O((MN)²)，每筆容斥 O(16)。",
    pitfall: "不可用未證明適用的模反元素公式；最後模運算應正規化成非負值。",
    traceLabel: "示意：2×3方格放2人",
    trace: [
      {
        title: "全部選法",
        description: "六格選兩格，共 C(6,2)=15。",
        cells: ["上:3格", "下:3格"],
        active: [0, 1],
        variables: [["全部", "15"]],
      },
      {
        title: "左右邊要求",
        description: "兩人必須一個在左欄、一個在右欄，共2×2=4種。",
        cells: ["左上+右上", "左上+右下", "左下+右上", "左下+右下"],
        active: [0, 1, 2, 3],
        variables: [["候選", "4"]],
      },
      {
        title: "上下邊要求",
        description: "同列的兩種不合法，剩兩種對角配置。",
        cells: ["左上+右下", "左下+右上"],
        active: [0, 1],
        variables: [["答案", "2"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <string>
#include <sstream>
#include <algorithm>
#include <numeric>
#include <cmath>
#include <iomanip>
#include <queue>
#include <deque>
#include <map>
#include <set>
#include <unordered_map>
#include <unordered_set>
#include <array>
#include <tuple>
#include <functional>
#include <limits>
#include <cstdint>
#include <cctype>
#include <utility>
using namespace std;

int main() {
    const int MOD = 1000007;
    vector<vector<int>> choose(401, vector<int>(401));
    choose[0][0] = 1;
    for (int n = 1; n <= 400; ++n) {
        choose[n][0] = 1;
        for (int k = 1; k <= n; ++k)
            choose[n][k] = (choose[n - 1][k - 1] + choose[n - 1][k]) % MOD;
    }
    int t;
    cin >> t;
    for (int tc = 1; tc <= t; ++tc) {
        int m, n, k;
        cin >> m >> n >> k;
        long long ans = 0;
        for (int mask = 0; mask < 16; ++mask) {
            int rows = m - ((mask >> 0) & 1) - ((mask >> 1) & 1);
            int cols = n - ((mask >> 2) & 1) - ((mask >> 3) & 1);
            int bits = 0;
            for (int v = mask; v; v &= v - 1)
                ++bits;
            int ways = k <= rows * cols ? choose[rows * cols][k] : 0;
            ans += (bits % 2 ? -ways : ways);
        }
        ans = (ans % MOD + MOD) % MOD;
        cout << "Case " << tc << ": " << ans << '\n';
    }
}
`,
    python: String.raw`import sys

MOD = 1000007
choose = [[0] * 401 for _ in range(401)]
choose[0][0] = 1
for n in range(1, 401):
    choose[n][0] = 1
    for k in range(1, n + 1):
        choose[n][k] = (choose[n - 1][k - 1] + choose[n - 1][k]) % MOD
it = iter(map(int, sys.stdin.read().split()))
for case in range(1, next(it) + 1):
    rows, cols, k = next(it), next(it), next(it)
    answer = 0
    for mask in range(16):
        m = rows - (mask & 1) - ((mask >> 1) & 1)
        n = cols - ((mask >> 2) & 1) - ((mask >> 3) & 1)
        ways = choose[m * n][k] if k <= m * n else 0
        answer += -ways if mask.bit_count() % 2 else ways
    print(f"Case {case}: {answer % MOD}")
`,
  }),
  defineCpeLesson("a551", {
    topic: "trees",
    level: "medium",
    concept: "週期事件的最小堆積",
    goal: "以時間與原始優先順序決定下一次服藥。",
    explanation: [
      "每種藥只把下一次服藥事件放進最小堆積，鍵為 (時間,輸入編號)。第一次時間等於 frequency，輸入編號越小重要性越高，所以相同時間會自然按照題意排序，不能用藥名字典序代替。",
      "每次取出最小事件，輸出它的時間與藥名，再把相同藥物的時間增加自己的 frequency 後放回。堆積始終包含每種藥尚未處理的最早事件，因此連續取出 k 次就是所求；不同測例不額外加空白行。",
    ],
    complexity: "時間 O(n+k log n)，空間 O(n)。",
    pitfall: "重排事件仍保留原始優先編號；同時服兩種藥算兩次，不是一次。",
    traceLabel: "示意：A每2、B每3，A優先",
    trace: [
      {
        title: "初始事件",
        description: "第一次服藥在2與3。",
        cells: ["(2,A)", "(3,B)"],
        active: [0, 1],
        variables: [["事件數", "2"]],
      },
      {
        title: "取出兩次",
        description: "2服A後排4；3服B後排6。",
        cells: ["輸出2 A", "輸出3 B", "待辦4 A、6 B"],
        active: [0, 1, 2],
        variables: [["已輸出", "2"]],
      },
      {
        title: "處理同時事件",
        description: "4服A後排6，時間6先A再B。",
        cells: ["4 A", "6 A", "6 B"],
        active: [0, 1, 2],
        variables: [["前5次", "2,3,4,6,6"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <string>
#include <sstream>
#include <algorithm>
#include <numeric>
#include <cmath>
#include <iomanip>
#include <queue>
#include <deque>
#include <map>
#include <set>
#include <unordered_map>
#include <unordered_set>
#include <array>
#include <tuple>
#include <functional>
#include <limits>
#include <cstdint>
#include <cctype>
#include <utility>
using namespace std;

int main() {
    int t;
    cin >> t;
    while (t--) {
        int n, k;
        cin >> n >> k;
        vector<string> name(n);
        vector<int> freq(n);
        using E = pair<long long, int>;
        vector<E> events;
        for (int i = 0; i < n; ++i) {
            cin >> name[i] >> freq[i];
            events.emplace_back(freq[i], i);
        }
        priority_queue<E, vector<E>, greater<E>> pq(greater<E>(), move(events));
        while (k--) {
            auto [time, i] = pq.top();
            pq.pop();
            cout << time << ' ' << name[i] << '\n';
            pq.emplace(time + freq[i], i);
        }
    }
}
`,
    python: String.raw`import sys
import heapq

it = iter(sys.stdin.read().split())
for _ in range(int(next(it))):
    n, k = int(next(it)), int(next(it))
    names, frequency, events = [], [], []
    for i in range(n):
        names.append(next(it))
        frequency.append(int(next(it)))
        events.append((frequency[-1], i))
    heapq.heapify(events)
    for _ in range(k):
        time, i = heapq.heappop(events)
        print(time, names[i])
        heapq.heappush(events, (time + frequency[i], i))
`,
  }),
  defineCpeLesson("a552", {
    topic: "sorting",
    level: "easy",
    concept: "有向需求的反向計數",
    goal: "逐對比較兩個方向的學生數，保留重複需求的次數。",
    explanation: [
      "將每位學生的 (A,B) 當成有向需求，累計出現次數。所有學生都能配對，若且唯若對每一對地點都有 count(A,B)=count(B,A)，因為每個 A→B 只能消耗一個 B→A。",
      "用有序映射或雜湊表保存這些次數，讀完後檢查每個鍵的反向鍵。只比較各地出入總數並不足夠，例如1→2、2→3、3→1每地流量平衡，卻沒有任何反向對象。n=0 結束，每筆只印 YES 或 NO。",
    ],
    complexity: "C++時間 O(n log n)，Python期望 O(n)；空間 O(n)。",
    pitfall:
      "集合會丟掉重複次數，必須用計數表；交換配對要求直接反向，不能沿循環湊人。",
    traceLabel: "示意：1→2、1→2、2→1、2→1",
    trace: [
      {
        title: "讀兩筆正向",
        description: "(1,2) 累計2人，反向尚無。",
        cells: ["(1,2):2", "(2,1):0"],
        active: [0, 1],
        variables: [["未配對差", "2"]],
      },
      {
        title: "讀第三筆",
        description: "反向有1人，只能抵掉其中1人。",
        cells: ["(1,2):2", "(2,1):1"],
        active: [0, 1],
        variables: [["未配對差", "1"]],
      },
      {
        title: "讀第四筆",
        description: "兩個方向都是2，四人可以一對一配完。",
        cells: ["(1,2):2", "(2,1):2"],
        active: [0, 1],
        variables: [
          ["配對數", "2"],
          ["答案", "YES"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <string>
#include <sstream>
#include <algorithm>
#include <numeric>
#include <cmath>
#include <iomanip>
#include <queue>
#include <deque>
#include <map>
#include <set>
#include <unordered_map>
#include <unordered_set>
#include <array>
#include <tuple>
#include <functional>
#include <limits>
#include <cstdint>
#include <cctype>
#include <utility>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    while (cin >> n && n) {
        map<pair<int, int>, int> count;
        while (n--) {
            int a, b;
            cin >> a >> b;
            ++count[{a, b}];
        }
        bool ok = true;
        for (const auto &[key, value] : count) {
            auto it = count.find({key.second, key.first});
            if (it == count.end() || it->second != value) {
                ok = false;
                break;
            }
        }
        cout << (ok ? "YES" : "NO") << '\n';
    }
}
`,
    python: String.raw`import sys
from collections import Counter

it = iter(map(int, sys.stdin.buffer.read().split()))
for n in it:
    if n == 0:
        break
    count = Counter((next(it), next(it)) for _ in range(n))
    print("YES" if all(value == count[(b, a)] for (a, b), value in count.items()) else "NO")
`,
  }),
  defineCpeLesson("a553", {
    topic: "basics",
    level: "easy",
    concept: "日期字典序與已滿年齡",
    goal: "先判定未來出生，再按今年生日是否已過修正歲數。",
    explanation: [
      "把 DD/MM/YYYY 轉成 (年,月,日)，就能依字典序比較兩日期。若出生日期晚於目前日期，直接輸出 Invalid birth date，不能只比較年份，因為同年也可能尚未出生。",
      "其餘先算目前年減出生年，再比較 (目前月,目前日) 是否小於生日月日，尚未到就減1。算完的已滿歲數大於130才是 Check birth date；恰好130仍合法。日期 token 中沒有空白，讀 token 可同時處理題面描述的空白行與範例未附空白行的情況。每筆印 Case #k:。",
    ],
    complexity: "每筆時間 O(1)，空間 O(1)。",
    pitfall:
      "2月29日出生在非閏年2月28日仍未到生日，照月日直接比較即可；不要先以年份差判定超齡。",
    traceLabel: "示意：目前28/02/2005，出生29/02/2004",
    trace: [
      {
        title: "轉換格式",
        description: "比較年、月、日，不以日優先排序。",
        cells: ["目前(2005,2,28)", "出生(2004,2,29)"],
        active: [0, 1],
        variables: [["未來出生", "0"]],
      },
      {
        title: "年份差",
        description: "2005−2004 暫得1。",
        cells: ["2005−2004=1"],
        active: [0],
        variables: [["暫定年齡", "1"]],
      },
      {
        title: "檢查生日",
        description: "(2,28)<(2,29)，今年生日未到，所以減1。",
        cells: ["1−1=0"],
        active: [0],
        variables: [
          ["已滿歲數", "0"],
          ["輸出", "Case #1: 0"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <string>
#include <sstream>
#include <algorithm>
#include <numeric>
#include <cmath>
#include <iomanip>
#include <queue>
#include <deque>
#include <map>
#include <set>
#include <unordered_map>
#include <unordered_set>
#include <array>
#include <tuple>
#include <functional>
#include <limits>
#include <cstdint>
#include <cctype>
#include <utility>
using namespace std;

array<int, 3> date(string s) {
    int d, m, y;
    char slash;
    istringstream in(s);
    in >> d >> slash >> m >> slash >> y;
    return {y, m, d};
}
int main() {
    int t;
    cin >> t;
    for (int tc = 1; tc <= t; ++tc) {
        string a, b;
        cin >> a >> b;
        auto now = date(a), birth = date(b);
        cout << "Case #" << tc << ": ";
        if (birth > now) {
            cout << "Invalid birth date\n";
            continue;
        }
        int age = now[0] - birth[0] - (make_pair(now[1], now[2]) < make_pair(birth[1], birth[2]));
        if (age > 130)
            cout << "Check birth date\n";
        else
            cout << age << '\n';
    }
}
`,
    python: String.raw`import sys


def date(token):
    day, month, year = map(int, token.split("/"))
    return year, month, day


it = iter(sys.stdin.read().split())
for case in range(1, int(next(it)) + 1):
    now, birth = date(next(it)), date(next(it))
    if birth > now:
        result = "Invalid birth date"
    else:
        age = now[0] - birth[0] - (now[1:] < birth[1:])
        result = "Check birth date" if age > 130 else str(age)
    print(f"Case #{case}: {result}")
`,
  }),
  defineCpeLesson("a554", {
    topic: "dp",
    level: "medium",
    concept: "回文表與最少切段前綴DP",
    goal: "先確認每個區間是否回文，再選最後一段的位置。",
    explanation: [
      "回文判斷有重疊子問題：s[l..r] 是回文，若且唯若兩端字元相等，且長度不超過2或內層 s[l+1..r−1] 是回文。把 l 從右往左、r 從左往右填表，確保內層已算好。",
      "定義 dp[i] 為前 i 個字元的最少回文段數，dp[0]=0。枚舉最後一段的起點 l，只要 s[l..i−1] 回文，就用 dp[l]+1 更新 dp[i]。每個合法切法都有唯一最後一段，所以轉移涵蓋全部可能，且每段非空。每筆輸出 dp[n]。",
    ],
    complexity: "時間 O(n²)，空間 O(n²)。",
    pitfall:
      "不能只選目前最長回文作貪心；局部最長片段可能使剩餘部分需要更多段。",
    traceLabel: "示意：字串 aab",
    trace: [
      {
        title: "回文表",
        description: "單字元都回文，aa 也回文，ab 與 aab 不是。",
        cells: ["a:1", "aa:1", "aab:0", "b:1"],
        active: [0, 1, 2, 3],
        variables: [["n", "3"]],
      },
      {
        title: "前兩字",
        description: "dp[0]=0，dp[1]=1；整段 aa 可用一段，所以 dp[2]=1。",
        cells: ["dp0=0", "dp1=1", "dp2=1"],
        active: [0, 1, 2],
        variables: [["最後段", "aa"]],
      },
      {
        title: "完整字串",
        description: "最後只能取 b，dp[3]=dp[2]+1=2，分成 aa／b。",
        cells: ["aa", "b"],
        active: [0, 1],
        variables: [
          ["dp3", "2"],
          ["答案", "2"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <string>
#include <sstream>
#include <algorithm>
#include <numeric>
#include <cmath>
#include <iomanip>
#include <queue>
#include <deque>
#include <map>
#include <set>
#include <unordered_map>
#include <unordered_set>
#include <array>
#include <tuple>
#include <functional>
#include <limits>
#include <cstdint>
#include <cctype>
#include <utility>
using namespace std;

int main() {
    int t;
    cin >> t;
    while (t--) {
        string s;
        cin >> s;
        int n = s.size();
        vector<vector<bool>> pal(n, vector<bool>(n));
        for (int l = n - 1; l >= 0; --l)
            for (int r = l; r < n; ++r)
                pal[l][r] = s[l] == s[r] && (r - l < 2 || pal[l + 1][r - 1]);
        vector<int> dp(n + 1, n + 1);
        dp[0] = 0;
        for (int end = 1; end <= n; ++end)
            for (int l = 0; l < end; ++l)
                if (pal[l][end - 1])
                    dp[end] = min(dp[end], dp[l] + 1);
        cout << dp[n] << '\n';
    }
}
`,
    python: String.raw`import sys

it = iter(sys.stdin.read().split())
for _ in range(int(next(it))):
    s = next(it)
    n = len(s)
    palindrome = [bytearray(n) for _ in range(n)]
    for left in range(n - 1, -1, -1):
        for right in range(left, n):
            if s[left] == s[right] and (right - left < 2 or palindrome[left + 1][right - 1]):
                palindrome[left][right] = 1
    dp = [0] + [n + 1] * n
    for end in range(1, n + 1):
        dp[end] = min(dp[left] + 1 for left in range(end) if palindrome[left][end - 1])
    print(dp[n])
`,
  }),
  defineCpeLesson("a555", {
    topic: "strings",
    level: "easy",
    concept: "整行字串作為字典的鍵",
    goal: "以完整口號配對，不遺失句中的空白。",
    explanation: [
      "每句口號的上下半句是一組一對一對應，把完整第一行當鍵、完整第二行當值。查詢時直接以聽到的整行尋找鍵，輸出對應值；題目保證查詢一定存在，不需要自行推論口號意義。",
      "數量 N 與 Q 也各占一行。C++ 在讀完 N、Q 的數字後先取走剩餘換行，再用 getline 讀口號；Python 使用 splitlines，避免 split 把一句話拆成多個詞。只移除換行，不可 strip 句子兩側或壓縮內部空白，輸出每個回應一行。",
    ],
    complexity: "設輸入總長L，C++時間 O(L log N)，Python期望 O(L)；空間 O(L)。",
    pitfall: "一行就是一個鍵；N 組對應需要讀取2N行，不是N個單字。",
    traceLabel: "示意：兩組口號，查詢順序相反",
    trace: [
      {
        title: "第一組",
        description: "鍵 go team，值 win now，建立配對編號1。",
        cells: ["go team→win now"],
        active: [0],
        variables: [["配對數", "1"]],
      },
      {
        title: "第二組",
        description: "鍵 hello all，值 welcome home。",
        cells: ["go team→win now", "hello all→welcome home"],
        active: [0, 1],
        variables: [["配對數", "2"]],
      },
      {
        title: "兩次查詢",
        description: "先查 hello all 再查 go team，按查詢順序回答。",
        cells: ["welcome home", "win now"],
        active: [0, 1],
        variables: [
          ["查詢數", "2"],
          ["輸出行數", "2"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <string>
#include <sstream>
#include <algorithm>
#include <numeric>
#include <cmath>
#include <iomanip>
#include <queue>
#include <deque>
#include <map>
#include <set>
#include <unordered_map>
#include <unordered_set>
#include <array>
#include <tuple>
#include <functional>
#include <limits>
#include <cstdint>
#include <cctype>
#include <utility>
using namespace std;

int main() {
    int n;
    cin >> n;
    string key, value;
    getline(cin, key);
    map<string, string> reply;
    while (n--) {
        getline(cin, key);
        getline(cin, value);
        reply[key] = value;
    }
    int q;
    cin >> q;
    getline(cin, key);
    while (q--) {
        getline(cin, key);
        cout << reply.at(key) << '\n';
    }
}
`,
    python: String.raw`import sys

lines = iter(sys.stdin.read().splitlines())
n = int(next(lines))
reply = {}
for _ in range(n):
    key, value = next(lines), next(lines)
    reply[key] = value
q = int(next(lines))
for _ in range(q):
    print(reply[next(lines)])
`,
  }),
];
