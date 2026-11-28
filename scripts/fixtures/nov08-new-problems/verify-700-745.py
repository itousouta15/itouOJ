#!/usr/bin/env python3
"""Authored lessons and deterministic independent checks; run under Linux Python 3.
--build materializes the lesson/check JSON. --verify compiles C++17 in /tmp,
runs both languages on every public and independent case, and records failures.
"""
import json, sys, pathlib, random, itertools, math, collections, subprocess, tempfile, time
HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parents[2]
SOURCE = {x['code']: x for x in json.loads((HERE/'source.json').read_text(encoding='utf-8'))}
LESSONS = []
HEADER = '#include <bits/stdc++.h>\nusing namespace std;\nusing ll=long long;\n'
def add(num, topic, concept, explanations, complexity, pitfall, stages, py, cpp, level='medium'):
    code=f'b{num}'; s=SOURCE[code]
    trace=[]
    for i,(title,desc,cells,variables) in enumerate(stages):
        trace.append(dict(title=title,description=desc,cells=cells,active=list(range(len(cells))),variables=variables))
    LESSONS.append(dict(code=code,title=s['title'].split('. ',1)[1],topic=topic,level=level,
        concept=concept,goal=explanations[0],explanation=explanations,complexity=complexity,pitfall=pitfall,
        sampleInput=s['samples'][0]['input'],sampleOutput=s['samples'][0]['output'],
        traceLabel='自訂小例：'+stages[0][1],trace=trace,python=py.strip()+'\n',cpp=HEADER+cpp.strip()+'\n'))
def steps(*args):
    return [(f'步驟 {i+1}：{t}',d,c,[[k,str(v)] for k,v in vs]) for i,(t,d,c,vs) in enumerate(args)]

add(700,'strings','後綴自動機的 endpos 等價類',[
'建立後綴自動機，將同一個狀態代表的不同長度字串一起計數，找出出現恰 K 次且長度介於 L、R 的相異字串數。每新增一個原字串位置，在當時最後狀態記一次出現；複製狀態的初始次數必須為零。',
'依最大長度遞減，把每個狀態的次數加到 suffix link。每個結尾位置沿 link 對所有後綴提供一次貢獻，所以得到允許重疊的正確出現次數。一個非根狀態 v 恰好代表長度 len(link(v))+1 到 len(v) 的各一個字串，且它們的結尾集合相同；若次數為 K，只須把此長度區間與 [L,R] 交集的整數個數相加，不會重複計數。'],
'固定字母表下時間 O(n)、空間 O(n)（至多 2n 個狀態）；Python 的字典轉移、長度桶及輸入緩衝皆 O(n)。n≤100000，答案用 64 位元。',
'不能把不同起點當作不同字串；clone 若也記一次出現，次數將偏大。',steps(
('插入字元','以 S=aaa、L=1、R=3、K=2 示範。',['a','a','a'],[['原位置',3]]),
('回傳結尾','a、aa、aaa 分別有 3、2、1 個結尾。',['a:3','aa:2','aaa:1'],[['目標次數',2]]),
('交集計數','只有 aa 的長度與次數同時符合。',['aa'],[['答案',1]])),r'''
import sys
n,L,R,K=map(int,sys.stdin.buffer.readline().split()); s=sys.stdin.buffer.readline().strip()
go=[{}]; link=[-1]; length=[0]; cnt=[0]; last=0
for c in s:
    cur=len(go); go.append({}); length.append(length[last]+1); cnt.append(1); link.append(0); p=last
    while p>=0 and c not in go[p]: go[p][c]=cur; p=link[p]
    if p>=0:
        q=go[p][c]
        if length[p]+1==length[q]: link[cur]=q
        else:
            clone=len(go); go.append(go[q].copy()); length.append(length[p]+1); cnt.append(0); link.append(link[q])
            while p>=0 and go[p].get(c)==q: go[p][c]=clone; p=link[p]
            link[q]=link[cur]=clone
    last=cur
buckets=[[] for _ in range(n+1)]
for v in range(1,len(go)): buckets[length[v]].append(v)
ans=0
for size in range(n,0,-1):
    for v in buckets[size]:
        if cnt[v]==K: ans+=max(0,min(R,length[v])-max(L,length[link[v]]+1)+1)
        cnt[link[v]]+=cnt[v]
print(ans)
''',r'''
int main(){ios::sync_with_stdio(false);cin.tie(nullptr);int n,L,R,K;string s;cin>>n>>L>>R>>K>>s;
struct S{array<int,26> to{};int len=0,link=-1;ll cnt=0;};vector<S> a(2*n+1);int sz=1,last=0;
for(char c:s){int x=c-'a',cur=sz++;a[cur].len=a[last].len+1;a[cur].cnt=1;int p=last;
while(p!=-1&&!a[p].to[x]){a[p].to[x]=cur;p=a[p].link;}
if(p==-1)a[cur].link=0;else{int q=a[p].to[x];if(a[p].len+1==a[q].len)a[cur].link=q;else{int z=sz++;a[z]=a[q];a[z].len=a[p].len+1;a[z].cnt=0;while(p!=-1&&a[p].to[x]==q){a[p].to[x]=z;p=a[p].link;}a[q].link=a[cur].link=z;}}last=cur;}
vector<vector<int>> b(n+1);for(int v=1;v<sz;v++)b[a[v].len].push_back(v);ll ans=0;
for(int l=n;l;l--)for(int v:b[l]){if(a[v].cnt==K)ans+=max(0,min(R,a[v].len)-max(L,a[a[v].link].len+1)+1);a[a[v].link].cnt+=a[v].cnt;}cout<<ans<<'\n';}
''','hard')

add(701,'number-theory','列對 XOR 與異值欄配對',[
'固定上、下兩列，把每欄的兩個角做 XOR。選出的兩欄若 XOR 結果不同，四角的總 XOR 就是 1，等價於有奇數個 1。',
'若固定列對有 z 個零欄、o 個一欄，任選一零一欄共有 z×o 個無序欄對。每個框有唯一列對與欄對，因此加總所有列對既不漏算也不重複；只有一列或一欄時自然沒有框。'],
'時間 O(h²w)，h,w≤300 時不超過約 1350 萬次欄比較；空間 O(hw)，包含 Python 讀入字串。答案用 64 位元。',
'只看四角；邊線或內部的 1 不參與奇偶判斷。',steps(
('固定列對','上列 00、下列 01。',['00','01'],[['列對',1]]),('逐欄 XOR','得到 0、1 各一欄。',['0','1'],[['z',1],['o',1]]),('加入乘積','不同 XOR 的兩欄組成唯一合格框。',['1×1'],[['答案',1]])),r'''
import sys
h,w=map(int,sys.stdin.buffer.readline().split()); a=[sys.stdin.buffer.readline().strip() for _ in range(h)]
ans=0
for i in range(h):
    for j in range(i):
        o=sum(x!=y for x,y in zip(a[i],a[j])); ans+=o*(w-o)
print(ans)
''',r'''
int main(){int h,w;cin>>h>>w;vector<string>a(h);for(auto&s:a)cin>>s;ll ans=0;for(int i=0;i<h;i++)for(int j=0;j<i;j++){ll o=0;for(int k=0;k<w;k++)o+=a[i][k]!=a[j][k];ans+=o*(w-o);}cout<<ans<<'\n';}
''','easy')

add(702,'search','完整週期計數與答案二分',[
'時間 t 內，一台機器每 p×k+r 分鐘完成一個完整工作休息週期。已完成數量為 (t//週期)×k + min(k,(t%週期)//p)，不用等最後一次休息才算產品。',
'總產量隨時間不減，故可以二分第一個產量至少 X 的時間。先把上界倍增到可行，保持左側不可行、右側可行（以閉區間版本實作），每次排除一半候選。所有機器都可生產，因此倍增必終止。'],
'時間 O(n log U)，U 為找到的時間上界；空間 O(n)，含 Python 分詞輸入與機器資料。p,k≤10⁶、X≤10⁹，上界可用 64 位元。',
'餘下時間的產品數要截在 k，休息期間不會繼續生產。',steps(
('定義週期','單機 p=2、k=2、r=3，目標 X=3。',['製作2','製作2','休息3'],[['週期',7]]),('測試時間 8','完成一個週期，剩一分鐘不夠做下一件。',['2件','餘1'],[['產量',2]]),('定位時間 9','剩兩分鐘剛完成第三件。',['2+1'],[['最早時間',9]])),r'''
import sys
it=iter(map(int,sys.stdin.buffer.read().split())); n=next(it); X=next(it); a=[(next(it),next(it),next(it)) for _ in range(n)]
def ok(t):
    total=0
    for p,k,r in a:
        cyc=p*k+r; total+=(t//cyc)*k+min(k,(t%cyc)//p)
        if total>=X:return True
    return False
hi=1
while not ok(hi):hi*=2
lo=0
while lo<hi:
    mid=(lo+hi)//2
    if ok(mid):hi=mid
    else:lo=mid+1
print(lo)
''',r'''
int main(){int n;ll X;cin>>n>>X;vector<array<ll,3>>a(n);for(auto&v:a)cin>>v[0]>>v[1]>>v[2];auto ok=[&](ll t){ll z=0;for(auto [p,k,r]:a){ll c=p*k+r;z+=t/c*k+min(k,t%c/p);if(z>=X)return true;}return false;};ll l=0,r=1;while(!ok(r))r*=2;while(l<r){ll m=(l+r)/2;if(ok(m))r=m;else l=m+1;}cout<<l<<'\n';}
''')

add(703,'data-structures','離線座標線段樹與長度權重 Fenwick',[
'先收集操作提及的位置，排序去重。用線段樹記錄每個位置是否啟用；節點保存啟用總數，支援找目前位置左右最近的未啟用索引。相鄰座標若差大於 1，必然隔著未啟用整數，所以另外預先切成連續座標群，搜尋不可跨群。',
'啟用 x 只會把左右相接區段和 x 合併；停用則把含 x 的區段切開。Fenwick 以區段長度為索引，存該長度所有區段的長度總和。每次刪除舊區段、加入新區段後，總啟用數減去長度小於 t 的前綴和就是查詢答案。重複啟用與空停用直接忽略，因而維持每個極長區段恰在 Fenwick 出現一次。'],
'時間 O(q log q)、空間 O(q)，包含離線座標、線段樹、Fenwick 與 Python 輸入輸出緩衝；q≤30000。',
'壓縮後索引相鄰不代表整數位置相鄰，必須限制在原座標連續的群內。',steps(
('啟用兩點','目前啟用位置 2、4。',['[2]','[4]'],[['總長',2]]),('填補間隙','啟用 3，刪除兩段長度 1，加入一段長度 3。',['[2,3,4]'],[['總長',3]]),('查詢門檻','t=2，長度 3 的段整段計入。',['長3 ≥ 2'],[['答案',3]])),r'''
import sys,bisect
it=iter(map(int,sys.stdin.buffer.read().split())); q=next(it); ops=[(next(it),next(it)) for _ in range(q)]
xs=sorted({x for op,x in ops if op!=3}); m=len(xs); pos={x:i for i,x in enumerate(xs)}
left=[0]*m; right=[0]*m
for i in range(m):left[i]=left[i-1] if i and xs[i]==xs[i-1]+1 else i
for i in range(m-1,-1,-1):right[i]=right[i+1] if i+1<m and xs[i+1]==xs[i]+1 else i
size=1
while size<m:size*=2
tree=[0]*(2*size); on=[False]*m; bit=[0]*(q+1); total=0
def change(k,sign):
    if not k:return
    v=k*sign
    while k<=q:bit[k]+=v; k+=k&-k
def pref(k):
    s=0
    while k:s+=bit[k];k-=k&-k
    return s
def zero(l,r,rev=False):
    if l>r:return -1
    def find(v,a,b):
        if b<l or r<a or tree[v]==b-a+1:return -1
        if a==b:return a
        mid=(a+b)//2
        first,second=((v*2+1,mid+1,b),(v*2,a,mid)) if rev else ((v*2,a,mid),(v*2+1,mid+1,b))
        z=find(*first)
        return z if z!=-1 else find(*second)
    return find(1,0,size-1)
out=[]
for op,x in ops:
    if op==3:out.append(str(total-pref(x-1)));continue
    i=pos[x]
    if on[i]==(op==1):continue
    l=zero(left[i],i-1,True); r=zero(i+1,right[i])
    a=i-(l if l!=-1 else left[i]-1)-1; b=(r if r!=-1 else right[i]+1)-i-1
    if op==1:change(a,-1);change(b,-1);change(a+b+1,1);total+=1
    else:change(a+b+1,-1);change(a,1);change(b,1);total-=1
    on[i]=op==1;v=size+i;tree[v]=int(on[i]);v//=2
    while v:tree[v]=tree[2*v]+tree[2*v+1];v//=2
print('\n'.join(out))
''',r'''
int main(){ios::sync_with_stdio(false);cin.tie(nullptr);int q;cin>>q;vector<pair<int,int>>ops(q);vector<int>x;for(auto&[o,v]:ops){cin>>o>>v;if(o!=3)x.push_back(v);}sort(x.begin(),x.end());x.erase(unique(x.begin(),x.end()),x.end());int m=x.size();vector<int>L(m),R(m),bit(q+1),on(m);for(int i=0;i<m;i++)L[i]=(i&&x[i]==x[i-1]+1)?L[i-1]:i;for(int i=m-1;i>=0;i--)R[i]=(i+1<m&&x[i+1]==x[i]+1)?R[i+1]:i;set<int>off;for(int i=0;i<m;i++)off.insert(i);auto change=[&](int k,int s){int v=k*s;for(;k>0&&k<=q;k+=k&-k)bit[k]+=v;};int total=0;for(auto[o,v]:ops){if(o==3){int z=0;for(int k=v-1;k;k-=k&-k)z+=bit[k];cout<<total-z<<'\n';continue;}int i=lower_bound(x.begin(),x.end(),v)-x.begin();if(on[i]==(o==1))continue;auto it=off.lower_bound(i+1);int r=it==off.end()?R[i]+1:min(R[i]+1,*it);it=off.lower_bound(i);int l=L[i]-1;if(it!=off.begin())l=max(l,*prev(it));int a=i-l-1,b=r-i-1;if(o==1){change(a,-1);change(b,-1);change(a+b+1,1);total++;off.erase(i);}else{change(a+b+1,-1);change(a,1);change(b,1);total--;off.insert(i);}on[i]=(o==1);}}
''','hard')

add(704,'dp','禁用上一手的勝負遮罩',[
'對每個剩餘石數 s，先找出能把對手送入敗局的取數集合 M：取 a 合法且 win[s−a][a] 為假，才把 a 放進集合。前一手為 p 時，當且僅當 M 中存在不等於 p 的元素才是勝局。',
'若 M 為空，所有前手狀態都敗；若只有一個元素 a，只有前手 a 的狀態敗；若至少兩個，禁掉任一前手仍有勝步。用一個位元遮罩一次表示前手 0..k 的勝負，0 表示新對局。所有轉移只看較小石數，由 0 向上計算即可。'],
'時間 O(kM+q)、空間 O(M+q)，M 是查詢最大值≤10⁶、k≤8；Python 用整數列表和輸入緩衝 O(M+q)，不建立 O(Mk) 個布林物件。',
'禁止的是與上一手相同的取數，不是禁止重複取同一堆；石數 0 必為敗。',steps(
('零石基底','k=2，所有前手狀態在 s=0 都無步可走。',['s=0:L'],[['遮罩',0]]),('一石轉移','s=1 只有取 1 可送入敗局；前手 1 不能取。',['前手0:W','前手1:L','前手2:W'],[['可勝取數','{1}']]),('三石判定','s=3 取1後對方可取2，取2後對方可取1。',['取1:輸','取2:輸'],[['新局','L']])),r'''
import sys
t=list(map(int,sys.stdin.buffer.read().split()));k,q=t[:2];a=t[2:];M=max(a);win=[0]*(M+1);full=(1<<(k+1))-1
for s in range(1,M+1):
    moves=0
    for x in range(1,min(k,s)+1):
        if not (win[s-x]>>x&1):moves|=1<<x
    if moves:win[s]=full if moves&(moves-1) else full^moves
print(''.join('W' if win[s]&1 else 'L' for s in a))
''',r'''
int main(){int k,q;cin>>k>>q;vector<int>a(q);int m=0;for(int&x:a){cin>>x;m=max(m,x);}vector<int>w(m+1);int full=(1<<(k+1))-1;for(int s=1;s<=m;s++){int z=0;for(int x=1;x<=k&&x<=s;x++)if(!(w[s-x]>>x&1))z|=1<<x;if(z)w[s]=(z&(z-1))?full:full^z;}for(int s:a)cout<<((w[s]&1)?'W':'L');cout<<'\n';}
''')

add(705,'strings','反向字典樹的終點顏色累計',[
'將所有字串反轉插入 trie，節點分別累計兩種顏色在此結束的位置數。原字串的嚴格後綴，恰是反轉後字串的嚴格前綴。',
'逐一走訪每個反轉字串，在尚未讀完前把當前節點的異色終點數加進答案。同內容的多個位置已由次數保留，每個短字串位置與長字串位置的有序對只在長字串走訪時被計一次；不計最後節點便排除了等長相同字串。'],
'總字數 M≤300000，時間與空間 O(M+n)，包括 Python trie 字典、字串及分詞緩衝。答案 O(n²) 需 64 位元。',
'必須先插入全部字串再查詢，否則輸入順序會影響答案。',steps(
('建樹','輸入 0 a、1 ba、1 a。',['a:0×1,1×1','ab:1×1'],[['位置數',3]]),('走長字串','ba 反轉成 ab，在 a 的終點找到一個異色位置。',['a→b'],[['新增',1]]),('排除同長','兩個 a 顏色雖不同，但不是嚴格後綴。',['a','a'],[['答案',1]])),r'''
import sys
it=iter(sys.stdin.buffer.read().split());n=int(next(it));a=[(int(next(it)),next(it)[::-1]) for _ in range(n)]
go=[{}];end=[[0,0]]
for c,s in a:
    v=0
    for x in s:
        if x not in go[v]:go[v][x]=len(go);go.append({});end.append([0,0])
        v=go[v][x]
    end[v][c]+=1
ans=0
for c,s in a:
    v=0
    for x in s:
        ans+=end[v][1-c];v=go[v][x]
print(ans)
''',r'''
int main(){int n;cin>>n;vector<pair<int,string>>a(n);struct N{map<char,int>g;ll e[2]={0,0};};vector<N>tr(1);for(auto&[c,s]:a){cin>>c>>s;reverse(s.begin(),s.end());int v=0;for(char x:s){if(!tr[v].g.count(x)){int z=tr.size();tr[v].g[x]=z;tr.emplace_back();}v=tr[v].g[x];}tr[v].e[c]++;}ll ans=0;for(auto[c,s]:a){int v=0;for(char x:s){ans+=tr[v].e[1-c];v=tr[v].g[x];}}cout<<ans<<'\n';}
''')

add(706,'data-structures','限長前綴和視窗與堆疊回退',[
'設目前尾端是 n，新增的零和片段只可能以 n 結尾，對應前綴索引 j∈[n−R,n−L] 且 P[j]=P[n]。以雜湊頻率維持此合法索引視窗，附加時先加入新右端、移除舊左端，再查 P[n] 的次數。',
'把每個長度的答案與前綴和存成堆疊。刪尾時，逆轉上一個附加造成的兩次頻率變動，再彈出前綴及答案，便恢復原狀。空序列刪尾沒有任何變化；分支式增刪也正確，因為所保存的都是目前前綴路徑，不依賴被刪掉的未來。'],
'Python 雜湊版期望時間 O(q)，C++ 有序 map 版 O(q log q)；空間 O(q)，包含前綴、答案堆疊、頻率及 Python 輸入輸出緩衝；q≤40000，前綴和與答案採 64 位元。',
'回退時不能只回退答案；合法起點的頻率表也必須完整還原。',steps(
('附加一','L=1、R=2，序列 [1]。',['P:0,1'],[['答案',0]]),('附加負一','序列 [1,-1] 的整段為零。',['P:0,1,0'],[['答案',1]]),('刪除尾端','回到 [1]，答案與視窗一同回退。',['P:0,1'],[['答案',0]])),r'''
import sys
from collections import defaultdict
f=sys.stdin.buffer;q,L,R=map(int,f.readline().split());P=[0];A=[0];cnt=defaultdict(int);out=[]
for _ in range(q):
    t=f.readline().split();n=len(P)-1
    if t[0]==b'+':
        n+=1;P.append(P[-1]+int(t[1]))
        if n-L>=0:cnt[P[n-L]]+=1
        if n-R-1>=0:cnt[P[n-R-1]]-=1
        A.append(A[-1]+cnt[P[n]])
    elif n:
        if n-L>=0:cnt[P[n-L]]-=1
        if n-R-1>=0:cnt[P[n-R-1]]+=1
        P.pop();A.pop()
    out.append(str(A[-1]))
print('\n'.join(out))
''',r'''
int main(){int q,L,R;cin>>q>>L>>R;vector<ll>P{0},A{0};map<ll,ll>cnt;while(q--){char op;cin>>op;int n=P.size()-1;if(op=='+'){ll x;cin>>x;n++;P.push_back(P.back()+x);if(n-L>=0)cnt[P[n-L]]++;if(n-R-1>=0)cnt[P[n-R-1]]--;A.push_back(A.back()+cnt[P[n]]);}else if(n){if(n-L>=0)cnt[P[n-L]]--;if(n-R-1>=0)cnt[P[n-R-1]]++;P.pop_back();A.pop_back();}cout<<A.back()<<'\n';}}
''')

add(707,'strings','排除端點的母音前綴與滑動頻率',[
'令 P[t] 是前 t 個字元中的母音數，則 i、j 之間的母音數為 P[j]−P[i+1]（此處位置從 0 起算）。掃描右端 j，把左端 i 的鍵設為 (S[i],P[i+1])，查詢鍵 (S[j],P[j]−K)。',
'表中只保留 j−D≤i<j。每次先移除剛過期的左端，查詢後才把 j 作為未來左端加入，因此不會把自己配給自己，也正好滿足距離限制。前綴相減精確排除兩個端點，左右端是否為母音都適用。'],
'期望時間 O(n)，空間 O(n)，含 Python 前綴、雜湊表及輸入字串；n≤200000，答案可達 O(n²)。C++ 使用有序 map 時為 O(n log n)。',
'若使用 P[i] 而非 P[i+1]，左端為母音時會多算一個。',steps(
('母音前綴','S=aba、D=2、K=0。',['P:0,1,1,2'],[['長度',3]]),('掃到末尾','j=2 時要求左端 P[i+1]=P[2]−0=1。',['a:1','b:1'],[['查詢字元','a']]),('確認配對','i=0、j=2 中間只有 b，沒有母音。',['a','b','a'],[['答案',1]])),r'''
import sys
from collections import defaultdict
n,D,K=map(int,sys.stdin.buffer.readline().split());s=sys.stdin.buffer.readline().strip();P=[0]
for c in s:P.append(P[-1]+(c in b'aeiou'))
cnt=defaultdict(int);ans=0
for j,c in enumerate(s):
    old=j-D-1
    if old>=0:cnt[(s[old],P[old+1])]-=1
    ans+=cnt[(c,P[j]-K)];cnt[(c,P[j+1])]+=1
print(ans)
''',r'''
int main(){int n,D,K;string s;cin>>n>>D>>K>>s;vector<int>P(n+1);for(int i=0;i<n;i++)P[i+1]=P[i]+(string("aeiou").find(s[i])!=string::npos);map<pair<char,int>,ll>cnt;ll ans=0;for(int j=0;j<n;j++){int old=j-D-1;if(old>=0)cnt[{s[old],P[old+1]}]--;ans+=cnt[{s[j],P[j]-K}];cnt[{s[j],P[j+1]}]++;}cout<<ans<<'\n';}
''')

