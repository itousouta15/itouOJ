import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getQueueSnapshot } from "@/lib/judge";
import { LANGUAGE_KEYS } from "@/lib/languages";
import { assertContestProblemAccess } from "@/lib/contest";
import { clientIp, enforceRateLimit } from "@/lib/rateLimit";
import { acquireSubmissionAdmission } from "@/lib/submissionAdmission";

const USER_SUBMISSION_LIMIT = 10;
const IP_SUBMISSION_LIMIT = 30;
const SUBMISSION_WINDOW_MS = 60_000;
const MAX_ACTIVE_PER_USER = 3;
const MAX_PENDING_SUBMISSIONS = 100;

const schema = z.object({
  problemId: z.number().int().positive(),
  language: z.enum(LANGUAGE_KEYS as [string, ...string[]]),
  code: z.string().min(1, "程式碼不能是空的").max(65536, "程式碼過長"),
  contestId: z.number().int().positive().optional(),
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "請先登入" }, { status: 401 });
  }

  const userRateLimit = enforceRateLimit(
    `submission:user:${session.userId}`,
    USER_SUBMISSION_LIMIT,
    SUBMISSION_WINDOW_MS
  );
  if (userRateLimit) return userRateLimit;
  const ipRateLimit = enforceRateLimit(
    `submission:ip:${clientIp(request)}`,
    IP_SUBMISSION_LIMIT,
    SUBMISSION_WINDOW_MS
  );
  if (ipRateLimit) return ipRateLimit;

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }
  const { problemId, language, code, contestId } = parsed.data;

  const problem = await prisma.problem.findUnique({
    where: { id: problemId },
    select: { type: true, isPublic: true },
  });
  if (!problem) {
    return Response.json({ error: "題目不存在" }, { status: 404 });
  }

  // 識別題不做紀錄：作答在練習頁即時判定，不建立 Submission
  if (problem.type === "RECOGNITION") {
    return Response.json(
      { error: "識別題是練習題，不需要提交紀錄" },
      { status: 400 }
    );
  }

  if (contestId !== undefined) {
    const access = await assertContestProblemAccess(
      session,
      contestId,
      problemId,
      language
    );
    if (!access.ok) {
      return Response.json({ error: access.error }, { status: access.status });
    }
  } else if (!problem.isPublic && session.role !== "ADMIN") {
    return Response.json({ error: "題目不存在" }, { status: 404 });
  }

  const releaseAdmission = await acquireSubmissionAdmission();
  let submission: { id: number };
  try {
    const [activeCount, pendingCount] = await Promise.all([
      prisma.submission.count({
        where: { userId: session.userId, status: { in: ["PENDING", "JUDGING"] } },
      }),
      prisma.submission.count({ where: { status: "PENDING" } }),
    ]);
    if (activeCount >= MAX_ACTIVE_PER_USER) {
      return Response.json(
        { error: "You already have too many submissions waiting to be judged." },
        { status: 429 }
      );
    }
    if (pendingCount >= MAX_PENDING_SUBMISSIONS) {
      return Response.json(
        { error: "The judging queue is currently full. Please try again shortly." },
        { status: 503, headers: { "Retry-After": "30" } }
      );
    }

    submission = await prisma.submission.create({
      data: {
        userId: session.userId,
        problemId,
        language,
        code,
        status: "PENDING",
        contestId: contestId ?? null,
      },
    });
  } finally {
    releaseAdmission();
  }

  const queue = await getQueueSnapshot(submission.id);
  return Response.json({ id: submission.id, queue });
}
