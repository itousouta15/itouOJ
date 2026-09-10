// 匯入「識讀」歷屆試題（prisma/seed-data/recognition/*.json）。
//
// 識別題存進 Problem 表（type = 'RECOGNITION'），並依 JSON 的 source（場次）
// 建立／掛上「識讀群集」（RecognitionCluster）。與實作題共用題目系統，
// 可掛課程/比賽、記錄提交與進度。
//
//   node scripts/import-recognition-questions.mjs            匯入 dev.db
//   node scripts/import-recognition-questions.mjs --db oj.db 匯入正式站資料庫
//   node scripts/import-recognition-questions.mjs --dry-run  只驗證，不寫入
//
// 同一標題已存在時會略過建立，但仍會把還沒有群集的題目補掛上群集；
// 重跑不會建立重複題目，也不會覆蓋管理員手動調整過的群集。
// JSON 格式：{ "source": "APCS 2021/01", "paper": "A 卷",
//   "questions": [ { number, category, question, code, options, answerIndex,
//   explanation } ] }

import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

const argv = process.argv.slice(2);
function flag(name, fallback) {
  const i = argv.indexOf("--" + name);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--")
    ? argv[i + 1]
    : fallback;
}

const dryRun = argv.includes("--dry-run");
const dbPath = flag("db", (process.env.DATABASE_URL ?? "file:./dev.db").replace(/^file:/, ""));
const dataDir = path.resolve("prisma/seed-data/recognition");

if (!fs.existsSync(dataDir)) {
  console.error(`找不到資料夾：${dataDir}`);
  process.exit(1);
}

function validateQuestion(q, file, index) {
  const problems = [];
  const where = `${path.basename(file)} #${q?.number ?? index + 1}`;
  if (typeof q?.question !== "string" || q.question.trim() === "") {
    problems.push(`${where}：question 不能是空的`);
  }
  if (q?.code != null && typeof q.code !== "string") {
    problems.push(`${where}：code 必須是字串`);
  }
  if (typeof q?.category !== "string" || q.category.trim() === "") {
    problems.push(`${where}：category 不能是空的`);
  }
  if (!Array.isArray(q?.options) || q.options.length < 2 || q.options.length > 8) {
    problems.push(`${where}：options 必須是 2~8 個`);
  } else if (q.options.some((o) => typeof o !== "string" || o.trim() === "")) {
    problems.push(`${where}：有選項是空的`);
  }
  if (
    !Number.isInteger(q?.answerIndex) ||
    (Array.isArray(q?.options) &&
      (q.answerIndex < 0 || q.answerIndex >= q.options.length))
  ) {
    problems.push(`${where}：answerIndex 超出範圍`);
  }
  return problems;
}

const files = fs
  .readdirSync(dataDir)
  .filter((f) => f.endsWith(".json"))
  .sort();

if (files.length === 0) {
  console.error(`資料夾裡沒有 JSON：${dataDir}`);
  process.exit(1);
}

const db = dryRun ? null : new Database(dbPath);
if (db) db.pragma("foreign_keys = ON");

const findCluster = db
  ? db.prepare("SELECT id FROM RecognitionCluster WHERE title = ?")
  : null;
const insertCluster = db
  ? db.prepare(
      `INSERT INTO RecognitionCluster (title, description, isPublic, "order", createdAt)
       VALUES (?, '', 1, ?, datetime('now'))`
    )
  : null;
let nextClusterOrder = db
  ? (db.prepare('SELECT COALESCE(MAX("order"), -1) + 1 AS n FROM RecognitionCluster').get().n ?? 0)
  : 0;

const exists = db
  ? db.prepare(
      "SELECT id FROM Problem WHERE type = 'RECOGNITION' AND title = ?"
    )
  : null;
const linkCluster = db
  ? db.prepare(
      "UPDATE Problem SET clusterId = ? WHERE id = ? AND clusterId IS NULL"
    )
  : null;
