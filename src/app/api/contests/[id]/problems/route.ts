import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getContestPhase, parseAllowedLanguages } from "@/lib/contest";

// 給離線收件程式在賽前設定階段抓題號對應用（PDF 上的「A 題」是伺服器上的哪個 problemId）。
// 標題賽前就會給：斷網比賽是在賽前設定階段抓一次這支 API 存進 config.json，
// 那次如果沒抓到標題，之後全場離線就再也補不回來了。題目內容本身（statement、
// samples）風險高很多——會不會提早外流才是重點，仍然要等開賽才給。
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
              timeLimitMs: true,
              // 只取範例測資。這份資料會被下載到選手機上離線保存，
              // 一旦把 isSample=false 的也送出去，等於把所有隱藏測資交出去。
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

  const started = getContestPhase(contest) !== "upcoming";

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
      timeLimitMs: cp.problem.timeLimitMs,
      // 比賽開始前不給，否則題目內容會提早外流；收件程式屆時只能用自訂輸入測試
      samples: started || isAdmin ? cp.problem.testCases : [],
    })),
  });
}