add(708,'data-structures','雙單調佇列與至多差分',[
'先定義 F(B) 為長度至少 L、振幅不超過 B 的片段數，目標就是 F(K)−F(K−1)。B<0 時沒有非空片段，因此回傳零。',
'用遞增、遞減佇列維持視窗最小與最大值。右端 r 固定時，將左端 l 推到振幅可行的最左位置；再往右刪元素不會增加振幅，所以合法起點恰是 [l,r−L+1]，貢獻 max(0,r−L+2)。每個索引在佇列中各進出一次，無須枚舉片段。'],
'時間 O(n)、空間 O(n)，包括 Python 整數輸入列表與兩個佇列；n≤200000。差值可達 2×10⁹，計數用 64 位元。',
'題目雖稱限短，實際條件是長度至少 L；K=0 時 F(−1) 必須直接回零。',steps(
('加入第一項','a=[1,1,2]、L=2、K=0。',['1'],[['F(0)',0]]),('相等延伸','右端 1 時片段 [1,1] 符合。',['1','1'],[['新增',1]]),('值變化收縮','加入 2 後左端移至 2，長度不足。',['2'],[['答案',1]])),r'''
import sys
from collections import deque
t=list(map(int,sys.stdin.buffer.read().split()));n,L,K=t[:3];a=t[3:]
def F(B):
    if B<0:return 0
    low=deque();high=deque();l=ans=0
    for r,x in enumerate(a):
        while low and a[low[-1]]>=x:low.pop()
        while high and a[high[-1]]<=x:high.pop()
        low.append(r);high.append(r)
        while a[high[0]]-a[low[0]]>B:
            if low[0]==l:low.popleft()
            if high[0]==l:high.popleft()
            l+=1
        ans+=max(0,r-L-l+2)
    return ans
print(F(K)-F(K-1))
''',r'''
int main(){int n,L;ll K;cin>>n>>L>>K;vector<ll>a(n);for(auto&x:a)cin>>x;auto F=[&](ll B){if(B<0)return 0LL;deque<int>lo,hi;int l=0;ll z=0;for(int r=0;r<n;r++){while(!lo.empty()&&a[lo.back()]>=a[r])lo.pop_back();while(!hi.empty()&&a[hi.back()]<=a[r])hi.pop_back();lo.push_back(r);hi.push_back(r);while(a[hi.front()]-a[lo.front()]>B){if(lo.front()==l)lo.pop_front();if(hi.front()==l)hi.pop_front();l++;}z+=max(0,r-L-l+2);}return z;};cout<<F(K)-F(K-1)<<'\n';}
''')

add(709,'graphs','以唯一標記點為中心的位元集合',[
'合格三人組有唯一的標記 1 頂點 v。固定 v，令 A 為被 v 擊敗的零標記點，B 為擊敗 v 的零標記點。形成三循環的充要條件，是存在 a∈A、b∈B 且 a 擊敗 b。',
'把每個頂點擊敗的零標記點存為 bitset，對每個 a∈A，與 B 交集取位元數即可。每組三人因唯一 v 被選一次，方向又由 v 的勝負唯一決定，不需要除以三或六。'],
'時間 O(n³/字組大小) 的位元集合交集，空間 O(n²) 位元及輸入；Python 大整數 bit_count 在 C 層運算。n≤400，C++ bitset<400>。',
'標記 1 不表示勝利；要恰一個標記點且三場形成環。',steps(
('固定標記點','v→a、a→b、b→v，僅 v 標記為 1。',['v','a','b'],[['標記數',1]]),('分組零點','A={a}、B={b}。',['A:a','B:b'],[['候選對',1]]),('檢查中間邊','a 擊敗 b，形成唯一三循環。',['v→a→b→v'],[['答案',1]])),r'''
import sys
f=sys.stdin.buffer;n=int(f.readline());mark=f.readline().strip();a=[f.readline().strip() for _ in range(n)]
zero=[i for i in range(n) if mark[i]==48];wins=[sum(1<<j for j in zero if row[j]==49) for row in a];ans=0
for v in range(n):
    if mark[v]!=49:continue
    B=sum(1<<j for j in zero if a[j][v]==49)
    for u in zero:
        if a[v][u]==49:ans+=(wins[u]&B).bit_count()
print(ans)
''',r'''
int main(){int n;string s;cin>>n>>s;vector<string>a(n);for(auto&v:a)cin>>v;vector<bitset<400>>win(n);for(int i=0;i<n;i++)for(int j=0;j<n;j++)if(s[j]=='0'&&a[i][j]=='1')win[i].set(j);ll ans=0;for(int v=0;v<n;v++)if(s[v]=='1'){bitset<400>B;for(int j=0;j<n;j++)if(s[j]=='0'&&a[j][v]=='1')B.set(j);for(int u=0;u<n;u++)if(s[u]=='0'&&a[v][u]=='1')ans+=(win[u]&B).count();}cout<<ans<<'\n';}
''')

add(710,'graphs','造訪次數分層 Dijkstra',[
'把節點拆成 (v,c)，c 是至今造訪標記站的總次數，只保留 0、1。從 (1,b₁) 出發，每走邊 u→v 就令新層為 c+bᵥ；大於 1 的轉移丟棄。',
'所有合法行走都唯一對應分層圖上的路徑，權重相同，反之亦然。因此正權邊上的 Dijkstra 到 (n,1) 即為答案。重訪標記站會再次加一而被排除；n=1 的零邊路徑只有起點標記為 1 時才符合。'],
'時間 O((n+m) log(n+m))、空間 O(n+m)，包括 Python 鄰接串列、heap 中過期項與分詞輸入。邊權可達 10⁹，用 64 位元距離。',
'不能只標記某節點曾經過；限制的是累計造訪次數，而且起終點也要計。',steps(
('初始化','1→2→3，標記 0、1、0，邊權各 1。',['(1,0):0'],[['距離',0]]),('抵達標記','走到 2，層數由 0 變 1。',['(2,1):1'],[['造訪次數',1]]),('抵達終點','3 沒標記，保留層 1。',['(3,1):2'],[['答案',2]])),r'''
import sys,heapq
it=iter(map(int,sys.stdin.buffer.read().split()));n=next(it);m=next(it);b=[next(it) for _ in range(n)];g=[[] for _ in range(n)]
for _ in range(m):u,v,w=next(it),next(it),next(it);g[u-1].append((v-1,w))
INF=10**30;d=[[INF]*2 for _ in range(n)];d[0][b[0]]=0;h=[(0,0,b[0])]
while h:
    z,u,c=heapq.heappop(h)
    if z!=d[u][c]:continue
    for v,w in g[u]:
        k=c+b[v]
        if k<=1 and z+w<d[v][k]:d[v][k]=z+w;heapq.heappush(h,(z+w,v,k))
print(-1 if d[-1][1]==INF else d[-1][1])
''',r'''
int main(){int n,m;cin>>n>>m;vector<int>b(n);for(int&v:b)cin>>v;vector<vector<pair<int,ll>>>g(n);while(m--){int u,v;ll w;cin>>u>>v>>w;g[u-1].push_back({v-1,w});}const ll I=4e18;vector<array<ll,2>>d(n,{I,I});priority_queue<tuple<ll,int,int>,vector<tuple<ll,int,int>>,greater<tuple<ll,int,int>>>h;d[0][b[0]]=0;h.push({0,0,b[0]});while(!h.empty()){auto[z,u,c]=h.top();h.pop();if(z!=d[u][c])continue;for(auto[v,w]:g[u]){int k=c+b[v];if(k<=1&&z+w<d[v][k]){d[v][k]=z+w;h.push({z+w,v,k});}}}cout<<(d[n-1][1]==I?-1:d[n-1][1])<<'\n';}
''')

add(711,'simulation','等速增優的固定排序鍵',[
'每個候選在時刻 t 的優先值為 t+(pᵢ−aᵢ)，共同的 t 不影響比較。因此先依到達時間排序，再用堆按 pᵢ−aᵢ 最大、aᵢ 最小、輸入編號最小選工作。',
'每次選取前把所有 aᵢ≤t 的工作加入堆；堆空就跳到下一個到達時間。取出後等待加 t−aᵢ，時間增加 dᵢ。此順序完全等價於題意逐次決策，尤其同完成時刻的新到達者會在下一次選取前加入，不會錯過競爭。'],
'時間 O(n log n)、空間 O(n)，包含 Python 排序列表、heap、分詞緩衝；n≤1700。完成與等候總和可超 32 位元。',
'優先值相同要先到達時間，再編號；不能單純依初始 p 排序。',steps(
('第一筆開始','工作 (a,p,d) 為 (0,0,3)、(1,0,1)。',['工作1'],[['t',0],['等待和',0]]),('完成並收件','t=3，工作2 已等兩單位。',['工作2'],[['開始',3],['新增等待',2]]),('全部完成','工作2 再花一單位。',['完成'],[['完成時刻',4],['等待和',2]])),r'''
import sys,heapq
it=iter(map(int,sys.stdin.buffer.read().split()));n=next(it);a=[]
for i in range(n):
    x,p,d=next(it),next(it),next(it);a.append((x,p,d,i))
a.sort();j=t=wait=0;h=[]
while j<n or h:
    if not h and j<n:t=max(t,a[j][0])
    while j<n and a[j][0]<=t:
        x,p,d,i=a[j];heapq.heappush(h,(x-p,x,i,d));j+=1
    _,x,i,d=heapq.heappop(h);wait+=t-x;t+=d
print(t,wait)
''',r'''
int main(){int n;cin>>n;vector<array<ll,4>>a(n);for(int i=0;i<n;i++){cin>>a[i][0]>>a[i][1]>>a[i][2];a[i][3]=i;}sort(a.begin(),a.end());priority_queue<array<ll,4>,vector<array<ll,4>>,greater<array<ll,4>>>h;int j=0;ll t=0,w=0;while(j<n||!h.empty()){if(h.empty()&&j<n)t=max(t,a[j][0]);while(j<n&&a[j][0]<=t){auto[x,p,d,i]=a[j++];h.push({x-p,x,i,d});}auto[k,x,i,d]=h.top();h.pop();w+=t-x;t+=d;}cout<<t<<' '<<w<<'\n';}
''')

add(712,'trees','唯一中點的異色權重配對',[
'樹上距離恰二的兩端有唯一中點。對每個中點，把鄰居按顏色分成兩個權重列表，只需計算兩列表中權重和不超過 T 的配對。',
'排序兩列表後，從最小的顏色0權重開始，顏色1的可用最大索引只會向左移；剩餘前綴長度就是這個端點的配對數。每個合格端點對在唯一中點被算一次，即使權重相同也以列表元素的位置保留其多重性。'],
'時間 O(n log n)，因所有鄰接度數總和為 2(n−1)；空間 O(n)，包含 Python 輸入、鄰接列表及排序暫存；n≤200000。',
'不是把中點權重加進門檻；只有兩個端點的權重和受限制。',steps(
('選中心','星狀樹的葉子權重為 0色:1、1色:2、1色:5，T=4。',['0:[1]','1:[2,5]'],[['中心',1]]),('縮小上界','1+5>4，排除權重5。',['1+5=6'],[['可用1色數',1]]),('累計合法','1+2≤4，只剩一對。',['1+2=3'],[['答案',1]])),r'''
import sys
it=iter(map(int,sys.stdin.buffer.read().split()));n=next(it);T=next(it);a=[(next(it),next(it)) for _ in range(n)];g=[[] for _ in range(n)]
for _ in range(n-1):u=next(it)-1;v=next(it)-1;g[u].append(v);g[v].append(u)
ans=0
for nei in g:
    b=[[],[]]
    for v in nei:c,w=a[v];b[c].append(w)
    b[0].sort();b[1].sort();j=len(b[1])-1
    for x in b[0]:
        while j>=0 and x+b[1][j]>T:j-=1
        ans+=j+1
print(ans)
''',r'''
int main(){int n;ll T;cin>>n>>T;vector<int>c(n);vector<ll>w(n);for(int i=0;i<n;i++)cin>>c[i]>>w[i];vector<vector<int>>g(n);for(int i=1,u,v;i<n;i++){cin>>u>>v;g[--u].push_back(--v);g[v].push_back(u);}ll ans=0;for(auto&nei:g){vector<ll>b[2];for(int v:nei)b[c[v]].push_back(w[v]);sort(b[0].begin(),b[0].end());sort(b[1].begin(),b[1].end());int j=(int)b[1].size()-1;for(ll x:b[0]){while(j>=0&&x+b[1][j]>T)j--;ans+=j+1;}}cout<<ans<<'\n';}
''')

add(713,'number-theory','只保留目標因數的次數表',[
'若 lcm(a,b)=Q，a 與 b 都必須整除 Q。先丟棄非因數，依顏色累計每個因數出現的位置數；再枚舉顏色0與顏色1的因數值配對。',
'檢驗 a/gcd(a,b)×b 是否等於 Q，若是就加入 freq₀[a]×freq₁[b]。異色端點固定了列舉方向，因此每個無序位置對恰好算一次，無需除二。重複數值以乘積保留各位置的組合。'],
'令 d 為 Q 的因數數量。Python 雜湊計數版期望時間 O(n+d² log Q)，C++ 有序 map 計數版 O(n log(d+1)+d² log Q)。空間 O(n+d)，含 Python 輸入分詞；Q≤10⁹ 時 d≤1344，至多約180萬對因數。乘法與配對數使用64位元。',
'不能用 a×b=Q 代替最小公倍數；先除 gcd 再乘較安全。',steps(
('篩因數','Q=6，位置為 0色:2、1色:3、1色:6。',['2','3','6'],[['保留位置',3]]),('檢驗第一對','lcm(2,3)=6。',['2↔3'],[['新增',1]]),('檢驗第二對','lcm(2,6)=6。',['2↔6'],[['答案',2]])),r'''
import sys,math
from collections import Counter
it=iter(map(int,sys.stdin.buffer.read().split()));n=next(it);Q=next(it);f=[Counter(),Counter()]
for _ in range(n):
    a=next(it);c=next(it)
    if Q%a==0:f[c][a]+=1
print(sum(x*y for a,x in f[0].items() for b,y in f[1].items() if a//math.gcd(a,b)*b==Q))
''',r'''
int main(){int n;ll Q;cin>>n>>Q;map<ll,ll>f[2];while(n--){ll a;int c;cin>>a>>c;if(Q%a==0)f[c][a]++;}ll z=0;for(auto[a,x]:f[0])for(auto[b,y]:f[1])if(a/gcd(a,b)*b==Q)z+=x*y;cout<<z<<'\n';}
''')

add(714,'strings','第一個失配與等字元刪除群',[
'對每個輪轉，用雙指標找到第一對不相等字元 l、r。若存在失配，合法刪除只能等價於刪左端 l 或右端 r：刪掉與 l 相同、連續延伸到 l 左邊的字元，結果都和刪 l 一樣；右端對稱處理。各檢查剩餘中段是否為迴文，成立才加該連續群長度。',
'若整個輪轉本來就是迴文，能刪除的位置恰是包含中央的同字元連續群：刪其他字元會打破左右配對，除非一路相等到中央，而這正是中央群。這樣一次輪轉只需線性掃描和兩次迴文測試，不必為每個刪除位置重新建立字串。n=1 的中央群長度為1，刪成空字串也算。'],
'時間 O(n²)、空間 O(n)，n≤2000；每個輪轉僅線性掃描，Python 切片及輸入亦 O(n)。計算的是位置數，不是不同刪除後字串數。',
'第一失配處合法不代表只有那個索引合法；連續相同字元的多個刪除位置要全部保留。',steps(
('找失配','輪轉字串 aaba，指標停在 l=1、r=2。',['a','a','b','a'],[['l',1],['r',2]]),('刪左群','刪第0或1個 a 均得 aba，都是迴文。',['aba','aba'],[['左群貢獻',2]]),('刪右群','刪 b 得 aaa，也合格；此輪轉共3對。',['aaa'],[['此輪轉貢獻',3]])),r'''
import sys
n=int(sys.stdin.buffer.readline());s=sys.stdin.buffer.readline().strip();rot=total=0
def pal(t,l,r):
    while l<r:
        if t[l]!=t[r]:return False
        l+=1;r-=1
    return True
for start in range(n):
    t=s[start:]+s[:start];l=0;r=n-1
    while l<r and t[l]==t[r]:l+=1;r-=1
    ways=0
    if l>=r:
        a=(n-1)//2;b=n//2
        while a>0 and t[a-1]==t[a]:a-=1
        while b+1<n and t[b+1]==t[b]:b+=1
        ways=b-a+1
    else:
        if pal(t,l+1,r):
            a=l
            while a>0 and t[a-1]==t[l]:a-=1
            ways+=l-a+1
        if pal(t,l,r-1):
            b=r
            while b+1<n and t[b+1]==t[r]:b+=1
            ways+=b-r+1
    rot+=ways>0;total+=ways
print(rot,total)
''',r'''
bool pal(const string&t,int l,int r){while(l<r)if(t[l++]!=t[r--])return false;return true;}
int main(){int n;string s;cin>>n>>s;ll total=0;int rot=0;for(int st=0;st<n;st++){string t=s.substr(st)+s.substr(0,st);int l=0,r=n-1;while(l<r&&t[l]==t[r])l++,r--;int ways=0;if(l>=r){int a=(n-1)/2,b=n/2;while(a&&t[a-1]==t[a])a--;while(b+1<n&&t[b+1]==t[b])b++;ways=b-a+1;}else{if(pal(t,l+1,r)){int a=l;while(a&&t[a-1]==t[l])a--;ways+=l-a+1;}if(pal(t,l,r-1)){int b=r;while(b+1<n&&t[b+1]==t[r])b++;ways+=b-r+1;}}rot+=ways>0;total+=ways;}cout<<rot<<' '<<total<<'\n';}
''','hard')

add(715,'strings','斷點分段與六位奇偶前綴',[
'任何相鄰相同字元都不可能包含在合格片段內。因此遇到 S[i]=S[i−1] 時，在 i 之前切開，讓頻率表只記目前無相鄰重字的區段。',
'每個字母對應一位，出現一次就 XOR 翻轉。兩個前綴遮罩相同，代表它們之間所有字母都出現偶數次。掃描時先加相同遮罩的舊前綴數，再記新前綴；斷點處重設為一個空前綴即可。每段的子片段完全不跨斷點，故計數恰好對應題意。'],
'時間 O(64n) 的直接重設寫法，64 固定故為 O(n)；空間 O(n) 包含 Python 讀入字串，額外頻率陣列僅 64 格。',
'重設段落時必須保留一個空前綴，否則從段首開始的片段會漏算。',steps(
('第一個前綴','字串 abab，空前綴遮罩是0。',['空:0','a:1'],[['答案',0]]),('中間遮罩','讀到 ab、aba 時遮罩為3、2，尚未重複。',['ab:3','aba:2'],[['答案',0]]),('回到零','abab 遮罩為0，與空前綴配成一段。',['abab:0'],[['答案',1]])),r'''
import sys
s=sys.stdin.buffer.readline().strip();f=[0]*64;f[0]=1;mask=ans=0;prev=-1
for c in s:
    if c==prev:f=[0]*64;f[0]=1;mask=0
    mask^=1<<(c-97);ans+=f[mask];f[mask]+=1;prev=c
print(ans)
''',r'''
int main(){string s;cin>>s;array<ll,64>f{};f[0]=1;int mask=0;char prev=0;ll ans=0;for(char c:s){if(c==prev){f.fill(0);f[0]=1;mask=0;}mask^=1<<(c-'a');ans+=f[mask];f[mask]++;prev=c;}cout<<ans<<'\n';}
''')

add(716,'data-structures','最後兩個內峰限定左端視窗',[
'以 0 起算位置，固定右端 r，最後一個已成為內峰的位置為 p，倒數第二個為 z。恰有一個內峰等價於左端 l 落在 [z,p−1]；若沒有前峰，z 用0取代。這是因為 l=p 會排除峰 p，l<z 又會把前峰納入。',
'令 P 為元素和的模 K 前綴，片段可整除恰為 P[l]=P[r+1]。維護上述左端區間的前綴餘數頻率；新峰出現時，區間兩端皆單調右移，逐一加入、移除即可。沒有內峰時不計答案。每個左端僅加入及移除一次，所以不用做 n² 枚舉。'],
'時間 O(n+K)、空間 O(n+K)，包含 Python 元素與前綴陣列及輸入；n≤12000、K≤1000。C++ 要把負餘數正規化。',
'峰必須嚴格高於兩側且位於片段內部；不能把片段端點算成峰。',steps(
('偵測內峰','a=[1,3,0]、K=2，右端到2時 p=1。',['1','3','0'],[['峰位置',1]]),('合法左端','沒有更早的峰，左端範圍只有 [0,0]。',['P[0]=0'],[['候選左端數',1]]),('配對餘數','總和4的餘數0，與 P[0] 相同。',['4 mod 2=0'],[['答案',1]])),r'''
import sys
t=list(map(int,sys.stdin.buffer.read().split()));n,K=t[:2];a=t[2:];P=[0]
for x in a:P.append((P[-1]+x)%K)
freq=[0]*K;last=-1;lo=0;hi=-1;ans=0
for r in range(n):
    if r>=2 and a[r-1]>a[r-2] and a[r-1]>a[r]:
        p=r-1;newlo=max(0,last);newhi=p-1
        while hi<newhi:hi+=1;freq[P[hi]]+=1
        while lo<newlo:freq[P[lo]]-=1;lo+=1
        last=p
    if last!=-1:ans+=freq[P[r+1]]
print(ans)
''',r'''
int main(){int n,K;cin>>n>>K;vector<ll>a(n);vector<int>P(n+1),f(K);for(int i=0;i<n;i++){cin>>a[i];P[i+1]=((P[i]+a[i])%K+K)%K;}int last=-1,l=0,h=-1;ll ans=0;for(int r=0;r<n;r++){if(r>=2&&a[r-1]>a[r-2]&&a[r-1]>a[r]){int p=r-1,nl=max(0,last);while(h<p-1)f[P[++h]]++;while(l<nl)f[P[l++]]--;last=p;}if(last!=-1)ans+=f[P[r+1]];}cout<<ans<<'\n';}
''')

