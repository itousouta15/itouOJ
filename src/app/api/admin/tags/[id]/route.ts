import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { tagSchema } from "@/lib/tagSchema";

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
  const tagId = Number(id);

  const body = await request.json().catch(() => null);
  const parsed = tagSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const existing = await prisma.tag.findUnique({ where: { name: parsed.data.name } });
  if (existing && existing.id !== tagId) {
    return Response.json({ error: "已經有這個標籤了" }, { status: 400 });
  }

  await prisma.tag
    .update({ where: { id: tagId }, data: parsed.data })
    .catch(() => null);
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
  await prisma.tag.delete({ where: { id: Number(id) } }).catch(() => null);
  return Response.json({ ok: true });
}
