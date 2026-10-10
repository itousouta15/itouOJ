import assert from "node:assert/strict";
import { before, after, test } from "node:test";
import { mkdtempSync, readdirSync, readFileSync } from "node:fs";
import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { execFileSync, spawn, fork } from "node:child_process";
import { once } from "node:events";
import { createServer } from "node:net";
import { request as httpRequest } from "node:http";
import Database from "better-sqlite3";
import { SignJWT } from "jose";
import { createWebExpansionChallenges } from "./lib/ctf-web-expansion-challenges.mjs";

const secret = "ctf-disposable-test-secret-only";
const directory = mkdtempSync(join(tmpdir(), "oj-ctf-"));
const database = join(directory, "test.db");
process.env.DATABASE_URL = `file:${database.replaceAll("\\", "/")}`;
process.env.AUTH_SECRET = secret;
let prisma, hashCtfFlag, verifyCtfFlag, submitCtfAttempt, getCtfStats, getCtfRanking, getSiteWideRanking, getUserStats;
let readCtfBody, ctfFilename, ctfDownloadHeaders, ctfCreateSchema;
let encryptCtfLabFlag;
let server, base, logs = "";
const cookies = {};

async function challenge(extra = {}) {
  const hashed = await hashCtfFlag("flag{Test With Space}");
  return prisma.ctfChallenge.create({ data: {
    title: "CTF 測試", description: "測試敘述", category: "Misc", difficulty: "easy", points: 100,
    isPublic: true, ...hashed, ...extra,
    ...(extra.labType ? { labFlagCiphertext: encryptCtfLabFlag("flag{Test With Space}", hashed.flagHash) } : {}),
  } });
}
async function request(path, { user, json, ...options } = {}) {
  const response = await fetch(base + path, {
    ...options, headers: { ...(user ? { Cookie: cookies[user] } : {}), ...(json ? { "Content-Type": "application/json" } : {}), ...options.headers },
    ...(json ? { body: JSON.stringify(json) } : {}), redirect: "manual", signal: AbortSignal.timeout(60000),
  }).catch((error) => { throw new Error(`${options.method ?? "GET"} ${path}: ${error.message}`, { cause: error }); });
  return response;
}

before(async () => {
  // Exercise the full Prisma migration chain from an empty database.
  execFileSync(process.execPath, ["node_modules/prisma/build/index.js", "migrate", "deploy"], { env: process.env, stdio: "pipe" });
  // Independently exercise the additive migration on the pre-CTF schema/data.
  const old = new Database(join(directory, "upgrade.db"));
  try {
    const migrations = readdirSync("prisma/migrations").filter((name) => /^\d/.test(name)).sort();
    const ctfStart = migrations.indexOf("20261006140000_add_ctf_module");
    for (const name of migrations.slice(0, ctfStart)) old.exec(readFileSync(`prisma/migrations/${name}/migration.sql`, "utf8"));
    old.prepare('INSERT INTO "User" (id, username, createdAt) VALUES (?, ?, ?)').run("retained", "retained", Date.now());
    for (const name of migrations.slice(ctfStart)) old.exec(readFileSync(`prisma/migrations/${name}/migration.sql`, "utf8"));
    assert.equal(old.prepare('SELECT username FROM "User" WHERE id=?').get("retained").username, "retained");
    assert.ok(old.prepare('SELECT name FROM sqlite_master WHERE name=?').get("CtfSolve"));
  } catch (error) { throw new Error(`Existing-database migration failed: ${error.message}`, { cause: error }); }
  finally { old.close(); }
  ({ prisma } = await import("../src/lib/db.ts"));
  ({ hashCtfFlag, verifyCtfFlag } = await import("../src/lib/ctfFlag.ts"));
  ({ encryptCtfLabFlag } = await import("../src/lib/ctfLabFlag.ts"));
  ({ submitCtfAttempt } = await import("../src/lib/ctfAttempt.ts"));
  ({ getCtfStats, getCtfRanking } = await import("../src/lib/ctf.ts"));
  ({ getSiteWideRanking } = await import("../src/lib/ranking.ts"));
  ({ getUserStats } = await import("../src/lib/userStats.ts"));
  ({ readCtfBody, ctfFilename, ctfDownloadHeaders } = await import("../src/lib/ctfAttachment.ts"));
  ({ ctfCreateSchema } = await import("../src/lib/ctfSchema.ts"));
  for (const username of ["admin", "alice", "bob", "racer", "limited", "ranker", "ctfonly", "tiea", "tieb"]) {
    const user = await prisma.user.create({ data: { id: username, username, role: username === "admin" ? "ADMIN" : "USER" } });
    const token = await new SignJWT({ userId: user.id, sessionVersion: 0 }).setProtectedHeader({ alg: "HS256" }).setExpirationTime("1h").sign(new TextEncoder().encode(secret));
    cookies[username] = `oj_session=${token}`;
  }
  const socket = createServer(); socket.listen(0, "127.0.0.1"); await once(socket, "listening");
  const port = socket.address().port; await new Promise((done) => socket.close(done));
  base = `http://127.0.0.1:${port}`;
  const production = process.env.CTF_TEST_PRODUCTION === "1";
  server = spawn(process.execPath, ["node_modules/next/dist/bin/next", production ? "start" : "dev", "-p", String(port), "-H", "127.0.0.1"], {
    env: { ...process.env, NODE_ENV: production ? "production" : "development", COOKIE_SECURE: "0", NEXT_TELEMETRY_DISABLED: "1" }, stdio: ["ignore", "pipe", "pipe"],
  });
  server.stdout.on("data", (chunk) => { logs += chunk; }); server.stderr.on("data", (chunk) => { logs += chunk; });
  const deadline = Date.now() + 90000;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) throw new Error(`Test server exited: ${logs}`);
    try { if ((await fetch(base + "/api/me", { signal: AbortSignal.timeout(2000) })).status < 500) return; } catch { /* starting */ }
    await new Promise((done) => setTimeout(done, 500));
  }
  throw new Error(`Test server did not start: ${logs}`);
}, { timeout: 180000 });

after(async () => {
  if (server?.pid && server.exitCode === null) {
    const closed = once(server, "close");
    if (process.platform === "win32") execFileSync("taskkill", ["/PID", String(server.pid), "/T", "/F"], { stdio: "ignore" });
    else server.kill("SIGTERM");
    await closed;
  }
  await prisma?.$disconnect();
  await rm(directory, { recursive: true, force: true, maxRetries: 10, retryDelay: 300 });
});

test("empty database has no ranking or progress; schemas enforce the flag contract", async () => {
  assert.deepEqual(await getSiteWideRanking(100), []);
  assert.deepEqual((await getCtfRanking(1)).rows, []);
  const stats = await getCtfStats("alice"); assert.equal(stats.points, 0); assert.equal(stats.progress, 0);
  assert.equal(ctfCreateSchema.safeParse({ title: "x", description: "x", category: "Misc", difficulty: "easy", points: 100, flag: " " }).success, false);
  const home = await request("/"); assert.equal(home.status, 200);
  const html = await home.text(); assert.ok(html.includes("找出 Flag")); assert.ok(html.includes("尚無公開挑戰"));
  assert.ok(html.includes("APCS")); assert.ok(html.includes('href="/ctf"'));
});

test("scrypt ignores surrounding whitespace but preserves case and internal spaces", async () => {
  const hashed = await hashCtfFlag("  flag{A B} \n");
  assert.equal(await verifyCtfFlag("\tflag{A B}\n", hashed.flagSalt, hashed.flagHash), true);
  for (const wrong of ["flag{a B}", "flag{AB}", "flag{A  B}"]) assert.equal(await verifyCtfFlag(wrong, hashed.flagSalt, hashed.flagHash), false);
  assert.notEqual((await hashCtfFlag("flag{A B}")).flagSalt, hashed.flagSalt);
});

