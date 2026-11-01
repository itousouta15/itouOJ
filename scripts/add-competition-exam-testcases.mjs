// node scripts/add-competition-exam-testcases.mjs [--check] [--db path]
// Non-official, deterministic hidden cases. Only published examples are used
// to calibrate the reference solvers. Reruns preserve all existing case IDs.
import "dotenv/config";
import assert from "node:assert/strict";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import Database from "better-sqlite3";
import { exams, sampleOnlyNotice, customTestsNotice } from "../prisma/seed-data/competition-exams-112-114.mjs";
import { problems112 } from "./lib/competition-tests-112.mjs";
import { problems113 } from "./lib/competition-tests-113.mjs";
import { problems114 } from "./lib/competition-tests-114.mjs";

const argv = process.argv.slice(2), dbIndex = argv.indexOf("--db");
if (argv.filter((v) => v === "--db").length > 1 ||
  dbIndex !== -1 && (!argv[dbIndex + 1] || argv[dbIndex + 1].startsWith("--")) ||
  argv.some((v, i) => !["--check", "--db"].includes(v) && i !== dbIndex + 1)) {
  throw new Error("用法：node scripts/add-competition-exam-testcases.mjs [--check] [--db 資料庫路徑]");
}

const specs = [problems112, problems113, problems114];
const pending = [];
for (let year = 0; year < exams.length; year++) {
  const exam = exams[year];
  assert.equal(specs[year].length, exam.problems.length);
  for (let i = 0; i < exam.problems.length; i++) {
    const problem = exam.problems[i], { solve, inputs, explicit = [] } = specs[year][i];
    const title = `${exam.name}｜${problem.title}`;
    for (const [input, expected] of problem.samples) {
      assert.equal(solve(input), expected, `${title} 的參考解與原卷範例不一致`);
    }
    const tests = inputs.map((input) => ({ input, output: solve(input) })).concat(explicit);
    assert.ok(tests.length >= 3, `${title} 的隱藏測資不足`);
    const seen = new Set(problem.samples.map(([input]) => input));
    for (const { input, output } of tests) {
      assert.ok(typeof input === "string" && input.trim() && Buffer.byteLength(input) <= 2 * 1024 * 1024, `${title} 的輸入有誤`);
      assert.ok(typeof output === "string" && output.trim() && Buffer.byteLength(output) <= 2 * 1024 * 1024, `${title} 的輸出有誤`);
      assert.ok(!seen.has(input), `${title} 的測資輸入重複或與原卷範例相同`);
      seen.add(input);
    }
    assert.ok(tests.length + problem.samples.length <= 1000, `${title} 的測資超過評測上限`);
    pending.push({ title, tests, isFloat: year === 2 && i === 6 || year === 0 && i === 7 });
  }
}
const total = pending.reduce((n, p) => n + p.tests.length, 0);
if (argv.includes("--check")) {
  for (let year = 0, at = 0; year < exams.length; year++) {
    const tests = pending.slice(at, at + exams[year].problems.length);
    console.log(`${exams[year].name}：${tests.length} 題，${tests.reduce((n, p) => n + p.tests.length, 0)} 組自製測資（公開範例全部通過）`);
    at += tests.length;
  }
  console.log(`核對 ${total} 組隱藏測資；未修改資料庫。`);
} else {
  const url = process.env.DATABASE_URL ?? "file:./prisma/data/dev.db";
  if (dbIndex < 0 && !url.startsWith("file:")) throw new Error("請指定 SQLite --db 路徑");
  const path = resolve(dbIndex < 0 ? url.slice(5) : argv[dbIndex + 1]);
  const db = new Database(path, { fileMustExist: true });
  try {
    db.pragma("foreign_keys = ON");
    const backup = join(tmpdir(), `itouoj-before-exam-testcases-${Date.now()}.db`);
    await db.backup(backup);
    console.log(`匯入前備份：${backup}`);

    const findProblem = db.prepare("SELECT id, statement FROM Problem WHERE title=? AND type='PROGRAMMING'");
    const findSubtask = db.prepare('SELECT id, checkMode FROM Subtask WHERE problemId=? ORDER BY "order"');
    const createSubtask = db.prepare('INSERT INTO Subtask (problemId, "order", points, checkMode) VALUES (?, 1, 100, \'float\')');
    const assignPublicSamples = db.prepare('UPDATE TestCase SET subtaskId=? WHERE problemId=? AND subtaskId IS NULL');
    const existing = db.prepare("SELECT output, isSample FROM TestCase WHERE problemId=? AND input=? LIMIT 1");
    const lastOrder = db.prepare('SELECT COALESCE(MAX("order"),0) AS value FROM TestCase WHERE problemId=?');
    const insert = db.prepare('INSERT INTO TestCase (problemId, subtaskId, input, output, isSample, "order") VALUES (?, ?, ?, ?, 0, ?)');
    const updateStatement = db.prepare("UPDATE Problem SET statement=? WHERE id=?");
    const result = db.transaction(() => {
      let added = 0, skipped = 0, refreshed = 0;
      for (const { title, tests, isFloat } of pending) {
        const problem = findProblem.get(title);
        assert.ok(problem, `尚未匯入題目：${title}，請先執行 import-competition-exams-112-114.mjs`);
        let subtasks = findSubtask.all(problem.id);
        if (isFloat && subtasks.length === 0) {
          const id = Number(createSubtask.run(problem.id).lastInsertRowid);
          assignPublicSamples.run(id, problem.id);
          subtasks = [{ id, checkMode: "float" }];
        }
        assert.ok(isFloat ? subtasks.length === 1 && subtasks[0].checkMode === "float" : subtasks.length === 0,
          `${title} 的子題／比對方式不符合預期，請先檢查正式站設定`);
        let order = lastOrder.get(problem.id).value;
        for (const { input, output } of tests) {
          const found = existing.get(problem.id, input);
          if (found) {
            assert.equal(found.isSample, 0, `${title}：隱藏測資不應與公開範例重複`);
            assert.equal(found.output, output, `${title}：現有測資答案與參考解不同`);
            skipped++;
          } else {
            insert.run(problem.id, isFloat ? subtasks[0].id : null, input, output, ++order);
            added++;
          }
        }
        if (problem.statement.includes(sampleOnlyNotice)) {
          updateStatement.run(problem.statement.replace(sampleOnlyNotice, customTestsNotice), problem.id);
          refreshed++;
        }
      }
      return { added, skipped, refreshed };
    }).immediate();
    console.log(`完成：新增 ${result.added} 組、已存在 ${result.skipped} 組；更新 ${result.refreshed} 題評測範圍說明。`);
  } finally {
    db.close();
  }
}
