export interface NavLinkItem {
  href: string;
  label: string;
  glyph?: string;
  description?: string;
}

export interface NavGroup { label: string; links: NavLinkItem[] }

export const PRACTICE_NAV_LINKS: NavLinkItem[] = [
  { href: "/problems", label: "實作練習", glyph: "▤", description: "寫程式，挑戰每一道題目" },
  { href: "/playground", label: "自由寫程式", glyph: "⌘", description: "自由編寫程式，立即執行看結果" },
  { href: "/recognition", label: "識讀練習", glyph: "◈", description: "閱讀程式，練習 APCS 觀念" },
  { href: "/ctf", label: "CTF 練習", glyph: "⚑", description: "探索線索，解開資安挑戰" },
];

export const MAIN_NAV_LINKS: NavLinkItem[] = [
  { href: "/courses", label: "課程", glyph: "▧" },
  { href: "/contests", label: "比賽", glyph: "◇" },
  { href: "/ranking", label: "排行", glyph: "▥" },
];

export const PUBLIC_RECORD_NAV_LINKS: NavLinkItem[] = [
  { href: "/submissions", label: "全站提交紀錄", glyph: "≣", description: "看看大家最近的解題結果" },
];

export function accountNavGroups(username: string, isAdmin: boolean): NavGroup[] {
  return [
    { label: "帳號", links: [
      { href: `/users/${encodeURIComponent(username)}`, label: "個人頁面", glyph: "◎" },
      { href: "/messages", label: "站內訊息", glyph: "✉" },
      { href: "/settings", label: "帳號設定", glyph: "⚙" },
    ] },
    { label: "紀錄與動態", links: [
      { href: "/submissions?mine=1", label: "程式／識讀紀錄", glyph: "≣" },
      { href: "/ctf/history", label: "CTF 提交紀錄", glyph: "⚑" },
      { href: "/activity", label: "解題動態", glyph: "↗" },
    ] },
    ...(isAdmin ? [{ label: "管理", links: [
      { href: "/admin/problems", label: "管理後台", glyph: "⚙" },
      { href: "/admin/judge", label: "評測監控", glyph: "◷" },
      { href: "/admin/services", label: "伺服器服務", glyph: "▣" },
      { href: "/admin/hosts", label: "Server 管理", glyph: "▥" },
      { href: "/admin/deployment", label: "GitHub 部署", glyph: "↻" },
    ] }] : []),
  ];
}

export function navLinksFor(isAdmin: boolean): NavLinkItem[] {
  return [
    { href: "/problems", label: "實作" },
    { href: "/playground", label: "自由寫程式" },
    { href: "/recognition", label: "識讀" },
    { href: "/ctf", label: "CTF" },
    { href: "/courses", label: "課程" },
    { href: "/contests", label: "比賽" },
    { href: "/submissions", label: "紀錄" },
    { href: "/ranking", label: "排行" },
    { href: "/activity", label: "動態" },
    ...(isAdmin ? [
      { href: "/admin/problems", label: "管理" },
      { href: "/admin/judge", label: "評測監控" },
      { href: "/admin/services", label: "伺服器" },
      { href: "/admin/hosts", label: "Server 管理" },
      { href: "/admin/deployment", label: "部署" },
    ] : []),
  ];
}

// The App catalog uses the same groups as the desktop navigation and account menu.
export function mobileNavGroups(username: string | null, isAdmin: boolean): NavGroup[] {
  return [
    { label: "練習", links: PRACTICE_NAV_LINKS },
    { label: "課程與比賽", links: MAIN_NAV_LINKS },
    { label: "公開紀錄", links: PUBLIC_RECORD_NAV_LINKS },
    ...(username ? accountNavGroups(username, isAdmin) : [{ label: "帳號", links: [
      { href: "/login", label: "登入", glyph: "→" },
      { href: "/register", label: "註冊", glyph: "+" },
    ] }]),
  ];
}

export function isNavActive(pathname: string, href: string): boolean {
  const base = href.split("?")[0];
  if (base === "/") return pathname === "/";
  if (base === "/admin/problems") return pathname === "/admin" || (pathname.startsWith("/admin/") &&
    !pathname.startsWith("/admin/judge") && !pathname.startsWith("/admin/services") &&
    !pathname.startsWith("/admin/hosts") && !pathname.startsWith("/admin/deployment"));
  return pathname === base || pathname.startsWith(`${base}/`);
}
