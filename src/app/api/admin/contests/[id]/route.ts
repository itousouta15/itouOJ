import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { contestSchema } from "@/lib/contestSchema";

async function requireAdmin() {
  const session = await getSession();
  return session?.role === "ADMIN" ? session : null;
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) {
    return Response.json({ error: "需要管理員權限" }, { status: 403 });
  }
  const { id } = await params;
  const contestId = Number(id);

  const body = await request.json().catch(() => null);
  const parsed = contestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }
  const { problems, joinCode, ...fields } = parsed.data;

  const existing = await prisma.contest.findUnique({ where: { id: contestId } });
  if (!existing) {
    return Response.json({ error: "比賽不存在" }, { status: 404 });
  }

  // 題目清單整批換新（同課程編輯的做法）
  await prisma.$transaction([
    prisma.contestProblem.deleteMany({ where: { contestId } }),
    prisma.contest.update({
      where: { id: contestId },
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
  if (!(await requireAdmin())) {
    return Response.json({ error: "需要管理員權限" }, { status: 403 });
  }
  const { id } = await params;
  await prisma.contest.delete({ where: { id: Number(id) } }).catch(() => null);
  return Response.json({ ok: true });
}
