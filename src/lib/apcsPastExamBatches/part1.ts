import { definePastExamLesson } from "@/lib/apcsPastExamLessonBuilder";

export const lessonsPart1 = [
  definePastExamLesson("a356", {
    concept: "雙人任務分工・壓縮動態規劃",
    goal: "只記錄沒有執行上一個任務的外送員位置，求依序送貨及抵達終點的最小成本。",
    explanation: [
      "完成第 i 個任務時，至少一人必定在 p[i]。把他稱為目前的執行者，另一人的位置只能是起點或以前的任務地點。因此 dp[j] 表示目前執行者在 p[i]、另一人在 p[j] 的最低成本，並令 p[0]=1；不必記錄兩人的姓名。",
      "下一站是 q 時有兩種選擇：原執行者繼續，所有狀態加上 cost[p[i]][q]；或者另一人出發，在所有 j 中取 dp[j]+cost[p[j]][q] 的最小值，新狀態的閒置者留在 p[i]。兩種轉移恰好涵蓋下一任務的所有分工，所以逐層取最小值正確。",
      "全部任務完成後，還要在每個狀態加上兩人各自到地點 n 的成本再取最小值。矩陣是題面指定的移動成本，不能自行改成經其他地點的最短路；讀入 Python 矩陣時以 bytes 儲存 0 至 50，可避免大量整數物件。",
    ],
    complexity: "時間 O(n²+k²)，空間 O(n²+k)；Python 成本矩陣使用 n² 位元組。",
    pitfall: "完成最後任務不代表完成工作；兩位外送員都必須再到 n。任務可能就是起點或終點。",
    traceLabel: "示意：任務 2、3；cost(1,2)=4、cost(1,3)=2、cost(2,3)=7，終點為 3",
    trace: [
      { title: "兩人同在起點", description: "尚無任務，閒置位置索引為 0。", cells: ["1：兩人", "2", "3：終點"], active: [0], variables: [["dp[0]", "0"]] },
      { title: "完成任務 2", description: "任一人走 1→2，花費 4；另一人仍在 1。", cells: ["1：閒置者", "2：執行者", "3"], active: [1], variables: [["最低成本", "4"]] },
      { title: "交給另一人去 3", description: "繼續走需 4+7=11；換人走只需 4+2=6，閒置者改在 2。", cells: ["1", "2：閒置者", "3：執行者"], active: [2], variables: [["兩種狀態成本", "11、6"]] },
      { title: "加入終點成本", description: "第一個狀態為 11+2=13，第二個為 6+7=13，答案 13。", cells: ["兩人到 3", "13"], active: [1], variables: [["答案", "13"]] },
    ],
    cpp: String.raw`#include <bits/stdc++.h>
using namespace std;
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, k;
    cin >> n >> k;
    vector<int> p(k + 1, 0);
    for (int i = 1; i <= k; i++) {
        cin >> p[i];
        --p[i];
    }
    vector<vector<unsigned char>> c(n, vector<unsigned char>(n));
    for (int i = 0; i < n; i++)
        for (int j = 0, x; j < n; j++) {
            cin >> x;
            c[i][j] = x;
        }
    vector<long long> dp(1, c[0][p[1]]);
    for (int i = 2; i <= k; i++) {
        long long change = LLONG_MAX;
        for (int j = 0; j < i - 1; j++)
            change = min(change, dp[j] + c[p[j]][p[i]]);
        int step = c[p[i - 1]][p[i]];
        for (auto &v : dp)
            v += step;
        dp.push_back(change);
    }
    long long ans = LLONG_MAX;
    for (int j = 0; j < k; j++)
        ans = min(ans, dp[j] + c[p[k]][n - 1] + c[p[j]][n - 1]);
    cout << ans << '\n';
}`,
    python: String.raw`import sys
read = sys.stdin.buffer.readline
n, k = map(int, read().split())
p = [0] + [int(x)-1 for x in read().split()]
c = [bytes(map(int, read().split())) for _ in range(n)]
dp = [c[0][p[1]]]
for i in range(2, k+1):
    q = p[i]
    change = min(dp[j] + c[p[j]][q] for j in range(i-1))
    step = c[p[i-1]][q]
    dp = [v+step for v in dp]
    dp.append(change)
print(min(v+c[p[k]][n-1]+c[p[j]][n-1] for j, v in enumerate(dp)))`,
  }),
  definePastExamLesson("a357", {
    concept: "函數圖分解・非空最大連續和",
    goal: "把骨牌分解成互不相交的鏈與環，再求各元件的最佳連續段。",
    explanation: [
      "每個起點只出現一次、每個終點也只出現一次，因此每個頂點入度與出度至多為 1。所有骨牌只能形成鏈或環，不會分岔。先從入度為 0 的有出邊頂點走完所有鏈，再走尚未拜訪的環，每張骨牌恰被讀取一次。",
      "一條鏈的合法接龍就是權重序列的非空連續區間。Kadane 狀態 end=max(w,end+w) 表示以目前骨牌結尾的最大和，逐步取最大即可。環還能跨過序列首尾：其和等於全環總和減去中間最小連續和，因此同時計算最大和、最小和與總和。",
      "若全部權重為負，必須選最大的一張，不能用總和減最小和得到非法空集合。否則取一般最大和及環形候選的最大值即可，且從不重複使用骨牌。",
    ],
    complexity: "時間 O(n+m)，空間 O(n+m)。",
    pitfall: "骨牌不能翻轉，答案也不允許空接龍；全負環的答案是最大負權重。",
    traceLabel: "示意環：A→B 權重 4、B→C 權重 −7、C→A 權重 5",
    trace: [
      { title: "辨識環", description: "三個頂點各有一條入邊和出邊，沿方向取得權重 4、−7、5。", cells: ["4", "−7", "5"], variables: [["總和", "2"]] },
      { title: "線性最大和", description: "end 依序為 4、−3、5，線性最佳為 5。", cells: ["4", "−7", "5"], active: [2], variables: [["maxSub", "5"], ["minSub", "−7"]] },
      { title: "跨越序列首尾", description: "去掉 −7，從 C→A 接 A→B，可得 5+4=9。", cells: ["C→A：5", "A→B：4", "略去 −7"], active: [0, 1], variables: [["環形候選", "2−(−7)=9"]] },
    ],
    cpp: String.raw`#include <bits/stdc++.h>
using namespace std;
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, m;
    cin >> n >> m;
    vector<int> to(n + 1), w(n + 1), in(n + 1);
    vector<char> seen(n + 1);
    for (int i = 0, a, b, c; i < m; i++) {
        cin >> a >> b >> c;
        to[a] = b;
        w[a] = c;
        in[b] = 1;
    }
    long long ans = LLONG_MIN;
    auto walk = [&](int u, bool circle) {
        long long sum = 0, hi = LLONG_MIN, lo = LLONG_MAX, mx = 0, mn = 0;
        bool first = true;
        while (to[u] && !seen[u]) {
            seen[u] = 1;
            long long x = w[u];
            if (first) {
                mx = mn = x;
                first = false;
            } else {
                mx = max(x, mx + x);
                mn = min(x, mn + x);
            }
            hi = max(hi, mx);
            lo = min(lo, mn);
            sum += x;
            u = to[u];
        }
        if (circle && hi >= 0)
            hi = max(hi, sum - lo);
        ans = max(ans, hi);
    };
    for (int u = 1; u <= n; u++)
        if (to[u] && !in[u])
            walk(u, false);
    for (int u = 1; u <= n; u++)
        if (to[u] && !seen[u])
            walk(u, true);
    cout << ans << '\n';
}`,
    python: String.raw`import sys
read = sys.stdin.buffer.readline
n, m = map(int, read().split())
to = [0]*(n+1)
w = [0]*(n+1)
indeg = bytearray(n+1)
seen = bytearray(n+1)
for _ in range(m):
    a, b, x = map(int, read().split())
    to[a], w[a], indeg[b] = b, x, 1
def walk(u, circle):
    total = 0
    hi, lo = -10**18, 10**18
    mx = mn = None
    while to[u] and not seen[u]:
        seen[u] = 1
        x = w[u]
        if mx is None:
            mx = mn = x
        else:
            mx, mn = max(x, mx+x), min(x, mn+x)
        hi, lo, total = max(hi, mx), min(lo, mn), total+x
        u = to[u]
    return max(hi, total-lo) if circle and hi >= 0 else hi
answer = -10**18
for u in range(1, n+1):
    if to[u] and not indeg[u]:
        answer = max(answer, walk(u, False))
for u in range(1, n+1):
    if to[u] and not seen[u]:
        answer = max(answer, walk(u, True))
print(answer)`,
  }),
  definePastExamLesson("a358", {
    concept: "答案二分搜尋・非負區段貪心",
    goal: "二分最大步道難度，貪心判斷是否能用至多 K 段涵蓋所有點。",
    explanation: [
      "將 (d,h) 成對依 d 排序，再把每條相鄰邊轉為 e=(右位置−左位置)+max(0,2×高度差)。一段步道的難度就是段內邊權總和，而切段處的邊完全不計，並不是也要分給某一段。",
      "測試上限 X 時，從第一點開始累加邊權；若加入下一條邊會超過 X，就在該邊切開，開一條新步道並把累計歸零。因為邊權非負，越晚切第一段越不會使剩餘點更難安排，交換論證可知這樣使用的段數最少。",
      "若貪心只需至多 K 段，就能再拆成恰好 K 個非空段，拆段只會減少難度。可行性隨 X 單調，因此在 0 到所有邊權總和間二分最小可行值；K=N 時答案自然為 0。",
    ],
    complexity: "時間 O(N log N+N log(W+1))、空間 O(N)，W 為邊權總和，需 64 位元整數。",
    pitfall: "開新段時要捨棄跨段邊；不可將該邊設成新段的初始難度。",
    traceLabel: "第一個公開範例：排序後位置 1、4、8、9、10",
    trace: [
      { title: "計算邊權", description: "排序後高度為 1、3、10、6、3，邊權為 7、18、1、1。", cells: ["1→4：7", "4→8：18", "8→9：1", "9→10：1"], variables: [["K", "3"]] },
      { title: "測試上限 1", description: "前兩條邊切開；最後兩條不能同段，還得再切一次，共 4 段。", cells: ["[1]", "[4]", "[8,9]", "[10]"], active: [2, 3], variables: [["段數", "4：不可行"]] },
      { title: "測試上限 2", description: "切掉 7、18，最後三點的段內總和 1+1=2，恰用 3 段。", cells: ["[1]：0", "[4]：0", "[8,9,10]：2"], active: [2], variables: [["最小可行上限", "2"]] },
    ],
    cpp: String.raw`#include <bits/stdc++.h>
using namespace std;
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, k;
    cin >> n >> k;
    vector<pair<long long, long long>> p(n);
    for (auto &v : p)
        cin >> v.first;
    for (auto &v : p)
        cin >> v.second;
    sort(p.begin(), p.end());
    vector<long long> e;
    long long hi = 0;
    for (int i = 1; i < n; i++) {
        long long x = p[i].first - p[i - 1].first + max(0LL, 2 * (p[i].second - p[i - 1].second));
        e.push_back(x);
        hi += x;
    }
    long long lo = 0;
    while (lo < hi) {
        long long mid = (lo + hi) / 2, sum = 0;
        int groups = 1;
        for (auto x : e) {
            if (sum + x > mid) {
                groups++;
                sum = 0;
            } else
                sum += x;
        }
        if (groups <= k)
            hi = mid;
        else
            lo = mid + 1;
    }
    cout << lo << '\n';
}`,
    python: String.raw`import sys
it = iter(map(int, sys.stdin.buffer.read().split()))
n, k = next(it), next(it)
d = [next(it) for _ in range(n)]
h = [next(it) for _ in range(n)]
p = sorted(zip(d, h))
edges = [p[i][0]-p[i-1][0]+max(0, 2*(p[i][1]-p[i-1][1])) for i in range(1, n)]
lo, hi = 0, sum(edges)
while lo < hi:
    mid = (lo+hi)//2
    groups, total = 1, 0
    for x in edges:
        if total+x > mid:
            groups += 1
            total = 0
        else:
            total += x
    if groups <= k:
        hi = mid
    else:
        lo = mid+1
print(lo)`,
  }),
  definePastExamLesson("a359", {
    concept: "位元遮罩計數 DP・字典序反排名",
    goal: "計算每個候選學生開頭的方案數，跳過整塊方案找到第 t 個。",
    explanation: [
      "以學生編號依序考慮選或不選。狀態 f(i,mask,used) 記錄從學生 i 開始、已使用專長集合 mask、目前班級已選 used 人的完成方案數。已選人數就是 mask 的位元數；選 i 需要專長未出現且 used<2，跨到下一班時 used 歸零。選滿 k 人算一個方案，學生用盡仍未選滿算零。",
      "在已有共同前綴的情況下，所有『下一位選 i』的方案都排在『跳過 i』之前。計算選 i 後的完成數 c：若 t>c，減去 c 並跳過 i；否則確定選 i，繼續找剩餘排名。這樣每次都保留包含目標排名的連續區塊。",
      "快取狀態避免枚舉所有組合，計數可截在初始排名 t，因為大於等於 t 的確切數量不影響判斷。不同學生即使專長相同仍是不同選擇，不能先按專長合併人員。",
    ],
    complexity: "時間及空間 O(mr·2ⁿ·3)，每個狀態只有選、跳過兩個轉移；排名過程 O(mr)。",
    pitfall: "同班最多兩人是當前班級的計數，跳到下一班就要歸零；排名從 1 開始。",
    traceLabel: "第一個公開範例：k=3、t=2",
    trace: [
      { title: "固定第一位為 1", description: "學生 1 的專長是 3；以他開頭有足夠方案，目標仍在此區塊。", cells: ["1：3", "2：1", "3：2", "4：4", "5：1"], active: [0], variables: [["前綴", "[1]"], ["t", "2"]] },
      { title: "測試第二位 2", description: "選 [1,2] 已達第一班兩人上限；第二班僅學生 8 的專長 5 可補入，完成數為 1。", cells: ["[1,2,8]", "整塊只有 1 個"], active: [0], variables: [["跳過後 t", "2−1=1"]] },
      { title: "改選第二位 3", description: "前綴 [1,3] 使用專長 3、2，第三位最早可選學生 5 的專長 1。", cells: ["1", "3", "5"], active: [2], variables: [["答案", "1 3 5"]] },
    ],
    cpp: String.raw`#include <bits/stdc++.h>
using namespace std;
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, m, r, k;
    long long t;
    cin >> n >> m >> r >> k >> t;
    int len = m * r, S = 1 << n;
    vector<int> a(len);
    for (int &x : a) {
        cin >> x;
        x = 1 << (x - 1);
    }
    long long cap = t;
    vector<long long> memo((len + 1) * S * 3, -1);
    function<long long(int, int, int)> f = [&](int i, int mask, int used) -> long long {
        if (__builtin_popcount((unsigned)mask) == k)
            return 1;
        if (i == len)
            return 0;
        auto &res = memo[(i * S + mask) * 3 + used];
        if (res != -1)
            return res;
        bool boundary = (i + 1) % r == 0;
        res = f(i + 1, mask, boundary ? 0 : used);
        if (used < 2 && !(mask & a[i]))
            res = min(cap, res + f(i + 1, mask | a[i], boundary ? 0 : used + 1));
        return res;
    };
    int mask = 0, used = 0;
    vector<int> ans;
    for (int i = 0; i < len && (int)ans.size() < k; i++) {
        bool boundary = (i + 1) % r == 0;
        long long c =
            used < 2 && !(mask & a[i]) ? f(i + 1, mask | a[i], boundary ? 0 : used + 1) : 0;
        if (t <= c) {
            ans.push_back(i + 1);
            mask |= a[i];
            used++;
        } else
            t -= c;
        if (boundary)
            used = 0;
    }
    for (int i = 0; i < k; i++)
        cout << ans[i] << (i + 1 == k ? '\n' : ' ');
}`,
    python: String.raw`import sys
from functools import lru_cache
it = iter(map(int, sys.stdin.buffer.read().split()))
n, m, r, k, t = [next(it) for _ in range(5)]
length = m*r
a = [1 << (next(it)-1) for _ in range(length)]
cap = t
@lru_cache(None)
def f(i, mask, used):
    if mask.bit_count() == k:
        return 1
    if i == length:
        return 0
    boundary = (i+1) % r == 0
    result = f(i+1, mask, 0 if boundary else used)
    if used < 2 and not (mask & a[i]):
        result += f(i+1, mask | a[i], 0 if boundary else used+1)
    return min(cap, result)
answer = []
mask = used = 0
for i in range(length):
    boundary = (i+1) % r == 0
    c = f(i+1, mask | a[i], 0 if boundary else used+1) if used < 2 and not (mask & a[i]) else 0
    if t <= c:
        answer.append(i+1)
        mask |= a[i]
        used += 1
    else:
        t -= c
    if boundary:
        used = 0
    if len(answer) == k:
        break
print(*answer)`,
  }),
  definePastExamLesson("a360", {
    concept: "區間計數・排序與二分搜尋",
    goal: "把總場次改成逐個表演計算區間內旅行團數。",
    explanation: [
      "每一筆『旅行團抵達日在表演期間內』都貢獻一場。因此可以交換加總順序：不逐天模擬，也不逐團檢查全部表演，而是對每個表演 [s,e] 計算有幾個抵達日落在其中。",
      "將抵達日排序。lower_bound(s) 找到第一個不小於 s 的位置，upper_bound(e) 找到第一個大於 e 的位置；兩者差就是包含首尾的旅行團數。排序保留重複日期，所以同日不同團仍各算一次。所有區間的計數相加，恰好把每個可觀看的團與表演配對計算一次。",
    ],
    complexity: "時間 O(N log N+M log N)，空間 O(N)；答案最大 N·M=10¹⁰，C++ 使用 long long。",
    pitfall: "展演的結束日也算；不可用 lower_bound(e) 排除當天抵達的團。",
    traceLabel: "第一個公開範例：抵達日排序為 5、7、10",
    trace: [
      { title: "處理 [2,5]", description: "只有日期 5 落在包含首尾的區間。", cells: ["5", "7", "10"], active: [0], variables: [["貢獻", "1"], ["累計", "1"]] },
      { title: "處理 [3,9]、[7,8]", description: "分別涵蓋日期 5、7 與日期 7，增加 2+1。", cells: ["5", "7", "10"], active: [0, 1], variables: [["累計", "4"]] },
      { title: "處理 [4,6]、[5,6]", description: "兩個表演各有日期 5 的一團能看，總數為 6。", cells: ["5", "7", "10"], active: [0], variables: [["最後累計", "4+1+1=6"]] },
    ],
    cpp: String.raw`#include <bits/stdc++.h>
using namespace std;
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, m;
    cin >> n >> m;
    vector<int> t(n);
    for (int &x : t)
        cin >> x;
    sort(t.begin(), t.end());
    long long ans = 0;
    for (int i = 0, s, e; i < m; i++) {
        cin >> s >> e;
        ans += upper_bound(t.begin(), t.end(), e) - lower_bound(t.begin(), t.end(), s);
    }
    cout << ans << '\n';
}`,
    python: String.raw`import sys
from bisect import bisect_left, bisect_right
read = sys.stdin.buffer.readline
n, m = map(int, read().split())
t = sorted(map(int, read().split()))
answer = 0
for _ in range(m):
    s, e = map(int, read().split())
    answer += bisect_right(t, e)-bisect_left(t, s)
print(answer)`,
  }),
  definePastExamLesson("a361", {
    concept: "前綴和・整數比例的 lower_bound",
    goal: "將區間比例轉成整數門檻，在嚴格遞增的前綴和中找第一個達標位置。",
    explanation: [
      "令 P[i] 為前 i 個權重和，區間總重 T=P[r]−P[l−1]。切點條件是 (P[k]−P[l−1])×(a+b)≥T×a，因此需要的整數重量為 ceil(T×a/(a+b))。用 (T×a+a+b−1)/(a+b) 的整數除法取得門檻，完全不需要浮點數。",
      "在 P[l] 到 P[r] 間找第一個不小於 P[l−1]+門檻的位置。所有權重皆正，P 嚴格遞增，所以二分搜尋的結果正是最小合法索引，也保證前一格尚未達標。先花一次線性時間建立 P，就能讓每次詢問只花對數時間。",
    ],
    complexity: "時間 O(N+M log N)，空間 O(N)；比例乘積用 64 位元整數。",
    pitfall: "比例恰好相等時就要停下來，應找第一個 ≥ 門檻的位置，不能找嚴格大於。",
    traceLabel: "第一個公開範例：2、2、6、3、1、5，比例 1:1",
    trace: [
      { title: "建立前綴和", description: "每格記錄從第一個權重累加到目前的值。", cells: ["2", "4", "10", "13", "14", "19"], variables: [["總和", "19"]] },
      { title: "換算整數門檻", description: "至少要達到 19/2，整數重量門檻是 10。", cells: ["目標 9.5", "ceil=10"], active: [1], variables: [["搜尋值", "10"]] },
      { title: "找到第一個達標點", description: "前兩格和為 4 未達標，第三格和為 10，輸出索引 3。", cells: ["2", "4", "10", "13", "14", "19"], active: [2], variables: [["k", "3"]] },
    ],
    cpp: String.raw`#include <bits/stdc++.h>
using namespace std;
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, m;
    cin >> n >> m;
    vector<long long> prefix(n + 1);
    for (int i = 1; i <= n; ++i) {
        int w;
        cin >> w;
        prefix[i] = prefix[i - 1] + w;
    }
    while (m--) {
        int l, r, a, b;
        cin >> l >> r >> a >> b;
        long long total = prefix[r] - prefix[l - 1];
        long long target = prefix[l - 1] + (total * a + a + b - 1) / (a + b);
        auto it = lower_bound(prefix.begin() + l, prefix.begin() + r + 1, target);
        cout << it - prefix.begin() << '\n';
    }
}`,
    python: String.raw`import sys
from bisect import bisect_left
it = iter(map(int, sys.stdin.buffer.read().split()))
n, m = next(it), next(it)
prefix = [0]
for _ in range(n):
    prefix.append(prefix[-1] + next(it))
answer = []
for _ in range(m):
    l, r, a, b = [next(it) for _ in range(4)]
    total = prefix[r] - prefix[l-1]
    target = prefix[l-1] + (total*a + a+b-1)//(a+b)
    answer.append(str(bisect_left(prefix, target, l, r+1)))
print('\n'.join(answer))`,
  }),
  definePastExamLesson("a362", {
    concept: "有限規則模擬・非對稱得分",
    goal: "逐輪判定勝負，再按雙方各自的拳種計分。",
    explanation: [
      "用三組有序對 (0,2)、(2,5)、(5,0) 記錄 A 勝 B 的情形。拳種的分數幅度是剪刀 2 分，其餘 1 分，因此一輪的兩人得分未必互為相反數，必須分別計算。",
      "先處理平手：都出剪刀時兩人各扣 2，其他平手不變。非平手再依勝負，勝方加上自己的幅度、敗方扣掉自己的幅度。每輪只影響目前兩個累計值，照順序更新就等同題目的計分過程。",
    ],
    complexity: "時間 O(n)，額外空間 O(1)；Python 輸入緩衝 O(n)。",
    pitfall: "不能只算 A 再把 B 設為負值；例如剪刀敗給石頭時是 −2 與 +1。",
    traceLabel: "公開範例的四輪計分",
    trace: [
      { title: "布勝石頭", description: "第一輪 5 對 0，A 加 1，B 扣 1。", cells: ["A：布", "B：石頭"], variables: [["A,B", "1,−1"]] },
      { title: "剪刀敗給石頭", description: "第二輪 A 扣 2、B 加 1，累計變成 −1、0。", cells: ["A：剪刀", "B：石頭"], variables: [["A,B", "−1,0"]] },
      { title: "布敗給剪刀", description: "第三輪 A 扣 1、B 加 2。", cells: ["A：布", "B：剪刀"], variables: [["A,B", "−2,2"]] },
      { title: "剪刀平手也扣分", description: "第四輪兩人各扣 2，輸出 −4 0。", cells: ["A：剪刀", "B：剪刀"], active: [0, 1], variables: [["A,B", "−4,0"]] },
    ],
    cpp: String.raw`#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, scoreA = 0, scoreB = 0;
    cin >> n;
    while (n--) {
        int a, b;
        cin >> a >> b;
        int valueA = (a == 2 ? 2 : 1);
        int valueB = (b == 2 ? 2 : 1);
        if (a == b) {
            if (a == 2) {
                scoreA -= 2;
                scoreB -= 2;
            }
        } else if ((a == 0 && b == 2) || (a == 2 && b == 5) || (a == 5 && b == 0)) {
            scoreA += valueA;
            scoreB -= valueB;
        } else {
            scoreA -= valueA;
            scoreB += valueB;
        }
    }
    cout << scoreA << ' ' << scoreB << '\n';
}`,
    python: String.raw`import sys
it = iter(map(int, sys.stdin.buffer.read().split()))
n = next(it)
score_a = score_b = 0
wins = {(0, 2), (2, 5), (5, 0)}
for _ in range(n):
    a, b = next(it), next(it)
    va, vb = (2 if a == 2 else 1), (2 if b == 2 else 1)
    if a == b:
        if a == 2:
            score_a -= 2
            score_b -= 2
    elif (a, b) in wins:
        score_a += va
        score_b -= vb
    else:
        score_a -= va
        score_b += vb
print(score_a, score_b)`,
  }),
  definePastExamLesson("a363", {
    concept: "狀態模擬・操作順序與負數取整",
    goal: "忠實更新疲勞度與成效，在每次活動後套用疲勞規則。",
    explanation: [
      "用 F、E 保存唯一需要的狀態。先執行活動本身，再把負疲勞改成 0，最後檢查是否超過 100；一旦超過就把 F、E 都歸零，但仍繼續執行後續活動。疲勞剛好 100 不觸發歸零。",
      "活動 7 將成效換成原值的九成並捨去小數。題面只限制疲勞不為負，成效可能因活動 5 變成負數，因此 Python 用整數算術明確實作朝零捨去小數，與 C++ 的整數除法一致。所有更新都只依上一狀態，逐項模擬即得到最後成效。",
    ],
    complexity: "時間 O(n)，額外空間 O(1)；Python 輸入儲存 O(n)。",
    pitfall: "活動 6 是 E 歸零而非扣固定值；活動 7 處理負 E 時不要把 Python 的向下整除當成捨去小數。",
    traceLabel: "公開範例：1、6、2、3、5、4、7",
    trace: [
      { title: "活動 1、6", description: "先到 (25,10)，再減 35 疲勞且成效歸零，疲勞修正為 0。", cells: ["活動1", "活動6"], active: [1], variables: [["F", "0"], ["E", "0"]] },
      { title: "活動 2、3、5", description: "依序變為 (10,20)、(15,35)、(5,20)。", cells: ["2：(10,20)", "3：(15,35)", "5：(5,20)"], active: [2], variables: [["F,E", "5,20"]] },
      { title: "活動 4、7", description: "活動 4 得到 (9,40)，活動 7 清疲勞並讓成效成為 36。", cells: ["4：(9,40)", "7：(0,36)"], active: [1], variables: [["輸出 E", "36"]] },
    ],
    cpp: String.raw`#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, fatigue = 0, effect = 0;
    cin >> n;
    int df[] = {0, 25, 10, 5, 4, -10, -35};
    int de[] = {0, 10, 20, 15, 20, -15, 0};
    while (n--) {
        int activity;
        cin >> activity;
        if (activity == 7) {
            fatigue = 0;
            effect = effect * 9 / 10;
        } else {
            fatigue += df[activity];
            if (activity == 6)
                effect = 0;
            else
                effect += de[activity];
        }
        fatigue = max(0, fatigue);
        if (fatigue > 100)
            fatigue = effect = 0;
    }
    cout << effect << '\n';
}`,
    python: String.raw`import sys
data = list(map(int, sys.stdin.buffer.read().split()))
fatigue = effect = 0
df = [0, 25, 10, 5, 4, -10, -35]
de = [0, 10, 20, 15, 20, -15, 0]
for activity in data[1:1+data[0]]:
    if activity == 7:
        fatigue = 0
        effect = (1 if effect >= 0 else -1) * (abs(effect)*9//10)
    else:
        fatigue += df[activity]
        effect = 0 if activity == 6 else effect+de[activity]
    fatigue = max(0, fatigue)
    if fatigue > 100:
        fatigue = effect = 0
print(effect)`,
  }),
  definePastExamLesson("a364", {
    concept: "總和與最大值・商餘數",
    goal: "只扣掉一包最大糖果，以整數除法計算每人份量與最小餘缺量。",
    explanation: [
      "掃描所有糖果包，計算總和 S 與最大值 K。老師只保留一包，所以可分糖果是 S−K，即使有多包同樣最大，也不能把它們都扣除。",
      "將 S−K 除以 m，商 A 是每人原本拿的顆數，餘數 r 是剩下顆數。留下 r 顆與補上 m−r 顆是兩種調整方式，題目要求輸出較小量 R=min(r,m−r)。只改 R 的表示方式，不會因選擇補糖而把 A 加一。",
    ],
    complexity: "時間 O(n)，額外空間 O(1)；Python 輸入陣列 O(n)。",
    pitfall: "r 超過一半時仍輸出原商 A；n=m=1 時剩餘糖果、A、R 都是 0。",
    traceLabel: "公開範例糖果總和 95，最大包 13",
    trace: [
      { title: "只留一包", description: "雖然 13 有兩包，仍只扣掉一包，剩 82 顆。", cells: ["總數 95", "保留 13", "可分 82"], active: [2], variables: [["K", "13"]] },
      { title: "分給 8 人", description: "82=8×10+2，剩下 2 顆沒有超過半數 4，輸出 R=2。", cells: ["82÷8", "商 10", "餘 2"], variables: [["K,A,R", "13,10,2"]] },
      { title: "改分給 6 人", description: "82=6×13+4，餘 4 超過半數，因此 R=6−4=2；A 仍為 13。", cells: ["82=6×13+4", "R=min(4,2)=2"], active: [1], variables: [["K,A,R", "13,13,2"]] },
    ],
    cpp: String.raw`#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, m, total = 0, largest = 0;
    cin >> n >> m;
    for (int i = 0; i < n; ++i) {
        int x;
        cin >> x;
        total += x;
        largest = max(largest, x);
    }
    int available = total - largest;
    int share = available / m, remainder = available % m;
    cout << largest << ' ' << share << ' ' << min(remainder, m - remainder) << '\n';
}`,
    python: String.raw`import sys
data = list(map(int, sys.stdin.buffer.read().split()))
n, m = data[:2]
bags = data[2:2+n]
largest = max(bags)
share, remainder = divmod(sum(bags)-largest, m)
print(largest, share, min(remainder, m-remainder))`,
  }),
  definePastExamLesson("a365", {
    concept: "雙堆疊不變量・樹狀陣列",
    goal: "把兩個堆疊視為原排列上的游標，以存活元素數計算必要的 pop。",
    explanation: [
      "從 S1 底到頂，再接 S2 頂到底，永遠是原排列刪除已輸出元素後的順序。把兩堆疊的交界看成游標：轉移堆頂就是讓游標跨過一個尚存元素，成本 1；正式輸出也是 1。要輸出下一個值 x，必須跨過游標與 x 之間的全部尚存元素，額外繞路只會增加成本。",
      "預先記錄每個值的原始位置 pos[x]，樹狀陣列起初每格為 1，輸出後將該位置減一。令 L 為上一輸出位置以前的尚存數，R 為目前目標位置以前含目標的尚存數；往右的轉移數是 R−L−1，往左是 L−R。再加上正式取出的 1，更新游標位置即可。",
      "每回合都達到跨越必要障礙的下界，且取出 x 後的交界固定，因此把每次最少成本相加就是全域最少 pop。樹狀陣列讓每次查詢與刪除都只需 O(log n)。",
    ],
    complexity: "時間 O(n log n)，空間 O(n)。",
    pitfall: "計數的是仍存在的元素而非原索引差；正式取出也算一次 pop，初始入堆不算。",
    traceLabel: "第二個公開範例：S2 由頂至底為 3、2、4、1",
    trace: [
      { title: "尋找 1", description: "把 3、2、4 移到 S1，再取出 1，共 4 次 pop。", cells: ["S1底→頂：3,2,4", "S2：空", "輸出：1"], variables: [["累計", "4"]] },
      { title: "尋找 2", description: "把 S1 頂的 4 移回 S2，再取出 2，增加 2。", cells: ["S1：3", "S2：4", "輸出：1,2"], variables: [["累計", "6"]] },
      { title: "取出 3 與 4", description: "兩者接著都已在堆頂，各需一次，總成本 8。", cells: ["S1：空", "S2：空", "輸出：1,2,3,4"], active: [2], variables: [["累計", "8"]] },
    ],
    cpp: String.raw`#include <bits/stdc++.h>
using namespace std;
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    vector<int> pos(n + 1), bit(n + 1);
    for (int i = 1, x; i <= n; ++i) {
        cin >> x;
        pos[x] = i;
        bit[i] = i & -i;
    }
    auto prefix = [&](int i) {
        int sum = 0;
        for (; i > 0; i -= i & -i)
            sum += bit[i];
        return sum;
    };
    int cursor = 0;
    long long answer = 0;
    for (int x = 1; x <= n; ++x) {
        int target = pos[x];
        int left = prefix(cursor), rank = prefix(target);
        answer += 1LL + (target > cursor ? rank - left - 1 : left - rank);
        for (int i = target; i <= n; i += i & -i)
            --bit[i];
        cursor = target;
    }
    cout << answer << '\n';
}`,
    python: String.raw`import sys
data = list(map(int, sys.stdin.buffer.read().split()))
n = data[0]
pos = [0]*(n+1)
for i, x in enumerate(data[1:], 1):
    pos[x] = i
bit = [i & -i for i in range(n+1)]
def prefix(i):
    total = 0
    while i:
        total += bit[i]
        i -= i & -i
    return total
cursor = answer = 0
for x in range(1, n+1):
    target = pos[x]
    left, rank = prefix(cursor), prefix(target)
    answer += 1 + (rank-left-1 if target > cursor else left-rank)
    i = target
    while i <= n:
        bit[i] -= 1
        i += i & -i
    cursor = target
print(answer)`,
  }),
  definePastExamLesson("a366", {
    concept: "答案二分搜尋・子集合最早完成 DP",
    goal: "固定閒置間隔後，用每個任務子集合的最早完成時間判斷排程可行性。",
    explanation: [
      "猜測間隔 G，令 dp[mask] 表示完成 mask 內全部任務的最早時刻。第一項任務沒有前置間隔；其他任務 j 的最早開工為 max(s[j],dp[mask]+G)，完工再加 t[j]，只有不超過 d[j] 才可轉移。",
      "同一子集合若有兩種排程，較早完成者一定能等待到較晚者的時間，再採取相同後續排程，因此只保留最早時刻不會丟失可行解。枚舉每個尚未執行的任務，就是枚舉全部可能次序，但把相同子集合的結果合併。",
      "若 G 可行，更小的 G 也一定可行。所有時刻不超過 1000，用 0 為已知可行下界、1001 為不可行上界二分，即可找最大整數間隔。N≤8，子集合最多 256 個，無須逐一枚舉 N! 排列。",
    ],
    complexity: "時間 O(N·2ᴺ·log 1001)，空間 O(2ᴺ+N)。",
    pitfall: "截止時間限制的是完工時刻；第一個任務之前不需要 G 的空檔。",
    traceLabel: "第一個公開範例：任務 (s,d,t)=(1,9,3)、(3,20,4)、(4,15,2)",
    trace: [
      { title: "測試 G=5，先做任務 1", description: "時刻 1 開工、4 完工，滿足截止 9。", cells: ["1：[1,4]", "等待 [4,9]"], variables: [["dp[{1}]", "4"]] },
      { title: "接著任務 3", description: "最早在 max(4,4+5)=9 開工、11 完工，滿足截止 15。", cells: ["1：[1,4]", "3：[9,11]"], active: [1], variables: [["dp[{1,3}] 的候選", "11"]] },
      { title: "最後任務 2", description: "16 開工、20 完工，剛好在期限內。", cells: ["1：[1,4]", "3：[9,11]", "2：[16,20]"], active: [2], variables: [["G=5", "可行"]] },
      { title: "排除 G=6", description: "任務 2 或 3 先做都會讓任務 1 超過期限 9；1 先做後，若接 3、2 最早 22 完工，若接 2、3 則任務 3 最早 22 完工，兩者都逾期。", cells: ["1：[1,4]", "3：[10,12]", "2：[18,22]"], active: [2], variables: [["最大 G", "5"]] },
    ],
    cpp: String.raw`#include <bits/stdc++.h>
using namespace std;
int main() {
    int n;
    cin >> n;
    vector<int> s(n), d(n), duration(n);
    for (int i = 0; i < n; ++i)
        cin >> s[i] >> d[i] >> duration[i];
    auto feasible = [&](int gap) {
        vector<int> dp(1 << n, 1000000);
        dp[0] = 0;
        for (int mask = 0; mask < (1 << n); ++mask) {
            if (dp[mask] == 1000000)
                continue;
            for (int j = 0; j < n; ++j) {
                if (mask & (1 << j))
                    continue;
                int start = max(s[j], dp[mask] + (mask ? gap : 0));
                int finish = start + duration[j];
                if (finish <= d[j]) {
                    int next = mask | (1 << j);
                    dp[next] = min(dp[next], finish);
                }
            }
        }
        return dp.back() < 1000000;
    };
    int lo = 0, hi = 1001;
    while (lo + 1 < hi) {
        int mid = (lo + hi) / 2;
        if (feasible(mid))
            lo = mid;
        else
            hi = mid;
    }
    cout << lo << '\n';
}`,
    python: String.raw`import sys
it = iter(map(int, sys.stdin.buffer.read().split()))
n = next(it)
jobs = [(next(it), next(it), next(it)) for _ in range(n)]
def feasible(gap):
    dp = [10**9]*(1 << n)
    dp[0] = 0
    for mask in range(1 << n):
        if dp[mask] == 10**9:
            continue
        for j, (s, d, duration) in enumerate(jobs):
            if mask & (1 << j):
                continue
            finish = max(s, dp[mask] + (gap if mask else 0)) + duration
            if finish <= d:
                nxt = mask | (1 << j)
                dp[nxt] = min(dp[nxt], finish)
    return dp[-1] < 10**9
lo, hi = 0, 1001
while lo+1 < hi:
    mid = (lo+hi)//2
    if feasible(mid):
        lo = mid
    else:
        hi = mid
print(lo)`,
  }),
  definePastExamLesson("a367", {
    concept: "多維狀態 DP・混合進位編碼",
    goal: "用每個堆疊已移除件數表示狀態，枚舉所有合法頂端配對。",
    explanation: [
      "每次只能移除堆頂，所以堆疊 i 的剩餘內容由已移除件數 p[i] 唯一決定。狀態 (p[0],…,p[k−1]) 最多有 S=∏(n[i]+1) 種。枚舉兩個不同且未空的堆疊，頂端字母相同時，得分為兩件分數加上移除後狀態的最優值。",
      "每一步恰刪兩件物品，狀態不可能形成循環。所有合法第一步都被枚舉，接上子狀態最優解，故記憶化搜尋可求最優值；沒有可配對時回傳 0。物品分數皆正，因此不需要因怕扣分而提早停止。",
      "把狀態編成混合進位整數，移除一件就加該位權重。最多 13⁶=4,826,809 格，每格用 16 位元整數快取，約需 9.7 MB。另計算分數上界：某字母剩 T 件、單堆最多 H 件，至少 max(T mod 2,2H−T) 件不能配對，扣除這些件數乘上該字母全體最低分。若已達安全上界就停止枚舉，可避免大量相同字母時展開所有狀態。",
    ],
    complexity: "字母種類 L≤26、S=∏(nᵢ+1)≤13⁶；時間 O((k²+kL)·S)，空間 O(S+L·Σ(nᵢ+1))；遞迴深度至多 36。",
    pitfall: "不能只要遇到同字母就立即固定配對；不同配對可能露出不同堆頂，影響後續總分。",
    traceLabel: "第一個公開範例：三堆頂端依序為 ABC、BAA、ABC",
    trace: [
      { title: "初始唯一 A 配對", description: "堆 1 與堆 3 的 A 各 1 分，先取得 2 分。", cells: ["1：A1 B2 C1", "2：B2 A2 A1", "3：A1 B1 C1"], active: [0, 2], variables: [["p", "(0,0,0)→(1,0,1)"], ["已得", "2"]] },
      { title: "比較 B 的選擇", description: "此時三堆都是 B。配 1、2 得 4 分但隨後無法繼續；配 1、3 得 3 分且露出兩個 C。", cells: ["1：B2 C1", "2：B2 A2 A1", "3：B1 C1"], active: [0, 2], variables: [["選擇", "配堆 1、3"]] },
      { title: "再配兩個 C", description: "兩個 C 各 1 分，總分 2+3+2=7，優於先配 B2 與 B2 的 6 分。", cells: ["1：空", "2：B2 A2 A1", "3：空"], active: [0, 2], variables: [["最優總分", "7"]] },
    ],
    cpp: String.raw`#include <bits/stdc++.h>
using namespace std;
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int k;
    cin >> k;
    vector<int> length(k), stride(k);
    vector<vector<char>> letter(k);
    vector<vector<int>> score(k);
    vector<vector<int>> suffix(k);
    vector<vector<array<int, 26>>> frequency(k);
    vector<int> minimum(26, 11);
    int states = 1;
    for (int i = 0; i < k; ++i) {
        cin >> length[i];
        stride[i] = states;
        states *= length[i] + 1;
        letter[i].resize(length[i]);
        score[i].resize(length[i]);
        for (int j = 0; j < length[i]; ++j) {
            cin >> letter[i][j] >> score[i][j];
            minimum[letter[i][j] - 'A'] = min(minimum[letter[i][j] - 'A'], score[i][j]);
        }
        suffix[i].assign(length[i] + 1, 0);
        frequency[i].resize(length[i] + 1);
        for (int j = length[i] - 1; j >= 0; --j) {
            suffix[i][j] = suffix[i][j + 1] + score[i][j];
            frequency[i][j] = frequency[i][j + 1];
            ++frequency[i][j][letter[i][j] - 'A'];
        }
    }
    vector<short> memo(states, -1);
    function<int(int)> solve = [&](int state) {
        if (memo[state] != -1)
            return (int)memo[state];
        vector<int> pos(k);
        int value = state;
        int upper = 0;
        array<int, 26> total{}, most{};
        for (int i = 0; i < k; ++i) {
            pos[i] = value % (length[i] + 1);
            value /= length[i] + 1;
            upper += suffix[i][pos[i]];
            for (int ch = 0; ch < 26; ++ch) {
                int count = frequency[i][pos[i]][ch];
                total[ch] += count;
                most[ch] = max(most[ch], count);
            }
        }
        for (int ch = 0; ch < 26; ++ch)
            upper -= max(total[ch] % 2, 2 * most[ch] - total[ch]) * minimum[ch];
        int best = 0;
        for (int i = 0; i < k; ++i) {
            if (pos[i] == length[i])
                continue;
            for (int j = i + 1; j < k; ++j) {
                if (pos[j] == length[j] || letter[i][pos[i]] != letter[j][pos[j]])
                    continue;
                int gain = score[i][pos[i]] + score[j][pos[j]];
                best = max(best, gain + solve(state + stride[i] + stride[j]));
                if (best == upper) {
                    memo[state] = best;
                    return best;
                }
            }
        }
        memo[state] = best;
        return best;
    };
    cout << solve(0) << '\n';
}`,
    python: String.raw`import sys
from array import array
tokens = iter(sys.stdin.buffer.read().split())
k = int(next(tokens))
length, stride, letters, scores = [], [], [], []
suffix = []
minimum = [11]*26
states = 1
for _ in range(k):
    size = int(next(tokens))
    length.append(size)
    stride.append(states)
    states *= size+1
    chars, values = [], []
    for _ in range(size):
        letter = next(tokens)[0]-65
        value = int(next(tokens))
        chars.append(letter)
        values.append(value)
        minimum[letter] = min(minimum[letter], value)
    letters.append(chars)
    scores.append(values)
    sums = [0]*(size+1)
    for j in range(size-1, -1, -1):
        sums[j] = sums[j+1]+values[j]
    suffix.append(sums)
alphabet = sorted({ch for stack in letters for ch in stack})
letter_index = {ch: i for i, ch in enumerate(alphabet)}
frequency = []
for chars in letters:
    table = [[0]*len(alphabet) for _ in range(len(chars)+1)]
    for j in range(len(chars)-1, -1, -1):
        table[j] = table[j+1].copy()
        table[j][letter_index[chars[j]]] += 1
    frequency.append(table)
memo = array('h', [-1])*states
def solve(state):
    cached = memo[state]
    if cached != -1:
        return cached
    value = state
    pos = []
    upper = 0
    total = [0]*len(alphabet)
    most = [0]*len(alphabet)
    for i, size in enumerate(length):
        value, p = divmod(value, size+1)
        pos.append(p)
        upper += suffix[i][p]
        for ch, count in enumerate(frequency[i][p]):
            total[ch] += count
            if count > most[ch]:
                most[ch] = count
    for ch, letter in enumerate(alphabet):
        lost = max(total[ch] % 2, 2*most[ch]-total[ch])
        upper -= lost*minimum[letter]
    best = 0
    for i in range(k):
        if pos[i] == length[i]:
            continue
        for j in range(i+1, k):
            if pos[j] == length[j] or letters[i][pos[i]] != letters[j][pos[j]]:
                continue
            gain = scores[i][pos[i]] + scores[j][pos[j]]
            best = max(best, gain+solve(state+stride[i]+stride[j]))
            if best == upper:
                memo[state] = best
                return best
    memo[state] = best
    return best
print(solve(0))`,
  }),
  definePastExamLesson("a368", {
    concept: "矩陣座標・旋轉與形狀檢查",
    goal: "依序產生四種旋轉，僅比較尺寸相同的方向並計數相等像素。",
    explanation: [
      "固定 A，旋轉 B 即可涵蓋所有相對方向。順時針旋轉的映射為原 B[i][j] 放到新矩陣 [j][舊列數−1−i]，因此新尺寸由 R×C 變成 C×R；連續做四次就回到原方向。",
      "每個方向先檢查尺寸，尺寸不同的相似度直接是 0。尺寸相同時掃描對應位置，累計相等數 S。四種方向的分母都是 R×C，因此只要保留最大的 S，最後用整數除法 100×S/(R×C) 輸出百分比，等同先計每個方向再取最大。",
    ],
    complexity: "時間 O(RC)，空間 O(RC)；旋轉與比較各至多四次。",
    pitfall: "非正方形旋轉 90 或 270 度後尺寸不同，不能把展平後的元素直接對照。",
    traceLabel: "示意：A=[[1,2],[3,4]]，B=[[3,1],[4,2]]",
    trace: [
      { title: "原方向", description: "四個對應位置均不相同，匹配數 0。", cells: ["A：1 2 / 3 4", "B：3 1 / 4 2"], variables: [["角度", "0°"], ["S", "0"]] },
      { title: "順時針再轉 90 度", description: "B 變成 [[4,3],[2,1]]，仍沒有相等位置。", cells: ["4 3", "2 1"], variables: [["相對角度", "90°"], ["S", "0"]] },
      { title: "轉到 270 度", description: "第三次旋轉後 B 回到 [[1,2],[3,4]]，四格完全相同。", cells: ["1 2", "3 4"], active: [0, 1], variables: [["S", "4"], ["輸出", "100%"]] },
    ],
    cpp: String.raw`#include <bits/stdc++.h>
using namespace std;
int main() {
    int r, c;
    cin >> r >> c;
    vector<vector<int>> a(r, vector<int>(c)), b = a;
    for (auto &row : a)
        for (int &x : row)
            cin >> x;
    for (auto &row : b)
        for (int &x : row)
            cin >> x;
    int best = 0;
    for (int turn = 0; turn < 4; ++turn) {
        int rows = b.size(), cols = b[0].size();
        if (rows == r && cols == c) {
            int same = 0;
            for (int i = 0; i < r; ++i)
                for (int j = 0; j < c; ++j)
                    same += (a[i][j] == b[i][j]);
            best = max(best, same);
        }
        vector<vector<int>> rotated(cols, vector<int>(rows));
        for (int i = 0; i < rows; ++i)
            for (int j = 0; j < cols; ++j)
                rotated[j][rows - 1 - i] = b[i][j];
        b = move(rotated);
    }
    cout << 100 * best / (r * c) << "%\n";
}`,
    python: String.raw`import sys
it = iter(map(int, sys.stdin.buffer.read().split()))
r, c = next(it), next(it)
a = [[next(it) for _ in range(c)] for _ in range(r)]
b = [[next(it) for _ in range(c)] for _ in range(r)]
best = 0
for _ in range(4):
    if len(b) == r and len(b[0]) == c:
        same = sum(a[i][j] == b[i][j] for i in range(r) for j in range(c))
        best = max(best, same)
    b = [list(row) for row in zip(*b[::-1])]
print(str(100*best//(r*c))+'%')`,
  }),
  definePastExamLesson("a369", {
    concept: "最大間距分群・Kruskal 與並查集",
    goal: "優先合併近距離物品，剩 K 組後找第一條跨組邊。",
    explanation: [
      "如果希望所有跨組距離至少 X，距離小於 X 的每一對物品都必須同組，連帶使這些短邊的連通元件不可拆開。這個必要條件也是充分條件：只要短邊元件數至少 K，就能把元件合成恰好 K 組，而且不會出現小於 X 的跨組邊。",
      "將所有不重複物品對依距離排序，用並查集從 N 組開始，遇到跨元件邊就合併，直到剩 K 組。接下來遇到的第一條跨組邊，距離就是目前分組的最小組間距離。若想取得更大品質，就必須把這條邊也合併，元件會降到 K−1，無法再形成 K 個非空組，所以該值已最優。",
      "相同權重可任意順序處理，不影響最終答案權重。K=N 時不做任何合併，答案就是所有不同物品對中的最小距離。",
    ],
    complexity: "E=N(N−1)/2；時間 O(N²+E log E)，空間 O(E+N)。",
    pitfall: "品質只比較不同組的物品；要在剩 K 組時找下一條跨組邊，而不是輸出剛合併的那條。",
    traceLabel: "第一個公開範例：距離 D(1,3)=1、D(1,2)=2、D(2,3)=3，K=2",
    trace: [
      { title: "三個單點元件", description: "依距離排序為 (1,3,1)、(1,2,2)、(2,3,3)。", cells: ["{1}", "{2}", "{3}"], variables: [["元件數", "3"]] },
      { title: "合併最近的 1、3", description: "距離 1 的兩點合併，正好剩 2 組。", cells: ["{1,3}", "{2}"], active: [0], variables: [["元件數", "2"]] },
      { title: "下一條跨組邊", description: "1 與 2 距離為 2，是目前最短跨組邊；若要求大於 2，只能把兩組再合併而違反 K=2。", cells: ["{1,3}", "距離 2", "{2}"], active: [1], variables: [["最大品質", "2"]] },
    ],
    cpp: String.raw`#include <bits/stdc++.h>
using namespace std;
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, k;
    cin >> n >> k;
    vector<tuple<int, int, int>> edges;
    for (int i = 0; i < n; ++i) {
        for (int j = 0, d; j < n; ++j) {
            cin >> d;
            if (i < j)
                edges.emplace_back(d, i, j);
        }
    }
    sort(edges.begin(), edges.end());
    vector<int> parent(n), size(n, 1);
    iota(parent.begin(), parent.end(), 0);
    function<int(int)> find = [&](int x) {
        while (x != parent[x]) {
            parent[x] = parent[parent[x]];
            x = parent[x];
        }
        return x;
    };
    int groups = n;
    for (auto [d, u, v] : edges) {
        u = find(u);
        v = find(v);
        if (u == v)
            continue;
        if (groups == k) {
            cout << d << '\n';
            break;
        }
        if (size[u] < size[v])
            swap(u, v);
        parent[v] = u;
        size[u] += size[v];
        --groups;
    }
}`,
    python: String.raw`import sys
read = sys.stdin.buffer.readline
n, k = map(int, read().split())
edges = []
for i in range(n):
    row = list(map(int, read().split()))
    edges.extend((row[j], i, j) for j in range(i+1, n))
edges.sort()
parent = list(range(n))
size = [1]*n
def find(x):
    while parent[x] != x:
        parent[x] = parent[parent[x]]
        x = parent[x]
    return x
groups = n
for d, u, v in edges:
    u, v = find(u), find(v)
    if u == v:
        continue
    if groups == k:
        print(d)
        break
    if size[u] < size[v]:
        u, v = v, u
    parent[v] = u
    size[u] += size[v]
    groups -= 1`,
  }),
  definePastExamLesson("a370", {
    concept: "最小堆積・惰性刪除與雙向鏈結",
    goal: "依沙包數與編號取最小關卡，快速找到右側下一個未完成關卡。",
    explanation: [
      "最小堆積儲存 (沙包數,編號)，自然實作題目的兩層優先順序。關卡收到沙包後重量改變，將新版資料放進堆積即可；彈出時若關卡已完成，或紀錄重量不是目前重量，就丟棄舊紀錄，稱為惰性刪除。",
      "另用陣列維護每個存活關卡的前驅與後繼。搬完 i 時，在 O(1) 時間把 i 從鏈結移除；搬運的接收者就是刪除前的後繼，若沒有後繼則直接搬出場外。更新接收者重量並放入堆積，累計本次重量為分數。",
      "每回合取出的都是目前最少沙包且編號最小的關卡，因此過程完全符合指定規則。若這個最小值已超過 t，其他關卡更不可能搬動，可立即停止。每完成一關至多新增一筆堆積資料，總紀錄數為 O(n)。",
    ],
    complexity: "時間 O(n log n)，空間 O(n)；沙包累計與總分使用 64 位元整數。",
    pitfall: "已完成關卡永遠不能再接收沙包；要找右側下一個仍存活的關卡，而非原始編號 i+1。",
    traceLabel: "第一個公開範例：4、4、2、1、9、3，上限 8",
    trace: [
      { title: "先搬最小的第 4 關", description: "1 顆搬到第 5 關，該關變成 10；得 1 分。", cells: ["1:4", "2:4", "3:2", "4:完成", "5:10", "6:3"], active: [3, 4], variables: [["總分", "1"]] },
      { title: "第 3 關跳過已完成關卡", description: "2 顆直接搬到第 5 關，使其變 12；接著第 6 關 3 顆搬出場外。", cells: ["1:4", "2:4", "3:完成", "4:完成", "5:12", "6:完成"], active: [2, 5], variables: [["總分", "1+2+3=6"]] },
      { title: "同重量優先編號小者", description: "第 1 關先搬 4 顆給第 2 關，使第 2 關變成 8；再搬 8 顆給第 5 關。", cells: ["1:完成", "2:完成", "5:20"], active: [0, 1], variables: [["總分", "6+4+8=18"]] },
      { title: "最小關卡也超限", description: "只剩第 5 關 20 顆，大於 8，挑戰停止。", cells: ["5:20 > 8"], active: [0], variables: [["輸出", "18"]] },
    ],
    cpp: String.raw`#include <bits/stdc++.h>
using namespace std;
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    long long limit;
    cin >> n >> limit;
    vector<long long> weight(n);
    vector<int> previous(n), next(n);
    vector<char> alive(n, true);
    using Entry = pair<long long, int>;
    priority_queue<Entry, vector<Entry>, greater<Entry>> heap;
    for (int i = 0; i < n; ++i) {
        cin >> weight[i];
        previous[i] = i - 1;
        next[i] = i + 1;
        heap.emplace(weight[i], i);
    }
    long long answer = 0;
    while (!heap.empty()) {
        auto [w, i] = heap.top();
        heap.pop();
        if (!alive[i] || weight[i] != w)
            continue;
        if (w > limit)
            break;
        answer += w;
        alive[i] = false;
        int left = previous[i], right = next[i];
        if (left >= 0)
            next[left] = right;
        if (right < n) {
            previous[right] = left;
            weight[right] += w;
            heap.emplace(weight[right], right);
        }
    }
    cout << answer << '\n';
}`,
    python: String.raw`import sys
from heapq import heapify, heappop, heappush
it = iter(map(int, sys.stdin.buffer.read().split()))
n, limit = next(it), next(it)
weight = [next(it) for _ in range(n)]
previous = [i-1 for i in range(n)]
nxt = [i+1 for i in range(n)]
alive = bytearray([1])*n
heap = [(w, i) for i, w in enumerate(weight)]
heapify(heap)
answer = 0
while heap:
    w, i = heappop(heap)
    if not alive[i] or weight[i] != w:
        continue
    if w > limit:
        break
    answer += w
    alive[i] = 0
    left, right = previous[i], nxt[i]
    if left >= 0:
        nxt[left] = right
    if right < n:
        previous[right] = left
        weight[right] += w
        heappush(heap, (weight[right], right))
print(answer)`,
  }),
  definePastExamLesson("a371", {
    concept: "排序貪心・中位數與前綴最小值",
    goal: "將選人問題化為兩個互不重疊的長度 K 連續視窗。",
    explanation: [
      "一組人的絕對距離和在中位數處最小。先把所有座標排序；若兩組參加者交錯，可按兩個會議位置由左到右，把較左的人分給左會議、較右的人分給右會議，交換交錯配對不會增加距離。因此存在一個最優解，左組全部在右組之前。",
      "對固定的左右分界與會議位置，某一側選 K 位最近的人可以取為排序上的連續 K 人；再把會議位置改成這 K 人的中位數只會更好。於是只需找兩個不重疊的長度 K 視窗。用座標前綴和，可以 O(1) 計算每個視窗到中位數的距離總和。",
      "令 cost[i] 是從 i 開始的視窗成本，best[i] 為起點不超過 i 的最小成本。右視窗從 j 開始時，左視窗起點最多 j−K，因此候選為 cost[j]+best[j−K]。掃過所有 j 即涵蓋每一種不重疊組合。",
    ],
    complexity: "時間 O(N log N)，排序後 O(N)；空間 O(N)。距離總和需 64 位元整數。",
    pitfall: "只挑成本最低的兩個視窗可能重疊；兩組不能選到同一個人，但不同人可以座標相同。",
    traceLabel: "第一個公開範例：排序座標 0、2、5、6、6、9，K=2",
    trace: [
      { title: "計算每個二人視窗", description: "二人組成本就是兩點間距，依序為 2、3、1、0、3。", cells: ["[0,2]:2", "[2,5]:3", "[5,6]:1", "[6,6]:0", "[6,9]:3"], variables: [["K", "2"]] },
      { title: "限制不能重疊", description: "最低的 0 與次低的 1 共用一位座標 6 的人，不能直接相加。", cells: ["[5,6]:1", "[6,6]:0"], active: [0, 1], variables: [["重疊", "同一人被選兩次"]] },
      { title: "使用前綴最佳", description: "右組選排序後第 4、5 人 [6,6]，左側最便宜為 [0,2] 成本 2，總和 2。", cells: ["左：[0,2]→成本2", "右：[6,6]→成本0"], active: [0, 1], variables: [["答案", "2"]] },
    ],
    cpp: String.raw`#include <bits/stdc++.h>
using namespace std;
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, k;
    cin >> n >> k;
    vector<long long> x(n), prefix(n + 1);
    for (auto &v : x)
        cin >> v;
    sort(x.begin(), x.end());
    for (int i = 0; i < n; ++i)
        prefix[i + 1] = prefix[i] + x[i];
    vector<long long> cost(n - k + 1), best(n - k + 1);
    for (int i = 0; i + k <= n; ++i) {
        int mid = i + k / 2, end = i + k;
        long long left = x[mid] * (mid - i) - (prefix[mid] - prefix[i]);
        long long right = prefix[end] - prefix[mid + 1] - x[mid] * (end - mid - 1);
        cost[i] = left + right;
        best[i] = (i ? min(best[i - 1], cost[i]) : cost[i]);
    }
    long long answer = LLONG_MAX;
    for (int j = k; j + k <= n; ++j)
        answer = min(answer, cost[j] + best[j - k]);
    cout << answer << '\n';
}`,
    python: String.raw`import sys
it = iter(map(int, sys.stdin.buffer.read().split()))
n, k = next(it), next(it)
x = sorted(next(it) for _ in range(n))
prefix = [0]
for value in x:
    prefix.append(prefix[-1]+value)
cost, best = [], []
for i in range(n-k+1):
    mid, end = i+k//2, i+k
    left = x[mid]*(mid-i)-(prefix[mid]-prefix[i])
    right = prefix[end]-prefix[mid+1]-x[mid]*(end-mid-1)
    value = left+right
    cost.append(value)
    best.append(min(best[-1], value) if best else value)
print(min(cost[j]+best[j-k] for j in range(k, n-k+1)))`,
  }),
  definePastExamLesson("a372", {
    concept: "距離重組・多重集合回溯",
    goal: "利用最大剩餘距離只產生兩個候選座標，列舉所有可行解的字典序極值。",
    explanation: [
      "N>1 時最大距離 L 必定是首尾距離，所以先放入 0、L，並從距離多重集合扣除一個 L。假設目前已放了一些點，最大未使用距離 d 一定涉及某個未放點與端點：若未放點最左為 u、最右為 v，所有未解釋距離都不超過 max(v,L−u)，而這兩個端點距離本身也還沒使用。因此至少可放入 d 或 L−d。",
      "逐一嘗試兩個候選 x，要求 0<x<L 且沒有重複座標；計算 x 到所有已放點的距離，從頻率表逐筆扣除。任何一筆不夠就拒絕並還原，否則遞迴加入 x，回程再把距離補回。頻率表保留相同距離的多重性，不能只使用集合。",
      "放滿 N 點時將座標排序，與目前最小、最大字典序解比較。同一個已放座標集合決定了相同的剩餘距離，所以用座標位元集合記錄搜尋過的狀態，避免因放置順序不同而重算。最大距離引理保證不漏解；N=1 直接輸出兩行 0。搜尋最壞仍是指數時間，不能宣稱多項式。",
    ],
    complexity: "回溯最壞 O(2ᴺ·(N+100)+A·N log N)，A 為到達的完整解數；空間 O(2ᴺ+N²+100)，包含已搜尋座標集合與遞迴還原資料。",
    pitfall: "相同距離可出現多次，扣除失敗也必須還原已扣部分；只找到一個解不足以求兩個字典序極值。",
    traceLabel: "第一個公開範例：N=3，距離為 3、4、7",
    trace: [
      { title: "固定兩端", description: "最大距離 7 決定端點 0、7，扣除後剩 3、4。", cells: ["0", "?", "7"], active: [0, 2], variables: [["剩餘距離", "{3,4}"]] },
      { title: "嘗試最大距離 d=4", description: "候選 x=4，到端點的距離為 4、3，恰好用完。", cells: ["0", "4", "7"], active: [1], variables: [["可行解", "[0,4,7]"]] },
      { title: "還原後嘗試 L−d", description: "候選 x=3 也有距離 3、4，所以另一解為 [0,3,7]。", cells: ["0", "3", "7"], active: [1], variables: [["字典序最小", "0 3 7"], ["字典序最大", "0 4 7"]] },
    ],
    cpp: String.raw`#include <bits/stdc++.h>
using namespace std;
int main() {
    int n;
    cin >> n;
    if (n == 1) {
        cout << "0\n0\n";
        return 0;
    }
    vector<int> count(101);
    int length = 0;
    for (int i = 0; i < n * (n - 1) / 2; ++i) {
        int d;
        cin >> d;
        ++count[d];
        length = max(length, d);
    }
    --count[length];
    vector<int> placed{0, length}, smallest, largest;
    vector<char> used(length + 1);
    used[0] = used[length] = true;
    set<pair<unsigned long long, unsigned long long>> visited;
    function<void(unsigned long long, unsigned long long)> search = [&](unsigned long long low,
                                                                        unsigned long long high) {
        if (!visited.emplace(low, high).second)
            return;
        if ((int)placed.size() == n) {
            vector<int> result = placed;
            sort(result.begin(), result.end());
            if (smallest.empty() || result < smallest)
                smallest = result;
            if (largest.empty() || result > largest)
                largest = result;
            return;
        }
        int d = length;
        while (d > 0 && count[d] == 0)
            --d;
        vector<int> candidates{d};
        if (length - d != d)
            candidates.push_back(length - d);
        for (int x : candidates) {
            if (x <= 0 || x >= length || used[x])
                continue;
            vector<int> removed;
            bool ok = true;
            for (int y : placed) {
                int delta = abs(x - y);
                if (count[delta] == 0) {
                    ok = false;
                    break;
                }
                --count[delta];
                removed.push_back(delta);
            }
            if (ok) {
                used[x] = true;
                placed.push_back(x);
                if (x < 64)
                    search(low | (1ULL << x), high);
                else
                    search(low, high | (1ULL << (x - 64)));
                placed.pop_back();
                used[x] = false;
            }
            for (int delta : removed)
                ++count[delta];
        }
    };
    search(1ULL | (length < 64 ? (1ULL << length) : 0ULL),
           length >= 64 ? (1ULL << (length - 64)) : 0ULL);
    for (const auto &result : {smallest, largest}) {
        for (int i = 0; i < n; ++i)
            cout << result[i] << (i + 1 == n ? '\n' : ' ');
    }
}`,
    python: String.raw`import sys
data = list(map(int, sys.stdin.buffer.read().split()))
n = data[0]
if n == 1:
    print('0\n0')
    sys.exit()
length = max(data[1:])
count = [0]*101
for d in data[1:]:
    count[d] += 1
count[length] -= 1
placed = [0, length]
used = {0, length}
smallest = largest = None
visited = set()
def search(state):
    global smallest, largest
    if state in visited:
        return
    visited.add(state)
    if len(placed) == n:
        result = sorted(placed)
        if smallest is None or result < smallest:
            smallest = result
        if largest is None or result > largest:
            largest = result
        return
    d = length
    while d and not count[d]:
        d -= 1
    candidates = [d] if d == length-d else [d, length-d]
    for x in candidates:
        if not 0 < x < length or x in used:
            continue
        removed = []
        ok = True
        for y in placed:
            delta = abs(x-y)
            if not count[delta]:
                ok = False
                break
            count[delta] -= 1
            removed.append(delta)
        if ok:
            used.add(x)
            placed.append(x)
            search(state | (1 << x))
            placed.pop()
            used.remove(x)
        for delta in removed:
            count[delta] += 1
search(1 | (1 << length))
print(*smallest)
print(*largest)`,
  }),
  definePastExamLesson("a373", {
    concept: "座標壓縮・前進圖 DP 與樹狀陣列",
    goal: "依路線終點排序，快速加總可以搭乘該路線的所有到達方式。",
    explanation: [
      "每次乘車都前進，所以抵達終點 e 的最後一條路線 [s,e]，前一位置必定滿足 s≤x<e。令 ways[x] 是抵達 x 的方式數，該路線的貢獻就是這段半開區間的 ways 總和；不同路線編號分別計算，即使起終點完全相同也要各貢獻一次。初始 ways[0]=1。",
      "只會在 0 與路線終點下車，把這些位置及 m 排序壓縮。以終點由小到大處理路線，用樹狀陣列查詢 [s,e) 的總和，再把貢獻加入 ways[e]。相同終點的路線先共同查詢再一起更新，清楚確保本批次不把 e 當成可以原地上車的前一位置。",
      "所有轉移從較小座標到較大座標，因此目前查詢使用的值已經完成，不會被未來路線改動。所有加法都對 p 取餘數，最後讀出 ways[m]；p=1 時結果自然為 0。",
    ],
    complexity: "時間 O(n log n)，空間 O(n)。",
    pitfall: "可以在路線中途上車，但必須搭到終點；查詢範圍是 s≤x<e，不能包含 e。",
    traceLabel: "第一個公開範例：終點 4、6、6、7、9，模數 11",
    trace: [
      { title: "初始與終點 4", description: "ways[0]=1；路線 [0,4] 產生 ways[4]=1。", cells: ["0:1", "4:1", "6:0", "7:0", "9:0"], active: [1], variables: [["已處理終點", "4"]] },
      { title: "兩條到 6 的路線", description: "[4,6] 貢獻 1；[0,6] 貢獻 ways[0]+ways[4]=2，因此 ways[6]=3。", cells: ["0:1", "4:1", "6:3", "7:0", "9:0"], active: [2], variables: [["ways[6]", "1+2=3"]] },
      { title: "到 7，再到 9", description: "[3,7] 貢獻 1+3=4；[5,9] 再合計 ways[6]+ways[7]=3+4=7。", cells: ["0:1", "4:1", "6:3", "7:4", "9:7"], active: [3, 4], variables: [["ways[9] mod 11", "7"]] },
    ],
    cpp: String.raw`#include <bits/stdc++.h>
using namespace std;
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, destination;
    long long mod;
    cin >> n >> destination >> mod;
    vector<int> start(n), finish(n), coords{0, destination};
    for (int &x : start)
        cin >> x;
    for (int &x : finish) {
        cin >> x;
        coords.push_back(x);
    }
    sort(coords.begin(), coords.end());
    coords.erase(unique(coords.begin(), coords.end()), coords.end());
    vector<pair<int, int>> routes;
    for (int i = 0; i < n; ++i)
        if (start[i] < finish[i])
            routes.emplace_back(finish[i], start[i]);
    sort(routes.begin(), routes.end());
    vector<long long> bit(coords.size() + 1);
    auto add = [&](int index, long long value) {
        for (int i = index + 1; i < (int)bit.size(); i += i & -i)
            bit[i] = (bit[i] + value) % mod;
    };
    auto prefix = [&](int count) {
        long long result = 0;
        for (int i = count; i > 0; i -= i & -i)
            result = (result + bit[i]) % mod;
        return result;
    };
    add(0, 1 % mod);
    for (int i = 0; i < (int)routes.size();) {
        int j = i, e = routes[i].first;
        int endIndex = lower_bound(coords.begin(), coords.end(), e) - coords.begin();
        long long total = 0, beforeEnd = prefix(endIndex);
        while (j < (int)routes.size() && routes[j].first == e) {
            int left = lower_bound(coords.begin(), coords.end(), routes[j].second) - coords.begin();
            total = (total + beforeEnd - prefix(left) + mod) % mod;
            ++j;
        }
        add(endIndex, total);
        i = j;
    }
    int index = lower_bound(coords.begin(), coords.end(), destination) - coords.begin();
    cout << (prefix(index + 1) - prefix(index) + mod) % mod << '\n';
}`,
    python: String.raw`import sys
from bisect import bisect_left
it = iter(map(int, sys.stdin.buffer.read().split()))
n, destination, mod = next(it), next(it), next(it)
start = [next(it) for _ in range(n)]
finish = [next(it) for _ in range(n)]
coords = sorted(set([0, destination]+finish))
routes = sorted((e, s) for s, e in zip(start, finish) if s < e)
bit = [0]*(len(coords)+1)
def add(index, value):
    i = index+1
    while i < len(bit):
        bit[i] = (bit[i]+value) % mod
        i += i & -i
def prefix(count):
    result = 0
    while count:
        result += bit[count]
        count -= count & -count
    return result % mod
add(0, 1 % mod)
i = 0
while i < len(routes):
    e = routes[i][0]
    end_index = bisect_left(coords, e)
    before_end = prefix(end_index)
    total = 0
    j = i
    while j < len(routes) and routes[j][0] == e:
        left = bisect_left(coords, routes[j][1])
        total = (total+before_end-prefix(left)) % mod
        j += 1
    add(end_index, total)
    i = j
index = bisect_left(coords, destination)
print((prefix(index+1)-prefix(index)) % mod)`,
  }),
  definePastExamLesson("a374", {
    concept: "障礙物 BFS・單調事件與連鎖閉包",
    goal: "按到初始炸彈的距離加入格子，並讓每個正半徑炸彈只觸發一次。",
    explanation: [
      "先從初始炸彈做避開石頭的 BFS，取得每格的最短步數及由近到遠順序。初始半徑為 r 時，直接引爆的恰是距離≤r 的格子。依 BFS 順序逐格加入，遇到的新正半徑炸彈放進待處理佇列，並立刻把所有連鎖反應處理完。",
      "處理半徑 b 的炸彈時，以它為起點另做最多 b 層的局部 BFS。經過已爆格仍然可以行走；局部拜訪標記和全域已爆標記必須分開。新波及的格子只讓總數增加一次，正半徑炸彈也只入列一次；半徑 0 的格子沒有額外延伸，不必另外搜尋。",
      "半徑增加不會讓任何已爆格消失，所以所有反應可沿用。若在加入距離 r 的某格後達到 Q，半徑 r 可行，而上一個距離層完成後尚未達標，答案就是 r；同層尚未加入的其他格只會再增加爆炸數。每顆既有正半徑炸彈最多 30，在四鄰網格中其搜尋範圍最多 1+2b(b+1) 格，石頭只會縮小此範圍。",
    ],
    complexity: "V=MN、B≤1500、R≤30；時間 O(V+B·min(V,R²))，空間 O(V+B)。局部 BFS 的半徑僅指既有炸彈，不限制初始答案。",
    pitfall: "石頭會改變最短步數，不能只用曼哈頓距離；已爆格仍可作為其他爆炸的通道。",
    traceLabel: "示意 2×3：上排 [初始,1,0]，下排 [0,0,0]，Q=5",
    trace: [
      { title: "初始半徑 0", description: "僅左上初始格爆炸，共 1 格。", cells: ["初始：已爆", "半徑1", "0", "0", "0", "0"], active: [0], variables: [["半徑", "0"], ["總數", "1"]] },
      { title: "距離 1 的炸彈被觸發", description: "上中半徑 1 的炸彈爆炸，波及上左、上中、上右、下中，共已爆 4 格。", cells: ["已爆", "已爆：1", "已爆", "未爆", "已爆", "未爆"], active: [1, 2, 4], variables: [["初始半徑", "1"], ["連鎖後總數", "4"]] },
      { title: "完成距離 1 的直接引爆", description: "初始半徑 1 也能直接抵達左下，加入後共 5 格，答案為 1。", cells: ["已爆", "已爆", "已爆", "已爆", "已爆", "未爆"], active: [3], variables: [["總數", "5"], ["最小半徑", "1"]] },
    ],
    cpp: String.raw`#include <bits/stdc++.h>
using namespace std;
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int rows, cols, target;
    cin >> rows >> cols >> target;
    int width = cols + 2, size = (rows + 2) * width, origin = -1;
    vector<int> grid(size, -1);
    for (int r = 1; r <= rows; ++r) {
        for (int c = 1; c <= cols; ++c) {
            int u = r * width + c;
            cin >> grid[u];
            if (grid[u] == -2)
                origin = u;
        }
    }
    int delta[] = {1, -1, width, -width};
    vector<int> distance(size, -1), order{origin};
    distance[origin] = 0;
    for (int head = 0; head < (int)order.size(); ++head) {
        int u = order[head];
        for (int step : delta) {
            int v = u + step;
            if (grid[v] != -1 && distance[v] == -1) {
                distance[v] = distance[u] + 1;
                order.push_back(v);
            }
        }
    }
    vector<char> exploded(size);
    vector<int> stamp(size), pending;
    int count = 0, token = 0;
    for (int u : order) {
        if (exploded[u])
            continue;
        int radius = distance[u];
        exploded[u] = true;
        ++count;
        if (count >= target) {
            cout << radius << '\n';
            return 0;
        }
        pending.clear();
        if (grid[u] > 0)
            pending.push_back(u);
        for (int head = 0; head < (int)pending.size(); ++head) {
            int bomb = pending[head];
            ++token;
            vector<int> local{bomb};
            stamp[bomb] = token;
            int begin = 0;
            for (int depth = 0; depth < grid[bomb]; ++depth) {
                int end = local.size();
                for (int j = begin; j < end; ++j) {
                    for (int step : delta) {
                        int v = local[j] + step;
                        if (grid[v] == -1 || stamp[v] == token)
                            continue;
                        stamp[v] = token;
                        local.push_back(v);
                        if (!exploded[v]) {
                            exploded[v] = true;
                            ++count;
                            if (count >= target) {
                                cout << radius << '\n';
                                return 0;
                            }
                            if (grid[v] > 0)
                                pending.push_back(v);
                        }
                    }
                }
                begin = end;
            }
        }
    }
}`,
    python: String.raw`import sys
def solve():
    it = iter(map(int, sys.stdin.buffer.read().split()))
    rows, cols, target = next(it), next(it), next(it)
    width = cols+2
    size = (rows+2)*width
    grid = [-1]*size
    origin = -1
    for r in range(1, rows+1):
        for c in range(1, cols+1):
            u = r*width+c
            grid[u] = next(it)
            if grid[u] == -2:
                origin = u
    delta = (1, -1, width, -width)
    distance = [-1]*size
    distance[origin] = 0
    order = [origin]
    for u in order:
        for step in delta:
            v = u+step
            if grid[v] != -1 and distance[v] == -1:
                distance[v] = distance[u]+1
                order.append(v)
    exploded = bytearray(size)
    stamp = [0]*size
    count = token = 0
    for u in order:
        if exploded[u]:
            continue
        radius = distance[u]
        exploded[u] = 1
        count += 1
        if count >= target:
            return radius
        pending = [u] if grid[u] > 0 else []
        for bomb in pending:
            token += 1
            local = [bomb]
            stamp[bomb] = token
            begin = 0
            for _ in range(grid[bomb]):
                end = len(local)
                for j in range(begin, end):
                    for step in delta:
                        v = local[j]+step
                        if grid[v] == -1 or stamp[v] == token:
                            continue
                        stamp[v] = token
                        local.append(v)
                        if not exploded[v]:
                            exploded[v] = 1
                            count += 1
                            if count >= target:
                                return radius
                            if grid[v] > 0:
                                pending.append(v)
                begin = end
    raise ValueError('No solution')
print(solve())`,
  }),
];
