import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "請先登入" }, { status: 401 });
  }
  const { id } = await params;
  const courseId = Number(id);

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course || (!course.isPublic && session.role !== "ADMIN")) {
    return Response.json({ error: "課程不存在" }, { status: 404 });
  }

  // 有設定加入代碼的課程要驗證代碼（管理員免驗）
  if (course.joinCode && session.role !== "ADMIN") {
    const body = await request.json().catch(() => null);
    const code = typeof body?.code === "string" ? body.code.trim() : "";
    if (code !== course.joinCode) {
      return Response.json({ error: "加入代碼錯誤" }, { status: 403 });
    }
  }

  await prisma.courseMember.upsert({
    where: { courseId_userId: { courseId, userId: session.userId } },
    create: { courseId, userId: session.userId },
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
  await prisma.courseMember.deleteMany({
    where: { courseId: Number(id), userId: session.userId },
  });
  return Response.json({ ok: true });
}
