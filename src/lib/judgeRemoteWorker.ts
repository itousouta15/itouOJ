import { evaluateJudgeJob } from "@/lib/judgeCore";
import { sandboxExecute } from "@/lib/sandbox";
import { startJudgeHeartbeat } from "@/lib/judgeQueue";
import { judgeCoordinatorEndpoint } from "@/lib/judgeCoordinatorUrl.mjs";
import {
  judgeAssignmentSchema, judgeOutcomeSchema, judgeWorkerSchema, judgeIdleSchema, JUDGE_JOB_BYTES,
  JUDGE_RESULT_BYTES, readJudgeJson,
} from "@/lib/judgeWire";

class CoordinatorError extends Error {
  constructor(public status: number) { super(`Coordinator HTTP ${status}`); }
}
const sleep = (ms: number, signal?: AbortSignal) => new Promise<void>((resolve) => {
  if (signal?.aborted) return resolve();
  const done = () => { clearTimeout(timer); signal?.removeEventListener("abort", done); resolve(); };
  const timer = setTimeout(done, ms);
  signal?.addEventListener("abort", done, { once: true });
});

export async function runRemoteJudgeWorker(options: {
  coordinatorUrl: string; secret: string; workerId: string; stop: AbortSignal;
}) {
  judgeWorkerSchema.parse({ workerId: options.workerId });
  const endpoint = judgeCoordinatorEndpoint(options.coordinatorUrl);
  if (!options.secret) throw new Error("JUDGE_WORKER_SECRET is required");
  const rpc = async (action: string, body: unknown, maxBytes = 4096) => {
    const url = new URL(endpoint);
    url.searchParams.set("action", action);
    const serialized = JSON.stringify(body);
    if (Buffer.byteLength(serialized) > JUDGE_RESULT_BYTES) throw new Error("Result exceeds protocol limits");
    const response = await fetch(url, {
      method: "POST", redirect: "error", signal: AbortSignal.timeout(20_000),
      headers: { "content-type": "application/json", "x-judge-worker-secret": options.secret },
      body: serialized,
    });
    if (!response.ok) {
      await response.body?.cancel();
      throw new CoordinatorError(response.status);
    }
    return readJudgeJson(response, maxBytes);
  };
  let failures = 0;
  while (!options.stop.aborted) {
    try {
      const response = await rpc("claim", { workerId: options.workerId }, JUDGE_JOB_BYTES + 4096);
      if (judgeIdleSchema.safeParse(response).success) {
        await sleep(500, options.stop);
        continue;
      }
      const assignment = judgeAssignmentSchema.parse(response);
      const { claim, job, jobDigest } = assignment;
      if (options.stop.aborted) {
        await rpc("fail", { ...claim, reason: "shutdown", retryable: true });
        break;
      }
      console.info(JSON.stringify({ event: "judge.remote.started", workerId: options.workerId, submissionId: claim.submissionId }));
      const controller = new AbortController();
      const heartbeat = startJudgeHeartbeat(async () => {
        await rpc("heartbeat", claim);
        return true;
      }, assignment.heartbeatMs, () => controller.abort());
      try {
        let outcome;
        try {
          outcome = judgeOutcomeSchema.parse(await evaluateJudgeJob(job, sandboxExecute, controller.signal));
        } catch (error) {
          if (heartbeat.isLost()) throw error;
          await rpc("fail", { ...claim, reason: "sandbox_unavailable", retryable: true });
          throw error;
        }
        // A lost completion response must retry the SAME token and payload.
        // Continue these retries even if heartbeat sees the committed job as
        // finished; the coordinator can acknowledge a duplicate completion.
        for (let attempt = 0; ; attempt++) {
          try {
            const applied = await rpc("complete", { ...claim, jobDigest, outcome });
            console.info(JSON.stringify({ event: "judge.remote.completed", workerId: options.workerId,
              submissionId: claim.submissionId, acknowledgement: applied }));
            break;
          } catch (error) {
            if (error instanceof CoordinatorError && error.status >= 400 && error.status < 500) {
              // In particular, changed job payloads can be released immediately.
              await rpc("fail", { ...claim, reason: "worker_error", retryable: true }).catch(() => {});
              throw error;
            }
            if (attempt >= 2) throw error;
            await sleep(250 * 2 ** attempt);
          }
        }
        failures = 0;
      } finally {
        await heartbeat.stop();
      }
    } catch (error) {
      failures++;
      console.error(JSON.stringify({ event: "judge.remote.failed", workerId: options.workerId, failures,
        status: error instanceof CoordinatorError ? error.status : undefined,
        error: error instanceof Error ? error.name : "Unknown" }));
      await sleep(Math.min(30_000, 1000 * 2 ** Math.min(failures - 1, 5)), options.stop);
    }
  }
}