test("actual request bytes are bounded without Content-Length; download headers are safe", async () => {
  const body = new ReadableStream({ start(controller) { controller.enqueue(new Uint8Array(5)); controller.enqueue(new Uint8Array(5)); controller.close(); } });
  await assert.rejects(readCtfBody(new Request("http://local", { method: "POST", body, duplex: "half" }), 8), (error) => error.status === 413);
  for (const name of ["", "..", "../x", "a\\b", "bad\r\nheader"]) assert.throws(() => ctfFilename(name));
  const headers = ctfDownloadHeaders("測試 '檔案.html");
  assert.equal(headers["Content-Type"], "application/octet-stream");
  assert.equal(headers["Cache-Control"], "private, no-store");
  assert.match(headers["Content-Disposition"], /attachment;.*filename\*=UTF-8''/);
  assert.ok(!headers["Content-Disposition"].includes("測試"));
});

test("wrong/correct/repeated attempts persist only one solve, no plaintext, and preserve updatedAt", async () => {
  const c = await challenge();
  assert.equal(await submitCtfAttempt(prisma, "alice", c.id, "wrong"), "incorrect");
  assert.equal(await submitCtfAttempt(prisma, "alice", c.id, " flag{Test With Space} "), "correct");
  assert.equal(await submitCtfAttempt(prisma, "alice", c.id, "wrong"), "already_solved");
  assert.equal(await prisma.ctfSolve.count({ where: { challengeId: c.id } }), 1);
  const attempts = await prisma.ctfAttempt.findMany({ where: { challengeId: c.id }, orderBy: { id: "asc" } });
  assert.deepEqual(attempts.map((a) => a.result), ["INCORRECT", "CORRECT"]);
  assert.ok(attempts.every((a) => !Object.hasOwn(a, "flag")));
  assert.equal((await prisma.ctfChallenge.findUnique({ where: { id: c.id } })).updatedAt.getTime(), c.updatedAt.getTime());
});

test("independent connections/processes race correctly: one solve and one attempt", { timeout: 30000 }, async () => {
  const c = await challenge();
  const workers = Array.from({ length: 4 }, () => fork(resolve("scripts/ctf-attempt-worker.mjs"), [], {
    execArgv: ["--import", pathToFileURL(resolve("scripts/ctf-test-loader.mjs")).href], env: process.env, stdio: ["ignore", "ignore", "pipe", "ipc"],
  }));
  function message(worker) {
    return new Promise((accept, reject) => {
      let stderr = "";
      const onData = (chunk) => { stderr += chunk; };
      const onMessage = (value) => { cleanup(); accept(value); };
      const onExit = (code) => { cleanup(); reject(new Error(`CTF worker exited (${code}): ${stderr}`)); };
      const onError = (error) => { cleanup(); reject(error); };
      function cleanup() { worker.off("message", onMessage); worker.off("exit", onExit); worker.off("error", onError); worker.stderr.off("data", onData); }
      worker.stderr.on("data", onData); worker.once("message", onMessage); worker.once("exit", onExit); worker.once("error", onError);
    });
  }
  try {
    await Promise.all(workers.map(async (worker) => { assert.equal(await message(worker), "ready"); }));
    const results = workers.map(message);
    for (const worker of workers) worker.send({ userId: "racer", challengeId: c.id, flag: "flag{Test With Space}" });
    const outcomes = await Promise.all(results);
    assert.equal(outcomes.filter((o) => o.result === "correct").length, 1, JSON.stringify(outcomes));
    assert.equal(outcomes.filter((o) => o.result === "already_solved").length, 3, JSON.stringify(outcomes));
    assert.equal(await prisma.ctfSolve.count({ where: { challengeId: c.id } }), 1);
    assert.equal(await prisma.ctfAttempt.count({ where: { challengeId: c.id } }), 1);
  } finally {
    await Promise.all(workers.map(async (worker) => {
      if (worker.exitCode !== null) return;
      const closed = once(worker, "close"); worker.kill(); await closed;
    }));
  }
});

test("real transaction rejects visibility and flag changes between verification and commit", async () => {
  for (const change of [{ isPublic: false }, await hashCtfFlag("new flag")]) {
    const c = await challenge();
    const interleaved = new Proxy(prisma, { get(target, property) {
      if (property === "$transaction") return async (...args) => {
        await prisma.ctfChallenge.update({ where: { id: c.id }, data: change });
        return target.$transaction(...args);
      };
      const value = target[property]; return typeof value === "function" ? value.bind(target) : value;
    } });
    await assert.rejects(submitCtfAttempt(interleaved, "bob", c.id, "flag{Test With Space}"), (error) => error.status === 409);
    assert.equal(await prisma.ctfAttempt.count({ where: { challengeId: c.id } }), 0);
    assert.equal(await prisma.ctfSolve.count({ where: { challengeId: c.id } }), 0);
  }
});

test("concurrent HTTP submissions return one correct result without duplicate records", { timeout: 60000 }, async () => {
  const c = await challenge();
  const responses = await Promise.all(Array.from({ length: 4 }, () => request(`/api/ctf/challenges/${c.id}/attempts`, {
    method: "POST", user: "racer", json: { flag: "flag{Test With Space}" },
  })));
  const results = await Promise.all(responses.map(async (res) => { assert.equal(res.status, 200); return (await res.json()).result; }));
  assert.equal(results.filter((result) => result === "correct").length, 1);
  assert.equal(results.filter((result) => result === "already_solved").length, 3);
  assert.equal(await prisma.ctfSolve.count({ where: { challengeId: c.id } }), 1);
  assert.equal(await prisma.ctfAttempt.count({ where: { challengeId: c.id } }), 1);
});

test("ranking avoids multiplied joins, counts PROGRAMMING only, and supports CTF-only users", async () => {
  for (let i = 0; i < 30; i++) {
    const programming = i < 10;
    const p = await prisma.problem.create({ data: { title: `rank${i}`, statement: "test", type: programming ? "PROGRAMMING" : "RECOGNITION", order: i } });
    if (programming) await prisma.submission.createMany({ data: [1, 2].map(() => ({ userId: "ranker", problemId: p.id, language: "cpp", code: "", status: "AC" })) });
    else {
      await prisma.recognitionAnswer.create({ data: { userId: "ranker", problemId: p.id, selectedIndex: 0, isCorrect: true } });
      if (i === 10) await prisma.submission.create({ data: { userId: "ranker", problemId: p.id, language: "choice", code: "", status: "AC" } });
    }
  }
  const a = await challenge({ points: 200 }); const b = await challenge({ points: 300 });
  await prisma.ctfSolve.createMany({ data: [{ userId: "ranker", challengeId: a.id }, { userId: "ranker", challengeId: b.id }, { userId: "ctfonly", challengeId: b.id }] });
  let rows = await getSiteWideRanking(100);
  const row = rows.find((r) => r.username === "ranker");
  assert.equal(Number(row.score), 11.3); assert.equal(Number(row.solved), 10); assert.equal(Number(row.submissions), 20); assert.equal(Number(row.ctfPoints), 500);
  assert.equal(Number(rows.find((r) => r.username === "ctfonly").score), 0.9);
  assert.equal((await getUserStats("ranker")).totalSubmissions, 20);
  for (const [change, points] of [[{ points: 400 }, 400], [{ isPublic: false }, 0], [{ isPublic: true }, 400]]) {
    await prisma.ctfChallenge.update({ where: { id: b.id }, data: change });
    assert.equal((await getCtfStats("ctfonly")).points, points);
    assert.equal((await getUserStats("ctfonly")).ctf.points, points);
    rows = await getSiteWideRanking(100);
    assert.equal(Number(rows.find((r) => r.username === "ctfonly")?.ctfPoints ?? 0), points);
    assert.equal(Number((await getCtfRanking(1)).rows.find((r) => r.username === "ctfonly")?.points ?? 0), points);
  }
  const c = await challenge({ points: 123 });
  for (const [userId, time] of [["tieb", 1000], ["tiea", 1000]]) await prisma.ctfSolve.create({ data: { userId, challengeId: c.id, solvedAt: new Date(time) } });
  let ties = (await getCtfRanking(1)).rows.filter((r) => r.username.startsWith("tie"));
  assert.deepEqual(ties.map((r) => r.username), ["tiea", "tieb"]);
  await prisma.ctfSolve.update({ where: { userId_challengeId: { userId: "tiea", challengeId: c.id } }, data: { solvedAt: new Date(2000) } });
  ties = (await getCtfRanking(1)).rows.filter((r) => r.username.startsWith("tie"));
  assert.deepEqual(ties.map((r) => r.username), ["tieb", "tiea"]);
});

