import { test } from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { createServer } from "node:http";
import { spawn } from "node:child_process";

test("real host agent polls with its pairing token and rejects a non-allowlisted command", async (t) => {
  const token = `ojh_${randomBytes(32).toString("base64url")}`;
  let polls = 0;
  let acknowledged;
  const acked = new Promise((resolve) => { acknowledged = resolve; });
  const server = createServer(async (req, res) => {
    assert.equal(req.headers["x-judge-worker-secret"], token);
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const body = JSON.parse(Buffer.concat(chunks).toString());
    const action = new URL(req.url, "http://127.0.0.1").searchParams.get("action");
    res.setHeader("content-type", "application/json");
    if (action === "poll") {
      polls++;
      assert.equal(typeof body.workerState, "string");
      assert.equal(typeof body.sandboxState, "string");
      res.end(JSON.stringify({ command: { id: 1, service: "arbitrary", action: "restart" } }));
    } else {
      assert.equal(action, "ack");
      assert.deepEqual(body, { commandId: 1, outcome: "FAILED" });
      acknowledged();
      res.end('{"ok":true}');
    }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const child = spawn(process.execPath, ["scripts/host-agent.mjs"], {
    cwd: process.cwd(), env: { ...process.env, JUDGE_WORKER_URL: `http://127.0.0.1:${server.address().port}`,
      JUDGE_WORKER_SECRET: token }, stdio: "ignore",
  });
  t.after(async () => {
    child.kill("SIGTERM");
    await new Promise((resolve) => { if (child.exitCode !== null || child.signalCode !== null) resolve(); else child.once("exit", resolve); });
    await new Promise((resolve) => server.close(resolve));
  });
  let timer;
  try { await Promise.race([acked, new Promise((_, reject) => { timer = setTimeout(() => reject(new Error("host agent did not acknowledge")), 18_000); })]); }
  finally { clearTimeout(timer); }
  assert.ok(polls >= 1);
});
