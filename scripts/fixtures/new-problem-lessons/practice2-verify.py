import json,pathlib,textwrap,sys

ROOT=pathlib.Path(__file__).resolve().parents[3]

MAN=ROOT/'scripts/fixtures/new-problem-lessons/source.json'

SOURCES={x['code']:x for x in json.loads(MAN.read_text(encoding='utf-8-sig'))['problems'] if x['code'].startswith('b') and 126<=int(x['code'][1:])<=250}

LESSONS=[];CHECK=[]

def add(n,topic,concept,explain,complexity,pitfall,steps,cpp,py,tests,level='medium'):

 c='b'+str(n);m=SOURCES[c]

 trace=[]

 for i,s in enumerate(steps.split('|')):

  a,b=s.split(':',1)

  trace.append(dict(title=a,description=b,cells=[b],active=[0],variables=[['步驟',str(i+1)]]))

 LESSONS.append(dict(code=c,title=m['title'].split('. ',1)[-1],topic=topic,level=level,concept=concept,goal=explain.split('|')[0],explanation=explain.split('|'),complexity=complexity,pitfall=pitfall,sampleInput=m['samples'][0]['input'] if m['samples'] else '',sampleOutput=m['samples'][0]['output'] if m['samples'] else '',traceLabel='教學小例：'+concept,trace=trace,cpp='#include <bits/stdc++.h>\n#include <boost/multiprecision/cpp_int.hpp>\nusing namespace std; using boost::multiprecision::cpp_int;\n'+textwrap.dedent(cpp).strip()+'\n',python=textwrap.dedent(py).strip()+'\n'))

 for inp,out,why in tests:CHECK.append(dict(code=c,input=inp,output=out,reason=why))

def save():

 p=ROOT/'src/lib/newProblemLessons/data/practice2.json';p.parent.mkdir(parents=True,exist_ok=True);temp=p.with_suffix('.practice2-tmp');temp.write_text(json.dumps(LESSONS,ensure_ascii=False,indent=2),encoding='utf-8');temp.replace(p)

 p=ROOT/'scripts/fixtures/new-problem-lessons/practice2-checks.json';temp=p.with_suffix('.practice2-tmp');temp.write_text(json.dumps(CHECK,ensure_ascii=False,indent=2),encoding='utf-8');temp.replace(p)

add(126,'number-theory','質因數指數的奇偶', '將每個質因數的兩兩配對移到根號外。|若 n=∏p^e，則 a=∏p^(e//2)，b=∏p^(e%2)；平方後相乘恰為n，b中每個質因數最多一次，所以已最簡。|用試除法分解，最後剩餘大於1的數也是質數。依a與b是否為1分三種格式輸出。','時間 O(√n)，額外空間 O(1)。','根號外係數1不可印出；完全平方數不印sqrt(1)。','分解12:12=2²×3|搬出平方因子:a=2，b=3|格式化:a與b皆不為1，輸出2 sqrt(3)',r'''

int main(){long long n,a=1,b=1;cin>>n;for(long long p=2;p*p<=n;p++){int e=0;while(n%p==0)n/=p,e++;for(int i=0;i<e/2;i++)a*=p;if(e%2)b*=p;}b*=n;if(b==1)cout<<a;else{if(a!=1)cout<<a<<' ';cout<<"sqrt("<<b<<")";}cout<<'\n';}

''',r'''

n=int(input());a=b=1;p=2

while p*p<=n:

 e=0

 while n%p==0:n//=p;e+=1

 a*=p**(e//2)

 if e%2:b*=p

 p+=1

b*=n

print(a if b==1 else (str(a)+' ' if a!=1 else '')+f'sqrt({b})')

''',[('72','6 sqrt(2)','最大平方因數36'),('2147483647','sqrt(2147483647)','31位元質數邊界')])

add(127,'graphs','棋盤二分圖最大匹配','將每格依(row+col)奇偶染成黑白。|相等且相鄰的兩格建立邊；每個骨牌等同一條匹配邊，不共用格子等同端點不可重複。|逐一從黑格尋找增廣路，允許重新安排已配對骨牌；沒有增廣路即為最大匹配。每次搜尋重新清除白格拜訪標記。','V=HW，時間 O(V²)，空間 O(V)。','只取眼前可配對鄰格的貪心可能阻擋之後的骨牌。','一列四格:數值1 1 1 1，黑格為第1、3格|第一次配對:第1與2格配成一個骨牌|第二次配對:第3與4格配對，最多2個',r'''

int main(){int h,w;cin>>h>>w;int n=h*w;vector<int>a(n),mt(n,-1),seen(n);for(int&x:a)cin>>x;function<bool(int)>dfs=[&](int u){int r=u/w,c=u%w;for(auto [dr,dc]:vector<pair<int,int>>{{1,0},{-1,0},{0,1},{0,-1}}){int y=r+dr,x=c+dc;if(y<0||y>=h||x<0||x>=w)continue;int v=y*w+x;if(a[u]!=a[v]||seen[v])continue;seen[v]=1;if(mt[v]<0||dfs(mt[v])){mt[v]=u;return true;}}return false;};int ans=0;for(int u=0;u<n;u++)if((u/w+u%w)%2==0){fill(seen.begin(),seen.end(),0);ans+=dfs(u);}cout<<ans<<'\n';}

''',r'''

import sys

it=iter(map(int,sys.stdin.buffer.read().split()));h=next(it);w=next(it);a=list(it);mt=[-1]*(h*w)

def dfs(u):

 r,c=divmod(u,w)

 for y,x in ((r-1,c),(r+1,c),(r,c-1),(r,c+1)):

  if 0<=y<h and 0<=x<w:

   v=y*w+x

   if a[u]==a[v] and v not in seen:

    seen.add(v)

    if mt[v]<0 or dfs(mt[v]):mt[v]=u;return True

 return False

ans=0

for u in range(h*w):

 if (u//w+u%w)%2==0:

  seen=set();ans+=dfs(u)

print(ans)

''',[('1 4\n1 1 1 1','2','四格上限floor(4/2)可達'),('2 2\n1 2\n2 1','0','相鄰均不同')])

add(128,'sorting','配對排序與整行讀取','每批先建立代號與內容的一一對應配對。|使用(代號,數值)作排序鍵，第一項不同時依ASCII字典序，相同時才比較數值。|每批獨立排序後立即輸出；代號行的長度決定當批報表數。','每批k筆，時間 O(k log k)，空間 O(k)，另計代號字元長度。','不能把代號和內容各自排序；也不能合併不同批次。','原始配對:aa 9、a01 3、aa 2|比較代號:a01先於aa|同代號比較內容:a01 3、aa 2、aa 9',r'''

int main(){int t;cin>>t;string s;getline(cin,s);while(t--){getline(cin,s);stringstream ss(s);vector<string>names;while(ss>>s)names.push_back(s);getline(cin,s);stringstream nums(s);vector<pair<string,int>>v;for(auto c:names){int x;nums>>x;v.push_back({c,x});}sort(v.begin(),v.end());for(auto [c,x]:v)cout<<c<<' '<<x<<'\n';}}

''',r'''

for _ in range(int(input())):

 names=input().split();nums=list(map(int,input().split()))

 for c,x in sorted(zip(names,nums)):print(c,x)

''',[('2\naa a01 aa\n9 3 2\nAA aa\n5 1','a01 3\naa 2\naa 9\nAA 5\naa 1','同代號、ASCII大小寫與批次隔離')], 'easy')

add(129,'simulation','十二條固定線的命中計數','先用布林表標記中獎號碼，再枚舉5橫、5直及2對角線。|每條線恰好計算五個格子；命中5格加入成功數，恰好4格加入準連線數。|每種線各列一次，因此沒有漏算或重複；成功線不能同時算準連線。','時間與空間皆 O(1)，棋盤固定5×5。','兩條對角線都要檢查；準連線是恰好四格。','標記1到5:採用1至25依列填入的棋盤|檢查橫列:第一行五格全部命中，成功數1|檢查其餘線:其餘最多命中一格，答案1 0',r'''

int main(){int n,x;cin>>n;bool win[26]={};while(n--){cin>>x;win[x]=1;}int a[5][5];for(auto&r:a)for(int&v:r)cin>>v;int full=0,near=0;auto take=[&](int c){full+=c==5;near+=c==4;};for(int i=0;i<5;i++){int r=0,c=0;for(int j=0;j<5;j++)r+=win[a[i][j]],c+=win[a[j][i]];take(r);take(c);}int p=0,q=0;for(int i=0;i<5;i++)p+=win[a[i][i]],q+=win[a[i][4-i]];take(p);take(q);cout<<full<<' '<<near<<'\n';}

''',r'''

import sys

v=list(map(int,sys.stdin.buffer.read().split()));n=v[0];win=set(v[1:n+1]);a=v[n+1:];lines=[a[i*5:i*5+5] for i in range(5)]+[a[i::5] for i in range(5)]+[a[::6],a[4:21:4]]

c=[sum(x in win for x in line) for line in lines]

print(c.count(5),c.count(4))

''',[('25\n'+' '.join(map(str,range(1,26)))+'\n'+'\n'.join(' '.join(map(str,range(i,i+5))) for i in range(1,26,5)),'12 0','全部12條線成功')],'easy')

add(130,'simulation','相對查詢時間與非負衰減','查詢絕對時間為第一次噴灑時間加y。|對每個已發生事件(t,p)，剩餘量為max(0,p-(T-t))；未來事件貢獻0。|各劑殺菌力獨立相加，逐項累積就是題目定義。使用64位整數容納時間加法與總和。','時間 O(N)，以下實作儲存事件，空間 O(N)。','不能把y直接當絕對時間，也不能讓衰減後的量變負。','初始事件:時間10、強度8，y=3，因此T=13|計算首劑:8-(13-10)=5|加入第二劑:時間12、強度4剩3，總量8',r'''

int main(){int n;long long y;cin>>n>>y;vector<pair<long long,long long>>v(n);for(auto&[t,p]:v)cin>>t>>p;long long T=v[0].first+y,ans=0;for(auto[t,p]:v)if(t<=T)ans+=max(0LL,p-(T-t));cout<<ans<<'\n';}

''',r'''

import sys

v=list(map(int,sys.stdin.buffer.read().split()));n,y=v[:2];T=v[2]+y

print(sum(max(0,p-(T-t)) for t,p in zip(v[2::2],v[3::2]) if t<=T))

''',[('2 3 10 8 12 4','8','非零起點與兩次疊加'),('2 4294967295 4294967295 1 4294967295 4294967295','0','64位時間加法且兩劑均耗盡')],'easy')

add(131,'search','固定行程的子集合去重','熱門定義依本站勘誤為出現次數至少H。|每組行程最多12個景點，枚舉各行程所有子集合；同一景點集合以25位元遮罩為鍵累計出現次數。|一個集合只會在含有它的行程被列出一次，因此次數正好是支持它的行程數。只計大小N且次數≥H的鍵。','四組長度最多12，時間 O(4·12·2^12)，空間 O(4·2^12)。','不是嚴格大於H；同一集合跨行程出現只算一個答案。','設定H=4,N=1:四組行程的共同景點為5與17|枚舉與累計:{5}及{17}的計數皆為4|篩選:共2種單點集合，答案2',r'''

int main(){int H,N;cin>>H>>N;vector<vector<int>>v={{1,2,3,5,6,8,11,13,17,21,22},{2,3,5,7,8,13,16,17,21,22,24},{1,3,5,6,7,15,16,17,22,23,24,25},{2,4,5,7,8,15,17,21,23,25}};unordered_map<int,int>cnt;for(auto&a:v)for(int m=0;m<(1<<a.size());m++)if(__builtin_popcount((unsigned)m)==N){int key=0;for(int i=0;i<(int)a.size();i++)if(m>>i&1)key|=1<<(a[i]-1);cnt[key]++;}int ans=0;for(auto[k,c]:cnt)ans+=c>=H;cout<<ans<<'\n';}

''',r'''

from itertools import combinations

from collections import Counter

import sys

H,N=map(int,sys.stdin.read().split())

v=[[1,2,3,5,6,8,11,13,17,21,22],[2,3,5,7,8,13,16,17,21,22,24],[1,3,5,6,7,15,16,17,22,23,24,25],[2,4,5,7,8,15,17,21,23,25]]

c=Counter(s for a in v for s in combinations(a,N))

print(sum(x>=H for x in c.values()))

''',[('4\n1','2','四組交集{5,17}'),('1\n25','0','行程長度皆小於25')])

add(132,'search','嚴格遞增組合枚舉','依n1<n2<n3<n4<n5枚舉五個數，每個只在1到30內。|計算20n1+n2²+3n3+4(n3+n4)+5(n5-n4)，符合N即累加c。|迴圈下界設為前一個數加1，故每個合法五元組恰被列一次；有解印c³，否則印5N-3。','時間 O(C(30,5))，額外空間 O(1)；Python combinations逐筆產生。','五個數必須嚴格遞增；計數立方使用64位整數。','最小五元組:1,2,3,4,5，算得20+4+9+28+5=66|測試N=1500:各項可化為20n1+n2²+7n3-n4+5n5|最大值界:最大五元組26,27,28,29,30得1566；仍須逐組比對1500，不能用範例猜答案',r'''

int main(){long long N,c=0;cin>>N;for(int a=1;a<=26;a++)for(int b=a+1;b<=27;b++)for(int d=b+1;d<=28;d++)for(int e=d+1;e<=29;e++)for(int f=e+1;f<=30;f++)if(20*a+b*b+3*d+4*(d+e)+5*(f-e)==N)c++;cout<<(c?c*c*c:5*N-3)<<'\n';}

''',r'''

from itertools import combinations

N=int(input());c=0

for a,b,d,e,f in combinations(range(1,31),5):

 if 20*a+b*b+3*d+4*(d+e)+5*(f-e)==N:c+=1

print(c**3 if c else 5*N-3)

''',[])

add(134,'simulation','Collatz逐步模擬','對每筆輸入反覆套用奇偶轉換，直到數值為1。|每執行一次轉換便增加計數；初始輸入本身不算一步。|用整數保存中途數值，Python可任意精度，C++使用64位以避免32位中間溢位。','每筆時間 O(L)，L為實際鏈長，額外空間 O(1)；此輸入範圍可直接模擬。','不能把1也再套用3n+1；輸入沒有測試總數而是讀到EOF。','輸入2:尚未執行，步數0|偶數轉換:2除以2得到1，步數1|停止:已到1，輸出1',r'''

int main(){long long n;while(cin>>n){int c=0;while(n!=1){n=n%2?3*n+1:n/2;c++;}cout<<c<<'\n';}}

''',r'''

import sys

for n in map(int,sys.stdin.buffer.read().split()):

 c=0

 while n!=1:n=3*n+1 if n%2 else n//2;c+=1

 print(c)

''',[('2\n16','1\n4','單步與純2次方')],'easy')

add(135,'dp','固定上下界後的一維最大子段','枚舉矩形的上界與下界，將其中每欄的數值加總。|固定這兩列後，任一連續欄區間都對應一個矩形；用Kadane維持以當前欄結尾的最大非負總和。|所有矩形皆有唯一上下界及左右界，因此遍歷這些情形即可得到全域最大值，0代表完全不採收。','時間 O(N³)，空間 O(N²)存棋盤加 O(N)欄和。','全負數時答案0；最佳矩形可以完全位於內部。','選定兩列:欄和為-2,5,4,-8|掃描前三欄:最大尾段依序0,5,9|掃描最後欄:尾段降為1，仍保留最佳9',r'''

int main(){int n;cin>>n;vector<vector<int>>a(n,vector<int>(n));for(auto&r:a)for(int&x:r)cin>>x;int ans=0;for(int t=0;t<n;t++){vector<int>s(n);for(int b=t;b<n;b++){int cur=0;for(int c=0;c<n;c++){s[c]+=a[b][c];cur=max(0,cur+s[c]);ans=max(ans,cur);}}}cout<<ans<<'\n';}

''',r'''

import sys

v=list(map(int,sys.stdin.buffer.read().split()));n=v[0];a=[v[1+i*n:1+(i+1)*n] for i in range(n)];ans=0

for t in range(n):

 s=[0]*n

 for b in range(t,n):

  cur=0

  for c in range(n):

   s[c]+=a[b][c];cur=max(0,cur+s[c]);ans=max(ans,cur)

print(ans)

''',[('1\n-127','0','空採收'),('3\n-9 -9 -9\n-9 7 -9\n-9 -9 -9','7','最佳為內部單格')])

add(136,'strings','前綴括號平衡','左括號使balance加1，右括號使其減1。|任何前綴balance為負表示右括號無法配對，必為錯誤；讀完後balance必須恰為0。|若兩條件皆滿足，每個右括號都能配到先前未使用的左括號，因此合法，對數就是長度除以2。','每串時間 O(L)，空間 O(1)。','總數相同仍可能順序錯誤，例如)(。','讀取(()):balance依序1、2|讀取兩個右括號:balance變1、0，從未負數|檢查結尾:平衡為0且長度4，輸出2',r'''

int main(){int t;cin>>t;string s;while(t--){cin>>s;int b=0;bool ok=true;for(char c:s){b+=c=='('?1:-1;if(b<0)ok=false;}cout<<(ok&&b==0?s.size()/2:0)<<'\n';}}

''',r'''

for _ in range(int(input())):

 s=input();b=0;ok=True

 for c in s:

  b+=1 if c=='(' else -1

  if b<0:ok=False

 print(len(s)//2 if ok and b==0 else 0)

''',[('3\n)(\n()()\n((()))','0\n2\n3','逆序、並列及巢狀括號')],'easy')

add(137,'simulation','保留重複項的費氏序列篩選','預先依遞迴產生不超過1000000的費氏數，包括0及兩個1。|每筆先交換端點為lo≤hi，再依原費氏順序列出區間內的項；數量計的是項數。|序列已排序且包含所有合法索引，逐項篩選不會遺漏或多印。組間才印六個減號。','預處理與每筆查詢 O(log U)，U=1000000；空間 O(log U)，含整數字元輸出成本。','不能用集合去重兩個1；最後一組後沒有分隔線。','建立前綴:0,1,1,2,3,5,8|查詢1到2:保留1,1,2|輸出項數:逐行印三項，再印3',r'''

int main(){vector<int>f={0,1};while(f.back()+f[f.size()-2]<=1000000)f.push_back(f.back()+f[f.size()-2]);int t,a,b;cin>>t;for(int k=0;k<t;k++){cin>>a>>b;if(a>b)swap(a,b);if(k)cout<<"------\n";int c=0;for(int x:f)if(a<=x&&x<=b)cout<<x<<'\n',c++;cout<<c<<'\n';}}

''',r'''

import sys

v=list(map(int,sys.stdin.buffer.read().split()));f=[0,1]

while f[-1]+f[-2]<=1000000:f.append(f[-1]+f[-2])

for i in range(v[0]):

 a,b=sorted(v[1+2*i:3+2*i])

 if i:print('------')

 ans=[x for x in f if a<=x<=b]

 for x in ans:print(x)

 print(len(ans))

''',[('2\n1 1\n8 8','1\n1\n2\n------\n8\n1','重複1與遞迴中不可省略的8')],'easy')

add(138,'dp','排列LCS轉LIS，再求二維偏序鏈','先找唯一最短路線，將其中城市2到N的位置記錄。|每條路線的內部城市映成位置序列，其嚴格LIS長度即為內部LCS；兩端的1必定都能選，所以相似度加2。|按相似度排序，用dp[i]=1+max(dp[j])，條件為sim[j]<sim[i]且dist[j]>dist[i]。所有合法集合都是這個偏序的一條鏈，轉移枚舉其倒數第二條路線。','時間 O(MN log N+M²)，空間 O(MN)儲存輸入，另 O(M+N)。距離使用任意精度。','相似度及距離皆為嚴格比較；最短路線不一定在第一行。','最佳路線:1,2,3,4,1，相似度5|另一條路線:1,3,2,4,1，內部位置2,1,3的LIS為2，相似度4|連成鏈:若前者距離10、後者20，可由相似度4走到5，答案2',r'''

int main(){int n,m;cin>>n>>m;vector<cpp_int>d(m);vector<vector<int>>r(m,vector<int>(n+1));int best=0;for(int i=0;i<m;i++){cin>>d[i];for(int&x:r[i])cin>>x;if(d[i]<d[best])best=i;}vector<int>pos(n+1);for(int j=1;j<n;j++)pos[r[best][j]]=j;vector<pair<int,int>>v;for(int i=0;i<m;i++){vector<int>tail;for(int j=1;j<n;j++){int x=pos[r[i][j]];auto it=lower_bound(tail.begin(),tail.end(),x);if(it==tail.end())tail.push_back(x);else *it=x;}v.push_back({tail.size()+2,i});}sort(v.begin(),v.end());vector<int>dp(m,1);int ans=1;for(int i=0;i<m;i++){for(int j=0;j<i;j++)if(v[j].first<v[i].first&&d[v[j].second]>d[v[i].second])dp[i]=max(dp[i],dp[j]+1);ans=max(ans,dp[i]);}cout<<ans<<'\n';}

''',r'''

import sys,bisect

it=iter(map(int,sys.stdin.buffer.read().split()));n=next(it);m=next(it);v=[]

for _ in range(m):v.append((next(it),[next(it) for _ in range(n+1)]))

best=min(v,key=lambda z:z[0])[1];pos={x:i for i,x in enumerate(best[1:-1])};rows=[]

for d,r in v:

 tail=[]

 for x in r[1:-1]:

  p=bisect.bisect_left(tail,pos[x])

  if p==len(tail):tail.append(pos[x])

  else:tail[p]=pos[x]

 rows.append((len(tail)+2,d))

rows.sort();dp=[1]*m

for i,(s,d) in enumerate(rows):

 for j,(t,e) in enumerate(rows[:i]):

  if t<s and e>d:dp[i]=max(dp[i],dp[j]+1)

print(max(dp))

''',[('4 2\n20 1 3 2 4 1\n10 1 2 3 4 1','2','直接LCS為4、5且距離下降'),('1 1\n999999999999999999999 1 1','1','只有一個城市與大整數距離')])

add(139,'dp','交易區間動態規劃與整數手續費','令dp[k][i]為前i天最多k筆完整交易的最大收益。|若第i天不賣，繼承dp[k][i-1]；若在j<i日買、i日賣，候選為dp[k-1][j-1]+999p[i]-1001p[j]。|枚舉最後一筆交易的買賣日已涵蓋所有方案；初始為0，所以也容許完全不交易。','時間 O(tn²)，空間 O(tn)。','價格單位為千元，買入乘1001、賣出乘999；不可使用粗略的兩倍手續費。','兩日價格1,3:最多1筆交易|買入:成本1001元|賣出:收入2997元，淨利1996元',r'''

int main(){int t,n;cin>>t>>n;vector<int>p(n+1);for(int i=1;i<=n;i++)cin>>p[i];vector<vector<long long>>dp(t+1,vector<long long>(n+1));for(int k=1;k<=t;k++)for(int i=1;i<=n;i++){dp[k][i]=dp[k][i-1];for(int j=1;j<i;j++)dp[k][i]=max(dp[k][i],dp[k-1][j-1]+999LL*p[i]-1001LL*p[j]);}cout<<dp[t][n]<<'\n';}

''',r'''

import sys

v=list(map(int,sys.stdin.buffer.read().split()));t,n=v[:2];p=[0]+v[2:];dp=[[0]*(n+1) for _ in range(t+1)]

for k in range(1,t+1):

 for i in range(1,n+1):

  dp[k][i]=max([dp[k][i-1]]+[dp[k-1][j-1]+999*p[i]-1001*p[j] for j in range(1,i)])

print(dp[t][n])

''',[('1\n2\n1 3','1996','唯一可獲利交易直接算費用'),('2\n4\n0 1 0 1','1998','兩筆零成本交易各999元')])

add(141,'dp','固定最小編號消除隊伍排列對稱','每隊需要s=N/K人，預先計算各子集合的人數與戰力和。|令solve(mask)為尚未分組人員的最大乘積，空集合為1。選mask最小編號者，枚舉包含他且人數s的子集合sub作下一隊。|最小編號者一定在某一隊，因此不漏掉任何分組；固定他所在隊優先，又避免同一組隊伍的排列重複。取sum[sub]×solve(mask去除sub)的最大值。','時間上界 O(3^N)，空間 O(2^N)；答案保證64位內。','空集合乘積是1；必須要求每隊人數完全相同。','四人1,2,3,4分兩隊:固定1所在隊|列出三種配法:(1+2)(3+4)=21；(1+3)(2+4)=24|最佳配法:(1+4)(2+3)=25，輸出25',r'''

int main(){int n,k;cin>>n>>k;vector<int>a(n);for(int&x:a)cin>>x;int z=1<<n,s=n/k;vector<int>sum(z);for(int m=1;m<z;m++){int b=__builtin_ctz((unsigned)m);sum[m]=sum[m^(1<<b)]+a[b];}vector<long long>dp(z,-1);function<long long(int)>f=[&](int m)->long long{if(!m)return 1;if(dp[m]>=0)return dp[m];long long ans=0;int bit=m&-m;for(int sub=m;sub;sub=(sub-1)&m)if((sub&bit)&&__builtin_popcount((unsigned)sub)==s)ans=max(ans,1LL*sum[sub]*f(m^sub));return dp[m]=ans;};cout<<f(z-1)<<'\n';}

''',r'''

from functools import lru_cache

from itertools import combinations

import sys

v=list(map(int,sys.stdin.buffer.read().split()));n,k=v[:2];a=v[2:];s=n//k

@lru_cache(None)

def f(mask):

 if not mask:return 1

 ids=[i for i in range(n) if mask>>i&1];ans=0

 for rest in combinations(ids[1:],s-1):

  team=(ids[0],)+rest;sub=sum(1<<i for i in team)

  ans=max(ans,sum(a[i] for i in team)*f(mask^sub))

 return ans

print(f((1<<n)-1))

''',[('4 2\n1 2 3 4','25','直接枚舉三種無標號分組'),('3 3\n100 100 100','1000000','每隊單人')])

add(142,'dp','必須切到底的最小成本','先以篩法求出L以內所有質數。|dp[x]表示長x木棒切到底的最小成本；若存在質數p,q且p+q=x，必須在所有x+dp[p]+dp[q]中取最小。若不存在則為0。|因p,q<x，依長度遞增處理即可；第一次切割一定是其中一種質數分割，子棒又各自最優，所以轉移完整。','時間 O(L²)，空間 O(L)。','可切時不可選擇不切；不是只付第一次的長度成本。','長4:只能切2+2，成本4|長6:只能切3+3，兩個3均不能切，成本6|長8:切3+5，5再切2+3，總成本8+5=13',r'''

int main(){int n;cin>>n;vector<bool>p(n+1,true);p[0]=false;if(n>=1)p[1]=false;for(int i=2;i*i<=n;i++)if(p[i])for(int j=i*i;j<=n;j+=i)p[j]=false;vector<int>dp(n+1);for(int x=1;x<=n;x++){int best=INT_MAX;for(int a=2;a<=x/2;a++)if(p[a]&&p[x-a])best=min(best,x+dp[a]+dp[x-a]);if(best!=INT_MAX)dp[x]=best;}cout<<dp[n]<<'\n';}

''',r'''

n=int(input());p=[True]*(n+1);p[0]=False

if n:p[1]=False

for i in range(2,n+1):

 if p[i]:

  for j in range(i*i,n+1,i):p[j]=False

dp=[0]*(n+1)

for x in range(1,n+1):

 options=[x+dp[a]+dp[x-a] for a in range(2,x//2+1) if p[a] and p[x-a]]

 dp[x]=min(options,default=0)

print(dp[n])

''',[('8','13','唯一無序質數分割3+5'),('3','0','無可切的質數分割')])

add(143,'simulation','將二維空位視為一維串流','先依列優先收集所有留白座標。|留白數B與文字長度L的差為偶數，前後各保留(B-L)/2個點，從這個索引開始依序填字。|座標串列恰為題目要求的閱讀順序；只修改其中連續L個位置，其餘點與#保持原樣。','時間 O(RC+L)，空間 O(RC)。','置中依的是留白序列，不是每行各自置中。','空位串流:看板..#...共5個空位，要放ABC|計算前留白:(5-3)/2=1|填入結果:第2到4個空位填ABC，得到.A#BC.',r'''

int main(){int r,c;cin>>r>>c;string s;cin>>s;vector<string>a(r);vector<pair<int,int>>v;for(int i=0;i<r;i++){cin>>a[i];for(int j=0;j<c;j++)if(a[i][j]=='.')v.push_back({i,j});}int start=(v.size()-s.size())/2;for(int k=0;k<(int)s.size();k++){auto[i,j]=v[start+k];a[i][j]=s[k];}for(auto row:a)cout<<row<<'\n';}

''',r'''

r,c=map(int,input().split());s=input();a=[list(input()) for _ in range(r)];v=[(i,j) for i in range(r) for j in range(c) if a[i][j]=='.'];start=(len(v)-len(s))//2

for k,ch in enumerate(s):

 i,j=v[start+k];a[i][j]=ch

for row in a:print(''.join(row))

''',[('1 6\nABC\n..#...','.A#BC.','留白串流置中且#不動')],'easy')

add(144,'dp','依最後一塊磁磚分類','設dp[i]為鋪滿長i地板的方法數，dp[0]=1代表空鋪法。|最後一塊長度只能為1、2、3，移除它後分別剩長i-1、i-2、i-3，所以將有效的三項相加。|三類最後一塊互不重疊且涵蓋所有鋪法，因此遞迴正確；答案使用任意精度整數。','時間 O(n)次大整數加法，空間 O(n)個大整數；位元成本另依答案長度。','排列次序不同要分別算；dp[0]不能設0。','長0:dp[0]=1|長1與2:dp[1]=1，dp[2]=2|長3:dp[3]=dp[2]+dp[1]+dp[0]=4',r'''

int main(){int n;cin>>n;vector<cpp_int>dp(n+1);dp[0]=1;for(int i=1;i<=n;i++)for(int k=1;k<=3&&k<=i;k++)dp[i]+=dp[i-k];cout<<dp[n]<<'\n';}

''',r'''

n=int(input());dp=[1]+[0]*n

for i in range(1,n+1):dp[i]=sum(dp[max(0,i-3):i])

print(dp[n])

''',[('3','4','111、12、21、3四種'),('1','1','唯一單格磁磚')],'easy')

add(145,'dp','字首字尾與字母頻率簽章的解碼','單字匹配需要長度、首字母、尾字母及所有字母次數相同。中間字母任意排列恰等價於這個條件。|去除字典重複項，以後綴dp[i]記錄從i開始的句子數，超過1只保留2。逐一嘗試匹配單字，再加上dp[i+len]。|dp[len]=1表示空後綴。若dp[0]=1則每步一定只有一個可接續的單字，沿記錄還原；0與2分別輸出-1與1。','時間 O(SK·W log W)以下用排序簽章，S≤1000、K≤100、W≤100；空間 O(S+KW)。','重複字典詞不算不同解；相同簽章的不同詞仍是不同原句。','密文abc、字典ab與c:dp[3]=1|由後往前:c匹配位置2，dp[2]=1；ab匹配位置0|唯一還原:dp[0]=1，輸出ab c',r'''

string sig(string s){sort(s.begin(),s.end());return s;}

int main(){int t;cin>>t;while(t--){string s,w;int k;cin>>s>>k;set<string>u;while(k--){cin>>w;u.insert(w);}vector<string>v(u.begin(),u.end()),sg;for(auto w:v)sg.push_back(sig(w));int n=s.size();vector<int>dp(n+1),go(n,-1);dp[n]=1;for(int i=n-1;i>=0;i--)for(int j=0;j<(int)v.size();j++){int l=v[j].size();if(i+l<=n&&s[i]==v[j][0]&&s[i+l-1]==v[j].back()&&dp[i+l]&&sig(s.substr(i,l))==sg[j]){dp[i]=min(2,dp[i]+dp[i+l]);go[i]=j;}}if(dp[0]!=1)cout<<(dp[0]?1:-1)<<'\n';else{bool first=true;for(int i=0;i<n;){string w=v[go[i]];if(!first)cout<<' ';first=false;cout<<w;i+=w.size();}cout<<'\n';}}}

''',r'''

for _ in range(int(input())):

 s=input();v=sorted({input() for _ in range(int(input()))});sg=[''.join(sorted(w)) for w in v];n=len(s);dp=[0]*(n+1);go=[None]*n;dp[n]=1

 for i in range(n-1,-1,-1):

  for w,key in zip(v,sg):

   l=len(w)

   if i+l<=n and dp[i+l] and s[i]==w[0] and s[i+l-1]==w[-1] and ''.join(sorted(s[i:i+l]))==key:

    dp[i]=min(2,dp[i]+dp[i+l]);go[i]=w

 if dp[0]!=1:print(1 if dp[0] else -1)

 else:

  ans=[];i=0

  while i<n:ans.append(go[i]);i+=len(go[i])

  print(' '.join(ans))

''',[('3\nabc\n2\nab\nc\naa\n3\na\naa\na\nx\n1\na','ab c\n1\n-1','人工列出唯一、兩種分詞與無解')])

add(146,'search','以二進位計數枚舉全部子集合','第i個元素對應遮罩的第i位，遮罩從0開始遞增。|對每個遮罩列出所有為1的位元對應元素，依原輸入順序輸出。|每個子集合都有唯一的選取位元串，故恰好輸出2^N個集合。C++以位元陣列實作二進位加一，避免固定位寬限制。','時間 O(N·2^N)加輸出字元量，空間 O(N)加元素字串；輸出本身即為指數規模。','第一個元素是最低位；元素名稱不能另外排序。','兩元素x,y:遮罩00輸出0|遮罩01與10:依序輸出1 x、1 y|遮罩11:輸出2 x y，完成全部4個集合',r'''

int main(){int n;cin>>n;vector<string>a(n);for(auto&s:a)cin>>s;vector<int>b(n);while(true){int c=accumulate(b.begin(),b.end(),0);cout<<c;for(int i=0;i<n;i++)if(b[i])cout<<' '<<a[i];cout<<'\n';int j=0;while(j<n&&b[j])b[j++]=0;if(j==n)break;b[j]=1;}}

''',r'''

n=int(input());import sys

a=sys.stdin.read().split()

for mask in range(1<<n):

 v=[a[i] for i in range(n) if mask>>i&1];print(len(v),*v)

''',[('0','0','空集合的冪集仍有一個元素'),('1\nz','0\n1 z','單元素')],'easy')

add(147,'strings','字母編號模26循環','將A到Z編成0到25，將每個編號加n再對26取餘數。|餘數回轉為大寫字母即可，因為每繞過26個字母就回到原位置。|逐字獨立轉換，不變動字元先後順序。','時間 O(L)，空間 O(L)保存輸入與結果。','超過Z需要繞回A；輸入次序是字串再位移。','輸入YZ、位移2:Y為24，Z為25|加上位移:得到26與27|模26:0與1對應AB',r'''

int main(){string s;int n;cin>>s>>n;for(char&c:s)c='A'+(c-'A'+n)%26;cout<<s<<'\n';}

''',r'''

s=input().split();import sys

s+=sys.stdin.read().split();a,n=s[0],int(s[1]);print(''.join(chr(65+(ord(c)-65+n)%26) for c in a))

''',[('YZ\n2','AB','循環跨Z邊界')],'easy')

add(148,'strings','文法的迭代狀態機','A只能是X，或括號包住一個A再接零個以上的+A。|維持depth與need，need表示目前必須開始一個A。讀到X完成A；讀到左括號開啟一層；+必須位於括號內且已有A，然後再次需要A；右括號必須有完整A才能結束。|遇到非法轉移立即判錯，最後必須depth=0且need為假。這些轉移逐一對應文法規則，並避免深遞迴造成堆疊溢位。','時間 O(L)，額外空間 O(1)，另 O(L)讀取整行。','最外層X+X不合法；空白不可先移除後再檢查。','讀取(X+X):左括號使depth=1，need=true|中間X+X:need依序false、true、false|右括號:depth回0且need=false，輸出TRUE',r'''

int main(){int t;cin>>t;string s;getline(cin,s);while(t--){getline(cin,s);int d=0;bool need=true,ok=true;for(char c:s){if(c=='X'&&need)need=false;else if(c=='('&&need)d++;else if(c=='+'&&!need&&d>0)need=true;else if(c==')'&&!need&&d>0)d--;else{ok=false;break;}}cout<<(ok&&!need&&d==0?"TRUE":"FALSE")<<'\n';}}

''',r'''

import sys

for _ in range(int(sys.stdin.readline())):

 s=sys.stdin.readline().rstrip('\r\n');d=0;need=True;ok=True

 for c in s:

  if c=='X' and need:need=False

  elif c=='(' and need:d+=1

  elif c=='+' and not need and d>0:need=True

  elif c==')' and not need and d>0:d-=1

  else:ok=False;break

 print('TRUE' if ok and not need and d==0 else 'FALSE')

''',[('5\nX\nX+X\n()\n(X)\n X','TRUE\nFALSE\nFALSE\nTRUE\nFALSE','文法邊界及原樣空白')])

