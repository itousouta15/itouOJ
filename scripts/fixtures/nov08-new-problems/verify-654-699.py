#!/usr/bin/env python3
"""Reproducible authorship and independent oracle checks. Run under Linux/WSL.
--author writes the lesson JSON; default verifies existing lessons with g++17/Python.
All executable artifacts live in tempfile.TemporaryDirectory under /tmp.
"""
import json, sys, random, itertools, collections, math, subprocess, tempfile, pathlib, time
ROOT = pathlib.Path(__file__).resolve().parents[3]
HERE = pathlib.Path(__file__).resolve().parent
SOURCE = {p['code']:p for p in json.loads((HERE/'source.json').read_text(encoding='utf-8'))}
DEST = ROOT/'src/lib/newProblemLessons/data/nov08-654-699.json'
LESSONS=[]
HEADER='#include <bits/stdc++.h>\nusing namespace std; using ll=long long; const ll MOD=1000000007;\n'
def add(num,topic,concept,explain,complexity,pitfall,trace,py,cpp):
    code=f'b{num}'; s=SOURCE[code]
    steps=[]
    for title,desc,cells,key,val in trace:
        steps.append(dict(title=title,description=desc,cells=cells.split('|'),active=list(range(len(cells.split('|')))),variables=[[key,str(val)]]))
    LESSONS.append(dict(code=code,title=s['title'].split('. ',1)[1],topic=topic,level='hard',concept=concept,goal='掌握'+concept+'，依題目的限制正確建立狀態與轉移。',explanation=explain.split('\n'),complexity=complexity,pitfall=pitfall,sampleInput=s['samples'][0]['input'],sampleOutput=s['samples'][0]['output'],traceLabel='獨立教學例子的狀態推演（與公開範例分開）。',trace=steps,python=py.strip()+'\n',cpp=HEADER+cpp.strip()+'\n'))

add(654,'data-structures','堆疊與每字母位置串列的攤銷分析',
r'''紀錄帶只會在右端新增或刪除，所以用堆疊保存字母，另替 26 個字母保存仍在帶上的位置。加入 c 後，若位置數等於門檻，就取 c 的第一個位置作為截斷點，逐個彈出後綴，並同步彈出那些字母的位置。
每一步開始時，位置串列恰好描述帶上所有同字母位置；加入與同步刪除都維持這個不變量。因此第一個位置就是題目要求的最左 c。每個輸入字元只入棧一次、出棧至多一次，整趟刪除總量不超過 n；最大長度必須在刪除完成後才更新。''',
'時間 O(n)，帶與位置串列 O(n+26)；Python 讀入字串及 split 緩衝 O(n)，整體 O(n)。',
'不可保留已刪字元的計次；q=1 時本次完整操作的長度不會增加。',
[('附加首字','門檻 a=2、b=2，讀入 aba。','a','長度',1),('附加異字','尚未達到任何門檻。','a|b','最大長度',2),('回收後綴','第二個 a 使整段 aba 刪除。','空帶','長度',0)],
r'''import sys
t=sys.stdin.buffer.read().split(); n=int(t[0]); q=list(map(int,t[1:27]))
pos=[[] for _ in range(26)]; st=[]; ans=0
for c in t[27]:
    c-=97; pos[c].append(len(st)); st.append(c)
    if len(pos[c])==q[c]:
        cut=pos[c][0]
        while len(st)>cut: pos[st.pop()].pop()
    ans=max(ans,len(st))
print(ans)''',
r'''int main(){ios::sync_with_stdio(false);cin.tie(nullptr); int n;cin>>n;vector<int> q(26);for(int &x:q)cin>>x;string s;cin>>s;vector<int> st;vector<vector<int>> p(26);int ans=0;for(char ch:s){int c=ch-'a';p[c].push_back(st.size());st.push_back(c);if(p[c].size()==q[c]){int cut=p[c][0];while(st.size()>cut){p[st.back()].pop_back();st.pop_back();}}ans=max(ans,(int)st.size());}cout<<ans<<'\n';}''')

add(655,'trees','單次加速的樹上最佳回報 DP',
r'''對每個節點保存 normal（完全不加速）與 best（恰在該子樹選一葉加速）的時刻。葉的兩值為 a 與 max(0,a−B)。由於父編號較小，可逆編號處理。非葉先將孩子 normal 排序，取得第 k 小基準值。
若只改孩子 j，其餘孩子的第 k−1 小、第 k 小分別為 lo、hi（k=1 時 lo=0，沒有第 k 小時 hi=無限大）。替換後第 k 小為 min(hi,max(lo,best[j]))。依 j 在排序中的名次，可從原排序直接查到這兩個值。枚舉被加速的唯一孩子取最小，再加本節點延遲，已涵蓋所有合法葉選擇；不能把多個孩子的 best 同時使用。''',
'排序總時間 O(n log n)，狀態、孩子與 Python 輸入緩衝 O(n)。64 位元可容納最多約 2×10^14 的根時刻。',
'加速只作用於一片葉；相等時刻仍是不同孩子，排序時不能去重。',
[('兩葉原時刻','根門檻 k=2、延遲 1；葉為 5、9，B=6。','5|9','原根時刻',10),('加速第一葉','變成 0、9，第 2 小仍是 9。','0|9','根時刻',10),('加速第二葉','變成 5、3，第 2 小為 5。','5|3','最佳根時刻',6)],
r'''import sys
it=iter(map(int,sys.stdin.buffer.read().split())); n=next(it); B=next(it)
ch=[[] for _ in range(n)]; k=[]; a=[]
for i in range(n):
    p=next(it); k.append(next(it)); a.append(next(it))
    if p: ch[p-1].append(i)
normal=[0]*n; best=[0]*n
for u in range(n-1,-1,-1):
    if not ch[u]: normal[u]=a[u]; best[u]=max(0,a[u]-B); continue
    vs=sorted(ch[u],key=lambda v:normal[v]); x=[normal[v] for v in vs]; z=k[u]-1
    normal[u]=x[z]+a[u]; b=10**30
    for j,v in enumerate(vs):
        lo=0 if z==0 else x[z-1+(j<z)]
        hi=x[z+(j<=z)] if z+(j<=z)<len(x) else 10**30
        b=min(b,min(hi,max(lo,best[v])))
    best[u]=b+a[u]
print(best[0])''',
r'''int main(){ios::sync_with_stdio(false);cin.tie(nullptr);int n;ll B;cin>>n>>B;vector<vector<int>> ch(n);vector<int> k(n);vector<ll>a(n),d(n),b(n);for(int i=0,p;i<n;i++){cin>>p>>k[i]>>a[i];if(p)ch[p-1].push_back(i);}const ll INF=4e18;for(int u=n-1;u>=0;u--){if(ch[u].empty()){d[u]=a[u];b[u]=max(0LL,a[u]-B);continue;}auto v=ch[u];sort(v.begin(),v.end(),[&](int x,int y){return d[x]<d[y];});int z=k[u]-1;d[u]=d[v[z]]+a[u];b[u]=INF;for(int j=0;j<(int)v.size();j++){ll lo=z?d[v[z-1+(j<z)]]:0;int h=z+(j<=z);ll hi=h<(int)v.size()?d[v[h]]:INF;b[u]=min(b[u],min(hi,max(lo,b[v[j]]))+a[u]);}}cout<<b[0]<<'\n';}''')

add(656,'dp','啟充固定費的前綴最小值轉移',
r'''dp[e] 表示抵達目前站、電量恰為 e 的最小費用。若充電後為 y，跳過充電只能由 e=y 轉移；真正充電則從所有 e<y 取 dp[e]+f+p(y−e)，等於 f+py+min(dp[e]−pe)。按 y 遞增掃描即可維護這個嚴格前綴最小值。
只對 y≥d 產生下一站電量 y−d，且掃描到 y 後才把 dp[y] 加入前綴，避免把零充電誤收啟充費。所有可行充電量均對應唯一 e,y，故轉移完整。終點剩電無價值但合法，答案取所有終點狀態最小值。''',
'時間 O(nC)，在 n,C≤2000 時至多約四百萬狀態；滾動陣列 O(C)，Python 一次讀入的緩衝 O(n)，總 O(n+C)。',
'd=0 也能跳站，不能強迫每站付 f；費用必須使用 64 位元。',
[('初站空電','容量 3，路耗 2、1；第一站 p=1,f=5。','0','初始費用',0),('一次買足','第一站補 3，花 8，行駛後剩 1。','1','累積費用',8),('跳過第二站','第二站不充電，耗盡最後 1；若分兩站啟充會多付固定費。','0','最小費用',8)],
r'''import sys
it=iter(map(int,sys.stdin.buffer.read().split())); n=next(it); C=next(it); inf=10**30
dp=[inf]*(C+1); dp[0]=0
for _ in range(n):
    d,p,f=next(it),next(it),next(it); nd=[inf]*(C+1); pref=inf
    for y in range(C+1):
        if y>=d: nd[y-d]=min(dp[y],pref+f+p*y)
        pref=min(pref,dp[y]-p*y)
    dp=nd
print(min(dp))''',
r'''int main(){ios::sync_with_stdio(false);cin.tie(nullptr);int n,C;cin>>n>>C;const ll INF=4e18;vector<ll>dp(C+1,INF);dp[0]=0;while(n--){ll d,p,f;cin>>d>>p>>f;vector<ll> nd(C+1,INF);ll pref=INF;for(int y=0;y<=C;y++){if(y>=d)nd[y-d]=min(dp[y],pref+f+p*y);pref=min(pref,dp[y]-p*y);}dp.swap(nd);}cout<<*min_element(dp.begin(),dp.end())<<'\n';}''')

add(657,'graphs','按抵達時間排序的配額事件佇列',
r'''配額為零的點直接在時刻零啟動，將其出邊訊號加入最小堆。其餘點保存尚缺訊號數，每彈出一個抵達事件便減一；首次減至零時立即確定啟動時刻並發送出邊訊號。
由於邊延遲為正，啟動所造成的新事件必晚於目前事件。堆依時間處理，故某點收到的第 q 個訊號就是最早能滿足配額的時刻。環本身不會無中生有產生事件；堆空後仍未啟動的點即無法再收到足夠訊號。''',
'每條邊至多產生一事件，時間 O((n+m) log(m+1))，圖、事件與 Python 讀入緩衝 O(n+m)。',
'訊號永久累積；已啟動的點不能再次發送。同時抵達仍算多份，不是只算一個時間。',
[('初始啟動','q=(0,1,1)，邊 1→2 延遲2、2→3 延遲3。','0|-1|-1','待處理事件',1),('抵達第二點','時刻2使節點2首次滿額。','0|2|-1','下一事件時刻',5),('抵達第三點','時刻5使節點3啟動。','0|2|5','已啟動數',3)],
r'''import sys,heapq
it=iter(map(int,sys.stdin.buffer.read().split())); n=next(it); m=next(it); q=[next(it) for _ in range(n)]; g=[[] for _ in range(n)]
for _ in range(m):
    u,v,w=next(it)-1,next(it)-1,next(it); g[u].append((v,w))
ans=[-1]*n; h=[]
for u in range(n):
    if q[u]==0:
        ans[u]=0
        for v,w in g[u]: heapq.heappush(h,(w,v))
while h:
    t,v=heapq.heappop(h)
    if ans[v]!=-1: continue
    q[v]-=1
    if q[v]==0:
        ans[v]=t
        for z,w in g[v]: heapq.heappush(h,(t+w,z))
print(*ans)''',
r'''int main(){ios::sync_with_stdio(false);cin.tie(nullptr);int n,m;cin>>n>>m;vector<int>q(n);for(int&x:q)cin>>x;vector<vector<pair<int,ll>>>g(n);for(int i=0,u,v;i<m;i++){ll w;cin>>u>>v>>w;g[u-1].push_back({v-1,w});}vector<ll>a(n,-1);priority_queue<pair<ll,int>,vector<pair<ll,int>>,greater<pair<ll,int>>>h;for(int u=0;u<n;u++)if(!q[u]){a[u]=0;for(auto[v,w]:g[u])h.push({w,v});}while(!h.empty()){auto[t,u]=h.top();h.pop();if(a[u]!=-1)continue;if(--q[u]==0){a[u]=t;for(auto[v,w]:g[u])h.push({t+w,v});}}for(ll x:a)cout<<x<<' ';cout<<'\n';}''')

add(658,'geometry','有限平移枚舉與補集連通塊',
r'''非空交集要求 dx 在 [1−hB,hA−1]、dy 在 [1−wB,wA−1]；只需枚舉這些位移。以黑格集合建立交集與聯集，先檢查兩者是否各自四連通。周長可由每個黑格四鄰中不存在的格數相加。
在涵蓋兩圖的矩形外再加一圈白格。白格洪水填充的連通塊中，恰一塊接觸外框，代表無限背景，其餘每塊各是一個洞。因此白塊總數恰為二才合格。枚舉每個位移一次，再對最小周長累加位移數，就算聯集相同也不會漏算不同位移。''',
'設 T=(hA+hB−1)(wA+wB−1)，G=(hA+hB+2)(wA+wB+2)。時間 O(TG)、額外 O(G)；尺寸至多35時 T≤4761、G≤5184。Python 圖樣與輸入緩衝 O(G)，沒有枚舉無界平面。',
'白洞也用四連通，不能用對角逃出；全白圖直接無解。外框要額外一圈。',
[('外框圖樣','A 是 3×3 黑環，B 單黑格放在左上角。','111|101|111','交集格數',1),('檢查白洞','中央白格無法四連通走到外部，聯集仍為黑環。','外部白|中央洞','洞數',1),('計算周長','外側12條邊加內側4條；單格可放在8個黑格上。','12|4','最小周長',16)],
r'''import sys
t=sys.stdin.buffer.read().split(); ha,wa,hb,wb=map(int,t[:4]); A={(r,c) for r in range(ha) for c in range(wa) if t[4+r][c]==49}; B={(r,c) for r in range(hb) for c in range(wb) if t[4+ha+r][c]==49}
dirs=((1,0),(-1,0),(0,1),(0,-1))
def components(s,stop=10**9):
    s=set(s); count=0
    while s:
        count+=1
        if count>stop: return count
        stack=[s.pop()]
        while stack:
            r,c=stack.pop()
            for dr,dc in dirs:
                z=(r+dr,c+dc)
                if z in s: s.remove(z); stack.append(z)
    return count
best=10**9; ways=0
if A and B:
    for dx in range(1-hb,ha):
        for dy in range(1-wb,wa):
            V={(r+dx,c+dy) for r,c in B}; I=A&V
            if not I or components(I,1)!=1: continue
            U=A|V
            if components(U,1)!=1: continue
            x0=min(0,dx)-1; x1=max(ha,dx+hb); y0=min(0,dy)-1; y1=max(wa,dy+wb)
            W={(r,c) for r in range(x0,x1+1) for c in range(y0,y1+1)}-U
            if components(W,2)!=2: continue
            per=sum((r+dr,c+dc) not in U for r,c in U for dr,dc in dirs)
            if per<best: best=per; ways=1
            elif per==best: ways+=1
print(best if ways else -1,ways)''',
r'''int main(){ios::sync_with_stdio(false);cin.tie(nullptr);int ha,wa,hb,wb;cin>>ha>>wa>>hb>>wb;vector<pair<int,int>>A,B;string s;for(int r=0;r<ha;r++){cin>>s;for(int c=0;c<wa;c++)if(s[c]=='1')A.push_back({r,c});}for(int r=0;r<hb;r++){cin>>s;for(int c=0;c<wb;c++)if(s[c]=='1')B.push_back({r,c});}if(A.empty()||B.empty()){cout<<"-1 0\n";return 0;}int best=INT_MAX,ways=0;int dr[]={1,-1,0,0},dc[]={0,0,1,-1};for(int dx=1-hb;dx<ha;dx++)for(int dy=1-wb;dy<wa;dy++){int x0=min(0,dx)-1,y0=min(0,dy)-1,H=max(ha,dx+hb)-x0+1,W=max(wa,dy+wb)-y0+1;vector<int>a(H*W),b(H*W);for(auto[r,c]:A)a[(r-x0)*W+c-y0]=1;for(auto[r,c]:B)b[(r+dx-x0)*W+c+dy-y0]=1;auto comp=[&](int kind){vector<char>vis(H*W);int ans=0;for(int i=0;i<H*W;i++){bool ok=kind==0?(a[i]&&b[i]):kind==1?(a[i]||b[i]):!(a[i]||b[i]);if(!ok||vis[i])continue;ans++;vector<int>st{i};vis[i]=1;while(!st.empty()){int z=st.back();st.pop_back();int r=z/W,c=z%W;for(int d=0;d<4;d++){int nr=r+dr[d],nc=c+dc[d];if(nr<0||nr>=H||nc<0||nc>=W)continue;int j=nr*W+nc;bool good=kind==0?(a[j]&&b[j]):kind==1?(a[j]||b[j]):!(a[j]||b[j]);if(good&&!vis[j]){vis[j]=1;st.push_back(j);}}}}return ans;};if(comp(0)!=1||comp(1)!=1||comp(2)!=2)continue;int per=0;for(int r=1;r<H-1;r++)for(int c=1;c<W-1;c++)if(a[r*W+c]||b[r*W+c])for(int d=0;d<4;d++){int j=(r+dr[d])*W+c+dc[d];per+=!(a[j]||b[j]);}if(per<best){best=per;ways=1;}else if(per==best)ways++;}cout<<(ways?best:-1)<<' '<<ways<<'\n';}''')

add(659,'dp','值域有界的區間最小代價與樹形計數',
r'''設 dp[l,r][v]=(最少限幅次數,方案數)，葉只有輸入值、代價零、方案一。枚舉根切點 k 與左右可達值 x,y，以原第 k 個運算符計算 z，再夾到 [−B,B]，額外代價是未夾值超出範圍的布林值。
固定切點與左右樹形唯一決定一棵樹，且每棵完整二元樹有唯一根切點，因此乘左右方案數、同代價相加不會重複。對相同區間值只保留最低代價，因為祖先只看值，較高代價永不可能改善答案。這也是不能只保留區間最小值或最大值的原因。''',
'時間 O(n³(2B+1)²)，空間 O(n²(2B+1))；n≤45、B≤15，約一千五百萬對值合併上界。Python 輸入 O(n)，稀疏字典只儲存可達值。',
'恰好等於邊界不算限幅；計數是樹形，不能把相同結果的不同切點合併成一種。',
[('兩種根切點','數列 2,2,−2，B=2，皆為加號。','2|2|-2','樹形數',2),('左子樹先算','(2+2) 夾成2，再加−2為0。','2|-2','限幅次數',1),('右子樹先算','2+(2−2)=2，全程不用限幅。','2|0','目標2的最少次數',0)],
r'''import sys
t=sys.stdin.buffer.read().split(); n,B,T=map(int,t[:3]); a=list(map(int,t[3:3+n])); ops=t[3+n].decode() if n>1 else ''; M=1000000007
dp=[[{} for _ in range(n)] for _ in range(n)]
for i,x in enumerate(a): dp[i][i][x]=(0,1)
for length in range(2,n+1):
    for l in range(n-length+1):
        r=l+length-1; cur=dp[l][r]
        for k in range(l,r):
            for x,(cx,nx) in dp[l][k].items():
                for y,(cy,ny) in dp[k+1][r].items():
                    z=x+y if ops[k]=='+' else x-y; c=cx+cy+(abs(z)>B); v=max(-B,min(B,z)); ways=nx*ny%M
                    old=cur.get(v,(10**9,0))
                    if c<old[0]: cur[v]=(c,ways)
                    elif c==old[0]: cur[v]=(c,(old[1]+ways)%M)
print(*dp[0][n-1].get(T,(-1,0)))''',
r'''int main(){ios::sync_with_stdio(false);cin.tie(nullptr);int n,B,T;cin>>n>>B>>T;vector<int>a(n);for(int&x:a)cin>>x;string op;if(n>1)cin>>op;using P=pair<int,ll>;vector<vector<map<int,P>>>d(n,vector<map<int,P>>(n));for(int i=0;i<n;i++)d[i][i][a[i]]={0,1};for(int len=2;len<=n;len++)for(int l=0;l+len<=n;l++){int r=l+len-1;for(int k=l;k<r;k++)for(auto[x,px]:d[l][k])for(auto[y,py]:d[k+1][r]){int z=op[k]=='+'?x+y:x-y,c=px.first+py.first+(abs(z)>B),v=clamp(z,-B,B);ll w=px.second*py.second%MOD;auto it=d[l][r].find(v);if(it==d[l][r].end()||c<it->second.first)d[l][r][v]={c,w};else if(c==it->second.first)it->second.second=(it->second.second+w)%MOD;}}if(!d[0][n-1].count(T))cout<<"-1 0\n";else{auto p=d[0][n-1][T];cout<<p.first<<' '<<p.second<<'\n';}}''')

add(660,'data-structures','單調佇列維護免除最大值的滑動窗口',
r'''窗口的費用是總和減去一個最大值。右端加入正數時，這個費用不會減少；左端移走元素時也不會增加。因此固定右端的合法左端形成一段後綴，可用雙指標移到最早合法位置。
以遞減單調佇列維護最大值，另保存窗口總和。當總和減隊首值超過 B，就刪左端並移除過期隊首。每個右端留下的窗口是該右端最長合法段，對它們取最大即為全域答案。單一元素費用零，所以非空解必存在。''',
'時間 O(n)，佇列最壞 O(n)；Python 輸入陣列與 token 緩衝 O(n)，總 O(n)。總和使用 64 位元。',
'只免除一個最大元素，不是所有相同最大值；B=0 時仍至少能選長度1。',
[('納入第一個','B=2，數列3,2,1。','3','費用',0),('納入第二個','總和5免除3，費用2。','3|2','最長長度',2),('窗口收縮','加入1後費用3超標，移掉3後費用1。','2|1','最長長度',2)],
r'''import sys
from collections import deque
t=list(map(int,sys.stdin.buffer.read().split())); n,B=t[:2]; a=t[2:]; q=deque(); l=s=ans=0
for r,x in enumerate(a):
    s+=x
    while q and a[q[-1]]<=x: q.pop()
    q.append(r)
    while s-a[q[0]]>B:
        s-=a[l]
        if q[0]==l: q.popleft()
        l+=1
    ans=max(ans,r-l+1)
print(ans)''',
r'''int main(){ios::sync_with_stdio(false);cin.tie(nullptr);int n;ll B;cin>>n>>B;vector<ll>a(n);for(ll&x:a)cin>>x;deque<int>q;int l=0,ans=0;ll s=0;for(int r=0;r<n;r++){s+=a[r];while(!q.empty()&&a[q.back()]<=a[r])q.pop_back();q.push_back(r);while(s-a[q.front()]>B){s-=a[l];if(q.front()==l)q.pop_front();l++;}ans=max(ans,r-l+1);}cout<<ans<<'\n';}''')

