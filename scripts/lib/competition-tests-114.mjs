// Exhaustive small-instance oracles for the national contest's nine tasks. The
// hard tasks intentionally use small inputs, where exhaustive search is exact.
import { makeRng } from "./competition-tests-common.mjs";

function brackets(input) {
  const seq = input.trim().split(/\s+/)[1];
  let open = 0, deleted = 0;
  for (const ch of seq) if (ch === "(") open++;
  else if (open) open--;
  else deleted++;
  return String(deleted + open);
}

function postOffice(input) {
  const data = input.trim().split(/\s+/).map(Number), n = data[0], k = data[1];
  const towns = Array.from({ length: n }, (_, i) => [data[2 + i * 2], data[3 + i * 2]]);
  let answer = Infinity;
  const chosen = [];
  const search = (from) => {
    if (chosen.length === k) {
      const worst = Math.max(...towns.map(([x, s]) => chosen.map((j) => Math.abs(x - towns[j][0])).sort((a, b) => a - b)[s]));
      answer = Math.min(answer, worst);
      return;
    }
    for (let i = from; i <= n - (k - chosen.length); i++) { chosen.push(i); search(i + 1); chosen.pop(); }
  };
  search(0);
  return String(answer);
}

function ev(input) {
  const a = input.trim().split(/\s+/).map(Number);
  const [n, m, s, t, capacity, initial] = a;
  const edges = Array.from({ length: n + 1 }, () => []);
  let at = 6;
  for (let i = 0; i < m; i++) edges[a[at++]].push([a[at++], a[at++]]);
  const stations = new Set(a.slice(at + 1, at + 1 + a[at]));
  const distance = Array.from({ length: 2 }, () => Array.from({ length: n + 1 }, () => Array(capacity + 1).fill(Infinity)));
  const visited = Array.from({ length: 2 }, () => Array.from({ length: n + 1 }, () => Array(capacity + 1).fill(false)));
  distance[0][s][initial] = 0;
  for (let step = 0; step < 2 * n * (capacity + 1); step++) {
    let best = Infinity, state = null;
    for (let used = 0; used < 2; used++) for (let node = 1; node <= n; node++) for (let battery = 0; battery <= capacity; battery++) {
      if (!visited[used][node][battery] && distance[used][node][battery] < best) {
        best = distance[used][node][battery]; state = [used, node, battery];
      }
    }
    if (!state) break;
    const [used, node, battery] = state;
    if (node === t) return String(best);
    visited[used][node][battery] = true;
    for (const [to, weight] of edges[node]) {
      const nextBattery = weight >= 0 ? Math.min(capacity, battery + weight) : battery + weight;
      if (nextBattery >= 0) distance[used][to][nextBattery] = Math.min(distance[used][to][nextBattery], best);
    }
    if (!used && stations.has(node)) for (let extra = 1; battery + extra <= capacity; extra++) {
      distance[1][node][battery + extra] = Math.min(distance[1][node][battery + extra], best + extra);
    }
  }
  return "-1";
}

function chomp(input) {
  const values = input.trim().split(/\s+/).map(Number), count = values[0], answers = [];
  const memo = new Map();
  function moves(p, q, r) {
    const result = [];
    for (let row = 1; row <= 3; row++) {
      const width = row === 1 ? p + q + r : row === 2 ? p + q : p;
      for (let col = 1; col <= width; col++) {
        if (row === 1 && col === 1) continue; // The poisoned chocolate loses immediately.
        const before = col - 1, np = Math.min(p, before);
        const nq = Math.min(q, Math.max(0, before - p));
        let next;
        if (row === 1) next = [np, nq, Math.min(r, Math.max(0, before - p - q))];
        else if (row === 2) next = [np, nq, r + p - np + q - nq];
        else next = [before, q + p - before, r];
        result.push([row, col, next]);
      }
    }
    return result;
  }
  function winning(p, q, r) {
    const key = `${p},${q},${r}`;
    if (memo.has(key)) return memo.get(key);
    const good = moves(p, q, r).some(([, , next]) => !winning(...next));
    memo.set(key, good);
    return good;
  }
  for (let i = 0; i < count; i++) {
    const [n, p, q, r] = values.slice(1 + 4 * i, 5 + 4 * i);
    if (p + q + r > n) throw new Error("Invalid Chomp shape");
    const winningMoves = moves(p, q, r).filter(([, , next]) => !winning(...next));
    answers.push(String(winningMoves.length));
    if (winningMoves.length) answers.push(winningMoves.map(([row, col]) => `${row} ${col}`).join(" "));
  }
  return answers.join("\n");
}

