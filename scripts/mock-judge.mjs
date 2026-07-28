// 本機測試用的假判題：直接把提交結果寫進 test.db
//
// Windows 上跑不了 sandbox-server（Linux namespace + cgroup v2 + seccomp），
// 所以本機測試時提交都會停在 IE。這支腳本直接填入結果，讓你能驗證計分板、
// IOI 規則、提交列表這些「判題之後」的東西。
//
// 安全限制：只對 test.db 動手，指到別的資料庫會直接拒絕執行。
//
//   node scripts/mock-judge.mjs          每題最後一次 AC、之前的 WA（示範 IOI）
//   node scripts/mock-judge.mjs AC       全部 AC
//   node scripts/mock-judge.mjs WA       全部 WA
//   node scripts/mock-judge.mjs reset    全部退回 PENDING

import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

const TARGET = "test.db";
const mode = (process.argv[2] ?? "mix").toUpperCase();
const VALID = ["MIX", "AC", "WA", "TLE", "RE", "RESET"];

if (!VALID.includes(mode)) {
  console.error(`不認得的模式：${process.argv[2]}（可用：mix AC WA TLE RE reset）`);
  process.exit(1);
}

const dbPath = path.resolve(TARGET);
if (path.basename(dbPath) !== "test.db") {
  console.error("這支腳本只能對 test.db 執行");
  process.exit(1);
}
if (!fs.existsSync(dbPath)) {
  console.error(
    "找不到 test.db，請先執行：node scripts/setup-test-contest.mjs"
  );
  process.exit(1);
}

const db = new Database(dbPath);
db.pragma("foreign_keys = ON");

// 只處理比賽提交（一般練習提交不動）
const subs = db
  .prepare(
    `SELECT s.id, s.userId, s.problemId, s.contestId, s.createdAt
     FROM Submission s
     WHERE s.contestId IS NOT NULL
     ORDER BY s.userId, s.problemId, s.createdAt, s.id`
  )
  .all();

if (subs.length === 0) {
  console.log("test.db 裡沒有比賽提交，先用收件程式上傳幾筆再跑這支。");
  process.exit(0);
}

const setStatus = db.prepare(
  `UPDATE Submission SET status = ?, timeMs = ?, memoryKb = ?, compileError = NULL
   WHERE id = ?`
);
const clearResults = db.prepare(`DELETE FROM TestResult WHERE submissionId = ?`);
const addResult = db.prepare(
  `INSERT INTO TestResult (submissionId, "order", verdict, timeMs, memoryKb)
   VALUES (?, ?, ?, ?, ?)`
);
const countCases = db.prepare(
  `SELECT COUNT(*) c FROM TestCase WHERE problemId = ?`
);

function apply(sub, verdict) {
  clearResults.run(sub.id);
  if (verdict === "PENDING") {
    setStatus.run("PENDING", null, null, sub.id);
    return;
  }
  const timeMs = 20 + Math.floor(Math.random() * 180);
  const memoryKb = 2048 + Math.floor(Math.random() * 8192);
  setStatus.run(verdict, timeMs, memoryKb, sub.id);

  // 補上每筆測資的結果，讓提交詳細頁看起來正常
  const total = Math.max(1, countCases.get(sub.problemId).c);
  const shown = verdict === "AC" ? total : Math.max(1, Math.ceil(total / 2));
  for (let i = 1; i <= shown; i++) {
    const v = verdict === "AC" ? "AC" : i === shown ? verdict : "AC";
    addResult.run(sub.id, i, v, timeMs, memoryKb);
  }
}

// mix：同一個人同一題，最後一次 AC、之前的 WA —— 直接看出 IOI 與 ICPC 的差別
const lastOf = new Map();
for (const s of subs) lastOf.set(`${s.userId}:${s.problemId}`, s.id);

const run = db.transaction(() => {
  for (const s of subs) {
    let verdict;
    if (mode === "RESET") verdict = "PENDING";
    else if (mode === "MIX")
      verdict = lastOf.get(`${s.userId}:${s.problemId}`) === s.id ? "AC" : "WA";
    else verdict = mode;
    apply(s, verdict);
  }
});
run();

const after = db
  .prepare(
    `SELECT s.id, cp.label, s.status, s.timeMs
     FROM Submission s
     LEFT JOIN ContestProblem cp
       ON cp.contestId = s.contestId AND cp.problemId = s.problemId
     WHERE s.contestId IS NOT NULL ORDER BY s.id`
  )
  .all();

console.log(`\n已套用「${mode}」到 ${subs.length} 筆比賽提交：\n`);
for (const r of after) {
  console.log(
    `  id=${r.id}  ${r.label ?? "?"}題  ${r.status}${r.timeMs ? "  " + r.timeMs + "ms" : ""}`
  );
}

if (mode === "MIX") {
  console.log(`
每題的最後一次設成 AC、之前的設成 WA。這樣可以直接對照：
  IOI  → 只看最後一次，所以有 AC 的題目都算解出
  ICPC → 首次 AC 才算，錯誤還會 +20 分罰時
把比賽的計分方式切成 ICPC 再看一次計分板，數字會不一樣。`);
}

console.log("\n重新整理計分板就會看到結果。");
db.close();