add(661,'search','並行二分答案與逐日 DSU',
r'''加邊只會讓連通塊合併、大小增加，故每個查詢的條件對日數單調。將第 m+1 日視為永不成立的哨兵，維護答案所在的閉區間 [lo,hi]，初始 [0,m+1]。每輪將尚未收斂的查詢依 mid 分桶。
重新建立 DSU，從第0日掃到第m日，並在每個 mid 檢查兩點同根且塊大小至少 k。成立把 hi 降至 mid，否則 lo 提到 mid+1。一次 DSU 掃描替全部查詢完成一層二分；收斂到 m+1 的查詢輸出−1。''',
'時間 O((n+m+q) log(m+2) α(n))，分桶、DSU、邊與 Python 輸入緩衝 O(n+m+q)。',
'u=v,k=1 在第0日已成立；自環與重邊不能增加塊大小。',
[('第零日','3點，依序加1−2、2−3；問1,1,2。','1|2|3','條件','不成立'),('第一日','1與2合併，包含點1的塊大小2。','1,2|3','條件','成立'),('二分收斂','第0日不成立而第1日成立。','0|1','最早日',1)],
r'''import sys
it=iter(map(int,sys.stdin.buffer.read().split())); n,m,q=next(it),next(it),next(it); edges=[(next(it)-1,next(it)-1) for _ in range(m)]; qs=[(next(it)-1,next(it)-1,next(it)) for _ in range(q)]
lo=[0]*q; hi=[m+1]*q
while True:
    buckets={}
    for i in range(q):
        if lo[i]<hi[i]: buckets.setdefault((lo[i]+hi[i])//2,[]).append(i)
    if not buckets: break
    p=list(range(n)); sz=[1]*n
    def find(x):
        while x!=p[x]: p[x]=p[p[x]]; x=p[x]
        return x
    for day in range(m+1):
        if day:
            a,b=map(find,edges[day-1])
            if a!=b:
                if sz[a]<sz[b]: a,b=b,a
                p[b]=a; sz[a]+=sz[b]
        for i in buckets.get(day,()):
            u,v,k=qs[i]; a,b=find(u),find(v)
            if a==b and sz[a]>=k: hi[i]=day
            else: lo[i]=day+1
print('\n'.join(str(x if x<=m else -1) for x in lo))''',
r'''int main(){ios::sync_with_stdio(false);cin.tie(nullptr);int n,m,q;cin>>n>>m>>q;vector<pair<int,int>>e(m);for(auto&[a,b]:e){cin>>a>>b;--a;--b;}vector<array<int,3>>qs(q);for(auto&x:qs){cin>>x[0]>>x[1]>>x[2];--x[0];--x[1];}vector<int>lo(q),hi(q,m+1);while(true){vector<vector<int>>b(m+1);bool any=false;for(int i=0;i<q;i++)if(lo[i]<hi[i]){b[(lo[i]+hi[i])/2].push_back(i);any=true;}if(!any)break;vector<int>p(n),sz(n,1);iota(p.begin(),p.end(),0);auto find=[&](int x){while(x!=p[x]){p[x]=p[p[x]];x=p[x];}return x;};for(int t=0;t<=m;t++){if(t){auto[u,v]=e[t-1];u=find(u);v=find(v);if(u!=v){if(sz[u]<sz[v])swap(u,v);p[v]=u;sz[u]+=sz[v];}}for(int i:b[t]){auto[u,v,k]=qs[i];int a=find(u),c=find(v);if(a==c&&sz[a]>=k)hi[i]=t;else lo[i]=t+1;}}}for(int x:lo)cout<<(x<=m?x:-1)<<'\n';}''')
add(662,'data-structures','可刪除二元 Trie 與前綴 XOR 窗口',
r'''令 p[i] 是前 i 項 XOR，區間 (j,i] 的 XOR 為 p[i] XOR p[j]。對右端 i，合法 j 恰在 [i−R,i−L]；加入新進入的 p[i−L]、刪掉過期的 p[i−R−1]，即可維持精確候選集。
Trie 每層對應一個二進位，節點保存有效候選數。查詢由最高位往下，優先走與查詢值相反且計數大於零的分支；最高不同位的收益大於所有低位總和，所以此貪心給出最大 XOR。重複前綴必須分別計次，刪一份不能抹去整個值。''',
'時間 O(30n)，Trie 最壞 O(30n) 個節點。Python 使用 array 儲存三個整數陣列，避免每節點字典的高額開銷；輸入、前綴 O(n)，總 O(30n)。',
'先更新候選集再查詢；不得讓空區間的 p[i] 混入 L≥1 的窗口。',
[('前綴計算','數列1,2,4，L=2,R=3，前綴為0,1,3,7。','0|1|3|7','前綴個數',4),('右端為2','只可用 j=0，得到3。','0','目前最大',3),('右端為3','可用0與1，XOR分別7與6。','0|1','答案',7)],
r'''import sys
from array import array
t=list(map(int,sys.stdin.buffer.read().split())); n,L,R=t[:3]; p=[0]
for x in t[3:]: p.append(p[-1]^x)
ch=[array('i',[-1]),array('i',[-1])]; cnt=array('i',[0])
def change(x,d):
    u=0; cnt[0]+=d
    for b in range(29,-1,-1):
        c=(x>>b)&1; v=ch[c][u]
        if v==-1:
            v=len(cnt); ch[c][u]=v; ch[0].append(-1); ch[1].append(-1); cnt.append(0)
        u=v; cnt[u]+=d
ans=0
for i in range(L,n+1):
    change(p[i-L],1)
    if i>R: change(p[i-R-1],-1)
    u=0; val=0
    for b in range(29,-1,-1):
        c=(p[i]>>b)&1; v=ch[c^1][u]
        if v!=-1 and cnt[v]>0: val|=1<<b; u=v
        else: u=ch[c][u]
    ans=max(ans,val)
print(ans)''',
r'''int main(){ios::sync_with_stdio(false);cin.tie(nullptr);int n,L,R;cin>>n>>L>>R;vector<int>p(n+1);for(int i=1,x;i<=n;i++){cin>>x;p[i]=p[i-1]^x;}vector<array<int,3>>tr(1,{-1,-1,0});auto change=[&](int x,int d){int u=0;tr[0][2]+=d;for(int b=29;b>=0;b--){int c=x>>b&1;if(tr[u][c]==-1){int v=tr.size();tr[u][c]=v;tr.push_back({-1,-1,0});}u=tr[u][c];tr[u][2]+=d;}};int ans=0;for(int i=L;i<=n;i++){change(p[i-L],1);if(i>R)change(p[i-R-1],-1);int u=0,z=0;for(int b=29;b>=0;b--){int c=p[i]>>b&1,v=tr[u][c^1];if(v!=-1&&tr[v][2]>0){z|=1<<b;u=v;}else u=tr[u][c];}ans=max(ans,z);}cout<<ans<<'\n';}''')
add(663,'dp','同權重批次更新的最長行走計數',
r'''將邊依權重遞增排序。dp[v][c] 保存以類別 c 的邊結束在 v 的最長長度及數量；對 u→v、類別 c 的新邊，只從 dp[u][1−c] 延伸，若沒有前驅則此邊單獨構成一條長度1行走。
同權重的所有邊必須先讀舊狀態、算出候選，再一起更新，才能保證嚴格遞增。每個行走有唯一最後一條輸入邊，故同長度的方案數相加不重複；平行邊各自處理，恰好保留題目要求的區別。最後將所有終點與尾類別的全域最長方案加總。''',
'時間 O(m log m+n)，空間 O(n+m)，包含 Python 邊 tuple、排序與讀取緩衝。',
'不可讓同權重邊互相延伸；m=0 時沒有非空行走，輸出0 0。',
[('第一批權重','1→2 權重1類別0，有兩條平行邊。','2:類0','長度／數量','1／2'),('第二批延伸','2→1 權重2類別1，延伸兩種前綴。','1:類1','長度／數量','2／2'),('排除同類','1→2 權重3類別1不能接在類1後。','2:類1','全域最佳','2／2')],
r'''import sys
t=list(map(int,sys.stdin.buffer.read().split())); n,m=t[:2]; e=[(t[i+2],t[i]-1,t[i+1]-1,t[i+3]) for i in range(2,len(t),4)]; e.sort(); M=1000000007
d=[[0,0] for _ in range(n)]; ways=[[0,0] for _ in range(n)]; i=0
while i<m:
    j=i; pending=[]
    while j<m and e[j][0]==e[i][0]:
        w,u,v,c=e[j]; z=d[u][c^1]; pending.append((v,c,z+1,ways[u][c^1] if z else 1)); j+=1
    for v,c,z,h in pending:
        if z>d[v][c]: d[v][c]=z; ways[v][c]=h
        elif z==d[v][c]: ways[v][c]=(ways[v][c]+h)%M
    i=j
best=max((max(x) for x in d),default=0)
print(best,sum(ways[v][c] for v in range(n) for c in range(2) if d[v][c]==best)%M if best else 0)''',
r'''int main(){ios::sync_with_stdio(false);cin.tie(nullptr);int n,m;cin>>n>>m;vector<array<int,4>>e(m);for(auto&x:e){cin>>x[1]>>x[2]>>x[0]>>x[3];--x[1];--x[2];}sort(e.begin(),e.end());vector<array<int,2>>d(n);vector<array<ll,2>>ways(n);for(int i=0;i<m;){int j=i;vector<array<ll,4>>p;while(j<m&&e[j][0]==e[i][0]){auto[w,u,v,c]=e[j++];int z=d[u][c^1];p.push_back({v,c,z+1,z?ways[u][c^1]:1});}for(auto[v,c,z,h]:p){if(z>d[v][c]){d[v][c]=z;ways[v][c]=h;}else if(z==d[v][c])ways[v][c]=(ways[v][c]+h)%MOD;}i=j;}int best=0;ll cnt=0;for(int v=0;v<n;v++)for(int c=0;c<2;c++)if(d[v][c]>best){best=d[v][c];cnt=ways[v][c];}else if(d[v][c]==best)cnt=(cnt+ways[v][c])%MOD;cout<<best<<' '<<(best?cnt:0)<<'\n';}''')

add(664,'data-structures','保存端點同值長度的線段樹合併',
r'''每個區間摘要保存長度、左右端數值、同值前綴長、同值後綴長，以及批次平方和。合併相鄰 A,B 時，若接縫兩數不同，分數直接相加；若相同，原本兩批長 x,y 應合成一批，故額外加 2xy。
若 A 全段同值且接縫相同，合併後前綴延伸至 B 的同值前綴；後綴同理。摘要完全由實際串接序列決定，因而具結合律，能用線段樹維護點修改與任意區間查詢。查詢順序必須由左至右，因為摘要不具交換律。''',
'建樹 O(n)，每次操作 O(log n)，空間 O(n)；Python 讀取緩衝 O(n+q)，摘要樹 O(n)。平方和最大 n²，用64位元。',
'查詢兩端截斷批次，不能直接使用全陣列原批次長度。空摘要是合併單位元。',
[('分成兩段','左段2,2；右段2,3。','2,2|2,3','原分數和',6),('合併接縫','後綴長2與前綴長1合併，額外加4。','2,2,2|3','分數',10),('修改末項','把末項3改為2，形成長4一批。','2,2,2,2','分數',16)],
r'''import sys
def merge(a,b):
    if a is None: return b
    if b is None: return a
    n,l,r,p,s,z=a; m,L,R,P,S,Z=b; eq=r==L
    return (n+m,l,R,p+(P if eq and p==n else 0),S+(s if eq and S==m else 0),z+Z+(2*s*P if eq else 0))
it=iter(sys.stdin.buffer.read().split()); n=int(next(it)); q=int(next(it)); size=1
while size<n: size*=2
tr=[None]*(2*size)
for i in range(n):
    x=int(next(it)); tr[size+i]=(1,x,x,1,1,1)
for i in range(size-1,0,-1): tr[i]=merge(tr[i*2],tr[i*2+1])
out=[]
for _ in range(q):
    op=next(it); x=int(next(it)); y=int(next(it))
    if op==b'U':
        i=size+x-1; tr[i]=(1,y,y,1,1,1); i//=2
        while i: tr[i]=merge(tr[2*i],tr[2*i+1]); i//=2
    else:
        l=size+x-1; r=size+y; a=b=None
        while l<r:
            if l&1: a=merge(a,tr[l]); l+=1
            if r&1: r-=1; b=merge(tr[r],b)
            l//=2; r//=2
        out.append(str(merge(a,b)[5]))
print('\n'.join(out))''',
r'''struct S{ll n=0,l=0,r=0,p=0,s=0,z=0;};S mergeS(S a,S b){if(!a.n)return b;if(!b.n)return a;bool e=a.r==b.l;return {a.n+b.n,a.l,b.r,a.p+(e&&a.p==a.n?b.p:0),b.s+(e&&b.s==b.n?a.s:0),a.z+b.z+(e?2*a.s*b.p:0)};}int main(){ios::sync_with_stdio(false);cin.tie(nullptr);int n,q,N=1;cin>>n>>q;while(N<n)N*=2;vector<S>t(2*N);for(int i=0;i<n;i++){ll x;cin>>x;t[N+i]={1,x,x,1,1,1};}for(int i=N-1;i;i--)t[i]=mergeS(t[2*i],t[2*i+1]);while(q--){char op;int x;ll y;cin>>op>>x>>y;if(op=='U'){int i=N+x-1;t[i]={1,y,y,1,1,1};for(i/=2;i;i/=2)t[i]=mergeS(t[2*i],t[2*i+1]);}else{int l=N+x-1,r=N+y;S a,b;while(l<r){if(l&1)a=mergeS(a,t[l++]);if(r&1)b=mergeS(t[--r],b);l/=2;r/=2;}cout<<mergeS(a,b).z<<'\n';}}}''')

add(665,'dp','前緣 DAG 上的區間最小費用與計數',
r'''前緣嚴格增加，所以只可能是0或某個服務右端。壓縮這些座標並按右端遞增處理服務。要啟用 [l,r]，前一個前緣 f 必須在 [l−1,r−1]，故取該範圍所有狀態的最低費用及對應方案總數，再加服務費。
線段樹保存「較小費用優先、同費用相加」的摘要。相同右端的服務不能互相接續，查詢上界必須嚴格小於 r。每個有效序列有唯一最後服務編號，因此候選計數相加恰好涵蓋全部最優序列。正費用與嚴增前緣亦保證無法重用同服務。''',
'時間 O(m log(m+1))，空間 O(m)，含 Python 排序、座標及讀取緩衝；N≤10^9 不能建立大小 N 的表。',
'相同區間的不同服務仍是不同選擇；查詢包含 l−1，且不包含 r。',
[('起始前緣','N=3，服務[1,1]費2、[2,3]費4、[1,3]費7。','0','最低費用',0),('到達1','啟用第一服務，費用2。','1','序列數',1),('到達3','經前緣1的費用6，比直接7小。','3','最佳費用',6)],
r'''import sys,bisect
t=list(map(int,sys.stdin.buffer.read().split())); N,m=t[:2]; es=[tuple(t[i:i+3]) for i in range(2,len(t),3)]; xs=sorted({0}|{r for l,r,w in es}); size=1; inf=10**30; M=1000000007
while size<len(xs): size*=2
tr=[(inf,0)]*(2*size)
def merge(a,b):
    if a[0]!=b[0]: return min(a,b)
    return (a[0],(a[1]+b[1])%M)
def update(i,v):
    i+=size; tr[i]=merge(tr[i],v); i//=2
    while i: tr[i]=merge(tr[2*i],tr[2*i+1]); i//=2
def query(l,r):
    l+=size; r+=size; ans=(inf,0)
    while l<r:
        if l&1: ans=merge(ans,tr[l]); l+=1
        if r&1: r-=1; ans=merge(ans,tr[r])
        l//=2; r//=2
    return ans
update(0,(0,1))
for l,r,w in sorted(es,key=lambda e:e[1]):
    j=bisect.bisect_left(xs,r); d,c=query(bisect.bisect_left(xs,l-1),j)
    if d<inf: update(j,(d+w,c))
j=bisect.bisect_left(xs,N); d,c=query(j,j+1) if j<len(xs) and xs[j]==N else (inf,0)
print(d if d<inf else -1,c)''',
r'''using P=pair<ll,ll>;const ll INF=4e18;P mg(P a,P b){if(a.first!=b.first)return min(a,b);return {a.first,(a.second+b.second)%MOD};}int main(){ios::sync_with_stdio(false);cin.tie(nullptr);int N,m;cin>>N>>m;vector<array<int,3>>e(m);vector<int>x{0};for(auto&a:e){cin>>a[0]>>a[1]>>a[2];x.push_back(a[1]);}sort(x.begin(),x.end());x.erase(unique(x.begin(),x.end()),x.end());sort(e.begin(),e.end(),[](auto a,auto b){return a[1]<b[1];});int S=1;while(S<(int)x.size())S*=2;vector<P>t(2*S,{INF,0});auto up=[&](int i,P v){i+=S;t[i]=mg(t[i],v);while(i/=2)t[i]=mg(t[2*i],t[2*i+1]);};auto qu=[&](int l,int r){P a={INF,0};for(l+=S,r+=S;l<r;l/=2,r/=2){if(l&1)a=mg(a,t[l++]);if(r&1)a=mg(a,t[--r]);}return a;};up(0,{0,1});for(auto[l,r,w]:e){int j=lower_bound(x.begin(),x.end(),r)-x.begin(),i=lower_bound(x.begin(),x.end(),l-1)-x.begin();auto[d,c]=qu(i,j);if(d<INF)up(j,{d+w,c});}int j=lower_bound(x.begin(),x.end(),N)-x.begin();auto[d,c]=j<(int)x.size()&&x[j]==N?qu(j,j+1):P{INF,0};cout<<(d==INF?-1:d)<<' '<<c<<'\n';}''')

add(666,'graphs','迭代 Kosaraju 與縮圖前驅去重',
r'''先在原圖完成 DFS 後序，再依後序反向在反圖搜尋，得到強連通分量編號。採用顯式堆疊而非遞迴，避免長鏈 n=10^5 造成呼叫堆疊溢位。每個分量將標記1的數量累計取奇偶。
掃描每條原邊 u→v，只保留分量編號不同的有序對。集合去重後，對目標分量累加前驅數；平行邊及同一前驅不同頂點的邊都只計一次。強連通分量分割唯一，因此最終逐分量檢查奇數與前驅數 K 就是答案。''',
'Kosaraju 時間 O(n+m)。分量對去重：Python 雜湊集合期望 O(m)，C++ 有序 set 上界 O(m log(m+1))，故 C++ 總時間 O(n+m log(m+1))。空間 O(n+m)，包含反圖、分量對集合及 Python 輸入緩衝。',
'前驅是直接跨分量入邊來源，不是所有能走到此分量的祖先；內部邊不計。',
[('找出互通群','邊1↔2、2→3、1→3，標記1,0,1。','{1,2}|{3}','分量數',2),('邊去重','兩條跨邊同從{1,2}出發。','{1,2}→{3}','不同前驅數',1),('套用條件','K=1，只有{3}奇標且有一前驅。','{3}','答案',1)],
r'''import sys
it=iter(map(int,sys.stdin.buffer.read().split())); n,m,K=next(it),next(it),next(it); a=[next(it) for _ in range(n)]; g=[[] for _ in range(n)]; rg=[[] for _ in range(n)]; edges=[]
for _ in range(m):
    u,v=next(it)-1,next(it)-1; g[u].append(v); rg[v].append(u); edges.append((u,v))
seen=[False]*n; order=[]
for s in range(n):
    if seen[s]: continue
    seen[s]=True; st=[(s,0)]
    while st:
        u,i=st[-1]
        if i==len(g[u]): order.append(u); st.pop(); continue
        v=g[u][i]; st[-1]=(u,i+1)
        if not seen[v]: seen[v]=True; st.append((v,0))
co=[-1]*n; parity=[]
for s in reversed(order):
    if co[s]!=-1: continue
    idx=len(parity); co[s]=idx; st=[s]; z=0
    while st:
        u=st.pop(); z^=a[u]
        for v in rg[u]:
            if co[v]==-1: co[v]=idx; st.append(v)
    parity.append(z)
inc=[0]*len(parity)
for u,v in {(co[u],co[v]) for u,v in edges if co[u]!=co[v]}: inc[v]+=1
print(sum(z==1 and d==K for z,d in zip(parity,inc)))''',
r'''int main(){ios::sync_with_stdio(false);cin.tie(nullptr);int n,m,K;cin>>n>>m>>K;vector<int>a(n);for(int&x:a)cin>>x;vector<vector<int>>g(n),r(n);vector<pair<int,int>>e;for(int i=0,u,v;i<m;i++){cin>>u>>v;--u;--v;g[u].push_back(v);r[v].push_back(u);e.push_back({u,v});}vector<int>seen(n),order;for(int s=0;s<n;s++)if(!seen[s]){vector<pair<int,int>>st{{s,0}};seen[s]=1;while(!st.empty()){int u=st.back().first,&i=st.back().second;if(i==(int)g[u].size()){order.push_back(u);st.pop_back();continue;}int v=g[u][i++];if(!seen[v]){seen[v]=1;st.push_back({v,0});}}}vector<int>co(n,-1),par;reverse(order.begin(),order.end());for(int s:order)if(co[s]<0){int id=par.size(),z=0;vector<int>st{s};co[s]=id;while(!st.empty()){int u=st.back();st.pop_back();z^=a[u];for(int v:r[u])if(co[v]<0){co[v]=id;st.push_back(v);}}par.push_back(z);}set<pair<int,int>>pairs;for(auto[u,v]:e)if(co[u]!=co[v])pairs.insert({co[u],co[v]});vector<int>inc(par.size());for(auto[u,v]:pairs)inc[v]++;int ans=0;for(int i=0;i<(int)par.size();i++)ans+=par[i]&&inc[i]==K;cout<<ans<<'\n';}''')

add(667,'data-structures','按顏色拆分的嚴格小於 Fenwick 計數',
r'''固定中點 j，答案貢獻為左側小於 a[j] 的色0數乘右側小於它的色1數，加上左右顏色對調的乘積。中點顏色完全無關，不能誤把問題當成交錯三色。
壓縮值域後，分別從左到右、從右到左，用兩棵 Fenwick 樹統計各色嚴格較小的個數。查詢 rank−1 保證相等數值排除。每個三元組有唯一中點和唯一兩翼顏色配法，因此逐中點加總既不漏也不重複。''',
'時間 O(n log n)，空間 O(n)，含 Python 壓縮排序、四個計數陣列及讀取緩衝；答案最大 O(n³)，在 n≤200000 時可用64位元。',
'兩翼必須嚴格較小，不是小於等於；左右位置不能混用。',
[('固定中央高點','序列(1,0),(5,1),(2,1)。','1:0|5:1|2:1','中點',2),('左側統計','比5小的左色0有1個。','1:0','左色0',1),('右側配對','右色1有1個，乘積1。','2:1','三元組貢獻',1)],
r'''import sys,bisect
t=list(map(int,sys.stdin.buffer.read().split())); n=t[0]; a=t[1::2]; c=t[2::2]; xs=sorted(set(a)); ranks=[bisect.bisect_left(xs,x)+1 for x in a]; z=len(xs)
def sweep(order):
    bit=[[0]*(z+1) for _ in range(2)]; out=[[0,0] for _ in range(n)]
    for i in order:
        for color in range(2):
            j=ranks[i]-1; s=0
            while j: s+=bit[color][j]; j-=j&-j
            out[i][color]=s
        j=ranks[i]
        while j<=z: bit[c[i]][j]+=1; j+=j&-j
    return out
L=sweep(range(n)); R=sweep(range(n-1,-1,-1)); print(sum(l[0]*r[1]+l[1]*r[0] for l,r in zip(L,R)))''',
r'''int main(){ios::sync_with_stdio(false);cin.tie(nullptr);int n;cin>>n;vector<int>a(n),c(n),x;for(int i=0;i<n;i++){cin>>a[i]>>c[i];x.push_back(a[i]);}sort(x.begin(),x.end());x.erase(unique(x.begin(),x.end()),x.end());vector<int>rk(n);for(int i=0;i<n;i++)rk[i]=lower_bound(x.begin(),x.end(),a[i])-x.begin()+1;vector<array<ll,2>>L(n),R(n);for(int pass=0;pass<2;pass++){vector<vector<ll>>b(2,vector<ll>(x.size()+1));for(int k=0;k<n;k++){int i=pass?n-1-k:k;auto&d=pass?R[i]:L[i];for(int col=0;col<2;col++)for(int j=rk[i]-1;j;j-=j&-j)d[col]+=b[col][j];for(int j=rk[i];j<(int)b[0].size();j+=j&-j)b[c[i]][j]++;}}ll ans=0;for(int i=0;i<n;i++)ans+=L[i][0]*R[i][1]+L[i][1]*R[i][0];cout<<ans<<'\n';}''')

