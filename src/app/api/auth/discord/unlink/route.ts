import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST() {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "請先登入" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) {
    return Response.json({ error: "請先登入" }, { status: 401 });
  }
  if (!user.discordId) {
    return Response.json({ error: "尚未連結 Discord 帳號" }, { status: 400 });
  }
  if (!user.passwordHash && !user.googleId) {
    return Response.json(
      { error: "至少要保留一種登入方式，請先設定密碼或連結其他帳號" },
      { status: 400 }
    );
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { discordId: null },
  });
  return Response.json({ ok: true });
}
