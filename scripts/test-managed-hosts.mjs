import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdir, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import Database from "better-sqlite3";
import { createHostRegistry, HOST_OFFLINE_MS } from "../src/lib/hostRegistry.ts";
import { createHostAdminHandler, createHostAgentHandler } from "../src/lib/hostRoutes.ts";
import { createJudgeProtocol } from "../src/lib/judgeProtocol.ts";
import { judgeFixture } from "./lib/judge-test-fixture.mjs";

async function setup(t, count = 0) {
  await mkdir(join(tmpdir(), "opencode"), { recursive: true });
  const fixture = await judgeFixture(t, count);
  const sqlite = new Database(fixture.url.slice(5));
  sqlite.exec(await readFile(new URL("../prisma/migrations/20261020130000_add_managed_hosts/migration.sql", import.meta.url), "utf8"));
  sqlite.close();
  let offset = 0;
  const registry = createHostRegistry(fixture.db, () => new Date(Date.now() + offset));
  return { ...fixture, registry, advance: (ms) => { offset += ms; } };
}

const adminRequest = (body, origin = "http://127.0.0.1") => new Request("http://127.0.0.1/api/admin/hosts", {
  method: "POST", headers: { host: "127.0.0.1", origin, "content-type": "application/json" }, body: JSON.stringify(body),
});
const agentRequest = (token, action, body) => new Request(`http://127.0.0.1/api/internal/hosts?action=${action}`, {
  method: "POST", headers: { "x-judge-worker-secret": token, "content-type": "application/json" }, body: JSON.stringify(body),
});

test("admin enrolment exposes a token once, and demotion/CSRF checks run before storage writes", async (t) => {
  const { db, registry } = await setup(t);
  let session = null;
  const admin = createHostAdminHandler({ getSession: async () => session, registry });
  const create = { action: "create", name: "backup-a", address: "192.0.2.2", role: "BACKUP" };
  assert.equal((await admin(adminRequest(create))).status, 403);
  session = { role: "ADMIN" };
  assert.equal((await admin(adminRequest(create, "https://evil.example"))).status, 403);
  assert.equal((await db.managedHost.count()), 0);
  const response = await admin(adminRequest(create));
  assert.equal(response.status, 201);
  const { host, token } = await response.json();
  assert.match(token, /^ojh_[A-Za-z0-9_-]{43}$/);
  assert.equal(host.name, "backup-a");
  assert.equal((await registry.authenticate(token))?.id, host.id);
  const listing = await (await admin(new Request("http://127.0.0.1/api/admin/hosts"))).json();
  assert.equal(listing.hosts.length, 1);
  assert.doesNotMatch(JSON.stringify(listing), new RegExp(token));
  assert.notEqual((await db.managedHost.findUnique({ where: { id: host.id } })).tokenHash, token);
  assert.equal((await admin(adminRequest(create))).status, 409);
  assert.equal((await admin(adminRequest({ action: "updateDetails", id: host.id, address: "backup.example", role: "PRIMARY" }))).status, 200);
  assert.equal((await registry.list()).hosts[0].role, "PRIMARY");
  const rotated = await (await admin(adminRequest({ action: "rotate", id: host.id }))).json();
  assert.match(rotated.token, /^ojh_[A-Za-z0-9_-]{43}$/);
  assert.equal(await registry.authenticate(token), null);
  assert.equal((await registry.authenticate(rotated.token))?.id, host.id);
  session = { role: "USER" };
  assert.equal((await admin(adminRequest({ action: "setEnabled", id: host.id, enabled: false }))).status, 403);
  assert.ok(await registry.authenticate(rotated.token));
});

