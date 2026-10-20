import { defineCpeLesson } from "@/lib/cpeLessonBuilder";

export const lessons = [
  defineCpeLesson("a748", {
    topic: "simulation", level: "easy", concept: "位置配對與數字多重集合交集", goal: "在重複數字下正確分開 strong 與 weak。",
    explanation: ["先逐位置比較，完全相同的數量就是 strong。再分別統計答案和猜測的各數字次數，對每個數字取兩次數的最小值，總和得到不考慮位置時最多能配成的總對數。", "總配對數已包含 strong，因此 weak=總配對−strong。這樣等價於先移走全部 strong 再配其餘數字，又不必實際標記每個位置。每局 N 個 0 的猜測只代表該局結束；下一個 N=0 才終止全部輸入。依 Game k: 和四個前導空白輸出 (S,W)。"],
    complexity: "每次猜測時間 O(N+10)，額外空間 O(10)。", pitfall: "同一個數字位置不能重複配對；weak 不能直接用總共同字數。",
    traceLabel: "示意：答案 1,3,5,5；猜測 1,1,2,3", trace: [
      { title: "位置比較", description: "只有第 1 格完全相同。", cells: ["1=1", "3≠1", "5≠2", "5≠3"], active: [0], variables: [["strong", "1"]] },
      { title: "次數交集", description: "數字 1 共用 1 次、數字 3 共用 1 次。", cells: ["1:1", "3:1", "5:0"], active: [0,1], variables: [["總配對", "2"]] },
      { title: "扣掉 strong", description: "weak=2−1=1，輸出 (1,1)。", cells: ["2", "−1", "1"], active: [2], variables: [["weak", "1"]] },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;
int main(){int n,game=0;while(cin>>n&&n){vector<int>a(n);int fa[10]={};for(int &x:a){cin>>x;++fa[x];}cout<<"Game "<<++game<<":\n";
while(true){vector<int>b(n);int fb[10]={},sum=0,strong=0;for(int i=0;i<n;++i){cin>>b[i];sum+=b[i];++fb[b[i]];strong+=a[i]==b[i];}if(!sum)break;
int total=0;for(int x=1;x<=9;++x)total+=min(fa[x],fb[x]);cout<<"    ("<<strong<<','<<total-strong<<")\n";
}}}`, 
    python: String.raw`import sys
from collections import Counter
it = iter(map(int,sys.stdin.buffer.read().split())); game = 0
for n in it:
    if n == 0: break
    a = [next(it) for _ in range(n)]; fa = Counter(a); game += 1
    print(f'Game {game}:')
    while True:
        b = [next(it) for _ in range(n)]
        if not any(b): break
        strong = sum(x==y for x,y in zip(a,b)); fb = Counter(b)
        total = sum(min(fa[x],fb[x]) for x in fa)
        print(f'    ({strong},{total-strong})')`,
  }),
  defineCpeLesson("a749", {
    topic: "sorting", level: "easy", concept: "絕對距離和的中位數最優性", goal: "以中位門牌計算最小總距離。",
    explanation: ["排序後，把最左和最右的門牌配成一對。選址位於這對門牌之間時，到兩者距離和等於其差；走到區間外只會增加成本。由外向內逐對分析，所有配對區間的交集包含中位數，因此中位數使總距離最小。", "奇數人取中央門牌，偶數人取兩個中位門牌間任一位置皆可，程式直接取索引 r/2。逐一累加與中位數的絕對差，重複門牌也要分別計入。第一行是測試筆數，每筆只輸出距離總和，不輸出選址。"],
    complexity: "每題時間 O(r log r)，空間 O(r)。", pitfall: "平均數對平方距離合適，本題是絕對距離，應使用中位數。",
    traceLabel: "示意：門牌 2,4,9", trace: [
      { title: "排序找中位數", description: "中央門牌是 4。", cells: ["2", "4", "9"], active: [1], variables: [["median", "4"]] },
      { title: "累加前兩戶", description: "|2−4|+|4−4|=2。", cells: ["2", "0", "5"], active: [0,1], variables: [["累計", "2"]] },
      { title: "累加最後一戶", description: "再加 |9−4|=5，最小距離為 7。", cells: ["2", "+0", "+5", "=7"], active: [3], variables: [["答案", "7"]] },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <algorithm>
#include <cstdlib>
using namespace std;
int main(){int t;cin>>t;while(t--){int n;cin>>n;vector<int>a(n);for(int &x:a)cin>>x;sort(a.begin(),a.end());long long total=0;for(int x:a)total+=abs(x-a[n/2]);cout<<total<<'\n';}}`,
    python: String.raw`import sys
it = iter(map(int,sys.stdin.buffer.read().split()))
for _ in range(next(it)):
    a = sorted(next(it) for _ in range(next(it)))
    m = a[len(a)//2]
    print(sum(abs(x-m) for x in a))`,
  }),
  defineCpeLesson("a750", {
    topic: "dp", level: "medium", concept: "補集計數與尾端連續 U 狀態", goal: "先數安全堆疊，再從全部 2ⁿ 種中扣除。",
    explanation: ["直接計數含 UUU 的堆疊容易重複計算重疊區段，改數沒有 UUU 的安全排列。以尾端連續 U 的個數 0、1、2 作為狀態，空堆疊初值是 [1,0,0]。加入 L 會把全部狀態移到 0；加入 U 只能使 0→1、1→2，2→3 的危險轉移不保留。", "逐層轉移得到安全總數，危險數即 2ⁿ−safe[n]。預處理到 30 後每筆直接查表，使用 long long 和 1LL<<n 避免位移型別問題。輸入 n=0 結束，不輸出空堆疊。"],
    complexity: "預處理時間 O(30)、空間 O(30)；每查詢 O(1)。", pitfall: "同一排列可有多段 UUU，不能把每段出現位置的數量直接相加。",
    traceLabel: "示意：追蹤高度 1 到 3", trace: [
      { title: "高度 1", description: "L、U 各一種，尾端狀態為 [1,1,0]。", cells: ["0U:1", "1U:1", "2U:0"], active: [0,1], variables: [["safe", "2"], ["danger", "0"]] },
      { title: "高度 2", description: "狀態變成 [2,1,1]，四種都安全。", cells: ["0U:2", "1U:1", "2U:1"], active: [0,1,2], variables: [["safe", "4"]] },
      { title: "高度 3", description: "狀態 [4,2,1] 共 7，全部 8 種扣掉後有 1 種危險。", cells: ["4", "2", "1"], active: [0,1,2], variables: [["danger", "8−7=1"]] },
    ],
    cpp: String.raw`#include <iostream>
using namespace std;
int main(){long long answer[31]={},a=1,b=0,c=0;for(int n=1;n<=30;++n){long long x=a+b+c;c=b;b=a;a=x;answer[n]=(1LL<<n)-a-b-c;}int n;while(cin>>n&&n)cout<<answer[n]<<'\n';}`,
    python: String.raw`import sys
answer = [0]*31; a,b,c = 1,0,0
for n in range(1,31):
    a,b,c = a+b+c,a,b
    answer[n] = (1<<n)-a-b-c
for n in map(int,sys.stdin.buffer.read().split()):
    if n == 0: break
    print(answer[n])`,
  }),
  defineCpeLesson("a751", {
    topic: "dp", level: "hard", concept: "重量 DP 中的選取人數位元集合", goal: "兼顧體重接近與兩隊人數平衡。",
    explanation: ["只做可達重量的背包會忘記兩隊人數限制。令 masks[s] 的第 k 個位元表示能否選出恰好 k 人且總重 s，初始 masks[0]=1。加入體重 w 時，將 masks[s−w] 左移一位再 OR 到 masks[s]；重量倒序保證每人僅選一次。", "固定其中一隊人數為 floor(n/2)，另一隊自然為 ceil(n/2)。掃描所有帶此人數位元的重量 s，選 |total−2s| 最小者，輸出 min(s,total−s) 和 max。n≤100，所以需要的位元最多 50，C++ unsigned long long 足夠，即使更高位截斷也不影響低位。第一行測試組數，組間輸出空行。"],
    complexity: "總重 S≤45000，時間 O(nS)，空間 O(S) 個最多 51 位的集合。", pitfall: "固定少人隊後仍要掃描整個重量範圍，不能只看 S/2 以下，否則可能漏掉少人但較重的最佳隊。",
    traceLabel: "示意：100,90,200，共 3 人", trace: [
      { title: "前兩人", description: "可選一人得 90 或 100，選兩人得 190。", cells: ["90:k1", "100:k1", "190:k2"], active: [0,1,2], variables: [["目標人數", "1"]] },
      { title: "加入 200", description: "新增一人重量 200，總重為 390。", cells: ["90:k1", "100:k1", "200:k1"], active: [2], variables: [["total", "390"]] },
      { title: "挑最小差", description: "選一人 200 對另一隊 190，差只有 10。", cells: ["190", "200", "差10"], active: [0,1,2], variables: [["輸出", "190 200"]] },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <numeric>
#include <cstdlib>
#include <algorithm>
using namespace std;
int main(){int t;cin>>t;for(int cs=0;cs<t;++cs){int n;cin>>n;vector<int>w(n);for(int &v:w)cin>>v;int total=accumulate(w.begin(),w.end(),0),used=0;vector<unsigned long long>dp(total+1);dp[0]=1;
for(int v:w){used+=v;for(int s=used;s>=v;--s)dp[s]|=dp[s-v]<<1;}
int best=0,diff=total+1;for(int s=0;s<=total;++s)if((dp[s]>>(n/2))&1ULL)if(abs(total-2*s)<diff){diff=abs(total-2*s);best=s;}
if(cs)cout<<'\n';cout<<min(best,total-best)<<' '<<max(best,total-best)<<'\n';}}`,
    python: String.raw`import sys
it = iter(map(int,sys.stdin.buffer.read().split())); groups = []
for _ in range(next(it)):
    n = next(it); w = [next(it) for _ in range(n)]; total = sum(w)
    dp = [0]*(total+1); dp[0] = 1; used = 0; mask = (1<<(n//2+1))-1
    for v in w:
        used += v
        for s in range(used,v-1,-1): dp[s] |= (dp[s-v]<<1)&mask
    best = min((s for s in range(total+1) if dp[s]>>(n//2)&1),key=lambda s:abs(total-2*s))
    groups.append(f'{min(best,total-best)} {max(best,total-best)}')
print('\n\n'.join(groups))`,
  }),
  defineCpeLesson("a752", {
    topic: "basics", level: "easy", concept: "前綴最大值與有順序差值", goal: "一次掃描求最大的 score_i−score_j，i<j。",
    explanation: ["處理資淺學生 j 時，可以配對的資深學生僅限前面位置，最佳候選必定是前綴最大分數 prefixMax。因此先用 prefixMax−score[j] 更新答案，再把 score[j] 加入前綴最大值。", "先計算差值再更新前綴，確保不把學生和自己配對。答案用第一對合法學生的差初始化，不能從 0 開始，因為成績嚴格遞增時所有差都為負。每組至少兩人，依測試筆數讀入，逐組輸出一行最大有號差。"],
    complexity: "每組時間 O(n)、額外空間 O(1)。", pitfall: "不是絕對差，也不能直接以全域最大值減全域最小值而忽略先後順序。",
    traceLabel: "示意：4,7,2", trace: [
      { title: "第一人", description: "前綴最大值設為 4，尚無配對。", cells: ["4", "7", "2"], active: [0], variables: [["prefixMax", "4"]] },
      { title: "第二人", description: "合法差為 4−7=−3，再把前綴最大值改為 7。", cells: ["4", "7", "2"], active: [1], variables: [["best", "−3"], ["prefixMax", "7"]] },
      { title: "第三人", description: "7−2=5，比 −3 大，答案 5。", cells: ["4", "7", "2"], active: [1,2], variables: [["best", "5"]] },
    ],
    cpp: String.raw`#include <iostream>
#include <algorithm>
#include <limits>
using namespace std;
int main(){int t;cin>>t;while(t--){int n,prefix;cin>>n>>prefix;int best=numeric_limits<int>::min();for(int j=1;j<n;++j){int x;cin>>x;best=max(best,prefix-x);prefix=max(prefix,x);}cout<<best<<'\n';}}`,
    python: String.raw`import sys
it = iter(map(int,sys.stdin.buffer.read().split()))
for _ in range(next(it)):
    n = next(it); prefix = next(it); best = -10**30
    for _ in range(n-1):
        x = next(it); best = max(best,prefix-x); prefix = max(prefix,x)
    print(best)`,
  }),
  defineCpeLesson("a753", {
    topic: "number-theory", level: "easy", concept: "同字串的十進位與十六進位位元數", goal: "區分表示文字與其在不同基底下的數值。",
    explanation: ["同一字串例如 265，十進位值是 265，十六進位值則是 2×16²+6×16+5=613。第一個答案計算十進位值的二進位 1 數量，反覆取最低位並右移即可。", "第二個答案也可逐字算，因為每個十六進位數字恰好對應四個互不重疊的位元，所以各十進位數字 0 到 9 的 1 數量相加即可。這樣不必真的產生二進位字串。讀測試筆數後，每題輸出 b1 b2，中間一個空白。"],
    complexity: "時間 O(log M)，額外空間 O(1)。", pitfall: "不是把十進位 M 轉成十六進位文字後再數；兩者會得到同一數值，與題意不同。",
    traceLabel: "示意：字串 12", trace: [
      { title: "十進位解讀", description: "12 的二進位為 1100，共兩個 1。", cells: ["1", "1", "0", "0"], active: [0,1], variables: [["b1", "2"]] },
      { title: "十六進位解讀", description: "0x12=18，其兩個十六進位數字為 0001、0010。", cells: ["0001", "0010"], active: [0,1], variables: [["值", "18"]] },
      { title: "累加位元數", description: "各有一個 1，第二個答案也是 2。", cells: ["1", "+1", "=2"], active: [2], variables: [["輸出", "2 2"]] },
    ],
    cpp: String.raw`#include <iostream>
#include <string>
using namespace std;
int bits(int x){int ans=0;while(x){ans+=x&1;x>>=1;}return ans;}
int main(){int t;cin>>t;while(t--){string s;cin>>s;int b2=0;for(char c:s)b2+=bits(c-'0');cout<<bits(stoi(s))<<' '<<b2<<'\n';}}`,
    python: String.raw`import sys
data = sys.stdin.read().split()
for s in data[1:1+int(data[0])]:
    print(int(s).bit_count(),sum(int(c).bit_count() for c in s))`,
  }),
  defineCpeLesson("a754", {
    topic: "graphs", level: "hard", concept: "最大瓶頸路徑的 Dijkstra", goal: "用 max–min 轉移求可運送的最大重量。",
    explanation: ["路徑可載重量等於沿路最小邊權；多條路徑之間則取最大。令 best[v] 為目前找到從起點到 v 的最大瓶頸值，起點設為無限大。延伸一條限重 w 的邊時，候選值是 min(best[u],w)，比 best[v] 大才更新。", "每次選未確定節點中 best 最大者。任何經過其餘未確定點的繞路，瓶頸不會超過這個最大值，因此該點可立即確定，與最短路 Dijkstra 的論證對應。矩陣保留平行邊較大的限重。讀到 0 0 結束，Scenario #x 後接重量 tons，再印空行；零限重道路也可表示為容量 0。"],
    complexity: "n≤200，矩陣版時間 O(n²+r)、空間 O(n²)。", pitfall: "路徑不是邊權相加，也不是尋找單條最大限重道路。",
    traceLabel: "示意：AB=100，BC=80，AC=50", trace: [
      { title: "從 A 出發", description: "先得到 B 容量 100、C 容量 50。", cells: ["A:∞", "B:100", "C:50"], active: [0], variables: [["已確定數", "1"]] },
      { title: "確定 B", description: "經 B 到 C 的容量 min(100,80)=80。", cells: ["B:100", "BC:80", "C:80"], active: [0,1,2], variables: [["best[C]", "80"]] },
      { title: "確定 C", description: "間接路徑比直接的 50 更好，答案 80。", cells: ["直接50", "經B80"], active: [1], variables: [["tons", "80"]] },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <map>
#include <string>
#include <algorithm>
using namespace std;
int main(){int n,r,cs=0;while(cin>>n>>r&&(n||r)){vector<vector<int>>w(n,vector<int>(n));map<string,int>id;
auto get=[&](string s){if(!id.count(s)){int k=id.size();id[s]=k;}return id[s];};
while(r--){string a,b;int c;cin>>a>>b>>c;int u=get(a),v=get(b);w[u][v]=w[v][u]=max(w[u][v],c);}
string a,b;cin>>a>>b;int start=get(a),goal=get(b);vector<int>best(n),used(n);best[start]=1000000000;
for(int step=0;step<n;++step){int u=-1;for(int i=0;i<n;++i)if(!used[i]&&(u<0||best[i]>best[u]))u=i;if(u<0)break;used[u]=1;for(int v=0;v<n;++v)best[v]=max(best[v],min(best[u],w[u][v]));}
cout<<"Scenario #"<<++cs<<'\n'<<best[goal]<<" tons\n\n";
}}`,
    python: String.raw`import sys
it = iter(sys.stdin.read().split()); cs = 0
for token in it:
    n,r = int(token),int(next(it))
    if n == r == 0: break
    names = {}; w = [[0]*n for _ in range(n)]
    def get(s):
        if s not in names: names[s] = len(names)
        return names[s]
    for _ in range(r):
        a,b,c = next(it),next(it),int(next(it)); u,v = get(a),get(b)
        w[u][v] = w[v][u] = max(w[u][v],c)
    start,goal = get(next(it)),get(next(it)); best = [0]*n; used = [False]*n; best[start] = 10**9
    for _ in range(n):
        u = max((i for i in range(n) if not used[i]),key=best.__getitem__)
        used[u] = True
        for v in range(n): best[v] = max(best[v],min(best[u],w[u][v]))
    cs += 1; print(f'Scenario #{cs}\n{best[goal]} tons\n')`,
  }),
  defineCpeLesson("a755", {
    topic: "sorting", level: "easy", concept: "英文字母正規化與頻率排序", goal: "跨多行統計不分大小寫的英文字母。",
    explanation: ["將 a–z 轉為 A–Z，只有落在英文字母範圍的字元才更新 26 格計數。這裡不應使用廣泛的 Unicode 字母分類，因為題目只計英文字母。空白、數字、標點全部忽略。", "把有出現的字母依 (−次數,字母) 排序，先印最常見者，同次數時字母小者先印。第一行 n 表示後續恰好 n 行，即使中間有空行也占一行；不能用空行作為終止條件，也不應把 n 本身納入統計。"],
    complexity: "文字總長 L，時間 O(L+26 log 26)，空間 O(26)。", pitfall: "此題同次數用字母遞增，與 a746 的 ASCII 遞減規則不同。",
    traceLabel: "示意：文字 aB b!", trace: [
      { title: "處理 aB", description: "a 正規化為 A，B 維持 B。", cells: ["A:1", "B:1"], active: [0,1], variables: [["有效字母", "2"]] },
      { title: "處理 b!", description: "b 讓 B 次數變 2，驚嘆號不計。", cells: ["A:1", "B:2", "!:0"], active: [1], variables: [["有效字母", "3"]] },
      { title: "頻率降序", description: "先輸出 B 2，再輸出 A 1。", cells: ["B 2", "A 1"], active: [0,1], variables: [["輸出行數", "2"]] },
    ],
    cpp: String.raw`#include <iostream>
#include <string>
#include <vector>
#include <algorithm>
using namespace std;
int main(){int n;cin>>n;string s;getline(cin,s);int f[26]={};while(n--){getline(cin,s);for(char c:s){if(c>='a'&&c<='z')c-=32;if(c>='A'&&c<='Z')++f[c-'A'];}}
vector<int>a;for(int i=0;i<26;++i)if(f[i])a.push_back(i);sort(a.begin(),a.end(),[&](int x,int y){return f[x]!=f[y]?f[x]>f[y]:x<y;});for(int i:a)cout<<char('A'+i)<<' '<<f[i]<<'\n';}`, 
    python: String.raw`import sys
from collections import Counter
lines = iter(sys.stdin.read().splitlines()); n = int(next(lines)); f = Counter()
for _ in range(n): f.update(c for c in next(lines).upper() if 'A' <= c <= 'Z')
for c in sorted(f,key=lambda c:(-f[c],c)): print(c,f[c])`,
  }),
  defineCpeLesson("a756", {
    topic: "trees", level: "medium", concept: "前序定根與中序分割子樹", goal: "不用建節點物件也能直接產生後序。",
    explanation: ["前序的第一個字母是目前子樹根，找到它在中序的位置後，左側恰好是左子樹、右側恰好是右子樹。由中序左段長度可知前序接下來幾個字母屬於左子樹，剩下屬於右子樹，分割因字母不重複而唯一。", "使用區間索引和全域前序游標遞迴：取根、遞迴左區間、遞迴右區間、最後把根加入輸出。先建立字母到中序位置的表，每個根能 O(1) 定位。每行兩字串讀到 EOF，輸出後序字串，每筆一行；空子樹區間直接返回。"],
    complexity: "每棵樹時間 O(n)，空間 O(n)，遞迴深度最壞 n≤26。", pitfall: "根必須在左右子樹之後輸出；前序游標在兩個子樹之間不能重設。",
    traceLabel: "示意：pre=BAC，in=ABC", trace: [
      { title: "根 B", description: "B 在中序索引 1，左右分別是 A、C。", cells: ["A", "B", "C"], active: [1], variables: [["pre游標", "1"]] },
      { title: "完成左子樹", description: "A 是葉節點，先輸出 A。", cells: ["A", "B", "C"], active: [0], variables: [["post長度", "1"], ["post", "A"]] },
      { title: "右後根", description: "再輸出葉 C，最後 B，得到 ACB。", cells: ["A", "C", "B"], active: [1,2], variables: [["post長度", "3"]] },
    ],
    cpp: String.raw`#include <iostream>
#include <string>
#include <functional>
using namespace std;
int main(){string pre,in;while(cin>>pre>>in){int pos[256]={};for(int i=0;i<int(in.size());++i)pos[(unsigned char)in[i]]=i;int at=0;string out;
function<void(int,int)>visit=[&](int l,int r){if(l>=r)return;char root=pre[at++];int m=pos[(unsigned char)root];visit(l,m);visit(m+1,r);out+=root;};visit(0,in.size());cout<<out<<'\n';}}`,
    python: String.raw`import sys
data = sys.stdin.read().split()
for pre,ino in zip(data[::2],data[1::2]):
    pos = {c:i for i,c in enumerate(ino)}; at = 0; out = []
    def visit(l,r):
        global at
        if l >= r: return
        root = pre[at]; at += 1; m = pos[root]
        visit(l,m); visit(m+1,r); out.append(root)
    visit(0,len(ino)); print(''.join(out))`,
  }),
  defineCpeLesson("a757", {
    topic: "trees", level: "medium", concept: "堆疊輸出排列的強制模擬", goal: "依目標車廂順序檢查唯一可行的進出站動作。",
    explanation: ["設 next 為下一節尚未進站的車廂。對目標車廂 x，若堆疊頂不是 x，就依序把 next 推入直到頂端是 x 或所有車廂都已進站。若找到 x 就彈出；若仍不是 x，下面的車廂被頂端擋住，任何後續動作都不能先輸出 x，因此不可能。", "這個策略沒有遺漏選擇：頂端已是 x 時必須先輸出它，否則下一節進站只會阻擋；x 尚未進站時，其之前的所有車廂也都必須先進站。每個 N 區塊有多個排列，單獨 0 結束該區塊，再以 N=0 結束全部；每區塊後印一空行。"],
    complexity: "每個排列時間 O(N)、空間 O(N)。", pitfall: "判定失敗後仍須讀完該排列；不能把區塊結尾 0 當成一個車廂。",
    traceLabel: "示意：N=3，目標 2,1,3", trace: [
      { title: "要輸出 2", description: "先推入 1、2，再彈出 2。", cells: ["stack=[1]", "out=[2]"], active: [0,1], variables: [["next", "3"]] },
      { title: "要輸出 1", description: "頂端是 1，直接彈出。", cells: ["stack=[]", "out=[2,1]"], active: [1], variables: [["next", "3"]] },
      { title: "要輸出 3", description: "推入 3 再彈出，全部成功。", cells: ["stack=[]", "out=[2,1,3]"], active: [1], variables: [["可行", "1"]] },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
using namespace std;
int main(){int n;while(cin>>n&&n){int first;while(cin>>first&&first){vector<int>a(n);a[0]=first;for(int i=1;i<n;++i)cin>>a[i];vector<int>st;int next=1;bool ok=true;
for(int x:a){while((st.empty()||st.back()!=x)&&next<=n)st.push_back(next++);if(st.empty()||st.back()!=x){ok=false;break;}st.pop_back();}cout<<(ok?"Yes":"No")<<'\n';}cout<<'\n';}}`,
    python: String.raw`import sys
it = iter(map(int,sys.stdin.buffer.read().split()))
for n in it:
    if n == 0: break
    for first in it:
        if first == 0: break
        a = [first]+[next(it) for _ in range(n-1)]; stack = []; incoming = 1; ok = True
        for x in a:
            while (not stack or stack[-1] != x) and incoming <= n:
                stack.append(incoming); incoming += 1
            if not stack or stack[-1] != x: ok = False; break
            stack.pop()
        print('Yes' if ok else 'No')
    print()`,
  }),
  defineCpeLesson("a758", {
    topic: "graphs", level: "easy", concept: "棋盤八方向的 BFS 最短步數", goal: "把棋格作為節點，以等權邊搜尋最少騎士步。",
    explanation: ["棋格映射為 (x,y)，其中 a–h 對應 0–7、1–8 對應 0–7。騎士恰有八種位移 (±1,±2)、(±2,±1)，只有新座標仍在 0–7 內才建立可走的邊。", "每步成本都是 1，BFS 的佇列依距離層次擴展，第一次抵達某格的距離就是最短。起點距離為 0，入隊時便標記以避免重複；起終點相同自然輸出 0。位置配對讀到 EOF，輸出指定完整句子，1 步仍使用 moves。"],
    complexity: "每題時間與空間 O(64)，棋盤大小固定。", pitfall: "不能用曼哈頓距離取代實際 BFS，邊界會影響路徑。",
    traceLabel: "示意：a1 到 d4", trace: [
      { title: "起點", description: "a1=(0,0)，距離 0。", cells: ["a1:0", "b3:?", "d4:?"], active: [0], variables: [["distance", "0"]] },
      { title: "第一層", description: "可到 b3=(1,2) 與 c2=(2,1)。", cells: ["b3:1", "c2:1", "d4:?"], active: [0,1], variables: [["distance", "1"]] },
      { title: "第二層", description: "b3 加 (2,1) 到 d4，最少 2 步。", cells: ["a1", "b3", "d4"], active: [2], variables: [["答案", "2"]] },
    ],
    cpp: String.raw`#include <iostream>
#include <string>
#include <queue>
#include <array>
using namespace std;
int main(){string a,b;int dx[]={1,1,-1,-1,2,2,-2,-2},dy[]={2,-2,2,-2,1,-1,1,-1};while(cin>>a>>b){int d[8][8];for(auto &row:d)for(int &v:row)v=-1;queue<pair<int,int>>q;int sx=a[0]-'a',sy=a[1]-'1';d[sx][sy]=0;q.push({sx,sy});
while(!q.empty()){auto [x,y]=q.front();q.pop();for(int k=0;k<8;++k){int u=x+dx[k],v=y+dy[k];if(u>=0&&u<8&&v>=0&&v<8&&d[u][v]<0){d[u][v]=d[x][y]+1;q.push({u,v});}}}
cout<<"To get from "<<a<<" to "<<b<<" takes "<<d[b[0]-'a'][b[1]-'1']<<" knight moves.\n";
}}`,
    python: String.raw`import sys
from collections import deque
data = sys.stdin.read().split()
for a,b in zip(data[::2],data[1::2]):
    start = (ord(a[0])-97,int(a[1])-1); goal = (ord(b[0])-97,int(b[1])-1)
    d = {start:0}; q = deque([start])
    while q:
        x,y = q.popleft()
        for dx,dy in ((1,2),(1,-2),(-1,2),(-1,-2),(2,1),(2,-1),(-2,1),(-2,-1)):
            u,v = x+dx,y+dy
            if 0 <= u < 8 and 0 <= v < 8 and (u,v) not in d:
                d[u,v] = d[x,y]+1; q.append((u,v))
    print(f'To get from {a} to {b} takes {d[goal]} knight moves.')`,
  }),
  defineCpeLesson("a759", {
    topic: "graphs", level: "hard", concept: "跳格鍵盤與文字前綴的乘積圖", goal: "在游標位置和已輸入長度上做最短路搜尋。",
    explanation: ["同一個按鍵可能有多格，不能把整個字元區域壓成一個點，因為不同格的方向跳轉目的地不同。先對每格四方向預算第一個不同字元的格子；直到邊界仍沒有不同字元則不產生移動邊。將目標文字尾端加上 *，確保 Enter 的移動與選取都計入。", "狀態為 (已輸入長度 i,游標格 p)，每次方向移動或選取都付 1，用 BFS 得最小總操作數。若當前字元正是下一個目標，可以立即選取並只保留這條轉移：任何先移動再選到同字元的方案，都可先在原處選取再走原路，成本不增，因此不會漏掉最佳解。用整數編碼狀態與 bytearray／位元組陣列標記，可將最壞約 2500×10001 個狀態的記憶體控制在實用範圍。資料讀到 EOF，每題輸出整數。"],
    complexity: "V=RC、文字長 L，預算 O(V(R+C))，搜尋 O(VL)，標記空間 O(VL)，另加 BFS 佇列。", pitfall: "方向鍵會跳過連續同按鍵格，而不是只走相鄰格；完成文字後仍須選 Enter。",
    traceLabel: "示意：一列 AB*，輸入 B", trace: [
      { title: "初始", description: "游標在 A，已輸入長度 0。", cells: ["A", "B", "*"], active: [0], variables: [["i", "0"], ["cost", "0"]] },
      { title: "右移並選 B", description: "右移 1 次、選取 1 次，共 2 次。", cells: ["A", "B", "*"], active: [1], variables: [["i", "1"], ["cost", "2"]] },
      { title: "右移並選 Enter", description: "再右移與選取，共 4 次完成。", cells: ["A", "B", "*"], active: [2], variables: [["i", "2"], ["cost", "4"]] },
    ],
    cpp: String.raw`#include <iostream>
#include <string>
#include <vector>
#include <array>
#include <queue>
using namespace std;
int main(){int r,c;while(cin>>r>>c){vector<string>grid(r);for(auto &s:grid)cin>>s;string target;cin>>target;target+='*';int V=r*c;vector<array<int,4>>jump(V);int dr[]={-1,1,0,0},dc[]={0,0,-1,1};
for(int x=0;x<r;++x)for(int y=0;y<c;++y)for(int k=0;k<4;++k){int a=x+dr[k],b=y+dc[k];while(a>=0&&a<r&&b>=0&&b<c&&grid[a][b]==grid[x][y]){a+=dr[k];b+=dc[k];}jump[x*c+y][k]=(a>=0&&a<r&&b>=0&&b<c)?a*c+b:-1;}
vector<unsigned char>seen(size_t(V)*target.size());queue<int>q;q.push(0);seen[0]=1;int distance=0,answer=-1;
while(!q.empty()&&answer<0){int count=q.size();while(count--){int state=q.front();q.pop();int i=state/V,p=state%V;
    if(grid[p/c][p%c]==target[i]){if(i+1==int(target.size())){answer=distance+1;break;}int next=state+V;if(!seen[next]){seen[next]=1;q.push(next);}}
    else for(int v:jump[p])if(v>=0){int next=i*V+v;if(!seen[next]){seen[next]=1;q.push(next);}}
}++distance;}cout<<answer<<'\n';
}}`,
    python: String.raw`import sys
from collections import deque
it = iter(sys.stdin.read().split())
for token in it:
    r,c = int(token),int(next(it)); grid = [next(it) for _ in range(r)]; target = next(it)+'*'; V = r*c
    chars = ''.join(grid); jump = [[] for _ in range(V)]
    for x in range(r):
        for y in range(c):
            for dx,dy in ((-1,0),(1,0),(0,-1),(0,1)):
                a,b = x+dx,y+dy
                while 0 <= a < r and 0 <= b < c and grid[a][b] == grid[x][y]: a += dx; b += dy
                if 0 <= a < r and 0 <= b < c: jump[x*c+y].append(a*c+b)
    seen = bytearray(V*len(target)); seen[0] = 1; q = deque([0]); distance = 0; answer = None
    while q and answer is None:
        for _ in range(len(q)):
            state = q.popleft(); i,p = divmod(state,V)
            if chars[p] == target[i]:
                if i+1 == len(target): answer = distance+1; break
                nxt = state+V
                if not seen[nxt]: seen[nxt] = 1; q.append(nxt)
            else:
                for v in jump[p]:
                    nxt = i*V+v
                    if not seen[nxt]: seen[nxt] = 1; q.append(nxt)
        distance += 1
    print(answer)`,
  }),
  defineCpeLesson("a760", {
    topic: "graphs", level: "hard", concept: "DFS low-link 與割點", goal: "辨識移除後會分裂網路的節點。",
    explanation: ["DFS 為每個點記首次進入序號 tin[u]，以及從其子樹沿樹邊再加至多一條回邊所能到的最小序號 low[u]。對樹邊 u→v，遞迴後合併 low[v]；對非父節點的已訪鄰居，以 tin[v] 更新 low[u]。輸入可能重複列出雙向邊，先用集合去重。", "非根節點 u 若有孩子 v 滿足 low[v]≥tin[u]，代表該子樹無法繞過 u 回到祖先，u 就是割點。DFS 根只有至少兩個獨立孩子時才是割點。逐行讀鄰接表到單獨 0，再讀下一個 N，N=0 結束；每個割點只計一次。"],
    complexity: "使用鄰接集合，DFS 時間 O(N+E)，儲存 O(N+E)。", pitfall: "根的判斷不同；low[v]=tin[u] 仍無法繞過 u，所以條件包含等號。",
    traceLabel: "示意：鏈 1–2–3", trace: [
      { title: "DFS 進入", description: "依序訪問 1、2、3，序號為 0、1、2。", cells: ["1:0", "2:1", "3:2"], active: [0,1,2], variables: [["time", "3"]] },
      { title: "回傳 low[3]", description: "3 沒有回邊，low[3]=2≥tin[2]=1。", cells: ["low3=2", "tin2=1"], active: [0,1], variables: [["割點2", "1"]] },
      { title: "根例外", description: "根 1 只有一個 DFS 孩子，並非割點，總數 1。", cells: ["1:否", "2:是", "3:否"], active: [1], variables: [["答案", "1"]] },
    ],
    cpp: String.raw`#include <iostream>
#include <sstream>
#include <string>
#include <vector>
#include <set>
#include <functional>
#include <algorithm>
using namespace std;
int main(){int n;string line;while(cin>>n&&n){getline(cin,line);vector<set<int>>g(n);
while(getline(cin,line)){istringstream in(line);int u;if(!(in>>u))continue;if(!u)break;--u;int v;while(in>>v){--v;g[u].insert(v);g[v].insert(u);}}
vector<int>tin(n,-1),low(n),cut(n);int timer=0;
function<void(int,int)>dfs=[&](int u,int parent){tin[u]=low[u]=timer++;int children=0;for(int v:g[u]){if(v==parent)continue;if(tin[v]<0){++children;dfs(v,u);low[u]=min(low[u],low[v]);if(parent>=0&&low[v]>=tin[u])cut[u]=1;}else low[u]=min(low[u],tin[v]);}if(parent<0&&children>1)cut[u]=1;};
for(int i=0;i<n;++i)if(tin[i]<0)dfs(i,-1);int answer=0;for(int x:cut)answer+=x;cout<<answer<<'\n';
}}`,
    python: String.raw`import sys
lines = iter(sys.stdin.read().splitlines())
for line in lines:
    if not line.strip(): continue
    n = int(line)
    if n == 0: break
    g = [set() for _ in range(n)]
    for line in lines:
        a = list(map(int,line.split()))
        if not a: continue
        if a[0] == 0: break
        u = a[0]-1
        for v in a[1:]: g[u].add(v-1); g[v-1].add(u)
    tin = [-1]*n; low = [0]*n; cut = set(); timer = 0
    def dfs(u,parent):
        global timer
        tin[u] = low[u] = timer; timer += 1; children = 0
        for v in g[u]:
            if v == parent: continue
            if tin[v] < 0:
                children += 1; dfs(v,u); low[u] = min(low[u],low[v])
                if parent != -1 and low[v] >= tin[u]: cut.add(u)
            else: low[u] = min(low[u],tin[v])
        if parent == -1 and children > 1: cut.add(u)
    for u in range(n):
        if tin[u] < 0: dfs(u,-1)
    print(len(cut))`,
  }),
  defineCpeLesson("a761", {
    topic: "number-theory", level: "medium", concept: "篩質數與相鄰質數二分", goal: "定位合數左右的最近質數並求差。",
    explanation: ["範圍上限 1299709 本身是質數，可先用埃氏篩標記 2 到此上限的所有質數，再收成遞增表。篩每個質數 p 的倍數時從 p² 開始，因為更小倍數已被先前質數處理。", "若查詢 k 是質數直接輸出 0；否則以 lower_bound／bisect_left 找第一個不小於 k 的質數，它與前一個質數正是夾住 k 的相鄰質數，兩者相減即間隙長度。答案包含兩端距離，不是中間合數數量。讀到 0 停止。"],
    complexity: "上限 U，預處理 O(U log log U) 時間、O(U) 空間；每題 O(log π(U))。", pitfall: "23 與 29 之間有 5 個合數，但題目定義的間隙是 6。",
    traceLabel: "示意：k=27", trace: [
      { title: "判定合數", description: "27 可被 3 整除，不能直接輸出 0。", cells: ["23質", "27合", "29質"], active: [1], variables: [["k", "27"]] },
      { title: "定位右端", description: "第一個不小於 27 的質數是 29，前一質數是 23。", cells: ["23", "27", "29"], active: [0,2], variables: [["left", "23"], ["right", "29"]] },
      { title: "求間隙", description: "29−23=6。", cells: ["29", "−23", "6"], active: [2], variables: [["答案", "6"]] },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;
int main(){const int U=1299709;vector<bool>prime(U+1,true);prime[0]=prime[1]=false;for(int p=2;p*p<=U;++p)if(prime[p])for(int v=p*p;v<=U;v+=p)prime[v]=false;vector<int>a;for(int p=2;p<=U;++p)if(prime[p])a.push_back(p);
int k;while(cin>>k&&k){if(prime[k])cout<<0<<'\n';else{auto it=lower_bound(a.begin(),a.end(),k);cout<<*it-*(it-1)<<'\n';}}}`, 
    python: String.raw`import sys, math, bisect
U = 1299709; prime = bytearray(b'\1')*(U+1); prime[0:2] = b'\0\0'
for p in range(2,math.isqrt(U)+1):
    if prime[p]: prime[p*p:U+1:p] = b'\0'*((U-p*p)//p+1)
a = [p for p in range(2,U+1) if prime[p]]
for k in map(int,sys.stdin.buffer.read().split()):
    if k == 0: break
    if prime[k]: print(0)
    else:
        i = bisect.bisect_left(a,k); print(a[i]-a[i-1])`,
  }),
  defineCpeLesson("a762", {
    topic: "strings", level: "easy", concept: "電話按鍵分組的逐字轉換", goal: "建立 A–Z 對數字的完整映射。",
    explanation: ["依題目八組字母逐組建立查表，例如 ABC 的每個字母都對應 2，PQRS 對應 7。因為部分按鍵有四個字母，不能單純用 (字母編號/3)+2 計算，這會在 S 之後產生錯誤。", "逐行掃描文字，遇到映射中的大寫字母就換成數字，其餘 0、1、連字號保持原樣。每個輸入字元恰好產生一個輸出字元，因此原本電話的分段與長度不變。讀到 EOF，每筆一行，無額外測試編號或空行。"],
    complexity: "時間 O(L)、固定映射空間 O(26)。", pitfall: "PQRS 與 WXYZ 有四字母；連字號不可刪掉。",
    traceLabel: "示意：1-CAT", trace: [
      { title: "保留前綴", description: "1 和連字號直接輸出。", cells: ["1", "-", "C", "A", "T"], active: [0,1], variables: [["已處理", "2"]] },
      { title: "轉 C、A", description: "C 和 A 都在 ABC 組，均變 2。", cells: ["1", "-", "2", "2", "T"], active: [2,3], variables: [["已處理", "4"]] },
      { title: "轉 T", description: "T 屬於 TUV 組，變 8，結果 1-228。", cells: ["1", "-", "2", "2", "8"], active: [4], variables: [["長度", "5"]] },
    ],
    cpp: String.raw`#include <iostream>
#include <string>
using namespace std;
int main(){string groups[]={"ABC","DEF","GHI","JKL","MNO","PQRS","TUV","WXYZ"};char table[26];for(int i=0;i<8;++i)for(char c:groups[i])table[c-'A']=char('2'+i);string s;while(getline(cin,s)){for(char c:s)if(c!='\r')cout<<(c>='A'&&c<='Z'?table[c-'A']:c);cout<<'\n';}}`,
    python: String.raw`import sys
table = {c:str(i) for i,g in enumerate(('ABC','DEF','GHI','JKL','MNO','PQRS','TUV','WXYZ'),2) for c in g}
for line in sys.stdin.read().splitlines(): print(''.join(table.get(c,c) for c in line))`,
  }),
  defineCpeLesson("a763", {
    topic: "number-theory", level: "medium", concept: "相同餘數等價於差值的公因數", goal: "以所有數和第一數的差值 GCD 求最大除數。",
    explanation: ["若每個 a_i 除以 d 的餘數都等於 r，則 a_i=q_i d+r，任兩數相減後 r 消失，因此 d 必須整除所有 a_i−a_0。反過來，只要 d 整除這些差，各數在模 d 下便同餘，所以符合條件的 d 正是差值們的公因數。", "將 g 從 0 起，逐項計算 gcd(g,|a_i−a_0|)，最後的 g 即最大可能值。此推導也適用負輸入，不需依語言的負數餘數規則做比較。每組以 0 結束，若一開始讀到 0 就結束全部；保證不全相同，答案一定正。差值以 64 位整數保存。"],
    complexity: "n 個數、最大差 D，時間 O(n log D)，額外空間 O(1)。", pitfall: "應求差值 GCD，不是原始數值 GCD；結尾 0 不屬於資料。",
    traceLabel: "示意：14,−22,17", trace: [
      { title: "固定第一數", description: "以 14 為基準，初值 g=0。", cells: ["14", "−22", "17"], active: [0], variables: [["g", "0"]] },
      { title: "第二數差值", description: "|−22−14|=36，gcd(0,36)=36。", cells: ["14", "−22", "差36"], active: [2], variables: [["g", "36"]] },
      { title: "第三數差值", description: "17−14=3，gcd(36,3)=3，三數餘數均為 2。", cells: ["14 mod3=2", "−22 mod3=2", "17 mod3=2"], active: [0,1,2], variables: [["答案", "3"]] },
    ],
    cpp: String.raw`#include <iostream>
#include <numeric>
#include <cstdlib>
using namespace std;
int main(){long long first,x;while(cin>>first&&first){long long g=0;while(cin>>x&&x)g=gcd(g,llabs(x-first));cout<<g<<'\n';}}`,
    python: String.raw`import sys, math
it = iter(map(int,sys.stdin.buffer.read().split()))
for first in it:
    if first == 0: break
    g = 0
    for x in it:
        if x == 0: break
        g = math.gcd(g,abs(x-first))
    print(g)`,
  }),
];
