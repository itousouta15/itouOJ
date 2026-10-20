// This file is installed root-owned outside the website's writable app tree.
import { execFile } from "node:child_process";
import { createServer } from "node:http";
import { chmodSync, unlinkSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const run = promisify(execFile);
const socketPath = "/run/oj-service-control/control.sock";
const allowed = new Set([
  "website:restart", "proxy:start", "proxy:reload", "worker:start", "worker:restart",
  "sandbox:start", "sandbox:restart", "interactive:start", "interactive:restart",
]);

export function createControlServer(perform) {
  return createServer(async (request, response) => {
    const reply = (status) => { response.writeHead(status, { "Cache-Control": "no-store" }); response.end(); };
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
  const server = createControlServer(async (service, action) => {
    await run("/usr/local/sbin/oj-service-control", [service, action], { timeout: 50_000, maxBuffer: 1024 });
  });
  // RuntimeDirectory belongs to root:oj and is not writable by the website.
  // Only the oj group can connect; never open a TCP listener for this protocol.
  try { unlinkSync(socketPath); }
  catch (error) { if (error.code !== "ENOENT") throw error; }
  server.listen(socketPath, () => {
    chmodSync(socketPath, 0o660);
    console.info(JSON.stringify({ event: "control.ready" }));
  });
}
