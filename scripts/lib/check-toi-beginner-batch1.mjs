// node --import ./scripts/ctf-test-loader.mjs scripts/lib/check-toi-beginner-batch1.mjs
//   --python PATH [--cxx PATH [--compile-only-cxx]] [--source SNAPSHOT] [--codes a087,a088]
// Executes the actual exported lesson programs. All test generation is deterministic and bounded.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile, mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { lessons } from "../../src/lib/toiBeginnerLessons/batch1.ts";
import { toiBeginnerProblemCatalog } from "../../src/lib/toiBeginnerProblemCatalog.ts";

const args = process.argv.slice(2);
const option = (name) =>
  args.includes(name) ? args[args.indexOf(name) + 1] : undefined;
const python = option("--python"),
  cxx = option("--cxx");
const compileOnly = args.includes("--compile-only-cxx");
assert.ok(!cxx || python, "--cxx requires --python");
assert.ok(!compileOnly || cxx, "--compile-only-cxx requires --cxx");
assert.ok(
  !(cxx && process.platform === "win32" && !compileOnly),
  "Windows C++ execution is blocked: use --compile-only-cxx; runtime verification belongs on Linux.",
);
const expectedCodes = [
  ...Array.from(
    { length: 21 },
    (_, i) => `a${String(87 + i).padStart(3, "0")}`,
  ),
  ...Array.from({ length: 24 }, (_, i) => `a${156 + i}`),
];
assert.deepEqual(
  lessons.map((l) => l.code),
  expectedCodes,
);
const source = option("--source")
  ? JSON.parse(await readFile(option("--source"), "utf8"))
  : null;
const cases = new Map(lessons.map((l) => [l.code, []]));
function add(code, input, output, label) {
  cases
    .get(code)
    .push({ input, output: `${output}`.replace(/\n*$/, "") + "\n", label });
}
const line = (a) => a.join(" ");
const grid = (a) => a.map(line).join("\n");
const norm = (s) => s.replaceAll("\r\n", "\n").replace(/\n$/, "");
for (const l of lessons) {
  assert.ok(
    l.explanation.length >= 3 && l.trace.length >= 3 && l.trace.length <= 6,
    l.code,
  );
  for (const s of l.trace)
    assert.ok(
      s.title && s.description && s.cells.length && s.variables.length,
      l.code,
    );
  assert.ok(l.cpp.includes("int main(") && l.python.length > 40, l.code);
  const catalog = toiBeginnerProblemCatalog.find((p) => p.code === l.code);
  assert.equal(l.sampleInput, catalog.samples[0].input);
  assert.equal(l.sampleOutput, catalog.samples[0].output);
  if (source)
    assert.deepEqual(
      catalog.samples,
      source.find((p) => p.code === l.code).samples,
      l.code,
    );
  for (const [i, s] of catalog.samples.entries())
    add(l.code, s.input, s.output, `public-${i + 1}`);
}

