import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { createSession } from "@/lib/auth";

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
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return Response.json({ error: "帳號或密碼錯誤" }, { status: 401 });
  }

  await createSession({
    userId: user.id,
    username: user.username,
    role: user.role,
  });
  return Response.json({ ok: true });
}