function decode(input) {
  const numbers = input.trim().split(/\s+/).map(BigInt), n = numbers[0], keys = numbers.slice(2);
  const gcd = (a, b) => b === 0n ? a : gcd(b, a % b);
  const count = (limit) => {
    let total = 0n;
    for (let subset = 1; subset < 1 << keys.length; subset++) {
      let lcm = 1n, parity = 0;
      for (let j = 0; j < keys.length; j++) if (subset & (1 << j)) {
        lcm = lcm / gcd(lcm, keys[j]) * keys[j]; parity++;
      }
      total += (parity % 2 ? 1n : -1n) * (limit / lcm);
    }
    return total;
  };
  let low = 0n, high = 1000000000000000000n;
  while (low + 1n < high) {
    const middle = (low + high) / 2n;
    if (count(middle) >= n) high = middle;
    else low = middle;
  }
  return String(high);
}

function dataCenter(input) {
  const a = input.trim().split(/\s+/).map(Number), [n, m, d] = a;
  const edges = Array.from({ length: m }, (_, i) => a.slice(3 + 5 * i, 8 + 5 * i));
  const result = [];
  for (let time = 0; time < d; time++) {
    const parent = Array.from({ length: n + 1 }, (_, i) => i);
    function root(x) { while (parent[x] !== x) x = parent[x] = parent[parent[x]]; return x; }
    let parts = n, weight = 0;
    for (const [u, v, cost, from, to] of [...edges].sort((x, y) => x[2] - y[2])) {
      if (time < from || time >= to) continue;
      const a = root(u), b = root(v);
      if (a !== b) { parent[a] = b; parts--; weight += cost; }
    }
    result.push(parts === 1 ? weight : -1);
  }
  return result.join(" ");
}

function connections(input) {
  const a = input.trim().split(/\s+/).map(Number), [n, k] = a;
  const points = Array.from({ length: n }, (_, i) => [a[2 + 2 * i], a[3 + 2 * i]]);
  const edges = [];
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
    edges.push([i, j, Math.hypot(points[i][0] - points[j][0], points[i][1] - points[j][1])]);
  }
  edges.sort((x, y) => x[2] - y[2]);
  function intersects(first, second) {
    const [a, b] = [points[first[0]], points[first[1]]];
    const [c, d] = [points[second[0]], points[second[1]]];
    const orient = (p, q, r) => (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]);
    const on = (p, q, r) => Math.min(p[0], r[0]) <= q[0] && q[0] <= Math.max(p[0], r[0]) &&
      Math.min(p[1], r[1]) <= q[1] && q[1] <= Math.max(p[1], r[1]);
    const abC = orient(a, b, c), abD = orient(a, b, d), cdA = orient(c, d, a), cdB = orient(c, d, b);
    if (abC === 0 && on(a, c, b) || abD === 0 && on(a, d, b) ||
        cdA === 0 && on(c, a, d) || cdB === 0 && on(c, b, d)) return true;
    return (abC > 0) !== (abD > 0) && (cdA > 0) !== (cdB > 0);
  }
  let best = Infinity;
  const selected = [], used = new Set();
  function choose(from, sum) {
    if (selected.length === k) { best = Math.min(best, sum); return; }
    if (sum >= best) return;
    for (let i = from; i < edges.length; i++) {
      const edge = edges[i];
      if (used.has(edge[0]) || used.has(edge[1]) || selected.some((prev) => intersects(prev, edge))) continue;
      selected.push(edge); used.add(edge[0]); used.add(edge[1]);
      choose(i + 1, sum + edge[2]);
      selected.pop(); used.delete(edge[0]); used.delete(edge[1]);
    }
  }
  choose(0, 0);
  return best.toFixed(10);
}

