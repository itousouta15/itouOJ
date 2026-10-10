import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { Readable } from "node:stream";
import { once } from "node:events";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { judgeFixture } from "./lib/judge-test-fixture.mjs";
import { createJudgeProtocol } from "../src/lib/judgeProtocol.ts";
import { evaluateJudgeJob, summarizeJudgeTests, runVerdict } from "../src/lib/judgeCore.ts";
import { loadJudgeJob } from "../src/lib/judgeJob.ts";
import { runEmbeddedJudgeClaim } from "../src/lib/judgeEmbeddedWorker.ts";
import { runRemoteJudgeWorker } from "../src/lib/judgeRemoteWorker.ts";
import { judgeCoordinatorEndpoint } from "../src/lib/judgeCoordinatorUrl.mjs";
import { JUDGE_JOB_BYTES, JUDGE_RESULT_BYTES, readJudgeJson, judgeOutcomeSchema, validateJudgeOutcome } from "../src/lib/judgeWire.ts";
import { parseSandboxExecution, compileFailed, executionTimeMs, SandboxInfrastructureError } from "../src/lib/sandboxProtocol.ts";
import { nativeCompiledSuccess, nativeInterpretedSuccess, nativeCompileFailure, nativeRunCases, nativeRunResponse } from "./lib/judge-native-fixtures.mjs";