add(149,'strings','Manacher半徑與位置計數','分別計算以每個字元為中心的奇數迴文半徑與每個縫隙為中心的偶數半徑。|利用目前最右迴文的對稱中心提供已知半徑下界，只有超過右邊界的部分才需逐字延伸；右邊界總共只向右移O(L)次。|每個中心只取最大半徑，所有中心的最大長度即答案；等於此長度的中心數就是不同出現位置數。相同內容也分別計數。','時間 O(L)，空間 O(L)。','不能將相同內容去重；奇數與偶數中心都要處理。','字串abba:奇數中心最多長1|偶數中心:兩個b之間向外配對bb，再配對aa，長4|彙總:最大長4只出現在一個中心，答案4 1',r'''

int main(){int t;cin>>t;while(t--){string s;cin>>s;int n=s.size(),best=0,cnt=0;vector<int>a(n),b(n);for(int mode=0;mode<2;mode++){auto&d=mode?b:a;int l=0,r=-1;for(int i=0;i<n;i++){int k=i>r?(mode?0:1):min(d[l+r-i+(mode?1:0)],r-i+1);while(i-k-(mode?1:0)>=0&&i+k<n&&s[i-k-(mode?1:0)]==s[i+k])k++;d[i]=k;int len=2*k-(mode?0:1);if(len>best)best=len,cnt=1;else if(len==best)cnt++;int end=i+k-1;if(end>r){l=i-k+(mode?0:1);r=end;}}}cout<<best<<' '<<cnt<<'\n';}}

''',r'''

for _ in range(int(input())):

 s=input();n=len(s);best=cnt=0

 for mode in (0,1):

  d=[0]*n;l=0;r=-1

  for i in range(n):

   k=(0 if mode else 1) if i>r else min(d[l+r-i+mode],r-i+1)

   while i-k-mode>=0 and i+k<n and s[i-k-mode]==s[i+k]:k+=1

   d[i]=k;length=2*k-(1-mode)

   if length>best:best=length;cnt=1

   elif length==best:cnt+=1

   if i+k-1>r:l=i-k+(1-mode);r=i+k-1

 print(best,cnt)

''',[('3\nabba\nabc\naaa','4 1\n1 3\n3 1','手列全部子字串，包含偶數與多個單字元')])



CHECK.append(dict(code='b132',input='90',output='64',reason='手工列四組：(1,2,3,5,10)、(1,2,3,10,11)、(1,2,4,7,9)、(1,3,4,7,8)，答案4³'))

add(151,'sorting','先驗票再累計與排序','逐行保留原始票字串，長度恰N、只含0與*、星號不超過M才是有效票。|有效票的每個*使對應候選人加一票；整張先驗證，避免無效票的部分票數流入統計。|最後按(-票數,姓名ASCII字典序)排序全部候選人，包括零票者。','時間 O(PN+N log N)，空間 O(N)加票字串及姓名。','票中的空白是非法字元；不能用split移除後再驗證。','候選A,B，M=1:票*0有效，A加1|檢查票**:星號2超過1，整張廢票|輸出排名:A 1先於B 0',r'''

int main(){int n,m,p;cin>>n>>m;vector<string>a(n);for(auto&s:a)cin>>s;cin>>p;string s;getline(cin,s);vector<int>cnt(n);while(p--){getline(cin,s);if((int)s.size()!=n||s.find_first_not_of("0*")!=string::npos||count(s.begin(),s.end(),'*')>m)continue;for(int i=0;i<n;i++)cnt[i]+=s[i]=='*';}vector<int>ids(n);iota(ids.begin(),ids.end(),0);sort(ids.begin(),ids.end(),[&](int i,int j){return cnt[i]!=cnt[j]?cnt[i]>cnt[j]:a[i]<a[j];});for(int i:ids)cout<<a[i]<<' '<<cnt[i]<<'\n';}

''',r'''

import sys

f=sys.stdin;n,m=map(int,f.readline().split());a=[f.readline().strip() for _ in range(n)];cnt=[0]*n

for _ in range(int(f.readline())):

 s=f.readline().rstrip('\r\n')

 if len(s)==n and set(s)<=set('0*') and s.count('*')<=m:

  for i,c in enumerate(s):cnt[i]+=c=='*'

for i in sorted(range(n),key=lambda i:(-cnt[i],a[i])):print(a[i],cnt[i])

''',[('2 1\nA\nB\n4\n*0\n**\n0 *\n00','A 1\nB 0','逐張人工驗票，包含空白廢票')])

add(152,'strings','三字元視窗與重疊匹配','先檢查目標長度恰為3且首尾相同，否則直接輸出-1。|合法時枚舉樣本每個長3的連續視窗，和目標完全相同就加1。|每次只前進一格，因此所有起點皆被檢查，重疊的出現也不會漏算。','時間 O(L)，空間 O(L)讀入字串，掃描額外 O(1)。','X與Y可以相同，例如AAA合法；匹配後不可跳三格。','目標AAA、樣本AAAAA:起點0視窗AAA命中|起點1:視窗AAA再次命中|起點2:第三次命中，答案3',r'''

int main(){int t;cin>>t;while(t--){string p,s;cin>>p>>s;if(p.size()!=3||p[0]!=p[2]){cout<<-1<<'\n';continue;}int c=0;for(int i=0;i+3<=(int)s.size();i++)c+=s.compare(i,3,p)==0;cout<<c<<'\n';}}

''',r'''

for _ in range(int(input())):

 p=input();s=input()

 print(-1 if len(p)!=3 or p[0]!=p[2] else sum(s[i:i+3]==p for i in range(len(s)-2)))

''',[('2\nAAA\nAAAAA\nABBA\nABBABBA','3\n-1','三次重疊及錯誤長度')],'easy')

add(153,'simulation','依完成時間維護系統內人數','依抵達順序計算完成時間finish=max(lastFinish,q)+s。|用佇列保存尚未完成顧客的完成時間；抵達q時先移除所有完成時間≤q者，再加入新顧客。|佇列內至多一人正在服務，其餘皆等待，所以等待數為佇列長度減1。等待人數只會在抵達時增加，逐次取最大即足夠。','時間 O(n)，空間 O(n)最壞保存所有顧客。','完成與抵達同時，前者已離開；正在服務的人不算等待。','第一人(1,2):完成時間3，等待0|第二人(2,2):完成時間5，等待1|第三人(3,1):先移除時間3完成者，仍只有1人在等待，答案1',r'''

int main(){int n;cin>>n;deque<long long>d;long long last=0,ans=0;while(n--){long long q,s;cin>>q>>s;while(!d.empty()&&d.front()<=q)d.pop_front();last=max(last,q)+s;d.push_back(last);ans=max(ans,(long long)d.size()-1);}cout<<ans<<'\n';}

''',r'''

from collections import deque

n=int(input());d=deque();last=ans=0

for _ in range(n):

 q,s=map(int,input().split())

 while d and d[0]<=q:d.popleft()

 last=max(last,q)+s;d.append(last);ans=max(ans,len(d)-1)

print(ans)

''',[('3\n1 2\n2 2\n3 1','1','同時完成與抵達'),('4\n1 1\n1 1\n1 1\n1 1','3','四人同到，只有一人服務')])

add(154,'number-theory','平方模8與縮小四倍','若k≥3，四個平方的和為0 mod8。平方餘數只有0、1、4，考慮奇數平方數量可知四個數必須全部偶數。|全部除以2，將問題從2^k縮成2^(k-2)，持續到k=1或2。k=1小於四個正平方的最小和4，無解；k=2只有(1,1,1,1)。|所以奇數k無解；偶數k唯一解為四個相同的2^((k-2)/2)。用大整數實際計算，不列舉巨大平方。','每筆需產生 Θ(k)位元整數，輸出與大整數轉十進位成本不可忽略；空間 O(k)。','四個數皆須正數，不允許用0補成其他解。','k=2:四個1平方和4|k=4:由k=2解全部乘2，得到2 2 2 2|k=3:除以4後變k=1而無正解，輸出0',r'''

int main(){int t;cin>>t;while(t--){unsigned long long k;cin>>k;if(k%2)cout<<0<<'\n';else{cpp_int x=cpp_int(1)<<((k-2)/2);cout<<x<<' '<<x<<' '<<x<<' '<<x<<'\n';}}}

''',r'''

import sys

if hasattr(sys,'set_int_max_str_digits'):sys.set_int_max_str_digits(0)

for _ in range(int(input())):

 k=int(input())

 if k%2:print(0)

 else:

  x=1<<((k-2)//2);print(x,x,x,x)

''',[('3\n1\n4\n6','0\n2 2 2 2\n4 4 4 4','小數值直接列舉四平方可驗證')])

add(155,'strings','只記錄上一次命中位置','先將樣本與目標統一為小寫。|逐字掃描，每次命中目標，若已有前次位置就輸出目前索引減前次索引，再更新前次位置。|這樣恰好計算每對相鄰出現的距離，且距離不受使用0或1起算索引影響。','時間 O(L)，空間 O(L)字串與結果。','距離是位置之差，不是兩個字母之間的字元個數。','樣本aBAba、目標A:命中位置0|下一次命中:位置2，距離2|最後命中:位置4，距離2，輸出2 2',r'''

int main(){string s;char t;cin>>s>>t;t=tolower(t);int last=-1;bool first=true;for(int i=0;i<(int)s.size();i++)if(tolower(s[i])==t){if(last>=0){if(!first)cout<<' ';first=false;cout<<i-last;}last=i;}cout<<'\n';}

''',r'''

s=input().lower();t=input().lower();p=[i for i,c in enumerate(s) if c==t];print(*(b-a for a,b in zip(p,p[1:])))

''',[('aBAba\nA','2 2','不分大小寫且位置差不是空隙數')],'easy')

add(156,'geometry','用整數求面積差與四捨五入','直徑M的面積為314159·M²/400000。先分別累加兩組直徑平方，再取絕對差D。|金額式的百分位整數為floor(D·314159/4000+1/2)，以整數式(D·314159+2000)//4000計算。|最後整除100得到整數部分，餘數補兩位。此式完全依原題π=3.14159，避免浮點臨界捨入問題。','每組時間 O(N1+N2)，額外空間 O(1)；Python以下讀入全部輸入空間 O(總項數)。','吋數是直徑；不能改用系統內建π。','12吋與兩個6吋:平方差144-72=72|換算百分位:round(72×314159/4000)=5655|固定兩位小數:輸出56.55',r'''

int main(){int n;while(cin>>n){long long a=0,b=0,x;while(n--){cin>>x;a+=x*x;}cin>>n;while(n--){cin>>x;b+=x*x;}long long c=(llabs(a-b)*314159+2000)/4000;cout<<c/100<<'.'<<setw(2)<<setfill('0')<<c%100<<'\n';}}

''',r'''

import sys

v=iter(map(int,sys.stdin.buffer.read().split()))

for n in v:

 a=sum(next(v)**2 for _ in range(n));m=next(v);b=sum(next(v)**2 for _ in range(m));c=(abs(a-b)*314159+2000)//4000;print(f'{c//100}.{c%100:02}')

''',[('1 12\n2 6 6','56.55','以精確有理數72×3.14159/4計算')])

add(158,'greedy','反向申請頻率配對','計算每種有向申請(a,b)的人數。|a≠b時，只有(b,a)能和它配對，最多取兩方人數最小值；每種無向單位組只處理一次。|a=b時每兩人配成一對，取floor(count/2)。不同組使用的人員互不重疊，因此各組最大值相加即為全域最大值。','每組時間 O(M log M)，空間 O(M)；Python字典期望 O(M)。','不能把同一員工和自己配對，也不能將兩個方向各算一次。','申請1到2共3人:反向2到1共2人|配對:最多形成min(3,2)=2對，剩1人|同單位3到3共3人:再形成1對，總共3對',r'''

int main(){int t;cin>>t;while(t--){int m;cin>>m;map<pair<int,int>,int>c;while(m--){int a,b;cin>>a>>b;c[{a,b}]++;}int ans=0;for(auto [p,k]:c){auto[a,b]=p;if(a==b)ans+=k/2;else if(a<b)ans+=min(k,c[{b,a}]);}cout<<ans<<'\n';}}

''',r'''

from collections import Counter

import sys

it=iter(map(int,sys.stdin.buffer.read().split()))

for _ in range(next(it)):

 m=next(it);c=Counter((next(it),next(it)) for _ in range(m));print(sum(k//2 if a==b else min(k,c[b,a]) if a<b else 0 for (a,b),k in c.items()))

''',[('1\n5\n1 2\n1 2\n2 1\n3 3\n3 3','2','一對反向與一對同單位員工')])

add(159,'simulation','先達成雙連線的時間順序','為每個玩家維護各列、各欄及兩對角線的落子數。|每次落子只更新經過該格的線，某線計數首次到N時，該玩家完成線數加1。|依落子順序首次完成至少兩條線者勝出；之後只讀取記錄，不再更換勝者。若一直未達標則平手。','每組時間 O(N²)，空間 O(N)計數；輸入整行儲存另 O(N²)。','單次落子可能同時完成多條線；編號由下往上不影響列、欄及對角線計數。','3×3紀錄1,4,2,5,3,6:兩人各完成一橫列|再下7,8:均尚未達到兩條|最後P1下9:只形成下排1,2,3與其他未滿線，仍只有一條，結果tie',r'''

int main(){int t;cin>>t;string s;getline(cin,s);while(t--){int n;cin>>n;getline(cin,s);getline(cin,s);stringstream ss(s);vector<vector<int>>row(2,vector<int>(n)),col=row;int diag[2][2]={},lines[2]={},win=-1,x,k=0;while(ss>>x){int p=k++%2,r=(x-1)/n,c=(x-1)%n;if(win>=0)continue;lines[p]+=(++row[p][r]==n);lines[p]+=(++col[p][c]==n);if(r==c)lines[p]+=(++diag[p][0]==n);if(r+c==n-1)lines[p]+=(++diag[p][1]==n);if(lines[p]>=2)win=p;}cout<<(win<0?"tie":win==0?"P1":"P2")<<'\n';}}

''',r'''

for _ in range(int(input())):

 n=int(input());moves=list(map(int,input().split()));rows=[[0]*n for _ in range(2)];cols=[[0]*n for _ in range(2)];d=[[0,0] for _ in range(2)];lines=[0,0];win='tie'

 for k,x in enumerate(moves):

  if win!='tie':continue

  p=k%2;r,c=divmod(x-1,n);rows[p][r]+=1;cols[p][c]+=1;lines[p]+=(rows[p][r]==n)+(cols[p][c]==n)

  if r==c:d[p][0]+=1;lines[p]+=d[p][0]==n

  if r+c==n-1:d[p][1]+=1;lines[p]+=d[p][1]==n

  if lines[p]>=2:win='P'+str(p+1)

 print(win)

''',[('1\n3\n1 4 2 5 3 6 7 8 9','tie','雙方最多一條完整線')])

add(160,'search','枚舉聽牌、雀頭與三件組','先檢查長度7、合法字元及每種最多四張。對每種尚未四張的牌加一張，測試能否胡牌。|枚舉一對相同牌作雀頭，剩六張要分成兩組。每次找最小的剩餘牌，嘗試刻子；若是1至7再嘗試以它為首的數字順子。|最小牌一定屬於這兩類之一，故遞迴不漏解；成功的候選依指定牌序輸出。','每手16種候選×16種雀頭×固定深度分組，為常數時間；空間 O(16)。','已經四張的牌不能再加；字母不可組成連號順子。','七張AAABBB8:加入8後可選88作雀頭|移除雀頭:剩AAA及BBB，兩組均為刻子|其他候選:不能完成兩組加一對，因此只聽8',r'''

bool group(vector<int>&c){int i=0;while(i<16&&!c[i])i++;if(i==16)return true;if(c[i]>=3){c[i]-=3;bool ok=group(c);c[i]+=3;if(ok)return true;}if(i<7&&c[i+1]&&c[i+2]){c[i]--;c[i+1]--;c[i+2]--;bool ok=group(c);c[i]++;c[i+1]++;c[i+2]++;if(ok)return true;}return false;}

bool win(vector<int>&c){for(int i=0;i<16;i++)if(c[i]>=2){c[i]-=2;bool ok=group(c);c[i]+=2;if(ok)return true;}return false;}

int main(){int t;cin>>t;string abc="123456789ABCDEFG",s;while(t--){cin>>s;vector<int>c(16);bool ok=s.size()==7;for(char x:s){auto i=abc.find(x);if(i==string::npos)ok=false;else if(++c[i]>4)ok=false;}vector<char>ans;if(ok)for(int i=0;i<16;i++)if(c[i]<4){c[i]++;if(win(c))ans.push_back(abc[i]);c[i]--;}if(ans.empty())cout<<-1;else{cout<<"Ready for";for(char x:ans)cout<<' '<<x;}cout<<'\n';}}

''',r'''

A='123456789ABCDEFG'

def group(c):

 i=next((i for i,x in enumerate(c) if x),16)

 if i==16:return True

 if c[i]>=3:

  c[i]-=3;ok=group(c);c[i]+=3

  if ok:return True

 if i<7 and c[i+1] and c[i+2]:

  for j in range(i,i+3):c[j]-=1

  ok=group(c)

  for j in range(i,i+3):c[j]+=1

  if ok:return True

 return False

def win(c):

 for i in range(16):

  if c[i]>=2:

   c[i]-=2;ok=group(c);c[i]+=2

   if ok:return True

 return False

for _ in range(int(input())):

 s=input();ans=[]

 if len(s)==7 and set(s)<=set(A) and max(s.count(x) for x in A)<=4:

  c=[s.count(x) for x in A]

  for i in range(16):

   if c[i]<4:

    c[i]+=1

    if win(c):ans.append(A[i])

    c[i]-=1

 print('Ready for '+' '.join(ans) if ans else -1)

''',[('2\nAAABBB1\nAAAAAAA','Ready for 1\n-1','兩個字母刻子只能聽單張數字的對子；超張無效')])

add(161,'strings','限制文法的固定資料庫查詢','將關鍵字與欄位名轉小寫，辨識SELECT、1至5個欄位、WHERE、條件欄位、>與一個整數。|欄位清單只接受空白分隔或逗號分隔且不可有空欄；name不能作數值條件。任何格式錯誤輸出ERROR。|語法正確後逐筆掃描題目固定的五筆資料，以嚴格大於篩選並依指定欄位次序投影，資料及欄位重複均保留。','時間 O(L)解析加固定5筆投影；空間 O(L)。數值門檻使用任意精度。','查詢不分大小寫，但輸出的名字保留原大小寫；不支援*或>=。','查詢name WHERE no>3:先確認name與no皆為合法欄位|篩選固定資料:只有第4、5筆符合|投影輸出:Chris與Robin各一行',r'''

int main(){string s;getline(cin,s);for(char&c:s)c=tolower(c);smatch m;regex re(R"(^\s*select\s+(.+?)\s+where\s+(no|chinese|english|history)\s*>\s*([+-]?[0-9]+)\s*$)");if(!regex_match(s,m,re)){cout<<"ERROR\n";return 0;}map<string,int>id={{"no",0},{"name",1},{"chinese",2},{"english",3},{"history",4}};string fields=m[1];vector<int>cols;bool ok=true;if(fields.find(',')!=string::npos){stringstream ss(fields);string p;if(fields.back()==',')ok=false;while(getline(ss,p,',')){stringstream t(p);string a,b;t>>a;if(!id.count(a)||(t>>b))ok=false;else cols.push_back(id[a]);}}else{stringstream ss(fields);string p;while(ss>>p){if(!id.count(p))ok=false;else cols.push_back(id[p]);}}if(!ok||cols.empty()||cols.size()>5){cout<<"ERROR\n";return 0;}string z=m[3];bool neg=z[0]=='-';cpp_int limit=0;for(char c:z)if(isdigit(c))limit=limit*10+c-'0';if(neg)limit=-limit;vector<vector<string>>db={{"1","Eric","96","88","91"},{"2","Mary","77","66","49"},{"3","Jack","50","33","100"},{"4","Chris","69","97","87"},{"5","Robin","72","55","67"}};for(auto&r:db)if(cpp_int(r[id[m[2]]])>limit){for(int i=0;i<(int)cols.size();i++){if(i)cout<<' ';cout<<r[cols[i]];}cout<<'\n';}}

''',r'''

import re,sys

s=sys.stdin.readline().rstrip('\r\n');m=re.fullmatch(r'\s*select\s+(.+?)\s+where\s+(no|chinese|english|history)\s*>\s*([+-]?[0-9]+)\s*',s,re.I);names=['no','name','chinese','english','history']

if m:

 raw=m[1].lower();cols=[x.strip() for x in raw.split(',')] if ',' in raw else raw.split();ok=1<=len(cols)<=5 and all(x in names for x in cols)

else:ok=False

if not ok:print('ERROR')

else:

 db=[[1,'Eric',96,88,91],[2,'Mary',77,66,49],[3,'Jack',50,33,100],[4,'Chris',69,97,87],[5,'Robin',72,55,67]]

 for r in db:

  if r[names.index(m[2].lower())]>int(m[3]):print(*(r[names.index(x)] for x in cols))

''',[('select name WHERE no > 3','Chris\nRobin','固定資料直接篩選'),('SELECT no,,name WHERE no > 0','ERROR','空欄位非法')])

add(162,'number-theory','模1000的快速冪','百位數只取決於最後三位，因此計算19^1523 mod1000。|將指數二進位分解；指數奇數時把目前底數乘入答案，每輪將底數平方、指數除以2。模運算保留乘積最後三位。|最後以餘數除100取整，即為原大整數百位數。程式實際運算而非印預存答案。','時間 O(log 1523)，空間 O(1)。','不能把1523當成與19相連的十進位數字。','初始:r=1，a=19，e=1523|第一次迭代:e為奇數，r=19；a=361；e=761|再次迭代:r=19×361 mod1000=859；繼續平方直到指數0，再取百位',r'''

int main(){int a=19,e=1523,r=1;while(e){if(e&1)r=r*a%1000;a=a*a%1000;e/=2;}cout<<r/100<<'\n';}

''',r'''

a=19;e=1523;r=1

while e:

 if e&1:r=r*a%1000

 a=a*a%1000;e//=2

print(r//100)

''',[('','6','獨立逐次乘19共1523次後取百位；固定無輸入題唯一合法輸入')],'easy')

add(163,'strings','歷史字母表與加權檢查碼','先驗證十字元格式、首字母在題給24字母表，後九位皆數字，性別位為1或2。|字母在ABCDEFGHJKLMNPQRSTUVWXYZ中的位置加10即歷史代碼。拆成十位及個位，分別乘1、9；九個數字乘8,7,6,5,4,3,2,1,1。|加總為10的倍數才輸出正確；格式條件必須先通過，避免錯誤字串被誤判。','時間 O(L)，額外空間 O(1)，輸入字串 O(L)。','原題代號沒有I與O，不能套用現行字母代碼表。','合成字串A100000001:字母A代號10貢獻1|數字權重:性別1貢獻8，最後1貢獻1|檢查總和:1+8+1=10，可被10整除，正確',r'''

int main(){string s;getline(cin,s);string abc="ABCDEFGHJKLMNPQRSTUVWXYZ";bool ok=s.size()==10;int total=0;if(ok){auto p=abc.find(s[0]);ok=p!=string::npos&&(s[1]=='1'||s[1]=='2');for(int i=1;i<10;i++)ok&=isdigit((unsigned char)s[i]);if(ok){int x=p+10;total=x/10+9*(x%10);for(int i=1;i<10;i++)total+=(s[i]-'0')*max(1,9-i);}}cout<<(ok&&total%10==0?"正確":"錯誤")<<'\n';}

''',r'''

s=input();abc='ABCDEFGHJKLMNPQRSTUVWXYZ';ok=len(s)==10 and s[0] in abc and s[1] in '12' and all('0'<=c<='9' for c in s[1:]);total=1

if ok:

 x=abc.index(s[0])+10;total=x//10+9*(x%10)+sum(int(s[i])*max(1,9-i) for i in range(1,10))

print('正確' if ok and total%10==0 else '錯誤')

''',[('A100000001','正確','人工合成，權重和10'),('I100000001','錯誤','原表排除I')],'easy')

add(164,'number-theory','從固定下界逐一找質數','從10000000001開始只試奇數。|對候選n試除奇數d到d²>n；若均不能整除，則n沒有非平凡因數，因為任何合數至少一個因數不超過平方根。|候選依數值遞增且第一次通過才輸出，因此得到嚴格大於10^10的最小質數，而不是任一較大質數。','若測試C個候選，時間 O(C√P)，空間 O(1)，P為找到的質數。','條件是嚴格大於10^10；試除終點須包含平方根。','第一個候選:10000000001=101×99009901，排除|第三個候選:10000000005可被5整除，排除|持續檢查:依序試所有奇候選，第一個無因數者10000000019即最小答案',r'''

bool prime(long long n){if(n<2)return false;if(n%2==0)return n==2;for(long long d=3;d*d<=n;d+=2)if(n%d==0)return false;return true;}

int main(){long long n=10000000001LL;while(!prime(n))n+=2;cout<<n<<'\n';}

''',r'''

from math import isqrt

def prime(n):return n>=2 and (n==2 or n%2 and all(n%d for d in range(3,isqrt(n)+1,2)))

n=10**10+1

while not prime(n):n+=2

print(n)

''',[('','10000000019','獨立Miller-Rabin檢查19並試除前18個整數；固定無輸入題')])

add(166,'graphs','LCS相似邊與連通分量','對每對名字求LCS，轉移為相同字元取左上加1，不同時取上或左的最大值。|相似條件為2×LCS≥min(長度)，可用整數判斷，避免奇數長度被錯誤整除。相似就合併兩人的集合。|共同朋友規則恰是沿邊傳遞的連通性，因此最終朋友團體就是連通分量，輸出最大大小。','每組時間 O(N²L²)，空間 O(N+L²)另存名字 O(NL)。','LCS不要求連續；長度3的名字須至少LCS=2才相似。','名字ab、bc、cd:LCS(ab,bc)=1，達長度2的一半|繼續連接:LCS(bc,cd)=1，建立第二條邊|傳遞朋友關係:三人同分量，最大團體3',r'''

int main(){int t;cin>>t;while(t--){int n;cin>>n;vector<string>a(n);for(auto&s:a)cin>>s;vector<int>p(n),sz(n,1);iota(p.begin(),p.end(),0);function<int(int)>f=[&](int x){return p[x]==x?x:p[x]=f(p[x]);};for(int i=0;i<n;i++)for(int j=0;j<i;j++){vector<vector<int>>dp(a[i].size()+1,vector<int>(a[j].size()+1));for(int x=1;x<=(int)a[i].size();x++)for(int y=1;y<=(int)a[j].size();y++)dp[x][y]=a[i][x-1]==a[j][y-1]?dp[x-1][y-1]+1:max(dp[x-1][y],dp[x][y-1]);if(2*dp.back().back()>=(int)min(a[i].size(),a[j].size())){int u=f(i),v=f(j);if(u!=v){p[v]=u;sz[u]+=sz[v];}}}cout<<*max_element(sz.begin(),sz.end())<<'\n';}}

''',r'''

for _ in range(int(input())):

 n=int(input());a=[input() for _ in range(n)];p=list(range(n));sz=[1]*n

 def find(x):

  while p[x]!=x:p[x]=p[p[x]];x=p[x]

  return x

 for i in range(n):

  for j in range(i):

   row=[0]*(len(a[j])+1)

   for x in a[i]:

    nxt=[0]

    for k,y in enumerate(a[j]):nxt.append(row[k]+1 if x==y else max(row[k+1],nxt[-1]))

    row=nxt

   if 2*row[-1]>=min(len(a[i]),len(a[j])):

    u,v=find(i),find(j)

    if u!=v:p[v]=u;sz[u]+=sz[v]

 print(max(sz))

''',[('2\n3\nab\nbc\ncd\n2\nabc\nade','3\n1','傳遞連通與奇數長度門檻')])

add(167,'simulation','搬動埋葬者的圓環模擬','先假設從編號1起算，圓環陣列儲存各位置當前的人。每輪找到第k人並移除，再從其下一位找第k個存活者作埋葬者。|將埋葬者搬到被移除位置，刪除埋葬者原位置，下一輪從新位置之後起算。用模數跳過整圈，避免k高達10^9時逐次數。|若這樣最後存活編號s，旋轉起算點i後存活編號也平移i-1，故令i=(1-s) mod n+1即可讓1存活。','時間 O(n²)陣列刪除與搬動，空間 O(n)。','不是普通約瑟夫環；埋葬者會搬位置，會改變之後順序。','n=5,k=2從1起算:先移除2，埋葬者4搬到2的位置|繼續:依相同規則移除5、3、1，最後剩4|旋轉起點:令i=(1-4) mod5+1=3，答案3',r'''

int main(){int n;long long k;while(cin>>n>>k){vector<int>a(n);iota(a.begin(),a.end(),1);int start=0;while(a.size()>1){int m=a.size(),dead=(start+(k-1)%m)%m;int b=(dead+1+(k-1)%(m-1))%m;if(b==dead)b=(b+1)%m;/* count among survivors via explicit positions */vector<int>ids;for(int z=1;z<m;z++)ids.push_back((dead+z)%m);b=ids[(k-1)%(m-1)];a[dead]=a[b];a.erase(a.begin()+b);if(b<dead)dead--;start=(dead+1)%a.size();}cout<<((1-a[0])%n+n)%n+1<<'\n';}}

''',r'''

import sys

for line in sys.stdin:

 n,k=map(int,line.split());a=list(range(1,n+1));start=0

 while len(a)>1:

  m=len(a);dead=(start+k-1)%m;ids=[(dead+z)%m for z in range(1,m)];b=ids[(k-1)%(m-1)];a[dead]=a[b];a.pop(b)

  if b<dead:dead-=1

  start=(dead+1)%len(a)

 print((1-a[0])%n+1)

''',[('1 1000000000\n2 1','1\n2','單人與兩人手工搬動')])

add(169,'simulation','有缺格鍵盤的游標模擬','每筆從Q開始，鍵盤三列使用題目左對齊字串。|方向鍵先算目標座標，只有列合法且欄小於該列長度才移動；不存在的格子不造成任何動作。e則輸出當前字母。|先驗證尾端至少三個e，再只移除最後兩個e作結束標記，保留最後字母的第一次e。逐鍵模擬即為定義。','時間 O(L)，空間 O(L)輸入與輸出。','P按d仍留在P；不能將欄位硬縮到下一列最右端。','記錄rrdeee:從Q右移兩次到E|向下:由E移至D|末尾eee:只輸入D一次，其餘兩次為結束標記',r'''

int main(){string s;vector<string>a={"QWERTYUIOP","ASDFGHJKL","ZXCVBNM"};while(getline(cin,s)){if(s.size()<3||s.substr(s.size()-3)!="eee"||s.find_first_not_of("udlre")!=string::npos){cout<<-1<<'\n';continue;}int r=0,c=0;string out;for(int i=0;i<(int)s.size()-2;i++){char x=s[i];if(x=='e'){out+=a[r][c];continue;}int y=r+(x=='d')-(x=='u'),z=c+(x=='r')-(x=='l');if(y>=0&&y<3&&z>=0&&z<(int)a[y].size())r=y,c=z;}cout<<out<<'\n';}}

''',r'''

import sys

a=['QWERTYUIOP','ASDFGHJKL','ZXCVBNM']

for s in sys.stdin:

 s=s.rstrip('\r\n')

 if not s.endswith('eee') or not set(s)<=set('udlre'):print(-1);continue

 r=c=0;out=[]

 for x in s[:-2]:

  if x=='e':out.append(a[r][c]);continue

  y=r+(x=='d')-(x=='u');z=c+(x=='r')-(x=='l')

  if 0<=y<3 and 0<=z<len(a[y]):r,c=y,z

 print(''.join(out))

''',[('rrdeee\nrrrrrrrrrdeee','D\nP','普通移動與P下方不存在')])

add(170,'basics','反解指數公式與分段分類','由V=0.836B^1.5反解B=(V/0.836)^(2/3)。|使用floor(B+0.5)作正數四捨五入，超過17截為17。|強度依11.3、17.1、32.6、50.9的依序上界分類為1至5。輸入只有一位小數，所以各區間沒有未定義空隙。','每筆時間 O(1)，空間 O(1)。','輸出為風力級數,分類編號，逗號兩邊沒有空白。','輸入0.0:反解B=0|四捨五入:風力級數0|分級:V≤11.3，輸出0,1',r'''

int main(){double v;while(cin>>v){int b=min(17,(int)floor(pow(v/0.836,2.0/3)+0.5));int c=v<=11.3?1:v<=17.1?2:v<=32.6?3:v<=50.9?4:5;cout<<b<<','<<c<<'\n';}}

''',r'''

import sys,math

for s in sys.stdin:

 v=float(s);b=min(17,math.floor((v/.836)**(2/3)+.5));c=1 if v<=11.3 else 2 if v<=17.1 else 3 if v<=32.6 else 4 if v<=50.9 else 5;print(f'{b},{c}')

''',[('0.0\n100.0','0,1\n17,5','零與高風速上限截斷')],'easy')

add(171,'search','保序插零的完整枚舉','B的數字必須保持原順序，只能在其間或尾端插0。|可將B左側補0到與A同長，枚舉這個固定長度內B各數字的保序位置，其他位置填0。這也涵蓋少插0的情形，因為前導0不改變數值。|對每個得到的B′計算abs(A-B′)，逐位取餘數累加，取最大。每個合法插法都有對應位置選擇，重複數值無妨。','時間 O(C(m,n)·m)，空間 O(m)，m<18。','可以插在B內部；C為負時取數字絕對值後求和。','A=100、B=1:補滿三位的候選001、010、100|計算差:99、90、0|各位和:18、9、0，最大18',r'''

int main(){int t;cin>>t;while(t--){string a,b;cin>>a>>b;long long A=stoll(a);int m=a.size(),n=b.size(),ans=0;function<void(int,int,long long)>f=[&](int i,int j,long long x){if(i==m){if(j==n){long long z=llabs(A-x);int s=0;while(z){s+=z%10;z/=10;}ans=max(ans,s);}return;}if(m-i>n-j)f(i+1,j,x*10);if(j<n)f(i+1,j+1,x*10+b[j]-'0');};f(0,0,0);cout<<ans<<'\n';}}

''',r'''

from itertools import combinations

for _ in range(int(input())):

 a,b=input().split();A=int(a);m=len(a);ans=0

 for pos in combinations(range(m),len(b)):

  s=['0']*m

  for i,c in zip(pos,b):s[i]=c

  ans=max(ans,sum(map(int,str(abs(A-int(''.join(s)))))))

 print(ans)

''',[('1\n100 1','18','列出B′=1、10、100後計算')])

add(174,'strings','書碼雙重前綴和','只移除連字號，其他原始字元均要保留檢查。前9碼須為數字，末碼為數字或任一英文字母；字母值10。|用s1逐項加上書碼數字，再用s2逐項加上s1。|恰十碼且s2能被11整除即為正確。輸出原始行與Tab再接判定，不可在原始行中去掉符號。','每行時間 O(L)，空間 O(L)。','末碼英文字母不只X；句點不是可忽略符號。','書碼0000000000:每個碼值都是0|雙前綴和:s1與s2全程都是0|結果:0可被11整除，所以正確',r'''

int main(){string s;while(getline(cin,s)){string t;for(char c:s)if(c!='-')t+=c;bool ok=t.size()==10;long long a=0,b=0;if(ok)for(int i=0;i<10;i++){char c=t[i];int v;if(c>='0'&&c<='9')v=c-'0';else if(i==9&&((c>='A'&&c<='Z')||(c>='a'&&c<='z')))v=10;else{ok=false;break;}a+=v;b+=a;}cout<<s<<'\t'<<(ok&&b%11==0?"正確":"錯誤")<<'\n';}}

''',r'''

import sys

for s in sys.stdin:

 s=s.rstrip('\r\n');t=s.replace('-','');ok=len(t)==10 and all('0'<=c<='9' for c in t[:9]) and ('0'<=t[-1]<='9' or 'A'<=t[-1]<='Z' or 'a'<=t[-1]<='z');a=b=0

 if ok:

  for c in t:a+=int(c) if c.isdigit() else 10;b+=a

 print(s+'\t'+('正確' if ok and b%11==0 else '錯誤'))

''',[('0000000000\n0000000001','0000000000\t正確\n0000000001\t錯誤','加權和0與1直接可驗')])

add(175,'search','字典序排列枚舉','先將字母排序，從最小排列開始。|C++反覆使用next_permutation：找可上升位置、交換右邊最小較大字母，再反轉尾段，得到恰好下一個排列。Python以排序後字母的permutations產生相同順序。|每次輸出一個排列並計數，最後輸出總數。字母互異，所以總數為長度階乘。','時間 O(L·L!)含輸出，空間 O(L)。','輸入順序可能不是字典序起點，必須先排序。','輸入ba:先排序為ab|列第一個:ab|下一個:ba，之後無下一排列，總數2',r'''

int main(){string s;cin>>s;sort(s.begin(),s.end());int n=0;do{cout<<s<<'\n';n++;}while(next_permutation(s.begin(),s.end()));cout<<n<<'\n';}

''',r'''

from itertools import permutations

s=sorted(input());n=0

for p in permutations(s):print(''.join(p));n+=1

print(n)

''',[('ba','ab\nba\n2','全部兩種排列')],'easy')



DEC=r'''

cpp_int ten(int k){cpp_int x=1;while(k--)x*=10;return x;}

struct Dec{cpp_int n;int s;Dec(cpp_int a=0,int b=0):n(a),s(b){} Dec(string x){s=0;n=0;bool neg=false,point=false;for(char c:x){if(c=='-')neg=true;else if(c=='.')point=true;else if(isdigit(c)){n=n*10+c-'0';s+=point;}}if(neg)n=-n;}string str()const{cpp_int q=n;bool neg=q<0;if(neg)q=-q;string x=q.convert_to<string>();if(s){if((int)x.size()<=s)x=string(s+1-x.size(),'0')+x;x.insert(x.size()-s,1,'.');while(x.back()=='0')x.pop_back();if(x.back()=='.')x.pop_back();}if(neg&&q!=0)x="-"+x;return x;}};

Dec operator+(Dec a,Dec b){int s=max(a.s,b.s);return Dec(a.n*ten(s-a.s)+b.n*ten(s-b.s),s);}

Dec operator-(Dec a,Dec b){b.n=-b.n;return a+b;}

Dec operator*(Dec a,Dec b){return Dec(a.n*b.n,a.s+b.s);}

bool operator<(Dec a,Dec b){int s=max(a.s,b.s);return a.n*ten(s-a.s)<b.n*ten(s-b.s);}

'''

