import { prisma } from "@/lib/db";
import { claimAndJudgeOne, judgeQueue } from "@/lib/judge";
import { createJudgeProtocol } from "@/lib/judgeProtocol";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const POST = createJudgeProtocol({
  db: prisma, queue: judgeQueue,
  secret: () => process.env.JUDGE_WORKER_SECRET,
  work: claimAndJudgeOne,
});
