// node scripts/add-ctf-beginner-challenges.mjs [--check] [--hidden] [--db path]
import "dotenv/config";
import "./ctf-test-loader.mjs";
import Database from "better-sqlite3";
import { resolve, join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { createBeginnerCtfChallenges } from "./lib/ctf-beginner-challenges.mjs";

async function prepareChallenges() {
  const [{ hashCtfFlag }, { ctfCreateSchema }, { CTF_ATTACHMENT_MAX_BYTES, ctfFilename }] = await Promise.all([
    import("../src/lib/ctfFlag.ts"), import("../src/lib/ctfSchema.ts"), import("../src/lib/ctfAttachment.ts"),
  ]);
  const challenges = await createBeginnerCtfChallenges();
  return Promise.all(challenges.map(async (challenge) => {
    const { flag, attachments, ...metadata } = challenge;
    ctfCreateSchema.parse({ ...metadata, flag });
    for (const file of attachments) {
      ctfFilename(file.filename);
      if (!file.data.length || file.data.length > CTF_ATTACHMENT_MAX_BYTES) throw new Error(`附件大小不合法：${file.filename}`);
    }
    return { ...metadata, ...await hashCtfFlag(flag), attachments };
  }));
}

export async function importBeginnerCtfChallenges(db, { isPublic = true } = {}) {
  const challenges = await prepareChallenges();
  db.pragma("foreign_keys = ON");
  if (!db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?").get("CtfChallenge")) {
    throw new Error("尚未建立 CTF 資料表，請先執行 npx prisma migrate deploy");
  }
  const find = db.prepare('SELECT id, title FROM "CtfChallenge" WHERE title = ? ORDER BY id LIMIT 1');
  const maxOrder = db.prepare('SELECT MAX("order") AS value FROM "CtfChallenge"');
  const create = db.prepare(`
    INSERT INTO "CtfChallenge" (title, description, category, difficulty, points, isPublic, "order", flagHash, flagSalt, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const attach = db.prepare('INSERT INTO "CtfAttachment" (challengeId, filename, sizeBytes, data, createdAt) VALUES (?, ?, ?, ?, ?)');
  // Lock before checking titles so two importer processes cannot create duplicates.
  return db.transaction(() => {
    let order = Math.max(0, maxOrder.get().value ?? 0);
    const created = [], skipped = [];
    for (const challenge of challenges) {
      const existing = find.get(challenge.title);
      if (existing) { skipped.push(existing); continue; }
      if (++order > 2147483647) throw new Error("題目排序值已達上限");
      const now = Date.now();
      const id = Number(create.run(challenge.title, challenge.description, challenge.category, challenge.difficulty,
        challenge.points, Number(isPublic), order, challenge.flagHash, challenge.flagSalt, now, now).lastInsertRowid);
      for (const file of challenge.attachments) attach.run(id, file.filename, file.data.length, file.data, now);
      created.push({ id, title: challenge.title, category: challenge.category });
    }
    return { created, skipped };
  }).immediate();
}

async function main() {
  const args = process.argv.slice(2);
  const dbIndex = args.indexOf("--db");
  if (args.filter((arg) => arg === "--db").length > 1 ||
      args.some((arg, index) => !["--check", "--hidden", "--db"].includes(arg) && (dbIndex === -1 || index !== dbIndex + 1)) ||
      (dbIndex !== -1 && (!args[dbIndex + 1] || args[dbIndex + 1].startsWith("--")))) {
    throw new Error("用法：node scripts/add-ctf-beginner-challenges.mjs [--check] [--hidden] [--db 資料庫路徑]");
  }
  if (args.includes("--check")) {
    const challenges = await prepareChallenges();
    for (const challenge of challenges) console.log(`${challenge.category}: ${challenge.title}，${challenge.attachments.length} 個附件`);
    console.log("6 題題敘、附件、schema 與 Flag 雜湊檢查通過；未修改資料庫。");
    return;
  }
  const url = process.env.DATABASE_URL ?? "file:./prisma/data/dev.db";
  if (dbIndex === -1 && !url.startsWith("file:")) throw new Error("預期 SQLite DATABASE_URL，或使用 --db 指定資料庫");
  const path = resolve(dbIndex === -1 ? url.slice(5) : args[dbIndex + 1]);
  const db = new Database(path, { fileMustExist: true });
  try {
    const backup = join(tmpdir(), `oj-before-ctf-beginner-${Date.now()}.db`);
    await db.backup(backup);
    console.log(`SQLite 一致性備份：${backup}`);
    const result = await importBeginnerCtfChallenges(db, { isPublic: !args.includes("--hidden") });
    for (const challenge of result.created) console.log(`新增 #${challenge.id} ${challenge.category}：${challenge.title}`);
    for (const challenge of result.skipped) console.log(`保留既有 #${challenge.id}：${challenge.title}`);
    console.log(`新增 ${result.created.length} 題，略過 ${result.skipped.length} 題。Flag 不輸出至終端機。`);
  } finally { db.close(); }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => { console.error(error.message); process.exitCode = 1; });
}
