// Poller only: execution, leases and database access live in the Next server.
// Configure through the process environment; do not implicitly load .env.
import { hostname } from "node:os";
import { judgeCoordinatorEndpoint } from "../src/lib/judgeCoordinatorUrl.mjs";

const secret = process.env.JUDGE_WORKER_SECRET;
if (!secret) throw new Error("JUDGE_WORKER_SECRET is required");
const endpoint = judgeCoordinatorEndpoint(process.env.JUDGE_WORKER_URL ?? "http://127.0.0.1:3000");
endpoint.searchParams.set("action", "work");
const concurrency = Number(process.env.JUDGE_WORKER_CONCURRENCY ?? 1);
if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 16) {
  throw new Error("JUDGE_WORKER_CONCURRENCY must be an integer from 1 to 16");
}
let stopping = false;
const wakeups = new Set();
function stop() {
  stopping = true;
  for (const wake of wakeups) wake();
}
process.once("SIGINT", stop);
process.once("SIGTERM", stop);
function pause(ms) {
  if (stopping) return Promise.resolve();
  return new Promise((resolve) => {
    const wake = () => { clearTimeout(timer); wakeups.delete(wake); resolve(); };
    const timer = setTimeout(wake, ms);
    wakeups.add(wake);
  });
}
await Promise.all(Array.from({ length: concurrency }, async (_, slot) => {
  const worker = `${hostname()}:${process.pid}:${slot}`;
  let failures = 0;
  while (!stopping) {
    try {
      const response = await fetch(endpoint, {
        method: "POST", headers: { "x-judge-worker-secret": secret },
        signal: AbortSignal.timeout(900_000), redirect: "error",
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();
      if (typeof result.processed !== "boolean") throw new Error("Invalid worker response");
      failures = 0;
      if (result.processed) console.info(JSON.stringify({ event: "judge.poll.completed", worker, submissionId: result.submissionId }));
      await pause(result.processed ? 50 : 500);
    } catch {
      failures++;
      console.error(JSON.stringify({ event: "judge.poll.failed", worker, failures }));
      await pause(Math.min(30_000, 1_000 * 2 ** Math.min(failures - 1, 5)));
    }
  }
}));
