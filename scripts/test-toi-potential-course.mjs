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

const tempRoot = resolve(process.env.TOI_POTENTIAL_TEST_TEMP_ROOT || tmpdir());
const directory = mkdtempSync(join(tempRoot, "itouoj-toi-potential-http-"));
process.env.DATABASE_URL = `file:${join(directory, "test.db").replaceAll("\\", "/")}`;
process.env.AUTH_SECRET = "toi-potential-disposable-test-secret-not-production";
const publicCodes = ["a108", "a353", "a354", "a355", "a114", "a344"];
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
    const tag = await prisma.tag.create({ data: { name: "TOI 歷屆" } });
    const { toiPotentialProblemCatalog } =
      await import("../src/lib/toiPotentialProblemCatalog.ts");
    for (const code of [
      ...publicCodes,
      "a109",
      "a110",
      "a112",
      "a999",
      "a086",
    ]) {
      const id = Number(code.slice(1));
      const problem = toiPotentialProblemCatalog.find(
        (entry) => entry.code === code,
      );
      await prisma.problem.create({
        data: {
          id,
          order: id,
          problemCode: code,
          title:
            code === "a109"
              ? "TOI potential private fixture must not leak"
              : (problem?.title ?? "Future TOI potential fixture"),
          statement: "Disposable test statement, not a live problem.",
          isPublic: code !== "a109",
          type: code === "a112" ? "RECOGNITION" : "PROGRAMMING",
          ...(code !== "a110" ? { tags: { create: { tagId: tag.id } } } : {}),
        },
      });
    }
    for (const [userId, problemId, status] of [
      ["alice", 108, "AC"],
      ["alice", 108, "AC"],
      ["alice", 354, "WA"],
      ["alice", 109, "AC"],
      ["alice", 86, "AC"],
      ["bob", 353, "AC"],
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
    const production = process.env.TOI_POTENTIAL_TEST_PRODUCTION === "1";
    server = spawn(
      process.execPath,
      [
        "node_modules/next/dist/bin/next",
        production ? "start" : "dev",
        ...(!production && process.platform === "win32" ? ["--webpack"] : []),
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
        throw new Error(`TOI potential test server exited: ${logs}`);
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
    console.error(
      `TOI potential startup failed (test child PID ${server.pid}): ${logs}`,
    );
    throw new Error(`TOI potential test server did not start: ${logs}`);
  },
  { timeout: 180000 },
);

after(async () => {
  if (server?.pid && server.exitCode === null) {
    const closed = once(server, "close");
    if (process.platform === "win32")
      execFileSync("taskkill", ["/PID", String(server.pid), "/T", "/F"], {
        stdio: "ignore",
        timeout: 10000,
      });
    else server.kill("SIGTERM");
    let timer;
    try {
      await Promise.race([
        closed,
        new Promise((_, reject) => {
          timer = setTimeout(
            () =>
              reject(new Error(`Test server PID ${server.pid} did not close`)),
            10000,
          );
        }),
      ]);
    } finally {
      clearTimeout(timer);
    }
  }
  await prisma?.$disconnect();
  assert.equal(dirname(directory), tempRoot);
  assert.ok(basename(directory).startsWith("itouoj-toi-potential-http-"));
  await rm(directory, {
    recursive: true,
    force: true,
    maxRetries: 10,
    retryDelay: 300,
  });
});

test("TOI potential path appears without creating a database course", async () => {
  assert.equal(await prisma.course.count(), 0);
  const response = await request("/courses");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.ok(html.includes('href="/courses/toi-potential"'));
  assert.ok(html.includes("TOI 潛力組逐題教學"));
  assert.ok(!html.includes("還沒有課程"));
  const index = await (await request("/courses/toi-potential")).text();
  const links = new Set(
    [
      ...index.matchAll(/href="\/courses\/toi-potential\/lessons\/(a\d+)"/g),
    ].map((match) => match[1]),
  );
  assert.deepEqual([...links].sort(), [...publicCodes].sort());
  assert.ok(!index.includes("private fixture must not leak"));
  assert.equal(await prisma.course.count(), 0);
});

test("filters search by number and name, preserve no-result state, and combine difficulty/topic", async () => {
  const { toiPotentialLessons } =
    await import("../src/lib/toiPotentialLessons.ts");
  const level = toiPotentialLessons.a354.level;
  const topic = toiPotentialLessons.a354.topic;
  for (const query of ["a354", "枯枝"]) {
    const response = await request(
      `/courses/toi-potential?q=${encodeURIComponent(query)}&level=${level}&topic=${topic}`,
    );
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.ok(html.includes('href="/courses/toi-potential/lessons/a354"'));
    assert.ok(!html.includes('href="/courses/toi-potential/lessons/a355"'));
  }
  const empty = await (
    await request("/courses/toi-potential?q=nonexistent-cpe-fixture")
  ).text();
  assert.ok(empty.includes("沒有符合的教學"));
  const repeated = await request(
    "/courses/toi-potential?q=a354&q=ignored&topic=invalid&topic=dp&level=invalid&level=easy",
  );
  assert.equal(repeated.status, 200);
  assert.ok(
    (await repeated.text()).includes(
      'href="/courses/toi-potential/lessons/a354"',
    ),
  );
  const invalid = await request(
    "/courses/toi-potential?level=invalid&topic=invalid",
  );
  assert.equal(invalid.status, 200);
});

test("hidden, retagged, deleted, unknown and non-programming lessons are inaccessible", async () => {
  for (const code of [
    "a109",
    "a110",
    "a111",
    "a112",
    "a999",
    "a086",
    "not-a-code",
  ]) {
    const response = await request(`/courses/toi-potential/lessons/${code}`);
    assert.equal(response.status, 404, code);
    assert.ok(
      !(await response.text()).includes("private fixture must not leak"),
    );
  }
  const admin = await request("/courses/toi-potential/lessons/a109", "admin");
  assert.equal(admin.status, 200);
  assert.ok((await admin.text()).includes("private fixture must not leak"));
});

test("public lessons render real examples and navigation excludes inaccessible entries", async () => {
  for (const code of publicCodes) {
    const response = await request(`/courses/toi-potential/lessons/${code}`);
    assert.equal(response.status, 200, code);
    const html = await response.text();
    assert.ok(
      html.includes("解題思路") &&
        html.includes(code === "a344" ? "非可提交解答" : "完整程式") &&
        html.includes("Python"),
    );
    assert.ok(html.includes(`href="/problems/${code}"`));
    for (const match of html.matchAll(
      /href="\/courses\/toi-potential\/lessons\/(a\d+)"/g,
    ))
      assert.ok(publicCodes.includes(match[1]));
  }
});

test("problem headers link to TOI potential lessons only for catalogued live TOI potential tags", async () => {
  const taught = await request("/problems/a108");
  assert.equal(taught.status, 200);
  assert.ok(
    (await taught.text()).includes(
      'href="/courses/toi-potential/lessons/a108"',
    ),
  );
  for (const code of ["a110", "a999", "a086"]) {
    const html = await (await request(`/problems/${code}`)).text();
    assert.ok(!html.includes(`href="/courses/toi-potential/lessons/${code}"`));
  }
});

test("progress counts unique own ACs and excludes hidden problems", async () => {
  const html = await (await request("/courses/toi-potential", "alice")).text();
  assert.match(html, /1(?:<!-- -->)? 題已完成/);
  const card = await (await request("/courses", "alice")).text();
  assert.ok(card.includes("1 題已完成"));
  assert.equal(await prisma.courseMember.count(), 0);
});

test("a344 source conflict is clearly labelled, not presented as a verified submission", async () => {
  const index = await (await request("/courses/toi-potential?q=a344")).text();
  assert.ok(index.includes("規格待釐清"));
  const html = await (
    await request("/courses/toi-potential/lessons/a344")
  ).text();
  assert.ok(html.includes("公式示範程式（非可提交解答）"));
  assert.ok(html.includes("T₁=2"));
  assert.ok(html.includes("查看原題疑義"));
});

test("existing beginner course, lesson links and membership stay independent", async () => {
  const course = await prisma.course.create({
    data: {
      title: "TOI 新手組 練習",
      problems: { create: { problemId: 86 } },
      members: { create: { userId: "alice" } },
    },
  });
  const courses = await (await request("/courses", "alice")).text();
  assert.ok(courses.includes("TOI 新手組 練習"));
  assert.ok(courses.includes('href="/courses/toi-potential"'));
  const beginner = await request(`/courses/${course.id}/lessons/a086`, "alice");
  assert.equal(beginner.status, 200);
  const header = await (await request("/problems/a086", "alice")).text();
  assert.ok(header.includes(`href="/courses/${course.id}/lessons/a086"`));
  assert.ok(!header.includes('href="/courses/toi-potential/lessons/a086"'));
  assert.equal(await prisma.course.count(), 1);
  assert.equal(await prisma.courseMember.count(), 1);
});

test("TOI entry coexists with saved database course ordering and private visibility", async () => {
  const ids = [10, 11, 12, 13];
  await prisma.course.createMany({
    data: [
      { id: 10, title: "APCS 實作題：由簡到難", sortOrder: 40 },
      { id: 11, title: "Custom first fixture", sortOrder: 10 },
      {
        id: 12,
        title: "Private ordered course fixture",
        sortOrder: 20,
        isPublic: false,
      },
      { id: 13, title: "Custom tied order fixture", sortOrder: 10 },
    ],
  });
  try {
    for (const user of [undefined, "admin"]) {
      const response = await request("/courses", user);
      assert.equal(response.status, 200);
      const html = await response.text();
      const rendered = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, "");
      const expected = await prisma.course.findMany({
        where: user ? {} : { isPublic: true },
        orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
        select: { id: true },
      });
      assert.deepEqual(
        [...rendered.matchAll(/href="\/courses\/(\d+)"/g)].map((match) =>
          Number(match[1]),
        ),
        expected.map((item) => item.id),
      );
      assert.ok(html.includes('href="/courses/toi-potential"'));
      assert.equal(
        html.includes("Private ordered course fixture"),
        Boolean(user),
      );
    }
  } finally {
    await prisma.course.deleteMany({ where: { id: { in: ids } } });
  }
});
