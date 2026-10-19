import { definePastExamLesson } from "@/lib/apcsPastExamLessonBuilder";

export const lessonsPart3 = [
  definePastExamLesson("a394", {
    concept: "水平碰撞模擬・整件貨物提交",
    goal: "逐格將指定形狀向左推，僅在整件進入倉庫時更新占用格。",
    explanation: [
      "把 A 到 E 寫成題面列出的格子偏移。貨物的列座標永遠是 y 加列偏移，只有外框左端 x 會改變；從 x=C 開始，所有方格都在右側門外。每次檢查 x−1 的全部方格，遇到左牆或已占用格便停止，否則繼續左移。門外的格子不是障礙。",
      "停止的位置就是從右方進入時最先遇到阻擋的位置，不能越過障礙去找更左的空洞。接著檢查每一格是否都在欄 0 到 C−1 內；只要仍有一格在門外，就整件丟棄，不能先寫入部分方格。完整入庫才標記全部格子並扣除空格數。",
      "每次移動檢查的是完整形狀，因此 D、E 的突出部分也會正確碰撞。倉庫只在成功入庫後改變，正好維持『只含先前接受貨物』的不變量。",
    ],
    complexity: "時間 O(RC+n(C+1)s)，s≤5 為每件格數；模擬空間 O(RC)，Python 含輸入暫存共 O(RC+n)。",
    pitfall: "D 的第一列只有右端一格；E 的第一列只有右端一格。不要用整個外框代替實際形狀。",
    traceLabel: "公開範例一：同一列第二件 B 被丟棄",
    trace: [
      { title: "第一件 B 進入第 0 列", description: "寬 3 的 B 從右方移到 x=0，遇左牆停止。", cells: ["###.", "....", "....", "....", "...."], active: [0], variables: [["空格", "17"], ["丟棄", "0"]] },
      { title: "第 3、1 列也放入 B", description: "前三件各占 3 格，彼此在不同列。", cells: ["###.", "###.", "....", "###.", "...."], active: [1, 3], variables: [["空格", "11"], ["丟棄", "0"]] },
      { title: "第四、五件進不去", description: "第 3、1 列原有貨物到欄 2，新 B 停在 x=3，另兩格仍在門外，整件丟棄。B 標示嘗試位置，並未寫入倉庫。", cells: ["###.", "###B | BB", "....", "###B | BB", "...."], active: [1, 3], variables: [["空格", "11"], ["丟棄", "2"]] },
      { title: "最後一件放在第 2 列", description: "再占 3 格，最後輸出 8 2。", cells: ["###.", "###.", "###.", "###.", "...."], active: [2], variables: [["空格", "8"], ["丟棄", "2"]] },
    ],
    cpp: String.raw`#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int R, C, n;
    cin >> R >> C >> n;
    vector<vector<pair<int, int>>> shapes = {
        {{0,0}, {1,0}, {2,0}, {3,0}},
        {{0,0}, {0,1}, {0,2}},
        {{0,0}, {0,1}, {1,0}, {1,1}},
        {{0,2}, {1,0}, {1,1}, {1,2}},
        {{0,1}, {1,0}, {1,1}, {2,0}, {2,1}}
    };
    vector<vector<bool>> used(R, vector<bool>(C, false));
    int empty = R * C, discarded = 0;
    while (n--) {
        char type;
        int y;
        cin >> type >> y;
        const auto& shape = shapes[type - 'A'];
        int x = C;
        while (true) {
            bool blocked = false;
            for (auto [dr, dc] : shape) {
                int col = x - 1 + dc;
                if (col < 0 || (col < C && used[y + dr][col])) {
                    blocked = true;
                    break;
                }
            }
            if (blocked) break;
            --x;
        }
        bool fits = true;
        for (auto [dr, dc] : shape) {
            if (x + dc >= C) fits = false;
        }
        if (!fits) {
            ++discarded;
            continue;
        }
        for (auto [dr, dc] : shape) used[y + dr][x + dc] = true;
        empty -= (int)shape.size();
    }
    cout << empty << ' ' << discarded << '\n';
}`,
    python: String.raw`import sys

def main():
    tokens = iter(sys.stdin.buffer.read().split())
    rows, cols, n = (int(next(tokens)) for _ in range(3))
    shapes = {
        b'A': [(0, 0), (1, 0), (2, 0), (3, 0)],
        b'B': [(0, 0), (0, 1), (0, 2)],
        b'C': [(0, 0), (0, 1), (1, 0), (1, 1)],
        b'D': [(0, 2), (1, 0), (1, 1), (1, 2)],
        b'E': [(0, 1), (1, 0), (1, 1), (2, 0), (2, 1)],
    }
    used = [bytearray(cols) for _ in range(rows)]
    empty, discarded = rows * cols, 0
    for _ in range(n):
        shape = shapes[next(tokens)]
        y = int(next(tokens))
        x = cols
        while True:
            blocked = False
            for dr, dc in shape:
                col = x - 1 + dc
                if col < 0 or (col < cols and used[y + dr][col]):
                    blocked = True
                    break
            if blocked:
                break
            x -= 1
        if any(x + dc >= cols for dr, dc in shape):
            discarded += 1
            continue
        for dr, dc in shape:
            used[y + dr][x + dc] = 1
        empty -= len(shape)
    print(empty, discarded)

if __name__ == '__main__':
    main()`,
  }),
  definePastExamLesson("a395", {
    concept: "對角線最大連續和・相對反轉",
    goal: "把相鄰配對的內積視為一條對角線上的連續和，檢查兩種相對方向。",
    explanation: [
      "固定兩個陣列的方向後，配對 A[i] 與 B[j] 的下一項必須是 A[i+1] 與 B[j+1]，因此一段內積就是乘積表某條對角線的連續和。令 dp[i][j] 為以這對元素結尾、至少包含一項的最大內積，便有 dp[i][j]=A[i]B[j]+max(0,dp[i−1][j−1])。前段貢獻若為負，就從目前這一項重新開始。",
      "同時反轉兩陣列只會把一段配對的加總順序倒過來，不改變總和。所以固定 A，分別讓 B 正向與反向，已涵蓋四種是否反轉的選擇。每個狀態都拿來更新答案，不能只看右下角。",
      "一列只依賴上一列的左上角，因此只留長度 m+1 的陣列，並由右往左更新 j，讓 dp[j−1] 尚未被覆寫。答案以很小的負數初始化，才能處理所有乘積都負的情況。",
    ],
    complexity: "時間 O(nm)，兩次方向掃描；空間 O(n+m)，DP 額外空間 O(m)。",
    pitfall: "max(0,前段) 只允許捨棄前段，不能把整體答案初始化為 0；題目禁止空區間。",
    traceLabel: "公開範例一：主對角線的連續和",
    trace: [
      { title: "第一對乘積 −6", description: "−3×2=−6；即使為負，單項仍是合法區間。", cells: ["−6", "−6", "6", "6", "−6"], active: [0], variables: [["結尾最佳", "−6"], ["目前答案", "−6"]] },
      { title: "第三項重新開始", description: "第二項的結尾最佳仍是 −6；到第三項時捨去負前段，得到 6。", cells: ["−6", "−6", "6", "6", "−6"], active: [2], variables: [["結尾最佳", "6+max(0,−6)=6"], ["目前答案", "6"]] },
      { title: "連接第四項", description: "兩個 3 與兩個 2 配對，總和為 6+6=12。", cells: ["−6", "−6", "6", "6", "−6"], active: [2, 3], variables: [["結尾最佳", "12"], ["目前答案", "12"]] },
      { title: "負尾項不改善答案", description: "第五項讓結尾最佳降為 6；其他對角線與反向 B 也無法超過 12。", cells: ["−6", "−6", "6", "6", "−6"], active: [4], variables: [["結尾最佳", "6"], ["輸出", "12"]] },
    ],
    cpp: String.raw`#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, m;
    cin >> n >> m;
    vector<int> a(n), b(m);
    for (int& x : a) cin >> x;
    for (int& x : b) cin >> x;
    long long answer = LLONG_MIN;
    for (int pass = 0; pass < 2; ++pass) {
        vector<long long> dp(m + 1, 0);
        for (int x : a) {
            for (int j = m; j >= 1; --j) {
                dp[j] = 1LL * x * b[j - 1] + max(0LL, dp[j - 1]);
                answer = max(answer, dp[j]);
            }
        }
        reverse(b.begin(), b.end());
    }
    cout << answer << '\n';
}`,
    python: String.raw`import sys

def main():
    data = list(map(int, sys.stdin.buffer.read().split()))
    n, m = data[:2]
    a = data[2:2 + n]
    b = data[2 + n:2 + n + m]
    answer = -10**18
    for _ in range(2):
        dp = [0] * (m + 1)
        for x in a:
            for j in range(m, 0, -1):
                value = x * b[j - 1] + max(0, dp[j - 1])
                dp[j] = value
                answer = max(answer, value)
        b.reverse()
    print(answer)

if __name__ == '__main__':
    main()`,
  }),
  definePastExamLesson("a396", {
    concept: "排序建立四向鄰居・反射狀態轉移",
    goal: "預先找出每面鏡子四方向最近的鏡子，讓每次反射只需常數時間。",
    explanation: [
      "逐次掃描全部 N 面鏡子尋找下一面會太慢。先依 (y,x) 排序，同一列中相鄰的鏡子就是彼此最近的左、右鄰居；再依 (x,y) 排序，同一欄中相鄰者就是上、下鄰居。不同列或欄之間不連接。起點的第一面鏡子是 y=0 中 x 最小者，若沒有就直接輸出 0。",
      "用 0、1、2、3 表示右、上、左、下。斜線鏡將方向 d 改為 d XOR 1，反斜線鏡改為 d XOR 3。抵達鏡子先累加反射次數，再用反射後方向查鄰居；鄰居不存在就離開。鄰居只連接不同鏡子，不會再次撞到目前這一面。",
      "狀態是『鏡子編號、抵達方向』，共有 4N 種。若重複一個狀態就會永久循環，而題目保證不會循環，因此反射次數至多 4N。排序以外的模擬總時間也只有 O(N)。",
    ],
    complexity: "時間 O(N log N)，模擬 O(N)；空間 O(N)。",
    pitfall: "座標 y 向上增加；種類 1 會把向右改成向下。只按 x 排序不足以找同列的最近鏡子。",
    traceLabel: "公開範例一：方向轉換與重訪鏡子",
    trace: [
      { title: "向右遇到 (2,0)", description: "y=0 最近的鏡子為種類 1，將右轉為下。", cells: ["起點 (0,0) →", "(2,0) 種類1 ↓", "(2,−1) 種類1", "(1,−1) 種類1"], active: [1], variables: [["反射次數", "1"], ["下一方向", "下"]] },
      { title: "向下遇到 (2,−1)", description: "同欄下鄰居為 (2,−1)，反斜線將下轉為右。", cells: ["(2,0)", "(2,−1) →", "(7,−1) 種類0", "(1,−1) 在後方"], active: [1], variables: [["反射次數", "2"], ["下一方向", "右"]] },
      { title: "向右遇到 (7,−1)", description: "雖然同列還有 (1,−1)，它在左方；向右最近者為 (7,−1)，再轉向上。", cells: ["(1,−1)", "(2,−1)", "(7,−1) ↑", "(7,2) 種類1"], active: [2], variables: [["反射次數", "3"], ["下一面", "(7,2)"]] },
      { title: "再次經過同一面鏡子", description: "後續經 (7,2)、(4,2)、(4,1)、(3,1)、(3,2)，第九次由左抵達 (4,2)，轉向上方後離開。重訪鏡子不代表循環，抵達方向也必須相同。", cells: ["4:(7,2) ←", "5:(4,2) ↓", "6:(4,1) ←", "7:(3,1) ↑", "8:(3,2) →", "9:(4,2) ↑"], active: [5], variables: [["反射次數", "9"], ["上鄰居", "無"]] },
    ],
    cpp: String.raw`#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    vector<int> x(n), y(n), type(n), ids(n);
    vector<array<int, 4>> neighbor(n);
    int first = -1;
    for (int i = 0; i < n; ++i) {
        cin >> x[i] >> y[i] >> type[i];
        neighbor[i].fill(-1);
        ids[i] = i;
        if (y[i] == 0 && (first == -1 || x[i] < x[first])) first = i;
    }
    sort(ids.begin(), ids.end(), [&](int a, int b) {
        return pair<int,int>(y[a], x[a]) < pair<int,int>(y[b], x[b]);
    });
    for (int i = 1; i < n; ++i) {
        int a = ids[i - 1], b = ids[i];
        if (y[a] == y[b]) {
            neighbor[a][0] = b;
            neighbor[b][2] = a;
        }
    }
    sort(ids.begin(), ids.end(), [&](int a, int b) {
        return pair<int,int>(x[a], y[a]) < pair<int,int>(x[b], y[b]);
    });
    for (int i = 1; i < n; ++i) {
        int a = ids[i - 1], b = ids[i];
        if (x[a] == x[b]) {
            neighbor[a][1] = b;
            neighbor[b][3] = a;
        }
    }
    int current = first, direction = 0, answer = 0;
    while (current != -1) {
        ++answer;
        direction ^= (type[current] == 0 ? 1 : 3);
        current = neighbor[current][direction];
    }
    cout << answer << '\n';
}`,
    python: String.raw`import sys
from array import array

def main():
    values = (int(v) for line in sys.stdin.buffer for v in line.split())
    n = next(values)
    x, y, kind = [], [], []
    first = -1
    for i in range(n):
        xi, yi, ti = next(values), next(values), next(values)
        x.append(xi)
        y.append(yi)
        kind.append(ti)
        if yi == 0 and (first == -1 or xi < x[first]):
            first = i
    neighbor = [array('i', [-1]) * n for _ in range(4)]
    order = sorted(range(n), key=lambda i: (y[i], x[i]))
    for j in range(1, n):
        a, b = order[j - 1], order[j]
        if y[a] == y[b]:
            neighbor[0][a] = b
            neighbor[2][b] = a
    order.sort(key=lambda i: (x[i], y[i]))
    for j in range(1, n):
        a, b = order[j - 1], order[j]
        if x[a] == x[b]:
            neighbor[1][a] = b
            neighbor[3][b] = a
    current, direction, answer = first, 0, 0
    while current != -1:
        answer += 1
        direction ^= 1 if kind[current] == 0 else 3
        current = neighbor[direction][current]
    print(answer)

if __name__ == '__main__':
    main()`,
  }),
  definePastExamLesson("a397", {
    concept: "次數統計・相異數字排序",
    goal: "分別求最高出現次數，以及由大到小的相異數字。",
    explanation: [
      "數字只在 1 到 9，準備 10 格計數陣列，每讀到 x 就讓 count[x] 加一。最高出現次數 P 是全部計數的最大值，與數字本身大小無關。",
      "由 9 到 1 掃描，只輸出次數大於零的數字，便同時完成去重與遞減排序。先輸出 P，再附上這些數字；即使三個輸入都相同，也只列出該數字一次。",
    ],
    complexity: "時間 O(1)、空間 O(1)，只處理三個輸入與九個可能數字。",
    pitfall: "輸出的第一個值是出現次數，不是出現最多次的那個數字。",
    traceLabel: "公開範例二：7、9、7",
    trace: [
      { title: "讀入第一個 7", description: "7 的出現次數從 0 變 1。", cells: ["7:1", "9:0"], active: [0], variables: [["P", "1"]] },
      { title: "讀完 9、7", description: "9 出現一次、7 出現兩次，最高次數為 2。", cells: ["7:2", "9:1"], active: [0, 1], variables: [["P", "2"], ["相異數字數", "2"]] },
      { title: "由大到小輸出", description: "先寫 2，再按數值由大到小列出 9、7。", cells: ["2", "9", "7"], active: [0, 1, 2], variables: [["輸出", "2 9 7"]] },
    ],
    cpp: String.raw`#include <bits/stdc++.h>
using namespace std;

int main() {
    int count[10] = {};
    for (int i = 0; i < 3; ++i) {
        int x;
        cin >> x;
        ++count[x];
    }
    cout << *max_element(count, count + 10);
    for (int x = 9; x >= 1; --x) {
        if (count[x] > 0) cout << ' ' << x;
    }
    cout << '\n';
}`,
    python: String.raw`import sys

count = [0] * 10
for x in map(int, sys.stdin.buffer.read().split()):
    count[x] += 1
answer = [max(count)]
for x in range(9, 0, -1):
    if count[x] > 0:
        answer.append(x)
print(*answer)`,
  }),
  definePastExamLesson("a398", {
    concept: "二分答案・依序最早放置",
    goal: "用線性貪心檢查指定高度，再二分最高可行高度。",
    explanation: [
      "先固定高度 X，把高度至少 X 的木板視為可用，其餘視為斷點。從左到右累計目前連續可用長度，一達到下一張海報寬度，就立刻貼上並把累計長度歸零；遇到矮木板也歸零。海報次序固定，所以一次只追蹤下一張即可。",
      "對第一張海報，任何合法安排的結束位置都不會早於貪心的結束位置；把它改成貪心位置，只會留下至少一樣多的右側空間。對剩餘海報重複這個交換論證，因此最早放置能貼完，等價於存在合法安排。",
      "若高度 X 可行，更低的高度也可沿用相同位置；若不可行，更高也不會新增可用木板。利用此單調性在 1 到最高木板高度之間二分。寬度總和不超過 N 且木板高度皆正，保證高度 1 可行。",
    ],
    complexity: "時間 O(N log H+K)，H=max(h)≤10^9；空間 O(N+K)。",
    pitfall: "貼完一張必須把已消耗的連續長度歸零，不能讓不同海報重用同一塊木板。",
    traceLabel: "公開範例二：檢查高度 5 與 6（位置從 1 起算）",
    trace: [
      { title: "高度 5 的可用區塊", description: "第 2、5、8、10 塊不足 5，切出長度 1、2、2、1 的區塊。", cells: ["1:5", "2:3 ×", "3:7", "4:5", "5:1 ×", "6:7", "7:5", "8:3 ×", "9:8", "10:4 ×"], variables: [["寬度順序", "2,2,1"], ["X", "5"]] },
      { title: "前兩張各寬 2", description: "第一張最早放在 3–4，第二張最早放在 6–7。", cells: ["第1張:3–4", "第2張:6–7", "第3張:等待"], active: [0, 1], variables: [["已貼", "2"], ["下一張寬", "1"]] },
      { title: "第三張放在 9", description: "三張都能貼好，因此高度 5 可行。", cells: ["3–4", "6–7", "9"], active: [2], variables: [["已貼", "3"], ["可行", "是"]] },
      { title: "高度 6 不可行", description: "只剩位置 3、6、9，各自孤立，第一張寬 2 就無法貼。答案為 5。", cells: ["3:7", "6:7", "9:8"], variables: [["最長連續長度", "1"], ["輸出", "5"]] },
    ],
    cpp: String.raw`#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, k;
    cin >> n >> k;
    vector<int> height(n), width(k);
    for (int& x : height) cin >> x;
    for (int& x : width) cin >> x;
    auto feasible = [&](int level) {
        int next = 0, run = 0;
        for (int h : height) {
            if (h < level) {
                run = 0;
                continue;
            }
            if (++run == width[next]) {
                run = 0;
                if (++next == k) return true;
            }
        }
        return false;
    };
    int low = 1, high = *max_element(height.begin(), height.end());
    while (low < high) {
        int middle = low + (high - low + 1) / 2;
        if (feasible(middle)) low = middle;
        else high = middle - 1;
    }
    cout << low << '\n';
}`,
    python: String.raw`import sys

def main():
    data = list(map(int, sys.stdin.buffer.read().split()))
    n, k = data[:2]
    height = data[2:2 + n]
    width = data[2 + n:2 + n + k]

    def feasible(level):
        next_poster = 0
        run = 0
        for h in height:
            if h < level:
                run = 0
                continue
            run += 1
            if run == width[next_poster]:
                next_poster += 1
                run = 0
                if next_poster == k:
                    return True
        return False

    low, high = 1, max(height)
    while low < high:
        middle = (low + high + 1) // 2
        if feasible(middle):
            low = middle
        else:
            high = middle - 1
    print(low)

if __name__ == '__main__':
    main()`,
  }),
  definePastExamLesson("a399", {
    concept: "分輪模擬・穩定分組・同時更新",
    goal: "保存每場更新前的能力，依勝敗重排選手並剔除累計輸滿 m 次者。",
    explanation: [
      "用編號陣列保存目前排列，另以 S、T、loss 陣列保存各選手狀態。每輪只讀舊排列，依序兩兩比較 S×T，相等時前者勝；奇數位的最後一人直接加入勝利組，不改能力。",
      "一場決定勝敗後，先保存勝者 (u,v) 和敗者 (x,y)。勝者兩項增加量分別用 xy/(2v)、xy/(2u) 的整數商計算，分母都必須是舊值；敗者各加自身的一半整數商。敗場數增加後，只有尚未達 m 者才進失敗組。最後以勝利組接失敗組，保留各組內原順序。",
      "每場恰讓某人多輸一次，整個賽程的敗場數總增量不超過 nm；因此比賽總數 O(nm)。人數至少二時，一輪對戰數至少是該輪人數的三分之一，所以掃描所有輪的排列也只有 O(nm)，不需以能力值大小估計輪數。乘積可超過 32 位元，C++ 使用 long long。",
    ],
    complexity: "時間 O(nm)，空間 O(n)。能力乘積上界 2^60，可用 64 位元整數計算。",
    pitfall: "更新勝者 S 後，不能拿新 S 計算新 T；兩個分母都取該場開始前的能力。",
    traceLabel: "公開範例一：m=1 的兩輪比賽",
    trace: [
      { title: "第一場 1 對 2", description: "1 號乘積 8，2 號乘積 10，2 號勝。由 (2,5) 更新為 (2+8÷10,5+8÷4)=(2,7)。", cells: ["1:(4,2) ×", "2:(2,7) 勝", "3:(5,1)", "4:(3,5)"], active: [0, 1], variables: [["勝利組", "2"], ["1號敗場", "1，移除"]] },
      { title: "第二場 3 對 4", description: "乘積 5 小於 15，4 號更新為 (3+5÷10,5+5÷6)=(3,5)，3 號移除。", cells: ["2:(2,7)", "4:(3,5)"], active: [1], variables: [["下一輪排列", "2,4"], ["m", "1"]] },
      { title: "決賽 2 對 4", description: "14 小於 15，4 號獲勝；2 號累計一敗也被移除。", cells: ["2:乘積14 ×", "4:乘積15 勝"], active: [1], variables: [["剩餘人數", "1"], ["輸出", "4"]] },
    ],
    cpp: String.raw`#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, m;
    cin >> n >> m;
    vector<long long> s(n), t(n);
    vector<int> losses(n, 0), order(n);
    for (auto& v : s) cin >> v;
    for (auto& v : t) cin >> v;
    for (int& id : order) {
        cin >> id;
        --id;
    }
    while (order.size() > 1) {
        vector<int> winners, losers;
        for (int i = 0; i < (int)order.size(); i += 2) {
            int winner = order[i];
            if (i + 1 == (int)order.size()) {
                winners.push_back(winner);
                break;
            }
            int loser = order[i + 1];
            if (s[winner] * t[winner] < s[loser] * t[loser]) {
                swap(winner, loser);
            }
            long long u = s[winner], v = t[winner];
            long long x = s[loser], y = t[loser];
            s[winner] = u + x * y / (2 * v);
            t[winner] = v + x * y / (2 * u);
            s[loser] = x + x / 2;
            t[loser] = y + y / 2;
            winners.push_back(winner);
            if (++losses[loser] < m) losers.push_back(loser);
        }
        winners.insert(winners.end(), losers.begin(), losers.end());
        order.swap(winners);
    }
    cout << order[0] + 1 << '\n';
}`,
    python: String.raw`import sys

def main():
    data = list(map(int, sys.stdin.buffer.read().split()))
    n, m = data[:2]
    s = data[2:2 + n]
    t = data[2 + n:2 + 2 * n]
    order = [x - 1 for x in data[2 + 2 * n:]]
    losses = [0] * n
    while len(order) > 1:
        winners, losers = [], []
        for i in range(0, len(order), 2):
            winner = order[i]
            if i + 1 == len(order):
                winners.append(winner)
                break
            loser = order[i + 1]
            if s[winner] * t[winner] < s[loser] * t[loser]:
                winner, loser = loser, winner
            u, v = s[winner], t[winner]
            x, y = s[loser], t[loser]
            s[winner] = u + x * y // (2 * v)
            t[winner] = v + x * y // (2 * u)
            s[loser], t[loser] = x + x // 2, y + y // 2
            winners.append(winner)
            losses[loser] += 1
            if losses[loser] < m:
                losers.append(loser)
        order = winners + losers
    print(order[0] + 1)

if __name__ == '__main__':
    main()`,
  }),
  definePastExamLesson("a400", {
    concept: "持有狀態機・門檻交易",
    goal: "區分持股與空手的比較基準，只加總已完成交易的實際利潤。",
    explanation: [
      "第一個價格就是買入價，狀態設為持股。之後每個時間點只套用目前狀態的規則：持股時比較『買入價+D』，首次達到門檻便以當下價格賣出並加上賣價減買價；空手時比較『上次賣價−D』，達到門檻才重新買入。",
      "買價與賣價都保存實際成交價格，不能用門檻價格代替。每次處理完一個價格，狀態與最後成交價恰與題意一致，所以順序掃描即可。結束若還持股，因為那筆交易未完成，不額外扣買入成本或計算浮動損益。",
    ],
    complexity: "時間 O(n)；C++ 串流處理空間 O(1)，Python 保存價格空間 O(n)。",
    pitfall: "價格下跌時不能擅自調低持有股票的買入價；必須等待相對於原買價的賣出門檻。",
    traceLabel: "公開範例二：30、20、45、38、10、20，D=10",
    trace: [
      { title: "30 買入，20 繼續持有", description: "買入價仍是 30，賣出門檻為 40。", cells: ["30 買", "20 等", "45", "38", "10", "20"], active: [0, 1], variables: [["持股", "是"], ["利潤", "0"]] },
      { title: "45 賣出", description: "45≥40，以 45 成交，這筆利潤為 15；接下來買入門檻為 35。", cells: ["30", "20", "45 賣", "38 等", "10", "20"], active: [2, 3], variables: [["持股", "否"], ["利潤", "15"]] },
      { title: "10 買入，20 賣出", description: "38 尚未降到 35；10 才觸發買入，最後 20 剛好達到新門檻，新增利潤 10。", cells: ["30", "20", "45", "38", "10 買", "20 賣"], active: [4, 5], variables: [["利潤", "15+10=25"], ["持股", "否"]] },
    ],
    cpp: String.raw`#include <bits/stdc++.h>
using namespace std;

int main() {
    int n, d, buy;
    cin >> n >> d >> buy;
    bool holding = true;
    int sell = 0, profit = 0;
    for (int i = 1; i < n; ++i) {
        int price;
        cin >> price;
        if (holding) {
            if (price >= buy + d) {
                sell = price;
                profit += sell - buy;
                holding = false;
            }
        } else if (price <= sell - d) {
            buy = price;
            holding = true;
        }
    }
    cout << profit << '\n';
}`,
    python: String.raw`import sys

data = list(map(int, sys.stdin.buffer.read().split()))
n, d = data[:2]
prices = data[2:]
buy = prices[0]
sell = profit = 0
holding = True
for price in prices[1:]:
    if holding:
        if price >= buy + d:
            sell = price
            profit += sell - buy
            holding = False
    elif price <= sell - d:
        buy = price
        holding = True
print(profit)`,
  }),
  definePastExamLesson("a401", {
    concept: "二元樹子樹和・沿路更新",
    goal: "先建立每個出口的總重量，再依較輕出口送貨並更新整條路徑。",
    explanation: [
      "每個切換器比較的是兩個出口下方『全部貨箱』的總重量。先從根 1 建立走訪順序，倒序處理這份順序，就能在兩個孩子的總重已算好時令 sum[p]=sum[left]+sum[right]。不假設孩子編號一定大於父節點；n=1 時根本身就是貨箱。",
      "每件貨從根開始，讀取左右子樹目前總重，左側較輕或相等就走左，否則走右。選好方向後，把當前節點總重加上這件貨的重量，再繼續往所選孩子走，最後也更新目的貨箱。此時尚未修改的兩個孩子仍是送貨前的總重，所以比較正確。",
      "一件貨只會影響根到該貨箱路徑上的子樹；沿路加重後，所有子樹和重新符合實際箱重，可供下一件貨使用。樹可能是一條很深的鏈，因此使用迭代走訪，避免遞迴堆疊溢位。",
    ],
    complexity: "時間 O(n+mH)，H 為樹高，最壞 O(nm+n)；空間 O(n+m)。",
    pitfall: "不能只比較兩個直接孩子原本輸入的重量，也不能假設這棵樹平衡；最壞深度可達 n。",
    traceLabel: "公開範例一：前四件重量 5、3、4、2",
    trace: [
      { title: "重量 5 走兩次左側", description: "根的兩側總重皆 0，2 號的兩側也皆 0，抵達貨箱 4。", cells: ["根:5", "左子樹2:5", "右子樹3:0", "箱4:5 箱5:0", "箱6:0 箱7:0"], active: [1, 3], variables: [["目的箱", "4"]] },
      { title: "重量 3 走右再左", description: "根選較輕的右子樹，3 號的兩箱平手，選箱 6。", cells: ["根:8", "左子樹2:5", "右子樹3:3", "箱4:5 箱5:0", "箱6:3 箱7:0"], active: [2, 4], variables: [["目的箱", "6"]] },
      { title: "重量 4 走右再右", description: "根仍選右側 3<5；其內箱 7 比箱 6 輕，抵達箱 7。", cells: ["根:12", "左子樹2:5", "右子樹3:7", "箱4:5 箱5:0", "箱6:3 箱7:4"], active: [2, 4], variables: [["目的箱", "7"]] },
      { title: "重量 2 改走左再右", description: "左子樹 5<7，且箱 5 比箱 4 輕；接著重量 1 遇根兩側平手，也會去箱 5。", cells: ["根:14", "左子樹2:7", "右子樹3:7", "箱4:5 箱5:2", "箱6:3 箱7:4"], active: [1, 3], variables: [["前四個目的箱", "4 6 7 5"], ["完整輸出", "4 6 7 5 5"]] },
    ],
    cpp: String.raw`#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, m;
    cin >> n >> m;
    vector<long long> weight(2 * n, 0), cargo(m);
    vector<int> left(2 * n), right(2 * n);
    for (int i = n; i < 2 * n; ++i) cin >> weight[i];
    for (auto& x : cargo) cin >> x;
    for (int i = 1; i < n; ++i) {
        int p, s, t;
        cin >> p >> s >> t;
        left[p] = s;
        right[p] = t;
    }
    vector<int> order{1};
    for (int i = 0; i < (int)order.size(); ++i) {
        int p = order[i];
        if (p < n) {
            order.push_back(left[p]);
            order.push_back(right[p]);
        }
    }
    for (int i = (int)order.size() - 1; i >= 0; --i) {
        int p = order[i];
        if (p < n) weight[p] = weight[left[p]] + weight[right[p]];
    }
    for (int i = 0; i < m; ++i) {
        int p = 1;
        while (p < n) {
            int child = weight[left[p]] <= weight[right[p]] ? left[p] : right[p];
            weight[p] += cargo[i];
            p = child;
        }
        weight[p] += cargo[i];
        if (i) cout << ' ';
        cout << p;
    }
    cout << '\n';
}`,
    python: String.raw`import sys

def main():
    values = iter(map(int, sys.stdin.buffer.read().split()))
    n, m = next(values), next(values)
    weight = [0] * (2 * n)
    for p in range(n, 2 * n):
        weight[p] = next(values)
    cargo = [next(values) for _ in range(m)]
    left, right = [0] * (2 * n), [0] * (2 * n)
    for _ in range(n - 1):
        p, s, t = next(values), next(values), next(values)
        left[p], right[p] = s, t
    order = [1]
    for p in order:
        if p < n:
            order.append(left[p])
            order.append(right[p])
    for p in reversed(order):
        if p < n:
            weight[p] = weight[left[p]] + weight[right[p]]
    answer = []
    for w in cargo:
        p = 1
        while p < n:
            child = left[p] if weight[left[p]] <= weight[right[p]] else right[p]
            weight[p] += w
            p = child
        weight[p] += w
        answer.append(p)
    print(*answer)

if __name__ == '__main__':
    main()`,
  }),
  definePastExamLesson("a402", {
    concept: "雙向鄰居鏈・事件佇列",
    goal: "刪除能倒下的樹，只重新檢查受影響的相鄰站立樹。",
    explanation: [
      "一棵樹能向左倒，等價於 c[i]−h[i]≥左鄰樹位置；能向右倒則等價於 c[i]+h[i]≤右鄰樹位置。最外側用 0、L 當邊界哨兵。題面明確允許碰到端點，所以兩式使用大於等於與小於等於。只要一側成立就能砍。",
      "用 left[i]、right[i] 維持仍站立樹的雙向鏈，先把全部樹加入待檢查佇列。若 i 可砍，記錄數量與最高高度，把它的左右鄰居直接相連，並把這兩個鄰居重新放入佇列；已被砍過的編號直接跳過。",
      "刪除 i 只會改變它兩個鄰居的最近障礙，其他樹的可砍性不變，故只重查鄰居便足夠。障礙被移除不會讓原本可砍者變成不可砍；搭配題目保證的順序無關性，佇列清空時得到最終可砍集合。每次刪除至多新增兩次檢查，因此總檢查數為 O(N)。",
    ],
    complexity: "時間 O(N)，空間 O(N)；以迭代佇列處理連鎖砍除。",
    pitfall: "端點剛好碰到鄰樹或林場邊界是合法的；不能把 ≤ 寫成 <。",
    traceLabel: "公開範例一：以可行順序示範連鎖移除",
    trace: [
      { title: "先砍位置 30", description: "高度 15 向左覆蓋 [15,30]，左鄰樹在 10，沒有被壓到。", cells: ["10:h30", "30:h15 ×", "50:h55", "70:h10", "100:h55", "125:h25"], active: [1], variables: [["已砍", "1"], ["最大高度", "15"]] },
      { title: "位置 10 因此可砍", description: "它的新右鄰在 50，高度 30 向右只到 40，可以砍除。", cells: ["10:h30 ×", "50:h55", "70:h10", "100:h55", "125:h25"], active: [0], variables: [["已砍", "2"], ["最大高度", "30"]] },
      { title: "砍 70 與 125", description: "70 的高度 10 可向左倒；125 的高度 25 向左到 100，剛好碰端點仍合法。", cells: ["50:h55", "70:h10 ×", "100:h55", "125:h25 ×"], active: [1, 3], variables: [["已砍", "4"], ["最大高度", "30"]] },
      { title: "剩下兩棵都無法砍", description: "50 向左超過邊界且向右壓到 100；100 向左壓到 50、向右超過 L=140。", cells: ["邊界0", "50:h55", "100:h55", "邊界140"], active: [1, 2], variables: [["輸出棵數", "4"], ["輸出最高", "30"]] },
    ],
    cpp: String.raw`#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    long long limit;
    cin >> n >> limit;
    vector<long long> c(n + 2), height(n + 2);
    for (int i = 1; i <= n; ++i) cin >> c[i];
    for (int i = 1; i <= n; ++i) cin >> height[i];
    c[n + 1] = limit;
    vector<int> left(n + 2), right(n + 2);
    vector<bool> alive(n + 2, true);
    queue<int> pending;
    for (int i = 1; i <= n; ++i) {
        left[i] = i - 1;
        right[i] = i + 1;
        pending.push(i);
    }
    int count = 0;
    long long highest = 0;
    while (!pending.empty()) {
        int i = pending.front();
        pending.pop();
        if (!alive[i]) continue;
        int a = left[i], b = right[i];
        if (c[i] - height[i] < c[a] && c[i] + height[i] > c[b]) continue;
        alive[i] = false;
        ++count;
        highest = max(highest, height[i]);
        right[a] = b;
        left[b] = a;
        if (a >= 1) pending.push(a);
        if (b <= n) pending.push(b);
    }
    cout << count << '\n' << highest << '\n';
}`,
    python: String.raw`import sys
from collections import deque

def main():
    data = list(map(int, sys.stdin.buffer.read().split()))
    n, limit = data[:2]
    c = [0] + data[2:2 + n] + [limit]
    height = [0] + data[2 + n:2 + 2 * n] + [0]
    left = [i - 1 for i in range(n + 2)]
    right = [i + 1 for i in range(n + 2)]
    alive = bytearray([1]) * (n + 2)
    pending = deque(range(1, n + 1))
    count = highest = 0
    while pending:
        i = pending.popleft()
        if not alive[i]:
            continue
        a, b = left[i], right[i]
        if c[i] - height[i] < c[a] and c[i] + height[i] > c[b]:
            continue
        alive[i] = 0
        count += 1
        highest = max(highest, height[i])
        right[a], left[b] = b, a
        if a >= 1:
            pending.append(a)
        if b <= n:
            pending.append(b)
    print(count)
    print(highest)

if __name__ == '__main__':
    main()`,
  }),
  definePastExamLesson("a403", {
    concept: "有限歷史規則・提早停止模擬",
    goal: "從妹妹前兩輪的出拳決定哥哥下一拳，遇到首個非平手便立即結束。",
    explanation: [
      "建立『能打敗某拳』對照：0→5、2→0、5→2。首輪哥哥出 F，第二輪照出妹妹首輪；第三輪起，先比較妹妹前兩輪，若相同便使用對照表，否則照出妹妹上一輪。這些都是過去資料，不能看妹妹本輪來選拳。",
      "每輪先把哥哥出拳加入輸出紀錄，再比較本輪兩人：相同便繼續，哥哥等於能打敗妹妹的拳則獲勝，其餘為落敗。第一次勝敗就停止；只有整個迴圈都平手，才輸出 Drew at round N。",
    ],
    complexity: "時間 O(N)，空間 O(N)，保存預定出拳與實際哥哥出拳。",
    pitfall: "第二輪沒有兩筆歷史；輸出只能包含實際進行的輪數，冒號前後的空格也須照題面。",
    traceLabel: "公開範例三：F=5，妹妹為 5、5、0、0",
    trace: [
      { title: "第 1 輪", description: "哥哥首輪出 F=5，妹妹也出 5，平手。", cells: ["哥哥5 / 妹妹5", "下一輪", "尚未進行", "尚未進行"], active: [0], variables: [["哥哥紀錄", "5"], ["狀態", "平手"]] },
      { title: "第 2 輪", description: "只有一筆歷史，哥哥跟妹妹上輪一樣出 5，再次平手。", cells: ["5 / 5", "5 / 5", "下一輪", "尚未進行"], active: [1], variables: [["哥哥紀錄", "5 5"], ["妹妹前兩輪", "5,5"]] },
      { title: "第 3 輪停止", description: "妹妹前兩輪相同，哥哥出能勝布的剪刀 2；妹妹本輪出石頭 0，哥哥落敗。", cells: ["5 / 5", "5 / 5", "2 / 0 敗", "不進行"], active: [2], variables: [["輸出", "5 5 2 : Lost at round 3"]] },
    ],
    cpp: String.raw`#include <bits/stdc++.h>
using namespace std;

int beats(int hand) {
    if (hand == 0) return 5;
    if (hand == 2) return 0;
    return 2;
}

int main() {
    int first, n;
    cin >> first >> n;
    vector<int> sister(n), record;
    for (int& x : sister) cin >> x;
    string result = "Drew";
    int round = n;
    for (int i = 0; i < n; ++i) {
        int hand = first;
        if (i >= 1) hand = sister[i - 1];
        if (i >= 2 && sister[i - 1] == sister[i - 2]) hand = beats(sister[i - 1]);
        record.push_back(hand);
        if (hand != sister[i]) {
            result = (hand == beats(sister[i]) ? "Won" : "Lost");
            round = i + 1;
            break;
        }
    }
    for (int i = 0; i < (int)record.size(); ++i) {
        if (i) cout << ' ';
        cout << record[i];
    }
    cout << " : " << result << " at round " << round << '\n';
}`,
    python: String.raw`import sys

data = list(map(int, sys.stdin.buffer.read().split()))
first, n = data[:2]
sister = data[2:]
beats = {0: 5, 2: 0, 5: 2}
record = []
result, round_number = 'Drew', n
for i in range(n):
    hand = first if i == 0 else sister[i - 1]
    if i >= 2 and sister[i - 1] == sister[i - 2]:
        hand = beats[sister[i - 1]]
    record.append(hand)
    if hand != sister[i]:
        result = 'Won' if hand == beats[sister[i]] else 'Lost'
        round_number = i + 1
        break
print(' '.join(map(str, record)) + f' : {result} at round {round_number}')`,
  }),
  definePastExamLesson("a404", {
    concept: "帶奇偶關係的可回復並查集",
    goal: "檢查每位調查員是否產生奇環，並在下一位之前完整回復原圖狀態。",
    explanation: [
      "把組別看成 0 或 1，每條合作邊 (a,b) 都要求 color[a] XOR color[b]=1。並查集另外保存每個節點與父節點的組別差 parity；沿父鏈 XOR 即可得到節點相對根的組別。若 a、b 同根，便直接檢查兩者的差是否為 1；不符合就是矛盾。",
      "若根不同，要把其中一根接到另一根，根與根之間所需的差為 parity(a) XOR parity(b) XOR 1。按集合大小合併，使樹高 O(log n)。每次合併記錄被接上的根、接收根與接收根的舊大小，便可倒序撤銷。不能做未記錄的路徑壓縮，否則回復會遺漏父鏈改動。",
      "先加入原有 m 對，再清空這一階段的合併紀錄，固定原圖為基底。每位調查員從同一基底加入自己的 k 對；發現矛盾後仍須讀完該人的輸入，接著撤銷此次所有合併。如此不同調查員不會互相影響，且每次檢查等價於在原圖上判斷可否二分組。",
    ],
    complexity: "時間 O((m+pk) log n)；並查集及回復紀錄 O(n+k)，Python 逐行輸入另需至多 O(m+k) 暫存。",
    pitfall: "不同調查員的邊不能累積；僅重設矛盾旗標而不撤銷合併，會把前一人的資訊帶到下一人。",
    traceLabel: "公開範例二：三位調查員各自回到原圖",
    trace: [
      { title: "原圖推出 0 與 2 同組", description: "原有邊為 0–3、2–3，故可令 0=2=0、3=1；1、4 尚獨立。", cells: ["0:組0", "2:組0", "3:組1", "1:未定", "4:未定"], active: [0, 1, 2], variables: [["固定關係", "0 XOR 2=0"]] },
      { title: "調查員 1 矛盾", description: "新增的 0–2 要求兩者不同組，立即與原圖推論衝突。讀完資料後回復。", cells: ["0–2 要求不同", "原圖要求相同", "2–4 仍須讀入"], active: [0, 1], variables: [["輸出編號", "1"], ["回復", "原圖"]] },
      { title: "調查員 2 可行", description: "0–1、1–2 可令 1=1，與 0=2 相容；檢查後撤銷這次合併。", cells: ["0:0", "1:1", "2:0"], active: [1], variables: [["矛盾", "否"], ["回復", "1 再次獨立"]] },
      { title: "調查員 3 矛盾", description: "3–4 推出 4=0，但 2–4 又要求 4 與組0的 2 不同，形成矛盾。", cells: ["3:1", "4:0", "2:0", "2–4 衝突"], active: [2, 3], variables: [["輸出編號", "3"], ["完整輸出", "1、3，各一行"]] },
    ],
    cpp: String.raw`#include <bits/stdc++.h>
using namespace std;

struct RollbackDSU {
    vector<int> parent, size, parity;
    vector<array<int, 3>> history;

    explicit RollbackDSU(int n) : parent(n), size(n, 1), parity(n, 0) {
        iota(parent.begin(), parent.end(), 0);
    }
    pair<int, int> find(int x) {
        int difference = 0;
        while (parent[x] != x) {
            difference ^= parity[x];
            x = parent[x];
        }
        return {x, difference};
    }
    bool add(int a, int b) {
        auto [ra, pa] = find(a);
        auto [rb, pb] = find(b);
        if (ra == rb) return (pa ^ pb) == 1;
        if (size[ra] < size[rb]) swap(ra, rb);
        history.push_back({rb, ra, size[ra]});
        parent[rb] = ra;
        parity[rb] = pa ^ pb ^ 1;
        size[ra] += size[rb];
        return true;
    }
    void rollback() {
        while (!history.empty()) {
            auto change = history.back();
            history.pop_back();
            int child = change[0], root = change[1];
            parent[child] = child;
            parity[child] = 0;
            size[root] = change[2];
        }
    }
};

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, m;
    cin >> n >> m;
    RollbackDSU dsu(n);
    for (int i = 0; i < m; ++i) {
        int a, b;
        cin >> a >> b;
        dsu.add(a, b);
    }
    dsu.history.clear();
    int p, k;
    cin >> p >> k;
    for (int id = 1; id <= p; ++id) {
        bool bad = false;
        for (int j = 0; j < k; ++j) {
            int a, b;
            cin >> a >> b;
            if (!bad && !dsu.add(a, b)) bad = true;
        }
        if (bad) cout << id << '\n';
        dsu.rollback();
    }
}`,
    python: String.raw`import sys

class RollbackDSU:
    def __init__(self, n):
        self.parent = list(range(n))
        self.size = [1] * n
        self.parity = [0] * n
        self.history = []

    def find(self, x):
        difference = 0
        while self.parent[x] != x:
            difference ^= self.parity[x]
            x = self.parent[x]
        return x, difference

    def add(self, a, b):
        ra, pa = self.find(a)
        rb, pb = self.find(b)
        if ra == rb:
            return (pa ^ pb) == 1
        if self.size[ra] < self.size[rb]:
            ra, rb = rb, ra
        self.history.append((rb, ra, self.size[ra]))
        self.parent[rb] = ra
        self.parity[rb] = pa ^ pb ^ 1
        self.size[ra] += self.size[rb]
        return True

    def rollback(self):
        while self.history:
            child, root, old_size = self.history.pop()
            self.parent[child] = child
            self.parity[child] = 0
            self.size[root] = old_size

def main():
    values = (int(v) for line in sys.stdin.buffer for v in line.split())
    n, m = next(values), next(values)
    dsu = RollbackDSU(n)
    for _ in range(m):
        dsu.add(next(values), next(values))
    dsu.history.clear()
    p, k = next(values), next(values)
    for investigator in range(1, p + 1):
        bad = False
        for _ in range(k):
            a, b = next(values), next(values)
            if not bad and not dsu.add(a, b):
                bad = True
        if bad:
            print(investigator)
        dsu.rollback()
if __name__ == '__main__':
    main()`,
  }),
  definePastExamLesson("a405", {
    concept: "差分累加・反向排序配對",
    goal: "先算各位置的總工作量，再把速度最快的機器放到最忙的位置。",
    explanation: [
      "對位置 i 而言，所有涵蓋 i 的工作量相加得到 load[i]，它對答案的貢獻是 load[i]×該位置機器的單位時間。區間 [l,r] 增加 w 可用差分 diff[l]+=w、diff[r+1]−=w 表示，全部工作讀完後只需一次前綴累加，就得到 N 個位置的工作量。",
      "把工作量由小到大排序，單位時間由大到小排序後逐項相乘。若 a≤b 且 x≤y，將 a 配 y、b 配 x 的成本，比 a 配 x、b 配 y 少 (b−a)(y−x)，不會更差。反覆交換同向排列的配對，最後便得到反向排序的全域最小值。",
      "零工作量也必須保留，因為它們可以放最慢的機器。最大答案可達 N×(100M)×100，超過 32 位元；差分、工作量與總和在 C++ 都用 long long。",
    ],
    complexity: "時間 O(M+N log N)，空間 O(N)；Python 逐行輸入避免保存全部 M 項工作。",
    pitfall: "t 越小表示越快，應配越大的工作量；不要把最大 t 配到最大 load。",
    traceLabel: "公開範例二：先累加工作量再配機器",
    trace: [
      { title: "區間加到差分端點", description: "[2,5]+6、[3,6]+4、[7,8]+1 各只更動兩個端點。", cells: ["diff2:+6", "diff6:−6", "diff3:+4", "diff7:−4+1", "diff9:−1"], variables: [["工作數", "3"], ["位置數", "10"]] },
      { title: "前綴和還原", description: "依位置得到 0、6、10、10、10、4、1、1、0、0。", cells: ["0", "6", "10", "10", "10", "4", "1", "1", "0", "0"], active: [2, 3, 4], variables: [["最忙位置", "3、4、5"], ["總資料量", "42"]] },
      { title: "工作量與時間反向配對", description: "三個零工作量配 10、9、8；三個工作量 10 配 3、2、1。", cells: ["0×10", "0×9", "0×8", "1×7", "1×6", "4×5", "6×4", "10×3", "10×2", "10×1"], active: [7, 8, 9], variables: [["總時間", "7+6+20+24+30+20+10"], ["輸出", "117"]] },
    ],
    cpp: String.raw`#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, m;
    cin >> n >> m;
    vector<long long> diff(n + 2, 0), load(n), time(n);
    for (int i = 0; i < m; ++i) {
        int l, r, w;
        cin >> l >> r >> w;
        diff[l] += w;
        diff[r + 1] -= w;
    }
    for (auto& t : time) cin >> t;
    long long current = 0;
    for (int i = 1; i <= n; ++i) {
        current += diff[i];
        load[i - 1] = current;
    }
    sort(load.begin(), load.end());
    sort(time.rbegin(), time.rend());
    long long answer = 0;
    for (int i = 0; i < n; ++i) answer += load[i] * time[i];
    cout << answer << '\n';
}`,
    python: String.raw`import sys

def main():
    values = (int(v) for line in sys.stdin.buffer for v in line.split())
    n, m = next(values), next(values)
    diff = [0] * (n + 2)
    for _ in range(m):
        left, right, w = next(values), next(values), next(values)
        diff[left] += w
        diff[right + 1] -= w
    time = [next(values) for _ in range(n)]
    load = []
    current = 0
    for i in range(1, n + 1):
        current += diff[i]
        load.append(current)
    load.sort()
    time.sort(reverse=True)
    answer = sum(w * t for w, t in zip(load, time))
    print(answer)

if __name__ == '__main__':
    main()`,
  }),
  definePastExamLesson("a406", {
    concept: "線段物件模擬・格點聯集面積",
    goal: "保留每條線的兩個木樁端點，依操作刪除完整線段，再計算占用格聯集。",
    explanation: [
      "只保存每格是否有線，會在拆線時遺失端點關係，也難以保留交叉的另一條線。改用木樁集合和線段列表，每條線都記錄兩個端點。加入木樁時，先刪掉所有包含新格的線段，再向四個方向各找最近木樁，新增四方向中實際存在的連線。",
      "移除木樁時，僅刪掉以該木樁為端點的線，並移除木樁；不額外連接其兩側。線段可跨過其他方向的線，但新木樁插在線上時，原整條線必須先拆除，不能只擦掉該格。",
      "每次操作後重新建立 m×n 的布林占用格，先標記木樁，再標記每條水平或垂直線的所有格，最後數 1。多條線交叉仍只標記一次，且重建可自然保留沒被拆掉的交叉線。h≤200、邊長≤100，這樣直接模擬足夠；所有存活線皆由先前加入動作產生，所以線段數至多 4h。",
    ],
    complexity: "時間 O(hmn+h²·max(m,n))，空間 O(mn+h)。",
    pitfall: "拆一條水平線時不能把交叉格中的垂直線也抹掉；移除木樁後也不能自動補回左右或上下的線。",
    traceLabel: "公開範例一：矩形、延伸、移除中央木樁",
    trace: [
      { title: "前三次加入", description: "(0,0) 接 (0,2)，再由 (0,2) 垂直接 (2,2)，共占 5 格。", cells: ["●─●..", "..│..", "..●.."], variables: [["面積", "5"], ["最大面積", "5"]] },
      { title: "第四次形成矩形", description: "加入 (2,0)，連上 (0,0) 與 (2,2)，矩形周邊占 8 格。", cells: ["●─●..", "│.│..", "●─●.."], active: [2], variables: [["面積", "8"], ["木樁數", "4"]] },
      { title: "第五次延伸到底列右側", description: "加入 (2,4)，最近左樁是 (2,2)，新增兩個占用格，面積到 10。", cells: ["●─●..", "│.│..", "●─●─●"], active: [2], variables: [["面積", "10"], ["最大面積", "10"]] },
      { title: "移除 (2,2)", description: "拆掉上方、左方、右方三條相接線；留下上邊、左邊與孤立的 (2,4)，面積 6。", cells: ["●─●..", "│....", "●...●"], active: [2], variables: [["最終面積", "6"], ["最大面積", "10"]] },
    ],
    cpp: String.raw`#include <bits/stdc++.h>
using namespace std;

struct Segment {
    int r1, c1, r2, c2;
};

bool contains(const Segment& e, int r, int c) {
    if (e.r1 == e.r2) return r == e.r1 && e.c1 <= c && c <= e.c2;
    return c == e.c1 && e.r1 <= r && r <= e.r2;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int rows, cols, h;
    cin >> rows >> cols >> h;
    set<pair<int, int>> stakes;
    vector<Segment> edges;
    int maximum = 0, area = 0;
    while (h--) {
        int r, c, operation;
        cin >> r >> c >> operation;
        vector<Segment> kept;
        for (auto e : edges) {
            bool remove = operation == 0 ? contains(e, r, c)
                : (e.r1 == r && e.c1 == c) || (e.r2 == r && e.c2 == c);
            if (!remove) kept.push_back(e);
        }
        edges.swap(kept);
        if (operation == 0) {
            array<pair<int, int>, 4> nearest;
            nearest.fill({-1, -1});
            int distance[4] = {INT_MAX, INT_MAX, INT_MAX, INT_MAX};
            for (auto [a, b] : stakes) {
                int direction = -1, d = 0;
                if (b == c && a < r) { direction = 0; d = r - a; }
                if (b == c && a > r) { direction = 1; d = a - r; }
                if (a == r && b < c) { direction = 2; d = c - b; }
                if (a == r && b > c) { direction = 3; d = b - c; }
                if (direction != -1 && d < distance[direction]) {
                    distance[direction] = d;
                    nearest[direction] = {a, b};
                }
            }
            for (auto point : nearest) {
                if (point.first == -1) continue;
                auto a = min(point, pair<int,int>{r, c});
                auto b = max(point, pair<int,int>{r, c});
                edges.push_back({a.first, a.second, b.first, b.second});
            }
            stakes.insert({r, c});
        } else {
            stakes.erase({r, c});
        }
        vector<vector<bool>> occupied(rows, vector<bool>(cols, false));
        for (auto [a, b] : stakes) occupied[a][b] = true;
        for (auto e : edges) {
            if (e.r1 == e.r2) {
                for (int b = e.c1; b <= e.c2; ++b) occupied[e.r1][b] = true;
            } else {
                for (int a = e.r1; a <= e.r2; ++a) occupied[a][e.c1] = true;
            }
        }
        area = 0;
        for (const auto& row : occupied) {
            for (bool used : row) area += used;
        }
        maximum = max(maximum, area);
    }
    cout << maximum << '\n' << area << '\n';
}`,
    python: String.raw`import sys

def main():
    values = iter(map(int, sys.stdin.buffer.read().split()))
    rows, cols, h = next(values), next(values), next(values)
    stakes = set()
    edges = []
    maximum = area = 0
    for _ in range(h):
        r, c, operation = next(values), next(values), next(values)
        kept = []
        for a, b in edges:
            if operation == 0:
                on_horizontal = a[0] == b[0] == r and a[1] <= c <= b[1]
                on_vertical = a[1] == b[1] == c and a[0] <= r <= b[0]
                remove = on_horizontal or on_vertical
            else:
                remove = (r, c) == a or (r, c) == b
            if not remove:
                kept.append((a, b))
        edges = kept
        if operation == 0:
            nearest = [None] * 4
            distance = [10**9] * 4
            for a, b in stakes:
                direction = -1
                if b == c and a < r:
                    direction, d = 0, r - a
                elif b == c and a > r:
                    direction, d = 1, a - r
                elif a == r and b < c:
                    direction, d = 2, c - b
                elif a == r and b > c:
                    direction, d = 3, b - c
                if direction != -1 and d < distance[direction]:
                    nearest[direction] = (a, b)
                    distance[direction] = d
            for point in nearest:
                if point is not None:
                    a, b = sorted(((r, c), point))
                    edges.append((a, b))
            stakes.add((r, c))
        else:
            stakes.remove((r, c))
        occupied = [bytearray(cols) for _ in range(rows)]
        for a, b in stakes:
            occupied[a][b] = 1
        for a, b in edges:
            if a[0] == b[0]:
                for column in range(a[1], b[1] + 1):
                    occupied[a[0]][column] = 1
            else:
                for row in range(a[0], b[0] + 1):
                    occupied[row][a[1]] = 1
        area = sum(sum(row) for row in occupied)
        maximum = max(maximum, area)
    print(maximum)
    print(area)

if __name__ == '__main__':
    main()`,
  }),
  definePastExamLesson("a407", {
    concept: "相鄰比較・邊界分類",
    goal: "只對原本為零的圍籬，依左右鄰居或唯一鄰居累加補高。",
    explanation: [
      "逐段檢查原高度，非零代表完好，不需要修補；零才計算新增量。內部段有左右兩個鄰居，選兩者較小值；首段只有右鄰，末段只有左鄰，直接使用唯一鄰居的高度。",
      "題目保證沒有相鄰兩段同時損壞，所以損壞段參考的鄰居一定是原本完好的圍籬。各段修補互不依賴，不必反覆更新陣列或嘗試修補順序，直接把每個新增高度加總即可。",
    ],
    complexity: "時間 O(n)，此程式保存高度陣列，空間 O(n)。",
    pitfall: "只累加原本為 0 的位置；首尾不能當成左右相接的環，也不能讀取越界的鄰居。",
    traceLabel: "公開範例二：四段損壞位置（位置從 1 起算）",
    trace: [
      { title: "修補首段", description: "第 1 段只有右鄰高度 5，補上 5。", cells: ["0→5", "5", "3", "0", "6", "4", "0", "1", "0"], active: [0], variables: [["新增總高", "5"]] },
      { title: "修補兩個內部段", description: "第 4 段補 min(3,6)=3；第 7 段補 min(4,1)=1。", cells: ["5", "5", "3", "0→3", "6", "4", "0→1", "1", "0"], active: [3, 6], variables: [["新增總高", "5+3+1=9"]] },
      { title: "修補末段", description: "第 9 段只有左鄰高度 1，再補 1，輸出 10。", cells: ["5", "5", "3", "3", "6", "4", "1", "1", "0→1"], active: [8], variables: [["新增總高", "10"]] },
    ],
    cpp: String.raw`#include <bits/stdc++.h>
using namespace std;

int main() {
    int n;
    cin >> n;
    vector<int> height(n);
    for (int& x : height) cin >> x;
    int answer = 0;
    for (int i = 0; i < n; ++i) {
        if (height[i] != 0) continue;
        if (i == 0) answer += height[1];
        else if (i == n - 1) answer += height[n - 2];
        else answer += min(height[i - 1], height[i + 1]);
    }
    cout << answer << '\n';
}`,
    python: String.raw`import sys

data = list(map(int, sys.stdin.buffer.read().split()))
n = data[0]
height = data[1:]
answer = 0
for i in range(n):
    if height[i] != 0:
        continue
    if i == 0:
        answer += height[1]
    elif i == n - 1:
        answer += height[n - 2]
    else:
        answer += min(height[i - 1], height[i + 1])
print(answer)`,
  }),
  definePastExamLesson("a408", {
    concept: "不重複滑動視窗・分段動態規劃",
    goal: "先算每個結尾的最長無重複區段，再用 O(nk) DP 選不重疊的區段。",
    explanation: [
      "以 1 起算位置，令 last[v] 是美食 v 上次出現的位置。掃到 i 時令 L=max(L,last[a[i]]+1)，則 [L,i] 是以 i 結尾的最長無重複區段；L 左邊會包含重複種類。把 b[i]=L−1 保存下來，表示這段之前的前綴長度。",
      "令 dp[j][i] 為前 i 攤使用至多 j 段的最大造訪數。不選第 i 攤就取 dp[j][i−1]；若最後一段選 [s,i]，可得 dp[j−1][s−1]+i−s+1，其中 s≥L。看似要枚舉起點，但前綴多一攤，最優值至多多 1：把新增攤刪去就能回到前一前綴的合法解。故 dp[j−1][x]−x 隨 x 不增加，選最小 x=L−1 一定不差。",
      "因此轉移可簡化為 dp[j][i]=max(dp[j][i−1],dp[j−1][b[i]]+i−b[i])。每層只依賴前一層以及本層前一格，使用兩個長度 n+1 的陣列即可；不需要 n×k 的完整表，也不需要在每個狀態重新維護種類集合。",
    ],
    complexity: "時間 O(nk+U)，U=100000 為美食編號上界；空間 O(n+U)，Python 用緊密整數陣列保存邊界和兩層 DP。",
    pitfall: "最後一段之前只能用前 b[i] 攤的 DP，不能用前 i−1 攤，否則區段會重疊。",
    traceLabel: "公開範例一：1、2、1、3、1，k=1",
    trace: [
      { title: "前兩攤不重複", description: "掃到位置 2，L=1、b=0，單段能涵蓋 [1,2] 共 2 攤。", cells: ["1", "2", "1", "3", "1"], active: [0, 1], variables: [["L", "1"], ["dp[1][2]", "2"]] },
      { title: "位置 3 再出現 1", description: "上次的 1 在位置 1，L 推到 2；以 3 結尾的合法最長段為 [2,3]。", cells: ["1 排除", "2", "1", "3", "1"], active: [1, 2], variables: [["b[3]", "1"], ["dp[1][3]", "max(2,0+2)=2"]] },
      { title: "位置 4 擴成三攤", description: "3 尚未在視窗出現，L 仍為 2，區段 [2,4] 的種類為 2、1、3。", cells: ["1", "2", "1", "3", "1"], active: [1, 2, 3], variables: [["b[4]", "1"], ["dp[1][4]", "max(2,0+3)=3"]] },
      { title: "位置 5 再收縮", description: "1 上次在位置 3，L 變成 4；新尾段只有 2 攤，不如跳過第 5 攤保留答案 3。", cells: ["1", "2", "1", "3", "1"], active: [3, 4], variables: [["b[5]", "3"], ["dp[1][5]", "max(3,0+2)=3"]] },
    ],
    cpp: String.raw`#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, k;
    cin >> n >> k;
    vector<int> last(100001, 0), boundary(n + 1, 0);
    int left = 1;
    for (int i = 1; i <= n; ++i) {
        int food;
        cin >> food;
        left = max(left, last[food] + 1);
        boundary[i] = left - 1;
        last[food] = i;
    }
    vector<int> previous(n + 1, 0), current(n + 1, 0);
    for (int group = 1; group <= k; ++group) {
        current[0] = 0;
        for (int i = 1; i <= n; ++i) {
            int b = boundary[i];
            current[i] = max(current[i - 1], previous[b] + i - b);
        }
        previous.swap(current);
    }
    cout << previous[n] << '\n';
}`,
    python: String.raw`import sys
from array import array

def main():
    values = (int(v) for line in sys.stdin.buffer for v in line.split())
    n, k = next(values), next(values)
    last = [0] * 100001
    boundary = array('i', [0]) * (n + 1)
    left = 1
    for i in range(1, n + 1):
        food = next(values)
        if last[food] >= left:
            left = last[food] + 1
        boundary[i] = left - 1
        last[food] = i
    del values, last
    previous = array('i', [0]) * (n + 1)
    current = array('i', [0]) * (n + 1)
    for _ in range(k):
        current[0] = 0
        best = 0
        for i in range(1, n + 1):
            b = boundary[i]
            candidate = previous[b] + i - b
            if candidate > best:
                best = candidate
            current[i] = best
        previous, current = current, previous
    print(previous[n])

if __name__ == '__main__':
    main()`,
  }),
  definePastExamLesson("a409", {
    concept: "前綴和・排序選取區間最小值",
    goal: "利用保留區間只會縮小的性質，單向掃描全域排序來找每輪最小值。",
    explanation: [
      "先算前綴和 prefix，使區間 [l,r] 的總和能以 prefix[r+1]−prefix[l] 在 O(1) 取得。若本輪最小值在 p，左右總和分別是 prefix[p]−prefix[l] 與 prefix[r+1]−prefix[p+1]，不包含即將排除的最小值。",
      "將所有位置按其數值由小到大排序，維持一個只往前的游標。每輪跳過目前區間外的位置，第一個仍在 [l,r] 內者就是該區間最小值。這樣跳過是安全的：保留區間只會縮小，已離開者未來不可能再回來。當選中的最小值被排除，也把游標向前移。",
      "若左側總和較大就令 r=p−1，否則令 l=p+1，平手自然保留右側。正整數保證長度大於一時，至少一側有正總和，故不會選到空側。只剩一格時直接輸出它，不需要再把最後那格排除。前綴和可達 3×10^12，要用 64 位元整數。",
    ],
    complexity: "時間 O(N log N)，排序後每個位置至多掃過一次；空間 O(N)。",
    pitfall: "平手必須保留右側；比較的左右總和都不含最小值。不要在每次縮區間後重新線性找最小值。",
    traceLabel: "公開範例一：4、2、3、1、5",
    trace: [
      { title: "整段最小值為 1", description: "1 的左側總和 4+2+3=9，右側總和 5，故保留左側。", cells: ["4", "2", "3", "1 排除", "5 捨棄"], active: [3], variables: [["左和", "9"], ["右和", "5"]] },
      { title: "保留段最小值為 2", description: "區間縮成 4、2、3；左側 4 大於右側 3，再保留左側。", cells: ["4 保留", "2 排除", "3 捨棄"], active: [1], variables: [["左和", "4"], ["右和", "3"]] },
      { title: "只剩 4", description: "只剩單一元素，這個值就是幸運數字。", cells: ["4"], active: [0], variables: [["區間長度", "1"], ["輸出", "4"]] },
    ],
    cpp: String.raw`#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    vector<int> a(n), order(n);
    vector<long long> prefix(n + 1, 0);
    for (int i = 0; i < n; ++i) {
        cin >> a[i];
        prefix[i + 1] = prefix[i] + a[i];
        order[i] = i;
    }
    sort(order.begin(), order.end(), [&](int i, int j) { return a[i] < a[j]; });
    int left = 0, right = n - 1, cursor = 0;
    while (left < right) {
        while (order[cursor] < left || order[cursor] > right) ++cursor;
        int p = order[cursor++];
        long long left_sum = prefix[p] - prefix[left];
        long long right_sum = prefix[right + 1] - prefix[p + 1];
        if (left_sum > right_sum) right = p - 1;
        else left = p + 1;
    }
    cout << a[left] << '\n';
}`,
    python: String.raw`import sys

def main():
    data = list(map(int, sys.stdin.buffer.read().split()))
    n = data[0]
    a = data[1:]
    prefix = [0]
    for value in a:
        prefix.append(prefix[-1] + value)
    order = sorted(range(n), key=a.__getitem__)
    left, right, cursor = 0, n - 1, 0
    while left < right:
        while order[cursor] < left or order[cursor] > right:
            cursor += 1
        p = order[cursor]
        cursor += 1
        left_sum = prefix[p] - prefix[left]
        right_sum = prefix[right + 1] - prefix[p + 1]
        if left_sum > right_sum:
            right = p - 1
        else:
            left = p + 1
    print(a[left])

if __name__ == '__main__':
    main()`,
  }),
  definePastExamLesson("a410", {
    concept: "同步分階段模擬・炸彈集合",
    goal: "把放炸彈、移動、同時引爆拆成三個階段，避免逐個更新造成先後差異。",
    explanation: [
      "一個布林格記錄該處是否至少有一顆炸彈。每回合先讓所有活著的魔王在目前位置設為有炸彈，再計算每個人的新位置，越界者不加入候選。零位移的魔王會落在自己剛放的炸彈上，也會被消滅。",
      "移動全部完成後，先在尚未改動的炸彈棋盤上判定每個候選是否被炸，將倖存者留下，並把所有被觸發的格子收集起來。等判定完全部候選才把那些格子的炸彈清掉；如此同回合到同一炸彈格的多個魔王都會一起死亡，不會因第一人先清掉炸彈而讓後來的人倖存。",
      "沒引爆的炸彈持續留在棋盤；以布林格即可，因為題目要求最後『有炸彈的格數』，且引爆時同格全部清空。非零整數移動向量至少有一維每步改變 1，所以最多 max(n,m) 回合就越界；零向量第一回合即死亡。題面未列位移的數值上限，但某維位移絕對值一旦達該維邊長就必然越界，因此讀入時可把更大位移截到邊長，保留正負號且避免整數溢位。",
    ],
    complexity: "時間 O(k·max(n,m)+nm)，空間 O(nm+k)。",
    pitfall: "不能一邊判定某人死亡就一邊清炸彈；同一回合的所有碰撞都必須看到同一份炸彈狀態。",
    traceLabel: "公開範例一：1×6 棋盤，三位魔王",
    trace: [
      { title: "第一回合先放三顆", description: "魔王在欄 0、2、4 放炸彈；位移依序是 0、−1、+2。", cells: ["炸+王", ".", "炸+王", ".", "炸+王", "."], active: [0, 2, 4], variables: [["存活", "3"], ["炸彈格", "3"]] },
      { title: "同步移動與引爆", description: "欄 0 的零位移魔王自爆並清掉欄 0；欄 4 的魔王跳到 6 越界；只剩從 2 到 1 的魔王。", cells: [".", "王", "炸", ".", "炸", "."], active: [1], variables: [["存活", "1"], ["炸彈格", "2"]] },
      { title: "第二回合走到 0", description: "先在 1 放炸彈，再移到已清空的 0，因此沒有被炸。", cells: ["王", "炸", "炸", ".", "炸", "."], active: [0], variables: [["存活", "1"], ["炸彈格", "3"]] },
      { title: "第三回合離開", description: "在 0 放下炸彈後移到 −1 越界，棋盤最後有欄 0、1、2、4 四格炸彈。", cells: ["炸", "炸", "炸", ".", "炸", "."], active: [0, 1, 2, 4], variables: [["存活", "0"], ["輸出", "4"]] },
    ],
    cpp: String.raw`#include <bits/stdc++.h>
using namespace std;

struct Demon {
    long long r, c, s, t;
};

int readStep(int bound) {
    string token;
    cin >> token;
    bool negative = token[0] == '-';
    int start = (token[0] == '-' || token[0] == '+') ? 1 : 0;
    int magnitude = 0;
    for (int i = start; i < (int)token.size() && magnitude < bound; ++i) {
        magnitude = min(bound, magnitude * 10 + token[i] - '0');
    }
    return negative ? -magnitude : magnitude;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, m, k;
    cin >> n >> m >> k;
    vector<Demon> alive(k);
    for (auto& d : alive) {
        cin >> d.r >> d.c;
        d.s = readStep(n);
        d.t = readStep(m);
    }
    vector<vector<bool>> bomb(n, vector<bool>(m, false));
    while (!alive.empty()) {
        for (auto d : alive) bomb[d.r][d.c] = true;
        vector<Demon> survivors;
        vector<pair<int, int>> triggered;
        for (auto d : alive) {
            // Check bounds before addition, including very large steps.
            if (d.s < -d.r || d.s >= n - d.r || d.t < -d.c || d.t >= m - d.c) continue;
            d.r += d.s;
            d.c += d.t;
            if (bomb[d.r][d.c]) triggered.push_back({(int)d.r, (int)d.c});
            else survivors.push_back(d);
        }
        for (auto [r, c] : triggered) bomb[r][c] = false;
        alive.swap(survivors);
    }
    int answer = 0;
    for (const auto& row : bomb) {
        for (bool occupied : row) answer += occupied;
    }
    cout << answer << '\n';
}`,
    python: String.raw`import sys

def bounded_step(token, bound):
    negative = token.startswith(b'-')
    magnitude = 0
    for digit in token.lstrip(b'+-'):
        magnitude = min(bound, magnitude * 10 + digit - 48)
        if magnitude == bound:
            break
    return -magnitude if negative else magnitude

def main():
    values = iter(sys.stdin.buffer.read().split())
    n, m, k = (int(next(values)) for _ in range(3))
    alive = []
    for _ in range(k):
        r, c = int(next(values)), int(next(values))
        s = bounded_step(next(values), n)
        t = bounded_step(next(values), m)
        alive.append((r, c, s, t))
    bomb = [bytearray(m) for _ in range(n)]
    while alive:
        for r, c, s, t in alive:
            bomb[r][c] = 1
        survivors = []
        triggered = set()
        for r, c, s, t in alive:
            nr, nc = r + s, c + t
            if not (0 <= nr < n and 0 <= nc < m):
                continue
            if bomb[nr][nc]:
                triggered.add((nr, nc))
            else:
                survivors.append((nr, nc, s, t))
        for r, c in triggered:
            bomb[r][c] = 0
        alive = survivors
    print(sum(sum(row) for row in bomb))

if __name__ == '__main__':
    main()`,
  }),
  definePastExamLesson("a411", {
    concept: "布林條件・獨立規則檢查",
    goal: "把 A、B、C 三項要求分別判斷，按固定順序輸出所有違規代號。",
    explanation: [
      "把七字依序存入陣列，題目的第二、四、六、七字對應索引 1、3、5、6。A 要上下兩句各自滿足『第二不等於第四、第二等於第六』，只要其中一句不符就違反 A；B 要上句末字為 1、下句末字為 0。",
      "C 則檢查上下句的索引 1、3、5，每個對應位置都須不同，有任一相同就違反 C。三項規則彼此獨立，不能使用只會進入一支的 else-if；依 A、B、C 逐項加入字串，最後空字串才改輸出 None。",
    ],
    complexity: "時間 O(n)，空間 O(1) 逐組處理；Python 此版本保存全部輸入與輸出，總空間 O(n)。",
    pitfall: "A 檢查兩句內部的關係，C 檢查上下句對應位置；不要把兩種比較方向混在一起。",
    traceLabel: "公開範例一：應輸出 AC",
    trace: [
      { title: "檢查 A", description: "上句的第2、4、6字為 1、0、1，符合；下句為 0、0、1，不符合，因此記 A。", cells: ["上:1 0 1", "下:0 0 1"], active: [1], variables: [["違規字串", "A"]] },
      { title: "檢查 B", description: "上句第7字為 1，下句第7字為 0，符合 B，不新增代號。", cells: ["上句尾:1", "下句尾:0"], active: [0, 1], variables: [["B", "符合"], ["違規字串", "A"]] },
      { title: "檢查 C", description: "第2字 1≠0，但第4字 0=0、第6字 1=1，因此違反 C，輸出 AC。", cells: ["第2字:1≠0", "第4字:0=0", "第6字:1=1"], active: [1, 2], variables: [["違規字串", "AC"]] },
    ],
    cpp: String.raw`#include <bits/stdc++.h>
using namespace std;

int main() {
    int n;
    cin >> n;
    while (n--) {
        array<int, 7> upper, lower;
        for (int& x : upper) cin >> x;
        for (int& x : lower) cin >> x;
        string answer;
        bool a_ok = upper[1] != upper[3] && upper[1] == upper[5]
                 && lower[1] != lower[3] && lower[1] == lower[5];
        if (!a_ok) answer += 'A';
        if (upper[6] != 1 || lower[6] != 0) answer += 'B';
        if (upper[1] == lower[1] || upper[3] == lower[3] || upper[5] == lower[5]) answer += 'C';
        cout << (answer.empty() ? "None" : answer) << '\n';
    }
}`,
    python: String.raw`import sys

values = iter(map(int, sys.stdin.buffer.read().split()))
n = next(values)
output = []
for _ in range(n):
    upper = [next(values) for _ in range(7)]
    lower = [next(values) for _ in range(7)]
    answer = ''
    a_ok = (upper[1] != upper[3] and upper[1] == upper[5]
            and lower[1] != lower[3] and lower[1] == lower[5])
    if not a_ok:
        answer += 'A'
    if upper[6] != 1 or lower[6] != 0:
        answer += 'B'
    if any(upper[i] == lower[i] for i in (1, 3, 5)):
        answer += 'C'
    output.append(answer or 'None')
print('\n'.join(output))`,
  }),
  definePastExamLesson("a412", {
    concept: "前序運算式・由右向左的值堆疊",
    goal: "以迭代堆疊計算任意巢狀的 f、g、h，正確保留參數次序。",
    explanation: [
      "前序寫法先給函數，再給各參數。若從左開始遞迴，遇到很深的 f 巢狀會受語言呼叫堆疊限制；改成由右往左掃描記號。遇整數就推入值堆疊，遇函數時，它右側的參數運算式都已算完，可以立即取值計算。",
      "由右往左的順序會先算最後一個參數，所以彈出堆疊的第一個值恰好是第一個參數 x；g 再彈 y，h 再彈 y、z。分別算 2x−3、2x+y−7、3x−2y+z，將結果推回，等同用一個值取代該完整子運算式。",
      "每處理一個函數，都維持堆疊中各值是已完成子運算式的值，且參數順序正確。所有記號處理完只剩整體答案。負整數直接用整數解析，不把負號當成另一個運算子。",
    ],
    complexity: "時間 O(T)，空間 O(T)，T 為輸入記號總長度；全程不用遞迴。",
    pitfall: "h 的第二參數有負係數，不能交換 x、y、z；向右反掃後第一次 pop 的仍是 x。",
    traceLabel: "公開範例二：h f 5 g 3 4 3（堆疊右端為頂）",
    trace: [
      { title: "由右讀入三個整數", description: "先讀最後的 3，再讀 g 的參數 4、3，堆疊頂是 g 的第一參數 3。", cells: ["3（h的z）", "4（g的y）", "3（g的x）"], active: [2], variables: [["下一記號", "g"]] },
      { title: "計算 g(3,4)", description: "依序彈出 x=3、y=4，算得 2×3+4−7=3，推回結果。", cells: ["3（h的z）", "3（h的y）"], active: [1], variables: [["g結果", "3"], ["下一記號", "5"]] },
      { title: "計算 f(5)", description: "讀入 5 後遇到 f，算得 2×5−3=7。", cells: ["3（z）", "3（y）", "7（x）"], active: [2], variables: [["f結果", "7"], ["下一記號", "h"]] },
      { title: "計算最外層 h", description: "依序彈出 7、3、3，得到 3×7−2×3+3=18。", cells: ["18"], active: [0], variables: [["堆疊大小", "1"], ["輸出", "18"]] },
    ],
    cpp: String.raw`#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    vector<string> tokens;
    string token;
    while (cin >> token) tokens.push_back(token);
    vector<long long> stack;
    auto pop = [&]() {
        long long value = stack.back();
        stack.pop_back();
        return value;
    };
    for (int i = (int)tokens.size() - 1; i >= 0; --i) {
        const string& t = tokens[i];
        if (t == "f") {
            long long x = pop();
            stack.push_back(2 * x - 3);
        } else if (t == "g") {
            long long x = pop(), y = pop();
            stack.push_back(2 * x + y - 7);
        } else if (t == "h") {
            long long x = pop(), y = pop(), z = pop();
            stack.push_back(3 * x - 2 * y + z);
        } else {
            stack.push_back(stoll(t));
        }
    }
    cout << stack.back() << '\n';
}`,
    python: String.raw`import sys

tokens = sys.stdin.buffer.read().split()
stack = []
for token in reversed(tokens):
    if token == b'f':
        x = stack.pop()
        stack.append(2 * x - 3)
    elif token == b'g':
        x = stack.pop()
        y = stack.pop()
        stack.append(2 * x + y - 7)
    elif token == b'h':
        x = stack.pop()
        y = stack.pop()
        z = stack.pop()
        stack.append(3 * x - 2 * y + z)
    else:
        stack.append(int(token))
print(stack[0])`,
  }),
];
