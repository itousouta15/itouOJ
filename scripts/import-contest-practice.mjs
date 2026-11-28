// --check does not access a database; importing requires an explicit SQLite path.
import Database from "better-sqlite3";
import { resolve, join } from "node:path";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";
import { preparePracticeProblems, importPracticeProblems } from "./lib/import-contest-practice.mjs";

const args = process.argv.slice(2);
const check = args.length === 1 && args[0] === "--check";
const write = args.length === 2 && args[0] === "--db" && args[1] && !args[1].startsWith("--");
if (!check && !write) throw new Error("用法：node scripts/import-contest-practice.mjs --check | --db 明確的 SQLite 路徑");

const problems = preparePracticeProblems();
if (check) {
  for (const p of problems) console.log(`${p.title}：${p.samples.length} 組公開範例、${p.cases.length - p.samples.length} 組隱藏測資`);
  console.log(`核對完成：${problems.length} 題；未開啟或修改資料庫。`);
} else {
  const db = new Database(resolve(args[1]), { fileMustExist: true });
  try {
    db.pragma("foreign_keys = ON");
    const backup = join(tmpdir(), `itouoj-before-contest-practice-${randomUUID()}.db`);
    await db.backup(backup);
    console.log(`匯入前備份：${backup}`);
    const result = importPracticeProblems(db, problems);
    for (const p of result.created) console.log(`新增 ${p.code} #${p.id} ${p.title}（範例 ${p.samples}、隱藏 ${p.hidden}）`);
    console.log(`完成：新增 ${result.created.length} 題、保留既有 ${result.skipped.length} 題。`);
  } finally { db.close(); }
}