const SECRET = "isolated-remote-test-secret";
const phase = { stdout: "ok", stderr: "", output: "ok", code: 0, signal: null, memory: 1024, cpu_time: 4, wall_time: 5 };
const execution = { language: "c++", version: "10.2.0", run: phase };
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function until(predicate, timeout = 15_000) {
  const start = Date.now();
  while (!(await predicate())) {
    if (Date.now() - start > timeout) throw new Error("Timed out waiting for worker");
    await wait(25);
  }
}
async function server(t, handler) {
  const http = createServer(handler);
  http.listen(0, "127.0.0.1");
  await once(http, "listening");
  t.after(async () => { http.closeAllConnections(); await new Promise((resolve) => http.close(resolve)); });
  return { http, url: `http://127.0.0.1:${http.address().port}` };
}
async function coordinator(t, count = 1, options = {}) {
  const fixture = await judgeFixture(t, count, options);
  const handler = createJudgeProtocol({ db: fixture.db, queue: fixture.queues[0], secret: () => SECRET });
  const seen = [];
  let dropCompletion = false;
  const transport = await server(t, async (req, res) => {
    try {
      const request = new Request(`http://127.0.0.1${req.url}`, {
        method: req.method, headers: req.headers,
        ...(req.method !== "GET" ? { body: Readable.toWeb(req), duplex: "half" } : {}),
      });
      const action = new URL(request.url).searchParams.get("action");
      const response = await handler(request);
      const data = await response.json();
      seen.push({ action, status: response.status, data });
      if (action === "complete" && dropCompletion) { dropCompletion = false; req.socket.destroy(); return; }
      res.writeHead(response.status, Object.fromEntries(response.headers));
      res.end(JSON.stringify(data));
    } catch { res.writeHead(500); res.end(); }
  });
  const rpc = async (action, body, secret = SECRET) => {
    const response = await fetch(`${transport.url}/api/internal/judge?action=${action}`, {
      method: "POST", headers: { "content-type": "application/json", "x-judge-worker-secret": secret },
      body: JSON.stringify(body ?? {}),
    });
    return { status: response.status, data: await response.json(), headers: response.headers };
  };
  return { ...fixture, ...transport, seen, rpc, handler, dropNextCompletion: () => { dropCompletion = true; } };
}
async function sandbox(t, name, gate = Promise.resolve(), failure = false, payload = execution) {
  const requests = [];
  const transport = await server(t, async (req, res) => {
    let raw = "";
    for await (const chunk of req) raw += chunk;
    requests.push({ path: req.url, body: JSON.parse(raw), secret: req.headers["x-judge-worker-secret"] });
    await gate;
    res.writeHead(failure ? 503 : 200, { "content-type": "application/json" });
    res.end(JSON.stringify(payload.execution_report ? payload : { ...payload, metrics: {
      setup_ms: 0, compile_ms: 0, run_ms: 5, cleanup_ms: 0, total_ms: 5, request_bytes: raw.length, worker: name,
    } }));
  });
  return { ...transport, requests };
}
function remoteWorker(t, coordinatorUrl, sandboxUrl, id) {
  const child = spawn(process.execPath, ["--import", "./scripts/ctf-test-loader.mjs", "scripts/judge-remote-worker.mjs"], {
    cwd: fileURLToPath(new URL("../", import.meta.url)),
    env: { ...process.env, JUDGE_WORKER_URL: coordinatorUrl, SANDBOX_URL: sandboxUrl,
      JUDGE_WORKER_SECRET: SECRET, JUDGE_WORKER_ID: id, DATABASE_URL: "file:/worker-must-not-open-a-database/absent.db" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let logs = "";
  child.stdout.on("data", (data) => { logs += data; });
  child.stderr.on("data", (data) => { logs += data; });
  const kill = async () => {
    if (child.exitCode !== null || child.signalCode !== null) return;
    const exit = once(child, "exit"); child.kill("SIGKILL"); await exit;
  };
  t.after(kill);
  return { child, kill, logs: () => logs };
}
const completion = async (assignment) => ({ ...assignment.claim, jobDigest: assignment.jobDigest,
  outcome: await evaluateJudgeJob(assignment.job, async () => execution) });

test("two real remote processes execute concurrently on distinct sandboxes and renew leases", { timeout: 30_000 }, async (t) => {
  const c = await coordinator(t, 2, { realtime: true, timing: { leaseMs: 2000, heartbeatMs: 100 } });
  let release;
  const gate = new Promise((resolve) => { release = resolve; });
  t.after(() => release());
  const a = await sandbox(t, "A", gate), b = await sandbox(t, "B", gate);
  const wa = remoteWorker(t, c.url, a.url, "remote-A"), wb = remoteWorker(t, c.url, b.url, "remote-B");
  await until(() => a.requests.length === 1 && b.requests.length === 1);
  assert.notEqual(a.requests[0].body.files[0].content, b.requests[0].body.files[0].content);
  assert.equal(a.requests[0].body.stdin, "hidden-input");
  assert.equal(a.requests[0].secret, undefined);
  await wait(2200); // Work exceeds the initial lease; actual HTTP heartbeats extend it.
  assert.ok(c.seen.filter((r) => r.action === "heartbeat" && r.status === 200).length >= 4);
  assert.equal((await c.rpc("recover")).data.recovered, 0);
  release();
  await until(async () => await c.db.submission.count({ where: { status: "AC" } }) === 2);
  assert.equal(await c.db.testResult.count(), 2);
  assert.equal(wa.child.exitCode, null); assert.equal(wb.child.exitCode, null);
  await wa.kill(); await wb.kill();
});

test("killed remote executor is reclaimed by another host; old completion is fenced", { timeout: 30_000 }, async (t) => {
  const c = await coordinator(t);
  let release;
  const slow = await sandbox(t, "dead", new Promise((resolve) => { release = resolve; }));
  t.after(() => release());
  const dead = remoteWorker(t, c.url, slow.url, "dead-worker");
  await until(() => slow.requests.length === 1);
  const original = c.seen.find((r) => r.action === "claim" && r.data.claim)?.data;
  await dead.kill();
  c.advance(15 * 60 * 1000 + 1);
  const liveSandbox = await sandbox(t, "replacement");
  const live = remoteWorker(t, c.url, liveSandbox.url, "live-worker");
  await until(async () => await c.db.submission.count({ where: { status: "AC" } }) === 1);
  assert.equal(liveSandbox.requests.length, 1);
  assert.equal((await c.rpc("complete", await completion(original))).status, 409);
  assert.equal((await c.rpc("heartbeat", original.claim)).status, 409);
  assert.equal(await c.db.testResult.count(), 1);
  await live.kill();
});

test("lost completion response is retried idempotently by the remote worker", { timeout: 20_000 }, async (t) => {
  const c = await coordinator(t);
  c.dropNextCompletion();
  const s = await sandbox(t, "retry");
  const worker = remoteWorker(t, c.url, s.url, "retry-worker");
  await until(() => c.seen.some((r) => r.action === "complete" && r.data.outcome === "duplicate"));
  assert.equal(s.requests.length, 1);
  assert.equal(await c.db.testResult.count(), 1);
  await worker.kill();
});

test("heartbeat rejection aborts remote execution and suppresses completion", { timeout: 20_000 }, async (t) => {
  const c = await coordinator(t, 1, { realtime: true, timing: { leaseMs: 2000, heartbeatMs: 100 } });
  let release;
  const s = await sandbox(t, "lease-lost", new Promise((resolve) => { release = resolve; }));
  t.after(() => release());
  const worker = remoteWorker(t, c.url, s.url, "lease-lost");
  await until(() => s.requests.length === 1);
  c.advance(3000);
  assert.equal((await c.rpc("recover")).data.recovered, 1);
  await until(() => worker.logs().includes("judge.heartbeat_lost"));
  await worker.kill();
  assert.ok(!c.seen.some((r) => r.action === "complete"));
  assert.equal(await c.db.testResult.count(), 0);
});

test("secret auth, bounded payloads, result consistency and job edits are enforced", async (t) => {
  const c = await coordinator(t);
  assert.equal((await c.rpc("claim", { workerId: "x" }, "wrong")).status, 404);
  assert.equal((await c.rpc("status", {}, "")).status, 404);
  assert.equal((await c.rpc("claim", { workerId: "x", injected: "field" })).status, 400);
  const assignment = (await c.rpc("claim", { workerId: "validator" })).data;
  assert.equal(assignment.job.groups[0].tests[0].input, "hidden-input");
  const good = await completion(assignment);
  const bad = structuredClone(good); bad.outcome.tests[0].testCaseId = 999;
  assert.equal((await c.rpc("complete", bad)).status, 422);
  bad.outcome.tests[0].testCaseId = 1; bad.outcome.result.score = 100;
  assert.equal((await c.rpc("complete", bad)).status, 422);
  bad.outcome.tests[0].timeMs = -1;
  assert.equal((await c.rpc("complete", bad)).status, 400);
  assert.equal(await c.db.testResult.count(), 0);
  const bounded = await c.handler(new Request(`${c.url}?action=complete`, { method: "POST",
    headers: { "x-judge-worker-secret": SECRET, "content-type": "application/json", "content-length": String(20 * 1024 * 1024) }, body: "{}" }));
  assert.equal(bounded.status, 413);
  await c.db.$executeRaw`UPDATE TestCase SET output = 'edited' WHERE id = 1`;
  assert.equal((await c.rpc("complete", good)).status, 409);
  assert.equal((await c.rpc("fail", { ...assignment.claim, retryable: true, reason: "worker_error" })).status, 200);
  const next = (await c.rpc("claim", { workerId: "validator" })).data;
  const done = await completion(next);
  assert.equal((await c.rpc("complete", done)).data.outcome, "applied");
  assert.equal((await c.rpc("complete", done)).data.outcome, "duplicate");
  const status = await c.rpc("status");
  assert.match(status.headers.get("cache-control"), /no-store/);
  assert.ok(!JSON.stringify(status.data).includes("hidden-input"));
  assert.ok(!JSON.stringify(status.data).includes(next.claim.claimId));
});

test("fail protocol retries transient failures and applies terminal failure idempotently", async (t) => {
  const c = await coordinator(t);
  const first = (await c.rpc("claim", { workerId: "failure" })).data;
  assert.equal((await c.rpc("fail", { ...first.claim, retryable: true, reason: "sandbox_unavailable" })).data.outcome, "released");
  const next = (await c.rpc("claim", { workerId: "failure" })).data;
  assert.notEqual(next.claim.claimId, first.claim.claimId);
  const terminal = { ...next.claim, retryable: false, reason: "worker_error" };
  assert.equal((await c.rpc("fail", terminal)).data.outcome, "applied");
  assert.equal((await c.rpc("fail", terminal)).data.outcome, "duplicate");
  assert.equal((await c.rpc("fail", { ...first.claim, retryable: false, reason: "worker_error" })).status, 409);
});

test("remote sandbox transport failure releases work instead of submitting a false verdict", { timeout: 20_000 }, async (t) => {
  const c = await coordinator(t);
  const s = await sandbox(t, "unavailable", Promise.resolve(), true);
  const worker = remoteWorker(t, c.url, s.url, "unavailable");
  await until(() => c.seen.some((r) => r.action === "fail" && r.data.outcome === "released"));
  await worker.kill();
  assert.equal(await c.db.testResult.count(), 0);
  assert.equal((await c.db.submission.findUnique({ where: { id: 1 } })).status, "PENDING");
});

test("stream limits reject missing Content-Length and oversized jobs become visible IE", async (t) => {
  const stream = new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode('"too long"')); controller.close(); } });
  await assert.rejects(readJudgeJson(new Response(stream), 4), (error) => error.status === 413);
  const c = await coordinator(t);
  await c.db.$executeRaw`UPDATE TestCase SET input = ${"x".repeat(JUDGE_JOB_BYTES + 1)} WHERE id = 1`;
  assert.equal((await c.rpc("claim", { workerId: "bounded" })).status, 422);
  assert.equal((await c.db.submission.findUnique({ where: { id: 1 } })).status, "IE");
});

