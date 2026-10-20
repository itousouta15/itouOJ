"""Batch 2 executable verification; only reads its owned lesson and live catalog.
Run: python scripts/lib/check-toi-beginner-batch2.py --python PATH
Optional: --cxx PATH --compile-only-cxx (Windows), or --cxx PATH (Linux).
One bounded Python subprocess per lesson runs that lesson's public/edge/oracle
cases. C++ compilation is sequential; execution is disabled by compile-only.
"""
import argparse
import collections
import functools
import itertools
import json
import math
from pathlib import Path
import random
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[2]
RNG = random.Random(180224)

def read_lessons(node):
    # Import real exports and builder-generated samples. No parsing of TS text:
    # normal Prettier formatting and unquoted object keys are supported.
    adapter = '''
import { lessons } from "./src/lib/toiBeginnerLessons/batch2.ts";
import { toiBeginnerProblemCatalog } from "./src/lib/toiBeginnerProblemCatalog.ts";
process.stdout.write(JSON.stringify({lessons, catalog: toiBeginnerProblemCatalog}));
'''
    result = subprocess.run(
        [node, "--import", "./scripts/ctf-test-loader.mjs", "--input-type=module", "-e", adapter],
        cwd=ROOT, text=True, capture_output=True, encoding="utf-8", timeout=30,
    )
    assert result.returncode == 0, result.stderr
    exported = json.loads(result.stdout)
    lessons = {lesson["code"]: lesson for lesson in exported["lessons"]}
    assert len(exported["lessons"]) == len(lessons) == 45
    assert sorted(lessons) == [f"a{i}" for i in range(180, 225)]
    return lessons, {p["code"]: p for p in exported["catalog"]}

def text_matrix(a, trailing=False):
    return "".join(" ".join(map(str, row)) + (" " if trailing else "") + "\n" for row in a)

