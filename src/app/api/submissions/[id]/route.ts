import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { isContestRevealed } from "@/lib/contest";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const submissionId = Number(id);
  if (!Number.isInteger(submissionId)) {
    return Response.json({ error: "not found" }, { status: 404 });
  }

  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: {
      user: { select: { username: true } },
      problem: {
        select: {
          id: true,
          order: true,
          title: true,
          subtasks: {
            orderBy: { order: "asc" },
            select: { order: true, points: true },
          },
        },
      },
      contest: true,
      results: {
        orderBy: { order: "asc" },
        include: {
          testCase: { select: { input: true, output: true, isSample: true } },
        },
      },
    },
  });
  if (!submission) {
    return Response.json({ error: "not found" }, { status: 404 });
  }

  const session = await getSession();
  const isOwner = session?.userId === submission.userId;
  const isAdmin = session?.role === "ADMIN";

  // 比賽期間（或結束後尚未公開）不給非本人/非管理員看到戰績，避免洩漏即時排名
  if (
    submission.contest &&
    !isContestRevealed(submission.contest) &&
    !isOwner &&
    !isAdmin
  ) {
    return Response.json({
      id: submission.id,
      contestId: submission.contestId,
      hidden: true,
    });
  }

  return Response.json({
    id: submission.id,
    username: submission.user.username,
    problem: submission.problem,
    language: submission.language,
    status: submission.status,
    score: submission.score,
    timeMs: submission.timeMs,
    memoryKb: submission.memoryKb,
    createdAt: submission.createdAt,
    results: submission.results.map((r) => {
      // 測資內容只給本人／管理員看，而且只給範例測資——非範例測資留給學生
      // 自己去想，也避免有人靠翻別人的提交紀錄把隱藏測資的內容湊出來。
      const canSeeTestCase = (isOwner || isAdmin) && r.testCase?.isSample;
      return {
        order: r.order,
        subtaskOrder: r.subtaskOrder,
        verdict: r.verdict,
        timeMs: r.timeMs,
        memoryKb: r.memoryKb,
        input: canSeeTestCase ? r.testCase!.input : null,
        expectedOutput: canSeeTestCase ? r.testCase!.output : null,
        actualOutput: canSeeTestCase ? r.actualOutput : null,
      };
    }),
    // 程式碼與編譯錯誤只有本人和管理員看得到
    code: isOwner || isAdmin ? submission.code : null,
    compileError: isOwner || isAdmin ? submission.compileError : null,
  });
}