test("shared core preserves subtask scoring, early-stop, first-line comparison and compile errors", async (t) => {
  const { db } = await judgeFixture(t);
  await db.$executeRaw`INSERT INTO Subtask (id,problemId,"order",points,checkMode) VALUES (1,1,1,40,'full'),(2,1,2,60,'firstLine')`;
  await db.$executeRaw`UPDATE TestCase SET subtaskId=1 WHERE id=1`;
  await db.$executeRaw`INSERT INTO TestCase (id,problemId,subtaskId,"order",input,output) VALUES (2,1,1,2,'skipped','ok'),(3,1,2,3,'third','ok')`;
  const job = await loadJudgeJob(db, 1);
  const inputs = [];
  const output = await evaluateJudgeJob(job, async (params) => {
    inputs.push(params.stdin);
    if (inputs.length === 2) assert.equal(params.compiledHandle, "local-handle");
    return { ...execution, compiled_handle: "local-handle", run: { ...phase, stdout: params.stdin === "hidden-input" ? "bad" : "ok\nextra" } };
  });
  assert.deepEqual(inputs, ["hidden-input", "third"]);
  assert.equal(output.result.status, "WA"); assert.equal(output.result.score, 60);
  assert.deepEqual(summarizeJudgeTests(job, output.tests), output.result);
  assert.throws(() => summarizeJudgeTests(job, output.tests.slice(0, 1)));
  const ce = await evaluateJudgeJob(job, async () => ({ ...execution, compile: { ...phase, code: 1, stderr: "compiler error" } }));
  assert.equal(ce.result.status, "CE"); assert.equal(ce.tests.length, 0);
});