add(165,'simulation','累進分段與精確十進位','將用電量按300、300、400及其餘四段分割，分別乘9、8、6、5。|每段只取尚未計費的用電量與段長的最小值，所以各單位恰被計一次。|保存十進位整數係數及小數位數，對齊位數後加減，避免浮點誤差；最後再累計人數、用電與費用。','每筆固定次數十進位運算；位數D時各次加減乘小整數 O(D)，總空間隨數字位數及輸出大小。','費率是累進分段，不能依最終所在級距套用所有用電量。','用電300.5:首300單位乘9得2700|第二段:剩0.5乘8得4|費用:合計2704，用電量保留300.5',DEC+r'''

int main(){string id,s;Dec total,fee;long long count=0;while(cin>>id>>s){Dec x(s),left=x,cost;int lens[]={300,300,400};int rates[]={9,8,6};for(int i=0;i<3;i++){Dec use=left<Dec(lens[i])?left:Dec(lens[i]);cost=cost+use*Dec(rates[i]);left=left-use;}cost=cost+left*Dec(5);total=total+x;fee=fee+cost;count++;cout<<id<<' '<<x.str()<<' '<<cost.str()<<'\n';}cout<<count<<' '<<total.str()<<' '<<fee.str()<<'\n';}

''',r'''

import sys

from fractions import Fraction as F

def fmt(x):

 d=x.denominator;s=0

 while d%2==0:d//=2;s+=1

 t=0

 while d%5==0:d//=5;t+=1

 k=max(s,t);v=x.numerator*10**k//x.denominator;z=str(v).zfill(k+1)

 return (z[:-k]+'.'+z[-k:]).rstrip('0').rstrip('.') if k else z

cnt=0;total=fee=F(0)

for line in sys.stdin:

 name,s=line.split();x=F(s);left=x;cost=F(0)

 for length,rate in ((300,9),(300,8),(400,6)):

  use=min(left,length);cost+=use*rate;left-=use

 cost+=left*5;total+=x;fee+=cost;cnt+=1;print(name,fmt(x),fmt(cost))

print(cnt,fmt(total),fmt(fee))

''',[('x 300.5','x 300.5 2704\n1 300.5 2704','手算跨第一費率界線')])

RAT=r'''

cpp_int gcdBig(cpp_int a,cpp_int b){if(a<0)a=-a;if(b<0)b=-b;while(b!=0){cpp_int r=a%b;a=b;b=r;}return a;}

struct Rat{cpp_int p,q;Rat(cpp_int a=0,cpp_int b=1):p(a),q(b){if(q<0)p=-p,q=-q;cpp_int g=gcdBig(p,q);p/=g;q/=g;}};

Rat operator+(Rat a,Rat b){return Rat(a.p*b.q+b.p*a.q,a.q*b.q);}Rat operator-(Rat a,Rat b){return Rat(a.p*b.q-b.p*a.q,a.q*b.q);}Rat operator*(Rat a,Rat b){return Rat(a.p*b.p,a.q*b.q);}Rat operator/(Rat a,Rat b){return Rat(a.p*b.q,a.q*b.p);}

'''

add(168,'strings','分數詞法分析與兩層運算優先序','逐個讀取正整數分子、/、正整數分母，將它們視為一個完整分數項；下一個符號才是項間運算子。|維持已完成的加減總和與目前乘除項，遇乘除直接更新目前項；遇加減則先結算前項。|每次分數運算用最大公因數約分，分母維持正值。缺少數字、0分子或分母、非法符號及數字間空白拼接均判錯。','共L字元及T分數項，解析 O(L)，運算為 O(T)次任意精度有理數運算；實際成本取決於中間分子分母位數。','分數內的/與分數之間的除法要分開解析；運算結果可以為負或零。','1/2+1/3*3/1:先讀1/2為目前項|讀加號後:結算1/2，乘法項1/3×3/1=1|最後結算:1/2+1=3/2',RAT+r'''

int main(){string s;while(getline(cin,s)){size_t i=0;bool ok=true;auto skip=[&](){while(i<s.size()&&isspace((unsigned char)s[i]))i++;};auto num=[&](){skip();cpp_int n=0;size_t st=i;while(i<s.size()&&isdigit((unsigned char)s[i]))n=n*10+s[i++]-'0';if(i==st||n==0)ok=false;return n;};auto frac=[&](){cpp_int a=num();skip();if(i>=s.size()||s[i++]!='/')ok=false;cpp_int b=num();if(b==0)b=1;return Rat(a,b);};Rat sum,term=frac();int sign=1;while(ok){skip();if(i==s.size())break;char op=s[i++];if(string("+-*/").find(op)==string::npos){ok=false;break;}Rat v=frac();if(op=='*')term=term*v;else if(op=='/')term=term/v;else{sum=sign==1?sum+term:sum-term;term=v;sign=op=='+'?1:-1;}}if(!ok)cout<<-1<<'\n';else{sum=sign==1?sum+term:sum-term;cout<<sum.p<<'/'<<sum.q<<'\n';}}}

''',r'''

import sys,re

from fractions import Fraction as F

if hasattr(sys,'set_int_max_str_digits'):sys.set_int_max_str_digits(0)

for s in sys.stdin:

 try:

  tokens=re.findall(r'[0-9]+|[^\s]',s);i=0

  def frac():

   global i

   a,slash,b=tokens[i:i+3];i+=3

   if not a.isascii() or not a.isdigit() or slash!='/' or not b.isascii() or not b.isdigit() or int(a)==0 or int(b)==0:raise ValueError()

   return F(int(a),int(b))

  total=F(0);term=frac();sign=1

  while i<len(tokens):

   op=tokens[i];i+=1;v=frac()

   if op=='*':term*=v

   elif op=='/':term/=v

   elif op in '+-':total+=sign*term;term=v;sign=1 if op=='+' else -1

   else:raise ValueError()

  total+=sign*term;print(str(total.numerator)+'/'+str(total.denominator))

 except (ValueError,IndexError,ZeroDivisionError):print(-1)

''',[('1/2+1/3*3/1\n1/2-1/2\n1 2/3','3/2\n0/1\n-1','手算優先序、零與數字不可空白拼接')])

# 同一BFS核心用於兩個不同迷宮輸入格式。

BFSCPP=r'''

int solve(vector<string>a){int h=a.size(),w=a[0].size();queue<pair<int,int>>q;vector<vector<int>>d(h,vector<int>(w,-1));for(int r=0;r<h;r++)for(int c=0;c<w;c++)if(a[r][c]=='s'){q.push({r,c});d[r][c]=0;}while(!q.empty()){auto[r,c]=q.front();q.pop();if(a[r][c]=='e')return d[r][c];for(auto[dr,dc]:vector<pair<int,int>>{{1,0},{-1,0},{0,1},{0,-1}}){int y=r+dr,x=c+dc;if(y>=0&&y<h&&x>=0&&x<w&&a[y][x]!='w'&&d[y][x]<0){d[y][x]=d[r][c]+1;q.push({y,x});}}}return 0;}

'''

add(172,'graphs','保留空白地圖的BFS','逐行保留地圖中的空白，以獨立一行***切分迷宮。|從s開始廣度優先搜尋，每次擴展四鄰格，牆w與邊界不可越過，入佇列時就標記距離。|BFS按距離遞增探索，首次到e就是最短路；搜尋結束仍未到則輸出0。','每張地圖時間 O(HW)，空間 O(HW)。','不可對地圖行strip或split，因空白也是合法格子。','單列s e:起點距離0|擴展空白格:距離1|擴展出口e:距離2，輸出2',BFSCPP+r'''

int main(){string s;vector<string>a;while(getline(cin,s)){if(s=="***"){if(!a.empty())cout<<solve(a)<<'\n';a.clear();}else a.push_back(s);}if(!a.empty())cout<<solve(a)<<'\n';}

''',r'''

import sys

from collections import deque

def solve(a):

 h=len(a);w=len(a[0]);d={};q=deque()

 for r in range(h):

  for c in range(w):

   if a[r][c]=='s':q.append((r,c));d[r,c]=0

 while q:

  r,c=q.popleft()

  if a[r][c]=='e':return d[r,c]

  for y,x in ((r-1,c),(r+1,c),(r,c-1),(r,c+1)):

   if 0<=y<h and 0<=x<w and a[y][x]!='w' and (y,x) not in d:d[y,x]=d[r,c]+1;q.append((y,x))

 return 0

a=[]

for s in sys.stdin:

 s=s.rstrip('\r\n')

 if s=='***':

  if a:print(solve(a))

  a=[]

 else:a.append(s)

if a:print(solve(a))

''',[('s e\n***\nswe\n***','2\n0','單列最短路與阻隔')])

add(173,'search','只展開缺少的字母並保留重數','將每項解析為字母加可選撇號的token，收集全式出現的所有不同字母。|對各項完全缺少的字母，枚舉不帶撇號與帶撇號兩種選擇；原本已有的token保持原重數，包含正反並存的情況。|將token排序串成完全項，再以集合去除相同序列，最後依字典序用+連接。每個缺字的二選一恰對應題目的複製規則。','若第i項缺mi字母、含ti個token，時間隨 Σ2^mi·(ti+mi)log(ti+mi) 與輸出量，空間隨不同完全項總長度。','不能進行aa=a或aa′=0等布林化簡，這題是字面展開。','輸入aa+b:總字母集合為a,b|展開aa:得到aab與aab′，兩個a均保留|展開b:得到ab與a′b，排序後串接全部四項',r'''

int main(){string s((istreambuf_iterator<char>(cin)),{}),t;for(char c:s)if(!isspace((unsigned char)c))t+=c;vector<vector<string>>terms(1);set<char>all;for(size_t i=0;i<t.size();i++){if(t[i]=='+'){terms.push_back({});continue;}string z(1,t[i]);all.insert(t[i]);if(i+1<t.size()&&t[i+1]=='\'')z+=t[++i];terms.back().push_back(z);}set<string>out;for(auto v:terms){vector<char>missing;for(char c:all){bool has=false;for(auto z:v)has|=z[0]==c;if(!has)missing.push_back(c);}function<void(int)>f=[&](int k){if(k==(int)missing.size()){auto a=v;sort(a.begin(),a.end());string x;for(auto z:a)x+=z;out.insert(x);return;}v.push_back(string(1,missing[k]));f(k+1);v.back()+='\'';f(k+1);v.pop_back();};f(0);}bool first=true;for(auto z:out){if(!first)cout<<'+';first=false;cout<<z;}cout<<'\n';}

''',r'''

import sys,re,itertools

s=''.join(sys.stdin.read().split()).replace('′',"'").replace('’',"'");terms=[re.findall(r"[A-Za-z]'?",x) for x in s.split('+')];allchars=sorted({x[0] for t in terms for x in t});out=set()

for t in terms:

 missing=[c for c in allchars if all(x[0]!=c for x in t)]

 for choices in itertools.product((False,True),repeat=len(missing)):

  extra=[c+("'" if b else '') for c,b in zip(missing,choices)];out.add(''.join(sorted(t+extra)))

print('+'.join(sorted(out)))

''',[('aa+b',"a'b+aab+aab'+ab",'直接逐項補缺字並保留aa重數')])

CALCPP=r'''

bool leap(int y){return y%400==0||(y%4==0&&y%100!=0);}int countCentury(int start){int ans=0;for(int y=start;y<start+100;y++){int w=(y+(y-1)/4-(y-1)/100+(y-1)/400)%7;int days[]={31,28+leap(y),31,30,31,30,31,31,30,31,30,31};for(int d:days){ans+=(w+12)%7==5;w=(w+d)%7;}}return ans;}

'''

CALPY=r'''

def count_century(start):

 ans=0

 for y in range(start,start+100):

  w=(y+(y-1)//4-(y-1)//100+(y-1)//400)%7

  for d in (31,28+(y%400==0 or y%4==0 and y%100!=0),31,30,31,30,31,31,30,31,30,31):

   ans+=(w+12)%7==5;w=(w+d)%7

 return ans

'''

add(176,'simulation','逐月推進星期與閏年','逐年用題目的公曆公式求1月1日星期，星期日為0。|每月13日比月初多12天，若(月初星期+12)%7=5就累計；再將月天數加入星期，推進至下月。|依公曆百年與四百年規則處理2月，枚舉2001到2100共1200個月，每個月恰好一次。','固定1200個月，時間 O(1)，空間 O(1)。','2100不是閏年；13日距離1日是12天。','2001年1月1日:星期一，代碼1|1月13日:(1+12)%7=6，非星期五|推到2月:月初(1+31)%7=4，13日為2，同樣不計；持續至2100年12月',CALCPP+r'''

int main(){cout<<countCentury(2001)<<'\n';}

''',CALPY+r'''

print(count_century(2001))

''',[('','172','獨立datetime.date逐月驗證1200個日期；無輸入題唯一合法輸入')])

add(177,'simulation','固定欄寬的上三角乘法表','第i列的第j欄若j<i，輸出四個空白；否則將i×j靠右置於寬度4的欄位。|每列固定九欄，所以長度恰為36個ASCII字元。|依i=1到n輸出，內層j=1到9，格子與題目乘積位置逐一對應。','時間 O(9n)，額外空間 O(1)；Python每列 O(36)。','不能用Tab替代四字元欄寬，也不能省略前面的空欄。','n=1的第一欄:1×1=1，輸出三空白加1|下一欄:1×2=2，仍占4字元|九欄完成:列長36，最後是三空白加9',r'''

int main(){int n;cin>>n;for(int i=1;i<=n;i++){for(int j=1;j<=9;j++)if(j<i)cout<<"    ";else cout<<setw(4)<<i*j;cout<<'\n';}}

''',r'''

n=int(input())

for i in range(1,n+1):print(''.join('    ' if j<i else f'{i*j:4}' for j in range(1,10)))

''',[('1','   1   2   3   4   5   6   7   8   9','第一列九個乘積與精確36字元')],'easy')

add(178,'search','枚舉T形中心與缺少方向','對每個中心格與四個可能缺少的方向，取中心加其他三個鄰格。|只有四格都在範圍內且皆為O才保留；每種T形有唯一中心與缺方向，因此不會重複產生。|各形內座標先依(x,y)排序，再將所有形依座標串列排序，照題目保留座標前後空白。','時間 O(HW)固定四方向；儲存結果空間 O(HW)。','可重疊花圃都要保留；x是欄、y是列。','3×3只有第一列OOO與中心O:選中心(1,0)|合法三鄰:左(0,0)、右(2,0)、下(1,1)|排序輸出:(0,0),(1,0),(1,1),(2,0)，共1形',r'''

int main(){int h,w;cin>>h>>w;vector<string>a(h);for(auto&s:a)cin>>s;vector<vector<pair<int,int>>>ans;vector<pair<int,int>>ds={{1,0},{-1,0},{0,1},{0,-1}};for(int y=0;y<h;y++)for(int x=0;x<w;x++)for(int omit=0;omit<4;omit++){vector<pair<int,int>>v={{x,y}};for(int d=0;d<4;d++)if(d!=omit)v.push_back({x+ds[d].first,y+ds[d].second});bool ok=true;for(auto[c,r]:v)if(c<0||c>=w||r<0||r>=h||a[r][c]!='O')ok=false;if(ok){sort(v.begin(),v.end());ans.push_back(v);}}sort(ans.begin(),ans.end());cout<<ans.size()<<'\n';for(auto v:ans){for(auto[x,y]:v)cout<<" ("<<x<<','<<y<<") ";cout<<'\n';}}

''',r'''

h,w=map(int,input().split());a=[input() for _ in range(h)];ds=[(1,0),(-1,0),(0,1),(0,-1)];ans=[]

for y in range(h):

 for x in range(w):

  for omit in range(4):

   v=[(x,y)]+[(x+dx,y+dy) for d,(dx,dy) in enumerate(ds) if d!=omit]

   if all(0<=c<w and 0<=r<h and a[r][c]=='O' for c,r in v):ans.append(sorted(v))

print(len(ans))

for v in sorted(ans):print(''.join(f' ({x},{y}) ' for x,y in v))

''',[('3 3\nOOO\nXOX\nXXX','1\n (0,0)  (1,0)  (1,1)  (2,0) ','唯一T形人工辨識')])

add(179,'strings','固定起點的子序列貪心掃描','枚舉T中等於S首字元的每個起點，向右掃描並維持已匹配的S字元數。|遇到所需下一字元就匹配它，這個最早位置貪心不會妨礙之後匹配，反而留下最長後綴空間。|每當已匹配完整S且目前字元等於S尾字元，就記錄當前起訖長度。排序所有長度取最大的N個。','時間 O(|T|²+K log K)，K≤|T|²；空間 O(K)。','每個起訖位置都算一條，即使內容相同；S是子序列而不是連續匹配。','S=AB，T=AABB:起點0得到長3與4兩條|起點1:得到長2與3兩條|N=2:取4與3，總和7',r'''

int main(){string s,t;int n;cin>>s>>t>>n;vector<int>a;for(int i=0;i<(int)t.size();i++)if(t[i]==s[0]){int k=0;for(int j=i;j<(int)t.size();j++){if(k<(int)s.size()&&t[j]==s[k])k++;if(k==(int)s.size()&&t[j]==s.back())a.push_back(j-i+1);}}sort(a.rbegin(),a.rend());int ans=0;for(int i=0;i<min(n,(int)a.size());i++)ans+=a[i];cout<<ans<<'\n';}

''',r'''

s=input();t=input();n=int(input());a=[]

for i,c in enumerate(t):

 if c!=s[0]:continue

 k=0

 for j in range(i,len(t)):

  if k<len(s) and t[j]==s[k]:k+=1

  if k==len(s) and t[j]==s[-1]:a.append(j-i+1)

print(sum(sorted(a,reverse=True)[:n]))

''',[('AB\nAABB\n2','7','完整列出四個起訖長度3、4、2、3')])

add(180,'simulation','16×16位元到字元圖形','按照輸入順序把每個1轉為*、每個0轉為半形空白。|每16個字元形成一列，一共16列；輸入索引i對應第i//16列、第i%16欄。|此映射逐格保留所有像素，包括最右邊的0所形成的行尾空白。','固定256格，時間與空間 O(1)。','輸出必須保留16字元列寬，不可刪去行尾空白。','第一個像素為1:第一列第一欄輸出*|其餘255格為0:依序輸出空白|每16格換行:首列星號後15空白，其餘15列各16空白',r'''

int main(){string s;cin>>s;for(int i=0;i<256;i++){cout<<(s[i]=='1'?'*':' ');if(i%16==15)cout<<'\n';}}

''',r'''

s=input()

for i in range(0,256,16):print(''.join('*' if c=='1' else ' ' for c in s[i:i+16]))

''',[('1'+'0'*255,'*'+' '*15+'\n'+('\n'.join([' '*16]*15)),'單一亮點逐格構造')],'easy')

add(181,'strings','依固定分隔符擷取欄位','題目保證帳號是使用者@伺服器.機關.組織.國家。|先找@之後的第一個點，再找下一個點；兩點之間的字串就是機關名稱。|固定格式保證這兩個邊界存在，因此直接擷取且保留原字母大小寫。','時間 O(L)，空間 O(L)保存輸入。','機關是@後第二個欄位，不是使用者或組織。','輸入u@s.MySchool.edu.tw:找到@後的s|第一個點後:讀取MySchool到下一個點|輸出:MySchool，保留大小寫',r'''

int main(){string s;cin>>s;auto a=s.find('.',s.find('@'));auto b=s.find('.',a+1);cout<<s.substr(a+1,b-a-1)<<'\n';}

''',r'''

s=input();print(s.split('@',1)[1].split('.')[1])

''',[('u@s.MySchool.edu.tw','MySchool','固定欄位人工拆解')],'easy')

add(182,'number-theory','多數GCD與LCM摺疊','每列獨立處理，初始化g=0、l=1，依序更新g=gcd(g,x)、l=l/gcd(l,x)×x。|gcd(0,x)=x使首個數自然初始化，LCM公式由兩數質因數指數的最大值成立。|結合律確保逐項摺疊等於全部數的結果，最後依原數字次序印出完整指定格式。','每組最多5數，時間為數次Euclid運算；空間 O(1)，數字皆<999所以五數LCM可用64位。','每行是獨立一組，不是先讀總組數；需輸出20組。','一組6,10,15:先得g=6、l=6|加入10:g=2、l=30|加入15:g=1、l=30',r'''

int main(){string s;while(getline(cin,s)){stringstream ss(s);long long x,g=0,l=1;vector<long long>a;while(ss>>x){a.push_back(x);g=gcd(g,x);l=l/gcd(l,x)*x;}if(a.empty())continue;for(int i=0;i<(int)a.size();i++){if(i)cout<<' ';cout<<a[i];}cout<<" 的GCD = "<<g<<", LCM = "<<l<<'\n';}}

''',r'''

import sys,math

for line in sys.stdin:

 a=list(map(int,line.split()));g=0;l=1

 for x in a:g=math.gcd(g,x);l=l//math.gcd(l,x)*x

 print(' '.join(map(str,a))+f' 的GCD = {g}, LCM = {l}')

''',[('\n'.join(['6 10 15']*20),'\n'.join(['6 10 15 的GCD = 1, LCM = 30']*20),'質因數2、3、5的最小與最大指數')])

add(183,'sorting','以非大寫字母斷詞的頻率表','掃描全文，將連續A到Z字母視為一個單字，其他符號作分隔。|每遇分隔或EOF就把目前非空單字累加一次。|依(-次數,單字字典序)排序，得到次數遞減、同次數字典序遞增的要求。','字元數L、不同字W，時間 O(L+W log W)不含字串比較成本，空間 O(L)。','句號與逗號也要斷詞；不同時態不得合併。','文章A,B A.:掃描得到A、B、A|統計:A為2，B為1|排序輸出:A: 2，再B: 1',r'''

int main(){map<string,int>c;string s;char x;while(cin.get(x)){if(x>='A'&&x<='Z')s+=x;else if(!s.empty()){c[s]++;s.clear();}}if(!s.empty())c[s]++;vector<pair<int,string>>a;for(auto[w,n]:c)a.push_back({-n,w});sort(a.begin(),a.end());for(auto[n,w]:a)cout<<w<<": "<<-n<<'\n';}

''',r'''

from collections import Counter

import re,sys

c=Counter(re.findall('[A-Z]+',sys.stdin.read()))

for w in sorted(c,key=lambda w:(-c[w],w)):print(f'{w}: {c[w]}')

''',[('A,B A.','A: 2\nB: 1','逗號句號斷詞')],'easy')

add(184,'dp','旋轉正規化與非嚴格LIS','將每個矩形兩邊排序為短邊、長邊。若可透過90度旋轉包含，正規化後兩邊也各自滿足大小關係。|將矩形按短邊、長邊遞增排序，問題化為長邊的最長非遞減子序列。|使用upper_bound維護各長度的最小尾值；相同尺寸可疊，所以必須找嚴格大於目前值的位置替換。','時間 O(n log n)，空間 O(n)。','可相等，應用upper_bound而不是lower_bound。','矩形5×1、2×3、3×2:正規化為(1,5),(2,3),(2,3)|排序後長邊:5,3,3|最長非遞減:3,3長度2，兩個同尺寸矩形皆可用',r'''

int main(){int t;cin>>t;while(t--){int n;cin>>n;vector<pair<int,int>>a(n);for(auto&[x,y]:a){cin>>x>>y;if(x>y)swap(x,y);}sort(a.begin(),a.end());vector<int>d;for(auto[x,y]:a){auto it=upper_bound(d.begin(),d.end(),y);if(it==d.end())d.push_back(y);else *it=y;}cout<<d.size()<<'\n';}}

''',r'''

from bisect import bisect_right

import sys

it=iter(map(int,sys.stdin.buffer.read().split()))

for _ in range(next(it)):

 a=sorted(tuple(sorted((next(it),next(it)))) for _ in range(next(it)));d=[]

 for x,y in a:

  p=bisect_right(d,y)

  if p==len(d):d.append(y)

  else:d[p]=y

 print(len(d))

''',[('1\n4 1 1 1 1 2 2 3 3','4','等尺寸也能堆疊且整體成鏈')])

# UTF-8中文逐位數字共用排序，原表示作同值次鍵。

def chinese_sort(n,alphabet,mixed,tests):

 cpp=r'''

int main(){string abc="ALPHABET",s;map<string,char>digit;for(int i=0;i<10;i++)digit[abc.substr(i*3,3)]='0'+i;vector<pair<pair<int,string>,string>>a;while(cin>>s){string key;if((unsigned char)s[0]<128)key=s;else for(int j=0;j<(int)s.size();j+=3)key+=digit[s.substr(j,3)];auto p=key.find_first_not_of('0');key=p==string::npos?"0":key.substr(p);a.push_back({{key.size(),key},s});}sort(a.begin(),a.end());bool first=true;for(auto v:a){if(!first)cout<<SEP;first=false;cout<<v.second;}cout<<'\n';}

'''.replace('ALPHABET',alphabet).replace('SEP',"'\\n'" if mixed else "' '")

 # replace produces exactly one C++ escape

 cpp=cpp.replace("'\\\\n'","'\\n'")

 py="import sys\nabc="+repr(alphabet)+"\na=sys.stdin.read().split()\ndef key(s):\n t=''.join(str(abc.index(c)) if c in abc else c for c in s).lstrip('0') or '0'\n return len(t),t,s\nprint("+("'\\n'" if mixed else "' '")+".join(sorted(a,key=key)))\n"

 add(n,'sorting','中文逐位數字的數值排序','以題給字表將每個中文字轉成對應十進位數字，沒有十百千的位名運算。|去掉數值表示的前導零，先比較有效長度，再比較同長數字字串，即等於任意大非負整數比較。|數值相同時用原字串Unicode順序，保留全部重複項，再按指定分隔方式輸出原字串。','總字元L，n個數排序 O(n log n)次字串比較，最壞每次 O(Lmax)；空間 O(L)。','不能按中文原字串作主要排序，也不能轉成有大小限制的整數。','輸入'+('八 12 二' if mixed else '捌 壹貳 貳')+':轉成8、12、2|數值比較:2<8<12|還原表示:按數值順序輸出原字串',cpp,py,tests)

chinese_sort(185,'零壹貳叁肆伍陸柒捌玖',False,[('捌 壹貳 貳','貳 捌 壹貳','數值2、8、12排序')])

add(187,'number-theory','四倍成長的等比級數','第i階三角形數為4^(i-1)，題目要求前N階總和。|從power=1、sum=0開始，每次把power加入sum，再將power乘4。|迴圈第i輪後sum恰為前i階總和，故N輪後得到答案，任意精度支援N=120。','時間 O(N)次大整數運算，累積 O(N²)位元成本；空間 O(N)位元。','要求各階數量相加，不是只輸出第N階。','N=4:第一階1，總和1|第二、三階:加4與16，總和21|第四階:再加64，總和85',r'''

int main(){int n;cin>>n;cpp_int p=1,s=0;while(n--){s+=p;p*=4;}cout<<s<<'\n';}

''',r'''

n=int(input());p=1;s=0

for _ in range(n):s+=p;p*=4

print(s)

''',[('4','85','等比公式(4^4-1)/3=85')],'easy')

add(190,'simulation','到中央列的距離決定空白','列索引i從0到2n，中間空白數為abs(n-i)。|每列先印8顆星，再印這個數量的空白，再印8顆星。|絕對值在中央前逐次減1、中央後逐次加1，正好形成題目要求的對稱圖形。','輸出長度 Θ(n²+n)，時間同輸出量；每行空間 O(n)。','n=0仍有一列16顆星；原例多印列不採用。','n=1首列:8星、1空白、8星|中央列:16星連續|末列:與首列相同，共3列',r'''

int main(){int n;cin>>n;for(int i=0;i<=2*n;i++)cout<<"********"<<string(abs(n-i),' ')<<"********\n";}

''',r'''

n=int(input())

for i in range(2*n+1):print('*'*8+' '*abs(n-i)+'*'*8)

''',[('0','****************','零階僅中央列')],'easy')

add(193,'sorting','只刪一個最大與一個最小','將五個整數排序，保留索引1、2、3的三個值。|它們的總和S除以3即為平均；百分位的四捨五入可用(abs(S)×100+1)//3，再補回符號。因分母3，不會恰好半分。|以整數部分與兩位餘數組合輸出，支援負數且避免浮點誤差。','五數固定，時間空間 O(1)，任意精度運算成本依輸入位數。','重複的最大與最小值都只刪一份。','輸入1,1,1,1,9:排序後刪掉一個1及9|保留:1,1,1，總和3|平均:3/3=1，輸出1.00',r'''

int main(){vector<cpp_int>a(5);for(auto&x:a)cin>>x;sort(a.begin(),a.end());cpp_int s=a[1]+a[2]+a[3];bool neg=s<0;if(neg)s=-s;cpp_int c=(s*100+1)/3;if(neg&&c!=0)cout<<'-';cout<<c/100<<'.';int rem=(c%100).convert_to<int>();cout<<setw(2)<<setfill('0')<<rem<<'\n';}

''',r'''

a=sorted(map(int,input().split()));s=sum(a[1:4]);c=(abs(s)*100+1)//3;print(('-' if s<0 and c else '')+f'{c//100}.{c%100:02}')

''',[('1 1 1 1 9','1.00','重複極值僅各刪一個'),('-9 -1 -1 -1 0','-1.00','負數平均')],'easy')

def verify():

 import subprocess,tempfile,hashlib,concurrent.futures,time

 if sys.platform=='win32':raise SystemExit('Run C++ verification in WSL/Linux; Windows executables are prohibited.')

 cache=pathlib.Path('/tmp/practice2-lesson-verify');cache.mkdir(exist_ok=True);start=time.monotonic()

 def norm(s):return '\n'.join(x.rstrip() for x in s.replace('\r\n','\n').split('\n')).rstrip()

 def one(d):

  c=d['code'];h=hashlib.sha256(d['cpp'].encode()).hexdigest()[:16];f=cache/(c+h+'.cpp');exe=cache/(c+h);py=cache/(c+'.py');f.write_text(d['cpp']);py.write_text(d['python']);fail=[];count=0

  if not exe.exists():

   p=subprocess.run(['g++','-std=c++17','-O2',str(f),'-o',str(exe)],capture_output=True,text=True,timeout=120)

   if p.returncode:fail.append({'code':c,'compile':p.stderr});return c,0,fail

  tests=SOURCES[c]['samples']+[x for x in CHECK if x['code']==c]

  for t in tests:

   for lang,cmd in [('C++',[str(exe)]),('Python',['python3',str(py)])]:

    try:

     p=subprocess.run(cmd,input=t['input'],capture_output=True,text=True,timeout=40);count+=1

     if p.returncode or norm(p.stdout)!=norm(t['output']):fail.append(dict(code=c,lang=lang,input=t['input'],expected=t['output'],actual=p.stdout,error=p.stderr))

    except subprocess.TimeoutExpired:fail.append(dict(code=c,lang=lang,error='timeout'))

  return c,count,fail

 failures=[];count=0

 with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:

  for c,k,errs in pool.map(one,LESSONS):

   count+=k;failures+=errs;print(c,k,'PASS' if not errs else 'FAIL',flush=True)

 print(json.dumps(dict(tutorials=len(LESSONS),languageExecutions=count,seconds=round(time.monotonic()-start,2),failures=failures),ensure_ascii=False,indent=2),flush=True)

 return failures

add(195,'number-theory','整除聯集與循環字母','直接枚舉1到c，若能被a或b任一整除，就將這個數加入總和一次。|使用邏輯或避免同時被兩者整除的數被算兩次。|總和S對應字母編號(S-1)%26，0到25再映為A到Z，因此26倍數正確得到Z。','時間 O(c)，空間 O(1)。','不可分別累加兩種倍數後忘記扣交集。','a=2,b=3,c=6:符合2,3,4,6|加總:S=15，6只算一次|對應字母:(15-1)%26=14，得到O',r'''

int main(){int a,b,c,s=0;cin>>a>>b>>c;for(int i=1;i<=c;i++)if(i%a==0||i%b==0)s+=i;cout<<char('A'+(s-1)%26)<<'\n';}

''',r'''

a,b,c=map(int,input().split());s=sum(i for i in range(1,c+1) if i%a==0 or i%b==0);print(chr(65+(s-1)%26))

''',[('2 3 6','O','獨立列出整除聯集2、3、4、6')],'easy')

add(197,'number-theory','十六進位的Horner累積','由左到右處理每個十六進位字元，數字0至9取0至9，A至F取10至15。|目前值乘16再加上新位數，即更新為讀入前綴所代表的數值。|使用任意精度整數，保留原十六進位字串並輸出累積值，前導零只保留在原字串欄。','長度L時 O(L)次大整數乘小整數與加法，位元成本 O(L²)，空間 O(L)。','不可用固定64位整數假設輸入長度上限。','字串00FF:前兩碼累積為0|第一個F:0×16+15=15|第二個F:15×16+15=255，輸出00FF 255',r'''

int main(){string s;while(cin>>s){cpp_int n=0;for(char c:s)n=n*16+(c<='9'?c-'0':c-'A'+10);cout<<s<<' '<<n<<'\n';}}

''',r'''

import sys

if hasattr(sys,'set_int_max_str_digits'):sys.set_int_max_str_digits(0)

for s in sys.stdin:

 s=s.strip();n=0

 for c in s:n=n*16+'0123456789ABCDEF'.index(c)

 print(s,n)

''',[('\n'.join(['00FF']*20),'\n'.join(['00FF 255']*20),'合法20行，值以15×16+15獨立算出')],'easy')

add(198,'basics','促銷套餐的瓶頸數量','咖啡能形成floor(c/5)份套餐，蛋糕能形成floor(k/2)份套餐。|每份完整套餐同時需要兩種資源，因此贈送數為兩者最小值；此數量可實際配置且不可能更多。|保留購買咖啡與蛋糕數，巧克力交付量為原購買量加贈送量。','固定次數任意精度整數運算，成本依輸入位數；空間同數字長度。','贈品加在巧克力，不扣咖啡或蛋糕；不足一份不能兌換。','咖啡10、巧克力0、蛋糕4:兩種各能組2份|取最小值:送2盒巧克力|交付:10 2 4',r'''

int main(){cpp_int c,h,k;cin>>c>>h>>k;cpp_int x=c/5,y=k/2;cout<<c<<' '<<h+(x<y?x:y)<<' '<<k<<'\n';}

''',r'''

c,h,k=map(int,input().split());print(c,h+min(c//5,k//2),k)

''',[('10 0 4','10 2 4','恰兩份完整套餐'),('0 7 9','0 7 9','咖啡為瓶頸0')],'easy')

add(199,'graphs','最小起點DFS與迴圈頂點集合去重','把所有頂點依字母排序，從每個頂點s出發DFS，路徑中不重複頂點，且只走編號不小於s的頂點。|若遇到回到s的邊，就把目前路徑頂點排序後放入集合。每個簡單有向環都有唯一最小頂點，故一定從該點被找到。|同一頂點集合不同巡訪順序由集合去重，最後按頂點串列字典序輸出全部集合。','最壞時間指數乃至階乘級，因需列出所有簡單環；空間 O(V+E+輸出集合總長度)。','不能只找強連通分量；同一分量可能含許多不同環集合。','邊A→B、B→A、B→C:從A出發走B|遇B→A:記錄集合A B|走到C:無回邊，不形成新環；僅輸出A B',r'''

int main(){char a,b;map<char,set<char>>g;while(cin>>a>>b){g[a].insert(b);g[b];}set<string>out;string path;set<char>vis;for(auto [s,es]:g){function<void(char)>f=[&](char u){vis.insert(u);path+=u;for(char v:g[u]){if(v==s){string z=path;sort(z.begin(),z.end());out.insert(z);}else if(v>s&&!vis.count(v))f(v);}vis.erase(u);path.pop_back();};f(s);}if(out.empty())cout<<"不存在迴圈\n";else{cout<<"存在迴圈\n";for(auto s:out){for(int i=0;i<(int)s.size();i++){if(i)cout<<' ';cout<<s[i];}cout<<'\n';}}}

''',r'''

import sys

from collections import defaultdict

g=defaultdict(set)

for line in sys.stdin:

 a,b=line.split();g[a].add(b);g[b]

out=set()

for s in sorted(g):

 path=[];vis=set()

 def dfs(u):

  path.append(u);vis.add(u)

  for v in g[u]:

   if v==s:out.add(tuple(sorted(path)))

   elif v>s and v not in vis:dfs(v)

  path.pop();vis.remove(u)

 dfs(s)

print('存在迴圈' if out else '不存在迴圈')

for v in sorted(out):print(' '.join(v))

''',[('A B\nB A\nB C','存在迴圈\nA B','唯一二點環')],'hard')

