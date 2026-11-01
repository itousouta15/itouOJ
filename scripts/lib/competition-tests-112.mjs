// Reference oracles and deterministic, non-sample inputs for the ten 112 Zhongtou problems.
// The public examples are checked by the importer before any database write.
import { makeRng } from "./competition-tests-common.mjs";

function finance(input) {
  const [m, s, years] = input.trim().split(/\s+/).map(Number);
  const months = years * 12;
  const future = (monthly) => {
    if (monthly === 0) return m * months;
    let balance = 0;
    for (let i = 0; i < months; i++) balance = (balance + m) * (1 + monthly);
    return balance;
  };
  let lo = 0, hi = 1 / 12;
  for (let i = 0; i < 90; i++) {
    const mid = (lo + hi) / 2;
    if (future(mid) < s) lo = mid;
    else hi = mid;
  }
  const y = (lo + hi) * 600;
  const principal = s / (1 + y / 100) ** years;
  return `${y.toFixed(2)}% ${principal.toFixed(2)} ${(months * m - principal).toFixed(2)}`;
}

function segments(input) {
  const nums = input.trim().split(/\s+/).map(Number);
  let at = 0;
  const groups = nums[at++], events = [];
  let min = Infinity, max = -Infinity;
  for (let g = 0; g < groups; g++) {
    const pairs = nums[at++] / 2, ranges = [];
    for (let i = 0; i < pairs; i++) {
      const a = nums[at++], b = nums[at++];
      const left = Math.min(a, b), right = Math.max(a, b);
      min = Math.min(min, left); max = Math.max(max, right);
      ranges.push([left, right]);
    }
    ranges.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    let merged = null;
    for (const [left, right] of ranges) {
      if (!merged || left > merged[1]) {
        if (merged && merged[0] < merged[1]) events.push([merged[0], 1], [merged[1], -1]);
        merged = [left, right];
      } else merged[1] = Math.max(merged[1], right);
    }
    if (merged && merged[0] < merged[1]) events.push([merged[0], 1], [merged[1], -1]);
  }
  events.sort((a, b) => a[0] - b[0]);
  const lengths = Array(groups + 1).fill(0);
  let prev = min, active = 0;
  for (const [point, delta] of events) {
    lengths[active] += point - prev;
    active += delta;
    prev = point;
  }
  lengths[active] += max - prev;
  return [...lengths.keys()].sort((a, b) => lengths[b] - lengths[a] || a - b).slice(0, 2)
    .map((i) => `${i} ${(100 * lengths[i] / (max - min)).toFixed(2)}%`).join("\n");
}

function ternary(input) {
  const n = Number(input.trim());
  let end0 = 1n, end1 = 1n, end2 = 1n;
  for (let i = 2; i <= n; i++) [end0, end1, end2] = [end1 + end2, end0 + end2, end0 + end1 + end2];
  return String(end0 + end1 + end2);
}

function vending(input) {
  const r = Number(input.trim()), ways = [1n];
  for (let i = 1; i <= r; i++) ways[i] = [1, 2, 5].reduce((sum, c) => sum + (i >= c ? ways[i - c] : 0n), 0n);
  return String(ways[r]);
}

function voting(input) {
  const lines = input.trim().split(/\r?\n/).map((s) => s.trim());
  const m = Number(lines[0]), n = Number(lines[1]);
  const ballots = lines.slice(2, n + 2).map((line) => line.includes(" ") ? line.split(/\s+/).map(Number) : [...line].map(Number));
  const alive = new Set(Array.from({ length: m }, (_, i) => i + 1));
  while (alive.size) {
    const votes = Array(m + 1).fill(0);
    for (const ballot of ballots) for (const choice of ballot) if (alive.has(choice)) { votes[choice]++; break; }
    for (const choice of alive) if (votes[choice] > n / 2) return `${choice} is elected`;
    const smallest = Math.min(...[...alive].map((c) => votes[c]));
    for (const choice of [...alive]) if (votes[choice] === smallest) alive.delete(choice);
  }
  return "indeterminable";
}

function hanoi(input) {
  const n = Number(input.trim());
  return String(((1n << BigInt(n + 1)) - (n / 3 % 2 === 0 ? 2n : 1n)) / 3n);
}

function coffee(input) {
  const x = input.trim().split(/\s+/).map(Number), lines = [];
  for (let i = 0; i < x[0]; i++) {
    const [d, water, lrr, strength] = x.slice(1 + 4 * i, 5 + 4 * i);
    const drink = (water - lrr * d) / (1 - strength / 100);
    const extraction = strength * drink / d;
    const grade = (strength > 1.5 ? 0 : strength < 1.25 ? 6 : 3) +
      (extraction < 19 ? 1 : extraction > 24 ? 3 : 2);
    lines.push(extraction.toFixed(2), drink.toFixed(2), String(grade));
  }
  return lines.join("\n");
}

function park(input) {
  const a = input.trim().split(/\s+/).map(Number);
  const k = a[6], nodes = [[a[2], a[3]], [a[4], a[5]]];
  for (let i = 0; i < k; i++) nodes.push([a[7 + 4 * i], a[8 + 4 * i]], [a[9 + 4 * i], a[10 + 4 * i]]);
  const dist = Array(nodes.length).fill(Infinity), used = Array(nodes.length).fill(false);
  dist[0] = 0;
  for (let z = 0; z < nodes.length; z++) {
    let u = -1;
    for (let i = 0; i < nodes.length; i++) if (!used[i] && (u === -1 || dist[i] < dist[u])) u = i;
    if (u === 1) break;
    used[u] = true;
    for (let v = 0; v < nodes.length; v++) {
      let weight = 10 * (Math.abs(nodes[u][0] - nodes[v][0]) + Math.abs(nodes[u][1] - nodes[v][1]));
      if (u >= 2 && u % 2 === 0 && v === u + 1 || v >= 2 && v % 2 === 0 && u === v + 1) {
        const dx = nodes[u][0] - nodes[v][0], dy = nodes[u][1] - nodes[v][1];
        weight = Math.min(weight, Math.floor(10 * Math.hypot(dx, dy) + 1e-9));
      }
      dist[v] = Math.min(dist[v], dist[u] + weight);
    }
  }
  return String(dist[1] / 10);
}

