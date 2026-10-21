"""Independent CPE regression oracles, consuming current exported lessons on stdin.

Run via check-cpe-tutorial-audit.mjs and the project's TypeScript loader.
Enumerators deliberately use different models from the lesson algorithms.
No network access, judge submissions, or persistent generated files.
"""
import argparse
import itertools as it
import json
import math
import pathlib
import random
import subprocess
import sys
import tempfile
from collections import deque
from contextlib import nullcontext
from fractions import Fraction
from decimal import Decimal, localcontext
from functools import lru_cache


def normalized(value):
    # Keep leading/internal whitespace and blank lines (including ASCII art).
    return "\n".join(line.rstrip(" \t") for line in value.replace("\r\n", "\n").split("\n")).rstrip("\n")


def check_program(command, data, expected, label):
    # Send exact bytes: Windows text-mode writes would turn CRLF into CRCRLF.
    result = subprocess.run(command, input=data.encode("utf-8"), capture_output=True, timeout=90)
    actual = result.stdout.decode("utf-8")
    if result.returncode:
        raise AssertionError(f"{label}: exit {result.returncode}\n{result.stderr.decode('utf-8',errors='replace')[-3000:]}")
    assert normalized(actual) == normalized(expected), (
        f"{label}\ninput: {data[:2000]!r}\nexpected: {expected[:3000]!r}\nactual: {actual[:3000]!r}"
    )


