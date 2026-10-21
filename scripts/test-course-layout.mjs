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
import { toiBeginnerProblemCatalog } from "../src/lib/toiBeginnerProblemCatalog.ts";

const tempRoot = resolve(process.env.COURSE_LAYOUT_TEST_TEMP_ROOT || tmpdir());
const directory = mkdtempSync(join(tempRoot, "itouoj-course-layout-http-"));
process.env.DATABASE_URL = `file:${join(directory, "test.db").replaceAll("\\", "/")}`;
process.env.AUTH_SECRET = "course-layout-disposable-test-secret-not-production";
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
    for (const username of ["admin", "alice", "bob", "carol"]) {
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
    await prisma.user.update({
      where: { id: "bob" },
      data: { displayName: "PRIVATE-MEMBER-FIXTURE" },
    });
    for (const [id, code, title, difficulty, type, isPublic] of [
      [6, "a006", "加總與迴圈", "easy", "PROGRAMMING", true],
      [29, "a029", "0/1 背包", "hard", "PROGRAMMING", true],
      [86, "a086", "TOI 2026/03 新手組：湯圓", "easy", "PROGRAMMING", true],
      [458, "a458", "APCS 判斷入門", "easy", "PROGRAMMING", true],
      [900, "a900", "新增的未分類練習", "custom", "PROGRAMMING", true],
      [901, null, "觀念選擇題", "medium", "RECOGNITION", true],
      [902, "a902", "HIDDEN-PROBLEM-FIXTURE", "easy", "PROGRAMMING", false],
      [903, null, "待設定題號", "easy", "PROGRAMMING", true],
    ]) {
      await prisma.problem.create({
        data: {
          id,
          order: id,
          problemCode: code,
          title,
          difficulty,
          type,
          isPublic,
          statement: "Disposable test statement.",
        },
      });
    }
    for (const [id, title] of [
      [1, "一般練習課程"],
      [2, "APCS 實作題：由簡到難"],
      [3, "APCS 歷屆"],
      [4, "TOI 新手組 練習"],
      [5, "PRIVATE-COURSE-FIXTURE"],
      [6, "空課程"],
    ]) {
      await prisma.course.create({
        data: {
          id,
          title,
          isPublic: id !== 5,
          description: "依主題與方法，循序練習。",
          joinCode: id === 1 ? "SECRET-JOIN-FIXTURE" : null,
          ...(id !== 6
            ? {
                problems: {
                  create: [458, 86, 29, 6, 900, 901, 902, 903].map(
                    (problemId, order) => ({ problemId, order }),
                  ),
                },
              }
            : {}),
        },
      });
    }
    for (const userId of ["alice", "bob"]) {
      await prisma.courseMember.create({ data: { courseId: 1, userId } });
    }
    for (const [userId, problemId, status] of [
      ["alice", 6, "AC"],
      ["alice", 6, "AC"],
      ["alice", 29, "WA"],
      ["alice", 902, "AC"],
      ["bob", 29, "AC"],
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
    await prisma.problem.createMany({
      data: toiBeginnerProblemCatalog
        .filter((problem) => problem.code !== "a086")
        .map((problem) => ({
          id: Number(problem.code.slice(1)),
          order: Number(problem.code.slice(1)),
          problemCode: problem.code,
          title: problem.title,
          statement: "Disposable full-curriculum fixture.",
          isPublic: true,
          type: "PROGRAMMING",
        })),
    });
    await prisma.course.create({
      data: {
        id: 10,
        title: "TOI 新手組 練習",
        isPublic: true,
        problems: {
          create: [...toiBeginnerProblemCatalog]
            .reverse()
            .map((problem, order) => ({
              problemId: Number(problem.code.slice(1)),
              order,
            })),
        },
      },
    });
    const socket = createServer();
    socket.listen(0, "127.0.0.1");
    await once(socket, "listening");
    const port = socket.address().port;
    await new Promise((done) => socket.close(done));
    base = `http://127.0.0.1:${port}`;
    const production = process.env.COURSE_LAYOUT_TEST_PRODUCTION === "1";
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
        throw new Error(`Course layout test server exited: ${logs}`);
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
    throw new Error(`Course layout test server did not start: ${logs}`);
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
    await Promise.race([
      closed,
      new Promise((_, reject) => {
        const timer = setTimeout(
          () => reject(new Error("Server shutdown timeout")),
          10000,
        );
        timer.unref();
      }),
    ]);
  }
  await prisma?.$disconnect();
  if (process.env.COURSE_LAYOUT_TEST_KEEP_DB === "1") {
    console.log(`Preview fixture: ${directory}`);
    return;
  }
  assert.equal(dirname(directory), tempRoot);
  assert.ok(basename(directory).startsWith("itouoj-course-layout-http-"));
  await rm(directory, {
    recursive: true,
    force: true,
    maxRetries: 10,
    retryDelay: 300,
  });
});