function permutationCount(n) {
  let m = n, count = 0, ways = 1;
  for (let p = 2; p * p <= m; p++) {
    if (m % p) continue;
    let exponent = 0;
    while (m % p === 0) { m /= p; exponent++; count++; }
    let factorial = 1;
    for (let i = 2; i <= exponent; i++) factorial *= i;
    ways *= factorial;
  }
  if (m > 1) count++;
  let factorial = 1;
  for (let i = 2; i <= count; i++) factorial *= i;
  return factorial / ways;
}

function primeOrders(input) {
  const n = Number(input.trim()), matches = [];
  for (let m = 2; m <= 100000 && matches.length < 2; m++) if (permutationCount(m) === n) matches.push(m);
  if (matches.length !== 2) throw new Error(`Cannot derive two prime-product numbers for ${n}`);
  return String(matches[0] + matches[1]);
}

function treasures(input) {
  const nums = input.trim().split(/\s+/).map(Number), results = [];
  let pos = 1;
  for (let t = 0; t < nums[0]; t++) {
    const count = nums[pos++], endings = Array.from({ length: 1001 }, () => []);
    for (let i = 0; i < count; i++) {
      const w = nums[pos++], start = nums[pos++], end = nums[pos++];
      endings[end].push([start, w]);
    }
    const dp = Array(1001).fill(0);
    for (let x = 1; x <= 1000; x++) {
      dp[x] = dp[x - 1];
      for (const [start, w] of endings[x]) dp[x] = Math.max(dp[x], dp[start] + w);
    }
    results.push(String(dp[1000]));
  }
  return results.join("\n");
}

const intervalInput = (groups) => [String(groups.length), ...groups.flatMap((ranges) => [String(ranges.length * 2), ...ranges.map((r) => r.join(" "))])].join("\n");
const ballotInput = (m, rows) => [String(m), String(rows.length), ...rows.map((r) => r.join(" "))].join("\n");
const treasureInput = (tests) => [String(tests.length), ...tests.flatMap((items) => [String(items.length), ...items.map((r) => r.join(" "))])].join("\n");
const rng = makeRng(112);

export const problems112 = [
  { solve: finance, inputs: ["100 1200 1", "1000 12479.43 1", "250 56210 10", "1000 50162.87 3"] },
  { solve: segments, inputs: [
    intervalInput([[[0, 10]], [[5, 15]]]),
    intervalInput([[[0, 4], [3, 8]], [[2, 6], [11, 14]]]),
    intervalInput([[[1, 4]], [[10, 15]], [[2, 11]]]),
    intervalInput([[[0, 3], [18, 20]], [[3, 7]], [[7, 12]], [[12, 20]]]),
  ] },
  { solve: ternary, inputs: ["1", "3", "10", "30", "49"] },
  { solve: vending, inputs: ["1", "3", "5", "11", "25", "35"] },
  { solve: voting, inputs: [
    ballotInput(2, [[1, 2], [1, 2], [2, 1]]),
    ballotInput(2, [[1, 2], [2, 1]]),
    ballotInput(4, [[1, 3, 2, 4], [2, 3, 1, 4], [3, 2, 1, 4], [3, 1, 2, 4], [4, 2, 3, 1]]),
    ballotInput(10, Array.from({ length: 21 }, (_, i) => Array.from({ length: 10 }, (_, j) => (i % 10 + j) % 10 + 1))),
    ballotInput(20, Array.from({ length: 10000 }, (_, i) => Array.from({ length: 20 }, (_, j) => (i % 20 + j) % 20 + 1))),
  ] },
  { solve: hanoi, inputs: ["15", "18", "21", "24", "27", "30"] },
  { solve: coffee, inputs: [
    "1\n20 300 2 1.25",
    "3\n20 300 2 1.2\n20 400 2 1.35\n20 400 2 1.6",
    "2\n15 240 2.5 1.5\n12 200 1.5 1.6",
    "1\n25 500 2.5 1.55",
  ] },
  { solve: park, inputs: [
    "6 7\n1 1\n6 5\n0",
    "5 5\n1 1\n5 5\n1\n1 1 5 5",
    "8 8\n1 1\n8 8\n2\n1 1 3 4\n3 4 8 8",
    "7 7\n4 4\n4 4\n1\n1 1 7 7",
  ] },
  { solve: primeOrders, inputs: ["6", "12", "24"] },
  { solve: treasures, inputs: [
    treasureInput([[[5, 0, 1]]]),
    treasureInput([[[5, 0, 5], [8, 2, 4], [7, 4, 6], [1, 6, 10]]]),
    treasureInput([Array.from({ length: 500 }, () => [rng.int(1, 2000), rng.int(0, 899), rng.int(900, 1000)])]),
    treasureInput([[[100, 0, 500], [100, 500, 1000], [199, 0, 1000]], [[8, 1, 2], [12, 2, 3]]]),
    treasureInput([Array.from({ length: 10000 }, () => {
      const start = rng.int(0, 999);
      return [rng.int(1, 100000), start, rng.int(start + 1, 1000)];
    })]),
  ] },
];