add(668,'trees','帶符號權量的換根距離總和',
r'''令色0權量為+1、色1為−1，則 F(v)=Σ權量[u]×dist(v,u)=A(v)−B(v)。先任選根，累計全樹權量 W、每個子樹權量 sub，以及根到各點的帶符號距離和 F(root)。
沿父 u 到子 v、邊長 w 換根時，v 子樹所有距離減 w，其餘增加 w，故 F(v)=F(u)+w(W−2sub[v])。依根序向下套用即可算出全部候選。最後只看色0，依 (abs(F),編號) 比較，自然滿足平手規則。''',
'時間 O(n)，空間 O(n)，包含 Python 鄰接串列、遍歷順序與輸入緩衝；距離和可達約4×10^16，須64位元。',
'色1不能成為候選；缺少某色時仍可用同一公式，不能假設兩色都有。',
[('根端距離和','鏈1−2−3，邊長1，顏色0,1,0。','+1|-1|+1','F(1)',1),('換根到2','總權量1，子樹2權量0，增加1。','2','F(2)',2),('換根到3','子樹3權量1，減少1；合法候選1與3平手。','1|3','選擇編號',1)],
r'''import sys
it=iter(map(int,sys.stdin.buffer.read().split())); n=next(it); c=[next(it) for _ in range(n)]; g=[[] for _ in range(n)]
for _ in range(n-1):
    u,v,w=next(it)-1,next(it)-1,next(it); g[u].append((v,w)); g[v].append((u,w))
p=[-1]*n; dist=[0]*n; pw=[0]*n; order=[0]; p[0]=0
for u in order:
    for v,w in g[u]:
        if v!=p[u]: p[v]=u; pw[v]=w; dist[v]=dist[u]+w; order.append(v)
sub=[1-2*x for x in c]; W=sum(sub); F=[0]*n; F[0]=sum(x*d for x,d in zip(sub,dist))
for v in reversed(order[1:]): sub[p[v]]+=sub[v]
for v in order[1:]: F[v]=F[p[v]]+pw[v]*(W-2*sub[v])
value,v=min((abs(F[i]),i+1) for i in range(n) if c[i]==0); print(v,value)''',
r'''int main(){ios::sync_with_stdio(false);cin.tie(nullptr);int n;cin>>n;vector<int>c(n);vector<ll>sub(n),d(n),pw(n),F(n);ll W=0;for(int i=0;i<n;i++){cin>>c[i];sub[i]=1-2*c[i];W+=sub[i];}vector<vector<pair<int,ll>>>g(n);for(int i=1,u,v;i<n;i++){ll w;cin>>u>>v>>w;--u;--v;g[u].push_back({v,w});g[v].push_back({u,w});}vector<int>p(n,-1),ord{0};p[0]=0;for(int k=0;k<n;k++){int u=ord[k];for(auto[v,w]:g[u])if(v!=p[u]){p[v]=u;pw[v]=w;d[v]=d[u]+w;ord.push_back(v);}}for(int i=0;i<n;i++)F[0]+=sub[i]*d[i];for(int k=n-1;k>0;k--){int v=ord[k];sub[p[v]]+=sub[v];}for(int k=1;k<n;k++){int v=ord[k];F[v]=F[p[v]]+pw[v]*(W-2*sub[v]);}pair<ll,int>ans={LLONG_MAX,n};for(int i=0;i<n;i++)if(!c[i])ans=min(ans,{abs(F[i]),i+1});cout<<ans.second<<' '<<ans.first<<'\n';}''')

add(669,'geometry','鞋帶公式的局部邊貢獻更新',
r'''有向面積兩倍 S 是各循環邊 cross(P[i],P[i+1]) 之和。交換位置 u,v 只會影響以 u−1,u,v−1,v 為起點的邊；先將這些起點去重，扣除舊貢獻，交換座標，再加新貢獻。
其他邊的兩端完全沒變，故其貢獻可以保留。相鄰位置、首尾相鄰或 u=v 時受影響邊會重疊，去重後每條邊恰好扣加一次。公式本身是定義，不需圖形簡單，也不能最後取絕對值。''',
'初始化 O(n)，每次交換 O(1)，空間 O(n)，Python 讀取與輸出緩衝 O(n+q)。|S|≤4×10^17，使用64位元。',
'交換的是完整座標且會永久保留；負面積合法，不能當成面積大小輸出。',
[('原三角形','(0,0),(2,0),(0,1)。','0,0|2,0|0,1','S',2),('交換首兩點','循環方向反轉。','2,0|0,0|0,1','S',-2),('同點交換','交換位置2與2，所有座標不變。','2,0|0,0|0,1','S',-2)],
r'''import sys
it=iter(map(int,sys.stdin.buffer.read().split())); n,q=next(it),next(it); p=[(next(it),next(it)) for _ in range(n)]
def edge(i):
    x,y=p[i]; X,Y=p[(i+1)%n]; return x*Y-y*X
s=sum(edge(i) for i in range(n)); out=[]
for _ in range(q):
    u,v=next(it)-1,next(it)-1; ids={(u-1)%n,u,(v-1)%n,v}; s-=sum(edge(i) for i in ids); p[u],p[v]=p[v],p[u]; s+=sum(edge(i) for i in ids); out.append(str(s))
print('\n'.join(out))''',
r'''int main(){ios::sync_with_stdio(false);cin.tie(nullptr);int n,q;cin>>n>>q;vector<pair<ll,ll>>p(n);for(auto&[x,y]:p)cin>>x>>y;auto edge=[&](int i){auto[x,y]=p[i];auto[X,Y]=p[(i+1)%n];return x*Y-y*X;};ll s=0;for(int i=0;i<n;i++)s+=edge(i);while(q--){int u,v;cin>>u>>v;--u;--v;set<int>ids{(u+n-1)%n,u,(v+n-1)%n,v};for(int i:ids)s-=edge(i);swap(p[u],p[v]);for(int i:ids)s+=edge(i);cout<<s<<'\n';}}''')

add(670,'number-theory','保留方向符號的最簡整數向量',
r'''對非原點 (x,y)，以正整數 g=gcd(|x|,|y|) 約分為 (x/g,y/g)。同一射線上所有整點都是同一個最簡方向的正整數倍，因此這個向量就是射線的唯一鍵。
將每個方向的兩色數量分別累加，最後檢查兩者相等且大於零。負方向不額外翻號，因此相反射線仍是不同鍵；水平與垂直點亦可用 gcd 同樣處理，不涉及浮點誤差。''',
'雜湊版本期望時間 O(n log V)（gcd），空間 O(n)；C++ map 額外 O(n log n)，Python 輸入緩衝 O(n)。V≤10^9。',
'不能把第一個非零座標強制變正，否則會錯把相反射線合併。',
[('第一色點','(1,1)色0約分為(1,1)。','1,1:0','此方向數量','1／0'),('同射線第二色','(2,2)色1也約分為(1,1)。','1,1:0|2,2:1','均衡射線',1),('反向點','(−1,−1)色1是另一射線，並未均衡。','-1,-1:1','均衡射線',1)],
r'''import sys,math
it=iter(map(int,sys.stdin.buffer.read().split())); n=next(it); d={}
for _ in range(n):
    x,y,c=next(it),next(it),next(it); g=math.gcd(x,y); z=d.setdefault((x//g,y//g),[0,0]); z[c]+=1
print(sum(a==b and a>0 for a,b in d.values()))''',
r'''int main(){ios::sync_with_stdio(false);cin.tie(nullptr);int n;cin>>n;map<pair<ll,ll>,array<int,2>>d;while(n--){ll x,y;int c;cin>>x>>y>>c;ll g=gcd(abs(x),abs(y));d[{x/g,y/g}][c]++;}int ans=0;for(auto[k,v]:d)ans+=v[0]>0&&v[0]==v[1];cout<<ans<<'\n';}''')

add(671,'data-structures','最近較高阻擋點與等高位置二分',
r'''對每個右端 j，任何高度大於 h[j] 的中間點都會阻擋視線。以遞減單調堆疊求左側最近嚴格較高位置 b；將小於等於目前高度的棧頂彈掉，剩餘棧頂即為 b。
另按高度保存已出現的位置串列。合法左端必須同高，且至少為 max(j−K,b+1)。用二分找出串列中大於等於此下界的個數後，再插入 j。這些條件同時保證等高、距離與無較高阻擋，逐右端統計不會重複。''',
'時間 O(n log n)，空間 O(n)，含 Python 各高度位置串列、棧及讀取緩衝；答案 O(n²) 用64位元。',
'中間等高不阻擋，最近阻擋必須嚴格較高；計數後才插入當前位置。',
[('前兩個等高','高度3,1,3,4,3，K=4；右端3可看位置1。','3|1|3','累計',1),('高點阻擋','位置4高度4，成為高度3的阻擋。','4','阻擋位置',4),('末點查詢','右端5高度3，不可越過位置4配位置1或3。','3','累計',1)],
r'''import sys,bisect
t=list(map(int,sys.stdin.buffer.read().split())); n,K=t[:2]; h=t[2:]; st=[]; pos={}; ans=0
for j,x in enumerate(h):
    while st and h[st[-1]]<=x: st.pop()
    low=max(j-K,st[-1]+1 if st else 0); v=pos.setdefault(x,[]); ans+=len(v)-bisect.bisect_left(v,low); v.append(j); st.append(j)
print(ans)''',
r'''int main(){ios::sync_with_stdio(false);cin.tie(nullptr);int n,K;cin>>n>>K;vector<int>h(n),st;map<int,vector<int>>pos;ll ans=0;for(int j=0;j<n;j++){cin>>h[j];while(!st.empty()&&h[st.back()]<=h[j])st.pop_back();int low=max(j-K,st.empty()?0:st.back()+1);auto&v=pos[h[j]];ans+=v.end()-lower_bound(v.begin(),v.end(),low);v.push_back(j);st.push_back(j);}cout<<ans<<'\n';}''')

add(672,'dp','DAG 上的末邊類別與模三路線計數',
r'''每條邊由小編號指向大編號，所以頂點編號本身就是拓樸序。dp[v][c][s] 表示走到 v、上一邊類別為 c、總權重模3為 s 的路線數。起點用類別0、餘數0放入一條空路線。
沿類別 d、權重 w 的邊轉移時，若 c=d=1 就略過，否則加入 dp[to][d][(s+w)%3]。每條路線有唯一最後邊，平行邊逐條累加才能分開計數；最後將終點兩種末類別的目標餘數相加，n=1 也自然涵蓋空路線。''',
'時間 O(n+m)，每邊至多6個狀態；空間 O(n+m)，含 Python 六狀態表、圖與 token 緩衝。',
'餘數必須更新的是權重和而非邊數；空路線只在起點放一次。',
[('起點狀態','n=3，1→2類1權1，2→3類0權2。','1:類0餘0','路線數',1),('走特殊邊','抵達2時類1、餘1。','2:類1餘1','路線數',1),('走普通邊','抵達3時類0、餘0，合法。','3:類0餘0','目標餘0答案',1)],
r'''import sys
it=iter(map(int,sys.stdin.buffer.read().split())); n,m,r=next(it),next(it),next(it); g=[[] for _ in range(n)]; M=1000000007
for _ in range(m):
    u,v,c,w=next(it)-1,next(it)-1,next(it),next(it); g[u].append((v,c,w%3))
dp=[[0]*6 for _ in range(n)]; dp[0][0]=1
for u in range(n):
    for v,c,w in g[u]:
        for old in range(2):
            if old==c==1: continue
            for s in range(3):
                j=3*c+(s+w)%3; dp[v][j]=(dp[v][j]+dp[u][3*old+s])%M
print((dp[-1][r]+dp[-1][3+r])%M)''',
r'''int main(){ios::sync_with_stdio(false);cin.tie(nullptr);int n,m,r;cin>>n>>m>>r;vector<vector<array<int,3>>>g(n);for(int i=0,u,v,c,w;i<m;i++){cin>>u>>v>>c>>w;g[u-1].push_back({v-1,c,w%3});}vector<array<ll,6>>d(n);d[0][0]=1;for(int u=0;u<n;u++)for(auto[v,c,w]:g[u])for(int old=0;old<2;old++)if(!(old&&c))for(int s=0;s<3;s++){int j=3*c+(s+w)%3;d[v][j]=(d[v][j]+d[u][3*old+s])%MOD;}cout<<(d[n-1][r]+d[n-1][3+r])%MOD<<'\n';}''')
add(673,'trees','開放連通塊的標記數與大小奇偶 DP',
r'''由葉向根處理。dp[u][b][p] 計算 u 子樹切邊方案，其中含 u 的開放塊有 b 個標記、大小奇偶為 p，其餘已封閉塊都合法。只需 b=0或1，超過一個標記後永遠無法靠合併減少，所以立即捨棄。
合併孩子時有兩種選擇：切邊要求孩子開放塊為一標記且偶數，父狀態不變；留邊則標記數相加、奇偶 XOR。不同孩子與切邊選擇對應唯一刪邊集合，乘法後加總即可。根沒有外部父邊，最後只接受 dp[root][1][0]。''',
'時間 O(n)，每邊至多16對狀態；空間 O(n)，包含 Python 鄰接串列、遍歷順序與輸入緩衝。',
'不能只保留已完成的偶塊：奇數開放塊可以與父側合併後變偶數。',
[('葉的開放塊','二點樹，標記1,0；無標葉大小1。','標0／奇','方案數',1),('保留連邊','與有標根合併成大小2、一標記。','標1／偶','方案數',1),('檢查根狀態','切邊會留下無標塊，只有不切合法。','完整二點塊','合法切法',1)],
r'''import sys
it=iter(map(int,sys.stdin.buffer.read().split())); n=next(it); a=[next(it) for _ in range(n)]; g=[[] for _ in range(n)]; M=1000000007
for _ in range(n-1):
    u,v=next(it)-1,next(it)-1; g[u].append(v); g[v].append(u)
p=[-1]*n; p[0]=0; order=[0]
for u in order:
    for v in g[u]:
        if v!=p[u]: p[v]=u; order.append(v)
dp=[[0]*4 for _ in range(n)]
for u in reversed(order):
    d=[0]*4; d[2*a[u]+1]=1
    for v in g[u]:
        if p[v]!=u: continue
        e=dp[v]; nd=[x*e[2]%M for x in d]
        for x in range(4):
            for y in range(4):
                b=x//2+y//2
                if b<=1:
                    z=2*b+((x^y)&1); nd[z]=(nd[z]+d[x]*e[y])%M
        d=nd
    dp[u]=d
print(dp[0][2])''',
r'''int main(){ios::sync_with_stdio(false);cin.tie(nullptr);int n;cin>>n;vector<int>a(n),p(n,-1),ord{0};for(int&x:a)cin>>x;vector<vector<int>>g(n);for(int i=1,u,v;i<n;i++){cin>>u>>v;--u;--v;g[u].push_back(v);g[v].push_back(u);}p[0]=0;for(int k=0;k<n;k++){int u=ord[k];for(int v:g[u])if(v!=p[u]){p[v]=u;ord.push_back(v);}}vector<array<ll,4>>dp(n);for(int k=n-1;k>=0;k--){int u=ord[k];array<ll,4>d{};d[2*a[u]+1]=1;for(int v:g[u])if(p[v]==u){array<ll,4>nd{};for(int x=0;x<4;x++)nd[x]=d[x]*dp[v][2]%MOD;for(int x=0;x<4;x++)for(int y=0;y<4;y++)if(x/2+y/2<=1){int z=2*(x/2+y/2)+((x^y)&1);nd[z]=(nd[z]+d[x]*dp[v][y])%MOD;}d=nd;}dp[u]=d;}cout<<dp[0][2]<<'\n';}''')

add(674,'graphs','DSU 聚合點數、邊數與標記數',
r'''DSU 每個根保存連通塊的頂點數、邊數、標記總數。讀邊時若兩端不同根，合併三項統計後再加本條邊；同根也要增加一條邊，因為自環和平行邊都是實際邊。
每個頂點只在一個 DSU 塊中，每條邊只在讀取時計一次，因此讀完後三項值恰是連通分量的統計。只遍歷根，計算邊數等於點數且標記總數等於 k 的塊；不用額外判斷環的形狀。''',
'時間 O((n+m)α(n))，空間 O(n)，Python 一次讀取緩衝 O(n+m)。',
'連通後的新邊仍增加邊數；自環一條而非兩條，孤立點邊數0不合格。',
[('孤立初始','兩頂點標記1,0，目標k=1。','1|2','合格塊',0),('連接兩點','加邊1−2，點數2邊數1。','{1,2}','合格塊',0),('再加平行邊','點數2邊數2，標記數1。','{1,2}','合格塊',1)],
r'''import sys
it=iter(map(int,sys.stdin.buffer.read().split())); n,m,k=next(it),next(it),next(it); mark=[next(it) for _ in range(n)]; p=list(range(n)); sz=[1]*n; ec=[0]*n
def find(x):
    while p[x]!=x: p[x]=p[p[x]]; x=p[x]
    return x
for _ in range(m):
    u,v=find(next(it)-1),find(next(it)-1)
    if u!=v:
        if sz[u]<sz[v]: u,v=v,u
        p[v]=u; sz[u]+=sz[v]; ec[u]+=ec[v]; mark[u]+=mark[v]
    ec[u]+=1
print(sum(p[u]==u and ec[u]==sz[u] and mark[u]==k for u in range(n)))''',
r'''int main(){ios::sync_with_stdio(false);cin.tie(nullptr);int n,m,k;cin>>n>>m>>k;vector<int>p(n),sz(n,1),ec(n),a(n);iota(p.begin(),p.end(),0);for(int&x:a)cin>>x;auto f=[&](int x){while(x!=p[x]){p[x]=p[p[x]];x=p[x];}return x;};while(m--){int u,v;cin>>u>>v;u=f(u-1);v=f(v-1);if(u!=v){if(sz[u]<sz[v])swap(u,v);p[v]=u;sz[u]+=sz[v];ec[u]+=ec[v];a[u]+=a[v];}ec[u]++;}int ans=0;for(int u=0;u<n;u++)ans+=p[u]==u&&ec[u]==sz[u]&&a[u]==k;cout<<ans<<'\n';}''')

add(675,'data-structures','雙色滑動最小值與字典序平手',
r'''固定右端 j，候選左端在 [j−R,j−L] 且必須異色。用兩個依讀數遞增的佇列分別維護色0與色1的候選，只查另一色隊首即可得到最大漲幅。
加入新候選時，只彈掉嚴格較大的尾值；相等值保留較早位置，才能在漲幅相同時優先選最小 i。過期位置從隊首刪除。每個 j 的最佳候選用 (漲幅,−i,−j) 比較，便完整實現全域平手規則，包括所有漲幅皆為負的情形。''',
'時間 O(n)，空間 O(n)，含 Python 讀數、兩佇列與輸入緩衝。',
'不能用0初始化答案，因為最優漲幅可能是負數；找不到配對才輸出 NONE。',
[('第一候選','L=1,R=2，讀數(5,0),(3,1),(4,1)。','5:0','候選位置',1),('第二點配對','漲幅3−5=−2。','1→2','最佳漲幅',-2),('第三點改善','同一候選得到4−5=−1。','1→3','最佳漲幅',-1)],
r'''import sys
from collections import deque
t=list(map(int,sys.stdin.buffer.read().split())); n,L,R=t[:3]; a=t[3::2]; c=t[4::2]; qs=[deque(),deque()]; best=None
for j in range(n):
    i=j-L
    if i>=0:
        q=qs[c[i]]
        while q and a[q[-1]]>a[i]: q.pop()
        q.append(i)
    for q in qs:
        while q and q[0]<j-R: q.popleft()
    q=qs[c[j]^1]
    if q:
        i=q[0]; val=(a[j]-a[i],-i,-j)
        if best is None or val>best: best=val
print('NONE' if best is None else f'{best[0]} {-best[1]+1} {-best[2]+1}')''',
r'''int main(){ios::sync_with_stdio(false);cin.tie(nullptr);int n,L,R;cin>>n>>L>>R;vector<ll>a(n);vector<int>c(n);for(int i=0;i<n;i++)cin>>a[i]>>c[i];deque<int>q[2];tuple<ll,int,int>best;bool ok=false;for(int j=0;j<n;j++){int i=j-L;if(i>=0){auto&d=q[c[i]];while(!d.empty()&&a[d.back()]>a[i])d.pop_back();d.push_back(i);}for(auto&d:q)while(!d.empty()&&d.front()<j-R)d.pop_front();auto&d=q[c[j]^1];if(!d.empty()){i=d.front();auto v=make_tuple(a[j]-a[i],-i,-j);if(!ok||v>best){ok=true;best=v;}}}if(!ok)cout<<"NONE\n";else{auto[v,i,j]=best;cout<<v<<' '<<1-i<<' '<<1-j<<'\n';}}''')

add(676,'dp','路徑匹配的雙目標前綴 DP',
r'''dp[i] 保存前 i 筆的最佳「組數、差值總和」，比較時先最大化組數，再最小化總和。最後一筆若未配對，沿用 dp[i−1]；若有配對，就只能和原位置 i−1 配，且差值需在 T 內，候選為 dp[i−2] 加一組及該差值。
任一合法配對集合的最後位置必屬於上述兩種情形；配對情形的前 i−2 筆不會與最後兩筆重疊。因此歸納可知每個前綴皆最優。刪掉已配對讀數後才相鄰的兩筆不能配，轉移始終只用原始相鄰位置。''',
'時間 O(n)，滾動 DP 額外 O(1)；Python 讀入陣列與 token 緩衝 O(n)。總差值最多約10^14，使用64位元。',
'先配最小差或從左能配就配都不保證雙目標最優，應比較完整 DP 候選。',
[('一筆前綴','數列0,4,5，T=5。','0','最佳','0組／0'),('兩筆前綴','配0與4，得1組差4。','0—4','最佳','1組／4'),('三筆前綴','不配首筆，改配4與5，組數同為1但差更小。','4—5','最佳','1組／1')],
r'''import sys
t=list(map(int,sys.stdin.buffer.read().split())); n,T=t[:2]; a=t[2:]; prev2=(0,0); prev=(0,0)
for i in range(n):
    cur=prev
    if i and abs(a[i]-a[i-1])<=T:
        cand=(prev2[0]+1,prev2[1]-abs(a[i]-a[i-1])); cur=max(cur,cand)
    prev2,prev=prev,cur
print(prev[0],-prev[1])''',
r'''int main(){ios::sync_with_stdio(false);cin.tie(nullptr);int n;ll T;cin>>n>>T;vector<ll>a(n);for(ll&x:a)cin>>x;pair<ll,ll>p2{0,0},p{0,0};for(int i=0;i<n;i++){auto c=p;if(i&&abs(a[i]-a[i-1])<=T)c=max(c,make_pair(p2.first+1,p2.second-abs(a[i]-a[i-1])));p2=p;p=c;}cout<<p.first<<' '<<-p.second<<'\n';}''')

