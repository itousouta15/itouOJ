import { test, mock, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { acquireExecutionSlot, releaseExecutionSlot } from "../src/lib/runLimit.ts";
import { enforceRateLimit } from "../src/lib/rateLimit.ts";
import { SandboxBusyError } from "../src/lib/sandboxQueue.ts";

let session;
let calls;
let execute;
let userSequence = 0;
const success = {
  language: "c++", version: "10.2.0",
  run: { stdout: "Hello, world!\n", stderr: "", code: 0, signal: null, memory: 1024, cpu_time: 4, wall_time: 5 },
};

mock.module(new URL("../src/lib/auth.ts", import.meta.url).href, {
  namedExports: { getSession: async () => session },
});
mock.module(new URL("../src/lib/execute.ts", import.meta.url).href, {
  namedExports: { execute: async (params) => { calls.push(params); return execute(params); } },
});
mock.module(new URL("../src/lib/terminal.ts", import.meta.url).href, {
  namedExports: { terminalRequest: async (...args) => { calls.push(args); return Response.json({ id: "test-session" }); } },
});

const { POST: run } = await import("../src/app/api/playground/run/route.ts");
const { POST: terminal } = await import("../src/app/api/playground/terminal/route.ts");

beforeEach(() => {
  session = { userId: `playground-test-${++userSequence}`, username: "test", role: "USER" };
  calls = [];
  execute = async () => success;
});

const request = (body = { language: "cpp", code: "int main() {}" }) => new Request("http://localhost/api/playground", {
  method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
});

test("both execution endpoints require a session before starting work", async () => {
  session = null;
  assert.equal((await run(request())).status, 401);
  assert.equal((await terminal(request())).status, 401);
  assert.equal(calls.length, 0);
});

test("invalid requests and UTF-8 payloads over 64 KB never reach the sandbox", async () => {
  for (const body of [
    { language: "java", code: "hello" },
    { language: "constructor", code: "hello" },
    { language: "cpp", code: "" },
    { language: "cpp", code: "喵".repeat(22000) },
    { language: "cpp", code: "hello", input: "喵".repeat(22000) },
  ]) assert.equal((await run(request(body))).status, 400);
  assert.equal((await run(new Request("http://localhost", { method: "POST", body: "{" }))).status, 400);
  assert.equal((await terminal(request({ language: "itoulang", code: "喵(1);" }))).status, 400);
  assert.equal(calls.length, 0);
});

test("free execution accepts empty stdin without a problem and enforces fixed runtime limits", async () => {
  const req = request({ language: "python", code: "print(1)", timeLimitMs: 999999, memoryLimitMb: 999999 });
  const response = await run(req);
  assert.equal(response.status, 200);
  assert.equal(calls[0].stdin, "");
  assert.equal(calls[0].language, "python");
  assert.equal(calls[0].runTimeoutMs, 15000);
  assert.equal(calls[0].runMemoryLimitBytes, 256 * 1024 * 1024);
  assert.equal(calls[0].signal, req.signal);
  assert.deepEqual(await response.json(), {
    stdout: "Hello, world!\n", stderr: "", exitCode: 0, signal: null, killed: false, timeMs: 4, memoryBytes: 1024,
  });
});

test("喵++ runs through the wrapped Node sandbox and preserves custom input", async () => {
  assert.equal((await run(request({ language: "itoulang", code: "字串 文字; 喵getline(喵in, 文字); 喵out << 文字;", input: "hello\n" }))).status, 200);
  assert.equal(calls[0].language, "javascript");
  assert.match(calls[0].code, /runtime\.request/);
  assert.match(calls[0].code, /wasm-transport\.js/);
  assert.match(calls[0].code, /result\.stdout/);
  assert.match(calls[0].code, /喵/);
  assert.equal(calls[0].stdin, "hello\n");
});

test("compilation errors and timed out executions remain program results", async () => {
  execute = async () => ({ ...success, compile: { code: 1, stderr: "syntax error", output: "" } });
  assert.deepEqual(await (await run(request())).json(), { compileError: "syntax error" });
  execute = async () => ({ ...success, run: {
    ...success.run, stdout: "x".repeat(33000), stderr: "error", code: null, signal: "SIGKILL", cpu_time: null,
  } });
  const response = await run(request());
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.equal(result.killed, true);
  assert.equal(result.exitCode, null);
  assert.equal(result.timeMs, 5);
  assert.ok(result.stdout.length < 33000);
  assert.match(result.stdout, /已截斷/);
  assert.equal(result.stderr, "error");
});

test("problem tests and playground runs share per-user and global execution slots", async () => {
  const key = `user:${session.userId}`;
  assert.ok(acquireExecutionSlot(key, 1));
  try { assert.equal((await run(request())).status, 429); }
  finally { releaseExecutionSlot(key); }
  for (let i = 0; i < 4; i++) assert.ok(acquireExecutionSlot("global", 4));
  try {
    assert.equal((await run(request())).status, 503);
    assert.ok(acquireExecutionSlot(key, 1), "a rejected global slot must release the user slot");
    releaseExecutionSlot(key);
  } finally { for (let i = 0; i < 4; i++) releaseExecutionSlot("global"); }
  assert.equal((await run(request())).status, 200);
});

test("sandbox failures release execution slots for the next attempt", async () => {
  execute = async () => { throw new SandboxBusyError(); };
  assert.equal((await run(request())).status, 503);
  execute = async () => { throw new Error("sandbox offline"); };
  const response = await run(request());
  assert.equal(response.status, 502);
  assert.doesNotMatch(JSON.stringify(await response.json()), /sandbox offline/);
  execute = async () => success;
  assert.equal((await run(request())).status, 200);
});

test("playground endpoints share the existing run and terminal rate limits", async () => {
  for (let i = 0; i < 12; i++) {
    enforceRateLimit(`run:${session.userId}`, 12, 60000);
    enforceRateLimit(`terminal-start:${session.userId}`, 12, 60000);
  }
  const response = await run(request());
  assert.equal(response.status, 429);
  assert.ok(Number(response.headers.get("Retry-After")) > 0);
  assert.equal((await terminal(request())).status, 429);
  assert.equal(calls.length, 0);
});

test("interactive execution forwards authenticated ownership and fixed limits", async () => {
  assert.equal((await terminal(request({ language: "javascript", code: "console.log(1)", userId: "other", cpuMs: 999999 }))).status, 200);
  const [owner, path, init] = calls[0];
  assert.equal(owner, session.userId);
  assert.equal(path, "/sessions");
  assert.deepEqual(JSON.parse(init.body), { language: "javascript", code: "console.log(1)", memoryMb: 512, cpuMs: 15000 });
});
