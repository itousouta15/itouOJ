import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createControlServer } from "../deploy/oj-service-control-server.mjs";
import { createDeployJobStore } from "../deploy/oj-deploy-job.mjs";
import { createDeploymentAdminHandler } from "../src/lib/deploymentAdmin.ts";
import { accountNavGroups, navLinksFor } from "../src/lib/navLinks.ts";

const request = (method = "GET", origin = "http://127.0.0.1") => new Request("http://127.0.0.1/api/admin/deployment", {
  method, headers: { host: "127.0.0.1", ...(origin ? { origin } : {}) },
});

test("only current admins may see versions or start a same-origin deployment", async () => {
  let session = null, reads = 0, starts = 0;
  const handler = createDeploymentAdminHandler({ getSession: async () => session,
    getStatus: async () => { reads++; return { deployed: "a".repeat(40), latest: "b".repeat(40), job: { state: "idle" } }; },
    start: async () => { starts++; return { deployed: null, latest: null, job: { state: "queued" } }; },
  });
  for (session of [null, { role: "USER" }]) {
    assert.equal((await handler(request())).status, 403);
    assert.equal((await handler(request("POST"))).status, 403);
  }
  assert.equal(reads, 0); assert.equal(starts, 0);
  session = { role: "ADMIN" };
  const result = await handler(request());
  assert.equal(result.status, 200);
  assert.equal((await result.json()).latest, "b".repeat(40));
  assert.match(result.headers.get("cache-control"), /no-store/);
  assert.equal(result.headers.get("vary"), "Cookie");
  for (const origin of [null, "https://attacker.example"]) {
    assert.equal((await handler(request("POST", origin))).status, 403);
  }
  assert.equal((await handler(request("PUT"))).status, 405);
  assert.equal(starts, 0);
  assert.equal((await handler(request("POST"))).status, 202);
  assert.equal(starts, 1);
  session = { role: "USER" };
  assert.equal((await handler(request("POST"))).status, 403);
  assert.equal(starts, 1);
});

test("deployment route never returns controller error details, and navigation is admin-only", async () => {
  const handler = createDeploymentAdminHandler({ getSession: async () => ({ role: "ADMIN" }),
    getStatus: async () => { throw new Error("private-token"); },
    start: async () => { throw new Error("private-unit-output"); },
  });
  for (const response of [await handler(request()), await handler(request("POST"))]) {
    assert.equal(response.status, 503);
    assert.doesNotMatch(await response.text(), /private-/);
  }
  const links = (admin) => accountNavGroups("test", admin).flatMap((group) => group.links);
  assert.ok(links(true).some((link) => link.href === "/admin/deployment"));
  assert.ok(!links(false).some((link) => link.href === "/admin/deployment"));
  assert.ok(navLinksFor(true).some((link) => link.href === "/admin/deployment"));
});

test("local controller dispatches only its fixed deployment endpoint", async (t) => {
  let starts = 0;
  const server = createControlServer(async () => { throw new Error("service not used"); }, {
    status: async () => ({ deployed: "a".repeat(40), latest: "b".repeat(40), job: { state: "idle" } }),
    start: async () => { starts++; },
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  assert.equal((await (await fetch(`${base}/deployment`)).json()).deployed, "a".repeat(40));
  assert.equal((await fetch(`${base}/deployment?revision=malicious`, { method: "POST" })).status, 405);
  assert.equal(starts, 0);
  assert.equal((await fetch(`${base}/deployment`, { method: "POST" })).status, 202);
  assert.equal(starts, 1);
});

test("durable deployment claim is single-use, pinned and cannot succeed before marker verification", async (t) => {
  const parent = join(tmpdir(), "opencode");
  await mkdir(parent, { recursive: true });
  const directory = await mkdtemp(join(parent, "deploy-queue-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const store = createDeployJobStore(directory);
  const commit = "a".repeat(40), other = "b".repeat(40);
  assert.equal(store.claim(), null);
  await writeFile(join(directory, "status.json"), JSON.stringify({ state: "queued", target: commit }));
  assert.equal(store.claim(), commit);
  assert.equal(store.claim(), null);
  assert.equal(store.verify(other), false);
  assert.equal(store.verify(commit), true);
  assert.equal(store.phase(commit, "arbitrary"), false);
  assert.equal(store.phase(commit, "packaging"), true);
  assert.equal(store.finish(commit), false, "a completed build must match the installed revision");
  await writeFile(join(directory, "revision"), commit);
  assert.equal(store.finish(commit), true);
  assert.equal(store.fail(commit), false, "a late failure cannot overwrite a successful deploy");
  assert.equal(JSON.parse(await readFile(join(directory, "status.json"), "utf8")).state, "succeeded");
  await writeFile(join(directory, "status.json"), JSON.stringify({ state: "queued", target: other }));
  assert.equal(store.claim(), other);
  assert.equal(store.fail(other), true);
  assert.equal(JSON.parse(await readFile(join(directory, "status.json"), "utf8")).state, "failed");
});