// Hand-reviewed boundary cases; expected strings intentionally retain line structure and case.
for (const [code, input, output, label] of [
  ["a087", "1 2\n1 1\n", "2", "horizontal-two"],
  ["a087", "2 1\n1\n1\n", "2", "vertical-two"],
  ["a088", "1 1\n100\n1 1\n", "1 1", "different-items-do-not-cancel"],
  ["a088", "3 1\n2 2 2\n3 2 2 2\n", "0 0", "exact-delivery"],
  ["a089", "3 3\n1 2 3\n1 2 3\n", "1", "whole-sequence"],
  ["a089", "3 1\n1 2 3\n4\n", "not found", "absent"],
  ["a091", "1\n0\n", "1 0 0 0 0 0 50", "only-drink"],
  ["a091", "2\n1 5\n", "0 1 0 0 0 1 40", "only-cakes"],
  ["a091", "4\n0 0 1 2\n", "2 1 1 0 0 0 118", "all-paired"],
  ["a092", "20 30 10 0\n", "15", "hot-boundary-time-excluded"],
  ["a092", "20 15 7 1\n", "10", "both-inclusive-boundaries"],
  ["a092", "20 16 16 1\n", "20", "neither-discount"],
  ["a094", "2 2\n", "2", "lower-bound"],
  ["a094", "10 1000\n", "10\n100\n1000", "inclusive-upper-power"],
  ["a095", "1 2\nA\nB\nA A A\n", "A 1\nB 0", "deduplicate-and-zero"],
  ["a095", "2 1\nX\nX X X\nX X X\n", "X 2", "reset-per-student"],
  [
    "a098",
    "10\n4 2 6 9 2 8 5 7 3 10\n",
    "8",
    "rightmost-repeated-minimum-left",
  ],
  ["a098", "10\n1 3 4 5 6 7 8 9 10 2\n", "4", "unique-minimum-right"],
  [
    "a099",
    "0 1 5 10 15 14\n1 1 1 1 1\n1 1 1 1 1\n5 5 5 5 5\n11 10 10 8 1\n15 15 15 15 15\n15 15 15 15 15\n",
    "X\nA\nA\nB\nA\nF",
    "zero-equality-and-equal-thresholds",
  ],
  ["a100", "3 2\n1 2 3 2\n", "1 2 3", "equal-servings"],
  ["a100", "3 3\n1 3 1000 1\n", "1 1 334", "scale-down-ceiling"],
  [
    "a101",
    "SA SK SQ SJ S10 S9 S8 S7 S6 S5 S4 S3 S2\n",
    "13 0 0 0\n10",
    "one-suit-all-ranks",
  ],
  ["a102", "1 1\n1\n", "1 1\n1 1", "fold-seam-duplicated"],
  ["a102", "2 1\n0 1\n", "0 1 1 0\n0 1 1 0", "width-height-order"],
  ["a103", "1 2\nSoup soup\nSOUP\n", "0 0", "case-sensitive-absent"],
  ["a103", "1 2\nNA NA\nNA\n", "1 1\n1 2", "exact-NA-query"],
  [
    "a104",
    "10\n" + Array(10).fill(20).join(" ") + "\n",
    "200",
    "ten-no-discount",
  ],
  ["a104", "41\n" + Array(41).fill(65).join(" ") + "\n", "1200", "monthly-cap"],
  ["a105", "1 1 1\n", "6", "minimum-input"],
  ["a105", "10000 10000 1000\n", "600", "maximum-products"],
  [
    "a106",
    "AAA\n1\nAAA, A  B \n",
    " A  B ",
    "preserve-leading-internal-spaces",
  ],
  ["a106", "XYZ\n2\nABC,First\nXYZ,Last Field\n", "Last Field", "last-record"],
  ["a107", "1 1\na\nA\n", "1 1\n1 1", "length-one"],
  ["a107", "2 2\nAB\nBA\nXYZ\n", "NO", "word-longer-than-grid"],
  ["a107", "3 3\naaa\naaa\naaa\naa\n", "1 1\n1 2", "endpoint-tie-break"],
  ["a156", "2\n1 3\n4 2\n", "NO", "no-saddle"],
  ["a156", "2\n0 1\n2 3\n", "0 1", "zero-based-first-row"],
  ["a157", "1 1 17 18\n", "20", "end-at-eighteen"],
  ["a157", "2 2 22 23\n", "250", "last-night-slot"],
  ["a158", "1\n5 -9\n", "success", "single-point"],
  ["a158", "3\n0 0\n0 2\n1 0\n", "failure", "missing-reflected-point"],
  ["a159", "3\n0 1 8\n", "5 1 3", "average-truncation"],
  ["a159", "3\n5 5 5\n", "5 5 5", "all-equal-zero-transfer"],
  ["a160", "1 2\n6000\n", "6000 0", "no-other-ore"],
  ["a160", "5 2\n9 1 2 3 4\n", "12 7", "left-shortage"],
  ["a160", "5 2\n1 2 3 4 9\n", "16 3", "right-shortage"],
  ["a160", "3 500\n1 9 2\n", "12 0", "absorb-all"],
  ["a161", "9\n1 2 3 4 5 6 7 8 9\n", "perfect", "all-down"],
  [
    "a161",
    "13\n1 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 1\n",
    "1",
    "revival-no-second-score",
  ],
  ["a162", "aAa\n100\n", "001", "remainder-to-right"],
  ["a162", "ABC\n909\n", "909", "one-area-per-item"],
  ["a163", "4 1\n5 5 6 7\n", "2", "home-at-end-equal-blocker"],
  ["a163", "3 2\n2 9 3\n", "0", "nothing-taller-than-home"],
  ["a164", "500 500\n1\n0 0\n", "0 0", "maximum-distance"],
  ["a164", "0 0\n2\n5 0\n3 3\n", "3 3", "euclidean-not-manhattan"],
  ["a165", "1\n1 5\n0\n", "0", "zero-workers"],
  ["a165", "2\n1 4\n2 3\n3\n", "1", "exactly-first-factory"],
  ["a165", "2\n1 4\n2 3\n100\n", "2", "surplus-workers"],
  ["a166", "0 0 1\n1\n0 2\n", "-15", "equal-position-fast-ball"],
  ["a166", "100 0 1\n1\n101 0\n", "100", "outside-zero-radius"],
  ["a167", "1\n1 1 1\n1\n2\n", "NO", "short-tooth-too-wide"],
  ["a167", "1\n1 1 1\n1\n1\n", "YES", "one-cell-fit"],
  ["a167", "1\n1 1 1\n2\n2 2 2\n", "NO", "short-block-wider-than-long"],
  ["a168", "2\n1A\nB\n", "BA", "vegetarian-consumes-turn"],
  ["a168", "2\n123\nA\n", "A", "vegetarian-only-restaurant"],
  ["a169", "0 0 0 -1\n", "34:30:00", "west-wrap"],
  ["a169", "35 59 59 1\n", "1:29:59", "east-wrap"],
  ["a169", "3 4 5 24\n", "3:04:05", "full-day"],
  ["a170", "2\n1 5\n9 1\n", "5 1", "paired-input-rows"],
  ["a171", "4\n9 3 3 4\n1\n", "3", "endpoint-through-plateau"],
  ["a171", "4\n4 3 3 9\n4\n", "2", "right-endpoint"],
  ["a172", "6 10 2\n", "NO", "gcd-not-sufficient"],
  ["a172", "7 7 14\n", "YES", "equal-lengths"],
  ["a172", "8 3 9\n", "YES", "zero-first-jumps"],
  ["a173", "1 3\n8 0 0\n", "8 8 0", "no-cascade"],
  ["a173", "1 1\n0\n", "0", "no-neighbors"],
  ["a174", "ZYX\n", "XYZ", "equal-count-alphabetical"],
  ["a174", "AAAA\n", "A", "one-distinct-letter"],
  ["a175", "78 1 0\n", "78", "equal-nonmultiple-key-keeps-first"],
  ["a175", "140 7 0\n", "7", "multiple-remainder-not-value"],
  ["a175", "70 1 0\n", "70", "multiple-always-wins"],
  ["a176", "2\n2 100\n1 99\n", "0", "no-overdue-single-line"],
  ["a176", "3\n9 101\n2 102\n5 100\n", "2 9\n15", "sort-ids-not-days"],
  ["a177", "--ab++CD-12\n", "baCD21", "consecutive-signs"],
  ["a177", "abc123\n", "abc123", "no-signs"],
  ["a177", "-ab+\n", "ba", "trailing-empty-segment"],
  ["a178", "1 1\n1000\n1\n", "No", "equal-count"],
  ["a178", "2 1\n1 1\n2\n", "No", "equal-height-sum"],
  [
    "a179",
    "3\n000000\n000009\n000010\n",
    "0 2\n1 1",
    "leading-zeros-and-folder-boundary",
  ],
  ["a179", "1\n999999\n", "99 1", "last-folder"],
])
  add(code, input, output, label);

