import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { clientIp, enforceRateLimit } from "@/lib/rateLimit";
import { hashPasswordResetToken } from "@/lib/passwordReset";

const schema = z.object({
  token: z.string().regex(/^[a-f0-9]{64}$/, "重設連結無效或已過期"),
  newPassword: z.string().min(6, "密碼至少 6 個字元").max(72),
});

export async function POST(request: Request) {
  const limited = enforceRateLimit(`password-reset-confirm:${clientIp(request)}`, 10, 15 * 60_000);
  if (limited) return limited;

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const tokenHash = hashPasswordResetToken(parsed.data.token);
  const changed = await prisma.$transaction(async (tx) => {
    const reset = await tx.passwordResetToken.findFirst({
      where: { tokenHash, expiresAt: { gt: new Date() } },
      select: { id: true, userId: true },
    });
    if (!reset) return false;

    const consumed = await tx.passwordResetToken.deleteMany({
      where: { id: reset.id, expiresAt: { gt: new Date() } },
    });
    if (consumed.count !== 1) return false;

    await tx.user.update({
      where: { id: reset.userId },
      data: {
        passwordHash: await bcrypt.hash(parsed.data.newPassword, 10),
        sessionVersion: { increment: 1 },
      },
    });
    await tx.passwordResetToken.deleteMany({ where: { userId: reset.userId } });
    return true;
  });
  if (!changed) {
    return Response.json({ error: "重設連結無效或已過期" }, { status: 400 });
  }
  return Response.json({ ok: true });
}
