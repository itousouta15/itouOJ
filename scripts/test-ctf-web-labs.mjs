import assert from "node:assert/strict";
import test from "node:test";
import { mkdtempSync, readFileSync } from "node:fs";
import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import Database from "better-sqlite3";
import { importCtfWebLabs } from "./add-ctf-web-labs.mjs";
import { importBeginnerCtfChallenges } from "./add-ctf-beginner-challenges.mjs";
import { SOURCE_CHALLENGE_TITLE } from "./lib/ctf-web-lab-challenges.mjs";

process.env.AUTH_SECRET = "ctf-web-lab-unit-tests-only";
const { encryptCtfLabFlag, decryptCtfLabFlag } = await import("../src/lib/ctfLabFlag.ts");
const { hashCtfFlag, verifyCtfFlag } = await import("../src/lib/ctfFlag.ts");
const { renderCtfLab, ctfLabCookie } = await import("../src/lib/ctfLab.ts");

async function lab(type, flag = "flag{lab_answer}") {
  const hashed = await hashCtfFlag(flag);
  return { id: 14, title: "Web lab", labType: type, ...hashed, labFlagCiphertext: encryptCtfLabFlag(flag, hashed.flagHash) };
}

test("encrypted flags authenticate key, salted hash and ciphertext; errors disclose no secret", async () => {
  const hashed = await hashCtfFlag("flag{secret}");
  const envelope = encryptCtfLabFlag(" flag{secret} ", hashed.flagHash);
  assert.ok(!envelope.includes("flag{secret}"));
  assert.equal(decryptCtfLabFlag(envelope, hashed.flagHash), "flag{secret}");
  assert.notEqual(encryptCtfLabFlag("flag{secret}", hashed.flagHash), envelope);
  for (const damaged of ["", "v1.bad", envelope.slice(0, -5)]) assert.throws(() => decryptCtfLabFlag(damaged, hashed.flagHash));
  assert.throws(() => decryptCtfLabFlag(envelope, "different-hash"));
  const original = process.env.AUTH_SECRET;
  try {
    process.env.AUTH_SECRET = "a-different-secret";
    assert.throws(() => decryptCtfLabFlag(envelope, hashed.flagHash), (error) => !error.message.includes("flag{secret}"));
  } finally { process.env.AUTH_SECRET = original; }
});