function rendered(html) {
  return html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, "");
}
function entryCount(html) {
  return [...rendered(html).matchAll(/data-course-entry="/g)].length;
}
async function page(path, user) {
  const response = await request(path, user);
  assert.equal(response.status, 200);
  return response.text();
}

test("all database courses use collapsed units and retain every visible entry exactly once", async () => {
  for (const id of [1, 2, 3, 4]) {
    const html = await page(`/courses/${id}`);
    assert.ok(html.includes('role="search"'));
    assert.ok(html.includes("主題單元"));
    assert.ok(html.includes("<details"));
    assert.ok(!rendered(html).match(/<details[^>]*\sopen(?:[=>\s])/));
    assert.equal(entryCount(html), 7, `course ${id}`);
    assert.equal(
      new Set(
        [...rendered(html).matchAll(/data-course-entry="(\d+)"/g)].map(
          (m) => m[1],
        ),
      ).size,
      7,
    );
    assert.ok(!html.includes("HIDDEN-PROBLEM-FIXTURE"));
    assert.ok(!html.includes("/problems/null"));
    assert.ok(html.includes('href="/recognition/q/901"'));
    assert.ok(html.includes("待設定題號"));
  }
});

test("ordinary overview honors persisted course ordering across difficulty levels", async () => {
  const saved = await prisma.courseProblem.findMany({
    where: { courseId: 1 },
    orderBy: [{ order: "asc" }, { id: "asc" }],
    include: { problem: { select: { isPublic: true } } },
  });
  try {
    await prisma.$transaction(
      saved.map((item, index) =>
        prisma.courseProblem.update({
          where: { id: item.id },
          data: { order: saved.length - index },
        }),
      ),
    );
    const html = rendered(await page("/courses/1"));
    assert.deepEqual(
      [...html.matchAll(/data-course-entry="(\d+)"/g)].map((match) =>
        Number(match[1]),
      ),
      saved
        .filter((item) => item.problem.isPublic)
        .reverse()
        .map((item) => item.id),
    );
  } finally {
    await prisma.$transaction(
      saved.map((item) =>
        prisma.courseProblem.update({
          where: { id: item.id },
          data: { order: item.order },
        }),
      ),
    );
  }
});

test("known tutorials route to lessons; unmatched and recognition entries stay practice links", async () => {
  for (const [id, code] of [
    [2, "a006"],
    [3, "a458"],
    [4, "a086"],
  ]) {
    const html = await page(`/courses/${id}`);
    assert.ok(html.includes(`href="/courses/${id}/lessons/${code}"`));
    assert.ok(html.includes('href="/problems/a900"'));
    assert.ok(!html.includes(`href="/courses/${id}/lessons/a900"`));
    assert.ok(html.includes("其他練習") || id === 2);
    const lesson = await request(`/courses/${id}/lessons/${code}`);
    assert.equal(lesson.status, 200);
    if (code === "a086") {
      const text = await lesson.text();
      assert.ok(text.includes("湯圓需求、購買盒數與剩餘顆數"));
      assert.ok(text.includes("2 7\n2 6"));
      assert.ok(text.includes("sesameBoxes"));
      assert.ok(text.includes("sesame_boxes"));
      assert.ok(!text.includes("17 5"));
      assert.ok(!text.includes("total / size"));
    }
  }
});

test("search by code, name and method combines filters, expands matches, and resets", async () => {
  for (const query of ["A029", "背包", "動態規劃"]) {
    const html = await page(
      `/courses/2?q=${encodeURIComponent(query)}&level=hard&topic=hard`,
    );
    assert.ok(html.includes('href="/courses/2/lessons/a029"'));
    assert.equal(entryCount(html), 1);
    assert.match(rendered(html), /<details[^>]*\sopen=""/);
    assert.ok(rendered(html).includes('href="/courses/2"'));
  }
  const none = await page("/courses/1?q=not-a-fixture");
  assert.equal(entryCount(none), 0);
  assert.ok(none.includes("沒有符合的題目"));
  const empty = await page("/courses/6");
  assert.ok(empty.includes("這門課還沒有題目"));
  assert.ok(!empty.includes('role="progressbar"'));
  assert.equal(
    entryCount(await page("/courses/1?topic=invalid&level=invalid")),
    7,
  );
  assert.equal(
    entryCount(await page("/courses/1?q=a029&q=a006&level=hard&level=easy")),
    1,
  );
  assert.equal(entryCount(await page("/courses/1?level=other")), 1);
});

test("programming tutorials never render for a recognition entry sharing a taught code", async () => {
  await prisma.problem.update({
    where: { id: 86 },
    data: { type: "RECOGNITION" },
  });
  try {
    assert.equal((await request("/courses/4/lessons/a086")).status, 404);
    assert.equal(
      (await request("/courses/4/lessons/a086", "admin")).status,
      404,
    );
  } finally {
    await prisma.problem.update({
      where: { id: 86 },
      data: { type: "PROGRAMMING" },
    });
  }
});

test("progress and member rankings use the whole course under filtering, not other users or duplicate ACs", async () => {
  const full = await page("/courses/1", "alice");
  const filtered = await page("/courses/1?q=a029", "alice");
  for (const html of [full, filtered]) {
    assert.ok(html.includes('aria-valuenow="14"'));
    assert.ok(html.includes("PRIVATE-MEMBER-FIXTURE"));
    assert.ok(!html.includes("SECRET-JOIN-FIXTURE"));
    assert.ok(!html.includes("HIDDEN-PROBLEM-FIXTURE"));
    const board = rendered(html).match(
      /<section aria-label="課程排行"[\s\S]*?<\/section>/,
    )?.[0];
    assert.ok(board);
    assert.match(board, /1<!-- --> \/ <!-- -->7/);
  }
  assert.equal(entryCount(filtered), 1);
  assert.ok(filtered.includes("全單元 1 / 7 題已完成"));
  const nonmember = await page("/courses/2", "alice");
  assert.ok(!nonmember.includes('aria-label="課程排行"'));
});

test("private course, hidden entries, join code and member data remain protected in HTML and RSC", async () => {
  for (const user of [undefined, "admin"]) {
    const response = await request("/courses/5", user);
    assert.equal(response.status, user ? 200 : 404);
    assert.equal(
      (await response.text()).includes("PRIVATE-COURSE-FIXTURE"),
      Boolean(user),
    );
  }
  const admin = await page("/courses/1", "admin");
  assert.equal(entryCount(admin), 8);
  assert.ok(admin.includes("SECRET-JOIN-FIXTURE"));
  assert.ok(admin.includes("HIDDEN-PROBLEM-FIXTURE"));
  for (const user of [undefined, "carol"])
    for (const rsc of [false, true]) {
      const response = await fetch(base + "/courses/1?q=a902", {
        headers: {
          ...(rsc ? { RSC: "1" } : {}),
          ...(user ? { Cookie: cookies[user] } : {}),
        },
        signal: AbortSignal.timeout(60000),
      });
      assert.equal(response.status, 200);
      const text = await response.text();
      for (const secret of [
        "SECRET-JOIN-FIXTURE",
        "PRIVATE-MEMBER-FIXTURE",
        "HIDDEN-PROBLEM-FIXTURE",
      ])
        assert.ok(!text.includes(secret), secret);
    }
  const outsider = await page("/courses/1", "admin");
  assert.ok(outsider.includes('aria-label="課程排行"'));
  assert.equal((await request("/courses/not-an-id")).status, 404);
});

test(
  "all 135 beginner routes render their own source example and complete reference, with saved navigation order",
  { timeout: 180000 },
  async () => {
    const { toiBeginnerLessons } =
      await import("../src/lib/toiBeginnerLessons.ts");
    const overview = await page("/courses/10");
    assert.equal(entryCount(overview), 135);
    const sequence = [...toiBeginnerProblemCatalog].reverse();
    const escape = (value) =>
      value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#x27;");
    for (const [index, problem] of sequence.entries()) {
      const code = problem.code;
      assert.ok(overview.includes(`href="/courses/10/lessons/${code}"`), code);
      const lesson = toiBeginnerLessons[code];
      assert.equal(lesson?.code, code);
      const html = rendered(await page(`/courses/10/lessons/${code}`));
      assert.ok(html.includes(escape(lesson.goal)), `${code}: wrong goal`);
      assert.ok(
        html.includes(escape(lesson.sampleInput)),
        `${code}: wrong source input`,
      );
      assert.ok(
        html.includes(escape(lesson.sampleOutput)),
        `${code}: wrong source output`,
      );
      assert.ok(
        html.includes(escape(lesson.cpp)),
        `${code}: wrong reference program`,
      );
      assert.ok(
        !html.includes("toi-read-calculate"),
        `${code}: generic topic fallback leaked`,
      );
      for (const neighbor of [sequence[index - 1], sequence[index + 1]])
        if (neighbor)
          assert.ok(
            html.includes(`href="/courses/10/lessons/${neighbor.code}"`),
            `${code}: saved navigation order changed`,
          );
    }
  },
);
