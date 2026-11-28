// Build both apps before running this smoke test. It uses a fresh SQLite DB.
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { createServer, request } from "node:http";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { once } from "node:events";
import { setTimeout as delay } from "node:timers/promises";
import bcrypt from "bcryptjs";
import Database from "better-sqlite3";

const adminDir = resolve(process.argv[2] ?? "../itouOJ-admin");
const dir = await mkdtemp(join(tmpdir(), "oj-admin-smoke-"));
const dbPath = join(dir, "smoke.db");
const env = { ...process.env, DATABASE_URL: `file:${dbPath}`, AUTH_SECRET: "local-admin-smoke-test", OFFLINE_MODE: "1" };
const player = "http://127.0.0.1:13200";
const admin = "http://127.0.0.1:13201";
const children = [];

const proxy = createServer((req, res) => {
  const path = new URL(req.url, player).pathname;
  const goesToAdmin = /^\/admin(?:\/?$|\/(?:services|hosts|judge|deployment|tags)\/?$|\/problems(?:\/new|\/\d+\/edit)?\/?$|\/(?:announcements|_next)(?:\/|$))/.test(path);
  const forwarded = request(new URL(req.url, goesToAdmin ? admin : player), {
    method: req.method, headers: req.headers,
  }, (upstream) => {
    res.writeHead(upstream.statusCode, upstream.headers);
    upstream.pipe(res);
  });
  forwarded.on("error", () => res.writeHead(502).end());
  req.pipe(forwarded);
});

function start(cwd, port, vars) {
  children.push(spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-H", "127.0.0.1", "-p", port], {
    cwd, env: vars, stdio: "inherit",
  }));
}

async function waitFor(url) {
  for (let retry = 0; retry < 60; retry++) {
    const response = await fetch(url).catch(() => null);
    if (response && response.status < 500) { await response.body?.cancel(); return; }
    await delay(250);
  }
  throw new Error(`Service did not start: ${url}`);
}