let nextOrder = db
  ? (db.prepare("SELECT COALESCE(MAX(\"order\"), -1) + 1 AS n FROM Problem WHERE type = 'RECOGNITION'").get().n ?? 0)
  : 0;
const insert = db
  ? db.prepare(
      `INSERT INTO Problem
         (title, statement, type, code, options, answerIndex, explanation,
          paper, sourceNumber, category, clusterId, isPublic, "order", createdAt)
       VALUES (?, ?, 'RECOGNITION', ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, datetime('now'))`
    )
  : null;

const insertAll = db
  ? db.transaction((rows) => {
      for (const r of rows) {
        insert.run(
          r.title,
          r.statement,
          r.code,
          JSON.stringify(r.options),
          r.answerIndex,
          r.explanation,
          r.paper,
          r.sourceNumber,
          r.category,
          r.clusterId,
          r.order
        );
      }
    })
  : null;

let totalAdded = 0;
let totalSkipped = 0;
let totalLinked = 0;
let totalInvalid = 0;
const seen = new Set();

for (const file of files) {
  const fullPath = path.join(dataDir, file);
  let data;
  try {
    data = JSON.parse(fs.readFileSync(fullPath, "utf8"));
  } catch (e) {
    console.error(`跳過 ${file}：JSON 解析失敗（${e.message}）`);
    totalInvalid++;
    continue;
  }

  const source = typeof data.source === "string" ? data.source.trim() : "";
  if (!source) {
    console.error(`跳過 ${file}：缺少 source（群集名稱）`);
    totalInvalid++;
    continue;
  }
  const paper = typeof data.paper === "string" && data.paper.trim()
    ? data.paper.trim()
    : null;

  // 取得或建立群集
  let clusterId = findCluster?.get(source)?.id;
  if (!clusterId && !dryRun) {
    clusterId = Number(
      insertCluster.run(source, nextClusterOrder++).lastInsertRowid
    );
    console.log(`  建立群集：${source}`);
  }

  const questions = (Array.isArray(data.questions) ? data.questions : [])
    .map((q) => ({ ...q }))
    .sort((a, b) => (a.number ?? 0) - (b.number ?? 0));

  const toInsert = [];
  let skipped = 0;
  let linked = 0;
  let invalid = 0;
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const problems = validateQuestion(q, file, i);
    if (problems.length > 0) {
      for (const p of problems) console.warn(`  ⚠ ${p}`);
      invalid++;
      continue;
    }
    const title = `${source}${paper ? ` ${paper}` : ""} 第 ${q.number} 題`;
    if (seen.has(title)) {
      skipped++;
      continue;
    }
    const existing = exists?.get(title);
    if (existing) {
      // 已存在：只補掛還沒有群集的題目，不覆蓋管理員調整過的群集
      if (clusterId && linkCluster?.run(clusterId, existing.id).changes) {
        linked++;
      } else {
        skipped++;
      }
      continue;
    }
    seen.add(title);
    toInsert.push({
      title,
      statement: q.question.trim(),
      code: typeof q.code === "string" ? q.code : "",
      options: q.options.map((o) => o.trim()),
      answerIndex: q.answerIndex,
      explanation:
        typeof q.explanation === "string" && q.explanation.trim() !== ""
          ? q.explanation.trim()
          : null,
      paper,
      sourceNumber: q.number,
      category: q.category.trim(),
      clusterId: clusterId ?? null,
      order: nextOrder++,
    });
  }

  if (toInsert.length > 0) insertAll?.(toInsert);
  totalAdded += toInsert.length;
  totalSkipped += skipped;
  totalLinked += linked;
  totalInvalid += invalid;
  console.log(
    `${file}：新增 ${toInsert.length} 題，補掛群集 ${linked} 題，略過 ${skipped} 題，無效 ${invalid} 題`
  );
}

db?.close();
console.log(
  `${dryRun ? "（dry-run）" : ""}完成：新增 ${totalAdded} 題，補掛群集 ${totalLinked} 題，略過 ${totalSkipped} 題，無效 ${totalInvalid} 題。`
);
