import json, pathlib, subprocess, tempfile, random, itertools, math, sys
CANNON_ANSWERS=[
    [0,0,1,1,3,4,4,6],[0,0,1,1,3,4,4,6],
    [1,1,3,5,7,9,12,14],[1,1,5,10,14,19,23,28],
    [3,3,7,14,19,26,31,36],[4,4,9,19,26,31,38,-1],
    [4,4,12,23,31,38,-1,-1],[6,6,14,28,36,-1,-1,-1]]
CANNON_GENERATOR=r'''
#include <bits/stdc++.h>
using namespace std; using U=unsigned long long;
int n,m,V,revs[256]; const U SIZE=1ULL<<25;
vector<U>keys(SIZE); vector<unsigned char>values(SIZE);
U canon(U mask,int pos){
    U h=0,v=0,both=0,rowmask=(1ULL<<m)-1;
    for(int r=0;r<n;r++){
        int row=(mask>>(r*m))&rowmask,rr=revs[row];
        h|=U(rr)<<(r*m); v|=U(row)<<((n-1-r)*m);
        both|=U(rr)<<((n-1-r)*m);
    }
    int x=pos/m,y=pos%m;
    return min({(mask<<6)|pos,(h<<6)|(x*m+m-1-y),
        (v<<6)|((n-1-x)*m+y),
        (both<<6)|((n-1-x)*m+m-1-y)})+1;
}
U hashkey(U x){
    x^=x>>30; x*=0xbf58476d1ce4e5b9ULL;
    x^=x>>27; x*=0x94d049bb133111ebULL;
    x^=x>>31; return x&(SIZE-1);
}
vector<int>moves(U mask,int u){
    vector<int>out; int x=u/m,y=u%m;
    int dx[]={1,-1,0,0},dy[]={0,0,1,-1};
    for(int k=0;k<4;k++){
        int a=x+dx[k],b=y+dy[k],seen=0;
        while(a>=0&&a<n&&b>=0&&b<m){
            int v=a*m+b;
            if((mask>>v&1)&&++seen==2){out.push_back(v);break;}
            a+=dx[k]; b+=dy[k];
        }
    }
    return out;
}
int dfs(U mask,int u){
    U key=canon(mask,u),h=hashkey(key);
    if(keys[h]==key)return values[h];
    int best=0,bound=__builtin_popcountll(mask)-2;
    if(bound<=0)return 0;
    auto options=moves(mask,u); U child=mask&~(1ULL<<u);
    sort(options.begin(),options.end(),[&](int a,int b){
        return moves(child,a).size()>moves(child,b).size();
    });
    for(int v:options){
        best=max(best,1+dfs(child,v));
        if(best==bound)break;
    }
    keys[h]=key; values[h]=best; return best;
}
int main(){
    for(n=1;n<=8;n++)for(m=n;m<=8;m++){
        if(n*m>42)continue; V=n*m;
        for(int i=0;i<(1<<m);i++){
            int v=0;
            for(int j=0;j<m;j++)v|=((i>>j)&1)<<(m-1-j);
            revs[i]=v;
        }
        fill(keys.begin(),keys.end(),0);
        int answer=dfs((1ULL<<V)-1,0);
        cout<<n<<" "<<m<<" "<<answer<<endl;
    }
}
'''
ROOT=pathlib.Path(__file__).resolve().parents[3]
DATA=ROOT/'src/lib/newProblemLessons/data/practice1.json'
CHECKS=pathlib.Path(__file__).with_name('practice1-checks.json')
MANIFEST=pathlib.Path(__file__).with_name('source.json')
def sources():
    return json.loads(MANIFEST.read_text(encoding='utf-8-sig'))['problems']
def cannon_audit():
    # Every route to generated C++ execution has this explicit host guard.
    if sys.platform!='linux':
        raise SystemExit('C++ generation is Linux-only. Run --cannon-audit in WSL kali-linux.')
    from functools import lru_cache
    def coordinate_oracle(n,m):
        @lru_cache(None)
        def visit(board,r,c):
            best=0
            for dr,dc in ((1,0),(-1,0),(0,1),(0,-1)):
                x,y=r+dr,c+dc; screen=False
                while 0<=x<n and 0<=y<m:
                    if board[x*m+y]:
                        if screen:
                            after=list(board);after[r*m+c]=0
                            best=max(best,1+visit(tuple(after),x,y))
                            break
                        screen=True
                    x+=dr;y+=dc
            return best
        return visit((1,)*(n*m),0,0)
    independent=0
    for n in range(1,9):
        for m in range(n,9):
            if n*m<=25:
                actual=coordinate_oracle(n,m)
                assert actual==CANNON_ANSWERS[n-1][m-1],(n,m,actual)
                independent+=1
    with tempfile.TemporaryDirectory(prefix='practice1-cannon-audit-',dir='/tmp') as td:
        cpp=pathlib.Path(td)/'generate.cpp';exe=pathlib.Path(td)/'generate'
        cpp.write_text(CANNON_GENERATOR,encoding='utf-8')
        subprocess.run(['g++','-std=c++17','-O3',str(cpp),'-o',str(exe)],check=True,timeout=120)
        result=subprocess.run([str(exe)],check=True,capture_output=True,text=True,timeout=600)
        rows=[tuple(map(int,line.split())) for line in result.stdout.splitlines()]
        expected=[(n,m,CANNON_ANSWERS[n-1][m-1]) for n in range(1,9) for m in range(n,9) if n*m<=42]
        assert rows==expected
    print(json.dumps({'cannonLegalSizes':58,'generatedUpToTranspose':len(rows),'independentCoordinateBoards':independent,'failures':[]}))
