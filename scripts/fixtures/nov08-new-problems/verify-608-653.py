#!/usr/bin/env python3
"""Author and independently verify b608..b653. Run under Linux/WSL.

--author regenerates the lesson JSON from the explicit per-problem material here.
Default mode builds Linux C++17 executables in TemporaryDirectory and checks both
implementations against every public sample and independently computed cases.
"""
import argparse, collections, functools, itertools, json, math, pathlib, random
import subprocess, sys, tempfile, time
ROOT = pathlib.Path(__file__).resolve().parents[3]
HERE = pathlib.Path(__file__).resolve().parent
LESSONS = ROOT / 'src/lib/newProblemLessons/data/nov08-608-653.json'
MOD = 1000000007
sources = {x['code']: x for x in json.loads((HERE/'source.json').read_text(encoding='utf-8-sig'))}
lessons = []
HEADER = '#include <bits/stdc++.h>\nusing namespace std;\nusing ll=long long;\nconst ll P=1000000007;\nll pw(ll a,ll b,ll p=P){ll r=1;for(;b;b>>=1,a=a*a%p)if(b&1)r=r*a%p;return r;}\n'
def readable_cpp(source):
    """Whitespace-only formatting; preserve quoted literals and for headers."""
    lines=[]; line=''; depth=0; parens=0; quote=None; escaped=False
    def flush():
        nonlocal line
        if line.strip():lines.append('    '*depth+line.strip())
        line=''
    for c in source:
        if quote:
            line+=c
            if escaped:escaped=False
            elif c=='\\':escaped=True
            elif c==quote:quote=None
            continue
        if c in ('"',"'"):quote=c;line+=c
        elif c=='(':parens+=1;line+=c
        elif c==')':parens-=1;line+=c
        elif c=='{':line+=c;flush();depth+=1
        elif c=='}':flush();depth-=1;line='}';flush()
        elif c==';':line+=c;flush() if parens==0 else None
        elif c=='\n':flush()
        else:line+=c
    flush()
    return '\n'.join(lines)+'\n'
def add(n, topic, concept, paragraphs, complexity, pitfall, steps, cpp, py, level='medium'):
    code=f'b{n}'; s=sources[code]
    trace=[]
    for i,(description,cells,variables) in enumerate(steps):
        trace.append(dict(title=f'步驟 {i+1}：{description.split("，")[0]}',description=description,cells=list(map(str,cells)),active=list(range(len(cells))),variables=[[str(k),str(v)] for k,v in variables]))
    lessons.append(dict(code=code,title=s['title'].split('. ',1)[-1],topic=topic,level=level,concept=concept,goal=f'能以{concept}推導答案，並說明狀態與邊界處理。',explanation=paragraphs,complexity=complexity,pitfall=pitfall,sampleInput=s['samples'][0]['input'],sampleOutput=s['samples'][0]['output'],traceLabel='以下為獨立教學例子；每一步呈現實際狀態。',trace=trace,cpp=readable_cpp(HEADER+cpp),python=py+'\n'))
    performance_notes={
        608:'n 可達 10^7，Python 必須逐項生成並計算出現次數，原題 1000 ms 未保證可通過；沒有足夠 Python 語言倍率時，建議提交 C++17。',
        609:'雖然雙堆疊 OR 佇列為均攤 O(n)，n=10^7 時 Python 仍需大量 array 操作與生成運算；原題 1000 ms 未保證可通過，建議優先提交 C++17。',
        610:'單調佇列涵蓋完整範圍且以緊密 array 控制記憶體，但 n=10^7 時 Python 的環形索引與迴圈不保證在 1000 ms 內完成；建議優先提交 C++17。',
        611:'雙產生器只用 O(1) 空間，但 n=10^7 時 Python 仍需近兩千萬次產生器更新；原題 1000 ms 未保證可通過，建議優先提交 C++17。',
        614:'逆序數對稱性已把 DP 寬度減半，n=500 且 k 接近逆序數中位時，Python 仍可能有約三千萬次狀態更新；嚴格秒級時限建議使用 C++17。',
        615:'k 接近 10^6 時容斥需約一百萬次模冪，即使用內建 pow 也可能受 Python 執行時間限制；若評測器沒有足夠語言倍率，建議使用 C++17。',
        616:'區間 DP 為 O(n³)，n=500 且大量相同字元時配對轉移最多；Python 範例不保證在嚴格秒級時限通過，建議提交 C++17。',
        629:'t=100、每個 n 近 10^12 時，雙指標總計最壞約 1.4×10^8 次移動；Python 可能耗時較長。此解法的數學範圍完整，但嚴格時限請優先使用 C++17。',
        647:'n=20 時必須處理 2^20 個集合與約一千萬次有效轉移。Python 使用緊密陣列降低記憶體，仍需語言倍率才能保證嚴格秒級效能；建議使用 C++17。',
        648:'n=500 時零一背包約有三千萬次模加法更新。Python 的線性空間實作正確，但嚴格秒級時限下建議提交 C++17。',
        649:'n=5000 時有約 1250 萬次區間轉移；Python 雖只用 O(n) 記憶體，嚴格秒級時限仍建議使用 C++17。',
        650:'a,b 接近 500 時需比較數千萬個切割位置。Python 的 O(ab(a+b)) 解法不保證在嚴格秒級時限通過；建議提交 C++17。',
        652:'n=4000 且大量候選隊伍合法時需枚舉約八百萬個區間，Python 的解法涵蓋完整範圍，但嚴格秒級限制下建議使用 C++17。',
    }
    if n in performance_notes:lessons[-1]['performanceNote']=performance_notes[n]

