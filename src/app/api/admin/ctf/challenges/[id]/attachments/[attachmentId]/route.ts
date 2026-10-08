import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ctfIdSchema } from "@/lib/ctfSchema";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string; attachmentId: string }> }) {
  if ((await getSession())?.role !== "ADMIN") return Response.json({ error: "需要管理員權限" }, { status: 403 });
  const values = await params;
  const id = ctfIdSchema.safeParse(values.id);
  const attachmentId = ctfIdSchema.safeParse(values.attachmentId);
  if (!id.success || !attachmentId.success) return Response.json({ error: "ID 不合法" }, { status: 400 });
  const result = await prisma.ctfAttachment.deleteMany({ where: { id: attachmentId.data, challengeId: id.data } });
  if (!result.count) return Response.json({ error: "附件不存在" }, { status: 404 });
  return Response.json({ ok: true });
}
