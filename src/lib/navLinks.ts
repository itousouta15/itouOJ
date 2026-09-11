export interface NavLinkItem {
  href: string;
  label: string;
}

const BASE_NAV_LINKS: NavLinkItem[] = [
  { href: "/problems", label: "實作" },
  { href: "/recognition", label: "識讀" },
  { href: "/courses", label: "課程" },
  { href: "/contests", label: "比賽" },
  { href: "/submissions", label: "紀錄" },
  { href: "/ranking", label: "排行" },
];

export interface NavOptions {
  loggedIn?: boolean;
  // 站內訊息未讀數；> 0 時「訊息」旁邊直接顯示數字
  unreadMessages?: number;
}

export function navLinksFor(
  isAdmin: boolean,
  options: NavOptions = {}
): NavLinkItem[] {
  const links = [...BASE_NAV_LINKS];
  if (options.loggedIn) {
    const unread = options.unreadMessages ?? 0;
    links.push({
      href: "/messages",
      label: unread > 0 ? `訊息 (${unread})` : "訊息",
    });
  }
  if (isAdmin) links.push({ href: "/admin/problems", label: "管理" });
  return links;
}

export function isNavActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  if (href.startsWith("/admin")) return pathname.startsWith("/admin");
  return pathname.startsWith(href);
}
