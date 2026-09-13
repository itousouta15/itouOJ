import { z } from "zod";
import { prisma } from "@/lib/db";
import { clientIp, enforceRateLimit } from "@/lib/rateLimit";
import {
  createPasswordResetToken,
  passwordResetConfigured,
  sendPasswordResetEmail,
} from "@/lib/passwordReset";

const schema = z.object({ username: z.string().trim().min(1).max(20) });
const RESPONSE = {
  ok: true,
  message: "若帳號已設定 Email，重設連結將寄到該信箱。",
};

export async function POST(request: Request) {
  const ip = clientIp(request);
  const limited = enforceRateLimit(`password-reset:ip:${ip}`, 5, 15 * 60_000);
  if (limited) return limited;

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "請輸入使用者名稱" }, { status: 400 });
  }
  const usernameLimited = enforceRateLimit(
    `password-reset:user:${ip}:${parsed.data.username.toLowerCase()}`,
    3,
    15 * 60_000,
  );
  if (usernameLimited) return usernameLimited;
  if (!passwordResetConfigured()) {
    return Response.json({ error: "密碼重設服務暫時無法使用" }, { status: 503 });
  }

  const user = await prisma.user.findUnique({
    where: { username: parsed.data.username },
    select: { id: true, username: true, email: true },
  });
  if (!user?.email) return Response.json(RESPONSE);

  const reset = createPasswordResetToken();
  await prisma.$transaction([
    prisma.passwordResetToken.deleteMany({ where: { userId: user.id } }),
    prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: reset.tokenHash,
        expiresAt: reset.expiresAt,
      },
    }),
  ]);
  const sent = await sendPasswordResetEmail({
    email: user.email,
    username: user.username,
    token: reset.token,
    request,
  });
  if (!sent) {
    await prisma.passwordResetToken.deleteMany({
      where: { tokenHash: reset.tokenHash },
    });
  }
  return Response.json(RESPONSE);
}
