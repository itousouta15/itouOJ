"""Independent bounded peer audit. No author fixture/verifier is imported.
Run via WSL kali-linux python3; C++ executables exist only in /tmp.
Writes only peer-review-654-699.json. Seed and oracle algorithms are below.
"""
import collections, concurrent.futures, functools, hashlib, itertools, json, math, pathlib, random, subprocess, sys, tempfile, time
HERE=pathlib.Path(__file__).resolve().parent
ROOT=HERE.parents[2]
DATA=ROOT/'src/lib/newProblemLessons/data/nov08-654-699.json'
REPORT=HERE/'peer-review-654-699.json'
raw=DATA.read_bytes();lessons={x['code']:x for x in json.loads(raw)}
source_raw=(HERE/'source.json').read_bytes();sources={x['code']:x for x in json.loads(source_raw)}
r=random.Random(66269917);cases=collections.defaultdict(list)
def textrow(xs):return ' '.join(map(str,xs))
def rows(head,rs):return head+'\n'+'\n'.join(textrow(row) for row in rs)
def add(code,inp,out,reason):
    code=f'b{code}';inp=inp.rstrip('\n')+'\n';out=str(out).rstrip('\n')
    if any(inp.strip()==s['input'].strip() for s in sources[code]['samples']):return
    if any(inp==c['input'] for c in cases[code]):return
    cases[code].append(dict(input=inp,expected=out,reason=reason))
def tree(n):return [(r.randrange(v),v) for v in range(1,n)]
def components(n,edges):
    g=[set() for _ in range(n)]
    for u,v in edges:g[u].add(v);g[v].add(u)
    unseen=set(range(n));out=[]
    while unseen:
        s=unseen.pop();comp={s};stack=[s]
        while stack:
            u=stack.pop()
            for v in g[u]&unseen:unseen.remove(v);comp.add(v);stack.append(v)
        out.append(comp)
    return out