// Lottery: all nine branches with distinct legal ticket numbers.
for (const [hits, special, prize] of [
  [6, false, "A"],
  [5, true, "B"],
  [5, false, "C"],
  [4, true, "D"],
  [4, false, "E"],
  [3, true, "F"],
  [2, true, "G"],
  [3, false, "H"],
  [1, true, "X"],
]) {
  const ticket = Array.from({ length: hits }, (_, i) => i + 1);
  if (special) ticket.push(7);
  while (ticket.length < 6) ticket.push(20 + ticket.length);
  add("a090", line(ticket) + "\n1 2 3 4 5 6 7\n", prize, `prize-${prize}`);
}

let seed = 0xa087;
function random(n) {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed % n;
}
// Each loop below has a fixed small bound; subprocesses only run after generation completes.
for (let trial = 0; trial < 8; ++trial) {
  // Naive contiguous-slice oracle for KMP, including overlapping and repetitive targets.
  const a = Array.from({ length: 12 + trial }, () => 1 + random(3));
  const b =
    trial % 2
      ? a.slice(trial, trial + 1 + (trial % 5))
      : Array.from({ length: 1 + (trial % 5) }, () => 1 + random(3));
  let pos = -1;
  for (let i = 0; i + b.length <= a.length; ++i)
    if (line(a.slice(i, i + b.length)) === line(b)) {
      pos = i;
      break;
    }
  add(
    "a089",
    `${a.length} ${b.length}\n${line(a)}\n${line(b)}\n`,
    pos < 0 ? "not found" : pos + 1,
    `naive-slices-${trial}`,
  );

  // Enumerate every proper divisor independently, including square and prime boundaries.
  const n = [2, 4, 6, 9, 28, 36, 97, 496][trial];
  let sum = 0;
  for (let d = 1; d < n; ++d) if (n % d === 0) sum += d;
  add(
    "a093",
    `${n}\n`,
    `${sum}\n${sum === n ? "perfect" : "not perfect"}`,
    `all-divisors-${n}`,
  );

  // Exhaustive 10-day schedule with a large cost gap guarantees a unique optimum.
  const outward = Array(10).fill(10000),
    back = Array(10).fill(10000);
  const ai = random(10),
    bi = ai + random(10 - ai);
  outward[ai] = 1 + trial;
  back[bi] = 21 + trial;
  let best = [Infinity, 0, 0];
  for (let i = 0; i < 10; ++i)
    for (let j = i; j < 10; ++j) {
      let cost = outward[i] + back[j];
      for (let night = i; night < j; ++night) cost += 1000;
      if (cost < best[0]) best = [cost, i + 1, j + 1];
    }
  add(
    "a096",
    grid([outward, back]) + "\n",
    `${best[1]} ${best[2]} ${best[0]}`,
    `enumerated-nights-${trial}`,
  );

  // Brute witness definitions for strictly larger prime/square/cube.
  const value = [1, 2, 4, 8, 25, 27, 64, 125][trial];
  const isPrime = (x) => {
    for (let d = 2; d < x; ++d) if (x % d === 0) return false;
    return x >= 2;
  };
  let p = value + 1;
  while (!isPrime(p)) ++p;
  const squares = Array.from({ length: 30 }, (_, i) => (i + 1) ** 2).filter(
    (x) => x > value,
  );
  const cubes = Array.from({ length: 15 }, (_, i) => (i + 1) ** 3).filter(
    (x) => x > value,
  );
  add(
    "a097",
    `${value}\n`,
    `${p} ${Math.min(...squares)} ${Math.min(...cubes)}`,
    `enumerated-powers-${value}`,
  );

  // Board word search oracle enumerates endpoint pairs, not the lesson's eight-direction loop.
  const board = Array.from({ length: 3 }, () =>
    Array.from({ length: 3 }, () => (random(2) ? "a" : "B")).join(""),
  );
  const word = ["ab", "ba", "aaa", "Bb", "a", "bbA", "aba", "c"][trial];
  const hits = [];
  for (let r = 0; r < 3; ++r)
    for (let c = 0; c < 3; ++c)
      for (let er = 0; er < 3; ++er)
        for (let ec = 0; ec < 3; ++ec) {
          const length = Math.max(Math.abs(er - r), Math.abs(ec - c)) + 1;
          if (
            length !== word.length ||
            !(r === er || c === ec || Math.abs(er - r) === Math.abs(ec - c))
          )
            continue;
          const dr = Math.sign(er - r),
            dc = Math.sign(ec - c);
          let formed = "";
          for (let k = 0; k < length; ++k)
            formed += board[r + dr * k][c + dc * k];
          if (formed.toLowerCase() === word.toLowerCase())
            hits.push([r + 1, c + 1, er + 1, ec + 1]);
        }
  hits.sort((a, b) => {
    for (let i = 0; i < 4; ++i) if (a[i] !== b[i]) return a[i] - b[i];
    return 0;
  });
  add(
    "a107",
    `3 3\n${board.join("\n")}\n${word}\n`,
    hits.length
      ? `${hits[0][0]} ${hits[0][1]}\n${hits[0][2]} ${hits[0][3]}`
      : "NO",
    `endpoint-pairs-${trial}`,
  );

  // Horizontal symmetry checked by trying every possible doubled axis from point pairs.
  const points = Array.from({ length: 6 }, (_, i) => [
    i % 3,
    Math.floor(i / 3) * 4 - 2,
  ]);
  if (trial % 2) points[5][1] += trial;
  const axes = new Set(points.flatMap((a) => points.map((b) => a[1] + b[1])));
  const symmetric = [...axes].some((axis) =>
    points.every(([x, y]) =>
      points.some(([u, v]) => u === x && v === axis - y),
    ),
  );
  add(
    "a158",
    `6\n${grid(points)}\n`,
    symmetric ? "success" : "failure",
    `all-axis-candidates-${trial}`,
  );

  // Pick nearest neighbors by a distance ordering oracle for balanced absorption.
  const ore = Array.from({ length: 5 + trial }, () => 1 + random(20));
  const center = trial % ore.length;
  ore[center] = 100;
  const absorb = 2 * (1 + (trial % 5));
  const order = ore
    .map((v, i) => i)
    .filter((i) => i !== center)
    .sort((a, b) => Math.abs(a - center) - Math.abs(b - center) || a - b);
  const selected = new Set(order.slice(0, absorb));
  let gain = ore[center],
    rest = 0;
  for (let i = 0; i < ore.length; ++i)
    if (i !== center) {
      if (selected.has(i)) gain += ore[i];
      else rest += ore[i];
    }
  add(
    "a160",
    `${ore.length} ${absorb}\n${line(ore)}\n`,
    `${gain} ${rest}`,
    `nearest-neighbor-order-${trial}`,
  );

  // Per-second countdown oracle, with duplicate hits and revival exactly at second 13.
  const shots = Array.from({ length: 27 }, () =>
    random(4) ? 1 + random(9) : -1,
  );
  if (trial === 0) shots.splice(0, 13, 1, ...Array(11).fill(-1), 1);
  const remaining = Array(10).fill(0),
    earned = new Set();
  let perfect = false;
  for (const k of shots) {
    for (let j = 1; j <= 9; ++j) remaining[j] = Math.max(0, remaining[j] - 1);
    if (k !== -1 && remaining[k] === 0) {
      remaining[k] = 12;
      earned.add(k);
    }
    if (remaining.slice(1).every((x) => x > 0)) perfect = true;
  }
  add(
    "a161",
    `${shots.length}\n${line(shots)}\n`,
    perfect ? "perfect" : [...earned].reduce((a, b) => a + b, 0),
    `countdown-simulation-${trial}`,
  );

  // Distribution oracle hands out units cyclically, starting at the rightmost area.
  const kinds = "aBcAbC";
  const digits = Array.from({ length: 6 }, () => random(10));
  const redistributed = Array(6).fill(0);
  for (const ch of "ABC") {
    const positions = [...kinds]
      .map((v, i) => (v.toUpperCase() === ch ? i : -1))
      .filter((i) => i >= 0)
      .reverse();
    const total = positions.reduce((s, i) => s + digits[i], 0);
    for (let unit = 0; unit < total; ++unit)
      ++redistributed[positions[unit % positions.length]];
  }
  add(
    "a162",
    kinds + "\n" + digits.join("") + "\n",
    redistributed.join(""),
    `unit-distribution-${trial}`,
  );

  // Every intervening building is checked independently (quadratic visibility oracle).
  const heights = Array.from({ length: 9 }, () => random(10)),
    home = random(9);
  let visible = 0;
  for (let i = 0; i < 9; ++i)
    if (i !== home && heights[i] > heights[home]) {
      let clear = true;
      for (let j = Math.min(i, home) + 1; j < Math.max(i, home); ++j)
        if (heights[j] >= heights[i]) clear = false;
      if (clear) ++visible;
    }
  add(
    "a163",
    `9 ${home + 1}\n${line(heights)}\n`,
    visible,
    `all-intervening-buildings-${trial}`,
  );

  // Independent continuous interval collision oracle checks half-unit offsets as well.
  const longWidths = [1 + random(4), 1 + random(3), 1 + random(4)];
  const shortWidths =
    trial % 2 ? [1 + random(4)] : [1 + random(3), 1 + random(3), 1 + random(3)];
  const segments = (widths, first) => {
    let pos = 0;
    return widths.map((w, i) => {
      const start = pos;
      pos += w;
      return [start, pos, i % 2 ? 3 - first : first];
    });
  };
  const ls = segments(longWidths, 1),
    ss = segments(shortWidths, 2),
    lw = ls.at(-1)[1],
    sw = ss.at(-1)[1];
  let fits = false;
  for (let twice = 0; twice <= 2 * (lw - sw); ++twice) {
    const offset = twice / 2;
    if (
      !ls.some(([l, r, h]) =>
        ss.some(
          ([u, v, g]) =>
            h + g > 3 && Math.max(l, u + offset) < Math.min(r, v + offset),
        ),
      )
    )
      fits = true;
  }
  add(
    "a167",
    `1\n${line(longWidths)}\n${(shortWidths.length + 1) / 2}\n${line(shortWidths)}\n`,
    fits ? "YES" : "NO",
    `interval-overlap-${trial}`,
  );

  // Reachability DP independently validates enumeration of nonnegative jump counts.
  const nJump = 2 + random(12),
    mJump = 2 + random(12),
    distance = 1 + random(80),
    reachable = Array(distance + 1).fill(false);
  reachable[0] = true;
  for (let d = 1; d <= distance; ++d)
    reachable[d] =
      (d >= nJump && reachable[d - nJump]) ||
      (d >= mJump && reachable[d - mJump]);
  add(
    "a172",
    `${nJump} ${mJump} ${distance}\n`,
    reachable[distance] ? "YES" : "NO",
    `reachability-dp-${trial}`,
  );

  // Manhattan-distance-one neighbors from a full scan, independent of four-direction offsets.
  const matrix = Array.from({ length: 3 }, () =>
    Array.from({ length: 4 }, () => (random(3) ? random(20) : 0)),
  );
  const result = matrix.map((row, r) =>
    row.map((v, c) => {
      if (v) return v;
      const neighbors = [];
      for (let x = 0; x < 3; ++x)
        for (let y = 0; y < 4; ++y)
          if (Math.abs(x - r) + Math.abs(y - c) === 1 && matrix[x][y])
            neighbors.push(matrix[x][y]);
      return neighbors.length
        ? Math.floor(neighbors.reduce((a, b) => a + b, 0) / neighbors.length)
        : 0;
    }),
  );
  add(
    "a173",
    "3 4\n" + grid(matrix) + "\n",
    grid(result),
    `original-neighbor-scan-${trial}`,
  );

  // Distinct heights guarantee at most one saddle; compare each candidate to every peer.
  const values = Array.from({ length: 9 }, (_, i) => i);
  for (let i = 8; i > 0; --i) {
    const j = random(i + 1);
    [values[i], values[j]] = [values[j], values[i]];
  }
  const terrain = [values.slice(0, 3), values.slice(3, 6), values.slice(6, 9)],
    treasures = [];
  for (let r = 0; r < 3; ++r)
    for (let c = 0; c < 3; ++c)
      if (
        terrain[r].every((v) => terrain[r][c] >= v) &&
        terrain.every((row) => terrain[r][c] <= row[c])
      )
        treasures.push([r, c]);
  assert.ok(treasures.length <= 1);
  add(
    "a156",
    "3\n" + grid(terrain) + "\n",
    treasures.length ? line(treasures[0]) : "NO",
    `every-row-column-peer-${trial}`,
  );

  // Enumerate all monotone downhill paths, including plateaus, then choose the lower terminal.
  const leftLow = 2 + random(3),
    rightLow = random(2),
    slope = [10, leftLow, leftLow, 100, 6, rightLow, rightLow, 8],
    start = 3;
  const terminals = [];
  for (const direction of [-1, 1]) {
    const destinations = [];
    for (
      let end = start + direction;
      end >= 0 && end < slope.length;
      end += direction
    ) {
      let legal = true;
      for (let i = start; i !== end; i += direction)
        if (slope[i + direction] > slope[i]) legal = false;
      if (legal) destinations.push(end);
    }
    terminals.push(destinations.at(-1) ?? start);
  }
  const terminal = terminals.reduce((a, b) => (slope[a] < slope[b] ? a : b));
  add(
    "a171",
    `8\n${line(slope)}\n4\n`,
    terminal + 1,
    `all-downhill-paths-${trial}`,
  );

  // Branch-based pairwise comparison oracle, independent of the lesson's tuple key.
  const lucky = Array.from({ length: 7 }, () => 1 + random(300));
  let winner = lucky[0];
  const beats = (a, b) => {
    if (a % 7 === 0 && b % 7 !== 0) return true;
    if (a % 7 !== 0 && b % 7 === 0) return false;
    if (a % 7 === 0) return a % 70 > b % 70;
    return a % 77 < b % 77;
  };
  for (const number of lucky.slice(1))
    if (beats(number, winner)) winner = number;
  add("a175", line(lucky) + " 0\n", winner, `branch-comparison-${trial}`);

  // Segment-token oracle treats signs as mode assignments and reverses whole runs.
  const encrypted =
    Array.from({ length: 20 }, () => "abCD12+-"[random(8)]).join("") + "Z";
  let reverse = false,
    decrypted = "";
  for (const token of encrypted.match(/[+-]|[^+-]+/g)) {
    if (token === "+" || token === "-") reverse = token === "-";
    else decrypted += reverse ? [...token].reverse().join("") : token;
  }
  add("a177", encrypted + "\n", decrypted, `segment-tokens-${trial}`);
}

