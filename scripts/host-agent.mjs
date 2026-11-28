// Outbound-only host agent. The separate remote judge executor uses the same
// pairing token to claim jobs and a local sandbox for execution.
import { execFile } from "node:child_process";
import { request as httpRequest } from "node:http";
import { promisify } from "node:util";
import { judgeCoordinatorEndpoint } from "../src/lib/judgeCoordinatorUrl.mjs";

const run = promisify(execFile);
const coordinator = judgeCoordinatorEndpoint(process.env.JUDGE_WORKER_URL ?? "");
const token = process.env.JUDGE_WORKER_SECRET;
if (!token || !/^ojh_[A-Za-z0-9_-]{43}$/.test(token)) throw new Error("A host pairing token is required");
const socketPath = "/run/oj-service-control/control.sock";
coordinator.pathname = "/api/internal/hosts";
let stopping = false;
process.once("SIGINT", () => { stopping = true; });
process.once("SIGTERM", () => { stopping = true; });
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function state(unit) {
  try {
    const { stdout } = await run("/usr/bin/systemctl", ["show", unit, "--property=ActiveState", "--value"],
      { timeout: 4000, maxBuffer: 1024 });
    const value = stdout.trim();
    return ["active", "inactive", "failed"].includes(value) ? value : "unknown";
  } catch { return "unknown"; }
}

async function rpc(action, body) {
  const url = new URL(coordinator);
  url.searchParams.set("action", action);
  const response = await fetch(url, { method: "POST", redirect: "error", signal: AbortSignal.timeout(20_000),
    headers: { "content-type": "application/json", "x-judge-worker-secret": token }, body: JSON.stringify(body) });
  if (!response.ok) { await response.body?.cancel(); throw new Error(`Coordinator HTTP ${response.status}`); }
  return response.json();
}

async function perform(command) {
  if (!Number.isSafeInteger(command?.id) || command.id < 1 ||
    !["remote", "sandbox"].includes(command.service) || !["start", "restart"].includes(command.action)) {
    throw new Error("Invalid coordinator command");
  }
  await new Promise((resolve, reject) => {
    const body = JSON.stringify({ service: command.service, action: command.action });
    const request = httpRequest({ socketPath, path: "/control", method: "POST",
      headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) } }, (response) => {
      response.resume();
      response.on("error", reject);
      response.on("end", () => response.statusCode === 200 ? resolve() : reject(new Error("Local control failed")));
    });
    request.setTimeout(55_000, () => request.destroy(new Error("Local control timed out")));
    request.on("error", reject);
    request.end(body);
  });
}

let acknowledgement = null;
let failures = 0;
while (!stopping) {
  try {
    if (acknowledgement) {
      await rpc("ack", acknowledgement);
      acknowledgement = null;
    } else {
      const { command } = await rpc("poll", {
        workerState: await state("online-judge-remote@managed.service"),
        sandboxState: await state("sandbox-server.service"),
      });
      if (command) {
        try { await perform(command); acknowledgement = { commandId: command.id, outcome: "APPLIED" }; }
        catch { acknowledgement = { commandId: command.id, outcome: "FAILED" }; }
      }
    }
    failures = 0;
    await wait(5000);
  } catch (error) {
    failures++;
    console.error(JSON.stringify({ event: "host.agent.failed", failures, error: error instanceof Error ? error.name : "Unknown" }));
    await wait(Math.min(30_000, 1000 * 2 ** Math.min(failures - 1, 5)));
  }
}
