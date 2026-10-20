import type { ToiPotentialLesson } from "@/lib/toiPotentialLessonTypes";
import { defineToiPotentialLesson } from "@/lib/toiPotentialLessonBuilder";

export const lessons: ToiPotentialLesson[] = [
  defineToiPotentialLesson("a309", {
    topic: "math",
    level: "easy",
    concept: "合併的不變量・高度差望遠鏡求和",
    goal: "證明合併順序不影響成本，直接累計各建築物的必要墊高量。",
    explanation: [
      "設第 i 座建築物原本最高為 hᵢ、柱數為 kᵢ，全體最高為 H。合併不會提高兩者最高高度，因此最後高度必定是 H。同一座原始建築物的柱子在每次操作都一起增加相同高度，其最高柱最終必須從 hᵢ 變成 H。",
      "無論途中分幾次墊高，這些增量相加恰為 H−hᵢ，因此它的每根柱子都增加 H−hᵢ 塊，總答案就是 Σ kᵢ(H−hᵢ)。讀入時累計柱數 S 與 Σkᵢhᵢ，最後算 H×S−Σkᵢhᵢ；不必儲存所有柱子，也不必實際安排合併。",
    ],
    complexity:
      "令 S 為總柱數（≤10⁶），時間 O(S)，額外空間 O(1)；Python 逐行讀入需要 O(單座最大柱數) 的解析空間。答案小於 10¹⁵，C++ 使用 long long。",
    pitfall:
      "墊高的是較矮建築物的所有柱子，不是只補最高柱，也不是把每根柱子各自補到 H。",
    traceLabel: "公開範例：以各座最高柱計算成本",
    trace: [
      {
        title: "第一座",
        description: "兩根柱子 1、3，最高為 3。",
        cells: ["k=2", "h=3"],
        active: [0, 1],
        variables: [
          ["S", "2"],
          ["Σkh", "6"],
        ],
      },
      {
        title: "加入第二座",
        description: "三根高度 2 的柱子；Σkh 增加 6。",
        cells: ["(2,3)", "(3,2)"],
        active: [1],
        variables: [
          ["S", "5"],
          ["Σkh", "12"],
        ],
      },
      {
        title: "以 H=5 結算",
        description: "第一座加 4 塊，第二座加 9 塊，第三座不需墊高。",
        cells: ["2×2=4", "3×3=9", "1×0=0"],
        active: [0, 1, 2],
        variables: [
          ["S", "6"],
          ["答案", "5×6−17=13"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <algorithm>
using namespace std;
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    long long columns = 0, weighted = 0, highest = 0;
    while (n--) {
        int k;
        cin >> k;
        long long h = 0, x;
        for (int j = 0; j < k; ++j) {
            cin >> x;
            h = max(h, x);
        }
        columns += k;
        weighted += h * k;
        highest = max(highest, h);
    }
    cout << highest * columns - weighted << '\n';
}`,
    python: String.raw`import sys


def integers():
    for line in sys.stdin.buffer:
        yield from map(int, line.split())


it = integers()
n = next(it)
columns = weighted = highest = 0
for _ in range(n):
    k = next(it)
    h = max(next(it) for _ in range(k))
    columns += k
    weighted += k * h
    highest = max(highest, h)
print(highest * columns - weighted)
`,
  }),
  defineToiPotentialLesson("a310", {
    topic: "data-structures",
    level: "hard",
    concept: "二維支配計數・離線掃描與 Fenwick tree",
    goal: "將兩項總和限制化為座標門檻，計數不重複的歌手配對。",
    explanation: [
      "固定歌手 i 後，合法的 j 必須滿足 Aⱼ≥−Aᵢ 且 Bⱼ≥−Bᵢ。把詢問依 Aᵢ 由小到大處理，門檻 −Aᵢ 就由大到小下降；另一份歌手清單依 A 遞減排序，將符合目前 A 門檻的人逐一加入資料結構。",
      "Fenwick tree 以離散化的 B 為座標，維護已加入歌手數；已加入總數減去 B<−Bᵢ 的前綴計數就是答案貢獻。此時同一對被兩端各算一次，且 Aᵢ、Bᵢ 都非負的人會算到自己。先扣除所有這類自配對，再除以 2，才是不同歌手的無序對數。等號必須納入，不能把門檻上的人排除。",
    ],
    complexity:
      "N≤200000，排序及 Fenwick 操作共 O(N log N) 時間、O(N) 空間。配對數可達 N(N−1)/2，C++ 用 64 位元。",
    pitfall:
      "不能只分別數 A 合格和 B 合格再相乘；兩個條件必須由同一位歌手同時滿足。",
    traceLabel: "公開範例：按 A 門檻查詢（歌手以輸入序號表示）",
    trace: [
      {
        title: "查歌手 2",
        description: "A=−2，要求 Aⱼ≥2、Bⱼ≥−3，歌手 1、3 合格。",
        cells: ["1:(2,−3)", "3:(4,2)"],
        active: [0, 1],
        variables: [
          ["本次", "2"],
          ["有序累計", "2"],
        ],
      },
      {
        title: "查歌手 4、1",
        description: "歌手 4 只找到 3、4；歌手 1 只找到 2。",
        cells: ["4→{3,4}", "1→{2}"],
        active: [0, 1],
        variables: [
          ["有序累計", "5"],
          ["已含自配對", "4"],
        ],
      },
      {
        title: "查歌手 3 並去重",
        description: "歌手 3 找到 2、3、4，累計 8；扣掉 3、4 的自配對後除二。",
        cells: ["3→{2,3,4}", "合法對 1–2", "2–3", "3–4"],
        active: [1, 2, 3],
        variables: [["答案", "(8−2)/2=3"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;
struct Singer {
    long long a, b;
};
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    vector<Singer> p(n);
    vector<long long> bs;
    long long self = 0;
    for (auto &s : p) {
        cin >> s.a >> s.b;
        bs.push_back(s.b);
        self += s.a >= 0 && s.b >= 0;
    }
    sort(p.begin(), p.end(), [](auto x, auto y) { return x.a < y.a; });
    sort(bs.begin(), bs.end());
    bs.erase(unique(bs.begin(), bs.end()), bs.end());
    vector<int> bit(bs.size() + 1);
    auto add = [&](int k) {
        for (++k; k < (int)bit.size(); k += k & -k)
            ++bit[k];
    };
    auto prefix = [&](int k) {
        int s = 0;
        for (; k; k -= k & -k)
            s += bit[k];
        return s;
    };
    int j = n - 1, inserted = 0;
    long long total = 0;
    for (auto s : p) {
        while (j >= 0 && p[j].a >= -s.a) {
            add(lower_bound(bs.begin(), bs.end(), p[j].b) - bs.begin());
            --j;
            ++inserted;
        }
        int k = lower_bound(bs.begin(), bs.end(), -s.b) - bs.begin();
        total += inserted - prefix(k);
    }
    cout << (total - self) / 2 << '\n';
}`,
    python: String.raw`import sys
from bisect import bisect_left

data = list(map(int, sys.stdin.buffer.read().split()))
n = data[0]
p = sorted(zip(data[1::2], data[2::2]))
del data
bs = sorted({b for a, b in p})
bit = [0] * (len(bs) + 1)
j = n - 1
inserted = total = 0
for a, b in p:
    while j >= 0 and p[j][0] >= -a:
        k = bisect_left(bs, p[j][1]) + 1
        while k < len(bit):
            bit[k] += 1
            k += k & -k
        j -= 1
        inserted += 1
    k = bisect_left(bs, -b)
    smaller = 0
    while k:
        smaller += bit[k]
        k -= k & -k
    total += inserted - smaller
self_pairs = sum(a >= 0 and b >= 0 for a, b in p)
print((total - self_pairs) // 2)
`,
  }),
  defineToiPotentialLesson("a311", {
    topic: "data-structures",
    level: "medium",
    concept: "雙向單調堆疊・最近不矮的大樓",
    goal: "在左右各找一棟最近且高度不低於自己的大樓，再取較短距離。",
    explanation: [
      "由左往右掃描，用堆疊保存可能成為左側答案的編號。處理高度 h 時，將頂端高度嚴格小於 h 的大樓彈出：對目前和以後的大樓而言，它已被更近且更高的目前大樓支配，沒有再保留的必要。剩下頂端就是左側最近的高度≥h 者。",
      "反向再做一次即可得到右側答案，兩側距離取最小值。每個編號在每趟掃描最多入堆疊、出堆疊各一次，因此不是每次都向左右線性搜尋。相同高度要保留，因為它本身符合『至少和它相同』；題目保證查詢的編號一定有答案。",
    ],
    complexity: "N≤300000，預處理 O(N)，M 次查詢 O(M)，空間 O(N)。",
    pitfall: "彈出條件是 < 而非 ≤；等高的鄰居也能使棟距為 1。編號從 0 起算。",
    traceLabel: "公開範例：高度 6、2、5、2、6",
    trace: [
      {
        title: "掃到編號 2",
        description: "彈出較矮的編號 1；編號 0 是左側最近不矮者。",
        cells: ["0:6", "2:5"],
        active: [1],
        variables: [
          ["左距離[2]", "2"],
          ["堆疊", "0,2"],
        ],
      },
      {
        title: "掃到編號 4",
        description: "彈出 3、2，保留等高的 0。",
        cells: ["0:6", "4:6"],
        active: [1],
        variables: [
          ["左距離[4]", "4"],
          ["堆疊", "0,4"],
        ],
      },
      {
        title: "合併右側結果",
        description: "編號 3 距離 2 只有一格；編號 0、4 互為不矮鄰居。",
        cells: ["查3→1", "查0→4", "查2→2", "查4→4"],
        active: [0, 1, 2, 3],
        variables: [["輸出", "1 4 2 4"]],
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
    vector<long long> h(n);
    for (auto &x : h)
        cin >> x;
    vector<int> ans(n, n), st;
    for (int i = 0; i < n; ++i) {
        while (!st.empty() && h[st.back()] < h[i])
            st.pop_back();
        if (!st.empty())
            ans[i] = i - st.back();
        st.push_back(i);
    }
    st.clear();
    for (int i = n - 1; i >= 0; --i) {
        while (!st.empty() && h[st.back()] < h[i])
            st.pop_back();
        if (!st.empty())
            ans[i] = min(ans[i], st.back() - i);
        st.push_back(i);
    }
    for (int i = 0, q; i < m; ++i) {
        cin >> q;
        if (i)
            cout << ' ';
        cout << ans[q];
    }
    cout << '\n';
}`,
    python: String.raw`import sys

it = iter(map(int, sys.stdin.buffer.read().split()))
n, m = next(it), next(it)
h = [next(it) for _ in range(n)]
ans = [n] * n
stack = []
for i in range(n):
    while stack and h[stack[-1]] < h[i]:
        stack.pop()
    if stack:
        ans[i] = i - stack[-1]
    stack.append(i)
stack.clear()
for i in range(n - 1, -1, -1):
    while stack and h[stack[-1]] < h[i]:
        stack.pop()
    if stack:
        ans[i] = min(ans[i], stack[-1] - i)
    stack.append(i)
print(*(ans[next(it)] for _ in range(m)))
`,
  }),
  defineToiPotentialLesson("a312", {
    topic: "greedy",
    level: "medium",
    concept: "合法切點・前綴最大與後綴最小",
    goal: "找出所有不會造成跨區段逆序的切點，同時切開以得到最多區段。",
    explanation: [
      "在 i 與 i+1 之間切開後，左邊任意書號都不能大於右邊任意書號，否則各段內部排序仍無法修正這一對跨段逆序。這恰好等價於 max(a[0..i])≤min(a[i+1..N−1])。先從右往左預處理後綴最小，再向右更新前綴最大即可檢查。",
      "每一個可行切點都是任何解可以使用的界線，所有可行切點一起使用仍保持前面的所有書號≤後面的所有書號，因此可以同時切開，不會互相衝突。答案從一個整段開始，每遇到合法切點就加一；重複書號允許相等，已排序陣列可以切成 N 段。",
    ],
    complexity:
      "N≤10⁶，時間 O(N)，空間 O(N)。Python 以緊密的 array 儲存書號與後綴最小值。",
    pitfall: "相等也可以切；只檢查相鄰兩本的大小不足以保證跨段沒有逆序。",
    traceLabel: "公開範例：2、1、2、4、3、5",
    trace: [
      {
        title: "切在第一本後？",
        description: "左側最大 2，右側最小 1，不能切。",
        cells: ["2", "1 2 4 3 5"],
        active: [0, 1],
        variables: [
          ["比較", "2≤1：否"],
          ["段數", "1"],
        ],
      },
      {
        title: "第二、三本後皆可切",
        description: "兩個界線分別比較 2≤2、2≤3。",
        cells: ["2 1", "2", "4 3 5"],
        active: [0, 1],
        variables: [
          ["合法切點", "2,3"],
          ["段數", "3"],
        ],
      },
      {
        title: "第五本後再切",
        description: "第四本後 4>3 不可切；第五本後 4≤5 可切。",
        cells: ["2 1", "2", "4 3", "5"],
        active: [2, 3],
        variables: [
          ["排序後", "1 2 | 2 | 3 4 | 5"],
          ["答案", "4"],
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
    vector<int> a(n), suffix(n);
    for (auto &x : a)
        cin >> x;
    suffix[n - 1] = a[n - 1];
    for (int i = n - 2; i >= 0; --i)
        suffix[i] = min(a[i], suffix[i + 1]);
    int largest = 0, answer = 1;
    for (int i = 0; i + 1 < n; ++i) {
        largest = max(largest, a[i]);
        if (largest <= suffix[i + 1])
            ++answer;
    }
    cout << answer << '\n';
}`,
    python: String.raw`import sys
from array import array


def integers():
    carry = b''
    while True:
        chunk = sys.stdin.buffer.read(65536)
        if not chunk:
            break
        parts = (carry + chunk).split()
        carry = parts.pop() if chunk[-1] > 32 else b''
        yield from map(int, parts)
    if carry:
        yield int(carry)


it = integers()
n = next(it)
a = array('I', it)
suffix = array('I', a)
for i in range(n - 2, -1, -1):
    suffix[i] = min(a[i], suffix[i + 1])
largest = 0
answer = 1
for i in range(n - 1):
    largest = max(largest, a[i])
    if largest <= suffix[i + 1]:
        answer += 1
print(answer)
`,
  }),
  defineToiPotentialLesson("a313", {
    topic: "strings",
    level: "hard",
    concept: "字典序相鄰 LCP・單調堆疊求區間最小值總和",
    goal: "不用建立百萬個字典節點，也能累加每個姓名與其他姓名的共同開頭長度。",
    explanation: [
      "將姓名依字典序排序，記錄相鄰姓名的 LCP 長度 l[i]。排序後第 i 到第 j 個姓名的共同開頭長度恰為 l[i+1..j] 的最小值：共同前綴形成連續區間，所以中途任何一對斷掉的地方就是整段的限制。重複姓名仍保存不同的原始編號。",
      "向右掃描 l，維護以目前位置結尾的所有區間最小值總和。堆疊節點存（最小值、代表的起點數）；加入 x 時把頂端≥x 的群組合併，從總和扣掉舊貢獻再加 x×群組大小。得到每個姓名與左邊所有人的 LCP 和；反向再做一次得到右邊貢獻，兩者相加後按原始編號輸出，不會包含自己。",
    ],
    complexity:
      "令 S≤10⁶ 為總字元數。字典序排序保守計 O(S log N) 字元比較；相鄰 LCP 與兩趟堆疊 O(S+N)，空間 O(S+N)。姓名長度可達 3000，程式不使用遞迴。",
    pitfall:
      "只累加左右相鄰姓名的 LCP 會漏掉遠處姓名；必須計算所有區間的最小值。",
    traceLabel: "公開範例排序後：CAR、CART、CAT、DOG",
    trace: [
      {
        title: "加入 CART",
        description: "CAR 與 CART 的 LCP 為 3。",
        cells: ["CAR", "CART"],
        active: [0, 1],
        variables: [
          ["堆疊", "(3,1)"],
          ["CART 左和", "3"],
        ],
      },
      {
        title: "加入 CAT",
        description: "新 LCP=2，合併兩個起點；CAT 與 CAR、CART 都共有兩字。",
        cells: ["CAR", "CART", "CAT"],
        active: [2],
        variables: [
          ["堆疊", "(2,2)"],
          ["CAT 左和", "4"],
        ],
      },
      {
        title: "合併雙向貢獻",
        description: "DOG 的貢獻均為 0，依原始順序 CAT、CAR、DOG、CART 還原。",
        cells: ["CAT:4", "CAR:5", "DOG:0", "CART:5"],
        active: [0, 1, 2, 3],
        variables: [
          ["排序後總和", "5,5,4,0"],
          ["輸出", "4,5,0,5"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
#include <utility>
using namespace std;
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    vector<pair<string, int>> names(n);
    for (int i = 0; i < n; ++i) {
        cin >> names[i].first;
        names[i].second = i;
    }
    sort(names.begin(), names.end());
    vector<int> lcp(n, 0);
    for (int i = 1; i < n; ++i) {
        auto &a = names[i - 1].first;
        auto &b = names[i].first;
        while (lcp[i] < (int)min(a.size(), b.size()) && a[lcp[i]] == b[lcp[i]])
            ++lcp[i];
    }
    vector<long long> ans(n);
    vector<pair<int, int>> st;
    long long sum = 0;
    for (int i = 1; i < n; ++i) {
        int x = lcp[i], count = 1;
        while (!st.empty() && st.back().first >= x) {
            sum -= 1LL * st.back().first * st.back().second;
            count += st.back().second;
            st.pop_back();
        }
        st.push_back({x, count});
        sum += 1LL * x * count;
        ans[names[i].second] += sum;
    }
    st.clear();
    sum = 0;
    for (int i = n - 2; i >= 0; --i) {
        int x = lcp[i + 1], count = 1;
        while (!st.empty() && st.back().first >= x) {
            sum -= 1LL * st.back().first * st.back().second;
            count += st.back().second;
            st.pop_back();
        }
        st.push_back({x, count});
        sum += 1LL * x * count;
        ans[names[i].second] += sum;
    }
    for (auto x : ans)
        cout << x << '\n';
}`,
    python: String.raw`import sys
from array import array

read = sys.stdin.buffer.readline
n = int(read())
names = sorted((read().strip(), i) for i in range(n))
lcp = array('I', [0]) * n
for i in range(1, n):
    a, b = names[i - 1][0], names[i][0]
    k = 0
    while k < min(len(a), len(b)) and a[k] == b[k]:
        k += 1
    lcp[i] = k
answer = array('q', [0]) * n
for backwards in (False, True):
    stack = []
    total = 0
    indices = range(n - 2, -1, -1) if backwards else range(1, n)
    for i in indices:
        x = lcp[i + 1] if backwards else lcp[i]
        count = 1
        while stack and stack[-1][0] >= x:
            old, amount = stack.pop()
            total -= old * amount
            count += amount
        stack.append((x, count))
        total += x * count
        answer[names[i][1]] += total
for x in answer:
    print(x)
`,
  }),
  defineToiPotentialLesson("a314", {
    topic: "greedy",
    level: "medium",
    concept: "穩定排序的優先權・最後一次操作覆蓋舊鍵",
    goal: "將最多二十萬次排序壓縮為至多四個有效排序鍵。",
    explanation: [
      "穩定排序的結果可以看成多層比較鍵：本次屬性是第一優先，同值時沿用操作前的順序。因此最後一次點選某屬性之後，該屬性更早的排序鍵都不再有作用；保留每種屬性的最後時間與當時方向即可。方向仍需按每次點選計算：連點同一屬性就切換，換屬性則重新升序。",
      "將四種有效屬性依最後時間由舊到新依序做穩定排序，正好讓較新的鍵優先；最多只有四次 O(N log N) 排序。初始順序自然作為所有有效鍵相同時的最後裁決。降序也要使用穩定排序，不能反轉整列，否則等值群組內的次序會被破壞。",
    ],
    complexity:
      "時間 O(K+4N log N)，空間 O(N+K)（Python 輸入解析含操作列）；N、K≤200000。",
    pitfall:
      "方向由連續點選決定，不是這個屬性總共被點幾次；換到別的屬性後再回來會重設升序。",
    traceLabel: "公開範例操作 1、3、3",
    trace: [
      {
        title: "點名稱",
        description: "名稱升序後為 1、2、5、10。",
        cells: ["1", "2", "5", "10"],
        active: [0, 1, 2, 3],
        variables: [["最後鍵", "名稱↑"]],
      },
      {
        title: "點類型",
        description: "類型升序，類型相同時沿用名稱順序。",
        cells: ["1:type1", "2:type1", "5:type2", "10:type2"],
        active: [0, 1],
        variables: [["優先權", "類型↑、名稱↑"]],
      },
      {
        title: "再次點類型",
        description: "類型改降序，但每組內的名稱順序不變。",
        cells: ["5:type2", "10:type2", "1:type1", "2:type1"],
        active: [0, 1, 2, 3],
        variables: [
          ["有效排序次數", "2"],
          ["名稱輸出順序", "5,10,1,2"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <array>
#include <algorithm>
using namespace std;
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, k;
    cin >> n >> k;
    vector<array<long long, 4>> files(n);
    for (auto &f : files)
        for (auto &x : f)
            cin >> x;
    array<int, 4> last;
    last.fill(-1);
    array<bool, 4> down{};
    int previous = -1;
    bool descending = false;
    for (int t = 0; t < k; ++t) {
        int p;
        cin >> p;
        --p;
        descending = (p == previous) ? !descending : false;
        last[p] = t;
        down[p] = descending;
        previous = p;
    }
    vector<int> keys;
    for (int p = 0; p < 4; ++p)
        if (last[p] >= 0)
            keys.push_back(p);
    sort(keys.begin(), keys.end(), [&](int a, int b) { return last[a] < last[b]; });
    for (int p : keys)
        stable_sort(files.begin(), files.end(), [&](const auto &a, const auto &b) {
            return down[p] ? a[p] > b[p] : a[p] < b[p];
        });
    for (auto f : files)
        cout << f[0] << ' ' << f[1] << ' ' << f[2] << ' ' << f[3] << '\n';
}`,
    python: String.raw`import sys
from operator import itemgetter

read = sys.stdin.buffer.readline
n, k = map(int, read().split())
files = [tuple(map(int, read().split())) for _ in range(n)]
operations = map(int, sys.stdin.buffer.read().split())
last = [-1] * 4
down = [False] * 4
previous = -1
descending = False
for t, p in enumerate(operations):
    p -= 1
    descending = not descending if p == previous else False
    last[p] = t
    down[p] = descending
    previous = p
for p in sorted(range(4), key=last.__getitem__):
    if last[p] >= 0:
        files.sort(key=itemgetter(p), reverse=down[p])
for row in files:
    print(*row)
`,
  }),
  defineToiPotentialLesson("a315", {
    topic: "dp",
    level: "hard",
    concept: "區段動態規劃・單調佇列最佳化",
    goal: "把每個結尾的 T 種區段選擇，壓縮成滑動視窗最大值查詢。",
    explanation: [
      "設 P[i] 是前 i 個價值總和，dp[i] 是前 i 個時刻的最高分。若最後一段是 j+1..i，則 i−T≤j≤i−1，之前可使用的部分最多到 j−K，因此得分為 P[i]+dp[max(0,j−K)]−P[j]；也能不選第 i 個時刻，保留 dp[i−1]。",
      "在處理 i 前加入 j=i−1 的候選值 dp[max(0,j−K)]−P[j]，移除 j<i−T 的過期候選。單調佇列由大到小保存候選值，尾端若不比新候選好就刪除，因為新候選更晚過期，永遠不會比較差。佇列首端給出最佳區段，故整體只需一次掃描。首段前無須 K 格間隔，由 dp[0]=0 的截斷處理。",
    ],
    complexity:
      "N≤4×10⁶，時間 O(N)，空間 O(N)。DP 與候選值均用 64 位元，答案≤4×10¹⁵；Python 使用 array 而非數百萬個整數物件，並以固定大小區塊解析輸入。",
    pitfall:
      "上一段必須結束於 j−K 或更早，不能寫成 j−K+1；也不能只比較固定長度 T 的區段而漏掉較短尾段。",
    traceLabel: "公開範例：K=1、T=2，價值 2、9、1、8、3",
    trace: [
      {
        title: "前兩個時刻",
        description: "選 [1,2] 得 11 分。",
        cells: ["2✓", "9✓", "1", "8", "3"],
        active: [0, 1],
        variables: [
          ["P[2]", "11"],
          ["dp[2]", "11"],
        ],
      },
      {
        title: "處理時刻 4",
        description: "最佳可選 [1,2] 與 [4]，中間空出時刻 3。",
        cells: ["2✓", "9✓", "1休", "8✓", "3"],
        active: [3],
        variables: [
          ["dp[3]", "11"],
          ["dp[4]", "19"],
        ],
      },
      {
        title: "處理時刻 5",
        description: "取 j=3，候選 dp[2]−P[3]=−1；P[5]=23，得到 22。",
        cells: ["2✓", "9✓", "1休", "8✓", "3✓"],
        active: [3, 4],
        variables: [
          ["候選最大", "−1"],
          ["dp[5]", "22"],
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
    int n, k, t;
    cin >> n >> k >> t;
    vector<long long> dp(n + 1), value(n + 1);
    vector<int> index(n + 1);
    int head = 0, tail = 0;
    long long prefix = 0;
    for (int i = 1; i <= n; ++i) {
        int j = i - 1;
        long long candidate = dp[max(0, j - k)] - prefix;
        while (head < tail && value[tail - 1] <= candidate)
            --tail;
        index[tail] = j;
        value[tail++] = candidate;
        while (head < tail && index[head] < i - t)
            ++head;
        long long x;
        cin >> x;
        prefix += x;
        dp[i] = max(dp[i - 1], prefix + value[head]);
    }
    cout << dp[n] << '\n';
}`,
    python: String.raw`import sys
from array import array


def integers():
    carry = b''
    while True:
        chunk = sys.stdin.buffer.read(65536)
        if not chunk:
            break
        parts = (carry + chunk).split()
        carry = parts.pop() if chunk[-1] > 32 else b''
        yield from map(int, parts)
    if carry:
        yield int(carry)


def main():
    it = integers()
    n, k, t = next(it), next(it), next(it)
    dp = array('q', [0]) * (n + 1)
    indices = array('i', [0]) * (n + 1)
    values = array('q', [0]) * (n + 1)
    head = tail = prefix = 0
    for i in range(1, n + 1):
        j = i - 1
        previous = dp[j - k] if j >= k else 0
        candidate = previous - prefix
        while head < tail and values[tail - 1] <= candidate:
            tail -= 1
        indices[tail] = j
        values[tail] = candidate
        tail += 1
        while head < tail and indices[head] < i - t:
            head += 1
        prefix += next(it)
        best = prefix + values[head]
        dp[i] = best if best > dp[i - 1] else dp[i - 1]
    print(dp[n])


main()
`,
  }),
  defineToiPotentialLesson("a316", {
    topic: "dp",
    level: "easy",
    concept: "路徑上的最大權獨立集・取或不取",
    goal: "把按鈕操作轉為不能同時領取相鄰積分的選擇問題。",
    explanation: [
      "任何兩個相鄰按鈕都不可能同時得分：先按下的一個會使另一個失效，之後再按失效按鈕也不會取回積分。反過來，任何不含相鄰編號的集合，都能依任意順序按下並取得全部積分。因此問題恰好是選出不相鄰元素的最大和。",
      "令 dp[i] 為前 i 個按鈕的最佳總分。若不取第 i 個，答案是 dp[i−1]；若取它，就不能取 i−1，答案是 dp[i−2]+score[i]。兩者取最大；只需要保存前兩個 DP 值。按失效按鈕不會帶來額外積分，還會讓鄰居失效，沒有必要納入最優策略。",
    ],
    complexity:
      "N≤10⁶，時間 O(N)，DP 額外空間 O(1)；Python 每行解析使用 O(該行長度) 暫存。最大答案不超過 99000000。",
    pitfall: "不是只比奇數編號總和與偶數編號總和；最佳集合可以在中途更換奇偶。",
    traceLabel: "公開範例：9、1、8、1、7",
    trace: [
      {
        title: "前兩顆",
        description: "第一顆得 9；前兩顆仍選第一顆。",
        cells: ["9✓", "1×"],
        active: [0],
        variables: [
          ["dp[1]", "9"],
          ["dp[2]", "9"],
        ],
      },
      {
        title: "第三顆",
        description: "取第三顆可接在 dp[1] 後，得到 9+8=17。",
        cells: ["9✓", "1×", "8✓"],
        active: [2],
        variables: [
          ["不取", "9"],
          ["取", "17"],
        ],
      },
      {
        title: "第五顆",
        description: "第四顆不取；第五顆接在 dp[3] 後，得 24。",
        cells: ["9✓", "1×", "8✓", "1×", "7✓"],
        active: [4],
        variables: [
          ["dp[4]", "17"],
          ["dp[5]", "24"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <algorithm>
using namespace std;
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    long long previous = 0, before = 0;
    while (n--) {
        long long x;
        cin >> x;
        long long current = max(previous, before + x);
        before = previous;
        previous = current;
    }
    cout << previous << '\n';
}`,
    python: String.raw`import sys


def integers():
    for line in sys.stdin.buffer:
        yield from map(int, line.split())


it = integers()
n = next(it)
before = previous = 0
for _ in range(n):
    current = max(previous, before + next(it))
    before, previous = previous, current
print(previous)
`,
  }),
  defineToiPotentialLesson("a317", {
    topic: "data-structures",
    level: "medium",
    concept: "全域扣除偏移・最小堆維護到期內容",
    goal: "不逐篇更新討論度，而是記錄失效門檻與仍活躍內容的總和。",
    explanation: [
      "令 offset 是至今每日衰減量之和。第 i 天新內容的討論度 v[i] 可儲存為 key=v[i]+offset，之後真實討論度是 max(0,key−offset)。每天只要先增加 offset，就等價於全部舊內容同步減少 d[i]；新內容是在當天衰減後才加入。",
      "用最小堆移除 key≤offset 的過期內容。為避免 key 總和溢位，程式直接維護真實熱門度 heat：每天先減去 d[i]×舊堆大小，再對每個過期 key 補回 offset−key，剛好把過度扣成負值的部分修正為 0，最後加入 v[i]。每則內容只加入、移除各一次；v=0 可忽略，因為它之後也不可能變正。",
    ],
    complexity:
      "D≤400000，時間 O(D log D)，空間 O(D)。offset、key 與真實熱門度使用 64 位元；熱門度≤D×10⁹≤4×10¹⁴。不可改成直接維護 key 總和，因為累積偏移可能讓它超過 64 位元。",
    pitfall:
      "若使用 key 總和，最壞會超過 64 位元。下方 C++ 每天先扣活躍篇數×衰減，再補回過期篇的負值，因此中間絕對值也在約 4×10¹⁴ 內。",
    traceLabel: "公開範例：先衰減，再發布新內容",
    trace: [
      {
        title: "第 1 天",
        description: "offset=2，新 key=10，真實討論度為 8。",
        cells: ["8"],
        active: [0],
        variables: [
          ["offset", "2"],
          ["熱門度", "8"],
        ],
      },
      {
        title: "第 2 天",
        description: "衰減 3 後舊內容為 5，再加入 5。",
        cells: ["5", "5"],
        active: [0, 1],
        variables: [
          ["offset", "5"],
          ["keys", "10,10"],
          ["熱門度", "10"],
        ],
      },
      {
        title: "第 3、4 天",
        description: "第 3 天兩篇舊內容歸零，加入 9；第 4 天衰減 0，再加 2。",
        cells: ["0", "0", "9", "2"],
        active: [2, 3],
        variables: [
          ["offset", "13"],
          ["第3天", "9"],
          ["第4天", "11"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <queue>
#include <vector>
#include <functional>
using namespace std;
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int d;
    cin >> d;
    priority_queue<long long, vector<long long>, greater<long long>> heap;
    long long offset = 0, heat = 0;
    while (d--) {
        long long v, decay;
        cin >> v >> decay;
        offset += decay;
        heat -= decay * (long long)heap.size();
        while (!heap.empty() && heap.top() <= offset) {
            heat += offset - heap.top();
            heap.pop();
        }
        if (v) {
            heap.push(v + offset);
            heat += v;
        }
        cout << heat << '\n';
    }
}`,
    python: String.raw`import sys
import heapq

read = sys.stdin.buffer.readline
days = int(read())
heap = []
offset = heat = 0
for _ in range(days):
    v, decay = map(int, read().split())
    offset += decay
    heat -= decay * len(heap)
    while heap and heap[0] <= offset:
        heat += offset - heapq.heappop(heap)
    if v:
        heapq.heappush(heap, v + offset)
        heat += v
    print(heat)
`,
  }),
  defineToiPotentialLesson("a318", {
    topic: "foundations",
    level: "easy",
    concept: "依編號累計・兩層排序鍵",
    goal: "累計每位粉絲的贈禮，再用金額降序與編號升序決定名次。",
    explanation: [
      "先配置 N 個初始為 0 的總金額。每筆紀錄只把金額加到該粉絲的格子；讀完後，陣列中每格就是該人的完整總額。沒有出現的編號仍保留 0，不能只輸出有贈禮的人。",
      "把所有編號排序，比較時先看總額，較大者優先；相同總額再比較編號，較小者優先。Python 可以使用鍵 (−total[id],id)；C++ 的比較函式明確實作兩個條件。輸出的是編號與累計金額，不是輸入紀錄的逐筆排名。",
    ],
    complexity: "時間 O(M+N log N)，空間 O(N)。N≤10⁵、M≤10⁶，每人總額≤10⁸。",
    pitfall: "M 可以為 0，仍需依編號輸出全部 N 人及金額 0。",
    traceLabel: "公開範例：累計與平手排序",
    trace: [
      {
        title: "前兩筆紀錄",
        description: "粉絲 2 收到 10，粉絲 0 收到 7。",
        cells: ["0:7", "1:0", "2:10", "3:0"],
        active: [0, 2],
        variables: [["已處理", "2筆"]],
      },
      {
        title: "完成累計",
        description: "粉絲 2 再加 2，粉絲 1 加 12，兩人平手。",
        cells: ["0:7", "1:12", "2:12", "3:0"],
        active: [1, 2],
        variables: [["最高總額", "12"]],
      },
      {
        title: "依排序鍵輸出",
        description: "平手時 1 先於 2，未贈禮的 3 也列出。",
        cells: ["1 12", "2 12", "0 7", "3 0"],
        active: [0, 1, 2, 3],
        variables: [["編號順序", "1,2,0,3"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <numeric>
#include <algorithm>
using namespace std;
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, m;
    cin >> n >> m;
    vector<long long> total(n);
    while (m--) {
        int id, x;
        cin >> id >> x;
        total[id] += x;
    }
    vector<int> order(n);
    iota(order.begin(), order.end(), 0);
    sort(order.begin(), order.end(),
         [&](int a, int b) { return total[a] != total[b] ? total[a] > total[b] : a < b; });
    for (int id : order)
        cout << id << ' ' << total[id] << '\n';
}`,
    python: String.raw`import sys

read = sys.stdin.buffer.readline
n, m = map(int, read().split())
total = [0] * n
for _ in range(m):
    person, amount = map(int, read().split())
    total[person] += amount
for person in sorted(range(n), key=lambda i: (-total[i], i)):
    print(person, total[person])
`,
  }),
  defineToiPotentialLesson("a319", {
    topic: "greedy",
    level: "medium",
    concept: "正權重的連續同屬性群組・每群保留最大值",
    goal: "利用分數皆正，把合法子序列最佳化化成各個連續群組的最大值總和。",
    explanation: [
      "把輸入切成屬性相同的最大連續群組。在同一群中，不可能選到兩個配料：它們之間沒有不同屬性的配料可以隔開。所以任何合法解從每一群至多取一份，總分不超過各群最大分數的總和。",
      "反過來，每群都取最大分數的那份，依原序接起來，相鄰群的屬性必定不同，因此構成合法漢堡，並且達到上述上界。這個證明依賴 S[i]≥1；不需通用的 K 狀態 DP。掃描時維護目前群組最大值，屬性改變就結算上一群，最後別忘記結算尾群。",
    ],
    complexity:
      "N≤10⁶、K≤1000，時間 O(N)。因分數和屬性分兩列輸入，程式保存 N 個分數，空間 O(N)；答案≤10⁹。",
    pitfall:
      "相同屬性若被其他群隔開，可以再次選取；不是每種屬性全域只能挑一份。",
    traceLabel: "公開範例：按連續屬性分群",
    trace: [
      {
        title: "屬性 1 群",
        description: "分數 4、9 只能取其中一份，保留 9。",
        cells: ["1:4", "1:9"],
        active: [1],
        variables: [
          ["群最大", "9"],
          ["已結算", "0"],
        ],
      },
      {
        title: "屬性 2 與 3 群",
        description: "屬性 2 取 6，屬性 3 在 2、8 中取 8。",
        cells: ["1:9", "2:6", "3:2", "3:8"],
        active: [1, 3],
        variables: [["前三群總和", "23"]],
      },
      {
        title: "末尾屬性 1",
        description: "末群的 5 可以接在屬性 3 後面，得分 28。",
        cells: ["1:9", "2:6", "3:8", "1:5"],
        active: [3],
        variables: [["答案", "9+6+8+5=28"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, k;
    cin >> n >> k;
    vector<int> s(n);
    for (auto &x : s)
        cin >> x;
    int previous = -1, best = 0;
    long long answer = 0;
    for (int i = 0; i < n; ++i) {
        int w;
        cin >> w;
        if (w != previous) {
            answer += best;
            best = 0;
            previous = w;
        }
        best = max(best, s[i]);
    }
    cout << answer + best << '\n';
}`,
    python: String.raw`import sys
from array import array


def integers():
    carry = b''
    while True:
        chunk = sys.stdin.buffer.read(65536)
        if not chunk:
            break
        parts = (carry + chunk).split()
        carry = parts.pop() if chunk[-1] > 32 else b''
        yield from map(int, parts)
    if carry:
        yield int(carry)


it = integers()
n, k = next(it), next(it)
scores = array('I', (next(it) for _ in range(n)))
previous = -1
best = answer = 0
for score in scores:
    w = next(it)
    if w != previous:
        answer += best
        best = 0
        previous = w
    best = max(best, score)
print(answer + best)
`,
  }),
];
