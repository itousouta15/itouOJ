"""Execute embedded reference programs against public cases and independent oracles.

Called by check-apcs-tutorial-audit.mjs. No production requests or database writes.
C++ subprocesses expose native launch errors (such as Windows application-control
failures) instead of Node's generic spawnSync UNKNOWN. These remain failures.
"""
import io
import itertools as it
import json
import pathlib
import random
import re
import subprocess
import sys
import tempfile
from collections import Counter, deque
from contextlib import nullcontext
from functools import lru_cache

payload = json.loads(sys.stdin.buffer.read().decode('utf-8'))
lessons = payload['lessons']
cases = {code: [(s['input'], s['output'], 'public sample') for s in samples]
         for code, samples in payload['samples'].items()}


def add(code, data, expected, reason):
    if code in cases:
        cases[code].append((data, str(expected), reason))


def nums(values):
    return ' '.join(map(str, values))


def matrix(values):
    return '\n'.join(map(nums, values))


# One explicitly reasoned edge case for every inspected entry. Undefined source
# cases are deliberately not assigned invented expected outputs (a375/423/441).
edges = {
    'a006': ('-1000000000 -1 -1000000000', '-1', 'all negative, tied smaller values'),
    'a007': ('0.75 42 1.2 65', 'B', 'only the specified fixed capacities and prices'),
    'a010': ('10', '55\n3628800', 'largest allowed factorial'),
    'a019': ('a\naa', 'No', 'needle longer than haystack'),
    'a023': ('10\n0 59 60 69 70 79 80 89 90 100', 'A: 2\nB: 2\nC: 2\nD: 2\nF: 2', 'every grade boundary'),
    'a026': ('4\n3 3 3 3', '0', 'equal plateau is not a peak'),
    'a029': ('1 10\n5 60', '60', 'one item must not be reused'),
    'a030': ('1 2\n1 1 5\n1 1 1', '0', 'start equals goal, positive self loops'),
    'a031': ('5\n5 5 5 5 5', '1', 'strict increase excludes equal values'),
    'a356': ('2 1\n1\n0 7\n7 0', '14', 'both couriers must reach destination'),
    'a357': ('1 1\n1 1 -7', '-7', 'nonempty negative self loop'),
    'a358': ('3 3\n9 1 5\n100 1 50', '0', 'every point gets its own path'),
    'a359': ('2 2 2 2 2\n1 1 2 2', '1 4', 'lexicographic second pair, duplicate skills'),
    'a360': ('3 2\n5 5 6\n5 5\n5 6', '5', 'closed endpoints and duplicate arrivals'),
    'a361': ('3 2\n2 2 2\n1 2 1 1\n2 3 1 1', '1\n2', 'stop at equality; offset subrange'),
    'a362': ('1\n2 2', '-2 -2', 'scissors draw penalizes both'),
    'a363': ('2\n5 7', '-13', 'negative effect truncates toward zero'),
    'a364': ('1 1\n100', '100 0 0', 'keep the only bag'),
    'a365': ('1\n1', '1', 'final output is itself a pop'),
    'a366': ('2\n0 1 1\n999 1000 1', '998', 'no gap before first job'),
    'a367': ('2\n1 A 10\n1 B 10', '0', 'no matching tops'),
    'a368': ('1 2\n1 2\n2 1', '100%', 'rectangular 180 degree rotation'),
    'a369': ('3 3\n0 7 4\n7 0 9\n4 9 0', '4', 'K=N means no unions'),
    'a370': ('3 100\n2 2 2', '8', 'tie goes to smaller index; completed neighbor skipped'),
    'a371': ('4 2\n0 0 0 0', '0', 'distinct people at same coordinate'),
    'a372': ('1', '0\n0', 'one point has no distances'),
    'a373': ('2 5 100\n0 0\n5 5', '2', 'identical routes are distinct choices'),
    'a374': ('2 2 4\n-2 0\n0 0', '2', 'zero radius bombs do not propagate'),
    'a375': ('1 2 1 0 0\n1 0', '1', 'turn then avoid edge, stop at empty neighbor'),
    'a376': ('2\n1 1 1 1\n2 5', '2', 'overflowing a full cup adds no height'),
    'a377': ('3 1\n1 2 1', '0', 'only empty selection satisfies bound and balance'),
    'a378': ('1 1 2\n0 0 0 3\n0 0 20 7', '10', 'radius zero and overlapping additions'),
    'a379': ('1\n-1000', '0', 'one number requires no merge'),
    'a380': ('1 1 1 2\n1\n4\n1 2\n2 3', '1\n0', 'NOT contributes one delay, output none'),
    'a381': ('1 1 6\nA\n0 1 2 3 4 5', 'AAAAAA\n1', 'every out of bounds step still records'),
    'a382': ('3\n1 1\n2 2\n3 3', '2 2', 'output attack/defense, not squared power'),
    'a383': ('3 1\n3 -5 4', '7', 'one skipped day connects positive endpoints'),
    'a384': ('1 2\nII', '1', 'adjacent closed sides are disconnected'),
    'a385': ('1 4\n1 0 0 1', '1', 'zero pair must be removed to expose ones'),
    'a386': ('0 3\n-100 1 1', '2 1', 'count repeated food portions, not distance'),
    'a387': ('2 2 1\n0\n0\n1\n1\n0', '0', 'unseeded cyclic dependencies stay closed'),
    'a388': ('L3T20T30E', '60', 'loop joins include return from last to first'),
    'a389': ('1 1\n0', '1\n0 0', 'zero radius includes the zero center'),
    'a390': ('2 1\n0 1\n1 2', '1', 'touching closed intervals conflict'),
    'a391': ('2+3*4+1', '25', 'addition has higher precedence than product'),
    'a392': ('1\n999999', '0\n0', 'one cell requires no steps or height change'),
    'a393': ('1 0 0 0', '0', 'odd leaf consumes three dead ends'),
    'a394': ('4 1 1\nA 0', '0 0', 'vertical piece fits a one column warehouse'),
    'a395': ('1 1\n-2\n3', '-6', 'nonempty product must be negative'),
    'a396': ('1\n1 1 0', '0', 'no mirror on initial horizontal ray'),
    'a397': ('9 9 9', '3 9', 'frequency first, value output only once'),
    'a398': ('4 2\n1 1 1 1\n2 2', '1', 'adjacent posters consume distinct boards'),
    'a399': ('2 1\n1 1\n1 1\n2 1', '2', 'tied power favors earlier in current order'),
    'a400': ('3 10\n30 20 35', '0', 'a falling price never lowers old purchase basis'),
    'a401': ('1 2\n0\n3 4', '1 1', 'root itself is the sole box'),
    'a402': ('1 10\n5\n5', '1\n5', 'falling exactly to boundary is allowed'),
    'a403': ('0\n1\n0', '0 : Drew at round 1', 'single tied round'),
    'a404': ('3 1\n0 1\n2 2\n1 2 2 0\n1 2 1 2', '1', 'first creates triangle, next must start at base'),
    'a405': ('2 1\n1 1 2\n1 100', '2', 'zero workload gets slow machine'),
    'a406': ('1 3 3\n0 0 0\n0 2 0\n0 0 1', '3\n1', 'deletion removes whole segment, no reconnection'),
    'a407': ('3\n0 5 0', '10', 'both damaged endpoints use sole neighbor'),
    'a408': ('4 2\n1 1 1 1', '2', 'each segment can contain only one repeated food'),
    'a409': ('3\n2 1 3', '3', 'minimum excluded, retain larger side'),
    'a410': ('1 1 2\n0 0 0 0\n0 0 0 0', '0', 'same cell simultaneous self explosions'),
    'a411': ('1\n0 0 0 1 0 0 1\n0 1 0 0 0 1 0', 'None', 'all three rules satisfied'),
    'a412': ('h 1 2 3', '2', 'parameter order matters: 3-4+3'),
    'a413': ('5 0\n1 2 3 4 5', '0', 'K=0 performs no cuts'),
    'a414': ('1\n1024', '1048576', 'black node contributes entire area'),
    'a415': ('3\n1 1\n1 2\n2 2', '3', 'equal x and equal y both permitted'),
    'a416': ('2 10\n7 2\n3 1', '17', 'input order differs from cut order'),
    'a417': ('2 2 1\n0 600\n0 600\n0 0', '3400', 'aggregate before discount'),
    'a418': ('1 1\n1 1 @', '0', 'free root has no edges to charge'),
    'a419': ('1 2\n9\n9 1', '0', 'single room, equal threshold and extra points discarded'),
    'a420': ('1 4\n1 -1\n1 -1\n1 -1\n1 -1', '1', 'four forward rolls restore full orientation'),
    'a421': ('3\n3 2 1 1 2 3', '6', 'both copies of a smaller value count'),
    'a422': ('2 2\n-5 -1\n-2 -4', '-5', 'mandatory nonempty path through both rows'),
    'a423': ('1 1 4 50\n0', '0\n0', 'zero is a city, no neighbors'),
    'a424': ('-1 0 -10\n-1 0 -10\n1', '-21', 'negative optimum, both constant terms included'),
    'a425': ('4 3 1 1\n0 2 3 3', '2', 'teleport only once per move'),
    'a426': ('10 5 2\n2 3', '0', 'existing empty lockers already suffice'),
    'a427': ('3\nAA\nA\nB', 'A', 'equal distinct count, prefix wins lexicographically'),
    'a428': ('3 1\n7 7 7', '1', 'source requires positive diameter'),
    'a429': ('1\n1000\n1000', '0', 'top item never lifts itself'),
    'a430': ('1\n0', '1\n0', 'single root/leaf height zero'),
    'a431': ('\n'.join(['1 SO'] * 9) + '\n1', '0', 'stop exactly at requested out'),
    'a432': ('5 2 2', '5', 'lucky person is next survivor after K removals'),
    'a433': ('2 1\n3\n3', '6\n3 3', 'duplicate selected values are each output'),
    'a434': ('3\n0\n1 1 1\n1 1 1\n1 1 1', '111111111', 'visit exactly N squared cells'),
    'a435': ('3\n0 1 2', '3', 'self loops are separate cycles'),
    'a436': ('2\n1 0', '1', 'root need not be zero, distance counts edges'),
    'a437': ('3\n0 0\n0 2\n2 3', '3', 'zero length and touching segments'),
    'a438': ('1\n60', '60\nbest case\n60', 'sixty is passing; no failing scores'),
    'a439': ('1 2 1 2 1\n0 0\n9 9', '0\n-1', 'distance counts mismatched cells, not numeric sum'),
    'a440': ('1 2 1\n2 1\n0', '2 1\n1\n2', 'undo clockwise rotation on rectangle'),
    'a441': ('ab\n2\naxbb', 'aa', 'outside-alphabet letter breaks rolling window'),
    'a442': ('2\nabyyyab\nyyy', '1', 'successful pair need not use one repeated letter'),
    'a443': ('1\n0000000000000', '000 1', 'valid zero checksum preserves origin zeros'),
    'a444': ('1 1 2\na\n100\n-100', '2', 'single column and signed multiple-circle shifts'),
    'a445': ('abcdef\n1\n2', 'adbecf', 'interleave halves, not split parity positions'),
    'a446': ('3 1 3\nabc\n2 3 1', 'c\na\nb', 'source-to-destination noninvolutive permutation'),
    'a447': ('1 1\n1\nA', 'A', 'odd central character remains fixed'),
    'a448': ('3\naA', '0', 'block longer than string'),
    'a449': ('4 3\n3\n4 7 11', '6', 'red boundary waits full red, cycle boundary none'),
    'a450': ('5\n5 5 5 5 5', '1', 'equality breaks strict decrease'),
    'a451': ('3\n1 3\n2 -1\n3 3', '0 1', 'first maximum preserved, total clipped to zero'),
    'a452': ('4\n0 0\n0 0\n-100 100\n-100 100', '200 0', 'duplicate stops yield zero distance'),
    'a453': ('1 0\n0 0 0', '1 0', 'zero threshold includes zero difference'),
    'a454': ('3 3\n2\n3 -3 0\n3 0', '1', 'same queried product and cancellation'),
    'a455': ('12', '1', 'left/right grouping swaps sums, absolute answer unchanged'),
    'a456': ('1\n1 1\n1 1', '1', 'both traps trigger even if first removes all health'),
    'a457': ('4\n1 0\n1 -1\n1 0\n0 0', '1 1 1', 'right, reversal, left in north-positive coordinates'),
    'a458': ('3 0 1', 'OR\nXOR', 'logical truth, not integer bitwise operators'),
    'a459': ('1 2 3', '1 2 3\nNo', 'degenerate triangle rejected first'),
}
if len(lessons) == 113:
    assert set(edges) == set(payload['samples'])