add(677,'data-structures','壓縮值域的多重集合排名與選擇',
r'''排序離散化全部讀數，以 Fenwick 樹保存最近 W 筆的頻率。對當前 x，先查嚴格小於 x 的個數 s；第 s 個有效元素是前驅，第 s+1 個是大於等於 x 的後繼，存在者都與 x 比較差值。
絕對差在有序集合中只可能由前驅或後繼達到最小。利用 Fenwick 二進位提升查第 k 個元素，可在 O(log n) 找出兩者；計算後插入當前值，再刪除離開窗口的位置。重複數值只增減頻率，不會誤刪其他位置。''',
'時間 O(n log n)，空間 O(n)，包含 Python 排序、排名、Fenwick 與輸入緩衝；不是用 list 中途插入的 O(n²) 解法。',
'當前值不能先加入再找最近值，否則永遠得到0；第一筆不記差。',
[('第一筆','W=1，數列8,3,6。','8','差值總和',0),('讀入3','只可比較前一筆8，差5。','8→3','差值總和',5),('讀入6','8已過期，只比較3，差3。','3→6','差值總和',8)],
r'''import sys,bisect
t=list(map(int,sys.stdin.buffer.read().split())); n,W=t[:2]; a=t[2:]; xs=sorted(set(a)); z=len(xs); rk=[bisect.bisect_left(xs,x)+1 for x in a]; bit=[0]*(z+1)
def update(i,d):
    while i<=z: bit[i]+=d; i+=i&-i
def prefix(i):
    s=0
    while i: s+=bit[i]; i-=i&-i
    return s
def kth(k):
    p=0; step=1<<(z.bit_length()-1)
    while step:
        j=p+step
        if j<=z and bit[j]<k: p=j; k-=bit[j]
        step//=2
    return xs[p]
ans=0
for i,x in enumerate(a):
    if i:
        s=prefix(rk[i]-1); count=min(i,W); d=10**20
        if s: d=min(d,x-kth(s))
        if s<count: d=min(d,kth(s+1)-x)
        ans+=d
    update(rk[i],1)
    if i>=W: update(rk[i-W],-1)
print(ans)''',
r'''int main(){ios::sync_with_stdio(false);cin.tie(nullptr);int n,W;cin>>n>>W;vector<ll>a(n),x;for(ll&v:a)cin>>v;x=a;sort(x.begin(),x.end());x.erase(unique(x.begin(),x.end()),x.end());int z=x.size();vector<int>rk(n),b(z+1);for(int i=0;i<n;i++)rk[i]=lower_bound(x.begin(),x.end(),a[i])-x.begin()+1;auto up=[&](int i,int d){for(;i<=z;i+=i&-i)b[i]+=d;};auto sum=[&](int i){int s=0;for(;i;i-=i&-i)s+=b[i];return s;};auto kth=[&](int k){int p=0;for(int h=1<<__lg(z);h;h/=2)if(p+h<=z&&b[p+h]<k){k-=b[p+h];p+=h;}return x[p];};ll ans=0;for(int i=0;i<n;i++){if(i){int s=sum(rk[i]-1),cnt=min(i,W);ll d=LLONG_MAX;if(s)d=min(d,a[i]-kth(s));if(s<cnt)d=min(d,kth(s+1)-a[i]);ans+=d;}up(rk[i],1);if(i>=W)up(rk[i-W],-1);}cout<<ans<<'\n';}''')

add(678,'trees','DFS 路徑窗口與可回復 Fenwick',
r'''DFS 到 v 前，兩色 Fenwick 樹只保存路徑上最近 L 個嚴格祖先。進入 v 時，若路徑太長，先暫時移除深度比 v 少 L+1 的祖先；查另一色、排名小於 a[v] 的前綴和後，再把 v 加入並往孩子走。
離開 v 時刪掉 v，再恢復進入時暫時移除的祖先。這使兄弟子樹看到完全相同的父路徑狀態。以進出事件堆疊取代遞迴，保持長鏈安全；L=0 時每次查詢前會移除最後祖先，答案自然全零。''',
'時間 O(n log n)，空間 O(n)，含 Python 顯式事件堆疊、路徑、壓縮與輸入緩衝；n≤50000。',
'只限制邊數距離，不是值差；離開子樹一定要恢復被暫時移除的遠祖先。',
[('進入根','鏈值1,4,5、色0,1,0，L=1。','根1','根答案',0),('進入第二點','根異色且1<4，在距離1內。','1→4','第二點答案',1),('進入第三點','移除距離2的根，只看色1的4。','4→5','第三點答案',1)],
r'''import sys,bisect
it=iter(map(int,sys.stdin.buffer.read().split())); n,L=next(it),next(it); ac=[(next(it),next(it)) for _ in range(n)]; ch=[[] for _ in range(n)]
for v in range(1,n): ch[next(it)-1].append(v)
xs=sorted({a for a,c in ac}); z=len(xs); rk=[bisect.bisect_left(xs,a)+1 for a,c in ac]; bit=[[0]*(z+1) for _ in range(2)]
def up(v,d):
    i=rk[v]; b=bit[ac[v][1]]
    while i<=z: b[i]+=d; i+=i&-i
path=[]; ans=[0]*n; st=[(0,0,-1)]
while st:
    v,kind,old=st.pop()
    if kind:
        path.pop(); up(v,-1)
        if old!=-1: up(old,1)
        continue
    old=path[-L-1] if len(path)>L else -1
    if old!=-1: up(old,-1)
    b=bit[ac[v][1]^1]; i=rk[v]-1; s=0
    while i: s+=b[i]; i-=i&-i
    ans[v]=s; up(v,1); path.append(v); st.append((v,1,old))
    for u in reversed(ch[v]): st.append((u,0,-1))
print('\n'.join(map(str,ans)))''',
r'''int main(){ios::sync_with_stdio(false);cin.tie(nullptr);int n,L;cin>>n>>L;vector<int>a(n),c(n),x;for(int i=0;i<n;i++){cin>>a[i]>>c[i];x.push_back(a[i]);}vector<vector<int>>ch(n);for(int i=1,p;i<n;i++){cin>>p;ch[p-1].push_back(i);}sort(x.begin(),x.end());x.erase(unique(x.begin(),x.end()),x.end());int z=x.size();vector<int>rk(n);for(int i=0;i<n;i++)rk[i]=lower_bound(x.begin(),x.end(),a[i])-x.begin()+1;vector<vector<int>>b(2,vector<int>(z+1));auto up=[&](int v,int d){for(int i=rk[v];i<=z;i+=i&-i)b[c[v]][i]+=d;};vector<int>path,ans(n);vector<array<int,3>>st{{0,0,-1}};while(!st.empty()){auto[v,kind,old]=st.back();st.pop_back();if(kind){path.pop_back();up(v,-1);if(old>=0)up(old,1);continue;}old=path.size()>(unsigned)L?path[path.size()-L-1]:-1;if(old>=0)up(old,-1);for(int i=rk[v]-1;i;i-=i&-i)ans[v]+=b[c[v]^1][i];up(v,1);path.push_back(v);st.push_back({v,1,old});for(auto it=ch[v].rbegin();it!=ch[v].rend();it++)st.push_back({*it,0,-1});}for(int v:ans)cout<<v<<'\n';}''')
add(679,'trees','重心分解與路徑標記和配對',
r'''移除一個重心後，每個剩餘子樹至多原大小一半。對每個鄰接子樹，列出從重心到其頂點的路徑標記和（包含重心）。先查先前子樹的頻率表：若本路徑和為 s，需要另一端路徑和 K−s+a[重心]；再把本子樹所有和加入表。頻率表起始只有重心自己。
先查後加使同一子樹內的點對不會在這層被計入，重心到自己也不計。任何不同頂點對在分解樹上第一次被重心分離時，恰有唯一路徑經該重心，所以恰被計一次；同側的點對交給後續子問題。標記非負，路徑和大於 K 的分支可提前剪枝。''',
'時間 O(n log n)，空間 O(n)（逐子樹暫存與頻率表），Python 圖與輸入緩衝 O(n)。顯式堆疊避免 n=30000 長鏈遞迴溢位。',
'端點必須不同；合併路徑和時重心被算兩次，須扣掉一次，K=0 也不能忽略零標記分支。',
[('重心啟始','三點鏈皆0，K=0，重心為2。','2','頻率0',1),('第一側配對','頂點1與重心成一對，再加入1。','1—2','累計點對',1),('第二側配對','頂點3可配重心與頂點1。','1—2—3','累計點對',3)],
r'''import sys
it=iter(map(int,sys.stdin.buffer.read().split())); n,K=next(it),next(it); a=[next(it) for _ in range(n)]; g=[[] for _ in range(n)]
for _ in range(n-1):
    u,v=next(it)-1,next(it)-1; g[u].append(v); g[v].append(u)
dead=[False]*n; size=[0]*n; parent=[-1]*n; tasks=[0]; ans=0
while tasks:
    root=tasks.pop(); order=[root]; parent[root]=-1
    for u in order:
        for v in g[u]:
            if not dead[v] and v!=parent[u]: parent[v]=u; order.append(v)
    total=len(order)
    for u in reversed(order):
        size[u]=1+sum(size[v] for v in g[u] if not dead[v] and parent[v]==u)
    center=min(order,key=lambda u:max([total-size[u]]+[size[v] for v in g[u] if not dead[v] and parent[v]==u]))
    freq={a[center]:1}; dead[center]=True
    for v in g[center]:
        if dead[v]: continue
        vals=[]; st=[(v,center,a[center]+a[v])]
        while st:
            u,p,s=st.pop()
            if s>K: continue
            vals.append(s)
            for z in g[u]:
                if not dead[z] and z!=p: st.append((z,u,s+a[z]))
        for s in vals: ans+=freq.get(K-s+a[center],0)
        for s in vals: freq[s]=freq.get(s,0)+1
        tasks.append(v)
print(ans)''',
r'''int main(){ios::sync_with_stdio(false);cin.tie(nullptr);int n,K;cin>>n>>K;vector<int>a(n);for(int&x:a)cin>>x;vector<vector<int>>g(n);for(int i=1,u,v;i<n;i++){cin>>u>>v;--u;--v;g[u].push_back(v);g[v].push_back(u);}vector<int>dead(n),sz(n),p(n),tasks{0};ll ans=0;while(!tasks.empty()){int r=tasks.back();tasks.pop_back();vector<int>ord{r};p[r]=-1;for(int i=0;i<(int)ord.size();i++){int u=ord[i];for(int v:g[u])if(!dead[v]&&v!=p[u]){p[v]=u;ord.push_back(v);}}for(int i=ord.size()-1;i>=0;i--){int u=ord[i];sz[u]=1;for(int v:g[u])if(!dead[v]&&p[v]==u)sz[u]+=sz[v];}int c=r,best=n+1;for(int u:ord){int mx=ord.size()-sz[u];for(int v:g[u])if(!dead[v]&&p[v]==u)mx=max(mx,sz[v]);if(mx<best){best=mx;c=u;}}unordered_map<int,ll>f;f[a[c]]=1;dead[c]=1;for(int v:g[c])if(!dead[v]){vector<int>vals;vector<array<int,3>>st{{v,c,a[c]+a[v]}};while(!st.empty()){auto[u,pa,s]=st.back();st.pop_back();if(s>K)continue;vals.push_back(s);for(int z:g[u])if(!dead[z]&&z!=pa)st.push_back({z,u,s+a[z]});}for(int s:vals){auto it=f.find(K-s+a[c]);if(it!=f.end())ans+=it->second;}for(int s:vals)f[s]++;tasks.push_back(v);}}cout<<ans<<'\n';}''')

add(680,'data-structures','可翻轉的子序列摘要線段樹',
r'''每段保存0與1個數、01與10位置對數、010與101三元組數。串接 A,B 時，010 除了兩段內部答案，還有 A 的01配 B 的0，以及 A 的0配 B 的10；其他摘要也依分界位置列出所有可能。
整段翻色會把0↔1、01↔10、010↔101，所以只需交換三對統計並切換懶標記。線段樹合併保持原本左右順序，延遲翻轉在下探前傳給孩子。摘要計算的是子序列位置組合，並不要求三點相鄰。''',
'建樹 O(n)，翻轉或查詢 O(log n)，空間 O(n)；Python 輸入與輸出緩衝 O(n+q)。三元組至多 C(n,3)，在 n≤10^5 下64位元足夠。',
'只存010不夠，翻色後需要原101；查詢合併不能交換左右。',
[('原字串','字串010，只有一組三元組。','0|1|0','010數',1),('整段翻色','變成101，原010轉為101。','1|0|1','010數',0),('再翻中央','中央0變1，得到111。','1|1|1','010數',0)],
r'''import sys
def merge(a,b):
    x,y,p,q,s,t=a; X,Y,P,Q,S,T=b
    return (x+X,y+Y,p+P+x*Y,q+Q+y*X,s+S+p*X+x*Q,t+T+q*Y+y*P)
it=iter(sys.stdin.buffer.read().split()); n=int(next(it)); q=int(next(it)); s=next(it); tr=[(0,)*6]*(4*n); lazy=[0]*(4*n)
def build(v,l,r):
    if r-l==1: tr[v]=(1,0,0,0,0,0) if s[l]==48 else (0,1,0,0,0,0); return
    m=(l+r)//2; build(v*2,l,m); build(v*2+1,m,r); tr[v]=merge(tr[v*2],tr[v*2+1])
def flip(v):
    a=tr[v]; tr[v]=(a[1],a[0],a[3],a[2],a[5],a[4]); lazy[v]^=1
def run(v,l,r,L,R,change):
    if R<=l or r<=L: return (0,)*6
    if L<=l and r<=R:
        if change: flip(v)
        return tr[v]
    if lazy[v]: flip(v*2); flip(v*2+1); lazy[v]=0
    m=(l+r)//2; a=run(v*2,l,m,L,R,change); b=run(v*2+1,m,r,L,R,change)
    if change: tr[v]=merge(tr[v*2],tr[v*2+1])
    return merge(a,b)
build(1,0,n); out=[]
for _ in range(q):
    t,l,r=int(next(it)),int(next(it))-1,int(next(it)); a=run(1,0,n,l,r,t==1)
    if t==2: out.append(str(a[4]))
print('\n'.join(out))''',
r'''using S=array<ll,6>;S mg(S a,S b){return {a[0]+b[0],a[1]+b[1],a[2]+b[2]+a[0]*b[1],a[3]+b[3]+a[1]*b[0],a[4]+b[4]+a[2]*b[0]+a[0]*b[3],a[5]+b[5]+a[3]*b[1]+a[1]*b[2]};}vector<S>tr;vector<int>lazy;string s;void flip(int v){swap(tr[v][0],tr[v][1]);swap(tr[v][2],tr[v][3]);swap(tr[v][4],tr[v][5]);lazy[v]^=1;}void build(int v,int l,int r){if(r-l==1){tr[v][s[l]-'0']=1;return;}int m=(l+r)/2;build(v*2,l,m);build(v*2+1,m,r);tr[v]=mg(tr[v*2],tr[v*2+1]);}S run(int v,int l,int r,int L,int R,bool ch){if(R<=l||r<=L)return {};if(L<=l&&r<=R){if(ch)flip(v);return tr[v];}if(lazy[v]){flip(v*2);flip(v*2+1);lazy[v]=0;}int m=(l+r)/2;S a=run(v*2,l,m,L,R,ch),b=run(v*2+1,m,r,L,R,ch);if(ch)tr[v]=mg(tr[v*2],tr[v*2+1]);return mg(a,b);}int main(){ios::sync_with_stdio(false);cin.tie(nullptr);int n,q;cin>>n>>q>>s;tr.resize(4*n);lazy.resize(4*n);build(1,0,n);while(q--){int t,l,r;cin>>t>>l>>r;auto a=run(1,0,n,l-1,r,t==1);if(t==2)cout<<a[4]<<'\n';}}''')

add(681,'data-structures','連通塊色差與全域合格數維護',
r'''令每點色0貢獻+1、色1貢獻−1，DSU 根保存塊內總和 d，塊均衡恰等價於 d=0。另維護全域均衡塊數 ans，任何修改前先扣掉受影響根的舊貢獻，修改後再加回新貢獻。
加邊若兩根不同就按大小合併並相加色差；同根不用改。翻色時只需在所屬根的 d 加上−2×該點舊貢獻，再反轉點貢獻。此操作不改連通關係，因此 DSU 能處理所有操作，不需要重建或離線回滾。''',
'時間 O((n+q)α(n))，空間 O(n)，Python 整批輸入與輸出緩衝 O(n+q)。',
'初始孤立點都是不均衡；同根重邊不能重複扣減全域計數。',
[('初始兩點','顏色0,1，各自獨立。','+1|-1','均衡塊數',0),('加入連邊','合併色差為0。','{1,2}:0','均衡塊數',1),('翻轉第二點','色1變0，色差由0變2。','{1,2}:2','均衡塊數',0)],
r'''import sys
it=iter(map(int,sys.stdin.buffer.read().split())); n,q=next(it),next(it); c=[1-2*next(it) for _ in range(n)]; d=c[:]; p=list(range(n)); sz=[1]*n; ans=0; out=[]
def f(x):
    while p[x]!=x: p[x]=p[p[x]]; x=p[x]
    return x
for _ in range(q):
    t=next(it)
    if t==1:
        u,v=f(next(it)-1),f(next(it)-1)
        if u!=v:
            ans-=(d[u]==0)+(d[v]==0)
            if sz[u]<sz[v]: u,v=v,u
            p[v]=u; sz[u]+=sz[v]; d[u]+=d[v]; ans+=d[u]==0
    elif t==2:
        u=next(it)-1; r=f(u); ans-=d[r]==0; d[r]-=2*c[u]; c[u]*=-1; ans+=d[r]==0
    else: out.append(str(ans))
print('\n'.join(out))''',
r'''int main(){ios::sync_with_stdio(false);cin.tie(nullptr);int n,q;cin>>n>>q;vector<int>c(n),d(n),p(n),sz(n,1);iota(p.begin(),p.end(),0);for(int i=0,x;i<n;i++){cin>>x;c[i]=d[i]=1-2*x;}auto f=[&](int x){while(p[x]!=x){p[x]=p[p[x]];x=p[x];}return x;};int ans=0;while(q--){int t,u,v;cin>>t;if(t==1){cin>>u>>v;u=f(u-1);v=f(v-1);if(u!=v){ans-=(d[u]==0)+(d[v]==0);if(sz[u]<sz[v])swap(u,v);p[v]=u;sz[u]+=sz[v];d[u]+=d[v];ans+=d[u]==0;}}else if(t==2){cin>>u;--u;int r=f(u);ans-=d[r]==0;d[r]-=2*c[u];c[u]*=-1;ans+=d[r]==0;}else cout<<ans<<'\n';}}''')

add(682,'data-structures','帶 XOR 位勢的二分圖 DSU',
r'''DSU 每點保存與父根的顏色 XOR 關係；find 回傳根及到根的 XOR 位勢。每條邊要求兩端不同色，因此同根時若兩位勢 XOR 不等於1，就把該塊標為衝突；衝突永久存在。
無衝突塊只有兩種完整二染方向。固定根指定0，保存與既定標記不符的數量 e；另一方向的不符數為 size−e。合併兩根時，相對位勢若為1，就先將被掛根的 e 換成 size−e 再相加。每次更新先移除舊合格塊數、再加入新根是否無衝突且 min(e,size−e)≤K，得到即時答案。''',
'以大小合併、不做路徑壓縮，find O(log n)，總 O((n+m) log n)，空間 O(n)；Python 輸入及輸出緩衝 O(n+m)。',
'自環必衝突；標記錯配要允許整塊翻色，不能只檢查固定根為0的方向。',
[('初始標記','三點皆標記0，K=0，各自可選指定0。','1|2|3','合格塊',3),('加入1−2','必異色，至少錯一點，合併塊不合格。','{1,2}|3','合格塊',1),('加入自環3−3','第三點也無法二染。','{1,2}|{3:衝突}','合格塊',0)],
r'''import sys
it=iter(map(int,sys.stdin.buffer.read().split())); n,m,K=next(it),next(it),next(it); err=[next(it) for _ in range(n)]; p=list(range(n)); sz=[1]*n; xr=[0]*n; bad=[False]*n; ans=n; out=[]
def find(x):
    z=0
    while p[x]!=x: z^=xr[x]; x=p[x]
    return x,z
def good(r): return not bad[r] and min(err[r],sz[r]-err[r])<=K
for _ in range(m):
    u,x=find(next(it)-1); v,y=find(next(it)-1)
    if u==v:
        ans-=good(u)
        if x^y!=1: bad[u]=True
        ans+=good(u)
    else:
        ans-=good(u)+good(v); t=x^y^1
        if sz[u]<sz[v]: u,v=v,u
        p[v]=u; xr[v]=t; err[u]+=sz[v]-err[v] if t else err[v]; sz[u]+=sz[v]; bad[u]|=bad[v]; ans+=good(u)
    out.append(str(ans))
print('\n'.join(out))''',
r'''int main(){ios::sync_with_stdio(false);cin.tie(nullptr);int n,m,K;cin>>n>>m>>K;vector<int>e(n),p(n),sz(n,1),xr(n),bad(n);for(int&x:e)cin>>x;iota(p.begin(),p.end(),0);auto f=[&](int x){int z=0;while(x!=p[x]){z^=xr[x];x=p[x];}return pair<int,int>{x,z};};auto good=[&](int r){return !bad[r]&&min(e[r],sz[r]-e[r])<=K;};int ans=n;while(m--){int a,b;cin>>a>>b;auto[u,x]=f(a-1);auto[v,y]=f(b-1);if(u==v){ans-=good(u);if((x^y)!=1)bad[u]=1;ans+=good(u);}else{ans-=good(u)+good(v);int t=x^y^1;if(sz[u]<sz[v])swap(u,v);p[v]=u;xr[v]=t;e[u]+=t?sz[v]-e[v]:e[v];sz[u]+=sz[v];bad[u]|=bad[v];ans+=good(u);}cout<<ans<<'\n';}}''')
add(683,'strings','字母前綴頻率與萬用字元補足條件',
r'''替兩字串建立26種已知字母的前綴頻率，問號數可由片段長減去已知字母總數得出。片段長度不同立即無解；相同長度時，令某字母兩側已知數為 a,b，最終至少需 max(a,b) 份。
因此所有字母的 max(a,b) 總和不超過片段長度，恰是可行條件：先用問號補足每種差額，剩餘問號兩側數量相同，可以同填任一字母。反之若總需求超長，不可能有共同頻率向量。每查詢只需26次減法與最大值。''',
'預處理 O(26(|A|+|B|))，每詢問 O(26)，空間同前綴表。Python 使用 array 的32位元頻率，兩條長200000字串約42MB，另輸入緩衝 O(|A|+|B|+q)。',
'只比較問號總數不夠；既定不同字母的差額也必須能被補足。',
[('擷取片段','A=a?，B=?b，長度都是2。','a:1|b:1','共同最低需求',2),('問號補足','A問號填b，B問號填a。','ab|ab','判定','YES'),('無問號變體','若A=aa、B=bb，max頻率總和4大於2。','aa|bb','判定','NO')],
r'''import sys
from array import array
it=iter(sys.stdin.buffer.read().split()); A=next(it); B=next(it); q=int(next(it))
def build(s):
    out=[]
    for c in range(97,123):
        a=array('i',[0]); x=0
        for v in s: x+=v==c; a.append(x)
        out.append(a)
    return out
pa,pb=build(A),build(B); out=[]
for _ in range(q):
    l,r,u,v=(int(next(it)) for _ in range(4)); length=r-l+1
    ok=length==v-u+1 and sum(max(pa[c][r]-pa[c][l-1],pb[c][v]-pb[c][u-1]) for c in range(26))<=length
    out.append('YES' if ok else 'NO')
print('\n'.join(out))''',
r'''int main(){ios::sync_with_stdio(false);cin.tie(nullptr);string a,b;int q;cin>>a>>b>>q;auto build=[](string s){vector<array<int,26>>p(s.size()+1);for(int i=0;i<(int)s.size();i++){p[i+1]=p[i];if(s[i]!='?')p[i+1][s[i]-'a']++;}return p;};auto A=build(a),B=build(b);while(q--){int l,r,u,v;cin>>l>>r>>u>>v;int need=0;for(int c=0;c<26;c++)need+=max(A[r][c]-A[l-1][c],B[v][c]-B[u-1][c]);cout<<(r-l==v-u&&need<=r-l+1?"YES":"NO")<<'\n';}}''')

