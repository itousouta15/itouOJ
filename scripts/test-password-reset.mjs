import { test, mock, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client.ts";
import { createPasswordResetToken, hashPasswordResetToken } from "../src/lib/passwordReset.ts";

// Use real SQLite queries and token transactions; no real emails are sent.
const db = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: "file::memory:" }) });
await db.$executeRawUnsafe("CREATE TABLE User (id TEXT PRIMARY KEY, username TEXT NOT NULL UNIQUE, email TEXT)");
await db.$executeRawUnsafe(`CREATE TABLE PasswordResetToken (
  id TEXT PRIMARY KEY, userId TEXT NOT NULL REFERENCES User(id), tokenHash TEXT NOT NULL UNIQUE,
  expiresAt DATETIME NOT NULL, createdAt DATETIME NOT NULL
)`);
after(() => db.$disconnect());

let sent;
let configured;
let sendSuccess;
let ipSequence = 0;
mock.module(new URL("../src/lib/db.ts", import.meta.url).href, { exports: { prisma: db } });
mock.module(new URL("../src/lib/passwordReset.ts", import.meta.url).href, {
  exports: {
    createPasswordResetToken,
    passwordResetConfigured: () => configured,
    sendPasswordResetEmail: async (message) => { sent.push(message); return sendSuccess; },
  },
});
const { POST } = await import("../src/app/api/auth/password-reset/request/route.ts");

beforeEach(async () => {
  await db.passwordResetToken.deleteMany();
  await db.$executeRawUnsafe("DELETE FROM User");
  sent = [];
  configured = true;
  sendSuccess = true;
});

const request = (body, ip = `reset-test-${++ipSequence}`) => new Request("http://localhost/api/auth/password-reset/request", {
  method: "POST", headers: { "Content-Type": "application/json", "X-Real-IP": ip }, body: JSON.stringify(body),
});
async function addUser(id, username, email) {
  await db.$executeRaw`INSERT INTO User (id, username, email) VALUES (${id}, ${username}, ${email})`;
}

test("reset requests require a valid email instead of a username", async () => {
  for (const body of [{ username: "alice" }, { email: "" }, { email: "alice" }, { email: "x".repeat(255) }]) {
    const response = await POST(request(body));
    assert.equal(response.status, 400);
    assert.equal((await response.json()).error, "請輸入有效的 Email");
  }
  assert.equal(sent.length, 0);
});

test("email lookup trims whitespace and matches legacy mixed-case email addresses", async () => {
  await addUser("alice", "alice", "Alice@Example.com");
  const old = createPasswordResetToken();
  await db.passwordResetToken.create({ data: { userId: "alice", tokenHash: old.tokenHash, expiresAt: old.expiresAt } });
  const started = Date.now();
  assert.equal((await POST(request({ email: "  ALICE@example.COM  " }))).status, 200);
  assert.equal(sent.length, 1);
  assert.equal(sent[0].email, "Alice@Example.com");
  assert.equal(sent[0].username, "alice");
  const tokens = await db.passwordResetToken.findMany();
  assert.equal(tokens.length, 1);
  assert.equal(tokens[0].userId, "alice");
  assert.equal(tokens[0].tokenHash, hashPasswordResetToken(sent[0].token));
  assert.notEqual(tokens[0].tokenHash, sent[0].token);
  assert.notEqual(tokens[0].tokenHash, old.tokenHash);
  assert.ok(tokens[0].expiresAt.getTime() >= started + 30 * 60000);
});

test("known and unknown emails receive identical responses without exposing account data", async () => {
  await addUser("alice", "private-alice", "alice@example.com");
  const known = await POST(request({ email: "alice@example.com" }));
  const unknown = await POST(request({ email: "unknown@example.com" }));
  assert.equal(known.status, unknown.status);
  const data = await known.json();
  assert.deepEqual(data, await unknown.json());
  assert.doesNotMatch(JSON.stringify(data), /private-alice|alice@example.com|tokenHash/);
  assert.equal(sent.length, 1);
});

test("shared emails get separate reset links for each associated account", async () => {
  await addUser("one", "one", "shared@example.com");
  await addUser("two", "two", "SHARED@example.com");
  await addUser("other", "other", "other@example.com");
  assert.equal((await POST(request({ email: "shared@example.com" }))).status, 200);
  assert.deepEqual(sent.map((message) => message.username).sort(), ["one", "two"]);
  assert.notEqual(sent[0].token, sent[1].token);
  const tokens = await db.passwordResetToken.findMany();
  assert.deepEqual(tokens.map((token) => token.userId).sort(), ["one", "two"]);
});

test("failed delivery removes only the newly created reset token", async () => {
  await addUser("alice", "alice", "alice@example.com");
  sendSuccess = false;
  const response = await POST(request({ email: "alice@example.com" }));
  assert.equal(response.status, 200);
  assert.equal(sent.length, 1);
  assert.equal(await db.passwordResetToken.count(), 0);
});

test("normalizing email case cannot bypass the per-address rate limit", async () => {
  const ip = `reset-limit-${++ipSequence}`;
  for (const email of ["alice@example.com", "ALICE@example.com", " Alice@example.com "]) {
    assert.equal((await POST(request({ email }, ip))).status, 200);
  }
  const response = await POST(request({ email: "alice@example.com" }, ip));
  assert.equal(response.status, 429);
  assert.ok(Number(response.headers.get("Retry-After")) > 0);
});

test("unconfigured email service does not create reset tokens", async () => {
  await addUser("alice", "alice", "alice@example.com");
  configured = false;
  assert.equal((await POST(request({ email: "alice@example.com" }))).status, 503);
  assert.equal(sent.length, 0);
  assert.equal(await db.passwordResetToken.count(), 0);
});
