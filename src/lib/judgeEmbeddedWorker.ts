import type { PrismaClient } from "@/generated/prisma/client";
import type { sandboxExecute } from "@/lib/sandbox";
import { SandboxBusyError } from "@/lib/sandboxQueue";
import { createJudgeQueue, startJudgeHeartbeat, type JudgeClaim } from "@/lib/judgeQueue";
import { evaluateJudgeJob } from "@/lib/judgeCore";
import { assertJudgeJobCurrent, judgeJobDigest, JudgeJobChangedError, loadJudgeJob } from "@/lib/judgeJob";

export async function runEmbeddedJudgeClaim(options: {
  db: PrismaClient; queue: ReturnType<typeof createJudgeQueue>;
  claim: JudgeClaim; execute: typeof sandboxExecute;
}) {
  const { db, queue, claim, execute } = options;
  if (!(await queue.heartbeat(claim))) return;
  const controller = new AbortController();
  const heartbeat = startJudgeHeartbeat(() => queue.heartbeat(claim), queue.timing.heartbeatMs, () => controller.abort());
  try {
    const job = await loadJudgeJob(db, claim.submissionId);
    if (!job || heartbeat.isLost()) return;
    const digest = judgeJobDigest(job);
    const { result, tests } = await evaluateJudgeJob(job, execute, controller.signal);
    if (!heartbeat.isLost()) await queue.complete(claim, result, tests, async (tx) => {
      await assertJudgeJobCurrent(tx, claim.submissionId, digest);
    });
  } catch (error) {
    if (heartbeat.isLost()) return;
    if (error instanceof SandboxBusyError || error instanceof JudgeJobChangedError) {
      await queue.release(claim);
    } else {
      console.error(JSON.stringify({ event: "judge.embedded.failed", submissionId: claim.submissionId,
        error: error instanceof Error ? error.name : "Unknown" }));
      await queue.complete(claim, { status: "IE", compileError: "評測系統內部錯誤，請稍後重新提交" });
    }
  } finally {
    await heartbeat.stop();
  }
}
