import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { announcementSchema } from "@/lib/announcementSchema";

async function requireAdmin() {
  const session = await getSession();
  return session?.role === "ADMIN" ? session : null;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) {
    return Response.json({ error: "需要管理員權限" }, { status: 403 });
  }
  const { id } = await params;
  const announcementId = Number(id);
  if (!Number.isSafeInteger(announcementId) || announcementId <= 0) {
    return Response.json({ error: "公告不存在" }, { status: 404 });
  }
  const announcement = await prisma.announcement.findUnique({
    where: { id: announcementId },
    select: { id: true, title: true, content: true, isPinned: true },
  });
  if (!announcement) {
    return Response.json({ error: "公告不存在" }, { status: 404 });
  }
  return Response.json({ announcement }, {
    headers: { "Cache-Control": "private, no-store" },
  });
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

  if (!Number.isSafeInteger(announcementId) || announcementId <= 0) {
    return Response.json({ error: "公告不存在" }, { status: 404 });
  }
  const body = await request.json().catch(() => null);
  const parsed = announcementSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const { count } = await prisma.announcement.updateMany({
    where: { id: announcementId },
    data: parsed.data,
  });
  if (count === 0) {
    return Response.json({ error: "公告不存在" }, { status: 404 });
  }

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
  const announcementId = Number(id);
  if (!Number.isSafeInteger(announcementId) || announcementId <= 0) {
    return Response.json({ error: "公告不存在" }, { status: 404 });
  }
  const { count } = await prisma.announcement.deleteMany({ where: { id: announcementId } });
  if (count === 0) {
    return Response.json({ error: "公告不存在" }, { status: 404 });
  }
  return Response.json({ ok: true });
}