try {
  const schema = spawnSync(process.execPath, ["node_modules/prisma/build/index.js", "db", "push"], { env, stdio: "inherit" });
  assert.equal(schema.status, 0);
  const database = new Database(dbPath);
  try {
    const insert = database.prepare('INSERT INTO "User" (id, username, passwordHash, role) VALUES (?, ?, ?, ?)');
    const hash = bcrypt.hashSync("smoke-password", 4);
    insert.run("admin", "smoke-admin", hash, "ADMIN");
    insert.run("owner", "smoke-owner", hash, "USER");
    insert.run("other", "smoke-other", hash, "USER");
  } finally {
    database.close();
  }

  await once(proxy.listen(0, "127.0.0.1"), "listening");
  const origin = `http://127.0.0.1:${proxy.address().port}`;
  start(process.cwd(), "13200", env);
  start(adminDir, "13201", { ...process.env, OJ_API_ORIGIN: player });
  await Promise.all([waitFor(`${player}/api/me`), waitFor(`${admin}/admin/announcements`)]);

  async function call(path, status, { cookie, method = "GET", data } = {}) {
    const response = await fetch(`${origin}${path}`, {
      method, redirect: "manual",
      headers: {
        ...(cookie && { Cookie: cookie }),
        ...(data && { "Content-Type": "application/json" }),
      },
      body: data && JSON.stringify(data),
    });
    assert.equal(response.status, status, `${method} ${path}`);
    return response;
  }
  async function login(username) {
    const response = await call("/api/auth/login", 200, { method: "POST", data: { username, password: "smoke-password" } });
    return response.headers.get("set-cookie").split(";", 1)[0];
  }

  const list = "/admin/announcements";
  const api = "/api/admin/announcements";
  const anonymousHtml = await (await call(list, 200)).text();
  assert.match(anonymousHtml, /請先登入/);
  assert.match(anonymousHtml, /\/login\?next=%2Fadmin%2Fannouncements/);
  const asset = anonymousHtml.match(/(?:href|src)="(\/admin\/_next\/static\/[^"?]+\.css)"/)?.[1];
  assert.ok(asset, "admin CSS must live under the admin asset prefix");
  await call(asset, 200);
  const logo = anonymousHtml.match(/<img[^>]+src="(\/admin\/_next\/static\/[^"?]+\.png)"/)?.[1];
  assert.ok(logo, "brand logo must live under the admin asset prefix");
  assert.equal((await call(logo, 200)).headers.get("content-type"), "image/png");
  assert.match(anonymousHtml, /返回主站/);
  assert.match(anonymousHtml, /aria-current="page" href="\/admin\/announcements"/);
  await call(api, 403);

  const adminCookie = await login("smoke-admin");
  const ownerCookie = await login("smoke-owner");
  const otherCookie = await login("smoke-other");
  const adminHome = await call("/admin", 307);
  assert.equal(new URL(adminHome.headers.get("location"), origin).pathname, "/admin/services");
  for (const [path, title] of Object.entries({ services: "伺服器服務", hosts: "Server 管理", judge: "評測監控", deployment: "GitHub 一鍵部署" })) {
    assert.match(await (await call(`/admin/${path}`, 200, { cookie: ownerCookie })).text(), /需要管理員權限/);
    assert.ok((await (await call(`/admin/${path}`, 200, { cookie: adminCookie })).text()).includes(`<h1 class="page-title mb-4">${title}</h1>`));
    await call(`/api/admin/${path}`, 403, { cookie: ownerCookie });
    if (path !== "judge") await call(`/api/admin/${path}`, 403, { cookie: ownerCookie, method: "POST" });
  }
  const queue = await (await call("/api/admin/judge", 200, { cookie: adminCookie })).json();
  assert.equal(queue.pending, 0);
  assert.match(await (await call(`${list}/new`, 200, { cookie: ownerCookie })).text(), /需要管理員權限/);
  await call(api, 403, { cookie: ownerCookie });
  await call(api, 403, { cookie: ownerCookie, method: "POST", data: {} });
  const announcement = { title: "Admin smoke announcement", content: "Admin smoke content", isPinned: true };
  const { id } = await (await call(api, 200, { cookie: adminCookie, method: "POST", data: announcement })).json();
  await call(`${api}/${id}`, 403, { cookie: ownerCookie });
  assert.match(await (await call(list, 200, { cookie: adminCookie })).text(), /Admin smoke announcement/);
  assert.match(await (await call(`${list}/${id}/edit`, 200, { cookie: adminCookie })).text(), /Admin smoke content/);
  await call(`${api}/${id}`, 200, { cookie: adminCookie, method: "PUT", data: { ...announcement, title: "Updated announcement" } });
  assert.match(await (await call(list, 200, { cookie: adminCookie })).text(), /Updated announcement/);
  await call(`${api}/${id}`, 200, { cookie: adminCookie, method: "DELETE" });
  await call(`${api}/${id}`, 404, { cookie: adminCookie });

  const problems = "/api/admin/problems";
  await call(problems, 403, { cookie: ownerCookie });
  await call(`${problems}/form-options`, 403, { cookie: ownerCookie });
  await call("/api/admin/tags", 403, { cookie: ownerCookie });
  const tag = await (await call("/api/admin/tags", 200, { cookie: adminCookie, method: "POST", data: { name: "Smoke tag" } })).json();
  assert.match(await (await call("/admin/tags", 200, { cookie: adminCookie })).text(), /Smoke tag/);
  assert.match(await (await call("/admin/problems/new?type=RECOGNITION", 200, { cookie: adminCookie })).text(), /新增識別題/);
  const problem = {
    title: "Smoke problem", statement: "Smoke statement", type: "PROGRAMMING", isPublic: false,
    difficulty: "easy", timeLimitMs: 1000, memoryLimitMb: 256, authorUsername: "smoke-owner", tagIds: [tag.id],
    subtasks: [{ points: 100, checkMode: "float" }],
    testCases: [{ input: "Private smoke input", output: "Private smoke output", isSample: false, subtaskIndex: 0 }],
  };
  const { id: problemId } = await (await call(problems, 200, { cookie: adminCookie, method: "POST", data: problem })).json();
  await call(`${problems}/${problemId}`, 403, { cookie: ownerCookie });
  const summary = await (await call(`${problems}?q=Smoke`, 200, { cookie: adminCookie })).json();
  assert.equal(summary.rows.length, 1);
  assert.equal(summary.rows[0].testCaseCount, 1);
  assert.doesNotMatch(JSON.stringify(summary), /Private smoke input/);
  assert.match(await (await call("/admin/problems?q=Smoke", 200, { cookie: adminCookie })).text(), /Smoke problem/);
  const detail = await (await call(`${problems}/${problemId}`, 200, { cookie: adminCookie })).json();
  assert.deepEqual(detail.initial.testCases, problem.testCases);
  assert.deepEqual(detail.initial.subtasks, problem.subtasks);
  assert.equal(detail.initial.pdfHasPassword, false);
  assert.equal(Object.hasOwn(detail.initial, "pdfPassword"), false);
  assert.match(await (await call(`/admin/problems/${problemId}/edit`, 200, { cookie: adminCookie })).text(), /Smoke statement/);
  await call(`${problems}/${problemId}`, 200, { cookie: adminCookie, method: "PUT", data: { ...problem, title: "Updated problem" } });
  assert.match(await (await call("/admin/problems?q=Updated", 200, { cookie: adminCookie })).text(), /Updated problem/);
  await call(`${problems}/${problemId}`, 200, { cookie: adminCookie, method: "DELETE" });
  await call(`${problems}/${problemId}`, 404, { cookie: adminCookie });

  const contest = { title: "Smoke contest", description: "", startTime: "2022-01-01", endTime: "2022-01-02", freezeMinutes: 0, isPublic: true, problems: [] };
  const { id: contestId } = await (await call("/api/contests", 200, { method: "POST", cookie: ownerCookie, data: contest })).json();
  const manage = `/contests/${contestId}/manage`;
  const location = (await call(`/admin/contests/${contestId}/edit`, 307)).headers.get("location");
  assert.equal(location, `${manage}/edit`);
  assert.match(await (await call(`${manage}/edit`, 200, { cookie: ownerCookie })).text(), /編輯比賽/);
  assert.match(await (await call(`${manage}/status`, 200, { cookie: ownerCookie })).text(), /參賽者狀態/);
  await call(`/api${manage}`, 403, { method: "PUT", cookie: otherCookie, data: contest });
  await call(`/api${manage}`, 200, { method: "PUT", cookie: ownerCookie, data: contest });
  await call(`/api/admin/contests/${contestId}`, 200, { method: "PUT", cookie: ownerCookie, data: contest });
  await call(`/api${manage}/reveal`, 200, { method: "POST", cookie: ownerCookie });
  await call(`/api${manage}`, 200, { method: "DELETE", cookie: ownerCookie });
  console.log("Admin split smoke test passed");
} finally {
  proxy.close();
  await Promise.all(children.map(async (child) => {
    if (child.exitCode !== null || child.signalCode !== null) return;
    const closed = once(child, "close");
    child.kill();
    await closed;
  }));
  await rm(dir, { recursive: true, force: true });
}
