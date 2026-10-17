import { after, beforeEach, mock, test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import Database from "better-sqlite3";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client.ts";
import { problemListConditions } from "../src/lib/problemList.ts";

// Exercise actual migrations and route transactions against an isolated database.
const directory = await mkdtemp(join(process.env.TEST_TMPDIR ?? tmpdir(), "itouoj-problems-"));
const filename = join(directory, "test.db");
const sqlite = new Database(filename);
const migrations = new URL("../prisma/migrations/", import.meta.url);
for (const entry of (await readdir(migrations, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory()).sort((a, b) => a.name.localeCompare(b.name))) {
  sqlite.exec(await readFile(new URL(`${entry.name}/migration.sql`, migrations), "utf8"));
}
sqlite.close();
const db = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: `file:${filename}` }) });
after(async () => {
  await db.$disconnect();
  await rm(directory, { recursive: true, force: true });
});

let session;
mock.module(new URL("../src/lib/db.ts", import.meta.url).href, { exports: { prisma: db } });
mock.module(new URL("../src/lib/auth.ts", import.meta.url).href, { exports: { getSession: async () => session } });
const { PUT: bulkEdit } = await import("../src/app/api/admin/problems/bulk/route.ts");
const { POST: propose } = await import("../src/app/api/problems/proposals/route.ts");
const { PUT: editProposal, DELETE: withdrawProposal } = await import("../src/app/api/problems/proposals/[id]/route.ts");
const { POST: approve } = await import("../src/app/api/admin/problems/proposals/[id]/approve/route.ts");
const { POST: bulkReview } = await import("../src/app/api/admin/problems/proposals/bulk/route.ts");

const request = (body) => new Request("http://localhost/test", {
  method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
});
const params = (id) => ({ params: Promise.resolve({ id: String(id) }) });
const proposalBody = (tagIds = []) => ({
  title: "標籤申請", statement: "題敘", difficulty: "easy", timeLimitMs: 1000, memoryLimitMb: 256,
  tagIds, testCases: [{ input: "1 2", output: "3", isSample: true }],
});
const bulk = (action, extra = {}) => bulkEdit(request({ ids: [1, 2], type: "PROGRAMMING", action, ...extra }));
const links = () => db.problemTag.findMany({ orderBy: [{ problemId: "asc" }, { tagId: "asc" }] });

beforeEach(async () => {
  await db.problemProposal.deleteMany();
  await db.problem.deleteMany();
  await db.tag.deleteMany();
  await db.user.deleteMany();
  await db.user.createMany({ data: [
    { id: "admin", username: "admin", role: "ADMIN" },
    { id: "author", username: "author" },
  ] });
  await db.tag.createMany({ data: [{ id: 1, name: "數學" }, { id: 2, name: "字串" }, { id: 3, name: "排序" }] });
  await db.problem.createMany({ data: [
    { id: 1, title: "加法 A + B", statement: "", problemCode: "a001", order: 1 },
    { id: 2, title: "100%_完成", statement: "", problemCode: "a002", order: 2, isPublic: false },
    { id: 3, title: "加法識別", statement: "", type: "RECOGNITION", order: 1 },
  ] });
  await db.problemTag.createMany({ data: [{ problemId: 1, tagId: 1 }, { problemId: 2, tagId: 3 }] });
  session = { userId: "admin", role: "ADMIN" };
});

async function search(query, { isAdmin = false, tag } = {}) {
  const condition = problemListConditions({ query, isAdmin, tag });
  const rows = await db.$queryRaw`SELECT p.id FROM Problem p WHERE ${condition} ORDER BY p.problemCode`;
  const [count] = await db.$queryRaw`SELECT COUNT(*) AS total FROM Problem p WHERE ${condition}`;
  assert.equal(rows.length, Number(count.total));
  return rows.map((row) => row.id);
}

test("problem search matches partial codes and titles, trims input, and ignores ASCII case", async () => {
  assert.deepEqual(await search(" A001 "), [1]);
  assert.deepEqual(await search("001"), [1]);
  assert.deepEqual(await search("a + b"), [1]);
  assert.deepEqual(await search("加法"), [1]);
  assert.deepEqual(await search("不存在"), []);
});

