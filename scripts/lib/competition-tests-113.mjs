// Deterministic local reference solvers. Every published sample must match exactly.
import { makeRng } from "./competition-tests-common.mjs";

function chicken(input) {
  return input.trim().split(/\r?\n/).map((row) => {
    const [count, feet] = row.trim().split(/\s+/).map(Number);
    const rabbits = (feet - count * 2) / 2, chickens = count - rabbits;
    return Number.isInteger(rabbits) && rabbits >= 0 && chickens >= 0 ? `${chickens} ${rabbits}` : "no solution";
  }).join("\n");
}

function lcs(a, b) {
  let previous = new Int32Array(b.length + 1);
  for (const ch of a) {
    const row = new Int32Array(b.length + 1);
    for (let j = 1; j <= b.length; j++) row[j] = ch === b[j - 1] ? previous[j - 1] + 1 : Math.max(previous[j], row[j - 1]);
    previous = row;
  }
  return previous[b.length];
}

function dna(input) {
  const lines = input.trim().split(/\s+/), n = Number(lines[0]), sequences = lines.slice(1);
  let total = 0;
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) total += lcs(sequences[i], sequences[j]);
  return (total * 100 / (n * (n - 1) / 2) / sequences[0].length).toFixed(2);
}

function convolution(input) {
  const values = input.trim().split(/\s+/).map(Number), n = values[0];
  const kernel = values.slice(1 + n * n), result = [];
  for (let i = 0; i < n - 2; i++) {
    let value = 0;
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) value += values[1 + (i + r) * n + i + c] * kernel[r * 3 + c];
    result.push(value);
  }
  return result.join(" ");
}

function cosine(input) {
  const firstLine = input.indexOf("\n"), dimension = Number(input.slice(0, firstLine).trim());
  const [rawA, rawB] = input.slice(firstLine + 1).split("*");
  const texts = [rawA, rawB].map((text) => (text.match(/[A-Za-z0-9]+/g) ?? []).map((word) => word.toLowerCase()));
  const maps = texts.map((words) => {
    const counts = new Map();
    for (const word of words) counts.set(word, (counts.get(word) ?? 0) + 1);
    return counts;
  });
  const frequencies = new Map();
  for (const counts of maps) for (const [word, count] of counts) frequencies.set(word, (frequencies.get(word) ?? 0) + count);
  const values = [...new Set(frequencies.values())].sort((a, b) => b - a);
  const chosen = new Set(), axes = [];
  for (const value of values) {
    const candidates = texts.map((words) => [...new Set(words)].filter((word) => frequencies.get(word) === value));
    let turn = 0;
    while (candidates.some((group) => group.some((word) => !chosen.has(word)))) {
      const candidate = candidates[turn].find((word) => !chosen.has(word));
      if (candidate) { chosen.add(candidate); axes.push(candidate); }
      if (axes.length >= dimension) break;
      turn = 1 - turn;
    }
    if (axes.length >= dimension) break;
  }
  let dot = 0, squaredA = 0, squaredB = 0;
  for (const word of axes) {
    const a = maps[0].get(word) ?? 0, b = maps[1].get(word) ?? 0;
    dot += a * b; squaredA += a * a; squaredB += b * b;
  }
  return (squaredA && squaredB ? dot / Math.sqrt(squaredA * squaredB) : 0).toFixed(2);
}

function bigBinary(input) {
  const numbers = input.trim().split(/\s+/);
  const [a, b] = numbers.map((number) => {
    const [integer, fractional = ""] = number.split(".");
    return { scale: fractional.length, digits: BigInt(integer + fractional) };
  });
  const factor = 10n ** BigInt(a.scale + b.scale), product = a.digits * b.digits;
  return `${(product / factor).toString(2)}.${((product % factor) * 1024n / factor).toString(2).padStart(10, "0")}`;
}

function farthest(input) {
  const numbers = input.trim().split(/\s+/).map(Number);
  const [m, n, x, y] = numbers;
  const answer = Array(m * n).fill(0), obstacle = Array(m * n).fill(false);
  for (let i = 4; i < numbers.length; i += 2) {
    if (numbers[i] === -1) break;
    obstacle[(numbers[i] - 1) * n + numbers[i + 1] - 1] = true;
  }
  let current = (x - 1) * n + y - 1, label = 1;
  answer[current] = label;
  while (true) {
    const distance = Array(m * n).fill(-1), queue = [current];
    distance[current] = 0;
    let best = -1;
    for (let at = 0; at < queue.length; at++) {
      const node = queue[at], r = Math.floor(node / n), c = node % n;
      for (const [dr, dc] of [[-1, 0], [0, -1], [0, 1], [1, 0]]) {
        const nr = r + dr, nc = c + dc, next = nr * n + nc;
        if (nr < 0 || nr >= m || nc < 0 || nc >= n || obstacle[next] || answer[next] || distance[next] >= 0) continue;
        distance[next] = distance[node] + 1;
        queue.push(next);
        if (best < 0 || distance[next] > distance[best] || distance[next] === distance[best] && next > best) best = next;
      }
    }
    if (best < 0) break;
    answer[best] = ++label;
    current = best;
  }
  return answer.join(" ");
}

