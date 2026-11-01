// node scripts/import-competition-exams-112-114.mjs [--check] [--refresh] [--db path]
// 題目與原卷一同進版控；只匯入原卷公開範例，不宣稱有完整評測資料。
import "dotenv/config";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import Database from "better-sqlite3";
import { exams } from "../prisma/seed-data/competition-exams-112-114.mjs";
import { nextProblemCode } from "./lib/problemCode.mjs";

const args = process.argv.slice(2);
const index = args.indexOf("--db");
if (args.filter((arg) => arg === "--db").length > 1 ||
    (index !== -1 && (!args[index + 1] || args[index + 1].startsWith("--"))) ||
    args.some((arg, i) => !["--check", "--refresh", "--db"].includes(arg) && i !== index + 1) ||
    (args.includes("--check") && args.includes("--refresh"))) {
  throw new Error("用法：node scripts/import-competition-exams-112-114.mjs [--check] [--refresh] [--db 資料庫路徑]");
}

const titles = new Set();
let total = 0;
for (const exam of exams) {
  const pdfPath = resolve("public", exam.pdf.slice(1));
  assert.ok(existsSync(pdfPath), `缺少原卷：${pdfPath}`);
  assert.equal(readFileSync(pdfPath).subarray(0, 5).toString(), "%PDF-", `PDF 格式錯誤：${pdfPath}`);
  for (const problem of exam.problems) {
    const title = `${exam.name}｜${problem.title}`;
    assert.ok(!titles.has(title), `題名重複：${title}`);
    titles.add(title);
    assert.ok(Number.isInteger(problem.page) && problem.page > 0);
    assert.ok([problem.description, problem.input, problem.output, problem.limits].every((s) => typeof s === "string" && s.trim()));
    assert.ok(problem.samples.length > 0, `沒有範例：${title}`);
    for (const [input, output] of problem.samples) {
      assert.ok(typeof input === "string" && input.trim() && typeof output === "string" && output.trim(), `範例不完整：${title}`);
    }
    total++;
  }
  console.log(`${exam.name}：${exam.problems.length} 題，${pdfPath}`);
}
assert.equal(total, 29, "預期共 29 題");
if (args.includes("--check")) {
  console.log(`核對完成：${total} 題及三份原卷；未修改資料庫。`);
} else {
  const url = process.env.DATABASE_URL ?? "file:./prisma/data/dev.db";
  if (index === -1 && !url.startsWith("file:")) throw new Error("請用 --db 指定 SQLite 資料庫");
  const dbPath = resolve(index === -1 ? url.slice(5) : args[index + 1]);
  const db = new Database(dbPath, { fileMustExist: true });
  try {
    db.pragma("foreign_keys = ON");
    const backup = join(tmpdir(), `itouoj-before-competition-exams-${Date.now()}.db`);
    await db.backup(backup);
    console.log(`匯入前備份：${backup}`);
    const find = db.prepare("SELECT id, problemCode FROM Problem WHERE title = ? AND type = 'PROGRAMMING'");
    const maxCode = db.prepare('SELECT MAX(problemCode) AS code FROM Problem WHERE type = \'PROGRAMMING\'');
    const maxOrder = db.prepare('SELECT COALESCE(MAX("order"), 0) AS value FROM Problem WHERE type = \'PROGRAMMING\'');
    const insert = db.prepare(`INSERT INTO Problem
      (title, statement, difficulty, timeLimitMs, memoryLimitMb, isPublic, problemCode, "order", createdAt)
      VALUES (?, ?, ?, 2000, 256, 1, ?, ?, datetime('now'))`);
    const subtask = db.prepare(`INSERT INTO Subtask (problemId, "order", points, checkMode) VALUES (?, 1, 100, 'float')`);
    const test = db.prepare(`INSERT INTO TestCase (problemId, subtaskId, input, output, isSample, "order") VALUES (?, ?, ?, ?, 1, ?)`);
    const refreshStatement = db.prepare("UPDATE Problem SET statement = ? WHERE id = ?");
    const findTest = db.prepare("SELECT id FROM TestCase WHERE problemId = ? AND input = ? AND output = ?");
    const findSubtask = db.prepare('SELECT id FROM Subtask WHERE problemId = ? ORDER BY "order" LIMIT 1');
    const nextTestOrder = db.prepare('SELECT COALESCE(MAX("order"), 0) AS value FROM TestCase WHERE problemId = ?');
    const result = db.transaction(() => {
      let code = nextProblemCode(maxCode.get().code);
      let order = maxOrder.get().value;
      const created = [], skipped = [], refreshed = [];
      for (const exam of exams) for (const p of exam.problems) {
        const title = `${exam.name}｜${p.title}`;
        const statement = [
          `## 題目描述\n\n${p.description}`,
          `## 輸入格式\n\n${p.input}`,
          `## 輸出格式\n\n${p.output}`,
          `## 限制\n\n${p.limits}`,
          `## 原始試題與評測範圍\n\n[閱讀「${exam.name}」原卷第 ${p.page} 頁（含圖表、評分細節）](${exam.pdf}#page=${p.page})。\n\n目前只有原卷公開範例可作為評測資料，**AC 僅表示通過公開範例，不代表通過正式競賽測資**。`,
        ].join("\n\n");
        const existing = find.get(title);
        if (existing) {
          if (!args.includes("--refresh")) { skipped.push({ title, ...existing }); continue; }
          refreshStatement.run(statement, existing.id);
          let missing = 0;
          let testOrder = nextTestOrder.get(existing.id).value;
          const subtaskId = findSubtask.get(existing.id)?.id ?? null;
          for (const [input, output] of p.samples) {
            if (findTest.get(existing.id, input, output)) continue;
            test.run(existing.id, subtaskId, input, output, ++testOrder);
            missing++;
          }
          refreshed.push({ title, missing });
          continue;
        }
        const id = Number(insert.run(title, statement, p.difficulty, code, ++order).lastInsertRowid);
        const subtaskId = exam.pdf === "/exams/114-national.pdf" && p.title.startsWith("G.")
          ? Number(subtask.run(id).lastInsertRowid) : null;
        p.samples.forEach(([input, output], i) => test.run(id, subtaskId, input, output, i + 1));
        created.push({ title, id, code, samples: p.samples.length });
        code = nextProblemCode(code);
      }
      return { created, skipped, refreshed };
    }).immediate();
    for (const p of result.created) console.log(`新增 ${p.code} #${p.id} ${p.title}（${p.samples} 組公開範例）`);
    for (const p of result.refreshed) console.log(`更新 ${p.title}（補 ${p.missing} 組範例）`);
    console.log(`完成：新增 ${result.created.length} 題、更新 ${result.refreshed.length} 題、跳過 ${result.skipped.length} 題。`);
  } finally {
    db.close();
  }
}