test("HTTP auth, admin CRUD, flag retention/replacement, and sensitive-data projections", { timeout: 180000 }, async () => {
  const payload = { title: "HTTP challenge", description: "# Hello", category: "Web", difficulty: "medium", points: 250, flag: "test{secret}", isPublic: false, order: 0 };
  assert.equal((await request("/api/admin/ctf/challenges", { method: "POST", user: "alice", json: payload })).status, 403);
  let res = await request("/api/admin/ctf/challenges", { method: "POST", user: "admin", json: payload }); assert.equal(res.status, 201);
  const { id } = await res.json();
  const attemptPath = `/api/ctf/challenges/${id}/attempts`;
  assert.equal((await request(attemptPath, { method: "POST", json: { flag: payload.flag } })).status, 401);
  assert.equal((await request(attemptPath, { method: "POST", user: "bob", json: { flag: payload.flag } })).status, 404);
  assert.equal((await request(`/ctf/${id}`)).status, 404);
  assert.equal((await request(`/ctf/${id}`, { user: "admin" })).status, 200);
  assert.equal((await request(`/api/admin/ctf/challenges/${id}`, { method: "PUT", user: "alice", json: payload })).status, 403);
  assert.equal((await request(`/api/admin/ctf/challenges/${id}`, { method: "PUT", user: "admin", json: { ...payload, isPublic: true, flag: "" } })).status, 200);
  const retained = await prisma.ctfChallenge.findUnique({ where: { id } });
  assert.equal(await verifyCtfFlag(payload.flag, retained.flagSalt, retained.flagHash), true);
  for (const [flag, result] of [["wrong", "incorrect"], [payload.flag, "correct"], [payload.flag, "already_solved"]]) {
    res = await request(attemptPath, { method: "POST", user: "bob", json: { flag } }); assert.equal(res.status, 200); assert.equal((await res.json()).result, result);
  }
  assert.equal((await request(`/api/admin/ctf/challenges/${id}`, { method: "PUT", user: "admin", json: { ...payload, isPublic: true, flag: "replaced" } })).status, 200);
  const replaced = await prisma.ctfChallenge.findUnique({ where: { id } });
  assert.equal(await verifyCtfFlag(payload.flag, replaced.flagSalt, replaced.flagHash), false);
  assert.equal(await verifyCtfFlag("replaced", replaced.flagSalt, replaced.flagHash), true);
  for (const path of [`/ctf/${id}`, `/admin/ctf/${id}/edit`, "/ctf", "/ctf/history", "/ctf/scoreboard", "/ranking", "/users/bob", "/settings"]) {
    const page = await request(path, { user: path.startsWith("/admin") ? "admin" : "bob" }); assert.equal(page.status, 200, path);
    const html = await page.text(); for (const secretValue of [payload.flag, replaced.flagSalt, replaced.flagHash]) assert.ok(!html.includes(secretValue), `secret in ${path}`);
  }
  assert.equal((await request(`/api/admin/ctf/challenges/${id}`, { method: "DELETE", user: "alice" })).status, 403);
});

test("HTTP attachments enforce bounds/permissions and force download; metadata preserves records", { timeout: 120000 }, async () => {
  const c = await challenge({ isPublic: false }); const other = await challenge();
  const path = `/api/admin/ctf/challenges/${c.id}/attachments`;
  const body = new FormData(); body.set("file", new File(["<html>test</html>"], "測試.html", { type: "text/html" }));
  assert.equal((await request(path, { method: "POST", user: "alice", body })).status, 403);
  let res = await request(path, { method: "POST", user: "admin", body }); assert.equal(res.status, 201);
  const attachment = await res.json();
  const download = `/api/ctf/challenges/${c.id}/attachments/${attachment.id}`;
  assert.equal((await request(download)).status, 404);
  res = await request(download, { user: "admin" }); assert.equal(res.status, 200); assert.equal(res.headers.get("content-type"), "application/octet-stream"); assert.match(res.headers.get("content-disposition"), /^attachment;/); assert.equal(await res.text(), "<html>test</html>");
  assert.equal((await request(`/api/ctf/challenges/${other.id}/attachments/${attachment.id}`, { user: "admin" })).status, 404);
  const deletePath = `/api/admin/ctf/challenges/${c.id}/attachments/${attachment.id}`;
  const denied = await request(deletePath, { method: "DELETE", user: "alice" });
  assert.equal(denied.status, 403, await denied.text());
  assert.equal((await request(`/api/admin/ctf/challenges/${other.id}/attachments/${attachment.id}`, { method: "DELETE", user: "admin" })).status, 404);
  const data = { title: "Renamed", description: "new", category: "Misc", difficulty: "easy", points: 200, isPublic: true, order: 0, flag: "" };
  await prisma.ctfSolve.create({ data: { userId: "alice", challengeId: c.id } });
  assert.equal((await request(`/api/admin/ctf/challenges/${c.id}`, { method: "PUT", user: "admin", json: data })).status, 200);
  assert.equal(await prisma.ctfAttachment.count({ where: { challengeId: c.id } }), 1); assert.equal(await prisma.ctfSolve.count({ where: { challengeId: c.id } }), 1);
  assert.equal((await request(download)).status, 200);
  for (const [bytes, expected] of [[0, 400], [4 * 1024 * 1024 + 1, 413]]) {
    const oversized = new FormData(); oversized.set("file", new File([new Uint8Array(bytes)], "test.bin"));
    assert.equal((await request(path, { method: "POST", user: "admin", body: oversized })).status, expected);
  }
  // A real chunked HTTP client stops writing when the server rejects the body.
  // Undici fetch may discard an early response as ECONNRESET while still sending.
  const chunkedStatus = await new Promise((accept, reject) => {
    let sent = 0, responded = false;
    const req = httpRequest(base + path, { method: "POST", headers: { Cookie: cookies.admin, "Content-Type": "multipart/form-data; boundary=test" } });
    const timer = setInterval(() => { if (++sent <= 6) req.write(Buffer.alloc(1024 * 1024)); else { clearInterval(timer); req.end(); } }, 100);
    req.on("response", (res) => { responded = true; clearInterval(timer); res.resume(); accept(res.statusCode); req.end(); });
    req.on("error", (error) => { clearInterval(timer); if (!responded) reject(error); });
    req.setTimeout(15000, () => req.destroy(new Error("Chunked upload timed out")));
  });
  assert.equal(chunkedStatus, 413);
  assert.equal((await request(deletePath, { method: "DELETE", user: "admin" })).status, 200);
  assert.equal((await request(`/api/admin/ctf/challenges/${c.id}`, { method: "DELETE", user: "admin" })).status, 200);
  assert.equal(await prisma.ctfSolve.count({ where: { challengeId: c.id } }), 0);
});

