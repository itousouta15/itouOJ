import { getNavInfo } from "@/lib/nav";
import BottomNavLinks from "@/components/BottomNavLinks";

// 底部導覽列的 server 端入口：讀 session 決定「我的」要連到哪
export default async function BottomNav() {
  const { username, isAdmin, unread, loggedIn } = await getNavInfo();
  return (
    <BottomNavLinks
      username={loggedIn ? username : null}
      isAdmin={isAdmin}
      unread={unread}
    />
  );
}
