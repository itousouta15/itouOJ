import { makeRng } from "./competition-tests-common.mjs";

const numbers = (input) => input.trim().split(/\s+/).map(Number);

class MinHeap {
  constructor(compare = (a, b) => a - b) { this.items = []; this.compare = compare; }
  get size() { return this.items.length; }
  push(value) {
    const a = this.items;
    let i = a.length;
    a.push(value);
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (this.compare(a[p], value) <= 0) break;
      a[i] = a[p]; i = p;
    }
    a[i] = value;
  }
  pop() {
    const a = this.items, first = a[0], last = a.pop();
    if (a.length) {
      let i = 0;
      while (i * 2 + 1 < a.length) {
        let child = i * 2 + 1;
        if (child + 1 < a.length && this.compare(a[child + 1], a[child]) < 0) child++;
        if (this.compare(last, a[child]) <= 0) break;
        a[i] = a[child]; i = child;
      }
      a[i] = last;
    }
    return first;
  }
}

export function solveRectangle(input) {
  const a = numbers(input), n = a[0], m = a[1], stride = m + 1;
  const prefix = new Float64Array((n + 1) * stride);
  let at = 2;
  for (let r = 1; r <= n; r++) for (let c = 1; c <= m; c++) {
    const p = r * stride + c;
    prefix[p] = a[at++] + prefix[p - 1] + prefix[p - stride] - prefix[p - stride - 1];
  }
  const q = a[at++], output = [];
  for (let i = 0; i < q; i++) {
    const r1 = a[at++], c1 = a[at++], r2 = a[at++], c2 = a[at++];
    output.push(String(prefix[r2 * stride + c2] - prefix[(r1 - 1) * stride + c2] -
      prefix[r2 * stride + c1 - 1] + prefix[(r1 - 1) * stride + c1 - 1]));
  }
  return output.join("\n");
}

export function solveCapacity(input) {
  const [, k, ...weights] = numbers(input);
  let lo = 0, hi = 0;
  for (const w of weights) { lo = Math.max(lo, w); hi += w; }
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    let trips = 1, load = 0;
    for (const w of weights) {
      if (load + w > mid) { trips++; load = 0; }
      load += w;
    }
    if (trips <= k) hi = mid;
    else lo = mid + 1;
  }
  return String(lo);
}

export function solvePrerequisites(input) {
  const a = numbers(input), n = a[0], m = a[1];
  const edges = Array.from({ length: n + 1 }, () => []), degree = new Int32Array(n + 1);
  for (let i = 0; i < m; i++) {
    const u = a[2 + 2 * i], v = a[3 + 2 * i];
    edges[u].push(v); degree[v]++;
  }
  const available = new MinHeap(), result = [];
  for (let i = 1; i <= n; i++) if (!degree[i]) available.push(i);
  while (available.size) {
    const u = available.pop(); result.push(u);
    for (const v of edges[u]) if (--degree[v] === 0) available.push(v);
  }
  return result.length === n ? result.join(" ") : "-1";
}

export function solveRoute(input) {
  const a = numbers(input), [n, m, start, target] = a;
  const edges = Array.from({ length: n + 1 }, () => []);
  for (let i = 0; i < m; i++) edges[a[4 + 3 * i]].push([a[5 + 3 * i], a[6 + 3 * i]]);
  const dist = Array(n + 1).fill(Infinity), heap = new MinHeap((x, y) => x[0] - y[0]);
  dist[start] = 0; heap.push([0, start]);
  while (heap.size) {
    const [cost, u] = heap.pop();
    if (cost !== dist[u]) continue;
    if (u === target) return String(cost);
    for (const [v, w] of edges[u]) if (cost + w < dist[v]) {
      dist[v] = cost + w;
      heap.push([dist[v], v]);
    }
  }
  return "-1";
}

export function solveAscent(input) {
  const a = numbers(input), tails = [];
  for (let i = 1; i <= a[0]; i++) {
    let lo = 0, hi = tails.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (tails[mid] < a[i]) lo = mid + 1;
      else hi = mid;
    }
    tails[lo] = a[i];
  }
  return String(tails.length);
}

