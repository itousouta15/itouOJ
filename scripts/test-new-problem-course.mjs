import assert from "node:assert/strict";
import { before, after, test } from "node:test";
import { mkdtempSync, readdirSync, readFileSync } from "node:fs";
import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve, dirname, basename } from "node:path";
import { execFileSync, spawn } from "node:child_process";
import { once } from "node:events";
import { createServer } from "node:net";
import Database from "better-sqlite3";
import { SignJWT } from "jose";
import { newProblemLessons, newProblemWhere } from "../src/lib/newProblemLessons.ts";

const tempRoot = resolve(tmpdir());
const directory = mkdtempSync(join(tempRoot, "itouoj-practice-http-"));
process.env.DATABASE_URL = `file:${join(directory, "test.db").replaceAll("\\", "/")}`;
process.env.AUTH_SECRET = "practice-disposable-test-secret-not-production";
const publicCodes = ["a877", "a980", "b001", "b133", "b162", "b376", "b492", "b562", "b608", "b654", "b700", "b746", "b790"];
let prisma, server, base, adminCookie, logs = "";
async function request(path, admin = false) {
  return fetch(base + path, { headers: admin ? { Cookie: adminCookie } : {}, redirect: "manual", signal: AbortSignal.timeout(90000) });
}

before(async () => {
  const db = new Database(join(directory, "test.db"));
  try {
    for (const name of readdirSync("prisma/migrations").filter((name) => /^\d/.test(name)).sort())
      db.exec(readFileSync(`prisma/migrations/${name}/migration.sql`, "utf8"));
  } finally { db.close(); }
  ({ prisma } = await import("../src/lib/db.ts"));
  await prisma.user.create({ data: { id: "admin", username: "admin", role: "ADMIN" } });
  const token = await new SignJWT({ userId: "admin", sessionVersion: 0 }).setProtectedHeader({ alg: "HS256" }).setExpirationTime("1h").sign(new TextEncoder().encode(process.env.AUTH_SECRET));
  adminCookie = `oj_session=${token}`;
  for (const [index, code] of [...publicCodes, "a878", "b002", "z999"].entries()) {
    await prisma.problem.create({ data: {
      problemCode: code, order: index + 1,
      title: code === "a878" ? "PRIVATE-LESSON-TITLE-MUST-NOT-LEAK" : code === "b376" ? "LIVE-RENAMED-PRACTICE" : (newProblemLessons[code]?.title ?? "Unauthored fixture"),
      statement: "Disposable test statement, never a production question.",
      isPublic: code !== "a878", type: code === "b002" ? "RECOGNITION" : "PROGRAMMING",
    } });
  }
  const socket = createServer(); socket.listen(0, "127.0.0.1"); await once(socket, "listening");
  const port = socket.address().port; await new Promise((done) => socket.close(done));
  base = `http://127.0.0.1:${port}`;
  const production = process.env.PRACTICE_TEST_PRODUCTION === "1";
  server = spawn(process.execPath, ["node_modules/next/dist/bin/next", production ? "start" : "dev", "-p", String(port), "-H", "127.0.0.1"], {
    env: { ...process.env, NODE_ENV: production ? "production" : "development", COOKIE_SECURE: "0", NEXT_TELEMETRY_DISABLED: "1" }, stdio: ["ignore", "pipe", "pipe"],
  });
  server.stdout.on("data", (chunk) => { logs += chunk; }); server.stderr.on("data", (chunk) => { logs += chunk; });
  const deadline = Date.now() + 120000;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) throw new Error(`Practice server exited: ${logs}`);
    try { if ((await fetch(base + "/api/me", { signal: AbortSignal.timeout(2000) })).status < 500) return; } catch { /* starting */ }
    await new Promise((done) => setTimeout(done, 500));
  }
  throw new Error(`Practice server did not start: ${logs}`);
}, { timeout: 180000 });

after(async () => {
  if (server?.pid && server.exitCode === null) {
    const closed = once(server, "close");
    if (process.platform === "win32") execFileSync("taskkill", ["/PID", String(server.pid), "/T", "/F"], { stdio: "ignore" });
    else server.kill("SIGTERM");
    await closed;
  }
  await prisma?.$disconnect();
  assert.equal(dirname(directory), tempRoot);
  assert.ok(basename(directory).startsWith("itouoj-practice-http-"));
  await rm(directory, { recursive: true, force: true, maxRetries: 10, retryDelay: 300 });
});

