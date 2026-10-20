import { definePastExamLesson } from "@/lib/apcsPastExamLessonBuilder";

export const lessonsPart4 = [
  definePastExamLesson("a413", {
    concept: "前綴和・重心與整數切點",
    goal: "把每段的力矩化成一次式，只比較重心左右的合法索引。",
    explanation: [
      "對區間 [s,t]，令 W = Σp[i]、V = Σi×p[i]，則題目要最小化的是 |V−mW|。因為所有重量為正，理想切點就是重心 V/W，最佳整數只可能是其向下與向上取整。再把兩個候選都限制在 [s+1,t−1]，便符合不能選端點的規則。",
      "先建立重量與加權索引的前綴和，每段的 W、V 都可在 O(1) 取得。比較候選時，只有右候選嚴格比較好才改選它，因此相同力矩會保留較小索引。選定後累加 p[m]，把左右兩段連同下一層放入堆疊；不足三格或超過 K 層就略過。",
      "每次切割都移除一個從未被選過的位置，因此有效切割次數最多 N 次；每次只做固定次數的計算。C++ 的 V 最大可達 N×10^9，必須使用 64 位元整數，不能先用浮點重心再四捨五入。",
    ],
    complexity: "時間 O(N)；空間 O(N)，包含兩份前綴和及待處理區間。",
    pitfall: "並列時選左邊；K=0 不切割，且切點不能再留在任一子區間中。",
    traceLabel: "公開範例：K=3 的重心切割（索引從 1 開始）",
    trace: [
      { title: "整段力矩", description: "W=32，V=159，重心為 4.96875；合法候選是 4 與 5。", cells: ["2", "4", "1", "3", "7", "6", "9"], active: [3, 4], variables: [["區間", "[1,7]"], ["候選力矩", "m=4:31；m=5:1"]] },
      { title: "第一層取出 7", description: "切點為索引 5，答案先加 7；右側 [6,7] 太短。", cells: ["2", "4", "1", "3", "取出 7", "6", "9"], active: [4], variables: [["總和", "7"], ["下一段", "[1,4]"]] },
      { title: "第二層切索引 2", description: "左段 W=10、V=25。索引 2 與 3 的力矩同為 5，依規則選索引 2。", cells: ["2", "取出 4", "1", "3", "7", "6", "9"], active: [1], variables: [["切點", "2"], ["總和", "7+4=11"]] },
      { title: "子段皆不足三格", description: "剩下 [1,1]、[3,4] 與 [6,7] 都不切割，即使層數還有剩也結束。", cells: ["[2]", "切點 4", "[1,3]", "切點 7", "[6,9]"], variables: [["輸出", "11"]] },
    ],
    cpp: String.raw`#include <bits/stdc++.h>
using namespace std;
int main() {
    ios::sync_with_stdio(false); cin.tie(nullptr);
    int n, k; cin >> n >> k;
    vector<long long> p(n+1), w(n+1), v(n+1);
    for (int i=1;i<=n;i++) {
        cin >> p[i]; w[i]=w[i-1]+p[i]; v[i]=v[i-1]+p[i]*i;
    }
    vector<array<int,3>> st{{1,n,1}};
    long long ans=0;
    while (!st.empty()) {
        auto [s,t,d]=st.back(); st.pop_back();
        if (d>k || t-s+1<3) continue;
        long long W=w[t]-w[s-1], V=v[t]-v[s-1], q=V/W;
        int a=(int)clamp(q,(long long)s+1,(long long)t-1);
        int b=(int)clamp(q+1,(long long)s+1,(long long)t-1);
        int mid=llabs(V-b*W)<llabs(V-a*W)?b:a;
        ans+=p[mid];
        st.push_back({s,mid-1,d+1}); st.push_back({mid+1,t,d+1});
    }
    cout << ans << '\n';
}`,
    python: String.raw`import sys
data = iter(map(int, sys.stdin.buffer.read().split()))
n, k = next(data), next(data)
p = [0] + [next(data) for _ in range(n)]
w = [0] * (n + 1)
v = [0] * (n + 1)
for i in range(1, n + 1):
    w[i] = w[i - 1] + p[i]
    v[i] = v[i - 1] + i * p[i]
stack = [(1, n, 1)]
answer = 0
while stack:
    s, t, depth = stack.pop()
    if depth > k or t - s + 1 < 3:
        continue
    weight = w[t] - w[s - 1]
    moment = v[t] - v[s - 1]
    q = moment // weight
    a = min(t - 1, max(s + 1, q))
    b = min(t - 1, max(s + 1, q + 1))
    mid = b if abs(moment - b * weight) < abs(moment - a * weight) else a
    answer += p[mid]
    stack.append((s, mid - 1, depth + 1))
    stack.append((mid + 1, t, depth + 1))
print(answer)
`,
  }),
  definePastExamLesson("a414", {
    concept: "四分樹・以區域面積解析前序編碼",
    goal: "同步消耗編碼字元與區域面積，直接統計黑色像素。",
    explanation: [
      "每次解析一個區域時，先取下一個編碼字元。0 代表這個區域貢獻 0；1 代表整個區域都是黑色，直接貢獻邊長平方；2 則代表接下來恰有四個邊長減半的子區域。沒有必要真的配置 N×N 的圖片。",
      "共用一個字串索引，每讀一個字元就前進一次。遇到 2 時依序完整解析左上、右上、左下、右下，再把四個答案相加。合法編碼保證每個呼叫恰好吃掉自己那棵子樹，因此既不重讀也不漏讀；遞迴層數只有 log₂N+1。",
    ],
    complexity: "時間 O(|S|)；空間 O(|S|+log N)，包含輸入字串與遞迴堆疊。",
    pitfall: "字元 1 的貢獻是當前區域的面積，不一定是 1；四個子樹共用同一讀取位置。",
    traceLabel: "示意：編碼 20101、N=2",
    trace: [
      { title: "根是混合區域", description: "讀到 2，將 2×2 區域拆成四個 1×1 象限。", cells: ["2", "0", "1", "0", "1"], active: [0], variables: [["邊長", "2 → 1"], ["索引", "1"]] },
      { title: "讀完上方兩格", description: "左上為白色 0，右上為黑色 1，已計入 1 個黑像素。", cells: ["左上 0", "右上 1", "左下 ?", "右下 ?"], active: [0, 1], variables: [["黑色小計", "1"], ["索引", "3"]] },
      { title: "讀完下方並合併", description: "左下為白、右下為黑，四個象限貢獻 0+1+0+1=2。", cells: ["左上 0", "右上 1", "左下 0", "右下 1"], active: [2, 3], variables: [["索引", "5"], ["輸出", "2"]] },
    ],
    cpp: String.raw`#include <bits/stdc++.h>
using namespace std;
string s; size_t pos=0;
int parse(int side) {
    char c=s[pos++];
    if (c=='0') return 0;
    if (c=='1') return side*side;
    int result=0;
    for (int i=0;i<4;i++) result+=parse(side/2);
    return result;
}
int main() {
    ios::sync_with_stdio(false); cin.tie(nullptr);
    int n; cin >> s >> n;
    cout << parse(n) << '\n';
}`,
    python: String.raw`import sys
s, n = sys.stdin.buffer.read().split()
pos = 0
def parse(side):
    global pos
    c = s[pos]
    pos += 1
    if c == 48:
        return 0
    if c == 49:
        return side * side
    half = side // 2
    total = 0
    for _ in range(4):
        total += parse(half)
    return total
print(parse(int(n)))
`,
  }),
  definePastExamLesson("a415", {
    concept: "座標排序・最長非遞減子序列",
    goal: "先按 x、y 遞增排序，再求 y 可不下降的最長路線。",
    explanation: [
      "路線上的果實必須同時滿足 x 不下降、y 不下降。先以 (x,y) 遞增排序，便固定了合法的 x 次序；相同 x 時仍可沿垂直方向由小 y 走到大 y，所以第二排序鍵也要遞增。現在只要選出 y 的最長非遞減子序列。",
      "tails[len−1] 保存能吃到 len 個果實時最小的結尾 y。對新 y，找第一個嚴格大於 y 的位置並替換；若不存在就接到最後。較小的結尾不會失去任何後續可走的果實，因此這種替換保留了最優長度。相等的 y 可以繼續吃，必須使用 upper_bound／bisect_right。",
    ],
    complexity: "時間 O(n log n)；空間 O(n)。",
    pitfall: "不能使用嚴格遞增的 lower_bound；相同 x 或相同 y 的不同果實都可能連續取得。",
    traceLabel: "示意果實：(1,1)、(2,5)、(3,2)、(4,2)",
    trace: [
      { title: "取得第一個果實", description: "排序後第一個 y=1，建立長度 1 的最佳結尾。", cells: ["1"], active: [0], variables: [["tails", "[1]"], ["最多果實", "1"]] },
      { title: "先延長再降低結尾", description: "y=5 得到 [1,5]；下一個 y=2 替換 5，長度仍是 2。", cells: ["1", "2"], active: [1], variables: [["原 tails", "[1,5]"], ["新 tails", "[1,2]"]] },
      { title: "相同 y 仍能向右移動", description: "(4,2) 可接在 (3,2) 後；第一個大於 2 的位置在陣列尾端。", cells: ["1", "2", "2"], active: [2], variables: [["路線", "(1,1) → (3,2) → (4,2)"], ["答案", "3"]] },
    ],
    cpp: String.raw`#include <bits/stdc++.h>
using namespace std;
int main() {
    ios::sync_with_stdio(false); cin.tie(nullptr);
    int n; cin >> n;
    vector<pair<int,int>> p(n);
    for (auto &[x,y]:p) cin >> x >> y;
    sort(p.begin(),p.end());
    vector<int> tails;
    for (auto [x,y]:p) {
        auto it=upper_bound(tails.begin(),tails.end(),y);
        if (it==tails.end()) tails.push_back(y); else *it=y;
    }
    cout << tails.size() << '\n';
}`,
    python: String.raw`import sys
from bisect import bisect_right
read = sys.stdin.buffer.readline
n = int(read())
points = [tuple(map(int, read().split())) for _ in range(n)]
points.sort()
tails = []
for x, y in points:
    i = bisect_right(tails, y)
    if i == len(tails):
        tails.append(y)
    else:
        tails[i] = y
print(len(tails))
`,
  }),
  definePastExamLesson("a416", {
    concept: "逆向操作・座標排序與雙向鏈結",
    goal: "倒著撤銷切割，用左右相鄰切點求每一刀當時的棍長。",
    explanation: [
      "正向第 i 刀的成本，是目前切點集合中 x 的前一個與後一個切點之差。Python 若用有序串列插入，最壞會花 O(n²)。改從所有切割都完成的狀態開始，依刀序 n、n−1、…、1 撤銷，就只需要刪除。",
      "先把 0、L 與全部切點按座標排序，用 left、right 陣列記錄相鄰位置，並記下每個刀序對應的排序索引。撤銷第 i 刀前，所有更晚的刀都已刪除，左右鄰居正是當年切下這刀時的段界，所以該刀成本為 pos[right]−pos[left]。接著直接把左右鄰居接起來，每次 O(1)。",
      "輸入順序並非切割順序，必須使用每行的第二個數 i。把每一刀在逆向時復原的成本相加，與原本正向切割的總成本相同；累加值使用 64 位元。",
    ],
    complexity: "時間 O(n log n)；空間 O(n)。",
    pitfall: "不要最佳化切割順序；本題順序固定。邊界 0、L 不能被當成一般切點刪除。",
    traceLabel: "公開範例：L=7，刀序為 3、2、5",
    trace: [
      { title: "全部切完的段界", description: "按座標排列 0、2、3、5、7，接下來先撤銷第 3 刀。", cells: ["0", "2(第2刀)", "3(第1刀)", "5(第3刀)", "7"], active: [3], variables: [["總成本", "0"]] },
      { title: "撤銷座標 5", description: "5 的鄰居為 3、7，因此第 3 刀成本為 4，並連接 3 與 7。", cells: ["0", "2", "3", "7"], active: [2, 3], variables: [["本刀成本", "7−3=4"], ["累計", "4"]] },
      { title: "撤銷座標 2", description: "2 的鄰居為 0、3，第 2 刀成本為 3。", cells: ["0", "3", "7"], active: [0, 1], variables: [["本刀成本", "3−0=3"], ["累計", "7"]] },
      { title: "撤銷第一刀", description: "3 的鄰居只剩 0、7，第 1 刀成本為 7，總成本為 14。", cells: ["0", "7"], active: [0, 1], variables: [["本刀成本", "7"], ["答案", "14"]] },
    ],
    cpp: String.raw`#include <bits/stdc++.h>
using namespace std;
int main() {
    ios::sync_with_stdio(false); cin.tie(nullptr);
    int n,L; cin >> n >> L;
    vector<pair<int,int>> cuts{{0,0},{L,0}};
    for (int j=0;j<n;j++) { int x,i; cin >> x >> i; cuts.push_back({x,i}); }
    sort(cuts.begin(),cuts.end());
    vector<int> left(n+2),right(n+2),where(n+1);
    for (int j=0;j<n+2;j++) {
        left[j]=j-1; right[j]=j+1;
        if (cuts[j].second) where[cuts[j].second]=j;
    }
    long long ans=0;
    for (int i=n;i>=1;i--) {
        int j=where[i], a=left[j], b=right[j];
        ans+=(long long)cuts[b].first-cuts[a].first;
        right[a]=b; left[b]=a;
    }
    cout << ans << '\n';
}`,
    python: String.raw`import sys
read = sys.stdin.buffer.readline
n, length = map(int, read().split())
cuts = [(0, 0), (length, 0)]
for _ in range(n):
    x, order = map(int, read().split())
    cuts.append((x, order))
cuts.sort()
left = [i - 1 for i in range(n + 2)]
right = [i + 1 for i in range(n + 2)]
where = [0] * (n + 1)
for j, (x, order) in enumerate(cuts):
    if order:
        where[order] = j
answer = 0
for order in range(n, 0, -1):
    j = where[order]
    a, b = left[j], right[j]
    answer += cuts[b][0] - cuts[a][0]
    right[a] = b
    left[b] = a
print(answer)
`,
  }),
  definePastExamLesson("a417", {
    concept: "流量彙總・有向城市對的分段計費",
    goal: "先合併同一來源與目的城市的流量，再比較所有配置費用。",
    explanation: [
      "配置決定每台伺服器的來源城市。建立 flow[a][b]，把設在 a 的所有伺服器傳往 b 的 Q[i][b] 相加。這一步必須先完成，因為跨城超過 1000 單位的折扣是同一城市對合併後才計算，不能逐台伺服器收費。",
      "同城 a=b 時成本就是流量 x。跨城時成本為 3×min(x,1000)+2×max(x−1000,0)。對有向城市對逐一計費，a→b 與 b→a 分開。每個方案都使用新的彙總矩陣，取 k 個總價的最小值即可；題目只要求比較給定配置，無須搜尋其他配置。",
    ],
    complexity: "時間 O(k(nm+m²))；空間 O(nm+m²)，包含 Q 與單個方案的流量矩陣。",
    pitfall: "折扣前要合併來源城市相同的伺服器；不能把兩個傳輸方向合併。",
    traceLabel: "示意：兩台伺服器都在城市 0，各傳 600 單位到城市 1",
    trace: [
      { title: "開始一個配置", description: "兩台伺服器來源都為 0，城市對 0→1 尚無累積流量。", cells: ["伺服器 A:600", "伺服器 B:600", "flow[0][1]=0"], variables: [["配置", "[0,0]"]] },
      { title: "依城市對合併", description: "600+600=1200 單位屬於同一個有向城市對。", cells: ["0→1:1200", "1→0:0"], active: [0], variables: [["未折扣部分", "1000"], ["折扣部分", "200"]] },
      { title: "分段計費", description: "成本為 1000×3+200×2=3400，而非把兩筆各自按 600×3 計費。", cells: ["前1000:3000", "後200:400", "合計3400"], active: [2], variables: [["方案費用", "3400"], ["best", "與其他方案取最小"]] },
    ],
    cpp: String.raw`#include <bits/stdc++.h>
using namespace std;
int main() {
    ios::sync_with_stdio(false); cin.tie(nullptr);
    int n,m,k; cin >> n >> m >> k;
    vector<vector<long long>> q(n,vector<long long>(m));
    for (auto &row:q) for (auto &x:row) cin >> x;
    long long best=LLONG_MAX;
    while (k--) {
        vector<vector<long long>> flow(m,vector<long long>(m));
        for (int i=0;i<n;i++) {
            int city; cin >> city;
            for (int j=0;j<m;j++) flow[city][j]+=q[i][j];
        }
        long long cost=0;
        for (int a=0;a<m;a++) for (int b=0;b<m;b++) {
            long long x=flow[a][b];
            cost+= a==b ? x : 3*min(x,1000LL)+2*max(x-1000,0LL);
        }
        best=min(best,cost);
    }
    cout << best << '\n';
}`,
    python: String.raw`import sys
data = iter(map(int, sys.stdin.buffer.read().split()))
n, m, k = next(data), next(data), next(data)
q = [[next(data) for _ in range(m)] for _ in range(n)]
best = None
for _ in range(k):
    flow = [[0] * m for _ in range(m)]
    for i in range(n):
        city = next(data)
        for j in range(m):
            flow[city][j] += q[i][j]
    cost = 0
    for a in range(m):
        for b in range(m):
            x = flow[a][b]
            cost += x if a == b else 3 * min(x, 1000) + 2 * max(x - 1000, 0)
    if best is None or cost < best:
        best = cost
print(best)
`,
  }),
  definePastExamLesson("a418", {
    concept: "樹上動態規劃・逐位置獨立配字",
    goal: "每個 RNA 位置各做一次四狀態樹 DP，再加總最小距離。",
    explanation: [
      "RNA 距離是各位置不同與否的總和，而不同位置的 @ 可以獨立選字，因此可將長度 m 的問題拆成 m 個單字元問題。對固定位置，dp[v][c] 表示把節點 v 設為字母 c 時，其整棵子樹的最小成本；固定字母的其他三個狀態設為無限大，@ 的四個初值都為 0。",
      "子節點 u 對父節點字母 c 的貢獻是 min_d(dp[u][d]+[c≠d])。因為相同字母代價為 0、不同為 1，可寫成 min(dp[u][c], min(dp[u])+1)，每條邊只做四個狀態更新。把所有子節點貢獻相加，便枚舉了所有可能配字且不重複計算任何邊。",
      "先依父子關係產生父在前、子在後的走訪序，再反向計算，避免千層樹的遞迴限制。每個位置取根的最小狀態，最後相加。輸入行可以亂序，務必按 i 存 RNA，不能把讀入次序當編號。",
    ],
    complexity: "時間 O(nm)，字母種類固定為 4；空間 O(nm+n)，包含 RNA 與單一位置的 DP。",
    pitfall: "@ 的選擇要考慮整個子樹；不能只模仿父節點或逐邊各自補字。",
    traceLabel: "公開第二例：節點 1、2 未定，3、4 為 C，5、6 為 A",
    trace: [
      { title: "葉節點固定字母", description: "3、4 只能取 C；5、6 只能取 A。狀態順序為 A、U、C、G。", cells: ["3:C", "4:C", "5:A", "6:A"], variables: [["葉節點 A 的 DP", "[0,∞,∞,∞]"]] },
      { title: "合併節點 2", description: "2 的兩個孩子都是 A，若 2 選 A 成本 0，其餘字母成本 2。", cells: ["2:A→0", "2:U→2", "2:C→2", "2:G→2"], active: [0], variables: [["dp[2]", "[0,2,2,2]"]] },
      { title: "根選 C", description: "根 1 選 C，連到 3、4 都不用改變；連向取 A 的節點 2 只花 1。", cells: ["1:C", "2:A", "3:C", "4:C", "5:A", "6:A"], active: [0, 1], variables: [["根選 A 的成本", "2"], ["根選 C 的成本", "1"]] },
      { title: "取根的最小值", description: "僅邊 1→2 字母不同，因此最小距離總和為 1。", cells: ["1→2:1", "1→3:0", "1→4:0", "2→5:0", "2→6:0"], active: [0], variables: [["答案", "1"]] },
    ],
    cpp: String.raw`#include <bits/stdc++.h>
using namespace std;
int main() {
    ios::sync_with_stdio(false); cin.tie(nullptr);
    int n,m; cin >> n >> m;
    vector<vector<int>> children(n);
    vector<string> rna(n);
    int root=0;
    for (int z=0;z<n;z++) {
        int i,j; string s; cin >> i >> j >> s; --i; --j;
        rna[i]=s;
        if (i==j) root=i; else children[j].push_back(i);
    }
    vector<int> order{root};
    for (size_t i=0;i<order.size();i++)
        for (int u:children[order[i]]) order.push_back(u);
    const int INF=1000000;
    string letters="AUCG";
    vector<array<int,4>> dp(n);
    int answer=0;
    for (int pos=0;pos<m;pos++) {
        for (int z=n-1;z>=0;z--) {
            int v=order[z];
            for (int c=0;c<4;c++) dp[v][c]=(rna[v][pos]=='@'||rna[v][pos]==letters[c])?0:INF;
            for (int u:children[v]) {
                int best=*min_element(dp[u].begin(),dp[u].end());
                for (int c=0;c<4;c++) dp[v][c]+=min(dp[u][c],best+1);
            }
        }
        answer+=*min_element(dp[root].begin(),dp[root].end());
    }
    cout << answer << '\n';
}`,
    python: String.raw`import sys
read = sys.stdin.buffer.readline
n, m = map(int, read().split())
children = [[] for _ in range(n)]
rna = [b''] * n
root = 0
for _ in range(n):
    i, j, s = read().split()
    i, j = int(i) - 1, int(j) - 1
    rna[i] = s
    if i == j:
        root = i
    else:
        children[j].append(i)
order = [root]
for v in order:
    order.extend(children[v])
letters = b'AUCG'
inf = 10**6
answer = 0
for pos in range(m):
    dp = [None] * n
    for v in reversed(order):
        ch = rna[v][pos]
        cur = [0 if ch == 64 or ch == c else inf for c in letters]
        for u in children[v]:
            child = dp[u]
            change = min(child) + 1
            for c in range(4):
                cur[c] += min(child[c], change)
        dp[v] = cur
    answer += min(dp[root])
print(answer)
`,
  }),
  definePastExamLesson("a419", {
    concept: "雙倍環狀陣列・前綴和二分搜尋",
    goal: "用嚴格遞增的前綴和找到每個任務最後取得點數的房間。",
    explanation: [
      "把房間點數接上相同的一份，建立長度 2N 的前綴和 prefix。若任務從房間 s 開始，走到索引 e−1 的累計點數為 prefix[e]−prefix[s]。所有點數為正，因此要找的是最小 e，使 prefix[e] 至少為 prefix[s]+q，可用二分搜尋。",
      "q 不超過一圈總分，所以一定可在 s+1 到 s+N 的前綴索引找到答案。e−1 是最後計點房，而下一個任務從 e mod N 開始；最後輸出也正是這個下一房號。每次任務重新使用自己的 q，不保留上一任務超過門檻的點數。",
    ],
    complexity: "時間 O(N+M log N)；空間 O(N)，包含雙倍前綴和。",
    pitfall: "起點立即計點；搜尋前綴索引 e 後，輸出 e mod N，不是 (e−1) mod N。",
    traceLabel: "公開第二例：點數 [1,3,5,7]，任務 [4,2,2]",
    trace: [
      { title: "建立前綴和", description: "前四間的前綴為 0、1、4、9、16；第一任務從 0 開始。", cells: ["房0:1", "房1:3", "房2:5", "房3:7"], active: [0], variables: [["s", "0"], ["q", "4"]] },
      { title: "第一任務剛好達標", description: "房 0 與房 1 共得 4 點，找到前綴索引 e=2，下一個起點為 2。", cells: ["1", "3", "5", "7"], active: [0, 1], variables: [["最後計點房", "1"], ["下一起點", "2"]] },
      { title: "第二任務只需一房", description: "房 2 的 5 點已超過要求 2；多出的 3 點不帶到下一任務。", cells: ["1", "3", "5", "7"], active: [2], variables: [["本任務得分", "5"], ["下一起點", "3"]] },
      { title: "第三任務繞回零", description: "房 3 的 7 點達標，下一房是 0，所以輸出 0。", cells: ["1", "3", "5", "7"], active: [3, 0], variables: [["e", "4"], ["輸出", "4 mod 4 = 0"]] },
    ],
    cpp: String.raw`#include <bits/stdc++.h>
using namespace std;
int main() {
    ios::sync_with_stdio(false); cin.tie(nullptr);
    int n,m; cin >> n >> m;
    vector<long long> p(n),prefix(2*n+1);
    for (auto &x:p) cin >> x;
    for (int i=0;i<2*n;i++) prefix[i+1]=prefix[i]+p[i%n];
    int start=0;
    for (int i=0;i<m;i++) {
        long long q; cin >> q;
        auto it=lower_bound(prefix.begin()+start+1,
                            prefix.begin()+start+n+1,prefix[start]+q);
        int end=it-prefix.begin();
        start=end%n;
    }
    cout << start << '\n';
}`,
    python: String.raw`import sys
from bisect import bisect_left
data = iter(map(int, sys.stdin.buffer.read().split()))
n, m = next(data), next(data)
p = [next(data) for _ in range(n)]
prefix = [0] * (2 * n + 1)
for i in range(2 * n):
    prefix[i + 1] = prefix[i] + p[i % n]
start = 0
for _ in range(m):
    q = next(data)
    end = bisect_left(prefix, prefix[start] + q, start + 1, start + n + 1)
    start = end % n
print(start)
`,
  }),
  definePastExamLesson("a420", {
    concept: "骰子模擬・以三個朝向重建六面",
    goal: "保存上、前、右三面的點數，依操作同步更新或交換整顆骰子。",
    explanation: [
      "對面點數和為 7，因此只要記錄 (top,front,right)，就能得到下、後、左為 (7−top,7−front,7−right)。初始狀態為 (1,4,2)。正數操作要交換這整組狀態，因為位置交換連骰子的朝向一起交換。",
      "向前滾時，後面來到上面、上面移到前面，所以新狀態為 (7−front,top,right)。向右滾時，左面來到上面、上面移到右面，所以新狀態為 (7−right,front,top)。每個式子都從同一份舊值計算，才能避免先更新 top 後誤用新 top。",
    ],
    complexity: "時間 O(n+m)；空間 O(n)。",
    pitfall: "初始前面是 4；向前滾是後面上來，不是前面上來。交換時不能只交換頂面。",
    traceLabel: "公開第二例：三顆骰子的上、前、右",
    trace: [
      { title: "三顆初始朝向", description: "每個位置都從 (1,4,2) 開始。", cells: ["1:(1,4,2)", "2:(1,4,2)", "3:(1,4,2)"], variables: [["朝向格式", "(上,前,右)"]] },
      { title: "位置 2 向前", description: "原後面 3 上來，原頂面 1 到前面。", cells: ["1:(1,4,2)", "2:(3,1,2)", "3:(1,4,2)"], active: [1], variables: [["操作", "2 -1"]] },
      { title: "位置 3 向右", description: "原左面 5 上來，原頂面 1 到右面。", cells: ["1:(1,4,2)", "2:(3,1,2)", "3:(5,4,1)"], active: [2], variables: [["操作", "3 -2"]] },
      { title: "交換位置 3 與 1", description: "連同三面資訊交換，最後頂面依序為 5、3、1。", cells: ["1:(5,4,1)", "2:(3,1,2)", "3:(1,4,2)"], active: [0, 2], variables: [["輸出", "5 3 1"]] },
    ],
    cpp: String.raw`#include <bits/stdc++.h>
using namespace std;
int main() {
    ios::sync_with_stdio(false); cin.tie(nullptr);
    int n,m; cin >> n >> m;
    vector<array<int,3>> dice(n,{1,4,2});
    for (int i=0;i<m;i++) {
        int a,b; cin >> a >> b; --a;
        if (b>0) {
            swap(dice[a],dice[b-1]);
        } else {
            auto [top,front,right]=dice[a];
            if (b==-1) dice[a]={7-front,top,right};
            else dice[a]={7-right,front,top};
        }
    }
    for (int i=0;i<n;i++) cout << dice[i][0] << (i+1==n?'\n':' ');
}`,
    python: String.raw`import sys
read = sys.stdin.buffer.readline
n, m = map(int, read().split())
dice = [(1, 4, 2) for _ in range(n)]
for _ in range(m):
    a, b = map(int, read().split())
    a -= 1
    if b > 0:
        dice[a], dice[b - 1] = dice[b - 1], dice[a]
    else:
        top, front, right = dice[a]
        if b == -1:
            dice[a] = (7 - front, top, right)
        else:
            dice[a] = (7 - right, front, top)
print(*(state[0] for state in dice))
`,
  }),
  definePastExamLesson("a421", {
    concept: "離線依值處理・Fenwick 樹區間計數",
    goal: "由小到大啟用兩次出現的位置，查詢嚴格落在兩端之間的小數字個數。",
    explanation: [
      "先記錄每個數 i 的第一次與第二次出現位置 L[i]、R[i]。若直接掃描每一對中間的區間，總工作可能是 O(n²)。改依數值 1、2、…、n 處理，讓資料結構只保留目前比 i 小的元素位置。",
      "以 Fenwick 樹在位置被啟用時加 1。處理 i 時，prefix(R[i]−1)−prefix(L[i]) 正好計算兩個 i 之間、已啟用的位置個數；先查詢，再把 i 的兩個位置都啟用。依此不變量，樹中每個位置都對應一個嚴格較小的元素，所以區間查詢就是低窪值，重複出現的兩次也各算一次。",
    ],
    complexity: "時間 O(n log n)；空間 O(n)。",
    pitfall: "題目算的是出現次數，兩個較小值都在區間內就要加 2；答案用 64 位元。",
    traceLabel: "公開範例：3、1、2、1、3、2",
    trace: [
      { title: "記錄兩個端點", description: "採 1 起算的位置：1 在 (2,4)、2 在 (3,6)、3 在 (1,5)。", cells: ["3", "1", "2", "1", "3", "2"], variables: [["啟用位置", "空"], ["總和", "0"]] },
      { title: "先處理數字 1", description: "沒有更小數字，低窪值 0；接著啟用位置 2、4。", cells: ["未啟用", "1", "未啟用", "1", "未啟用", "未啟用"], active: [1, 3], variables: [["低窪值(1)", "0"], ["總和", "0"]] },
      { title: "處理數字 2", description: "位置 3 與 6 之間只有位置 4 的 1 已啟用，貢獻 1；再啟用兩個 2。", cells: ["未啟用", "1", "2", "1", "未啟用", "2"], active: [3], variables: [["低窪值(2)", "1"], ["總和", "1"]] },
      { title: "處理數字 3", description: "位置 1 與 5 之間的 1、2、1 都較小，貢獻 3，合計 4。", cells: ["3", "1", "2", "1", "3", "2"], active: [1, 2, 3], variables: [["低窪值(3)", "3"], ["答案", "4"]] },
    ],
    cpp: String.raw`#include <bits/stdc++.h>
using namespace std;
int main() {
    ios::sync_with_stdio(false); cin.tie(nullptr);
    int n; cin >> n;
    vector<int> first(n+1),second(n+1),bit(2*n+1);
    for (int i=1;i<=2*n;i++) {
        int x; cin >> x;
        if (!first[x]) first[x]=i; else second[x]=i;
    }
    auto sum=[&](int i) {
        int result=0;
        for (;i>0;i-=i&-i) result+=bit[i];
        return result;
    };
    auto add=[&](int i) {
        for (;i<=2*n;i+=i&-i) ++bit[i];
    };
    long long answer=0;
    for (int x=1;x<=n;x++) {
        answer+=sum(second[x]-1)-sum(first[x]);
        add(first[x]); add(second[x]);
    }
    cout << answer << '\n';
}`,
    python: String.raw`import sys
data = iter(map(int, sys.stdin.buffer.read().split()))
n = next(data)
first = [0] * (n + 1)
second = [0] * (n + 1)
size = 2 * n
for i in range(1, size + 1):
    x = next(data)
    if first[x] == 0:
        first[x] = i
    else:
        second[x] = i
bit = [0] * (size + 1)
def prefix(i):
    result = 0
    while i:
        result += bit[i]
        i -= i & -i
    return result
def add(i):
    while i <= size:
        bit[i] += 1
        i += i & -i
answer = 0
for x in range(1, n + 1):
    answer += prefix(second[x] - 1) - prefix(first[x])
    add(first[x])
    add(second[x])
print(answer)
`,
  }),
  definePastExamLesson("a422", {
    concept: "逐列動態規劃・左右雙向掃描",
    goal: "把每列內不回頭的走法拆成左向與右向兩種，線性轉移。",
    explanation: [
      "因為不能向上走，一旦離開某列就不會回來。在同一列若先向左再向右（或相反），就會重訪格子，因此合法路徑在每列只能沿單一方向走一段。令 prev[j] 表示上一列以第 j 欄結束的最大經驗，進入本列後只有從上方進入或沿本列繼續前進兩種來源。",
      "由左到右計算 left[j]=a[j]+max(prev[j],left[j−1])；由右到左計算 right[j]=a[j]+max(prev[j],right[j+1])。新的 dp[j] 取兩者最大，便包含所有進入欄位與合法橫走方向。兩次掃描都只能使用舊 prev，不能讓左掃的結果流入右掃，否則會拼出重訪的路徑。",
      "第一列之前把 prev 的各欄設成 0，表示可從第一列任意位置開始；每次轉移仍一定加上本格，所以全負資料不會錯選空路徑。讀完最後一列，取所有結尾欄位的最大值。單列情況自然退化成最大非空連續子陣列。",
    ],
    complexity: "時間 O(mn)；空間 O(n)，逐列讀入並保留滾動 DP。",
    pitfall: "不能允許每一列重新起步；只有第一列之前的 prev 為 0。答案可能是負數。",
    traceLabel: "公開範例：單列 [2,1,4,−7,4]",
    trace: [
      { title: "任意欄皆可作起點", description: "虛擬上一列為全 0，從本列任一格開始都合法。", cells: ["2", "1", "4", "−7", "4"], variables: [["prev", "[0,0,0,0,0]"]] },
      { title: "由左向右掃描", description: "連續取前三格得到 7；跨過 −7 後為 0，最後一格得到 4。", cells: ["2", "3", "7", "0", "4"], active: [2], variables: [["left", "[2,3,7,0,4]"]] },
      { title: "由右向左掃描", description: "每格比較直接開始或接右邊；右向狀態為 [7,5,4,−3,4]。", cells: ["7", "5", "4", "−3", "4"], active: [0], variables: [["right", "[7,5,4,−3,4]"]] },
      { title: "合併結尾狀態", description: "各欄取左右最大為 [7,5,7,0,4]；最大經驗為 7，路徑可走前三格。", cells: ["7", "5", "7", "0", "4"], active: [0, 2], variables: [["答案", "7"]] },
    ],
    cpp: String.raw`#include <bits/stdc++.h>
using namespace std;
int main() {
    ios::sync_with_stdio(false); cin.tie(nullptr);
    int m,n; cin >> m >> n;
    vector<long long> prev(n,0),row(n),left(n),right(n);
    for (int i=0;i<m;i++) {
        for (auto &x:row) cin >> x;
        left[0]=prev[0]+row[0];
        for (int j=1;j<n;j++) left[j]=row[j]+max(prev[j],left[j-1]);
        right[n-1]=prev[n-1]+row[n-1];
        for (int j=n-2;j>=0;j--) right[j]=row[j]+max(prev[j],right[j+1]);
        for (int j=0;j<n;j++) prev[j]=max(left[j],right[j]);
    }
    cout << *max_element(prev.begin(),prev.end()) << '\n';
}`,
    python: String.raw`import sys
read = sys.stdin.buffer.readline
m, n = map(int, read().split())
prev = [0] * n
for _ in range(m):
    row = list(map(int, read().split()))
    left = [0] * n
    right = [0] * n
    left[0] = prev[0] + row[0]
    for j in range(1, n):
        left[j] = row[j] + max(prev[j], left[j - 1])
    right[-1] = prev[-1] + row[-1]
    for j in range(n - 2, -1, -1):
        right[j] = row[j] + max(prev[j], right[j + 1])
    prev = [max(left[j], right[j]) for j in range(n)]
print(max(prev))
`,
  }),
  definePastExamLesson("a423", {
    concept: "同步模擬・以鄰接關係累計人口變化",
    goal: "所有移出量從當日舊人口計算，累加到另一份陣列後才換日。",
    explanation: [
      "先只為非負格建立城市編號，並預先列出上下左右真正存在的鄰居。某城市一天對每個鄰居都送出 floor(人口/k) 人，因此總移出是這個商乘以鄰居數；沒有城市或地圖外的方向不能移出。",
      "每天複製舊人口為 next，再對每座城市從 next 扣掉總移出、向各鄰居的 next 加上同樣數量。所有商都讀自舊人口，不會讓今天收到的人在今天再次搬走。每條遷移都一減一加，故總人口守恆；k≥4 且鄰居至多 4，也保證不會移出超過原人口。",
      "完成 m 天後只在城市人口中取最小與最大，不能把 -1 的非城市一起比較。若整張圖皆為非城市，題敘未定義極值；程式將空集合約定輸出 0、0。",
    ],
    complexity: "時間 O(RC+mRC)；空間 O(RC)，每座城市的鄰居至多四個。",
    pitfall: "不能一邊修改人口一邊計算其他城市的移出量；人口為 0 仍是城市。",
    traceLabel: "公開範例：k=4，模擬一天",
    trace: [
      { title: "建立城市鄰居", description: "人口 10 的城市鄰接 2 與 5；右下人口 2 的城市沒有鄰居。", cells: ["10", "2", "非城市", "5", "非城市", "2"], variables: [["總人口", "19"], ["各城市每邊移出", "2,0,1,0"]] },
      { title: "人口 10 向兩邊移出", description: "從 10 扣除 2×2，向右方 2 與下方 5 各加 2。其他移出仍讀舊人口。", cells: ["6", "4", "非城市", "7", "非城市", "2"], active: [0, 1, 3], variables: [["已累計城市", "原人口10"], ["舊人口5的每邊移出", "1"]] },
      { title: "人口 5 送回一人", description: "原人口 5 的城市送 1 給左上，完成後各城市為 7、4、6、2。", cells: ["7", "4", "非城市", "6", "非城市", "2"], active: [0, 3], variables: [["總人口", "19"], ["最少／最多", "2／7"]] },
    ],
    cpp: String.raw`#include <bits/stdc++.h>
using namespace std;
int main() {
    ios::sync_with_stdio(false); cin.tie(nullptr);
    int R,C,k,days; cin >> R >> C >> k >> days;
    vector<vector<int>> id(R,vector<int>(C,-1));
    vector<int> population;
    for (int r=0;r<R;r++) for (int c=0;c<C;c++) {
        int x; cin >> x;
        if (x>=0) { id[r][c]=population.size(); population.push_back(x); }
    }
    vector<vector<int>> adj(population.size());
    int dr[4]={-1,1,0,0}, dc[4]={0,0,-1,1};
    for (int r=0;r<R;r++) for (int c=0;c<C;c++) {
        if (id[r][c]<0) continue;
        for (int d=0;d<4;d++) {
            int nr=r+dr[d],nc=c+dc[d];
            if (nr>=0 && nr<R && nc>=0 && nc<C && id[nr][nc]>=0)
                adj[id[r][c]].push_back(id[nr][nc]);
        }
    }
    while (days--) {
        vector<int> next=population;
        for (int u=0;u<(int)population.size();u++) {
            int share=population[u]/k;
            next[u]-=share*(int)adj[u].size();
            for (int v:adj[u]) next[v]+=share;
        }
        population.swap(next);
    }
    if (population.empty()) cout << "0\n0\n";
    else cout << *min_element(population.begin(),population.end()) << '\n'
              << *max_element(population.begin(),population.end()) << '\n';
}`,
    python: String.raw`import sys
read = sys.stdin.buffer.readline
rows, cols, k, days = map(int, read().split())
city_id = [[-1] * cols for _ in range(rows)]
population = []
for r in range(rows):
    for c, x in enumerate(map(int, read().split())):
        if x >= 0:
            city_id[r][c] = len(population)
            population.append(x)
adj = [[] for _ in population]
for r in range(rows):
    for c in range(cols):
        u = city_id[r][c]
        if u < 0:
            continue
        for dr, dc in ((-1, 0), (1, 0), (0, -1), (0, 1)):
            nr, nc = r + dr, c + dc
            if 0 <= nr < rows and 0 <= nc < cols and city_id[nr][nc] >= 0:
                adj[u].append(city_id[nr][nc])
for _ in range(days):
    nxt = population.copy()
    for u, value in enumerate(population):
        share = value // k
        nxt[u] -= share * len(adj[u])
        for v in adj[u]:
            nxt[v] += share
    population = nxt
print(min(population, default=0))
print(max(population, default=0))
`,
  }),
  definePastExamLesson("a424", {
    concept: "枚舉分配・以總人數消去一個變數",
    goal: "枚舉第一工廠的 0 到 n 人，逐一計算完整總收益。",
    explanation: [
      "若第一工廠分到 x 人，第二工廠就必須分到 n−x 人，兩個變數因此只剩一個自由度。n≤100，直接檢查 x=0、1、…、n 共 n+1 種，將兩個二次收益式相加即可。",
      "所有合法的非負整數分配都恰好對應一個 x，所以枚舉最大值必定最優，不必假設收益函數是凸或凹。即使某廠 0 人，仍要計入該廠的常數項 C；若所有收益都負，初始最佳值也不能隨意設為 0。",
    ],
    complexity: "時間 O(n)；額外空間 O(1)。整數乘加以通常的定長整數成本計。",
    pitfall: "要包含 x=0 與 x=n；沒有人工作的工廠依公式仍貢獻 C。",
    traceLabel: "公開範例：n=2，收益式 2x²−x+3 與 4y²−5y+2",
    trace: [
      { title: "全部到第二廠", description: "x=0、y=2，兩廠收益為 3 與 8，合計 11。", cells: ["廠1:0人→3", "廠2:2人→8"], active: [0, 1], variables: [["總收益", "11"], ["best", "11"]] },
      { title: "兩廠各一人", description: "x=1、y=1，收益為 4 與 1，合計 5，未改善答案。", cells: ["廠1:1人→4", "廠2:1人→1"], variables: [["總收益", "5"], ["best", "11"]] },
      { title: "全部到第一廠", description: "x=2、y=0，收益為 9 與 2，合計也是 11，最大值維持 11。", cells: ["廠1:2人→9", "廠2:0人→2"], variables: [["總收益", "11"], ["輸出", "11"]] },
    ],
    cpp: String.raw`#include <bits/stdc++.h>
using namespace std;
int main() {
    ios::sync_with_stdio(false); cin.tie(nullptr);
    long long a1,b1,c1,a2,b2,c2;
    int n;
    cin >> a1 >> b1 >> c1 >> a2 >> b2 >> c2 >> n;
    long long best=LLONG_MIN;
    for (int x=0;x<=n;x++) {
        long long y=n-x;
        long long value=a1*x*x+b1*x+c1+a2*y*y+b2*y+c2;
        best=max(best,value);
    }
    cout << best << '\n';
}`,
    python: String.raw`import sys
a1, b1, c1, a2, b2, c2, n = map(int, sys.stdin.buffer.read().split())
best = None
for x in range(n + 1):
    y = n - x
    value = a1 * x * x + b1 * x + c1 + a2 * y * y + b2 * y + c2
    if best is None or value > best:
        best = value
print(best)
`,
  }),
  definePastExamLesson("a425", {
    concept: "隱式有向圖・BFS 最少操作",
    goal: "把一次移動加一次傳送視為一條邊，以 BFS 找最少操作數。",
    explanation: [
      "以每次操作結束時所在的格子作為圖的節點。從 u 出發，可能先落到 u−L 或 u+R，再恰好傳送一次到 S(落腳格)，因此每個節點最多兩條有向邊。落腳格及傳送目的地都要在 [0,n−1] 內，才是合法邊。",
      "每條邊都是一次操作，權重完全相同，所以從 0 做 BFS，第一次發現節點時的距離就是最少操作數。傳送後不要繼續套用 S，否則會改變題目定義。visited／distance 避免在傳送循環中無限重複；P=0 時直接得到 0，遍歷完仍未到 P 則輸出 −1。",
      "n 可達一百萬，Python 用緊密的整數 array 儲存 S、距離與佇列，不建立百萬份鄰接串列。鄰居在彈出節點時才產生，確保空間維持線性。",
    ],
    complexity: "時間 O(n)；空間 O(n)，每個可達節點至多檢查兩條邊。",
    pitfall: "先移動再傳送，而且只傳送一次；S(i) 為負數或超出 n 時要丟棄該操作。",
    traceLabel: "公開範例：n=5、P=3、L=1、R=2",
    trace: [
      { title: "起點進佇列", description: "dist[0]=0，其他格尚未到達；S=[0,2,4,3,1]。", cells: ["0:0", "1:∞", "2:∞", "3:∞", "4:∞"], active: [0], variables: [["佇列", "[0]"]] },
      { title: "由 0 移動並傳送", description: "向左落腳 −1 不合法；向右落腳 2，傳送至 S(2)=4，故 dist[4]=1。", cells: ["0:0", "1:∞", "2:∞", "3:∞", "4:1"], active: [4], variables: [["合法操作", "0 → 落腳2 → 4"], ["佇列", "[4]"]] },
      { title: "由 4 到目標", description: "向左落腳 3，再傳到 S(3)=3，距離為 2；向右落腳 6 不合法。", cells: ["0:0", "1:∞", "2:∞", "3:2", "4:1"], active: [3], variables: [["操作路線", "0 → 4 → 3"], ["答案", "2"]] },
    ],
    cpp: String.raw`#include <bits/stdc++.h>
using namespace std;
int main() {
    ios::sync_with_stdio(false); cin.tie(nullptr);
    int n,target,L,R; cin >> n >> target >> L >> R;
    vector<int> portal(n),dist(n,-1),queue;
    for (int &x:portal) cin >> x;
    queue.reserve(n);
    queue.push_back(0); dist[0]=0;
    for (size_t head=0;head<queue.size() && dist[target]<0;head++) {
        int u=queue[head];
        for (int landing:{u-L,u+R}) {
            if (landing<0 || landing>=n) continue;
            int v=portal[landing];
            if (v<0 || v>=n || dist[v]>=0) continue;
            dist[v]=dist[u]+1;
            queue.push_back(v);
        }
    }
    cout << dist[target] << '\n';
}`,
    python: String.raw`import sys
from array import array
read = sys.stdin.buffer.readline
n, target, left, right = map(int, read().split())
portal = array('i', map(int, sys.stdin.buffer.read().split()))
dist = array('i', [-1]) * n
queue = array('i', [0])
dist[0] = 0
head = 0
while head < len(queue) and dist[target] < 0:
    u = queue[head]
    head += 1
    for landing in (u - left, u + right):
        if not 0 <= landing < n:
            continue
        v = portal[landing]
        if 0 <= v < n and dist[v] == -1:
            dist[v] = dist[u] + 1
            queue.append(v)
print(dist[target])
`,
  }),
  definePastExamLesson("a426", {
    concept: "0/1 子集合和・位元集合動態規劃",
    goal: "先扣掉原有空櫃，再找至少補足缺額的最小可達歸還總數。",
    explanation: [
      "目前借出 used=Σx[i]，所以已有 M−used 個空櫃。真正需要收回的下限為 need=max(0,S−(M−used))；若 need=0，直接輸出 0。對借用者只能全部收回或不收回，因此歸還數必須是某個子集合的總和，不能只看借用者的人數或貪心選最大。",
      "用位元集合 bits 的第 s 位表示能否恰好收回 s 個櫃，初始只有第 0 位為 1。處理一個借用量 x 時，bits |= bits << x 同時保留不收回的選擇，並加入原可達和加 x 的選擇；右側從舊 bits 計算，恰好保證一個人只使用一次。",
      "最後取不小於 need 的最低可達位元。Python 將 bits 右移 need，再用 z & −z 擷取最低的 1；C++ 從 need 向上檢查 bitset。所有借用量總和不超過 M，位元長度只需 M+1，且收回全部一定能滿足 S≤M。",
    ],
    complexity: "位元 DP 時間 O(N⌈M/w⌉+M)、空間 O(M) 位元加 O(N) 輸入；w 為位元運算字寬，Python 大整數按其內部字塊計。C++ 固定配置上限 100001 位元。",
    pitfall: "答案是最少收回的櫃數，不是最少被要求歸還的人數；原有空櫃應先抵扣。",
    traceLabel: "公開範例：M=20、S=14，借用量 [1,7,2,8,2]",
    trace: [
      { title: "計算缺額", description: "借用總數 20，所以空櫃為 0，至少要收回 14。", cells: ["1", "7", "2", "8", "2"], variables: [["need", "14"], ["可達和", "{0}"]] },
      { title: "處理前三人", description: "加入 1、7、2 後，可達和為 0、1、2、3、7、8、9、10。", cells: ["0", "1", "2", "3", "7", "8", "9", "10"], variables: [["已處理", "1,7,2"], ["最大可達", "10"]] },
      { title: "加入借用 8 的人", description: "把舊可達和全部平移 8，新增 8、9、10、11、15、16、17、18。14 仍不可達。", cells: ["11可達", "12否", "13否", "14否", "15可達", "16可達"], active: [4], variables: [["目前最小達標", "15=7+8"]] },
      { title: "最後加入 2", description: "新增的 2 仍無法組成 14；最低達標和維持 15。", cells: ["12可達", "13可達", "14否", "15可達"], active: [3], variables: [["輸出", "15"]] },
    ],
    cpp: String.raw`#include <bits/stdc++.h>
using namespace std;
int main() {
    ios::sync_with_stdio(false); cin.tie(nullptr);
    int M,S,N; cin >> M >> S >> N;
    vector<int> x(N);
    int used=0;
    for (int &v:x) { cin >> v; used+=v; }
    int need=max(0,S-(M-used));
    bitset<100001> possible;
    possible[0]=1;
    if (need==0) { cout << 0 << '\n'; return 0; }
    for (int v:x) possible|=possible<<v;
    for (int total=need;total<=used;total++) {
        if (possible[total]) { cout << total << '\n'; break; }
    }
}`,
    python: String.raw`import sys
data = iter(map(int, sys.stdin.buffer.read().split()))
total, required, n = next(data), next(data), next(data)
borrowed = [next(data) for _ in range(n)]
need = max(0, required - (total - sum(borrowed)))
if need == 0:
    print(0)
else:
    bits = 1
    for x in borrowed:
        bits |= bits << x
    candidates = bits >> need
    lowest = candidates & -candidates
    print(need + lowest.bit_length() - 1)
`,
  }),
  definePastExamLesson("a427", {
    concept: "字串統計・複合比較鍵",
    goal: "依相異字母數優先、字典序次之，維護目前最佳字串。",
    explanation: [
      "對每個字串建立字母集合，集合大小就是相異字母數。例如 ABBCAAB 雖有七個字元，相異字母只有 A、B、C 三種。大寫字母只有 26 種，可用布林陣列或集合線性掃描計算。",
      "比較兩個候選時先比相異字母數，數量較少者勝；相同時直接比較原字串的字典序。依這個二層比較規則，只需保存目前最佳字串，每次取較佳者，最後就等同在所有輸入中取最小比較鍵。不能把字母排序後的字串拿來破同分。",
    ],
    complexity: "時間 O(T)，T 為全部輸入字元數，包含逐次字典序比較；空間 O(Lmax+26)，逐行處理。",
    pitfall: "比較原字串而不是相異字母組成的集合；前綴相同時較短字串優先。",
    traceLabel: "公開範例：ABBCAAB、AABBACC、AAPPCCSS",
    trace: [
      { title: "第一個候選", description: "ABBCAAB 的集合是 {A,B,C}，先作為目前答案。", cells: ["ABBCAAB", "A:有", "B:有", "C:有"], active: [0], variables: [["相異數", "3"], ["best", "ABBCAAB"]] },
      { title: "同分比較字典序", description: "AABBACC 也有 3 種；第一字 A 相同，第二字 A 小於 B，所以更新。", cells: ["A A BBACC", "A B BCAAB"], active: [0], variables: [["比較鍵", "(3,AABBACC) < (3,ABBCAAB)"], ["best", "AABBACC"]] },
      { title: "第三字串種類較多", description: "AAPPCCSS 含 A、P、C、S 共 4 種，不需靠字典序勝出。", cells: ["AABBACC:3種", "AAPPCCSS:4種"], active: [0], variables: [["輸出", "AABBACC"]] },
    ],
    cpp: String.raw`#include <bits/stdc++.h>
using namespace std;
int main() {
    ios::sync_with_stdio(false); cin.tie(nullptr);
    int n; cin >> n;
    string best;
    int bestCount=27;
    for (int i=0;i<n;i++) {
        string s; cin >> s;
        array<bool,26> seen{};
        int count=0;
        for (char c:s) {
            if (!seen[c-'A']) { seen[c-'A']=true; ++count; }
        }
        if (count<bestCount || (count==bestCount && s<best)) {
            bestCount=count;
            best=s;
        }
    }
    cout << best << '\n';
}`,
    python: String.raw`import sys
read = sys.stdin.buffer.readline
n = int(read())
best = None
best_count = 27
for _ in range(n):
    s = read().strip()
    count = len(set(s))
    if count < best_count or (count == best_count and s < best):
        best_count = count
        best = s
sys.stdout.buffer.write(best + b'\n')
`,
  }),
  definePastExamLesson("a428", {
    concept: "答案二分搜尋・最左未覆蓋點的貪心",
    goal: "二分直徑，利用最少區間數判斷 K 座基地台能否覆蓋。",
    explanation: [
      "先將服務點排序。給定直徑 D，若目前最左未覆蓋點是 x，覆蓋它的基地台可以把區間左端放在 x、右端放在 x+D。把任何覆蓋 x 的區間向右移到這個位置，不會失去尚未處理的較左點，並讓右端盡量遠，所以這個選擇不比任何其他選擇差。",
      "依序跳過所有不超過 x+D 的點，再從下一個未覆蓋點開新區間，得到此 D 所需的最少基地台數。若不超過 K 就可行；D 越大只會更容易覆蓋，故可在 [1,max(1,最大座標−最小座標)] 二分第一個可行值。",
      "這裡 D 是區間長度，不是半徑；基地台可放在半整數或任意實數位置，不影響貪心區間的合法性。本站直徑規格要求至少 1，所以所有座標重複時答案仍為 1。",
    ],
    complexity: "時間 O(N log N+N log max(2,座標跨度))；空間 O(N)。",
    pitfall: "閉區間端點 x+D 仍被覆蓋；座標要先排序，且二分下界是 1。",
    traceLabel: "公開第一例：排序為 [1,2,5,7,8]、K=2",
    trace: [
      { title: "試直徑 4", description: "第一區間 [1,5] 覆蓋三點，第二區間 [7,11] 覆蓋剩餘兩點，可以完成。", cells: ["1", "2", "5", "7", "8"], active: [0, 1, 2], variables: [["D", "4"], ["使用基地台", "2，成立"]] },
      { title: "試直徑 2", description: "依序需要 [1,3]、[5,7]、[8,10]，共三座，超過 K。", cells: ["[1,2]", "[5,7]", "[8]"], active: [2], variables: [["D", "2"], ["使用基地台", "3，不成立"]] },
      { title: "試直徑 3", description: "[1,4] 覆蓋 1、2；[5,8] 覆蓋 5、7、8，剛好兩座。", cells: ["[1,2]", "[5,7,8]"], active: [0, 1], variables: [["D", "3"], ["答案", "3"]] },
    ],
    cpp: String.raw`#include <bits/stdc++.h>
using namespace std;
int main() {
    ios::sync_with_stdio(false); cin.tie(nullptr);
    int n,k; cin >> n >> k;
    vector<long long> p(n);
    for (auto &x:p) cin >> x;
    sort(p.begin(),p.end());
    auto feasible=[&](long long d) {
        int count=0;
        long long end=-1;
        for (long long x:p) {
            if (x>end) {
                if (++count>k) return false;
                end=x+d;
            }
        }
        return true;
    };
    long long low=1,high=max(1LL,p.back()-p.front());
    while (low<high) {
        long long mid=low+(high-low)/2;
        if (feasible(mid)) high=mid; else low=mid+1;
    }
    cout << low << '\n';
}`,
    python: String.raw`import sys
data = iter(map(int, sys.stdin.buffer.read().split()))
n, k = next(data), next(data)
points = sorted(next(data) for _ in range(n))
def feasible(diameter):
    count = 0
    end = -1
    for x in points:
        if x > end:
            count += 1
            if count > k:
                return False
            end = x + diameter
    return True
low, high = 1, max(1, points[-1] - points[0])
while low < high:
    mid = (low + high) // 2
    if feasible(mid):
        high = mid
    else:
        low = mid + 1
print(low)
`,
  }),
  definePastExamLesson("a429", {
    concept: "相鄰交換論證・重量與取用次數的比例排序",
    goal: "依重量除以頻率遞增，由上到下堆疊並累加取用成本。",
    explanation: [
      "只看相鄰兩件 a、b，a 在 b 上方時，這對物品造成的能量是 w[a]×f[b]；反過來是 w[b]×f[a]。其他物品的相對上下關係沒有改變，所以 a 放在上方較佳的條件恰是 w[a]×f[b]≤w[b]×f[a]，也就是重量／取用次數較小者在上。",
      "用交叉相乘比較，避免浮點比例誤差。若順序中有違反這個條件的相鄰對，交換就不會增加成本；持續交換最後會得到按比例排序的順序，因而排序後是最優解。比例相等時任何先後皆可。",
      "從上到下掃描，above 保存目前上方總重量。加入物品 i 時，它的所有取用總耗能正是 above×f[i]，累加後再把 w[i] 加入 above。頂端物品 above=0，不需要舉起自己；總能量使用 64 位元整數。",
    ],
    complexity: "時間 O(N log N)；空間 O(N)。",
    pitfall: "頻率高不一定要放最上方，要比較重量／頻率；計算耗能後才把自身重量加入前綴。",
    traceLabel: "公開第二例：重量 [3,4,5]，次數 [1,2,3]",
    trace: [
      { title: "排序比例", description: "三件重量／頻率為 3、2、5/3，所以由上到下依序為重 5、4、3。", cells: ["(5,3)", "(4,2)", "(3,1)"], variables: [["above", "0"], ["能量", "0"]] },
      { title: "最上層不需搬開其他物品", description: "重 5 的物品取用 3 次，耗能為 0×3=0，接著 above=5。", cells: ["(5,3)", "(4,2)", "(3,1)"], active: [0], variables: [["above", "5"], ["累計能量", "0"]] },
      { title: "中間層取用兩次", description: "每次需舉起重 5 的物品，增加 5×2=10，之後 above=9。", cells: ["(5,3)", "(4,2)", "(3,1)"], active: [1], variables: [["above", "9"], ["累計能量", "10"]] },
      { title: "底層取用一次", description: "需舉起重量 5+4=9，增加 9×1，最小總能量為 19。", cells: ["(5,3)", "(4,2)", "(3,1)"], active: [2], variables: [["新增能量", "9"], ["答案", "19"]] },
    ],
    cpp: String.raw`#include <bits/stdc++.h>
using namespace std;
int main() {
    ios::sync_with_stdio(false); cin.tie(nullptr);
    int n; cin >> n;
    vector<pair<long long,long long>> items(n);
    for (auto &item:items) cin >> item.first;
    for (auto &item:items) cin >> item.second;
    sort(items.begin(),items.end(),[](const auto &a,const auto &b) {
        return a.first*b.second<b.first*a.second;
    });
    long long above=0,answer=0;
    for (auto [weight,frequency]:items) {
        answer+=above*frequency;
        above+=weight;
    }
    cout << answer << '\n';
}`,
    python: String.raw`import sys
from functools import cmp_to_key
data = iter(map(int, sys.stdin.buffer.read().split()))
n = next(data)
weights = [next(data) for _ in range(n)]
items = [(w, next(data)) for w in weights]
def compare(a, b):
    cross = a[0] * b[1] - b[0] * a[1]
    return (cross > 0) - (cross < 0)
items.sort(key=cmp_to_key(compare))
above = 0
answer = 0
for weight, frequency in items:
    answer += above * frequency
    above += weight
print(answer)
`,
  }),
  definePastExamLesson("a430", {
    concept: "樹的高度・從葉向根的佇列動態規劃",
    goal: "先完成葉節點，再把高度向父節點傳遞，找根並加總高度。",
    explanation: [
      "讀入每條父子關係時，記錄 parent[child]=i，並記下 i 有多少孩子尚未完成。最後 parent=0 的唯一節點就是根。葉節點沒有孩子，高度立即確定為 0，可以先全部放進佇列。",
      "每次取出已完成的節點 v，把父節點 p 的高度更新為 max(height[p],height[v]+1)，再把 p 未完成的孩子數減一。只有當所有孩子都完成時，p 才進入佇列，此時它的高度已經是所有孩子高度的最大值加一。依此從葉向根處理，每個節點都會得到正確高度。",
      "節點出佇列時把其高度加入總和即可，不需建立遞迴呼叫，因此鏈狀的十萬節點也安全。單一節點同時是根與葉，輸出該編號與高度總和 0；鏈狀樹的總和可達 N(N−1)/2，C++ 使用 64 位元。",
    ],
    complexity: "時間 O(N)；空間 O(N)，樹恰有 N−1 條父子關係。",
    pitfall: "高度是到最遠葉的邊數，葉高度為 0；不可把從根算的深度當作高度。",
    traceLabel: "公開第一例：根 5，子樹 3→{1,4}、2→{6,7}",
    trace: [
      { title: "找根與所有葉", description: "只有節點 5 沒有父親；1、4、6、7 沒有孩子，先進佇列。", cells: ["1:h0", "4:h0", "6:h0", "7:h0", "3:?", "2:?", "5:?"], active: [0, 1, 2, 3], variables: [["根", "5"], ["總和", "0"]] },
      { title: "節點 3 的孩子都完成", description: "處理葉 1 與 4 後，節點 3 高度為 max(0,0)+1=1。", cells: ["1:h0", "4:h0", "6:h0", "7:h0", "3:h1", "2:?", "5:?"], active: [4], variables: [["3 的未完成孩子", "0"], ["3 可入列", "是"]] },
      { title: "節點 2 同樣得到高度 1", description: "葉 6 與 7 完成後，節點 2 的高度為 1；兩個內部節點先後加入總和。", cells: ["1:h0", "4:h0", "6:h0", "7:h0", "3:h1", "2:h1", "5:?"], active: [4, 5], variables: [["已計總和", "2"]] },
      { title: "最後完成根", description: "根 5 的兩個孩子高度皆為 1，所以根高度 2；全部高度總和為 4。", cells: ["1:h0", "4:h0", "6:h0", "7:h0", "3:h1", "2:h1", "5:h2"], active: [6], variables: [["根", "5"], ["H(T)", "4"]] },
    ],
    cpp: String.raw`#include <bits/stdc++.h>
using namespace std;
int main() {
    ios::sync_with_stdio(false); cin.tie(nullptr);
    int n; cin >> n;
    vector<int> parent(n+1),remaining(n+1),height(n+1);
    for (int v=1;v<=n;v++) {
        cin >> remaining[v];
        for (int j=0;j<remaining[v];j++) {
            int u; cin >> u; parent[u]=v;
        }
    }
    queue<int> ready;
    int root=0;
    for (int v=1;v<=n;v++) {
        if (!parent[v]) root=v;
        if (!remaining[v]) ready.push(v);
    }
    long long total=0;
    while (!ready.empty()) {
        int v=ready.front(); ready.pop();
        total+=height[v];
        int p=parent[v];
        if (p) {
            height[p]=max(height[p],height[v]+1);
            if (--remaining[p]==0) ready.push(p);
        }
    }
    cout << root << '\n' << total << '\n';
}`,
    python: String.raw`import sys
from collections import deque
read = sys.stdin.buffer.readline
n = int(read())
parent = [0] * (n + 1)
remaining = [0] * (n + 1)
height = [0] * (n + 1)
for v in range(1, n + 1):
    row = list(map(int, read().split()))
    remaining[v] = row[0]
    for u in row[1:]:
        parent[u] = v
ready = deque()
root = 0
for v in range(1, n + 1):
    if parent[v] == 0:
        root = v
    if remaining[v] == 0:
        ready.append(v)
total = 0
while ready:
    v = ready.popleft()
    total += height[v]
    p = parent[v]
    if p:
        height[p] = max(height[p], height[v] + 1)
        remaining[p] -= 1
        if remaining[p] == 0:
            ready.append(p)
print(root)
print(total)
`,
  }),
];