// Max-size and repeated-prefix stress cases remain small enough for bounded subprocesses.
add(
  "a089",
  "10000 5000\n" +
    line(Array(10000).fill(1)) +
    "\n" +
    line([...Array(4999).fill(1), 2]) +
    "\n",
  "not found",
  "repetitive-max-N-M",
);
add(
  "a093",
  "1000000000\n",
  "1497558338\nnot perfect",
  "upper-bound-factor-sum",
);
add(
  "a094",
  "2 2000000000\n",
  Array.from({ length: 30 }, (_, i) => 2 ** (i + 1)).join("\n"),
  "large-limit-no-overflow",
);
add("a097", "1000000\n", "1000003 1002001 1030301", "upper-bound");
add(
  "a104",
  "20\n" + line(Array(20).fill(20)) + "\n",
  "380",
  "twenty-inclusive",
);
add(
  "a104",
  "21\n" + line(Array(21).fill(20)) + "\n",
  "378",
  "twenty-one-new-tier",
);
add("a104", "40\n" + line(Array(40).fill(20)) + "\n", "720", "forty-inclusive");
// A legal path that travels upward: three vertical rails joined at alternate ends.
const upPath = Array.from({ length: 7 }, () => Array(5).fill(0));
for (let r = 0; r < 7; ++r) for (const c of [0, 2, 4]) upPath[r][c] = 1;
upPath[6][1] = 1;
upPath[0][3] = 1;
add(
  "a087",
  "7 5\n" + grid(upPath) + "\n",
  "23",
  "valid-path-with-upward-movement",
);