test("embedded execution fences edits and preserves old results until a fresh job completes", async (t) => {
  const { db, queues: [queue] } = await judgeFixture(t);
  await db.testResult.create({ data: { submissionId: 1, order: 1, testCaseId: 1, verdict: "WA", actualOutput: "old" } });
  const claim = await queue.claim();
  await runEmbeddedJudgeClaim({ db, queue, claim, execute: async () => {
    await db.$executeRaw`UPDATE TestCase SET output = 'edited' WHERE id = 1`;
    return execution;
  } });
  assert.equal((await db.submission.findUnique({ where: { id: 1 } })).status, "PENDING");
  assert.equal((await db.testResult.findFirst()).actualOutput, "old");
  await runEmbeddedJudgeClaim({ db, queue, claim: await queue.claim(), execute: async () => execution });
  assert.equal((await db.submission.findUnique({ where: { id: 1 } })).status, "WA");
  assert.equal((await db.testResult.findFirst()).actualOutput, "ok");
});

test("recovered recognition jobs cannot accept null answers or commit a stale answer key", async (t) => {
  const { db, queues: [queue] } = await judgeFixture(t);
  await db.$executeRaw`UPDATE Problem SET type = 'RECOGNITION', answerIndex = NULL WHERE id = 1`;
  await db.$executeRaw`UPDATE Submission SET language = 'choice', code = '', selectedIndex = NULL WHERE id = 1`;
  const execute = async () => { throw new Error("Recognition must not execute in a sandbox"); };
  await runEmbeddedJudgeClaim({ db, queue, claim: await queue.claim(), execute });
  const missing = await db.submission.findUnique({ where: { id: 1 } });
  assert.equal(missing.status, "WA"); assert.equal(missing.score, 0);
  await db.$executeRaw`UPDATE Submission SET status = 'PENDING', selectedIndex = 0 WHERE id = 1`;
  await db.$executeRaw`UPDATE Problem SET answerIndex = 0 WHERE id = 1`;
  const old = await loadJudgeJob(db, 1);
  assert.deepEqual((await evaluateJudgeJob(old, execute)).result, { status: "AC", score: 100 });
  const editingQueue = { ...queue, complete: async (...args) => {
    await db.$executeRaw`UPDATE Problem SET answerIndex = 1 WHERE id = 1`;
    return queue.complete(...args);
  } };
  await runEmbeddedJudgeClaim({ db, queue: editingQueue, claim: await queue.claim(), execute });
  assert.equal((await db.submission.findUnique({ where: { id: 1 } })).status, "PENDING");
  await runEmbeddedJudgeClaim({ db, queue, claim: await queue.claim(), execute });
  assert.equal((await db.submission.findUnique({ where: { id: 1 } })).status, "WA");
});