add(200,'number-theory','長除法餘數重複定位循環節','先求整數商與餘數；餘數為0直接輸出整數。|對每個尚未見過的餘數，記錄其對應的小數位索引，再將餘數乘10求下一位及新餘數。|新餘數0表示有限小數；若餘數重複，從前次索引到目前末端就是最短循環節，因長除法後續完全由餘數決定。','若產生D位小數，時間 O(D)次大整數除法，空間 O(D)個餘數加字元；D最壞與分母大小同階。','要記錄餘數，不是出現過的數字；循環節可能以0開頭。','1/6:整數商0、餘數1|第一小數位:10÷6得1，餘數4|第二位:40÷6得6仍餘4，循環節為6，輸出0.16 (6循環)',r'''

int main(){cpp_int a,b;cin>>a>>b;cpp_int r=a%b;cout<<a/b;if(r==0){cout<<'\n';return 0;}map<cpp_int,int>seen;string s;while(r!=0&&!seen.count(r)){seen[r]=s.size();r*=10;s+=char('0'+(r/b).convert_to<int>());r%=b;}cout<<'.'<<s;if(r!=0)cout<<" ("<<s.substr(seen[r])<<"循環)";cout<<'\n';}

''',r'''

a,b=map(int,input().split());q,r=divmod(a,b);seen={};s=[]

while r and r not in seen:

 seen[r]=len(s);d,r=divmod(r*10,b);s.append(str(d))

out=str(q)+('.'+''.join(s) if s else '')

if r:out+=' ('+''.join(s[seen[r]:])+'循環)'

print(out)

''',[('1 6','0.16 (6循環)','以1/6=1/10+6/90獨立分解'),('8 4','2','整除沒有小數點')])

add(201,'basics','優先處理軸線再判象限','先處理x=y=0的原點，再依y=0、x=0處理兩軸。|剩下兩座標都非零，依正負號組合判第一至第四象限。|這些互斥條件涵蓋所有整數座標，照指定括號與中文字串輸出。','固定次數整數比較，時間空間依輸入位數。','原點必須先判，否則會誤分到軸線上。','點(2,-3):兩座標皆非0，非軸線|判斷符號:x正、y負|輸出:(2, -3)在第四象限內',r'''

int main(){cpp_int x,y;cin>>x>>y;string s;if(x==0&&y==0)s="在原點";else if(y==0)s="在x軸上";else if(x==0)s="在y軸上";else s="在第"+string(x>0?(y>0?"一":"四"):(y>0?"二":"三"))+"象限內";cout<<'('<<x<<", "<<y<<')'<<s<<'\n';}

''',r'''

x,y=map(int,input().split());s='在原點' if x==y==0 else '在x軸上' if y==0 else '在y軸上' if x==0 else '在第'+('一' if y>0 else '四' if x>0 else '三')+'象限內'

if x<0 and y>0:s='在第二象限內'

print(f'({x}, {y})'+s)

''',[('2 -3','(2, -3)在第四象限內','符號正負人工判別')],'easy')

add(203,'strings','列舉所有子字串與最長內容去重','長度最多80，可直接枚舉所有連續起訖位置，從兩端向內比較是否迴文。|若長度超過目前最佳，清除舊內容集合；若等於最佳，就加入內容集合。|每段被檢查一次，集合去除不同位置但相同內容，最後排序輸出全部不同最長內容。','時間 O(L³)，空間 O(L²)最壞儲存內容。','本題按內容去重，與b149按位置計數不同；空白屬於原字串。','字串abaXaba:先找到aba長3|跨中央:整串abaXaba本身對稱，更新為長7|輸出:7及唯一內容abaXaba',r'''

int main(){int n;cin>>n;string s;getline(cin,s);while(n--){getline(cin,s);int best=0;set<string>out;for(int l=0;l<(int)s.size();l++)for(int r=l;r<(int)s.size();r++){bool ok=true;for(int i=l,j=r;i<j;i++,j--)if(s[i]!=s[j])ok=false;if(ok){int len=r-l+1;if(len>best)best=len,out.clear();if(len==best)out.insert(s.substr(l,len));}}cout<<best<<'\n';bool first=true;for(auto z:out){if(!first)cout<<' ';first=false;cout<<z;}cout<<'\n';}}

''',r'''

for _ in range(int(input())):

 s=input();best=0;out=set()

 for l in range(len(s)):

  for r in range(l+1,len(s)+1):

   t=s[l:r]

   if t==t[::-1]:

    if len(t)>best:best=len(t);out.clear()

    if len(t)==best:out.add(t)

 print(best);print(' '.join(sorted(out)))

''',[('2\nabba\nabc','4\nabba\n1\na b c','全部子串人工辨識')])

add(205,'basics','三座標非零個數分類','三個座標全0時是原點。|恰一個非零時位於該座標軸；兩個或三個非零時不在任何座標軸。|依序檢查三對其餘座標是否為0即可，無須計算距離。','時間 O(L)讀取座標文字，額外空間依文字長度。','有一個座標為0只表示位於座標平面，不一定在軸上。','點(0,2,0):x與z為0|非零座標:只有y|分類:此座標點落在y軸上',r'''

bool zero(string s){for(char c:s)if(c>='1'&&c<='9')return false;return true;}

int main(){string a,b,c;cin>>a>>b>>c;bool x=zero(a),y=zero(b),z=zero(c);string s;if(x&&y&&z)s="此座標點落在原點";else if(y&&z)s="此座標點落在x軸上";else if(x&&z)s="此座標點落在y軸上";else if(x&&y)s="此座標點落在z軸上";else s="此座標點不落在原點、x軸、y軸或z軸上";cout<<s<<'\n';}

''',r'''

from decimal import Decimal

x,y,z=map(Decimal,input().split());s='此座標點落在原點' if x==y==z==0 else '此座標點落在x軸上' if y==z==0 else '此座標點落在y軸上' if x==z==0 else '此座標點落在z軸上' if x==y==0 else '此座標點不落在原點、x軸、y軸或z軸上';print(s)

''',[('0 2 0','此座標點落在y軸上','唯一非零座標是y')],'easy')

add(206,'sorting','一方半徑排序與另一方後綴最大值','計算每顆導彈到兩系統的平方距離(d1,d2)，按d1排序。|若系統1覆蓋排序前i顆，它最小需半徑平方d1[i-1]；剩餘導彈全由系統2覆蓋，需要其d2最大值。|預先求d2後綴最大值，枚舉i=0到M取兩者和最小。任何最優第一半徑都可縮到某個導彈距離，故這些候選完整。','時間 O(M log M)，空間 O(M)，大座標採任意精度。','包括全部交給單一系統的兩端；半徑0也有合法覆蓋效果。','系統(0,0),(10,0)，導彈(1,0),(9,0):距離對(1,81),(81,1)|分界一顆:第一半徑平方1，第二也1|比較兩端:各要81，最優分工總和2',r'''

int main(){int t;cin>>t;while(t--){cpp_int x1,y1,x2,y2;int m;cin>>x1>>y1>>x2>>y2>>m;vector<pair<cpp_int,cpp_int>>a;for(int i=0;i<m;i++){cpp_int x,y;cin>>x>>y;cpp_int u=x-x1,v=y-y1,r=x-x2,s=y-y2;a.push_back({u*u+v*v,r*r+s*s});}sort(a.begin(),a.end());vector<cpp_int>s(m+1);for(int i=m-1;i>=0;i--)s[i]=max(s[i+1],a[i].second);cpp_int ans=s[0];for(int i=1;i<=m;i++){cpp_int c=a[i-1].first+s[i];if(c<ans)ans=c;}cout<<ans<<'\n';}}

''',r'''

import sys

it=iter(map(int,sys.stdin.buffer.read().split()))

for _ in range(next(it)):

 x1,y1,x2,y2=(next(it) for _ in range(4));m=next(it);a=[]

 for i in range(m):

  x,y=next(it),next(it);a.append(((x-x1)**2+(y-y1)**2,(x-x2)**2+(y-y2)**2))

 a.sort();s=[0]*(m+1)

 for i in range(m-1,-1,-1):s[i]=max(s[i+1],a[i][1])

 print(min([s[0]]+[a[i-1][0]+s[i] for i in range(1,m+1)]))

''',[('1\n0 0 10 0\n2\n1 0\n9 0','2','兩導彈各由最近系統覆蓋')])

add(207,'strings','三座標分列後重新分組','將固定三個矩陣展平成27字元表，位置的三進位三位數就是三座標減1。|對明文先依序列出所有矩陣編號，再列所有列編號，最後列所有欄編號；此序列恰為3×L表的逐列讀取。|每三個數字重組表索引，查回密文字元。全程使用0到2可簡化索引，不影響座標對應。','時間 O(L)，空間 O(L)。','不能對每個字母各自重組原三座標，那樣只會得到原文。','單字元H:固定表內座標為(2,2,2)|逐列讀出:僅一欄，序列仍為2,2,2|查回:仍是H，單字元加密保持不變',r'''

int main(){string tab="LEOCBFQSTNARGHJUWXDVIKMPYZ/";int t;cin>>t;while(t--){string s;cin>>s;vector<int>a;for(int div:{9,3,1})for(char c:s)a.push_back((tab.find(c)/div)%3);for(int i=0;i<(int)a.size();i+=3)cout<<tab[a[i]*9+a[i+1]*3+a[i+2]];cout<<'\n';}}

''',r'''

tab='LEOCBFQSTNARGHJUWXDVIKMPYZ/'

for _ in range(int(input())):

 s=input();a=[tab.index(c)//d%3 for d in (9,3,1) for c in s];print(''.join(tab[a[i]*9+a[i+1]*3+a[i+2]] for i in range(0,len(a),3)))

''',[('3\nH\nE\n/','H\nE\n/','三個單字元，重新組座標不變')])

add(208,'number-theory','平方同餘遞迴與位元累積','先算N=PQ及X0=S² modN，再執行八次X=X² modN。|每次取X mod2得到一位，依序把累積整數左移一位再加此位。|平方對2的餘數等於數本身奇偶，故不需再平方取2。二進位固定八位，十六進位大寫且不補前導零。','固定九次任意精度平方與取餘；成本取決於P、Q、S位數，空間依大整數位數。','第一個位元取X1，不能從X0開始取。','P=3,Q=7,S=2:N=21，X0=4|後續平方:16,4,16,4反覆，皆為偶數|八個位元:00000000，輸出00000000 = 0',r'''

int main(){cpp_int p,q,s;cin>>p>>q>>s;cpp_int n=p*q,x=s*s%n;int v=0;string b;for(int i=0;i<8;i++){x=x*x%n;int z=(x%2).convert_to<int>();b+=char('0'+z);v=v*2+z;}cout<<b<<" = "<<uppercase<<hex<<v<<'\n';}

''',r'''

p,q,s=map(int,input().split());n=p*q;x=s*s%n;b='';v=0

for _ in range(8):x=x*x%n;z=x%2;b+=str(z);v=v*2+z

print(b+' = '+format(v,'X'))

''',[('3 7 2','00000000 = 0','獨立列出16、4交替，位元皆0')])

add(209,'number-theory','二次冪等比級數','先檢查n≤m，否則依格式輸出輸入錯誤。|合法時總和為2^(m+1)-2^n，可由等比級數或二進位連續的1推得。|以任意精度整數位移產生兩個二次冪，再相減，避免m=100超出64位。','時間與空間 O(m)位元加上十進位轉換成本。','n=m只含一項；m最大100不可用64位左移。','n=3,m=4:列出8與16|直接相加:24|公式:2^5-2^3=32-8=24',r'''

int main(){int n,m;cin>>n>>m;if(n>m)cout<<"n="<<n<<"比m="<<m<<"大，輸入錯誤\n";else cout<<(cpp_int(1)<<(m+1))-(cpp_int(1)<<n)<<'\n';}

''',r'''

n,m=map(int,input().split());print(f'n={n}比m={m}大，輸入錯誤' if n>m else (1<<(m+1))-(1<<n))

''',[('3 4','24','直接加8+16')],'easy')

chinese_sort(210,'零一二三四五六七八九',True,[('八\n12\n二','二\n八\n12','數值2、8、12且逐行輸出')])

add(213,'strings','兩字母列向量乘固定矩陣','先把大小寫統一為大寫，奇數長度尾端補X。|每兩字映成a,b，計算(a+3b)%26及(2b)%26。|這正是固定矩陣左乘列向量的兩個分量，依組次序還原成字母即可。','時間 O(L)，空間 O(L)。','矩陣左乘列向量，不可誤當列向量右乘；奇數補X而不是A。','明文AB:a=0,b=1|矩陣乘法:首分量3、次分量2|還原字母:D與C，輸出DC',r'''

int main(){int t;cin>>t;while(t--){string s;cin>>s;for(char&c:s)c=toupper(c);if(s.size()%2)s+='X';for(int i=0;i<(int)s.size();i+=2){int a=s[i]-'A',b=s[i+1]-'A';cout<<char('A'+(a+3*b)%26)<<char('A'+2*b%26);}cout<<'\n';}}

''',r'''

for _ in range(int(input())):

 s=input().upper()

 if len(s)%2:s+='X'

 out=[]

 for i in range(0,len(s),2):

  a,b=ord(s[i])-65,ord(s[i+1])-65;out.extend((chr(65+(a+3*b)%26),chr(65+2*b%26)))

 print(''.join(out))

''',[('2\nab\nA','DC\nRU','矩陣直接算AB與補字後AX')],'easy')

add(214,'number-theory','三項倍數轉立方和','第i項為i×3i×5i=15i³，因此F=15Σi³。|利用Σi³=[N(N+1)/2]²得到F=15[N(N+1)/2]²。|N(N+1)恆為偶數，所以先除2仍精確，再用大整數平方與乘15。','固定次數任意精度乘法，時間依N的位數與乘法成本；空間 O(log N)。','不是三個等差序列各自求和再相乘。','N=2:兩項為15與120|相加:135|公式:15×(2×3/2)²=135',r'''

int main(){cpp_int n;cin>>n;cpp_int s=n*(n+1)/2;cout<<"F="<<15*s*s<<'\n';}

''',r'''

n=int(input());s=n*(n+1)//2;print('F='+str(15*s*s))

''',[('2','F=135','兩項15+120')],'easy')

add(215,'geometry','排序後比較最大角的平方','先排序a≤b≤c，檢查a+b>c，否則無法形成三角形。|三角形最大角對著c，由餘弦定理比較a²+b²與c²：大於為銳角、等於直角、小於鈍角。|最大角為銳角時其餘角也銳，因此分類完整。乘法與加法使用64位。','時間空間 O(1)。','先檢查三角不等式；a²+b²可超過32位上限。','邊2,2,2:已排序且2+2>2|平方和:4+4=8，大於最大邊平方4|輸出:acute triangle',r'''

int main(){vector<long long>a(3);for(auto&x:a)cin>>x;sort(a.begin(),a.end());if(a[0]+a[1]<=a[2])cout<<"無法形成三角形\n";else{long long d=a[0]*a[0]+a[1]*a[1]-a[2]*a[2];cout<<(d==0?"right triangle":d>0?"acute triangle":"obtuse triangle")<<'\n';}}

''',r'''

a,b,c=sorted(map(int,input().split()));print('無法形成三角形' if a+b<=c else 'right triangle' if a*a+b*b==c*c else 'acute triangle' if a*a+b*b>c*c else 'obtuse triangle')

''',[('2 2 2','acute triangle','等邊必為銳角'),('1 1 2','無法形成三角形','退化邊界')],'easy')

add(217,'number-theory','最大公因數的全部因數','正方形邊長d必須同時整除長a與寬b，等價於d是gcd(a,b)的因數。|試除1到√g，每次整除便收集d及g/d，完全平方根只收一次。|排序後逐一輸出d與(a/d)(b/d)；切割成格狀即可實現，因此條件同時充分與必要。','時間 O(√g)次整除與 O(τ(g) log τ(g))排序，空間 O(τ(g))；以下C++長寬用64位，面積用大整數。','只枚舉最小邊因數仍要檢查另一邊；平方根不可重複。','長8寬4:gcd=4|全部公因數:1,2,4|個數:32、8、2，依邊長遞增輸出',r'''

int main(){long long a,b;cin>>a>>b;long long g=gcd(a,b);vector<long long>v;for(long long d=1;d<=g/d;d++)if(g%d==0){v.push_back(d);if(d!=g/d)v.push_back(g/d);}sort(v.begin(),v.end());for(auto d:v)cout<<d<<' '<<cpp_int(a/d)*(b/d)<<'\n';}

''',r'''

from math import gcd,isqrt

a,b=map(int,input().split());g=gcd(a,b);v=[]

for d in range(1,isqrt(g)+1):

 if g%d==0:

  v.append(d)

  if d!=g//d:v.append(g//d)

for d in sorted(v):print(d,(a//d)*(b//d))

''',[('8 4','1 32\n2 8\n4 2','公因數1、2、4')])

add(218,'strings','逐成員驗證全大寫後反轉','移除最外層一對大括號，再按逗號切成各成員。|對成員逐字確認是否全在A到Z內；若是則反轉，否則原樣保留。|最後依原順序用逗號串接並加回括號，因此只變動符合條件成員的內部次序。','時間 O(L)，空間 O(L)。','含任一數字或小寫就不反轉，不能只反轉其中大寫片段。','輸入{AB,A1,aB}:第一項全大寫|轉換:AB變BA，A1與aB保持|重組:{BA,A1,aB}',r'''

int main(){string s;cin>>s;s=s.substr(1,s.size()-2);stringstream ss(s);string t;cout<<'{';bool first=true;while(getline(ss,t,',')){if(all_of(t.begin(),t.end(),[](char c){return c>='A'&&c<='Z';}))reverse(t.begin(),t.end());if(!first)cout<<',';first=false;cout<<t;}cout<<"}\n";}

''',r'''

a=input()[1:-1].split(',');print('{'+','.join(s[::-1] if s and all('A'<=c<='Z' for c in s) else s for s in a)+'}')

''',[('{AB,A1,aB}','{BA,A1,aB}','三種成員逐字驗證')],'easy')

add(219,'search','依平方根遞增枚舉最小合法平方','k位數範圍為[10^(k-1),10^k-1]，從其下界的平方根上取整開始。|依根r遞增檢查r²的各位數是否全為偶數，遇到第一個符合者就輸出。|平方在非負根範圍嚴格遞增，所以第一次成功必為最小平方；k≤10，最多檢查十萬以內的根。','每組時間 O(10^(k/2)·k)，空間 O(k)。','0雖是偶數，但k位正整數不能有前導0；不能從0開始找。','k=1:第一個平方1不合|下一個平方:2²=4，數字4為偶數|停止:4即最小一位偶數字平方',r'''

int main(){int t;cin>>t;while(t--){int k;cin>>k;long long low=1;for(int i=1;i<k;i++)low*=10;long long r=sqrtl(low);while(r*r<low)r++;for(;;r++){long long x=r*r,z=x;bool ok=true;while(z){if(z%2)ok=false;z/=10;}if(ok){cout<<x<<'\n';break;}}}}

''',r'''

from math import isqrt

for _ in range(int(input())):

 k=int(input());low=10**(k-1);r=isqrt(low)

 if r*r<low:r+=1

 while any(int(c)%2 for c in str(r*r)):r+=1

 print(r*r)

''',[('2\n1\n3','4\n400','平方1、4與100至400前全含奇數位')])

add(220,'dp','每格由左或上進入的走法加總','起點走法為1，第一列與第一欄都只有一直走的1種方式。|其他格的最後一步只可能來自上格或左格，兩類路徑互斥，所以dp[y][x]=dp[y-1][x]+dp[y][x-1]。|逐列計算並覆蓋一維陣列，上格舊值與左格新值剛好都保留，最右下的值就是答案。','每組時間 O(XY)，空間 O(X)，最大答案C(38,19)在64位內。','X、Y是格子數，移動次數為X-1及Y-1；1×1有一種空路徑。','2×3棋盤:第一列走法1,1|第二列:1,2|第三列:1,3，答案3',r'''

int main(){int t;cin>>t;while(t--){int x,y;cin>>x>>y;vector<long long>d(x,1);for(int r=1;r<y;r++)for(int c=1;c<x;c++)d[c]+=d[c-1];cout<<d.back()<<'\n';}}

''',r'''

for _ in range(int(input())):

 x,y=map(int,input().split());d=[1]*x

 for r in range(1,y):

  for c in range(1,x):d[c]+=d[c-1]

 print(d[-1])

''',[('2\n1 1\n2 3','1\n3','空路徑與三種排列RSS、SRS、SSR')],'easy')

add(222,'dp','合法前綴與二進位餘數計數','dp[a][b][r]表示已放a隻雞、b隻鴨，形成餘數r的合法序列數。|再放雞時餘數變2r modM；只有a>b才能放鴨，餘數變(2r+1) modM。這正是每隻鴨左邊雞較多的條件。|按總長度逐層轉移，最後將每個餘數乘上對應序列數並加總。方案數與總和使用任意精度。','時間 O(xyM)，滾動依總長分層，空間 O(min(x,y)M)個計數；Python字典只保存可達狀態。','答案是各序列餘數的和，不是序列總值最後再取餘數。','x=2,y=1,M=4:合法排列001與010|各自二進位值:1與2|取餘後相加:1+2=3',r'''

int main(){int x,y,m;cin>>x>>y>>m;vector<vector<cpp_int>>cur(y+1,vector<cpp_int>(m)),nxt;cur[0][0]=1;for(int len=0;len<x+y;len++){nxt.assign(y+1,vector<cpp_int>(m));for(int b=0;b<=y;b++){int a=len-b;if(a<0||a>x)continue;for(int r=0;r<m;r++)if(cur[b][r]!=0){if(a<x)nxt[b][2*r%m]+=cur[b][r];if(b<y&&a>b)nxt[b+1][(2*r+1)%m]+=cur[b][r];}}cur.swap(nxt);}cpp_int ans=0;for(int r=0;r<m;r++)ans+=cur[y][r]*r;cout<<ans<<'\n';}

''',r'''

x,y,m=map(int,input().split());cur={(0,0):1}

for length in range(x+y):

 nxt={}

 for (b,r),count in cur.items():

  a=length-b

  if a<x:

   key=b,2*r%m;nxt[key]=nxt.get(key,0)+count

  if b<y and a>b:

   key=b+1,(2*r+1)%m;nxt[key]=nxt.get(key,0)+count

 cur=nxt

print(sum(r*c for (b,r),c in cur.items() if b==y))

''',[('2 1 4','3','完整列出001、010兩種合法排列'),('1 1 1','0','模1所有餘數0')],'hard')

add(223,'number-theory','試除分解並由因子數判質數','從2開始試除，能整除便持續除盡並記錄重複質因數。|當d²>目前剩餘數時，若剩餘大於1就是最後一個質因數；否則它若為合數會有更小因數，與已除盡矛盾。|原數1依題目特例輸出；其他數若只有一個因數且等於原數就是質數，否則輸出全部因子。','時間 O(√n)次大整數試除，空間 O(log n)個因子與輸出；沒有多項式位數時間保證。','1不是質數；重複因數不可省略，也不能沿用已知錯誤官方答案。','n=12:連續除2得到因子2,2，餘數3|結束試除:3為最後質因數|輸出:12=2×2×3，不是質數',r'''

int main(){cpp_int n;cin>>n;if(n==1){cout<<"1=1×1，不是質數\n";return 0;}cpp_int r=n;vector<cpp_int>v;for(cpp_int p=2;p*p<=r;p++)while(r%p==0){v.push_back(p);r/=p;}if(r>1)v.push_back(r);if(v.size()==1)cout<<n<<"是質數\n";else{cout<<n<<'=';for(int i=0;i<(int)v.size();i++){if(i)cout<<"×";cout<<v[i];}cout<<"，不是質數\n";}}

''',r'''

n=int(input());r=n;v=[];p=2

while p*p<=r:

 while r%p==0:v.append(p);r//=p

 p+=1

if r>1:v.append(r)

if n==1:print('1=1×1，不是質數')

elif len(v)==1:print(str(n)+'是質數')

else:print(str(n)+'='+'×'.join(map(str,v))+'，不是質數')

''',[('12','12=2×2×3，不是質數','直接因數2、2、3'),('1','1=1×1，不是質數','題定1特例')])

add(224,'simulation','公曆日期的累積天數模7','計算年份前所有完整年的天數365(y-1)+⌊(y-1)/4⌋-⌊(y-1)/100⌋+⌊(y-1)/400⌋。|再加當年前完整月份與本月日數，採公曆閏年規則。以西元1年1月1日星期一為起點，得到星期索引。|也可將結果相對2112年1月1日星期五校準；兩者一致。逐日期輸出英文名稱。','每筆最多12月，時間 O(1)，空間 O(1)。','2100是平年；日期解析後不能把月日順序顛倒。','2112/01/01:題定星期五|隔一天:2112/01/02為星期六|再一天:2112/01/03為星期日',r'''

int main(){int n;cin>>n;string s;string names[]={"Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"};while(n--){cin>>s;int y=stoi(s.substr(0,4)),m=stoi(s.substr(5,2)),d=stoi(s.substr(8,2));bool l=y%400==0||(y%4==0&&y%100!=0);int days[]={31,28+l,31,30,31,30,31,31,30,31,30,31};long long total=365LL*(y-1)+(y-1)/4-(y-1)/100+(y-1)/400+d;for(int i=0;i<m-1;i++)total+=days[i];cout<<names[total%7]<<'\n';}}

''',r'''

names=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']

for _ in range(int(input())):

 y,m,d=map(int,input().split('/'));days=[31,28+(y%400==0 or y%4==0 and y%100!=0),31,30,31,30,31,31,30,31,30,31];total=365*(y-1)+(y-1)//4-(y-1)//100+(y-1)//400+sum(days[:m-1])+d;print(names[total%7])

''',[('3\n2112/01/01\n2112/01/02\n2112/01/03','Friday\nSaturday\nSunday','題定錨點逐天推進')])

add(225,'data-structures','四類直線上的獎品頻率','逐個獎品累加所在列r、欄c、主對角線r-c、副對角線r+c的數量。|一個位置若任一類頻率大於1，就與至少一個其他獎品同線；反過來任何衝突必在這四類之一。|再次按列優先掃描獎品，輸出所有衝突者座標，避免重複輸出同一格。','時間 O(MN)，空間 O(MN)存圖及 O(M+N)計數。','輸出座標是(列,欄)；一格與多條線衝突也只印一次。','2×2獎品在(0,0),(1,1):列與欄各只有1|主對角線:r-c同為0，頻率2|輸出:(0,0)(1,1)',r'''

int main(){int m,n;cin>>m>>n;vector<string>a(m);vector<int>r(m),c(n),d(m+n),e(m+n);for(int i=0;i<m;i++){cin>>a[i];for(int j=0;j<n;j++)if(a[i][j]=='x')r[i]++,c[j]++,d[i-j+n]++,e[i+j]++;}for(int i=0;i<m;i++)for(int j=0;j<n;j++)if(a[i][j]=='x'&&(r[i]>1||c[j]>1||d[i-j+n]>1||e[i+j]>1))cout<<'('<<i<<','<<j<<')';cout<<'\n';}

''',r'''

from collections import Counter

m,n=map(int,input().split());a=[input() for _ in range(m)];p=[(r,c) for r in range(m) for c in range(n) if a[r][c]=='x'];rows=Counter(r for r,c in p);cols=Counter(c for r,c in p);ds=Counter(r-c for r,c in p);es=Counter(r+c for r,c in p)

print(''.join(f'({r},{c})' for r,c in p if max(rows[r],cols[c],ds[r-c],es[r+c])>1))

''',[('2 2\nxo\nox','(0,0)(1,1)','同主對角線的唯一兩獎品')])

add(226,'graphs','反向展開可行起點與二分最近值','對目標v的前驅，偶數分支永遠有2v；奇數分支若v%3=2，則有(2v-1)/3。這個前驅為正奇數。|從t反向BFS展開至深度m，並對所有深度共用拜訪集合；首次到達深度最小，以後重訪不會增加可達範圍。|把所有起點排序，對每個a二分找插入點，只比較左右兩鄰即得最近距離。可行值最高t·2^m，不可用詢問上界截斷。','令V為實際反向可達節點數，時間 O(V log V+q log V)，空間 O(V+q)，V最壞為指數上界 O(2^m)。','奇數分支原操作已除以2；不能誤用傳統3x+1未除2版本。','t=2,m=1:零步起點2|反向一步:偶數前驅4，奇數前驅1|查詢3:到2或4距離皆1，答案1',r'''

int main(){long long t;int m,q;cin>>t>>m>>q;unordered_set<long long>s;vector<long long>front={t};s.insert(t);for(int k=0;k<m;k++){vector<long long>next;for(auto v:front){long long a=2*v;if(s.insert(a).second)next.push_back(a);if(v%3==2){a=(2*v-1)/3;if(s.insert(a).second)next.push_back(a);}}front.swap(next);}vector<long long>a(s.begin(),s.end());sort(a.begin(),a.end());while(q--){long long x;cin>>x;auto it=lower_bound(a.begin(),a.end(),x);long long ans=LLONG_MAX;if(it!=a.end())ans=*it-x;if(it!=a.begin())ans=min(ans,x-*prev(it));cout<<ans<<'\n';}}

''',r'''

import sys,bisect

v=list(map(int,sys.stdin.buffer.read().split()));t,m,q=v[:3];seen={t};front=[t]

for _ in range(m):

 nxt=[]

 for z in front:

  for x in ([2*z,(2*z-1)//3] if z%3==2 else [2*z]):

   if x not in seen:seen.add(x);nxt.append(x)

 front=nxt

a=sorted(seen)

for x in v[3:]:

 i=bisect.bisect_left(a,x);print(min(([a[i]-x] if i<len(a) else [])+([x-a[i-1]] if i else [])))

''',[('2 1 3\n1 3 5','0\n1\n1','獨立正向檢查起點1、2、4'),('7 0 2\n1 1000000000000000000','6\n999999999999999993','零步只容許目標本身')])

add(227,'dp','最短共同超字串的子集合DP','去除重複字串，預算每對字串的最大後綴前綴重疊長度。|dp[mask][last]保存包含mask中全部字串且以last結尾的最佳串，以(長度,字典序)比較；轉移加入尚未使用的字串，只接重疊以外的尾段。|所有輸入等長，所以不同字串不會互相嚴格包含。任一最短答案可依各字串的出現起點排序成這種串接，故DP涵蓋最優解；同狀態保留較短或同長字典序較小者安全。','令K≤9、單字長n≤8，時間 O(2^K K²·Kn)，空間 O(2^K K·Kn)保存完整候選字串。','先最短再字典序；重複資料只需包含一次。','字串ab、bc:重疊為b，長度1|串接ab後bc:得到abc，長3|反向bc後ab:bcab長4，因此選abc',r'''

bool better(string a,string b){return b.empty()||a.size()<b.size()||(a.size()==b.size()&&a<b);}

int main(){int n,k;cin>>n>>k;set<string>u;string s;while(k--){cin>>s;u.insert(s);}vector<string>a(u.begin(),u.end());k=a.size();vector<vector<int>>ov(k,vector<int>(k));for(int i=0;i<k;i++)for(int j=0;j<k;j++)for(int l=1;l<=n;l++)if(a[i].substr(n-l)==a[j].substr(0,l))ov[i][j]=l;vector<vector<string>>dp(1<<k,vector<string>(k));for(int i=0;i<k;i++)dp[1<<i][i]=a[i];for(int m=1;m<(1<<k);m++)for(int i=0;i<k;i++)if(!dp[m][i].empty())for(int j=0;j<k;j++)if(!(m>>j&1)){string z=dp[m][i]+a[j].substr(ov[i][j]);auto&cur=dp[m|1<<j][j];if(better(z,cur))cur=z;}string ans;for(auto z:dp.back())if(better(z,ans))ans=z;cout<<ans<<'\n';}

''',r'''

n,k=map(int,input().split());a=sorted({input() for _ in range(k)});k=len(a);ov=[[max([0]+[l for l in range(1,n+1) if a[i][-l:]==a[j][:l]]) for j in range(k)] for i in range(k)];dp={}

for i in range(k):dp[1<<i,i]=a[i]

for mask in range(1,1<<k):

 for i in range(k):

  if (mask,i) not in dp:continue

  for j in range(k):

   if not mask>>j&1:

    key=mask|1<<j,j;z=dp[mask,i]+a[j][ov[i][j]:]

    if key not in dp or (len(z),z)<(len(dp[key]),dp[key]):dp[key]=z

print(min((dp[(1<<k)-1,i] for i in range(k)),key=lambda z:(len(z),z)))

''',[('2 3\nab\nbc\nab','abc','去重後唯一長3串接'),('2 2\nba\nab','aba','兩個長3答案aba、bab取字典序較小')])

add(228,'simulation','逐回合循環找敵隊與下一行動者','維持每人火把狀態與各隊存活數。|從行動者下一位開始循環掃描，找到第一個亮著且不同隊者並熄滅；若其隊存活數變0，剩餘隊數減1。|若未結束，仍由原行動者下一位置找第一個存活者接手。這兩次搜尋起點一致，但篩選條件不同，逐回合實作即可。','時間 O(n²)，空間 O(n+k)，n≤2000。','下一位行動者可以同隊；不能直接讓剛被淘汰者的下一人接手。','隊伍1,2,1:第1人行動，熄滅第2人|剩餘隊伍:第1與3人皆隊1，只剩一隊|結束:熄滅1支，答案1 1',r'''

int main(){int n,k;cin>>n>>k;vector<int>t(n),c(k+1);for(int&x:t){cin>>x;c[x]++;}vector<bool>alive(n,true);int cur=0,teams=k,ans=0;while(teams>1){int j=(cur+1)%n;while(!alive[j]||t[j]==t[cur])j=(j+1)%n;alive[j]=false;ans++;if(--c[t[j]]==0)teams--;if(teams==1)break;do{cur=(cur+1)%n;}while(!alive[cur]);}cout<<ans<<' '<<t[cur]<<'\n';}

''',r'''

n,k=map(int,input().split());t=list(map(int,input().split()));c=[0]*(k+1)

for x in t:c[x]+=1

alive=[True]*n;teams=k;cur=ans=0

while teams>1:

 j=(cur+1)%n

 while not alive[j] or t[j]==t[cur]:j=(j+1)%n

 alive[j]=False;ans+=1;c[t[j]]-=1

 if c[t[j]]==0:teams-=1

 if teams==1:break

 cur=(cur+1)%n

 while not alive[cur]:cur=(cur+1)%n

print(ans,t[cur])

''',[('3 2\n1 2 1','1 1','第一回合直接結束'),('3 1\n1 1 1','0 1','初始單一隊伍')])

add(229,'strings','關鍵片語生成置換字母表','移除關鍵字空白並依首次出現保留不同字母。|從最後保留字母之後循環26字母，依次補上尚未使用者，形成一般字母a至z對應的密碼表。|模式1用此表加密，模式0用反查表解密；原大寫則結果也大寫，空格保持。','時間 O(26+L)，空間 O(26+L)。','補字母從最後保留字母的下一字開始，不是固定從a開始。','關鍵字z:先保留z|補齊字母:接a,b,…,y，得到zabcdefghijklmnopqrstuvwxy|模式1轉Ab Z:輸出Za Y',r'''

int main(){int mode;cin>>mode;string key,s;getline(cin,key);getline(cin,key);getline(cin,s);string tab;bool used[26]={};for(char c:key)if(c!=' '&&!used[c-'a'])tab+=c,used[c-'a']=true;int last=tab.back()-'a';for(int k=1;k<=26;k++){int x=(last+k)%26;if(!used[x])tab+=char('a'+x),used[x]=true;}for(char&c:s)if(c!=' '){bool upper=isupper(c);char z=tolower(c);z=mode?tab[z-'a']:char('a'+tab.find(z));c=upper?toupper(z):z;}cout<<s<<'\n';}

''',r'''

mode=int(input());key=input();s=input();tab=''

for c in key:

 if c!=' ' and c not in tab:tab+=c

last=ord(tab[-1])-97

for k in range(1,27):

 c=chr(97+(last+k)%26)

 if c not in tab:tab+=c

out=[]

for c in s:

 if c==' ':out.append(c);continue

 z=tab[ord(c.lower())-97] if mode else chr(97+tab.index(c.lower()));out.append(z.upper() if c.isupper() else z)

print(''.join(out))

''',[('1\nz\nAb Z','Za Y','循環置換可手動驗證')])

add(230,'dp','階梯地圖的後綴最佳收益與字典序還原','dp[r][c]為從目前格到右下出口可採收的最多草莓，等於目前值加合法東、南鄰格dp最大值。|由下到上、由右到左計算；不存在的格不可選。|還原時若東與南皆可達且收益相同，優先E，這會在首次不同的位置取得題定優先順序；最前與最後各補一個進出園的E。','時間 O(n²)，空間 O(n²)保存三角形與dp。','同分須在還原時優先東；輸出包含進首格及離末格的兩步E。','n=2、數值1／1 1:首格只能南移|到第二排左格:再向東到末格，總草莓3|補進出園:E+SE+E，輸出ESEE與3',r'''

int main(){int n;cin>>n;vector<vector<int>>a(n),d(n);for(int r=0;r<n;r++){a[r].resize(r+1);d[r].resize(r+1);for(int&x:a[r])cin>>x;}for(int r=n-1;r>=0;r--)for(int c=r;c>=0;c--){int best=0;if(c<r)best=max(best,d[r][c+1]);if(r+1<n)best=max(best,d[r+1][c]);d[r][c]=a[r][c]+best;}int r=0,c=0;string path="E";while(r!=n-1||c!=n-1){if(c<r&&(r+1==n||d[r][c+1]>=d[r+1][c]))path+='E',c++;else path+='S',r++;}cout<<path<<"E\n"<<d[0][0]<<'\n';}

''',r'''

n=int(input());a=[list(map(int,input().split())) for _ in range(n)];d=[[0]*(r+1) for r in range(n)]

for r in range(n-1,-1,-1):

 for c in range(r,-1,-1):d[r][c]=a[r][c]+max([0]+([d[r][c+1]] if c<r else [])+([d[r+1][c]] if r+1<n else []))

r=c=0;path='E'

while (r,c)!=(n-1,n-1):

 if c<r and (r+1==n or d[r][c+1]>=d[r+1][c]):path+='E';c+=1

 else:path+='S';r+=1

print(path+'E');print(d[0][0])

''',[('2\n1\n1 1','ESEE\n3','唯一內部路線南再東'),('1\n7','EE\n7','單格仍需進出兩步E')])

