import { test } from "node:test";
import assert from "node:assert/strict";
import { createJudgeMonitorHandler, isJudgeMonitorAdmin } from "../src/lib/judgeMonitor.ts";
import { accountNavGroups, isNavActive } from "../src/lib/navLinks.ts";
import { judgeFixture } from "./lib/judge-test-fixture.mjs";

const request = (headers = {}, method = "GET") => new Request("http://127.0.0.1/api/admin/judge", { method, headers });

test("judge monitor denies anonymous/non-admin sessions, including forged role and worker headers", async () => {
  for (const session of [null, { role: "USER" }, { role: "admin" }]) {
    let reads = 0;
    const handle = createJudgeMonitorHandler({ getSession: async () => session, getStatus: async () => { reads++; throw new Error("must not read"); } });
    const response = await handle(request({ "x-judge-worker-secret": "machine-credential", "x-role": "ADMIN", authorization: "Bearer fake" }));
    assert.equal(response.status, 403);
    assert.match(response.headers.get("cache-control"), /no-store/);
    assert.equal(response.headers.get("vary"), "Cookie");
    assert.equal(reads, 0);
    assert.equal(isJudgeMonitorAdmin(session), false, "page uses the same server-side authorization predicate");
  }
});

test("admin monitor reads the real queue, identifies expired/unleased work, and rechecks demotion", async (t) => {
  const { db, queues: [queue], advance } = await judgeFixture(t, 3);
  const first = await queue.claim(), second = await queue.claim();
  await db.submission.update({ where: { id: second.submissionId }, data: { judgeClaimedAt: null } });
  advance(queue.timing.leaseMs);
  let session = { role: "ADMIN" };
  const handle = createJudgeMonitorHandler({ getSession: async () => session, getStatus: queue.status });
  const response = await handle(request());
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.pending, 1); assert.equal(data.judging, 2); assert.equal(data.expired, 2);
  assert.deepEqual(data.active.map((lease) => lease.state), ["expired", "unleased"]);
  assert.ok(data.oldestPendingAgeMs >= queue.timing.leaseMs);
  assert.ok(!JSON.stringify(data).includes(first.claimId));
  session = { role: "USER" };
  assert.equal((await handle(request())).status, 403);
  assert.equal((await db.submission.findUnique({ where: { id: first.submissionId } })).status, "JUDGING", "monitoring never recovers/mutates work");
});

test("monitor allowlists response fields, caps leases and rejects non-read operations", async () => {
  const now = new Date("2026-10-10T12:00:00.000Z");
  const handle = createJudgeMonitorHandler({ getSession: async () => ({ role: "ADMIN" }), getStatus: async () => ({
    pending: 0, judging: 105, expired: 0, oldestPendingAgeMs: null, sampledAt: now, leaseMs: 900000, heartbeatMs: 30000,
    workerSecret: "never-ship", code: "hidden-source",
    active: Array.from({ length: 105 }, (_, i) => ({ submissionId: i + 1, heartbeatAt: now,
      leaseExpiresAt: new Date(now.getTime() + 900000), claimId: "hidden-token", input: "hidden-test" })),
  }) });
  const data = await (await handle(request())).json();
  assert.equal(data.active.length, 100); assert.equal(data.activeTruncated, true);
  assert.equal(data.active[0].state, "live"); assert.equal(data.active[0].heartbeatAgeMs, 0);
  assert.doesNotMatch(JSON.stringify(data), /never-ship|hidden-|workerSecret|claimId/);
  assert.equal((await handle(request({}, "POST"))).status, 405);
  const links = (admin) => accountNavGroups("test", admin).flatMap((group) => group.links);
  assert.ok(links(true).some((link) => link.href === "/admin/judge"));
  assert.ok(!links(false).some((link) => link.href === "/admin/judge"));
  assert.equal(isNavActive("/admin/judge", "/admin/judge"), true);
  assert.equal(isNavActive("/admin/judge", "/admin/problems"), false);
});

test("monitor storage/auth failures return bounded non-cached errors without exception details", async () => {
  for (const brokenAuth of [true, false]) {
    const handle = createJudgeMonitorHandler({
      getSession: async () => { if (brokenAuth) throw new Error("private-auth-detail"); return { role: "ADMIN" }; },
      getStatus: async () => { throw new Error("private-database-detail"); },
    });
    const response = await handle(request());
    assert.equal(response.status, 503);
    assert.match(response.headers.get("cache-control"), /no-store/);
    assert.doesNotMatch(await response.text(), /private-/);
  }
});
