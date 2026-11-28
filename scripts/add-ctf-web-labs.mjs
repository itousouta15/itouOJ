import dotenv from "dotenv";
import "./ctf-test-loader.mjs";
import Database from "better-sqlite3";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { createWebLabChallenges, SOURCE_CHALLENGE_TITLE, SOURCE_LAB_INTRO } from "./lib/ctf-web-lab-challenges.mjs";

// Resolve AUTH_SECRET from this app's environment even when run by absolute path.
dotenv.config({ path: resolve(dirname(fileURLToPath(import.meta.url)), "../.env"), quiet: true });

async function helpers() {
  const [flags, labs, schema] = await Promise.all([
    import("../src/lib/ctfFlag.ts"), import("../src/lib/ctfLabFlag.ts"), import("../src/lib/ctfSchema.ts"),
  ]);
  return { ...flags, ...labs, ...schema };
}

async function prepare() {
  const { hashCtfFlag, encryptCtfLabFlag, ctfCreateSchema } = await helpers();
  return Promise.all(createWebLabChallenges().map(async (challenge) => {
    ctfCreateSchema.parse(challenge);
    const { flag, ...data } = challenge;
    const hashed = await hashCtfFlag(flag);
    return { ...data, ...hashed, labFlagCiphertext: encryptCtfLabFlag(flag, hashed.flagHash) };
  }));
}

export async function importCtfWebLabs(db, { isPublic = true } = {}) {
  const columns = db.prepare('PRAGMA table_info("CtfChallenge")').all();
  if (!columns.some((column) => column.name === "labFlagCiphertext")) throw new Error("請先套用 Web Lab migration：npx prisma migrate deploy");
  const find = db.prepare('SELECT * FROM "CtfChallenge" WHERE title = ? ORDER BY id LIMIT 1');
  const source = find.get(SOURCE_CHALLENGE_TITLE);
  if (!source) throw new Error("請先匯入入門題：node scripts/add-ctf-beginner-challenges.mjs");
  const { verifyCtfFlag, encryptCtfLabFlag } = await helpers();
  let sourceCiphertext = null;
  if (!source.labType) {
    const file = db.prepare('SELECT data FROM "CtfAttachment" WHERE challengeId = ? AND filename = ? ORDER BY id LIMIT 1').get(source.id, "welcome.html");
    const candidate = file?.data.toString("utf8").match(/flag\{[0-9a-f]+\}/)?.[0];
    if (!candidate || !await verifyCtfFlag(candidate, source.flagSalt, source.flagHash)) {
      throw new Error("原始碼題的附件與目前 Flag 不一致；請從後台啟用練習網站並設定新 Flag");
    }
    sourceCiphertext = encryptCtfLabFlag(candidate, source.flagHash);
  }
  const challenges = await prepare();
  const create = db.prepare(`INSERT INTO "CtfChallenge"
    (title, description, category, difficulty, points, isPublic, "order", flagHash, flagSalt, labType, labFlagCiphertext, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  db.pragma("foreign_keys = ON");
  return db.transaction(() => {
    const converted = [], created = [], skipped = [];
    const current = find.get(SOURCE_CHALLENGE_TITLE);
    if (!current || current.id !== source.id || current.flagHash !== source.flagHash || current.flagSalt !== source.flagSalt) {
      throw new Error("匯入期間原始碼題已變更，請重新執行");
    }
    if (!current.labType && sourceCiphertext) {
      db.prepare('UPDATE "CtfChallenge" SET labType = ?, labFlagCiphertext = ?, description = ?, updatedAt = ? WHERE id = ?')
        .run("SOURCE", sourceCiphertext, SOURCE_LAB_INTRO + current.description, Date.now(), current.id);
      converted.push({ id: current.id, title: current.title });
    } else skipped.push({ id: current.id, title: current.title });
    let order = Math.max(0, db.prepare('SELECT MAX("order") AS value FROM "CtfChallenge"').get().value ?? 0);
    for (const challenge of challenges) {
      const existing = find.get(challenge.title);
      if (existing) { skipped.push({ id: existing.id, title: existing.title }); continue; }
      if (++order > 2147483647) throw new Error("題目排序值已達上限");
      const now = Date.now();
      const id = Number(create.run(challenge.title, challenge.description, challenge.category, challenge.difficulty, challenge.points,
        Number(isPublic), order, challenge.flagHash, challenge.flagSalt, challenge.labType, challenge.labFlagCiphertext, now, now).lastInsertRowid);
      created.push({ id, title: challenge.title });
    }
    return { converted, created, skipped };
  }).immediate();
}

async function main() {
  const args = process.argv.slice(2), dbIndex = args.indexOf("--db");
  if (args.filter((arg) => arg === "--db").length > 1 ||
      args.some((arg, index) => !["--db", "--check", "--hidden"].includes(arg) && (dbIndex === -1 || index !== dbIndex + 1)) ||
      (dbIndex !== -1 && (!args[dbIndex + 1] || args[dbIndex + 1].startsWith("--")))) {
    throw new Error("用法：node scripts/add-ctf-web-labs.mjs [--check] [--hidden] [--db 資料庫路徑]");
  }
  if (args.includes("--check")) {
    const challenges = await prepare();
    for (const challenge of challenges) console.log(`${challenge.labType}：${challenge.title}`);
    console.log("兩題 schema 與加密 Flag 檢查通過；未修改資料庫。"); return;
  }
  const url = process.env.DATABASE_URL ?? "file:./prisma/data/dev.db";
  if (dbIndex === -1 && !url.startsWith("file:")) throw new Error("預期 SQLite DATABASE_URL");
  const db = new Database(resolve(dbIndex === -1 ? url.slice(5) : args[dbIndex + 1]), { fileMustExist: true });
  try {
    const backup = join(tmpdir(), `oj-before-ctf-web-labs-${Date.now()}.db`);
    await db.backup(backup); console.log(`SQLite 一致性備份：${backup}`);
    const result = await importCtfWebLabs(db, { isPublic: !args.includes("--hidden") });
    for (const challenge of result.converted) console.log(`啟用既有網站 #${challenge.id}：${challenge.title}（原 Flag 保留）`);
    for (const challenge of result.created) console.log(`新增網站 #${challenge.id}：${challenge.title}`);
    console.log(`轉換 ${result.converted.length} 題、新增 ${result.created.length} 題、保留 ${result.skipped.length} 題；Flag 不輸出。`);
  } finally { db.close(); }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => { console.error(error.message); process.exitCode = 1; });
}
