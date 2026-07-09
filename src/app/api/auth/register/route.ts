import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { createSession } from "@/lib/auth";

const schema = z.object({
  username: z
    .string()
    .min(3, "使用者名稱至少 3 個字元")
    .max(20, "使用者名稱最多 20 個字元")
    .regex(/^[a-zA-Z0-9_]+$/, "只能使用英數字與底線"),
  password: z.string().min(6, "密碼至少 6 個字元").max(72),
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
  const { username, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    return Response.json({ error: "使用者名稱已被使用" }, { status: 400 });
  }

  // 第一個註冊的使用者自動成為管理員
  const userCount = await prisma.user.count();
  const user = await prisma.user.create({
    data: {
      username,
      passwordHash: await bcrypt.hash(password, 10),
      role: userCount === 0 ? "ADMIN" : "USER",
    },
  });

  await createSession({
    userId: user.id,
    username: user.username,
    role: user.role,
  });
  return Response.json({ ok: true, role: user.role });
}
