"""Portable independent exhaustive oracles for competition lessons.

Run Python checks with WSL/Linux; --generate appends deterministic fixtures.
C++ compilation is delegated to the repository's Linux-only shared verifier.
"""
import pathlib,json,random,itertools,functools,math,heapq,sys
from fractions import Fraction
ROOT=pathlib.Path(__file__).resolve().parents[3]
HERE=pathlib.Path(__file__).resolve().parent
SOURCE={p['code']:p for p in json.loads((HERE/'source.json').read_text(encoding='utf-8'))['problems']}
DATA=ROOT/'src/lib/newProblemLessons/data/competition.json'
CHECKS=HERE/'competition-checks.json'
rng=random.Random(20261104)
def make():
    out=[]
    def put(c,i,o,r):out.append(dict(code='a'+str(c),input=i,output=str(o),reason='獨立 oracle：'+r))
    # Enumerate integers directly, unlike the solution's exponent partition search.
    first={}
    for M in range(2,20000):
        x=M;ex=[];p=2
        while p*p<=x:
            e=0
            while x%p==0:x//=p;e+=1
            if e:ex.append(e)
            p+=1
        if x>1:ex.append(1)
        ways=math.factorial(sum(ex))
        for e in ex:ways//=math.factorial(e)
        first.setdefault(ways,[])
        if len(first[ways])<2:first[ways].append(M)
    for ways,values in sorted(first.items()):
        if len(values)==2 and ways not in (2,3,4):put(856,str(ways)+'\n',sum(values),'依序直接質因數分解2..19999，取首次兩個符合多項係數者。')
        if len(out)>=12:break
    for _ in range(16):
        # Group coverage by unit intervals, not merged sweepline.
        groups=[]
        for g in range(rng.randint(2,4)):
            groups.append([tuple(rng.sample(range(11),2)) for j in range(rng.randint(1,4))])
        low=min(x for g in groups for r in g for x in r);high=max(x for g in groups for r in g for x in r);length=[0]*(len(groups)+1)
        for x in range(low,high):length[sum(any(min(a,b)<=x<max(a,b) for a,b in group) for group in groups)]+=1
        order=sorted(range(len(length)),key=lambda j:(-length[j],j))[:2]
        inp=str(len(groups))+'\n'+''.join(str(2*len(g))+'\n'+''.join(f'{a} {b}\n' for a,b in g) for g in groups)
        put(849,inp,'\n'.join(f'{j} {100*length[j]/(high-low):.2f}%' for j in order),'逐一單位線段測試各組是否覆蓋，不使用掃描線。')
        n=rng.randint(1,8);count=sum(all(s[i:i+2] not in ((0,0),(1,1)) for i in range(n-1)) for s in itertools.product(range(3),repeat=n))
        put(850,str(n)+'\n',count,'枚舉3^n個實際字串。')
        r=rng.randint(1,14)
        def coins(rem):return 1 if rem==0 else sum(coins(rem-c) for c in (1,2,5) if c<=rem)
        put(851,str(r)+'\n',coins(r),'直接遞迴列舉所有有序投幣序列。')
        m=rng.randint(2,5);ballots=[rng.sample(range(1,m+1),m) for j in range(rng.randint(1,10))];alive=set(range(1,m+1));result='indeterminable'
        while alive:
            freq={c:sum(next(x for x in row if x in alive)==c for row in ballots) for c in alive}
            winner=next((c for c,v in freq.items() if 2*v>len(ballots)),None)
            if winner is not None:result=f'{winner} is elected';break
            mn=min(freq.values());alive-={c for c in alive if freq[c]==mn}
        put(852,f'{m}\n{len(ballots)}\n'+''.join(' '.join(map(str,b))+'\n' for b in ballots),result,'每輪重新掃完整選票，不沿用候選指標。')
        items=[]
        for j in range(rng.randint(1,8)):
            a,b=sorted(rng.sample(range(10),2));items.append((rng.randint(1,12),a,b))
        best=0
        for mask in range(1<<len(items)):
            ix=[j for j in range(len(items)) if mask>>j&1]
            if all(items[i][2]<=items[j][1] or items[j][2]<=items[i][1] for i,j in itertools.combinations(ix,2)):best=max(best,sum(items[j][0] for j in ix))
        put(857,f'1\n{len(items)}\n'+''.join(' '.join(map(str,t))+'\n' for t in items),best,'枚舉所有寶物子集合，兩兩檢查半開區間相交。')
        seq=[''.join(rng.choice('ATGC') for _ in range(6)) for j in range(3)]
        def subseq(s):return {''.join(s[i] for i in range(len(s)) if mask>>i&1) for mask in range(1<<len(s))}
        ss=list(map(subseq,seq));total=sum(max(map(len,ss[i]&ss[j])) for i,j in itertools.combinations(range(3),2))
        put(859,'3\n'+'\n'.join(seq)+'\n',f'{100*total/18:.2f}','列出每條DNA的所有子序列集合並取交集最長。')
        A=rng.randint(1,100000);B=rng.randint(1,100000);sa,sb=rng.randint(0,5),rng.randint(0,5)
        def dec(x,s):return str(x//10**s)+('.'+str(x%10**s).zfill(s) if s else '')
        value=Fraction(A*B,10**(sa+sb));integer=value.numerator//value.denominator;f=value-integer;bits=''
        for j in range(10):f*=2;bit=int(f);bits+=str(bit);f-=bit
        put(862,dec(A,sa)+'\n'+dec(B,sb)+'\n',f'{integer:b}.'+bits,'Fraction精確乘法後以重複乘2長除法逐位輸出。')
        n=rng.randint(1,5);a=[[rng.randrange(3) for j in range(n)] for i in range(n)];p=list(range(n*n))
        def find(x):
            while p[x]!=x:x=p[x]
            return x
        for i in range(n):
            for j in range(n):
                if a[i][j]==2:continue
                for I,J in ((i+1,j),(i,j+1)):
                    if I<n and J<n and a[I][J]==a[i][j]:p[find(i*n+j)]=find(I*n+J)
        cnt=[len({find(i*n+j) for i in range(n) for j in range(n) if a[i][j]==color}) for color in (1,0)]
        put(865,str(n)+'\n'+''.join(' '.join(map(str,r))+'\n' for r in a),' '.join(map(str,cnt)),'並查集合併同色相鄰格，和BFS教學使用不同資料結構。')
        # Exhaustive star graph BFS.
        start='1234';pairs=[];dist={start:0};q=[start]
        for s in q:
            for j in range(1,4):
                t=list(s);t[0],t[j]=t[j],t[0];t=''.join(t)
                if t not in dist:dist[t]=dist[s]+1;q.append(t)
        targets=rng.sample(q,5);put(867,'4\n'+''.join(start+' '+t+'\n' for t in targets),'\n'.join(str(dist[t]) for t in targets),'完整列出24個排列的首位交換圖BFS。')
        n=rng.randint(1,10);s=''.join(rng.choice('()') for j in range(n));best=n
        for mask in range(1<<n):
            bal=0;valid=True;kept=0
            for i,c in enumerate(s):
                if not mask>>i&1:continue
                kept+=1;bal+=1 if c=='(' else -1
                if bal<0:valid=False;break
            if valid and bal==0:best=min(best,n-kept)
        put(868,f'{n}\n{s}\n',best,'枚舉所有保留子序列並檢查前綴與總平衡。')
        n=rng.randint(2,8);k=rng.randint(1,n);xs=rng.sample(range(1,30),n);towns=[(x,rng.randrange(k)) for x in xs];best=10**9
        for chosen in itertools.combinations(range(n),k):best=min(best,max(sorted(abs(x-xs[j]) for j in chosen)[s] for x,s in towns))
        put(869,f'{n} {k}\n'+''.join(f'{x} {s}\n' for x,s in towns),best,'枚舉所有k局位置，逐鎮直接找第s+1近郵局。')
        n=rng.randint(2,5);B=rng.randint(1,7);initial=rng.randrange(B+1);edges=[(u,v,rng.randint(-B-2,B+2)) for u in range(n) for v in range(u+1,n) if rng.randrange(2)];stations={u for u in range(n) if rng.randrange(2)};dist={(0,0,initial):0};q=[(0,0,0,initial)];answer=-1
        while q:
            cost,used,u,bat=heapq.heappop(q)
            if cost!=dist[(used,u,bat)]:continue
            if u==n-1:answer=cost;break
            moves=[]
            for U,v,w in edges:
                if U==u and bat+w>=0:moves.append((used,v,min(B,bat+w),cost))
            if not used and u in stations:
                for extra in range(1,B-bat+1):moves.append((1,u,bat+extra,cost+extra))
            for U,v,b,c in moves:
                state=(U,v,b)
                if c<dist.get(state,10**9):dist[state]=c;heapq.heappush(q,(c,U,v,b))
        put(870,f'{n} {len(edges)} 1 {n}\n{B} {initial}\n'+''.join(f'{u+1} {v+1} {w}\n' for u,v,w in edges)+str(len(stations))+' '+ ' '.join(str(x+1) for x in sorted(stations))+'\n',answer,'小容量下枚舉電量與是否充過電，用完整狀態Dijkstra，圖為DAG保證無正環。')
        n=rng.randint(2,5);d=rng.randint(1,6);edges=[]
        for u,v in itertools.combinations(range(n),2):
            if rng.randrange(2):
                l=rng.randrange(d);r=rng.randint(l+1,d);edges.append((u,v,rng.randint(1,20),l,r))
        answers=[]
        for time in range(d):
            available=[e for e in edges if e[3]<=time<e[4]];best=10**9
            for chosen in itertools.combinations(available,n-1):
                p=list(range(n))
                def find(x):
                    while x!=p[x]:x=p[x]
                    return x
                valid=True
                for u,v,w,l,r in chosen:
                    a,b=find(u),find(v)
                    if a==b:valid=False;break
                    p[a]=b
                if valid:best=min(best,sum(e[2] for e in chosen))
            answers.append(-1 if best==10**9 else best)
        put(873,f'{n} {len(edges)} {d}\n'+''.join(f'{u+1} {v+1} {w} {l} {r}\n' for u,v,w,l,r in edges),' '.join(map(str,answers)),'逐時刻枚舉每個n−1邊子集，不使用Kruskal或分治。')
        n=rng.randint(4,8);k=rng.randint(1,n//2);points=rng.sample([(x,y) for x in range(8) for y in range(8)],n)
        @functools.lru_cache(None)
        def match(mask,left):
            if not left:return 0.0
            if mask.bit_count()<2*left:return math.inf
            bit=mask&-mask;i=bit.bit_length()-1;rest=mask^bit;best=match(rest,left)
            z=rest
            while z:
                b=z&-z;j=b.bit_length()-1;z-=b;best=min(best,math.dist(points[i],points[j])+match(rest^b,left-1))
            return best
        answer=match((1<<n)-1,k)
        put(874,f'{n} {k}\n'+''.join(f'{x} {y}\n' for x,y in points),f'{answer:.10f}','枚舉所有被選頂點及全部匹配；依三角不等式最小匹配自然不交叉。')
        n=rng.randint(1,8);k=rng.randint(1,n);ranges=[tuple(sorted((rng.randint(1,9),rng.randint(1,9)))) for j in range(n)];answers=[]
        for g in range(1,k+1):
            best=0
            for cuts in itertools.combinations(range(1,n),g-1):
                borders=(0,)+cuts+(n,);score=0
                for l,r in zip(borders,borders[1:]):score+=len(set(c for a,b in ranges[l:r] for c in range(a,b+1)))
                best=max(best,score)
            answers.append(best)
        put(876,f'{n} {k}\n'+''.join(f'{a} {b}\n' for a,b in ranges),' '.join(map(str,answers)),'枚舉所有切點，小顏色範圍直接建立每隊顏色集合。')
        # Chomp oracle enumerates physical legal removals recursively.
        @functools.lru_cache(None)
        def winning(a,b,c):
            return any(not winning(x,min(b,x),min(c,x)) for x in range(1,a)) or any(not winning(a,y,min(c,y)) for y in range(b)) or any(not winning(a,b,z) for z in range(c))
        queries=[];lines=[]
        for __ in range(4):
            a=rng.randint(1,8);b=rng.randint(0,a);c=rng.randint(0,b);queries.append((a,c,b-c,a-b));moves=[]
            for x in range(1,a):
                if not winning(x,min(b,x),min(c,x)):moves.extend((1,x+1))
            for y in range(b):
                if not winning(a,y,min(c,y)):moves.extend((2,y+1))
            for z in range(c):
                if not winning(a,b,z):moves.extend((3,z+1))
            lines.append(str(len(moves)//2))
            if moves:lines.append(' '.join(map(str,moves)))
        put(871,'4\n'+''.join(' '.join(map(str,q))+'\n' for q in queries),'\n'.join(lines),'遞迴窮舉全部合法吃法，與唯一敗態壓縮DP獨立。')
    # Full-size families with simple proven answers.
    n=100000
    put(873,f'{n} {n-1} 1\n'+''.join(f'{i} {i+1} 1000000000 0 1\n' for i in range(1,n)),(n-1)*1000000000,'十萬節點唯一生成樹，各邊10^9，總和超32位元。')
    put(874,f'{n} 1\n0 0\n1 0\n'+''.join(f'{10*i} {10*i}\n' for i in range(2,n)),'1.0000000000','十萬點唯一最近距離1，其他點彼此至少sqrt200。')
    put(874,'36 18\n'+''.join(f'{100*(i//2)+i%2} 0\n' for i in range(36)),'18.0000000000','最大k=18，18條互斥單位線段達最短邊下界。')
    n=100000;k=20
    put(876,f'{n} {k}\n'+'1 1000000000\n'*n,' '.join(str(g*1000000000) for g in range(1,k+1)),'十萬人同樣十億顏色，每隊恰有十億，20隊超32位元。')
    n=2000;rows=[''.join('1' if abs(i-j)==1 else '0' for j in range(n)) for i in range(n)]
    put(875,str(n)+'\n'+'\n'.join(rows)+'\n1\n0\n',n-1,'2000點最大長鏈，融合單點圖仍是原鏈。')
    return [c for c in out if not any(s['input'].strip()==c['input'].strip() for s in SOURCE[c['code']]['samples'])]
def equivalent(code,actual,expected):
    if code=='a874':
        try:return math.isclose(float(actual),float(expected),rel_tol=1e-6,abs_tol=1e-6)
        except ValueError:return False
    return actual.strip()==expected.strip()
if __name__=='__main__':
    cases=make()
    if '--generate' in sys.argv:
        old=json.loads(CHECKS.read_text(encoding='utf-8'));seen={(c['code'],c['input']) for c in old};new=[]
        for c in cases:
            key=c['code'],c['input']
            if key not in seen:new.append(c);seen.add(key)
        old.extend(new);CHECKS.write_text(json.dumps(old,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');print('appended',len(new),'independent cases')
    else:
        import subprocess,tempfile,time
        lessons={p['code']:p for p in json.loads(DATA.read_text(encoding='utf-8'))};fail=[];start=__import__('time').monotonic()
        with tempfile.TemporaryDirectory(prefix='competition-oracle-') as tmp:
            for code in sorted({c['code'] for c in cases}):
                path=pathlib.Path(tmp)/(code+'.py');path.write_text(lessons[code]['python'],encoding='utf-8')
                for c in cases:
                    if c['code']!=code:continue
                    try:
                        r=subprocess.run([sys.executable,str(path)],input=c['input'],text=True,capture_output=True,timeout=90)
                        if r.returncode or not equivalent(code,r.stdout,c['output']):fail.append(dict(code=code,input=c['input'][:1000],expected=c['output'][:1000],actual=r.stdout[:1000],stderr=r.stderr[-1000:]))
                    except subprocess.TimeoutExpired:fail.append(dict(code=code,error='90 second timeout'))
        print(json.dumps(dict(tests=len(cases),seconds=round(__import__('time').monotonic()-start,2),failures=fail),ensure_ascii=False,indent=2));sys.exit(bool(fail))
