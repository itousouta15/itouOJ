import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";
import { practiceProblems, practiceNotice } from "../prisma/seed-data/contest-practice-problems.mjs";
import { preparePracticeProblems, importPracticeProblems, validatePracticeInput } from "./lib/import-contest-practice.mjs";
import { solvers } from "./lib/contest-practice-solvers.mjs";

const prepared = preparePracticeProblems();

test("six original practice problems have bounded, runnable public and hidden cases", () => {
  assert.equal(prepared.length, 6);
  for (const p of prepared) {
    assert.match(p.statement, /本站自編/);
    assert.ok(p.statement.includes(practiceNotice));
    assert.ok(p.cases.filter((c) => c.isSample).length >= 2);
    assert.ok(p.cases.filter((c) => !c.isSample).length >= 4);
    for (const c of p.cases) {
      validatePracticeInput(p.key, c.input);
      assert.equal(solvers[p.key](c.input), c.output);
    }
  }
  assert.equal(practiceProblems.length, prepared.length);
  assert.throws(() => validatePracticeInput("rectangle", "1 1\n0\n1\n1 1 2 1"));
  assert.throws(() => validatePracticeInput("capacity", "2 3\n1 2"));
  assert.throws(() => validatePracticeInput("prerequisites", "2 1\n1 3"));
  assert.throws(() => validatePracticeInput("route", "2 1 1 2\n1 2 0"));
  assert.throws(() => validatePracticeInput("ascent", "2\n1"));
  assert.throws(() => validatePracticeInput("equipment", "1 1\n0 1"));
});

test("rectangle queries match direct summation including negative cells", () => {
  for (let seed = 0; seed < 60; seed++) {
    const grid = Array.from({ length: 4 }, (_, r) => Array.from({ length: 5 }, (_, c) => (seed + r * 7 + c * 3) % 11 - 5));
    const queries = [];
    for (let r1 = 1; r1 <= 4; r1++) for (let c1 = 1; c1 <= 5; c1++) {
      queries.push([r1, c1, 4, 5]);
      queries.push([1, 1, r1, c1]);
    }
    const input = [`4 5`, ...grid.map((row) => row.join(" ")), queries.length, ...queries.map((q) => q.join(" "))].join("\n");
    const expected = queries.map(([r1, c1, r2, c2]) => {
      let sum = 0;
      for (let r = r1 - 1; r < r2; r++) for (let c = c1 - 1; c < c2; c++) sum += grid[r][c];
      return String(sum);
    });
    assert.deepEqual(solvers.rectangle(input).split("\n"), expected);
  }
});

test("capacity matches exhaustive contiguous partitions", () => {
  for (let n = 1; n <= 8; n++) for (let seed = 0; seed < 25; seed++) {
    const weights = Array.from({ length: n }, (_, i) => 1 + (seed * 7 + i * 13) % 11);
    for (let k = 1; k <= n; k++) {
      let best = Infinity;
      for (let mask = 0; mask < 2 ** (n - 1); mask++) {
        if (mask.toString(2).replaceAll("0", "").length + 1 > k) continue;
        let load = 0, maximum = 0;
        for (let i = 0; i < n; i++) {
          load += weights[i];
          if (i === n - 1 || mask & (1 << i)) { maximum = Math.max(maximum, load); load = 0; }
        }
        best = Math.min(best, maximum);
      }
      assert.equal(solvers.capacity(`${n} ${k}\n${weights.join(" ")}`), String(best));
    }
  }
});

test("topological order is lexicographically first, or detects a cycle", () => {
  for (let seed = 0; seed < 100; seed++) {
    const n = 5, edges = [];
    for (let u = 1; u <= n; u++) for (let v = 1; v <= n; v++) if ((seed * (u + 3) + u * 7 + v * 11) % 9 === 0) edges.push([u, v]);
    const solutions = [];
    const visit = (path, used) => {
      if (path.length === n) { solutions.push(path.join(" ")); return; }
      for (let v = 1; v <= n; v++) if (!used.has(v) && edges.every(([u, to]) => to !== v || used.has(u))) {
        visit([...path, v], new Set([...used, v]));
      }
    };
    visit([], new Set());
    const input = [`${n} ${edges.length}`, ...edges.map((e) => e.join(" "))].join("\n");
    assert.equal(solvers.prerequisites(input), solutions[0] ?? "-1");
  }
  assert.equal(solvers.prerequisites("3 3\n1 2\n1 2\n2 3"), "1 2 3");
});

