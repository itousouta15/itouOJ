import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getContestPhase } from "@/lib/contest";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (session?.role !== "ADMIN") {
    return Response.json({ error: "需要管理員權限" }, { status: 403 });
  }
  const { id } = await params;
  const contestId = Number(id);

  const contest = await prisma.contest.findUnique({ where: { id: contestId } });
  if (!contest) {
    return Response.json({ error: "比賽不存在" }, { status: 404 });
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
