// 一鍵建立離線比賽的本機測試環境
//
// 會在 dev.db 旁邊複製出一份 test.db，在裡面建好「進行中、IOI 計分、只開 C++」
// 的比賽和一個測試帳號，然後印出接下來要執行的指令。
//
// 全程不會動到 dev.db——測試提交、測試帳號都只存在 test.db 裡，
// 測完直接刪掉 test.db 就乾淨了。
//
//   node scripts/setup-test-contest.mjs
//   node scripts/setup-test-contest.mjs --clean    刪掉 test.db

import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";

const USERNAME = "testplayer";
const PASSWORD = "test1234";
const PORT = 3999;

const devPath = (process.env.DATABASE_URL ?? "file:./dev.db").replace(/^file:/, "");
const testPath = path.join(path.dirname(devPath), "test.db");

if (process.argv.includes("--clean")) {
  for (const f of [testPath, testPath + "-journal", testPath + "-wal", testPath + "-shm"]) {
    if (fs.existsSync(f)) fs.unlinkSync(f);
  }
  console.log("已刪除 " + testPath);
  process.exit(0);
}

if (!fs.existsSync(devPath)) {
  console.error("找不到 " + path.resolve(devPath) + "，請在 itouOJ 目錄下執行");
  process.exit(1);
}

// 每次都重建，避免累積上一輪的測試提交
for (const f of [testPath, testPath + "-journal", testPath + "-wal", testPath + "-shm"]) {
  if (fs.existsSync(f)) fs.unlinkSync(f);
}
fs.copyFileSync(devPath, testPath);

const db = new Database(testPath);
db.pragma("foreign_keys = ON");
const iso = (d) => d.toISOString().replace("Z", "+00:00");
const now = Date.now();

// 挑幾道有測資的公開題目
const problems = db
  .prepare(
    `SELECT p.id, p.title FROM Problem p
     WHERE p.isPublic = 1 AND EXISTS (SELECT 1 FROM TestCase t WHERE t.problemId = p.id)
     ORDER BY p."order" LIMIT 3`
  )
  .all();

if (problems.length === 0) {
  console.error("test.db 裡沒有含測資的公開題目，無法建立測試比賽");
  process.exit(1);
}

// 測試帳號（若殘留就先清掉）
db.prepare("DELETE FROM User WHERE username = ?").run(USERNAME);
const userId = `c${Date.now().toString(36)}${crypto.randomBytes(8).toString("hex")}`;
db.prepare(
  `INSERT INTO User (id, username, passwordHash, displayName, role, createdAt)
   VALUES (?, ?, ?, '測試選手', 'USER', ?)`
).run(userId, USERNAME, bcrypt.hashSync(PASSWORD, 10), iso(new Date()));

// 進行中的比賽：1 小時前開始、3 小時後結束、IOI 計分、只開 C++
const contestId = db
  .prepare(
    `INSERT INTO Contest (title, description, startTime, endTime, freezeMinutes,
                          scoreMode, allowedLanguages, isPublic, createdAt)
     VALUES ('【本機測試】離線收件測試賽', '測試用，可以隨便交', ?, ?, 0,
             'IOI', 'cpp', 1, ?)`
  )
  .run(
    iso(new Date(now - 3600_000)),
    iso(new Date(now + 3 * 3600_000)),
    iso(new Date())
  ).lastInsertRowid;

const addProblem = db.prepare(
  `INSERT INTO ContestProblem (contestId, problemId, label, "order") VALUES (?,?,?,?)`
);
const labels = ["A", "B", "C"];
problems.forEach((p, i) => addProblem.run(contestId, p.id, labels[i], i + 1));

db.prepare(
  `INSERT INTO ContestParticipant (contestId, userId, joinedAt) VALUES (?,?,?)`
).run(contestId, userId, iso(new Date()));

db.close();

const abs = path.resolve(testPath).replace(/\\/g, "/");

console.log(`
測試環境已建立（dev.db 未被更動）

  資料庫    ${path.resolve(testPath)}
  帳號      ${USERNAME}
  密碼      ${PASSWORD}
  比賽      #${contestId} 【本機測試】離線收件測試賽
            進行中・IOI 計分・只開 C++
  題目      ${problems.map((p, i) => labels[i] + " = " + p.title).join("\n            ")}

────────────────────────────────────────────────────────
接下來（PowerShell）：

1) 啟動測試伺服器
     npm run build
     $env:DATABASE_URL="file:${abs}"; npx next start -p ${PORT}

2) 另開一個視窗，用測試用的 spool 位置啟動收件程式
     $env:ITOUOJ_HOME="$env:TEMP\\itouoj-test"
     .\\client\\itouOJ-Submit.exe

   在程式裡填：
     伺服器  http://localhost:${PORT}
     帳號    ${USERNAME}
     密碼    ${PASSWORD}
     比賽    選「【本機測試】離線收件測試賽」

3) 網頁上查看結果
     http://localhost:${PORT}/contests/${contestId}/scoreboard

測完清理：
     node scripts/setup-test-contest.mjs --clean
`);