test("an edit beyond job limits returns a conflict instead of trapping completion in 503 retries", async (t) => {
  const c = await coordinator(t);
  const assignment = (await c.rpc("claim", { workerId: "limits-edit" })).data;
  const done = await completion(assignment);
  await c.db.$executeRaw`UPDATE Problem SET memoryLimitMb = 4097 WHERE id = 1`;
  assert.equal((await c.rpc("complete", done)).status, 409);
  assert.equal((await c.db.submission.findUnique({ where: { id: 1 } })).status, "JUDGING");
  assert.equal(await c.db.testResult.count(), 0);
  assert.equal((await c.rpc("fail", { ...assignment.claim, retryable: true, reason: "worker_error" })).status, 200);
  assert.equal((await c.rpc("claim", { workerId: "limits-edit" })).status, 422);
  assert.equal((await c.db.submission.findUnique({ where: { id: 1 } })).status, "IE");
});

test("legacy compile binaries remain cached when execution responses do not echo them", async (t) => {
  const { db } = await judgeFixture(t);
  const job = await loadJudgeJob(db, 1);
  job.groups[0].tests = [1, 2, 3].map((id) => ({ id, input: String(id), output: "ok" }));
  const binaries = [];
  const outcome = await evaluateJudgeJob(job, async (params) => {
    binaries.push(params.precompiledBinary);
    return binaries.length === 1 ? { ...execution, compiled_binary: "bGVnYWN5" } : execution;
  });
  assert.equal(outcome.result.status, "AC");
  assert.deepEqual(binaries, [undefined, "bGVnYWN5", "bGVnYWN5"]);
});

