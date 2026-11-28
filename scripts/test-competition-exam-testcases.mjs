import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import Database from "better-sqlite3";
import { exams } from "../prisma/seed-data/competition-exams-112-114.mjs";
import { problems112 } from "./lib/competition-tests-112.mjs";
import { problems113 } from "./lib/competition-tests-113.mjs";
import { problems114 } from "./lib/competition-tests-114.mjs";

const root = resolve(import.meta.dirname, "..");
const all = [problems112, problems113, problems114];

test("all 29 reference solutions reproduce the published examples", () => {
  assert.equal(exams.reduce((sum, exam) => sum + exam.problems.length, 0), 29);
  for (let year = 0; year < 3; year++) for (let i = 0; i < exams[year].problems.length; i++) {
    for (const [input, output] of exams[year].problems[i].samples) {
      assert.equal(all[year][i].solve(input), output, `${year}/${i}: ${exams[year].problems[i].title}`);
    }
  }
});

test("independent boundary expectations detect broken tie, precision and output logic", () => {
  assert.equal(problems112[0].solve("100 1200 1"), "0.00% 1200.00 0.00");
  assert.equal(problems112[1].solve("2\n2\n0 10\n2\n5 15"), "1 66.67%\n2 33.33%");
  assert.equal(problems112[3].solve("3"), "3");
  assert.equal(problems112[4].solve("2\n2\n1 2\n2 1"), "indeterminable");
  assert.equal(problems113[4].solve("0.1\n0.1"), "0.0000001010");
  assert.equal(problems113[6].solve("3\n0 0 0"), "0 0 0");
  assert.equal(problems114[0].solve("8\n))))(((("), "8");
  assert.equal(problems114[1].solve("2 1\n1 0\n1000000000 0"), "999999999");
  assert.equal(problems114[2].solve("2 1 1 2\n10 0\n1 2 -5\n1 1"), "5");
  assert.equal(problems114[3].solve("1\n500 0 0 500"), "1\n1 2");
  assert.equal(problems114[5].solve("2 1 4\n1 2 10 1 3"), "-1 10 10 -1");
  assert.equal(problems114[6].solve("4 2\n0 0\n2 2\n0 2\n2 0"), "4.0000000000");
  assert.equal(problems114[7].solve("2\n00\n00\n1\n0"), "-1");
  assert.equal(problems114[8].solve("4 4\n1 5\n1 5\n1 5\n1 5"), "5 10 15 20");
});

test("voting samples contain m space-separated candidate numbers on every ballot", () => {
  const voting = exams[0].problems[4];
  assert.match(voting.input, /空格分隔/);
  for (const [input, output] of voting.samples) {
    const [m, n, ...ballots] = input.split("\n");
    assert.equal(ballots.length, Number(n));
    for (const ballot of ballots) {
      assert.deepEqual(ballot.split(" ").map(Number).sort((a, b) => a - b),
        Array.from({ length: Number(m) }, (_, i) => i + 1));
    }
    assert.equal(problems112[4].solve(input), output);
  }
});

function fixture(path, missingLast = false) {
  const db = new Database(path);
  db.exec(`CREATE TABLE Problem(id INTEGER PRIMARY KEY, title TEXT NOT NULL, type TEXT NOT NULL DEFAULT 'PROGRAMMING',
      statement TEXT NOT NULL, difficulty TEXT, timeLimitMs INTEGER, memoryLimitMb INTEGER, isPublic INTEGER,
      problemCode TEXT, "order" INTEGER, createdAt TEXT);
    CREATE TABLE TestCase(id INTEGER PRIMARY KEY, problemId INTEGER NOT NULL, subtaskId INTEGER, input TEXT NOT NULL,
      output TEXT NOT NULL, isSample INTEGER NOT NULL, "order" INTEGER NOT NULL);
    CREATE TABLE Subtask(id INTEGER PRIMARY KEY, problemId INTEGER NOT NULL, "order" INTEGER NOT NULL,
      points INTEGER NOT NULL, checkMode TEXT NOT NULL);`);
  const problem = db.prepare("INSERT INTO Problem(title,statement) VALUES (?,?)");
  const sample = db.prepare('INSERT INTO TestCase(problemId,input,output,isSample,"order") VALUES (?,?,?,?,?)');
  for (const [year, exam] of exams.entries()) for (const [index, p] of exam.problems.entries()) {
    if (missingLast && year === 2 && index === 8) continue;
    const id = Number(problem.run(`${exam.name}｜${p.title}`,
      `## 原始試題與評測範圍\n\n目前只有原卷公開範例可作為評測資料，**AC 僅表示通過公開範例，不代表通過正式競賽測資**。`).lastInsertRowid);
    const float = year === 2 && index === 6;
    let subtaskId = null;
    if (float) subtaskId = Number(db.prepare("INSERT INTO Subtask(problemId,\"order\",points,checkMode) VALUES (?,1,100,'float')").run(id).lastInsertRowid);
    for (const [i, [input, output]] of p.samples.entries()) {
      const row = sample.run(id, input, output, 1, i + 1);
      if (float) db.prepare("UPDATE TestCase SET subtaskId=? WHERE id=?").run(subtaskId, row.lastInsertRowid);
    }
  }
  return db;
}