def generate():
    for _ in range(50):
        n=r.randint(1,18);L=r.randint(1,n);R=r.randint(L,n);a=[r.choice([0,0,1,3,7,(1<<29),r.randrange(1<<30)]) for i in range(n)];best=0
        for i in range(n):
            x=0
            for j in range(i,n):
                x^=a[j]
                if L<=j-i+1<=R:best=max(best,x)
        add(662,f'{n} {L} {R}\n'+textrow(a),best,'Enumerate all subarrays, including duplicate prefixes, L=R, high bit29 and expiry.')
    for _ in range(35):
        n=r.randint(1,5);e=[(r.randrange(n),r.randrange(n),r.randint(1,5),r.randrange(2)) for i in range(r.randrange(10))];lengths=[]
        def walk(u,lastw,lastc,length):
            for i,(a,b,w,c) in enumerate(e):
                if a==u and w>lastw and c!=lastc:lengths.append(length+1);walk(b,w,c,length+1)
        for u in range(n):walk(u,0,-1,0)
        out='0 0' if not lengths else f'{max(lengths)} {lengths.count(max(lengths))%1000000007}'
        add(663,rows(f'{n} {len(e)}',[(a+1,b+1,w,c) for a,b,w,c in e]),out,'Enumerate complete edge-index walks with strictly increasing weights; self/parallel/equal-weight edges retained.')
    for _ in range(25):
        n=r.randint(1,16);a=[r.randrange(3) for i in range(n)];cur=a[:];ops=[];out=[]
        for j in range(35):
            if j and r.random()<.4:
                i=r.randrange(n);x=r.choice([-10**9,0,1,2,10**9]);cur[i]=x;ops.append(('U',i+1,x))
            else:
                l=r.randrange(n);u=r.randrange(l,n);ops.append(('Q',l+1,u+1));out.append(sum(len(list(g))**2 for v,g in itertools.groupby(cur[l:u+1])))
        add(664,rows(f'{n} {len(ops)}',[a]+ops),'\n'.join(map(str,out)),'Maintain raw array; group each queried slice afresh to test truncation, merge order, identity and point updates.')
    for _ in range(40):
        N=r.randint(1,8);es=[]
        for j in range(r.randrange(10)):
            l=r.randint(1,N);es.append((l,r.randint(l,N),r.randint(1,7)))
        vals=[]
        def visit(front,used,cost):
            if front==N:vals.append(cost);return
            for i,(l,u,w) in enumerate(es):
                if not used>>i&1 and l<=front+1 and u>front:visit(u,used|1<<i,cost+w)
        visit(0,0,0)
        out='-1 0' if not vals else f'{min(vals)} {vals.count(min(vals))%1000000007}'
        add(665,rows(f'{N} {len(es)}',es),out,'Enumerate actual service-index sequences with an explicit used mask, including duplicate right endpoints.')
    for _ in range(25):
        n=r.randint(1,10);K=r.randrange(n+1);a=[r.randrange(2) for i in range(n)];es=[(r.randrange(n),r.randrange(n)) for i in range(r.randrange(25))];reach=[[i==j for j in range(n)] for i in range(n)]
        for u,v in es:reach[u][v]=True
        for k in range(n):
            for i in range(n):
                for j in range(n):reach[i][j]|=reach[i][k] and reach[k][j]
        unseen=set(range(n));comps=[]
        while unseen:
            s=min(unseen);c={i for i in unseen if reach[s][i] and reach[i][s]};comps.append(c);unseen-=c
        ids={v:i for i,c in enumerate(comps) for v in c};answer=0
        for k,c in enumerate(comps):
            predecessors={ids[u] for u,v in es if v in c and u not in c}
            answer+=sum(a[i] for i in c)%2==1 and len(predecessors)==K
        add(666,rows(f'{n} {len(es)} {K}',[a]+[(u+1,v+1) for u,v in es]),answer,'Floyd transitive closure determines SCC equivalence; distinct predecessor components counted from raw edges.')
    for _ in range(35):
        n=r.randint(1,16);a=[(r.randint(-3,3),r.randrange(2)) for i in range(n)];answer=sum(a[i][0]<a[j][0] and a[k][0]<a[j][0] and a[i][1]!=a[k][1] for i,j,k in itertools.combinations(range(n),3))
        add(667,rows(str(n),a),answer,'Literal indexed triples, with repeated heights and unconstrained middle colors.')
    for _ in range(25):
        n=r.randint(1,14);colors=[r.randrange(2) for i in range(n)];colors[r.randrange(n)]=0;es=[(u,v,r.choice([1,2,1000000])) for u,v in tree(n)];g=[[] for i in range(n)]
        for u,v,w in es:g[u].append((v,w));g[v].append((u,w))
        values=[]
        for s in range(n):
            d={s:0};q=[s]
            for u in q:
                for v,w in g[u]:
                    if v not in d:d[v]=d[u]+w;q.append(v)
            if colors[s]==0:values.append((abs(sum((1-2*colors[v])*d[v] for v in range(n))),s+1))
        z,v=min(values);add(668,rows(str(n),[colors]+[(u+1,v+1,w) for u,v,w in es]),f'{v} {z}','Independent all-roots distance enumeration; signed imbalance, candidate restriction and smallest-ID ties.')
    for _ in range(30):
        n=r.randint(3,12);a=[(r.randint(-3,3),r.randint(-3,3)) for i in range(n)];cur=a[:];ops=[(r.randrange(n),r.randrange(n)) for j in range(35)];out=[]
        for u,v in ops:
            cur[u],cur[v]=cur[v],cur[u];out.append(sum(cur[i][0]*cur[(i+1)%n][1]-cur[i][1]*cur[(i+1)%n][0] for i in range(n)))
        add(669,rows(f'{n} {len(ops)}',a+[(u+1,v+1) for u,v in ops]),'\n'.join(map(str,out)),'Recompute full signed shoelace after each swap; includes adjacent, cyclic, identical-index, repeated/collinear points.')
    for _ in range(30):
        coords=r.sample([(x,y) for x in range(-4,5) for y in range(-4,5) if x or y],r.randint(1,20));a=[(x,y,r.randrange(2)) for x,y in coords];unseen=set(range(len(a)));answer=0
        while unseen:
            i=min(unseen);x,y,c=a[i];group={j for j in unseen if x*a[j][1]==y*a[j][0] and x*a[j][0]+y*a[j][1]>0};unseen-=group;answer+=sum(a[j][2] for j in group)*2==len(group)
        add(670,rows(str(len(a)),a),answer,'Group by exact zero cross product AND positive dot product, not gcd normalization; antipodal/axis rays separate.')
    for _ in range(40):
        n=r.randint(1,20);K=r.randint(1,n);a=[r.randint(1,5) for i in range(n)];answer=sum(a[i]==a[j] and max(a[i:j+1])==a[i] for i in range(n) for j in range(i+1,min(n,i+K+1)))
        add(671,f'{n} {K}\n'+textrow(a),answer,'Enumerate bounded endpoint pairs and directly inspect all intermediate heights, equal-height interiors allowed.')
    for _ in range(20):
        n=r.randint(1,9);target=r.randrange(3);es=[(u,v,r.randrange(2),r.randrange(7)) for u in range(n) for v in range(u+1,n) for j in range(r.randrange(3)) if r.random()<.4]
        def paths(u,old,weight):
            if u==n-1:return int(weight%3==target)
            return sum(paths(v,c,weight+w) for a,v,c,w in es if a==u and not(old==c==1))
        add(672,rows(f'{n} {len(es)} {target}',[(u+1,v+1,c,w) for u,v,c,w in es]),paths(0,0,0),'Enumerate directed edge sequences in the forward-ID DAG; empty path and parallel edges explicit.')
    for _ in range(30):
        n=r.randint(1,11);a=[r.randrange(2) for i in range(n)];es=tree(n);answer=0
        for mask in range(1<<len(es)):
            comps=components(n,[e for j,e in enumerate(es) if not(mask>>j&1)]);answer+=all(len(c)%2==0 and sum(a[i] for i in c)==1 for c in comps)
        add(673,rows(str(n),[a]+[(u+1,v+1) for u,v in es]),answer,'Enumerate all deleted-edge subsets, rebuild components, inspect even sizes and exactly-one marks.')
    for _ in range(25):
        n=r.randint(1,12);K=r.randrange(n+1);a=[r.randrange(2) for i in range(n)];es=[(r.randrange(n),r.randrange(n)) for j in range(r.randrange(25))];answer=0
        for c in components(n,es):answer+=len(c)==sum(u in c and v in c for u,v in es) and sum(a[i] for i in c)==K
        add(674,rows(f'{n} {len(es)} {K}',[a]+[(u+1,v+1) for u,v in es]),answer,'BFS connectivity sets; count every original edge row once, including self-loops and parallel rows.')
    for _ in range(55):
        n=r.randint(2,20);L=r.randint(1,n-1);R=r.randint(L,n-1);a=[(r.choice([-10**9,-2,0,0,0,1,10**9]),r.randrange(2)) for i in range(n)];opts=[(a[j][0]-a[i][0],-i-1,-j-1) for i in range(n) for j in range(i+L,min(n,i+R+1)) if a[i][1]!=a[j][1]]
        out='NONE' if not opts else textrow((max(opts)[0],-max(opts)[1],-max(opts)[2]));add(675,rows(f'{n} {L} {R}',a),out,'All eligible endpoint pairs; repeated minima test earliest-left ties against earliest-right scan order, plus negative optima.')
    for _ in range(40):
        n=r.randint(1,13);T=r.randint(0,5);a=[r.randint(0,10) for i in range(n)];opts=[]
        for mask in range(1<<max(0,n-1)):
            if mask&(mask<<1):continue
            selected=[j for j in range(n-1) if mask>>j&1]
            if any(abs(a[j]-a[j+1])>T for j in selected):continue
            opts.append((len(selected),-sum(abs(a[j]-a[j+1]) for j in selected)))
        count,neg=max(opts);add(676,f'{n} {T}\n'+textrow(a),f'{count} {-neg}','Enumerate edge subsets of the original path, exclude sharing endpoints, maximize pairs then minimize cost.')
    for _ in range(35):
        n=r.randint(1,25);W=r.randint(1,n);a=[r.choice([0,1,1,2,10**9,r.randrange(20)]) for i in range(n)];answer=sum(min(abs(a[i]-x) for x in a[max(0,i-W):i]) for i in range(1,n))
        add(677,f'{n} {W}\n'+textrow(a),answer,'Literal last-W slices and all absolute differences, including W=1, duplicates and missing predecessor/successor.')
    for _ in range(50):
        n=r.randint(1,30);L=r.choice([0,1,2,n,r.randrange(n+1)]);a=[(r.randint(-3,3),r.randrange(2)) for i in range(n)];p=[-1]+[r.randrange(v) for v in range(1,n)];out=[]
        for v in range(n):
            u=p[v];dist=1;count=0
            while u>=0 and dist<=L:count+=a[u][1]!=a[v][1] and a[u][0]<a[v][0];u=p[u];dist+=1
            out.append(count)
        add(678,rows(f'{n} {L}',a+[tuple(x+1 for x in p[1:])]),'\n'.join(map(str,out)),'Walk each parent chain independently; random branching tests sibling rollback and eviction restoration, L=0 and strict ties.')
    for _ in range(35):
        n=r.randint(1,18);K=r.randrange(n+1);a=[r.randrange(2) for i in range(n)];es=tree(n);g=[[] for i in range(n)]
        for u,v in es:g[u].append(v);g[v].append(u)
        answer=0
        for s in range(n):
            sums={s:a[s]};q=[s]
            for u in q:
                for v in g[u]:
                    if v not in sums:sums[v]=sums[u]+a[v];q.append(v)
            answer+=sum(sums[v]==K for v in range(s+1,n))
        add(679,rows(f'{n} {K}',[a]+[(u+1,v+1) for u,v in es]),answer,'All-source tree paths, count u<v and include both endpoint marks; no centroid decomposition.')
    for _ in range(30):
        n=r.randint(1,15);s=''.join(r.choice('01') for i in range(n));cur=list(s);ops=[];out=[]
        for j in range(35):
            l=r.randrange(n);u=r.randrange(l,n);typ=r.choice([1,2,2]);ops.append((typ,l+1,u+1))
            if typ==1:
                for i in range(l,u+1):cur[i]='1' if cur[i]=='0' else '0'
            else:out.append(sum([cur[i],cur[j],cur[k]]==list('010') for i,j,k in itertools.combinations(range(l,u+1),3)))
        add(680,rows(f'{n} {len(ops)}',[(s,)]+ops),'\n'.join(map(str,out)),'Literal interval flips and full position-triple enumeration; nested/disjoint lazy operations and short query windows.')
    for _ in range(30):
        n=r.randint(1,12);colors=[r.randrange(2) for i in range(n)];cur=colors[:];es=[];ops=[];out=[]
        for j in range(35):
            typ=r.choice([1,1,2,3])
            if typ==1:u,v=r.randrange(n),r.randrange(n);es.append((u,v));ops.append((1,u+1,v+1))
            elif typ==2:u=r.randrange(n);cur[u]^=1;ops.append((2,u+1))
            else:ops.append((3,));out.append(sum(sum(cur[i] for i in c)*2==len(c) for c in components(n,es)))
        add(681,rows(f'{n} {len(ops)}',[colors]+ops),'\n'.join(map(str,out)),'Rebuild all component vertex sets at every query and count literal colors after repeated flips/self/parallel edge additions.')
    for _ in range(45):
        n=r.randint(1,8);K=r.randrange(n+1);colors=[r.randrange(2) for i in range(n)];es=[(r.randrange(n),r.randrange(n)) for j in range(r.randint(1,18))];out=[]
        for k in range(1,len(es)+1):
            count=0
            for comp in components(n,es[:k]):
                vertices=sorted(comp);good=False
                for vals in itertools.product(range(2),repeat=len(comp)):
                    proposed=dict(zip(vertices,vals))
                    if sum(proposed[i]!=colors[i] for i in comp)<=K and all(proposed[u]!=proposed[v] for u,v in es[:k] if u in comp):good=True;break
                count+=good
            out.append(count)
        add(682,rows(f'{n} {len(es)} {K}',[colors]+[(u+1,v+1) for u,v in es]),'\n'.join(map(str,out)),'Enumerate all final color assignments independently for every current component after each edge; tests XOR union root swapping, error complement and permanent conflicts.')
    for _ in range(25):
        A=''.join(r.choice('ab?') for i in range(r.randint(1,10)));B=''.join(r.choice('ab?') for i in range(r.randint(1,10)));queries=[];out=[]
        for j in range(20):
            l=r.randrange(len(A));u=r.randrange(l,len(A));v=r.randrange(len(B));w=r.randrange(v,len(B));queries.append((l+1,u+1,v+1,w+1));a,b=A[l:u+1],B[v:w+1]
            # Enumerate all attainable counts of a,b after replacing question marks.
            ca={(a.count('a')+k,a.count('b')+a.count('?')-k) for k in range(a.count('?')+1)};cb={(b.count('a')+k,b.count('b')+b.count('?')-k) for k in range(b.count('?')+1)}
            out.append('YES' if ca&cb else 'NO')
        add(683,A+'\n'+B+'\n'+rows(str(len(queries)),queries),'\n'.join(out),'Enumerate attainable final letter-frequency vectors, not max-known-count inequality; unequal lengths and independent queries.')
    for _ in range(50):
        n=r.randint(1,22);L=r.randint(1,n);R=r.randint(L,n);a=[r.randrange(5) for i in range(n)];count=0
        for l in range(n):
            for u in range(l+L,min(n,l+R)+1):
                freq=sorted(collections.Counter(a[l:u]).values());count+=freq.count(2)==1 and all(x<=2 for x in freq)
        add(684,f'{n} {L} {R}\n'+textrow(a),count,'Enumerate bounded subarrays and inspect all multiplicities, distinguishing one pair from triples or two pairs.')
    for _ in range(30):
        n=r.randint(1,12);K=r.randint(1,n);V=r.randint(1,20);a=[r.randint(1,V) for i in range(n)];count=0
        for comb in itertools.combinations(a,K):count+=math.gcd(*comb)==1 and sum(comb)%2==1
        add(685,f'{n} {K} {V}\n'+textrow(a),count,'Direct fixed-cardinality indexed subset enumeration; gcd and sum parity checked without Mobius or factorials.')
    for _ in range(55):
        n=r.randint(1,14);es=[(u,v) for u in range(n) for v in range(u+1,n) if r.random()<r.choice([.15,.5,.85])];g=[set() for i in range(n)]
        for u,v in es:g[u].add(v);g[v].add(u)
        answer=sum(len(g[v])>len(g[u]) and len(g[v])>len(g[w]) and w not in g[u] for v in range(n) for u,w in itertools.combinations(g[v],2))
        add(686,rows(f'{n} {len(es)}',[(u+1,v+1) for u,v in es]),answer,'Enumerate every center and unordered neighbor pair using original degrees; test strict ties and closed triangles directly.')
    for _ in range(45):
        coords=r.sample(list(itertools.product(range(-3,4),repeat=2)),r.randint(1,25));D=r.randrange(8);a=[(*p,r.randrange(2)) for p in coords];answer=0
        for (x,y,c),(X,Y,C) in itertools.combinations(a,2):
            if c==C or (x!=X and y!=Y) or abs(x-X)+abs(y-Y)>D:continue
            blocked=any((u,v)!=(x,y) and (u,v)!=(X,Y) and ((x==X==u and min(y,Y)<v<max(y,Y)) or (y==Y==v and min(x,X)<u<max(x,X))) for u,v,t in a)
            answer+=not blocked
        add(687,rows(f'{len(a)} {D}',a),answer,'All point pairs, then scan every possible blocking point inside the axis-aligned segment; blocker color ignored.')
    for _ in range(45):
        n=r.randint(1,12);K=r.randint(1,min(n,4));D=r.randint(1,n);a=[r.randint(-6,6) for i in range(n)]
        @functools.lru_cache(None)
        def collect(start,remaining):
            if remaining==0:return 0
            opts=[]
            for l in range(start,n):
                for u in range(l+1,min(n,l+D)+1):
                    s=sum(a[l:u])
                    if s%2:continue
                    tail=collect(u,remaining-1)
                    if tail is not None:opts.append(s+tail)
            return max(opts) if opts else None
        out=collect(0,K);add(688,f'{n} {K} {D}\n'+textrow(a),'NONE' if out is None else out,'Enumerate all ordered nonoverlapping even-sum interval collections, permitting adjacent segments and mandatory negative optima.')
    for _ in range(25):
        n,m=r.randint(1,5),r.randint(1,5);a=[0]*n;b=[0]*m;ops=[];out=[]
        for j in range(40):
            typ=r.choice('RC');i=r.randrange(n if typ=='R' else m);x=r.choice([-10000,-2,-1,0,1,2,10000]);ops.append((typ,i+1,x));(a if typ=='R' else b)[i]+=x;out.append(sum(max(0,u+v) for u in a for v in b))
        add(689,rows(f'{n} {m} {len(ops)}',ops),'\n'.join(map(str,out)),'Explicit grid evaluation after every update, including values exactly at zero threshold and sign reversals.')
    for _ in range(35):
        n=r.randint(1,13);D=r.choice([1,2,5,2000000000]);a=[r.choice([-10**9,-3,-1,0,1,3,10**9]) for i in range(n)];best=1
        for mask in range(1,1<<n):
            seq=[a[i] for i in range(n) if mask>>i&1];diff=[y-x for x,y in zip(seq,seq[1:])]
            if all(abs(d)>=D for d in diff) and all(x*y<0 for x,y in zip(diff,diff[1:])):best=max(best,len(seq))
        add(690,f'{n} {D}\n'+textrow(a),best,'Enumerate every indexed subsequence and inspect signed consecutive differences; exact-D boundaries and64-bit threshold arithmetic.')
    for _ in range(45):
        n=r.randint(1,12);M=r.randint(1,9);a=[(r.randrange(15),r.randrange(2)) for i in range(n)];best=-1
        for mask in range(1<<n):
            seq=[a[i] for i in range(n) if mask>>i&1]
            if len({c for v,c in seq})!=2:continue
            if all((x+y)%M for (x,c),(y,d) in itertools.combinations(seq,2)):best=max(best,len(seq))
        add(691,rows(f'{n} {M}',a),best,'Full indexed subset search; enforce both colors and every forbidden divisible-sum pair, including M=1 and self-complementary residues.')
    for _ in range(35):
        n=r.randint(1,13);K=r.randint(1,n);M=r.choice([1,2,3,7,10**9]);a=[r.randint(-5,5) for i in range(n)];count=0
        for mask in range(1<<max(0,n-1)):
            cuts=[0]+[j+1 for j in range(n-1) if mask>>j&1]+[n]
            count+=all(v-u<=K and sum(a[u:v])%M==0 for u,v in zip(cuts,cuts[1:]))
        add(692,f'{n} {K} {M}\n'+textrow(a),count,'Enumerate every complete partition cut set; length expiry, negative sums and modulus1 explicit.')
    for _ in range(30):
        P=''.join(r.choice('ab') for j in range(r.randint(1,8)));s='';ops=[];out=[]
        for j in range(60):
            op=r.choice('++--?')
            if op=='+':c=r.choice('ab');s+=c;ops.append(('+',c))
            elif op=='-':s=s[:-1];ops.append(('-',))
            else:ops.append(('?',));out.append(sum(s[i:i+len(P)]==P for i in range(len(s))))
        add(693,P+'\n'+rows(str(len(ops)),ops),'\n'.join(map(str,out)),'Maintain actual edited text and scan all overlapping starting positions on each query; deletion from empty and branching after undo.')
    for _ in range(25):
        n=r.randint(1,18);items=[(''.join(r.choice('ab') for j in range(r.randint(1,7))),r.randint(1,n)) for i in range(n)];out=[]
        for s,K in items:out.append(next((k for k in range(1,len(s)+1) if sum(t.startswith(s[:k]) for t,c in items)<=K),-1))
        add(694,rows(str(n),items),'\n'.join(map(str,out)),'Direct startswith counts for every nonempty prefix, repeated and prefix-of-other strings included.')
    for _ in range(50):
        n=r.randint(1,15);a=[(r.choice([-10**9,-1,0,0,1,10**9]),r.choice([-10**9,-1,0,0,1,10**9]),r.randrange(2)) for i in range(n)];opts=[]
        for skip in [-1]+[i for i in range(n) if n>1 and a[i][2]==0]:
            p=[v for i,v in enumerate(a) if i!=skip];opts.append((max(x for x,y,c in p)-min(x for x,y,c in p))*(max(y for x,y,c in p)-min(y for x,y,c in p)))
        add(695,rows(str(n),a),min(opts),'Try every legally removable input position plus no deletion, recompute bounds from all survivors; duplicates, collinearity, mandatory extrema and4e18 area.')
    def involutions(remaining,mapping,pairs):
        if not remaining:yield mapping,pairs;return
        x=remaining[0]
        yield from involutions(remaining[1:],dict(mapping,**{x:x}),pairs)
        for j,y in enumerate(remaining[1:],1):yield from involutions(remaining[1:j]+remaining[j+1:],dict(mapping,**{x:y,y:x}),pairs+1)
    invol=list(involutions('abcde',{},0))
    for _ in range(35):
        length=r.randint(1,14);S=''.join(r.choice('abcde') for j in range(length));T=''.join(r.choice('abcde') for j in range(length));K=r.randrange(4);good=any(p<=K and ''.join(f[c] for c in S)==T for f,p in invol)
        add(696,f'{K}\n{S}\n{T}','YES' if good else 'NO','Enumerate every disjoint-swap involution on the five-letter used alphabet, rather than infer mappings from positions.')
    patterns=['a','aa','aaa','aaaa','ab','aba','abab','ababa','aabaa','abcab','a'*20]
    texts=['a','aa','aaaaaa','abababa','abbaabba','abxxaba','aabaaba','a'*24,'abcabcabc']
    pairs=list(itertools.product(texts,patterns))
    pairs += [(''.join(r.choice('abc') for j in range(r.randint(1,30))),''.join(r.choice('abc') for j in range(r.randint(1,20)))) for i in range(70)]
    for S,P in pairs:
        n,m=len(S),len(P);queries=list(itertools.combinations_with_replacement(range(1,n+1),2));out=[]
        for l,u in queries:
            s=S[:l-1]+S[u:];out.append(sum(s[i:i+m]==P for i in range(max(0,len(s)-m+1))))
        add(697,f'{n} {m} {len(queries)}\n{S}\n{P}\n'+'\n'.join(textrow(p) for p in queries),f'{sum(out)} {sum((i+1)*v for i,v in enumerate(out))}','For every deletion interval of this original text, build joined text and scan all overlapping matches; extensive borders, m=1, m>n, empty sides/full deletion and cross-seam matches.')
    def prime(x):return x>=2 and all(x%d for d in range(2,math.isqrt(x)+1))
    for _ in range(35):
        n=r.randint(1,25);a=[(r.choice([0,1,2,3,r.randrange(30)]),r.randrange(2)) for i in range(n)];answer=sum(c!=d and prime(x+y) for (x,c),(y,d) in itertools.combinations(a,2));add(698,rows(str(n),a),answer,'Trial-divide each actual indexed pair sum; zeros, prime2, duplicates and same-color exclusion.')
    add(698,rows('30000',[(1,0)]*15000+[(1,1)]*15000),225000000,'Maximum convolution coefficient: all225 million cross-color sums equal prime2; exactness must not use too-small coefficient base/modulus.')
    large=199999;add(698,rows('30000',[(0,0)]*15000+[(large,1)]*15000),225000000 if prime(large) else 0,'High polynomial degree with225 million identical cross-color sums; primality independently trial-divided.')
    for s in ['EWE','NSNSNS','ENWSENWS','E'*30,'N'*20+'S'*20]+[''.join(r.choice('NSEW') for j in range(r.randint(1,100))) for i in range(45)]:
        on={(0,0)};x=y=0;perimeters=[0]
        for c in s:
            dx,dy={'N':(0,1),'S':(0,-1),'E':(1,0),'W':(-1,0)}[c];x+=dx;y+=dy
            if (x,y) in on:on.remove((x,y))
            else:on.add((x,y))
            p=0 if not on else 2*(max(v[0] for v in on)-min(v[0] for v in on)+max(v[1] for v in on)-min(v[1] for v in on));perimeters.append(p)
        best=max(perimeters);add(699,f'{len(s)}\n{s}',f'{best} {perimeters.index(best)} {perimeters.count(best)}','Literal illuminated-point set and full bounds recomputation at every time including0; empty sets, same-axis boxes and stale-coordinate reactivation.')