add(684,'data-structures','重複盈餘的兩個至多窗口相減',
r'''對窗口定義盈餘 E=長度−不同值種類數=Σ(freq−1)。E=1 恰好是一種值出現兩次、其他都只一次；三次同值或兩組重複都會使 E≥2。答案可由長度限制下的 atMost(1) 減 atMost(0) 求得。
atMost(t) 用雙指標維護頻率與盈餘，新增已存在的值使 E 加一，移除後仍存在的值使 E 減一。固定右端 r，合法左端需同時大於等於窗口左界及 r−R+1、小於等於 r−L+1，取交集長度即可。兩個至多集合相減便留下恰好 E=1。''',
'時間期望 O(n)，空間 O(n)，含 Python 頻率雜湊表、輸入陣列與緩衝。',
'E是多出的出現次數，不能只計「出現至少兩次的種類數」，否則三連同值也會誤判。',
[('長度2','序列1,2,1，限制2至3；首段1,2盈餘0。','1|2','合格段數',0),('次段同樣不同','第二段2,1仍盈餘0。','2|1','合格段數',0),('整段長度3','1出現兩次，盈餘1。','1|2|1','合格段數',1)],
r'''import sys
t=list(map(int,sys.stdin.buffer.read().split())); n,L,R=t[:3]; a=t[3:]
def count(limit):
    freq={}; l=extra=ans=0
    for r,x in enumerate(a):
        old=freq.get(x,0); extra+=old>0; freq[x]=old+1
        while extra>limit:
            y=a[l]; freq[y]-=1; extra-=freq[y]>0; l+=1
        ans+=max(0,r-L+2-max(l,r-R+1))
    return ans
print(count(1)-count(0))''',
r'''int main(){ios::sync_with_stdio(false);cin.tie(nullptr);int n,L,R;cin>>n>>L>>R;vector<int>a(n);for(int&x:a)cin>>x;auto count=[&](int lim){unordered_map<int,int>f;int l=0,e=0;ll ans=0;for(int r=0;r<n;r++){e+=f[a[r]]++>0;while(e>lim){e+=--f[a[l++]]>0?-1:0;}ans+=max(0,r-L+2-max(l,r-R+1));}return ans;};cout<<count(1)-count(0)<<'\n';}''')

add(685,'number-theory','Möbius 反演與奇數個奇值組合',
r'''令 F(d) 為恰選 K 個、所有值皆是 d 倍數、總和為奇數的集合數。若其中奇值有 o 個、偶值有 e 個，則 F(d)=Σ奇數 j C(o,j)C(e,K−j)，不合法的組合數視為0。預先以階乘與逆階乘 O(1) 查組合數。
利用 Σ_{d|g} μ(d) 在 g=1 時為1、其餘為0，答案為 Σ μ(d)F(d)。偶數 d 的倍數全為偶數，F(d)=0，可略過。頻率倍數篩同時取得 o,e，線性篩求 μ；組合枚舉總量受所有輸入值的奇因數個數總和控制，而不是對每個 d 都無條件枚舉 K 次。''',
'時間 O(M log M+n log M+Σ_d min(K,o_d))，後項≤Σ_i τ(a_i)，M≤200000 時每數因數至多160，最壞約3200萬組合項；空間 O(M+n)，含 Python 輸入緩衝。Python 大界計算較重，見效能註記。',
'不是只選奇數值；奇數總和要求選奇數個奇值，偶值可以一起選。位置相同值仍獨立計組合。',
[('列出二元集合','值1,2,3，K=2。','{1,2}|{1,3}|{2,3}','總集合',3),('奇偶過濾','總和3、4、5，只有第一和第三為奇數。','{1,2}|{2,3}','奇和集合',2),('互質過濾','兩者最大公因數都1。','gcd1|gcd1','答案',2)],
r'''import sys
t=list(map(int,sys.stdin.buffer.read().split())); n,K,V=t[:3]; f=[0]*(V+1); P=1000000007
for x in t[3:]: f[x]+=1
fac=[1]*(n+1)
for i in range(1,n+1): fac[i]=fac[i-1]*i%P
inv=[1]*(n+1); inv[n]=pow(fac[n],P-2,P)
for i in range(n,0,-1): inv[i-1]=inv[i]*i%P
def C(n,k): return fac[n]*inv[k]%P*inv[n-k]%P if 0<=k<=n else 0
mu=[0]*(V+1); mu[1]=1; primes=[]; comp=bytearray(V+1)
for i in range(2,V+1):
    if not comp[i]: primes.append(i); mu[i]=-1
    for p in primes:
        if i*p>V: break
        comp[i*p]=1
        if i%p==0: break
        mu[i*p]=-mu[i]
ans=0
for d in range(1,V+1,2):
    if not mu[d]: continue
    o=sum(f[d::2*d]); e=sum(f[2*d::2*d])
    if o+e<K: continue
    low=max(1,K-e); low+=1-low%2
    val=sum(C(o,j)*C(e,K-j)%P for j in range(low,min(K,o)+1,2))%P
    ans=(ans+mu[d]*val)%P
print(ans)''',
r'''ll pw(ll a,ll b){ll z=1;for(;b;b/=2,a=a*a%MOD)if(b&1)z=z*a%MOD;return z;}int main(){ios::sync_with_stdio(false);cin.tie(nullptr);int n,K,V;cin>>n>>K>>V;vector<int>f(V+1);for(int i=0,x;i<n;i++){cin>>x;f[x]++;}vector<ll>fac(n+1,1),inv(n+1,1);for(int i=1;i<=n;i++)fac[i]=fac[i-1]*i%MOD;inv[n]=pw(fac[n],MOD-2);for(int i=n;i;i--)inv[i-1]=inv[i]*i%MOD;auto C=[&](int a,int b){return b<0||b>a?0LL:fac[a]*inv[b]%MOD*inv[a-b]%MOD;};vector<int>mu(V+1),pr,comp(V+1);mu[1]=1;for(int i=2;i<=V;i++){if(!comp[i]){pr.push_back(i);mu[i]=-1;}for(int p:pr){if((ll)i*p>V)break;comp[i*p]=1;if(i%p==0)break;mu[i*p]=-mu[i];}}ll ans=0;for(int d=1;d<=V;d+=2)if(mu[d]){int o=0,e=0;for(int j=d;j<=V;j+=d)if(j&1)o+=f[j];else e+=f[j];ll val=0;for(int j=1;j<=min(K,o);j+=2)val=(val+C(o,j)*C(e,K-j))%MOD;ans=(ans+mu[d]*val)%MOD;}cout<<(ans+MOD)%MOD<<'\n';}''')

add(686,'graphs','度數定向三角形枚舉扣除閉口',
r'''對每個中心 v，設 t 是度數嚴格小於 v 的鄰居數，先計 C(t,2) 個候選。當兩個端點相鄰時，這個候選其實是三角形，必須扣除。只在三角形有唯一嚴格最高度數頂點時扣一次。
為避免逐中心枚舉所有鄰居對，將每條邊依 (度數,編號) 由小指向大。對 u 標記其所有出鄰居，枚舉 u→v→w，若 w 被標記就找到唯一排序 u<v<w 的三角形。出度至多 O(√m)，總枚舉 O(m√m)；最高排序頂點 w 僅在度數也嚴格較大時才扣候選。''',
'時間 O(n+m√m)，空間 O(n+m)，含 Python 圖、定向鄰接表與輸入緩衝。m≤200000，不採用可能達 O(n²) 的星狀鄰居配對。',
'度數相等不能當較小；編號只用於唯一枚舉三角形，不能改變合法性。',
[('星狀候選','中心1連2,3,4，度數3，其餘度數1。','2|3|4','候選',3),('加入端點邊','加2−3後，兩者度數2仍低於中心3。','2—3','候選',3),('扣掉閉口','{2,3}形成三角形，其餘兩組仍開口。','{2,4}|{3,4}','答案',2)],
r'''import sys
it=iter(map(int,sys.stdin.buffer.read().split())); n,m=next(it),next(it); edges=[(next(it)-1,next(it)-1) for _ in range(m)]; deg=[0]*n
for u,v in edges: deg[u]+=1; deg[v]+=1
out=[[] for _ in range(n)]; lower=[0]*n
for u,v in edges:
    if deg[u]>deg[v]: lower[u]+=1
    if deg[v]>deg[u]: lower[v]+=1
    if (deg[u],u)>(deg[v],v): u,v=v,u
    out[u].append(v)
ans=sum(x*(x-1)//2 for x in lower); mark=[-1]*n
for u in range(n):
    for w in out[u]: mark[w]=u
    for v in out[u]:
        for w in out[v]:
            if mark[w]==u and deg[w]>deg[v] and deg[w]>deg[u]: ans-=1
print(ans)''',
r'''int main(){ios::sync_with_stdio(false);cin.tie(nullptr);int n,m;cin>>n>>m;vector<pair<int,int>>e(m);vector<int>d(n),low(n);for(auto&[u,v]:e){cin>>u>>v;--u;--v;d[u]++;d[v]++;}vector<vector<int>>g(n);for(auto[u,v]:e){low[u]+=d[u]>d[v];low[v]+=d[v]>d[u];if(make_pair(d[u],u)>make_pair(d[v],v))swap(u,v);g[u].push_back(v);}ll ans=0;for(int x:low)ans+=(ll)x*(x-1)/2;vector<int>mark(n,-1);for(int u=0;u<n;u++){for(int w:g[u])mark[w]=u;for(int v:g[u])for(int w:g[v])if(mark[w]==u&&d[w]>d[v]&&d[w]>d[u])ans--;}cout<<ans<<'\n';}''')

add(687,'sorting','同行同列相鄰點的遮擋判定',
r'''固定 x 並按 y 排序，線段內沒有其他點的同列配對，恰是此排序中相鄰兩點；若不相鄰，中間至少有一個點遮擋。逐相鄰配對檢查異色及座標差≤D 即可。
再交換兩軸角色，依 y,x 排序處理同橫列。座標互異保證不同點不可能同時同x又同y，所以兩次掃描的配對集合互斥，答案可直接相加。遮擋檢查與中間點顏色無關。''',
'時間 O(n log n)，空間 O(n)，包含 Python 兩次排序與輸入緩衝；D與座標差以64位元計算。',
'不能只按顏色分組後找相鄰，因為同色點也會遮擋異色端點。',
[('排列同橫列','(0,0)色0、(1,0)色0、(2,0)色1，D=3。','0:0|1:0|2:1','相鄰對',2),('檢查顏色','只有座標1與2異色。','1:0|2:1','合格對',1),('排除跨點線段','0與2之間有座標1，不能再計。','0—1—2','答案',1)],
r'''import sys
it=iter(map(int,sys.stdin.buffer.read().split())); n,D=next(it),next(it); p=[(next(it),next(it),next(it)) for _ in range(n)]; ans=0
for swap in range(2):
    a=sorted((y,x,c) if swap else (x,y,c) for x,y,c in p)
    for (x,y,c),(X,Y,C) in zip(a,a[1:]): ans+=x==X and Y-y<=D and c!=C
print(ans)''',
r'''int main(){ios::sync_with_stdio(false);cin.tie(nullptr);int n;ll D;cin>>n>>D;vector<array<ll,3>>p(n);for(auto&a:p)cin>>a[0]>>a[1]>>a[2];ll ans=0;for(int t=0;t<2;t++){sort(p.begin(),p.end());for(int i=1;i<n;i++)ans+=p[i][0]==p[i-1][0]&&p[i][1]-p[i-1][1]<=D&&p[i][2]!=p[i-1][2];for(auto&a:p)swap(a[0],a[1]);}cout<<ans<<'\n';}''')

add(688,'dp','恰 K 段的奇偶前綴單調佇列 DP',
r'''設前綴和 P[i]，dp[k][i] 是前 i 項選恰 k 段的最大收益。最後位置可不選，沿用 dp[k][i−1]；若最後一段為 (j,i]，需 i−D≤j<i 且 P[j],P[i] 同奇偶，候選是 dp[k−1][j]+P[i]−P[j]。
固定 k 掃描 i，以兩個單調佇列分奇偶維護 dp[k−1][j]−P[j] 的窗口最大值，每步加入 j=i−1、刪 j<i−D。不可達狀態不加入。每個解按最後一段唯一分解，故轉移完整；上一層涵蓋至 j，允許下一段相鄰而不重疊。''',
'時間 O(Kn)，K≤20；滾動陣列及佇列 O(n)，Python 輸入緩衝 O(n)。收益可能為負，必用負無限大表示不可達。',
'不能把「恰好K」改成「至多K」；負收益的合法答案不能誤輸出0。',
[('前綴和','數列−2,3,1，K=1,D=2，P=0,−2,1,2。','0|-2|1|2','目標段數',1),('第一段候選','單選−2為偶和，收益−2。','-2','目前最佳',-2),('後段改善','選3,1得偶和4，長度2。','3|1','答案',4)],
r'''import sys
from collections import deque
t=list(map(int,sys.stdin.buffer.read().split())); n,K,D=t[:3]; P=[0]
for x in t[3:]: P.append(P[-1]+x)
neg=-10**30; prev=[0]*(n+1)
for k in range(1,K+1):
    cur=[neg]*(n+1); qs=[deque(),deque()]
    for i in range(1,n+1):
        j=i-1
        if prev[j]!=neg:
            q=qs[P[j]&1]; v=prev[j]-P[j]
            while q and q[-1][1]<=v: q.pop()
            q.append((j,v))
        for q in qs:
            while q and q[0][0]<i-D: q.popleft()
        q=qs[P[i]&1]; cur[i]=max(cur[i-1],P[i]+q[0][1] if q else neg)
    prev=cur
print('NONE' if prev[n]==neg else prev[n])''',
r'''int main(){ios::sync_with_stdio(false);cin.tie(nullptr);int n,K,D;cin>>n>>K>>D;vector<ll>P(n+1);for(int i=1;i<=n;i++){ll x;cin>>x;P[i]=P[i-1]+x;}const ll NEG=-4e18;vector<ll>prev(n+1);for(int k=1;k<=K;k++){vector<ll>cur(n+1,NEG);deque<pair<int,ll>>q[2];for(int i=1;i<=n;i++){int j=i-1;if(prev[j]!=NEG){auto&d=q[(P[j]%2+2)%2];ll v=prev[j]-P[j];while(!d.empty()&&d.back().second<=v)d.pop_back();d.push_back({j,v});}for(auto&d:q)while(!d.empty()&&d.front().first<i-D)d.pop_front();auto&d=q[(P[i]%2+2)%2];cur[i]=max(cur[i-1],d.empty()?NEG:P[i]+d.front().second);}prev.swap(cur);}if(prev[n]==NEG)cout<<"NONE\n";else cout<<prev[n]<<'\n';}''')
add(689,'data-structures','列欄分離與門檻後綴加總',
r'''固定列值 x，這列對答案的貢獻是 Σ欄 max(0,x+c)。只有 c>−x 的欄有效，因此等於有效欄值總和加 x 乘有效欄數。用兩組 Fenwick 樹分別維護列值、欄值的頻率與總和，即可 O(log q) 求此貢獻。
更新一列時先扣舊列對所有欄的貢獻，再加新列貢獻，並在列值結構中替換該值；更新欄完全對稱。離線先模擬操作蒐集所有可能列欄值作座標壓縮，實際更新仍按原順序。每個受影響格恰在那一列或一欄中，所以差量更新不會漏或重複。''',
'時間 O((n+m+q) log(q+1))，空間 O(n+m+q)，含 Python 操作、座標與輸入緩衝。不建立 n×m 表；總和上界約1.6×10^17可用64位元。',
'負值格應貢獻0；門檻等於−x時格值為0，可直接排除。',
[('初始表','一列兩欄，全0。','0|0','正值總和',0),('列加3','兩格變3與3。','3|3','正值總和',6),('第一欄減5','兩格變−2與3，只加正值。','-2|3','正值總和',3)],
r'''import sys,bisect
t=sys.stdin.buffer.read().split(); n,m,q=map(int,t[:3]); ops=[(t[i],int(t[i+1])-1,int(t[i+2])) for i in range(3,len(t),3)]; rows=[0]*n; cols=[0]*m; values={0}
for typ,i,x in ops:
    a=rows if typ==b'R' else cols; a[i]+=x; values.add(a[i])
xs=sorted(values); z=len(xs)
class Bag:
    def __init__(self,count):
        self.c=[0]*(z+1); self.s=[0]*(z+1); self.count=count; self.total=0; self.add(0,count)
    def add(self,x,d):
        self.total+=x*d; i=bisect.bisect_left(xs,x)+1
        while i<=z: self.c[i]+=d; self.s[i]+=x*d; i+=i&-i
    def contribution(self,x):
        i=bisect.bisect_right(xs,-x); c=s=0
        while i: c+=self.c[i]; s+=self.s[i]; i-=i&-i
        return self.total-s+x*(self.count-c)
bags=[Bag(n),Bag(m)]; a=[[0]*n,[0]*m]; ans=0; out=[]
for typ,i,x in ops:
    k=0 if typ==b'R' else 1; old=a[k][i]; new=old+x; ans+=bags[k^1].contribution(new)-bags[k^1].contribution(old); bags[k].add(old,-1); bags[k].add(new,1); a[k][i]=new; out.append(str(ans))
print('\n'.join(out))''',
r'''struct Bag{vector<ll>c,s;vector<ll>*x;ll cnt,total=0;Bag(vector<ll>&v,ll n):c(v.size()+1),s(v.size()+1),x(&v),cnt(n){add(0,n);}void add(ll v,ll d){total+=v*d;for(int i=lower_bound(x->begin(),x->end(),v)-x->begin()+1;i<(int)c.size();i+=i&-i){c[i]+=d;s[i]+=v*d;}}ll get(ll v){int i=upper_bound(x->begin(),x->end(),-v)-x->begin();ll C=0,S=0;for(;i;i-=i&-i){C+=c[i];S+=s[i];}return total-S+v*(cnt-C);}};int main(){ios::sync_with_stdio(false);cin.tie(nullptr);int n,m,q;cin>>n>>m>>q;vector<tuple<char,int,ll>>ops;vector<ll>r(n),c(m),x{0};while(q--){char t;int i;ll v;cin>>t>>i>>v;--i;ops.push_back({t,i,v});auto&a=t=='R'?r:c;a[i]+=v;x.push_back(a[i]);}sort(x.begin(),x.end());x.erase(unique(x.begin(),x.end()),x.end());Bag R(x,n),C(x,m);fill(r.begin(),r.end(),0);fill(c.begin(),c.end(),0);ll ans=0;for(auto[t,i,v]:ops){auto&a=t=='R'?r:c;Bag &own=t=='R'?R:C,&other=t=='R'?C:R;ll old=a[i],nw=old+v;ans+=other.get(nw)-other.get(old);own.add(old,-1);own.add(nw,1);a[i]=nw;cout<<ans<<'\n';}}''')

add(690,'dp','升降尾狀態與雙向 Fenwick 最大值',
r'''up[i] 表示以 a[i] 結束、最後一步上升的最長長度，down[i] 表示最後下降；單點同時初始化為1。上升只能從值≤a[i]−D 的下降尾狀態接續，下降只能從值≥a[i]+D 的上升尾狀態接續。
壓縮數值，用普通 Fenwick 查較小值的 down 最大值、逆排名 Fenwick 查較大值的 up 最大值。兩個候選都算完後才更新當前值。每個合法長序列依最後一步唯一歸入升或降，且前一尾狀態必為相反方向，因此這兩種轉移足夠。''',
'時間 O(n log n)，空間 O(n)，包含 Python 壓縮排序、兩棵 Fenwick 與輸入緩衝；D≥1，沒有零差合法轉移。',
'差值要求至少D而非至多D；不能僅套用無門檻的相鄰峰谷刪除法。',
[('單點初始化','數列0,3,1，D=2。','0','最長',1),('上升接續','3−0=3≥2，up長度2。','0→3','最長',2),('下降接續','3−1=2≥2，down由up延伸。','0→3→1','最長',3)],
r'''import sys,bisect
t=list(map(int,sys.stdin.buffer.read().split())); n,D=t[:2]; a=t[2:]; xs=sorted(set(a)); z=len(xs); small=[0]*(z+1); large=[0]*(z+1)
def get(b,i):
    v=0
    while i: v=max(v,b[i]); i-=i&-i
    return v
def put(b,i,v):
    while i<=z: b[i]=max(b[i],v); i+=i&-i
ans=1
for x in a:
    up=1+get(small,bisect.bisect_right(xs,x-D)); down=1+get(large,z-bisect.bisect_left(xs,x+D)); r=bisect.bisect_left(xs,x)+1
    put(small,r,down); put(large,z-r+1,up); ans=max(ans,up,down)
print(ans)''',
r'''int main(){ios::sync_with_stdio(false);cin.tie(nullptr);int n;ll D;cin>>n>>D;vector<ll>a(n),x;for(ll&v:a)cin>>v;x=a;sort(x.begin(),x.end());x.erase(unique(x.begin(),x.end()),x.end());int z=x.size();vector<int>b(z+1),c(z+1);auto get=[](vector<int>&t,int i){int v=0;for(;i;i-=i&-i)v=max(v,t[i]);return v;};auto put=[&](vector<int>&t,int i,int v){for(;i<=z;i+=i&-i)t[i]=max(t[i],v);};int ans=1;for(ll v:a){int up=1+get(b,upper_bound(x.begin(),x.end(),v-D)-x.begin()),dn=1+get(c,z-(lower_bound(x.begin(),x.end(),v+D)-x.begin())),r=lower_bound(x.begin(),x.end(),v)-x.begin()+1;put(b,r,dn);put(c,z-r+1,up);ans=max({ans,up,dn});}cout<<ans<<'\n';}''')

