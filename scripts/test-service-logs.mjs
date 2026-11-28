import assert from "node:assert/strict";
import { once } from "node:events";
import test from "node:test";
import { createControlServer, readServiceLog } from "../deploy/oj-service-control-server.mjs";
import { createServiceLogsHandler } from "../src/lib/serviceLogs.ts";

test("log reader limits journalctl to a fixed unit and removes sensitive lines and metadata", async () => {
  const fixture = [
    { __REALTIME_TIMESTAMP: "1783000000000000", PRIORITY: "6", MESSAGE: "worker ready", _CMDLINE: "private metadata" },
    { __REALTIME_TIMESTAMP: "1783000001000000", PRIORITY: "3", MESSAGE: "Authorization: Bearer internal-value" },
    { __REALTIME_TIMESTAMP: "1783000002000000", PRIORITY: "4", MESSAGE: "a".repeat(3000) },
  ].map((record) => JSON.stringify(record)).join("\n");
  const rows = await readServiceLog("worker", async (file, args, options) => {
    assert.equal(file, "/usr/bin/journalctl");
    assert.deepEqual(args.filter((arg) => arg.startsWith("--unit=")), ["--unit=online-judge-worker.service"]);
    assert.ok(args.includes("--lines=100"));
    assert.ok(options.timeout < 5000);
    return { stdout: fixture };
  });
  assert.deepEqual(rows[0], { timestamp: 1783000000000, priority: 6, message: "worker ready" });
  assert.doesNotMatch(JSON.stringify(rows), /internal-value|private metadata/);
  assert.equal(rows[2].message.length, 2000);
  await assert.rejects(() => readServiceLog("sshd", async () => assert.fail("must not invoke journalctl")));
});

test("controller accepts only fixed log sources via GET", async () => {
  const server = createControlServer(async () => assert.fail("must not run a control action"), null, async (source) => {
    assert.equal(source, "admin");
    return [];
  }).listen(0, "127.0.0.1");
  try {
    await once(server, "listening");
    const origin = `http://127.0.0.1:${server.address().port}`;
    assert.equal((await fetch(`${origin}/logs/sshd`)).status, 404);
    assert.equal((await fetch(`${origin}/logs/admin`, { method: "POST" })).status, 405);
    assert.deepEqual(await (await fetch(`${origin}/logs/admin`)).json(), { entries: [] });
  } finally { server.close(); }
});

test("admin API denies unauthorized and invalid reads before accessing the controller", async () => {
  const request = (key) => new Request(`http://localhost/api/admin/services/logs?service=${key}`);
  for (const session of [null, { role: "USER" }]) {
    const handler = createServiceLogsHandler(async () => session, async () => assert.fail("must not read logs"));
    assert.equal((await handler(request("website"))).status, 403);
  }
  const handler = createServiceLogsHandler(async () => ({ role: "ADMIN" }), async (source) => {
    assert.equal(source, "website");
    return { entries: [] };
  });
  assert.equal((await handler(request("sshd"))).status, 400);
  const response = await handler(request("website"));
  assert.deepEqual(await response.json(), { entries: [] });
  assert.match(response.headers.get("cache-control"), /no-store/);
});