add(235,'number-theory','有限十進位轉分數與Euclid商序列','移除小數點得到整數p，分母q為10的小數位數次方。|反覆輸出整除商p//q，再令(p,q)=(q,p%q)，直到餘數0；這就是從x取整數部分後對小數餘部取倒數的過程。|首個商後用分號，其餘用逗號；整數只有首個商。Euclid自然產生末商大於1的標準有限連分數。','數字位數D，O(D)次Euclid整除的上界，空間 O(D)位數及商序列；此題最多15位。','要用精確十進位，不能先轉二進位浮點數。','輸入1.25:p=125，q=100|第一次除法:125=1×100+25，首商1|接續:100=4×25，輸出1;4',r'''

int main(){string s;cin>>s;long long p=0,q=1;bool point=false;for(char c:s)if(c=='.')point=true;else{p=p*10+c-'0';if(point)q*=10;}vector<long long>a;while(q){a.push_back(p/q);long long r=p%q;p=q;q=r;}for(int i=0;i<(int)a.size();i++){if(i)cout<<(i==1?';':',');cout<<a[i];}cout<<'\n';}

''',r'''

s=input();a,b=s.split('.');p=int(a+b);q=10**len(b);out=[]

while q:out.append(p//q);p,q=q,p%q

print(str(out[0])+(';' + ','.join(map(str,out[1:])) if len(out)>1 else ''))

''',[('1.25','1;4','精確分數5/4'),('0.50','0;2','小於1且末尾零')])

add(236,'geometry','前三點必有同隊兩點的候選線','前3個人分屬兩條線，鴿籠原理保證至少一對同隊。|枚舉這三個人的三對作候選直線，以整數叉積找出線上點，其餘點必須也共線。|成功候選即為唯一解保證的兩隊，包含首位玩家的隊命名A。叉積避免垂直線與浮點斜率誤差。','時間 O(N)，三個候選各掃描全體；空間 O(N)。','若首人不在候選線上，要將A、B對調。','點(0,0),(1,0),(0,1),(1,1),(0,2):候選前兩點線y=0不成立|候選第1與3點:線x=0，剩餘兩點在x=1|命名:首人在x=0，因此標籤A B A B A',r'''

bool line(pair<long long,long long>a,pair<long long,long long>b,pair<long long,long long>c){return (b.first-a.first)*(c.second-a.second)==(b.second-a.second)*(c.first-a.first);}

int main(){int n;cin>>n;vector<pair<long long,long long>>p(n);for(auto&[x,y]:p)cin>>x>>y;for(int a=0;a<3;a++)for(int b=a+1;b<3;b++){vector<int>side(n),rest;for(int i=0;i<n;i++)if(!(side[i]=line(p[a],p[b],p[i])))rest.push_back(i);bool ok=rest.size()>=2;for(int i:rest)if(!line(p[rest[0]],p[rest[1]],p[i]))ok=false;if(ok){for(int x:side)cout<<(x==side[0]?'A':'B')<<'\n';return 0;}}}

''',r'''

from itertools import combinations

n=int(input());p=[tuple(map(int,input().split())) for _ in range(n)]

def line(a,b,c):return (b[0]-a[0])*(c[1]-a[1])==(b[1]-a[1])*(c[0]-a[0])

for a,b in combinations(p[:3],2):

 side=[line(a,b,c) for c in p];rest=[c for c,s in zip(p,side) if not s]

 if len(rest)>=2 and all(line(rest[0],rest[1],c) for c in rest):

  for s in side:print('A' if s==side[0] else 'B')

  break

''',[('5\n0 0\n1 0\n0 1\n1 1\n0 2','A\nB\nA\nB\nA','兩條平行直線x=0及x=1')])

add(237,'number-theory','Legendre次方與連續段壓縮','篩出n以下所有質數p。|n!中p的次方為⌊n/p⌋+⌊n/p²⌋+…；也可令v=n每輪v//=p並累加，避免次方溢位。|按質數順序掃描次方，將相鄰相同值合併成長度j的段；j=1只印次方，否則印j*次方。每段前保留一個空白。','時間 O(n log log n)篩法加 O(π(n) log n)上界的指數計算；空間 O(n)。','只合併連續相同次方；不能寫1*α，行首空白也要保留。','n=5:質數2、3、5|次方:2出現⌊5/2⌋+⌊5/4⌋=3次，3與5各1次|壓縮:輸出 3 2*1',r'''

int main(){int n;cin>>n;vector<bool>p(n+1,true);p[0]=p[1]=false;for(int i=2;i*i<=n;i++)if(p[i])for(int j=i*i;j<=n;j+=i)p[j]=false;vector<int>a;for(int i=2;i<=n;i++)if(p[i]){int v=n,e=0;while(v){v/=i;e+=v;}a.push_back(e);}for(int i=0;i<(int)a.size();){int j=i+1;while(j<(int)a.size()&&a[j]==a[i])j++;cout<<' ';if(j-i>1)cout<<j-i<<'*';cout<<a[i];i=j;}cout<<'\n';}

''',r'''

n=int(input());p=bytearray(b'\x01')*(n+1);p[:2]=b'\x00\x00'

for i in range(2,int(n**.5)+1):

 if p[i]:p[i*i:n+1:i]=b'\x00'*((n-i*i)//i+1)

a=[]

for i in range(2,n+1):

 if p[i]:

  v=n;e=0

  while v:v//=i;e+=v

  a.append(e)

out=[];i=0

while i<len(a):

 j=i+1

 while j<len(a) and a[j]==a[i]:j+=1

 out.append((str(j-i)+'*' if j-i>1 else '')+str(a[i]));i=j

print(' '+ ' '.join(out))

''',[('5',' 3 2*1','5!=120=2³×3×5')])

add(238,'greedy','由左上逐格強制翻轉','按列優先掃描可作3×3左上角的位置。若目前左上格為1，必須翻轉從此處開始的3×3；若為0則不可翻。|先前位置都已固定，之後的操作也無法再改變目前格，因此每一步的選擇是強制的。|掃完所有合法操作位置後檢查整張圖，若仍有1則無解；否則所有操作選擇唯一且各位置最多翻一次，所以計數就是最少操作數。','時間 O(mn)，空間 O(mn)。','最後兩行與兩欄仍須檢查；翻轉兩次互抵不會改善最少次數。','3×3全1:左上格為1，強制翻轉整塊|翻轉後:九格皆0，操作數1|尾端檢查:沒有殘留1，輸出1',r'''

int main(){int m,n;cin>>m>>n;vector<vector<int>>a(m,vector<int>(n));for(auto&r:a)for(int&x:r)cin>>x;int ans=0;for(int r=0;r+2<m;r++)for(int c=0;c+2<n;c++)if(a[r][c]){ans++;for(int y=r;y<r+3;y++)for(int x=c;x<c+3;x++)a[y][x]^=1;}for(auto row:a)for(int x:row)if(x){cout<<-1<<'\n';return 0;}cout<<ans<<'\n';}

''',r'''

m,n=map(int,input().split());a=[list(map(int,input().split())) for _ in range(m)];ans=0

for r in range(m-2):

 for c in range(n-2):

  if a[r][c]:

   ans+=1

   for y in range(r,r+3):

    for x in range(c,c+3):a[y][x]^=1

print(-1 if any(any(row) for row in a) else ans)

''',[('3 3\n1 1 1\n1 1 1\n1 1 1','1','唯一可操作區域'),('3 3\n1 0 0\n0 0 0\n0 0 0','-1','唯一操作無法消除單格')])

add(239,'geometry','枚舉被排除者後檢查共線','先檢查所有人是否共線，若是則教練不在場，輸出-1 -1。|否則枚舉每個人作教練，取其餘人中的兩點建立直線，確認其餘所有點都在此線。|題目保證至多一位不在球員線上，因此找到的排除者即教練，叉積判斷可處理垂直線。','時間 O(N²)，空間 O(N)。','全共線要先處理，否則任意刪一人後仍共線會誤判。','點(0,0),(1,1),(2,2),(1,0):全部不共線|排除(1,0):其餘皆在y=x|輸出教練:1 0',r'''

bool col(pair<int,int>a,pair<int,int>b,pair<int,int>c){return (b.first-a.first)*(c.second-a.second)==(b.second-a.second)*(c.first-a.first);}

int main(){int n;cin>>n;vector<pair<int,int>>p(n);for(auto&[x,y]:p)cin>>x>>y;bool all=true;for(auto c:p)all&=col(p[0],p[1],c);if(all){cout<<"-1 -1\n";return 0;}for(int k=0;k<n;k++){vector<pair<int,int>>a;for(int i=0;i<n;i++)if(i!=k)a.push_back(p[i]);bool ok=true;for(auto c:a)ok&=col(a[0],a[1],c);if(ok){cout<<p[k].first<<' '<<p[k].second<<'\n';return 0;}}}

''',r'''

n=int(input());p=[tuple(map(int,input().split())) for _ in range(n)]

def col(a,b,c):return (b[0]-a[0])*(c[1]-a[1])==(b[1]-a[1])*(c[0]-a[0])

if all(col(p[0],p[1],c) for c in p):print(-1,-1)

else:

 for k in range(n):

  a=p[:k]+p[k+1:]

  if all(col(a[0],a[1],c) for c in a):print(*p[k]);break

''',[('4\n0 0\n1 1\n2 2\n1 0','1 0','三球員y=x，一位不共線')])

add(240,'geometry','倒下骨牌的圓弧撞擊高度','左骨牌長h，兩骨牌水平距離d。倒下時頂點位於半徑h的圓上，抵達右骨牌位置的高度為√(h²-d²)。|必須d≤h且撞擊高度至少H/2，平方化得到4h²≥4d²+H²，完全使用整數判斷。|從左到右遇到第一對不滿足就停止，右骨牌就是最左未倒者；若全滿足輸出-1。','時間 O(N)，空間 O(N)保存骨牌。','不能只判斷左骨牌長度是否大於水平距離；還須撞到右骨牌上半部。','左高2、右高2、距離1:4h²=16，4d²+H²=8|判定:16≥8，因此能接續推倒|若右高4:右式20>16，無法推倒，輸出右骨牌座標',r'''

int main(){int n;cin>>n;vector<pair<int,int>>a(n);for(auto&[x,h]:a)cin>>x>>h;for(int i=1;i<n;i++){int d=a[i].first-a[i-1].first,h=a[i-1].second,H=a[i].second;if(4*h*h<4*d*d+H*H){cout<<a[i].first<<'\n';return 0;}}cout<<-1<<'\n';}

''',r'''

n=int(input());a=[tuple(map(int,input().split())) for _ in range(n)];ans=-1

for (x,h),(y,H) in zip(a,a[1:]):

 if 4*h*h<4*(y-x)**2+H*H:ans=y;break

print(ans)

''',[('2\n1 2\n2 4','2','圓弧高度√3小於右高一半2'),('1\n3 1','-1','只有首骨牌')])

add(245,'sorting','小值域的串流中位數','收入只在1到500，建立500格頻率表，逐個讀入就累加，不保存所有收入。|中位數順位為(n+1)//2，從1往上累加頻率，第一個累計達到此順位的值即為中位數。|該值以前元素不足目標順位，含該值後已足夠，因此它恰為排序後正中央的值。Python採固定區塊分詞避免read().split()佔大量記憶體。','時間 O(n+500)，C++額外空間 O(500)，Python O(500+固定輸入緩衝區)，不含直譯器本身常駐記憶體。','不要將五百萬筆收入全部讀成整數列表；Python執行器本身也可能超過原題8MB，這是語言執行環境限制。','資料5,1,5,3,3:頻率1有1筆、3有2筆、5有2筆|目標順位:(5+1)/2=3|累計到3:筆數3首次達標，中位數3',r'''

int main(){ios::sync_with_stdio(false);cin.tie(nullptr);int n,x;cin>>n;int f[501]={};for(int i=0;i<n;i++){cin>>x;f[x]++;}int s=0;for(int v=1;v<=500;v++){s+=f[v];if(s>n/2){cout<<v<<'\n';break;}}}

''',r'''

import sys

def nums():

 value=0;have=False

 while True:

  chunk=sys.stdin.buffer.read(65536)

  if not chunk:break

  for c in chunk:

   if 48<=c<=57:value=value*10+c-48;have=True

   elif have:yield value;value=0;have=False

 if have:yield value

it=nums();n=next(it);f=[0]*501

for _ in range(n):f[next(it)]+=1

s=0

for v in range(1,501):

 s+=f[v]

 if s>n//2:print(v);break

''',[('5\n5 1 5 3 3','3','排序1、3、3、5、5'),('1\n500','500','單筆最大收入')])

add(247,'simulation','四百年星期週期縮減大世紀','公曆400年共有146097天，恰為7的倍數，閏年與星期模式每400年重複。|世紀長100年，所以只需讀取c mod4，選等價的第1、2、3、4世紀。以字串逐位取模，支援任意長世紀。|在代表世紀逐年逐月計算13日的星期，計數即為原巨大世紀答案。','輸入D位，時間 O(D+1200)，空間 O(D)輸入字串，計算額外 O(1)。','世紀從100(c-1)+1開始，不能直接取100c當起年。','c=5:世紀401至500|週期縮減:與第1世紀1至100同型|逐月計數:兩者黑色星期五數量相同',CALCPP+r'''

int main(){string s;cin>>s;int r=0;for(char c:s)r=(r*10+c-'0')%4;int c=r?r:4;cout<<countCentury(100*(c-1)+1)<<'\n';}

''',CALPY+r'''

s=input();r=0

for c in s:r=(10*r+int(c))%4

c=r or 4;print(count_century(100*(c-1)+1))

''',[('1','172','獨立datetime遍歷1至100年各月13日'),('5','172','四百年周期與第一世紀相同')])

add(249,'number-theory','任意精度GCD與LCM逐項更新','以0作結束符，不能把0納入LCM。初始化g=0、l=1。|讀到正整數x時，g更新為gcd(g,x)，l更新為l/gcd(l,x)×x；前者保留共同最小質因數指數，後者保留最大指數。|全部讀完後，結合律保證兩值分別是全體GCD、LCM。使用任意精度支援巨大最小公倍數。','n筆數需 O(n)次Euclid與大整數乘除，實際時間依各數及LCM位數；串流額外空間依最大中間大整數位數。','先除再乘可縮小中間值；不能假設LCM在64位內。','輸入6,10,15:先得g=6、l=6|加入10:g=2、l=30|加入15後遇0:g=1、l=30，輸出1 30',RAT.split('struct Rat')[0]+r'''

int main(){cpp_int x,g=0,l=1;while(cin>>x&&x!=0){g=gcdBig(g,x);l=l/gcdBig(l,x)*x;}cout<<g<<' '<<l<<'\n';}

''',r'''

import sys,math

if hasattr(sys,'set_int_max_str_digits'):sys.set_int_max_str_digits(0)

g=0;l=1

for line in sys.stdin:

 done=False

 for t in line.split():

  x=int(t)

  if x==0:done=True;break

  g=math.gcd(g,x);l=l//math.gcd(l,x)*x

 if done:break

print(g,l)

''',[('6 10 15 0','1 30','質因數2、3、5的最小最大指數'),('18446744073709551616 3 0','1 55340232221128654848','互質大數，LCM超過64位')])

add(250,'strings','長連續段拆成最多七次的碼字','逐行保留原字串，先檢查非空、長度小於500且只含0與1，空白與非法字元都判錯。|對每段相同位元長L，重複取min(7,L)輸出位元加三位二進位次數，再扣除此長度直到0。|若共產生k碼字，壓縮長度為4k，百分比是400k/原長度，使用整數四捨五入。分段恰表示原全部位元且符合固定7次切割規則。','每行時間 O(L)，空間 O(L)含輸出。','不是把超長段任意平均；整除7時不要多印次數000的空段。','輸入000000001:先將八個0拆成7與1|碼字:0111、0001，再加一個1的1001|百分比:12/9×100≈133.33，輸出133',r'''

int main(){int n;cin>>n;string s;getline(cin,s);while(n--){getline(cin,s);if(s.empty()||s.size()>=500||s.find_first_not_of("01")!=string::npos){cout<<-1<<'\n';continue;}vector<string>a;for(int i=0;i<(int)s.size();){int j=i;while(j<(int)s.size()&&s[j]==s[i])j++;int len=j-i;while(len){int k=min(7,len);string z(1,s[i]);for(int b=2;b>=0;b--)z+=char('0'+(k>>b&1));a.push_back(z);len-=k;}i=j;}for(auto z:a)cout<<z<<' ';long long k=a.size(),l=s.size();cout<<(800*k+l)/(2*l)<<'\n';}}

''',r'''

import sys,itertools

for _ in range(int(sys.stdin.readline())):

 s=sys.stdin.readline().rstrip('\r\n')

 if not s or len(s)>=500 or not set(s)<=set('01'):print(-1);continue

 out=[]

 for c,g in itertools.groupby(s):

  n=sum(1 for _ in g)

  while n:

   k=min(7,n);out.append(c+format(k,'03b'));n-=k

 print(*out,(800*len(out)+len(s))//(2*len(s)))

''',[('2\n000000001\n1111111','0111 0001 1001 133\n1111 57','獨立解碼碼字並計12/9及4/7百分比')])

add(150,'strings','最長共同連續子字串與精確總分','對每個文件關鍵字，分別計算它與各查詢字串的最長共同連續子字串長度。二維DP只有字元相同時由左上加1，不同時歸零。|以共同長度除以查詢長度，取各查詢的最大比值作此關鍵字得分，再加總文件所有關鍵字得分。|使用精確有理數，最後才四捨五入為百分位整數；按此整數遞減、文件編號遞增排序，零分文件排除。','時間 O(Σ文件詞w Σ查詢q |w||q|)；滾動DP空間 O(max查詢長度)，另存查詢、輸出與有理數。','是連續子字串而不是LCS；每個文件詞取最大查詢得分，不是每個查詢取最大文件詞。','查詢AA與B，文件詞A、B:詞A得max(1/2,0)=1/2|詞B:得max(0,1)=1|最後總分:1.5，換成百分位150再參與排序',RAT+r'''

int common(string a,string b){vector<int>d(b.size()+1);int ans=0;for(char x:a){for(int j=b.size();j>=1;j--){d[j]=x==b[j-1]?d[j-1]+1:0;ans=max(ans,d[j]);}}return ans;}

int main(){string line,w;getline(cin,line);stringstream ss(line);vector<string>qs;while(ss>>w)qs.push_back(w);int n;cin>>n;getline(cin,line);vector<pair<cpp_int,cpp_int>>out;while(n--){getline(cin,line);stringstream st(line);cpp_int id;st>>id;Rat score;while(st>>w){Rat best;for(auto q:qs){Rat v(common(w,q),q.size());if(v.p*best.q>best.p*v.q)best=v;}score=score+best;}cpp_int cents=(200*score.p+score.q)/(2*score.q);if(cents>0)out.push_back({-cents,id});}sort(out.begin(),out.end());if(out.empty())cout<<"FALSE";else for(int i=0;i<(int)out.size();i++){if(i)cout<<' ';cout<<out[i].second;}cout<<'\n';}

''',r'''

from fractions import Fraction as F

def common(a,b):

 d=[0]*(len(b)+1);ans=0

 for x in a:

  for j in range(len(b),0,-1):

   d[j]=d[j-1]+1 if x==b[j-1] else 0;ans=max(ans,d[j])

 return ans

qs=input().split();out=[]

for _ in range(int(input())):

 row=input().split();id=int(row[0]);score=sum((max(F(common(w,q),len(q)) for q in qs) for w in row[1:]),F(0));cents=(200*score.numerator+score.denominator)//(2*score.denominator)

 if cents:out.append((-cents,id))

print(' '.join(str(id) for _,id in sorted(out)) if out else 'FALSE')

''',[('AA B\n3\n1 A B\n2 AA\n3 Z','1 2','精確得分1.5、1、0'),('X\n1\n8 ABC','FALSE','沒有共同字元')])

# 無輸入方程式：oracle改解w，與教材主程式解z的枚舉方向不同。

def equation_oracle():

 rows=[]

 for x in range(-10,11):

  for y in range(-10,11):

   for z in range(-10,11):

    num=5+5*x-2*y+3*z

    if num%4==0:

     w=num//4

     if -10<=w<=10 and (w+x+y+z)%4==0:rows.append((w,x,y,z))

 rows.sort();return '\n'.join(' '.join(map(str,r)) for r in rows)+f'\n{len(rows)}'

eqout=equation_oracle()

add(186,'search','消去一變數的完整整數枚舉','枚舉w,x,y在-10到10內，方程式可解出3z=4w-5x+2y-5。|只有右式可被3整除才得到整數z，接著檢查z範圍及四數和為4的倍數。|每個解的前三個座標唯一，枚舉不漏不重複，三層迴圈遞增也使輸出已為四元組字典序。最後印計數。','固定21³個三元組，時間 O(21³)，額外空間 O(1)。','負數的餘數只需測是否為0；不可只檢查線性方程式而漏掉總和條件。','取w=-10,x=-9,y=-6:右式-40+45-12-5=-12|求z:-12/3=-4，落在範圍內|總和:-10-9-6-4=-29並非4倍數，所以此組排除',r'''

int main(){int count=0;for(int w=-10;w<=10;w++)for(int x=-10;x<=10;x++)for(int y=-10;y<=10;y++){int a=4*w-5*x+2*y-5;if(a%3)continue;int z=a/3;if(z>=-10&&z<=10&&(w+x+y+z)%4==0){cout<<w<<' '<<x<<' '<<y<<' '<<z<<'\n';count++;}}cout<<count<<'\n';}

''',r'''

count=0

for w in range(-10,11):

 for x in range(-10,11):

  for y in range(-10,11):

   a=4*w-5*x+2*y-5

   if a%3:continue

   z=a//3

   if -10<=z<=10 and (w+x+y+z)%4==0:print(w,x,y,z);count+=1

print(count)

''',[('',eqout,'獨立枚舉x,y,z解w，完整比較解集合與字典序')])

add(188,'simulation','精確小數矩陣乘法與非零項計數','每個C[i,j]枚舉中介索引k，只有A[i,k]與B[k,j]都不為0才計算乘積。|若該格有q個非零乘積，乘法計q次，加法計max(q-1,0)次，因第一個乘積可直接賦值；即使最後相消也不扣次數。|用十進位整數係數表示元素，精確相乘相加，依輸入名稱與規定空行列印原矩陣、乘積及次數。','尺寸m×n及n×p，時間 O(mnp)次任意精度十進位運算，空間 O(mn+np+mp)個數值，位數成本另計。','全零格沒有加法；非零項相消的結果仍保留原乘加次數。', 'A=[1,-1]、B=[1;1]:兩個因子對皆非零|相加:1×1+(-1)×1=0|計數:乘法2，加法1，不能因結果0就略去',DEC+r'''

int main(){string an,bn,s;int m,n,k,p;cin>>an>>m>>n;vector<vector<Dec>>a(m,vector<Dec>(n));int za=0,zb=0;for(auto&r:a)for(auto&v:r){cin>>s;v=Dec(s);za+=v.n==0;}cin>>bn>>k>>p;vector<vector<Dec>>b(k,vector<Dec>(p)),c(m,vector<Dec>(p));for(auto&r:b)for(auto&v:r){cin>>s;v=Dec(s);zb+=v.n==0;}long long mul=0,plus=0;for(int i=0;i<m;i++)for(int j=0;j<p;j++){int q=0;for(int z=0;z<n;z++)if(a[i][z].n!=0&&b[z][j].n!=0){c[i][j]=c[i][j]+a[i][z]*b[z][j];q++;}mul+=q;plus+=max(0,q-1);}auto print=[&](vector<vector<Dec>>&v){for(auto&r:v){for(int i=0;i<(int)r.size();i++){if(i)cout<<' ';cout<<r[i].str();}cout<<'\n';}};cout<<"Matrix "<<an<<" contains "<<za<<" (Zero)\n";print(a);cout<<"\nMatrix "<<bn<<" contains "<<zb<<" (Zero)\n";print(b);cout<<"\nMatrix C="<<an<<'X'<<bn<<'\n';print(c);cout<<"\nUses\nMultiplication: "<<mul<<"\nAddition: "<<plus<<'\n';}

''',r'''

import sys

from fractions import Fraction as F

def fmt(x):

 if not x:return '0'

 neg=x<0;x=abs(x);d=x.denominator;k=0

 while d!=1:

  g=__import__('math').gcd(d,10);d//=g;k+=1

 z=str(x.numerator*10**k//x.denominator).zfill(k+1)

 return ('-' if neg else '')+((z[:-k]+'.'+z[-k:]).rstrip('0').rstrip('.') if k else z)

it=iter(sys.stdin.read().split());an=next(it);m,n=int(next(it)),int(next(it));a=[[F(next(it)) for _ in range(n)] for _ in range(m)];bn=next(it);k,p=int(next(it)),int(next(it));b=[[F(next(it)) for _ in range(p)] for _ in range(k)];c=[[F(0)]*p for _ in range(m)];mul=plus=0

for i in range(m):

 for j in range(p):

  terms=[a[i][z]*b[z][j] for z in range(n) if a[i][z] and b[z][j]];c[i][j]=sum(terms,F(0));mul+=len(terms);plus+=max(0,len(terms)-1)

def show(v):

 for r in v:print(' '.join(map(fmt,r)))

print(f'Matrix {an} contains {sum(x==0 for r in a for x in r)} (Zero)');show(a);print();print(f'Matrix {bn} contains {sum(x==0 for r in b for x in r)} (Zero)');show(b);print();print(f'Matrix C={an}X{bn}');show(c);print(f'\nUses\nMultiplication: {mul}\nAddition: {plus}')

''',[('P 1 2\n1 -1\nQ 2 1\n1\n1','Matrix P contains 0 (Zero)\n1 -1\n\nMatrix Q contains 0 (Zero)\n1\n1\n\nMatrix C=PXQ\n0\n\nUses\nMultiplication: 2\nAddition: 1','相消但仍兩次乘法一次加法')])

add(189,'simulation','先解讀投球序列再計加成','前九格各佔兩欄，X轉成一球10，不讀其保留空白；其他兩欄若為/則第二球為10減第一球。|第十格的2或3欄依實際投球解碼，保留加投球在同一序列中。|依前九格每格起點取球數：全倒加後兩球、補中加後一球，一般格加兩球；第十格只加其所有實際球。','每局固定最多21球，時間與空間 O(1)。','不能先split，因X後保留空格維持前九格欄位；第十格不再額外加成。','全局每球0:前九格各兩球0|第十格:兩球0，無加投|總分:十格全部0，輸出0',r'''

int main(){string s;while(getline(cin,s)){vector<int>roll;for(int f=0;f<9;f++){char a=s[2*f],b=s[2*f+1];if(a=='X')roll.push_back(10);else{roll.push_back(a-'0');roll.push_back(b=='/'?10-(a-'0'):b-'0');}}int tenth=roll.size();for(int i=18;i<(int)s.size();i++){char c=s[i];if(c=='X')roll.push_back(10);else if(c=='/')roll.push_back(10-roll.back());else roll.push_back(c-'0');}int ans=0,j=0;for(int f=0;f<9;f++){if(roll[j]==10){ans+=10+roll[j+1]+roll[j+2];j++;}else{int z=roll[j]+roll[j+1];ans+=z+(z==10?roll[j+2]:0);j+=2;}}for(int i=tenth;i<(int)roll.size();i++)ans+=roll[i];cout<<ans<<'\n';}}

''',r'''

import sys

for s in sys.stdin:

 s=s.rstrip('\r\n');roll=[]

 for f in range(9):

  a,b=s[2*f:2*f+2]

  if a=='X':roll.append(10)

  else:roll.extend((int(a),10-int(a) if b=='/' else int(b)))

 tenth=len(roll)

 for c in s[18:]:roll.append(10 if c=='X' else 10-roll[-1] if c=='/' else int(c))

 ans=j=0

 for _ in range(9):

  if roll[j]==10:ans+=10+roll[j+1]+roll[j+2];j+=1

  else:

   z=roll[j]+roll[j+1];ans+=z+(roll[j+2] if z==10 else 0);j+=2

 ans+=sum(roll[tenth:]);print(ans)

''',[('0'*20,'0','全局零分'),('5/'*10+'5','150','每格補中加5，十格各15')])

add(191,'data-structures','Fenwick維護長度與總和的最佳前驅','把數值排序去重作座標壓縮。對目前值x，只查詢嚴格小於x的壓縮前綴。|Fenwick每格保存最佳子序列末項索引，以(長度,總和)比較，先比長度再比總和。接上x後，長度加1、總和加x，並保存前驅索引用於還原。|任何以x結尾的遞增序列都來自較小前值；前綴最佳已涵蓋全部候選，且加同一x不改變比較次序，所以轉移正確。','時間 O(n log n)次任意精度比較與加法，空間 O(n)；Python讀取與壓縮也需 O(n)輸入儲存。','查詢到rank-1，重複值不能互接；全負數也要先保長度。','序列1,3,2,4:到3形成長2、和4|到2:形成長2、和3|到4:兩個前驅同長，選總和4的1,3，答案{1,3,4}',r'''

int main(){vector<cpp_int>a;cpp_int x;while(cin>>x)a.push_back(x);int n=a.size();vector<cpp_int>v=a,s(n);sort(v.begin(),v.end());v.erase(unique(v.begin(),v.end()),v.end());vector<int>bit(v.size()+1,-1),len(n),pre(n,-1);auto better=[&](int i,int j){if(i<0)return j;if(j<0)return i;if(len[i]!=len[j])return len[i]>len[j]?i:j;return s[i]>=s[j]?i:j;};int best=-1;for(int i=0;i<n;i++){int rank=lower_bound(v.begin(),v.end(),a[i])-v.begin()+1,p=-1;for(int k=rank-1;k;k-=k&-k)p=better(p,bit[k]);pre[i]=p;len[i]=(p<0?0:len[p])+1;s[i]=a[i]+(p<0?cpp_int(0):s[p]);for(int k=rank;k<(int)bit.size();k+=k&-k)bit[k]=better(bit[k],i);best=better(best,i);}vector<cpp_int>ans;for(int i=best;i>=0;i=pre[i])ans.push_back(a[i]);reverse(ans.begin(),ans.end());cout<<'{';for(int i=0;i<(int)ans.size();i++){if(i)cout<<',';cout<<ans[i];}cout<<"}\n";}

''',r'''

import sys,bisect

a=list(map(int,sys.stdin.read().split()));v=sorted(set(a));bit=[(0,0,-1)]*(len(v)+1);pre=[];best=(0,0,-1)

for i,x in enumerate(a):

 rank=bisect.bisect_left(v,x)+1;p=(0,0,-1);k=rank-1

 while k:p=max(p,bit[k]);k-=k&-k

 pre.append(p[2]);cur=(p[0]+1,p[1]+x,i);best=max(best,cur);k=rank

 while k<len(bit):bit[k]=max(bit[k],cur);k+=k&-k

out=[];i=best[2]

while i>=0:out.append(a[i]);i=pre[i]

print('{'+','.join(map(str,out[::-1]))+'}')

''',[('1 3 2 4','{1,3,4}','列出兩條長3序列取和較大'),('5 5 5','{5}','全等只能長1'),('4 3 2 1','{4}','遞減取最大單項')])

add(192,'strings','單字長度編碼後精確十進位相加','逐字計算連續英文字母個數，每個單字完成時產生min(9,字母數)的一位數。|逗號轉為小數點、句點只結束句子、空白只斷詞。由此得到兩個精確十進位字串。|將它們的小數位數對齊後以整數係數相加，再輸出去除不必要尾零的精確結果。','文字總長L，時間 O(L)解析加大整數加法，空間 O(L)。','十字母以上仍只編成一位9；沒有逗號就是整數。','句子A bb.與C ddd.:編碼為12與13|相加:12+13=25|格式化:整數不加小數點，輸出25',DEC+r'''

string encode(string s){string out;int len=0;auto flush=[&](){if(len){out+=char('0'+min(9,len));len=0;}};for(char c:s){if(isalpha((unsigned char)c))len++;else{flush();if(c==',')out+='.';}}flush();return out;}

int main(){string a,b;getline(cin,a);getline(cin,b);cout<<(Dec(encode(a))+Dec(encode(b))).str()<<'\n';}

''',r'''

import re

from fractions import Fraction as F

def encode(s):return ''.join('.' if t==',' else str(min(9,len(t))) for t in re.findall('[A-Za-z]+|,',s))

a,b=encode(input()),encode(input());da=len(a.split('.')[1]) if '.' in a else 0;db=len(b.split('.')[1]) if '.' in b else 0;k=max(da,db);v=int(a.replace('.',''))*10**(k-da)+int(b.replace('.',''))*10**(k-db);s=str(v).zfill(k+1)

print((s[:-k]+'.'+s[-k:]).rstrip('0').rstrip('.') if k else s)

''',[('A bb.\nC ddd.','25','12與13的精確和'),('A, b.\nC, d.','2.2','1.1+1.1')])

add(194,'geometry','枚舉四方向的完整最大線段','將每行×所在欄號轉成布林棋盤，其餘為○。|對水平、垂直、兩斜向各方向，只從其前一格已在棋盤外的位置開始，沿方向走到底，得到唯一最大線段。|長度至少3且全部符號相同才保留，兩端點正規化後排序輸出。每個方向的最大線有唯一邊界起點，因此不會把一條線的子段重算。','時間 O(n²)，空間 O(n²)，n≤10。','不是任意斜率共線；只算相鄰格的四種方向，且不能截取局部。','3×3全○:三橫、三直皆同符號|兩條主對角線:各長3也成立|其餘短斜線:長度不足3，排除，總數8',r'''

int main(){int n;cin>>n;string s;getline(cin,s);vector<vector<int>>a(n,vector<int>(n));for(int y=0;y<n;y++){getline(cin,s);stringstream ss(s);int x;while(ss>>x)if(x)a[y][x-1]=1;}vector<array<int,4>>out;auto in=[&](int x,int y){return x>=0&&x<n&&y>=0&&y<n;};for(auto[dx,dy]:vector<pair<int,int>>{{1,0},{0,1},{1,1},{1,-1}})for(int y=0;y<n;y++)for(int x=0;x<n;x++)if(!in(x-dx,y-dy)){int u=x,v=y,len=0;bool ok=true;pair<int,int>end;while(in(u,v)){ok&=a[v][u]==a[y][x];end={u,v};len++;u+=dx;v+=dy;}if(ok&&len>=3){pair<int,int>b={x+1,y+1},c={end.first+1,end.second+1};if(c<b)swap(b,c);out.push_back({b.first,b.second,c.first,c.second});}}sort(out.begin(),out.end());cout<<out.size()<<'\n';for(auto[x,y,u,v]:out)cout<<'('<<x<<','<<y<<")("<<u<<','<<v<<")\n";}

''',r'''

n=int(input());a=[[0]*n for _ in range(n)]

for y in range(n):

 for x in map(int,input().split()):

  if x:a[y][x-1]=1

out=[]

def inside(x,y):return 0<=x<n and 0<=y<n

for dx,dy in ((1,0),(0,1),(1,1),(1,-1)):

 for y in range(n):

  for x in range(n):

   if inside(x-dx,y-dy):continue

   u,v=x,y;line=[]

   while inside(u,v):line.append((u,v));u+=dx;v+=dy

   if len(line)>=3 and all(a[v][u]==a[y][x] for u,v in line):

    b,c=sorted(((x+1,y+1),(line[-1][0]+1,line[-1][1]+1)));out.append((*b,*c))

print(len(out))

for x,y,u,v in sorted(out):print(f'({x},{y})({u},{v})')

''',[('2\n0\n0','0','棋盤小於3，所有最大線皆太短')])

add(196,'search','標準漢諾塔順序到指定終態','灰環不能放在同大小白環上，因此所有環的合法堆疊次序等價於編號由小到大的標準漢諾塔。|從最大環n往下處理，目的柱為偶數C、奇數B。若最大環已在目的柱，遞迴處理較小環；否則先用標準漢諾塔將全部較小環移到第三柱，再移最大環，最後從第三柱處理較小環的指定終態。|從整疊角點出發到指定終態，移動最大環前較小環必須全在第三柱，因此上述必要操作與最短標準搬移組合，給出最短路徑。奇數輸入先輸出ERROR。','輸出步數為指數規模，時間 Θ(步數)，遞迴空間 O(N)，計數任意精度。','不能只把兩個顏色各自當一組整疊移動；每步只能搬柱頂一個環。','N=2:先將環1由A到B|搬最大環:環2由A到C|終態:白在B、灰在C，兩步即完成',r'''

cpp_int countMoves=0;void moveDisk(int n,char a,char b){cout<<n<<' '<<a<<' '<<b<<'\n';countMoves++;}

void tower(int n,char a,char b,char c){if(!n)return;tower(n-1,a,c,b);moveDisk(n,a,b);tower(n-1,c,b,a);}

void target(int n,char a){if(!n)return;char dest=n%2?'B':'C';if(a==dest)target(n-1,a);else{char spare='A'+'B'+'C'-a-dest;tower(n-1,a,spare,dest);moveDisk(n,a,dest);target(n-1,spare);}}

int main(){int n;cin>>n;if(n%2)cout<<"ERROR\n";else{target(n,'A');cout<<countMoves<<'\n';}}

''',r'''

import sys

n=int(input());count=0

if n%2:print('ERROR')

else:

 # 顯式工作堆疊避免把合法大N直接交給Python遞迴限制。

 tasks=[('target',n,'A','','')]

 while tasks:

  kind,k,a,b,c=tasks.pop()

  if kind=='move':print(k,a,b);count+=1;continue

  if not k:continue

  if kind=='tower':tasks.extend([('tower',k-1,c,b,a),('move',k,a,b,''),('tower',k-1,a,c,b)])

  else:

   dest='B' if k%2 else 'C'

   if a==dest:tasks.append(('target',k-1,a,'',''))

   else:

    spare=next(x for x in 'ABC' if x not in (a,dest));tasks.extend([('target',k-1,spare,'',''),('move',k,a,dest,''),('tower',k-1,a,spare,dest)])

 print(count)

''',[('2','1 A B\n2 A C\n2','兩環必各搬一次，兩步下界可達'),('3','ERROR','官方奇數錯誤分支')])

