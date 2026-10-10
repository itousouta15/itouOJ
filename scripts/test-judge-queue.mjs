import { test } from "node:test";
import assert from "node:assert/strict";
import { Worker } from "node:worker_threads";
import { once } from "node:events";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import { JUDGE_LEASE_MS, startJudgeHeartbeat } from "../src/lib/judgeQueue.ts";
import { judgeFixture as fixture } from "./lib/judge-test-fixture.mjs";

const result = { status: "AC", score: 100, timeMs: 12 };
const tests = [{ order: 1, verdict: "AC", actualOutput: "ok" }];

test("concurrent independent connections claim each submission once", async (t) => {
  const { queues } = await fixture(t, 12);
  const claimed = [];
  await Promise.all(queues.map(async (queue) => {
    for (;;) { const claim = await queue.claim(); if (!claim) break; claimed.push(claim); }
  }));
  assert.equal(claimed.length, 12);
  assert.equal(new Set(claimed.map((c) => c.submissionId)).size, 12);
  assert.equal(new Set(claimed.map((c) => c.claimId)).size, 12);
});

test("parallel worker threads compete for one job using independent SQLite connections", async (t) => {
  const { url } = await fixture(t);
  const workers = Array.from({ length: 4 }, () => new Worker(new URL("./lib/judge-claim-worker.mjs", import.meta.url), { workerData: { url } }));
  try {
    await Promise.all(workers.map((worker) => once(worker, "message")));
    const results = workers.map((worker) => new Promise((resolve, reject) => {
      worker.once("message", resolve); worker.once("error", reject);
      worker.once("exit", (code) => { if (code) reject(new Error(`worker exit ${code}`)); });
    }));
    workers.forEach((worker) => worker.postMessage("claim"));
    const claims = (await Promise.all(results)).filter(Boolean);
    assert.equal(claims.length, 1);
  } finally {
    // after hooks run in registration order: release the workers' SQLite
    // handles before the fixture's earlier hook removes its directory.
    await Promise.all(workers.map((worker) => worker.terminate()));
  }
});

test("terminated worker leaves a durable claim that can be recovered and fenced", async (t) => {
  const { url, queues: [queue], advance } = await fixture(t);
  const worker = new Worker(new URL("./lib/judge-claim-worker.mjs", import.meta.url), { workerData: { url, hold: true } });
  t.after(() => worker.terminate());
  await once(worker, "message");
  const claimed = once(worker, "message");
  worker.postMessage("claim");
  const [dead] = await claimed;
  assert.ok(dead);
  await worker.terminate();
  advance(JUDGE_LEASE_MS + 10_000);
  assert.equal((await queue.recover()).count, 1);
  const replacement = await queue.claim();
  assert.equal(replacement.submissionId, dead.submissionId);
  assert.equal(await queue.complete(replacement, result, tests), "applied");
  assert.equal(await queue.complete(dead, { status: "WA" }), "stale");
});

test("worker death: exact lease boundary rejects renewal and completion before recovery", async (t) => {
  const { queues: [queue], advance, db } = await fixture(t);
  const dead = await queue.claim();
  advance(JUDGE_LEASE_MS);
  assert.equal(await queue.heartbeat(dead), false);
  assert.equal(await queue.complete(dead, result, tests), "stale");
  assert.equal((await queue.status()).expired, 1);
  assert.equal((await queue.recover()).count, 1);
  const replacement = await queue.claim();
  assert.notEqual(replacement.claimId, dead.claimId);
  assert.equal(await queue.release(dead), false);
  assert.equal(await queue.complete(dead, { status: "WA" }, tests), "stale");
  assert.equal(await queue.complete(replacement, result, tests), "applied");
  assert.equal((await db.submission.findUnique({ where: { id: 1 } })).status, "AC");
});

test("heartbeat keeps long jobs alive; stopped heartbeat eventually expires", async (t) => {
  const { queues: [queue], advance } = await fixture(t);
  const claim = await queue.claim();
  for (let i = 0; i < 4; i++) {
    advance(JUDGE_LEASE_MS / 2);
    assert.equal(await queue.heartbeat(claim), true);
    assert.equal((await queue.recover()).count, 0);
  }
  advance(JUDGE_LEASE_MS);
  assert.equal((await queue.recover()).count, 1);
});