test("JSON-escaped stdout cannot overflow completion limits for a valid 1000-test job", async (t) => {
  const { db } = await judgeFixture(t);
  const job = await loadJudgeJob(db, 1);
  job.hasSubtasks = true;
  job.groups = [{ points: 100, subtaskOrder: 1, checkMode: "firstLine",
    tests: Array.from({ length: 1000 }, (_, i) => ({ id: i + 1, input: "", output: "ok" })) }];
  const outcome = await evaluateJudgeJob(job, async () => ({ ...execution, run: {
    ...phase, stdout: "ok\n" + "\u0000".repeat(3997),
  } }));
  assert.equal(outcome.result.status, "AC");
  assert.equal(outcome.tests.length, 1000);
  assert.match(outcome.tests[0].actualOutput, /輸出過長/);
  assert.ok(Buffer.byteLength(JSON.stringify({ submissionId: 1, claimId: "x".repeat(36), jobDigest: "x".repeat(64), outcome })) < JUDGE_RESULT_BYTES);
});

test("malformed sandbox exit codes release work rather than inventing CE or RE verdicts", { timeout: 30_000 }, async (t) => {
  for (const part of ["compile", "run"]) await t.test(part, async (t) => {
    const c = await coordinator(t);
    const s = await sandbox(t, "malformed", Promise.resolve(), false, {
      ...execution, [part]: { ...phase, code: undefined },
    });
    const worker = remoteWorker(t, c.url, s.url, `malformed-${part}`);
    await until(() => c.seen.some((r) => r.action === "fail" && r.data.outcome === "released"));
    await worker.kill();
    assert.equal((await c.db.submission.findUnique({ where: { id: 1 } })).status, "PENDING");
    assert.equal(await c.db.testResult.count(), 0);
    assert.ok(!c.seen.some((r) => r.action === "complete"));
  });
});

test("coordinator credentials require HTTPS off-host, while local HTTP remains usable", async () => {
  for (const url of ["http://judge.example.invalid", "http://localhost.example.invalid", "http://192.0.2.1",
    "https://user:pass@judge.example.invalid", "file:///judge"]) {
    await assert.rejects(runRemoteJudgeWorker({ coordinatorUrl: url, secret: SECRET, workerId: "url-check", stop: AbortSignal.abort() }));
  }
  for (const url of ["https://judge.example.invalid", "http://127.0.0.1:8090", "http://localhost:8090", "http://[::1]:8090"]) {
    assert.equal(judgeCoordinatorEndpoint(url).pathname, "/api/internal/judge");
  }
});

test("native nullable CPU and memory stay unavailable; time falls back to wall, not zero", async (t) => {
  const { db } = await judgeFixture(t);
  const job = await loadJudgeJob(db, 1);
  const native = parseSandboxExecution(nativeCompiledSuccess);
  assert.equal(native.compile.cpu_time, null);
  assert.equal(native.compile.memory, null);
  assert.equal(executionTimeMs(native.run), 1);
  const interpreted = parseSandboxExecution(nativeInterpretedSuccess);
  assert.equal(compileFailed(interpreted), false);
  assert.equal(executionTimeMs(interpreted.run), 0, "a measured CPU zero must not fall back to wall time");
  const unavailable = parseSandboxExecution(nativeRunResponse(nativeRunCases[0]));
  assert.equal(unavailable.run.cpu_time, null);
  assert.equal(unavailable.run.memory, null);
  const outcome = await evaluateJudgeJob(job, async () => unavailable);
  assert.equal(outcome.result.status, "AC");
  assert.equal(outcome.tests[0].timeMs, 55);
  assert.equal(outcome.tests[0].memoryKb, null);
  assert.equal(outcome.result.memoryKb, null);
  judgeOutcomeSchema.parse(outcome);
  validateJudgeOutcome(job, outcome);
  job.groups[0].tests.push({ id: 2, input: "second", output: "ok" });
  let calls = 0;
  const mixed = await evaluateJudgeJob(job, async () => calls++ === 0 ? native : unavailable);
  assert.equal(mixed.result.memoryKb, null, "an unavailable sample makes the overall maximum unknown");
  validateJudgeOutcome(job, judgeOutcomeSchema.parse(mixed));
  const unmeasured = parseSandboxExecution({ ...execution, run: { ...phase, cpu_time: null, wall_time: null, memory: null } });
  const noMeasurements = await evaluateJudgeJob(job, async () => unmeasured);
  assert.equal(noMeasurements.result.timeMs, null);
  assert.equal(noMeasurements.result.memoryKb, null);
  validateJudgeOutcome(job, judgeOutcomeSchema.parse(noMeasurements));
});

