import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { canManageContest, getContestPhase } from "@/lib/contest";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return Response.json({ error: "請先登入" }, { status: 401 });
  const { id } = await params;
  const contestId = Number(id);

  const contest = await prisma.contest.findUnique({ where: { id: contestId } });
  if (!contest) {
    return Response.json({ error: "比賽不存在" }, { status: 404 });
  }
  if (!canManageContest(session, contest)) {
    return Response.json({ error: "無權管理此比賽" }, { status: 403 });
  }
  if (getContestPhase(contest) !== "ended") {
    return Response.json({ error: "比賽尚未結束，不能公開成績" }, { status: 400 });
  }

  await prisma.contest.update({
    where: { id: contestId },
    data: { revealedAt: new Date() },
  });
  return Response.json({ ok: true });
}