test("duplicate and conflicting completion delivery never replaces the first result", async (t) => {
  const { queues: [queue, other], db } = await fixture(t);
  const claim = await queue.claim();
  const outcomes = await Promise.all([queue.complete(claim, result, tests), other.complete(claim, result, tests)]);
  assert.deepEqual(outcomes.sort(), ["applied", "duplicate"]);
  assert.equal(await queue.complete(claim, { status: "WA" }, []), "duplicate");
  assert.equal(await db.testResult.count(), 1);
  assert.equal((await db.submission.findUnique({ where: { id: 1 } })).status, "AC");
});

test("result transaction rolls back verdict and test rows together", async (t) => {
  const { queues: [queue], db } = await fixture(t);
  const claim = await queue.claim();
  await assert.rejects(queue.complete(claim, result, [...tests, { order: 2, verdict: "AC", testCaseId: 999 }]));
  assert.equal((await db.submission.findUnique({ where: { id: 1 } })).status, "JUDGING");
  assert.equal(await db.testResult.count(), 0);
  assert.equal(await queue.complete(claim, result, tests), "applied");
});

test("released jobs get a new fencing token and legacy unleased jobs recover", async (t) => {
  const { queues: [queue], db } = await fixture(t);
  const old = await queue.claim();
  assert.equal(await queue.release(old), true);
  const next = await queue.claim();
  assert.notEqual(next.claimId, old.claimId);
  assert.equal(await queue.complete(old, result), "stale");
  await db.submission.update({ where: { id: 1 }, data: { judgeClaimedAt: null } });
  assert.equal((await queue.recover()).count, 1);
  const status = await queue.status();
  assert.equal(status.pending, 1);
  assert.equal(status.judging, 0);
  assert.deepEqual(status.active, []);
});

test("background heartbeats serialize, stop cleanly, and fence renewal errors", async () => {
  let calls = 0;
  let concurrent = 0;
  let max = 0;
  const heartbeat = startJudgeHeartbeat(async () => {
    calls++; concurrent++; max = Math.max(max, concurrent);
    await new Promise((resolve) => setTimeout(resolve, 10));
    concurrent--; return true;
  }, 2);
  await new Promise((resolve) => setTimeout(resolve, 70));
  await heartbeat.stop();
  assert.ok(calls >= 2); assert.equal(max, 1); assert.equal(concurrent, 0);
  const stoppedCalls = calls;
  await new Promise((resolve) => setTimeout(resolve, 20));
  assert.equal(calls, stoppedCalls);
  const failed = startJudgeHeartbeat(async () => { throw new Error("database unavailable"); }, 1);
  await new Promise((resolve) => setTimeout(resolve, 20));
  assert.equal(failed.isLost(), true);
  await failed.stop();
});

test("standalone poller authenticates work requests and reports handled submissions", { timeout: 10_000 }, async (t) => {
  const requests = [];
  const server = createServer((req, res) => {
    requests.push({ method: req.method, url: req.url, secret: req.headers["x-judge-worker-secret"] });
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ processed: true, submissionId: 42 }));
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const child = spawn(process.execPath, [fileURLToPath(new URL("./judge-worker.mjs", import.meta.url))], {
    env: { ...process.env, JUDGE_WORKER_SECRET: "isolated-test-only", JUDGE_WORKER_CONCURRENCY: "1",
      JUDGE_WORKER_URL: `http://127.0.0.1:${server.address().port}` },
    stdio: ["ignore", "pipe", "pipe"],
  });
  t.after(async () => {
    const exited = child.exitCode !== null ? Promise.resolve() : once(child, "exit");
    child.kill();
    await exited;
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  });
  const [line] = await once(child.stdout, "data");
  const event = JSON.parse(line.toString().trim().split("\n")[0]);
  assert.equal(event.event, "judge.poll.completed");
  assert.equal(event.submissionId, 42);
  assert.deepEqual(requests[0], { method: "POST", url: "/api/internal/judge?action=work", secret: "isolated-test-only" });
});
