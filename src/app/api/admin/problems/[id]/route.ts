import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { problemSchema } from "@/lib/problemSchema";

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
  const problemId = Number(id);

  const body = await request.json().catch(() => null);
  const parsed = problemSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }
  const { testCases, subtasks, ...fields } = parsed.data;

  const existing = await prisma.problem.findUnique({
    where: { id: problemId },
  });
  if (!existing) {
    return Response.json({ error: "題目不存在" }, { status: 404 });
  }

  // 測資與子題整批換新（簡單且不易出錯）
  await prisma.$transaction(async (tx) => {
    await tx.testCase.deleteMany({ where: { problemId } });
    await tx.subtask.deleteMany({ where: { problemId } });
    const updated = await tx.problem.update({
      where: { id: problemId },
      data: {
        ...fields,
        subtasks: {
          create: subtasks.map((s, i) => ({
            order: i + 1,
            points: s.points,
            checkMode: s.checkMode,
          })),
        },
      },
      include: { subtasks: { orderBy: { order: "asc" } } },
    });
    await tx.testCase.createMany({
      data: testCases.map((tc, i) => ({
        problemId,
        input: tc.input,
        output: tc.output,
        isSample: tc.isSample,
        order: i + 1,
        subtaskId:
          tc.subtaskIndex != null ? updated.subtasks[tc.subtaskIndex].id : null,
      })),
    });
  });
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
  await prisma.problem.delete({ where: { id: Number(id) } }).catch(() => null);
  return Response.json({ ok: true });
}
