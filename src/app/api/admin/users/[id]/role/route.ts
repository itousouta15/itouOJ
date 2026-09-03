import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

const ALLOWED_ROLES = ["USER", "ADMIN"];

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (session?.role !== "ADMIN") {
    return Response.json({ error: "需要管理員權限" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const role = body?.role;
  if (!ALLOWED_ROLES.includes(role)) {
    return Response.json({ error: "無效的角色" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    return Response.json({ error: "使用者不存在" }, { status: 404 });
  }

  // 管理員不能把自己降級，避免站上完全沒有管理員
  if (user.id === session.userId) {
    return Response.json({ error: "不能修改自己的角色" }, { status: 400 });
  }

  await prisma.user.update({ where: { id: user.id }, data: { role } });
  return Response.json({ ok: true, role });
}