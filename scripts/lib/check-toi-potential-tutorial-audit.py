"""Independent small-input oracles; stdin contains actual imported lessons.

No network, database, or judge submissions. Seeded cases are reproducible.
Optional --cxx compiles the actual C++ and runs a bounded case subset per code.
"""
import argparse
from collections import Counter, deque
from contextlib import redirect_stdout
from functools import lru_cache
import io
import itertools as it
import json
from decimal import Decimal, localcontext
from pathlib import Path
import random
import subprocess
import sys
import tempfile
from time import perf_counter

parser = argparse.ArgumentParser()
parser.add_argument('--cxx')
parser.add_argument('--temp-root')
parser.add_argument('--limits', action='store_true')
args = parser.parse_args()
lessons = {entry['code']: entry for entry in json.load(sys.stdin)}
programs = {code: compile(entry['python'], code + '.py', 'exec') for code, entry in lessons.items()}
rng = random.Random(20261020)
cases = {}


def execute(code, data):
    original = sys.stdin
    stream = io.TextIOWrapper(io.BytesIO(data.encode()), encoding='utf-8')
    output = io.StringIO()
    sys.stdin = stream
    try:
        with redirect_stdout(output):
            try:
                exec(programs[code], {'__name__': '__main__'})
            except SystemExit as error:
                assert error.code in (None, 0), (code, error.code)
    finally:
        sys.stdin = original
        stream.close()
    return output.getvalue().strip()


def check(code, data, expected):
    if code not in programs:
        return
    expected = str(expected).strip()
    actual = execute(code, data)
    assert actual == expected, (code, data, expected, actual)
    cases.setdefault(code, []).append((data, expected))


def numbers(values):
    return ' '.join(map(str, values))


# a108: enumerate every insertion order and compare literal member-to-room maps.
for n in range(3, 7):
    groups, representative = Counter(), {}
    for p in it.permutations(range(1, n+1)):
        rooms = {}
        for member in p:
            room = 1
            while room in rooms:
                room = 2*room + int(member > rooms[room])
            rooms[room] = member
        key = tuple(sorted(rooms.items()))
        groups[key] += 1
        representative[key] = p
    for key, count in groups.items():
        check('a108', f'{n}\n{numbers(representative[key])}', count)

# a110: inclusion-exclusion over forbidden digits; ordinary walk counts.
answers = [[0]*9 for _ in range(16)]
for forbidden in range(512):
    allowed = [d for d in range(9) if not (forbidden >> d & 1)]
    ways = [int(d in allowed) for d in range(9)]
    sign = (-1) ** forbidden.bit_count()
    for length in range(1, 16):
        for d in range(9):
            answers[length][d] += sign * ways[d]
        ways = [sum(ways[e] for e in allowed if abs(e-d) <= 2) if d in allowed else 0 for d in range(9)]
queries = [(p,q) for p in range(1,16) for q in range(1,10)]
check('a110', str(len(queries))+'\n'+'\n'.join(map(numbers,queries)),
      '\n'.join(str(answers[p][q-1] % 1000000007) for p,q in queries))

# a111: enumerate complete permutations, including all equal-cost ties.
for _ in range(70):
    n = rng.randrange(1, 8)
    a = [[0] * n for _ in range(n)]
    for i in range(n):
        for j in range(i):
            a[i][j] = a[j][i] = rng.randrange(5)
    best = min((sum(a[p[i]][p[i+1]] for i in range(n-1)), p)
               for p in it.permutations(range(n)))
    check('a111', str(n) + '\n' + '\n'.join(map(numbers, a)),
          str(best[0]) + '\n' + numbers(x+1 for x in best[1]))

