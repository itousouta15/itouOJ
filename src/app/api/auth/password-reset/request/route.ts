import { z } from "zod";
import { prisma } from "@/lib/db";
import { clientIp, enforceRateLimit } from "@/lib/rateLimit";
import {
  createPasswordResetToken,
  passwordResetConfigured,
  sendPasswordResetEmail,
} from "@/lib/passwordReset";

const schema = z.object({ email: z.string().trim().max(254).email().transform((email) => email.toLowerCase()) });
const RESPONSE = {
  ok: true,
  message: "若此 Email 有對應的帳號，重設連結將寄到該信箱。",
};

export async function POST(request: Request) {
  const ip = clientIp(request);
  const limited = enforceRateLimit(`password-reset:ip:${ip}`, 5, 15 * 60_000);
  if (limited) return limited;

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "請輸入有效的 Email" }, { status: 400 });
  }
  const emailLimited = enforceRateLimit(
    `password-reset:email:${ip}:${parsed.data.email}`,
    3,
    15 * 60_000,
  );
  if (emailLimited) return emailLimited;
  if (!passwordResetConfigured()) {
    return Response.json({ error: "密碼重設服務暫時無法使用" }, { status: 503 });
  }

  // SQLite 的字串相等區分大小寫；也要能找到 OAuth 留下的混合大小寫 Email。
  // Email 未設唯一限制，同一信箱的每個帳號各有自己的重設連結。
  const users = await prisma.$queryRaw<{ id: string; username: string; email: string }[]>`
    SELECT id, username, email FROM User WHERE LOWER(email) = ${parsed.data.email}
  `;

  for (const user of users) {
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
  }
  return Response.json(RESPONSE);
}
