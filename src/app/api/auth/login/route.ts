import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { isOfflineMode } from "@/lib/offline";

const schema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "請輸入帳號與密碼" }, { status: 400 });
  }
  const { username, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { username } });
  if (user && !user.passwordHash) {
    // 斷網比賽時 OAuth 按鈕是隱藏的，叫選手「改用 Google 按鈕」只會讓他們卡住；
    // 這種情況要找管理員用 scripts/contest-accounts.mjs 補一組密碼。
    const provider = user.discordId && !user.googleId ? "Discord" : "Google";
    return Response.json(
      {
        error: isOfflineMode()
          ? "此帳號還沒有設定密碼，請找管理員協助設定"
          : `此帳號使用 ${provider} 登入，請改用 ${provider} 按鈕`,
      },
      { status: 401 }
    );
  }
  if (
    !user ||
    !user.passwordHash ||
    !(await bcrypt.compare(password, user.passwordHash))
  ) {
    return Response.json({ error: "帳號或密碼錯誤" }, { status: 401 });
  }

  await createSession({
    userId: user.id,
    username: user.username,
    role: user.role,
  });
  return Response.json({ ok: true });
}
