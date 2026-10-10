// Run with the repository TypeScript loader. No dotenv or DB imports.
import { hostname } from "node:os";
import { runRemoteJudgeWorker } from "../src/lib/judgeRemoteWorker.ts";

if (!process.env.SANDBOX_URL) throw new Error("SANDBOX_URL is required for remote execution");
if (!process.env.JUDGE_WORKER_URL) throw new Error("JUDGE_WORKER_URL (coordinator) is required");
const stop = new AbortController();
process.once("SIGINT", () => stop.abort());
process.once("SIGTERM", () => stop.abort());
await runRemoteJudgeWorker({
  coordinatorUrl: process.env.JUDGE_WORKER_URL,
  secret: process.env.JUDGE_WORKER_SECRET ?? "",
  workerId: process.env.JUDGE_WORKER_ID ?? `${hostname()}:${process.pid}`,
  stop: stop.signal,
});