test("search combines tags and visibility, excludes recognition, and treats SQL wildcards literally", async () => {
  assert.deepEqual(await search("a00"), [1]);
  assert.deepEqual(await search("a00", { isAdmin: true }), [1, 2]);
  assert.deepEqual(await search("a00", { isAdmin: true, tag: "排序" }), [2]);
  assert.deepEqual(await search("加法", { tag: "字串" }), []);
  assert.deepEqual(await search("%_", { isAdmin: true }), [2]);
  assert.deepEqual(await search("' OR 1=1 --", { isAdmin: true }), []);
});

test("adding tags preserves existing tags and is idempotent even with repeated input tags", async () => {
  assert.equal((await bulk("addTags", { tagIds: [1, 2, 2] })).status, 200);
  assert.equal((await bulk("addTags", { tagIds: [1, 2] })).status, 200);
  assert.deepEqual(await links(), [
    { problemId: 1, tagId: 1 }, { problemId: 1, tagId: 2 },
    { problemId: 2, tagId: 1 }, { problemId: 2, tagId: 2 }, { problemId: 2, tagId: 3 },
  ]);
});

test("removing and clearing tags only affect selected problems and tags", async () => {
  assert.equal((await bulk("removeTags", { ids: [1], tagIds: [1, 2] })).status, 200);
  assert.deepEqual(await links(), [{ problemId: 2, tagId: 3 }]);
  assert.equal((await bulk("clearTags", { ids: [1] })).status, 200);
  assert.deepEqual(await links(), [{ problemId: 2, tagId: 3 }]);
  assert.equal((await bulk("clearTags")).status, 200);
  assert.deepEqual(await links(), []);
});

test("bulk updates reject invalid tags and mixed problem types without partial writes", async () => {
  const original = await links();
  for (const payload of [
    { tagIds: [] }, { tagIds: [2, 999] }, { tagIds: [-1] },
    { tagIds: [2], ids: [1, 1] },
  ]) assert.equal((await bulk("addTags", payload)).status, 400);
  assert.equal((await bulk("addTags", { ids: [1, 3], tagIds: [2] })).status, 404);
  assert.equal((await bulk("clearTags", { ids: [1, 999] })).status, 404);
  assert.deepEqual(await links(), original);
});

test("bulk tags require admin privileges and support recognition problems", async () => {
  for (const user of [null, { userId: "author", role: "USER" }]) {
    session = user;
    assert.equal((await bulk("addTags", { tagIds: [2] })).status, 403);
  }
  session = { userId: "admin", role: "ADMIN" };
  assert.equal((await bulk("addTags", { ids: [3], type: "RECOGNITION", tagIds: [2] })).status, 200);
  assert.equal(await db.problemTag.count({ where: { problemId: 3, tagId: 2 } }), 1);
});

test("existing bulk visibility, difficulty, and author actions still work", async () => {
  for (const action of ["publish", "unpublish"]) {
    assert.equal((await bulk(action)).status, 200);
    assert.equal(await db.problem.count({ where: { id: { in: [1, 2] }, isPublic: action === "publish" } }), 2);
  }
  assert.equal((await bulk("setDifficulty", { difficulty: "hard" })).status, 200);
  assert.equal((await bulk("setAuthor", { authorUsername: "author" })).status, 200);
  assert.equal(await db.problem.count({ where: { difficulty: "hard", authorId: "author" } }), 2);
});