function diameter(input) {
  const lines = input.trim().split(/\s+/);
  let at = 0;
  function graph() {
    const n = Number(lines[at++]), rows = lines.slice(at, at + n); at += n;
    let diameter = 0;
    for (let start = 0; start < n; start++) {
      const distance = Array(n).fill(-1), queue = [start]; distance[start] = 0;
      for (let i = 0; i < queue.length; i++) for (let v = 0; v < n; v++) {
        const u = queue[i];
        if (rows[u][v] === "1" && distance[v] < 0) { distance[v] = distance[u] + 1; queue.push(v); }
      }
      if (distance.includes(-1)) return -1;
      diameter = Math.max(diameter, ...distance);
    }
    return diameter;
  }
  const g = graph(), h = graph();
  return String(g < 0 || h < 0 ? -1 : (g + h) % 1000000007);
}

function parade(input) {
  const a = input.trim().split(/\s+/).map(Number), [n, k] = a;
  const members = Array.from({ length: n }, (_, i) => [a[2 + i * 2], a[3 + i * 2]]);
  const diversity = Array.from({ length: n }, () => Array(n + 1).fill(0));
  for (let left = 0; left < n; left++) for (let right = left + 1; right <= n; right++) {
    const ranges = members.slice(left, right).sort((x, y) => x[0] - y[0]);
    let lo = ranges[0][0], hi = ranges[0][1], count = 0;
    for (let i = 1; i < ranges.length; i++) {
      if (ranges[i][0] > hi + 1) { count += hi - lo + 1; [lo, hi] = ranges[i]; }
      else hi = Math.max(hi, ranges[i][1]);
    }
    diversity[left][right] = count + hi - lo + 1;
  }
  const dp = Array.from({ length: k + 1 }, () => Array(n + 1).fill(-Infinity));
  dp[0][0] = 0;
  for (let groups = 1; groups <= k; groups++) for (let end = groups; end <= n; end++) {
    for (let start = groups - 1; start < end; start++) dp[groups][end] = Math.max(dp[groups][end], dp[groups - 1][start] + diversity[start][end]);
  }
  return Array.from({ length: k }, (_, i) => dp[i + 1][n]).join(" ");
}

const rng = makeRng(114);
const postInput = (k, towns) => [`${towns.length} ${k}`, ...towns.map((r) => r.join(" "))].join("\n");
const evInput = (n, s, t, capacity, battery, edges, stations) => [
  `${n} ${edges.length} ${s} ${t}`, `${capacity} ${battery}`, ...edges.map((e) => e.join(" ")),
  [stations.length, ...stations].join(" "),
].join("\n");
const centerInput = (n, d, edges) => [`${n} ${edges.length} ${d}`, ...edges.map((e) => e.join(" "))].join("\n");
const connectionInput = (k, points) => [`${points.length} ${k}`, ...points.map((p) => p.join(" "))].join("\n");
const diameterInput = (g, h) => [g.length, ...g, h.length, ...h].join("\n");
const paradeInput = (k, colors) => [`${colors.length} ${k}`, ...colors.map((r) => r.join(" "))].join("\n");

