import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ctfIdSchema, ctfUpdateSchema } from "@/lib/ctfSchema";
import { hashCtfFlag } from "@/lib/ctfFlag";
import { encryptCtfLabFlag } from "@/lib/ctfLabFlag";
import { CTF_METADATA_MAX_BYTES, readCtfJson, ctfErrorResponse } from "@/lib/ctfAttachment";

type Context = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Context) {
  if ((await getSession())?.role !== "ADMIN") return Response.json({ error: "需要管理員權限" }, { status: 403 });
  const id = ctfIdSchema.safeParse((await params).id);
  if (!id.success) return Response.json({ error: "題目 ID 不合法" }, { status: 400 });
  try {
    const parsed = ctfUpdateSchema.safeParse(await readCtfJson(request, CTF_METADATA_MAX_BYTES));
    if (!parsed.success) return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
    const { flag, ...data } = parsed.data;
    const existing = await prisma.ctfChallenge.findUnique({
      where: { id: id.data }, select: { labType: true, labFlagCiphertext: true, updatedAt: true },
    });
    if (!existing) return Response.json({ error: "題目不存在" }, { status: 404 });
    const labType = data.labType === undefined ? existing.labType : data.labType;
    if (labType && data.category !== "Web") return Response.json({ error: "練習網站只適用於 Web 分類" }, { status: 400 });
    if (labType && !existing.labFlagCiphertext && !flag) {
      return Response.json({ error: "啟用練習網站時，請同時設定新的 Flag" }, { status: 400 });
    }
    const hashed = flag ? await hashCtfFlag(flag) : null;
    const labFlagCiphertext = labType
      ? hashed ? encryptCtfLabFlag(flag, hashed.flagHash) : existing.labFlagCiphertext
      : null;
    const result = await prisma.ctfChallenge.updateMany({
      where: { id: id.data, updatedAt: existing.updatedAt }, data: { ...data, labType, labFlagCiphertext, ...hashed },
    });
    if (!result.count) return Response.json({ error: "題目狀態已變更，請重新載入後再儲存" }, { status: 409 });
    return Response.json({ ok: true });
  } catch (error) { return ctfErrorResponse(error); }
}

export async function DELETE(_request: Request, { params }: Context) {
  if ((await getSession())?.role !== "ADMIN") return Response.json({ error: "需要管理員權限" }, { status: 403 });
  const id = ctfIdSchema.safeParse((await params).id);
  if (!id.success) return Response.json({ error: "題目 ID 不合法" }, { status: 400 });
  const result = await prisma.ctfChallenge.deleteMany({ where: { id: id.data } });
  if (!result.count) return Response.json({ error: "題目不存在" }, { status: 404 });
  return Response.json({ ok: true });
}