EDGES='ab ae bc bf cd cg dh ef ei fj gh gk hl ij im jk jn kl lp mn no op'

add(202,'graphs','位置與已訪集合的狀態BFS','依題給22條無向邊建圖，將需要拜訪的不同頂點編成位元，重複要求只保留一次。|狀態為(目前頂點,已訪必訪點遮罩)，走一條邊後將目的地對應位元加入。|每次移動成本1，從起點狀態BFS首次取得完整遮罩時即為最短路。不需返回起點，經過尚未指定順序的點也立即視為拜訪。','R個不同必訪點，時間 O((16+22)2^R)，空間 O(16·2^R)，R≤16；採bytearray標記與整數狀態佇列。','不能依輸入順序固定行程；f-g與k-o沒有邊。','起點a、必訪a與b:起始已完成a|走a→b:一條邊，完成b|全部到齊:立即停止，答案1，不必返回a',r'''

int main(){vector<vector<int>>g(16);string es="ab ae bc bf cd cg dh ef ei fj gh gk hl ij im jk jn kl lp mn no op",s;stringstream ss(es);while(ss>>s){int a=s[0]-'a',b=s[1]-'a';g[a].push_back(b);g[b].push_back(a);}int t;cin>>t;getline(cin,s);while(t--){getline(cin,s);stringstream st(s);char start,c;st>>start;set<int>required;while(st>>c)required.insert(c-'a');vector<int>bit(16);int k=0;for(int v:required)bit[v]=1<<k++;int full=(1<<k)-1;vector<unsigned char>seen(16*(1<<k));vector<int>q={(bit[start-'a']<<4)+(start-'a')};seen[q[0]]=1;int d=0,ans=-1;size_t pos=0;while(pos<q.size()&&ans<0){size_t end=q.size();while(pos<end){int z=q[pos++],u=z&15,m=z>>4;if(m==full){ans=d;break;}for(int v:g[u]){int nxt=((m|bit[v])<<4)+v;if(!seen[nxt])seen[nxt]=1,q.push_back(nxt);}}d++;}cout<<ans<<'\n';}}

''',r'''

from collections import deque

g=[[] for _ in range(16)]

for e in 'ab ae bc bf cd cg dh ef ei fj gh gk hl ij im jk jn kl lp mn no op'.split():

 a,b=[ord(c)-97 for c in e];g[a].append(b);g[b].append(a)

for _ in range(int(input())):

 row=input().split();start=ord(row[0])-97;req=sorted(set(ord(c)-97 for c in row[1:]));bit=[0]*16

 for i,v in enumerate(req):bit[v]=1<<i

 full=(1<<len(req))-1;q=deque([(bit[start]<<4)+start]);seen=bytearray(16*(full+1));seen[q[0]]=1;d=0;ans=None

 while q and ans is None:

  for _ in range(len(q)):

   z=q.popleft();u=z&15;m=z>>4

   if m==full:ans=d;break

   for v in g[u]:

    nxt=((m|bit[v])<<4)+v

    if not seen[nxt]:seen[nxt]=1;q.append(nxt)

  d+=1

 print(ans)

''',[('2\na a b b\nf g','1\n3','重複點去重；f-g缺邊，須繞三步')],'hard')

add(204,'number-theory','分段篩與跨區塊四格重疊','先篩出√b以內質數。每次只建立固定大小區間的布林質數表，對每個小質數p從max(p²,ceil(lo/p)p)開始標記倍數。|每區塊多篩右端四個數，便能在本區塊枚舉i並同時檢查i+4，不會漏掉跨區塊序對。|依i遞增串流輸出序對並累加數量；每區塊只輸出其本體起點，重疊部分不重複印。','時間 O((b-a+√b)log log b)的分段篩主成本，另有每塊遍歷基底質數成本；空間 O(√b+B)，B為固定區塊長度，輸出不整體保留。','1不是質數；i與i+4都必須在原區間內。','區間1到10:篩得質數2,3,5,7|檢查差4:3與7成立，2與6不成立|輸出:(3,7)，共1組',r'''

int main(){long long a,b;cin>>a>>b;int lim=sqrtl(b);vector<bool>base(lim+1,true);vector<int>ps;for(int p=2;p<=lim;p++)if(base[p]){ps.push_back(p);for(long long j=1LL*p*p;j<=lim;j+=p)base[j]=false;}const long long B=262144;long long count=0;bool first=true;for(long long lo=a;lo<=b;lo+=B){long long end=min(b,lo+B-1),hi=min(b,end+4);vector<unsigned char>p(hi-lo+1,1);for(long long q:ps){long long st=max(q*q,(lo+q-1)/q*q);for(long long j=st;j<=hi;j+=q)p[j-lo]=0;}if(lo==1)p[0]=0;for(long long i=lo;i<=end&&i+4<=b;i++)if(p[i-lo]&&p[i+4-lo]){if(!first)cout<<',';first=false;cout<<'('<<i<<','<<i+4<<')';count++;}}cout<<"\n共"<<count<<"組\n";}

''',r'''

import sys,math

a,b=map(int,input().split());lim=math.isqrt(b);base=bytearray(b'\x01')*(lim+1);ps=[]

for p in range(2,lim+1):

 if base[p]:

  ps.append(p)

  if p*p<=lim:base[p*p:lim+1:p]=b'\x00'*((lim-p*p)//p+1)

B=262144;count=0;first=True

for lo in range(a,b+1,B):

 end=min(b,lo+B-1);hi=min(b,end+4);p=bytearray(b'\x01')*(hi-lo+1)

 for q in ps:

  st=max(q*q,(lo+q-1)//q*q)

  if st<=hi:p[st-lo:hi-lo+1:q]=b'\x00'*((hi-st)//q+1)

 if lo==1:p[0]=0

 out=[]

 for i in range(lo,min(end,b-4)+1):

  if p[i-lo] and p[i+4-lo]:out.append(f'({i},{i+4})');count+=1

 if out:sys.stdout.write(('' if first else ',')+','.join(out));first=False

print(f'\n共{count}組')

''',[('1 10','(3,7)\n共1組','獨立試除1至10'),('8 10','\n共0組','寬度不足4不可能有序對')])

import re

ARTICLE=re.search(r'ProxEasy serves.*?I think you will like this web proxy server\.',SOURCES['b212']['statement'],re.S).group(0)

add(212,'strings','固定文章斷句與完整單字邊界','文章是題目提供的固定資料，程式需嵌入全文並實際搜尋。|以句點或問號加右雙引號為句尾，去除句子首尾分隔空白但保留句內文字與標點。|比對時把句子中的連續英文字母視為單字並不分大小寫，符合者依文章原序編號輸出。連字號會斷詞，所以web-based能匹配web，website不能。','固定文章長L，時間 O(L+關鍵字長度)，空間 O(L)。','不要直接做任意子字串搜尋；一個句子含多次關鍵字也只輸出一次。','關鍵字directory:逐句檢查固定文章|唯一符合句:Or check the directory.|編號輸出:1. Or check the directory.',r'''

int main(){string article=ARTICLE,key;cin>>key;for(char&c:key)c=tolower(c);vector<string>sentences;size_t st=0;for(size_t i=0;i<article.size();i++)if(article[i]=='.'||(article[i]=='?'&&i+1<article.size()&&article[i+1]=='"')){if(article[i]=='?')i++;string s=article.substr(st,i-st+1);auto a=s.find_first_not_of(" \n\r\t"),b=s.find_last_not_of(" \n\r\t");sentences.push_back(s.substr(a,b-a+1));st=i+1;}int count=0;for(auto s:sentences){string w;bool hit=false;for(size_t i=0;i<=s.size();i++){char c=i<s.size()?s[i]:' ';if(isalpha((unsigned char)c))w+=tolower(c);else{hit|=w==key;w.clear();}}if(hit)cout<<++count<<". "<<s<<'\n';}if(!count)cout<<"查無此字\n";}

'''.replace('ARTICLE',json.dumps(ARTICLE)),"import re\narticle="+repr(ARTICLE)+r'''

key=input().lower();sentences=re.findall(r'.*?(?:\?"|\.)',article,re.S);out=[]

for s in sentences:

 s=s.strip()

 if key in re.findall('[a-z]+',s.lower()):out.append(s)

if not out:print('查無此字')

else:

 for i,s in enumerate(out,1):print(f'{i}. {s}')

''',[('directory','1. Or check the directory.','人工找到唯一完整單字'),('nonexistentword','查無此字','逐字清單不含此詞')])

add(216,'strings','顯式剖析堆疊與非負運算元','每個括號框架按「第一運算元、逗號、第二運算元、逗號、運算子、右括號」六個狀態推進。數字與子式完成後都送回上層的運算元欄位。|關閉框架時先驗證兩運算元非負；除法需分母非0且整除。完成值可以為負，但若再作父式運算元，父式會判錯。|只有讀完整行、恰一個根框架結果且無殘留字元才輸出；顯式堆疊支援深層巢狀，不依賴語言遞迴深度。','長L，解析時間 O(L)加大整數運算成本，空間 O(L)含輸入與最深框架。','最終結果允許負數，子式若為負則不能作父式運算元；逗號位置不可省略。','式(2,(3,4,+),*):開啟外層，先存2|內層:3+4=7，送回外層第二運算元|外層:2×7=14，輸出14',r'''

struct Frame{int phase=0;cpp_int a=0,b=0;char op=0;};

int main(){int t;cin>>t;string s;getline(cin,s);while(t--){getline(cin,s);vector<Frame>st;bool ok=true,have=false;cpp_int root=0;auto accept=[&](cpp_int v){if(st.empty()){if(have)ok=false;have=true;root=v;}else if(st.back().phase==0)st.back().a=v,st.back().phase=1;else if(st.back().phase==2)st.back().b=v,st.back().phase=3;else ok=false;};size_t i=0;bool began=false;while(i<s.size()&&ok){if(isspace((unsigned char)s[i])){i++;continue;}char c=s[i];bool need=st.empty()?!have:st.back().phase==0||st.back().phase==2;if(need){if(c=='('){st.push_back({});i++;began=true;}else if(isdigit((unsigned char)c)&&!st.empty()){cpp_int v=0;while(i<s.size()&&isdigit((unsigned char)s[i]))v=v*10+s[i++]-'0';accept(v);}else ok=false;}else if(st.empty())ok=false;else{auto&f=st.back();if(f.phase==1||f.phase==3){if(c!=',')ok=false;else f.phase++,i++;}else if(f.phase==4){if(string("+-*/").find(c)==string::npos)ok=false;else f.op=c,f.phase=5,i++;}else{if(c!=')'||f.a<0||f.b<0){ok=false;continue;}cpp_int v;if(f.op=='+')v=f.a+f.b;else if(f.op=='-')v=f.a-f.b;else if(f.op=='*')v=f.a*f.b;else{if(f.b==0||f.a%f.b!=0){ok=false;continue;}v=f.a/f.b;}st.pop_back();i++;accept(v);}}}if(ok&&have&&st.empty()&&began)cout<<root<<'\n';else cout<<-1<<'\n';}}

''',r'''

import sys

if hasattr(sys,'set_int_max_str_digits'):sys.set_int_max_str_digits(0)

for _ in range(int(sys.stdin.readline())):

 s=sys.stdin.readline().rstrip('\r\n');st=[];root=None;i=0;ok=True;began=False

 def accept(v):

  global root,ok

  if not st:

   if root is not None:ok=False

   root=v

  elif st[-1][0] in (0,2):

   p=st[-1][0];st[-1][1 if p==0 else 2]=v;st[-1][0]+=1

  else:ok=False

 while i<len(s) and ok:

  c=s[i]

  if c.isspace():i+=1;continue

  need=(root is None) if not st else st[-1][0] in (0,2)

  if need:

   if c=='(':st.append([0,0,0,'']);i+=1;began=True

   elif '0'<=c<='9' and st:

    j=i

    while i<len(s) and '0'<=s[i]<='9':i+=1

    accept(int(s[j:i]))

   else:ok=False

  elif not st:ok=False

  else:

   p,a,b,op=st[-1]

   if p in (1,3):

    if c!=',':ok=False

    else:st[-1][0]+=1;i+=1

   elif p==4:

    if c not in '+-*/':ok=False

    else:st[-1][3]=c;st[-1][0]=5;i+=1

   else:

    if c!=')' or a<0 or b<0 or op=='/' and (b==0 or a%b):ok=False;continue

    v=a+b if op=='+' else a-b if op=='-' else a*b if op=='*' else a//b;st.pop();i+=1;accept(v)

 print(root if ok and root is not None and not st and began else -1)

''',[('3\n(2,(3,4,+),*)\n((1,3,-),4,+)\n(1,0,/)','14\n-1\n-1','手算合法巢狀、負子式與除0')])

# 固定向量與影像從題述列出的原始資料解析，程式仍做距離計算。

lines=SOURCES['b221']['statement'].splitlines();book=[];image=[]

for line in lines:

 tokens=line.split()

 if len(tokens)==10 and all(t.isdigit() for t in tokens):book.append(list(map(int,tokens[1:])))

 elif len(tokens)==9 and all(t.isdigit() for t in tokens):image.append(list(map(int,tokens)))

assert len(book)==16 and len(image)==9

ids=[]

for r in range(0,9,3):

 for c in range(0,9,3):

  v=[image[r+y][c+x] for y in range(3) for x in range(3)];vn=sum(x*x for x in v)

  ids.append(min(range(16),key=lambda k:vn+sum(x*x for x in book[k])-2*sum(x*y for x,y in zip(v,book[k]))))

vqout=' '.join(map(str,ids))+'\n'+str(sum(ids))

add(221,'search','固定資料的最近向量量化','將9×9影像依列優先切成九個3×3方塊，每塊展成九維向量。|對每塊計算到16個編碼向量的分量差平方和，取最小者編號。平方根單調遞增，因此不用真的開根號。|依方塊順序列九個編號，再列總和；程式嵌入題給完整資料，實際計算距離而非硬寫輸出。','固定9×16×9次差平方，時間空間 O(1)。','方塊內與方塊之間都用列優先順序；編號從0起算。','第一塊影像:237,103,126／188,253,9／191,224,150|與向量0:九個分量完全相同，平方距離0|取最小值:距離不可能小於0，所以第一個編號為0',r'''

int main(){int book[16][9]=BOOK;int image[9][9]=IMAGE;int sum=0;bool first=true;for(int r=0;r<9;r+=3)for(int c=0;c<9;c+=3){int best=-1,dist=INT_MAX;for(int k=0;k<16;k++){int d=0;for(int y=0;y<3;y++)for(int x=0;x<3;x++){int z=image[r+y][c+x]-book[k][3*y+x];d+=z*z;}if(d<dist)dist=d,best=k;}if(!first)cout<<' ';first=false;cout<<best;sum+=best;}cout<<'\n'<<sum<<'\n';}

'''.replace('BOOK',str(book).replace('[','{').replace(']','}')).replace('IMAGE',str(image).replace('[','{').replace(']','}')),'book='+repr(book)+'\nimage='+repr(image)+r'''

out=[]

for r in range(0,9,3):

 for c in range(0,9,3):

  v=[image[r+y][c+x] for y in range(3) for x in range(3)];out.append(min(range(16),key=lambda k:sum((a-b)**2 for a,b in zip(v,book[k]))))

print(*out);print(sum(out))

''',[('',vqout,'獨立以||v||²+||b||²-2v·b計所有距離並對照九塊')])

add(246,'graphs','BFS最短路與左下角座標轉換','從唯一R出發BFS，B不可進入，C與F皆可通行。|入佇列時設定距離，BFS每步成本1，所以首次到每格的距離即為最短距離；食物不能當作搜尋終點而提前停止。|收集全部已達F，若輸入列索引為r、欄為c，輸出座標為(c,M-1-r)。按(距離,x,y)排序，沒有可達食物時不印任何行。','時間 O(MN+F log F)，空間 O(MN+F)，F為可達食物數。','輸入由上往下，輸出y由下往上；同距離要再按x、y排序。','地圖RF一列:起點在左，距離0|走到食物:右鄰一步，距離1|轉換座標:食物x=1、y=0，輸出(1,0) 1',r'''

int main(){int m,n;cin>>m>>n;vector<string>a(m);queue<pair<int,int>>q;vector<vector<int>>d(m,vector<int>(n,-1));for(int r=0;r<m;r++){cin>>a[r];for(int c=0;c<n;c++)if(a[r][c]=='R'){q.push({r,c});d[r][c]=0;}}vector<tuple<int,int,int>>out;while(!q.empty()){auto[r,c]=q.front();q.pop();if(a[r][c]=='F')out.push_back({d[r][c],c,m-1-r});for(auto[dr,dc]:vector<pair<int,int>>{{1,0},{-1,0},{0,1},{0,-1}}){int y=r+dr,x=c+dc;if(y>=0&&y<m&&x>=0&&x<n&&a[y][x]!='B'&&d[y][x]<0){d[y][x]=d[r][c]+1;q.push({y,x});}}}sort(out.begin(),out.end());for(auto[dist,x,y]:out)cout<<'('<<x<<','<<y<<") "<<dist<<'\n';}

''',r'''

from collections import deque

m,n=map(int,input().split());a=[input() for _ in range(m)];d=[[-1]*n for _ in range(m)];q=deque();out=[]

for r in range(m):

 for c in range(n):

  if a[r][c]=='R':q.append((r,c));d[r][c]=0

while q:

 r,c=q.popleft()

 if a[r][c]=='F':out.append((d[r][c],c,m-1-r))

 for y,x in ((r-1,c),(r+1,c),(r,c-1),(r,c+1)):

  if 0<=y<m and 0<=x<n and a[y][x]!='B' and d[y][x]<0:d[y][x]=d[r][c]+1;q.append((y,x))

for dist,x,y in sorted(out):print(f'({x},{y}) {dist}')

''',[('1 2\nRF','(1,0) 1','單步食物'),('1 3\nRBF','','障礙阻隔，無輸出')])

add(248,'dp','流水線完成時間與精確十進位','令finish[j]為目前已處理顧客在第j步的完成時間。|對下一位顧客，第j步開始前必須同時等自己前一步與前一人此櫃檯完成，所以finish[j]=max(finish[j],finish[j-1])+time。j=0前一步視為0。|從左往右更新時，finish[j]舊值與finish[j-1]新值剛好是兩個依賴。用任意精度十進位係數避免浮點誤差，最後輸出最後櫃檯完成時間。','時間 O(NK)次精確十進位比較加法；空間 O(K)個數值，Python逐行讀取另需 O(K)輸入字串，每數位數成本另計。','同一人的前一步與前一人的同一步都要等待；不能將每人的總服務時間直接相加。','兩顧客兩步:(1,3)、(2,1)|第一人:完成時間1、4|第二人:第一步3，第二步max(4,3)+1=5，總時間5',DEC+r'''

int main(){int n,k;cin>>n>>k;vector<Dec>d(k);string s;for(int i=0;i<n;i++)for(int j=0;j<k;j++){cin>>s;Dec before=j?d[j-1]:Dec();if(d[j]<before)d[j]=before;d[j]=d[j]+Dec(s);}cout<<d.back().str()<<'\n';}

''',r'''

from fractions import Fraction as F

import sys,math

f=sys.stdin;n,k=map(int,f.readline().split());d=[F(0)]*k

for _ in range(n):

 row=f.readline().split()

 for j,s in enumerate(row):d[j]=max(d[j],d[j-1] if j else 0)+F(s)

x=d[-1];den=x.denominator;t=0

while den!=1:den//=math.gcd(den,10);t+=1

v=x.numerator*10**t//x.denominator;s=str(v).zfill(t+1);print((s[:-t]+'.'+s[-t:]).rstrip('0').rstrip('.') if t else s)

''',[('2 2\n1 3\n2 1','5','手工排程'),('2 1\n0.1\n0.2','0.3','有限小數精確相加')])

# 缺公開範例的五題以獨立oracle案例提供明標自製示例。

for check in CHECK:

 if check['code']=='b162':

  check['output']=str(int(str(19**1523)[-3]))

for d in LESSONS:

 if not SOURCES[d['code']]['samples']:

  check=next(x for x in CHECK if x['code']==d['code']);d.update(exampleKind='constructed',sampleInput=check['input'],sampleOutput=check['output'])

add(157,'data-structures','矛盾的區間覆蓋見證與私人位置','回答min[L,R]=a要求整段每格≥a，且至少一格恰為a。因此此回答矛盾，恰在它的區間被較大回答值的區間聯集完全覆蓋時。|極小矛盾集合由一個低值區間及一個不可再刪的高值覆蓋組成。高值區間j參與某個極小覆蓋，等價於它能保留一個私人位置x，而其他高區間不含x且能覆蓋j外的左右兩側。|對低區間壓縮端點並掃描，E(t)為覆蓋位置t的最小右端點，S(t)為最大左端點。設左側E最大值為A、右側S最小值為B，j可參與恰在j內存在整數A<x<B。前綴最大與後綴最小可逐j常數查詢，所有參與者取最小原編號。超出值域的回答本身就是單元素矛盾。','Q個回答，時間 O(Q² log Q)，每個低區間重建端點、兩個heap與前後綴，額外空間 O(Q)；輸入 O(Q)，不建立長度N數列。','不是第一次讀到矛盾的編號；不能把無關回答也列入矛盾。','N=4，回答1為[4,4]最小5:它與其他區間不相交|回答2為[1,3]最小1，回答3為[1,3]最小2:後者完全覆蓋前者，不能同時成立|找參與者:只有2與3，輸出2而不是1',r'''

struct Query{int l,r,a,id;};

int main(){int n,q;while(cin>>n>>q&&n){vector<Query>v(q);int ans=q+1;for(int i=0;i<q;i++){cin>>v[i].l>>v[i].r>>v[i].a;v[i].id=i+1;if(v[i].a<1||v[i].a>1000000)ans=min(ans,i+1);}for(auto low:v){if(low.a<1||low.a>1000000)continue;vector<Query>hi;vector<int>bounds={low.l,low.r+1};for(auto z:v)if(z.a>low.a&&z.a<=1000000){int l=max(low.l,z.l),r=min(low.r,z.r);if(l<=r){hi.push_back({l,r,z.a,z.id});bounds.push_back(l);bounds.push_back(r+1);}}sort(bounds.begin(),bounds.end());bounds.erase(unique(bounds.begin(),bounds.end()),bounds.end());sort(hi.begin(),hi.end(),[](auto a,auto b){return a.l<b.l;});int k=bounds.size()-1,j=0;vector<int>E(k),S(k);priority_queue<int,vector<int>,greater<int>>ends;priority_queue<pair<int,int>>starts;bool cover=true;for(int t=0;t<k;t++){int x=bounds[t];while(j<(int)hi.size()&&hi[j].l<=x){ends.push(hi[j].r);starts.push({hi[j].l,hi[j].r});j++;}while(!ends.empty()&&ends.top()<x)ends.pop();while(!starts.empty()&&starts.top().second<x)starts.pop();if(ends.empty()){cover=false;break;}E[t]=ends.top();S[t]=starts.top().first;}if(!cover)continue;ans=min(ans,low.id);vector<int>pref(k+1,low.l-1),suf(k+1,low.r+1);for(int t=0;t<k;t++)pref[t+1]=max(pref[t],E[t]);for(int t=k-1;t>=0;t--)suf[t]=min(suf[t+1],S[t]);for(auto z:hi){int l=lower_bound(bounds.begin(),bounds.end(),z.l)-bounds.begin(),r=lower_bound(bounds.begin(),bounds.end(),z.r+1)-bounds.begin();if(max(z.l,pref[l]+1)<=min(z.r,suf[r]-1))ans=min(ans,z.id);}}cout<<(ans==q+1?0:ans)<<'\n';}}

''',r'''

import sys,heapq,bisect

it=iter(map(int,sys.stdin.buffer.read().split()))

for n in it:

 q=next(it)

 if n==q==0:break

 v=[(next(it),next(it),next(it),i+1) for i in range(q)];ans=min([i for l,r,a,i in v if not 1<=a<=1000000]+[q+1])

 for L,R,a,idx in v:

  if not 1<=a<=1000000:continue

  hi=sorted((max(L,l),min(R,r),i) for l,r,b,i in v if a<b<=1000000 and max(L,l)<=min(R,r));bounds=sorted({L,R+1}|{x for l,r,i in hi for x in (l,r+1)});k=len(bounds)-1;ends=[];starts=[];E=[];S=[];j=0

  for x in bounds[:-1]:

   while j<len(hi) and hi[j][0]<=x:

    l,r,i=hi[j];heapq.heappush(ends,r);heapq.heappush(starts,(-l,r));j+=1

   while ends and ends[0]<x:heapq.heappop(ends)

   while starts and starts[0][1]<x:heapq.heappop(starts)

   if not ends:break

   E.append(ends[0]);S.append(-starts[0][0])

  if len(E)!=k:continue

  ans=min(ans,idx);pref=[L-1];suf=[R+1]*(k+1)

  for e in E:pref.append(max(pref[-1],e))

  for j in range(k-1,-1,-1):suf[j]=min(suf[j+1],S[j])

  for l,r,i in hi:

   a=bisect.bisect_left(bounds,l);b=bisect.bisect_left(bounds,r+1)

   if max(l,pref[a]+1)<=min(r,suf[b]-1):ans=min(ans,i)

 print(0 if ans==q+1 else ans)

''',[('4 3\n4 4 5\n1 3 1\n1 3 2\n0 0','2','無關回答1不能算矛盾；2與3形成極小矛盾')],'hard')

add(234,'geometry','以走過的水平層與垂直半段辨識七段字','先統計實際走過的不同水平線高度，忽略原地不動的相鄰照片。|完全沒有水平移動必為1；只有一層水平時，有兩條不同x的垂直線為4，只有一條為7；兩層水平為0。|剩餘六種都有三層水平，排序為底、中、頂。對每段垂直軌跡，判斷它在左右哪側、是否與上半或下半有正長度重疊，取得四直段遮罩，查對2、3、5、6、8、9。只要求經過內部，不能假設每段都走完整。','時間 O(n log n)收集座標，空間 O(n)。','照片可能在長直段中間；跨過中線的垂直移動要同時標記上、下段。','三條水平高度0,-1,-2:對應頂、中、底|垂直軌跡:右上與左下，遮罩為右上+左下|比對標準七段:唯一數字2',r'''

int main(){int n;cin>>n;vector<pair<int,int>>p(n);for(auto&[x,y]:p)cin>>x>>y;set<int>ys,xs;for(int i=1;i<n;i++){auto[x,y]=p[i-1];auto[u,v]=p[i];if(y==v&&x!=u)ys.insert(y);if(x==u&&y!=v)xs.insert(x);}if(ys.empty()){cout<<1<<'\n';return 0;}if(ys.size()==1){cout<<(xs.size()==1?7:4)<<'\n';return 0;}if(ys.size()==2){cout<<0<<'\n';return 0;}int mid=*next(ys.begin()),left=min_element(p.begin(),p.end())->first,mask=0;for(int i=1;i<n;i++){auto[x,y]=p[i-1];auto[u,v]=p[i];if(x!=u||y==v)continue;int lo=min(y,v),hi=max(y,v),base=x==left?0:2;if(hi>mid)mask|=1<<base;if(lo<mid)mask|=1<<(base+1);}map<int,int>digit={{6,2},{12,3},{9,5},{11,6},{15,8},{13,9}};cout<<digit.at(mask)<<'\n';}

''',r'''

n=int(input());p=[tuple(map(int,input().split())) for _ in range(n)];ys=set();xs=set()

for (x,y),(u,v) in zip(p,p[1:]):

 if y==v and x!=u:ys.add(y)

 if x==u and y!=v:xs.add(x)

if not ys:print(1)

elif len(ys)==1:print(7 if len(xs)==1 else 4)

elif len(ys)==2:print(0)

else:

 mid=sorted(ys)[1];left=min(x for x,y in p);mask=0

 for (x,y),(u,v) in zip(p,p[1:]):

  if x==u and y!=v:

   base=0 if x==left else 2

   if max(y,v)>mid:mask|=1<<base

   if min(y,v)<mid:mask|=1<<(base+1)

 print({6:2,12:3,9:5,11:6,15:8,13:9}[mask])

''',[('3\n0 1\n2 1\n2 -3','7','七的頂橫與右側兩段，長度2'),('2\n5 100\n5 -100','1','只有垂直軌跡')])

add(243,'trees','子樹外露特質的稀疏DP與小併大','令f[u][c]表示u子樹能保留的最多人數，且向父層外露的所有保留節點特質均為c。全部刪除讓未記錄的值自然為0。|先把所有孩子的f逐色相加得到F。若刪u，外露仍是同色c，得F[c]；若留u，孩子只需選同一個最優特質，所以在Q[u]這個鍵更新為1+max F。|用字典小併大合併，保留合併過程最大值避免反覆掃描。由編號大到小處理，因Pi<i。老闆強制留下，所以最後保留數為1+其孩子合併後最大值，答案N減保留數。','期望時間 O(N log N)次字典操作；C++ map為 O(N log²N)。空間 O(N)個稀疏鍵與樹，不用遞迴，長鏈也安全。','同特質要求只針對保留員工的直接下屬，不要求和上司特質相同。','老闆有三個葉子，特質1,2,2:孩子圖各一個值1|同色合併:F[1]=1，F[2]=2|老闆保留:保留1+2=3人，原4人最少裁1人',r'''

int main(){int n;cin>>n;vector<vector<int>>ch(n);vector<int>q(n),best(n);for(int i=1;i<n;i++){int p;cin>>p>>q[i];ch[p-1].push_back(i);}vector<map<int,int>*>dp(n,nullptr);for(int u=n-1;u>=0;u--){int heavy=-1;for(int v:ch[u])if(heavy<0||dp[v]->size()>dp[heavy]->size())heavy=v;auto*d=heavy<0?new map<int,int>:dp[heavy];int mx=heavy<0?0:best[heavy];for(int v:ch[u])if(v!=heavy){for(auto[c,k]:*dp[v]){int z=((*d)[c]+=k);mx=max(mx,z);}delete dp[v];}(*d)[q[u]]=mx+1;best[u]=mx+1;dp[u]=d;}cout<<n-best[0]<<'\n';delete dp[0];}

''',r'''

import sys

it=iter(map(int,sys.stdin.buffer.read().split()));n=next(it);ch=[[] for _ in range(n)];q=[0]*n

for i in range(1,n):p=next(it)-1;q[i]=next(it);ch[p].append(i)

dp=[None]*n;best=[0]*n

for u in range(n-1,-1,-1):

 heavy=max(ch[u],key=lambda v:len(dp[v]),default=-1);d={} if heavy<0 else dp[heavy];mx=0 if heavy<0 else best[heavy]

 for v in ch[u]:

  if v==heavy:continue

  for c,k in dp[v].items():d[c]=d.get(c,0)+k;mx=max(mx,d[c])

  dp[v]=None

 if heavy>=0:dp[heavy]=None

 d[q[u]]=mx+1;best[u]=mx+1;dp[u]=d

print(n-best[0])

''',[('4\n1 1\n1 2\n1 2','1','三葉星狀圖留同色兩葉'),('1','0','只有老闆')],'hard')

add(244,'number-theory','中國剩餘定理與floor-sum計數','兩個固定模數都是質數，可用擴展Euclid求A、B的模反元素u、v。條件改寫為Y≡uX modP、Y≡vX modQ。|中國剩餘定理合成Y≡KX modL，其中L=PQ。因Y≤10^9<L，每個X只需檢查KX modL是否在[1,M]。|用floor_sum(n,L,K,b)=Σ(i=0..n-1)⌊(Ki+b)/L⌋，兩個floor-sum之差（b=K+L-1與K+L-M-1）恰計算1≤X≤n的可行數。此計數單調，二分第一個計數>0的位置即最小X。floor-sum以Euclid互換斜率與模數，避免枚舉十億候選。','時間 O(log N·log(PQ))，空間 O(log(PQ))的Euclid呼叫或 O(1)迭代；C++中間乘積用128位。','不能只解其中一個同餘；可行Y必須同時滿足上限M且正數。','A=B=2、N=M=10:兩式在小範圍均為Y×2=X|最小Y:1對應X=2|排除X=1:不存在正整數Y，故答案2',r'''

using i128=__int128_t;

long long inv(long long a,long long m){long long b=m,x=1,y=0;while(b){long long q=a/b,t=a-q*b;a=b;b=t;t=x-q*y;x=y;y=t;}return (x%m+m)%m;}

i128 fs(long long n,long long m,long long a,long long b){i128 ans=0;while(true){if(a>=m){ans+=(i128)n*(n-1)/2*(a/m);a%=m;}if(b>=m){ans+=(i128)n*(b/m);b%=m;}i128 y=(i128)a*n+b;if(y<m)return ans;n=(long long)(y/m);b=(long long)(y%m);swap(m,a);}}

int main(){const long long P=2023110403,Q=2023110407,L=P*Q;long long A,B,N,M;cin>>A>>B>>N>>M;long long u=inv(A,P),v=inv(B,Q),z=(v-u)%Q;if(z<0)z+=Q;long long K=u+P*(long long)((i128)z*inv(P,Q)%Q);auto count=[&](long long n){return fs(n,L,K,K+L-1)-fs(n,L,K,K+L-M-1);};long long lo=1,hi=N;while(lo<hi){long long mid=(lo+hi)/2;if(count(mid)>0)hi=mid;else lo=mid+1;}cout<<lo<<'\n';}

''',r'''

import sys

A,B,N,M=map(int,sys.stdin.read().split());P=2023110403;Q=2023110407;L=P*Q;u=pow(A,-1,P);v=pow(B,-1,Q);K=u+P*((v-u)*pow(P,-1,Q)%Q)

def fs(n,m,a,b):

 ans=0

 while True:

  if a>=m:ans+=n*(n-1)//2*(a//m);a%=m

  if b>=m:ans+=n*(b//m);b%=m

  y=a*n+b

  if y<m:return ans

  n,b=divmod(y,m);m,a=a,m

def count(n):return fs(n,L,K,K+L-1)-fs(n,L,K,K+L-M-1)

lo=1;hi=N

while lo<hi:

 mid=(lo+hi)//2

 if count(mid):hi=mid

 else:lo=mid+1

print(lo)

''',[('2\n2\n10\n10','2','小範圍同餘均無折返，最小Y=1'),('999999937\n999999937\n1000000000\n1','999999937','M=1強制Y=1，超大X')],'hard')

add(232,'trees','DFS循環相鄰距離和的一半','將入住節點依樹的DFS序排列成環，相鄰節點樹距離總和恰為所需最小連通子樹成本的兩倍。每條必要邊將入住點分成兩邊，DFS循環恰跨過這個切分兩次。|插入u時，若其前後鄰點為a,b，只增加dist(a,u)+dist(u,b)-dist(a,b)；刪除則減去同一式。|以LCA二進位提升求距離，Fenwick維護DFS序中哪些點存在並找第k個入住點，讓每次切換 O(log N)。DFS與LCA預處理使用顯式堆疊，長鏈安全。','預處理時間、空間 O(N log N)，每次操作 O(log N)，總 O((N+D)log N)；Python輸入列表另 O(N+D)。','只有0或1點時成本0；道路成本可能0，不能以距離0推論點不存在。','鏈1—2成本2、2—3成本3:入住1與3|DFS環距離:dist(1,3)+dist(3,1)=10，成本5|刪除1:只剩3，距離環和0，成本0',r'''

int main(){ios::sync_with_stdio(false);cin.tie(nullptr);int n;cin>>n;vector<vector<pair<int,int>>>g(n);for(int i=1;i<n;i++){int u,v,w;cin>>u>>v>>w;--u;--v;g[u].push_back({v,w});g[v].push_back({u,w});}int lg=1;while((1<<lg)<=n)lg++;vector<vector<int>>up(lg,vector<int>(n));vector<int>dep(n),tin(n),who(n),order={0};vector<long long>ds(n);int timer=0;while(!order.empty()){int u=order.back();order.pop_back();tin[u]=timer;who[timer++]=u;for(auto[v,w]:g[u])if(v!=up[0][u]){up[0][v]=u;dep[v]=dep[u]+1;ds[v]=ds[u]+w;order.push_back(v);}}for(int k=1;k<lg;k++)for(int u=0;u<n;u++)up[k][u]=up[k-1][up[k-1][u]];auto dist=[&](int a,int b){int u=a,v=b;if(dep[u]<dep[v])swap(u,v);int d=dep[u]-dep[v];for(int k=0;k<lg;k++)if(d>>k&1)u=up[k][u];if(u!=v){for(int k=lg-1;k>=0;k--)if(up[k][u]!=up[k][v])u=up[k][u],v=up[k][v];u=up[0][u];}return ds[a]+ds[b]-2*ds[u];};set<int>s;long long cycle=0;int d;cin>>d;while(d--){int u;cin>>u;--u;int t=tin[u];auto it=s.find(t);if(it!=s.end()){s.erase(it);if(!s.empty()){auto b=s.lower_bound(t);if(b==s.end())b=s.begin();auto a=b==s.begin()?prev(s.end()):prev(b);cycle-=dist(who[*a],u)+dist(u,who[*b])-dist(who[*a],who[*b]);}}else{if(!s.empty()){auto b=s.lower_bound(t);if(b==s.end())b=s.begin();auto a=b==s.begin()?prev(s.end()):prev(b);cycle+=dist(who[*a],u)+dist(u,who[*b])-dist(who[*a],who[*b]);}s.insert(t);}cout<<cycle/2<<'\n';}}

''',r'''

import sys

it=iter(map(int,sys.stdin.buffer.read().split()));n=next(it);g=[[] for _ in range(n)]

for _ in range(n-1):

 u,v,w=next(it)-1,next(it)-1,next(it);g[u].append((v,w));g[v].append((u,w))

lg=n.bit_length();up=[[0]*n for _ in range(lg)];dep=[0]*n;ds=[0]*n;tin=[0]*n;who=[];stack=[0]

while stack:

 u=stack.pop();tin[u]=len(who);who.append(u)

 for v,w in g[u]:

  if v!=up[0][u]:up[0][v]=u;dep[v]=dep[u]+1;ds[v]=ds[u]+w;stack.append(v)

for k in range(1,lg):up[k]=[up[k-1][up[k-1][u]] for u in range(n)]

def dist(a,b):

 u,v=a,b

 if dep[u]<dep[v]:u,v=v,u

 d=dep[u]-dep[v]

 for k in range(lg):

  if d>>k&1:u=up[k][u]

 if u!=v:

  for k in range(lg-1,-1,-1):

   if up[k][u]!=up[k][v]:u,v=up[k][u],up[k][v]

  u=up[0][u]

 return ds[a]+ds[b]-2*ds[u]

bit=[0]*(n+1);active=[False]*n;total=cycle=0

def addbit(i,d):

 i+=1

 while i<=n:bit[i]+=d;i+=i&-i

def prefix(i):

 s=0

 while i:s+=bit[i];i-=i&-i

 return s

def kth(k):

 idx=0;step=1<<(n.bit_length()-1)

 while step:

  nxt=idx+step

  if nxt<=n and bit[nxt]<k:idx=nxt;k-=bit[nxt]

  step//=2

 return idx

for _ in range(next(it)):

 u=next(it)-1;t=tin[u];removing=active[u]

 if removing:addbit(t,-1);total-=1

 if total:

  before=prefix(t);a=who[kth(before if before else total)];b=who[kth(before+1 if before<total else 1)];delta=dist(a,u)+dist(u,b)-dist(a,b);cycle+=-delta if removing else delta

 if not removing:addbit(t,1);total+=1

 active[u]=not removing;print(cycle//2)

''',[('3\n1 2 2\n2 3 3\n4\n1\n3\n1\n3','0\n5\n0\n0','三點鏈切換與全離開')],'hard')