export const problems114 = [
  { solve: brackets, inputs: [
    "1\n(", "1\n)", "8\n))))((((",
    `100000\n${")".repeat(20000)}${"(".repeat(30000)}${")".repeat(50000)}`,
    `100000\n${"()".repeat(50000)}`,
  ] },
  { solve: postOffice, inputs: [
    postInput(1, [[1, 0], [1000000000, 0]]),
    postInput(3, [[1, 2], [4, 1], [10, 0], [17, 1], [30, 2]]),
    postInput(4, [[10, 3], [100, 0], [11, 2], [15, 1]]),
    postInput(4, Array.from({ length: 10 }, (_, i) => [i * 5 + 1, rng.int(0, 3)])),
  ], explicit: [{
    input: postInput(1, Array.from({ length: 20000 }, (_, i) => [i + 1, 0])), output: "10000",
  }] },
  { solve: ev, inputs: [
    evInput(2, 1, 2, 10, 0, [[1, 2, -5]], []),
    evInput(2, 1, 2, 10, 0, [[1, 2, -5]], [1]),
    evInput(4, 1, 4, 10, 1, [[1, 2, 9], [2, 3, -6], [3, 4, -6], [2, 4, -10]], [3]),
    evInput(3, 1, 3, 5, 0, [[1, 2, 20], [2, 3, -6]], [2]),
    evInput(4, 1, 4, 20, 8, [[1, 2, -8], [1, 3, -3], [2, 4, -15], [3, 4, -9]], [2, 3]),
  ], explicit: [{
    input: evInput(2, 1, 2, 1000000000, 0, [[1, 2, -1000000000]], [1]), output: "1000000000",
  }] },
  { solve: chomp, inputs: [
    "5\n1 0 0 1\n2 0 0 2\n2 1 0 0\n3 0 2 1\n4 1 2 1",
    "3\n8 2 3 3\n10 3 4 3\n15 5 5 5",
    "2\n500 0 0 500\n30 3 7 20",
  ] },
  { solve: decode, inputs: [
    "1 1\n1", "1000000000 1\n999999937", "1000 6\n2 3 5 7 11 13",
    "100000 3\n6 9 15", "37 3\n4 6 12",
  ] },
  { solve: dataCenter, inputs: [
    centerInput(2, 4, [[1, 2, 10, 1, 3]]),
    centerInput(3, 5, [[1, 2, 2, 0, 5], [2, 3, 4, 0, 2], [1, 3, 1, 2, 5]]),
    centerInput(5, 10, [[1, 2, 5, 0, 10], [2, 3, 3, 0, 10], [3, 4, 4, 1, 9], [4, 5, 2, 2, 8], [1, 5, 15, 3, 7], [2, 5, 1, 5, 10]]),
  ], explicit: [{
    input: centerInput(2, 5000, [[1, 2, 7, 100, 4900]]),
    output: Array.from({ length: 5000 }, (_, i) => i >= 100 && i < 4900 ? 7 : -1).join(" "),
  }] },
  { solve: connections, inputs: [
    connectionInput(1, [[0, 0], [3, 4], [20, 20], [10, 10]]),
    connectionInput(2, [[0, 0], [2, 2], [0, 2], [2, 0]]),
    connectionInput(3, [[0, 0], [0, 1], [2, 0], [2, 1], [4, 0], [4, 1], [7, 9]]),
    connectionInput(3, [[2, 1], [7, 4], [9, 8], [0, 0], [5, 7], [1, 8], [6, 2], [3, 4]]),
  ], explicit: [
    { input: connectionInput(18, Array.from({ length: 36 }, (_, i) => [Math.floor(i / 2) * 1000 + i % 2, 0])), output: "18.0000000000" },
    { input: connectionInput(1, Array.from({ length: 2000 }, (_, i) => [i < 2 ? i : 100 * i, 0])), output: "1.0000000000" },
  ] },
  { solve: diameter, inputs: [
    diameterInput(["000", "000", "000"], ["0"]),
    diameterInput(["0111", "1011", "1101", "1110"], ["0"]),
    diameterInput(["0100", "1010", "0101", "0010"], ["01", "10"]),
    diameterInput(Array.from({ length: 12 }, (_, i) => Array.from({ length: 12 }, (_, j) => Number(i !== j && (i + 1) % 12 === j || (j + 1) % 12 === i)).join("")), ["01", "10"]),
  ], explicit: [{
    input: diameterInput(Array.from({ length: 400 }, (_, i) => Array.from({ length: 400 }, (_, j) => Math.abs(i - j) === 1 ? "1" : "0").join("")), ["0"]),
    output: "399",
  }] },
  { solve: parade, inputs: [
    paradeInput(1, [[1, 1000000000]]),
    paradeInput(4, [[1, 5], [1, 5], [1, 5], [1, 5]]),
    paradeInput(5, [[1, 2], [3, 4], [5, 6], [7, 8], [9, 10]]),
    paradeInput(7, Array.from({ length: 12 }, () => { const left = rng.int(1, 20); return [left, left + rng.int(0, 9)]; })),
  ], explicit: [{
    input: paradeInput(20, Array.from({ length: 20000 }, () => [1, 1])),
    output: Array.from({ length: 20 }, (_, i) => i + 1).join(" "),
  }] },
];