test("a and b topics appear without DB courses, using the live public title", async () => {
  assert.equal(await prisma.course.count(), 0);
  assert.equal(await prisma.problem.count({ where: newProblemWhere() }), publicCodes.length);
  const courses = await request("/courses"); assert.equal(courses.status, 200);
  assert.ok((await courses.text()).includes('href="/courses/practice"'));
  const index = await request("/courses/practice"); assert.equal(index.status, 200);
  const html = await index.text();
  assert.ok(html.includes("LIVE-RENAMED-PRACTICE")); assert.ok(!html.includes("PRIVATE-LESSON-TITLE-MUST-NOT-LEAK"));
  const links = [...new Set([...html.matchAll(/href="\/courses\/practice\/lessons\/([a-z]\d{3})"/g)].map((m) => m[1]))].sort();
  assert.deepEqual(links, [...publicCodes].sort());
  const sitemap = await request("/sitemap.xml"); assert.equal(sitemap.status, 200);
  const xml = await sitemap.text();
  for (const code of publicCodes) assert.ok(xml.includes(`/courses/practice/lessons/${code}`));
  for (const code of ["a878", "b002", "b003", "z999"]) assert.ok(!xml.includes(`/courses/practice/lessons/${code}`));
});

test("search finds b codes and live titles and combines topic and difficulty", async () => {
  const lesson = newProblemLessons.b376;
  for (const query of ["B376", "LIVE-RENAMED-PRACTICE"]) {
    const response = await request(`/courses/practice?q=${encodeURIComponent(query)}&topic=${lesson.topic}&level=${lesson.level}`); assert.equal(response.status, 200);
    const html = await response.text(); assert.ok(html.includes('href="/courses/practice/lessons/b376"')); assert.ok(!html.includes('href="/courses/practice/lessons/b001"'));
  }
  assert.ok((await (await request("/courses/practice?q=NO-SUCH-QUESTION")).text()).includes("沒有符合條件"));
});

test("lessons render animation, C++/Python, examples and only accessible navigation", async () => {
  for (const code of publicCodes) {
    const response = await request(`/courses/practice/lessons/${code}`); assert.equal(response.status, 200, code);
    const html = await response.text();
    assert.ok(html.includes("解題思路") && html.includes("完整程式") && html.includes("Python") && html.includes("Step-by-step animation"));
    assert.ok(html.includes(`href="/problems/${code}"`));
    if (code === "b162") assert.ok(html.includes("教學示例") && html.includes("（無輸入）"));
    if (code === "b133") assert.ok(html.includes("效能範圍") && html.includes("最壞"));
    if (code === "a980") assert.ok(html.includes("效能範圍") && html.includes("建議使用C++") && html.includes("較小規模"));
    for (const match of html.matchAll(/href="\/courses\/practice\/lessons\/([a-z]\d{3})"/g)) assert.ok(publicCodes.includes(match[1]));
    const problem = await request(`/problems/${code}`); assert.equal(problem.status, 200);
    assert.ok((await problem.text()).includes(`href="/courses/practice/lessons/${code}"`));
  }
});

test("private, deleted, unauthored and recognition questions cannot leak through lesson routes", async () => {
  for (const code of ["a878", "b002", "b003", "z999", "not-a-code"]) {
    const response = await request(`/courses/practice/lessons/${code}`); assert.equal(response.status, 404, code);
    assert.ok(!(await response.text()).includes("PRIVATE-LESSON-TITLE-MUST-NOT-LEAK"));
  }
  const admin = await request("/courses/practice/lessons/a878", true); assert.equal(admin.status, 200);
  assert.ok((await admin.text()).includes("PRIVATE-LESSON-TITLE-MUST-NOT-LEAK"));
  await prisma.problem.deleteMany({ where: { problemCode: "b001", type: "PROGRAMMING" } });
  assert.equal((await request("/courses/practice/lessons/b001")).status, 404);
});
