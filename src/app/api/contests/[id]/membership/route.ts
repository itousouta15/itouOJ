import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getContestPhase } from "@/lib/contest";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "請先登入" }, { status: 401 });
  }
  const { id } = await params;
  const contestId = Number(id);

  const contest = await prisma.contest.findUnique({ where: { id: contestId } });
  if (!contest || (!contest.isPublic && session.role !== "ADMIN")) {
    return Response.json({ error: "比賽不存在" }, { status: 404 });
  }
  if (getContestPhase(contest) === "ended" && session.role !== "ADMIN") {
    return Response.json({ error: "比賽已結束，無法報名" }, { status: 400 });
  }

  // 有設定加入代碼的比賽要驗證代碼（管理員免驗）
  if (contest.joinCode && session.role !== "ADMIN") {
    const body = await request.json().catch(() => null);
    const code = typeof body?.code === "string" ? body.code.trim() : "";
    if (code !== contest.joinCode) {
      return Response.json({ error: "加入代碼錯誤" }, { status: 403 });
    }
  }

  await prisma.contestParticipant.upsert({
    where: { contestId_userId: { contestId, userId: session.userId } },
    create: { contestId, userId: session.userId },
    update: {},
  });
  return Response.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "請先登入" }, { status: 401 });
  }
  const { id } = await params;
  await prisma.contestParticipant.deleteMany({
    where: { contestId: Number(id), userId: session.userId },
  });
  return Response.json({ ok: true });
}