export function solveEquipment(input) {
  const a = numbers(input), [n, capacity] = a, dp = new Float64Array(capacity + 1);
  for (let i = 0; i < n; i++) {
    const w = a[2 + 2 * i], v = a[3 + 2 * i];
    for (let c = capacity; c >= w; c--) dp[c] = Math.max(dp[c], dp[c - w] + v);
  }
  return String(dp[capacity]);
}

export const solvers = {
  rectangle: solveRectangle, capacity: solveCapacity, prerequisites: solvePrerequisites,
  route: solveRoute, ascent: solveAscent, equipment: solveEquipment,
};

const rectangle = (grid, queries) => [String(grid.length) + " " + grid[0].length,
  ...grid.map((row) => row.join(" ")), String(queries.length), ...queries.map((q) => q.join(" "))].join("\n");
const capacity = (weights, k) => `${weights.length} ${k}\n${weights.join(" ")}`;
const graph = (n, edges) => [`${n} ${edges.length}`, ...edges.map((e) => e.join(" "))].join("\n");
const route = (n, s, t, edges) => [`${n} ${edges.length} ${s} ${t}`, ...edges.map((e) => e.join(" "))].join("\n");
const ascent = (values) => `${values.length}\n${values.join(" ")}`;
const equipment = (items, c) => [`${items.length} ${c}`, ...items.map((item) => item.join(" "))].join("\n");

export function hiddenInputs(key) {
  const rng = makeRng(20261103);
  switch (key) {
    case "rectangle": return [
      rectangle([[1000000]], [[1, 1, 1, 1]]),
      rectangle([[0, -7, 9], [2, 5, -3]], [[1, 2, 2, 3], [2, 1, 2, 2], [1, 1, 2, 3]]),
      rectangle(Array.from({ length: 20 }, () => Array.from({ length: 22 }, () => rng.int(-100, 100))),
        Array.from({ length: 100 }, () => { const r = rng.int(1, 20), c = rng.int(1, 22); return [r, c, rng.int(r, 20), rng.int(c, 22)]; })),
      rectangle(Array.from({ length: 400 }, () => Array(400).fill(1000000)), [[1, 1, 400, 400], [100, 100, 200, 200]]),
    ];
    case "capacity": return [
      capacity([1], 1), capacity([1, 9, 1, 9, 1], 5),
      capacity([1000000000, 1000000000, 1000000000], 1),
      capacity(Array.from({ length: 65 }, () => rng.int(1, 1000)), 8),
      capacity(Array(100000).fill(1000000000), 2),
      capacity(Array(200000).fill(1), 2),
    ];
    case "prerequisites": return [
      graph(1, []), graph(3, [[1, 2], [1, 2], [2, 3]]),
      graph(5, [[4, 2], [4, 3], [1, 3], [2, 5]]),
      graph(6, [[2, 3], [3, 2], [4, 5]]),
      graph(100000, Array.from({ length: 99999 }, (_, i) => [i + 1, i + 2])),
    ];
    case "route": return [
      route(1, 1, 1, []), route(3, 1, 3, [[1, 2, 10], [1, 2, 2], [2, 3, 3]]),
      route(4, 2, 4, [[1, 4, 1], [2, 3, 1], [3, 2, 1]]),
      route(15, 1, 15, Array.from({ length: 45 }, () => [rng.int(1, 15), rng.int(1, 15), rng.int(1, 100)])),
      route(50000, 1, 50000, Array.from({ length: 49999 }, (_, i) => [i + 1, i + 2, 1000000])),
    ];
    case "ascent": return [
      ascent([-1000000000]), ascent([5, 4, 3, 2, 1]),
      ascent([1, 2, 2, 3, -1, 0, 4]),
      ascent(Array.from({ length: 250 }, () => rng.int(-1000, 1000))),
      ascent(Array.from({ length: 200000 }, (_, i) => i % 2 ? 1000000000 - i : i)),
    ];
    case "equipment": return [
      equipment([[1, 0]], 0), equipment([[1, 10], [1, 10], [3, 100]], 2),
      equipment([[10, 100], [2, 1], [3, 6]], 5),
      equipment(Array.from({ length: 50 }, () => [rng.int(1, 100), rng.int(0, 500)]), 1000),
      equipment(Array.from({ length: 200 }, () => [rng.int(1, 10000), rng.int(0, 1000000)]), 10000),
    ];
    default: throw new Error(`Unknown practice problem: ${key}`);
  }
}
