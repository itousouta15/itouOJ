#!/usr/bin/env python3
"""Independent semantic peer review. Reads frozen authored code, never regenerates it.
Run with Linux Python; C++17 programs are compiled and run only in /tmp.
No author's checks/verifier are imported. All expected results below come from
literal enumeration, separate simulations, standard-library exact arithmetic,
or explicitly identified mathematical certificates.
"""
import collections, concurrent.futures, datetime, fractions, hashlib, io, itertools, json, math, pathlib, random, subprocess, sys, tempfile, time
HERE=pathlib.Path(__file__).resolve().parent
ROOT=HERE.parents[2]
DATA=ROOT/'src/lib/newProblemLessons/data/nov08-746-790.json'
RAW=DATA.read_bytes();LESSONS=json.loads(RAW)
SOURCES={x['code']:x for x in json.loads((HERE/'source.json').read_text(encoding='utf-8'))}
SEED=7467901108
def oracle(code,data):
    t=iter(data.split());I=lambda:int(next(t));num=int(code[1:]);n=I();out=[]
    if num==746:
        P=I();a=[I() for _ in range(n)];best=-1;count=0
        for mask in range(1<<n):
            if mask.bit_count()%2!=P:continue
            v=0
            for i,x in enumerate(a):
                if mask>>i&1:v^=x
            if v>best:best=v;count=1
            elif v==best:count+=1
        return f'{best} {count}'
    if num==747:
        m,s,t0=I(),I(),I();edges=[(I(),I(),I()) for _ in range(m)];g=collections.defaultdict(list)
        for u,v,c in edges:g[u].append((v,c));g[v].append((u,c))
        start=(s,t0);target=(t0,s);frontier={start:None};seen={start};depth=0
        while frontier:
            if target in frontier:
                first=frontier[target];return f'{depth} {first[0]} {first[1]}'
            nxt={}
            for (a,b),first in frontier.items():
                for x,c in g[a]:
                    for y,d in g[b]:
                        if c!=d or x==y or (x==b and y==a) or (x,y) in seen:continue
                        key=(x,y);value=first or key
                        if key not in nxt or value<nxt[key]:nxt[key]=value
            seen.update(nxt);frontier=nxt;depth+=1
        return '-1 0 0'
    if num==748:
        good=[]
        for a in range(1,n+1):
            if a*a*a>n:break
            for b in range(a,math.isqrt(n//a)+1):
                if n%(a*b):continue
                c=n//a//b
                if math.gcd(a,b)>1 and math.gcd(a,c)>1 and math.gcd(b,c)>1 and math.gcd(a,b,c)==1:good.append((c-a,a,b,c))
        if not good:return '0 -1\n-'
        best=min(good);return f'{len(good)} {best[0]}\n'+' '.join(map(str,best[1:]))
    if num==749:
        m=n;n=I();votes=[(I(),I(),I()) for _ in range(n)]
        def winner(excluded):
            totals={i:0 for i in range(1,m+1) if i not in excluded}
            for v in votes:totals[next(i for i in v if i not in excluded)]+=1
            return min(totals,key=lambda i:(-totals[i],i))
        w=winner(set());pairs=[p for p in itertools.combinations(range(1,m+1),2) if w not in p and winner(set(p))!=w]
        return f'{w} {len(pairs)} '+(' '.join(map(str,pairs[0])) if pairs else '0 0')
    if num==750:
        m,s,target=I(),I(),I();edges=[(I()-1,I()-1,I(),I(),I()) for _ in range(m)];Z=1<<n;V=n*Z;INF=10**40;dist=[INF]*V;dist[s]=0
        # Bellman-Ford distance first, then count in increasing distance order.
        expanded=[]
        for u,v,w,mask,val in edges:
            for x in range(Z):
                if x&mask==val:expanded.append((u*Z+x,v*Z+(x^(1<<v)),w))
        for _ in range(V-1):
            change=False
            for u,v,w in expanded:
                if dist[u]+w<dist[v]:dist[v]=dist[u]+w;change=True
            if not change:break
        ways=[0]*V;ways[s]=1
        for u in sorted(range(V),key=dist.__getitem__):
            if dist[u]==INF:continue
            for a,b,w in expanded:
                if a==u and dist[b]==dist[a]+w:ways[b]+=ways[a]
        end=(n-1)*Z+target
        return '-1 0' if dist[end]==INF else f'{dist[end]} {ways[end]%101}'
    if num==751:
        p=n;a=I();q=I();b=I();K=I()
        if p==q and a==b:return 'IMPOSSIBLE'
        values=[]
        for sec in itertools.count():
            A=sec%p==a;B=sec%q==b
            if A!=B:values.append((sec,'A' if A else 'B'))
            if len(values)==K:return f'{sec} {values[-1][1]}'
    if num==752:
        D=n;M=I();batches=[[I(),I(),next(t),I()] for _ in range(M)];short=[0,0];lost=0
        for day in range(1,D+1):
            need=[I(),I()]
            for batch in batches:
                if batch[0]<day and batch[1]<day:lost+=batch[3];batch[3]=0
            def serve(kind,k):
                while need[k]:
                    eligible=[b for b in batches if b[2]==kind and b[0]<=day<=b[1] and b[3]]
                    if not eligible:break
                    b=min(eligible,key=lambda b:b[1]);b[3]-=1;need[k]-=1
            serve('A',0);serve('B',1);order=(0,1) if need[0]>=need[1] else (1,0)
            for k in order:serve('U',k)
            for k in (0,1):short[k]+=need[k]
        return f'{short[0]} {short[1]} {lost} {sum(b[3] for b in batches)}'
    if num==753:
        cards=[(I(),I()) for _ in range(n)];best=None;count=0
        for p in itertools.permutations(range(n)):
            for flip in itertools.product((0,1),repeat=n):
                a=[cards[i][::(-1 if f else 1)] for i,f in zip(p,flip)]
                if any(a[i][1]!=a[i+1][0] for i in range(n-1)):continue
                joints=[a[i][1] for i in range(n-1)];sign=[(b>a)-(b<a) for a,b in zip(joints,joints[1:])]
                if 0 in sign or any(x==y for x,y in zip(sign,sign[1:])):continue
                cost=sum(flip)
                if best is None or cost<best:best=cost;count=1
                elif cost==best:count+=1
        return 'IMPOSSIBLE' if best is None else f'{best} {count}'
    if num==754:
        a=[(I(),I(),I()) for _ in range(n)];lo=min(x for x,y,w in a)-1;hi=max(y for x,y,w in a)+1
        heights={x:sum(w for l,r,w in a if l<=x<=r) for x in range(lo-1,hi+2)};peaks=[];x=lo
        while x<=hi:
            y=x
            while y<hi and heights[y+1]==heights[x]:y+=1
            if heights[x]>0 and heights[x]>heights[x-1] and heights[x]>heights[y+1]:peaks.append((heights[x],x,y-x+1))
            x=y+1
        if not peaks:return '0 0 0 0'
        h=max(p[0] for p in peaks);return f'{len(peaks)} {sum(p[2] for p in peaks)} {h} {min(p[1] for p in peaks if p[0]==h)}'
    if num==755:
        m,B=I(),I();deadline=[I() for _ in range(n)];edges=[(I()-1,I()-1) for _ in range(m)];done=[-1]*n;unlocked={};rd=1;late=count=0
        while True:
            for v in range(n):
                if done[v]<0 and v not in unlocked and all(done[u]>=0 and done[u]<rd for u,w in edges if w==v):unlocked[v]=rd
            candidates=sorted((v for v in unlocked if done[v]<0),key=lambda v:(unlocked[v],deadline[v],v))[:B]
            if not candidates:break
            for v in candidates:done[v]=rd;late+=max(0,rd-deadline[v]);count+=1
            rd+=1
        return f'{rd-1 if count==n else -1} {count} {late}\n'+' '.join(map(str,done))
    if num==756:
        K=I();a=[I() for _ in range(n)]
        def trees(v):
            if len(v)==1:return [(v[0],0)]
            result=[]
            for k in range(1,len(v)):
                for x,c in trees(v[:k]):
                    for y,d in trees(v[k:]):
                        if x%K==y%K:result.append((x+y,c+d+abs(x-y)))
            return result
        costs=[c for s,c in trees(a)]
        return 'IMPOSSIBLE' if not costs else f'{min(costs)} {costs.count(min(costs))}'
    if num==757:
        s=next(t)
        def expand(i):
            text=''
            while i<len(s) and s[i]!=')':
                if s[i]=='(':inner,i=expand(i+1);text+=inner*int(s[i+1]);i+=2
                else:text+=s[i];i+=1
            return text,i
        text,_=expand(0);state=score=0
        for c in text:
            if c=='F':state^=1
            else:score+=(c=='A' and state==0) or (c=='B' and state==1)
        return f'{state} {score%1000000007}'
    if num==758:
        M,D=I(),I();a=[(I(),I()) for _ in range(n)];W=sum(w for v,w in a);P=fractions.Fraction(0);E=fractions.Fraction(0)
        for x,wx in a:
            for y,wy in a:
                chance=fractions.Fraction(wx*wy,W*W)
                if x!=y:
                    E+=2*chance
                    if x<y and y-x<=D and (x+y)%M==0:P+=chance
                else:
                    E+=3*chance
                    for z,wz in a:
                        if x<z and z-x<=D and (x+z)%M==0:P+=chance*fractions.Fraction(wz,W)
        return f'{P.numerator} {P.denominator} {E.numerator} {E.denominator}'
    if num==759:
        R=n;C,K=I(),I();g=[list(next(t)) for _ in range(R)];orig=[row[:] for row in g];p=[(I()-1,I()-1,next(t)) for _ in range(2)];seen=set();meet=swap=0
        reflect={'/':dict(zip('URDL','RULD')),'\\':dict(zip('URDL','LDRU'))};delta={'U':(-1,0),'R':(0,1),'D':(1,0),'L':(0,-1)}
        for _ in range(K):
            old=p[:];new=[];toggles=collections.Counter((r,c) for r,c,d in old)
            for r,c,d in old:
                seen.add((r,c));direction=reflect[g[r][c]][d];dr,dc=delta[direction];new.append(((r+dr)%R,(c+dc)%C,direction))
            for (r,c),v in toggles.items():
                if v%2:g[r][c]='/' if g[r][c]=='\\' else '\\'
            p=new;meet+=p[0][:2]==p[1][:2];swap+=old[0][:2]!=old[1][:2] and old[0][:2]==p[1][:2] and old[1][:2]==p[0][:2]
        a,b=p;return f'{a[0]+1} {a[1]+1} {a[2]} {b[0]+1} {b[1]+1} {b[2]} {meet} {swap} {sum(g[r][c]!=orig[r][c] for r in range(R) for c in range(C))} {len(seen)}'
    if num==760:
        X=I();a=[(I(),I(),I()) for _ in range(n)];good=[]
        for seq in itertools.permutations(range(n),3):
            x=fractions.Fraction(X)
            for i in seq:
                f,p,q=a[i]
                if x<=f:break
                x=math.floor((x-f)*fractions.Fraction(p,q))
                if x==0:break
            else:good.append((x,tuple(i+1 for i in seq)))
        if not good:return '-1 0 -1 -1 -1'
        best=max(x for x,p in good);seq=[p for x,p in good if x==best];return f'{best} {len(seq)} '+' '.join(map(str,min(seq)))
    if num==761:
        S=n;R,M=I(),I();W=[I() for _ in range(S)];packets=['?'*M]*S
        for _ in range(R):
            p=I()-1;packets[p]=next(t);q=I()-1;letters=sorted({s[q] for s in packets}-{'?'})
            if not letters:out.append('? 0 0');continue
            sums={c:sum(W[i] for i,s in enumerate(packets) if s[q]==c) for c in letters};v=max(sums.values());winners=[c for c in letters if sums[c]==v];out.append(f'{winners[0]} {v} {len(winners)}')
    elif num==762:
        K=I();a=[]
        for x in range(n+1):
            runs=[len(v) for v in bin(x)[2:].split('0') if v]
            if len(runs)==K and all(a<b for a,b in zip(runs,runs[1:])):a.append(x)
        return f'{len(a)} {sum(a)}'
    elif num==763:
        s=next(t);rounds=last=0
        def groups(s):
            g=[list(v) for k,v in itertools.groupby(s)]
            if len(g)>1 and g[0][0]==g[-1][0]:g[0]=g[-1]+g[0];g.pop()
            return g
        while True:
            g=groups(s)
            if len(g)==1:break
            doomed={i for i,v in enumerate(g) if len(v)<len(g[i-1]) and len(v)<len(g[(i+1)%len(g)])}
            if not doomed:break
            last=sum(len(g[i]) for i in doomed);s=''.join(''.join(v) for i,v in enumerate(g) if i not in doomed);rounds+=1
        return f'{rounds} {len(s)} {len(groups(s))} {last}'
    elif num==764:
        K=I();a=[(I(),I(),I(),I()) for _ in range(n)];good=[]
        for p in a:
            views=sum(not any(all(p[j]==q[j] for j in range(3) if j!=axis) and q[axis]<p[axis] for q in a) for axis in range(3))
            if views==K:good.append(p)
        return f'{len(good)} {sum(p[3] for p in good)}'
    elif num==765:
        H=I();s=next(t);cost=[I() for _ in range(n)];values=[]
        for chars in itertools.product('()[]',repeat=n):
            stack=[];ok=True
            for c in chars:
                if c in '([':
                    if len(stack)==H or (stack and stack[-1]==c):ok=False;break
                    stack.append(c)
                else:
                    if not stack or stack.pop()!=('(' if c==')' else '['):ok=False;break
            if ok and not stack:values.append(sum(v for a,b,v in zip(chars,s,cost) if a!=b))
        return '-1 0' if not values else f'{min(values)} {values.count(min(values))}'
    elif num==766:
        T=I();a=[(I(),I(),I()) for _ in range(n)];scores=[]
        active=[{i for i,(l,r,w) in enumerate(a) if l<=sec<=r} for sec in range(T+1)]
        for x,y in itertools.combinations(range(T+1),2):scores.append((sum(a[i][2] for i in active[x]^active[y]),x,y))
        best=max(v for v,x,y in scores);pairs=[(x,y) for v,x,y in scores if v==best];return f'{best} {len(pairs)} {pairs[0][0]} {pairs[0][1]}'
    elif num==767:
        R=n;C,K=I(),I();g=[next(t) for _ in range(R)];unseen={(r,c) for r in range(R) for c in range(C)};blacks=[];holes=[]
        while unseen:
            start=min(unseen);component={start};todo=[start];unseen.remove(start)
            for r,c in todo:
                for p in ((r-1,c),(r+1,c),(r,c-1),(r,c+1)):
                    if p in unseen and g[p[0]][p[1]]==g[r][c]:component.add(p);todo.append(p);unseen.remove(p)
            if g[start[0]][start[1]]=='#':blacks.append(component)
            elif not any(r in (0,R-1) or c in (0,C-1) for r,c in component):holes.append(component)
        good=[]
        for black in blacks:
            near=sum(any(abs(r-x)+abs(c-y)==1 for r,c in black for x,y in hole) for hole in holes)
            if near==K:good.append(black)
        return f'{len(good)} {sum(map(len,good))}'
    elif num==768:
        from functools import lru_cache
        @lru_cache(None)
        def go(a,b):
            if not a or not b:return 0
            moves=[go(a-d,b)==0 for d in range(1,a+1) if b%d==0]+[go(a,b-d)==0 for d in range(1,b+1) if a%d==0];return sum(moves)
        for _ in range(n):v=go(I(),I());out.append(('FIRST ' if v else 'SECOND ')+str(v))
    elif num==769:
        g=[[I() for _ in range(n)] for _ in range(n)];points=[0]*n;gd=[0]*n
        for i,j in itertools.combinations(range(n),2):
            x,y=g[i][j],g[j][i];points[i]+=3 if x>y else x==y;points[j]+=3 if y>x else x==y;gd[i]+=x-y;gd[j]+=y-x
        grouped=collections.defaultdict(list)
        for i,p in enumerate(points):grouped[p].append(i)
        metrics={}
        for group in grouped.values():
            inner={i:[0,0] for i in group}
            for i,j in itertools.combinations(group,2):
                x,y=g[i][j],g[j][i];inner[i][0]+=3 if x>y else x==y;inner[j][0]+=3 if y>x else x==y;inner[i][1]+=x-y;inner[j][1]+=y-x
            for i in group:metrics[i]=(-points[i],-inner[i][0],-inner[i][1],-gd[i],i)
        return ' '.join(str(i+1) for i in sorted(metrics,key=metrics.__getitem__))
    elif num==770:
        K=I();a=[I() for _ in range(n)];values=[]
        for x,y in itertools.combinations(a,2):
            bx=f'{x:040b}';by=f'{y:040b}';shared=sum(u==v=='1' for u,v in zip(bx,by));different=sum(u!=v for u,v in zip(bx,by))
            if shared==K and different%2:values.append(int(''.join('1' if '1' in (u,v) else '0' for u,v in zip(bx,by)),2))
        return f'{len(values)} {sum(values)}'
    elif num==771:
        K=I();a=[I() for _ in range(n)];b=[I() for _ in range(n)];scores=[]
        for s in range(n):
            e=[(a[i]-b[(i+s)%n])**2 for i in range(n)];scores.append(min(sum(e[i] for i in keep) for keep in itertools.combinations(range(n),n-K)))
        return f'{min(scores)} {scores.count(min(scores))} {scores.index(min(scores))}'
    elif num==772:
        W,R=I(),I();arrivals=[(I(),I()) for _ in range(n)];waiting=collections.deque();ready=0;current=None;count=wait=last=0;j=0
        for sec in itertools.count():
            if current and sec==current[0]:last=sec;current=None;ready=sec+R
            if current is None and sec>=ready and waiting:
                at,d=waiting.popleft();wait+=sec-at;current=(sec+d,at)
            while j<n and arrivals[j][0]==sec:
                at,d=arrivals[j];j+=1
                if current is None and sec>=ready and not waiting:current=(sec+d,at);count+=1
                elif len(waiting)<W:waiting.append((at,d));count+=1
            if j==n and not waiting and current is None:return f'{count} {wait} {last}'
    elif num==773:
        K=I();pairs=[(x,n//x) for x in range(1,n+1) if n%x==0 and x<=n//x and (x%2 or (n//x)%2) and (n//x-x)%K==0];return f'{len(pairs)} {min((y-x for x,y in pairs),default=-1)}'
    elif num==774:
        A=n;B,N=I(),I();values={fractions.Fraction(p,q) for q in range(1,N+1) for p in range(q+1) if (p%2)!=(q%2) and math.gcd(p,q)==1 and fractions.Fraction(p,q)<=fractions.Fraction(A,B)};v=max(values);return f'{v.numerator} {v.denominator}'
    elif num==775:
        N=n;A,B,M,D,R=[I() for _ in range(5)];flags=[((A*sec+B)//M)%D==R for sec in range(N)];return f'{sum(flags)} {sum(v and (i==0 or not flags[i-1]) for i,v in enumerate(flags))}'
    elif num==776:
        h=n;polygons=[]
        for _ in range(h+1):m=I();polygons.append([(I(),I()) for _ in range(m)])
        def classify(p,poly):
            # Rational horizontal-ray crossings; no area/Pick identity used.
            inside=False
            for a,b in zip(poly,poly[1:]+poly[:1]):
                cross=(b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0])
                if not cross and min(a[0],b[0])<=p[0]<=max(a[0],b[0]) and min(a[1],b[1])<=p[1]<=max(a[1],b[1]):return 'B'
                if (a[1]>p[1])!=(b[1]>p[1]):
                    at=fractions.Fraction(b[0]-a[0],b[1]-a[1])*(p[1]-a[1])+a[0]
                    if at>p[0]:inside=not inside
            return 'I' if inside else 'O'
        outer=polygons[0];count=boundary=0
        for x in range(min(p[0] for p in outer),max(p[0] for p in outer)+1):
            for y in range(min(p[1] for p in outer),max(p[1] for p in outer)+1):
                classes=[classify((x,y),poly) for poly in polygons]
                if 'B' in classes:boundary+=1
                elif classes[0]=='I' and all(z=='O' for z in classes[1:]):count+=1
        return f'{count} {boundary}'
    elif num==777:
        a=[];count=high=0
        for _ in range(n):
            op=next(t);x=I();old=sum(a)
            if op=='A':a.append(x)
            else:
                for _ in range(min(x,len(a))):a.pop()
            count+=old>=0 and sum(a)<0;high=max(high,len(a))
        return f'{sum(a)} {count} {high}'
    elif num==778:
        for _ in range(n):
            y,m,d,w=I(),I(),I(),I();date=datetime.date(y,m,d);choices=[]
            for day in range(1,32):
                try:candidate=datetime.date(y,m,day)
                except ValueError:continue
                if candidate.weekday() in (w,(w+3)%7):choices.append((abs(day-d),day))
            diff,day=min(choices);out.append(f'{day} {diff}')
    elif num==779:
        X=n;K=I();valid=[]
        for base in range(2,37):
            # Build most-significant-first digits using exact powers, not repeated division.
            power=1
            while power*base<=X:power*=base
            digits=[];x=X
            while power:digits.append(x//power);x%=power;power//=base
            if len(set(digits))==K and all((x+y)%2 for x,y in zip(digits,digits[1:])):valid.append(base)
        return f'{len(valid)} {max(valid,default=-1)}'
    elif num==780:
        a=[(I(),I(),I(),I()) for _ in range(n)];areas=[]
        for p,q in itertools.combinations(a,2):
            def good(a,b,c,d):
                labels=[label for v,label in sorted(((a,0),(b,0),(c,1),(d,1)))];return len({a,b,c,d})==4 and labels in ([0,1,0,1],[1,0,1,0])
            if good(p[0],p[2],q[0],q[2]) and good(p[1],p[3],q[1],q[3]):areas.append((min(p[2],q[2])-max(p[0],q[0]))*(min(p[3],q[3])-max(p[1],q[1])))
        return f'{len(areas)} {max(areas,default=0)}'
    elif num==781:
        m=I();edges={(I(),I()):(I(),I()) for _ in range(m)};good=[]
        for k in range(n-1):
            for mid in itertools.permutations(range(2,n),k):
                path=(1,)+mid+(n,);pairs=list(zip(path,path[1:]))
                if not all(p in edges for p in pairs):continue
                if sum(edges[p][1] for p in pairs)==2:good.append((sum(edges[p][0] for p in pairs),-len(pairs)))
        return '-1 -1' if not good else f'{min(good)[0]} {-min(good)[1]}'
    elif num==782:
        K=I();a=[I() for _ in range(n)];scores=[]
        for ids in itertools.combinations(range(n),K):
            if sum(y-x==1 for x,y in zip(ids,ids[1:]))==1:scores.append(sum(a[i] for i in ids))
        return 'NONE' if not scores else f'{max(scores)} {scores.count(max(scores))%1000000007}'
    elif num==783:
        jobs=[(I(),I()) for _ in range(n)];cost=[]
        for seq in itertools.permutations(range(n)):
            afinish=[];time=0
            for j in seq:time+=jobs[j][0];afinish.append(time)
            bfinish=0
            for j,at in zip(seq,afinish):bfinish=max(at,bfinish)+jobs[j][1]
            cost.append(bfinish)
        return f'{min(cost)} {cost.count(min(cost))}'
    elif num==784:
        K=I();a=[I() for _ in range(n)];scores=[sum(a[i] for i in ids) for ids in itertools.combinations(range(n),K) if all(y-x>=3 for x,y in zip(ids,ids[1:]))];return f'{max(scores)} {scores.count(max(scores))}'
    elif num==785:
        R=n;C,K=I(),I();a=[[I() for _ in range(C)] for _ in range(R)];vals=[]
        for r in range(R):
            for c in range(C):
                nei=[a[x][y] for x in range(R) for y in range(C) if abs(r-x)+abs(c-y)==1]
                if sum(a[r])==sum(row[c] for row in a) and sum(x>a[r][c] for x in nei)==K:vals.append(a[r][c])
        return f'{len(vals)} {sum(vals)}'
    elif num==786:
        votes=[I() for _ in range(n)];leaders=[]
        for k in range(1,n+1):
            x=2*votes[:k].count(1)+votes[:k].count(2);y=2*votes[:k].count(2)+votes[:k].count(1);leaders.append(votes[k-1] if x==y else 1 if x>y else 2)
        last=leaders[-1];score=2*votes.count(last)+votes.count(3-last);return f'{last} {score} {sum(x!=y for x,y in zip(leaders,leaders[1:]))}'
    elif num==787:
        K=I();a=[I() for _ in range(n)];perimeters=[]
        for x,y,z in itertools.combinations(a,3):
            if x+y>z and y+z>x and z+x>y and (x+y+z)%K==0:perimeters.append(x+y+z)
        return f'{len(perimeters)} {max(perimeters,default=-1)}'
    elif num==788:
        s=next(t);depth=0;escaped=False;where=collections.defaultdict(set)
        for c in s:
            if escaped:
                if c.isalpha():where[c].add(bool(depth))
                escaped=False
            elif c=='#':escaped=True
            elif c=='[':depth+=1
            elif c==']':depth=max(0,depth-1)
            else:where[c].add(bool(depth))
        return ''.join(c for c in sorted(where) if where[c]=={False,True}) or '-'
    elif num==789:
        q=I();f=[I()-1 for _ in range(n)]
        for _ in range(q):
            u,v,a,b=I()-1,I()-1,I(),I();seen=set();time=0
            while (u,v) not in seen and u!=v:
                seen.add((u,v))
                for _ in range(a):u=f[u]
                for _ in range(b):v=f[v]
                time+=1
            out.append(str(time if u==v else -1))
    elif num==790:
        M,K=I(),I();state=[False]*n;count=0
        for _ in range(M):
            p=I()-1;change={p,(p+1)%n};state=[(not v) if i in change else v for i,v in enumerate(state)];count+=sum(state)==K
        return f'{count}\n'+''.join('1' if x else '0' for x in state)
    else:raise ValueError(code)
    return '\n'.join(out)

def generate(num,rng):
    R=rng.randint;C=rng.choice
    def rows(head,body):return str(head)+'\n'+'\n'.join(x if isinstance(x,str) else ' '.join(map(str,x)) for x in body)+'\n'
    n=R(1,7)
    if num==746:return rows(f'{n} {R(0,1)}',[[R(0,63) for _ in range(n)]])
    if num==747:
        n=R(2,7);s,t=rng.sample(range(1,n+1),2);edges=[(u,v,R(0,1)) for u,v in itertools.combinations(range(1,n+1),2) if R(0,2)];return rows(f'{n} {len(edges)} {s} {t}',edges)
    if num==748:return str(R(1,12000))+'\n'
    if num==749:
        m=R(3,7);n=R(0,16);return rows(f'{m} {n}',[rng.sample(range(1,m+1),3) for _ in range(n)])
    if num==750:
        n=R(1,4);m=R(0,12);Z=1<<n;edges=[]
        for _ in range(m):mask=R(0,Z-1);edges.append((R(1,n),R(1,n),R(1,4),mask,R(0,Z-1)&mask))
        return rows(f'{n} {m} {R(0,Z-1)} {R(0,Z-1)}',edges)
    if num==751:
        p=R(1,12);q=R(1,12);return f'{p} {R(0,p-1)} {q} {R(0,q-1)} {R(1,40)}\n'
    if num==752:
        D=R(1,5);M=R(0,8);batches=[]
        for _ in range(M):a=R(1,D);batches.append((a,R(a,D+3),C('ABU'),R(1,8)))
        rng.shuffle(batches);return rows(f'{D} {M}',batches+[(R(0,8),R(0,8)) for _ in range(D)])
    if num==753:
        n=R(1,5);return rows(n,[(R(0,2),R(0,2)) for _ in range(n)])
    if num==754:
        intervals=[]
        for _ in range(n):l=R(-7,7);intervals.append((l,R(l,8),R(-5,5)))
        return rows(n,intervals)
    if num==755:
        B=R(1,n);edges=[(u,v) for u in range(1,n+1) for v in range(1,n+1) if u!=v and R(0,5)==0];return rows(f'{n} {len(edges)} {B}',[[R(1,9) for _ in range(n)]]+edges)
    if num==756:return rows(f'{n} {R(1,5)}',[[R(-3,3) for _ in range(n)]])
    if num==757:
        def expression(depth):
            return ''.join(('('+expression(depth-1)+')'+str(R(2,4))) if depth and R(0,2)==0 else C('FAB') for _ in range(R(1,3)))
        s=expression(3);return rows(len(s),[s])
    if num==758:return rows(f'{n} {R(1,7)} {R(0,9)}',[(R(0,8),R(1,8)) for _ in range(n)])
    if num==759:
        r=R(1,4);c=R(1,4)
        if r*c<2:c=2
        p,q=rng.sample(range(r*c),2);return rows(f'{r} {c} {R(0,40)}',[''.join(C('/\\') for _ in range(c)) for _ in range(r)]+[(p//c+1,p%c+1,C('URDL')),(q//c+1,q%c+1,C('URDL'))])
    if num==760:
        n=R(3,7);return rows(f'{n} {R(1,30)}',[(R(0,20),R(1,7),R(1,7)) for _ in range(n)])
    if num==761:
        S=R(1,6);M=R(1,4);q=R(1,16);return rows(f'{S} {q} {M}',[[C((0,0,0,1,3)) for _ in range(S)]]+[(R(1,S),''.join(C('ABCD???') for _ in range(M)),R(1,M)) for _ in range(q)])
    if num==762:return f'{R(0,4095)} {R(0,7)}\n'
    if num==763:
        s=''.join(C('abc')*R(1,6) for _ in range(R(1,10)));return rows(len(s),[s])
    if num==764:
        coords=rng.sample(list(itertools.product(range(-2,3),repeat=3)),n);return rows(f'{n} {R(0,3)}',[(*p,R(-10,10)) for p in coords])
    if num==765:
        n=R(1,7);return rows(f'{n} {R(0,5)}',[''.join(C('()[]') for _ in range(n)),[R(0,5) for _ in range(n)]])
    if num==766:
        T=R(1,10);a=[]
        for _ in range(n):l=R(0,T);a.append((l,R(l,T),R(-9,9)))
        return rows(f'{n} {T}',a)
    if num==767:
        r=R(1,6);c=R(1,6);return rows(f'{r} {c} {R(0,3)}',[''.join(C('#.') for _ in range(c)) for _ in range(r)])
    if num==768:return rows('16',[(R(0,18),R(0,18)) for _ in range(16)])
    if num==769:
        a=[[R(0,4) if i!=j else 0 for j in range(n)] for i in range(n)];return rows(n,a)
    if num==770:return rows(f'{n} {R(0,10)}',[[C((R(0,1023),1<<39,(1<<40)-1)) for _ in range(n)]])
    if num==771:return rows(f'{n} {R(0,n-1)}',[[R(-5,5) for _ in range(n)] for _ in range(2)])
    if num==772:return rows(f'{n} {R(0,4)} {R(0,4)}',list(zip(sorted(R(0,15) for _ in range(n)),[R(1,5) for _ in range(n)])))
    if num==773:return f'{R(1,1000)} {R(1,40)}\n'
    if num==774:
        B=R(1,50);return f'{R(0,B)} {B} {R(1,30)}\n'
    if num==775:
        M=R(1,20);D=R(1,20);return f'{R(1,300)} {R(0,200)} {R(0,500)} {M} {D} {R(0,D-1)}\n'
    if num==776:
        W,H=R(4,12),R(4,12);polys=[[(0,0),(W,0),(W,H),(0,H)]]
        if R(0,1):
            x,y=R(1,W-2),R(1,H-2);xx,yy=R(x+1,W-1),R(y+1,H-1);polys.append([(x,y),(xx,y),(xx,yy),(x,yy)])
        for p in polys:
            if R(0,1):p.reverse()
        return rows(len(polys)-1,list(itertools.chain.from_iterable([[str(len(p))]+p for p in polys])))
    if num==777:return rows(n,[(('A',R(-9,9)) if R(0,1) else ('U',R(0,9))) for _ in range(n)])
    if num==778:
        inputs=[]
        for _ in range(n):
            y=C((1,4,100,400,1900,2000,2024,9999));m=R(1,12);d=R(1,28);inputs.append((y,m,d,R(0,6)))
        return rows(n,inputs)
    if num==779:return f'{C((0,R(0,10000),10**18))} {R(0,36)}\n'
    if num==780:
        rectangles=[]
        for _ in range(n):x=R(-4,4);y=R(-4,4);rectangles.append((x,y,R(x+1,8),R(y+1,8)))
        return rows(n,rectangles)
    if num==781:
        n=R(2,8);edges=[(u,v,R(1,6),R(0,1)) for u in range(1,n+1) for v in range(1,n+1) if u!=v and R(0,3)==0];return rows(f'{n} {len(edges)}',edges)
    if num==782:return rows(f'{n} {R(1,n+2)}',[[R(-8,8) for _ in range(n)]])
    if num==783:return rows(n,[(R(0,6),R(0,6)) for _ in range(n)])
    if num==784:return rows(f'{n} {R(1,(n+2)//3)}',[[R(-9,9) for _ in range(n)]])
    if num==785:
        r=R(1,5);c=R(1,5);return rows(f'{r} {c} {R(0,4)}',[[R(-4,4) for _ in range(c)] for _ in range(r)])
    if num==786:return rows(n,[[R(1,2) for _ in range(n)]])
    if num==787:
        n=R(3,9);return rows(f'{n} {R(1,12)}',[[R(1,10) for _ in range(n)]])
    if num==788:
        s=''.join(C('ab[]###') for _ in range(R(1,40)));return rows(len(s),[s])
    if num==789:
        n=R(1,15);return rows(f'{n} 50',[[R(1,n) for _ in range(n)]]+[(R(1,n),R(1,n),R(1,9),R(1,9)) for _ in range(50)])
    if num==790:
        n=R(1,7);return rows(f'{n} 20 {R(0,n)}',[[R(1,n) for _ in range(20)]])
    raise ValueError(num)

PRIORITY={747,750,751,753,755,757,759,761,762,763,765,766,767,769,771,773,774,775,776,779,780,781,783,785,789}
NOTES={
746:'Parity is an augmented 61st coordinate; rank controls kernel fiber count. Checked empty-even and duplicate-vector semantics.',
747:'Undirected legal product transitions are reversible; reverse BFS and distance-decreasing lex first step are valid. Checked edge crossing and no-stay restrictions.',
748:'Every a,b candidate divides N and sorted a<=b<=c is unique; both pairwise and triple gcd constraints checked. Multiplications protected by division in C++.',
749:'Original winner excluded from withdrawal pairs; literal three-choice vote transfer, zero-vote ties and no-ballot behavior checked.',
750:'Arrival toggles destination after departure guard, including self-loops. Strict positive costs make shortest predecessor counts complete before dequeue; parallel lines count separately.',
751:'CRT normalizes to first nonnegative intersection; symmetric-difference count includes t=0 and excludes simultaneous emissions twice. Only identical periodic sets have finite (zero) symmetric difference.',
752:'Expire before arrival, use dedicated stock before fixed common-stock order, and retain expiration-day-D stock. Heap batch removal amortization reviewed.',
753:'Last card left/right values are successive joints only once two cards are present; all comparisons occur before final base case. Card labels and orientations remain separate.',
754:'Remove net-zero event coordinates before plateau maximality testing. Last event returns to outside zero. Negative terrain and touching equal plateaus checked.',
755:'Batch is frozen before dependency decrements. Unlock age persists while waiting. Cyclic descendants stay uncompleted and do not add lateness.',
756:'Split counts count trees, not schedules. Catalan(34) fits signed 64-bit. Negative residues compared via difference modulo K.',
757:'Two-start-state transformations compose in execution order; iterative bracket stack avoids nesting recursion. Repeat inherits prior state.',
758:'Weighted row-level path enumeration confirms value-equality redraw aggregation and exactly one redraw. Cubic denominator fits 64-bit at given total weight.',
759:'Both beams read old mirrors; same-cell flips cancel. Count visits at step starts, distinguish meeting from distinct-position swap, preserve K=0 directions.',
760:'Each ordered triple applies fee then exact floor at every stage. Three multipliers of at most1000 keep final energy <=1e15.',
761:'Packet replacement is atomic and ? erases old letters. Presence distinguished from weight zero; tie count is letters rather than sources.',
762:'MSB-first strict run growth includes trailing run at terminal. Leading zeros do not form runs; zero alone qualifies K=0. Count/sum recurrence reviewed.',
763:'Ring end merge before and after synchronous deletion; two-run case sees same opposite neighbor twice; maximal run survives so empty ring impossible.',
764:'Visibility independent along each axis and only identical other two coordinates block. Negative weights preserved.',
765:'Unique first-pair forest decomposition gives no duplicate final strings. Parent-type parameter constrains nesting only, not siblings; depth H bounds nonempty interior.',
766:'Closed-interval XOR membership, all-negative optimum, duplicate rule contributions and lex representative checked.',
767:'White holes depend on touching global boundary; one hole may border many black components, many edges count once per component-hole relation.',
768:'Any zero pile is a terminal loss. Divisor moves reference opposite pile; increasing a then b topologically orders dependencies. Max move count <=64 fits unsigned-short.',
769:'Total-point groups fixed before secondary metrics. Rank keys immutable and transitive, not pairwise or recursive mini-league tie breaking.',
770:'Popcount uses all40 bits; union sum <=7140*(2^40-1) <2^53. Duplicate positions retained.',
771:'Minimum retained N-K errors, not alternate clipping or removal multiplicities. All shifts counted including periodic duplicates; square promoted to64-bit in C++.',
772:'FIFO future-start reservation is valid because future arrivals cannot overtake; queued starts <=arrival time free capacity before all same-time arrivals.',
773:'Factor pairs constrained short<=long and at least one odd, not both odd. Equality square and difference0 handled once.',
774:'Enumerates all permitted numerators per denominator, including alternatives below rejected gcd/parity maxima; cross products exact, 0/1 valid baseline.',
775:'Modulus M*D turns floor remainder into a half-open interval; floor_sum identity and count-minus-adjacent-pairs formula reviewed. N-1 pair horizon and wrap shifts checked.',
776:'Separate absolute signed areas allow arbitrary orientation. Hole subtraction includes each hole boundary. Generalized Pick constant is 1-h.',
777:'Undo affects current prefix stack only, not historical crossing and maximum-length statistics. U0 leaves sentinel intact.',
778:'Proleptic Gregorian 400/100/4 precedence and weekday epoch match datetime; search constrained to same month, earlier day wins ties.',
779:'Reversing digit list preserves adjacency parity and distinct digits. Zero is one digit, K=0 never qualifies.',
780:'Each axis must alternate four strict endpoints independently; same endpoint, nesting and touching excluded. Width-height multiplication uses64-bit.',
781:'Visited mask is necessary; stops at terminal, exactly two marked edges, ties favor larger edge count. Positive-cost pruning uses > rather than >=.',
782:'Adjacent-pair count increments only upon selecting a position with previous selected. Nonexistent state distinct from zero ways modulo.',
783:'Enumerates labeled permutations including zero-time jobs; direct two-machine precedence recurrence. Johnson alone would not count all ties.',
784:'Select i joins prefix i-3; all zero-selection prefixes count exactly one. Negative scores do not allow fewer than K.',
785:'Row/column include current cell; only in-bounds four neighbors count, strict comparison, signed output sum.',
786:'Leader evaluated after both score increments, current ballot breaks ties, first ballot not a change.',
787:'Position combinations preserve duplicate lengths; all positive lengths make sorted shortest-two inequality sufficient.',
788:'Escape consumes exactly next one character; escaped bracket/hash inert, escaped letter still counted at current depth. Unmatched closing bracket clamps to0.',
789:'After n integer seconds both markers on functional cycles; on common cycle relative phase period <=cycle length<=n. 0..2n scan covers tail and cycle, unlike arbitrary n^2 product bound.',
790:'Toggles set of named lamp positions, so singleton lamp flips once. Statistics after complete button action, excludes initial state.'}

def build_cases():
    rng=random.Random(SEED);cases=[]
    for num in range(746,791):
        code=f'b{num}';limit=240 if num==775 else 50 if num in PRIORITY else 12
        for i in range(limit):
            data=generate(num,rng);expected=oracle(code,data)
            cases.append(dict(code=code,input=data,expected=expected,reason=f'Independent deterministic semantic oracle; seed={SEED}, case={i+1}',kind='generated'))
    return cases

def normalize(x):return '\n'.join(z.rstrip() for z in x.replace('\r\n','\n').splitlines()).rstrip()

def editorial_findings():
    return [
        dict(id='complexity-b762-ordered-memo',severity='low',category='complexity explanation',code='b762',field='complexity',
             evidence='C++: map<tuple<int,int,int,int,bool>,pair<ll,ll>> memo; each go() uses memo.count(key), memo[key], and insertion. The stated O(L^4) state-operation bound omits balanced-tree lookup cost.',
             currentClaim='L=32，粗略上界時間與空間 O(L⁴)',
             recommendation='Distinguish Python expected O(L^4) hash-cache time from C++ O(L^4 log L) ordered-map time; both use O(L^4) space. Alternatively document time as O(S log S) with S=O(L^4).',
             impact='Explanatory asymptotic precision only; no output counterexample found and L is fixed at32.',
             verification='Static source/container operation analysis; all51 independent cases match in both languages.'),
        dict(id='complexity-b765-ordered-memo',severity='low',category='complexity explanation',code='b765',field='complexity',
             evidence='C++ uses map<tuple<int,int,int,int>,pair<ll,ll>> memo. There are O(N^2 H) states and O(N) transitions per state, and repeated cached go() lookups cost logarithmic time.',
             currentClaim='時間 O(N³H)，空間 O(N²H)',
             recommendation='Keep Python expected O(N^3 H); specify C++ O(N^3 H log(N^2 H)) with ordered map. Space remains O(N^2 H).',
             impact='Explanatory asymptotic precision only; N,H<=32 and no output mismatch found.',
             verification='Static source/container operation analysis; all51 independent cases match, including free-replacement 32-character exact-count certificate.'),
        dict(id='complexity-b767-ordered-hole-sets',severity='low',category='complexity explanation',code='b767',field='complexity',
             evidence='C++: vector<set<int>> near; scanning black-cell edges executes near[id[r][c]].insert(idsOfHole). A black component may border many distinct holes, so ordered-set insertions have a log(RC) factor.',
             currentClaim='時間 O(RC)',
             recommendation='Distinguish Python expected O(RC) hash-set time from C++ O(RC log(RC)) ordered-set time; space O(RC). O(RC) C++ time would need hash sets or component-id timestamp deduplication.',
             impact='Explanatory asymptotic precision only; grids<=30x30 and output semantics pass.',
             verification='Static source/container operation analysis; all50 independently generated grid cases match in both languages.')
    ]

def annotate_report(report):
    existing={f.get('id') for f in report['findings']}
    report['findings'].extend(f for f in editorial_findings() if f['id'] not in existing)
    report['runtimeMismatchCount']=sum(f.get('language') in ('cpp','python') for f in report['findings'])
    report['editorialFindingCount']=sum(f.get('category')=='complexity explanation' for f in report['findings'])
    report['limitations']=[
        'Finite generated cases and explicitly identified exact certificates, not an exhaustive proof over all hidden inputs.',
        'No use of the author public-sample outputs, private checks, or verifier as independent expected values. Literal duplicate public inputs removed.',
        'Runtime tests cover many small instances and selected large certificates; they do not benchmark every maximum-size adversarial input or establish a judge-specific time/memory limit.',
        'Three low-priority findings concern asymptotic complexity prose for C++ ordered containers, not observed functional failures.'
    ]
    structural=[]
    for lesson in LESSONS:
        assert len({s['title'] for s in lesson['trace']})==len(lesson['trace'])
        for step in lesson['trace']:
            assert all(0<=i<len(step['cells']) for i in step.get('active',[]))
            assert len({k for k,v in step['variables']})==len(step['variables'])
        structural.append(lesson['code'])
    report['traceStructureCheckedCodes']=structural
    for item in report.get('verificationByCode',[]):
        item['testImplementation']='oracle() and generate() in peer-verify-746-790.py; expected values preserved per case'
        item['runtimeMismatchCount']=sum(f.get('code')==item['code'] and f.get('language') in ('cpp','python') for f in report['findings'])
    return report

def main():
    started=time.time();cases=build_cases();records=[];findings=[]
    # Exact certificates target cases random small instances cannot exercise.
    def cert(code,data,expected,reason):cases.append(dict(code=code,input=data,expected=expected,reason=reason,kind='exact-certificate'))
    cert('b750','2 101 0 2\n'+('1 2 1000000000 0 0\n')*101,'1000000000 0','101 separately labeled direct edges yield reachable target with zero path count modulo101.')
    cert('b750','1 1 1 1\n1 1 1 0 0\n','0 1','Initial target gives sole empty zero-cost path; no initial toggle.')
    cert('b751','1000000000 999999999 1000000000 999999998 1000000000\n','499999999999999999 A','Two disjoint equal-period streams: alternating B at p-2 and A at p-1, even K reaches A in block K/2-1.')
    depth=6000;s='('*depth+'A'+')9'*depth
    cert('b757',f'{len(s)}\n{s}\n',f'0 {pow(9,depth,1000000007)}','6000 nested repetitions of A produce 9^6000 points, with no state flip or recursion requirement.')
    cert('b762','4294967295 1\n',f'{sum(33-l for l in range(1,33))} {sum(((1<<l)-1)<<z for l in range(1,33) for z in range(33-l))}','A single1-run is uniquely ((2^length)-1)<<trailingZeros; enumerate all lengths and placements across32 bits.')
    # Independent stack-language generating function: F=1/(1-2z*C(z)); coefficients count alternating type
    # forests, because each irreducible tree chooses its root type and every
    # descendant type is forced. C(z) Catalan trees. No interval DP used.
    catalan=[math.comb(2*k,k)//(k+1) for k in range(17)];forest=[1]
    for size in range(1,17):forest.append(sum(2*catalan[k-1]*forest[size-k] for k in range(1,size+1)))
    cert('b765','32 32\n'+'('*32+'\n'+' '.join(['0']*32)+'\n',f'0 {forest[16]}','Free replacements: each primitive Dyck component has two root-type choices and forced alternating descendants. Coefficients F[0]=1, F[n]=sum(2*Catalan(k-1)*F[n-k]) give exact count, independent of interval cost DP.')
    cert('b771','120 0\n'+' '.join(['-1000000']*120)+'\n'+' '.join(['1000000']*120)+'\n','480000000000000 120 0','All120 errors equal4e12 for every shift; none discarded; cost4.8e14.')
    cert('b775','1000000000000 0 1000000 1000000 1000000 1\n','1000000000000 1','Constant quotient1 hits for all trillion times, one run.')
    cert('b775','1000000000000 1000000 999999 1 1 0\n','1000000000000 1','D=1 makes every time hit despite maximal floor_sum arithmetic and N; exactly one run.')
    cert('b776','1\n4\n-1000000 -1000000\n1000000 -1000000\n1000000 1000000\n-1000000 1000000\n4\n-1 -1\n-1 1\n1 1\n1 -1\n','3999995999992 8000008','Outer strict interior (1999999)^2 minus the9 integer points on/in2x2 hole; boundaries8e6+8. Opposite ring orientations.')
    cert('b779','0 1\n','35 36','Zero representation is one zero digit in each of the35 bases.')
    cert('b780','2\n-100000 -99999 99999 100000\n-99999 -100000 100000 99999\n','1 39999200004','Opposite starting rectangle on two axes; intersection side199998 in each axis, area exceeds32 bits.')
    cert('b783','9\n'+('0 0\n')*9,'0 362880','All labeled9! permutations have makespan0; zero-time simultaneity must not collapse labels.')
    cert('b789','5 5\n2 3 4 5 3\n1 2 1 1\n1 5 1 3\n1 5 3 1\n5 1 9 2\n3 3 9 9\n',oracle('b789','5 5\n2 3 4 5 3\n1 2 1 1\n1 5 1 3\n1 5 3 1\n5 1 9 2\n3 3 9 9\n'),'Tail feeding a length3 cycle, varied speed congruences, time0 equality; oracle runs until repeated ordered pair, not 2n limit.')
    # All generated inputs intentionally independent from public sample set.
    cases=[c for c in cases if not any(c['input'].strip()==s['input'].strip() for s in SOURCES[c['code']]['samples'])]
    report=dict(scope='Independent bounded semantic peer review; not a proof over all hidden inputs',reviewedCodes=[f'b{i}' for i in range(746,791)],priorityCodes=[f'b{i}' for i in sorted(PRIORITY)],dataset=str(DATA.relative_to(ROOT)),datasetSha256=hashlib.sha256(RAW).hexdigest(),sourceSha256=hashlib.sha256((HERE/'source.json').read_bytes()).hexdigest(),seed=SEED,findings=findings,cases=records,staticReview=[dict(code=f'b{i}',reviewed='statement, algorithm/invariant, both implementations, arithmetic bounds, complexity, teaching trace',note=NOTES[i]) for i in range(746,791)],complete=False)
    def save():
        report['elapsedSeconds']=time.time()-started;report['independentCases']=len(cases);report['executions']=sum(len(r.get('actual',{})) for r in records)
        (HERE/'peer-review-746-790.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    save();mapping={x['code']:x for x in LESSONS}
    # Sequential in-process execution uses the exact Python source object without
    # changing it; sys streams restored in finally. Not threaded.
    compiled={c:compile(l['python'],c+'.py','exec') for c,l in mapping.items()}
    stdin,stdout=sys.stdin,sys.stdout
    for case in cases:
        result=dict(case,actual={});buf=io.StringIO()
        try:
            sys.stdin=io.TextIOWrapper(io.BytesIO(case['input'].encode()));sys.stdout=buf
            try:exec(compiled[case['code']],{'__name__':'__main__'})
            except SystemExit as e:
                if e.code not in (None,0):raise
            result['actual']['python']=buf.getvalue()
        except Exception as e:result['pythonError']=repr(e)
        finally:sys.stdin,sys.stdout=stdin,stdout
        if normalize(result.get('actual',{}).get('python',''))!=normalize(case['expected']):
            finding=dict(severity='high',code=case['code'],language='python',input=case['input'],expected=case['expected'],actual=result.get('actual',{}).get('python'),error=result.get('pythonError'),reason=case['reason']);findings.append(finding);print('FINDING',json.dumps(finding),flush=True)
        records.append(result)
    save();print('Independent Python phase:',len(records),'cases;',len(findings),'mismatches',flush=True)
    with tempfile.TemporaryDirectory(prefix='peer746-',dir='/tmp') as temp:
        temp=pathlib.Path(temp)
        def cpp_job(code):
            source=temp/(code+'.cpp');exe=temp/code;source.write_text(mapping[code]['cpp']);build=subprocess.run(['g++','-std=c++17','-O2',str(source),'-o',str(exe)],text=True,capture_output=True,timeout=120)
            if build.returncode:return code,[],[dict(code=code,severity='high',language='cpp',phase='compile',stderr=build.stderr)]
            outputs=[];errors=[]
            for i,record in enumerate(records):
                if record['code']!=code:continue
                try:
                    p=subprocess.run([str(exe)],input=record['input'],capture_output=True,text=True,timeout=30);outputs.append((i,p.stdout))
                    if p.returncode or normalize(p.stdout)!=normalize(record['expected']):errors.append(dict(severity='high',code=code,language='cpp',input=record['input'],expected=record['expected'],actual=p.stdout,stderr=p.stderr,reason=record['reason']))
                except subprocess.TimeoutExpired:errors.append(dict(severity='high',code=code,language='cpp',input=record['input'],error='timeout30s'))
            return code,outputs,errors
        with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
            for future in concurrent.futures.as_completed(pool.submit(cpp_job,c) for c in mapping):
                code,outputs,errors=future.result()
                for i,s in outputs:records[i]['actual']['cpp']=s
                findings.extend(errors)
                for f in errors:print('FINDING',json.dumps(f),flush=True)
                print(code,len(outputs),'independent C++ cases;',len(errors),'mismatches',flush=True);save()
    report['complete']=True;report['verificationByCode']=[dict(code=code,independentCases=sum(c['code']==code for c in cases),cppExecutions=sum(r['code']==code and 'cpp' in r['actual'] for r in records),pythonExecutions=sum(r['code']==code and 'python' in r['actual'] for r in records),degree='Static semantic/proof/trace/complexity review plus independent generated and/or exact-certificate runtime checks in both languages; finite coverage only') for code in mapping]
    report['environment']='WSL kali-linux; Linux g++17 -O2 under /tmp; Python '+sys.version.split()[0];report['datasetCurrentSha256']=hashlib.sha256(DATA.read_bytes()).hexdigest();annotate_report(report);save()
    print('COMPLETE',len(mapping),'codes,',len(records),'independent cases,',len(findings),'findings',flush=True)

if __name__=='__main__':
    if '--annotate' in sys.argv:
        path=HERE/'peer-review-746-790.json';report=annotate_report(json.loads(path.read_text(encoding='utf-8')));path.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');print('Annotated existing completed runtime report without rerunning or modifying authored files.')
    else:main()