function run(path) {
  return spawnSync(process.execPath, ["scripts/add-competition-exam-testcases.mjs", "--db", path], {
    cwd: root, encoding: "utf8", timeout: 120000,
  });
}

test("refresh corrects existing a852 samples in place", () => {
  const directory = mkdtempSync(join(tmpdir(), "itouoj-voting-refresh-"));
  try {
    const dbPath = join(directory, "exams.db"), db = fixture(dbPath);
    const problemId = db.prepare("SELECT id FROM Problem WHERE title LIKE '%總統大選排序複選制'").get().id;
    const samples = db.prepare('SELECT id, input, output FROM TestCase WHERE problemId=? AND isSample=1 ORDER BY "order"').all(problemId);
    const oldInputs = samples.map(({ input }) => input.split("\n").map((line, i) => i < 2 ? line : line.replaceAll(" ", "")).join("\n"));
    const update = db.prepare("UPDATE TestCase SET input=? WHERE id=?");
    for (let i = 0; i < samples.length; i++) update.run(oldInputs[i], samples[i].id);

    const refresh = () => spawnSync(process.execPath,
      ["scripts/import-competition-exams-112-114.mjs", "--refresh", "--only", exams[0].name + "｜" + exams[0].problems[4].title, "--db", dbPath],
      { cwd: root, encoding: "utf8", timeout: 120000 });
    const first = refresh();
    assert.equal(first.status, 0, first.stderr);
    assert.match(first.stdout, /新增 0 題、更新 1 題、跳過 0 題/);
    assert.deepEqual(db.prepare('SELECT id, input, output FROM TestCase WHERE problemId=? AND isSample=1 ORDER BY "order"').all(problemId), samples);
    assert.equal(db.prepare("SELECT COUNT(*) AS n FROM TestCase WHERE problemId=?").get(problemId).n, samples.length);
    assert.match(db.prepare("SELECT statement FROM Problem WHERE id=?").get(problemId).statement, /m 個以空格分隔的整數/);
    const second = refresh();
    assert.equal(second.status, 0, second.stderr);
    assert.equal(db.prepare("SELECT COUNT(*) AS n FROM TestCase WHERE problemId=?").get(problemId).n, samples.length);
    db.close();
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("import is atomic, repeatable, private and preserves all original public samples", () => {
  const directory = mkdtempSync(join(tmpdir(), "itouoj-exam-cases-"));
  try {
    const missing = fixture(join(directory, "missing.db"), true);
    const failed = run(join(directory, "missing.db"));
    assert.notEqual(failed.status, 0);
    assert.match(failed.stderr, /尚未匯入題目/);
    assert.equal(missing.prepare("SELECT COUNT(*) AS n FROM TestCase WHERE isSample=0").get().n, 0);
    missing.close();

    const dbPath = join(directory, "valid.db"), db = fixture(dbPath);
    const first = run(dbPath);
    assert.equal(first.status, 0, first.stderr);
    assert.match(first.stdout, /新增 127 組/);
    assert.equal(db.prepare("SELECT COUNT(*) AS n FROM TestCase WHERE isSample=0").get().n, 127);
    assert.equal(db.prepare("SELECT COUNT(*) AS n FROM TestCase WHERE isSample=1").get().n, 57);
    assert.equal(db.prepare("SELECT COUNT(*) AS n FROM Subtask WHERE checkMode='float'").get().n, 2);
    assert.equal(db.prepare("SELECT COUNT(*) AS n FROM TestCase WHERE subtaskId IS NOT NULL").get().n > 4, true);
    assert.equal(db.prepare("SELECT COUNT(*) AS n FROM Problem WHERE statement LIKE '%非官方測資%'").get().n, 29);
    const last = db.prepare("SELECT MAX(id) AS id FROM TestCase").get().id;
    const second = run(dbPath);
    assert.equal(second.status, 0, second.stderr);
    assert.match(second.stdout, /新增 0 組、已存在 127 組/);
    assert.equal(db.prepare("SELECT MAX(id) AS id FROM TestCase").get().id, last);
    db.close();
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
