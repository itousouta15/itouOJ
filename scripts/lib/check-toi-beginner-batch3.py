"""Bounded, deterministic checks of the actual a225..a268 lesson programs.

Default: load the actual exported TS lessons/catalog through the Node loader.
Optional --lessons-json FILE (or - for stdin) accepts
[{code, python, cpp, samples:[{input,output}]}].
--python PATH selects the trusted interpreter; --cxx PATH adds C++ checks.
On Windows use --compile-only-cxx; executables are never launched in that mode.
Only generated compiler inputs/outputs are written, inside TemporaryDirectory.
"""
import argparse
import contextlib
import datetime
from fractions import Fraction
from functools import lru_cache
import io
import itertools
import json
from pathlib import Path
import random
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[2]
CODES = [f'a{i}' for i in range(225, 269)]


def normalize(s):
    return s.replace('\r\n', '\n').rstrip('\n')


def worker():
    request = json.load(sys.stdin)
    program = compile(request['python'], request['code'], 'exec')
    original = sys.stdin
    for case in request['cases']:
        sys.stdin = io.TextIOWrapper(io.BytesIO(case['input'].encode()))
        capture = io.StringIO()
        try:
            with contextlib.redirect_stdout(capture):
                exec(program, {'__name__': '__main__'})
        except SystemExit as e:
            if e.code not in (None, 0):
                raise
        finally:
            sys.stdin = original
        actual = normalize(capture.getvalue())
        assert actual == normalize(case['output']), (
            request['code'], case['label'], case['input'], actual, case['output'])
    print(len(request['cases']))


def load_lessons(path, node):
    if path:
        values = json.load(sys.stdin) if path == '-' else json.loads(Path(path).read_text(encoding='utf-8'))
    else:
        adapter = """
import { lessons } from './src/lib/toiBeginnerLessons/batch3.ts';
import { toiBeginnerProblemCatalog as catalog } from './src/lib/toiBeginnerProblemCatalog.ts';
const rows = lessons.map(l => {
  const p = catalog.find(p => p.code === l.code);
  if (!p || l.sampleInput !== p.samples[0].input || l.sampleOutput !== p.samples[0].output)
    throw Error('Catalog mismatch: ' + l.code);
  if (l.explanation.length < 2 || l.trace.length < 3 || l.trace.length > 6 ||
      l.trace.some(t => !t.variables.length || !t.cells.length ||
        (t.active ?? []).some(i => i < 0 || i >= t.cells.length)))
    throw Error('Incomplete lesson: ' + l.code);
  return { code: l.code, python: l.python, cpp: l.cpp, samples: p.samples };
});
console.log(JSON.stringify(rows));
"""
        run = subprocess.run([node, '--import', './scripts/ctf-test-loader.mjs',
                              '--input-type=module', '-e', adapter], cwd=ROOT,
                             text=True, encoding='utf-8', capture_output=True, timeout=20, check=True)
        values = json.loads(run.stdout)
    selected = [v for v in values if v['code'] in CODES]
    assert len(selected) == len({v['code'] for v in selected}), 'duplicate lesson code'
    return {v['code']: v for v in selected}