STATIC={
662:'Window [i-R,i-L] insertion/expiry and multiplicities correct; bit29 included; trace0,1,3,7 consistent.',
663:'Equal-weight pending updates prevent illegal chaining; lengths determine reachability independently of modular counts; trace parallel edges and opposite colors consistent.',
664:'Ordered monoid merge adds2*suffix*prefix, extends only all-equal sides; query order and padding identities sound; trace6→10→16.',
665:'Compressed-frontier DAG query [l-1,r) prevents same-right-end reuse; unique last service proves count; trace cheapest6.',
666:'Iterative Kosaraju and component-pair dedup semantically sound; C++ ordered-set time bound understated (finding PR666-COMPLEXITY).',
667:'Strict rank-1 queries exclude ties; left/right opposite colors only; int64 bound safe; trace contribution1.',
668:'Signed reroot equation W-2sub sound; restrict to color0 before tie comparison; int64 products safe; trace1,2,1.',
669:'Affected outgoing-edge start indices deduplicated, including u=v, cyclic adjacency and triangles; signed persistent area preserved; trace2,-2,-2.',
670:'Positive gcd normalization preserves opposite-ray sign and axes; trace antipodal point does not merge.',
671:'Nearest STRICTLY greater blocker: popping <= is correct; lower bound max(j-K,b+1) includes equal interiors; trace final1.',
672:'ID order is topological; artificial old-class0 permits first special edge once; n=1 empty path correct; trace residue0.',
673:'Open component mark-count/size-parity states compose correctly; cut accepts exactly(1,even); root state finalized; trace two-point1.',
674:'One edge row counted per insertion, including loops and same-root parallel edges; only DSU roots counted; trace second parallel edge qualifies.',
675:'Strictly-greater deque popping retains earliest equal minima; tuple(value,-i,-j) implements global tie order, negative optima accepted.',
676:'Path-edge matching recurrence uses original adjacency and prev2; pair(count,-cost) gives lexicographic objective; trace improves4→1 at same count.',
677:'Queries occur before insert/current-expiry; at step i previous multiset is exactly max(0,i-W)..i-1; predecessor/successor ranks handle duplicates.',
678:'Fenwick path eviction removes depth-(L+1), exit restores it after deleting v; L=0 and sibling restoration correct; strict ancestor query before adding v.',
679:'Centroid paths include center; complement K-s+a[c], per-child query-before-insert avoid self/same-subtree pairs; iterative traversal and nonnegative pruning valid.',
680:'Six ordered subsequence summaries compose correctly; lazy flip exchanges0/1,01/10,010/101; disjoint query identity valid; trace010→101→111.',
681:'Global balanced-root contribution removed before union/flip, added after; same-root edge no-op; isolated singleton never balanced; no graph rollback required.',
682:'XOR root-relative t is symmetric under union-root swap; complement error count when t=1; contradictions persist and self-loop invalidates; good is min(e,size-e)<=K.',
683:'Equal lengths plus sum max known counts<=length is necessary/sufficient; zero question marks and duplicate letters handled; 32-bit prefix counts safe.',
684:'Surplus length-distinct=1 exactly means one double and no higher multiplicity; atMost(1)-atMost(0) plus bounded left-end interval is correct.',
685:'Odd-d Mobius inversion correct; odd/even multiple frequency counts refer to original values, not quotients; combination validity handles K=1 and duplicate positions.',
686:'Candidates C(strictly-lower-neighbor-count,2); degree-ID orientation finds each triangle once and subtracts only unique strict-degree maximum; tie degrees retained correctly.',
687:'Only consecutive sorted points in each same-axis group are unblocked; axes do not double-count distinct points; D=0 yields no pair.',
688:'Exactly-K prefix layers, same prefix-sum parity, window [i-D,i-1], and unreachable sentinels correct; adjacent intervals legal.',
689:'Strict threshold c>-rowValue via upper_bound; differential own-row/other-column contributions correct; offline coordinate collection resets values before live replay.',
690:'Opposite-direction tails queried at <=x-D and >=x+D, reverse ranks correct; both queries before update; 64-bit thresholds safe.',
691:'Complement residues processed once; all-one-side dominates subsets, self-complement takes at most1; four color masks enforce both colors.',
692:'At i, remove i-K-1 before lookup, then add dp[i]; normalized negative remainders and m=1 correct; full prefix coverage follows recurrence.',
693:'KMP automaton records complete prefix counts and post-match failure state for overlap; paired stack pop supports undo/reappend; empty deletion safe.',
694:'Trie counts each input position including duplicates/self; first nonroot prefix count<=Ki is shortest; full-word prefix collisions can remain unsatisfiable.',
695:'Only unique extreme holders can improve; trying four arbitrary sorted extremes still includes every possible improving deletion; mandatory flags and n=1 preserved; int64 area4e18 safe.',
696:'Bidirectional involution constraints include fixed-point requirements, and nontrivial cycles count once; unused letters can remain fixed.',
697:'KMP failure chains encode all proper seam split lengths; reversed bit positions m-j align; valid mask excludes0,m; independent queries weighted in input order. See buffer-bound qualification.',
698:'Coefficient <=225000000 below998244353 and2^32; no CRT/carry issue; two colors prevent double count; primes0/1 excluded including V=0; trace polynomial correct.',
699:'Coordinates, not heap generations, define liveness, so stale entries for reactivated points remain valid extrema; per=-2 sum(minx,-maxx,miny,-maxy); time0 included.',
}
def execute():
    requested=set(sys.argv[sys.argv.index('--codes')+1].split(',')) if '--codes' in sys.argv else {f'b{i}' for i in range(662,700)}
    findings=[dict(id='PR666-COMPLEXITY',code='b666',severity='low',kind='complexity-documentation',status='confirmed-static',field='complexity',evidence='C++ creates set<pair<int,int>> pairs; inserts every inter-SCC edge into the ordered tree.',actualBound='O(n+m log(m+1)) time, O(n+m) space for the shown C++ code; Python set expected O(n+m).',claimedBound=lessons['b666']['complexity'],action='Qualify language-specific bounds, or replace ordered set with suitable hashing/sort-based bound. No output change is required.')]
    report=dict(task='Independent bounded semantic peer review b654-b699; concentrate b662-b699',reviewedCodes=sorted(requested),notReviewedCodes=[f'b{i}' for i in range(654,662)],scope='Statements, both implementations, reasoning, animated traces and complexity were manually read for b662-b699. Independent tests below are newly generated and never import the author checks/verifier.',datasetSnapshotSHA256=hashlib.sha256(raw).hexdigest(),sourceSnapshotSHA256=hashlib.sha256(source_raw).hexdigest(),seed=66269917,limitations=['Finite small-instance exhaustive/random and exact-certificate tests do not prove all hidden cases.','b654-b661 intentionally excluded; parent already reviewed part of that range.','No global benchmark or judge-time guarantee is inferred; this audit concentrates on semantic blind spots.','C++ b697 uses fixed bitset<2001>, so its bitset factor is ceil(2001/w), while Python masks scale with m; total Python memory also includes O(q) input/output tokens.'],findings=findings,problems=[],failures=[],status='running')
    REPORT.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    def one(code):
        l=lessons[code];tests=cases[code];failures=[];times={}
        with tempfile.TemporaryDirectory(prefix=code+'-peer-',dir='/tmp') as tmp:
            p=pathlib.Path(tmp);(p/'main.cpp').write_text(l['cpp']);(p/'main.py').write_text(l['python']);build=subprocess.run(['g++','-std=c++17','-O2',str(p/'main.cpp'),'-o',str(p/'main')],capture_output=True,text=True,timeout=60)
            if build.returncode:failures.append(dict(code=code,language='cpp',kind='compile',stderr=build.stderr))
            for language,cmd in [('cpp',[str(p/'main')]),('python',[sys.executable,str(p/'main.py')])]:
                if language=='cpp' and build.returncode:continue
                start=time.monotonic()
                for j,case in enumerate(tests):
                    try:
                        result=subprocess.run(cmd,input=case['input'],capture_output=True,text=True,timeout=20)
                        if result.returncode or result.stdout.split()!=case['expected'].split():failures.append(dict(code=code,language=language,caseIndex=j,input=case['input'],expected=case['expected'],actual=result.stdout,returncode=result.returncode,stderr=result.stderr,oracle=case['reason']))
                    except subprocess.TimeoutExpired:failures.append(dict(code=code,language=language,caseIndex=j,input=case['input'],expected=case['expected'],error='20-second timeout',oracle=case['reason']))
                times[language]=round(time.monotonic()-start,3)
        return dict(code=code,degree='Static statement/proof/trace/complexity review plus actual C++17/Python execution against independent small-instance oracles or exact certificates',staticReview=STATIC[int(code[1:])],implementationSHA256={k:hashlib.sha256(l[k].encode()).hexdigest() for k in ('cpp','python')},independentCasesPerLanguage=len(tests),timingSeconds=times,cases=tests,failures=failures)
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        for result in pool.map(one,sorted(requested)):
            report['problems'].append(result);report['failures'].extend(result['failures'])
            if result['failures']:
                print('ACTIONABLE_FAILURE '+json.dumps(result['failures'],ensure_ascii=False),flush=True)
            print(f"{result['code']}: {result['independentCasesPerLanguage']} independent cases/language; failures={len(result['failures'])}",flush=True)
            REPORT.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    report['status']='complete';report['independentCasesPerLanguage']=sum(p['independentCasesPerLanguage'] for p in report['problems']);report['executionFailures']=len(report['failures']);report['conclusion']='No output mismatch found in this bounded independent review.' if not report['failures'] else 'Counterexamples require owner fixes; see failures.'
    REPORT.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({k:v for k,v in report.items() if k not in ('problems','findings')},ensure_ascii=False),flush=True)
    return bool(report['failures'])
if __name__=='__main__':
    generate()
    sys.exit(execute())
