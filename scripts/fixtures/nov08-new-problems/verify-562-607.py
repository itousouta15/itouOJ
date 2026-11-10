"""Author and independently verify b562..b607. Run in WSL: python3 verify-562-607.py [--author|--verify].
C++ artifacts are created only under Linux /tmp; no Windows executable is produced.
"""
import json, re, sys, pathlib, subprocess, tempfile, random, itertools, collections, math, time
ROOT=pathlib.Path(__file__).resolve().parents[3]
FIX=ROOT/'scripts/fixtures/nov08-new-problems'
DATA=ROOT/'src/lib/newProblemLessons/data/nov08-562-607.json'
SOURCES={x['code']:x for x in json.loads((FIX/'source.json').read_text(encoding='utf-8'))}
LESSONS=[]
HEADER='#include <bits/stdc++.h>\nusing namespace std;\nusing ll=long long;\nconst ll MOD=1000000007;\n'
def add(num,topic,concept,goal,explanations,complexity,pitfall,trace,py,cpp,level='medium',note=None):
    py=py.replace("'\n'", "'\\n'"); cpp=cpp.replace("'\n'", "'\\n'")
    code=f'b{num}'; s=SOURCES[code]
    steps=[]
    for i,(desc,cells,variables) in enumerate(trace):
        steps.append(dict(title=f'步驟 {i+1}：'+desc.split('，')[0][:18],description=desc,cells=list(map(str,cells)),active=list(range(len(cells))),variables=[[str(k),str(v)] for k,v in variables]))
    lesson=dict(code=code,title=re.sub(r'^b\d+\.\s*','',s['title']),topic=topic,level=level,concept=concept,goal=goal,explanation=explanations,complexity=complexity,pitfall=pitfall,sampleInput=s['samples'][0]['input'],sampleOutput=s['samples'][0]['output'],traceLabel='獨立教學例子（不一定是公開範例）',trace=steps,python='import sys\n'+py.strip()+'\n',cpp=HEADER+cpp.strip()+'\n')
    if note:lesson['performanceNote']=note
    LESSONS.append(lesson)
    if '--author' in sys.argv:
        DATA.parent.mkdir(parents=True,exist_ok=True)
        DATA.write_text(json.dumps(LESSONS,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
add(562,'dp','編輯距離與滾動陣列','用前綴狀態比較插入、刪除與替換，處理直到特殊符號為止的多筆字串。',[
'令 D[i][j] 為來源前 i 字元變成目標前 j 字元的最少編輯次數。最後一步若刪除來源尾字元，成本是 D[i−1][j]+1；插入目標尾字元則為 D[i][j−1]+1；保留或替換則是 D[i−1][j−1]+[a[i−1]≠b[j−1]]。三種情況涵蓋所有最後操作，因此取最小值即可用歸納法保證最優。',
'D[0][j]=j、D[i][0]=i，分別代表全部插入與全部刪除。每一列只需要上一列與本列左側，故儲存兩列即可。交換兩字串讓較短者作欄，不影響對稱的編輯距離。輸入以空白切字串，可跨行配對；遇到開頭非英數字的 token 就結束。'],
'每筆長度 m,n≤2000，時間 O(mn)、DP 空間 O(min(m,n))；Python 逐行產生 token，另有最長輸入行的緩衝，不保存所有測資。','終止符號不保證只有 #；大小寫不同也要算一次替換。',[
('先比較 a 與 b',[0,1],[('空前綴成本',1)]),('計算替換，a→b 的成本為 1',[1,1],[('D[1][1]',1)]),('再保留相同尾字元，ac→bc 仍只需一次',[2,2,1],[('D[2][2]',1)])],
'''def tokens():
    for line in sys.stdin.buffer:
        yield from line.split()
it=iter(tokens())
for a in it:
    if not (48<=a[0]<=57 or 65<=a[0]<=90 or 97<=a[0]<=122): break
    b=next(it)
    if len(a)<len(b): a,b=b,a
    old=list(range(len(b)+1))
    for i,x in enumerate(a,1):
        cur=[i]+[0]*len(b)
        for j,y in enumerate(b,1):
            cur[j]=min(old[j]+1,cur[j-1]+1,old[j-1]+(x!=y))
        old=cur
    print(old[-1])''',
'''int main(){ios::sync_with_stdio(false);cin.tie(nullptr);string a,b;while(cin>>a){if(!isalnum((unsigned char)a[0]))break;cin>>b;if(a.size()<b.size())swap(a,b);vector<int>d(b.size()+1),e(b.size()+1);iota(d.begin(),d.end(),0);for(int i=1;i<=(int)a.size();i++){e[0]=i;for(int j=1;j<=(int)b.size();j++)e[j]=min({d[j]+1,e[j-1]+1,d[j-1]+(a[i-1]!=b[j-1])});swap(d,e);}cout<<d.back()<<'\n';}}''')
add(563,'graphs','稀疏／稠密混合最小瓶頸 Dijkstra','以瓶頸成本更新最短標籤，按邊數選擇鄰接表或串流壓縮三角矩陣。',[
'所有道路同時施工，一條路線的完工時間是最大邊權而非邊權總和。令 dist[v] 為目前找到從 1 到 v 的最小瓶頸，從 u 經權重 w 到 v 的候選是 max(dist[u],w)。每次固定尚未確定且 dist 最小的節點；若有更佳路徑，其跨出已確定集合的第一條邊早已提供不大於該路徑瓶頸的候選，與最小標籤的選擇矛盾。因此 Dijkstra 的貪心證明仍成立。目的地被固定時即可輸出，沒有有限標籤則不可達。',
'不能對接近五千萬條道路建立 Python tuple 邊表或一億條雙向鄰接項。當 m≤4n，使用鄰接表及最小堆；只有 m>4n 時，才刻意配置稠密表示並以 O(n²) 的線性選點與鄰點掃描代替堆。兩種表示都逐行讀入，不保存原始文字或全部 token。稠密圖以較大端點 u、較小端點 v 的索引 u(u−1)/2+v，將無向邊只存一份；Python 用 array("I")、C++ 用 uint32_t。平行道路只保留較小權重，因為任何路線使用較大者都能換成較小者而不惡化瓶頸。',
'合法施工時間為非負 31 位元整數，故以 UINT32_MAX=4294967295 表示缺邊，不會與最大合法權重 2147483647 混淆；零權重也是正常道路。n=10000 時矩陣恰有 49995000 格、199980000 bytes（約 190.72 MiB），不另建一份矩陣，距離、已確定旗標與列偏移只佔 O(n)。因此稠密路徑的儲存量不隨 m 的文字長度或重複道路數增加。'],
'稀疏分支 m≤4n：時間 O((n+m) log(n+m))、空間 O(n+m)。稠密分支 m>4n：時間 O(m+n²)、矩陣 4·n(n−1)/2 bytes 加 O(n) 狀態。Python 輸入緩衝只保留一行，不使用 read().split()；陣列乘法從單一元素產生最終矩陣，不經 Python 整數列表。n≤10000 的矩陣上限為 199980000 bytes；實際程序仍含直譯器與少量容器。','不能把瓶頸更新寫成 dist[u]+w；不能以 2147483647 作缺邊值，也不能讓後讀入的較大平行邊蓋掉較小值。',[
('從 1 出發，候選 2 為 2、3 為 9',['dist[1]=0','dist[2]=2','dist[3]=9'],[('已固定','1')]),
('固定節點 2，經權重 5 更新節點 3',['dist[2]=2','max(2,5)=5'],[('dist[3]',5)]),
('下一個最小標籤是目的地 3，瓶頸為 5',[5],[('答案',5)])],
r'''import heapq
from array import array

def solve():
    read = sys.stdin.buffer.readline
    n, m = map(int, read().split())
    INF = 4294967295
    if m <= 4 * n:
        graph = [[] for _ in range(n)]
        for _ in range(m):
            u, v, w = map(int, read().split())
            u -= 1
            v -= 1
            graph[u].append((v, w))
            graph[v].append((u, w))
        dist = [INF] * n
        dist[0] = 0
        heap = [(0, 0)]
        while heap:
            cost, u = heapq.heappop(heap)
            if cost != dist[u]:
                continue
            if u == n - 1:
                return cost
            for v, w in graph[u]:
                candidate = max(cost, w)
                if candidate < dist[v]:
                    dist[v] = candidate
                    heapq.heappush(heap, (candidate, v))
        return -1

    # Lower triangle: edge {u,v}, u>v, occupies offset[u]+v.
    offset = [u * (u - 1) // 2 for u in range(n)]
    weights = array('I', [INF])
    assert weights.itemsize == 4
    weights *= n * (n - 1) // 2
    for _ in range(m):
        u, v, w = map(int, read().split())
        u -= 1
        v -= 1
        if u < v:
            u, v = v, u
        if u == v:
            continue
        index = offset[u] + v
        if w < weights[index]:
            weights[index] = w
    dist = array('I', [INF]) * n
    used = bytearray(n)
    dist[0] = 0
    for _ in range(n):
        best = INF
        u = -1
        for v in range(n):
            if not used[v] and dist[v] < best:
                best = dist[v]
                u = v
        if u == -1:
            return -1
        if u == n - 1:
            return best
        used[u] = 1
        base = offset[u]
        for v in range(u):
            if not used[v]:
                w = weights[base + v]
                candidate = best if best >= w else w
                if candidate < dist[v]:
                    dist[v] = candidate
        for v in range(u + 1, n):
            if not used[v]:
                w = weights[offset[v] + u]
                candidate = best if best >= w else w
                if candidate < dist[v]:
                    dist[v] = candidate
    return -1

print(solve())''',
r'''int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, m;
    cin >> n >> m;
    const uint32_t INF = numeric_limits<uint32_t>::max();
    if (m <= 4 * n) {
        vector<vector<pair<int, uint32_t>>> graph(n);
        for (int i = 0; i < m; ++i) {
            int u, v;
            uint32_t w;
            cin >> u >> v >> w;
            --u; --v;
            graph[u].push_back({v, w});
            graph[v].push_back({u, w});
        }
        vector<uint32_t> dist(n, INF);
        using Entry = pair<uint32_t, int>;
        priority_queue<Entry, vector<Entry>, greater<Entry>> heap;
        dist[0] = 0;
        heap.push({0, 0});
        while (!heap.empty()) {
            auto [cost, u] = heap.top();
            heap.pop();
            if (cost != dist[u]) continue;
            if (u == n - 1) { cout << cost << '\n'; return 0; }
            for (auto [v, w] : graph[u]) {
                uint32_t candidate = max(cost, w);
                if (candidate < dist[v]) {
                    dist[v] = candidate;
                    heap.push({candidate, v});
                }
            }
        }
        cout << -1 << '\n';
        return 0;
    }
    vector<size_t> offset(n);
    for (size_t u = 0; u < size_t(n); ++u) offset[u] = u * (u - 1) / 2;
    vector<uint32_t> weights(size_t(n) * (n - 1) / 2, INF);
    for (int i = 0; i < m; ++i) {
        int u, v;
        uint32_t w;
        cin >> u >> v >> w;
        --u; --v;
        if (u < v) swap(u, v);
        if (u == v) continue;
        size_t index = offset[u] + v;
        weights[index] = min(weights[index], w);
    }
    vector<uint32_t> dist(n, INF);
    vector<unsigned char> used(n);
    dist[0] = 0;
    for (int step = 0; step < n; ++step) {
        uint32_t best = INF;
        int u = -1;
        for (int v = 0; v < n; ++v) {
            if (!used[v] && dist[v] < best) { best = dist[v]; u = v; }
        }
        if (u == -1) break;
        if (u == n - 1) { cout << best << '\n'; return 0; }
        used[u] = 1;
        for (int v = 0; v < u; ++v) {
            if (!used[v]) dist[v] = min(dist[v], max(best, weights[offset[u] + v]));
        }
        for (int v = u + 1; v < n; ++v) {
            if (!used[v]) dist[v] = min(dist[v], max(best, weights[offset[v] + u]));
        }
    }
    cout << -1 << '\n';
}''',note='儲存已依完整 n≤10000 上限界定；稠密分支的 Python O(n²) 選點、掃描和逐行解析大量道路可能超過題目時限，正式提交建議 C++17。實際峰值記憶體與完整圖測量記錄於 results-562-607.json。')
add(564,'search','答案二分與連續分段貪心','尋找能分成恰好 K 個非空連續區段的最小最大區段和。',[
'假設每台機器最多承擔 X 時間，從左至右讓目前區段盡量延長，直到加入下一製程會超過 X 才切開。對任何可行分割，貪心的第一段不會比它短；移除首段後重複論證，貪心使用的區段數最少。',
'只要區段數≤K 就可行：正時間製程的某些區段還可以拆成更小的非空段，直到恰有 K 段，最大值不會增加（有效輸入須 1≤K≤N）。可行性隨 X 單調，因此在最大單項時間至所有時間總和之間二分最小可行值。'],
'時間 O(N log S)，S 為製程時間總和；空間 O(N)，含 Python 整數陣列與讀入緩衝。題面未列 N、時間上限；C++ 假定總和可由 64 位元有號整數容納。','不可任意重排製程，也不能把一項工作拆給兩台機器。',[
('測試容量 7，工作為 3、4、5',[3,4,5],[('K',2)]),('3+4 可放同段，5 另成一段',[7,5],[('段數',2)]),('容量 6 需要三段，因此最小可行值是 7',[3,4,5],[('答案',7)])],
'''a=list(map(int,sys.stdin.buffer.read().split()));n,k=a[:2];a=a[2:]
lo,hi=max(a),sum(a)
while lo<hi:
    mid=(lo+hi)//2;s=0;parts=1
    for x in a:
        if s+x>mid:parts+=1;s=0
        s+=x
    if parts<=k:hi=mid
    else:lo=mid+1
print(lo)''',
'''int main(){ios::sync_with_stdio(false);cin.tie(nullptr);int n,k;cin>>n>>k;vector<ll>a(n);ll lo=0,hi=0;for(ll&x:a){cin>>x;lo=max(lo,x);hi+=x;}while(lo<hi){ll mid=lo+(hi-lo)/2,s=0;int c=1;for(ll x:a){if(s>mid-x){c++;s=0;}s+=x;}if(c<=k)hi=mid;else lo=mid+1;}cout<<lo<<'\n';}''')
add(565,'trees','深度勢能與模數遞推','不實際生成新蛇頭，而用每個節點的深度計算總攻擊數。',[
'令深度 d 的一顆葉子及其再生後代，總共需要 F(d) 次攻擊。F(1)=1；若 d≥2，砍掉它會在祖父處新增兩顆深度 d−1 的頭，所以 F(d)=1+2F(d−1)。因此 F(d)=2^d−1。根不是蛇頭，令 F(0)=0。',
'把所有現存非根節點的 F(深度) 相加作勢能。每次砍葉子時勢能減少 F(d)，新增兩葉增加 2F(d−1)，差恰好為 1；原父節點一直計在勢能中，不必等它成為葉子才加入。終局只有根、勢能為零，故最初勢能就是任意砍頭順序的攻擊總數。用迭代走訪避免十萬長鏈遞迴溢位。'],
'時間 O(n)、空間 O(n)，含鄰接表、走訪順序與 Python 輸入 token；只需保留模 65536 的勢能。','只計初始葉子會漏掉日後變成頭的內部節點；深度≥16 時 2^d≡0，不代表 F(d) 是零。',[
('根 1 的勢能為 0，鏈為 1–2–3',[0,1,2],[('深度', '0,1,2')]),('深度 1 與 2 的勢能分別為 1、3',[0,1,3],[('總勢能',4)]),('先砍最深葉，新增兩顆深度 1 的頭',[1,1,1],[('已攻擊',1),('剩餘勢能',3)])],
'''it=iter(map(int,sys.stdin.buffer.read().split()));n=next(it);g=[[] for _ in range(n)]
for _ in range(n-1):
    u=next(it)-1;v=next(it)-1;g[u].append(v);g[v].append(u)
p=[-1]*n;p[0]=0;order=[0];val=[0]*n;ans=0
for u in order:
    for v in g[u]:
        if v==p[u]:continue
        p[v]=u;val[v]=(2*val[u]+1)%65536;ans=(ans+val[v])%65536;order.append(v)
print(ans)''',
'''int main(){ios::sync_with_stdio(false);cin.tie(nullptr);int n;cin>>n;vector<vector<int>>g(n);for(int i=1,u,v;i<n;i++){cin>>u>>v;--u;--v;g[u].push_back(v);g[v].push_back(u);}vector<int>p(n,-1),q{0},f(n);p[0]=0;int ans=0;for(int i=0;i<(int)q.size();i++){int u=q[i];for(int v:g[u])if(v!=p[u]){p[v]=u;f[v]=(2*f[u]+1)%65536;ans=(ans+f[v])%65536;q.push_back(v);}}cout<<ans<<'\n';}''')
add(566,'trees','AHU 子樹型別編碼','以子節點型別的排序序列辨識有根樹同構。',[
'對每個節點，收集其子樹型別並排序，將這個序列對應到唯一整數 ID。葉子的空序列共用同一型別。兩棵樹必須共用同一個序列到 ID 的字典，否則不同結構可能因插入順序而偶然取得相同編號。',
'由葉子向根計算：若兩節點的排序序列相同，其子樹可依各型別一一配對並遞迴建立同構；若同構，子樹型別多重集合也必定相同。此歸納同時證明充分與必要。根固定為 1，不可改用無根樹的中心判定。用走訪順序的逆序代替遞迴。'],
'排序子節點合計 O(n log n)，Python 字典期望 O(n) 額外查找成本，空間 O(n)，含兩樹、型別 tuple、輸入緩衝；C++ map 的序列比較與查找保守上界 O(n log² n)。所有案例 n 總和≤100000。','子節點順序可改變，根的位置不能改變；不能比較節點編號。',[
('兩個葉子都對應空序列',['()','()'],[('葉型別',1)]),('根的兩個孩子型別排序後為 [1,1]',['1','1'],[('根型別',2)]),('另一棵星形樹同樣得到型別 2',['[1,1]','[1,1]'],[('判定','YES')])],
'''it=iter(map(int,sys.stdin.buffer.read().split()));t=next(it);out=[]
for _ in range(t):
    n=next(it);ids={}
    def tree():
        g=[[] for _ in range(n)]
        for _ in range(n-1):
            u=next(it)-1;v=next(it)-1;g[u].append(v);g[v].append(u)
        p=[-1]*n;p[0]=0;order=[0]
        for u in order:
            for v in g[u]:
                if v!=p[u]:p[v]=u;order.append(v)
        typ=[0]*n
        for u in reversed(order):
            key=tuple(sorted(typ[v] for v in g[u] if v!=p[u]))
            if key not in ids:ids[key]=len(ids)+1
            typ[u]=ids[key]
        return typ[0]
    a=tree();b=tree();out.append('YES' if a==b else 'NO')
print('\\n'.join(out))'''.replace("'\\n'","'\n'"),
'''int main(){ios::sync_with_stdio(false);cin.tie(nullptr);int t;cin>>t;while(t--){int n;cin>>n;map<vector<int>,int> ids;auto tree=[&](){vector<vector<int>>g(n);for(int i=1,u,v;i<n;i++){cin>>u>>v;--u;--v;g[u].push_back(v);g[v].push_back(u);}vector<int>p(n,-1),q{0},typ(n);p[0]=0;for(int i=0;i<n;i++)for(int v:g[q[i]])if(v!=p[q[i]]){p[v]=q[i];q.push_back(v);}for(int i=n-1;i>=0;i--){int u=q[i];vector<int>key;for(int v:g[u])if(v!=p[u])key.push_back(typ[v]);sort(key.begin(),key.end());auto it=ids.find(key);if(it==ids.end())it=ids.emplace(key,ids.size()+1).first;typ[u]=it->second;}return typ[0];};int a=tree(),b=tree();cout<<(a==b?"YES":"NO")<<'\n';}}''')
add(567,'graphs','交通方式分層最短路','區分手上有車和沒有車兩種狀態，只在單車站切換。',[
'把每個路口拆成步行狀態 (u,0) 與持車狀態 (u,1)。步行道路連接兩端的 0 層；允許騎車的道路另連接 1 層。每個單車站的兩層之間放雙向零成本邊，精確描述借車和還車。禁行單車的道路完全沒有騎車邊。',
'合法旅程與分層圖路徑一一對應且時間相同，因此從 (s,0) 執行 Dijkstra，答案是 (d,0) 的距離。抵達 d 的持車狀態不能直接當答案，因為 d 若無站就必須繼續騎到別處還車。使用過期堆項檢查，避免重複展開。'],
'時間 O((n+m) log(n+m))、空間 O(n+m)，含 Python 鄰接表、堆和輸入緩衝。題面未列 n,m 上限；累計時間以 C++ 64 位元儲存。','騎車時不能牽車走徒步路，只有單車站可零成本切換。',[
('0、1 都有站，0→1 步行 8、騎車 2',['(0,0)','(0,1)'],[('借車成本',0)]),('沿騎車層到路口 1',['(1,1)'],[('距離',2)]),('站內還車後才算抵達',['(1,0)'],[('答案',2)])],
'''import heapq
it=iter(map(int,sys.stdin.buffer.read().split()));n=next(it);m=next(it);s=next(it);d=next(it);k=next(it)
g=[[] for _ in range(2*n)]
for _ in range(k):
    u=next(it);g[2*u].append((2*u+1,0));g[2*u+1].append((2*u,0))
for _ in range(m):
    u=next(it);v=next(it);w=next(it);c=next(it)
    g[2*u].append((2*v,w));g[2*v].append((2*u,w))
    if c!=-1:g[2*u+1].append((2*v+1,c));g[2*v+1].append((2*u+1,c))
dist=[float('inf')]*(2*n);dist[2*s]=0;q=[(0,2*s)]
while q:
    cost,u=heapq.heappop(q)
    if cost!=dist[u]:continue
    if u==2*d:break
    for v,w in g[u]:
        z=cost+w
        if z<dist[v]:dist[v]=z;heapq.heappush(q,(z,v))
print(dist[2*d])''',
'''int main(){ios::sync_with_stdio(false);cin.tie(nullptr);int n,m,s,d,k;cin>>n>>m>>s>>d>>k;vector<vector<pair<int,ll>>>g(2*n);while(k--){int u;cin>>u;g[2*u].push_back({2*u+1,0});g[2*u+1].push_back({2*u,0});}for(int i=0,u,v;i<m;i++){ll a,b;cin>>u>>v>>a>>b;g[2*u].push_back({2*v,a});g[2*v].push_back({2*u,a});if(b!=-1){g[2*u+1].push_back({2*v+1,b});g[2*v+1].push_back({2*u+1,b});}}vector<ll>dist(2*n,LLONG_MAX);priority_queue<pair<ll,int>,vector<pair<ll,int>>,greater<pair<ll,int>>>q;dist[2*s]=0;q.push({0,2*s});while(!q.empty()){auto[c,u]=q.top();q.pop();if(c!=dist[u])continue;if(u==2*d)break;for(auto[v,w]:g[u])if(c<=LLONG_MAX-w&&c+w<dist[v]){dist[v]=c+w;q.push({c+w,v});}}cout<<dist[2*d]<<'\n';}''')
add(570,'dp','0/1 背包的預算狀態','在預算內挑選每項至多一次的措施，使減碳量最大。',[
'令 dp[c] 表示使用不超過 c 元可取得的最大減碳量。對花費 a、減碳 b 的措施，選或不選給出 dp[c]=max(dp[c],dp[c−a]+b)。初值皆為零表示可以完全不採取措施，不要求剛好用完預算。',
'每項措施的預算必須由大到小更新，這樣 dp[c−a] 仍是處理本項之前的值，才能保證只取一次。若由小到大，就可能把剛更新的狀態再次拿來加上同一項，誤成無限背包。多筆資料直到 EOF，每筆獨立重設。'],
'時間 O(MN)、空間 O(N+M)，Python 逐行讀入避免保存整份輸入；題面未列 M、N 上限，本實作為偽多項式演算法，不能據此保證任意巨大預算可行。','減碳總量需 64 位元；不要把 M 與 N 的順序讀反。',[
('預算 5，先處理花費 3、減碳 7',[0,0,0,7,7,7],[('已處理',1)]),('再處理花費 2、減碳 4，倒序更新容量 5',[0,0,4,7,7,11],[('dp[5]',11)]),('兩項合計花費 5，減碳 11',[3,2],[('答案',11)])],
'''def tokens():
    for line in sys.stdin.buffer:yield from map(int,line.split())
it=iter(tokens())
while True:
    try:m=next(it)
    except StopIteration:break
    n=next(it);dp=[0]*(n+1)
    for _ in range(m):
        a=next(it);b=next(it)
        for c in range(n,a-1,-1):dp[c]=max(dp[c],dp[c-a]+b)
    print(dp[n])''',
'''int main(){ios::sync_with_stdio(false);cin.tie(nullptr);int m,n;while(cin>>m>>n){vector<ll>d(n+1);for(int i=0,a;i<m;i++){ll b;cin>>a>>b;for(int c=n;c>=a;c--)d[c]=max(d[c],d[c-a]+b);}cout<<d[n]<<'\n';}}''',note='題面缺少預算上限，O(MN) 的可接受範圍無法由題面判定；未宣稱可處理所有 64 位元預算。')
add(571,'simulation','事件排序與空位 Fenwick 樹','依同時還車優先規則模擬借還車，快速找到環狀路線下一個有空位站。',[
'建立所有借車與還車事件，排序鍵為（時間、類別、需求輸入序號），還車類別小於借車。借不到車就標記需求失敗，對應還車事件直接忽略。借成功時車立即離站，尚未到還車時間不能給其他人借。',
'Fenwick 樹在每個未滿站記 1，滿站記 0。要從 v 找空位，先求 v 之前的空位數；若 v 到 N 還有空位，找下一個第 k 個 1，否則繞回第一個 1。借還車使站點從滿變未滿或反向時更新樹。成功借出的車必定留下至少一個空位，所以還車不會無限繞圈。'],
'時間 O(M log M+(N+M) log N)、空間 O(N+M)，含 Python 事件 tuple、需求狀態及輸入緩衝。','相同時間先全部還車；同類事件按輸入順序，不能只依起始時間處理整趟旅程。',[
('兩站容量皆 1，初始第一站一車、第二站空',[1,0],[('空位站','2')]),('借走第一站的車，兩站都有空位',[0,0],[('撲空',0)]),('車還到第二站，沒有繞路',[0,1],[('繞路',0)])],
'''it=iter(map(int,sys.stdin.buffer.read().split()));n=next(it);m=next(it);cap=[next(it) for _ in range(n)];b=[next(it) for _ in range(n)];events=[]
for i in range(m):
    s=next(it);u=next(it)-1;e=next(it);v=next(it)-1
    events.extend(((s,1,i,u),(e,0,i,v)))
bit=[0]*(n+1)
def update(i,d):
    i+=1
    while i<=n:bit[i]+=d;i+=i&-i
def pref(i):
    s=0
    while i:s+=bit[i];i-=i&-i
    return s
def kth(k):
    x=0;step=1<<(n.bit_length()-1)
    while step:
        z=x+step
        if z<=n and bit[z]<k:k-=bit[z];x=z
        step>>=1
    return x
for i in range(n):
    if b[i]<cap[i]:update(i,1)
ok=[False]*m;miss=detour=0
for t,kind,i,u in sorted(events):
    if kind:
        if b[u]==0:miss+=1
        else:
            ok[i]=True
            if b[u]==cap[u]:update(u,1)
            b[u]-=1
    elif ok[i]:
        before=pref(u);total=pref(n);v=kth(before+1 if total>before else 1)
        detour+=(v-u)%n;b[v]+=1
        if b[v]==cap[v]:update(v,-1)
print(miss);print(detour)''',
'''int main(){ios::sync_with_stdio(false);cin.tie(nullptr);int n,m;cin>>n>>m;vector<int>c(n),b(n),bit(n+1),ok(m);for(int&x:c)cin>>x;for(int&x:b)cin>>x;auto upd=[&](int i,int d){for(++i;i<=n;i+=i&-i)bit[i]+=d;};auto sum=[&](int i){int s=0;for(;i;i-=i&-i)s+=bit[i];return s;};auto kth=[&](int k){int x=0;for(int h=1<<(31-__builtin_clz(n));h;h>>=1)if(x+h<=n&&bit[x+h]<k){k-=bit[x+h];x+=h;}return x;};vector<tuple<ll,int,int,int>>ev;for(int i=0,u,v;i<m;i++){ll s,e;cin>>s>>u>>e>>v;ev.emplace_back(s,1,i,u-1);ev.emplace_back(e,0,i,v-1);}for(int i=0;i<n;i++)if(b[i]<c[i])upd(i,1);sort(ev.begin(),ev.end());ll miss=0,detour=0;for(auto[t,kind,i,u]:ev){if(kind){if(!b[u])miss++;else{ok[i]=1;if(b[u]==c[u])upd(u,1);b[u]--;}}else if(ok[i]){int a=sum(u),z=kth(sum(n)>a?a+1:1);detour+=(z-u+n)%n;if(++b[z]==c[z])upd(z,-1);}}cout<<miss<<'\n'<<detour<<'\n';}''')
add(572,'sorting','保留重複價格的升冪排序','讀取型號與價格，輸出最低 min(K,M) 筆的價格。',[
'題目只要求價格，不要求型號的排序結果。因此每筆讀入時可丟棄五字母型號，只將價格保存在陣列中，最後作升冪排序。輸出前 min(K,M) 個即可，K 超過資料筆數時也不會越界。',
'排序後第 i 個元素不大於任何更後方元素，所以選取前 K 筆恰好給出最便宜的 K 個價格。兩個不同晶片即使價格相同，仍是兩筆資料，不能用集合去除重複。每批資料各自排序，直到 EOF。'],
'每批時間 O(M log M)、空間 O(M)，含 Python 價格整數與排序暫存；逐行 token 生成器只額外保存單行緩衝。','同價仍需重複輸出；不要輸出型號或把超額 K 當作錯誤。',[
('輸入三個價格 9、2、2',[9,2,2],[('K',4)]),('排序後保留兩筆 2',[2,2,9],[('M',3)]),('K 超過 M，輸出全部',[2,2,9],[('輸出數量',3)])],
'''def tokens():
    for line in sys.stdin.buffer:yield from line.split()
it=iter(tokens())
while True:
    try:m=int(next(it))
    except StopIteration:break
    k=int(next(it));a=[]
    for _ in range(m):next(it);a.append(int(next(it)))
    a.sort();print(*a[:k])''',
'''int main(){ios::sync_with_stdio(false);cin.tie(nullptr);int m,k;while(cin>>m>>k){vector<ll>a(m);string name;for(ll&x:a)cin>>name>>x;sort(a.begin(),a.end());for(int i=0;i<min(m,k);i++)cout<<(i?" ":"")<<a[i];cout<<'\n';}}''',level='easy')
add(574,'graphs','各起點 BFS 求最短環','以非樹邊連接兩條 BFS 路徑，找無向圖最短環。',[
'從每個節點 s 執行 BFS，記錄最短距離 dist 與父節點。檢查邊 u–v 時，若 v 已造訪且不是 u 的父節點，可形成長度至多 dist[u]+dist[v]+1 的封閉走法，更新最短環候選。樹的父子邊不能當作長度 2 的環。',
'候選走法若兩條根路徑共用一段，刪除共用段後仍含有一個不更長的環；因此候選不會低於真正圍長。反過來，從最短環上的點出發，BFS 前緣必會在環的另一側相遇並取得不大於該環長的候選。兩個方向的界合起來，最小候選就是圍長。'],
'時間 O(n(n+m))、空間 O(n+m)，Python 含鄰接表、佇列及輸入緩衝。n≤2500、m≤5000；重複 BFS 的常數可能使 Python 超過一秒，未承諾該時限。','若全部邊都是 BFS 樹邊，答案是 −1，不能輸出初始無限大。',[
('三角形從 1 出發',['1:0','2:1','3:1'],[('起點',1)]),('邊 2–3 連接兩個已訪問節點',[1,1,1],[('候選長度','1+1+1=3')]),('簡單圖沒有更短環',[3],[('圍長',3)])],
'''from collections import deque
it=iter(map(int,sys.stdin.buffer.read().split()));n=next(it);m=next(it);g=[[] for _ in range(n)]
for _ in range(m):
    u=next(it)-1;v=next(it)-1;g[u].append(v);g[v].append(u)
ans=n+1
for s in range(n):
    dist=[-1]*n;p=[-1]*n;dist[s]=0;q=deque([s])
    while q:
        u=q.popleft()
        for v in g[u]:
            if dist[v]<0:dist[v]=dist[u]+1;p[v]=u;q.append(v)
            elif p[u]!=v:ans=min(ans,dist[u]+dist[v]+1)
    if ans<=3:break
print(ans if ans<=n else -1)''',
'''int main(){ios::sync_with_stdio(false);cin.tie(nullptr);int n,m;cin>>n>>m;vector<vector<int>>g(n);for(int i=0,u,v;i<m;i++){cin>>u>>v;--u;--v;g[u].push_back(v);g[v].push_back(u);}int ans=n+1;for(int s=0;s<n;s++){vector<int>d(n,-1),p(n,-1),q{s};d[s]=0;for(int i=0;i<(int)q.size();i++){int u=q[i];for(int v:g[u])if(d[v]<0){d[v]=d[u]+1;p[v]=u;q.push_back(v);}else if(p[u]!=v)ans=min(ans,d[u]+d[v]+1);}if(ans<=3)break;}cout<<(ans<=n?ans:-1)<<'\n';}''',note='演算法符合列出的漸進範圍；一秒限制下的 Python 全上界效能尚未驗證。')
add(575,'graphs','位勢 Dijkstra 最小費用流','用反向邊允許撤回選擇，求恰好 k 單位流量的最小成本。',[
'每條原邊建立容量 r、費用 c 的殘餘邊，以及容量 0、費用 −c 的反向邊。沿最短增廣路送出瓶頸流量後，正向容量減少、反向容量增加；反向邊可撤回較早的運送安排，避免逐次選最便宜原路線造成錯誤。',
'反向邊有負費用，不能直接套一般 Dijkstra。維護位勢 h，使用約化費用 c+h[u]−h[v]；初始原邊費用非負，可令 h=0。每次求最短路後對可達點加上距離，保持可達殘餘邊約化費用非負。如此最短增廣路保證目前流量的最小成本；找不到路且未送滿 k 時答案為 −1。'],
'至多 k≤100 次增廣，時間 O(k(m+n) log(n+m))、空間 O(n+m)，含 Python 殘餘邊、堆與輸入緩衝；n≤500、m≤1000。','只使用正向路徑而不建立負費用反向邊，可能無法修正先前分配。',[
('兩條直接路線，容量與單價為 (1,2)、(2,5)',['1@2','2@5'],[('需求',2)]),('先送 1 件走單價 2 的邊',[0,2],[('流量',1),('費用',2)]),('再送 1 件走單價 5 的邊',[0,1],[('流量',2),('總費用',7)])],
'''import heapq
it=iter(map(int,sys.stdin.buffer.read().split()));n=next(it);m=next(it);need=next(it);g=[[] for _ in range(n)]
for _ in range(m):
    u=next(it)-1;v=next(it)-1;r=next(it);c=next(it)
    # Self loops cannot improve a positive-cost flow; ignore them.
    if u==v:continue
    g[u].append([v,len(g[v]),r,c]);g[v].append([u,len(g[u])-1,0,-c])
h=[0]*n;flow=cost=0;inf=10**30
while flow<need:
    d=[inf]*n;p=[None]*n;d[0]=0;q=[(0,0)]
    while q:
        du,u=heapq.heappop(q)
        if du!=d[u]:continue
        for i,(v,rev,cap,c) in enumerate(g[u]):
            z=du+c+h[u]-h[v]
            if cap and z<d[v]:d[v]=z;p[v]=(u,i);heapq.heappush(q,(z,v))
    if d[-1]==inf:break
    for v in range(n):
        if d[v]<inf:h[v]+=d[v]
    f=need-flow;v=n-1
    while v:
        u,i=p[v];f=min(f,g[u][i][2]);v=u
    v=n-1
    while v:
        u,i=p[v];e=g[u][i];cost+=f*e[3];e[2]-=f;g[v][e[1]][2]+=f;v=u
    flow+=f
print(cost if flow==need else -1)''',
'''struct E{int v,rev,cap;ll c;};int main(){ios::sync_with_stdio(false);cin.tie(nullptr);int n,m,k;cin>>n>>m>>k;vector<vector<E>>g(n);for(int i=0,u,v,r,c;i<m;i++){cin>>u>>v>>r>>c;--u;--v;if(u==v)continue;int a=g[u].size(),b=g[v].size();g[u].push_back({v,b,r,c});g[v].push_back({u,a,0,-c});}vector<ll>h(n);ll ans=0;int flow=0;const ll INF=1LL<<60;while(flow<k){vector<ll>d(n,INF);vector<int>pv(n),pe(n);priority_queue<pair<ll,int>,vector<pair<ll,int>>,greater<pair<ll,int>>>q;d[0]=0;q.push({0,0});while(!q.empty()){auto[du,u]=q.top();q.pop();if(du!=d[u])continue;for(int i=0;i<(int)g[u].size();i++){auto&e=g[u][i];ll z=du+e.c+h[u]-h[e.v];if(e.cap&&z<d[e.v]){d[e.v]=z;pv[e.v]=u;pe[e.v]=i;q.push({z,e.v});}}}if(d[n-1]==INF)break;for(int u=0;u<n;u++)if(d[u]<INF)h[u]+=d[u];int f=k-flow;for(int v=n-1;v;v=pv[v])f=min(f,g[pv[v]][pe[v]].cap);for(int v=n-1;v;v=pv[v]){auto&e=g[pv[v]][pe[v]];ans+=f*e.c;e.cap-=f;g[v][e.rev].cap+=f;}flow+=f;}cout<<(flow==k?ans:-1)<<'\n';}''',level='hard')
add(576,'data-structures','至多 K 種值的滑動視窗','維持最左合法起點，累加每個右端點可形成的子陣列數。',[
'右端點向右移動時將新值的頻率加一；若相異值超過 k，就持續移動左端點並扣除頻率，直到重新合法。頻率降為零時才刪除該種類。此時 [l,r] 是以 r 結尾的最長合法視窗。',
'從 l 到 r 的所有起點皆合法，共 r−l+1 個；更左的起點仍包含曾使種類超標的元素，因此不合法。每個子陣列恰好在自己的右端點被計數一次。兩個指標都只前進 n 次，避免枚舉 O(n²) 個區間。'],
'字典期望時間 O(n)、空間 O(n)，包含 Python 整數陣列、頻率表及整份 split 輸入緩衝。n≤200000；答案最多 n(n+1)/2，C++ 需 64 位元。','相同值多次出現仍只算一種；不要在扣掉一個副本後立刻刪除整個種類。',[
('k=1，讀入第一個 2',[2],[('新增區間',1)]),('第二個 2 不增加種類',[2,2],[('累計',3)]),('讀入 3 後移除兩個 2',[3],[('新增區間',1),('答案',4)])],
'''a=list(map(int,sys.stdin.buffer.read().split()));n,k=a[:2];a=a[2:];cnt={};l=ans=0
for r,x in enumerate(a):
    cnt[x]=cnt.get(x,0)+1
    while len(cnt)>k:
        y=a[l];cnt[y]-=1;l+=1
        if cnt[y]==0:del cnt[y]
    ans+=r-l+1
print(ans)''',
'''int main(){ios::sync_with_stdio(false);cin.tie(nullptr);int n,k;cin>>n>>k;vector<int>a(n);unordered_map<int,int>c;ll ans=0;int l=0;for(int r=0;r<n;r++){cin>>a[r];c[a[r]]++;while((int)c.size()>k){int x=a[l++];if(--c[x]==0)c.erase(x);}ans+=r-l+1;}cout<<ans<<'\n';}''')
add(577,'strings','後綴自動機的字典序路徑','對相異子字串計數，再跳過整個字典序分支尋找第 k 個。',[
'建立後綴自動機（SAM），每條從初始狀態出發的非空路徑，恰好對應一個相異連續子字串。複製狀態時複製轉移與 suffix link，並重新導向指向舊狀態且代表同一等價類的轉移。所有轉移都增加最長長度，因此轉移圖無環。',
'由最長狀態向短狀態計算 ways[u]=1+Σ ways[v]，其中 1 是在 u 停止的空延伸。從根依字母順序查看轉移，該分支有 ways[v] 個字串；若 k 超過此數便整支略過，否則輸出該字母。進入狀態後先扣掉代表目前字串的 1，再繼續延伸，就能遵守真前綴較小的規則。'],
'SAM 狀態≤2n−1、字母表 26，建構期望 O(n)，本實作用長度排序求 DP，總時間 O(n log n+26n)，空間 O(26n)，含 Python dict 狀態與輸入緩衝。n≤100000。','重複出現的同內容子字串只算一次；每次進入分支先計目前字串，再計延伸。',[
('ab 的不同子字串依序為 a、ab、b',['a','ab','b'],[('k',2)]),('a 分支有兩個字串，選入此分支',['a','ab'],[('分支大小',2)]),('扣掉 a 後繼續到 b，得到 ab',['ab'],[('答案','ab')])],
'''s=sys.stdin.buffer.readline().strip();k=int(sys.stdin.buffer.readline());go=[{}];link=[-1];length=[0];last=0
for c in s:
    cur=len(go);go.append({});link.append(0);length.append(length[last]+1);p=last
    while p>=0 and c not in go[p]:go[p][c]=cur;p=link[p]
    if p>=0:
        q=go[p][c]
        if length[p]+1==length[q]:link[cur]=q
        else:
            clone=len(go);go.append(go[q].copy());length.append(length[p]+1);link.append(link[q])
            while p>=0 and go[p].get(c)==q:go[p][c]=clone;p=link[p]
            link[q]=link[cur]=clone
    last=cur
ways=[1]*len(go)
for u in sorted(range(len(go)),key=length.__getitem__,reverse=True):ways[u]=1+sum(ways[v] for v in go[u].values())
u=0;out=[]
while k:
    for c,v in sorted(go[u].items()):
        if k>ways[v]:k-=ways[v]
        else:out.append(c);k-=1;u=v;break
print(bytes(out).decode())''',
'''struct S{map<char,int>go;int link=-1,len=0;};int main(){ios::sync_with_stdio(false);cin.tie(nullptr);string s;ll k;cin>>s>>k;vector<S>st(1);int last=0;for(char c:s){int cur=st.size();st.push_back(S());st[cur].len=st[last].len+1;int p=last;while(p!=-1&&!st[p].go.count(c)){st[p].go[c]=cur;p=st[p].link;}if(p==-1)st[cur].link=0;else{int q=st[p].go[c];if(st[p].len+1==st[q].len)st[cur].link=q;else{int z=st.size();st.push_back(st[q]);st[z].len=st[p].len+1;while(p!=-1&&st[p].go.count(c)&&st[p].go[c]==q){st[p].go[c]=z;p=st[p].link;}st[q].link=st[cur].link=z;}}last=cur;}vector<int>ord(st.size());iota(ord.begin(),ord.end(),0);sort(ord.begin(),ord.end(),[&](int a,int b){return st[a].len>st[b].len;});vector<ll>w(st.size(),1);for(int u:ord)for(auto[c,v]:st[u].go)w[u]+=w[v];int u=0;string ans;while(k)for(auto[c,v]:st[u].go){if(k>w[v])k-=w[v];else{ans+=c;--k;u=v;break;}}cout<<ans<<'\n';}''',level='hard')
add(579,'number-theory','循環長度的最小公倍數','分解排列循環，以各質因數最高冪次組合最小正回復回合數。',[
'排列的不同循環彼此獨立。長度 L 的循環在且僅在回合數是 L 的倍數時回到原位置，所以所有元素同時復原的最小正回合數就是全部循環長度的 LCM，固定點長度為 1。',
'答案可能遠超 64 位元，不能先存完整 LCM，也不能對已取模的數做 gcd。改用最小質因數篩分解各循環長度，記錄每個質數的最大指數，再將各質數冪相乘並取模。這正是 LCM 的唯一質因數分解。'],
'時間 O(n log log n+n log n)、空間 O(n)，含 Python 排列、最小質因數表與輸入緩衝。n≤200000。','LCM 的質因數指數取最大值，不是相加；全固定點也要輸出 1。',[
('排列循環長度為 2、4',[2,4],[('質數',2)]),('2 的指數分別為 1、2，取最大值',[1,2],[('最大指數',2)]),('LCM=2²=4',[4],[('回合數',4)])],
'''a=list(map(int,sys.stdin.buffer.read().split()));n=a[0];p=[x-1 for x in a[1:]];seen=[False]*n;spf=list(range(n+1))
for i in range(2,math.isqrt(n)+1):
    if spf[i]==i:
        for j in range(i*i,n+1,i):
            if spf[j]==j:spf[j]=i
power={}
for i in range(n):
    if seen[i]:continue
    u=i;z=0
    while not seen[u]:seen[u]=True;z+=1;u=p[u]
    while z>1:
        q=spf[z];e=0
        while z%q==0:e+=1;z//=q
        power[q]=max(power.get(q,0),e)
ans=1
for p,e in power.items():ans=ans*pow(p,e,1000000007)%1000000007
print(ans)'''.replace('a=list','import math\na=list'),
'''int main(){ios::sync_with_stdio(false);cin.tie(nullptr);int n;cin>>n;vector<int>p(n),vis(n),spf(n+1),mx(n+1);for(int&x:p){cin>>x;--x;}iota(spf.begin(),spf.end(),0);for(int i=2;i*i<=n;i++)if(spf[i]==i)for(int j=i*i;j<=n;j+=i)if(spf[j]==j)spf[j]=i;for(int i=0;i<n;i++)if(!vis[i]){int u=i,z=0;while(!vis[u]){vis[u]=1;z++;u=p[u];}while(z>1){int q=spf[z],e=0;while(z%q==0){z/=q;e++;}mx[q]=max(mx[q],e);}}ll ans=1;for(int q=2;q<=n;q++)for(int e=0;e<mx[q];e++)ans=ans*q%MOD;cout<<ans<<'\n';}''')
add(580,'graphs','奇偶狀態 BFS 與離線查詢','求每個查詢指定奇偶性的最短遊走，再以往返邊補足偶數步。',[
'把節點 u 拆成 (u,0)、(u,1)，每走一條邊就翻轉步數奇偶性。從 (a,0) 執行 BFS，可同時求出到每點的最短偶數與奇數遊走長度。一般最短距離不能判斷奇數環允許的繞路，所以必須保留兩種狀態。',
'若同奇偶的最短長度 D≤x，就可在任意一條邊來回走，額外補足 x−D 這個偶數；圖連通且 n≥2，起點也一定有邊可補步。反之，若恰有 x 步路線，其同奇偶最短路必不超過 x。將查詢依起點分組，每個用到的起點只跑一次 BFS，立即填回原輸出位置。'],
'使用 s 個不同起點時 O(s(n+m)+q)，s≤n≤2500、m≤5000、q≤100000；空間 O(n+m+q)，含 Python 分組查詢、輸出與輸入緩衝。','步數是恰好 x，不是至多 x；x=0 只允許原地，不能把未到達的奇偶狀態當可行。',[
('路徑 1–2，從 1 出發',['1:偶0','2:奇1'],[('最短偶數到1',0)]),('往返 1→2→1 補兩步',['1','2','1'],[('步數',2)]),('三步只能到 2，不能到 1',['2:奇1'],[('1→1 三步','NO')])],
'''from collections import deque
it=iter(map(int,sys.stdin.buffer.read().split()));n=next(it);m=next(it);q=next(it);g=[[] for _ in range(n)]
for _ in range(m):
    u=next(it)-1;v=next(it)-1;g[u].append(v);g[v].append(u)
groups={};out=['']*q
for i in range(q):
    a=next(it)-1;b=next(it)-1;x=next(it);groups.setdefault(a,[]).append((b,x,i))
for a,queries in groups.items():
    d=[-1]*(2*n);d[2*a]=0;todo=deque([2*a])
    while todo:
        u=todo.popleft();par=(u&1)^1
        for v in g[u//2]:
            z=2*v+par
            if d[z]<0:d[z]=d[u]+1;todo.append(z)
    for b,x,i in queries:
        z=d[2*b+(x&1)];out[i]='YES' if 0<=z<=x else 'NO'
print('\n'.join(out))''',
'''int main(){ios::sync_with_stdio(false);cin.tie(nullptr);int n,m,q;cin>>n>>m>>q;vector<vector<int>>g(n);for(int i=0,u,v;i<m;i++){cin>>u>>v;--u;--v;g[u].push_back(v);g[v].push_back(u);}vector<vector<tuple<int,ll,int>>>qs(n);for(int i=0,a,b;i<q;i++){ll x;cin>>a>>b>>x;qs[a-1].emplace_back(b-1,x,i);}vector<string>ans(q);for(int a=0;a<n;a++)if(!qs[a].empty()){vector<int>d(2*n,-1),todo{2*a};d[2*a]=0;for(int j=0;j<(int)todo.size();j++){int u=todo[j];for(int v:g[u/2]){int z=2*v+((u&1)^1);if(d[z]<0){d[z]=d[u]+1;todo.push_back(z);}}}for(auto[b,x,i]:qs[a]){int z=d[2*b+(x&1)];ans[i]=(z>=0&&z<=x?"YES":"NO");}}for(auto&s:ans)cout<<s<<'\n';}''',note='最壞需約 n 次雙層 BFS；Python 是否符合一秒限制未驗證。空間透過分組查詢降到線性，不保存 n² 距離矩陣。')
add(581,'basics','位元編碼與 XOR popcount','把最多 30 位字串轉成整數，比較每一對不同輸入記錄。',[
'將位元字串視為整數，兩整數 XOR 的第 j 位恰在原字串第 j 位不同時為 1，因此 XOR 的 popcount 就是漢明距離。枚舉所有 i<j，取最小值；不同筆的內容相同時答案立即是 0。',
'這是精確的二次比較演算法，並非只比較數值排序相鄰者。排序後不相鄰的字串仍可能有更小漢明距離。Python 使用內建 int.bit_count，C++17 使用 __builtin_popcount；答案到 0 可提早停止，因為距離不可能更小。'],
'時間 O(n²+nk)、空間 O(n)，含 Python 整數陣列與輸入行緩衝。n≤20000 時最多 199990000 次比較；Python 的二次迴圈不能保證在題目的 1 秒內完成。','不能用 abs(a−b) 代替漢明距離；不要把一筆資料和自己比較。',[
('兩字串 001、110',[1,6],[('XOR',7)]),('7 的二進位為 111，共三個 1',['111'],[('距離',3)]),('加入第三筆 001，與第一筆距離為零',[1,6,1],[('答案',0)])],
'''n,k=map(int,sys.stdin.buffer.readline().split());a=[int(sys.stdin.buffer.readline(),2) for _ in range(n)]
if len(set(a))<n:print(0)
else:
    ans=k
    for i,x in enumerate(a):
        for j in range(i):ans=min(ans,(x^a[j]).bit_count())
        if ans==1:break
    print(ans)''',
'''int main(){ios::sync_with_stdio(false);cin.tie(nullptr);int n,k;cin>>n>>k;vector<unsigned>a(n);unordered_set<unsigned>seen;bool duplicate=false;for(auto&x:a){string s;cin>>s;x=stoul(s,nullptr,2);if(!seen.insert(x).second)duplicate=true;}if(duplicate){cout<<0<<'\n';return 0;}int ans=k;for(int i=0;i<n;i++){for(int j=0;j<i;j++)ans=min(ans,__builtin_popcount(a[i]^a[j]));if(ans==1)break;}cout<<ans<<'\n';}''',note='精確但 Python 最壞約兩億次比較，屬於時限風險版本；尚未證明能通過一秒限制。C++17 內建 popcount 也需依評測 CPU 實測。')
add(582,'dp','阻擋邊界與區間最大值 DP','找出每座山可到達的連續範圍，按高度遞增計算最長滑翔路線。',[
'對山 i，往左或右第一座高度≥h[i] 的山會阻擋視線，本身也不能抵達。因此所有可直接抵達的山恰好是這兩個阻擋點之間除 i 以外的位置。以單調堆疊在 O(n) 找左右最近的大於等於高度邊界；相等高度必須保留作阻擋。',
'滑翔高度嚴格下降，故狀態圖無環。令 dp[i]=1+max(dp[j])，其中 j 在可達區間內。按高度遞增，用線段樹查區間最大值；同高節點先全部查詢，再一起更新，確保不能經由相等高度跳躍。初始空區間最大值為零。'],
'時間 O(n log n)、空間 O(n)，含 Python 高度、排序索引、邊界、線段樹與輸入緩衝。n≤200000。','只看相鄰較小山會漏掉跨越低山的合法跳躍；相等山不是可跨越的低山。',[
('高度 5、1、4，最低山的 dp=1',[5,1,4],[('dp[1]',1)]),('4 可到 1，dp=2',[5,1,4],[('dp[2]',2)]),('5 可跨過 1 到 4，再到 1',[5,4,1],[('答案',3)])],
'''a=list(map(int,sys.stdin.buffer.read().split()));n=a[0];h=a[1:];left=[0]*n;right=[n]*n;st=[]
for i in range(n):
    while st and h[st[-1]]<h[i]:st.pop()
    left[i]=st[-1]+1 if st else 0;st.append(i)
st=[]
for i in range(n-1,-1,-1):
    while st and h[st[-1]]<h[i]:st.pop()
    right[i]=st[-1] if st else n;st.append(i)
base=1
while base<n:base*=2
tree=[0]*(2*base)
def query(l,r):
    l+=base;r+=base;ans=0
    while l<r:
        if l&1:ans=max(ans,tree[l]);l+=1
        if r&1:r-=1;ans=max(ans,tree[r])
        l//=2;r//=2
    return ans
def update(i,v):
    i+=base;tree[i]=v;i//=2
    while i:tree[i]=max(tree[2*i],tree[2*i+1]);i//=2
order=sorted(range(n),key=h.__getitem__);ans=0;p=0
while p<n:
    q=p
    while q<n and h[order[q]]==h[order[p]]:q+=1
    pending=[(i,1+query(left[i],right[i])) for i in order[p:q]]
    for i,v in pending:update(i,v);ans=max(ans,v)
    p=q
print(ans)''',
'''int main(){ios::sync_with_stdio(false);cin.tie(nullptr);int n;cin>>n;vector<int>h(n),l(n),r(n),s,ord(n);for(int&x:h)cin>>x;for(int i=0;i<n;i++){while(!s.empty()&&h[s.back()]<h[i])s.pop_back();l[i]=s.empty()?0:s.back()+1;s.push_back(i);}s.clear();for(int i=n-1;i>=0;i--){while(!s.empty()&&h[s.back()]<h[i])s.pop_back();r[i]=s.empty()?n:s.back();s.push_back(i);}int b=1;while(b<n)b*=2;vector<int>t(2*b);auto query=[&](int l,int r){int z=0;for(l+=b,r+=b;l<r;l/=2,r/=2){if(l&1)z=max(z,t[l++]);if(r&1)z=max(z,t[--r]);}return z;};auto upd=[&](int i,int v){for(t[i+=b]=v,i/=2;i;i/=2)t[i]=max(t[2*i],t[2*i+1]);};iota(ord.begin(),ord.end(),0);sort(ord.begin(),ord.end(),[&](int a,int b){return h[a]<h[b];});int ans=0;for(int p=0;p<n;){int q=p;while(q<n&&h[ord[q]]==h[ord[p]])q++;vector<pair<int,int>>pending;for(int j=p;j<q;j++){int i=ord[j];pending.push_back({i,1+query(l[i],r[i])});}for(auto[i,v]:pending){upd(i,v);ans=max(ans,v);}p=q;}cout<<ans<<'\n';}''',level='hard')
add(583,'sorting','穩定排序後最大左移距離','不實際執行泡沫排序，以每筆元素需要往左移幾格求回合數。',[
'泡沫排序每回合從左向右掃描，一個元素往右可移很多格，但往左至多一格。將元素依（數值、原位置）穩定排序，若原位置 i、最後位置 j，則至少需要 i−j 回合；所有元素的最大正左移距離就是下界。',
'每一回合會讓尚需左移的元素越過其左邊一個較大的元素；在穩定排序的相對順序中，可用掃描歸納證明最大左移需求每回合減一，直到零。因此該下界也可達成。相等元素保持原相對順序，避免虛構不必要的移動。題目不計額外確認回合。'],
'時間 O(n log n)、空間 O(n)，含 Python (值,原位置) tuple、排序暫存和輸入緩衝。n≤200000。','常見教科書答案會多加一個「沒有交換」的確認回合，本題不能加。',[
('陣列 3、1、2 的原索引為 0、1、2',[3,1,2],[('原索引','0,1,2')]),('穩定排序後索引依序為 1、2、0',[1,2,3],[('左移距離','1,1,-2')]),('最大左移為 1，一回合已排好',[1,2,3],[('答案',1)])],
'''a=list(map(int,sys.stdin.buffer.read().split()))[1:];order=sorted(range(len(a)),key=lambda i:(a[i],i));print(max(i-j for j,i in enumerate(order)))''',
'''int main(){ios::sync_with_stdio(false);cin.tie(nullptr);int n;cin>>n;vector<pair<int,int>>a(n);for(int i=0;i<n;i++){cin>>a[i].first;a[i].second=i;}sort(a.begin(),a.end());int ans=0;for(int j=0;j<n;j++)ans=max(ans,a[j].second-j);cout<<ans<<'\n';}''')
add(584,'number-theory','相異值的首次出現貢獻','把每個值在每個區間的貢獻，唯一歸給區間內最左的該值。',[
'固定位置 i，設相同數值的前一次出現位置為 p（不存在則 p=0，索引從 1 起）。若 i 是區間內第一次出現此值，左端點只能選 p+1 到 i，共 i−p 種；右端點可選 i 到 n，共 n−i+1 種。',
'因此位置 i 貢獻 (i−p)(n−i+1)。任一子陣列的每個相異值都恰有一個最左出現位置，所以這個歸屬不重複也不漏計。用字典維護最近位置，一次掃描就得到所有貢獻總和。'],
'字典期望時間 O(n)、空間 O(n)，含 Python 最近位置表及整份輸入緩衝；n≤200000，C++ 累計需 64 位元。','這題是相異值個數總和，不是只算符合某個相異值上限的區間數。',[
('陣列 7、7，位置 1 前次為 0',[7,7],[('位置1貢獻','(1−0)×2=2')]),('位置 2 前次為 1',[7,7],[('位置2貢獻','(2−1)×1=1')]),('三個非空區間都只有一種值',[1,1,1],[('答案',3)])],
'''a=list(map(int,sys.stdin.buffer.read().split()));n=a[0];last={};ans=0
for i,x in enumerate(a[1:],1):ans+=(i-last.get(x,0))*(n-i+1);last[x]=i
print(ans)''',
'''int main(){ios::sync_with_stdio(false);cin.tie(nullptr);int n;cin>>n;unordered_map<int,int>last;ll ans=0;for(int i=1,x;i<=n;i++){cin>>x;ans+=1LL*(i-last[x])*(n-i+1);last[x]=i;}cout<<ans<<'\n';}''')
add(585,'strings','Booth 雙候選最小循環位移','在加倍字串中排除整段不可能最小的起點，避免建立所有旋轉。',[
'將字串加倍，任何長度 n 的循環位移都可表示成連續子字串。維護兩個候選起點 i、j，以及已相同的長度 k；當 s[i+k]=s[j+k] 就延長比較。若連續 n 個字元都相同，兩候選代表相同旋轉，可停止。',
'若 s[i+k]>s[j+k]，則 i 到 i+k 都不可能是最小起點：對其中偏移 t 的候選，拿 j+t 作比較，會先匹配 k−t 個字元，再在同一對不等字元落敗。故將 i 跳到 i+k+1，並重設 k。另一方向對稱。每次失配淘汰的起點總數覆蓋其比較成本，故為線性時間。'],
'時間 O(n)、空間 O(n)，含 Python 加倍字串、輸出切片與輸入緩衝；n≤1000000。','不可逐一建構 n 個長度 n 的旋轉；全相同字元時要用 k<n 限制比較。',[
('字串 cab，比較起點 0 與 1',['c','a','b'],[('比較','c>a')]),('起點 0 被淘汰，比較 a 與 b',['a','b','c'],[('最佳起點',1)]),('起點 1 的旋轉為 abc',['abc'],[('答案','abc')])],
'''s=sys.stdin.buffer.readline().strip();n=len(s);t=s+s;i=0;j=1;k=0
while i<n and j<n and k<n:
    a=t[i+k];b=t[j+k]
    if a==b:k+=1;continue
    if a>b:
        i+=k+1
        if i==j:i+=1
    else:
        j+=k+1
        if i==j:j+=1
    k=0
p=min(i,j);sys.stdout.buffer.write(t[p:p+n]+b'\n')''',
'''int main(){ios::sync_with_stdio(false);cin.tie(nullptr);string s;cin>>s;int n=s.size(),i=0,j=1,k=0;s+=s;while(i<n&&j<n&&k<n){if(s[i+k]==s[j+k]){k++;continue;}if(s[i+k]>s[j+k]){i+=k+1;if(i==j)i++;}else{j+=k+1;if(i==j)j++;}k=0;}cout<<s.substr(min(i,j),n)<<'\n';}''')
add(586,'data-structures','重量差的後綴係數與區間加值','把未知重量拆成正的相鄰差，判斷所有係數是否同號。',[
'設編號 c 在左堆記 +1、右堆記 −1、未放記 0。重量可寫成 w[c]=δ₁+…+δc，其中所有 δ 都嚴格為正。兩堆重量差因此等於 Σ δj·S[j]，S[j] 是編號≥j 的符號總和。若所有 S≥0 且至少一個正，左堆必重；所有 S≤0 且至少一個負則右堆必重。',
'若 S 同時有正負，可把任一對應的 δ 放大，使重量差呈任一符號，故無法確定。加入編號 c 的硬幣時，S[1..c] 都加上同一個 ±1。使用 lazy 線段樹維護整體最小與最大係數即可判斷；全零也輸出 ?。'],
'時間 O(n log n)、空間 O(n)，含 Python 線段樹最小值、最大值、lazy 陣列與讀入緩衝；n≤200000。','已知的只是嚴格大小順序，不能直接把硬幣編號當作實際重量相加。',[
('先把 1 放左堆，S=[1,0]',['1','0'],[('判定','>')]),('再把 2 放右堆，S=[0,−1]',['0','−1'],[('判定','<')]),('δ₂>0，因此 w₁−w₂=−δ₂',['−δ₂'],[('確定較重','右')])],
'''n=int(sys.stdin.buffer.readline());mn=[0]*(4*n);mx=[0]*(4*n);lazy=[0]*(4*n)
def change(v,l,r,c,d):
    if r<=c:mn[v]+=d;mx[v]+=d;lazy[v]+=d;return
    mid=(l+r)//2
    if lazy[v]:
        z=lazy[v]
        for u in (v*2,v*2+1):mn[u]+=z;mx[u]+=z;lazy[u]+=z
        lazy[v]=0
    change(v*2,l,mid,c,d)
    if c>mid:change(v*2+1,mid+1,r,c,d)
    mn[v]=min(mn[v*2],mn[v*2+1]);mx[v]=max(mx[v*2],mx[v*2+1])
out=[]
for _ in range(n):
    c,s=map(int,sys.stdin.buffer.readline().split());change(1,1,n,c,1 if s==1 else -1)
    out.append('>' if mn[1]>=0 and mx[1]>0 else '<' if mx[1]<=0 and mn[1]<0 else '?')
print('\n'.join(out))''',
'''struct Tree{vector<int>lo,hi,lz;Tree(int n):lo(4*n),hi(4*n),lz(4*n){}void apply(int v,int d){lo[v]+=d;hi[v]+=d;lz[v]+=d;}void add(int v,int l,int r,int c,int d){if(r<=c){apply(v,d);return;}if(lz[v]){apply(2*v,lz[v]);apply(2*v+1,lz[v]);lz[v]=0;}int m=(l+r)/2;add(2*v,l,m,c,d);if(c>m)add(2*v+1,m+1,r,c,d);lo[v]=min(lo[2*v],lo[2*v+1]);hi[v]=max(hi[2*v],hi[2*v+1]);}};int main(){ios::sync_with_stdio(false);cin.tie(nullptr);int n;cin>>n;Tree t(n);for(int i=0,c,s;i<n;i++){cin>>c>>s;t.add(1,1,n,c,s==1?1:-1);cout<<(t.lo[1]>=0&&t.hi[1]>0?'>':t.hi[1]<=0&&t.lo[1]<0?'<':'?')<<'\n';}}''',level='hard')
add(587,'graphs','二元循環空間維度','用生成森林的非樹邊數求所有偶數度數子圖數量。',[
'在每個連通分量選一棵生成樹。任意選取非樹邊之後，由樹的葉子往根處理：若該葉目前度數為奇，就必須選它與父親的樹邊；若為偶，就不能選。如此所有樹邊都被唯一決定，根的度數也因奇度頂點數必為偶而自動為偶。',
'因此每個非樹邊都有獨立二選一自由，且每種選擇恰好對應一個合法子圖。若原圖有 c 個連通分量，生成森林有 n−c 條邊，自由邊共有 m−n+c，答案是 2^(m−n+c)。並查集合併邊時，無法合併的邊恰是增加一個自由度的邊。'],
'時間 O((n+m)α(n)+log m)、空間 O(n)，Python 逐行讀邊，不保留所有邊；n≤100000、m≤200000。','子圖不必連通，空邊集也算一種；不能只數單一環或要求歐拉迴路經過全部頂點。',[
('三角形先加入兩條生成樹邊',['1–2','2–3'],[('自由度',0)]),('第三條邊 1–3 已在同分量',['1–3'],[('自由度',1)]),('可選空集合或完整三角形',['空','三條邊'],[('答案',2)])],
'''n,m=map(int,sys.stdin.buffer.readline().split());p=list(range(n));size=[1]*n;free=0
def find(u):
    while p[u]!=u:p[u]=p[p[u]];u=p[u]
    return u
for _ in range(m):
    u,v=map(int,sys.stdin.buffer.readline().split());u=find(u-1);v=find(v-1)
    if u==v:free+=1
    else:
        if size[u]<size[v]:u,v=v,u
        p[v]=u;size[u]+=size[v]
print(pow(2,free,1000000007))''',
'''int main(){ios::sync_with_stdio(false);cin.tie(nullptr);int n,m;cin>>n>>m;vector<int>p(n),s(n,1);iota(p.begin(),p.end(),0);auto f=[&](int u){while(p[u]!=u){p[u]=p[p[u]];u=p[u];}return u;};ll ans=1;for(int i=0,u,v;i<m;i++){cin>>u>>v;u=f(u-1);v=f(v-1);if(u==v)ans=ans*2%MOD;else{if(s[u]<s[v])swap(u,v);p[v]=u;s[u]+=s[v];}}cout<<ans<<'\n';}''')
add(588,'greedy','強制多數字元與最小可行前綴','每次放入最小可行字母，維持剩餘字串可避免相鄰重複。',[
'長度 R 的多重集合要排成相鄰不同，最大頻率不能超過 ceil(R/2)。如果 R 是奇數且某字母出現 (R+1)/2 次，它必須佔據所有交錯位置，因此下一個字母被強制為它。否則選擇與前一字母不同的最小字母。',
'選定字母後，其剩餘次數至多 floor((R−1)/2)，可避開緊鄰的禁止位置；其他字母皆不超過 ceil((R−1)/2)。這些條件也是帶有指定前一字母的排列存在條件，可用把最大次數字母分隔其餘字母的方式證明。故每一步的貪心都保留至少一個完成方案，最小可行前綴逐步保證整體字典序最小。'],
'字母表固定 26，時間 O(26n)、空間 O(n)，含 Python 輸入、輸出字元列表及 join 緩衝。n≤1000000；Python 一秒時限需實測，不能只憑線性階數保證。','任意用最大堆取得一個合法排列不保證字典序最小；強制字母若等於前字母就無解。',[
('字母 A、B、B，B 出現 2 次為強制字母',['A:1','B:2'],[('首字元','B')]),('剩 A、B，前字元 B，取 A',['B','A'],[('剩餘','B')]),('最後放 B，得到 BAB',['BAB'],[('答案','BAB')])],
'''s=sys.stdin.buffer.readline().strip();cnt=[0]*26
for c in s:cnt[c-65]+=1
out=bytearray();prev=-1;possible=True
for r in range(len(s),0,-1):
    top=max(cnt)
    if top>(r+1)//2:possible=False;break
    if r%2 and top==(r+1)//2:c=cnt.index(top)
    else:c=next((j for j in range(26) if cnt[j] and j!=prev),-1)
    if c<0 or c==prev:possible=False;break
    out.append(c+65);cnt[c]-=1;prev=c
sys.stdout.buffer.write((bytes(out) if possible else b'-1')+b'\n')''',
'''int main(){ios::sync_with_stdio(false);cin.tie(nullptr);string s;cin>>s;array<int,26>cnt{};for(char c:s)cnt[c-'A']++;string ans;int prev=-1;for(int r=s.size();r;r--){int top=*max_element(cnt.begin(),cnt.end()),c=-1;if(top>(r+1)/2){cout<<-1<<'\n';return 0;}if(r%2&&top==(r+1)/2)c=max_element(cnt.begin(),cnt.end())-cnt.begin();else for(int j=0;j<26;j++)if(cnt[j]&&j!=prev){c=j;break;}if(c<0||c==prev){cout<<-1<<'\n';return 0;}ans+=char('A'+c);cnt[c]--;prev=c;}cout<<ans<<'\n';}''',level='hard',note='實作使用固定 26 字母掃描；Python 最長百萬字元的時間限制尚待實測，不宣稱一秒內完成。')
add(589,'strings','Burrows–Wheeler 逆轉換的 LF 映射','用同字元出現順位建立最後欄與第一欄的對應，線性還原字串。',[
'排序旋轉矩陣的第一欄 F 就是最後欄 L 字元排序後的結果。同一字元在 L 的第 r 次出現，對應 F 中該字元的第 r 次出現；這個穩定對應 LF 會從某個旋轉列移到把最後一字元搬到開頭的旋轉列。以各字元累計數即可建立，不需要真的建旋轉矩陣。',
'L 中 # 所在列恰好是原字串加 # 的那一列。反覆讀 L[row] 並令 row=LF[row]，會按倒序讀回原字串（第一個 # 略過）。遍歷完整長度後反轉即可。唯一的 # 保證循環有可識別的起點，題目也保證輸入是有效轉換結果。'],
'字母表 27，時間 O(n+27)、空間 O(n)，含 Python LF 整數陣列、輸入 bytes、輸出 bytearray 及反轉緩衝。n≤1000000。','LF 是穩定順位對應，不能只記每個字母最後出現位置；輸出不包含 #。',[
('原字串 ab 的排序旋轉為 #ab、ab#、b#a',['#ab','ab#','b#a'],[('L','b#a')]),('L 中 # 的列為 1，先略過 #',['L[1]=#','LF[1]=0'],[('row',0)]),('依序讀到 b、a，反轉為 ab',['b','a'],[('答案','ab')])],
'''s=sys.stdin.buffer.readline().strip();n=len(s);cnt=[0]*256
for c in s:cnt[c]+=1
start=[0]*256;total=0
for c in range(256):start[c]=total;total+=cnt[c]
seen=[0]*256;lf=[0]*n
for i,c in enumerate(s):lf[i]=start[c]+seen[c];seen[c]+=1
row=s.index(b'#');out=bytearray()
for _ in range(n):
    c=s[row]
    if c!=35:out.append(c)
    row=lf[row]
out.reverse();sys.stdout.buffer.write(out+b'\n')''',
'''int main(){ios::sync_with_stdio(false);cin.tie(nullptr);string s;cin>>s;int n=s.size();array<int,256>cnt{},start{},seen{};for(unsigned char c:s)cnt[c]++;for(int c=1;c<256;c++)start[c]=start[c-1]+cnt[c-1];vector<int>lf(n);for(int i=0;i<n;i++){unsigned char c=s[i];lf[i]=start[c]+seen[c]++;}int row=s.find('#');string ans;for(int i=0;i<n;i++){char c=s[row];if(c!='#')ans+=c;row=lf[row];}reverse(ans.begin(),ans.end());cout<<ans<<'\n';}''',level='hard')
add(593,'number-theory','質因數獨立與二狀態矩陣冪','將相鄰 LCM 限制分解成各質因數的指數條件，用快速冪處理十億長度。',[
'若 k 含質因數 p^e，陣列每個元素對此質因數的指數必在 0..e，且相鄰兩指數的最大值必為 e。不同質因數的指數選擇彼此獨立，因此各質因數合法序列數相乘即是答案。k=1 時每個元素都只能是 1。',
'把指數分成「小於 e」和「等於 e」兩類，前者有 e 種選擇。若前綴計數為 (L,H)，加一位後變成 (eH,L+H)，初值為 (e,1)。用矩陣 [[0,e],[1,1]] 的 n−1 次方求結果，避免按長度逐位 DP。試除只需檢查到剩餘 k 的平方根。'],
'每筆試除 O(√k)，每個不同質因數用 O(log n) 矩陣冪；空間 O(1)，另有 Python t 筆輸入輸出緩衝。t≤1000、k≤10^9、n≤10^9；最壞試除常數需注意。','較小指數類有 e 種，不是 e+1 種；兩個較小指數不能相鄰。',[
('k=2，e=1，長度 1 的兩類計數為 1、1',[1,1],[('長度',1)]),('長度 2 變為 1、2',[1,2],[('合計',3)]),('長度 3 變為 2、3',[2,3],[('答案',5)])],
'''P=1000000007
def mul(a,b):
    return ((a[0]*b[0]+a[1]*b[2])%P,(a[0]*b[1]+a[1]*b[3])%P,(a[2]*b[0]+a[3]*b[2])%P,(a[2]*b[1]+a[3]*b[3])%P)
def ways(n,e):
    a=(0,e,1,1);r=(1,0,0,1);z=n-1
    while z:
        if z&1:r=mul(r,a)
        a=mul(a,a);z//=2
    return (r[0]*e+r[1]+r[2]*e+r[3])%P
it=iter(map(int,sys.stdin.buffer.read().split()));t=next(it);out=[]
for _ in range(t):
    n=next(it);k=next(it);ans=1;p=2
    while p*p<=k:
        e=0
        while k%p==0:e+=1;k//=p
        if e:ans=ans*ways(n,e)%P
        p+=1 if p==2 else 2
    if k>1:ans=ans*ways(n,1)%P
    out.append(str(ans))
print('\n'.join(out))''',
'''using M=array<ll,4>;M mul(M a,M b){return {(a[0]*b[0]+a[1]*b[2])%MOD,(a[0]*b[1]+a[1]*b[3])%MOD,(a[2]*b[0]+a[3]*b[2])%MOD,(a[2]*b[1]+a[3]*b[3])%MOD};}ll ways(ll n,int e){M a{0,e,1,1},r{1,0,0,1};for(--n;n;n/=2,a=mul(a,a))if(n&1)r=mul(r,a);return (r[0]*e+r[1]+r[2]*e+r[3])%MOD;}int main(){ios::sync_with_stdio(false);cin.tie(nullptr);int t;cin>>t;while(t--){ll n,k;cin>>n>>k;ll ans=1;for(ll p=2;p*p<=k;p+=(p==2?1:2)){int e=0;while(k%p==0){e++;k/=p;}if(e)ans=ans*ways(n,e)%MOD;}if(k>1)ans=ans*ways(n,1)%MOD;cout<<ans<<'\n';}}''',level='hard')
add(594,'dp','不重複視窗與 DP 前綴和','對每個前綴，累加最後一段所有合法起點對應的分割數。',[
'令 dp[i] 為前 i 項合法分割數，dp[0]=1。若以第 i 項結尾的最長不重複區段從 l 開始，最後一段可從 l 到 i 任選，因此 dp[i]=Σ dp[j]，j=l−1..i−1。最近出現位置表讓 l=max(l,last[x]+1)，確保視窗內互異。',
'再以 prefix[i]=dp[0]+…+dp[i] 把區間和轉成兩個前綴和相減，每項 O(1)。每個完整分割都有唯一的最後切點，所以這個轉移恰好計數一次。相同值可以出現在不同段，不應要求整體陣列互異。'],
'字典期望時間 O(n)、空間 O(n)，含 Python 前綴和、最近位置表與輸入緩衝；n≤200000。','dp[0]=1 是接上第一段的方法，漏掉它會使全部答案變零；取模相減需避免負值。',[
('陣列 1、1，dp[0]=1',[1],[('dp[1]',1)]),('第二個 1 使最後段只能單獨一項',[1,1],[('l',2)]),('唯一分割是 [1]|[1]',['[1]','[1]'],[('dp[2]',1)])],
'''a=list(map(int,sys.stdin.buffer.read().split()))[1:];P=1000000007;last={};l=1;prefix=[1];dp=1
for i,x in enumerate(a,1):
    l=max(l,last.get(x,0)+1);last[x]=i
    dp=(prefix[-1]-(prefix[l-2] if l>=2 else 0))%P
    prefix.append((prefix[-1]+dp)%P)
print(dp)''',
'''int main(){ios::sync_with_stdio(false);cin.tie(nullptr);int n;cin>>n;vector<ll>pre(n+1);pre[0]=1;unordered_map<int,int>last;int l=1;ll dp=1;for(int i=1,x;i<=n;i++){cin>>x;l=max(l,last[x]+1);last[x]=i;dp=(pre[i-1]-(l>=2?pre[l-2]:0)+MOD)%MOD;pre[i]=(pre[i-1]+dp)%MOD;}cout<<dp<<'\n';}''')
add(595,'greedy','兩列前綴餘額與垂直抵銷','由左向右傳遞多餘硬幣，優先抵銷同欄兩列相反的供需。',[
'每列維護已處理前綴的餘額：硬幣總數減去已處理格數。加入本欄後若兩列餘額一正一負，可在本欄垂直移動 min(|上餘額|,|下餘額|) 枚，使兩者盡量抵銷，並將每枚一格的垂直成本加入。剩餘餘額需要穿過本欄與下一欄的水平切口，成本為兩列餘額絕對值之和。',
'相反方向的水平流可以在同欄改走垂直邊而抵銷，成本不會增加；把這次必要的垂直交換提前，還能減少日後跨越切口的流量。反覆使用這個交換論證，可得到一個最優解符合上述貪心。最後總餘額為零，兩列再抵銷後皆零，不會為不存在的最右邊界計入成本。'],
'時間 O(n)、空間 O(n)，含 Python 兩列陣列和整份輸入緩衝；n≤100000、總硬幣 2n，成本以 64 位元儲存。','各格目標是一枚，要先扣 1；只算整欄總餘額會漏掉上下搬運成本。',[
('寬度 2，上列 2、0，下列 0、2',[2,0,0,2],[('第一欄餘額','上1，下−1')]),('第一欄垂直搬一枚，餘額歸零',[1,1],[('成本',1)]),('第二欄反向搬一枚，全部完成',[1,1,1,1],[('最少操作',2)])],
'''a=list(map(int,sys.stdin.buffer.read().split()));n=a[0];top=a[1:n+1];bottom=a[n+1:];x=y=ans=0
for u,v in zip(top,bottom):
    x+=u-1;y+=v-1
    if x*y<0:
        z=min(abs(x),abs(y));ans+=z
        if x>0:x-=z;y+=z
        else:x+=z;y-=z
    ans+=abs(x)+abs(y)
print(ans)''',
'''int main(){ios::sync_with_stdio(false);cin.tie(nullptr);int n;cin>>n;vector<int>a(n),b(n);for(int&v:a)cin>>v;for(int&v:b)cin>>v;ll x=0,y=0,ans=0;for(int i=0;i<n;i++){x+=a[i]-1;y+=b[i]-1;if((x>0&&y<0)||(x<0&&y>0)){ll z=min(abs(x),abs(y));ans+=z;if(x>0){x-=z;y+=z;}else{x+=z;y-=z;}}ans+=abs(x)+abs(y);}cout<<ans<<'\n';}''',level='hard')
add(596,'dp','倍增子序列與重複扣除','記錄每個字母前一次出現前的總數，避免同內容子序列重複計算。',[
'令 total 包含空字串，初值為 1。加入新字元 c 時，舊有每個子序列都可選擇不加 c 或在末尾加 c，初步得到 2·total 種。若 c 曾出現，會重複生成那些在前一次 c 之前形成、再接上 c 的字串。',
'令 last[c] 保存處理前一次 c 之前的 total，本次新總數為 2·total−last[c]，再把舊 total 存入 last[c]。每個重複字串必定以 c 結尾，且刪掉尾 c 後唯一對應前一次出現之前的子序列，故扣除不多不少。最後扣掉唯一空字串。'],
'時間 O(n)、DP 空間 O(26)，Python 輸入字串緩衝 O(n)；n≤500000，所有運算模 1000000007。','題目不計空字串，最後要減一；更新 last 前必須保留舊 total。',[
('開始只有空字串',['ε'],[('total',1)]),('加入 a 得空字串與 a',['ε','a'],[('total',2)]),('再加 a，扣掉重複的 a',['ε','a','aa'],[('total',3),('非空答案',2)])],
'''s=sys.stdin.buffer.readline().strip();last=[0]*26;total=1;P=1000000007
for c in s:
    i=c-97;old=total;total=(2*total-last[i])%P;last[i]=old
print((total-1)%P)''',
'''int main(){ios::sync_with_stdio(false);cin.tie(nullptr);string s;cin>>s;array<ll,26>last{};ll total=1;for(char c:s){ll old=total;total=(2*total-last[c-'a']+MOD)%MOD;last[c-'a']=old;}cout<<(total-1+MOD)%MOD<<'\n';}''')
add(597,'dp','L1 等序迴歸的最大堆','允許加減元素，以最大堆維護最小絕對偏差成本。',[
'對前綴的最優成本函數，加入數值 x 會加入 |y−x| 這個折線。要求最後值不小於前面，相當於把前綴成本函數在 y 以下取最小值；可用 slope trick 把向上的折點存在最大堆。每加入 x 先放入堆，若最大折點大於 x，就把該折點降到 x，增加差額成本。',
'等價實作是每次放入兩個 x，再刪掉堆中最大值，成本增加「被刪最大值−x」；堆只保存下半部折點。較大的歷史值與現在較小的值形成衝突，L1 成本在兩者間為常數，所以修正其中一個折點即可維持所有最佳解的成本資訊。這比只把後項增加到前項更好，因為本題也允許降低前項。'],
'時間 O(n log n)、空間 O(n)，含 Python 負值最大堆與輸入緩衝；n≤200000、x≤10^9，C++ 總成本需 64 位元。','本題可以加也可以減，不能直接使用只允許增加的 Increasing Array 解法。',[
('讀入 5，堆為 [5]',[5],[('成本',0)]),('讀入 1，衝突差額 5−1=4，堆為 [1,1]',[1,1],[('成本',4)]),('讀入 3，無新衝突，[1,1,3] 可行',[1,1,3],[('答案',4)])],
'''import heapq
it=iter(map(int,sys.stdin.buffer.read().split()));n=next(it);h=[];ans=0
for x in it:
    heapq.heappush(h,-x)
    if -h[0]>x:ans+=-heapq.heapreplace(h,-x)-x
print(ans)''',
'''int main(){ios::sync_with_stdio(false);cin.tie(nullptr);int n;cin>>n;priority_queue<ll>q;ll ans=0;for(int i=0;i<n;i++){ll x;cin>>x;q.push(x);if(q.top()>x){ans+=q.top()-x;q.pop();q.push(x);}}cout<<ans<<'\n';}''',level='hard')
add(598,'greedy','從最小值向兩端移除','利用金字塔最小元素必在端點的性質，累加最便宜的相鄰交換。',[
'嚴格先增後減的陣列，其最小值必定在某一端。因此從小到大處理數值，對目前最小的尚未處理元素，只需考慮將它移到剩餘陣列左端或右端。若左右各有 L、R 個尚存元素，兩種移動分別需要 L、R 次相鄰交換。',
'固定此元素到任一端後，其餘元素的相對順序不變，仍需解相同子問題；兩個選項留下完全相同的剩餘序列，所以獨立選 min(L,R) 最優。以 Fenwick 樹維護各原位置是否仍存在，按數值排序後求左側存活數、右側存活數，再刪除此位置。'],
'時間 O(n log n)、空間 O(n)，含 Python 排序索引、Fenwick 樹與輸入緩衝；n≤200000、數值互異，交換數用 64 位元。','不能把排序成遞增所需的逆序數當答案；峰值可在任意位置，包括兩端。',[
('陣列 3、1、2，最小值 1 的左右各一個',[3,1,2],[('本次成本',1)]),('把 1 移到左端，剩下 3、2',[1,3,2],[('累計',1)]),('剩下序列已遞減，直接形成金字塔',[1,3,2],[('答案',1)])],
'''a=list(map(int,sys.stdin.buffer.read().split()))[1:];n=len(a);bit=[0]+[i&-i for i in range(1,n+1)]
def pref(i):
    s=0
    while i:s+=bit[i];i-=i&-i
    return s
ans=0;remain=n
for i in sorted(range(n),key=a.__getitem__):
    left=pref(i);ans+=min(left,remain-left-1);remain-=1;j=i+1
    while j<=n:bit[j]-=1;j+=j&-j
print(ans)''',
'''int main(){ios::sync_with_stdio(false);cin.tie(nullptr);int n;cin>>n;vector<pair<int,int>>a(n);vector<int>b(n+1);for(int i=0;i<n;i++){cin>>a[i].first;a[i].second=i+1;}for(int i=1;i<=n;i++)b[i]=i&-i;auto sum=[&](int i){int s=0;for(;i;i-=i&-i)s+=b[i];return s;};sort(a.begin(),a.end());ll ans=0;int rem=n;for(auto[x,i]:a){int l=sum(i-1);ans+=min(l,rem-l-1);rem--;for(int j=i;j<=n;j+=j&-j)b[j]--;}cout<<ans<<'\n';}''')
add(599,'strings','字母頻率前綴差向量','把所有字母次數相等，轉成兩個前綴的標準化向量相同。',[
'先取原字串實際出現的 k 種字母，選其中一種作基準。每個前綴記錄其餘 k−1 種字母次數減去基準次數的向量。區間內所有 k 種字母次數相同，恰好等價於右前綴向量減左前綴向量為零。',
'因此以字典統計各向量出現次數，讀到一個向量時，其先前出現幾次就新增幾個合法非空區間，再增加頻率。空前綴向量要先記一次，才能計到從第一個字元開始的區間。若 k=1，所有向量都是空 tuple，答案自然是 n(n+1)/2。'],
'時間期望 O(kn)、空間 O(kn)，k≤26、n≤200000；Python tuple 鍵與整數物件常數大，另有 O(n) 輸入緩衝。C++ map 比較保守 O(kn log n)。','必須包含原字串中每一種字元，不能只要求該子字串自己出現的種類次數相等。',[
('字串 ab，空前綴差值為 0',[0],[('頻率[0]',1)]),('讀 a，差值 a−b=1',[1],[('新增',0)]),('讀 b，差值回 0，區間 ab 合法',[0],[('答案',1)])],
'''s=sys.stdin.buffer.readline().strip();alphabet=sorted(set(s));idx={c:i for i,c in enumerate(alphabet)};k=len(alphabet);cnt=[0]*k;seen={(0,)*(k-1):1};ans=0
for c in s:
    cnt[idx[c]]+=1;key=tuple(cnt[i]-cnt[0] for i in range(1,k));ans+=seen.get(key,0);seen[key]=seen.get(key,0)+1
print(ans)''',
'''int main(){ios::sync_with_stdio(false);cin.tie(nullptr);string s;cin>>s;set<char>letters(s.begin(),s.end());map<char,int>id;for(char c:letters){int z=id.size();id[c]=z;}vector<int>cnt(id.size()),key(id.size()-1);map<vector<int>,ll>seen;seen[key]=1;ll ans=0;for(char c:s){cnt[id[c]]++;for(int i=1;i<(int)cnt.size();i++)key[i-1]=cnt[i]-cnt[0];ans+=seen[key]++;}cout<<ans<<'\n';}''',level='hard',note='Python 儲存最多 n 個 25 維 tuple，雖為 O(kn)，實際記憶體可能接近限制；尚未量測 n=200000、k=26 的最壞資料。')
add(600,'number-theory','Mex 方格的 XOR 結構','證明零基座標的 XOR 滿足列與欄的 mex 定義。',[
'把列欄改成零基座標 a=y−1、b=x−1，候選值為 a XOR b。它不可能出現在同列左側，因為 a XOR b′=a XOR b 會推出 b′=b；同欄上方同理。因此候選值確實尚未被排除。',
'對任意 z<a XOR b，取 z 與 a XOR b 最高不同位。候選在該位為 1、z 為 0，故 a、b 在該位不同。若 a 此位為 1，令 a′=z XOR b，則 a′<a，z 已在同欄上方；若 b 此位為 1，令 b′=z XOR a，則 b′<b，z 已在同列左方。所有更小非負值都已出現，所以 XOR 正是 mex。'],
'固定 32/64 位元模型時間 O(1)、空間 O(1)，Python 僅讀兩個整數的常數緩衝；y,x≤10^9。','輸入是一基座標，必須先各減 1 才 XOR；不是 y XOR x。',[
('查詢 y=2、x=3，改為零基 1、2',[1,2],[('座標','(1,2)')]),('二進位 01 XOR 10 = 11',['01','10','11'],[('候選',3)]),('上方有 2，左方有 1、0，因此 mex=3',[2,1,0],[('答案',3)])],
'''y,x=map(int,sys.stdin.buffer.read().split());print((y-1)^(x-1))''',
'''int main(){ll y,x;cin>>y>>x;cout<<((y-1)^(x-1))<<'\n';}''',level='easy')
add(601,'number-theory','折返週期與模數剩餘類計數','以兩維折返週期的 LCM 求回返步數，並精確計數不同格子。',[
'令 a=n−1、b=m−1，零基座標每一維都是週期 2a、2b 的三角波。第一次同時回到零需要 T=lcm(2a,2b)=2ab/g 步，其中 g=gcd(a,b)。不同步數可能落同一格，不能直接把週期當成不同格子數。',
'格子 (r,c) 可達當且僅當 r≡c 或 r≡−c（mod 2g），這來自三角波反折前的兩種同餘與中國剩餘定理。令 A=a/g、B=b/g。對剩餘類配對 {s,2g−s}，1≤s<g，兩軸各有 A、B 個座標，合計 (g−1)AB；類 0 有 (⌊A/2⌋+1)(⌊B/2⌋+1) 格；類 g 有 ⌈A/2⌉⌈B/2⌉ 格。三部分相加即不同格數，包含起始點且沒有重複。'],
'每筆時間 O(log min(n,m))、空間 O(1)，另有 Python t≤1000 筆輸出緩衝；n,m≤10^9，週期及計數需 64 位元。','第一次返回起點不一定代表每個週期步數都在不同格子；要分開計算步數與不同格數。',[
('n=3、m=5，a=2、b=4、g=2',[2,4,2],[('A,B','1,2')]),('週期為 2×2×4/2=8',[8],[('首次回返',8)]),('不同格數=1×1×2+1×2+1×1=5',[2,2,1],[('格數',5)])],
'''import math
it=iter(map(int,sys.stdin.buffer.read().split()));t=next(it);out=[]
for _ in range(t):
    a=next(it)-1;b=next(it)-1;g=math.gcd(a,b);A=a//g;B=b//g
    cells=(g-1)*A*B+(A//2+1)*(B//2+1)+((A+1)//2)*((B+1)//2)
    out.append(f'{2*a*b//g} {cells}')
print('\n'.join(out))''',
'''int main(){ios::sync_with_stdio(false);cin.tie(nullptr);int t;cin>>t;while(t--){ll a,b;cin>>a>>b;--a;--b;ll g=gcd(a,b),A=a/g,B=b/g;ll cells=(g-1)*A*B+(A/2+1)*(B/2+1)+((A+1)/2)*((B+1)/2);cout<<2*a*b/g<<' '<<cells<<'\n';}}''',level='hard')
add(602,'number-theory','三角波位置與反彈容斥','直接求任意大步數的位置，並以邊界時刻聯集計數反彈。',[
'一維寬度 a=n−1 時，令 r=k mod 2a，零基位置就是 min(r,2a−r)；另一維使用 b=m−1。這把來回反彈展開成直線後再折回，不需要逐步模擬，即使 k 達 10^18 也可直接求位置。',
'上下反彈發生在正倍數 a 的步數，共 floor(k/a) 次；左右同理。角落同時屬於兩種事件，題目只算一次方向改變，故用容斥扣掉 floor(k/lcm(a,b))。第 k 步到邊界時除法會包含它；步數零自然得到零次反彈。'],
'每筆時間 O(log min(n,m))、空間 O(1)，含 Python t≤1000 筆輸出緩衝；LCM 與 k≤10^18，C++ 使用 64 位元。','角落同時反轉兩個方向只計一次；出發時不計反彈，輸出座標須加回 1。',[
('3×4 方格，a=2、b=3，k=6',[2,3,6],[('LCM',6)]),('三角波兩維都回到 0，實際位置 (1,1)',['1','1'],[('列,欄','1,1')]),('上下 3 次、左右 2 次、角落重複 1 次',[3,2,1],[('反彈','3+2−1=4')])],
'''import math
it=iter(map(int,sys.stdin.buffer.read().split()));t=next(it);out=[]
for _ in range(t):
    a=next(it)-1;b=next(it)-1;k=next(it);r=k%(2*a);c=k%(2*b);l=a//math.gcd(a,b)*b
    out.append(f'{min(r,2*a-r)+1} {min(c,2*b-c)+1} {k//a+k//b-k//l}')
print('\n'.join(out))''',
'''int main(){ios::sync_with_stdio(false);cin.tie(nullptr);int t;cin>>t;while(t--){ll a,b,k;cin>>a>>b>>k;--a;--b;ll r=k%(2*a),c=k%(2*b),l=a/gcd(a,b)*b;cout<<min(r,2*a-r)+1<<' '<<min(c,2*b-c)+1<<' '<<k/a+k/b-k/l<<'\n';}}''')
add(603,'dp','逆排列下降數與 Eulerian 數','將收集回合數化成位置排列的下降數，滾動計算完整分布。',[
'令 pos[v] 表示數字 v 的位置。如果 pos[v+1]<pos[v]，就必須開啟新一輪從左端掃描；反之同一回合可以接著收集。因此回合數等於逆排列 pos 的下降數加一。取逆是排列間的雙射，所以分布就是 Eulerian 數。',
'令 E(i,d) 為 i 個數有 d 個下降的排列數。插入最大數 i 時，放入 d+1 個不增加下降的位置，或從原本 d−1 個下降的排列中放入 i−d 個增加下降的位置，得到 E(i,d)=(d+1)E(i−1,d)+(i−d)E(i−1,d−1)。初始 E(1,0)=1，逐列滾動，輸出 d=0..n−1。'],
'時間 O(n²)、空間 O(n)，含 Python 當前與下一列、最終輸出字串緩衝；n≤5000，約 1250 萬狀態更新。Python 一秒限制無實測保證。','收集的是依數字遞增順序，不是直接數原陣列的下降；雖然總分布相同，單個排列的回合數未必相同。',[
('n=1，只有一回合',[1],[('分布','1')]),('n=2，分布為 1、1',[1,1],[('總數',2)]),('n=3，遞推得 1、4、1',[1,4,1],[('總數',6)])],
'''n=int(sys.stdin.buffer.readline());P=1000000007;dp=[1]
for i in range(2,n+1):
    old=dp;dp=[0]*i
    for d in range(i):dp[d]=((d+1)*(old[d] if d<i-1 else 0)+(i-d)*(old[d-1] if d else 0))%P
print('\n'.join(map(str,dp)))''',
'''int main(){int n;cin>>n;vector<ll>d(1,1);for(int i=2;i<=n;i++){vector<ll>e(i);for(int j=0;j<i;j++)e[j]=((j+1)*(j<i-1?d[j]:0)+(i-j)*(j?d[j-1]:0))%MOD;d.swap(e);}for(ll x:d)cout<<x<<'\n';}''',note='O(n²) 與完整 5000 範圍相容，但 Python 的約 1250 萬次模數更新是否符合一秒需依執行環境實測。')
add(604,'dp','開放團隊數與累積技能差','排序技能後按相鄰差值累加所有尚未封閉團隊的懲罰。',[
'依技能排序，團隊懲罰 max−min 可看成從最小成員到最大成員之間，每一段相鄰技能差的總和。若現在有 j 個已開始但尚未封閉的團隊，跨越下一段技能差 Δ 時，成本增加 jΔ。令 dp[j][c] 表示已處理前綴、開放 j 團且累積成本 c 的方法數。',
'加入下一人後，可單人成團或加入一個開放團隊但保持開放，共 j+1 種、j 不變；可新開一團，j 加一；可加入並封閉某個開放團隊，共 j 種、j 減一。依成員最小與最大位置，每個團隊都有唯一的開閉時刻，故不會因團隊無序而重複計數。最後只累加 j=0、c≤x 的狀態。另若 x 已大到涵蓋任意分組，直接用 Bell 數：最高可能總懲罰為最大 floor(n/2) 項總和減最小 floor(n/2) 項總和。'],
'一般時間 O(n²x)、空間 O(nx)，含 Python 二維 DP、輸入與輸出緩衝；n≤100、x≤5000、技能≤100。全涵蓋捷徑為 O(n²)。Python 最壞情況不保證一秒。','相同技能仍是不同的人，加入 j 個開放團隊有 j 種選擇；結尾尚未封閉的團隊不能算答案。',[
('技能 0、1，處理第一人，可單獨完成或開團',['j0:1','j1:1'],[('成本',0)]),('跨越差 1，開團狀態成本增加 1',['j0:c0','j1:c1'],[('差值',1)]),('預算 1，兩人各自成團或同團都合法',['{0}|{1}','{0,1}'],[('答案',2)])],
'''a=list(map(int,sys.stdin.buffer.read().split()));n,x=a[:2];a=sorted(a[2:]);P=1000000007
bound=sum(a[n-n//2:])-sum(a[:n//2])
if x>=bound:
    row=[1]
    for i in range(1,n+1):
        new=[0]*(i+1)
        for j in range(1,i+1):new[j]=((row[j] if j<len(row) else 0)*j+row[j-1])%P
        row=new
    print(sum(row)%P)
else:
    dp=[[0]*(x+1)];dp[0][0]=1;prev=a[0]
    for i,v in enumerate(a):
        delta=v-prev;prev=v;limit=min(i+1,n-i-1);nd=[[0]*(x+1) for _ in range(limit+1)]
        for j,row in enumerate(dp):
            shift=j*delta
            if shift>x:continue
            for c in range(x-shift+1):
                z=row[c]
                if not z:continue
                cost=c+shift
                if j<=limit:nd[j][cost]=(nd[j][cost]+z*(j+1))%P
                if j+1<=limit:nd[j+1][cost]=(nd[j+1][cost]+z)%P
                if j:nd[j-1][cost]=(nd[j-1][cost]+z*j)%P
        dp=nd
    print(sum(dp[0])%P)''',
'''int main(){ios::sync_with_stdio(false);cin.tie(nullptr);int n,x;cin>>n>>x;vector<int>a(n);for(int&v:a)cin>>v;sort(a.begin(),a.end());int bound=0;for(int i=0;i<n/2;i++)bound+=a[n-1-i]-a[i];if(x>=bound){vector<ll>s(n+1);s[0]=1;for(int i=1;i<=n;i++){for(int j=i;j>=1;j--)s[j]=(s[j]*j+s[j-1])%MOD;s[0]=0;}ll ans=0;for(ll z:s)ans=(ans+z)%MOD;cout<<ans<<'\n';return 0;}vector<vector<ll>>d(1,vector<ll>(x+1));d[0][0]=1;int prev=a[0];for(int i=0;i<n;i++){int delta=a[i]-prev;prev=a[i];int lim=min(i+1,n-i-1);vector<vector<ll>>e(lim+1,vector<ll>(x+1));for(int j=0;j<(int)d.size();j++)for(int c=0;c+j*delta<=x;c++){ll z=d[j][c];if(!z)continue;int v=c+j*delta;if(j<=lim)e[j][v]=(e[j][v]+z*(j+1))%MOD;if(j+1<=lim)e[j+1][v]=(e[j+1][v]+z)%MOD;if(j)e[j-1][v]=(e[j-1][v]+z*j)%MOD;}d.swap(e);}ll ans=0;for(ll z:d[0])ans=(ans+z)%MOD;cout<<ans<<'\n';}''',level='hard',note='未宣稱 Python 的一般 O(n²x) 實作符合一秒；全涵蓋時以 Bell 數捷徑避免無謂的成本維度。')
add(605,'search','相鄰交換排列的雙向 BFS','以全部九個數字的排列為狀態，從起點和目標同時搜尋最少交換。',[
'一個狀態是列優先的九字元排列，共至多 9!=362880 種。方格有 12 組水平或垂直相鄰位置，每一組交換形成一條無向、成本 1 的狀態邊。目標是 123456789，因此 BFS 的層數就是最少交換次數。',
'為減少展開，從輸入與目標各維護一個完整 BFS 前緣，每回合擴展較小的一側。每次只擴展整個同深度層，遇到另一側已訪問狀態時，兩邊距離相加就是最短路；此前兩個已搜尋的距離球沒有交集，所以不存在更短的未發現路徑。普通滑塊遊戲只許與空格交換，本題沒有空格且任意相鄰數字都能交換。'],
'最壞 O(12·9!) 時間、O(9!·9) 狀態字串空間，另有 Python 字典與集合負擔。固定 3×3，雙向 BFS 常減少實際狀態，但 Python 一秒仍需量測。','這不是八數碼空格滑塊題，不可使用奇偶無解判定；任意排列皆可藉相鄰交換完成。',[
('起始排列 213456789，與目標只差首兩格',['213','456','789'],[('已走',0)]),('交換水平相鄰的首兩格',['123','456','789'],[('成本',1)]),('與目標前緣相遇，合計 1+0',[1,0],[('答案',1)])],
'''start=b''.join(sys.stdin.buffer.read().split());target=b'123456789'
edges=[(i,i+1) for i in range(9) if i%3<2]+[(i,i+3) for i in range(6)]
def solve():
    if start==target:return 0
    front={start};back={target};da={start:0};db={target:0}
    while front:
        if len(front)>len(back):front,back=back,front;da,db=db,da
        nxt=set()
        for s in front:
            d=da[s]+1
            for i,j in edges:
                a=bytearray(s);a[i],a[j]=a[j],a[i];v=bytes(a)
                if v in da:continue
                if v in db:return d+db[v]
                da[v]=d;nxt.add(v)
        front=nxt
print(solve())''',
'''int main(){ios::sync_with_stdio(false);cin.tie(nullptr);string start;for(int i=0,x;i<9;i++){cin>>x;start+=char('0'+x);}string goal="123456789";if(start==goal){cout<<0<<'\n';return 0;}vector<pair<int,int>>edges;for(int i=0;i<9;i++){if(i%3<2)edges.push_back({i,i+1});if(i<6)edges.push_back({i,i+3});}unordered_set<string>a{start},b{goal};unordered_map<string,int>da{{start,0}},db{{goal,0}};while(!a.empty()){if(a.size()>b.size()){swap(a,b);swap(da,db);}unordered_set<string>next;for(auto s:a){int d=da[s]+1;for(auto[i,j]:edges){swap(s[i],s[j]);if(!da.count(s)){if(db.count(s)){cout<<d+db[s]<<'\n';return 0;}da[s]=d;next.insert(s);}swap(s[i],s[j]);}}a.swap(next);}}''',level='hard',note='雙向 BFS 保證最短交換，但一秒時限及 Python 的全狀態記憶體負擔尚未以最壞排列量測。')
add(606,'search','乘法表排名計數與答案二分','計算不大於候選值的格數，二分找中間排名。',[
'第 i 列是 i、2i、…、ni，不大於 v 的格數為 min(n,floor(v/i))。全部列加總 count(v) 即排序後≤v 的元素數，重複數值出現在不同格仍要全部算入。目標排名為 (n²+1)/2。',
'count(v) 隨 v 單調，二分尋找最小滿足 count(v)≥目標的 v。因為是最小達標值，就算排名落在一群相等數值中也能取得正確中位數。v//n 以前的列必全滿，可先一次加入，剩下再逐列計數；計數達目標就提前結束。'],
'時間 O(n log(n²))、額外空間 O(1)，Python 僅有一個輸入整數緩衝；奇數 n<10^6。n² 與格數需 64 位元。Python 最壞數千萬次整除的一秒限制未保證。','不能將乘法表展開成 n² 個元素，也不能去除重複值；本題 n 保證奇數。',[
('n=3，目標排名 5',[1,2,3,2,4,6,3,6,9],[('排名',5)]),('候選 2 的計數為 2+1+0=3',[2,1,0],[('不足',3)]),('候選 3 的計數為 3+1+1=5',[3,1,1],[('答案',3)])],
'''n=int(sys.stdin.buffer.readline());rank=(n*n+1)//2;lo=1;hi=n*n
while lo<hi:
    mid=(lo+hi)//2;full=min(n,mid//n);count=full*n
    for i in range(full+1,min(n,mid)+1):
        count+=mid//i
        if count>=rank:break
    if count>=rank:hi=mid
    else:lo=mid+1
print(lo)''',
'''int main(){ll n;cin>>n;ll rank=(n*n+1)/2,lo=1,hi=n*n;while(lo<hi){ll mid=(lo+hi)/2,full=min(n,mid/n),cnt=full*n;for(ll i=full+1;i<=min(n,mid)&&cnt<rank;i++)cnt+=mid/i;if(cnt>=rank)hi=mid;else lo=mid+1;}cout<<lo<<'\n';}''',note='精確 O(n log n) 排名二分；Python n 接近 10^6 時的整除迴圈可能超過一秒，尚不宣稱符合時限。')
add(607,'number-theory','十進位逐位計數與單調二分','分別計數 1..X 每個數字鍵的用量，求所有用量都不超限的最大 X。',[
'對位權 f=1,10,100,…，令 high=X//(10f)、cur=(X//f)%10、low=X%f。非零數字 d 在該位先貢獻 high·f，再依 cur>d 加 f、cur=d 加 low+1。零不能計入前導零，所以只有 high>0 時才先算 (high−1)f，再依 cur 補滿或補部分。',
'將所有位權對各數字的貢獻相加，即能精確計數 1 到 X，不需要實際寫出數字。各鍵用量隨 X 不減，故可二分最大可行 X。上界可取 10n：每十個連續整數個位就用一次數字 1，1..10n 已有 n 次，另有整數 10 的十位 1，故 n≥1 時必超限。C++ 中間乘法和計數使用 __int128，以免 10n 超過 64 位元。'],
'時間 O(10 log² n)、空間 O(1)，Python 僅有一個整數輸入緩衝且整數可任意精度；n≤10^18，C++ 使用 128 位元中間量。','零的位數統計必須扣除前導零；所有按鍵分別受限，不能只檢查總位數。',[
('上限 n=1，寫 1..9 每鍵最多一次',[1,2,3,4,5,6,7,8,9],[('可行終點',9)]),('再寫 10，數字鍵 1 累計兩次',['1','0'],[('超限鍵',1)]),('因此 n=1 的答案是 9',[9],[('答案',9)])],
'''n=int(sys.stdin.buffer.readline())
def ok(x):
    cnt=[0]*10;f=1
    while f<=x:
        high=x//(10*f);cur=x//f%10;low=x%f
        for d in range(1,10):cnt[d]+=high*f+(f if cur>d else low+1 if cur==d else 0)
        if high:cnt[0]+=(high-1)*f+(low+1 if cur==0 else f)
        f*=10
    return max(cnt)<=n
lo=0;hi=10*n
while lo<hi:
    mid=(lo+hi+1)//2
    if ok(mid):lo=mid
    else:hi=mid-1
print(lo)''',
'''using I=__int128_t;int main(){ll n;cin>>n;auto ok=[&](I x){array<I,10>cnt{};for(I f=1;f<=x;f*=10){I h=x/(10*f),c=x/f%10,l=x%f;for(int d=1;d<10;d++)cnt[d]+=h*f+(c>d?f:c==d?l+1:0);if(h)cnt[0]+=(h-1)*f+(c==0?l+1:f);}for(I z:cnt)if(z>n)return false;return true;};I lo=0,hi=(I)10*n;while(lo<hi){I m=(lo+hi+1)/2;if(ok(m))lo=m;else hi=m-1;}string out;do{out+=char('0'+lo%10);lo/=10;}while(lo);reverse(out.begin(),out.end());cout<<out<<'\n';}''',level='hard')

# Seven difficult lessons are owned by Noether and merged from a sidecar only.
HARD_CODES={f'b{i}' for i in (568,569,573,578,590,591,592)}
def merge_hard():
    side=FIX/'hard-562-607-lessons.json'
    if side.exists():
        hard=json.loads(side.read_text(encoding='utf-8-sig'))
        if isinstance(hard,dict):hard=hard.get('lessons',list(hard.values()))
        authored={x['code']:x for x in LESSONS}
        for x in hard:
            if x['code'] not in HARD_CODES:raise ValueError('Unexpected hard sidecar code '+x['code'])
            authored[x['code']]=x
        return sorted(authored.values(),key=lambda x:x['code'])
    return sorted(LESSONS,key=lambda x:x['code'])

def make_checks():
    rng=random.Random(562607);records=[]
    def put(num,inp,ans,reason):
        code=f'b{num}'; inp=str(inp);ans=str(ans)
        if any(inp.strip()==s['input'].strip() for s in SOURCES[code]['samples']):return
        records.append(dict(code=code,input=inp,output=ans,reason=reason))
    def arr(a):return ' '.join(map(str,a))
    def graph(n,edges):return f'{n} {len(edges)}\n'+'\n'.join(arr(e) for e in edges)
    def edit(a,b):
        # Independent full prefix table, not the submitted rolling implementation.
        d=[[0]*(len(b)+1) for _ in range(len(a)+1)]
        for i in range(len(a)+1):d[i][0]=i
        for j in range(len(b)+1):d[0][j]=j
        for i in range(1,len(a)+1):
            for j in range(1,len(b)+1):d[i][j]=min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+(a[i-1]!=b[j-1]))
        return d[-1][-1]
    pairs=[('a','a'),('A','a'),('7','999'),('abcd','dabc')]+[(''.join(rng.choices('abC1',k=rng.randint(1,9))),''.join(rng.choices('abC1',k=rng.randint(1,9)))) for _ in range(30)]
    put(562,'\n'.join(a+' '+b for a,b in pairs)+'\n!', '\n'.join(str(edit(a,b)) for a,b in pairs),'Full two-dimensional edit-distance recurrence; includes non-# terminator and case sensitivity.')
    put(562,'a'*2000+' '+'b'*2000+'\n#','2000','Exact certificate: each of 2000 a characters must be replaced or deleted; 2000 replacements suffice.')
    for z in range(18):
        n=rng.randint(2,7);edges=[(i,j,rng.choice([0,1,2,9,2147483647])) for i in range(1,n+1) for j in range(i+1,n+1) if rng.random()<.4]
        if len(edges)<2:edges=[(1,2,9),(1,2,2)]
        d=[[math.inf]*n for _ in range(n)]
        for i in range(n):d[i][i]=0
        for u,v,w in edges:d[u-1][v-1]=d[v-1][u-1]=min(d[u-1][v-1],w)
        for k in range(n):
            for i in range(n):
                for j in range(n):d[i][j]=min(d[i][j],max(d[i][k],d[k][j]))
        put(563,graph(n,edges),-1 if math.isinf(d[0][-1]) else d[0][-1],'Independent minimax Floyd-Warshall; zero/31-bit weights, disconnected and parallel roads.')
    for z in range(25):
        n=rng.randint(1,8);k=rng.randint(1,n);a=[rng.randint(1,20) for _ in range(n)]
        ans=min(max(sum(a[l:r]) for l,r in zip((0,)+cuts,cuts+(n,))) for cuts in itertools.combinations(range(1,n),k-1))
        put(564,f'{n} {k}\n'+arr(a),ans,'Enumerate every choice of K-1 cut positions; no greedy feasibility oracle.')
    for z in range(20):
        n=rng.randint(1,8);edges=[(i,rng.randrange(1,i)) for i in range(2,n+1)]
        parent={1:None};children=collections.defaultdict(set)
        for u,v in edges:parent[u]=v;children[v].add(u)
        active=set(range(2,n+1));counter=n;attacks=0
        while active:
            leaves=[u for u in active if not children[u]];v=rng.choice(leaves);p=parent[v];g=parent[p]
            active.remove(v);children[p].remove(v);attacks+=1
            if g is not None:
                for _ in range(2):counter+=1;parent[counter]=g;children[g].add(counter);active.add(counter)
        put(565,str(n)+'\n'+'\n'.join(arr(e) for e in edges),attacks%65536,'Explicit hydra regrowth simulation with randomly selected leaves; counts attacks, not depth formula.')
    put(565,'18\n'+'\n'.join(f'{i} {i+1}' for i in range(1,18)),(sum(2**d-1 for d in range(1,18)))%65536,'Long-chain exact potential certificate exercises modulo 65536 after exponent saturation.')
    def canon(n,e):
        g=[[] for _ in range(n)]
        for u,v in e:g[u-1].append(v-1);g[v-1].append(u-1)
        def rec(u,p):return '('+''.join(sorted(rec(v,u) for v in g[u] if v!=p))+')'
        return rec(0,-1)
    cases=[];answers=[]
    for z in range(30):
        n=rng.randint(2,9);e=[(i,rng.randrange(1,i)) for i in range(2,n+1)]
        if z%2:
            perm=[1]+rng.sample(list(range(2,n+1)),n-1);f=[(perm[u-1],perm[v-1]) for u,v in e];rng.shuffle(f)
        else:f=[(i,rng.randrange(1,i)) for i in range(2,n+1)]
        cases.append(str(n)+'\n'+'\n'.join(arr(x) for x in e+f));answers.append('YES' if canon(n,e)==canon(n,f) else 'NO')
    put(566,str(len(cases))+'\n'+'\n'.join(cases),'\n'.join(answers),'Independent parenthesized rooted-tree canonical strings; root-preserving relabelings and unrelated trees.')
    for z in range(18):
        n=rng.randint(2,6);s=rng.randrange(n);dest=rng.randrange(n);stations=rng.sample(list(range(n)),rng.randrange(n+1));edges=[]
        for u in range(n-1):edges.append((u,u+1,rng.randint(1,15),rng.choice([-1,1,3,8])))
        for u in range(n):
            for v in range(u+2,n):
                if rng.random()<.3:edges.append((u,v,rng.randint(1,15),rng.choice([-1,2,4])))
        d=[[math.inf]*(2*n) for _ in range(2*n)]
        for i in range(2*n):d[i][i]=0
        for u in stations:d[2*u][2*u+1]=d[2*u+1][2*u]=0
        for u,v,w,c in edges:
            d[2*u][2*v]=d[2*v][2*u]=min(d[2*u][2*v],w)
            if c!=-1:d[2*u+1][2*v+1]=d[2*v+1][2*u+1]=min(d[2*u+1][2*v+1],c)
        for k in range(2*n):
            for i in range(2*n):
                for j in range(2*n):d[i][j]=min(d[i][j],d[i][k]+d[k][j])
        inp=f'{n} {len(edges)}\n{s} {dest}\n'+arr([len(stations)]+stations)+'\n'+'\n'.join(arr(e) for e in edges)
        put(567,inp,d[2*s][2*dest],'Independent all-pairs Floyd-Warshall on exact walk/bike state graph; zero stations, forbidden cycling, destination return requirement.')
    for z in range(20):
        m=rng.randint(1,9);budget=rng.randint(1,30);items=[(rng.randint(1,20),rng.randint(1,100)) for _ in range(m)]
        ans=max(sum(items[i][1] for i in range(m) if mask>>i&1) for mask in range(1<<m) if sum(items[i][0] for i in range(m) if mask>>i&1)<=budget)
        put(570,f'{m} {budget}\n'+'\n'.join(arr(e) for e in items),ans,'Enumerate all item subsets, each measure at most once.')
    put(570,'1 2\n1 9000000000000000000\n1 1\n2 7','9000000000000000000\n0','Multi-case EOF and 64-bit objective certificate; one measure may not be reused.')
    for z in range(22):
        n=rng.randint(1,6);m=rng.randint(1,10);cap=[rng.randint(1,3) for _ in range(n)];initial=[rng.randint(0,c) for c in cap];b=initial[:];ev=[];requests=[]
        for i in range(m):
            st=rng.randint(1,6);end=rng.randint(st+1,9);u=rng.randrange(n);v=rng.randrange(n);requests.append((st,u+1,end,v+1));ev.extend(((st,1,i,u),(end,0,i,v)))
        ok=[False]*m;miss=detour=0
        for t,kind,i,u in sorted(ev):
            if kind:
                if not b[u]:miss+=1
                else:b[u]-=1;ok[i]=True
            elif ok[i]:
                while b[u]==cap[u]:u=(u+1)%n;detour+=1
                b[u]+=1
        put(571,f'{n} {m}\n'+arr(cap)+'\n'+arr(initial)+'\n'+'\n'.join(arr(r) for r in requests),f'{miss}\n{detour}','Naive station-by-station ring search with stable ordered events; includes empty/full stations and simultaneous events.')
    for z in range(15):
        m=rng.randint(1,12);k=rng.randint(1,m+4);a=[rng.randint(1,8) for _ in range(m)];work=a[:];out=[]
        for _ in range(min(m,k)):v=min(work);out.append(v);work.remove(v)
        put(572,f'{m} {k}\n'+'\n'.join(f'ABCDE {x}' for x in a),arr(out),'Repeated extract-min oracle preserves duplicate record prices; tests K>M.')
    for z in range(20):
        n=rng.randint(1,8);edges=[(u,v) for u in range(1,n+1) for v in range(u+1,n+1) if rng.random()<.32]
        if not edges:edges=[(1,2)];n=max(n,2)
        ans=math.inf
        for omit,(s,t) in enumerate(edges):
            g=[[] for _ in range(n+1)]
            for j,(u,v) in enumerate(edges):
                if j!=omit:g[u].append(v);g[v].append(u)
            d={s:0};q=collections.deque([s])
            while q:
                u=q.popleft()
                for v in g[u]:
                    if v not in d:d[v]=d[u]+1;q.append(v)
            if t in d:ans=min(ans,d[t]+1)
        put(574,graph(n,edges),-1 if math.isinf(ans) else ans,'Remove each edge and find a shortest replacement path; independent shortest-cycle certificate.')
    for z in range(15):
        n=rng.randint(2,4);m=rng.randint(1,7);k=rng.randint(1,3);edges=[]
        for _ in range(m):
            u,v=rng.sample(range(n),2);edges.append((u+1,v+1,rng.randint(1,2),rng.randint(1,8)))
        best=math.inf
        for amounts in itertools.product(*(range(e[2]+1) for e in edges)):
            balance=[0]*n;cost=0
            for (u,v,cap,c),f in zip(edges,amounts):balance[u-1]-=f;balance[v-1]+=f;cost+=f*c
            if balance==[-k]+[0]*(n-2)+[k]:best=min(best,cost)
        put(575,f'{n} {m} {k}\n'+'\n'.join(arr(e) for e in edges),-1 if math.isinf(best) else best,'Enumerate every integer edge-flow assignment within capacities and enforce conservation; includes cycles/parallel routes.')
    put(575,'4 5 2\n1 2 1 1\n2 3 1 1\n3 4 1 1\n1 3 1 3\n2 4 1 3','8','Residual rerouting certificate: first 1-2-3-4 costs3; optimum two paths 1-2-4 and 1-3-4 cost4+4.')
    for z in range(20):
        n=rng.randint(1,10);k=rng.randint(1,n);a=[rng.randint(1,4) for _ in range(n)]
        ans=sum(len(set(a[l:r]))<=k for l in range(n) for r in range(l+1,n+1))
        put(576,f'{n} {k}\n'+arr(a),ans,'Enumerate all nonempty intervals and build their value sets.')
    for z in range(22):
        s=''.join(rng.choices('abc',k=rng.randint(1,9)));subs=sorted({s[l:r] for l in range(len(s)) for r in range(l+1,len(s)+1)});k=rng.randint(1,len(subs))
        put(577,f'{s}\n{k}',subs[k-1],'Enumerate, deduplicate, and lexicographically sort all substrings.')
    for z in range(18):
        n=rng.randint(1,8);p=rng.sample(list(range(1,n+1)),n);cur=list(range(1,n+1));turns=0
        while True:
            nxt=[0]*n
            for i,v in enumerate(cur):nxt[p[i]-1]=v
            cur=nxt;turns+=1
            if cur==list(range(1,n+1)):break
        put(579,str(n)+'\n'+arr(p),turns,'Explicit simultaneous permutation application until identity recurs, no LCM oracle.')
    for z in range(12):
        n=rng.randint(2,7);edges=[(i,i+1) for i in range(1,n)]
        edges += [(i,j) for i in range(1,n+1) for j in range(i+2,n+1) if rng.random()<.3]
        g=[[] for _ in range(n+1)]
        for u,v in edges:g[u].append(v);g[v].append(u)
        queries=[];answers=[]
        for _ in range(25):
            a=rng.randint(1,n);b=rng.randint(1,n);x=rng.randint(0,12);reachable={a}
            for _ in range(x):reachable={v for u in reachable for v in g[u]}
            queries.append((a,b,x));answers.append('YES' if b in reachable else 'NO')
        put(580,f'{n} {len(edges)} {len(queries)}\n'+'\n'.join(arr(e) for e in edges+queries),'\n'.join(answers),'Exact-step reachable-set simulation, including zero steps and odd-cycle detours.')
    for z in range(20):
        n=rng.randint(2,10);k=rng.randint(1,12);a=[''.join(rng.choices('01',k=k)) for _ in range(n)];ans=min(sum(x!=y for x,y in zip(a[i],a[j])) for i in range(n) for j in range(i))
        put(581,f'{n} {k}\n'+'\n'.join(a),ans,'Direct character-by-character pairwise distance, including duplicated inputs.')
    for z in range(25):
        n=rng.randint(1,10);h=[rng.randint(1,6) for _ in range(n)];memo={}
        def rec(i):
            if i in memo:return memo[i]
            best=1
            for j in range(n):
                if i!=j and h[i]>h[j] and all(h[i]>h[t] for t in range(min(i,j)+1,max(i,j))):best=max(best,1+rec(j))
            memo[i]=best;return best
        put(582,str(n)+'\n'+arr(h),max(rec(i) for i in range(n)),'Build every legal glide by inspecting all intervening mountains; exhaustive DAG longest path.')
    for z in range(22):
        a=[rng.randint(1,6) for _ in range(rng.randint(1,12))];b=a[:];rounds=0
        while b!=sorted(b):
            for i in range(len(b)-1):
                if b[i]>b[i+1]:b[i],b[i+1]=b[i+1],b[i]
            rounds+=1
        put(583,str(len(a))+'\n'+arr(a),rounds,'Literal left-to-right bubble passes, stopping as soon as sorted; duplicates remain stable.')
    for z in range(22):
        a=[rng.randint(1,5) for _ in range(rng.randint(1,11))];ans=sum(len(set(a[l:r])) for l in range(len(a)) for r in range(l+1,len(a)+1))
        put(584,str(len(a))+'\n'+arr(a),ans,'Enumerate every interval and directly sum set cardinalities.')
    for z in range(22):
        s=''.join(rng.choices('abc',k=rng.randint(1,14)));put(585,s,min(s[i:]+s[:i] for i in range(len(s))),'Enumerate all cyclic rotations; periodic and all-equal strings allowed.')
    for z in range(15):
        n=rng.randint(1,8);perm=rng.sample(list(range(1,n+1)),n);ops=[(c,rng.randint(1,2)) for c in perm];coeff=[0]*n;out=[]
        for c,side in ops:
            coeff[c-1]=1 if side==1 else -1
            # Test all extreme rays of the positive gap-weight cone.
            rays=[sum(coeff[j:]) for j in range(n)]
            out.append('>' if min(rays)>=0 and max(rays)>0 else '<' if max(rays)<=0 and min(rays)<0 else '?')
        put(586,str(n)+'\n'+'\n'.join(arr(o) for o in ops),'\n'.join(out),'Exact linear-cone certificate: test every positive weight-gap extreme ray; computes suffix coefficients directly without segment tree.')
    for z in range(18):
        n=rng.randint(1,6);edges=[(u,v) for u in range(1,n+1) for v in range(u+1,n+1) if rng.random()<.45];ans=0
        for mask in range(1<<len(edges)):
            deg=[0]*(n+1)
            for i,(u,v) in enumerate(edges):
                if mask>>i&1:deg[u]^=1;deg[v]^=1
            ans+=not any(deg)
        put(587,graph(n,edges),ans,'Enumerate all edge subsets and check all degree parities, including empty graph and disconnected components.')
    for z in range(22):
        s=''.join(rng.choices('ABC',k=rng.randint(1,8)));valid=[''.join(p) for p in set(itertools.permutations(s)) if all(p[i]!=p[i+1] for i in range(len(p)-1))]
        put(588,s,min(valid) if valid else '-1','Enumerate all unique multiset permutations; filter adjacent equals and choose lexicographic minimum.')
    for z in range(22):
        s=''.join(rng.choices('abc',k=rng.randint(1,10)));t=s+'#';rot=sorted(t[i:]+t[:i] for i in range(len(t)));bwt=''.join(x[-1] for x in rot)
        put(589,bwt,s,'Forward BWT from explicitly sorted rotations of a randomly generated known original string.')
    rows=[];ans=[]
    for n in range(2,6):
        for k in range(1,19):
            div=[d for d in range(1,k+1) if k%d==0];dp={d:1 for d in div}
            for _ in range(n-1):dp={v:sum(dp[u] for u in div if math.lcm(u,v)==k) for v in div}
            rows.append((n,k));ans.append(str(sum(dp.values())%1000000007))
    put(593,str(len(rows))+'\n'+'\n'.join(arr(x) for x in rows),'\n'.join(ans),'Independent DP over actual divisors, checking numerical LCM for every transition.')

    # k=2 binary strings without consecutive low exponents are counted by Fibonacci(n+2).
    def fib(n):
        if not n:return (0,1)
        a,b=fib(n//2);c=a*((2*b-a)%1000000007)%1000000007;d=(a*a+b*b)%1000000007
        return (d,(c+d)%1000000007) if n%2 else (c,d)
    put(593,'2\n1000000000 1\n1000000000 2','1\n'+str(fib(1000000002)[0]),'k=1 exact certificate; k=2 equals Fibonacci(n+2), independently computed by fast doubling.')
    for z in range(22):
        a=[rng.randint(1,4) for _ in range(rng.randint(1,10))];n=len(a);ans=0
        for mask in range(1<<(n-1)):
            cuts=[0]+[i+1 for i in range(n-1) if mask>>i&1]+[n]
            ans+=all(len(set(a[l:r]))==r-l for l,r in zip(cuts,cuts[1:]))
        put(594,str(n)+'\n'+arr(a),ans,'Enumerate all 2^(n-1) cut masks and check every resulting segment for duplicates.')
    for z in range(20):
        n=rng.randint(1,4);coins=[0]*(2*n)
        for _ in range(2*n):coins[rng.randrange(2*n)]+=1
        sources=[i for i,v in enumerate(coins) for _ in range(max(0,v-1))];targets=[i for i,v in enumerate(coins) if v==0]
        def distance(i,j):return abs(i%n-j%n)+(i//n!=j//n)
        if targets:
            dp={0:0}
            for s in sources:
                nd={}
                for mask,c in dp.items():
                    for j,t in enumerate(targets):
                        if not mask>>j&1:zmask=mask|1<<j;nd[zmask]=min(nd.get(zmask,math.inf),c+distance(s,t))
                dp=nd
            ans=dp[(1<<len(targets))-1]
        else:ans=0
        put(595,str(n)+'\n'+arr(coins[:n])+'\n'+arr(coins[n:]),ans,'Independent minimum-cost bipartite assignment of individual surplus coins to deficit cells, using grid Manhattan distances.')
    for z in range(22):
        s=''.join(rng.choices('abc',k=rng.randint(1,12)));subs={''.join(c for i,c in enumerate(s) if mask>>i&1) for mask in range(1,1<<len(s))}
        put(596,s,len(subs),'Enumerate every nonempty subsequence mask and deduplicate resulting strings.')
    for z in range(22):
        a=[rng.randint(1,6) for _ in range(rng.randint(1,7))];ans=min(sum(abs(x-y) for x,y in zip(a,b)) for b in itertools.combinations_with_replacement(range(1,7),len(a)))
        put(597,str(len(a))+'\n'+arr(a),ans,'Enumerate every nondecreasing target over full input value range, minimize L1 cost.')
    for z in range(16):
        n=rng.randint(1,8);a=rng.sample(list(range(1,n+1)),n);best=math.inf
        # Every pyramid is obtained by assigning each value below n to the increasing left or decreasing right side.
        for mask in range(1<<(n-1)):
            target=[x for x in range(1,n) if mask>>(x-1)&1]+[n]+[x for x in range(n-1,0,-1) if not mask>>(x-1)&1];rank={v:i for i,v in enumerate(target)}
            cost=sum(rank[a[i]]>rank[a[j]] for i in range(n) for j in range(i+1,n));best=min(best,cost)
        put(598,str(n)+'\n'+arr(a),best,'Enumerate all 2^(n-1) pyramid targets and count exact adjacent-swap inversion distance.')
    for z in range(22):
        s=''.join(rng.choices('abcd',k=rng.randint(1,11)));letters=set(s);ans=0
        for l in range(len(s)):
            for r in range(l+1,len(s)+1):
                c=collections.Counter(s[l:r]);ans+=len({c[x] for x in letters})==1
        put(599,s,ans,'Enumerate substrings and compare counts of every letter present in the entire source string, including zero counts.')
    grid=[[0]*14 for _ in range(14)]
    for y in range(14):
        for x in range(14):
            used=set(grid[y][:x])|{grid[i][x] for i in range(y)};v=0
            while v in used:v+=1
            grid[y][x]=v
    for y,x in [(1,1),(1,14),(14,1),(13,14),(8,8),(9,6),(14,14)]:put(600,f'{y} {x}',grid[y-1][x-1],'Construct the actual mex grid from all earlier row/column values, without XOR.')
    cycle_inputs=[];cycle_ans=[];step_inputs=[];step_ans=[]
    for n in range(2,11):
        for m in range(2,11):
            r=c=0;dr=dc=1;seen={(0,0)};steps=bounces=0
            while True:
                r+=dr;c+=dc;steps+=1;hit=False
                if r in (0,n-1):dr=-dr;hit=True
                if c in (0,m-1):dc=-dc;hit=True
                if hit:bounces+=1
                seen.add((r,c))
                if (r,c)==(0,0):break
            cycle_inputs.append((n,m));cycle_ans.append(f'{steps} {len(seen)}')
            for k in (0,1,n-1,m-1,steps,steps+1,rng.randint(1,100)):
                r=c=0;dr=dc=1;bounces=0
                for _ in range(k):
                    r+=dr;c+=dc;hit=False
                    if r in (0,n-1):dr=-dr;hit=True
                    if c in (0,m-1):dc=-dc;hit=True
                    bounces+=hit
                step_inputs.append((n,m,k));step_ans.append(f'{r+1} {c+1} {bounces}')
    put(601,str(len(cycle_inputs))+'\n'+'\n'.join(arr(x) for x in cycle_inputs),'\n'.join(cycle_ans),'Literal reflected motion until first return; set stores every visited coordinate for all sizes 2..10.')
    put(602,str(len(step_inputs))+'\n'+'\n'.join(arr(x) for x in step_inputs),'\n'.join(step_ans),'Literal reflected motion for zero, boundary, corner, full-cycle and random step counts on sizes 2..10.')
    for n in range(1,9):
        counts=[0]*n
        for p in itertools.permutations(range(1,n+1)):
            want=1;rounds=0
            while want<=n:
                rounds+=1
                for x in p:
                    if x==want:want+=1
            counts[rounds-1]+=1
        put(603,str(n),'\n'.join(map(str,counts)),'Enumerate every permutation and literally collect 1..n in repeated scans; no Eulerian recurrence.')
    def partitions(seq):
        if not seq:yield [];return
        first,*rest=seq
        for part in partitions(rest):
            yield [[first]]+[g[:] for g in part]
            for i in range(len(part)):
                new=[g[:] for g in part];new[i].append(first);yield new
    for z in range(24):
        n=rng.randint(1,7);a=[rng.randint(0,10) for _ in range(n)];budget=rng.randint(0,18);ans=0
        for part in partitions(list(range(n))):ans+=sum(max(a[i] for i in g)-min(a[i] for i in g) for g in part)<=budget
        put(604,f'{n} {budget}\n'+arr(a),ans,'Enumerate each unlabeled set partition of labeled people exactly once and directly compute sum of skill ranges.')
    edges=[(i,i+1) for i in range(9) if i%3<2]+[(i,i+3) for i in range(6)];goal=tuple(range(1,10));dist={goal:0};q=collections.deque([goal])
    while q:
        s=q.popleft()
        if dist[s]==4:continue
        for i,j in edges:
            t=list(s);t[i],t[j]=t[j],t[i];t=tuple(t)
            if t not in dist:dist[t]=dist[s]+1;q.append(t)
    choices=rng.sample(list(dist),20)+[goal]
    for p in choices:put(605,'\n'.join(arr(p[i:i+3]) for i in (0,3,6)),dist[p],'Independent ordinary one-direction BFS from target through every state at distance <=4; no bidirectional meeting logic.')
    for n in range(1,44,2):
        values=sorted(i*j for i in range(1,n+1) for j in range(1,n+1));put(606,str(n),values[len(values)//2],'Materialize and sort all n^2 grid values including duplicates; odd n from 1 to 43.')
    for budget in list(range(1,31))+[50,100,1000]:
        count=[0]*10;x=0
        while True:
            new=count[:]
            for d in str(x+1):new[int(d)]+=1
            if max(new)>budget:break
            count=new;x+=1
        put(607,str(budget),x,'Literally write consecutive positive decimal integers and stop before any digit budget is exceeded.')
    records.extend(b563_dense_checks())
    # Every owned code must have a genuine non-public independent case.
    for lesson in LESSONS:
        assert any(r['code']==lesson['code'] for r in records),lesson['code']
    return records

def run_verification():
    lessons=merge_hard();checks=make_checks();hard_checks=FIX/'hard-562-607-checks.json'
    if hard_checks.exists():
        extra=json.loads(hard_checks.read_text(encoding='utf-8-sig'))
        if isinstance(extra,dict):extra=extra.get('checks',extra.get('cases',[]))
        checks.extend(extra)
    excluded=[r for r in checks if any(r['input'].split()==s['input'].split() for s in SOURCES[r['code']]['samples']) or '官方公開範例' in r['reason']]
    supplemental=[r for r in excluded if not any(r['input'].split()==s['input'].split() for s in SOURCES[r['code']]['samples'])]
    checks=[r for r in checks if r not in excluded]
    (FIX/'checks-562-607.json').write_text(json.dumps(checks,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    DATA.write_text(json.dumps(lessons,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    result={'seed':562607,'environment':'WSL kali-linux; Linux g++ -std=c++17 -O2; Python3','authoredCount':len(lessons),'missingCodes':sorted({f'b{i}' for i in range(562,608)}-{x['code'] for x in lessons}),'publicCases':0,'independentCases':len(checks),'runs':[],'failures':[],'benchmarks':[],'excludedPublicDuplicates':excluded}
    if '--skip-benchmarks' in sys.argv and (FIX/'results-562-607.json').exists():
        result['benchmarks']=json.loads((FIX/'results-562-607.json').read_text(encoding='utf-8')).get('benchmarks',[])
    def normalize(s):return s.split()
    with tempfile.TemporaryDirectory(prefix='nov08-562-607-') as tmp:
        tmp=pathlib.Path(tmp)
        for l in lessons:
            code=l['code'];cpp=tmp/(code+'.cpp');py=tmp/(code+'.py');exe=tmp/code
            cpp.write_text(l['cpp']);py.write_text(l['python']);compiled=subprocess.run(['g++','-std=c++17','-O2','-pipe',str(cpp),'-o',str(exe)],capture_output=True,text=True)
            if compiled.returncode:result['failures'].append({'code':code,'language':'cpp','stage':'compile','stderr':compiled.stderr})
            cases=[dict(s,kind='public') for s in SOURCES[code]['samples']]+[dict(r,kind='additional-public') for r in supplemental if r['code']==code]+[dict(r,kind='independent') for r in checks if r['code']==code]
            result['publicCases']+=len(SOURCES[code]['samples'])+sum(r['code']==code for r in supplemental);passed={'cpp':0,'python':0};elapsed={'cpp':0.,'python':0.}
            for case in cases:
                for lang,cmd in [('cpp',[str(exe)]),('python',['python3',str(py)])]:
                    if lang=='cpp' and compiled.returncode:continue
                    started=time.monotonic()
                    try:
                        p=subprocess.run(cmd,input=case['input'],text=True,capture_output=True,timeout=35)
                        elapsed[lang]+=time.monotonic()-started
                        if p.returncode or normalize(p.stdout)!=normalize(case['output']):
                            result['failures'].append({'code':code,'language':lang,'kind':case['kind'],'input':case['input'],'expected':case['output'],'actual':p.stdout,'stderr':p.stderr,'returncode':p.returncode})
                        else:passed[lang]+=1
                    except subprocess.TimeoutExpired:result['failures'].append({'code':code,'language':lang,'kind':case['kind'],'input':case['input'],'expected':case['output'],'error':'35s timeout'})
            result['runs'].append({'code':code,'cases':len(cases),'passed':passed,'seconds':elapsed})
            print(code,passed,'/',len(cases),flush=True)
            # Write after every lesson, so failures survive interruption.
            (FIX/'results-562-607.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
        benchmarks=[] if '--skip-benchmarks' in sys.argv else make_benchmarks()
        for code,inp,reason in benchmarks:
            if not (tmp/(code+'.py')).exists():continue
            row={'code':code,'reason':reason,'inputBytes':len(inp),'timings':{}}
            for lang,cmd in [('cpp',[str(tmp/code)]),('python',['python3',str(tmp/(code+'.py'))])]:
                started=time.monotonic()
                try:
                    proc=subprocess.run(cmd,input=inp,text=True,capture_output=True,timeout=55)
                    row['timings'][lang]={'seconds':time.monotonic()-started,'returncode':proc.returncode,'outputPrefix':proc.stdout[:100],'stderr':proc.stderr[:500]}
                except subprocess.TimeoutExpired:row['timings'][lang]={'timeoutSeconds':55}
            result['benchmarks'].append(row);print('benchmark',code,row['timings'],flush=True)
            (FIX/'results-562-607.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    annotate_benchmarks(lessons,result['benchmarks'])
    result['sourcePublicCases']=sum(len(SOURCES[l['code']]['samples']) for l in lessons)
    result['supplementalPublicCases']=supplemental
    result['hardSidecarEvidence']=hard_evidence(lessons)
    DATA.write_text(json.dumps(lessons,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    result['failureCount']=len(result['failures'])
    (FIX/'results-562-607.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print('SUMMARY',len(lessons),'lessons',len(checks),'independent records',len(result['failures']),'failures',flush=True)
    return result

def make_benchmarks():
    rng=random.Random(607562)
    # Parity code forces every distinct pair to have distance >=2, preventing the distance-1 early exit.
    parity=[];used=set()
    while len(parity)<20000:
        v=rng.getrandbits(29);v=(v<<1)|(v.bit_count()&1)
        if v not in used:used.add(v);parity.append(f'{v:030b}')
    return [
        ('b581','20000 30\n'+'\n'.join(parity),'Full n=20000 even-parity distinct words; prevents all exact early exits and exercises n(n-1)/2 comparisons.'),
        ('b603','5000','Full n=5000 quadratic Eulerian DP.'),
        ('b606','999999','Largest allowed odd n; answer binary search with row-count divisions.'),
        ('b604','100 2499\n'+' '.join(map(str,([0]*50+[100]*50))),'n=100 with a nontrivial budget below maximum possible cost; tests open-team cost DP rather than Bell shortcut.'),
        ('b588','ABCDEFGHIJKLMNOPQRSTUVWXYZ'*38461+'ABCDEF','n=999992 balanced uppercase letters exercises fixed-alphabet greedy scan.'),
        ('b599',''.join(rng.choices('abcdefghijklmnopqrstuvwxyz',k=200000)),'Full n=200000, all 26 letters, high-dimensional prefix-difference tuple keys.'),
        ('b605','9 8 7\n6 5 4\n3 2 1','Reverse permutation exercises a deep bidirectional BFS.'),
        ('b607','1000000000000000000','Full digit budget 10^18 and 128-bit C++ intermediate arithmetic.')
    ]

def annotate_benchmarks(lessons,benchmarks):
    by_code={l['code']:l for l in lessons}
    for row in benchmarks:
        if row['code'] not in by_code:continue
        times=[];over=False
        for lang,label in [('cpp','C++17'),('python','Python 3')]:
            result=row['timings'].get(lang,{})
            if 'seconds' in result:
                seconds=result['seconds'];times.append(f'{label} {seconds:.3f} 秒')
                if lang=='python' and seconds>1:over=True
            elif 'timeoutSeconds' in result:times.append(f'{label} 超過 {result["timeoutSeconds"]} 秒');over=True
        note='本機 WSL kali-linux 滿規模量測：'+ '；'.join(times)+'。'
        note+=('此 Python 實測超過題面 1 秒，正式提交建議採 C++17。' if over else '這是指定壓力資料的測量，不代表所有最壞輸入或官方一秒評測皆可通過。')
        note+='資料形狀與可重現產生方法見 verify-562-607.py、results-562-607.json。'
        by_code[row['code']]['performanceNote']=note

def hard_evidence(lessons):
    path=FIX/'hard-562-607-results.json'
    if not path.exists():return None
    report=json.loads(path.read_text(encoding='utf-8-sig'))
    maximum=[x for x in report.get('cases',[]) if x.get('kind')=='maximum']
    for lesson in lessons:
        rows=[r for r in maximum if r['code']==lesson['code']]
        if not rows:continue
        timings=[]
        for lang in ('C++17','Python'):
            seconds=[r['seconds'] for r in rows if r['language']==lang and 'seconds' in r]
            if seconds:timings.append(f'{lang} 最慢 {max(seconds):.3f} 秒')
        lesson['performanceNote']=lesson.get('performanceNote','').split(' 側檔最大規模量測：')[0]+' 側檔最大規模量測：'+'；'.join(timings)+'。這些資料形狀的通過並不代表官方一秒時限保證。'
    return {k:report[k] for k in ('lessonSHA256','environment','notes','sources','summary','passed') if k in report}|{'maximumCases':maximum,'failures':report.get('failures',[]),'reportFile':str(path.relative_to(ROOT))}

def finalize_report():
    """Reclassify an already executed extra official sample; no solution or test input is changed."""
    path=FIX/'results-562-607.json'
    result=json.loads(path.read_text(encoding='utf-8'))
    if len(result.get('runs',[]))!=46 or 'failureCount' not in result:
        raise RuntimeError('Wait for the complete merged runtime run before finalizing.')
    lessons=merge_hard();checks=make_checks();side=FIX/'hard-562-607-checks.json'
    if side.exists():checks+=json.loads(side.read_text(encoding='utf-8-sig'))
    duplicates=[r for r in checks if any(r['input'].split()==s['input'].split() for s in SOURCES[r['code']]['samples'])]
    supplemental=[r for r in checks if r not in duplicates and '官方公開範例' in r['reason']]
    independent=[r for r in checks if r not in duplicates and r not in supplemental]
    oldtotal=sum(r['cases'] for r in result['runs'])
    total=sum(len(SOURCES[l['code']]['samples']) for l in lessons)+len(independent)+len(supplemental)
    assert oldtotal==total,(oldtotal,total)
    result['independentCases']=len(independent);result['sourcePublicCases']=sum(len(SOURCES[l['code']]['samples']) for l in lessons)
    result['publicCases']=result['sourcePublicCases']+len(supplemental);result['supplementalPublicCases']=supplemental;result['excludedPublicDuplicates']=duplicates
    result['totalCasesPerLanguage']=total
    result['passedPerLanguage']={lang:sum(r['passed'][lang] for r in result['runs']) for lang in ('cpp','python')}
    result['independentCasesPerCode']=dict(collections.Counter(r['code'] for r in independent))
    annotate_benchmarks(lessons,result['benchmarks']);result['hardSidecarEvidence']=hard_evidence(lessons)
    result['limitations']=[
        'b569: finite-range winning table relies on the cited Flammenkamp primary computation through 2^35; local independent SG recurrence was recomputed only through 5000. No infinite theorem or full local 10^6 SG recomputation is claimed.',
        'b568: adjacent reversal means zero additional safe distance under the continuous-point wording; stated explicitly and tested, not validated by a hidden judge submission.',
        'Python exceeds the stated one-second limit on measured maximum cases b568,b573,b578,b581,b588,b591,b592,b603,b606. Other measured inputs passing one second do not establish all worst-case official acceptance.',
        'b563: storage is now bounded by a packed uint32 triangle (199980000 bytes at n=10000) plus O(n) state; dense Python runtime is not promised to fit a strict short time limit.',
        'b570: no numeric budget/item-count upper bounds are provided; O(MN) is pseudo-polynomial and not guaranteed feasible for arbitrarily large budgets.',
        'b564: source omits numeric time bounds; C++ assumes total processing time fits signed 64-bit.',
        'Large b591/b592 distribution certificates verify totals and selected bins, not all maximum-size bins independently; small complete distributions are exhaustively enumerated.'
    ]
    result['resolvedDraftIssues']=['Corrected generated-code newline escaping before the complete runtime run.', 'Excluded five duplicate fixture samples and reclassified one extra official public sample; all distinct inputs were still executed.']
    (FIX/'checks-562-607.json').write_text(json.dumps(independent,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    DATA.write_text(json.dumps(lessons,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    path.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print('FINAL',len(lessons),'lessons;',result['sourcePublicCases'],'fixture samples +',len(supplemental),'additional official sample;',len(independent),'independent records;',result['failureCount'],'failures; passed',result['passedPerLanguage'])

def b563_dense_checks():
    """Independent threshold-connectivity oracle; explicitly exercises m>4n and its boundary."""
    rng=random.Random(56320261108);checks=[]
    def case(n,edges,reason):
        assert 2<=len(edges)<=n*n//2
        expected=-1
        for threshold in sorted({w for _,_,w in edges}):
            graph=[[] for _ in range(n)]
            for u,v,w in edges:
                if w<=threshold:graph[u-1].append(v-1);graph[v-1].append(u-1)
            seen={0};todo=[0]
            for u in todo:
                for v in graph[u]:
                    if v not in seen:seen.add(v);todo.append(v)
            if n-1 in seen:expected=threshold;break
        checks.append(dict(code='b563',input=f'{n} {len(edges)}\n'+'\n'.join(f'{u} {v} {w}' for u,v,w in edges),output=str(expected),reason=reason+' Expected result independently computed by connectivity at every distinct weight threshold.'))
    for _ in range(20):
        n=rng.randint(10,18);pairs=[(u,v) for u in range(1,n+1) for v in range(u+1,n+1)]
        rng.shuffle(pairs);m=rng.randint(4*n+1,len(pairs))
        edges=[(u,v,rng.choice([0,1,3,17,2147483647])) for u,v in pairs[:m]]
        rng.shuffle(edges)
        case(n,edges,'Dense-branch small random graph, including zero and maximum signed-31-bit weights.')
    pairs=[(u,v) for u in range(1,13) for v in range(u+1,13)]
    case(12,[(u,v,2147483647) for u,v in pairs],'Dense complete graph: UINT32_MAX sentinel must not hide valid weight 2147483647.')
    edges=[(u,v,90) for u,v in pairs]
    edges += [(1,12,2147483647),(12,1,1),(1,12,999),(1,12,0),(12,1,20),(1,12,2147483647)]
    case(12,edges,'Dense branch: repeated roads in both endpoint orders must retain the minimum despite larger later weights.')
    case(16,[(u,v,1) for u in range(1,16) for v in range(u+1,16)],'Dense component with isolated destination: missing-edge sentinel must stay unreachable.')
    for m in (48,49):
        rng.shuffle(pairs)
        case(12,[(u,v,rng.randint(1,100)) for u,v in pairs[:m]],f'Branch threshold: n=12, m={m}; m=4n uses sparse and m=4n+1 uses triangle.')
    return checks

def revise_b563():
    """Update ONLY b563 in artifacts, then run its complete checks and streamed memory probes.

    Reproduce in WSL: python3 verify-562-607.py --revise-b563
    Each memory probe executes under RLIMIT_AS=256 MiB and isolated Linux resource.getrusage child RSS measurement.
    Large complete graphs are generated line-by-line into /tmp and streamed to each program.
    """
    import hashlib
    import resource
    def fingerprint(records):
        return hashlib.sha256(json.dumps([r for r in records if r['code']!='b563'],ensure_ascii=False,sort_keys=True).encode()).hexdigest()
    lessons=json.loads(DATA.read_text(encoding='utf-8-sig'))
    others_before=fingerprint(lessons)
    lesson=next(l for l in LESSONS if l['code']=='b563')
    lessons=[lesson if l['code']=='b563' else l for l in lessons]
    checks_path=FIX/'checks-562-607.json'
    checks=json.loads(checks_path.read_text(encoding='utf-8-sig'))
    other_checks_before=fingerprint(checks)
    own=[r for r in make_checks() if r['code']=='b563']
    checks=[r for r in checks if r['code']!='b563']+own
    report_path=FIX/'results-562-607.json'
    report=json.loads(report_path.read_text(encoding='utf-8'))
    failures=[];benchmarks=[]
    cases=[dict(s,kind='public') for s in SOURCES['b563']['samples']]+[dict(r,kind='independent') for r in own]
    passed={'cpp':0,'python':0};elapsed={'cpp':0.,'python':0.}
    def memory_limit():resource.setrlimit(resource.RLIMIT_AS,(256*1024**2,256*1024**2))
    with tempfile.TemporaryDirectory(prefix='b563-hybrid-') as temp:
        temp=pathlib.Path(temp);cpp=temp/'b563.cpp';py=temp/'b563.py';exe=temp/'b563'
        cpp.write_text(lesson['cpp']);py.write_text(lesson['python'])
        meter=temp/'measure.py'
        meter.write_text('import resource, subprocess, sys\np=subprocess.run(sys.argv[2:])\nwith open(sys.argv[1], chr(119)) as f: f.write(str(resource.getrusage(resource.RUSAGE_CHILDREN).ru_maxrss))\nsys.exit(p.returncode)\n')
        subprocess.run(['g++','-std=c++17','-O2','-pipe',str(cpp),'-o',str(exe)],check=True,capture_output=True,text=True)
        for case in cases:
            for lang,cmd in [('cpp',[str(exe)]),('python',['python3',str(py)])]:
                started=time.monotonic()
                try:
                    proc=subprocess.run(cmd,input=case['input'],capture_output=True,text=True,timeout=35)
                    elapsed[lang]+=time.monotonic()-started
                    if proc.returncode or proc.stdout.split()!=case['output'].split():
                        failures.append(dict(code='b563',language=lang,kind=case['kind'],input=case['input'],expected=case['output'],actual=proc.stdout,stderr=proc.stderr,returncode=proc.returncode))
                    else:passed[lang]+=1
                except subprocess.TimeoutExpired:failures.append(dict(code='b563',language=lang,input=case['input'],error='35s timeout'))
        print('b563 correctness',passed,'/',len(cases),flush=True)
        probes=[('complete-500',500,500*499//2),('complete-3000',3000,3000*2999//2),('max-triangle-10000',10000,40001),('sparse-cutoff-10000',10000,40000)]
        for name,n,m in probes:
            file=temp/(name+'.txt')
            with file.open('w',buffering=1024*1024) as stream:
                stream.write(f'{n} {m}\n')
                if name.startswith('complete'):
                    for u in range(1,n+1):
                        for v in range(u+1,n+1):stream.write(f'{u} {v} 1\n')
                else:
                    # Valid parallel roads; forces exact threshold branch and checks minimum retention.
                    for i in range(m):stream.write(f'1 {n} {2147483647 if i%2==0 else 1}\n')
            dense=m>4*n
            row=dict(code='b563',name=name,n=n,m=m,inputBytes=file.stat().st_size,branch='dense' if dense else 'sparse',triangleBytes=4*n*(n-1)//2 if dense else 0,addressSpaceLimitBytes=256*1024**2,expected='1',reason='Every edge weight is 1, or parallel direct roads include weight 1; no path can have bottleneck <1, and a direct path of bottleneck 1 exists. Input file generated and consumed by streaming, never accumulated in memory.',timings={})
            for lang,cmd in [('cpp',[str(exe)]),('python',['python3',str(py)])]:
                rss=temp/(name+'-'+lang+'.rss');started=time.monotonic()
                with file.open('rb') as stream:
                    try:
                        proc=subprocess.run(['python3',str(meter),str(rss)]+cmd,stdin=stream,capture_output=True,text=True,timeout=55,preexec_fn=memory_limit)
                        ok=proc.returncode==0 and proc.stdout.split()==['1']
                        row['timings'][lang]=dict(seconds=time.monotonic()-started,peakRSSKiB=int(rss.read_text().strip().splitlines()[-1]),returncode=proc.returncode,output=proc.stdout.strip(),passed=ok,stderr=proc.stderr)
                        if not ok:failures.append(dict(code='b563',language=lang,kind='memory-probe',name=name,**row['timings'][lang]))
                    except subprocess.TimeoutExpired:
                        row['timings'][lang]={'timeoutSeconds':55,'passed':False}
                        failures.append(dict(code='b563',language=lang,kind='memory-probe',name=name,error='55s timeout'))
            benchmarks.append(row);print(name,row['timings'],flush=True)
    max_rss={lang:max(b['timings'][lang].get('peakRSSKiB',0) for b in benchmarks) for lang in ('cpp','python')}
    measured='；'.join(f'{lang} {max_rss[key]/1024:.2f} MiB' for key,lang in [('cpp','C++17'),('python','Python')])
    lesson['performanceNote']='本機 WSL kali-linux 實測 n=500 與 n=3000 完整圖，並在 n=10000、m=40001 強制配置最大三角矩陣；四個記憶體探針皆限制程序虛擬位址空間為 256 MiB。峰值 RSS：'+measured+'。n=10000 的矩陣本體為 199980000 bytes；稠密 Python 執行時間仍可能超過嚴格短時限，正式提交建議 C++17。詳細時間、RSS 與串流產生方法見 results-562-607.json、verify-562-607.py 的 --revise-b563。'
    assert fingerprint(lessons)==others_before,'Unexpected change to another lesson'
    assert fingerprint(checks)==other_checks_before,'Unexpected change to another problem check'
    report['runs']=[dict(code='b563',cases=len(cases),passed=passed,seconds=elapsed) if r['code']=='b563' else r for r in report['runs']]
    report['failures']=[f for f in report['failures'] if f.get('code')!='b563']+failures
    report['failureCount']=len(report['failures'])
    report['benchmarks']=[b for b in report.get('benchmarks',[]) if b['code']!='b563']+benchmarks
    report['independentCases']=len(checks);report['independentCasesPerCode']=dict(collections.Counter(r['code'] for r in checks))
    report['totalCasesPerLanguage']=sum(r['cases'] for r in report['runs'])
    report['passedPerLanguage']={lang:sum(r['passed'][lang] for r in report['runs']) for lang in ('cpp','python')}
    report['limitations']=[s for s in report['limitations'] if not s.startswith('b563:')]+['b563: dense storage now bounded by a 199980000-byte uint32 triangle plus O(n) state; measured under a 256 MiB address-space cap. Full n=10000,m≈50m runtime was not measured; Python may exceed strict time limits.']
    report['b563Revision']=dict(algorithm='Sparse m<=4n adjacency minimax Dijkstra; otherwise streaming packed uint32 lower triangle with O(n^2) heap-free minimax Dijkstra.',correctnessCases=len(cases),newDenseOracleCases=len(b563_dense_checks()),otherLessonSHA256=others_before,otherCheckSHA256=other_checks_before,other45LessonsUnchanged=True,otherProblemChecksUnchanged=True,maximumTriangleBytes=199980000,memoryProbeCount=len(benchmarks),memoryProbeRuns=2*len(benchmarks),peakRSSKiB=max_rss,failures=failures)
    checks_path.write_text(json.dumps(checks,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    DATA.write_text(json.dumps(lessons,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    report_path.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print('B563 STABLE' if not failures else 'B563 FAILURES',len(cases),'cases,',len(benchmarks)*2,'memory probes; other45 unchanged; failures',len(failures),flush=True)

if __name__=='__main__':
    if '--author' in sys.argv:
        combined=merge_hard()
        if (FIX/'results-562-607.json').exists():annotate_benchmarks(combined,json.loads((FIX/'results-562-607.json').read_text(encoding='utf-8')).get('benchmarks',[]))
        hard_evidence(combined)
        DATA.write_text(json.dumps(combined,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');print('Persisted',len(combined),'lessons')
    if '--checks' in sys.argv:
        checks=make_checks();side=FIX/'hard-562-607-checks.json'
        if side.exists():checks.extend(json.loads(side.read_text(encoding='utf-8-sig')))
        checks=[r for r in checks if not any(r['input'].split()==s['input'].split() for s in SOURCES[r['code']]['samples']) and '官方公開範例' not in r['reason']]
        (FIX/'checks-562-607.json').write_text(json.dumps(checks,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');print('Independent checks',len(checks))
    if '--verify' in sys.argv:run_verification()
    if '--finalize' in sys.argv:finalize_report()








    if '--revise-b563' in sys.argv:revise_b563()
