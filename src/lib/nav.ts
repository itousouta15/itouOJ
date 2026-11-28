import { cache } from "react";
import { prisma } from "@/lib/db";
import { getSession, type Session } from "@/lib/auth";

export interface NavInfo {
  session: Session | null;
  loggedIn: boolean;
  isAdmin: boolean;
  displayName: string | null;
  username: string | null;
  unread: number;
}

// Navbar 與 BottomNav 在同一頁都會渲染，兩邊原本各自查使用者名稱與未讀數
// （每頁 4 個 query）。這裡包成同一份 request 快取，整頁只查 2 個。
export const getNavInfo = cache(async (): Promise<NavInfo> => {
  const session = await getSession();
  if (!session) {
    return {
      session: null,
      loggedIn: false,
      isAdmin: false,
      displayName: null,
      username: null,
      unread: 0,
    };
  }

  const [user, unread] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.userId },
      select: { displayName: true, username: true },
    }),
    prisma.message.count({
      where: { receiverId: session.userId, readAt: null },
    }),
  ]);

  return {
    session,
    loggedIn: true,
    isAdmin: session.role === "ADMIN",
    displayName: user?.displayName ?? null,
    username: user?.username ?? session.username,
    unread,
  };
});