add(691,'dp','互補餘數分組與兩色覆蓋位元 DP',
r'''數值只需看模 M 的餘數。非自補的一組 {r,M−r} 中不能同時選兩側，但同側任意兩數都相容。固定選某側且需要其具有的顏色時，多選該側所有位置不會破壞條件，故只考慮全選左、全選右、全不選。
自補餘數0及偶數M的M/2最多只能選一個位置，可依存在的顏色選一個。各互補組之間完全相容，用4個顏色覆蓋狀態（空、色0、色1、兩色）做最大選取數 DP，最後取兩色狀態。這比單純每組取較多側多了必要的全域兩色約束。''',
'時間 O(n+M)，空間 O(M)，Python 輸入緩衝 O(n)；每組至多三種選擇與4個狀態。',
'不能選完無色限制最大集合後才檢查顏色，較小側有時是唯一補足缺色的方法。',
[('互補組','M=4，餘數1有兩個色0，餘數3有一個色1。','1:2個色0|3:1個色1','可同選兩側','否'),('自補組','另有餘數0一個色1，可補齊第二色。','0:1個色1','可選上限',1),('合併覆蓋','選兩個餘1加一個餘0，總數3且兩色俱有。','1|1|0','答案',3)],
r'''import sys
it=iter(map(int,sys.stdin.buffer.read().split())); n,M=next(it),next(it); counts=[[0,0] for _ in range(M)]
for _ in range(n):
    a,c=next(it),next(it); counts[a%M][c]+=1
dp=[0,-10**9,-10**9,-10**9]
for r in range(M//2+1):
    s=(-r)%M; choices=[(0,0)]
    if r==s:
        choices += [(1<<c,1) for c in range(2) if counts[r][c]]
    else:
        for k in (r,s):
            a,b=counts[k]; choices.append(((1 if a else 0)|(2 if b else 0),a+b))
    nd=[-10**9]*4
    for mask in range(4):
        for c,v in choices: nd[mask|c]=max(nd[mask|c],dp[mask]+v)
    dp=nd
print(dp[3] if dp[3]>=0 else -1)''',
r'''int main(){ios::sync_with_stdio(false);cin.tie(nullptr);int n,M;cin>>n>>M;vector<array<int,2>>f(M);while(n--){int a,c;cin>>a>>c;f[a%M][c]++;}array<int,4>d{0,-1000000000,-1000000000,-1000000000};for(int r=0;r<=M/2;r++){int s=(M-r)%M;vector<pair<int,int>>v{{0,0}};if(r==s){for(int c=0;c<2;c++)if(f[r][c])v.push_back({1<<c,1});}else for(int k:{r,s})v.push_back({(f[k][0]?1:0)|(f[k][1]?2:0),f[k][0]+f[k][1]});array<int,4>nd;nd.fill(-1000000000);for(int a=0;a<4;a++)for(auto[b,c]:v)nd[a|b]=max(nd[a|b],d[a]+c);d=nd;}cout<<(d[3]<0?-1:d[3])<<'\n';}''')

add(692,'dp','同餘前綴的限期 DP 加總',
r'''令 p[i] 為前 i 項和模 m。最後一塊 (j,i] 可整除 m，當且僅當 p[j]=p[i]，並需 i−K≤j<i。因此 dp[i] 等於上述合法 j 的 dp[j] 總和，dp[0]=1 表示空前綴的一種完整切法。
雜湊表按餘數保存目前窗口的 dp 加總。求 dp[i] 前移除 j=i−K−1 的過期項，查 p[i] 對應總和，之後加入 dp[i]。最後一塊起點唯一，故加總不會重複計算切分，並且恰好覆蓋整個前綴。''',
'期望時間 O(n)，空間 O(n)，餘數種類最多 n+1，不建立 m 大小陣列；Python 輸入緩衝 O(n)。',
'有負數時模運算需正規化到[0,m)；查詢前不能加入當前dp，以免空區塊。',
[('前綴0','數列1,2,3，K=2,m=3，先放dp0=1。','餘0:1','dp0',1),('前兩項','餘數依序1,0，dp1=0、dp2=1。','1|0','dp2',1),('第三項','前一個合法同餘是j=2，j=0因長3過期。','餘0:dp2','dp3',1)],
r'''import sys
t=list(map(int,sys.stdin.buffer.read().split())); n,K,m=t[:3]; p=[0]
for x in t[3:]: p.append((p[-1]+x)%m)
M=1000000007; dp=[0]*(n+1); dp[0]=1; sums={0:1}
for i in range(1,n+1):
    j=i-K-1
    if j>=0: sums[p[j]]=(sums.get(p[j],0)-dp[j])%M
    dp[i]=sums.get(p[i],0); sums[p[i]]=(sums.get(p[i],0)+dp[i])%M
print(dp[n])''',
r'''int main(){ios::sync_with_stdio(false);cin.tie(nullptr);int n,K;ll m;cin>>n>>K>>m;vector<ll>p(n+1),d(n+1);for(int i=1;i<=n;i++){ll x;cin>>x;p[i]=(p[i-1]+x)%m;if(p[i]<0)p[i]+=m;}unordered_map<ll,ll>s;s[0]=d[0]=1;for(int i=1;i<=n;i++){int j=i-K-1;if(j>=0)s[p[j]]=(s[p[j]]-d[j]+MOD)%MOD;d[i]=s[p[i]];s[p[i]]=(s[p[i]]+d[i])%MOD;}cout<<d[n]<<'\n';}''')

add(693,'strings','KMP 自動機與可回退前綴狀態堆疊',
r'''預先建立樣式的失敗函數與每個狀態、每個字母的轉移表。文字每個前綴只需保存目前 KMP 狀態及此前綴的完整出現數。附加一字元就查表前進，若完整匹配則計數加一，狀態退到最長真邊界以保留重疊匹配。
刪除末字元只要彈出前綴狀態與計數，空文字保留底層零狀態。這讓刪除後再次追加也正確。預建轉移表避免反覆追加失敗字元、刪除、重做造成 KMP 失敗鏈被反覆走訪而退化。查詢直接讀堆疊頂計數。''',
'時間 O(26|P|+q)，空間 O(26|P|+q)；Python 轉移表用32位元 array，另操作 token 緩衝 O(q)。',
'匹配後不能清零狀態，否則漏掉aba在ababa中的重疊；回退必須同時回退計數。',
[('追加至首次匹配','P=aa，依序加入a,a。','aa','出現數',1),('追加第三字','aaa有起點1、2兩次aa。','aaa','出現數',2),('刪除末字','回到aa的舊狀態與舊計數。','aa','出現數',1)],
r'''import sys
from array import array
it=iter(sys.stdin.buffer.read().split()); P=next(it); q=int(next(it)); m=len(P); pi=[0]*m
for i in range(1,m):
    j=pi[i-1]
    while j and P[i]!=P[j]: j=pi[j-1]
    if P[i]==P[j]: j+=1
    pi[i]=j
tr=array('i',[0])*(26*m)
for s in range(m):
    for c in range(26): tr[s*26+c]=s+1 if P[s]==c+97 else tr[pi[s-1]*26+c] if s else 0
states=[0]; counts=[0]; out=[]
for _ in range(q):
    op=next(it)
    if op==b'+':
        c=next(it)[0]-97; s=tr[states[-1]*26+c]; counts.append(counts[-1]+(s==m)); states.append(pi[-1] if s==m else s)
    elif op==b'-':
        if len(states)>1: states.pop(); counts.pop()
    else: out.append(str(counts[-1]))
print('\n'.join(out))''',
r'''int main(){ios::sync_with_stdio(false);cin.tie(nullptr);string P;int q;cin>>P>>q;int m=P.size();vector<int>pi(m);for(int i=1;i<m;i++){int j=pi[i-1];while(j&&P[i]!=P[j])j=pi[j-1];if(P[i]==P[j])j++;pi[i]=j;}vector<array<int,26>>tr(m);for(int s=0;s<m;s++)for(int c=0;c<26;c++)tr[s][c]=P[s]==char('a'+c)?s+1:s?tr[pi[s-1]][c]:0;vector<int>st{0},cnt{0};while(q--){char op;cin>>op;if(op=='+'){char c;cin>>c;int s=tr[st.back()][c-'a'];cnt.push_back(cnt.back()+(s==m));st.push_back(s==m?pi.back():s);}else if(op=='-'){if(st.size()>1){st.pop_back();cnt.pop_back();}}else cout<<cnt.back()<<'\n';}}''')

add(694,'strings','Trie 前綴通過次數與逐字查詢',
r'''將全部字串插入 Trie，每經過一個非根節點，其通過次數加一。此次數就是以該節點前綴開頭的輸入位置數，重複字串必須重複插入，因此自然包含本人及其他相同字串。
對每個輸入字串由第一個字母向下走，第一次通過次數≤K的位置就是最短合法前綴。沿路次數只會不增，所以一旦找到即可停止；若走完整串仍無符合節點，就輸出−1。空前綴不合法，因此從深度1才檢查。''',
'時間 O(字串總長)，空間 O(字串總長+n)；Python 每節點字典較有常數成本，但總節點≤200001，讀取緩衝也是 O(總長+n)。',
'字串是另一串前綴時，其全長通過數可能仍大於K，不能預設整串一定能區分。',
[('插入字串','ab、ac、ab，a的通過數3，ab為2。','a:3|ab:2|ac:1','字串數',3),('查詢ab且K=1','a和ab都超額，無合法非空前綴。','a→ab','答案',-1),('查詢ac且K=1','深度1超額，深度2首次達標。','a→ac','答案',2)],
r'''import sys
t=sys.stdin.buffer.read().split(); n=int(t[0]); items=[(t[i],int(t[i+1])) for i in range(1,len(t),2)]; ch=[{}]; cnt=[0]
for s,K in items:
    u=0
    for c in s:
        if c not in ch[u]: ch[u][c]=len(ch); ch.append({}); cnt.append(0)
        u=ch[u][c]; cnt[u]+=1
out=[]
for s,K in items:
    u=0; ans=-1
    for i,c in enumerate(s,1):
        u=ch[u][c]
        if cnt[u]<=K: ans=i; break
    out.append(str(ans))
print('\n'.join(out))''',
r'''int main(){ios::sync_with_stdio(false);cin.tie(nullptr);int n;cin>>n;vector<string>s(n);vector<int>K(n),cnt(1);vector<array<int,26>>tr(1);for(int i=0;i<n;i++){cin>>s[i]>>K[i];int u=0;for(char c:s[i]){int k=c-'a';if(!tr[u][k]){int v=tr.size();tr[u][k]=v;tr.push_back({});cnt.push_back(0);}u=tr[u][k];cnt[u]++;}}for(int i=0;i<n;i++){int u=0,ans=-1;for(int j=0;j<(int)s[i].size();j++){u=tr[u][s[i][j]-'a'];if(cnt[u]<=K[i]){ans=j+1;break;}}cout<<ans<<'\n';}}''')

add(695,'geometry','刪除候選只需檢查四個極值位置',
r'''不刪點先計算原包圍矩形。若刪除某點能縮小範圍，它必須是某一軸最小或最大座標的唯一持有者。因此各軸排序的首尾位置提供至多四個候選；其他可刪點即使刪除也不會改善答案。
每個候選刪掉後，從各軸排序的前兩名或後兩名取第一個仍在的點，常數時間得到新四界。座標重複時，第二個同值點會使該界維持不變，自然處理極值重複。只試旗標0且 n>1 的候選，並保留不刪的選項。''',
'時間 O(n log n)，空間 O(n)，含 Python 兩個排序索引與輸入緩衝；面積最大4×10^18，64位元有號足夠。',
'n=1時不能刪唯一點，面積為0；極端點若必須保留，不得為了縮框刪除。',
[('原框','點(0,0)必留、(2,2)必留、(9,9)可刪。','0,0|2,2|9,9','面積',81),('檢查候選','可刪點同時是x與y最大值。','9,9','可刪候選數',1),('刪除重算','剩兩點範圍各為2。','0,0|2,2','最小面積',4)],
r'''import sys
it=iter(map(int,sys.stdin.buffer.read().split())); n=next(it); p=[(next(it),next(it),next(it)) for _ in range(n)]; sx=sorted(range(n),key=lambda i:p[i][0]); sy=sorted(range(n),key=lambda i:p[i][1])
def area(skip):
    bounds=[]
    for ids,k in ((sx,0),(sy,1)):
        lo=ids[1] if ids[0]==skip else ids[0]; hi=ids[-2] if ids[-1]==skip else ids[-1]; bounds.append(p[hi][k]-p[lo][k])
    return bounds[0]*bounds[1]
ans=area(-1)
if n>1:
    for i in {sx[0],sx[-1],sy[0],sy[-1]}:
        if p[i][2]==0: ans=min(ans,area(i))
print(ans)''',
r'''int main(){ios::sync_with_stdio(false);cin.tie(nullptr);int n;cin>>n;vector<array<ll,3>>p(n);for(auto&a:p)cin>>a[0]>>a[1]>>a[2];vector<int>x(n),y(n);iota(x.begin(),x.end(),0);y=x;sort(x.begin(),x.end(),[&](int i,int j){return p[i][0]<p[j][0];});sort(y.begin(),y.end(),[&](int i,int j){return p[i][1]<p[j][1];});auto area=[&](int s){ll w=p[x.back()==s?x[n-2]:x.back()][0]-p[x[0]==s?x[1]:x[0]][0],h=p[y.back()==s?y[n-2]:y.back()][1]-p[y[0]==s?y[1]:y[0]][1];return w*h;};ll ans=area(-1);if(n>1)for(int i:set<int>{x[0],x.back(),y[0],y.back()})if(!p[i][2])ans=min(ans,area(i));cout<<ans<<'\n';}''')

add(696,'strings','字母交換的自反映射一致性',
r'''互不相交交換形成一個映射 f，必須滿足 f(f(c))=c，且每個字母只映到一個固定字母。逐位置要求 f(S[i])=T[i]，同時要求 f(T[i])=S[i]；若任一既存要求矛盾就無解。
包括 S[i]=T[i] 的位置也必須記成自映射，因為這表示該字母不能被其他交換牽動。所有要求相容後，非自映射字母兩兩成對，每對只計較小字母一次；其數量≤K即能直接採用這些交換。未出現字母維持不變，不必額外交換。''',
'時間 O(|S|+26)，映射額外 O(26)；Python 讀取字串及緩衝 O(|S|)。',
'三字母循環不是兩兩不相交交換；同字母在某位置不變而其他位置要交換也是矛盾。',
[('第一項要求','S=abca、T=bacb，要求a↔b。','a↔b','交換數',1),('中間一致','b→a與c→c皆相容。','a↔b|c↔c','交換數',1),('最後衝突','末位a要求變b，仍一致；若末位改a會衝突。','abca→bacb','K=1判定','YES')],
r'''import sys
t=sys.stdin.buffer.read().split(); K=int(t[0]); S,T=t[1:]; f=[-1]*26; ok=True
for x,y in zip(S,T):
    x-=97; y-=97
    if (f[x]!=-1 and f[x]!=y) or (f[y]!=-1 and f[y]!=x): ok=False; break
    f[x]=y; f[y]=x
pairs=sum(y>x for x,y in enumerate(f)); print('YES' if ok and pairs<=K else 'NO')''',
r'''int main(){ios::sync_with_stdio(false);cin.tie(nullptr);int K;string S,T;cin>>K>>S>>T;vector<int>f(26,-1);bool ok=true;for(int i=0;i<(int)S.size();i++){int x=S[i]-'a',y=T[i]-'a';if((f[x]!=-1&&f[x]!=y)||(f[y]!=-1&&f[y]!=x)){ok=false;break;}f[x]=y;f[y]=x;}int cnt=0;for(int x=0;x<26;x++)cnt+=f[x]>x;cout<<(ok&&cnt<=K?"YES":"NO")<<'\n';}''')
add(697,'strings','KMP 邊界集合位元交集計算跨接縫匹配',
r'''刪除 [l,r] 後，匹配分三類：完全在左前綴、完全在右後綴、跨新接縫。前兩類用原串及反串的 KMP 前綴匹配累計即可 O(1) 查詢。跨接縫則需某個1≤k<m，使左前綴末 k 字等於 P 的前 k 字，右後綴前 m−k 字等於 P 的後 m−k 字。
KMP 狀態的所有失敗鏈長度正好是匹配的前綴長度集合。為每個狀態預存邊界位元集合；反樣式的集合把長度 j 放在位 m−j。將左右集合做 AND 再數1，恰得到跨縫匹配數，每個 k 對應唯一開始位置。排除 k=0,m，避免與兩側內部匹配重複。最後按查詢序號累加精確兩種總和。''',
'設機器字位數 w，時間 O(n+m²/w+q·m/w)，空間 O(n+m²/w)；C++ bitset 固定2001位，Python 大整數位集合按多字運算，輸入緩衝 O(n+m+q)。m≤2000，遠優於每次重新掃描長文字。',
'查詢從原文獨立開始；不能只計原有匹配被刪除多少，接縫會產生新匹配。m=1時沒有跨縫匹配。',
[('原文匹配','S=abxxaba，P=aba，原文有末尾一次。','ab|xx|aba','原有數量',1),('刪除xx','接合成ababa，左末ab與右首a形成新匹配。','ab|aba','新數量',2),('另一查詢刪全部','第二筆從原文刪全串，數量0。','空串','兩查詢加權總和',2)],
r'''import sys
it=iter(sys.stdin.buffer.read().split()); n,m,q=(int(next(it)) for _ in range(3)); S=next(it); P=next(it)
def scan(s,p,reverse_mask=False):
    m=len(p); pi=[0]*m
    for i in range(1,m):
        j=pi[i-1]
        while j and p[i]!=p[j]: j=pi[j-1]
        if p[i]==p[j]: j+=1
        pi[i]=j
    masks=[0]*(m+1)
    for k in range(1,m+1): masks[k]=masks[pi[k-1]]|(1<<(m-k if reverse_mask else k))
    states=[0]; counts=[0]; state=0
    for c in s:
        if state==m: state=pi[-1]
        while state and p[state]!=c: state=pi[state-1]
        if p[state]==c: state+=1
        states.append(state); counts.append(counts[-1]+(state==m))
    return states,counts,masks
left,lc,lm=scan(S,P); right,rc,rm=scan(S[::-1],P[::-1],True); valid=(1<<m)-2; total=weighted=0
for i in range(1,q+1):
    l,r=int(next(it)),int(next(it)); z=lc[l-1]+rc[n-r]+(lm[left[l-1]]&rm[right[n-r]]&valid).bit_count(); total+=z; weighted+=i*z
print(total,weighted)''',
r'''struct Data{vector<int>st,cnt;vector<bitset<2001>>mask;};Data scan(string s,string p,bool rev){int m=p.size();vector<int>pi(m);for(int i=1;i<m;i++){int j=pi[i-1];while(j&&p[i]!=p[j])j=pi[j-1];if(p[i]==p[j])j++;pi[i]=j;}Data d;d.mask.resize(m+1);for(int k=1;k<=m;k++){d.mask[k]=d.mask[pi[k-1]];d.mask[k].set(rev?m-k:k);}d.st.push_back(0);d.cnt.push_back(0);int z=0;for(char c:s){if(z==m)z=pi.back();while(z&&p[z]!=c)z=pi[z-1];if(p[z]==c)z++;d.st.push_back(z);d.cnt.push_back(d.cnt.back()+(z==m));}return d;}int main(){ios::sync_with_stdio(false);cin.tie(nullptr);int n,m,q;string s,p;cin>>n>>m>>q>>s>>p;auto a=scan(s,p,false);reverse(s.begin(),s.end());reverse(p.begin(),p.end());auto b=scan(s,p,true);bitset<2001>valid;for(int k=1;k<m;k++)valid.set(k);ll total=0,weighted=0;for(int i=1,l,r;i<=q;i++){cin>>l>>r;ll z=a.cnt[l-1]+b.cnt[n-r]+(a.mask[a.st[l-1]]&b.mask[b.st[n-r]]&valid).count();total+=z;weighted+=(ll)i*z;}cout<<total<<' '<<weighted<<'\n';}''')

add(698,'number-theory','兩色頻率卷積與精確係數抽取',
r'''以兩色頻率建立多項式 A(x),B(x)。乘積 x^s 係數就是色0值與色1值相加等於 s 的位置對數。顏色固定在兩側，每個無序異色對只被計一次；將質數 s 的係數加總即為答案，包括質數2的偶和特例。
C++ 用模998244353的 NTT 卷積，最大係數≤n0×n1≤225000000，小於模數，所以無需中國剩餘定理即可得到精確係數。Python 用基底2^32把頻率編碼成大整數相乘，係數小於基底，不會進位污染相鄰係數，再以每4位元組抽取。兩者都配合篩法列出2至兩倍最大值的質數。''',
'C++ 時間 O(V log V)，空間 O(V)，V≤200000、NTT長度≤524288。Python 編碼位數 O(32V)，時間為一次此位數的大整數乘法加 O(V log log V) 篩與解碼，非 O(n²)；記憶體 O(V+n)，含輸入緩衝。',
'0與2、1與1都可能湊質數2，不能只統計一奇一偶；同色不計。Python 編碼需明確小端序。',
[('兩色頻率','色0為0,1；色1為1,2。','A:1+x|B:x+x²','異色對總數',4),('卷積係數','乘積為x+2x²+x³。','和1:1|和2:2|和3:1','質數和種類',2),('加總質數係數','和2的兩對，加和3的一對。','2+1','答案',3)],
r'''import sys
it=iter(map(int,sys.stdin.buffer.read().split())); n=next(it); data=[(next(it),next(it)) for _ in range(n)]; V=max(a for a,c in data); f=[[0]*(V+1) for _ in range(2)]
for a,c in data: f[c][a]+=1
def encode(a): return int.from_bytes(b''.join(x.to_bytes(4,'little') for x in a),'little')
product=encode(f[0])*encode(f[1]); raw=product.to_bytes(4*(2*V+1),'little'); prime=bytearray(b'\x01')*(2*V+1)
prime[0]=0
if V: prime[1]=0
for p in range(2,math_isqrt:=__import__('math').isqrt(2*V)+1):
    if prime[p]: prime[p*p::p]=b'\x00'*((2*V-p*p)//p+1)
print(sum(int.from_bytes(raw[4*s:4*s+4],'little') for s in range(2,2*V+1) if prime[s]))''',
r'''const int P=998244353;int power(int a,int b){int z=1;for(;b;b/=2,a=(ll)a*a%P)if(b&1)z=(ll)z*a%P;return z;}void ntt(vector<int>&a,bool inv){int n=a.size();for(int i=1,j=0;i<n;i++){int b=n>>1;for(;j&b;b>>=1)j^=b;j^=b;if(i<j)swap(a[i],a[j]);}for(int len=2;len<=n;len*=2){int root=power(3,(P-1)/len);if(inv)root=power(root,P-2);for(int i=0;i<n;i+=len){ll w=1;for(int j=0;j<len/2;j++){int u=a[i+j],v=w*a[i+j+len/2]%P;a[i+j]=u+v<P?u+v:u+v-P;a[i+j+len/2]=u-v>=0?u-v:u-v+P;w=w*root%P;}}}if(inv){ll z=power(n,P-2);for(int&x:a)x=x*z%P;}}int main(){ios::sync_with_stdio(false);cin.tie(nullptr);int n,V=0;cin>>n;vector<pair<int,int>>d(n);for(auto&[a,c]:d){cin>>a>>c;V=max(V,a);}int N=1;while(N<2*V+1)N*=2;vector<int>a(N),b(N);for(auto[x,c]:d)(c?b:a)[x]++;ntt(a,false);ntt(b,false);for(int i=0;i<N;i++)a[i]=(ll)a[i]*b[i]%P;ntt(a,true);vector<int>prime(2*V+1,1);prime[0]=0;if(V)prime[1]=0;for(int p=2;p*p<=2*V;p++)if(prime[p])for(int j=p*p;j<=2*V;j+=p)prime[j]=0;ll ans=0;for(int s=2;s<=2*V;s++)if(prime[s])ans+=a[s];cout<<ans<<'\n';}''')

