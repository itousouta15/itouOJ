// 比賽選手帳號管理（斷網機房用）
//
// 刻意寫成 .mjs 而不是 .ts：判題機在比賽當天沒有對外網路，`npx tsx` 會想
// 上網抓套件而失敗。這支只用 better-sqlite3 + bcryptjs + dotenv，三個都已經
// 在 node_modules 裡，所以 `node scripts/contest-accounts.mjs` 就能直接跑。
//
// 用法：
//   node scripts/contest-accounts.mjs list
//   node scripts/contest-accounts.mjs create --prefix oj --count 30
//   node scripts/contest-accounts.mjs create --names alice,bob,carol
//   node scripts/contest-accounts.mjs set-password --names itousota15
//   node scripts/contest-accounts.mjs set-password --all-oauth-only
//
// create / set-password 會把明碼密碼寫成 CSV 供列印發放；密碼在資料庫只存
// bcrypt hash，關掉視窗就再也查不回來，CSV 請自行保管並在賽後刪除。

import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";

const BCRYPT_ROUNDS = 10; // 與 /api/auth/register 一致
// 去掉 i l o 0 1 這類手寫/唸稿容易搞混的字元
const PW_CHARS = "abcdefghjkmnpqrstuvwxyz23456789";

function randomPassword(length = 8) {
  return Array.from(
    { length },
    () => PW_CHARS[crypto.randomInt(PW_CHARS.length)]
  ).join("");
}

// 比照 Prisma 的 @default(cuid())：只要是唯一的字串 primary key 就行
function newId() {
  return `c${Date.now().toString(36)}${crypto.randomBytes(8).toString("hex")}`;
}

function parseArgs(argv) {
  const [command, ...rest] = argv;
  const flags = {};
  for (let i = 0; i < rest.length; i++) {
    if (!rest[i].startsWith("--")) continue;
    const key = rest[i].slice(2);
    const next = rest[i + 1];
    if (next && !next.startsWith("--")) {
      flags[key] = next;
      i++;
    } else {
      flags[key] = true;
    }
  }
  return { command, flags };
}

function openDb() {
  const url = process.env.DATABASE_URL ?? "file:./dev.db";
  const file = url.replace(/^file:/, "");
  if (!fs.existsSync(file)) {
    console.error(`找不到資料庫：${path.resolve(file)}`);
    console.error("請確認在 itouOJ 目錄下執行，且 .env 的 DATABASE_URL 正確。");
    process.exit(1);
  }
  const db = new Database(file);
  db.pragma("foreign_keys = ON");
  return db;
}

function writeCsv(rows) {
  const stamp = new Date()
    .toISOString()
    .replace(/[-:T]/g, "")
    .slice(0, 14);
  const file = path.resolve(`contest-accounts-${stamp}.csv`);
  const esc = (v) => `"${String(v).replace(/"/g, '""')}"`;
  const csv = [
    "帳號,密碼",
    ...rows.map((r) => `${esc(r.username)},${esc(r.password)}`),
  ].join("\r\n");
  // BOM 讓 Excel 正確辨識 UTF-8
  fs.writeFileSync(file, `﻿${csv}\r\n`, "utf8");
  return file;
}

function printHandout(rows) {
  const width = Math.max(4, ...rows.map((r) => r.username.length));
  console.log("");
  console.log(`  ${"帳號".padEnd(width)}   密碼`);
  console.log(`  ${"-".repeat(width)}   ${"-".repeat(10)}`);
  for (const r of rows) {
    console.log(`  ${r.username.padEnd(width)}   ${r.password}`);
  }
  console.log("");
}

function cmdList(db) {
  const users = db
    .prepare(
      `SELECT username, role, displayName,
              (passwordHash IS NOT NULL) AS canOffline
       FROM User ORDER BY role DESC, username ASC`
    )
    .all();

  if (users.length === 0) {
    console.log("資料庫裡還沒有任何帳號。");
    return;
  }

  const width = Math.max(8, ...users.map((u) => u.username.length));
  console.log("");
  console.log(`  ${"帳號".padEnd(width)}   權限    斷網可登入`);
  console.log(`  ${"-".repeat(width)}   ------  ----------`);
  for (const u of users) {
    const mark = u.canOffline ? "✓" : "✗ 只能 OAuth";
    console.log(`  ${u.username.padEnd(width)}   ${u.role.padEnd(6)}  ${mark}`);
  }

  const blocked = users.filter((u) => !u.canOffline);
  console.log("");
  console.log(`  共 ${users.length} 個帳號，其中 ${blocked.length} 個斷網時無法登入。`);
  if (blocked.length > 0) {
    console.log("");
    console.log("  這些帳號沒有密碼，比賽當天會完全登不進去。補救：");
    console.log(
      `    node scripts/contest-accounts.mjs set-password --names ${blocked
        .map((u) => u.username)
        .join(",")}`
    );
    console.log("  或一次處理全部：");
    console.log("    node scripts/contest-accounts.mjs set-password --all-oauth-only");
  }
  console.log("");
}