test("agent heartbeats, remote command dispatch and acknowledgements are scoped to one host", async (t) => {
  const { registry, advance } = await setup(t);
  const first = await registry.create("host-a", "host-a.example", "PRIMARY");
  const second = await registry.create("host-b", "host-b.example", "BACKUP");
  const agent = createHostAgentHandler({ registry });
  const poll = (token) => agent(agentRequest(token, "poll", { workerState: "active", sandboxState: "active" }));
  assert.equal((await poll("wrong-token")).status, 404);
  assert.equal((await poll(first.token)).status, 200);
  assert.equal((await poll(second.token)).status, 200);
  assert.equal((await registry.list()).hosts.filter((host) => host.online).length, 2);
  advance(HOST_OFFLINE_MS + 1);
  assert.equal((await registry.list()).hosts.filter((host) => host.online).length, 0);

  const command = await registry.command(second.host.id, "sandbox", "restart");
  assert.equal(await registry.command(second.host.id, "sandbox", "restart"), null);
  assert.equal((await poll(first.token)).status, 200);
  const assignment = await (await poll(second.token)).json();
  assert.equal(assignment.command.id, command.id);
  assert.equal(assignment.command.service, "sandbox");
  assert.equal((await agent(agentRequest(first.token, "ack", { commandId: command.id, outcome: "APPLIED" }))).status, 409);
  assert.equal((await agent(agentRequest(second.token, "ack", { commandId: command.id, outcome: "APPLIED" }))).status, 200);
  assert.equal((await agent(agentRequest(second.token, "ack", { commandId: command.id, outcome: "APPLIED" }))).status, 200);
  assert.equal((await registry.list()).hosts.find((host) => host.id === second.host.id).commands[0].state, "APPLIED");

  const restarted = await registry.command(second.host.id, "remote", "restart");
  assert.equal((await (await poll(second.token)).json()).command.id, restarted.id);
  advance(121_000);
  assert.equal((await registry.list()).hosts.find((host) => host.id === second.host.id).commands[0].state, "UNKNOWN");
  assert.ok(await registry.command(second.host.id, "sandbox", "start"), "unknown delivery needs an explicit new command");
  assert.equal((await registry.list()).hosts.find((host) => host.id === second.host.id).commands[1].state, "UNKNOWN");
  assert.equal((await agent(agentRequest(second.token, "ack", { commandId: restarted.id, outcome: "APPLIED" }))).status, 409);
  await registry.setEnabled(second.host.id, false);
  assert.equal((await poll(second.token)).status, 404);
  assert.ok(await registry.authenticate(first.token), "primary remains able to claim after the backup goes offline");
});

test("paired host tokens authorize judge work while disabled and bogus tokens cannot", async (t) => {
  const { db, queues: [queue], registry } = await setup(t);
  const backup = await registry.create("backup", "192.0.2.3", "BACKUP");
  let calls = 0;
  const handler = createJudgeProtocol({ db, queue, secret: () => "legacy-secret",
    authorizeHost: async (token) => !!(await registry.authenticate(token)), work: async () => { calls++; return null; } });
  const request = (token) => new Request("http://127.0.0.1/api/internal/judge?action=work", {
    method: "POST", headers: { "x-judge-worker-secret": token },
  });
  assert.equal((await handler(request(backup.token))).status, 200);
  assert.equal((await handler(request("legacy-secret"))).status, 200);
  assert.equal((await handler(request("invalid"))).status, 404);
  await registry.setEnabled(backup.host.id, false);
  assert.equal((await handler(request(backup.token))).status, 404);
  assert.equal(calls, 2);
});

test("a paired backup reclaims an expired primary lease and fences its old result", async (t) => {
  const { db, queues: [queue], registry } = await setup(t, 1);
  const primary = await registry.create("primary", "192.0.2.1", "PRIMARY");
  const backup = await registry.create("backup", "192.0.2.2", "BACKUP");
  const claims = [];
  const handler = createJudgeProtocol({ db, queue, secret: () => undefined,
    authorizeHost: async (token) => !!(await registry.authenticate(token)),
    work: async () => { await queue.recover(); const claim = await queue.claim(); if (claim) claims.push(claim); return claim?.submissionId ?? null; },
  });
  const work = (token) => handler(new Request("http://127.0.0.1/api/internal/judge?action=work", {
    method: "POST", headers: { "x-judge-worker-secret": token },
  }));
  assert.deepEqual(await (await work(primary.token)).json(), { submissionId: 1, processed: true });
  await db.submission.update({ where: { id: 1 }, data: { judgeClaimedAt: new Date(0) } });
  assert.deepEqual(await (await work(backup.token)).json(), { submissionId: 1, processed: true });
  assert.notEqual(claims[0].claimId, claims[1].claimId);
  assert.equal(await queue.complete(claims[0], { status: "WA" }), "stale");
  assert.equal(await queue.complete(claims[1], { status: "AC" }), "applied");
  assert.equal((await db.submission.findUnique({ where: { id: 1 } })).status, "AC");
});