// a159 ambiguity evidence: moving from the unique max into either tied minimum changes output.
assert.notDeepEqual([6, 0, 3], [0, 6, 3]); // input [0,0,9], average 3, transfer 6.
// Do not assert either answer as the official expected result for this unspecified tie.

const selectedCodes = option("--codes")?.split(",");
const selected = selectedCodes
  ? lessons.filter((l) => selectedCodes.includes(l.code))
  : lessons;
if (selectedCodes)
  assert.equal(selected.length, new Set(selectedCodes).size, "unknown --codes");
assert.ok(
  [...cases.values()].reduce((n, c) => n + c.length, 0) < 400,
  "bound process count",
);
const directory = cxx
  ? await mkdtemp(path.join(tmpdir(), "toi-beginner-batch1-"))
  : null;
let total = 0;
try {
  for (const l of selected) {
    let executable;
    if (cxx) {
      const cppFile = path.join(directory, l.code + ".cpp");
      await writeFile(cppFile, l.cpp);
      executable = path.join(
        directory,
        l.code + (process.platform === "win32" ? ".exe" : ""),
      );
      const compileArgs = [
        "-std=c++17",
        "-O2",
        cppFile,
        ...(compileOnly
          ? ["-c", "-o", path.join(directory, l.code + ".o")]
          : ["-o", executable]),
      ];
      execFileSync(cxx, compileArgs, {
        timeout: 30000,
        encoding: "utf8",
        maxBuffer: 1024 * 1024,
      });
    }
    for (const testcase of cases.get(l.code)) {
      const runs = [
        ...(python ? [[python, ["-c", l.python], "Python"]] : []),
        ...(cxx && !compileOnly ? [[executable, [], "C++"]] : []),
      ];
      for (const [command, commandArgs, language] of runs) {
        const actual = execFileSync(command, commandArgs, {
          input: testcase.input,
          timeout: 10000,
          encoding: "utf8",
          maxBuffer: 4 * 1024 * 1024,
        });
        assert.equal(
          norm(actual),
          norm(testcase.output),
          `${l.code} ${language} ${testcase.label}\ninput=${testcase.input}`,
        );
      }
    }
    const count = cases.get(l.code).length;
    total += count;
    console.log(
      `${l.code}: ${count} cases ${python ? "PASS" : "prepared"}${cxx ? (compileOnly ? "; C++17 compiled" : " ; C++ runtime PASS") : ""}; ${cases
        .get(l.code)
        .map((c) => c.label)
        .join(", ")}`,
    );
  }
} finally {
  if (directory) await rm(directory, { recursive: true, force: true });
}
console.log(
  `${selected.length} lessons; ${total} deterministic cases. ${python ? "Python executed." : "Pass --python PATH to execute."}`,
);
console.log(
  "a159: public source does not specify which tied extreme box to choose; tests do not resolve that ambiguity.",
);