add(717,'trees','兩條切邊唯一決定中間連通塊',[
'根設為1，每條邊以其子節點代表，求子樹和及 DFS 進出時間。刪掉兩條不同顏色邊後，樹分成三塊，其中同時接觸兩條切邊的中間塊，正好是邊界只有這兩條邊的唯一連通集合。',
'若子節點 a 是 b 的祖先，中間塊權重為 sum[a]−sum[b]；若兩者子樹互不包含，則為 total−sum[a]−sum[b]。枚舉異色切邊對即可取最大並計數。任何合法集合的兩條邊界唯一決定它，因此切邊對與集合是一一對應，無需儲存頂點集合去重。'],
'時間 O(n²)、空間 O(n)，n≤1800 時至多約162萬對。Python 順序、子樹和、輸入皆線性；權重和及最佳解數使用 64 位元。',
'答案可能為負，初始最佳值不可設為0；沒有異色邊對要輸出 IMPOSSIBLE。',steps(
('計子樹','鏈 1—2—3，權重5、−2、8，邊色0、1。',['sum2=6','sum3=8'],[['總和',11]]),('選異色切邊','子節點2包含子節點3。',['2祖先於3'],[['切邊數',2]]),('中間塊','sum2−sum3=−2，只剩頂點2。',['{2}'],[['最佳值',-2],['個數',1]])),r'''
import sys
it=iter(map(int,sys.stdin.buffer.read().split()));n=next(it);w=[next(it) for _ in range(n)];g=[[] for _ in range(n)]
for _ in range(n-1):u=next(it)-1;v=next(it)-1;c=next(it);g[u].append((v,c));g[v].append((u,c))
par=[-1]*n;color=[-1]*n;order=[];tin=[0]*n;tout=[0]*n;stack=[(0,-1,False)]
while stack:
    u,p,exit=stack.pop()
    if exit:tout[u]=len(order);continue
    par[u]=p;tin[u]=len(order);order.append(u);stack.append((u,p,True))
    for v,c in g[u]:
        if v!=p:color[v]=c;stack.append((v,u,False))
sub=w[:]
for u in reversed(order[1:]):sub[par[u]]+=sub[u]
best=None;ways=0
for a in range(1,n):
    for b in range(a+1,n):
        if color[a]==color[b]:continue
        if tin[a]<=tin[b]<tout[a]:z=sub[a]-sub[b]
        elif tin[b]<=tin[a]<tout[b]:z=sub[b]-sub[a]
        else:z=sub[0]-sub[a]-sub[b]
        if best is None or z>best:best=z;ways=1
        elif z==best:ways+=1
print('IMPOSSIBLE' if best is None else f'{best} {ways}')
''',r'''
int main(){int n;cin>>n;vector<ll>s(n);for(auto&x:s)cin>>x;vector<vector<pair<int,int>>>g(n);for(int i=1,u,v,c;i<n;i++){cin>>u>>v>>c;g[--u].push_back({--v,c});g[v].push_back({u,c});}vector<int>tin(n),out(n),col(n,-1);int timer=0;function<void(int,int)>dfs=[&](int u,int p){tin[u]=timer++;for(auto[v,c]:g[u])if(v!=p){col[v]=c;dfs(v,u);s[u]+=s[v];}out[u]=timer;};dfs(0,-1);ll best=LLONG_MIN,ways=0;for(int a=1;a<n;a++)for(int b=a+1;b<n;b++)if(col[a]!=col[b]){ll z;if(tin[a]<=tin[b]&&tin[b]<out[a])z=s[a]-s[b];else if(tin[b]<=tin[a]&&tin[a]<out[b])z=s[b]-s[a];else z=s[0]-s[a]-s[b];if(z>best)best=z,ways=1;else if(z==best)ways++;}if(!ways)cout<<"IMPOSSIBLE\n";else cout<<best<<' '<<ways<<'\n';}
''','hard')

add(718,'basics','閉區間首次越界的整除公式',[
'每個非零速度軸可以獨立算首次越界：正向為 (界長−起點)//速度+1，負向為 起點//(−速度)+1。加一是因為落在邊界仍算內部；零速度軸永不越界。',
'兩軸候選時間取最小，代入原始座標公式得到整秒位置，再依 L、R、B、T 檢查全部方向。這同時處理某軸早越界與兩軸同時越界。兩速度都零才輸出 NEVER；不需逐秒模擬到可能超過十億的時間。'],
'每筆時間與額外空間 O(1)，總 O(q)；Python 分詞及輸出緩衝 O(q)。座標與乘法使用 64 位元，界長與速度最大2×10⁹。',
'不可把落在邊上算越界，也不可在同時越界時只輸出一個方向。',steps(
('算兩軸時間','W=4、H=3、x=y=1、vx=2、vy=1。',['tx=2','ty=3'],[['候選最小',2]]),('代回座標','t=2，位置是 (5,3)。',['X=5','Y=3'],[['t',2]]),('檢查方向','x>4，而 y=3 還在邊界，只輸出R。',['R'],[['輸出','2 5 3 R']])),r'''
import sys
it=iter(map(int,sys.stdin.buffer.read().split()));q=next(it);out=[]
for _ in range(q):
    W,H,x,y,vx,vy=[next(it) for _ in range(6)];times=[]
    for bound,z,v in ((W,x,vx),(H,y,vy)):
        if v>0:times.append((bound-z)//v+1)
        elif v<0:times.append(z//(-v)+1)
    if not times:out.append('NEVER');continue
    t=min(times);X=x+vx*t;Y=y+vy*t;side=''
    for yes,c in ((X<0,'L'),(X>W,'R'),(Y<0,'B'),(Y>H,'T')):
        if yes:side+=c
    out.append(f'{t} {X} {Y} {side}')
print('\n'.join(out))
''',r'''
int main(){int q;cin>>q;while(q--){ll W,H,x,y,vx,vy;cin>>W>>H>>x>>y>>vx>>vy;if(!vx&&!vy){cout<<"NEVER\n";continue;}auto tm=[](ll b,ll z,ll v){return v>0?(b-z)/v+1:v<0?z/(-v)+1:LLONG_MAX;};ll t=min(tm(W,x,vx),tm(H,y,vy)),X=x+vx*t,Y=y+vy*t;string s;if(X<0)s+='L';if(X>W)s+='R';if(Y<0)s+='B';if(Y>H)s+='T';cout<<t<<' '<<X<<' '<<Y<<' '<<s<<'\n';}}
''','easy')

add(719,'trees','逐源樹遍歷與不可逆剪枝',[
'樹的路徑唯一，對每個起點 s 遍歷整棵樹，在狀態保存從 s 到目前頂點的上升數、下降數及權重和。跨邊時比較兩端 a 值，相等邊不增加任一次數。',
'只有終點編號大於起點且兩次數都為1時累計，避免把反向路徑重算。某次數超過1後，繼續延伸只會增加不會減少，因此可剪掉整個分支。每次遍歷用父節點避免走回頭路，不需一般最短路演算法。'],
'時間 O(n²)、空間 O(n)，n≤1700 時最多約289萬次頂點狀態，Python 輸入與顯式堆疊皆 O(n)。路徑總和累加用 64 位元。',
'零差邊允許任意多條；不能把合格路徑誤限成剛好兩條邊。',steps(
('起點1','鏈的值為 0、2、2、0，邊權2、3、5。',['0'],[['升',0],['降',0]]),('經過平台','走到第三點，有一升、零降，累重5。',['0→2→2'],[['升',1],['權重',5]]),('抵達4','再走下降邊，得到一升一降。',['0→2→2→0'],[['合格對數',1],['路徑重',10]])),r'''
import sys
it=iter(map(int,sys.stdin.buffer.read().split()));n=next(it);a=[next(it) for _ in range(n)];g=[[] for _ in range(n)]
for _ in range(n-1):u=next(it)-1;v=next(it)-1;w=next(it);g[u].append((v,w));g[v].append((u,w))
count=total=0
for s in range(n):
    stack=[(s,-1,0,0,0)]
    while stack:
        u,p,up,down,d=stack.pop()
        if u>s and up==down==1:count+=1;total+=d
        for v,w in g[u]:
            if v==p:continue
            x=up+(a[v]>a[u]);y=down+(a[v]<a[u])
            if x<=1 and y<=1:stack.append((v,u,x,y,d+w))
print(count,total)
''',r'''
int main(){int n;cin>>n;vector<ll>a(n);for(auto&v:a)cin>>v;vector<vector<pair<int,ll>>>g(n);for(int i=1,u,v;i<n;i++){ll w;cin>>u>>v>>w;g[--u].push_back({--v,w});g[v].push_back({u,w});}ll count=0,total=0;for(int s=0;s<n;s++){function<void(int,int,int,int,ll)>dfs=[&](int u,int p,int up,int down,ll d){if(u>s&&up==1&&down==1)count++,total+=d;for(auto[v,w]:g[u])if(v!=p){int x=up+(a[v]>a[u]),y=down+(a[v]<a[u]);if(x<=1&&y<=1)dfs(v,u,x,y,d+w);}};dfs(s,-1,0,0,0);}cout<<count<<' '<<total<<'\n';}
''')

add(720,'dp','後序式的真假指派數合併',[
'堆疊元素不存單一布林值，而存 (結果為0的指派數,結果為1的指派數)。常數0是 (1,0)、常數1是 (0,1)，獨立問號為 (1,1)；NOT 交換兩個次數。',
'二元運算時列舉左右結果各0、1的四種組合，把兩個次數的乘積加入真值表對應的結果。後序式的左右子式使用不同問號位置，所以指派可以獨立相乘。最後依零與一的次數是否為零決定分類，無須列舉最多65536種完整指派。'],
'時間 O(N)、空間 O(N)，包含 Python token 輸入和堆疊；問號≤16，總指派≤65536，次數用整數精確保存。',
'兩個問號互相獨立；? ? ^ 的結果不是恆為0。輸出先真次數再假次數。',steps(
('放兩問號','後序式 ? ? ^。',['(1,1)','(1,1)'],[['堆疊數',2]]),('合併 XOR','01、10 得1；00、11 得0。',['0:2','1:2'],[['指派總數',4]]),('輸出分類','真假次數皆非零，分類?。',['2 2 ?'],[['分類','?']])),r'''
import sys
t=sys.stdin.buffer.read().decode().split()[1:];stack=[]
for x in t:
    if x in '01?':stack.append((int(x!='1'),int(x!='0')));continue
    if x=='!':a,b=stack.pop();stack.append((b,a));continue
    b=stack.pop();a=stack.pop();v=[0,0]
    for i in range(2):
        for j in range(2):
            z=(i&j) if x=='&' else (i|j) if x=='|' else (i^j);v[z]+=a[i]*b[j]
    stack.append(v)
zero,one=stack[0];print(one,zero,'0' if not one else '1' if not zero else '?')
''',r'''
int main(){int n;cin>>n;vector<array<ll,2>>st;while(n--){char x;cin>>x;if(x=='0'||x=='1'||x=='?')st.push_back({x!='1',x!='0'});else if(x=='!')swap(st.back()[0],st.back()[1]);else{auto b=st.back();st.pop_back();auto a=st.back();st.pop_back();array<ll,2>v{};for(int i=0;i<2;i++)for(int j=0;j<2;j++){int z=x=='&'?(i&j):x=='|'?(i|j):(i^j);v[z]+=a[i]*b[j];}st.push_back(v);}}auto[z,o]=st[0];cout<<o<<' '<<z<<' '<<(!o?'0':!z?'1':'?')<<'\n';}
''')

add(721,'graphs','多源最小瓶頸洩水高度',[
'把邊界格以自身地高作為起始代價，排水口格以 max(地高,啟動高) 作為代價。多源 Dijkstra 的鬆弛不是距離相加，而是候選 max(目前代價,鄰格地高)，得到每格最小可達出口瓶頸 E。',
'此代價沿路不減，最小 heap 取出的未過期格已不可能經更大的未處理代價改善，故 Dijkstra 的確定性仍成立。各出口同時初始化自然處理同格多口。取得 E 後，逐查詢直接把 max(0,min(R,E)−地高) 加總；查詢彼此獨立，不修改地形或 E。'],
'設 V=hw≤3025，時間 O((V+d) log(V+d)+qV)，q≤300，直接加總至多907500格次；空間 O(V+d+q)，含 Python heap、地形與分詞緩衝。',
'排水口啟動高不是地高的替代，須取兩者最大；不能把上一次查詢的蓄水帶到下一筆。',steps(
('出口入堆','3×3 外圈高度5、中心0，無排水口。',['外圈:E=5','中心:未知'],[['出口格',8]]),('鬆弛中心','經任一外圈到中心的瓶頸為5。',['中心:E=5'],[['中心地高',0]]),('套用上限','R=3 時中心深3；R=9 時中心深5。',['R3:3','R9:5'],[['最大保留量',5]])),r'''
import sys,heapq
it=iter(map(int,sys.stdin.buffer.read().split()));h,w,d,q=[next(it) for _ in range(4)];a=[[next(it) for _ in range(w)] for _ in range(h)];E=[[10**30]*w for _ in range(h)];heap=[]
def seed(r,c,z):
    if z<E[r][c]:E[r][c]=z;heapq.heappush(heap,(z,r,c))
for r in range(h):
    for c in range(w):
        if r in (0,h-1) or c in (0,w-1):seed(r,c,a[r][c])
for _ in range(d):r=next(it)-1;c=next(it)-1;s=next(it);seed(r,c,max(s,a[r][c]))
while heap:
    z,r,c=heapq.heappop(heap)
    if z!=E[r][c]:continue
    for dr,dc in ((1,0),(-1,0),(0,1),(0,-1)):
        x,y=r+dr,c+dc
        if 0<=x<h and 0<=y<w:seed(x,y,max(z,a[x][y]))
for _ in range(q):
    R=next(it);print(sum(max(0,min(R,E[r][c])-a[r][c]) for r in range(h) for c in range(w)))
''',r'''
int main(){int h,w,d,q;cin>>h>>w>>d>>q;vector<vector<ll>>a(h,vector<ll>(w)),E(h,vector<ll>(w,LLONG_MAX));for(auto&row:a)for(ll&x:row)cin>>x;priority_queue<tuple<ll,int,int>,vector<tuple<ll,int,int>>,greater<tuple<ll,int,int>>>heap;auto seed=[&](int r,int c,ll z){if(z<E[r][c]){E[r][c]=z;heap.push({z,r,c});}};for(int r=0;r<h;r++)for(int c=0;c<w;c++)if(!r||r==h-1||!c||c==w-1)seed(r,c,a[r][c]);while(d--){int r,c;ll s;cin>>r>>c>>s;--r;--c;seed(r,c,max(s,a[r][c]));}int dr[]={1,-1,0,0},dc[]={0,0,1,-1};while(!heap.empty()){auto[z,r,c]=heap.top();heap.pop();if(z!=E[r][c])continue;for(int k=0;k<4;k++){int x=r+dr[k],y=c+dc[k];if(x>=0&&x<h&&y>=0&&y<w)seed(x,y,max(z,a[x][y]));}}while(q--){ll R,z=0;cin>>R;for(int r=0;r<h;r++)for(int c=0;c<w;c++)z+=max(0LL,min(R,E[r][c])-a[r][c]);cout<<z<<'\n';}}
''')

add(722,'graphs','分輪事件佇列的配額剝除',[
'先計算每點兩種顏色的活入度，把初始不合格點全部放入第一輪。移除一個點時，只會讓它的出鄰居失去該點顏色的一份支援，因此沿出邊遞減相應入度。',
'每輪先將本輪所有淘汰點標為不活，再遞減支援並收集下輪候選。新不合格者只加入下一輪，且只加入一次；它們在本輪仍提供支援，直到下一輪才沿出邊扣除。由各輪開始的入度不變量，可知這與同步判斷相同，同時累加輪次乘淘汰數。'],
'時間 O(n+m)、空間 O(n+m)，每點入列一次、每邊扣除一次；n≤1500、m≤2000，含 Python 鄰接表、輸入和兩輪列表。',
'不可把剛失格的點立刻當同輪淘汰，否則鏈狀圖的輪數會被壓成1。',steps(
('第一輪','三點鏈1→2→3，皆0色且需一個0色入鄰居。',['1:0','2:1','3:1'],[['淘汰','1']]),('第二輪','1移除後2失去支援；3此輪仍由2支援。',['2:0','3:1'],[['淘汰','2']]),('第三輪','2移除後3失去支援。',['3:0'],[['輪數',3],['輪次和',6]])),r'''
import sys
it=iter(map(int,sys.stdin.buffer.read().split()));n=next(it);m=next(it);a=[(next(it),next(it),next(it)) for _ in range(n)];g=[[] for _ in range(n)];deg=[[0,0] for _ in range(n)]
for _ in range(m):u=next(it)-1;v=next(it)-1;g[u].append(v);deg[v][a[u][0]]+=1
bad=lambda v:deg[v][0]<a[v][1] or deg[v][1]<a[v][2]
cur=[v for v in range(n) if bad(v)];queued=[bad(v) for v in range(n)];alive=[True]*n;rounds=total=0
while cur:
    rounds+=1;total+=rounds*len(cur);nxt=[]
    for u in cur:alive[u]=False
    for u in cur:
        for v in g[u]:
            deg[v][a[u][0]]-=1
            if not queued[v] and bad(v):queued[v]=True;nxt.append(v)
    cur=nxt
print(sum(alive[i] and a[i][0]==0 for i in range(n)),sum(alive[i] and a[i][0]==1 for i in range(n)),rounds,total)
''',r'''
int main(){int n,m;cin>>n>>m;vector<array<int,3>>a(n);for(auto&v:a)cin>>v[0]>>v[1]>>v[2];vector<vector<int>>g(n);vector<array<int,2>>d(n);while(m--){int u,v;cin>>u>>v;--u;--v;g[u].push_back(v);d[v][a[u][0]]++;}auto bad=[&](int v){return d[v][0]<a[v][1]||d[v][1]<a[v][2];};vector<int>cur,queued(n),alive(n,1);for(int i=0;i<n;i++)if(bad(i))cur.push_back(i),queued[i]=1;ll total=0;int rounds=0;while(!cur.empty()){rounds++;total+=(ll)rounds*cur.size();vector<int>nxt;for(int u:cur)alive[u]=0;for(int u:cur)for(int v:g[u]){d[v][a[u][0]]--;if(!queued[v]&&bad(v))queued[v]=1,nxt.push_back(v);}cur=move(nxt);}int x=0,y=0;for(int i=0;i<n;i++)if(alive[i])(a[i][0]?y:x)++;cout<<x<<' '<<y<<' '<<rounds<<' '<<total<<'\n';}
''')

add(723,'graphs','瓶頸二分與最少切色路徑',[
'固定瓶頸下限 B，只保留容量≥B 的邊；拆狀態為 (頂點,上一條邊色)。走同色邊代價0、異色邊代價1。起點兩種色狀態都設0，等價於第一條邊免費選色。',
'以最短路求到終點的最小切色數，若≤K 就可行。提高 B 只會刪邊，不會新增可行行走，因此在排序去重的容量上二分最大可行值，再計該值的最少切色數。n≥2 保證從1到n一定走過邊，避免把零邊路徑當作合法瓶頸。'],
'此處 heap Dijkstra 每次 O((n+m) log(n+m))，二分 O(log m) 次；空間 O(n+m)，含 Python 分詞、鄰接表與heap；n≤1000、m≤2000。',
'最佳瓶頸下仍要取最少切色，不能輸出首次找到路徑的切色數。',steps(
('測高瓶頸','1→2容量9色0，2→3容量8色1，另1→3容量6色0。',['B=8'],[['最少切色',1]]),('限制K=0','B=8不可行，直接邊容量6可以。',['B=6'],[['最少切色',0]]),('最大化','容量6以上沒有零切色路。',['6 0'],[['答案瓶頸',6]])),r'''
import sys,heapq
it=iter(map(int,sys.stdin.buffer.read().split()));n=next(it);m=next(it);K=next(it);g=[[] for _ in range(n)];caps=[]
for _ in range(m):u=next(it)-1;v=next(it)-1;w=next(it);c=next(it);g[u].append((v,w,c));caps.append(w)
def cost(B):
    d=[[10**9]*2 for _ in range(n)];d[0]=[0,0];h=[(0,0,0),(0,0,1)]
    while h:
        z,u,c=heapq.heappop(h)
        if z!=d[u][c]:continue
        for v,w,k in g[u]:
            nz=z+(c!=k)
            if w>=B and nz<d[v][k]:d[v][k]=nz;heapq.heappush(h,(nz,v,k))
    return min(d[-1])
caps=sorted(set(caps));lo=-1;hi=len(caps)
while hi-lo>1:
    mid=(lo+hi)//2
    if cost(caps[mid])<=K:lo=mid
    else:hi=mid
print('-1 -1' if lo<0 else f'{caps[lo]} {cost(caps[lo])}')
''',r'''
int main(){int n,m,K;cin>>n>>m>>K;vector<vector<tuple<int,int,int>>>g(n);vector<int>w;while(m--){int u,v,x,c;cin>>u>>v>>x>>c;g[u-1].push_back({v-1,x,c});w.push_back(x);}auto cost=[&](int B){vector<array<int,2>>d(n,{1000000000,1000000000});d[0]={0,0};priority_queue<tuple<int,int,int>,vector<tuple<int,int,int>>,greater<tuple<int,int,int>>>h;h.push({0,0,0});h.push({0,0,1});while(!h.empty()){auto[z,u,c]=h.top();h.pop();if(z!=d[u][c])continue;for(auto[v,x,k]:g[u]){int nz=z+(c!=k);if(x>=B&&nz<d[v][k])d[v][k]=nz,h.push({nz,v,k});}}return min(d[n-1][0],d[n-1][1]);};sort(w.begin(),w.end());w.erase(unique(w.begin(),w.end()),w.end());int l=-1,r=w.size();while(r-l>1){int mid=(l+r)/2;if(cost(w[mid])<=K)l=mid;else r=mid;}if(l<0)cout<<"-1 -1\n";else cout<<w[l]<<' '<<cost(w[l])<<'\n';}
''','hard')

