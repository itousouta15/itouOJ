import { after, beforeEach, mock, test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import Database from "better-sqlite3";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client.ts";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

const directory = await mkdtemp(
  join(process.env.TEST_TMPDIR ?? tmpdir(), "itouoj-reports-"),
);
const filename = join(directory, "test.db");
const sqlite = new Database(filename);
const migrations = new URL("../prisma/migrations/", import.meta.url);
for (const entry of (await readdir(migrations, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .sort((a, b) => a.name.localeCompare(b.name))) {
  sqlite.exec(
    await readFile(new URL(`${entry.name}/migration.sql`, migrations), "utf8"),
  );
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
const alice = { userId: "alice", username: "alice", role: "USER" };
const bob = { userId: "bob", username: "bob", role: "USER" };
const admin = { userId: "admin", username: "admin", role: "ADMIN" };
mock.module(new URL("../src/lib/db.ts", import.meta.url).href, {
  namedExports: { prisma: db },
});
mock.module(new URL("../src/lib/auth.ts", import.meta.url).href, {
  namedExports: { getSession: async () => session },
});
const { POST: create, GET: list } =
  await import("../src/app/api/reports/route.ts");
const { GET: detail } = await import("../src/app/api/reports/[id]/route.ts");
const { PATCH: update } =
  await import("../src/app/api/admin/reports/[id]/route.ts");
const { listReports, findReport } = await import("../src/lib/reportData.ts");
const { reportSourcePath, reportFilters } =
  await import("../src/lib/reportSchema.ts");
let pathname = "/courses/901/lessons/a029";
mock.module("next/navigation", {
  namedExports: {
    usePathname: () => pathname,
    useRouter: () => ({ push() {}, refresh() {} }),
    redirect: (location) => {
      throw Object.assign(new Error("REDIRECT"), { location });
    },
    notFound: () => {
      throw new Error("NOT_FOUND");
    },
  },
});
mock.module("next/link", {
  defaultExport: (props) =>
    React.createElement(
      "a",
      {
        href: props.href,
        target: props.target,
        rel: props.rel,
        className: props.className,
      },
      props.children,
    ),
});
const { default: ReportLink } =
  await import("../src/components/ReportLink.tsx");
const { default: LessonLab } =
  await import("../src/components/ApcsLessonLab.tsx");
const { apcsCourseLessons } = await import("../src/lib/apcsCourseLessons.ts");
const { default: NewReportPage } =
  await import("../src/app/reports/new/page.tsx");
const { default: ReportPage } =
  await import("../src/app/reports/[id]/page.tsx");
const { default: AdminReportsPage } =
  await import("../src/app/admin/reports/page.tsx");
const body = (overrides = {}) => ({
  category: "LESSON",
  section: "PYTHON",
  title: "a029 Python 教學問題",
  description: "在背包教學選擇 Python 後，範例輸出的結果不一致。",
  expected: "應與題目範例相同",
  sourcePath: "/courses/11/lessons/a029?token=private#code",
  context: "a029 · Python",
  ...overrides,
});
const request = (payload, method = "POST") =>
  new Request("http://localhost/api/reports", {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
const context = (id) => ({ params: Promise.resolve({ id: String(id) }) });
const getRequest = () => new Request("http://localhost/api/reports");
async function insert(userId = "alice", data = {}) {
  return db.bugReport.create({
    data: {
      ...body(),
      sourcePath: "/courses/11/lessons/a029",
      userId,
      ...data,
    },
  });
}
const patch = (report, overrides = {}) =>
  request(
    {
      status: "IN_PROGRESS",
      adminReply: "正在確認範例。",
      expectedUpdatedAt: report.updatedAt.toISOString(),
      ...overrides,
    },
    "PATCH",
  );

beforeEach(async () => {
  await db.bugReport.deleteMany();
  await db.user.deleteMany();
  await db.user.createMany({
    data: [alice, bob, admin].map((user) => ({
      id: user.userId,
      username: user.username,
      role: user.role,
    })),
  });
  globalThis.__ojRateLimit?.clear();
  session = alice;
});

test("report migration applies to a clean database and creates expected indexes", async () => {
  const indexes = await db.$queryRawUnsafe("PRAGMA index_list('BugReport')");
  assert.ok(
    indexes.some((row) => row.name === "BugReport_userId_createdAt_idx"),
  );
  assert.ok(
    indexes.some(
      (row) => row.name === "BugReport_status_category_createdAt_idx",
    ),
  );
});

test("anonymous users cannot submit or read reports", async () => {
  const report = await insert();
  session = null;
  assert.equal((await create(request(body()))).status, 401);
  assert.equal((await list(getRequest())).status, 401);
  assert.equal((await detail(getRequest(), context(report.id))).status, 401);
  assert.equal(await db.bugReport.count(), 1);
});

test("a lesson report saves contextual fields under the signed-in user, without query secrets", async () => {
  const response = await create(request(body()));
  assert.equal(response.status, 201);
  const report = await db.bugReport.findUniqueOrThrow({
    where: { id: (await response.json()).id },
  });
  assert.equal(report.userId, "alice");
  assert.equal(report.status, "OPEN");
  assert.equal(report.adminReply, "");
  assert.equal(report.category, "LESSON");
  assert.equal(report.section, "PYTHON");
  assert.equal(report.context, "a029 · Python");
  assert.equal(report.sourcePath, "/courses/11/lessons/a029");
});

test("all report categories and teaching sections can be submitted", async () => {
  for (const category of ["LESSON", "PROBLEM", "JUDGE", "WEBSITE", "OTHER"]) {
    assert.equal((await create(request(body({ category })))).status, 201);
  }
  globalThis.__ojRateLimit.clear();
  for (const section of [
    "GENERAL",
    "EXPLANATION",
    "ANIMATION",
    "CPP",
    "SAMPLE",
  ]) {
    assert.equal((await create(request(body({ section })))).status, 201);
  }
});

test("invalid fields, privilege injection and unsafe source paths cannot create reports", async () => {
  const invalid = [
    { category: "INVALID" },
    { section: "INVALID" },
    { title: "  " },
    { title: "x".repeat(121) },
    { description: "short" },
    { description: "x".repeat(5001) },
    { expected: "x".repeat(2001) },
    { context: "x".repeat(301) },
    { sourcePath: "https://evil.test/" },
    { sourcePath: "//evil.test/" },
    { sourcePath: "/\\evil.test" },
    { sourcePath: "/%2Fexample.test" },
    { sourcePath: "/%0aevil" },
    { userId: "admin" },
    { status: "RESOLVED" },
    { adminReply: "forged" },
  ];
  for (const data of invalid) {
    globalThis.__ojRateLimit.clear();
    assert.equal(
      (await create(request(body(data)))).status,
      400,
      JSON.stringify(data).slice(0, 100),
    );
  }
  assert.equal(await db.bugReport.count(), 0);
});

test("malformed and oversized bodies are rejected, including streamed bodies without declared size", async () => {
  assert.equal(
    (
      await create(
        new Request("http://localhost", { method: "POST", body: "{" }),
      )
    ).status,
    400,
  );
  assert.equal(
    (
      await create(
        new Request("http://localhost", {
          method: "POST",
          headers: { "Content-Length": "100000" },
          body: "{}",
        }),
      )
    ).status,
    413,
  );
  assert.equal(
    (await create(request(body({ description: "中".repeat(20000) })))).status,
    413,
  );
  assert.equal(await db.bugReport.count(), 0);
});

test("report submission is rate-limited with a retry hint", async () => {
  for (let i = 0; i < 5; ++i)
    assert.equal((await create(request(body()))).status, 201);
  const response = await create(request(body()));
  assert.equal(response.status, 429);
  assert.ok(Number(response.headers.get("Retry-After")) > 0);
  session = bob;
  assert.equal((await create(request(body()))).status, 201);
});

test("users cannot read another user's report, even with crafted list filters", async () => {
  const mine = await insert();
  const other = await insert("bob", { title: "Private report for Bob" });
  const response = await list(
    new Request("http://localhost/api/reports?userId=bob&admin=1"),
  );
  assert.match(response.headers.get("Cache-Control"), /no-store/);
  const result = await response.json();
  assert.equal(result.total, 1);
  assert.equal(result.reports[0].id, mine.id);
  assert.equal((await detail(getRequest(), context(other.id))).status, 404);
  assert.equal(await findReport(alice, other.id), null);
  assert.equal((await listReports(alice, {}, true)).total, 1);
  for (const id of ["abc", 0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1])
    assert.equal((await detail(getRequest(), context(id))).status, 404);
  session = admin;
  assert.equal((await detail(getRequest(), context(other.id))).status, 200);
  assert.equal((await listReports(admin, {}, true)).total, 2);
});

test("lists are paginated, filtered and scoped without leaking report descriptions", async () => {
  await db.bugReport.createMany({
    data: Array.from({ length: 23 }, (_, index) => ({
      ...body(),
      userId: "alice",
      title: `report-${index}`,
      category: index < 2 ? "WEBSITE" : "LESSON",
      status: index === 0 ? "RESOLVED" : "OPEN",
    })),
  });
  await insert("bob");
  const first = await listReports(alice);
  const second = await listReports(alice, { page: "2" });
  assert.equal(first.total, 23);
  assert.equal(first.reports.length, 20);
  assert.equal(second.reports.length, 3);
  assert.equal(
    new Set([...first.reports, ...second.reports].map((row) => row.id)).size,
    23,
  );
  assert.equal("description" in first.reports[0], false);
  assert.equal(
    (await listReports(alice, { status: "RESOLVED", category: "WEBSITE" }))
      .total,
    1,
  );
  assert.equal((await listReports(admin, { q: "report-22" }, true)).total, 1);
  assert.equal(
    reportFilters({ page: "Infinity", category: ["LESSON"], status: "bad" })
      .page,
    1,
  );
  assert.equal(reportFilters({ page: "2.5" }).page, 1);
});

test("only administrators may change status or reply", async () => {
  const report = await insert();
  for (const user of [null, alice, bob]) {
    session = user;
    assert.equal((await update(patch(report), context(report.id))).status, 403);
  }
  assert.equal(
    (await db.bugReport.findUnique({ where: { id: report.id } })).status,
    "OPEN",
  );
});

test("admin replies and status changes persist and are visible to the reporter", async () => {
  const report = await insert();
  session = admin;
  assert.equal(
    (
      await update(
        patch(report, {
          status: "RESOLVED",
          adminReply: "已修正 Python 範例。",
        }),
        context(report.id),
      )
    ).status,
    200,
  );
  session = alice;
  const response = await detail(getRequest(), context(report.id));
  assert.equal(response.status, 200);
  assert.match(response.headers.get("Cache-Control"), /no-store/);
  const updated = await response.json();
  assert.equal(updated.status, "RESOLVED");
  assert.equal(updated.adminReply, "已修正 Python 範例。");
  session = admin;
  assert.equal(
    (
      await update(
        patch(
          { ...updated, updatedAt: new Date(updated.updatedAt) },
          { status: "OPEN", adminReply: "重新確認邊界條件" },
        ),
        context(report.id),
      )
    ).status,
    200,
  );
});

test("stale updates cannot overwrite another administrator's response", async () => {
  const report = await insert();
  session = admin;
  assert.equal((await update(patch(report), context(report.id))).status, 200);
  assert.equal(
    (
      await update(
        patch(report, { status: "CLOSED", adminReply: "stale" }),
        context(report.id),
      )
    ).status,
    409,
  );
  const saved = await db.bugReport.findUniqueOrThrow({
    where: { id: report.id },
  });
  assert.equal(saved.status, "IN_PROGRESS");
  assert.notEqual(saved.adminReply, "stale");
});

test("invalid admin updates and missing reports leave the original untouched", async () => {
  const report = await insert();
  session = admin;
  for (const invalid of [
    { status: "invalid" },
    { adminReply: "x".repeat(3001) },
    { expectedUpdatedAt: "bad" },
    { userId: "bob" },
  ]) {
    assert.equal(
      (await update(patch(report, invalid), context(report.id))).status,
      400,
    );
  }
  assert.equal((await update(patch(report), context(999999))).status, 404);
  assert.equal((await update(patch(report), context("invalid"))).status, 404);
  assert.equal(
    (await db.bugReport.findUnique({ where: { id: report.id } })).status,
    "OPEN",
  );
});

test("deleting an account removes its private reports without affecting others", async () => {
  await insert();
  await insert("bob");
  await db.user.delete({ where: { id: "alice" } });
  assert.equal(await db.bugReport.count(), 1);
  assert.equal((await db.bugReport.findFirst()).userId, "bob");
});

test("source path normalization strips secrets and rejects malformed paths", () => {
  assert.equal(
    reportSourcePath("/courses/cpe/lessons/a460?token=private#step"),
    "/courses/cpe/lessons/a460",
  );
  assert.equal(reportSourcePath(""), "");
  for (const value of [
    "javascript:alert(1)",
    "//evil.test",
    "/%5cevil",
    "/%",
    "/%2f%2fevil",
    "/a/..//evil",
    "/%00",
    "/x\ny",
  ])
    assert.equal(reportSourcePath(value), null, value);
});

test("contextual report links cover lessons, problem pages and website pages", () => {
  for (const [path, category] of [
    ["/courses/cpe/lessons/a460", "LESSON"],
    ["/problems/a029", "PROBLEM"],
    ["/recognition/q/1", "PROBLEM"],
    ["/submissions/1", "JUDGE"],
    ["/ranking", "WEBSITE"],
  ]) {
    pathname = path;
    const html = renderToStaticMarkup(React.createElement(ReportLink));
    assert.ok(html.includes(`category=${category}`));
    assert.ok(html.includes(`source=${encodeURIComponent(path)}`));
    assert.ok(html.includes("回報錯誤"));
  }
});

test("lesson lab exposes animation-step and language-specific report links", () => {
  pathname = "/courses/901/lessons/a029";
  const html = renderToStaticMarkup(
    React.createElement(LessonLab, { lesson: apcsCourseLessons.a029 }),
  );
  assert.ok(html.includes("回報動畫錯誤"));
  assert.ok(html.includes("section=ANIMATION"));
  const links = [...html.matchAll(/href="([^"]+)"/g)].map(
    (match) => new URL(match[1].replaceAll("&amp;", "&"), "http://localhost"),
  );
  assert.ok(
    links.some((link) =>
      link.searchParams.get("context")?.includes("動畫第 1 步"),
    ),
  );
  assert.ok(html.includes("回報程式錯誤"));
  assert.ok(html.includes("section=CPP"));
  assert.ok(html.includes(encodeURIComponent(pathname)));
});

test("new report page preserves safe context through login and pre-fills the form", async () => {
  const params = {
    source: "/courses/901/lessons/a029?token=private#code",
    category: "LESSON",
    section: "PYTHON",
    context: "a029 · Python",
    title: "a029 教學錯誤",
  };
  session = null;
  await assert.rejects(
    NewReportPage({ searchParams: Promise.resolve(params) }),
    (error) => {
      assert.equal(error.message, "REDIRECT");
      const next = new URL(error.location, "http://localhost").searchParams.get(
        "next",
      );
      assert.equal(
        new URL(next, "http://localhost").searchParams.get("source"),
        "/courses/901/lessons/a029",
      );
      assert.ok(!next.includes("token"));
      return true;
    },
  );
  session = alice;
  const html = renderToStaticMarkup(
    await NewReportPage({ searchParams: Promise.resolve(params) }),
  );
  assert.ok(html.includes('value="a029 教學錯誤"'));
  assert.ok(html.includes('value="/courses/901/lessons/a029"'));
  assert.ok(html.includes('<option value="PYTHON" selected=""'));
  assert.ok(html.includes("送出回報"));
  assert.ok(!html.includes("token=private"));
});

test("report pages enforce ownership and render report text safely", async () => {
  const report = await insert("alice", {
    description: '<img src=x onerror="alert(1)">報告文字',
    adminReply: "已確認問題",
  });
  session = bob;
  await assert.rejects(
    ReportPage({
      params: Promise.resolve({ id: String(report.id) }),
      searchParams: Promise.resolve({}),
    }),
    /NOT_FOUND/,
  );
  await assert.rejects(
    AdminReportsPage({ searchParams: Promise.resolve({}) }),
    /REDIRECT/,
  );
  session = alice;
  const props = {
    params: Promise.resolve({ id: String(report.id) }),
    searchParams: Promise.resolve({}),
  };
  const ownerHtml = renderToStaticMarkup(await ReportPage(props));
  assert.ok(ownerHtml.includes("&lt;img"));
  assert.ok(!ownerHtml.includes("<img src=x"));
  assert.ok(ownerHtml.includes("已確認問題"));
  assert.ok(!ownerHtml.includes("更新回報"));
  session = admin;
  const adminHtml = renderToStaticMarkup(await ReportPage(props));
  assert.ok(adminHtml.includes("更新回報"));
  const listHtml = renderToStaticMarkup(
    await AdminReportsPage({
      searchParams: Promise.resolve({ category: "LESSON" }),
    }),
  );
  assert.ok(listHtml.includes("錯誤回報管理"));
  assert.ok(listHtml.includes(report.title));
});
