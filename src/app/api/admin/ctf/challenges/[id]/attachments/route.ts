import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ctfIdSchema } from "@/lib/ctfSchema";
import {
  CTF_ATTACHMENT_MAX_BYTES, CTF_UPLOAD_MAX_BYTES, CtfRequestError,
  readCtfBody, ctfFilename, ctfErrorResponse,
} from "@/lib/ctfAttachment";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if ((await getSession())?.role !== "ADMIN") return Response.json({ error: "需要管理員權限" }, { status: 403 });
  const id = ctfIdSchema.safeParse((await params).id);
  if (!id.success) return Response.json({ error: "題目 ID 不合法" }, { status: 400 });
  const challenge = await prisma.ctfChallenge.findUnique({ where: { id: id.data }, select: { id: true } });
  if (!challenge) return Response.json({ error: "題目不存在" }, { status: 404 });
  try {
    const bytes = await readCtfBody(request, CTF_UPLOAD_MAX_BYTES);
    const form = await new Response(bytes, {
      headers: { "Content-Type": request.headers.get("content-type") ?? "" },
    }).formData().catch(() => null);
    const file = form?.get("file");
    if (!(file instanceof File) || [...form!.values()].filter((value) => value instanceof File).length !== 1) {
      throw new CtfRequestError("每次請選擇一個附件");
    }
    if (!file.size) throw new CtfRequestError("附件不能是空檔");
    if (file.size > CTF_ATTACHMENT_MAX_BYTES) throw new CtfRequestError("每個附件最多 4 MiB", 413);
    const filename = ctfFilename(file.name);
    const attachment = await prisma.ctfAttachment.create({
      data: { challengeId: id.data, filename, sizeBytes: file.size, data: new Uint8Array(await file.arrayBuffer()) },
      select: { id: true, filename: true, sizeBytes: true },
    });
    return Response.json(attachment, { status: 201 });
  } catch (error) { return ctfErrorResponse(error); }
}
