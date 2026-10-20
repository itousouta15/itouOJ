// This file is installed root-owned outside the website's writable app tree.
import { execFile } from "node:child_process";
import { createServer } from "node:http";
import { chmodSync, readFileSync, renameSync, unlinkSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const run = promisify(execFile);
const socketPath = "/run/oj-service-control/control.sock";
const deployState = "/var/lib/oj-git-deploy";
const revisionPattern = /^[a-f0-9]{40}$/;
const allowed = new Set([
  "website:restart", "proxy:start", "proxy:reload", "worker:start", "worker:restart",
  "sandbox:start", "sandbox:restart", "interactive:start", "interactive:restart",
  "remote:start", "remote:restart",
]);

export function createControlServer(perform, deployment) {
  return createServer(async (request, response) => {
    const reply = (status, body) => {
      response.writeHead(status, { "Cache-Control": "no-store", "Content-Type": "application/json" });
      response.end(JSON.stringify(body ?? {}));
    };
    if (request.url === "/deployment") {
      if (!deployment) return reply(404);
      try {
        if (request.method === "GET") return reply(200, await deployment.status());
        if (request.method === "POST") { await deployment.start(); return reply(202, { queued: true }); }
      } catch (error) {
        console.error(JSON.stringify({ event: "deploy.control_failed", error: error instanceof Error ? error.name : "Unknown" }));
        return reply(503, { error: "Deployment controller unavailable" });
      }
      return reply(405);
    }
    if (request.method !== "POST" || request.url !== "/control") return reply(405);
    let size = 0;
    const chunks = [];
    try {
      for await (const chunk of request) {
        size += chunk.length;
        if (size > 256) return reply(413);
        chunks.push(chunk);
      }
      let body;
      try { body = JSON.parse(Buffer.concat(chunks).toString("utf8")); }
      catch { return reply(400); }
      if (!body || typeof body.service !== "string" || typeof body.action !== "string" ||
        !allowed.has(`${body.service}:${body.action}`)) return reply(400);
      await perform(body.service, body.action);
      console.info(JSON.stringify({ event: "control.applied", service: body.service, action: body.action }));
      reply(200);
    } catch (error) {
      console.error(JSON.stringify({ event: "control.failed", error: error instanceof Error ? error.name : "Unknown",
        code: error?.code }));
      reply(503);
    }
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  let latest = { revision: null, checkedAt: 0 };
  let pendingCheck;
  async function githubRevision() {
    if (Date.now() - latest.checkedAt < 60_000) return latest.revision;
    pendingCheck ??= (async () => {
      try {
        const { stdout } = await run("/usr/bin/git", ["ls-remote", "https://github.com/itousouta15/itouOJ.git", "refs/heads/master"],
          { timeout: 12_000, maxBuffer: 4096 });
        const revision = stdout.split(/\s+/)[0];
        latest = { revision: revisionPattern.test(revision) ? revision : null, checkedAt: Date.now() };
      } catch { latest = { revision: null, checkedAt: Date.now() }; }
      finally { pendingCheck = undefined; }
      return latest.revision;
    })();
    return pendingCheck;
  }
  const deployment = {
    async status() {
      let deployed = null, job = { state: "idle" };
      try { const value = readFileSync(`${deployState}/revision`, "utf8").trim(); if (revisionPattern.test(value)) deployed = value; }
      catch { /* Initial bootstrap has not installed a revision marker. */ }
      try { job = JSON.parse(readFileSync(`${deployState}/status.json`, "utf8")); }
      catch { /* There has been no queued deployment yet. */ }
      if (["queued", "running"].includes(job.state) &&
        Date.now() - Date.parse(job.updatedAt ?? job.startedAt) > 2 * 60 * 60_000) {
        job = { ...job, state: "interrupted", message: "部署等候或執行逾時，請查看 GitHub Actions 紀錄。" };
      }
      return { deployed, latest: await githubRevision(), job };
    },
    async start() {
      const { deployed, latest: available, job } = await this.status();
      if (!deployed || !available || deployed === available || ["queued", "running"].includes(job.state)) {
        throw new Error("No newer release available");
      }
      const queued = { state: "queued", phase: "queued", target: available, startedAt: new Date().toISOString() };
      writeFileSync(`${deployState}/status.next`, JSON.stringify(queued), { mode: 0o600 });
      renameSync(`${deployState}/status.next`, `${deployState}/status.json`);
    },
  };
  const server = createControlServer(async (service, action) => {
    await run("/usr/local/sbin/oj-service-control", [service, action], { timeout: 50_000, maxBuffer: 1024 });
  }, deployment);
  // RuntimeDirectory belongs to root:oj and is not writable by the website.
  // Only the oj group can connect; never open a TCP listener for this protocol.
  try { unlinkSync(socketPath); }
  catch (error) { if (error.code !== "ENOENT") throw error; }
  server.listen(socketPath, () => {
    chmodSync(socketPath, 0o660);
    console.info(JSON.stringify({ event: "control.ready" }));
  });
}
