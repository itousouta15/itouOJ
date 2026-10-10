import { prisma } from "@/lib/db";
import { execute } from "@/lib/execute";
import { createJudgeQueue } from "@/lib/judgeQueue";
import { runEmbeddedJudgeClaim } from "@/lib/judgeEmbeddedWorker";
export { normalizeOutput, runVerdict } from "@/lib/judgeCore";

export const judgeQueue = createJudgeQueue(prisma);
export const claimNextSubmission = judgeQueue.claim;
export const recoverStaleJudgingSubmissions = judgeQueue.recover;

export async function getQueueSnapshot(submissionId: number) {
  const [ahead, judging] = await Promise.all([
    prisma.submission.count({ where: { status: "PENDING", id: { lt: submissionId } } }),
    prisma.submission.count({ where: { status: "JUDGING" } }),
  ]);
  return { position: ahead + 1, workAhead: ahead + judging };
}

export async function claimAndJudgeOne(): Promise<number | null> {
  await recoverStaleJudgingSubmissions();
  const claim = await claimNextSubmission();
  if (!claim) return null;
  await judgeSubmission(claim.submissionId, claim.claimId);
  return claim.submissionId;
}

export const resumePendingSubmissions = recoverStaleJudgingSubmissions;

// Compatibility entry point: embedded/systemd execution uses exactly the same
// evaluation core as remote executors, with the existing local sandbox queue.
export async function judgeSubmission(submissionId: number, claimId: string) {
  await runEmbeddedJudgeClaim({ db: prisma, queue: judgeQueue, execute, claim: { submissionId, claimId } });
}