def puzzle_audit():
    """Full initial-domain coverage plus an independent A* search oracle.

    The oracle deliberately does not use the authored IDA* threshold loop,
    transposition pruning, bottom-distance shortcut, or strengthened heuristic.
    Its shared abstract potentials are first checked for admissibility by
    exhaustively verifying the Bellman edge inequalities on the entire domain.
    """
    import ast,io,heapq,time,hashlib
    lesson=next(p for p in json.loads(DATA.read_text(encoding='utf-8')) if p['code']=='b112')
    parsed=ast.parse(lesson['python'])
    index=next(i for i,node in enumerate(parsed.body) if isinstance(node,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='bound' for t in node.targets))
    prefix=ast.Module(body=parsed.body[:index],type_ignores=[])
    old_stdin=sys.stdin
    try:
        sys.stdin=io.StringIO('1 2 3 4 5 6 7 8 9 10 11 12 13 0 14 0')
        ns={};exec(compile(prefix,'<authored-puzzle-preprocessing>','exec'),ns)
    finally:
        sys.stdin=old_stdin
    adjacent=ns['adj'];databases=(ns['db1'],ns['db2'])
    checked_edges=0
    for database,goal in zip(databases,((8,9,10),(11,12,13))):
        goalkey=goal[0]|goal[1]<<4|goal[2]<<8|14<<12|15<<16
        assert database[goalkey]==0
        states=0
        for key,value in enumerate(database):
            if value==255:continue
            positions=[key>>(4*i)&15 for i in range(5)]
            assert len(set(positions))==5 and positions[3]<positions[4]
            states+=1
            for hole_index in (3,4):
                hole=positions[hole_index];other=positions[7-hole_index]
                for v in adjacent[hole]:
                    if v==other:continue
                    nxt=positions[:];cost=0
                    if v in positions[:3]:
                        nxt[positions.index(v)]=hole;cost=1
                    nxt[hole_index]=v;nxt[3:]=sorted(nxt[3:])
                    nextkey=sum(p<<(4*i) for i,p in enumerate(nxt))
                    assert database[nextkey]!=255 and value<=cost+database[nextkey]
                    checked_edges+=1
        assert states==262080
    md=ns['md']
    def heuristic(board):
        pos=[0]*15;holes=[]
        for i,tile in enumerate(board):
            if tile:pos[tile]=i
            else:holes.append(i)
        common=holes[0]<<12|holes[1]<<16
        return databases[0][pos[9]|pos[10]<<4|pos[11]<<8|common]+databases[1][pos[12]|pos[13]<<4|pos[14]<<8|common]+sum(md[t-1][pos[t]] for t in range(1,9))
    goal=tuple(range(1,15))+(0,0)
    def astar(start):
        queue=[(heuristic(start),0,start)];distance={start:0}
        while queue:
            _,g,board=heapq.heappop(queue)
            if distance[board]!=g:continue
            if board==goal:return g
            for hole,value in enumerate(board):
                if value:continue
                for v in adjacent[hole]:
                    if not board[v]:continue
                    nxt=list(board);nxt[hole],nxt[v]=nxt[v],0;nxt=tuple(nxt);ng=g+1
                    if ng<distance.get(nxt,100):
                        distance[nxt]=ng;heapq.heappush(queue,(ng+heuristic(nxt),ng,nxt))
        raise AssertionError('No path in full puzzle oracle')
    cases=[p for p in json.loads(CHECKS.read_text(encoding='utf-8')) if p['code']=='b112']
    hard=tuple(range(1,9))+(0,11,10,13,12,14,0,9)
    assert astar(hard)==26
    for case in cases:
        assert astar(tuple(map(int,case['input'].split())))==int(case['output'])
    started=time.monotonic();maximum=0;digest=hashlib.sha256()
    for state in sorted(ns['bottom']):
        board=list(range(1,9))+[x+8 if x else 0 for x in state];pos=[0]*15
        for u,tile in enumerate(board):
            if tile:pos[tile]=u
        holes=sorted(u for u,tile in enumerate(board) if not tile)
        code=sum(tile<<(4*u) for u,tile in enumerate(board))
        ns.update(board=board,pos=pos)
        upper=ns['bottom_distance']();bound=ns['heuristic'](*holes,0)
        while bound<upper:
            ns['seen']={code:0};result=ns['dfs'](0,bound,*holes,0,code,(-1,-1))
            if result==-1:break
            bound=result
        answer=min(bound,upper);maximum=max(maximum,answer)
        digest.update(bytes(state)+(answer,).__repr__().encode())
    assert len(ns['bottom'])==20160 and maximum==26
    print(json.dumps({'puzzleInitialBoards':20160,'maximum':maximum,
        'abstractDirectedEdgesAudited':checked_edges,
        'independentAStarCases':len(cases)+1,'domainAnswerSha256':digest.hexdigest(),
        'fullDomainSearchSeconds':round(time.monotonic()-started,3),'failures':[]}))