# a115: minute-by-minute simultaneous proposals, no BFS ordering assumption.
for _ in range(100):
    m, n = rng.randrange(1, 5), rng.randrange(1, 5)
    k = rng.randrange(1, min(4, m*n) + 1)
    a = [rng.choice([0, 0, -1]) for _ in range(m*n)]
    for value, pos in enumerate(rng.sample(range(m*n), k), 1):
        a[pos] = value
    t = rng.randrange(1, 6)
    state = a[:]
    for minute in range(t):
        proposed = {}
        for u, value in enumerate(state):
            if value <= 0:
                continue
            r, c = divmod(u, n)
            for rr, cc in ((r-1,c),(r+1,c),(r,c-1),(r,c+1)):
                if 0 <= rr < m and 0 <= cc < n and state[rr*n+cc] == 0:
                    v = rr*n+cc
                    proposed[v] = min(proposed.get(v, k+1), value)
        for v, value in proposed.items():
            state[v] = value
    check('a115', f'{m} {n} {k} {t}\n' + numbers(a),
          numbers(state.count(value) for value in range(1, k+1)))

# a124: score every substring by the original rule, including two-overlimit.
for _ in range(230):
    n = rng.randrange(3, 15)
    s = ''.join(rng.choice('abcde') for _ in range(n))
    limits = [rng.randrange(1, 5) for _ in range(26)]
    best = 0
    for l in range(n):
        count = Counter()
        for r in range(l, n):
            count[s[r]] += 1
            if len(count) != 3:
                continue
            over = [v for c, v in count.items() if v > limits[ord(c)-97]]
            if len(over) <= 1:
                best = max(best, over[0] if over else max(count.values()))
    check('a124', f'{n}\n{numbers(limits)}\n{s}', best)

# a139: all ordered subsets, independent of the sorted-prefix proof.
for _ in range(70):
    n = rng.randrange(1, 7)
    a = [rng.randrange(-7, 8) for _ in range(n)]
    best = max([0] + [sum((j+2)*a[x] for j, x in enumerate(p))
                     for size in range(1, n+1) for p in it.permutations(range(n), size)])
    check('a139', f'{n}\n{numbers(a)}', best)

