import assert from "node:assert/strict";
import test from "node:test";
import { mkdtempSync, readFileSync } from "node:fs";
import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import { inflateSync } from "node:zlib";
import Database from "better-sqlite3";
import JSZip from "jszip";
import { createBeginnerCtfChallenges } from "./lib/ctf-beginner-challenges.mjs";
import { importBeginnerCtfChallenges } from "./add-ctf-beginner-challenges.mjs";

async function solve(category, data) {
  const text = data.toString("utf8");
  if (category === "Web") return /<!-- 給好奇的人：(flag\{[0-9a-f]+\}) -->/.exec(text)[1];
  if (category === "Crypto") return Buffer.from(text.trim(), "base64").toString("utf8");
  if (category === "Reverse") {
    const bytes = JSON.parse(/const EXPECTED = (\[[0-9,]+\]);/.exec(text)[1]).reverse();
    const mask = Number(/const MASK = (0x[0-9a-f]+);/.exec(text)[1]);
    return Buffer.from(bytes.map((value, index) => ((value - index + 256) % 256) ^ mask)).toString("utf8");
  }
  if (category === "Pwn") {
    const unlock = Number(/UNLOCK = (0x[0-9a-f]+);/.exec(text)[1]);
    const payload = Buffer.alloc(12, 0x41); payload.writeUInt32LE(unlock, 8);
    return `flag{${payload.toString("hex")}}`;
  }
  if (category === "Forensics") return /flag\{[0-9a-f]+\}/.exec(text)[0];
  const zip = await JSZip.loadAsync(data);
  const tickets = Object.values(zip.files).filter((file) => /^tickets\/\d+\.txt$/.test(file.name)).sort((a, b) => a.name.localeCompare(b.name));
  return (await Promise.all(tickets.map((file) => file.async("string")))).map((part) => part.trimEnd()).join("");
}

test("all six attachments can independently be solved to their generated flags", async () => {
  const challenges = await createBeginnerCtfChallenges();
  assert.equal(new Set(challenges.map((challenge) => challenge.title)).size, 6);
  assert.deepEqual(challenges.map((challenge) => challenge.category), ["Web", "Crypto", "Reverse", "Pwn", "Forensics", "Misc"]);
  for (const challenge of challenges) {
    assert.equal(challenge.points, 100); assert.equal(challenge.difficulty, "easy");
    assert.ok(!challenge.description.includes(challenge.flag));
    assert.equal(challenge.attachments.length, 1);
    const { filename, data } = challenge.attachments[0];
    assert.ok(data.length > 0 && data.length < 4 * 1024 * 1024);
    assert.ok(challenge.description.includes(filename));
    assert.equal(await solve(challenge.category, data), challenge.flag);
    if (challenge.category === "Reverse") {
      // Run the downloaded verifier unchanged, with the recovered candidate.
      const run = spawnSync(process.execPath, ["-", challenge.flag], { input: data, encoding: "utf8" });
      assert.equal(run.status, 0, run.stderr); assert.match(run.stdout, /通過驗證/);
      const wrong = spawnSync(process.execPath, ["-", challenge.flag.toUpperCase()], { input: data, encoding: "utf8" });
      assert.equal(wrong.status, 1);
    }
    if (challenge.category === "Forensics") {
      assert.equal(data.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
      let offset = 8; const imageData = [];
      while (offset < data.length) {
        const length = data.readUInt32BE(offset); const type = data.toString("ascii", offset + 4, offset + 8);
        if (type === "IHDR") { assert.equal(data.readUInt32BE(offset + 8), 1); assert.equal(data.readUInt32BE(offset + 12), 1); }
        if (type === "IDAT") imageData.push(data.subarray(offset + 8, offset + 8 + length));
        offset += length + 12;
        if (type === "IEND") break;
      }
      assert.equal(inflateSync(Buffer.concat(imageData)).length, 4);
      assert.ok(data.subarray(offset).toString().includes(challenge.flag));
    }
  }
  const fresh = await createBeginnerCtfChallenges();
  assert.ok(fresh.every((challenge, index) => challenge.flag !== challenges[index].flag));
});

test("importer preserves hashes, attachments, edited metadata and solves on repeated runs", async () => {
  const directory = mkdtempSync(join(tmpdir(), "oj-ctf-seed-"));
  const path = join(directory, "test.db");
  const db = new Database(path);
  try {
    db.exec('CREATE TABLE "User" (id TEXT NOT NULL PRIMARY KEY); INSERT INTO "User" (id) VALUES (\'learner\');');
    db.exec(readFileSync("prisma/migrations/20261006140000_add_ctf_module/migration.sql", "utf8"));
    assert.equal((await importBeginnerCtfChallenges(db)).created.length, 6);
    const before = db.prepare('SELECT * FROM "CtfChallenge" ORDER BY id').all();
    const attachments = db.prepare('SELECT * FROM "CtfAttachment" ORDER BY id').all();
    const { verifyCtfFlag } = await import("../src/lib/ctfFlag.ts");
    for (const challenge of before) {
      const file = attachments.find((file) => file.challengeId === challenge.id);
      assert.equal(await verifyCtfFlag(await solve(challenge.category, file.data), challenge.flagSalt, challenge.flagHash), true);
    }
    db.prepare('UPDATE "CtfChallenge" SET points = 200, isPublic = 0 WHERE id = ?').run(before[0].id);
    db.prepare('INSERT INTO "CtfSolve" (userId, challengeId) VALUES (?, ?)').run("learner", before[0].id);
    const result = await importBeginnerCtfChallenges(db, { isPublic: true });
    assert.equal(result.created.length, 0); assert.equal(result.skipped.length, 6);
    assert.deepEqual(db.prepare('SELECT * FROM "CtfAttachment" ORDER BY id').all(), attachments);
    const after = db.prepare('SELECT * FROM "CtfChallenge" ORDER BY id').all();
    assert.deepEqual(after.map((challenge) => [challenge.flagHash, challenge.flagSalt]), before.map((challenge) => [challenge.flagHash, challenge.flagSalt]));
    assert.equal(after[0].points, 200); assert.equal(after[0].isPublic, 0);
    assert.equal(db.prepare('SELECT COUNT(*) AS count FROM "CtfSolve"').get().count, 1);
    db.prepare('DELETE FROM "CtfChallenge" WHERE id = ?').run(before[1].id);
    assert.equal((await importBeginnerCtfChallenges(db, { isPublic: false })).created.length, 1);
    assert.equal(db.prepare('SELECT isPublic FROM "CtfChallenge" WHERE title = ?').get(before[1].title).isPublic, 0);
  } finally { db.close(); await rm(directory, { recursive: true, force: true, maxRetries: 10, retryDelay: 300 }); }
});

test("check-only CLI validates puzzles without touching a database or printing flags", () => {
  const output = execFileSync(process.execPath, ["scripts/add-ctf-beginner-challenges.mjs", "--check"], {
    env: { ...process.env, DATABASE_URL: "file:/nonexistent/ctf-seed.db" }, encoding: "utf8",
  });
  assert.match(output, /6 題/); assert.ok(!/flag\{[0-9a-f]+\}/.test(output));
});
