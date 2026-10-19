import { definePastExamLesson } from "@/lib/apcsPastExamLessonBuilder";

export const lessonsPart5 = [
  definePastExamLesson("a431", {
    concept: "規則模擬・跑者狀態",
    goal: "依打序取用每人的下一筆紀錄，逐次更新壘包、出局數與得分。",
    explanation: [
      "九位打者輪流上場，因此需要目前打者編號，以及每位打者已使用幾筆紀錄。三個壘包各記錄是否有人；得分與出局數則分開累計。開始時空壘，每人的紀錄指標都是 0。",
      "安打前進 h 壘時，先把舊跑者搬到全新的壘包陣列。舊陣列索引 i 的跑者會到 i+h；若超過第三個壘包便得分。打者另從本壘前進 h 壘，全壘打時直接得分。使用新陣列可保證每位跑者只移動一次。",
      "FO、GO、SO 只增加一次出局，不移動原有跑者；累積出局數為 3 的倍數時清空壘包。每次事件後的狀態都符合規則，因此在第 b 次出局後立即停止，就得到要求的總分，不會多算下一位打者。",
    ],
    complexity: "設實際打席數為 T：時間 O(T)，額外狀態 O(1)；輸入紀錄最多 45 筆，儲存空間 O(45)。",
    pitfall: "三出局清空壘包，但總出局數不能歸零；同一次安打也不能讓已搬動的跑者再移動。",
    traceLabel: "示意打席：1B、2B、HR、SO、FO、GO，b=3",
    trace: [
      { title: "一壘打", description: "第一位打者停在一壘，尚未得分。", cells: ["一壘：有人", "二壘：空", "三壘：空"], active: [0], variables: [["得分", "0"], ["出局", "0"]] },
      { title: "二壘打", description: "一壘跑者前進到三壘；新打者停在二壘。", cells: ["一壘：空", "二壘：有人", "三壘：有人"], active: [1, 2], variables: [["前進壘數", "2"], ["得分", "0"]] },
      { title: "全壘打", description: "兩位壘上跑者與打者都回本壘，一次得到 3 分。", cells: ["一壘：空", "二壘：空", "三壘：空"], active: [0, 1, 2], variables: [["本次得分", "3"], ["總得分", "3"]] },
      { title: "第三次出局停止", description: "SO、FO、GO 依序讓出局數到達 3，清空壘包並輸出 3。", cells: ["SO：1 出局", "FO：2 出局", "GO：3 出局"], active: [2], variables: [["b", "3"], ["輸出", "3"]] },
    ],
    cpp: String.raw`#include <iostream>
#include <string>
#include <vector>
#include <array>
using namespace std;

int main() {
    vector<vector<string>> records(9);
    for (auto &row : records) {
        int count;
        cin >> count;
        row.resize(count);
        for (string &event : row) cin >> event;
    }
    int target;
    cin >> target;
    array<int, 9> used{};
    array<int, 3> bases{};
    int batter = 0, outs = 0, score = 0;
    while (outs < target) {
        string event = records[batter][used[batter]++];
        int hit = 0;
        if (event == "1B") hit = 1;
        else if (event == "2B") hit = 2;
        else if (event == "3B") hit = 3;
        else if (event == "HR") hit = 4;
        if (hit == 0) {
            ++outs;
            if (outs % 3 == 0) bases.fill(0);
        } else {
            array<int, 3> next{};
            for (int i = 0; i < 3; ++i) {
                if (!bases[i]) continue;
                if (i + hit >= 3) ++score;
                else next[i + hit] = 1;
            }
            if (hit == 4) ++score;
            else next[hit - 1] = 1;
            bases = next;
        }
        batter = (batter + 1) % 9;
    }
    cout << score << '\n';
}`,
    python: String.raw`import sys

tokens = iter(sys.stdin.read().split())
records = []
for _ in range(9):
    count = int(next(tokens))
    records.append([next(tokens) for _ in range(count)])
target = int(next(tokens))
used = [0] * 9
bases = [0] * 3
batter = outs = score = 0
hits = {"1B": 1, "2B": 2, "3B": 3, "HR": 4}
while outs < target:
    event = records[batter][used[batter]]
    used[batter] += 1
    hit = hits.get(event, 0)
    if hit == 0:
        outs += 1
        if outs % 3 == 0:
            bases = [0] * 3
    else:
        new_bases = [0] * 3
        for i in range(3):
            if bases[i]:
                if i + hit >= 3:
                    score += 1
                else:
                    new_bases[i + hit] = 1
        if hit == 4:
            score += 1
        else:
            new_bases[hit - 1] = 1
        bases = new_bases
    batter = (batter + 1) % 9
print(score)
`,
  }),
  definePastExamLesson("a432", {
    concept: "倒推・約瑟夫環編號還原",
    goal: "不實際移除圓圈中的人，從最後一次爆炸後的幸運者倒推原始編號。",
    explanation: [
      "每次都把報數起點視為索引 0。若目前有 n 人，第 M 位被淘汰者的索引是 (M−1) mod n，而下一輪的起點是舊索引 M mod n。題目要的幸運者正是做完 K 次淘汰後的新起點。",
      "剩下 N−K 人時，答案在這個旋轉後的編號系統中就是 x=0。倒推回多一人的圓圈時，新索引 x 對應到舊索引 (x+M) mod n。這個映射沿著淘汰者之後的存活者排列，恰好跳過被刪除的位置。",
      "依序讓 n 從 N−K+1 增加到 N，每次套用 x=(x+M) mod n，就逐層還原到最初圓圈。最後把 0 起算的 x 加 1 即是球員編號。M 大於人數時仍由取餘數正確繞圈。",
    ],
    complexity: "時間 O(K)，額外空間 O(1)。",
    pitfall: "這裡倒推的是最後淘汰者的下一位存活者，因此初值是 0、轉移加 M；不是只求最後一位生還者的固定 N 輪版本。",
    traceLabel: "示意 N=5、M=2、K=2：淘汰 2、4，幸運者為 5",
    trace: [
      { title: "最後的圓圈", description: "淘汰 2、4 後從 5 開始重新編號，存活順序為 5、1、3。", cells: ["5 → 索引0", "1 → 索引1", "3 → 索引2"], active: [0], variables: [["剩餘人數", "3"], ["x", "0"]] },
      { title: "還原第二次淘汰", description: "回到 4 人的報數座標，x=(0+2) mod 4=2。這層從 3 起算。", cells: ["3", "4（淘汰）", "5", "1"], active: [2], variables: [["n", "4"], ["x", "2"]] },
      { title: "還原第一次淘汰", description: "回到最初 5 人，x=(2+2) mod 5=4，轉為 1 起算編號是 5。", cells: ["1", "2", "3", "4", "5"], active: [4], variables: [["n", "5"], ["輸出 x+1", "5"]] },
    ],
    cpp: String.raw`#include <iostream>
using namespace std;

int main() {
    int n, m, k;
    cin >> n >> m >> k;
    int answer = 0;
    for (int size = n - k + 1; size <= n; ++size) {
        answer = (answer + m) % size;
    }
    cout << answer + 1 << '\n';
}`,
    python: String.raw`import sys

n, m, k = map(int, sys.stdin.read().split())
answer = 0
for size in range(n - k + 1, n + 1):
    answer = (answer + m) % size
print(answer + 1)
`,
  }),
  definePastExamLesson("a434", {
    concept: "矩陣座標・順時針螺旋",
    goal: "以方向向量與兩段一組的步長，從中央走訪全部格子。",
    explanation: [
      "中央格的 0 起算座標是 (N//2,N//2)，必須在移動前先輸出。依題意把方向編成左、上、右、下，向量依序為 (0,−1)、(−1,0)、(0,1)、(1,0)；方向編號加 1 取模 4 就是右轉。",
      "每個長度連走兩段：1 步、1 步後改為 2 步、2 步，再改為 3 步、3 步。每段完成才轉向，不是每走一步就轉。這些折線一圈圈包住已讀區域，不會重訪舊格。",
      "走到 N² 個數字便立即停止，即使最後一段尚未走完也不再踏出下一步。奇數方陣的這條路徑在此前都位於矩陣內，並覆蓋全部格子。將數字直接串接，符合輸出不加空白的要求。",
    ],
    complexity: "時間 O(N²)，儲存矩陣與輸出共 O(N²)。",
    pitfall: "本站明訂順時針轉向；讀滿 N² 格就停止，不能硬把最後一整段走完而越界。",
    traceLabel: "公開範例二：3×3，起始向上",
    trace: [
      { title: "讀中央", description: "矩陣列為 412／305／678，中央值是 0。", cells: ["4", "1", "2", "3", "0", "5", "6", "7", "8"], active: [4], variables: [["座標", "(1,1)"], ["輸出", "0"]] },
      { title: "兩段長度 1", description: "先向上讀 1，再右轉向右讀 2。", cells: ["4", "1", "2", "3", "0", "5", "6", "7", "8"], active: [1, 2], variables: [["段長", "1"], ["輸出", "012"]] },
      { title: "兩段長度 2", description: "向下讀 5、8，接著向左讀 7、6。", cells: ["4", "1", "2", "3", "0", "5", "6", "7", "8"], active: [5, 8, 7, 6], variables: [["段長", "2"], ["輸出", "0125876"]] },
      { title: "滿 9 格停止", description: "向上原本預計走 3 步，但讀完 3、4 已滿 9 格，立刻停止。", cells: ["4", "1", "2", "3", "0", "5", "6", "7", "8"], active: [3, 0], variables: [["已讀格數", "9"], ["輸出", "012587634"]] },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <string>
using namespace std;

int main() {
    int n, direction;
    cin >> n >> direction;
    vector<vector<int>> grid(n, vector<int>(n));
    for (auto &row : grid) for (int &value : row) cin >> value;
    const int dr[4] = {0, -1, 0, 1};
    const int dc[4] = {-1, 0, 1, 0};
    int r = n / 2, c = n / 2;
    string output(1, char('0' + grid[r][c]));
    for (int length = 1; int(output.size()) < n * n; ++length) {
        for (int segment = 0; segment < 2; ++segment) {
            for (int step = 0; step < length; ++step) {
                if (int(output.size()) == n * n) break;
                r += dr[direction];
                c += dc[direction];
                output += char('0' + grid[r][c]);
            }
            direction = (direction + 1) % 4;
        }
    }
    cout << output << '\n';
}`,
    python: String.raw`import sys

values = iter(map(int, sys.stdin.read().split()))
n = next(values)
direction = next(values)
grid = [[next(values) for _ in range(n)] for _ in range(n)]
dr = [0, -1, 0, 1]
dc = [-1, 0, 1, 0]
r = c = n // 2
output = [str(grid[r][c])]
length = 1
while len(output) < n * n:
    for _ in range(2):
        for _ in range(length):
            if len(output) == n * n:
                break
            r += dr[direction]
            c += dc[direction]
            output.append(str(grid[r][c]))
        direction = (direction + 1) % 4
    length += 1
print("".join(output))
`,
  }),
  definePastExamLesson("a436", {
    concept: "圖與樹・兩次 BFS 求直徑",
    goal: "把親子關係視為無向邊，找出樹上最長路徑的邊數。",
    explanation: [
      "血緣路徑可以先向上再向下，因此每筆 a、b 都要加入 a→b 與 b→a 兩條鄰接紀錄。題目保證是一棵樹，任意兩點間只有一條路徑；BFS 從起點逐層擴張即可得到這些路徑的邊數。",
      "先從任意節點（例如 0）做 BFS，取距離最遠的 u。樹的直徑端點性質保證這樣的最遠點可以作為某條直徑的端點：若從分岔點伸向 u 的支路較短，另一個直徑端點就會比 u 更遠，與 u 最遠矛盾。",
      "再從 u 做 BFS，取得最遠距離就是直徑長度。兩次搜尋皆把每個節點、每條邊處理常數次；使用佇列而非遞迴，也能處理十萬人排成一條鏈的情況。答案計算邊數，所以起點距離是 0。",
    ],
    complexity: "時間 O(N)，鄰接表、距離陣列與 BFS 佇列空間 O(N)。",
    pitfall: "不能只沿家長到孩子搜尋，也不能把最長路徑的節點數當成邊數；共同祖先未必是 0。",
    traceLabel: "公開範例二：邊 0–1、0–2、2–3",
    trace: [
      { title: "建立雙向邊", description: "1 可以經由家長 0，再到 2 和 3。", cells: ["1 — 0", "0 — 2", "2 — 3"], active: [0, 1, 2], variables: [["節點數", "4"], ["邊數", "3"]] },
      { title: "第一次 BFS", description: "從 0 的距離依節點 0、1、2、3 排列是 0、1、1、2，最遠為 3。", cells: ["0:0", "1:1", "2:1", "3:2"], active: [3], variables: [["起點", "0"], ["u", "3"]] },
      { title: "第二次 BFS", description: "從 3 的距離是 2、3、1、0，最遠為 1，路徑 3–2–0–1 有 3 條邊。", cells: ["0:2", "1:3", "2:1", "3:0"], active: [1], variables: [["起點", "3"], ["直徑", "3"]] },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <queue>
#include <utility>
using namespace std;

pair<int, int> farthest(const vector<vector<int>> &graph, int start) {
    vector<int> distance(graph.size(), -1);
    queue<int> pending;
    pending.push(start);
    distance[start] = 0;
    int best = start;
    while (!pending.empty()) {
        int u = pending.front();
        pending.pop();
        if (distance[u] > distance[best]) best = u;
        for (int v : graph[u]) {
            if (distance[v] != -1) continue;
            distance[v] = distance[u] + 1;
            pending.push(v);
        }
    }
    return {best, distance[best]};
}

int main() {
    int n;
    cin >> n;
    vector<vector<int>> graph(n);
    for (int i = 0; i < n - 1; ++i) {
        int a, b;
        cin >> a >> b;
        graph[a].push_back(b);
        graph[b].push_back(a);
    }
    int endpoint = farthest(graph, 0).first;
    cout << farthest(graph, endpoint).second << '\n';
}`,
    python: String.raw`import sys
from collections import deque

values = iter(map(int, sys.stdin.read().split()))
n = next(values)
graph = [[] for _ in range(n)]
for _ in range(n - 1):
    a, b = next(values), next(values)
    graph[a].append(b)
    graph[b].append(a)

def farthest(start):
    distance = [-1] * n
    distance[start] = 0
    pending = deque([start])
    best = start
    while pending:
        u = pending.popleft()
        if distance[u] > distance[best]:
            best = u
        for v in graph[u]:
            if distance[v] == -1:
                distance[v] = distance[u] + 1
                pending.append(v)
    return best, distance[best]

endpoint, _ = farthest(0)
print(farthest(endpoint)[1])
`,
  }),
  definePastExamLesson("a438", {
    concept: "排序・及格邊界",
    goal: "排序成績後，找出 60 分分界的左右鄰居。",
    explanation: [
      "先把全部分數遞增排序，這同時完成第一行輸出。排序後，所有小於 60 的分數都在前面，其後才是及格成績，因此只需找第一個大於等於 60 的位置 p。",
      "若 p>0，p−1 就是不及格者中最大的分數；若 p=0，表示全部及格，輸出 best case。若 p<N，p 是及格者中最小的分數；若 p=N，表示全部不及格，輸出 worst case。這兩項判斷分開處理，也能涵蓋只有一位學生的情況。",
    ],
    complexity: "時間 O(N log N)，儲存分數 O(N)；N≤20。",
    pitfall: "60 分已及格；best case 對應沒有不及格者，worst case 對應沒有及格者，兩行不可交換。",
    traceLabel: "示意成績 60、45、59、80、45",
    trace: [
      { title: "排序", description: "保留重複的 45，全部分數由小到大輸出。", cells: ["45", "45", "59", "60", "80"], active: [0, 1, 2, 3, 4], variables: [["N", "5"], ["第一行", "45 45 59 60 80"]] },
      { title: "找到及格起點", description: "索引 0、1、2 的分數都小於 60，第一個及格分數位於 p=3。", cells: ["45", "45", "59", "60", "80"], active: [3], variables: [["p", "3"], ["scores[p]", "60"]] },
      { title: "輸出邊界兩側", description: "分界左鄰為最高不及格 59，分界本身為最低及格 60。", cells: ["45", "45", "59 ← 不及格最高", "60 ← 及格最低", "80"], active: [2, 3], variables: [["第二行", "59"], ["第三行", "60"]] },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

int main() {
    int n;
    cin >> n;
    vector<int> scores(n);
    for (int &score : scores) cin >> score;
    sort(scores.begin(), scores.end());
    for (int i = 0; i < n; ++i) {
        if (i) cout << ' ';
        cout << scores[i];
    }
    cout << '\n';
    int p = 0;
    while (p < n && scores[p] < 60) ++p;
    if (p == 0) cout << "best case\n";
    else cout << scores[p - 1] << '\n';
    if (p == n) cout << "worst case\n";
    else cout << scores[p] << '\n';
}`,
    python: String.raw`import sys

values = list(map(int, sys.stdin.read().split()))
n = values[0]
scores = sorted(values[1:1 + n])
print(*scores)
p = 0
while p < n and scores[p] < 60:
    p += 1
print("best case" if p == 0 else scores[p - 1])
print("worst case" if p == n else scores[p])
`,
  }),
  definePastExamLesson("a439", {
    concept: "矩陣枚舉・不符格數與總和",
    goal: "枚舉每個合法子矩陣，同時計算距離與總和差。",
    explanation: [
      "子矩陣由左上角唯一決定。其列起點可從 0 到 n−s，行起點可從 0 到 m−t，總共 (n−s+1)(m−t+1) 個候選；不能任意挑選不連續的列或行。",
      "對候選左上角 (top,left)，把 A[i][j] 和 B[top+i][left+j] 一一比較。數值不相同就將距離加 1，並把 B 的值加入候選總和。距離是不同的格數，並非數值差的總和。",
      "只在距離≤r 時累加合格個數，並以 |候選總和−A總和| 更新最小值。所有可能位置恰好檢查一次，所以計數與最小值皆完整。矩陣至多 10×100，直接比較每格已足夠；若最後計數為 0，第二行輸出 −1。",
    ],
    complexity: "時間 O((n−s+1)(m−t+1)st)，儲存矩陣 O(st+nm)。",
    pitfall: "最小化的是兩個總和之差的絕對值，不是各格絕對差之和；距離等於 r 仍然合格。",
    traceLabel: "公開範例一：A=[7,4,7]，r=1",
    trace: [
      { title: "第一個視窗", description: "B 的 [6,7,7] 有兩格不同，距離 2 超過 r，不列入統計。", cells: ["6 ≠ 7", "7 ≠ 4", "7 = 7"], active: [0, 1], variables: [["距離", "2"], ["合格數", "0"]] },
      { title: "找到合格視窗", description: "起點 1 的 [7,7,7] 只有中間不同，總和 21 與 A 的 18 差 3。", cells: ["7 = 7", "7 ≠ 4", "7 = 7"], active: [1], variables: [["合格數", "1"], ["最小差", "3"]] },
      { title: "改善最小差", description: "起點 3 的 [7,4,5] 距離 1，總和 16，差為 2；起點 2 的視窗不合格。", cells: ["7 = 7", "4 = 4", "5 ≠ 7"], active: [2], variables: [["合格數", "2"], ["最小差", "2"]] },
      { title: "最後一個合格視窗", description: "起點 7 的 [4,4,7] 距離 1、總和差 3；全部檢查後共有 3 個，最小差 2。", cells: ["4 ≠ 7", "4 = 4", "7 = 7"], active: [0], variables: [["輸出第一行", "3"], ["輸出第二行", "2"]] },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <algorithm>
#include <cstdlib>
using namespace std;

int main() {
    int s, t, n, m, limit;
    cin >> s >> t >> n >> m >> limit;
    vector<vector<int>> a(s, vector<int>(t));
    vector<vector<int>> b(n, vector<int>(m));
    int sum_a = 0;
    for (auto &row : a) {
        for (int &value : row) {
            cin >> value;
            sum_a += value;
        }
    }
    for (auto &row : b) for (int &value : row) cin >> value;
    int count = 0, best = -1;
    for (int top = 0; top + s <= n; ++top) {
        for (int left = 0; left + t <= m; ++left) {
            int distance = 0, sum_b = 0;
            for (int i = 0; i < s; ++i) {
                for (int j = 0; j < t; ++j) {
                    int value = b[top + i][left + j];
                    distance += (value != a[i][j]);
                    sum_b += value;
                }
            }
            if (distance <= limit) {
                ++count;
                int difference = abs(sum_b - sum_a);
                if (best == -1 || difference < best) best = difference;
            }
        }
    }
    cout << count << '\n' << best << '\n';
}`,
    python: String.raw`import sys

values = iter(map(int, sys.stdin.read().split()))
s, t, n, m, limit = [next(values) for _ in range(5)]
a = [[next(values) for _ in range(t)] for _ in range(s)]
b = [[next(values) for _ in range(m)] for _ in range(n)]
sum_a = sum(map(sum, a))
count = 0
best = -1
for top in range(n - s + 1):
    for left in range(m - t + 1):
        distance = 0
        sum_b = 0
        for i in range(s):
            for j in range(t):
                value = b[top + i][left + j]
                distance += value != a[i][j]
                sum_b += value
        if distance <= limit:
            count += 1
            difference = abs(sum_b - sum_a)
            if best == -1 or difference < best:
                best = difference
print(count)
print(best)
`,
  }),
  definePastExamLesson("a440", {
    concept: "矩陣座標・逆操作",
    goal: "把操作順序反過來，逐一做反向旋轉或翻轉以還原矩陣。",
    explanation: [
      "最後做的操作要最先撤銷。例如 A 先旋轉再翻轉得到 B，就必須先把 B 翻回去，再撤銷旋轉。因此從輸入操作串的尾端往前處理，不能直接照原順序操作 B。",
      "上下翻轉的反操作仍是上下翻轉，將第 i 列搬到第 R−1−i 列。順時針旋轉的反操作則為逆時針旋轉：舊矩陣座標 (i,j) 搬到新矩陣 (C−1−j,i)，新尺寸由 R×C 變為 C×R。",
      "旋轉時建立新矩陣再搬移所有元素，避免覆蓋仍待讀取的格子；上下翻轉則可直接交換完整的列。每個座標恰好有唯一新位置，所以單次轉換正確；依序撤銷最後到最早的操作後，就回到 A，最後輸出此時真正的列數與行數。",
    ],
    complexity: "每次元素數量 RC 不變：時間 O(MRC)，矩陣與暫存空間 O(RC)，操作串 O(M)。",
    pitfall: "0 的逆操作是逆時針旋轉，1 是上下翻轉而非左右翻轉；旋轉長方形時要交換列數與行數。",
    traceLabel: "公開範例二：操作 0、1，從 B 還原",
    trace: [
      { title: "讀入結果 B", description: "B 為 3×2，原操作是先順時針旋轉、再上下翻轉。", cells: ["3 3", "2 1", "1 2"], active: [0, 1, 2], variables: [["尺寸", "3×2"], ["撤銷順序", "1 → 0"]] },
      { title: "先撤銷翻轉", description: "上下交換整列，得到 12／21／33。", cells: ["1 2", "2 1", "3 3"], active: [0, 2], variables: [["撤銷操作", "1"], ["尺寸", "3×2"]] },
      { title: "再逆時針旋轉", description: "舊第 2 行由上到下的 2、1、3 成為第一列，得到原矩陣 A。", cells: ["2 1 3", "1 2 3"], active: [0, 1], variables: [["撤銷操作", "0"], ["輸出尺寸", "2 3"]] },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <algorithm>
#include <utility>
using namespace std;

int main() {
    int r, c, m;
    cin >> r >> c >> m;
    vector<vector<int>> matrix(r, vector<int>(c));
    for (auto &row : matrix) for (int &value : row) cin >> value;
    vector<int> operations(m);
    for (int &operation : operations) cin >> operation;
    for (int index = m - 1; index >= 0; --index) {
        if (operations[index] == 1) {
            reverse(matrix.begin(), matrix.end());
        } else {
            vector<vector<int>> next(c, vector<int>(r));
            for (int i = 0; i < r; ++i) {
                for (int j = 0; j < c; ++j) {
                    next[c - 1 - j][i] = matrix[i][j];
                }
            }
            matrix = move(next);
            swap(r, c);
        }
    }
    cout << r << ' ' << c << '\n';
    for (const auto &row : matrix) {
        for (int j = 0; j < c; ++j) {
            if (j) cout << ' ';
            cout << row[j];
        }
        cout << '\n';
    }
}`,
    python: String.raw`import sys

values = iter(map(int, sys.stdin.read().split()))
r, c, m = next(values), next(values), next(values)
matrix = [[next(values) for _ in range(c)] for _ in range(r)]
operations = [next(values) for _ in range(m)]
for operation in reversed(operations):
    if operation == 1:
        matrix.reverse()
    else:
        new_matrix = [[0] * r for _ in range(c)]
        for i in range(r):
            for j in range(c):
                new_matrix[c - 1 - j][i] = matrix[i][j]
        matrix = new_matrix
        r, c = c, r
print(r, c)
for row in matrix:
    print(*row)
`,
  }),
  definePastExamLesson("a441", {
    concept: "字串編碼・滾動 K 進位",
    goal: "把固定長度字串編成連續整數，用出現表找字典序最小的缺字。",
    explanation: [
      "把已排序字母表中的字母編為 0 到 K−1。長度 L 的字串可視為 K 進位數，範圍是 0 到 K^L−1；固定長度與排序後的字母表保證編號順序就是字典序。題目的 K^L≤600000，適合配置每個編號一格的出現表。",
      "掃描 S 時，滾動編號更新成 (舊編號×K+新字母編號) mod K^L，保留最後 L 個有效字母。另記錄連續有效字母數，達到 L 才標記出現；若遇到不在字母表中的字母，編號與連續長度都歸零，因此跨過它的片段不會被誤記。",
      "掃描完後，從 0 起找第一個未出現編號，再反覆除以 K，補滿 L 位並還原成字母。這同時保證答案沒出現且字典序最小。題面未指定所有候選都出現時的輸出；程式在該無解情況結束而不自行發明答案。",
    ],
    complexity: "令 U=K^L：時間 O(|S|+U+L)，出現表 O(U)，含輸入字串的總空間 O(|S|+U+L)。",
    pitfall: "S 可能含字母表以外的字母；需要清除滾動視窗。還原編號必須補足 L 位，保留最前面的第 0 號字母。",
    traceLabel: "公開範例一：字母 acm，L=2，S=accaamcm",
    trace: [
      { title: "建立 3 進位編號", description: "a=0、c=1、m=2；aa 到 mm 對應編號 0 到 8。", cells: ["aa:0", "ac:1", "am:2", "ca:3", "cc:4", "cm:5", "ma:6", "mc:7", "mm:8"], active: [0, 1, 2], variables: [["K^L", "9"], ["視窗長度", "2"]] },
      { title: "標記前半段", description: "依序看到 ac、cc、ca、aa，標記 1、4、3、0。", cells: ["aa:✓", "ac:✓", "am:未見", "ca:✓", "cc:✓", "cm:未見", "ma:未見", "mc:未見", "mm:未見"], active: [1, 4, 3, 0], variables: [["目前片段", "aa"], ["編號", "0"]] },
      { title: "完成所有視窗", description: "後面是 am、mc、cm，再標記 2、7、5。最小未標記編號為 6。", cells: ["aa:✓", "ac:✓", "am:✓", "ca:✓", "cc:✓", "cm:✓", "ma:未見", "mc:✓", "mm:未見"], active: [6], variables: [["缺少編號", "6"], ["3 進位", "20"]] },
      { title: "解碼", description: "兩位 3 進位的 20 對應 m、a，所以輸出 ma。", cells: ["2 → m", "0 → a", "ma"], active: [2], variables: [["答案長度", "2"], ["輸出", "ma"]] },
    ],
    cpp: String.raw`#include <iostream>
#include <string>
#include <vector>
#include <array>
using namespace std;

int main() {
    string alphabet, text;
    int length;
    cin >> alphabet >> length >> text;
    int k = int(alphabet.size()), total = 1;
    for (int i = 0; i < length; ++i) total *= k;
    array<int, 26> digit;
    digit.fill(-1);
    for (int i = 0; i < k; ++i) digit[alphabet[i] - 'a'] = i;
    vector<unsigned char> seen(total, 0);
    int code = 0, valid = 0;
    for (char ch : text) {
        int value = digit[ch - 'a'];
        if (value < 0) {
            code = valid = 0;
            continue;
        }
        code = (code * k + value) % total;
        if (valid < length) ++valid;
        if (valid == length) seen[code] = 1;
    }
    for (int missing = 0; missing < total; ++missing) {
        if (seen[missing]) continue;
        string answer(length, alphabet[0]);
        int value = missing;
        for (int i = length - 1; i >= 0; --i) {
            answer[i] = alphabet[value % k];
            value /= k;
        }
        cout << answer << '\n';
        return 0;
    }
    // The statement does not define output when every candidate occurs.
}`,
    python: String.raw`import sys

alphabet, length_text, text = sys.stdin.read().split()
length = int(length_text)
k = len(alphabet)
total = k ** length
digit = [-1] * 26
for i, ch in enumerate(alphabet):
    digit[ord(ch) - ord('a')] = i
seen = bytearray(total)
code = valid = 0
for ch in text:
    value = digit[ord(ch) - ord('a')]
    if value < 0:
        code = valid = 0
        continue
    code = (code * k + value) % total
    valid = min(valid + 1, length)
    if valid == length:
        seen[code] = 1
missing = seen.find(b'\0')
if missing != -1:
    answer = [alphabet[0]] * length
    for i in range(length - 1, -1, -1):
        missing, value = divmod(missing, k)
        answer[i] = alphabet[value]
    print("".join(answer))
# The statement does not define output when every candidate occurs.
`,
  }),
  definePastExamLesson("a442", {
    concept: "字串結構・集合查找與配對計數",
    goal: "從較長籤的相同前後綴，還原唯一可能配對的較短籤。",
    explanation: [
      "設較短籤為 x、較長籤為 y，長度 a<b。兩籤合起來長度必須為偶數，令 d=(b−a)/2。若 x+y 的左右兩半相等，第一半是 x 加上 y 的前 d 字元 u，所以完整字串必須是 xuxu，等價於 y=uxu。反過來，只要 y 有這種形式，接上 x 便一定成功。",
      "把所有籤放入字串集合。對每個 y，枚舉 1≤d 且 2d<|y|，檢查其長度 d 的前後綴是否完全相同；若相同，再查中間字串 y[d:|y|−d] 是否在集合。比較使用真正的字串內容，不用可能碰撞的滾動雜湊判定相等。",
      "同長度的兩籤若能成功，左右兩半就是兩籤本身，必須相同，但輸入保證籤互異，所以不用考慮。同一成功配對只會在較長的 y 被處理，而且 d 由兩者長度唯一決定，因此不重複計數。每籤最多 100 字元，枚舉至多 49 個切法，遠少於枚舉所有兩籤。",
    ],
    complexity: "設最長籤長 H≤100、總字元數 T。字串集合平均查找模型下時間 O(T+mH²)，空間 O(T+m+H)。切片、比較與字串雜湊皆計入 O(H)；極端雜湊衝突時時間上界 O(T+m²H²)。",
    pitfall: "成功並不代表兩籤都是同一字元重複；例如 y=abyyyab 與 x=yyy 也成功。計數只處理長短不同的方向。",
    traceLabel: "公開範例二：abyyyab、y、yy、yyy、yyyy",
    trace: [
      { title: "長籤 abyyyab", description: "d=1 時前後綴 a、b 不同；d=2 時都是 ab，中間 yyy 存在。", cells: ["ab", "yyy", "ab"], active: [0, 2], variables: [["找到配對", "abyyyab + yyy"], ["累計", "1"]] },
      { title: "長籤 yyy", description: "d=1，前後綴都是 y，中間也是 y，找到另一支籤。", cells: ["y", "y", "y"], active: [1], variables: [["拼接", "y + yyy = yy | yy"], ["累計", "2"]] },
      { title: "長籤 yyyy", description: "d=1，中間 yy 存在，形成第三組。d=2 會讓中間為空，不在列舉範圍內。", cells: ["y", "yy", "y"], active: [1], variables: [["拼接", "yy + yyyy = yyy | yyy"], ["輸出", "3"]] },
    ],
    cpp: String.raw`#include <iostream>
#include <string>
#include <vector>
#include <unordered_set>
using namespace std;

int main() {
    int m;
    cin >> m;
    vector<string> words(m);
    unordered_set<string> available;
    available.reserve(m * 2);
    for (string &word : words) {
        cin >> word;
        available.insert(word);
    }
    long long answer = 0;
    for (const string &word : words) {
        int size = int(word.size());
        for (int d = 1; 2 * d < size; ++d) {
            if (word.compare(0, d, word, size - d, d) != 0) continue;
            string middle = word.substr(d, size - 2 * d);
            if (available.find(middle) != available.end()) ++answer;
        }
    }
    cout << answer << '\n';
}`,
    python: String.raw`import sys

tokens = sys.stdin.read().split()
m = int(tokens[0])
words = tokens[1:1 + m]
available = set(words)
answer = 0
for word in words:
    size = len(word)
    for d in range(1, (size - 1) // 2 + 1):
        if word[:d] == word[size - d:]:
            middle = word[d:size - d]
            if middle in available:
                answer += 1
print(answer)
`,
  }),
  definePastExamLesson("a443", {
    concept: "基礎統計・加權檢查碼",
    goal: "驗證每筆條碼後，只對有效條碼的三位產地碼累加次數。",
    explanation: [
      "條碼必須讀成字串，因為前導零是產地碼的一部分。把前 12 碼轉成個別數字後，1 起算奇數位權重為 1、偶數位權重為 3，得到加權和 W=O+3E；第 13 碼 C 不加入這段迴圈。",
      "由於 W mod 10 與 C 都介於 0 到 9，題目的兩種有效情況等價於 (W+C) mod 10=0。通過檢查才取前三字元更新計數。最後在有效產地中找最大次數；題目保證至少一筆有效且最大者唯一，因此不用另設平手規則。",
    ],
    complexity: "設 U≤min(N,1000) 為產地數，C++ 有序映射時間 O(N(13+log(U+1)))，Python 字典平均時間 O(13N)。計數空間 O(U)，Python 另用 O(13N) 輸入空間。",
    pitfall: "0 起算索引 i=0 對應第 1 位，權重是 1；不要把產地轉成整數而遺失 030 的前導零。",
    traceLabel: "公開範例中的產地 471 與檢查碼",
    trace: [
      { title: "第一筆有效", description: "4710018000102 的奇數位和 O=14、偶數位和 E=8，W=38，C=2。", cells: ["O=14", "3E=24", "C=2", "38+2=40"], active: [3], variables: [["有效", "40 mod 10 = 0"], ["471 次數", "1"]] },
      { title: "保留前導零", description: "0309876543216 的 O=20、E=28，W=104，加檢查碼為 110，有效，產地 030 累加一次。", cells: ["O=20", "3E=84", "C=6", "104+6=110"], active: [3], variables: [["030 次數", "1"], ["471 次數", "1"]] },
      { title: "471 再次累加", description: "4711234560012 的 O=17、E=17，W+C=70，有效，471 增至 2。", cells: ["471:2", "030:1", "300:待檢查"], active: [0], variables: [["目前最多", "471"], ["次數", "2"]] },
      { title: "完成檢查", description: "3001111111118 的 O=7、E=5，W+C=30，也有效；300 只有 1 筆，輸出 471 2。", cells: ["471:2", "030:1", "300:1"], active: [0], variables: [["產地", "471"], ["輸出次數", "2"]] },
    ],
    cpp: String.raw`#include <iostream>
#include <string>
#include <map>
using namespace std;

int main() {
    int n;
    cin >> n;
    map<string, int> count;
    for (int row = 0; row < n; ++row) {
        string barcode;
        cin >> barcode;
        int weighted = 0;
        for (int i = 0; i < 12; ++i) {
            int weight = (i % 2 == 0 ? 1 : 3);
            weighted += weight * (barcode[i] - '0');
        }
        int check = barcode[12] - '0';
        if ((weighted + check) % 10 == 0) {
            ++count[barcode.substr(0, 3)];
        }
    }
    string best;
    int maximum = 0;
    for (const auto &entry : count) {
        if (entry.second > maximum) {
            best = entry.first;
            maximum = entry.second;
        }
    }
    cout << best << ' ' << maximum << '\n';
}`,
    python: String.raw`import sys

tokens = sys.stdin.read().split()
n = int(tokens[0])
count = {}
for barcode in tokens[1:1 + n]:
    weighted = 0
    for i in range(12):
        weight = 1 if i % 2 == 0 else 3
        weighted += weight * int(barcode[i])
    check = int(barcode[12])
    if (weighted + check) % 10 == 0:
        origin = barcode[:3]
        count[origin] = count.get(origin, 0) + 1
best = max(count, key=count.get)
print(best, count[best])
`,
  }),
  definePastExamLesson("a444", {
    concept: "規則模擬・循環位移與頻率",
    goal: "累積每個輪盤的位移，再逐欄統計相同字母的最高次數。",
    explanation: [
      "輪盤旋轉會保留到下回合，因此為每個原始字串維護累積右移量 offset。新的距離 d 加入後，更新為 (offset+d) mod n；即使 d 是負數或超過一整圈，也可化成 0 到 n−1 的等價位移。",
      "右移 offset 格後，畫面位置 j 的字元來自原字串位置 (j−offset) mod n。如此不用真的搬動字串。每回合要先更新所有輪盤位移，再對每個 j 建立 26 個字母的次數表，取該位置的最大次數作為得分。",
      "每個位置的統計只包含本回合該欄的 m 個字元，然後把 n 欄得分加到總分。位移公式保持了每個輪盤的真實狀態，逐欄統計又恰好符合題目定義，因此累加 k 回合便是答案。",
    ],
    complexity: "時間 O(km+kn(m+26))，輪盤儲存 O(mn)、位移與次數表 O(m+26)；讀入全部距離另用 O(km)。",
    pitfall: "每回合距離是加在目前狀態上；C++ 的負數餘數須正規化，不能直接拿負索引存取字串。",
    traceLabel: "示意輪盤 abc、abc、bac，兩回合位移 (1,0,−1)、(−1,1,1)",
    trace: [
      { title: "第一回合旋轉", description: "累積右移量為 1、0、2，畫面分別是 cab、abc、acb。", cells: ["cab", "abc", "acb"], active: [0, 1, 2], variables: [["offset", "[1,0,2]"], ["總分", "0"]] },
      { title: "第一回合逐欄計分", description: "三欄分別為 caa、abc、bcb，最大相同字母次數是 2、1、2。", cells: ["caa → 2", "abc → 1", "bcb → 2"], active: [0, 1, 2], variables: [["本回合", "5"], ["總分", "5"]] },
      { title: "第二回合累積位移", description: "加上 −1、1、1 後，offset 變為 0、1、0，畫面是 abc、cab、bac。", cells: ["abc", "cab", "bac"], active: [0, 1, 2], variables: [["offset", "[0,1,0]"], ["旋轉基準", "原字串＋累積量"]] },
      { title: "累加第二回合", description: "三欄 acb、baa、cbc 分別得 1、2、2，總分 5+5=10。", cells: ["acb → 1", "baa → 2", "cbc → 2"], active: [1, 2], variables: [["本回合", "5"], ["總分", "10"]] },
    ],
    cpp: String.raw`#include <iostream>
#include <string>
#include <vector>
#include <array>
#include <algorithm>
using namespace std;

int main() {
    int m, n, k;
    cin >> m >> n >> k;
    vector<string> wheels(m);
    for (string &wheel : wheels) cin >> wheel;
    vector<int> offset(m, 0);
    int total = 0;
    for (int round = 0; round < k; ++round) {
        for (int i = 0; i < m; ++i) {
            int distance;
            cin >> distance;
            offset[i] = ((offset[i] + distance) % n + n) % n;
        }
        for (int column = 0; column < n; ++column) {
            array<int, 26> count{};
            int best = 0;
            for (int i = 0; i < m; ++i) {
                int source = (column - offset[i] + n) % n;
                int letter = wheels[i][source] - 'a';
                best = max(best, ++count[letter]);
            }
            total += best;
        }
    }
    cout << total << '\n';
}`,
    python: String.raw`import sys

tokens = iter(sys.stdin.read().split())
m, n, k = int(next(tokens)), int(next(tokens)), int(next(tokens))
wheels = [next(tokens) for _ in range(m)]
offset = [0] * m
total = 0
for _ in range(k):
    for i in range(m):
        distance = int(next(tokens))
        offset[i] = (offset[i] + distance) % n
    for column in range(n):
        count = [0] * 26
        best = 0
        for i in range(m):
            source = (column - offset[i]) % n
            letter = ord(wheels[i][source]) - ord('a')
            count[letter] += 1
            best = max(best, count[letter])
        total += best
print(total)
`,
  }),
  definePastExamLesson("a446", {
    concept: "規則模擬・排列搬移與轉置輸出",
    goal: "依來源位置把字元同時搬到指定目的位置，累積前 R 欄的時間序列。",
    explanation: [
      "P_i 表示舊字串第 i 個字元的新位置，因此使用 0 起算陣列時應寫 new[P_i−1]=old[i]。它不是讀取 old[P_i−1] 放到 new[i]。每次準備新的長度 K 陣列，將所有來源字元搬完後才替換目前字串。",
      "一次操作完成後，立刻把新字串第 1 到 R 個字元各自接到對應輸出列。這相當於把每次重排結果排成 Q×K 表格，再讀取前 R 欄；不需要保留其他欄的全部歷史。",
      "排列保證每個目的位置恰好出現一次，所以新陣列不會重複寫入或留空。每次都以上一次結果當來源，因而符合連續重排；記錄從第一次操作之後才開始，不把初始字串算進 Q 列。",
    ],
    complexity: "時間 O(QK+QR)=O(QK)，目前字串與暫存 O(K)，輸出歷史 O(QR)；讀入排列另用 O(QK)。",
    pitfall: "目的位置與來源位置不可顛倒；若直接在舊陣列原地覆寫，尚未搬走的字元可能被破壞。",
    traceLabel: "公開範例一：abcde，Q=4，只輸出第 1 欄",
    trace: [
      { title: "第一次重排", description: "排列 2、1、3、5、4 把 a 放第 2 位、b 放第 1 位，結果 baced。", cells: ["b", "a", "c", "e", "d"], active: [0], variables: [["目前字串", "baced"], ["第 1 欄歷史", "b"]] },
      { title: "第二次重排", description: "以 baced 為來源，排列 5、1、2、4、3 得到 acdeb。", cells: ["a", "c", "d", "e", "b"], active: [0], variables: [["目前字串", "acdeb"], ["第 1 欄歷史", "ba"]] },
      { title: "第三次重排", description: "排列 4、1、2、3、5 得到 cdeab，記下 c。", cells: ["c", "d", "e", "a", "b"], active: [0], variables: [["目前字串", "cdeab"], ["第 1 欄歷史", "bac"]] },
      { title: "第四次重排並輸出", description: "排列 3、1、4、5、2 得到 dbcea，最後接上 d，輸出 bacd。", cells: ["d", "b", "c", "e", "a"], active: [0], variables: [["已記錄次數", "4"], ["輸出", "bacd"]] },
    ],
    cpp: String.raw`#include <iostream>
#include <string>
#include <vector>
using namespace std;

int main() {
    int k, q, r;
    string current;
    cin >> k >> q >> r >> current;
    vector<string> columns(r);
    for (int round = 0; round < q; ++round) {
        string next(k, ' ');
        for (int i = 0; i < k; ++i) {
            int destination;
            cin >> destination;
            next[destination - 1] = current[i];
        }
        current = next;
        for (int j = 0; j < r; ++j) columns[j] += current[j];
    }
    for (const string &column : columns) cout << column << '\n';
}`,
    python: String.raw`import sys

tokens = iter(sys.stdin.read().split())
k, q, r = int(next(tokens)), int(next(tokens)), int(next(tokens))
current = list(next(tokens))
columns = [[] for _ in range(r)]
for _ in range(q):
    new_string = [''] * k
    for i in range(k):
        destination = int(next(tokens)) - 1
        new_string[destination] = current[i]
    current = new_string
    for j in range(r):
        columns[j].append(current[j])
for column in columns:
    print(''.join(column))
`,
  }),
  definePastExamLesson("a448", {
    concept: "字串區段・維護可延伸的交錯鏈",
    goal: "把連續同大小寫的字母壓成區段，判斷哪些能當中間或兩端區塊。",
    explanation: [
      "先把 S 壓成連續同大小寫區段的長度。相鄰區段的大小寫天然交替。合法子字串若跨過多個區段，中間整段都必須使用，而且每段必須恰好長 k；只有最前與最後的區段可以截取其中 k 個字元。",
      "維護 chain，表示以已處理區段的尾端結束、還可接到下一段的最佳區塊數。遇到長度小於 k 的區段就斷鏈。遇到長度等於 k 的區段，可完整接上，令 chain 加 1，並用 chain×k 更新答案。",
      "遇到長度大於 k 的區段，先取它前面的 k 個字元當終點，以 (chain+1)×k 更新答案；但這段不能作為中間完整區塊，故之後的 chain 要重設為 1，代表取它尾端 k 個字元重新出發。這兩種用法分開，就涵蓋所有合法兩端，也不會跨越多餘的同大小寫字元。",
    ],
    complexity: "令 D 為 k 的輸入位數：時間 O(|S|+D)，區段與輸入儲存 O(|S|+D)；掃描區段只用 O(1) 額外狀態。讀取 k 時將值封頂為 |S|+1，避免未限制的 k 溢位。",
    pitfall: "長度超過 k 的區段可以作為端點，不能直接整段丟棄，也不能讓交錯鏈穿過整段；k>|S| 時答案為 0。",
    traceLabel: "公開範例三：k=2，S=aafAXbbCDCCC",
    trace: [
      { title: "壓縮大小寫區段", description: "同為小寫的 aaf 長 3，AX 長 2，bb 長 2，CDCCC 長 5。", cells: ["aaf:3", "AX:2", "bb:2", "CDCCC:5"], active: [0, 1, 2, 3], variables: [["k", "2"], ["區段長度", "[3,2,2,5]"]] },
      { title: "長段作為起點", description: "aaf 比 k 長，可取尾端 af 當開頭，chain=1。", cells: ["af", "AX", "bb", "CDCCC"], active: [0], variables: [["chain", "1"], ["best", "2"]] },
      { title: "接上兩個完整區塊", description: "AX、bb 都恰長 2，依序接上，得到 afAXbb，長度 6。", cells: ["af", "AX", "bb", "CDCCC"], active: [1, 2], variables: [["chain", "3"], ["best", "6"]] },
      { title: "長段作為終點", description: "取 CDCCC 的前兩字 CD，得到 afAXbbCD，長 8；之後只能取尾端 CC 重新起鏈。", cells: ["af", "AX", "bb", "CD", "剩餘 CCC"], active: [0, 1, 2, 3], variables: [["best", "8"], ["新的 chain", "1"]] },
    ],
    cpp: String.raw`#include <iostream>
#include <string>
#include <vector>
#include <algorithm>
using namespace std;

bool uppercase(char ch) {
    return ch >= 'A' && ch <= 'Z';
}

int main() {
    string k_text, text;
    cin >> k_text >> text;
    int cap = int(text.size()) + 1;
    int k = 0;
    for (char digit : k_text) {
        k = min(cap, k * 10 + (digit - '0'));
    }
    if (k > int(text.size())) {
        cout << 0 << '\n';
        return 0;
    }
    vector<int> runs;
    int length = 1;
    for (int i = 1; i < int(text.size()); ++i) {
        if (uppercase(text[i]) == uppercase(text[i - 1])) {
            ++length;
        } else {
            runs.push_back(length);
            length = 1;
        }
    }
    runs.push_back(length);
    int block_size = k, chain = 0, best = 0;
    for (int run : runs) {
        if (run < block_size) {
            chain = 0;
        } else {
            best = max(best, (chain + 1) * block_size);
            if (run == block_size) ++chain;
            else chain = 1;
        }
    }
    cout << best << '\n';
}`,
    python: String.raw`import sys

k_text, text = sys.stdin.read().split()
k = 0
cap = len(text) + 1
for digit in k_text:
    k = min(cap, k * 10 + ord(digit) - ord('0'))
runs = []
length = 1
for i in range(1, len(text)):
    if text[i].isupper() == text[i - 1].isupper():
        length += 1
    else:
        runs.append(length)
        length = 1
runs.append(length)
chain = best = 0
for run in runs:
    if run < k:
        chain = 0
    else:
        best = max(best, (chain + 1) * k)
        chain = chain + 1 if run == k else 1
print(best)
`,
  }),
];