# a155: exhaustive divisor recursion; minimizes count then sorted factors.
@lru_cache(None)
def factors(p, low=2):
    if p == 1:
        return ()
    candidates = []
    for d in range(low, 10):
        if p % d == 0:
            tail = factors(p//d, d)
            if tail is not None:
                candidates.append((d,) + tail)
    return min(candidates, key=lambda x: (len(x), x)) if candidates else None


for p in list(range(2, 350)) + [16, 2**59, 3**37, 10**18, 999999999999999989]:
    result = factors(p)
    check('a155', str(p), '-1' if result is None else numbers(result))

# a271: direct month simulation at 100 Decimal digits, no grouping shortcuts.
for fvalues in ([1,3,7], [2,6,14], [2**30-1]*30, [2**30-2]*30,
                [2**30-9]*30, [2**30-10]*30,
                [2**30-2,2**30-9,2**30-10,2**30,2000000000]*10):
    queries = [1,29,30,31,99,100,1000000000,1999999999,2000000000]
    with localcontext() as context:
        context.prec = 100
        coefficients = [min(Decimal(f+1).ln()/Decimal(2).ln(), Decimal(30))/30 for f in fvalues]

        def total_throws(v):
            total = v
            for f, coefficient in zip(fvalues, coefficients):
                value = f+1
                if value >= 2**30:
                    pass
                elif value & (value-1) == 0:
                    v = v*(value.bit_length()-1)//30
                else:
                    v = int(Decimal(v)*coefficient)
                total += v
                if not v:
                    break
            return total

        expected = []
        for target in queries:
            low, high = 1, target
            while low < high:
                middle = (low+high)//2
                if total_throws(middle) >= target:
                    high = middle
                else:
                    low = middle+1
            expected.append(str(low))
    check('a271', f'{len(fvalues)}\n{numbers(fvalues)}\n{len(queries)}\n'+'\n'.join(map(str,queries)), '\n'.join(expected))

# a274: enumerate every subset of row/column cannon positions.
for _ in range(100):
    m, n = rng.randrange(1, 5), rng.randrange(1, 5)
    edges = [(a,b) for a in range(m) for b in range(n) if rng.randrange(2)]
    best = max(mask.bit_count() for mask in range(1 << (m+n))
               if all(not (mask >> a & 1 and mask >> (m+b) & 1) for a,b in edges))
    check('a274', f'{m} {n} {len(edges)}\n' + '\n'.join(map(numbers, edges)), best)

# a279/a284: physically remove one edge/vertex and search connectivity.
for _ in range(160):
    n = rng.randrange(3, 10)
    edges = {(i, rng.randrange(i)) for i in range(1, n)}
    edges = {tuple(sorted(edge)) for edge in edges}
    edges |= {(a,b) for a in range(n) for b in range(a+1,n) if rng.randrange(4) == 0}
    edges = sorted(edges)

    def reachable(start, removed_edge=None, removed_vertex=None):
        seen, queue = {start}, deque([start])
        while queue:
            u = queue.popleft()
            for a,b in edges:
                if (a,b) == removed_edge or removed_vertex in (a,b):
                    continue
                if u in (a,b):
                    v = b if a == u else a
                    if v not in seen:
                        seen.add(v)
                        queue.append(v)
        return seen

    queries = [edge if rng.randrange(2) else edge[::-1] for edge in edges]
    check('a279', f'{n} {len(edges)} {len(queries)}\n' + '\n'.join(map(numbers, edges + queries)),
          '\n'.join(str(len(reachable(0, tuple(sorted(edge))))) for edge in queries))
    cut = [u for u in range(n) if len(reachable((u+1) % n, removed_vertex=u)) < n-1]
    check('a284', f'{n} {len(edges)}\n' + '\n'.join(map(numbers, edges)),
          numbers(reversed(cut)) if cut else 'FAIL')
check('a284', '1 0\n', 'FAIL')
check('a284', '2 1\n0 1\n', 'FAIL')

# a282: ordinary weighted edit DP, also checks Unicode and tie-to-last.
def edit(a, b):
    dp = list(range(0, 2*len(b)+1, 2))
    for i, ca in enumerate(a, 1):
        nxt = [2*i]
        for j, cb in enumerate(b, 1):
            nxt.append(min(dp[j]+2, nxt[-1]+2, dp[j-1]+(0 if ca == cb else 3)))
        dp = nxt
    return dp[-1]


for _ in range(360):
    target = ''.join(rng.choice('abc甲乙🙂') for _ in range(rng.randrange(1, 85)))
    sources = [''.join(rng.choice('abc甲乙🙂') for _ in range(rng.randrange(1, 85))) for i in range(3)]
    if rng.randrange(4) == 0:
        sources[2] = sources[1]
    costs = [edit(s, target) for s in sources]
    winner = max(i for i in range(3) if costs[i] == min(costs)) + 1
    check('a282', '\n'.join([target] + sources), f'{winner} {min(costs)}')

# a287: mutable arrays and cross multiplication, including negative averages.
for _ in range(80):
    n = rng.randrange(3, 32)
    initial = [rng.randrange(10) for _ in range(n)]
    fields = {'A': initial[:], 'B': [500-x for x in initial]}
    ops, expected = [], []
    for i in range(90):
        f = rng.choice('AB')
        if i % 3:
            k, p = rng.randrange(n), rng.randrange(-10, 21)
            fields[f][k] += p
            ops.append(f'1 {k+1} {p} {f}')
        else:
            l = rng.randrange(n-1)
            r = rng.randrange(l+1, n)
            a = fields[f][l:r+1]
            expected.append(str(sum(x*len(a) > sum(a) for x in a)))
            ops.append(f'2 {l+1} {r+1} {f}')
    check('a287', f'{n} {len(ops)}\n{numbers(initial)}\n' + '\n'.join(ops), '\n'.join(expected))

# a290: simulate every starting loan until the total scheduled budget.
for _ in range(180):
    n, r = rng.randrange(1, 7), rng.randrange(1, 12)
    payments = [rng.randrange(12) for _ in range(n)]
    best = 0
    for loan in range(sum(payments)+1):
        debt = loan
        for a in payments:
            debt = max(0, debt + (debt+r-1)//r - a)
        if debt == 0:
            best = loan
    check('a290', f'{n} {r}\n{numbers(payments)}', best)

# a294: search (current country, visited set), allowing repeated visits.
for _ in range(150):
    n = rng.randrange(1, 8)
    edges = [(a,b) for a in range(n) for b in range(n) if a != b and rng.randrange(4) == 0]
    g = [[] for _ in range(n)]
    for a,b in edges:
        g[a].append(b)
    seen, queue = {(0,1)}, deque([(0,1)])
    while queue:
        u, mask = queue.popleft()
        for v in g[u]:
            state = v, mask | (1 << v)
            if state not in seen:
                seen.add(state)
                queue.append(state)
    check('a294', f'{n} {len(edges)}\n' + '\n'.join(f'{a+1} {b+1}' for a,b in edges),
          'Yes' if any(mask == (1 << n)-1 for u,mask in seen) else 'No')

# a301/a306: enumerate all rectangles/squares directly.
for _ in range(140):
    h, w = rng.randrange(1, 5), rng.randrange(1, 5)
    grid = [rng.randrange(2) for _ in range(h*w)]
    rectangles = []
    for r1 in range(h):
        for r2 in range(r1,h):
            for c1 in range(w):
                for c2 in range(c1,w):
                    cells = {r*w+c for r in range(r1,r2+1) for c in range(c1,c2+1)}
                    if all(grid[u] for u in cells):
                        rectangles.append(cells)
    for k in (1,2):
        if sum(grid) < k:
            continue
        best = max(map(len, rectangles)) if k == 1 else max(len(a)+len(b) for a in rectangles for b in rectangles if a.isdisjoint(b))
        check('a301', f'{h} {w} {k}\n' + '\n'.join(numbers(grid[r*w:(r+1)*w]) for r in range(h)), best)
for _ in range(170):
    n, budget = rng.randrange(1, 7), rng.randrange(1, 35)
    grid = [[rng.choice([-1,0,0,1,2,8]) for c in range(n)] for r in range(n)]
    best = 0
    for size in range(1,n+1):
        for r in range(n-size+1):
            for c in range(n-size+1):
                values = [grid[i][j] for i in range(r,r+size) for j in range(c,c+size)]
                if -1 not in values and sum(values) <= budget:
                    best = max(best, size*size)
    check('a306', f'{n} {budget}\n' + '\n'.join(map(numbers, grid)), best)

# a310: direct unordered pairs, duplicates, zeros, and negative coordinates.
for _ in range(180):
    n = rng.randrange(2, 25)
    points = [(rng.randrange(-7,8),rng.randrange(-7,8)) for i in range(n)]
    best = sum(a+c >= 0 and b+d >= 0 for (a,b),(c,d) in it.combinations(points,2))
    check('a310', str(n)+'\n'+'\n'.join(map(numbers,points)), best)

# a313: every ordered pair's literal common-prefix length.
for _ in range(90):
    names = [''.join(rng.choice('ABC') for _ in range(rng.randrange(1,12))) for i in range(rng.randrange(1,25))]
    expected = []
    for i, a in enumerate(names):
        total = 0
        for j, b in enumerate(names):
            if i == j:
                continue
            for ca, cb in zip(a,b):
                if ca != cb:
                    break
                total += 1
        expected.append(str(total))
    check('a313', str(len(names))+'\n'+'\n'.join(names), '\n'.join(expected))

# a314: actually apply all stable sorts, including nonconsecutive clicks.
for _ in range(110):
    n = rng.randrange(1,25)
    files = [(i,n-i,rng.randrange(4),rng.randrange(4)) for i in range(n)]
    rng.shuffle(files)
    ops = [rng.randrange(4) for i in range(rng.randrange(1,45))]
    expected, previous, down = files[:], -1, False
    for p in ops:
        down = not down if p == previous else False
        expected.sort(key=lambda row: row[p], reverse=down)
        previous = p
    check('a314', f'{n} {len(ops)}\n'+'\n'.join(map(numbers,files))+'\n'+numbers(p+1 for p in ops), '\n'.join(map(numbers,expected)))

# a315: all selected time subsets, directly check run lengths and gaps.
for _ in range(120):
    n = rng.randrange(1,12)
    k, t = rng.randrange(1,n+1), rng.randrange(1,n+1)
    values = [rng.randrange(15) for i in range(n)]
    best = 0
    for mask in range(1<<n):
        runs = []
        for i in range(n):
            if mask >> i & 1:
                if i and mask >> (i-1) & 1:
                    runs[-1][1] = i
                else:
                    runs.append([i,i])
        if any(b-a+1 > t for a,b in runs) or any(runs[j+1][0]-runs[j][1]-1 < k for j in range(len(runs)-1)):
            continue
        best = max(best, sum(v for i,v in enumerate(values) if mask >> i & 1))
    check('a315', f'{n} {k} {t}\n{numbers(values)}', best)

# a323: forward signed-32-bit simulation; modifications precede queries.
for _ in range(100):
    n = rng.randrange(1,60)
    initial = [rng.randrange(-2**31, 2**31) for i in range(n)]
    a, ops = initial[:], []
    for i in range(40):
        kind, p, q = rng.randrange(2,5), rng.randrange(1,n+1), rng.randrange(-2**31,2**31)
        ops.append(f'{kind} {p} {q}')
        for j in range(p-1,n,p):
            a[j] = a[j] & q if kind == 2 else a[j] | q if kind == 3 else a[j] ^ q
            a[j] = ((a[j] + 2**31) % 2**32) - 2**31
    queries = [rng.randrange(1,n+1) for i in range(n+3)]
    ops += [f'1 {p}' for p in queries]
    check('a323', f'{n}\n{numbers(initial)}\n'+'\n'.join(ops)+'\n0', '\n'.join(str(a[p-1]) for p in queries))

# a326: enumerate all card pairs; compare exact rational probabilities.
from fractions import Fraction
for _ in range(150):
    a = [rng.randrange(7) for i in range(rng.randrange(1,8))]
    b = [rng.randrange(7) for i in range(rng.randrange(1,8))]

    def results(cards):
        return sum(x>y for x in cards for y in b), sum(x<y for x in cards for y in b)

    w, l = results(a)
    if w+l == 0:
        continue  # Undefined original win probability is a documented source gap.
    valid = []
    for v in set(a):
        ww,ll = results(a+[v])
        if ww > ll and Fraction(ww,ww+ll) >= Fraction(w,w+l):
            valid.append(v)
    check('a326', f'{len(a)} {len(b)}\n{numbers(a)}\n{numbers(b)}', min(valid) if valid else -1)

# a327: every legal shooting order via subset recursion, with scarce shots.
for _ in range(140):
    n, shots, initial = rng.randrange(1,8), rng.randrange(1,4), rng.randrange(1,8)
    xy = rng.sample([(x,y) for x in range(-8,9) for y in range(-8,9) if x or y], n)
    items = [(x,y,rng.randrange(6),rng.randrange(2)) for x,y in xy]

    @lru_cache(None)
    def shooting(mask, remaining, radius):
        best = radius
        if remaining:
            for i,(x,y,c,b) in enumerate(items):
                if not mask >> i & 1 and x*x+y*y <= radius*radius:
                    best = max(best, shooting(mask | (1<<i), remaining+b-1, radius+c))
        return best

    check('a327', f'{n} {shots} {initial}\n'+'\n'.join(map(numbers,items)), shooting(0,shots,initial))

# a328: literal updates, signed extrema, cancellation, and reactivated zeros.
for _ in range(100):
    n = rng.randrange(1,25)
    choices = [-2**31, 2**31-1,-19,-5,0,5,19]
    initial = [rng.choice(choices) for i in range(n)]
    a, ops, expected = initial[:], [], []
    for i in range(80):
        kind = i % 3 + 1
        l = rng.randrange(n)
        if kind == 3:
            v = rng.choice(choices)
            a[l] = v
            ops.append(f'3 {l+1} {v}')
        else:
            r = rng.randrange(l,n)
            ops.append(f'{kind} {l+1} {r+1}')
            if kind == 1:
                expected.append(str(sum(a[l:r+1])))
            else:
                for j in range(l,r+1):
                    a[j] = int(Fraction(a[j],10))
    check('a328', f'{n} {len(ops)}\n{numbers(initial)}\n'+'\n'.join(ops), '\n'.join(expected))

# a330: every way to cut between consecutive boxes.
for _ in range(130):
    n = rng.randrange(1,11)
    values = [rng.randrange(1,8) for i in range(n)]
    low, high = sorted([rng.randrange(1,20),rng.randrange(1,20)])
    expected = 0
    for cuts in range(1<<(n-1)):
        total, valid = 0, True
        for i,v in enumerate(values):
            total += v
            if i == n-1 or cuts >> i & 1:
                valid &= low <= total <= high
                total = 0
        expected += valid
    check('a330', f'{n} {low} {high}\n{numbers(values)}', expected)

# a334: enumerate feasible whole-boat subsets, then exact set partitions.
for _ in range(120):
    n = rng.randrange(1,10)
    m, limit = rng.randrange(1,n+1), rng.randrange(1,16)
    weights = [rng.randrange(1,limit+1) for i in range(n)]
    valid = {mask for mask in range(1,1<<n) if mask.bit_count() <= m and sum(w for i,w in enumerate(weights) if mask >> i & 1) <= limit}

    @lru_cache(None)
    def boats(mask):
        if mask == 0:
            return 0
        bit = mask & -mask
        return min(1+boats(mask ^ sub) for sub in valid if sub & bit and sub & mask == sub)

    check('a334', f'{n} {m} {limit}\n{numbers(weights)}', boats((1<<n)-1))

# a338: lexicographically largest valid completion by exhaustive recursion.
@lru_cache(None)
def blocks(count, k, last='', run=0):
    if not any(count):
        return ''
    for i in (2,1,0):
        c = 'ABC'[i]
        if count[i] and not (last == c and run == k):
            rest = list(count)
            rest[i] -= 1
            tail = blocks(tuple(rest),k,c,run+1 if last == c else 1)
            if tail is not None:
                return c+tail
    return None


for count in it.product(range(5),repeat=3):
    if not any(count):
        continue
    for k in range(1,4):
        expected = blocks(count,k)
        check('a338', numbers((*count,k)), expected if expected is not None else 'No Solution')

# a343: time-expanded graph with explicitly evaluated trap intervals.
for _ in range(100):
    n,m = rng.randrange(2,5),rng.randrange(2,5)
    deadline = n+m-2+rng.randrange(5)
    grid = ['#' if rng.randrange(5)==0 else '0' for i in range(n*m)]
    grid[0] = grid[-1] = '0'
    traps = [(i//m,i%m,rng.randrange(deadline+1),rng.randrange(1,15))
             for i in range(1,n*m-1) if grid[i]=='0' and rng.randrange(2)]
    intervals = [(r,c,s,rng.randrange(s,deadline+1),a) for r,c,s,a in traps]
    dist = {0:0}
    for time in range(1,deadline+1):
        nxt = {}
        for u,cost in dist.items():
            r,c = divmod(u,m)
            for rr,cc in ((r,c),(r-1,c),(r+1,c),(r,c-1),(r,c+1)):
                if 0 <= rr < n and 0 <= cc < m and grid[rr*m+cc]!='#':
                    loss = sum(a for r0,c0,s,e,a in intervals if (rr,cc)==(r0,c0) and s <= time <= e)
                    v = rr*m+cc
                    nxt[v] = min(nxt.get(v,10**9),cost+loss)
        dist = nxt
    check('a343', f'{n} {m} {deadline} {len(intervals)}\n'+'\n'.join(''.join(grid[r*m:(r+1)*m]) for r in range(n))+'\n'+'\n'.join(map(numbers,intervals)), dist.get(n*m-1,-1))

# a346: all complete edge-id permutations, not vertex order.
for _ in range(130):
    n, start = rng.randrange(1,8),rng.randrange(1,5)
    edges = [(rng.randrange(1,5),rng.randrange(1,5)) for i in range(n)]
    best = None
    for p in it.permutations(range(n)):
        v = start
        for edge in p:
            a,b = edges[edge]
            if v != a:
                break
            v = b
        else:
            if v == start:
                best = p
                break
    check('a346', f'{n} 2\n{start}\n'+'\n'.join(map(numbers,edges)), '0' if best is None else '1\n'+numbers(i+1 for i in best))

# a351: retain repeated sums, rank all nonempty subarrays.
for _ in range(160):
    n = rng.randrange(1,15)
    values = [rng.randrange(6) for i in range(n)]
    sums = sorted((sum(values[l:r]) for l in range(n) for r in range(l+1,n+1)), reverse=True)
    k = rng.randrange(1,len(sums)+1)
    check('a351', f'{n} {k}\n{numbers(values)}', sums[k-1])

for code, entries in sorted(cases.items()):
    print(f'{code}: {len(entries)} independent Python cases passed', flush=True)

if args.limits:
    def limit_case(code, data, expected):
        if code not in lessons:
            return
        started = perf_counter()
        result = subprocess.run([sys.executable, '-c', lessons[code]['python']], input=data,
                                capture_output=True, encoding='utf-8', timeout=60)
        assert result.returncode == 0 and result.stdout.strip() == expected, (code, result.stderr, result.stdout, expected)
        print(f'{code}: constraint case passed in {perf_counter()-started:.3f}s (local timing, not judge certification)', flush=True)

    limit_case('a111', '17\n'+('\n'.join(['0 '*17]*17)), '0\n'+numbers(range(1,18)))
    limit_case('a130', '100 2000 10\n'+('10\n'+'1 100\n'*10)*100, '100000')
    limit_case('a282', ('ab'*5000)+'\n'+(('ba'*5000)+'\n')*3, '3 4')
    limit_case('a301', '2000 2000 2\n'+('1 '*2000+'\n')*2000, '4000000')
    limit_case('a306', '3000 1\n'+('0 '*3000+'\n')*3000, '9000000')
    limit_case('a315', '4000000 1 1\n'+'0 '*4000000, '0')
    limit_case('a328', '500000 15\n'+'2147483647 '*500000+'\n'+'1 1 500000\n'+
               '2 1 500000\n'*10+'1 1 500000\n3 500000 -2147483648\n2 1 500000\n1 1 500000\n',
               '1073741823500000\n0\n-214748364')
    limit_case('a334', '17 17 1000000\n'+'1 '*17, '1')
    limit_case('a343', '200 200 1000 0\n'+('0'*200+'\n')*200, '0')
    limit_case('a351', '500000 125000250000\n'+'1 '*500000, '1')

if args.cxx:
    headers = 'algorithm array bitset cassert cctype cmath cstdint cstdio cstdlib cstring deque functional iomanip iostream iterator limits list map memory numeric optional queue set sstream stack string tuple unordered_map unordered_set utility vector'.split()
    # --temp-root can avoid Windows sandbox temp ACLs; no fixed local paths.
    with tempfile.TemporaryDirectory(prefix='toi-audit-', dir=args.temp_root) as folder:
        root = Path(folder)
        for code, entries in sorted(cases.items()):
            source = root / (code+'.cpp')
            binary = root / (code + ('.exe' if sys.platform == 'win32' else ''))
            cpp = lessons[code]['cpp'].replace('#include <bits/stdc++.h>', '\n'.join('#include <'+h+'>' for h in headers))
            source.write_text(cpp, encoding='utf-8')
            result = subprocess.run([args.cxx,'-std=c++17','-O2',str(source),'-o',str(binary)], capture_output=True, text=True, timeout=180)
            assert result.returncode == 0, (code, result.stderr)
            selected = entries[:3] + entries[-3:]
            for data, expected in selected:
                result = subprocess.run([str(binary)], input=data, encoding='utf-8', capture_output=True, timeout=30)
                assert result.returncode == 0 and result.stdout.strip() == expected, (code, data, expected, result.stdout, result.stderr)
            print(f'{code}: compiled C++17; {len(selected)} independent cases passed', flush=True)
print(f'Independent audit: {len(cases)} codes, {sum(map(len,cases.values()))} Python cases.', flush=True)
