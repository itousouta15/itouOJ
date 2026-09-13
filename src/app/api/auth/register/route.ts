import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { clientIp, enforceRateLimit } from "@/lib/rateLimit";
import { isOfflineMode } from "@/lib/offline";
import { verifyTurnstile } from "@/lib/turnstile";

const schema = z.object({
  username: z
    .string()
    .min(3, "使用者名稱至少 3 個字元")
    .max(20, "使用者名稱最多 20 個字元")
    .regex(/^[a-zA-Z0-9_]+$/, "只能使用英數字與底線"),
  password: z.string().min(6, "密碼至少 6 個字元").max(72),
  email: z.string().trim().email("請輸入有效的 Email").optional(),
  turnstileToken: z.string().min(1).max(2048).optional(),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }
  const { username, password, email } = parsed.data;
  if (!isOfflineMode() && !email) {
    return Response.json({ error: "請輸入 recovery email" }, { status: 400 });
  }

  // 註冊帳號每小時每 IP 上限；正常的教室/考場共用 IP 也用不到這麼多組
  const limited = enforceRateLimit(
    `register:${clientIp(request)}`,
    10,
    60 * 60_000
  );
  if (limited) return limited;

  if (!isOfflineMode() && !(await verifyTurnstile(parsed.data.turnstileToken, "register", request))) {
    return Response.json({ error: "安全驗證失敗，請再試一次" }, { status: 403 });
  }

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    return Response.json({ error: "使用者名稱已被使用" }, { status: 400 });
  }

  const user = await prisma.user.create({
    data: {
      username,
      passwordHash: await bcrypt.hash(password, 10),
      email: email?.toLowerCase() ?? null,
      role: "USER",
    },
  });

  await createSession({
    userId: user.id,
    username: user.username,
    role: user.role,
  });
  return Response.json({ ok: true, role: user.role });
}
