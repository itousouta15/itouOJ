import { timingSafeEqual } from "node:crypto";
import { z } from "zod";
import type { PrismaClient } from "@/generated/prisma/client";
import { createJudgeQueue } from "@/lib/judgeQueue";
import { loadJudgeJob, judgeJobDigest, assertJudgeJobCurrent, JudgeJobChangedError } from "@/lib/judgeJob";
import {
  JUDGE_RESULT_BYTES, judgeClaimSchema, judgeWorkerSchema, judgeCompleteSchema,
  judgeFailSchema, readJudgeJson, JudgeProtocolError, validateJudgeOutcome,
} from "@/lib/judgeWire";
export { judgeJobDigest } from "@/lib/judgeJob";

export function createJudgeProtocol(options: {
  db: PrismaClient;
  queue?: ReturnType<typeof createJudgeQueue>;
  secret: () => string | undefined;
  work?: () => Promise<number | null>;
}) {
  const queue = options.queue ?? createJudgeQueue(options.db);
  const json = (data: unknown, status = 200) => Response.json(data, {
    status, headers: { "Cache-Control": "no-store, private", "X-Content-Type-Options": "nosniff" },
  });
  return async (request: Request): Promise<Response> => {
    const expected = options.secret();
    const received = request.headers.get("x-judge-worker-secret");
    if (!expected || !received || received.length > 4096) return json({ error: "Not found" }, 404);
    const a = Buffer.from(expected), b = Buffer.from(received);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return json({ error: "Not found" }, 404);
    if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
    try {
      const action = new URL(request.url).searchParams.get("action");
      if (action === "status") return json({ protocolVersion: 1, ...await queue.status() });
      if (action === "recover") return json({ recovered: (await queue.recover()).count });
      if (action === "work" && options.work) {
        const submissionId = await options.work();
        return json({ submissionId, processed: submissionId !== null });
      }
      if (!["claim", "heartbeat", "complete", "fail"].includes(action ?? "")) return json({ error: "Unknown action" }, 400);
      if (request.headers.get("content-type")?.split(";")[0].trim() !== "application/json") {
        return json({ error: "application/json required" }, 415);
      }
      const body = await readJudgeJson(request, action === "complete" ? JUDGE_RESULT_BYTES : 2048);
      if (action === "claim") {
        const { workerId } = judgeWorkerSchema.parse(body);
        await queue.recover();
        const claim = await queue.claim();
        if (!claim) return json({ protocolVersion: 1, claim: null });
        try {
          const job = await loadJudgeJob(options.db, claim.submissionId);
          if (!job || !(await queue.heartbeat(claim))) return json({ error: "Stale claim" }, 409);
          console.info(JSON.stringify({ event: "judge.remote.assigned", ...claim, workerId }));
          return json({ protocolVersion: 1, claim, job, jobDigest: judgeJobDigest(job), ...queue.timing });
        } catch (error) {
          if (error instanceof RangeError) {
            await queue.complete(claim, { status: "IE", compileError: "評測工作超過遠端協定大小限制" });
            return json({ error: "Job exceeds protocol limits" }, 422);
          }
          // A lost response/loading failure is recoverable even if release fails.
          await queue.release(claim);
          throw error;
        }
      }
      if (action === "heartbeat") {
        const claim = judgeClaimSchema.parse(body);
        return await queue.heartbeat(claim) ? json({ renewed: true, ...queue.timing }) : json({ error: "Stale claim" }, 409);
      }
      if (action === "fail") {
        const { reason, retryable, ...claim } = judgeFailSchema.parse(body);
        if (retryable) {
          const released = await queue.release(claim);
          console.info(JSON.stringify({ event: "judge.remote.released", ...claim, reason, released }));
          return released ? json({ outcome: "released" }) : json({ error: "Stale claim" }, 409);
        }
        const outcome = await queue.complete(claim, { status: "IE", compileError: "遠端評測系統錯誤，請稍後重新提交" });
        return json({ outcome }, outcome === "stale" ? 409 : 200);
      }
      const { jobDigest, outcome: result, ...claim } = judgeCompleteSchema.parse(body);
      const outcome = await queue.complete(claim, result.result, result.tests, async (tx) => {
        const job = await assertJudgeJobCurrent(tx, claim.submissionId, jobDigest);
        try { validateJudgeOutcome(job, result); }
        catch { throw new JudgeProtocolError(422, "Invalid result sequence or summary"); }
      });
      return json({ outcome }, outcome === "stale" ? 409 : 200);
    } catch (error) {
      if (error instanceof JudgeJobChangedError) return json({ error: "Job changed; release and reclaim" }, 409);
      if (error instanceof z.ZodError) return json({ error: "Invalid protocol payload" }, 400);
      if (error instanceof JudgeProtocolError) return json({ error: error.message }, error.status);
      console.error(JSON.stringify({ event: "judge.protocol.failed", error: error instanceof Error ? error.name : "Unknown" }));
      return json({ error: "Judge coordinator unavailable" }, 503);
    }
  };
}
