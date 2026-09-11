import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import BottomNavLinks from "@/components/BottomNavLinks";

// 底部導覽列的 server 端入口：讀 session 決定「我的」要連到哪
export default async function BottomNav() {
  const session = await getSession();
  const [user, unread] = session
    ? await Promise.all([
        prisma.user.findUnique({
          where: { id: session.userId },
          select: { username: true },
        }),
        prisma.message.count({
          where: { receiverId: session.userId, readAt: null },
        }),
      ])
    : [null, 0];
  return (
    <BottomNavLinks
      username={user?.username ?? null}
      isAdmin={session?.role === "ADMIN"}
      unread={unread}
    />
  );
}