import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { courseSchema } from "@/lib/courseSchema";

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
  const courseId = Number(id);

  const body = await request.json().catch(() => null);
  const parsed = courseSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }
  const { problemIds, joinCode, ...fields } = parsed.data;

  const existing = await prisma.course.findUnique({ where: { id: courseId } });
  if (!existing) {
    return Response.json({ error: "課程不存在" }, { status: 404 });
  }

  // 題目清單整批換新（同題目編輯的測資做法）
  await prisma.$transaction([
    prisma.courseProblem.deleteMany({ where: { courseId } }),
    prisma.course.update({
      where: { id: courseId },
      data: {
        ...fields,
        joinCode: joinCode || null,
        problems: {
          create: problemIds.map((problemId, i) => ({
            problemId,
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
  await prisma.course.delete({ where: { id: Number(id) } }).catch(() => null);
  return Response.json({ ok: true });
}
