import { test } from "node:test";
import assert from "node:assert/strict";
import { createControlServer } from "../deploy/oj-service-control-server.mjs";
import { createServiceAdminHandler } from "../src/lib/serviceAdmin.ts";
import { accountNavGroups, isNavActive, navLinksFor } from "../src/lib/navLinks.ts";

const request = (query = "", { method = "GET", origin = "http://127.0.0.1", headers = {} } = {}) =>
  new Request(`http://127.0.0.1/api/admin/services${query}`, {
    method, headers: { host: "127.0.0.1", ...(origin ? { origin } : {}), ...headers },
  });
const statuses = [
  { service: "website", state: "active", enabled: true },
  { service: "proxy", state: "active", enabled: true },
  { service: "worker", state: "inactive", enabled: false },
  { service: "sandbox", state: "failed", enabled: true },
  { service: "interactive", state: "active", enabled: true },
];

test("service admin checks the current role before reading or controlling services", async () => {
  let session = null, reads = 0, actions = 0;
  const handle = createServiceAdminHandler({
    getSession: async () => session,
    getStatus: async () => { reads++; return statuses; },
    perform: async () => { actions++; },
  });
  for (session of [null, { role: "USER" }, { role: "admin" }]) {
    assert.equal((await handle(request("", { headers: { "x-role": "ADMIN", "x-judge-worker-secret": "fake" } }))).status, 403);
    assert.equal((await handle(request("?service=worker&action=start", { method: "POST" }))).status, 403);
  }
  assert.equal(reads, 0); assert.equal(actions, 0);
  session = { role: "ADMIN", userId: "admin-id" };
  const response = await handle(request());
  assert.equal(response.status, 200);
  assert.deepEqual((await response.json()).services, statuses);
  assert.match(response.headers.get("cache-control"), /no-store/);
  assert.equal(response.headers.get("vary"), "Cookie");
  session = { role: "USER" };
  assert.equal((await handle(request("?service=worker&action=restart", { method: "POST" }))).status, 403);
  assert.equal(actions, 0);
});

test("service actions require same-origin POST and a fixed service/action pair", async () => {
  const actions = [];
  const handle = createServiceAdminHandler({
    getSession: async () => ({ role: "ADMIN", userId: "admin-id" }),
    getStatus: async () => statuses,
    perform: async (service, action) => { actions.push([service, action]); },
  });
  const worker = "?service=worker&action=start";
  for (const origin of [null, "https://attacker.example", "null"]) {
    assert.equal((await handle(request(worker, { method: "POST", origin }))).status, 403);
  }
  assert.equal((await handle(request(worker, { method: "POST", headers: { "sec-fetch-site": "cross-site" } }))).status, 403);
  for (const query of ["?service=website&action=start", "?service=nginx&action=restart",
    "?service=proxy&action=restart", "?service=proxy&action=stop", "?service=interactive&action=reload",
    "?service=worker&action=stop", "?service=worker.service&action=restart", "?service=worker&action=restart%20sandbox-server.service"]) {
    assert.equal((await handle(request(query, { method: "POST" }))).status, 400);
  }
  assert.equal((await handle(request(worker, { method: "DELETE" }))).status, 405);
  assert.deepEqual(actions, []);
  // HTTPS is terminated at nginx; the internal Next URL can still be HTTP.
  assert.equal((await handle(request(worker, { method: "POST", origin: "https://oj.itousouta.me",
    headers: { host: "oj.itousouta.me", "sec-fetch-site": "same-origin" } }))).status, 200);
  assert.equal((await handle(request(worker, { method: "POST", origin: "http://oj.itousouta.me",
    headers: { host: "oj.itousouta.me" } }))).status, 403);
  assert.equal((await handle(request(worker, { method: "POST" }))).status, 200);
  assert.equal((await handle(request("?service=proxy&action=reload", { method: "POST" }))).status, 200);
  assert.equal((await handle(request("?service=interactive&action=restart", { method: "POST" }))).status, 200);
  assert.equal((await handle(request("?service=sandbox&action=restart", { method: "POST" }))).status, 200);
  assert.equal((await handle(request("?service=website&action=restart", { method: "POST" }))).status, 202);
  assert.deepEqual(actions, [["worker", "start"], ["worker", "start"], ["proxy", "reload"],
    ["interactive", "restart"], ["sandbox", "restart"], ["website", "restart"]]);
});

test("service failures hide privileged command details and navigation is admin-only", async () => {
  const handle = createServiceAdminHandler({
    getSession: async () => ({ role: "ADMIN" }),
    getStatus: async () => { throw new Error("private-systemctl-output"); },
    perform: async () => { throw new Error("private-sudo-error"); },
  });
  for (const response of [await handle(request()), await handle(request("?service=worker&action=start", { method: "POST" }))]) {
    assert.equal(response.status, 503);
    assert.doesNotMatch(await response.text(), /private-/);
  }
  const links = (admin) => accountNavGroups("test", admin).flatMap((group) => group.links);
  assert.ok(links(true).some((link) => link.href === "/admin/services"));
  assert.ok(!links(false).some((link) => link.href === "/admin/services"));
  assert.ok(navLinksFor(true).some((link) => link.href === "/admin/services"));
  assert.ok(!navLinksFor(false).some((link) => link.href === "/admin/services"));
  assert.equal(isNavActive("/admin/services", "/admin/services"), true);
  assert.equal(isNavActive("/admin/services", "/admin/problems"), false);
});

test("the root controller independently rejects arbitrary operations and limits requests", async (t) => {
  const actions = [];
  const server = createControlServer(async (service, action) => {
    actions.push([service, action]);
    if (service === "worker") throw new Error("private-systemctl-error");
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const url = `http://127.0.0.1:${server.address().port}/control`;
  const post = (body) => fetch(url, { method: "POST", body: JSON.stringify(body) });
  assert.equal((await fetch(url)).status, 405);
  for (const body of [
    { service: "website", action: "start" }, { service: "worker", action: "stop" },
    { service: "proxy", action: "restart" }, { service: "nginx.service", action: "reload" },
    { service: "proxy", action: { toString: "reload" } },
  ]) assert.equal((await post(body)).status, 400);
  assert.equal((await fetch(url, { method: "POST", body: "invalid json" })).status, 400);
  assert.equal((await fetch(url, { method: "POST", body: "x".repeat(257) })).status, 413);
  assert.deepEqual(actions, []);
  assert.equal((await post({ service: "proxy", action: "reload" })).status, 200);
  assert.equal((await post({ service: "worker", action: "start" })).status, 503);
  assert.deepEqual(actions, [["proxy", "reload"], ["worker", "start"]]);
});