test("HTTP validates IDs, JSON limits, pagination, visibility, sitemap and Retry-After", { timeout: 60000 }, async () => {
  const c = await challenge({ title: "HIDDEN_UNIQUE_TITLE", isPublic: false });
  for (const raw of ["0", "-1", "nope"]) assert.equal((await request(`/api/ctf/challenges/${raw}/attempts`, { method: "POST", user: "limited", json: { flag: "x" } })).status, 400);
  assert.equal((await request(`/api/ctf/challenges/${c.id}/attempts`, { method: "POST", user: "limited", body: " ".repeat(8193), headers: { "Content-Type": "application/json" } })).status, 413);
  for (let i = 0; i < 7; i++) {
    const res = await request(`/api/ctf/challenges/${c.id}/attempts`, { method: "POST", user: "limited", json: { flag: "x" } });
    if (i < 6) assert.equal(res.status, 404);
    else { assert.equal(res.status, 429); assert.ok(Number(res.headers.get("Retry-After")) > 0); }
  }
  const html = await (await request("/ctf?category=invalid&difficulty=bad&page=-1&status=solved")).text();
  assert.ok(!html.includes(c.title));
  const sitemap = await (await request("/sitemap.xml")).text(); assert.ok(!sitemap.includes(`<loc>http://localhost:3000/ctf/${c.id}</loc>`));
  assert.ok(!new RegExp(`/ctf/${c.id}</loc>`).test(sitemap));
  const robots = await (await request("/robots.txt")).text(); assert.match(robots, /Disallow: \/ctf\/history/); assert.match(robots, /Disallow: \/ctf\/scoreboard/);
});

test("user and challenge deletion cascade attachments, solves and attempts", async () => {
  const c = await challenge(); const user = await prisma.user.create({ data: { username: "cascade" } });
  await submitCtfAttempt(prisma, user.id, c.id, "flag{Test With Space}");
  await prisma.user.delete({ where: { id: user.id } });
  assert.equal(await prisma.ctfSolve.count({ where: { userId: user.id } }), 0); assert.equal(await prisma.ctfAttempt.count({ where: { userId: user.id } }), 0);
  await submitCtfAttempt(prisma, "admin", c.id, "flag{Test With Space}");
  await prisma.ctfAttachment.create({ data: { challengeId: c.id, filename: "a.bin", sizeBytes: 1, data: new Uint8Array([1]) } });
  await prisma.ctfChallenge.delete({ where: { id: c.id } });
  assert.equal(await prisma.ctfSolve.count({ where: { challengeId: c.id } }), 0); assert.equal(await prisma.ctfAttempt.count({ where: { challengeId: c.id } }), 0); assert.equal(await prisma.ctfAttachment.count({ where: { challengeId: c.id } }), 0);
});

test("HTTP Web Labs: real pages, scoped guest login, intended IDOR and OJ permission isolation", { timeout: 120000 }, async () => {
  const source = await challenge({ category: "Web", labType: "SOURCE" });
  const cookie = await challenge({ category: "Web", labType: "COOKIE" });
  const idor = await challenge({ category: "Web", labType: "IDOR" });
  const originalUserCount = await prisma.user.count();
  let res = await request(`/ctf/labs/${source.id}`);
  assert.equal(res.status, 200); const sourceHtml = await res.text();
  assert.match(sourceHtml, /maintainer-note: flag\{Test With Space\}/);
  assert.match(res.headers.get("content-security-policy"), /script-src 'nonce-/);
  assert.equal((await request(`/ctf/labs/${source.id}/unexpected`)).status, 404);
  assert.equal((await request(`/ctf/labs/${source.id}/login`, { method: "POST", body: "username=guest&password=guest" })).status, 405);
  const plain = await challenge(); assert.equal((await request(`/ctf/labs/${plain.id}`)).status, 404);

  const basePath = `/ctf/labs/${cookie.id}`;
  const cookieName = `ctf_lab_${cookie.id}_role`;
  res = await request(basePath); assert.equal(res.status, 200);
  assert.match(res.headers.get("set-cookie"), new RegExp(`Path=/ctf/labs/${cookie.id};`));
  assert.ok(!res.headers.get("set-cookie").includes("oj_session"));
  res = await request(`${basePath}/login`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: "username=guest&password=wrong" });
  assert.equal(res.status, 403);
  res = await request(`${basePath}/login`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: "username=guest&password=guest" });
  assert.equal(res.status, 303); assert.equal(res.headers.get("location"), basePath);
  assert.match(res.headers.get("set-cookie"), new RegExp(`^${cookieName}=guest;`));
  assert.equal((await request(`${basePath}/admin`, { headers: { Cookie: `${cookieName}=guest` } })).status, 403);
  res = await request(`${basePath}/admin`, { headers: { Cookie: `${cookieName}=admin` } });
  assert.equal(res.status, 200); assert.ok((await res.text()).includes("flag{Test With Space}"));
  assert.equal((await request("/api/admin/ctf/challenges", {
    method: "POST", headers: { Cookie: `${cookies.bob}; ${cookieName}=admin` },
    json: { title: "denied", description: "denied", category: "Web", difficulty: "easy", points: 100, flag: "x" },
  })).status, 403);
  res = await request(`${basePath}/logout`, { method: "POST" });
  assert.equal(res.status, 303); assert.match(res.headers.get("set-cookie"), /Max-Age=0/);
  await prisma.ctfChallenge.update({ where: { id: cookie.id }, data: { isPublic: false } });
  assert.equal((await request(`${basePath}/admin`, { headers: { Cookie: `${cookieName}=admin` } })).status, 404);
  assert.equal((await request(basePath, { user: "admin" })).status, 200);
  const own = await (await request(`/ctf/labs/${idor.id}/notes/1001`)).text(); assert.ok(!own.includes("flag{Test With Space}"));
  const other = await (await request(`/ctf/labs/${idor.id}/notes/1002`)).text(); assert.ok(other.includes("flag{Test With Space}"));
  assert.equal((await request(`/ctf/labs/${idor.id}/notes/1`)).status, 404);
  assert.equal(await prisma.user.count(), originalUserCount);
});

