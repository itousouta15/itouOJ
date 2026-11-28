import type { ToiPotentialLesson } from "@/lib/toiPotentialLessonTypes";
import { defineToiPotentialLesson } from "@/lib/toiPotentialLessonBuilder";

export const lessons: ToiPotentialLesson[] = [
  defineToiPotentialLesson("a320", {
    topic: "data-structures",
    level: "medium",
    concept: "二維差分・矩形四角標記",
    goal: "每筆矩形只改四個位置，最後一次還原所有格子的累計雨量。",
    explanation: [
      "紀錄涵蓋的是半開矩形 [x1,x2)×[y1,y2)。在差分陣列的 (x1,y1)、(x2,y2) 加 v，在 (x1,y2)、(x2,y1) 減 v。二維前綴和會把左上角的增加傳到右下；另兩個負標記取消矩形外的部分，而右下正標記補回被重複取消的部分。",
      "所有紀錄完成後逐列還原。每列用 running 累積該列差分，再加上上一列已還原的同欄雨量，就等於二維前綴和。必須配置第 R 列與第 C 欄的哨兵，因為矩形右下端點可以正好等於區域尺寸；只輸出真正的 R×C 格。",
    ],
    complexity:
      "R、C≤1000、Q≤500000，時間 O(Q+RC)，空間 O(RC)。單格最多 5×10⁷，C++ 仍使用 long long 讓累加容易檢查。",
    pitfall: "x2、y2 不包含在矩形中，負標記應直接放在這兩個端點，不能再加一。",
    traceLabel: "公開範例：兩個矩形重疊",
    trace: [
      {
        title: "第一筆",
        description: "第 0、1 列，第 0..2 欄各加 7。",
        cells: ["7 7 7 0", "7 7 7 0", "0 0 0 0"],
        active: [0, 1],
        variables: [["矩形", "[0,2)×[0,3)"]],
      },
      {
        title: "第二筆",
        description: "第 1、2 列，第 2、3 欄各加 5。",
        cells: ["7 7 7 0", "7 7 12 5", "0 0 5 5"],
        active: [1, 2],
        variables: [["重疊格(1,2)", "7+5=12"]],
      },
      {
        title: "前綴還原",
        description: "逐列累積差分後得到這三列；未覆蓋位置仍為 0。",
        cells: ["7 7 7 0", "7 7 12 5", "0 0 5 5"],
        active: [0, 1, 2],
        variables: [
          ["總格數", "12"],
          ["最大雨量", "12"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
using namespace std;
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int r, c, q;
    cin >> r >> c >> q;
    int stride = c + 1;
    vector<long long> d((r + 1) * stride);
    while (q--) {
        int x1, y1, x2, y2, v;
        cin >> x1 >> y1 >> x2 >> y2 >> v;
        d[x1 * stride + y1] += v;
        d[x1 * stride + y2] -= v;
        d[x2 * stride + y1] -= v;
        d[x2 * stride + y2] += v;
    }
    for (int i = 0; i < r; ++i) {
        long long running = 0;
        for (int j = 0; j < c; ++j) {
            int p = i * stride + j;
            running += d[p];
            d[p] = running + (i ? d[p - stride] : 0);
            if (j)
                cout << ' ';
            cout << d[p];
        }
        cout << '\n';
    }
}`,
    python: String.raw`import sys
from array import array

read = sys.stdin.buffer.readline
r, c = map(int, read().split())
q = int(read())
stride = c + 1
d = array('q', [0]) * ((r + 1) * stride)
for _ in range(q):
    x1, y1, x2, y2, v = map(int, read().split())
    d[x1 * stride + y1] += v
    d[x1 * stride + y2] -= v
    d[x2 * stride + y1] -= v
    d[x2 * stride + y2] += v
for i in range(r):
    running = 0
    row = []
    for j in range(c):
        p = i * stride + j
        running += d[p]
        d[p] = running + (d[p - stride] if i else 0)
        row.append(str(d[p]))
    print(' '.join(row))
`,
  }),
  defineToiPotentialLesson("a321", {
    topic: "dp",
    level: "medium",
    concept: "必勝必敗狀態・減法遊戲",
    goal: "預先算出所有詢問範圍內的勝負，不重複展開同一局面。",
    explanation: [
      "令 win[s] 表示輪到行動的人在剩 s 顆石頭時能否必勝。win[0]=false，因為輪到時已沒有石頭就輸。若有合法取法 p≤s，使 win[s−p] 為 false，就可把必敗局面交給對手，因此 win[s]=true；如果所有合法下一步都必勝，自己只能輸。",
      "先讀完所有初始石頭數，依 s=1..maxQ 的順序計算，因為每次取走正數，只會用到較小狀態。取法去重並排序可省去重複工作，遇到 p>s 就停止。第一個取法一定是 1，故正數局面總有合法步；每個詢問直接查表輸出 Win! 或 Lose。",
    ],
    complexity:
      "令 U=maxQ≤2×10⁶、P 為相異取法數≤50。時間 O(PU+M)，空間 O(U+M+P)，Python 用 bytearray 保存勝負。",
    pitfall:
      "這是拿完最後一顆者獲勝的規則；win[0] 不能設成 true。重複取法不是額外的策略。",
    traceLabel: "公開範例 1：可取 1、2、3、4、5 顆",
    trace: [
      {
        title: "基底與小局面",
        description: "0 顆是必敗，1..5 顆都能一次取完。",
        cells: ["0敗", "1勝", "2勝", "3勝", "4勝", "5勝"],
        active: [0, 1, 2, 3, 4, 5],
        variables: [["win[0]", "false"]],
      },
      {
        title: "剩 6 顆",
        description: "取 1..5 只會留下 5..1，全部是對手必勝。",
        cells: ["6→5", "6→4", "6→3", "6→2", "6→1"],
        active: [0, 1, 2, 3, 4],
        variables: [
          ["win[6]", "false"],
          ["輸出", "Lose"],
        ],
      },
      {
        title: "剩 7 顆",
        description: "先取 1 顆，留下必敗的 6 顆。",
        cells: ["7勝", "取1", "6敗"],
        active: [1, 2],
        variables: [
          ["win[7]", "true"],
          ["輸出", "Win!"],
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
    vector<int> p(n);
    for (auto &x : p)
        cin >> x;
    sort(p.begin(), p.end());
    p.erase(unique(p.begin(), p.end()), p.end());
    int m;
    cin >> m;
    vector<int> queries(m);
    int limit = 0;
    for (auto &q : queries) {
        cin >> q;
        limit = max(limit, q);
    }
    vector<unsigned char> win(limit + 1);
    for (int s = 1; s <= limit; ++s)
        for (int x : p) {
            if (x > s)
                break;
            if (!win[s - x]) {
                win[s] = 1;
                break;
            }
        }
    for (int q : queries)
        cout << (win[q] ? "Win!" : "Lose") << '\n';
}`,
    python: String.raw`import sys

it = iter(map(int, sys.stdin.buffer.read().split()))
n = next(it)
p = sorted({next(it) for _ in range(n)})
m = next(it)
queries = [next(it) for _ in range(m)]
limit = max(queries)
win = bytearray(limit + 1)
for s in range(1, limit + 1):
    for x in p:
        if x > s:
            break
        if not win[s - x]:
            win[s] = 1
            break
sys.stdout.write('\n'.join('Win!' if win[q] else 'Lose' for q in queries) + '\n')
`,
  }),
  defineToiPotentialLesson("a322", {
    topic: "graphs",
    level: "medium",
    concept: "立體連通分量・六方向 flood fill",
    goal: "按共面相鄰的空間解讀，找出最大的 0 連通分量，並揭露原題方向規格的限制。",
    explanation: [
      "本題原稿沒有逐一列出方向，只有立體圖示；以下採格子共面相鄰的六方向（±x、±y、±z），這個解讀符合兩組官方範例，但不能宣稱是原文明訂的方向清單。把每層排成 W 列、每列 L 格，索引為 z×LW+y×L+x。左右、前後、上下分別差 1、L、LW，仍須檢查各自座標邊界，不能讓列尾接到下一列開頭。",
      "掃描全部格子，每遇到尚未拜訪的 0 就以顯式堆疊展開整個連通分量，將發現的格子立即改為 1，避免重複入堆疊。每次展開完成後更新最大格數。每個空格只被計數一次，牆不進入搜尋；全部是牆時答案為 0。最大體積超過兩百萬格，不能用逐格遞迴。",
    ],
    complexity:
      "V=LWH≤135³=2460375，六方向搜尋時間 O(V)，輸入與顯式堆疊空間 O(V)。Python 堆疊使用 array('I')。",
    pitfall:
      "六方向是依圖及樣例採取的解讀，若正式題庫另定邊或角相鄰就必須調整；不要忽略一維索引跨列的假相鄰。",
    traceLabel: "較小示例：L=2、W=2、H=1，字串 0010",
    trace: [
      {
        title: "從索引 0 出發",
        description: "空格 (0,0,0) 入堆疊並立刻標記。",
        cells: ["0已訪", "1空", "2牆", "3空"],
        active: [0],
        variables: [
          ["分量大小", "0"],
          ["堆疊", "0"],
        ],
      },
      {
        title: "到索引 1",
        description: "索引 0 的右鄰 1 可通行，下鄰 2 是牆；1 又連到 3。",
        cells: ["0已訪", "1已訪", "2牆", "3已訪"],
        active: [1, 3],
        variables: [
          ["已彈出格數", "2"],
          ["待處理", "3"],
        ],
      },
      {
        title: "完成分量",
        description: "索引 3 處理完畢，三個 0 同屬一個空間。",
        cells: ["0✓", "1✓", "2牆", "3✓"],
        active: [0, 1, 3],
        variables: [["最大空間", "3"]],
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
    int l, w, h;
    cin >> l >> w >> h;
    string grid, part;
    int layer = l * w, volume = layer * h;
    while ((int)grid.size() < volume && cin >> part)
        grid += part;
    vector<int> stack;
    int answer = 0;
    auto visit = [&](int p) {
        if (grid[p] == '0') {
            grid[p] = '1';
            stack.push_back(p);
        }
    };
    for (int start = 0; start < volume; ++start)
        if (grid[start] == '0') {
            visit(start);
            int count = 0;
            while (!stack.empty()) {
                int p = stack.back();
                stack.pop_back();
                ++count;
                int x = p % l, y = (p / l) % w, z = p / layer;
                if (x)
                    visit(p - 1);
                if (x + 1 < l)
                    visit(p + 1);
                if (y)
                    visit(p - l);
                if (y + 1 < w)
                    visit(p + l);
                if (z)
                    visit(p - layer);
                if (z + 1 < h)
                    visit(p + layer);
            }
            answer = max(answer, count);
        }
    cout << answer << '\n';
}`,
    python: String.raw`import sys
from array import array

read = sys.stdin.buffer.readline
l, w, h = map(int, read().split())
grid = bytearray(b''.join(sys.stdin.buffer.read().split()))
layer = l * w
volume = layer * h
stack = array('I')


def visit(p):
    if grid[p] == 48:
        grid[p] = 49
        stack.append(p)


answer = 0
for start in range(volume):
    if grid[start] != 48:
        continue
    visit(start)
    count = 0
    while stack:
        p = stack.pop()
        count += 1
        x, y, z = p % l, (p // l) % w, p // layer
        if x:
            visit(p - 1)
        if x + 1 < l:
            visit(p + 1)
        if y:
            visit(p - l)
        if y + 1 < w:
            visit(p + l)
        if z:
            visit(p - layer)
        if z + 1 < h:
            visit(p + layer)
    answer = max(answer, count)
print(answer)
`,
  }),
  defineToiPotentialLesson("a323", {
    topic: "data-structures",
    level: "hard",
    concept: "離線位元運算・最後一次強制設定位元與 XOR 後綴",
    goal: "避開對同一批倍數重複執行大量指令，依查詢編號的因數重建最終值。",
    explanation: [
      "原題未界定 P、Q 或負數位元表示；本教學明示採 P 為正整數、合法查詢編號與 32 位元二補數的常見解讀，Q 只取低 32 位，這些未明示邊界仍待出題方確認。對每一個位元，AND 的 0 或 OR 的 1 會強制設定值，AND 的 1、OR 的 0 不影響值，XOR 的 1 則翻轉。最終值只取決於最後一次強制設定及它後面的 XOR；沒有強制設定的位元從初值出發。",
      "依 P 分組，記錄每個位元的最後強制設定時間與值，並保存 XOR 指令時間及 XOR 前綴。查詢編號 i 時只考慮 P|i 的組；枚舉 i 的因數，合併各位元的最後設定，再依設定時間分組成位元遮罩。對每個時間遮罩、每個因數組，用二分搜尋求該時間之後的 XOR 後綴並套用。修改都在查詢前，因此資料可一次建完，重複查詢另有快取。此法保留跨 P 的時間順序，不能將各 P 的完整轉換任意交換。",
    ],
    complexity:
      "設 U 是相異查詢數、D 是這些編號的有效因數組總數，B=32、R≤25000。時間 O(N+BR+U√N+BD log(R+1))，空間 O(N+BR+R)。N≤10⁶；每個查詢最多有 32 種強制時間。比逐條修改全部倍數的 O(NR) 更能處理重複小 P。",
    pitfall:
      "倍數指的是編號。原題的 P=0、非法查詢、非 32 位元 Q 未定義；程式防止 P≤0 的無窮迴圈，但不把這些防護當作官方規格。",
    traceLabel: "較小示例：初值 7,7,7,7；AND(1,6)、OR(2,1)、XOR(1,3)",
    trace: [
      {
        title: "AND 清最低位",
        description: "四個值由 111 變成 110。",
        cells: ["6", "6", "6", "6"],
        active: [0, 1, 2, 3],
        variables: [
          ["最低位最後設定時間", "1"],
          ["設定值", "0"],
        ],
      },
      {
        title: "偶數編號 OR 1",
        description: "編號 2、4 的最低位改成 1，最後設定時間變為 2。",
        cells: ["6", "7", "6", "7"],
        active: [1, 3],
        variables: [
          ["奇數最低位", "t=1,0"],
          ["偶數最低位", "t=2,1"],
        ],
      },
      {
        title: "全部 XOR 3",
        description: "最後翻轉低兩位，奇數得到 5，偶數得到 4。",
        cells: ["5", "4", "5", "4"],
        active: [0, 1, 2, 3],
        variables: [
          ["6 XOR 3", "5"],
          ["7 XOR 3", "4"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <array>
#include <unordered_map>
#include <map>
#include <algorithm>
#include <cstdint>
using namespace std;
struct Group {
    array<int, 32> last{};
    uint32_t ones = 0;
    vector<int> times;
    vector<uint32_t> prefix{0};
};
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    vector<uint32_t> initial(n + 1);
    for (int i = 1; i <= n; ++i) {
        long long x;
        cin >> x;
        initial[i] = (uint32_t)x;
    }
    unordered_map<int, Group> groups;
    unordered_map<int, uint32_t> cache;
    int type, time = 0;
    while (cin >> type && type) {
        int p;
        cin >> p;
        ++time;
        if (type != 1) {
            long long q;
            cin >> q;
            if (p <= 0 || p > n)
                continue;
            uint32_t mask = (uint32_t)q;
            auto &g = groups[p];
            if (type == 4) {
                g.times.push_back(time);
                g.prefix.push_back(g.prefix.back() ^ mask);
            } else {
                uint32_t force = type == 2 ? ~mask : mask;
                for (int b = 0; b < 32; ++b)
                    if (force & (uint32_t(1) << b)) {
                        g.last[b] = time;
                        if (type == 3)
                            g.ones |= uint32_t(1) << b;
                        else
                            g.ones &= ~(uint32_t(1) << b);
                    }
            }
            continue;
        }
        if (p < 1 || p > n)
            continue;
        if (!cache.count(p)) {
            vector<const Group *> applicable;
            auto include = [&](int d) {
                auto it = groups.find(d);
                if (it != groups.end())
                    applicable.push_back(&it->second);
            };
            for (int d = 1; 1LL * d * d <= p; ++d)
                if (p % d == 0) {
                    include(d);
                    if (d * d != p)
                        include(p / d);
                }
            array<int, 32> last{};
            uint32_t value = initial[p];
            for (auto g : applicable)
                for (int b = 0; b < 32; ++b)
                    if (g->last[b] > last[b]) {
                        last[b] = g->last[b];
                        uint32_t bit = uint32_t(1) << b;
                        value = (value & ~bit) | (g->ones & bit);
                    }
            map<int, uint32_t> masks;
            for (int b = 0; b < 32; ++b)
                masks[last[b]] |= uint32_t(1) << b;
            for (auto g : applicable)
                for (auto [cutoff, mask] : masks) {
                    int k =
                        upper_bound(g->times.begin(), g->times.end(), cutoff) - g->times.begin();
                    value ^= (g->prefix.back() ^ g->prefix[k]) & mask;
                }
            cache[p] = value;
        }
        uint32_t value = cache[p];
        cout << (int64_t(value) - (value >> 31 ? 4294967296LL : 0)) << '\n';
    }
}`,
    python: String.raw`import sys
from math import isqrt
from bisect import bisect_right


def integers():
    for line in sys.stdin.buffer:
        yield from map(int, line.split())


it = integers()
n = next(it)
MASK = (1 << 32) - 1
initial = [0] + [next(it) & MASK for _ in range(n)]
# A group contains last forced bits, XOR times, XOR prefix values.
groups = {}
cache = {}
time = 0
for kind in it:
    if kind == 0:
        break
    p = next(it)
    time += 1
    if kind != 1:
        q = next(it) & MASK
        if not 1 <= p <= n:
            continue
        forced, times, prefix = groups.setdefault(p, ({}, [], [0]))
        if kind == 4:
            times.append(time)
            prefix.append(prefix[-1] ^ q)
        else:
            bits = (MASK ^ q) if kind == 2 else q
            while bits:
                bit = bits & -bits
                forced[bit] = (time, kind == 3)
                bits -= bit
        continue
    if not 1 <= p <= n:
        continue
    if p not in cache:
        applicable = []
        for d in range(1, isqrt(p) + 1):
            if p % d == 0:
                if d in groups:
                    applicable.append(groups[d])
                other = p // d
                if other != d and other in groups:
                    applicable.append(groups[other])
        latest = {}
        for forced, _, _ in applicable:
            for bit, record in forced.items():
                if bit not in latest or record[0] > latest[bit][0]:
                    latest[bit] = record
        value = initial[p]
        masks = {0: MASK}
        for bit, (cutoff, one) in latest.items():
            value = (value | bit) if one else (value & ~bit)
            masks[0] &= ~bit
            masks[cutoff] = masks.get(cutoff, 0) | bit
        for _, times, prefix in applicable:
            for cutoff, mask in masks.items():
                value ^= (prefix[-1] ^ prefix[bisect_right(times, cutoff)]) & mask
        cache[p] = value
    value = cache[p]
    print(value if value < (1 << 31) else value - (1 << 32))
`,
  }),
  defineToiPotentialLesson("a324", {
    topic: "graphs",
    level: "hard",
    concept: "DAG 路線計數・拓樸序與任意精度加法",
    goal: "在沒有答案位元上界的題目中，精確計算起點到終點的路線數。",
    explanation: [
      "不會重訪階段的保證讓可行遊戲圖可用 DAG 模型處理。令 ways[v] 為從 0 走到 v 的路線數，ways[0]=1；拓樸排序取出 u 後，對每條 u→v 執行 ways[v]+=ways[u]。當 v 的入度歸零時，所有前驅已處理，因此 ways[v] 已完整，計數不會少算或重複。階段編號不保證就是拓樸序，不能直接由小編號算到大編號。",
      "原題沒有取模或答案上界，故 Python 使用內建任意精度整數，C++ 實作以 10⁹ 為基底的非負大整數加法。處理完節點的計數可釋放，減少長鏈留下大量大數的空間。事件數限制中的 S 未定義，所以以下複雜度保留 E，不能把 E≤2N 當作已確認規格；大數運算也不能算作固定時間。",
    ],
    complexity:
      "令 B 為中間計數的最大二進位長度，時間 O(N+E+EB) 位元量級，儲存圖 O(N+E)，大數最壞 O(NB) 位元；十進位輸出另有轉換成本。N≤10⁶，使用顯式拓樸佇列，無深遞迴。",
    pitfall:
      "long long 在分岔很多時會溢位。原題 E 的 S 符號與答案上界都待確認，不能自行加取模或宣稱完整限制下固定線性時間。",
    traceLabel: "較小示例：0→1、0→2、1→2、1→3、2→3",
    trace: [
      {
        title: "處理起點",
        description: "空路線給 ways[0]=1，沿兩條邊傳到 1、2。",
        cells: ["0:1", "1:1", "2:1", "3:0"],
        active: [1, 2],
        variables: [["下個拓樸節點", "1"]],
      },
      {
        title: "處理節點 1",
        description: "向 2、3 各加一條前綴路線。",
        cells: ["0:已釋放", "1:1", "2:2", "3:1"],
        active: [2, 3],
        variables: [["ways[2]", "2"]],
      },
      {
        title: "處理節點 2",
        description: "兩條到達 2 的路線都能接到 3，所以終點共 3 條。",
        cells: ["0→1→3", "0→2→3", "0→1→2→3"],
        active: [0, 1, 2],
        variables: [["ways[3]", "1+2=3"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <cstdint>
#include <iomanip>
using namespace std;
struct Big {
    static constexpr uint64_t base = 1000000000;
    vector<uint32_t> d;
    void add(const Big &other) {
        if (d.size() < other.d.size())
            d.resize(other.d.size());
        uint64_t carry = 0;
        for (size_t i = 0; i < d.size(); ++i) {
            uint64_t s = uint64_t(d[i]) + carry + (i < other.d.size() ? other.d[i] : 0);
            d[i] = s % base;
            carry = s / base;
        }
        if (carry)
            d.push_back(carry);
    }
    void print() const {
        if (d.empty()) {
            cout << 0;
            return;
        }
        cout << d.back();
        for (int i = (int)d.size() - 2; i >= 0; --i)
            cout << setw(9) << setfill('0') << d[i];
    }
};
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, e;
    cin >> n >> e;
    vector<int> head(n, -1), to(e), next(e), degree(n);
    for (int k = 0; k < e; ++k) {
        int u, v;
        cin >> u >> v;
        to[k] = v;
        next[k] = head[u];
        head[u] = k;
        ++degree[v];
    }
    vector<int> queue;
    queue.reserve(n);
    for (int i = 0; i < n; ++i)
        if (!degree[i])
            queue.push_back(i);
    vector<Big> ways(n);
    ways[0].d.push_back(1);
    for (size_t front = 0; front < queue.size(); ++front) {
        int u = queue[front];
        for (int k = head[u]; k != -1; k = next[k]) {
            int v = to[k];
            ways[v].add(ways[u]);
            if (--degree[v] == 0)
                queue.push_back(v);
        }
        if (u != n - 1)
            vector<uint32_t>().swap(ways[u].d);
    }
    ways[n - 1].print();
    cout << '\n';
}`,
    python: String.raw`import sys
from array import array

if hasattr(sys, 'set_int_max_str_digits'):
    sys.set_int_max_str_digits(0)
read = sys.stdin.buffer.readline
n, e = map(int, read().split())
head = array('i', [-1]) * n
to = array('I')
link = array('i')
degree = array('I', [0]) * n
for k in range(e):
    u, v = map(int, read().split())
    to.append(v)
    link.append(head[u])
    head[u] = k
    degree[v] += 1
queue = array('I', (i for i in range(n) if degree[i] == 0))
ways = [0] * n
ways[0] = 1
front = 0
while front < len(queue):
    u = queue[front]
    front += 1
    k = head[u]
    while k != -1:
        v = to[k]
        ways[v] += ways[u]
        degree[v] -= 1
        if degree[v] == 0:
            queue.append(v)
        k = link[k]
    if u != n - 1:
        ways[u] = 0
print(ways[n - 1])
`,
  }),
  defineToiPotentialLesson("a325", {
    topic: "geometry",
    level: "hard",
    concept: "非負斜率路線・保留共線點的下凸鏈",
    goal: "以整數叉積找出從左端出發、優先最小化前段斜率的路線。",
    explanation: [
      "先依 x、y 排序。對起點 y0 以下的點，由於每段斜率不能是負數，根本不可能到達，先排除。在剩餘點中建立下凸鏈：當末三點形成順時針轉彎時，刪掉中間點，因為直接走向後點能使前一段的斜率更小。留下的鏈斜率不下降；從起點出發的第一段具有最小可行斜率，後續在新的起點上重複同樣論證。",
      "叉積為 (bx−ax)(cy−ay)−(by−ay)(cx−ax)，只在它小於 0 時彈出；等於 0 要保留中間點，符合官方補充『直線路段上的點全保留』。原題的多個最左／最右點、重複座標規則仍不完整。程式為了行為確定，同 x 只留最低 y、重複座標合併；這是明示的退化輸入約定，並非已確認的官方規格。一般端點唯一的情況依下凸鏈輸出，順序為範例採用的 x 升序。",
    ],
    complexity:
      "N≤10⁶，時間 O(N log N)，空間 O(N)。座標在 [0,2³¹−1]，差值乘積需先提升為 64 位元；叉積在此座標方框內不超過 (2³¹−1)² 的絕對值。",
    pitfall:
      "不能使用浮點斜率，也不能在叉積等於 0 時刪點；端點或座標重複的結果仍需官方補足規則，不能把程式約定當成唯一正解。",
    traceLabel: "公開範例 3：(0,0)、(1,1)、(2,0)、(3,1)",
    trace: [
      {
        title: "前兩點入鏈",
        description: "先留下 (0,0)、(1,1)，暫定斜率為 1。",
        cells: ["(0,0)", "(1,1)"],
        active: [0, 1],
        variables: [["鏈長", "2"]],
      },
      {
        title: "加入 (2,0)",
        description: "叉積 1×0−1×2=−2，刪除 (1,1)，第一段斜率降為 0。",
        cells: ["(0,0)", "(2,0)"],
        active: [1],
        variables: [
          ["叉積", "−2"],
          ["第一段斜率", "0"],
        ],
      },
      {
        title: "加入終點",
        description: "叉積為 2>0，保留 (2,0)，路線斜率依次為 0、1。",
        cells: ["(0,0)", "(2,0)", "(3,1)"],
        active: [2],
        variables: [["輸出點數", "3"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <algorithm>
#include <utility>
using namespace std;
using Point = pair<long long, long long>;
long long cross(Point a, Point b, Point c) {
    return (b.first - a.first) * (c.second - a.second) -
           (b.second - a.second) * (c.first - a.first);
}
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    vector<Point> p(n);
    for (auto &v : p)
        cin >> v.first >> v.second;
    sort(p.begin(), p.end());
    vector<Point> chain;
    long long startY = p.front().second, previousX = -1;
    for (auto v : p) {
        if (v.first == previousX)
            continue;
        previousX = v.first;
        if (v.second < startY)
            continue;
        while (chain.size() >= 2 && cross(chain[chain.size() - 2], chain.back(), v) < 0)
            chain.pop_back();
        chain.push_back(v);
    }
    for (auto v : chain)
        cout << v.first << ' ' << v.second << '\n';
}`,
    python: String.raw`import sys

read = sys.stdin.buffer.readline
n = int(read())
points = sorted(tuple(map(int, read().split())) for _ in range(n))
start_y = points[0][1]
previous_x = -1
chain = []
for x, y in points:
    if x == previous_x:
        continue
    previous_x = x
    if y < start_y:
        continue
    while len(chain) >= 2:
        ax, ay = chain[-2]
        bx, by = chain[-1]
        if (bx - ax) * (y - ay) - (by - ay) * (x - ax) >= 0:
            break
        chain.pop()
    chain.append((x, y))
for point in chain:
    print(*point)
`,
  }),
  defineToiPotentialLesson("a326", {
    topic: "math",
    level: "hard",
    concept: "排除平手的條件機率・整數交叉相乘",
    goal: "正確比較加入卡片前後的勝率，找出可行的最小既有牌值。",
    explanation: [
      "令原有所有實體卡片配對中的勝局、敗局數為 W、L，平手放回重抽後的最終勝率為 W/(W+L)，而不是 W/(XY)。將對手牌排序後，某張值 v 的牌能增加 w=對手中小於 v 的張數個勝局，及 l=對手中大於 v 的張數個敗局；相同牌值的實體卡片要各自計入。",
      "當 W+L>0，勝率不降低可消去分母，寫成 w×L≥W×l；而勝率嚴格超過敗率則要 W+w>L+l。依自己既有牌值升序檢查，以二分搜尋求 w、l，第一個同時符合者就是答案。原題允許空牌組與全部平手，但這時抽牌或條件機率未定義；本程式將沒有可定義勝率的情況輸出 −1 作為明示的防護約定，不能視為官方已決定的邊界答案。",
    ],
    complexity:
      "X、Y≤10⁵，時間 O(Y log Y+X log X+X log(Y+1))，空間 O(X+Y)。W、L≤10¹⁰，交叉乘積≤10¹⁵，64 位元足夠。",
    pitfall:
      "勝率條件是『不降低』，使用 ≥；新勝局要嚴格大於新敗局，使用 >。空牌組、全平手仍屬原題待釐清情況。",
    traceLabel: "公開範例 1：自己 1,1,5；對手 1,2,4",
    trace: [
      {
        title: "原始配對",
        description: "兩張 1 各有兩敗，5 有三勝，故 W=3、L=4。",
        cells: ["1:0勝2敗", "1:0勝2敗", "5:3勝0敗"],
        active: [0, 1, 2],
        variables: [["原勝率", "3/7"]],
      },
      {
        title: "測試加入 1",
        description: "新增 0 勝 2 敗，勝率變 3/9，且 3 不大於 6。",
        cells: ["新W=3", "新L=6"],
        active: [0, 1],
        variables: [
          ["交叉比較", "0×4 < 3×2"],
          ["可行", "否"],
        ],
      },
      {
        title: "測試加入 5",
        description: "新增 3 勝 0 敗，勝率 6/10≥3/7，且 6>4。",
        cells: ["新W=6", "新L=4", "答案5"],
        active: [2],
        variables: [
          ["交叉比較", "3×4≥3×0"],
          ["最小可行值", "5"],
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
    int x, y;
    cin >> x >> y;
    vector<long long> a(x), b(y);
    for (auto &v : a)
        cin >> v;
    for (auto &v : b)
        cin >> v;
    if (!x || !y) {
        cout << -1 << '\n';
        return 0;
    }
    sort(a.begin(), a.end());
    sort(b.begin(), b.end());
    long long wins = 0, losses = 0;
    for (auto v : a) {
        wins += lower_bound(b.begin(), b.end(), v) - b.begin();
        losses += b.end() - upper_bound(b.begin(), b.end(), v);
    }
    if (wins + losses == 0) {
        cout << -1 << '\n';
        return 0;
    }
    a.erase(unique(a.begin(), a.end()), a.end());
    for (auto v : a) {
        long long w = lower_bound(b.begin(), b.end(), v) - b.begin();
        long long l = b.end() - upper_bound(b.begin(), b.end(), v);
        if (w * losses >= wins * l && wins + w > losses + l) {
            cout << v << '\n';
            return 0;
        }
    }
    cout << -1 << '\n';
}`,
    python: String.raw`import sys
from bisect import bisect_left, bisect_right

it = iter(map(int, sys.stdin.buffer.read().split()))
x, y = next(it), next(it)
a = [next(it) for _ in range(x)]
b = sorted(next(it) for _ in range(y))
wins = sum(bisect_left(b, v) for v in a)
losses = sum(y - bisect_right(b, v) for v in a)
answer = -1
if x and y and wins + losses:
    for v in sorted(set(a)):
        w = bisect_left(b, v)
        l = y - bisect_right(b, v)
        if w * losses >= wins * l and wins + w > losses + l:
            answer = v
            break
print(answer)
`,
  }),
  defineToiPotentialLesson("a327", {
    topic: "greedy",
    level: "hard",
    concept: "射程單調擴張・免費寶物優先與最大增幅堆",
    goal: "在可達寶物中先處理不消耗淨發射數者，再選最大射程增幅。",
    explanation: [
      "寶物依距離平方排序，當射程擴張就把新可達者放入優先佇列。bi=1 的寶物命中後補回一次發射，淨消耗為 0，而且 ci≥0；只要還有一次發射機會，先取這種寶物永遠不會讓後續選擇變差，甚至能開放更多目標。因此堆先按 b 降序，再按 c 降序選擇。",
      "當沒有可達的免費寶物時，每個可選者都消耗一次機會，選 ci 最大者。交換論證：若某最佳策略先選較小增幅，改先選最大者，第一次射程至少一樣大，其餘尚未選的寶物仍可按原序取得；如果原策略之後才選最大者，就交換兩者，直到第二次選取後總射程相同，中途只會更大。每次射擊後重新加入可達目標，不能只把初始可達者排序一次。",
    ],
    complexity:
      "N≤2×10⁵，時間 O(N log N)，空間 O(N)。距離平方≤2×10¹⁸；最終射程≤9×10⁸，平方亦在 64 位元內，不用浮點開根號。",
    pitfall:
      "bi=1 優先於大 ci 的付費目標，否則最後一次發射可能提前耗盡。得分是最終射程；官方投影片已將原 PDF 範例 4 更正為 5。",
    traceLabel: "公開範例 1：R=1、D=1",
    trace: [
      {
        title: "初始可達兩件",
        description: "(0,−1) 與 (1,0) 距離皆為 1；前者 b=1，優先取。",
        cells: ["c1,b1", "c5,b0", "距離√13未達"],
        active: [0],
        variables: [
          ["R", "1"],
          ["D", "1"],
        ],
      },
      {
        title: "取得免費目標",
        description: "射程加 1，扣一次再補一次，仍有 1 次。",
        cells: ["已取c1", "c5,b0", "未達"],
        active: [1],
        variables: [
          ["R", "1"],
          ["D", "2"],
        ],
      },
      {
        title: "取得 c=5",
        description: "射程到 7，但次數為 0，不能再命中第三件。",
        cells: ["已取", "已取", "可達但無次數"],
        active: [2],
        variables: [
          ["R", "0"],
          ["最終得分", "7"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <array>
#include <algorithm>
#include <queue>
#include <utility>
using namespace std;
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, r;
    long long d;
    cin >> n >> r >> d;
    vector<array<long long, 3>> items(n);
    for (auto &v : items) {
        long long x, y, c, b;
        cin >> x >> y >> c >> b;
        v = {x * x + y * y, b, c};
    }
    sort(items.begin(), items.end());
    priority_queue<pair<int, int>> heap;
    int next = 0;
    while (r > 0) {
        while (next < n && items[next][0] <= d * d) {
            heap.push({(int)items[next][1], (int)items[next][2]});
            ++next;
        }
        if (heap.empty())
            break;
        auto [b, c] = heap.top();
        heap.pop();
        d += c;
        r += b - 1;
    }
    cout << d << '\n';
}`,
    python: String.raw`import sys
import heapq

read = sys.stdin.buffer.readline
n, remaining, distance = map(int, read().split())
items = []
for _ in range(n):
    x, y, c, b = map(int, read().split())
    items.append((x * x + y * y, b, c))
items.sort()
heap = []
next_item = 0
while remaining > 0:
    while next_item < n and items[next_item][0] <= distance * distance:
        _, b, c = items[next_item]
        heapq.heappush(heap, (-b, -c))
        next_item += 1
    if not heap:
        break
    neg_b, neg_c = heapq.heappop(heap)
    distance -= neg_c
    remaining += -neg_b - 1
print(distance)
`,
  }),
  defineToiPotentialLesson("a328", {
    topic: "data-structures",
    level: "hard",
    concept: "線段樹・歸零攤銷與有限次轉換",
    goal: "支援區間總和、區間去末位及單點賦值，利用每個數字最多十次就歸零。",
    explanation: [
      "線段樹每個節點保存區間和，以及是否至少有一個非零元素。區間查詢直接取覆蓋節點的和；單點賦值更新葉子再往上合併。區間去末位必須深入葉子更新，但遇到整個區間都是 0 就停止，不能只用區間和是否為 0 判斷，因為正負數可能互相抵銷。",
      "任意 32 位元有號整數經過最多十次向零截斷除以 10 就會變 0。每個初值及每次賦值最多提供十次有效葉子修改，故所有區間去末位的總成本可以攤銷。Python 的 // 對負數向下取整，因此用 −((-x)//10) 處理負數，與 C++ 的有號整數除法一致；查詢輸出當次區間和，不是累計分數。",
      "Python 版進一步用空間換時間：每個節點預存未來再除 0..10 次的十一種區間和。整段除一次就是把這些和向前移一格，最後補 0，並累計懶標記；要深入子區間時才把除法次數傳給兩個孩子。單點賦值先下推沿途標記，再重新建立該葉子的十一種未來值。這使大範圍更新不用逐一拜訪葉子，且不會受正負抵銷影響。",
    ],
    complexity:
      "N、M≤5×10⁵。C++ 建樹 O(N)，攤銷總時間 O(10(N+M)log N)、空間 O(N)；Python 預存十一種和，時間 O(10N+10Mlog N)、空間 O(10N+M)，含暫存輸出。區間和絕對值≤約 1.1×10¹⁵，使用 64 位元；遞迴深度僅 O(log N)。",
    pitfall:
      "−19 去末位是 −1，不是 −2；[5,−5] 的總和雖為 0，仍有非零元素，不能略過更新。",
    traceLabel: "公開範例：查詢、去末位、賦值",
    trace: [
      {
        title: "第一次區間和",
        description: "第 3..5 個數為 102、888、99，合計 1089。",
        cells: ["32", "41", "102", "888", "99", "65"],
        active: [2, 3, 4],
        variables: [["輸出", "1089"]],
      },
      {
        title: "去掉第 2..4 個末位",
        description: "41→4、102→10、888→88。",
        cells: ["32", "4", "10", "88", "99", "65"],
        active: [1, 2, 3],
        variables: [["整列總和", "298"]],
      },
      {
        title: "第 4 個改為 1024",
        description: "總和增加 936，最後查詢整列得到 1234。",
        cells: ["32", "4", "10", "1024", "99", "65"],
        active: [3],
        variables: [["輸出", "1234"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
using namespace std;
struct Tree {
    int size;
    vector<long long> sum;
    vector<unsigned char> active;
    explicit Tree(int n) : size(1) {
        while (size < n)
            size *= 2;
        sum.resize(size * 2);
        active.resize(size * 2);
    }
    void pull(int p) {
        sum[p] = sum[p * 2] + sum[p * 2 + 1];
        active[p] = active[p * 2] || active[p * 2 + 1];
    }
    void set(int i, long long value) {
        int p = size + i;
        sum[p] = value;
        active[p] = value != 0;
        while ((p /= 2) > 0)
            pull(p);
    }
    long long query(int l, int r) {
        long long answer = 0;
        for (l += size, r += size; l < r; l /= 2, r /= 2) {
            if (l & 1)
                answer += sum[l++];
            if (r & 1)
                answer += sum[--r];
        }
        return answer;
    }
    void divide(int p, int left, int right, int l, int r) {
        if (!active[p] || right <= l || r <= left)
            return;
        if (right - left == 1) {
            sum[p] /= 10;
            active[p] = sum[p] != 0;
            return;
        }
        int mid = (left + right) / 2;
        divide(p * 2, left, mid, l, r);
        divide(p * 2 + 1, mid, right, l, r);
        pull(p);
    }
};
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, m;
    cin >> n >> m;
    Tree tree(n);
    for (int i = 0; i < n; ++i) {
        cin >> tree.sum[tree.size + i];
        tree.active[tree.size + i] = tree.sum[tree.size + i] != 0;
    }
    for (int p = tree.size - 1; p; --p)
        tree.pull(p);
    while (m--) {
        int t, a;
        long long b;
        cin >> t >> a >> b;
        if (t == 1)
            cout << tree.query(a - 1, (int)b) << '\n';
        else if (t == 2)
            tree.divide(1, 0, tree.size, a - 1, (int)b);
        else
            tree.set(a - 1, b);
    }
}`,
    python: String.raw`import sys
from array import array


def main():
    read = sys.stdin.buffer.readline
    n, m = map(int, read().split())
    size = 1
    while size < n:
        size *= 2
    future = [array('q', [0]) * (2 * size) for _ in range(11)]
    lazy = bytearray(2 * size)
    for i, x in enumerate(map(int, read().split())):
        for depth in range(10):
            future[depth][size + i] = x
            x = x // 10 if x >= 0 else -((-x) // 10)
    for sums in future:
        for p in range(size - 1, 0, -1):
            sums[p] = sums[2 * p] + sums[2 * p + 1]

    def apply(p, count):
        count = min(count, 10)
        for depth in range(11 - count):
            future[depth][p] = future[depth + count][p]
        for depth in range(11 - count, 11):
            future[depth][p] = 0
        lazy[p] = min(10, lazy[p] + count)

    def push(p):
        if lazy[p]:
            apply(2 * p, lazy[p])
            apply(2 * p + 1, lazy[p])
            lazy[p] = 0

    def pull(p):
        for sums in future:
            sums[p] = sums[2 * p] + sums[2 * p + 1]

    def divide(p, left, right, l, r):
        if l <= left and right <= r:
            apply(p, 1)
            return
        push(p)
        mid = (left + right) // 2
        if l < mid:
            divide(2 * p, left, mid, l, r)
        if r > mid:
            divide(2 * p + 1, mid, right, l, r)
        pull(p)

    def query(p, left, right, l, r):
        if l <= left and right <= r:
            return future[0][p]
        push(p)
        mid = (left + right) // 2
        total = 0
        if l < mid:
            total += query(2 * p, left, mid, l, r)
        if r > mid:
            total += query(2 * p + 1, mid, right, l, r)
        return total

    def assign(p, left, right, i, x):
        if right - left == 1:
            for sums in future:
                sums[p] = x
                x = x // 10 if x >= 0 else -((-x) // 10)
            lazy[p] = 0
            return
        push(p)
        mid = (left + right) // 2
        if i < mid:
            assign(2 * p, left, mid, i, x)
        else:
            assign(2 * p + 1, mid, right, i, x)
        pull(p)

    output = []
    for _ in range(m):
        kind, a, b = map(int, read().split())
        if kind == 3:
            assign(1, 0, size, a - 1, b)
        else:
            # Padding leaves remain zero; extending the right boundary is safe.
            end = size if b == n else b
            if kind == 1:
                output.append(str(query(1, 0, size, a - 1, end)))
            else:
                divide(1, 0, size, a - 1, end)
    if output:
        sys.stdout.write('\n'.join(output) + '\n')


main()
`,
  }),
  defineToiPotentialLesson("a329", {
    topic: "simulation",
    level: "hard",
    concept: "碰撞交換身分・第 M 個離開時間",
    goal: "把相撞掉頭視為穿越，直接求停止時間及仍被占用的字元位置。",
    explanation: [
      "兩隻等速螞蟻相撞後交換方向，若忽略身分，等價於兩者直接穿越。題目只問哪些字元位置有螞蟻，不問身分，因此可以讓每隻沿初始方向直走。向左離開時間為 p，向右為 K+1−p；第 M 小的離開時間就是停止時刻，同時抵達邊界者全部算離開。",
      "時間都是 1..K 的整數，可用計數陣列找第 M 小，不必排序。到停止時間 t 時，計算每隻幽靈螞蟻的位置 p±t，僅保留 1..K。把位置記在布林陣列，最後由左至右讀出紙帶字元；同一位置可能有兩隻正在相撞，但該字元只列一次，這也符合範例 4 的 Me，而不是 MMe。",
    ],
    complexity:
      "K≤2×10⁶、N≤K，時間 O(K+N)，空間 O(K+N)。C++ 計數與 Python array('I') 儲存各時間的離開數。",
    pitfall:
      "邊界在 0 與 K+1，抵達邊界當下已離開；停止時可能同時有超過 M 隻離開，不能硬保留 N−M 個位置。",
    traceLabel: "公開範例 4：K=16，螞蟻 16R、5R、7L、13L",
    trace: [
      {
        title: "離開時間",
        description: "忽略碰撞後，四隻分別在 1、12、7、13 時離開。",
        cells: ["16R:t1", "5R:t12", "7L:t7", "13L:t13"],
        active: [0],
        variables: [
          ["M", "1"],
          ["停止t", "1"],
        ],
      },
      {
        title: "移動一單位",
        description: "16R 到 17 離開，5R、7L 都在位置 6，13L 到位置 12。",
        cells: ["17離開", "6", "6", "12"],
        active: [1, 2, 3],
        variables: [["仍占用位置", "6,12"]],
      },
      {
        title: "讀出字元",
        description:
          "helloMachineClub 的第 6 字是 M，第 12 字是 e；重合位置只讀一次。",
        cells: ["6:M", "12:e"],
        active: [0, 1],
        variables: [["訊息", "Me"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <string>
#include <utility>
using namespace std;
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int k, n, m;
    string text;
    cin >> k >> text >> n >> m;
    vector<pair<int, int>> ants(n);
    vector<int> exits(k + 1);
    for (auto &[p, d] : ants) {
        cin >> p >> d;
        ++exits[d ? k + 1 - p : p];
    }
    int time = 0, count = 0;
    while (count < m) {
        ++time;
        count += exits[time];
    }
    vector<unsigned char> occupied(k + 1);
    for (auto [p, d] : ants) {
        int q = p + (d ? time : -time);
        if (q >= 1 && q <= k)
            occupied[q] = 1;
    }
    for (int p = 1; p <= k; ++p)
        if (occupied[p])
            cout << text[p - 1];
    cout << '\n';
}`,
    python: String.raw`import sys
from array import array

read = sys.stdin.buffer.readline
k_token, text = read().split()
k = int(k_token)
n, m = map(int, read().split())
positions = array('I')
directions = bytearray()
exits = array('I', [0]) * (k + 1)
for _ in range(n):
    p, d = map(int, read().split())
    positions.append(p)
    directions.append(d)
    exits[k + 1 - p if d else p] += 1
time = count = 0
while count < m:
    time += 1
    count += exits[time]
occupied = bytearray(k + 1)
for p, d in zip(positions, directions):
    q = p + (time if d else -time)
    if 1 <= q <= k:
        occupied[q] = 1
answer = bytearray(text[p - 1] for p in range(1, k + 1) if occupied[p])
sys.stdout.buffer.write(answer + b'\n')
`,
  }),
  defineToiPotentialLesson("a330", {
    topic: "dp",
    level: "hard",
    concept: "正重量前綴和・雙指標維護 DP 視窗",
    goal: "線性時間計算每個前綴的合法分裝數，再取指定模數。",
    explanation: [
      "設 P[i] 為前 i 箱重量、dp[i] 為運完前 i 箱的方法數，dp[0]=1。若最後一趟載 j+1..i，合法條件為 L≤P[i]−P[j]≤U，所以 dp[i] 是 P[j] 落在 [P[i]−U,P[i]−L] 的所有 dp[j] 之和，且 j<i。",
      "因為每箱重量正，P 嚴格遞增；i 向右時，合法前綴索引形成的視窗兩端也只會向右。用 add 指標將新達到至少 L 重量的 j 加入 running，再用 remove 指標移除重量已超過 U 的 j。每個 dp 值各加入、移除至多一次，所有加減都對 10⁹+7 取模，running 就是本輪 dp[i]。空前綴代表第一趟的起點，但不允許空趟。",
    ],
    complexity:
      "N≤2×10⁵，時間 O(N)，空間 O(N)。前綴總重量≤2×10⁸，C++ 仍使用 long long 以清楚處理減法門檻。",
    pitfall:
      "合法包含 L、U 端點，加入使用 ≤P[i]−L、移除使用 <P[i]−U；不存在合法分法時必須輸出 0。",
    traceLabel: "公開範例 1：重量 3,5,4,3,4；L=4、U=8",
    trace: [
      {
        title: "前兩箱",
        description: "前綴和 0,3,8；單獨 3 不合格，3+5=8 可一趟。",
        cells: ["dp0=1", "dp1=0", "dp2=1"],
        active: [2],
        variables: [["P[2]", "8"]],
      },
      {
        title: "前三、四箱",
        description:
          "第三箱 4 可接在前兩箱後；第四箱只能與第三箱合為 7，仍是一種。",
        cells: ["dp2=1", "dp3=1", "dp4=1"],
        active: [1, 2],
        variables: [
          ["P[3]", "12"],
          ["P[4]", "15"],
        ],
      },
      {
        title: "第五箱",
        description: "最後一趟可為 [5] 重 4 或 [4,5] 重 7，分別接 dp4、dp3。",
        cells: ["[3,5]|[4,3]|[4]", "[3,5]|[4]|[3,4]"],
        active: [0, 1],
        variables: [["dp[5]", "dp4+dp3=2"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
using namespace std;
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    long long low, high;
    cin >> n >> low >> high;
    const long long mod = 1000000007;
    vector<long long> prefix(n + 1), dp(n + 1);
    dp[0] = 1;
    int add = 0, remove = 0;
    long long running = 0;
    for (int i = 1; i <= n; ++i) {
        long long w;
        cin >> w;
        prefix[i] = prefix[i - 1] + w;
        while (add < i && prefix[add] <= prefix[i] - low) {
            running = (running + dp[add]) % mod;
            ++add;
        }
        while (remove < add && prefix[remove] < prefix[i] - high) {
            running = (running - dp[remove] + mod) % mod;
            ++remove;
        }
        dp[i] = running;
    }
    cout << dp[n] << '\n';
}`,
    python: String.raw`import sys

it = iter(map(int, sys.stdin.buffer.read().split()))
n, low, high = next(it), next(it), next(it)
MOD = 10**9 + 7
prefix = [0] * (n + 1)
dp = [0] * (n + 1)
dp[0] = 1
add = remove = running = 0
for i in range(1, n + 1):
    prefix[i] = prefix[i - 1] + next(it)
    while add < i and prefix[add] <= prefix[i] - low:
        running = (running + dp[add]) % MOD
        add += 1
    while remove < add and prefix[remove] < prefix[i] - high:
        running = (running - dp[remove]) % MOD
        remove += 1
    dp[i] = running
print(dp[n])
`,
  }),
];
