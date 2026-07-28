import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getContestPhase, parseAllowedLanguages } from "@/lib/contest";

// 給離線收件程式在賽前設定階段抓題號對應用（PDF 上的「A 題」是伺服器上的哪個 problemId）。
// 比賽開始前只給代號，不給標題——不然題目名稱會提早外流。
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
        include: { problem: { select: { id: true, title: true } } },
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
      title: started || isAdmin ? cp.problem.title : null,
    })),
  });
}
