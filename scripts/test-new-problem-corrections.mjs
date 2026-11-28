import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { test } from "node:test";
import Database from "better-sqlite3";
import { exams } from "../prisma/seed-data/competition-exams-112-114.mjs";

const name = "20261103000000_clarify_three_color_hanoi";
const root = new URL("../prisma/migrations/", import.meta.url);
const migration = await readFile(new URL(`${name}/migration.sql`, root), "utf8");
const legacy = JSON.parse(await readFile(new URL("./fixtures/new-problem-lessons/a853-legacy.json", import.meta.url), "utf8"));
const description = exams[0].problems.find((p) => p.title === "三色河內塔的最少移動次數").description;
const earlier = await Promise.all((await readdir(root, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory() && entry.name < name).sort((a, b) => a.name.localeCompare(b.name))
  .map((entry) => readFile(new URL(`${entry.name}/migration.sql`, root), "utf8")));

function database(t) {
  const db = new Database(":memory:"); t.after(() => db.close());
  db.pragma("foreign_keys = ON");
  for (const sql of earlier) db.exec(sql);
  return db;
}

test("number-order clarification changes only exact imported statements and preserves identities, samples and custom edits", (t) => {
  const db = database(t);
  const rows = [...legacy.statements, legacy.statements[0] + "\n管理員自訂補充", legacy.statements[0], legacy.statements[0]];
  const insert = db.prepare('INSERT INTO Problem (title,statement,type,"order",problemCode,isPublic,timeLimitMs,memoryLimitMb) VALUES (?,?,?,?,?,?,?,?)');
  rows.forEach((statement, i) => {
    const id = Number(insert.run(i === 4 ? "同文字的自訂題目" : legacy.title, statement, i === 3 ? "RECOGNITION" : "PROGRAMMING", i + 1, `p00${i + 1}`, i % 2, 1947, 123).lastInsertRowid);
    db.prepare('INSERT INTO TestCase (problemId,input,output,isSample,"order") VALUES (?,?,?,?,?)').run(id, "3", "5", 1, 1);
  });
  const before = db.prepare("SELECT * FROM Problem ORDER BY id").all();
  const samples = db.prepare("SELECT * FROM TestCase ORDER BY id").all();
  db.exec(migration);
  const expected = before.map((row, i) => i < 2 ? { ...row, statement: row.statement.replace(legacy.description, description) } : row);
  assert.deepEqual(db.prepare("SELECT * FROM Problem ORDER BY id").all(), expected);
  assert.deepEqual(db.prepare("SELECT * FROM TestCase ORDER BY id").all(), samples);
  db.exec(migration);
  assert.deepEqual(db.prepare("SELECT * FROM Problem ORDER BY id").all(), expected);
  assert.match(description, /即使同大小也必須遵守編號順序/);
  assert.match(description, /編號較大的環不得放在編號較小的環上/);
});

test("migration is safe on empty databases and LF/CRLF source checkouts", (t) => {
  const db = database(t); db.exec(migration);
  db.prepare('INSERT INTO Problem (title,statement,type,"order",problemCode) VALUES (?,?,\'PROGRAMMING\',1,\'a853\')').run(legacy.title, legacy.statements[1].replaceAll("\n", "\r\n"));
  db.exec(migration.replace(/\r?\n/g, "\r\n"));
  assert.equal(db.prepare("SELECT statement FROM Problem").get().statement, legacy.statements[1].replace(legacy.description, description));
});