add(724,'data-structures','固定上下框的欄前綴等式',[
'固定相距至少2的上下列。每欄令 T 是上下兩格和、M 是中間格和、F=M+T、D=M−T。矩形左右欄 l、r 的完整欄屬於框，內部欄則中間減上下；框腹相等恰為 ΣD[l+1..r−1]=F[l]+F[r]。',
'令 P 為 D 的前綴和，此式可寫成 P[r]−F[r]=P[l+1]+F[l]。掃描 r，以雜湊表保存 l≤r−2 的右式頻率，即可一次算出全部寬度至少3的框。垂直前綴讓 M 在 O(1) 取得，四角各只在左右完整欄中計一次。'],
'期望時間 O(H²W)、空間 O(HW+W)，H,W≤120；C++ map 版多一個 log W 因子。Python 地形、垂直前綴及輸入 O(HW)，答案用 64 位元。',
'不能把角落在上框與左框各加一次；全零矩形也符合。',steps(
('固定三列','3×3 格外框皆1、中心8。',['T:2,2,2','M:1,8,1'],[['高度',3]]),('轉成欄式','D:−1,6,−1，F:3,10,3，左右欄取0、2。',['內欄D=6','左右F=3+3'],[['兩側差',0]]),('累計','唯一寬度3矩形的框與腹皆8。',['框8','腹8'],[['答案',1]])),r'''
import sys
from collections import defaultdict
f=sys.stdin.buffer;H,W=map(int,f.readline().split());a=[[c-48 for c in f.readline().strip()] for _ in range(H)];V=[[0]*W]
for row in a:V.append([x+y for x,y in zip(V[-1],row)])
ans=0
for top in range(H-2):
    for bot in range(top+2,H):
        F=[];P=[0]
        for c in range(W):
            t=a[top][c]+a[bot][c];m=V[bot][c]-V[top+1][c];F.append(m+t);P.append(P[-1]+m-t)
        freq=defaultdict(int)
        for r in range(2,W):
            l=r-2;freq[P[l+1]+F[l]]+=1;ans+=freq[P[r]-F[r]]
print(ans)
''',r'''
int main(){int H,W;cin>>H>>W;vector<string>a(H);for(auto&s:a)cin>>s;vector<vector<int>>V(H+1,vector<int>(W));for(int r=0;r<H;r++)for(int c=0;c<W;c++)V[r+1][c]=V[r][c]+a[r][c]-'0';ll ans=0;for(int t=0;t+2<H;t++)for(int b=t+2;b<H;b++){vector<int>F(W),P(W+1);for(int c=0;c<W;c++){int x=a[t][c]+a[b][c]-2*'0',m=V[b][c]-V[t+1][c];F[c]=m+x;P[c+1]=P[c]+m-x;}map<int,int>f;for(int r=2;r<W;r++){int l=r-2;f[P[l+1]+F[l]]++;ans+=f[P[r]-F[r]];}}cout<<ans<<'\n';}
''','hard')

add(725,'trees','父編號拓樸序的反向子樹合併',[
'輸入保證父節點編號小於子節點，所以由 N 到1逆序處理時，每個節點的所有後代資料都已合併完成。初始子樹大小1、和為自身值、顏色集合含自身色。',
'檢查目前節點的顏色集合大小是否 K 且和可被大小整除，成立就累計三種答案，再把大小、和與顏色集合併入父節點。由後代完成的不變量，每次檢查都是整棵子樹；負總和用整除判斷，不需浮點平均。'],
'Python 雜湊集合直接合併的期望時間 O(N²)；C++ 有序 set 的保守上界 O(N² log(N+1))。兩者空間 O(N²)，含保留的各子樹顏色集合及 Python 輸入緩衝。N≤120，平均與總和使用64位元。',
'K=0 時非空子樹不可能符合；子樹重疊仍分別累計大小。',steps(
('葉節點','根值2色0，唯一子值−2色1，K=2。',['子:大小1,和−2,色{1}'],[['合格數',0]]),('併入根','根子樹大小2、和0、兩種色。',['根:大小2,和0,色{0,1}'],[['平均',0]]),('累計根','只有根符合。',['1 2 0'],[['合格數',1],['大小和',2]])),r'''
import sys
it=iter(map(int,sys.stdin.buffer.read().split()));n=next(it);K=next(it);p=[];s=[];colors=[]
for _ in range(n):p.append(next(it)-1);s.append(next(it));colors.append({next(it)})
size=[1]*n;count=total=means=0
for u in range(n-1,-1,-1):
    if len(colors[u])==K and s[u]%size[u]==0:count+=1;total+=size[u];means+=s[u]//size[u]
    if p[u]>=0:v=p[u];size[v]+=size[u];s[v]+=s[u];colors[v].update(colors[u])
print(count,total,means)
''',r'''
int main(){int n,K;cin>>n>>K;vector<int>p(n),sz(n,1);vector<ll>s(n);vector<set<int>>c(n);for(int i=0,x;i<n;i++){cin>>p[i]>>s[i]>>x;--p[i];c[i].insert(x);}ll count=0,total=0,means=0;for(int u=n-1;u>=0;u--){if(c[u].size()==(size_t)K&&s[u]%sz[u]==0)count++,total+=sz[u],means+=s[u]/sz[u];int v=p[u];if(v>=0){sz[v]+=sz[u];s[v]+=s[u];c[v].insert(c[u].begin(),c[u].end());}}cout<<count<<' '<<total<<' '<<means<<'\n';}
''','easy')

add(726,'dp','列遮罩與剩餘欄配額的記憶化搜尋',[
'每列只枚舉恰有指定數量1的位元遮罩。狀態為列索引、前列遮罩、各欄剩餘配額；若前後列共同為1的欄含相鄰兩位，就形成禁止的滿2×2，排除此轉移。配額不得負，也不能大於剩餘列數。',
'每個狀態回傳合法後綴矩陣數及所有後綴權重和。若某列權重是 v、後綴回傳 (c,s)，此分支貢獻 (c,s+c×v)。終點只有所有配額為0才有一個空完成。按列字串由小到大重建，第一個具有非零完成數的選擇即為字典序最小矩陣。'],
'H,W≤6；每列候選至多 C(6,3)=20。令 S 為實際可達的記憶化狀態數：Python 雜湊版期望時間 O(S×2^W×W)，C++ 有序 map 版上界 O(S×2^W×W×log(S+1))，包含最壞 O(W) 的向量鍵比較。空間 O(SW+H×2^W)，含狀態鍵及各列候選。S≤(H+1)×2^W×(H+1)^W；不合併狀態時完整列配置至多20^H種。Python 輸入 O(HW)。',
'要求的是全部矩陣的權重總和，不是最大權重。最高位對應最左欄才能依數值順序重建字典序。',steps(
('設定配額','2×2，列欄配額全1，權重全1。',['r:1,1','c:1,1'],[['首列候選','01,10']]),('分支完成','01接10、10接01，兩個矩陣均無滿塊。',['01/10','10/01'],[['矩陣數',2]]),('累計重建','每個權重2，總和4，字典序取01/10。',['01','10'],[['總權重',4]])),r'''
import sys
from functools import lru_cache
it=iter(map(int,sys.stdin.buffer.read().split()));H=next(it);W=next(it);rows=[next(it) for _ in range(H)];cols=tuple(next(it) for _ in range(W));weights=[[next(it) for _ in range(W)] for _ in range(H)]
bits={m:tuple((m>>(W-1-j))&1 for j in range(W)) for m in range(1<<W)}
choices=[[m for m in bits if m.bit_count()==rows[i]] for i in range(H)]
values=[{m:sum(weights[i][j]*bits[m][j] for j in range(W)) for m in choices[i]} for i in range(H)]
@lru_cache(None)
def dp(i,prev,rem):
    if i==H:return (int(not any(rem)),0)
    count=total=0
    for m in choices[i]:
        common=m&prev
        if common&(common>>1):continue
        r=tuple(rem[j]-bits[m][j] for j in range(W))
        if any(x<0 or x>H-i-1 for x in r):continue
        c,s=dp(i+1,m,r);count+=c;total+=s+c*values[i][m]
    return count,total
c,s=dp(0,0,cols);print(c,s)
if not c:print('-')
else:
    prev=0;rem=cols
    for i in range(H):
        for m in choices[i]:
            common=m&prev;r=tuple(rem[j]-bits[m][j] for j in range(W))
            if common&(common>>1) or any(x<0 or x>H-i-1 for x in r):continue
            if dp(i+1,m,r)[0]:print(format(m,f'0{W}b'));prev=m;rem=r;break
''',r'''
int H,W;vector<int>r;vector<vector<ll>>w;map<tuple<int,int,vector<int>>,pair<ll,ll>>memo;
pair<ll,ll>dp(int i,int prev,vector<int>rem){if(i==H){for(int x:rem)if(x)return {0,0};return {1,0};}auto key=make_tuple(i,prev,rem);if(memo.count(key))return memo[key];ll count=0,total=0;for(int m=0;m<(1<<W);m++)if(__builtin_popcount((unsigned)m)==r[i]){int z=m&prev;if(z&(z>>1))continue;auto nr=rem;ll v=0;bool ok=true;for(int j=0;j<W;j++){int b=m>>(W-1-j)&1;nr[j]-=b;v+=w[i][j]*b;if(nr[j]<0||nr[j]>H-i-1)ok=false;}if(ok){auto[c,s]=dp(i+1,m,nr);count+=c;total+=s+c*v;}}return memo[key]={count,total};}
int main(){cin>>H>>W;r.resize(H);for(int&x:r)cin>>x;vector<int>rem(W);for(int&x:rem)cin>>x;w.assign(H,vector<ll>(W));for(auto&row:w)for(auto&x:row)cin>>x;auto[c,s]=dp(0,0,rem);cout<<c<<' '<<s<<'\n';if(!c){cout<<"-\n";return 0;}int prev=0;for(int i=0;i<H;i++)for(int m=0;m<(1<<W);m++)if(__builtin_popcount((unsigned)m)==r[i]){int z=m&prev;if(z&(z>>1))continue;auto nr=rem;bool ok=true;for(int j=0;j<W;j++){nr[j]-=m>>(W-1-j)&1;if(nr[j]<0||nr[j]>H-i-1)ok=false;}if(ok&&dp(i+1,m,nr).first){for(int j=0;j<W;j++)cout<<(m>>(W-1-j)&1);cout<<'\n';rem=nr;prev=m;break;}}}
''','hard')

add(727,'strings','交換校驗差量與結果集合去重',[
'先算原始 A=Σi×dᵢ、B=Σi²×dᵢ。交換 i、j 後，差量分別為 (i−j)(dⱼ−dᵢ)、(i²−j²)(dⱼ−dᵢ)，只要常數時間就能檢查兩個餘數。',
'枚舉所有 i<j，僅對符合校驗的交換建立結果字串並放入集合。相同數字交換可能多次得到原字串，集合會只留一份；其他重複結果也自然去重。最後集合大小是答案，最小字串按原始長度比較，保留前導零。'],
'Python 雜湊結果集合版期望時間 O(n³)，C++ 有序 set<string> 版最壞 O(n³ log(n+1))，包含長度 O(n) 的字串比較。空間 O(n³)；n≤100 時至多4950個長100字串，Python 輸入 O(n)。校驗含 i²，使用64位元。',
'必須交換兩個不同位置；n=1 不可把未交換的原字串算成答案。',steps(
('原始校驗','S=00，兩模數都1、目標0。',['00'],[['A',0],['B',0]]),('唯一交換','交換位置1、2，結果仍00。',['00→00'],[['合法位置對',1]]),('集合去重','有一次合法交換產生00，因此保留。',['00'],[['不同結果數',1]])),r'''
import sys
t=sys.stdin.buffer.read().decode().split();n=int(t[0]);s=t[1];m1,r1,m2,r2=map(int,t[2:]);a=list(map(int,s));A=sum((i+1)*x for i,x in enumerate(a));B=sum((i+1)**2*x for i,x in enumerate(a));out=set()
for i in range(n):
    for j in range(i+1,n):
        v=a[j]-a[i]
        if (A+(i-j)*v)%m1==r1 and (B+((i+1)**2-(j+1)**2)*v)%m2==r2:
            z=list(s);z[i],z[j]=z[j],z[i];out.add(''.join(z))
print(len(out));print(min(out) if out else '-')
''',r'''
int main(){int n;string s;ll m1,r1,m2,r2;cin>>n>>s>>m1>>r1>>m2>>r2;ll A=0,B=0;for(int i=0;i<n;i++)A+=(i+1)*(s[i]-'0'),B+=(ll)(i+1)*(i+1)*(s[i]-'0');auto mod=[](ll x,ll m){return (x%m+m)%m;};set<string>out;for(int i=0;i<n;i++)for(int j=i+1;j<n;j++){ll v=s[j]-s[i];if(mod(A+(i-j)*v,m1)==r1&&mod(B+((ll)(i+1)*(i+1)-(ll)(j+1)*(j+1))*v,m2)==r2){string z=s;swap(z[i],z[j]);out.insert(z);}}cout<<out.size()<<'\n'<<(out.empty()?"-":*out.begin())<<'\n';}
''')

add(728,'basics','整數相遇方程的整除判定',[
'每對標記解 (vᵢ−vⱼ)t=xⱼ−xᵢ。速度不同時，必須恰可整除且所得整數 t 位於 [0,T] 才合格；不使用浮點數近似判斷整秒。',
'速度相同時只有起點也相同才會相遇，最早時間固定0。對所有 i<j 各檢查一次，便涵蓋所有無序標記對；即使多個標記在同地相遇，也依標記對分開計數，這與連續事件題不同。'],
'時間 O(n²)、空間 O(n)，n≤3000 時最多4498500對；Python 元組列表與分詞輸入 O(n)。時刻和可達約4.5×10¹⁵，採64位元。',
'不能把非整數時刻相遇算進去；同位置同速度也只算一對、時間為0。',steps(
('解第一對','兩標記 (0,1)、(2,−1)，T=2。',['2t=2'],[['候選t',1]]),('檢查整秒','1在[0,2]且為整數。',['t=1'],[['合格對',1]]),('加總','這一對第一次相遇即為1。',['1 1'],[['時間和',1]])),r'''
import sys
it=iter(map(int,sys.stdin.buffer.read().split()));n=next(it);T=next(it);a=[(next(it),next(it)) for _ in range(n)];count=total=0
for i,(x,v) in enumerate(a):
    for j in range(i):
        y,w=a[j];dx=y-x;dv=v-w
        if not dv:
            if not dx:count+=1
        elif dx%dv==0 and 0<=dx//dv<=T:count+=1;total+=dx//dv
print(count,total)
''',r'''
int main(){int n;ll T;cin>>n>>T;vector<pair<ll,ll>>a(n);for(auto&[x,v]:a)cin>>x>>v;ll count=0,total=0;for(int i=0;i<n;i++)for(int j=0;j<i;j++){ll dx=a[j].first-a[i].first,dv=a[i].second-a[j].second;if(!dv){if(!dx)count++;}else if(dx%dv==0&&dx/dv>=0&&dx/dv<=T)count++,total+=dx/dv;}cout<<count<<' '<<total<<'\n';}
''','easy')

add(729,'dp','兩堆與上一堆的有限賽局',[
'狀態 (a,b,p) 記兩堆剩餘石數與上一手堆 p，p=2 表示首步。若兩堆皆非空，排除 p 所在堆；只剩一堆時解除限制。枚舉可取量，存在一個後繼敗局即為勝局。',
'每次至少減少一顆石子，因此遞迴依 a+b 嚴格下降，不會形成循環。以記憶化保存勝負，兩堆全空為敗。初始局另外列舉所有送入敗局的首步，得到必勝步數；先枚舉A再B、同堆由小到大，第一個就是字典序最小。'],
'時間 O(ABK)、空間 O(AB+A+B)，A,B,K≤70；Python 記憶化狀態至多3×71²，遞迴深度≤140，輸入為常數。',
'限制只在兩堆都非空時適用；清空一堆後下一手可以繼續取另一堆。',steps(
('列首步','A=1、B=0、K=2，只能取A的1顆。',['A1'],[['首步候選',1]]),('後繼敗局','取完後兩堆全空，對手無步。',['0,0'],[['對手','LOSE']]),('輸出','唯一必勝首步為A1。',['WIN 1 A 1'],[['必勝步數',1]])),r'''
import sys
from functools import lru_cache
A,B,K=map(int,sys.stdin.buffer.read().split())
def moves(a,b,p):
    for c,z in enumerate((a,b)):
        if a and b and c==p:continue
        for x in range(1,min(K,z)+1):yield c,x,(a-x if c==0 else a),(b-x if c==1 else b)
@lru_cache(None)
def win(a,b,p):return any(not win(x,y,c) for c,k,x,y in moves(a,b,p))
good=[(c,k) for c,k,x,y in moves(A,B,2) if not win(x,y,c)]
print(f'WIN {len(good)} {"AB"[good[0][0]]} {good[0][1]}' if good else 'LOSE 0 - 0')
''',r'''
int K,memo[71][71][3];bool win(int a,int b,int p){int&z=memo[a][b][p];if(z!=-1)return z;z=0;for(int c=0;c<2;c++){if(a&&b&&p==c)continue;int n=c?b:a;for(int k=1;k<=K&&k<=n;k++)if(!win(a-(c==0?k:0),b-(c==1?k:0),c))return z=1;}return z;}
int main(){int A,B;cin>>A>>B>>K;memset(memo,-1,sizeof memo);vector<pair<int,int>>good;for(int c=0;c<2;c++)for(int k=1;k<=K&&k<=(c?B:A);k++)if(!win(A-(c==0?k:0),B-(c==1?k:0),c))good.push_back({c,k});if(good.empty())cout<<"LOSE 0 - 0\n";else cout<<"WIN "<<good.size()<<' '<<"AB"[good[0].first]<<' '<<good[0].second<<'\n';}
''')

add(730,'strings','平衡差與索引餘數的聯合前綴',[
'把 a 視為+1、b為−1、c為0，前綴差相等就代表兩前綴之間 a、b 數相同。片段長度是右前綴索引 j 減左前綴索引 i，故還要 i mod k=(j−r) mod k。',
'以 (前綴差,索引餘數) 為頻率鍵，先放入空前綴 (0,0)。讀完第 j 個字元後查詢目標鍵，再插入本前綴，因此配對的 i 必小於 j，零長片段不會混入。全為 c 的片段也被正確保留。'],
'期望時間 O(n)、空間 O(n)，n≤200000；C++ map 版 O(n log n)。含 Python 雜湊鍵、輸入字串，答案使用64位元。',
'r 非零時查的是 j−r，不是 j+r；Python 與 C++ 都要將負餘數正規化。',steps(
('空前綴','s=ab、k=2、r=0，先記(0,0)。',['(0,0):1'],[['答案',0]]),('讀a','差為1、索引餘1，尚無同鍵前綴。',['(1,1)'],[['答案',0]]),('讀b','差回0、索引餘0，與空前綴配對。',['ab'],[['答案',1]])),r'''
import sys
from collections import defaultdict
n,k,r=map(int,sys.stdin.buffer.readline().split());s=sys.stdin.buffer.readline().strip();freq=defaultdict(int);freq[(0,0)]=1;bal=ans=0
for j,c in enumerate(s,1):bal+=(c==97)-(c==98);ans+=freq[(bal,(j-r)%k)];freq[(bal,j%k)]+=1
print(ans)
''',r'''
int main(){int n,k,r;string s;cin>>n>>k>>r>>s;map<pair<int,int>,ll>f;f[{0,0}]=1;ll ans=0;int b=0;for(int j=1;j<=n;j++){b+=(s[j-1]=='a')-(s[j-1]=='b');ans+=f[{b,((j-r)%k+k)%k}];f[{b,j%k}]++;}cout<<ans<<'\n';}
''')

add(731,'simulation','LRU 時戳與黏著髒位元',[
'對快取內每頁保存最後存取時戳及髒旗標。命中時只更新時戳，寫入再把髒位設真；讀取不得清除已存在的髒位。未命中且已滿時，移除時戳最小頁，只有其為髒頁才加一次回寫。',
'新載入的頁先為乾淨，再依本次是否寫入更新。每個操作結束後，時戳恰好反映該頁最後被操作的順序，所以取最小值完全等價於LRU。結束後只統計尚存髒頁，不沖刷快取。容量最多50，直接掃描淘汰者已足夠。'],
'時間 O(MC)、空間 O(C+M)，C≤50、M≤150，最壞7500次頁比較；Python 分詞輸入 O(M)，快取 O(C)。',
'讀取髒頁不會變乾淨，結束時也不額外回寫。',steps(
('寫頁1','C=1，W 1 未命中並留下髒頁。',['1:髒'],[['未命中',1]]),('讀頁1','R 1 命中，仍為髒。',['1:髒'],[['命中',1]]),('載入頁2','R 2 淘汰髒頁1，頁2乾淨。',['2:淨'],[['回寫',1],['最後髒頁',0]])),r'''
import sys
it=iter(sys.stdin.buffer.read().split());C=int(next(it));M=int(next(it));cache={};hit=miss=back=0
for t in range(M):
    op=next(it);x=int(next(it))
    if x in cache:hit+=1
    else:
        miss+=1
        if len(cache)==C:
            old=min(cache,key=lambda k:cache[k][0]);back+=cache[old][1];del cache[old]
        cache[x]=(t,False)
    cache[x]=(t,cache[x][1] or op==b'W')
print(hit,miss,back,sum(v[1] for v in cache.values()))
''',r'''
int main(){int C,M;cin>>C>>M;map<ll,pair<int,bool>>cache;int hit=0,miss=0,back=0;for(int t=0;t<M;t++){char op;ll x;cin>>op>>x;if(cache.count(x))hit++;else{miss++;if(cache.size()==(size_t)C){auto it=min_element(cache.begin(),cache.end(),[](auto&a,auto&b){return a.second.first<b.second.first;});back+=it->second.second;cache.erase(it);}cache[x]={t,false};}cache[x]={t,cache[x].second||op=='W'};}int dirty=0;for(auto[x,v]:cache)dirty+=v.second;cout<<hit<<' '<<miss<<' '<<back<<' '<<dirty<<'\n';}
''','easy')

add(732,'number-theory','2520 週期的整段與尾段計數',[
'所有機器週期都整除2520，所以整體響鈴模式也以2520為週期。只須檢查代表時刻 t=1..2520，數出響鈴機器是否至少K，保留符合的代表位置。',
'把 T 分成完整週期數與尾段長度，每個完整週期各貢獻合格代表數，尾段只算代表≤餘長者。若合格代表最小值≤T，它就是最早時刻；代表2520對應餘數0，但時間0不計，不能以0作為答案。相同機器仍逐台累計。'],
'時間 O(2520N)、空間 O(2520+N)，N≤12，Python 分詞輸入 O(N)。T≤10¹⁸，總數用64位元。',
'枚舉0..2519後若把0當最早時刻會錯；T=0一定輸出0 −1。',steps(
('列小週期','兩台週期2餘0、2餘1，K=1。',['奇秒:1台','偶秒:1台'],[['週期合格數',2520]]),('切分T','T=3，完整週期0，尾長3。',['1','2','3'],[['尾段合格',3]]),('最早代表','第一秒就有一台響。',['3 1'],[['最早',1]])),r'''
import sys
it=iter(map(int,sys.stdin.buffer.read().split()));N=next(it);K=next(it);T=next(it);a=[(next(it),next(it)) for _ in range(N)];good=[t for t in range(1,2521) if sum(t%p==r for p,r in a)>=K];count=(T//2520)*len(good)+sum(t<=T%2520 for t in good);print(count,good[0] if good and good[0]<=T else -1)
''',r'''
int main(){int N,K;ll T;cin>>N>>K>>T;vector<pair<int,int>>a(N);for(auto&[p,r]:a)cin>>p>>r;vector<int>good;for(int t=1;t<=2520;t++){int c=0;for(auto[p,r]:a)c+=t%p==r;if(c>=K)good.push_back(t);}ll count=T/2520*good.size();for(int t:good)count+=t<=T%2520;cout<<count<<' '<<(!good.empty()&&good[0]<=T?good[0]:-1)<<'\n';}
''','easy')