def author():
    for n in (608,611):
        xor=n==608
        add(n,'data-structures','元素出現次數的奇偶性' if xor else '雙產生器維護滑動總和',[
            '先依線性同餘規則逐一產生元素；第一個值直接使用 x，不先取餘數。最終答案是所有完整視窗結果的 XOR。' + ('把 XOR 交換次序後，只要知道每個元素被多少個視窗包含。' if xor else '用兩個相同的產生器分別追蹤右端新值和左端離開值，不必儲存整個陣列。'),
            '以零起算位置 i 為例，包含它的視窗起點範圍是 [max(0,i-k+1),min(i,n-k)]，所以出現次數是右界減左界加一。偶數次 XOR 抵消，只累積奇數次的元素。' if xor else '右端加入 x 後，若已有超過 k 個元素，就減去第二個產生器的當前值並推進該產生器。此時總和恰為目前視窗；只有 i≥k-1 才把總和 XOR 入答案。這個不變量由每次一進一出維持。',
            'n 可達 10^7，串流計算避免建立 Python 整數列表；生成乘積可達 10^18，C++ 使用 long long。' + ('' if xor else '視窗總和可達 10^16，同樣必須使用 64 位元。')],
            '時間 O(n)，額外空間 O(1)；Python 僅讀取六個輸入整數，沒有 O(n) 輸入緩衝。10^7 次 Python 迴圈在原題 1 秒內未作保證，需評測器提供語言倍率。',
            '不要輸出每個視窗，也不要將最外層 XOR 改成加法。',
            [('陣列為 1,2,3 且 k=2',[1,2,3],[('視窗數',2)]),('第一個視窗',[1,2],[('視窗結果',3),('累積 XOR',3)]),('第二個視窗',[2,3],[('視窗結果',1 if xor else 5),('累積 XOR',2 if xor else 6)])],
            'int main(){ios::sync_with_stdio(false);cin.tie(nullptr);ll n,k,x,a,b,c;cin>>n>>k>>x>>a>>b>>c;ll ans=0,old=x,sum=0;for(ll i=0;i<n;i++){' + ('ll cnt=min(i,n-k)-max(0LL,i-k+1)+1;if(cnt&1)ans^=x;' if xor else 'sum+=x;if(i>=k){sum-=old;old=(a*old+b)%c;}if(i>=k-1)ans^=sum;') + 'x=(a*x+b)%c;}cout<<ans<<"\\n";}',
            'import sys\nn,k,x,a,b,c=map(int,sys.stdin.buffer.read().split())\nans=0\nold=x\ntotal=0\nfor i in range(n):\n'+('    count=min(i,n-k)-max(0,i-k+1)+1\n    if count&1: ans^=x\n' if xor else '    total+=x\n    if i>=k:\n        total-=old\n        old=(a*old+b)%c\n    if i>=k-1: ans^=total\n')+'    x=(a*x+b)%c\nprint(ans)')
    add(609,'data-structures','雙堆疊的 OR 聚合佇列',[
        'OR 沒有可直接消去舊值的反運算。用輸入堆疊與輸出堆疊實作佇列，每個堆疊項目另外保存從底部到此處的 OR。插入新元素時更新輸入堆疊的前綴 OR。',
        '要移除最舊元素時，若輸出堆疊為空，就把輸入堆疊逐一倒入輸出堆疊並重新計算聚合值，之後彈出輸出堆疊頂端。兩個堆疊頂端的聚合 OR 再做 OR，就是整個視窗的 OR；這來自 OR 的結合律。每個元素至多搬移一次，因此總操作數為線性。',
        'n≤10^7，Python 使用 array 的 32 位元無號整數陣列保存值與聚合，避免數百萬組 tuple 的物件負擔。只保存目前視窗，第一個 x 不先取餘數。'],
        '均攤時間 O(n)，空間 O(k)，Python 的三個 array 最多約 8k 位元組有效資料，另有容量餘裕；輸入只有六個整數。原題 1 秒對 Python 未保證，需語言倍率。',
        '移除元素不能用 OR 或 XOR 抵消；相同位元可能仍出現在其他元素中。',
        [('輸入 1 與 2',[1,2],[('輸入堆疊 OR',3)]),('倒入輸出堆疊再移除 1',[2],[('輸出堆疊 OR',2)]),('加入 4 形成下一視窗',[2,4],[('視窗 OR',6),('兩視窗 XOR',5)])],
        'int main(){ios::sync_with_stdio(false);cin.tie(nullptr);ll n,k,x,a,b,c;cin>>n>>k>>x>>a>>b>>c;vector<pair<int,int>> in,out;ll ans=0;auto push=[&](int v){in.push_back({v,v|(in.empty()?0:in.back().second)});};auto pop=[&](){if(out.empty()){while(!in.empty()){int v=in.back().first;in.pop_back();out.push_back({v,v|(out.empty()?0:out.back().second)});}}out.pop_back();};for(ll i=0;i<n;i++){push(x);if(i>=k)pop();if(i>=k-1)ans^=(in.empty()?0:in.back().second)|(out.empty()?0:out.back().second);x=(a*x+b)%c;}cout<<ans<<"\\n";}',
        'import sys\nfrom array import array\nn,k,x,a,b,c=map(int,sys.stdin.buffer.read().split())\nvalues=array("I"); agg=array("I"); out=array("I")\nans=0\nfor i in range(n):\n    values.append(x)\n    agg.append(x | (agg[-1] if agg else 0))\n    if i>=k:\n        if not out:\n            v=0\n            while values:\n                v |= values.pop()\n                out.append(v)\n            agg=array("I")\n        out.pop()\n    if i>=k-1: ans ^= (agg[-1] if agg else 0) | (out[-1] if out else 0)\n    x=(a*x+b)%c\nprint(ans)')
    add(610,'data-structures','單調佇列維護最小值',[
        '依序生成元素，用佇列保存可能成為最小值的位置和值。加入 x 前，將尾端大於等於 x 的候選刪除：新值較小且較晚過期，舊值不可能再成為最佳候選。',
        '刪除位置不在 [i-k+1,i] 的隊首後，隊首即為完整視窗最小值。每個位置只入列一次、出列一次，所以即使內層有 while，總時間仍是 O(n)。將每次隊首值 XOR 起來就是所求。'],
        '時間 O(n)，C++ 空間 O(k)；Python 使用兩個長度 k+1 的 array 環形佇列，共約 8(k+1) 位元組，輸入 O(1)。n≤10^7 的原題 1 秒對 Python 未保證，需語言倍率。',
        '過期判定使用位置而非值；相同值可保留較新的候選。',
        [('加入 3',[3],[('隊首位置',0)]),('加入 1 淘汰 3',[1],[('視窗 [3,1] 最小',1),('累積 XOR',1)]),('加入 2',[1,2],[('視窗 [1,2] 最小',1),('累積 XOR',0)])],
        'int main(){ios::sync_with_stdio(false);cin.tie(nullptr);ll n,k,x,a,b,c;cin>>n>>k>>x>>a>>b>>c;deque<pair<ll,ll>> q;ll ans=0;for(ll i=0;i<n;i++){while(!q.empty()&&q.front().first<=i-k)q.pop_front();while(!q.empty()&&q.back().second>=x)q.pop_back();q.push_back({i,x});if(i>=k-1)ans^=q.front().second;x=(a*x+b)%c;}cout<<ans<<"\\n";}',
        'import sys\nfrom array import array\nn,k,x,a,b,c=map(int,sys.stdin.buffer.read().split())\ncap=k+1\npos=array("I",[0])*cap\nval=array("I",[0])*cap\nh=t=0\nans=0\nfor i in range(n):\n    while h!=t and pos[h]<=i-k: h=(h+1)%cap\n    while h!=t and val[(t-1)%cap]>=x: t=(t-1)%cap\n    pos[t]=i; val[t]=x; t=(t+1)%cap\n    if i>=k-1: ans^=val[h]\n    x=(a*x+b)%c\nprint(ans)')
    add(612,'number-theory','相鄰禁制事件的容斥與連續區塊',[
        '對每個 i=1..n-1，令壞事件為 i 與 i+1 在排列中相鄰。選取 j 個這類事件後，相連的標籤會黏成區塊；若所選邊有 c 段連續區間，每段可正向或反向排列，因此交集大小為 2^c·(n-j)!。',
        '用兩個多項式陣列 z[j]、o[j] 計算已掃描邊中選 j 條、末邊未選或已選的權重和。略過下一邊時合併 z+o；選下一邊時由 z 開新段乘 2，由 o 延伸不乘 2。最後對每個 j 乘 (n-j)! 與 (-1)^j 相加。這正是容斥，並且每一個選邊集合恰由一條 DP 路徑生成。'],
        'n≤1000；時間 O(n²)，額外空間 O(n)，Python 的階乘與兩層陣列也都是 O(n)，輸入 O(1)。',
        '不是只輸出任一美麗排列；n=1 的答案為 1，而 n=2,3 都為 0。',
        [('n=3 時尚未選邊',[1,0,0],[('權重總和 j=0',1)]),('處理邊 1—2',[1,2,0],[('選一邊權重',2)]),('處理邊 2—3',[1,4,2],[('容斥', '6-4×2+2×1=0')])],
        'int main(){int n;cin>>n;vector<ll>z(n),o(n),f(n+1,1);z[0]=1;for(int i=1;i<=n;i++)f[i]=f[i-1]*i%P;for(int e=0;e<n-1;e++){vector<ll>a(n),b(n);for(int j=0;j<=e;j++){a[j]=(z[j]+o[j])%P;b[j+1]=(2*z[j]+o[j])%P;}z=a;o=b;}ll ans=0;for(int j=0;j<n;j++){ll v=(z[j]+o[j])*f[n-j]%P;ans=(ans+(j%2?P-v:v))%P;}cout<<ans<<"\\n";}',
        'import sys\nP=10**9+7\nn=int(sys.stdin.buffer.read())\nz=[1]+[0]*(n-1); o=[0]*n\nf=[1]*(n+1)\nfor i in range(1,n+1): f[i]=f[i-1]*i%P\nfor e in range(n-1):\n    a=[0]*n; b=[0]*n\n    for j in range(e+1):\n        a[j]=(z[j]+o[j])%P\n        b[j+1]=(2*z[j]+o[j])%P\n    z,o=a,b\nprint(sum((-1)**j*(z[j]+o[j])*f[n-j] for j in range(n))%P)', 'hard')
    add(613,'dp','黑白對角線分離的主教計數',[
        '主教不會離開原本顏色，因此先按 r+c 的奇偶分成兩群對角線，每群由短到長處理。令 dp[j] 是已處理對角線中放 j 個互不攻擊主教的方式。',
        '對長度 L 的新對角線，只能放零個或一個主教。若先前已有 j-1 個主教，它們分別封鎖新對角線上一個不同格子，剩下 L-(j-1) 格；這是同色對角線依長度排序後，其相交的另一方向對角線集合逐步包含的性質。因此倒序更新 dp[j]+=dp[j-1]·(L-j+1)。最後卷積黑白兩色的數量。',
        'n=1 時最多一個，n≥2 時最多 2n-2 個主教；超出上限立即輸出 0，不能按輸入 k≤n² 配置二維表。'],
        '時間 O(n·min(k,2n))，空間 O(min(k,2n))；n≤500。Python 的兩組計數陣列與對角線長度 O(n+k)，輸入 O(1)。',
        '同色對角線必須由短到長；主教不區分，最後不乘 k!。',
        [('2×2 黑色對角線長 2',[1,2],[('黑色放 0/1', '1/2')]),('白色同樣有兩格',[1,2],[('白色放 0/1','1/2')]),('合併恰放兩個',[2,2],[('答案','2×2=4')])],
        'int main(){int n,k;cin>>n>>k;if(k>(n==1?1:2*n-2)){cout<<0<<"\\n";return 0;}vector<vector<ll>>d(2,vector<ll>(k+1));for(int c=0;c<2;c++){d[c][0]=1;vector<int>v;for(int s=c;s<2*n-1;s+=2)v.push_back(n-abs(n-1-s));sort(v.begin(),v.end());for(int L:v)for(int j=k;j>=1;j--)if(L>=j)d[c][j]=(d[c][j]+d[c][j-1]*(L-j+1))%P;}ll ans=0;for(int j=0;j<=k;j++)ans=(ans+d[0][j]*d[1][k-j])%P;cout<<ans<<"\\n";}',
        'import sys\nP=10**9+7\nn,k=map(int,sys.stdin.buffer.read().split())\nif k>(1 if n==1 else 2*n-2):\n    print(0); sys.exit()\nd=[]\nfor c in range(2):\n    dp=[1]+[0]*k\n    for L in sorted(n-abs(n-1-s) for s in range(c,2*n-1,2)):\n        for j in range(min(k,L),0,-1): dp[j]=(dp[j]+dp[j-1]*(L-j+1))%P\n    d.append(dp)\nprint(sum(d[0][j]*d[1][k-j] for j in range(k+1))%P)', 'hard')
    add(614,'dp','插入最大值與滑動區間和',[
        '把最大值 i 插入長度 i-1 的排列，放在距離右端 t 個元素的位置會新增 t 個逆序對，t 可為 0..i-1。故 new[j]=sum(old[j-t])，每個排列刪除最大值後的來源唯一。',
        '相鄰 j 的求和區間僅差一進一出，用滑動和使每個狀態 O(1)。另外將排列數值全部改為 n+1-x，逆序數從 k 變成 n(n-1)/2-k，因此可取兩者較小值縮小 DP。初始空排列恰有零個逆序對。'],
        '時間 O(n·min(k,n(n-1)/2-k))（另加 O(n)），空間 O(min(k,n(n-1)/2-k)+1)；n≤500，Python 最多約 3.2 萬格兩層 DP，輸入 O(1)。',
        '加入最大值最多產生 i-1 個逆序，滑動和要減 old[j-i]，不是 old[j-i+1]。',
        [('僅有數字 1',[1,0],[('逆序 0/1 的數量','1/0')]),('插入數字 2',[1,1],[('排列','12,21')]),('插入數字 3',[1,2,2,1],[('恰一逆序',2)])],
        'int main(){int n,k;cin>>n>>k;k=min(k,n*(n-1)/2-k);vector<ll>d(k+1);d[0]=1;for(int i=1;i<=n;i++){vector<ll>e(k+1);ll s=0;for(int j=0;j<=k;j++){s=(s+d[j])%P;if(j>=i)s=(s-d[j-i]+P)%P;e[j]=s;}d=e;}cout<<d[k]<<"\\n";}',
        'import sys\nP=10**9+7\nn,k=map(int,sys.stdin.buffer.read().split())\nk=min(k,n*(n-1)//2-k)\nd=[1]+[0]*k\nfor i in range(1,n+1):\n    e=[0]*(k+1); total=0\n    for j in range(k+1):\n        total+=d[j]\n        if j>=i: total-=d[j-i]\n        total%=P; e[j]=total\n    d=e\nprint(d[k])')

    add(615,'number-theory','缺少符號的容斥計數',[
        '先允許所有長度 n 的序列，共 k^n 個。指定 i 種符號完全不出現時，只能從其餘 k-i 種選擇，各位置獨立，得到 (k-i)^n 個；指定缺少種類有 C(k,i) 種選法。',
        '依容斥原理，答案為 Σ(-1)^i C(k,i)(k-i)^n。含有恰好 r 種缺失符號的序列，其總係數為 (1-1)^r，因此只有 r=0 的序列保留。用階乘與反階乘 O(1) 取得每個組合數，冪次採二分冪。'],
        '時間 O(k log n)，空間 O(k)；k≤n≤10^6。Python 階乘、反階乘列表 O(k)（整數物件與指標皆占空間），輸入僅兩個數。',
        '元素範圍是 1..k，且每種都必須出現，不是所有相鄰元素相異。',
        [('n=3,k=2 的全部序列',[8],[('全部',8)]),('扣掉只用一種符號的序列',[1,1],[('扣除',2)]),('兩種都缺少無法填滿',[0],[('答案',6)])],
        'int main(){int n,k;cin>>n>>k;vector<ll>f(k+1,1),g(k+1);for(int i=1;i<=k;i++)f[i]=f[i-1]*i%P;g[k]=pw(f[k],P-2);for(int i=k;i;i--)g[i-1]=g[i]*i%P;ll ans=0;for(int i=0;i<=k;i++){ll v=f[k]*g[i]%P*g[k-i]%P*pw(k-i,n)%P;ans=(ans+(i%2?P-v:v))%P;}cout<<ans<<"\\n";}',
        'import sys\nP=10**9+7\nn,k=map(int,sys.stdin.buffer.read().split())\nf=[1]*(k+1); g=[1]*(k+1)\nfor i in range(1,k+1): f[i]=f[i-1]*i%P\ng[k]=pow(f[k],P-2,P)\nfor i in range(k,0,-1): g[i-1]=g[i]*i%P\nans=0\nfor i in range(k+1): ans=(ans+(-1 if i&1 else 1)*f[k]*g[i]%P*g[k-i]%P*pow(k-i,n,P))%P\nprint(ans)')
    add(616,'dp','首字元配對與操作交錯的區間 DP',[
        '令 dp[l][r] 表示半開區間 [l,r) 的刪除順序數，空區間為 1、奇數長度為 0。首字元 l 必須和某個同字元位置 j 一起刪掉；在它們相鄰之前，內部 [l+1,j) 必須已清空，所以 j-l 必須是奇數。',
        '設整段需 L=(r-l)/2 次操作，內部需 t=(j-l-1)/2 次。內部 t 次操作後再刪首對，共 t+1 次，其順序受首對最後刪的限制；右區間 [j+1,r) 的操作可任意穿插。選出這 t+1 次操作的位置有 C(L,t+1) 種。因此累加 dp[l+1][j]·dp[j+1][r]·C(L,t+1)。每個刪除序列的首字元搭檔唯一，故無重複。'],
        'n≤500；時間 O(n³)，空間 O(n²)，Python 的 DP、組合數表及字串緩衝都是 O(n²)。Python 三重迴圈在嚴格秒級限制下可能需要語言倍率，未作最壞時間保證。',
        '同樣刪成 aaaa→aa，選左、中、右相鄰對仍是三種操作，不能只計算結果字串。',
        [('四個 a 尚未刪除',['a','a','a','a'],[('可選第一對',3)]),('先刪中間兩個',['a','a'],[('此分支剩餘操作',1)]),('另外兩個首步也各有一種結尾',['空'],[('總刪除順序',3)])],
        'int main(){string s;cin>>s;int n=s.size();vector<vector<ll>>C(n/2+1,vector<ll>(n/2+1)),d(n+1,vector<ll>(n+1));for(int i=0;i<=n/2;i++){C[i][0]=C[i][i]=1;for(int j=1;j<i;j++)C[i][j]=(C[i-1][j-1]+C[i-1][j])%P;}for(int i=0;i<=n;i++)d[i][i]=1;for(int len=2;len<=n;len+=2)for(int l=0;l+len<=n;l++){int r=l+len;for(int j=l+1;j<r;j+=2)if(s[l]==s[j])d[l][r]=(d[l][r]+d[l+1][j]*d[j+1][r]%P*C[len/2][(j-l+1)/2])%P;}cout<<d[0][n]<<"\\n";}',
        'import sys\nP=10**9+7\ns=sys.stdin.buffer.read().strip(); n=len(s)\nC=[[0]*(n//2+1) for _ in range(n//2+1)]\nfor i in range(n//2+1):\n    C[i][0]=C[i][i]=1\n    for j in range(1,i): C[i][j]=(C[i-1][j-1]+C[i-1][j])%P\nd=[[0]*(n+1) for _ in range(n+1)]\nfor i in range(n+1): d[i][i]=1\nfor length in range(2,n+1,2):\n    for l in range(n-length+1):\n        r=l+length; total=0\n        for j in range(l+1,r,2):\n            if s[l]==s[j]: total=(total+d[l+1][j]*d[j+1][r]*C[length//2][(j-l+1)//2])%P\n        d[l][r]=total\nprint(d[0][n])','hard')
    add(617,'strings','KMP 自動機計數未出現模式的字串',[
        '以目前字尾和模式前綴相符的最長長度作為狀態 q。KMP 失敗函數可以在失配時跳往最長可接續前綴，預先建立每個 q 與 26 個字母的轉移。',
        'DP 只保留從未抵達完整模式長度 m 的路徑；每加一字母就按自動機轉移，抵達 m 的轉移直接捨棄。這樣恰好計出完全不含模式的字串，答案為 26^n 減去它。以補集處理可避免多次出現模式時重複計數，也自然處理模式重疊。'],
        '時間 O(26nm+26m²)，空間 O(26m+m)；n≤1000、m≤100。Python 的兩層 DP、自動機及輸入字串 O(26m)，沒有儲存所有長度的狀態。',
        'AA 在 AAA 中出現兩次，但 AAA 只能算一次；不能直接相加每個出現位置的貢獻。',
        [('模式 AA、長度 0',[1,0],[('未出現狀態 q=0/1','1/0')]),('加入第一個字母',[25,1],[('未出現總數',26)]),('加入第二個字母',[650,25],[('含 AA','676-675=1')])],
        'int main(){int n;string s;cin>>n>>s;int m=s.size();vector<int>pi(m);for(int i=1;i<m;i++){int j=pi[i-1];while(j&&s[i]!=s[j])j=pi[j-1];if(s[i]==s[j])j++;pi[i]=j;}vector<array<int,26>>go(m);for(int q=0;q<m;q++)for(int c=0;c<26;c++){int j=q;while(j&&s[j]!=char(65+c))j=pi[j-1];if(s[j]==char(65+c))j++;go[q][c]=j;}vector<ll>d(m);d[0]=1;for(int i=0;i<n;i++){vector<ll>e(m);for(int q=0;q<m;q++)for(int c=0;c<26;c++){int j=go[q][c];if(j<m)e[j]=(e[j]+d[q])%P;}d=e;}ll ans=pw(26,n);for(ll v:d)ans=(ans-v+P)%P;cout<<ans<<"\\n";}',
        'import sys\nP=10**9+7\na=sys.stdin.buffer.read().split(); n=int(a[0]); s=a[1]; m=len(s)\npi=[0]*m\nfor i in range(1,m):\n    j=pi[i-1]\n    while j and s[i]!=s[j]: j=pi[j-1]\n    if s[i]==s[j]: j+=1\n    pi[i]=j\ngo=[]\nfor q in range(m):\n    row=[]\n    for c in range(65,91):\n        j=q\n        while j and s[j]!=c: j=pi[j-1]\n        if s[j]==c: j+=1\n        row.append(j)\n    go.append(row)\nd=[1]+[0]*(m-1)\nfor _ in range(n):\n    e=[0]*m\n    for q,v in enumerate(d):\n        for j in go[q]:\n            if j<m: e[j]=(e[j]+v)%P\n    d=e\nprint((pow(26,n,P)-sum(d))%P)')
    add(618,'dp','零一背包的可達金額',[
        '令 reachable[s] 表示已處理硬幣能否恰湊金額 s，開始僅 0 可達。處理面額 x 時，舊狀態 s 可以產生新狀態 s+x，也可選擇不用此硬幣。',
        'C++ 由大到小更新金額，確保同一枚硬幣不被再次使用；Python 用大整數的第 s 位保存可達性，bits | (bits<<x) 同時完成所有轉移。最後排除金額 0，依升序列出置位的金額。'],
        '總面額 S≤100000。C++ 時間 O(nS)、空間 O(S)；Python 位元更新 O(nS/w)，以最低置位反覆取出輸出最壞 O(S²/w)，w 為大整數 limb 位數；位元儲存 O(S)，輸入 O(n)，輸出列表與文字緩衝 O(S log S) 位元組上界。',
        '面額相同的硬幣仍能各使用一次，但相同金額只輸出一次，零金額不輸出。',
        [('尚無硬幣',[0],[('可達正金額數',0)]),('加入面額 2',[0,2],[('可達正金額數',1)]),('再加入面額 2',[0,2,4],[('輸出','2 和 4')])],
        'int main(){int n;cin>>n;vector<int>a(n);int S=0;for(int &x:a){cin>>x;S+=x;}vector<bool>d(S+1);d[0]=1;for(int x:a)for(int s=S;s>=x;s--)d[s]=d[s]||d[s-x];vector<int>v;for(int s=1;s<=S;s++)if(d[s])v.push_back(s);cout<<v.size()<<"\\n";for(int x:v)cout<<x<<" ";cout<<"\\n";}',
        'import sys\na=list(map(int,sys.stdin.buffer.read().split()))\nbits=1\nfor x in a[1:]: bits |= bits<<x\nbits ^= 1\nans=[]\nwhile bits:\n    low=bits & -bits\n    ans.append(str(low.bit_length()-1))\n    bits ^= low\nprint(len(ans))\nprint(" ".join(ans))','easy')
    add(619,'dp','塔頂分隔與連接的兩狀態',[
        '把寬 2 的塔在最高一列分成兩類：左右兩格屬於兩塊不同的積木（分隔態 A），或同屬一塊寬 2 的積木（連接態 B）。高度 1 時兩態各有一種。',
        '從分隔態往上延伸，兩根窄積木可各自延長或切開，得到 4 種分隔延伸；從連接態轉分隔只有一種。連接態可由分隔態開新寬積木，或從連接態延長／重開寬積木，故 A′=4A+B、B′=A+2B。每個新塔移除最頂層後的類型與切縫唯一，沒有漏算或重算。多組查詢可排序後一次遞推。'],
        '時間 O(max n+t log t)，空間 O(t)，最大高度 10^6、t≤100。Python 只保存查詢、排序及答案，兩個狀態為 O(1)，不需要百萬格預處理表。',
        '舊 A、B 要同時更新；積木可以有任意正整數高度，不是單純 2×n 骨牌鋪法。',
        [('高度 1',[1,1],[('總數',2)]),('高度 2',[5,3],[('總數',8)]),('高度 3',[23,11],[('總數',34)])],
        'int main(){int t;cin>>t;vector<pair<int,int>>q(t);for(int i=0;i<t;i++){cin>>q[i].first;q[i].second=i;}sort(q.begin(),q.end());vector<ll>ans(t);ll a=1,b=1;int h=1;for(auto [n,id]:q){while(h<n){ll c=(4*a+b)%P;b=(a+2*b)%P;a=c;h++;}ans[id]=(a+b)%P;}for(ll v:ans)cout<<v<<"\\n";}',
        'import sys\na=list(map(int,sys.stdin.buffer.read().split()))\nq=sorted((n,i) for i,n in enumerate(a[1:]))\nans=[0]*a[0]\nu=v=1; h=1; P=10**9+7\nfor n,i in q:\n    while h<n:\n        u,v=(4*u+v)%P,(u+2*v)%P\n        h+=1\n    ans[i]=(u+v)%P\nprint("\\n".join(map(str,ans)))')
    add(620,'greedy','總工時與最長書的排程下界',[
        '令 S 為所有書的閱讀時間總和、M 為最長書時間。每人都要讀 S 時間，所以完工至少為 S；最長那本必須讓兩人先後讀，也至少需要 2M。',
        '令其餘書總長 T=S-M。甲先讀最長書，再按任一固定順序讀其餘書；乙先按同一順序讀其餘書，再讀最長書。同一本其餘書在兩人的開始時間恰相差 M，而其長度至多 M，所以不會同時閱讀。若 T≥M，最長書的兩個時段也不交疊，總長 S；若 T<M，乙讀完其餘書後等到時間 M，再讀最長書，總長 2M。這給出了達成兩個下界最大值的具體排程。'],
        '時間 O(n)，n≤2×10^5。C++ 額外空間 O(1)，Python 一次讀取與整數列表 O(n)；總和可達 2×10^14，C++ 用 long long。',
        '不是把書分給兩人各讀一部分；兩人都必須讀完每本書。',
        [('書長 2,3,7',[2,3,7],[('S',12),('2M',14)]),('甲先讀 7 乙讀 2 與 3',[7,5],[('乙等待',2)]),('兩人交換書群',[14,12],[('最短完工',14)])],
        'int main(){int n;cin>>n;ll s=0,m=0,x;while(n--){cin>>x;s+=x;m=max(m,x);}cout<<max(s,2*m)<<"\\n";}',
        'import sys\na=list(map(int,sys.stdin.buffer.read().split()))[1:]\nprint(max(sum(a),2*max(a)))','easy')
    add(621,'number-theory','每種數值至多選一個位置的乘法原理',[
        '把相同數值的位置分組。某數值若出現 c 次，合法子序列對這組只有 c+1 種決定：完全不選，或選其中任一個位置。其他值的決定相互獨立。',
        '每組選完位置後，把所選位置由小到大排列，會唯一決定一個子序列，因此總數是 Π(c+1)。其中包含全部不選的空子序列，最後減一。不能用一般「不同數值序列去重」的遞推，因為本題即使數值序列相同，選取位置不同仍分別計數。'],
        '期望時間 O(n)，空間 O(n)；n≤2×10^5、值≤10^9，用雜湊計數。Python 輸入 token、整數與頻率表 O(n)，結果每步取模。',
        '例如 [1,1] 有兩個合法非空子序列，不是 1 個，也不能同時選兩個 1。',
        [('值 1 有兩個位置',[2],[('選法含不選',3)]),('值 2 有一個位置',[2,1],[('乘積',6)]),('排除全不選',[2,1],[('非空答案',5)])],
        'int main(){ios::sync_with_stdio(false);cin.tie(nullptr);int n,x;cin>>n;unordered_map<int,int>f;while(n--){cin>>x;f[x]++;}ll ans=1;for(auto [v,c]:f)ans=ans*(c+1)%P;cout<<(ans+P-1)%P<<"\\n";}',
        'import sys\nfrom collections import Counter\na=list(map(int,sys.stdin.buffer.read().split()))\nans=1\nfor c in Counter(a[1:]).values(): ans=ans*(c+1)%(10**9+7)\nprint((ans-1)%(10**9+7))','easy')
    for n in (622,625):
        count=n==622
        add(n,'search','最後出現位置與不重複視窗'+('計數' if count else '最長長度'),[
            '從左到右掃描，維護最小合法左端 L，以及每個值上次出現的位置。新值出現在 R 時，若之前在 p 出現，左端必須至少移到 p+1，故更新 L=max(L,p+1)。',
            '更新後 [L,R] 恰是以 R 結尾、最長且無重複的區間。' + ('所有起點 L..R 都合法，起點小於 L 必含重複，故新增 R-L+1 個子陣列；按右端分類恰好各計一次。' if count else '每個右端只需考慮這個最長合法區間，其餘合法區間更短；沿途取 R-L+1 的最大值就是全域最長片段。')],
            '期望時間 O(n)，空間 O(n)；n≤2×10^5。Python 全部輸入、整數與最後位置表 O(n)。'+('答案最大 n(n+1)/2，C++ 用 long long。' if count else '左右指標各只向右移。'),
            '舊出現位置若已在視窗外，不能讓 L 往回移；一定用 max。',
            [('讀入第一個 1',[1],[('L',0),('答案',1)]),('讀入 2',[1,2],[('L',0),('答案',3 if count else 2)]),('再次讀入 1',[2,1],[('L',1),('答案',5 if count else 2)])],
            'int main(){ios::sync_with_stdio(false);cin.tie(nullptr);int n,x,L=0;cin>>n;unordered_map<int,int>last;ll ans=0;for(int r=0;r<n;r++){cin>>x;if(last.count(x))L=max(L,last[x]+1);last[x]=r;'+('ans+=r-L+1;' if count else 'ans=max(ans,(ll)r-L+1);')+'}cout<<ans<<"\\n";}',
            'import sys\na=list(map(int,sys.stdin.buffer.read().split()))\nlast={}; left=0; ans=0\nfor r,x in enumerate(a[1:]):\n    left=max(left,last.get(x,-1)+1)\n    last[x]=r\n'+('    ans+=r-left+1\n' if count else '    ans=max(ans,r-left+1)\n')+'print(ans)','easy')
    add(623,'search','可生產量單調性的答案二分',[
        '給定時間 T，第 i 台機器可做 floor(T/k_i) 件，各台並行所以總量相加。總量隨 T 單調不減，因此「能否達到 t 件」是可二分的判定。',
        '以 lo=0、hi=min(k_i)·t 起始，hi 至少能靠最快機器達標。每次 mid 若足夠就縮小 hi，否則 lo=mid+1。保持最小可行時間落在 [lo,hi]，區間縮成一點時即為答案；累加到 t 就可提早停止。'],
        '時間 O(n log(min(k_i)·t))，空間 O(n)；n≤2×10^5、上界≤10^18。Python 輸入與機器列表 O(n)，C++ 累計達 t 即停止避免溢位。',
        '單台機器每完成一個完整週期才增加一件，不能用浮點數速率推算後四捨五入。',
        [('機器週期為 2 與 3',[2,3],[('目標',4)]),('時間 5',[2,1],[('總產量',3),('可行','否')]),('時間 6',[3,2],[('總產量',5),('最短時間',6)])],
        'int main(){ios::sync_with_stdio(false);cin.tie(nullptr);int n;ll t;cin>>n>>t;vector<ll>a(n);for(ll&x:a)cin>>x;ll l=0,r=*min_element(a.begin(),a.end())*t;while(l<r){ll mid=l+(r-l)/2,s=0;for(ll x:a){s+=mid/x;if(s>=t)break;}if(s>=t)r=mid;else l=mid+1;}cout<<l<<"\\n";}',
        'import sys\na=list(map(int,sys.stdin.buffer.read().split()))\nn,t=a[:2]; machines=a[2:]\nlo=0; hi=min(machines)*t\nwhile lo<hi:\n    mid=(lo+hi)//2; made=0\n    for x in machines:\n        made+=mid//x\n        if made>=t: break\n    if made>=t: hi=mid\n    else: lo=mid+1\nprint(lo)')
    add(624,'greedy','以最小可承接塔頂作替換',[
        '把每座塔的頂端大小由小到大儲存。新方塊 x 必須放在嚴格大於 x 的塔頂上，因此二分找第一個 >x 的位置；找到就替換成 x，找不到才開新塔。',
        '若其他合法安排把 x 放在更大的頂端上，交換兩座塔的後續安排，可以改放到最小可承接頂端；這留下的較大頂端只會更容易承接未來方塊。等價地，貪心後排序塔頂逐項不大於任何同塔數方案，歸納可知需要新塔時其他方案也無法避免。'],
        '時間 O(n log n)，空間 O(n)，n≤2×10^5。Python bisect_right 及塔頂列表 O(n)，全量輸入緩衝 O(n)。',
        '上方必須嚴格較小，相等方塊不能疊，用 upper_bound／bisect_right。',
        [('加入 3',[3],[('塔數',1)]),('加入 3 找不到嚴格較大塔頂',[3,3],[('塔數',2)]),('加入 2 替換第一個 3',[2,3],[('塔數',2)])],
        'int main(){ios::sync_with_stdio(false);cin.tie(nullptr);int n,x;cin>>n;vector<int>t;while(n--){cin>>x;auto it=upper_bound(t.begin(),t.end(),x);if(it==t.end())t.push_back(x);else *it=x;}cout<<t.size()<<"\\n";}',
        'import sys\nfrom bisect import bisect_right\na=list(map(int,sys.stdin.buffer.read().split()))\nt=[]\nfor x in a[1:]:\n    j=bisect_right(t,x)\n    if j==len(t): t.append(x)\n    else: t[j]=x\nprint(len(t))')
    add(626,'basics','相鄰目標值的位置斷點',[
        '先建立 pos[v]，記錄數值 v 在陣列中的位置。收集 v 後，如果 pos[v+1]>pos[v]，同一輪繼續向右即可收集下一個數；反之必須開新一輪。',
        '每個位置下降的相鄰數值對都強迫新增一輪，而兩個下降斷點之間的位置嚴格遞增，確實能在同一輪依序收集。因此答案等於 1 加上 pos[v+1]<pos[v] 的次數。'],
        '時間 O(n)，空間 O(n)，n≤2×10^5；Python 輸入緩衝、整數列表與位置陣列均為 O(n)。',
        '比較的是相鄰「數值」的位置，不是原陣列相鄰元素的大小。',
        [('排列 3,1,2 的位置表',[1,2,0],[('pos[1]',1)]),('1 到 2 位置向右',[1,2],[('輪數',1)]),('2 到 3 位置下降',[2,0],[('輪數',2)])],
        'int main(){int n,x;cin>>n;vector<int>p(n+1);for(int i=0;i<n;i++){cin>>x;p[x]=i;}int ans=1;for(int v=1;v<n;v++)ans+=p[v+1]<p[v];cout<<ans<<"\\n";}',
        'import sys\na=list(map(int,sys.stdin.buffer.read().split())); n=a[0]\npos=[0]*(n+1)\nfor i,x in enumerate(a[1:]): pos[x]=i\nprint(1+sum(pos[v+1]<pos[v] for v in range(1,n)))','easy')
    add(627,'greedy','連續可湊金額的覆蓋不變量',[
        '將硬幣排序，令 R 表示已處理硬幣恰能覆蓋所有 [0,R] 金額，初始 R=0。對下一枚 x，若 x≤R+1，使用它可覆蓋 [x,x+R]，與原區間相連，新的覆蓋上界是 R+x。',
        '若 x>R+1，舊硬幣最多湊到 R，而任何包含 x 或更大硬幣的金額至少是 x，所以 R+1 不可能湊出，且更小正金額都已可達。掃完仍無缺口時答案為總和加一。'],
        '時間 O(n log n)，空間 O(n)；n≤2×10^5，金額總和≤2×10^14，用 64 位元。Python 排序、輸入及整數列表 O(n)。',
        '不是找未出現的最小面額；多枚硬幣可相加填補缺口。',
        [('處理面額 1',[0,1],[('R',1)]),('處理面額 2',[0,1,2,3],[('R',3)]),('下一枚為 5',[4,5],[('第一個缺口',4)])],
        'int main(){int n;cin>>n;vector<ll>a(n);for(ll&x:a)cin>>x;sort(a.begin(),a.end());ll r=0;for(ll x:a){if(x>r+1)break;r+=x;}cout<<r+1<<"\\n";}',
        'import sys\na=list(map(int,sys.stdin.buffer.read().split()))\nr=0\nfor x in sorted(a[1:]):\n    if x>r+1: break\n    r+=x\nprint(r+1)','easy')
    add(628,'sorting','絕對偏差總和的中位數最小化',[
        '若共同長度從整數 L 增為 L+1，每根不大於 L 的木棒費用增加 1，每根大於 L 的木棒費用減少 1。因此當左邊數量較少時，向右移不會增加總費用。',
        '移到中位數後，左右各至多一半，向任一方向離開都無法降低費用。排序後取 a[n/2]，累加每根與此值的絕對差。偶數長度時，中間兩值之間的所有整數同樣最佳。'],
        '時間 O(n log n)，空間 O(n)；n≤2×10^5，費用可達約 2×10^14，C++ 用 long long。Python 輸入、排序列表及整數物件 O(n)。',
        '平均數最小化的是平方誤差，不能用在本題絕對差費用。',
        [('排序木棒',[1,2,8],[('中位數',2)]),('改短長棒',[0,0,6],[('長棒費用',6)]),('改長短棒',[1,0,6],[('總費用',7)])],
        'int main(){int n;cin>>n;vector<ll>a(n);for(ll&x:a)cin>>x;sort(a.begin(),a.end());ll ans=0;for(ll x:a)ans+=abs(x-a[n/2]);cout<<ans<<"\\n";}',
        'import sys\na=sorted(map(int,sys.stdin.buffer.read().split()[1:]))\nm=a[len(a)//2]\nprint(sum(abs(x-m) for x in a))','easy')
    add(629,'number-theory','三角數判定與雙指標搜尋兩數和',[
        '三角數 T_k=k(k+1)/2 嚴格遞增，8n+1 為完全平方數時 n 本身就是三角數，答案為 1。否則搜尋兩個正三角數之和是否等於 n。',
        '令左指標為 1、右指標為不超過 n 的最大三角數索引。和太小時增加左指標，太大時減少右指標；由單調性，被跳過的組合都不可能符合。若找到答案為 2，否則由高斯三角數定理，任何非負整數都能寫成至多三個非負三角數，且既然 1、2 個都不可行，此時三個必全為正，答案為 3。'],
        '每筆時間 O(√n)，額外空間 O(1)，t≤100、n≤10^12，最多約 1.4×10^8 次雙指標迭代。Python 在如此多最大測試下可能很慢，未保證秒級時限；其輸入及輸出緩衝 O(t)，不建立三角數列表。',
        '平方根必須做整數校正；n 很大時不要用 O(n) 的硬幣 DP。',
        [('n=8 且不是三角數',[1,3,6],[('初始和','1+6=7')]),('左指標前進到 3',[3,6],[('和',9)]),('右指標退到 3 後搜尋結束',[3,3],[('答案',3)])],
        'll root(ll x){ll r=sqrtl(x);while((r+1)*(r+1)<=x)r++;while(r*r>x)r--;return r;}ll tri(ll k){return k*(k+1)/2;}int main(){int t;cin>>t;while(t--){ll n;cin>>n;ll z=root(8*n+1);if(z*z==8*n+1){cout<<1<<"\\n";continue;}ll l=1,r=(z-1)/2;bool ok=false;while(l<=r){ll s=tri(l)+tri(r);if(s==n){ok=true;break;}if(s<n)l++;else r--;}cout<<(ok?2:3)<<"\\n";}}',
        'import sys\nfrom math import isqrt\ndef solve(n):\n    z=isqrt(8*n+1)\n    if z*z==8*n+1: return 1\n    l=1; r=(z-1)//2\n    while l<=r:\n        s=l*(l+1)//2+r*(r+1)//2\n        if s==n: return 2\n        if s<n: l+=1\n        else: r-=1\n    return 3\na=list(map(int,sys.stdin.buffer.read().split()))\nprint("\\n".join(str(solve(n)) for n in a[1:]))')
    add(630,'number-theory','旋轉群的 Burnside 平均',[
        '不能直接把 2^(n²) 除以 4，因為某些圖案旋轉後不變，軌道大小小於 4。Burnside 引理說，不同旋轉等價類數等於四種旋轉各自固定圖案數的平均。',
        '固定圖案必須在旋轉的每個格子循環上同色，每個循環可選黑白兩種。0 度有 n² 個循環，180 度有 ceil(n²/2) 個循環，90 與 270 度各有 floor(n²/4)+(n mod 2) 個循環。將相應的 2 次冪相加，乘 4 的模反元素。奇數棋盤唯一的中心格單獨成一循環。'],
        '時間 O(log(n²))，空間 O(1)；n≤10^9，n²≤10^18，C++ 用 long long，不能先對指數模 P。Python 輸入及冪模運算暫存 O(log n) 位元。',
        '本題不合併鏡射圖案，群只有四種旋轉，不是八種對稱。',
        [('2×2 的 0 度固定圖案',[4],[('數量','2^4=16')]),('180 度與兩個四分之一轉',[2,1,1],[('固定數','4,2,2')]),('四種固定數平均',[16,4,2,2],[('等價類',6)])],
        'int main(){ll n;cin>>n;ll s=n*n;ll ans=(pw(2,s)+pw(2,(s+1)/2)+2*pw(2,s/4+n%2))%P;cout<<ans*pw(4,P-2)%P<<"\\n";}',
        'import sys\nn=int(sys.stdin.buffer.read()); P=10**9+7; s=n*n\nprint((pow(2,s,P)+pow(2,(s+1)//2,P)+2*pow(2,s//4+n%2,P))*pow(4,P-2,P)%P)')
    add(631,'number-theory','依旋轉循環數分組的項鍊計數',[
        '把珠子位置視為長度 n 的環，旋轉 r 格會分出 gcd(n,r) 個循環，同一循環必須同色才能被該旋轉固定，所以固定圖案數為 m^gcd(n,r)。Burnside 取 n 個旋轉的平均。',
        '將 gcd 相同的旋轉合併，可得 Σ_{d|n} φ(d)·m^(n/d)，最後除以 n。先篩出 φ(1)..φ(n)，僅在 n 的因數位置計算冪次。因 n≤10^6<P，模意義下能乘 n 的反元素。'],
        '時間 O(n log log n+τ(n) log n)，空間 O(n)，n,m≤10^6；Python φ 整數列表 O(n)，輸入 O(1)。',
        '旋轉相同才合併，翻轉不合併；不是直接用 m^n/n。',
        [('n=3,m=2 的不旋轉狀態',[3],[('固定數',8)]),('旋轉 1 格及 2 格',[1,1],[('各自固定數',2)]),('取平均',[8,2,2],[('項鍊數',4)])],
        'int main(){int n,m;cin>>n>>m;vector<int>phi(n+1);iota(phi.begin(),phi.end(),0);for(int p=2;p<=n;p++)if(phi[p]==p)for(int j=p;j<=n;j+=p)phi[j]-=phi[j]/p;ll ans=0;for(int d=1;d<=n;d++)if(n%d==0)ans=(ans+phi[d]*pw(m,n/d))%P;cout<<ans*pw(n,P-2)%P<<"\\n";}',
        'import sys\nn,m=map(int,sys.stdin.buffer.read().split()); P=10**9+7\nphi=list(range(n+1))\nfor p in range(2,n+1):\n    if phi[p]==p:\n        for j in range(p,n+1,p): phi[j]-=phi[j]//p\nans=sum(phi[d]*pow(m,n//d,P) for d in range(1,n+1) if n%d==0)%P\nprint(ans*pow(n,P-2,P)%P)')
    for number in (632,633):
        prefix=number==632
        add(number,'number-theory','反射原理計算'+('括號前綴的合法補法' if prefix else 'Catalan 數'),[
            ('先掃描已知前綴，若任何時刻餘額為負，或左括號數超過 n/2，就已不可能補成合法序列。剩下 r 個位置，還需要 u 個左括號，忽略途中餘額限制共有 C(r,u) 種。' if prefix else '長度 n 若為奇數必定無解。n=2q 時，忽略前綴限制的序列有 C(2q,q) 種；需要扣掉某前綴右括號較多的序列。'),
            ('把第一次跌到 -1 之前的路徑反射，可把壞補法一對一對應到左括號數為 u-1 的路徑，因此合法補法為 C(r,u)-C(r,u-1)。這裡起始餘額由前綴決定，但反射後用組合數對稱性仍得到此式。' if prefix else '將第一次餘額跌到 -1 以前的括號對調，壞序列一對一對應到左括號 q+1 個的序列，因此答案 C(2q,q)-C(2q,q+1)。這與 C(2q,q)/(q+1) 等價。'),
            '所有階乘的索引至多 n≤10^6，小於模數，使用反階乘取得組合數；超出索引範圍的組合數定義為 0。'],
            '時間 O(n)，空間 O(n)，Python 的階乘與反階乘列表 O(n)，另加前綴與輸入緩衝 O(n)。',
            '合法性要求每個前綴餘額非負，只檢查最終左右數量相等不夠。',
            [('總長度 4'+('、前綴為 (' if prefix else ''),['('] if prefix else ['空'],[('剩餘位置',3 if prefix else 4)]),('忽略負餘額限制',[3 if prefix else 6],[('全部候選',3 if prefix else 6)]),('反射扣掉壞路徑',[1 if prefix else 4],[('合法數',2)])],
            'int main(){int n;cin>>n;string s;'+('cin>>s;' if prefix else '')+'int balance=0,used=0;bool ok=n%2==0;for(char c:s){balance+=(c==\'(\'?1:-1);used+=c==\'(\';if(balance<0)ok=false;}int r=n-s.size(),u=n/2-used;if(u<0||u>r)ok=false;if(!ok){cout<<0<<"\\n";return 0;}vector<ll>f(n+1,1),g(n+1);for(int i=1;i<=n;i++)f[i]=f[i-1]*i%P;g[n]=pw(f[n],P-2);for(int i=n;i;i--)g[i-1]=g[i]*i%P;auto C=[&](int k)->ll{return k<0||k>r?0:f[r]*g[k]%P*g[r-k]%P;};cout<<(C(u)-C(u-1)+P)%P<<"\\n";}',
            'import sys\na=sys.stdin.buffer.read().split(); n=int(a[0]); s='+('a[1]' if prefix else 'b""')+'\nb=used=0; ok=n%2==0\nfor c in s:\n    b+=1 if c==40 else -1\n    used+=c==40\n    if b<0: ok=False\nr=n-len(s); u=n//2-used\nif not ok or not 0<=u<=r:\n    print(0); sys.exit()\nP=10**9+7\nf=[1]*(n+1); g=[1]*(n+1)\nfor i in range(1,n+1): f[i]=f[i-1]*i%P\ng[n]=pow(f[n],P-2,P)\nfor i in range(n,0,-1): g[i-1]=g[i]*i%P\ndef C(k): return 0 if k<0 or k>r else f[r]*g[k]%P*g[r-k]%P\nprint((C(u)-C(u-1))%P)')
    add(634,'number-theory','逐質因數合併因數的三種統計',[
        '加入質因數 p^k 時，新因數集合是每個舊因數 d 分別乘 1,p,…,p^k。因數個數乘 k+1，因數總和乘等比和 (p^(k+1)-1)/(p-1)，除法用模反元素。',
        '令舊因數個數為 D、舊因數乘積為 Q。每個舊因數在新集合出現 k+1 次，而 p 的指數總和是 D·k(k+1)/2，所以新乘積是 Q^(k+1)·p^[D·k(k+1)/2]。計算次方時把 D 另存為模 P-1 的值；費馬小定理允許此約化，因 p≤10^6 與 P 互質。k(k+1)/2 必須先在整數中除 2，再取模 P-1。'],
        '時間 O(n log(P+max k))，額外空間 C++ O(1)，n≤10^5、k≤10^9。Python 全量輸入與 token／整數列表 O(n)；乘法使用任意精度，C++ k(k+1)≤10^18 可用 long long。',
        '因數個數的輸出模 P，但作為指數時要模 P-1，不能混用同一個 D。',
        [('數字 2² 的因數',[1,2,4],[('個數',3),('總和',7),('乘積',8)]),('加入質因數 3',[1,2,4,3,6,12],[('個數',6),('總和',28)]),('合併乘積',[8,8,27],[('乘積','8²×3³=1728')])],
        'int main(){int n;cin>>n;ll count=1,sum=1,prod=1,D=1;while(n--){ll p,k;cin>>p>>k;prod=pw(prod,k+1)*pw(p,(k*(k+1)/2%(P-1))*D%(P-1))%P;count=count*(k+1)%P;sum=sum*((pw(p,k+1)-1+P)%P)%P*pw(p-1,P-2)%P;D=D*((k+1)%(P-1))%(P-1);}cout<<count<<" "<<sum<<" "<<prod<<"\\n";}',
        'import sys\na=list(map(int,sys.stdin.buffer.read().split())); P=10**9+7\ncount=total=prod=D=1\nfor i in range(a[0]):\n    p,k=a[1+2*i:3+2*i]\n    prod=pow(prod,k+1,P)*pow(p,(k*(k+1)//2*D)%(P-1),P)%P\n    count=count*(k+1)%P\n    total=total*(pow(p,k+1,P)-1)*pow(p-1,P-2,P)%P\n    D=D*(k+1)%(P-1)\nprint(count,total,prod)')
    add(635,'number-theory','二項式奇偶性決定 XOR 貢獻',[
        '向上做一次相鄰 XOR，底層元素的係數依 Pascal 三角形相加。頂端中第 i 個元素（零起算）的出現次數是 C(n-1,i)，偶數次抵消、奇數次才保留。',
        '在模 2 下，(1+x)^(n-1) 可按 n-1 的二進位分解為各個 (1+x^(2^b)) 的乘積，因此係數為奇數恰好是 i 的每個 1 位都包含在 n-1 中，即 (i & (n-1))==i。直接掃過底層符合位置做 XOR，無須建構二次大小的金字塔。'],
        '時間 O(n)，C++ 額外空間 O(1)，Python 全量輸入 O(n)；n≤2×10^5，數值≤10^9，運算不會超出 30 位元。',
        '不是單純 XOR 全部底層；例如 n=3 時中間元素出現兩次會抵消。',
        [('底層 4,6,1',[4,6,1],[('n-1 二進位','10')]),('第一層 XOR',[2,7],[('中間元素貢獻','6 XOR 6=0')]),('頂端',[5],[('直接公式','4 XOR 1=5')])],
        'int main(){int n,x,ans=0;cin>>n;for(int i=0;i<n;i++){cin>>x;if((i&(n-1))==i)ans^=x;}cout<<ans<<"\\n";}',
        'import sys\na=list(map(int,sys.stdin.buffer.read().split())); n=a[0]; ans=0\nfor i,x in enumerate(a[1:]):\n    if i&(n-1)==i: ans^=x\nprint(ans)')
    for number in (636,637):
        counting=number==636
        add(number,'data-structures','GF(2) 線性基底'+('的秩' if counting else '的高位貪心'),[
            '將每個整數視為 30 維二元向量，XOR 就是 GF(2) 的向量加法。由最高位往下消去：若該位已有基底向量就 XOR 掉，否則把目前值放進此位作為新基底。每次消去都不改變目前向量可由舊向量張成的關係。',
            ('插入後非零基底共有 r 個，每個子集合的 XOR 都在其張成空間內，而 r 個線性獨立向量的 2^r 個選法互不相同。因此不同 XOR 值數就是 2^r，已包含空集合的零。' if counting else '從答案 0 開始按最高位往下看基底，若 ans XOR basis[b] 比 ans 大就採用。因基底的最高位互異，較低基底不會再改變已決定的高位，因此此貪心逐位取得最大可達整數。')],
            '時間 O(30n)，基底額外空間 O(30)，n≤2×10^5、值≤10^9。Python 全量輸入與整數列表 O(n)；'+('秩至多 30，答案至多 2^30，不取模。' if counting else '不需列舉 2^n 個子集合。'),
            '插入時消成 0 表示相依，不新增基底；輸入 0 也不增加秩。',
            [('插入 1',[1],[('秩',1),('不同 XOR 數',2)]),('插入 2',[1,2],[('秩',2),('不同 XOR 數',4)]),('插入 3 由 2 與 1 消成 0',[1,2],[('秩',2),('答案',4 if counting else 3)])],
            'int main(){ios::sync_with_stdio(false);cin.tie(nullptr);int n,x;cin>>n;int b[30]={},r=0;while(n--){cin>>x;for(int j=29;j>=0;j--)if(x>>j&1){if(b[j])x^=b[j];else{b[j]=x;r++;break;}}}'+('cout<<(1LL<<r)<<"\\n";' if counting else 'int ans=0;for(int j=29;j>=0;j--)ans=max(ans,ans^b[j]);cout<<ans<<"\\n";')+'}',
            'import sys\na=list(map(int,sys.stdin.buffer.read().split())); b=[0]*30; rank=0\nfor x in a[1:]:\n    for j in range(29,-1,-1):\n        if x>>j&1:\n            if b[j]: x^=b[j]\n            else:\n                b[j]=x; rank+=1; break\n'+('print(1<<rank)' if counting else 'ans=0\nfor x in reversed(b): ans=max(ans,ans^x)\nprint(ans)'))
    add(638,'data-structures','前綴 XOR 與二元 Trie 最大配對',[
        '令 prefix[i] 是前 i 個值的 XOR，則子陣列 [l,r) 的 XOR 為 prefix[r] XOR prefix[l]。按 r 從左到右掃描，只需在先前的前綴中找能與目前 prefix[r] 產生最大 XOR 的值。',
        '把先前前綴插入由高位到低位的二元 Trie。查詢時若相反位的分支存在就選它，讓當前 XOR 的最高未決位成為 1；所有低位相加仍不及該高位，所以貪心正確。初始插入 prefix[0]=0，先查再插入，保證選到非空子陣列。'],
        '時間 O(30n)，空間 O(30n)，n≤2×10^5。Python 用兩個 array("i") 儲存子節點，最多約 600 萬節點、48 MB 有效陣列資料，另有容量餘裕與 O(n) 輸入緩衝；不用每節點字典。',
        '線性基底可選任意前綴組合，不能保證恰為兩個前綴的 XOR，不能拿子集合解法代替 Trie。',
        [('先插入前綴 0',[0],[('答案',0)]),('讀入 2 查詢後插入',[0,2],[('目前前綴',2),('答案',2)]),('讀入 5 前綴成為 7',[0,2,7],[('最大配對','7 XOR 0'),('答案',7)])],
        'int main(){ios::sync_with_stdio(false);cin.tie(nullptr);int n;cin>>n;vector<array<int,2>>t(1,array<int,2>{-1,-1});auto ins=[&](int x){int v=0;for(int b=29;b>=0;b--){int c=x>>b&1;if(t[v][c]<0){t[v][c]=t.size();t.push_back({-1,-1});}v=t[v][c];}};ins(0);int p=0,ans=0;while(n--){int x;cin>>x;p^=x;int v=0,res=0;for(int b=29;b>=0;b--){int c=p>>b&1;if(t[v][c^1]>=0){res|=1<<b;v=t[v][c^1];}else v=t[v][c];}ans=max(ans,res);ins(p);}cout<<ans<<"\\n";}',
        'import sys\nfrom array import array\na=list(map(int,sys.stdin.buffer.read().split()))\nchild=[array("i",[-1]),array("i",[-1])]\ndef insert(x):\n    v=0\n    for b in range(29,-1,-1):\n        c=x>>b&1\n        if child[c][v]<0:\n            child[c][v]=len(child[0])\n            child[0].append(-1); child[1].append(-1)\n        v=child[c][v]\ninsert(0)\np=ans=0\nfor x in a[1:]:\n    p^=x; v=res=0\n    for b in range(29,-1,-1):\n        c=p>>b&1\n        if child[c^1][v]>=0:\n            res|=1<<b; v=child[c^1][v]\n        else: v=child[c][v]\n    ans=max(ans,res); insert(p)\nprint(ans)')
    add(639,'number-theory','二進位各位的週期性計數',[
        '把 0..n 的所有數按第 b 位分開統計，零不貢獻所以與 1..n 相同。第 b 位以長度 2^(b+1) 循環：先有 2^b 個 0，再有 2^b 個 1。',
        '令 N=n+1、half=2^b，每個完整週期貢獻 half，餘下 rem=N mod (2half) 個位置貢獻 max(0,rem-half)。各位貢獻相加就是所有 popcount 的總和；不同位之間不需考慮進位或重複。'],
        '時間 O(log n)，空間 O(1)，n≤10^15，答案小於 5×10^16，可用 64 位元。Python 的大整數及輸入只占 O(log n) 位元。',
        '最後不完整週期要用 n+1 個數計算，避免漏掉端點 n。',
        [('計算 0..5 的最低位',[0,1,0,1,0,1],[('貢獻',3)]),('第二位',[0,0,1,1,0,0],[('貢獻',2)]),('第三位',[0,0,0,0,1,1],[('貢獻',2),('總和',7)])],
        'int main(){ll n;cin>>n;ll N=n+1,ans=0;for(ll h=1;h<=n;h*=2)ans+=N/(2*h)*h+max(0LL,N%(2*h)-h);cout<<ans<<"\\n";}',
        'import sys\nn=int(sys.stdin.buffer.read()); N=n+1; h=1; ans=0\nwhile h<=n:\n    ans+=N//(2*h)*h+max(0,N%(2*h)-h)\n    h*=2\nprint(ans)','easy')
    add(640,'dp','錯排的兩種禮物交換情況',[
        '令 D[n] 為 n 人皆不得到自己禮物的分法數。先選第一人的禮物來自誰，共 n-1 種。設其來源為 j，分成 j 也拿第一人禮物，以及 j 不拿第一人禮物兩種情況。',
        '前者固定一個二人交換，剩下 D[n-2] 種；後者可把第一人的位置與來源 j 合併，形成 n-1 人的錯排，共 D[n-1] 種。因此 D[n]=(n-1)(D[n-1]+D[n-2])。用 D[0]=1、D[1]=0 開始，滾動保留兩項。'],
        '時間 O(n)，額外空間 O(1)，n≤10^6。Python 僅讀入一數、維護常數個已取模整數。',
        'D[0]=1 是空安排；若設成 0，D[2] 會算錯。',
        [('一人無法交換',[0],[('D[1]',0)]),('兩人唯一互換',[1],[('D[2]',1)]),('三人兩種循環交換',[2],[('D[3]','2×(1+0)=2')])],
        'int main(){int n;cin>>n;ll a=1,b=0;for(int i=2;i<=n;i++){ll c=(i-1)*(a+b)%P;a=b;b=c;}cout<<b<<"\\n";}',
        'import sys\nn=int(sys.stdin.buffer.read()); a,b=1,0; P=10**9+7\nfor i in range(2,n+1): a,b=b,(i-1)*(a+b)%P\nprint(b)','easy')
    add(641,'number-theory','允許零份的隔板法',[
        '將 m 顆蘋果視為一列相同符號，插入 n-1 個隔板，隔板前後及相鄰隔板之間的蘋果數就是各孩子的份量。隔板可相鄰或位於兩端，恰好對應某孩子得到零顆。',
        '一共 n+m-1 個符號位置，選 m 個放蘋果，其餘放隔板，因此為 C(n+m-1,m)。每個份量向量與符號排列一一對應，沒有重複。由於 n+m-1≤1999999<P，階乘除法可安全使用模反元素。'],
        '時間 O(n+m)，空間 O(1) 額外儲存；以循環分別累乘三個階乘，Python 輸入和整數暫存 O(1) 個已取模數值。n,m≤10^6。',
        '蘋果相同、孩子可區分，且可以得到零顆；不是把 m 顆各選 n 個人的 n^m。',
        [('兩人分三顆：隔板在最左',['|','●','●','●'],[('份量','0,3')]),('隔板右移一格',['●','|','●','●'],[('份量','1,2')]),('共有四個隔板位置',[0,1,2,3],[('分法',4)])],
        'll fac(int n){ll r=1;for(int i=2;i<=n;i++)r=r*i%P;return r;}int main(){int n,m;cin>>n>>m;cout<<fac(n+m-1)*pw(fac(m),P-2)%P*pw(fac(n-1),P-2)%P<<"\\n";}',
        'import sys\nn,m=map(int,sys.stdin.buffer.read().split()); P=10**9+7\ndef fac(n):\n    r=1\n    for i in range(2,n+1): r=r*i%P\n    return r\nprint(fac(n+m-1)*pow(fac(m),P-2,P)*pow(fac(n-1),P-2,P)%P)','easy')
    add(642,'number-theory','重複字元排列的多項式係數',[
        '若先把 n 個字元個體視為可區分，共有 n! 種排列。但同一字元若出現 c 次，其 c! 個內部交換都得到相同的字串。',
        '各種字元的內部交換相互獨立，每個可見字串恰對應 Πc! 個可區分排列，所以答案為 n!/Πc!。n≤10^6 小於模數，所有階乘不為零，可用費馬小定理計算分母的反元素。'],
        '時間 O(n+log P)，額外計數空間 O(26)；Python 的輸入字串 O(n)，不需 n 格階乘表。',
        '相同字元不可區分，不能直接輸出 n!；必須使用全部字元。',
        [('字串 aab 的可區分排列',['a₁','a₂','b'],[('標號排列數',6)]),('交換兩個 a 不改變字串',['a₂','a₁','b'],[('每字串重複次數',2)]),('移除重複',['aab','aba','baa'],[('答案',3)])],
        'll fac(int n){ll r=1;for(int i=2;i<=n;i++)r=r*i%P;return r;}int main(){string s;cin>>s;int f[26]={};for(char c:s)f[c-97]++;ll den=1;for(int c:f)den=den*fac(c)%P;cout<<fac(s.size())*pw(den,P-2)%P<<"\\n";}',
        'import sys\nfrom collections import Counter\ns=sys.stdin.buffer.read().strip(); P=10**9+7\ndef fac(n):\n    r=1\n    for i in range(2,n+1): r=r*i%P\n    return r\nden=1\nfor c in Counter(s).values(): den=den*fac(c)%P\nprint(fac(len(s))*pow(den,P-2,P)%P)','easy')
    add(643,'number-theory','Möbius 反演計算互質位置對',[
        '設 cnt[d] 為輸入中可被 d 整除的位置數，共有 C(cnt[d],2) 對的兩數都含因數 d。對每一對最大公因數 g，Σ_{d|g} μ(d) 在 g=1 時等於 1，其他情況為 0。',
        '因此答案是 Σ μ(d)·C(cnt[d],2)。先用線性篩取得 Möbius 函數，再以倍數枚舉計算 cnt[d]；μ(d)=0 的項可以略過。頻率陣列記錄的是位置數，重複值仍照樣形成不同位置對；值 1 自然被正確納入。'],
        'M=max x_i≤10^6、n≤10^5；時間 O(M log M+n)，空間 O(M+n)。Python 輸入 O(n)，篩表、最小質因數、頻率及質數列表 O(M)，答案最大約 5×10^9，用 64 位元。',
        '不要只篩質數項，μ(d) 的非零合成數項正是容斥中的交集補回。',
        [('輸入 2,3,4 的 d=1 項',[2,3,4],[('貢獻',3)]),('d=2 有兩個倍數',[2,4],[('扣除',1)]),('其他非零項沒有成對倍數',[3],[('互質對','3-1=2')])],
        'int main(){int n;cin>>n;vector<int>a(n);int M=1;for(int &x:a){cin>>x;M=max(M,x);}vector<int>f(M+1),mu(M+1),lp(M+1),pr;for(int x:a)f[x]++;mu[1]=1;for(int i=2;i<=M;i++){if(!lp[i]){lp[i]=i;pr.push_back(i);mu[i]=-1;}for(int p:pr){if(p>lp[i]||1LL*i*p>M)break;lp[i*p]=p;mu[i*p]=(p==lp[i]?0:-mu[i]);}}ll ans=0;for(int d=1;d<=M;d++)if(mu[d]){ll c=0;for(int j=d;j<=M;j+=d)c+=f[j];ans+=mu[d]*c*(c-1)/2;}cout<<ans<<"\\n";}',
        'import sys\na=list(map(int,sys.stdin.buffer.read().split()))[1:]; M=max(a)\nf=[0]*(M+1); mu=[0]*(M+1); lp=[0]*(M+1); primes=[]\nfor x in a: f[x]+=1\nmu[1]=1\nfor i in range(2,M+1):\n    if not lp[i]: lp[i]=i; primes.append(i); mu[i]=-1\n    for p in primes:\n        if p>lp[i] or i*p>M: break\n        lp[i*p]=p\n        mu[i*p]=0 if p==lp[i] else -mu[i]\nans=0\nfor d in range(1,M+1):\n    if mu[d]:\n        c=sum(f[j] for j in range(d,M+1,d))\n        ans+=mu[d]*c*(c-1)//2\nprint(ans)')
    add(644,'dp','含前導零狀態的數位 DP',[
        '先定義 F(x) 為 0..x 合法整數數量，區間答案為 F(b)-F(a-1)，並令 F(-1)=0。依高位到低位建立數字，狀態包含前一個有效數字 prev 與是否仍貼住上界 tight。',
        'prev=10 表示尚未開始，這時選零仍維持未開始，不能把它與下一個零視為相鄰重複。開始之後，下一位只可選與 prev 不同的數字。tight 限制本位最大值及下一狀態；每個整數恰好對應一條固定長度含前導零路徑，全部未開始的路徑代表數字 0，應算一次。'],
        '位數 D≤19，時間 O(D·11·2·10)，空間 O(11·2)；Python 的輸入與十進位字串 O(D)，採滾動字典，不枚舉到 10^18。',
        '前導零不是數字表示的一部分；0 符合條件，a=0 時不能對負數做一般數位拆解。',
        [('上界為 12 的十位未開始',['0'],[('可接個位',10)]),('十位選 1 仍貼上界',['1'],[('可選個位','0,2')]),('合併兩條分支',[10,2],[('0..12 合法數',12)])],
        'll solve(ll x){if(x<0)return 0;string s=to_string(x);ll d[11][2]={};d[10][1]=1;for(char ch:s){ll e[11][2]={};for(int p=0;p<=10;p++)for(int t=0;t<2;t++)for(int c=0;c<=(t?ch-48:9);c++){if(p!=10&&c==p)continue;int q=(p==10&&c==0)?10:c;e[q][t&&c==ch-48]+=d[p][t];}memcpy(d,e,sizeof d);}ll r=0;for(auto &row:d)for(ll v:row)r+=v;return r;}int main(){ll a,b;cin>>a>>b;cout<<solve(b)-solve(a-1)<<"\\n";}',
        'import sys\na,b=map(int,sys.stdin.buffer.read().split())\ndef solve(x):\n    if x<0: return 0\n    dp={(10,True):1}\n    for ch in str(x):\n        bound=int(ch); nd={}\n        for (prev,tight),ways in dp.items():\n            for c in range((bound if tight else 9)+1):\n                if prev!=10 and c==prev: continue\n                q=10 if prev==10 and c==0 else c\n                key=(q,tight and c==bound)\n                nd[key]=nd.get(key,0)+ways\n        dp=nd\n    return sum(dp.values())\nprint(solve(b)-solve(a-1))')
    add(645,'dp','逐欄輪廓 DP 與骨牌轉移',[
        '以 n≤10 的一欄作為輪廓，mask 的第 r 位表示本欄該格已被前一欄伸過來的橫骨牌占用。從第一個未占格開始填：若下一列也空，就放直骨牌；或放橫骨牌，將下一欄對應位設為 1。',
        '填滿一欄時得到下一個 mask，每條填法路徑都對應該欄唯一骨牌擺法。預先為所有 mask 建立後繼列表，再跑 m 欄，初始 dp[0]=1，最終只取 dp[0]，排除伸出棋盤的骨牌。從第一個空格分支避免以不同放置順序重複計數。'],
        '時間 O(m·3^n+n·3^n) 上界，轉移邊數實際更少；空間 O(3^n+2^n)，n≤10、m≤1000。Python 預存轉移、兩層 DP 及 O(n) 深度的生成遞迴，輸入 O(1)。',
        '最後 mask 必須為 0；本欄占用與下一欄預占不能混在同一個遮罩。',
        [('2×3 第一欄開始',[0],[('dp[00]',1)]),('填完第一欄',[0,3],[('兩種輪廓的方式','1,1')]),('填完第二欄再第三欄',[2,3],[('第二欄 dp[00]',2),('第三欄 dp[00]',3)])],
        'int main(){int n,m;cin>>n>>m;int S=1<<n;vector<vector<int>>go(S);for(int mask=0;mask<S;mask++){function<void(int,int)>dfs=[&](int r,int nxt){if(r==n){go[mask].push_back(nxt);return;}if(mask>>r&1){dfs(r+1,nxt);return;}dfs(r+1,nxt|(1<<r));if(r+1<n&&!(mask>>(r+1)&1))dfs(r+2,nxt);};dfs(0,0);}vector<ll>d(S);d[0]=1;while(m--){vector<ll>e(S);for(int s=0;s<S;s++)for(int t:go[s])e[t]=(e[t]+d[s])%P;d=e;}cout<<d[0]<<"\\n";}',
        'import sys\nn,m=map(int,sys.stdin.buffer.read().split()); P=10**9+7; S=1<<n\ngo=[[] for _ in range(S)]\nfor mask in range(S):\n    def dfs(r,nxt):\n        if r==n:\n            go[mask].append(nxt); return\n        if mask>>r&1:\n            dfs(r+1,nxt); return\n        dfs(r+1,nxt|1<<r)\n        if r+1<n and not (mask>>(r+1)&1): dfs(r+2,nxt)\n    dfs(0,0)\nd=[1]+[0]*(S-1)\nfor _ in range(m):\n    e=[0]*S\n    for s,v in enumerate(d):\n        for t in go[s]: e[t]=(e[t]+v)%P\n    d=e\nprint(d[0])')
    add(646,'data-structures','座標壓縮與 Fenwick 樹累加遞增子序列',[
        '令 ways[i] 為以位置 i 結尾的嚴格遞增非空子序列數。倒數第二個位置可以是任何 j<i 且 a[j]<a[i]，所以 ways[i]=1+Σways[j]；其中 1 代表只選 a[i]。',
        '先將所有值排序去重並轉為排名，以 Fenwick 樹按值保存已處理位置的 ways 總和。查詢 rank-1 的前綴和後，再把目前 ways 加到 rank。查詢只包含較小值，更新只包含已處理位置，故同時滿足數值與順序限制。每個子序列的最後位置唯一，總答案是所有 ways 的和。'],
        '時間 O(n log n)，空間 O(n)，n≤2×10^5。Python 的輸入、去重排序、排名字典、Fenwick 陣列均 O(n)，每次更新取模。',
        '嚴格遞增不能查到自己的排名；相同值不同位置各可形成單元素子序列，但不能互相接續。',
        [('讀入 1',[1],[('目前 ways',1),('總數',1)]),('讀入第一個 2',[1,2],[('目前 ways',2),('總數',3)]),('讀入第二個 2',[1,2,2],[('目前 ways',2),('總數',5)])],
        'int main(){ios::sync_with_stdio(false);cin.tie(nullptr);int n;cin>>n;vector<int>a(n);for(int&x:a)cin>>x;auto v=a;sort(v.begin(),v.end());v.erase(unique(v.begin(),v.end()),v.end());vector<ll>bit(v.size()+1);ll ans=0;for(int x:a){int r=lower_bound(v.begin(),v.end(),x)-v.begin()+1;ll w=1;for(int j=r-1;j;j-=j&-j)w=(w+bit[j])%P;ans=(ans+w)%P;for(int j=r;j<(int)bit.size();j+=j&-j)bit[j]=(bit[j]+w)%P;}cout<<ans<<"\\n";}',
        'import sys\na=list(map(int,sys.stdin.buffer.read().split()))[1:]; v=sorted(set(a)); rank={x:i+1 for i,x in enumerate(v)}\nP=10**9+7; bit=[0]*(len(v)+1); ans=0\nfor x in a:\n    r=rank[x]; j=r-1; w=1\n    while j:\n        w=(w+bit[j])%P; j-=j&-j\n    ans=(ans+w)%P; j=r\n    while j<len(bit):\n        bit[j]=(bit[j]+w)%P; j+=j&-j\nprint(ans)')
    add(647,'dp','子集合 DP 的趟數與末趟重量最小化',[
        '對已運送的人員集合 mask，保存字典序最小的二元組 (趟數,末趟重量)。若趟數相同，末趟較輕能容納的後續乘客不少於較重者，因此只保留這一個狀態就足夠。',
        '枚舉最後加入的人 i，從 mask 去掉 i 的最優狀態轉移；能放進末趟就加重量，否則新開一趟。這兩種轉移都對二元組字典序單調，故丟棄較差狀態不會錯過最優解。初始空集合用 (1,0) 表示一個尚未載人的趟次，n≥1 時最終不會多計。'],
        '時間 O(n·2^n)，空間 O(2^n)，n≤20。Python 用 bytearray 存趟數、array("Q") 存末趟重量，約 9·2^n 位元組，輸入 O(n)；最大約兩千萬次轉移，嚴格時限下需語言倍率。',
        '只記每個集合的最少趟數不足以轉移，還要保留該趟數下最輕的末趟。',
        [('容量 7 加入重量 4',[4],[('狀態','(1,4)')]),('再加入重量 3',[4,3],[('狀態','(1,7)')]),('最後加入重量 2',[4,3,2],[('狀態','(2,2)'),('答案',2)])],
        'int main(){int n;ll x;cin>>n>>x;vector<ll>w(n);for(ll&v:w)cin>>v;vector<pair<int,ll>>d(1<<n,{n+1,0});d[0]={1,0};for(int s=1;s<(1<<n);s++)for(int bits=s;bits;bits&=bits-1){int i=__builtin_ctz(bits);auto p=d[s^(1<<i)];if(p.second+w[i]<=x)p.second+=w[i];else{p.first++;p.second=w[i];}d[s]=min(d[s],p);}cout<<d.back().first<<"\\n";}',
        'import sys\nfrom array import array\na=list(map(int,sys.stdin.buffer.read().split())); n,x=a[:2]; w=a[2:]; S=1<<n\nrides=bytearray([n+1])*S; load=array("Q",[0])*S; rides[0]=1\nfor s in range(1,S):\n    best=n+1; weight=0; bits=s\n    while bits:\n        low=bits&-bits; i=low.bit_length()-1; t=s^low\n        r=rides[t]; v=load[t]+w[i]\n        if v>x: r+=1; v=w[i]\n        if r<best or (r==best and v<weight): best,weight=r,v\n        bits^=low\n    rides[s]=best; load[s]=weight\nprint(rides[-1])','hard')
    add(648,'dp','固定最大元素消除等和分組對稱',[
        '總和 S=n(n+1)/2 若是奇數，不可能分成等和兩組。若是偶數，將 n 固定放在第二組，只計算從 1..n-1 選出和為 S/2 的子集合數。',
        '任何無序分組恰有一邊不含 n，選擇該邊就與上述子集合一一對應，因此不需最後再除以 2。用零一背包計數，處理 x 時金額倒序更新 dp[s]+=dp[s-x]，以免同一數字使用多次。'],
        '時間 O(nS)，空間 O(S)，n≤500、S≤125250。Python DP 列表 O(S)，輸入 O(1)；倒序至多約三千萬次更新，原生 Python 秒級時限需語言倍率。',
        '若改成處理 1..n，則每個分組會算兩次；這份程式只處理至 n-1，不可再除 2。',
        [('n=3 的目標和為 3',[0],[('dp[0]',1)]),('處理數字 1',[0,1],[('可達和','0,1')]),('處理數字 2',[0,1,2,3],[('dp[3]',1),('分組','{1,2}|{3}')])],
        'int main(){int n;cin>>n;int S=n*(n+1)/2;if(S%2){cout<<0<<"\\n";return 0;}S/=2;vector<ll>d(S+1);d[0]=1;for(int x=1;x<n;x++)for(int s=S;s>=x;s--)d[s]=(d[s]+d[s-x])%P;cout<<d[S]<<"\\n";}',
        'import sys\nn=int(sys.stdin.buffer.read()); S=n*(n+1)//2\nif S&1:\n    print(0); sys.exit()\nS//=2; P=10**9+7; d=[1]+[0]*S\nfor x in range(1,n):\n    for s in range(S,x-1,-1): d[s]=(d[s]+d[s-x])%P\nprint(d[S])')
    add(649,'dp','零和取數遊戲的區間分差',[
        '令 D(l,r) 表示輪到行動者面對區間 [l,r] 時，最佳能取得的「自己分數減對手分數」。取左端後對手面對 [l+1,r]，角色交換使分差變號，因此取左的結果是 a[l]-D(l+1,r)；取右同理。',
        '故 D(l,r)=max(a[l]-D(l+1,r),a[r]-D(l,r-1))，單元素時 D(i,i)=a[i]。按左端由大到小、右端由小到大更新一維陣列，舊 d[r] 是下一個左端區間，新 d[r-1] 是本左端較短區間。最終先手分數=(總和+D(0,n-1))/2，負數也同樣成立。'],
        '時間 O(n²)，空間 O(n)，n≤5000。Python 輸入、數列與滾動 DP O(n)，約 1250 萬次轉移；C++ 分數與分差用 long long。',
        '遇到負數仍必須取一個，不能把 DP 預設為 0 而允許玩家跳過。',
        [('單元素分差',[8,1,5],[('D(0,0)',8)]),('長度二分差',[7,4],[('D(0,1)',7),('D(1,2)',4)]),('完整區間選左較好',[4],[('先手分數','(14+4)/2=9')])],
        'int main(){int n;cin>>n;vector<ll>a(n);ll sum=0;for(ll&x:a){cin>>x;sum+=x;}auto d=a;for(int l=n-2;l>=0;l--)for(int r=l+1;r<n;r++)d[r]=max(a[l]-d[r],a[r]-d[r-1]);cout<<(sum+d[n-1])/2<<"\\n";}',
        'import sys\na=list(map(int,sys.stdin.buffer.read().split()))[1:]; n=len(a); d=a.copy()\nfor l in range(n-2,-1,-1):\n    for r in range(l+1,n): d[r]=max(a[l]-d[r],a[r]-d[r-1])\nprint((sum(a)+d[-1])//2)')
    add(650,'dp','枚舉第一刀的長方形最優子結構',[
        '令 dp[a][b] 為把 a×b 長方形全切成正方形的最少刀數。若 a=b，已是正方形，答案為零。否則任何合法方案都有第一刀，必定是沿某一邊作整數位置的水平或垂直切割。',
        '水平在 h 切開的代價是 1+dp[h][b]+dp[a-h][b]，垂直同理。枚舉所有第一刀取最小，兩個子長方形獨立使用最優方案，便能達成此下界。對稱的 h 與 a-h 產生同一代價，只枚舉至一半即可。按邊長遞增填表，所依賴的子長方形都已算好。'],
        '時間 O(ab(a+b))，空間 O(ab)，a,b≤500。Python 的二維整數表 O(ab)、輸入 O(1)，最壞數千萬次分割比較，嚴格 1 秒時限未保證，需語言倍率或 C++。',
        '不能只按最大公因數大小切成等尺寸正方形；允許正方形尺寸不同，貪心切最大正方形也不保證刀數最小。',
        [('1×3 每刀只能分成線段',[1,1,1],[('最少刀數',2)]),('2×3 先切成 2×2 與 2×1',[0,1],[('總刀數','1+0+1=2')]),('2×5 先切 2×2 與 2×3',[0,2],[('總刀數','1+0+2=3')])],
        'int main(){int a,b;cin>>a>>b;vector<vector<int>>d(a+1,vector<int>(b+1));for(int i=1;i<=a;i++)for(int j=1;j<=b;j++){if(i==j)continue;int v=i*j;for(int h=1;h<=i/2;h++)v=min(v,1+d[h][j]+d[i-h][j]);for(int w=1;w<=j/2;w++)v=min(v,1+d[i][w]+d[i][j-w]);d[i][j]=v;}cout<<d[a][b]<<"\\n";}',
        'import sys\na,b=map(int,sys.stdin.buffer.read().split())\nd=[[0]*(b+1) for _ in range(a+1)]\nfor i in range(1,a+1):\n    row=d[i]\n    for j in range(1,b+1):\n        if i==j: continue\n        best=i*j\n        for h in range(1,i//2+1): best=min(best,1+d[h][j]+d[i-h][j])\n        for w in range(1,j//2+1): best=min(best,1+row[w]+row[j-w])\n        row[j]=best\nprint(d[a][b])')
    add(651,'dp','已知位置限制下的相鄰值轉移',[
        '令 dp[v] 為已填完前綴、最後一值為 v 的合法方案數。下一位置若填 v，前值只能是 v-1、v、v+1，所以 new[v]=dp[v-1]+dp[v]+dp[v+1]。',
        '若輸入位置已知為 x，就只計算 new[x]，其餘全為零；未知位置才計算全部 1..m。第一個位置依已知或未知設為一種起始方式。額外保留值 0 與 m+1 的零哨兵，讓邊界轉移不會越界。每個完整陣列依最後一值落入唯一狀態，最後加總即可。'],
        '時間 O(nm)，空間 O(m) 額外 DP，n≤10^5、m≤100。Python 全量輸入 O(n)，加兩層 DP O(m)，不儲存 n×m 表。',
        '每一輪要新建或清空下一層，否則已知位置以外的舊狀態會錯誤殘留。',
        [('m=3 第一格未知',[1,1,1],[('方案總數',3)]),('第二格固定 2',[0,3,0],[('方案總數',3)]),('第三格未知',[3,3,3],[('方案總數',9)])],
        'int main(){ios::sync_with_stdio(false);cin.tie(nullptr);int n,m,x;cin>>n>>m;vector<ll>d(m+2);cin>>x;for(int v=1;v<=m;v++)if(x==0||x==v)d[v]=1;for(int i=1;i<n;i++){cin>>x;vector<ll>e(m+2);for(int v=(x?x:1);v<=(x?x:m);v++)e[v]=(d[v-1]+d[v]+d[v+1])%P;d=e;}ll ans=0;for(ll v:d)ans=(ans+v)%P;cout<<ans<<"\\n";}',
        'import sys\na=list(map(int,sys.stdin.buffer.read().split())); n,m=a[:2]; a=a[2:]; P=10**9+7\nd=[0]+[int(a[0]==0 or a[0]==v) for v in range(1,m+1)]+[0]\nfor x in a[1:]:\n    e=[0]*(m+2)\n    for v in (range(1,m+1) if x==0 else (x,)): e[v]=(d[v-1]+d[v]+d[v+1])%P\n    d=e\nprint(sum(d)%P)')
    add(652,'dp','合法末隊區間與最優切法累加',[
        '令 best[r] 為前 r 人的最少隊數，ways[r] 為達成此數量的切法數；空前綴為 (0,1)。枚舉最後一隊 [l,r)，其長度 L=r-l 必須同時滿足隊內所有接受範圍，也就是 max(a[l:r])≤L≤min(b[l:r])。',
        '固定右端 r，將 l 往左移即可增量維護最大 a 與最小 b，不需要每次重新掃描。若區間合法且前 l 人可行，候選隊數為 best[l]+1；更佳時替換並複製 ways[l]，相同時加上 ways[l]。不同 l 是不同最後切口，因此最優方案的來源不重複。',
        '若 L 已超過目前最小 b，繼續擴張只會增加 L 並使最小 b 不增，可立刻停止；若 L 小於最大 a 則不能停止，因擴張後長度可能追上。最終不可達就輸出 -1 0。'],
        '時間 O(n²)，空間 O(n)，n≤4000，最多約八百萬個末隊候選。Python 輸入範圍、best、ways 列表與 token 緩衝 O(n)，不列舉 2^(n-1) 種切法。',
        '不能貪心取最長合法隊；剩餘成員可能無法編組。最少隊數相同的不同切口都需加總。',
        [('三人都接受 1..2：前一人',[1],[('best[1]',1),('ways[1]',1)]),('前兩人可合成一隊',[2],[('best[2]',1),('ways[2]',1)]),('三人最少分成 1+2 或 2+1',[1,2],[('best[3]',2),('ways[3]',2)])],
        'int main(){int n;cin>>n;vector<int>a(n),b(n);for(int i=0;i<n;i++)cin>>a[i]>>b[i];vector<int>d(n+1,n+1);vector<ll>w(n+1);d[0]=0;w[0]=1;for(int r=1;r<=n;r++){int A=0,B=n;for(int l=r-1;l>=0;l--){A=max(A,a[l]);B=min(B,b[l]);int L=r-l;if(L>B)break;if(L>=A&&d[l]<=n){int v=d[l]+1;if(v<d[r]){d[r]=v;w[r]=w[l];}else if(v==d[r])w[r]=(w[r]+w[l])%P;}}}if(d[n]>n)cout<<"-1 0\\n";else cout<<d[n]<<" "<<w[n]<<"\\n";}',
        'import sys\na=list(map(int,sys.stdin.buffer.read().split())); n=a[0]; low=a[1::2]; high=a[2::2]\nd=[0]+[n+1]*n; ways=[1]+[0]*n; P=10**9+7\nfor r in range(1,n+1):\n    A=0; B=n\n    for l in range(r-1,-1,-1):\n        A=max(A,low[l]); B=min(B,high[l]); L=r-l\n        if L>B: break\n        if L>=A and d[l]<=n:\n            v=d[l]+1\n            if v<d[r]: d[r]=v; ways[r]=ways[l]\n            elif v==d[r]: ways[r]=(ways[r]+ways[l])%P\nprint("-1 0" if d[n]>n else str(d[n])+" "+str(ways[n]))','hard')
    add(653,'graphs','反向多源 minimax Dijkstra 保留兩個出口標籤',[
        '對出口 e，從起點 v 可離開的最小級別是：路線上所有通道門檻及出口開放門檻的最大值，再對可行路線取最小。將邊反向，從各出口以其開放門檻作多源搜尋；沿權重 w 的反向邊傳遞時，新距離為 max(目前級別,w)。',
        '優先佇列保存 (級別,地點,出口標籤)。按級別遞增彈出，每個地點只接受前兩個不同出口的標籤；同一出口重複路線必須捨棄。因 max(d,w)≥d，和 Dijkstra 相同，第一次接受某標籤即為其最小瓶頸距離。第二個不同標籤的級別，就是能同時抵達兩個開放出口的最小共同 H。',
        '為何可忽略第三個標籤？在此地點已接受的兩個不同出口，其距離都不大於第三者；沿任意相同反向路徑傳遞後仍然不大於第三者，並且仍是兩個不同出口。因此第三者不能改善任何前驅的第二小答案。每個地點最多擴展兩次，避免對 k 個出口各跑一次搜尋。'],
        '時間 O((n+m+k) log(m+k+1))，空間 O(n+m+k)，n≤50000、m≤180000。Python 反向鄰接表、至多 2m+k 次入堆的候選及完整輸入緩衝皆 O(n+m+k)，每個地點只存兩個標籤；不是 O(nk) 表。',
        '兩條不同路線若抵達同一出口只算一個；出口自身的零長路線要計入，k<2 時所有答案皆 -1。',
        [('兩出口 2 與 3 的開放門檻為 4 與 7',[2,3],[('反向邊','2→1 權重2，3→1 權重5')]),('標籤 2 先抵達起點 1',[2],[('起點 1 第一距離',4)]),('標籤 3 也抵達起點 1',[2,3],[('起點 1 第二距離',7),('起點 1 答案',7)])],
        'int main(){ios::sync_with_stdio(false);cin.tie(nullptr);int n,m,k;cin>>n>>m>>k;using T=tuple<ll,int,int>;priority_queue<T,vector<T>,greater<T>>q;for(int i=0;i<k;i++){int v;ll h;cin>>v>>h;q.push({h,--v,v});}vector<vector<pair<int,ll>>>g(n);for(int i=0;i<m;i++){int u,v;ll w;cin>>u>>v>>w;g[v-1].push_back({u-1,w});}vector<array<int,2>>ids(n,array<int,2>{-1,-1});vector<ll>ans(n,-1);while(!q.empty()){auto [d,v,e]=q.top();q.pop();if(ids[v][0]==e||ids[v][1]==e||ids[v][1]!=-1)continue;if(ids[v][0]==-1)ids[v][0]=e;else{ids[v][1]=e;ans[v]=d;}for(auto [u,w]:g[v])q.push({max(d,w),u,e});}for(ll x:ans)cout<<x<<"\\n";}',
        'import sys,heapq\na=list(map(int,sys.stdin.buffer.read().split())); it=iter(a); n=next(it); m=next(it); k=next(it)\nheap=[]\nfor _ in range(k):\n    v=next(it)-1; h=next(it); heap.append((h,v,v))\nheapq.heapify(heap)\ng=[[] for _ in range(n)]\nfor _ in range(m):\n    u=next(it)-1; v=next(it)-1; w=next(it); g[v].append((u,w))\nfirst=[-1]*n; second=[-1]*n; ans=[-1]*n\nwhile heap:\n    d,v,e=heapq.heappop(heap)\n    if first[v]==e or second[v]==e or second[v]!=-1: continue\n    if first[v]==-1: first[v]=e\n    else: second[v]=e; ans[v]=d\n    for u,w in g[v]: heapq.heappush(heap,(max(d,w),u,e))\nprint("\\n".join(map(str,ans)))','hard')
    write_lessons()

