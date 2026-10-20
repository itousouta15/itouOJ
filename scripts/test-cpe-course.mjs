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

const tempRoot = resolve(process.env.CPE_TEST_TEMP_ROOT || tmpdir());
const directory = mkdtempSync(join(tempRoot, "itouoj-cpe-http-"));
process.env.DATABASE_URL = `file:${join(directory, "test.db").replaceAll("\\", "/")}`;
process.env.AUTH_SECRET = "cpe-disposable-test-secret-not-production";
const publicCodes = ["a460", "a844", "a845", "a846", "a847"];
const cookies = {};
let prisma,
  server,
  base,
  logs = "";

async function request(path, user) {
  return fetch(base + path, {
    headers: user ? { Cookie: cookies[user] } : {},
    redirect: "manual",
    signal: AbortSignal.timeout(60000),
  });
}

before(
  async () => {
    const database = new Database(join(directory, "test.db"));
    try {
      for (const name of readdirSync("prisma/migrations")
        .filter((name) => /^\d/.test(name))
        .sort()) {
        database.exec(
          readFileSync(`prisma/migrations/${name}/migration.sql`, "utf8"),
        );
      }
    } finally {
      database.close();
    }
    ({ prisma } = await import("../src/lib/db.ts"));
    for (const username of ["admin", "alice", "bob"]) {
      await prisma.user.create({
        data: {
          id: username,
          username,
          role: username === "admin" ? "ADMIN" : "USER",
        },
      });
      const token = await new SignJWT({ userId: username, sessionVersion: 0 })
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime("1h")
        .sign(new TextEncoder().encode(process.env.AUTH_SECRET));
      cookies[username] = `oj_session=${token}`;
    }
    const tag = await prisma.tag.create({ data: { name: "CPE" } });
    const { cpeProblemCatalog } =
      await import("../src/lib/cpeProblemCatalog.ts");
    for (const code of [...publicCodes, "a478", "a480", "a482", "a999"]) {
      const id = Number(code.slice(1));
      const problem = cpeProblemCatalog.find((entry) => entry.code === code);
      await prisma.problem.create({
        data: {
          id,
          order: id,
          problemCode: code,
          title:
            code === "a478"
              ? "CPE private fixture must not leak"
              : (problem?.title ?? "Future CPE fixture"),
          statement: "Disposable test statement, not a live problem.",
          isPublic: code !== "a478",
          type: code === "a482" ? "RECOGNITION" : "PROGRAMMING",
          ...(code !== "a480" ? { tags: { create: { tagId: tag.id } } } : {}),
        },
      });
    }
    for (const [userId, problemId, status] of [
      ["alice", 460, "AC"],
      ["alice", 460, "AC"],
      ["alice", 845, "WA"],
      ["alice", 478, "AC"],
      ["bob", 844, "AC"],
    ]) {
      await prisma.submission.create({
        data: {
          userId,
          problemId,
          status,
          language: "python",
          code: "# disposable fixture",
        },
      });
    }
    const socket = createServer();
    socket.listen(0, "127.0.0.1");
    await once(socket, "listening");
    const port = socket.address().port;
    await new Promise((done) => socket.close(done));
    base = `http://127.0.0.1:${port}`;
    const production = process.env.CPE_TEST_PRODUCTION === "1";
    server = spawn(
      process.execPath,
      [
        "node_modules/next/dist/bin/next",
        production ? "start" : "dev",
        "-p",
        String(port),
        "-H",
        "127.0.0.1",
      ],
      {
        env: {
          ...process.env,
          NODE_ENV: production ? "production" : "development",
          COOKIE_SECURE: "0",
          NEXT_TELEMETRY_DISABLED: "1",
        },
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    server.stdout.on("data", (chunk) => {
      logs += chunk;
    });
    server.stderr.on("data", (chunk) => {
      logs += chunk;
    });
    const deadline = Date.now() + 90000;
    while (Date.now() < deadline) {
      if (server.exitCode !== null)
        throw new Error(`CPE test server exited: ${logs}`);
      try {
        if (
          (await fetch(base + "/api/me", { signal: AbortSignal.timeout(2000) }))
            .status < 500
        )
          return;
      } catch {
        /* starting */
      }
      await new Promise((done) => setTimeout(done, 500));
    }
    throw new Error(`CPE test server did not start: ${logs}`);
  },
  { timeout: 180000 },
);

after(async () => {
  if (server?.pid && server.exitCode === null) {
    const closed = once(server, "close");
    if (process.platform === "win32")
      execFileSync("taskkill", ["/PID", String(server.pid), "/T", "/F"], {
        stdio: "ignore",
      });
    else server.kill("SIGTERM");
    await closed;
  }
  await prisma?.$disconnect();
  assert.equal(dirname(directory), tempRoot);
  assert.ok(basename(directory).startsWith("itouoj-cpe-http-"));
  await rm(directory, {
    recursive: true,
    force: true,
    maxRetries: 10,
    retryDelay: 300,
  });
});

test("CPE path appears without creating a database course", async () => {
  assert.equal(await prisma.course.count(), 0);
  const response = await request("/courses");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.ok(html.includes('href="/courses/cpe"'));
  assert.ok(html.includes("CPE 逐題教學"));
  assert.ok(!html.includes("還沒有課程"));
  const index = await (await request("/courses/cpe")).text();
  const links = new Set(
    [...index.matchAll(/href="\/courses\/cpe\/lessons\/(a\d+)"/g)].map(
      (match) => match[1],
    ),
  );
  assert.deepEqual([...links].sort(), [...publicCodes].sort());
  assert.ok(!index.includes("private fixture must not leak"));
  assert.equal(await prisma.course.count(), 0);
});

test("filters search by number and name, preserve no-result state, and combine difficulty/topic", async () => {
  const { cpeLessons } = await import("../src/lib/cpeLessons.ts");
  const level = cpeLessons.a845.level;
  const topic = cpeLessons.a845.topic;
  for (const query of ["a845", "Quirksome Squares"]) {
    const response = await request(
      `/courses/cpe?q=${encodeURIComponent(query)}&level=${level}&topic=${topic}`,
    );
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.ok(html.includes('href="/courses/cpe/lessons/a845"'));
    assert.ok(!html.includes('href="/courses/cpe/lessons/a846"'));
  }
  const empty = await (
    await request("/courses/cpe?q=nonexistent-cpe-fixture")
  ).text();
  assert.ok(empty.includes("沒有符合的教學"));
  const invalid = await request("/courses/cpe?level=invalid&topic=invalid");
  assert.equal(invalid.status, 200);
});

test("hidden, retagged, deleted, unknown and non-programming lessons are inaccessible", async () => {
  for (const code of ["a478", "a480", "a481", "a482", "a999", "not-a-code"]) {
    const response = await request(`/courses/cpe/lessons/${code}`);
    assert.equal(response.status, 404, code);
    assert.ok(
      !(await response.text()).includes("private fixture must not leak"),
    );
  }
  const admin = await request("/courses/cpe/lessons/a478", "admin");
  assert.equal(admin.status, 200);
  assert.ok((await admin.text()).includes("private fixture must not leak"));
});

test("public lessons render real examples and navigation excludes inaccessible entries", async () => {
  for (const code of publicCodes) {
    const response = await request(`/courses/cpe/lessons/${code}`);
    assert.equal(response.status, 200, code);
    const html = await response.text();
    assert.ok(
      html.includes("解題思路") &&
        html.includes("完整程式") &&
        html.includes("Python"),
    );
    assert.ok(html.includes(`href="/problems/${code}"`));
    for (const match of html.matchAll(
      /href="\/courses\/cpe\/lessons\/(a\d+)"/g,
    ))
      assert.ok(publicCodes.includes(match[1]));
  }
});

test("problem headers link to CPE lessons only for catalogued live CPE tags", async () => {
  const taught = await request("/problems/a460");
  assert.equal(taught.status, 200);
  assert.ok((await taught.text()).includes('href="/courses/cpe/lessons/a460"'));
  for (const code of ["a480", "a999"]) {
    const html = await (await request(`/problems/${code}`)).text();
    assert.ok(!html.includes(`href="/courses/cpe/lessons/${code}"`));
  }
});

test("progress counts unique own ACs and excludes hidden problems", async () => {
  const html = await (await request("/courses/cpe", "alice")).text();
  assert.match(html, /1(?:<!-- -->)? 題已完成/);
  const card = await (await request("/courses", "alice")).text();
  assert.ok(card.includes("1 題已完成"));
  assert.equal(await prisma.courseMember.count(), 0);
});
