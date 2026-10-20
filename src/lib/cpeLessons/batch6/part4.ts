import { defineCpeLesson } from "@/lib/cpeLessonBuilder";

export const lessons = [
  defineCpeLesson("a828", {
    topic: "trees",
    level: "medium",
    concept: "路徑鍵值、父節點完整性與層序排序",
    goal: "檢查重複指定與缺祖先，再輸出完整二元樹。",
    explanation: [
      "把每個路徑字串作為唯一鍵，值是節點內容。重複鍵即使數值相同也代表重複指定，必須保留失敗旗標。當遇到 () 時檢查根的空路徑存在，且每個非根路徑去掉最後一字元後的父路徑也存在。逐點的父節點檢查自然保證整條祖先鏈完整。",
      "完整時依『路徑長度、路徑字典序』排序：長度就是深度，而相同深度下 L<R 對應由左到右，所以這正是層序。否則只輸出 not complete。() 代表目前樹結束而不是整份輸入結束；印完後清空字典與重複旗標，繼續讀到 EOF。",
    ],
    complexity: "V 個節點、最長路徑 H；時間 O(VH+V log V×H)，空間 O(VH)。",
    pitfall:
      "不能只依路徑字典序排序，深層 LL 會排在淺層 R 前面；同值重複指定仍算不完整。",
    traceLabel: "示意：(4,L)、(8,R)、(5,) 依此順序輸入",
    trace: [
      {
        title: "讀 L",
        description: "記錄路徑 L 的值 4，根尚未出現，先不提早判錯。",
        cells: ["L:4"],
        active: [0],
        variables: [["節點數", "1"]],
      },
      {
        title: "讀 R",
        description: "加入右子節點 8。",
        cells: ["L:4", "R:8"],
        active: [1],
        variables: [["節點數", "2"]],
      },
      {
        title: "讀根並結算",
        description: "根值 5 補齊，所有父節點存在；按深度排序輸出 5 4 8。",
        cells: ["根:5", "L:4", "R:8"],
        active: [0, 1, 2],
        variables: [
          ["節點數", "3"],
          ["完整", "1"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <string>
#include <map>
#include <vector>
#include <algorithm>
using namespace std;
int main() {
    map<string, int> tree;
    bool duplicate = false;
    string token;
    while (cin >> token) {
        if (token != "()") {
            size_t comma = token.find(',');
            int value = stoi(token.substr(1, comma - 1));
            string path = token.substr(comma + 1, token.size() - comma - 2);
            if (tree.count(path))
                duplicate = true;
            tree[path] = value;
            continue;
        }
        bool ok = !duplicate && tree.count("");
        vector<string> paths;
        for (const auto &[path, value] : tree) {
            if (!path.empty() && !tree.count(path.substr(0, path.size() - 1)))
                ok = false;
            paths.push_back(path);
        }
        if (!ok)
            cout << "not complete\n";
        else {
            sort(paths.begin(), paths.end(), [](const string &a, const string &b) {
                return a.size() != b.size() ? a.size() < b.size() : a < b;
            });
            for (int i = 0; i < int(paths.size()); ++i)
                cout << (i ? " " : "") << tree[paths[i]];
            cout << '\n';
        }
        tree.clear();
        duplicate = false;
    }
}`,
    python: String.raw`import sys

tree, duplicate = {}, False
for token in sys.stdin.read().split():
    if token != '()':
        value, path = token[1:-1].split(',')
        duplicate |= path in tree
        tree[path] = int(value)
        continue
    ok = not duplicate and '' in tree and all(not p or p[:-1] in tree for p in tree)
    if ok:
        print(*(tree[p] for p in sorted(tree, key=lambda p: (len(p), p))))
    else:
        print('not complete')
    tree, duplicate = {}, False
`,
  }),
  defineCpeLesson("a829", {
    topic: "search",
    level: "easy",
    concept: "排序後的 lower_bound",
    goal: "回報查詢值的第一次出現位置。",
    explanation: [
      "先將 N 顆彈珠排序，重複值會相鄰。對每個查詢 x，找第一個大於或等於 x 的索引 p；若 p 未超出陣列且 a[p]=x，該處就是第一次出現位置，否則 x 不存在。",
      "二分搜尋維持左半部都小於 x、右半部包含可能的第一個不小於 x 的位置，收斂到 lower_bound。C++ 可使用標準函式，Python 使用 bisect_left；索引 p 轉成題目的一基底位置要加 1。每筆標頭為大寫 CASE# k:，0 0 結束，不同案例不加空白行。",
    ],
    complexity: "每筆時間 O(N log N+Q log N)，空間 O(N)。",
    pitfall:
      "一般找到任意相等值的二分搜尋不保證第一顆；存取 a[p] 前先檢查 p<N。",
    traceLabel: "示意：彈珠 3,1,3,2，查詢 3",
    trace: [
      {
        title: "排序",
        description: "排序為 1、2、3、3。",
        cells: ["1", "2", "3", "3"],
        active: [0, 1, 2, 3],
        variables: [["N", "4"]],
      },
      {
        title: "第一次切半",
        description: "半開區間 [0,4)，mid=2 的值 3 不小於目標，右界改成 2。",
        cells: ["1", "2", "3", "3"],
        active: [2],
        variables: [
          ["lo", "0"],
          ["hi", "2"],
        ],
      },
      {
        title: "找到下界",
        description: "mid=1 的值 2 太小，lo 變 2；第一個 3 的一基底位置是 3。",
        cells: ["1", "2", "3", "3"],
        active: [2],
        variables: [
          ["p", "2"],
          ["輸出位置", "3"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;
int main() {
    int n, q, tc = 0;
    while (cin >> n >> q && (n || q)) {
        vector<int> a(n);
        for (int &x : a)
            cin >> x;
        sort(a.begin(), a.end());
        cout << "CASE# " << ++tc << ":\n";
        while (q--) {
            int x;
            cin >> x;
            auto p = lower_bound(a.begin(), a.end(), x);
            cout << x;
            if (p != a.end() && *p == x)
                cout << " found at " << p - a.begin() + 1 << '\n';
            else
                cout << " not found\n";
        }
    }
}`,
    python: String.raw`import sys
from bisect import bisect_left

it = iter(map(int, sys.stdin.buffer.read().split()))
tc = 0
for n in it:
    q = next(it)
    if n == q == 0:
        break
    a = sorted(next(it) for _ in range(n))
    tc += 1
    print(f'CASE# {tc}:')
    for _ in range(q):
        x = next(it)
        p = bisect_left(a, x)
        print(f'{x} found at {p + 1}' if p < n and a[p] == x else f'{x} not found')
`,
  }),
  defineCpeLesson("a830", {
    topic: "strings",
    level: "easy",
    concept: "逐行擷取首欄與有序計數",
    goal: "忽略姓名，只統計每國記錄數。",
    explanation: [
      "每筆紀錄的第一個單字是國家，後面整段都是姓名，且姓名可能包含多個空白分隔的部分。因此必須按行讀取，每行只擷取第一個詞，不能把整份輸入當成兩個詞一組。",
      "以國家名稱作為計數表的鍵，每行將該國次數加 1。C++ 的 map 本身按鍵排序，Python 需要在最後 sorted 鍵；逐國輸出國名與總數。這裡統計的是記錄數，不需對姓名去重。讀完第一行指定的 n 行便完成，讀數字後記得消耗行末換行。",
    ],
    complexity:
      "L 為總字元數、C 為國家數；時間 O(L+n log C)，空間 O(C) 筆國家資料。",
    pitfall: "姓名不是固定兩字；國家大小寫依原字串排序，不任意改寫。",
    traceLabel: "示意：Spain Ana、England Mary Jane、Spain Eva",
    trace: [
      {
        title: "第一行",
        description: "擷取 Spain，計數成為 1。",
        cells: ["Spain:1"],
        active: [0],
        variables: [["記錄數", "1"]],
      },
      {
        title: "第二行",
        description: "只擷取 England，Mary Jane 都屬姓名。",
        cells: ["England:1", "Spain:1"],
        active: [0],
        variables: [["記錄數", "2"]],
      },
      {
        title: "第三行與排序",
        description: "Spain 增為 2，字母序輸出 England 再 Spain。",
        cells: ["England 1", "Spain 2"],
        active: [1],
        variables: [["總記錄數", "3"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <map>
#include <string>
#include <sstream>
using namespace std;
int main() {
    int n;
    cin >> n;
    string line, country;
    getline(cin, line);
    map<string, int> count;
    for (int i = 0; i < n; ++i) {
        getline(cin, line);
        istringstream row(line);
        row >> country;
        ++count[country];
    }
    for (const auto &[name, total] : count)
        cout << name << ' ' << total << '\n';
}`,
    python: String.raw`import sys
from collections import Counter

n = int(sys.stdin.readline())
count = Counter()
for _ in range(n):
    country = sys.stdin.readline().split()[0]
    count[country] += 1
for country in sorted(count):
    print(country, count[country])
`,
  }),
  defineCpeLesson("a831", {
    topic: "sorting",
    level: "medium",
    concept: "逆序對與合併排序計數",
    goal: "由跨半部逆序數求最少相鄰交換次數。",
    explanation: [
      "逆序對是 i<j 且 a[i]>a[j] 的一對位置。一次相鄰交換最多消除一個逆序對，所以排序至少需要原本的逆序對數；氣泡排序每次交換相鄰逆序，恰好用此數量完成，因此這就是最少交換次數。",
      "合併排序遞迴算左右半部，再合併兩個已排序區間。若右側值嚴格小於左側目前值，左側剩餘的所有元素都與它形成逆序對，一次加上剩餘個數。相等時先取左側，不計逆序。讀至 EOF，每筆以指定的 Minimum exchange operations : M 格式輸出。",
    ],
    complexity: "每筆時間 O(N log N)，空間 O(N)。",
    pitfall: "相等元素不算逆序；右側較小時增加的是左側全部剩餘數，不只 1。",
    traceLabel: "示意：2,3,1",
    trace: [
      {
        title: "左右遞迴",
        description: "分成 [2] 與 [3,1]；右半有逆序 (3,1) 一對。",
        cells: ["2", "1,3"],
        active: [1],
        variables: [["目前逆序數", "1"]],
      },
      {
        title: "跨半部合併",
        description: "右側 1 小於左側 2，增加一對 (2,1)。",
        cells: ["1", "2", "3"],
        active: [0],
        variables: [
          ["新增", "1"],
          ["總數", "2"],
        ],
      },
      {
        title: "對照相鄰交換",
        description: "2,3,1→2,1,3→1,2,3，正好交換 2 次。",
        cells: ["2,3,1", "2,1,3", "1,2,3"],
        active: [2],
        variables: [["最少交換", "2"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
using namespace std;
long long sortCount(vector<int> &a, vector<int> &tmp, int l, int r) {
    if (r - l <= 1)
        return 0;
    int m = (l + r) / 2;
    long long ans = sortCount(a, tmp, l, m) + sortCount(a, tmp, m, r);
    int i = l, j = m, k = l;
    while (i < m && j < r) {
        if (a[i] <= a[j])
            tmp[k++] = a[i++];
        else {
            tmp[k++] = a[j++];
            ans += m - i;
        }
    }
    while (i < m)
        tmp[k++] = a[i++];
    while (j < r)
        tmp[k++] = a[j++];
    for (int p = l; p < r; ++p)
        a[p] = tmp[p];
    return ans;
}
int main() {
    int n;
    while (cin >> n) {
        vector<int> a(n), tmp(n);
        for (int &x : a)
            cin >> x;
        cout << "Minimum exchange operations : " << sortCount(a, tmp, 0, n) << '\n';
    }
}`,
    python: String.raw`import sys


def sort_count(a):
    if len(a) <= 1:
        return a, 0
    mid = len(a) // 2
    left, x = sort_count(a[:mid])
    right, y = sort_count(a[mid:])
    i = j = 0
    merged, count = [], x + y
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            merged.append(left[i])
            i += 1
        else:
            merged.append(right[j])
            j += 1
            count += len(left) - i
    merged.extend(left[i:])
    merged.extend(right[j:])
    return merged, count


it = iter(map(int, sys.stdin.buffer.read().split()))
for n in it:
    a = [next(it) for _ in range(n)]
    print(f'Minimum exchange operations : {sort_count(a)[1]}')
`,
  }),
  defineCpeLesson("a832", {
    topic: "number-theory",
    level: "easy",
    concept: "二進位解析與共同因數",
    goal: "把反覆減法條件化為 gcd 大於 1。",
    explanation: [
      "若 S 能反覆減去 L 最後得到 L，就表示 S 是 L 的正整數倍；S=L 也符合。因此兩個輸入能完全由同一個 L 組成，等價於它們有共同因數 L。合法 L 至少兩個二進位位元，代表 L≥2。",
      "所以只需把兩個二進位字串轉成整數，再求最大公因數 g；g>1 就能選 L=g，g=1 則不可能。Euclid 演算法反覆以 (a,b)←(b,a%b)，直到 b=0。字串最多 30 位，C++ 使用 long long 安全；輸出 Pair #p: 以及正確的驚嘆號句子。",
    ],
    complexity: "位數 B≤30，解析 O(B)，求 gcd O(log min(a,b))，額外空間 O(1)。",
    pitfall: "不是檢查字串重複片段；這裡的減法是二進位整數減法。",
    traceLabel: "示意：110 與 1010",
    trace: [
      {
        title: "解析進位",
        description: "110₂=6，1010₂=10。",
        cells: ["110→6", "1010→10"],
        active: [0, 1],
        variables: [
          ["a", "6"],
          ["b", "10"],
        ],
      },
      {
        title: "Euclid",
        description: "10%6=4，6%4=2。",
        cells: ["10,6", "6,4", "4,2"],
        active: [2],
        variables: [["餘數", "2"]],
      },
      {
        title: "找到共同 L",
        description: "4%2=0，gcd=2，可取 L=10₂。",
        cells: ["gcd=2", "L=10₂"],
        active: [0, 1],
        variables: [
          ["a/L", "3"],
          ["b/L", "5"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <string>
#include <numeric>
using namespace std;
int main() {
    int t;
    cin >> t;
    for (int tc = 1; tc <= t; ++tc) {
        string s, u;
        cin >> s >> u;
        long long a = 0, b = 0;
        for (char c : s)
            a = a * 2 + c - '0';
        for (char c : u)
            b = b * 2 + c - '0';
        cout << "Pair #" << tc << ": "
             << (gcd(a, b) > 1 ? "All you need is love!" : "Love is not all you need!") << '\n';
    }
}`,
    python: String.raw`import sys
import math

it = iter(sys.stdin.read().split())
for tc in range(1, int(next(it)) + 1):
    a, b = int(next(it), 2), int(next(it), 2)
    message = 'All you need is love!' if math.gcd(a, b) > 1 else 'Love is not all you need!'
    print(f'Pair #{tc}: {message}')
`,
  }),
  defineCpeLesson("a833", {
    topic: "trees",
    level: "medium",
    concept: "雙堆維護串流中位數",
    goal: "每加入一個數字就用堆頂讀出目前中位數。",
    explanation: [
      "用最大堆 low 保存較小半部、最小堆 high 保存較大半部，維持所有 low 元素不大於 high，且 low 的大小等於 high 或多 1。新值依 low 堆頂分到適當一側，再把過多的一側堆頂搬到另一邊，就能恢復兩個不變量。",
      "總數奇數時，low 多出的一個元素就是中位數；偶數時，中位數為兩個堆頂的平均整數部分。所有輸入非負，因此整數除以 2 就是所求。兩個堆頂可能各接近 2³¹，C++ 加總必須使用 long long。讀至 EOF，每個輸入對應一行答案。",
    ],
    complexity: "N 個值總時間 O(N log N)，空間 O(N)，每次取得答案 O(1)。",
    pitfall: "Python 的最小堆需對 low 存負值；偶數平均前的加法不可用 32 位元。",
    traceLabel: "示意：依序 4、1、8",
    trace: [
      {
        title: "加入 4",
        description: "low=[4]，high 空，中位數 4。",
        cells: ["low:4", "high:空"],
        active: [0],
        variables: [
          ["n", "1"],
          ["median", "4"],
        ],
      },
      {
        title: "加入 1",
        description: "插入 low 後，把最大值 4 搬到 high；平均 (1+4)//2=2。",
        cells: ["low:1", "high:4"],
        active: [0, 1],
        variables: [
          ["n", "2"],
          ["median", "2"],
        ],
      },
      {
        title: "加入 8",
        description: "放入 high 後，把最小值 4 搬回 low，中位數 4。",
        cells: ["low:1,4", "high:8"],
        active: [0],
        variables: [
          ["n", "3"],
          ["median", "4"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <queue>
#include <vector>
#include <functional>
using namespace std;
int main() {
    priority_queue<long long> low;
    priority_queue<long long, vector<long long>, greater<long long>> high;
    long long x;
    while (cin >> x) {
        if (low.empty() || x <= low.top())
            low.push(x);
        else
            high.push(x);
        if (low.size() > high.size() + 1) {
            high.push(low.top());
            low.pop();
        }
        if (high.size() > low.size()) {
            low.push(high.top());
            high.pop();
        }
        cout << (low.size() == high.size() ? (low.top() + high.top()) / 2 : low.top()) << '\n';
    }
}`,
    python: String.raw`import sys
import heapq

low, high = [], []
for x in map(int, sys.stdin.buffer.read().split()):
    if not low or x <= -low[0]:
        heapq.heappush(low, -x)
    else:
        heapq.heappush(high, x)
    if len(low) > len(high) + 1:
        heapq.heappush(high, -heapq.heappop(low))
    if len(high) > len(low):
        heapq.heappush(low, -heapq.heappop(high))
    print((-low[0] + high[0]) // 2 if len(low) == len(high) else -low[0])
`,
  }),
  defineCpeLesson("a834", {
    topic: "simulation",
    level: "easy",
    concept: "逐位相加的進位狀態",
    goal: "計算每一個產生進位的位置，包含連續進位。",
    explanation: [
      "從個位開始，每輪取 a%10、b%10 加上上一位 carry。若總和≥10，這一位產生一次進位，令 carry=1 並增加計數；否則 carry=0。再把兩數各除以 10，前往下一位。",
      "當其中一個數用完時，它的高位視為 0，另一數仍繼續處理。兩數都用完後，最後產生的 carry 只形成答案的新最高位，不再算另一次進位。0 0 是停止標記；依計數為 0、1 或多個，分別輸出 No carry operation.、單數或複數句型。",
    ],
    complexity: "每筆時間 O(d)，d 為最大十進位位數，空間 O(1)。",
    pitfall: "每位都要加入前一位的 carry，像 999+1 會連續進位三次。",
    traceLabel: "示意：99+1",
    trace: [
      {
        title: "個位",
        description: "9+1+0=10，產生第一個進位。",
        cells: ["9", "1", "10"],
        active: [2],
        variables: [
          ["carry", "1"],
          ["count", "1"],
        ],
      },
      {
        title: "十位",
        description: "9+0+1=10，又產生一次進位。",
        cells: ["9", "0", "10"],
        active: [2],
        variables: [
          ["carry", "1"],
          ["count", "2"],
        ],
      },
      {
        title: "停止",
        description: "兩個運算元已用完，結果最高位 1 不再額外計數。",
        cells: ["結果100", "2 carry operations."],
        active: [1],
        variables: [["count", "2"]],
      },
    ],
    cpp: String.raw`#include <iostream>
using namespace std;
int main() {
    long long a, b;
    while (cin >> a >> b && (a || b)) {
        int carry = 0, count = 0;
        while (a || b) {
            carry = (a % 10 + b % 10 + carry) / 10;
            count += carry;
            a /= 10;
            b /= 10;
        }
        if (!count)
            cout << "No carry operation.\n";
        else
            cout << count << (count == 1 ? " carry operation.\n" : " carry operations.\n");
    }
}`,
    python: String.raw`import sys

it = iter(map(int, sys.stdin.buffer.read().split()))
for a in it:
    b = next(it)
    if a == b == 0:
        break
    carry = count = 0
    while a or b:
        carry = (a % 10 + b % 10 + carry) // 10
        count += carry
        a //= 10
        b //= 10
    if count == 0:
        print('No carry operation.')
    else:
        print(f"{count} carry operation{'s' if count != 1 else ''}.")
`,
  }),
  defineCpeLesson("a835", {
    topic: "trees",
    level: "medium",
    concept: "Fenwick 前綴和統計先前不大於者",
    goal: "依時間更新銷量頻率，計算有順序的合格日期對。",
    explanation: [
      "依輸入時間順序掃描銷量 x，先查詢之前有多少銷量≤x，再把 x 的出現次數加 1。查詢一定先於更新，這樣不會把今天自己計進去；而使用 ≤ 而非 <，會正確包含先前同銷量的日子。",
      "銷量介於 1 到 5000，可用 Fenwick tree 儲存頻率。prefix(x) 透過 x-=x&−x 把不重疊區段加起來，update(x) 透過 x+=x&−x 更新涵蓋 x 的區段，每次 O(log 5000)。每對 j<i 只會在處理第 i 天時出現一次，累加查詢值就是所求，案例間重新清空樹。",
    ],
    complexity: "每筆時間 O(n log U+U)，空間 O(U)，U=5000。",
    pitfall: "先更新再查詢會每一天多算自己；查詢 x−1 會漏掉相等銷量。",
    traceLabel: "示意：銷量 2、1、2",
    trace: [
      {
        title: "第一天 2",
        description: "先前沒有資料，prefix(2)=0，再加入 2。",
        cells: ["1:0", "2:1"],
        active: [1],
        variables: [
          ["新增配對", "0"],
          ["總數", "0"],
        ],
      },
      {
        title: "第二天 1",
        description: "先前的 2 不符合≤1，所以新增 0，再加入 1。",
        cells: ["1:1", "2:1"],
        active: [0],
        variables: [["總數", "0"]],
      },
      {
        title: "第三天 2",
        description: "先前 2 與 1 都≤2，新增 2 對，總數 2。",
        cells: ["1:1", "2:2"],
        active: [1],
        variables: [
          ["新增配對", "2"],
          ["總數", "2"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
using namespace std;
int main() {
    int t;
    cin >> t;
    while (t--) {
        int n;
        cin >> n;
        vector<int> bit(5001);
        long long ans = 0;
        while (n--) {
            int x;
            cin >> x;
            for (int p = x; p > 0; p -= p & -p)
                ans += bit[p];
            for (int p = x; p <= 5000; p += p & -p)
                ++bit[p];
        }
        cout << ans << '\n';
    }
}`,
    python: String.raw`import sys

it = iter(map(int, sys.stdin.buffer.read().split()))
for _ in range(next(it)):
    n = next(it)
    bit, answer = [0] * 5001, 0
    for _ in range(n):
        x = next(it)
        p = x
        while p:
            answer += bit[p]
            p -= p & -p
        p = x
        while p <= 5000:
            bit[p] += 1
            p += p & -p
    print(answer)
`,
  }),
  defineCpeLesson("a836", {
    topic: "basics",
    level: "easy",
    concept: "交集大小決定集合關係",
    goal: "按相等、真包含、互斥與交疊分類。",
    explanation: [
      "令 c=|A∩B|。若 c 同時等於 |A|、|B|，兩集合相等；若只等於 |A|，A 是 B 的真子集；若只等於 |B|，則 B 是 A 的真子集。這些檢查應放在 c=0 的互斥判斷之前，才能正確處理空集合。",
      "剩下若 c=0 就互不相交，否則有交集卻互不包含，輸出 I'm confused!。輸入每兩行構成一筆，行界線本身有意義，不能把全檔 split 後失去兩個集合的分界。用 set 表示集合並計算交集，不需比對原始排列順序。",
    ],
    complexity:
      "C++ 有序集合 O((|A|+|B|) log(|A|+|B|))，Python 雜湊平均 O(|A|+|B|)，空間 O(|A|+|B|)。",
    pitfall: "集合順序不影響關係；相等不能誤列為真子集。",
    traceLabel: "示意：A={1,2}，B={2,3}",
    trace: [
      {
        title: "讀集合",
        description: "兩集合各有兩個不同元素。",
        cells: ["A:1,2", "B:2,3"],
        active: [0, 1],
        variables: [
          ["|A|", "2"],
          ["|B|", "2"],
        ],
      },
      {
        title: "求交集",
        description: "共同元素只有 2，交集大小為 1。",
        cells: ["A∩B:2"],
        active: [0],
        variables: [["c", "1"]],
      },
      {
        title: "比較大小",
        description: "1 不等於任一集合大小且不為 0，故是 I'm confused!。",
        cells: ["1<2", "1>0"],
        active: [0, 1],
        variables: [
          ["真子集數", "0"],
          ["交集大小", "1"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <string>
#include <sstream>
#include <set>
using namespace std;
set<int> parse(const string &s) {
    istringstream in(s);
    set<int> result;
    int x;
    while (in >> x)
        result.insert(x);
    return result;
}
int main() {
    string first, second;
    while (getline(cin, first) && getline(cin, second)) {
        auto a = parse(first), b = parse(second);
        size_t common = 0;
        for (int x : a)
            common += b.count(x);
        if (common == a.size() && common == b.size())
            cout << "A equals B\n";
        else if (common == a.size())
            cout << "A is a proper subset of B\n";
        else if (common == b.size())
            cout << "B is a proper subset of A\n";
        else if (!common)
            cout << "A and B are disjoint\n";
        else
            cout << "I'm confused!\n";
    }
}`,
    python: String.raw`import sys

lines = iter(sys.stdin.read().splitlines())
for first in lines:
    second = next(lines)
    a, b = set(map(int, first.split())), set(map(int, second.split()))
    if a == b:
        print('A equals B')
    elif a < b:
        print('A is a proper subset of B')
    elif b < a:
        print('B is a proper subset of A')
    elif a.isdisjoint(b):
        print('A and B are disjoint')
    else:
        print("I'm confused!")
`,
  }),
  defineCpeLesson("a837", {
    topic: "simulation",
    level: "easy",
    concept: "上升下降序列與跨案例分隔",
    goal: "精確產生波形並統一管理空白行。",
    explanation: [
      "一個振幅 A 的波形，其層號依序是 1,2,…,A,A−1,…,1。第 k 層輸出 k 個數字 k，因為 A≤9，所以每個層號都是單一字元。最高層 A 只能出現一次，下降迴圈應從 A−1 開始。",
      "每筆重複 F 個波形，而任意兩個相鄰波形之間都恰好空一行，包括跨測試資料邊界。用全域 first 旗標，在每個非首波形之前印空白行，就不會在最後多印一行。輸入中的空白行可用空白分詞略過。",
    ],
    complexity:
      "每個波形輸出 A² 個數字，時間 O(ΣFA²)；逐行輸出的額外空間 O(A)。",
    pitfall: "不要讓波峰 A 重複兩次；案例分隔與波形分隔是同一個空白行規則。",
    traceLabel: "示意：A=3，F=1",
    trace: [
      {
        title: "上升前兩層",
        description: "第 1 層印 1，第 2 層印 22。",
        cells: ["1", "22"],
        active: [0, 1],
        variables: [["已印列數", "2"]],
      },
      {
        title: "波峰",
        description: "第 3 層印 333，只印一次。",
        cells: ["1", "22", "333"],
        active: [2],
        variables: [["已印列數", "3"]],
      },
      {
        title: "下降",
        description: "再印 22、1，總共 5 列、9 個數字。",
        cells: ["1", "22", "333", "22", "1"],
        active: [3, 4],
        variables: [
          ["列數", "5"],
          ["數字數", "9"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <string>
using namespace std;
int main() {
    int t;
    cin >> t;
    bool first = true;
    while (t--) {
        int a, f;
        cin >> a >> f;
        while (f--) {
            if (!first)
                cout << '\n';
            first = false;
            for (int k = 1; k <= a; ++k)
                cout << string(k, char('0' + k)) << '\n';
            for (int k = a - 1; k >= 1; --k)
                cout << string(k, char('0' + k)) << '\n';
        }
    }
}`,
    python: String.raw`import sys

it = iter(map(int, sys.stdin.buffer.read().split()))
first = True
for _ in range(next(it)):
    a, f = next(it), next(it)
    for _ in range(f):
        if not first:
            print()
        first = False
        for k in range(1, a + 1):
            print(str(k) * k)
        for k in range(a - 1, 0, -1):
            print(str(k) * k)
`,
  }),
  defineCpeLesson("a838", {
    topic: "strings",
    level: "easy",
    concept: "由樣本推導 ASCII 平移",
    goal: "逐字元減 7 解碼，保留原有行界線。",
    explanation: [
      "比較樣本開頭的編碼 1JKJ 與解碼 *CDC：ASCII 的 1=49、*=42，J=74、C=67，差都為 7。其他字元也符合同一平移，所以解碼公式是原字元碼減去 7。輸入中的單引號會解成空白，不能在讀取時把它當分隔符。",
      "換行屬於排版控制字元，應原樣保留，不能減 7。逐字元讀取，若是換行（或 Windows 的回車）直接輸出，其他字元照公式轉換；這也能保留空行與最後是否帶換行。處理直到 EOF，不加任何案例標頭。",
    ],
    complexity: "總字元數 L，時間 O(L)，串流處理額外空間 O(1)。",
    pitfall:
      "不要使用 cin>>word 或 split，解碼文字中的空格與原有換行都應保留。",
    traceLabel: "示意：編碼 HIJ",
    trace: [
      {
        title: "解 H",
        description: "H 的 ASCII 是 72，減 7 得 65，也就是 A。",
        cells: ["H:72", "A:65"],
        active: [1],
        variables: [["已解字元", "1"]],
      },
      {
        title: "解 I",
        description: "73−7=66，得到 B。",
        cells: ["I:73", "B:66"],
        active: [1],
        variables: [["已解字元", "2"]],
      },
      {
        title: "解 J",
        description: "74−7=67，得到 C，整串為 ABC。",
        cells: ["J:74", "C:67", "ABC"],
        active: [2],
        variables: [["已解字元", "3"]],
      },
    ],
    cpp: String.raw`#include <iostream>
using namespace std;
int main() {
    char c;
    while (cin.get(c))
        cout.put(c == '\n' || c == '\r' ? c : char(static_cast<unsigned char>(c) - 7));
}`,
    python: String.raw`import sys

for line in sys.stdin:
    sys.stdout.write(''.join(c if c in '\r\n' else chr(ord(c) - 7) for c in line))
`,
  }),
  defineCpeLesson("a839", {
    topic: "geometry",
    level: "hard",
    concept: "事件掃描與活動建築最大高度",
    goal: "同座標事件一起處理，只輸出真正的天際線轉折。",
    explanation: [
      "每棟建築在 L 開始覆蓋、R 結束覆蓋，視為半開區間 [L,R)。高度只可能在這些端點改變，因此把所有事件按 x 排序即可。C++ 用 multiset 保存活動高度，同高度建築必須保留重複計數；Python 用最大堆保存高度與右端點，堆頂到期時才延遲刪除。",
      "對同一個 x，先完成該座標所有開始與結束事件，再求新的最高高度。若與前一段相同就不輸出，避免同座標短暫下降或冗餘轉折；若不同才加入 x、高度。初始有地面高度 0，最後所有建築結束自然回到 0。即使輸入已按 L 排序，結束事件仍需納入掃描；全部數字在一行以空白分隔。",
    ],
    complexity: "n 棟建築，時間 O(n log n)，空間 O(n)。",
    pitfall:
      "同 x 逐事件立即印出會產生不存在的垂直轉折；移除同高度時只能刪一棟。",
    traceLabel: "示意：建築 (1,3,4)、(2,5,3)",
    trace: [
      {
        title: "x=1",
        description: "第一棟開始，最高從 0 升到 3，記錄 1 3。",
        cells: ["活動:3", "1 3"],
        active: [1],
        variables: [["height", "3"]],
      },
      {
        title: "x=2",
        description: "第二棟開始，活動高度 3、5，記錄 2 5。",
        cells: ["3", "5", "2 5"],
        active: [1, 2],
        variables: [["height", "5"]],
      },
      {
        title: "兩個結束點",
        description: "x=3 時回到 3，x=4 時回到 0，總輸出 1 3 2 5 3 3 4 0。",
        cells: ["3 3", "4 0"],
        active: [0, 1],
        variables: [
          ["最終高度", "0"],
          ["轉折數", "4"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <map>
#include <vector>
#include <set>
#include <utility>
using namespace std;
int main() {
    map<int, vector<pair<int, int>>> events;
    int l, h, r;
    while (cin >> l >> h >> r) {
        events[l].push_back({h, 1});
        events[r].push_back({h, -1});
    }
    multiset<int> active{0};
    int previous = 0;
    bool first = true;
    for (auto &[x, list] : events) {
        for (auto [height, kind] : list) {
            if (kind == 1)
                active.insert(height);
            else
                active.erase(active.find(height));
        }
        int current = *active.rbegin();
        if (current != previous) {
            if (!first)
                cout << ' ';
            first = false;
            cout << x << ' ' << current;
            previous = current;
        }
    }
    cout << '\n';
}`,
    python: String.raw`import sys
import heapq

it = iter(map(int, sys.stdin.buffer.read().split()))
buildings = [(l, next(it), next(it)) for l in it]
buildings.sort()
positions = sorted({x for l, h, r in buildings for x in (l, r)})
heap, result, i, previous = [], [], 0, 0
for x in positions:
    while i < len(buildings) and buildings[i][0] == x:
        l, h, r = buildings[i]
        heapq.heappush(heap, (-h, r))
        i += 1
    while heap and heap[0][1] <= x:
        heapq.heappop(heap)
    current = -heap[0][0] if heap else 0
    if current != previous:
        result.extend((x, current))
        previous = current
print(*result)
`,
  }),
  defineCpeLesson("a840", {
    topic: "number-theory",
    level: "easy",
    concept: "質數串列中央的對稱切片",
    goal: "含特例 1 的串列中，依奇偶選取中央元素。",
    explanation: [
      "先篩出 2 到 1000 的質數，再把 1 特別放在串列最前面。對每筆 N，取所有≤N 的項目形成長度 L 的串列。若 L 偶數，要取 2C 項；若 L 奇數，要取 2C−1 項，這樣所取長度與 L 同奇偶。",
      "令 k=min(L,所需項數)，左右各略過 (L−k)/2 項，就得到中央連續區間。當 C 很大時選整串，不可算出負起點。輸出 N C: 後，每個數字前一個空白，每筆後含空白行。1 在本題是規則指定的特殊元素，並不表示 1 在一般數學中是質數。",
    ],
    complexity:
      "預篩 O(U log log U)，U=1000；每筆取串列與輸出 O(U)，空間 O(U)。",
    pitfall: "奇數長度取 2C−1 而非 2C+1；別漏掉特殊的 1。",
    traceLabel: "示意：N=10，C=2",
    trace: [
      {
        title: "建立串列",
        description: "≤10 的指定串列為 1、2、3、5、7，長度 5。",
        cells: ["1", "2", "3", "5", "7"],
        active: [0, 1, 2, 3, 4],
        variables: [["L", "5"]],
      },
      {
        title: "計算範圍",
        description: "L 為奇數，k=2×2−1=3，起點 (5−3)/2=1。",
        cells: ["1", "2", "3", "5", "7"],
        active: [1, 2, 3],
        variables: [
          ["k", "3"],
          ["start", "1"],
        ],
      },
      {
        title: "輸出",
        description: "中央三項是 2、3、5。",
        cells: ["10 2: 2 3 5"],
        active: [0],
        variables: [["輸出項數", "3"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;
int main() {
    vector<bool> prime(1001, true);
    prime[0] = prime[1] = false;
    for (int p = 2; p * p <= 1000; ++p)
        if (prime[p])
            for (int x = p * p; x <= 1000; x += p)
                prime[x] = false;
    int n, c;
    while (cin >> n >> c) {
        vector<int> a{1};
        for (int x = 2; x <= n; ++x)
            if (prime[x])
                a.push_back(x);
        int len = int(a.size()), k = min(len, 2 * c - len % 2), start = (len - k) / 2;
        cout << n << ' ' << c << ':';
        for (int i = start; i < start + k; ++i)
            cout << ' ' << a[i];
        cout << "\n\n";
    }
}`,
    python: String.raw`import sys

prime = [True] * 1001
prime[0] = prime[1] = False
for p in range(2, 32):
    if prime[p]:
        for x in range(p * p, 1001, p):
            prime[x] = False
it = iter(map(int, sys.stdin.buffer.read().split()))
for n in it:
    c = next(it)
    a = [1] + [x for x in range(2, n + 1) if prime[x]]
    k = min(len(a), 2 * c - len(a) % 2)
    start = (len(a) - k) // 2
    print(f'{n} {c}:' + ''.join(' ' + str(x) for x in a[start : start + k]) + '\n')
`,
  }),
  defineCpeLesson("a841", {
    topic: "number-theory",
    level: "medium",
    concept: "Horner 轉值與有界顯示",
    goal: "在 2 至 16 進位間轉換，結果靠右寬度 7。",
    explanation: [
      "先以 value=value×原進位+digit 從左到右解析數字，A 到 F 對應 10 到 15。再反覆取 value%目標進位，除掉已取出的位，最後反轉得到輸出。零必須特判為 0，且前導零不會保留。",
      "顯示器只容七位，任何可顯示數在最大進位 16 中都小於 16⁷。因此解析時可把 value 截在 16⁷：一旦達此界線，不論目標進位為何一定 ERROR，避免未明限輸入長度造成 C++ 溢位。小於此界線仍要轉換並檢查字串長度，因較小目標進位可能超過七位。最後將結果或 ERROR 靠右對齊寬度 7，讀到 EOF。",
    ],
    complexity: "輸入長 L、結果長 D；時間 O(L+D)，空間 O(D)，數值飽和值固定。",
    pitfall: "ERROR 前要有兩個空白；前導零不算輸出長度，0 的表示不能是空字串。",
    traceLabel: "示意：1A，15 進位轉 2 進位",
    trace: [
      {
        title: "解析 1",
        description: "value=0×15+1=1。",
        cells: ["1", "value=1"],
        active: [1],
        variables: [["原進位", "15"]],
      },
      {
        title: "解析 A",
        description: "A=10，所以 value=1×15+10=25。",
        cells: ["A:10", "25"],
        active: [1],
        variables: [["value", "25"]],
      },
      {
        title: "反覆除二",
        description:
          "餘數依序為 1、0、0、1、1，反轉為 11001，寬度 7 前補兩格。",
        cells: ["10011（低位先）", "11001"],
        active: [1],
        variables: [
          ["位數", "5"],
          ["前補空白", "2"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <string>
#include <algorithm>
#include <iomanip>
using namespace std;
int main() {
    string s, digits = "0123456789ABCDEF";
    int from, to;
    const long long cap = 268435456;
    while (cin >> s >> from >> to) {
        long long value = 0;
        for (char c : s)
            value = min(cap, value * from + int(digits.find(c)));
        string out;
        if (value == cap)
            out = "ERROR";
        else {
            do {
                out += digits[value % to];
                value /= to;
            } while (value);
            reverse(out.begin(), out.end());
            if (out.size() > 7)
                out = "ERROR";
        }
        cout << setw(7) << out << '\n';
    }
}`,
    python: String.raw`import sys

it = iter(sys.stdin.read().split())
digits = '0123456789ABCDEF'
cap = 16**7
for s in it:
    source, target = int(next(it)), int(next(it))
    value = 0
    for ch in s:
        value = min(cap, value * source + digits.index(ch))
    if value == cap:
        out = 'ERROR'
    else:
        result = []
        while value:
            value, r = divmod(value, target)
            result.append(digits[r])
        out = ''.join(reversed(result)) or '0'
        if len(out) > 7:
            out = 'ERROR'
    print(f'{out:>7}')
`,
  }),
  defineCpeLesson("a842", {
    topic: "number-theory",
    level: "medium",
    concept: "模乘快速冪的不變量",
    goal: "以指數二進位在對數次乘法內求 Bᴾ mod M。",
    explanation: [
      "初始化 result=1%M、base=B%M。每輪若 P 為奇數，將 result 乘上 base 再取模；接著 base 平方取模，P 除以 2。這是在逐位讀取指數的二進位，只有該位為 1 時才把對應次方乘進答案。",
      "過程維持 result×baseᴾ 與原本 B 的原指數次方同餘，P 到 0 時便剩下 result。每一步取模是合法的，因為整數乘法與取模相容。M=1 時答案永遠是 0，P=0 也要靠 1%M 正確處理；輸入空白行可直接略過，每三個整數一筆直到 EOF。C++ 用 long long 保存乘積。",
    ],
    complexity: "每筆時間 O(log(P+1))，空間 O(1)。",
    pitfall: "不可先算完整 Bᴾ 再取模；P=0、M=1 時答案不是 1。",
    traceLabel: "示意：3⁵ mod 7",
    trace: [
      {
        title: "P=5",
        description: "奇數，result=1×3 mod7=3；base=9 mod7=2，P變2。",
        cells: ["result:3", "base:2", "P:2"],
        active: [0, 1, 2],
        variables: [["已消耗位元", "1"]],
      },
      {
        title: "P=2",
        description: "偶數不乘答案；base=4，P變1。",
        cells: ["result:3", "base:4", "P:1"],
        active: [1, 2],
        variables: [["已消耗位元", "2"]],
      },
      {
        title: "P=1",
        description: "result=3×4 mod7=5，P變0，完成。",
        cells: ["result:5", "P:0"],
        active: [0],
        variables: [["答案", "5"]],
      },
    ],
    cpp: String.raw`#include <iostream>
using namespace std;
int main() {
    long long b, p, m;
    while (cin >> b >> p >> m) {
        long long result = 1 % m;
        b %= m;
        while (p) {
            if (p % 2)
                result = result * b % m;
            b = b * b % m;
            p /= 2;
        }
        cout << result << '\n';
    }
}`,
    python: String.raw`import sys

it = iter(map(int, sys.stdin.buffer.read().split()))
for b in it:
    p, m = next(it), next(it)
    result = 1 % m
    b %= m
    while p:
        if p % 2:
            result = result * b % m
        b = b * b % m
        p //= 2
    print(result)
`,
  }),
  defineCpeLesson("a843", {
    topic: "number-theory",
    level: "easy",
    concept: "真因數配對與固定欄寬分類表",
    goal: "分類完全數、虧數、盈數並印出指定報表。",
    explanation: [
      "真因數總和可用因數配對求得：n>1 時先加入 1，再枚舉 2≤d≤√n，整除時加入 d 與 n/d；若兩者相等則只加入一次。n=1 沒有正真因數，總和必須初始化為 0。",
      "比較總和與 n，分別選 DEFICIENT、PERFECT、ABUNDANT。先印一次 PERFECTION OUTPUT，逐個讀數字直到 0，每個數字靠右寬度 5，之後恰好兩個空白再接分類；最後只印一次 END OF OUTPUT。這些標頭、全大寫及欄寬是本題報表的一部分。",
    ],
    complexity: "每筆數字時間 O(√n)，空間 O(1)。",
    pitfall: "1 不能先把 1 當自己的真因數；欄寬 5 後還要另加兩個空白。",
    traceLabel: "示意：n=6",
    trace: [
      {
        title: "初始真因數",
        description: "n>1，先納入 1。",
        cells: ["1"],
        active: [0],
        variables: [
          ["sum", "1"],
          ["n", "6"],
        ],
      },
      {
        title: "因數對",
        description: "d=2 找到配對 3，總和 1+2+3=6。",
        cells: ["1", "2", "3"],
        active: [1, 2],
        variables: [["sum", "6"]],
      },
      {
        title: "分類與排版",
        description: "sum=n，分類 PERFECT；6 左側補四格，之後兩格再接分類。",
        cells: ["6", "PERFECT"],
        active: [1],
        variables: [
          ["數字欄寬", "5"],
          ["分隔空白", "2"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <iomanip>
using namespace std;
int main() {
    cout << "PERFECTION OUTPUT\n";
    int n;
    while (cin >> n && n) {
        int sum = n > 1 ? 1 : 0;
        for (int d = 2; d * d <= n; ++d)
            if (n % d == 0) {
                sum += d;
                if (d != n / d)
                    sum += n / d;
            }
        cout << setw(5) << n << "  "
             << (sum < n    ? "DEFICIENT"
                 : sum == n ? "PERFECT"
                            : "ABUNDANT")
             << '\n';
    }
    cout << "END OF OUTPUT\n";
}`,
    python: String.raw`import sys
import math

print('PERFECTION OUTPUT')
for n in map(int, sys.stdin.buffer.read().split()):
    if n == 0:
        break
    total = 1 if n > 1 else 0
    for d in range(2, math.isqrt(n) + 1):
        if n % d == 0:
            total += d
            if d != n // d:
                total += n // d
    kind = 'DEFICIENT' if total < n else 'PERFECT' if total == n else 'ABUNDANT'
    print(f'{n:5d}  {kind}')
print('END OF OUTPUT')
`,
  }),
];
