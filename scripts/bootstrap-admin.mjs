// One-time, local-only administrator bootstrap. Account registration never
// grants elevated access, so a fresh deployment must use this trusted command.
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

const username = process.argv[2];
if (!/^[a-zA-Z0-9_]{3,20}$/.test(username ?? "")) {
  console.error("用法: node scripts/bootstrap-admin.mjs <使用者名稱>");
  process.exit(2);
}

const url = process.env.DATABASE_URL ?? "file:./prisma/data/dev.db";
const file = url.replace(/^file:/, "");
if (!fs.existsSync(file)) {
  console.error(`找不到資料庫：${path.resolve(file)}`);
  process.exit(1);
}

const db = new Database(file);
try {
  const admin = db.prepare("SELECT id FROM User WHERE role = 'ADMIN' LIMIT 1").get();
  if (admin) throw new Error("資料庫已有管理員；請使用既有管理員帳號管理權限。");
  const result = db
    .prepare("UPDATE User SET role = 'ADMIN' WHERE username = ?")
    .run(username);
  if (result.changes !== 1) throw new Error("找不到指定使用者。");
  console.log(`已將 ${username} 設為第一位管理員。`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  db.close();
}