test("shortest path matches independent Floyd-Warshall for small directed graphs", () => {
  for (let seed = 0; seed < 50; seed++) {
    const n = 7, edges = [];
    for (let u = 1; u <= n; u++) for (let v = 1; v <= n; v++) {
      if ((seed + u * 3 + v * 5) % 4 === 0) edges.push([u, v, 1 + (seed + u + v) % 19]);
    }
    const d = Array.from({ length: n + 1 }, () => Array(n + 1).fill(Infinity));
    for (let u = 1; u <= n; u++) d[u][u] = 0;
    for (const [u, v, w] of edges) d[u][v] = Math.min(d[u][v], w);
    for (let k = 1; k <= n; k++) for (let u = 1; u <= n; u++) for (let v = 1; v <= n; v++) d[u][v] = Math.min(d[u][v], d[u][k] + d[k][v]);
    for (const [s, t] of [[1, 7], [4, 1], [3, 3]]) {
      const input = [`${n} ${edges.length} ${s} ${t}`, ...edges.map((e) => e.join(" "))].join("\n");
      assert.equal(solvers.route(input), Number.isFinite(d[s][t]) ? String(d[s][t]) : "-1");
    }
  }
});

test("LIS and 0/1 knapsack match small independent dynamic programs and enumeration", () => {
  for (let seed = 0; seed < 100; seed++) {
    const values = Array.from({ length: 18 }, (_, i) => (seed * (i + 3) + i * i) % 17 - 8);
    const dp = values.map(() => 1);
    for (let i = 0; i < values.length; i++) for (let j = 0; j < i; j++) if (values[j] < values[i]) dp[i] = Math.max(dp[i], dp[j] + 1);
    assert.equal(solvers.ascent(`18\n${values.join(" ")}`), String(Math.max(...dp)));

    const items = Array.from({ length: 9 }, (_, i) => [1 + (seed + i * 5) % 9, (seed * 7 + i * 3) % 17]);
    let best = 0;
    for (let mask = 0; mask < 2 ** items.length; mask++) {
      let weight = 0, value = 0;
      items.forEach(([w, v], i) => { if (mask & (1 << i)) { weight += w; value += v; } });
      if (weight <= 20) best = Math.max(best, value);
    }
    assert.equal(solvers.equipment(["9 20", ...items.map((item) => item.join(" "))].join("\n")), String(best));
  }
});

function database(t) {
  const db = new Database(":memory:");
  t.after(() => db.close());
  db.pragma("foreign_keys = ON");
  const root = new URL("../prisma/migrations/", import.meta.url);
  for (const entry of readdirSync(root, { withFileTypes: true }).filter((e) => e.isDirectory()).sort((a, b) => a.name.localeCompare(b.name))) {
    db.exec(readFileSync(new URL(`${entry.name}/migration.sql`, root), "utf8"));
  }
  return db;
}

test("import creates six public problems with private cases and is idempotent", (t) => {
  const db = database(t);
  db.prepare('INSERT INTO Problem (title, statement, problemCode, "order") VALUES (?, ?, ?, ?)').run("既有題", "舊題", "a999", 999);
  const first = importPracticeProblems(db, prepared);
  assert.deepEqual(first.created.map((p) => p.code), ["b001", "b002", "b003", "b004", "b005", "b006"]);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM Problem WHERE title LIKE '競賽練習｜%' AND isPublic=1").get().n, 6);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM TestCase WHERE isSample=1").get().n, 12);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM TestCase WHERE isSample=0").get().n, prepared.reduce((sum, p) => sum + p.cases.length - p.samples.length, 0));
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM ProblemTag WHERE tagId=(SELECT id FROM Tag WHERE name='競賽練習')").get().n, 6);
  const snapshot = db.prepare("SELECT id, input, output FROM TestCase ORDER BY id").all();
  db.prepare("UPDATE Problem SET statement='管理員修改' WHERE id=?").run(first.created[0].id);
  const second = importPracticeProblems(db, prepared);
  assert.equal(second.created.length, 0);
  assert.equal(second.skipped.length, 6);
  assert.equal(db.prepare("SELECT statement FROM Problem WHERE id=?").get(first.created[0].id).statement, "管理員修改");
  assert.deepEqual(db.prepare("SELECT id, input, output FROM TestCase ORDER BY id").all(), snapshot);
});

test("a partial insertion failure rolls back all problems, cases and tags", (t) => {
  const db = database(t);
  db.exec("CREATE TRIGGER fail_practice BEFORE INSERT ON Problem WHEN NEW.title LIKE '%裝備選擇%' BEGIN SELECT RAISE(ABORT,'fixture failure'); END;");
  assert.throws(() => importPracticeProblems(db, prepared), /fixture failure/);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM Problem").get().n, 0);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM TestCase").get().n, 0);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM Tag WHERE name='競賽練習'").get().n, 0);
});

test("CLI check cannot open the configured production DB; writes require --db", () => {
  const script = fileURLToPath(new URL("./import-contest-practice.mjs", import.meta.url));
  const options = { encoding: "utf8", timeout: 120000, env: { ...process.env, DATABASE_URL: "file:/nonexistent/production.db" } };
  const checked = spawnSync(process.execPath, [script, "--check"], options);
  assert.equal(checked.status, 0, checked.stderr);
  assert.match(checked.stdout, /未開啟或修改資料庫/);
  const invalid = spawnSync(process.execPath, [script], options);
  assert.notEqual(invalid.status, 0);
  assert.match(invalid.stderr, /明確的 SQLite 路徑/);
});