test("HTTP six new Web Labs: admin creation, real requests, correct flags and hidden GET/POST access", { timeout: 120000 }, async () => {
  const usersBefore = await prisma.user.count();
  const form = (fields) => ({ method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams(fields).toString() });
  for (const definition of createWebExpansionChallenges()) {
    const response = await request("/api/admin/ctf/challenges", { method: "POST", user: "admin", json: { ...definition, isPublic: true } });
    assert.equal(response.status, 201);
    const { id } = await response.json();
    const basePath = `/ctf/labs/${id}`;
    const stored = await prisma.ctfChallenge.findUnique({ where: { id } });
    const home = await request(basePath); assert.equal(home.status, 200);
    const html = await home.text();
    for (const value of [definition.flag, stored.flagHash, stored.labFlagCiphertext]) assert.ok(!html.includes(value));
    let solved, endpoint;
    switch (definition.labType) {
      case "ROBOTS": {
        const rules = await (await request(`${basePath}/robots.txt`)).text();
        endpoint = rules.match(/Disallow: (.+)/)[1]; solved = await request(endpoint); break;
      }
      case "BACKUP":
        assert.equal((await request(`${basePath}/config.php`)).status, 403);
        endpoint = `${basePath}/config.php.bak`; solved = await request(endpoint); break;
      case "PRICE":
        assert.equal((await request(`${basePath}/buy`, form({ item: "flag-box", price: "10000" }))).status, 403);
        endpoint = `${basePath}/buy`; solved = await request(endpoint, form({ item: "flag-box", price: "1" })); break;
      case "JWT": {
        const login = await request(`${basePath}/login`, form({ username: "guest", password: "guest" }));
        assert.equal(login.status, 303);
        const cookie = login.headers.get("set-cookie").split(";")[0];
        assert.equal((await request(`${basePath}/admin`, { headers: { Cookie: cookie } })).status, 403);
        const [header, payload, signature] = cookie.split("=")[1].split(".");
        const claims = JSON.parse(Buffer.from(payload, "base64url")); claims.role = "admin";
        endpoint = `${basePath}/admin`;
        solved = await request(endpoint, { headers: { Cookie: `ctf_lab_${id}_token=${header}.${Buffer.from(JSON.stringify(claims)).toString("base64url")}.${signature}` } }); break;
      }
      case "TRAVERSAL":
        assert.equal((await request(`${basePath}/download?file=../../.env`)).status, 404);
        endpoint = `${basePath}/download?file=../internal/maintenance.txt`; solved = await request(endpoint); break;
      case "SQLI":
        assert.equal((await request(`${basePath}/login`, form({ username: "admin", password: "wrong" }))).status, 403);
        endpoint = `${basePath}/login`; solved = await request(endpoint, form({ username: "admin' --", password: "x" })); break;
    }
    assert.equal(solved.status, 200, definition.labType);
    assert.ok((await solved.text()).includes(definition.flag), definition.labType);
    assert.equal(solved.headers.get("cache-control"), "private, no-store");
    const submission = await request(`/api/ctf/challenges/${id}/attempts`, { method: "POST", user: "alice", json: { flag: definition.flag } });
    assert.equal((await submission.json()).result, "correct");
    assert.equal((await request(`${basePath}/unexpected`)).status, 404);
    if (["PRICE", "JWT", "SQLI"].includes(definition.labType)) {
      const action = definition.labType === "PRICE" ? "buy" : "login";
      assert.equal((await request(`${basePath}/${action}`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: "x=" + "a".repeat(8192) })).status, 413);
      assert.equal((await request(`${basePath}/${action}`, { method: "POST", json: { username: "guest" } })).status, 400);
    }
    await prisma.ctfChallenge.update({ where: { id }, data: { isPublic: false } });
    assert.equal((await request(endpoint)).status, 404);
    assert.equal((await request(endpoint, { method: "POST" })).status, 404);
    assert.equal((await request(basePath, { user: "admin" })).status, 200);
  }
  assert.equal(await prisma.user.count(), usersBefore);
});

test("HTTP lab flag replacement stays consistent and public/editor props never contain the encrypted envelope", { timeout: 60000 }, async () => {
  const data = { title: "Managed lab", description: "Managed description", category: "Web", difficulty: "easy", points: 100, isPublic: true, order: 0, flag: "flag{managed1}", labType: "COOKIE" };
  let res = await request("/api/admin/ctf/challenges", { method: "POST", user: "admin", json: data });
  assert.equal(res.status, 201); const { id } = await res.json();
  const first = await prisma.ctfChallenge.findUnique({ where: { id } });
  assert.ok(first.labFlagCiphertext); assert.ok(!first.labFlagCiphertext.includes(data.flag));
  res = await request(`/api/admin/ctf/challenges/${id}`, { method: "PUT", user: "admin", json: { ...data, flag: "" } });
  assert.equal(res.status, 200);
  assert.equal((await prisma.ctfChallenge.findUnique({ where: { id } })).labFlagCiphertext, first.labFlagCiphertext);
  res = await request(`/api/admin/ctf/challenges/${id}`, { method: "PUT", user: "admin", json: { ...data, flag: "flag{managed2}" } });
  assert.equal(res.status, 200);
  const updated = await prisma.ctfChallenge.findUnique({ where: { id } });
  const role = `ctf_lab_${id}_role=admin`;
  const html = await (await request(`/ctf/labs/${id}/admin`, { headers: { Cookie: role } })).text();
  assert.ok(html.includes("flag{managed2}")); assert.ok(!html.includes("flag{managed1}"));
  assert.equal((await (await request(`/api/ctf/challenges/${id}/attempts`, { method: "POST", user: "admin", json: { flag: "flag{managed1}" } })).json()).result, "incorrect");
  assert.equal((await (await request(`/api/ctf/challenges/${id}/attempts`, { method: "POST", user: "admin", json: { flag: "flag{managed2}" } })).json()).result, "correct");
  for (const path of [`/ctf/${id}`, `/admin/ctf/${id}/edit`]) {
    const page = await request(path, { user: path.startsWith("/admin") ? "admin" : "alice" }); assert.equal(page.status, 200);
    const body = await page.text();
    for (const secretValue of [updated.labFlagCiphertext, updated.flagHash, updated.flagSalt, "flag{managed2}"]) assert.ok(!body.includes(secretValue), `secret in ${path}`);
  }
  res = await request(`/api/admin/ctf/challenges/${id}`, { method: "PUT", user: "admin", json: { ...data, flag: "", labType: null } });
  assert.equal(res.status, 200); assert.equal((await request(`/ctf/labs/${id}`)).status, 404);
  res = await request(`/api/admin/ctf/challenges/${id}`, { method: "PUT", user: "admin", json: { ...data, flag: "" } });
  assert.equal(res.status, 400);
});

test("HTTP modal activity is paginated, authorized and contains only public solves or the current user's attempts", { timeout: 60000 }, async () => {
  assert.equal((await request("/ctf/not/a/challenge")).status, 404);
  const c = await challenge({ category: "Web", labType: "COOKIE" });
  for (let index = 0; index < 21; index++) {
    const user = await prisma.user.create({ data: { username: `activity-${index}` } });
    await prisma.ctfSolve.create({ data: { userId: user.id, challengeId: c.id, solvedAt: new Date(1000 + index) } });
  }
  const aliceAttempt = await prisma.ctfAttempt.create({ data: { userId: "alice", challengeId: c.id, result: "INCORRECT" } });
  await prisma.ctfAttempt.create({ data: { userId: "bob", challengeId: c.id, result: "CORRECT" } });
  const path = `/api/ctf/challenges/${c.id}/activity`;
  let res = await request(`${path}?kind=solves&page=1`); assert.equal(res.status, 200);
  const first = await res.json(); assert.equal(first.rows.length, 20); assert.equal(first.hasNext, true);
  res = await request(`${path}?kind=solves&page=2`); const last = await res.json(); assert.equal(last.rows.length, 1); assert.equal(last.hasNext, false);
  assert.equal((await request(`${path}?kind=attempts`)).status, 401);
  res = await request(`${path}?kind=attempts&userId=bob`, { user: "alice" }); assert.equal(res.status, 200);
  const mine = await res.json(); assert.equal(mine.rows.length, 1); assert.equal(mine.rows[0].id, aliceAttempt.id);
  const json = JSON.stringify({ first, last, mine });
  for (const secret of [c.flagHash, c.flagSalt, c.labFlagCiphertext, "flag{Test With Space}"]) assert.ok(!json.includes(secret));
  assert.equal(res.headers.get("cache-control"), "private, no-store");
  assert.equal((await request(`${path}?kind=invalid`)).status, 400);
  await prisma.ctfChallenge.update({ where: { id: c.id }, data: { isPublic: false } });
  assert.equal((await request(path)).status, 404);
  assert.equal((await request(`${path}?kind=attempts`, { user: "alice" })).status, 404);
  assert.equal((await request(path, { user: "admin" })).status, 200);
});

