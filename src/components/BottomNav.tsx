import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import BottomNavLinks from "@/components/BottomNavLinks";

// 底部導覽列的 server 端入口：讀 session 決定「我的」要連到哪
export default async function BottomNav() {
  const session = await getSession();
  let username: string | null = null;
  if (session) {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { username: true },
    });
    username = user?.username ?? null;
  }
  return (
    <BottomNavLinks
      username={username}
      isAdmin={session?.role === "ADMIN"}
    />
  );
}