def write_lessons():
    LESSONS.write_text(json.dumps(sorted(lessons,key=lambda x:x['code']),ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

def independent_cases():
    """Small exhaustive oracles are deliberately different from lesson algorithms.

    The seed, generated inputs, and all expected outputs are persisted. Public
    inputs are excluded rather than counted as additional independent checks.
    """
    rng=random.Random(608653)
    checks=[]
    def emit(n,inp,out,reason):
        code=f'b{n}'
        if any(s['input'].strip()==inp.strip() for s in sources[code]['samples']): return
        if any(c['code']==code and c['input']==inp for c in checks): return
        checks.append(dict(code=code,input=inp,output=str(out),reason=reason))
    def array_input(a,head=None): return str(len(a))+((' '+str(head)) if head is not None else '')+'\n'+' '.join(map(str,a))
    def xor(a): return functools.reduce(int.__xor__,a,0)
    for rep in range(24):
        n=rng.randint(1,24); k=rng.randint(1,n); x=rng.randint(0,45); a=rng.randint(0,20); b=rng.randint(0,20); c=rng.randint(1,25)
        if rep==0: n=k=1; x=1000000000; a=b=1000000000; c=1
        if rep==1: n=24; k=1
        if rep==2: n=k=24
        values=[x]
        while len(values)<n: values.append((a*values[-1]+b)%c)
        inp=f'{n} {k}\n{x} {a} {b} {c}'
        for code,op in [(608,xor),(609,lambda v:functools.reduce(int.__or__,v,0)),(610,min),(611,sum)]:
            out=xor([op(values[i:i+k]) for i in range(n-k+1)])
            emit(code,inp,out,'Materialize the exact generator (first x unreduced); enumerate every full window and XOR its independently reduced result. Seed 608653; includes k=1,k=n,c=1,x>=c.')
    for n in range(1,9):
        inv=collections.Counter(); beautiful=derangements=0
        for p in itertools.permutations(range(1,n+1)):
            beautiful+=all(abs(p[i]-p[i-1])!=1 for i in range(1,n))
            derangements+=all(v!=i+1 for i,v in enumerate(p))
            inv[sum(p[i]>p[j] for i in range(n) for j in range(i+1,n))]+=1
        emit(612,str(n),beautiful,'Exhaust all n! permutations; test every adjacent absolute difference directly.')
        emit(640,str(n),derangements,'Exhaust all n! gift assignments and reject any fixed point.')
        for k,count in sorted(inv.items()): emit(614,f'{n} {k}',count,'Exhaust permutations and count inversions by all i<j pairs, including both extremal inversion counts.')
    for n in range(1,5):
        squares=list(itertools.product(range(n),repeat=2))
        for k in range(1,min(5,n*n)+1):
            count=0
            for selected in itertools.combinations(squares,k):
                count+=all(abs(r-s)!=abs(c-d) for (r,c),(s,d) in itertools.combinations(selected,2))
            emit(613,f'{n} {k}',count,'Enumerate unordered sets of board squares and reject every diagonal-attacking pair.')
        emit(613,f'{n} {n*n}',int(n==1),'All occupied squares attack when n>1; the single square has exactly one placement.')
    emit(613,'500 250000',0,'More than 2n-2 bishops cannot fit; exact impossibility certificate at maximum n,k.')
    for n in range(1,7):
        for k in range(1,min(n,4)+1):
            out=sum(len(set(p))==k for p in itertools.product(range(k),repeat=n))
            emit(615,f'{n} {k}',out,'Enumerate every length-n word over k symbols and require all k symbols occur.')
    @functools.lru_cache(None)
    def deletions(s):
        if not s:return 1
        return sum(deletions(s[:i]+s[i+2:]) for i in range(len(s)-1) if s[i]==s[i+1])
    for s in ['a','aa','ab','aaaaaa','aabb','abba','abab','abbaabba','aabbaa','abcddcba']+[''.join(rng.choice('abc') for _ in range(rng.randint(1,10))) for _ in range(24)]:
        emit(616,s,deletions(s),'Memoized exhaustive recursion over the actual remaining string; each removable adjacent position pair is a separate branch.')
    for n in range(1,4):
        words=[''.join(p) for p in itertools.product('ABCDEFGHIJKLMNOPQRSTUVWXYZ',repeat=n)]
        for pat in ['A','B','AA','AB','ABA','ABC','AAAA']:
            emit(617,f'{n}\n{pat}',sum(pat in w for w in words),'Enumerate all 26^n uppercase words and use literal substring membership; checks overlap and pattern longer than target.')
    emit(617,'1000\nA',(pow(26,1000,MOD)-pow(25,1000,MOD))%MOD,'Exact complement certificate for one-letter pattern: all words minus words over the other 25 letters.')
    for rep in range(24):
        a=[rng.randint(1,10) for _ in range(rng.randint(1,10))]
        sums={sum(a[i] for i in range(len(a)) if mask>>i&1) for mask in range(1<<len(a))}
        positive=sorted(sums-{0})
        emit(618,array_input(a),str(len(positive))+'\n'+' '.join(map(str,positive)),'Enumerate all subsets by index, deduplicate positive totals and sort.')
        missing=next(x for x in range(1,sum(a)+2) if x not in sums)
        emit(627,array_input(a),missing,'Exhaustively enumerate all subset totals, then scan positive integers for the first absent total.')
        cost=min(sum(abs(x-v) for x in a) for v in range(min(a),max(a)+1))
        emit(628,array_input(a),cost,'Try every integer target length between minimum and maximum; sum literal edit costs.')
    def rectangle_tilings(h,w,domino=False):
        @functools.lru_cache(None)
        def rec(mask):
            if mask==(1<<(h*w))-1:return 1
            i=next(j for j in range(h*w) if not mask>>j&1); r,c=divmod(i,w); out=0
            dims=[(1,2),(2,1)] if domino else itertools.product(range(1,h-r+1),range(1,w-c+1))
            for dh,dw in dims:
                if r+dh>h or c+dw>w:continue
                bits=sum(1<<(rr*w+cc) for rr in range(r,r+dh) for cc in range(c,c+dw))
                if not mask&bits:out+=rec(mask|bits)
            return out
        return rec(0)
    tower_values=[rectangle_tilings(2,n) for n in range(1,7)]
    emit(619,'8\n6\n1\n2\n6\n5\n3\n1\n4','\n'.join(str(tower_values[n-1]) for n in [6,1,2,6,5,3,1,4]),'Exact-cover enumeration: fill first unoccupied cell by every axis-aligned positive-integer rectangle; repeated unsorted height queries.')
    for h in range(1,5):
        for w in range(1,6):emit(645,f'{h} {w}',rectangle_tilings(h,w,True),'Exact-cover recursion on all board cells, placing only 1x2 or 2x1 dominoes at the first empty cell.')
    def book_certificate(a):
        bound=max(sum(a),2*max(a)); n=len(a)
        # Exhaust both reading orders and explicitly schedule second reader
        # around the first reader's fixed non-idling intervals. Matching the
        # elementary lower bound is an independently checkable optimum witness.
        for order in itertools.permutations(range(n)):
            intervals={}; t=0
            for i in order:intervals[i]=(t,t+a[i]); t+=a[i]
            for other in itertools.permutations(range(n)):
                t=0
                for i in other:
                    start,end=intervals[i]
                    if t<end and t+a[i]>start:t=end
                    t+=a[i]
                if t==bound:return bound
        raise AssertionError(('no matching schedule',a,bound))
    for a in [[1],[2,2],[1,2,3],[2,5,4,1],[5,1,1],[1000000000,1000000000]]+[[rng.randint(1,5) for _ in range(rng.randint(1,4))] for _ in range(10)]:
        emit(620,array_input(a),book_certificate(a),'Enumerate two explicit reading orders; find a non-overlapping schedule attaining max(total duration, twice longest duration), a matching necessary lower bound.')
    for rep in range(28):
        a=[rng.randint(1,6) for _ in range(rng.randint(1,10))]; n=len(a)
        selections=[[a[i] for i in range(n) if mask>>i&1] for mask in range(1,1<<n)]
        emit(621,array_input(a),sum(len(p)==len(set(p)) for p in selections),'Enumerate nonempty index subsets, preserving multiplicity of positions, and test all selected values distinct.')
        good=[a[l:r] for l in range(n) for r in range(l+1,n+1) if len(set(a[l:r]))==r-l]
        emit(622,array_input(a),len(good),'Enumerate every nonempty interval and compare its set size to its length.')
        emit(625,array_input(a),max(map(len,good)),'Enumerate every interval; take longest with pairwise distinct values.')
        increasing=sum(all(p[i]<p[i+1] for i in range(len(p)-1)) for p in selections)
        emit(646,array_input(a),increasing,'Enumerate all nonempty position subsets and check strict increase at every neighboring selected pair.')
        @functools.lru_cache(None)
        def towers(i,tops):
            if i==n:return len(tops)
            v=a[i]; candidates=[towers(i+1,tuple(sorted(tops+(v,))))]
            for j,x in enumerate(tops):
                if x>v:candidates.append(towers(i+1,tuple(sorted(tops[:j]+tops[j+1:]+(v,)))))
            return min(candidates)
        emit(624,array_input(a),towers(0,()),'Exhaust all choices of existing legal tower or new tower, canonicalizing equal tower-top multisets; no greedy assumption.')
        p=list(range(1,n+1)); rng.shuffle(p); target=1; rounds=0
        while target<=n:
            rounds+=1
            for v in p:
                if v==target:target+=1
        emit(626,array_input(p),rounds,'Simulate complete left-to-right passes and collect the next target only when encountered.')
        machines=a; target=rng.randint(1,25); events=[]
        for i,x in enumerate(machines):events.extend(x*j for j in range(1,target+1))
        emit(623,array_input(machines,target),sorted(events)[target-1],'Merge explicit completion events of all machines; the t-th event gives optimum time, including simultaneous completions.')
    emit(623,'1 1000000000\n1000000000',10**18,'Single-machine exact maximum-bound certificate: t completions each take 10^9 seconds.')
    # Triangle sums: an unrelated unbounded coin DP, not the two-pointer theorem.
    lim=240; tri=[k*(k+1)//2 for k in range(1,23) if k*(k+1)//2<=lim]; d=[0]+[999]*lim
    for v in range(1,lim+1):d[v]=1+min(d[v-t] for t in tri if t<=v)
    emit(629,str(lim)+'\n'+'\n'.join(map(str,range(1,lim+1))),'\n'.join(map(str,d[1:])),'Unbounded-coin dynamic programming over every positive triangular coin, independently obtaining each minimum from 1 to 240.')
    for n in [2,3,4]:
        k=n*(n+1)//2
        emit(629,f'3\n{k}\n{k+1}\n1','1\n'+str(d[k+1])+'\n1','Mixed small queries cross-checked with unbounded-coin DP and exact triangular identities.')
    # Search over *one* triangle and check exact discriminant of the remainder;
    # this is distinct from the implementations' moving pair of pointers.
    outs=[]
    for n in [10**12,10**12-1]:
        def istri(v):return v>0 and math.isqrt(8*v+1)**2==8*v+1
        if istri(n):outs.append(1);continue
        found=any(istri(n-k*(k+1)//2) for k in range(1,(math.isqrt(8*n+1)-1)//2+1))
        outs.append(2 if found else 3)
    emit(629,'2\n1000000000000\n999999999999','\n'.join(map(str,outs)), 'Independent discriminant scan of every possible first triangle, checking exact square discriminant of the remainder; if none, Gauss theorem certifies 3. Includes n=10^12.')
    for n in range(1,4):
        def rotate(bits):return tuple(bits[(n-1-c)*n+r] for r in range(n) for c in range(n))
        seen=set()
        for bits in itertools.product(range(2),repeat=n*n):
            forms=[bits]
            for _ in range(3):forms.append(rotate(forms[-1]))
            seen.add(min(forms))
        emit(630,str(n),len(seen),'Enumerate all black/white boards, canonicalizing only the four rotations (no reflection).')
    for n in range(1,8):
        for m in range(1,4):
            seen={min(p[r:]+p[:r] for r in range(n)) for p in itertools.product(range(m),repeat=n)}
            emit(631,f'{n} {m}',len(seen),'Enumerate every colored necklace and canonicalize its cyclic rotations, keeping mirror images separate.')
    def valid_brackets(s):
        bal=0
        for c in s:
            bal+=1 if c=='(' else -1
            if bal<0:return False
        return bal==0
    for n in range(1,13):
        valid=[''.join(p) for p in itertools.product('()',repeat=n) if valid_brackets(p)]
        emit(633,str(n),len(valid),'Enumerate all 2^n parenthesis words and test each running balance and final zero.')
        for _ in range(8):
            k=rng.randint(1,n); prefix=''.join(rng.choice('()') for _ in range(k))
            emit(632,f'{n}\n{prefix}',sum(s.startswith(prefix) for s in valid),'Filter exhaustive valid bracket words by exact supplied prefix, including negative-balance and complete prefixes.')
    for pairs in [[(2,1)],[(3,2)],[(2,2),(3,2)],[(2,1),(3,1),(5,1)],[(7,3)]]:
        N=math.prod(p**k for p,k in pairs); ds=[d for d in range(1,N+1) if N%d==0]
        inp=str(len(pairs))+'\n'+'\n'.join(f'{p} {k}' for p,k in pairs)
        emit(634,inp,f'{len(ds)} {sum(ds)%MOD} {math.prod(ds)%MOD}','Construct the actual integer and enumerate all its divisors by exact division; directly multiply and sum them.')
    for k in [10**9,10**9-1]:
        emit(634,f'1\n2 {k}',f'{(k+1)%MOD} {(pow(2,k+1,MOD)-1)%MOD} {pow(2,k*(k+1)//2,MOD)}','Single-prime exact certificate: divisors are 2^0..2^k, product exponent is the integer triangular sum; exercises large exponent reduction.')
    for rep in range(30):
        a=[rng.randint(0,63) for _ in range(rng.randint(1,10))]
        # b635 requires positive elements.
        p=[x+1 for x in a]; row=p[:]
        while len(row)>1:row=[row[i]^row[i+1] for i in range(len(row)-1)]
        emit(635,array_input(p),row[0],'Explicitly construct each level of the XOR pyramid until only its peak remains.')
        vals={xor(a[i] for i in range(len(a)) if mask>>i&1) for mask in range(1<<len(a))}
        emit(636,array_input(a),len(vals),'Enumerate all index subsets, calculate XOR, and count unique values, including the empty subset.')
        emit(637,array_input(a),max(vals),'Enumerate all subset XORs and take their maximum without a linear basis.')
        best=max(xor(a[l:r]) for l in range(len(a)) for r in range(l+1,len(a)+1))
        emit(638,array_input(a),best,'Enumerate all nonempty intervals and directly XOR their elements; no prefix Trie.')
    for n in [1,2,3,4,7,8,15,16,31,100,999]:emit(639,str(n),sum(i.bit_count() for i in range(1,n+1)),'Explicitly sum Python bit_count for every integer in 1..n.')
    emit(639,str(2**49-1),49*2**48,'All 49-bit strings occur once in [0,2^49-1]; every bit is 1 in exactly half, a maximum-scale exact certificate.')
    def compositions(n,m):
        if n==1:return 1
        return sum(compositions(n-1,m-v) for v in range(m+1))
    for n in range(1,6):
        for m in range(1,8):emit(641,f'{n} {m}',compositions(n,m),'Recursively enumerate all ordered nonnegative allocations of m identical apples to n children.')
    for s in ['a','aaaaaa','abc','aaabb','aabbcc','abcdefg','abacaba']:
        emit(642,s,len(set(itertools.permutations(s))),'Enumerate all permutations of character positions and deduplicate resulting character tuples.')
    for rep in range(25):
        a=[rng.randint(1,60) for _ in range(rng.randint(1,20))]
        emit(643,array_input(a),sum(math.gcd(x,y)==1 for x,y in itertools.combinations(a,2)),'Check gcd independently for every unordered position pair, including repeated values and 1.')
        lo=rng.randint(0,5000); hi=lo+rng.randint(0,200)
        emit(644,f'{lo} {hi}',sum(all(x!=y for x,y in zip(str(v),str(v)[1:])) for v in range(lo,hi+1)),'Enumerate the closed integer range and compare neighboring digits of the natural decimal representation.')
    for lo,hi in [(0,0),(0,9),(10,11),(98,102),(10**18-20,10**18)]:
        emit(644,f'{lo} {hi}',sum(all(x!=y for x,y in zip(str(v),str(v)[1:])) for v in range(lo,hi+1)),'Direct decimal enumeration at zero, decade transitions, and the 10^18 endpoint.')
    def bins(weights,cap):
        weights=sorted(weights,reverse=True); best=len(weights)
        def rec(i,loads):
            nonlocal best
            if i==len(weights):best=min(best,len(loads));return
            if len(loads)>=best:return
            w=weights[i]; used=set()
            for j,v in enumerate(loads):
                if v not in used and v+w<=cap:
                    used.add(v); loads[j]+=w; rec(i+1,loads); loads[j]-=w
            rec(i+1,loads+[w])
        rec(0,[]);return best
    for rep in range(30):
        cap=rng.randint(1,20); a=[rng.randint(1,cap) for _ in range(rng.randint(1,9))]
        emit(647,array_input(a,cap),bins(a,cap),'Exhaust assignments into unordered elevator bins using backtracking with symmetry pruning, independent of subset DP.')
    for n in range(1,19):
        total=n*(n+1)//2
        count=sum(2*sum(i+1 for i in range(n) if mask>>i&1)==total for mask in range(1<<n))//2
        emit(648,str(n),count,'Enumerate every subset of 1..n, test equal complementary sum, then divide the symmetric count by two.')
    for rep in range(30):
        a=tuple(rng.randint(-12,12) for _ in range(rng.randint(1,10)))
        @functools.lru_cache(None)
        def game(row,turn):
            if not row:return 0
            if turn==0:return max(row[0]+game(row[1:],1),row[-1]+game(row[:-1],1))
            return min(game(row[1:],0),game(row[:-1],0))
        emit(649,array_input(a),game(a,0),'Exhaustive minimax tree stores first-player score directly, alternating maximize/minimize and allowing negative rewards.')
    @functools.lru_cache(None)
    def cut(a,b):
        if a==b:return 0
        return min([1+cut(h,b)+cut(a-h,b) for h in range(1,a)]+[1+cut(a,w)+cut(a,b-w) for w in range(1,b)])
    for a in range(1,9):
        for b in range(1,9):emit(650,f'{a} {b}',cut(a,b),'Exhaust all complete guillotine-cut trees by memoized recursive enumeration of every first cut, including transposed boards and squares.')
    for rep in range(36):
        n=rng.randint(1,7); m=rng.randint(1,4); a=[rng.randint(0,m) for _ in range(n)]
        count=sum(all(a[i]==0 or a[i]==p[i] for i in range(n)) and all(abs(p[i]-p[i+1])<=1 for i in range(n-1)) for p in itertools.product(range(1,m+1),repeat=n))
        emit(651,array_input(a,m),count,'Enumerate all m^n complete arrays; test fixed positions and every adjacent difference directly.')
    for rep in range(64):
        n=rng.randint(1,10); ranges=[]
        for _ in range(n):
            a=rng.randint(1,n); b=rng.randint(a,n); ranges.append((a,b))
        if rep==0:ranges=[(1,1)]*n
        if rep==1:ranges=[(1,n)]*n
        feasible=[]
        for mask in range(1<<(n-1)):
            ends=[i+1 for i in range(n-1) if mask>>i&1]+[n]; start=0; ok=True
            for end in ends:
                ok &= all(a<=end-start<=b for a,b in ranges[start:end]); start=end
            if ok:feasible.append(len(ends))
        if feasible:
            best=min(feasible); out=f'{best} {feasible.count(best)}'
        else:out='-1 0'
        emit(652,str(n)+'\n'+'\n'.join(f'{a} {b}' for a,b in ranges),out,'Enumerate all 2^(n-1) cut-position sets, test every team member constraint, and count only globally minimum-team partitions.')
    emit(652,'4000\n'+('1 4000\n'*4000).rstrip(),'1 1','Maximum n exact certificate: the entire queue is legal and is the unique one-team partition.')
    emit(652,'4000\n'+('1 1\n'*4000).rstrip(),'4000 1','Maximum n exact certificate: every team must be a singleton; exactly one partition.')
    def graph_case(n,exits,edges,reason):
        # Independent oracle uses threshold-by-threshold forward reachability,
        # not minimax Dijkstra or two-label pruning.
        thresholds=sorted({0}|{h for _,h in exits}|{w for _,_,w in edges})
        ans=[-1]*n
        for H in thresholds:
            graph=[[] for _ in range(n)]
            for u,v,w in edges:
                if w<=H:graph[u].append(v)
            opened={v for v,h in exits if h<=H}
            for start in range(n):
                if ans[start]!=-1:continue
                seen={start}; stack=[start]
                while stack:
                    for v in graph[stack.pop()]:
                        if v not in seen:seen.add(v);stack.append(v)
                if len(seen & opened)>=2:ans[start]=H
        inp=f'{n} {len(edges)} {len(exits)}\n'+'\n'.join([f'{v+1} {h}' for v,h in exits]+[f'{u+1} {v+1} {w}' for u,v,w in edges])
        emit(653,inp.rstrip(),'\n'.join(map(str,ans)),reason+'; independent oracle enumerates all threshold values and runs forward reachability from every start, then counts distinct opened exits.')
    graph_case(1,[],[],'No exits or edges')
    graph_case(2,[(0,0),(1,0)],[(0,1,0),(1,0,0)],'Zero-threshold cycle, both starting vertices are exits')
    graph_case(4,[(2,2),(3,2)],[(0,1,0),(1,2,0),(1,2,0),(2,2,0)],'Parallel routes to the same exit cannot substitute for two exits; disconnected second exit')
    for rep in range(100):
        n=rng.randint(1,9); k=rng.randint(0,n)
        exits=[(v,rng.randint(0,8)) for v in rng.sample(range(n),k)]
        edges=[(rng.randrange(n),rng.randrange(n),rng.randint(0,8)) for _ in range(rng.randint(0,30))]
        graph_case(n,exits,edges,'Seeded directed multigraph with self-loops, cycles, equal thresholds and arbitrary exit count')
    # Large exact certificates exercise integer width and maximum state counts
    # without using the tutorial implementations to calculate expectations.
    for a in [[0],[0,0,0],[1000000000,536870912,1,0],[1,2,4,8,16,32]]:
        inp=array_input(a); vals={xor(a[i] for i in range(len(a)) if mask>>i&1) for mask in range(1<<len(a))}
        emit(636,inp,len(vals),'Explicit subset enumeration at high bits, repeated zeros, and independent powers of two.')
        emit(637,inp,max(vals),'Explicit subset enumeration, including bit 29 and values at the 10^9 bound.')
        emit(638,inp,max(xor(a[l:r]) for l in range(len(a)) for r in range(l+1,len(a)+1)),'Direct nonempty interval enumeration, including leading prefix zero and bit 29.')
    powers=[1<<b for b in range(30)]
    emit(636,array_input(powers),1<<30,'Thirty independent unit-bit vectors span every 30-bit integer, so exactly 2^30 distinct subset XORs.')
    emit(637,array_input(powers),(1<<30)-1,'OR of all thirty independent powers of two is attainable by choosing every element and is the absolute 30-bit upper bound.')
    for a in [[1],[1,1,1],[1,1000000,999983,1000000],[1000000]*10]:
        emit(643,array_input(a),sum(math.gcd(x,y)==1 for x,y in itertools.combinations(a,2)),'Pairwise gcd at the maximum sieve index, repeated values, all-ones and singleton boundaries.')
    emit(647,array_input([10**9]*20,10**9),20,'Maximum people and capacity: each person fills exactly one entire ride, forcing 20 rides.')
    emit(647,array_input([1]*20,10**9),1,'Maximum subset-state count: all 20 passengers together fit into one ride, which is both necessary and sufficient.')
    emit(649,array_input([10**9]*5000),2500*10**9,'Maximum game length with identical positive values: both players necessarily take exactly 2500 values.')
    emit(649,array_input([-10**9]*5000),-2500*10**9,'Maximum game length with identical negative values: turns are mandatory and each player takes 2500 values.')
    emit(650,'500 500',0,'Maximum square requires zero cuts; exact geometry certificate.')
    emit(650,'1 500',499,'Width one forces 500 unit squares; each guillotine cut increases piece count by exactly one.')
    emit(651,array_input([0]*100000,1),1,'Maximum n, m=1: every unknown must be 1, giving exactly one completion.')
    emit(651,array_input([1,100]+[0]*99998,100),0,'Maximum n,m with first two fixed values differing by 99; no completion exists.')
    emit(645,'9 999',0,'Odd board area cannot be covered by area-two dominoes; large width/column certificate.')
    emit(652,'3999\n'+('2 2\n'*3999).rstrip(),'-1 0','Every team must have size 2, impossible for an odd total of 3999 members.')
    N=50000
    inp=f'{N} {N-1} 2\n{N-1} 1000000000\n{N} 0\n'+'\n'.join(f'{i} {i+1} 0' for i in range(1,N))
    emit(653,inp,'\n'.join(['1000000000']*(N-1)+['-1']),'Maximum-length directed chain, exits at its final two vertices: every earlier start reaches both exactly at 10^9; final vertex reaches only itself.')
    return checks

def verify():
    data=json.loads(LESSONS.read_text(encoding='utf-8'))
    assert [x['code'] for x in data]==[f'b{i}' for i in range(608,654)]
    checks=independent_cases()
    (HERE/'checks-608-653.json').write_text(json.dumps(checks,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    report=dict(tutorials=len(data),publicSamplesPerLanguage=0,independentCasesPerLanguage=len(checks),failures=[],perProblem=[],verification='Linux WSL kali-linux; g++ -std=c++17 -O2; Python 3; independent seeded exhaustive oracles in verify-608-653.py. Timeouts below are harness limits, not original judge time guarantees.')
    def norm(s):return s.split()
    with tempfile.TemporaryDirectory(prefix='lessons-608-653-',dir='/tmp') as tmp:
        tmp=pathlib.Path(tmp)
        for lesson in data:
            code=lesson['code']; start=time.monotonic(); cpp=tmp/(code+'.cpp'); py=tmp/(code+'.py'); binary=tmp/code
            cpp.write_text(lesson['cpp'],encoding='utf-8'); py.write_text(lesson['python'],encoding='utf-8')
            build=subprocess.run(['g++','-std=c++17','-O2','-Wall','-Wextra',str(cpp),'-o',str(binary)],text=True,capture_output=True)
            if build.returncode:report['failures'].append(dict(code=code,language='cpp',kind='compile',stderr=build.stderr))
            public=[dict(x,reason='public sample',kind='public') for x in sources[code]['samples']]
            custom=[dict(x,kind='independent') for x in checks if x['code']==code]
            row=dict(code=code,publicSamples=len(public),independentCases=len(custom),runs=0,failures=0)
            report['publicSamplesPerLanguage']+=len(public)
            assert custom,code
            assert lesson['sampleInput']==sources[code]['samples'][0]['input']
            assert lesson['sampleOutput']==sources[code]['samples'][0]['output']
            assert len(lesson['explanation'])>=2
            assert len(set(s['title'] for s in lesson['trace']))==len(lesson['trace'])
            for step in lesson['trace']:
                assert step['cells'] and all(0<=j<len(step['cells']) for j in step['active'])
                assert len(set(v[0] for v in step['variables']))==len(step['variables'])
            for case in public+custom:
                for language,command in [('cpp',[str(binary)]),('python',[sys.executable,str(py)])]:
                    if language=='cpp' and build.returncode:continue
                    row['runs']+=1
                    try:
                        result=subprocess.run(command,input=case['input'],text=True,capture_output=True,timeout=45)
                        if result.returncode or norm(result.stdout)!=norm(case['output']):
                            report['failures'].append(dict(code=code,language=language,kind=case['kind'],input=case['input'],expected=case['output'],actual=result.stdout,stderr=result.stderr,reason=case['reason']))
                            row['failures']+=1
                    except subprocess.TimeoutExpired:
                        report['failures'].append(dict(code=code,language=language,kind='timeout',input=case['input'],expected=case['output'],reason=case['reason']));row['failures']+=1
            row['seconds']=round(time.monotonic()-start,3); report['perProblem'].append(row)
            (HERE/'results-608-653.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
            print(f"{code}: public={len(public)}, independent={len(custom)}, runs={row['runs']}, failures={row['failures']}, {row['seconds']}s",flush=True)
    report['totalRuns']=sum(row['runs'] for row in report['perProblem'])
    report['remainingLimitations']=['No official hidden test access; all public samples and seeded independent oracles are run.','Original judge one-second Python performance is not guaranteed for 10^7-element streams, large triangular scans, or high-order DP; relevant lessons state this explicitly.','Maximum-size correctness certificates supplement small exhaustive tests but do not establish every problem meets its original time limit.']
    (HERE/'results-608-653.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({k:v for k,v in report.items() if k not in ('perProblem','failures')},ensure_ascii=False),flush=True)
    if report['failures']:
        print(json.dumps(report['failures'],ensure_ascii=False,indent=2));return 1
    return 0

if __name__=='__main__':
    parser=argparse.ArgumentParser(); parser.add_argument('--author',action='store_true'); args=parser.parse_args()
    if args.author: author()
    else: sys.exit(verify())
