"""Authoring source and independent Linux verification for national1.
Run --build natively to regenerate JSON; run --verify in WSL/Linux with g++.
--verify reads the checked-in lesson JSON, checks public samples and independent
oracles, and never writes generated programs outside a Linux /tmp directory.
"""
import json, pathlib, sys, textwrap, random, itertools, subprocess, tempfile, math
ROOT = pathlib.Path(__file__).resolve().parents[3]
MANIFEST = ROOT/'scripts/fixtures/new-problem-lessons/source.json'
SOURCE = {x['code']:x for x in json.loads(MANIFEST.read_text(encoding='utf-8-sig'))['problems'] if 'a877'<=x['code']<='a939'}
LESSONS=[]
CHECKS=[]
def check(code, inp, out, reason):
    CHECKS.append(dict(code=code,input=inp,output=str(out),reason=reason))
def save():
    if '--build' not in sys.argv: return
    (ROOT/'src/lib/newProblemLessons/data/national1.json').write_text(json.dumps(LESSONS,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    (ROOT/'scripts/fixtures/new-problem-lessons/national1-checks.json').write_text(json.dumps(CHECKS,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def add(code,topic,level,concept,goal,explanation,complexity,pitfall,steps,cpp,py):
    s=SOURCE[code]; sample=s['samples'][0]
    py=py.replace("'\n'", "'\\n'")
    if 'read().split()' in py:
        complexity+=' Python read().split() 另需 O(I) 輸入文字與詞元暫存，I 為總輸入大小。'
    trace=[]
    for title,description,cells,variables in steps:
        trace.append(dict(title=title,description=description,cells=list(map(str,cells)),active=list(range(len(cells))),variables=[[str(k),str(v)] for k,v in variables]))
    LESSONS.append(dict(code=code,title=s['title'].split('. ',1)[-1],topic=topic,level=level,concept=concept,goal=goal,explanation=explanation,complexity=complexity,pitfall=pitfall,sampleInput=sample['input'],sampleOutput=sample['output'],traceLabel='教學示意（以步驟描述中的輸入為準）',trace=trace,cpp='#include <bits/stdc++.h>\nusing namespace std;\n'+textwrap.dedent(cpp).strip()+'\n',python=textwrap.dedent(py).strip()+'\n'))
    save()

add('a877','graphs','medium','連通分量與字典序貪心','把同一可交換區塊的最大值移到最前位置。',[
'把位置當作頂點、允許交換當作無向邊，以並查集合併。沿一條路徑來回交換可交換兩端，因此每個連通分量內可實現任意排列；不同分量的值不能互換。',
'依位置從小到大收集各分量，再將其數值由大到小填回。若最前方尚未決定的位置沒有放該分量剩餘最大值，換入最大值會令字典序嚴格增加，故逐位貪心正確。'],
'時間 O((n+m)α(n)+n log n)，空間 O(n)；輸入也需讀取 m 條邊。','交換的是位置，不能依數值合併。Python 逐行讀取邊，避免將百萬條邊全部存下。',[
('建立分量','示意排列為 1 2 3 4，允許交換 1 與 3。',[1,2,3,4],[('分量','{1,3},{2},{4}')]),
('取出數值','位置 1、3 的數值為 1、3，降冪後是 3、1。',[3,1],[('可重排位置','1,3')]),
('依序填回','最左位置放最大值，其餘獨立分量保持原值。',[3,2,1,4],[('字典序','最大')])],
'''int main(){ios::sync_with_stdio(false);cin.tie(nullptr);int n,m;cin>>n>>m;vector<int> p(n),f(n),sz(n,1);iota(f.begin(),f.end(),0);for(int &x:p)cin>>x;auto find=[&](int x){while(x!=f[x])x=f[x]=f[f[x]];return x;};while(m--){int a,b;cin>>a>>b;a=find(a-1);b=find(b-1);if(a!=b){if(sz[a]<sz[b])swap(a,b);f[b]=a;sz[a]+=sz[b];}}vector<vector<int>> g(n);for(int i=0;i<n;i++)g[find(i)].push_back(i);for(auto &v:g){vector<int>w;for(int i:v)w.push_back(p[i]);sort(w.rbegin(),w.rend());for(int j=0;j<(int)v.size();j++)p[v[j]]=w[j];}for(int i=0;i<n;i++)cout<<p[i]<<(i+1==n?'\\n':' ');}''',
'''import sys
from array import array
f=sys.stdin.buffer
n,m=map(int,f.readline().split()); p=list(map(int,f.readline().split()))
parent=array('i',range(n)); size=array('i',[1])*n
def find(x):
    while parent[x]!=x:
        parent[x]=parent[parent[x]]; x=parent[x]
    return x
for _ in range(m):
    a,b=map(int,f.readline().split()); a=find(a-1); b=find(b-1)
    if size[a]<size[b]: a,b=b,a
    if a!=b: parent[b]=a; size[a]+=size[b]
groups={}
for i in range(n): groups.setdefault(find(i),[]).append(i)
for ids in groups.values():
    vals=sorted((p[i] for i in ids),reverse=True)
    for i,x in zip(ids,vals): p[i]=x
print(*p)''')

add('a878','search','easy','字典序枚舉排列','完整檢查八頭牛的相鄰限制。',[
'先把八個名字按字典序排序，依此順序枚舉所有 8! 個排列。建立每頭牛在候選排列的位置表。',
'對每條限制檢查兩頭牛的位置差絕對值是否為 1。第一個全部通過的排列必定最小，因為此前所有更小的排列都已被排除。'],
'時間 O(8!·(8+N))，空間 O(8+N)。','beside 表示位置差恰為 1，不是單純先後順序。',[
('先排序','名字按照字典序排列。',['Beatrice','Belinda','Bella','Bessie','Betsy','Blue','Buttercup','Sue'],[('候選數','40320')]),
('檢查限制','獨立單限制示意：只要求 Beatrice 緊鄰 Sue，排序後的第一個排列不合法。',['Beatrice','Belinda','Bella','Bessie','Betsy','Blue','Buttercup','Sue'],[('位置差','7')]),
('找到最早合法者','把 Sue 接在 Beatrice 後，其餘照字典序即可。',['Beatrice','Sue','Belinda','Bella','Bessie','Betsy','Blue','Buttercup'],[('此示意限制數','1')])],
'''int main(){int n;cin>>n;vector<string>a={"Bessie","Buttercup","Belinda","Beatrice","Bella","Blue","Betsy","Sue"};sort(a.begin(),a.end());vector<pair<string,string>> e;while(n--){string x,y,t;cin>>x>>t>>t>>t>>t>>y;e.push_back({x,y});}do{map<string,int>pos;for(int i=0;i<8;i++)pos[a[i]]=i;bool ok=1;for(auto [x,y]:e)if(abs(pos[x]-pos[y])!=1)ok=0;if(ok){for(auto x:a)cout<<x<<'\\n';break;}}while(next_permutation(a.begin(),a.end()));}''',
'''import sys,itertools
f=sys.stdin; n=int(f.readline()); edges=[]
for _ in range(n):
    t=f.readline().split(); edges.append((t[0],t[-1]))
names=sorted('Bessie Buttercup Belinda Beatrice Bella Blue Betsy Sue'.split())
for p in itertools.permutations(names):
    pos={x:i for i,x in enumerate(p)}
    if all(abs(pos[x]-pos[y])==1 for x,y in edges):
        print(*p,sep='\n'); break''')

add('a879','graphs','medium','邊權排序與並查集','找出首次出現足夠大連通區塊的高度差。',[
'每格是頂點，只建立向右、向下的相鄰邊，權重是高度差絕對值。按權重遞增合併兩端分量，並維護分量大小。',
'處理完權重不超過 K 的邊後，並查集恰等於拖拉機成本 K 能互達的區塊。第一個大小達到 (N²+1)//2 的時刻就是答案；此前沒有起點能走訪足夠多格。N=1 時不需跨邊，答案為 0。'],
'令 V=N²、E=2N(N−1)，時間 O(E log E)，空間 O(V+E)。','至少一半要向上取整；成本是單次跨邊的最大差，不是路徑總和。',[
('建立高度圖','示意 2×2 高度：0 2 / 5 8。',[0,2,5,8],[('目標格數','2')]),
('最小邊權','最小高度差是頂列的 2。',['0↔2'],[('K','2')]),
('達標停止','合併後已有兩格互通，任何更小 K 都只能停在一格。',[0,2],[('答案','2')])],
'''int main(){int n;cin>>n;int v=n*n;vector<int>a(v),p(v),sz(v,1);for(auto &x:a)cin>>x;iota(p.begin(),p.end(),0);vector<array<int,3>>e;for(int i=0;i<v;i++){if(i%n+1<n)e.push_back({abs(a[i]-a[i+1]),i,i+1});if(i+n<v)e.push_back({abs(a[i]-a[i+n]),i,i+n});}sort(e.begin(),e.end());auto find=[&](int x){while(x!=p[x])x=p[x]=p[p[x]];return x;};int ans=0,need=(v+1)/2;if(need>1)for(auto [w,u,t]:e){u=find(u);t=find(t);if(u==t)continue;if(sz[u]<sz[t])swap(u,t);p[t]=u;sz[u]+=sz[t];if(sz[u]>=need){ans=w;break;}}cout<<ans<<'\\n';}''',
'''import sys
n,*a=map(int,sys.stdin.buffer.read().split()); v=n*n; need=(v+1)//2
p=list(range(v)); size=[1]*v; edges=[]
for i in range(v):
    if i%n+1<n: edges.append((abs(a[i]-a[i+1]),i,i+1))
    if i+n<v: edges.append((abs(a[i]-a[i+n]),i,i+n))
def find(x):
    while p[x]!=x: p[x]=p[p[x]]; x=p[x]
    return x
ans=0
if need>1:
    edges.sort()
    for w,u,t in edges:
        u=find(u); t=find(t)
        if u==t: continue
        if size[u]<size[t]: u,t=t,u
        p[t]=u; size[u]+=size[t]
        if size[u]>=need: ans=w; break
print(ans)''')

add('a880','dp','hard','非交叉配對的區間 DP','以最左字元的配對選擇分解 RNA。',[
'令 dp[l][r] 是閉區間的最佳鍵結數。最左字元可不配對，得到 dp[l+1][r]；也可與區間中某個可互補位置 k 配對，得到 1+dp[l+1][k−1]+dp[k+1][r]。空區間值為 0。',
'非交叉限制使 (l,k) 內部與右側的鍵結互不相干，反之兩個子區間的合法解加上 (l,k) 仍合法。因此枚舉這些情況完整且不高估。由短區間往長區間計算，相鄰位置也可以配對。'],
'最壞時間 O(L³)，空間 O(L²)。Python 僅枚舉互補位置，但長度 600 的最壞輸入仍有立方級成本。','不是任意配對計數；不能讓兩條鍵結交叉，也沒有至少隔幾個字元的限制。',[
('長度一','示意 ACGU：單字元不能配對。',['A','C','G','U'],[('dp[i][i]','0')]),
('內層配對','C 與 G 相鄰，可形成一條鍵結。',['C—G'],[('dp[1][2]','1')]),
('外層包住','A 與 U 配對，加上 C—G，共兩條且不交叉。',['A( C—G )U'],[('dp[0][3]','2')])],
'''int main(){string s;cin>>s;int n=s.size();vector<vector<int>>d(n+1,vector<int>(n+1));auto ok=[](char a,char b){return (a=='A'&&b=='U')||(a=='U'&&b=='A')||(a=='C'&&b=='G')||(a=='G'&&b=='C');};for(int l=n-1;l>=0;l--)for(int r=l+1;r<n;r++){d[l][r]=d[l+1][r];for(int k=l+1;k<=r;k++)if(ok(s[l],s[k]))d[l][r]=max(d[l][r],1+(k>l+1?d[l+1][k-1]:0)+(k<r?d[k+1][r]:0));}cout<<d[0][n-1]<<'\\n';}''',
'''import sys,bisect
s=sys.stdin.buffer.readline().strip().decode(); n=len(s); d=[[0]*(n+1) for _ in range(n+1)]
mate={'A':'U','U':'A','C':'G','G':'C'}; positions={c:[] for c in mate}
for i,c in enumerate(s): positions[c].append(i)
for l in range(n-1,-1,-1):
    row=d[l]; inner=d[l+1]; ks=positions[mate[s[l]]]; ks=ks[bisect.bisect_right(ks,l):]
    for r in range(l+1,n):
        best=inner[r]
        for k in ks:
            if k>r: break
            value=1+inner[k-1]+(d[k+1][r] if k<r else 0)
            if value>best: best=value
        row[r]=best
print(d[0][n-1] if n else 0)''')

FONT=['00110000 01001000 10000100 10000100 10000100 01001000 00110000 00000000','00001000 00011000 00001000 00001000 00001000 00001000 00011100 00000000','00110000 01001000 01001000 00010000 00100000 01000000 01111000 00000000','00111000 01000100 00000100 00111000 00000100 01000100 00111000 00000000','00011100 00100100 01000100 01000100 01000100 01111110 00000100 00000000','01111100 01000000 01111000 00000100 00000100 01000100 00111000 00000000','00110000 01001000 01000000 01110000 01001000 01001000 00110000 00000000','11111100 10001100 00001000 00010000 00110000 00110000 00110000 00000000','00110000 01001000 01001000 00110000 01001000 01001000 00110000 00000000','00110000 01001000 01001000 00111000 00001000 01001000 00110000 00000000']
font_cpp='{'+','.join('"'+x.replace(' ','')+'"' for x in FONT)+'}'
add('a881','simulation','easy','點陣橫向與縱向放大','精確保留八列字型與固定字距。',[
'將題目十個字型存成固定表，這些是題目資料而非範例答案。把 n 轉成不補零的字串；依原字型列 0 到 7，逐個數字產生該列。',
'原點為 1 就輸出 Z 個星號，0 就輸出 Z 個空白；相鄰數字之間只接三個空白。組好的整列再重複 Z 次，因此每個點恰好變成 Z×Z 的方塊。'],
'若有 d 位數，輸出寬 W=8Zd+3(d−1)、高 8Z；時間 O(ZW)，額外空間 O(W)，不計固定字型。','三欄字距不乘 Z；最右側空白與最後全空白的字型列都要保留。',[
('讀取第零列','數字 1 的第一列為 00001000。',list('00001000'),[('倍率','2')]),
('橫向放大','每個 0 或 1 都重複兩次。',['0000000011000000'],[('列寬','16')]),
('縱向放大','同一列輸出兩次，接著處理下一個原始列。',['        **      ','        **      '],[('總行數','16')])],
'''int main(){string n;int z;char c;int value;cin>>value>>c>>z;n=to_string(value);vector<string>f=FONT;for(int r=0;r<8;r++){string line;for(int j=0;j<(int)n.size();j++){if(j)line+="   ";for(int k=0;k<8;k++)line+=string(z,f[n[j]-'0'][r*8+k]=='1'?'*':' ');}for(int t=0;t<z;t++)cout<<line<<'\\n';}}'''.replace('FONT',font_cpp),
'''import sys
n,z=map(int,sys.stdin.readline().split(',')); digits=str(n)
font=FONT
for r in range(8):
    line='   '.join(''.join(('*' if c=='1' else ' ')*z for c in font[int(d)].split()[r]) for d in digits)
    for _ in range(z): print(line)'''.replace('FONT',repr(FONT)))

add('a882','strings','easy','ASCII 字母計數','忽略大小寫與非英文字元。',[
'一次掃描整行，A 到 Z 對應索引 0 到 25，小寫 a 到 z 對應同一組索引；其他字元略過。空行也有合法的全零統計。',
'掃描任意前綴後，計數器恰為該前綴每種字母的出現次數。加入下一字元時只改動其對應的一格，因此最後得到完整統計。輸出固定字母列與計數列。'],
'時間 O(L+26)，額外計數空間 O(26)；本解讀取整行另需 O(L)。','只能統計 A–Z；Python 的 isalpha 會把其他語系字母也算進去。',[
('讀入示意','輸入 Aa!b。',['A','a','!','b'],[('A','0'),('B','0')]),
('統一索引','A 和 a 都增加 A 的計數，驚嘆號略過。',['A','a','!'],[('A','2')]),
('完成統計','b 增加 B，其他字母仍是 0。',['A:2','B:1','C:0'],[('字母總數','3')])],
'''int main(){string s;getline(cin,s);int c[26]={};for(unsigned char x:s){if(x>='A'&&x<='Z')c[x-'A']++;else if(x>='a'&&x<='z')c[x-'a']++;}for(int i=0;i<26;i++)cout<<char('A'+i)<<(i==25?'\\n':' ');for(int i=0;i<26;i++)cout<<c[i]<<(i==25?'\\n':' ');}''',
'''import sys,string
c=[0]*26
for x in sys.stdin.readline():
    if 'A'<=x<='Z': c[ord(x)-65]+=1
    elif 'a'<=x<='z': c[ord(x)-97]+=1
print(*string.ascii_uppercase)
print(*c)''')

add('a883','graphs','hard','指派問題對偶與 Hungarian 演算法','將最小標記覆蓋轉為最大權完美匹配。',[
'任取一個列到行的排列 π，把 n 個限制 r[i]+c[π(i)]≥A[i][π(i)] 相加，可知覆蓋花費至少等於該指派權重。最大權指派給出最強下界。',
'指派線性規劃的對偶正是本題標記覆蓋；二分圖指派的整數性保證存在整數最優解，故上下界相等。使用 Hungarian 最小費用指派，令費用為 −A，最後將最小費用取負。',
'u、v 是可行勢能，minv 記錄未加入行到目前交錯樹的最小鬆弛量。每次減去最小鬆弛並加入零鬆弛邊，找到空行後沿 way 增廣；最終完美匹配與勢能達到相同費用。'],
'時間 O(n³)，空間 O(n²)。','不是逐列取最大值後直接相加；各列最大值可能搶同一行。標記允許負數，不應額外加非負限制。',[
('下界','示意矩陣 5 1 / 4 2，對角指派總和 7。',['5 1','4 2'],[('對角權重','7')]),
('比較指派','另一個指派是 1+4=5，故最大指派為 7。',['5+2=7','1+4=5'],[('覆蓋下界','7')]),
('達到下界','R=(3,2)、C=(2,0)，四格均覆蓋且總和 7。',['3+2≥5','3+0≥1','2+2≥4','2+0≥2'],[('最小花費','7')])],
'''int main(){int n;cin>>n;vector<vector<int>>a(n+1,vector<int>(n+1));for(int i=1;i<=n;i++)for(int j=1;j<=n;j++){cin>>a[i][j];a[i][j]=-a[i][j];}vector<int>u(n+1),v(n+1),p(n+1),way(n+1);for(int i=1;i<=n;i++){p[0]=i;int j0=0;vector<int>minv(n+1,1e9);vector<bool>used(n+1);do{used[j0]=1;int i0=p[j0],delta=1e9,j1=0;for(int j=1;j<=n;j++)if(!used[j]){int cur=a[i0][j]-u[i0]-v[j];if(cur<minv[j])minv[j]=cur,way[j]=j0;if(minv[j]<delta)delta=minv[j],j1=j;}for(int j=0;j<=n;j++)if(used[j])u[p[j]]+=delta,v[j]-=delta;else minv[j]-=delta;j0=j1;}while(p[j0]);do{int j1=way[j0];p[j0]=p[j1];j0=j1;}while(j0);}cout<<v[0]<<'\\n';}''',
'''import sys
it=iter(map(int,sys.stdin.buffer.read().split())); n=next(it); a=[[0]*(n+1)]+[[0]+[-next(it) for _ in range(n)] for _ in range(n)]
u=[0]*(n+1); v=u.copy(); p=u.copy(); way=u.copy()
for i in range(1,n+1):
    p[0]=i; j0=0; mv=[10**9]*(n+1); used=[False]*(n+1)
    while True:
        used[j0]=True; i0=p[j0]; delta=10**9; j1=0
        for j in range(1,n+1):
            if not used[j]:
                cur=a[i0][j]-u[i0]-v[j]
                if cur<mv[j]: mv[j]=cur; way[j]=j0
                if mv[j]<delta: delta=mv[j]; j1=j
        for j in range(n+1):
            if used[j]: u[p[j]]+=delta; v[j]-=delta
            else: mv[j]-=delta
        j0=j1
        if not p[j0]: break
    while j0:
        j1=way[j0]; p[j0]=p[j1]; j0=j1
print(v[0])''')

add('a884','dp','hard','壓縮矩陣與受長度限制的最大子段','把面積下限換成一維區段的最小寬度。',[
'將較小的維度作為列數，枚舉上界與下界，累加各行形成一維陣列。若高度 h，為滿足戶數至少 H，寬度必須至少 t=ceil(H/h)。',
'令前綴和 P[0]=0。右端點 r 的最佳合法區段值是 P[r]−min(P[0..r−t])；隨 r 增加只須加入一個新前綴值，即可線性求得這對上下界的最佳答案。',
'每個合法矩形有唯一上下界，並被一維掃描完整涵蓋，因此取全域最大值正確。答案初設 0，表示可以放棄都更；H 超過總面積時也輸出 0。讀到任一維為 0 就結束。'],
'令 a=min(M,N)、b=max(M,N)，每組時間 O(a²b)，空間 O(MN+b)。Python 在 300×300 最壞資料仍有大量迴圈。','不可直接使用可選任意長度的 Kadane；最佳短區段可能不滿足戶數下限。',[
('固定高度','示意一列 5 −100 6，要求至少兩戶。',[5,-100,6],[('h','1'),('t','2')]),
('掃到右端2','前綴為 0,5,−95,−89；第一個合法區段和 −95。',[0,5,-95,-89],[('r','2'),('最小可用前綴','0')]),
('選擇放棄','右端3的最佳值為 −89，所有合法區域都虧損，輸出 0。',[-95,-89],[('答案','0')])],
'''int main(){ios::sync_with_stdio(false);cin.tie(nullptr);int m,n,H;while(cin>>m>>n>>H&&m&&n){vector<vector<int>>a(m,vector<int>(n));for(auto &r:a)for(int &x:r)cin>>x;if(m>n){vector<vector<int>>b(n,vector<int>(m));for(int i=0;i<m;i++)for(int j=0;j<n;j++)b[j][i]=a[i][j];a=move(b);swap(m,n);}long long ans=0;for(int l=0;l<m;l++){vector<int>s(n);for(int r=l;r<m;r++){for(int j=0;j<n;j++)s[j]+=a[r][j];int t=(H+r-l)/(r-l+1);if(t>n)continue;vector<long long>p(n+1);for(int j=0;j<n;j++)p[j+1]=p[j]+s[j];long long mn=0;for(int j=t;j<=n;j++){mn=min(mn,p[j-t]);ans=max(ans,p[j]-mn);}}}cout<<ans<<'\\n';}}''',
'''import sys
it=iter(map(int,sys.stdin.buffer.read().split())); out=[]
while True:
    try: m,n,h=next(it),next(it),next(it)
    except StopIteration: break
    if not m or not n: break
    a=[[next(it) for _ in range(n)] for _ in range(m)]
    if m>n: a=list(zip(*a)); m,n=n,m
    ans=0
    for top in range(m):
        s=[0]*n
        for bottom in range(top,m):
            row=a[bottom]
            for j in range(n): s[j]+=row[j]
            t=(h+bottom-top)//(bottom-top+1)
            if t>n: continue
            p=[0]; total=0
            for x in s: total+=x; p.append(total)
            low=0
            for j in range(t,n+1):
                if p[j-t]<low: low=p[j-t]
                if p[j]-low>ans: ans=p[j]-low
    out.append(str(ans))
print('\n'.join(out))''')

add('a885','graphs','medium','有權最短路與 Dial 桶','把每個合法暫存器值視為一個狀態。',[
'從 x 可走到 x±1（成本 2）、x±2、2x、floor(x/2)（成本 3）。只加入 0 到 1000000 的合法結果，求 a 到 b 的最短距離。',
'所有邊權為正且最多 3，可用四個循環桶代替優先佇列。依距離由小到大取出狀態，忽略已過期項目；第一次取出 b 時距離已最短。桶索引對 4 取餘不改變處理順序，因為新距離至多比目前大 3。'],
'令 V=1000001，每點至多 6 邊，時間 O(V)，空間 O(V)。','除二是無條件捨去；越界操作不能先做再截回邊界。',[
('起點','示意由 0 變成 8。',[0],[('成本','0')]),
('加二','INC2 把 0 變成 2，成本 3。',[0,2],[('成本','3')]),
('連續加倍','2→4→8，各花 3，總成本 9。',[0,2,4,8],[('最短成本','9')])],
'''int main(){int a,b;cin>>a>>b;const int V=1000001,INF=1e9;vector<int>d(V,INF);array<deque<int>,4>q;d[a]=0;q[0].push_back(a);int pending=1,t=0;while(pending){while(q[t%4].empty())t++;int x=q[t%4].front();q[t%4].pop_front();pending--;if(d[x]!=t)continue;if(x==b){cout<<t<<'\\n';break;}int y[]={x-1,x+1,x-2,x+2,x*2,x/2};for(int k=0;k<6;k++)if(y[k]>=0&&y[k]<V){int nd=t+(k<2?2:3);if(nd<d[y[k]]){d[y[k]]=nd;q[nd%4].push_back(y[k]);pending++;}}}}''',
'''import sys
from collections import deque
from array import array
a,b=map(int,sys.stdin.buffer.read().split()); d=array('i',[10**9])*1000001; d[a]=0
q=[deque() for _ in range(4)]; q[0].append(a); pending=1; t=0
while pending:
    while not q[t%4]: t+=1
    x=q[t%4].popleft(); pending-=1
    if d[x]!=t: continue
    if x==b: print(t); break
    for y,w in ((x-1,2),(x+1,2),(x-2,3),(x+2,3),(x*2,3),(x//2,3)):
        nd=t+w
        if 0<=y<=1000000 and nd<d[y]:
            d[y]=nd; q[nd%4].append(y); pending+=1''')

add('a886','graphs','medium','DFA 狀態等價與反覆分割','找出對所有遊樂券序列反應相同的景點。',[
'先按目前是否能抽獎分成兩類，這已考慮空券序列。每輪以「原類別、各券代號下一站的類別」作為簽章，簽章相同的景點放同一類。',
'歸納可知分割 k 輪後，同類景點無法被長度不超過 k 的券序列區分。穩定時，各轉移都落到同類，故任意長度序列仍無法區分；而已分開的景點必有某個序列能區分。最後按各類最小編號輸出。'],
'至多 N 次分割，時間 O(N²M log N)（C++ 有序映射上界）；空間 O(NM)。','必須包含起點本身的抽獎資格，不能只比下一站編號。',[
('初始分類','示意三景點，只有 3 可抽獎；券轉移 1→2、2→3、3→3。',['{1,2}','{3}'],[('可分辨券長','0')]),
('一張券','1 到非抽獎類，2 到抽獎類，因此 1、2 分開。',['{1}','{2}','{3}'],[('可分辨券長','1')]),
('穩定','三個單點類不再分割，答案完成。',['1','2','3'],[('類數','3')])],
'''int main(){int n,f,m;cin>>n>>f>>m;vector<int>c(n);while(f--){int x;cin>>x;c[x-1]=1;}vector<vector<int>>a(n,vector<int>(m));for(auto&r:a)for(int &x:r){cin>>x;--x;}while(true){map<vector<int>,int>mp;vector<int>b(n);for(int i=0;i<n;i++){vector<int>key{c[i]};for(int j:a[i])key.push_back(c[j]);if(!mp.count(key)){int k=mp.size();mp[key]=k;}b[i]=mp[key];}bool stable=true;for(int i=0;i<n;i++)for(int j=0;j<n;j++)if((c[i]==c[j])!=(b[i]==b[j]))stable=false;c=b;if(stable)break;}map<int,vector<int>>g;for(int i=0;i<n;i++)g[c[i]].push_back(i+1);vector<vector<int>>v;for(auto [k,x]:g)v.push_back(x);sort(v.begin(),v.end());for(auto x:v){for(int j=0;j<(int)x.size();j++)cout<<x[j]<<(j+1==(int)x.size()?'\\n':' ');}}''',
'''import sys
it=iter(map(int,sys.stdin.buffer.read().split())); n,f,m=next(it),next(it),next(it); c=[0]*n
for _ in range(f): c[next(it)-1]=1
a=[[next(it)-1 for _ in range(m)] for _ in range(n)]
while True:
    groups={}; b=[]
    for i in range(n):
        key=(c[i],*(c[j] for j in a[i]))
        if key not in groups: groups[key]=len(groups)
        b.append(groups[key])
    stable=len(set(c))==len(groups); c=b
    if stable: break
g={}
for i,x in enumerate(c): g.setdefault(x,[]).append(i+1)
for row in sorted(g.values()): print(*row)''')

add('a887','dp','medium','三維嚴格偏序的最長鏈','旋轉盒子後，以排序尺寸判斷能否套入。',[
'每個長方體的三邊先由小到大排序。內盒能旋轉放入外盒，恰好等價於排序後的三個尺寸都嚴格較小：配對最小邊、次小邊、最大邊即充分；若某個排序位置失敗，就沒有足夠大的外盒邊與其後各邊配對。',
'只保留三維都大於禮物的盒子，按尺寸字典序排序。dp[i] 是以 i 為最外盒的最長鏈；枚舉能放入 i 的 j，更新 dp[i]=max(dp[i],dp[j]+1)，初值 1。嚴格包含必然排在前方，因此轉移是拓樸順序。'],
'每組時間 O(n²)，空間 O(n)。','相等尺寸不能套入；重複盒子可視為不同物件，但不能把相同大小串成鏈。',[
('尺寸標準化','示意禮物 1 2 3，盒子 4 3 2 排成 2 3 4。',['1 2 3','2 3 4'],[('第一層','1')]),
('延長鏈','外盒 3 4 5 三邊都更大。',['1 2 3','2 3 4','3 4 5'],[('盒數','2')]),
('排除等邊','盒子 3 4 5 的複本不能再包住同尺寸盒子。',['3 4 5','3 4 5'],[('最大盒數','2')])],
'''int main(){int T;cin>>T;while(T--){int n;cin>>n;array<int,3>g;for(int&x:g)cin>>x;sort(g.begin(),g.end());vector<array<int,3>>a;for(int i=0;i<n;i++){array<int,3>b;for(int&x:b)cin>>x;sort(b.begin(),b.end());if(b[0]>g[0]&&b[1]>g[1]&&b[2]>g[2])a.push_back(b);}sort(a.begin(),a.end());vector<int>d(a.size(),1);int ans=0;for(int i=0;i<(int)a.size();i++){for(int j=0;j<i;j++)if(a[j][0]<a[i][0]&&a[j][1]<a[i][1]&&a[j][2]<a[i][2])d[i]=max(d[i],d[j]+1);ans=max(ans,d[i]);}cout<<ans<<'\\n';}}''',
'''import sys
it=iter(map(int,sys.stdin.buffer.read().split())); out=[]
for _ in range(next(it)):
    n=next(it); g=sorted(next(it) for _ in range(3)); a=[]
    for _ in range(n):
        b=sorted(next(it) for _ in range(3))
        if all(x>y for x,y in zip(b,g)): a.append(b)
    a.sort(); d=[1]*len(a)
    for i,(x,y,z) in enumerate(a):
        for j in range(i):
            u,v,w=a[j]
            if u<x and v<y and w<z: d[i]=max(d[i],d[j]+1)
    out.append(str(max(d,default=0)))
print('\n'.join(out))''')

add('a888','strings','easy','按列與按行的子字串搜尋','只搜尋由左向右和由上向下兩種方向。',[
'原矩陣的每列就是一條可向右搜尋的字串；將每一行由上到下串成字串，就是可向下搜尋的字串。每個謎底依序在這 2n 條字串尋找。',
'找到列字串位置 c 時回報 (列號,c)，找到行字串位置 r 時回報 (r,行號)，最後轉成 1 起算。兩個方向涵蓋全部合法出現方式；題目保證至多一次，因此不需另訂多解規則。'],
'直接比對上界 O(mn²L)，其中 L 是謎底長度；儲存原矩陣與轉置字串 O(n²)。','不可搜尋反向或斜向；沒有找到必須輸出兩個 −1。',[
('矩陣','示意五列 ABCDE、FGHIJ、KLMNO、PQRST、UVWXY。',['ABCDE','FGHIJ','KLMNO','PQRST','UVWXY'],[('謎底','GHI')]),
('向右搜尋','第二列從索引 1 開始是 GHI。',['F','G','H','I','J'],[('零起算','1,1')]),
('轉換座標','輸出列號、行號都是 1 起算。',['2 2'],[('答案','2 2')])],
'''int main(){int n,m;cin>>n>>m;vector<string>a(n),b(n,string(n,' '));for(auto&s:a)cin>>s;for(int r=0;r<n;r++)for(int c=0;c<n;c++)b[c][r]=a[r][c];while(m--){string s;cin>>s;int r=-1,c=-1;for(int i=0;i<n;i++){auto p=a[i].find(s);if(p!=string::npos){r=i+1;c=p+1;break;}p=b[i].find(s);if(p!=string::npos){r=p+1;c=i+1;break;}}cout<<r<<' '<<c<<'\\n';}}''',
'''import sys
f=sys.stdin; n,m=map(int,f.readline().split()); a=[f.readline().strip() for _ in range(n)]; b=[''.join(row[c] for row in a) for c in range(n)]
for _ in range(m):
    s=f.readline().strip(); ans=(-1,-1)
    for i in range(n):
        p=a[i].find(s)
        if p>=0: ans=(i+1,p+1); break
        p=b[i].find(s)
        if p>=0: ans=(p+1,i+1); break
    print(*ans)''')

add('a889','sorting','easy','閉區間事件掃描','分別計算兩個方向的最大同時停靠班次。',[
'同方向的每次停靠是一個含兩端的時間區間。將進站視為 +1 事件、出站為 −1；同時刻先處理進站，才處理出站，符合不能共用軌道的規則。',
'掃描時的最大活動數是必需軌道數下界；按進站時間分派到已空出的軌道，可以使用恰此數量，故下界可達成。兩方向不能共用軌道，最後把各自最大值相加。HHMM 在同日內與時間先後順序一致。'],
'時間 O((N+M)log(N+M))，空間 O(N+M)。','同時進出仍需兩條軌道；不能把兩方向混成一次最大重疊數。',[
('第一方向','示意 1200–1205、1205–1210。',['1200 +1','1205 +1','1205 −1','1210 −1'],[('最大重疊','2')]),
('第二方向','示意只有 1200–1210。',['1200 +1','1210 −1'],[('最大重疊','1')]),
('合併需求','兩個方向的軌道用途固定。',['2+1'],[('總數','3')])],
'''int main(){int n,m;cin>>n>>m;int ans=0;for(int k:{n,m}){vector<pair<int,int>>e;while(k--){int a,b;cin>>a>>b;e.push_back({a,-1});e.push_back({b,1});}sort(e.begin(),e.end());int cur=0,best=0;for(auto [t,x]:e){cur-=x;best=max(best,cur);}ans+=best;}cout<<ans<<'\\n';}''',
'''import sys
it=iter(map(int,sys.stdin.buffer.read().split())); n,m=next(it),next(it); ans=0
for count in (n,m):
    events=[]
    for _ in range(count): events.extend(((next(it),-1),(next(it),1)))
    cur=best=0
    for _,delta in sorted(events): cur-=delta; best=max(best,cur)
    ans+=best
print(ans)''')

add('a890','geometry','medium','座標壓縮與顏色位元遮罩','計算真正具有正面積的原色組合。',[
'收集所有矩形左右邊的 x 與上下邊的 y，排序去重後，相鄰座標形成基本小格。任何小格內部的矩形覆蓋集合都相同，因為矩形邊界不會穿過其內部。',
'每個矩形用不同的一個 bit 表示。枚舉所有基本格，檢查哪些矩形覆蓋其左下角所屬半開區間，組成遮罩放入集合。排除遮罩 0；集合大小就是顏色數。只接觸的邊線不產生正面積小格，因此不會誤算。'],
'時間 O(N³)，空間 O(N²)（不同小格顏色集合）。','顏色由覆蓋集合決定，不由覆蓋數量決定；兩種不同的兩色混合仍是不同色。',[
('兩個矩形','示意 A=[0,2]×[0,2]、B=[1,3]×[0,2]。',['x:0,1,2,3','y:0,2'],[('原色數','2')]),
('壓縮區域','三個正寬區域的覆蓋集合分別是 A、AB、B。',['01','11','10'],[('不含底色','00')]),
('去重計數','相同遮罩只算一次。',['A','AB','B'],[('顏色數','3')])],
'''int main(){int n;cin>>n;vector<array<int,4>>a(n);vector<int>x,y;for(auto&r:a){for(int&v:r)cin>>v;x.push_back(r[0]);x.push_back(r[2]);y.push_back(r[1]);y.push_back(r[3]);}sort(x.begin(),x.end());x.erase(unique(x.begin(),x.end()),x.end());sort(y.begin(),y.end());y.erase(unique(y.begin(),y.end()),y.end());set<int>s;for(int i=0;i+1<(int)x.size();i++)for(int j=0;j+1<(int)y.size();j++){int mask=0;for(int k=0;k<n;k++)if(a[k][0]<=x[i]&&x[i]<a[k][2]&&a[k][1]<=y[j]&&y[j]<a[k][3])mask|=1<<k;if(mask)s.insert(mask);}cout<<s.size()<<'\\n';}''',
'''import sys
it=iter(map(int,sys.stdin.buffer.read().split())); n=next(it); a=[tuple(next(it) for _ in range(4)) for _ in range(n)]
xs=sorted({x for r in a for x in (r[0],r[2])}); ys=sorted({y for r in a for y in (r[1],r[3])}); colors=set()
for x in xs[:-1]:
    for y in ys[:-1]:
        mask=0
        for k,(l,b,r,t) in enumerate(a):
            if l<=x<r and b<=y<t: mask|=1<<k
        if mask: colors.add(mask)
print(len(colors))''')

BIG='#include <boost/multiprecision/cpp_int.hpp>\nusing boost::multiprecision::cpp_int;\n'
add('a891','dp','hard','降冪分組與精確百分之一單位','用排序後的前綴 DP 混搭當日優惠。',[
'先把票價降冪排序。買三送一是一組三張付前兩張，買五送二是一組五張付前三張。把一組中的低價票往後放、高價票往前放不會增加可獲免費金額；由交換論證可將最優分組排成降冪序列上的連續小組，單張折扣視為大小一的小組。',
'dp[i] 為前 i 張的最低費用，單位採百分之一元。可從 dp[i−1] 加單張原價或假期折扣價，若允許三張組則由 dp[i−3] 加本組前兩張價格的 100 倍；五張組類似。方案編號控制可用轉移。',
'任意大批次的買送都能拆成三張或五張組，剩餘票用單張處理。所有中間金額用任意精度整數，最後只做一次 (dp[N]+99)//100，避免逐批進位或浮點誤差。'],
'排序 O(N log N) 次大整數比較，DP O(N) 次大整數運算；空間 O(NL)，L 為票價位數。','「買三送一」在本平台指每三張有一張免費；票價無機器整數上限。',[
('降冪排序','範例排序為 51,20,12,10,5。',[51,20,12,10,5],[('優惠','方案6，P=20')]),
('只用折扣','前兩張各付八折，共 56.8。',[51,20],[('dp[2]','5680分')]),
('後三張買送','12、10、5 為一組，付 22；但前兩張改為折扣且後三張亦比較。最優是 51 單張八折，加 20、12、10 三張付32，最後5付4，共76.8。',[40.8,32,4],[('進位答案','77')])],
BIG+'''int main(){int n,m,p=0;cin>>n>>m;if(m==3||m==5||m==6)cin>>p;vector<cpp_int>a(n+1),d(n+1);for(int i=1;i<=n;i++)cin>>a[i];sort(a.begin()+1,a.end(),greater<cpp_int>());bool t=m==1||m==4||m==5||m==6,f=m==2||m==4||m==6,h=m==3||m==5||m==6;for(int i=1;i<=n;i++){d[i]=d[i-1]+a[i]*(h?100-p:100);if(t&&i>=3){cpp_int z=d[i-3]+100*(a[i-2]+a[i-1]);if(z<d[i])d[i]=z;}if(f&&i>=5){cpp_int z=d[i-5]+100*(a[i-4]+a[i-3]+a[i-2]);if(z<d[i])d[i]=z;}}cout<<(d[n]+99)/100<<'\\n';}''',
'''import sys
it=iter(map(int,sys.stdin.buffer.read().split())); n,m=next(it),next(it); p=next(it) if m in (3,5,6) else 0
a=[0]+sorted(it,reverse=True); d=[0]*(n+1)
for i in range(1,n+1):
    d[i]=d[i-1]+a[i]*(100-p)
    if m in (1,4,5,6) and i>=3: d[i]=min(d[i],d[i-3]+100*(a[i-2]+a[i-1]))
    if m in (2,4,6) and i>=5: d[i]=min(d[i],d[i-5]+100*sum(a[i-4:i-1]))
print((d[n]+99)//100)''')

add('a892','simulation','medium','對角線索引與串流一致性','為兩種方向各保留首值與相同旗標。',[
'左上到右下方向的格子有相同 r−c，右上到左下方向有相同 r+c。各以 2N−1 個槽紀錄第一次看到的完整字串、格數及目前是否全部相同。',
'逐格讀入時更新兩個槽；已經出現不同字串的對角線永久不合格。所有格子讀完後，計數至少兩格且旗標仍為真的槽。每格屬於兩個方向各一條線，故完整涵蓋且不重複計算同方向線。'],
'時間 O(N²L)，L 是元素字串長度；對角線狀態 O(NL)，Python 逐列拆字串另用 O(NL)。','長度一的四條角落斜線不能算；元素須按完整字串比較。',[
('示意矩陣','2×2 全部元素都是 A。',['A A','A A'],[('每方向斜線','3')]),
('排除短線','每方向都有兩條長度一的斜線，全部排除。',['長度1','長度2','長度1'],[('每方向合格','1')]),
('兩方向相加','兩條主對角線都由兩個 A 構成。',['↘ A A','↙ A A'],[('答案','2')])],
'''int main(){ios::sync_with_stdio(false);cin.tie(nullptr);int T;cin>>T;while(T--){int n;cin>>n;vector<string>v(4*n-2);vector<int>cnt(4*n-2);vector<bool>ok(4*n-2,true);for(int r=0;r<n;r++)for(int c=0;c<n;c++){string x;cin>>x;for(int k:{r-c+n-1,2*n-1+r+c}){if(!cnt[k])v[k]=x;else if(v[k]!=x)ok[k]=false;cnt[k]++;}}int ans=0;for(int k=0;k<4*n-2;k++)if(cnt[k]>=2&&ok[k])ans++;cout<<ans<<'\\n';}}''',
'''import sys
def tokens():
    for line in sys.stdin.buffer:
        yield from line.split()
it=iter(tokens())
for _ in range(int(next(it))):
    n=int(next(it)); val=[None]*(4*n-2); count=[0]*(4*n-2); ok=[True]*(4*n-2)
    for r in range(n):
        for c in range(n):
            x=next(it)
            for k in (r-c+n-1,2*n-1+r+c):
                if not count[k]: val[k]=x
                elif val[k]!=x: ok[k]=False
                count[k]+=1
    print(sum(c>=2 and good for c,good in zip(count,ok)))''')

add('a893','simulation','easy','移動總和與整數交叉相乘','精確實作五個交易日的嚴格比較。',[
'對最後五日（零起算索引 10 到 14），計算含當天的五日總和 S5、十日總和 S10，以及前一天的兩個總和。因分母相同，平均上升等價於總和上升。',
'P>M5>M10 改寫為 5P>S5 且 2S5>S10；P<1.2M10 改成 50P<6S10。賣出條件同理轉成整數比較。依條件輸出 B、S、N，任意精度確保未設價格上限時仍正確。'],
'固定 15 日，O(15L) 大整數處理時間、O(15L) 空間，L 為價格位數。','所有不等式都嚴格；等於 1.2 倍不會觸發那一條賣出條件。',[
('平盤示意','十五日價格皆為 10。',[10,10,10,10,10],[('S5','50'),('S10','100')]),
('比較買進','兩種平均皆未上升，不符合買進。',['50=50','100=100'],[('B','否')]),
('比較賣出','10 未高於 12，均線未下降，價格也未跌破均線。',['10N','10N','10N','10N','10N'],[('建議','全N')])],
BIG+'''int main(){vector<cpp_int>a(15);for(auto &x:a)cin>>x;for(int i=10;i<15;i++){cpp_int s5=0,s10=0,p5=0,p10=0;for(int k=0;k<10;k++){s10+=a[i-k];p10+=a[i-1-k];if(k<5){s5+=a[i-k];p5+=a[i-1-k];}}cpp_int p=a[i];bool b=s5>p5&&s10>p10&&5*p>s5&&2*s5>s10&&50*p<6*s10;bool s=50*p>6*s10||(5*p<s5&&2*s5<s10)||s10<p10;cout<<p<<(b?'B':s?'S':'N')<<(i==14?'\\n':' ');}}''',
'''import sys
a=list(map(int,sys.stdin.buffer.read().split())); out=[]
for i in range(10,15):
    p=a[i]; s5=sum(a[i-4:i+1]); s10=sum(a[i-9:i+1]); p5=sum(a[i-5:i]); p10=sum(a[i-10:i])
    b=s5>p5 and s10>p10 and 5*p>s5 and 2*s5>s10 and 50*p<6*s10
    s=50*p>6*s10 or (5*p<s5 and 2*s5<s10) or s10<p10
    out.append(str(p)+('B' if b else 'S' if s else 'N'))
print(*out)''')

add('a894','basics','easy','任意精度加總與四捨五入','用整數計算平均到小數點後兩位。',[
'掃描 n 個數，維護總和、最大值、最小值。平均取 |總和|×100 除以 n 得到百分之一單位的商 q 與餘數 r；若 2r≥n，就把 q 加一。',
'最後恢復正負號，輸出 q//100 與補足兩位的 q%100。這是先對絕對值四捨五入再恢復符號，避免二進位浮點誤差，負數恰半時也會遠離零。總和為負但四捨五入為零時不輸出負零。'],
'O(nL) 大整數運算時間，示範儲存輸入 O(nL)，L 為整數位數。','題目沒有 64 位上限；不要使用浮點平均或 Python 的銀行家捨入。',[
('示意數列','−1、0、0，總和為 −1。',[-1,0,0],[('總和','−1'),('n','3')]),
('百分位計算','100÷3 的商 33、餘數 1，2<3 不進位。',[33,1],[('百分之一單位','33')]),
('恢復符號','平均 −0.33，最大 0、最小 −1。',['−0.33','0','−1'],[('輸出行數','3')])],
BIG+'''int main(){int n;cin>>n;cpp_int s=0,mn,mx;for(int i=0;i<n;i++){cpp_int x;cin>>x;s+=x;if(!i||x<mn)mn=x;if(!i||x>mx)mx=x;}bool neg=s<0;if(neg)s=-s;cpp_int z=s*100,q=z/n,r=z%n;if(2*r>=n)q++;int tail=(q%100).convert_to<int>();if(neg&&q!=0)cout<<'-';cout<<q/100<<'.'<<setw(2)<<setfill('0')<<tail<<'\\n'<<mx<<'\\n'<<mn<<'\\n';}''',
'''import sys
n,*a=map(int,sys.stdin.buffer.read().split()); s=sum(a); q,r=divmod(abs(s)*100,n)
if 2*r>=n: q+=1
print(('-' if s<0 and q else '')+str(q//100)+'.'+str(q%100).zfill(2))
print(max(a)); print(min(a))''')

add('a895','data-structures','hard','分數群組排名的時間積分','只在玩家換分數時結算其排名歷史。',[
'同分玩家當天排名相同。對每個分數 s 維護當前排名 rank[s]、排名隨時間的積分 area[s] 與上次變更日 last[s]。玩家從 s 升到 s+1 時，只有 rank[s] 增加 1，因為比 s 分高的人多了一人。',
'每位玩家保留加入目前分數群組時的積分 base，離開時累加 area[s]−base。當日所有變更都在日初處理，touch(s,day) 只積分到前一天，因此同日更新順序不影響結果。新群組的 base 設為當日開始的 area。',
'第 M+1 日統一結算剩餘區間。每人累積的是 M 天排名總和，再以整數商餘數四捨五入到三位。群組至多 M+1 個，更新不需要掃描其他玩家。'],
'令 U 是所有 k 的總和，時間 O(U+N+M)，空間 O(N+M)；逐日讀取。','排名是嚴格較高人數加一；同日中途的暫時排名不能計入平均。',[
('初始群組','示意兩人兩天，第一天只有玩家1加分。',['玩家1:0','玩家2:0'],[('rank[0]','1')]),
('第一天結算','玩家1升到1分；0分群組排名增加為2。',['玩家1:排名1','玩家2:排名2'],[('當日排名和','1,2')]),
('第二天與平均','第二天玩家2加分，兩人同為1分並列第一。',['玩家1:1.000','玩家2:1.500'],[('兩天總和','2,3')])],
'''int main(){ios::sync_with_stdio(false);cin.tie(nullptr);int n,m;cin>>n>>m;vector<long long>r(m+2,1),area(m+2),base(n),sum(n);vector<int>last(m+2,1),score(n);auto touch=[&](int s,int day){area[s]+=r[s]*(day-last[s]);last[s]=day;};for(int day=1;day<=m;day++){int k;cin>>k;while(k--){int x;cin>>x;--x;int s=score[x];touch(s,day);touch(s+1,day);sum[x]+=area[s]-base[x];r[s]++;score[x]++;base[x]=area[s+1];}}for(int i=0;i<n;i++){int s=score[i];touch(s,m+1);sum[i]+=area[s]-base[i];long long q=sum[i]*1000/m,rem=sum[i]*1000%m;if(2*rem>=m)q++;cout<<q/1000<<'.'<<setw(3)<<setfill('0')<<q%1000<<'\\n';}}''',
'''import sys
f=sys.stdin.buffer; n,m=map(int,f.readline().split()); rank=[1]*(m+2); area=[0]*(m+2); last=[1]*(m+2); score=[0]*n; base=[0]*n; total=[0]*n
def touch(s,day):
    area[s]+=rank[s]*(day-last[s]); last[s]=day
for day in range(1,m+1):
    row=list(map(int,f.readline().split()))
    for x in row[1:]:
        x-=1; s=score[x]; touch(s,day); touch(s+1,day)
        total[x]+=area[s]-base[x]; rank[s]+=1; score[x]+=1; base[x]=area[s+1]
for i in range(n):
    s=score[i]; touch(s,m+1); total[i]+=area[s]-base[i]
    q,r=divmod(total[i]*1000,m); q+=2*r>=m
    print(str(q//1000)+'.'+str(q%1000).zfill(3))''')

add('a896','number-theory','hard','質數冪根與中國剩餘定理','分解模數後合併所有平方根。',[
'將 M 分解為互質的質數冪。奇質數冪只有 ±1 兩個根，因為 (X−1)(X+1) 被該冪整除而兩因數最大公因數至多 2。',
'對 2^e：e=1 只有 1；e=2 有 1、3；e≥3 有 1、−1、1+2^(e−1)、−1+2^(e−1)。逐個質數冪用中國剩餘定理與目前解合併，最後排序。M=1 的唯一合法輸出為 X=1。'],
'試除分解 O(√M)，若根數 R，合併與排序 O(R log M+R log R)，空間 O(R)。','餘數條件是 X²≡1；M=1 時 1 的餘數也是 0，不能輸出 0。',[
('分解15','15=3×5，各自的根為 ±1。',['mod3:1,2','mod5:1,4'],[('組合數','4')]),
('合併','兩組局部餘數各對應唯一 mod15 的值。',[1,4,11,14],[('驗證4','16≡1')]),
('排序輸出','先輸出數量，再逐行輸出四個根。',[1,4,11,14],[('根數','4')])],
'''long long eg(long long a,long long b,long long&x,long long&y){if(!b){x=1;y=0;return a;}long long u,v,g=eg(b,a%b,u,v);x=v;y=u-a/b*v;return g;}int main(){long long M;cin>>M;if(M==1){cout<<"1\\n1\\n";return 0;}long long rem=M,mod=1;vector<long long>ans{0};for(long long p=2;p<=rem/p;p++){if(rem%p)continue;long long q=1;while(rem%p==0)rem/=p,q*=p;vector<long long>roots;if(p!=2)roots={1,q-1};else if(q==2)roots={1};else if(q==4)roots={1,3};else roots={1,q-1,1+q/2,q/2-1};long long x,y;eg(mod,q,x,y);x=(x%q+q)%q;vector<long long>b;for(long long a:ans)for(long long r:roots)b.push_back(a+mod*((((r-a)%q+q)%q*x)%q));ans=b;mod*=q;}if(rem>1){long long q=rem,x,y;eg(mod,q,x,y);x=(x%q+q)%q;vector<long long>b;vector<long long>roots=q==2?vector<long long>{1}:vector<long long>{1,q-1};for(long long a:ans)for(long long r:roots)b.push_back(a+mod*((((r-a)%q+q)%q*x)%q));ans=b;}sort(ans.begin(),ans.end());cout<<ans.size()<<'\\n';for(auto x:ans)cout<<x<<'\\n';}''',
'''import sys
m=int(sys.stdin.readline())
if m==1: print('1\\n1'); raise SystemExit
rem=m; p=2; powers=[]
while p*p<=rem:
    if rem%p==0:
        q=1
        while rem%p==0: rem//=p; q*=p
        powers.append((p,q))
    p+=1
if rem>1: powers.append((rem,rem))
ans=[0]; mod=1
for p,q in powers:
    roots=([1] if q==2 else [1,3] if q==4 else [1,q-1,1+q//2,q//2-1]) if p==2 else [1,q-1]
    inv=pow(mod,-1,q); ans=[a+mod*((r-a)*inv%q) for a in ans for r in roots]; mod*=q
print(len(ans)); print(*sorted(ans),sep='\n')''')

add('a897','search','medium','多源 BFS','同時由鼠窩所有合法格點展開。',[
'先將每個障礙的兩端點正規化成左下、右上，填滿含邊界的矩形格點。鼠窩與乳酪屋也以端點範圍列舉格點。',
'將所有未被障礙占用的鼠窩點以距離 0 入佇列，四方向 BFS。第一次取出的乳酪屋格點，其距離是所有起點到所有終點的最小值，因為 BFS 依距離遞增走訪且每步成本相同。若佇列耗盡則無路徑。'],
'設格點數 V=XY，障礙填格總次數 A，時間 O(V+A)，空間 O(V)。','格點上界為 X−1、Y−1；障礙物包含端點且可能反向輸入。',[
('示意空間','3×3 無障礙，鼠窩 (0,0)，乳酪 (2,2)。',['S..','...','..T'],[('起點距離','0')]),
('一層擴展','(1,0)、(0,1) 都是距離 1。',['0 1 2','1 2 3','2 3 4'],[('BFS層','1')]),
('抵達目標','最短路徑需要橫走2步、直走2步。',['S→→↓↓T'],[('距離','4')])],
'''int main(){int X,Y;cin>>X>>Y;string tag;array<int,4>s,t;cin>>tag;for(int&x:s)cin>>x;cin>>tag;for(int&x:t)cin>>x;cin>>tag;vector<vector<int>>d(X,vector<int>(Y,-1));while(cin>>tag&&tag!=".be"){int x1=stoi(tag),y1,x2,y2;cin>>y1>>x2>>y2;for(int x=min(x1,x2);x<=max(x1,x2);x++)for(int y=min(y1,y2);y<=max(y1,y2);y++)d[x][y]=-2;}queue<pair<int,int>>q;for(int x=min(s[0],s[2]);x<=max(s[0],s[2]);x++)for(int y=min(s[1],s[3]);y<=max(s[1],s[3]);y++)if(d[x][y]==-1)d[x][y]=0,q.push({x,y});int ans=-1;while(!q.empty()){auto[x,y]=q.front();q.pop();if(x>=min(t[0],t[2])&&x<=max(t[0],t[2])&&y>=min(t[1],t[3])&&y<=max(t[1],t[3])){ans=d[x][y];break;}for(auto[dx,dy]:vector<pair<int,int>>{{1,0},{-1,0},{0,1},{0,-1}}){int a=x+dx,b=y+dy;if(a>=0&&a<X&&b>=0&&b<Y&&d[a][b]==-1)d[a][b]=d[x][y]+1,q.push({a,b});}}if(ans<0)cout<<"no path\\n";else cout<<ans<<'\\n';}''',
'''import sys
from collections import deque
it=iter(sys.stdin.buffer.read().split()); X,Y=int(next(it)),int(next(it)); next(it); s=[int(next(it)) for _ in range(4)]; next(it); t=[int(next(it)) for _ in range(4)]; next(it)
def points(a):
    x,y,u,v=a
    for i in range(min(x,u),max(x,u)+1):
        for j in range(min(y,v),max(y,v)+1): yield i,j
d=[[-1]*Y for _ in range(X)]
while True:
    word=next(it)
    if word==b'.be': break
    a=[int(word)]+[int(next(it)) for _ in range(3)]
    for x,y in points(a): d[x][y]=-2
target=set(points(t)); q=deque()
for x,y in points(s):
    if d[x][y]==-1: d[x][y]=0; q.append((x,y))
ans=None
while q:
    x,y=q.popleft()
    if (x,y) in target: ans=d[x][y]; break
    for a,b in ((x-1,y),(x+1,y),(x,y-1),(x,y+1)):
        if 0<=a<X and 0<=b<Y and d[a][b]==-1: d[a][b]=d[x][y]+1; q.append((a,b))
print('no path' if ans is None else ans)''')

add('a898','simulation','medium','呼叫堆疊與控制流程','逐條驗證相鄰節點與返回位置。',[
'依題目固定流程建立非呼叫節點的合法下一步。遇到 11、5、6 呼叫時，下一步必須是 1，並將呼叫行號+1 推入堆疊。',
'遇到返回點 8，必須有尚未返回的呼叫，下一節點也必須等於堆疊頂，然後彈出。路徑須從 9 開始、在 12 結束且堆疊為空。堆疊正好記錄遞迴嵌套，因此不能跳過尚未完成的呼叫。'],
'每條長度 L 的路徑時間 O(L)，空間 O(L)。','只檢查相鄰行號不夠；8 返回 6、7 或12 取決於最內層呼叫。',[
('主程式呼叫','9→10→11→1，將12推入堆疊。',[9,10,11,1],[('堆疊','12')]),
('函式簡單分支','1→2→3→7→8，準備返回。',[1,2,3,7,8],[('返回目標','12')]),
('完成','8→12 符合堆疊頂，彈出後路徑合法。',[8,12],[('堆疊','∅'),('結果','valid')])],
'''int main(){string line;map<int,vector<int>>e={{9,{10}},{10,{11}},{1,{2}},{2,{3,4}},{3,{7}},{4,{5}},{7,{8}}};while(getline(cin,line)){istringstream in(line);vector<int>a;int x;while(in>>x)a.push_back(x);if(a==vector<int>{0})break;bool ok=a.size()>1&&a.front()==9&&a.back()==12;vector<int>st;for(int i=0;ok&&i+1<(int)a.size();i++){int x=a[i],y=a[i+1];if(x==11||x==5||x==6){if(y!=1)ok=false;else st.push_back(x+1);}else if(x==8){if(st.empty()||st.back()!=y)ok=false;else st.pop_back();}else{auto v=e[x];if(find(v.begin(),v.end(),y)==v.end())ok=false;}}cout<<(ok&&st.empty()?"valid":"invalid")<<'\\n';}}''',
'''import sys
edges={9:(10,),10:(11,),1:(2,),2:(3,4),3:(7,),4:(5,),7:(8,)}
for line in sys.stdin:
    a=list(map(int,line.split()))
    if a==[0]: break
    ok=len(a)>1 and a[0]==9 and a[-1]==12; stack=[]
    for x,y in zip(a,a[1:]):
        if not ok: break
        if x in (11,5,6):
            if y!=1: ok=False
            else: stack.append(x+1)
        elif x==8:
            if not stack or stack.pop()!=y: ok=False
        elif y not in edges.get(x,()): ok=False
    print('valid' if ok and not stack else 'invalid')''')

add('a899','greedy','medium','Huffman 最小堆合併','將加權葉深度轉為每次合併權重的總和。',[
'把所有頻率放入最小堆，每次取最小的兩個 a、b，將 a+b 加入答案並放回堆，直到至多一個元素。',
'每次合併使兩棵子樹全部葉子的深度增加一，其增加費用恰好為 a+b，所以合併費用總和等於頻率乘編碼長度總和。Huffman 交換論證保證最小的兩葉可置於最深同父位置；合併後對較小問題重複，得到最優樹。'],
'時間 O(n log n)，空間 O(n)。答案使用64位整數；n=1 時深度0、答案0。','不能每次合併原始最小兩個而忘記把新權重放回；相同權重不影響總成本。',[
('初始化','示意頻率 1、2、3。',[1,2,3],[('累積','0')]),
('第一次合併','1+2=3，堆中剩 3、3。',[3,3],[('累積','3')]),
('最後合併','3+3=6，總成本 3+6=9。',[6],[('答案','9')])],
'''int main(){int n;cin>>n;priority_queue<long long,vector<long long>,greater<long long>>q;while(n--){long long x;cin>>x;q.push(x);}long long ans=0;while(q.size()>1){long long a=q.top();q.pop();long long b=q.top();q.pop();ans+=a+b;q.push(a+b);}cout<<ans<<'\\n';}''',
'''import sys,heapq
n,*h=map(int,sys.stdin.buffer.read().split()); heapq.heapify(h); ans=0
while len(h)>1:
    s=heapq.heappop(h)+heapq.heappop(h); ans+=s; heapq.heappush(h,s)
print(ans)''')

add('a900','dp','medium','誤取最後一粒的減法遊戲','尋找讓先手落入必敗總粒數的最小補量。',[
'總粒數 t 的先手必敗表示任一合法且不立即取完的走法都交給對手必勝局。若 k 是奇數，兩種取量都是奇數，因此恰為奇數 t 必敗。',
'若 k 是偶數，以 k+1 為週期，必敗餘數為 1、3、…、k−1。對這些餘數，取1或k都走到非必敗餘數；對其他餘數，總能走到上述餘數（t=1 是必敗基底）。可用歸納證明週期。',
'依序試 Y=1 到 min(10000,k+1)，第一個使 X+Y 必敗的就是答案。一個完整週期必有必敗值，因此實際一定可在此範圍找到；仍保留無解輸出0。'],
'每筆時間 O(k)，空間 O(1)。','目標是讓先手小寶必敗；取最後一粒是輸，與一般正常玩法相反。',[
('k=4的必敗值','前幾個必敗總數為1、3、6、8。',[1,3,6,8],[('週期','5')]),
('示意X=3','Y=1 時總數4，餘數4非必敗；Y=2 時總數5也非必敗。',[4,5],[('尚未找到','是')]),
('最小補量','Y=3 使總數6，餘數1，後手必勝。',[6],[('答案Y','3')])],
'''int main(){int T;cin>>T;while(T--){int x,k;cin>>x>>k;int ans=0;for(int y=1;y<=min(10000,k+1);y++){int t=x+y,r=t%(k+1);if((k%2&&t%2)||(!(k%2)&&r%2)){ans=y;break;}}cout<<ans<<'\\n';}}''',
'''import sys
it=iter(map(int,sys.stdin.buffer.read().split()))
for _ in range(next(it)):
    x,k=next(it),next(it); ans=0
    for y in range(1,min(10000,k+1)+1):
        t=x+y
        if (t%2 if k%2 else (t%(k+1))%2): ans=y; break
    print(ans)''')

add('a901','strings','easy','羅馬數字的局部減法與貪心編碼','雙向轉換兩種數字表示。',[
'羅馬轉十進位時，由左到右檢查相鄰兩符號。若左值小於右值，就一次吃掉這兩個並加上右減左；否則加上單一符號值。這直接符合題目對合法輸入的定義。',
'十進位轉羅馬時，按 1000、900、500、400、100、90、50、40、10、9、5、4、1 的順序反覆扣除並輸出對應字串。此表完整包含每個十進位位數的標準減法寫法，故會得到要求的千百十個位順序。'],
'時間 O(L+輸出長度)，空間 O(輸出長度)。','遇到左小右大時要消耗整對符號；轉回時需使用 IV、IX 等標準減法形式。',[
('讀取MCMLXXXIX','先吃 M=1000，接著 CM=900。',['M','CM','L','X','X','X','IX'],[('目前','1900')]),
('累加其餘','LXXX=80，IX=9，合計1989。',[1000,900,80,9],[('十進位','1989')]),
('標準編碼','1989依最大可扣項，還原 MCMLXXXIX。',['M','CM','L','X','X','X','IX'],[('結果','MCMLXXXIX')])],
'''int main(){map<char,int>v={{'I',1},{'V',5},{'X',10},{'L',50},{'C',100},{'D',500},{'M',1000}};vector<int>a={1000,900,500,400,100,90,50,40,10,9,5,4,1};vector<string>b={"M","CM","D","CD","C","XC","L","XL","X","IX","V","IV","I"};int T;cin>>T;while(T--){int k;string s;cin>>k>>s;if(k==1){int z=0;for(int i=0;i<(int)s.size();){if(i+1<(int)s.size()&&v[s[i]]<v[s[i+1]]){z+=v[s[i+1]]-v[s[i]];i+=2;}else z+=v[s[i++]];}cout<<z<<'\\n';}else{int z=stoi(s);for(int i=0;i<13;i++)while(z>=a[i])cout<<b[i],z-=a[i];cout<<'\\n';}}}''',
'''import sys
it=iter(sys.stdin.read().split()); values=dict(zip('IVXLCDM',(1,5,10,50,100,500,1000))); table=list(zip((1000,900,500,400,100,90,50,40,10,9,5,4,1),'M CM D CD C XC L XL X IX V IV I'.split()))
for _ in range(int(next(it))):
    kind,s=next(it),next(it)
    if kind=='1':
        i=z=0
        while i<len(s):
            if i+1<len(s) and values[s[i]]<values[s[i+1]]: z+=values[s[i+1]]-values[s[i]]; i+=2
            else: z+=values[s[i]]; i+=1
        print(z)
    else:
        z=int(s); out=[]
        for v,symbol in table:
            q,z=divmod(z,v); out.append(symbol*q)
        print(''.join(out))''')

def postman(code,opened):
    add(code,'graphs','hard','奇度點修正與最小配對','將必走邊與額外重走的最短路分開。',[
    '先加總全部邊權。封閉走法需要每點度數為偶數；開放走法只有起點與終點應為奇數。因此須修正的集合是原奇度點集合'+('與 {S,T} 的對稱差。' if opened else '。'),
    '額外邊所構成的路徑必能把待修正點兩兩配對。先從各待修正點跑 Dijkstra，再以 mask DP 枚舉第一個未配對點的搭檔。用最短路替代任一配對路徑不會更差；反之加入這些路徑後滿足 Euler 度數條件且仍連通，故配對最優值就是必要額外成本。'],
    '令 k 為待修正點數，Dijkstra O(k(M+N)log N)，配對 DP 最壞 O(k²2^k)，空間 O(M+N+k²+2^k)。'+('k 可能為22，而非原奇度點上限20。' if opened else 'k≤14。'),
    '邊需要全部經過；不能直接輸出起終點最短路。'+('起終點無論原本奇偶都要翻轉。' if opened else '指定起點不影響封閉巡迴最優費用。'),[
    ('必走成本','示意三點鏈，邊權2、3。',[2,3],[('邊權總和','5')]),
    ('修正集合','若封閉巡迴須配對兩端；若從一端走到另一端，沒有待修正點。',['封閉:{1,3}','開放1→3:∅'],[('兩端最短路','5')]),
    ('最優總和','封閉巡迴為10；開放1→3為5。',['封閉:5+5','開放:5+0'],[('新增路徑','修正奇偶')])],
    '''long long solve(int mask,vector<vector<long long>>&d,vector<long long>&memo){if(!mask)return 0;long long &ans=memo[mask];if(ans>=0)return ans;ans=LLONG_MAX/4;int i=__builtin_ctz((unsigned)mask),rest=mask^(1<<i);for(int bits=rest;bits;bits&=bits-1){int j=__builtin_ctz((unsigned)bits);ans=min(ans,d[i][j]+solve(rest^(1<<j),d,memo));}return ans;}int main(){int n,m,s,t;cin>>n>>m>>s;OPEN vector<vector<pair<int,int>>>g(n);vector<int>odd(n);long long base=0;while(m--){int a,b,w;cin>>a>>b>>w;--a;--b;g[a].push_back({b,w});g[b].push_back({a,w});odd[a]^=1;odd[b]^=1;base+=w;}FLIP vector<int>v;for(int i=0;i<n;i++)if(odd[i])v.push_back(i);int k=v.size();vector<vector<long long>>d(k,vector<long long>(k));for(int i=0;i<k;i++){vector<long long>dist(n,LLONG_MAX/4);priority_queue<pair<long long,int>,vector<pair<long long,int>>,greater<pair<long long,int>>>q;dist[v[i]]=0;q.push({0,v[i]});while(!q.empty()){auto[w,x]=q.top();q.pop();if(w!=dist[x])continue;for(auto[y,c]:g[x])if(w+c<dist[y]){dist[y]=w+c;q.push({w+c,y});}}for(int j=0;j<k;j++)d[i][j]=dist[v[j]];}vector<long long>memo(1<<k,-1);cout<<base+solve((1<<k)-1,d,memo)<<'\\n';}'''.replace('OPEN','cin>>t;' if opened else '').replace('FLIP','odd[s-1]^=1;odd[t-1]^=1;' if opened else ''),
    '''import sys,heapq,functools
it=iter(map(int,sys.stdin.buffer.read().split())); n,m,s=next(it),next(it),next(it)
OPEN
g=[[] for _ in range(n)]; odd=[0]*n; base=0
for _ in range(m):
    a,b,w=next(it)-1,next(it)-1,next(it); g[a].append((b,w)); g[b].append((a,w)); odd[a]^=1; odd[b]^=1; base+=w
FLIP
v=[i for i in range(n) if odd[i]]; k=len(v); d=[]
for source in v:
    dist=[10**30]*n; dist[source]=0; q=[(0,source)]
    while q:
        w,x=heapq.heappop(q)
        if w!=dist[x]: continue
        for y,c in g[x]:
            if w+c<dist[y]: dist[y]=w+c; heapq.heappush(q,(w+c,y))
    d.append([dist[x] for x in v])
@functools.lru_cache(None)
def solve(mask):
    if not mask: return 0
    bit=mask&-mask; i=bit.bit_length()-1; rest=mask^bit; bits=rest; best=10**30
    while bits:
        b=bits&-bits; j=b.bit_length()-1; best=min(best,d[i][j]+solve(rest^b)); bits^=b
    return best
print(base+solve((1<<k)-1))'''.replace('OPEN','t=next(it)' if opened else '').replace('FLIP','odd[s-1]^=1; odd[t-1]^=1' if opened else ''))
postman('a902',True)

add('a903','graphs','hard','依時刻掃描的最小乘車成本','在完整班表上排除候車費用。',[
'將共站用並查集合併成實體站。對每條線的兩個方向，每班車從端點進站時刻360,365,…,1435出發，依序產生「本站進站時刻→下一站進站時刻」的乘車邊，費用是1分鐘停站加行車時間。',
'按邊起始時刻掃描，維護各站截至此時可達的最小搭車成本。乘車造成的到達先放入依到達時刻排序的堆，處理下一條邊前先完成所有已到達事件；候車只推進時間，不增加成本。使用者必須嚴格早於離站，而時間為整分鐘，正好等價於到達不晚於列車進站。',
'相同站較早到且成本較低的狀態支配較差狀態，未來事件則留在堆中，因此不會把早到但搭車成本較高的路徑當唯一解。終點答案是所有可達時刻的最低成本；起終同站直接0。'],
'令 E=216×2Σ(k−1) 為乘車邊數、V≤200；五次查詢各 O(E log E)，空間 O(E+V)。','不能只求最早抵達，也不能把月台等待加入答案；末班車離開端點後仍需繼續產生後續站時刻。',[
('單線示意','兩站行車2分鐘，第一班06:00進站，06:01離站。',['06:00','06:01','06:03'],[('搭車成本','3')]),
('準時限制','使用者06:01到站不能搭第一班，須等06:05進站的下一班。',['使用者06:01','下班06:05'],[('候車成本','0')]),
('抵達','下一班06:08抵達第二站，但只計1+2=3分鐘。',['06:08抵達'],[('答案','3')])],
'''int main(){int n,m;cin>>n>>m;map<int,vector<int>>ids,travel;int V=0;for(int z=0;z<n;z++){int id,k;cin>>id>>k;ids[id].resize(k);travel[id].resize(k);for(int j=0;j<k;j++){ids[id][j]=V++;cin>>travel[id][j];}}vector<int>p(V);iota(p.begin(),p.end(),0);function<int(int)>find=[&](int x){return p[x]==x?x:p[x]=find(p[x]);};while(m--){int i,a,j,b;cin>>i>>a>>j>>b;p[find(ids[i][a-1])]=find(ids[j][b-1]);}vector<array<int,5>>edges;for(auto [id,v]:ids){int k=v.size();for(int dir:{1,-1})for(int start=360;start<=1435;start+=5){int time=start;for(int q=0;q<k-1;q++){int x=dir==1?q:k-1-q,y=x+dir,c=1+travel[id][max(x,y)];edges.push_back({time,time+c,find(v[x]),find(v[y]),c});time+=c;}}}sort(edges.begin(),edges.end());for(int z=0;z<5;z++){int h,mi,i,a,j,b;cin>>h>>mi>>i>>a>>j>>b;int source=find(ids[i][a-1]),target=find(ids[j][b-1]);vector<int>d(V,1e9);d[source]=0;priority_queue<array<int,3>,vector<array<int,3>>,greater<array<int,3>>>q;for(auto e:edges){auto [time,end,u,v,c]=e;if(time<h*60+mi)continue;while(!q.empty()&&q.top()[0]<=time){auto x=q.top();q.pop();d[x[1]]=min(d[x[1]],x[2]);}if(d[u]<1e9)q.push({end,v,d[u]+c});}while(!q.empty()){auto x=q.top();q.pop();d[x[1]]=min(d[x[1]],x[2]);}cout<<d[target]<<'\\n';}}''',
'''import sys,heapq
it=iter(map(int,sys.stdin.buffer.read().split())); n,m=next(it),next(it); ids={}; travel={}; V=0
for _ in range(n):
    line,k=next(it),next(it); ids[line]=list(range(V,V+k)); V+=k; travel[line]=[next(it) for _ in range(k)]
p=list(range(V))
def find(x):
    while p[x]!=x: p[x]=p[p[x]]; x=p[x]
    return x
for _ in range(m):
    i,a,j,b=(next(it) for _ in range(4)); p[find(ids[i][a-1])]=find(ids[j][b-1])
edges=[]
for line,v in ids.items():
    for order in (list(range(len(v))),list(range(len(v)-1,-1,-1))):
        for start in range(360,1436,5):
            time=start
            for x,y in zip(order,order[1:]):
                cost=1+travel[line][max(x,y)]; edges.append((time,time+cost,find(v[x]),find(v[y]),cost)); time+=cost
edges.sort()
for _ in range(5):
    h,mi,i,a,j,b=(next(it) for _ in range(6)); source=find(ids[i][a-1]); target=find(ids[j][b-1]); d=[10**9]*V; d[source]=0; q=[]
    for time,end,u,v,cost in edges:
        if time<h*60+mi: continue
        while q and q[0][0]<=time:
            _,x,value=heapq.heappop(q); d[x]=min(d[x],value)
        if d[u]<10**9: heapq.heappush(q,(end,v,d[u]+cost))
    while q:
        _,x,value=heapq.heappop(q); d[x]=min(d[x],value)
    print(d[target])''')

add('a904','dp','hard','端點 DP 與二維滑動最大值','限制每次新增匹配的前驅範圍。',[
'dp[i][j] 表示以 α[i]=β[j] 作最後一個匹配的最大長度。若該字母間距為 g，前驅位置必在 [i−g−1,i−1]×[j−g−1,j−1]，所以答案是該矩形最大值加1；空前驅值0允許重新開始。',
'把相同間距的字母共用一組狀態。對每個間距、每個 β 欄用單調佇列維護前幾列 dp 的最大值；在當列再對這些欄最大值做水平滑動最大。先查完當列才插入當列 dp，確保兩個索引都嚴格增加。未限制字母用足夠大的間距代表無限。',
'每個合法子序列都有唯一最後匹配與前驅，且矩形範圍正是該新字母允許的間距，因此轉移既不漏解也不包含非法解。答案取所有端點的最大值。'],
'令 a,b 為序列長度，G≤26 為不同有效間距數。時間 O(Gab)，單調佇列最壞空間 O(Gab)，另需 O(Gb) 容器。Python 最壞資料的容器與迴圈成本較高。','間距屬於「新加入」字母；不是每個字母都可套同一個 LCS 前綴最大值。',[
('零間距示意','α=ABC、β=AXBC，全部字母間距0。',['ABC','AXBC'],[('起點匹配A','1')]),
('無法接上B','A到B在β中間隔X，不符合B的零間距，B只能重新開始。',['B:1'],[('B端點','1')]),
('接上C','兩序列中的B、C都相鄰，可以得到BC長度2。',['B','C'],[('GLCS','2')])],
'''int main(){string a,b;cin>>a>>b;int T;cin>>T;while(T--){vector<int>gap(26,10000);string w;while(cin>>w&&w!="$" )cin>>gap[w[0]-'A'];vector<int>gs;for(char c:a)if(b.find(c)!=string::npos)gs.push_back(min(gap[c-'A'],1000));sort(gs.begin(),gs.end());gs.erase(unique(gs.begin(),gs.end()),gs.end());int n=a.size(),m=b.size(),ans=0;vector<vector<deque<pair<int,int>>>>q(gs.size(),vector<deque<pair<int,int>>>(m));for(int i=0;i<n;i++){vector<vector<int>>best(gs.size(),vector<int>(m));for(int z=0;z<(int)gs.size();z++){deque<pair<int,int>>h;int g=gs[z];for(int j=0;j<m;j++){if(j){auto &v=q[z][j-1];while(!v.empty()&&v.front().first<i-g-1)v.pop_front();int value=v.empty()?0:v.front().second;while(!h.empty()&&h.back().second<=value)h.pop_back();h.push_back({j-1,value});}while(!h.empty()&&h.front().first<j-g-1)h.pop_front();best[z][j]=h.empty()?0:h.front().second;}}vector<int>d(m);for(int j=0;j<m;j++)if(a[i]==b[j]){int z=lower_bound(gs.begin(),gs.end(),min(gap[a[i]-'A'],1000))-gs.begin();d[j]=1+best[z][j];ans=max(ans,d[j]);}for(int z=0;z<(int)gs.size();z++)for(int j=0;j<m;j++){auto &v=q[z][j];while(!v.empty()&&v.back().second<=d[j])v.pop_back();v.push_back({i,d[j]});}}cout<<ans<<(T?' ':'\\n');}}''',
'''import sys
from collections import deque
it=iter(sys.stdin.read().split()); a,b=next(it),next(it); T=int(next(it)); out=[]
for _ in range(T):
    gap={c:1000 for c in set(a+b)}
    while True:
        c=next(it)
        if c=='$': break
        gap[c]=int(next(it))
    gs=sorted({gap[c] for c in set(a)&set(b)}); idx={g:i for i,g in enumerate(gs)}; m=len(b); q=[[deque() for _ in b] for _ in gs]; ans=0
    for i,c in enumerate(a):
        best=[]
        for z,g in enumerate(gs):
            h=deque(); row=[]
            for j in range(m):
                if j:
                    v=q[z][j-1]
                    while v and v[0][0]<i-g-1: v.popleft()
                    value=v[0][1] if v else 0
                    while h and h[-1][1]<=value: h.pop()
                    h.append((j-1,value))
                while h and h[0][0]<j-g-1: h.popleft()
                row.append(h[0][1] if h else 0)
            best.append(row)
        d=[1+best[idx[gap[c]]][j] if c==x else 0 for j,x in enumerate(b)]; ans=max(ans,max(d,default=0))
        for z in range(len(gs)):
            for j,value in enumerate(d):
                v=q[z][j]
                while v and v[-1][1]<=value: v.pop()
                v.append((i,value))
    out.append(ans)
print(*out)''')

add('a905','simulation','medium','同步志願輪次與永久配對','每輪先彙整所有申請，再由教授選人。',[
'將教授志願表轉成 rank[教授][學生]。第 r 輪，所有未配對學生只向自己的第 r 志願申請；已配對教授直接略過。',
'同一未配對教授若收到多人申請，選 rank 最小者並永久配對。因當輪全部申請先彙整，所以不受學生處理順序影響；依輪次歸納，每次結果皆符合題目指定程序。'],
'固定10人，時間 O(10²)，空間 O(10²)。','這不是會撤銷舊配對的穩定婚姻演算法。',[
('第一輪示意','A1與A2都選B1，B1較喜歡A2。',['A1→B1','A2→B1'],[('B1選擇','A2')]),
('永久配對','A2已配對，不再進入後續輪次。',['A2—B1'],[('未配對','A1')]),
('第二輪','若A1第二志願是空缺B2，就配對成功。',['A1—B2','A2—B1'],[('不可撤銷','是')])],
'''int main(){vector<vector<int>>a(10,vector<int>(10)),rank(10,vector<int>(10));string line;for(int r=0;r<20;r++){cin>>line;replace(line.begin(),line.end(),',',' ');istringstream in(line);string id;in>>id;for(int j=0;j<10;j++){int x;in>>x;if(r<10)a[r][j]=x-1;else rank[r-10][x-1]=j;}}vector<int>ans(10,-1),taken(10,-1);for(int r=0;r<10;r++){vector<int>best(10,-1);for(int i=0;i<10;i++)if(ans[i]<0){int b=a[i][r];if(taken[b]<0&&(best[b]<0||rank[b][i]<rank[b][best[b]]))best[b]=i;}for(int b=0;b<10;b++)if(best[b]>=0)ans[best[b]]=b,taken[b]=best[b];}for(int i=0;i<10;i++)cout<<'A'<<i+1<<",B"<<ans[i]+1<<'\\n';}''',
'''import sys
rows=[line.strip().split(',') for line in sys.stdin if line.strip()]; a=[[int(x)-1 for x in r[1:]] for r in rows[:10]]; rank=[]
for r in rows[10:]:
    v=[0]*10
    for j,x in enumerate(r[1:]): v[int(x)-1]=j
    rank.append(v)
ans=[-1]*10; taken=[False]*10
for r in range(10):
    best={}
    for i in range(10):
        if ans[i]>=0: continue
        b=a[i][r]
        if not taken[b] and (b not in best or rank[b][i]<rank[b][best[b]]): best[b]=i
    for b,i in best.items(): ans[i]=b; taken[b]=True
for i,b in enumerate(ans): print('A'+str(i+1)+',B'+str(b+1))''')

add('a906','dp','medium','誤取最後棋子的狀態 DP','在4096個遮罩上計算勝負。',[
'以12-bit遮罩表示棋子。預先建立所有單點與題目12條相鄰邊的雙點取法；只可移除遮罩中完整存在的取法。',
'空局面設為必勝，因為剛取完最後棋子的對手已輸。非空局面只要能移到必敗局面就是必勝，否則必敗。每次取棋子都會減少遮罩值，故由小到大求值即可。'],
'預處理 O(2^12×24)，每筆查詢 O(12)，空間 O(2^12)。','空狀態的勝負基底與一般取最後者勝的遊戲相反。',[
('一枚棋子','只有A時必須取最後一子，先手輸。',['A'],[('勝負','0')]),
('兩枚不相鄰','只有A、B，先手取一枚，迫使後手取最後一枚。',['A','B'],[('勝負','1')]),
('三枚互不相鄰','只有A、B、F，每次只能取一枚，先手會取到最後。',['A','B','F'],[('勝負','0')])],
'''int main(){vector<int>moves;for(int i=0;i<12;i++)moves.push_back(1<<i);for(string e:vector<string>{"AD","DH","HK","BE","EI","IL","CD","DE","EF","GH","HI","IJ"})moves.push_back((1<<(e[0]-'A'))|(1<<(e[1]-'A')));vector<int>w(4096);w[0]=1;for(int s=1;s<4096;s++)for(int t:moves)if((s&t)==t&&!w[s^t])w[s]=1;int n;cin>>n;while(n--){string s;cin>>s;int mask=0;for(int i=0;i<12;i++)if(s[i]=='1')mask|=1<<i;cout<<w[mask];}cout<<'\\n';}''',
'''import sys
moves=[1<<i for i in range(12)]+[(1<<(ord(e[0])-65))|(1<<(ord(e[1])-65)) for e in 'AD DH HK BE EI IL CD DE EF GH HI IJ'.split()]
w=[False]*4096; w[0]=True
for s in range(1,4096): w[s]=any(s&t==t and not w[s^t] for t in moves)
it=iter(sys.stdin.read().split()); n=int(next(it)); ans=[]
for _ in range(n):
    s=next(it); mask=sum(1<<i for i,c in enumerate(s) if c=='1'); ans.append(str(int(w[mask])))
print(''.join(ans))''')

add('a907','number-theory','easy','組合數表示的有限枚舉','依a、b遞增找出唯一合法c。',[
'枚舉 a≥2，直到 C(a,3)>N 就可停止。對每個 a 枚舉 1≤b<a，令 c=N−C(a,3)−C(b,2)，檢查0≤c<b。',
'所有合法表示都出現在此範圍，且 c 由 a、b 唯一決定。按 a、b 的數值順序找到第一組，符合題目盡量取小 a、b 的規則。N=0 也得到210，不需要特判。'],
'若 A 為最大枚舉a，時間 O(A²)，空間 O(1)；N≤500時A很小。','a、b、c可能超過一位，直接串接數字，不要當作三個十進位位數。',[
('N=2','a=2的C(a,3)=0，但b=1只能容許c=0，無法表示2。',[2,1],[('未找到','是')]),
('a=3','C(3,3)=1，b=1時c=1不小於b，非法。',[3,1,1],[('c<b','否')]),
('提高b','b=2時C(2,2)=1，c=0，輸出320。',[3,2,0],[('總和','1+1+0=2')])],
'''int main(){int T;cin>>T;while(T--){int n;cin>>n;bool done=0;for(int a=2;!done&&a*(a-1)*(a-2)/6<=n;a++)for(int b=1;b<a;b++){int c=n-a*(a-1)*(a-2)/6-b*(b-1)/2;if(c>=0&&c<b){cout<<a<<b<<c<<'\\n';done=1;break;}}}}''',
'''import sys,math
it=iter(map(int,sys.stdin.buffer.read().split()))
for _ in range(next(it)):
    n=next(it); found=False; a=2
    while not found:
        for b in range(1,a):
            c=n-math.comb(a,3)-math.comb(b,2)
            if 0<=c<b: print(str(a)+str(b)+str(c)); found=True; break
        a+=1''')

add('a908','sorting','easy','穩定排序與位移下界','每座雕像直接搬到排序後的位置。',[
'以(高度,重量,原始位置)排序，得到每座雕像唯一的目的位置。高度重量同時相同時由原位置打破平手，保持穩定。',
'每座雕像的總搬動距離至少是原位置與目的位置之差的絕對值。因為平台允許暫放多個雕像，可逐座直接搬到目的位置，完全達到所有下界之和，無須額外交換成本。'],
'時間 O(n log n)，空間 O(n)。','重量只影響排序，不乘在搬運距離上。',[
('原始高度','示意三座同重量，高度3、1、2。',[3,1,2],[('原位置','1,2,3')]),
('目的位置','排序後原雕像依序是第2、第3、第1座。',[2,3,1],[('位移','1,1,2')]),
('直接搬動','各座距離下界可以同時達成。',[1,1,2],[('總距離','4')])],
'''int main(){int n;cin>>n;vector<tuple<int,int,int>>a;for(int i=0;i<n;i++){int h,w;cin>>h>>w;a.push_back({h,w,i});}sort(a.begin(),a.end());long long ans=0;for(int i=0;i<n;i++)ans+=abs(get<2>(a[i])-i);cout<<ans<<'\\n';}''',
'''import sys
it=iter(map(int,sys.stdin.buffer.read().split())); n=next(it); a=sorted((next(it),next(it),i) for i in range(n))
print(sum(abs(old-new) for new,(_,_,old) in enumerate(a)))''')

add('a909','dp','hard','區間最大最小值','保留負中間值以處理減法與乘法。',[
'將算式拆成數字陣列和運算子陣列。對每個區間同時記錄可得最小值與最大值，單一數字的兩者相同。',
'枚舉最後執行的運算子，把左右子區間的最小、最大端點兩兩運算，更新整區間的極值。加、減、乘在固定另一側時都是單調函數，因此矩形取值範圍的極值一定出現在端點組合；不必儲存所有結果。使用任意精度避免中間值溢位。'],
'n個運算元需 O(n³) 次大整數運算、O(n²) 個大整數空間；位元成本隨中間值位數增加。','最大乘積可能來自兩個負的最小值，不能只做最大值DP。',[
('示意6*3−9*3','中段3−9可為−6。',['6','*','3','−','9','*','3'],[('區間3−9','−6')]),
('不同括號','(6*3−9)*3=27；6*(3−9)*3=−108。',[27,-108],[('需保留最小值','是')]),
('取最大','枚舉所有最後運算位置後最大是27。',[27],[('答案','27')])],
BIG+'''int main(){string s;while(cin>>s){vector<cpp_int>a;vector<char>op;for(int i=0;i<(int)s.size();){cpp_int x=0;while(i<(int)s.size()&&isdigit(s[i]))x=x*10+s[i++]-'0';a.push_back(x);if(i<(int)s.size())op.push_back(s[i++]);}int n=a.size();vector<vector<cpp_int>>lo(n,vector<cpp_int>(n)),hi=lo;for(int i=0;i<n;i++)lo[i][i]=hi[i][i]=a[i];for(int len=2;len<=n;len++)for(int l=0;l+len<=n;l++){int r=l+len-1;bool first=true;for(int k=l;k<r;k++)for(cpp_int x:{lo[l][k],hi[l][k]})for(cpp_int y:{lo[k+1][r],hi[k+1][r]}){cpp_int z;if(op[k]=='+')z=x+y;else if(op[k]=='-')z=x-y;else z=x*y;if(first||z<lo[l][r])lo[l][r]=z;if(first||z>hi[l][r])hi[l][r]=z;first=false;}}cout<<hi[0][n-1]<<'\\n';}}''',
'''import sys,re
for s in sys.stdin:
    s=s.strip()
    if not s: continue
    a=list(map(int,re.findall(r'[0-9]+',s))); ops=re.findall(r'[-+*]',s); n=len(a); lo=[[0]*n for _ in a]; hi=[[0]*n for _ in a]
    for i,x in enumerate(a): lo[i][i]=hi[i][i]=x
    for length in range(2,n+1):
        for l in range(n-length+1):
            r=l+length-1; values=[]
            for k in range(l,r):
                for x in (lo[l][k],hi[l][k]):
                    for y in (lo[k+1][r],hi[k+1][r]): values.append(x+y if ops[k]=='+' else x-y if ops[k]=='-' else x*y)
            lo[l][r]=min(values); hi[l][r]=max(values)
    print(hi[0][n-1])''')

add('a910','sorting','easy','排序後相鄰差平方','按固定拜訪順序累加每段飼料。',[
'將孩子座標升冪排序，在最前面補上出發座標0。相鄰兩個座標的差就是一段連續飛行距離。',
'每段獨立需要距離平方公斤牧草，累加即可；最後一段停在最遠孩子，不返回0。原題沒有座標上界，使用任意精度整數。'],
'O(n log n) 次大整數比較、O(n) 次平方運算；儲存 O(nL)，L是座標位數。','最近鄰不超過100不代表每一對排序相鄰座標差都不超過100，不能用小型固定座標表。',[
('示意座標','孩子座標3、1、2，排序後1、2、3。',[0,1,2,3],[('起點','0')]),
('每段距離','三段距離皆1。',[1,1,1],[('每段牧草','1')]),
('加總','不返回起點，總共3公斤。',[1,1,1],[('答案','3')])],
BIG+'''int main(){int n;cin>>n;vector<cpp_int>a(n);for(auto&x:a)cin>>x;sort(a.begin(),a.end());cpp_int prev=0,ans=0;for(auto x:a){cpp_int d=x-prev;ans+=d*d;prev=x;}cout<<ans<<'\\n';}''',
'''import sys
n,*a=map(int,sys.stdin.buffer.read().split()); prev=ans=0
for x in sorted(a): ans+=(x-prev)**2; prev=x
print(ans)''')

add('a911','search','hard','路徑導向的參數枚舉與區間限制','利用迴圈次數縮小初始參數。',[
'令路徑中19與21的總次數為 L。進入迴圈時 a 必須恰為 L（或零次時非正），而迴圈前 a 只可能是10x₀²、10x₀²−10、10x₀²+90，故必有10x₀²≤L+10。只需枚舉極少的 x₀。',
'賦值2後 x=A=10x₀²。若原 y≤A，枚舉0到A；若原 y>A，行4將其改成A，後續不再依賴原 y，最小原值必為A+1。因此只需枚舉 y₀=0..A+1。',
'沿指定路徑模擬 x、y、a。遇到涉及 z 的6、12、14時，依下一節點將嚴格不等式換成 z 的整數上下界；其他分支和所有控制流程邊直接檢查。最後取非負下界 z 並最小化原 x₀+y₀+z。若上下界矛盾、流程錯誤或迴圈次數不符就輸出inf。'],
'若路徑長P、L為迴圈次數，時間 O(P(L+10)^(3/2))，空間 O(P)；題目P≤1000。','括號行與23→17回邊必須精確匹配，不能只計算19、21次數就宣布可行。',[
('示意零次路徑','1 2 3 5 6 12 13 16 17 23 24。',[1,2,3,5,6,12,13,16,17,23,24],[('L','0')]),
('測試原參數','x₀=y₀=z=0時，6為假、12為真，a減10。',['x=0','y=0','z=0','a=−10'],[('17條件','假')]),
('達到下界','所有原參數非負，總和不可能小於0，所以答案0。',['0'],[('最小總和','0')])],
'''long long test(const vector<int>&p,long long x,long long y){long long a=0,lo=0,hi=INT_MAX;map<int,int>edge={{1,2},{2,3},{4,5},{5,6},{8,11},{9,10},{10,11},{11,16},{13,16},{15,16},{16,17},{19,22},{20,21},{21,22},{22,23}};for(int i=0;i+1<(int)p.size();i++){int u=p[i],v=p[i+1],want=-1;if(u==2)a=10*x*x,x=a;if(u==4)y=a;if(u==8)x+=10;if(u==10)y-=9;if(u==13)a-=10;if(u==15)a+=90;if(u==19)x++,a--;if(u==21)y--,a--;if(u==3)want=x<y?4:5;else if(u==7)want=x<y?8:9;else if(u==17)want=a>0?18:23;else if(u==18)want=x<y?19:20;else if(u==6){if(v==7)hi=min(hi,100*x+20*y-1);else if(v==12)lo=max(lo,100*x+20*y);else return -1;want=v;}else if(u==12){if(v==13)hi=min(hi,2*x*x-y);else if(v==14)lo=max(lo,2*x*x-y+1);else return -1;want=v;}else if(u==14){if(v==15)lo=max(lo,101-x);else if(v==16)hi=min(hi,100-x);else return -1;want=v;}else if(u==23)want=i+2==(int)p.size()?24:17;else if(edge.count(u))want=edge[u];if(v!=want)return -1;}return lo<=hi?lo:-1;}int main(){int n;cin>>n;string line;getline(cin,line);for(int q=0;q<n;q++){getline(cin,line);istringstream in(line);vector<int>p;int t,L=0;while(in>>t){p.push_back(t);if(t==19||t==21)L++;}long long ans=LLONG_MAX;if(p.size()>=2&&p.front()==1&&p.back()==24)for(long long x=0;10*x*x<=L+10;x++){long long A=10*x*x;for(long long y=0;y<=A+1;y++){long long z=test(p,x,y);if(z>=0)ans=min(ans,x+y+z);}}if(q%15)cout<<',';if(ans==LLONG_MAX)cout<<"inf";else cout<<ans;if(q%15==14||q+1==n)cout<<'\\n';}}''',
'''import sys
edges={1:2,2:3,4:5,5:6,8:11,9:10,10:11,11:16,13:16,15:16,16:17,19:22,20:21,21:22,22:23}
def test(p,x,y):
    a=0; low=0; high=2147483647
    for i,(u,v) in enumerate(zip(p,p[1:])):
        if u==2: a=10*x*x; x=a
        elif u==4: y=a
        elif u==8: x+=10
        elif u==10: y-=9
        elif u==13: a-=10
        elif u==15: a+=90
        elif u==19: x+=1; a-=1
        elif u==21: y-=1; a-=1
        if u==3: want=4 if x<y else 5
        elif u==7: want=8 if x<y else 9
        elif u==17: want=18 if a>0 else 23
        elif u==18: want=19 if x<y else 20
        elif u==6:
            if v==7: high=min(high,100*x+20*y-1)
            elif v==12: low=max(low,100*x+20*y)
            else: return None
            want=v
        elif u==12:
            if v==13: high=min(high,2*x*x-y)
            elif v==14: low=max(low,2*x*x-y+1)
            else: return None
            want=v
        elif u==14:
            if v==15: low=max(low,101-x)
            elif v==16: high=min(high,100-x)
            else: return None
            want=v
        elif u==23: want=24 if i+2==len(p) else 17
        else: want=edges.get(u,-1)
        if want!=v: return None
    return low if low<=high else None
f=sys.stdin; n=int(f.readline()); out=[]
for _ in range(n):
    p=list(map(int,f.readline().split())); L=p.count(19)+p.count(21); best=None; x=0
    if p and p[0]==1 and p[-1]==24:
        while 10*x*x<=L+10:
            for y in range(10*x*x+2):
                z=test(p,x,y)
                if z is not None: best=x+y+z if best is None else min(best,x+y+z)
            x+=1
    out.append('inf' if best is None else str(best))
for i in range(0,n,15): print(','.join(out[i:i+15]))''')

add('a912','geometry','hard','凸多邊形逐邊裁切','以每條逆時針邊的左半平面保留交集。',[
'凸多邊形內部位於每條逆時針邊的左側。以土地多邊形為目前圖形，逐條舊廠址邊裁切；每段按起終點在半平面內外，保留內點並在穿越時加入直線交點。',
'每輪保留的圖形恰是前一圖形與該半平面的交集，依歸納最後就是兩多邊形交集。用鞋帶公式計算面積。兩語言皆採有理數，最後由分子分母整數四捨五入，避免交點與小數恰半的浮點誤差。'],
'若交集過程頂點上限為V≤M+N，O(NV)次有理數運算，空間O(V)個有理數；分子分母位數影響運算成本。','只保留左半平面；頂點落在邊界也算在內。',[
('示意兩正方形','A=[0,2]²、B=[1,3]²。',['A面積4','B面積4'],[('交集非空','是')]),
('逐邊裁切','裁完B的四邊，留下[1,2]×[1,2]。',['(1,1)','(2,1)','(2,2)','(1,2)'],[('頂點數','4')]),
('鞋帶面積','交集寬1、高1，輸出1.00。',['1.00'],[('面積','1')])],
BIG+'''#include <boost/rational.hpp>
using Q=boost::rational<cpp_int>;struct P{Q x,y;};Q cross(P a,P b,P c){return (b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);}int main(){int m,n;cin>>m;vector<P>a(m);for(auto &p:a){int x,y;cin>>x>>y;p={Q(x),Q(y)};}cin>>n;vector<P>b(n);for(auto&p:b){int x,y;cin>>x>>y;p={Q(x),Q(y)};}for(int k=0;k<n;k++){vector<P>c;P u=b[k],v=b[(k+1)%n];for(int i=0;i<(int)a.size();i++){P s=a[i],t=a[(i+1)%a.size()];Q ds=cross(u,v,s),dt=cross(u,v,t);if(ds>=Q(0))c.push_back(s);if((ds<Q(0)&&dt>Q(0))||(ds>Q(0)&&dt<Q(0))){Q f=ds/(ds-dt);c.push_back({s.x+(t.x-s.x)*f,s.y+(t.y-s.y)*f});}}a=c;}Q area;for(int i=0;i<(int)a.size();i++)area+=a[i].x*a[(i+1)%a.size()].y-a[i].y*a[(i+1)%a.size()].x;if(area<Q(0))area=-area;area/=Q(2);cpp_int num=area.numerator()*100,den=area.denominator(),q=num/den;if(2*(num%den)>=den)q++;cout<<q/100<<'.'<<setw(2)<<setfill('0')<<(q%100).convert_to<int>()<<'\\n';}''',
'''import sys
from fractions import Fraction as F
it=iter(map(int,sys.stdin.buffer.read().split())); a=[(F(next(it)),F(next(it))) for _ in range(next(it))]; b=[(F(next(it)),F(next(it))) for _ in range(next(it))]
def cross(u,v,p): return (v[0]-u[0])*(p[1]-u[1])-(v[1]-u[1])*(p[0]-u[0])
for u,v in zip(b,b[1:]+b[:1]):
    c=[]
    for s,t in zip(a,a[1:]+a[:1]):
        ds,dt=cross(u,v,s),cross(u,v,t)
        if ds>=0: c.append(s)
        if ds*dt<0:
            f=ds/(ds-dt); c.append((s[0]+(t[0]-s[0])*f,s[1]+(t[1]-s[1])*f))
    a=c
area=abs(sum(s[0]*t[1]-s[1]*t[0] for s,t in zip(a,a[1:]+a[:1])))/2
z=area*100; q,r=divmod(z.numerator,z.denominator); q+=2*r>=z.denominator
print(str(q//100)+'.'+str(q%100).zfill(2))''')

add('a913','geometry','hard','水平掃描與持續區間合併','只在邊界形狀改變時分出新草坪。',[
'將所有頂點y排序，對相鄰y形成的水平帶，在帶中央與所有垂直邊求交，排序x後兩兩配成草坪內部區間。這些區間在整個帶內維持不變。',
'若某個完整左右端點區間在上一帶仍存在，就延長原小草坪；否則從目前y開始建立新塊。上帶消失的區間則在此高度結束。這樣不會把不相關的遠處水平邊誤當成貫穿切線，又會在真正凹角導致左右界改變時切開。',
'完成後按每塊左下角(y,x)排序，計算編號、奇數總和與面積乘塊數≥總面積的條件，最後用編號查表回答子集合。'],
'V個頂點的掃描時間 O(V² log V)，空間 O(V²+SK)（本解讀取所有查詢）；可串流降查詢空間。','不應在所有y層無條件切斷相同左右界；平均比較使用整數乘法。',[
('示意L形','頂點(0,0),(2,0),(2,1),(1,1),(1,2),(0,2)。',['y:0,1,2'],[('水平帶','2')]),
('左右界變化','下帶區間[0,2]，上帶[0,1]，需要兩塊。',['下:2×1','上:1×1'],[('面積','2,1')]),
('排序統計','下塊編號1，上塊編號2；奇數面積2，至少平均的面積也是2。',['塊數2','奇數2','達平均2'],[('總面積','3')])],
'''int main(){int n;cin>>n;vector<pair<int,int>>p(n);vector<int>ys;for(auto &[x,y]:p){cin>>x>>y;ys.push_back(y);}sort(ys.begin(),ys.end());ys.erase(unique(ys.begin(),ys.end()),ys.end());vector<array<long long,4>>rect;map<pair<int,int>,int>prev;for(int h=0;h+1<(int)ys.size();h++){int y=ys[h],top=ys[h+1];vector<int>xs;for(int i=0;i<n;i++){auto[x1,y1]=p[i];auto[x2,y2]=p[(i+1)%n];if(x1==x2&&2*min(y1,y2)<y+top&&y+top<2*max(y1,y2))xs.push_back(x1);}sort(xs.begin(),xs.end());map<pair<int,int>,int>now;for(int i=0;i+1<(int)xs.size();i+=2){pair<int,int>key={xs[i],xs[i+1]};int id;if(prev.count(key)){id=prev[key];rect[id][3]=top;}else{id=rect.size();rect.push_back({xs[i],y,xs[i+1],top});}now[key]=id;}prev=now;}sort(rect.begin(),rect.end(),[](auto a,auto b){return pair{a[1],a[0]}<pair{b[1],b[0]};});vector<long long>a;long long total=0,odd=0,big=0;for(auto r:rect){long long v=(r[2]-r[0])*(r[3]-r[1]);a.push_back(v);total+=v;if(a.size()%2)odd+=v;}for(auto v:a)if(v*(long long)a.size()>=total)big+=v;cout<<a.size()<<'\\n'<<odd<<'\\n'<<big<<'\\n';int S,K;cin>>S>>K;while(S--){long long ans=0;for(int j=0;j<K;j++){int x;cin>>x;ans+=a[x-1];}cout<<ans<<'\\n';}}''',
'''import sys
it=iter(map(int,sys.stdin.buffer.read().split())); n=next(it); p=[(next(it),next(it)) for _ in range(n)]; ys=sorted({y for x,y in p}); rect=[]; prev={}
for y,top in zip(ys,ys[1:]):
    xs=sorted(x for (x,a),(u,b) in zip(p,p[1:]+p[:1]) if x==u and 2*min(a,b)<y+top<2*max(a,b)); now={}
    for l,r in zip(xs[::2],xs[1::2]):
        key=(l,r)
        if key in prev: idx=prev[key]; rect[idx][3]=top
        else: idx=len(rect); rect.append([l,y,r,top])
        now[key]=idx
    prev=now
rect.sort(key=lambda v:(v[1],v[0])); areas=[(r-l)*(t-b) for l,b,r,t in rect]; total=sum(areas)
print(len(areas)); print(sum(areas[::2])); print(sum(a for a in areas if a*len(areas)>=total))
S,K=next(it),next(it)
for _ in range(S): print(sum(areas[next(it)-1] for _ in range(K)))''')

add('a914','search','easy','遞增組合的字典序枚舉','以完整組合清單定位目前與下一項。',[
'n≤10，最多只有C(10,5)=252個組合。從1開始按遞增順序選取每個數，每次只向更大的下一個數遞迴，剛選滿k個時記錄。',
'遞迴先比較第一個數，再比較後續數，與字典序定義完全相同。找到輸入組合的0起算索引i，編號就是i+1；若i+1仍在清單內就是下一組，否則輸出指定訊息。'],
'時間與空間 O(k C(n,k))。','編號從1開始；最後一組仍需輸出第二行 no next combination。',[
('列舉示意','n=4、k=2，清單12、13、14、23、24、34。',['12','13','14','23','24','34'],[('總數','6')]),
('定位14','14位於索引2。',['14'],[('編號','3')]),
('下一項','索引3是23。',['2 3'],[('下一組','23')])],
'''int main(){int n,k;cin>>n>>k;vector<int>given(k),cur;for(int&x:given)cin>>x;vector<vector<int>>all;function<void(int)>dfs=[&](int start){if((int)cur.size()==k){all.push_back(cur);return;}for(int x=start;x<=n;x++){cur.push_back(x);dfs(x+1);cur.pop_back();}};dfs(1);int i=find(all.begin(),all.end(),given)-all.begin();cout<<i+1<<'\\n';if(i+1==(int)all.size())cout<<"no next combination\\n";else for(int j=0;j<k;j++)cout<<all[i+1][j]<<(j+1==k?'\\n':' ');}''',
'''import sys,itertools
n,k,*a=map(int,sys.stdin.buffer.read().split()); allc=list(itertools.combinations(range(1,n+1),k)); i=allc.index(tuple(a)); print(i+1)
if i+1==len(allc): print('no next combination')
else: print(*allc[i+1])''')

add('a915','search','easy','九個候選位置逐一驗證','將相鄰條件寫成曼哈頓距離1。',[
'格號v轉為((v−1)//3,(v−1)%3)。兩格共邊相鄰恰好是列差與行差的絕對值總和為1，因此自身和對角自然排除。',
'每筆資訊獨立枚舉地雷1..9，檢查與第一格相鄰、與第二第三格都不相鄰。全部通過的候選按枚舉順序輸出；沒有候選輸出Empty。枚舉完整位置空間，故能同時處理多解與矛盾。'],
'每筆時間 O(9)，額外空間 O(9)。','各筆是獨立問題，不把前一筆條件累積到下一筆。',[
('資訊4 2 3','先列出與4共邊的候選：1、5、7。',[1,5,7],[('候選數','3')]),
('排除鄰接2','1與5都相鄰2，因此排除。',[7],[('剩餘','1')]),
('排除鄰接3','7不相鄰3，保留下來。',[7],[('答案','7')])],
'''bool adj(int a,int b){--a;--b;return abs(a/3-b/3)+abs(a%3-b%3)==1;}int main(){int n;cin>>n;while(n--){int a,b,c;cin>>a>>b>>c;vector<int>v;for(int x=1;x<=9;x++)if(adj(x,a)&&!adj(x,b)&&!adj(x,c))v.push_back(x);if(v.empty())cout<<"Empty\\n";else for(int i=0;i<(int)v.size();i++)cout<<v[i]<<(i+1==(int)v.size()?'\\n':' ');}}''',
'''import sys
def adj(a,b):
    a-=1; b-=1
    return abs(a//3-b//3)+abs(a%3-b%3)==1
it=iter(map(int,sys.stdin.buffer.read().split()))
for _ in range(next(it)):
    a,b,c=next(it),next(it),next(it); v=[x for x in range(1,10) if adj(x,a) and not adj(x,b) and not adj(x,c)]
    print(' '.join(map(str,v)) if v else 'Empty')''')

add('a916','number-theory','hard','有限域線性方程與自由變數','求任一原始數字向量並加總。',[
'令A為含自身的鄰接矩陣，輸入最終數字為b，原始數字向量x滿足Ax=b (mod P)。以模質數高斯消去找任一解，自由變數可全部設0。',
'為何任意解的加總相同？秘密集合的指示向量s滿足As=1；A對稱，所以1ᵀx=sᵀAx=sᵀb。這與x的選擇無關，也證明不需要知道秘密集合或逐一恢復唯一原值。主元用費馬小定理求逆，消去後回代並加總。'],
'時間 O(N³ log P)的保守上界（實際主元逆元共N次），空間 O(N²)。Python純迴圈在N=1000的稠密最壞情況可能超過1500ms，需更快有限域運算實作以保證時限。','P是質數，非零主元才能求逆；不能假設A可逆。',[
('兩點相連','A=[[1,1],[1,1]]，最終數字皆7，P=11。',['1 1 | 7','1 1 | 7'],[('秩','1')]),
('自由變數','可取第二個原值0，第一個原值7。',['x1=7','x2=0'],[('任一解','成立')]),
('秘密和','任一解都滿足x1+x2=7，因此輸出7。',[7],[('mod11','7')])],
'''long long power(long long a,long long e,long long p){long long r=1;while(e){if(e&1)r=r*a%p;a=a*a%p;e>>=1;}return r;}int main(){int n;long long p;cin>>n>>p;vector<vector<long long>>a(n,vector<long long>(n+1));for(int i=0;i<n;i++){cin>>a[i][n];a[i][n]=(a[i][n]%p+p)%p;for(int j=0;j<n;j++){int v;cin>>v;a[i][j]=v!=0;}}int r=0;vector<int>cols;for(int c=0;c<n&&r<n;c++){int k=r;while(k<n&&!a[k][c])k++;if(k==n)continue;swap(a[r],a[k]);long long inv=power(a[r][c],p-2,p);for(int j=c;j<=n;j++)a[r][j]=a[r][j]*inv%p;for(int i=r+1;i<n;i++)if(a[i][c]){long long f=a[i][c];for(int j=c;j<=n;j++)a[i][j]=(a[i][j]-f*a[r][j]%p+p)%p;}cols.push_back(c);r++;}vector<long long>x(n);for(int i=r-1;i>=0;i--){int c=cols[i];long long v=a[i][n];for(int j=c+1;j<n;j++)v=(v-a[i][j]*x[j]%p+p)%p;x[c]=v;}long long ans=0;for(auto v:x)ans=(ans+v)%p;cout<<ans<<'\\n';}''',
'''import sys
it=iter(map(int,sys.stdin.buffer.read().split())); n,p=next(it),next(it); a=[]
for _ in range(n):
    b=next(it)%p; a.append([int(next(it)!=0) for _ in range(n)]+[b])
r=0; cols=[]
for c in range(n):
    pivot=next((i for i in range(r,n) if a[i][c]),None)
    if pivot is None: continue
    a[r],a[pivot]=a[pivot],a[r]; inv=pow(a[r][c],p-2,p); row=a[r]
    for j in range(c,n+1): row[j]=row[j]*inv%p
    for i in range(r+1,n):
        factor=a[i][c]
        if factor:
            for j in range(c,n+1): a[i][j]=(a[i][j]-factor*row[j])%p
    cols.append(c); r+=1
    if r==n: break
x=[0]*n
for i in range(r-1,-1,-1):
    c=cols[i]; x[c]=(a[i][n]-sum(a[i][j]*x[j] for j in range(c+1,n)))%p
print(sum(x)%p)''')

add('a917','simulation','medium','Moore 鄰域輪廓追蹤','依順時針掃描八鄰格找下一個輪廓點。',[
'先找最上方最左方的1作起點，將其左鄰格當作背景參考點。每步從參考方向開始，按順時針掃描八鄰格，第一個物件格就是下一個輪廓格。',
'移動前把掃描中緊接在選中方向之前的格子，設為新參考點；到新位置後重新換算參考方向。這保持背景在輪廓左外側、物件在右內側，因此會沿題目要求的順時針方向走。題目保證簡單輪廓，首次回起點即可結束並輸出每步方向碼。'],
'輸入 O(RC)，追蹤 O(輪廓長度)，空間 O(RC)。','八方向碼由右起逆時針編號，掃描順時針時數碼要遞減；邊界外一律視為背景。',[
('三角形示意','2×2遮罩為10 / 11，起點左上。',['10','11'],[('起點','0,0')]),
('順時針走','先走右下到(1,1)，方向7，再左到(1,0)，方向4。',[7,4],[('背景在外側','是')]),
('回到起點','再上一步方向2，輸出742。',[7,4,2],[('輸出','742')])],
'''int main(){int R,C;cin>>R>>C;vector<vector<int>>a(R,vector<int>(C));pair<int,int>s={-1,-1};for(int r=0;r<R;r++)for(int c=0;c<C;c++){cin>>a[r][c];if(a[r][c]&&s.first<0)s={r,c};}int dr[]={0,-1,-1,-1,0,1,1,1},dc[]={1,1,0,-1,-1,-1,0,1};int r=s.first,c=s.second,br=r,bc=c-1;string out;do{int start=0;for(int d=0;d<8;d++)if(r+dr[d]==br&&c+dc[d]==bc)start=d;int d=start;for(int k=0;k<8;k++){d=(start-k+8)%8;int nr=r+dr[d],nc=c+dc[d];if(nr>=0&&nr<R&&nc>=0&&nc<C&&a[nr][nc])break;}br=r+dr[(d+1)%8];bc=c+dc[(d+1)%8];r+=dr[d];c+=dc[d];out+=char('0'+d);}while(pair{r,c}!=s);cout<<out<<'\\n';}''',
'''import sys
it=iter(map(int,sys.stdin.buffer.read().split())); R,C=next(it),next(it); a=[[next(it) for _ in range(C)] for _ in range(R)]; s=next((r,c) for r in range(R) for c in range(C) if a[r][c]); r,c=s; br,bc=r,c-1; dirs=[(0,1),(-1,1),(-1,0),(-1,-1),(0,-1),(1,-1),(1,0),(1,1)]; out=[]
while True:
    start=dirs.index((br-r,bc-c))
    for k in range(8):
        d=(start-k)%8; dr,dc=dirs[d]; nr,nc=r+dr,c+dc
        if 0<=nr<R and 0<=nc<C and a[nr][nc]: break
    bdr,bdc=dirs[(d+1)%8]; br,bc=r+bdr,c+bdc; r,c=nr,nc; out.append(str(d))
    if (r,c)==s: break
print(''.join(out))''')

add('a918','greedy','hard','下一個更便宜日與庫存目標','只囤足到更低價格或容量限制所需數量。',[
'以單調堆疊求每天後方第一個價格嚴格較低的日子j；若不存在則j=n。需求前綴和可O(1)求從今天到j−1的需求總量。',
'今天買入後的目標總量是 min(今天需求+B, 到j前需求)，無容量限制時直接用後者。若現有存貨不足就補到目標，接著扣今天需求。容量限制只約束消耗後庫存，所以購買前目標可達今天需求+B。',
'在更低價日之前，今天價格不比中間任何一天高，故可提前買足而不增加費用；超過更低價日前需求的部分則應延後購買。此交換論證加上容量限制給出每一天的最優補貨量。'],
'時間 O(n)，空間 O(n)。金額可能超過32位。','不能把購買前庫存限制為B；原有免費存貨應優先消耗。',[
('示意三日','價格4、3、8，需求1、3、5，B=5、初存2。',['4:需1','3:需3','8:需5'],[('初存','2')]),
('第一日','明天更便宜，今天不用買，消耗後剩1。',[1],[('花費','0')]),
('第二日囤貨','補7單位至8，消耗3後剩5，第三日剛好用完。',['買7×3','剩5','末日剩0'],[('總花費','21')])],
'''int main(){int n;long long B,stock;cin>>n>>B>>stock;vector<long long>x(n),y(n),pre(n+1);for(auto &v:x)cin>>v;for(int i=0;i<n;i++){cin>>y[i];pre[i+1]=pre[i]+y[i];}vector<int>next(n,n),st;for(int i=n-1;i>=0;i--){while(!st.empty()&&x[st.back()]>=x[i])st.pop_back();if(!st.empty())next[i]=st.back();st.push_back(i);}long long ans=0;for(int i=0;i<n;i++){long long target=pre[next[i]]-pre[i];if(B>=0)target=min(target,y[i]+B);long long buy=max(0LL,target-stock);ans+=buy*x[i];stock+=buy-y[i];}cout<<ans<<'\\n';}''',
'''import sys
it=iter(map(int,sys.stdin.buffer.read().split())); n,B,stock=next(it),next(it),next(it); x=[next(it) for _ in range(n)]; y=[next(it) for _ in range(n)]; pre=[0]
for v in y: pre.append(pre[-1]+v)
nxt=[n]*n; stack=[]
for i in range(n-1,-1,-1):
    while stack and x[stack[-1]]>=x[i]: stack.pop()
    if stack: nxt[i]=stack[-1]
    stack.append(i)
ans=0
for i in range(n):
    target=pre[nxt[i]]-pre[i]
    if B!=-1: target=min(target,y[i]+B)
    buy=max(0,target-stock); ans+=buy*x[i]; stock+=buy-y[i]
print(ans)''')

add('a919','trees','hard','前序展開的依賴背包','跳過技能時一次跳過整棵子樹。',[
'把技能森林做前序走訪，記錄每個節點的子樹結束索引end。前置技能一定排在所有後代之前，且整個子樹佔連續區間。',
'dp[i][e]表示從索引i開始、還有e點經驗的最佳攻擊力。可放棄此技能並跳到end[i]；或花其成本取得攻擊力，接著到i+1。只有先取得父節點才有機會進入後代，因此所有生成的選擇都合法；任何合法選擇也能以取或跳完整表示。從後往前計算。'],
'時間 O(NE)，空間 O(NE)。','輸入成本是負數，背包消耗需取相反數；E=0時答案0。',[
('示意依賴','A成本2攻擊3；B成本1攻擊4，需先取得A。',['A','B'],[('E','2')]),
('不能單取B','跳過A會直接跳出其整棵子樹，B不再可選。',['skip A→完成'],[('跳過收益','0')]),
('選取A','花2得3，剩0，無法再選B，最優3。',['take A','skip B'],[('最大攻擊','3')])],
'''int main(){int n;cin>>n;map<string,int>id;vector<int>cost(n),value(n),parent(n,-1);for(int i=0;i<n;i++){string s;int c;cin>>s>>c>>value[i];id[s]=i;cost[i]=-c;}int m;cin>>m;vector<vector<int>>g(n);while(m--){string a,b;cin>>a>>b;g[id[a]].push_back(id[b]);parent[id[b]]=id[a];}int E;cin>>E;vector<int>order,finish(n);function<void(int)>dfs=[&](int u){int pos=order.size();order.push_back(u);for(int v:g[u])dfs(v);finish[pos]=order.size();};for(int i=0;i<n;i++)if(parent[i]<0)dfs(i);vector<vector<int>>d(n+1,vector<int>(E+1));for(int i=n-1;i>=0;i--){int u=order[i];for(int e=0;e<=E;e++){d[i][e]=d[finish[i]][e];if(e>=cost[u])d[i][e]=max(d[i][e],value[u]+d[i+1][e-cost[u]]);}}cout<<d[0][E]<<'\\n';}''',
'''import sys
it=iter(sys.stdin.read().split()); n=int(next(it)); names={}; cost=[]; value=[]
for i in range(n): names[next(it)]=i; cost.append(-int(next(it))); value.append(int(next(it)))
g=[[] for _ in range(n)]; parent=[-1]*n
for _ in range(int(next(it))):
    u,v=names[next(it)],names[next(it)]; g[u].append(v); parent[v]=u
E=int(next(it)); order=[]; finish=[0]*n
def dfs(u):
    pos=len(order); order.append(u)
    for v in g[u]: dfs(v)
    finish[pos]=len(order)
for u in range(n):
    if parent[u]<0: dfs(u)
d=[[0]*(E+1) for _ in range(n+1)]
for i in range(n-1,-1,-1):
    u=order[i]; row=d[finish[i]].copy()
    for e in range(cost[u],E+1): row[e]=max(row[e],value[u]+d[i+1][e-cost[u]])
    d[i]=row
print(d[0][E])''')

add('a920','graphs','hard','區間圖最大重疊與參與次數','把朋友圈轉成區間共同覆蓋點。',[
'每位學生x對應區間[x,yx]。對x<z，兩區間重疊恰好等價於z≤yx，也就是兩人互為朋友。區間具有Helly性質：兩兩相交必有共同交點，因此朋友圈就是某個位置所有覆蓋區間的子集。',
'用差分求每個整數位置的覆蓋數，最大值K就是重要朋友圈大小。每個覆蓋數K的位置產生一個重要朋友圈，且各位置加入不同的新學生，因此集合互不相同。對K峰值位置做前綴計數，每人參加的重要朋友圈數就是其[x,yx]內峰值數。輸出計數最多者。'],
'時間 O(n)，空間 O(n)。','要最大化參加「最大」朋友圈的次數，不是最大度數。',[
('示意三人','區間[1,2]、[2,3]、[3,3]。',['[1,2]','[2,3]','[3,3]'],[('覆蓋數','1,2,2')]),
('重要朋友圈','在位置2為{1,2}，位置3為{2,3}。',['{1,2}','{2,3}'],[('大小K','2')]),
('參與次數','學生2參加兩圈，其餘各一圈。',[1,2,1],[('關鍵人物','2')])],
'''int main(){int n;cin>>n;vector<int>y(n+1),diff(n+3),cover(n+1),pre(n+1);for(int i=0;i<n;i++){int x,b;cin>>x>>b;y[x]=b;diff[x]++;diff[b+1]--;}int cur=0,K=0;for(int x=1;x<=n;x++){cur+=diff[x];cover[x]=cur;K=max(K,cur);}for(int x=1;x<=n;x++)pre[x]=pre[x-1]+(cover[x]==K);int best=0;vector<int>score(n+1);for(int x=1;x<=n;x++)best=max(best,score[x]=pre[y[x]]-pre[x-1]);for(int x=1;x<=n;x++)if(score[x]==best)cout<<x<<'\\n';}''',
'''import sys
it=iter(map(int,sys.stdin.buffer.read().split())); n=next(it); y=[0]*(n+1); diff=[0]*(n+3)
for _ in range(n):
    x,b=next(it),next(it); y[x]=b; diff[x]+=1; diff[b+1]-=1
cover=[]; cur=0
for x in range(1,n+1): cur+=diff[x]; cover.append(cur)
K=max(cover); pre=[0]
for c in cover: pre.append(pre[-1]+(c==K))
score=[pre[y[x]]-pre[x-1] for x in range(1,n+1)]; best=max(score)
for x,c in enumerate(score,1):
    if c==best: print(x)''')

add('a921','dp','hard','環狀最後移除與區間DP','固定最後一件後分解左右子問題。',[
'所有值正，所以漏投不會改善答案，可考慮全數移除。將序列複製一份，dp[l][r]表示保留兩端物品、移除所有中間物品的最高得分。',
'若中間最後移除的是k，得分a[l]a[r]，此前左右兩側獨立，故dp[l][r]=max(dp[l][k]+dp[k][r]+a[l]a[r])。枚舉最後留下物品i，兩端是同一物品的兩份表示，答案dp[i][i+n]+a[i]。只剩兩件時的平方分數也包含在此式。'],
'時間 O(n³)，空間 O(n²)。','不是移除物品自身值乘鄰居；每次得分只取當時兩側鄰居乘積。',[
('示意1,3,5','先移除1，左右鄰居是5與3。',[1,3,5],[('得分','15')]),
('兩件規則','再移除3，另一件5的平方為25。',[3,5],[('累計','40')]),
('最後一件','移除5再得5，總分45。',[5],[('總分','45')])],
'''int main(){int n;cin>>n;vector<long long>a(2*n);for(int i=0;i<n;i++){cin>>a[i];a[i+n]=a[i];}vector<vector<long long>>d(2*n,vector<long long>(2*n));for(int len=2;len<=n;len++)for(int l=0;l+len<2*n;l++){int r=l+len;for(int k=l+1;k<r;k++)d[l][r]=max(d[l][r],d[l][k]+d[k][r]+a[l]*a[r]);}long long ans=0;for(int i=0;i<n;i++)ans=max(ans,d[i][i+n]+a[i]);cout<<ans<<'\\n';}''',
'''import sys
n,*a=map(int,sys.stdin.buffer.read().split()); a*=2; d=[[0]*(2*n) for _ in range(2*n)]
for length in range(2,n+1):
    for l in range(2*n-length):
        r=l+length; d[l][r]=max(d[l][k]+d[k][r]+a[l]*a[r] for k in range(l+1,r))
print(max(d[i][i+n]+a[i] for i in range(n)))''')

add('a922','data-structures','medium','前綴樹節點計數','最深已存在前綴的通過數就是C。',[
'前綴樹每條邊是一個整數，節點count記錄先前有幾條情報通過。新增序列前先沿已有邊往下走，得到最長已存在深度Y。若走到整條序列末端，該節點count包含所有擁有此完整前綴的舊序列；若中途沒有邊，前一節點count就是最大共同前綴的數量。',
'價值為L²−Y×C。查完才插入並增加沿路計數，以免把自己當作先前情報。Y=0時C可為所有舊序列數，但乘積為0，所以第一條與完全不同首項都得到L²。'],
'令S為總長度，平均雜湊時間O(S)，空間O(S)；C++使用unordered_map，最壞雜湊退化需另計。','共同前綴不是子序列；舊序列較短並在目前節點結束時，也要計入count。',[
('第一條1,2','長度2，沒有先前情報，價值4。',[1,2],[('累積','4')]),
('第二條1,3','與舊序列最大前綴長1、數量1，價值4−1=3。',[1,3],[('累積','7')]),
('第三條1','最大前綴長1，兩條舊序列都達成，價值1−2=−1。',[1],[('總價值','6')])],
'''int main(){int n;cin>>n;vector<unordered_map<int,int>>g(1);vector<int>cnt(1);long long ans=0;while(n--){int L;cin>>L;vector<int>a(L);for(int&x:a)cin>>x;int u=0,Y=0;for(int x:a){auto it=g[u].find(x);if(it==g[u].end())break;u=it->second;Y++;}ans+=1LL*L*L-1LL*Y*cnt[u];u=0;cnt[u]++;for(int x:a){auto it=g[u].find(x);int v;if(it==g[u].end()){v=g.size();g[u][x]=v;g.emplace_back();cnt.push_back(0);}else v=it->second;u=v;cnt[u]++;}}cout<<ans<<'\\n';}''',
'''import sys
f=sys.stdin.buffer; n=int(f.readline()); edges=[{}]; count=[0]; ans=0
for _ in range(n):
    row=list(map(int,f.readline().split())); L=row[0]; a=row[1:]; u=Y=0
    for x in a:
        if x not in edges[u]: break
        u=edges[u][x]; Y+=1
    ans+=L*L-Y*count[u]; u=0; count[u]+=1
    for x in a:
        if x not in edges[u]: edges[u][x]=len(edges); edges.append({}); count.append(0)
        u=edges[u][x]; count[u]+=1
print(ans)''')

add('a923','dp','hard','三車位置壓縮DP','利用上一個服務地點作為已知車位。',[
'處理完第i個要求後，至少一輛車停在該要求地點last。只需記錄另兩車位置(a,b)，車輛無個別差異，可把a、b排序作為狀態。初始last=1，另兩車在2、3。',
'下一要求為v時，有三種選擇：last車移動，閒車仍是(a,b)；a車移動，閒車變成(last,b)；b車移動，閒車變成(last,a)。加上相應有向D費用後取最小。枚舉全部可能服務車，依序保留所有必要資訊，故不漏最優分派。'],
'Q個要求、m個地點，時間O(Qm²)，空間O(m²)。','矩陣有向，不可交換D的起終點；三車可停在同地，不能排除相同位置狀態。',[
('示意首個要求4','四地點間不同點距離均1。',['車:1,2,3'],[('需求','4')]),
('任一車前往','例如1號車1→4花1，閒車2、3。',['last=4','idle=2,3'],[('成本','1')]),
('下一要求2','停在2的車直接服務，增加0。',['last=2','idle=3,4'],[('總成本','1')])],
'''int main(){int m;cin>>m;vector<vector<long long>>D(m,vector<long long>(m));for(auto&r:D)for(auto&x:r)cin>>x;int last=0,v;map<pair<int,int>,long long>d;d[{1,2}]=0;while(cin>>v){--v;map<pair<int,int>,long long>nd;auto put=[&](int a,int b,long long cost){if(a>b)swap(a,b);pair<int,int>key={a,b};if(!nd.count(key)||cost<nd[key])nd[key]=cost;};for(auto [key,c]:d){auto[a,b]=key;put(a,b,c+D[last][v]);put(last,b,c+D[a][v]);put(last,a,c+D[b][v]);}d=move(nd);last=v;}long long ans=LLONG_MAX;for(auto [key,c]:d)ans=min(ans,c);cout<<ans<<'\\n';}''',
'''import sys
it=iter(map(int,sys.stdin.buffer.read().split())); m=next(it); D=[[next(it) for _ in range(m)] for _ in range(m)]; last=0; d={(1,2):0}
for v in it:
    v-=1; nd={}
    for (a,b),cost in d.items():
        for x,y,c in ((a,b,cost+D[last][v]),(last,b,cost+D[a][v]),(last,a,cost+D[b][v])):
            key=(min(x,y),max(x,y))
            if c<nd.get(key,10**100): nd[key]=c
    d=nd; last=v
print(min(d.values()))''')

add('a924','search','medium','帶蹩腳條件的BFS','按照原題(1,3)跳躍建立邊。',[
'枚舉位移(±1,±3)、(±3,±1)。長方向的第一個相鄰格是馬腳位置，必須無障礙；落點也必須在0..99內且無障礙。',
'將可走跳躍當作單位權邊，從起點BFS。首次抵達寶物的距離最短；若無法抵達輸出impossible。蹩腳不另算一步，跳躍整體只算一步。'],
'最多10000格、每格8邊，時間與空間皆O(100²+n)。','不是象棋馬的(1,2)，也不是檢查長方向所有中間格。',[
('空棋盤示意','起點(0,0)，終點(1,3)。',['(0,0)','(1,3)'],[('候選位移','+1,+3')]),
('檢查馬腳','長方向是y，馬腳為(0,1)，若此處無障礙即可跳。',['腳(0,1)'],[('落點合法','是')]),
('一步抵達','整個跳躍算一步。',['(0,0)→(1,3)'],[('答案','1')])],
'''int main(){int n;cin>>n;bool block[100][100]={};while(n--){int x,y;cin>>x>>y;block[x][y]=1;}int sx,sy,tx,ty;cin>>sx>>sy>>tx>>ty;vector<vector<int>>d(100,vector<int>(100,-1));queue<pair<int,int>>q;d[sx][sy]=0;q.push({sx,sy});while(!q.empty()){auto[x,y]=q.front();q.pop();for(int dx:{-3,-1,1,3})for(int dy:{-3,-1,1,3})if(abs(dx)+abs(dy)==4){int a=x+dx,b=y+dy,fx=x+(abs(dx)==3?(dx>0?1:-1):0),fy=y+(abs(dy)==3?(dy>0?1:-1):0);if(a>=0&&a<100&&b>=0&&b<100&&!block[a][b]&&!block[fx][fy]&&d[a][b]<0)d[a][b]=d[x][y]+1,q.push({a,b});}}if(d[tx][ty]<0)cout<<"impossible\\n";else cout<<d[tx][ty]<<'\\n';}''',
'''import sys
from collections import deque
it=iter(map(int,sys.stdin.buffer.read().split())); n=next(it); block={(next(it),next(it)) for _ in range(n)}; s=(next(it),next(it)); t=(next(it),next(it)); d={s:0}; q=deque([s])
while q:
    x,y=q.popleft()
    if (x,y)==t: break
    for dx,dy in ((a,b) for a in (-3,-1,1,3) for b in (-3,-1,1,3) if abs(a)+abs(b)==4):
        a,b=x+dx,y+dy; foot=(x+((1 if dx>0 else -1) if abs(dx)==3 else 0),y+((1 if dy>0 else -1) if abs(dy)==3 else 0))
        if 0<=a<100 and 0<=b<100 and (a,b) not in block and foot not in block and (a,b) not in d: d[a,b]=d[x,y]+1; q.append((a,b))
print(d.get(t,'impossible'))''')

add('a925','graphs','medium','DAG最長路與關鍵路徑','合併通往閘與離開閘的最長延遲。',[
'拓樸排序後計算前綴最長延遲f[v]=delay[v]+max f[前驅]；再按反向拓樸序算後綴g[v]=delay[v]+max g[後繼]。無前驅、無後繼的最大值視為0。',
'整體時間T=max f。經過v的最長路為f[v]+g[v]−delay[v]，等於T就表示v在某條關鍵路徑上。增加它的延遲會增加此路長度，故一定延長完成時間；若小於T，存在正鬆弛，小幅增加不影響T，所以不符合「任何增加」條件。'],
'時間O(n+m)，空間O(n+m)。','延遲可能是0；不要只找一條最長路，所有並列最長路上的節點都關鍵。',[
('示意分支','1→3、2→3，延遲分別2、1、3。',[2,1,3],[('f','2,1,5')]),
('反向最長路','g分別為5、4、3。',[5,4,3],[('T','5')]),
('判斷關鍵','節點1與3經過路長5，節點2只有4。',[1,3],[('關鍵數','2')])],
'''int main(){int n,m;cin>>n>>m;vector<int>w(n),in(n);for(int&x:w)cin>>x;vector<vector<int>>g(n);while(m--){int a,b;cin>>a>>b;g[--a].push_back(--b);in[b]++;}queue<int>q;for(int i=0;i<n;i++)if(!in[i])q.push(i);vector<long long>f(n),h(n);vector<int>order;while(!q.empty()){int u=q.front();q.pop();order.push_back(u);f[u]+=w[u];for(int v:g[u]){f[v]=max(f[v],f[u]);if(!--in[v])q.push(v);}}for(int i=n-1;i>=0;i--){int u=order[i];for(int v:g[u])h[u]=max(h[u],h[v]);h[u]+=w[u];}long long T=*max_element(f.begin(),f.end());int ans=0;for(int i=0;i<n;i++)if(f[i]+h[i]-w[i]==T)ans++;cout<<ans<<'\\n';}''',
'''import sys
from collections import deque
it=iter(map(int,sys.stdin.buffer.read().split())); n,m=next(it),next(it); w=[next(it) for _ in range(n)]; g=[[] for _ in w]; degree=[0]*n
for _ in range(m): a,b=next(it)-1,next(it)-1; g[a].append(b); degree[b]+=1
q=deque(i for i in range(n) if not degree[i]); f=[0]*n; order=[]
while q:
    u=q.popleft(); order.append(u); f[u]+=w[u]
    for v in g[u]:
        f[v]=max(f[v],f[u]); degree[v]-=1
        if degree[v]==0: q.append(v)
h=w.copy()
for u in reversed(order): h[u]=w[u]+max((h[v] for v in g[u]),default=0)
T=max(f); print(sum(f[i]+h[i]-w[i]==T for i in range(n)))''')

add('a926','graphs','hard','地道交會轉成偏序與祖先集合','判斷上下順序是否有環並統計必然前驅。',[
'每隻地鼠的水平使用範圍是其所有洞的最左到最右欄，含端點。若a有上方洞位於b的範圍內，a必須在b上方，否則a的垂直路會穿越b轉彎或水平路；若a的下方洞位於b範圍內，則b必須在a上方。對不同地鼠建立這些有向限制。',
'這些限制也充分：依拓樸序安排各鼠的水平高度，所有與垂直路衝突的相對順序都已滿足，剩餘交點只會是雙方直行。若有環則無解；否則任意入度0地鼠都能排在最高處。範圍不交者可共用高度，但不影響偏序與可行性。',
'在拓樸過程令ancestor[v]聯集ancestor[u]及u。查詢答案是祖先位元數，因為有路徑的先後必然成立，無路徑的兩點可用適當拓樸序顛倒，所以沒有其他必然在上方者。'],
'建立限制O(KN)，傳播O(E·ceil(K/w))位元運算，空間O(K²/w+N)機器字；w為位元字長。','區間端點也會衝突；同一欄上下屬同一地鼠時，與跨該欄的其他水平路可能形成矛盾。',[
('示意兩鼠','上方洞1、1、2、2，下方全0，兩鼠範圍不交。',['1 1 2 2','0 0 0 0'],[('限制邊','0')]),
('拓樸排序','兩點都是入度0，都可能最高。',['1','2'],[('最高候選','1 2')]),
('祖先查詢','兩鼠互無必然上下關係，查詢皆0。',[0,0],[('可行','是')])],
'''int main(){int T;cin>>T;for(int cs=1;cs<=T;cs++){int K,N;cin>>K>>N;vector<int>top(N),bot(N),L(K,N),R(K,-1);for(auto *v:{&top,&bot})for(int i=0;i<N;i++){cin>>(*v)[i];int a=(*v)[i]-1;if(a>=0)L[a]=min(L[a],i),R[a]=max(R[a],i);}vector<bitset<2000>>g(K),anc(K);for(int x=0;x<N;x++)if(top[x]&&bot[x]&&top[x]!=bot[x])g[top[x]-1].set(bot[x]-1);for(int b=0;b<K;b++)for(int x:{L[b],R[b]}){int a=top[x]-1;if(a>=0&&a!=b)g[a].set(b);a=bot[x]-1;if(a>=0&&a!=b)g[b].set(a);}vector<int>in(K);for(int a=0;a<K;a++)for(int b=0;b<K;b++)if(g[a][b])in[b]++;queue<int>q;vector<int>source;for(int a=0;a<K;a++)if(!in[a])q.push(a),source.push_back(a);int seen=0;while(!q.empty()){int a=q.front();q.pop();seen++;for(int b=0;b<K;b++)if(g[a][b]){anc[b]|=anc[a];anc[b].set(a);if(!--in[b])q.push(b);}}int Q;cin>>Q;vector<int>ask(Q);for(int&x:ask)cin>>x;cout<<"Case "<<cs<<":\\n";if(seen<K)cout<<"no solution\\n";else{for(int i=0;i<(int)source.size();i++)cout<<source[i]+1<<(i+1==(int)source.size()?'\\n':' ');for(int a:ask)cout<<anc[a-1].count()<<'\\n';}}}''',
'''import sys
from collections import deque
it=iter(map(int,sys.stdin.buffer.read().split())); T=next(it)
for cs in range(1,T+1):
    K,N=next(it),next(it); top=[next(it)-1 for _ in range(N)]; bot=[next(it)-1 for _ in range(N)]; L=[N]*K; R=[-1]*K
    for row in (top,bot):
        for x,a in enumerate(row):
            if a>=0: L[a]=min(L[a],x); R[a]=max(R[a],x)
    g=[0]*K
    for x in range(N):
        if top[x]>=0 and bot[x]>=0 and top[x]!=bot[x]: g[top[x]]|=1<<bot[x]
    for b in range(K):
        for x in (L[b],R[b]):
            a=top[x]
            if a>=0 and a!=b: g[a]|=1<<b
            a=bot[x]
            if a>=0 and a!=b: g[b]|=1<<a
    degree=[0]*K
    for bits in g:
        while bits: bit=bits&-bits; degree[bit.bit_length()-1]+=1; bits^=bit
    source=[a for a in range(K) if degree[a]==0]; q=deque(source); ancestor=[0]*K; seen=0
    while q:
        a=q.popleft(); seen+=1; bits=g[a]; value=ancestor[a]|(1<<a)
        while bits:
            bit=bits&-bits; b=bit.bit_length()-1; bits^=bit; ancestor[b]|=value; degree[b]-=1
            if not degree[b]: q.append(b)
    ask=[next(it)-1 for _ in range(next(it))]; print('Case '+str(cs)+':')
    if seen<K: print('no solution')
    else:
        print(*(a+1 for a in source))
        for a in ask: print(ancestor[a].bit_count())''')

add('a927','dp','hard','剩餘食材遮罩與極小極大','把金錢與輪次一起納入策略狀態。',[
'C(mask,b)是小當家回合可保證的最高未來美味，D(mask,b)是黑暗料理界回合的結果。黑暗料理界枚舉拿走一種食材，取C的最小；小當家可購買任一負擔得起者，得到美味加D，取最大。',
'小當家也可跳過，交給D(mask,b)。黑暗料理界的跳過不會進一步降低結果：C本身至少是D的值，因此與其讓小當家再選，不如採用最小的移除結果。故可先計算D的子遮罩，再算C，避免同遮罩循環。空集合結果0。',
'每次實際移除都減少遮罩，記憶化可完整評估所有最佳對抗選擇。金錢只在小當家購買時減少，不可從剩餘遮罩推算已花金額。'],
'最壞O(2^N·M·N)時間、O(2^N·M)記憶體；Python記憶化字典在完整最壞狀態可能超出512MB，實際訪問量依價格與金錢而定。','不能把黑暗料理界當成貪心拿最美味；小當家允許不購買。',[
('示意兩食材','美味5價格2、美味3價格1，金錢2。',['5/2','3/1'],[('先手','小當家')]),
('選擇評估','買第一樣得5，對手拿走另一樣；買第二樣只能得3。',[5,3],[('跳過','對手可拿走5')]),
('最佳策略','先買美味5的食材，保證值5。',[5],[('答案','5')])],
'''int main(){int T;cin>>T;while(T--){int n;cin>>n;vector<int>d(n),g(n);for(int i=0;i<n;i++)cin>>d[i]>>g[i];int M;cin>>M;vector<short>C((1<<n)*(M+1),-1),D=C;function<int(int,int,bool)>solve=[&](int mask,int b,bool turn){if(!mask)return 0;short &ans=(turn?C:D)[mask*(M+1)+b];if(ans>=0)return (int)ans;if(!turn){int best=30000;for(int i=0;i<n;i++)if(mask>>i&1)best=min(best,solve(mask^(1<<i),b,true));ans=best;}else{int best=solve(mask,b,false);for(int i=0;i<n;i++)if((mask>>i&1)&&g[i]<=b)best=max(best,d[i]+solve(mask^(1<<i),b-g[i],false));ans=best;}return (int)ans;};cout<<solve((1<<n)-1,M,true)<<'\\n';}}''',
'''import sys,functools
it=iter(map(int,sys.stdin.buffer.read().split()))
for _ in range(next(it)):
    n=next(it); items=[(next(it),next(it)) for _ in range(n)]; M=next(it)
    @functools.lru_cache(None)
    def C(mask,b):
        if not mask: return 0
        best=D(mask,b)
        for i,(d,g) in enumerate(items):
            if mask>>i&1 and g<=b: best=max(best,d+D(mask^(1<<i),b-g))
        return best
    @functools.lru_cache(None)
    def D(mask,b):
        if not mask: return 0
        return min(C(mask^(1<<i),b) for i in range(n) if mask>>i&1)
    print(C((1<<n)-1,M)); C.cache_clear(); D.cache_clear()''')

add('a928','search','hard','三次BFS與同步完成時間','枚舉分身生成位置，平衡本人與分身的到達時間。',[
'在只可走空地的圖上，從B、E分別BFS求db、de。再從P做帶「是否已經走過牆」狀態的BFS，得到每個空地到P、最多經過一格牆的最短距離dc；路徑可逆，所以反向搜尋有效。',
'在空地x生成分身時，本人到x最早需db[x]，之後本人往E需de[x]，分身往P需dc[x]≤D。兩者同步，逃出時間為db[x]+max(de[x],dc[x])。枚舉所有可達生成點並取最小；本人親自按P也包含在x=P的情況。沒有P時初始已開，直接回傳db[E]。'],
'時間O(RC)，空間O(RC)；帶牆狀態只有兩層。','必須是本人抵達E，分身不能代替；本人可先到出口等待按鈕。',[
('示意一列B.P.E','無牆，D=2。',['B','.','P','.','E'],[('本人到E','4')]),
('起點生成','分身2秒到P，本人4秒到E。',[2,4],[('同步完成','4')]),
('最快逃出','本人至少走4步，因此4秒已最優。',[4],[('答案','4')])],
'''int main(){int R,C,D;cin>>R>>C>>D;vector<string>a(R);int B=-1,E=-1,P=-1;for(int r=0;r<R;r++){cin>>a[r];for(int c=0;c<C;c++){if(a[r][c]=='B')B=r*C+c;if(a[r][c]=='E')E=r*C+c;if(a[r][c]=='P')P=r*C+c;}}int V=R*C;auto bfs=[&](int s,bool wall){vector<int>d(V*2,-1);queue<int>q;d[s*2]=0;q.push(s*2);while(!q.empty()){int z=q.front();q.pop();int x=z/2,r=x/C,c=x%C;for(auto[dr,dc]:vector<pair<int,int>>{{1,0},{-1,0},{0,1},{0,-1}}){int nr=r+dr,nc=c+dc;if(nr<0||nr>=R||nc<0||nc>=C)continue;int w=z%2+(a[nr][nc]=='X');if(w>int(wall))continue;int y=(nr*C+nc)*2+w;if(d[y]<0)d[y]=d[z]+1,q.push(y);}}return d;};auto b=bfs(B,false);if(P<0){cout<<b[E*2]<<'\\n';return 0;}auto e=bfs(E,false),p=bfs(P,true);int ans=INT_MAX;for(int x=0;x<V;x++)if(b[x*2]>=0&&e[x*2]>=0&&a[x/C][x%C]!='X'){int t=p[x*2];if(p[x*2+1]>=0&&(t<0||p[x*2+1]<t))t=p[x*2+1];if(t>=0&&t<=D)ans=min(ans,b[x*2]+max(e[x*2],t));}cout<<(ans==INT_MAX?-1:ans)<<'\\n';}''',
'''import sys
from collections import deque
f=sys.stdin; R,C,D=map(int,f.readline().split()); a=[f.readline().strip() for _ in range(R)]; spots={a[r][c]:(r,c) for r in range(R) for c in range(C) if a[r][c] in 'BEP'}
def bfs(start,allow):
    d=[[[-1,-1] for _ in range(C)] for _ in range(R)]; r,c=start; d[r][c][0]=0; q=deque([(r,c,0)])
    while q:
        r,c,w=q.popleft()
        for nr,nc in ((r-1,c),(r+1,c),(r,c-1),(r,c+1)):
            if 0<=nr<R and 0<=nc<C:
                nw=w+(a[nr][nc]=='X')
                if nw<=allow and d[nr][nc][nw]<0: d[nr][nc][nw]=d[r][c][w]+1; q.append((nr,nc,nw))
    return d
b=bfs(spots['B'],0)
if 'P' not in spots:
    r,c=spots['E']; print(b[r][c][0]); raise SystemExit
e=bfs(spots['E'],0); p=bfs(spots['P'],1); ans=10**9
for r in range(R):
    for c in range(C):
        if a[r][c]=='X' or b[r][c][0]<0 or e[r][c][0]<0: continue
        choices=[x for x in p[r][c] if x>=0]; t=min(choices,default=D+1)
        if t<=D: ans=min(ans,b[r][c][0]+max(e[r][c][0],t))
print(-1 if ans==10**9 else ans)''')

add('a929','data-structures','hard','Mo離線查詢與頻率的頻率','把跨界區間展開到兩倍陣列。',[
'複製陣列一次。詢問i≤j用[i−1,j−1]，否則用[i−1,j−1+n]，每個圓形區間都成為不超過n長的線性區間。',
'以Mo順序排序詢問，維護每個項目的次數cnt、每個正次數有幾種項目的bucket，以及當前最大次數mx。移動左右端點時，先從舊bucket移出、更新cnt、再加入新bucket，移除時必要則縮小mx。',
'bucket[mx]=1時輸出mx，否則輸出bucket[mx]。頻率與其種類數分開維護，故可O(1)回答每筆；離線排序只改處理順序，答案依原索引保存。'],
'時間O((n+Q)√n)，空間O(n+Q+最大項目編號)；Python read().split()另有O(n+Q)輸入暫存。','並列時輸出種類數，不是最高次數，也不輸出項目編號。',[
('示意區間1,2,1','次數為1:2、2:1。',[1,2,1],[('mx','2'),('bucket[2]','1')]),
('唯一最多','只有項目1達2次，答案為次數2。',[2],[('答案','2')]),
('加入另一個2','次數都為2，並列兩種類，答案仍為2但意義不同。',[1,2,1,2],[('並列種類','2')])],
'''int main(){ios::sync_with_stdio(false);cin.tie(nullptr);int n,Q;cin>>n>>Q;vector<int>a(2*n);for(int i=0;i<n;i++){cin>>a[i];a[i+n]=a[i];}int B=max(1,(int)sqrt(2*n));vector<array<int,3>>q(Q);for(int z=0;z<Q;z++){int l,r;cin>>l>>r;--l;--r;if(r<l)r+=n;q[z]={l,r,z};}sort(q.begin(),q.end(),[&](auto a,auto b){if(a[0]/B!=b[0]/B)return a[0]/B<b[0]/B;return (a[0]/B)%2?a[1]>b[1]:a[1]<b[1];});vector<int>cnt(100001),bucket(n+1),ans(Q);int L=0,R=-1,mx=0;auto change=[&](int x,int delta){int old=cnt[x];if(old)bucket[old]--;cnt[x]+=delta;if(cnt[x])bucket[cnt[x]]++;mx=max(mx,cnt[x]);while(mx&&!bucket[mx])mx--;};for(auto[l,r,id]:q){while(L>l)change(a[--L],1);while(R<r)change(a[++R],1);while(L<l)change(a[L++],-1);while(R>r)change(a[R--],-1);ans[id]=bucket[mx]==1?mx:bucket[mx];}for(int x:ans)cout<<x<<'\\n';}''',
'''import sys,math
it=iter(map(int,sys.stdin.buffer.read().split())); n,Q=next(it),next(it); a=[next(it) for _ in range(n)]*2; B=max(1,math.isqrt(2*n)); queries=[]
for z in range(Q):
    l,r=next(it)-1,next(it)-1
    if r<l: r+=n
    queries.append((l,r,z))
queries.sort(key=lambda q:(q[0]//B,q[1] if q[0]//B%2==0 else -q[1])); count=[0]*100001; bucket=[0]*(n+1); ans=[0]*Q; L=0; R=-1; mx=0
def change(x,delta):
    global mx
    old=count[x]
    if old: bucket[old]-=1
    new=old+delta; count[x]=new
    if new: bucket[new]+=1
    if new>mx: mx=new
    while mx and not bucket[mx]: mx-=1
for l,r,z in queries:
    while L>l: L-=1; change(a[L],1)
    while R<r: R+=1; change(a[R],1)
    while L<l: change(a[L],-1); L+=1
    while R>r: change(a[R],-1); R-=1
    ans[z]=mx if bucket[mx]==1 else bucket[mx]
print(*ans,sep='\n')''')

add('a930','strings','easy','雙指標無重複視窗','維護每個右端點可達的最長合法區間。',[
'用last[value]記錄上次位置，左端l初為0。掃到r時若該值已在視窗內，把l移到last[value]+1，再更新最後位置。',
'此時[l,r]內沒有重複，而且比l更小的左端會包含剛排除的重複，故是該右端點最長合法視窗。遇到更長答案才更新起點；右端遞增且左端不下降，等長保留的就是最小起點。'],
'時間O(n+m)，空間O(m+n)（含輸入陣列）；視窗本身O(m)。','同樣長度不能覆蓋先前較小起點；遊戲序列到尾端會停止，不是環形。',[
('示意1,2,1,3','掃到前兩項，視窗1,2長2。',[1,2],[('左端','1')]),
('遇到重複1','左端移到第2項，目前視窗2,1。',[2,1],[('左端','2')]),
('加入3','視窗2,1,3長3，最佳起點2。',[2,1,3],[('答案','2 3')])],
'''int main(){int m,n;cin>>m>>n;vector<int>last(m+1,-1);int l=0,best=0,start=0;for(int r=0;r<n;r++){int x;cin>>x;l=max(l,last[x]+1);last[x]=r;if(r-l+1>best)best=r-l+1,start=l;}cout<<start+1<<' '<<best<<'\\n';}''',
'''import sys
m,n,*a=map(int,sys.stdin.buffer.read().split()); last=[-1]*(m+1); l=best=start=0
for r,x in enumerate(a):
    l=max(l,last[x]+1); last[x]=r
    if r-l+1>best: best=r-l+1; start=l
print(start+1,best)''')

add('a931','graphs','medium','最大獨立集與二分圖匹配','用Kőnig定理把不可共選限制轉為匹配。',[
'把兩類物品放二分圖左右兩側，每條衝突是一條邊。所選集合不能含完整衝突邊，即為獨立集，其補集是頂點覆蓋。',
'二分圖最小頂點覆蓋大小等於最大匹配，故答案N1+N2−最大匹配。逐個左點用增廣路嘗試匹配：若右點已配對，遞迴嘗試替原左點找其他右點，成功才重新連接。無增廣路時匹配已最大。'],
'時間O(N1·M)，空間O(N1+N2+M)；遞迴深度最多N1≤100。','同類物品之間沒有衝突；不能把每條衝突都扣一個，因同一物品可同時覆蓋多條邊。',[
('示意兩側各2','只有衝突L1—R1、L2—R1。',['L1—R1','L2—R1','R2孤立'],[('邊數','2')]),
('最大匹配','兩條邊共用R1，最多只能匹配1條。',['L1—R1'],[('匹配數','1')]),
('獨立集','選L1、L2、R2，共4−1=3件。',['L1','L2','R2'],[('答案','3')])],
'''int main(){int n,m,E;cin>>n>>m>>E;vector<vector<int>>g(n);while(E--){int a,b;cin>>a>>b;g[a-1].push_back(b-1);}vector<int>match(m,-1),seen(m);function<bool(int)>dfs=[&](int u){for(int v:g[u])if(!seen[v]){seen[v]=1;if(match[v]<0||dfs(match[v])){match[v]=u;return true;}}return false;};int ans=0;for(int u=0;u<n;u++){fill(seen.begin(),seen.end(),0);ans+=dfs(u);}cout<<n+m-ans<<'\\n';}''',
'''import sys
it=iter(map(int,sys.stdin.buffer.read().split())); n,m,E=next(it),next(it),next(it); g=[[] for _ in range(n)]
for _ in range(E): g[next(it)-1].append(next(it)-1)
match=[-1]*m
def dfs(u):
    for v in g[u]:
        if not seen[v]:
            seen[v]=True
            if match[v]<0 or dfs(match[v]): match[v]=u; return True
    return False
total=0
for u in range(n): seen=[False]*m; total+=dfs(u)
print(n+m-total)''')

add('a932','data-structures','hard','Fenwick樹上的存活排名','以存活者排名跳到每輪輸家。',[
'Fenwick樹每個存活魔法師存1。pos是下一輪起念者在存活者中的0起算排名，輸家的排名為(pos+S−1)%alive。以Fenwick二進位提升找該排名的原編號，並累計輸次。',
'若輸家退出，就刪除其1，下一位在新存活序列的排名仍是剛才的輸家排名（對新alive取餘）；若未退出，下一輪從其後一名開始。這精確模擬每句輪流且避免逐句走S步。直到alive=1時查出剩餘者。'],
'最多NK輪，時間O(NK log N)，空間O(N)；使用迭代操作無深遞迴。','輸家未退出也必須從下一位開始；S要包含起念者的第一句。',[
('示意N=3,S=3,K=1','存活排名0,1,2，第一輪輸家為3。',[1,2,3],[('輸家排名','2')]),
('刪除3','下一輪從1起，三句為1、2、1，因此1退出。',[1,2],[('第二輪輸家','1')]),
('剩餘者','只剩2，停止。',[2],[('答案','2')])],
'''int main(){int n,S,K;cin>>n>>S>>K;vector<int>bit(n+1),loss(n+1);for(int i=1;i<=n;i++)bit[i]=i&-i;auto kth=[&](int k){int x=0;for(int step=1<<__lg(n);step;step>>=1)if(x+step<=n&&bit[x+step]<=k){k-=bit[x+step];x+=step;}return x+1;};int alive=n,pos=0;while(alive>1){pos=(pos+S-1)%alive;int x=kth(pos);if(++loss[x]==K){for(int i=x;i<=n;i+=i&-i)bit[i]--;alive--;pos%=alive;}else pos=(pos+1)%alive;}cout<<kth(0)<<'\\n';}''',
'''import sys
n,S,K=map(int,sys.stdin.buffer.read().split()); bit=[0]+[i&-i for i in range(1,n+1)]; loss=[0]*(n+1)
def kth(k):
    x=0; step=1<<(n.bit_length()-1)
    while step:
        t=x+step
        if t<=n and bit[t]<=k: k-=bit[t]; x=t
        step//=2
    return x+1
alive=n; pos=0
while alive>1:
    pos=(pos+S-1)%alive; x=kth(pos); loss[x]+=1
    if loss[x]==K:
        i=x
        while i<=n: bit[i]-=1; i+=i&-i
        alive-=1; pos%=alive
    else: pos=(pos+1)%alive
print(kth(0))''')

add('a933','dp','hard','最小歷史最大值的子序列DP','保留每種長度最容易延伸的狀態。',[
'd[l−1]代表長度l的合法子序列所能達到的最小歷史最大值。較小最大值更容易滿足下一筆x≥最大值−E，故同長度只保留最小值足夠；d按長度不遞減。',
'讀到x，能延伸的舊狀態必須d≤x+E，新最大值為max(d,x)。令p為d中第一個>x的位置，q為第一個>x+E的位置。長度p+1可改成x，而原本區間d[p:q]依次向右移一格；若q仍在原陣列內就覆蓋原d[q]，否則長度增加一。',
'這正是所有長度由大到小的DP更新：小於等於x的舊狀態只可能改善第一個大於x的位置，其餘可延伸狀態保持原最大值並移到下一長度。用二分搜尋加陣列搬移實作，E=0時相等數字也可延伸。'],
'每個E最壞時間O(n²)（搬移），二分比較O(n log n)，空間O(n)；m組共O(mn²)。輸入暫存O(n+m)。','限制要對之前子序列的「最大值」，不是只比前一個元素。',[
('示意6,5,4，E=1','處理6後d=[6]。',[6],[('最佳長度','1')]),
('加入5','5≥6−1，可延伸，d變為[5,6]。',[5,6],[('最佳長度','2')]),
('加入4','可接5但不能接歷史最大6；d變為[4,5]，長度仍2。',[4,5],[('不能選6,5,4','4<6−1')])],
'''int main(){int n,m;cin>>n>>m;vector<int>a(n);for(int&x:a)cin>>x;while(m--){int E;cin>>E;vector<int>d;for(int x:a){int p=upper_bound(d.begin(),d.end(),x)-d.begin(),q=upper_bound(d.begin(),d.end(),x+E)-d.begin();if(q==(int)d.size())d.push_back(0);for(int j=q;j>p;j--)d[j]=d[j-1];d[p]=x;}cout<<d.size()<<(m?' ':'\\n');}}''',
'''import sys,bisect
it=iter(map(int,sys.stdin.buffer.read().split())); n,m=next(it),next(it); a=[next(it) for _ in range(n)]; out=[]
for E in it:
    d=[]
    for x in a:
        p=bisect.bisect_right(d,x); q=bisect.bisect_right(d,x+E); d[p:q+1]=[x]+d[p:q]
    out.append(len(d))
print(*out)''')

add('a934','dp','easy','最後一點的互斥分類','按末點是單色或彩色建立遞迴。',[
'令f[t]為t個施放點的合法安排，f[0]=1。若最後是單色，前t−1點有f[t−1]種；若最後是彩色，前M個位置都必須是單色，剩餘前綴有f[t−M−1]種。',
'當t≤M時不可能出現兩個彩色，共有全單色加上彩色放任一位置的t+1種。其餘用f[t]=f[t−1]+f[t−M−1]，每一步取mod10000。兩種末點情況互斥且涵蓋全部安排，因此遞迴正確。'],
'時間O(N)，空間O(N)。','輸出餘數的普通十進位，不補成四位；例如946不是0946。',[
('N=3,M=1','f[0]=1，f[1]=2。',[1,2],[('含義','空列、單點')]),
('加入第二點','f[2]=f[1]+f[0]=3。',[1,2,3],[('合法','單單、單彩、彩單')]),
('加入第三點','f[3]=f[2]+f[1]=5。',[1,2,3,5],[('答案','5')])],
'''int main(){int n,m;cin>>n>>m;vector<int>f(n+1);f[0]=1;for(int i=1;i<=n;i++)f[i]=i<=m?i+1:(f[i-1]+f[i-m-1])%10000;cout<<f[n]%10000<<'\\n';}''',
'''import sys
n,m=map(int,sys.stdin.buffer.read().split()); f=[1]*(n+1)
for i in range(1,n+1): f[i]=(i+1 if i<=m else f[i-1]+f[i-m-1])%10000
print(f[n])''')

add('a935','simulation','easy','帶符號棋盤的絕對差','把三種格子狀態編成−1、0、1。',[
'空格存0、白棋存−1、黑棋存1。每份棋譜依座標直接填入19×19棋盤，輸入順序不影響盤面。',
'逐格加總兩盤編碼差的絕對值：同狀態為0，空格對棋子為1，黑對白為2，恰好對應題目所有情況。因此總絕對差就是相異程度。'],
'時間O(n1+n2+19²)，空間O(19²)；讀入暫存O(n1+n2)。','同位置異色要加2，不是1；不可把兩盤記錄逐行配對。',[
('示意一格','第一盤(1,1)黑，第二盤同格白。',['黑=1','白=−1'],[('差值','2')]),
('另一空缺','第一盤(2,2)白，第二盤空。',['白=−1','空=0'],[('差值','1')]),
('加總','其餘格皆空，總相異程度3。',[2,1],[('答案','3')])],
'''int main(){int a[2][19][19]={};for(int b=0;b<2;b++){int n;cin>>n;while(n--){int x,y,c;cin>>x>>y>>c;a[b][x-1][y-1]=2*c-1;}}int ans=0;for(int x=0;x<19;x++)for(int y=0;y<19;y++)ans+=abs(a[0][x][y]-a[1][x][y]);cout<<ans<<'\\n';}''',
'''import sys
it=iter(map(int,sys.stdin.buffer.read().split())); boards=[]
for _ in range(2):
    a=[[0]*19 for _ in range(19)]
    for _ in range(next(it)):
        x,y,c=next(it)-1,next(it)-1,next(it); a[x][y]=2*c-1
    boards.append(a)
print(sum(abs(boards[0][x][y]-boards[1][x][y]) for x in range(19) for y in range(19)))''')

add('a936','search','easy','排列枚舉與命中位置檢查','在720個候選解中找最小合法排列。',[
'由1到6的升冪排列開始，依字典序枚舉全部6!個候選。對每筆猜測計算候選與猜測相同位置的數量，必須恰好等於該筆回報。',
'六筆都符合者就是可能的真正排列。第一個合法者之前的所有更小排列都已排除，因此符合最小字典序規則；題目保證存在，無需無解訊息。'],
'時間O(6!×6×6)，空間O(6×7)。','回報只計位置正確，不像一般猜數字還有位置錯但數字對的計數。',[
('示意回報','六筆都猜123456且回報0。',['123456:0'],[('合法輸入','可重複猜測')]),
('排除初始排列','123456命中6，不符合0。',['123456'],[('拒絕','6≠0')]),
('最小錯位排列','第一個所有位置都不同的排列為214365。',['214365'],[('命中','0')])],
'''int main(){int a[6][6],hit[6];for(int i=0;i<6;i++){for(int&x:a[i])cin>>x;cin>>hit[i];}vector<int>p={1,2,3,4,5,6};do{bool ok=1;for(int i=0;i<6;i++){int c=0;for(int j=0;j<6;j++)c+=a[i][j]==p[j];if(c!=hit[i])ok=0;}if(ok){for(int i=0;i<6;i++)cout<<p[i]<<(i==5?'\\n':' ');break;}}while(next_permutation(p.begin(),p.end()));}''',
'''import sys,itertools
it=iter(map(int,sys.stdin.buffer.read().split())); guesses=[([next(it) for _ in range(6)],next(it)) for _ in range(6)]
for p in itertools.permutations(range(1,7)):
    if all(sum(x==y for x,y in zip(p,a))==h for a,h in guesses): print(*p); break''')

add('a937','graphs','medium','兩個偏序DAG的最長鏈','分別求最小寬與最小高。',[
'i在j右邊建立水平邊j→i；i在j上面建立垂直邊j→i。每條邊要求座標至少增加w，所以各維度獨立是差分限制的最長路。',
'各DAG按拓樸序計算最長頂點數H、V，對應最小外框寬Hw、高Vw。最長鏈給出必要下界；把每片磁磚放在兩個DAG的最長前驅距離座標，可同時達到兩維下界，並滿足全部相對關係，故最小面積H×V×w²。'],
'輸入邊數E=n(n−1)/2，時間O(n+E)，空間O(n+E)；迭代拓樸無深鏈堆疊風險。','最長鏈用頂點數，單片仍需寬高w；不可把水平與垂直邊混在同一DAG求單一最長路。',[
('示意兩片','2在1右邊，w=3。',['1→2(水平)'],[('水平鏈','2')]),
('垂直維度','無垂直邊，最長頂點鏈只有1。',['1','2'],[('垂直鏈','1')]),
('面積','寬6、高3，面積18。',['6×3'],[('答案','18')])],
'''int main(){int n,w;cin>>n>>w;vector<vector<int>>g[2];g[0].resize(n);g[1].resize(n);vector<int>in[2];in[0].resize(n);in[1].resize(n);for(int k=0;k<n*(n-1)/2;k++){int i,j,p;cin>>i>>j>>p;g[p][j-1].push_back(i-1);in[p][i-1]++;}long long ans=1LL*w*w;for(int t=0;t<2;t++){queue<int>q;vector<int>d(n,1);for(int i=0;i<n;i++)if(!in[t][i])q.push(i);while(!q.empty()){int u=q.front();q.pop();for(int v:g[t][u]){d[v]=max(d[v],d[u]+1);if(!--in[t][v])q.push(v);}}ans*=*max_element(d.begin(),d.end());}cout<<ans<<'\\n';}''',
'''import sys
from collections import deque
it=iter(map(int,sys.stdin.buffer.read().split())); n,w=next(it),next(it); g=[[[] for _ in range(n)] for _ in range(2)]; degree=[[0]*n for _ in range(2)]
for _ in range(n*(n-1)//2):
    i,j,p=next(it)-1,next(it)-1,next(it); g[p][j].append(i); degree[p][i]+=1
ans=w*w
for p in range(2):
    q=deque(i for i in range(n) if degree[p][i]==0); d=[1]*n
    while q:
        u=q.popleft()
        for v in g[p][u]:
            d[v]=max(d[v],d[u]+1); degree[p][v]-=1
            if degree[p][v]==0: q.append(v)
    ans*=max(d)
print(ans)''')
postman('a938',False)

add('a939','geometry','hard','逐線段扣除遮蔽區間','以精確有理數計算可見片段數。',[
'每條非垂直線段寫成y=mx+b，定義域為兩端x的閉區間。固定線段i，逐一比較其他線段j：在兩定義域交集內，j低於i的x集合是空、整段，或被兩直線交點切出的一側區間。',
'收集所有使i被遮蔽的正長度區間，依左端排序並合併。從i的定義域扣掉這些區間後，每個剩餘正長度連通區間就是i貢獻的一條下界線段。逐i加總即答案。題目排除同一直線重疊或相接，故不同i的可見段不需要共線合併。',
'交點與區間端點採有理數精確比較，避免非常接近的交點被浮點容差誤併。只有單點可見不構成一條正長度線段。定義域空隙由每條線段的域限制自然分開。'],
'O(n² log n)次有理數運算，儲存O(n)條線段與O(n)遮蔽區間；大整數位元成本另計。','不可只檢查端點最低者；內部交點會切換下界，也不可把無定義空隙跨接。',[
('示意兩交叉線','線1:(0,0)到(2,2)，線2:(0,2)到(2,0)。',['y=x','y=2−x'],[('交點x','1')]),
('各自可見範圍','線1在0..1最低；線2在1..2最低。',['線1:[0,1]','線2:[1,2]'],[('每條貢獻','1')]),
('加總','下界由兩段不同直線組成。',[1,1],[('答案','2')])],
BIG+'''#include <boost/rational.hpp>
using Q=boost::rational<cpp_int>;struct S{Q l,r,m,b;};int main(){int n;cin>>n;vector<S>a;for(int i=0;i<n;i++){int x,y,u,v;cin>>x>>y>>u>>v;if(x>u)swap(x,u),swap(y,v);Q m=Q(v-y,u-x);a.push_back({Q(x),Q(u),m,Q(y)-m*Q(x)});}int ans=0;for(int i=0;i<n;i++){vector<pair<Q,Q>>block;for(int j=0;j<n;j++)if(i!=j){Q l=max(a[i].l,a[j].l),r=min(a[i].r,a[j].r);if(l>=r)continue;Q m=a[j].m-a[i].m,b=a[j].b-a[i].b;if(m==Q(0)){if(b>=Q(0))continue;}else{Q cross=-b/m;if(m>Q(0))r=min(r,cross);else l=max(l,cross);}if(l<r)block.push_back({l,r});}sort(block.begin(),block.end());Q cur=a[i].l;for(auto [l,r]:block){if(l>cur)ans++;cur=max(cur,r);}if(cur<a[i].r)ans++;}cout<<ans<<'\\n';}''',
'''import sys
from fractions import Fraction as F
it=iter(map(int,sys.stdin.buffer.read().split())); n=next(it); a=[]
for _ in range(n):
    x,y,u,v=(next(it) for _ in range(4))
    if x>u: x,y,u,v=u,v,x,y
    m=F(v-y,u-x); a.append((F(x),F(u),m,F(y)-m*x))
ans=0
for i,(left,right,mi,bi) in enumerate(a):
    block=[]
    for j,(lj,rj,mj,bj) in enumerate(a):
        if i==j: continue
        l,r=max(left,lj),min(right,rj)
        if l>=r: continue
        m,b=mj-mi,bj-bi
        if m==0:
            if b>=0: continue
        elif m>0: r=min(r,-b/m)
        else: l=max(l,-b/m)
        if l<r: block.append((l,r))
    cur=left
    for l,r in sorted(block):
        if l>cur: ans+=1
        cur=max(cur,r)
    if cur<right: ans+=1
print(ans)''')

def independent_checks():
    rng=random.Random(20261103)
    def mat(a): return '\n'.join(' '.join(map(str,r)) for r in a)
    for _ in range(8):
        n=5; p=list(range(1,n+1)); rng.shuffle(p); edges=[(rng.randrange(n),rng.randrange(n)) for _ in range(4)]
        seen={tuple(p)}; todo=[tuple(p)]
        for state in todo:
            for a,b in edges:
                t=list(state); t[a],t[b]=t[b],t[a]; t=tuple(t)
                if t not in seen: seen.add(t); todo.append(t)
        check('a877',f'{n} {len(edges)}\n'+' '.join(map(str,p))+'\n'+mat([(a+1,b+1) for a,b in edges]),' '.join(map(str,max(seen))),'獨立枚舉所有實際交換可達排列，取字典序最大。')
    check('a877','1 1\n1\n1 1','1','單一位置與自環不可改變排列。')
    names=sorted('Bessie Buttercup Belinda Beatrice Bella Blue Betsy Sue'.split())
    check('a878','1\nBeatrice must be milked beside Sue','\n'.join(['Beatrice','Sue']+[x for x in names if x not in ('Beatrice','Sue')]),'單限制的解析答案：最小名字先放，必須接Sue，其餘排序。')
    for _ in range(6):
        order=rng.sample(names,8); edges=[(order[i],order[i+1]) for i in rng.sample(range(7),3)]
        # Independent chain-block construction; enumerate orientations and block order only.
        graph={x:set() for x in names}
        for a,b in edges: graph[a].add(b); graph[b].add(a)
        remaining=set(names); blocks=[]
        while remaining:
            head=min(x for x in remaining if len(graph[x])<=1); block=[]; prev=None; u=head
            while u is not None:
                block.append(u); remaining.remove(u); vs=graph[u]-({prev} if prev else set()); prev,u=u,next(iter(vs),None)
            blocks.append(block)
        possibilities=[]
        for perm in itertools.permutations(blocks):
            for orientation in itertools.product((0,1),repeat=len(blocks)):
                possibilities.append(tuple(x for b,rev in zip(perm,orientation) for x in (b[::-1] if rev else b)))
        check('a878','3\n'+'\n'.join(a+' must be milked beside '+b for a,b in edges),'\n'.join(min(possibilities)),'獨立將限制鏈壓縮成區塊，再枚舉區塊順序與反向。')
    for n in (1,2,3,3,4):
        a=[[rng.randrange(8) for _ in range(n)] for _ in range(n)]; weights={0}
        for r in range(n):
            for c in range(n):
                for dr,dc in ((1,0),(0,1)):
                    if r+dr<n and c+dc<n: weights.add(abs(a[r][c]-a[r+dr][c+dc]))
        answer=None
        for K in sorted(weights):
            best=0; unseen={(r,c) for r in range(n) for c in range(n)}
            while unseen:
                s=unseen.pop(); q=[s]
                for r,c in q:
                    for nr,nc in ((r-1,c),(r+1,c),(r,c-1),(r,c+1)):
                        if (nr,nc) in unseen and abs(a[r][c]-a[nr][nc])<=K: unseen.remove((nr,nc)); q.append((nr,nc))
                best=max(best,len(q))
            if best>=(n*n+1)//2: answer=K; break
        check('a879',str(n)+'\n'+mat(a),answer,'獨立逐個候選高度差重建全部BFS分量，含N=1。')
    def rna_brute(s):
        best=0; pairs=[]
        def dfs(unused):
            nonlocal best
            if not unused:
                if all(not (a<c<b<d or c<a<d<b) for (a,b),(c,d) in itertools.combinations(pairs,2)): best=max(best,len(pairs))
                return
            i=unused[0]; dfs(unused[1:])
            for j in unused[1:]:
                if s[i]+s[j] in ('AU','UA','CG','GC'):
                    pairs.append((i,j)); dfs([k for k in unused[1:] if k!=j]); pairs.pop()
        dfs(list(range(len(s)))); return best
    for s in ['A','AAAAAA','AUAU','ACGU','GCAUACGU']+[''.join(rng.choice('ACGU') for _ in range(8)) for _ in range(5)]:
        check('a880',s,rna_brute(s),'獨立枚舉所有不重用端點的配對，最後檢查所有鍵結是否交叉。')
    # Independent raster oracle maps each output pixel back into its original bit.
    glyphs=[x.split() for x in FONT]
    for n,z in ((0,1),(120,3),(999,2),(876,1),(543,2)):
        digits=str(n); width=8*z*len(digits)+3*(len(digits)-1); lines=[]
        for y in range(8*z):
            row=[]
            for x in range(width):
                d,local=divmod(x,8*z+3)
                row.append('*' if local<8*z and glyphs[int(digits[d])][y//z][local//z]=='1' else ' ')
            lines.append(''.join(row))
        check('a881',f'{n},{z}','\n'.join(lines),'獨立按每個輸出座標反推原字型座標，覆蓋0、三位數與固定3欄字距。')
    for s in ('','123 !?','Aa!b','Zz yY xX','AbCdEfGhIjKlMnOpQrStUvWxYz'):
        counts=[s.count(chr(65+i))+s.count(chr(97+i)) for i in range(26)]
        check('a882',s+'\n',' '.join(chr(65+i) for i in range(26))+'\n'+' '.join(map(str,counts)),'逐字母分別count大小寫的獨立統計，含空行。')
    for n in (1,2,3,4,5):
        a=[[rng.randrange(11) for _ in range(n)] for _ in range(n)]
        answer=max(sum(a[i][p[i]] for i in range(n)) for p in itertools.permutations(range(n)))
        check('a883',str(n)+'\n'+mat(a),answer,'獨立枚舉所有n!個指派，依指派對偶定理取得覆蓋最優值。')
    for _ in range(12):
        m,n=rng.randrange(1,5),rng.randrange(1,5); H=rng.randrange(1,m*n+3); a=[[rng.randrange(-5,6) for _ in range(n)] for _ in range(m)]; answer=0
        for l in range(m):
            for r in range(l,m):
                for b in range(n):
                    for t in range(b,n):
                        if (r-l+1)*(t-b+1)>=H: answer=max(answer,sum(a[i][j] for i in range(l,r+1) for j in range(b,t+1)))
        check('a884',f'{m} {n} {H}\n'+mat(a)+'\n0 0 1',answer,'獨立枚舉全部四邊界矩形，直接求格子總和。')
    import heapq,functools
    for a,b in ((0,0),(1,0),(0,1),(8,0),(3,19),(19,3),(1000000,500000)):
        q=[(0,a)]; d={a:0}
        while q:
            w,x=heapq.heappop(q)
            if w!=d[x]: continue
            if x==b: break
            for y,c in ((x+1,2),(x-1,2),(x+2,3),(x-2,3),(2*x,3),(x//2,3)):
                if 0<=y<=1000000 and w+c<d.get(y,10**20): d[y]=w+c; heapq.heappush(q,(w+c,y))
        check('a885',f'{a} {b}',w,'獨立使用一般優先佇列Dijkstra，覆蓋零與上邊界。')
    for _ in range(8):
        n=5; m=2; finals=set(rng.sample(range(n),rng.randrange(1,n+1))); a=[[rng.randrange(n) for _ in range(m)] for _ in range(n)]
        # Pair-product reachability: equivalent iff no word reaches opposite acceptance.
        equivalent=[[True]*n for _ in range(n)]
        for x in range(n):
            for y in range(n):
                seen={(x,y)}; q=[(x,y)]
                for u,v in q:
                    if (u in finals)!=(v in finals): equivalent[x][y]=False; break
                    for c in range(m):
                        t=(a[u][c],a[v][c])
                        if t not in seen: seen.add(t); q.append(t)
        remaining=set(range(n)); groups=[]
        while remaining:
            x=min(remaining); group=[y for y in sorted(remaining) if equivalent[x][y]]; remaining.difference_update(group); groups.append(group)
        inp=f'{n} {len(finals)} {m}\n'+' '.join(str(x+1) for x in sorted(finals))+'\n'+mat([[v+1 for v in row] for row in a])
        check('a886',inp,'\n'.join(' '.join(str(v+1) for v in g) for g in groups),'獨立在景點對的乘積圖搜尋能區分兩起點的券序列。')
    for _ in range(8):
        gift=(1,1,1); boxes=[tuple(rng.randrange(2,8) for _ in range(3)) for _ in range(5)]
        def fits(a,b): return any(all(x<y for x,y in zip(a,p)) for p in itertools.permutations(b))
        best=0
        for k in range(1,6):
            for seq in itertools.permutations(boxes,k):
                if all(fits(a,b) for a,b in zip((gift,)+seq,seq)): best=max(best,k)
        check('a887','1\n5\n1 1 1\n'+mat(boxes),best,'獨立枚舉盒子順序及六種旋轉，直接測試嚴格三邊包含。')
    check('a888','5 4\nABCDE\nFGHIJ\nKLMNO\nPQRST\nUVWXY\nGHI\nAFKPU\nZY\nEJOTY','2 2\n1 1\n-1 -1\n1 5','直接人工核對向右、向下、缺失與最右欄。')
    check('a889','3 2\n0000 0000\n0000 0001\n0001 0002\n1200 1201\n1201 1202','4','第一方向在0000和0001最多2班；第二方向同時進出亦需2軌，總4。')
    for _ in range(8):
        rect=[]
        for k in range(4):
            x,u=sorted(rng.sample(range(6),2)); y,v=sorted(rng.sample(range(6),2)); rect.append((x,y,u,v))
        colors={frozenset(k for k,(l,b,r,t) in enumerate(rect) if l<x+.5<r and b<y+.5<t) for x in range(5) for y in range(5)}-{frozenset()}
        check('a890','4\n'+mat(rect),len(colors),'獨立在整數座標的每個單位方格中心取樣，枚舉實際原色集合。')
    for mode in range(7):
        n=7; prices=[rng.randrange(1,100) for _ in range(n)]; P=37 if mode in (3,5,6) else 0
        @functools.lru_cache(None)
        def purchase(mask):
            if not mask: return 0
            first=mask&-mask; best=10**20; rest=mask
            sub=rest
            while sub:
                if sub&first:
                    vals=sorted(prices[i] for i in range(n) if sub>>i&1); count=len(vals); fee=None
                    if count==1: fee=vals[0]*(100-P)
                    if count==3 and mode in (1,4,5,6): fee=min(fee if fee is not None else 10**20,sum(vals[1:])*100)
                    if count==5 and mode in (2,4,6): fee=min(fee if fee is not None else 10**20,sum(vals[2:])*100)
                    if fee is not None: best=min(best,fee+purchase(mask^sub))
                sub=(sub-1)&mask
            return best
        check('a891',f'{n} {mode}'+(f' {P}' if mode in (3,5,6) else '')+'\n'+' '.join(map(str,prices)),(purchase((1<<n)-1)+99)//100,'獨立枚舉任意子集合分批與優惠，未假設降冪相鄰分組。')
    check('a891','5 6 99\n'+' '.join([str(10**150)]*5),5*10**148,'151位票價與99%折扣：每張付1%，五張全部折扣較便宜。')
    for n in (2,3,5):
        a=[[rng.choice(['A','B','0001']) for _ in range(n)] for _ in range(n)]; groups=[]
        for delta in range(-n+1,n): groups.append([a[r][c] for r in range(n) for c in range(n) if r-c==delta])
        for total in range(2*n-1): groups.append([a[r][c] for r in range(n) for c in range(n) if r+c==total])
        check('a892','1\n'+str(n)+'\n'+mat(a),sum(len(g)>1 and len(set(g))==1 for g in groups),'獨立按每條對角線收集完整字串後判斷集合大小。')
    check('a892','1\n4\n' + mat([['S']*4 for _ in range(4)]),10,'全相同N=4：兩方向各2N−3=5條。')
    check('a893',' '.join(['10']*15),' '.join(['10N']*5),'平盤下所有嚴格條件都不成立。')
    huge=10**100
    check('a893',' '.join([str(huge)]*15),' '.join([str(huge)+'N']*5),'百位價格平盤檢驗任意精度。')
    for a in ([-1,0,0],[-1]+[0]*7,[10**120,-10**120+1],[5,5,5]):
        from decimal import Decimal,localcontext,ROUND_HALF_UP
        with localcontext() as ctx:
            ctx.prec=200; average=(Decimal(sum(a))/len(a)).quantize(Decimal('.01'),rounding=ROUND_HALF_UP)
        check('a894',str(len(a))+'\n'+' '.join(map(str,a)),f'{average}\n{max(a)}\n{min(a)}','獨立Decimal ROUND_HALF_UP，含負半分與超大整數。')
    for _ in range(10):
        n,m=6,8; days=[rng.sample(range(n),rng.randrange(n+1)) for _ in range(m)]; scores=[0]*n; sums=[0]*n
        for day in days:
            for x in day: scores[x]+=1
            for x in range(n): sums[x]+=1+sum(s>scores[x] for s in scores)
        outputs=[]
        for s in sums:
            q,r=divmod(s*1000,m); q+=2*r>=m; outputs.append(f'{q//1000}.{q%1000:03d}')
        check('a895',f'{n} {m}\n'+'\n'.join(str(len(d))+' '+ ' '.join(str(x+1) for x in d) for d in days),'\n'.join(outputs),'獨立逐日更新全部玩家並兩兩比較排名，非群組積分。')
    for m in (1,2,4,16,32,72,105,360):
        roots=[x for x in range(1,m+1) if x*x%m==1%m]
        check('a896',str(m),str(len(roots))+'\n'+'\n'.join(map(str,roots)),'獨立窮舉完整合法X範圍，覆蓋2的冪與多質因數。')
    check('a897','3 3\n.mb 0 0 0 1\n.cb 2 2 2 2\n.bb\n.be','3','多源鼠窩最近點(0,1)至(2,2)曼哈頓距離3。')
    check('a897','3 3\n.mb 0 0 0 0\n.cb 2 2 2 2\n.bb\n1 2 1 0\n.be','no path','反向端點的整條x=1障礙切斷左右。')
    check('a898','9 10 11 1 2 4 5 1 2 3 7 8 6 1 2 3 7 8 7 8 12\n9 10 11 1 2 3 7 8 7 8 12\n0','valid\ninvalid','第一條完整兩次遞迴，第二條主呼叫返回點被錯改為7。')
    def merge_brute(a):
        if len(a)<2: return 0
        return min(a[i]+a[j]+merge_brute(tuple(sorted([a[k] for k in range(len(a)) if k not in (i,j)]+[a[i]+a[j]]))) for i in range(len(a)) for j in range(i+1,len(a)))
    for a in ((7,),(1,1,1,1),(3,1,8,2,2)):
        check('a899',str(len(a))+'\n'+' '.join(map(str,a)),merge_brute(a),'獨立枚舉所有可能合併順序，取最小總成本。')
    check('a899','65536\n'+' '.join(['65536']*65536),65536*65536*16,'65536個相等頻率，完整平衡樹深度16，總成本超過32位。')
    for k in range(1,11):
        win=[True]+[False]*150
        for t in range(1,151): win[t]=any(take<t and not win[t-take] for take in {1,k} if take<=t)
        xs=[1,2,3,11,27]
        check('a900',str(len(xs))+'\n'+mat([(x,k) for x in xs]),'\n'.join(str(next(y for y in range(1,100) if not win[x+y])) for x in xs),'獨立減法遊戲DP，不使用週期公式。')
    check('a901','5\n1 IV\n1 MCM\n2 4\n2 1999\n2 2000','4\n1900\nIV\nMCMXCIX\nMM','人工核對減法記號、千位及最大附近。')
    def road_brute(n,edges,s,t):
        graph=[[] for _ in range(n)]
        for i,(a,b,w) in enumerate(edges): graph[a].append((b,w,i)); graph[b].append((a,w,i))
        q=[(0,s,0)]; dist={(s,0):0}; full=(1<<len(edges))-1
        while q:
            cost,u,mask=heapq.heappop(q)
            if cost!=dist[u,mask]: continue
            if mask==full and u==t: return cost
            for v,w,i in graph[u]:
                state=(v,mask|1<<i); value=cost+w
                if value<dist.get(state,10**20): dist[state]=value; heapq.heappush(q,(value,*state))
    for _ in range(8):
        n=4; edges=[(0,1,rng.randrange(1,8)),(1,2,rng.randrange(1,8)),(2,3,rng.randrange(1,8))]
        if rng.randrange(2): edges.append((0,3,rng.randrange(1,8)))
        if rng.randrange(2): edges.append((0,2,rng.randrange(1,8)))
        body=mat([(a+1,b+1,w) for a,b,w in edges])
        check('a902',f'{n} {len(edges)} 1 4\n'+body,road_brute(n,edges,0,3),'獨立在(目前頂點,已走邊遮罩)做Dijkstra，完整求所有覆邊走法。')
        check('a938',f'{n} {len(edges)} 2\n'+body,road_brute(n,edges,1,1),'獨立邊覆蓋狀態Dijkstra，非奇點配對。')
    check('a903','2 1\n1 2 0 2\n2 2 0 4\n1 2 2 1\n6 1 1 1 1 2\n6 4 1 1 2 2\n12 0 2 1 1 2\n23 40 2 2 1 1\n6 0 2 2 2 1','3\n8\n0\n8\n5','兩線各兩站共享端點，單線成本3與5，轉乘成本8；含嚴格離站、晚班與同實體站。')
    for _ in range(7):
        a=''.join(rng.choice('ABC') for _ in range(6)); b=''.join(rng.choice('ABC') for _ in range(6)); gap={c:rng.randrange(3) for c in 'ABC'}
        @functools.lru_cache(None)
        def chain(i,j):
            best=0
            for x in range(i+1,len(a)):
                for y in range(j+1,len(b)):
                    if a[x]==b[y] and (i<0 or x-i-1<=gap[a[x]] and y-j-1<=gap[a[x]]): best=max(best,1+chain(x,y))
            return best
        check('a904',a+'\n'+b+'\n1\n'+' '.join(c+' '+str(gap[c]) for c in 'CAB')+' $',chain(-1,-1),'獨立枚舉所有匹配端點鏈，直接逐對檢查新字母間距。')
    for scenario in range(3):
        A=[rng.sample(range(10),10) for _ in range(10)]; B=[rng.sample(range(10),10) for _ in range(10)]; unassigned=set(range(10)); free=set(range(10)); ans={}
        for r in range(10):
            chosen={}
            for b in free:
                applicants={i for i in unassigned if A[i][r]==b}
                if applicants: chosen[b]=next(i for i in B[b] if i in applicants)
            for b,i in chosen.items(): ans[i]=b; free.remove(b); unassigned.remove(i)
        lines=['A'+str(i+1)+','+','.join(str(x+1) for x in row) for i,row in enumerate(A)]+['B'+str(i+1)+','+','.join(str(x+1) for x in row) for i,row in enumerate(B)]
        check('a905','\n'.join(lines),'\n'.join('A'+str(i+1)+',B'+str(ans[i]+1) for i in range(10)),'獨立逐教授列舉當輪申請集合並按教授志願挑選。')
    boardedges=[(ord(a)-65,ord(b)-65) for a,b in 'AD DH HK BE EI IL CD DE EF GH HI IJ'.split()]
    @functools.lru_cache(None)
    def boardwin(points):
        if not points: return True
        moves=[{x} for x in points]+[{x,y} for x,y in boardedges if x in points and y in points]
        return any(not boardwin(tuple(x for x in points if x not in move)) for move in moves)
    for _ in range(6):
        states=[tuple(i for i in range(12) if rng.randrange(2)) or (0,) for _ in range(10)]
        check('a906','10\n'+'\n'.join(''.join('1' if i in s else '0' for i in range(12)) for s in states),''.join(str(int(boardwin(s))) for s in states),'獨立以棋子集合遞迴移除，檢驗最佳策略勝負。')
    ns=[0,3,17,100,499,500]
    encoded={}
    for a in range(2,18):
        for b in range(1,a):
            for c in range(b): encoded.setdefault(math.comb(a,3)+math.comb(b,2)+c,(a,b,c))
    check('a907',str(len(ns))+'\n'+'\n'.join(map(str,ns)),'\n'.join(''.join(map(str,encoded[n])) for n in ns),'獨立預先枚舉所有三元組並計算組合數，覆蓋0與500。')
    check('a908','4\n2 2\n1 1\n2 2\n1 1','6','穩定排序目的原編號2,4,1,3，距離1+2+2+1=6。')
    check('a908','1\n65536 65536','0','單一雕像無需搬動。')
    def expr_values(nums,ops):
        if len(nums)==1: return {nums[0]}
        vals=set()
        for k,op in enumerate(ops):
            for x in expr_values(nums[:k+1],ops[:k]):
                for y in expr_values(nums[k+1:],ops[k+1:]): vals.add(x+y if op=='+' else x-y if op=='-' else x*y)
        return vals
    for _ in range(10):
        nums=[rng.randrange(1,10) for _ in range(5)]; ops=[rng.choice('+-*') for _ in range(4)]; answer=max(expr_values(nums,ops))
        if answer<=0: continue
        expression=''.join(str(x)+(ops[i] if i<len(ops) else '') for i,x in enumerate(nums))
        check('a909',expression,answer,'獨立枚舉所有括號結果集合，不只儲存極值。')
    check('a910','4\n1\n2\n100000000000000000000000000000000000000\n100000000000000000000000000000000000001',2+(10**38-2)**2+1,'兩組相鄰孩子各距1，合法最近鄰但中間巨大缺口；精確平方超過64位。')
    check('a911','2\n1 2 3 5 6 12 14 16 17 23 24\n1 2 3 4 5 6 12 13 16 17 23 24','1,1','前者最小(0,0,1)，後者最小(0,1,0)，由分支不等式直接求得。')
    path=[1,2,3,5,6,7,9,10,11,16,17]
    for _ in range(10): path += [18,20,21,22,23,17]
    path += [23,24]
    check('a911','1\n'+' '.join(map(str,path)),'1','初始(1,0,0)使a=10且走十次減y；總和0不可能有十輪，故最小1。')
    check('a912','4\n0 0\n2 0\n2 2\n0 2\n4\n1 1\n3 1\n3 3\n1 3','1.00','兩軸平行正方形交集為單位正方形。')
    check('a912','3\n0 0\n1 0\n0 1\n4\n0 0\n2 0\n2 2\n0 2','0.50','三角形完整包含在正方形中，底1高1面積1/2。')
    check('a913','6\n0 0\n2 0\n2 1\n1 1\n1 2\n0 2\n1 2\n1 2','2\n2\n2\n3','L形獨立解析分割為面積2、1，編號按低到高。')
    check('a913','4\n5 7\n15 7\n15 27\n5 27\n1 1\n1','1\n200\n200\n200','單一平移矩形只有一塊，所有統計為200。')
    for n,k in ((1,1),(5,1),(6,3),(10,5)):
        combos=[tuple(x for x in range(1,n+1) if mask>>(x-1)&1) for mask in range(1<<n) if mask.bit_count()==k]; combos.sort(); i=len(combos)//2; a=combos[i]
        output=str(i+1)+'\n'+(' '.join(map(str,combos[i+1])) if i+1<len(combos) else 'no next combination')
        check('a914',f'{n} {k}\n'+' '.join(map(str,a)),output,'獨立枚舉整數遮罩的k子集合，再排序求名次與下一項。')
    check('a915','3\n1 1 1\n5 5 5\n9 1 3','Empty\nEmpty\n8','前兩筆同一格同時要求相鄰與不相鄰，矛盾；第三筆只剩8。')
    for sizes,P in (([1],2),([2,3],7),([4,4],19),([1,2,1,3],23)):
        n=sum(sizes); x=[rng.randrange(P) for _ in range(n)]; A=[[0]*n for _ in range(n)]; start=0
        for size in sizes:
            for i in range(start,start+size):
                for j in range(start,start+size): A[i][j]=1
            start+=size
        b=[sum(A[i][j]*x[j] for j in range(n))%P for i in range(n)]
        check('a916',str(n)+'\n'+str(P)+'\n'+mat([[b[i]]+[2 if i==j else A[i][j] for j in range(n)] for i in range(n)]),sum(x)%P,'由已知原數字生成互不相交完全圖，秘密集合每塊選一點，總和可獨立直接計算；含奇異矩陣。')
    for h,w in ((2,2),(3,5),(5,2)):
        check('a917',f'{h} {w}\n'+mat([[1]*w for _ in range(h)]),'0'*(w-1)+'6'*(h-1)+'4'*(w-1)+'2'*(h-1),'實心矩形輪廓四方向長度可直接解析，含碰邊界。')
    for _ in range(14):
        n=5; B=rng.choice([-1,2,3,4]); b=rng.randrange(1,(4 if B<0 else B)+1); prices=[rng.randrange(1,10) for _ in range(n)]; need=[rng.randrange(1,min(B if B>0 else 3,3)+1) for _ in range(n)]; capacity=sum(need)+b if B<0 else B; d={b:0}
        for price,y in zip(prices,need):
            nd={}
            for stock,cost in d.items():
                for after in range(capacity+1):
                    buy=after+y-stock
                    if buy>=0: nd[after]=min(nd.get(after,10**20),cost+buy*price)
            d=nd
        check('a918',f'{n} {B} {b}\n'+' '.join(map(str,prices))+'\n'+' '.join(map(str,need)),min(d.values()),'獨立枚舉每日消耗後全部庫存量的動態規劃，不使用下一低價貪心。')
    for _ in range(10):
        n=7; parent=[rng.randrange(-1,i) if i else -1 for i in range(n)]; costs=[rng.randrange(1,6) for _ in range(n)]; values=[rng.randrange(1,11) for _ in range(n)]; E=rng.randrange(20); best=0
        for mask in range(1<<n):
            if all(not(mask>>i&1) or parent[i]<0 or mask>>parent[i]&1 for i in range(n)) and sum(costs[i] for i in range(n) if mask>>i&1)<=E: best=max(best,sum(values[i] for i in range(n) if mask>>i&1))
        names=['Skill'+chr(65+i) for i in range(n)]; edges=[(names[p],names[i]) for i,p in enumerate(parent) if p>=0]
        inp=str(n)+'\n'+'\n'.join(f'{names[i]} {-costs[i]} {values[i]}' for i in range(n))+'\n'+str(len(edges))+'\n'+'\n'.join(a+' '+b for a,b in edges)+'\n'+str(E)
        check('a919',inp,best,'獨立枚舉技能子集合，直接檢查所有前置與總消耗。')
    n=200
    check('a919',str(n)+'\n'+'\n'.join(f'Skill{chr(65+i//26)}{chr(65+i%26)} -1 10' for i in range(n))+'\n199\n'+'\n'.join(f'Skill{chr(65+(i-1)//26)}{chr(65+(i-1)%26)} Skill{chr(65+i//26)}{chr(65+i%26)}' for i in range(1,n))+'\n2000',2000,'最大200節點前置鏈，全部取得攻擊2000，驗證鏈深度與大E。')
    for _ in range(10):
        n=7; y=[rng.randrange(i,n) for i in range(n)]; cliques=[]
        for mask in range(1,1<<n):
            members=[i for i in range(n) if mask>>i&1]
            if all(j<=y[i] for i,j in itertools.combinations(members,2)): cliques.append(members)
        K=max(map(len,cliques)); counts=[sum(i in c for c in cliques if len(c)==K) for i in range(n)]; best=max(counts)
        check('a920',str(n)+'\n'+mat([(i+1,y[i]+1) for i in range(n)]),'\n'.join(str(i+1) for i,v in enumerate(counts) if v==best),'獨立枚舉全部學生子集合，直接判斷兩兩朋友並統計最大圈參與數。')
    def circle_brute(a):
        if len(a)==1: return a[0]
        return max(a[(i-1)%len(a)]*a[(i+1)%len(a)]+circle_brute(a[:i]+a[i+1:]) for i in range(len(a)))
    for _ in range(8):
        a=tuple(rng.randrange(1,8) for _ in range(rng.randrange(2,7)))
        check('a921',str(len(a))+'\n'+' '.join(map(str,a)),circle_brute(a),'獨立枚舉所有實際環形移除順序，含兩件時平方規則。')
    for _ in range(8):
        seqs=[[rng.randrange(3) for _ in range(rng.randrange(1,7))] for _ in range(8)]; total=0
        for j,a in enumerate(seqs):
            lengths=[]
            for b in seqs[:j]:
                k=0
                while k<min(len(a),len(b)) and a[k]==b[k]: k+=1
                lengths.append(k)
            Y=max(lengths,default=0); total+=len(a)**2-Y*lengths.count(Y)
        check('a922',str(len(seqs))+'\n'+'\n'.join(str(len(a))+' '+' '.join(map(str,a)) for a in seqs),total,'獨立將每條情報與全部先前情報逐項比較前綴。')
    for _ in range(6):
        n=4; D=[[abs(i-j) for j in range(n)] for i in range(n)]; req=[rng.randrange(n) for _ in range(7)]; best=10**20
        for choices in itertools.product(range(3),repeat=len(req)):
            pos=[0,1,2]; cost=0
            for car,v in zip(choices,req): cost+=D[pos[car]][v]; pos[car]=v
            best=min(best,cost)
        check('a923',str(n)+'\n'+mat(D)+'\n'+' '.join(str(x+1) for x in req),best,'獨立枚舉3^Q種服務車分派，保留三輛具名車位置。')
    check('a924','0\n0 0\n1 3','1','無障礙的合法(1,3)一步跳躍。')
    check('a924','0\n0 0\n1 2','impossible','每步x+y變化為偶數，起終點奇偶不同不可能到達。')
    check('a924','4\n49 50\n51 50\n50 49\n50 51\n50 50\n53 51','impossible','四個長方向第一步全部被障礙封住，起點無合法跳躍。')
    for _ in range(10):
        n=7; weights=[rng.randrange(5) for _ in range(n)]; edges=[(i,j) for i in range(n) for j in range(i+1,n) if rng.randrange(4)==0]; g=[[] for _ in range(n)]
        for a,b in edges: g[a].append(b)
        paths=[]
        def dfs(path):
            u=path[-1]
            if not g[u]: paths.append(path)
            for v in g[u]: dfs(path+[v])
        indegree=[0]*n
        for a,b in edges: indegree[b]+=1
        for u in range(n):
            if indegree[u]==0: dfs([u])
        longest=max(sum(weights[i] for i in p) for p in paths); critical=set(i for p in paths if sum(weights[x] for x in p)==longest for i in p)
        check('a925',str(n)+'\n'+str(len(edges))+'\n'+'\n'.join(map(str,weights))+'\n'+mat([(a+1,b+1) for a,b in edges]),len(critical),'獨立枚舉所有由源至匯路徑，取全部最長路的節點聯集。')
    n=9999
    check('a925',f'{n}\n{n-1}\n'+'\n'.join(['600']*n)+'\n'+mat([(i,i+1) for i in range(1,n)]),n,'最大合法深度9999鏈，每個節點都關鍵，驗證迭代處理。')
    check('a926','1\n2 4\n1 1 2 2\n0 0 0 0\n2\n1 2','Case 1:\n1 2\n0\n0','兩隻地鼠水平範圍不交，無強制先後，可共用高度。')
    check('a926','1\n2 3\n1 2 1\n0 2 0\n1\n1','Case 1:\n1 2\n0','鼠2在中欄垂直直行、鼠1在水平內部直行，交叉合法；兩者任意先後，沒有必然祖先。')
    check('a926','1\n2 3\n1 1 0\n0 2 2\n2\n1 2','Case 1:\n1\n0\n1','鼠1上洞位於鼠2範圍端點，必須1在2上；其餘關係一致。')
    # Independent full turn game tree using immutable remaining-item tuples.
    def game(items,money,turn):
        if not items: return 0
        if not turn: return min(game(items[:i]+items[i+1:],money,True) for i in range(len(items)))
        return max([game(items,money,False)]+[d+game(items[:i]+items[i+1:],money-g,False) for i,(d,g) in enumerate(items) if g<=money])
    for _ in range(7):
        items=tuple((rng.randrange(1,10),rng.randrange(1,7)) for _ in range(5)); M=rng.randrange(12)
        check('a927','1\n5\n'+mat(items)+'\n'+str(M),game(items,M,True),'獨立不記憶化的具體食材遊戲樹，枚舉買、跳過、對手移除。')
    check('a927','1\n1\n1000 200\n0','0','零金錢不得購買；對手最終移除唯一食材。')
    check('a928','1 5 2\nB.P.E','4','無牆直線：本人需4秒，分身2秒按鈕，可同步完成。')
    check('a928','1 5 1\nB.X.E','-1','沒有按鈕但本人仍無法穿牆到出口。')
    check('a928','2 3 2\nB.E\nXPX','2','本人2秒到出口；分身由B走至(0,1)再到P共2步，同時完成。')
    for _ in range(8):
        n=12; a=[rng.randrange(1,5) for _ in range(n)]; queries=[(rng.randrange(n),rng.randrange(n)) for _ in range(10)]; answers=[]
        for l,r in queries:
            values=[]; i=l
            while True:
                values.append(a[i])
                if i==r: break
                i=(i+1)%n
            counts=[values.count(x) for x in set(values)]; mx=max(counts); tied=counts.count(mx); answers.append(mx if tied==1 else tied)
        check('a929',f'{n} {len(queries)}\n'+' '.join(map(str,a))+'\n'+mat([(l+1,r+1) for l,r in queries]),'\n'.join(map(str,answers)),'獨立逐次沿圓圈收集區間，再直接count各項目次數。')
    for a in ([1]*10,list(range(1,11)),[1,2]*5,[3,1,2,3,2,1,3]):
        best=(0,0)
        for start in range(len(a)):
            seen=set(); i=start
            while i<len(a) and a[i] not in seen: seen.add(a[i]); i+=1
            if len(seen)>best[1]: best=(start+1,len(seen))
        check('a930',f'{max(a)} {len(a)}\n'+' '.join(map(str,a)),' '.join(map(str,best)),'獨立從每個起點重新玩到首次重複；含全相同、單調與交替。')
    for _ in range(8):
        n,m=4,3; edges=[(i,j) for i in range(n) for j in range(m) if rng.randrange(2)]; best=0
        for mask in range(1<<(n+m)):
            if not any(mask>>i&1 and mask>>(n+j)&1 for i,j in edges): best=max(best,mask.bit_count())
        check('a931',f'{n} {m} {len(edges)}\n'+mat([(i+1,j+1) for i,j in edges]),best,'獨立枚舉全部選取子集合並逐條檢查衝突。')
    for n,S,K in ((1,9,5),(5,1,3),(7,4,2),(9,999,1),(8,6,4)):
        alive=list(range(1,n+1)); losses={x:0 for x in alive}; pos=0
        while len(alive)>1:
            # Explicit one-chant-at-a-time simulation, independent of order-statistic math.
            for _ in range(S-1): pos=(pos+1)%len(alive)
            x=alive[pos]; losses[x]+=1
            if losses[x]==K: alive.pop(pos); pos%=len(alive)
            else: pos=(pos+1)%len(alive)
        check('a932',f'{n} {S} {K}',alive[0],'獨立逐句念咒與list刪除，含N=1、S=1、非退出輪次與大S。')
    for a in ([3]*8,list(range(8)),list(range(8,0,-1)),[6,5,4],*[ [rng.randrange(10) for _ in range(9)] for _ in range(8)]):
        Es=[0,1,3]; answers=[]
        for E in Es:
            best=0
            for mask in range(1<<len(a)):
                maximum=-1; count=0; good=True
                for i,x in enumerate(a):
                    if mask>>i&1:
                        if x<maximum-E: good=False; break
                        maximum=max(maximum,x); count+=1
                if good: best=max(best,count)
            answers.append(best)
        check('a933',f'{len(a)} 3\n'+' '.join(map(str,a))+'\n0 1 3',' '.join(map(str,answers)),'獨立枚舉所有子序列，逐項比較歷史最大值，含全同及單調。')
    for n,m in ((2,1),(5,4),(8,2),(10,3)):
        count=0
        for mask in range(1<<n):
            colorful=[i for i in range(n) if mask>>i&1]
            if all(b-a>m for a,b in zip(colorful,colorful[1:])): count+=1
        check('a934',f'{n} {m}',count%10000,'獨立枚舉所有二進位施放安排，直接量測彩色間隔。')
    check('a935','0\n0','0','兩個空棋盤相異程度0。')
    check('a935','2\n1 1 1\n2 2 0\n1\n1 1 0','3','同格黑白相異加2，另一白對空加1。')
    check('a935','361\n'+mat([(x,y,0) for x in range(1,20) for y in range(1,20)])+'\n361\n'+mat([(x,y,1) for x in range(1,20) for y in range(1,20)]),722,'361格全部異色，每格貢獻2；不套正式棋局顆數限制。')
    check('a936','\n'.join(['1 2 3 4 5 6 0']*6),'2 1 4 3 6 5','六筆相同零命中限制，最小完全錯位排列214365。')
    for _ in range(5):
        secret=rng.sample(range(1,7),6); guesses=[]
        while len(guesses)<6:
            p=rng.sample(range(1,7),6); hit=sum(x==y for x,y in zip(p,secret))
            if hit<6: guesses.append((p,hit))
        candidates=[]
        def build(prefix):
            if len(prefix)==6:
                if all(sum(x==y for x,y in zip(prefix,p))==hit for p,hit in guesses): candidates.append(tuple(prefix))
                return
            for x in range(1,7):
                if x not in prefix: build(prefix+[x])
        build([])
        check('a936','\n'.join(' '.join(map(str,p))+' '+str(h) for p,h in guesses),' '.join(map(str,min(candidates))),'獨立遞迴建立候選排列並直接驗證六筆命中數。')
    check('a937','1\n10','100','單片磁磚最小外框為10×10。')
    n=500; w=10
    check('a937',f'{n}\n{w}\n'+mat([(j,i,0) for i in range(1,n+1) for j in range(i+1,n+1)]),n*w*w,'最大500片全水平嚴格鏈，寬5000高10，無DFS堆疊。')
    check('a937','4\n2\n2 1 0\n3 1 1\n3 2 1\n4 1 1\n4 2 1\n4 3 0','16','兩列各兩片，兩軸最長鏈皆2，最小外框4×4。')
    check('a939','1\n100 20 0 0','1','單線段且端點反向，正規化後仍一段。')
    check('a939','2\n0 0 1 0\n2 1 3 1','2','兩段定義域有空隙，下界不可跨域合併。')
    check('a939','2\n0 0 2 2\n0 2 2 0','2','兩直線在(1,1)交叉，下界由兩段組成。')
    for _ in range(8):
        # Same domain and distinct slopes: enumerate all intersections and inspect each exact open slab.
        from fractions import Fraction as F
        n=5; slopes=rng.sample(range(-8,9),n); intercepts=[rng.randrange(20,41) for _ in range(n)]; cuts={F(0),F(10)}
        for i,j in itertools.combinations(range(n),2):
            x=F(intercepts[j]-intercepts[i],slopes[i]-slopes[j])
            if 0<x<10: cuts.add(x)
        cuts=sorted(cuts); winners=[]
        for l,r in zip(cuts,cuts[1:]):
            x=(l+r)/2; winners.append(min(range(n),key=lambda i:slopes[i]*x+intercepts[i]))
        count=sum(i==0 or winners[i]!=winners[i-1] for i in range(len(winners)))
        lines=[(0,intercepts[i],10,10*slopes[i]+intercepts[i]) for i in range(n)]
        # Shift up so every coordinate obeys 0..10000.
        low=min(min(row[1],row[3]) for row in lines)
        lines=[(x,y-low,u,v-low) for x,y,u,v in lines]
        check('a939',str(n)+'\n'+mat(lines),count,'獨立建立所有精確交點事件，在每個開區間中點找最低線，統計切換次數。')
    for P in (2,3,5,7,19,101,1000000007,2147483647):
        for trial in range(4):
            n=12; groups=3; A=[[int(i==j) for j in range(n)] for i in range(n)]
            for i in range(groups,n):
                # Each outsider attaches to exactly one secret.
                secret=(i-groups)%groups; A[i][secret]=A[secret][i]=1
            for i in range(groups,n):
                for j in range(i+1,n): A[i][j]=A[j][i]=rng.randrange(2)
            original=[rng.randrange(P) for _ in range(n)]; final=[sum(A[i][j]*original[j] for j in range(n))%P for i in range(n)]
            check('a916',str(n)+'\n'+str(P)+'\n'+mat([[final[i]]+[2 if i==j else A[i][j] for j in range(n)] for i in range(n)]),sum(original)%P,'獨立從已知原向量正向產生最終數字，秘密集為前三點，其他點只鄰接其中一秘密成員、彼此任意相連；多質數與非平凡稠密秩。')
    # Maximum-size cases with direct constructive proofs, independent of solvers.
    scale_rng=random.Random(916); n=1000; P=1000000007; groups=10
    A=[[int(i==j) for j in range(n)] for i in range(n)]
    for i in range(groups,n): A[i][i%groups]=A[i%groups][i]=1
    for i in range(groups,n):
        for j in range(i+1,n): A[i][j]=A[j][i]=int(scale_rng.randrange(3)==0)
    original=[scale_rng.randrange(P) for _ in range(n)]; final=[sum(a*x for a,x in zip(row,original))%P for row in A]
    check('a916',str(n)+'\n'+str(P)+'\n'+mat([[final[i]]+[2 if i==j else A[i][j] for j in range(n)] for i in range(n)]),sum(original)%P,'最大N=1000稠密圖：已知原向量正向生成，秘密集為前10點，各外點恰接一秘密，非秘密間隨機連接。此可證答案測試不代表已證明所有稠密輸入都在1500ms內。')
    K=2000
    check('a926',f'1\n{K} {K+1}\n'+' '.join(map(str,[0]+list(range(1,K+1))))+'\n'+' '.join(map(str,list(range(1,K+1))+[0]))+'\n3\n1 1000 2000','Case 1:\n1\n0\n999\n1999','最大K=2000的嚴格上下鏈：相鄰兩鼠在同一垂直地道上下端，必須1<2<...<2000；迭代拓樸不耗遞迴堆疊。')
    check('a927','1\n15\n'+mat([(1000,1)]*15)+'\n200','8000','最大15食材，資金足夠且美味相等，先手共選8次，每次1000。')
    check('a933','3500 3\n'+' '.join(map(str,range(3500,0,-1)))+'\n0 1 999999','1 2 3500','最大長度嚴格遞減，E=0最多1、E=1最多相鄰2、極大E可全選。')
    # Geometry-level oracle for mouse tunnels, with no precedence graph.
    for _ in range(30):
        K,N=rng.choice((2,3)),4
        labels=[i for i in range(K) for _ in range(2)]+[rng.randrange(-1,K) for _ in range(2*N-2*K)]
        rng.shuffle(labels); top,bot=labels[:N],labels[N:]; holes=[[] for _ in range(K)]
        for x in range(N):
            if top[x]>=0: holes[top[x]].append((x,0))
            if bot[x]>=0: holes[bot[x]].append((x,K+1))
        valid=[]
        for heights in itertools.product(range(1,K+1),repeat=K):
            all_edges=[]; all_nodes=[]; all_turns=[]
            for a in range(K):
                used_edges=set(); used_nodes=set(); turns=set()
                for source,target in itertools.combinations(holes[a],2):
                    x,y=source; u,v=target
                    corners=[source,target] if x==u else [source,(x,heights[a]),(u,heights[a]),target]
                    if x!=u: turns.update(corners[1:-1])
                    for (px,py),(qx,qy) in zip(corners,corners[1:]):
                        dx=(qx>px)-(qx<px); dy=(qy>py)-(qy<py); point=(px,py); used_nodes.add(point)
                        while point!=(qx,qy):
                            nxt=(point[0]+dx,point[1]+dy); used_edges.add(tuple(sorted((point,nxt)))); used_nodes.add(nxt); point=nxt
                all_edges.append(used_edges); all_nodes.append(used_nodes); all_turns.append(turns)
            good=True
            for a,b in itertools.combinations(range(K),2):
                if all_edges[a]&all_edges[b] or all_turns[a]&all_nodes[b] or all_turns[b]&all_nodes[a]: good=False
                span_a=(min(x for x,y in holes[a]),max(x for x,y in holes[a])); span_b=(min(x for x,y in holes[b]),max(x for x,y in holes[b]))
                if heights[a]==heights[b] and max(span_a[0],span_b[0])<=min(span_a[1],span_b[1]): good=False
            if good: valid.append(heights)
        output='Case 1:\n'
        if not valid: output+='no solution'
        else:
            candidates=[a+1 for a in range(K) if any(h[a]==min(h) for h in valid)]
            counts=[sum(all(h[b]<h[a] for h in valid) for b in range(K) if b!=a) for a in range(K)]
            output+=' '.join(map(str,candidates))+'\n'+'\n'.join(map(str,counts))
        inp=f'1\n{K} {N}\n'+mat([[a+1 for a in top],[a+1 for a in bot]])+f'\n{K}\n'+' '.join(str(a+1) for a in range(K))
        check('a926',inp,output,'獨立枚舉所有水平高度（允許共用），實際產生全部洞對路徑的單位邊與轉彎交點，直接檢查物理衝突。')
    save()

for lesson in LESSONS:
    if lesson['code']=='a916':
        lesson['python']='''import sys
it=iter(map(int,sys.stdin.buffer.read().split())); n,p=next(it),next(it)
if p==2:
    rows=[]
    for _ in range(n):
        rhs=next(it)%2; bits=0
        for j in range(n):
            if next(it): bits|=1<<j
        rows.append(bits|(rhs<<n))
    target=(1<<n)-1; r=0
    for c in range(n):
        pivot=next((i for i in range(r,n) if rows[i]>>c&1),None)
        if pivot is None: continue
        rows[r],rows[pivot]=rows[pivot],rows[r]; row=rows[r]
        for i in range(r+1,n):
            if rows[i]>>c&1: rows[i]^=row
        if target>>c&1: target^=row
        r+=1
        if r==n: break
    print(target>>n&1); raise SystemExit
# Independent coefficient lanes inside Python integers. Montgomery residues
# allow every coefficient in a row to be multiplied/reduced simultaneously.
k=p.bit_length()+1; R=1<<k; lane=((3*k+9)//8)*8; width=lane//8
one=int.from_bytes((1).to_bytes(width,'little')*(n+1),'little')
low=one*(R-1); bias=one*(R-p); prime=one*p; neginv=(-pow(p,-1,R))%R; encoded_one=R%p
def reduce_once(u):
    return u-(((u+bias)>>k)&one)*p
def multiply(row,scalar):
    t=row*scalar; m=(t*neginv)&low
    return reduce_once(((t+m*p)>>k)&low)
def subtract(row,other):
    return reduce_once(row+prime-other)
rows=[]
for _ in range(n):
    rhs=next(it)%p; fields=[encoded_one if next(it) else 0 for _ in range(n)]+[rhs*encoded_one%p]
    rows.append(int.from_bytes(b''.join(v.to_bytes(width,'little') for v in fields),'little'))
target=one*encoded_one & ((1<<(lane*n))-1); r=0
for c in range(n):
    shift=lane*c
    pivot=next((i for i in range(r,n) if rows[i]>>shift&(R-1)),None)
    if pivot is None: continue
    rows[r],rows[pivot]=rows[pivot],rows[r]; value=rows[r]>>shift&(R-1)
    inv=pow(value,-1,p)*(R*R%p)%p; row=multiply(rows[r],inv); rows[r]=row
    for i in range(r+1,n):
        factor=rows[i]>>shift&(R-1)
        if factor: rows[i]=subtract(rows[i],multiply(row,factor))
    factor=target>>shift&(R-1)
    if factor: target=subtract(target,multiply(row,factor))
    r+=1
    if r==n: break
# Eliminating the coefficient row of sum(x) leaves RHS = -sum(x).
rhs=target>>(lane*n)&(R-1)
print(-rhs*pow(R,-1,p)%p)
'''
        precheck='''import sys
raw=list(map(int,sys.stdin.buffer.read().split())); n,p=raw[:2]; stride=n+1
neighborhood=[]; final=[]
for i in range(n):
    offset=2+i*stride; final.append(raw[offset]); bits=0
    for j in range(n):
        if raw[offset+1+j]: bits|=1<<j
    neighborhood.append(bits)
# Certified exact-cover shortcut: disjoint closed neighborhoods summing to 1.
# Limit the search; if it does not finish, the polynomial elimination follows.
clash=[]
for bits in neighborhood:
    conflicts=0
    while bits:
        bit=bits&-bits; conflicts|=neighborhood[bit.bit_length()-1]; bits^=bit
    clash.append(conflicts)
sys.setrecursionlimit(max(3000,3*n)); budget=4096; selected=[]
def cover(uncovered,active):
    global budget
    if not uncovered: return True
    budget-=1
    if budget<0: return False
    bits=uncovered; options=0; smallest=n+1
    while bits:
        bit=bits&-bits; bits^=bit; choices=neighborhood[bit.bit_length()-1]&active; count=choices.bit_count()
        if count<smallest: smallest=count; options=choices
        if count<=1: break
    while options and budget>=0:
        bit=options&-options; options^=bit; row=bit.bit_length()-1; selected.append(row)
        if cover(uncovered&~neighborhood[row],active&~clash[row]): return True
        selected.pop()
    return False
if cover((1<<n)-1,(1<<n)-1):
    print(sum(final[i] for i in selected)%p); raise SystemExit
it=iter(raw[2:])
'''
        lesson['python']=precheck+'if p==2:'+lesson['python'].split('if p==2:',1)[1]
        # The C++ tutorial uses the same certified shortcut before elimination.
        lesson['cpp']=lesson['cpp'].replace('int r=0;vector<int>cols;', '''vector<bitset<1000>>nb(n),clash(n);bitset<1000>all;for(int i=0;i<n;i++){all.set(i);for(int j=0;j<n;j++)if(a[i][j])nb[i].set(j);}for(int i=0;i<n;i++)for(int j=0;j<n;j++)if(nb[i][j])clash[i]|=nb[j];int budget=4096;vector<int>selected;function<bool(bitset<1000>,bitset<1000>)>cover=[&](bitset<1000>uncovered,bitset<1000>active){if(uncovered.none())return true;if(--budget<0)return false;bitset<1000>options;int smallest=n+1;for(int v=0;v<n;v++)if(uncovered[v]){auto choices=nb[v]&active;int count=choices.count();if(count<smallest)smallest=count,options=choices;if(count<=1)break;}for(int row=0;row<n&&budget>=0;row++)if(options[row]){selected.push_back(row);if(cover(uncovered&~nb[row],active&~clash[row]))return true;selected.pop_back();}return false;};if(cover(all,all)){long long ans=0;for(int i:selected)ans=(ans+a[i][n])%p;cout<<ans<<'\\n';return 0;}int r=0;vector<int>cols;''')
        lesson['explanation']=[
            '令A為含自身的鄰接矩陣，最終數字為b，原始向量滿足Ax=b (mod P)。秘密集合指示向量s滿足As=1，且A對稱，所以1ᵀx=sᵀAx=sᵀb，證明任意解的加總都相同，即使A奇異也成立。',
            'C++用高斯消去與自由變數設0回代求任一解，再加總。Python直接把係數全為1、常數為0的額外查詢列，跟著主元列消去：最終查詢係數全為0，右端等於秘密和的相反數，因此不必回代。',
            'Python把一整列的各係數隔開足夠多位元，打包成一個大整數。P=2時列運算直接用XOR；奇質數時採Montgomery表示aR mod P，R=2^k>2P。對每個獨立欄位的乘積t，計算m=t·(−P⁻¹) mod R、u=(t+mP)/R，再按u≥P減去P。欄間保留至少3k+2位，足以避免乘法、加減與進位污染相鄰欄；遮罩同時取出每欄低位與比較進位。這使Python的列乘法與模運算交由大整數底層批次執行。',
            '消去只對非零主元求逆，不假設A可逆。所有列運算都保持方程組與查詢的線性關係；所求和唯一保證查詢係數最終歸零。',
            '程式先做有上限的精確覆蓋搜尋：選取互不相交、聯集為全部頂點的封閉鄰域，若成功，其選取頂點就是一個秘密集合，直接加總那些最終數字即可。clash[u]記錄與u的封閉鄰域相交者，選u時一次刪除；每次挑剩餘候選最少的未覆蓋點分支。搜尋最多4096節點，失敗或超出上限就回到高斯消去，因此不依賴搜尋一定成功，也不把近似覆蓋當答案。這個可驗證捷徑減少大圖中常見秘密集合稀疏時的消去成本。'
        ]
        lesson['complexity']='C++消去為O(N³)次有限域運算，O(N²)空間；主元逆元另需O(N log P)。Python消去為O(N²)次整列大整數操作，每列O(N log P)位元。精確覆蓋預檢至多4096節點，每節點O(N·ceil(N/w))位元工作，clash建構O(N²·ceil(N/w))；額外O(N²/w)字空間。Python另有O(N²)輸入暫存。捷徑不改變消去的最壞立方級成本。'
    if lesson['code']=='a926':
        lesson['explanation']=[
            '每隻地鼠的水平範圍是所有洞的最左L到最右R。先看同一欄：若上洞屬a、下洞屬b且兩者不同，為避免共用垂直路段，必須a在b上方。',
            '再看每隻b的左右端點欄：若此欄上洞屬另一隻a，b在端點轉彎，所以a的垂直路不能穿越b，必須a在b上方；下洞屬a則必須b在a上方。內部欄若不發生同欄上下衝突，水平與垂直雙方直行可以相交，不加限制。內部屬b的洞也會轉彎，但該欄另一方的垂直衝突已由第一條同欄規則涵蓋。',
            '這些限制充分且必要：依拓樸序分配不同水平高度，垂直路不共段，所有有轉彎的交點衝突皆已排除，其餘交點均雙方直行。有環則無解；否則每個入度0節點都能排在最高處。可共用高度只會增加可行擺法，不改變必然先後。',
            '拓樸傳播時令ancestor[v]聯集ancestor[u]及u。可達前驅必然在上；不可達者可透過拓樸序調整相對位置，因此查詢就是祖先位元數。原題第13頁規則2明確允許雙方直行交叉，不能對整個水平區間加上下限制。'
        ]
        lesson['complexity']='建圖O(N+K)，最多O(N+K)條不同直接限制。祖先傳播O(E·ceil(K/w))位元運算；C++另掃描K²個鄰接bit，空間O(K²/w+N)機器字。Python read().split()另需O(I)輸入暫存。'
        lesson['pitfall']='雙方都直行可以交叉，不能把水平區間內每個洞都變成先後限制；端點與共用垂直路段才需約束。'
    if lesson['code']=='a878':
        lesson['traceLabel']='獨立單限制示意：Beatrice 必須緊鄰 Sue'
        lesson['trace'][1]['active']=[0,7]
    if lesson['code']=='a927':
        lesson['python']='''import sys
from array import array
it=iter(map(int,sys.stdin.buffer.read().split()))
for _ in range(next(it)):
    n=next(it); items=[(next(it),next(it)) for _ in range(n)]; M=next(it); width=M+1
    cmemo=array('h',[-1])*((1<<n)*width); dmemo=array('h',[-1])*((1<<n)*width)
    def C(mask,b):
        if not mask: return 0
        index=mask*width+b
        if cmemo[index]>=0: return cmemo[index]
        best=D(mask,b)
        for i,(d,g) in enumerate(items):
            if mask>>i&1 and g<=b: best=max(best,d+D(mask^(1<<i),b-g))
        cmemo[index]=best; return best
    def D(mask,b):
        if not mask: return 0
        index=mask*width+b
        if dmemo[index]>=0: return dmemo[index]
        best=min(C(mask^(1<<i),b) for i in range(n) if mask>>i&1)
        dmemo[index]=best; return best
    print(C((1<<n)-1,M))
'''
        lesson['complexity']='最壞 O(2^N·M·N) 時間，O(2^N·M) 空間；兩語言都用16位短整數表儲存值（最高15000），最大N=15、M=200時兩表約25.2MiB。Python另有O(I)輸入暫存。'
independent_checks()

def verify_current():
    if sys.platform=='win32':
        raise SystemExit('C++ runtime verification requires WSL/Linux. Use wsl -d kali-linux -- python3 ... --verify; native --build is safe.')
    count=0; failed=[]
    with tempfile.TemporaryDirectory(prefix='national1-',dir='/tmp') as td:
        td=pathlib.Path(td)
        for lesson in LESSONS:
            code=lesson['code']
            if '--codes' in sys.argv and code not in sys.argv[sys.argv.index('--codes')+1].split(','): continue
            src=td/(code+'.cpp'); exe=td/code; py=td/(code+'.py')
            cpp_text,py_text=lesson['cpp'],lesson['python']
            if '--force-linear' in sys.argv and code=='a916':
                cpp_text=cpp_text.replace('int budget=4096','int budget=-1')
                py_text=py_text.replace('budget=4096','budget=-1')
            src.write_text(cpp_text); py.write_text(py_text)
            r=subprocess.run(['g++','-std=c++17','-O2',str(src),'-o',str(exe)],capture_output=True,text=True,timeout=90)
            if r.returncode: failed.append((code,'compile',r.stderr)); continue
            cases=list(SOURCE[code]['samples'])+[x for x in CHECKS if x['code']==code]
            if '--force-linear' in sys.argv and code=='a916':
                cases=[x for x in cases if len(x['input'])<100000]
            good=True
            for case in cases:
                for cmd in ([str(exe)],[sys.executable,str(py)]):
                    r=subprocess.run(cmd,input=case['input'],capture_output=True,text=True,timeout=90)
                    # Preserve all spaces; permit only the conventional final line ending.
                    if r.returncode or r.stdout.removesuffix('\n')!=case['output'].removesuffix('\n'):
                        failed.append((code,cmd[0],r.stderr or repr((case['input'],case['output'],r.stdout))))
                        good=False
                    else: count+=1
            print(code,'PASS' if good else 'FAIL',len(cases)*2,flush=True)
    print('LANGUAGE RUNS PASSED',count,'FAILURES',len(failed),flush=True)
    for x in failed: print(x,flush=True)
    if failed: raise SystemExit(1)

if '--verify' in sys.argv:
    LESSONS=json.loads((ROOT/'src/lib/newProblemLessons/data/national1.json').read_text(encoding='utf-8'))
    verify_current()