def cases():
    rng = random.Random(20261020)

    # Exact Fraction oracle: enumerate every nonempty interval; retain earliest ties.
    limit = (1 << 63) - 1
    pool_cases = [
        (10**18, 0, [(10**18, 20)]),
        (limit, -limit - 1, [(limit, limit)]),
        (limit, limit, [(limit, limit)]),
        (limit, limit, [(limit - 1, limit), (1, limit)]),
        (8*10**18, 0, [(4*10**18, limit), (4*10**18, -limit)]),
        (1, 0, [(limit, limit)]),
    ]
    pool_rng = random.Random(52220261020)
    for _ in range(200):
        pool_cases.append((pool_rng.randint(1, 40), pool_rng.randint(-30, 30),
                           [(pool_rng.randint(1, 20), pool_rng.randint(-50, 50))
                            for _ in range(pool_rng.randint(1, 8))]))
    pool_input, pool_answers = [], []
    for capacity, target, jars in pool_cases:
        best = None
        for l in range(len(jars)):
            for r in range(l, len(jars)):
                chosen = jars[l:r+1]
                volume = sum(v for v, _ in chosen)
                if not capacity <= 2*volume or volume > capacity:
                    continue
                error = abs(sum(Fraction(v*t, volume) for v, t in chosen) - target)
                if error <= 5 and (best is None or (error, l, r) < best):
                    best = (error, l, r)
        pool_input.append(f"{capacity} {target}\n{len(jars)}\n" +
                          "\n".join(f"{v} {t}" for v, t in jars))
        pool_answers.append("Not possible" if best is None else f"{best[1]} {best[2]}")
    yield "a522", str(len(pool_input))+"\n"+"\n".join(pool_input), "\n".join(pool_answers), len(pool_cases)

    # Two-decimal rendering must honor the lesson's no-negative-zero promise.
    yield "a685", "3\n0 0 1 1000 -1 0 0 -1\n0 0 1000 1 0 -1 -1 0\n0 0 1 1 0 1 1 0\n", (
        "INTERSECTING LINES OUTPUT\nPOINT 0.00 -1.00\nPOINT -1.00 0.00\nPOINT 0.50 0.50\nEND OF OUTPUT"), 3

    dictionary = ["stop", "pots", "a", "tops"]
    searches = ["post", "a", "q", "zzzz", "post"]
    anagram_output = []
    for query in searches:
        anagram_output.append("Anagrams for: " + query)
        matches = [word for word in dictionary if sorted(word) == sorted(query)]
        if not matches:
            anagram_output.append("No anagrams for: " + query)
        anagram_output += [f"{i:3}) {word}" for i, word in enumerate(matches, 1)]
    yield "a747", "1\n\n4\n"+"\n".join(dictionary+searches+["END"]), "\n".join(anagram_output), len(searches)

    # Exact arithmetic combinations by physical denomination counts, not in-place DP.
    money_values = (5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000)
    @lru_cache(None)
    def money_ways(index, remaining):
        if index == len(money_values): return int(remaining == 0)
        value = money_values[index]
        return sum(money_ways(index+1, remaining-count*value)
                   for count in range(remaining//value+1))
    money_tokens = [("0.5",50), (".5",50), ("0.50",50), ("1",100),
                    ("1.0",100), ("1.00",100), ("2.000",200)]
    money_answers = [f"{cents//100}.{cents%100:02}".rjust(6)+f"{money_ways(0,cents):17}"
                     for _,cents in money_tokens]
    yield "a796", "\n".join(token for token,_ in money_tokens)+"\n0\n", "\n".join(money_answers), len(money_tokens)
    yield "a790", "2\r\n\r\n1 1\r\n00\r\n01\r\n\r\n2 2\r\n01\r\n00\r\n", "3\n\n3", 2
    yield "a797", "1 1\r\n0 0 E\r\nR\r\n0 0 N\r\nFRF\r\n0 0 W\r\n\r\n", "0 0 S\n1 1 E\n0 0 W", 3

    # High-precision interval set cover, deliberately not endpoint-sorted greedy.
    radar_cases = [(10**9, [(0,1),(2*10**9,1)]),
                   (10**9, [(0,0),(2*10**9,0)]),
                   (limit, [(-limit,0),(limit,0)]),
                   (limit, [(-limit,1),(limit,1)]),
                   (limit, [(-limit-1,0),(limit,0)]),
                   (0, [(1,0),(1,0),(2,0)]), (-1, [(0,0)])]
    radar_rng = random.Random(77920261021)
    for _ in range(150):
        d = radar_rng.randrange(9)
        radar_cases.append((d, [(radar_rng.randrange(-10,11), radar_rng.randrange(d+2))
                               for _ in range(radar_rng.randrange(1,8))]))
    radar_input, radar_answers = [], []
    with localcontext() as context:
        context.prec = 150
        for d, islands in radar_cases:
            radar_input.append(f"{len(islands)} {d}\n"+"\n".join(f"{x} {y}" for x,y in islands))
            if d < 0 or any(abs(y)>d for _,y in islands):
                answer = -1
            else:
                intervals = []
                for x,y in islands:
                    radius = Decimal(d*d-y*y).sqrt()
                    intervals.append((Decimal(x)-radius, Decimal(x)+radius))
                coverages = [sum(1<<i for i,(left,right) in enumerate(intervals)
                                 if left <= position <= right)
                             for _,position in intervals]
                costs = {0:0}
                for coverage in coverages:
                    for state,cost in list(costs.items()):
                        union = state|coverage
                        costs[union] = min(costs.get(union,1000),cost+1)
                answer = costs[(1<<len(islands))-1]
            radar_answers.append(f"Case {len(radar_answers)+1}: {answer}")
    yield "a779", "\n".join(radar_input)+"\n0 0\n", "\n".join(radar_answers), len(radar_cases)

    # Independent payment oracle enumerates every physical subset of tiny wallets.
    coins = [1, 2, 4, 10, 20, 40]
    change = [0] + [1000]*154
    for amount in range(1, len(change)):
        change[amount] = 1 + min(change[amount-v] for v in coins if v <= amount)
    wallet_rng = random.Random(79420261020)
    wallet_input, wallet_answers = [], []
    for _ in range(100):
        counts = [wallet_rng.randrange(3) for _ in coins]
        if not any(counts): counts[0] = 1
        total = sum(c*v for c, v in zip(counts, coins))
        price = wallet_rng.randrange(1, min(99, total)+1)
        answer = min(sum(paid)+change[sum(c*v for c, v in zip(paid, coins))-price]
                     for paid in it.product(*(range(c+1) for c in counts))
                     if sum(c*v for c, v in zip(paid, coins)) >= price)
        cents = price*5
        wallet_input.append(" ".join(map(str, counts)) + f" {cents//100}.{cents%100:02}")
        wallet_answers.append(f"{answer:3}")
    for count, index, price, answer in [(60000000, 5, 40, 1), (10**100, 5, 39, 2),
                                       (10**100, 0, 99, 99), (10**100, 5, 0, 0)]:
        counts = [0]*6
        counts[index] = count
        cents = price*5
        wallet_input.append(" ".join(map(str, counts)) + f" {cents//100}.{cents%100:02}")
        wallet_answers.append(f"{answer:3}")
    wallet_input += ["+0 +0 +0 +0 +0 +0000001 2.00", "0 0 0 1 0 0 0.5", "0 0 0 1 0 0 .5"]
    wallet_answers += ["  1", "  1", "  1"]
    yield "a794", "\n".join(wallet_input)+"\n+0 +0 +0 +0 +0 +0\n", "\n".join(wallet_answers), len(wallet_input)

    huge = "1234567890"*10
    beyond_conversion_limit = "9"*5000
    yield "a828", f"(2147483648,) ()\n(000123,) ({huge},L) (7,R) ()\n(9,L) ()\n({beyond_conversion_limit},) ()\n", (
        f"2147483648\n123 {huge} 7\nnot complete\n{beyond_conversion_limit}"), 4
    sequences = [["2147483648", "2147483649"], [huge, "-"+huge, "0"],
                 ["-0002", "-2", "+0000", "-0", "+0003", "3"]]
    integer_rng = random.Random(83120261020)
    for _ in range(100):
        sequences.append([str(integer_rng.randrange(-10**30, 10**30))
                          for _ in range(integer_rng.randrange(1, 13))])
    inversion_input, inversion_answers = [], []
    for sequence in sequences:
        values = list(map(int, sequence))
        count = sum(values[i] > values[j] for i in range(len(values)) for j in range(i+1, len(values)))
        inversion_input.append(str(len(values))+"\n"+" ".join(sequence))
        inversion_answers.append(f"Minimum exchange operations : {count}")
    inversion_input += [f"2\n{beyond_conversion_limit} 1", f"2\n-{beyond_conversion_limit} -1"]
    inversion_answers += ["Minimum exchange operations : 1", "Minimum exchange operations : 0"]
    yield "a831", "\n".join(inversion_input), "\n".join(inversion_answers), len(inversion_input)
    set_pairs = [(["2147483648"], ["2147483649"]), (["+0001"], ["1"]),
                 (["-0"], ["+000"]), ([huge, "-"+huge], [huge]),
                 (["-2", "3"], ["3", "4"])]
    set_input, set_answers = [], []
    for first, second in set_pairs:
        a, b = set(map(int, first)), set(map(int, second))
        answer = ("A equals B" if a == b else "A is a proper subset of B" if a < b
                  else "B is a proper subset of A" if b < a else "A and B are disjoint"
                  if a.isdisjoint(b) else "I'm confused!")
        set_input += [" ".join(first), " ".join(second)]
        set_answers.append(answer)
    set_input += [beyond_conversion_limit, "1"+"0"*5000]
    set_answers.append("A and B are disjoint")
    yield "a836", "\n".join(set_input)+"\n", "\n".join(set_answers), len(set_answers)

    # Balanced binary strings: enumerate integers, including the leading-bit rule.
    queries = list(it.product(range(1, 13), range(0, 11))) + [(64, 1), (64, 2)]
    answers = []
    for n, k in queries:
        if n == 64:
            count = math.comb(63, 31) if k == 1 else math.comb(62, 31)
        else:
            count = sum(k > 0 and x % k == 0 and 2 * x.bit_count() == n for x in range(1 << (n - 1), 1 << n))
        answers.append(f"Case {len(answers) + 1}: {count}")
    yield "a478", str(len(queries)) + "\n" + "\n".join(f"{n} {k}" for n, k in queries), "\n".join(answers), len(queries)

    # Literal permutations, rather than the fixed-point inclusion/exclusion formula.
    queries, answers = [], []
    for n in range(1, 8):
        permutations = list(it.permutations(range(n)))
        for m in range(n + 1):
            counts = [0] * (m + 1)
            for p in permutations:
                counts[sum(p[i] == i for i in range(m))] += 1
            for k, count in enumerate(counts):
                queries.append(f"{n} {m} {k}")
                answers.append(f"Case {len(answers) + 1}: {count}")
    yield "a480", str(len(queries)) + "\n" + "\n".join(queries), "\n".join(answers), len(queries)

    queries, answers = [], []
    for n in range(1, 10):
        count = sum(sum(abs(x - i) for i, x in enumerate(p, 1)) == n * n // 2 for p in it.permutations(range(1, n + 1)))
        queries.append(str(n))
        answers.append(str(count))
    yield "a504", "\n".join(queries), "\n".join(answers), len(queries)

    # Every Boolean grid; tabulate the best grid for each possible lower bound.
    m = n = 3
    grids = []
    for mask in range(1 << (m * n)):
        rows = [sum(mask >> (r * n + c) & 1 for c in range(n)) for r in range(m)]
        cols = [sum(mask >> (r * n + c) & 1 for r in range(m)) for c in range(n)]
        grids.append((mask.bit_count(), rows + cols))
    grids.sort()
    queries, answers = [], []
    for lower in it.product(range(4), repeat=6):
        best = next(total for total, degrees in grids if all(x >= y for x, y in zip(degrees, lower)))
        queries.append("3 3\n" + " ".join(map(str, lower[:3])) + "\n" + " ".join(map(str, lower[3:])))
        answers.append(str(best))
    yield "a508", str(len(queries)) + "\n" + "\n".join(queries), "\n".join(answers), len(queries)

    # Exact rational serving costs at all demand/count breakpoints.
    queries, answers = [], []
    for _ in range(120):
        demand = [rng.randint(1, 12) for _ in range(rng.randint(1, 8))]
        a, b = rng.randint(1, 10), rng.randint(1, 10)
        candidates = {Fraction(y, count) for y in demand for count in (1, 2, 3)}
        best = None
        for size in candidates:
            servings = [math.ceil(y / size) for y in demand]
            if max(servings) > 3:
                continue
            cost = a * (size * sum(servings) - sum(demand)) + b * sum(servings)
            best = cost if best is None else min(best, cost)
        queries.append(f"{len(demand)} {a} {b}\n" + " ".join(map(str, demand)))
        answers.append(str(best.numerator) if best.denominator == 1 else f"{best.numerator} / {best.denominator}")
    yield "a513", "\n".join(queries) + "\n0\n", "\n".join(answers), len(queries)

    # Backtracking parser for the actual quotation grammar (no peeling lemma).
    def quotation_depth(runs):
        text = "a".join("'" * x for x in runs)

        @lru_cache(None)
        def quote(k, left, right):
            if right - left < 2 * k or text[left:left + k] != "'" * k or text[right - k:right] != "'" * k:
                return False
            left, right = left + k, right - k
            if k == 1:
                return "'" not in text[left:right]
            reachable = {(left, False)}
            for pos in range(left, right + 1):
                for used in (False, True):
                    if (pos, used) not in reachable:
                        continue
                    if pos < right and text[pos] != "'":
                        reachable.add((pos + 1, used))
                    for end in range(pos + 2 * (k - 1), right + 1):
                        if quote(k - 1, pos, end):
                            reachable.add((end, True))
            return (right, True) in reachable

        return max((k for k in range(1, math.isqrt(sum(runs)) + 1) if quote(k, 0, len(text))), default=0)

    runs_cases = [p for length in range(1, 5) for p in it.product(range(1, 7), repeat=length)]
    runs_cases += [tuple(rng.randint(1, 8) for _ in range(rng.randint(1, 6))) for _ in range(150)]
    runs_cases += [(22,), (5, 4, 3, 2, 1, 1, 2, 3, 4, 5)]
    answers = [str(quotation_depth(p)) for p in runs_cases]
    answers = ["no quotation" if value == "0" else value for value in answers]
    yield "a531", "\n".join(str(len(p)) + "\n" + " ".join(map(str, p)) for p in runs_cases), "\n".join(answers), len(runs_cases)

    # Enumerate all nonempty contiguous partitions; optimize the full load vector.
    queries, answers = [], []
    for _ in range(200):
        m = rng.randint(1, 9)
        k = rng.randint(1, m)
        pages = [rng.randint(1, 20) for _ in range(m)]
        options = []
        for cuts in it.combinations(range(1, m), k - 1):
            boundaries = (0,) + cuts + (m,)
            loads = tuple(sum(pages[a:b]) for a, b in zip(boundaries, boundaries[1:]))
            options.append(((max(loads), loads), cuts))
        _, cuts = min(options)
        output = []
        for i, page in enumerate(pages):
            if i in cuts:
                output.append("/")
            output.append(str(page))
        queries.append(f"{m} {k}\n" + " ".join(map(str, pages)))
        answers.append(" ".join(output))
    yield "a543", str(len(queries)) + "\n" + "\n".join(queries), "\n".join(answers), len(queries)

    # Simulate moving actual set members; include moving a DSU root repeatedly.
    queries, answers = [], []
    for _ in range(20):
        n = rng.randint(1, 20)
        groups = [{v} for v in range(1, n + 1)]
        commands = []
        for _ in range(100):
            op, p, q = rng.randint(1, 3), rng.randint(1, n), rng.randint(1, n)
            a = next(g for g in groups if p in g)
            b = next(g for g in groups if q in g)
            commands.append(f"{op} {p}" + (f" {q}" if op != 3 else ""))
            if op == 3:
                answers.append(f"{len(a)} {sum(a)}")
            elif a is not b:
                if op == 1:
                    b.update(a)
                    a.clear()
                else:
                    a.remove(p)
                    b.add(p)
        queries.append(f"{n} {len(commands)}\n" + "\n".join(commands))
    yield "a546", "\n".join(queries), "\n".join(answers), 2000

    # All index triples, deduplicating the resulting strings.
    words = ["".join(p) for size in range(1, 9) for p in it.product("AB", repeat=size)]
    words += ["".join(rng.choices("ABCDE", k=rng.randint(1, 20))) for _ in range(100)]
    answers = [str(len({"".join(s[i] for i in positions) for positions in it.combinations(range(len(s)), 3)})) for s in words]
    yield "a548", str(len(words)) + "\n" + "\n".join(words), "\n".join(answers), len(words)

    # Search every subarray, independent of the shrinking-window implementation.
    queries, answers = [], []
    for n, modulus, k in it.product(range(3, 12), range(1, 7), range(2, 8)):
        sequence = [1, 2, 3]
        while len(sequence) < n:
            sequence.append((sum(sequence[-3:]) % modulus) + 1)
        valid = [b - a for a in range(n) for b in range(a + 1, n + 1) if set(range(1, k + 1)) <= set(sequence[a:b])]
        result = str(min(valid)) if valid else "sequence nai"
        queries.append(f"{n} {modulus} {k}")
        answers.append(f"Case {len(answers) + 1}: {result}")
    yield "a559", str(len(queries)) + "\n" + "\n".join(queries), "\n".join(answers), len(queries)

    # Direct grid expansion, independently counting each red row.
    queries, answers = [], []
    cells = [[True]]
    for k in range(6):
        for a in range(1, len(cells) + 1):
            for b in range(a, len(cells) + 1):
                queries.append(f"{k} {a} {b}")
                answers.append(f"Case {len(answers) + 1}: {sum(sum(row) for row in cells[a - 1:b])}")
        size = len(cells)
        cells = [[cells[r // 2][c // 2] and not (r % 2 and c % 2) for c in range(size * 2)] for r in range(size * 2)]
    yield "a588", str(len(queries)) + "\n" + "\n".join(queries), "\n".join(answers), len(queries)

    # Enumerate travel orders; passing an uncollected treasure collects it too.
    queries, answers = [], []
    for _ in range(140):
        n = rng.randint(1, 7)
        x = sorted(rng.sample(range(30), n))
        deadlines = [rng.randint(0, 45) for _ in x]
        best = None
        for path in it.permutations(range(n)):
            current, elapsed, visited = path[0], 0, {path[0]}
            ok = deadlines[current] > 0
            for goal in path[1:]:
                for v in range(min(current, goal), max(current, goal) + 1):
                    if v not in visited:
                        ok &= elapsed + abs(x[v] - x[current]) < deadlines[v]
                        visited.add(v)
                elapsed += abs(x[current] - x[goal])
                current = goal
                if not ok:
                    break
            if ok:
                best = elapsed if best is None else min(best, elapsed)
        queries.append(str(n) + "\n" + "\n".join(f"{p} {d}" for p, d in zip(x, deadlines)))
        answers.append("No solution" if best is None else str(best))
    # Missing numeric ceilings must not turn an unreachable marker into a route.
    queries += [
        "4\n0 8000000000000000000\n1000000000000000000 1\n2000000000000000000 1\n3000000000000000000 8000000000000000000",
        "3\n0 9000000000000000000\n2000000000000000000 1\n5000000000000000000 9000000000000000000",
        "2\n-9223372036854775807 9000000000000000000\n9223372036854775807 9000000000000000000",
    ]
    answers += ["No solution", "7000000000000000000", "No solution"]
    yield "a595", "\n".join(queries), "\n".join(answers), len(queries)

    # BFS over both interval endpoints; A before M establishes the lexical tie.
    queries, answers = [], []
    for _ in range(500):
        a, m, p = rng.randint(1, 5), rng.randint(1, 5), rng.randint(1, 8)
        q, r, s = rng.randint(p, 10), rng.randint(1, 60), rng.randint(60, 100)
        queue = deque([(p, q, "")])
        seen = {(p, q)}
        answer = None
        while queue:
            lo, hi, path = queue.popleft()
            if lo >= r and hi <= s:
                answer = path
                break
            for x, y, ch in ((lo + a, hi + a, "A"), (lo * m, hi * m, "M")):
                if y <= s and (x, y) not in seen:
                    seen.add((x, y))
                    queue.append((x, y, path + ch))
        if answer is None:
            result = "impossible"
        elif not answer:
            result = "empty"
        else:
            result = " ".join(str(len(list(group))) + ch for ch, group in it.groupby(answer))
        queries.append(f"{a} {m} {p} {q} {r} {s}")
        answers.append(f"Case {len(answers) + 1}: {result}")
    yield "a598", "\n".join(queries) + "\n0 0 0 0 0 0\n", "\n".join(answers), len(queries)

    # Subsets for the prescribed cardinality, including negative sums.
    queries, answers = [], []
    for _ in range(150):
        n, m = rng.randint(1, 5), rng.randint(1, 5)
        values = [rng.randint(-50, 50) for _ in range(n + m)]
        total = sum(values)
        products = [sum(group) * (total - sum(group)) for group in it.combinations(values, n)]
        queries.append(f"{n} {m}\n" + " ".join(map(str, values)))
        answers.append(f"{max(products)} {min(products)}")
    yield "a609", "\n".join(queries), "\n".join(answers), len(queries)

    # Literal quadruples with four different indices.
    queries, answers = [], []
    for _ in range(180):
        values = rng.sample(range(-25, 26), rng.randint(1, 12))
        solutions = [d for a, b, c, d in it.permutations(values, 4) if a + b + c == d]
        queries.append(str(len(values)) + "\n" + " ".join(map(str, values)))
        answers.append(str(max(solutions)) if solutions else "no solution")
    yield "a629", "\n".join(queries) + "\n0\n", "\n".join(answers), len(queries)

    # Small four-pole Hanoi BFS over legal configurations, rather than the formula.
    answers = []
    for n in range(8):
        start, goal = (0,) * n, (3,) * n
        distances = {start: 0}
        queue = deque([start])
        while queue and goal not in distances:
            state = queue.popleft()
            tops = [next((i for i, pole in enumerate(state) if pole == p), n) for p in range(4)]
            for source, disk in enumerate(tops):
                if disk == n:
                    continue
                for target in range(4):
                    if target != source and disk < tops[target]:
                        child = list(state)
                        child[disk] = target
                        child = tuple(child)
                        if child not in distances:
                            distances[child] = distances[state] + 1
                            queue.append(child)
        answers.append(str(distances[goal]))
    yield "a644", "\n".join(map(str, range(8))), "\n".join(answers), 8

    # Fill the first empty cell of a bitboard; no skyline/profile assumption.
    queries, answers = [], []
    for width, height in it.product(range(1, 5), repeat=2):
        for dominoes in range(width * height // 2 + 1):
            singles = width * height - 2 * dominoes

            @lru_cache(None)
            def tile(board, single, domino):
                if board == (1 << (width * height)) - 1:
                    return int(single == domino == 0)
                first = next(i for i in range(width * height) if not (board >> i & 1))
                row, col = divmod(first, width)
                count = tile(board | (1 << first), single - 1, domino) if single else 0
                if domino:
                    for r, c in ((row + 1, col), (row, col + 1)):
                        pos = r * width + c
                        if r < height and c < width and not (board >> pos & 1):
                            count += tile(board | (1 << first) | (1 << pos), single, domino - 1)
                return count

            count = tile(0, singles, dominoes)
            if count == 0:  # The public statement guarantees tileability.
                continue
            groups = ([f"{singles} 1 1"] if singles else []) + ([f"{dominoes} 1 2"] if dominoes else [])
            queries.append(f"{width} {height} {len(groups)}\n" + "\n".join(groups))
            answers.append(str(count))
    # Identical dimensions in separate input groups remain indistinguishable.
    queries.append("2 2 2\n1 1 2\n1 2 1")
    answers.append("2")
    yield "a738", "\n".join(queries), "\n".join(answers), len(queries)

    # All complete Euler tours; compare the whole edge-label sequence.
    queries, answers = [], []
    for _ in range(100):
        n = rng.randint(1, 5)
        walk = [rng.randrange(n) for _ in range(rng.randint(1, 7))]
        walk.append(walk[0])
        endpoints = list(zip(walk, walk[1:]))
        rng.shuffle(endpoints)
        labels = rng.sample(range(1, 100), len(endpoints))
        edges = [(a + 1, b + 1, z) for (a, b), z in zip(endpoints, labels)]
        start = min(edges[0][:2])

        def tours(u, remaining, path):
            if not remaining:
                return [path] if u == start else []
            out = []
            for i in remaining:
                a, b, z = edges[i]
                if a == u or b == u:
                    out.extend(tours(b if a == u else a, remaining - {i}, path + (z,)))
            return out

        best = min(tours(start, set(range(len(edges))), ()))
        queries.append("\n".join(f"{a} {b} {z}" for a, b, z in edges) + "\n0 0")
        answers.append(" ".join(map(str, best)))
    queries.append("1 2 1\n0 0")
    answers.append("Round trip does not exist.")
    yield "a815", "\n".join(queries) + "\n0 0\n", "\n\n".join(answers), len(queries)

    # Explicit edit distance of every substring, then enumerate cut positions.
    def edit(a, b):
        row = list(range(len(b) + 1))
        for i, x in enumerate(a, 1):
            nxt = [i]
            for j, y in enumerate(b, 1):
                nxt.append(min(row[j] + 1, nxt[-1] + 1, row[j - 1] + (x != y)))
            row = nxt
        return row[-1]

    queries, answers = [], []
    for _ in range(200):
        x = "".join(rng.choices("ab", k=rng.randint(1, 9)))
        y = "".join(rng.choices("ab", k=rng.randint(1, 5)))
        best = len(y)
        for mask in range(1 << (len(x) - 1)):
            cuts = [0] + [i + 1 for i in range(len(x) - 1) if mask >> i & 1] + [len(x)]
            best = min(best, max(edit(x[a:b], y) for a, b in zip(cuts, cuts[1:])))
        queries.append(y + "\n" + x)
        answers.append(str(best))
    yield "a766", str(len(queries)) + "\n" + "\n".join(queries), "\n".join(answers), len(queries)

    # Non-English symbols are separators, including Unicode case-fold surprises.
    text = "Cat, cat2DOG! don't\nA\nB \u212aelvin \u0130ce caf\u00e9 last"
    words, word = set(), ""
    for value in text.encode("utf-8") + b"\n":
        if 65 <= value <= 90 or 97 <= value <= 122:
            word += chr(value).lower()
        elif word:
            words.add(word)
            word = ""
    yield "a824", text, "\n".join(sorted(words)), 1


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--cxx")
    parser.add_argument("--compile-only-cxx", action="store_true")
    options = parser.parse_args()
    lessons = {lesson["code"]: lesson for lesson in json.load(sys.stdin)}
    suites = [case for case in cases() if case[0] in lessons]
    assert suites, "No oracle suites selected"
    python_only = 0
    workspace = tempfile.TemporaryDirectory(prefix="cpe-tutorial-audit-", dir=pathlib.Path.cwd()) if options.cxx else nullcontext(None)
    with workspace as folder:
        root = pathlib.Path(folder) if folder else None
        for code, data, expected, count in suites:
            lesson = lessons[code]
            check_program([sys.executable, "-X", "utf8", "-c", lesson["python"]], data, expected, f"{code} Python")
            if code == "a595":
                # Python promises exact integer input, not a fabricated 10**60 ceiling.
                d = 10**80
                giant = f"4\n0 {8*d}\n{d} 1\n{2*d} 1\n{3*d} {8*d}\n"
                check_program([sys.executable, "-X", "utf8", "-c", lesson["python"]],
                              giant, "No solution", "a595 arbitrary-size Python sentinel")
                python_only += 1
            status = "Python executed"
            if options.cxx:
                source = root / f"{code}.cpp"
                executable = root / (code + (".exe" if sys.platform == "win32" else ""))
                source.write_text(lesson["cpp"], encoding="utf-8")
                result = subprocess.run([options.cxx, "-std=c++17", "-O2", str(source), "-o", str(executable)], capture_output=True, text=True, timeout=180)
                assert result.returncode == 0, f"{code}: {result.stderr}"
                status += ", C++ compiled"
                if not options.compile_only_cxx:
                    check_program([str(executable)], data, expected, f"{code} C++")
                    status += " and executed"
            print(f"{code}: {count} independent oracle cases passed ({status}).", flush=True)
    print(f"Passed {len(suites)} suites / {sum(case[3] for case in suites)} cases. No claim about untested lessons or judge AC.", flush=True)
    if python_only:
        print(f"Additionally passed {python_only} Python-only arbitrary-size integer case (outside C++ input range).", flush=True)


if __name__ == "__main__":
    main()