else:
    assert set(lessons) <= set(edges)
for code, (data, expected, reason) in edges.items():
    add(code, data, expected, reason)

rng = random.Random(20261020)
for trial in range(24):
    # Item subsets, independent of the one-dimensional recurrence and direction.
    n, capacity = rng.randint(1, 7), rng.randint(1, 15)
    items = [(rng.randint(1, 10), rng.randint(1, 10**9)) for _ in range(n)]
    valid = [sum(items[i][1] for i in range(n) if mask >> i & 1)
             for mask in range(1 << n)
             if sum(items[i][0] for i in range(n) if mask >> i & 1) <= capacity]
    add('a029', f'{n} {capacity}\n' + matrix(items), max(valid), 'exhaustive item subsets')

    a = [rng.randint(1, 5) for _ in range(rng.randint(1, 9))]
    sequences = [[a[i] for i in range(len(a)) if mask >> i & 1] for mask in range(1 << len(a))]
    lis = max(len(seq) for seq in sequences if all(x < y for x, y in zip(seq, seq[1:])))
    add('a031', f'{len(a)}\n' + nums(a), lis, 'exhaustive subsequences')

    # Name both couriers, enumerate every assignment, retain direct matrix costs.
    n = rng.randint(2, 6)
    c = [[0]*n for _ in range(n)]
    for i in range(n):
        for j in range(i):
            c[i][j] = c[j][i] = rng.randrange(51)
    tasks = rng.sample(range(n), rng.randint(1, n))
    totals = []
    for choices in it.product(range(2), repeat=len(tasks)):
        pos, total = [0, 0], 0
        for person, target in zip(choices, tasks):
            total += c[pos[person]][target]
            pos[person] = target
        totals.append(total + sum(c[p][n-1] for p in pos))
    add('a356', f'{n} {len(tasks)}\n' + nums(x+1 for x in tasks) + '\n' + matrix(c), min(totals), 'enumerate courier identities and assignments')

    # Enumerate each legal directed trail, including wrap and all-negative cases.
    n = rng.randint(1, 8)
    ends = rng.sample(range(n), n)
    outgoing = {u: (v, rng.randint(-9, 9)) for u, v in enumerate(ends) if rng.randrange(4)}
    if not outgoing:
        outgoing[0] = (0, -1)
    best = -10**9
    for start in outgoing:
        seen, total, u = set(), 0, start
        while u in outgoing and u not in seen:
            seen.add(u)
            u, w = outgoing[u]
            total += w
            best = max(best, total)
    add('a357', f'{n} {len(outgoing)}\n' + matrix((u+1, v+1, w) for u, (v, w) in outgoing.items()), best, 'enumerate all directed nonempty trails')

    n = rng.randint(1, 7)
    points = sorted(zip(rng.sample(range(1, 50), n), [rng.randint(1, 30) for _ in range(n)]))
    k = rng.randint(1, n)
    edge = [b[0]-a[0]+max(0, 2*(b[1]-a[1])) for a, b in zip(points, points[1:])]
    answers = []
    for cuts in it.combinations(range(1, n), k-1):
        bounds = (0,)+cuts+(n,)
        answers.append(max(sum(edge[l:r-1]) for l, r in zip(bounds, bounds[1:])))
    rng.shuffle(points)
    add('a358', f'{n} {k}\n'+nums(x for x, y in points)+'\n'+nums(y for x, y in points), min(answers), 'enumerate every K-way partition')

    # Literal two-stack machine (top at index zero), no rank/Fenwick formula.
    permutation = rng.sample(range(1, 8), 7)
    stacks = [[], permutation.copy()]
    pops = 0
    for target in range(1, 8):
        source = 0 if target in stacks[0] else 1
        while stacks[source][0] != target:
            stacks[1-source].insert(0, stacks[source].pop(0))
            pops += 1
        stacks[source].pop(0)
        pops += 1
    add('a365', '7\n'+nums(permutation), pops, 'literal stack transfers and outputs')

    a = [rng.randint(1, 10) for _ in range(rng.randint(1, 9))]
    limit = rng.randint(1, 35)
    candidates = []
    for left in range(len(a)+1):
        for right in range(left, len(a)+1):
            taken = a[:left]+a[right:]
            if sum(x % 2 for x in taken)*2 == len(taken) and sum(taken) <= limit:
                candidates.append(sum(taken))
    add('a377', f'{len(a)} {limit}\n'+nums(a), max(candidates), 'enumerate all nonoverlapping prefix/suffix pairs')

    a = [rng.randint(-9, 9) for _ in range(rng.randint(1, 6))]
    @lru_cache(None)
    def merge(values):
        if len(values) == 1:
            return 0
        return min(abs(values[i]-values[i+1])+merge(values[:i]+(values[i]+values[i+1],)+values[i+2:])
                   for i in range(len(values)-1))
    add('a379', f'{len(a)}\n'+nums(a), merge(tuple(a)), 'enumerate adjacent merge orders with signed numbers')

    a = [rng.randint(-5, 5) for _ in range(rng.randint(1, 7))]
    k = rng.randint(0, 3)
    gains = [0]
    for l in range(len(a)):
        for r in range(l+1, len(a)+1):
            for removed in it.combinations(range(l, r), min(k, r-l)):
                gains.append(sum(a[i] for i in range(l, r) if i not in removed))
            # At most k: using all medals need not improve positive segments.
            gains.append(sum(a[l:r]))
            for count in range(min(k, r-l)):
                gains.extend(sum(a[i] for i in range(l, r) if i not in removed)
                             for removed in it.combinations(range(l, r), count))
    add('a383', f'{len(a)} {k}\n'+nums(a), max(gains), 'enumerate intervals and removed days')

    a = [rng.randint(-4, 4) for _ in range(rng.randint(1, 5))]
    b = [rng.randint(-4, 4) for _ in range(rng.randint(1, 5))]
    products = [sum(a[i+t]*bb[j+t] for t in range(length))
                for bb in (b, b[::-1]) for length in range(1, min(len(a), len(b))+1)
                for i in range(len(a)-length+1) for j in range(len(bb)-length+1)]
    add('a395', f'{len(a)} {len(b)}\n'+nums(a)+'\n'+nums(b), max(products), 'enumerate starts, lengths, and relative directions')

    n, k = rng.randint(1, 9), rng.randint(1, 3)
    food = [rng.randint(1, 4) for _ in range(n)]
    @lru_cache(None)
    def tasting(start, groups):
        if start == n or groups == 0:
            return 0
        best = tasting(start+1, groups)
        seen = set()
        for end in range(start, n):
            if food[end] in seen:
                break
            seen.add(food[end])
            best = max(best, end-start+1+tasting(end+1, groups-1))
        return best
    add('a408', f'{n} {k}\n'+nums(food), tasting(0, k), 'enumerate skipped stalls and every legal segment start/end')

    n, depth = rng.randint(1, 12), rng.randint(0, 5)
    weights = [0]+[rng.randint(1, 30) for _ in range(n)]
    def cutting(l, r, d):
        if d > depth or r-l+1 < 3:
            return 0
        mid = min(range(l+1, r), key=lambda m: (abs(sum(weights[i]*(i-m) for i in range(l, r+1))), m))
        return weights[mid]+cutting(l, mid-1, d+1)+cutting(mid+1, r, d+1)
    add('a413', f'{n} {depth}\n'+nums(weights[1:]), cutting(1, n, 1), 'direct moment sum at every candidate cut')

    # Enumerate tiny simple paths; forbidding up prevents return to earlier rows.
    rows, cols = rng.randint(1, 3), rng.randint(1, 3)
    grid = [[rng.randint(-5, 5) for _ in range(cols)] for _ in range(rows)]
    paths = []
    def walk(r, c, visited, score):
        if r == rows-1:
            paths.append(score)
        for dr, dc in ((0, -1), (0, 1), (1, 0)):
            nr, nc = r+dr, c+dc
            if 0 <= nr < rows and 0 <= nc < cols and (nr, nc) not in visited:
                walk(nr, nc, visited | {(nr, nc)}, score+grid[nr][nc])
    for c in range(cols):
        walk(0, c, {(0, c)}, grid[0][c])
    add('a422', f'{rows} {cols}\n'+matrix(grid), max(paths), 'enumerate all tiny legal simple paths')

    n, m = rng.randint(2, 12), rng.randint(1, 30)
    k = rng.randint(1, n-1)
    alive, cursor = list(range(1, n+1)), 0
    for _ in range(k):
        cursor = (cursor+m-1) % len(alive)
        alive.pop(cursor)
        cursor %= len(alive)
    add('a432', f'{n} {m} {k}', alive[cursor], 'literal Josephus elimination')

    # Forward encryption tests the inverse and odd-center convention independently.
    length, layers = rng.randint(1, 9), rng.randint(1, 5)
    original = ''.join(rng.choice('ABCDE') for _ in range(length))
    masks = [''.join(rng.choice('01') for _ in range(length)) for _ in range(layers)]
    current = original
    for mask in masks:
        if mask.count('1') % 2:
            half = length//2
            current = current[-half:]+(current[half] if length % 2 else '')+current[:half] if half else current
        pool, encoded = deque(current), []
        for bit in mask:
            encoded.append(pool.popleft() if bit == '0' else pool.pop())
        current = ''.join(encoded)
    add('a447', f'{layers} {length}\n'+'\n'.join(masks)+'\n'+current, original, 'forward encryption round trip, odd/even lengths and multiple layers')

    text = ''.join(rng.choice('aA') for _ in range(rng.randint(1, 16)))
    block = rng.randint(1, len(text)+2)
    valid = [0]
    for l in range(len(text)):
        for r in range(l+block, len(text)+1, block):
            parts = [text[i:i+block] for i in range(l, r, block)]
            if all(len(set(p)) == 1 for p in parts) and all(a[0] != b[0] for a, b in zip(parts, parts[1:])):
                valid.append(r-l)
    add('a448', f'{block}\n{text}', max(valid), 'enumerate every substring and check fixed-size blocks')

    digits = str(rng.randint(1, 10**30))
    alternating = abs(sum(int(d)*(-1)**i for i, d in enumerate(digits)))
    add('a455', digits, alternating, 'left-index grouping gives same absolute difference')