def cases_for(code):
    cases = []
    def case(label, inp, out):
        cases.append({"label": label, "input": inp, "output": out})
    def ints(*rows):
        return "\n".join(" ".join(map(str, r)) if isinstance(r, (list, tuple)) else str(r) for r in rows)+"\n"
    if code == "a180":
        for seq in ([1,1], [1000,1,1000,1], [3,2,2,7]):
            # Independent unit-step movement oracle.
            cur, answer = 1, 0
            for x in seq:
                while cur != x:
                    answer += 3 if x > cur else 2
                    cur += 1 if x > cur else -1
            case("unit-step elevator", ints(len(seq), seq), str(answer)+"\n")
    elif code == "a181":
        for a,s in [(1,1),(100000000,1000000000),(17,204),(17,205),(100,1)]:
            q,r = divmod(s,a)
            case("quotient/remainder ceiling", ints([a,s]), str(q+bool(r))+"\n")
    elif code == "a182":
        for n,m in [(2,100),(6,3),(12,7),(300,100)]:
            a = [RNG.randint(1,500) for _ in range(n)]
            out = [0]*n
            for i,x in enumerate(a):
                j = i
                for _ in range(m):
                    j = 2*j if j < n//2 else 2*(j-n//2)+1
                out[j] = x
            case("original-position permutation", ints([n,m], a), ints(out))
    elif code == "a183":
        for original,days in [([99],3),([100,10],3),([19,19,19],4),([20,19,40],2),([90000]*30,100)]:
            a = list(original)
            for _ in range(days):
                # Recipient-based oracle; production loops over donors.
                b=[]
                for j,value in enumerate(a):
                    delta=0
                    for donor in range(len(a)):
                        if abs(j-donor)==1 and a[donor]>value:
                            numerator = 10 if donor in (0,len(a)-1) else 5
                            delta += a[donor]*numerator//100
                    b.append(value+delta)
                a=b
            case("recipient synchronous oracle", ints(original+[0], days), ints(a))
    elif code == "a184":
        for s,t in [("aAa","aaAaA"),("bbbb","bbbbbb"),("AbC","cBa")]:
            slots=collections.defaultdict(collections.deque)
            for i,c in enumerate(s,1): slots[c].append(i)
            out=[str(slots[c].popleft()) if slots[c] else "X" for c in t]
            case("per-letter position queues", s+"\n"+t+"\n", " ".join(out)+"\n")
        for ending in ("\n", "\r\n"):
            label = "LF" if ending == "\n" else "CRLF"
            case(f"empty S preserves target line ({label})", ending+"AaAA"+ending, "X X X X\n")
            case(f"empty T emits exactly one newline ({label})", "AaBb"+ending+ending, "\n")
            case(f"both S and T empty ({label})", ending+ending, "\n")
    elif code == "a185":
        for key,score,rows in [([1],10,[[1],[2]]),([1,2,3,4],3,[[4,3,2,1],[1,2,3,4],[2,2,2,2]])]:
            out=[score*sum(x==y for x,y in zip(key,row)) for row in rows]
            case("score count boundaries", ints([len(key),score], key, len(rows), *rows), "".join(str(x)+"\n" for x in out))
    elif code == "a186":
        for grid,n in [([["q","0","b"],["a","z","0"]],5),([["z"]],1),([["0","m"],["f","0"]],2)]:
            positions=sorted((x,r,c) for r,row in enumerate(grid) for c,x in enumerate(row) if x!="0")
            out="Mission fail.\n" if len(positions)<n else "".join(f"{r} {c}\n" for _,r,c in positions[:n])
            case("sparse letters and insufficient targets", ints([len(grid),len(grid[0])],n)+text_matrix(grid), out)
    elif code == "a187":
        case("empty bill", "0\n", "Total: 0\n")
        names=[("Medium Wac",4),("WChicken Nugget",8),("Geez Burger",7),("ButtMilk Crispy Chicken",6),("Plastic Toy",3),
               ("German Fries",2),("Durian Slices",3),("WcFurry",5),("Chocolate Sunday",7)]
        commands=[(1,i) for i in range(1,6)]+[(2,i) for i in range(1,5)]
        case("all menu spellings", "".join(f"{c}\n{i}\n" for c,i in commands)+"0\n",
             "".join(f"{name} {price}\n" for name,price in names)+f"Total: {sum(x[1] for x in names)}\n")
    elif code == "a188":
        for s,ids in [([-1,8,-1],[ -1,77,-1]),([9,-1,-1,4,2,8,-1,1],[1,-1,-1,2,3,4,-1,5]),
                      ([-1,4,3,-1,7,8,-1],[-1,10,11,-1,12,13,-1])]:
            out=ids.copy()
            fences=[i for i,v in enumerate(s) if v==-1]
            for l,r in zip(fences,fences[1:]):
                rank=sorted(range(l+1,r), key=s.__getitem__)
                if rank: out[rank[0]],out[rank[-1]]=out[rank[-1]],out[rank[0]]
            case("closed segments only", ints(len(s),s,ids), "".join(f"{x} " for x in out)+"\n")
    elif code == "a189":
        for lucky,nums,amounts in [([1,2,3],[1,1,2,9,9],[100,200,300,100,100]),
                                   ([1,2,3],[3]*5,[2000000]*5),
                                   ([2,2,8],[2,8,9,2,8],[100]*5),
                                   ([2,5,2],[2,5,7,8,9],[100]*5)]:
            gains=sum(v for x,v in zip(nums,amounts) if x in lucky[:2])
            losses=sum(v for x,v in zip(nums,amounts) if x==lucky[2])
            total=(gains-losses)*(1 if lucky[2] in nums else 2)
            case("duplicate rewards, subtraction, clamp", ints(lucky,nums,amounts), str(max(0,total))+"\n")
    elif code == "a190":
        # Brute-force all positive people counts, independent of incremental CRT.
        for mod,answer in [([5,7,11],68),([7,11,13],321),([17,19,23],1987)]:
            pairs=[(a,answer%a) for a in mod]
            assert all(b>1 for _,b in pairs)
            expected=next(x for x in range(1,math.prod(mod)+1) if all(x%a==b for a,b in pairs))
            case("positive integer brute-force CRT", ints(*pairs), str(expected)+"\n")
    elif code == "a191":
        for n,p in [(1,"111"),(2,"12345"),(3,"9000000"),(2,"10101")]:
            groups=[p[::-1][i:i+n] for i in range(0,len(p),n)]
            score,who=max((sum(map(int,g)),i) for i,g in enumerate(groups,1))
            case("reverse-group tie oracle", f"{n} {p}\n",f"{who} {score}\n")
    elif code == "a192":
        for a in ([0],[1,0,1],[9,1,0,1,9],[1,9,0,0,1],[0,1,0,1,0,1,0]):
            good=[i for i,x in enumerate(a) if x==0 and 1 in a[:i] and 1 in a[i+1:]
                  and all(abs(i-j)>1 for j,v in enumerate(a) if v==9)]
            case("all fence/pest pair checks", ints(len(a),a),str(len(good))+"\n")
    elif code == "a193":
        grids=[[[1]*3 for _ in range(3)],[[1 if (i,j)==(1,1) else 2 for j in range(3)] for i in range(3)]]
        grids += [[[RNG.randint(1,2) for _ in range(5)] for _ in range(4)] for _ in range(8)]
        for g in grids:
            points=[(r,c) for r in range(len(g)) for c in range(len(g[0]))]
            answer=sum(not any(p!=q and max(abs(p[0]-q[0]),abs(p[1]-q[1]))==1 and g[p[0]][p[1]]==g[q[0]][q[1]]
                               for q in points) for p in points)
            case("pairwise Chebyshev flags", ints([len(g),len(g[0])])+text_matrix(g),str(answer)+"\n")
    elif code == "a194":
        # Calendar event table: growth for day d is applied at the start of d+1.
        for s,e,patience in [(10,10,1),(10,100,1),(15,40,1),(15,41,1),(15,45,2),(10,100,10)]:
            height=s
            out=None
            openings=0
            for day in range(1,10*patience+2):
                if day>1:
                    yesterday=day-1
                    if (yesterday-1)%10 < 8:
                        height += height//(3 if yesterday%3==0 else 10)
                if height>=e: out=str(day);break
                if day in range(11,10*patience+2,10):
                    openings+=1
                    if openings==patience: out="unsalable";break
            assert out is not None
            case("previous-day event calendar",ints([s,e,patience]),out+"\n")
    elif code == "a195":
        for n,q in [(2,8),(7,15),(2000,200)]:
            a=list(range(1,n+1)); eagle=10000; initial=a.copy(); caught=[]
            for _ in range(q):
                p=RNG.randrange(n);x=a[p];caught.append(x);a[p],eagle=eagle,x
            case("direct-list role swap",ints(n,initial,10000,q,caught),ints(a))
    elif code == "a196":
        grids=[[[5,5,1]],[[1]],[[5,0,5],[0,1,0]],[[5,0,1],[0,5,0],[1,0,5]]]
        grids += [[[RNG.choice([0,1,5]) for _ in range(5)] for _ in range(4)] for _ in range(8)]
        for g in grids:
            bombs=[(r,c) for r,row in enumerate(g) for c,x in enumerate(row) if x==1]
            detectors=[(r,c) for r,row in enumerate(g) for c,x in enumerate(row) if x==5]
            distance=lambda p,q:max(abs(p[0]-q[0]),abs(p[1]-q[1]))
            good=[p for p in detectors if not any(p!=q and distance(p,q)<=1 for q in detectors)]
            found=sum(any(distance(b,d)<=1 for d in good) for b in bombs)
            case("bomb-centric pair oracle",ints([len(g),len(g[0])])+text_matrix(g),f"{found} {len(bombs)-found}\n")
    elif code == "a197":
        for s in ["000000000","990000162","000000162","123456789"]:
            best=max(int(s[i])**2+int(s[j])**2 for i in range(9) for j in range(i+1,9))
            case("all digit-pair square sums",s+"\n",("Good Morning!" if best==int(s[-3:]) else "SPY!")+"\n")
    elif code == "a198":
        for d,n in [(0,10),(1,1),(8,3),(12,10)]:
            case("known population ratio",ints([n,n*(2**d-1)]),str(d)+"\n")
    elif code == "a199":
        for r,a in [(3,3),(10,0),(9,8),(2147483647,2147483647)]:
            actual=a-3 if a==r else a
            x,y=sorted([actual,r-actual])
            case("equality and 32-bit boundary",ints([r,a]),f"{x}+{y}={r}\n")
    elif code == "a200":
        for n in [0,999,1000,1999,2000,10000]:
            amounts=[n-sum(200 for t in range(2000,n+1,2000)),n-sum(100 for t in range(1000,n+1,1000))]
            cost,which=min((cost,i) for i,cost in enumerate(amounts))
            case("threshold counting discounts",ints(n),f"{cost} {which}\n")
    elif code == "a201":
        case("all special words case-insensitive","FOR to AnD YOU Alpha beta\n","42nuAB\n")
        case("single ordinary word","zebra\n","Z\n")
    elif code == "a202":
        for s in ["100000","9876543210","9223372036854775807","333221"]:
            counts=collections.Counter(s)
            out=sorted(counts, key=lambda c:(-counts[c],int(c)))
            case("Counter frequency tie ordering",s+"\n"," ".join(out)+"\n")
    elif code == "a203":
        for n,absent in [(4,[1,2,3]),(20,[20,1,10])]:
            out=[i for i in range(1,n+1) if i not in absent][::-1]
            case("descending present list",ints(n,absent),"".join(f"No. {i}\n" for i in out))
    elif code == "a204":
        for r,c,n in [(1,1,100),(1,5,8),(4,1,9),(2,3,1),(3,4,5),(4,5,100)]:
            a=[[i*c+j+1 for j in range(c)] for i in range(r)]
            for week in range(2,n+1):
                if week%2==0: a=[[row[-1]]+row[:-1] for row in a]
                else: a=[a[-1]]+a[:-1]
            case("week-by-week physical rotation",ints([r,c,n]),text_matrix(a))
    elif code == "a205":
        for day,slot in [(0,0),(6,3),(4,2)]:
            a=[[0]*4 for _ in range(7)];a[day][slot]=123
            inp="".join(" ".join(f"{x//10}.{x%10}" for x in row)+"\n" for row in a)
            case("unique day and slot decimal",inp,f"{day+1}\n"+["morning","afternoon","night","early morning"][slot]+"\n")
    elif code == "a206":
        schedule=[]
        for k in range(1,72):
            for item in ["Pen","Pineapple","Apple","Pineapple pen"]:
                schedule.extend([item]*k)
        for n in [1,4,5,6,7,12,13,24,25,28,29,40,41,10000]:
            case("materialized giveaway schedule",ints(n),schedule[n-1]+"\n")
    elif code == "a207":
        for first,second in [([(0,1)],[(0,-1)]), ([(1000,2**30-1)]*10,[(1,-2**30)]),
                             ([(2,3),(2,-1),(0,-5)],[(3,4),(0,5)])]:
            terms=first+second
            output=[]
            for p in sorted({p for p,_ in terms},reverse=True):
                coefficient=sum(v for power,v in terms if power==p)
                if coefficient:output.append(f"{p}:{coefficient}")
            case("term-list polynomial oracle",ints(len(first),[x for pair in first for x in pair],len(second),[x for pair in second for x in pair]),
                 "\n".join(output or ["NULL!"])+"\n")
    elif code == "a208":
        for s in ["a","aba","Aa","11","aBBa","a1b1a"]:
            half=len(s)//2
            good=len(s)%2==0 and all(s[i]==s[-i-1] for i in range(half))
            case("even-only mirrored pairs",s+"\n","YES\n"+s[:half]+"\n" if good else "NO\n")
    elif code == "a209":
        for s,pets in [(999,[(1,45),(100,29)]),(1000,[(0,29),(0,30),(0,39),(1,40)]),
                       (100000,[(999999,29),(999900,30),(1000000,45)])]:
            results=[]
            for i,(cp,iv) in enumerate(pets,1):
                gain=10 if iv<=29 else 50 if iv<=39 else 100
                for _ in range(s//1000):cp+=gain
                results.append((cp,i))
            best,who=max(results)
            case("repeated per-level upgrading",ints([len(pets),s],*pets),f"{who} {best}\n")
    elif code == "a210":
        for r,c in [(1,1),(1,5),(2,2),(3,4),(6,5)]:
            a=[[RNG.randrange(2) for _ in range(c)] for _ in range(r)]
            b=[[RNG.randrange(2) for _ in range(c)] for _ in range(r)]
            out=[]
            for i in range(r):
                row=[]
                for j in range(c):
                    union={(i,y) for y in range(c)}|{(x,j) for x in range(r)}
                    total=sum(b[x][y] for x,y in union)
                    row.append(1-a[i][j] if total%2 else a[i][j])
                out.append(row)
            case("explicit row-column set union",ints([r,c])+text_matrix(a)+"\n"+text_matrix(b),text_matrix(out,True))
    elif code == "a211":
        for a in [[3,2,3],[2,2,2],[9,8,7,6,1000],[5,5,2,3,2]]:
            n=len(a);total=sum(x for i,x in enumerate(a,1) if i%a[-1]==1)
            winner=total%n if total%n else n
            case("full index-filter oracle",ints(n,a),f"{winner} {a[winner-1]}\n")
    elif code == "a212":
        alphabet="abcdefghijklmnopqrstuvwxyz"
        for plain,shift in [("Love!",0),("I love you.",1),("Love, love!",25),("xLoveY",7)]:
            def rotate(s,k):
                ans=""
                for ch in s:
                    if ch.lower() in alphabet:
                        base=alphabet if ch.islower() else alphabet.upper()
                        ans+=base[(base.index(ch)+k)%26]
                    else:ans+=ch
                return ans
            cipher=rotate(plain,-shift)
            answer=next(k for k in range(26) if any(w in rotate(cipher,k) for w in ["Love","love"]))
            case("inverse Caesar generated letters",cipher+"\n",str(answer)+"\n")
    elif code == "a213":
        case("empty open interval and C=1","3\n0 1 1\n0 5 1\n0 4 4\n",
             "No free parking spaces.\nNo free parking spaces.\n1 2 3\n")
    elif code == "a214":
        from fractions import Fraction
        for n,m,c in [(10000,1000000,"U"),(30900,1000,"U"),(10012,324,"U"),(10013,324,"U"),(10014,324,"U"),
                      (34501,1000,"E"),(10000,1,"J"),(10000,9999,"T")]:
            rate={"T":Fraction(1),"U":Fraction(309,10),"J":Fraction(7,25),"E":Fraction(69,2)}[c]
            rem=Fraction(n)/rate-m
            if rem<0:out="No Money"
            else:
                cents=0 if 0<rem<Fraction(1,20) else math.floor(rem*100+Fraction(1,2))
                out=f"{c} {cents//100}.{cents%100:02d}"
            case("rational currency oracle",f"{n}\n{m} {c}\n",out+"\n")
    elif code == "a215":
        rows=[[0]*8,[1,0,0,0,0,0,0,0],[0,1,0,1,0,1,0,0],[1]*8]
        out=[]
        for row in rows:
            black=[i for i,v in enumerate(row) if v]
            pairs=list(zip(black[::2],black[1::2]))
            out.append([int(bool(row[j]) or any(l<j<r for l,r in pairs)) for j in range(8)])
        case("paired-original endpoints",ints([4,8])+text_matrix(rows),text_matrix(out))
    elif code == "a216":
        students=[("40000009A","First"),("40000001A","Second"),("80000001A","Doctor"),("60000001T","Other"),("60000001A","Master")]
        # Explicit category traversal, independent of stable sort.
        out="".join(f"{faculty}: {name}\n" for faculty in "AEHILMOST" for degree in "468"
                    for sid,name in students if sid[-1]==faculty and sid[0]==degree)
        case("stable registration order",ints(len(students))+"".join(f"{sid} {name}\n" for sid,name in students),out)
        case("single full name", "1\n40000000A Mary Jane\n", "A: Mary Jane\n")
        multi=[("60000009S","Mary Jane"),("40000009A","Amy  May"),
               ("40000001A","Mary Jane"),("80000000A","Li"),
               ("60000001S","Jo Li"),("40000000S","Ann")]
        assert all(1 <= len(name) <= 10 for _,name in multi)
        expected="".join(f"{faculty}: {name}\n" for faculty in "AEHILMOST" for degree in "468"
                         for sid,name in multi if sid[-1]==faculty and sid[0]==degree)
        records=ints(len(multi))+"".join(f"{sid} {name}\n" for sid,name in multi)
        case("multi-record full names and stable equal keys",records,expected)
        case("CRLF full-name records",records.replace("\n","\r\n"),expected)
        case("preserve all name spaces after one delimiter",
             "2\n40000009A  Jo Li \n40000001A Mary Jane\n",
             "A:  Jo Li \nA: Mary Jane\n")
    elif code == "a217":
        for h,m,segments,queries in [(23,59,[1,720,720],[1,2,3]),(0,0,[1],[1]),(5,6,[720]*20,[1,20])]:
            out=[]
            for station in queries:
                t=h*60+m+sum(segments[:station])
                while t>=1440:t-=1440
                hh,mm=divmod(t,60);out.append(f"{hh:02d}:{mm:02d}")
            case("queried direct prefix sums",ints(len(segments),[h,m],*segments,queries+[0]),"\n".join(out)+"\n")
    elif code == "a218":
        from decimal import Decimal
        people=[(1,1,250,300),(0,150,1,1),(1,150,1,1),(0,31,163,58)]
        out=[]
        for g,age,h,w in people:
            b=Decimal("13.7")*w+Decimal("5.0")*h-Decimal("6.8")*age+66 if g else Decimal("9.6")*w+Decimal("1.8")*h-Decimal("4.7")*age+655
            out.append(f"{b:.2f}")
        case("Decimal BMR including negative",ints(len(people),*people),"\n".join(out)+"\n")
    elif code == "a219":
        for money,k in [(0,0),(54,1),(55,1),(32,0),(33,0),(87,0),(88,1),(500,0)]:
            original=money;out=[];kind=k
            for step in range(20):
                price=32 if kind==0 else 55
                if money<price:break
                money-=price
                action="eats an Apple pie" if kind==0 else "drinks a Corn soup"
                tail="doesn't have money." if money==0 else f"has {money} "+("dollar." if money==1 else "dollars.")
                out.append(f"{step*7}: Wayne {action}, and now he {tail}");kind=1-kind
            case("zero, singular, plural and first-failure",f"{original} 7 {k}\n","\n".join(out or ["Wayne can't eat and drink."])+"\n")
    elif code == "a220":
        for n in [2,5,17,200]:
            a=[RNG.randint(1,51) for _ in range(n)]
            b=[RNG.randint(1,51) for _ in range(n)]
            out=[]
            for i,v in enumerate(a):
                # Search by increasing distance rather than scanning all matches.
                best=-1
                for d in range(n):
                    if any(0<=j<n and b[j]==v for j in {i-d,i+d}):best=d;break
                out.append(best)
            case("distance-first independent search",ints(n,a,b),ints(out))
    elif code == "a221":
        pairs=[(0,0),(0,5),(3,0),(1,1),(1,500),(500,1),(500,500)]
        for n in range(1,5):
            for e in range(1,7):pairs.append((n,e))
        expected=[]
        for n,e in pairs:
            if n==0 or e==0:answer=0
            elif n<=4 and e<=6:
                @functools.lru_cache(None)
                def best(food):
                    if food==0:return 0
                    # Enumerate every feasible occupied-warehouse count;
                    # fullest packing is not assumed by this oracle.
                    return max(1+best(food-guards) for guards in range((food+e-1)//e,min(n,food)+1))
                # Initial warehouses are all full, first day has n guards.
                answer=1+best(n*e-n)
            else:
                food=n*e;answer=0
                while food:
                    # Simulate physically filling warehouses one by one.
                    remain=food;guards=0
                    while remain>0:remain-=e;guards+=1
                    food-=guards;answer+=1
            expected.append(answer)
        case("all feasible guard-count DP and limits",ints(*[[n,e] for n,e in pairs],-1),"".join(str(x)+"\n" for x in expected))
    elif code == "a222":
        def oracle(n):
            seen=set()
            while n>9:
                assert n not in seen, f"classification cycle at {n}"
                seen.add(n)
                digits=list(map(int,str(n)))
                if len(digits)==4:
                    pieces=[]
                    for pair in [digits[:2],digits[2:]]:
                        x=10*pair[0]+pair[1]
                        pieces.append(x if x<10 else math.prod(pair))
                    n=pieces[0]*10**len(str(pieces[1]))+pieces[1]
                elif len(digits)==3:
                    left=digits[0]*digits[1];right=digits[1]*digits[2]
                    n=left*10**len(str(right))+right
                else:n=math.prod(digits)
            return n
        # Exhaustive finite input domain, executed inside one bounded harness.
        for n in range(10000):case("exhaustive N=0..9999",ints(n),str(oracle(n))+"\n")
    elif code == "a223":
        for text,noise in [("10001","1"),("00010","1"),("121","9"),("1234","4"),("99909","9")]:
            clean=text.replace(noise,"")
            good=all(clean[i]==clean[-i-1] for i in range(len(clean)//2))
            case("leading zero and odd palindrome",f"{text} {noise}\n",("Yes" if good else "No")+"\n")
    elif code == "a224":
        for power,monsters in [(2,[2,1]),(1,[2,1]),(3,[1,2,5]),(10000,[1]*300)]:
            total=power
            for v in monsters:
                if total>v:total+=v
                else:break
            case("equal, early stop and full clear",ints([len(monsters),power],monsters),str(total)+"\n")
    assert cases, code
    return cases

HARNESS = r'''
import contextlib, io, json, sys
payload=json.load(sys.stdin)
program=compile(payload["program"], payload["code"], "exec")
original=sys.stdin
for case in payload["cases"]:
    sys.stdin=io.StringIO(case["input"])
    out=io.StringIO()
    try:
        with contextlib.redirect_stdout(out):
            exec(program, {"__name__":"__main__"})
    except SystemExit as exc:
        if exc.code not in (0,None):raise
    finally:
        sys.stdin=original
    actual=out.getvalue().replace("\r\n","\n")
    if actual != case["output"].replace("\r\n","\n"):
        raise AssertionError(json.dumps({"code":payload["code"],"label":case["label"],
            "input":case["input"],"expected":case["output"],"actual":actual},ensure_ascii=False))
print(len(payload["cases"]))
'''

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--python",default=sys.executable)
    parser.add_argument("--node",default="node",help="Node executable used to import actual TS exports")
    parser.add_argument("--cxx")
    parser.add_argument("--compile-only-cxx",action="store_true")
    args=parser.parse_args()
    assert not args.compile_only_cxx or args.cxx, "--compile-only-cxx needs --cxx"
    lessons,catalog=read_lessons(args.node)
    total=0
    with tempfile.TemporaryDirectory(prefix="check-toi-beginner-batch2-tmp-", dir=ROOT / "scripts/lib") as temporary:
        for code,draft in lessons.items():
            assert len(draft["explanation"])>=3
            assert 3<=len(draft["trace"])<=6
            for step in draft["trace"]:
                assert step["cells"] and step["variables"]
                assert all(0<=x<len(step["cells"]) for x in step.get("active",[]))
            public=[{"label":f"public sample {i+1}",**sample} for i,sample in enumerate(catalog[code]["samples"])]
            assert any(draft["sampleInput"] == sample["input"] and draft["sampleOutput"] == sample["output"]
                       for sample in public), f"{code}: builder sample differs from live catalog"
            cases=public+cases_for(code)
            result=subprocess.run([args.python,"-I","-c",HARNESS], input=json.dumps({"code":code,"program":draft["python"],"cases":cases}),
                                  text=True,capture_output=True,timeout=30,encoding="utf-8")
            assert result.returncode==0, f"{code}: {result.stderr}"
            assert int(result.stdout)==len(cases)
            note=""
            if args.cxx:
                source=Path(temporary)/f"{code}.cpp"
                source.write_text(draft["cpp"],encoding="utf-8")
                binary=Path(temporary)/(code+(".exe" if sys.platform=="win32" else ""))
                command=[args.cxx,"-std=c++17",str(source)]
                command+=["-fsyntax-only"] if args.compile_only_cxx else ["-O2","-o",str(binary)]
                compiled=subprocess.run(command,text=True,capture_output=True,timeout=30)
                assert compiled.returncode==0,f"{code}: {compiled.stderr}"
                note="; C++17 compile PASS"
                if not args.compile_only_cxx:
                    # Exercise every new line-parsing regression in both languages;
                    # bound process count for unrelated exhaustive Python domains.
                    runtime_cases = cases if code in ("a184", "a216") else cases[:1]+cases[-min(4,len(cases)-1):]
                    for test in runtime_cases:
                        run=subprocess.run([str(binary)],input=test["input"],text=True,capture_output=True,timeout=3)
                        assert run.returncode==0 and run.stdout.replace("\r\n","\n")==test["output"],(code,test,run.stdout,run.stderr)
                    note+="; C++ representative runtime PASS"
            total+=len(cases)
            labels=", ".join(dict.fromkeys(x["label"] for x in cases[len(public):]))
            print(f"{code}: Python PASS {len(public)} public + {len(cases)-len(public)} oracle/edge ({labels}){note}",flush=True)
    print(f"TOTAL: {len(lessons)} lessons; {total} Python cases PASS",flush=True)

if __name__=="__main__":
    main()

