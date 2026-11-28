import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createJudgeQueue } from "@/lib/judgeQueue";
import { createJudgeMonitorHandler } from "@/lib/judgeMonitor";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const GET = createJudgeMonitorHandler({ getSession, getStatus: createJudgeQueue(prisma).status });