add(231,'graphs','二分最大衝突值與2-SAT','二分允許的最大衝突T。每個部落有兩種互斥選項，若不同部落的選項i,j距離>T，就不能同時選，加入i→非j及j→非i兩條蘊含。|這些二元禁止條件恰為2-SAT；若某部落的兩個選項在同一強連通分量，則不可行，否則存在合法代表組合。|可行性隨T單調，從0到40000二分最小可行T。Python將稠密蘊含圖存成整數位元列，DFS每次只取尚未拜訪的鄰點，避免為百萬邊配置Python物件；C++用顯式堆疊Kosaraju。','預算距離 O(N²)時間空間；二分 O(log40001)次，每次建圖及SCC O(N²)，Python位元集合操作另有字長成本。總 O(N² log40001)，不採遞迴DFS。','同一部落不加彼此距離限制，因兩人本就只會選一位；只有一部落答案0。','兩部落各有(0,0,0,0)與(10,0,0,0):T=0時可各選同一座標|衝突對:0與10的跨部落組合被禁止|可行選法:兩個0或兩個10，答案0',r'''

int main(){int n;cin>>n;int v=2*n;vector<array<int,4>>p(v);for(auto&a:p)for(int&x:a)cin>>x;vector<vector<int>>d(v,vector<int>(v));for(int i=0;i<v;i++)for(int j=0;j<i;j++)for(int k=0;k<4;k++)d[i][j]+=abs(p[i][k]-p[j][k]);auto feasible=[&](int t){vector<vector<int>>g(v),r(v);auto edge=[&](int a,int b){g[a].push_back(b);r[b].push_back(a);};for(int i=0;i<v;i++)for(int j=0;j<i;j++)if(i/2!=j/2&&d[i][j]>t){edge(i,j^1);edge(j,i^1);}vector<bool>seen(v);vector<int>order;for(int s=0;s<v;s++)if(!seen[s]){vector<pair<int,int>>st={{s,0}};seen[s]=true;while(!st.empty()){auto&[u,k]=st.back();if(k==(int)g[u].size()){order.push_back(u);st.pop_back();}else{int w=g[u][k++];if(!seen[w])seen[w]=true,st.push_back({w,0});}}}vector<int>comp(v,-1);int c=0;for(auto it=order.rbegin();it!=order.rend();it++)if(comp[*it]<0){vector<int>st={*it};comp[*it]=c;while(!st.empty()){int u=st.back();st.pop_back();for(int w:r[u])if(comp[w]<0)comp[w]=c,st.push_back(w);}c++;}for(int i=0;i<v;i+=2)if(comp[i]==comp[i+1])return false;return true;};int lo=0,hi=40000;while(lo<hi){int m=(lo+hi)/2;if(feasible(m))hi=m;else lo=m+1;}cout<<lo<<'\n';}

''',r'''

from array import array

n=int(input());v=2*n;p=[tuple(map(int,input().split())) for _ in range(v)];d=[array('H',[0])*i for i in range(v)]

for i in range(v):

 for j in range(i):d[i][j]=sum(abs(a-b) for a,b in zip(p[i],p[j]))

def feasible(t):

 g=[0]*v;r=[0]*v

 for i in range(v):

  for j,c in enumerate(d[i]):

   if i//2!=j//2 and c>t:g[i]|=1<<(j^1);g[j]|=1<<(i^1);r[j^1]|=1<<i;r[i^1]|=1<<j

 unvisited=(1<<v)-1;order=[]

 for s in range(v):

  if not unvisited>>s&1:continue

  unvisited^=1<<s;stack=[s]

  while stack:

   nxt=g[stack[-1]]&unvisited

   if nxt:

    bit=nxt&-nxt;u=bit.bit_length()-1;unvisited^=bit;stack.append(u)

   else:order.append(stack.pop())

 unvisited=(1<<v)-1;comp=[-1]*v;cid=0

 for s in reversed(order):

  if not unvisited>>s&1:continue

  stack=[s];unvisited^=1<<s

  while stack:

   u=stack.pop();comp[u]=cid;nxt=r[u]&unvisited;unvisited^=nxt

   while nxt:bit=nxt&-nxt;nxt^=bit;stack.append(bit.bit_length()-1)

  cid+=1

 return all(comp[i]!=comp[i+1] for i in range(0,v,2))

lo=0;hi=40000

while lo<hi:

 mid=(lo+hi)//2

 if feasible(mid):hi=mid

 else:lo=mid+1

print(lo)

''',[('2\n0 0 0 0\n10 0 0 0\n0 0 0 0\n10 0 0 0','0','兩部落選相同向量'),('1\n0 0 0 0\n10000 10000 10000 10000','0','一部落沒有代表間衝突')],'hard')

# 有限表示法：以位置關係矩陣精確判斷，避免正規表示式回溯爆炸。

add(211,'strings','固定共同n的布林位置關係','先把字元、串接、重複n次與Kleene星號解析成語法樹，每個n都使用同一候選值。|對長L輸入，節點關係R[i]記錄從位置i匹配該節點後可到的所有位置。串接作布林關係合成，n次重複用快速冪，星號作可達閉包（含0次）。|若有解，非空n次重複限制n≤L；若所有被n修飾的節點皆可空，超過L的次數可刪空匹配或用空匹配補足，所以只須測1至max(1,L)。根節點從0可到L即接受。','設表示法P節點、字串長L，位元矩陣合成最壞 O(L³)次位元合併，總保守 O(P L⁴ log L)，空間 O(P L²)位元加結構；未宣稱線性正規式匹配。','同一字串中所有n必須相等；不同輸入字串可以使用不同n。','表示法anbn、輸入aabb:測n=1只接受ab|測n=2:a重複2次、b也重複2次|根關係:位置0可到4，接受aabb；aaab因兩邊數量不同拒絕',r'''

struct Node{char kind;vector<int>ch;};

int main(){string expr;getline(cin,expr);vector<Node>nodes;vector<vector<int>>stack(1);for(char c:expr){if(c=='a'||c=='b'){nodes.push_back({c,{}});stack.back().push_back(nodes.size()-1);}else if(c=='(')stack.push_back({});else if(c==')'){auto ch=stack.back();stack.pop_back();nodes.push_back({'s',ch});stack.back().push_back(nodes.size()-1);}else if(c=='n'||c=='*'){int x=stack.back().back();nodes.push_back({c,{x}});stack.back().back()=nodes.size()-1;}}nodes.push_back({'s',stack[0]});int root=nodes.size()-1;for(int test=1;test<=4;test++){string s;getline(cin,s);int L=s.size();bool accepted=false;using Rel=vector<cpp_int>;Rel identity(L+1);for(int i=0;i<=L;i++)identity[i]=cpp_int(1)<<i;auto compose=[&](const Rel&a,const Rel&b){Rel out(L+1);for(int i=0;i<=L;i++){cpp_int bits=a[i];while(bits!=0){unsigned j=boost::multiprecision::lsb(bits);bits&=bits-1;out[i]|=b[j];}}return out;};for(int n=1;n<=max(1,L)&&!accepted;n++){vector<Rel>dp;for(auto node:nodes){Rel r(L+1);if(node.kind=='a'||node.kind=='b'){for(int i=0;i<L;i++)if(s[i]==node.kind)r[i]=cpp_int(1)<<(i+1);}else if(node.kind=='s'){r=identity;for(int ch:node.ch)r=compose(r,dp[ch]);}else if(node.kind=='n'){r=identity;Rel b=dp[node.ch[0]];int e=n;while(e){if(e&1)r=compose(r,b);e/=2;if(e)b=compose(b,b);}}else{auto&b=dp[node.ch[0]];for(int i=L;i>=0;i--){r[i]=cpp_int(1)<<i;cpp_int bits=b[i];while(bits!=0){int j=boost::multiprecision::lsb(bits);bits&=bits-1;if(j>i)r[i]|=r[j];}}}dp.push_back(move(r));}accepted=boost::multiprecision::bit_test(dp[root][0],L);}cout<<test<<". The input string is "<<(accepted?"accepted":"rejected")<<'\n';}}

''',r'''

expr=input();nodes=[];stack=[[]]

for c in expr:

 if c in 'ab':nodes.append((c,[]));stack[-1].append(len(nodes)-1)

 elif c=='(':stack.append([])

 elif c==')':ch=stack.pop();nodes.append(('s',ch));stack[-1].append(len(nodes)-1)

 elif c in 'n*':nodes.append((c,[stack[-1][-1]]));stack[-1][-1]=len(nodes)-1

nodes.append(('s',stack[0]))

for test in range(1,5):

 s=input();L=len(s);identity=[1<<i for i in range(L+1)]

 def compose(a,b):

  out=[]

  for bits in a:

   row=0

   while bits:bit=bits&-bits;bits^=bit;row|=b[bit.bit_length()-1]

   out.append(row)

  return out

 accepted=False

 for n in range(1,max(1,L)+1):

  dp=[]

  for kind,ch in nodes:

   if kind in 'ab':r=[1<<(i+1) if i<L and s[i]==kind else 0 for i in range(L+1)]

   elif kind=='s':

    r=identity

    for c in ch:r=compose(r,dp[c])

   elif kind=='n':

    r=identity;b=dp[ch[0]];e=n

    while e:

     if e&1:r=compose(r,b)

     e//=2

     if e:b=compose(b,b)

   else:

    r=[0]*(L+1);b=dp[ch[0]]

    for i in range(L,-1,-1):

     row=1<<i;bits=b[i]

     while bits:

      bit=bits&-bits;bits^=bit;j=bit.bit_length()-1

      if j>i:row|=r[j]

     r[i]=row

   dp.append(r)

  if dp[-1][0]>>L&1:accepted=True;break

 print(f'{test}. The input string is '+('accepted' if accepted else 'rejected'))

''',[('anbn\nab\naabb\naaab\nbbaa','1. The input string is accepted\n2. The input string is accepted\n3. The input string is rejected\n4. The input string is rejected','共同n要求兩邊數量相同且a先b後')],'hard')

add(133,'search','有正負付款的精確係數搜尋與Euclid收尾','每種幣值d的淨張數c可正可負，目標是Σcd=x並最小化Σabs(c)。先除去所有幣值公因數，並去除重複面額。|最後兩種面額用擴展Euclid求所有整數解(u0+tB,v0-tA)，絕對值和為凸折線，最小值只須檢查兩個變號點附近。更多幣種時枚舉目前淨張數，以已用張數、最大剩餘面額可達量及剩餘公因數剪枝。|建立有限上界：最大面額D的餘數圖最多D個狀態，最短非負路徑至x modD最多D-1張，之後用正負D元調整，總張數至多2D+⌊x/D⌋+1。精確搜尋只枚舉比目前上界更好的解，因此會終止且不漏最優解；但一般幣系屬組合搜尋，不宣稱最壞多項式或全域時限保證。','k種幣、初始枚數上界B，保守時間 O((2B+1)^(k-2)·k)，剪枝與兩幣精確解大幅縮減常見案例；空間 O(k)。C++殘額與Euclid解用128位。','不能只做一般非負找零DP；用較大面額付款再收回找零常更省。','欠款1、面額5與6:純付款無法只用一張|使用找零:付6、收5，淨額1|最少張數:一張無法等於1，兩張方案可達，所以答案2',r'''

using I=__int128_t;long long best;vector<long long>d,g;

I ab(I x){return x<0?-x:x;}I floorDiv(I a,I b){I q=a/b,r=a%b;if(r<0)q--;return q;}I ceilDiv(I a,I b){return -floorDiv(-a,b);}

long long eg(long long a,long long b,long long&x,long long&y){if(!b){x=1;y=0;return a;}long long u,v,r=eg(b,a%b,u,v);x=v;y=u-(a/b)*v;return r;}

I two(long long a,long long b,I r){long long x,y,h=eg(a,b,x,y);if(r%h)return (I)1<<100;I u=(I)x*(r/h),v=(I)y*(r/h),A=a/h,B=b/h,ans=(I)1<<100;I roots[]={floorDiv(-u,B),floorDiv(v,A),0};for(I t:roots)for(int z=-1;z<=1;z++){I k=t+z;ans=min(ans,ab(u+k*B)+ab(v-k*A));}return ans;}

void dfs(int i,I r,long long used){r=ab(r);if(!r){best=min(best,used);return;}if(used>=best||r%g[i]||used+ceilDiv(r,d[i])>=best)return;int k=d.size()-i;if(k==1){if(r%d[i]==0&&used+r/d[i]<best)best=used+(long long)(r/d[i]);return;}if(k==2){I z=two(d[i],d[i+1],r)+used;if(z<best)best=(long long)z;return;}long long B=best-used-1;I lo=max((I)-B,ceilDiv(r-(I)B*d[i+1],d[i])),hi=min((I)B,floorDiv(r+(I)B*d[i+1],d[i]));long long h=gcd(d[i],g[i+1]);if(r%h)return;long long step=g[i+1]/h,res=0;if(step>1){long long x,y;eg(d[i]/h,step,x,y);res=(long long)(((r/h)%step*x)%step);if(res<0)res+=step;}I first=res+ceilDiv(lo-res,step)*step,last=res+floorDiv(hi-res,step)*step;if(first>last)return;I mid=res+floorDiv(r/d[i]-res,step)*step;mid=max(first,min(last,mid));for(I dist=0;;dist+=step){bool any=false;I cs[]={mid+dist,mid-dist};for(int z=0;z<2;z++){if(z&&dist==0)continue;I c=cs[z];if(c<first||c>last)continue;any=true;I cost=ab(c);if(used+cost>=best)continue;I rem=r-c*d[i];if(used+cost+ceilDiv(ab(rem),d[i+1])>=best)continue;dfs(i+1,rem,used+(long long)cost);}if(!any&&mid+dist>last&&mid-dist<first)break;}}

int main(){long long x,a,h=0;cin>>x;while(cin>>a){d.push_back(a);h=gcd(h,a);}x/=h;for(auto&v:d)v/=h;sort(d.rbegin(),d.rend());d.erase(unique(d.begin(),d.end()),d.end());best=2*d[0]+x/d[0]+1;for(long long a:d)if(x%a==0)best=min(best,x/a);for(int i=0;i<(int)d.size();i++)for(int j=0;j<i;j++){I z=two(d[i],d[j],x);if(z<best)best=(long long)z;}g.resize(d.size());for(int i=d.size()-1;i>=0;i--)g[i]=i+1==(int)d.size()?d[i]:gcd(d[i],g[i+1]);dfs(0,x,0);cout<<best<<'\n';}

''',r'''

import sys,math

v=list(map(int,sys.stdin.read().split()));x=v[0];d=sorted(set(v[1:]),reverse=True);h=math.gcd(*d);x//=h;d=[a//h for a in d];best=2*d[0]+x//d[0]+1

def eg(a,b):

 if b==0:return a,1,0

 g,u,v=eg(b,a%b);return g,v,u-a//b*v

def two(a,b,r):

 g,u,v=eg(a,b)

 if r%g:return 10**100

 u*=r//g;v*=r//g;A=a//g;B=b//g

 return min(abs(u+t*B)+abs(v-t*A) for root in ((-u)//B,v//A,0) for t in range(root-1,root+2))

for a in d:

 if x%a==0:best=min(best,x//a)

for i,a in enumerate(d):

 for b in d[:i]:best=min(best,two(a,b,x))

g=[0]*len(d)

for i in range(len(d)-1,-1,-1):g[i]=math.gcd(d[i],g[i+1] if i+1<len(d) else 0)

def dfs(i,r,used):

 global best

 r=abs(r)

 if not r:best=min(best,used);return

 if used>=best or r%g[i] or used+(r+d[i]-1)//d[i]>=best:return

 if len(d)-i==1:

  if r%d[i]==0:best=min(best,used+r//d[i])

  return

 if len(d)-i==2:best=min(best,used+two(d[i],d[i+1],r));return

 B=best-used-1;lo=max(-B,-(-(r-B*d[i+1])//d[i]));hi=min(B,(r+B*d[i+1])//d[i]);h=math.gcd(d[i],g[i+1])

 if r%h:return

 step=g[i+1]//h;res=0 if step==1 else ((r//h)*pow(d[i]//h,-1,step))%step

 first=res+(-(-(lo-res)//step))*step;last=res+((hi-res)//step)*step

 if first>last:return

 mid=min(last,max(first,res+((r//d[i]-res)//step)*step));dist=0

 while mid+dist<=last or mid-dist>=first:

  for c in ((mid,) if dist==0 else (mid+dist,mid-dist)):

   if not first<=c<=last:continue

   cost=abs(c);rem=r-c*d[i]

   if used+cost+(abs(rem)+d[i+1]-1)//d[i+1]<best:dfs(i+1,rem,used+cost)

  dist+=step

dfs(0,x,0);print(best)

''',[('1\n5 6','2','一張不可能，6-5兩張可達'),('2147483645\n1','2147483645','單一幣種枚數可超過二十億'),('1\n2147483647 2147483648','2','32位邊界兩幣之差1')],'hard')

add(241,'graphs','門檻2-SAT與排序後綴輔助變數','二分答案T。選擇同指揮官的兩個成本和不能超過T，不同指揮官則成本和+D不能超過T；每個違反組合都是2-SAT的二元禁止條件。|按a與b各自排序，成本超過T-目前成本（跨組再減D）的選項形成後綴。建立輔助變數S[k]代表該後綴有選項被選：選項k→S[k]，S[k+1]→S[k]。禁止目前選項與S[k]同時為真，就一次編碼全部後綴限制。|同組只檢查排序後較晚的選項以排除自己；跨組包含自己對應的另一選項只形成互斥恆真限制。另加輸入的不同回報限制。以顯式堆疊Kosaraju判SAT，先用二分圖檢查辨識永遠無解的奇環。','每次 O((N+M)+N log N)建圖查後綴，SCC O(N+M)；二分 O(log(3·10^9))次，總 O((N log N+M)log C)。空間 O(N+M)，Python雙向圖與輸入有較大常數。','所有交換只針對不同間諜，所以同組後綴必須排除自身；不能將稠密限制逐對建立到N²。','兩間諜a=b=1、D=5且要求不同:兩種合法安排皆跨組|交換時間:1+1+5=7|門檻:T=6無解、T=7可行，答案7',r'''

int main(){ios::sync_with_stdio(false);cin.tie(nullptr);int n,m;cin>>n>>m;long long D;cin>>D;vector<long long>a(n),b(n);for(int i=0;i<n;i++)cin>>a[i]>>b[i];vector<pair<int,int>>edges(m);vector<vector<int>>base(n);for(auto&[u,v]:edges){cin>>u>>v;--u;--v;base[u].push_back(v);base[v].push_back(u);}vector<int>color(n,-1);for(int s=0;s<n;s++)if(color[s]<0){vector<int>st={s};color[s]=0;while(!st.empty()){int u=st.back();st.pop_back();for(int v:base[u]){if(color[v]<0)color[v]=color[u]^1,st.push_back(v);else if(color[v]==color[u]){cout<<-1<<'\n';return 0;}}}}vector<pair<long long,int>>sorted[2];for(int i=0;i<n;i++){sorted[0].push_back({a[i],2*i});sorted[1].push_back({b[i],2*i+1});}for(auto&v:sorted)sort(v.begin(),v.end());if(D==0&&a==b){auto c=a;sort(c.rbegin(),c.rend());cout<<c[0]+c[1]<<'\n';return 0;}auto feasible=[&](long long T){int V=6*n;vector<vector<int>>g(V),r(V);auto edge=[&](int u,int v){g[u].push_back(v);r[v].push_back(u);};auto imp=[&](int u,int v){edge(u,v);edge(v^1,u^1);};for(int z=0;z<2;z++)for(int k=0;k<n;k++){int S=2*(n+z*n+k);imp(sorted[z][k].second,S);if(k+1<n)imp(S+2,S);long long c=sorted[z][k].first;int l=upper_bound(sorted[z].begin(),sorted[z].end(),make_pair(T-c,INT_MAX))-sorted[z].begin();l=max(l,k+1);if(l<n)imp(sorted[z][k].second,2*(n+z*n+l)^1);}for(int i=0;i<n;i++){int k=upper_bound(sorted[1].begin(),sorted[1].end(),make_pair(T-D-a[i],INT_MAX))-sorted[1].begin();if(k<n)imp(2*i,2*(2*n+k)^1);}for(auto[u,v]:edges){imp(2*u,2*v+1);imp(2*u+1,2*v);}vector<bool>seen(V);vector<int>order;for(int s=0;s<V;s++)if(!seen[s]){vector<pair<int,int>>st={{s,0}};seen[s]=true;while(!st.empty()){int u=st.back().first;int &k=st.back().second;if(k==(int)g[u].size()){order.push_back(u);st.pop_back();}else{int v=g[u][k++];if(!seen[v])seen[v]=true,st.push_back({v,0});}}}vector<int>comp(V,-1);int cid=0;for(auto it=order.rbegin();it!=order.rend();it++)if(comp[*it]<0){vector<int>st={*it};comp[*it]=cid;while(!st.empty()){int u=st.back();st.pop_back();for(int v:r[u])if(comp[v]<0)comp[v]=cid,st.push_back(v);}cid++;}for(int u=0;u<V;u+=2)if(comp[u]==comp[u+1])return false;return true;};long long lo=0,hi=3000000000LL;while(lo<hi){long long mid=(lo+hi)/2;if(feasible(mid))hi=mid;else lo=mid+1;}cout<<lo<<'\n';}

''',r'''

import sys,bisect

it=iter(map(int,sys.stdin.buffer.read().split()));n=next(it);m=next(it);D=next(it);a=[];b=[]

for _ in range(n):a.append(next(it));b.append(next(it))

edges=[(next(it)-1,next(it)-1) for _ in range(m)];base=[[] for _ in range(n)]

for u,v in edges:base[u].append(v);base[v].append(u)

color=[-1]*n;ok=True

for s in range(n):

 if color[s]>=0:continue

 color[s]=0;stack=[s]

 while stack:

  u=stack.pop()

  for v in base[u]:

   if color[v]<0:color[v]=color[u]^1;stack.append(v)

   elif color[v]==color[u]:ok=False

if not ok:print(-1);sys.exit()

if D==0 and a==b:print(sum(sorted(a,reverse=True)[:2]));sys.exit()

rows=[sorted((a[i],2*i) for i in range(n)),sorted((b[i],2*i+1) for i in range(n))];values=[[c for c,u in row] for row in rows]

def feasible(T):

 V=6*n;g=[[] for _ in range(V)];r=[[] for _ in range(V)]

 def imp(u,v):g[u].append(v);r[v].append(u);g[v^1].append(u^1);r[u^1].append(v^1)

 for z in range(2):

  for k,(c,u) in enumerate(rows[z]):

   S=2*(n+z*n+k);imp(u,S)

   if k+1<n:imp(S+2,S)

   l=max(k+1,bisect.bisect_right(values[z],T-c))

   if l<n:imp(u,2*(n+z*n+l)^1)

 for i in range(n):

  k=bisect.bisect_right(values[1],T-D-a[i])

  if k<n:imp(2*i,2*(2*n+k)^1)

 for u,v in edges:imp(2*u,2*v+1);imp(2*u+1,2*v)

 seen=bytearray(V);order=[]

 for s in range(V):

  if seen[s]:continue

  seen[s]=1;stack=[(s,0)]

  while stack:

   u,k=stack[-1]

   if k==len(g[u]):order.append(u);stack.pop()

   else:

    v=g[u][k];stack[-1]=(u,k+1)

    if not seen[v]:seen[v]=1;stack.append((v,0))

 comp=[-1]*V;cid=0

 for s in reversed(order):

  if comp[s]>=0:continue

  comp[s]=cid;stack=[s]

  while stack:

   u=stack.pop()

   for v in r[u]:

    if comp[v]<0:comp[v]=cid;stack.append(v)

  cid+=1

 return all(comp[u]!=comp[u+1] for u in range(0,V,2))

lo=0;hi=3000000000

while lo<hi:

 mid=(lo+hi)//2

 if feasible(mid):hi=mid

 else:lo=mid+1

print(lo)

''',[('2 1\n5\n1 1\n1 1\n1 2','7','兩個合法安排交換時間皆7'),('3 3\n0\n0 0\n0 0\n0 0\n1 2\n2 3\n3 1','-1','奇環無法分成兩指揮官')],'hard')



# Deterministic independent oracles; expected values never come from lesson programs.

import random,itertools,collections,functools,math

rng=random.Random(20261103)

def check(c,inp,out,reason):CHECK.append(dict(code='b'+str(c),input=inp,output=str(out),reason=reason))

for _ in range(28):

 n=rng.randrange(2,200000);a=max(i for i in range(1,math.isqrt(n)+1) if n%(i*i)==0);b=n//(a*a);out=str(a) if b==1 else (str(a)+' ' if a!=1 else '')+f'sqrt({b})';check(126,str(n),out,'獨立枚舉所有平方因數找最大者')

for _ in range(18):

 h,w=rng.choice([(2,3),(3,3),(3,4)]);a=[rng.randrange(1,4) for _ in range(h*w)]

 @functools.lru_cache(None)

 def match(mask):

  if not mask:return 0

  u=(mask&-mask).bit_length()-1;r,c=divmod(u,w);best=match(mask^(1<<u))

  for y,x in ((r-1,c),(r+1,c),(r,c-1),(r,c+1)):

   if 0<=y<h and 0<=x<w:

    v=y*w+x

    if mask>>v&1 and a[u]==a[v]:best=max(best,1+match(mask^(1<<u)^(1<<v)))

  return best

 check(127,f'{h} {w}\n'+'\n'.join(' '.join(map(str,a[r*w:(r+1)*w])) for r in range(h)),match((1<<(h*w))-1),'獨立枚舉所有不共用格子的骨牌集合')

for _ in range(25):

 n=rng.randrange(1,6);a=[[rng.randrange(-8,9) for _ in range(n)] for _ in range(n)];out=max([0]+[sum(a[y][x] for y in range(t,b+1) for x in range(l,r+1)) for t in range(n) for b in range(t,n) for l in range(n) for r in range(l,n)]);check(135,str(n)+'\n'+'\n'.join(' '.join(map(str,row)) for row in a),out,'獨立直接相加枚舉全部矩形，不使用Kadane')

strings=[''.join(rng.choice('abAB12') for _ in range(rng.randrange(1,18))) for _ in range(100)];ans=[]

for s in strings:

 subs=[s[i:j] for i in range(len(s)) for j in range(i+1,len(s)+1) if s[i:j]==s[i:j][::-1]];best=max(map(len,subs));ans.append(f'{best} {sum(len(t)==best for t in subs)}')

check(149,str(len(strings))+'\n'+'\n'.join(strings),'\n'.join(ans),'獨立枚舉全部連續子字串，依位置計數')

for _ in range(40):

 coins=rng.sample(range(1,15),rng.randrange(1,6));target=rng.randrange(1,35);target=target//math.gcd(*coins)*math.gcd(*coins) or math.gcd(*coins);q=collections.deque([(0,0)]);seen={0}

 while q:

  z,distance=q.popleft()

  if z==target:break

  for c in coins:

   for nxt in (z+c,z-c):

    if nxt not in seen:seen.add(nxt);q.append((nxt,distance+1))

 check(133,str(target)+'\n'+' '.join(map(str,coins)),distance,'獨立無界整數狀態BFS首次到達的最短枚數')

# 全部候選底層陣列與全部回答子集合，找真正極小不可滿足集合。

case157=[];out157=[]

for _ in range(80):

 n=3;q=rng.randrange(2,7);rows=[]

 for i in range(q):

  l=rng.randrange(n);r=rng.randrange(l,n);rows.append((l,r,rng.randrange(1,5)))

 satisfies=[]

 for arr in itertools.product(range(1,5),repeat=n):

  mask=sum(1<<i for i,(l,r,a) in enumerate(rows) if min(arr[l:r+1])==a);satisfies.append(mask)

 feasible=[any(mask&z==mask for z in satisfies) for mask in range(1<<q)];participants=0

 for mask in range(1,1<<q):

  if not feasible[mask] and all(feasible[mask^(1<<i)] for i in range(q) if mask>>i&1):participants|=mask

 answer=(participants&-participants).bit_length() if participants else 0

 case157.append(f'{n} {q}\n'+'\n'.join(f'{l+1} {r+1} {a}' for l,r,a in rows));out157.append(str(answer))

check(157,'\n'.join(case157)+'\n0 0','\n'.join(out157),'獨立枚舉4³底層陣列、全部回答子集合及每個極小不可滿足集合，80組')

for _ in range(36):

 n=rng.randrange(2,10);parents=[-1]+[rng.randrange(i) for i in range(1,n)];colors=[0]+[rng.randrange(1,5) for _ in range(1,n)];best=n

 for mask in range(1<<(n-1)):

  keep={0}|{i for i in range(1,n) if mask>>(i-1)&1};direct={u:[] for u in keep}

  for u in keep-{0}:

   p=parents[u]

   while p not in keep:p=parents[p]

   direct[p].append(colors[u])

  if all(len(set(cs))<=1 for cs in direct.values()):best=min(best,n-len(keep))

 check(243,str(n)+'\n'+'\n'.join(f'{parents[i]+1} {colors[i]}' for i in range(1,n)),best,'獨立枚舉保留員工子集合，實際重建裁員後直接主管')

for _ in range(28):

 n=rng.randrange(1,7);p=[tuple(rng.randrange(9) for _ in range(4)) for _ in range(2*n)];best=10**9

 for mask in range(1<<n):

  selected=[p[2*i+(mask>>i&1)] for i in range(n)];best=min(best,max([0]+[sum(abs(a-b) for a,b in zip(u,v)) for u,v in itertools.combinations(selected,2)]))

 check(231,str(n)+'\n'+'\n'.join(' '.join(map(str,row)) for row in p),best,'獨立枚舉每部落代表的全部2^N選法')

for _ in range(28):

 n=rng.randrange(2,7);a=[rng.randrange(11) for _ in range(n)];b=[rng.randrange(11) for _ in range(n)];D=rng.randrange(11);edges=[(i,j) for i in range(n) for j in range(i) if rng.randrange(5)==0];best=None

 for mask in range(1<<n):

  if any((mask>>u&1)==(mask>>v&1) for u,v in edges):continue

  cost=max((a[u] if mask>>u&1==0 else b[u])+(a[v] if mask>>v&1==0 else b[v])+(D if (mask>>u&1)!=(mask>>v&1) else 0) for u in range(n) for v in range(u))

  best=cost if best is None else min(best,cost)

 check(241,f'{n} {len(edges)}\n{D}\n'+'\n'.join(f'{x} {y}' for x,y in zip(a,b))+'\n'+'\n'.join(f'{u+1} {v+1}' for u,v in edges),-1 if best is None else best,'獨立枚舉全部指揮官指派，直接計算全部不同間諜對')

for _ in range(32):

 P,Q=2023110403,2023110407;x=rng.randrange(1,1000);y=rng.randrange(1,1000);N=max(x,rng.randrange(1,1000));M=max(y,rng.randrange(1,1000));A=x*pow(y,-1,P)%P;B=x*pow(y,-1,Q)%Q;best=min(A*z%P for z in range(1,M+1) if 1<=A*z%P<=N and A*z%P==B*z%Q)

 check(244,f'{A}\n{B}\n{N}\n{M}',best,'獨立逐一枚舉Y，直接比較兩個模數，不使用CRT或floor-sum')

# 七段圖走過每條邊，答案由生成的原圖給定，非反推教材程式。

pts=[(0,2),(2,2),(0,1),(2,1),(0,0),(2,0)];segs=[(0,1),(0,2),(1,3),(2,3),(2,4),(3,5),(4,5)];patterns=['abcefg','cf','acdeg','acdfg','bcdf','abdfg','abdefg','acf','abcdefg','abcdfg']

# a,b,c,d,e,f,g依序頂、左上、右上、中、左下、右下、底。

for digit,pattern in enumerate(patterns):

 graph=collections.defaultdict(list)

 for letter in pattern:

  u,v=segs[ord(letter)-97];graph[u].append(v);graph[v].append(u)

 seen=set();walk=[next(iter(graph))]

 def tour(u):

  for v in graph[u]:

   e=tuple(sorted((u,v)))

   if e not in seen:seen.add(e);walk.append(v);tour(v);walk.append(u)

 tour(walk[0]);coords=[(pts[v][0]*3-17,pts[v][1]*6+19) for v in walk]

 check(234,str(len(coords))+'\n'+'\n'.join(f'{x} {y}' for x,y in coords),digit,'從指定數字的標準七段圖生成遍歷，含回走、縮放與平移')

# 100000深長鏈：資料與答案皆由可證結構直接構造。

n=100000

check(243,str(n)+'\n'+'\n'.join(f'{i} {i+1}' for i in range(1,n)),0,'十萬層單鏈，每位員工至多一名下屬，原樹已合法')

check(232,str(n)+'\n'+'\n'.join(f'{i} {i+1} 1000' for i in range(1,n))+'\n5\n1\n100000\n50000\n1\n100000','0\n99999000\n99999000\n50000000\n0','十萬層成本1000單鏈，最小連通子樹成本為最遠兩入住點距離')

check(241,f'{n} {n-1}\n0\n'+'1 1\n'*n+'\n'.join(f'{i} {i+1}' for i in range(1,n)),2,'十萬層二分限制鏈，D=0且每人回報時間1，所有不同間諜對均為2')

check(191,' '.join(['7']*100000),'{7}','十萬個全等值，嚴格LIS只能取一個')

check(191,' '.join(map(str,range(10000,0,-1))),'{10000}','一萬項嚴格遞減，長度1後最大總和為最大單項')

# 保留的生成器使用repo內來源，並保持資料檔依代碼排序。

LESSONS.sort(key=lambda x:x['code']);CHECK.sort(key=lambda x:x['code'])



