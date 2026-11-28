"""Deterministic independent oracles for actual a353-a355 Python lesson code.

No network, production database, judge submissions, or native binary execution.
The JSON programs on stdin come from the TypeScript lesson module, not copies.
"""
from collections import deque
import contextlib
from functools import lru_cache
import io
import itertools
import json
import random
import sys
import time

programs = {
    lesson['code']: compile(lesson['python'], lesson['code'] + '.py', 'exec')
    for lesson in json.load(sys.stdin)
}


def execute(code, text):
    original = sys.stdin
    output = io.StringIO()
    sys.stdin = io.TextIOWrapper(io.BytesIO(text.encode()), encoding='utf-8')
    try:
        with contextlib.redirect_stdout(output):
            exec(programs[code], {'__name__': '__main__'})
    finally:
        sys.stdin.close()
        sys.stdin = original
    return output.getvalue().strip()


def check_grid(grid):
    n = len(grid)
    expected = 0
    for row, col in itertools.product(range(n), repeat=2):
        if grid[row][col] != 0:
            continue
        queue = deque([(row, col, 0)])
        seen = {(row, col)}
        found = None
        while queue:
            r, c, distance = queue.popleft()
            if grid[r][c] == 1:
                found = distance
                break
            for dr, dc in ((-1, 0), (1, 0), (0, -1), (0, 1)):
                nr, nc = r + dr, c + dc
                if (0 <= nr < n and 0 <= nc < n and
                        grid[nr][nc] != -1 and (nr, nc) not in seen):
                    seen.add((nr, nc))
                    queue.append((nr, nc, distance + 1))
        if found is None:
            return False  # Outside the problem's reachable-empty-cell guarantee.
        expected = max(expected, found)
    if not any(0 in row for row in grid):
        return False
    data = str(n) + '\n' + '\n'.join(' '.join(map(str, row)) for row in grid)
    assert execute('a353', data) == str(expected), (grid, expected)
    return True


rng = random.Random(353355)
grid_count = 0
for cells in itertools.product((-1, 0, 1), repeat=4):
    grid_count += check_grid([list(cells[:2]), list(cells[2:])])
for _ in range(350):
    n = rng.randrange(2, 6)
    grid_count += check_grid([[rng.choice((-1, 0, 0, 1)) for _ in range(n)] for _ in range(n)])


@lru_cache(None)
def leaf_paths(n):
    """Enumerate all binary-tree shapes as root-to-leaf preorder-index masks."""
    if n == 0:
        return ((),)
    if n == 1:
        return ((1,),)
    result = set()
    for left_size in range(n):
        right_size = n - 1 - left_size
        for left, right in itertools.product(leaf_paths(left_size), leaf_paths(right_size)):
            paths = tuple((mask << 1) | 1 for mask in left)
            paths += tuple((mask << (left_size + 1)) | 1 for mask in right)
            result.add(paths)
    return tuple(result)


def brute_tree(weights):
    return min(
        max(sum(weight for i, weight in enumerate(weights) if (path >> i) & 1)
            for path in paths)
        for paths in leaf_paths(len(weights))
    )


tree_count = 0
for n in range(1, 7):
    for weights in itertools.product(range(3), repeat=n):
        data = str(n) + '\n' + ' '.join(map(str, weights))
        assert execute('a354', data) == f'{brute_tree(weights)} {sum(weights)}', weights
        tree_count += 1
for _ in range(150):
    n = rng.randrange(1, 9)
    weights = [rng.randrange(10**9 + 1) for _ in range(n)]
    data = str(n) + '\n' + ' '.join(map(str, weights))
    assert execute('a354', data) == f'{brute_tree(weights)} {sum(weights)}', weights
    tree_count += 1


def check_graph(n, edges):
    graph = [[] for _ in range(n)]
    for start, end in edges:
        graph[start].append(end)
    expected = []
    for start in range(n):
        seen = {start}
        queue = deque([start])
        while queue:
            for neighbor in graph[queue.popleft()]:
                if neighbor not in seen:
                    seen.add(neighbor)
                    queue.append(neighbor)
        expected.extend('YES' if end in seen else 'NO' for end in range(n))
    lines = [f'{n} {len(edges)} {n*n}']
    lines += [f'{start} {end}' for start, end in edges]
    lines += [f'{start} {end}' for start in range(n) for end in range(n)]
    assert execute('a355', '\n'.join(lines)).splitlines() == expected, (n, edges)


graph_count = 0
for n in range(2, 5):
    possible = [(a, b) for a in range(n) for b in range(n) if a != b]
    for mask in range(1, 1 << len(possible)):
        edges = [edge for i, edge in enumerate(possible) if (mask >> i) & 1]
        check_graph(n, edges)
        graph_count += 1

# Constraint-sized cases exercise compact distances, maximum queue size,
# 64-bit totals, zeros, and reachability masks above bit positions 63/127.
n = 1000
for first, other, expected in [('1 ' + '0 '*(n-1), '0 '*n, 2*n-2),
                                ('0 ' + '1 '*(n-1), '1 '*n, 1)]:
    data = str(n) + '\n' + first + '\n' + (other + '\n')*(n-1)
    assert execute('a353', data) == str(expected)
for weights, expected in [([0]*1000, '0 0'), ([10**9]*1000, '10000000000 1000000000000')]:
    started = time.perf_counter()
    assert execute('a354', '1000\n' + ' '.join(map(str, weights))) == expected
    print('a354 N=1000 passed in', round(time.perf_counter()-started, 3), 'seconds', flush=True)
n = 200
edges = [(a, a+1) for a in range(n-1)]
queries = [(rng.randrange(n), rng.randrange(n)) for _ in range(20000)]
lines = [f'{n} {len(edges)} {len(queries)}']
lines += [f'{a} {b}' for a, b in edges + queries]
expected = ['YES' if a <= b else 'NO' for a, b in queries]
assert execute('a355', '\n'.join(lines)).splitlines() == expected
print(f'Independent oracles passed: {grid_count} grids, {tree_count} weighted-tree inputs, '
      f'{graph_count} directed graphs; five constraint-sized cases.', flush=True)
