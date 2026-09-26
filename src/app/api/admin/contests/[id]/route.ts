import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { contestSchema } from "@/lib/contestSchema";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return Response.json({ error: "請先登入" }, { status: 401 });
  const { id } = await params;
  const contestId = Number(id);
  if (!Number.isInteger(contestId)) {
    return Response.json({ error: "比賽不存在" }, { status: 404 });
  }

  const existing = await prisma.contest.findUnique({ where: { id: contestId } });
  if (!existing) return Response.json({ error: "比賽不存在" }, { status: 404 });
  if (session.role !== "ADMIN" && existing.ownerId !== session.userId) {
    return Response.json({ error: "無權編輯此比賽" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = contestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }
  const { problems, joinCode, ...fields } = parsed.data;
  if (session.role !== "ADMIN") {
    const available = await prisma.problem.count({
      where: { id: { in: problems.map((p) => p.problemId) }, isPublic: true },
    });
    if (available !== problems.length) {
      return Response.json({ error: "只能加入公開且存在的題目" }, { status: 400 });
    }
  }

  // 題目清單整批換新（同課程編輯的做法）
  await prisma.$transaction([
    prisma.contestProblem.deleteMany({ where: { contestId } }),
    prisma.contest.update({
      where: session.role === "ADMIN"
        ? { id: contestId }
        : { id: contestId, ownerId: session.userId },
      data: {
        ...fields,
        joinCode: joinCode || null,
        problems: {
          create: problems.map((p, i) => ({
            problemId: p.problemId,
            label: p.label,
            order: i + 1,
          })),
        },
      },
    }),
  ]);
  return Response.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return Response.json({ error: "請先登入" }, { status: 401 });
  const { id } = await params;
  const contestId = Number(id);
  if (!Number.isInteger(contestId)) {
    return Response.json({ error: "比賽不存在" }, { status: 404 });
  }
  const contest = await prisma.contest.findUnique({
    where: { id: contestId },
    select: { ownerId: true },
  });
  if (!contest) return Response.json({ error: "比賽不存在" }, { status: 404 });
  if (session.role !== "ADMIN" && contest.ownerId !== session.userId) {
    return Response.json({ error: "無權刪除此比賽" }, { status: 403 });
  }
  await prisma.contest.delete({
    where: session.role === "ADMIN"
      ? { id: contestId }
      : { id: contestId, ownerId: session.userId },
  });
  return Response.json({ ok: true });
}