add(699,'data-structures','亮點集合與可延遲刪除的四個極值堆',
r'''集合保存目前亮點，初始含原點。每次移動後若抵達亮點就刪掉，否則加入；新亮點同時加入最小x、最大x、最小y、最大y四個堆。查極值前，不斷移除堆頂中已不在亮點集合的座標。
過期堆項只有成為堆頂才移除，不影響真正極值；同點重新亮起時舊項也代表同一有效座標，重複不會改極值。每時刻按公式算周長，較大時重設首次與次數，相等時只累加次數。先以時刻0周長0初始化，空集合周長亦為0。''',
'時間 O(n log n)，空間 O(n)，每次新增至多四個堆項且各項最多彈出一次；Python 指令與堆緩衝 O(n)，n≤40000。',
'所有亮燈才決定外框，不是所有走過的位置；時刻0也要計入並列次數。',
[('時刻零','只有原點亮。','(0,0)','最大／首次／次數','0／0／1'),('向東一步','原點與(1,0)皆亮，周長2。','(0,0)|(1,0)','最大／首次／次數','2／1／1'),('再向西一步','原點翻暗，只剩(1,0)，周長0。','(1,0)','最大／首次／次數','2／1／1')],
r'''import sys,heapq
t=sys.stdin.buffer.read().split(); s=t[1].decode(); on={(0,0)}; heaps=[[(0,0,0)] for _ in range(4)]; x=y=0; best=first=0; count=1; delta={'N':(0,1),'S':(0,-1),'E':(1,0),'W':(-1,0)}
for i,c in enumerate(s,1):
    dx,dy=delta[c]; x+=dx; y+=dy; p=(x,y)
    if p in on: on.remove(p)
    else:
        on.add(p)
        for h,v in zip(heaps,(x,-x,y,-y)): heapq.heappush(h,(v,x,y))
    if on:
        for h in heaps:
            while (h[0][1],h[0][2]) not in on: heapq.heappop(h)
        per=-2*sum(h[0][0] for h in heaps)
    else: per=0
    if per>best: best=per; first=i; count=1
    elif per==best: count+=1
print(best,first,count)''',
r'''int main(){ios::sync_with_stdio(false);cin.tie(nullptr);int n;string s;cin>>n>>s;set<pair<int,int>>on{{0,0}};multiset<int>X{0},Y{0};int x=0,y=0,best=0,first=0,cnt=1;for(int i=1;i<=n;i++){char c=s[i-1];x+=(c=='E')-(c=='W');y+=(c=='N')-(c=='S');pair<int,int>p{x,y};if(on.count(p)){on.erase(p);X.erase(X.find(x));Y.erase(Y.find(y));}else{on.insert(p);X.insert(x);Y.insert(y);}int per=on.empty()?0:2*(*X.rbegin()-*X.begin()+*Y.rbegin()-*Y.begin());if(per>best){best=per;first=i;cnt=1;}else if(per==best)cnt++;}cout<<best<<' '<<first<<' '<<cnt<<'\n';}''')

for lesson in LESSONS:
    if lesson['code'] in ('b658','b659','b685','b698'):
        lesson['performanceNote']='提供的來源未含評測時限。Python 雖使用符合值域的演算法，大界常數成本仍須視平台；最嚴格時限建議採用 C++17。實測與案例記錄見 results-654-699.json，不能由通過範例推論所有評測時間皆有保證。'
def make_input(c,r,index):
    """Small bounds intentionally permit exhaustive independent references."""
    n=1 if index==0 else r.randint(1,8)
    def line(a): return ' '.join(map(str,a))
    def tree(n): return [(r.randrange(v),v) for v in range(1,n)]
    def emit(head,rows): return line(head)+'\n'+'\n'.join(line(x) if not isinstance(x,str) else x for x in rows)+'\n'
    if c==654:
        return emit([n],[[r.randint(1,n+1) for _ in range(26)],''.join(r.choices('abc',k=n))])
    if c==655:
        edges=tree(n); parent=[0]+[u+1 for u,v in edges]; deg=collections.Counter(parent[1:]); rows=[(parent[i],r.randint(1,deg[i+1]) if deg[i+1] else 0,r.randint(0,20)) for i in range(n)]
        return emit([n,r.randint(0,15)],rows)
    if c==656:
        C=r.randint(1,5); return emit([n,C],[(r.randint(0,C),r.randint(0,8),r.randint(0,9)) for _ in range(n)])
    if c in (657,663,666,672,674,682,686):
        if c==682: n=max(n,2)
        pairs=[(u,v) for u in range(n) for v in range(n) if (u!=v if c==657 else u<v if c in (672,686) else True)]
        r.shuffle(pairs); edges=pairs[:r.randint(0,min(12,len(pairs)))]
        if c==682 and not edges: edges=[(0,0)]
        if c in (663,666,674,682) and edges and index%3==0: edges+=edges[:1]
        rows=[]
        for u,v in edges:
            row=[u+1,v+1]
            if c==657: row+=[r.randint(1,6)]
            if c==663: row+=[r.randint(1,4),r.randrange(2)]
            if c==672: row+=[r.randrange(2),r.randint(0,9)]
            rows.append(row)
        if c==657: return emit([n,len(edges)],[[r.randint(0,min(n,3)) for _ in range(n)]]+rows)
        if c in (666,674,682): return emit([n,len(edges),r.randint(0,n)],[[r.randrange(2) for _ in range(n)]]+rows)
        return emit([n,len(edges)]+([r.randrange(3)] if c==672 else []),rows)
    if c==658:
        h,w,H,W=[r.randint(1,4) for _ in range(4)]
        rows=[''.join(r.choices('01',weights=[1,3],k=w)) for _ in range(h)]+[''.join(r.choices('01',weights=[1,3],k=W)) for _ in range(H)]
        return emit([h,w,H,W],rows)
    if c==659:
        n=min(n,7); B=r.randint(1,4); return emit([n,B,r.randint(-B,B)],[[r.randint(-B,B) for _ in range(n)]]+([''.join(r.choices('+-',k=n-1))] if n>1 else []))
    if c==660: return emit([n,r.randint(0,15)],[[r.randint(1,10) for _ in range(n)]])
    if c==661:
        m=r.randint(0,8); q=8; return emit([n,m,q],[(r.randint(1,n),r.randint(1,n)) for _ in range(m)]+[(r.randint(1,n),r.randint(1,n),r.randint(1,n)) for _ in range(q)])
    if c in (662,684):
        L=r.randint(1,n); R=r.randint(L,n); return emit([n,L,R],[[r.randint(0,15) if c==662 else r.randint(-2,2) for _ in range(n)]])
    if c==664:
        ops=[]
        for j in range(9):
            l=r.randint(1,n); ops.append(['Q',l,r.randint(l,n)] if j%2==0 else ['U',l,r.randint(-2,2)])
        return emit([n,len(ops)],[[r.randint(-2,2) for _ in range(n)]]+ops)
    if c==665:
        N=r.randint(1,6); m=r.randint(0,9); rows=[]
        for _ in range(m):
            l=r.randint(1,N); rows.append((l,r.randint(l,N),r.randint(1,8)))
        return emit([N,m],rows)
    if c in (667,675,691,698):
        if c==675: n=max(2,n); L=r.randint(1,n-1); R=r.randint(L,n-1); head=[n,L,R]
        elif c==691: head=[n,r.randint(1,8)]
        else: head=[n]
        return emit(head,[(r.randint(-3,8) if c in (667,675) else r.randint(0,30),r.randrange(2)) for _ in range(n)])
    if c in (668,673,679):
        colors=[r.randrange(2) for _ in range(n)]
        if c==668: colors[0]=0
        rows=[colors]+[[u+1,v+1]+([r.randint(1,6)] if c==668 else []) for u,v in tree(n)]
        return emit([n]+([r.randint(0,n)] if c==679 else []),rows)
    if c==669:
        n=max(3,n); return emit([n,8],[(r.randint(-3,3),r.randint(-3,3)) for _ in range(n)]+[(r.randint(1,n),r.randint(1,n)) for _ in range(8)])
    if c in (670,687):
        pts=[(x,y) for x in range(-3,4) for y in range(-3,4) if c!=670 or (x,y)!=(0,0)]; r.shuffle(pts)
        return emit([n]+([r.randint(0,6)] if c==687 else []),[(x,y,r.randrange(2)) for x,y in pts[:n]])
    if c in (671,676,677,690,692,688,685):
        arr=[r.randint(-5,8) for _ in range(n)]
        if c in (671,676,677,685): arr=[r.randint(1,8) for _ in range(n)]
        if c==671: head=[n,r.randint(1,n)]
        elif c==676: head=[n,r.randint(0,5)]
        elif c==677: head=[n,r.randint(1,n)]
        elif c==690: head=[n,r.randint(1,7)]
        elif c==692: head=[n,r.randint(1,n),r.randint(1,7)]
        elif c==688: head=[n,r.randint(1,n),r.randint(1,n)]
        else: head=[n,r.randint(1,n),8]
        return emit(head,[arr])
    if c==678: return emit([n,r.randint(0,n)],[(r.randint(-3,5),r.randrange(2)) for _ in range(n)]+[[u+1 for u,v in tree(n)]])
    if c==680:
        ops=[]
        for j in range(9):
            l=r.randint(1,n); ops.append([1 if j%2 else 2,l,r.randint(l,n)])
        return emit([n,9],[''.join(r.choices('01',k=n))]+ops)
    if c==681:
        ops=[]
        for j in range(10):
            t=r.randint(1,3); ops.append([t]+([r.randint(1,n),r.randint(1,n)] if t==1 else [r.randint(1,n)] if t==2 else []))
        ops.append([3]); return emit([n,len(ops)],[[r.randrange(2) for _ in range(n)]]+ops)
    if c==683:
        A=''.join(r.choices('ab?',k=n)); B=''.join(r.choices('ab?',k=n)); ops=[]
        for _ in range(8):
            l=r.randint(1,n); u=r.randint(1,n); ops.append([l,r.randint(l,n),u,r.randint(u,n)])
        return A+'\n'+B+'\n8\n'+'\n'.join(line(x) for x in ops)+'\n'
    if c==689:
        m=r.randint(1,5); ops=[]
        for _ in range(8):
            t=r.choice('RC'); ops.append([t,r.randint(1,n if t=='R' else m),r.randint(-5,5)])
        return emit([n,m,8],ops)
    if c==693:
        P=''.join(r.choices('ab',k=r.randint(1,4))); ops=[]
        for _ in range(15): ops.append(r.choice(['+ a','+ b','-','?']))
        ops.append('?'); return P+'\n'+str(len(ops))+'\n'+'\n'.join(ops)+'\n'
    if c==694: return emit([n],[[''.join(r.choices('ab',k=r.randint(1,4))),r.randint(1,n)] for _ in range(n)])
    if c==695: return emit([n],[(r.randint(-5,5),r.randint(-5,5),r.randrange(2)) for _ in range(n)])
    if c==696: return emit([r.randint(0,3)],[''.join(r.choices('abc',k=n)),''.join(r.choices('abc',k=n))])
    if c==697:
        m=r.randint(1,5); S=''.join(r.choices('ab',k=n)); P=''.join(r.choices('ab',k=m)); qs=[]
        for _ in range(8):
            l=r.randint(1,n); qs.append((l,r.randint(l,n)))
        return emit([n,m,8],[S,P]+qs)
    if c==699: return emit([n],[''.join(r.choices('NSEW',k=n))])
    raise ValueError(c)

def oracle(c,text):
    """Deliberately simple exhaustive references, not the lesson algorithms."""
    ts=text.split(); it=iter(ts)
    def I(): return int(next(it))
    def take(n): return [I() for _ in range(n)]
    def out(x): return ' '.join(map(str,x)) if isinstance(x,(tuple,list)) else str(x)
    def graph(n,edges):
        g=[[] for _ in range(n)]
        for u,v in edges: g[u].append(v); g[v].append(u)
        return g
    def comps(n,edges):
        g=graph(n,edges); seen=set(); cs=[]
        for s in range(n):
            if s in seen: continue
            seen.add(s); st=[s]; nodes=[]
            for u in st:
                nodes.append(u)
                for v in g[u]:
                    if v not in seen: seen.add(v); st.append(v)
            cs.append(nodes)
        return cs
    if c==654:
        n=I(); q=take(26); s=next(it); st=''; ans=0
        for ch in s:
            st+=ch
            if st.count(ch)==q[ord(ch)-97]: st=st[:st.index(ch)]
            ans=max(ans,len(st))
        return out(ans)
    if c==655:
        n,B=I(),I(); rows=[take(3) for _ in range(n)]; ch=[[] for _ in range(n)]
        for v,(p,k,a) in enumerate(rows):
            if p: ch[p-1].append(v)
        ans=10**50
        for leaf in range(n):
            if ch[leaf]: continue
            def f(u):
                if not ch[u]: return max(0,rows[u][2]-B) if u==leaf else rows[u][2]
                return sorted(f(v) for v in ch[u])[rows[u][1]-1]+rows[u][2]
            ans=min(ans,f(0))
        return out(ans)
    if c==656:
        n,C=I(),I(); dp={0:0}
        for _ in range(n):
            d,p,f=I(),I(),I(); nd={}
            for e,cost in dp.items():
                for x in range(C-e+1):
                    if e+x>=d:
                        z=e+x-d; v=cost+(f+p*x if x else 0); nd[z]=min(nd.get(z,10**30),v)
            dp=nd
        return out(min(dp.values()))
    if c==657:
        n,m=I(),I(); q=take(n); incoming=[[] for _ in range(n)]
        for _ in range(m):
            u,v,w=I()-1,I()-1,I(); incoming[v].append((u,w))
        inf=10**30; a=[0 if x==0 else inf for x in q]
        for _ in range(n):
            b=a[:]
            for v in range(n):
                if q[v]:
                    xs=sorted(a[u]+w for u,w in incoming[v] if a[u]<inf)
                    if len(xs)>=q[v]: b[v]=min(a[v],xs[q[v]-1])
            a=b
        return out([x if x<inf else -1 for x in a])
    if c==658:
        ha,wa,hb,wb=take(4); A=[next(it) for _ in range(ha)]; B=[next(it) for _ in range(hb)]; best=10**9; ways=0
        def chunks(cells):
            cells=set(cells); k=0
            while cells:
                k+=1; st=[cells.pop()]
                for x,y in st:
                    for z in ((x+1,y),(x-1,y),(x,y+1),(x,y-1)):
                        if z in cells: cells.remove(z); st.append(z)
            return k
        # Matrix raster reference, with translation envelope and external margin.
        for dx in range(-hb,ha+1):
            for dy in range(-wb,wa+1):
                U=set(); overlap=set()
                for x in range(-hb-1,ha+hb+1):
                    for y in range(-wb-1,wa+wb+1):
                        a=0<=x<ha and 0<=y<wa and A[x][y]=='1'; b=0<=x-dx<hb and 0<=y-dy<wb and B[x-dx][y-dy]=='1'
                        if a or b: U.add((x,y))
                        if a and b: overlap.add((x,y))
                if not overlap or chunks(overlap)!=1 or chunks(U)!=1: continue
                x0=min(x for x,y in U)-1; x1=max(x for x,y in U)+1; y0=min(y for x,y in U)-1; y1=max(y for x,y in U)+1
                white={(x,y) for x in range(x0,x1+1) for y in range(y0,y1+1)}-U
                if chunks(white)!=2: continue
                per=sum((x+dx,y+dy) not in U for x,y in U for dx,dy in ((1,0),(-1,0),(0,1),(0,-1)))
                if per<best: best=per; ways=1
                elif per==best: ways+=1
        return out((best if ways else -1,ways))
    if c==659:
        n,B,T=take(3); a=take(n); op=next(it) if n>1 else ''
        def trees(l,r):
            if l==r: return [(a[l],0)]
            ans=[]
            for k in range(l,r):
                for x,cx in trees(l,k):
                    for y,cy in trees(k+1,r):
                        z=x+y if op[k]=='+' else x-y; ans.append((max(-B,min(B,z)),cx+cy+(abs(z)>B)))
            return ans
        vals=[cost for v,cost in trees(0,n-1) if v==T]
        return out((min(vals),vals.count(min(vals))) if vals else (-1,0))
    if c in (660,662,684):
        n=I()
        if c==660: B=I(); L,R=1,n
        else: L,R=I(),I()
        a=take(n); ans=0
        for l in range(n):
            for r in range(l+L,min(n,l+R)+1):
                xs=a[l:r]
                if c==660:
                    if sum(xs)-max(xs)<=B: ans=max(ans,len(xs))
                elif c==662:
                    z=0
                    for x in xs: z^=x
                    ans=max(ans,z)
                else:
                    f=collections.Counter(xs); ans+=sorted(f.values())==[1]*(len(f)-1)+[2]
        return out(ans)
    if c==661:
        n,m,q=take(3); edges=[(I()-1,I()-1) for _ in range(m)]; qs=[take(3) for _ in range(q)]; ans=[]
        states=[comps(n,edges[:day]) for day in range(m+1)]
        for u,v,k in qs:
            ans.append(next((day for day,cs in enumerate(states) if any(u-1 in nodes and v-1 in nodes and len(nodes)>=k for nodes in cs)),-1))
        return '\n'.join(map(str,ans))
    if c==663:
        n,m=I(),I(); e=[take(4) for _ in range(m)]; lengths=[]
        def dfs(v,w,c,length):
            lengths.append(length)
            for u,z,W,C in e:
                if u==v and W>w and C!=c: dfs(z,W,C,length+1)
        for u,v,w,c in e: dfs(v,w,c,1)
        return out((max(lengths),lengths.count(max(lengths))) if lengths else (0,0))
    if c==664:
        n,q=I(),I(); a=take(n); ans=[]
        for _ in range(q):
            t=next(it); x,y=I(),I()
            if t=='U': a[x-1]=y
            else: ans.append(sum(len(list(g))**2 for k,g in itertools.groupby(a[x-1:y])))
        return '\n'.join(map(str,ans))
    if c==665:
        N,m=I(),I(); e=[take(3) for _ in range(m)]; costs=[]
        def dfs(f,cost):
            if f==N: costs.append(cost); return
            for l,r,w in e:
                if l<=f+1 and r>f: dfs(r,cost+w)
        dfs(0,0); return out((min(costs),costs.count(min(costs))) if costs else (-1,0))
    if c==666:
        n,m,K=take(3); marks=take(n); reach=[[i==j for j in range(n)] for i in range(n)]; edges=[]
        for _ in range(m):
            u,v=I()-1,I()-1; reach[u][v]=True; edges.append((u,v))
        for k in range(n):
            for i in range(n):
                for j in range(n): reach[i][j]|=reach[i][k] and reach[k][j]
        co=[-1]*n; groups=[]
        for u in range(n):
            if co[u]!=-1: continue
            ids=[v for v in range(n) if reach[u][v] and reach[v][u]]
            for v in ids: co[v]=len(groups)
            groups.append(ids)
        return out(sum(sum(marks[v] for v in ids)%2==1 and len({co[u] for u,v in edges if co[v]==k and co[u]!=k})==K for k,ids in enumerate(groups)))
    if c==667:
        n=I(); ac=[take(2) for _ in range(n)]; return out(sum(ac[i][0]<ac[j][0] and ac[k][0]<ac[j][0] and ac[i][1]!=ac[k][1] for i,j,k in itertools.combinations(range(n),3)))
    if c in (668,673,679):
        n=I(); K=I() if c==679 else None; a=take(n); edges=[]; weights={}
        for _ in range(n-1):
            u,v=I()-1,I()-1; w=I() if c==668 else 1; edges.append((u,v)); weights[u,v]=weights[v,u]=w
        g=graph(n,edges)
        if c==673:
            ans=0
            for mask in range(1<<(n-1)):
                cs=comps(n,[e for i,e in enumerate(edges) if mask>>i&1]); ans+=all(len(nodes)%2==0 and sum(a[v] for v in nodes)==1 for nodes in cs)
            return out(ans)
        vals=[]; count=0
        for root in range(n):
            st=[(root,-1,0,a[root])]; d=[0]*n
            for u,p,dist,marks in st:
                d[u]=dist
                if u>root and marks==K: count+=1
                for v in g[u]:
                    if v!=p: st.append((v,u,dist+weights[u,v],marks+a[v]))
            if a[root]==0: vals.append((abs(sum((1-2*a[v])*d[v] for v in range(n))),root+1))
        if c==679: return out(count)
        val,v=min(vals); return out((v,val))
    if c==669:
        n,q=I(),I(); p=[take(2) for _ in range(n)]; ans=[]
        for _ in range(q):
            u,v=I()-1,I()-1; p[u],p[v]=p[v],p[u]; ans.append(sum(p[i][0]*p[(i+1)%n][1]-p[i][1]*p[(i+1)%n][0] for i in range(n)))
        return '\n'.join(map(str,ans))
    if c==670:
        n=I(); p=[take(3) for _ in range(n)]; unused=set(range(n)); ans=0
        while unused:
            i=unused.pop(); x,y,c=p[i]; ids=[i]+[j for j in unused if x*p[j][1]==y*p[j][0] and x*p[j][0]+y*p[j][1]>0]
            unused.difference_update(ids); counts=collections.Counter(p[j][2] for j in ids); ans+=counts[0]==counts[1] and counts[0]>0
        return out(ans)
    if c==671:
        n,K=I(),I(); a=take(n); return out(sum(a[i]==a[j] and j-i<=K and all(x<=a[i] for x in a[i+1:j]) for i in range(n) for j in range(i+1,n)))
    if c==672:
        n,m,r=take(3); g=[[] for _ in range(n)]
        for _ in range(m):
            u,v,c,w=take(4); g[u-1].append((v-1,c,w))
        def dfs(u,c,s):
            if u==n-1: return int(s%3==r)
            return sum(dfs(v,C,s+w) for v,C,w in g[u] if not(c==C==1))
        return out(dfs(0,0,0))
    if c==674:
        n,m,k=take(3); a=take(n); es=[(I()-1,I()-1) for _ in range(m)]; return out(sum(sum(u in nodes and v in nodes for u,v in es)==len(nodes) and sum(a[u] for u in nodes)==k for nodes in map(set,comps(n,es))))
    if c==675:
        n,L,R=take(3); a=[take(2) for _ in range(n)]; vals=[(a[j][0]-a[i][0],-i-1,-j-1) for i in range(n) for j in range(i+1,n) if L<=j-i<=R and a[i][1]!=a[j][1]]
        if not vals: return 'NONE'
        v,i,j=max(vals); return out((v,-i,-j))
    if c==676:
        n,T=I(),I(); a=take(n); vals=[]
        for mask in range(1<<max(0,n-1)):
            if mask&(mask<<1): continue
            ds=[abs(a[i]-a[i+1]) for i in range(n-1) if mask>>i&1]
            if all(x<=T for x in ds): vals.append((len(ds),-sum(ds)))
        k,s=max(vals); return out((k,-s))
    if c==677:
        n,W=I(),I(); a=take(n); return out(sum(min(abs(a[i]-x) for x in a[max(0,i-W):i]) for i in range(1,n)))
    if c==678:
        n,L=I(),I(); ac=[take(2) for _ in range(n)]; p=[-1]+[I()-1 for _ in range(n-1)]; ans=[]
        for v in range(n):
            u=p[v]; count=0
            for _ in range(L):
                if u<0: break
                count+=ac[u][1]!=ac[v][1] and ac[u][0]<ac[v][0]; u=p[u]
            ans.append(count)
        return '\n'.join(map(str,ans))
    if c==680:
        n,q=I(),I(); a=list(map(int,next(it))); ans=[]
        for _ in range(q):
            t,l,r=take(3)
            if t==1:
                for i in range(l-1,r): a[i]^=1
            else: ans.append(sum([a[i],a[j],a[k]]==[0,1,0] for i,j,k in itertools.combinations(range(l-1,r),3)))
        return '\n'.join(map(str,ans))
    if c in (681,682):
        n,q=I(),I(); K=I() if c==682 else None; a=take(n); es=[]; ans=[]
        def evaluate():
            total=0
            for nodes in comps(n,es):
                if c==681: total+=2*sum(a[u] for u in nodes)==len(nodes); continue
                # Enumerate every proposed coloring; no parity DSU in reference.
                ids={u:i for i,u in enumerate(nodes)}
                for mask in range(1<<len(nodes)):
                    if sum(((mask>>ids[u])&1)!=a[u] for u in nodes)>K: continue
                    if all(((mask>>ids[u])&1)!=((mask>>ids[v])&1) for u,v in es if u in ids): total+=1; break
            return total
        for _ in range(q):
            t=1 if c==682 else I()
            if t==1: es.append((I()-1,I()-1))
            elif t==2: a[I()-1]^=1
            if c==682 or t==3: ans.append(evaluate())
        return '\n'.join(map(str,ans))
    if c==683:
        A,B=next(it),next(it); q=I(); ans=[]
        for _ in range(q):
            l,r,u,v=take(4); aa=A[l-1:r]; bb=B[u-1:v]; ca=collections.Counter(aa.replace('?','')); cb=collections.Counter(bb.replace('?',''))
            # Independently enumerate attainable counts over alphabet a,b plus c
            # (all generated fixed letters are a,b, so c covers unused letters).
            def reachable(s,co):
                z=s.count('?'); result=set()
                for x in range(z+1):
                    for y in range(z-x+1): result.add((co['a']+x,co['b']+y,z-x-y))
                return result
            ans.append('YES' if len(aa)==len(bb) and reachable(aa,ca)&reachable(bb,cb) else 'NO')
        return '\n'.join(ans)
    if c==685:
        n,K,M=take(3); a=take(n); return out(sum(math.gcd(*xs)==1 and sum(xs)%2==1 for xs in itertools.combinations(a,K)))
    if c==686:
        n,m=I(),I(); adj=[set() for _ in range(n)]
        for _ in range(m):
            u,v=I()-1,I()-1; adj[u].add(v); adj[v].add(u)
        return out(sum(w not in adj[u] and len(adj[v])>len(adj[u]) and len(adj[v])>len(adj[w]) for v in range(n) for u,w in itertools.combinations(adj[v],2)))
    if c==687:
        n,D=I(),I(); p=[take(3) for _ in range(n)]; ans=0
        for i,j in itertools.combinations(range(n),2):
            x,y,c=p[i]; X,Y,C=p[j]
            if c==C or abs(x-X)+abs(y-Y)>D or (x!=X and y!=Y): continue
            if any(k not in (i,j) and ((x==X==xx and min(y,Y)<yy<max(y,Y)) or (y==Y==yy and min(x,X)<xx<max(x,X))) for k,(xx,yy,cc) in enumerate(p)): continue
            ans+=1
        return out(ans)
    if c==688:
        n,K,D=take(3); a=take(n)
        def dfs(start,k):
            if k==0: return 0
            best=None
            for l in range(start,n):
                for r in range(l+1,min(n,l+D)+1):
                    s=sum(a[l:r])
                    if s%2: continue
                    v=dfs(r,k-1)
                    if v is not None: best=max(best if best is not None else -10**30,v+s)
            return best
        z=dfs(0,K); return 'NONE' if z is None else out(z)
    if c==689:
        n,m,q=take(3); rows=[0]*n; cols=[0]*m; ans=[]
        for _ in range(q):
            t=next(it); i,x=I()-1,I(); a=rows if t=='R' else cols; a[i]+=x; ans.append(sum(max(0,x+y) for x in rows for y in cols))
        return '\n'.join(map(str,ans))
    if c==690:
        n,D=I(),I(); a=take(n); ans=1
        for mask in range(1,1<<n):
            xs=[a[i] for i in range(n) if mask>>i&1]; dif=[b-a for a,b in zip(xs,xs[1:])]
            if all(abs(x)>=D for x in dif) and all(x*y<0 for x,y in zip(dif,dif[1:])): ans=max(ans,len(xs))
        return out(ans)
    if c==691:
        n,M=I(),I(); ac=[take(2) for _ in range(n)]; ans=-1
        for mask in range(1<<n):
            xs=[ac[i] for i in range(n) if mask>>i&1]
            if len({c for a,c in xs})<2: continue
            if all((a+b)%M for (a,c),(b,d) in itertools.combinations(xs,2)): ans=max(ans,len(xs))
        return out(ans)
    if c==692:
        n,K,m=take(3); a=take(n); ans=0
        for mask in range(1<<max(0,n-1)):
            cuts=[0]+[i+1 for i in range(n-1) if mask>>i&1]+[n]
            ans+=all(r-l<=K and sum(a[l:r])%m==0 for l,r in zip(cuts,cuts[1:]))
        return out(ans)
    if c==693:
        P=next(it); q=I(); s=''; ans=[]
        for _ in range(q):
            t=next(it)
            if t=='+': s+=next(it)
            elif t=='-': s=s[:-1]
            else: ans.append(sum(s[i:i+len(P)]==P for i in range(len(s))))
        return '\n'.join(map(str,ans))
    if c==694:
        n=I(); rows=[(next(it),I()) for _ in range(n)]; return '\n'.join(str(next((k for k in range(1,len(s)+1) if sum(t.startswith(s[:k]) for t,K in rows)<=limit),-1)) for s,limit in rows)
    if c==695:
        n=I(); p=[take(3) for _ in range(n)]; ans=10**50
        for skip in [-1]+[i for i in range(n) if p[i][2]==0 and n>1]:
            xs=[x for i,(x,y,b) in enumerate(p) if i!=skip]; ys=[y for i,(x,y,b) in enumerate(p) if i!=skip]; ans=min(ans,(max(xs)-min(xs))*(max(ys)-min(ys)))
        return out(ans)
    if c==696:
        K=I(); S,T=next(it),next(it); letters=sorted(set(S+T)); good=False
        def dfs(remaining,pairs):
            nonlocal good
            if len(pairs)>K: return
            if not remaining:
                f={c:c for c in letters}
                for x,y in pairs: f[x]=y; f[y]=x
                good|=''.join(f[x] for x in S)==T; return
            x=remaining[0]; dfs(remaining[1:],pairs)
            for i,y in enumerate(remaining[1:],1): dfs(remaining[1:i]+remaining[i+1:],pairs+[(x,y)])
        dfs(letters,[]); return 'YES' if good else 'NO'
    if c==697:
        n,m,q=take(3); S,P=next(it),next(it); total=weighted=0
        for i in range(1,q+1):
            l,r=I(),I(); s=S[:l-1]+S[r:]; z=sum(s[j:j+m]==P for j in range(len(s))); total+=z; weighted+=i*z
        return out((total,weighted))
    if c==698:
        n=I(); ac=[take(2) for _ in range(n)]
        def prime(x): return x>1 and all(x%d for d in range(2,math.isqrt(x)+1))
        return out(sum(c!=d and prime(a+b) for (a,c),(b,d) in itertools.combinations(ac,2)))
    if c==699:
        n=I(); s=next(it); on={(0,0)}; x=y=0; ps=[0]
        for c in s:
            dx,dy={'N':(0,1),'S':(0,-1),'E':(1,0),'W':(-1,0)}[c]; x+=dx;y+=dy
            if (x,y) in on: on.remove((x,y))
            else: on.add((x,y))
            ps.append(2*(max(a for a,b in on)-min(a for a,b in on)+max(b for a,b in on)-min(b for a,b in on)) if on else 0)
        z=max(ps); return out((z,ps.index(z),ps.count(z)))
    raise ValueError(c)