add(733,'search','完整四位密碼空間與多重集交集',[
'四位數字字串只有10000種，可依0000到9999逐一檢查。每筆提示的A直接比較四個位置；共同數字總量用 Σmin(密碼次數[d],猜測次數[d])，再減A就是B。',
'多重集交集的最小次數保證同一位置不會配多次，先扣掉同位置配對後的剩餘可配數恰是B。候選必須通過全部提示，矛盾提示會自然得到0個；無提示時全部保留。列舉順序已是字典序，第一個通過者就是最小密碼。'],
'時間 O(10000×M×10)、額外空間 O(M)，M≤50，最多約500萬次數字頻率比較，含 Python 提示與分詞輸入。',
'不能以集合判B，重複數字要用頻率；輸出必須補足四位。',steps(
('提示設定','猜測0000，A=4、B=0。',['0000 4 0'],[['提示數',1]]),('檢查候選','0000同位置相同4個，符合；任何其他字串A小於4。',['候選0000'],[['符合數',1]]),('輸出最小','只有0000。',['1 0000'],[['最小密碼','0000']])),r'''
import sys
it=iter(sys.stdin.buffer.read().decode().split());M=int(next(it));h=[]
for _ in range(M):g=next(it);A=int(next(it));B=int(next(it));h.append((g,A,B,[g.count(str(d)) for d in range(10)]))
count=0;best='-1'
for x in range(10000):
    s=f'{x:04d}';f=[s.count(str(d)) for d in range(10)];ok=True
    for g,A,B,fg in h:
        a=sum(x==y for x,y in zip(s,g))
        if a!=A or sum(min(x,y) for x,y in zip(f,fg))-a!=B:ok=False;break
    if ok:
        if not count:best=s
        count+=1
print(count,best)
''',r'''
int main(){int M;cin>>M;struct H{string g;int A,B;array<int,10>f{};};vector<H>h(M);for(auto&v:h){cin>>v.g>>v.A>>v.B;for(char c:v.g)v.f[c-'0']++;}int count=0;string best="-1";for(int x=0;x<10000;x++){string s=to_string(x);s=string(4-s.size(),'0')+s;array<int,10>f{};for(char c:s)f[c-'0']++;bool ok=true;for(auto&v:h){int a=0,b=0;for(int i=0;i<4;i++)a+=s[i]==v.g[i];for(int d=0;d<10;d++)b+=min(f[d],v.f[d]);if(a!=v.A||b-a!=v.B){ok=false;break;}}if(ok){if(!count)best=s;count++;}}cout<<count<<' '<<best<<'\n';}
''')

add(734,'geometry','邊界優先的精確繞行數',[
'依題目定義逐邊檢查。先用叉積為0及兩軸包圍盒判點在線段上，含零長邊；只要任何邊符合立即回傳B，不能由繞行數0推論非邊界。',
'非邊界時，向上跨過查詢高度且叉積正就加1，向下跨過且叉積負就減1，使用半開高度範圍避免頂點雙算。每筆查詢另建刪去指定頂點的序列並完整重算，保留閉合邊；n=3時兩點的正反向邊仍都走訪，因此邊界判斷也正確。'],
'時間 O(nq)、空間 O(n+q)，n,q≤800，每查詢兩次掃描至多1600條邊。Python 整數精確；C++ 用 __int128 叉積避免大座標相乘風險。',
'自交折線的結果可以負數或超過1；不是一般單純多邊形的布林內外判斷。',steps(
('原三角形','頂點(0,0)、(4,0)、(0,4)，P=(1,1)。',['向上斜邊:+1'],[['原繞行數',1]]),('刪頂點3','剩(0,0)、(4,0)，正反邊都在y=0。',['P不在線段'],[['新繞行數',0]]),('組合結果','兩條折線各自判斷。',['1 0'],[['輸出','1 0']])),r'''
import sys
it=iter(map(int,sys.stdin.buffer.read().split()));n=next(it);q=next(it);v=[(next(it),next(it)) for _ in range(n)]
def calc(poly,x,y):
    winding=0
    for i,(ax,ay) in enumerate(poly):
        bx,by=poly[(i+1)%len(poly)];c=(bx-ax)*(y-ay)-(by-ay)*(x-ax)
        if c==0 and min(ax,bx)<=x<=max(ax,bx) and min(ay,by)<=y<=max(ay,by):return 'B'
        if ay<=y<by and c>0:winding+=1
        elif by<=y<ay and c<0:winding-=1
    return str(winding)
for _ in range(q):x=next(it);y=next(it);k=next(it)-1;print(calc(v,x,y),calc(v[:k]+v[k+1:],x,y))
''',r'''
using P=pair<ll,ll>;string calc(const vector<P>&v,ll x,ll y){int z=0;for(int i=0;i<(int)v.size();i++){auto[ax,ay]=v[i];auto[bx,by]=v[(i+1)%v.size()];__int128 c=(__int128)(bx-ax)*(y-ay)-(__int128)(by-ay)*(x-ax);if(c==0&&min(ax,bx)<=x&&x<=max(ax,bx)&&min(ay,by)<=y&&y<=max(ay,by))return "B";if(ay<=y&&y<by&&c>0)z++;else if(by<=y&&y<ay&&c<0)z--;}return to_string(z);}
int main(){int n,q;cin>>n>>q;vector<P>v(n);for(auto&[x,y]:v)cin>>x>>y;while(q--){ll x,y;int k;cin>>x>>y>>k;auto b=v;b.erase(b.begin()+k-1);cout<<calc(v,x,y)<<' '<<calc(b,x,y)<<'\n';}}
''')

add(735,'graphs','共用開關遮罩的逐狀態 BFS',[
'枚舉全部 2^k 個開關遮罩；邊標籤0永遠可用，標籤c>0當且僅當遮罩第c−1位為1。對每個遮罩在同一份鄰接表執行 BFS，首次抵達終點即得到最少邊數。',
'BFS 的佇列按距離不減處理，同一頂點只入列一次，所以重邊、自環不會改變最短距離或把狀態重複計數。能到達才把狀態數加1並加距離；即使某開關完全沒有邊，也必須枚舉它的兩種設定，因為題目區分完整狀態。'],
'時間 O(2^k(n+m))、空間 O(n+m)，k≤15、m≤1500，最多約4915萬次邊檢查；Python 輸入、鄰接表 O(n+m)，每次 BFS 空間 O(n)。',
'標籤相同的邊共用一個開關；不可把邊各自當成獨立位元，也不可統計路徑條數。',steps(
('固定圖','1→2為常開，k=1但開關未控制任何邊。',['狀態0','狀態1'],[['完整狀態數',2]]),('關狀態 BFS','遮罩0仍可沿常開邊抵達。',['距離1'],[['可達數',1]]),('開狀態 BFS','遮罩1也抵達，另算一個狀態。',['2 2'],[['距離和',2]])),r'''
import sys
from collections import deque
it=iter(map(int,sys.stdin.buffer.read().split()));n=next(it);m=next(it);k=next(it);g=[[] for _ in range(n)]
for _ in range(m):u=next(it)-1;v=next(it)-1;c=next(it);g[u].append((v,0 if c==0 else 1<<(c-1)))
count=total=0
for mask in range(1<<k):
    d=[-1]*n;d[0]=0;q=deque([0])
    while q and d[-1]<0:
        u=q.popleft()
        for v,bit in g[u]:
            if d[v]<0 and (bit==0 or mask&bit):d[v]=d[u]+1;q.append(v)
    if d[-1]>=0:count+=1;total+=d[-1]
print(count,total)
''',r'''
int main(){int n,m,k;cin>>n>>m>>k;vector<vector<pair<int,int>>>g(n);while(m--){int u,v,c;cin>>u>>v>>c;g[u-1].push_back({v-1,c?1<<(c-1):0});}ll count=0,total=0;for(int mask=0;mask<(1<<k);mask++){vector<int>d(n,-1);queue<int>q;d[0]=0;q.push(0);while(!q.empty()&&d[n-1]<0){int u=q.front();q.pop();for(auto[v,b]:g[u])if(d[v]<0&&(!b||(mask&b))){d[v]=d[u]+1;q.push(v);}}if(d[n-1]>=0)count++,total+=d[n-1];}cout<<count<<' '<<total<<'\n';}
''')

add(736,'number-theory','非互質 CRT 與封鎖區間補集',[
'逐條合併 x≡a (mod M) 與 x≡r (mod m)。令 g=gcd(M,m)，若 r−a 不能被 g 整除便無解；否則解 (M/g)t≡(r−a)/g (mod m/g)，更新 a 為 a+Mt 並對新最小公倍數取非負餘數。',
'將封鎖區間裁到 [L,R] 後排序合併，再對剩餘互斥允許區間計算等差數列 a+jM 的落點數。每區間先用整數向上取整找首個落點，再以公差M計數；第一個有解區間的首點即全域最小。這避免列舉可達10¹⁸的整數範圍，也避免重疊封鎖重複扣除。'],
'時間 O(n log max m+b log b)、空間 O(n+b)，包含 Python 分詞及區間列表。合併模數最多10³⁰，Python大整數、C++ __int128 保存；最終個數≤10¹⁸+1。',
'CRT 模數不互質，不能直接套互質公式；負 r 要正規化，閉區間封鎖端點都要排除。',steps(
('合併同餘','x≡2 mod6、x≡5 mod9，得到x≡14 mod18。',['14','32','50'],[['範圍','0..50']]),('排除封鎖','封鎖[13,15]與[49,50]，刪14和50。',['32'],[['剩餘數',1]]),('選最小','唯一剩32。',['1 32'],[['最小',32]])),r'''
import sys,math
it=iter(map(int,sys.stdin.buffer.read().split()));n=next(it);b=next(it);L=next(it);R=next(it);a=0;M=1;ok=True
for _ in range(n):
    m=next(it);r=next(it)%m;g=math.gcd(M,m)
    if (r-a)%g:ok=False;continue
    v=m//g;t=0 if v==1 else ((r-a)//g*pow(M//g,-1,v))%v;a+=M*t;M*=v;a%=M
blocked=[]
for _ in range(b):
    s=next(it);e=next(it);s=max(L,s);e=min(R,e)
    if s<=e:blocked.append((s,e))
blocked.sort();allowed=[];cur=L
for s,e in blocked:
    if cur<s:allowed.append((cur,s-1))
    cur=max(cur,e+1)
if cur<=R:allowed.append((cur,R))
count=0;best=-1
if ok:
    for l,r in allowed:
        first=a+max(0,(l-a+M-1)//M)*M
        if first<=r:
            if best<0:best=first
            count+=(r-first)//M+1
print(count,best)
''',r'''
using I=__int128_t;ll eg(ll a,ll b,ll&x,ll&y){if(!b){x=1;y=0;return a;}ll u,v,g=eg(b,a%b,u,v);x=v;y=u-a/b*v;return g;}
int main(){int n,b;ll L,R;cin>>n>>b>>L>>R;I a=0,M=1;bool ok=true;while(n--){ll m,r;cin>>m>>r;r=(r%m+m)%m;ll g=gcd((ll)(M%m),m);if((r-a)%g){ok=false;continue;}ll v=m/g;I t=0;if(v!=1){ll x,y;eg((ll)(M/g%v),v,x,y);t=((r-a)/g*x)%v;if(t<0)t+=v;}a+=M*t;M*=v;a%=M;}vector<pair<ll,ll>>blocks;while(b--){ll s,e;cin>>s>>e;s=max(s,L);e=min(e,R);if(s<=e)blocks.push_back({s,e});}sort(blocks.begin(),blocks.end());vector<pair<ll,ll>>allowed;ll cur=L;for(auto[s,e]:blocks){if(cur<s)allowed.push_back({cur,s-1});cur=max(cur,e+1);}if(cur<=R)allowed.push_back({cur,R});ll count=0,best=-1;if(ok)for(auto[l,r]:allowed){I first=a;if(first<l)first+=(I(l)-first+M-1)/M*M;if(first<=r){if(best<0)best=(ll)first;count+=(ll)((r-first)/M+1);}}cout<<count<<' '<<best<<'\n';}
''','hard')

add(737,'number-theory','固定左端的公因數與種類單調性',[
'固定左端 l，向右延長，同時更新 gcd、不同數值集合。每一步若 gcd 等於集合大小，就把區間數加1、長度加 r−l+1；不同位置的區間直接分別計算。',
'gcd 隨延長只會不增，種類數只會不減，因此一旦 gcd 小於種類數，繼續延長永遠不可能再次相等，可以停止這個左端。未剪枝的最壞仍是 n² 個端點，但 n≤4000 最多8002000個區間，比以為要處理20萬長度的版本小得多。'],
'時間 O(n² log A)、空間 O(n)，n≤4000、A≤10⁹；Python set 與輸入整數列表皆 O(n)。長度總和可能 O(n³)，使用64位元。',
'種類數計不同數值，不是區間長度；相等時仍可能繼續相等，不能當場停止。',steps(
('第一個區間','a=[2,4]，左端0。',['[2]:gcd2,種類1'],[['合格數',0]]),('延長到4','[2,4] 的gcd2、種類2，符合。',['[2,4]'],[['合格數',1],['長度和',2]]),('第二左端','[4] 的gcd4、種類1，不符合。',['[4]'],[['輸出','1 2']])),r'''
import sys,math
t=list(map(int,sys.stdin.buffer.read().split()));n=t[0];a=t[1:];count=total=0
for l in range(n):
    g=0;seen=set()
    for r in range(l,n):
        g=math.gcd(g,a[r]);seen.add(a[r]);d=len(seen)
        if g<d:break
        if g==d:count+=1;total+=r-l+1
print(count,total)
''',r'''
int main(){int n;cin>>n;vector<ll>a(n);for(auto&x:a)cin>>x;ll count=0,total=0;for(int l=0;l<n;l++){ll g=0;unordered_set<ll>seen;for(int r=l;r<n;r++){g=gcd(g,a[r]);seen.insert(a[r]);if(g<(ll)seen.size())break;if(g==(ll)seen.size())count++,total+=r-l+1;}}cout<<count<<' '<<total<<'\n';}
''')

add(738,'simulation','按長度與編號比較的動態規則掃描',[
'規則數僅80，每次Q直接掃描全部規則。空前綴轉成空字串，啟用且地址以該前綴開頭者才候選。由編號小到大掃描，只在前綴嚴格更長時更新答案，自然保留同長最小編號。',
'T僅反轉指定規則的布林狀態，不修改其他資料。每次選到非零編號就增加命中並加權重，即使權重為0也算命中；無候選輸出0 0。查詢結果即時累積，最後無論是否有Q都輸出TOTAL。'],
'時間 O(qm×32)、空間 O(m+q)，m≤80、q≤100；Python 分詞及輸出緩衝 O(m+q)，前綴長度≤32。權重總和用64位元。',
'權重不參與路由選擇；相同前綴的規則仍是不同編號，地址前導0不能省略。',steps(
('規則初態','規則1空前綴權重2；規則2前綴1權重0，均啟用。',['1:-','2:1'],[['啟用數',2]]),('第一次查詢','地址全1，選較長的規則2，零權重也命中。',['2 0'],[['命中',1]]),('停用後查詢','停用2，再查全1選規則1。',['1 2'],[['命中',2],['權重和',2]])),r'''
import sys
it=iter(sys.stdin.buffer.read().decode().split());m=int(next(it));q=int(next(it));rules=[]
for _ in range(m):p=next(it);on=int(next(it));v=int(next(it));rules.append(['' if p=='-' else p,on,v])
hit=total=0;out=[]
for _ in range(q):
    op=next(it);x=next(it)
    if op=='T':rules[int(x)-1][1]^=1;continue
    best=0;length=-1;value=0
    for i,(p,on,v) in enumerate(rules,1):
        if on and x.startswith(p) and len(p)>length:best=i;length=len(p);value=v
    out.append(f'{best} {value}')
    if best:hit+=1;total+=value
out.append(f'TOTAL {hit} {total}');print('\n'.join(out))
''',r'''
int main(){int m,q;cin>>m>>q;vector<string>p(m);vector<int>on(m);vector<ll>w(m);for(int i=0;i<m;i++){cin>>p[i]>>on[i]>>w[i];if(p[i]=="-")p[i]="";}ll hit=0,total=0;while(q--){char op;string x;cin>>op>>x;if(op=='T'){on[stoi(x)-1]^=1;continue;}int best=0,len=-1;ll v=0;for(int i=0;i<m;i++)if(on[i]&&(int)p[i].size()>len&&x.compare(0,p[i].size(),p[i])==0){best=i+1;len=p[i].size();v=w[i];}cout<<best<<' '<<v<<'\n';if(best)hit++,total+=v;}cout<<"TOTAL "<<hit<<' '<<total<<'\n';}
''','easy')

add(739,'number-theory','重複兩位數的因數候選進位',[
'A在b進位兩位相等，等價於 A=d(b+1)，其中1≤d<b。因此只需枚舉A的因數f，令b=f−1並驗證d=A/f<b，不用掃描多達10¹²種進位。因數以配對方式在 sqrt(A) 以內找到。',
'對候選b以除法及餘數求B的兩位值q=B//b、r=B%b，要求1≤q<b且q+r=b−1。這同時保證恰有兩位及首位非零。平方因數只插入一次，每個合格因數唯一對應一個進位，所以直接累計個數與進位和。'],
'時間 O(sqrt A)、額外空間 O(1)（每次即檢查一對因數）；A≤10¹²，最多100萬次試除。Python 輸入常數，總和採64位元。',
'進位可大於36，位數值直接算數不需字母表示；B的首位仍必須非零且小於b。',steps(
('分解A','A=12，因數f=4給b=3、d=3，不符合d<b。',['f4→b3'],[['有效',0]]),('測f6','b=5、d=2；B=20表示(4,0)，和4=b−1。',['b5:22,40'],[['個數',1]]),('測f12','b=11、d=1；B=20表示(1,9)，和10。',['b11:11,1|9'],[['個數',2],['進位和',16]])),r'''
import sys,math
A,B=map(int,sys.stdin.buffer.read().split());count=total=0
def valid(f):
    b=f-1
    if b<2 or not 1<=A//f<b:return False
    q,r=divmod(B,b)
    return 1<=q<b and q+r==b-1
for f in range(1,math.isqrt(A)+1):
    if A%f:continue
    if valid(f):count+=1;total+=f-1
    g=A//f
    if g!=f and valid(g):count+=1;total+=g-1
print(count,total)
''',r'''
int main(){ll A,B;cin>>A>>B;ll count=0,total=0;auto check=[&](ll f){ll b=f-1;if(b<2||A/f<1||A/f>=b)return;ll q=B/b,r=B%b;if(q>=1&&q<b&&q+r==b-1)count++,total+=b;};for(ll f=1;f*f<=A;f++)if(A%f==0){check(f);if(f!=A/f)check(A/f);}cout<<count<<' '<<total<<'\n';}
''')

add(740,'search','子集合回溯的技能次數與增量配對分',[
'以編號遞增選人，回溯保存已選人、各技能出現次數、兩類人數與目前分數。加入人i時，增加個人分，並只與已選異類者加入互補分，因此每對異類無序對恰好計一次。',
'選滿K人才檢查兩類非空及每技能至少2人具備；不足剩餘人數就剪枝。合法葉節點比較最大分，並列時加計團隊數及比較遞增編號列表。n≤20 允許列舉子集合，而重複資料仍以編號區分；負分以未設最佳值處理，不可用0代替。'],
'時間 O(n×2^n) 的回溯增量檢查，n≤20；空間 O(n²) 存互補矩陣及 O(n) 遞迴狀態。Python 輸入亦 O(n²)。分數可超32位元，使用64位元。',
'只計異類互補分，技能要至少兩名不同被選者；K<2必無合法團隊。',steps(
('兩名候選','n=2、K=2，類別0與1，皆mask31，個人分2、3，互補−4。',['0:31:2','1:31:3'],[['技能供應','每種2人']]),('計分','個人和5，加異類互補−4，得到1。',['2+3−4=1'],[['團隊分',1]]),('保留唯一團隊','唯一合法集合{1,2}。',['1 1','1 2'],[['最佳解數',1]])),r'''
import sys
it=iter(map(int,sys.stdin.buffer.read().split()));n=next(it);K=next(it);a=[(next(it),next(it),next(it)) for _ in range(n)];c=[[0]*n for _ in range(n)]
for i in range(n):
    for j in range(i+1,n):c[i][j]=c[j][i]=next(it)
chosen=[];skill=[0]*5;types=[0,0];best=None;ways=0;team=None
def dfs(start,score):
    global best,ways,team
    if len(chosen)==K:
        if not all(types) or min(skill)<2:return
        t=tuple(x+1 for x in chosen)
        if best is None or score>best:best=score;ways=1;team=t
        elif score==best:ways+=1;team=min(team,t)
        return
    need=K-len(chosen)
    for i in range(start,n-need+1):
        cat,mask,v=a[i];extra=v+sum(c[i][j] for j in chosen if a[j][0]!=cat)
        chosen.append(i);types[cat]+=1
        for b in range(5):skill[b]+=(mask>>b)&1
        dfs(i+1,score+extra)
        for b in range(5):skill[b]-=(mask>>b)&1
        types[cat]-=1;chosen.pop()
dfs(0,0)
if best is None:print('IMPOSSIBLE')
else:print(best,ways);print(*team)
''',r'''
int main(){int n,K;cin>>n>>K;vector<int>cat(n),mask(n);vector<ll>v(n);for(int i=0;i<n;i++)cin>>cat[i]>>mask[i]>>v[i];vector<vector<ll>>c(n,vector<ll>(n));for(int i=0;i<n;i++)for(int j=i+1;j<n;j++){cin>>c[i][j];c[j][i]=c[i][j];}vector<int>chosen,team;int skill[5]={},types[2]={};ll best=LLONG_MIN,ways=0;function<void(int,ll)>dfs=[&](int st,ll score){if((int)chosen.size()==K){if(!types[0]||!types[1])return;for(int x:skill)if(x<2)return;if(score>best){best=score;ways=1;team=chosen;}else if(score==best){ways++;team=min(team,chosen);}return;}int need=K-chosen.size();for(int i=st;i<=n-need;i++){ll extra=v[i];for(int j:chosen)if(cat[i]!=cat[j])extra+=c[i][j];chosen.push_back(i);types[cat[i]]++;for(int b=0;b<5;b++)skill[b]+=mask[i]>>b&1;dfs(i+1,score+extra);for(int b=0;b<5;b++)skill[b]-=mask[i]>>b&1;types[cat[i]]--;chosen.pop_back();}};dfs(0,0);if(!ways)cout<<"IMPOSSIBLE\n";else{cout<<best<<' '<<ways<<'\n';for(int i=0;i<K;i++)cout<<(i?" ":"")<<team[i]+1;cout<<'\n';}}
''','hard')

