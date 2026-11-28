// node scripts/add-ctf-web-expansion.mjs [--check] [--hidden] [--db path]
import dotenv from "dotenv";
import "./ctf-test-loader.mjs";
import Database from "better-sqlite3";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { createWebExpansionChallenges } from "./lib/ctf-web-expansion-challenges.mjs";

dotenv.config({ path: resolve(dirname(fileURLToPath(import.meta.url)), "../.env"), quiet: true });

async function prepare() {
  const [{ hashCtfFlag }, { encryptCtfLabFlag }, { ctfCreateSchema }] = await Promise.all([
    import("../src/lib/ctfFlag.ts"), import("../src/lib/ctfLabFlag.ts"), import("../src/lib/ctfSchema.ts"),
  ]);
  return Promise.all(createWebExpansionChallenges().map(async (challenge) => {
    ctfCreateSchema.parse(challenge);
    const { flag, ...data } = challenge;
    const hashed = await hashCtfFlag(flag);
    return { ...data, ...hashed, labFlagCiphertext: encryptCtfLabFlag(flag, hashed.flagHash) };
  }));
}

export async function importCtfWebExpansion(db, { isPublic = true } = {}) {
  if (!db.prepare('PRAGMA table_info("CtfChallenge")').all().some((column) => column.name === "labFlagCiphertext")) {
    throw new Error("請先套用 Web Lab migration：npx prisma migrate deploy");
  }
  const challenges = await prepare();
  const find = db.prepare('SELECT id, title FROM "CtfChallenge" WHERE title = ? ORDER BY id LIMIT 1');
  const create = db.prepare(`INSERT INTO "CtfChallenge"
    (title, description, category, difficulty, points, isPublic, "order", flagHash, flagSalt, labType, labFlagCiphertext, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  db.pragma("foreign_keys = ON");
  return db.transaction(() => {
    const created = [], skipped = [];
    let order = Math.max(0, db.prepare('SELECT MAX("order") AS value FROM "CtfChallenge"').get().value ?? 0);
    for (const challenge of challenges) {
      const existing = find.get(challenge.title);
      if (existing) { skipped.push(existing); continue; }
      if (++order > 2147483647) throw new Error("題目排序值已達上限");
      const now = Date.now();
      const id = Number(create.run(challenge.title, challenge.description, challenge.category, challenge.difficulty, challenge.points,
        Number(isPublic), order, challenge.flagHash, challenge.flagSalt, challenge.labType, challenge.labFlagCiphertext, now, now).lastInsertRowid);
      created.push({ id, title: challenge.title, labType: challenge.labType });
    }
    return { created, skipped };
  }).immediate();
}

async function main() {
  const args = process.argv.slice(2), dbIndex = args.indexOf("--db");
  if (args.filter((arg) => arg === "--db").length > 1 ||
      args.some((arg, index) => !["--db", "--check", "--hidden"].includes(arg) && (dbIndex === -1 || index !== dbIndex + 1)) ||
      (dbIndex !== -1 && (!args[dbIndex + 1] || args[dbIndex + 1].startsWith("--")))) {
    throw new Error("用法：node scripts/add-ctf-web-expansion.mjs [--check] [--hidden] [--db 資料庫路徑]");
  }
  if (args.includes("--check")) {
    const challenges = await prepare();
    for (const challenge of challenges) console.log(`${challenge.labType}：${challenge.title}（${challenge.points} 分）`);
    console.log(`${challenges.length} 題 schema 與加密 Flag 檢查通過；未修改資料庫。`); return;
  }
  const url = process.env.DATABASE_URL ?? "file:./prisma/data/dev.db";
  if (dbIndex === -1 && !url.startsWith("file:")) throw new Error("預期 SQLite DATABASE_URL");
  const db = new Database(resolve(dbIndex === -1 ? url.slice(5) : args[dbIndex + 1]), { fileMustExist: true });
  try {
    const backup = join(tmpdir(), `oj-before-ctf-web-expansion-${Date.now()}.db`);
    await db.backup(backup); console.log(`SQLite 一致性備份：${backup}`);
    const result = await importCtfWebExpansion(db, { isPublic: !args.includes("--hidden") });
    for (const challenge of result.created) console.log(`新增 #${challenge.id} ${challenge.labType}：${challenge.title}`);
    for (const challenge of result.skipped) console.log(`保留既有 #${challenge.id}：${challenge.title}`);
    console.log(`新增 ${result.created.length} 題、保留 ${result.skipped.length} 題；Flag 不輸出。`);
  } finally { db.close(); }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => { console.error(error.message); process.exitCode = 1; });
}