test("native report evidence distinguishes user exits, timeout, OOM, signals and infrastructure", async (t) => {
  for (const example of nativeRunCases) await t.test(example.name, () => {
    const response = nativeRunResponse(example);
    if (example.infrastructure) {
      assert.throws(() => parseSandboxExecution(response), SandboxInfrastructureError);
    } else {
      const execution = parseSandboxExecution(response);
      // Existing callers only pass result.run through judge.ts's re-export.
      assert.equal(runVerdict(execution.run, 1000, 64 * 1024 * 1024, "ok"), example.verdict);
    }
  });
});

test("versioned compile failure uses the stage report, while compiler infrastructure is retried", async (t) => {
  const { db } = await judgeFixture(t);
  const job = await loadJudgeJob(db, 1);
  const compileError = parseSandboxExecution(nativeCompileFailure);
  assert.equal((await evaluateJudgeJob(job, async () => compileError)).result.status, "CE");
  const deadline = structuredClone(nativeCompileFailure);
  // The compiler can exit zero while its descendant holds output pipes open;
  // run_child's supervisor timeout still marks compilation failed.
  deadline.compile.code = 0;
  deadline.compile.wall_time = 15005;
  deadline.execution_report.compile = { status: "failed", cause: "wall_timeout", wall_ms: 15005, cpu_ms: null, memory_peak_bytes: null };
  const timedOut = parseSandboxExecution(deadline);
  assert.equal(compileFailed(timedOut), true);
  assert.equal((await evaluateJudgeJob(job, async () => timedOut)).result.status, "CE");
  const execFailed = structuredClone(nativeCompileFailure);
  execFailed.compile.code = 127;
  assert.throws(() => parseSandboxExecution(execFailed), SandboxInfrastructureError);
  const launcherFailed = structuredClone(nativeCompileFailure);
  launcherFailed.compile.code = -1;
  launcherFailed.compile.wall_time = null;
  launcherFailed.execution_report.compile.cause = "launcher_error";
  launcherFailed.execution_report.compile.wall_ms = null;
  assert.throws(() => parseSandboxExecution(launcherFailed), SandboxInfrastructureError);
  for (const cause of ["launcher_error", "supervisor_timeout"]) {
    const unknown = nativeRunResponse(nativeRunCases.find((example) => example.name === "metadata unavailable"));
    unknown.execution_report.run.cause = cause;
    assert.throws(() => parseSandboxExecution(unknown), SandboxInfrastructureError);
  }
});