test("source site is interactive, nonce-protected and escapes titles and comment payloads", async () => {
  const challenge = await lab("SOURCE", "flag{--><script>evil()</script>}");
  challenge.title = '<img src=x onerror="evil()">';
  const response = renderCtfLab(new Request("https://site/ctf/labs/14"), challenge, []);
  const html = await response.text();
  assert.equal(response.status, 200);
  assert.match(html, /迎新登記/); assert.match(html, /addEventListener\('submit'/);
  assert.ok(html.includes("maintainer-note:")); assert.ok(!html.includes('<img src=x'));
  assert.ok(!html.includes("--><script>evil()"));
  assert.equal((html.match(/<script /g) ?? []).length, 1);
  assert.match(response.headers.get("content-security-policy"), /script-src 'nonce-/);
  assert.equal(response.headers.get("cache-control"), "private, no-store");
  assert.ok(!html.includes(challenge.flagHash)); assert.ok(!html.includes(challenge.labFlagCiphertext));
  assert.equal(renderCtfLab(new Request("https://site/ctf/labs/14/admin"), challenge, ["admin"]).status, 404);
});

test("fake Cookie role affects only its lab and never uses the OJ session", async () => {
  const challenge = await lab("COOKIE");
  for (const cookies of ["", "oj_session=admin", "ctf_lab_15_role=admin", "ctf_lab_14_role=guest"]) {
    const req = new Request("https://site/ctf/labs/14/admin", { headers: { Cookie: cookies } });
    const response = renderCtfLab(req, challenge, ["admin"]);
    assert.equal(response.status, 403); assert.ok(!(await response.text()).includes("flag{lab_answer}"));
  }
  const response = renderCtfLab(new Request("https://site/ctf/labs/14/admin", { headers: { Cookie: "ctf_lab_14_role=admin" } }), challenge, ["admin"]);
  assert.equal(response.status, 200); assert.ok((await response.text()).includes("flag{lab_answer}"));
  const cookie = ctfLabCookie(14, "guest", true);
  assert.match(cookie, /^ctf_lab_14_role=guest;/); assert.match(cookie, /Path=\/ctf\/labs\/14;/);
  assert.match(cookie, /SameSite=Lax; Secure/); assert.ok(!cookie.includes("oj_session"));
  assert.match(ctfLabCookie(14, "guest", true, true), /Max-Age=0/);
});

test("IDOR puzzle serves only its two synthetic tickets and reveals the intended answer", async () => {
  const challenge = await lab("IDOR");
  const home = await renderCtfLab(new Request("https://site/ctf/labs/14"), challenge, []).text();
  assert.ok(home.includes("/notes/1001")); assert.ok(!home.includes("flag{lab_answer}"));
  const own = await renderCtfLab(new Request("https://site/ctf/labs/14/notes/1001"), challenge, ["notes", "1001"]).text();
  assert.ok(!own.includes("flag{lab_answer}"));
  const other = await renderCtfLab(new Request("https://site/ctf/labs/14/notes/1002"), challenge, ["notes", "1002"]).text();
  assert.ok(other.includes("flag{lab_answer}"));
  for (const path of [["notes", "1"], ["notes", "../User"], ["api", "users"]]) {
    assert.equal(renderCtfLab(new Request("https://site/ctf/labs/14"), challenge, path).status, 404);
  }
});

test("web lab importer preserves the original source flag, attachments, scores and repeat runs", async () => {
  const directory = mkdtempSync(join(tmpdir(), "oj-web-labs-"));
  const db = new Database(join(directory, "test.db"));
  try {
    db.exec('CREATE TABLE "User" (id TEXT PRIMARY KEY); INSERT INTO "User" (id) VALUES (\'learner\');');
    for (const migration of ["20261006140000_add_ctf_module", "20261007090000_add_ctf_web_labs"]) {
      db.exec(readFileSync(`prisma/migrations/${migration}/migration.sql`, "utf8"));
    }
    await importBeginnerCtfChallenges(db);
    const before = db.prepare('SELECT * FROM "CtfChallenge" WHERE title = ?').get(SOURCE_CHALLENGE_TITLE);
    const attachments = db.prepare('SELECT * FROM "CtfAttachment" ORDER BY id').all();
    db.prepare('INSERT INTO "CtfSolve" (userId, challengeId) VALUES (?, ?)').run("learner", before.id);
    const result = await importCtfWebLabs(db);
    assert.equal(result.converted.length, 1); assert.equal(result.created.length, 2);
    const source = db.prepare('SELECT * FROM "CtfChallenge" WHERE id = ?').get(before.id);
    assert.equal(source.labType, "SOURCE"); assert.equal(source.flagHash, before.flagHash); assert.equal(source.flagSalt, before.flagSalt);
    assert.ok(source.description.includes(before.description)); assert.equal(source.points, before.points);
    assert.equal(await verifyCtfFlag(decryptCtfLabFlag(source.labFlagCiphertext, source.flagHash), source.flagSalt, source.flagHash), true);
    assert.deepEqual(db.prepare('SELECT * FROM "CtfAttachment" ORDER BY id').all(), attachments);
    assert.equal(db.prepare('SELECT COUNT(*) AS count FROM "CtfSolve"').get().count, 1);
    const rows = db.prepare('SELECT * FROM "CtfChallenge" ORDER BY id').all();
    const rerun = await importCtfWebLabs(db);
    assert.equal(rerun.converted.length, 0); assert.equal(rerun.created.length, 0); assert.equal(rerun.skipped.length, 3);
    assert.deepEqual(db.prepare('SELECT * FROM "CtfChallenge" ORDER BY id').all(), rows);
  } finally { db.close(); await rm(directory, { recursive: true, force: true, maxRetries: 10, retryDelay: 300 }); }
});