function xor(input) {
  const [n, ...bits] = input.trim().split(/\s+/).map(Number);
  return Array.from({ length: n }, (_, i) => bits[(i + n - 1) % n] ^ bits[(i + 1) % n]).join(" ");
}

function tiles(input) {
  const [n, ...cells] = input.trim().split(/\s+/).map(Number);
  const seen = new Uint8Array(n * n), count = [0, 0];
  for (let i = 0; i < n * n; i++) {
    if (cells[i] === 2 || seen[i]) continue;
    const color = cells[i], queue = [i];
    seen[i] = 1; count[color]++;
    for (let at = 0; at < queue.length; at++) {
      const r = Math.floor(queue[at] / n), c = queue[at] % n;
      for (const [dr, dc] of [[-1, 0], [0, -1], [1, 0], [0, 1]]) {
        const nr = r + dr, nc = c + dc, next = nr * n + nc;
        if (nr < 0 || nr >= n || nc < 0 || nc >= n || seen[next] || cells[next] !== color) continue;
        seen[next] = 1;
        queue.push(next);
      }
    }
  }
  return `${count[1]} ${count[0]}`;
}

function edf(input) {
  const lines = input.trim().split(/\s+/).filter((token) => token !== "/" && token !== ".").map(Number);
  const cases = lines[0], answers = [], pos = { i: 1 };
  for (let c = 0; c < cases; c++) {
    const count = lines[pos.i++], tasks = Array.from({ length: count }, () => ({ duration: lines[pos.i++], period: lines[pos.i++] }));
    if (tasks.reduce((sum, task) => sum + task.duration / task.period, 0) > 1 + 1e-10) { answers.push("0"); continue; }
    const remaining = Array(count).fill(0), first = Array(count).fill(0);
    let selected = -1, answer = 0;
    for (let time = 0; time < 100000; time++) {
      let failed = false;
      for (let i = 0; i < count; i++) if (time % tasks[i].period === 0) {
        if (remaining[i]) failed = true;
        remaining[i] = tasks[i].duration;
      }
      if (failed) { answer = 0; break; }
      let best = -1;
      for (let i = 0; i < count; i++) {
        if (!remaining[i]) continue;
        const deadline = (Math.floor(time / tasks[i].period) + 1) * tasks[i].period;
        const priorDeadline = best < 0 ? Infinity : (Math.floor(time / tasks[best].period) + 1) * tasks[best].period;
        if (deadline < priorDeadline || deadline === priorDeadline &&
            (remaining[i] > remaining[best] || remaining[i] === remaining[best] && selected === i)) best = i;
      }
      selected = best;
      if (best >= 0 && --remaining[best] === 0 && !first[best]) first[best] = time + 1;
      if (first.every(Boolean)) { answer = Math.max(...first); break; }
      if (time === 99999) throw new Error("EDF reference exceeded simulation horizon");
    }
    answers.push(String(answer));
  }
  return answers.join("\n");
}

function star(input) {
  const [, ...words] = input.trim().split(/\s+/), result = [];
  for (let i = 0; i < 10; i += 2) {
    const start = words[i], target = words[i + 1], dist = new Map([[start, 0]]), queue = [start];
    for (let at = 0; at < queue.length && !dist.has(target); at++) {
      const s = queue[at], d = dist.get(s);
      for (let j = 1; j < s.length; j++) {
        const chars = [...s];
        [chars[0], chars[j]] = [chars[j], chars[0]];
        const next = chars.join("");
        if (!dist.has(next)) { dist.set(next, d + 1); queue.push(next); }
      }
    }
    result.push(String(dist.get(target)));
  }
  return result.join("\n");
}

const rng = makeRng(113);
const matrix = (n, cells, filter) => [String(n), ...Array.from({ length: n }, (_, i) => cells.slice(i * n, (i + 1) * n).join(" ")),
  ...Array.from({ length: 3 }, (_, i) => filter.slice(i * 3, (i + 1) * 3).join(" "))].join("\n");
