import { prisma } from "@/lib/db";
import { claimAndJudgeOne, judgeQueue } from "@/lib/judge";
import { createJudgeProtocol } from "@/lib/judgeProtocol";
import { createHostRegistry } from "@/lib/hostRegistry";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const POST = createJudgeProtocol({
  db: prisma, queue: judgeQueue,
  secret: () => process.env.JUDGE_WORKER_SECRET,
  authorizeHost: async (token) => !!(await createHostRegistry(prisma).authenticate(token)),
  work: claimAndJudgeOne,
});