test("home exposes public CTF metadata, all three tracks and only the current member's progress", { timeout: 60000 }, async () => {
  const publicLab = await challenge({ title: "HOME_PUBLIC_CTF", category: "Web", labType: "COOKIE" });
  const hiddenLab = await challenge({ title: "HOME_HIDDEN_CTF", category: "Web", labType: "IDOR", isPublic: false });
  const privateStats = await getCtfStats("alice");
  let res = await request("/"); assert.equal(res.status, 200);
  const guest = await res.text();
  for (const marker of ["HOME_PUBLIC_CTF", "開始 CTF 挑戰", "實作題庫", "識讀練習", "42／28／30"]) assert.ok(guest.includes(marker), marker);
  assert.ok(!guest.includes("data-home-personal-ctf")); assert.ok(!guest.includes(hiddenLab.title));
  res = await request("/", { user: "alice" }); assert.equal(res.status, 200);
  const member = await res.text(); assert.ok(member.includes("data-home-personal-ctf"));
  assert.ok(member.includes(`已累積 <strong>${privateStats.points}</strong>`));
  for (const html of [guest, member]) for (const secret of [publicLab.flagHash, publicLab.flagSalt, publicLab.labFlagCiphertext, hiddenLab.flagHash, hiddenLab.labFlagCiphertext, "flag{Test With Space}"]) assert.ok(!html.includes(secret));
  await prisma.ctfChallenge.update({ where: { id: publicLab.id }, data: { isPublic: false } });
  assert.ok(!(await (await request("/")).text()).includes(publicLab.title));
});