test("malformed or contradictory versioned evidence never falls back to legacy grading", () => {
  const corruptions = [
    (r) => { r.execution_report.schema_version = 2; },
    (r) => { r.execution_report = null; },
    (r) => { delete r.compile.cpu_time; },
    (r) => { r.compile.cpu_time = -1; },
    (r) => { r.run.cpu_time = 55; },
    (r) => { r.run.memory = null; },
    (r) => { r.run.code = 139; },
    (r) => { delete r.execution_report.run.exit_code; },
    (r) => { r.execution_report.run.signal_number = 31.5; },
    (r) => { r.execution_report.run.cause = "oom_kill"; },
    (r) => { r.execution_report.run.status = "unknown"; },
    (r) => { r.execution_report.start = { ...r.execution_report.start, status: "failed", cause: "bootstrap_failed" }; },
    (r) => { r.execution_report.compile.status = "failed"; },
  ];
  for (const corrupt of corruptions) {
    const response = structuredClone(nativeCompiledSuccess);
    corrupt(response);
    assert.throws(() => parseSandboxExecution(response), SandboxInfrastructureError);
  }
  const noOomEvidence = nativeRunResponse(nativeRunCases.find((example) => example.verdict === "MLE"));
  noOomEvidence.execution_report.run.oom_kill_count = null;
  assert.throws(() => parseSandboxExecution(noOomEvidence), SandboxInfrastructureError);
  const ranAfterCompileError = structuredClone(nativeCompileFailure);
  ranAfterCompileError.run.code = 0;
  assert.throws(() => parseSandboxExecution(ranAfterCompileError), SandboxInfrastructureError);
});

test("legacy sandbox-runner output comparison, compile errors and SIGKILL fallback remain compatible", async (t) => {
  const { db } = await judgeFixture(t);
  const job = await loadJudgeJob(db, 1);
  assert.equal(runVerdict(parseSandboxExecution(execution).run, 1000, 268435456, "ok"), "AC");
  for (const [wall, want] of [[1005, "TLE"], [5, "MLE"]]) {
    const legacy = parseSandboxExecution({ ...execution, run: { ...phase, code: null, signal: "SIGKILL", cpu_time: null, wall_time: wall } });
    assert.equal(runVerdict(legacy.run, 1000, 268435456, "ok"), want);
  }
  for (const code of [124, 139]) {
    assert.equal(runVerdict(parseSandboxExecution({ ...execution, run: { ...phase, code } }).run, 1000, 268435456, "ok"), "RE");
  }
  const legacyCE = parseSandboxExecution({ language: "c++", version: "sandbox-runner-m7", compile: { ...phase, code: 1, stderr: "compiler error" } });
  assert.equal((await evaluateJudgeJob(job, async () => legacyCE)).result.status, "CE");
  assert.throws(() => parseSandboxExecution({ ...execution, run: { ...phase, code: -1 } }), SandboxInfrastructureError);
});

test("remote executor accepts native compiled responses and persists unavailable metrics", { timeout: 20_000 }, async (t) => {
  const c = await coordinator(t);
  const s = await sandbox(t, "native", Promise.resolve(), false, nativeRunResponse(nativeRunCases[0]));
  const worker = remoteWorker(t, c.url, s.url, "native");
  try {
    await until(() => c.seen.some((r) => r.action === "complete" && r.data.outcome === "applied"));
    const submission = await c.db.submission.findUnique({ where: { id: 1 } });
    assert.equal(submission.status, "AC");
    assert.equal(submission.timeMs, 55);
    assert.equal(submission.memoryKb, null);
    assert.equal((await c.db.testResult.findFirst()).memoryKb, null);
  } finally { await worker.kill(); }
});

test("remote startup failure releases the job instead of reporting student RE", { timeout: 20_000 }, async (t) => {
  const c = await coordinator(t);
  const s = await sandbox(t, "bootstrap", Promise.resolve(), false,
    nativeRunResponse(nativeRunCases.find((example) => example.name === "bootstrap failure")));
  const worker = remoteWorker(t, c.url, s.url, "bootstrap");
  try {
    await until(() => c.seen.some((r) => r.action === "fail" && r.data.outcome === "released"));
    assert.ok(!c.seen.some((r) => r.action === "complete"));
    assert.equal((await c.db.submission.findUnique({ where: { id: 1 } })).status, "PENDING");
    assert.equal(await c.db.testResult.count(), 0);
  } finally { await worker.kill(); }
});