add(741,'simulation','座標帶號多重數的同時摺疊',[
'用座標到帶號數量的映射保存抵銷後狀態，正數表示剩多少正點、負數表示負點。把同座標的帶號數量相加正好完成一對一抵銷，保留絕對值而非把多點縮成一點。',
'每次摺疊必須建立全新映射：對舊座標判嚴格動側，符合才反射指定座標並把數量變號，再彙入新座標。若合併前的兩數異號，便發生抵銷，更新最後時刻；零項刪掉。時刻0也同樣彙總初始點。映射線性作用與抵銷相容，因此聚合帶號數量不會遺失後續資訊。'],
'期望時間 O(nq+n)、空間 O(n+q)，活座標不超過n≤1000、q≤1000；C++ map 版多 log n 因子，Python 分詞輸入 O(n+q)。多次反射座標採64位元。',
'位在摺線上不動不翻號；不能原地移動映射，否則本輪新點可能被再次摺動。',steps(
('初始彙總','兩個正點在(0,0)、(2,0)。',['(0,0):+1','(2,0):+1'],[['存活點',2]]),('摺動正側','X + 1，(2,0)變(0,0)且號翻負。',['(0,0):+1−1'],[['時刻',1]]),('同時抵銷','兩點消失，最後抵銷時刻1。',['空'],[['存活',0],['座標數',0]])),r'''
import sys
it=iter(sys.stdin.buffer.read().decode().split());n=int(next(it));q=int(next(it));last=-1;state={}
def put(dest,key,value,t):
    global last
    old=dest.get(key,0)
    if old*value<0:last=t
    dest[key]=old+value
for _ in range(n):x=int(next(it));y=int(next(it));s=int(next(it));put(state,(x,y),s,0)
state={p:s for p,s in state.items() if s}
for t in range(1,q+1):
    axis=next(it);side=next(it);v=int(next(it));new={}
    for (x,y),s in state.items():
        z=x if axis=='X' else y
        if (side=='-' and z<v) or (side=='+' and z>v):
            if axis=='X':x=2*v-x
            else:y=2*v-y
            s=-s
        put(new,(x,y),s,t)
    state={p:s for p,s in new.items() if s}
print(sum(abs(s) for s in state.values()),len(state),last)
''',r'''
int main(){int n,q;cin>>n>>q;using P=pair<ll,ll>;map<P,ll>s;int last=-1;auto put=[&](map<P,ll>&a,P p,ll v,int t){ll old=a[p];if((old<0&&v>0)||(old>0&&v<0))last=t;a[p]+=v;};for(int i=0;i<n;i++){ll x,y,v;cin>>x>>y>>v;put(s,{x,y},v,0);}for(auto it=s.begin();it!=s.end();)if(!it->second)it=s.erase(it);else ++it;for(int t=1;t<=q;t++){char axis,side;ll v;cin>>axis>>side>>v;map<P,ll>b;for(auto[p,k]:s){auto[x,y]=p;ll z=axis=='X'?x:y;if((side=='-'&&z<v)||(side=='+'&&z>v)){if(axis=='X')x=2*v-x;else y=2*v-y;k=-k;}put(b,{x,y},k,t);}s.clear();for(auto[p,k]:b)if(k)s[p]=k;}ll alive=0;for(auto[p,k]:s)alive+=abs(k);cout<<alive<<' '<<s.size()<<' '<<last<<'\n';}
''')

add(742,'simulation','巢狀快照堆疊的提交與回滾',[
'存檔層以堆疊保存箱量陣列的完整副本。B壓入目前副本，C僅彈出最內層副本並保留目前箱量，R則先以頂端副本恢復箱量再彈出；沒有存檔時C、R皆略過。',
'完整副本讓外層始終記住建立時的原值，所以即使內層C提交了變更，外層R仍可一次撤銷。搬運取 min(v,來源量)，兩箱相同時略過；Q直接輸出目前箱量與堆疊深度，其已輸出記錄不屬於箱量快照，不能被回滾。'],
'時間 O(nq)、空間 O(nq)，n≤20、q≤100，至多2000個快照數值；Python 輸入輸出緩衝 O(q+n)，箱量總和採64位元。',
'Python 存檔必須用 a.copy()，直接存 a 參照會讓快照跟著搬運一起改。',steps(
('外層存檔','箱量[5,0]，B後記住此狀態。',['[5,0]'],[['深度',1]]),('內層提交','搬3至箱2後B，再搬1回箱1並C，現[3,2]。',['[3,2]'],[['深度',1]]),('回滾外層','R恢復最外層起點[5,0]。',['[5,0]'],[['深度',0]])),r'''
import sys
it=iter(sys.stdin.buffer.read().decode().split());n=int(next(it));q=int(next(it));a=[int(next(it)) for _ in range(n)];stack=[];out=[]
for _ in range(q):
    op=next(it)
    if op=='B':stack.append(a.copy())
    elif op=='C':
        if stack:stack.pop()
    elif op=='R':
        if stack:a=stack.pop()
    elif op=='Q':x=int(next(it))-1;out.append(f'{a[x]} {len(stack)}')
    else:
        x=int(next(it))-1;y=int(next(it))-1;v=int(next(it))
        if x!=y:z=min(v,a[x]);a[x]-=z;a[y]+=z
out.append('FINAL '+' '.join(map(str,a)));print('\n'.join(out))
''',r'''
int main(){int n,q;cin>>n>>q;vector<ll>a(n);for(auto&x:a)cin>>x;vector<vector<ll>>st;while(q--){char op;cin>>op;if(op=='B')st.push_back(a);else if(op=='C'){if(!st.empty())st.pop_back();}else if(op=='R'){if(!st.empty()){a=st.back();st.pop_back();}}else if(op=='Q'){int x;cin>>x;cout<<a[x-1]<<' '<<st.size()<<'\n';}else{int x,y;ll v;cin>>x>>y>>v;--x;--y;if(x!=y){ll z=min(v,a[x]);a[x]-=z;a[y]+=z;}}}cout<<"FINAL";for(ll x:a)cout<<' '<<x;cout<<'\n';}
''','easy')

add(743,'number-theory','交換區段的交錯和與奇偶頻率',[
'11的倍數判定可用全字串交錯和 T=Σ(−1)^i dᵢ。以交錯前綴求每個長K區段在原位置的貢獻 Bᵢ。兩起點同奇偶時，交換不改交錯和；異奇偶時，搬到另一側的貢獻變號，新和為 T−2(Bᵢ+Bⱼ)。',
'掃描右起點j，把剛滿足 i+K≤j 的左起點加入表。依奇偶與 Bᵢ mod11 保存數量及索引和。同奇偶若T≡0便全算，異奇偶查 Bᵢ≡6T−Bⱼ (mod11)，因6是2的模11反元素。每組左起點的距離和等於 count×j−sumIndices，可同步累計而不列舉配對。'],
'時間 O(n)、空間 O(n)，n≤50000，Python 前綴與輸入 O(n)，頻率表固定2×11。距離和可達 O(n³)，使用64位元。',
'同長不重疊才可交換；i+K=j 的相鄰區段合法，內容相同也要計位置對。',steps(
('交錯前綴','S=1234、K=1，T=1−2+3−4=−2。',['B:1,−2,3,−4'],[['T mod11',9]]),('第一組合法','交換起點0、1後2134，交錯和0。',['2134'],[['距離',1]]),('另一組合法','交換2、3後1243也整除11，總兩對。',['1243'],[['對數',2],['距離和',2]])),r'''
import sys
n,K=map(int,sys.stdin.buffer.readline().split());s=sys.stdin.buffer.readline().strip();P=[0]
for i,c in enumerate(s):P.append(P[-1]+(c-48)*(1 if i%2==0 else -1))
T=P[-1]%11;B=[(P[i+K]-P[i])%11 for i in range(n-K+1)];cnt=[[0]*11 for _ in range(2)];sums=[[0]*11 for _ in range(2)];count=total=0
for j in range(len(B)):
    i=j-K
    if i>=0:cnt[i%2][B[i]]+=1;sums[i%2][B[i]]+=i
    p=j%2
    if T==0:
        c=sum(cnt[p]);count+=c;total+=c*j-sum(sums[p])
    target=(6*T-B[j])%11;c=cnt[1-p][target];count+=c;total+=c*j-sums[1-p][target]
print(count,total)
''',r'''
int main(){int n,K;string s;cin>>n>>K>>s;vector<int>P(n+1);for(int i=0;i<n;i++)P[i+1]=P[i]+(i%2?-1:1)*(s[i]-'0');auto mod=[](int x){return (x%11+11)%11;};int T=mod(P[n]);ll c[2][11]={},sum[2][11]={},count=0,total=0;for(int j=0;j+K<=n;j++){int i=j-K;if(i>=0){int z=mod(P[i+K]-P[i]);c[i%2][z]++;sum[i%2][z]+=i;}int p=j%2;if(!T)for(int z=0;z<11;z++)count+=c[p][z],total+=c[p][z]*j-sum[p][z];int target=mod(6*T-mod(P[j+K]-P[j]));count+=c[1-p][target];total+=c[1-p][target]*j-sum[1-p][target];}cout<<count<<' '<<total<<'\n';}
''','hard')

add(744,'dp','精確段數與前類別的最佳後綴 DP',[
'狀態 (位置,剩餘碼字數,前一類別) 回傳最佳分數、最佳解數模101及最小編號序列。枚舉與目前位置前綴相符、類別不同的碼字，移到碼字結尾並減少剩餘數；首狀態的前類別使用2表示無限制。',
'位置到字串尾且剩餘數為0才是唯一空完成，其他終止狀態無解。轉移分數加碼字分數，較優則取代，並列則加計數模101並比較完整序列。以獨立的無解標記區分不存在與計數餘0，否則恰有101個最佳解的狀態會被誤刪。'],
'時間 O(nKm(8+K))（含最小序列複製比較）、空間 O(nK²+輸入)，n,K≤60、m≤10，三種前類別為常數。Python 記憶化及元組序列都計入；分數用64位元。',
'餘數0不代表無解；K=0而S非空一定IMPOSSIBLE，負分也可能是最佳。',steps(
('設定碼字','S=000、K=2，碼1=0類0分2，碼2=00類1分3。',['1:0','2:00'],[['碼數',2]]),('兩種分段','0|00與00|0皆交替，分數皆5。',['1,2','2,1'],[['最優解數',2]]),('字典序選擇','比較第一個編號，取1,2。',['5 2','1 2'],[['最佳分',5]])),r'''
import sys
from functools import lru_cache
it=iter(sys.stdin.buffer.read().decode().split());n=int(next(it));m=int(next(it));K=int(next(it));S=next(it);a=[(next(it),int(next(it)),int(next(it))) for _ in range(m)]
@lru_cache(None)
def dp(pos,k,prev):
    if pos==n:return (0,1,()) if k==0 else None
    if k==0:return None
    best=None
    for i,(s,c,v) in enumerate(a,1):
        if c==prev or not S.startswith(s,pos):continue
        tail=dp(pos+len(s),k-1,c)
        if tail is None:continue
        score=v+tail[0];seq=(i,)+tail[2]
        if best is None or score>best[0]:best=(score,tail[1],seq)
        elif score==best[0]:best=(score,(best[1]+tail[1])%101,min(best[2],seq))
    return best
ans=dp(0,K,2)
if ans is None:print('IMPOSSIBLE')
else:print(ans[0],ans[1]);print(*ans[2])
''',r'''
struct R{bool ok=false;ll score=0;int count=0;vector<int>seq;};int n,m,K;string S;vector<string>word;vector<int>cat;vector<ll>val;R memo[61][61][3];bool seen[61][61][3];
R dp(int p,int k,int prev){if(p==n){R r;if(k==0)r.ok=true,r.count=1;return r;}if(k==0)return {};if(seen[p][k][prev])return memo[p][k][prev];seen[p][k][prev]=true;R best;for(int i=0;i<m;i++)if(cat[i]!=prev&&S.compare(p,word[i].size(),word[i])==0){R r=dp(p+word[i].size(),k-1,cat[i]);if(!r.ok)continue;r.score+=val[i];r.seq.insert(r.seq.begin(),i+1);if(!best.ok||r.score>best.score)best=r;else if(r.score==best.score){best.count=(best.count+r.count)%101;best.seq=min(best.seq,r.seq);}}return memo[p][k][prev]=best;}
int main(){cin>>n>>m>>K>>S;word.resize(m);cat.resize(m);val.resize(m);for(int i=0;i<m;i++)cin>>word[i]>>cat[i]>>val[i];auto r=dp(0,K,2);if(!r.ok)cout<<"IMPOSSIBLE\n";else{cout<<r.score<<' '<<r.count<<'\n';for(int i=0;i<K;i++)cout<<(i?" ":"")<<r.seq[i];cout<<'\n';}}
''','hard')

add(745,'geometry','有理數時空鍵的事件去重',[
'每對不同速度物體解相遇時間 t=(xⱼ−xᵢ)/(vᵢ−vⱼ)，約成分母正的既約分數，只保留0<t≤T。再把相遇位置 xᵢ+vᵢt 同樣約分，組成完整的時間與位置鍵。',
'每個事件鍵保存參與物體編號集合。任意同場物體兩兩都產生同一鍵，因此聯集正好收集全體參與者；三人相遇不會誤算成三事件。同時不同位置的鍵不同，仍分別計數。用精確分數比較最早時間，再比較位置，無浮點誤差；初始位置互異，等速物體不可能相遇。'],
'時間 O(n² log n)、空間 O(n²)，n≤80；事件中參與人數k耗k個集合項，可由產生該事件的 C(k,2) 對數界住總量。Python Fraction、輸入與事件字典均計入；C++ 用 __int128 比較分數乘積。',
'此題統計時空事件，不是標記對；時間為連續實數且排除t=0，位置分數也要約分。',steps(
('第一對相遇','物體(−2,2)、(0,0)、(2,−2)，T=2。',['t=1','位置0'],[['已知參與','1,2']]),('其餘對合併','兩個剩餘對也都在同一時空鍵。',['(1,0):{1,2,3}'],[['事件數',1]]),('輸出既約分數','時間1/1、位置0/1。',['1 3','1 1 0 1'],[['最大參與',3]])),r'''
import sys
from fractions import Fraction
it=iter(map(int,sys.stdin.buffer.read().split()));n=next(it);T=next(it);a=[(next(it),next(it)) for _ in range(n)];events={}
for i,(x,v) in enumerate(a):
    for j in range(i):
        y,w=a[j]
        if v==w:continue
        t=Fraction(y-x,v-w)
        if 0<t<=T:events.setdefault((t,x+v*t),set()).update((i,j))
if not events:print('0 0\n-')
else:
    print(len(events),max(map(len,events.values())));t,p=min(events);print(t.numerator,t.denominator,p.numerator,p.denominator)
''',r'''
pair<ll,ll>norm(ll a,ll b){if(b<0)a=-a,b=-b;ll g=gcd(abs(a),b);return {a/g,b/g};}
int main(){int n;ll T;cin>>n>>T;vector<pair<ll,ll>>a(n);for(auto&[x,v]:a)cin>>x>>v;map<array<ll,4>,set<int>>events;for(int i=0;i<n;i++)for(int j=0;j<i;j++){auto[x,v]=a[i];auto[y,w]=a[j];if(v==w)continue;auto[tn,td]=norm(y-x,v-w);if(tn<=0||(__int128)tn>(__int128)T*td)continue;auto[pn,pd]=norm(x*td+v*tn,td);auto&ids=events[{tn,td,pn,pd}];ids.insert(i);ids.insert(j);}if(events.empty()){cout<<"0 0\n-\n";return 0;}auto less=[](auto a,auto b){__int128 x=(__int128)a[0]*b[1],y=(__int128)b[0]*a[1];if(x!=y)return x<y;return (__int128)a[2]*b[3]<(__int128)b[2]*a[3];};auto best=events.begin()->first;int mx=0;for(auto&[key,ids]:events){mx=max(mx,(int)ids.size());if(less(key,best))best=key;}cout<<events.size()<<' '<<mx<<'\n';for(int i=0;i<4;i++)cout<<(i?" ":"")<<best[i];cout<<'\n';}
''','hard')

