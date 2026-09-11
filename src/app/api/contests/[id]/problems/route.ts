import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { parseAllowedLanguages } from "@/lib/contest";

// 離線收件程式賽前抓題號對應用（PDF 上的「A 題」是哪個 problemId）。
// 只給標題和範例測資；完整題敘與隱藏測資走「等開賽才給」的文件 API。
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "請先登入" }, { status: 401 });
  }

  const { id } = await params;
  const contestId = Number(id);
  if (!Number.isInteger(contestId)) {
    return Response.json({ error: "比賽不存在" }, { status: 404 });
  }

  const contest = await prisma.contest.findUnique({
    where: { id: contestId },
    include: {
      problems: {
        orderBy: [{ order: "asc" }, { id: "asc" }],
        include: {
          problem: {
            select: {
              id: true,
              title: true,
              type: true,
              timeLimitMs: true,
              options: true,
              // 只給範例測資；這份會存到選手機上，隱藏測資不能外流
              testCases: {
                where: { isSample: true },
                orderBy: [{ order: "asc" }, { id: "asc" }],
                select: { input: true, output: true },
              },
            },
          },
        },
      },
    },
  });

  const isAdmin = session.role === "ADMIN";
  if (!contest || (!contest.isPublic && !isAdmin)) {
    return Response.json({ error: "比賽不存在" }, { status: 404 });
  }

  if (!isAdmin) {
    const participant = await prisma.contestParticipant.findUnique({
      where: { contestId_userId: { contestId, userId: session.userId } },
    });
    if (!participant) {
      return Response.json({ error: "尚未報名此比賽" }, { status: 403 });
    }
  }

  return Response.json({
    id: contest.id,
    title: contest.title,
    startTime: contest.startTime,
    endTime: contest.endTime,
    scoreMode: contest.scoreMode,
    // 空陣列 = 不限制語言；收件程式用這個決定檔案對話框要收哪些副檔名
    allowedLanguages: parseAllowedLanguages(contest.allowedLanguages) ?? [],
    problems: contest.problems.map((cp) => ({
      problemId: cp.problemId,
      label: cp.label,
      title: cp.problem.title,
      type: cp.problem.type,
      timeLimitMs: cp.problem.timeLimitMs,
      options: cp.problem.options ? JSON.parse(cp.problem.options) : null,
      samples: cp.problem.testCases,
    })),
  });
}
