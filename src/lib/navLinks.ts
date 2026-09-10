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

export function navLinksFor(isAdmin: boolean): NavLinkItem[] {
  return isAdmin
    ? [...BASE_NAV_LINKS, { href: "/admin/problems", label: "管理" }]
    : BASE_NAV_LINKS;
}

export function isNavActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  if (href.startsWith("/admin")) return pathname.startsWith("/admin");
  return pathname.startsWith(href);
}