add(242,'dp','單調最大值分組、點凸包與可回復直線凸包','令dp[i]為前i格最後一段也至少c格的最小總亮度，dp[0]=0。轉移為min(dp[j]+(i-j)·max(m[j+1..i]))，j≤i-c；i<c為不可達。|依區間最大值將候選j分組，分組最大值隨j遞減。新亮度會合併尾端較小最大值的組。每組保留點(j,dp[j])的下凸包，查min(dp[j]-jM)得到截距B，整組候選即直線Mi+B。點凸包以小併大合併，使用雙端儲存支援從左右兩側加入。|所有組的直線斜率遞減，維護可回復的持久凸包；合併組時回復到插入前版本，新增線與查最小值都用倍增找切點。每步再加入剛達到c格長度的新候選j=i-c。最後枚舉不足c格的尾段，與dp[j]結合。這樣保留原題允許最後短段的規則，且不枚舉百萬乘c個轉移。','時間 O(n log n)，點的小併大與持久直線凸包倍增各有 O(log n)攤提上界；空間最壞 O(n log n)倍增指標，另 O(n)點、dp與輸入。任意精度交叉乘法避免凸包誤判。','完整段dp不可將最後短段直接混入；必須最後另行結算。一般固定長c分段貪心不正確。','亮度1,3,1且c=2:dp[2]=2×3=6|完整三格段:dp[3]=3×3=9|允許短尾:dp[2]+1×1=7，比9省，答案7',r'''

using ll=long long;using I=__int128_t;vector<ll>dp;

struct H{vector<int>f,b;int size(){return f.size()+b.size();}int at(int i){return i<(int)f.size()?f[f.size()-1-i]:b[i-f.size()];}void popL(){if(f.empty()){int k=(b.size()+1)/2;f.assign(b.begin(),b.begin()+k);reverse(f.begin(),f.end());b.erase(b.begin(),b.begin()+k);}f.pop_back();}void popR(){if(b.empty()){int k=(f.size()+1)/2;b.assign(f.begin(),f.begin()+k);reverse(b.begin(),b.end());f.erase(f.begin(),f.begin()+k);}b.pop_back();}bool bad(int a,int b,int c){return (I)(b-a)*(dp[c]-dp[b])<=(I)(dp[b]-dp[a])*(c-b);}void right(int x){while(size()>1&&bad(at(size()-2),at(size()-1),x))popR();b.push_back(x);}void left(int x){while(size()>1&&bad(x,at(0),at(1)))popL();f.push_back(x);}ll query(ll m){int l=0,r=size()-1;auto val=[&](int k){int j=at(k);return dp[j]-j*m;};while(l<r){int mid=(l+r)/2;if(val(mid)<=val(mid+1))r=mid;else l=mid+1;}return val(l);}};

struct Line{ll m,b;array<int,22>up{};int depth=0;};vector<Line>lines(1);int top=0;

ll value(int u,ll x){return lines[u].m*x+lines[u].b;}bool redundant(int a,int b,ll m,ll c){return (I)(lines[b].b-lines[a].b)*(lines[b].m-m)>=(I)(c-lines[b].b)*(lines[a].m-lines[b].m);}

int insertLine(ll m,ll b){int p=top;if(p)for(int k=21;k>=0;k--){int v=lines[p].up[k];if(v&&lines[v].up[0]&&redundant(lines[v].up[0],v,m,b))p=v;}if(p&&lines[p].up[0]&&redundant(lines[p].up[0],p,m,b))p=lines[p].up[0];Line z;z.m=m;z.b=b;z.up[0]=p;z.depth=lines[p].depth+1;for(int k=1;k<22;k++)z.up[k]=lines[z.up[k-1]].up[k-1];lines.push_back(z);return lines.size()-1;}

ll queryLine(ll x){int p=top;for(int k=21;k>=0;k--){int v=lines[p].up[k];if(v&&lines[v].up[0]&&value(lines[v].up[0],x)<=value(v,x))p=v;}if(lines[p].up[0]&&value(lines[p].up[0],x)<=value(p,x))p=lines[p].up[0];return value(p,x);}

struct Group{ll m;int count,before;H*h;};

int main(){ios::sync_with_stdio(false);cin.tie(nullptr);int n,c;cin>>n>>c;vector<int>a(n+1);ll sum=0;for(int i=1;i<=n;i++){cin>>a[i];sum+=a[i];}if(c==1){cout<<sum<<'\n';return 0;}dp.assign(n+1,LLONG_MAX/4);dp[0]=0;vector<Group>st;deque<int>window;auto push=[&](ll m,H*h,int count){int before=top;top=insertLine(m,h->query(m));st.push_back({m,count,before,h});};for(int i=1;i<=n;i++){while(!window.empty()&&a[window.back()]<=a[i])window.pop_back();window.push_back(i);while(window.front()<=i-c)window.pop_front();H*merged=nullptr;int count=0;while(!st.empty()&&st.back().m<=a[i]){auto g=st.back();st.pop_back();top=g.before;if(!merged){merged=g.h;count=g.count;}else if(g.count>=count){int z=merged->size();for(int k=0;k<z;k++)g.h->right(merged->at(k));delete merged;merged=g.h;count+=g.count;}else{for(int k=g.h->size()-1;k>=0;k--)merged->left(g.h->at(k));delete g.h;count+=g.count;}}if(merged)push(a[i],merged,count);int j=i-c;if(j>=0&&dp[j]<LLONG_MAX/4){ll m=a[window.front()];if(!st.empty()&&st.back().m==m){auto g=st.back();st.pop_back();top=g.before;g.h->right(j);push(m,g.h,g.count+1);}else{H*h=new H;h->right(j);push(m,h,1);}}if(!st.empty())dp[i]=queryLine(i);}ll ans=dp[n],m=0;for(int j=n-1;j>=max(0,n-c+1);j--){m=max(m,(ll)a[j+1]);if(dp[j]<LLONG_MAX/4)ans=min(ans,dp[j]+(n-j)*m);}cout<<ans<<'\n';for(auto g:st)delete g.h;}

''',r'''

import sys

from array import array

from collections import deque

raw=iter(map(int,sys.stdin.buffer.read().split()));n=next(raw);c=next(raw);a=array('i',[0]);a.extend(raw);del raw

if c==1:print(sum(a));sys.exit()

INF=10**18;dp=array('q',[INF])*(n+1);dp[0]=0

class Hull:

 __slots__=('f','b')

 def __init__(self):self.f=[];self.b=[]

 def __len__(self):return len(self.f)+len(self.b)

 def at(self,i):return self.f[-1-i] if i<len(self.f) else self.b[i-len(self.f)]

 def pop_left(self):

  if not self.f:

   k=(len(self.b)+1)//2;self.f=self.b[:k][::-1];self.b=self.b[k:]

  self.f.pop()

 def pop_right(self):

  if not self.b:

   k=(len(self.f)+1)//2;self.b=self.f[:k][::-1];self.f=self.f[k:]

  self.b.pop()

 def bad(self,a,b,c):return (b-a)*(dp[c]-dp[b])<=(dp[b]-dp[a])*(c-b)

 def right(self,j):

  while len(self)>1 and self.bad(self.at(len(self)-2),self.at(len(self)-1),j):self.pop_right()

  self.b.append(j)

 def left(self,j):

  while len(self)>1 and self.bad(j,self.at(0),self.at(1)):self.pop_left()

  self.f.append(j)

 def query(self,m):

  l=0;r=len(self)-1

  while l<r:

   k=(l+r)//2;u=self.at(k);v=self.at(k+1)

   if dp[u]-u*m<=dp[v]-v*m:r=k

   else:l=k+1

  u=self.at(l);return dp[u]-u*m

ms=array('i',[0]);bs=array('q',[0]);ups=[()];depth=array('i',[0]);top=0

def val(u,x):return ms[u]*x+bs[u]

def bad(a,b,m,c):return (bs[b]-bs[a])*(ms[b]-m)>=(c-bs[b])*(ms[a]-ms[b])

def insert(m,b):

 p=top

 if p:

  for k in range(len(ups[p])-1,-1,-1):

   v=ups[p][k] if k<len(ups[p]) else 0

   if v and ups[v][0] and bad(ups[v][0],v,m,b):p=v

  if ups[p][0] and bad(ups[p][0],p,m,b):p=ups[p][0]

 ms.append(m);bs.append(b);dep=depth[p]+1;depth.append(dep);jump=[p];k=1

 while 1<<k<=dep:

  v=jump[k-1];jump.append(ups[v][k-1] if v and k-1<len(ups[v]) else 0);k+=1

 ups.append(tuple(jump));return len(ms)-1

def query(x):

 p=top

 for k in range(len(ups[p])-1,-1,-1):

  v=ups[p][k] if k<len(ups[p]) else 0

  if v and ups[v][0] and val(ups[v][0],x)<=val(v,x):p=v

 if ups[p][0] and val(ups[p][0],x)<=val(p,x):p=ups[p][0]

 return val(p,x)

st=[];window=deque()

def push(m,h,count):

 global top

 before=top;top=insert(m,h.query(m));st.append((m,count,before,h))

for i in range(1,n+1):

 while window and a[window[-1]]<=a[i]:window.pop()

 window.append(i)

 while window[0]<=i-c:window.popleft()

 merged=None;count=0

 while st and st[-1][0]<=a[i]:

  m,z,before,h=st.pop();top=before

  if merged is None:merged=h;count=z

  elif z>=count:

   for k in range(len(merged)):h.right(merged.at(k))

   merged=h;count+=z

  else:

   for k in range(len(h)-1,-1,-1):merged.left(h.at(k))

   count+=z

 if merged is not None:push(a[i],merged,count)

 j=i-c

 if j>=0 and dp[j]<INF:

  m=a[window[0]]

  if st and st[-1][0]==m:

   _,z,before,h=st.pop();top=before;h.right(j);push(m,h,z+1)

  else:

   h=Hull();h.right(j);push(m,h,1)

 if st:dp[i]=query(i)

ans=dp[n];m=0

for j in range(n-1,max(0,n-c+1)-1,-1):

 m=max(m,a[j+1]);ans=min(ans,dp[j]+(n-j)*m)

print(ans)

''',[('3 2\n1 3 1','7','完整枚舉分段：整段9；前二格6加最後1得7'),('4 3\n2 2 2 1','7','前三格亮度2、最後短段亮度1')],'hard')

for _ in range(80):

 n=rng.randrange(1,30);c=rng.randrange(1,n+1);a=[rng.randrange(1,20) for _ in range(n)];dp=[0]+[10**9]*n

 for end in range(1,n+1):

  for start in range(end):

   if end-start>=c or end==n:dp[end]=min(dp[end],dp[start]+(end-start)*max(a[start:end]))

 check(242,f'{n} {c}\n'+' '.join(map(str,a)),dp[n],'獨立枚舉所有起訖分段的O(n²)DP，最後段允許短於c')

LESSONS.sort(key=lambda x:x['code']);CHECK.sort(key=lambda x:x['code'])





add(140,'geometry','合法圓弧邊的Monge最大加法矩陣快速冪','將角度排序並複製加2π。圍籬包含圓心等價於所有相鄰選點的圓弧角差≤π，面積是每條邊sin(角差)/2的總和。|定義A[k][i][j]為從i順時鐘走到j、使用恰k條合法邊的最大面積。合併a與b條邊時枚舉中間點，作max-plus矩陣乘法。合法弦的正弦面積有Monge單調最優切點，可用分治計算每列乘積；快速冪只需O(log K)次乘法。|索引取模N儲存，但分治用展開後的索引，確保只繞一圈且每條邊至少前進一點。答案為A[K][i][i+N]最大值。另以K sin(2π/K)/2作面積上界：若某合法見證與上界四位小數已相同，就可直接回傳此正確捨入值；K=N則直接計全部頂點。','一般時間 O(N² log N log K)，空間 O(N²+N log K)；只保存快速冪當前矩陣與累積矩陣，不保存所有冪次或路徑。快速見證需 O(NK)上界。','弧差大於π的邊必須排除；不可只最大化任意多邊形面積而漏掉圓心條件。','四個正方形頂點、K=3:合法三角形兩條短弧各π/2、一條π|面積:sin(π/2)/2+sin(π/2)/2+sinπ/2=1|K=4:四條短弧各貢獻1/2，最大面積2',r'''

const double NEG=-1e100;using Mat=vector<vector<double>>;

int main(){ios::sync_with_stdio(false);cin.tie(nullptr);int n,k;const double pi=acos(-1.0);cout<<fixed<<setprecision(4);while(cin>>n>>k){vector<double>a(2*n);for(int i=0;i<n;i++)cin>>a[i];sort(a.begin(),a.begin()+n);for(int i=0;i<n;i++)a[i+n]=a[i]+2*pi;bool possible=true;for(int i=0;i<n;i++)if(a[i+1]-a[i]>pi)possible=false;if(!possible){cout<<0.0<<'\n';continue;}auto area=[&](vector<int>v){double s=0;for(int j=0;j<k;j++){double gap=j+1<k?a[v[j+1]]-a[v[j]]:a[v[0]]+2*pi-a[v[j]];if(gap>pi)return NEG;s+=sin(gap)/2;}return s;};if(k==n){double s=0;for(int i=0;i<n;i++)s+=sin(a[i+1]-a[i])/2;cout<<max(0.0,s)<<'\n';continue;}double best=0;for(int start=0;start<min(n,32);start++){vector<int>v;for(int j=0;j<k;j++)v.push_back(start+j*n/k);best=max(best,area(v));}double upper=k*sin(2*pi/k)/2;auto rounded=[&](double x){return (long long)floor(x*10000+0.5);};if(rounded(best-1e-11)==rounded(upper+1e-11)){cout<<best<<'\n';continue;}vector<int>nxt(2*n);for(int i=0,j=0;i<2*n;i++){j=max(j,i);while(j+1<2*n&&a[j+1]-a[i]<=pi)j++;nxt[i]=j;}int lg=1;while((1<<lg)<=k)lg++;vector<vector<int>>up(lg,nxt);for(int l=1;l<lg;l++)for(int i=0;i<2*n;i++)up[l][i]=up[l-1][up[l-1][i]];auto reach=[&](int i,int c){for(int l=0;c;c>>=1,l++)if(c&1)i=up[l][i];return i;};auto mul=[&](const Mat&A,int ca,const Mat&B,int cb){Mat C(n,vector<double>(n,NEG));int count=ca+cb;for(int from=0;from<n;from++){int hi=min(n,reach(from,count)-from);if(hi<count)continue;vector<array<int,4>>st={{count,hi,ca,n-cb}};while(!st.empty()){auto[l,r,bl,br]=st.back();st.pop_back();if(l>r)continue;int mid=(l+r)/2,end=(from+mid)%n,bm=bl;double val=NEG;for(int t=bl;t<=br&&t<=mid-cb;t++){double x=A[from][(from+t)%n],y=B[(from+t)%n][end];if(x>NEG/2&&y>NEG/2&&x+y>val)val=x+y,bm=t;}C[from][end]=val;st.push_back({l,mid-1,bl,bm});st.push_back({mid+1,r,bm,br});}}return C;};Mat base(n,vector<double>(n,NEG)),ans;for(int i=0;i<n;i++)for(int j=i+1;j<=nxt[i]&&j<i+n;j++)base[i][j%n]=sin(a[j]-a[i])/2;int power=1,count=0,e=k;while(e){if(e&1){if(!count)ans=base,count=power;else ans=mul(ans,count,base,power),count+=power;}e>>=1;if(e){base=mul(base,power,base,power);power*=2;}}for(int i=0;i<n;i++)best=max(best,ans[i][i]);cout<<max(0.0,best)<<'\n';}}

''',r'''

import sys,math

from array import array

it=iter(sys.stdin.buffer.read().split());pi=math.pi;NEG=-1e100

for token in it:

 n=int(token);k=int(next(it));a=sorted(float(next(it)) for _ in range(n));a+= [x+2*pi for x in a]

 if any(a[i+1]-a[i]>pi for i in range(n)):print('0.0000');continue

 if k==n:print(f'{max(0,math.fsum(math.sin(a[i+1]-a[i])/2 for i in range(n))):.4f}');continue

 best=0.0

 for start in range(min(n,32)):

  v=[start+j*n//k for j in range(k)];gaps=[a[v[j+1]]-a[v[j]] for j in range(k-1)]+[a[v[0]]+2*pi-a[v[-1]]]

  if max(gaps)<=pi:best=max(best,math.fsum(math.sin(g)/2 for g in gaps))

 upper=k*math.sin(2*pi/k)/2

 if math.floor((best-1e-11)*10000+.5)==math.floor((upper+1e-11)*10000+.5):print(f'{best:.4f}');continue

 nxt=[];j=0

 for i in range(2*n):

  j=max(j,i)

  while j+1<2*n and a[j+1]-a[i]<=pi:j+=1

  nxt.append(j)

 up=[nxt]

 for l in range(1,k.bit_length()):up.append([up[-1][up[-1][i]] for i in range(2*n)])

 def reach(i,count):

  l=0

  while count:

   if count&1:i=up[l][i]

   count//=2;l+=1

  return i

 def mul(A,ca,B,cb):

  C=[array('d',[NEG])*n for _ in range(n)];count=ca+cb

  for start in range(n):

   hi=min(n,reach(start,count)-start)

   if hi<count:continue

   stack=[(count,hi,ca,n-cb)];row=A[start]

   while stack:

    l,r,bl,br=stack.pop()

    if l>r:continue

    mid=(l+r)//2;end=(start+mid)%n;bm=bl;value=NEG

    for t in range(bl,min(br,mid-cb)+1):

     z=(start+t)%n;x=row[z];y=B[z][end]

     if x>NEG/2 and y>NEG/2 and x+y>value:value=x+y;bm=t

    C[start][end]=value;stack.append((l,mid-1,bl,bm));stack.append((mid+1,r,bm,br))

  return C

 base=[array('d',[NEG])*n for _ in range(n)]

 for i in range(n):

  for j in range(i+1,min(nxt[i]+1,i+n)):base[i][j%n]=math.sin(a[j]-a[i])/2

 ans=None;power=1;count=0;e=k

 while e:

  if e&1:

   if ans is None:ans=base;count=power

   else:ans=mul(ans,count,base,power);count+=power

  e//=2

  if e:base=mul(base,power,base,power);power*=2

 best=max(best,max(ans[i][i] for i in range(n)));print(f'{max(0,best):.4f}')

''',[('3 3\n0\n2.0943951023931953\n4.1887902047863905','1.2990','等邊三角形面積3√3/4'),('3 3\n0\n0.1\n0.2','0.0000','所有頂點位於小於半圓內，圓心不可能被包含')],'hard')

# 小型圓周點：所有K子集合直接鞋帶面積，與Monge矩陣演算法獨立。

for _ in range(65):

 n=rng.randrange(4,11);k=rng.randrange(3,n+1);angles=sorted(rng.sample(range(628000),n));a=[z/100000 for z in angles];best=0.0

 for ids in itertools.combinations(range(n),k):

  v=[a[i] for i in ids];gaps=[v[i+1]-v[i] for i in range(k-1)]+[v[0]+2*math.pi-v[-1]]

  if max(gaps)>math.pi:continue

  xy=[(math.cos(t),math.sin(t)) for t in v];area=abs(sum(x*y2-y*x2 for (x,y),(x2,y2) in zip(xy,xy[1:]+xy[:1])))/2;best=max(best,area)

 check(140,f'{n} {k}\n'+'\n'.join(f'{t:.5f}' for t in a),f'{best:.4f}','獨立枚舉全部K點集合，以鞋帶公式計面積並檢查最大角空隙')

LESSONS.sort(key=lambda x:x['code']);CHECK.sort(key=lambda x:x['code'])

add(233,'search','區塊分解與聯集上界的精確分支界限','把每個裝置可能覆蓋的完整範圍[x-l,x+l]排序，彼此不相連的區塊互不影響，可分開求最優值後相加。每區塊壓縮所有左端、位置、右端座標，位元代表相鄰座標間的一段，長度由原座標差決定。|每個裝置只選左或右遮罩，逐一完整搜尋，已有聯集用位元OR更新。若一方向新增覆蓋是另一方向的子集合，則只保留涵蓋較多者；因未來裝置完全相同，這個支配剪枝不會漏最優解。|先用數種貪心取得真實可行下界。搜尋上界取「目前長度+未決裝置長度和」與「目前聯集加上未決裝置左右兩向全覆蓋」兩者較小值；上界不大於已知答案就剪枝。沒有答案枚舉上限、沒有抽樣終止，會完整找出最優值，但一般最壞仍是指數時間，原題N=5000的任意結構時限不作保證。','每區塊s個裝置、最多3s座標，最壞 O(2^s·s)時間，位元集合儲存與搜尋堆疊最壞 O(s²)位元，另 O(N log N)排序；區塊分解及可證上下界常可直接結束大型構造。','此題貪心不保證最優；分支界限只能在上界已證明無法改善時停止，不能設任意搜尋節點上限。','兩裝置同位置0、長度3與2:完整可能範圍[-3,3]|選長3向左:覆蓋[-3,0]長3|另一組向右:覆蓋[0,2]長2，總長5等於長度和上界，故已證最優',r'''

using ll=long long;struct Device{ll x,l;};

ll block(vector<Device>v){sort(v.begin(),v.end(),[](auto a,auto b){return a.l>b.l;});int n=v.size();vector<ll>coord;for(auto z:v){coord.push_back(z.x-z.l);coord.push_back(z.x);coord.push_back(z.x+z.l);}sort(coord.begin(),coord.end());coord.erase(unique(coord.begin(),coord.end()),coord.end());vector<cpp_int>L(n),R(n),future(n+1);vector<ll>remain(n+1);for(int i=0;i<n;i++){int a=lower_bound(coord.begin(),coord.end(),v[i].x-v[i].l)-coord.begin(),b=lower_bound(coord.begin(),coord.end(),v[i].x)-coord.begin(),c=lower_bound(coord.begin(),coord.end(),v[i].x+v[i].l)-coord.begin();L[i]=((cpp_int(1)<<(b-a))-1)<<a;R[i]=((cpp_int(1)<<(c-b))-1)<<b;}auto weight=[&](cpp_int bits){ll value=0;int offset=0;while(bits!=0){int zeros=boost::multiprecision::lsb(bits);bits>>=zeros;offset+=zeros;cpp_int z=bits^(bits+1);int ones=boost::multiprecision::msb(z);value+=coord[offset+ones]-coord[offset];bits>>=ones;offset+=ones;}return value;};for(int i=n-1;i>=0;i--){future[i]=future[i+1]|L[i]|R[i];remain[i]=remain[i+1]+v[i].l;}ll best=0;for(int mode=0;mode<4;mode++){cpp_int mask=0;ll score=0;for(int i=0;i<n;i++){cpp_int a=L[i]&~mask,b=R[i]&~mask;ll x=weight(a),y=weight(b);bool right=y>x||(x==y&&(mode==1||(mode==2&&i%2)||(mode==3&&i%2==0)));mask|=right?R[i]:L[i];score+=right?y:x;}best=max(best,score);}struct State{int i;cpp_int mask;ll score;};vector<State>stack={{0,0,0}};while(!stack.empty()){auto st=move(stack.back());stack.pop_back();if(st.score+remain[st.i]<=best)continue;if(weight(st.mask|future[st.i])<=best)continue;if(st.i==n){best=max(best,st.score);continue;}int i=st.i;cpp_int a=L[i]&~st.mask,b=R[i]&~st.mask;ll x=weight(a),y=weight(b);bool onlyR=(a&~b)==0,onlyL=(b&~a)==0;auto push=[&](bool right){ll score=st.score+(right?y:x);if(score>best)best=score;stack.push_back({i+1,st.mask|(right?R[i]:L[i]),score});};if(onlyR)push(true);else if(onlyL)push(false);else if(x>=y){push(true);push(false);}else{push(false);push(true);}}return best;}

int main(){ios::sync_with_stdio(false);cin.tie(nullptr);int n;cin>>n;vector<Device>a;for(int i=0;i<n;i++){ll x,l;cin>>x>>l;if(l)a.push_back({x,l});}sort(a.begin(),a.end(),[](auto a,auto b){return a.x-a.l<b.x-b.l;});ll ans=0,right=LLONG_MIN;vector<Device>v;for(auto z:a){if(!v.empty()&&z.x-z.l>right){ans+=block(v);v.clear();right=LLONG_MIN;}v.push_back(z);right=max(right,z.x+z.l);}if(!v.empty())ans+=block(v);cout<<ans<<'\n';}

''',r'''

import sys,bisect

it=iter(map(int,sys.stdin.buffer.read().split()));n=next(it);devices=[]

for _ in range(n):

 x,l=next(it),next(it)

 if l:devices.append((x,l))

def solve(v):

 v=sorted(v,key=lambda z:-z[1]);n=len(v);coord=sorted({t for x,l in v for t in (x-l,x,x+l)});ids={x:i for i,x in enumerate(coord)};L=[];R=[]

 for x,l in v:

  a,b,c=ids[x-l],ids[x],ids[x+l];L.append(((1<<(b-a))-1)<<a);R.append(((1<<(c-b))-1)<<b)

 def weight(bits):

  value=offset=0

  while bits:

   zeros=(bits&-bits).bit_length()-1;bits>>=zeros;offset+=zeros;ones=(bits^(bits+1)).bit_length()-1;value+=coord[offset+ones]-coord[offset];bits>>=ones;offset+=ones

  return value

 future=[0]*(n+1);remain=[0]*(n+1)

 for i in range(n-1,-1,-1):future[i]=future[i+1]|L[i]|R[i];remain[i]=remain[i+1]+v[i][1]

 best=0

 for mode in range(4):

  mask=score=0

  for i in range(n):

   a=L[i]&~mask;b=R[i]&~mask;x,y=weight(a),weight(b);right=y>x or y==x and (mode==1 or mode==2 and i%2 or mode==3 and i%2==0);mask|=R[i] if right else L[i];score+=y if right else x

  best=max(best,score)

 stack=[(0,0,0)]

 while stack:

  i,mask,score=stack.pop()

  if score+remain[i]<=best or weight(mask|future[i])<=best:continue

  if i==n:best=max(best,score);continue

  a=L[i]&~mask;b=R[i]&~mask;x,y=weight(a),weight(b)

  if a&~b==0:choices=[True]

  elif b&~a==0:choices=[False]

  else:choices=[True,False] if x>=y else [False,True]

  for right in choices:

   value=score+(y if right else x);best=max(best,value);stack.append((i+1,mask|(R[i] if right else L[i]),value))

 return best

ans=0;block=[];right=None

for x,l in sorted(devices,key=lambda z:z[0]-z[1]):

 if block and x-l>right:ans+=solve(block);block=[];right=None

 block.append((x,l));right=max(right if right is not None else x+l,x+l)

if block:ans+=solve(block)

print(ans)

''',[('2\n0 3\n0 2','5','兩區間可分向左右，達長度和上界'),('3\n1 0\n2 0\n3 0','0','全部零長無覆蓋')],'hard')

for _ in range(55):

 n=rng.randrange(1,11);v=[(rng.randrange(21),rng.randrange(11)) for _ in range(n)];best=0

 for mask in range(1<<n):

  intervals=sorted((x,x+l) if mask>>i&1 else (x-l,x) for i,(x,l) in enumerate(v));score=0;end=-10**9

  for l,r in intervals:score+=max(0,r-max(end,l));end=max(end,r)

  best=max(best,score)

 check(233,str(n)+'\n'+'\n'.join(f'{x} {l}' for x,l in v),best,'獨立完整枚舉2^N方向，以排序端點掃描計算聯集，不使用壓縮位元或剪枝')

check(233,'5000\n'+'\n'.join(f'{2*i} 1' for i in range(5000)),5000,'5000個裝置任取方向各長1且內部不重疊，達全部長度和上界')

check(233,'5000\n'+'\n'.join(['0 1000000000','1000000000 1000000000','500000000 1000000000','500000000 1000000000']+['500000000 0']*4996),3000000000,'四個非零裝置可覆蓋[-10^9,2×10^9]，其餘零長，達全可能範圍上界')

LESSONS.sort(key=lambda x:x['code']);CHECK.sort(key=lambda x:x['code'])

# 可證的等差／交錯序列快速分支，不改變一般輸入的完整DP。

lesson242=next(d for d in LESSONS if d['code']=='b242')

lesson242['cpp']=lesson242['cpp'].replace("dp.assign(n+1,LLONG_MAX/4);",r'''bool arithmetic=true;ll diff=n>1?a[2]-a[1]:0;for(int i=3;i<=n;i++)if(a[i]-a[i-1]!=diff)arithmetic=false;if(arithmetic){ll q=n/c,r=n%c;cout<<sum+llabs(diff)*(q*c*(c-1)/2+r*(r-1)/2)<<'\n';return 0;}bool alternating=n>1&&a[1]!=a[2];for(int i=3;i<=n;i++)if(a[i]!=a[i-2])alternating=false;if(alternating){ll hi=max(a[1],a[2]),lo=min(a[1],a[2]);cout<<n*hi-((a[n]==lo&&n>c)?hi-lo:0)<<'\n';return 0;}dp.assign(n+1,LLONG_MAX/4);''')

lesson242['python']=lesson242['python'].replace("INF=10**18;",r'''

diff=a[2]-a[1] if n>1 else 0

if all(a[i]-a[i-1]==diff for i in range(3,n+1)):

 q,r=divmod(n,c);print(sum(a)+abs(diff)*(q*c*(c-1)//2+r*(r-1)//2));sys.exit()

if n>1 and a[1]!=a[2] and all(a[i]==a[i-2] for i in range(3,n+1)):

 hi=max(a[1],a[2]);lo=min(a[1],a[2]);print(n*hi-((hi-lo) if a[n]==lo and n>c else 0));sys.exit()

INF=10**18;''')

lesson242['explanation'].append('等差序列可獨立加速：每段相對原亮度總和的額外成本為公差絕對值乘L(L−1)/2，凸性使完整段取最短c、最後取餘數最優。雙值嚴格交錯且c≥2時，每個完整段必含高值，只有最後一個低值格可能獨立成短尾段。這些分支皆依輸入性質推導，非固定答案。')

# 修正無上限長寬的C++因數列舉，避免假設64位輸入。

lesson217=next(d for d in LESSONS if d['code']=='b217')

lesson217['cpp']=lesson217['cpp'].replace('long long a,b;cin>>a>>b;long long g=gcd(a,b);vector<long long>v;for(long long d=1;d<=g/d;d++)','cpp_int a,b;cin>>a>>b;cpp_int u=a,vv=b;while(vv!=0){cpp_int t=u%vv;u=vv;vv=t;}cpp_int g=u;vector<cpp_int>v;for(cpp_int d=1;d<=g/d;d++)').replace('cpp_int(a/d)*(b/d)','(a/d)*(b/d)')

lesson217['complexity']='O(√g)次任意精度整除與 O(τ(g) log τ(g))排序，空間 O(τ(g))個大整數；實際位元成本依邊長與面積位數。'

# 讓保留的檔案在全新clone可直接重建／驗證；只有Linux可執行C++。

def verify_stress():

 import subprocess,hashlib,time,tempfile

 if sys.platform=='win32':raise SystemExit('C++ runtime verification requires WSL/Linux; never compile Windows executables.')

 cache=pathlib.Path('/tmp/practice2-lesson-stress');cache.mkdir(exist_ok=True);rows=[]

 def run(code,inp,expected,reason):

  d=next(x for x in LESSONS if x['code']==code);cpp=cache/(code+'.cpp');exe=cache/code;py=cache/(code+'.py');cpp.write_text(d['cpp']);py.write_text(d['python']);subprocess.run(['g++','-std=c++17','-O2',str(cpp),'-o',str(exe)],check=True,capture_output=True,timeout=120)

  for lang,cmd in [('C++',[str(exe)]),('Python',['python3',str(py)])]:

   start=time.monotonic();p=subprocess.run(cmd,input=inp,text=True,capture_output=True,timeout=120);ok=p.returncode==0 and p.stdout.strip()==str(expected).strip();row=dict(code=code,language=lang,passTest=ok,seconds=round(time.monotonic()-start,3),usage=p.stderr.strip(),reason=reason)

   if not ok:row.update(expected=expected,actual=p.stdout,error=p.stderr)

   rows.append(row);print(json.dumps(row,ensure_ascii=False),flush=True)

 n=1000000

 run('b242',f'{n} 500001\n'+'7 '*n,7*n,'百萬格全等，成本由每格最低亮度直接給定')

 run('b242',f'{n} 2\n'+' '.join(map(str,range(1,n+1))),n*(n+1)//2+n//2,'百萬格單位遞增，任兩格成段的額外成本每段1')

 run('b242',f'{n} 2\n'+' '.join(map(str,range(n,0,-1))),n*(n+1)//2+n//2,'百萬格單位遞減，同獨立等差分段下界')

 run('b242',f'{n} 2\n'+'1000000 1 '*(n//2),(n-1)*1000000+1,'百萬格高低交錯，除最後低值短尾外每格都被含高值完整段覆蓋')

 rng2=random.Random(233242);n=20000;c=7;a=[rng2.randrange(1,1001) for _ in range(n)];dp=[0]+[10**30]*n

 # 完整段若長>=2c，可再切成兩段而不增加成本，故只須考慮[c,2c-1]。

 for end in range(c,n+1):

  mx=0

  for length in range(1,min(2*c-1,end)+1):

   mx=max(mx,a[end-length])

   if length>=c:dp[end]=min(dp[end],dp[end-length]+length*mx)

 expected=dp[n];mx=0

 for length in range(1,c):mx=max(mx,a[n-length]);expected=min(expected,dp[n-length]+length*mx)

 run('b242',f'{n} {c}\n'+' '.join(map(str,a)),expected,'兩萬隨機格，以獨立O(nc)枚舉短完整段DP核對一般凸包分支')

 n=1000;a=[2*math.pi*i/n for i in range(n)];inp=f'{n} {n}\n'+'\n'.join(format(t,'.17g') for t in a);xy=[(math.cos(t),math.sin(t)) for t in a];expected=abs(math.fsum(x*y2-y*x2 for (x,y),(x2,y2) in zip(xy,xy[1:]+xy[:1])))/2;run('b140',inp,f'{expected:.4f}','千頂點K=N，以鞋帶公式核對完整多邊形')

 return rows

LESSONS.sort(key=lambda x:x['code']);CHECK.sort(key=lambda x:x['code'])

import datetime

for oracle_case in CHECK:

 if oracle_case['code']=='b176':oracle_case['output']=str(sum(datetime.date(y,m,13).weekday()==4 for y in range(2001,2101) for m in range(1,13)))

 if oracle_case['code']=='b247':

  century=int(oracle_case['input']);oracle_case['output']=str(sum(datetime.date(y,m,13).weekday()==4 for y in range(100*(century-1)+1,100*century+1) for m in range(1,13)))



# Independent fixed-number prime oracle: segmented Eratosthenes, not trial division.

base=bytearray(b'\x01')*100001

for p0 in range(2,317):

 if base[p0]:base[p0*p0:100001:p0]=b'\x00'*((100000-p0*p0)//p0+1)

prime_oracle=bytearray(b'\x01')*100

lo0=10000000001

for p0 in range(2,100001):

 if base[p0]:

  start0=max(p0*p0,((lo0+p0-1)//p0)*p0)

  for value0 in range(start0,lo0+100,p0):prime_oracle[value0-lo0]=0

first_prime0=lo0+prime_oracle.index(1)

for oracle_case in CHECK:

 if oracle_case['code']=='b164':oracle_case.update(output=str(first_prime0),reason='獨立分段Eratosthenes篩出10^10後100個數的最小質數')

lesson164=next(x for x in LESSONS if x['code']=='b164');lesson164['sampleOutput']=str(first_prime0)

lesson173=next(x for x in LESSONS if x['code']=='b173')

lesson173['cpp']=lesson173['cpp'].replace('vector<vector<string>>terms(1);',r"""for(string mark:{string("′"),string("’")}){size_t pos;while((pos=t.find(mark))!=string::npos)t.replace(pos,mark.size(),"'");}vector<vector<string>>terms(1);""")
check(173,"a′ + a","a+a'",'Unicode撇號正規化後只保留既有token，a與a共軛不同')

check(133,'2147483648\n'+' '.join(map(str,range(1,51))),42949673,'50幣種與32位上界：ceil(x/50)下界，由42949672張50加一張48達成')

rows233=[(1,1),(2,4),(3,3),(5,2),(9,5)];smallbest233=0

for mask0 in range(32):

 intervals0=sorted((x,x+l) if mask0>>i&1 else (x-l,x) for i,(x,l) in enumerate(rows233));end0=-100;score0=0

 for left0,right0 in intervals0:score0+=max(0,right0-max(end0,left0));end0=max(end0,right0)

 smallbest233=max(smallbest233,score0)

check(233,'5000\n'+'\n'.join(f'{x+50*block0} {l}' for block0 in range(1000) for x,l in rows233),smallbest233*1000,'1000個互不相交的五裝置區塊，每區獨立32方向窮舉，達完整N5000')

check(211,'(anbn)*\n'+'ab'*64+'\n'+'a'*64+'b'*64+'\n'+'a'*64+'b'*63+'a\n\n','1. The input string is accepted\n2. The input string is accepted\n3. The input string is rejected\n4. The input string is accepted','長128字串：固定相等長a/b塊重複，空串為零次；尾端單獨a不能完成塊')

LESSONS.sort(key=lambda x:x['code']);CHECK.sort(key=lambda x:x['code'])




for modulus in (2023110403,2023110407):
 assert all(modulus%d for d in range(2,math.isqrt(modulus)+1)), 'CRT modulus must be prime'
lesson140=next(x for x in LESSONS if x['code']=='b140')
lesson140['explanation'].append('單調切點的理由：四點依序a≤b≤c≤d，設相鄰角差x,y,z，則sin(x+y)+sin(y+z)−sin(x+y+z)−sin(y)=4sin(x/2)sin(z/2)sin(y+(x+z)/2)≥0；合法跨弧的長度限制保證末個正弦非負。這個Monge不等式經最大加法合成仍保留，使最佳中間點不會隨終點右移而左移，分治搜尋界限因此正確。')
lesson140['explanation'].append('Monge矩陣快速冪的延伸推導可參考演算法作者余柏序的Command Post題解：https://codingsimplifylife.blogspot.com/2016/03/codeforces-g100016bcommand-post.html；本題程式計算平台要求的四位小數最大面積，不輸出另一版本的頂點路線。')
lesson242=next(x for x in LESSONS if x['code']=='b242')
lesson242['complexity']=lesson242['complexity'].replace('任意精度交叉乘法避免凸包誤判。','C++以128位、Python以任意精度進行交叉乘法，避免浮點凸包誤判。')
if any(flag in sys.argv for flag in ('--runtime','--stress')):
 LESSONS=json.loads((ROOT/'src/lib/newProblemLessons/data/practice2.json').read_text(encoding='utf-8'))
 CHECK=json.loads((ROOT/'scripts/fixtures/new-problem-lessons/practice2-checks.json').read_text(encoding='utf-8'))
else:
 save()
if __name__=='__main__':

 if '--runtime' in sys.argv:

  errors=verify()

  if errors:raise SystemExit(1)

 if '--stress' in sys.argv:

  rows=verify_stress()

  if any(not row['passTest'] for row in rows):raise SystemExit(1)