def oracle(code, data):
    """Small-instance definitions, deliberately enumerating objects, not lesson recurrences."""
    from fractions import Fraction
    if code=='b715':
        s=data.strip();return str(sum(all(v%2==0 for v in collections.Counter(s[i:j]).values()) and all(s[k]!=s[k+1] for k in range(i,j-1)) for i in range(len(s)) for j in range(i+1,len(s)+1)))
    t=data.split();it=iter(t);num=int(code[1:]);n=int(next(it));out=[]
    if num==700:
        L,R,K=map(int,[next(it),next(it),next(it)]);s=next(it);f=collections.Counter(s[i:j] for i in range(n) for j in range(i+1,n+1));return str(sum(L<=len(s)<=R and c==K for s,c in f.items()))
    if num==701:
        w=int(next(it));a=[next(it) for _ in range(n)];return str(sum(sum(int(a[r][c]) for r in (i,j) for c in (k,l))%2 for i,j in itertools.combinations(range(n),2) for k,l in itertools.combinations(range(w),2)))
    if num==702:
        X=int(next(it));a=[tuple(int(next(it)) for _ in range(3)) for _ in range(n)];done=[]
        for p,k,r in a:
            z=0
            for j in range(X):
                if j and j%k==0:z+=r
                z+=p;done.append(z)
        return str(sorted(done)[X-1])
    if num==703:
        active=set()
        for _ in range(n):
            op=int(next(it));x=int(next(it))
            if op==1:active.add(x)
            elif op==2:active.discard(x)
            else:
                groups=[];last=None
                for v in sorted(active):
                    if last is None or v!=last+1:groups.append(0)
                    groups[-1]+=1;last=v
                out.append(str(sum(z for z in groups if z>=x)))
    elif num==704:
        from functools import lru_cache
        k=n;q=int(next(it));a=[int(next(it)) for _ in range(q)]
        @lru_cache(None)
        def win(s,p):return any(not win(s-x,x) for x in range(1,min(k,s)+1) if x!=p)
        return ''.join('W' if win(x,0) else 'L' for x in a)
    elif num==705:
        a=[(int(next(it)),next(it)) for _ in range(n)];return str(sum(c!=d and len(s)<len(t) and t.endswith(s) for c,s in a for d,t in a))
    elif num==706:
        L=int(next(it));R=int(next(it));a=[]
        for _ in range(n):
            op=next(it)
            if op=='+':a.append(int(next(it)))
            elif a:a.pop()
            out.append(str(sum(L<=j-i<=R and sum(a[i:j])==0 for i in range(len(a)) for j in range(i+1,len(a)+1))))
    elif num==707:
        D=int(next(it));K=int(next(it));s=next(it);return str(sum(j-i<=D and s[i]==s[j] and sum(c in 'aeiou' for c in s[i+1:j])==K for i,j in itertools.combinations(range(n),2)))
    elif num==708:
        L=int(next(it));K=int(next(it));a=[int(next(it)) for _ in range(n)];return str(sum(max(a[i:j])-min(a[i:j])==K for i in range(n) for j in range(i+L,n+1)))
    elif num==709:
        s=next(it);a=[next(it) for _ in range(n)];return str(sum(sum(s[v]=='1' for v in vs)==1 and all(sum(a[u][v]=='1' for v in vs)==1 for u in vs) for vs in itertools.combinations(range(n),3)))
    elif num==710:
        m=int(next(it));b=[int(next(it)) for _ in range(n)];edges=[tuple(int(next(it)) for _ in range(3)) for _ in range(m)];d=[10**30]*(2*n);d[b[0]]=0
        for _ in range(2*n):
            changed=False
            for u,v,w in edges:
                for c in range(2):
                    if c+b[v-1]<=1:
                        x=2*(u-1)+c;y=2*(v-1)+c+b[v-1]
                        if d[x]+w<d[y]:d[y]=d[x]+w;changed=True
            if not changed:break
        return str(-1 if d[-1]==10**30 else d[-1])
    elif num==711:
        a=[tuple(int(next(it)) for _ in range(3)) for _ in range(n)];left=set(range(n));time=wait=0
        while left:
            candidates=[i for i in left if a[i][0]<=time]
            if not candidates:time=min(a[i][0] for i in left);continue
            i=min(candidates,key=lambda i:(-(a[i][1]+time-a[i][0]),a[i][0],i));wait+=time-a[i][0];time+=a[i][2];left.remove(i)
        return f'{time} {wait}'
    elif num==712:
        T=int(next(it));a=[(int(next(it)),int(next(it))) for _ in range(n)];g=[set() for _ in range(n)]
        for _ in range(n-1):u=int(next(it))-1;v=int(next(it))-1;g[u].add(v);g[v].add(u)
        return str(sum(a[u][0]!=a[v][0] and a[u][1]+a[v][1]<=T and bool(g[u]&g[v]) for u,v in itertools.combinations(range(n),2)))
    elif num==713:
        Q=int(next(it));a=[(int(next(it)),int(next(it))) for _ in range(n)];return str(sum(c!=d and math.lcm(x,y)==Q for (x,c),(y,d) in itertools.combinations(a,2)))
    elif num==714:
        s=next(it);count=total=0
        for i in range(n):
            r=s[i:]+s[:i];ways=0
            for j in range(n):z=r[:j]+r[j+1:];ways+=z==z[::-1]
            count+=bool(ways);total+=ways
        return f'{count} {total}'
    elif num==716:
        K=int(next(it));a=[int(next(it)) for _ in range(n)];return str(sum(sum(a[p]>a[p-1] and a[p]>a[p+1] for p in range(i+1,j-1))==1 and sum(a[i:j])%K==0 for i in range(n) for j in range(i+1,n+1)))
    elif num==717:
        w=[int(next(it)) for _ in range(n)];edges=[tuple(int(next(it)) for _ in range(3)) for _ in range(n-1)];best=None;ways=0
        for mask in range(1,1<<n):
            vs={i+1 for i in range(n) if mask>>i&1};seen={next(iter(vs))}
            while True:
                nxt=seen|{v for u,v,c in edges if u in seen and v in vs}|{u for u,v,c in edges if v in seen and u in vs}
                if nxt==seen:break
                seen=nxt
            if seen!=vs:continue
            boundary=[c for u,v,c in edges if (u in vs)!=(v in vs)]
            if sorted(boundary)!=[0,1]:continue
            z=sum(w[i-1] for i in vs)
            if best is None or z>best:best=z;ways=1
            elif z==best:ways+=1
        return 'IMPOSSIBLE' if best is None else f'{best} {ways}'
    elif num==718:
        for _ in range(n):
            W,H,x,y,vx,vy=[int(next(it)) for _ in range(6)]
            if vx==vy==0:out.append('NEVER');continue
            for sec in itertools.count(1):
                X=x+vx*sec;Y=y+vy*sec
                if not (0<=X<=W and 0<=Y<=H):break
            side=''.join(c for yes,c in ((X<0,'L'),(X>W,'R'),(Y<0,'B'),(Y>H,'T')) if yes);out.append(f'{sec} {X} {Y} {side}')
    elif num==719:
        a=[int(next(it)) for _ in range(n)];g=[[] for _ in range(n)]
        for _ in range(n-1):u=int(next(it))-1;v=int(next(it))-1;w=int(next(it));g[u].append((v,w));g[v].append((u,w))
        count=total=0
        for s in range(n):
            paths={s:([s],0)};queue=[s]
            for u in queue:
                for v,w in g[u]:
                    if v not in paths:paths[v]=(paths[u][0]+[v],paths[u][1]+w);queue.append(v)
            for v in range(s+1,n):
                path,d=paths[v];diff=[a[y]-a[x] for x,y in zip(path,path[1:])]
                if sum(x>0 for x in diff)==sum(x<0 for x in diff)==1:count+=1;total+=d
        return f'{count} {total}'
    elif num==720:
        tokens=list(it);Q=tokens.count('?');one=0
        for bits in itertools.product((0,1),repeat=Q):
            bit=iter(bits);stack=[]
            for x in tokens:
                if x in ('0','1'):stack.append(int(x))
                elif x=='?':stack.append(next(bit))
                elif x=='!':stack[-1]^=1
                else:
                    b=stack.pop();a=stack.pop();stack.append((a&b) if x=='&' else (a|b) if x=='|' else (a^b))
            one+=stack[0]
        zero=(1<<Q)-one;return f'{one} {zero} '+('0' if one==0 else '1' if zero==0 else '?')
    elif num==721:
        h=n;w=int(next(it));d=int(next(it));q=int(next(it));a=[[int(next(it)) for _ in range(w)] for _ in range(h)];drains=[(int(next(it))-1,int(next(it))-1,int(next(it))) for _ in range(d)];rs=[int(next(it)) for _ in range(q)];E=[[None]*w for _ in range(h)]
        levels=sorted({x for row in a for x in row}|{s for r,c,s in drains})
        for level in levels:
            seen={(r,c) for r in range(h) for c in range(w) if (r in (0,h-1) or c in (0,w-1)) and a[r][c]<=level}|{(r,c) for r,c,s in drains if max(s,a[r][c])<=level};queue=list(seen)
            for r,c in queue:
                for x,y in ((r-1,c),(r+1,c),(r,c-1),(r,c+1)):
                    if 0<=x<h and 0<=y<w and a[x][y]<=level and (x,y) not in seen:seen.add((x,y));queue.append((x,y))
            for r,c in seen:
                if E[r][c] is None:E[r][c]=level
        return '\n'.join(str(sum(max(0,min(R,E[r][c])-a[r][c]) for r in range(h) for c in range(w))) for R in rs)
    elif num==722:
        m=int(next(it));a=[tuple(int(next(it)) for _ in range(3)) for _ in range(n)];edges=[(int(next(it))-1,int(next(it))-1) for _ in range(m)];alive=set(range(n));rounds=total=0
        while True:
            bad=[]
            for v in alive:
                deg=[sum(u in alive and y==v and a[u][0]==c for u,y in edges) for c in range(2)]
                if deg[0]<a[v][1] or deg[1]<a[v][2]:bad.append(v)
            if not bad:break
            rounds+=1;total+=len(bad)*rounds;alive.difference_update(bad)
        return f'{sum(a[i][0]==0 for i in alive)} {sum(a[i][0]==1 for i in alive)} {rounds} {total}'
    elif num==723:
        m=int(next(it));K=int(next(it));edges=[tuple(int(next(it)) for _ in range(4)) for _ in range(m)];best=None
        for B in sorted({w for u,v,w,c in edges}):
            d=[[99999]*2 for _ in range(n)];d[0]=[0,0]
            for _ in range(2*n):
                for u,v,w,c in edges:
                    if w>=B:
                        for p in range(2):d[v-1][c]=min(d[v-1][c],d[u-1][p]+(p!=c))
            z=min(d[-1])
            if z<=K:best=(B,z)
        return '-1 -1' if best is None else f'{best[0]} {best[1]}'
    elif num==724:
        w=int(next(it));a=[[int(c) for c in next(it)] for _ in range(n)];count=0
        for top in range(n):
            for bot in range(top+2,n):
                for l in range(w):
                    for r in range(l+2,w):
                        frame=inside=0
                        for i in range(top,bot+1):
                            for j in range(l,r+1):
                                if i in (top,bot) or j in (l,r):frame+=a[i][j]
                                else:inside+=a[i][j]
                        count+=frame==inside
        return str(count)
    elif num==725:
        K=int(next(it));a=[tuple(int(next(it)) for _ in range(3)) for _ in range(n)];count=size=means=0
        for u in range(n):
            nodes=[]
            for v in range(n):
                p=v
                while p>u:p=a[p][0]-1
                if p==u:nodes.append(v)
            s=sum(a[v][1] for v in nodes)
            if len({a[v][2] for v in nodes})==K and s%len(nodes)==0:count+=1;size+=len(nodes);means+=s//len(nodes)
        return f'{count} {size} {means}'
    elif num==726:
        H=n;W=int(next(it));rows=[int(next(it)) for _ in range(H)];cols=[int(next(it)) for _ in range(W)];weights=[int(next(it)) for _ in range(H*W)];count=total=0;best=None
        for flat in itertools.product((0,1),repeat=H*W):
            if any(sum(flat[i*W:(i+1)*W])!=rows[i] for i in range(H)):continue
            if any(sum(flat[i*W+j] for i in range(H))!=cols[j] for j in range(W)):continue
            if any(flat[i*W+j] and flat[i*W+j+1] and flat[(i+1)*W+j] and flat[(i+1)*W+j+1] for i in range(H-1) for j in range(W-1)):continue
            count+=1;total+=sum(x*y for x,y in zip(flat,weights))
            if best is None:best=flat
        return f'{count} {total}\n'+('-' if best is None else '\n'.join(''.join(map(str,best[i*W:(i+1)*W])) for i in range(H)))
    elif num==727:
        s=next(it);m1,r1,m2,r2=[int(next(it)) for _ in range(4)];results=set()
        for i,j in itertools.combinations(range(n),2):
            a=list(s);a[i],a[j]=a[j],a[i];z=''.join(a);A=sum((k+1)*int(v) for k,v in enumerate(z));B=sum((k+1)**2*int(v) for k,v in enumerate(z))
            if A%m1==r1 and B%m2==r2:results.add(z)
        return f'{len(results)}\n'+(min(results) if results else '-')
    elif num==728:
        T=int(next(it));a=[(int(next(it)),int(next(it))) for _ in range(n)];count=total=0
        for (x,v),(y,w) in itertools.combinations(a,2):
            for sec in range(T+1):
                if x+v*sec==y+w*sec:count+=1;total+=sec;break
        return f'{count} {total}'
    elif num==729:
        from functools import lru_cache
        A=n;B=int(next(it));K=int(next(it))
        @lru_cache(None)
        def win(a,b,p):
            options=[]
            for c,amount in enumerate((a,b)):
                if a*b and c==p:continue
                for take in range(1,min(K,amount)+1):options.append(not win(a-take if c==0 else a,b-take if c==1 else b,c))
            return True in options
        good=[]
        for c,amount in enumerate((A,B)):
            for take in range(1,min(K,amount)+1):
                if not win(A-take if c==0 else A,B-take if c==1 else B,c):good.append(('AB'[c],take))
        return 'LOSE 0 - 0' if not good else f'WIN {len(good)} {good[0][0]} {good[0][1]}'
    elif num==730:
        k=int(next(it));r=int(next(it));s=next(it);return str(sum((j-i)%k==r and s[i:j].count('a')==s[i:j].count('b') for i in range(n) for j in range(i+1,n+1)))
    elif num==731:
        C=n;M=int(next(it));lru=[];dirty=set();hit=miss=back=0
        for _ in range(M):
            op=next(it);x=int(next(it))
            if x in lru:hit+=1;lru.remove(x)
            else:
                miss+=1
                if len(lru)==C:
                    old=lru.pop(0);back+=old in dirty;dirty.discard(old)
            lru.append(x)
            if op=='W':dirty.add(x)
        return f'{hit} {miss} {back} {len(dirty)}'
    elif num==732:
        K=int(next(it));T=int(next(it));a=[(int(next(it)),int(next(it))) for _ in range(n)];good=[t for t in range(1,T+1) if sum(t%p==r for p,r in a)>=K];return f'{len(good)} {good[0] if good else -1}'
    elif num==733:
        hints=[(next(it),int(next(it)),int(next(it))) for _ in range(n)];good=[]
        for chars in itertools.product('0123456789',repeat=4):
            s=''.join(chars);ok=True
            for g,A,B in hints:
                unused_s=[];unused_g=[];a=0
                for x,y in zip(s,g):
                    if x==y:a+=1
                    else:unused_s.append(x);unused_g.append(y)
                b=0
                for x in unused_s:
                    if x in unused_g:b+=1;unused_g.remove(x)
                if (a,b)!=(A,B):ok=False;break
            if ok:good.append(s)
        return f'{len(good)} {good[0] if good else -1}'
    elif num==734:
        q=int(next(it));poly=[(int(next(it)),int(next(it))) for _ in range(n)]
        def winding(v,p):
            z=0
            for a,b in zip(v,v[1:]+v[:1]):
                cross=(b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0])
                if cross==0 and min(a[0],b[0])<=p[0]<=max(a[0],b[0]) and min(a[1],b[1])<=p[1]<=max(a[1],b[1]):return 'B'
                if a[1]<=p[1]<b[1] and cross>0:z+=1
                if b[1]<=p[1]<a[1] and cross<0:z-=1
            return str(z)
        for _ in range(q):p=(int(next(it)),int(next(it)));k=int(next(it))-1;out.append(winding(poly,p)+' '+winding(poly[:k]+poly[k+1:],p))
    elif num==735:
        m=int(next(it));k=int(next(it));edges=[tuple(int(next(it)) for _ in range(3)) for _ in range(m)];count=total=0
        for mask in range(1<<k):
            D=[[999]*(n) for _ in range(n)]
            for i in range(n):D[i][i]=0
            for u,v,c in edges:
                if c==0 or mask>>(c-1)&1:D[u-1][v-1]=min(D[u-1][v-1],1)
            for p in range(n):
                for u in range(n):
                    for v in range(n):D[u][v]=min(D[u][v],D[u][p]+D[p][v])
            if D[0][-1]<999:count+=1;total+=D[0][-1]
        return f'{count} {total}'
    elif num==736:
        b=int(next(it));L=int(next(it));R=int(next(it));con=[(int(next(it)),int(next(it))) for _ in range(n)];blocks=[(int(next(it)),int(next(it))) for _ in range(b)];good=[x for x in range(L,R+1) if all(x%m==r%m for m,r in con) and not any(s<=x<=e for s,e in blocks)];return f'{len(good)} {good[0] if good else -1}'
    elif num==737:
        a=[int(next(it)) for _ in range(n)];lengths=[j-i for i in range(n) for j in range(i+1,n+1) if math.gcd(*a[i:j])==len(set(a[i:j]))];return f'{len(lengths)} {sum(lengths)}'
    elif num==738:
        q=int(next(it));a=[(next(it),int(next(it)),int(next(it))) for _ in range(n)];hit=total=0
        for _ in range(q):
            op=next(it);x=next(it)
            if op=='T':i=int(x)-1;p,on,v=a[i];a[i]=(p,1-on,v);continue
            eligible=[(len(p) if p!='-' else 0,-i,i,v) for i,(p,on,v) in enumerate(a,1) if on and (p=='-' or x[:len(p)]==p)]
            if eligible:_,_,i,v=max(eligible);hit+=1;total+=v;out.append(f'{i} {v}')
            else:out.append('0 0')
        out.append(f'TOTAL {hit} {total}')
    elif num==739:
        A=n;B=int(next(it));good=[]
        for base in range(2,max(A,B)+1):
            def digits(x):
                ds=[]
                while x:ds.append(x%base);x//=base
                return ds
            a=digits(A);b=digits(B)
            if len(a)==len(b)==2 and a[0]==a[1] and sum(b)==base-1:good.append(base)
        return f'{len(good)} {sum(good)}'
    elif num==740:
        K=int(next(it));a=[tuple(int(next(it)) for _ in range(3)) for _ in range(n)];pair={}
        for i in range(n):
            for j in range(i+1,n):pair[i,j]=int(next(it))
        best=None;ways=0;team=None
        for ids in itertools.combinations(range(n),K):
            if {a[i][0] for i in ids}!={0,1} or any(sum(a[i][1]>>b&1 for i in ids)<2 for b in range(5)):continue
            score=sum(a[i][2] for i in ids)+sum(pair[i,j] for i,j in itertools.combinations(ids,2) if a[i][0]!=a[j][0])
            if best is None or score>best:best=score;ways=1;team=ids
            elif score==best:ways+=1
        return 'IMPOSSIBLE' if best is None else f'{best} {ways}\n'+' '.join(str(i+1) for i in team)
    elif num==741:
        q=int(next(it));points=[tuple(int(next(it)) for _ in range(3)) for _ in range(n)];last=-1
        def cancel(points,time):
            nonlocal last
            alive=[]
            for x,y,s in points:
                try:j=alive.index((x,y,-s))
                except ValueError:alive.append((x,y,s))
                else:alive.pop(j);last=time
            return alive
        points=cancel(points,0)
        for time in range(1,q+1):
            axis=next(it);side=next(it);v=int(next(it));new=[]
            for x,y,s in points:
                z=x if axis=='X' else y
                if (side=='-' and z<v) or (side=='+' and z>v):
                    if axis=='X':x=2*v-x
                    else:y=2*v-y
                    s=-s
                new.append((x,y,s))
            points=cancel(new,time)
        return f'{len(points)} {len({(x,y) for x,y,s in points})} {last}'
    elif num==742:
        q=int(next(it));a=[int(next(it)) for _ in range(n)];history=[];marks=[]
        for _ in range(q):
            op=next(it)
            if op=='B':marks.append(len(history))
            elif op=='C':
                if marks:marks.pop()
            elif op=='R':
                if marks:
                    z=marks.pop()
                    while len(history)>z:i,j,oldi,oldj=history.pop();a[i]=oldi;a[j]=oldj
            elif op=='Q':i=int(next(it))-1;out.append(f'{a[i]} {len(marks)}')
            else:
                i=int(next(it))-1;j=int(next(it))-1;v=int(next(it));history.append((i,j,a[i],a[j]))
                if i!=j:v=min(v,a[i]);a[i]-=v;a[j]+=v
        out.append('FINAL '+' '.join(map(str,a)))
    elif num==743:
        K=int(next(it));s=next(it);count=total=0
        for i in range(n-K+1):
            for j in range(i+K,n-K+1):
                z=s[:i]+s[j:j+K]+s[i+K:j]+s[i:i+K]+s[j+K:]
                if int(z)%11==0:count+=1;total+=j-i
        return f'{count} {total}'
    elif num==744:
        m=int(next(it));K=int(next(it));S=next(it);words=[(next(it),int(next(it)),int(next(it))) for _ in range(m)];good=[]
        def enumerate_sequences(pos,ids,prev,score):
            if len(ids)==K:
                if pos==n:good.append((score,ids))
                return
            for i,(s,c,v) in enumerate(words,1):
                if c!=prev and S[pos:pos+len(s)]==s:enumerate_sequences(pos+len(s),ids+(i,),c,score+v)
        enumerate_sequences(0,(),2,0)
        if not good:return 'IMPOSSIBLE'
        best=max(v for v,ids in good);ids=[ids for v,ids in good if v==best];return f'{best} {len(ids)%101}\n'+' '.join(map(str,min(ids)))
    elif num==745:
        T=int(next(it));a=[(int(next(it)),int(next(it))) for _ in range(n)];times=set()
        for (x,v),(y,w) in itertools.combinations(a,2):
            if v!=w:
                time=Fraction(y-x,v-w)
                if 0<time<=T:times.add(time)
        events=[]
        for time in times:
            freq=collections.Counter(Fraction(x)+v*time for x,v in a)
            events.extend((time,p,c) for p,c in freq.items() if c>=2)
        if not events:return '0 0\n-'
        time,p,c=min(events);return f'{len(events)} {max(c for _,_,c in events)}\n{time.numerator} {time.denominator} {p.numerator} {p.denominator}'
    else:raise ValueError(code)
    return '\n'.join(out)

def small_input(num,rng):
    R=rng.randint;choice=rng.choice
    def rows(header,body):return header+'\n'+'\n'.join(' '.join(map(str,row)) if not isinstance(row,str) else row for row in body)+'\n'
    n=R(1,8)
    if num==700:
        l=R(1,n);return rows(f'{n} {l} {R(l,n)} {R(1,n)}',[''.join(choice('abc') for _ in range(n))])
    if num==701:
        w=R(1,6);return rows(f'{n} {w}',[''.join(choice('01') for _ in range(w)) for _ in range(n)])
    if num==702:return rows(f'{n} {R(1,20)}',[(R(1,6),R(1,5),R(0,7)) for _ in range(n)])
    if num==703:return rows('31',[(choice((1,1,2)),choice((R(1,10),10**9))) if i%3 else (3,R(1,12)) for i in range(31)])
    if num==704:return rows(f'{R(1,8)} 25',[list(range(21))+[R(0,40) for _ in range(4)]])
    if num==705:return rows(str(n),[(R(0,1),''.join(choice('ab') for _ in range(R(1,5)))) for _ in range(n)])
    if num==706:
        l=R(1,6);return rows(f'30 {l} {R(l,15)}',[('-',) if R(0,2)==0 else ('+',R(-2,2)) for _ in range(30)])
    if num==707:return rows(f'{n} {R(1,n)} {R(0,n)}',[''.join(choice('aebiou') for _ in range(n))])
    if num==708:return rows(f'{n} {R(1,n)} {R(0,6)}',[[R(-3,3) for _ in range(n)]])
    if num==709:
        n=R(3,8);a=[['0']*n for _ in range(n)]
        for i,j in itertools.combinations(range(n),2):a[i][j]=choice('01');a[j][i]=str(1-int(a[i][j]))
        return rows(str(n),[''.join(choice('01') for _ in range(n))]+[''.join(row) for row in a])
    if num==710:
        m=R(0,16);return rows(f'{n} {m}',[[R(0,1) for _ in range(n)]]+[(R(1,n),R(1,n),R(1,10)) for _ in range(m)])
    if num==711:return rows(str(n),[(R(0,10),R(0,10),R(1,6)) for _ in range(n)])
    if num==712:return rows(f'{n} {R(0,12)}',[(R(0,1),R(0,8)) for _ in range(n)]+[(i,R(1,i-1)) for i in range(2,n+1)])
    if num==713:return rows(f'{n} {choice((1,6,12,24,36))}',[(R(1,12),R(0,1)) for _ in range(n)])
    if num==714:return rows(str(n),[''.join(choice('aabc') for _ in range(n))])
    if num==715:return ''.join(choice('aabcdf') for _ in range(R(1,16)))+'\n'
    if num==716:return rows(f'{n} {R(1,6)}',[[R(-3,3) for _ in range(n)]])
    if num==717:return rows(str(n),[[R(-5,5) for _ in range(n)]]+[(i,R(1,i-1),R(0,1)) for i in range(2,n+1)])
    if num==718:
        cases=[]
        for _ in range(8):W=R(1,9);H=R(1,9);cases.append((W,H,R(0,W),R(0,H),R(-4,4),R(-4,4)))
        return rows('8',cases)
    if num==719:return rows(str(n),[[R(-2,2) for _ in range(n)]]+[(i,R(1,i-1),R(1,9)) for i in range(2,n+1)])
    if num==720:
        def expr(depth):
            if depth==0 or R(0,3)==0:return [choice('01?')]
            if R(0,3)==0:return expr(depth-1)+['!']
            return expr(depth-1)+expr(depth-1)+[choice('&|^')]
        e=expr(3);return rows(str(len(e)),[e])
    if num==721:
        h=R(1,5);w=R(1,5);d=R(0,4);return rows(f'{h} {w} {d} 5',[[R(0,8) for _ in range(w)] for _ in range(h)]+[(R(1,h),R(1,w),R(0,9)) for _ in range(d)]+[str(x) for x in (0,2,5,8,12)])
    if num==722:
        edges=[(u,v) for u in range(1,n+1) for v in range(1,n+1) if u!=v and R(0,4)==0];return rows(f'{n} {len(edges)}',[(R(0,1),R(0,2),R(0,2)) for _ in range(n)]+edges)
    if num==723:
        n=R(2,7);m=R(0,15);return rows(f'{n} {m} {R(0,4)}',[(R(1,n),R(1,n),R(1,8),R(0,1)) for _ in range(m)])
    if num==724:
        h=R(1,6);w=R(1,6);return rows(f'{h} {w}',[''.join(choice('000123') for _ in range(w)) for _ in range(h)])
    if num==725:return rows(f'{n} {R(0,4)}',[(0 if i==1 else R(1,i-1),R(-6,6),R(0,3)) for i in range(1,n+1)])
    if num==726:
        h=R(1,3);w=R(1,4);a=[[R(0,1) for _ in range(w)] for _ in range(h)];return rows(f'{h} {w}',[[sum(row) for row in a],[sum(a[i][j] for i in range(h)) for j in range(w)]]+[[R(-5,5) for _ in range(w)] for _ in range(h)])
    if num==727:
        s=''.join(choice('00123') for _ in range(n));a,b=choice((1,2,3,7)),choice((1,2,5,11));return rows(str(n),[s,(a,R(0,a-1),b,R(0,b-1))])
    if num==728:return rows(f'{n} {R(0,12)}',[(R(-5,5),R(-2,2)) for _ in range(n)])
    if num==729:return f'{R(0,8)} {R(0,8)} {R(1,8)}\n'
    if num==730:
        k=R(1,n);return rows(f'{n} {k} {R(0,k-1)}',[''.join(choice('abc') for _ in range(n))])
    if num==731:return rows(f'{R(1,4)} 20',[(choice('RW'),R(0,6)) for _ in range(20)])
    if num==732:
        n=R(1,8);a=[]
        for _ in range(n):p=choice((1,2,3,4,5,6,7,8,9,10,12));a.append((p,R(0,p-1)))
        return rows(f'{n} {R(1,n)} {R(0,100)}',a)
    if num==733:
        secret=''.join(choice('001234') for _ in range(4));h=[]
        for _ in range(R(0,4)):
            g=''.join(choice('001234') for _ in range(4));A=sum(x==y for x,y in zip(g,secret));B=sum(min(g.count(str(d)),secret.count(str(d))) for d in range(10))-A;h.append((g,A,B))
        return rows(str(len(h)),h)
    if num==734:
        n=R(3,8);return rows(f'{n} 8',[(R(-4,4),R(-4,4)) for _ in range(n)]+[(R(-4,4),R(-4,4),R(1,n)) for _ in range(8)])
    if num==735:
        n=R(2,6);m=R(0,12);k=R(0,3);return rows(f'{n} {m} {k}',[(R(1,n),R(1,n),R(0,k)) for _ in range(m)])
    if num==736:
        n=R(1,5);b=R(0,5);L=R(0,20);Rmax=R(L,80);x=R(0,60);con=[]
        for _ in range(n):m=R(1,10);con.append((m,x%m-m*R(0,3)))
        blocks=[]
        for _ in range(b):s=R(0,100);blocks.append((s,R(s,110)))
        return rows(f'{n} {b} {L} {Rmax}',con+blocks)
    if num==737:return rows(str(n),[[choice((1,1,2,2,4,6,8,12)) for _ in range(n)]])
    if num==738:
        m=R(0,8);rules=[(''.join(choice('01') for _ in range(R(0,4))) or '-',R(0,1),R(-5,5)) for _ in range(m)];ops=[]
        for _ in range(12):ops.append(('T',R(1,m)) if m and R(0,2)==0 else ('Q',''.join(choice('01') for _ in range(32))))
        return rows(f'{m} 12',rules+ops)
    if num==739:return f'{R(1,250)} {R(1,250)}\n'
    if num==740:
        return rows(f'{n} {R(0,n)}',[(R(0,1),choice((0,31,31,15,23,30)),R(-6,6)) for _ in range(n)]+[[R(-6,6) for _ in range(n-i-1)] for i in range(n-1)])
    if num==741:return rows(f'{n} 5',[(R(-3,3),R(-3,3),choice((-1,1))) for _ in range(n)]+[(choice('XY'),choice('+-'),R(-3,3)) for _ in range(5)])
    if num==742:
        ops=[]
        for _ in range(30):
            op=choice('BBCRMQ');ops.append((op,R(1,n),R(1,n),R(0,10)) if op=='M' else (op,R(1,n)) if op=='Q' else (op,))
        return rows(f'{n} 30',[[R(0,10) for _ in range(n)]]+ops)
    if num==743:return rows(f'{n} {R(1,n)}',[''.join(choice('000123456789') for _ in range(n))])
    if num==744:
        n=R(1,10);m=R(1,6);words=rng.sample(['0','1','00','01','10','11','000','111'],m);return rows(f'{n} {m} {R(0,6)}',[''.join(choice('01') for _ in range(n))]+[(s,R(0,1),R(-5,5)) for s in words])
    if num==745:
        xs=rng.sample(range(-10,11),n);return rows(f'{n} {R(1,8)}',[(x,R(-5,5)) for x in xs])
    raise ValueError(num)

