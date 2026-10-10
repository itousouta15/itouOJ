// Opt-in only. Real coordinator protocol + isolated SQLite + real remote Node
// processes + two native sibling C sandboxes in private WSL cgroups.
import assert from "node:assert/strict";
import { spawn, execFileSync } from "node:child_process";
import { createServer } from "node:http";
import { createInterface } from "node:readline";
import { Readable } from "node:stream";
import { randomBytes } from "node:crypto";
import { dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { stat, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { createJudgeProtocol } from "../src/lib/judgeProtocol.ts";
import { parseSandboxExecution } from "../src/lib/sandboxProtocol.ts";
import { judgeFixture } from "./lib/judge-test-fixture.mjs";

const { values } = parseArgs({ options: {
  run: { type: "boolean", default: false }, distro: { type: "string", default: "Ubuntu-24.04" },
  "sandbox-source": { type: "string" }, deps: { type: "string" }, report: { type: "string" },
} });
const root = fileURLToPath(new URL("../", import.meta.url));
const parent = join(tmpdir(), "opencode");
const stop = new AbortController();
const sleep = (ms) => new Promise((done) => setTimeout(done, ms));
async function until(predicate, description, timeout = 60_000, cleanup = false) {
  const deadline = Date.now() + timeout;
  for (;;) {
    if (!cleanup) stop.signal.throwIfAborted();
    const result = await predicate();
    if (result) return result;
    if (Date.now() >= deadline) throw new Error(`Timed out: ${description}`);
    await sleep(50);
  }
}
function environment() {
  const env = {};
  for (const key of ["PATH", "SystemRoot", "WINDIR", "COMSPEC", "TEMP", "TMP", "USERPROFILE", "LOCALAPPDATA", "APPDATA", "HOME"]) {
    if (process.env[key]) env[key] = process.env[key];
  }
  return env;
}
function wslPath(path) {
  return execFileSync("wsl.exe", ["-d", values.distro, "-u", "root", "--exec", "wslpath", "-a", "-u", resolve(path)], {
    encoding: "utf8", env: environment(), timeout: 60_000,
  }).trim();
}
function startNative() {
  const source = resolve(values["sandbox-source"] ?? join(root, "../itouSandbox"));
  const deps = resolve(values.deps ?? join(parent, "itou-observe-deps/usr"));
  const child = spawn("wsl.exe", ["-d", values.distro, "-u", "root", "--exec", "env", "-i",
    "PATH=/usr/local/bin:/usr/bin:/bin", "LC_ALL=C.UTF-8", "PYTHONDONTWRITEBYTECODE=1",
    "unshare", "--mount", "--propagation", "private", "--", "python3", "-B",
    wslPath(join(root, "scripts/lib/judge-native-staging.py")), "--source", wslPath(source),
    "--scratch-parent", wslPath(parent), "--deps", wslPath(deps)], {
    cwd: root, env: environment(), stdio: ["pipe", "pipe", "pipe"],
  });
  const events = [];
  let stderr = "", failure, exited = false, sequence = 0;
  child.stderr.on("data", (data) => { stderr = (stderr + data).slice(-20_000); });
  child.on("error", (error) => { failure = error; });
  child.stdin.on("error", (error) => { failure = error; });
  child.on("exit", () => { exited = true; });
  const lines = createInterface({ input: child.stdout });
  lines.on("line", (line) => {
    try { events.push(JSON.parse(line)); }
    catch { failure = new Error("Invalid native lifecycle response"); }
  });
  const event = async (name, id, cleanup = false, timeout = 30_000) => until(() => {
    const index = events.findIndex((row) => row.event === name && (id === undefined || row.id === id));
    if (index >= 0) return events.splice(index, 1)[0];
    if (failure || exited) throw new Error(`Native lifecycle ended before ${name}: ${failure?.message ?? ""}\n${stderr}`);
    return null;
  }, `native ${name}`, timeout, cleanup);
  return {
    ready: () => event("ready", undefined, false, 180_000),
    async probe() {
      const id = ++sequence;
      child.stdin.write(JSON.stringify({ action: "probe", id }) + "\n");
      return (await event("probe", id)).servers;
    },
    async close() {
      if (!exited && !child.stdin.destroyed) child.stdin.end('{"action":"stop"}\n');
      const result = await event("cleanup", undefined, true, 60_000);
      await until(() => exited, "native helper exit", 20_000, true);
      lines.close();
      assert.equal(result.privateCgroupRemoved, true, stderr);
      assert.equal(result.scratchRemoved, true, stderr);
      assert.equal(result.privateMountRemoved, true, stderr);
      assert.equal(result.serversReaped, true, stderr);
      assert.deepEqual(result.errors, []);
      return result;
    },
  };
}

const delayedC = '#include <stdio.h>\n#include <time.h>\nint main(void){struct timespec t={4,0};if(clock_nanosleep(CLOCK_MONOTONIC,0,&t,0))return 2;puts("ok");}';
const corpus = [
  { name: "C stdin AC", language: "c", code: '#include <stdio.h>\nint main(void){int a,b;if(scanf("%d%d",&a,&b)!=2)return 2;printf("%d\\n",a+b);}', input: "20 22\n", output: "42\n", want: "AC" },
  { name: "C++ AC", language: "cpp", code: '#include <iostream>\nint main(){std::cout << 42 << "\\n";}', output: "42\n", want: "AC" },
  { name: "WA", code: '#include <stdio.h>\nint main(void){puts("wrong");}', output: "ok", want: "WA" },
  { name: "CE", code: "not valid C", want: "CE" },
  { name: "TLE", code: 'int main(void){for(;;){__asm__ volatile("");}}', timeLimitMs: 150, want: "TLE" },
  { name: "ordinary exit 124", code: "int main(void){return 124;}", want: "RE" },
  { name: "ordinary exit 139", code: "int main(void){return 139;}", want: "RE" },
  { name: "SIGSEGV", code: "#include <sys/mman.h>\nint main(void){void *p=mmap(0,4096,PROT_NONE,MAP_PRIVATE|MAP_ANONYMOUS,-1,0);if(p==MAP_FAILED)return 2;*(volatile char *)p=1;}", want: "RE" },
  { name: "MLE", code: "#include <stdlib.h>\nint main(void){volatile char *p=malloc(128*1024*1024);if(!p)return 2;for(int i=0;i<128*1024*1024;i+=4096)p[i]=1;return p[0];}", memoryLimitMb: 32, timeLimitMs: 2000, want: "MLE" },
];

async function staging() {
  if (process.platform !== "win32") throw new Error("This launcher requires Windows Node plus WSL; see docs/judge-reliability.md");
  assert.ok((await stat(parent)).isDirectory(), "Existing isolated temporary parent required");
  if (values.report) assert.ok((await stat(dirname(resolve(values.report)))).isDirectory(), "Report parent must already exist");
  const startedAt = Date.now();
  const secret = randomBytes(32).toString("hex");
  const workers = new Set(), handlers = new Set(), seen = [], results = [];
  let native, fixtureCleanup, http, db, cleanupEvidence;
  const stopWorker = async (worker) => {
    if (!worker.exited) worker.child.kill("SIGKILL");
    await until(() => worker.exited, "owned worker exit", 15_000, true);
    workers.delete(worker);
  };
  const worker = (url, sandboxUrl, id) => {
    const child = spawn(process.execPath, ["--import", "./scripts/ctf-test-loader.mjs", "scripts/judge-remote-worker.mjs"], {
      cwd: root, env: { ...environment(), NODE_ENV: "test", JUDGE_WORKER_URL: url, SANDBOX_URL: sandboxUrl,
        JUDGE_WORKER_SECRET: secret, JUDGE_WORKER_ID: id, DATABASE_URL: "file:/staging-worker-must-not-open-a-database/absent.db" },
      stdio: ["ignore", "pipe", "pipe"],
    });
    const entry = { child, exited: false, logs: "" };
    const log = (data) => { entry.logs = (entry.logs + data).slice(-20_000); };
    child.stdout.on("data", log); child.stderr.on("data", log);
    child.on("error", (error) => { log(error.message); entry.exited = true; });
    child.on("exit", () => { entry.exited = true; });
    workers.add(entry);
    return entry;
  };
  try {
    native = startNative();
    const ready = await native.ready();
    assert.equal(ready.urls.length, 2); assert.notEqual(ready.urls[0], ready.urls[1]);
    console.info(JSON.stringify({ event: "staging.native.ready", sandboxes: ready.urls }));
    // Fixed-program preflight confirms Windows->WSL forwarding reaches a native
    // executor before any remote worker is launched; failures retain stage data.
    for (const url of ready.urls) {
      // WSL publishes newly bound loopback ports asynchronously. Probe with GET
      // (the native server returns 405) before posting any execution request.
      await until(async () => {
        let response;
        try { response = await fetch(`${url}/api/v2/execute`, { redirect: "error", signal: AbortSignal.timeout(1000) }); }
        catch { return false; }
        await response.body?.cancel();
        assert.equal(response.status, 405, "unexpected service on private native port");
        return true;
      }, "WSL loopback forwarding", 20_000);
      const response = await fetch(`${url}/api/v2/execute`, { method: "POST", redirect: "error", signal: AbortSignal.timeout(30_000),
        headers: { "content-type": "application/json" }, body: JSON.stringify({ language: "c", files: [{ content: '#include <stdio.h>\nint main(void){puts("staging-native-ready");}' }],
          run_timeout: 1000, run_memory_limit: 67108864 }) });
      assert.equal(response.status, 200);
      const raw = await response.json();
      let execution;
      try { execution = parseSandboxExecution(raw); }
      catch (error) { throw new Error(`Native preflight failed: ${JSON.stringify(raw.execution_report)}; ${raw.compile?.stderr ?? ""}; ${error.message}`); }
      assert.equal(execution.run.stdout, "staging-native-ready\n");
      assert.equal(execution.execution_report?.schema_version, 1);
    }
    const fixture = await judgeFixture({ after: (fn) => { fixtureCleanup = fn; } }, 0, {
      realtime: true, timing: { leaseMs: 3000, heartbeatMs: 250 },
    });
    db = fixture.db;
    const queue = fixture.queues[0];
    const protocol = createJudgeProtocol({ db, queue, secret: () => secret });
    http = createServer((req, res) => {
      const pending = (async () => {
        try {
          const request = new Request(`http://127.0.0.1${req.url}`, { method: req.method, headers: req.headers,
            body: Readable.toWeb(req), duplex: "half" });
          const action = new URL(request.url).searchParams.get("action");
          const body = await request.clone().json();
          const response = await protocol(request);
          const data = await response.json();
          seen.push({ action, body, data, status: response.status, at: Date.now() });
          res.writeHead(response.status, Object.fromEntries(response.headers)); res.end(JSON.stringify(data));
        } catch { res.writeHead(500); res.end(); }
      })();
      handlers.add(pending); void pending.finally(() => handlers.delete(pending));
    });
    await new Promise((resolve, reject) => { http.once("error", reject); http.listen(0, "127.0.0.1", resolve); });
    const coordinatorUrl = `http://127.0.0.1:${http.address().port}`;
    let nextId = 10;
    async function seed(example) {
      const id = nextId++;
      await db.$executeRaw`INSERT INTO Problem (id,timeLimitMs,memoryLimitMb) VALUES (${id},${example.timeLimitMs ?? 1000},${example.memoryLimitMb ?? 64})`;
      await db.$executeRaw`INSERT INTO TestCase (id,problemId,input,output) VALUES (${id},${id},${example.input ?? ""},${example.output ?? ""})`;
      await db.$executeRaw`INSERT INTO Submission (id,userId,problemId,language,code,createdAt) VALUES (${id},'staging',${id},${example.language ?? "c"},${example.code},${new Date().toISOString()})`;
      return id;
    }
    async function finished(id, want, name) {
      const row = await until(async () => {
        const row = await db.submission.findUnique({ where: { id } });
        if (!row || ["PENDING", "JUDGING"].includes(row.status)) return null;
        return row;
      }, `${name} completion`);
      assert.equal(row.status, want, `${name}: ${row.compileError ?? ""}`);
      assert.equal(await db.testResult.count({ where: { submissionId: id } }), want === "CE" ? 0 : 1);
      results.push({ name, submissionId: id, status: row.status, timeMs: row.timeMs, memoryKb: row.memoryKb });
      console.info(JSON.stringify({ event: "staging.case.passed", name, verdict: row.status }));
      return row;
    }
    const first = await seed({ code: delayedC, output: "ok", timeLimitMs: 6000 });
    const second = await seed({ code: delayedC, output: "ok", timeLimitMs: 6000, language: "cpp" });
    const a = worker(coordinatorUrl, ready.urls[0], "native-A"), b = worker(coordinatorUrl, ready.urls[1], "native-B");
    await until(async () => (await native.probe()).every((row) => row.alive && row.activeRuns > 0), "two simultaneous native jailed runs");
    await Promise.all([finished(first, "AC", "parallel C / heartbeat"), finished(second, "AC", "parallel C++ / heartbeat")]);
    for (const id of [first, second]) {
      const assigned = seen.find((r) => r.action === "claim" && r.data.claim?.submissionId === id);
      const completed = seen.find((r) => r.action === "complete" && r.body.submissionId === id && r.status === 200);
      assert.ok(completed.at - assigned.at > queue.timing.leaseMs, "real job must outlive its initial lease");
      assert.ok(seen.some((r) => r.action === "heartbeat" && r.body.submissionId === id && r.status === 200));
    }
    await stopWorker(b);
    for (const example of corpus) await finished(await seed(example), example.want, example.name);
    await stopWorker(a);

    const recoverId = await seed({ code: delayedC, output: "ok", timeLimitMs: 6000 });
    const doomed = worker(coordinatorUrl, ready.urls[0], "native-killed");
    await until(async () => (await native.probe())[0].activeRuns > 0, "native execution before worker death");
    const original = seen.find((r) => r.action === "claim" && r.data.claim?.submissionId === recoverId).data;
    await stopWorker(doomed);
    await until(async () => (await queue.status()).expired === 1, "dead worker lease expiry", 15_000);
    const replacement = worker(coordinatorUrl, ready.urls[1], "native-replacement");
    await finished(recoverId, "AC", "killed worker recovery");
    await stopWorker(replacement);
    const winning = seen.find((r) => r.action === "complete" && r.body.submissionId === recoverId && r.status === 200);
    assert.notEqual(winning.body.claimId, original.claim.claimId);
    const stale = await fetch(`${coordinatorUrl}/api/internal/judge?action=complete`, { method: "POST", redirect: "error",
      signal: AbortSignal.timeout(10_000), headers: { "content-type": "application/json", "x-judge-worker-secret": secret },
      body: JSON.stringify({ ...winning.body, ...original.claim }) });
    assert.equal(stale.status, 409); await stale.body?.cancel();
    assert.equal(await db.testResult.count({ where: { submissionId: recoverId } }), 1);
    await until(async () => (await native.probe()).every((row) => row.alive && row.runGroups === 0 && row.workdirs === 0), "native per-request cleanup");
    const status = await queue.status();
    assert.equal(status.pending, 0); assert.equal(status.judging, 0);
  } catch (error) {
    for (const owned of workers) console.error(owned.logs);
    throw error;
  } finally {
    const failures = [];
    for (const owned of [...workers]) try { await stopWorker(owned); } catch (error) { failures.push(error); }
    if (http) {
      http.closeAllConnections();
      await new Promise((resolve) => http.close(resolve));
      await Promise.allSettled(handlers);
    }
    try { await fixtureCleanup?.(); } catch (error) { failures.push(error); }
    try { cleanupEvidence = await native?.close(); } catch (error) { failures.push(error); }
    if (failures.length) throw new AggregateError(failures, "Staging cleanup failed");
    if (cleanupEvidence) console.info(JSON.stringify({ ...cleanupEvidence, event: "staging.cleanup" }));
  }
  const report = { event: "staging.passed", nativeSandboxes: 2, realRemoteProcesses: 4,
    concurrentNativeRuns: true, heartbeatBeyondLease: true, killedWorkerRecovered: true,
    staleCompletionFenced: true, results, cleanup: { ...cleanupEvidence, databaseRemoved: true, remoteWorkersReaped: true },
    elapsedMs: Date.now() - startedAt };
  if (values.report) await writeFile(resolve(values.report), JSON.stringify(report, null, 2) + "\n", { flag: "wx" });
  console.info(JSON.stringify(report));
}

if (!values.run) {
  console.info("Opt-in native staging: npm run test:judge:staging -- --run [--distro Ubuntu-24.04] [--sandbox-source ../itouSandbox] [--deps <dependency-prefix>] [--report <new-file>]");
} else {
  const interrupt = () => stop.abort(new Error("Staging interrupted"));
  process.once("SIGINT", interrupt); process.once("SIGTERM", interrupt);
  const watchdog = setTimeout(() => stop.abort(new Error("Staging exceeded ten minutes")), 10 * 60_000);
  try { await staging(); }
  catch (error) { console.error(error); process.exitCode = 1; }
  finally { clearTimeout(watchdog); process.removeListener("SIGINT", interrupt); process.removeListener("SIGTERM", interrupt); }
}
