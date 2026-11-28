import { defineToiBeginnerLesson } from "@/lib/toiBeginnerLessonBuilder";
import type { ToiBeginnerLesson } from "@/lib/toiBeginnerLessonTypes";

type Frame = [string, string, string[]];
const frames = (...steps: Frame[]) =>
  steps.map(([title, description, cells]) => ({
    title,
    description,
    cells,
    active: cells.map((_, i) => i),
    variables: [["本步結果", cells[cells.length - 1]]] as [string, string][],
  }));

export const lessons: ToiBeginnerLesson[] = [
  defineToiBeginnerLesson("a225", {
    topic: "simulation",
    concept: "依帳號類型累計在線網站",
    goal: "依登入、整類登出指令更新各類型的網站數，最後加總。",
    explanation: [
      "用計數表記錄每個類型仍在線的網站數。登入只將該類型加一；登出則將該類型清為零，並不影響其他類型。",
      "先判斷整對輸入是否為 -1 -1，再執行指令。Y 本身可以是 -1，不能看到 Y=-1 就結束。範例類型 7 先登入兩次後全部登出，再登入一次，連同類型 8 的一次，共剩 2 個網站。",
    ],
    complexity: "時間 O(Q) ・ 狀態表 O(102)，Python整批輸入另需O(Q)，Q為指令數",
    pitfall: "0 Y 是清空該類型，不能只減一；同類型登出後仍可重新登入。",
    traceLabel: "範例登入紀錄",
    trace: frames(
      ["前三次登入", "7、8、7 依序登入。", ["類型7：2", "類型8：1"]],
      ["登出類型7", "0 7 將兩個類型7網站一起登出。", ["類型7：0", "類型8：1"]],
      [
        "再次登入",
        "1 7 後遇到終止記號，總數為2。",
        ["類型7：1", "類型8：1", "輸出：2"],
      ],
    ),
    cpp: String.raw`#include <iostream>
#include <array>
using namespace std;
int main(){
    array<int,102> count{};
    int x,y;
    while(cin>>x>>y){
        if(x==-1 && y==-1) break;
        if(x==1) ++count[y+1]; else count[y+1]=0;
    }
    int total=0; for(int c:count) total+=c;
    cout<<total<<'\n';
}`,
    python: String.raw`import sys
it = iter(map(int, sys.stdin.buffer.read().split()))
count = [0] * 102
for x, y in zip(it, it):
    if x == -1 and y == -1:
        break
    if x == 1:
        count[y + 1] += 1
    else:
        count[y + 1] = 0
print(sum(count))`,
  }),
  defineToiBeginnerLesson("a226", {
    topic: "arrays",
    concept: "雙門檻前綴累加",
    goal: "找出雨量和日照首次同時達標的下一週。",
    explanation: [
      "輸入先給整列雨量，再給整列日照，必須依相同週次配對。逐週累加兩種觀測值，只在兩個累計都達標時停止。",
      "若第 k 週結束首次達標，開花週次是 k+1。最後一週才達標也要輸出 N+1；整段都未達標才是 -1。範例第3週累積雨量6、日照6，因此第4週開花。",
    ],
    complexity: "時間 O(N) ・ 空間 O(N)",
    pitfall: "不能把兩種門檻用「或」連接，也不能輸出達標當週。",
    traceLabel: "範例逐週累計",
    trace: frames(
      ["第1週", "雨量2、日照1，尚未達標。", ["雨：2/6", "光：1/6"]],
      ["第2週", "日照已達標，但雨量仍不足。", ["雨：2/6", "光：6/6"]],
      [
        "第3週",
        "兩者同時達標，下一週開花。",
        ["雨：6/6", "光：6/6", "輸出：4"],
      ],
    ),
    cpp: String.raw`#include <iostream>
#include <vector>
using namespace std;
int main(){
    int n; cin>>n; vector<int> a(n),b(n);
    for(int &x:a) cin>>x; for(int &x:b) cin>>x;
    int r,l; cin>>r>>l; int rain=0,light=0,ans=-1;
    for(int i=0;i<n;++i){rain+=a[i];light+=b[i];
        if(rain>=r && light>=l){ans=i+2;break;}}
    cout<<ans<<'\n';
}`,
    python: String.raw`import sys
d = list(map(int, sys.stdin.buffer.read().split()))
n = d[0]
rain = light = 0
r, l = d[1 + 2*n:3 + 2*n]
answer = -1
for i in range(n):
    rain += d[1 + i]
    light += d[1 + n + i]
    if rain >= r and light >= l:
        answer = i + 2
        break
print(answer)`,
  }),
  defineToiBeginnerLesson("a227", {
    topic: "grid",
    concept: "雙緩衝同步鄰居更新",
    goal: "模擬K天分數變化，輸出總分差。",
    explanation: [
      "每格分別統計存在的上下左右鄰居數，以及嚴格較高、嚴格較低的數量。只有 2×較高數 > 鄰居數 才加一，較低同理；相等的鄰居仍計入分母。",
      "每天用舊矩陣計算整張新矩陣，完成後交換。這保證同一天的計算不會讀到剛更新的分數。沒有鄰居時兩個嚴格多數條件皆不成立。最後總分減去原總分即為答案。",
    ],
    complexity: "時間 O(KHW) ・ 空間 O(HW)",
    pitfall: "不可原地逐格更新；過半是嚴格大於一半，兩票對四鄰居不構成多數。",
    traceLabel: "範例兩天同步更新",
    trace: frames(
      ["初始總分24", "所有比較先讀這張原圖。", ["2 8 3", "4 1 6"]],
      [
        "第1天總分24",
        "例如左上2的兩個鄰居都較高，因此變3。",
        ["3 7 4", "3 2 5"],
      ],
      [
        "第2天總分24",
        "根據第1天整張圖再次同步更新，差為0。",
        ["3 6 5", "3 3 4", "輸出：0"],
      ],
    ),
    cpp: String.raw`#include <iostream>
#include <vector>
using namespace std;
int main(){
    int h,w,k;cin>>h>>w>>k;vector<vector<int>> a(h,vector<int>(w)),b=a;
    long long initial=0;for(auto &row:a)for(int &v:row){cin>>v;initial+=v;}
    int dr[]={-1,1,0,0},dc[]={0,0,-1,1};
    while(k--){for(int r=0;r<h;++r)for(int c=0;c<w;++c){
        int n=0,hi=0,lo=0;
        for(int t=0;t<4;++t){int x=r+dr[t],y=c+dc[t];
            if(x>=0&&x<h&&y>=0&&y<w){++n;hi+=a[x][y]>a[r][c];lo+=a[x][y]<a[r][c];}}
        b[r][c]=a[r][c]+(2*hi>n)-(2*lo>n);
    }a.swap(b);}
    long long total=0;for(auto &row:a)for(int v:row)total+=v;
    cout<<total-initial<<'\n';
}`,
    python: String.raw`import sys
it = iter(map(int, sys.stdin.buffer.read().split()))
h, w, k = next(it), next(it), next(it)
a = [[next(it) for _ in range(w)] for _ in range(h)]
initial = sum(map(sum, a))
for _ in range(k):
    b = [row[:] for row in a]
    for r in range(h):
        for c in range(w):
            n = hi = lo = 0
            for x, y in ((r-1,c), (r+1,c), (r,c-1), (r,c+1)):
                if 0 <= x < h and 0 <= y < w:
                    n += 1
                    hi += a[x][y] > a[r][c]
                    lo += a[x][y] < a[r][c]
            b[r][c] += (2*hi > n) - (2*lo > n)
    a = b
print(sum(map(sum, a)) - initial)`,
  }),
  defineToiBeginnerLesson("a228", {
    topic: "search-optimization",
    concept: "合併相接區間與雙指標交集",
    goal: "找出可容納D時間單位的最早共同空閒區間。",
    explanation: [
      "每人的區間已排序。先合併端點相接的區間：例如 [2,9] 與 [9,12] 可連續使用到12，沒有時間空隙。",
      "以兩個指標比較目前兩區間，其交集為 [max(s1,s2), min(e1,e2)]。若長度至少D，最早可從交集起點開始；否則將結束時間較早者往後移，因為它不可能與另一人更晚的區間產生更早的答案。",
      "範例先有交集[5,9]長4，不足8；之後[19,30]長11，因此輸出19 27。",
    ],
    complexity: "時間 O(N+M) ・ 空間 O(N+M)",
    pitfall:
      "長度是 end-start；恰好D可用。相接的同人區間先合併，以免漏掉跨端點的連續空閒。",
    traceLabel: "範例區間交集",
    trace: frames(
      ["第一對區間", "[2,9]與[5,11]交集不足8。", ["交集：5..9", "長度：4"]],
      [
        "移動第一人",
        "[15,30]與[5,11]沒有交集，第二人移動。",
        ["起點：15", "終點：11"],
      ],
      [
        "找到足夠交集",
        "[15,30]與[19,40]可連續討論8單位。",
        ["交集：19..30", "輸出：19 27"],
      ],
    ),
    cpp: String.raw`#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;
vector<pair<int,int>> read(int n){
    vector<pair<int,int>> v;while(n--){int s,e;cin>>s>>e;
        if(!v.empty()&&s<=v.back().second)v.back().second=max(e,v.back().second);
        else v.push_back({s,e});}return v;
}
int main(){int n,m;cin>>n>>m;auto a=read(n),b=read(m);int d;cin>>d;
    size_t i=0,j=0;while(i<a.size()&&j<b.size()){
        int s=max(a[i].first,b[j].first),e=min(a[i].second,b[j].second);
        if(e-s>=d){cout<<s<<' '<<s+d<<'\n';return 0;}
        if(a[i].second<=b[j].second)++i;else ++j;
    }cout<<-1<<'\n';
}`,
    python: String.raw`import sys
it = iter(map(int, sys.stdin.buffer.read().split()))
n, m = next(it), next(it)
def read(count):
    result = []
    for _ in range(count):
        s, e = next(it), next(it)
        if result and s <= result[-1][1]:
            result[-1][1] = max(result[-1][1], e)
        else:
            result.append([s, e])
    return result
a, b = read(n), read(m)
d = next(it)
i = j = 0
while i < len(a) and j < len(b):
    s, e = max(a[i][0], b[j][0]), min(a[i][1], b[j][1])
    if e - s >= d:
        print(s, s + d)
        break
    if a[i][1] <= b[j][1]:
        i += 1
    else:
        j += 1
else:
    print(-1)`,
  }),
  defineToiBeginnerLesson("a229", {
    topic: "read-calculate",
    concept: "商品時間加上隊伍間隔",
    goal: "比較三櫃檯清空隊伍的總秒數。",
    explanation: [
      "有p人、商品總件數s的隊伍，結帳共3s秒，只有相鄰顧客之間需走動，因此再加2(p-1)秒。",
      "分別讀取三隊商品數，計算時間後挑最小。範例前兩隊都是14秒，第三隊9秒最短。",
      "規格待釐清：本站題面與官方 Supermarket 原題都沒有指定最短時間平手時應輸出哪個櫃檯，也沒有保證答案唯一。程式保留較小編號只是實作約定，不是原題規定；平手資料是否被評測接受仍需出題者確認。",
    ],
    complexity: "時間 O(A+B+C) ・ C++額外空間 O(1)，Python含輸入O(A+B+C)",
    pitfall: "第一人前面與最後一人後面都不加2秒，不能使用2p。",
    traceLabel: "範例櫃檯比較",
    trace: frames(
      ["櫃檯1", "商品3+1件、兩人之間一次走動。", ["3×4+2：14秒"]],
      ["櫃檯2", "商品2+2件，同樣需要14秒。", ["櫃檯1：14", "櫃檯2：14"]],
      ["櫃檯3", "一人3件，沒有顧客間走動。", ["3×3：9秒", "輸出：3 9"]],
    ),
    cpp: String.raw`#include <iostream>
#include <climits>
using namespace std;
int main(){int n[3];for(int &v:n)cin>>v;int best=INT_MAX,id=0;
    for(int i=0;i<3;++i){int sum=0;for(int j=0;j<n[i];++j){int v;cin>>v;sum+=v;}
        int t=3*sum+2*(n[i]-1);if(t<best){best=t;id=i+1;}}
    cout<<id<<' '<<best<<'\n';
}`,
    python: String.raw`import sys
it = iter(map(int, sys.stdin.buffer.read().split()))
sizes = [next(it) for _ in range(3)]
times = [3 * sum(next(it) for _ in range(n)) + 2*(n-1) for n in sizes]
i = min(range(3), key=lambda j: times[j])
print(i + 1, times[i])`,
  }),
  defineToiBeginnerLesson("a230", {
    topic: "simulation",
    concept: "各類型依位置兩兩配對",
    goal: "計算指定的第S個F標靶在哪一發倒下。",
    explanation: [
      "玩家永遠射最左邊存活標靶，因此同類型其他存活標靶必在它右邊；最近的就是該類型下一個存活位置。先為每個位置建立同類型的下一個位置。",
      "由左向右走訪。略過已被老闆打掉的標靶；每遇到存活標靶就增加射擊次數，並將它及同類下一個標靶標記倒下。當這兩個位置之一是目標，就得到答案。每個位置只需處理常數次。",
      "讀入時另計算F出現次數以定位目標，S不是整列中的位置。範例第3個類型2在位置6，直到第4發才倒下。",
    ],
    complexity: "時間 O(N+V) ・ 空間 O(N+V)，V=10000",
    pitfall: "老闆只協助一個標靶，不能遞迴連鎖；S計算的是F的出現次序。",
    traceLabel: "範例射擊順序",
    trace: frames(
      [
        "第1發",
        "玩家打位置1的2，老闆打位置4的2。",
        ["倒下：1、4", "目標：位置6"],
      ],
      [
        "第2、3發",
        "第2發打位置2、5；第3發打位置3、7。",
        ["倒下：2、5、3、7", "剩下：位置6"],
      ],
      ["第4發", "玩家射倒位置6的2，目標倒下。", ["輸出：4"]],
    ),
    cpp: String.raw`#include <iostream>
#include <vector>
using namespace std;
int main(){int n,s,f;cin>>n>>s>>f;vector<int>a(n),nxt(n,-1),last(10001,-1);int target=-1,seen=0;
    for(int i=0;i<n;++i){cin>>a[i];if(last[a[i]]!=-1)nxt[last[a[i]]]=i;last[a[i]]=i;
        if(a[i]==f&&++seen==s)target=i;}
    vector<bool> dead(n);int shots=0;
    for(int i=0;i<n;++i)if(!dead[i]){++shots;dead[i]=true;int j=nxt[i];if(j!=-1)dead[j]=true;
        if(i==target||j==target){cout<<shots<<'\n';break;}}
}`,
    python: String.raw`import sys
d = list(map(int, sys.stdin.buffer.read().split()))
n, s, f = d[:3]
a = d[3:3+n]
target = [i for i, x in enumerate(a) if x == f][s-1]
nxt = [-1] * n
last = {}
for i, x in enumerate(a):
    if x in last:
        nxt[last[x]] = i
    last[x] = i
dead = [False] * n
shots = 0
for i in range(n):
    if dead[i]:
        continue
    shots += 1
    dead[i] = True
    j = nxt[i]
    if j != -1:
        dead[j] = True
    if i == target or j == target:
        print(shots)
        break`,
  }),
  defineToiBeginnerLesson("a231", {
    topic: "simulation",
    concept: "每日補水與存量累計",
    goal: "找出補水後仍無法供應當日需求的第一天。",
    explanation: [
      "存水起始為0。每天先增加W，再扣除當天M戶需求的總和；若結果小於0，該天就是第一次缺水。",
      "存水等於0仍能供應。可立即輸出第一個缺水日並結束程式；如果讀完N天都沒有負值，輸出-1。範例每天結束的存水是3、5、0、7，因此沒有缺水。",
    ],
    complexity: "時間 O(N+ΣM) ・ 空間 C++ O(1)、Python O(max M)（逐日讀入）",
    pitfall: "每日先加W，剩餘水要保留；不能只比較當天需求與W。",
    traceLabel: "範例每日存水",
    trace: frames(
      ["第1天", "0+8-(3+2)=3。", ["存水：3"]],
      [
        "第2、3天",
        "3+8-6=5，接著5+8-(5+8)=0，仍足夠。",
        ["第2天：5", "第3天：0"],
      ],
      ["第4天", "0+8-1=7，四天均供應成功。", ["存水：7", "輸出：-1"]],
    ),
    cpp: String.raw`#include <iostream>
using namespace std;
int main(){int n,w;cin>>n>>w;int water=0;
    for(int day=1;day<=n;++day){int m;cin>>m;water+=w;
        while(m--){int x;cin>>x;water-=x;}
        if(water<0){cout<<day<<'\n';return 0;}}
    cout<<-1<<'\n';
}`,
    python: String.raw`import sys
n, w = map(int, sys.stdin.buffer.readline().split())
water = 0
for day in range(1, n + 1):
    row = list(map(int, sys.stdin.buffer.readline().split()))
    water += w - sum(row[1:1+row[0]])
    if water < 0:
        print(day)
        break
else:
    print(-1)`,
  }),
  defineToiBeginnerLesson("a232", {
    topic: "read-calculate",
    concept: "二元一次方程與整數解",
    goal: "求豬、牛肉串數並驗證非負整數條件。",
    explanation: [
      "設豬肉A串、牛肉B串。由A+B=M，將B=M-A代入金額可得 A(X-Y)=N-MY。因X≠Y，分母不會為0。",
      "先檢查N-MY是否可被X-Y整除，再計算A與M-A。只有0≤A≤M才有效，否則輸出-1 -1。範例A=(31-35)/(3-5)=2，B=5。",
    ],
    complexity: "時間 O(1) ・ 空間 O(1)",
    pitfall:
      "單價可能X<Y，分子分母可為負；必須先驗整除，不能捨去小數就當答案。",
    traceLabel: "範例金額方程",
    trace: frames(
      ["假設全牛肉", "7串全牛肉需35元，實付31元。", ["N-MY：-4"]],
      ["求豬肉數", "每換一串豬肉少2元，-4可整除-2。", ["A：2"]],
      ["驗證", "2+5=7，2×3+5×5=31。", ["輸出：2 5"]],
    ),
    cpp: String.raw`#include <iostream>
using namespace std;
int main(){long long n,m,x,y;cin>>n>>m>>x>>y;long long num=n-m*y,den=x-y;
    if(num%den){cout<<"-1 -1\n";return 0;}
    long long a=num/den;if(a<0||a>m)cout<<"-1 -1\n";
    else cout<<a<<' '<<m-a<<'\n';
}`,
    python: String.raw`n, m, x, y = map(int, input().split())
num, den = n - m*y, x - y
if num % den != 0:
    print(-1, -1)
else:
    a = num // den
    print(a, m-a) if 0 <= a <= m else print(-1, -1)`,
  }),
  defineToiBeginnerLesson("a233", {
    topic: "grid",
    concept: "四向循環與逐格畫路徑",
    goal: "標記依密碼行走時曾到過的所有房間格子。",
    explanation: [
      "起點(列0,欄0)先標記星號。密碼第i字元的方向依i%4決定，依序右、下、左、上；字元轉成整數作為步數。",
      "每走一步都將新列欄限制在合法範圍內並畫星號，超出邊界時留在原地。0步也必須換到下一個方向。範例右4、下2、左1、上3，最後一步向上已在邊界，仍停在頂列。",
    ],
    complexity: "時間 O(RC+9|S|) ・ 空間 O(RC)",
    pitfall: "輸出為連續字元而非空白分隔；不能只畫各段終點。",
    traceLabel: "範例密碼4213",
    trace: frames(
      ["右4", "從起點走完整個頂列。", ["*****", ".....", "....."]],
      [
        "下2再左1",
        "沿最右欄向下，再到第2列第3欄（0起算）。",
        ["*****", "....*", "...**"],
      ],
      [
        "上3",
        "先到(1,3)、(0,3)，最後一步留在頂列。",
        ["*****", "...**", "...**"],
      ],
    ),
    cpp: String.raw`#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
using namespace std;
int main(){int r,c;string s;cin>>r>>c>>s;vector<string>g(r,string(c,'.'));
    int x=0,y=0,dx[]={0,1,0,-1},dy[]={1,0,-1,0};g[0][0]='*';
    for(int i=0;i<(int)s.size();++i)for(int k=0;k<s[i]-'0';++k){
        x=clamp(x+dx[i%4],0,r-1);y=clamp(y+dy[i%4],0,c-1);g[x][y]='*';}
    for(auto &row:g)cout<<row<<'\n';
}`,
    python: String.raw`r, c = map(int, input().split())
s = input().strip()
g = [['.'] * c for _ in range(r)]
x = y = 0
g[0][0] = '*'
directions = [(0,1), (1,0), (0,-1), (-1,0)]
for i, digit in enumerate(s):
    dx, dy = directions[i % 4]
    for _ in range(int(digit)):
        x = min(r-1, max(0, x+dx))
        y = min(c-1, max(0, y+dy))
        g[x][y] = '*'
for row in g:
    print(''.join(row))`,
  }),
  defineToiBeginnerLesson("a234", {
    topic: "text",
    concept: "最後出現位置與領貨排名",
    goal: "只保留各員工最後填答，依字典序串接領貨序號。",
    explanation: [
      "掃描字串，以字母為鍵持續覆寫最後出現位置。接著按最後位置排序，最早者領貨序號1，依序遞增。",
      "最後按A到Z、a到z的順序查出各員工序號，直接串接完整十進位表示。範例最後保留順序為A、b、C、a，對應字典序A、C、a、b的答案是1、3、4、2。",
    ],
    complexity: "時間 O(|S|+U log U) ・ 額外空間 O(U)，含輸入O(|S|+U)，U≤52",
    pitfall: "大小寫不同；序號10須完整輸出10，序號之間完全沒有空白。",
    traceLabel: "範例bACbCa",
    trace: frames(
      [
        "保留最後位置",
        "從1編號，b與C的早期紀錄被取代。",
        ["A：2", "b：4", "C：5", "a：6"],
      ],
      [
        "依位置編領貨號",
        "最後紀錄先後為A、b、C、a。",
        ["A→1", "b→2", "C→3", "a→4"],
      ],
      [
        "依字典序輸出",
        "A、C、a、b的序號直接相接。",
        ["1", "3", "4", "2", "輸出：1342"],
      ],
    ),
    cpp: String.raw`#include <iostream>
#include <string>
#include <map>
#include <vector>
#include <algorithm>
using namespace std;
int main(){string s;cin>>s;map<char,int>last,rank;
    for(int i=0;i<(int)s.size();++i)last[s[i]]=i;
    vector<pair<int,char>>v;for(auto [c,p]:last)v.push_back({p,c});sort(v.begin(),v.end());
    for(int i=0;i<(int)v.size();++i)rank[v[i].second]=i+1;
    for(auto [c,p]:last)cout<<rank[c];cout<<'\n';
}`,
    python: String.raw`s = input().strip()
last = {ch: i for i, ch in enumerate(s)}
order = sorted(last, key=last.get)
rank = {ch: i+1 for i, ch in enumerate(order)}
print(''.join(str(rank[ch]) for ch in sorted(last)))`,
  }),
  defineToiBeginnerLesson("a235", {
    topic: "arrays",
    concept: "相鄰差分正負分開累加",
    goal: "分別找出累積進步和累積退步最大的最小座號。",
    explanation: [
      "對每位學生計算相鄰考試的差d。d>0時加到進步總額；d<0時將-d加到退步總額，持平不變。不能用最後一次減第一次取代，因為中途起伏也要計入。",
      "按座號由小到大讀取，只有新總額嚴格超過目前紀錄才替換座號。這樣平手自然保留最小座號。範例三人的進步/退步為65/5、30/100、0/0。",
    ],
    complexity: "時間 O(NM) ・ 空間 O(M)（逐位學生讀取）",
    pitfall: "退步幅度用正數累加；兩種最大值與座號要分開維護。",
    traceLabel: "範例成績差分",
    trace: frames(
      ["學生1", "差分+30、-5、+35。", ["進步：65", "退步：5"]],
      ["學生2", "差分-50、+30、-50。", ["進步：30", "退步：100"]],
      [
        "學生3",
        "成績全相同，不影響前兩位紀錄。",
        ["進步最大：1", "退步最大：2"],
      ],
    ),
    cpp: String.raw`#include <iostream>
using namespace std;
int main(){int n,m;cin>>n>>m;int bu=-1,bd=-1,iu=1,id=1;
    for(int i=1;i<=n;++i){int prev;cin>>prev;int up=0,down=0;
        for(int j=1;j<m;++j){int x;cin>>x;int d=x-prev;if(d>0)up+=d;else down-=d;prev=x;}
        if(up>bu){bu=up;iu=i;}if(down>bd){bd=down;id=i;}}
    cout<<iu<<'\n'<<id<<'\n';
}`,
    python: String.raw`import sys
n, m = map(int, sys.stdin.buffer.readline().split())
best_up = best_down = -1
up_id = down_id = 1
for i in range(1, n+1):
    a = list(map(int, sys.stdin.buffer.readline().split()))
    differences = [a[j]-a[j-1] for j in range(1, m)]
    up = sum(max(0, d) for d in differences)
    down = sum(max(0, -d) for d in differences)
    if up > best_up:
        best_up, up_id = up, i
    if down > best_down:
        best_down, down_id = down, i
print(up_id)
print(down_id)`,
  }),
  defineToiBeginnerLesson("a236", {
    topic: "conditions",
    concept: "逐人比較兩種成績",
    goal: "依較高成績將學生編號分到語文班和數理班。",
    explanation: [
      "第二列的第i個數與第三列的第i個數屬於同一位學生。保留兩列成績後，依編號1到N比較：語文較高加入語文班，否則加入數理班；題目保證不平手。",
      "依編號掃描時加入的清單自然遞增，不必排序。每班各輸出一行，空清單必須輸出-1。範例1、3號語文較高，2、4號數理較高。",
    ],
    complexity: "時間 O(N) ・ 空間 O(N)",
    pitfall: "輸入是兩整列成績而非逐人的兩個分數；空班不能只輸出空行。",
    traceLabel: "範例分班",
    trace: frames(
      ["學生1、2", "92>80進語文班；40<65進數理班。", ["語文：1", "數理：2"]],
      [
        "學生3、4",
        "67>66進語文班；20<90進數理班。",
        ["語文：1 3", "數理：2 4"],
      ],
      ["輸出兩班", "兩班皆依編號遞增。", ["1 3", "2 4"]],
    ),
    cpp: String.raw`#include <iostream>
#include <vector>
using namespace std;
void output(const vector<int>&v){if(v.empty())cout<<-1;else for(int i=0;i<(int)v.size();++i){if(i)cout<<' ';cout<<v[i];}cout<<'\n';}
int main(){int n;cin>>n;vector<int>l(n),a,b;for(int &x:l)cin>>x;
    for(int i=0;i<n;++i){int m;cin>>m;if(l[i]>m)a.push_back(i+1);else b.push_back(i+1);}
    output(a);output(b);
}`,
    python: String.raw`import sys
it = iter(map(int, sys.stdin.buffer.read().split()))
n = next(it)
l = [next(it) for _ in range(n)]
a, b = [], []
for i in range(n):
    (a if l[i] > next(it) else b).append(i+1)
print(*a) if a else print(-1)
print(*b) if b else print(-1)`,
  }),
  defineToiBeginnerLesson("a237", {
    topic: "number-theory",
    concept: "倍數或含指定數字",
    goal: "依序找出區間內第K次拍手的數字。",
    explanation: [
      "從S到E包含端點逐一檢查x。x%B==0或十進位字串含B時，拍手計數增加一次；兩條件用或連接，所以同時成立仍只加一次。",
      "計數達到K就輸出目前x；遍歷結束仍不足則輸出-1。範例拍手數字依序為8、12、14、16、20、24，第6次是24。",
    ],
    complexity: "時間 O((E-S+1) log E) ・ 額外空間 O(log E)，本題至多3位數",
    pitfall: "B不是固定7；倍數與含B不能分開各加一次。",
    traceLabel: "範例B=4、K=6",
    trace: frames(
      ["前兩次", "5開始，8與12是4的倍數。", ["第1次：8", "第2次：12"]],
      [
        "第3至5次",
        "14含4，16與20為倍數。",
        ["第3次：14", "第4次：16", "第5次：20"],
      ],
      ["第6次", "24既是倍數又含4，只拍一次。", ["輸出：24"]],
    ),
    cpp: String.raw`#include <iostream>
#include <string>
using namespace std;
int main(){int s,e,b,k;cin>>s>>e>>b>>k;
    for(int x=s;x<=e;++x)if(x%b==0||to_string(x).find(char('0'+b))!=string::npos){
        if(--k==0){cout<<x<<'\n';return 0;}}
    cout<<-1<<'\n';
}`,
    python: String.raw`s, e, b, k = map(int, input().split())
for x in range(s, e+1):
    if x % b == 0 or str(b) in str(x):
        k -= 1
        if k == 0:
            print(x)
            break
else:
    print(-1)`,
  }),
  defineToiBeginnerLesson("a238", {
    topic: "simulation",
    concept: "售前庫存決定折扣",
    goal: "逐件按庫存門檻收費，低於20%時停止。",
    explanation: [
      "每位顧客購買前，用目前庫存remain與原庫存T比較，依80%、60%、40%、20%的門檻選折數5、6、8、9。用5×remain與4T、3T、2T、T比較，可完全避免浮點誤差。",
      "單件收入為P×折數整除10，必須每件捨去小數後再累加，售出後庫存減一。低於20%時立即停止，即使還有顧客。範例售前庫存20到16有5件8元，15到12有4件10元，11到8有4件13元，7到6有2件15元，總共162元。",
    ],
    complexity: "時間 O(S) ・ 空間 O(1)",
    pitfall: "門檻使用售前庫存，恰好20%仍可賣一件；不可最後才對總價取整。",
    traceLabel: "範例T20、S15、P17",
    trace: frames(
      [
        "前5件",
        "售前庫存20到16皆至少80%，每件8元。",
        ["已售：5", "收入：40", "庫存：15"],
      ],
      [
        "接著8件",
        "4件10元加4件13元，收入增加92。",
        ["已售：13", "收入：132", "庫存：7"],
      ],
      ["最後2件", "每件15元，15位顧客購買完畢。", ["庫存：5", "輸出：162"]],
    ),
    cpp: String.raw`#include <iostream>
using namespace std;
int main(){int t,s,p;cin>>t>>s>>p;int remain=t,total=0;
    while(s--){int rate;if(5*remain>=4*t)rate=5;else if(5*remain>=3*t)rate=6;
        else if(5*remain>=2*t)rate=8;else if(5*remain>=t)rate=9;else break;
        total+=p*rate/10;--remain;}
    cout<<total<<'\n';
}`,
    python: String.raw`t, s, p = map(int, input().split())
remain, total = t, 0
for _ in range(s):
    if 5*remain >= 4*t:
        rate = 5
    elif 5*remain >= 3*t:
        rate = 6
    elif 5*remain >= 2*t:
        rate = 8
    elif 5*remain >= t:
        rate = 9
    else:
        break
    total += p*rate // 10
    remain -= 1
print(total)`,
  }),
  defineToiBeginnerLesson("a239", {
    topic: "read-calculate",
    concept: "四段時間加總與上限",
    goal: "判斷去程、等餐、用餐、回程是否能在午休內完成。",
    explanation: [
      "整趟行程沒有重疊，總時間就是G+W+E+B。比較總和與午休T，總和小於或等於T時輸出總和，否則輸出-1。",
      "範例7+11+16+8=42，不超過45，因此輸出42。相等也算能完成，不需額外保留時間。",
    ],
    complexity: "時間 O(1) ・ 空間 O(1)",
    pitfall: "不能漏掉回程B，恰好用完午休也有效。",
    traceLabel: "範例午休45分鐘",
    trace: frames(
      ["去程與等待", "7+11累計18分鐘。", ["累計：18"]],
      ["用餐與回程", "18+16+8=42。", ["總時間：42"]],
      ["比較上限", "42≤45，可以按時返回。", ["輸出：42"]],
    ),
    cpp: String.raw`#include <iostream>
using namespace std;
int main(){int t,g,w,e,b;cin>>t>>g>>w>>e>>b;int sum=g+w+e+b;cout<<(sum<=t?sum:-1)<<'\n';}`,
    python: String.raw`t, g, w, e, b = map(int, input().split())
total = g+w+e+b
print(total if total <= t else -1)`,
  }),
  defineToiBeginnerLesson("a240", {
    topic: "count-frequency",
    concept: "問卷頻率與商店加權總和",
    goal: "找出喜愛次數最高的商品及受歡迎程度最低的商店。",
    explanation: [
      "先將K份問卷累計到編號1到1000的頻率表，最高頻率的商品就是第一個答案。接著讀取N間店的商品數，再依這些長度讀取各店清單。",
      "每店將所售商品的問卷頻率相加，沒有問卷提及的商品貢獻0。比較各店總和取最小；題目保證商品與商店答案都唯一。範例商品8出現3次，三店分數分別2、3、1，所以店3最低。",
      "Python用逐行整數產生器讀入，避免將最多一百萬個問卷 token 同時存入串列；頻率表仍只需1001格。",
    ],
    complexity: "時間 O(K+ΣM+1000) ・ 空間 O(N+1000+L)，L為單行輸入分詞的空間",
    pitfall:
      "先有全部M_i，再有各店清單；最低商店以喜愛次數總和比較，並非商品種類數。",
    traceLabel: "範例熱門商品",
    trace: frames(
      ["問卷統計", "4出現2次、8出現3次、6出現1次。", ["4：2", "8：3", "6：1"]],
      [
        "商店分數",
        "店1賣4、5；店2賣8；店3賣6、9。",
        ["店1：2", "店2：3", "店3：1"],
      ],
      ["選出答案", "商品8最高，店3最低。", ["輸出：8 3"]],
    ),
    cpp: String.raw`#include <iostream>
#include <vector>
#include <array>
#include <climits>
using namespace std;
int main(){int k,n;cin>>k>>n;array<int,1001>cnt{};
    while(k--){int x;cin>>x;++cnt[x];}int product=1;
    for(int i=2;i<=1000;++i)if(cnt[i]>cnt[product])product=i;
    vector<int>m(n);for(int &v:m)cin>>v;int best=INT_MAX,shop=0;
    for(int i=0;i<n;++i){int sum=0;for(int j=0;j<m[i];++j){int x;cin>>x;sum+=cnt[x];}
        if(sum<best){best=sum;shop=i+1;}}
    cout<<product<<' '<<shop<<'\n';
}`,
    python: String.raw`import sys
def integers():
    for line in sys.stdin.buffer:
        for token in line.split():
            yield int(token)
it = integers()
k, n = next(it), next(it)
count = [0] * 1001
for _ in range(k):
    count[next(it)] += 1
product = max(range(1, 1001), key=lambda x: count[x])
sizes = [next(it) for _ in range(n)]
best, shop = float('inf'), 0
for i, m in enumerate(sizes, 1):
    score = sum(count[next(it)] for _ in range(m))
    if score < best:
        best, shop = score, i
print(product, shop)`,
  }),
  defineToiBeginnerLesson("a241", {
    topic: "arrays",
    concept: "排列的環分解",
    goal: "走訪每個傳送環，找出最大環長。",
    explanation: [
      "目的地編號互不相同，因此每個點都有一條出邊及一條入邊，整體是互不相交的環。題目描述的一個王國正是一個環。",
      "為所有點建立visited。從未訪問點出發，沿a反覆前進，每走到新點就標記並計數，直到遇到已訪問點；更新最大長度。每個點只被新訪問一次，所以不需從每個點重新走整圈。",
    ],
    complexity: "時間 O(K) ・ 空間 O(K)",
    pitfall: "輸出王國大小而非王國數；單點自環長度為1，不可漏算。",
    traceLabel: "範例傳送環",
    trace: frames(
      ["第一個王國", "1→2→3→1，標記三個點。", ["環：1 2 3", "最大：3"]],
      ["第二個王國", "4→5→4，共兩點。", ["環：4 5", "最大：3"]],
      ["最後自環", "6→6，共一點，最大不變。", ["環：6", "輸出：3"]],
    ),
    cpp: String.raw`#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;
int main(){int k;cin>>k;vector<int>a(k);for(int &v:a){cin>>v;--v;}vector<bool>seen(k);int best=0;
    for(int i=0;i<k;++i)if(!seen[i]){int u=i,count=0;while(!seen[u]){seen[u]=true;++count;u=a[u];}best=max(best,count);}
    cout<<best<<'\n';
}`,
    python: String.raw`import sys
d = list(map(int, sys.stdin.buffer.read().split()))
k, a = d[0], d[1:]
seen = [False] * k
best = 0
for i in range(k):
    if seen[i]:
        continue
    u, size = i, 0
    while not seen[u]:
        seen[u] = True
        size += 1
        u = a[u]-1
    best = max(best, size)
print(best)`,
  }),
  defineToiBeginnerLesson("a242", {
    topic: "arrays",
    concept: "碎片編號反查書架",
    goal: "將書架上的碎片紀錄反轉成每張碎片的位置。",
    explanation: [
      "建立長度M+1的pos陣列。依書架編號i讀取碎片x，若x不為0，設定pos[x]=i；0表示空架，不記錄。",
      "每張1到M碎片恰好出現一次，因此全部讀完後，按碎片編號依序輸出pos[1]到pos[M]即可。範例碎片1、2、3、4分別在書架3、6、1、4。",
    ],
    complexity: "時間 O(N+M) ・ 空間 O(M)（Python含輸入token為O(N)）",
    pitfall: "輸出順序是碎片編號，不是書架順序；書架從1編號。",
    traceLabel: "範例碎片位置",
    trace: frames(
      [
        "書架1到3",
        "書架1有碎片3，書架2空白，書架3有碎片1。",
        ["pos[3]=1", "pos[1]=3"],
      ],
      ["書架4到6", "書架4有碎片4，書架6有碎片2。", ["pos[4]=4", "pos[2]=6"]],
      ["按碎片序輸出", "依1、2、3、4查位置。", ["輸出：3 6 1 4"]],
    ),
    cpp: String.raw`#include <iostream>
#include <vector>
using namespace std;
int main(){int n,m;cin>>n>>m;vector<int>pos(m+1);for(int i=1;i<=n;++i){int x;cin>>x;if(x)pos[x]=i;}
    for(int j=1;j<=m;++j){if(j>1)cout<<' ';cout<<pos[j];}cout<<'\n';
}`,
    python: String.raw`import sys
it = iter(map(int, sys.stdin.buffer.read().split()))
n, m = next(it), next(it)
pos = [0] * (m+1)
for i in range(1, n+1):
    x = next(it)
    if x:
        pos[x] = i
print(*pos[1:])`,
  }),
  defineToiBeginnerLesson("a243", {
    topic: "simulation",
    concept: "淘汰集合與錯誤優先",
    goal: "先檢查重複淘汰，再依存活狼人判斷勝負。",
    explanation: [
      "以dead記錄每位玩家是否已被淘汰。讀到正編號時，若先前已淘汰就將wrong設為真；不論如何都標記dead。讀到0才結束紀錄。",
      "最後優先檢查wrong，為真輸出Wrong。沒有錯誤才檢查身分-1且未淘汰者；存在則Werewolves，否則Townsfolk。範例淘汰2、4號後1號狼人仍活著。",
    ],
    complexity: "時間 O(N+Q) ・ 空間 O(N+Q)（Python含輸入；狀態表O(N)）",
    pitfall: "即使所有狼人已死也不能提早判好人贏，後續重複淘汰仍須輸出Wrong。",
    traceLabel: "範例淘汰紀錄",
    trace: frames(
      ["初始身分", "1、4號為狼人。", ["狼人：1 4", "重複：無"]],
      ["淘汰2與4", "兩人各淘汰一次，無錯誤。", ["已淘汰：2 4", "存活狼人：1"]],
      ["讀到0", "紀錄結束，仍有狼人。", ["輸出：Werewolves"]],
    ),
    cpp: String.raw`#include <iostream>
#include <vector>
using namespace std;
int main(){int n;cin>>n;vector<int>role(n+1);vector<bool>dead(n+1);for(int i=1;i<=n;++i)cin>>role[i];
    int x;bool wrong=false;while(cin>>x&&x){if(dead[x])wrong=true;dead[x]=true;}
    bool wolf=false;for(int i=1;i<=n;++i)if(role[i]==-1&&!dead[i])wolf=true;
    cout<<(wrong?"Wrong":wolf?"Werewolves":"Townsfolk")<<'\n';
}`,
    python: String.raw`import sys
d = list(map(int, sys.stdin.buffer.read().split()))
n = d[0]
roles = d[1:n+1]
dead = set()
wrong = False
for x in d[n+1:]:
    if x == 0:
        break
    if x in dead:
        wrong = True
    dead.add(x)
wolf = any(role == -1 and i not in dead for i, role in enumerate(roles, 1))
print('Wrong' if wrong else 'Werewolves' if wolf else 'Townsfolk')`,
  }),
  defineToiBeginnerLesson("a244", {
    topic: "grid",
    concept: "填字座標與重疊檢查",
    goal: "檢查所有單字是否可在方格內一致填入。",
    explanation: [
      "建立N×N的空字母格。每個指示的座標(X,Y)對應grid[Y][X]，H讓X逐字增加，V讓Y逐字增加。",
      "逐字檢查是否越界；合法格若已有不同字母即衝突，若空白或相同字母則可填入。任何錯誤都將答案保持為No。範例兩字在(0,1)共用T，沒有衝突。",
    ],
    complexity: "時間 O(N²+Σ|S|) ・ 狀態空間 O(N²)，Python含輸入O(N²+Σ|S|)",
    pitfall: "X為欄、Y為列；同格相同字母合法，不能把所有重疊都判錯。",
    traceLabel: "範例TOI與TOP",
    trace: frames(
      ["水平TOI", "在Y=1，X=0、1、2填入。", ["....", "TOI.", "....", "...."]],
      [
        "垂直TOP",
        "從(0,1)往下，共用的T相同。",
        ["....", "TOI.", "O...", "P..."],
      ],
      ["完成檢查", "所有字母在界內且重疊一致。", ["輸出：Yes"]],
    ),
    cpp: String.raw`#include <iostream>
#include <vector>
#include <string>
using namespace std;
int main(){int n,m;cin>>n>>m;vector<string>g(n,string(n,'.'));bool ok=true;
    while(m--){char dir;string s;int x,y;cin>>dir>>s>>x>>y;
        for(int i=0;i<(int)s.size();++i){int c=x+(dir=='H'?i:0),r=y+(dir=='V'?i:0);
            if(r>=n||c>=n){ok=false;continue;}
            if(g[r][c]!='.'&&g[r][c]!=s[i])ok=false;else g[r][c]=s[i];}}
    cout<<(ok?"Yes":"No")<<'\n';
}`,
    python: String.raw`import sys
it = iter(sys.stdin.read().split())
n, m = int(next(it)), int(next(it))
g = [['.'] * n for _ in range(n)]
ok = True
for _ in range(m):
    direction, s = next(it), next(it)
    x, y = int(next(it)), int(next(it))
    for i, ch in enumerate(s):
        c = x + (i if direction == 'H' else 0)
        r = y + (i if direction == 'V' else 0)
        if r >= n or c >= n:
            ok = False
        elif g[r][c] not in ('.', ch):
            ok = False
        else:
            g[r][c] = ch
print('Yes' if ok else 'No')`,
  }),
  defineToiBeginnerLesson("a245", {
    topic: "read-calculate",
    concept: "時刻轉分鐘與首個可行場次",
    goal: "找出至少20分鐘後開演的最早場次。",
    explanation: [
      "將每個HH MM轉成60×HH+MM。現在時間同樣轉換後加20，得到最早可接受的開演時刻。",
      "時刻表已排序，第一個不小於門檻的場次就是答案，輸出時兩欄各補足兩位。若不存在則輸出Too Late；不跨到隔天搜尋。範例08:39只差19分鐘，08:40恰好20分鐘可選。",
    ],
    complexity: "時間 O(N) ・ 空間 O(N)",
    pitfall: "分鐘相加可能跨小時，不能只比較MM；格式為兩位時、空白、兩位分。",
    traceLabel: "範例現在08:20",
    trace: frames(
      ["換算門檻", "08:20是500分鐘，加20為520。", ["門檻：08 40"]],
      ["檢查08:39", "519小於520，無法趕上。", ["08 39：略過"]],
      ["檢查08:40", "520恰好達門檻，取最早場次。", ["輸出：08 40"]],
    ),
    cpp: String.raw`#include <iostream>
#include <vector>
#include <iomanip>
using namespace std;
int main(){int n;cin>>n;vector<int>a(n);for(int &v:a){int h,m;cin>>h>>m;v=h*60+m;}
    int h,m;cin>>h>>m;int target=h*60+m+20;
    for(int v:a)if(v>=target){cout<<setfill('0')<<setw(2)<<v/60<<' '<<setw(2)<<v%60<<'\n';return 0;}
    cout<<"Too Late\n";
}`,
    python: String.raw`import sys
it = iter(map(int, sys.stdin.buffer.read().split()))
n = next(it)
times = [60*next(it) + next(it) for _ in range(n)]
target = 60*next(it) + next(it) + 20
for t in times:
    if t >= target:
        print(f'{t//60:02d} {t%60:02d}')
        break
else:
    print('Too Late')`,
  }),
  defineToiBeginnerLesson("a246", {
    topic: "conditions",
    concept: "各區勝者全拿選舉人票",
    goal: "累計各候選人的選舉人票並輸出勝者。",
    explanation: [
      "每區比較A、B的普選票N與M，較高者取得該區全部X張選舉人票。普選票僅用來判該區勝者，不能直接加到最後總數。",
      "讀完K區後比較兩人的選舉人票總和，A較多輸出1及A總數，B較多輸出2及B總數。題目保證每區和最後都不平手。範例B拿9票，A拿6+5=11票。",
    ],
    complexity: "時間 O(K) ・ 空間 O(1)（Python含輸入O(K)）",
    pitfall: "勝者代號是1或2；第二欄為勝者選舉人票，而非普選票或兩人的差。",
    traceLabel: "範例三區選舉",
    trace: frames(
      ["第1區", "50<90，9票全歸B。", ["A：0", "B：9"]],
      ["第2區", "100>10，6票歸A。", ["A：6", "B：9"]],
      ["第3區", "7>1，A再得5票，以11勝9。", ["A：11", "B：9", "輸出：1 11"]],
    ),
    cpp: String.raw`#include <iostream>
using namespace std;
int main(){int k;cin>>k;int a=0,b=0;while(k--){int n,m,x;cin>>n>>m>>x;if(n>m)a+=x;else b+=x;}
    if(a>b)cout<<1<<' '<<a<<'\n';else cout<<2<<' '<<b<<'\n';
}`,
    python: String.raw`import sys
it = iter(map(int, sys.stdin.buffer.read().split()))
k = next(it)
a = b = 0
for _ in range(k):
    n, m, x = next(it), next(it), next(it)
    if n > m:
        a += x
    else:
        b += x
print(1, a) if a > b else print(2, b)`,
  }),
  defineToiBeginnerLesson("a247", {
    topic: "read-calculate",
    concept: "面額乘張數後累加",
    goal: "計算所有紅包中的鈔票總金額。",
    explanation: [
      "每個紅包的三個數依序是100、500、1000元鈔票張數，不是金額。將它們乘對應面額後相加，再累加N個紅包。",
      "三種張數都可為0。總金額不超過10億，C++使用long long作乘法和累加更明確。範例第一包2300元，第二包4000元，合計6300元。",
    ],
    complexity: "時間 O(N) ・ 額外空間 O(1)（Python逐行讀取）",
    pitfall: "面額順序不可顛倒，也不是將三種張數直接相加。",
    traceLabel: "範例紅包金額",
    trace: frames(
      ["第一包", "3×100+2×500+1×1000。", ["第一包：2300"]],
      ["第二包", "0×100+4×500+2×1000。", ["第二包：4000"]],
      ["總金額", "2300+4000=6300。", ["輸出：6300"]],
    ),
    cpp: String.raw`#include <iostream>
using namespace std;
int main(){int n;cin>>n;long long total=0;while(n--){long long a,b,c;cin>>a>>b>>c;total+=100*a+500*b+1000*c;}cout<<total<<'\n';}`,
    python: String.raw`import sys
n = int(sys.stdin.buffer.readline())
total = 0
for _ in range(n):
    a, b, c = map(int, sys.stdin.buffer.readline().split())
    total += 100*a + 500*b + 1000*c
print(total)`,
  }),
  defineToiBeginnerLesson("a248", {
    topic: "search-optimization",
    concept: "連續採礦區塊與邊際收益堆積",
    goal: "配置至多M天的採礦次數以最大化淨收益。",
    explanation: [
      "第i礦點首次淨收益b_i=A_i-(i-1)。若使用它t天，不論其他安排，這t次的收益至多為b_i、b_i-1、…、b_i-t+1：啟動後每天都減產，隔天不採也會減。",
      "這個上界可以達成：先決定各礦點要用幾天，再將每個礦點的採礦日集中成一個連續區塊。尚未啟動的礦不減產，區塊先後順序不影響收益。於是問題等價於從每個遞減序列取前綴，總共至多取M項。",
      "用最大堆放各礦點第一個正收益，每次取最大值v累加，若v-1仍正就放回。每序列遞減，取出的最大邊際收益必然維持前綴條件，因此最優。堆的取出順序是分配順序，不必當成實際日程；實際可把同礦配置連續開採。",
      "範例b為6、7、1、8，前六個邊際收益是8、7、7、6、6、6，總40。可行日程為礦4連採3天（8、7、6）、礦2連採2天（7、6）、礦1採1天（6）。",
    ],
    complexity: "時間 O(N+M log N) ・ 空間 O(N)",
    pitfall:
      "已啟動礦點在休採日仍減產；不能聲稱交錯的堆取出順序就是日程。C++總額使用long long。",
    traceLabel: "範例最優可行日程",
    trace: frames(
      ["扣運輸費", "礦1到4的首次淨收益為6、7、1、8。", ["6", "7", "1", "8"]],
      [
        "第1到3天採礦4",
        "礦4連續採3天，收益8+7+6=21，其餘未啟動。",
        ["累積：21", "未啟動：礦1、2、3"],
      ],
      [
        "第4到6天",
        "礦2連採兩天得7+6，礦1最後採一天得6。",
        ["21+13+6", "輸出：40"],
      ],
    ),
    cpp: String.raw`#include <iostream>
#include <vector>
#include <queue>
#include <utility>
using namespace std;
int main(){int n,m;cin>>n>>m;vector<long long>v;for(int i=0;i<n;++i){long long a;cin>>a;if(a-i>0)v.push_back(a-i);}
    priority_queue<long long>q(less<long long>(),move(v));long long total=0;
    while(m--&&!q.empty()){long long x=q.top();q.pop();total+=x;if(x>1)q.push(x-1);}
    cout<<total<<'\n';
}`,
    python: String.raw`import sys
import heapq
it = iter(map(int, sys.stdin.buffer.read().split()))
n, m = next(it), next(it)
heap = []
for i in range(n):
    value = next(it) - i
    if value > 0:
        heap.append(-value)
heapq.heapify(heap)
total = 0
for _ in range(m):
    if not heap:
        break
    value = -heapq.heappop(heap)
    total += value
    if value > 1:
        heapq.heappush(heap, -(value-1))
print(total)`,
  }),
  defineToiBeginnerLesson("a249", {
    topic: "count-frequency",
    concept: "精油映射香調與用量統計",
    goal: "累計各香調的精油用量，並列時保留較早分類。",
    explanation: [
      "讀分類時保留香調名稱的輸入順序，並建立「精油名稱→香調索引」字典。名稱大小寫不同就是不同鍵。",
      "每筆配方透過字典找到香調，將用量加到該香調。最後由索引小到大掃描，只在嚴格大於目前最大值時替換。範例Fresh為9+7=16，Sweet為13，Warm為8，所以輸出Fresh。",
    ],
    complexity:
      "平均時間 O(ΣN_i+K+N) ・ 狀態空間 O(ΣN_i+N)，Python含輸入O(ΣN_i+N+K)，名稱長度≤30",
    pitfall: "同精油可有多筆用量，須累加；平手以分類輸入順序而非字典序決定。",
    traceLabel: "範例香調用量",
    trace: frames(
      [
        "前兩筆配方",
        "Mint9屬Fresh，Pear13屬Sweet。",
        ["Fresh：9", "Sweet：13", "Warm：0"],
      ],
      [
        "後兩筆配方",
        "Pine7加入Fresh，Clove8加入Warm。",
        ["Fresh：16", "Sweet：13", "Warm：8"],
      ],
      ["找最大", "16為最大用量，輸出原香調名稱。", ["輸出：Fresh"]],
    ),
    cpp: String.raw`#include <iostream>
#include <vector>
#include <string>
#include <unordered_map>
using namespace std;
int main(){int n;cin>>n;vector<string>name(n);vector<int>sum(n);unordered_map<string,int>owner;
    for(int i=0;i<n;++i){int count;cin>>name[i]>>count;while(count--){string s;cin>>s;owner[s]=i;}}
    int k;cin>>k;while(k--){string s;int m;cin>>s>>m;sum[owner.at(s)]+=m;}
    int best=0;for(int i=1;i<n;++i)if(sum[i]>sum[best])best=i;cout<<name[best]<<'\n';
}`,
    python: String.raw`import sys
it = iter(sys.stdin.read().split())
n = int(next(it))
names, owner = [], {}
for i in range(n):
    names.append(next(it))
    count = int(next(it))
    for _ in range(count):
        owner[next(it)] = i
totals = [0] * n
for _ in range(int(next(it))):
    oil, amount = next(it), int(next(it))
    totals[owner[oil]] += amount
best = max(range(n), key=lambda i: totals[i])
print(names[best])`,
  }),
  defineToiBeginnerLesson("a250", {
    topic: "grid",
    concept: "光線方向狀態與去重格子",
    goal: "模擬反射並計算不同的非障礙格數。",
    explanation: [
      "用方向0、1、2、3依序代表上、右、下、左。每次先確認在界內且不是障礙物，再將此格加入已經過格子集合。R鏡的方向映射是[1,0,3,2]，L鏡為[3,2,1,0]，完成反射後前進一格。",
      "另記錄進入格子時的(列,欄,方向)。若狀態重複，未來路徑會完全重複，可停止；同一格以不同方向通過時仍需繼續。格子集合去重後的大小才是答案，障礙物不加入。",
      "範例先經頂列4格，在L轉下，經右欄兩格，到底列R轉左，經兩格後由另一個R轉下離開，共8格。",
    ],
    complexity: "時間 O(NM) ・ 空間 O(NM)，每格最多4方向狀態",
    pitfall:
      "不能遇到同格就停，必須同方向狀態重複才停；鏡子算格數、障礙物不算。",
    traceLabel: "範例雷射路徑",
    trace: frames(
      [
        "頂列向右",
        "從(0,0)到(0,3)共4格，L讓光朝下。",
        ["位置：(0,3)", "方向：下", "不同格：4"],
      ],
      [
        "右欄向下",
        "到(1,3)、(2,3)，R轉向左。",
        ["位置：(2,3)", "方向：左", "不同格：6"],
      ],
      ["底列向左", "到(2,2)、(2,1)，R轉下後出界。", ["不同格：8", "輸出：8"]],
    ),
    cpp: String.raw`#include <iostream>
#include <vector>
#include <string>
#include <array>
using namespace std;
int main(){int n,m;cin>>n>>m;vector<string>g(n);for(auto &s:g)cin>>s;
    vector<vector<array<bool,4>>> seen(n,vector<array<bool,4>>(m,array<bool,4>{}));
    vector<vector<bool>> visited(n,vector<bool>(m));
    int r=0,c=0,d=1,count=0,dr[]={-1,0,1,0},dc[]={0,1,0,-1},rr[]={1,0,3,2},ll[]={3,2,1,0};
    while(r>=0&&r<n&&c>=0&&c<m&&g[r][c]!='#'&&!seen[r][c][d]){
        seen[r][c][d]=true;if(!visited[r][c]){visited[r][c]=true;++count;}
        if(g[r][c]=='R')d=rr[d];else if(g[r][c]=='L')d=ll[d];r+=dr[d];c+=dc[d];}
    cout<<count<<'\n';
}`,
    python: String.raw`import sys
it = iter(sys.stdin.read().split())
n, m = int(next(it)), int(next(it))
g = [next(it) for _ in range(n)]
dr, dc = [-1,0,1,0], [0,1,0,-1]
right, left = [1,0,3,2], [3,2,1,0]
r = c = 0
d = 1
states, cells = set(), set()
while 0 <= r < n and 0 <= c < m and g[r][c] != '#':
    if (r,c,d) in states:
        break
    states.add((r,c,d))
    cells.add((r,c))
    if g[r][c] == 'R':
        d = right[d]
    elif g[r][c] == 'L':
        d = left[d]
    r, c = r+dr[d], c+dc[d]
print(len(cells))`,
  }),
  defineToiBeginnerLesson("a251", {
    topic: "simulation",
    concept: "兩台機器最早空閒時間",
    goal: "依訂單順序派到最早空閒的機器，求全部完成時間。",
    explanation: [
      "記錄兩台機器各自完成手上工作的時間，初始皆為0。對下一張訂單，選完成時間較小的機器，將該機器時間加上該口味烘烤時間。",
      "這等價於一有機器空閒便立刻派單；同時空閒任選一台，因機器相同而不影響結果。所有訂單派完後取兩台完成時間的最大值。範例依序派單後時間對為(7,0)、(7,4)、(7,8)、(14,8)、(14,12)。",
    ],
    complexity: "時間 O(M) ・ 空間 O(1)（Python含輸入O(M)）",
    pitfall: "不可重新排序口味來縮短時間；最後答案是兩台完成時間最大值。",
    traceLabel: "範例烘烤排程",
    trace: frames(
      ["前兩張在時間0開烤", "口味2需7、口味1需4。", ["機器A：7", "機器B：4"]],
      [
        "第3與4張",
        "時間4派口味1到B完成於8；時間7派口味2到A完成於14。",
        ["機器A：14", "機器B：8"],
      ],
      [
        "最後一張",
        "時間8派口味1到B完成於12；全完成需14。",
        ["機器A：14", "機器B：12", "輸出：14"],
      ],
    ),
    cpp: String.raw`#include <iostream>
#include <algorithm>
using namespace std;
int main(){int t[2],m;cin>>t[0]>>t[1]>>m;int end[2]={0,0};
    while(m--){int f;cin>>f;int i=end[0]<=end[1]?0:1;end[i]+=t[f-1];}cout<<max(end[0],end[1])<<'\n';
}`,
    python: String.raw`import sys
it = iter(map(int, sys.stdin.buffer.read().split()))
times = [next(it), next(it)]
m = next(it)
end = [0, 0]
for _ in range(m):
    f = next(it)
    i = 0 if end[0] <= end[1] else 1
    end[i] += times[f-1]
print(max(end))`,
  }),
  defineToiBeginnerLesson("a252", {
    topic: "arrays",
    concept: "連續相同值的游程長度",
    goal: "依原順序輸出每段相同屬性水晶的顆數。",
    explanation: [
      "從第一顆開始令目前長度為1。每遇到和前一顆相同的屬性就延長目前段，否則把舊段長度存入答案並重新從1開始。",
      "迴圈結束後一定要補入最後一段。相同屬性被其他屬性隔開時，必須分成不同段。範例為99、2、555、22四團，強度依序2、1、3、2。",
    ],
    complexity: "時間 O(N) ・ 空間 O(N)（含輸入和輸出段長）",
    pitfall: "不是計算全列各屬性頻率；最後一段不能漏掉。",
    traceLabel: "範例融合分段",
    trace: frames(
      ["前兩段", "9、9成一團，後面的2單獨成一團。", ["9 9：2", "2：1"]],
      ["第三段", "連續三個5融合。", ["5 5 5：3"]],
      [
        "最後一段",
        "末尾兩個2另成一團，補入答案。",
        ["2 2：2", "輸出：2 1 3 2"],
      ],
    ),
    cpp: String.raw`#include <iostream>
#include <vector>
using namespace std;
int main(){int n,prev;cin>>n>>prev;vector<int>out;int length=1;
    for(int i=1;i<n;++i){int x;cin>>x;if(x==prev)++length;else{out.push_back(length);length=1;}prev=x;}
    out.push_back(length);for(int i=0;i<(int)out.size();++i){if(i)cout<<' ';cout<<out[i];}cout<<'\n';
}`,
    python: String.raw`import sys
d = list(map(int, sys.stdin.buffer.read().split()))
n, a = d[0], d[1:]
length = 1
out = []
for i in range(1, n):
    if a[i] == a[i-1]:
        length += 1
    else:
        out.append(length)
        length = 1
out.append(length)
print(*out)`,
  }),
  defineToiBeginnerLesson("a253", {
    topic: "grid",
    concept: "橫向複製像素與縱向複製整列",
    goal: "將每個像素擴成P列Q欄的同色區塊。",
    explanation: [
      "讀取原圖的一列，把每個像素依原順序連續放入Q次，得到長度M×Q的新列。將這整列輸出P次，便完成該原列的放大。",
      "依原圖列順序重複此動作，共輸出N×P列。像素之間仍以一個空白分隔。範例0、1橫向放3倍成000111，再縱向重複2次；下一原列11同樣處理。",
    ],
    complexity: "時間 O(NMPQ)（含輸出）・ 空間 O(MQ)（Python逐列處理）",
    pitfall: "P控制列數、Q控制欄數；輸出是空白分隔的數字，不能串成位元字串。",
    traceLabel: "範例垂直2倍、水平3倍",
    trace: frames(
      ["第一原列", "0、1各複製3次。", ["0 0 0 1 1 1"]],
      [
        "重複第一新列",
        "垂直放大2倍，因此輸出相同兩列。",
        ["0 0 0 1 1 1", "0 0 0 1 1 1"],
      ],
      [
        "第二原列",
        "1、1展開成六個1，也輸出兩列。",
        ["1 1 1 1 1 1", "1 1 1 1 1 1"],
      ],
    ),
    cpp: String.raw`#include <iostream>
#include <vector>
using namespace std;
int main(){int n,m,p,q;cin>>n>>m>>p>>q;
    while(n--){vector<int>row;for(int j=0;j<m;++j){int x;cin>>x;for(int t=0;t<q;++t)row.push_back(x);}
        for(int t=0;t<p;++t){for(int j=0;j<(int)row.size();++j){if(j)cout<<' ';cout<<row[j];}cout<<'\n';}}
}`,
    python: String.raw`import sys
n, m, p, q = map(int, sys.stdin.buffer.readline().split())
for _ in range(n):
    row = list(map(int, sys.stdin.buffer.readline().split()))
    expanded = ' '.join(str(x) for x in row for _ in range(q))
    for _ in range(p):
        print(expanded)`,
  }),
  defineToiBeginnerLesson("a254", {
    topic: "number-theory",
    concept: "最小因數與商的質數檢查",
    goal: "判斷N能否恰好分解成兩個質數。",
    explanation: [
      "從2開始試除直到d²>N，找到第一個因數p時，p必為質數：如果p是合數，它較小的質因數早已整除N。若找不到任何因數，N本身為質數，無法寫成兩個大於1的質數乘積。",
      "找到p後令q=N/p，再用試除法檢查q是否為質數。q是質數就輸出p、q，否則輸出0 0；不必嘗試更大的第一因數，因為此時N已含至少三個質因數（計重複）。範例143最小因數11、商13，皆為質數。",
    ],
    complexity: "時間 O(√N) ・ 空間 O(1)",
    pitfall: "兩個質數可相同，如4=2×2；1不是質數，8=2×2×2也不是答案。",
    traceLabel: "範例143分解",
    trace: frames(
      ["試除2到10", "都無法整除143。", ["尚無因數"]],
      ["試除11", "143÷11=13，最小因數11為質數。", ["p：11", "q：13"]],
      ["檢查13", "13無小於等於平方根的因數，為質數。", ["輸出：11 13"]],
    ),
    cpp: String.raw`#include <iostream>
using namespace std;
bool prime(long long n){if(n<2)return false;for(long long d=2;d*d<=n;++d)if(n%d==0)return false;return true;}
int main(){long long n;cin>>n;for(long long p=2;p*p<=n;++p)if(n%p==0){
    long long q=n/p;if(prime(q))cout<<p<<' '<<q<<'\n';else cout<<"0 0\n";return 0;}cout<<"0 0\n";
}`,
    python: String.raw`from math import isqrt
n = int(input())
def prime(x):
    return x >= 2 and all(x % d for d in range(2, isqrt(x)+1))
for p in range(2, isqrt(n)+1):
    if n % p == 0:
        q = n // p
        print(p, q) if prime(q) else print(0, 0)
        break
else:
    print(0, 0)`,
  }),
  defineToiBeginnerLesson("a255", {
    topic: "conditions",
    concept: "有優先順序的房號分類",
    goal: "依1、2、3大樓條件的優先序判定各房號。",
    explanation: [
      "先檢查k是否為6的倍數，是則輸出1。否則檢查k為奇數且非3倍數，是則輸出2；十進位個位數奇數等價於整數為奇數。",
      "前兩類都不符才檢查完全平方數，或「偶數且非7倍數」，符合則輸出3，否則0。以整數平方根s檢查s²=k，避免用不精確的小數相等。",
      "順序決定答案。例如25和49雖為平方數，也符合2號大樓，因此歸2；81不符前兩類，靠平方數條件歸3。",
    ],
    complexity: "時間 O(N)（本題固定範圍整數平方根）・ 空間 O(N)（含輸出）",
    pitfall:
      "條件重疊必取最小樓號；3號條件的偶數限制只作用在「不是7的倍數」那一支。",
    traceLabel: "範例六個房號",
    trace: frames(
      [
        "先檢查優先類別",
        "18是6倍數歸1；25、49是非3倍數奇數歸2。",
        ["18→1", "25→2", "49→2"],
      ],
      ["檢查14與81", "14是7倍數且非平方故0；81是平方故3。", ["14→0", "81→3"]],
      ["檢查22並輸出", "22為非7倍數偶數，歸3。", ["輸出：1 2 2 0 3 3"]],
    ),
    cpp: String.raw`#include <iostream>
#include <cmath>
using namespace std;
int main(){int n;cin>>n;for(int i=0;i<n;++i){long long k;cin>>k;long long s=sqrt((double)k);
    while((s+1)*(s+1)<=k)++s;while(s*s>k)--s;int ans=0;
    if(k%6==0)ans=1;else if(k%2==1&&k%3!=0)ans=2;else if(s*s==k||(k%2==0&&k%7!=0))ans=3;
    if(i)cout<<' ';cout<<ans;}cout<<'\n';
}`,
    python: String.raw`import sys
from math import isqrt
it = iter(map(int, sys.stdin.buffer.read().split()))
out = []
for _ in range(next(it)):
    k = next(it)
    if k % 6 == 0:
        ans = 1
    elif k % 2 == 1 and k % 3 != 0:
        ans = 2
    elif isqrt(k)**2 == k or (k % 2 == 0 and k % 7 != 0):
        ans = 3
    else:
        ans = 0
    out.append(ans)
print(*out)`,
  }),
  defineToiBeginnerLesson("a256", {
    topic: "number-theory",
    concept: "互補步數與必敗餘數",
    goal: "判斷最佳策略下先手能否恰好搶到T。",
    explanation: [
      "若距離目標剩下R+1的倍數，無論本回合加x（1≤x≤R），對手都可加R+1-x，讓兩回合合計R+1，繼續把倍數距離留給自己面前的對手。因此這是必敗狀態。",
      "若T除以R+1餘r不為0，先手先加r，之後每次與對手的步數互補為R+1，即可恰好到達T。故答案為 T%(R+1)!=0。範例23%5=3，先加3便能保證獲勝。",
    ],
    complexity: "時間 O(1) ・ 空間 O(1)",
    pitfall: "目標是恰好T，最後一步不能超過；判斷用R+1而非R。",
    traceLabel: "範例T23、R4的保證策略",
    trace: frames(
      ["求餘數", "23除以5餘3，先手先加3。", ["目前：3", "剩餘：20"]],
      [
        "維持互補",
        "若對手加1、2、3、4，先手分別回4、3、2、1。",
        ["兩回合：5", "先手回合後：8、13、18"],
      ],
      ["最後搶到23", "從18開始，對手加x，先手加5-x。", ["終點：23", "輸出：1"]],
    ),
    cpp: String.raw`#include <iostream>
using namespace std;
int main(){int t,r;cin>>t>>r;cout<<(t%(r+1)!=0)<<'\n';}`,
    python: String.raw`t, r = map(int, input().split())
print(int(t % (r+1) != 0))`,
  }),
  defineToiBeginnerLesson("a257", {
    topic: "grid",
    concept: "夜晚對角感染與白天正向擴張",
    goal: "以每階段同步規則模擬K天勢力變化。",
    explanation: [
      "每一天先複製日初矩陣作為night。只從日初為-1的格子，向四個對角格傳播，目標若是獵人1就不能感染。讀取日初、寫入night，避免同夜連鎖傳播。",
      "再複製night成day，只從night中為1的格子向上下左右擴張，直接將目標改成1，會消滅吸血鬼。白天同樣不可從剛擴張的格子繼續擴張。完成後day成為下一天的初始矩陣。",
      "原勢力若未被獵人覆蓋會保留。範例完成兩天後，獵人從(3,3)擴成曼哈頓距離2的區域，而吸血鬼對角擴散中落入此區的部分被消滅。",
    ],
    complexity: "時間 O(KHW) ・ 空間 O(HW)",
    pitfall:
      "先夜再日，夜晚不能感染獵人；不能把兩個階段合在同一張原地更新矩陣。",
    traceLabel: "範例兩天勢力變化",
    trace: frames(
      [
        "第0天",
        "吸血鬼在(0,1)，獵人在(3,3)，座標從0起算。",
        ["0 -1 0 0 0", "0 0 0 0 0", "0 0 0 0 0", "0 0 0 1 0"],
      ],
      [
        "第1天結束",
        "夜感染(1,0)、(1,2)，白天獵人擴到三個鄰格。",
        ["0 -1 0 0 0", "-1 0 -1 0 0", "0 0 0 1 0", "0 0 1 1 1"],
      ],
      [
        "第2天結束",
        "再夜再日，獵人覆蓋(2,2)、(2,4)等位置。",
        ["0 -1 0 -1 0", "-1 0 -1 1 0", "0 -1 1 1 1", "0 1 1 1 1"],
      ],
    ),
    cpp: String.raw`#include <iostream>
#include <vector>
using namespace std;
int main(){int h,w,k;cin>>h>>w>>k;vector<vector<int>>a(h,vector<int>(w));for(auto &row:a)for(int &x:row)cin>>x;
    int dr[]={-1,1,0,0},dc[]={0,0,-1,1};
    while(k--){auto night=a;
        for(int r=0;r<h;++r)for(int c=0;c<w;++c)if(a[r][c]==-1)
            for(int x:{-1,1})for(int y:{-1,1}){int rr=r+x,cc=c+y;
                if(rr>=0&&rr<h&&cc>=0&&cc<w&&a[rr][cc]!=1)night[rr][cc]=-1;}
        auto day=night;
        for(int r=0;r<h;++r)for(int c=0;c<w;++c)if(night[r][c]==1)
            for(int d=0;d<4;++d){int rr=r+dr[d],cc=c+dc[d];if(rr>=0&&rr<h&&cc>=0&&cc<w)day[rr][cc]=1;}
        a.swap(day);
    }
    for(auto &row:a){for(int c=0;c<w;++c){if(c)cout<<' ';cout<<row[c];}cout<<'\n';}
}`,
    python: String.raw`import sys
it = iter(map(int, sys.stdin.buffer.read().split()))
h, w, k = next(it), next(it), next(it)
a = [[next(it) for _ in range(w)] for _ in range(h)]
for _ in range(k):
    night = [row[:] for row in a]
    for r in range(h):
        for c in range(w):
            if a[r][c] == -1:
                for dr, dc in ((-1,-1), (-1,1), (1,-1), (1,1)):
                    x, y = r+dr, c+dc
                    if 0 <= x < h and 0 <= y < w and a[x][y] != 1:
                        night[x][y] = -1
    day = [row[:] for row in night]
    for r in range(h):
        for c in range(w):
            if night[r][c] == 1:
                for x, y in ((r-1,c), (r+1,c), (r,c-1), (r,c+1)):
                    if 0 <= x < h and 0 <= y < w:
                        day[x][y] = 1
    a = day
for row in a:
    print(*row)`,
  }),
  defineToiBeginnerLesson("a258", {
    topic: "text",
    concept: "回文與鏡像字母雙重檢查",
    goal: "確認字串左右相同，且所有字母都可鏡像。",
    explanation: [
      "鏡像對稱需要兩件事同時成立：字串等於反轉結果，且每個字母皆位於AHIMOTUVWXY。即使是回文，含B等不允許字母也不符合。",
      "可用雙指標比較對稱位置，同時檢查字母集合；Python也可直接與切片反轉比較。範例TAMAT左右相同，T、A、M均允許，故Yes。",
    ],
    complexity: "時間 O(N) ・ 空間 C++ O(1)額外、Python O(N)反轉切片",
    pitfall: "只檢查回文或只檢查字母集合都不夠；中心字母也須在集合內。",
    traceLabel: "範例TAMAT",
    trace: frames(
      ["比較外側", "第一與最後字母皆為T，且T允許。", ["T ↔ T：相同"]],
      ["比較內側與中心", "A對A，中心M也允許。", ["A ↔ A：相同", "M：允許"]],
      ["兩項都通過", "回文且所有字母均可鏡像。", ["輸出：Yes"]],
    ),
    cpp: String.raw`#include <iostream>
#include <string>
using namespace std;
int main(){string s,allowed="AHIMOTUVWXY";cin>>s;bool ok=true;
    for(int i=0;i<(int)s.size();++i)if(s[i]!=s[s.size()-1-i]||allowed.find(s[i])==string::npos)ok=false;
    cout<<(ok?"Yes":"No")<<'\n';
}`,
    python: String.raw`s = input().strip()
allowed = set('AHIMOTUVWXY')
print('Yes' if s == s[::-1] and all(c in allowed for c in s) else 'No')`,
  }),
  defineToiBeginnerLesson("a259", {
    topic: "count-frequency",
    concept: "完整牌組的最小與最大頻率",
    goal: "求現有牌最多完整副數，以及使用所有牌所需補牌數。",
    explanation: [
      "建立1到52的頻率表，缺少的牌其頻率必須保留0。只用現有牌，每副各消耗每種一張，因此完整副數受最少的頻率限制，答案為min(count)。",
      "要使用所有現有牌，若某種最多有h張，就至少需要h副；取h=max(count)副時，每種補到h張即可達成。補牌數為Σ(h-count[i])=52h-N。範例2號有兩張，其他有些缺牌，現有完整0副，補成兩副需104-7=97張。",
    ],
    complexity: "時間 O(N+52) ・ 計數表 O(52)，Python含輸入O(N+52)",
    pitfall: "不可只在出現過的編號中取最小值；補牌不是只補成一副。",
    traceLabel: "範例牌組頻率",
    trace: frames(
      [
        "統計現有牌",
        "2號有2張，5、13、26、39、52各1張。",
        ["最多：2", "總張數：7"],
      ],
      ["現有完整副數", "1號等牌缺少，最小頻率為0。", ["可組：0副"]],
      [
        "補足所有牌",
        "至少2副，總需104張，還缺97張。",
        ["52×2-7=97", "輸出：0 97"],
      ],
    ),
    cpp: String.raw`#include <iostream>
#include <array>
#include <algorithm>
using namespace std;
int main(){int n;cin>>n;array<int,52>cnt{};for(int i=0;i<n;++i){int x;cin>>x;++cnt[x-1];}
    int low=*min_element(cnt.begin(),cnt.end()),high=*max_element(cnt.begin(),cnt.end());
    cout<<low<<' '<<52*high-n<<'\n';
}`,
    python: String.raw`import sys
it = iter(map(int, sys.stdin.buffer.read().split()))
n = next(it)
count = [0] * 52
for _ in range(n):
    count[next(it)-1] += 1
print(min(count), 52*max(count)-n)`,
  }),
  defineToiBeginnerLesson("a260", {
    topic: "grid",
    concept: "直行優先的連續填色段",
    goal: "先產生全部欄提示，再產生全部列提示。",
    explanation: [
      "對一條線，由上到下或由左到右掃描，遇到1就增加段長，遇到0就將非零段長存入答案並歸零。掃完後補上最後一段，若整條沒有段就輸出0。",
      "先以欄為外迴圈、列為內迴圈產生N條直行提示，再對原矩陣各列產生N條橫列提示。範例第一欄是1、0、0、1，提示1 1；第三橫列全空，提示0。",
    ],
    complexity: "時間 O(N²) ・ 空間 O(N²)（矩陣及輸入）；單條提示O(N)",
    pitfall: "輸出順序先直行後橫列；末尾填色段與全空線的0都不可漏。",
    traceLabel: "範例4×4數織",
    trace: frames(
      ["前兩直行", "欄1為1001，欄2為1100。", ["欄1：1 1", "欄2：2"]],
      ["後兩直行", "欄3為0101，欄4為0001。", ["欄3：1 1", "欄4：1"]],
      [
        "全部橫列",
        "1100、0110、0000、1011依序轉換。",
        ["列1：2", "列2：2", "列3：0", "列4：1 2"],
      ],
    ),
    cpp: String.raw`#include <iostream>
#include <vector>
using namespace std;
void output(const vector<int>&line){vector<int>runs;int len=0;
    for(int v:line){if(v)++len;else if(len){runs.push_back(len);len=0;}}if(len)runs.push_back(len);
    if(runs.empty())cout<<0;else for(int i=0;i<(int)runs.size();++i){if(i)cout<<' ';cout<<runs[i];}cout<<'\n';
}
int main(){int n;cin>>n;vector<vector<int>>a(n,vector<int>(n));for(auto &row:a)for(int &x:row)cin>>x;
    for(int c=0;c<n;++c){vector<int>col;for(int r=0;r<n;++r)col.push_back(a[r][c]);output(col);}
    for(auto &row:a)output(row);
}`,
    python: String.raw`import sys
it = iter(map(int, sys.stdin.buffer.read().split()))
n = next(it)
a = [[next(it) for _ in range(n)] for _ in range(n)]
def output(line):
    runs, length = [], 0
    for v in line:
        if v:
            length += 1
        elif length:
            runs.append(length)
            length = 0
    if length:
        runs.append(length)
    print(*(runs or [0]))
for c in range(n):
    output(a[r][c] for r in range(n))
for row in a:
    output(row)`,
  }),
  defineToiBeginnerLesson("a261", {
    topic: "number-theory",
    concept: "成對因數與最小值平手",
    goal: "找出閉區間內因數最多的最小整數與其因數個數。",
    explanation: [
      "對區間內每個n，只測試d≤√n。若d整除n，就有d和n/d兩個因數；當d²=n時兩者相同，僅計一次。這也使n=1正確得到一個因數。",
      "從x遞增走到y，只在新因數個數嚴格較大時更新答案，平手保留較小n。範例24有1、2、3、4、6、8、12、24八個因數，30雖也八個，仍選24。",
    ],
    complexity: "時間 O((y-x+1)√y) ・ 空間 O(1)",
    pitfall: "包含x和y，平方根因數不能重複計算；平手不可用>=更新。",
    traceLabel: "範例20到30",
    trace: frames(
      ["先檢查20", "因數1、2、4、5、10、20，共6個。", ["暫時答案：20 6"]],
      ["走到24", "四對因數，共8個，刷新紀錄。", ["1×24", "2×12", "3×8", "4×6"]],
      ["後續至30", "30也是8個，平手保留較小的24。", ["輸出：24 8"]],
    ),
    cpp: String.raw`#include <iostream>
using namespace std;
int main(){int x,y;cin>>x>>y;int best=x,count=-1;
    for(int n=x;n<=y;++n){int total=0;for(int d=1;d*d<=n;++d)if(n%d==0)total+=(d*d==n?1:2);
        if(total>count){count=total;best=n;}}
    cout<<best<<' '<<count<<'\n';
}`,
    python: String.raw`from math import isqrt
x, y = map(int, input().split())
best, maximum = x, -1
for n in range(x, y+1):
    count = sum(1 if d*d == n else 2 for d in range(1, isqrt(n)+1) if n % d == 0)
    if count > maximum:
        best, maximum = n, count
print(best, maximum)`,
  }),
  defineToiBeginnerLesson("a262", {
    topic: "read-calculate",
    concept: "三種完整費用取最小",
    goal: "依總騎乘分鐘計算最便宜的單一方案。",
    explanation: [
      "分別計算不選月費的3T、299方案的299+3max(0,T-300)、699方案的699+3max(0,T-750)。超額分鐘不能是負數，未用滿贈送分鐘也不能退月費。",
      "只需取三個完整費用的最小值。方案不能重複購買或合併。範例T=751時三者為2253、1652、702，因此輸出702。",
    ],
    complexity: "時間 O(1) ・ 空間 O(1)",
    pitfall: "T=0可不選方案而付0；不能把月費當成可重複買的分鐘包。",
    traceLabel: "範例751分鐘",
    trace: frames(
      ["不選方案", "全部每分鐘3元。", ["3×751：2253"]],
      ["299方案", "超過300的451分鐘另付1353元。", ["299+1353：1652"]],
      ["699方案", "只超過1分鐘，總額702最少。", ["699+3：702", "輸出：702"]],
    ),
    cpp: String.raw`#include <iostream>
#include <algorithm>
using namespace std;
int main(){int t;cin>>t;cout<<min({3*t,299+3*max(0,t-300),699+3*max(0,t-750)})<<'\n';}`,
    python: String.raw`t = int(input())
print(min(3*t, 299+3*max(0,t-300), 699+3*max(0,t-750)))`,
  }),
  defineToiBeginnerLesson("a263", {
    topic: "read-calculate",
    concept: "年內日序與循環差值",
    goal: "依固定365天曆計算距離下一生日的天數。",
    explanation: [
      "建立十二個月天數，將日期轉成年內日序：該月之前天數總和加日期。今天與生日都套用相同轉換。",
      "生日序減今天序，若為負就加365；非負則直接使用。Python可用差值%365，C++先加365再取模。相同日期得到0。範例2/27為第58天，3/2為第61天，相差3天。",
    ],
    complexity: "時間 O(12) ・ 空間 O(12)，皆為固定大小",
    pitfall: "不計閏年；今天不額外算一天，同日生日輸出0。",
    traceLabel: "範例2月27日至3月2日",
    trace: frames(
      ["今天日序", "1月31天加2月27天。", ["今天：58"]],
      ["生日日序", "1月31天、2月28天，加3月2天。", ["生日：61"]],
      ["計算差", "61-58為3，無需跨年。", ["輸出：3"]],
    ),
    cpp: String.raw`#include <iostream>
using namespace std;
int main(){int days[]={31,28,31,30,31,30,31,31,30,31,30,31};int m,d,b,e;cin>>m>>d>>b>>e;
    for(int i=0;i<m-1;++i)d+=days[i];for(int i=0;i<b-1;++i)e+=days[i];cout<<(e-d+365)%365<<'\n';}`,
    python: String.raw`import sys
m, d, b, e = map(int, sys.stdin.read().split())
days = [31,28,31,30,31,30,31,31,30,31,30,31]
today = sum(days[:m-1]) + d
birthday = sum(days[:b-1]) + e
print((birthday-today) % 365)`,
  }),
  defineToiBeginnerLesson("a264", {
    topic: "text",
    concept: "保留非字母的模26位移",
    goal: "讀取整行文字並依大小寫分別套用凱撒加密。",
    explanation: [
      "使用整行讀取保留空白。對大寫字母以A為基準轉成0到25，對小寫以a為基準；將編號加k後取模26，再轉回原大小寫字母。",
      "僅檢查ASCII英文字母範圍，其餘字元原樣附加。範例Zebra變Bgdtc、go變iq，中間的-42、逗號、空白與驚嘆號都保持不變。",
    ],
    complexity: "時間 O(|S|) ・ 空間 O(|S|)",
    pitfall:
      "不可用單字讀取而截斷空格，也不能strip掉原文字前後空白；只移除行尾換行。",
    traceLabel: "範例位移2",
    trace: frames(
      ["位移Zebra", "Z繞回B，其餘字母前進2。", ["Zebra→Bgdtc"]],
      ["保留非字母", "數字、連字號、逗號、空格都不改。", ["-42, →-42, "]],
      ["完成go!", "g→i、o→q，驚嘆號保持。", ["輸出：Bgdtc-42, iq!"]],
    ),
    cpp: String.raw`#include <iostream>
#include <string>
using namespace std;
int main(){string s;getline(cin,s);int k;cin>>k;
    for(char &c:s){if(c>='A'&&c<='Z')c=char('A'+(c-'A'+k)%26);else if(c>='a'&&c<='z')c=char('a'+(c-'a'+k)%26);}
    cout<<s<<'\n';
}`,
    python: String.raw`import sys
s = sys.stdin.readline().rstrip('\r\n')
k = int(sys.stdin.readline())
out = []
for c in s:
    if 'A' <= c <= 'Z':
        c = chr(ord('A') + (ord(c)-ord('A')+k) % 26)
    elif 'a' <= c <= 'z':
        c = chr(ord('a') + (ord(c)-ord('a')+k) % 26)
    out.append(c)
print(''.join(out))`,
  }),
  defineToiBeginnerLesson("a265", {
    topic: "read-calculate",
    concept: "三軸整除與分塊乘積",
    goal: "判定起司三邊能否無餘料切成K邊長方塊。",
    explanation: [
      "沿三個方向都要恰好切完，因此L、W、H每個都必須是K的倍數。只檢查總體積整除K³不夠，因為某方向仍可能有餘料。",
      "三者皆整除時，每軸分別有L/K、W/K、H/K段，總塊數是三段數乘積；任何一軸不整除就輸出0。範例為4×5×3=60塊。",
    ],
    complexity: "時間 O(1) ・ 空間 O(1)",
    pitfall:
      "三個維度要各自整除，不可只算體積商。最大答案10億，C++用long long處理乘積。",
    traceLabel: "範例24×30×18、K6",
    trace: frames(
      [
        "逐軸檢查",
        "24、30、18除以6都沒有餘數。",
        ["24%6=0", "30%6=0", "18%6=0"],
      ],
      ["取得段數", "長、寬、高方向分別4、5、3段。", ["4", "5", "3"]],
      ["相乘", "每組三軸段位置對應一塊。", ["4×5×3", "輸出：60"]],
    ),
    cpp: String.raw`#include <iostream>
using namespace std;
int main(){long long l,w,h,k;cin>>l>>w>>h>>k;if(l%k||w%k||h%k)cout<<0<<'\n';else cout<<(l/k)*(w/k)*(h/k)<<'\n';}`,
    python: String.raw`l, w, h, k = map(int, input().split())
print((l//k)*(w//k)*(h//k) if l%k == 0 and w%k == 0 and h%k == 0 else 0)`,
  }),
  defineToiBeginnerLesson("a266", {
    topic: "simulation",
    concept: "依輸出奇偶選陣列並整批更新",
    goal: "完整輸出兩陣列互動過程，直到包含最後的0。",
    explanation: [
      "第一輪選A，之後上一輪輸出奇數選A、偶數選B。每輪依目前所選陣列第一個元素是否為3倍數決定模式：是則取最大值，否則取正數最小值。0也是3倍數。",
      "先固定本輪輸出值v，再將所有等於v的元素一起更新：最大模式整除2，最小模式減1。輸出0時立即結束。以第一個元素判模式，不能改成看最大值或上一輸出是否為3倍數。",
      "每次正輸出都會讓元素總和至少減1，所以必會終止。若第一元素不被3整除，它必為正，因此正數最小值總是存在。兩陣列初始總和不超過10000，可界定回合數。",
    ],
    complexity:
      "時間 O(Σ初始元素)，每回合只處理5格 ・ 狀態空間 O(1)，Python輸出緩衝O(回合數)",
    pitfall: "重複的最大／最小值全部更新；輸出值在更新前決定，最後0也要輸出。",
    traceLabel: "範例前段與結束狀態",
    trace: frames(
      [
        "第1輪選A",
        "A首項6為3倍數，輸出最大8並將8變4。",
        ["A：6 2 4 2 4", "輸出：8"],
      ],
      [
        "第2、3輪",
        "8為偶數選B，輸出最小正數1；接著選A輸出最大6。",
        ["B：5 3 9 0 7", "A：3 2 4 2 4", "輸出續：1、6"],
      ],
      [
        "第4至12輪",
        "繼續按上一輸出選陣列並整批更新，A先歸零。",
        ["輸出續：3 4 2 1 3 1 2 5 1", "A：0 0 0 0 0", "B：4 0 9 0 7"],
      ],
      ["第13輪", "上一輸出1選A；首項0為3倍數，最大值0，結束。", ["輸出：0"]],
    ),
    cpp: String.raw`#include <iostream>
#include <array>
#include <algorithm>
using namespace std;
int main(){array<int,5>a,b;for(int &x:a)cin>>x;for(int &x:b)cin>>x;int prev=1;
    while(true){auto &v=prev%2?a:b;bool halve=v[0]%3==0;int value=0;
        if(halve)value=*max_element(v.begin(),v.end());else{value=1001;for(int x:v)if(x>0)value=min(value,x);}
        cout<<value<<'\n';if(value==0)break;
        for(int &x:v)if(x==value)x=halve?x/2:x-1;prev=value;
    }
}`,
    python: String.raw`import sys
d = list(map(int, sys.stdin.buffer.read().split()))
a, b = d[:5], d[5:10]
previous = 1
out = []
while True:
    v = a if previous % 2 else b
    halve = v[0] % 3 == 0
    value = max(v) if halve else min(x for x in v if x > 0)
    out.append(str(value))
    if value == 0:
        break
    for i in range(5):
        if v[i] == value:
            v[i] = value//2 if halve else value-1
    previous = value
print('\n'.join(out))`,
  }),
  defineToiBeginnerLesson("a267", {
    topic: "read-calculate",
    concept: "商品單價查表與結束記號",
    goal: "依每筆商品編號和重量累加購物總價。",
    explanation: [
      "先讀取N種商品的每公克單價P。之後逐筆讀X、G，若為0 0就結束，其他紀錄將P[X-1]×G加入總金額。",
      "同商品重複購買仍逐筆計價，不能以後一筆覆寫前一筆。範例商品4買6公克30元，商品2買10公克30元，商品4再買4公克20元，共80。C++用long long累加多筆金額。",
    ],
    complexity: "時間 O(N+Q) ・ 狀態空間 O(N)（Python含輸入O(N+Q)）",
    pitfall:
      "商品編號從1開始；先判終止記號再查單價，以免索引0的記號被當成商品。",
    traceLabel: "範例三筆購買",
    trace: frames(
      ["商品4買6公克", "每公克5元，累加30。", ["總額：30"]],
      ["商品2買10公克", "每公克3元，再加30。", ["總額：60"]],
      ["商品4再買4公克", "再加20，0 0不計價。", ["總額：80", "輸出：80"]],
    ),
    cpp: String.raw`#include <iostream>
#include <vector>
using namespace std;
int main(){int n;cin>>n;vector<int>p(n+1);for(int i=1;i<=n;++i)cin>>p[i];long long total=0;int x,g;
    while(cin>>x>>g){if(x==0&&g==0)break;total+=1LL*p[x]*g;}cout<<total<<'\n';}`,
    python: String.raw`import sys
it = iter(map(int, sys.stdin.buffer.read().split()))
n = next(it)
p = [next(it) for _ in range(n)]
total = 0
for x, g in zip(it, it):
    if x == 0 and g == 0:
        break
    total += p[x-1]*g
print(total)`,
  }),
  defineToiBeginnerLesson("a268", {
    topic: "arrays",
    concept: "唯一編號的位置反查表",
    goal: "按查詢順序回報香料的1起算座標或-1。",
    explanation: [
      "輸入先給查詢清單，需先保留，之後才讀R、C與貨架。讀貨架時建立編號到(列+1,欄+1)的映射；貨架編號皆唯一，因此沒有覆寫歧義。",
      "逐筆查詢映射，有編號就輸出層數及層中位置，沒有則只輸出-1。重複查詢仍重複輸出，不能把查詢去重或排序。範例42出現兩次，第一與第五行同為1 2。",
    ],
    complexity: "平均時間 O(RC+N) ・ 空間 O(RC+N)",
    pitfall:
      "題目只限制查詢編號上限，不必假設貨架編號也都≤20000；以映射儲存更穩妥。",
    traceLabel: "範例香料反查",
    trace: frames(
      [
        "建立貨架映射",
        "第一層17、42、6，第二層31、12、8。",
        ["42→1 2", "8→2 3", "31→2 1"],
      ],
      ["前三筆查詢", "依42、8、99查找；99不在貨架上。", ["1 2", "2 3", "-1"]],
      ["最後兩筆", "31與重複查詢42各自輸出。", ["2 1", "1 2"]],
    ),
    cpp: String.raw`#include <iostream>
#include <vector>
#include <unordered_map>
#include <utility>
using namespace std;
int main(){int n;cin>>n;vector<long long>query(n);for(auto &x:query)cin>>x;int r,c;cin>>r>>c;
    unordered_map<long long,pair<int,int>>pos;for(int i=1;i<=r;++i)for(int j=1;j<=c;++j){long long x;cin>>x;pos[x]={i,j};}
    for(auto x:query){auto it=pos.find(x);if(it==pos.end())cout<<-1<<'\n';else cout<<it->second.first<<' '<<it->second.second<<'\n';}
}`,
    python: String.raw`import sys
it = iter(map(int, sys.stdin.buffer.read().split()))
n = next(it)
queries = [next(it) for _ in range(n)]
r, c = next(it), next(it)
pos = {}
for i in range(1, r+1):
    for j in range(1, c+1):
        pos[next(it)] = (i, j)
for x in queries:
    if x in pos:
        print(*pos[x])
    else:
        print(-1)`,
  }),
];