test("browser: pagination, mobile/App navigation, keyboard submit, retry and admin attachments", {
  skip: !process.env.CTF_BROWSER_MODULE, timeout: 240000,
}, async () => {
  const { chromium } = await import(pathToFileURL(process.env.CTF_BROWSER_MODULE).href);
  const browser = await chromium.launch({ channel: process.env.CTF_BROWSER_CHANNEL || undefined });
  const c = await challenge({ title: "Browser flag challenge" });
  await challenge({ title: "[入門] 看不見的留言", category: "Web", labType: "SOURCE" });
  await challenge({ title: "[入門] Cookie 裡的管理員", category: "Web", labType: "COOKIE", points: 150 });
  await challenge({ title: "[入門] 票券編號的另一邊", category: "Web", labType: "IDOR", points: 150 });
  for (let i = 0; i < 22; i++) await challenge({ title: `UI_PAGE_${String(i).padStart(2, "0")}`, category: "Crypto", order: i });
  async function context(options = {}, user) {
    const ctx = await browser.newContext(options);
    await ctx.route("**/*", (route) => new URL(route.request().url()).origin === base ? route.continue() : route.abort());
    if (user) await ctx.addCookies([{ name: "oj_session", value: cookies[user].slice("oj_session=".length), url: base }]);
    return ctx;
  }
  async function noOverflow(page) {
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), "page overflows viewport");
  }
  try {
    const desktop = await context({ viewport: { width: 1280, height: 900 } });
    const page = await desktop.newPage();
    for (const width of [1280, 390, 320]) {
      await page.setViewportSize({ width, height: 900 }); await page.goto(base + "/");
      await page.getByRole("heading", { level: 1, name: /找出 Flag/ }).waitFor(); await noOverflow(page);
      assert.equal(await page.locator("[data-home-practice]").count(), 3);
      assert.equal(await page.getByRole("link", { name: /開始 CTF 挑戰/ }).getAttribute("href"), "/ctf");
      assert.equal(await page.locator(".home-mission, .home-tracks, .home-ctf-categories").count(), 0);
      for (const selector of [".homepage-simple .card", ".homepage-simple-actions .btn-primary"]) {
        assert.equal(await page.locator(selector).first().evaluate((element) => getComputedStyle(element).borderTopLeftRadius), "0px");
      }
      await page.locator(".homepage-simple-stats").scrollIntoViewIfNeeded();
      if (process.env.CTF_SCREENSHOT_DIR) {
        await page.locator(".site-loader").waitFor({ state: "detached" });
        await page.evaluate(() => scrollTo(0, 0));
        await page.screenshot({ path: join(process.env.CTF_SCREENSHOT_DIR, `itou-home-top-${width}.png`) });
        await page.screenshot({ path: join(process.env.CTF_SCREENSHOT_DIR, `itou-home-${width}.png`), fullPage: true });
      }
    }
    await page.setViewportSize({ width: 1280, height: 900 }); await page.goto(base + "/ctf?category=Crypto");
    await page.getByRole("heading", { name: "CTF 題庫", exact: true }).waitFor();
    assert.equal(await page.getByRole("link", { name: /UI_PAGE_/ }).count(), 20);
    await page.getByRole("link", { name: "下一頁", exact: true }).click();
    await page.getByText("第 2 頁", { exact: true }).waitFor();
    assert.equal(await page.getByRole("link", { name: /UI_PAGE_/ }).count(), 2);
    await noOverflow(page);
    if (process.env.CTF_SCREENSHOT_DIR) await page.screenshot({ path: join(process.env.CTF_SCREENSHOT_DIR, "ctf-desktop.png"), fullPage: true });
    await page.goto(base + `/ctf/${c.id}`);
    assert.match(await page.getByRole("link", { name: "登入後提交" }).getAttribute("href"), /next=%2Fctf%2F/);

    for (const colorScheme of ["light", "dark"]) {
      const mobile = await context({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, colorScheme });
      const p = await mobile.newPage(); await p.goto(base + "/ctf");
      await p.getByRole("heading", { name: "CTF 題庫", exact: true }).waitFor(); await noOverflow(p);
      await mobile.close();
    }
    const app = await context({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }, "alice");
    // Exercise the existing WebView stylesheet/nav without invoking native plugins.
    await app.addInitScript(() => document.addEventListener("DOMContentLoaded", () => document.documentElement.setAttribute("data-app", "1")));
    const appPage = await app.newPage(); await appPage.goto(base + "/");
    await appPage.locator("[data-home-personal-ctf]").waitFor(); await noOverflow(appPage);
    await appPage.locator('[data-home-practice][href="/ctf"]').scrollIntoViewIfNeeded();
    assert.equal(await appPage.locator('[data-app-section="promo"]').isVisible(), false);
    if (process.env.CTF_SCREENSHOT_DIR) {
      await appPage.locator(".site-loader").waitFor({ state: "detached" });
      await appPage.evaluate(() => scrollTo(0, 0));
      await appPage.screenshot({ path: join(process.env.CTF_SCREENSHOT_DIR, "itou-home-app.png"), fullPage: true });
    }
    await appPage.goto(base + `/ctf/${c.id}`);
    await appPage.getByRole("button", { name: "更多", exact: true }).click();
    await appPage.getByRole("link", { name: "CTF 練習", exact: true }).waitFor();
    await appPage.keyboard.press("Escape");
    await appPage.locator("#app-more-nav").waitFor({ state: "hidden" });
    assert.match(await appPage.getByRole("button", { name: "更多", exact: true }).getAttribute("class"), /active/);
    const flagInput = appPage.getByLabel("Flag", { exact: true }); await flagInput.fill("wrong");
    await flagInput.press("Enter"); await appPage.getByText("Flag 不正確，再試試看。", { exact: true }).waitFor();
    let abortNext = true;
    await appPage.route(`**/api/ctf/challenges/${c.id}/attempts`, async (route) => {
      if (abortNext) { abortNext = false; await route.abort(); }
      else { await new Promise((done) => setTimeout(done, 400)); await route.continue(); }
    });
    await flagInput.fill("flag{Test With Space}"); await flagInput.press("Enter");
    await appPage.locator('p[role="alert"]').waitFor();
    const submit = appPage.getByRole("button", { name: "提交 Flag", exact: true }); assert.equal(await submit.isEnabled(), true);
    await submit.click(); await appPage.getByRole("button", { name: "判定中…", exact: true }).waitFor();
    await appPage.getByText("答對了！", { exact: true }).waitFor(); await noOverflow(appPage);
    if (process.env.CTF_SCREENSHOT_DIR) await appPage.screenshot({ path: join(process.env.CTF_SCREENSHOT_DIR, "ctf-app.png"), fullPage: true });

    const admin = await context({ viewport: { width: 1280, height: 900 } }, "admin");
    const adminPage = await admin.newPage(); await adminPage.goto(base + "/admin/ctf/new");
    await adminPage.getByLabel("標題", { exact: true }).fill("Browser-created challenge");
    await adminPage.getByLabel("題目敘述（Markdown）", { exact: true }).fill("# Browser test");
    await adminPage.getByLabel("Flag", { exact: true }).fill("browser-secret");
    await adminPage.getByRole("button", { name: "儲存題目", exact: true }).click();
    await adminPage.waitForURL(/\/admin\/ctf\/\d+\/edit$/);
    await adminPage.getByLabel("選擇附件").setInputFiles({ name: "demo.bin", mimeType: "application/octet-stream", buffer: Buffer.from("demo") });
    await adminPage.getByRole("button", { name: "上傳附件", exact: true }).click();
    await adminPage.getByRole("link", { name: /demo\.bin/ }).waitFor();
    assert.equal(await adminPage.getByLabel("替換 Flag（留空保留原值）", { exact: true }).inputValue(), "");

    const source = await challenge({ category: "Web", labType: "SOURCE" });
    await page.goto(base + `/ctf/${source.id}`);
    const [labPage] = await Promise.all([page.waitForEvent("popup"), page.getByRole("link", { name: "前往練習網站 ↗", exact: true }).click()]);
    await labPage.getByLabel("暱稱").fill("learner");
    await labPage.getByRole("button", { name: "登記迎新" }).click();
    await labPage.getByText("登記完成，迎新時見！", { exact: true }).waitFor();
    await labPage.setViewportSize({ width: 390, height: 844 }); await noOverflow(labPage);
    const cookie = await challenge({ category: "Web", labType: "COOKIE" });
    await labPage.goto(base + `/ctf/labs/${cookie.id}`);
    await labPage.getByLabel("帳號", { exact: true }).fill("guest");
    await labPage.getByLabel("密碼", { exact: true }).fill("guest");
    await labPage.getByRole("button", { name: "登入社員站" }).click();
    await labPage.locator(".badge").filter({ hasText: "guest" }).waitFor();
    await labPage.getByRole("link", { name: "管理員公告", exact: true }).click();
    await labPage.getByRole("heading", { name: "這裡還不能進。" }).waitFor();
    await labPage.evaluate(({ id }) => { document.cookie = `ctf_lab_${id}_role=admin; Path=/ctf/labs/${id}; SameSite=Lax`; }, { id: cookie.id });
    await labPage.reload(); await labPage.locator(".flag").waitFor(); await noOverflow(labPage);
    const idor = await challenge({ category: "Web", labType: "IDOR" });
    await labPage.goto(base + `/ctf/labs/${idor.id}`);
    await labPage.getByRole("link", { name: "查看我的票券", exact: true }).click();
    await labPage.getByRole("heading", { name: "新手的迎新入場券", exact: true }).waitFor();
    await labPage.goto(base + `/ctf/labs/${idor.id}/notes/1002`);
    await labPage.getByRole("heading", { name: "管理員的特別票券", exact: true }).waitFor();
    await labPage.locator(".flag").waitFor(); await noOverflow(labPage);
    if (process.env.CTF_SCREENSHOT_DIR) await labPage.screenshot({ path: join(process.env.CTF_SCREENSHOT_DIR, "ctf-web-lab-mobile.png"), fullPage: true });

    // Routed challenge modal: preserve board filters/history and update an
    // unsolved-only board after a successful submission without reopening it.
    const modalChallenge = await challenge({ title: "Modal challenge", category: "Crypto", difficulty: "medium", order: 500 });
    const otherModal = await challenge({ title: "Other modal challenge", category: "Crypto", difficulty: "medium", order: 501 });
    const member = await context({ viewport: { width: 1280, height: 900 } }, "alice");
    const board = await member.newPage();
    const boardUrl = base + "/ctf?category=Crypto&difficulty=medium&status=unsolved";
    await board.goto(boardUrl);
    const card = () => board.locator(`[data-ctf-challenge-id="${modalChallenge.id}"]`);
    const modal = () => board.getByRole("dialog", { name: "Modal challenge", exact: true });
    await card().scrollIntoViewIfNeeded(); await card().focus();
    const scroll = await board.evaluate(() => window.scrollY);
    await card().press("Enter"); await modal().waitFor();
    assert.ok(new URL(board.url()).pathname.endsWith(`/ctf/challenges/${modalChallenge.id}`));
    assert.equal(new URL(board.url()).searchParams.get("category"), "Crypto");
    assert.equal(await board.locator("#ctf-board-title").count(), 1);
    assert.equal(await board.evaluate(() => document.body.style.overflow), "hidden");
    for (let step = 0; step < 5; step++) {
      await board.keyboard.press("Tab");
      assert.equal(await board.evaluate(() => Boolean(document.activeElement?.closest("dialog.ctf-modal"))), true);
    }
    await modal().getByRole("tab", { name: /解題者/ }).click();
    await modal().getByText("尚未有人解出這題", { exact: true }).waitFor();
    await modal().getByRole("tab", { name: "我的提交", exact: true }).click();
    await modal().getByText("你還沒有提交這題", { exact: true }).waitFor();
    await board.keyboard.press("Escape"); await board.locator("dialog.ctf-modal").waitFor({ state: "detached" });
    assert.equal(board.url(), boardUrl);
    assert.ok(Math.abs(await board.evaluate(() => window.scrollY) - scroll) < 3);
    assert.equal(await card().evaluate((element) => element === document.activeElement), true);
    await card().click(); await modal().waitFor();
    await board.goBack(); await board.locator("dialog.ctf-modal").waitFor({ state: "detached" });
    await board.goForward(); await modal().waitFor();
    await board.reload();
    await board.getByRole("heading", { name: "Modal challenge", exact: true }).waitFor();
    assert.equal(await board.locator("dialog.ctf-modal").count(), 0);
    await board.goto(boardUrl); await card().click(); await modal().waitFor();
    await board.mouse.click(2, 2); await board.locator("dialog.ctf-modal").waitFor({ state: "detached" });
    assert.equal(board.url(), boardUrl);
    await card().click(); await modal().waitFor();
    await modal().getByLabel("Flag", { exact: true }).fill("wrong");
    await modal().getByRole("button", { name: "提交 Flag", exact: true }).click();
    await modal().getByText("Flag 不正確，再試試看。", { exact: true }).waitFor();
    await modal().getByLabel("Flag", { exact: true }).fill("flag{Test With Space}");
    await modal().getByRole("button", { name: "提交 Flag", exact: true }).click();
    await modal().getByText("答對了！", { exact: true }).waitFor();
    assert.equal(await board.locator('form[action="/ctf"] select[name="category"]').inputValue(), "Crypto");
    assert.equal(await board.locator('form[action="/ctf"] select[name="difficulty"]').inputValue(), "medium");
    assert.equal(await board.locator('form[action="/ctf"] select[name="status"]').inputValue(), "unsolved");
    await modal().getByRole("tab", { name: "我的提交", exact: true }).click();
    await modal().getByRole("cell", { name: "正確", exact: true }).waitFor();
    if (process.env.CTF_SCREENSHOT_DIR) await board.screenshot({ path: join(process.env.CTF_SCREENSHOT_DIR, "ctf-modal-desktop.png") });
    await modal().getByRole("button", { name: "關閉題目", exact: true }).click();
    await board.locator("dialog.ctf-modal").waitFor({ state: "detached" });
    assert.equal(board.url(), boardUrl); assert.equal(await card().count(), 0);
    await prisma.ctfSolve.create({ data: { userId: "bob", challengeId: otherModal.id } });
    await board.locator(`[data-ctf-challenge-id="${otherModal.id}"]`).click();
    const second = board.getByRole("dialog", { name: "Other modal challenge", exact: true }); await second.waitFor();
    assert.equal(await second.getByLabel("Flag", { exact: true }).inputValue(), "");
    await second.getByRole("tab", { name: /解題者/ }).click();
    await second.getByRole("link", { name: "bob", exact: true }).click();
    await board.waitForURL(/\/users\/bob$/); assert.equal(await board.locator("dialog.ctf-modal").count(), 0);
    await board.goto(boardUrl.replace("&status=unsolved", "&status=solved"));
    assert.equal(await card().getAttribute("data-solved"), "true");

    // Static CTF pages must never be caught by the challenge modal rewrite.
    await board.goto(base + "/ctf");
    await board.getByRole("link", { name: "CTF 計分板", exact: true }).click();
    await board.getByRole("heading", { name: "CTF 計分板", exact: true }).waitFor();
    assert.equal(await board.locator("dialog.ctf-modal").count(), 0);
    await board.goto(base + "/ctf");
    await board.getByRole("link", { name: "我的提交", exact: true }).click();
    await board.getByRole("heading", { name: "我的 CTF 提交", exact: true }).waitFor();
    await board.getByRole("cell", { name: "Modal challenge", exact: true }).first().waitFor();
    assert.equal(await board.locator("dialog.ctf-modal").count(), 0);
    await board.goto(base + "/ctf");
    await board.locator('button[aria-controls="account-navigation"]').click();
    await board.getByRole("menuitem", { name: /CTF 提交紀錄/ }).click();
    await board.getByRole("heading", { name: "我的 CTF 提交", exact: true }).waitFor();
    assert.equal(await board.locator("dialog.ctf-modal").count(), 0);

    // Header layout, keyboard disclosure and account-only/admin-only entries.
    for (const width of [768, 1024, 1280]) {
      await page.setViewportSize({ width, height: 900 }); await page.goto(base + "/ctf"); await noOverflow(page);
      assert.equal(await page.locator(".header-main-links > a").count(), 3);
      const trigger = page.getByRole("button", { name: "練習", exact: true });
      await trigger.press("ArrowDown");
      await page.getByRole("menu", { name: "練習", exact: true }).waitFor();
      // Wait for the page/header entrance and menu animation to settle. Hover
      // also verifies the last item is not clipped or covered by another layer.
      await page.getByRole("menuitem", { name: "全站提交紀錄", exact: true }).hover();
      const menu = page.locator("#practice-navigation"); const bounds = await menu.boundingBox();
      assert.ok(await page.evaluate(({ x, y }) => Boolean(document.elementFromPoint(x, y)?.closest("#practice-navigation")), { x: bounds.x + 20, y: bounds.y + bounds.height - 15 }));
      assert.equal(await page.getByRole("menuitem", { name: "實作練習", exact: true }).evaluate((element) => element === document.activeElement), true);
      await page.keyboard.press("ArrowDown"); await page.keyboard.press("ArrowDown");
      assert.equal(await page.getByRole("menuitem", { name: "CTF 練習", exact: true }).evaluate((element) => element === document.activeElement), true);
      await page.keyboard.press("Escape"); assert.equal(await trigger.evaluate((element) => element === document.activeElement), true);
      await trigger.click(); await page.getByRole("button", { name: "搜尋實作題或標籤", exact: true }).click();
      assert.equal(await menu.count(), 0); await page.keyboard.press("Escape");
    }
    await page.getByRole("button", { name: "練習", exact: true }).click();
    await page.getByRole("menuitem", { name: "全站提交紀錄", exact: true }).hover();
    if (process.env.CTF_SCREENSHOT_DIR) await page.screenshot({ path: join(process.env.CTF_SCREENSHOT_DIR, "itou-header-desktop.png") });
    await page.keyboard.press("Escape");
    await adminPage.goto(base + "/ctf");
    await adminPage.locator('button[aria-controls="account-navigation"]').click();
    await adminPage.getByRole("menuitem", { name: /管理後台/ }).waitFor();
    assert.equal(await adminPage.getByRole("menuitem", { name: /程式／識讀紀錄/ }).getAttribute("href"), "/submissions?mine=1");
    await adminPage.keyboard.press("Escape");
    await board.goto(base + "/ctf"); await board.locator('button[aria-controls="account-navigation"]').click();
    assert.equal(await board.getByRole("menuitem", { name: /管理後台/ }).count(), 0);
    await board.keyboard.press("Escape");
    const recordProblem = await prisma.problem.create({ data: { title: "OWN_PROGRAM_SUBMISSION", statement: "test", type: "PROGRAMMING", problemCode: "z991", order: 9999 } });
    await prisma.submission.create({ data: { userId: "alice", problemId: recordProblem.id, language: "cpp", code: "", status: "AC" } });
    await board.goto(base + "/users/alice");
    await board.getByRole("link", { name: "OWN_PROGRAM_SUBMISSION", exact: true }).first().waitFor();
    await board.locator('button[aria-controls="account-navigation"]').click();
    await board.getByRole("menuitem", { name: /程式／識讀紀錄/ }).click();
    await board.waitForURL(/\/submissions\?mine=1$/);
    await board.getByRole("link", { name: "OWN_PROGRAM_SUBMISSION", exact: true }).first().waitFor();
    await prisma.user.update({ where: { id: "alice" }, data: { displayName: "這是一個比較長的會員顯示名稱用來驗證導覽列" } });
    await prisma.message.create({ data: { senderId: "bob", receiverId: "alice", content: "Header badge fixture" } });
    for (const width of [320, 390, 768]) {
      await board.setViewportSize({ width, height: 844 }); await board.goto(base + "/ctf"); await noOverflow(board);
      const trigger = board.locator('button[aria-controls="account-navigation"]');
      const bounds = await trigger.boundingBox(); assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= width);
      await trigger.click(); await board.getByRole("menuitem", { name: /站內訊息/ }).waitFor();
      await board.keyboard.press("Escape");
      if (width === 390 && process.env.CTF_SCREENSHOT_DIR) await board.screenshot({ path: join(process.env.CTF_SCREENSHOT_DIR, "itou-header-mobile.png") });
      if (width < 768) {
        await board.getByRole("button", { name: "開啟選單", exact: true }).click();
        await board.getByRole("dialog", { name: "主選單", exact: true }).waitFor();
        await board.getByRole("button", { name: "關閉主選單", exact: true }).click();
      }
    }
    for (const width of [320, 390]) {
      const mobileMenu = await context({ viewport: { width, height: 844 }, isMobile: true, hasTouch: true });
      const p = await mobileMenu.newPage(); await p.goto(base + "/ctf"); await noOverflow(p);
      await p.getByRole("button", { name: "開啟選單", exact: true }).click();
      const overlay = p.getByRole("dialog", { name: "主選單", exact: true }); await overlay.waitFor();
      await overlay.getByRole("link", { name: "CTF 練習", exact: true }).click();
      await overlay.waitFor({ state: "detached" });
      await p.goto(base + "/ctf?category=Crypto&difficulty=medium");
      await p.locator(`[data-ctf-challenge-id="${otherModal.id}"]`).scrollIntoViewIfNeeded();
      await p.locator(`[data-ctf-challenge-id="${otherModal.id}"]`).click();
      const popup = p.getByRole("dialog", { name: "Other modal challenge", exact: true }); await popup.waitFor(); await noOverflow(p);
      if (width === 390 && process.env.CTF_SCREENSHOT_DIR) await p.screenshot({ path: join(process.env.CTF_SCREENSHOT_DIR, "ctf-modal-mobile.png") });
      await popup.getByRole("button", { name: "關閉題目", exact: true }).click();
      await p.locator("dialog.ctf-modal").waitFor({ state: "detached" });
      await mobileMenu.close();
    }
  } finally { await browser.close(); }
});