def fix_cpp(s):
    out=[]; quote=None; escape=False
    for c in s:
        if c=='\n' and quote:
            out.append('\\n'); continue
        out.append(c)
        if escape: escape=False; continue
        if c=='\\' and quote: escape=True; continue
        if quote and c==quote: quote=None
        elif not quote and c in ('"',"'"): quote=c
    return ''.join(out)
def add(code,topic,level,concept,goal,explanation,complexity,pitfall,steps,cpp,python,cases):
    source=next(p for p in sources() if p['code']==code)
    rows=json.loads(DATA.read_text(encoding='utf-8')) if DATA.exists() else []
    checks=json.loads(CHECKS.read_text(encoding='utf-8')) if CHECKS.exists() else []
    trace=[dict(title=t,description=d,cells=c,active=a,variables=v) for t,d,c,a,v in steps]
    row=dict(code=code,title=source['title'].split('. ',1)[1],topic=topic,level=level,concept=concept,goal=goal,explanation=explanation,complexity=complexity,pitfall=pitfall,sampleInput=source['samples'][0]['input'],sampleOutput=source['samples'][0]['output'],traceLabel=concept+'｜'+steps[0][1],trace=trace,cpp=fix_cpp('#include <bits/stdc++.h>\nusing namespace std;\n'+cpp),python=python)
    rows=[r for r in rows if r['code']!=code]+[row]
    checks=[r for r in checks if r['code']!=code]+[dict(code=code,input=i,output=o,reason=r) for i,o,r in cases]
    DATA.parent.mkdir(parents=True,exist_ok=True)
    DATA.write_text(json.dumps(sorted(rows,key=lambda r:r['code']),ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    CHECKS.write_text(json.dumps(sorted(checks,key=lambda r:r['code']),ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def generate_checks():
    """Independent tiny exhaustive oracles and analytically known large cases."""
    rng=random.Random(20261103)
    lessons=json.loads(DATA.read_text(encoding='utf-8')); owned={p['code'] for p in lessons}
    public={p['code']:{x['input'].strip() for x in p['samples']} for p in sources()}
    checks=[x for x in json.loads(CHECKS.read_text(encoding='utf-8')) if not x['reason'].startswith('Oracle:')]
    def case(code,inp,out,why):
        if code in owned and inp.strip() not in public[code] and not any(c['code']==code and c['input'].strip()==inp.strip() for c in checks):
            checks.append(dict(code=code,input=inp,output=str(out),reason='Oracle: '+why))
    for _ in range(25):
        n=rng.randint(2,8); a=[rng.randint(1,9) for _ in range(n)]; k=rng.randint(1,n)
        # Stock: enumerate all chronological buy/hold/sell actions, independent of valley merging.
        states={(0,False):0}
        for price in a:
            nxt=dict(states)
            for (t,h),v in states.items():
                if not h and t<k: nxt[t,True]=max(nxt.get((t,True),-10**9),v-price)
                if h: nxt[t+1,False]=max(nxt.get((t+1,False),-10**9),v+price)
            states=nxt
        case('b008',f'{n} {k}\n'+ ' '.join(map(str,a)),max(v for (t,h),v in states.items() if not h),'enumerate chronological trading actions')
        A,B=rng.randint(1,9),rng.randint(1,9)
        def damage(bits):
            last=[None,None]; total=0
            for x,s in zip(a,bits):
                if last[s] is not None: total+=A if last[s]==x else B
                last[s]=x
            return total
        val=max(damage(bits) for bits in itertools.product(range(2),repeat=n))
        case('b080',f'{n} {A} {B}\n'+' '.join(map(str,a)),val,'enumerate every front/back assignment')
        pairs=sum(all(a[t]<=min(a[i],a[j]) for t in range(i+1,j)) for i in range(n) for j in range(i+1,n))
        case('b064',str(n)+'\n'+' '.join(map(str,a)),2*pairs,'directly inspect every intervening height for every pair')
        K=rng.randint(2,10)
        case('b110',f'{n} {K}\n'+' '.join(map(str,a)),sum(a[i]>K*a[j] for i in range(n) for j in range(i+1,n)),'enumerate all ordered position pairs')
        s=''.join(rng.choice('ABC') for _ in range(n)); colors=sorted(set(s))
        val=min(sum(p.index(s[i])>p.index(s[j]) for i in range(n) for j in range(i+1,n)) for p in itertools.permutations(colors))
        case('b051',s,val,'enumerate all color block orders and their inversion counts')
        original=[rng.randint(0,4) for _ in range(n)]; radius=rng.randint(1,n-1)
        measurement=[sum(original[max(0,i-radius):min(n,i+radius+1)]) for i in range(n)]
        case('b078',f'{n} 4 {radius}\n'+' '.join(map(str,measurement)),sum(original),'construct original intensity first; window sums are input only')
        C=rng.randint(1,4)
        v=[max(a[j]-C*abs(i-j) for j in range(n)) for i in range(n)]
        case('b115',' '.join(map(str,a))+'\n'+str(C),sum(x-y for x,y in zip(v,a)),'all-source height lower bounds rather than two sweeps')
        B0=rng.randint(1,4); C0=rng.randint(1,8); delta=(C0-1)//B0
        v=[min(a[j]+delta*abs(i-j) for j in range(n)) for i in range(n)]
        case('b120',f'{n} {B0} {C0}\n'+' '.join(str(x*B0) for x in a),sum(a)-sum(v),'all-source upper bounds in can units')
        # Endpoint card selection: literal recursive branching, independent of interval table.
        cards=[10*x for x in a]
        def choose(tup,t):
            if not tup:return 0
            return max(tup[0]+t*(tup[0]//10)+choose(tup[1:],t+1),tup[-1]+t*(tup[-1]//10)+choose(tup[:-1],t+1))
        case('b045',str(n)+'\n'+' '.join(map(str,cards)),choose(tuple(cards),0),'enumerate every left/right sequence')
        k=rng.randint(1,n); desired=sorted(a,reverse=True)[:k]
        val=min(sum(j-i for i,j in enumerate(combo)) for combo in itertools.combinations(range(n),k) if sorted((a[i] for i in combo),reverse=True)==desired)
        case('b046',f'{n} {k}\n'+' '.join(map(str,a)),val,'enumerate every admissible subset of top-valued artworks')
    # Game: direct two-dimensional minimax, no closed form in oracle.
    D=[[0]*81 for _ in range(81)]
    for x in range(1,81):
        for y in range(1,81):
            options=[D[u][v] for u,v in ((x-2,y-1),(x-1,y-2)) if u>=1 and v>=1]
            losing=[v for v in options if v%2==0]
            if options:D[x][y]=1+(min(losing) if losing else max(options))
    for _ in range(80):
        x,y=rng.randint(1,80),rng.randint(1,80); d=D[x][y]
        case('b119',f'{x} {y}',f'{"Win" if d%2 else "Lose"} {d}','explicit winning-state minimax on all 80x80 positions')
    for _ in range(20):
        # Random tree fingerprints from independent per-leaf BFS distances.
        n=rng.randint(2,14); edges=[(i,rng.randrange(i)) for i in range(1,n)]; g=[[] for _ in range(n)]
        for u,v in edges:g[u].append(v);g[v].append(u)
        leaves=[i for i in range(n) if len(g[i])==1]; total=0
        for j,u in enumerate(leaves):
            dist=[-1]*n;dist[u]=0;q=[u]
            for v in q:
                for w in g[v]:
                    if dist[w]<0:dist[w]=dist[v]+1;q.append(w)
            total+=sum(dist[v]**2 for v in leaves[j+1:])
        case('b016',str(n)+'\n'+'\n'.join(f'{u+1} {v+1}' for u,v in edges),total,'BFS from each original leaf, sum pairwise squared distances')
        # Directed replacement rules are applied literally to full text.
        s=''.join(rng.choice('aAb0') for _ in range(10)); S=''.join(rng.choice('aAb0') for _ in range(15)); T=''.join(rng.choice('aAb0') for _ in range(15)); out=s
        for a,b in zip(S,T):out=out.replace(a,b)
        case('b082',f'10 15\n{s}\n{S}\n{T}',out,'literal whole-string replacement after each rule')
        # Life: scalar neighbor counting with a fresh grid each generation.
        h,w,t=rng.randint(1,7),rng.randint(1,7),rng.randint(1,7); a=[[rng.randrange(2) for _ in range(w)] for _ in range(h)]; old=[r[:] for r in a]
        for __ in range(t):
            b=[[0]*w for _ in range(h)]
            for y in range(h):
                for x in range(w):
                    count=sum(old[v][u] for v in range(max(0,y-1),min(h,y+2)) for u in range(max(0,x-1),min(w,x+2)) if (v,u)!=(y,x))
                    b[y][x]=int(count==3 or old[y][x] and count==2)
            old=b
        case('b114',f'{w} {h}\n{t}\n'+'\n'.join(' '.join(map(str,r)) for r in a),'\n'.join(''.join(map(str,r)) for r in old),'independent scalar eight-neighbor simultaneous updates')
        n=rng.randint(2,7); degree=[1]*n
        seq=[rng.randrange(n) for _ in range(n-2)]
        for x in seq:degree[x]+=1
        perms=sorted(set(itertools.permutations(seq))); k=rng.randint(1,len(perms)+1)
        out='-1' if k>len(perms) else '\n'.join(str(x+1) for x in perms[k-1])
        if n>=3:case('b042',f'{n} {k}\n'+' '.join(map(str,degree)),out,'enumerate distinct multiset permutations directly')
    for n in range(2,8):
        total=sum('AAA' not in ''.join(s) and s.count('L')<=1 for s in itertools.product('PAL',repeat=n))
        case('b118',str(n),total,'enumerate every attendance record; A=proxy,L=leave')
    from collections import deque,Counter
    for _ in range(18):
        # Delete actual substrings from current strings; no prefix-DP oracle.
        a=''.join(rng.choice('ab') for _ in range(rng.randint(1,5)))
        b=''.join(rng.choice('ab') for _ in range(rng.randint(1,5)))
        L,K=rng.randint(1,3),rng.randint(1,4); queue=deque([(a,b,0)]); seen={(a,b)}; answer='Impossible'
        while queue:
            x,y,t=queue.popleft()
            if x==y:answer=str(t);break
            if t==K:continue
            for side,s in enumerate((x,y)):
                for l in range(len(s)):
                    for r in range(l+1,min(len(s),l+L)+1):
                        z=s[:l]+s[r:];state=(z,y) if side==0 else (x,z)
                        if state not in seen:seen.add(state);queue.append((*state,t+1))
        case('b007',f'{a}\n{b}\n{L} {K}',answer,'BFS over literal deletion operations on current strings')
        # Tiny full permutation oracle for the successor of a repeated sequence.
        M=rng.randint(2,7); N=rng.randint(1,min(5,M)); t=tuple(rng.randint(1,M) for _ in range(N))
        candidates=(p for p in itertools.permutations(range(1,M+1),N) if p>t)
        successor=next(candidates,None)
        if successor:case('b063',f'1\n{N} {M}\n'+' '.join(map(str,t)),' '.join(map(str,successor)),'lexicographically enumerate all distinct card sequences')
        # Every unordered scratchcard pair, direct three inequalities.
        cards=[(rng.randint(1,3)*1000000,*[rng.randint(0,6000000) for j in range(3)]) for i in range(rng.randint(1,9))]
        amounts=sorted({x[0]+y[0] for i,x in enumerate(cards) for y in cards[i+1:] if all(x[j]+y[j]>=x[0]+y[0] for j in (1,2,3))})
        case('b041',str(len(cards))+'\n'+'\n'.join(' '.join(map(str,x)) for x in cards),'\n'.join(map(str,[len(amounts)]+amounts)),'enumerate every distinct card pair without dominance queries')
        # Cost assignment: enumerate all bijections, including forbidden pairs.
        N=rng.randint(1,5); L=rng.randint(1,10); U=L+rng.randint(0,15); x=[rng.randint(1,12) for i in range(N)]; y=[rng.randint(1,12) for i in range(N)]
        banned={(i,j) for i in range(N) for j in range(N) if rng.random()<.25}; feasible=[]
        for p in itertools.permutations(range(N)):
            if all((i,p[i]) not in banned for i in range(N)):feasible.append(sum(min(max(x[i]+y[p[i]]-L,0),U-L) for i in range(N)))
        inp=f'1\n{N} {L} {U} {len(banned)}\n'+'\n'.join(f'{i+1} {j+1}' for i,j in sorted(banned))+'\n'+' '.join(map(str,x))+'\n'+' '.join(map(str,y))
        case('b010',inp,min(feasible) if feasible else 'no','enumerate all perfect assignments and evaluate exact clamp costs')
        # Every connected induced vertex subset for the influence objective.
        N=rng.randint(2,8); edges=[(i,j) for i in range(N) for j in range(i+1,N) if rng.random()<.35]
        if not edges:edges=[(0,1)]
        g=[set() for i in range(N)]
        for u,v in edges:g[u].add(v);g[v].add(u)
        answer=0
        for bits in range(1,1<<N):
            members={i for i in range(N) if bits>>i&1}; reach={min(members)}; stack=list(reach)
            for u in stack:
                for v in g[u]&members:
                    if v not in reach:reach.add(v);stack.append(v)
            if reach==members:answer=max(answer,len(members)*min(len(g[u]&members) for u in members))
        case('b072',f'{N} {len(edges)}\n'+'\n'.join(f'{u+1} {v+1}' for u,v in edges),answer,'enumerate connected induced subsets and count internal degrees')
        # Literal boat simulation for all sale-city subsets.
        c=rng.randint(1,5); p=[rng.randint(1,5) for i in range(c)]; s=[rng.randint(1,5) for i in range(c)]; nums=[rng.randint(1,4) for i in range(c)]; T=rng.randint(1,130)
        r=[[rng.randint(0,nums[j]) for j in range(i+1)] for i in range(c)]; answer=-1
        for mask in range(1<<c):
            on=set(range(c)); cost=sold=0
            for i in range(c):
                cost+=sum(nums[j] for j in on)*p[i]
                if mask>>i&1:
                    unload={j for j in on if j<=i};cost+=sum(nums[j] for j in unload)*s[i];sold+=sum(r[i][j] for j in unload);on-=unload
            if cost<=T:answer=max(answer,sold)
        inp=f'{c} {T}\n'+'\n'.join(' '.join(map(str,row)) for row in (p,s,nums)+tuple(r))
        case('b020',inp,answer,'enumerate sale subsets and directly simulate remaining cargo each day')
        # Every subset convex hull in each point set, canonical translation.
        def cross(a,b,c):return (b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0])
        def hull(points):
            points=sorted(points);lo=[];hi=[]
            for p in points:
                while len(lo)>1 and cross(lo[-2],lo[-1],p)<=0:lo.pop()
                lo.append(p)
            for p in reversed(points):
                while len(hi)>1 and cross(hi[-2],hi[-1],p)<=0:hi.pop()
                hi.append(p)
            return lo[:-1]+hi[:-1]
        def shapes(points):
            out={}
            for bits in range(1,1<<len(points)):
                h=hull([p for i,p in enumerate(points) if bits>>i&1])
                if len(h)<3:continue
                ar=abs(sum(h[i][0]*h[(i+1)%len(h)][1]-h[i][1]*h[(i+1)%len(h)][0] for i in range(len(h))))
                key=tuple((x-h[0][0],y-h[0][1]) for x,y in h);out[key]=ar
            return out
        points=list(itertools.product(range(5),repeat=2)); A=rng.sample(points,rng.randint(3,7)); B=rng.sample(points,rng.randint(3,7)); aa,bb=shapes(A),shapes(B); values=sorted({aa[k] for k in aa.keys()&bb.keys()})
        inp=f'{len(A)} {len(B)}\n'+'\n'.join(f'{x} {y}' for x,y in A+B)
        case('b049',inp,'\n'.join(map(str,[len(values)]+values)),'enumerate all point subsets, monotone-chain hulls, then compare translated polygons')
    for _ in range(12):
        # Independent full set-partition clustering oracle.
        N=rng.randint(4,7); d=rng.randint(1,5); points=[tuple(rng.randint(1,5) for j in range(d)) for i in range(N)]; distance=[[sum(abs(x-y) for x,y in zip(a,b)) for b in points] for a in points]; best={}
        labels=[0]*N
        def partitions(i,groups):
            if i==N:
                if 2<=groups<N:
                    spacing=min(distance[u][v] for u in range(N) for v in range(u+1,N) if labels[u]!=labels[v]);best[groups]=max(best.get(groups,-1),spacing)
                return
            for g in range(groups+1):labels[i]=g;partitions(i+1,max(groups,g+1))
        partitions(1,1); feasible=[K for K in range(3,N) if best[K]==best[K-1]]
        if feasible:case('b125',f'{d} {N}\n'+'\n'.join(' '.join(map(str,p)) for p in points),max(feasible),'enumerate every nonempty set partition; no MST in oracle')
        # Three-dimensional safety directly from Manhattan metric, threshold BFS.
        F,M,N=rng.randint(1,2),rng.randint(1,3),rng.randint(1,3); cells=list(itertools.product(range(1,F+1),range(1,M+1),range(1,N+1))); restaurants=rng.sample(cells,rng.randint(1,len(cells))); safety={p:min(sum(abs(a-b) for a,b in zip(p,q)) for q in restaurants) for p in cells}; queries=[(rng.choice(cells),rng.choice(cells)) for j in range(6)]; answer=[]
        for a,b in queries:
            for threshold in range(min(safety[a],safety[b]),-1,-1):
                seen={a};queue=[a]
                for p in queue:
                    for q in cells:
                        if q not in seen and safety[q]>=threshold and sum(abs(x-y) for x,y in zip(p,q))==1:seen.add(q);queue.append(q)
                if b in seen:answer.append(threshold);break
        inp=f'{F} {M} {N}\n{len(restaurants)}\n'+'\n'.join(' '.join(map(str,p)) for p in restaurants)+f'\n{len(queries)}\n'+'\n'.join(' '.join(map(str,a+b)) for a,b in queries)
        case('b018',inp,'\n'.join(map(str,answer)),'direct Manhattan safety values and threshold reachability, no spanning tree')
    # Boundary constructions have analytic answers, no solution program is invoked.
    for _ in range(14):
        n=rng.randint(2,7);k=rng.randint(1,min(3,n-1));H=n-k
        coefficients=[[rng.randint(1,7) for j in range(k)] for h in range(H)]
        # Full n! arrangements: facilities are objects 0..k-1, residents follow.
        best=0
        for permutation in itertools.permutations(range(n)):
            position=[0]*n
            for floor,obj in enumerate(permutation):position[obj]=floor
            satisfaction=min(abs(position[f]-position[k+h])*coefficients[h][f] for h in range(H) for f in range(k))
            best=max(best,satisfaction)
        case('b003',f'{n} {k}\n'+'\n'.join(' '.join(map(str,row)) for row in coefficients),best,'enumerate every full floor permutation, no matching or threshold search')
        # Connected graph plus chords; retain only queries satisfying distance>sqrt(n).
        n=rng.randint(7,18);edges={(i,i+1) for i in range(n-1)}
        for j in range(rng.randint(0,3)):
            u,v=sorted(rng.sample(range(n),2));edges.add((u,v))
        graph=[[] for i in range(n)]
        for u,v in edges:graph[u].append(v);graph[v].append(u)
        distances=[]
        for s in range(n):
            d=[-1]*n;d[s]=0;queue=[s]
            for u in queue:
                for v in graph[u]:
                    if d[v]<0:d[v]=d[u]+1;queue.append(v)
            distances.append(d)
        valid=[(s,t) for s in range(n) for t in range(s+1,n) if distances[s][t]**2>n]
        if valid:
            queries=[rng.choice(valid) for j in range(8)]
            inp=f'{n} {len(edges)} {len(queries)}\n'+'\n'.join(f'{u+1} {v+1}' for u,v in sorted(edges))+'\n'+'\n'.join(f'{s+1} {t+1}' for s,t in queries)
            case('b022',inp,' '.join(str(distances[s][t]) for s,t in queries),'independent all-source plain BFS; all query distances satisfy the live promise')
    def turn_path_oracle(n,m):
        best=1
        def visit(r,c,axis,used,length):
            nonlocal best
            best=max(best,length)
            if best==n*m:return
            for direction,(dr,dc) in enumerate(((1,0),(-1,0),(0,1),(0,-1))):
                if direction//2==axis:continue
                x,y=r+dr,c+dc
                if 0<=x<n and 0<=y<m and (x,y) not in used:
                    used.add((x,y));visit(x,y,direction//2,used,length+1);used.remove((x,y))
        visit(0,0,-1,{(0,0)},1)
        return best
    for n in range(1,7):
        for m in range(1,7):
            if n*m<=25:
                case('b062',f'{n} {m}',turn_path_oracle(n,m),'literal coordinate DFS enumerates every nonrepeating alternating-axis path')
    # Full 4x4 BFS, including moves in the top two rows. Filter only initial states
    # allowed by the statement after the distances have been computed.
    goal=tuple(range(1,15))+(0,0); puzzle={goal:0};queue=deque([goal])
    adjacent=[[] for i in range(16)]
    for u in range(16):
        r,c=divmod(u,4)
        for x,y in ((r+1,c),(r-1,c),(r,c+1),(r,c-1)):
            if 0<=x<4 and 0<=y<4:adjacent[u].append(x*4+y)
    while queue:
        state=queue.popleft();distance=puzzle[state]
        if distance==6:continue
        for hole,value in enumerate(state):
            if value:continue
            for v in adjacent[hole]:
                if state[v]:
                    after=list(state);after[hole],after[v]=after[v],0;after=tuple(after)
                    if after not in puzzle:puzzle[after]=distance+1;queue.append(after)
    allowed=[(state,d) for state,d in puzzle.items() if state[:8]==tuple(range(1,9)) and d>=3]
    for state,distance in rng.sample(allowed,min(8,len(allowed))):
        inp='\n'.join(' '.join(map(str,state[i:i+4])) for i in range(0,16,4))
        case('b112',inp,distance,'unheuristic full-4x4 breadth-first search from the goal to depth6')
    # Safety table entries are all finite input values, not sample-only branches.
    for n in range(1,9):
        for m in range(1,9):
            if n*m<=42:case('b097',f'{n} {m}',CANNON_ANSWERS[n-1][m-1],'complete exact finite-domain generator; --cannon-audit regenerates all58 sizes and independently checks coordinate DFS on small boards')
    # Maximum-size non-tree, many-shortest-path graph for the certified hub method.
    if 'b022' in owned:
        n=10000;width=10;levels=1000;edges=[]
        for level in range(levels-1):
            for a in range(width):
                for b in range(width):edges.append((level*width+a+1,(level+1)*width+b+1))
        queries=[];answers=[]
        for i in range(30000):
            a=rng.randrange(899);b=rng.randrange(a+101,1000)
            queries.append((a*width+rng.randrange(10)+1,b*width+rng.randrange(10)+1));answers.append(b-a)
        inp=f'{n} {len(edges)} {len(queries)}\n'+'\n'.join(f'{u} {v}' for u,v in edges)+'\n'+'\n'.join(f'{u} {v}' for u,v in queries)
        case('b022',inp,' '.join(map(str,answers)),'N10000 M99900 Q30000 layered graph; each edge changes layer by1 and complete consecutive layers attain that lower bound')
    n=1000000
    case('b016',str(n)+'\n'+'\n'.join(f'{i} {i+1}' for i in range(1,n)),(n-1)**2%1000000007,'maximum-depth million-node chain has exactly two leaves')
    n=100000
    case('b055',f'{n} 3\n'+'\n'.join(f'{i} {i+1}' for i in range(n-1))+f'\n0 {n-1}\n{n-1} {n-1}\n1 {n-2}',f'{n-1}\n0\n{n-3}','maximum-depth chain; distances are absolute label differences')
    n=1000000
    case('b064',str(n)+'\n'+' '.join(['7']*n),n*(n-1),'all equal maximum-length skyline; every pair sees each other')
    n=1000
    case('b045',str(n)+'\n'+' '.join(['100000']*n),100000*n+10000*n*(n-1)//2,'equal maximum-value cards; order independent and sum exceeds 32 bits')
    n=100000
    case('b110',f'{n} 2\n'+' '.join(['1000']*(n//2)+['1']*(n//2)),(n//2)**2,'each large first-half value pairs with each small second-half value')
    case('b119','10000 10000','Lose 6666','direct minimax diagonal pattern checked separately over full board')
    CHECKS.write_text(json.dumps(sorted(checks,key=lambda x:x['code']),ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print('Generated',len(checks),'independent checks')
def verify():
    lessons=json.loads(DATA.read_text(encoding='utf-8'))
    if '--codes' in sys.argv:
        selected=set(sys.argv[sys.argv.index('--codes')+1].split(','))
        lessons=[p for p in lessons if p['code'] in selected]
    manifest={p['code']:p for p in sources()}
    cases=json.loads(CHECKS.read_text(encoding='utf-8'))
    counts={'cpp':0,'python':0}; failed=[]
    # Run this verifier inside kali-linux. All binaries stay in Linux /tmp.
    if sys.platform!='linux': raise SystemExit('Run via WSL kali-linux; Windows executables are prohibited.')
    with tempfile.TemporaryDirectory(prefix='practice1-',dir='/tmp') as td:
        td=pathlib.Path(td)
        for p in lessons:
            code=p['code']; cpp=td/(code+'.cpp'); py=td/(code+'.py'); exe=td/code
            cpp.write_text(p['cpp'],encoding='utf-8'); py.write_text(p['python'],encoding='utf-8')
            build=subprocess.run(['g++','-std=c++17','-O2',str(cpp),'-o',str(exe)],capture_output=True,text=True,timeout=120)
            if build.returncode: failed.append((code,'compile',build.stderr)); continue
            tests=manifest[code]['samples']+[c for c in cases if c['code']==code]
            for lang,command in [('cpp',[str(exe)]),('python',['python3',str(py)])]:
                for t in tests:
                    try:
                        r=subprocess.run(command,input=t['input']+'\n',text=True,capture_output=True,timeout=30)
                        if r.returncode or r.stdout.split()!=t['output'].split():
                            failed.append((code,lang,t.get('reason','public sample'),r.stdout,r.stderr))
                        else: counts[lang]+=1
                    except subprocess.TimeoutExpired: failed.append((code,lang,'timeout'))
            print(code,'checked',len(tests),'cases per language',flush=True)
    print(json.dumps({'lessons':len(lessons),'tests':counts,'failures':failed},ensure_ascii=False,indent=2))
if __name__=='__main__':
    if '--cannon-audit' in sys.argv: cannon_audit()
    elif '--puzzle-audit' in sys.argv: puzzle_audit()
    elif '--generate' in sys.argv: generate_checks()
    else: verify()