def build_checks():
    records=[]
    for num in range(654,700):
        code=f'b{num}'; rng=random.Random(20261108+num); seen={s['input'].strip() for s in SOURCE[code]['samples']}
        for i in range(24):
            while True:
                inp=make_input(num,rng,i)
                if inp.strip() not in seen: break
            seen.add(inp.strip()); expected=oracle(num,inp)
            records.append(dict(code=code,input=inp,output=expected,reason=f'獨立小界窮舉／直接定義 oracle；seed={20261108+num}，案例{i+1}。預期值由 verify-654-699.py 的 oracle 計算，不取自任一教學實作。'))
    # Deliberate wide-integer/tie/degenerate certificates, still with independent
    # small-size reference computation (no reuse of implementation output).
    special={
        655:'3 0\n0 2 1000000000\n1 0 1000000000\n1 0 1000000000\n',
        656:'2 2\n2 1000000000 1000000000\n2 1000000000 1000000000\n',
        657:'4 3\n0 1 1 1\n1 2 1000000000\n2 3 1000000000\n3 4 1000000000\n',
        662:'2 1 2\n1073741823 1073741823\n',
        663:'1 4\n1 1 1 0\n1 1 1 0\n1 1 2 1\n1 1 2 1\n',
        665:'2 4\n1 1 1000000000\n1 1 1000000000\n2 2 1000000000\n2 2 1000000000\n',
        668:'3\n0 0 0\n1 2 1000000\n2 3 1000000\n',
        669:'4 3\n-1000000 -1000000\n1000000 -1000000\n1000000 1000000\n-1000000 1000000\n1 1\n1 4\n2 3\n',
        675:'2 1 1\n1000000000 0\n-1000000000 1\n',
        677:'4 1\n0 1000000000 0 1000000000\n',
        679:'8 0\n0 0 0 0 0 0 0 0\n1 2\n1 3\n1 4\n1 5\n1 6\n1 7\n1 8\n',
        680:'8 5\n00001111\n2 1 8\n1 3 6\n2 1 8\n1 1 8\n2 1 8\n',
        685:'8 4 8\n1 1 2 2 3 3 6 6\n',
        688:'4 2 1\n-1000000 -1000000 -1000000 -1000000\n',
        689:'2 2 4\nR 1 10000\nC 1 -10000\nR 2 -10000\nC 2 10000\n',
        690:'4 2000000000\n-1000000000 1000000000 -1000000000 1000000000\n',
        691:'4 1\n0 0\n0 1\n1 0\n1 1\n',
        697:'8 3 8\naaaaaaaa\naaa\n1 1\n2 2\n3 3\n4 4\n1 8\n1 6\n2 7\n3 6\n',
        698:'8\n0 0\n2 1\n1 0\n1 1\n200000 0\n199999 1\n0 1\n2 0\n',
    }
    for num,inp in special.items():
        assert inp.strip() not in {s['input'].strip() for s in SOURCE[f'b{num}']['samples']}
        records.append(dict(code=f'b{num}',input=inp,output=oracle(num,inp),reason='刻意設計的64位元／同值多方案／退化邊界；預期值由獨立定義式 oracle 算出。'))
    return records

def verify(lessons,checks,bench=False):
    from concurrent.futures import ThreadPoolExecutor,as_completed
    failures=[]; reports=[]; history=[]; old_benchmarks={}
    previous=HERE/'results-654-699.json'
    if previous.exists():
        old=json.loads(previous.read_text()); history=old.get('historicalFailures',[])+old.get('failures',[])
        old_benchmarks={p['code']:p.get('benchmarks',[]) for p in old.get('problems',[])}
    def one(lesson):
        code=lesson['code']; report={'code':code,'publicSamples':0,'independentCases':0,'languages':{},'failures':[],'benchmarks':[] if bench else old_benchmarks.get(code,[])}
        cases=[dict(x,reason='public sample') for x in SOURCE[code]['samples']]+[x for x in checks if x['code']==code]
        with tempfile.TemporaryDirectory(prefix=code+'-',dir='/tmp') as td:
            td=pathlib.Path(td); cpp=td/'main.cpp'; exe=td/'main'; py=td/'main.py'; cpp.write_text(lesson['cpp']); py.write_text(lesson['python'])
            p=subprocess.run(['g++','-std=c++17','-O2','-pipe',str(cpp),'-o',str(exe)],capture_output=True,text=True)
            if p.returncode: report['failures'].append(dict(code=code,language='cpp',kind='compile',stderr=p.stderr)); return report
            for language,cmd in [('cpp',[str(exe)]),('python',[sys.executable,str(py)])]:
                passed=0; start=time.perf_counter()
                for case in cases:
                    try:
                        p=subprocess.run(cmd,input=case['input'],capture_output=True,text=True,timeout=15)
                        if p.returncode or p.stdout.split()!=case['output'].split(): report['failures'].append(dict(code=code,language=language,kind='runtime',input=case['input'],expected=case['output'],actual=p.stdout,stderr=p.stderr,reason=case['reason']))
                        else: passed+=1
                    except subprocess.TimeoutExpired: report['failures'].append(dict(code=code,language=language,kind='timeout',input=case['input'],expected=case['output']))
                report['languages'][language]={'passed':passed,'total':len(cases),'seconds':round(time.perf_counter()-start,3)}
            if bench and code in ('b658','b659','b698'):
                if code=='b658': inp='35 35 35 35\n'+('1'*35+'\n')*70; label='full35 solid overlap; union has no holes, exact answer -1 0'; expected='-1 0'
                elif code=='b659':
                    rng=random.Random(659); a=[rng.randint(-15,15) for _ in range(45)]; inp='45 15 0\n'+' '.join(map(str,a))+'\n'+''.join(rng.choices('+-',k=44))+'\n'; label='n45 B15 mixed signs and values; cross-language agreement, no independent large oracle'; expected=None
                else:
                    inp='30000\n'+('200000 0\n'*15000)+('199999 1\n'*15000); label='n30000 maximum value span; 399999 divisible by3, answer zero'; expected='0'
                for language,cmd in [('cpp',[str(exe)]),('python',[sys.executable,str(py)])]:
                    start=time.perf_counter()
                    try:
                        p=subprocess.run(cmd,input=inp,capture_output=True,text=True,timeout=180); sec=time.perf_counter()-start
                        report['benchmarks'].append(dict(label=label,language=language,seconds=round(sec,3),output=p.stdout.strip(),returncode=p.returncode,input=inp))
                        if expected is not None and p.stdout.split()!=expected.split(): report['failures'].append(dict(code=code,language=language,kind='benchmark-certificate',input=inp,expected=expected,actual=p.stdout,stderr=p.stderr))
                    except subprocess.TimeoutExpired: report['benchmarks'].append(dict(label=label,language=language,timeoutSeconds=180,input=inp))
                if code=='b659' and len(report['benchmarks'])==2 and report['benchmarks'][0].get('output')!=report['benchmarks'][1].get('output'): report['failures'].append(dict(code=code,kind='benchmark-language-disagreement',input=inp))
            report['publicSamples']=len(SOURCE[code]['samples']); report['independentCases']=len(cases)-report['publicSamples']
        return report
    with ThreadPoolExecutor(max_workers=4) as pool:
        for f in as_completed([pool.submit(one,l) for l in lessons]):
            r=f.result(); reports.append(r); failures+=r['failures']; print(r['code'],r['languages'],'failures',len(r['failures']),flush=True)
    result=dict(tutorials=len(lessons),publicSamplesPerLanguage=sum(x['publicSamples'] for x in reports),independentCasesPerLanguage=len(checks),failures=failures,historicalFailures=history,problems=sorted(reports,key=lambda x:x['code']),limitations=['No judge time or memory limits supplied in source; benchmarks are host-specific, not a promise for every judge.','Random/exhaustive small cases independently validate behavior but are not a formal executable proof on all inputs.'],environment='WSL kali-linux; Linux g++ -std=c++17 -O2, Linux Python '+sys.version)
    previous.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    return not failures

GOALS=[
    '在線性時間內求每次完整回收操作後的最大剩餘帶長。',
    '恰好加速一個葉節點，使根的第 k 份回報時刻最早。',
    '允許跳過啟充，在容量限制下求完整旅程的最低充電費。',
    '處理環與永不啟動節點，求累積配額網路各點的最早啟動時刻。',
    '枚舉所有可能相交位移，判斷單洞與四連通並統計最小周長的位移數。',
    '保留原順序與運算符，求得到目標值的最少逐層限幅次數及最優樹形數。',
    '求免除一個最大值後總和不超標的最長非空連續段。',
    '同時滿足兩點連通與塊大小門檻，找出含第0日的最早達標日。',
    '在長度上下限之內，用精確窗口候選求最大連續 XOR。',
    '求嚴格遞重且類別交替的最長非空行走及邊序列數。',
    '支援點修改並回答截斷於查詢邊界的同值批次長度平方和。',
    '以嚴格延伸前緣的服務序列覆蓋1至N，求最低費用及序列數。',
    '計算奇數標記且恰有K個不同直接前驅的強連通分量數。',
    '計算兩翼較小且兩翼異色的高峰位置三元組。',
    '只在色0頂點中最小化兩色距離總和之差的絕對值，平手取最小編號。',
    '依序交換完整座標，常數時間維護不取絕對值的有向面積兩倍。',
    '區分相反射線，計算兩色數量相等且非空的方向。',
    '計算距離不超K且不被嚴格高點阻擋的同高度位置對。',
    '在有向無環圖中計算禁連特殊邊且權重模3達標的路線數。',
    '計算刪邊後每塊恰一標記且大小偶數的所有刪邊集合。',
    '包含自環和平行邊，統計邊數等於點數且標記數恰k的連通分量。',
    '在合法距離與異色限制下最大化漲幅，依i再j正確處理平手。',
    '只配原始相鄰讀數，先最大化配對數，再最小化差值總和。',
    '只比較最近W筆的多重集合，精確加總每筆的最近值差。',
    '對每個頂點計算距離不超L、異色且嚴格較小的祖先數。',
    '計算含兩端路徑標記和恰K的不同頂點無序對，包含K=0。',
    '支援區間翻色，計算查詢片段中不必相鄰的010位置三元組。',
    '支援永久加邊與單點翻色，即時維護兩色等量的連通塊數。',
    '逐邊加入後，計算可二染且最少標記錯配不超K的連通塊數。',
    '對兩段問號字串判斷能否補成相同字母頻率，且各查詢獨立。',
    '在長度限制內計算恰有一種值重複兩次、其餘均唯一的連續段。',
    '恰選K個位置，計算最大公因數1且總和奇數的集合數。',
    '計算中心度數嚴格較大且兩端不相鄰的無序開口三點組。',
    '計算同列或同欄、異色、限距且線段內部無遮擋的點對。',
    '選恰K個限長偶和且不重疊的區段，最大化可為負數的總收益。',
    '在列欄增減後，不展開整張表就維護各格正值部分總和。',
    '求每步差幅至少D且升降交替的最長非空子序列。',
    '在任兩數和禁整除條件下，選到兩色且最大化位置數。',
    '計算完整覆蓋原序列、每塊限長且和可整除m的切分數。',
    '支援末端追加與刪除，隨時回答含重疊的固定樣式出現數。',
    '按輸入位置計次，找出通過數不超個別K的最短非空前綴。',
    '最多刪一個可刪點並保留非空，最小化軸平行包圍面積。',
    '判斷至多K對不相交字母交換能否同時把S轉成T。',
    '獨立刪段後包含新接縫匹配，精確計算出現數總和與序號加權和。',
    '計算異色位置對的質數和數量，使用精確卷積避免平方枚舉。',
    '逐步翻燈後維護真正亮點外框，輸出最大周長、首次及所有並列時刻數。',
]
for lesson in LESSONS:
    num=int(lesson['code'][1:]); lesson['goal']=GOALS[num-654]
    lesson['traceLabel']='逐步教學推演：依各步描述的例子觀察狀態、轉移與答案。'
    if num in (670,696): lesson['level']='easy'
    elif num in (654,660,669,671,674,675,676,677,683,687,692,694,695,699): lesson['level']='medium'
    if num==658: lesson['performanceNote']='來源未提供評測時限。WSL 本機35×35兩張全黑圖實測：Python約15.90秒、C++17約0.34秒；此案例已觸及全部平移。Python大界執行成本高，嚴格時限建議使用C++17，不能保證Python通過未知時限。'
    if num==659: lesson['performanceNote']='來源未提供評測時限。WSL 本機n=45、B=15混合加減與隨機值實測：Python約4.14秒、C++17約0.23秒，兩者答案一致；大界案例並非獨立窮舉證明。嚴格時限建議C++17，不能保證Python通過未知時限。'
    if num==696: lesson['trace'][2]['title']='最後一項仍一致'
    if num==656: lesson['trace'][0]['description']='容量3，兩段耗電2、1，兩站皆為單位價1、啟充費5。'
    if num==699: lesson['explanation'].append('C++17 版本以兩個 multiset 直接維護亮點的 x 與 y 多重集合，刪除時各刪一份座標；其最小值與最大值等價於 Python 四堆清除過期項後的極值。兩版維護同一個亮點不變量。')
    if num==698:
        lesson['python']=lesson['python'].replace('import sys\n','import sys, math\n',1).replace("math_isqrt:=__import__('math').isqrt(2*V)+1",'math.isqrt(2*V)+1')

if __name__=='__main__':
    LESSONS.sort(key=lambda x:x['code'])
    if '--author' in sys.argv:
        assert len(LESSONS)==46
        DEST.write_text(json.dumps(LESSONS,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
        checks=build_checks(); (HERE/'checks-654-699.json').write_text(json.dumps(checks,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
        print('Persisted',len(LESSONS),'lessons and',len(checks),'independent checks.',flush=True)
    if '--author-only' not in sys.argv:
        lessons=json.loads(DEST.read_text(encoding='utf-8')); checks=json.loads((HERE/'checks-654-699.json').read_text(encoding='utf-8'))
        sys.exit(0 if verify(lessons,checks,'--bench' in sys.argv) else 1)