ORACLE_REASON={700:'Counter enumerates all nonempty substrings including overlaps',701:'enumerate every row pair and column pair; sum four literal corners',702:'generate each individual machine completion event and sort',703:'set simulation and maximal consecutive integer runs',704:'independent recursive minimax over stone count and forbidden move',705:'all ordered string position pairs; literal strict endswith',706:'after each operation enumerate every slice and sum its values',707:'all endpoint pairs with literal interior vowel counts',708:'all eligible slices with built-in max and min',709:'all vertex triples; each must have exactly one outgoing internal win',710:'Bellman-Ford on two visit-count layers',711:'scan waiting jobs and evaluate their current priorities directly',712:'all endpoint pairs and explicit common-neighbor intersection',713:'all position pairs using math.lcm',714:'construct every rotation and every deletion; compare reverse',715:'all substrings with literal letter counts and adjacent comparisons',716:'all slices, explicit strict interior peak count and sum',717:'all nonempty vertex subsets; flood connectivity and enumerate boundary edges',718:'advance integral seconds until leaving the closed rectangle',719:'construct every unique tree path then count signs and sum edge weights',720:'enumerate all independent question-mark assignments and execute postfix',721:'flood from all exits at every candidate height, independent of Dijkstra',722:'rescan all live incoming edges at the start of each simultaneous round',723:'enumerate capacities and use Bellman-Ford for switch counts',724:'enumerate all rectangles and sum literal frame and interior cells',725:'walk parent chains to identify every subtree independently',726:'enumerate all binary grids, test row/column quotas and each adjacent square',727:'perform every literal character swap then recompute both checksums',728:'simulate all integer observation times for every pair',729:'recursive exhaustive finite minimax, enumerate all first moves',730:'enumerate slices, count a and b and test length remainder',731:'explicit oldest-to-newest list with separate dirty-page set',732:'simulate every second from 1 to the small T',733:'enumerate 10000 strings and greedily match unused digit positions',734:'exact signed cross products with boundary priority and independent polygon rebuild',735:'enumerate switch states and Floyd-Warshall distances',736:'enumerate every integer in the small allowed range',737:'all slices, full gcd and set reconstruction',738:'collect matching active rules then choose maximum length and minimum id',739:'enumerate every possible base and construct full digit lists',740:'all K-combinations, recompute all five skills and all unordered scores',741:'keep individual signed points and physically remove opposite-sign pairs',742:'operation undo log and nested checkpoint indices rather than snapshot arrays',743:'swap literal blocks and convert the result to a decimal integer modulo 11',744:'enumerate all matching alternating codeword sequences without memoization',745:'enumerate exact pair times, then group all physical object positions at each time'}

def make_checks():
    rng=random.Random(70074520261108);checks=[]
    for num in range(700,746):
        code=f'b{num}';seen={s['input'].strip() for s in SOURCE[code]['samples']};made=0
        print('generating',code,flush=True)
        while made<20:
            data=small_input(num,rng)
            if data.strip() in seen:continue
            seen.add(data.strip());expected=oracle(code,data);checks.append(dict(code=code,input=data,output=expected,reason=f'Deterministic seed 70074520261108, independent case {made+1}: '+ORACLE_REASON[num]));made+=1
    checks.extend(certificates())
    return checks

def certificates():
    """Large bounds with algebraic or explicit exact certificates, never solver outputs."""
    a=[]
    def put(num,data,output,reason):a.append(dict(code=f'b{num}',input=data,output=str(output),reason='Exact boundary certificate: '+reason))
    put(700,'100000 1 100000 2\n'+'a'*100000+'\n',1,'For a^n, a^l occurs n-l+1 times; only length n-1 occurs twice.')
    grid=['0'*300]*150+['0'*150+'1'*150]*150
    put(701,'300 300\n'+'\n'.join(grid)+'\n',22500**2,'Only cross-type row pairs work (150*150), each with 150*150 unequal-XOR column pairs.')
    put(702,'1 1000000000\n1000000 1 1000000\n',1999999999000000,'Single-item blocks: X*p+(X-1)*r; last rest not needed.')
    put(703,'10\n1 1\n1 2\n1 1000000000\n1 1000000000\n3 2\n2 1\n2 1\n3 2\n2 1000000000\n3 1\n','2\n0\n1','Duplicate insertion/deletion are no-ops; separated maximum coordinate never joins [1,2].')
    put(703,'30000\n'+''.join(f'1 {i}\n' for i in range(1,10001))+''.join(f'3 {10000+i%2}\n' for i in range(20000)),
        '\n'.join('10000' if i%2==0 else '0' for i in range(20000)),
        'Exactly one interval [1,10000]; queries alternate including and excluding its entire length, at q=30000.')
    put(704,'1 4\n0 1 999999 1000000\n','LWWW','With k=1 any positive opening takes 1 then opponent cannot repeat 1, even with stones left.')
    put(705,'4\n0 a\n1 a\n1 a\n0 a\n',0,'All equal-length strings, so no strict suffix despite mixed colors.')
    put(706,'6 2 2\n+ 1000000000\n+ -1000000000\n+ 1000000000\n-\n+ 0\n-\n','0\n1\n2\n1\n1\n1','Only adjacent pairs of opposite billion-valued numbers sum to zero; exercise branch after undo.')
    put(706,'40000 1 40000\n'+('+ 0\n')*40000,'\n'.join(str(i*(i+1)//2) for i in range(1,40001)),
        'Every nonempty slice after each zero append sums to zero; operation i has i(i+1)/2 slices.')
    put(707,'200000 200000 0\n'+'b'*200000+'\n',200000*199999//2,'Every pair of consonant b endpoints has zero interior vowels; exceeds signed 32-bit count.')
    put(708,'200000 1 0\n'+' '.join(['-1000000000']*200000)+'\n',200000*200001//2,'Every nonempty slice of the constant array has amplitude zero.')
    put(709,'4\n1000\n0111\n0011\n0001\n0000\n',0,'Transitive tournament has no directed three-cycle.')
    put(710,'4 3\n1 0 0 0\n1 2 1000000000\n2 3 1000000000\n3 4 1000000000\n',3000000000,'Unique three-edge path, only start is marked; distance exceeds signed 32-bit.')
    put(711,'3\n0 0 1000000000\n0 0 1000000000\n0 0 1000000000\n','3000000000 3000000000','Three tied jobs execute by input order; waits 0,1e9,2e9.')
    put(712,'1 2000000000\n0 1000000000\n',0,'One vertex has no pair at distance two.')
    put(713,'4 1000000000\n1000000000 0\n1000000000 0\n1000000000 1\n999999999 1\n',2,'Only the two color-0 copies can pair with color-1 Q; Q-1 does not divide Q.')
    put(714,'2000\n'+'a'*2000+'\n','2000 4000000','All 2000 rotations and all 2000 deletion indices per rotation yield a palindrome.')
    put(715,'a'*200000+'\n',0,'Every slice length>=2 contains equal adjacent letters; singleton has an odd frequency.')
    put(716,'12000 1000\n'+' '.join(['0']*12000)+'\n',0,'Flat sequence has no strict peak, regardless of divisibility.')
    put(717,'1800\n'+' '.join(['0']*1800)+'\n'+'\n'.join(f'1 {i} {i%2}' for i in range(2,1801))+'\n','0 809100','Star has 900 color-0 and 899 color-1 edges; each cross-color cut pair gives one zero-valued middle set.')
    put(718,'3\n2000000000 2000000000 0 0 1 0\n2000000000 2000000000 0 0 -2000000000 -2000000000\n1 1 0 0 0 0\n','2000000001 2000000001 0 R\n1 -2000000000 -2000000000 LB\nNEVER','First case remains on right edge at t=2e9; next tick leaves. Second simultaneously crosses L and B.')
    put(719,'1700\n'+' '.join(['0']*1700)+'\n'+'\n'.join(f'{i} {i+1} 1000000000' for i in range(1,1700))+'\n','0 0','All-equal path traverses up to 1699 edges but contains neither a rise nor a fall.')
    put(720,'1\n1\n','1 0 1','No question marks: one empty assignment, always true. Regression for boolean numeric formatting.')
    put(721,'3 3 2 3\n1000000000 1000000000 1000000000\n1000000000 0 1000000000\n1000000000 1000000000 1000000000\n2 2 9\n2 2 4\n3\n8\n1000000000\n','3\n4\n4','The lower of two center drains fixes E(center)=4; all boundary depths zero.')
    put(722,'1500 1499\n'+'0 1 0\n'*1500+'\n'.join(f'{i} {i+1}' for i in range(1,1500))+'\n',f'0 0 1500 {1500*1501//2}','A support chain loses exactly one vertex per synchronous round; sum is 1+...+1500.')
    put(723,'2 2 0\n1 1 1000000000 0\n1 2 999999999 1\n','999999999 0','The direct color-1 edge is a zero-switch walk; a self-loop cannot improve its bottleneck.')
    put(724,'120 120\n'+('0'*120+'\n')*120,(119*118//2)**2,'Each dimension has (N-1)(N-2)/2 contiguous ranges of length>=3; every zero rectangle qualifies.')
    put(725,'1 0\n0 -1000000000 0\n','0 0 0','Nonempty singleton subtree has one color, so K=0 is impossible.')
    put(726,'6 6\n6 6 6 6 6 6\n6 6 6 6 6 6\n'+('0 0 0 0 0 0\n')*6,'0 0\n-','Quotas force an all-ones 6x6 grid, which contains prohibited full adjacent squares.')
    # Independent exhaustive *cell* search, not the lesson row-mask memoization.
    grid=[0]*36;rowleft=[3]*6;colleft=[3]*6;matrix_count=0;first_grid=None
    def enumerate_cells(pos):
        nonlocal matrix_count,first_grid
        if pos==36:
            matrix_count+=1
            if first_grid is None:first_grid=tuple(grid)
            return
        r,c=divmod(pos,6)
        for bit in (0,1):
            rr=rowleft[r]-bit;cc=colleft[c]-bit
            if not 0<=rr<=5-c or not 0<=cc<=5-r:continue
            if bit and r and c and grid[pos-1] and grid[pos-6] and grid[pos-7]:continue
            grid[pos]=bit;rowleft[r]=rr;colleft[c]=cc
            enumerate_cells(pos+1)
            rowleft[r]+=bit;colleft[c]+=bit
    enumerate_cells(0)
    assert matrix_count==170452
    min_matrix='\n'.join(''.join(map(str,first_grid[r*6:(r+1)*6])) for r in range(6))
    put(726,'6 6\n3 3 3 3 3 3\n3 3 3 3 3 3\n'+('0 0 0 0 0 0\n')*6,
        f'{matrix_count} 0\n'+min_matrix,
        'Independent row-major cell backtracking enumerates all quota-valid 6x6 grids, forbids a full square when filling its lower-right corner, and records the first lex grid. No memoized row states are used.')
    put(727,'1\n0\n1 0 1 0\n','0\n-','Even a valid original checksum cannot be used without two different swap positions.')
    put(728,'3000 1000000000\n'+('0 0\n')*3000,'4498500 0','All labeled markers coincide forever, each of C(3000,2) pairs first meets at time zero.')
    put(729,'0 70 70\n','WIN 1 B 70','Only taking all 70 wins in a single nonempty pile with K=70; any smaller take leaves a winning move.')
    put(730,'200000 1 0\n'+'c'*200000+'\n',200000*200001//2,'All nonempty slices have equal zero counts of a,b and length mod1=0.')
    put(731,'50 0\n','0 0 0 0','No accesses imply no hit, miss, writeback or dirty page.')
    put(732,'2 2 1000000000000000000\n1 0\n1 0\n','1000000000000000000 1','Duplicate period-1 machines both ring every positive second; count each time once.')
    put(733,'2\n0000 4 0\n0000 0 0\n','0 -1','Mutually inconsistent exact-match hints admit no password.')
    put(734,'3 2\n-1000000000 -1000000000\n-1000000000 1000000000\n1000000000 -1000000000\n-1 -1 2\n0 0 2\n','-1 0\nB 0','Clockwise large triangle has winding -1; (0,0) on diagonal is boundary, deleted segment lies on bottom edge.')
    put(735,'2 1 15\n1 2 0\n','32768 32768','All fifteen unused switches remain distinct; always-open edge gives distance 1 in every state.')
    put(736,'5 0 0 1000000000000000000\n999983 0\n999979 0\n999961 0\n999959 0\n999953 0\n','1 0','Pairwise distinct prime moduli near one million yield product above 1e18; only zero falls in range. Exercises >64-bit CRT period.')
    put(737,'4000\n'+' '.join(['1']*4000)+'\n',f'{4000*4001//2} {4000*4001*4002//6}','All slices have gcd1 and one distinct value; length sum is n(n+1)(n+2)/6.')
    put(738,'0 2\nQ '+'0'*32+'\nQ '+'1'*32+'\n','0 0\n0 0\nTOTAL 0 0','No rules: even both extreme binary addresses must miss.')
    put(739,'1000000000000 1\n','0 0','B=1 is one digit in every base>=2, so no base can satisfy the two-digit condition; tests maximum sqrt search.')
    put(740,'2 2\n0 31 -1000000000\n1 31 -1000000000\n-1000000000\n','-3000000000 1\n1 2','Unique team satisfies both skill copies and both types, but optimal score is negative and below 32-bit.')
    put(740,'20 10\n'+''.join(f'{int(i>=10)} 31 0\n' for i in range(20))+''.join(' '.join(['0']*(19-i))+'\n' for i in range(19)),
        '0 184754\n1 2 3 4 5 6 7 8 9 11',
        'All C(20,10) teams tie except the two monochromatic choices; each selected person has all skills. The lex first mixed team is 1..9,11.')
    put(741,'4 2\n0 0 1\n0 0 1\n0 0 -1\n2 0 1\nX + 1\nY - 0\n','0 0 1','Initial multiplicity cancels one pair at t0 leaving +1, then t1 cancels last two; empty t2 cannot update last time.')
    put(742,'1 6\n1000000000\nC\nR\nB\nM 1 1 1000000000\nQ 1\nR\n','1000000000 1\nFINAL 1000000000','Unmatched commit/rollback do nothing, self-transfer preserves count, and rollback removes the save layer.')
    N=50000;K=1;count=N*(N-1)//2;dist=N*(N-1)*(N+1)//6
    put(743,f'{N} {K}\n'+'0'*N+'\n',f'{count} {dist}','All singleton swaps preserve zero; sum of all j-i over i<j is n(n-1)(n+1)/6, exceeding 32-bit.')
    put(744,'3 1 0\n000\n0 0 -1000000000\n','IMPOSSIBLE','Zero codewords cannot cover a nonempty input, even though a matching word exists.')
    put(744,'3 2 3\n010\n0 0 -1000000000\n1 1 -1000000000\n','-3000000000 1\n1 2 1','Unique alternating decode contains three negative billion-point words, so score needs 64-bit.')
    # Eighteen words alternate categories. Length minima are 1,5 in either
    # orientation, so base total is 54. The remaining six length units are
    # distributed across 18 words, each accepting 0..3 extra units.
    polynomial=[1]
    for _ in range(18):
        product=[0]*(len(polynomial)+3)
        for i,v in enumerate(polynomial):
            for extra in range(4):product[i+extra]+=v
        polynomial=product
    exact_count=2*polynomial[6]
    assert exact_count==195738 and exact_count%101==0
    words=''.join(f'{"0"*i} {int(i>=5)} 0\n' for i in range(1,9))
    sequence=[1,5]*8+[4,8]
    put(744,'60 8 18\n'+'0'*60+'\n'+words,'0 0\n'+' '.join(map(str,sequence)),
        'Coefficient of z^6 in 2*(1+z+z^2+z^3)^18 is 195738, divisible by101 but nonzero. Lex minimum leaves all six extra length units for the last two words; categories alternate.')
    put(745,'4 1\n-4 6\n-2 0\n3 2\n4 -1\n','2 2\n1 3 -2 1','Pairs (1,2) at t=1/3,x=-2 and (3,4) at t=1/3,x=11/3; cross-group meetings all after T. Earliest time tie chooses smaller position.')
    return a

def verify(checks):
    from concurrent.futures import ThreadPoolExecutor,as_completed
    failures=[];summary=[];started=time.time();history=[]
    report_file=HERE/'results-700-745.json'
    if report_file.exists():
        previous=json.loads(report_file.read_text(encoding='utf-8'))
        history=previous.get('resolvedFailureHistory',[])+previous.get('failures',[])
    with tempfile.TemporaryDirectory(prefix='lessons-700-745-',dir='/tmp') as temp:
        temp=pathlib.Path(temp)
        def test(lesson):
            code=lesson['code'];cpp=temp/(code+'.cpp');py=temp/(code+'.py');exe=temp/code
            cpp.write_text(lesson['cpp']);py.write_text(lesson['python']);errors=[];timings={};begin=time.time()
            build=subprocess.run(['g++','-std=c++17','-O2','-pipe',str(cpp),'-o',str(exe)],capture_output=True,text=True,timeout=120)
            if build.returncode:return dict(code=code,compile=False,failures=[dict(code=code,phase='compile',stderr=build.stderr)],duration=time.time()-begin)
            cases=[dict(x,reason='public sample',kind='public') for x in SOURCE[code]['samples']]+[dict(x,kind='independent') for x in checks if x['code']==code]
            def norm(x):return '\n'.join(line.rstrip() for line in x.replace('\r\n','\n').splitlines()).rstrip()
            for lang,cmd in [('cpp',[str(exe)]),('python',[sys.executable,str(py)])]:
                elapsed=0
                for i,case in enumerate(cases):
                    before=time.time()
                    try:
                        p=subprocess.run(cmd,input=case['input'],capture_output=True,text=True,timeout=30)
                        if p.returncode or norm(p.stdout)!=norm(case['output']):errors.append(dict(code=code,language=lang,index=i,kind=case['kind'],input=case['input'],expected=case['output'],actual=p.stdout,stderr=p.stderr,reason=case['reason']))
                    except subprocess.TimeoutExpired:errors.append(dict(code=code,language=lang,index=i,input=case['input'],expected=case['output'],error='timeout 30s'))
                    elapsed+=time.time()-before
                timings[lang]=elapsed
            return dict(code=code,compile=True,publicSamples=len(SOURCE[code]['samples']),independentCases=len(cases)-len(SOURCE[code]['samples']),executions=2*len(cases),seconds=timings,failures=errors,duration=time.time()-begin)
        with ThreadPoolExecutor(max_workers=4) as pool:
            for future in as_completed([pool.submit(test,x) for x in LESSONS]):
                result=future.result();summary.append(result);failures.extend(result['failures']);print(result['code'],len(result['failures']),'failures',flush=True)
                report=dict(tutorials=len(LESSONS),tested=len(summary),publicSamplesPerLanguage=sum(len(SOURCE[x['code']]['samples']) for x in LESSONS),independentCasesPerLanguage=len(checks),failures=failures,resolvedFailureHistory=history,problems=sorted(summary,key=lambda x:x['code']),elapsedSeconds=time.time()-started,environment='WSL kali-linux; Linux g++ -std=c++17 -O2; Python '+sys.version.split()[0],seed=70074520261108)
                (HERE/'results-700-745.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print('TOTAL',len(summary),'lessons;',len(failures),'failures',flush=True)
    return not failures

def materialize():
    target=ROOT/'src/lib/newProblemLessons/data/nov08-700-745.json'
    target.write_text(json.dumps(LESSONS,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

if __name__=='__main__':
    materialize()
    checks=make_checks()
    (HERE/'checks-700-745.json').write_text(json.dumps(checks,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print('authored',len(LESSONS),'lessons;',len(checks),'independent cases',flush=True)
    if '--verify' in sys.argv:sys.exit(0 if verify(checks) else 1)