def make_cases():
    cases = {code: [] for code in CODES}
    rng = random.Random(20261020)

    def add(code, text, expected, label):
        if not isinstance(expected, str):
            expected = str(expected)
        cases[code].append({'input': text, 'output': expected, 'label': label})

    def row(a):
        return ' '.join(map(str, a))

    def grid(a):
        return '\n'.join(map(row, a))+'\n'

    add('a225', '1 -1\n1 -1\n0 9\n0 -1\n1 -1\n-1 -1\n', 1, 'valid negative type and relogin')
    add('a225', '-1 -1\n', 0, 'no operations')
    add('a226', '3\n1 1 1\n0 0 3\n3 3\n', 4, 'last-week success')
    add('a226', '3\n0 0 0\n9 9 9\n1 1\n', -1, 'only light sufficient')
    add('a226', '3\n2 0 0\n2 0 0\n2 2\n', 2, 'first-week equality')
    add('a227', '1 1 50\n50\n', 0, 'no neighbors')
    add('a227', '1 2 1\n1 2\n', 0, 'synchronous swap')
    for test in range(24):
        h, w, k = rng.randint(1,4), rng.randint(1,4), rng.randint(1,4)
        a = [[rng.randint(1,5) for _ in range(w)] for _ in range(h)]
        current = [r[:] for r in a]
        for _ in range(k):
            changes = {}
            for r, c in itertools.product(range(h), range(w)):
                neighbors = [current[x][y] for x,y in ((r-1,c),(r+1,c),(r,c-1),(r,c+1)) if 0<=x<h and 0<=y<w]
                neighbors.sort()
                majority = len(neighbors)//2+1
                v = current[r][c]
                changes[r,c] = v
                if neighbors:
                    if neighbors[-majority] > v:
                        changes[r,c] += 1
                    elif neighbors[majority-1] < v:
                        changes[r,c] -= 1
            current = [[changes[r,c] for c in range(w)] for r in range(h)]
        add('a227', f'{h} {w} {k}\n'+grid(a), sum(map(sum,current))-sum(map(sum,a)), f'sorted-neighbor oracle {test}')

    add('a228', '2 1\n1 3\n3 6\n1 6\n5\n', '1 6', 'adjacent intervals form continuous availability')
    add('a228', '1 1\n1 4\n4 8\n1\n', -1, 'touching gives zero intersection')
    for test in range(24):
        intervals = []
        for _ in range(2):
            start, group = 1, []
            for _ in range(rng.randint(1,5)):
                end = start+rng.randint(1,5)
                group.append((start,end))
                start = end+rng.randint(0,3)
            intervals.append(group)
        a,b = intervals
        duration = rng.randint(1,7)
        occupied = [set(t for s,e in group for t in range(s,e)) for group in intervals]
        common = occupied[0]&occupied[1]
        starts = [s for s in sorted(common) if all(t in common for t in range(s,s+duration))]
        answer = f'{starts[0]} {starts[0]+duration}' if starts else '-1'
        add('a228', f'{len(a)} {len(b)}\n'+grid(a+b)+f'{duration}\n', answer, f'unit-time-set oracle {test}')

    add('a229', '1 1 1\n1\n2\n3\n', '1 3', 'one customer has no walking overhead')
    add('a229', '2 1 1\n1 1\n3\n4\n', '1 8', 'two-person overhead')
    for test in range(35):
        a = [rng.randint(1,5) for _ in range(rng.randint(1,20))]
        f = rng.choice(a)
        s = rng.randint(1, a.count(f))
        target = [i for i,x in enumerate(a) if x==f][s-1]
        live, shots = set(range(len(a))), 0
        while live:
            i = min(live)
            live.remove(i)
            shots += 1
            same = [j for j in live if a[j]==a[i]]
            removed = {i}
            if same:
                j = min(same, key=lambda j: abs(j-i))
                live.remove(j)
                removed.add(j)
            if target in removed:
                break
        add('a230', f'{len(a)} {s} {f}\n'+row(a)+'\n', shots, f'physical-nearest-target oracle {test}')

    add('a231', '3 2\n1 3\n1 1\n1 1\n', 1, 'first-day failure')
    add('a231', '3 2\n1 1\n1 3\n1 3\n', 3, 'stored water and exact exhaustion')
    for test in range(16):
        n,w = rng.randint(3,7),rng.randint(1,20)
        demands = [[rng.randint(1,10) for _ in range(rng.randint(1,3))] for _ in range(n)]
        cumulative=0
        answer=-1
        for day, demand in enumerate(demands,1):
            cumulative+=sum(demand)
            if cumulative>day*w and answer==-1:
                answer=day
        text=f'{n} {w}\n'+''.join(f'{len(d)} {row(d)}\n' for d in demands)
        add('a231',text,answer,f'cumulative-demand oracle {test}')
    for m,x,y in itertools.product((1,3,7), (1,3,9), (2,5,10)):
        for n in (1,m*x,m*y,m*x+1):
            possible=[(a,m-a) for a in range(m+1) if a*x+(m-a)*y==n]
            expected=row(possible[0]) if possible else '-1 -1'
            add('a232',f'{n} {m} {x} {y}\n',expected,'enumerate nonnegative solutions')

    add('a233','1 1\n909090\n','*','one-cell room and zero moves')
    add('a233','2 3\n0901\n','*..\n*..','zero still rotates direction')
    add('a234','zZazZa\n','231','case sensitivity and last occurrence')
    add('a234','ABCDEFGHIJK\n','1234567891011','multi-digit ranks concatenate')
    add('a235','3 3\n20 20 20\n20 20 20\n20 20 20\n','1\n1','all tied zero')
    add('a235','3 4\n10 30 10 30\n10 20 30 40\n50 10 50 10\n','1\n3','oscillations and improvement tie')
    add('a236','1\n2\n1\n','1\n-1','empty math class')
    add('a236','1\n1\n2\n','-1\n1','empty language class')
    for test in range(24):
        s,e,b,k = rng.randint(1,100),rng.randint(100,999),rng.randint(1,9),rng.randint(1,100)
        qualifying=[]
        for x in range(s,e+1):
            digits=[]
            q=x
            while q:
                digits.append(q%10)
                q//=10
            if x%b==0 or b in digits:
                qualifying.append(x)
        add('a237',f'{s} {e} {b} {k}\n',qualifying[k-1] if len(qualifying)>=k else -1,f'digit-division oracle {test}')
    add('a237','4 4 4 2\n',-1,'both predicates count once')
    for t,s,p in itertools.product((5,10,20), (1,5,10,20), (11,17,100)):
        if s>t:
            continue
        total=0
        for remaining in range(t,t-s,-1):
            ratio=Fraction(remaining,t)
            tiers=[(Fraction(4,5),5),(Fraction(3,5),6),(Fraction(2,5),8),(Fraction(1,5),9)]
            rates=[rate for threshold,rate in tiers if ratio>=threshold]
            if not rates:
                break
            total+=p*rates[0]//10
        add('a238',f'{t} {s} {p}\n',total,'rational-threshold and per-item floor oracle')
    add('a239','4 1 1 1 1\n',4,'exact deadline')
    add('a239','3 1 1 1 1\n',-1,'one minute late')
    add('a240','5 3\n1 1 1 2 2\n2 1 1\n1 2\n2\n9\n','1 3','absent product contributes zero')
    for test in range(24):
        n=rng.randint(1,30)
        a=list(range(n));rng.shuffle(a)
        sizes=[]
        for start in range(n):
            reachable={start};u=a[start]
            while u not in reachable:
                reachable.add(u);u=a[u]
            sizes.append(len(reachable))
        add('a241',f'{n}\n'+row(x+1 for x in a)+'\n',max(sizes),f'independent reachability oracle {test}')
    add('a242','1 1\n1\n','1','single piece')
    add('a242','5 2\n0 2 0 1 0\n','4 2','empty shelves')
    roles='6\n-1 0 1 -1 0 1\n'
    add('a243',roles+'1\n4\n1\n0\n','Wrong','duplicate overrides apparent good victory')
    add('a243',roles+'1\n4\n0\n','Townsfolk','all wolves eliminated')
    add('a243',roles+'0\n','Werewolves','no eliminations')
    add('a244','2\n2\nH AB 0 0\nV AC 0 0\n','Yes','same-letter crossing')
    add('a244','2\n2\nH AB 0 0\nV BC 0 0\n','No','conflicting crossing')
    add('a244','2\n1\nV ABC 1 0\n','No','out of bounds and XY orientation')
    add('a245','1\n09 05\n08 45\n','09 05','cross-hour exact 20 minutes')
    add('a245','1\n23 59\n23 41\n','Too Late','no next-day wrap')
    add('a246','2\n1000000 0 3\n0 1 50\n','2 50','popular vote does not determine winner')
    add('a247','1\n0 0 0\n',0,'empty envelope')
    add('a247','1\n10000000 0 0\n',1000000000,'total upper bound')

    for test in range(35):
        n,m=rng.randint(1,3),rng.randint(1,6)
        a=[rng.randint(1,6) for _ in range(n)]
        b=[x-i for i,x in enumerate(a)]
        @lru_cache(None)
        def mining(days, ages):
            if days==0:
                return 0
            best=0
            for i in range(n):
                reward=b[i]-(0 if ages[i]==-1 else ages[i])
                if reward<=0:
                    continue
                after=tuple(1 if j==i and age==-1 else age+1 if age>=0 else -1 for j,age in enumerate(ages))
                best=max(best,reward+mining(days-1,after))
            return best
        add('a248',f'{n} {m}\n'+row(a)+'\n',mining(m,(-1,)*n),f'actual-day-decay exhaustive schedule {test}')
    add('a248','1 100\n1\n',1,'stop when no positive reward remains')
    add('a248','2 2\n1000000 1000000\n',1999999,'large total and transport')
    add('a249','2\nZed 1\nOil\nAlpha 1\noil\n3\nOil 1\noil 2\nOil 1\n','Zed','case-sensitive names, repeat quantity, input-order tie')

    for test in range(30):
        h,w=rng.randint(1,5),rng.randint(1,5)
        g=[[rng.choice('...RL#') for _ in range(w)] for _ in range(h)]
        g[0][0]='.'
        r=c=0;dr,dc=0,1;seen=set();visited=set()
        for _ in range(4*h*w+1):
            if not(0<=r<h and 0<=c<w) or g[r][c]=='#' or (r,c,dr,dc) in seen:
                break
            seen.add((r,c,dr,dc));visited.add((r,c))
            if g[r][c]=='R':
                dr,dc=-dc,-dr
            elif g[r][c]=='L':
                dr,dc=dc,dr
            r,c=r+dr,c+dc
        else:
            raise AssertionError('reference ray exceeded state bound')
        add('a250',f'{h} {w}\n'+'\n'.join(''.join(r) for r in g)+'\n',len(visited),f'vector-reflection oracle {test}')
    add('a250','1 2\n.#\n',1,'obstacle cell excluded')
    for length in range(1,7):
        for flavors in itertools.product((1,2),repeat=length):
            durations=(2,5)
            remaining=[0,0];index=0;time=0
            while index<length or any(remaining):
                for i in range(2):
                    if remaining[i]==0 and index<length:
                        remaining[i]=durations[flavors[index]-1];index+=1
                remaining=[max(0,x-1) for x in remaining]
                time+=1
            add('a251',f'2 5\n{length}\n'+'\n'.join(map(str,flavors))+'\n',time,'exhaustive flavor order, per-second machine oracle')
    for test in range(15):
        a=[rng.randint(1,3) for _ in range(rng.randint(1,30))]
        expected=row(len(list(g)) for _,g in itertools.groupby(a))
        add('a252',f'{len(a)}\n'+row(a)+'\n',expected,f'groupby oracle {test}')
    add('a252','1\n100\n',1,'single last run')
    for test in range(15):
        n,m,p,q=[rng.randint(1,4) for _ in range(4)]
        a=[[rng.randint(0,1) for _ in range(m)] for _ in range(n)]
        expanded=[[a[r//p][c//q] for c in range(m*q)] for r in range(n*p)]
        add('a253',f'{n} {m} {p} {q}\n'+grid(a),grid(expanded),f'inverse-coordinate expansion oracle {test}')
    primes=[n for n in range(2,501) if all(n%d for d in range(2,n))]
    products={p*q:(p,q) for p in primes for q in primes if p<=q and p*q<=500}
    for n in range(2,501):
        add('a254',f'{n}\n',row(products.get(n,(0,0))),'exhaustive small prime-products oracle')
    add('a254','2000000000\n','0 0','upper bound has more than two prime factors')
    add('a254','1999999973\n','0 0','large prime trial division')
    rooms=list(range(1,301))+[9999999,10000000,9998244]
    squares={n*n for n in range(1,3163)}
    for offset in range(0,len(rooms),100):
        group=rooms[offset:offset+100]
        out=[]
        for k in group:
            valid=[]
            if k%2==0 and k%3==0:valid.append(1)
            if int(str(k)[-1])%2 and k%3!=0:valid.append(2)
            if k in squares or (k%2==0 and k%7!=0):valid.append(3)
            out.append(min(valid) if valid else 0)
        add('a255',f'{len(group)}\n'+row(group)+'\n',row(out),'independent conditions and minimum-priority oracle')
    for r in range(1,10):
        win=[False]*121
        for remaining in range(1,121):
            win[remaining]=any(not win[remaining-move] for move in range(1,min(r,remaining)+1))
        for t in range(1,121):
            add('a256',f'{t} {r}\n',int(win[t]),'full minimax DP oracle')

    for test in range(20):
        h,w,k=rng.randint(3,5),rng.randint(3,5),rng.randint(1,3)
        a=[[rng.choice((-1,0,0,1)) for _ in range(w)] for _ in range(h)]
        vampires={(r,c) for r,c in itertools.product(range(h),range(w)) if a[r][c]==-1}
        hunters={(r,c) for r,c in itertools.product(range(h),range(w)) if a[r][c]==1}
        def within(points):
            return {(r,c) for r,c in points if 0<=r<h and 0<=c<w}
        for _ in range(k):
            vampires|=within((r+dr,c+dc) for r,c in list(vampires) for dr,dc in itertools.product((-1,1),repeat=2))-hunters
            hunters|=within((r+dr,c+dc) for r,c in list(hunters) for dr,dc in ((1,0),(-1,0),(0,1),(0,-1)))
            vampires-=hunters
        final=[[1 if (r,c) in hunters else -1 if (r,c) in vampires else 0 for c in range(w)] for r in range(h)]
        add('a257',f'{h} {w} {k}\n'+grid(a),grid(final),f'set-frontier simultaneous-stage oracle {test}')
    for s,expected in [('B','No'),('ABA','No'),('AHT','No'),('M','Yes'),('XYX','Yes')]:
        add('a258',s+'\n',expected,'independent palindrome and letter-set edges')
    add('a259','52\n'+row(range(1,53))+'\n','1 0','one complete deck')
    add('a259','3\n1 1 1\n','0 153','three duplicate cards')
    add('a259','520\n'+row(list(range(1,53))*10)+'\n','10 0','maximum complete decks')
    for test in range(15):
        n=rng.randint(1,6)
        a=[[rng.randint(0,1) for _ in range(n)] for _ in range(n)]
        lines=[list(col) for col in zip(*a)]+a
        expected=[]
        for line in lines:
            runs=[len(list(group)) for bit,group in itertools.groupby(line) if bit]
            expected.append(row(runs or [0]))
        add('a260',f'{n}\n'+grid(a),'\n'.join(expected),f'groupby column-before-row oracle {test}')
    add('a260','1\n0\n','0\n0','all-empty single-cell column and row')
    for x,y in [(1,2),(20,30),(35,37),(90,120),(998,1001)]:
        divisors={n:sum(n%d==0 for d in range(1,n+1)) for n in range(x,y+1)}
        best=max(divisors,key=divisors.get)
        add('a261',f'{x} {y}\n',f'{best} {divisors[best]}','full-divisor enumeration oracle')
    for t in [0,1,99,100,299,300,301,433,434,750,751,340200]:
        cost=min(3*t,299+sum(3 for _ in range(max(0,t-300))),699+sum(3 for _ in range(max(0,t-750))))
        add('a262',f'{t}\n',cost,'all three plans including breakpoints')
    for m,d,b,e in [(1,1,1,1),(12,31,1,1),(3,1,2,28),(2,28,3,1),(4,30,5,1),(1,1,12,31)]:
        today=datetime.date(2023,m,d)
        birthday=datetime.date(2023,b,e)
        if birthday<today:birthday=datetime.date(2024,b,e)
        # Cross-year cases here end in January/February, before 2024 leap day.
        add('a263',f'{m} {d}\n{b} {e}\n',(birthday-today).days,'calendar-library difference')
    for s,k in [('  Az zZ!  ',1),('',25),('ABC xyz 123!?',0),('ZzAa',25)]:
        alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZ'
        translate={c:alphabet[(i+k)%26] for i,c in enumerate(alphabet)}
        translate.update({c.lower():v.lower() for c,v in list(translate.items())})
        add('a264',s+f'\n{k}\n',''.join(translate.get(c,c) for c in s),'translation-table oracle preserving whitespace')
    for l,w,h,k,answer in [(2,4,4,4,0),(1000,1000,1000,1,1000000000),(1,1,1,10,0),(6,6,6,6,1)]:
        add('a265',f'{l} {w} {h} {k}\n',answer,'dimension divisibility and large product')
    for test in range(24):
        a=[rng.randint(1,12) for _ in range(5)]
        b=[rng.randint(1,12) for _ in range(5)]
        state=[a[:],b[:]]
        selected=0;outputs=[]
        for _ in range(sum(a+b)+1):
            old=state[selected]
            if old[0]%3==0:
                v=sorted(old)[-1]
                new=[x//2 if x==v else x for x in old]
            else:
                v=sorted(x for x in old if x>0)[0]
                new=[x-1 if x==v else x for x in old]
            outputs.append(v)
            if v==0:break
            state[selected]=new
            selected=0 if v%2 else 1
        else:
            raise AssertionError('array reference exceeded decreasing-potential bound')
        add('a266',row(a)+'\n'+row(b)+'\n','\n'.join(map(str,outputs)),f'immutable-round oracle {test}')
    add('a267','1\n100\n0 0\n',0,'no purchases')
    add('a267','1\n100\n1 100\n1 100\n0 0\n',20000,'repeated purchase accumulates')
    add('a268','3\n1 2 1\n1 1\n1\n','1 1\n-1\n1 1','duplicate query and absent query')
    add('a268','1\n9\n1 2\n999999 9\n','1 2','shelf ID need not fit query range')
    return cases


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--python', default=sys.executable)
    parser.add_argument('--node', default='node')
    parser.add_argument('--cxx')
    parser.add_argument('--compile-only-cxx', action='store_true')
    parser.add_argument('--lessons-json')
    parser.add_argument('--temp-root', default=str(ROOT/'scripts/lib'))
    parser.add_argument('--source-json', help='optional full freshly fetched source JSON')
    parser.add_argument('--code', help='comma-separated subset, for focused repairs')
    parser.add_argument('--oracle-worker', action='store_true', help=argparse.SUPPRESS)
    args=parser.parse_args()
    if args.oracle_worker:
        worker()
        return
    lessons=load_lessons(args.lessons_json, args.node)
    assert sorted(lessons)==CODES, 'batch must contain every assigned code exactly once'
    if args.source_json:
        fresh={v['code']:v for v in json.loads(Path(args.source_json).read_text(encoding='utf-8'))}
        for code in CODES:
            assert lessons[code]['samples']==fresh[code]['samples'], f'{code}: public source sample changed'
    cases=make_cases()
    selected=args.code.split(',') if args.code else CODES
    assert all(code in CODES for code in selected)
    totals={'samples':0,'oracle_cases':0,'cpp_compiled':0,'cpp_run':0}
    with tempfile.TemporaryDirectory(prefix='check-toi-beginner-batch3-', dir=args.temp_root) as temp:
        for code in selected:
            lesson=lessons[code]
            samples=lesson['samples']
            for sample in samples:
                run=subprocess.run([args.python,'-I','-c',lesson['python']],input=sample['input'],text=True,capture_output=True,timeout=8,check=True)
                assert normalize(run.stdout)==normalize(sample['output']),(code,'public sample',run.stdout,sample)
                totals['samples']+=1
            payload={'code':code,'python':lesson['python'],'cases':cases[code]}
            run=subprocess.run([args.python,'-I',str(Path(__file__).resolve()),'--oracle-worker'],input=json.dumps(payload),text=True,capture_output=True,timeout=12)
            assert run.returncode==0,(code,run.stderr)
            assert int(run.stdout)==len(cases[code])
            totals['oracle_cases']+=len(cases[code])
            if args.cxx:
                source=Path(temp)/f'{code}.cpp'
                source.write_text(lesson['cpp'],encoding='utf-8')
                output=Path(temp)/(code+('.exe' if sys.platform=='win32' else ''))
                command=[args.cxx,'-std=c++17','-Wall','-Wextra','-pedantic']
                command+=['-fsyntax-only',str(source)] if args.compile_only_cxx else [str(source),'-o',str(output)]
                subprocess.run(command,text=True,capture_output=True,timeout=30,check=True)
                totals['cpp_compiled']+=1
                if not args.compile_only_cxx:
                    # Bounded runtime checks: samples and at most 3 oracle edges per code.
                    for case in samples+cases[code][:3]:
                        run=subprocess.run([str(output)],input=case['input'],text=True,capture_output=True,timeout=4,check=True)
                        assert normalize(run.stdout)==normalize(case['output']),(code,'C++',case,run.stdout)
                        totals['cpp_run']+=1
            print(f"{code}: {len(samples)} public sample(s), {len(cases[code])} independent/edge cases PASS" + ('; C++ compile PASS' if args.cxx else ''),flush=True)
    print(json.dumps(totals,sort_keys=True))


if __name__=='__main__':
    main()
