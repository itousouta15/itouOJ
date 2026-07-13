import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { announcementSchema } from "@/lib/announcementSchema";

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
  const announcementId = Number(id);

  const body = await request.json().catch(() => null);
  const parsed = announcementSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const existing = await prisma.announcement.findUnique({
    where: { id: announcementId },
  });
  if (!existing) {
    return Response.json({ error: "公告不存在" }, { status: 404 });
  }

  await prisma.announcement.update({
    where: { id: announcementId },
    data: parsed.data,
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
  await prisma.announcement
    .delete({ where: { id: Number(id) } })
    .catch(() => null);
  return Response.json({ ok: true });
}
