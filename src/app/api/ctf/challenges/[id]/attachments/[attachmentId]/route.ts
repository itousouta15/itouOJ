import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ctfIdSchema } from "@/lib/ctfSchema";
import { ctfDownloadHeaders } from "@/lib/ctfAttachment";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string; attachmentId: string }> }) {
  const values = await params;
  const id = ctfIdSchema.safeParse(values.id);
  const attachmentId = ctfIdSchema.safeParse(values.attachmentId);
  if (!id.success || !attachmentId.success) return Response.json({ error: "ID 不合法" }, { status: 400 });
  const session = await getSession();
  const attachment = await prisma.ctfAttachment.findFirst({
    where: { id: attachmentId.data, challengeId: id.data, ...(session?.role === "ADMIN" ? {} : { challenge: { isPublic: true } }) },
    select: { filename: true, data: true },
  });
  if (!attachment) return Response.json({ error: "附件不存在" }, { status: 404 });
  return new Response(new Uint8Array(attachment.data), { headers: ctfDownloadHeaders(attachment.filename) });
}