const board = (m, n, x, y, blocks) => [`${m} ${n}`, `${x} ${y}`, ...blocks.map((p) => p.join(" ")), "-1 -1"].join("\n");
const bits = (a) => `${a.length}\n${a.join(" ")}`;
const grid = (n, cells) => [String(n), ...Array.from({ length: n }, (_, i) => cells.slice(i * n, (i + 1) * n).join(" "))].join("\n");

export const problems113 = [
  { solve: chicken, inputs: [
    "0 0\n0 2\n1 2\n1 4\n1 3",
    "10 20\n10 40\n10 30\n10 19\n10 42",
    Array.from({ length: 5 }, () => { const c = rng.int(1, 1000), r = rng.int(0, 1000); return `${c + r} ${2 * c + 4 * r}`; }).join("\n"),
  ] },
  { solve: dna, inputs: [
    "2\nAAAA\nTTTT", "3\nAAAA\nAAAA\nAAAA", "2\nATCG\nCGAT",
    ["4", ...Array.from({ length: 4 }, () => Array.from({ length: 90 }, () => "ATGC"[rng.int(0, 65535) >> 8 & 3]).join(""))].join("\n"),
    ["2", ...Array.from({ length: 2 }, () => Array.from({ length: 1024 }, () => "ATGC"[rng.int(0, 65535) >> 8 & 3]).join(""))].join("\n"),
  ] },
  { solve: convolution, inputs: [
    matrix(3, Array(9).fill(1), [1, 0, 1, 0, 1, 0, 1, 0, 1]),
    matrix(6, Array.from({ length: 36 }, (_, i) => i % 2), [0, 0, 0, 0, 1, 0, 0, 0, 0]),
    matrix(240, Array.from({ length: 240 * 240 }, () => rng.int(0, 65535) >> 9 & 1), Array.from({ length: 9 }, () => rng.int(0, 65535) >> 8 & 1)),
    matrix(600, Array.from({ length: 600 * 600 }, () => rng.int(0, 65535) >> 9 & 1), Array.from({ length: 9 }, () => rng.int(0, 65535) >> 8 & 1)),
  ] },
  { solve: cosine, inputs: [
    "3\nAlpha beta beta, gamma. *\nALPHA beta delta. *",
    "2\nred red blue. *\nRED blue blue. *",
    "5\nOne: TWO, three. Three: four four. *\ntwo, three: four. Five. *",
  ] },
  { solve: bigBinary, inputs: [
    "1.5\n2.5", "0.1\n0.1", "999.9999999999\n0.0000000001",
    `${"9".repeat(940)}.0000000001\n2.0000000001`,
  ] },
  { solve: farthest, inputs: [
    board(5, 5, 3, 3, [[2, 3], [3, 2], [3, 4], [4, 3]]),
    board(5, 5, 5, 5, []),
    board(7, 8, 2, 2, [[1, 4], [2, 4], [3, 4], [4, 4], [5, 4], [6, 4]]),
    board(15, 15, 8, 8, [...new Set(Array.from({ length: 40 }, () => `${rng.int(1, 15)},${rng.int(1, 15)}`))]
      .map((s) => s.split(",").map(Number)).filter(([x, y]) => x !== 8 || y !== 8)),
  ] },
  { solve: xor, inputs: [bits([0, 0, 0]), bits([1, 0, 0, 0, 0]), bits(Array.from({ length: 50 }, () => rng.int(0, 65535) >> 9 & 1))] },
  { solve: tiles, inputs: [
    grid(1, [1]), grid(4, Array(16).fill(2)),
    grid(6, Array.from({ length: 36 }, (_, i) => (Math.floor(i / 6) + i % 6) % 2)),
    grid(50, Array.from({ length: 2500 }, () => rng.int(0, 65535) % 3)),
  ] },
  { solve: edf, inputs: [
    "1\n1\n1 5\n.",
    "2\n2\n1 2\n1 3\n/\n2\n2 3\n2 4\n.",
    "1\n3\n1 4\n2 7\n2 9\n.",
    "1\n3\n1 2\n2 5\n3 8\n.",
  ] },
  { solve: star, inputs: [
    "4\n1234 1234\n1234 2134\n1234 3214\n1234 4231\n2134 4231",
    "6\n123456 654321\n135246 246135\n612345 123456\n246135 531642\n632514 452361",
    "9\n123456789 123456789\n123456789 923456781\n123456789 321456789\n123456789 423156789\n123456789 129456783",
  ] },
];