test("proposal tags survive editing and approval and become official problem tags", async () => {
  session = { userId: "author", role: "USER" };
  const response = await propose(request(proposalBody([1, 2, 2])));
  assert.equal(response.status, 200);
  const { id } = await response.json();
  assert.equal(await db.proposalTag.count({ where: { proposalId: id } }), 2);
  assert.equal((await editProposal(request(proposalBody([3])), params(id))).status, 200);
  assert.deepEqual(await db.proposalTag.findMany({ where: { proposalId: id } }), [{ proposalId: id, tagId: 3 }]);
  session = { userId: "admin", role: "ADMIN" };
  const approved = await approve(request({ isPublic: true }), params(id));
  assert.equal(approved.status, 200);
  const { problemId } = await approved.json();
  const problem = await db.problem.findUnique({ where: { id: problemId }, include: { tags: true, testCases: true } });
  assert.deepEqual(problem.tags.map((tag) => tag.tagId), [3]);
  assert.equal(problem.authorId, "author");
  assert.equal(problem.testCases[0].output, "3");
  assert.equal((await approve(request({}), params(id))).status, 409);
  session = { userId: "author", role: "USER" };
  assert.equal((await editProposal(request(proposalBody([])), params(id))).status, 400);
});

test("invalid proposal tags are rejected, authorship is enforced, and withdrawal cascades tags", async () => {
  session = { userId: "author", role: "USER" };
  assert.equal((await propose(request(proposalBody([999])))).status, 400);
  assert.equal(await db.problemProposal.count(), 0);
  const { id } = await (await propose(request(proposalBody([1])))).json();
  assert.equal((await editProposal(request(proposalBody([999])), params(id))).status, 400);
  assert.deepEqual(await db.proposalTag.findMany({ where: { proposalId: id } }), [{ proposalId: id, tagId: 1 }]);
  session = { userId: "admin", role: "ADMIN" };
  assert.equal((await editProposal(request(proposalBody([2])), params(id))).status, 403);
  session = { userId: "author", role: "USER" };
  assert.equal((await withdrawProposal(request({}), params(id))).status, 200);
  assert.equal(await db.proposalTag.count(), 0);
});

test("batch approval creates tagged problems atomically and respects visibility", async () => {
  const createPending = (title, tagId) => db.problemProposal.create({
    data: {
      title, statement: "題敘", authorId: "author", difficulty: "medium",
      testCases: { create: [{ input: "1", output: "1", isSample: true, order: 1 }] },
      tags: { create: [{ tagId }] },
    },
  });
  const first = await createPending("批次核准一", 1);
  const second = await createPending("批次核准二", 2);
  const result = await bulkReview(request({ ids: [first.id, second.id], action: "approve", isPublic: false }));
  assert.equal(result.status, 200);
  const reviewed = await db.problemProposal.findMany({
    where: { id: { in: [first.id, second.id] } },
    orderBy: { id: "asc" },
    select: { status: true, approvedProblemId: true },
  });
  assert.equal(reviewed.length, 2);
  assert.ok(reviewed.every((proposal) => proposal.status === "APPROVED" && proposal.approvedProblemId != null));
  const created = await db.problem.findMany({ where: { title: { startsWith: "批次核准" } } });
  assert.equal(created.length, 2);
  assert.ok(created.every((problem) => !problem.isPublic));
  assert.equal(await db.problemTag.count({ where: { problem: { title: { startsWith: "批次核准" } } } }), 2);
  assert.equal(await db.testCase.count({ where: { problem: { title: { startsWith: "批次核准" } } } }), 2);
});

test("batch rejection applies one note and mixed or already-reviewed selections do not partially change", async () => {
  const createPending = (title) => db.problemProposal.create({
    data: { title, statement: "題敘", authorId: "author", testCases: { create: [{ input: "", output: "", order: 1 }] } },
  });
  const first = await createPending("批次退回一");
  const second = await createPending("批次退回二");
  const rejected = await bulkReview(request({ ids: [first.id, second.id], action: "reject", reviewNote: "請補充說明" }));
  assert.equal(rejected.status, 200);
  assert.equal(await db.problemProposal.count({ where: { id: { in: [first.id, second.id] }, status: "REJECTED", reviewNote: "請補充說明" } }), 2);

  const third = await createPending("不應部分退回");
  const mixed = await bulkReview(request({ ids: [third.id, first.id], action: "reject", reviewNote: "再次退回" }));
  assert.equal(mixed.status, 409);
  assert.equal(await db.problemProposal.count({ where: { id: third.id, status: "PENDING" } }), 1);
  assert.equal(await db.problemProposal.count({ where: { id: first.id, reviewNote: "請補充說明" } }), 1);
});