function resolveNames(db, flags) {
  if (flags["all-oauth-only"]) {
    return db
      .prepare("SELECT username FROM User WHERE passwordHash IS NULL ORDER BY username")
      .all()
      .map((u) => u.username);
  }
  if (typeof flags.names === "string") {
    return flags.names.split(",").map((n) => n.trim()).filter(Boolean);
  }
  if (typeof flags.prefix === "string") {
    const count = Number(flags.count);
    if (!Number.isInteger(count) || count < 1 || count > 500) {
      console.error("--count 需要是 1~500 的整數");
      process.exit(1);
    }
    const pad = String(count).length;
    return Array.from(
      { length: count },
      (_, i) => `${flags.prefix}${String(i + 1).padStart(pad, "0")}`
    );
  }
  return null;
}

function cmdCreate(db, flags) {
  const names = resolveNames(db, flags);
  if (!names) {
    console.error("請指定 --names alice,bob 或 --prefix oj --count 30");
    process.exit(1);
  }

  const findUser = db.prepare("SELECT username FROM User WHERE username = ?");
  const insert = db.prepare(
    `INSERT INTO User (id, username, passwordHash, role, createdAt)
     VALUES (@id, @username, @passwordHash, 'USER', datetime('now'))`
  );

  const created = [];
  const skipped = [];
  for (const username of names) {
    if (findUser.get(username)) {
      skipped.push(username);
      continue;
    }
    const password = randomPassword();
    insert.run({
      id: newId(),
      username,
      passwordHash: bcrypt.hashSync(password, BCRYPT_ROUNDS),
    });
    created.push({ username, password });
  }

  if (created.length > 0) {
    printHandout(created);
    console.log(`  已建立 ${created.length} 個帳號，名單：${writeCsv(created)}`);
  }
  if (skipped.length > 0) {
    console.log(`  已存在而略過 ${skipped.length} 個：${skipped.join(", ")}`);
    console.log("  （要重設既有帳號的密碼請用 set-password）");
  }
  console.log("");
}

function cmdSetPassword(db, flags) {
  const names = resolveNames(db, flags);
  if (!names) {
    console.error("請指定 --names alice,bob 或 --all-oauth-only");
    process.exit(1);
  }
  if (names.length === 0) {
    console.log("沒有符合條件的帳號，不需要處理。");
    return;
  }

  const findUser = db.prepare("SELECT username FROM User WHERE username = ?");
  const update = db.prepare("UPDATE User SET passwordHash = ? WHERE username = ?");

  const updated = [];
  const missing = [];
  for (const username of names) {
    if (!findUser.get(username)) {
      missing.push(username);
      continue;
    }
    const password = randomPassword();
    update.run(bcrypt.hashSync(password, BCRYPT_ROUNDS), username);
    updated.push({ username, password });
  }

  if (updated.length > 0) {
    printHandout(updated);
    console.log(`  已重設 ${updated.length} 組密碼，名單：${writeCsv(updated)}`);
    console.log("  注意：原本用 Google/Discord 登入的人，之後這兩種方式仍然可用。");
  }
  if (missing.length > 0) {
    console.log(`  找不到帳號而略過：${missing.join(", ")}`);
  }
  console.log("");
}

function main() {
  const { command, flags } = parseArgs(process.argv.slice(2));
  if (!command || flags.help) {
    console.log(`
比賽選手帳號管理

  list                                     列出所有帳號，標出斷網無法登入的
  create --prefix oj --count 30            批次建立 oj01 ~ oj30
  create --names alice,bob                 建立指定帳號
  set-password --names alice,bob           重設指定帳號的密碼
  set-password --all-oauth-only            幫所有沒密碼的帳號補上密碼

密碼隨機產生並輸出成 CSV，資料庫只存 bcrypt hash。
`);
    return;
  }

  const db = openDb();
  try {
    if (command === "list") cmdList(db);
    else if (command === "create") cmdCreate(db, flags);
    else if (command === "set-password") cmdSetPassword(db, flags);
    else {
      console.error(`未知的指令：${command}（用 --help 看用法）`);
      process.exit(1);
    }
  } finally {
    db.close();
  }
}

main();
