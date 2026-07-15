import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession, destroySession } from "@/lib/auth";

const schema = z.object({
  password: z.string().optional(),
  confirmUsername: z.string(),
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "請先登入" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "請完整填寫確認欄位" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) {
    return Response.json({ error: "請先登入" }, { status: 401 });
  }

  if (parsed.data.confirmUsername !== user.username) {
    return Response.json({ error: "使用者名稱輸入不正確" }, { status: 400 });
  }

  if (user.passwordHash) {
    const ok = parsed.data.password
      ? await bcrypt.compare(parsed.data.password, user.passwordHash)
      : false;
    if (!ok) {
      return Response.json({ error: "密碼不正確" }, { status: 400 });
    }
  }

  await prisma.user.delete({ where: { id: user.id } });
  await destroySession();
  return Response.json({ ok: true });
}
