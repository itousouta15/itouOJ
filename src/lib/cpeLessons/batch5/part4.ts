import { defineCpeLesson } from "@/lib/cpeLessonBuilder";

export const lessons = [
  defineCpeLesson("a764", {
    topic: "sorting", level: "medium", concept: "長方體三種面型的排序判定", goal: "檢查六個矩形能否配成三對且共用一致邊長。",
    explanation: ["矩形可旋轉，先把每片的兩邊整理為小邊在前，再對六個二元組排序。長方體設三邊 a≤b≤c，六面排序必為 (a,b) 兩片、(a,c) 兩片、(b,c) 兩片，因此相鄰的 0/1、2/3、4/5 必須各自相同。", "配對成功仍不充分，還要檢查第 0 片小邊=第 2 片小邊、第 0 片大邊=第 4 片小邊、第 2 片大邊=第 4 片大邊，才能共同形成 a、b、c。相等邊長或正方形也符合這套條件，不需特判立方體。每六對尺寸為一筆，讀到 EOF，輸出 POSSIBLE 或 IMPOSSIBLE。"],
    complexity: "每題固定六面，時間 O(1)、空間 O(1)。", pitfall: "只檢查六片能兩兩配對，仍可能得到三種互不相容的面。",
    traceLabel: "示意：2×3、2×4、3×4 各兩片", trace: [
      { title: "排序", description: "六片依小邊、大邊排序。", cells: ["2×3", "2×3", "2×4", "2×4", "3×4", "3×4"], active: [0,1,2,3,4,5], variables: [["面數", "6"]] },
      { title: "配成三對", description: "每一對的尺寸完全相同。", cells: ["(2,3)×2", "(2,4)×2", "(3,4)×2"], active: [0,1,2], variables: [["對數", "3"]] },
      { title: "確認共邊", description: "三個維度是 2、3、4，所有面都可對應。", cells: ["a=2", "b=3", "c=4"], active: [0,1,2], variables: [["可行", "1"]] },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;
int main(){int w,h;while(cin>>w>>h){vector<pair<int,int>>a;for(int i=0;i<6;++i){if(i)cin>>w>>h;a.push_back({min(w,h),max(w,h)});}sort(a.begin(),a.end());
bool ok=a[0]==a[1]&&a[2]==a[3]&&a[4]==a[5]&&a[0].first==a[2].first&&a[0].second==a[4].first&&a[2].second==a[4].second;
cout<<(ok?"POSSIBLE":"IMPOSSIBLE")<<'\n';}}`,
    python: String.raw`import sys
it = iter(map(int,sys.stdin.buffer.read().split()))
for first in it:
    a = [tuple(sorted((first,next(it))))]
    a.extend(tuple(sorted((next(it),next(it)))) for _ in range(5)); a.sort()
    ok = a[0]==a[1] and a[2]==a[3] and a[4]==a[5] and a[0][0]==a[2][0] and a[0][1]==a[4][0] and a[2][1]==a[4][1]
    print('POSSIBLE' if ok else 'IMPOSSIBLE')`,
  }),
  defineCpeLesson("a765", {
    topic: "number-theory", level: "easy", concept: "試除質數與反轉分類", goal: "依原數與反轉數的質數性輸出三種句型。",
    explanation: ["若 n 是合數，必有一個因數不超過 √n，因此試除 2，再檢查到 √n 的奇數即可判斷質數。n<2 不是質數。先判斷原數，非質數就立即輸出 not prime，不必處理反轉。", "原數為質數時，把十進位數字反轉得到 r。只有 r≠n 且 r 也為質數才是 emirp；回文質數仍分類為一般 prime。反轉可能丟掉前導零，這是整數值的正常行為。逐數讀至 EOF，輸出原始 n 加上指定英文句子與句點。"],
    complexity: "每筆時間 O(√n+√r)，額外空間 O(log n) 的反轉文字。", pitfall: "11、101 等回文質數不是 emirp，必須檢查反轉後與原數不同。",
    traceLabel: "示意：17、19、18", trace: [
      { title: "17", description: "17 與反轉 71 都是不同質數。", cells: ["17質", "71質"], active: [0,1], variables: [["分類", "emirp"], ["n", "17"]] },
      { title: "19", description: "19 是質數，但 91=7×13 不是。", cells: ["19質", "91=7×13"], active: [1], variables: [["分類", "prime"], ["n", "19"]] },
      { title: "18", description: "18 可被 2 整除，直接分類非質數。", cells: ["18", "2×9"], active: [0,1], variables: [["分類", "not prime"], ["n", "18"]] },
    ],
    cpp: String.raw`#include <iostream>
#include <string>
#include <algorithm>
using namespace std;
bool prime(int n){if(n<2)return false;if(n%2==0)return n==2;for(int d=3;d*d<=n;d+=2)if(n%d==0)return false;return true;}
int main(){int n;while(cin>>n){string s=to_string(n);reverse(s.begin(),s.end());int r=stoi(s);cout<<n<<" is ";if(!prime(n))cout<<"not prime";else if(r!=n&&prime(r))cout<<"emirp";else cout<<"prime";cout<<".\n";}}`,
    python: String.raw`import sys, math
def prime(n):
    if n < 2: return False
    if n%2 == 0: return n == 2
    return all(n%d for d in range(3,math.isqrt(n)+1,2))
for s in sys.stdin.read().split():
    n = int(s); r = int(str(n)[::-1])
    kind = 'not prime' if not prime(n) else ('emirp' if r != n and prime(r) else 'prime')
    print(f'{n} is {kind}.')`,
  }),
  defineCpeLesson("a766", {
    topic: "dp", level: "hard", concept: "可重啟編輯距離 DP 與答案二分", goal: "判斷是否能把 x 切成各段距離都不超過 k 的非空片段。",
    explanation: ["固定容許距離 k。逐字掃描 x，dp[j] 保存從某個可合法切割的前綴後開始，到目前位置的片段與 y 前 j 字的最小編輯距離。一般編輯距離轉移由刪除 x 字元、插入 y 字元、相同／替換三者取小。若本列 dp[|y|]≤k，就表示目前 x 前綴可以完成分割。", "當前綴可完成時，允許下一段從此處重新開始：將本列各 j 更新為 min(dp[j],j)，等價於新空段先插入 y 的前 j 字。判定完整前綴是否可行是在重啟之前做，因此不會把空段算成覆蓋 x。每次只增加一個 x 字元，自然保證新增段非空。k 越大越容易成功，二分 0 到 |y|；上界成立，因為每個 x 字元單獨一段最多需 |y| 次編輯。讀 T 後依 y、x 順序處理，每題輸出最小 k。"],
    complexity: "n=|x|、m=|y|，時間 O(nm log(m+1))，額外空間 O(m)。", pitfall: "不能固定以 |y| 長度切段，也不能把所有段距離加總；本題要最小化各段距離的最大值。",
    traceLabel: "示意：y=ab，x=aba，測 k=1", trace: [
      { title: "讀 a", description: "與 y 前綴的距離列為 [1,0,1]，片段 a 可完成，因距離 1。", cells: ["空:1", "a:0", "ab:1"], active: [2], variables: [["可完成前綴長", "1"]] },
      { title: "讀 b", description: "可從開頭匹配 ab，距離列 [1,1,0]，完成距離為 0。", cells: ["空:1", "a:1", "ab:0"], active: [2], variables: [["可完成前綴長", "2"]] },
      { title: "讀末尾 a", description: "重啟後片段 a 與 ab 距離 1，分成 ab、a 合法。k=0 則尾 a 無法完成。", cells: ["ab:0", "a:1"], active: [0,1], variables: [["最小k", "1"]] },
    ],
    cpp: String.raw`#include <iostream>
#include <string>
#include <vector>
#include <numeric>
#include <algorithm>
using namespace std;
bool feasible(const string&x,const string&y,int k){
    int m=y.size();vector<int>dp(m+1),next(m+1);iota(dp.begin(),dp.end(),0);bool complete=false;
    for(char c:x){next[0]=dp[0]+1;for(int j=1;j<=m;++j)next[j]=min({dp[j]+1,next[j-1]+1,dp[j-1]+(c!=y[j-1])});
        complete=next[m]<=k;if(complete)for(int j=0;j<=m;++j)next[j]=min(next[j],j);dp.swap(next);
    }return complete;
}
int main(){int t;cin>>t;while(t--){string y,x;cin>>y>>x;int lo=0,hi=y.size();while(lo<hi){int k=(lo+hi)/2;if(feasible(x,y,k))hi=k;else lo=k+1;}cout<<lo<<'\n';}}`,
    python: String.raw`import sys
def feasible(x,y,k):
    m = len(y); dp = list(range(m+1)); complete = False
    for c in x:
        nxt = [dp[0]+1]+[0]*m
        for j,d in enumerate(y,1): nxt[j] = min(dp[j]+1,nxt[j-1]+1,dp[j-1]+(c!=d))
        complete = nxt[m] <= k
        if complete:
            for j in range(m+1): nxt[j] = min(nxt[j],j)
        dp = nxt
    return complete
it = iter(sys.stdin.read().split())
for _ in range(int(next(it))):
    y,x = next(it),next(it); lo,hi = 0,len(y)
    while lo < hi:
        mid = (lo+hi)//2
        if feasible(x,y,mid): hi = mid
        else: lo = mid+1
    print(lo)`,
  }),
  defineCpeLesson("a767", {
    topic: "number-theory", level: "hard", concept: "區間質因數分解與因數個數", goal: "對窄但數值大的區間一起分解，挑最多因數者。",
    explanation: ["若 v=∏p_i^e_i，每個正因數可獨立選擇 p_i 的次方 0…e_i，因此因數數量為 ∏(e_i+1)。雖然 U 可到 10⁹，但區間寬至多 10000，可建立每個 v 的剩餘值 rem[v] 與目前因數乘積 count[v]。", "預篩到 31623 的質數，對每個 p 只走訪區間內 p 的倍數，從 rem 中除盡 p 並乘上 e+1。處理到 p²>U 即可停止，剩餘值若大於 1，就是額外一個質因數，再乘 2。由 L 往 U 掃描且只在嚴格變多時更新，保留最小並列者。1 的因數個數是 1，依題目完整句型輸出。"],
    complexity: "區間寬 K，預篩 O(√U log log U)，每組約 O(π(√U)+K log U) 時間、O(K+√U) 空間。", pitfall: "不能篩到 10⁹；剩餘大質因數不可忘記乘 2。",
    traceLabel: "示意：[8,10]", trace: [
      { title: "初始", description: "三數因數乘積均從 1 開始。", cells: ["8:1", "9:1", "10:1"], active: [0,1,2], variables: [["區間寬", "3"]] },
      { title: "處理質數 2", description: "8=2³，乘 4；10 除一次 2，乘 2 且剩 5。", cells: ["8:4,剩1", "9:1,剩9", "10:2,剩5"], active: [0,2], variables: [["p", "2"]] },
      { title: "處理 3 與剩餘", description: "9=3² 有 3 因數；10 剩 5 再乘 2 得 4，並列取 8。", cells: ["8:4", "9:3", "10:4"], active: [0], variables: [["P", "8"], ["D", "4"]] },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <numeric>
using namespace std;
int main(){const int B=31623;vector<bool>prime(B+1,true);vector<int>ps;for(int p=2;p<=B;++p)if(prime[p]){ps.push_back(p);if(p*p<=B)for(int v=p*p;v<=B;v+=p)prime[v]=false;}
int t;cin>>t;while(t--){int L,U;cin>>L>>U;vector<int>rem(U-L+1),count(U-L+1,1);iota(rem.begin(),rem.end(),L);
for(int p:ps){if(1LL*p*p>U)break;for(long long v=(1LL*L+p-1)/p*p;v<=U;v+=p){int i=v-L,e=0;while(rem[i]%p==0){rem[i]/=p;++e;}count[i]*=e+1;}}
int best=L,most=0;for(int i=0;i<=U-L;++i){if(rem[i]>1)count[i]*=2;if(count[i]>most){most=count[i];best=L+i;}}
cout<<"Between "<<L<<" and "<<U<<", "<<best<<" has a maximum of "<<most<<" divisors.\n";
}}`,
    python: String.raw`import sys, math
B = 31623; sieve = bytearray(b'\1')*(B+1); primes = []
for p in range(2,B+1):
    if sieve[p]:
        primes.append(p)
        if p*p <= B: sieve[p*p:B+1:p] = b'\0'*((B-p*p)//p+1)
it = iter(map(int,sys.stdin.buffer.read().split()))
for _ in range(next(it)):
    L,U = next(it),next(it); rem = list(range(L,U+1)); counts = [1]*len(rem)
    for p in primes:
        if p*p > U: break
        for v in range((L+p-1)//p*p,U+1,p):
            i = v-L; e = 0
            while rem[i]%p == 0: rem[i] //= p; e += 1
            counts[i] *= e+1
    for i,v in enumerate(rem):
        if v > 1: counts[i] *= 2
    most = max(counts); best = L+counts.index(most)
    print(f'Between {L} and {U}, {best} has a maximum of {most} divisors.')`,
  }),
  defineCpeLesson("a768", {
    topic: "number-theory", level: "medium", concept: "自乘冪個位數與百位週期", goal: "用 N mod 100 處理超長輸入。",
    explanation: ["i^i 的個位數取決於底數 mod 10 與指數在長度 1、2 或 4 的循環位置。i 增加 20 後，底數個位不變、指數增加 4 的倍數，因此項的個位數每 20 項重複。前 20 項總和個位為 4，連續五塊的總和就是 0，所以前綴和個位數每 100 項重複。", "先以模乘算出前 100 項的前綴和，再逐字讀 N 維護 r=(10r+digit) mod 100，查 prefix[r] 即得答案。N 最多約 101 位，不應轉成 C++ 固定長度整數。只有完整數值為 0 才停止；100、1000 等尾兩位為 00 的正常數仍須輸出 0。"],
    complexity: "預算 O(100²) 為固定成本；每題時間 O(|N|)，額外空間 O(100)。", pitfall: "項週期 20 不代表總和週期也是 20；一塊和為 4，需五塊才消去。",
    traceLabel: "示意：前 3 項", trace: [
      { title: "i=1", description: "1¹ 個位 1，前綴個位 1。", cells: ["1^1→1", "sum→1"], active: [0,1], variables: [["prefix[1]", "1"]] },
      { title: "i=2", description: "2² 個位 4，(1+4) mod10=5。", cells: ["2^2→4", "sum→5"], active: [0,1], variables: [["prefix[2]", "5"]] },
      { title: "i=3", description: "3³ 個位 7，(5+7) mod10=2。", cells: ["3^3→7", "sum→2"], active: [0,1], variables: [["prefix[3]", "2"]] },
    ],
    cpp: String.raw`#include <iostream>
#include <string>
using namespace std;
int main(){int prefix[101]={};for(int i=1;i<=100;++i){int v=1;for(int k=0;k<i;++k)v=v*(i%10)%10;prefix[i]=(prefix[i-1]+v)%10;}
string s;while(cin>>s){if(s.find_first_not_of('0')==string::npos)break;int r=0;for(char c:s)r=(r*10+c-'0')%100;cout<<prefix[r]<<'\n';}}`,
    python: String.raw`import sys
prefix = [0]
for i in range(1,101): prefix.append((prefix[-1]+pow(i,i,10))%10)
for s in sys.stdin.read().split():
    if not s.strip('0'): break
    r = 0
    for c in s: r = (10*r+int(c))%100
    print(prefix[r])`,
  }),
  defineCpeLesson("a769", {
    topic: "sorting", level: "hard", concept: "截止時間排序與最小利潤堆", goal: "維護每個截止日前可行且利潤最大的商品集合。",
    explanation: ["依截止日 d 排序，將目前商品的利潤放進最小堆。處理到截止日 d 時，所有已看商品都必須在前 d 個時段完成，因此最多選 d 件；若堆大小超過 d，就刪除利潤最小者。", "在所有先前更早的截止點，原集合已可行，新增一件只會造成目前總數超限；丟掉最小利潤後，任一早期前綴的件數也不會增加。交換論證保證保留的利潤和最大。最後堆中總和就是答案，不需重建順序。資料讀到 EOF，n=0 是合法空集合，須輸出 0 而不是終止。"],
    complexity: "每組時間 O(n log n)，空間 O(n)。", pitfall: "不是把全部商品按利潤排序後直接依序賣；截止日會限制可行排程。",
    traceLabel: "示意：(利潤,期限)=(10,1),(30,1),(50,2)", trace: [
      { title: "第一件", description: "期限 1，保留利潤 10。", cells: ["heap=[10]"], active: [0], variables: [["sum", "10"]] },
      { title: "第二件", description: "同樣期限 1，兩件超限，刪掉 10 保留 30。", cells: ["刪10", "保留30"], active: [1], variables: [["sum", "30"]] },
      { title: "第三件", description: "期限 2 可容納兩件，保留 30、50，共 80。", cells: ["30", "50"], active: [0,1], variables: [["sum", "80"]] },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <queue>
#include <functional>
#include <algorithm>
using namespace std;
int main(){int n;while(cin>>n){vector<pair<int,int>>a(n);for(auto &item:a)cin>>item.second>>item.first;sort(a.begin(),a.end());priority_queue<int,vector<int>,greater<int>>q;long long total=0;
for(auto [d,p]:a){q.push(p);total+=p;if(int(q.size())>d){total-=q.top();q.pop();}}cout<<total<<'\n';}}`,
    python: String.raw`import sys, heapq
it = iter(map(int,sys.stdin.buffer.read().split()))
for n in it:
    a = []
    for _ in range(n):
        p,d = next(it),next(it); a.append((d,p))
    heap = []
    for d,p in sorted(a):
        heapq.heappush(heap,p)
        if len(heap) > d: heapq.heappop(heap)
    print(sum(heap))`,
  }),
  defineCpeLesson("a770", {
    topic: "simulation", level: "medium", concept: "數字排序變換與結果集合", goal: "依本地規則計算包含第一次重複結果的鏈長。",
    explanation: ["把目前整數的十進位數字排序，遞增排列轉成 B，反向排列轉成 A，再令下一數為 C=A−B。因每步取整數表示，B 的前導零自然消失，下一回合也不保留原位數，例如 100 會產生 99。", "每次先列印運算並讓鏈長加一，再檢查 C 是否已在先前算出的結果中；若已出現就停止，否則加入集合繼續。起始數不能預放集合，這是本地規則的重要細節。讀到輸入 0 結束，但鏈中計算出的 0 仍要繼續到重複。每條鏈後印一空行，包含最後一條。"],
    complexity: "鏈長 L、每數最多 d=9 位，時間 O(Ld log d)，空間 O(L)。", pitfall: "初始數不先標記；最後一次導致重複的運算也算鏈長。",
    traceLabel: "示意：1234 的前後狀態", trace: [
      { title: "第一步", description: "4321−1234=3087。", cells: ["4321", "1234", "3087"], active: [2], variables: [["L", "1"]] },
      { title: "中間兩步", description: "8730−378=8352，再算 8532−2358=6174。", cells: ["3087", "8352", "6174"], active: [1,2], variables: [["L", "3"]] },
      { title: "第一次重複", description: "7641−1467=6174，結果已出現，鏈長是 4。", cells: ["7641", "1467", "6174"], active: [2], variables: [["L", "4"]] },
    ],
    cpp: String.raw`#include <iostream>
#include <string>
#include <set>
#include <algorithm>
using namespace std;
int main(){int original;while(cin>>original&&original){cout<<"Original number was "<<original<<'\n';int cur=original,length=0;set<int>seen;
while(true){string s=to_string(cur);sort(s.begin(),s.end());int b=stoi(s);reverse(s.begin(),s.end());int a=stoi(s),v=a-b;cout<<a<<" - "<<b<<" = "<<v<<'\n';++length;if(!seen.insert(v).second)break;cur=v;}
cout<<"Chain length "<<length<<"\n\n";
}}`,
    python: String.raw`import sys
for original in map(int,sys.stdin.buffer.read().split()):
    if original == 0: break
    print(f'Original number was {original}'); cur = original; seen = set(); length = 0
    while True:
        digits = sorted(str(cur)); a = int(''.join(reversed(digits))); b = int(''.join(digits)); v = a-b
        print(f'{a} - {b} = {v}'); length += 1
        if v in seen: break
        seen.add(v); cur = v
    print(f'Chain length {length}\n')`,
  }),
  defineCpeLesson("a771", {
    topic: "dp", level: "hard", concept: "最少郵票數與多層同分比較", goal: "求每套面額的連續涵蓋值，依完整排序規則挑選。",
    explanation: ["每個面額能重複使用，令 dp[v] 為湊出郵資 v 的最少張數，dp[0]=0，從小到大計算 dp[v]=1+min(dp[v−d])。最多 S 張且最大面額 D，因此無須檢查超過 S×D 的值。從 1 起第一個 dp[v]>S 的郵資就是缺口，涵蓋值為 v−1。", "比較套組時先選涵蓋值較大者，再選面額數較少者，最後把面額由大到小比較，第一個差異較小者勝出。這個最後規則不是比較面額總和。輸入 S=0 結束，輸出涵蓋值寬 4、各面額寬 3，冒號前一個空白。"],
    complexity: "每套 K 種面額、最大 D，時間 O(SK D)，空間 O(SD)。", pitfall: "最大能湊出的郵資不等於最大連續涵蓋值；只要中間有缺口就必須停止。",
    traceLabel: "示意：S=2，面額 1、3", trace: [
      { title: "前兩郵資", description: "1 用一張，2 用兩張。", cells: ["dp1=1", "dp2=2"], active: [0,1], variables: [["coverage", "2"]] },
      { title: "延伸到 4", description: "3 用一張，4=3+1 用兩張。", cells: ["dp3=1", "dp4=2"], active: [0,1], variables: [["coverage", "4"]] },
      { title: "遇到缺口 5", description: "5=3+1+1 要三張，超過 2；即使 6 可達也不能增加連續涵蓋。", cells: ["dp5=3", "dp6=2"], active: [0], variables: [["答案C", "4"]] },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <algorithm>
#include <iomanip>
using namespace std;
int main(){int S;while(cin>>S&&S){int n;cin>>n;int best=-1;vector<int>chosen;
while(n--){int k;cin>>k;vector<int>a(k);for(int &d:a)cin>>d;int limit=S*a.back();vector<int>dp(limit+1,S+1);dp[0]=0;
for(int v=1;v<=limit;++v)for(int d:a)if(d<=v)dp[v]=min(dp[v],dp[v-d]+1);
int coverage=0;while(coverage<limit&&dp[coverage+1]<=S)++coverage;
bool better=coverage>best;if(coverage==best){if(a.size()!=chosen.size())better=a.size()<chosen.size();else better=lexicographical_compare(a.rbegin(),a.rend(),chosen.rbegin(),chosen.rend());}
if(better){best=coverage;chosen=a;}}
cout<<"max coverage ="<<setw(4)<<best<<" :";for(int d:chosen)cout<<setw(3)<<d;cout<<'\n';
}}`,
    python: String.raw`import sys
it = iter(map(int,sys.stdin.buffer.read().split()))
for S in it:
    if S == 0: break
    best_key = None; chosen = []; best = 0
    for _ in range(next(it)):
        a = [next(it) for _ in range(next(it))]; limit = S*a[-1]; dp = [0]+[S+1]*limit
        for v in range(1,limit+1):
            dp[v] = min((dp[v-d]+1 for d in a if d <= v),default=S+1)
        coverage = 0
        while coverage < limit and dp[coverage+1] <= S: coverage += 1
        key = (-coverage,len(a),tuple(reversed(a)))
        if best_key is None or key < best_key: best_key,chosen,best = key,a,coverage
    print(f'max coverage ={best:4} :'+''.join(f'{d:3}' for d in chosen))`,
  }),
  defineCpeLesson("a772", {
    topic: "number-theory", level: "medium", concept: "費波那契權重的貪心表示", goal: "每次選不超過剩餘值的最大費波那契數。",
    explanation: ["使用權重 1、2、3、5、8…，避免把重複的兩個 1 當成不同位。從最大不超過原數的權重往下掃，若目前權重不大於剩餘值就輸出 1 並扣掉，否則輸出 0；第一個 1 之前的零不印。", "選 F_k 時，原剩餘值小於 F_{k+1}=F_k+F_{k−1}，扣掉 F_k 後必小於 F_{k−1}，所以下一權重不會再被選，保證沒有連續兩個 1。這也說明貪心符合不相鄰權重表示。保留原始十進位數用於輸出 DEC = FIB (fib)，依第一行筆數處理。"],
    complexity: "每筆時間 O(log N)，權重與輸出空間 O(log N)。", pitfall: "最小兩個權重是 1、2；輸出不能有前導零，也不能改掉原十進位數。",
    traceLabel: "示意：17=13+3+1", trace: [
      { title: "選 13", description: "17−13=4，下一權重 8 不取。", cells: ["13:1", "8:0", "5:?", "3:?", "2:?", "1:?"], active: [0], variables: [["剩餘", "4"]] },
      { title: "選 3", description: "5 超過 4，不取；選 3 後剩 1。", cells: ["13:1", "8:0", "5:0", "3:1", "2:?", "1:?"], active: [3], variables: [["剩餘", "1"]] },
      { title: "選 1", description: "2 不取，1 取用，得到 100101。", cells: ["1", "0", "0", "1", "0", "1"], active: [5], variables: [["剩餘", "0"]] },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <string>
using namespace std;
int main(){vector<int>f={1,2};while(f.back()<100000000)f.push_back(f[f.size()-1]+f[f.size()-2]);int t;cin>>t;while(t--){int n;cin>>n;int rem=n;string s;bool begun=false;for(auto it=f.rbegin();it!=f.rend();++it){if(*it<=rem){s+='1';rem-=*it;begun=true;}else if(begun)s+='0';}cout<<n<<" = "<<s<<" (fib)\n";}}`,
    python: String.raw`import sys
f = [1,2]
while f[-1] < 100000000: f.append(f[-1]+f[-2])
it = iter(map(int,sys.stdin.buffer.read().split()))
for _ in range(next(it)):
    n = next(it); rem = n; bits = []
    for v in reversed(f):
        if v <= rem: bits.append('1'); rem -= v
        elif bits: bits.append('0')
    print(f'{n} = '+''.join(bits)+' (fib)')`,
  }),
  defineCpeLesson("a773", {
    topic: "search", level: "easy", concept: "閉區間查詢與唯一解判定", goal: "只在恰好一家製造商符合價格時輸出名稱。",
    explanation: ["對每個查詢價格 P，逐筆檢查 L≤P≤H，端點也算符合。維護候選名稱和符合數；零家與兩家以上都必須輸出 UNDETERMINED，因此找到第一家後不能立即回覆名稱。", "每筆查詢獨立計算，不需要按價格排序，也不應以最便宜或區間最窄者作額外取捨。D<10000、Q<1000 時直接掃描最多約一千萬次比較，符合限制。讀測試組數，組間印一空行，製造商名稱保持原樣。"],
    complexity: "每組時間 O(DQ)，空間 O(D)。", pitfall: "有兩家符合仍是 UNDETERMINED，且等於最低價或最高價都在區間內。",
    traceLabel: "示意：A=[10,20]，B=[15,30]", trace: [
      { title: "查詢 10", description: "只有 A 包含 10，端點有效。", cells: ["A:1", "B:0"], active: [0], variables: [["符合數", "1"], ["輸出", "A"]] },
      { title: "查詢 18", description: "A、B 都符合，不能判定。", cells: ["A:1", "B:1"], active: [0,1], variables: [["符合數", "2"]] },
      { title: "查詢 40", description: "沒有符合區間，一樣不能判定。", cells: ["A:0", "B:0"], active: [0,1], variables: [["符合數", "0"]] },
    ],
    cpp: String.raw`#include <iostream>
#include <string>
#include <vector>
using namespace std;
struct Maker{string name;int low,high;};
int main(){int t;cin>>t;for(int cs=0;cs<t;++cs){int d;cin>>d;vector<Maker>a(d);for(auto &m:a)cin>>m.name>>m.low>>m.high;int q;cin>>q;if(cs)cout<<'\n';while(q--){int p,count=0;string answer;cin>>p;for(auto m:a)if(m.low<=p&&p<=m.high){++count;answer=m.name;}cout<<(count==1?answer:"UNDETERMINED")<<'\n';}}}`, 
    python: String.raw`import sys
it = iter(sys.stdin.read().split()); groups = []
for _ in range(int(next(it))):
    a = [(next(it),int(next(it)),int(next(it))) for _ in range(int(next(it)))]; out = []
    for _ in range(int(next(it))):
        p = int(next(it)); matches = [name for name,l,h in a if l <= p <= h]
        out.append(matches[0] if len(matches)==1 else 'UNDETERMINED')
    groups.append('\n'.join(out))
print('\n\n'.join(groups))`,
  }),
  defineCpeLesson("a774", {
    topic: "number-theory", level: "medium", concept: "Legendre 公式與固定欄寬輸出", goal: "不建立 N!，直接計算每個質數的總指數。",
    explanation: ["N! 中有 floor(N/p) 個數提供至少一個 p，有 floor(N/p²) 個又多提供一個，以此類推，因此 p 的指數是所有這些商的總和。程式反覆把 q 除以 p，累加 q，避免直接計算可能溢位的 p 次方或 N!。", "列出不超過 N 的質數，按遞增順序計算指數。輸出 N 寬 3 後接 ! =，每個指數寬 3；同一行最多 15 個，續行先印恰好 6 個空白再開始指數欄位。遇到 0 結束，不在資料組間另外插入空行。"],
    complexity: "篩質數到 100 為固定成本；每題 O(π(N) log N) 時間，空間 O(π(N))。", pitfall: "續行的 6 個空白不包含第一個指數自己的欄寬；N! 無法存入一般整數。",
    traceLabel: "示意：5! 的質因數指數", trace: [
      { title: "質數 2", description: "floor(5/2)+floor(5/4)=2+1=3。", cells: ["2", "+1", "=3"], active: [2], variables: [["exp2", "3"]] },
      { title: "質數 3", description: "floor(5/3)=1。", cells: ["3", "指數1"], active: [1], variables: [["exp3", "1"]] },
      { title: "質數 5", description: "floor(5/5)=1，所以 5!=2³×3×5。", cells: ["2:3", "3:1", "5:1"], active: [2], variables: [["指數欄數", "3"]] },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <iomanip>
using namespace std;
int main(){vector<int>primes;for(int p=2;p<=100;++p){bool ok=true;for(int d=2;d*d<=p;++d)if(p%d==0)ok=false;if(ok)primes.push_back(p);}
int n;while(cin>>n&&n){cout<<setw(3)<<n<<"! =";int count=0;for(int p:primes){if(p>n)break;int exp=0,q=n;while(q){q/=p;exp+=q;}if(count&&count%15==0)cout<<"\n      ";cout<<setw(3)<<exp;++count;}cout<<'\n';}}`,
    python: String.raw`import sys, math
primes = [p for p in range(2,101) if all(p%d for d in range(2,math.isqrt(p)+1))]
for n in map(int,sys.stdin.buffer.read().split()):
    if n == 0: break
    exponents = []
    for p in primes:
        if p > n: break
        q = n; e = 0
        while q: q //= p; e += q
        exponents.append(e)
    for i in range(0,len(exponents),15):
        prefix = f'{n:3}! =' if i == 0 else ' '*6
        print(prefix+''.join(f'{e:3}' for e in exponents[i:i+15]))`,
  }),
  defineCpeLesson("a775", {
    topic: "number-theory", level: "medium", concept: "歐幾里得除法產生連分數", goal: "逐次取整數部與倒數，輸出標準連分數。",
    explanation: ["對有理數 a/b，先取 q=floor(a/b)，寫成 q+(a−qb)/b。若餘數為零便結束；否則將分子分母改為 b、a−qb，等於對剩餘分數取倒數後繼續。這就是歐幾里得演算法的商數序列，第一項可為任意整數，後續項為正。", "將分母先正規化為正，再以向下整除取得 0≤餘數<b；這也讓負分子能正確處理。標準歐幾里得流程在非整數情況下最後商必大於 1，符合唯一性條件。讀到 EOF，第一項後若有後續係數才放分號，其餘用逗號；整數直接輸出 [q]，不加空白。有效有理數的分母不能為 0。"],
    complexity: "時間 O(log(|a|+|b|))，空間為同階的係數數量。", pitfall: "C++ 負數除法需修正成 floor；整數結果沒有分號。",
    traceLabel: "示意：43/19", trace: [
      { title: "取首項", description: "43=2×19+5，第一項 2。", cells: ["43", "19", "q2,r5"], active: [2], variables: [["下一分數", "19/5"]] },
      { title: "下一商", description: "19=3×5+4，加入 3。", cells: ["19", "5", "q3,r4"], active: [2], variables: [["下一分數", "5/4"]] },
      { title: "完成", description: "5=1×4+1，4=4×1，得到 [2;3,1,4]。", cells: ["2", "3", "1", "4"], active: [2,3], variables: [["餘數", "0"]] },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <utility>
using namespace std;
int main(){long long a,b;while(cin>>a>>b){if(b<0){a=-a;b=-b;}vector<long long>v;
while(b){long long q=a/b,r=a%b;if(r<0){--q;r+=b;}v.push_back(q);a=b;b=r;}
cout<<'[';for(size_t i=0;i<v.size();++i){if(i)cout<<(i==1?';':',');cout<<v[i];}cout<<"]\n";
}}`,
    python: String.raw`import sys
it = iter(map(int,sys.stdin.buffer.read().split()))
for a in it:
    b = next(it)
    if b < 0: a,b = -a,-b
    coefficients = []
    while b:
        q,r = divmod(a,b); coefficients.append(q); a,b = b,r
    print('['+str(coefficients[0])+(';' + ','.join(map(str,coefficients[1:])) if len(coefficients)>1 else '')+']')`,
  }),
  defineCpeLesson("a776", {
    topic: "graphs", level: "medium", concept: "Kruskal 最小生成樹與並查集", goal: "選出連通所有城市且總成本最少的隧道。",
    explanation: ["矩陣代表無向圖，只讀上三角的非零項作為邊，避免同一隧道被加入兩次。把邊按 (權重,端點) 排序，以並查集記錄目前連通群；端點已在同群的邊會形成環，因此跳過，否則選入並合併。", "每次所選的是跨越兩群的最輕邊，依割集性質可以包含在某棵最小生成樹中；選到 n−1 條即完成。按照選取順序列印便是權重遞增順序。輸入逗號旁可能有空白，先換成空白再解析。本地測資非零權重互異，故生成樹唯一；程式仍以端點作次要排序，讓等權輸入具有確定行為。輸出 Case k: 與 A-B w。"],
    complexity: "E 條邊，時間 O(n²+E log E)，空間 O(n+E)。", pitfall: "0 表示沒有隧道，不是免費邊；不可將矩陣兩個對稱位置都輸出。",
    traceLabel: "示意：AB=2、BC=3、AC=7", trace: [
      { title: "選 AB", description: "A 與 B 屬不同群，選成本 2。", cells: ["AB:2", "BC:3", "AC:7"], active: [0], variables: [["總成本", "2"]] },
      { title: "選 BC", description: "C 尚未連入，選成本 3。", cells: ["AB:2", "BC:3", "AC:7"], active: [1], variables: [["總成本", "5"], ["邊數", "2"]] },
      { title: "排除環邊", description: "AC 兩端已連通，成本 7 的邊不需要。", cells: ["A–B–C", "AC跳過"], active: [1], variables: [["MST成本", "5"]] },
    ],
    cpp: String.raw`#include <iostream>
#include <string>
#include <sstream>
#include <vector>
#include <tuple>
#include <numeric>
#include <algorithm>
#include <functional>
using namespace std;
int main(){int t;cin>>t;for(int cs=1;cs<=t;++cs){int n;cin>>n;string line;getline(cin,line);vector<tuple<int,int,int>>edges;
for(int i=0;i<n;++i){getline(cin,line);replace(line.begin(),line.end(),',',' ');istringstream in(line);for(int j=0;j<n;++j){int w;in>>w;if(j>i&&w)edges.push_back({w,i,j});}}
sort(edges.begin(),edges.end());vector<int>parent(n),sz(n,1);iota(parent.begin(),parent.end(),0);function<int(int)>find=[&](int u){return parent[u]==u?u:parent[u]=find(parent[u]);};
cout<<"Case "<<cs<<":\n";for(auto [w,u,v]:edges){int a=find(u),b=find(v);if(a==b)continue;if(sz[a]<sz[b])swap(a,b);parent[b]=a;sz[a]+=sz[b];cout<<char('A'+u)<<'-'<<char('A'+v)<<' '<<w<<'\n';}
}}`,
    python: String.raw`import sys
it = iter(sys.stdin.read().replace(',',' ').split())
for cs in range(1,int(next(it))+1):
    n = int(next(it)); edges = []
    for i in range(n):
        for j in range(n):
            w = int(next(it))
            if j > i and w: edges.append((w,i,j))
    parent = list(range(n)); size = [1]*n
    def find(u):
        while u != parent[u]: parent[u] = parent[parent[u]]; u = parent[u]
        return u
    print(f'Case {cs}:')
    for w,u,v in sorted(edges):
        a,b = find(u),find(v)
        if a == b: continue
        if size[a] < size[b]: a,b = b,a
        parent[b] = a; size[a] += size[b]
        print(f'{chr(65+u)}-{chr(65+v)} {w}')`,
  }),
  defineCpeLesson("a777", {
    topic: "number-theory", level: "easy", concept: "質數篩與無序加總配對", goal: "只枚舉較小質數，計算不重複的 Goldbach 配對。",
    explanation: ["先用埃氏篩標記 32768 以下的質數。對偶數 n，枚舉 p=2 到 floor(n/2)，只要 p 和 n−p 都是質數就增加答案；不需另存配對集合。", "限制 p≤n/2 等價於 p≤q，每組不同質數配對只會被較小者枚舉一次。若 p=q=n/2，仍須計一次，所以迴圈包含上界。輸入逐數讀到 0 結束，每個偶數輸出整數個數，不輸出實際分解。"],
    complexity: "預篩 O(U log log U)、空間 O(U)；每筆 O(n)。", pitfall: "枚舉到 n−2 會把不同質數組重複計算；排除 p=q 則會漏掉合法解。",
    traceLabel: "示意：n=10", trace: [
      { title: "p=2", description: "另一數 8 非質數，不計。", cells: ["2質", "8合"], active: [1], variables: [["count", "0"]] },
      { title: "p=3", description: "另一數 7 是質數，加入 (3,7)。", cells: ["3質", "7質"], active: [0,1], variables: [["count", "1"]] },
      { title: "p=5", description: "(5,5) 也符合，總共 2 組；不再枚舉 p=7。", cells: ["5質", "5質"], active: [0,1], variables: [["count", "2"]] },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
using namespace std;
int main(){const int U=32768;vector<bool>p(U,true);p[0]=p[1]=false;for(int i=2;i*i<U;++i)if(p[i])for(int j=i*i;j<U;j+=i)p[j]=false;int n;while(cin>>n&&n){int count=0;for(int i=2;i<=n/2;++i)if(p[i]&&p[n-i])++count;cout<<count<<'\n';}}`,
    python: String.raw`import sys, math
U = 32768; prime = bytearray(b'\1')*U; prime[:2] = b'\0\0'
for p in range(2,math.isqrt(U-1)+1):
    if prime[p]: prime[p*p:U:p] = b'\0'*((U-1-p*p)//p+1)
for n in map(int,sys.stdin.buffer.read().split()):
    if n == 0: break
    print(sum(bool(prime[p] and prime[n-p]) for p in range(2,n//2+1)))`,
  }),
  defineCpeLesson("a778", {
    topic: "simulation", level: "hard", concept: "旋轉等價圖案的標準表示", goal: "找首次重現的棋盤，並判定做出該步者落敗。",
    explanation: ["用集合保存黑棋座標。對目前棋盤產生 0、90、180、270 度四種旋轉，旋轉公式為 (x,y)→(y,N−1−x)，每種按座標排序後取字典序最小者作為標準表示。兩圖案只差旋轉時標準表示相同；鏡射不參與。", "先把初始空棋盤加入 seen，每步合法增刪棋子後檢查標準表示。若重複，當步玩家輸，奇數步由玩家 1 操作、偶數步玩家 2，因此勝者為 2 或 1。即使已分勝負仍必須讀完固定 2N 步，避免下一局讀取錯位。N=0 結束，未重複輸出 Draw。"],
    complexity: "每步有 K≤2N 枚棋，標準化 O(K log K)，每局 O(N² log N) 時間、O(N²) 座標儲存。", pitfall: "初始空盤也算歷史狀態；提前決勝後仍須讀完剩餘操作。",
    traceLabel: "示意：N=2，(1,1)+、(2,2)+、(2,2)−", trace: [
      { title: "第一步", description: "一枚角落棋，尚未重複。", cells: ["1", "0", "0", "0"], active: [0], variables: [["move", "1"], ["棋數", "1"]] },
      { title: "第二步", description: "兩枚對角棋，是新圖案。", cells: ["1", "0", "0", "1"], active: [3], variables: [["move", "2"], ["棋數", "2"]] },
      { title: "第三步", description: "移除右下棋後回到第一步；玩家 1 落敗，玩家 2 勝。", cells: ["1", "0", "0", "0"], active: [0], variables: [["move", "3"], ["winner", "2"]] },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <set>
#include <algorithm>
using namespace std;
using Board=vector<pair<int,int>>;
Board canonical(const set<pair<int,int>>&occupied,int n){Board cur(occupied.begin(),occupied.end()),best=cur;for(int turn=0;turn<4;++turn){sort(cur.begin(),cur.end());best=min(best,cur);for(auto &[x,y]:cur){int old=x;x=y;y=n-1-old;}}return best;}
int main(){int n;while(cin>>n&&n){set<pair<int,int>>board;set<Board>seen;seen.insert(Board{});int winner=0,move=0;
for(int k=1;k<=2*n;++k){int x,y;char op;cin>>x>>y>>op;if(winner)continue;--x;--y;if(op=='+')board.insert({x,y});else board.erase({x,y});Board key=canonical(board,n);if(!seen.insert(key).second){winner=k%2?2:1;move=k;}}
if(winner)cout<<"Player "<<winner<<" wins on move "<<move<<'\n';else cout<<"Draw\n";
}}`,
    python: String.raw`import sys
it = iter(sys.stdin.read().split())
for token in it:
    n = int(token)
    if n == 0: break
    board = set(); seen = {()}; winner = move = 0
    def canonical():
        cur = list(board); forms = []
        for _ in range(4):
            forms.append(tuple(sorted(cur))); cur = [(y,n-1-x) for x,y in cur]
        return min(forms)
    for k in range(1,2*n+1):
        x,y,op = int(next(it))-1,int(next(it))-1,next(it)
        if winner: continue
        if op == '+': board.add((x,y))
        else: board.remove((x,y))
        key = canonical()
        if key in seen: winner,move = (2 if k%2 else 1),k
        else: seen.add(key)
    print(f'Player {winner} wins on move {move}' if winner else 'Draw')`,
  }),
  defineCpeLesson("a779", {
    topic: "geometry", level: "medium", concept: "圓覆蓋轉區間刺點貪心", goal: "將每座島轉成可放雷達的海岸區間。",
    explanation: ["雷達位於 (r,0)，島嶼 (x,y) 可被覆蓋等價於 (r−x)²+y²≤d²。若 |y|>d 就不可能，否則 r 必須落在 [x−√(d²−y²),x+√(d²−y²)]。問題因此變成用最少實數點命中全部閉區間。", "依區間右端遞增排序。若上一個雷達不在目前區間，就在目前右端設新雷達；它覆蓋此區間且盡可能向右，將任何可行解中覆蓋目前區間的雷達移到此處，都不會減少對尚未處理區間的覆蓋，故貪心最優。無解仍要讀完當組島嶼。讀到 0 0 結束，輸出 Case k: 答案，浮點比較只使用很小容差處理相切誤差。"],
    complexity: "時間 O(n log n)，空間 O(n)。", pitfall: "雷達座標不必是整數；只按島嶼 x 座標排序不足以保證最優。",
    traceLabel: "示意：d=2，島 (0,2)、(3,0)、(6,2)", trace: [
      { title: "轉成區間", description: "三個合法雷達區間依序是 [0,0]、[1,5]、[6,6]。", cells: ["[0,0]", "[1,5]", "[6,6]"], active: [0,1,2], variables: [["區間數", "3"]] },
      { title: "設前兩座", description: "先在 0 放雷達；0 不在 [1,5]，再放在 5。", cells: ["雷達0", "雷達5", "[6,6]"], active: [0,1], variables: [["count", "2"]] },
      { title: "設第三座", description: "5 不在 [6,6]，最後在 6 放一座，共 3 座。", cells: ["0", "5", "6"], active: [2], variables: [["count", "3"]] },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <algorithm>
#include <cmath>
#include <limits>
using namespace std;
int main(){int n,cs=0;double d;while(cin>>n>>d&&(n||d)){vector<pair<double,double>>a;bool ok=d>=0;
for(int i=0;i<n;++i){double x,y;cin>>x>>y;if(abs(y)>d){ok=false;continue;}double dx=sqrt(max(0.0,d*d-y*y));a.push_back({x+dx,x-dx});}
sort(a.begin(),a.end());int count=0;double radar=-numeric_limits<double>::infinity();for(auto [right,left]:a)if(radar<left-1e-10){radar=right;++count;}
cout<<"Case "<<++cs<<": "<<(ok?count:-1)<<'\n';
}}`,
    python: String.raw`import sys, math
it = iter(sys.stdin.read().split()); cs = 0
for token in it:
    n,d = int(token),float(next(it))
    if n == 0 and d == 0: break
    intervals = []; ok = d >= 0
    for _ in range(n):
        x,y = float(next(it)),float(next(it))
        if abs(y) > d: ok = False; continue
        dx = math.sqrt(max(0,d*d-y*y)); intervals.append((x+dx,x-dx))
    radar = -math.inf; count = 0
    for right,left in sorted(intervals):
        if radar < left-1e-10: radar = right; count += 1
    cs += 1; print(f'Case {cs}: {count if ok else -1}')`,
  }),
];