# Additional small exhaustive models for the higher-risk algorithms.
for trial in range(12):
    skills, classes, size = rng.randint(1, 5), rng.randint(1, 3), rng.randint(1, 3)
    people = [rng.randint(1, skills) for _ in range(classes*size)]
    count = rng.randint(1, min(skills, len(people), 5))
    teams = [team for team in it.combinations(range(len(people)), count)
             if len({people[i] for i in team}) == count and max(Counter(i//size for i in team).values()) <= 2]
    if teams:
        rank = rng.randint(1, len(teams))
        add('a359', f'{skills} {classes} {size} {count} {rank}\n'+nums(people),
            nums(i+1 for i in teams[rank-1]), 'enumerate and lexicographically sort legal teams')

    jobs = []
    clock = 0
    for _ in range(rng.randint(2, 5)):
        duration = rng.randint(1, 3)
        jobs.append((clock, clock+duration+rng.randint(0, 6), duration))
        clock += duration+rng.randint(0, 3)
    best = 0
    for order in it.permutations(jobs):
        for gap in range(31):
            end = 0
            for index, (start, deadline, duration) in enumerate(order):
                end = max(start, end+(gap if index else 0))+duration
                if end > deadline:
                    break
            else:
                best = max(best, gap)
                continue
            break
    add('a366', f'{len(jobs)}\n'+matrix(jobs), best, 'enumerate job permutations and every small gap')

    stacks = [tuple((rng.choice('ABC'), rng.randint(1, 10)) for _ in range(rng.randint(1, 4)))
              for _ in range(rng.randint(2, 4))]
    @lru_cache(None)
    def matching(state):
        answers = [0]
        for a, b in it.combinations(range(len(state)), 2):
            if state[a] and state[b] and state[a][0][0] == state[b][0][0]:
                after = list(state)
                after[a], after[b] = state[a][1:], state[b][1:]
                answers.append(state[a][0][1]+state[b][0][1]+matching(tuple(after)))
        return max(answers)
    add('a367', str(len(stacks))+'\n'+'\n'.join(str(len(s))+' '+nums(v for pair in s for v in pair) for s in stacks),
        matching(tuple(stacks)), 'literal stack-pair search without radix encoding or pruning')

    n = rng.randint(2, 6)
    groups = rng.randint(2, n)
    distances = [[0]*n for _ in range(n)]
    for i in range(n):
        for j in range(i):
            distances[i][j] = distances[j][i] = rng.randint(1, 12)
    best = 0
    for partition in it.product(range(groups), repeat=n):
        if partition[0] or len(set(partition)) != groups:
            continue
        spacing = min(distances[i][j] for i in range(n) for j in range(i) if partition[i] != partition[j])
        best = max(best, spacing)
    add('a369', f'{n} {groups}\n'+matrix(distances), best, 'enumerate all nonempty K-group assignments')

    n = rng.randint(2, 7)
    group = rng.randint(1, n//2)
    coordinates = [rng.randint(0, 12) for _ in range(n)]
    def meeting(indices):
        values = sorted(coordinates[i] for i in indices)
        return sum(abs(x-values[len(values)//2]) for x in values)
    best = min(meeting(left)+meeting(right) for left in it.combinations(range(n), group)
               for right in it.combinations([i for i in range(n) if i not in left], group))
    add('a371', f'{n} {group}\n'+nums(coordinates), best, 'arbitrary disjoint groups, not restricted to windows')

    length = rng.randint(2, 10)
    original = (0,)+tuple(sorted(rng.sample(range(1, length), rng.randint(0, min(4, length-1)))))+(length,)
    def deltas(points):
        return sorted(abs(a-b) for a, b in it.combinations(points, 2))
    target = deltas(original)
    solutions = [(0,)+middle+(length,) for middle in it.combinations(range(1, length), len(original)-2)
                 if deltas((0,)+middle+(length,)) == target]
    rng.shuffle(target)
    add('a372', str(len(original))+'\n'+nums(target), nums(min(solutions))+'\n'+nums(max(solutions)),
        'enumerate all coordinate sets in bounded length, including reflections')

    destination = rng.randint(1, 8)
    routes = []
    for _ in range(rng.randint(1, 10)):
        start = rng.randrange(destination)
        routes.append((start, rng.randint(start+1, destination)))
    @lru_cache(None)
    def bus(position):
        if position == destination:
            return 1
        return sum(bus(end) for start, end in routes if start <= position < end)
    modulus = rng.choice((1, 2, 7, 1000000009))
    add('a373', f'{len(routes)} {destination} {modulus}\n'+nums(s for s, e in routes)+'\n'+nums(e for s, e in routes),
        bus(0) % modulus, 'enumerate forward route-index sequences, duplicates preserved')

    rows, cols = rng.randint(2, 4), rng.randint(2, 4)
    grid = [[rng.choice([-1, 0, 0, 0, 1, 2]) for _ in range(cols)] for _ in range(rows)]
    grid[0][0] = -2
    def reachable(center, radius):
        distances = {center: 0}
        queue = deque([center])
        while queue:
            r, c = queue.popleft()
            if distances[r, c] == radius:
                continue
            for nr, nc in ((r-1, c), (r+1, c), (r, c-1), (r, c+1)):
                if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] != -1 and (nr, nc) not in distances:
                    distances[nr, nc] = distances[r, c]+1
                    queue.append((nr, nc))
        return set(distances)
    component = reachable((0, 0), rows*cols)
    if len(component) > 1:
        target = rng.randint(2, len(component))
        for radius in range(rows*cols):
            exploded, queue = {(0, 0)}, deque([(0, 0)])
            while queue:
                bomb = queue.popleft()
                r, c = bomb
                for cell in reachable(bomb, radius if bomb == (0, 0) else grid[r][c]):
                    if cell not in exploded:
                        exploded.add(cell)
                        queue.append(cell)
            if len(exploded) >= target:
                break
        add('a374', f'{rows} {cols} {target}\n'+matrix(grid), radius,
            'independent full explosion closure for each candidate initial radius')

    # Exhaustive elimination orders on a small board (zero is an actual tile).
    rows, cols = 2, 4
    tiles = [0, 0, 1, 1, 2, 2, 3, 3]
    rng.shuffle(tiles)
    @lru_cache(None)
    def eliminate(alive):
        best = 0
        for a, b in it.combinations(range(8), 2):
            if not (alive >> a & 1 and alive >> b & 1) or tiles[a] != tiles[b]:
                continue
            ar, ac = divmod(a, cols)
            br, bc = divmod(b, cols)
            between = None
            if ar == br:
                between = range(a+1, b)
            elif ac == bc:
                between = range(a+cols, b, cols)
            if between is not None and all(not (alive >> i & 1) for i in between):
                best = max(best, tiles[a]+eliminate(alive & ~(1 << a) & ~(1 << b)))
        return best
    add('a385', '2 4\n'+matrix([tiles[:4], tiles[4:]]), eliminate(255), 'enumerate all tile-removal orders')

    n, machines = rng.randint(1, 8), rng.randint(1, 3)
    events = []
    for _ in range(n):
        start = rng.randrange(8)
        events.append((start, rng.randint(start, 9)))
    # Intervals can be colored with K machines iff at most K overlap anywhere.
    best = 0
    for mask in range(1 << n):
        chosen = [events[i] for i in range(n) if mask >> i & 1]
        if all(sum(l <= time <= r for l, r in chosen) <= machines for time in range(10)):
            best = max(best, len(chosen))
    add('a390', f'{n} {machines}\n'+nums(l for l, r in events)+'\n'+nums(r for l, r in events), best,
        'enumerate event subsets and closed-interval overlap capacity')

    # Bipartite graph coloring from scratch for each investigator, no rollback DSU.
    n = rng.randint(3, 8)
    colors = [rng.randrange(2) for _ in range(n)]
    base = [(i, j) for i in range(n) for j in range(i) if colors[i] != colors[j] and rng.randrange(2)]
    if not base:
        base = [(0, 1)]
    investigators = [[(rng.randrange(n), rng.randrange(n)) for _ in range(3)] for _ in range(3)]
    bad = []
    for number, extra in enumerate(investigators, 1):
        graph = [[] for _ in range(n)]
        for a, b in base+extra:
            graph[a].append(b)
            graph[b].append(a)
        assigned, ok = {}, True
        for root in range(n):
            if root in assigned:
                continue
            assigned[root] = 0
            queue = deque([root])
            while queue:
                a = queue.popleft()
                for b in graph[a]:
                    if b not in assigned:
                        assigned[b] = 1-assigned[a]
                        queue.append(b)
                    elif assigned[b] == assigned[a]:
                        ok = False
        if not ok:
            bad.append(number)
    if bad:
        # The source also promises a common actual grouping for good reports.
        # Make all good reports duplicate a known-correct base edge to preserve it.
        investigators = [extra if i+1 in bad else [base[0]]*3 for i, extra in enumerate(investigators)]
        add('a404', f'{n} {len(base)}\n'+nums(v for edge in base for v in edge)+'\n3 3\n'
            +'\n'.join(nums(v for edge in extra for v in edge) for extra in investigators),
            '\n'.join(map(str, bad)), 'color each augmented graph independently')

    n = rng.randint(1, 6)
    parents = [0]+[rng.randrange(i) for i in range(1, n)]
    letters = [rng.choice('AUCG@') for _ in range(n)]
    unknown = [i for i in range(n) if letters[i] == '@']
    best = n
    for choices in it.product('AUCG', repeat=len(unknown)):
        completed = letters.copy()
        for i, value in zip(unknown, choices):
            completed[i] = value
        best = min(best, sum(completed[i] != completed[parents[i]] for i in range(1, n)))
    records = [(i+1, parents[i]+1, letters[i]) for i in range(n)]
    rng.shuffle(records)
    add('a418', f'{n} 1\n'+matrix(records), best, 'enumerate all unknown RNA characters, shuffled records')

    words = rng.sample([''.join(chars) for length in range(1, 6) for chars in it.product('ab', repeat=length)], 12)
    pairs = [a+b for a, b in it.combinations(words, 2)]
    expected = sum(len(word) % 2 == 0 and word[:len(word)//2] == word[len(word)//2:] for word in pairs)
    add('a442', '12\n'+'\n'.join(words), expected, 'concatenate every unordered pair and compare actual halves')


# Unbounded source tokens where saturation is justified; no need to invent bounds.
add('a376', '1\n1 1 1 1\n'+'9'*5000, 2, '5000-digit poured volume saturates to capacity')
add('a410', '1 2 1\n0 0 0 -'+'9'*5000, 1, '5000-digit negative step necessarily exits')
add('a448', '9'*5000+'\naA', 0, '5000-digit k exceeds string length')
add('a030', '4 4\n1 2 1000000000\n2 3 1000000000\n3 4 1000000000\n1 2 999999999',
    2999999999, 'parallel edges and 64-bit path sum')
add('a029', '3 3\n1 1000000000\n1 1000000000\n1 1000000000', 3000000000, '64-bit knapsack sum')
add('a455', '9'+'0'*999, 9, '1000-digit input never parsed as an integer')

if payload.get('stress'):
    n = 100000
    add('a430', str(n)+'\n'+'\n'.join('1 '+str(i+1) for i in range(1, n))+'\n0',
        '1\n'+str(n*(n-1)//2), '100000-deep tree and 64-bit height sum')
    add('a412', 'f '*30000+'3', 3, 'deep prefix fixed point avoids recursion')
    add('a388', 'L1'*30000+'T99'+'E'*30000, 89, 'deep nested loop stack')
    add('a367', '6\n'+'\n'.join(['12 '+'A 10 '*12]*6), 720, 'max six stacks, all scores attainable')
    add('a030', '2 50000\n'+'\n'.join(f'1 2 {w}' for w in range(50000, 0, -1)),
        1, '50000 stale parallel-edge heap entries')

headers = ('algorithm array bitset cassert cctype cmath climits cstdint cstdio cstdlib cstring '
           'deque functional iomanip iostream iterator limits list map numeric optional queue set '
           'sstream stack string tuple unordered_map unordered_set utility vector').split()
saved_stdin, saved_stdout, saved_limit = sys.stdin, sys.stdout, sys.getrecursionlimit()
total = 0
with (tempfile.TemporaryDirectory(prefix='apcs-audit-', dir=payload.get('tempRoot'))
      if payload.get('cxx') else nullcontext(None)) as temp:
    for code, lesson in sorted(lessons.items()):
        executable = None
        if payload.get('cxx'):
            source = pathlib.Path(temp)/(code+'.cpp')
            executable = pathlib.Path(temp)/(code+('.exe' if sys.platform == 'win32' else ''))
            program = lesson['cpp']
            if sys.platform == 'win32':
                program = re.sub(r'#include\s*<bits/stdc\+\+\.h>', '\n'.join('#include <'+h+'>' for h in headers), program)
            source.write_text(program, encoding='utf-8')
            result = subprocess.run([payload['cxx'], '-std=c++17', '-O2', str(source), '-o', str(executable)],
                                    capture_output=True, text=True, timeout=180)
            assert result.returncode == 0, (code, result.stdout, result.stderr)
        compiled = compile(lesson['python'], '<lesson '+code+'>', 'exec')
        for data, expected, reason in cases[code]:
            stdin = io.TextIOWrapper(io.BytesIO(data.encode('utf-8')))
            output = io.BytesIO()
            stdout = io.TextIOWrapper(output, encoding='utf-8')
            try:
                sys.stdin, sys.stdout = stdin, stdout
                try:
                    exec(compiled, {'__name__': '__main__'})
                except SystemExit as stop:
                    assert stop.code in (None, 0), (code, stop.code)
                stdout.flush()
                actual = output.getvalue().decode('utf-8')
            finally:
                sys.stdin, sys.stdout = saved_stdin, saved_stdout
                sys.setrecursionlimit(saved_limit)
            assert actual.split() == expected.split(), (code, 'Python', reason, data[:500], actual, expected)
            if executable and not payload.get('compileOnly'):
                result = subprocess.run([str(executable)], input=data, capture_output=True,
                                        text=True, encoding='utf-8', timeout=15)
                assert result.returncode == 0, (code, 'C++ runtime', reason, result.stderr)
                assert result.stdout.split() == expected.split(), (code, 'C++', reason, data[:500], result.stdout, expected)
            total += 1
        public = sum(reason == 'public sample' for _, _, reason in cases[code])
        languages = (' (Python; C++ compiled only)' if payload.get('compileOnly') else ' (Python + C++)') if executable else ' (Python)'
        print(f'{code}: {public} public + {len(cases[code])-public} independent cases passed'+languages, flush=True)
executed = 'Python and C++' if payload.get('cxx') and not payload.get('compileOnly') else 'Python'
print(f'Passed {len(lessons)} lessons, {total} cases per executed language ({executed}); fixed seed 20261020.')
