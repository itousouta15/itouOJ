import { after, beforeEach, mock, test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import Database from "better-sqlite3";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client.ts";

const directory = await mkdtemp(
  join(process.env.TEST_TMPDIR ?? tmpdir(), "itouoj-course-order-"),
);
const filename = join(directory, "test.db");
const sqlite = new Database(filename);
const migrations = new URL("../prisma/migrations/", import.meta.url);
let migratedIds;
for (const entry of (await readdir(migrations, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .sort((a, b) => a.name.localeCompare(b.name))) {
  if (entry.name === "20261020010000_course_sort_order") {
    sqlite.exec(`INSERT INTO Course (id, title) VALUES
      (1, '基礎課'), (5, 'APCS 實作題：由簡到難'), (9, '進階課')`);
  }
  sqlite.exec(
    await readFile(new URL(`${entry.name}/migration.sql`, migrations), "utf8"),
  );
  if (entry.name === "20261020010000_course_sort_order") {
    migratedIds = sqlite
      .prepare("SELECT id FROM Course ORDER BY sortOrder, id")
      .all()
      .map((row) => row.id);
  }
}
sqlite.close();
const db = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: `file:${filename}` }),
});
after(async () => {
  await db.$disconnect();
  await rm(directory, { recursive: true, force: true });
});

let session;
mock.module(new URL("../src/lib/db.ts", import.meta.url).href, {
  namedExports: { prisma: db },
});
mock.module(new URL("../src/lib/auth.ts", import.meta.url).href, {
  namedExports: { getSession: async () => session },
});
const { PUT: reorder } =
  await import("../src/app/api/admin/courses/reorder/route.ts");
const { POST: createCourse } =
  await import("../src/app/api/admin/courses/route.ts");
const { PUT: editCourse } =
  await import("../src/app/api/admin/courses/[id]/route.ts");
const request = (body) =>
  new Request("http://localhost/test", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
const courseBody = (problemIds = [30, 10, 20]) => ({
  title: "自訂課程",
  description: "說明",
  isPublic: true,
  joinCode: "",
  problemIds,
});
const orderedIds = async (where = {}) =>
  (
    await db.course.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
      select: { id: true },
    })
  ).map((row) => row.id);
const problemOrder = async (courseId) =>
  (
    await db.courseProblem.findMany({
      where: { courseId },
      orderBy: [{ order: "asc" }, { id: "asc" }],
      select: { problemId: true },
    })
  ).map((row) => row.problemId);

beforeEach(async () => {
  await db.course.deleteMany();
  await db.problem.deleteMany();
  await db.user.deleteMany();
  await db.user.createMany({
    data: [
      { id: "admin", username: "admin", role: "ADMIN" },
      { id: "learner", username: "learner" },
    ],
  });
  await db.problem.createMany({
    data: [10, 20, 30].map((id) => ({
      id,
      title: `題目 ${id}`,
      statement: "",
      problemCode: `a0${id}`,
      order: id,
    })),
  });
  await db.course.createMany({
    data: [1, 2, 3].map((id) => ({
      id,
      title: `課程 ${id}`,
      sortOrder: id,
      isPublic: id !== 2,
    })),
  });
  await db.courseProblem.createMany({
    data: [10, 20, 30].map((problemId, index) => ({
      courseId: 1,
      problemId,
      order: index + 1,
    })),
  });
  await db.courseMember.create({ data: { courseId: 1, userId: "learner" } });
  session = { userId: "admin", role: "ADMIN" };
});

test("migration preserves the previous APCS-first listing", () => {
  assert.deepEqual(migratedIds, [5, 1, 9]);
});

test("course ordering is admin-only", async () => {
  for (const role of [null, { userId: "learner", role: "USER" }]) {
    session = role;
    assert.equal(
      (await reorder(request({ ids: [3, 1, 2], expectedIds: [1, 2, 3] })))
        .status,
      403,
    );
  }
  assert.deepEqual(await orderedIds(), [1, 2, 3]);
});

test("course order persists and public filtering respects that order", async () => {
  assert.equal(
    (await reorder(request({ ids: [3, 2, 1], expectedIds: [1, 2, 3] }))).status,
    200,
  );
  assert.deepEqual(await orderedIds(), [3, 2, 1]);
  assert.deepEqual(await orderedIds({ isPublic: true }), [3, 1]);
  assert.deepEqual(await problemOrder(1), [10, 20, 30]);
  assert.equal(await db.courseMember.count(), 1);
});

test("malformed orders do not write partial changes", async () => {
  for (const body of [
    null,
    { ids: [1, 1, 3], expectedIds: [1, 2, 3] },
    { ids: [3, 1], expectedIds: [1, 2, 3] },
    { ids: [1, 2, 3.5], expectedIds: [1, 2, 3.5] },
    { ids: [0, 1, 2], expectedIds: [0, 1, 2] },
  ]) {
    assert.equal((await reorder(request(body))).status, 400);
  }
  assert.equal(
    (
      await reorder(
        new Request("http://localhost/test", { method: "PUT", body: "{" }),
      )
    ).status,
    400,
  );
  assert.deepEqual(await orderedIds(), [1, 2, 3]);
});

test("stale or unknown course lists are rejected without overwriting a newer order", async () => {
  assert.equal(
    (await reorder(request({ ids: [3, 1, 2], expectedIds: [1, 2, 3] }))).status,
    200,
  );
  assert.equal(
    (await reorder(request({ ids: [2, 3, 1], expectedIds: [1, 2, 3] }))).status,
    409,
  );
  assert.equal(
    (await reorder(request({ ids: [1, 2, 999], expectedIds: [1, 2, 999] })))
      .status,
    409,
  );
  assert.deepEqual(await orderedIds(), [3, 1, 2]);
  await db.course.create({ data: { title: "新課程", sortOrder: 4 } });
  assert.equal(
    (await reorder(request({ ids: [2, 1, 3], expectedIds: [3, 1, 2] }))).status,
    409,
  );
});

test("new courses append and preserve the supplied problem sequence", async () => {
  await reorder(request({ ids: [3, 1, 2], expectedIds: [1, 2, 3] }));
  const response = await createCourse(request(courseBody()));
  assert.equal(response.status, 200);
  const { id } = await response.json();
  assert.deepEqual(await orderedIds(), [3, 1, 2, id]);
  assert.deepEqual(await problemOrder(id), [30, 10, 20]);
});

test("editing problem order keeps course position and memberships", async () => {
  const response = await editCourse(request(courseBody([20, 30, 10])), {
    params: Promise.resolve({ id: "1" }),
  });
  assert.equal(response.status, 200);
  assert.deepEqual(await problemOrder(1), [20, 30, 10]);
  assert.deepEqual(await orderedIds(), [1, 2, 3]);
  assert.equal(await db.courseMember.count(), 1);
});

test("duplicate or invalid selected problems cannot replace the existing sequence", async () => {
  for (const problemIds of [[10, 10], [0], [-1], [2.5]]) {
    assert.equal(
      (
        await editCourse(request(courseBody(problemIds)), {
          params: Promise.resolve({ id: "1" }),
        })
      ).status,
      400,
    );
  }
  await assert.rejects(
    editCourse(request(courseBody([999])), {
      params: Promise.resolve({ id: "1" }),
    }),
  );
  assert.deepEqual(await problemOrder(1), [10, 20, 30]);
});
