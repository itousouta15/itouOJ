#!/usr/bin/env python3
"""Author practice4 lessons and verify them with independent finite oracles in WSL.
Run --append-new for byte-preserving late additions; --check-final-oracles reproduces them.
Run --verify [--codes b492,b493,...] or --stress-final under WSL/Linux.
Legacy --write regenerates the full batch; do not use it to preserve released formatting.
"""
import json, sys, pathlib, random, itertools, math, collections, subprocess, tempfile
ROOT = pathlib.Path(__file__).resolve().parents[3]
SOURCE = ROOT / 'scripts/fixtures/new-problem-lessons/source.json'
MANIFEST = [x for x in json.loads(SOURCE.read_text(encoding='utf-8-sig'))['problems'] if 'b376' <= x['code'] <= 'b496']
INPUT = {x['code']: x for x in MANIFEST}
LESSONS = []
BITCPP = '''struct BIT { int n; vector<long long> f; BIT(int n):n(n),f(n+1){} void add(int i,long long v){for(;i<=n;i+=i&-i)f[i]+=v;} long long sum(int i){long long s=0;for(;i;i-=i&-i)s+=f[i];return s;} };\n'''
BITPY = '''class BIT:
    def __init__(self,n): self.n=n; self.f=[0]*(n+1)
    def add(self,i,v):
        while i<=self.n: self.f[i]+=v; i+=i&-i
    def sum(self,i):
        s=0
        while i: s+=self.f[i]; i-=i&-i
        return s
'''
def add(num,topic,level,concept,explanation,complexity,pitfall,cpp,py,steps,extra='',preamble=''):
    cpp=cpp.replace("'\n'", "'\\n'").replace('\n"','\\n"');py=py.replace("'\n'", "'\\n'").replace('\x00','\\x00').replace('\x01','\\x01')
    code='b'+str(num); src=INPUT[code]; sample=src['samples'][0]
    trace=[]
    for title,description,cells,variables in steps:
        cells=cells or ['∅']
        trace.append(dict(title=title,description=description,cells=[str(x) for x in cells],active=list(range(len(cells))),variables=[[str(k),str(v)] for k,v in variables]))
    LESSONS.append(dict(code=code,title=src['title'].split('. ',1)[-1],topic=topic,level=level,concept=concept,goal=src['statement'].split('輸入')[0].replace('題目描述','').strip(),explanation=explanation.replace('。|', '。\n').split('\n'),complexity=complexity,pitfall=pitfall,sampleInput=sample['input'],sampleOutput=sample['output'],traceLabel='小例子逐步追蹤',trace=trace,cpp='#include <bits/stdc++.h>\nusing namespace std;\n'+extra+'int main(){\n ios::sync_with_stdio(false); cin.tie(nullptr);\n'+cpp.strip()+'\n}\n',python='import sys\n'+preamble+py.strip()+'\n'))
def steps3(a,b,c):
    return [(t,d,cells,vs) for t,d,cells,vs in (a,b,c)]
def checkpoint():
    if '--write' not in sys.argv:return
    LESSONS.sort(key=lambda x:x['code'])
    for x in LESSONS:
        x['goal']='運用'+x['concept']+'，正確求解本題並處理邊界情況。'
        x['traceLabel']='教學例子：'+x['trace'][0]['description']
    dest=ROOT/'src/lib/newProblemLessons/data/practice4.json'
    dest.parent.mkdir(parents=True,exist_ok=True)
    dest.write_text(json.dumps(LESSONS,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

add(376,'sorting','easy','事件排序與掃描線','把到達記為 +1、離開記為 -1，按時間排序。|掃描到一個事件後，累計值就是此時在店內的人數；所有最大值只會在到達時產生，因此沿途取最大即可。|題目保證所有時間互異，不需處理同時抵達與離開的優先順序。','時間 O(n log n)，事件及輸入儲存 O(n)。','不要只比較相鄰兩位顧客；交疊可能跨越許多區間。',
'''int n;cin>>n;vector<pair<int,int>> e;for(int i=0,a,b;i<n;i++){cin>>a>>b;e.push_back({a,1});e.push_back({b,-1});}sort(e.begin(),e.end());int s=0,ans=0;for(auto [t,d]:e){s+=d;ans=max(ans,s);}cout<<ans<<'\n';''',
'''a=list(map(int,sys.stdin.buffer.read().split())); e=[]
for i in range(a[0]):
    x,y=a[1+2*i:3+2*i]; e.extend([(x,1),(y,-1)])
s=ans=0
for t,d in sorted(e): s+=d; ans=max(ans,s)
print(ans)''',steps3(('到達 1','顧客 A 的時段是 [1,8)。',[1],[('目前',1),('最大',1)]),('到達 2','顧客 B 的時段是 [2,5)，形成重疊。',[1,2],[('目前',2),('最大',2)]),('離開 5','B 離開，最大值仍保留。',[1],[('目前',1),('最大',2)])))
add(377,'greedy','easy','排序後輕重配對','先將重量排序，用左右指標分別指向最輕與最重的人。|每回合一定安排最重者；若最輕者也不能和他同乘，他只能獨乘。若可以同乘，就讓兩者配對。|可配對時，若某最佳解中最重者配其他人，可交換搭檔，把較輕者留給原本最輕者的搭檔，不會增加任何車廂的重量，也不會增加車廂數。','時間 O(n log n)，排序及讀取所用記憶體 O(n)。','最後只剩一人仍需一個車廂，不能重複使用同一人。',
'''int n;long long x;cin>>n>>x;vector<long long>a(n);for(auto&v:a)cin>>v;sort(a.begin(),a.end());int l=0,r=n-1,ans=0;while(l<=r){if(l<r&&a[l]+a[r]<=x)l++;r--;ans++;}cout<<ans<<'\n';''',
'''v=list(map(int,sys.stdin.buffer.read().split())); n,x=v[:2]; a=sorted(v[2:]); l=0;r=n-1;ans=0
while l<=r:
    if l<r and a[l]+a[r]<=x: l+=1
    r-=1;ans+=1
print(ans)''',steps3(('排序','容量 10，排序後為 2、4、5、5、6。',[2,4,5,5,6],[('車廂',0)]),('先配最重','2+6≤10，兩人共乘。',[4,5,5],[('車廂',1)]),('完成','4+5≤10，最後的 5 獨乘。',[],[('車廂',3)])))
add(378,'greedy','easy','雙指標區間配對','將期望與公寓各自排序，從最小者開始比較。|公寓小於期望-k 時，對後面所有申請人也太小，直接略過；公寓大於期望+k 時，該申請人不可能再接受後面公寓，略過申請人。|落在可接受範圍時配對並同時前進。交換最佳解的最前端配對可得到這個選擇，且不減少配對數。','時間 O(n log n+m log m)，記憶體 O(n+m)。','差距等於 k 也可接受；不可將每個申請人都配到同一間公寓。',
'''int n,m;long long k;cin>>n>>m>>k;vector<long long>a(n),b(m);for(auto&x:a)cin>>x;for(auto&x:b)cin>>x;sort(a.begin(),a.end());sort(b.begin(),b.end());int i=0,j=0,s=0;while(i<n&&j<m){if(b[j]<a[i]-k)j++;else if(b[j]>a[i]+k)i++;else{i++;j++;s++;}}cout<<s<<'\n';''',
'''v=list(map(int,sys.stdin.buffer.read().split()));n,m,k=v[:3];a=sorted(v[3:3+n]);b=sorted(v[3+n:]);i=j=ans=0
while i<n and j<m:
    if b[j]<a[i]-k:j+=1
    elif b[j]>a[i]+k:i+=1
    else:i+=1;j+=1;ans+=1
print(ans)''',steps3(('排序','k=5，期望 10、20、30，公寓 13、19、25、40。',[13,19,25,40],[('配對',0)]),('前兩組','10 配 13；20 配 19。',[25,40],[('配對',2)]),('第三組','30 配 25，剩下 40 無人可配。',[40],[('配對',3)])))
add(379,'sorting','easy','排序去除重複','排序後，相同值必定相鄰。|第一個元素算一種，其後僅在值與前一個不同時加一；每一種值恰在它的第一個位置被計入。','時間 O(n log n)，讀取與排序記憶體 O(n)。','要數不同值的種類，並非只出現一次的值。',
'''int n;cin>>n;vector<int>a(n);for(auto&x:a)cin>>x;sort(a.begin(),a.end());int s=0;for(int i=0;i<n;i++)if(i==0||a[i]!=a[i-1])s++;cout<<s<<'\n';''',
'''v=list(map(int,sys.stdin.buffer.read().split()));a=sorted(v[1:]);print(sum(i==0 or a[i]!=a[i-1] for i in range(len(a))))''',steps3(('排序','將 4、8、4、9、8、2 排序。',[2,4,4,8,8,9],[('種類',0)]),('遇重複','2、4 各算一次，第二個 4 不加。',[2,4],[('種類',2)]),('完成','8 與 9 再各加一次。',[2,4,8,9],[('種類',4)])))
add(380,'number-theory','medium','依位數分段定位','d 位數從 start=10^(d-1) 開始，共 9×start 個，貢獻 d×9×start 個字元。|若 k 大於整段長度就扣掉整段，進入下一位數區段。留在該段時，k-1 是零起算偏移。|目標整數是 start+(k-1)//d，取其字串的第 (k-1)%d 個字元；先減一可避免段落邊界偏移。','每筆 O(log k) 位數處理，輸入與輸出緩存 O(q)，計算額外 O(log k) 字元。','C++ 用 64 位整數；本題 k≤10^18，走到 17 位區段即可，乘積不超過有號 64 位。',
'''int q;cin>>q;while(q--){long long k;cin>>k;long long d=1,s=1;while(k>9*s*d){k-=9*s*d;s*=10;d++;}string z=to_string(s+(k-1)/d);cout<<z[(k-1)%d]<<'\n';}''',
'''v=list(map(int,sys.stdin.buffer.read().split()));out=[]
for k in v[1:]:
    d=start=1
    while k>9*start*d:k-=9*start*d;start*=10;d+=1
    out.append(str(start+(k-1)//d)[(k-1)%d])
print('\n'.join(out))''',steps3(('查第 191 字元','一位數段有 9 個字元。',[1,9],[('k',191)]),('扣掉兩段','扣 9 後為 182，再扣二位數段 180。',[10,99],[('k',2),('位數',3)]),('定位','三位數段從 100 開始，偏移 1，取 100 的第二位。',['1','0','0'],[('答案',0)])))
add(381,'search','medium','逐列回溯與攻擊線集合','每列放一個皇后，深度就是目前列號。|用欄 c、斜線 r+c 與 r-c+7 三個集合記錄攻擊線；格子為星號或攻擊線已用時跳過。|每個合法棋局都有唯一的逐列選擇路徑，完整走到第八列便計數一次；撤銷標記後才能探索下一分支。','固定 8×8；搜尋 O(8!×8)，遞迴與攻擊線 O(8)，棋盤 O(64)。','保留格不會阻擋攻擊，不能遇到星號就停止檢查同一條斜線。',
'''vector<string>b(8);for(auto&s:b)cin>>s;bool c[8]={},d[15]={},e[15]={};function<int(int)>dfs=[&](int r){if(r==8)return 1;int ans=0;for(int j=0;j<8;j++)if(b[r][j]=='.'&&!c[j]&&!d[r+j]&&!e[r-j+7]){c[j]=d[r+j]=e[r-j+7]=true;ans+=dfs(r+1);c[j]=d[r+j]=e[r-j+7]=false;}return ans;};cout<<dfs(0)<<'\n';''',
'''b=sys.stdin.read().split();col=set();diag=set();anti=set()
def dfs(r):
    if r==8:return 1
    ans=0
    for c in range(8):
        if b[r][c]=='.' and c not in col and r+c not in diag and r-c not in anti:
            col.add(c);diag.add(r+c);anti.add(r-c);ans+=dfs(r+1);col.remove(c);diag.remove(r+c);anti.remove(r-c)
    return ans
print(dfs(0))''',steps3(('第一列','全空棋盤的一個分支：零起算欄 0。',['Q.......'],[('r',0)]),('第二列','欄 0 同欄、欄 1 同斜線，欄 4 可以放。',['Q.......','....Q...'],[('r',1)]),('第三列','選欄 7，與先前皇后都不衝突；仍須繼續搜尋。',['Q.......','....Q...','.......Q'],[('r',2)])))
add(382,'search','medium','枚舉子集合的重量差','若第一組總重為 s，另一組為 total-s，差為 |total-2s|。|遞迴對每個蘋果作放入第一組或第二組的二選一，並維護目前第一組總重。|每種分法均被完整枚舉，因此葉節點的最小差就是答案。','時間 O(2^n)，遞迴與輸入 O(n)；Python 不儲存所有子集合。','組別允許空；重量總和需用 64 位整數。',
'''int n;cin>>n;vector<long long>a(n);long long total=0;for(auto&x:a){cin>>x;total+=x;}long long ans=total;function<void(int,long long)>dfs=[&](int i,long long s){if(i==n){ans=min(ans,llabs(total-2*s));return;}dfs(i+1,s);dfs(i+1,s+a[i]);};dfs(0,0);cout<<ans<<'\n';''',
'''v=list(map(int,sys.stdin.buffer.read().split()));a=v[1:];total=sum(a);ans=total
def dfs(i,s):
    global ans
    if i==len(a):ans=min(ans,abs(total-2*s));return
    dfs(i+1,s);dfs(i+1,s+a[i])
dfs(0,0);print(ans)''',steps3(('總重','2、5、8、9 合計 24。',[2,5,8,9],[('total',24)]),('候選分組','第一組 2+9=11，另一組 5+8=13。',[11,13],[('差',2)]),('確認最小','沒有子集合和為 12；總和偶數使差也為偶數，所以最小為 2。',[11,13],[('答案',2)])))
add(383,'number-theory','easy','解出兩種操作次數','令兩種操作次數分別為 u、v，則 a=u+2v、b=2u+v。|解得 u=(2b-a)/3、v=(2a-b)/3。兩者為非負整數，等價於 (a+b)%3=0 且 max(a,b)≤2min(a,b)。|存在這些操作次數時任意逐次執行剩餘操作都不會超取，因為剩下硬幣恰是尚未執行操作所需總數。','每筆 O(1)，輸入輸出緩存 O(t)。','(0,0) 為 YES；只判斷總數是否為 3 的倍數不足。',
'''int t;cin>>t;while(t--){long long a,b;cin>>a>>b;cout<<((a+b)%3==0&&max(a,b)<=2*min(a,b)?"YES":"NO")<<'\n';}''',
'''v=list(map(int,sys.stdin.buffer.read().split()));print('\n'.join('YES' if (a+b)%3==0 and max(a,b)<=2*min(a,b) else 'NO' for a,b in zip(v[1::2],v[2::2])))''',steps3(('檢查 7、8','總數 15 可分成 5 次操作。',[7,8],[('總次數',5)]),('解方程','u=(16-7)/3=3，v=(14-8)/3=2。',[3,2],[('u',3),('v',2)]),('清空','三次取 (1,2)，兩次取 (2,1)，總共取走 (7,8)。',[0,0],[('答案','YES')])))
add(384,'number-theory','easy','全部選法扣掉攻擊對','k² 個格子選兩個，不區分騎士身分，共 k²(k²-1)/2 種。|每個互相攻擊的騎士對唯一對應一個 2×3 或 3×2 矩形，且每個這種矩形有兩個攻擊對。|兩方向矩形各有 (k-1)(k-2) 個，所以扣 4(k-1)(k-2)；k<3 時攻擊數為 0。','時間 O(n)，C++ 額外 O(1)，Python 輸出列表 O(n)。','乘法從一開始就用 64 位；交換兩隻騎士不能再算一次。',
'''long long n;cin>>n;for(long long k=1;k<=n;k++){long long z=k*k;cout<<z*(z-1)/2-(k<3?0:4*(k-1)*(k-2))<<'\n';}''',
'''n=int(sys.stdin.read());print('\n'.join(str(k*k*(k*k-1)//2-(4*(k-1)*(k-2) if k>=3 else 0)) for k in range(1,n+1)))''',steps3(('3×3 棋盤','共有 9 個格子。',[9],[('任選兩格',36)]),('計攻擊','2×3 與 3×2 矩形共 4 個，每個 2 對。',[2,2,2,2],[('攻擊對',8)]),('相減','36-8=28。',[28],[('答案',28)])))
add(385,'number-theory','easy','依層數與奇偶計算邊界偏移','設 n=max(y,x)，前 n-1 層已填完 (n-1)² 格。|n 為奇數時從 (n,1) 向右再向上：y=n 時偏移 x，否則偏移 2n-y。|n 為偶數時從 (1,n) 向下再向左：x=n 時偏移 y，否則偏移 2n-x。將偏移加上 (n-1)² 即得值。','每筆 O(1)，輸入輸出緩存 O(t)。','本平台明確指定行走方向，應依題述推導；平方需 64 位。',
'''int t;cin>>t;while(t--){long long y,x;cin>>y>>x;long long n=max(y,x),d;if(n%2)d=(y==n?x:2*n-y);else d=(x==n?y:2*n-x);cout<<(n-1)*(n-1)+d<<'\n';}''',
'''v=list(map(int,sys.stdin.buffer.read().split()));out=[]
for y,x in zip(v[1::2],v[2::2]):
    n=max(y,x)
    d=(x if y==n else 2*n-y) if n%2 else (y if x==n else 2*n-x)
    out.append(str((n-1)**2+d))
print('\n'.join(out))''',steps3(('定位 (4,5)','所在層 n=5，前面四層共 16 格。',[16],[('n',5)]),('奇數層起步','(5,1)=17，走到 (5,5)=21。',[17,18,19,20,21],[('偏移',5)]),('向上一步','(4,5)=22，偏移為 2×5-4=6。',[22],[('答案',22)])))
add(386,'number-theory','easy','計算階乘中的質因數 5','每個尾端零來自一對 2×5；階乘中的 2 比 5 多，故只需計算 5 的次方數。|5 的倍數貢獻一個 5，25 的倍數再多一個，125 的倍數再多一個。累加 floor(n/5)+floor(n/25)+… 即可。|反覆令 n//=5 並加到答案，避免直接計算階乘。','時間 O(log₅ n)，額外記憶體 O(1)。','25 要貢獻兩個 5，不能只用 n/5。',
'''long long n,s=0;cin>>n;while(n){n/=5;s+=n;}cout<<s<<'\n';''',
'''n=int(sys.stdin.read());ans=0
while n:n//=5;ans+=n
print(ans)''',steps3(('第一層','30 以內有 6 個 5 的倍數。',[5,10,15,20,25,30],[('累計',6)]),('第二層','25 額外再提供一個 5。',[25],[('累計',7)]),('結束','沒有 125 的倍數，因此共七個零。',[],[('答案',7)])))
add(387,'number-theory','easy','模數快速冪','每一位有兩種獨立選擇，所以答案為 2^n。|用平方求冪：若指數最低位為 1，就把目前底數乘進答案；每輪將底數平方、指數除二。|不變量是答案乘上底數的剩餘指數等於原本的 2^n（模 M）。指數歸零時答案即完成。','時間 O(log n)，額外記憶體 O(1)。','C++ 乘法用 64 位並立即取模，不能先算完整的 2^n。',
'''long long n;cin>>n;long long a=2,r=1,M=1000000007;while(n){if(n&1)r=r*a%M;a=a*a%M;n>>=1;}cout<<r<<'\n';''',
'''n=int(sys.stdin.read());print(pow(2,n,1000000007))''',steps3(('開始','求 2^5，答案暫為 1。',[2],[('指數',5),('答案',1)]),('取最低位','5 為奇數，答案乘 2；底數平方為 4，剩餘指數 2。',[4],[('指數',2),('答案',2)]),('完成','再平方至 16，最後乘入得到 32。',[32],[('指數',0),('答案',32)])))
add(388,'greedy','easy','維護已修正前綴的最大值','從左到右，維護修正後前一項 last。|若當前值小於 last，至少要加到 last 才合法；加更多只會使後面要求更嚴格，因此恰加 last-x 最好。|若當前值不小於 last，保持原值。逐項達成局部最小且不妨礙後續，故總增量最小。','時間 O(n)，C++ 額外 O(1)，Python 讀取列表 O(n)。','遞增在此是非遞減，相等可接受；總操作數可能超過 32 位。',
'''int n;cin>>n;long long last=0,ans=0;for(int i=0;i<n;i++){long long x;cin>>x;if(i&&x<last)ans+=last-x;else last=x;}cout<<ans<<'\n';''',
'''v=list(map(int,sys.stdin.buffer.read().split()));a=v[1:];last=a[0];ans=0
for x in a[1:]:
    if x<last:ans+=last-x
    else:last=x
print(ans)''',steps3(('讀 3','小例子 3、2、5、1。',[3,2,5,1],[('last',3),('增量',0)]),('補到 3','2 必須加 1；下一項 5 更新 last。',[3,3,5,1],[('last',5),('增量',1)]),('補到 5','最後 1 加 4，總共 5。',[3,3,5,5],[('增量',5)])))
add(389,'strings','easy','連續區段長度','逐字掃描，若與上一字元相同就延長目前區段，否則重設為 1。|每一步取目前區段長度的最大值；每個相同字元區段在末端都會被完整計算。','時間 O(n)，儲存字串 O(n)，掃描額外 O(1)。','要求連續，不能改成整條字串的字母出現次數。',
'''string s;cin>>s;int run=0,ans=0;char last=0;for(char c:s){run=(c==last?run+1:1);ans=max(ans,run);last=c;}cout<<ans<<'\n';''',
'''s=sys.stdin.read().strip();last='';run=ans=0
for c in s:run=run+1 if c==last else 1;ans=max(ans,run);last=c
print(ans)''',steps3(('前兩字','掃描 AA。',['A','A'],[('連續',2),('最大',2)]),('新字元','接著遇 C，連續長度重設 1。',['C'],[('連續',1),('最大',2)]),('延長','再讀 CC，這段成為 CCC。',['C','C','C'],[('連續',3),('最大',3)])))
add(390,'basics','easy','完整總和扣除已知總和','1 到 n 的總和是 n(n+1)/2。|題目保證恰好少一個數且其餘互異，所以扣掉輸入的 n-1 個數後，恰剩缺少的數。','時間 O(n)，C++ 額外 O(1)，Python 讀取 O(n)。','n=2 時只有一個已知數；n(n+1) 要使用 64 位。',
'''long long n;cin>>n;long long s=n*(n+1)/2,x;for(int i=1;i<n;i++){cin>>x;s-=x;}cout<<s<<'\n';''',
'''v=list(map(int,sys.stdin.buffer.read().split()));n=v[0];print(n*(n+1)//2-sum(v[1:]))''',steps3(('完整總和','n=5，總和 15。',[1,2,3,4,5],[('總和',15)]),('扣除已知','已知 2、3、1、5，總和 11。',[2,3,1,5],[('已知',11)]),('求缺值','15-11=4。',[4],[('答案',4)])))
add(391,'simulation','easy','依奇偶逐步模擬','先輸出初始 n，因為題目要求序列必須包含起點。|只要 n 不為 1，偶數除二、奇數乘三加一，再輸出新值。每一步完全依題目轉移規則，產生的順序就是要求序列。|使用 64 位儲存中間值；以實際產生的步數衡量成本，不宣稱一般 Collatz 猜想已有證明。','若產生 T 個數，時間 O(T)；C++ 額外 O(1)，Python 輸出緩存 O(T)。','起點 1 只輸出一次；不可用 32 位儲存中間的 3n+1。',
'''long long n;cin>>n;cout<<n;while(n!=1){n=(n%2?3*n+1:n/2);cout<<' '<<n;}cout<<'\n';''',
'''n=int(sys.stdin.read());out=[str(n)]
while n!=1:n=3*n+1 if n%2 else n//2;out.append(str(n))
print(' '.join(out))''',steps3(('起點 3','3 是奇數，下一步是 3×3+1。',[3],[('下一個',10)]),('偶數除二','10→5，再由奇數規則到 16。',[3,10,5,16],[('目前',16)]),('抵達 1','16→8→4→2→1，停止。',[16,8,4,2,1],[('結束',1)])))

add(392,'data-structures','hard','離線字典序座標與樹狀陣列排名','先讀完操作，將所有更新會使用的字串排序去重，字典序位置固定。|樹狀陣列維護每個字串目前份數，刪除時先確認份數大於零。字首 p 對應排序區間 [lower_bound(p),lower_bound(p+{))。|若區間份數足夠，令目標排名為區間前的份數+k，再用樹狀陣列的二進位下降找第 k 份；重複份數自然佔用多個排名。','設總字元數 S；排序字串比較成本最壞 O(S log Q)，操作 O(S log Q+Q log Q)，輸出另計字元數；空間 O(S+Q)。','刪不存在的字串不減計數；短字串本身必須排在它的延伸之前。',
'''int q;cin>>q;struct Op{int t,k;string s;};vector<Op>ops;vector<string>a;while(q--){int t,k=0;string s;cin>>t>>s;if(t==3)cin>>k;else a.push_back(s);ops.push_back({t,k,s});}sort(a.begin(),a.end());a.erase(unique(a.begin(),a.end()),a.end());BIT b(a.size());vector<int>cnt(a.size());for(auto o:ops){int l=lower_bound(a.begin(),a.end(),o.s)-a.begin();if(o.t!=3){int d=o.t==1?1:(cnt[l]>0?-1:0);cnt[l]+=d;b.add(l+1,d);}else{int r=lower_bound(a.begin(),a.end(),o.s+"{")-a.begin();if(b.sum(r)-b.sum(l)<o.k){cout<<"NONE\n";continue;}long long k=b.sum(l)+o.k;int pos=0;for(int z=1<<18;z;z>>=1)if(pos+z<=b.n&&b.f[pos+z]<k){k-=b.f[pos+z];pos+=z;}cout<<a[pos]<<'\n';}}''',
'''from bisect import bisect_left
+ops=[line.split() for line in sys.stdin.read().splitlines()[1:]]
+a=sorted({o[1] for o in ops if o[0]!='3'});b=BIT(len(a));cnt=[0]*len(a);out=[]
+for o in ops:
+    t,s=o[:2];l=bisect_left(a,s)
+    if t!='3':
+        d=1 if t=='1' else (-1 if cnt[l] else 0);cnt[l]+=d;b.add(l+1,d)
+    else:
+        r=bisect_left(a,s+'{');k=int(o[2])
+        if b.sum(r)-b.sum(l)<k:out.append('NONE');continue
+        k+=b.sum(l);pos=0;z=1<<len(a).bit_length()
+        while z:
+            if pos+z<=b.n and b.f[pos+z]<k:k-=b.f[pos+z];pos+=z
+            z//=2
+        out.append(a[pos])
+print('\n'.join(out))'''.replace('\n+','\n'),steps3(('插入','插入 a、ab、a。',['a','a','ab'],[('a 份數',2)]),('查排名','字首 a 的第 2 份仍為 a。',['a','a','ab'],[('答案','a')]),('刪除一份','刪去一份 a，字首 a 的第 2 份改為 ab。',['a','ab'],[('答案','ab')])),extra=BITCPP,preamble=BITPY)

add(393,'data-structures','hard','全體逆序減同類逆序的滑動窗','對數值做座標壓縮，全體及每種種類分別建立樹狀陣列。|從右加入 x 時，新增的逆序是窗內大於 x 的總數減同類大於 x 的數量；從左移出 x 時，刪掉窗內小於 x 且不同類的數量。|加入時 x 在所有舊元素右邊，移出時 x 在所有剩餘元素左邊，因此兩個公式恰好涵蓋所有受影響的配對。','時間 O(N log N)，各種類壓縮長度總和 O(N)，記憶體 O(N)。','大於與小於都要嚴格；相同值和同類配對均不計。',
'''int n,k;cin>>n>>k;vector<long long>x(n),c(n),vals;map<long long,vector<long long>>vs;for(int i=0;i<n;i++){cin>>x[i]>>c[i];vals.push_back(x[i]);vs[c[i]].push_back(x[i]);}sort(vals.begin(),vals.end());vals.erase(unique(vals.begin(),vals.end()),vals.end());map<long long,BIT>bs;for(auto&[t,v]:vs){sort(v.begin(),v.end());v.erase(unique(v.begin(),v.end()),v.end());bs.emplace(t,BIT(v.size()));}BIT all(vals.size());long long ans=0;auto rank=[&](auto&v,long long y){return int(lower_bound(v.begin(),v.end(),y)-v.begin())+1;};for(int i=0;i<n;i++){int r=rank(vals,x[i]),s=rank(vs[c[i]],x[i]);auto&b=bs.at(c[i]);ans+=all.sum(all.n)-all.sum(r)-b.sum(b.n)+b.sum(s);all.add(r,1);b.add(s,1);if(i>=k){int j=i-k,rj=rank(vals,x[j]),sj=rank(vs[c[j]],x[j]);auto&bj=bs.at(c[j]);all.add(rj,-1);bj.add(sj,-1);ans-=all.sum(rj-1)-bj.sum(sj-1);}if(i>=k-1)cout<<ans<<(i==n-1?'\n':' ');}''',
'''from bisect import bisect_left
+from collections import defaultdict
+v=list(map(int,sys.stdin.buffer.read().split()));n,k=v[:2];a=list(zip(v[2::2],v[3::2]));vals=sorted({x for x,c in a});vs=defaultdict(list)
+for x,c in a:vs[c].append(x)
+vs={c:sorted(set(z)) for c,z in vs.items()};bs={c:BIT(len(z)) for c,z in vs.items()};b=BIT(len(vals));ans=0;out=[]
+for i,(x,c) in enumerate(a):
+    r=bisect_left(vals,x)+1;s=bisect_left(vs[c],x)+1;t=bs[c]
+    ans+=b.sum(b.n)-b.sum(r)-t.sum(t.n)+t.sum(s);b.add(r,1);t.add(s,1)
+    if i>=k:
+        y,d=a[i-k];r=bisect_left(vals,y)+1;s=bisect_left(vs[d],y)+1;t=bs[d];b.add(r,-1);t.add(s,-1);ans-=b.sum(r-1)-t.sum(s-1)
+    if i>=k-1:out.append(str(ans))
+print(' '.join(out))'''.replace('\n+','\n'),steps3(('前三筆','(4,1)、(3,1)、(2,2)，同類的 4>3 不計。',[4,3,2],[('異類逆序',2)]),('加入右端','加入 (1,1)，只有 (2,2)>1 是新增異類逆序。',[4,3,2,1],[('暫計',3)]),('移出左端','移出 (4,1)，只刪與 (2,2) 的一對。',[3,2,1],[('答案',2)])),extra=BITCPP,preamble=BITPY)

add(394,'data-structures','hard','懶標記最小值樹與向左優先搜尋','線段樹儲存區間最小值，區間加使用懶標記。|查詢時，若節點與範圍不交或其最小值大於 h，即整段不可能有答案。否則先搜尋左子樹，再搜尋右子樹。|一路保留可能含解的節點，第一個找到的葉子就是最小編號；懶標記下推確保子節點讀數正確。','建樹 O(N)，每個更新及搜尋 O(log N)，記憶體 O(N)，讀取操作另需 O(Q)。','累積更新可超過 32 位；查詢 h 本身不會更新讀數。',
'''int n,q;cin>>n>>q;vector<long long>a(n),mn(4*n),lazy(4*n);for(auto&x:a)cin>>x;function<void(int,int,int)>build=[&](int p,int l,int r){if(l==r){mn[p]=a[l];return;}int m=(l+r)/2;build(p*2,l,m);build(p*2+1,m+1,r);mn[p]=min(mn[p*2],mn[p*2+1]);};auto push=[&](int p){for(int z:{p*2,p*2+1}){mn[z]+=lazy[p];lazy[z]+=lazy[p];}lazy[p]=0;};function<void(int,int,int,int,int,long long)>upd=[&](int p,int l,int r,int L,int R,long long d){if(r<L||R<l)return;if(L<=l&&r<=R){mn[p]+=d;lazy[p]+=d;return;}push(p);int m=(l+r)/2;upd(p*2,l,m,L,R,d);upd(p*2+1,m+1,r,L,R,d);mn[p]=min(mn[p*2],mn[p*2+1]);};function<int(int,int,int,int,int,long long)>find=[&](int p,int l,int r,int L,int R,long long h){if(r<L||R<l||mn[p]>h)return -1;if(l==r)return l+1;push(p);int m=(l+r)/2,z=find(p*2,l,m,L,R,h);return z!=-1?z:find(p*2+1,m+1,r,L,R,h);};build(1,0,n-1);while(q--){int t,l,r;long long d;cin>>t>>l>>r>>d;if(t==1)upd(1,0,n-1,l-1,r-1,d);else cout<<find(1,0,n-1,l-1,r-1,d)<<'\n';}''',
'''v=list(map(int,sys.stdin.buffer.read().split()));n,q=v[:2];a=v[2:2+n];mn=[0]*(4*n);lazy=mn.copy()
+def build(p,l,r):
+    if l==r:mn[p]=a[l];return
+    m=(l+r)//2;build(p*2,l,m);build(p*2+1,m+1,r);mn[p]=min(mn[p*2],mn[p*2+1])
+def push(p):
+    for z in (p*2,p*2+1):mn[z]+=lazy[p];lazy[z]+=lazy[p]
+    lazy[p]=0
+def upd(p,l,r,L,R,d):
+    if r<L or R<l:return
+    if L<=l and r<=R:mn[p]+=d;lazy[p]+=d;return
+    push(p);m=(l+r)//2;upd(p*2,l,m,L,R,d);upd(p*2+1,m+1,r,L,R,d);mn[p]=min(mn[p*2],mn[p*2+1])
+def find(p,l,r,L,R,h):
+    if r<L or R<l or mn[p]>h:return -1
+    if l==r:return l+1
+    push(p);m=(l+r)//2;z=find(p*2,l,m,L,R,h)
+    return z if z!=-1 else find(p*2+1,m+1,r,L,R,h)
+build(1,0,n-1);out=[]
+for j in range(2+n,len(v),4):
+    t,l,r,d=v[j:j+4]
+    if t==1:upd(1,0,n-1,l-1,r-1,d)
+    else:out.append(str(find(1,0,n-1,l-1,r-1,d)))
+print('\n'.join(out))'''.replace('\n+','\n'),steps3(('初始查詢','3、8、1、6、4；[2,5] 中 ≤2 的第一格為 3。',[3,8,1,6,4],[('答案',3)]),('區間加','[1,3] 每格加 4。',[7,12,5,6,4],[('全域最小',4)]),('限制範圍','查 [1,4] 且 ≤5，左側最小值太大，定位第三格。',[7,12,5,6],[('答案',3)])))

add(395,'data-structures','hard','持久化線段樹：路徑複製','每個版本存一個根節點，節點保存區間總和與最小值。|單點加只複製根到該葉的路徑，未受影響的子樹共用；舊節點永不改寫，因此所有舊版本保持不變。|區間查詢合併不相交分段的和與最小值，查詢產生的版本直接沿用原根。','建樹 O(N)，操作 O(log N)，空間 O(N+Q log N)；Python 用緊密整數陣列儲存節點。','查詢操作也產生版本；更新是加 d 而非設為 d。',
'''int n,q;cin>>n>>q;vector<long long>a(n);for(auto&x:a)cin>>x;struct Node{int l=0,r=0;long long s=0,m=0;};vector<Node>tr(1);function<int(int,int)>build=[&](int l,int r){int p=tr.size();tr.push_back({});if(l==r){tr[p].s=tr[p].m=a[l];return p;}int m=(l+r)/2;int x=build(l,m),y=build(m+1,r);tr[p]={x,y,tr[x].s+tr[y].s,min(tr[x].m,tr[y].m)};return p;};function<int(int,int,int,int,long long)>upd=[&](int old,int l,int r,int x,long long d){int p=tr.size();tr.push_back(tr[old]);if(l==r){tr[p].s+=d;tr[p].m+=d;return p;}int m=(l+r)/2;if(x<=m){int z=upd(tr[p].l,l,m,x,d);tr[p].l=z;}else{int z=upd(tr[p].r,m+1,r,x,d);tr[p].r=z;}tr[p].s=tr[tr[p].l].s+tr[tr[p].r].s;tr[p].m=min(tr[tr[p].l].m,tr[tr[p].r].m);return p;};function<pair<long long,long long>(int,int,int,int,int)>get=[&](int p,int l,int r,int L,int R)->pair<long long,long long>{if(r<L||R<l)return {0,LLONG_MAX};if(L<=l&&r<=R)return {tr[p].s,tr[p].m};int m=(l+r)/2;auto x=get(tr[p].l,l,m,L,R),y=get(tr[p].r,m+1,r,L,R);return {x.first+y.first,min(x.second,y.second)};};vector<int>root(q+1);root[0]=build(0,n-1);for(int i=1;i<=q;i++){int t,v,x;long long y;cin>>t>>v>>x>>y;if(t==1)root[i]=upd(root[v],0,n-1,x-1,y);else{root[i]=root[v];auto z=get(root[v],0,n-1,x-1,y-1);cout<<z.first<<' '<<z.second<<'\n';}}''',
'''from array import array
+v=list(map(int,sys.stdin.buffer.read().split()));n,q=v[:2];a=v[2:2+n];lc=array('i',[0]);rc=array('i',[0]);sm=array('q',[0]);mn=array('q',[0])
+def node(l,r,s,m):
+    p=len(sm);lc.append(l);rc.append(r);sm.append(s);mn.append(m);return p
+def build(l,r):
+    if l==r:return node(0,0,a[l],a[l])
+    m=(l+r)//2;x=build(l,m);y=build(m+1,r);return node(x,y,sm[x]+sm[y],min(mn[x],mn[y]))
+def upd(p,l,r,x,d):
+    if l==r:return node(0,0,sm[p]+d,mn[p]+d)
+    m=(l+r)//2;u,w=lc[p],rc[p]
+    if x<=m:u=upd(u,l,m,x,d)
+    else:w=upd(w,m+1,r,x,d)
+    return node(u,w,sm[u]+sm[w],min(mn[u],mn[w]))
+def get(p,l,r,L,R):
+    if r<L or R<l:return (0,10**30)
+    if L<=l and r<=R:return sm[p],mn[p]
+    m=(l+r)//2;x,y=get(lc[p],l,m,L,R),get(rc[p],m+1,r,L,R);return x[0]+y[0],min(x[1],y[1])
+root=[build(0,n-1)];out=[]
+for j in range(2+n,len(v),4):
+    t,b,x,y=v[j:j+4]
+    if t==1:root.append(upd(root[b],0,n-1,x-1,y))
+    else:root.append(root[b]);s,m=get(root[b],0,n-1,x-1,y-1);out.append(f'{s} {m}')
+print('\n'.join(out))'''.replace('\n+','\n'),steps3(('版本 0','初始值為 1、-2、4。',[1,-2,4],[('版本',0)]),('分支 1','以 0 為基礎，第二欄加 5。',[1,3,4],[('總和',8),('最小',1)]),('分支 3','重新以 0 為基礎，第三欄減 10；不影響版本 1。',[1,-2,-6],[('總和',-7),('最小',-6)])))

add(396,'data-structures','medium','持久化鏈結堆疊與倍增','版本只記頂端節點。push 新增一個節點，其父指標是舊頂端；pop 則改用父指標。|每個節點再保存 2^j 層祖先，以二進位分解 k-1，從頂端往下跳。|深度不足時輸出 EMPTY；查詢版本與原版本共用頂端，任何操作都不會修改舊節點。','時間 O(Q log Q)，空間 O(Q log Q)；Python 倍增表使用整數陣列。','第 k 個是跳 k-1 次；對空堆疊 pop 仍為空。',
'''int q;cin>>q;int L=1;while((1<<L)<=q)L++;vector<vector<int>>up(L,vector<int>(q+1));vector<int>root(q+1),dep(q+1);vector<long long>val(q+1);for(int i=1;i<=q;i++){int t,v;cin>>t>>v;int p=root[v];if(t==1){cin>>val[i];dep[i]=dep[p]+1;up[0][i]=p;for(int j=1;j<L;j++)up[j][i]=up[j-1][up[j-1][i]];root[i]=i;}else if(t==2)root[i]=up[0][p];else{int k;cin>>k;root[i]=p;if(k>dep[p])cout<<"EMPTY\n";else{int d=k-1;for(int j=0;j<L;j++)if(d>>j&1)p=up[j][p];cout<<val[p]<<'\n';}}}''',
'''from array import array
+lines=sys.stdin.read().splitlines();q=int(lines[0]);L=q.bit_length();up=[array('i',[0])*(q+1) for _ in range(L)];root=[0]*(q+1);dep=[0]*(q+1);val=[0]*(q+1);out=[]
+for i,line in enumerate(lines[1:],1):
+    z=list(map(int,line.split()));t,v=z[:2];p=root[v]
+    if t==1:
+        val[i]=z[2];dep[i]=dep[p]+1;up[0][i]=p
+        for j in range(1,L):up[j][i]=up[j-1][up[j-1][i]]
+        root[i]=i
+    elif t==2:root[i]=up[0][p]
+    else:
+        root[i]=p;k=z[2]
+        if k>dep[p]:out.append('EMPTY');continue
+        d=k-1
+        for j in range(L):
+            if d>>j&1:p=up[j][p]
+        out.append(str(val[p]))
+print('\n'.join(out))'''.replace('\n+','\n'),steps3(('加入 8','版本 1 從空版本推入 8。',[8],[('深度',1)]),('加入 3','版本 2 頂端是 3，第 2 個是 8。',[3,8],[('查第 2 個',8)]),('分支彈出','版本 4 從版本 2 彈出；版本 2 仍保留兩個值。',[8],[('版本 4 深度',1)])))

add(397,'data-structures','hard','加權多數候選與精確驗證','線段樹每段保存一個候選種類與剩餘權重。合併相同種類就相加，不同種類就互相抵銷較小權重。|嚴格超過一半權重的種類不可能被全部抵銷，所以查詢區間的抵銷候選包含唯一可能答案；候選仍須驗證。|每類保存出現位置與權重前綴和，用二分計算候選在區間內的實際權重。檢查 weight×q>total×p，C++ 使用 __int128。','預處理 O(N log N)，每筆 O(log N)，空間 O(N)。','抵銷剩餘權重不是實際總權重；門檻為嚴格大於，等於時不合格。',
'''int n,q;cin>>n>>q;using P=pair<long long,long long>;auto merge=[](P a,P b){if(a.first==b.first)return P(a.first,a.second+b.second);if(a.second<b.second)swap(a,b);return P(a.first,a.second-b.second);};int z=1;while(z<n)z*=2;vector<P>tr(2*z);vector<long long>pre(n+1);map<long long,vector<int>>pos;map<long long,vector<long long>>sums;for(int i=0;i<n;i++){long long t,w;cin>>t>>w;tr[z+i]={t,w};pre[i+1]=pre[i]+w;pos[t].push_back(i);auto&s=sums[t];if(s.empty())s.push_back(0);s.push_back(s.back()+w);}for(int i=z-1;i;i--)tr[i]=merge(tr[i*2],tr[i*2+1]);while(q--){int l,r;long long p,d;cin>>l>>r>>p>>d;int L=l-1+z,R=r+z;P a={0,0},b={0,0};while(L<R){if(L&1)a=merge(a,tr[L++]);if(R&1)b=merge(tr[--R],b);L/=2;R/=2;}long long t=merge(a,b).first,w=0;if(pos.count(t)){auto&v=pos[t];auto&s=sums[t];w=s[lower_bound(v.begin(),v.end(),r)-v.begin()]-s[lower_bound(v.begin(),v.end(),l-1)-v.begin()];}cout<<((__int128)w*d>(__int128)(pre[r]-pre[l-1])*p?t:-1)<<'\n';}''',
'''from bisect import bisect_left
+v=list(map(int,sys.stdin.buffer.read().split()));n,q=v[:2];z=1<<(n-1).bit_length();tr=[(0,0)]*(2*z);pre=[0];pos={};sums={}
+def merge(a,b):
+    if a[0]==b[0]:return a[0],a[1]+b[1]
+    if a[1]<b[1]:a,b=b,a
+    return a[0],a[1]-b[1]
+for i in range(n):
+    t,w=v[2+2*i:4+2*i];tr[z+i]=(t,w);pre.append(pre[-1]+w);pos.setdefault(t,[]).append(i);s=sums.setdefault(t,[0]);s.append(s[-1]+w)
+for i in range(z-1,0,-1):tr[i]=merge(tr[2*i],tr[2*i+1])
+out=[]
+for i in range(2+2*n,len(v),4):
+    l,r,p,q=v[i:i+4];L=l-1+z;R=r+z;a=b=(0,0)
+    while L<R:
+        if L&1:a=merge(a,tr[L]);L+=1
+        if R&1:R-=1;b=merge(tr[R],b)
+        L//=2;R//=2
+    t=merge(a,b)[0];w=0
+    if t in pos:w=sums[t][bisect_left(pos[t],r)]-sums[t][bisect_left(pos[t],l-1)]
+    out.append(str(t if w*q>(pre[r]-pre[l-1])*p else -1))
+print('\n'.join(out))'''.replace('\n+','\n'),steps3(('加權資料','(1,5)、(2,1)、(2,2)、(1,2)，總重 10。',['1:7','2:3'],[('總重',10)]),('抵銷','不同種類互相抵銷，種類 1 剩餘 4。',['1:4'],[('候選',1)]),('驗證','對門檻 2/3，7×3=21>10×2=20，輸出 1。',[21,20],[('答案',1)])))

add(398,'data-structures','hard','逆序啟用、並查集與小併大','從全拆除狀態開始，倒著加入展品；已啟用相鄰格以並查集合併。|每個分量維護基礎價值加同類配對數，以及種類頻率表。合併 A、B 新增的配對恰為 Σ countA[t]×countB[t]。|把節點數較小的分量頻率表併入較大分量；每個展品搬移後所在分量至少倍增，故總合併成本為期望O(N log N)。價值非負，所以合併後不小於原分量，可用一個全域最大值並保存每個拆除次數的答案。','期望 O(N log N+Q)，雜湊頻率表小併大；空間 O(N+Q)。','拆除後兩側不會靠攏成相鄰；逆序只合併原編號相鄰的展品。',
'''int n,q;cin>>n>>q;vector<long long>t(n),val(n);for(int i=0;i<n;i++)cin>>t[i]>>val[i];vector<int>ord(n),pa(n),on(n),sz(n,1);for(auto&x:ord){cin>>x;--x;}iota(pa.begin(),pa.end(),0);vector<unordered_map<long long,int>>cnt(n);vector<long long>ans(n+1);function<int(int)>find=[&](int x){return pa[x]==x?x:pa[x]=find(pa[x]);};long long best=0;auto unite=[&](int a,int b){a=find(a);b=find(b);if(a==b)return;if(sz[a]<sz[b])swap(a,b);sz[a]+=sz[b];val[a]+=val[b];for(auto [t,c]:cnt[b]){val[a]+=1LL*c*cnt[a][t];cnt[a][t]+=c;}cnt[b].clear();pa[b]=a;best=max(best,val[a]);};for(int i=n-1;i>=0;i--){int x=ord[i];on[x]=1;cnt[x][t[x]]=1;best=max(best,val[x]);if(x&&on[x-1])unite(x,x-1);if(x+1<n&&on[x+1])unite(x,x+1);ans[i]=best;}while(q--){int x;cin>>x;cout<<ans[x]<<'\n';}''',
'''v=list(map(int,sys.stdin.buffer.read().split()));n,q=v[:2];t=v[2:2+2*n:2];value=v[3:2+2*n:2];order=[x-1 for x in v[2+2*n:2+3*n]];pa=list(range(n));sz=[1]*n;on=[False]*n;cnt=[{} for _ in range(n)];ans=[0]*(n+1);best=0
+def find(x):
+    while pa[x]!=x:pa[x]=pa[pa[x]];x=pa[x]
+    return x
+def unite(a,b):
+    global best
+    a,b=find(a),find(b)
+    if a==b:return
+    if sz[a]<sz[b]:a,b=b,a
    sz[a]+=sz[b]
+    value[a]+=value[b]
+    for t,c in cnt[b].items():value[a]+=c*cnt[a].get(t,0);cnt[a][t]=cnt[a].get(t,0)+c
+    cnt[b].clear();pa[b]=a;best=max(best,value[a])
+for i in range(n-1,-1,-1):
+    x=order[i];on[x]=True;cnt[x][t[x]]=1;best=max(best,value[x])
+    if x and on[x-1]:unite(x,x-1)
+    if x+1<n and on[x+1]:unite(x,x+1)
+    ans[i]=best
+print('\n'.join(str(ans[x]) for x in v[2+3*n:]))'''.replace('\n+','\n'),steps3(('只剩 2、4','範例拆除前三件後，編號 2 與 4 分開，價值為 0、1。',['2:0','4:1'],[('最大',1)]),('倒加 5','編號 4、5 同種類，價值 1+3+1=5。',['4–5:5'],[('最大',5)]),('全數恢復','基礎值總和 11；種類 1 有一對、種類 2 有三對，共 15。',['1–5:15'],[('最大',15)])))
checkpoint()

def T(*rows):
    return [(f'步驟 {i+1}',d,c,[('狀態',v)]) for i,(d,c,v) in enumerate(rows)]

add(399,'greedy','hard','最遠合法批次與倍增','複製數列成兩倍，用雙指標求每個起點能裝入的最長合法批次，其下一位置記為 next。非負重量使右端可單調前進。|對固定開頭，第一批取最長不會比較差：把其他分法落在這段內的批界刪除或右移，剩餘需求不會增加。故反覆套用 next 得最少批數。|建立 next 的倍增表。對每個 s，先跳仍未到 s+n 的最大步數，最後再加一批；比較所有 n 個位置並統計。','時間 O(n log n)，空間 O(n log n)；Python 表使用緊密整數陣列。','最後一批可截短，不能要求每批都恰到 next；零重量仍受件數 L 限制。',
'''int n,L;long long B;cin>>n>>L>>B;vector<long long>a(2*n);for(int i=0;i<n;i++){cin>>a[i];a[i+n]=a[i];}int m=2*n,lg=1;while((1<<lg)<=n)lg++;vector<vector<int>>up(lg,vector<int>(m+1,m));long long s=0;int r=0;for(int l=0;l<m;l++){while(r<m&&r-l<L&&s+a[r]<=B)s+=a[r++];up[0][l]=r;s-=a[l];}for(int j=1;j<lg;j++)for(int i=0;i<=m;i++)up[j][i]=up[j-1][up[j-1][i]];int best=n+1,cnt=0;for(int i=0;i<n;i++){int p=i,c=0;for(int j=lg-1;j>=0;j--)if(up[j][p]<i+n){p=up[j][p];c+=1<<j;}c++;if(c<best){best=c;cnt=1;}else if(c==best)cnt++;}cout<<best<<' '<<cnt<<'\n';''',
'''from array import array
v=list(map(int,sys.stdin.buffer.read().split()));n,L,B=v[:3];a=v[3:]*2;m=2*n;r=s=0;up=[array('i',[m])*(m+1)]
for l in range(m):
    while r<m and r-l<L and s+a[r]<=B:s+=a[r];r+=1
    up[0][l]=r;s-=a[l]
for j in range(1,n.bit_length()):up.append(array('i',(up[j-1][up[j-1][i]] for i in range(m+1))))
best=n+1;cnt=0
for i in range(n):
    p=i;c=0
    for j in range(len(up)-1,-1,-1):
        if up[j][p]<i+n:p=up[j][p];c+=1<<j
    c+=1
    if c<best:best=c;cnt=1
    elif c==best:cnt+=1
print(best,cnt)''',T(('取小例 n=3、L=2、B=3，重量 1、2、1。',[1,2,1],0),('從位置 1 起：1+2 一批，1 一批。',['1+2','1'],2),('三個起點都能兩批完成；一批最多兩件所以不能更少。',[1,2,3],'2 批，3 個起點')))

add(400,'graphs','hard','矩陣樹定理與多項式插值','給每條紅邊權重 X、藍邊權重 1，自環略過，建立加權 Laplacian 並刪一列一行。|矩陣樹定理保證其行列式 F(X) 是所有生成樹權重的總和；每棵樹貢獻 X^(紅邊數)，所以答案是 X^K 的係數，次數最多 n-1。|在模質數下求 F(0)…F(n-1)，用 Lagrange 插值重建各基底多項式，再取第 K 係數。高斯消去遇零樞軸時交換列，無樞軸就回傳零。','n 次 (n-1) 階消去，時間 O(n^4+m n+n^3)，空間 O(n²+m)。','平行邊累加；自環不參與生成樹；n=1 的 0 階行列式為 1。',
'''const long long M=1000000007;auto pw=[&](long long a,long long b){long long r=1;for(;b;b>>=1,a=a*a%M)if(b&1)r=r*a%M;return r;};int n,m,K;cin>>n>>m>>K;vector<array<int,3>>e(m);for(auto&v:e){cin>>v[0]>>v[1]>>v[2];--v[0];--v[1];}vector<long long>ys(n);for(int x=0;x<n;x++){int d=n-1;vector<vector<long long>>a(d,vector<long long>(d));for(auto [u,v,c]:e)if(u!=v){long long w=c?x:1;if(u<d)a[u][u]=(a[u][u]+w)%M;if(v<d)a[v][v]=(a[v][v]+w)%M;if(u<d&&v<d){a[u][v]=(a[u][v]-w+M)%M;a[v][u]=(a[v][u]-w+M)%M;}}long long det=1;for(int i=0;i<d;i++){int p=i;while(p<d&&!a[p][i])p++;if(p==d){det=0;break;}if(p!=i){swap(a[p],a[i]);det=(M-det)%M;}det=det*a[i][i]%M;long long inv=pw(a[i][i],M-2);for(int j=i+1;j<d;j++){long long f=a[j][i]*inv%M;for(int k=i;k<d;k++)a[j][k]=(a[j][k]-f*a[i][k]%M+M)%M;}}ys[x]=det;}long long ans=0;for(int i=0;i<n;i++){vector<long long>p(1,1);long long den=1;for(int j=0;j<n;j++)if(j!=i){vector<long long>v(p.size()+1);for(int k=0;k<(int)p.size();k++){v[k]=(v[k]-j*p[k]%M+M)%M;v[k+1]=(v[k+1]+p[k])%M;}p.swap(v);den=den*(i-j+M)%M;}ans=(ans+ys[i]*p[K]%M*pw(den,M-2))%M;}cout<<ans<<'\n';''',
'''v=list(map(int,sys.stdin.buffer.read().split()));n,m,K=v[:3];e=[(v[i]-1,v[i+1]-1,v[i+2]) for i in range(3,len(v),3)];M=1000000007;ys=[]
for x in range(n):
    d=n-1;a=[[0]*d for _ in range(d)]
    for u,w,c in e:
        if u==w:continue
        z=x if c else 1
        if u<d:a[u][u]+=z
        if w<d:a[w][w]+=z
        if u<d and w<d:a[u][w]-=z;a[w][u]-=z
    a=[[z%M for z in row] for row in a];det=1
    for i in range(d):
        p=next((j for j in range(i,d) if a[j][i]),None)
        if p is None:det=0;break
        if p!=i:a[p],a[i]=a[i],a[p];det=-det%M
        det=det*a[i][i]%M;inv=pow(a[i][i],M-2,M)
        for j in range(i+1,d):
            f=a[j][i]*inv%M
            for k in range(i,d):a[j][k]=(a[j][k]-f*a[i][k])%M
    ys.append(det)
ans=0
for i in range(n):
    p=[1];den=1
    for j in range(n):
        if j==i:continue
        z=[0]*(len(p)+1)
        for k,w in enumerate(p):z[k]=(z[k]-j*w)%M;z[k+1]=(z[k+1]+w)%M
        p=z;den=den*(i-j)%M
    ans=(ans+ys[i]*p[K]*pow(den,M-2,M))%M
print(ans)''',T(('三角形：一條藍邊、兩條紅邊。',['B','R','R'],'K=1'),('三棵生成樹：兩棵一紅一藍，一棵兩紅。',['X','X','X²'],'F(X)=2X+X²'),('取 X 一次項，恰有 1 紅的選法為 2。',[2],2)))

add(401,'trees','medium','標記鏈倍增與根路徑前綴和','依父節點編號小於子節點的保證，按編號算根路徑收支前綴和。|對每個節點保存向上最近標記祖先；對每個標記節點建立「上一個標記祖先」的倍增鏈。|查詢從 u 的最近標記節點出發跳 k-1 次；找到 a 時，路徑和為 prefix[u]-prefix[parent[a]]。超過標記總數就輸出 -1。','時間 O((n+q) log n)，空間 O(n log n+q)。','u 自身有標記時也算第一個；負收支不能作為跳躍停止條件。',
'''int n,q;cin>>n>>q;int L=1;while((1<<L)<=n)L++;vector<int>p(n+1),near(n+1),cnt(n+1);for(int i=2;i<=n;i++)cin>>p[i];vector<long long>s(n+1);vector<vector<int>>up(L,vector<int>(n+1));for(int i=1;i<=n;i++){long long w;int b;cin>>w>>b;s[i]=s[p[i]]+w;cnt[i]=cnt[p[i]]+b;near[i]=b?i:near[p[i]];up[0][i]=near[p[i]];for(int j=1;j<L;j++)up[j][i]=up[j-1][up[j-1][i]];}while(q--){int u,k;cin>>u>>k;if(k>cnt[u]){cout<<-1<<'\n';continue;}int a=near[u],d=k-1;for(int j=0;j<L;j++)if(d>>j&1)a=up[j][a];cout<<a<<' '<<s[u]-s[p[a]]<<'\n';}''',
'''from array import array
v=list(map(int,sys.stdin.buffer.read().split()));n,q=v[:2];p=[0,0]+v[2:n+1];L=n.bit_length();up=[array('i',[0])*(n+1) for _ in range(L)];near=[0]*(n+1);cnt=near.copy();s=near.copy();off=n+1
for i in range(1,n+1):
    w,b=v[off+2*(i-1):off+2*i];s[i]=s[p[i]]+w;cnt[i]=cnt[p[i]]+b;near[i]=i if b else near[p[i]];up[0][i]=near[p[i]]
    for j in range(1,L):up[j][i]=up[j-1][up[j-1][i]]
out=[]
for u,k in zip(v[off+2*n::2],v[off+2*n+1::2]):
    if k>cnt[u]:out.append('-1');continue
    a=near[u];d=k-1
    for j in range(L):
        if d>>j&1:a=up[j][a]
    out.append(f'{a} {s[u]-s[p[a]]}')
print('\n'.join(out))''',T(('範例路徑 4→2→1，標記為 4 與 1。',[4,2,1],'標記數 2'),('詢問 (4,1)，自身就是第一個標記，收支 4。',[4],'4 4'),('詢問 (4,2)，跳到 1；收支 4+2+1=7。',[4,2,1],'1 7')))

add(402,'dp','hard','兩種奇偶的最大值樹狀陣列','依輸入順序處理，以座標壓縮後的位置作索引，兩棵樹分別存奇、偶座標結尾的最大能量。|處理 (x,w) 時，只查另一奇偶且座標嚴格小於 x 的最佳值；dp=w+max(0,該值)，允許從自己重新開始。|計算後才更新自身奇偶的樹；這同時保證輸入順序、嚴格遞增與奇偶交替。答案另外維護，避免全負數誤回傳空集合 0。','時間 O(n log n)，空間 O(n)。','負數的奇偶用 (x%2+2)%2；相同座標不可互相銜接。',
'''int n;cin>>n;vector<pair<long long,long long>>a(n);vector<long long>xs;for(auto&[x,w]:a){cin>>x>>w;xs.push_back(x);}sort(xs.begin(),xs.end());xs.erase(unique(xs.begin(),xs.end()),xs.end());vector<vector<long long>>f(2,vector<long long>(xs.size()+1));long long ans=LLONG_MIN;for(auto [x,w]:a){int r=lower_bound(xs.begin(),xs.end(),x)-xs.begin()+1,c=(x%2+2)%2;long long best=0;for(int i=r-1;i;i-=i&-i)best=max(best,f[1-c][i]);long long d=w+best;ans=max(ans,d);for(int i=r;i<(int)f[c].size();i+=i&-i)f[c][i]=max(f[c][i],d);}cout<<ans<<'\n';''',
'''from bisect import bisect_left
v=list(map(int,sys.stdin.buffer.read().split()));a=list(zip(v[1::2],v[2::2]));xs=sorted({x for x,w in a});f=[[0]*(len(xs)+1) for _ in range(2)];ans=-10**30
for x,w in a:
    r=bisect_left(xs,x)+1;c=x%2;i=r-1;best=0
    while i:best=max(best,f[1-c][i]);i-=i&-i
    d=w+best;ans=max(ans,d);i=r
    while i<=len(xs):f[c][i]=max(f[c][i],d);i+=i&-i
print(ans)''',T(('座標能量 (1,2)、(4,3)，可串起得到 5。',[1,4],5),('座標 5 的能量 -1，形成 1→4→5 得 4。',[1,4,5],4),('接 8 的 4、9 的 6，得到 14。',[1,4,5,8,9],14)))

add(403,'sorting','hard','旋轉逆序變化量','先用樹狀陣列求原數列逆序數。|將最前面的 x 移到最後，原先它與所有小於 x 的數形成逆序，移動後則與所有大於 x 的數形成逆序，因此變化量=全體大於 x 數量-全體小於 x 數量。|排序後用兩個二分邊界算嚴格大小數量，依序更新 n-1 次，連原開頭共比較 n 個候選。','時間 O(n log n)，空間 O(n)。','相等值不影響逆序；不同開頭即使數列相同，也各計一次。',
'''int n;cin>>n;vector<long long>a(n),s;for(auto&x:a)cin>>x;s=a;sort(s.begin(),s.end());BIT b(n);long long cur=0;for(int i=0;i<n;i++){int r=lower_bound(s.begin(),s.end(),a[i])-s.begin()+1;cur+=i-b.sum(r);b.add(r,1);}long long best=cur;int cnt=1;for(int i=0;i<n-1;i++){cur+=(s.end()-upper_bound(s.begin(),s.end(),a[i]))-(lower_bound(s.begin(),s.end(),a[i])-s.begin());if(cur<best){best=cur;cnt=1;}else if(cur==best)cnt++;}cout<<best<<' '<<cnt<<'\n';''',
'''from bisect import bisect_left,bisect_right
v=list(map(int,sys.stdin.buffer.read().split()));a=v[1:];n=len(a);s=sorted(a);b=BIT(n);cur=0
for i,x in enumerate(a):
    r=bisect_left(s,x)+1;cur+=i-b.sum(r);b.add(r,1)
best=cur;cnt=1
for x in a[:-1]:
    cur+=n-bisect_right(s,x)-bisect_left(s,x)
    if cur<best:best=cur;cnt=1
    elif cur==best:cnt+=1
print(best,cnt)''',T(('原序 3、1、2、1 有四個逆序。',[3,1,2,1],4),('把 3 移末尾，少三個逆序。',[1,2,1,3],1),('接著移 1 到末尾，加兩個逆序，最佳仍為 1。',[2,1,3,1],3)),extra=BITCPP,preamble=BITPY)

add(404,'dp','hard','恰 K 段與前綴最佳轉移','令 prev[i] 為前 i 個數選恰 j-1 段的最大和；用前綴和 S。|第 j 段若從 t+1 到 i，長度至少 L，且前段必須在 t-1 前結束，所以候選為 S[i]+prev[t-1]-S[t]。第一段則允許任何 t≥0，前面值為 0。|i 遞增時，把 t=i-L 的候選加入 running maximum；cur[i] 取 cur[i-1] 或以 i 結尾的最佳。j 跑到 K；不可達狀態使用負無限。','時間 O(Kn)，空間 O(n)。','兩段間至少留一格，不能用 prev[t]；K=0 直接輸出 0，負收益不能改選少段。',
'''int n,K,L;cin>>n>>K>>L;vector<long long>s(n+1);for(int i=1;i<=n;i++){long long x;cin>>x;s[i]=s[i-1]+x;}const long long NEG=-(1LL<<60);vector<long long>prev(n+1,0);for(int j=1;j<=K;j++){vector<long long>cur(n+1,NEG);long long best=NEG;for(int i=1;i<=n;i++){int t=i-L;if(t>=0){long long v=j==1?0:(t>=1?prev[t-1]:NEG);if(v!=NEG)best=max(best,v-s[t]);}cur[i]=cur[i-1];if(best!=NEG)cur[i]=max(cur[i],s[i]+best);}prev.swap(cur);}if(prev[n]==NEG)cout<<"IMPOSSIBLE\n";else cout<<prev[n]<<'\n';''',
'''v=list(map(int,sys.stdin.buffer.read().split()));n,K,L=v[:3];s=[0]
for x in v[3:]:s.append(s[-1]+x)
NEG=-10**30;prev=[0]*(n+1)
for j in range(1,K+1):
    cur=[NEG]*(n+1);best=NEG
    for i in range(1,n+1):
        t=i-L
        if t>=0:
            p=0 if j==1 else (prev[t-1] if t else NEG)
            if p!=NEG:best=max(best,p-s[t])
        cur[i]=cur[i-1]
        if best!=NEG:cur[i]=max(cur[i],s[i]+best)
    prev=cur
print('IMPOSSIBLE' if prev[n]==NEG else prev[n])''',T(('n=6、K=2、L=2，資料 2、-1、3、-4、5、6。',[2,-1,3,-4,5,6],'選兩段'),('第一段選 [1,3]，和 4；位置 4 作間隔。',['2-1+3','空白'],4),('第二段選 [5,6]，和 11，總和 15。',['[1,3]','[5,6]'],15)))

add(405,'graphs','hard','離線降水位與並查集平方和','把格子依高度由高到低排序，查詢水位也由高到低處理。|對每個查詢，啟用所有高度嚴格大於水位的格子；單格使平方和加 1，相鄰不同分量大小 a、b 合併時增加 (a+b)²-a²-b²=2ab。|啟用完成後，並查集分量恰是此水位的島嶼；依原查詢次序輸出保存的平方和。','設 V=hw，時間 O(V log V+q log q+(V+q)α(V))，空間 O(V+q)。','高度等於水位仍是水；同一分量不得重複合併。',
'''int h,w,q;cin>>h>>w>>q;int n=h*w;vector<long long>a(n),lev(q),ans(q);for(auto&x:a)cin>>x;for(auto&x:lev)cin>>x;vector<int>ids(n),qs(q),p(n),sz(n,1),on(n);iota(ids.begin(),ids.end(),0);iota(qs.begin(),qs.end(),0);iota(p.begin(),p.end(),0);sort(ids.begin(),ids.end(),[&](int x,int y){return a[x]>a[y];});sort(qs.begin(),qs.end(),[&](int x,int y){return lev[x]>lev[y];});function<int(int)>find=[&](int x){return p[x]==x?x:p[x]=find(p[x]);};long long s=0;int j=0;for(int k:qs){while(j<n&&a[ids[j]]>lev[k]){int x=ids[j++];on[x]=1;s++;vector<int>nb;if(x/w)nb.push_back(x-w);if(x/w+1<h)nb.push_back(x+w);if(x%w)nb.push_back(x-1);if(x%w+1<w)nb.push_back(x+1);for(int y:nb)if(on[y]){int u=find(x),v=find(y);if(u==v)continue;if(sz[u]<sz[v])swap(u,v);s+=2LL*sz[u]*sz[v];p[v]=u;sz[u]+=sz[v];}}ans[k]=s;}for(auto x:ans)cout<<x<<'\n';''',
'''v=list(map(int,sys.stdin.buffer.read().split()));h,w,q=v[:3];n=h*w;a=v[3:3+n];lev=v[3+n:];ids=sorted(range(n),key=lambda i:-a[i]);qs=sorted(range(q),key=lambda i:-lev[i]);p=list(range(n));sz=[1]*n;on=[False]*n;ans=[0]*q;s=j=0
def find(x):
    while p[x]!=x:p[x]=p[p[x]];x=p[x]
    return x
for k in qs:
    while j<n and a[ids[j]]>lev[k]:
        x=ids[j];j+=1;on[x]=True;s+=1;nb=[]
        if x//w:nb.append(x-w)
        if x//w+1<h:nb.append(x+w)
        if x%w:nb.append(x-1)
        if x%w+1<w:nb.append(x+1)
        for y in nb:
            if not on[y]:continue
            u,z=find(x),find(y)
            if u==z:continue
            if sz[u]<sz[z]:u,z=z,u
            s+=2*sz[u]*sz[z];p[z]=u;sz[u]+=sz[z]
    ans[k]=s
print('\n'.join(map(str,ans)))''',T(('水位 3，範例最高格等於水位，沒有陸地。',['水','水'],0),('水位 2，三個高度 3 的格子連通，面積 3。',[3],'平方和 9'),('水位 0，六格都連通，面積 6。',[6],'平方和 36')))

add(406,'dp','hard','鏡像位置配對與模 7 最小費用計數','迴文由每對鏡像位置的一個數字決定，中間單格獨立。|第 i 對選 d 的費用為 |S[i]-d|+|S[n-1-i]-d|，模 7 貢獻是 d×(10^i+10^(n-1-i))；中間單格只算一次。|對已處理配對的餘數維護最小費用及達成個數；較小費用取代，相等費用相加。外層首位排除 0，最後取餘數 0。每條選字路徑唯一對應一個結果迴文。','時間 O(n×7×10)，空間 O(n)，包含輸入字串與冪次表；DP 額外 O(7)。','不能將一對鏡像的兩個數字分別決定；長度 1 允許結果 0。',
'''string s;cin>>s;int n=s.size(),M=1000000007;vector<int>pw(n,1);for(int i=1;i<n;i++)pw[i]=pw[i-1]*10%7;const int INF=1000000000;vector<int>dp(7,INF),cnt(7);dp[0]=0;cnt[0]=1;for(int i=0;i<(n+1)/2;i++){int j=n-1-i,c=(pw[i]+(i==j?0:pw[j]))%7;vector<int>nd(7,INF),nc(7);for(int r=0;r<7;r++)if(dp[r]!=INF)for(int d=(i==0&&n>1?1:0);d<=9;d++){int z=(r+c*d)%7,cost=dp[r]+abs(s[i]-'0'-d)+(i==j?0:abs(s[j]-'0'-d));if(cost<nd[z]){nd[z]=cost;nc[z]=cnt[r];}else if(cost==nd[z])nc[z]=(nc[z]+cnt[r])%M;}dp.swap(nd);cnt.swap(nc);}cout<<dp[0]<<' '<<cnt[0]<<'\n';''',
'''s=sys.stdin.read().strip();n=len(s);M=1000000007;pw=[1]*n
for i in range(1,n):pw[i]=pw[i-1]*10%7
INF=10**20;dp=[INF]*7;cnt=[0]*7;dp[0]=0;cnt[0]=1
for i in range((n+1)//2):
    j=n-1-i;c=(pw[i]+(0 if i==j else pw[j]))%7;nd=[INF]*7;nc=[0]*7
    choices=[(d*c%7,abs(int(s[i])-d)+(0 if i==j else abs(int(s[j])-d))) for d in range(1 if i==0 and n>1 else 0,10)]
    for r in range(7):
        if dp[r]==INF:continue
        for shift,cost in choices:
            z=(r+shift)%7;cost+=dp[r]
            if cost<nd[z]:nd[z]=cost;nc[z]=cnt[r]
            elif cost==nd[z]:nc[z]=(nc[z]+cnt[r])%M
    dp,cnt=nd,nc
print(dp[0],cnt[0])''',T(('輸入 121，外側兩位必須相同且非零。',['1','2','1'],'目標模 7 = 0'),('外側改成 1 不花費，中間從 2 改為 6 花費 4。',['1','6','1'],4),('161=7×23；其他可行迴文的費用皆較大，只有此最優結果。',[161],'4 1')))

add(407,'dp','hard','交替色區間排程的最優值與計數','依結束時間排序工作，對兩種顏色各建一棵樹狀陣列，保存結束於各時間的最優值與方案數。|處理顏色 c 的工作時，查詢另一色結束時間≤s 的所有非空方案，另加入空集合 (0,1) 作起點；接上此工作後更新顏色 c。|合併兩個結果時取較大值，相等則加計數。每個非空集合有唯一最後工作，所以不重複；最後合併兩色與空集合得到答案。','時間 O(N log N)，空間 O(N)。','收益可以為 0 或負數；空集合只計一次，不能同時放進兩色樹中。',
'''int n;cin>>n;using P=pair<long long,long long>;const long long M=1000000007,NEG=-(1LL<<60);auto merge=[&](P a,P b){if(a.first!=b.first)return a.first>b.first?a:b;return P(a.first,(a.second+b.second)%M);};vector<array<long long,4>>a(n);vector<long long>xs;for(auto&v:a){cin>>v[0]>>v[1]>>v[2]>>v[3];xs.push_back(v[1]);}sort(xs.begin(),xs.end());xs.erase(unique(xs.begin(),xs.end()),xs.end());sort(a.begin(),a.end(),[](auto x,auto y){return x[1]<y[1];});vector<vector<P>>f(2,vector<P>(xs.size()+1,{NEG,0}));P ans={0,1};for(auto [s,e,w,c]:a){P b={0,1};for(int i=upper_bound(xs.begin(),xs.end(),s)-xs.begin();i;i-=i&-i)b=merge(b,f[1-c][i]);b.first+=w;ans=merge(ans,b);for(int i=lower_bound(xs.begin(),xs.end(),e)-xs.begin()+1;i<(int)f[c].size();i+=i&-i)f[c][i]=merge(f[c][i],b);}cout<<ans.first<<' '<<ans.second<<'\n';''',
'''from bisect import bisect_left,bisect_right
v=list(map(int,sys.stdin.buffer.read().split()));a=[v[i:i+4] for i in range(1,len(v),4)];xs=sorted({r[1] for r in a});a.sort(key=lambda r:r[1]);M=1000000007;NEG=-10**30;f=[[(NEG,0)]*(len(xs)+1) for _ in range(2)]
def merge(a,b):
    if a[0]!=b[0]:return max(a,b)
    return a[0],(a[1]+b[1])%M
ans=(0,1)
for s,e,w,c in a:
    b=(0,1);i=bisect_right(xs,s)
    while i:b=merge(b,f[1-c][i]);i-=i&-i
    b=(b[0]+w,b[1]);ans=merge(ans,b);i=bisect_left(xs,e)+1
    while i<=len(xs):f[c][i]=merge(f[c][i],b);i+=i&-i
print(*ans)''',T(('工作 1：[0,2)、收益 3、色 0。',['工作1'],'3，1 種'),('工作 2、3 都是 [2,4)、收益 4、色 1，各可接工作 1。',['1→2','1→3'],'7，2 種'),('末尾色 0 收益 -1 的工作會降低價值，所以最大仍為 7。',['1→2','1→3'],'7 2')))

add(408,'number-theory','hard','奇數 Möbius 反演與整數圓界','互質指示式為 Σ_{d|gcd(x,y)} μ(d)。因 x、y 奇偶相反，公因數 d 只可能是奇數，除以 d 後仍奇偶相反。|對每個奇數 d，令 M=floor(R²/d²)，數出正整數 u²+v²≤M 的異奇偶有序點數 F(M)。固定 u，v 上界為 isqrt(M-u²)，依 u 奇偶取奇數或偶數個數。|答案為 Σ μ(d)F(floor(R²/d²))。使用線性篩求 μ，整數平方根修正避免浮點圓界誤差。','時間 O(R log R)，篩及儲存 O(R)；內層總長度由 ΣR/d 控制。','只計正座標；不能把 (x,y) 與 (y,x) 合成一個點；圓邊界包含。',
'''int R;cin>>R;vector<int>mu(R+1),pr,lp(R+1);mu[1]=1;for(int i=2;i<=R;i++){if(!lp[i]){lp[i]=i;pr.push_back(i);mu[i]=-1;}for(int p:pr){if(1LL*i*p>R)break;lp[i*p]=p;if(i%p==0){mu[i*p]=0;break;}mu[i*p]=-mu[i];}}auto isq=[](long long x){long long r=sqrtl(x);while((r+1)*(r+1)<=x)r++;while(r*r>x)r--;return r;};long long ans=0,rr=1LL*R*R;for(long long d=1;d<=R;d+=2)if(mu[d]){long long m=rr/(d*d),f=0;for(long long x=1;x*x<m;x++){long long y=isq(m-x*x);f+=(x%2?y/2:(y+1)/2);}ans+=mu[d]*f;}cout<<ans<<'\n';''',
'''from math import isqrt
R=int(sys.stdin.read());mu=[0]*(R+1);lp=[0]*(R+1);pr=[];mu[1]=1
for i in range(2,R+1):
    if not lp[i]:lp[i]=i;pr.append(i);mu[i]=-1
    for p in pr:
        if i*p>R:break
        lp[i*p]=p
        if i%p==0:mu[i*p]=0;break
        mu[i*p]=-mu[i]
ans=0;rr=R*R
for d in range(1,R+1,2):
    if not mu[d]:continue
    m=rr//(d*d);f=0
    for x in range(1,isqrt(m-1)+1):
        y=isqrt(m-x*x);f+=y//2 if x%2 else (y+1)//2
    ans+=mu[d]*f
print(ans)''',T(('R=5，先列 x 為奇數的候選。',['(1,2)','(1,4)','(3,2)','(3,4)'],4),('交換座標得到另外四點，均在圓內且互質。',['(2,1)','(4,1)','(2,3)','(4,3)'],4),('R=5 沒有異奇偶非互質點需要扣除，總共 8。',[8],8)))

add(409,'strings','hard','沿對齊斜線的雙限制滑動窗','將比較矩陣的每條斜線視為一串配對字元；同一斜線的連續窗就是 S、T 中兩段同長片段。|沿每條斜線維護不同字母數≤1 且 S 母音數≤K 的最長窗。右端加入後，若違反任一上限，就從左刪除直到合法。|此時左端已是該右端最早合法起點。若母音數恰為 K 就更新長度；若少於 K，往右縮只會更少，因此該右端不存在更佳符合窗。','時間 O(NM)，儲存字串 O(N+M)，掃描額外 O(1)。','母音條件僅檢查 S 的片段；K=0 合法，但片段仍須非空。',
'''int n,m,K;string s,t;cin>>n>>m>>K>>s>>t;auto vowel=[](char c){return string("aeiou").find(c)!=string::npos;};int ans=0;for(int d=-(m-1);d<=n-1;d++){int a=max(0,d),b=max(0,-d),len=min(n-a,m-b),l=0,mis=0,v=0;for(int r=0;r<len;r++){mis+=s[a+r]!=t[b+r];v+=vowel(s[a+r]);while(l<=r&&(mis>1||v>K)){mis-=s[a+l]!=t[b+l];v-=vowel(s[a+l]);l++;}if(v==K)ans=max(ans,r-l+1);}}cout<<ans<<'\n';''',
'''v=sys.stdin.read().split();n,m,K=map(int,v[:3]);s,t=v[3:];ans=0;vo=set('aeiou')
for d in range(-(m-1),n):
    a=max(0,d);b=max(0,-d);length=min(n-a,m-b);l=mis=count=0
    for r in range(length):
        mis+=s[a+r]!=t[b+r];count+=s[a+r] in vo
        while l<=r and (mis>1 or count>K):
            mis-=s[a+l]!=t[b+l];count-=s[a+l] in vo;l+=1
        if count==K:ans=max(ans,r-l+1)
print(ans)''',T(('S=abca、T=abda、K=2，對齊起點。',['a/a','b/b'], '母音 1，錯配 0'),('第三對 c/d，允許唯一錯配。',['a/a','b/b','c/d'],'母音 1，錯配 1'),('第四對 a/a，使母音恰為 2，整段長 4。',['a/a','b/b','c/d','a/a'],4)))
checkpoint()

add(410,'data-structures','hard','雙色、一次容錯的懶標記線段樹','每段對目標色 0、1 各保存：至多 0 或 1 個異色時的最長前綴、後綴、內部段，另存長度及 1 的總數。|合併前後段時，內部最佳可能在任一子段，或為左後綴加右前綴；跨界容錯額度分成 (0,1) 或 (1,0)。前綴只有左段全部合法時才能接右段，並扣除左段實際異色數。|翻轉時交換兩種目標色的全部摘要，1 數改為長度減 1 數，懶標記異或 1。查詢按原順序合併，取目標色 1、額度 1 的內部最佳。','時間 O((N+Q) log N)，樹與輸入儲存 O(N+Q)；Python 摘要用緊密整數陣列。','查詢容許補開一盞，但不能真正改寫燈號；摘要不能只保留最長全 1 段。',
'''struct Node{int n=0,ones=0,p[2][2]={},s[2][2]={},b[2][2]={};};auto merge=[](Node a,Node b){Node c;c.n=a.n+b.n;c.ones=a.ones+b.ones;for(int t=0;t<2;t++)for(int k=0;k<2;k++){int ea=t?a.n-a.ones:a.ones,eb=t?b.n-b.ones:b.ones;c.p[t][k]=a.p[t][k];if(ea<=k)c.p[t][k]=a.n+b.p[t][k-ea];c.s[t][k]=b.s[t][k];if(eb<=k)c.s[t][k]=b.n+a.s[t][k-eb];c.b[t][k]=max(a.b[t][k],b.b[t][k]);for(int j=0;j<=k;j++)c.b[t][k]=max(c.b[t][k],a.s[t][j]+b.p[t][k-j]);}return c;};int n,q;string a;cin>>n>>q>>a;vector<Node>tr(4*n);vector<int>lazy(4*n);auto flip=[&](int p){tr[p].ones=tr[p].n-tr[p].ones;for(int k=0;k<2;k++){swap(tr[p].p[0][k],tr[p].p[1][k]);swap(tr[p].s[0][k],tr[p].s[1][k]);swap(tr[p].b[0][k],tr[p].b[1][k]);}lazy[p]^=1;};function<void(int,int,int)>build=[&](int p,int l,int r){if(l==r){tr[p].n=1;tr[p].ones=a[l]-'0';for(int t=0;t<2;t++)for(int k=0;k<2;k++)tr[p].p[t][k]=tr[p].s[t][k]=tr[p].b[t][k]=(a[l]-'0'==t||k==1);return;}int m=(l+r)/2;build(p*2,l,m);build(p*2+1,m+1,r);tr[p]=merge(tr[p*2],tr[p*2+1]);};auto push=[&](int p){if(lazy[p]){flip(p*2);flip(p*2+1);lazy[p]=0;}};function<void(int,int,int,int,int)>upd=[&](int p,int l,int r,int L,int R){if(r<L||R<l)return;if(L<=l&&r<=R){flip(p);return;}push(p);int m=(l+r)/2;upd(p*2,l,m,L,R);upd(p*2+1,m+1,r,L,R);tr[p]=merge(tr[p*2],tr[p*2+1]);};function<Node(int,int,int,int,int)>get=[&](int p,int l,int r,int L,int R){if(r<L||R<l)return Node();if(L<=l&&r<=R)return tr[p];push(p);int m=(l+r)/2;return merge(get(p*2,l,m,L,R),get(p*2+1,m+1,r,L,R));};build(1,0,n-1);while(q--){int t,l,r;cin>>t>>l>>r;if(t==1)upd(1,0,n-1,l-1,r-1);else cout<<get(1,0,n-1,l-1,r-1).b[1][1]<<'\n';}''',
'''from array import array
lines=sys.stdin.read().splitlines();n,q=map(int,lines[0].split());a=lines[1];fields=[array('i',[0])*(4*n) for _ in range(14)];lazy=bytearray(4*n);zero=(0,)*14
def read(p):return tuple(f[p] for f in fields)
def put(p,v):
    for f,x in zip(fields,v):f[p]=x
def merge(a,b):
    if not a[0]:return b
    if not b[0]:return a
    c=[a[0]+b[0],a[1]+b[1]]+[0]*12
    for t in range(2):
        o=2+6*t;ea=a[0]-a[1] if t else a[1];eb=b[0]-b[1] if t else b[1]
        for k in range(2):
            c[o+k]=a[o+k] if ea>k else a[0]+b[o+k-ea]
            c[o+2+k]=b[o+2+k] if eb>k else b[0]+a[o+2+k-eb]
            c[o+4+k]=max(a[o+4+k],b[o+4+k],*(a[o+2+j]+b[o+k-j] for j in range(k+1)))
    return tuple(c)
def flip(p):
    z=list(read(p));z[1]=z[0]-z[1];z[2:8],z[8:14]=z[8:14],z[2:8];put(p,z);lazy[p]^=1
def push(p):
    if lazy[p]:flip(2*p);flip(2*p+1);lazy[p]=0
def build(p,l,r):
    if l==r:
        b=int(a[l]);put(p,(1,b)+tuple(x for t in range(2) for j in range(3) for x in (int(b==t),1)));return
    m=(l+r)//2;build(2*p,l,m);build(2*p+1,m+1,r);put(p,merge(read(2*p),read(2*p+1)))
def upd(p,l,r,L,R):
    if r<L or R<l:return
    if L<=l and r<=R:flip(p);return
    push(p);m=(l+r)//2;upd(2*p,l,m,L,R);upd(2*p+1,m+1,r,L,R);put(p,merge(read(2*p),read(2*p+1)))
def get(p,l,r,L,R):
    if r<L or R<l:return zero
    if L<=l and r<=R:return read(p)
    push(p);m=(l+r)//2;return merge(get(2*p,l,m,L,R),get(2*p+1,m+1,r,L,R))
build(1,0,n-1);out=[]
for line in lines[2:]:
    t,l,r=map(int,line.split())
    if t==1:upd(1,0,n-1,l-1,r-1)
    else:out.append(str(get(1,0,n-1,l-1,r-1)[13]))
print('\n'.join(out))''',T(('11011 只有一個 0，全段長 5 都可選。',[1,1,0,1,1],5),('翻轉 [1,2] 後變成 00011。',[0,0,0,1,1],'狀態已更新'),('最長可選 011，恰有一個 0，長度 3。',[0,1,1],3)))

add(411,'data-structures','medium','空閒數量樹狀陣列與第 k 個','每個櫃子的空閒狀態用 0/1 表示，樹狀陣列維護前綴空閒數。|借用 [l,r] 若 sum(r)-sum(l-1)=0 就失敗；否則要找全體第 sum(l-1)+1 個空閒櫃，用二進位下降找出並設成 0。|歸還只在目前使用中時加回 1，避免重複歸還讓計數超過一。','時間 O((N+Q) log N)，空間 O(N+Q)。','借用失敗不改變任何狀態；歸還本來空閒的櫃不作動作。',
'''int n,q;cin>>n>>q;BIT b(n);vector<int>free(n+1,1);for(int i=1;i<=n;i++)b.add(i,1);while(q--){int t,l;cin>>t>>l;if(t==2){if(!free[l]){free[l]=1;b.add(l,1);}continue;}int r;cin>>r;long long k=b.sum(l-1)+1;if(b.sum(r)<k){cout<<-1<<'\n';continue;}int pos=0;for(int z=1<<18;z;z>>=1)if(pos+z<=n&&b.f[pos+z]<k){k-=b.f[pos+z];pos+=z;}pos++;cout<<pos<<'\n';free[pos]=0;b.add(pos,-1);}''',
'''lines=sys.stdin.read().splitlines();n,q=map(int,lines[0].split());b=BIT(n);free=[True]*(n+1)
for i in range(1,n+1):b.add(i,1)
out=[]
for line in lines[1:]:
    v=list(map(int,line.split()));t,l=v[:2]
    if t==2:
        if not free[l]:free[l]=True;b.add(l,1)
        continue
    r=v[2];k=b.sum(l-1)+1
    if b.sum(r)<k:out.append('-1');continue
    pos=0;z=1<<n.bit_length()
    while z:
        if pos+z<=n and b.f[pos+z]<k:k-=b.f[pos+z];pos+=z
        z//=2
    pos+=1;out.append(str(pos));free[pos]=False;b.add(pos,-1)
print('\n'.join(out))''',T(('五櫃全空，借 [2,4] 配到 2。',['1空','2用','3空','4空','5空'],2),('再借 [2,3] 配到 3。',['2用','3用'],3),('再借同區間無空位，回報 -1。',['2用','3用'],-1)),extra=BITCPP,preamble=BITPY)

add(412,'greedy','hard','同類二維支配匹配','按種類分組，各組將工作與設備依長度由大到小掃描。|處理工作 (x,y) 時，把所有長度容量≥x 的設備加入容量 Y 的有序多重集合，選最小的 Y≥y 配給工作。|長度更大的需求先處理；選最小足夠承重者，可以用交換法將任何最佳解改成此配對而不破壞後續工作可行性。Python 以壓縮承重樹狀陣列實作有序多重集合。','時間 O((N+M) log(N+M))，空間 O(N+M)。','同種類限制不能略過；同容量的多台設備要各自計數。',
'''int n,m;cin>>n>>m;map<long long,vector<pair<long long,long long>>>jobs,eq;for(int i=0;i<n+m;i++){long long t,x,y;cin>>t>>x>>y;(i<n?jobs:eq)[t].push_back({x,y});}int ans=0;for(auto&[t,a]:jobs){auto&b=eq[t];sort(a.rbegin(),a.rend());sort(b.rbegin(),b.rend());multiset<long long>s;int j=0;for(auto [x,y]:a){while(j<(int)b.size()&&b[j].first>=x)s.insert(b[j++].second);auto p=s.lower_bound(y);if(p!=s.end()){ans++;s.erase(p);}}}cout<<ans<<'\n';''',
'''from collections import defaultdict
from bisect import bisect_left
v=list(map(int,sys.stdin.buffer.read().split()));n,m=v[:2];jobs=defaultdict(list);eq=defaultdict(list)
for i in range(n+m):
    t,x,y=v[2+3*i:5+3*i];(jobs if i<n else eq)[t].append((x,y))
ans=0
for t,a in jobs.items():
    b=sorted(eq[t],reverse=True);ys=sorted({y for x,y in b});bit=BIT(len(ys));j=0
    for x,y in sorted(a,reverse=True):
        while j<len(b) and b[j][0]>=x:bit.add(bisect_left(ys,b[j][1])+1,1);j+=1
        low=bisect_left(ys,y);k=bit.sum(low)+1
        if k>bit.sum(bit.n):continue
        pos=0;z=1<<len(ys).bit_length()
        while z:
            if pos+z<=bit.n and bit.f[pos+z]<k:k-=bit.f[pos+z];pos+=z
            z//=2
        bit.add(pos+1,-1);ans+=1
print(ans)''',T(('同類工作 (4,2)、(2,5)；設備 (4,5)、(2,5)。',['工作4,2','工作2,5'],0),('先處理長度 4 的工作，只有 (4,5) 可用。',['設備4,5'],1),('長度 2 的工作用剩餘 (2,5)，兩件都完成。',['設備2,5'],2)),extra=BITCPP,preamble=BITPY)

add(413,'number-theory','hard','廣義中國剩餘定理與排除整除','合併 t≡a (mod m)、t≡b (mod n)。令 g=gcd(m,n)，若 b-a 不是 g 的倍數就無解；否則解 m/g 的模 n/g 反元素，得到最小非負解 r 與週期 lcm(m,n)。|在 [L,R] 中計算 r+週期×j 的個數，再把此同餘式與 t≡0 (mod d) 合併，扣掉可整除 d 的個數。|通用計數函式只計 j≥0，因此 r=0 時正確包含 0，而排除階段也會扣掉 0。','每筆 O(log(max(m,n,d)))，輸入輸出 O(Q)，額外計算空間 O(log(max(m,n,d)))。','第二次合併週期可能達 10^27，C++ 需 __int128；餘數差可能負，要正規化。',
'''using I=__int128_t;function<long long(long long,long long,long long&,long long&)>eg=[&](long long a,long long b,long long&x,long long&y){if(!b){x=1;y=0;return a;}long long u,v,g=eg(b,a%b,u,v);x=v;y=u-a/b*v;return g;};auto mod=[](I a,I m){return (a%m+m)%m;};auto crt=[&](I a,I m,long long b,long long n)->pair<I,I>{long long g=gcd((long long)(m%n),n);if((b-a)%g)return {-1,0};long long nn=n/g,x,y;eg((long long)((m/g)%nn),nn,x,y);I k=mod((b-a)/g*x,nn),l=m*nn;return {mod(a+m*k,l),l};};auto count=[](I a,I m,long long L,long long R)->long long{if(a<0||a>R)return 0;I lo=L<=a?0:(I(L)-a+m-1)/m,hi=(I(R)-a)/m;return hi>=lo?(long long)(hi-lo+1):0;};int q;cin>>q;while(q--){long long L,R,m,a,n,b,d;cin>>L>>R>>m>>a>>n>>b>>d;auto [r,p]=crt(a,m,b,n);if(r<0){cout<<0<<'\n';continue;}auto [s,z]=crt(r,p,0,d);cout<<count(r,p,L,R)-count(s,z,L,R)<<'\n';}''',
'''from math import gcd
def crt(a,m,b,n):
    g=gcd(m,n)
    if (b-a)%g:return None
    nn=n//g;k=((b-a)//g*pow(m//g,-1,nn))%nn if nn>1 else 0
    l=m*nn;return (a+m*k)%l,l
def count(z,L,R):
    if z is None:return 0
    a,m=z
    if a>R:return 0
    return max(0,(R-a)//m-max(0,(L-a+m-1)//m)+1)
lines=sys.stdin.read().splitlines();out=[]
for line in lines[1:]:
    L,R,m,a,n,b,d=map(int,line.split());z=crt(a,m,b,n)
    out.append(str(0 if z is None else count(z,L,R)-count(crt(*z,0,d),L,R)))
print('\n'.join(out))''',T(('[0,30]，t≡1 mod4 且 t≡3 mod6。',[9,21],'週期12'),('候選為 9、21，都不是 5 的倍數。',[9,21],2),('改成模2餘數同時要求 0 與 1 時，最大公因數條件失敗。',['無解'],0)))

add(414,'geometry','hard','曼哈頓轉正方形與離線掃描','令 u=x+y、v=x-y，曼哈頓距離等於 max(|Δu|,|Δv|)。因此每個紅點要查以自己為中心、半邊長 D 的閉正方形內藍點數。|每個方形拆成 u≤u+D 的查詢減去 u≤u-D-1 的查詢，v 用閉區間。|依 u 排序藍點及事件，樹狀陣列累加藍點 v；各事件用兩個前綴和取得 v 範圍數量。每對紅藍只由紅點那次查詢計入一次。','時間 O(N log N)，空間 O(N)。','座標重合仍是不同點；整數閉邊界拆分需減一，且轉換後需 64 位。',
'''int n;long long D;cin>>n>>D;vector<pair<long long,long long>>b;vector<array<long long,4>>ev;vector<long long>ys;for(int i=0;i<n;i++){long long x,y;int c;cin>>x>>y>>c;long long u=x+y,v=x-y;if(c){ev.push_back({u+D,v-D,v+D,1});ev.push_back({u-D-1,v-D,v+D,-1});}else{b.push_back({u,v});ys.push_back(v);}}sort(b.begin(),b.end());sort(ev.begin(),ev.end());sort(ys.begin(),ys.end());ys.erase(unique(ys.begin(),ys.end()),ys.end());BIT bit(ys.size());int j=0;long long ans=0;for(auto [u,l,r,s]:ev){while(j<(int)b.size()&&b[j].first<=u){bit.add(lower_bound(ys.begin(),ys.end(),b[j].second)-ys.begin()+1,1);j++;}ans+=s*(bit.sum(upper_bound(ys.begin(),ys.end(),r)-ys.begin())-bit.sum(lower_bound(ys.begin(),ys.end(),l)-ys.begin()));}cout<<ans<<'\n';''',
'''from bisect import bisect_left,bisect_right
v=list(map(int,sys.stdin.buffer.read().split()));n,D=v[:2];b=[];ev=[]
for i in range(2,len(v),3):
    x,y,c=v[i:i+3];u=x+y;z=x-y
    if c:ev.extend([(u+D,z-D,z+D,1),(u-D-1,z-D,z+D,-1)])
    else:b.append((u,z))
b.sort();ev.sort();ys=sorted({y for x,y in b});bit=BIT(len(ys));j=ans=0
for u,l,r,s in ev:
    while j<len(b) and b[j][0]<=u:bit.add(bisect_left(ys,b[j][1])+1,1);j+=1
    ans+=s*(bit.sum(bisect_right(ys,r))-bit.sum(bisect_left(ys,l)))
print(ans)''',T(('兩紅點都在 (0,0)，藍點 (1,2)、(-2,0)，D=2。',['紅A','紅B'],'2 紅'),('到 (1,2) 距離 3，兩個紅點都不能配。',[3],0),('到 (-2,0) 距離 2，兩個紅點各配一次。',[2,2],2)),extra=BITCPP,preamble=BITPY)

add(415,'number-theory','medium','最小質因數篩與分類位置表','數字和是 3 的倍數等價於本身被 3 整除。|篩出每個整數的最小質因數 p，令 y=x/p；若 y 還被 p 整除，x 含平方因子，否則沿用 y 的無平方性且不同質因數數量加一。|把符合無平方性與 3 整除的數依質因數數量放入遞增列表。查詢用兩次二分取得 [l,r] 內的數量。','上界 V=max r；篩時間 O(V log log V)，查詢 O(log V)，空間 O(V+Q)。','1 雖無平方因子但數字和不是 3 倍數，所以不符合任何 k=0 查詢。',
'''int Q;cin>>Q;vector<array<int,3>>qs(Q);int V=1;for(auto&v:qs){cin>>v[0]>>v[1]>>v[2];V=max(V,v[1]);}vector<int>spf(V+1),omega(V+1),ok(V+1);ok[1]=1;for(int i=2;i<=V;i++)if(!spf[i])for(int j=i;j<=V;j+=i)if(!spf[j])spf[j]=i;vector<vector<int>>a(8);for(int x=2;x<=V;x++){int p=spf[x],y=x/p;omega[x]=omega[y]+(y%p!=0);ok[x]=ok[y]&&(y%p!=0);if(ok[x]&&x%3==0&&omega[x]<8)a[omega[x]].push_back(x);}for(auto [l,r,k]:qs)cout<<upper_bound(a[k].begin(),a[k].end(),r)-lower_bound(a[k].begin(),a[k].end(),l)<<'\n';''',
'''from array import array
from bisect import bisect_left,bisect_right
v=list(map(int,sys.stdin.buffer.read().split()));qs=[v[i:i+3] for i in range(1,len(v),3)];V=max(r for l,r,k in qs);spf=array('i',[0])*(V+1);omega=bytearray(V+1);ok=bytearray(V+1);ok[1]=1
for i in range(2,V+1):
    if not spf[i]:
        for j in range(i,V+1,i):
            if not spf[j]:spf[j]=i
a=[[] for _ in range(8)]
for x in range(2,V+1):
    p=spf[x];y=x//p;omega[x]=omega[y]+(y%p!=0);ok[x]=ok[y] and y%p!=0
    if ok[x] and x%3==0 and omega[x]<8:a[omega[x]].append(x)
print('\n'.join(str(bisect_right(a[k],r)-bisect_left(a[k],l)) for l,r,k in qs))''',T(('[1,30] 先找 3 的倍數。',[3,6,9,12,15,18,21,24,27,30],'10 個'),('去掉含平方因子的數，剩 3、6、15、21、30。',[3,6,15,21,30],'無平方因子'),('質因數數量分別是 1、2、2、2、3，因此 k=2 有三個。',[6,15,21],3)))

add(416,'strings','hard','後綴自動機與合法長度交集','建立後綴自動機，每個狀態代表長度 link.len+1 到 len 的不同子字串各一個；保存任一代表結尾 firstpos。|預先求每個位置結尾、相鄰字元皆不同的最長後綴長度 run。狀態中的各字串都是同一代表結尾的後綴，因此合法長度再受 run[firstpos] 限制。|每個非根狀態貢獻區間 [link.len+1,len] 與 [L,R]、[1,run[firstpos]] 的交集整數個數；各狀態互不重複，總和即不同內容數。','時間 O(N)，以固定 26 字母轉移或期望常數雜湊；空間 O(N)。','不能計位置數；同內容出現多次只算一次，複製狀態必須保留代表結尾。',
'''int n,L,R;string s;cin>>n>>L>>R>>s;struct Node{array<int,26>to;int link=-1,len=0,pos=0;Node(){to.fill(-1);}};vector<Node>st(1);int last=0;vector<int>run(n);for(int i=0;i<n;i++){run[i]=(i&&s[i]!=s[i-1]?run[i-1]+1:1);int c=s[i]-'a',cur=st.size();st.push_back(Node());st[cur].len=st[last].len+1;st[cur].pos=i;int p=last;while(p!=-1&&st[p].to[c]==-1){st[p].to[c]=cur;p=st[p].link;}if(p==-1)st[cur].link=0;else{int q=st[p].to[c];if(st[p].len+1==st[q].len)st[cur].link=q;else{int clone=st.size();st.push_back(st[q]);st[clone].len=st[p].len+1;while(p!=-1&&st[p].to[c]==q){st[p].to[c]=clone;p=st[p].link;}st[q].link=st[cur].link=clone;}}last=cur;}long long ans=0;for(int i=1;i<(int)st.size();i++){int lo=max(L,st[st[i].link].len+1),hi=min({R,st[i].len,run[st[i].pos]});ans+=max(0,hi-lo+1);}cout<<ans<<'\n';''',
'''v=sys.stdin.read().split();n,L,R=map(int,v[:3]);s=v[3];to=[{}];link=[-1];length=[0];pos=[0];last=0;run=[]
for i,ch in enumerate(s):
    run.append(run[-1]+1 if i and ch!=s[i-1] else 1);cur=len(to);to.append({});link.append(0);length.append(length[last]+1);pos.append(i);p=last
    while p!=-1 and ch not in to[p]:to[p][ch]=cur;p=link[p]
    if p!=-1:
        q=to[p][ch]
        if length[p]+1==length[q]:link[cur]=q
        else:
            clone=len(to);to.append(to[q].copy());link.append(link[q]);length.append(length[p]+1);pos.append(pos[q])
            while p!=-1 and to[p].get(ch)==q:to[p][ch]=clone;p=link[p]
            link[q]=link[cur]=clone
    last=cur
ans=0
for i in range(1,len(to)):ans+=max(0,min(R,length[i],run[pos[i]])-max(L,length[link[i]]+1)+1)
print(ans)''',T(('S=ababa，長度 2 的不同合法內容為 ab、ba。',['ab','ba'],2),('長度 3 再加 aba、bab。',['aba','bab'],4),('長度 4 再加 abab、baba；範圍 [2,4] 合計六種。',['abab','baba'],6)))

add(417,'dp','medium','兩列輪廓 DP 與直立數量','逐欄處理，mask 的兩個位元表示前一欄水平骨牌已伸入的格子，DP 再記用過幾個直立骨牌。|先排除伸入格與障礙重疊的狀態，再遞迴填這欄最上方的空格：可向下一格直立，或向右水平並設定下一欄 mask。|兩格都填完後轉移到下一欄；最後只接受 mask=0、直立數=K。每種鋪法的逐欄填法唯一，所以不重複。','時間 O(nK)，每欄固定 4 個 mask 與常數填法；空間 O(n+K)。','障礙不是需要鋪的格子；空板且 K=0 的空覆蓋計一次。',
'''int n,K;cin>>n>>K;string a,b;cin>>a>>b;const int M=1000000007;vector<vector<long long>>dp(4,vector<long long>(K+1));dp[0][0]=1;for(int col=0;col<n;col++){int block=(a[col]=='#')+2*(b[col]=='#');vector<vector<long long>>nd(4,vector<long long>(K+1));for(int mask=0;mask<4;mask++)if(!(mask&block))for(int k=0;k<=K;k++)if(dp[mask][k]){function<void(int,int,int)>fill=[&](int used,int out,int cnt){if(cnt>K)return;if(used==3){nd[out][cnt]=(nd[out][cnt]+dp[mask][k])%M;return;}int r=(used&1)?1:0;int bit=1<<r;if(r==0&&!(used&2))fill(3,out,cnt+1);if(col+1<n)fill(used|bit,out|bit,cnt);};fill(mask|block,0,k);}dp.swap(nd);}cout<<dp[0][K]<<'\n';''',
'''v=sys.stdin.read().split();n,K=map(int,v[:2]);a,b=v[2:];M=1000000007;dp=[[0]*(K+1) for _ in range(4)];dp[0][0]=1
for col in range(n):
    block=(a[col]=='#')+2*(b[col]=='#');nd=[[0]*(K+1) for _ in range(4)]
    for mask in range(4):
        if mask&block:continue
        for k,ways in enumerate(dp[mask]):
            if not ways:continue
            def fill(used,out,cnt):
                if cnt>K:return
                if used==3:nd[out][cnt]=(nd[out][cnt]+ways)%M;return
                r=1 if used&1 else 0;bit=1<<r
                if r==0 and not used&2:fill(3,out,cnt+1)
                if col+1<n:fill(used|bit,out|bit,cnt)
            fill(mask|block,0,k)
    dp=nd
print(dp[0][K])''',T(('2×4 全空板，恰兩個直立骨牌。',['....','....'],'K=2'),('其餘四格必須用兩個水平骨牌，共佔連續兩欄。',['HH','HH'],'水平區塊寬2'),('水平區塊可從第 1、2 或 3 欄開始，共三種。',[1,2,3],3)))

add(418,'dp','hard','限制深度計數之差','先計算深度至多 H、峰數恰 P 的合法括號序列數 f(H)，答案為 f(H)-f(H-1)。|DP 記已放字元數、目前高度、峰數與上一字元是否為左括號。放左括號使高度加一且不得超過上限；放右括號要求高度>0，若上一字元是左括號就新增一個峰。|已用左括號數可由 (長度+高度)/2 算出，確保不超過 n。最後高度 0 且峰數 P 才計入。','時間 O(n(H+1)(P+1))，空間 O((H+1)(P+1))，Python用稀疏狀態表。','H=0 且 n>0 無解；峰是相鄰的 ()，不是每一次關閉括號。',
'''int n,H,P;cin>>n>>H>>P;const long long M=1000000007;auto solve=[&](int cap){if(cap<0)return 0LL;int z=(cap+1)*(P+1)*2;vector<long long>dp(z);auto ix=[&](int h,int p,int o){return (h*(P+1)+p)*2+o;};dp[ix(0,0,0)]=1;for(int t=0;t<2*n;t++){vector<long long>nd(z);for(int h=0;h<=cap;h++)for(int p=0;p<=P;p++)for(int o=0;o<2;o++){long long w=dp[ix(h,p,o)];if(!w)continue;if(h<cap&&(t+h)/2<n)nd[ix(h+1,p,1)]=(nd[ix(h+1,p,1)]+w)%M;if(h>0&&p+o<=P)nd[ix(h-1,p+o,0)]=(nd[ix(h-1,p+o,0)]+w)%M;}dp.swap(nd);}return dp[ix(0,P,0)];};cout<<(solve(H)-solve(H-1)+M)%M<<'\n';''',
'''n,H,P=map(int,sys.stdin.read().split());M=1000000007
def solve(cap):
    if cap<0:return 0
    dp={(0,0,0):1}
    for t in range(2*n):
        nd={}
        for (h,p,o),w in dp.items():
            if h<cap and (t+h)//2<n:
                z=(h+1,p,1);nd[z]=(nd.get(z,0)+w)%M
            if h and p+o<=P:
                z=(h-1,p+o,0);nd[z]=(nd.get(z,0)+w)%M
        dp=nd
    return dp.get((0,P,0),0)
print((solve(H)-solve(H-1))%M)''',T(('n=3 的五個合法序列依峰數分類。',['((()))','(()())','(())()','()(())','()()()'],'共5'),('恰兩峰有 (()())、(())()、()(())。',['(()())','(())()','()(())'],'共3'),('這三個最大深度都恰為 2。',[2,2,2],3)))
checkpoint()

add(419,'graphs','hard','強連通分量來源與備援名額背包','把有向圖縮成強連通分量 DAG。所有點收到訊息，等價於每個入度為零的來源分量至少啟動一站；非來源分量可不啟動。|各分量把備援站費用排序，取 j 個備援時一定取最便宜 j 個；若 j=0 且為來源，另須取最便宜的非備援站。非負費用使其餘非備援站都不需選。|對各分量選項做最小費用背包，備援數達 K 就封頂為 K。K=0 時每個來源直接取最便宜站，其他不取。','時間 O(n+m+n log n+nK²)，空間 O(n+m+K)。','備援站可多於 K；來源分量內選任一站即能覆蓋該分量，但整張圖不能只選一個最便宜站。',
'''int n,m,K;cin>>n>>m>>K;vector<long long>cost(n);vector<int>b(n);for(int i=0;i<n;i++)cin>>cost[i]>>b[i];vector<vector<int>>g(n),rg(n);vector<pair<int,int>>edges;while(m--){int u,v;cin>>u>>v;--u;--v;g[u].push_back(v);rg[v].push_back(u);edges.push_back({u,v});}vector<int>seen(n),order;function<void(int)>dfs=[&](int u){seen[u]=1;for(int v:g[u])if(!seen[v])dfs(v);order.push_back(u);};for(int i=0;i<n;i++)if(!seen[i])dfs(i);vector<int>id(n,-1);function<void(int,int)>mark=[&](int u,int c){id[u]=c;for(int v:rg[u])if(id[v]<0)mark(v,c);};int C=0;reverse(order.begin(),order.end());for(int u:order)if(id[u]<0)mark(u,C++);vector<int>ind(C);for(auto[u,v]:edges)if(id[u]!=id[v])ind[id[v]]=1;const long long INF=1LL<<60;vector<vector<long long>>yes(C);vector<long long>no(C,INF),any(C,INF);for(int u=0;u<n;u++){any[id[u]]=min(any[id[u]],cost[u]);if(b[u])yes[id[u]].push_back(cost[u]);else no[id[u]]=min(no[id[u]],cost[u]);}vector<long long>dp(K+1,INF);dp[0]=0;for(int c=0;c<C;c++){sort(yes[c].begin(),yes[c].end());vector<pair<int,long long>>op;if(K==0)op.push_back({0,ind[c]?0:any[c]});else{op.push_back({0,ind[c]?0:no[c]});long long s=0;for(int j=1;j<=min(K,(int)yes[c].size());j++){s+=yes[c][j-1];op.push_back({j,s});}}vector<long long>nd(K+1,INF);for(int k=0;k<=K;k++)if(dp[k]!=INF)for(auto[j,s]:op)if(s!=INF)nd[min(K,k+j)]=min(nd[min(K,k+j)],dp[k]+s);dp.swap(nd);}cout<<(dp[K]==INF?-1:dp[K])<<'\n';''',
'''sys.setrecursionlimit(10000)
v=list(map(int,sys.stdin.buffer.read().split()));n,m,K=v[:3];cost=v[3:3+2*n:2];b=v[4:3+2*n:2];g=[[] for _ in range(n)];rg=[[] for _ in range(n)];edges=[]
for i in range(3+2*n,len(v),2):
    u,w=v[i]-1,v[i+1]-1;g[u].append(w);rg[w].append(u);edges.append((u,w))
seen=[False]*n;order=[]
def dfs(u):
    seen[u]=True
    for w in g[u]:
        if not seen[w]:dfs(w)
    order.append(u)
for u in range(n):
    if not seen[u]:dfs(u)
ids=[-1]*n
def mark(u,c):
    ids[u]=c
    for w in rg[u]:
        if ids[w]<0:mark(w,c)
C=0
for u in reversed(order):
    if ids[u]<0:mark(u,C);C+=1
ind=[False]*C
for u,w in edges:
    if ids[u]!=ids[w]:ind[ids[w]]=True
INF=10**30;yes=[[] for _ in range(C)];no=[INF]*C;anycost=no.copy()
for u in range(n):
    c=ids[u];anycost[c]=min(anycost[c],cost[u])
    if b[u]:yes[c].append(cost[u])
    else:no[c]=min(no[c],cost[u])
dp=[0]+[INF]*K
for c in range(C):
    if K==0:op=[(0,0 if ind[c] else anycost[c])]
    else:
        op=[(0,0 if ind[c] else no[c])];s=0
        for j,w in enumerate(sorted(yes[c])[:K],1):s+=w;op.append((j,s))
    nd=[INF]*(K+1)
    for k,x in enumerate(dp):
        if x==INF:continue
        for j,s in op:
            if s!=INF:z=min(K,k+j);nd[z]=min(nd[z],x+s)
    dp=nd
print(-1 if dp[K]==INF else dp[K])''',T(('範例分量為 {1,2}、{3}、{4}，來源為前者與 {4}。',['{1,2}','{3}','{4}'],'K=2'),('只顧覆蓋可取 2 號費用2、4號費用1，但只有一個備援。',['2','4'],'費用3'),('改取備援1號費用5、4號費用1，可覆蓋所有站且兩備援。',['1','4'],6)))

add(420,'dp','medium','按最後字母分類的共同子序列','dp[i][j][c] 表示兩字串前綴中的合法共同子序列、最後字母為 c 的最大長度。|先繼承跳過 S[i] 或 T[j] 的狀態；若兩個新字母同為 c，就從對角線所有最後字母不為 c 的狀態取最大再加一，也允許空序列起步。|每個合法序列最後一字要麼未用新位置，要麼同時用了兩個新位置，轉移涵蓋全部情況。只保存前一列。','時間 O(26|S||T|)，空間 O(26|T|+|S|)。','相同字母可在原字串連續，但選出的共同子序列不能有相鄰相同字母。',
'''string s,t;cin>>s>>t;int m=t.size();vector<array<int,26>>dp(m+1);for(char x:s){vector<array<int,26>>nd(m+1);for(int j=1;j<=m;j++){for(int c=0;c<26;c++)nd[j][c]=max(dp[j][c],nd[j-1][c]);if(x==t[j-1]){int c=x-'A',best=0;for(int d=0;d<26;d++)if(c!=d)best=max(best,dp[j-1][d]);nd[j][c]=max(nd[j][c],best+1);}}dp.swap(nd);}cout<<*max_element(dp[m].begin(),dp[m].end())<<'\n';''',
'''s,t=sys.stdin.read().split();m=len(t);dp=[[0]*26 for _ in range(m+1)]
for x in s:
    nd=[[0]*26 for _ in range(m+1)]
    for j,y in enumerate(t,1):
        nd[j]=[max(a,b) for a,b in zip(dp[j],nd[j-1])]
        if x==y:
            c=ord(x)-65;nd[j][c]=max(nd[j][c],1+max((dp[j-1][d] for d in range(26) if d!=c),default=0))
    dp=nd
print(max(dp[m]))''',T(('S=AABCA，T=ABACA，先選共同的 A、B。',['A','B'],2),('接上兩字串都存在且順序相容的 C。',['A','B','C'],3),('再接 A 得 ABCA，長度4；長度5必須兩原字串完全相同，不可能。',['A','B','C','A'],4)))

add(421,'dp','medium','精確場數與必修旗標的區間排程','活動依結束時間排序，以二分找出開始前已結束的活動數 p。|dp[i][k][b] 代表前 i 場選恰 k 場、是否已有必修標記 b 的最大效益。略過當前活動沿用 dp[i-1]；選取則由 dp[p][k-1] 加收益，並更新旗標。|最後只接受 dp[n][K][1]，因此 K=0 必定無解；負收益仍可能因恰好場數而必須選。','時間 O(n log n+nK)，空間 O(nK)。','必修是至少選一場有標記，而不是所有有標記活動都必須參加。',
'''int n,K;cin>>n>>K;vector<array<long long,4>>a(n);for(auto&x:a)cin>>x[0]>>x[1]>>x[2]>>x[3];sort(a.begin(),a.end(),[](auto x,auto y){return x[1]<y[1];});vector<long long>ends;for(auto x:a)ends.push_back(x[1]);const long long NEG=-(1LL<<60);vector<vector<array<long long,2>>>dp(n+1,vector<array<long long,2>>(K+1,{NEG,NEG}));dp[0][0][0]=0;for(int i=1;i<=n;i++){dp[i]=dp[i-1];auto[s,e,w,b]=a[i-1];int p=upper_bound(ends.begin(),ends.end(),s)-ends.begin();for(int k=1;k<=K;k++)for(int c=0;c<2;c++)if(dp[p][k-1][c]!=NEG)dp[i][k][c|b]=max(dp[i][k][c|b],dp[p][k-1][c]+w);}if(dp[n][K][1]==NEG)cout<<"IMPOSSIBLE\n";else cout<<dp[n][K][1]<<'\n';''',
'''from bisect import bisect_right
v=list(map(int,sys.stdin.buffer.read().split()));n,K=v[:2];a=[v[i:i+4] for i in range(2,len(v),4)];a.sort(key=lambda x:x[1]);ends=[x[1] for x in a];NEG=-10**30;dp=[[[NEG,NEG] for _ in range(K+1)]];dp[0][0][0]=0
for i,(s,e,w,b) in enumerate(a,1):
    cur=[x.copy() for x in dp[-1]];p=bisect_right(ends,s)
    for k in range(1,K+1):
        for c in range(2):
            x=dp[p][k-1][c]
            if x!=NEG:cur[k][c|b]=max(cur[k][c|b],x+w)
    dp.append(cur)
print('IMPOSSIBLE' if dp[n][K][1]==NEG else dp[n][K][1])''',T(('範例 K=2，必修場是 [2,4)、效益7。',['[2,4):7'],'必修已選'),('前面可接 [0,2)、效益5，總和12。',['[0,2)','[2,4)'],12),('效益20的 [1,3) 與必修場重疊，不能取代上述組合。',['重疊排除'],12)))

add(422,'dp','hard','站位子集合與跨類數量','mask 記已分配的工作站，下一個員工編號是 popcount(mask)。|對每個尚未用、費用不為 -1 的站 j，更新 mask 加 j，並把跨類數增加 (type[i]≠type[j])。|保存每個 (mask,k) 的最小費用，最後取全站 mask、恰 K；每個完美指派都對應唯一按員工順序的路徑。','時間 O(nK2^n)，空間 O(K2^n)；Python 使用緊密 64 位陣列。','禁止值 -1 不可當成低費用；員工與同編號站的類別使用同一輸入陣列。',
'''int n,K;cin>>n>>K;vector<int>t(n);for(auto&x:t)cin>>x;vector<vector<long long>>a(n,vector<long long>(n));for(auto&r:a)for(auto&x:r)cin>>x;const long long INF=1LL<<60;int S=1<<n;vector<vector<long long>>dp(S,vector<long long>(K+1,INF));dp[0][0]=0;for(int mask=0;mask<S-1;mask++){int i=__builtin_popcount((unsigned)mask);for(int j=0;j<n;j++)if(!(mask>>j&1)&&a[i][j]!=-1){int d=t[i]!=t[j],z=mask|1<<j;for(int k=0;k+d<=K;k++)if(dp[mask][k]!=INF)dp[z][k+d]=min(dp[z][k+d],dp[mask][k]+a[i][j]);}}cout<<(dp[S-1][K]==INF?-1:dp[S-1][K])<<'\n';''',
'''from array import array
v=list(map(int,sys.stdin.buffer.read().split()));n,K=v[:2];t=v[2:2+n];a=[v[2+n+i*n:2+n+(i+1)*n] for i in range(n)];INF=10**18;stride=K+1;S=1<<n;dp=array('q',[INF])*(S*stride);dp[0]=0
for mask in range(S-1):
    i=mask.bit_count();base=mask*stride
    for j in range(n):
        if mask>>j&1 or a[i][j]<0:continue
        d=int(t[i]!=t[j]);dest=(mask|1<<j)*stride
        for k in range(K+1-d):
            x=dp[base+k]
            if x!=INF:dp[dest+k+d]=min(dp[dest+k+d],x+a[i][j])
ans=dp[(S-1)*stride+K];print(-1 if ans==INF else ans)''',T(('範例類別 0、1、0，K=2。',[0,1,0],2),('員工1→站3費用2、員工2→站1費用1。',['1→3','2→1'],'費用3，跨類1'),('員工3→站2費用1，總費用4、跨類2。',['1→3','2→1','3→2'],4)))

add(423,'dp','medium','列舉最後批次的前綴 DP','dp[i] 表示前 i 件完成分批的最少批數，dp[0]=0。|對每個右端 i，往左枚舉最多 L 件，持續維護總和、最小值與最大值；差超過 D 即可停止，因再擴張不會縮小差。|總和被 P 整除且前綴可達時，更新 dp[i]=min(dp[i],dp[j-1]+1)。最後一批的所有可能起點均枚舉，所以可得全域最少。','時間 O(nL)，空間 O(n)。','重量為 0 可整除任何 P；不能只用總和整除而忽略批內極差。',
'''int n,L;long long D,P;cin>>n>>L>>D>>P;vector<long long>a(n);for(auto&x:a)cin>>x;vector<int>dp(n+1,n+1);dp[0]=0;for(int i=1;i<=n;i++){long long s=0,mn=LLONG_MAX,mx=LLONG_MIN;for(int j=i-1;j>=max(0,i-L);j--){s+=a[j];mn=min(mn,a[j]);mx=max(mx,a[j]);if(mx-mn>D)break;if(s%P==0)dp[i]=min(dp[i],dp[j]+1);}}cout<<(dp[n]>n?-1:dp[n])<<'\n';''',
'''v=list(map(int,sys.stdin.buffer.read().split()));n,L,D,P=v[:4];a=v[4:];dp=[0]+[n+1]*n
for i in range(1,n+1):
    s=0;mn=10**30;mx=-10**30
    for j in range(i-1,max(-1,i-L-1),-1):
        s+=a[j];mn=min(mn,a[j]);mx=max(mx,a[j])
        if mx-mn>D:break
        if s%P==0:dp[i]=min(dp[i],dp[j]+1)
print(-1 if dp[n]>n else dp[n])''',T(('1、2、3、0、3，L=3、D=3、P=3。',[1,2,3,0,3],'dp[0]=0'),('前兩件和3、極差1，能成一批；後三件和6、極差3。',['1+2','3+0+3'],2),('五件不能同批，因超過 L，故兩批已最佳。',[2],2)))

add(424,'dp','hard','枚舉上下界與標記前綴分組','固定上、下兩列，把每欄壓成分數和與標記數，問題變成一維非空區間恰 K 標記、和最大。|掃描右端，令分數前綴 S、標記前綴 C。需要以前出現 C-K 的位置，並選其中最小分數前綴，得到 S-minPrefix[C-K]。|查詢後才加入目前前綴，確保非空；枚舉所有列對便涵蓋全部矩形。可先轉置令列數較小。','時間 O(min(h,w)² max(h,w))，空間 O(hw)。','K=0 時也必須非空；分數全負不能用 0 當作已找到答案。',
'''int h,w,K;cin>>h>>w>>K;vector<vector<long long>>a(h,vector<long long>(w));for(auto&r:a)for(auto&x:r)cin>>x;vector<string>b(h);for(auto&s:b)cin>>s;if(h>w){vector<vector<long long>>c(w,vector<long long>(h));vector<string>d(w,string(h,'0'));for(int i=0;i<h;i++)for(int j=0;j<w;j++){c[j][i]=a[i][j];d[j][i]=b[i][j];}a.swap(c);b.swap(d);swap(h,w);}const long long NEG=-(1LL<<60);long long ans=NEG;for(int top=0;top<h;top++){vector<long long>s(w);vector<int>cnt(w);for(int bot=top;bot<h;bot++){for(int j=0;j<w;j++){s[j]+=a[bot][j];cnt[j]+=b[bot][j]-'0';}unordered_map<int,long long>mn;mn[0]=0;long long pre=0;int c=0;for(int j=0;j<w;j++){pre+=s[j];c+=cnt[j];if(mn.count(c-K))ans=max(ans,pre-mn[c-K]);if(!mn.count(c)||pre<mn[c])mn[c]=pre;}}}if(ans==NEG)cout<<"IMPOSSIBLE\n";else cout<<ans<<'\n';''',
'''v=sys.stdin.read().split();h,w,K=map(int,v[:3]);a=[list(map(int,v[3+i*w:3+(i+1)*w])) for i in range(h)];b=[list(map(int,s)) for s in v[3+h*w:]]
if h>w:a=list(map(list,zip(*a)));b=list(map(list,zip(*b)));h,w=w,h
ans=None
for top in range(h):
    sums=[0]*w;cnt=[0]*w
    for bot in range(top,h):
        for j in range(w):sums[j]+=a[bot][j];cnt[j]+=b[bot][j]
        mn={0:0};pre=c=0
        for j in range(w):
            pre+=sums[j];c+=cnt[j]
            if c-K in mn:
                x=pre-mn[c-K];ans=x if ans is None else max(ans,x)
            if c not in mn or pre<mn[c]:mn[c]=pre
print('IMPOSSIBLE' if ans is None else ans)''',T(('範例取第二列，分數 1、5、-2，標記 0、0、1。',[1,5,-2],'K=1'),('全列恰一個標記，總和 4。',[1,5,-2],4),('枚舉其他上下界及起訖欄，沒有更高合法矩形。',['第二列全列'],4)))

add(425,'dp','hard','前置條件遮罩與交替拓撲排序','每項任務保存所有直接前置任務的位元遮罩 need。|dp[mask][last] 計已完成 mask、最後任務類別為 last 的排列數。下一任務必須未完成、need 已全包含於 mask，且類別與 last 不同。空集合允許任意類別起步。|每個完整合法排列依序選任務有唯一轉移路徑；有向環或自依賴不可能全數加入，最後自然得到零。','時間 O(n2^n+m)，空間 O(2^n)。','重複先後關係只設定同一個位元；u=v 是不可滿足的條件。',
'''int n,m;cin>>n>>m;vector<int>t(n),need(n);for(auto&x:t)cin>>x;while(m--){int u,v;cin>>u>>v;need[v-1]|=1<<(u-1);}int S=1<<n,M=1000000007;vector<array<int,2>>dp(S);for(int mask=0;mask<S;mask++)for(int j=0;j<n;j++)if(!(mask>>j&1)&&(need[j]&mask)==need[j]){long long ways=mask?dp[mask][1-t[j]]:1;int z=mask|1<<j;dp[z][t[j]]=(dp[z][t[j]]+ways)%M;}cout<<(dp[S-1][0]+dp[S-1][1])%M<<'\n';''',
'''from array import array
v=list(map(int,sys.stdin.buffer.read().split()));n,m=v[:2];t=v[2:2+n];need=[0]*n
for i in range(2+n,len(v),2):u,w=v[i]-1,v[i+1]-1;need[w]|=1<<u
S=1<<n;M=1000000007;dp=[array('i',[0])*S for _ in range(2)]
for mask in range(S):
    for j in range(n):
        if not mask>>j&1 and need[j]&mask==need[j]:
            ways=dp[1-t[j]][mask] if mask else 1;z=mask|1<<j;dp[t[j]][z]=(dp[t[j]][z]+ways)%M
print((dp[0][-1]+dp[1][-1])%M)''',T(('任務類別 0、1、0、1，條件 1<2、3<4。',[1,2,3,4],'交替排列'),('合法排列 1、2、3、4，逐條滿足。',[1,2,3,4],1),('另一個是 3、4、1、2；其餘交替排列違反至少一條先後關係。',[3,4,1,2],2)))

add(426,'graphs','medium','雙車位置的乘積圖 BFS','狀態為有序位置對 (u,v)，每回合同時枚舉 u、v 的一條出邊。|新位置 a、b 必須不同，且不能 (a,b)=(v,u)，其餘合法轉移全部視為一條單位邊。|從 (s,t) 做 BFS，首次到達 (t,s) 的距離就是最少回合；所有狀態都遍歷仍未到則無解。平行道路可先去重。','狀態 O(n²)，總轉移上界 O(m²)，時間 O(n²+m²)，空間 O(n²+m)。','兩車每回合都必須走邊；沒有自環就不能等待。',
'''int n,m,s,t;cin>>n>>m>>s>>t;--s;--t;vector<vector<int>>g(n);while(m--){int u,v;cin>>u>>v;g[u-1].push_back(v-1);}for(auto&a:g){sort(a.begin(),a.end());a.erase(unique(a.begin(),a.end()),a.end());}vector<int>d(n*n,-1);queue<pair<int,int>>q;q.push({s,t});d[s*n+t]=0;while(!q.empty()){auto[u,v]=q.front();q.pop();for(int a:g[u])for(int b:g[v])if(a!=b&&!(a==v&&b==u)&&d[a*n+b]<0){d[a*n+b]=d[u*n+v]+1;q.push({a,b});}}cout<<d[t*n+s]<<'\n';''',
'''from collections import deque
v=list(map(int,sys.stdin.buffer.read().split()));n,m,s,t=v[:4];s-=1;t-=1;g=[set() for _ in range(n)]
for u,w in zip(v[4::2],v[5::2]):g[u-1].add(w-1)
d=[-1]*(n*n);d[s*n+t]=0;q=deque([(s,t)])
while q:
    u,w=q.popleft()
    for a in g[u]:
        for b in g[w]:
            if a==b or (a==w and b==u) or d[a*n+b]>=0:continue
            d[a*n+b]=d[u*n+w]+1;q.append((a,b))
print(d[t*n+s])''',T(('有向四環 1→2→3→4→1，起點 (1,3)。',['車A:1','車B:3'],0),('同時前進到 (2,4)，無同站也無交換。',['車A:2','車B:4'],1),('再前進到 (3,1)，完成交換目標。',['車A:3','車B:1'],2)))

add(427,'dp','medium','剩餘數量、末色與連續長度的記憶化','狀態保存三色剩餘數量、上一色、連續同色顆數與尚需切換次數。|選尚有餘量的顏色：若同色且連續已 2 則禁止；選異色時切換數減一、連續長度重設 1。第一顆不算切換。|剩餘全零且尚需切換為 0 時回傳 1。相同顏色珠子不可區分，所以每次選顏色只建立一個分支。','狀態 O((A+1)(B+1)(C+1)(K+1)×6)，每狀態最多三轉移，同階空間。','空排列在 K=0 時算一種；第一顆不會產生切換。',
'''int A,B,C,K;cin>>A>>B>>C>>K;const int M=1000000007;map<array<int,6>,int>memo;function<int(int,int,int,int,int,int)>f=[&](int a,int b,int c,int last,int run,int k){if(k<0)return 0;if(a+b+c==0)return int(k==0);array<int,6>key={a,b,c,last,run,k};if(memo.count(key))return memo[key];int rem[3]={a,b,c};long long ans=0;for(int t=0;t<3;t++)if(rem[t]&&!(t==last&&run==2)){rem[t]--;ans+=f(rem[0],rem[1],rem[2],t,t==last?run+1:1,k-(last!=3&&last!=t));rem[t]++;}return memo[key]=ans%M;};cout<<f(A,B,C,3,0,K)<<'\n';''',
'''from functools import lru_cache
A,B,C,K=map(int,sys.stdin.read().split());M=1000000007
@lru_cache(None)
def f(a,b,c,last,run,k):
    if k<0:return 0
    if a+b+c==0:return int(k==0)
    rem=[a,b,c];ans=0
    for t in range(3):
        if not rem[t] or t==last and run==2:continue
        rem[t]-=1;ans+=f(*rem,t,run+1 if t==last else 1,k-int(last!=3 and last!=t));rem[t]+=1
    return ans%M
print(f(A,B,C,3,0,K))''',T(('A=2、B=1、C=1，恰兩次切換。',['0','0','1','2'],'K=2'),('00 必須相鄰，視為色0的一個區塊；另有1、2兩區塊。',['00','1','2'],'3 區塊'),('三區塊任意排序皆兩次切換，3!=6。',[6],6)))

add(428,'dp','medium','精確總和與最後奇偶的子序列 DP','dp[parity][sum] 表示非空子序列、最後一個數奇偶為 parity、總和為 sum 的最大長度。|讀取 x 時，只由另一奇偶的舊狀態加上 x，也可用 x 自己開一段。略過元素則保留原狀態。|來源奇偶和目標奇偶不同，所以只寫入自身奇偶，不會在同一步重複使用 x，連 x=0 也安全。','時間 O(nS)，空間 O(S+n)。','S=0 時必須選至少一個位置；不能把空集合長度 0 當成有效答案。',
'''int n,S;cin>>n>>S;vector<vector<int>>dp(2,vector<int>(S+1,-1));while(n--){int x;cin>>x;if(x>S)continue;int c=x%2;for(int s=0;s+x<=S;s++)if(dp[1-c][s]>=0)dp[c][s+x]=max(dp[c][s+x],dp[1-c][s]+1);dp[c][x]=max(dp[c][x],1);}cout<<max(dp[0][S],dp[1][S])<<'\n';''',
'''v=list(map(int,sys.stdin.buffer.read().split()));n,S=v[:2];dp=[[-1]*(S+1) for _ in range(2)]
for x in v[2:]:
    if x>S:continue
    c=x%2
    for s in range(S-x+1):
        if dp[1-c][s]>=0:dp[c][s+x]=max(dp[c][s+x],dp[1-c][s]+1)
    dp[c][x]=max(dp[c][x],1)
print(max(dp[0][S],dp[1][S]))''',T(('1、2、3、4、5，目標和9。',[1,2,3,4,5],9),('選 2、3、4，偶奇偶交替且和9。',[2,3,4],3),('五個全選和15；四個最小也和10，不能比三個更長。',[3],3)))

add(429,'dp','medium','路徑 DP：大跳數與上一步種類','dp[i][k][b] 記抵達 i、用恰 k 次大跳、最後一步是否大跳的最大分數。|小步可由 i-1 的任意末步狀態轉入；大跳只能由 i-2、末步非大跳且 k-1 的狀態轉入。封閉格不建立狀態。|起點可走時 dp[1][0][0]=a1，最後取位置 n 的兩種末步最大值。只依賴前兩位置，可滾動儲存。','時間 O(nK)，空間 O(n+K)。','跨過封閉格可以，但落點不可封閉；起點也計分，封閉起終點直接無解。',
'''int n,K;cin>>n>>K;vector<long long>a(n);vector<int>b(n);for(int i=0;i<n;i++)cin>>a[i]>>b[i];const long long NEG=-(1LL<<60);using Row=vector<array<long long,2>>;Row prev(K+1,{NEG,NEG}),prev2=prev;for(int i=0;i<n;i++){Row cur(K+1,{NEG,NEG});if(!b[i]){if(i==0)cur[0][0]=a[i];else for(int k=0;k<=K;k++){long long x=max(prev[k][0],prev[k][1]);if(x!=NEG)cur[k][0]=x+a[i];if(i>=2&&k&&prev2[k-1][0]!=NEG)cur[k][1]=prev2[k-1][0]+a[i];}}prev2=prev;prev=cur;}long long ans=max(prev[K][0],prev[K][1]);if(ans==NEG)cout<<"IMPOSSIBLE\n";else cout<<ans<<'\n';''',
'''v=list(map(int,sys.stdin.buffer.read().split()));n,K=v[:2];a=list(zip(v[2::2],v[3::2]));NEG=-10**30;prev=[[NEG,NEG] for _ in range(K+1)];prev2=[x.copy() for x in prev]
for i,(w,blocked) in enumerate(a):
    cur=[[NEG,NEG] for _ in range(K+1)]
    if not blocked:
        if i==0:cur[0][0]=w
        else:
            for k in range(K+1):
                x=max(prev[k])
                if x!=NEG:cur[k][0]=x+w
                if i>=2 and k and prev2[k-1][0]!=NEG:cur[k][1]=prev2[k-1][0]+w
    prev2,prev=prev,cur
ans=max(prev[K]);print('IMPOSSIBLE' if ans==NEG else ans)''',T(('範例分數 1、-2、5、3、4、2，需兩次大跳。',[1,-2,5,3,4,2],'K=2'),('合法路徑 1→3→4→6，步長2、1、2。',[1,3,4,6],'不連續大跳'),('落點分數 1+5+3+2=11。',[1,5,3,2],11)))
checkpoint()

add(430,'strings','medium','母音奇偶遮罩與長度模 3','以前綴 5 位遮罩記五種母音出現次數的奇偶，前綴長度再取模 3。|兩前綴遮罩相同且長度同餘，之間片段就滿足各母音偶數、長度為 3 倍數；累計同 key 的先前前綴數即可。|這包含完全沒有母音的片段，另維護目前連續非母音長度 run，每個右端恰有 floor(run/3) 個純子音、3 倍長片段，從答案扣掉。','時間 O(N)，字串 O(N)，額外計數表 O(32×3)。','「至少一母音」不能由奇偶遮罩直接判斷；零次也屬偶數，須另扣。',
'''int n;string s;cin>>n>>s;long long cnt[32][3]={};cnt[0][0]=1;int mask=0,run=0;long long ans=0;string vo="aeiou";for(int i=1;i<=n;i++){auto p=vo.find(s[i-1]);if(p!=string::npos){mask^=1<<p;run=0;}else run++;ans+=cnt[mask][i%3]++;ans-=run/3;}cout<<ans<<'\n';''',
'''v=sys.stdin.read().split();s=v[1];cnt=[[0]*3 for _ in range(32)];cnt[0][0]=1;mask=run=ans=0;vo='aeiou'
for i,ch in enumerate(s,1):
    if ch in vo:mask^=1<<vo.index(ch);run=0
    else:run+=1
    ans+=cnt[mask][i%3];cnt[mask][i%3]+=1;ans-=run//3
print(ans)''',T(('aeiaei 的前三字使 a、e、i 都是奇數。',['a','e','i'],'遮罩00111'),('後三字將三種母音各再翻轉一次。',['a','e','i','a','e','i'],'遮罩00000'),('長度6為3倍數且有母音，只有整段符合。',['aeiaei'],1)))

add(431,'geometry','hard','嚴格內部交會的掃描線','水平段啟用時在 y 座標加一，離開時減一；垂直段查目前 y1<y<y2 的水平段數。|依 x 排事件，同一 x 順序為刪除右端、垂直查詢、加入左端，確保水平段端點不被計入。|y 方向以 upper_bound(y1) 與 lower_bound(y2) 排除兩端，樹狀陣列記重合水平段的份數。','時間 O((H+V) log(H+V))，空間 O(H+V)。','兩方向都要求交點在內部；同 x 事件順序和 y 的嚴格界線缺一不可。',
'''int H,V;cin>>H>>V;vector<array<long long,4>>e;vector<long long>ys;for(int i=0;i<H;i++){long long l,r,y;cin>>l>>r>>y;ys.push_back(y);e.push_back({l,2,y,0});e.push_back({r,0,y,0});}for(int i=0;i<V;i++){long long x,l,r;cin>>x>>l>>r;e.push_back({x,1,l,r});}sort(ys.begin(),ys.end());ys.erase(unique(ys.begin(),ys.end()),ys.end());sort(e.begin(),e.end());BIT b(ys.size());long long ans=0;for(auto[x,t,l,r]:e){if(t==1)ans+=b.sum(lower_bound(ys.begin(),ys.end(),r)-ys.begin())-b.sum(upper_bound(ys.begin(),ys.end(),l)-ys.begin());else b.add(lower_bound(ys.begin(),ys.end(),l)-ys.begin()+1,t==2?1:-1);}cout<<ans<<'\n';''',
'''from bisect import bisect_left,bisect_right
v=list(map(int,sys.stdin.buffer.read().split()));H,V=v[:2];e=[];ys=[]
for i in range(H):
    l,r,y=v[2+3*i:5+3*i];ys.append(y);e.extend([(l,2,y,0),(r,0,y,0)])
for i in range(V):
    x,l,r=v[2+3*H+3*i:5+3*H+3*i];e.append((x,1,l,r))
ys=sorted(set(ys));b=BIT(len(ys));ans=0
for x,t,l,r in sorted(e):
    if t==1:ans+=b.sum(bisect_left(ys,r))-b.sum(bisect_right(ys,l))
    else:b.add(bisect_left(ys,l)+1,1 if t==2 else -1)
print(ans)''',T(('水平段 x從0到4、y=2；垂直段 x=0、y從0到3。',['x=0 端點'],'不計'),('垂直段 x=2 時，交點 (2,2) 在雙方內部。',['(2,2)'],1),('垂直段 x=4 時，水平右端已移除，因此不計。',['x=4 端點'],1)),extra=BITCPP,preamble=BITPY)

add(432,'sorting','medium','初始逆序與相鄰交換增量','先排序壓縮並用樹狀陣列算初始逆序對。|交換相鄰兩個值 x、y 時，所有其他位置與這兩值形成的逆序總數不變；唯一改變的是它們彼此。|若 x>y，逆序減一；x<y 加一；相等不變。更新計數後實際交換，供下一操作使用。','時間 O(N log N+Q)，空間 O(N+Q)。','位置指的是當下位置；不能一直用原數列判斷。',
'''int n,q;cin>>n>>q;vector<long long>a(n),s;for(auto&x:a)cin>>x;s=a;sort(s.begin(),s.end());BIT b(n);long long ans=0;for(int i=0;i<n;i++){int r=lower_bound(s.begin(),s.end(),a[i])-s.begin()+1;ans+=i-b.sum(r);b.add(r,1);}while(q--){int p;cin>>p;--p;ans+=(a[p]<a[p+1])-(a[p]>a[p+1]);swap(a[p],a[p+1]);cout<<ans<<'\n';}''',
'''from bisect import bisect_left
v=list(map(int,sys.stdin.buffer.read().split()));n,q=v[:2];a=v[2:2+n];s=sorted(a);b=BIT(n);ans=0
for i,x in enumerate(a):
    r=bisect_left(s,x)+1;ans+=i-b.sum(r);b.add(r,1)
out=[]
for p in v[2+n:]:
    p-=1;ans+=(a[p]<a[p+1])-(a[p]>a[p+1]);a[p],a[p+1]=a[p+1],a[p];out.append(str(ans))
print('\n'.join(out))''',T(('3、1、1、2，初始逆序3。',[3,1,1,2],3),('交換位置1、2後成1、3、1、2，逆序減1。',[1,3,1,2],2),('交換位置3、4後成1、3、2、1，逆序加1。',[1,3,2,1],3)),extra=BITCPP,preamble=BITPY)

add(433,'dp','medium','雙上界數位 DP 與無進位','把 A、B 補成相同長度；前導零只作表示對齊，不產生重複數值。|狀態記是否仍貼住 A、B 的上界及目前 (數字和)%3。每位枚舉 xdigit、ydigit，僅接受兩數字和<10。|新的模3餘數加上兩數字之和；因10≡1 mod3，最後餘數0等價於 x+y 為3倍數。累加所有貼界旗標的餘數0狀態。','位數 d≤19，時間 O(d×4×3×100)，額外空間 O(12)。','(0,0) 必須計入；不可先算和再只檢查最終進位。',
'''string A,B;cin>>A>>B;int d=max(A.size(),B.size());A=string(d-A.size(),'0')+A;B=string(d-B.size(),'0')+B;const long long M=1000000007;long long dp[2][2][3]={};dp[1][1][0]=1;for(int i=0;i<d;i++){long long nd[2][2][3]={};for(int a=0;a<2;a++)for(int b=0;b<2;b++)for(int r=0;r<3;r++)for(int x=0;x<=(a?A[i]-'0':9);x++)for(int y=0;y<=(b?B[i]-'0':9)&&x+y<10;y++){int u=a&&(x==A[i]-'0'),v=b&&(y==B[i]-'0'),z=(r+x+y)%3;nd[u][v][z]=(nd[u][v][z]+dp[a][b][r])%M;}memcpy(dp,nd,sizeof dp);}long long ans=0;for(int a=0;a<2;a++)for(int b=0;b<2;b++)ans+=dp[a][b][0];cout<<ans%M<<'\n';''',
'''A,B=sys.stdin.read().split();d=max(len(A),len(B));A=A.zfill(d);B=B.zfill(d);M=1000000007;dp={(True,True,0):1}
for aa,bb in zip(A,B):
    aa=int(aa);bb=int(bb);nd={}
    for (ta,tb,r),w in dp.items():
        for x in range((aa if ta else 9)+1):
            for y in range(min(bb if tb else 9,9-x)+1):
                key=(ta and x==aa,tb and y==bb,(r+x+y)%3);nd[key]=(nd.get(key,0)+w)%M
    dp=nd
print(sum(w for (a,b,r),w in dp.items() if r==0)%M)''',T(('教學上界 A=2、B=2，不會有任何進位。',[0,1,2],'每邊三數'),('和為3倍數的組為 (0,0)、(1,2)、(2,1)。',['(0,0)','(1,2)','(2,1)'],3),('其他六組和為1、2或4，不計。',[3],3)))

add(434,'geometry','hard','種類隔離的二維離線加總','每個閉矩形拆成 x≤x2 的 y 區間和減去 x≤x1-1 的 y 區間和。|點與事件按 (種類,x) 排序，依序插入符合 x 上限的點。將 (種類,y) 一起壓縮成樹狀陣列索引，查詢只取相同種類的 y 範圍。|這樣前面其他種類的點雖仍在陣列中，也會被兩個 y 前綴相減消去；負權重直接相加即可。','時間 O((N+Q) log(N+Q))，空間 O(N+Q)。','矩形邊界包含，x1 要拆成 x1-1；不能把相同座標的讀數去重。',
'''int n,q;cin>>n>>q;vector<array<long long,4>>p(n);vector<pair<long long,long long>>ys;for(auto&v:p){cin>>v[0]>>v[1]>>v[2]>>v[3];ys.push_back({v[0],v[2]});}vector<array<long long,6>>ev;for(int i=0;i<q;i++){long long t,x1,y1,x2,y2;cin>>t>>x1>>y1>>x2>>y2;ev.push_back({t,x2,y1,y2,i,1});ev.push_back({t,x1-1,y1,y2,i,-1});}sort(p.begin(),p.end());sort(ev.begin(),ev.end());sort(ys.begin(),ys.end());ys.erase(unique(ys.begin(),ys.end()),ys.end());BIT b(ys.size());vector<long long>ans(q);int j=0;for(auto[t,x,l,r,id,s]:ev){while(j<n&&pair(p[j][0],p[j][1])<=pair(t,x)){b.add(lower_bound(ys.begin(),ys.end(),pair(p[j][0],p[j][2]))-ys.begin()+1,p[j][3]);j++;}ans[id]+=s*(b.sum(upper_bound(ys.begin(),ys.end(),pair(t,r))-ys.begin())-b.sum(lower_bound(ys.begin(),ys.end(),pair(t,l))-ys.begin()));}for(auto x:ans)cout<<x<<'\n';''',
'''from bisect import bisect_left,bisect_right
v=list(map(int,sys.stdin.buffer.read().split()));n,q=v[:2];p=[tuple(v[i:i+4]) for i in range(2,2+4*n,4)];ys=sorted({(t,y) for t,x,y,w in p});ev=[]
for i in range(q):
    t,x1,y1,x2,y2=v[2+4*n+5*i:7+4*n+5*i];ev.extend([(t,x2,y1,y2,i,1),(t,x1-1,y1,y2,i,-1)])
p.sort();b=BIT(len(ys));ans=[0]*q;j=0
for t,x,l,r,i,s in sorted(ev):
    while j<n and p[j][:2]<=(t,x):
        c,xx,y,w=p[j];b.add(bisect_left(ys,(c,y))+1,w);j+=1
    ans[i]+=s*(b.sum(bisect_right(ys,(t,r)))-b.sum(bisect_left(ys,(t,l))))
print('\n'.join(map(str,ans)))''',T(('種類1點 (1,1)重4、(2,2)重-1，另有種類2點重5。',['1:4','1:-1','2:5'],'查種類1'),('矩形 [1,2]×[1,2] 包含種類1兩筆。',[4,-1],3),('縮成單點 (1,1) 時只有種類1的4，種類2不混入。',[4],4)),extra=BITCPP,preamble=BITPY)

add(435,'data-structures','hard','長度窗中的前綴和值域計數','前綴和 P[i] 使區間和為 P[i]-P[j]。對每個右端 i，合法左前綴索引 j 介於 i-M 與 i-K。|用樹狀陣列維護這些前綴和的份數，新增 j=i-K，移除 j=i-M-1。|和值介於 L、U 等價於 P[j] 介於 P[i]-U、P[i]-L，利用壓縮座標兩次前綴查詢計數。','時間 O(N log N)，空間 O(N)。','含負數時和值不能用單純雙指標；相同前綴和需保留多份。',
'''int n,K,M;long long L,U;cin>>n>>K>>M>>L>>U;vector<long long>p(n+1),s;for(int i=1;i<=n;i++){long long x;cin>>x;p[i]=p[i-1]+x;}s=p;sort(s.begin(),s.end());s.erase(unique(s.begin(),s.end()),s.end());BIT b(s.size());auto upd=[&](int i,int d){b.add(lower_bound(s.begin(),s.end(),p[i])-s.begin()+1,d);};long long ans=0;for(int i=1;i<=n;i++){if(i>=K)upd(i-K,1);if(i>M)upd(i-M-1,-1);ans+=b.sum(upper_bound(s.begin(),s.end(),p[i]-L)-s.begin())-b.sum(lower_bound(s.begin(),s.end(),p[i]-U)-s.begin());}cout<<ans<<'\n';''',
'''from bisect import bisect_left,bisect_right
v=list(map(int,sys.stdin.buffer.read().split()));n,K,M,L,U=v[:5];p=[0]
for x in v[5:]:p.append(p[-1]+x)
s=sorted(set(p));b=BIT(len(s));ans=0
for i in range(1,n+1):
    if i>=K:b.add(bisect_left(s,p[i-K])+1,1)
    if i>M:b.add(bisect_left(s,p[i-M-1])+1,-1)
    ans+=b.sum(bisect_right(s,p[i]-L))-b.sum(bisect_left(s,p[i]-U))
print(ans)''',T(('教學例 1、-1、2，長度1到2、和值1到2。',[0,1,0,2],'前綴和'),('右端1有 [1]；右端2沒有合法和值。',['[1]'],1),('右端3有 [2] 與 [-1,2]，合計三段。',['[1]','[2]','[-1,2]'],3)),extra=BITCPP,preamble=BITPY)

add(436,'data-structures','medium','價格最小堆與延遲刪除','新增報價放入以 (價格,編號) 為主鍵的最小堆，另用集合記錄尚未取消的編號。|取消只從集合刪除；查詢時反覆移除堆頂已取消或 e<t 的項目，直到有效或堆空。|時間不遞減保證過期項目永不恢復，刪除安全。堆頂清理完後就是所有有效項中最便宜、同價編號最小者。','時間 O(N log N)，空間 O(N)；每筆報價最多入堆出堆一次。','e=t 仍有效；查詢不取走有效報價，同時間按原順序執行。',
'''int n;cin>>n;using A=array<long long,3>;priority_queue<A,vector<A>,greater<A>>h;unordered_set<long long>alive;while(n--){int k;long long t;cin>>k>>t;if(k==1){long long id,p,e;cin>>id>>p>>e;alive.insert(id);h.push({p,id,e});}else if(k==2){long long id;cin>>id;alive.erase(id);}else{while(!h.empty()&&(!alive.count(h.top()[1])||h.top()[2]<t))h.pop();if(h.empty())cout<<-1<<'\n';else cout<<h.top()[0]<<' '<<h.top()[1]<<'\n';}}''',
'''import heapq
h=[];alive=set();out=[]
for line in sys.stdin.read().splitlines()[1:]:
    z=list(map(int,line.split()));k,t=z[:2]
    if k==1:
        id,p,e=z[2:];alive.add(id);heapq.heappush(h,(p,id,e))
    elif k==2:alive.discard(z[2])
    else:
        while h and (h[0][1] not in alive or h[0][2]<t):heapq.heappop(h)
        out.append(f'{h[0][0]} {h[0][1]}' if h else '-1')
print('\n'.join(out))''',T(('時間0新增 id5價格7效期2、id6價格5效期0。',['5:7/e2','6:5/e0'],'查詢得5 6'),('時間1，id6已過期，移除後最低是id5。',['5:7/e2'],'7 5'),('同時間取消id5，再查無有效報價。',['∅'],-1)))

add(437,'data-structures','medium','按效期優先的部分出庫','入庫批次以 (最後有效時間,數量) 放入最小堆。|出庫先刪所有 e<t 的批次，再每次拿最早到期的一批，取 min(需求,批次數量)，剩餘批次數量若非零就放回。|這正是題目指定先到期先用的規則；每次迴圈至少滿足此請求或清空一批，所以全部操作總出堆次數為 O(N)。','時間 O(N log N)，空間 O(N)。','庫存不足就停止，不欠單；在最後有效時間當下仍可用。',
'''int n;cin>>n;using P=pair<long long,long long>;priority_queue<P,vector<P>,greater<P>>h;while(n--){int k;long long t,q;cin>>k>>t>>q;if(k==1){long long e;cin>>e;h.push({e,q});}else{while(!h.empty()&&h.top().first<t)h.pop();long long got=0;while(q&&!h.empty()){auto[e,v]=h.top();h.pop();long long z=min(q,v);q-=z;v-=z;got+=z;if(v)h.push({e,v});}cout<<got<<'\n';}}''',
'''import heapq
h=[];out=[]
for line in sys.stdin.read().splitlines()[1:]:
    z=list(map(int,line.split()));k,t,q=z[:3]
    if k==1:heapq.heappush(h,(z[3],q))
    else:
        while h and h[0][0]<t:heapq.heappop(h)
        got=0
        while q and h:
            e,v=heapq.heappop(h);take=min(q,v);q-=take;v-=take;got+=take
            if v:heapq.heappush(h,(e,v))
        out.append(str(got))
print('\n'.join(out))''',T(('入庫3份效期1、5份效期4。',['3/e1','5/e4'],'庫存8'),('時間1需求4，先用3份，再用第二批1份。',['4/e4'],'交付4'),('時間2需求5，僅餘4份全部交付，不保留欠單。',['∅'],'交付4')))

add(438,'data-structures','hard','依高度離線啟用與同色剪枝搜尋','按高度由大到小分組，在處理高度 h 的整組查詢前，僅啟用嚴格較高的塔。|位置線段樹摘要為：無啟用塔、全為同一色，或混色。找右側第一座異色塔時，空段或整段同查詢色可直接剪枝，否則先左後右。|同高組查完才啟用，確保不接受等高塔。第一次找到的葉子即編號最小的合格塔。','時間 O(N log N)，空間 O(N)。','不能用一般「下一個較高」單調堆疊後只檢查一次顏色，因更遠處可能有合格異色塔。',
'''int n;cin>>n;vector<long long>h(n),c(n);for(int i=0;i<n;i++)cin>>h[i]>>c[i];vector<int>ord(n),ans(n,-1);iota(ord.begin(),ord.end(),0);sort(ord.begin(),ord.end(),[&](int a,int b){return h[a]>h[b];});vector<long long>tr(4*n,0);auto merge=[](long long a,long long b){if(!a)return b;if(!b)return a;return a==b?a:-1;};function<void(int,int,int,int,long long)>put=[&](int p,int l,int r,int i,long long x){if(l==r){tr[p]=x;return;}int m=(l+r)/2;if(i<=m)put(p*2,l,m,i,x);else put(p*2+1,m+1,r,i,x);tr[p]=merge(tr[p*2],tr[p*2+1]);};function<int(int,int,int,int,long long)>get=[&](int p,int l,int r,int L,long long col){if(r<L||tr[p]==0||tr[p]==col)return -1;if(l==r)return l+1;int m=(l+r)/2,z=get(p*2,l,m,L,col);return z!=-1?z:get(p*2+1,m+1,r,L,col);};for(int i=0;i<n;){int j=i;while(j<n&&h[ord[j]]==h[ord[i]])j++;for(int k=i;k<j;k++){int u=ord[k];ans[u]=get(1,0,n-1,u+1,c[u]);}for(int k=i;k<j;k++){int u=ord[k];put(1,0,n-1,u,c[u]);}i=j;}for(int i=0;i<n;i++)cout<<ans[i]<<(i+1==n?'\n':' ');''',
'''v=list(map(int,sys.stdin.buffer.read().split()));n=v[0];h=v[1::2];c=v[2::2];order=sorted(range(n),key=lambda i:-h[i]);tr=[0]*(4*n);ans=[-1]*n
def merge(a,b):return b if not a else a if not b or a==b else -1
def put(p,l,r,i,x):
    if l==r:tr[p]=x;return
    m=(l+r)//2
    if i<=m:put(2*p,l,m,i,x)
    else:put(2*p+1,m+1,r,i,x)
    tr[p]=merge(tr[2*p],tr[2*p+1])
def get(p,l,r,L,col):
    if r<L or tr[p]==0 or tr[p]==col:return -1
    if l==r:return l+1
    m=(l+r)//2;z=get(2*p,l,m,L,col)
    return z if z!=-1 else get(2*p+1,m+1,r,L,col)
i=0
while i<n:
    j=i
    while j<n and h[order[j]]==h[order[i]]:j+=1
    for u in order[i:j]:ans[u]=get(1,0,n-1,u+1,c[u])
    for u in order[i:j]:put(1,0,n-1,u,c[u])
    i=j
print(*ans)''',T(('範例第一塔高3色1，右方第二塔高5但同色。',['3/1','5/1','4/2'],'跳過第二塔'),('第三塔高4色2，是第一個同時較高且異色的塔。',['第三塔'],'答案3'),('第二塔右方的第四塔雖高6仍同色，需到第五塔高7色2。',['第五塔'],'答案5')))

add(439,'data-structures','hard','不同種類邊界與前綴最小值佇列','對每個右端，以種類計數雙指標縮左端，直到種類數剛好少於 K；所有曾移出的起點都是至少 K 種的合法起點。|長度≤L 又要求起點不早於右端-L+1，因此合法前綴索引形成一個左右端都單調前進的區間。|把新合法前綴和值加入遞增單調佇列，過期索引從前端刪除；以目前前綴和減去佇列最小值求最大收益。負收益也可正確處理。','時間 O(N)，字典為期望常數；空間 O(N)。','不能因收益為負而用一般最大窗；必須至少 K 種且區間非空。',
'''int n,L,K;cin>>n>>L>>K;vector<long long>t(n),p(n+1);for(int i=0;i<n;i++){long long x;cin>>t[i]>>x;p[i+1]=p[i]+x;}unordered_map<long long,int>cnt;int kinds=0,l=0,added=0;deque<int>dq;long long ans=LLONG_MIN;for(int r=0;r<n;r++){if(++cnt[t[r]]==1)kinds++;while(kinds>=K){if(--cnt[t[l]]==0)kinds--;l++;}while(added<l){while(!dq.empty()&&p[dq.back()]>=p[added])dq.pop_back();dq.push_back(added++);}while(!dq.empty()&&dq.front()<r+1-L)dq.pop_front();if(!dq.empty())ans=max(ans,p[r+1]-p[dq.front()]);}if(ans==LLONG_MIN)cout<<"IMPOSSIBLE\n";else cout<<ans<<'\n';''',
'''from collections import defaultdict,deque
v=list(map(int,sys.stdin.buffer.read().split()));n,L,K=v[:3];t=v[3::2];a=v[4::2];p=[0]
for x in a:p.append(p[-1]+x)
cnt=defaultdict(int);kinds=l=added=0;dq=deque();ans=None
for r in range(n):
    cnt[t[r]]+=1;kinds+=cnt[t[r]]==1
    while kinds>=K:
        cnt[t[l]]-=1;kinds-=cnt[t[l]]==0;l+=1
    while added<l:
        while dq and p[dq[-1]]>=p[added]:dq.pop()
        dq.append(added);added+=1
    while dq and dq[0]<r+1-L:dq.popleft()
    if dq:
        x=p[r+1]-p[dq[0]];ans=x if ans is None else max(ans,x)
print('IMPOSSIBLE' if ans is None else ans)''',T(('範例 L=3、K=2，前3件收益4、-3、5，總和6。',['1:4','2:-3','1:5'],6),('第3、4件種類1、3，收益5+2=7。',['1:5','3:2'],7),('加第5件收益-1後變6，故最佳保留7。',['1:5','3:2'],7)))

add(440,'search','hard','二分容量與最長合法前綴貪心','固定容量 C，由左到右盡可能把貨放入當前批，若再放會超重或多於 D 種，就開新批。|非負重量使合法批次的子區間仍合法；第一批越長不會增加剩下所需批數，可交換批界證明貪心使用最少批數。|容量越大可行性不會下降，先檢查總重量容量是否能在 K 批完成；若連此時都不行則種類限制無解。否則二分 [最大單重,總重] 的首個可行值。','時間 O(N log(Σw+1))，空間 O(N)。','零重量也受種類數限制；不是保證任意大容量都能在 K 批完成。',
'''int n,K,D;cin>>n>>K>>D;vector<long long>t(n),w(n);long long lo=0,hi=0;for(int i=0;i<n;i++){cin>>t[i]>>w[i];lo=max(lo,w[i]);hi+=w[i];}auto ok=[&](long long C){int batches=1;long long s=0;unordered_set<long long>types;for(int i=0;i<n;i++){if(w[i]>C)return false;if(s+w[i]>C||(!types.count(t[i])&&(int)types.size()==D)){batches++;types.clear();s=0;}types.insert(t[i]);s+=w[i];}return batches<=K;};if(!ok(hi)){cout<<-1<<'\n';return 0;}while(lo<hi){long long mid=(lo+hi)/2;if(ok(mid))hi=mid;else lo=mid+1;}cout<<lo<<'\n';''',
'''v=list(map(int,sys.stdin.buffer.read().split()));n,K,D=v[:3];a=list(zip(v[3::2],v[4::2]))
def ok(C):
    batches=1;s=0;types=set()
    for t,w in a:
        if w>C:return False
        if s+w>C or t not in types and len(types)==D:batches+=1;s=0;types.clear()
        types.add(t);s+=w
    return batches<=K
lo=max(w for t,w in a);hi=sum(w for t,w in a)
if not ok(hi):print(-1)
else:
    while lo<hi:
        mid=(lo+hi)//2
        if ok(mid):hi=mid
        else:lo=mid+1
    print(lo)''',T(('範例重量2、3、1、2、2，K=3、D=2。',[2,3,1,2,2],'試容量3'),('容量3貪心分成 [2]、[3]、[1,2]、[2]，需4批。',['2','3','1+2','2'],'不可行'),('容量4可分 [2]、[3,1]、[2,2]，只需3批。',['2','3+1','2+2'],4)))

add(441,'strings','medium','轉色前綴與端點字母分組','令 P[i] 為從第一個字元到 i 的轉色數，則片段 [l,r] 的轉色數為 P[r]-P[l]。|固定右端 r，需要先前或當前的起點 l 滿足 P[l]=P[r]-K，且 S[l]=S[r]。|字典記錄每個 (P[l],S[l]) 起點的份數；先加入當前起點再查詢，可正確包含 K=0 的單字元片段。','C++有序map時間O(N log N)，Python字典期望O(N)；空間O(N)。','前綴應配起點位置的轉色數，不是起點前一位；K=0 可包含多字元同色段。',
'''int n,K;string s;cin>>n>>K>>s;map<pair<int,char>,long long>cnt;long long ans=0;int p=0;for(int i=0;i<n;i++){if(i&&s[i]!=s[i-1])p++;cnt[{p,s[i]}]++;ans+=cnt[{p-K,s[i]}];}cout<<ans<<'\n';''',
'''from collections import defaultdict
v=sys.stdin.read().split();n,K=map(int,v[:2]);s=v[2];cnt=defaultdict(int);p=ans=0
for i,c in enumerate(s):
    p+=i>0 and c!=s[i-1];cnt[p,c]+=1;ans+=cnt[p-K,c]
print(ans)''',T(('abaca 的轉色前綴為0、1、2、3、4。',[0,1,2,3,4],'K=2'),('右端第3字 a，可與第1字 a 配成 aba。',['aba'],1),('右端第5字 a，可與第3字 a 配成 aca，總共2。',['aba','aca'],2)))

add(442,'number-theory','hard','平方奇偶向量與線性基底','把每個 a≤70 的各質因數指數奇偶編成 19 位遮罩，再加一個永遠為 1 的第20位，代表選取數量的奇偶。|一組位置乘積為平方且數量偶數，等價於所選向量異或和為 0。用 XOR 線性基底求所有 N 個向量的秩 r。|線性映射從 N 維二元選擇空間到向量空間，零空間維度為 N-r，所以零異或有 2^(N-r) 組；扣掉空集合即答案。','時間 O(N×20+70×19)，空間 O(N+20)，其中 N 是讀取儲存；基底本身 O(20)。','數值 1 的質因數遮罩為0，但仍須設選取奇偶位；不能只數平方乘積而忘記偶數枚。',
'''int n;cin>>n;vector<int>pr;for(int x=2;x<=70;x++){bool ok=1;for(int d=2;d*d<=x;d++)if(x%d==0)ok=0;if(ok)pr.push_back(x);}int basis[20]={},rank=0;for(int i=0;i<n;i++){int x;cin>>x;int mask=1<<19;for(int j=0;j<(int)pr.size();j++)while(x%pr[j]==0){mask^=1<<j;x/=pr[j];}for(int b=19;b>=0;b--)if(mask>>b&1){if(basis[b])mask^=basis[b];else{basis[b]=mask;rank++;break;}}}long long a=2,r=1,e=n-rank,M=1000000007;while(e){if(e&1)r=r*a%M;a=a*a%M;e>>=1;}cout<<(r+M-1)%M<<'\n';''',
'''v=list(map(int,sys.stdin.buffer.read().split()));n=v[0];pr=[]
for x in range(2,71):
    if all(x%d for d in range(2,int(x**0.5)+1)):pr.append(x)
basis=[0]*20;rank=0
for x in v[1:]:
    mask=1<<19
    for j,p in enumerate(pr):
        while x%p==0:mask^=1<<j;x//=p
    for b in range(19,-1,-1):
        if mask>>b&1:
            if basis[b]:mask^=basis[b]
            else:basis[b]=mask;rank+=1;break
print((pow(2,n-rank,1000000007)-1)%1000000007)''',T(('輸入2、2、3，前兩個向量相同，第三個獨立。',['2','2','3'],'N=3，秩2'),('零空間維度1，有空集合與選前兩位置兩種。',['∅','{1,2}'],2),('扣掉空集合，2×2=4且數量2為偶數，答案1。',['{1,2}'],1)))
checkpoint()

def public_smoke():
    if sys.platform=='win32':raise SystemExit('Use WSL kali-linux or Linux: never compile or run Windows C++ binaries.')
    import concurrent.futures
    def one(lesson):
        code=lesson['code'];d=pathlib.Path(tempfile.mkdtemp(prefix=code+'-',dir='/tmp'))
        (d/'main.cpp').write_text(lesson['cpp']);(d/'main.py').write_text(lesson['python'])
        p=subprocess.run(['g++','-std=c++17','-O2',str(d/'main.cpp'),'-o',str(d/'main')],capture_output=True,text=True,timeout=90)
        if p.returncode:return code,'compile',p.stderr[:1200]
        for lang,cmd in [('cpp',[str(d/'main')]),('python',['python3',str(d/'main.py')])]:
            for sample in INPUT[code]['samples']:
                try:p=subprocess.run(cmd,input=sample['input'],capture_output=True,text=True,timeout=8)
                except subprocess.TimeoutExpired:return code,lang,'timeout'
                if p.returncode or p.stdout.split()!=sample['output'].split():return code,lang,p.stderr[:1000] or repr(p.stdout)+' != '+repr(sample['output'])
        return code,'PASS',''
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
        results=list(pool.map(one,LESSONS))
    print(json.dumps(results,ensure_ascii=False),flush=True)

add(443,'geometry','medium','同色對角點枚舉','交錯色矩形的對角點顏色相同，相鄰角顏色相反。|枚舉每個同色、x與y皆不同的點對作對角線，檢查另外兩角是否存在且為另一色，再檢查 |Δx|×|Δy|≥A。|每個合法矩形的兩條對角線都會通過檢查，因此累計後除二。用座標對應表查找另外兩角，C++有序表為O(log N)，Python字典期望O(1)。','期望時間 O(N²)，空間 O(N)。','A=0 仍要求非退化；只檢查兩點異色會選錯對角條件。',
'''int n;long long A;cin>>n>>A;vector<array<long long,3>>p(n);map<pair<long long,long long>,int>c;for(auto&v:p){cin>>v[0]>>v[1]>>v[2];c[{v[0],v[1]}]=v[2];}long long ans=0;for(int i=0;i<n;i++)for(int j=0;j<i;j++){auto[x,y,t]=p[i];auto[u,v,z]=p[j];if(t!=z||x==u||y==v||llabs(x-u)*llabs(y-v)<A)continue;auto a=c.find({x,v}),b=c.find({u,y});if(a!=c.end()&&b!=c.end()&&a->second!=t&&b->second!=t)ans++;}cout<<ans/2<<'\n';''',
'''v=list(map(int,sys.stdin.buffer.read().split()));n,A=v[:2];p=[tuple(v[i:i+3]) for i in range(2,len(v),3)];c={(x,y):t for x,y,t in p};ans=0
for i,(x,y,t) in enumerate(p):
    for u,w,z in p[:i]:
        if t==z and x!=u and y!=w and abs(x-u)*abs(y-w)>=A and c.get((x,w))==1-t and c.get((u,y))==1-t:ans+=1
print(ans//2)''',T(('四角 (0,0)色0、(3,0)色1、(0,2)色1、(3,2)色0。',['0 1','1 0'],'面積6'),('枚舉色0對角線可找到完整矩形。',['(0,0)↔(3,2)'],1),('枚舉色1對角線再計一次，除二後一個。',['(0,2)↔(3,0)'],1)))
# The C++ coordinate map uses logarithmic lookup.
LESSONS[-1]['complexity']='C++ 時間 O(N² log N)，Python 期望 O(N²)；空間 O(N)，Python 切片暫存最多 O(N)。'

add(444,'data-structures','medium','Mo 演算法與次數跨越門檻','把查詢依左端區塊、右端交錯排序，使移動端點的總次數受控。|維護目前區間每種類頻率與達到 F 的種類數；加入使頻率從 F-1 變 F 時答案加一，移出使 F 變 F-1 時減一。|按排序後的查詢調整四個端點，再把答案存回原次序；不需每次重新掃描區間。','時間 O((N+Q)√N)，空間 O(N+Q)。','只在跨門檻時增減，頻率超過 F 不會再重複加；F=N+1 時答案皆0。',
'''int n,q,F;cin>>n>>q>>F;vector<long long>a(n),s;for(auto&x:a)cin>>x;s=a;sort(s.begin(),s.end());s.erase(unique(s.begin(),s.end()),s.end());vector<int>b(n);for(int i=0;i<n;i++)b[i]=lower_bound(s.begin(),s.end(),a[i])-s.begin();int B=max(1,(int)sqrt(n));vector<array<int,3>>qs(q);for(int i=0;i<q;i++){cin>>qs[i][0]>>qs[i][1];--qs[i][0];qs[i][2]=i;}sort(qs.begin(),qs.end(),[&](auto a,auto b){if(a[0]/B!=b[0]/B)return a[0]/B<b[0]/B;return (a[0]/B)%2?a[1]>b[1]:a[1]<b[1];});vector<int>cnt(s.size()),ans(q);int l=0,r=0,res=0;auto add=[&](int x){if(++cnt[b[x]]==F)res++;};auto del=[&](int x){if(cnt[b[x]]--==F)res--;};for(auto[L,R,i]:qs){while(l>L)add(--l);while(r<R)add(r++);while(l<L)del(l++);while(r>R)del(--r);ans[i]=res;}for(int x:ans)cout<<x<<'\n';''',
'''v=list(map(int,sys.stdin.buffer.read().split()));n,q,F=v[:3];a=v[3:3+n];ids={x:i for i,x in enumerate(set(a))};a=[ids[x] for x in a];B=max(1,int(n**0.5));qs=[(v[3+n+2*i]-1,v[4+n+2*i],i) for i in range(q)];qs.sort(key=lambda x:(x[0]//B,x[1] if x[0]//B%2==0 else -x[1]));cnt=[0]*len(ids);l=r=res=0;ans=[0]*q
def add(i):
    global res
    cnt[a[i]]+=1
    if cnt[a[i]]==F:res+=1
def delete(i):
    global res
    if cnt[a[i]]==F:res-=1
    cnt[a[i]]-=1
for L,R,i in qs:
    while l>L:l-=1;add(l)
    while r<R:add(r);r+=1
    while l<L:delete(l);l+=1
    while r>R:r-=1;delete(r)
    ans[i]=res
print('\n'.join(map(str,ans)))''',T(('種類1、2、1、3、2、2、3，F=2。',[1,2,1,3,2,2,3],'全段'),('全段頻率為1:2、2:3、3:2，共3種達標。',['1:2','2:3','3:2'],3),('改查 [2,4]，只有2、1、3，各出現1次。',[2,1,3],0)))

add(445,'data-structures','medium','線性函數係數差分','更新 b+(i-l)d 可改寫成 i×d+(b-l×d)。|分別對斜率 d 與常數 b-l d 做區間差分：在 l 加入，在 r+1 移除。|最後沿位置做兩個前綴和，取得該格所有更新合計斜率 D 與常數 B，結果就是 a[i]+iD+B。線性相加保證與逐次更新完全相同。','時間 O(N+M)，空間 O(N+M)，包含讀取操作；C++ 可串流操作只需 O(N)。','i 使用1起算；r=N 時也要預留 N+1 的差分格，計算用64位。',
'''int n,m;cin>>n>>m;vector<long long>a(n+1),d(n+2),b(n+2);for(int i=1;i<=n;i++)cin>>a[i];while(m--){int l,r;long long x,y;cin>>l>>r>>x>>y;long long c=x-l*y;d[l]+=y;d[r+1]-=y;b[l]+=c;b[r+1]-=c;}long long D=0,B=0;for(int i=1;i<=n;i++){D+=d[i];B+=b[i];cout<<a[i]+i*D+B<<(i==n?'\n':' ');}''',
'''v=list(map(int,sys.stdin.buffer.read().split()));n,m=v[:2];a=v[2:2+n];d=[0]*(n+2);b=d.copy()
for j in range(2+n,len(v),4):
    l,r,x,y=v[j:j+4];c=x-l*y;d[l]+=y;d[r+1]-=y;b[l]+=c;b[r+1]-=c
D=B=0;out=[]
for i in range(1,n+1):D+=d[i];B+=b[i];out.append(str(a[i-1]+i*D+B))
print(' '.join(out))''',T(('五格初始全0，更新 [2,4] 首項3、公差2。',[0,3,5,7,0],'一次更新'),('第二次 [3,5] 首項-1、公差-1。',[0,0,-1,-2,-3],'第二更新量'),('逐格相加得到0、3、4、5、-3。',[0,3,4,5,-3],'完成')))

add(446,'data-structures','medium','固定窗總和與雙單調佇列','滑動長度 K 的窗，維護總和以及單調遞增、遞減的索引佇列，前端分別為最小、最大值。|每次移右端，移除佇列中被新值支配的尾端，再移除超過窗左界的前端。|窗分數為 sum-min-max，兩者即使相等仍各減一次。只在分數嚴格更大時更新答案，保留最早左端。','時間 O(N)，空間 O(N)，佇列最多 O(K)。','刪的是兩筆不同評分，相等仍減兩次；全負數需負無限初始化。',
'''int n,K;cin>>n>>K;vector<long long>a(n);for(auto&x:a)cin>>x;deque<int>mn,mx;long long s=0,best=LLONG_MIN;int pos=0;for(int i=0;i<n;i++){s+=a[i];if(i>=K)s-=a[i-K];while(!mn.empty()&&a[mn.back()]>=a[i])mn.pop_back();while(!mx.empty()&&a[mx.back()]<=a[i])mx.pop_back();mn.push_back(i);mx.push_back(i);while(mn.front()<=i-K)mn.pop_front();while(mx.front()<=i-K)mx.pop_front();if(i>=K-1){long long z=s-a[mn.front()]-a[mx.front()];if(z>best){best=z;pos=i-K+2;}}}cout<<pos<<' '<<best<<'\n';''',
'''from collections import deque
v=list(map(int,sys.stdin.buffer.read().split()));n,K=v[:2];a=v[2:];mn=deque();mx=deque();s=0;best=None;pos=0
for i,x in enumerate(a):
    s+=x
    if i>=K:s-=a[i-K]
    while mn and a[mn[-1]]>=x:mn.pop()
    while mx and a[mx[-1]]<=x:mx.pop()
    mn.append(i);mx.append(i)
    while mn[0]<=i-K:mn.popleft()
    while mx[0]<=i-K:mx.popleft()
    if i>=K-1:
        z=s-a[mn[0]]-a[mx[0]]
        if best is None or z>best:best=z;pos=i-K+2
print(pos,best)''',T(('1、9、2，刪最小1與最大9，剩2。',[1,9,2],'左端1，分數2'),('9、2、3，刪2與9，剩3，更新左端2。',[9,2,3],'左端2，分數3'),('2、3、8，剩3與最佳相同，保留較早左端2。',[2,3,8],'2 3')))

add(447,'dp','hard','依末種類分類的轉場排程','將申請依結束時間排序，各種類的結束時間座標各建最大值樹狀陣列。|處理種類 b、開始 s 的申請時，對每種前種類 a 查結束時間≤s-g[a][b] 的最大收益；取所有前種類最大值與0，再加本次收益。|更新到種類 b 的結束時間。轉場非負且時段非空，任何可接前驅都已先處理，這是依時間的 DAG 最長路。','時間 O(NT log N)，空間 O(N+T²)。','轉場 g[a][b] 有方向，不能交換 a、b；第一件不付轉場時間。',
'''int n,T;cin>>n>>T;vector<vector<long long>>g(T,vector<long long>(T));for(auto&r:g)for(auto&x:r)cin>>x;vector<array<long long,4>>a(n);vector<vector<long long>>xs(T),f(T);for(auto&v:a){cin>>v[0]>>v[1]>>v[2]>>v[3];--v[2];xs[v[2]].push_back(v[1]);}for(int c=0;c<T;c++){sort(xs[c].begin(),xs[c].end());xs[c].erase(unique(xs[c].begin(),xs[c].end()),xs[c].end());f[c].resize(xs[c].size()+1);}sort(a.begin(),a.end(),[](auto x,auto y){return x[1]<y[1];});long long ans=0;for(auto[s,e,c,v]:a){long long best=0;for(int t=0;t<T;t++)for(int i=upper_bound(xs[t].begin(),xs[t].end(),s-g[t][c])-xs[t].begin();i;i-=i&-i)best=max(best,f[t][i]);best+=v;ans=max(ans,best);for(int i=lower_bound(xs[c].begin(),xs[c].end(),e)-xs[c].begin()+1;i<(int)f[c].size();i+=i&-i)f[c][i]=max(f[c][i],best);}cout<<ans<<'\n';''',
'''from bisect import bisect_left,bisect_right
v=list(map(int,sys.stdin.buffer.read().split()));n,T=v[:2];g=[v[2+i*T:2+(i+1)*T] for i in range(T)];a=[v[i:i+4] for i in range(2+T*T,len(v),4)];xs=[[] for _ in range(T)]
for s,e,c,w in a:xs[c-1].append(e)
xs=[sorted(set(z)) for z in xs];f=[[0]*(len(z)+1) for z in xs];ans=0
for s,e,c,w in sorted(a,key=lambda x:x[1]):
    c-=1;best=0
    for t in range(T):
        i=bisect_right(xs[t],s-g[t][c])
        while i:best=max(best,f[t][i]);i-=i&-i
    best+=w;ans=max(ans,best);i=bisect_left(xs[c],e)+1
    while i<len(f[c]):f[c][i]=max(f[c][i],best);i+=i&-i
print(ans)''',T(('範例種類1→2需轉場3，第一件 [0,2) 之後不能接 [3,4) 種類2。',['1→2 需至5'],'不能接'),('第二件種類2價值7，可接 [4,5) 種類1價值5，因2→1轉場0。',['[3,4)','[4,5)'],12),('取第二、三件達12，比只選第一、三件的10更好。',[7,5],12)))

add(448,'dp','hard','固定第一色的多重集合環排列','枚舉第一個位置的顏色並扣掉一顆，遞迴記剩餘各色數量和上一色。|下一位置只可選與上一色不同且仍有數量的顏色；用記憶化合併相同剩餘狀態。|全部用完時檢查最後色與固定第一色不同。位置編號已固定，不除以旋轉數；同色珠不可區分，每次選色不乘剩餘顆數。','設 P=∏(c_i+1)，C++時間O(M³P)、空間O(MP)；Python因狀態元組複製及儲存，時間O(M⁴P)、空間O(M²P)。遞迴深度O(N)。','最後與第一也相鄰；不能乘 c_i，否則把同色珠當成不同物件。',
'''int m;cin>>m;vector<int>c(m),base(m);int S=1;for(int i=0;i<m;i++){cin>>c[i];base[i]=S;S*=c[i]+1;}int M=1000000007;long long ans=0;for(int first=0;first<m;first++){vector<int>memo(S*m,-1);function<int(int,int)>f=[&](int state,int last){if(state==0)return int(last!=first);int&res=memo[state*m+last];if(res!=-1)return res;long long z=0;for(int t=0;t<m;t++)if(t!=last&&(state/base[t])%(c[t]+1))z+=f(state-base[t],t);return res=z%M;};int state=0;for(int i=0;i<m;i++)state+=c[i]*base[i];ans+=f(state-base[first],first);}cout<<ans%M<<'\n';''',
'''from functools import lru_cache
v=list(map(int,sys.stdin.buffer.read().split()));m=v[0];c=v[1:];M=1000000007;ans=0
for first in range(m):
    @lru_cache(None)
    def f(rem,last):
        if not any(rem):return int(last!=first)
        z=0
        for t in range(m):
            if t==last or not rem[t]:continue
            a=list(rem);a[t]-=1;z+=f(tuple(a),t)
        return z%M
    rem=c.copy();rem[first]-=1;ans+=f(tuple(rem),first)
    f.cache_clear()
print(ans%M)''',T(('教學例兩色各2顆，位置固定1到4。',['0','0','1','1'],'共4顆'),('第一位0時只能0101，環尾1與環首0不同。',['0','1','0','1'],1),('第一位1時只能1010，合計2種，不除旋轉。',['1','0','1','0'],2)))

add(449,'geometry','medium','藍點作錨點的無向斜率分組','逐一以藍點作錨點，計算它到所有紅點的方向 (dx,dy)。|以 gcd(|dx|,|dy|) 約分，再固定符號，使正反方向視為同一直線。相同方向鍵的紅點兩兩搭配，都與此藍點共線。|每組大小 c 貢獻 c(c-1)/2；每組三點恰有一個藍點，因此不重複。','時間 O(N² log C)，C 為座標差上界；空間 O(N)。','兩紅點可在藍點相反方向，必須把正反方向合為同一鍵；不能用浮點斜率。',
'''int n;cin>>n;vector<pair<long long,long long>>r,b;while(n--){long long x,y;int c;cin>>x>>y>>c;(c?r:b).push_back({x,y});}long long ans=0;for(auto[x,y]:b){map<pair<long long,long long>,int>cnt;for(auto[u,v]:r){long long dx=u-x,dy=v-y,g=gcd(llabs(dx),llabs(dy));dx/=g;dy/=g;if(dx<0||(dx==0&&dy<0)){dx=-dx;dy=-dy;}ans+=cnt[{dx,dy}]++;}}cout<<ans<<'\n';''',
'''from math import gcd
v=list(map(int,sys.stdin.buffer.read().split()));r=[];b=[]
for i in range(1,len(v),3):
    x,y,c=v[i:i+3];(r if c else b).append((x,y))
ans=0
for x,y in b:
    cnt={}
    for u,w in r:
        dx,dy=u-x,w-y;g=gcd(abs(dx),abs(dy));dx//=g;dy//=g
        if dx<0 or dx==0 and dy<0:dx=-dx;dy=-dy
        z=(dx,dy);ans+=cnt.get(z,0);cnt[z]=cnt.get(z,0)+1
print(ans)''',T(('紅點 (0,0)、(1,1)，藍點 (2,2)、(1,0)。',['紅(0,0)','紅(1,1)'],'兩紅'),('藍點 (2,2) 到兩紅點方向約分都為 (1,1)。',['(1,1)','(1,1)'],1),('藍點 (1,0) 方向不同，不再新增。',['水平','垂直'],1)))

add(450,'data-structures','medium','字母奇偶 XOR 與雙迴文條件','一組字母可排成迴文，等價於奇數次字母最多一種。分兩組時，因此原區間的奇數次字母最多兩種是必要條件。|長度≥2 且奇數種類≤2 亦充分：兩奇數分給兩組作中心；一奇數可獨立成一字，其餘成迴文；全偶數可拆出同字兩個單字中心。|樹狀陣列維護每字母對應位元的 XOR。單點換字異或舊、新遮罩，查詢兩前綴 XOR 後數1位數，並檢查長度。','時間 O((N+Q) log N)，空間 O(N+Q)，操作可串流時 O(N)。','兩組必須非空，所以長度1永遠 NO；題目允許重排，並非切成兩段。',
'''int n,q;string s;cin>>n>>q>>s;vector<int>f(n+1);auto upd=[&](int i,int x){for(;i<=n;i+=i&-i)f[i]^=x;};auto get=[&](int i){int s=0;for(;i;i-=i&-i)s^=f[i];return s;};for(int i=0;i<n;i++)upd(i+1,1<<(s[i]-'a'));while(q--){int t,l;cin>>t>>l;if(t==1){char c;cin>>c;upd(l,(1<<(s[l-1]-'a'))^(1<<(c-'a')));s[l-1]=c;}else{int r;cin>>r;int mask=get(r)^get(l-1);cout<<(r-l+1>=2&&__builtin_popcount((unsigned)mask)<=2?"YES":"NO")<<'\n';}}''',
'''lines=sys.stdin.read().splitlines();n,q=map(int,lines[0].split());s=list(lines[1]);f=[0]*(n+1)
def upd(i,x):
    while i<=n:f[i]^=x;i+=i&-i
def get(i):
    x=0
    while i:x^=f[i];i-=i&-i
    return x
for i,c in enumerate(s,1):upd(i,1<<(ord(c)-97))
out=[]
for line in lines[2:]:
    t,l,r=line.split();l=int(l)
    if t=='1':upd(l,(1<<(ord(s[l-1])-97))^(1<<(ord(r)-97)));s[l-1]=r
    else:
        r=int(r);out.append('YES' if r-l+1>=2 and (get(r)^get(l-1)).bit_count()<=2 else 'NO')
print('\n'.join(out))''',T(('abc 有三種奇數字母，兩組不夠放三個中心。',['a','b','c'],'NO'),('abca 中只有 b、c 為奇數，可分 aba 與 c。',['aba','c'],'YES'),('單字元 a 無法分兩個非空組。',['a'],'NO')))

add(451,'number-theory','hard','奇偶位置的 Möbius 互質計數','把奇數位置與偶數位置的值分別計頻率。|對每個 d，累計兩邊可被 d 整除的值數量 O[d]、E[d]；由互質指示式 Σ_{d|gcd}μ(d)，答案為 Σ μ(d)O[d]E[d]。|一奇一偶的位置對恰好由兩邊各取一次，不需除二；用線性篩求 μ 並按倍數累加頻率。','設 V=max a，時間 O(V log V+N)，空間 O(V+N)。','奇偶是位置而非數值；值1與任何值都互質，不能在篩時漏掉 μ(1)=1。',
'''int n;cin>>n;vector<int>a(n);int V=1;for(auto&x:a){cin>>x;V=max(V,x);}vector<int>o(V+1),e(V+1),mu(V+1),lp(V+1),pr;for(int i=0;i<n;i++)(i%2?e:o)[a[i]]++;mu[1]=1;for(int i=2;i<=V;i++){if(!lp[i]){lp[i]=i;mu[i]=-1;pr.push_back(i);}for(int p:pr){if(1LL*i*p>V)break;lp[i*p]=p;if(i%p==0){mu[i*p]=0;break;}mu[i*p]=-mu[i];}}long long ans=0;for(int d=1;d<=V;d++)if(mu[d]){long long x=0,y=0;for(int j=d;j<=V;j+=d){x+=o[j];y+=e[j];}ans+=mu[d]*x*y;}cout<<ans<<'\n';''',
'''v=list(map(int,sys.stdin.buffer.read().split()));a=v[1:];V=max(a);o=[0]*(V+1);e=o.copy()
for i,x in enumerate(a):(e if i%2 else o)[x]+=1
mu=[0]*(V+1);lp=[0]*(V+1);pr=[];mu[1]=1
for i in range(2,V+1):
    if not lp[i]:lp[i]=i;mu[i]=-1;pr.append(i)
    for p in pr:
        if i*p>V:break
        lp[i*p]=p
        if i%p==0:mu[i*p]=0;break
        mu[i*p]=-mu[i]
ans=0
for d in range(1,V+1):
    if mu[d]:ans+=mu[d]*sum(o[d::d])*sum(e[d::d])
print(ans)''',T(('6、5、10、7、3 的奇位置值為6、10、3，偶位置值5、7。',['6,10,3','5,7'],'共6個跨組對'),('只有10與5不互質；其餘五對最大公因數1。',['10與5'],'排除1'),('6-1=5，每對依位置只計一次。',[5],5)))

add(452,'trees','medium','子樹收支與雙類別計數','以任意根做迭代遍歷，倒序累計每個子樹的收支和與兩類節點數。|切去父子邊後，一邊就是該子樹，另一邊是總集合減子樹。兩邊的兩類數量都大於0時才合法。|合法邊的差為 |total-2×subsum|，遍歷所有非根節點取最小值。使用顯式順序避免長鏈遞迴堆疊溢位。','時間 O(n)，空間 O(n)。','收支可負，不能只找最接近總和一半的正子樹；切分必須兩邊都含兩類。',
'''int n;cin>>n;vector<long long>s(n);vector<array<int,2>>cnt(n);for(int i=0;i<n;i++){int c;cin>>s[i]>>c;cnt[i][c]=1;}vector<vector<int>>g(n);for(int i=1,u,v;i<n;i++){cin>>u>>v;--u;--v;g[u].push_back(v);g[v].push_back(u);}vector<int>p(n,-1),ord={0};p[0]=0;for(int i=0;i<n;i++)for(int v:g[ord[i]])if(v!=p[ord[i]]){p[v]=ord[i];ord.push_back(v);}for(int i=n-1;i;i--){int u=ord[i];s[p[u]]+=s[u];for(int c=0;c<2;c++)cnt[p[u]][c]+=cnt[u][c];}long long ans=LLONG_MAX;for(int u=1;u<n;u++)if(cnt[u][0]&&cnt[u][1]&&cnt[u][0]<cnt[0][0]&&cnt[u][1]<cnt[0][1])ans=min(ans,llabs(s[0]-2*s[u]));cout<<(ans==LLONG_MAX?-1:ans)<<'\n';''',
'''v=list(map(int,sys.stdin.buffer.read().split()));n=v[0];s=v[1:1+2*n:2];colors=v[2:1+2*n:2];cnt=[[int(c==0),int(c==1)] for c in colors];g=[[] for _ in range(n)]
for a,b in zip(v[1+2*n::2],v[2+2*n::2]):a-=1;b-=1;g[a].append(b);g[b].append(a)
p=[-1]*n;p[0]=0;order=[0]
for u in order:
    for w in g[u]:
        if w!=p[u]:p[w]=u;order.append(w)
for u in reversed(order[1:]):
    s[p[u]]+=s[u]
    for c in range(2):cnt[p[u]][c]+=cnt[u][c]
ans=None
for u in range(1,n):
    if 0<cnt[u][0]<cnt[0][0] and 0<cnt[u][1]<cnt[0][1]:
        x=abs(s[0]-2*s[u]);ans=x if ans is None else min(ans,x)
print(-1 if ans is None else ans)''',T(('鏈1–2–3–4，收支2、3、5、6，類別0、1、0、1。',[2,3,5,6],'總和16'),('切2–3時，兩邊類別都完整，和為5與11。',[5,11],6),('切另外兩邊會留下單類單點，無效，答案6。',['2–3'],6)))

add(453,'dp','medium','格點路徑的轉彎及採樣計數','DP 狀態為目前格子、上一步方向、已轉彎數、採樣點數。起點用無方向旗標並先算採樣。|向右或向下到非障礙格時，若舊方向存在且不同就加一轉彎；落點為 * 再加一採樣，超出目標即捨棄。|每條單調路徑有唯一的逐格轉移，抵達終點且兩計數恰好符合才相加；起終點重合時無方向初態自然保留。','時間 O(hwTC)，空間 O(hwTC)；以 T+1、C+1 計算，零目標仍有狀態。','第一步不算轉彎；起終點採樣也算，障礙起點為0。',
'''int h,w,T,C;cin>>h>>w>>T>>C;vector<string>g(h);for(auto&s:g)cin>>s;const int M=1000000007;using Key=tuple<int,int,int>;vector<vector<map<Key,long long>>>dp(h,vector<map<Key,long long>>(w));if(g[0][0]!='#'&&(g[0][0]=='*')<=C)dp[0][0][{2,0,g[0][0]=='*'}]=1;for(int i=0;i<h;i++)for(int j=0;j<w;j++)for(auto[key,ways]:dp[i][j]){auto[d,t,c]=key;for(int nd=0;nd<2;nd++){int x=i+(nd==1),y=j+(nd==0);if(x>=h||y>=w||g[x][y]=='#')continue;int nt=t+(d!=2&&d!=nd),nc=c+(g[x][y]=='*');if(nt<=T&&nc<=C){auto&z=dp[x][y][{nd,nt,nc}];z=(z+ways)%M;}}}long long ans=0;for(auto[key,ways]:dp[h-1][w-1])if(get<1>(key)==T&&get<2>(key)==C)ans=(ans+ways)%M;cout<<ans<<'\n';''',
'''v=sys.stdin.read().split();h,w,T,C=map(int,v[:4]);g=v[4:];M=1000000007;dp=[[{} for _ in range(w)] for _ in range(h)]
if g[0][0]!='#' and int(g[0][0]=='*')<=C:dp[0][0][(2,0,int(g[0][0]=='*'))]=1
for i in range(h):
    for j in range(w):
        for (d,t,c),ways in dp[i][j].items():
            for nd in range(2):
                x=i+(nd==1);y=j+(nd==0)
                if x>=h or y>=w or g[x][y]=='#':continue
                nt=t+int(d!=2 and d!=nd);nc=c+int(g[x][y]=='*')
                if nt<=T and nc<=C:
                    key=(nd,nt,nc);dp[x][y][key]=(dp[x][y].get(key,0)+ways)%M
print(sum(ways for (d,t,c),ways in dp[-1][-1].items() if t==T and c==C)%M)''',T(('教學2×2空板、T=1、C=0，起點尚無方向。',['..','..'],'初態1'),('向右再向下，恰轉一次。',['右','下'],1),('向下再向右也恰轉一次，總共2條。',['下','右'],2)))
LESSONS[-1]['complexity']='C++ 稀疏 map 時間 O(hw(T+1)(C+1) log((T+1)(C+1)))，Python 期望 O(hw(T+1)(C+1))；空間 O(hw(T+1)(C+1))。'
checkpoint()

add(454,'graphs','hard','倒序補邊與帶類別計數的並查集','先把所有會被封閉的邊拿掉，對其餘邊建立並查集。每個分量保存0、1類節點數。|全域服務圈數等於各分量是否同時達 A、B 的指示值總和。合併兩根前扣掉兩個舊指示值，合併後加新指示值。|逆序處理封閉清單：先記當前服務圈數作該次封閉後答案，再補回該邊。最後反序輸出。','時間 O((n+m+q)α(n))，空間 O(n+m+q)。','平行邊依編號封閉，不可按端點全部刪掉；自環或同分量補邊不改計數。',
'''int n,m,q,A,B;cin>>n>>m>>q>>A>>B;vector<int>p(n),sz(n,1),c0(n),c1(n);iota(p.begin(),p.end(),0);for(int i=0,c;i<n;i++){cin>>c;c0[i]=c==0;c1[i]=c==1;}vector<pair<int,int>>e(m);for(auto&[u,v]:e){cin>>u>>v;--u;--v;}vector<int>del(q),removed(m);for(auto&x:del){cin>>x;removed[--x]=1;}function<int(int)>find=[&](int x){return p[x]==x?x:p[x]=find(p[x]);};auto good=[&](int x){return c0[x]>=A&&c1[x]>=B;};int count=0;for(int i=0;i<n;i++)count+=good(i);auto unite=[&](int a,int b){a=find(a);b=find(b);if(a==b)return;if(sz[a]<sz[b])swap(a,b);count-=good(a)+good(b);p[b]=a;sz[a]+=sz[b];c0[a]+=c0[b];c1[a]+=c1[b];count+=good(a);};for(int i=0;i<m;i++)if(!removed[i])unite(e[i].first,e[i].second);vector<int>ans(q);for(int i=q-1;i>=0;i--){ans[i]=count;auto[u,v]=e[del[i]];unite(u,v);}for(int x:ans)cout<<x<<'\n';''',
'''v=list(map(int,sys.stdin.buffer.read().split()));n,m,q,A,B=v[:5];colors=v[5:5+n];e=[(v[i]-1,v[i+1]-1) for i in range(5+n,5+n+2*m,2)];deleted=[x-1 for x in v[5+n+2*m:]];removed=set(deleted);p=list(range(n));sz=[1]*n;c0=[int(x==0) for x in colors];c1=[int(x==1) for x in colors]
def find(x):
    while p[x]!=x:p[x]=p[p[x]];x=p[x]
    return x
def good(x):return c0[x]>=A and c1[x]>=B
count=sum(good(i) for i in range(n))
def unite(a,b):
    global count
    a,b=find(a),find(b)
    if a==b:return
    if sz[a]<sz[b]:a,b=b,a
    count-=good(a)+good(b);p[b]=a;sz[a]+=sz[b];c0[a]+=c0[b];c1[a]+=c1[b];count+=good(a)
for i,(a,b) in enumerate(e):
    if i not in removed:unite(a,b)
ans=[]
for i in reversed(deleted):ans.append(count);unite(*e[i])
print('\n'.join(map(str,reversed(ans))))''',T(('範例刪2–3後，分量 {1,2} 與 {3,4,5} 都有兩類。',['{1,2}','{3,4,5}'],2),('再刪4–5，{3,4} 仍合格，{5}不合格。',['{1,2}','{3,4}','{5}'],2),('再刪1–2，只剩 {3,4} 一個服務圈。',['{1}','{2}','{3,4}','{5}'],1)))

add(455,'trees','hard','樹形獨立集的精確名額背包','以迭代遍歷建立父子關係，倒序合併子樹。每個狀態記選取數 k、根是否選取、是否已含備援。|單節點可不選，或選自身。合併子樹時枚舉兩邊選取數與旗標，若兩個根都選則禁止，其餘收益相加、備援旗標 OR。|每個獨立集在每條父子邊的選取情況唯一，轉移完整且不重複；最後只取恰 K 且已有備援的最佳值。','時間 O(nK²)，空間 O(nK+n)；不可達狀態用負無限。','K=0 不含任何備援，故無解；收益可負，不可把不可達狀態當0。',
'''int n,K;cin>>n>>K;vector<long long>w(n);vector<int>b(n);for(int i=0;i<n;i++)cin>>w[i]>>b[i];vector<vector<int>>g(n);for(int i=1,u,v;i<n;i++){cin>>u>>v;--u;--v;g[u].push_back(v);g[v].push_back(u);}vector<int>p(n,-1),ord={0};p[0]=0;for(int i=0;i<n;i++)for(int v:g[ord[i]])if(v!=p[ord[i]]){p[v]=ord[i];ord.push_back(v);}const long long NEG=-(1LL<<60);using Row=vector<array<long long,4>>;vector<Row>dp(n);for(int z=n-1;z>=0;z--){int u=ord[z];Row cur(min(K,1)+1);for(auto&r:cur)r.fill(NEG);cur[0][0]=0;if(K)cur[1][2+b[u]]=w[u];for(int v:g[u])if(p[v]==u){int maxk=min(K,(int)cur.size()+(int)dp[v].size()-2);Row nd(maxk+1);for(auto&r:nd)r.fill(NEG);for(int i=0;i<(int)cur.size();i++)for(int j=0;j<(int)dp[v].size()&&i+j<=K;j++)for(int a=0;a<4;a++)if(cur[i][a]!=NEG)for(int c=0;c<4;c++)if(dp[v][j][c]!=NEG&&!(a>=2&&c>=2)){int f=(a&2)|((a|c)&1);nd[i+j][f]=max(nd[i+j][f],cur[i][a]+dp[v][j][c]);}cur.swap(nd);}dp[u]=move(cur);}long long ans=K<(int)dp[0].size()?max(dp[0][K][1],dp[0][K][3]):NEG;if(ans==NEG)cout<<"IMPOSSIBLE\n";else cout<<ans<<'\n';''',
'''v=list(map(int,sys.stdin.buffer.read().split()));n,K=v[:2];w=v[2:2+2*n:2];b=v[3:2+2*n:2];g=[[] for _ in range(n)]
for a,c in zip(v[2+2*n::2],v[3+2*n::2]):a-=1;c-=1;g[a].append(c);g[c].append(a)
p=[-1]*n;p[0]=0;order=[0]
for u in order:
    for x in g[u]:
        if x!=p[u]:p[x]=u;order.append(x)
NEG=-10**30;dp=[None]*n
for u in reversed(order):
    cur=[[NEG]*4 for _ in range(min(K,1)+1)];cur[0][0]=0
    if K:cur[1][2+b[u]]=w[u]
    for v in g[u]:
        if p[v]!=u:continue
        nd=[[NEG]*4 for _ in range(min(K,len(cur)+len(dp[v])-2)+1)]
        for i,row in enumerate(cur):
            for j,col in enumerate(dp[v]):
                if i+j>K:break
                for a,x in enumerate(row):
                    if x==NEG:continue
                    for c,y in enumerate(col):
                        if y==NEG or a>=2 and c>=2:continue
                        f=(a&2)|((a|c)&1);nd[i+j][f]=max(nd[i+j][f],x+y)
        cur=nd
    dp[u]=cur
ans=max(dp[0][K][1],dp[0][K][3]) if K<len(dp[0]) else NEG
print('IMPOSSIBLE' if ans==NEG else ans)''',T(('範例唯一備援為節點3，收益4。',['節點3:4'],'必須含3'),('3與1相鄰，不能同選1；可選收益7的節點5。',['3','5'],'互不相鄰'),('恰兩站收益4+7=11。',[4,7],11)))

add(456,'graphs','hard','末邊顏色與破例次數的 Dijkstra','把城市擴展成 (城市,上一邊顏色,已用破例0/1)。起點另設無上一色。|走到新邊顏色 c 時，若與上一色相同就增加一次破例；超過1則不准，否則加通行費進行鬆弛。|所有費用為正，所以 Dijkstra 適用；終點任一合法狀態距離的最小值就是答案。城市可重訪，但狀態最短距離不會無限搜尋。','時間 O((n+m) log n)，空間 O(n+m)。','0,0,0 有兩次同色相鄰，不能當成只破例一段；平行邊與自環都需保留。',
'''int n,m;cin>>n>>m;vector<vector<array<long long,3>>>g(n);while(m--){int u,v,c;long long w;cin>>u>>v>>w>>c;g[u-1].push_back({v-1,w,c});}const long long INF=1LL<<60;vector<long long>d(n*6,INF);using P=pair<long long,int>;priority_queue<P,vector<P>,greater<P>>q;d[4]=0;q.push({0,4});while(!q.empty()){auto[du,s]=q.top();q.pop();if(du!=d[s])continue;int u=s/6,last=(s%6)/2,used=s%2;for(auto[v,w,c]:g[u]){int nu=used+(last==c);if(nu>1)continue;int z=v*6+c*2+nu;if(du+w<d[z]){d[z]=du+w;q.push({d[z],z});}}}long long ans=*min_element(d.begin()+6*(n-1),d.end());cout<<(ans==INF?-1:ans)<<'\n';''',
'''import heapq
v=list(map(int,sys.stdin.buffer.read().split()));n,m=v[:2];g=[[] for _ in range(n)]
for i in range(2,len(v),4):
    u,w,c,t=v[i:i+4];g[u-1].append((w-1,c,t))
INF=10**30;d=[INF]*(n*6);d[4]=0;q=[(0,4)]
while q:
    du,s=heapq.heappop(q)
    if d[s]!=du:continue
    u=s//6;last=s%6//2;used=s%2
    for v,w,c in g[u]:
        nu=used+int(last==c)
        if nu>1:continue
        z=v*6+c*2+nu
        if du+w<d[z]:d[z]=du+w;heapq.heappush(q,(d[z],z))
ans=min(d[6*(n-1):]);print(-1 if ans==INF else ans)''',T(('範例路徑1→2→3→5，顏色0,0,0。',[0,0,0],'破例兩次，非法'),('改走1→2→4→5，顏色0,1,0。',[0,1,0],'破例0次'),('費用2+2+2=6，是合法最短路。',[2,2,2],6)))

add(457,'simulation','easy','帶記憶的雙門檻開關','保存目前是否開啟，初始關閉。|每筆溫度≤L就設開，≥H就設關，中間不改變；更新後若開啟便把記錄數加一。|狀態只依前一狀態與當前讀數轉移，因此逐筆模擬即完整重現所有記錄。','時間 O(N)，Python 讀取 O(N)，C++ 額外 O(1)。','要求記錄中開啟次數，而不是從關變開的切換次數；等號在兩側門檻。',
'''int n,L,H;cin>>n>>L>>H;bool on=false;int ans=0;while(n--){int x;cin>>x;if(x<=L)on=true;else if(x>=H)on=false;ans+=on;}cout<<ans<<'\n';''',
'''v=list(map(int,sys.stdin.buffer.read().split()));n,L,H=v[:3];on=False;ans=0
for x in v[3:]:
    if x<=L:on=True
    elif x>=H:on=False
    ans+=on
print(ans)''',T(('L=2、H=5，讀4維持關，讀2轉開。',[4,2],'開啟記錄1'),('讀3仍開，讀5轉關。',[3,5],'開啟記錄2'),('讀3仍關，讀1轉開，總共3次。',[3,1],3)))

add(458,'data-structures','hard','座標滑動窗與價格樹狀陣列','展品按 x 排序。處理目前點時，把距離超過 D 的先前點移出價格樹狀陣列。|剩餘先前點均滿足座標條件，查價格≤B-p 的數量，再把目前價格加入。|每對恰在較右端點處計一次；相同座標依任意固定順序處理，也仍不重複。價格壓縮後用 upper_bound 包含邊界。','時間 O(N log N)，空間 O(N)。','B-p 可能為負，此時查詢數為0；必須先查再加入，避免與自己配對。',
'''int n;long long D,B;cin>>n>>D>>B;vector<pair<long long,long long>>a(n);vector<long long>p;for(auto&[x,y]:a){cin>>x>>y;p.push_back(y);}sort(a.begin(),a.end());sort(p.begin(),p.end());p.erase(unique(p.begin(),p.end()),p.end());BIT bit(p.size());int l=0;long long ans=0;for(int r=0;r<n;r++){while(a[r].first-a[l].first>D){bit.add(lower_bound(p.begin(),p.end(),a[l].second)-p.begin()+1,-1);l++;}ans+=bit.sum(upper_bound(p.begin(),p.end(),B-a[r].second)-p.begin());bit.add(lower_bound(p.begin(),p.end(),a[r].second)-p.begin()+1,1);}cout<<ans<<'\n';''',
'''from bisect import bisect_left,bisect_right
v=list(map(int,sys.stdin.buffer.read().split()));n,D,B=v[:3];a=sorted(zip(v[3::2],v[4::2]));p=sorted({y for x,y in a});bit=BIT(len(p));l=ans=0
for r,(x,y) in enumerate(a):
    while x-a[l][0]>D:bit.add(bisect_left(p,a[l][1])+1,-1);l+=1
    ans+=bit.sum(bisect_right(p,B-y));bit.add(bisect_left(p,y)+1,1)
print(ans)''',T(('範例 D=3、B=8；前兩點 (0,2)、(2,6) 可配。',['1–2'],1),('加入 (3,3)，只與第一點價格合計5可配。',['1–2','1–3'],2),('加入 (5,1)，第一點太遠，與第二、三點都可配，合計4。',['2–4','3–4'],4)),extra=BITCPP,preamble=BITPY)

add(459,'data-structures','medium','雙單調佇列與非負耗能滑動窗','右端加入一箱，以兩個單調佇列記溫度最大與最小，另記耗能總和。|只要極差>D 或總耗能>B 就移動左端、移除耗能與過期佇列索引。|耗能非負、極差對擴張不減，因此縮到首次合法後，留下的是此右端最長合法段；逐右端取最大長度。','時間 O(N)，空間 O(N)。','可能連單箱都超預算，此時窗為空、答案仍可為0；不能假設溫度已排序。',
'''int n;long long D,B;cin>>n>>D>>B;vector<long long>t(n),c(n);for(int i=0;i<n;i++)cin>>t[i]>>c[i];deque<int>mn,mx;int l=0,ans=0;long long s=0;for(int r=0;r<n;r++){s+=c[r];while(!mn.empty()&&t[mn.back()]>=t[r])mn.pop_back();while(!mx.empty()&&t[mx.back()]<=t[r])mx.pop_back();mn.push_back(r);mx.push_back(r);while(l<=r&&(s>B||t[mx.front()]-t[mn.front()]>D)){s-=c[l++];while(!mn.empty()&&mn.front()<l)mn.pop_front();while(!mx.empty()&&mx.front()<l)mx.pop_front();}ans=max(ans,r-l+1);}cout<<ans<<'\n';''',
'''from collections import deque
v=list(map(int,sys.stdin.buffer.read().split()));n,D,B=v[:3];t=v[3::2];c=v[4::2];mn=deque();mx=deque();l=ans=s=0
for r in range(n):
    s+=c[r]
    while mn and t[mn[-1]]>=t[r]:mn.pop()
    while mx and t[mx[-1]]<=t[r]:mx.pop()
    mn.append(r);mx.append(r)
    while l<=r and (s>B or t[mx[0]]-t[mn[0]]>D):
        s-=c[l];l+=1
        while mn and mn[0]<l:mn.popleft()
        while mx and mx[0]<l:mx.popleft()
    ans=max(ans,r-l+1)
print(ans)''',T(('範例前3箱溫度4、7、5，極差3、耗能7。',[4,7,5],3),('加第四箱溫度8後極差4、耗能8，不合法，移除第一箱。',[7,5,8],3),('再加溫度6耗能1，最後四箱極差3、耗能7，長度4。',[7,5,8,6],4)))

add(460,'data-structures','medium','恰 K 種等於兩個至多計數相減','定義 f(k) 為種類數至多 k 且重量和≤B 的非空區間數，答案為 f(K)-f(K-1)。|計算 f 時維護種類頻率與非負重量總和，右端擴張後把左端移到首次同時符合兩限制。|對此右端，所有從 left 到 right 的起點都合法，共 right-left+1 個。非負重量確保再縮短也不超重。','時間 O(N)，空間 O(N)，字典操作為期望常數。','零重量不影響單調性；K=1 時 f(0)=0，不能漏掉單色片段。',
'''int n,K;long long B;cin>>n>>K>>B;vector<long long>t(n),w(n);for(int i=0;i<n;i++)cin>>t[i]>>w[i];auto f=[&](int k){unordered_map<long long,int>cnt;int kinds=0,l=0;long long s=0,ans=0;for(int r=0;r<n;r++){s+=w[r];if(++cnt[t[r]]==1)kinds++;while(l<=r&&(s>B||kinds>k)){s-=w[l];if(--cnt[t[l]]==0)kinds--;l++;}ans+=r-l+1;}return ans;};cout<<f(K)-f(K-1)<<'\n';''',
'''v=list(map(int,sys.stdin.buffer.read().split()));n,K,B=v[:3];t=v[3::2];w=v[4::2]
def f(k):
    cnt={};kinds=l=s=ans=0
    for r in range(n):
        s+=w[r];cnt[t[r]]=cnt.get(t[r],0)+1;kinds+=cnt[t[r]]==1
        while l<=r and (s>B or kinds>k):
            s-=w[l];cnt[t[l]]-=1;kinds-=cnt[t[l]]==0;l+=1
        ans+=r-l+1
    return ans
print(f(K)-f(K-1))''',T(('範例種類1、2、1、3，重量1、1、2、1，K=2、B=4。',[1,2,1,3],'找恰2種'),('右端2有 [1,2]；右端3有 [1,3]、[2,3]。',['[1,2]','[1,3]','[2,3]'],3),('右端4只有 [3,4] 合法，總共4段。',['[3,4]'],4)))

add(461,'data-structures','medium','雙下限的最短合法滑動窗','維護目前窗的總份量與種類頻率。|每加入右端後，只要總和≥S且種類≥D，就用長度更新答案並移除左端，直到不再合法。|非負份量使擴張不破壞下限；每個右端所有可縮短的合法窗均被檢查，所以不漏最短答案。','時間 O(N)，空間 O(N)，字典期望常數。','S>0，空窗不會被誤計；種類需達下限，不能只看總份量。',
'''int n,D;long long S;cin>>n>>S>>D;vector<long long>t(n),a(n);for(int i=0;i<n;i++)cin>>t[i]>>a[i];unordered_map<long long,int>cnt;int kinds=0,l=0,ans=n+1;long long s=0;for(int r=0;r<n;r++){s+=a[r];if(++cnt[t[r]]==1)kinds++;while(s>=S&&kinds>=D){ans=min(ans,r-l+1);s-=a[l];if(--cnt[t[l]]==0)kinds--;l++;}}cout<<(ans>n?-1:ans)<<'\n';''',
'''v=list(map(int,sys.stdin.buffer.read().split()));n,S,D=v[:3];t=v[3::2];a=v[4::2];cnt={};kinds=l=s=0;ans=n+1
for r in range(n):
    s+=a[r];cnt[t[r]]=cnt.get(t[r],0)+1;kinds+=cnt[t[r]]==1
    while s>=S and kinds>=D:
        ans=min(ans,r-l+1);s-=a[l];cnt[t[l]]-=1;kinds-=cnt[t[l]]==0;l+=1
print(-1 if ans>n else ans)''',T(('範例前3筆為1:2、1:5、2:1，總量8、種類2。',[2,5,1],'長度3'),('刪左端後只剩6，不合法，暫時最佳3。',[5,1],3),('最後三筆1、4、3也總量8且兩類，仍為長度3。',[1,4,3],3)))

add(462,'data-structures','medium','頻率跨零時支付啟用費','維護窗中每類頻率和總成本。加入一件時加其成本，該類原頻率0才另加啟用費。|超預算時持續移左端，減去作品成本；若該類頻率降為0，再扣啟用費。|作品成本及啟用費非負，縮窗不會增加成本。對每右端縮到首次合法，就是該右端最長合法窗。','時間 O(N+T)，空間 O(N+T)。','同種類只付一次啟用費；刪除一件但仍有同類時不能扣啟用費。',
'''int n,T;long long B;cin>>n>>T>>B;vector<long long>f(T+1),t(n),c(n);for(int i=1;i<=T;i++)cin>>f[i];for(int i=0;i<n;i++)cin>>t[i]>>c[i];vector<int>cnt(T+1);long long s=0;int l=0,ans=0;for(int r=0;r<n;r++){s+=c[r];if(cnt[t[r]]++==0)s+=f[t[r]];while(s>B){s-=c[l];if(--cnt[t[l]]==0)s-=f[t[l]];l++;}ans=max(ans,r-l+1);}cout<<ans<<'\n';''',
'''v=list(map(int,sys.stdin.buffer.read().split()));n,T,B=v[:3];f=[0]+v[3:3+T];t=v[3+T::2];c=v[4+T::2];cnt=[0]*(T+1);l=ans=s=0
for r in range(n):
    s+=c[r]
    if cnt[t[r]]==0:s+=f[t[r]]
    cnt[t[r]]+=1
    while s>B:
        s-=c[l];cnt[t[l]]-=1
        if cnt[t[l]]==0:s-=f[t[l]]
        l+=1
    ans=max(ans,r-l+1)
print(ans)''',T(('範例啟用費4、2，每件成本1，預算10。',['種類1費4','種類2費2'],'預算10'),('前4件兩類皆出現，成本4+4+2=10。',[1,1,2,2],4),('第5件加入成本11，需移除左端一件，最大長度仍4。',[1,2,2,1],4)))
checkpoint()

add(463,'basics','easy','基礎價加超額附加費','每件都有基礎價 P，因此先算 P×Q。|超過 K 的 max(0,Q-K) 件各多付 D，總價=P×Q+D×max(0,Q-K)。這與前 K 件及超額分開計價完全相同。','時間 O(1)，記憶體 O(1)。','Q≤K 時附加件數為0，不能直接用 Q-K；乘積使用64位。',
'''long long P,D,K,Q;cin>>P>>D>>K>>Q;cout<<P*Q+D*max(0LL,Q-K)<<'\n';''',
'''P,D,K,Q=map(int,sys.stdin.read().split());print(P*Q+D*max(0,Q-K))''',T(('P=10、D=3、K=4、Q=7，全部基礎價70。',[10,7],70),('超過門檻3件，各多3元。',[3,3],9),('合計70+9=79。',[79],79)))
add(464,'basics','easy','互斥三分支分類','逐個讀長度，小於 L 算短件，大於 H 算長件，其餘為標準件。|三個條件互斥且涵蓋所有長度，每個零件恰被計一次；最後依短、標準、長的順序輸出。','時間 O(N)，Python 讀取 O(N)，C++ 額外 O(1)。','等於 L 或 H 都是標準件，L=H 時也一樣。',
'''int n,L,H;cin>>n>>L>>H;int s=0,m=0,b=0;while(n--){int x;cin>>x;if(x<L)s++;else if(x>H)b++;else m++;}cout<<s<<' '<<m<<' '<<b<<'\n';''',
'''v=list(map(int,sys.stdin.buffer.read().split()));n,L,H=v[:3];cnt=[0,0,0]
for x in v[3:]:cnt[0 if x<L else 2 if x>H else 1]+=1
print(*cnt)''',T(('L=3、H=5，長度2為短件。',[2],'1 0 0'),('長度3、5都在閉區間內。',[3,5],'1 2 0'),('長度6為長件，完成。',[6],'1 2 1')))
add(465,'simulation','easy','相鄰位置交換','先建立長度N的陣列，依序填入編號1到N，代表初始隊列。|每次位置 P<N 就交換陣列 P-1 與 P，P=N 則不動。依輸入順序修改，始終保存目前隊列。','時間 O(N+M)，空間 O(N+M)，C++ 可串流操作為 O(N)。','位置不是人的編號；必須操作當前陣列，且最後位置沒有右鄰。',
'''int n,m;cin>>n>>m;vector<int>a(n);iota(a.begin(),a.end(),1);while(m--){int p;cin>>p;if(p<n)swap(a[p-1],a[p]);}for(int i=0;i<n;i++)cout<<a[i]<<(i+1==n?'\n':' ');''',
'''v=list(map(int,sys.stdin.buffer.read().split()));n,m=v[:2];a=list(range(1,n+1))
for p in v[2:]:
    if p<n:a[p-1],a[p]=a[p],a[p-1]
print(*a)''',T(('初始三人隊列。',[1,2,3],'P=1'),('交換位置1、2。',[2,1,3],'P=3'),('P=N 不動，結果仍2、1、3。',[2,1,3],'完成')))
add(466,'basics','easy','棋盤奇偶座標篩選','逐格讀入，若1起算的列號加行號為偶數，就加進答案。|改用0起算時兩座標各少1，總和少2不改奇偶，因此可直接用 (i+j)%2==0。|每個指定格恰好加一次，其他格不加，故累計就是要求總和。','時間 O(RC)，Python 讀取 O(RC)，C++ 額外 O(1)。','左上角必須計入；元素可負，累計需64位。',
'''int R,C;cin>>R>>C;long long ans=0;for(int i=0;i<R;i++)for(int j=0;j<C;j++){long long x;cin>>x;if((i+j)%2==0)ans+=x;}cout<<ans<<'\n';''',
'''v=list(map(int,sys.stdin.buffer.read().split()));R,C=v[:2];print(sum(v[2+i*C+j] for i in range(R) for j in range(C) if (i+j)%2==0))''',T(('教學2×2格為第一列1、2，第二列3、4。',['1 2','3 4'],'總和0'),('左上角(1,1)的座標和2為偶數，加1。',[1],1),('右下角(2,2)也為偶數，加4，答案5。',[1,4],5)))
add(467,'basics','easy','逐列加總並保留最早最大值','逐列計算元素和，再與目前最佳列比較。|只在新和嚴格更大時更新列號；相同時保留既有較早列。因此掃描後得到最大和、並列時最小編號。','時間 O(RC)，Python 讀取 O(RC)，C++ 額外 O(1)。','所有列和可為負，最佳和不能從0開始；列是由上向下編號。',
'''int R,C;cin>>R>>C;long long best=LLONG_MIN;int pos=0;for(int i=1;i<=R;i++){long long s=0,x;for(int j=0;j<C;j++){cin>>x;s+=x;}if(s>best){best=s;pos=i;}}cout<<pos<<' '<<best<<'\n';''',
'''v=list(map(int,sys.stdin.buffer.read().split()));R,C=v[:2];s=[sum(v[2+i*C:2+(i+1)*C]) for i in range(R)];best=max(s);print(s.index(best)+1,best)''',T(('三列和分別為-3、5、5。',[-3,5,5],'最佳尚未定'),('讀到第二列和5，取代第一列。',[5],'列號2'),('第三列並列不更新，所以輸出2 5。',[5,5],'2 5')))
add(468,'strings','easy','每字母最近一次出現位置','掃描每個字元，若先前出現過，就以目前位置減最近位置更新最小差，再更新最近位置。|同字母若考慮更早的位置，距離只會更大，所以只需最近一次。|未曾找到重複時輸出-1。','時間 O(|S|)，字串 O(|S|)，額外 O(26)。','答案是位置差，不是中間夾住的字元數；相鄰重複距離1。',
'''string s;cin>>s;int last[26];fill(last,last+26,-1);int ans=INT_MAX;for(int i=0;i<(int)s.size();i++){int c=s[i]-'a';if(last[c]>=0)ans=min(ans,i-last[c]);last[c]=i;}cout<<(ans==INT_MAX?-1:ans)<<'\n';''',
'''s=sys.stdin.read().strip();last={};ans=len(s)+1
for i,c in enumerate(s):
    if c in last:ans=min(ans,i-last[c])
    last[c]=i
print(-1 if ans>len(s) else ans)''',T(('教學字串 abac，讀到 a、b。',['a','b'],'尚無重複'),('第三字 a 與第一字 a 距離2，記最佳2。',['a','b','a'],2),('第四字 c 無重複，結果2。',['a','b','a','c'],2)))
add(469,'data-structures','easy','頻率表中的恰兩次種類','先建立每個數值的出現次數。|遍歷頻率表，只將次數等於2的鍵算一次；這恰好對應題目要求的不同值，而不是位置數。','時間 O(N log N)（C++ map），Python 期望 O(N)，空間 O(N)。','出現三次不能算；出現兩次的一個值只加1。',
'''int n;cin>>n;map<int,int>cnt;while(n--){int x;cin>>x;cnt[x]++;}int ans=0;for(auto[x,c]:cnt)ans+=c==2;cout<<ans<<'\n';''',
'''from collections import Counter
v=list(map(int,sys.stdin.buffer.read().split()));print(sum(c==2 for c in Counter(v[1:]).values()))''',T(('讀5、5、7、7、7，頻率表先有5:2。',['5:2'],'候選1種'),('7 最後頻率3，不符合。',['5:2','7:3'],'只取次數2'),('僅值5合格，答案1。',[5],1)))
add(470,'sorting','easy','多條件的字典序比較','每位選手建立排序鍵 (-分數,罰時,編號)。|鍵較小者先：負分數讓高分優先，其後罰時小優先，再比編號。逐筆保留最小鍵，即得排名第一。','時間 O(N)，Python 讀取 O(N)，C++ 額外 O(1)。','同分時先比罰時，再比編號；只比較分數會錯過平手規則。',
'''int n;cin>>n;tuple<int,int,int>best={INT_MAX,INT_MAX,INT_MAX};for(int i=1;i<=n;i++){int s,p;cin>>s>>p;best=min(best,make_tuple(-s,p,i));}cout<<get<2>(best)<<'\n';''',
'''v=list(map(int,sys.stdin.buffer.read().split()));n=v[0];print(min((-v[1+2*i],v[2+2*i],i+1) for i in range(n))[2])''',T(('三位成績 (8,4)、(10,7)、(10,3)。',['8/4','10/7','10/3'],'候選1'),('第二位分數10大於8，暫列第一。',['10/7'],'編號2'),('第三位同分罰時較小，最終編號3。',['10/3'],3)))
add(471,'simulation','easy','成功才扣庫存的順序模擬','逐人檢查需求 q 是否≤目前存量 S。|足夠才扣 q 並增加成功人數；不足時完全不改庫存，仍繼續下一人。|每一步保持「已服務人數及剩餘庫存」為真實狀態，最後輸出即可。','時間 O(N)，Python 輸入 O(N)，C++ 額外 O(1)。','失敗不能扣到負數，也不能停止服務後面較小需求。',
'''int n;long long S;cin>>n>>S;int ans=0;while(n--){long long q;cin>>q;if(q<=S){S-=q;ans++;}}cout<<ans<<' '<<S<<'\n';''',
'''v=list(map(int,sys.stdin.buffer.read().split()));n,S=v[:2];ans=0
for q in v[2:]:
    if q<=S:S-=q;ans+=1
print(ans,S)''',T(('教學庫存5，需求6失敗，仍有5。',[6],'0人，5份'),('下一人需求3成功，剩2。',[3],'1人，2份'),('下一人需求2成功，剩0。',[2],'2 0')))
add(472,'simulation','easy','每一步截斷的容量模擬','每次變化先算 V+d，再截斷為 min(C,max(0,V+d))。|依序把截斷後的值作下一次起點，保持水量始終在 [0,C]。|不能先加總所有變化再只截斷一次，因溢出的水與不足取出的水不會留到下一步。','時間 O(N)，Python 輸入 O(N)，C++ 額外 O(1)。','每次都要截斷；初始V不一定0。',
'''int n;long long C,V;cin>>n>>C>>V;while(n--){long long d;cin>>d;V=min(C,max(0LL,V+d));}cout<<V<<'\n';''',
'''v=list(map(int,sys.stdin.buffer.read().split()));n,C,V=v[:3]
for d in v[3:]:V=min(C,max(0,V+d))
print(V)''',T(('教學C=5、V=3，加4後溢出，截成5。',[3,4],5),('接著取8，水不足，截成0。',[5,-8],0),('最後加2，結果2。',[0,2],2)))
add(473,'simulation','easy','四方向座標累計','由 (0,0) 開始，R使x加1、L使x減1、U使y加1、D使y減1。|依序更新或分別計算兩方向的出現次數差；每一步位移相加就是終點座標。','時間 O(|S|)，字串空間 O(|S|)，額外 O(1)。','上方y增加；不能顛倒x與y輸出順序。',
'''string s;cin>>s;int x=0,y=0;for(char c:s){x+=(c=='R')-(c=='L');y+=(c=='U')-(c=='D');}cout<<x<<' '<<y<<'\n';''',
'''s=sys.stdin.read().strip();print(s.count('R')-s.count('L'),s.count('U')-s.count('D'))''',T(('教學指令 RUL，先R到 (1,0)。',['R'],'1 0'),('再U到 (1,1)。',['R','U'],'1 1'),('最後L到 (0,1)。',['R','U','L'],'0 1')))
add(474,'strings','easy','固定字元映射','建立母音 a、e、i、o、u 到1、2、3、4、5的對應。|每個位置獨立查表，母音換成數字，其餘保留原字母，按原順序串接。每個字元只決定自己的輸出，不影響後面位置。','時間 O(|S|)，輸入及結果 O(|S|)。','只換小寫母音；替換結果仍是一條字串。',
'''string s,vo="aeiou";cin>>s;for(char&c:s){auto p=vo.find(c);if(p!=string::npos)c='1'+p;}cout<<s<<'\n';''',
'''s=sys.stdin.read().strip();table=str.maketrans('aeiou','12345');print(s.translate(table))''',T(('教學單字 code，c不是母音。',['c'],'c'),('o映到4，d保留。',['c','4','d'],'c4d'),('e映到2，完成c4d2。',['c','4','d','2'],'c4d2')))
add(475,'strings','easy','位置加權的模26循環','把字母轉成0到25。第i個位置從1開始，位移為 K×i，結果編號為 (原編號+(K%26)×i)%26。|26格形成一圈，所以減去任意26倍都不改終點；每個位置各自轉換再串接。','時間 O(|S|)，輸入與結果 O(|S|)。','i從1起算；K可很大，先取模避免窄整數乘法溢位。',
'''string s;long long k;cin>>s>>k;k%=26;for(int i=0;i<(int)s.size();i++)s[i]='a'+(s[i]-'a'+k*(i+1))%26;cout<<s<<'\n';''',
'''s,k=sys.stdin.read().split();k=int(k)%26;print(''.join(chr(97+(ord(c)-97+k*i)%26) for i,c in enumerate(s,1)))''',T(('教學字串 az，K=1，第一位a移1格。',['a→b'],'b'),('第二位z移2格：z→a→b。',['z→a→b'],'b'),('串接得到bb。',['b','b'],'bb')))
add(476,'strings','easy','每字母獨立的前綴頻率奇偶','每個字母各自維護出現次數，讀到時先加一。|新的次數為奇數就保留，偶數就略過。由於次數包括目前位置，這正好保留每種字母的第1、3、5…次出現。','時間 O(|S|)，輸入及輸出 O(|S|)，頻率表 O(26)。','不是依位置奇偶篩選；不同字母各有自己的計數。',
'''string s,out;cin>>s;int cnt[26]={};for(char c:s)if(++cnt[c-'a']%2)out+=c;cout<<out<<'\n';''',
'''s=sys.stdin.read().strip();cnt={};out=[]
for c in s:
    cnt[c]=cnt.get(c,0)+1
    if cnt[c]%2:out.append(c)
print(''.join(out))''',T(('abacaba，前兩字a、b各首次，保留ab。',['a','b'],'ab'),('第三字a第2次略過，第四字c首次保留。',['a略','c留'],'abc'),('第五字a第3次保留，後面b第2、a第4次略過。',['a留','b略','a略'],'abca')))
add(477,'strings','medium','固定目標字母的至多一次異色滑動窗','枚舉最後統一成哪個字母，共26種。|對固定目標，用雙指標維持窗中非目標字母數≤1；超過就縮左端，直到合法，更新最大長度。|任何能一筆補色的片段都有某個統一字母，必被對應那輪掃到；合法窗也一定能改至多一字成全相同。','時間 O(26|S|)，字串空間 O(|S|)，額外 O(1)。','只能改所選片段的一個位置，不是每種不同字母各改一次；原已全相同也合法。',
'''string s;cin>>s;int ans=0;for(char c='a';c<='z';c++){int l=0,bad=0;for(int r=0;r<(int)s.size();r++){bad+=s[r]!=c;while(bad>1)bad-=s[l++]!=c;ans=max(ans,r-l+1);}}cout<<ans<<'\n';''',
'''s=sys.stdin.read().strip();ans=0
for c in 'abcdefghijklmnopqrstuvwxyz':
    l=bad=0
    for r,x in enumerate(s):
        bad+=x!=c
        while bad>1:bad-=s[l]!=c;l+=1
        ans=max(ans,r-l+1)
print(ans)''',T(('aabaaaca，目標字母a，前6字 aabaaa 只有b異色。',['aabaaa'],6),('再加入c會有b、c兩個異色，必須縮窗。',['aabaaac'],'異色2'),('所有目標字母與右端比較後，最佳是長度6。',['aaaaaa'],6)))
checkpoint()

add(478,'geometry','hard','奇偶覆蓋掃描線與區間翻轉長度','將每個矩形左右邊轉成相同的 y 區間翻轉事件，按 x 排序並壓縮所有 y 邊界。|線段樹維護各 y 段中被奇數次覆蓋的總長度；翻轉一段後 oddLength=整段長度-oddLength，懶標記異或1。|相鄰事件 x 之間覆蓋不變，面積增加 Δx×根的奇覆蓋長度，再套用當前 x 的事件。同 x 寬度0，順序不影響。','時間 O(n log n)，空間 O(n)。','本題是奇數覆蓋而非聯集；兩張相同矩形完全抵銷；壓縮葉代表座標間隔而非點數。',
'''int n;cin>>n;vector<array<long long,3>>ev;vector<long long>ys;for(int i=0;i<n;i++){long long x1,y1,x2,y2;cin>>x1>>y1>>x2>>y2;ev.push_back({x1,y1,y2});ev.push_back({x2,y1,y2});ys.push_back(y1);ys.push_back(y2);}sort(ev.begin(),ev.end());sort(ys.begin(),ys.end());ys.erase(unique(ys.begin(),ys.end()),ys.end());int N=ys.size()-1;vector<long long>len(4*N);vector<int>lazy(4*N);auto flip=[&](int p,int l,int r){len[p]=ys[r+1]-ys[l]-len[p];lazy[p]^=1;};function<void(int,int,int,int,int)>upd=[&](int p,int l,int r,int L,int R){if(r<L||R<l)return;if(L<=l&&r<=R){flip(p,l,r);return;}int m=(l+r)/2;if(lazy[p]){flip(p*2,l,m);flip(p*2+1,m+1,r);lazy[p]=0;}upd(p*2,l,m,L,R);upd(p*2+1,m+1,r,L,R);len[p]=len[p*2]+len[p*2+1];};long long ans=0,last=ev[0][0];for(auto[x,l,r]:ev){ans+=(x-last)*len[1];last=x;int L=lower_bound(ys.begin(),ys.end(),l)-ys.begin(),R=lower_bound(ys.begin(),ys.end(),r)-ys.begin()-1;upd(1,0,N-1,L,R);}cout<<ans<<'\n';''',
'''from bisect import bisect_left
v=list(map(int,sys.stdin.buffer.read().split()));ev=[];ys=[]
for i in range(1,len(v),4):
    x1,y1,x2,y2=v[i:i+4];ev.extend([(x1,y1,y2),(x2,y1,y2)]);ys.extend([y1,y2])
ys=sorted(set(ys));N=len(ys)-1;length=[0]*(4*N);lazy=bytearray(4*N)
def flip(p,l,r):length[p]=ys[r+1]-ys[l]-length[p];lazy[p]^=1
def upd(p,l,r,L,R):
    if r<L or R<l:return
    if L<=l and r<=R:flip(p,l,r);return
    m=(l+r)//2
    if lazy[p]:flip(p*2,l,m);flip(p*2+1,m+1,r);lazy[p]=0
    upd(p*2,l,m,L,R);upd(p*2+1,m+1,r,L,R);length[p]=length[p*2]+length[p*2+1]
ev.sort();last=ev[0][0];ans=0
for x,l,r in ev:
    ans+=(x-last)*length[1];last=x;upd(1,0,N-1,bisect_left(ys,l),bisect_left(ys,r)-1)
print(ans)''',T(('兩矩形 [0,3]×[0,2] 與 [1,4]×[1,3]，各面積6。',[6,6],12),('交集 [1,3]×[1,2] 面積2，被覆蓋兩次不透光。',[2],'扣兩份交集'),('奇覆蓋面積6+6-2×2=8。',[8],8)))

add(479,'dp','medium','數字7出現次數與數字和數位DP','把1到N暫時改成0到N，用與N同長的前導零表示，記錄貼界、已出現7的數量及數字和mod7。|逐位枚舉不超過上界的數字，7才增加次數，所有數字都加到和餘數。前導零不影響這兩項條件，所以不需額外 started 狀態。|最後取7次數恰k、和餘數0的兩貼界狀態總和；k=0時扣掉代表整數0的那條路徑，恢復1到N。','位數d≤19，時間 O(d²×7×10)，空間 O(d×7)；可將次數限制到k。','k=0要排除0；答案不取模且可能超過32位，C++用64位。',
'''string N;int K;cin>>N>>K;vector<vector<array<long long,7>>>dp(2,vector<array<long long,7>>(K+1));dp[1][0][0]=1;for(char ch:N){vector<vector<array<long long,7>>>nd(2,vector<array<long long,7>>(K+1));for(int t=0;t<2;t++)for(int k=0;k<=K;k++)for(int r=0;r<7;r++)for(int x=0;x<=(t?ch-'0':9);x++){int nk=k+(x==7);if(nk<=K)nd[t&&(x==ch-'0')][nk][(r+x)%7]+=dp[t][k][r];}dp.swap(nd);}cout<<dp[0][K][0]+dp[1][K][0]-(K==0)<<'\n';''',
'''N,K=sys.stdin.read().split();K=int(K);dp={(True,0,0):1}
for ch in N:
    limit=int(ch);nd={}
    for (tight,k,r),ways in dp.items():
        for x in range((limit if tight else 9)+1):
            nk=k+(x==7)
            if nk<=K:
                key=(tight and x==limit,nk,(r+x)%7);nd[key]=nd.get(key,0)+ways
    dp=nd
print(sum(w for (t,k,r),w in dp.items() if k==K and r==0)-(K==0))''',T(('N=100、k=1，數字7本身數字和7，合格。',[7],1),('含一個7且其餘位數和也需7倍數，兩位數中只有70合格。',[70],2),('77有兩個7不符合恰一個，總共7、70兩數。',[7,70],2)))

add(480,'number-theory','hard','互質因數拆成完整質數冪','若 l 不是 g 的倍數，立即無解。否則寫 a=gx、b=gy，則 xy=l/g=c 且 gcd(x,y)=1。|分解 c 為互異質數的完整冪 p^e。為保持互質，每個完整質數冪必須全放 x 或全放 y，不能拆開。|枚舉所有質數冪子集合乘積 x，y=c/x，檢查 g(x+y)≤T。每個子集合是一個有序組，空集合與全集都要枚舉；c=1僅有一組。','設 V=max(l/g)≤10^12，篩 O(10^6 log log10^6)，每查詢試除至sqrt(c)內質數再 O(2^ω(c))；空間 O(10^6+q+2^ω(c))。','有序組不除二；g=l時只可 (g,g)；乘積及總長比較用64位即可涵蓋題目範圍。',
'''const int V=1000000;vector<bool>ok(V+1,true);vector<int>pr;for(int i=2;i<=V;i++)if(ok[i]){pr.push_back(i);if(1LL*i*i<=V)for(int j=i*i;j<=V;j+=i)ok[j]=false;}int q;cin>>q;while(q--){long long g,l,T;cin>>g>>l>>T;if(l%g){cout<<0<<'\n';continue;}long long c=l/g,x=c;vector<long long>powers;for(long long p:pr){if(p*p>x)break;if(x%p==0){long long z=1;while(x%p==0){x/=p;z*=p;}powers.push_back(z);}}if(x>1)powers.push_back(x);vector<long long>div={1};for(auto p:powers){int n=div.size();for(int i=0;i<n;i++)div.push_back(div[i]*p);}int ans=0;for(auto a:div)ans+=g*(a+c/a)<=T;cout<<ans<<'\n';}''',
'''from math import isqrt
v=list(map(int,sys.stdin.buffer.read().split()));qs=[v[i:i+3] for i in range(1,len(v),3)];V=isqrt(max((l//g for g,l,T in qs if l%g==0),default=1));ok=bytearray(b'\x01')*(V+1);pr=[]
for i in range(2,V+1):
    if ok[i]:
        pr.append(i)
        if i*i<=V:ok[i*i:V+1:i]=b'\x00'*((V-i*i)//i+1)
out=[]
for g,l,T in qs:
    if l%g:out.append('0');continue
    c=x=l//g;powers=[]
    for p in pr:
        if p*p>x:break
        if x%p==0:
            z=1
            while x%p==0:x//=p;z*=p
            powers.append(z)
    if x>1:powers.append(x)
    div=[1]
    for p in powers:div += [a*p for a in div]
    out.append(str(sum(g*(a+c//a)<=T for a in div)))
print('\n'.join(out))''',T(('g=2、l=12，c=6=2×3。',[2,3],'兩個質數冪'),('四個分配為 x=1、2、3、6，對應 (2,12)、(4,6)、(6,4)、(12,2)。',['2,12','4,6','6,4','12,2'],'有序4組'),('總和分別14、10、10、14，都≤15，答案4。',[14,10,10,14],4)))

add(481,'dp','hard','按餘數的數字子序列計數','dp[r] 記目前前綴中非空且無前導零的數字子序列，值模k為r的方法數。|遇數字 d，先複製 dp 作為不選當前位置；再把每個舊 dp[r] 加到 nd[(10r+d)%k]。d≠0時額外新增只選此位置的一種。|所有方法依是否選當前位置與是否首次選取分成互斥情況，因此不漏不重複；每步取模，最後輸出 dp[0]。','時間 O(nk)，空間 O(n+k)，包含輸入數字字串。','數字0不能獨立起步，也不能作首位；但已有非空序列後可以接0；不可原地轉移重複用同一位置。',
'''int n,k;string s;cin>>n>>k>>s;const long long M=1000000007;vector<long long>dp(k);for(char c:s){int d=c-'0';auto nd=dp;for(int r=0;r<k;r++)nd[(10*r+d)%k]=(nd[(10*r+d)%k]+dp[r])%M;if(d)nd[d%k]=(nd[d%k]+1)%M;dp.swap(nd);}cout<<dp[0]<<'\n';''',
'''v=sys.stdin.read().split();n,k=map(int,v[:2]);s=v[2];M=1000000007;dp=[0]*k
for c in s:
    d=ord(c)-48;nd=dp.copy()
    for r,w in enumerate(dp):z=(10*r+d)%k;nd[z]=(nd[z]+w)%M
    if d:nd[d%k]=(nd[d%k]+1)%M
    dp=nd
print(dp[0])''',T(('1023、k=3，單選3是有效方法。',['3'],1),('可再選12、123，兩者均無前導零且可被3整除。',['3','12','123'],3),('還有102、1023，總共5；單選0被禁止。',['102','1023'],5)))

add(482,'data-structures','medium','長度窗內的模3前綴計數','數字和被3整除等價於兩端前綴和的mod3相同。|固定右端i，合法左前綴索引介於i-R與i-L。新增i-L，移出i-R-1，三格頻率表即可維護可用前綴餘數。|每次將與當前前綴同餘的份數加到答案，每個合法片段恰在自己右端計入。','時間 O(n)，前綴陣列及輸入 O(n)，頻率表 O(3)。','允許前導零；長度上下限含端點，不要只計恰L或恰R。',
'''int n,L,R;string s;cin>>n>>L>>R>>s;vector<int>p(n+1);for(int i=0;i<n;i++)p[i+1]=(p[i]+s[i]-'0')%3;long long cnt[3]={},ans=0;for(int i=1;i<=n;i++){if(i>=L)cnt[p[i-L]]++;if(i>R)cnt[p[i-R-1]]--;ans+=cnt[p[i]];}cout<<ans<<'\n';''',
'''v=sys.stdin.read().split();n,L,R=map(int,v[:3]);s=v[3];p=[0]
for c in s:p.append((p[-1]+int(c))%3)
cnt=[0]*3;ans=0
for i in range(1,n+1):
    if i>=L:cnt[p[i-L]]+=1
    if i>R:cnt[p[i-R-1]]-=1
    ans+=cnt[p[i]]
print(ans)''',T(('12030，長度2的合法片段是12、03、30。',['12','03','30'],3),('長度3的合法片段是120、030。',['120','030'],2),('全部依起訖位置分別計，合計5。',[3,2],5)))

add(483,'data-structures','easy','集合切換與過程最大值','集合保存目前等待配對的顏色。|遇到已有顏色就刪除，否則加入；每處理一條後以集合大小更新最大值。|同色只有出現次數為奇數時有一條留下，集合恰好反映全部等待彩帶，最後大小就是剩餘數。','時間 O(N log N)（C++ set），Python期望 O(N)，空間 O(N)。','最大值要逐步更新，不能只看最後各色次數。',
'''int n;cin>>n;set<int>s;int best=0;while(n--){int x;cin>>x;if(s.count(x))s.erase(x);else s.insert(x);best=max(best,(int)s.size());}cout<<best<<' '<<s.size()<<'\n';''',
'''v=list(map(int,sys.stdin.buffer.read().split()));s=set();best=0
for x in v[1:]:
    if x in s:s.remove(x)
    else:s.add(x)
    best=max(best,len(s))
print(best,len(s))''',T(('教學顏色1、2、1，先拿1留一條。',[1],'最大1'),('拿2後等待兩色。',[1,2],'最大2'),('再拿1成對移除，只剩2，輸出2 1。',[2],'2 1')))

add(484,'sorting','easy','距離與值的雙排序鍵','每個量測值x建立鍵 (|x-T|,x)。|用鍵遞增排序，先保證離目標較近者在前，等距時用數值小者在前。重複值仍依份數輸出。','時間 O(N log N)，空間 O(N)。','不能只按差距排序而依賴原輸入順序；等距必須較小值優先。',
'''int n;long long T;cin>>n>>T;vector<long long>a(n);for(auto&x:a)cin>>x;sort(a.begin(),a.end(),[&](long long x,long long y){return pair(llabs(x-T),x)<pair(llabs(y-T),y);});for(int i=0;i<n;i++)cout<<a[i]<<(i+1==n?'\n':' ');''',
'''v=list(map(int,sys.stdin.buffer.read().split()));n,T=v[:2];print(*sorted(v[2:],key=lambda x:(abs(x-T),x)))''',T(('教學T=0，量測3、-1、1、0。',[3,-1,1,0],'計算距離'),('各鍵為(3,3)、(1,-1)、(1,1)、(0,0)。',['3:3','-1:1','1:1','0:0'],'依雙鍵'),('排序0、-1、1、3，等距-1先於1。',[0,-1,1,3],'完成')))

add(485,'simulation','easy','前綴收支最大值的首次位置','維護累積餘額s，每讀一筆就加進去。|只在s嚴格超過最佳餘額時更新交易編號。最佳從負無限開始，確保只考慮交易後而非初始0。|掃描後最佳是所有非空前綴和的最大值，嚴格更新也保證首次出現。','時間 O(N)，Python讀取 O(N)，C++額外 O(1)。','全部交易後餘額都負時仍要輸出某筆交易，不可回傳編號0。',
'''int n;cin>>n;long long s=0,best=LLONG_MIN;int pos=0;for(int i=1;i<=n;i++){long long x;cin>>x;s+=x;if(s>best){best=s;pos=i;}}cout<<pos<<'\n';''',
'''v=list(map(int,sys.stdin.buffer.read().split()));s=0;best=None;pos=0
for i,x in enumerate(v[1:],1):
    s+=x
    if best is None or s>best:best=s;pos=i
print(pos)''',T(('教學收支-3、2、0，第一筆後餘額-3。',[-3],'編號1'),('第二筆後餘額-1較大，更新編號2。',[-3,-1],'編號2'),('第三筆後仍-1，保留首次編號2。',[-3,-1,-1],2)))

add(486,'simulation','easy','模索引的環形相鄰比較','對每個i比較 a[i] 與 a[(i+1)%N]，相等就加一。|模N使最後一座連回第一座，每個座位作起點恰好一次，正是指定的順時針下一座計數。','時間 O(N)，空間 O(N)。','N=1要與自己比，答案1；N=2相同數字會由兩個座位各計一次。',
'''int n;cin>>n;vector<int>a(n);for(auto&x:a)cin>>x;int ans=0;for(int i=0;i<n;i++)ans+=a[i]==a[(i+1)%n];cout<<ans<<'\n';''',
'''v=list(map(int,sys.stdin.buffer.read().split()));n=v[0];a=v[1:];print(sum(a[i]==a[(i+1)%n] for i in range(n)))''',T(('教學三座數字2、3、2，第一座比第二座不等。',[2,3,2],0),('第二座比第三座不等。',[3,2],0),('第三座比第一座相等，加一次。',[2,2],1)))

add(487,'basics','easy','相鄰絕對差累加','第一個高度只作起點，其後每個高度與前一高度相減取絕對值並加到總和。|每段路恰對應一對相鄰輸入，因此正好計入所有N-1段，沒有把終點連回起點。','時間 O(N)，Python讀取 O(N)，C++額外 O(1)。','N=1沒有路段，總和0；上下坡都取正的起伏。',
'''int n;cin>>n;long long last;cin>>last;long long ans=0;for(int i=1;i<n;i++){long long x;cin>>x;ans+=llabs(x-last);last=x;}cout<<ans<<'\n';''',
'''v=list(map(int,sys.stdin.buffer.read().split()));a=v[1:];print(sum(abs(y-x) for x,y in zip(a,a[1:])))''',T(('教學高度2、5、1，起點2沒有起伏。',[2],0),('2→5 起伏3。',[2,5],3),('5→1 起伏4，總和7。',[5,1],7)))

add(488,'simulation','easy','嚴格前綴最大紀錄','維護左方已看過的最高亮度。|若當前亮度嚴格大於最高值，就增加紀錄數並更新最高值；否則不改變。|第一盞單獨算入，往後逐盞符合「大於左方全部」當且僅當大於前綴最大值。','時間 O(N)，Python讀取 O(N)，C++額外 O(1)。','等於舊紀錄不算新紀錄；第一盞即使亮度0也算。',
'''int n;cin>>n;long long mx=-1;int ans=0;while(n--){long long x;cin>>x;if(x>mx){ans++;mx=x;}}cout<<ans<<'\n';''',
'''v=list(map(int,sys.stdin.buffer.read().split()));mx=-1;ans=0
for x in v[1:]:
    if x>mx:ans+=1;mx=x
print(ans)''',T(('教學亮度0、2、2、5，第一盞0也是新紀錄。',[0],1),('亮度2超過0，下一個2只是並列。',[0,2,2],2),('亮度5再創紀錄，總數3。',[0,2,2,5],3)))

add(489,'number-theory','easy','一基環號轉零基取模','先把站號 S 轉為零起算 S-1，前進D後對N取模，再加1還原。|每完整一圈N站不改終點，所以 (S-1+D)%N+1 正確涵蓋繞回及多圈。','時間 O(1)，空間 O(1)。','D=0應停原站；直接 S+D 對N取模會把第N站錯成0。',
'''long long N,S,D;cin>>N>>S>>D;cout<<(S-1+D)%N+1<<'\n';''',
'''N,S,D=map(int,sys.stdin.read().split());print((S-1+D)%N+1)''',T(('範例N=8、S=7、D=4，零基位置6。',[6],'準備'),('前進4到零基10，模8得到2。',[10,2],'零基2'),('加1回到站牌3。',[3],3)))

add(490,'basics','easy','兩資源限制的整數商最小值','紅彩帶可支援 floor(A/X) 包，藍彩帶可支援 floor(B/Y) 包。|任意包數都不能超過兩個上限；取其中較小值時，兩色需求都足夠，所以此上限可達。','時間 O(1)，空間 O(1)。','X、Y為正，可直接整除；剩餘零頭不能湊成一包。',
'''long long A,B,X,Y;cin>>A>>B>>X>>Y;cout<<min(A/X,B/Y)<<'\n';''',
'''A,B,X,Y=map(int,sys.stdin.read().split());print(min(A//X,B//Y))''',T(('紅17條，每包3條，可支援5包。',[17,3],5),('藍11條，每包2條，也可支援5包。',[11,2],5),('取最小上限5，耗紅15藍10均足夠。',[15,10],5)))

add(491,'basics','easy','向上整除的計費單位','所需單位數為 ceil(T/K)，可用整數式 (T+K-1)//K 計算。|因T非負，T=0也正確得到0；每單位再乘C就是總費用。|整除時不多收，存在餘數才補一單位，完全對應不足一單位按一單位算。','時間 O(1)，空間 O(1)。','費用最大可達10^18，用64位；不要用浮點除法再四捨五入。',
'''long long T,K,C;cin>>T>>K>>C;cout<<((T+K-1)/K)*C<<'\n';''',
'''T,K,C=map(int,sys.stdin.read().split());print((T+K-1)//K*C)''',T(('17分鐘、每6分鐘一單位，前12分鐘為2單位。',[6,6],2),('剩5分鐘不足6，也計1單位。',[5],3),('每單位4元，3×4=12。',[12],12)))
checkpoint()

CHECKS=[]
def sp(a):return ' '.join(map(str,a))
def fmt(*rows):return '\n'.join(sp(x) if isinstance(x,(tuple,list)) else str(x) for x in rows)
def record(code,inp,out,reason):
    code='b'+str(code)
    if isinstance(out,list):out=fmt(*out)
    out=str(out)
    if any(inp.strip()==s['input'].strip() for s in INPUT[code]['samples']):return
    CHECKS.append(dict(code=code,input=inp,output=out,reason=reason))
def subsets(n):return range(1<<n)
def inv(a):return sum(a[i]>a[j] for i in range(len(a)) for j in range(i+1,len(a)))
def queens(board):
    return sum(all(board[r][p[r]]=='.' for r in range(8)) and len({r+p[r] for r in range(8)})==8 and len({r-p[r] for r in range(8)})==8 for p in itertools.permutations(range(8)))
def matching(jobs,edges):
    def f(i,used):
        if i==len(jobs):return 0
        return max([f(i+1,used)]+[1+f(i+1,used|1<<j) for j in edges[i] if not used>>j&1])
    return f(0,0)
def components(n,edges):
    g=[[] for _ in range(n)]
    for a,b in edges:g[a].append(b);g[b].append(a)
    unseen=set(range(n));groups=[]
    while unseen:
        s=unseen.pop();group={s};todo=[s]
        for u in todo:
            for w in g[u]:
                if w in unseen:unseen.remove(w);group.add(w);todo.append(w)
        groups.append(group)
    return groups
def build_checks():
    rng=random.Random(2026110304);ri=rng.randint;choice=rng.choice
    # Oracles deliberately enumerate definitions, not the optimized lesson recurrences.
    for trial in range(10):
        n=ri(1,7)
        times=rng.sample(range(1,40),2*n);pairs=[sorted(times[2*i:2*i+2]) for i in range(n)]
        record(376,fmt(n,*pairs),max(sum(a<=t<b for a,b in pairs) for t in range(40)),'獨立逐時刻計數區間交疊；時間互異。')
        a=[ri(1,10) for _ in range(n)]
        def gond(mask):
            if not mask:return 0
            i=(mask&-mask).bit_length()-1;rest=mask^(1<<i)
            return 1+min([gond(rest)]+[gond(rest^(1<<j)) for j in range(i+1,n) if rest>>j&1 and a[i]+a[j]<=10])
        record(377,fmt([n,10],a),gond((1<<n)-1),'枚舉最先未分配孩子所有合法搭檔，不用貪心產生答案。')
        m=ri(1,7);k=ri(0,3);b=[ri(1,12) for _ in range(m)]
        record(378,fmt([n,m,k],a,b),matching(a,[[j for j,y in enumerate(b) if abs(x-y)<=k] for x in a]),'小型二分圖窮舉所有匹配。')
        record(379,fmt(n,a),sum(a.index(x)==i for i,x in enumerate(a)),'直接逐位置判斷是否第一次出現。')
        ks=[1,9,10,11,189,190,191]+[ri(1,20000) for _ in range(8)];digits=''.join(map(str,range(1,10000)))
        record(380,fmt(len(ks),*ks),[digits[k-1] for k in ks],'實際串接1到9999定位，涵蓋位數切換邊界。')
        if trial<3:
            board=[''.join('.' if ri(0,3) else '*' for _ in range(8)) for _ in range(8)]
            record(381,fmt(*board),queens(board),'枚舉8!種欄排列，再逐棋局檢查兩種斜線。')
        total=sum(a);record(382,fmt(n,a),min(abs(total-2*sum(a[i] for i in range(n) if mask>>i&1)) for mask in subsets(n)),'枚舉所有位置子集合的兩組重量差。')
        coin=[(ri(0,15),ri(0,15)) for _ in range(15)]
        def empty(a,b):
            reachable={(0,0)}
            for x in range(a+1):
                for y in range(b+1):
                    if (x,y) in reachable:
                        if x+1<=a and y+2<=b:reachable.add((x+1,y+2))
                        if x+2<=a and y+1<=b:reachable.add((x+2,y+1))
            return (a,b) in reachable
        record(383,fmt(len(coin),*coin),['YES' if empty(a,b) else 'NO' for a,b in coin],'由(0,0)反向枚舉兩種操作的可達狀態。')
        size=ri(1,7);kn=[]
        for side in range(1,size+1):
            cells=list(itertools.product(range(side),repeat=2));kn.append(sum(sorted((abs(x-u),abs(y-v)))!=[1,2] for (x,y),(u,v) in itertools.combinations(cells,2)))
        record(384,str(size),kn,'直接枚舉棋盤兩格並判斷騎士位移。')
        grid={(1,1):1};value=1
        for layer in range(2,10):
            path=([(layer,x) for x in range(1,layer+1)]+[(y,layer) for y in range(layer-1,0,-1)]) if layer%2 else ([(y,layer) for y in range(1,layer+1)]+[(layer,x) for x in range(layer-1,0,-1)])
            for cell in path:value+=1;grid[cell]=value
        coords=[(ri(1,9),ri(1,9)) for _ in range(12)]
        record(385,fmt(len(coords),*coords),[grid[z] for z in coords],'照本平台逐層走格實際填值，獨立於座標公式。')
        z=ri(1,100);fact=str(math.factorial(z));record(386,str(z),len(fact)-len(fact.rstrip('0')),'直接計算小階乘並計尾端零。')
        z=ri(1,18);record(387,str(z),len(list(itertools.product((0,1),repeat=z))),'窮舉短位元字串數量。')
        # Independent minimization over all nondecreasing corrected values (bounded small domain).
        arr=[ri(1,4) for _ in range(min(n,5))]
        record(388,fmt(len(arr),arr),min(sum(y-x for x,y in zip(arr,v)) for v in itertools.combinations_with_replacement(range(1,5),len(arr)) if all(y>=x for x,y in zip(arr,v))),'枚舉所有小範圍非遞減目標陣列，取最小增量。')
        s=''.join(choice('ACGT') for _ in range(ri(1,12)))
        record(389,s,max(j-i for i in range(len(s)) for j in range(i+1,len(s)+1) if len(set(s[i:j]))==1),'枚舉所有子字串檢查是否同字元。')
        z=ri(2,15);missing=ri(1,z);arr=[i for i in range(1,z+1) if i!=missing];rng.shuffle(arr)
        record(390,fmt(z,arr),missing,'先指定缺值，再隨機打亂其餘互異整數。')
        z=ri(1,100);seq=[z]
        while seq[-1]!=1:
            x=seq[-1];seq.append(x//2 if x%2==0 else 3*x+1)
            assert len(seq)<10000
        record(391,str(z),sp(seq),'直接按定義產生有限小起點序列。')
        words=['a','ab','abc','b','ba'];bag=[];ops=[];outs=[]
        for _ in range(25):
            t=ri(1,3);s=choice(words)
            if t==1:ops.append(f'1 {s}');bag.append(s)
            elif t==2:
                ops.append(f'2 {s}')
                if s in bag:bag.remove(s)
            else:
                k=ri(1,5);ops.append(f'3 {s} {k}');v=sorted(x for x in bag if x.startswith(s));outs.append(v[k-1] if len(v)>=k else 'NONE')
        ops.append('3 a 1');v=sorted(x for x in bag if x.startswith('a'));outs.append(v[0] if v else 'NONE')
        record(392,fmt(len(ops),*ops),outs,'以真實重複字串列表插刪，查詢直接篩字首再排序。')
        n=ri(1,8);k=ri(1,n);rows=[(ri(-2,3),ri(1,3)) for _ in range(n)]
        record(393,fmt([n,k],*rows),sp([sum(rows[i][0]>rows[j][0] and rows[i][1]!=rows[j][1] for i in range(l,l+k) for j in range(i+1,l+k)) for l in range(n-k+1)]),'各滑窗直接二重迴圈數嚴格異類逆序。')
        arr=[ri(-3,3) for _ in range(n)];cur=arr.copy();ops=[];out=[]
        for _ in range(16):
            l=ri(1,n);r=ri(l,n);d=ri(-5,5);t=ri(1,2);ops.append((t,l,r,d))
            if t==1:
                for i in range(l-1,r):cur[i]+=d
            else:out.append(next((i+1 for i in range(l-1,r) if cur[i]<=d),-1))
        ops.append((2,1,n,0));out.append(next((i+1 for i in range(n) if cur[i]<=0),-1))
        record(394,fmt([n,len(ops)],arr,*ops),out,'普通列表逐格區間加，逐格找首個合格位置。')
        versions=[arr.copy()];ops=[];out=[]
        for i in range(1,18):
            base=ri(0,i-1);cur=versions[base].copy()
            if i%3:
                x=ri(1,n);d=ri(-5,5);cur[x-1]+=d;ops.append((1,base,x,d))
            else:
                l=ri(1,n);r=ri(l,n);ops.append((2,base,l,r));out.append([sum(cur[l-1:r]),min(cur[l-1:r])])
            versions.append(cur)
        record(395,fmt([n,len(ops)],arr,*ops),out,'每個版本完整複製普通陣列，驗證分支及查詢版本。')
        versions=[[]];ops=[];out=[]
        for i in range(1,25):
            base=ri(0,i-1);cur=versions[base].copy();t=ri(1,3)
            if t==1:x=ri(-9,9);cur.append(x);ops.append((1,base,x))
            elif t==2:
                if cur:cur.pop()
                ops.append((2,base))
            else:
                k=ri(1,5);ops.append((3,base,k));out.append(str(cur[-k]) if len(cur)>=k else 'EMPTY')
            versions.append(cur)
        ops.append((3,0,1));out.append('EMPTY')
        record(396,fmt(len(ops),*ops),out,'所有版本用獨立列表保存，直接索引由頂端第k項。')
        rows=[(ri(1,3),ri(1,8)) for _ in range(n)];qs=[];out=[]
        for _ in range(12):
            l=ri(1,n);r=ri(l,n);q=ri(1,9);p=ri((q+1)//2,q);qs.append((l,r,p,q));cnt=collections.Counter()
            for t,w in rows[l-1:r]:cnt[t]+=w
            good=[t for t,w in cnt.items() if w*q>sum(cnt.values())*p];out.append(good[0] if good else -1)
        record(397,fmt([n,len(qs)],*rows,*qs),out,'直接建立每查詢各種類實際權重，不使用候選抵銷。')
        rows=[(ri(1,3),ri(0,5)) for _ in range(n)];order=list(range(1,n+1));rng.shuffle(order);out=[]
        for removed in range(n+1):
            off=set(order[:removed]);best=0;i=0
            while i<n:
                if i+1 in off:i+=1;continue
                group=[]
                while i<n and i+1 not in off:group.append(rows[i]);i+=1
                score=sum(w for t,w in group)+sum(group[i][0]==group[j][0] for i in range(len(group)) for j in range(i))
                best=max(best,score)
            out.append(best)
        record(398,fmt([n,n+1],*rows,order,list(range(n+1))),out,'每個拆除時刻重新找連續段，再直接枚舉同類對。')
        n=ri(1,7);L=ri(1,n);B=ri(1,10);a=[ri(0,B) for _ in range(n)];counts=[]
        for start in range(n):
            arr=a[start:]+a[:start];possible=[]
            for mask in subsets(n-1):
                bounds=[0]+[i+1 for i in range(n-1) if mask>>i&1]+[n]
                if all(bounds[i+1]-bounds[i]<=L and sum(arr[bounds[i]:bounds[i+1]])<=B for i in range(len(bounds)-1)):possible.append(len(bounds)-1)
            counts.append(min(possible))
        record(399,fmt([n,L,B],a),sp([min(counts),counts.count(min(counts))]),'枚舉每個環起點的所有切點集合，非貪心產生期望。')
        nn=ri(1,5);edges=[(ri(0,nn-1),ri(0,nn-1),ri(0,1)) for _ in range(ri(0,8))];K=ri(0,nn-1);ans=0
        for inds in itertools.combinations(range(len(edges)),nn-1):
            ee=[edges[i] for i in inds]
            if sum(c for u,v,c in ee)==K and len(components(nn,[(u,v) for u,v,c in ee]))==1:ans+=1
        record(400,fmt([nn,len(edges),K],*[(u+1,v+1,c) for u,v,c in edges]),ans,'枚舉n-1邊的全部子集合，包含自環、平行邊與不連通。')
        n=ri(1,9);parents=[0,0]+[ri(1,i-1) for i in range(2,n+1)];rows=[(ri(-5,5),ri(0,1)) for _ in range(n)];qs=[];out=[]
        for _ in range(12):
            u=ri(1,n);k=ri(1,n+1);qs.append((u,k));path=[];x=u
            while x:path.append(x);x=parents[x]
            marked=[x for x in path if rows[x-1][1]]
            if len(marked)<k:out.append('-1')
            else:
                x=marked[k-1];out.append(sp([x,sum(rows[z-1][0] for z in path[:path.index(x)+1])]))
        record(401,fmt([n,len(qs)],parents[2:],*rows,*qs),out,'每次直接沿父鏈列出標記祖先與路徑和。')
        n=ri(1,8);rows=[(ri(-4,4),ri(-6,6)) for _ in range(n)];valid=[]
        for mask in range(1,1<<n):
            chosen=[rows[i] for i in range(n) if mask>>i&1]
            if all(x<y and x%2!=y%2 for (x,w),(y,z) in zip(chosen,chosen[1:])):valid.append(sum(w for x,w in chosen))
        record(402,fmt(n,*rows),max(valid),'枚舉所有非空子序列，直接檢查座標嚴增與奇偶交替。')
        a=[ri(-2,3) for _ in range(n)];scores=[inv(a[i:]+a[:i]) for i in range(n)]
        record(403,fmt(n,a),sp([min(scores),scores.count(min(scores))]),'每個旋轉重新二重迴圈計逆序，含重複值。')
        n=ri(1,8);K=ri(0,3);L=ri(1,n);a=[ri(-5,5) for _ in range(n)];valid=[]
        for mask in subsets(n):
            runs=[];i=0
            while i<n:
                if not mask>>i&1:i+=1;continue
                start=i
                while i<n and mask>>i&1:i+=1
                runs.append(i-start)
            if len(runs)==K and all(x>=L for x in runs):valid.append(sum(a[i] for i in range(n) if mask>>i&1))
        record(404,fmt([n,K,L],a),max(valid) if valid else 'IMPOSSIBLE','枚舉所有被選位置，轉成極大連續段判斷段數與間隔。')
        h=ri(1,3);w=ri(1,4);a=[ri(-2,3) for _ in range(h*w)];levels=list(range(-3,5));out=[]
        for z in levels:
            unseen={i for i,x in enumerate(a) if x>z};sizes=[]
            while unseen:
                u=unseen.pop();todo=[u]
                for x in todo:
                    for y in [x-w if x>=w else -1,x+w if x+w<h*w else -1,x-1 if x%w else -1,x+1 if x%w+1<w else -1]:
                        if y in unseen:unseen.remove(y);todo.append(y)
                sizes.append(len(todo))
            out.append(sum(s*s for s in sizes))
        record(405,fmt([h,w,len(levels)],*[a[i*w:(i+1)*w] for i in range(h)],*levels),out,'每個水位重新以洪水填充找陸地連通分量。')
        s=''.join(str(ri(0,9)) for _ in range(ri(1,5)));n=len(s);best=10**9;ways=0
        for digits in itertools.product(range(10),repeat=(n+1)//2):
            t=''.join(map(str,digits));t=t+t[:n//2][::-1]
            if n>1 and t[0]=='0' or int(t)%7:continue
            cost=sum(abs(int(x)-int(y)) for x,y in zip(s,t))
            if cost<best:best=cost;ways=1
            elif cost==best:ways+=1
        record(406,s,sp([best,ways]),'枚舉所有同長合法迴文，不以餘數DP產生答案。')
        n=ri(1,8);rows=[]
        for _ in range(n):
            s=ri(0,6);rows.append((s,ri(s+1,8),ri(-3,5),ri(0,1)))
        vals=[]
        for mask in subsets(n):
            jobs=sorted([rows[i] for i in range(n) if mask>>i&1])
            if all(a[1]<=b[0] and a[3]!=b[3] for a,b in zip(jobs,jobs[1:])):vals.append(sum(r[2] for r in jobs))
        record(407,fmt(n,*rows),sp([max(vals),vals.count(max(vals))]),'枚舉所有工作集合，按時間檢查不重疊及交替色，含零負收益。')
        R=ri(1,25);ans=sum(x*x+y*y<=R*R and math.gcd(x,y)==1 and x%2!=y%2 for x in range(1,R+1) for y in range(1,R+1))
        record(408,str(R),ans,'逐格枚舉正座標並以gcd直接檢查。')
        n=ri(1,7);m=ri(1,7);K=ri(0,n);s=''.join(choice('abcde') for _ in range(n));t=''.join(choice('abcde') for _ in range(m));ans=0
        for l in range(n):
            for r in range(l+1,n+1):
                if sum(x in 'aeiou' for x in s[l:r])!=K:continue
                for j in range(m-(r-l)+1):
                    if sum(x!=y for x,y in zip(s[l:r],t[j:j+r-l]))<=1:ans=max(ans,r-l)
        record(409,fmt([n,m,K],s,t),ans,'枚舉兩字串所有同長連續片段，逐字計錯配與S母音。')
        n=ri(1,9);arr=[ri(0,1) for _ in range(n)];cur=arr.copy();ops=[];out=[]
        for _ in range(15):
            l=ri(1,n);r=ri(l,n);kind=ri(1,2);ops.append((kind,l,r))
            if kind==1:
                for i in range(l-1,r):cur[i]^=1
            else:out.append(max(j-i for i in range(l-1,r) for j in range(i+1,r+1) if cur[i:j].count(0)<=1))
        ops.append((2,1,n));out.append(max(j-i for i in range(n) for j in range(i+1,n+1) if cur[i:j].count(0)<=1))
        record(410,fmt([n,len(ops)],''.join(map(str,arr)),*ops),out,'逐格翻轉，查詢窮舉所有子段且直接計零數。')
        free=set(range(1,n+1));ops=[];out=[]
        for _ in range(20):
            if ri(0,2):
                l=ri(1,n);r=ri(l,n);ops.append((1,l,r));found=sorted(x for x in free if l<=x<=r);x=found[0] if found else -1;out.append(x);free.discard(x)
            else:x=ri(1,n);ops.append((2,x));free.add(x)
        ops.append((1,1,n));x=min(free,default=-1);out.append(x)
        record(411,fmt([n,len(ops)],*ops),out,'空閒櫃直接用集合篩選取最小，涵蓋重複歸還。')
        n=ri(1,6);m=ri(1,6);jobs=[(ri(1,2),ri(0,5),ri(0,5)) for _ in range(n)];eq=[(ri(1,2),ri(0,5),ri(0,5)) for _ in range(m)]
        record(412,fmt([n,m],*jobs,*eq),matching(jobs,[[j for j,(t,X,Y) in enumerate(eq) if t==c and X>=x and Y>=y] for c,x,y in jobs]),'枚舉小型二分圖所有匹配，不依二維貪心。')
        qs=[];out=[]
        for _ in range(15):
            L=ri(0,20);R=ri(L,70);m=ri(1,10);a=ri(0,m-1);nn=ri(1,10);b=ri(0,nn-1);d=ri(1,10);qs.append((L,R,m,a,nn,b,d));out.append(sum(t%m==a and t%nn==b and t%d!=0 for t in range(L,R+1)))
        record(413,fmt(len(qs),*qs),out,'逐整數檢查三個餘數條件，包括0與不相容同餘。')
        rows=[(ri(-4,4),ri(-4,4),ri(0,1)) for _ in range(ri(1,10))];D=ri(0,7)
        record(414,fmt([len(rows),D],*rows),sum(c!=d and abs(x-u)+abs(y-v)<=D for i,(x,y,c) in enumerate(rows) for u,v,d in rows[:i]),'逐紅藍點對直接算曼哈頓距離，允許重合點。')
        qs=[];out=[]
        for _ in range(10):
            l=ri(1,100);r=ri(l,200);k=ri(0,5);qs.append((l,r,k));ans=0
            for x in range(l,r+1):
                factors=[p for p in range(2,x+1) if x%p==0 and all(p%d for d in range(2,math.isqrt(p)+1))]
                ans+=not any(x%(p*p)==0 for p in factors) and len(factors)==k and sum(map(int,str(x)))%3==0
            out.append(ans)
        record(415,fmt(len(qs),*qs),out,'小區間直接試除每個整數及平方因子，數字和直接計算。')
        s=''.join(choice('abc') for _ in range(ri(1,9)));n=len(s);L=ri(1,n);R=ri(L,n);contents={s[i:j] for i in range(n) for j in range(i+L,min(n,i+R)+1) if all(s[k]!=s[k+1] for k in range(i,j-1))}
        record(416,fmt([n,L,R],s),len(contents),'把所有合法片段實際放入字串集合去重，非自動機。')
        n=ri(1,5);K=ri(0,n);board=[''.join(choice('..#') for _ in range(n)) for _ in range(2)];empty={(r,c) for r in range(2) for c in range(n) if board[r][c]=='.'}
        def tile(cells,k):
            if not cells:return int(k==K)
            r,c=min(cells);ans=0
            for rr,cc in [(r+1,c),(r,c+1)]:
                if (rr,cc) in cells:ans+=tile(cells-{(r,c),(rr,cc)},k+int(rr!=r))
            return ans
        record(417,fmt([n,K],*board),tile(empty,0),'直接取最先空格，枚舉實際骨牌覆蓋集合。')
        n=ri(1,5);H=ri(0,n);P=ri(0,n);ans=0
        for left in itertools.combinations(range(2*n),n):
            opens=set(left);s=''.join('(' if i in opens else ')' for i in range(2*n));depth=0;peak=0;valid=True
            for c in s:
                depth+=1 if c=='(' else -1
                if depth<0:valid=False
                peak=max(peak,depth)
            ans+=valid and peak==H and s.count('()')==P
        record(418,fmt([n,H,P]),ans,'窮舉所有n個左括號位置，逐前綴檢查合法性、深度和峰數。')
        n=ri(1,7);K=ri(0,min(3,n));rows=[(ri(0,9),ri(0,1)) for _ in range(n)];edges=[(ri(0,n-1),ri(0,n-1)) for _ in range(ri(0,12))];valid=[]
        for mask in subsets(n):
            chosen={i for i in range(n) if mask>>i&1}
            if sum(rows[i][1] for i in chosen)<K:continue
            reach=chosen.copy()
            for _ in range(n):
                reach|={v for u,v in edges if u in reach}
            if len(reach)==n:valid.append(sum(rows[i][0] for i in chosen))
        record(419,fmt([n,len(edges),K],*rows,*[(u+1,v+1) for u,v in edges]),min(valid) if valid else -1,'枚舉所有啟動站集合，實際沿有向邊傳播訊息，含環與孤點。')
        s=''.join(choice('ABC') for _ in range(ri(1,8)));t=''.join(choice('ABC') for _ in range(ri(1,8)))
        def subseq(s):
            return {''.join(s[i] for i in range(len(s)) if mask>>i&1) for mask in subsets(len(s))}
        both=subseq(s)&subseq(t)
        record(420,fmt(s,t),max(len(x) for x in both if all(a!=b for a,b in zip(x,x[1:]))),'實際列出兩邊所有不同子序列取交集，再檢查相鄰不同。')
        n=ri(1,7);K=ri(0,min(n,3));rows=[]
        for _ in range(n):
            s=ri(0,6);rows.append((s,ri(s+1,8),ri(-5,6),ri(0,1)))
        vals=[]
        for inds in itertools.combinations(range(n),K):
            jobs=sorted(rows[i] for i in inds)
            if any(x[3] for x in jobs) and all(a[1]<=b[0] for a,b in zip(jobs,jobs[1:])):vals.append(sum(x[2] for x in jobs))
        record(421,fmt([n,K],*rows),max(vals) if vals else 'IMPOSSIBLE','枚舉恰K活動集合，逐一檢查不重疊及必修標記。')
        n=ri(1,5);K=ri(0,n);t=[ri(0,1) for _ in range(n)];cost=[[choice([-1,0,2,5,9]) for _ in range(n)] for _ in range(n)];valid=[]
        for perm in itertools.permutations(range(n)):
            if sum(t[i]!=t[perm[i]] for i in range(n))==K and all(cost[i][perm[i]]>=0 for i in range(n)):valid.append(sum(cost[i][perm[i]] for i in range(n)))
        record(422,fmt([n,K],t,*cost),min(valid) if valid else -1,'枚舉所有完美指派排列，直接檢查禁止格、跨類數及費用。')
        n=ri(1,7);L=ri(1,n);D=ri(0,5);P=ri(1,5);a=[ri(0,6) for _ in range(n)];valid=[]
        for mask in subsets(n-1):
            bounds=[0]+[i+1 for i in range(n-1) if mask>>i&1]+[n];groups=[a[l:r] for l,r in zip(bounds,bounds[1:])]
            if all(len(g)<=L and max(g)-min(g)<=D and sum(g)%P==0 for g in groups):valid.append(len(groups))
        record(423,fmt([n,L,D,P],a),min(valid) if valid else -1,'窮舉所有分批切點，直接驗證每批三項限制。')
        h=ri(1,3);w=ri(1,4);K=ri(0,h*w);a=[[ri(-5,5) for _ in range(w)] for _ in range(h)];b=[[ri(0,1) for _ in range(w)] for _ in range(h)];valid=[]
        for t in range(h):
            for bot in range(t,h):
                for l in range(w):
                    for r in range(l,w):
                        if sum(b[i][j] for i in range(t,bot+1) for j in range(l,r+1))==K:valid.append(sum(a[i][j] for i in range(t,bot+1) for j in range(l,r+1)))
        record(424,fmt([h,w,K],*a,*[''.join(map(str,row)) for row in b]),max(valid) if valid else 'IMPOSSIBLE','逐一枚舉所有非空矩形，逐格算標記與分數。')
        n=ri(1,7);t=[ri(0,1) for _ in range(n)];edges=[(ri(0,n-1),ri(0,n-1)) for _ in range(ri(0,6))];ans=0
        for perm in itertools.permutations(range(n)):
            pos={v:i for i,v in enumerate(perm)}
            ans+=all(t[a]!=t[b] for a,b in zip(perm,perm[1:])) and all(pos[u]<pos[v] for u,v in edges)
        record(425,fmt([n,len(edges)],t,*[(u+1,v+1) for u,v in edges]),ans,'窮舉全排列檢查交替及所有先後關係，含自依賴與環。')
        n=ri(2,5);s,t=rng.sample(range(n),2);edges=list({(ri(0,n-1),ri(0,n-1)) for _ in range(ri(0,10))});states={(s,t)};seen=states.copy();ans=-1
        for steps in range(n*n+1):
            if (t,s) in states:ans=steps;break
            nxt=set()
            for u,v in states:
                for a,b in itertools.product([y for x,y in edges if x==u],[y for x,y in edges if x==v]):
                    if a!=b and (a,b)!=(v,u) and (a,b) not in seen:nxt.add((a,b))
            seen|=nxt;states=nxt
            if not states:break
        record(426,fmt([n,len(edges),s+1,t+1],*[(u+1,v+1) for u,v in edges]),ans,'以整回合集合窮舉雙車所有合法同時移動，最多n²層。')
        A,B,C=[ri(0,2) for _ in range(3)];K=ri(0,A+B+C);perms=set(itertools.permutations('0'*A+'1'*B+'2'*C));ans=sum(sum(a!=b for a,b in zip(p,p[1:]))==K and all(not p[i]==p[i+1]==p[i+2] for i in range(len(p)-2)) for p in perms)
        record(427,fmt([A,B,C,K]),ans,'實際去重枚舉全部多重集合排列，直接數切換及三連色。')
        n=ri(1,8);S=ri(0,15);a=[ri(0,6) for _ in range(n)];valid=[]
        for mask in range(1,1<<n):
            arr=[a[i] for i in range(n) if mask>>i&1]
            if sum(arr)==S and all(x%2!=y%2 for x,y in zip(arr,arr[1:])):valid.append(len(arr))
        record(428,fmt([n,S],a),max(valid) if valid else -1,'窮舉所有非空位置子集合，檢查總和與交替奇偶，含零。')
        n=ri(1,9);K=ri(0,3);rows=[(ri(-5,5),int(ri(0,4)==0)) for _ in range(n)];valid=[]
        def walk(i,last,k,score):
            if rows[i][1]:return
            score+=rows[i][0]
            if i==n-1:
                if k==K:valid.append(score)
                return
            if i+1<n:walk(i+1,False,k,score)
            if not last and i+2<n:walk(i+2,True,k+1,score)
        walk(0,False,0,0)
        record(429,fmt([n,K],*rows),max(valid) if valid else 'IMPOSSIBLE','窮舉每條步長1或2的落點路徑，逐路檢查大跳與障礙。')
        s=''.join(choice('aeibcd') for _ in range(ri(1,12)));n=len(s);ans=0
        for l in range(n):
            for r in range(l+1,n+1):
                cnt=collections.Counter(s[l:r]);ans+=(r-l)%3==0 and any(cnt[c] for c in 'aeiou') and all(cnt[c]%2==0 for c in 'aeiou')
        record(430,fmt(n,s),ans,'枚舉子字串，直接算五母音完整頻率，不用遮罩。')
        H=ri(0,5);V=ri(0,5)
        if H+V==0:H=1
        hor=[];ver=[]
        for _ in range(H):
            l=ri(-3,3);hor.append((l,ri(l+1,5),ri(-3,3)))
        for _ in range(V):
            l=ri(-3,3);ver.append((ri(-3,3),l,ri(l+1,5)))
        record(431,fmt([H,V],*hor,*ver),sum(l<x<r and lo<y<hi for l,r,y in hor for x,lo,hi in ver),'逐水平垂直線段對檢查四個嚴格不等號。')
        n=ri(2,8);a=[ri(-2,3) for _ in range(n)];cur=a.copy();ops=[ri(1,n-1) for _ in range(12)];out=[]
        for p in ops:cur[p-1],cur[p]=cur[p],cur[p-1];out.append(inv(cur))
        record(432,fmt([n,len(ops)],a,*ops),out,'每次真實交換後重新二重迴圈數全部逆序。')
        A=ri(0,45);B=ri(0,45);ans=0
        for x in range(A+1):
            for y in range(B+1):
                a=str(x).zfill(2);b=str(y).zfill(2);ans+=(x+y)%3==0 and all(int(c)+int(d)<10 for c,d in zip(a,b))
        record(433,fmt([A,B]),ans,'枚舉所有有序整數對，逐十進位位檢查進位。')
        n=ri(1,8);q=10;rows=[(ri(1,3),ri(-3,3),ri(-3,3),ri(-6,6)) for _ in range(n)];qs=[];out=[]
        for _ in range(q):
            t=ri(1,4);x1=ri(-4,3);x2=ri(x1,4);y1=ri(-4,3);y2=ri(y1,4);qs.append((t,x1,y1,x2,y2));out.append(sum(w for c,x,y,w in rows if c==t and x1<=x<=x2 and y1<=y<=y2))
        record(434,fmt([n,q],*rows,*qs),out,'每個閉矩形直接掃描所有同類讀數，含負權重與不存在類別。')
        n=ri(1,9);K=ri(1,n);M=ri(K,n);L=ri(-8,5);U=ri(L,10);a=[ri(-5,5) for _ in range(n)]
        record(435,fmt([n,K,M,L,U],a),sum(K<=r-l<=M and L<=sum(a[l:r])<=U for l in range(n) for r in range(l+1,n+1)),'枚舉所有子區間直接求和及長度，含負數。')
        ops=[];offers={};out=[];time=0;id=0
        for i in range(20):
            time+=ri(0,1);kind=ri(1,3)
            if kind==1:
                id+=1;p=ri(0,4);e=time+ri(0,4);ops.append((1,time,id,p,e));offers[id]=(p,e)
            elif kind==2:
                who=ri(1,id+2);offers.pop(who,None);ops.append((2,time,who))
            else:
                ops.append((3,time));valid=[(p,who) for who,(p,e) in offers.items() if e>=time];out.append(sp(min(valid)) if valid else '-1')
        ops.append((3,time));valid=[(p,who) for who,(p,e) in offers.items() if e>=time];out.append(sp(min(valid)) if valid else '-1')
        record(436,fmt(len(ops),*ops),out,'普通字典保存報價，查詢完整篩效期並取(價格,編號)最小。')
        ops=[];stock=[];out=[];time=0
        for _ in range(20):
            time+=ri(0,1)
            if ri(0,1):
                qty=ri(1,7);e=time+ri(0,4);ops.append((1,time,qty,e));stock.append([e,qty])
            else:
                d=ri(1,10);ops.append((2,time,d));got=0;stock=[z for z in stock if z[0]>=time]
                for batch in sorted(stock):
                    x=min(d,batch[1]);batch[1]-=x;d-=x;got+=x
                out.append(got)
        ops.append((2,time,100));out.append(sum(q for e,q in stock if e>=time))
        record(437,fmt(len(ops),*ops),out,'每次出庫把普通批次列表依效期排序後逐批消耗。')
        n=ri(1,9);rows=[(ri(-3,4),ri(1,3)) for _ in range(n)]
        record(438,fmt(n,*rows),sp([next((j+1 for j in range(i+1,n) if rows[j][0]>h and rows[j][1]!=c),-1) for i,(h,c) in enumerate(rows)]),'每座塔直接向右逐一檢查，涵蓋等高與同色阻擋。')
        n=ri(1,9);L=ri(1,n);K=ri(1,n);rows=[(ri(1,3),ri(-6,6)) for _ in range(n)];valid=[sum(w for t,w in rows[l:r]) for l in range(n) for r in range(l+1,n+1) if r-l<=L and len({t for t,w in rows[l:r]})>=K]
        record(439,fmt([n,L,K],*rows),max(valid) if valid else 'IMPOSSIBLE','枚舉所有短區間，直接計不同種類與可負收益和。')
        K=ri(1,n);D=ri(1,n);rows=[(ri(1,3),ri(0,5)) for _ in range(n)];valid=[]
        for mask in subsets(n-1):
            bounds=[0]+[i+1 for i in range(n-1) if mask>>i&1]+[n];groups=[rows[l:r] for l,r in zip(bounds,bounds[1:])]
            if len(groups)<=K and all(len({t for t,w in g})<=D for g in groups):valid.append(max(sum(w for t,w in g) for g in groups))
        record(440,fmt([n,K,D],*rows),min(valid) if valid else -1,'枚舉全部切點，從批次最大重量最小化容量，不用二分貪心。')
        s=''.join(choice('abc') for _ in range(n));K=ri(0,n)
        record(441,fmt([n,K],s),sum(s[l]==s[r-1] and sum(s[i]!=s[i+1] for i in range(l,r-1))==K for l in range(n) for r in range(l+1,n+1)),'逐片段直接計轉色與首尾字母。')
        a=[ri(1,70) for _ in range(n)];ans=0
        for mask in range(1,1<<n):
            if mask.bit_count()%2:continue
            prod=math.prod(a[i] for i in range(n) if mask>>i&1);ans+=math.isqrt(prod)**2==prod
        record(442,fmt(n,a),ans,'枚舉偶數枚位置集合，實際大整數乘積及整數平方根。')
        points=rng.sample(list(itertools.product(range(4),repeat=2)),ri(1,12));rows=[(x,y,ri(0,1)) for x,y in points];A=ri(0,6);color={(x,y):c for x,y,c in rows};ans=0
        for x1,x2 in itertools.combinations(range(4),2):
            for y1,y2 in itertools.combinations(range(4),2):
                cs=[color.get((x1,y1)),color.get((x1,y2)),color.get((x2,y1)),color.get((x2,y2))]
                ans+=None not in cs and cs[0]==cs[3] and cs[1]==cs[2] and cs[0]!=cs[1] and (x2-x1)*(y2-y1)>=A
        record(443,fmt([len(rows),A],*rows),ans,'枚舉兩個x與兩個y構成的所有矩形，直接查四色。')
        n=ri(1,12);q=12;F=ri(1,n+1);a=[ri(1,4) for _ in range(n)];qs=[];out=[]
        for _ in range(q):
            l=ri(1,n);r=ri(l,n);qs.append((l,r));out.append(sum(c>=F for c in collections.Counter(a[l-1:r]).values()))
        record(444,fmt([n,q,F],a,*qs),out,'每次查詢重建完整頻率表，直接計達標種類。')
        n=ri(1,9);m=ri(1,9);a=[ri(-5,5) for _ in range(n)];cur=a.copy();ops=[]
        for _ in range(m):
            l=ri(1,n);r=ri(l,n);b=ri(-5,5);d=ri(-3,3);ops.append((l,r,b,d))
            for i in range(l-1,r):cur[i]+=b+(i-l+1)*d
        record(445,fmt([n,m],a,*ops),sp(cur),'逐次逐格套用等差更新，正負公差及單格皆可。')
        n=ri(3,10);K=ri(3,n);a=[ri(-6,6) for _ in range(n)];scores=[sum(sorted(a[i:i+K])[1:-1]) for i in range(n-K+1)];best=max(scores)
        record(446,fmt([n,K],a),sp([scores.index(best)+1,best]),'每窗真實排序刪首尾兩筆，保留最早最大分數。')
        n=ri(1,8);T=ri(1,3);g=[[ri(0,3) for _ in range(T)] for _ in range(T)];rows=[]
        for _ in range(n):
            s=ri(0,8);rows.append((s,ri(s+1,10),ri(1,T),ri(0,6)))
        vals=[]
        for mask in subsets(n):
            jobs=sorted(rows[i] for i in range(n) if mask>>i&1)
            if all(a[1]+g[a[2]-1][b[2]-1]<=b[0] for a,b in zip(jobs,jobs[1:])):vals.append(sum(r[3] for r in jobs))
        record(447,fmt([n,T],*g,*rows),max(vals),'枚舉申請集合，逐相鄰時段檢查有向轉場矩陣。')
        m=ri(1,4);counts=[ri(1,2) for _ in range(m)]
        if sum(counts)<2:counts[0]=2
        values=tuple(x for x,c in enumerate(counts) for _ in range(c));perms=set(itertools.permutations(values));ans=sum(all(p[i]!=p[(i+1)%len(p)] for i in range(len(p))) for p in perms)
        record(448,fmt(m,counts),ans,'直接枚舉去重後的有編號位置排列，檢查含首尾的所有鄰接。')
        points=rng.sample(list(itertools.product(range(-2,3),repeat=2)),ri(1,10));rows=[(x,y,ri(0,1)) for x,y in points];red=[(x,y) for x,y,c in rows if c];blue=[(x,y) for x,y,c in rows if not c];ans=0
        for (x,y),(u,v) in itertools.combinations(red,2):
            for a,b in blue:ans+=(x-a)*(v-b)==(y-b)*(u-a)
        record(449,fmt(len(rows),*rows),ans,'兩紅一藍直接用叉積零判共線，不用方向分組。')
        n=ri(1,8);s=''.join(choice('abcd') for _ in range(n));cur=list(s);ops=[];out=[]
        def palindromeable(chars):return sum(c%2 for c in collections.Counter(chars).values())<=1
        for _ in range(12):
            if ri(0,1):
                i=ri(1,n);c=choice('abcd');ops.append(f'1 {i} {c}');cur[i-1]=c
            else:
                l=ri(1,n);r=ri(l,n);ops.append(f'2 {l} {r}');a=cur[l-1:r];valid=False
                for mask in range(1,(1<<len(a))-1):
                    x=[c for i,c in enumerate(a) if mask>>i&1];y=[c for i,c in enumerate(a) if not mask>>i&1]
                    if palindromeable(x) and palindromeable(y):valid=True;break
                out.append('YES' if valid else 'NO')
        ops.append('2 1 1');out.append('NO')
        record(450,fmt([n,len(ops)],s,*ops),out,'每查詢枚舉所有分到兩個非空組的位置分配，再分別檢查可排迴文。')
        a=[ri(1,20) for _ in range(n)]
        record(451,fmt(n,a),sum(i%2!=j%2 and math.gcd(a[i],a[j])==1 for i in range(n) for j in range(i+1,n)),'逐位置對直接gcd並檢查位置奇偶。')
        n=ri(2,9);rows=[(ri(-8,8),ri(0,1)) for _ in range(n)];edges=[(i,ri(0,i-1)) for i in range(1,n)];valid=[]
        for cut in range(n-1):
            groups=components(n,edges[:cut]+edges[cut+1:])
            if all({rows[i][1] for i in group}=={0,1} for group in groups):valid.append(abs(sum(rows[i][0] for i in groups[0])-sum(rows[i][0] for i in groups[1])))
        record(452,fmt(n,*rows,*[(u+1,v+1) for u,v in edges]),min(valid) if valid else -1,'逐邊真實移除後重新建連通分量，逐組算雙類與收支。')
        h=ri(1,4);w=ri(1,4);T=ri(0,4);C=ri(0,3);board=[''.join(choice('...*#') for _ in range(w)) for _ in range(h)];ans=0
        for downs in itertools.combinations(range(h+w-2),h-1):
            downs=set(downs);i=j=0;cells=[board[0][0]];dirs=[]
            for step in range(h+w-2):
                d=int(step in downs);i+=d;j+=1-d;cells.append(board[i][j]);dirs.append(d)
            ans+='#' not in cells and cells.count('*')==C and sum(a!=b for a,b in zip(dirs,dirs[1:]))==T
        record(453,fmt([h,w,T,C],*board),ans,'枚舉所有向右/向下路徑，實際列出落點、方向及採樣。')
        n=ri(1,8);colors=[ri(0,1) for _ in range(n)];m=ri(1,10);edges=[(ri(0,n-1),ri(0,n-1)) for _ in range(m)];q=ri(1,m);deleted=rng.sample(range(m),q);A=ri(1,n);B=ri(1,n);out=[];off=set()
        for cut in deleted:
            off.add(cut);groups=components(n,[edge for i,edge in enumerate(edges) if i not in off]);out.append(sum(sum(colors[i]==0 for i in group)>=A and sum(colors[i]==1 for i in group)>=B for group in groups))
        record(454,fmt([n,m,q,A,B],colors,*[(u+1,v+1) for u,v in edges],*[i+1 for i in deleted]),out,'按封閉順序重建整張圖的連通分量，涵蓋平行邊、自環。')
        n=ri(1,9);K=ri(0,min(4,n));rows=[(ri(-7,7),ri(0,1)) for _ in range(n)];edges=[(i,ri(0,i-1)) for i in range(1,n)];valid=[]
        for chosen in itertools.combinations(range(n),K):
            chosen=set(chosen)
            if any(rows[i][1] for i in chosen) and not any(u in chosen and v in chosen for u,v in edges):valid.append(sum(rows[i][0] for i in chosen))
        record(455,fmt([n,K],*rows,*[(u+1,v+1) for u,v in edges]),max(valid) if valid else 'IMPOSSIBLE','枚舉恰K節點集合，直接檢查樹邊獨立性及備援。')
        n=ri(2,6);edges=[(ri(0,n-1),ri(0,n-1),ri(1,8),ri(0,1)) for _ in range(ri(0,12))];INF=10**9;d={(0,2,0):0}
        for _ in range(4*n):
            nd=d.copy()
            for (u,last,used),cost in d.items():
                for a,b,w,c in edges:
                    nu=used+int(last==c)
                    if a==u and nu<=1:key=(b,c,nu);nd[key]=min(nd.get(key,INF),cost+w)
            if nd==d:break
            d=nd
        vals=[cost for (u,c,k),cost in d.items() if u==n-1]
        record(456,fmt([n,len(edges)],*[(u+1,v+1,w,c) for u,v,w,c in edges]),min(vals) if vals else -1,'Bellman-Ford式有界全狀態鬆弛，獨立於優先佇列最短路。')
        n=ri(1,12);L=ri(0,5);H=ri(L+1,9);a=[ri(0,10) for _ in range(n)];states=[]
        for end in range(n):
            decisive=[x for x in a[:end+1] if x<=L or x>=H];states.append(bool(decisive and decisive[-1]<=L))
        record(457,fmt([n,L,H],a),sum(states),'每個前綴重新找最後一個跨門檻讀數，獨立重建開關。')
        n=ri(1,10);D=ri(0,8);B=ri(0,12);rows=[(ri(-4,4),ri(0,8)) for _ in range(n)]
        record(458,fmt([n,D,B],*rows),sum(abs(x-u)<=D and p+q<=B for i,(x,p) in enumerate(rows) for u,q in rows[:i]),'逐無序點對直接驗證兩條限制。')
        D=ri(0,6);B=ri(0,15);rows=[(ri(-5,5),ri(0,7)) for _ in range(n)];valid=[]
        for l in range(n):
            for r in range(l+1,n+1):
                temps=[t for t,c in rows[l:r]]
                if max(temps)-min(temps)<=D and sum(c for t,c in rows[l:r])<=B:valid.append(r-l)
        record(459,fmt([n,D,B],*rows),max(valid,default=0),'枚舉所有連續箱段，直接求溫度極差和耗能。')
        K=ri(1,n);B=ri(0,12);rows=[(ri(1,4),ri(0,6)) for _ in range(n)];ans=sum(len({t for t,w in rows[l:r]})==K and sum(w for t,w in rows[l:r])<=B for l in range(n) for r in range(l+1,n+1))
        record(460,fmt([n,K,B],*rows),ans,'逐段以集合計顏色及直接加總重量，不用至多相減。')
        S=ri(1,20);D=ri(1,n);rows=[(ri(1,4),ri(0,8)) for _ in range(n)];valid=[r-l for l in range(n) for r in range(l+1,n+1) if len({t for t,w in rows[l:r]})>=D and sum(w for t,w in rows[l:r])>=S]
        record(461,fmt([n,S,D],*rows),min(valid,default=-1),'逐段檢查種類與份量兩下限後取最短。')
        T=ri(1,4);B=ri(0,20);fees=[ri(0,7) for _ in range(T)];rows=[(ri(1,T),ri(0,5)) for _ in range(n)];valid=[r-l for l in range(n) for r in range(l+1,n+1) if sum(c for t,c in rows[l:r])+sum(fees[t-1] for t in {t for t,c in rows[l:r]})<=B]
        record(462,fmt([n,T,B],fees,*rows),max(valid,default=0),'逐片段重新建立種類集合並算一次性啟用費。')
        P=ri(0,9);D=ri(0,9);K=ri(0,9);Q=ri(0,12)
        record(463,fmt([P,D,K,Q]),sum(P+(D if i>K else 0) for i in range(1,Q+1)),'逐件按件號計價相加，含數量0。')
        L=ri(0,5);H=ri(L,8);a=[ri(0,10) for _ in range(n)];classes=[0 if x<L else 2 if x>H else 1 for x in a]
        record(464,fmt([n,L,H],a),sp([classes.count(i) for i in range(3)]),'直接分類每件並統計三種標籤，含相等門檻。')
        m=ri(1,12);ops=[ri(1,n) for _ in range(m)];queue=list(range(1,n+1))
        for p in ops:
            if p<n:queue=queue[:p-1]+[queue[p],queue[p-1]]+queue[p+1:]
        record(465,fmt([n,m],ops),sp(queue),'每次透過列表分段重建交換結果，包含最後位置不動。')
        h=ri(1,4);w=ri(1,4);rows=[[ri(-10,10) for _ in range(w)] for _ in range(h)]
        record(466,fmt([h,w],*rows),sum(rows[i][j] for i in range(h) for j in range(w) if (i+1+j+1)%2==0),'依1起算座標定義直接篩格相加。')
        sums=[sum(row) for row in rows];ranked=sorted(((-s,i+1) for i,s in enumerate(sums)))
        record(467,fmt([h,w],*rows),sp([ranked[0][1],-ranked[0][0]]),'列和以(-和,列號)排序取第一，含全負與並列。')
        s=''.join(choice('abcde') for _ in range(n));dist=[j-i for i in range(n) for j in range(i+1,n) if s[i]==s[j]]
        record(468,s,min(dist,default=-1),'枚舉所有不同位置的相同字母對，直接取距離最小。')
        a=[ri(0,5) for _ in range(n)];record(469,fmt(n,a),sum(a.count(x)==2 for x in set(a)),'對每個不同值用完整列表計次，僅取恰2次。')
        rows=[(ri(0,4),ri(0,4)) for _ in range(n)];winner=next(i+1 for i,(s,p) in enumerate(rows) if all(s>t or s==t and (p<q or p==q and i<=j) for j,(t,q) in enumerate(rows)))
        record(470,fmt(n,*rows),winner,'對每位選手直接檢查是否優於所有其他選手，涵蓋雙重平手。')
        S=ri(0,20);needs=[ri(1,12) for _ in range(n)];remaining=S;success=[]
        for q in needs:
            success.append(q<=remaining)
            if success[-1]:remaining-=q
        record(471,fmt([n,S],needs),sp([sum(success),remaining]),'按題目逐人服務記錄成功布林值，失敗後仍繼續。')
        C=ri(1,15);V=ri(0,C);changes=[ri(-20,20) for _ in range(n)];water=V
        for d in changes:
            if d>0:water+=min(d,C-water)
            else:water-=min(-d,water)
        record(472,fmt([n,C,V],changes),water,'分別按可用容量及可取水量限制，含兩側截斷。')
        s=''.join(choice('UDLR') for _ in range(n));moves={'U':(0,1),'D':(0,-1),'L':(-1,0),'R':(1,0)}
        record(473,s,sp([sum(moves[c][0] for c in s),sum(moves[c][1] for c in s)]),'向量位移相加直接求終點。')
        s=''.join(choice('abcdefghijklmnopqrstuvwxyz') for _ in range(n));pairs=dict(zip('aeiou','12345'))
        record(474,s,''.join(pairs.get(c,c) for c in s),'以獨立明確映射生成每字輸出。')
        K=choice([0,1,25,26,10**9]);alpha='abcdefghijklmnopqrstuvwxyz';out=''
        for i,c in enumerate(s,1):
            x=c
            for _ in range((K*i)%26):x=alpha[(alpha.index(x)+1)%26]
            out+=x
        record(475,fmt(s,K),out,'每個位置在字母環逐步前進等效餘數次，含大K。')
        s=''.join(choice('abc') for _ in range(n));out=''.join(c for i,c in enumerate(s) if s[:i+1].count(c)%2)
        record(476,s,out,'每位置重新計完整前綴出現次數，非狀態計數器。')
        ans=max(r-l for l in range(n) for r in range(l+1,n+1) if r-l-max(collections.Counter(s[l:r]).values())<=1)
        record(477,s,ans,'窮舉片段直接找最高頻率，長度減最高頻率即需改字數。')
        rect=[]
        for _ in range(ri(1,6)):
            x=ri(-3,2);y=ri(-3,2);rect.append((x,y,ri(x+1,4),ri(y+1,4)))
        ans=sum(sum(x1<=x<x2 and y1<=y<y2 for x1,y1,x2,y2 in rect)%2 for x in range(-3,4) for y in range(-3,4))
        record(478,fmt(len(rect),*rect),ans,'在整數座標小範圍逐單位方格直接計矩形覆蓋奇偶。')
        N=ri(1,3000);K=ri(0,4);record(479,fmt([N,K]),sum(str(x).count('7')==K and sum(map(int,str(x)))%7==0 for x in range(1,N+1)),'逐個正整數轉字串計7數量及數字和。')
        qs=[];out=[]
        for _ in range(8):
            g=ri(1,12);l=ri(1,60);T=ri(1,100);qs.append((g,l,T));out.append(sum(math.gcd(a,b)==g and math.lcm(a,b)==l and a+b<=T for a in range(1,l+1) for b in range(1,l+1)))
        record(480,fmt(len(qs),*qs),out,'枚舉所有a,b≤l，以gcd和lcm直接檢查，含g不整除l。')
        n=ri(1,10);k=ri(1,8);s=''.join(str(ri(0,9)) for _ in range(n));ans=0
        for mask in range(1,1<<n):
            t=''.join(s[i] for i in range(n) if mask>>i&1)
            ans+=t[0]!='0' and int(t)%k==0
        record(481,fmt([n,k],s),ans,'枚舉所有非空位置子集合，實際串接數字並整除。')
        L=ri(1,n);R=ri(L,n);record(482,fmt([n,L,R],s),sum(sum(map(int,s[l:r]))%3==0 for l in range(n) for r in range(l+L,min(n,l+R)+1)),'枚舉長度範圍內全部片段，直接算數字和。')
        a=[ri(0,4) for _ in range(n)];waiting=[sum(a[:i].count(x)%2 for x in set(a[:i])) for i in range(1,n+1)]
        record(483,fmt(n,a),sp([max(waiting),waiting[-1]]),'每個前綴重新統計奇數頻率顏色數作等待量。')
        T=ri(-5,5);a=[ri(-10,10) for _ in range(n)];remaining=a.copy();out=[]
        while remaining:
            x=min(remaining,key=lambda x:(abs(x-T),x));out.append(x);remaining.remove(x)
        record(484,fmt([n,T],a),sp(out),'反覆從剩餘值選距離最小、值最小者，保留重複份數。')
        a=[ri(-8,8) for _ in range(n)];totals=[sum(a[:i]) for i in range(1,n+1)];record(485,fmt(n,a),totals.index(max(totals))+1,'每個非空前綴重新求和，找最大值首次索引。')
        a=[ri(0,3) for _ in range(n)];pairs=list(zip(a,a[1:]+a[:1]));record(486,fmt(n,a),sum(x==y for x,y in pairs),'直接建立環形鄰座有序配對，包含N=1自配。')
        a=[ri(0,10**6) for _ in range(n)];record(487,fmt(n,a),sum(max(x,y)-min(x,y) for x,y in zip(a,a[1:])),'每段以高減低算起伏後相加。')
        record(488,fmt(n,a),sum(all(a[i]>x for x in a[:i]) for i in range(n)),'每盞直接與左方所有燈逐一比較，空前綴自然成立。')
        N=ri(1,15);S=ri(1,N);D=ri(0,100);station=S
        for _ in range(D):station=1 if station==N else station+1
        record(489,fmt([N,S,D]),station,'逐站前進D次，含N=1、零步及多圈。')
        A=ri(0,30);B=ri(0,30);X=ri(1,10);Y=ri(1,10);possible=[k for k in range(31) if k*X<=A and k*Y<=B]
        record(490,fmt([A,B,X,Y]),max(possible),'枚舉所有小包數逐一檢查紅藍庫存，含零庫存。')
        T=ri(0,100);K=ri(1,20);C=ri(1,20);units=sum(True for _ in range(0,T,K));record(491,fmt([T,K,C]),units*C,'按時間0,K,2K起始的實際計費區塊計數。')
    return CHECKS

def boundary_checks():
    # Closed forms and explicit constructions, independent of the solution code.
    record(381,fmt(*['........']*8),92,'經典全空八皇后棋盤，獨立排列窮舉確認92種。')
    record(381,fmt(*['********']*8),0,'沒有可放格，無法放任一皇后。')
    n=30000
    # Reverse activation: positions 2..n first, position 1 last. Component-size
    # union must keep this single-kind chain shallow when finding position 2.
    record(398,fmt([n,3],*[[1,0] for _ in range(n)],[1]+list(range(n,1,-1)),[0,1,n]),[n*(n-1)//2,(n-1)*(n-2)//2,0],'三萬同類連續展品，基礎0；剩m件價值直接為C(m,2)，檢查同類合併及長鏈。')
    n=1000
    record(419,fmt([n,n-1,20],*[[1,1] for _ in range(n)],*[[i,i+1] for i in range(1,n)]),20,'最大深度1000有向鏈，全部備援每站費1，至少20站下界可由包含起點的任意20站達成。')
    record(377,fmt([7,10],[5]*7),4,'同重5且容量10，最多每廂兩人，ceil(7/2)=4。')
    record(378,fmt([5,3,0],[7]*5,[7]*3),3,'完全相同需求與設備，最多受公寓數3限制。')
    record(388,fmt(3,[10**9,1,1]),1999999998,'兩個1各至少補999999999，64位增量。')
    record(402,fmt(6,*[(x,10**9) for x in range(-3,3)]),6000000000,'連續遞增座標奇偶交替，全部正能量都可取。')
    record(402,fmt(5,*[(7,-i) for i in range(1,6)]),-1,'全同座標不可接，全負能量應選單一最佳-1。')
    record(403,fmt(7,[4]*7),'0 7','全相等的七個旋轉均零逆序。')
    record(403,fmt(7,list(range(7))),'0 1','嚴增陣列只有原起點零逆序。')
    record(404,fmt([8,3,2],[-1]*8),-6,'三段各恰兩格、需兩個間隔，所有選值-1，最佳-6。')
    record(404,fmt([7,3,2],[1]*7),'IMPOSSIBLE','至少需3×2+2=8格，只有7格。')
    record(407,fmt(3,[0,1,0,0],[1,2,0,1],[2,3,0,0]),'0 7','三個零收益交替工作，八個子集合中僅{1,3}同色相鄰非法，含空共7種。')
    record(413,fmt(1,[0,10**18,999999937,0,999999929,0,999999893]),1,'兩週期互質，區間只含0及其lcm；0被排除，正lcm不被第三質數整除。')
    record(418,'60 1 60',1,'深度1只可能60個()串接，峰60。')
    record(418,'60 60 1',1,'只有60層全巢狀括號同時深度60、峰1。')
    record(422,fmt([16,0],[0,1]*8,*[[0 if i==j else -1 for j in range(16)] for i in range(16)]),0,'最大n只有零費用對角線可指派，K0合法。')
    record(425,fmt([2,2],[0,1],[1,2],[2,1]),0,'兩任務形成有向環，無拓撲排序。')
    record(436,fmt(7,[1,0,10,3,0],[1,0,5,3,1],[3,0],[2,0,5],[3,0],[3,1],[3,2]),['3 5','3 10','-1','-1'],'同價編號較小優先、取消、到期端點與過期。')
    record(440,fmt([3,1,1],[1,0],[2,0],[1,0]),-1,'全零重量仍需三批單種類，K1無論容量多大均無解。')
    record(450,fmt([2,2],'aa',[2,1,2],[2,1,1]),['YES','NO'],'aa可分兩個a，單字母不能分兩個非空組。')
    record(455,fmt([300,20],*[([10**9,0] if i==0 else [10**9,1]) for i in range(300)],*[[1,i+1] for i in range(1,300)]),20000000000,'最大n星形樹，選20個備援葉子互不相鄰，達20×10^9上界。')
    record(478,fmt(1,[-10**9,-10**9,10**9,10**9]),4000000000000000000,'單矩形2e9×2e9，面積4e18驗證64位。')
    record(478,fmt(2,[0,0,9,9],[0,0,9,9]),0,'兩張完全相同矩形，所有點覆蓋偶數次抵銷。')
    record(479,'1000000000000000000 19',0,'上界雖19位但只有10^18，不可能含19個7。')
    record(480,fmt(4,[1,10**12,2*10**12],[10**12,10**12,2*10**12],[10**12,10**12,2*10**12-1],[3,10**12,2*10**12]),[4,1,0,0],'10^12=2^12×5^12只有四種互質分配；g=l只有一組，T不足或g不整除l為零。')
    record(481,fmt([200000,20],'0'*200000),0,'最大長度全0，任何非空子序列都禁止以0起頭。')
    record(481,fmt([200000,1],'1'*200000),(pow(2,200000,1000000007)-1)%1000000007,'k1時每個非空位置子集合皆合法，答案2^n-1。')
    record(483,fmt(6,[0,0,0,0,0,0]),'1 0','每兩條同色完全配對，過程最大1、最後0。')
    record(485,fmt(3,[-9,-4,-2]),1,'全負交易，最大交易後餘額-9出現在第一筆。')
    record(486,fmt(1,[8]),1,'單座的下一座為自身，計一次。')
    record(487,fmt(1,[10**6]),0,'只有一高度沒有路段。')
    record(488,fmt(5,[0]*5),1,'全等亮度只有第一盞新紀錄。')
    record(491,'1000000000 1 1000000000',10**18,'最大時間及單價且K1，費用10^18。')
    # Maximum-depth chains validate stack safety and full-range 64-bit path sums.
    n=100000
    record(401,fmt([n,3],list(range(1,n)),*[[10**9,1] for _ in range(n)],[n,n],[n,n+1],[n,1]),[f'1 {n*10**9}','-1',f'{n} 1000000000'],'最大深度10萬標記鏈；第n祖先及超額k，路徑和10^14。')
    n=200000
    record(452,fmt(n,*[[10**9,i%2] for i in range(n)],*[[i,i+1] for i in range(1,n)]),0,'最大深度20萬雙色偶長鏈，正中切開兩邊收支相等且都有兩類。')
    n=50000
    record(456,fmt([n,n-1],*[[i,i+1,10**9,i%2] for i in range(1,n)]),(n-1)*10**9,'最大深度5萬有向鏈，唯一道路色交替，64位總費用。')
    return CHECKS

def run_saved_runtime(checks):
    if sys.platform=='win32':raise SystemExit('Use WSL kali-linux: verification only executes Linux programs.')
    lessons=json.loads((ROOT/'src/lib/newProblemLessons/data/practice4.json').read_text(encoding='utf-8'))
    if '--codes' in sys.argv:
        selected=set(sys.argv[sys.argv.index('--codes')+1].split(','))
        assert selected <= set(INPUT)
        lessons=[x for x in lessons if x['code'] in selected]
    for lesson in lessons:
        lesson['samples']=INPUT[lesson['code']]['samples']
        lesson['checks']=[c for c in checks if c['code']==lesson['code']]
    helper=ROOT/'scripts/lib/check-new-problem-lessons.py'
    p=subprocess.run([sys.executable,str(helper)],input=json.dumps(lessons,ensure_ascii=False),text=True,timeout=1800)
    raise SystemExit(p.returncode)


def add_final_five():
    add(492,'number-theory','medium','交換求和與整除商分塊',
        '每個因數d在d、2d、…、floor(n/d)d中各貢獻d，因此答案等於Σ d×floor(n/d)，d從1到n。交換加總順序沒有遺漏或重複任何因數貢獻。|目前左端為l，商q=floor(n/l)，具有相同商的最大右端為r=floor(n/q)。整段貢獻為q×(l+r)×(r-l+1)/2，接著令l=r+1，各段恰好分割1..n。|l不超過sqrt(n)的段數最多sqrt(n)；超過之後，商小於sqrt(n)，每個商只有一段，故總段數為O(sqrt(n))。|區間和乘積必為偶數，用整數除二即可。C++用__int128累積：n≤10^12時總和至多n²，可安全容納，最後對1000000007取餘數。',
        '時間O(√n)，額外O(1)個整數；Python大整數位數O(log n)，只讀一個整數。',
        '不能逐一計算到n。C++必須在乘法之前轉為__int128，避免先以64位相乘溢位。',
        r'''long long n;cin>>n;__int128 ans=0;
for(long long l=1;l<=n;){long long q=n/l,r=n/q;ans+=(__int128)(l+r)*(r-l+1)/2*q;l=r+1;}
cout<<(long long)(ans%1000000007)<<'\n';''',
        r'''n=int(sys.stdin.buffer.read());l=1;ans=0
while l<=n:
    q=n//l;r=n//q
    ans+=(l+r)*(r-l+1)//2*q
    l=r+1
print(ans%1000000007)''',steps3(
        ('首段','公開範例n=6；l=1時商6、右端1，貢獻6。',['[1,1]: 6'],[('累計',6)]),
        ('中段','l=2時商3，l=3時商2，兩段各貢獻6。',['[2,2]: 6','[3,3]: 6'],[('累計',18)]),
        ('尾段','l=4時商1、右端6，貢獻4+5+6=15。',['[4,6]: 15'],[('答案',33)])))
    add(493,'simulation','medium','隔板分段與迎向傾斜的寫入指標',
        '從傾斜方向最靠近終點的一端掃描每一列或欄。寫入指標t表示這段隔板區間的下一個石子位置；遇隔板便把t重設到隔板後一格。|遇石子時先清空原格，再把石子放到t，然後t前進一格。t不會越過目前掃描位置，也不會指向隔板，因此不會覆蓋未讀石子。原格等於目的格時仍要先清空再放入。|兩隔板之間的穩定排列必緊貼傾斜終點，否則仍可移動。石子數守恆，所以穩定排列唯一；寫入指標產生的正是此排列，等價於同時滑動。|U、D分別由上、下掃欄，L、R分別由左、右掃列。完成操作後掃盤面，累加一基座標乘積(r+1)×(c+1)。',
        '時間O(qhw)，儲存O(hw+q)；Python read().split()保留O(hw+q)輸入與盤面，輸出列表O(q)。',
        '逐顆石子逐格移動會多出長度因子。隔板後必須重設指標；座標從1開始。',
        r'''int h,w,q;cin>>h>>w>>q;vector<string>a(h);for(auto&s:a)cin>>s;string ops;cin>>ops;
for(char d:ops){bool vert=d=='U'||d=='D',rev=d=='D'||d=='R';int len=vert?h:w,lines=vert?w:h;
for(int line=0;line<lines;line++){int t=0;for(int k=0;k<len;k++){int pos=rev?len-1-k:k,r=vert?pos:line,c=vert?line:pos;
if(a[r][c]=='#')t=k+1;else if(a[r][c]=='o'){a[r][c]='.';int dest=rev?len-1-t:t;int rr=vert?dest:line,cc=vert?line:dest;a[rr][cc]='o';t++;}}}
long long ans=0;for(int r=0;r<h;r++)for(int c=0;c<w;c++)if(a[r][c]=='o')ans+=(r+1LL)*(c+1);cout<<ans<<'\n';}''',
        r'''v=sys.stdin.buffer.read().split();h,w,q=map(int,v[:3]);a=[bytearray(row) for row in v[3:3+h]];out=[]
for d in v[3+h]:
    vertical=d in (85,68);reverse=d in (68,82)
    length=h if vertical else w;lines=w if vertical else h
    for line in range(lines):
        t=0
        for k in range(length):
            pos=length-1-k if reverse else k
            r,c=(pos,line) if vertical else (line,pos)
            if a[r][c]==35:t=k+1
            elif a[r][c]==111:
                a[r][c]=46
                dest=length-1-t if reverse else t
                rr,cc=(dest,line) if vertical else (line,dest)
                a[rr][cc]=111;t+=1
    out.append(str(sum((r+1)*(c+1) for r,row in enumerate(a) for c,x in enumerate(row) if x==111)))
print('\n'.join(out))''',steps3(
        ('初始','公開範例2列4欄，依序R、D。',['o.#o','.o..'],[('石子',3)]),
        ('向右','第一列左段到第2欄，第二列石子到第4欄。',['.o#o','...o'],[('總和','2+4+8=14')]),
        ('向下','第2欄石子落到第二列，第4欄已填滿。',['..#o','.o.o'],[('總和','4+4+8=16')])) )
    add(494,'dp','hard','子序列DP：餘額、峰數與最後保留字元',
        '最少刪除等價於最長合格子序列。逐字處理，dp[b,p,t]保存最大保留長度：b是未配對左括號數，p是峰數，t=1表示末字元是左括號，t=0表示空或末字元是右括號。初始只有dp[0,0,0]=0。|刪除時複製上一層狀態。保留左括號令b加1、t變1，峰數不變；保留右括號必須b>0，令b減1、t變0，原t=1時峰數加1。超過K的狀態不保存。|峰是刪除後相鄰的()，因此要看最後保留字元，不能看原字串前一位置。禁止負餘額保證所有前綴合法，最後b=0就是合法括號序列。|依處理位置歸納：每種子序列的末步都是刪除或上述保留轉移，每個轉移也產生真實子序列。相同狀態的後續選擇相同，故只留最大長度不會失去最佳解。|最後取dp[0,K,0]；不可達輸出-1，否則輸出n減最大長度。K=0只能保留空，因為任何非空合法序列至少有一峰。',
        '時間O(n²(K+1))，只存前後兩層，DP記憶體O(n(K+1))；Python read().split()額外O(n)輸入。n≤100、K≤50。',
        '刪除會產生新相鄰峰，餘額相同仍須區分末字元。不可原地更新，否則同一字元可能重複使用。',
        r'''int K;string s;cin>>K>>s;int n=s.size(),z=K+1,size=(n+1)*z;vector<int>a(size,-1),b(size,-1);a[0]=0;
for(int i=0;i<n;i++){auto na=a,nb=b;for(int bal=0;bal<=i;bal++)for(int p=0;p<=K;p++){int j=bal*z+p;
if(s[i]=='('){int x=max(a[j],b[j]);if(x>=0)nb[j+z]=max(nb[j+z],x+1);}
else if(bal>0){if(a[j]>=0)na[j-z]=max(na[j-z],a[j]+1);if(p<K&&b[j]>=0)na[j-z+1]=max(na[j-z+1],b[j]+1);}}
a.swap(na);b.swap(nb);}cout<<(a[K]<0?-1:n-a[K])<<'\n';''',
        r'''v=sys.stdin.buffer.read().split();K=int(v[0]);s=v[1];n=len(s);z=K+1;size=(n+1)*z
a=[-1]*size;b=[-1]*size;a[0]=0
for i,ch in enumerate(s):
    na=a.copy();nb=b.copy()
    for bal in range(i+1):
        for p in range(z):
            j=bal*z+p
            if ch==40:
                x=max(a[j],b[j])
                if x>=0 and x+1>nb[j+z]:nb[j+z]=x+1
            elif bal:
                if a[j]>=0 and a[j]+1>na[j-z]:na[j-z]=a[j]+1
                if p<K and b[j]>=0 and b[j]+1>na[j-z+1]:na[j-z+1]=b[j]+1
    a,b=na,nb
print(-1 if a[K]<0 else n-a[K])''',steps3(
        ('第一對','公開範例S=()()、K=1，保留前兩字元。',['()'],[('餘額',0),('峰',1),('長度',2)]),
        ('第三字元','再保留左括號，餘額變1、峰不變。',['()('],[('餘額',1),('峰',1)]),
        ('完成','再保留右括號會變兩峰；最佳保留一對、刪兩字元。',['()'],[('最長',2),('最少刪除',2)])))
    add(495,'number-theory','easy','最大公因數的成對因數枚舉',
        'a、b的正公因數恰為g=gcd(a,b)的正因數：公因數必整除g，g的因數也必整除a、b，所以化成單一整數的因數問題。|枚舉d從1到floor(sqrt(g))，若g%d=0，同時檢查d與g/d。成對因數乘積為g，至少一個不超過平方根，因此全部因數都會被檢查。|反覆取個位並除10；若任何位是0、2、4、6、8便不符合。從一定合法的1開始，對符合條件的因數取最大值。',
        '時間O(log min(a,b)+√g log g)，含gcd及數字檢查；額外O(1)個整數。Python read().split()僅讀兩數，字元儲存O(log a+log b)。',
        '因數為奇數不代表各位皆奇數，例如105含0。需檢查成對的大因數；平方根重複檢查不影響最大值。',
        r'''int a,b;cin>>a>>b;int g=gcd(a,b),ans=1;auto good=[](int x){while(x){if((x%10)%2==0)return false;x/=10;}return true;};
for(int d=1;d*d<=g;d++)if(g%d==0){if(good(d))ans=max(ans,d);if(good(g/d))ans=max(ans,g/d);}cout<<ans<<'\n';''',
        r'''import math
a,b=map(int,sys.stdin.buffer.read().split());g=math.gcd(a,b);ans=1
def good(x):
    while x:
        if x%10%2==0:return False
        x//=10
    return True
for d in range(1,math.isqrt(g)+1):
    if g%d==0:
        if good(d):ans=max(ans,d)
        if good(g//d):ans=max(ans,g//d)
print(ans)''',steps3(
        ('化簡','公開範例165、105的最大公因數為15。',[15],[('g',15)]),
        ('首對','d=1對應15，每位皆奇數。',[1,15],[('最大',15)]),
        ('完成','d=3對應5；d=2不整除15，答案維持15。',[3,5],[('答案',15)])))
    add(496,'number-theory','medium','最小質因數篩與指數奇偶遞推',
        '埃氏篩建立最小質因數spf[x]：質數p從p²起更新仍未被較小質數標記的位置。合數必有不超過平方根的質因數，所以全部spf正確。|依序處理x=2..N，令p=spf[x]、m=x/p。cnt[x]是不同質因數數，par[x]是最小質因數的指數奇偶，bad[x]是指數為偶數的質因數數。1的三項皆0。|若m不含p，新增指數1：cnt[x]=cnt[m]+1、par[x]=1、bad[x]=bad[m]。若m仍含p，cnt不變、par翻轉；舊指數奇時bad加1，舊指數偶時bad減1。p仍是m的最小質因數，故par[m]正是要翻轉的項目。|每個x只從更小的m轉移，歸納可得三項正確。cnt[x]=K且bad[x]=0正好表示所有K種指數皆奇數。1沒有質因數，在K=0時另計入。|這不是平方自由條件，也不是總指數為奇數：8=2³符合K=1，12=2²×3因含偶指數不符合K=2。',
        '篩法O(N log log N)，遞推O(N)，記憶體O(N)。Python spf用array("I")，另三表用bytearray，約7(N+1)位元組加容器開銷；read().split()僅讀N、K。',
        '1在K=0時計入。偶指數2翻為奇指數3時bad要減1，不能把曾有偶指數永久標成不合法。',
        r'''int N,K;cin>>N>>K;vector<int>spf(N+1);iota(spf.begin(),spf.end(),0);for(int p=2;p*p<=N;p++)if(spf[p]==p)for(int x=p*p;x<=N;x+=p)if(spf[x]==x)spf[x]=p;
vector<unsigned char>cnt(N+1),par(N+1),bad(N+1);int ans=K==0;
for(int x=2;x<=N;x++){int p=spf[x],m=x/p;if(m%p){cnt[x]=cnt[m]+1;par[x]=1;bad[x]=bad[m];}else{cnt[x]=cnt[m];par[x]=par[m]^1;bad[x]=bad[m]+(par[m]?1:-1);}if(cnt[x]==K&&!bad[x])ans++;}cout<<ans<<'\n';''',
        r'''from array import array
from math import isqrt
N,K=map(int,sys.stdin.buffer.read().split());spf=array('I',range(N+1))
for p in range(2,isqrt(N)+1):
    if spf[p]==p:
        for x in range(p*p,N+1,p):
            if spf[x]==x:spf[x]=p
cnt=bytearray(N+1);par=bytearray(N+1);bad=bytearray(N+1);ans=int(K==0)
for x in range(2,N+1):
    p=spf[x];m=x//p
    if m%p:
        cnt[x]=cnt[m]+1;par[x]=1;bad[x]=bad[m]
    else:
        cnt[x]=cnt[m];par[x]=par[m]^1;bad[x]=bad[m]+(1 if par[m] else -1)
    if cnt[x]==K and bad[x]==0:ans+=1
print(ans)''',steps3(
        ('前幾項','公開範例N=30、K=2，6、10、14是兩個不同質數相乘。',[6,10,14],[('累計',3)]),
        ('排除偶次方','12、18、20有偶指數；15=3×5符合。',[15],[('累計',4)]),
        ('完成','再計21、22、24=2³×3、26；28有偶指數，30有3種質因數皆排除。',[21,22,24,26],[('答案',8)])))
    goals=['把因數總和轉為整除商分塊，處理10^12上界。','以線性掃描模擬四向傾斜並求石子座標和。','以末保留字元追蹤峰數，求最少括號刪除。','枚舉公因數並檢查各位是否皆奇數。','利用指數奇偶遞推計數指定種類的整數。']
    for x,g in zip(LESSONS[-5:],goals):
        x['goal']=g;x['traceLabel']='公開第一範例逐步追蹤'
        x['explanation']=[p for paragraph in x['explanation'] for p in paragraph.split('|')]


def final_five_checks():
    # Independent finite oracles, deliberately different from authored programs.
    start=len(CHECKS);rng=random.Random(49249620261103)
    def rec(code,inp,out,why):
        if any(inp.strip()==t['input'].strip() for t in INPUT['b'+str(code)]['samples']):return
        record(code,inp,out,why)
    for n in [1,2,3,4,5,7,16,25,100,999]+[rng.randint(1,250) for _ in range(15)]:
        ans=sum(d for x in range(1,n+1) for d in range(1,x+1) if x%d==0)%1000000007
        rec(492,str(n),ans,'每個整數逐一試除並累加全部因數，不使用整除分塊。')
    n=10**12;m=math.isqrt(n)
    ans=sum(d*(n//d) for d in range(1,m+1))+sum((n//k)*(n//k+1)//2 for k in range(1,m+1))-m*m*(m+1)//2
    rec(492,str(n),ans%1000000007,'最大n；獨立雙曲線分割：Σ_{d≤m}d floor(n/d)+Σ_{k≤m}T(floor(n/k))−m T(m)，m=√n。')
    def tilt(rows,ops):
        h=len(rows);w=len(rows[0]);walls={(r,c) for r in range(h) for c in range(w) if rows[r][c]=='#'}
        stones={(r,c) for r in range(h) for c in range(w) if rows[r][c]=='o'};out=[]
        for op in ops:
            dr,dc={'U':(-1,0),'D':(1,0),'L':(0,-1),'R':(0,1)}[op]
            while True:
                occupied=walls|stones
                moving={(r,c) for r,c in stones if 0<=r+dr<h and 0<=c+dc<w and (r+dr,c+dc) not in occupied}
                if not moving:break
                stones=(stones-moving)|{(r+dr,c+dc) for r,c in moving}
            out.append(sum((r+1)*(c+1) for r,c in stones))
        return out
    for _ in range(28):
        h=rng.randint(1,6);w=rng.randint(1,6);rows=[''.join(rng.choice('.#oo') for _ in range(w)) for _ in range(h)];ops=''.join(rng.choice('UDLR') for _ in range(12))
        rec(493,fmt([h,w,len(ops)],*rows,ops),tilt(rows,ops),'每輪只將前格空白的石子同步移一格，反覆至靜止；不用壓縮寫入指標。')
    for rows in [['#'],['.'],['o'],['o.#.oo..#o.'],['o','#','.','o','o','.']]:
        ops='UDLRRLLUDD';rec(493,fmt([len(rows),len(rows[0]),len(ops)],*rows,ops),tilt(rows,ops),'單列、單欄、單格與隔板邊界，獨立逐格同步模擬。')
    ops='UDLR'*250
    for char,total in [('o',sum(range(1,101))**2),('#',0)]:
        rec(493,fmt([100,100,1000],*[char*100]*100,ops),[total]*1000,'最大100×100盤面與1000操作；全石子或全隔板不動，總和為(1+…+100)²或0。')
    rows=['o'+'.'*99]+['.'*100]*99;r=c=1;out=[]
    for op in ops:
        if op=='U':r=1
        elif op=='D':r=100
        elif op=='L':c=1
        else:c=100
        out.append(r*c)
    rec(493,fmt([100,100,1000],*rows,ops),out,'最大盤面單石子，每次一個座標變1或100，直接計算乘積。')
    for _ in range(45):
        n=rng.randint(1,12);ss=''.join(rng.choice('()') for _ in range(n));K=rng.randint(0,6);best=-1
        for mask in range(1<<n):
            t=''.join(ss[i] for i in range(n) if mask>>i&1);b=0
            for ch in t:
                b+=1 if ch=='(' else -1
                if b<0:break
            else:
                if b==0 and t.count('()')==K:best=max(best,len(t))
        rec(494,fmt(K,ss),-1 if best<0 else n-best,'枚舉全部保留位置子集合，實際建立子序列檢查前綴平衡與相鄰()數。')
    for K,ss,out,why in [(0,'()'*50,100,'非空合法序列必有峰，K0只能空。'),(50,'()'*50,0,'長100、50峰，原字串已符合，零刪除達下界。'),(1,'('*50+')'*50,0,'巢狀深度50只有中心一峰，零刪除。'),(50,'('*50+')'*50,-1,'所有子序列左括號都在右括號前，非空合法時只有一峰。'),(50,')'*100,-1,'沒有左括號，無法產生峰。'),(1,'('*100,-1,'沒有右括號，無法產生峰。')]:
        rec(494,fmt(K,ss),out,why)
    for a,b in [(1,1),(1000000,1000000),(999999,999999),(121,121),(105,105),(999983,1000000)]+[(rng.randint(1,400),rng.randint(1,400)) for _ in range(25)]:
        ans=max(d for d in range(1,min(a,b)+1) if a%d==0 and b%d==0 and all(c in '13579' for c in str(d)))
        rec(495,fmt([a,b]),ans,'直接從1至min(a,b)枚舉，分別檢查整除兩數與字串每位；不用gcd因數配對。')
    def qualifies(x,K):
        d=2;k=0
        while d*d<=x:
            e=0
            while x%d==0:x//=d;e+=1
            if e:
                if e%2==0:return False
                k+=1
            d+=1
        if x>1:k+=1
        return k==K
    for n,K in [(1,k) for k in range(9)]+[(rng.randint(2,700),rng.randint(0,8)) for _ in range(25)]+[(8,1),(12,2),(24,2),(36,2)]:
        rec(496,fmt([n,K]),sum(qualifies(x,K) for x in range(1,n+1)),'每個整數獨立試除並計算實際指數，不使用SPF或奇偶遞推。')
    n=1000000
    rec(496,fmt([n,0]),1,'最大N、K0只有1沒有質因數。')
    rec(496,fmt([n,8]),0,'前8質數乘積9699690>N，不可能有8種質因數。')
    primes=bytearray(b'\x01')*(n+1);primes[0:2]=b'\x00\x00'
    for p in range(2,math.isqrt(n)+1):
        if primes[p]:primes[p*p:n+1:p]=b'\x00'*((n-p*p)//p+1)
    powers=[]
    for p in range(2,n+1):
        if primes[p]:
            v=p
            while v<=n:powers.append(v);v*=p*p
    assert len(powers)==78541 and len(powers)==len(set(powers))
    rec(496,fmt([n,1]),len(powers),'最大N、K1，獨立布林質數篩後枚舉每個質數的p,p³,p⁵,…；確認不同質數冪互異，共78541。')
    return CHECKS[start:]


def append_final_five():
    # Byte-preserving append: never regenerate the verified first 116 entries.
    add_final_five();new_lessons=LESSONS[-5:];new_checks=final_five_checks()
    for path,items in [(ROOT/'src/lib/newProblemLessons/data/practice4.json',new_lessons),(ROOT/'scripts/fixtures/new-problem-lessons/practice4-checks.json',new_checks)]:
        raw=path.read_bytes();old=json.loads(raw);existing={x['code'] for x in old}
        assert not existing&{x['code'] for x in items},'Already appended: refusing duplicates/overwrite.'
        end=raw.rfind(b']');prefix=raw[:end].rstrip()
        tail=json.dumps(items,ensure_ascii=False,indent=2)[1:-1].strip('\n').encode()
        updated=prefix+b',\n'+tail+b'\n]\n';parsed=json.loads(updated)
        assert parsed[:len(old)]==old and updated.startswith(prefix)
        path.write_bytes(updated)
    print(f'Appended {len(new_lessons)} lessons and {len(new_checks)} independent cases; existing bytes preserved.',flush=True)

def final_five_stress():
    # Live public limits checked 2026-11-03: /problems/b492..b496.
    # Python multiplier 3 from src/lib/languages.ts and judgeCore.ts.
    if sys.platform=='win32':raise SystemExit('Use WSL kali-linux: compile/run Linux binaries only.')
    import hashlib,time
    data=json.loads((ROOT/'src/lib/newProblemLessons/data/practice4.json').read_text(encoding='utf8'))
    checks=json.loads((ROOT/'scripts/fixtures/new-problem-lessons/practice4-checks.json').read_text(encoding='utf8'))
    base={'b492':1,'b493':3,'b494':4,'b495':3,'b496':3}
    with tempfile.TemporaryDirectory(prefix='practice4-final-five-',dir='/tmp') as folder:
        folder=pathlib.Path(folder)
        for lesson in data:
            code=lesson['code']
            if code not in base:continue
            cases=[c for c in checks if c['code']==code and ('最大' in c['reason'] or len(c['input'])>=100 and code=='b494')]
            if code=='b495':cases=[c for c in checks if c['code']==code and c['input'].strip() in ('1000000 1000000','999999 999999')]
            cpp=folder/(code+'.cpp');exe=folder/code;py=folder/(code+'.py')
            cpp.write_text(lesson['cpp'],encoding='utf8');py.write_text(lesson['python'],encoding='utf8')
            subprocess.run(['g++','-std=c++17','-O2',str(cpp),'-o',str(exe)],check=True,capture_output=True,timeout=120)
            results=[]
            for case in cases:
                for language,command,budget in [('cpp',[str(exe)],base[code]),('python',[sys.executable,str(py)],base[code]*3)]:
                    started=time.monotonic()
                    p=subprocess.run(command,input=case['input'],text=True,capture_output=True,timeout=budget)
                    elapsed=time.monotonic()-started
                    assert p.returncode==0 and p.stdout.strip()==case['output'].strip(),(code,language,case['reason'],p.stdout,p.stderr)
                    results.append(dict(language=language,seconds=round(elapsed,4),budgetSeconds=budget,inputSha256=hashlib.sha256(case['input'].encode()).hexdigest(),expectedSha256=hashlib.sha256(case['output'].encode()).hexdigest()))
            print(json.dumps(dict(code=code,cppSha256=hashlib.sha256(lesson['cpp'].encode()).hexdigest(),pythonSha256=hashlib.sha256(lesson['python'].encode()).hexdigest(),stress=results)),flush=True)

if __name__=='__main__':
    if '--append-new' in sys.argv:append_final_five()
    if '--stress-final' in sys.argv:final_five_stress()
    if '--check-final-oracles' in sys.argv:
        generated=final_five_checks()
        saved=json.loads((ROOT/'scripts/fixtures/new-problem-lessons/practice4-checks.json').read_text(encoding='utf8'))
        assert generated==[c for c in saved if c['code']>='b492']
        print(f'Independent final-five oracles reproduced: {len(generated)} cases.')
    if '--samples' in sys.argv:public_smoke()
    if '--write' in sys.argv:
        add_final_five()
        checks=build_checks();boundary_checks();final_five_checks()
        assert {x['code'] for x in checks}==set(INPUT)
        assert len(LESSONS)==len(INPUT)==121
        checkpoint()
        (ROOT/'scripts/fixtures/new-problem-lessons/practice4-checks.json').write_text(json.dumps(CHECKS,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
        print(f'Wrote {len(LESSONS)} lessons, {len(CHECKS)} independent cases.',flush=True)
    if '--verify' in sys.argv:
        checks=json.loads((ROOT/'scripts/fixtures/new-problem-lessons/practice4-checks.json').read_text(encoding='utf8'))
        run_saved_runtime(checks)
