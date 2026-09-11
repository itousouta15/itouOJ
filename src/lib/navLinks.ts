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
  { href: "/search", label: "搜尋" },
];

// Header 的導覽列只放公開頁面；訊息屬於個人功能，入口在頭像選單
// （AccountMenu）與 App 底部導覽（BottomNavLinks）。
export function navLinksFor(isAdmin: boolean): NavLinkItem[] {
  const links = [...BASE_NAV_LINKS];
  if (isAdmin) links.push({ href: "/admin/problems", label: "管理" });
  return links;
}

export function isNavActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  if (href.startsWith("/admin")) return pathname.startsWith("/admin");
  return pathname.startsWith(href);
}
