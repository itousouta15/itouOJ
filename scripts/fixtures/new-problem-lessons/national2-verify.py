"""Independent exhaustive oracles; run under WSL. --generate appends deterministic fixtures."""
import json,pathlib,random,itertools,functools,sys
ROOT=pathlib.Path(__file__).resolve().parents[3]
DATA=ROOT/'src/lib/newProblemLessons/data/national2.json'
CHECKS=pathlib.Path(__file__).with_name('national2-checks.json')
SOURCE={p['code']:p for p in json.loads(CHECKS.with_name('source.json').read_text(encoding='utf-8'))['problems']}
rng=random.Random(20261103)
def make():
    out=[]
    def put(c,i,o,r):out.append(dict(code='a'+str(c),input=i,output=str(o),reason='獨立窮舉 oracle：'+r))
    for _ in range(20):
        n=rng.randint(2,8);a=[rng.randint(1,9) for _ in range(n)]
        @functools.lru_cache(None)
        def card(a):
            if len(a)==1:return 0
            return min(max(a[j:j+2])+card(a[:j]+(max(a[j:j+2]),)+a[j+2:]) for j in range(len(a)-1))
        put(950,f'{n}\n'+ ' '.join(map(str,a))+'\n',card(tuple(a)),'枚舉每次相鄰淘汰直到只剩一張。')
        h=[rng.randrange(5) for _ in range(n)];v=[rng.randint(1,10) for _ in range(n)];best=0
        for mask in range(1<<n):
            ix=[i for i in range(n) if mask>>i&1]
            if all(max(h[i+1:j],default=-1)>max(h[i],h[j]) for i,j in itertools.combinations(ix,2)):best=max(best,sum(v[i] for i in ix))
        put(987,f'{n}\n'+ ' '.join(map(str,h))+'\n'+' '.join(map(str,v))+'\n',best,'枚舉所有礦井子集合並檢查每對的嚴格隔離。')
        p=list(range(1,n+1));rng.shuffle(p)
        def frames(p):
            pos={x:i for i,x in enumerate(p)};ans=set()
            for a in range(1,n+1):
                for b in range(a+1,n+1):
                    l,r=sorted((pos[a],pos[b]))
                    if set(p[l:r+1])==set(range(a,b+1)):ans.add((a,b))
            return ans
        old=frames(p);new=set()
        for l in range(n):
            for r in range(l+1,n):new|=frames(p[:l]+p[l:r+1][::-1]+p[r+1:])
        put(988,f'{n}\n'+' '.join(map(str,p))+'\n',len(new-old),'枚舉每個翻轉並直接檢查集合與兩個端點。')
        intervals=[]
        for i in range(n):s=rng.randrange(n);t=rng.randrange(s,n);intervals.append((s,t))
        @functools.lru_cache(None)
        def capture(i,x):
            if i==n:return 0
            s,t=intervals[i]
            return max([capture(i+1,x)]+[1+capture(i+1,y) for y in range(max(x,s),t+1)])
        put(998,f'{n}\n'+''.join(f'{s} {t}\n' for s,t in intervals),capture(0,0),'枚舉每層跳過或在區間任何可達x捕獲。')
        # Exhaustive set packing of cycle teams, no sorted-block assumption.
        k=rng.randint(2,min(4,n));pnum=rng.randint(1,n//k);h=[rng.randint(1,12) for _ in range(n)];teams=[]
        for ix in itertools.combinations(range(n),k):
            cost=min(max(abs(h[a]-h[b]) for a,b in zip(order,order[1:]+order[:1])) for order in itertools.permutations(ix))
            teams.append((sum(1<<i for i in ix),cost))
        @functools.lru_cache(None)
        def pack(mask,p):
            if not p:return 0
            return min((max(c,pack(mask|m,p-1)) for m,c in teams if not mask&m),default=10**9)
        put(996,f'{n} {k} {pnum}\n'+' '.join(map(str,h))+'\n',pack(0,pnum),'枚舉所有隊伍成員、所有環順序與不相交隊伍組合。')
        # Direct raster cells, independent of sweep line.
        rect=[];cells=set()
        for j in range(rng.randint(1,5)):
            a,c=sorted(rng.sample(range(7),2));b,d=sorted(rng.sample(range(7),2));rect.append((a,b,c,d));cells|={(x,y) for x in range(a,c) for y in range(b,d)}
        put(999,str(len(rect))+'\n'+''.join(' '.join(map(str,r))+'\n' for r in rect),len(cells),'枚舉所有單位方格求聯集。')
    for _ in range(16):
        n=rng.randint(2,8);b=[rng.randint(1,8) for _ in range(n)];w=[rng.randint(1,8) for _ in range(n)];t=[rng.randint(1,12) for _ in range(n)];best=10**9
        for mask in range(1<<n):
            ready=[0,0];finish=0
            for i in range(n):
                machine=(mask>>i)&1;finish=ready[machine]+(w[i] if machine else b[i]);ready[machine]=finish;ready[1-machine]=max(ready[1-machine],finish+t[i])
            best=min(best,finish)
        put(979,str(n)+'\n'+'\n'.join(' '.join(map(str,a)) for a in (b,w,t))+'\n',best,'枚舉2^n種機器配置，模擬兩台取得全部舊資料的時刻。')
        P=rng.randint(1,12);a=[rng.randrange(P) for _ in range(n)];b=[rng.randrange(P) for _ in range(n)]
        best=max(sum((v+s)%P>u or (v+t)%P>u for u,v in zip(a,b)) for s in range(P) for t in range(P))
        put(960,f'{n} {P}\n'+' '.join(map(str,a))+'\n'+' '.join(map(str,b))+'\n',best,'枚舉所有P²種兩燃料選擇。')
        points=list(zip(rng.sample(range(20),n),rng.sample(range(20),n)));score=[0,0]
        for count in range(1,n+1):
            empty=0
            for i,j in itertools.combinations(range(count),2):
                x,y=points[i];X,Y=points[j]
                empty+=not any(min(x,X)<xx<max(x,X) and min(y,Y)<yy<max(y,Y) for xx,yy in points[:count])
            score[(count-1)%2]+=empty
        put(940,str(n)+'\n'+''.join(f'{x} {y}\n' for x,y in points),' '.join(map(str,score)),'每回合枚舉所有點對並掃描所有內部阻擋點。')
        # Connected-subset oracle, no center or mandatory-edge theorem.
        edges=[(i,rng.randrange(i),rng.randint(1,6)) for i in range(1,n)];budget=rng.randint(0,sum(e[2] for e in edges));g=[[] for _ in range(n)]
        for u,v,z in edges:g[u].append((v,z));g[v].append((u,z))
        best=10**9
        for mask in range(1,1<<n):
            vertices=[i for i in range(n) if mask>>i&1];inside=[e for e in edges if mask>>e[0]&1 and mask>>e[1]&1]
            if len(inside)!=len(vertices)-1 or sum(e[2] for e in inside)>budget:continue
            dist=[10**9]*n
            for s in vertices:dist[s]=0
            for _ in range(n):
                for u,v,z in edges:dist[u]=min(dist[u],dist[v]+z);dist[v]=min(dist[v],dist[u]+z)
            best=min(best,max(dist))
        put(965,f'1\n{n} {budget}\n'+''.join(f'{u} {v} {z}\n' for u,v,z in edges),best,'枚舉所有連通城市子集合及預算，逐邊鬆弛計算距離。')
        # All feasible tours, then exact union of up to R independently selected tours.
        n=rng.randint(1,6);a=[(rng.randint(0,8),rng.randint(0,8),rng.randint(0,4)) for _ in range(n)];a[-1]=(a[-1][0],a[-1][1],a[-1][1]);B=rng.randint(0,20);R=rng.randint(1,n);tours=[]
        for l in range(n):
            walk=0
            for r in range(l,n):
                if a[l][1]+walk+a[r][1]<=B:tours.append(((1<<(r-l+1))-1)<<l)
                walk+=a[r][2]
        masks={0}
        for _ in range(R):masks|={mask|tour for mask in masks for tour in tours}
        best=max(sum(a[i][0] for i in range(n) if mask>>i&1) for mask in masks)
        put(966,f'1\n{n}\n'+''.join(' '.join(map(str,z))+'\n' for z in a)+f'{B} {R}\n',best,'枚舉可行完整旅行，直接枚舉至多R個旅行的取寶聯集。')
        shops=[(rng.randrange(5),rng.randrange(5),rng.randrange(4),rng.randrange(1,10)) for _ in range(rng.randint(1,5))]
        best=max(sum(w for x,y,r,w in shops if abs(x-X)+abs(y-Y)<=r) for X in range(-3,9) for Y in range(-3,9))
        put(981,str(len(shops))+'\n'+''.join(' '.join(map(str,z))+'\n' for z in shops),best,'枚舉覆蓋範圍內每個原始整數格點，直接算曼哈頓距離。')
    for _ in range(8):
        n=2;points=[]
        for y in (2,0,-2):
            for sign in (-1,1):points.extend((sign*rng.randint(1,12),y) for _ in range(n))
        triangles=[]
        for ix in itertools.combinations(range(6*n),3):
            a,b,c=[points[i] for i in ix];area=abs((b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]))//2;triangles.append((sum(1<<i for i in ix),area))
        best=max(v+w for m,v in triangles for k,w in triangles if not m&k)
        put(986,str(n)+'\n'+''.join(f'{x} {y}\n' for x,y in points),best,'枚舉所有三點三角形，再枚舉兩個端點不重複三角形。')
        n=5;P=37;A=[[rng.randrange(P) for _ in range(n)] for _ in range(n)];C=[[0]*n for _ in range(n)]
        for __ in range(2*n):C[rng.randrange(n)][rng.randrange(n)]=rng.randrange(1,P)
        # Use invertible dense A and solve A B=C by modular Gaussian elimination.
        aug=[A[i][:]+[int(i==j) for j in range(n)] for i in range(n)];ok=True
        for j in range(n):
            pivot=next((i for i in range(j,n) if aug[i][j]),None)
            if pivot is None:ok=False;break
            aug[j],aug[pivot]=aug[pivot],aug[j];inv=pow(aug[j][j],-1,P);aug[j]=[x*inv%P for x in aug[j]]
            for i in range(n):
                if i!=j:
                    t=aug[i][j];aug[i]=[(x-t*y)%P for x,y in zip(aug[i],aug[j])]
        if ok:
            B=[[sum(aug[i][n+k]*C[k][j] for k in range(n))%P for j in range(n)] for i in range(n)]
            direct=[[sum(A[i][k]*B[k][j] for k in range(n))%P for j in range(n)] for i in range(n)]
            put(980,f'3\n{n} {P}\n'+''.join(' '.join(map(str,row))+'\n' for row in A+B),'\n'.join(f'{i+1} {j+1} {direct[i][j]}' for i in range(n) for j in range(n) if direct[i][j]),'高斯消去構造稠密因子，答案再以直接三重迴圈內積取得。')
    for _ in range(12):
        n=rng.randint(3,7)
        def tree():
            pool=list(range(1,n+1));parent={};children={};nxt=n+1
            while len(pool)>1:
                take=rng.sample(pool,rng.randint(2,min(3,len(pool))))
                for u in take:pool.remove(u);parent[u]=nxt
                children[nxt]=take;pool.append(nxt);nxt+=1
            root=pool[0];depth={root:0};q=[root]
            for u in q:
                for v in children.get(u,[]):depth[v]=depth[u]+1;q.append(v)
            return parent,root,depth
        t1,t2=tree(),tree()
        def shape(t,ix):
            parent,root,depth=t
            def lca(a,b):
                seen={a}
                while a!=root:a=parent[a];seen.add(a)
                while b not in seen:b=parent[b]
                return b
            pairs=list(itertools.combinations(ix,2));ds=[depth[lca(a,b)] for a,b in pairs]
            return None if len(set(ds))==1 else pairs[ds.index(max(ds))]
        best=sum(shape(t1,ix)!=shape(t2,ix) for ix in itertools.combinations(range(1,n+1),3))
        inp=f'{n} {t1[1]-n} {t2[1]-n}\n'+''.join(str(t[0][i])+'\n' for t in (t1,t2) for i in range(1,t[1]))
        put(955,inp,best,'枚舉每個葉三元組，以父鏈求三個LCA並直接比較結構。')
        from fractions import Fraction
        n=rng.randint(3,5);edges=[(i,j) for i in range(n) for j in range(i+1,n)];weights=rng.sample(range(1,50),len(edges));e=[(i,j,w,50) for (i,j),w in zip(edges,weights)];values=[]
        for chosen in itertools.combinations(e,n-1):
            p=list(range(n));val=Fraction(1);valid=True
            def find(x):
                while p[x]!=x:x=p[x]
                return x
            for u,v,q,d in chosen:
                a,b=find(u),find(v)
                if a==b:valid=False;break
                p[a]=b;val*=Fraction(q,d)
            if valid:values.append(val)
        values.sort(reverse=True);a,b=values[:2]
        put(956,f'{n} {len(e)}\n'+''.join(' '.join(map(str,z))+'\n' for z in e),f'{a.numerator} {a.denominator} {b.numerator} {b.denominator}','枚舉每個n−1邊子集、排除環，以Fraction精確比較生成樹乘積。')
    # Entire legal knight-board domain, with an unpruned exhaustive DFS.
    for n in range(3,11):
        V=3*n;g=[[] for _ in range(V)]
        for u in range(V):
            for dr,dc in ((1,2),(1,-2),(-1,2),(-1,-2),(2,1),(2,-1),(-2,1),(-2,-1)):
                r,c=u//n+dr,u%n+dc
                if 0<=r<3 and 0<=c<n:g[u].append(r*n+c)
        board=[0]*V;board[0]=1;best=None
        def enumerate_paths(u,mask,step):
            nonlocal best
            if step==V:
                if best is None or board<best:best=board[:]
                return
            for v in g[u]:
                if not mask>>v&1:
                    board[v]=step+1;enumerate_paths(v,mask|1<<v,step+1);board[v]=0
        enumerate_paths(0,1,1)
        put(975,str(n)+'\n',' '.join(map(str,best)) if best else '0','對每個合法n=3..10無剪枝枚舉全部騎士走訪；比較完整攤平棋盤。')
    # Proven maximum-depth and integer-overflow families, no recursive oracle.
    n=100000
    put(991,str(n)+'\n'+' '.join(['7']*n)+'\n'+''.join(f'{i-1} {i}\n' for i in range(1,n)),n,'十萬深鏈全部同色，唯一路徑取得全部。')
    put(994,f'{n} 1\n'+''.join(f'{i-1} {i} 1000\n' for i in range(1,n))+f'2 0 {n-1}\n',(n-1)*1000,'十萬深鏈兩端任務，唯一旅程為整條鏈。')
    put(997,f'{n} 1 1 0\n'+''.join(f'{i-1} {i}\n' for i in range(2,n+1))+f'1 100000 {n}\n',(n-1)*100000,'十萬深鏈，關稅總額9999900000超32位元。')
    n=20000
    put(969,str(n)+'\n'+''.join(f'{i-1} {i}\n' for i in range(2,n+1)),f'{n//2} {(n//2-1)*(n//2)}','兩萬深鏈中間兩點平手，選較小編號。')
    n=50000
    put(977,str(n)+'\n'+' '.join(['1']*n)+'\n'+' '.join(str(i-1) for i in range(1,n))+'\n0\n',n*(n-1)-((n//2-1)*(n//2-2)+(n//2)*(n//2-1)),'五萬深鏈每路由器一台電腦，中央最大有向通過量。')
    n=100000
    put(989,f'{n} 0 100\n'+str(n)+' '+' '.join(map(str,range(1,n-1)))+' '+str(n+1)+'\n',' '.join(['10']*10+['0']*(n-11)),'十萬片單調內板，前十槽填高10恰用100，下一內板高度10不溢流。')
    n=5000
    put(940,str(n)+'\n'+''.join(f'{i} {i}\n' for i in range(n)),f'{(n//2)*(n//2-1)} {(n//2)**2}','最大n的遞增共線點，每回合僅x排序相鄰點對為空矩形，共t−1個，奇偶等差級數可直接求和。')
    return [c for c in out if not any(s['input'].strip()==c['input'].strip() for s in SOURCE[c['code']]['samples'])]
if __name__=='__main__':
    cases=make();available={x['code'] for x in json.loads(DATA.read_text(encoding='utf-8'))};cases=[x for x in cases if x['code'] in available]
    if '--generate' in sys.argv:
        existing=json.loads(CHECKS.read_text(encoding='utf-8'));seen={(x['code'],x['input']) for x in existing}
        existing.extend(x for x in cases if (x['code'],x['input']) not in seen);CHECKS.write_text(json.dumps(existing,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');print('oracle fixtures:',len(cases))
    else:
        import subprocess,tempfile
        lessons={x['code']:x for x in json.loads(DATA.read_text(encoding='utf-8'))};fail=[]
        with tempfile.TemporaryDirectory(prefix='national2-oracle-') as tmp:
            for code in sorted({c['code'] for c in cases}):
                p=pathlib.Path(tmp)/(code+'.py');p.write_text(lessons[code]['python'],encoding='utf-8')
                for c in cases:
                    if c['code']!=code:continue
                    r=subprocess.run(['python3',str(p)],input=c['input'],text=True,capture_output=True,timeout=30)
                    if r.returncode or r.stdout.strip()!=c['output'].strip():fail.append((code,c,r.stdout,r.stderr))
            print(json.dumps(dict(tests=len(cases),failures=fail),ensure_ascii=False,indent=2));sys.exit(bool(fail))
