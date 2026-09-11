"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { isNavActive } from "@/lib/navLinks";

// App 底部導覽列（網站版以 CSS 隱藏）。username 為 null 時「我的」連到登入頁；
// glyph 用幾何字形而非 emoji，各平台都能正常顯示。
const ITEMS: {
  href: string;
  label: string;
  glyph: string;
  dynamic?: boolean;
  adminOnly?: boolean;
  authOnly?: boolean;
  badge?: boolean;
}[] = [
  { href: "/", label: "首頁", glyph: "⌂" },
  { href: "/problems", label: "實作", glyph: "▤" },
  { href: "/recognition", label: "識讀", glyph: "◈" },
  { href: "/submissions", label: "紀錄", glyph: "≣" },
  { href: "/ranking", label: "排行", glyph: "▥" },
  {
    href: "/messages",
    label: "訊息",
    glyph: "✉",
    authOnly: true,
    badge: true,
  },
  { href: "/admin/problems", label: "管理", glyph: "⚙", adminOnly: true },
  { href: "/me", label: "我的", glyph: "◎", dynamic: true },
];

export default function BottomNavLinks({
  username,
  isAdmin,
  unread = 0,
}: {
  username: string | null;
  isAdmin: boolean;
  unread?: number;
}) {
  const pathname = usePathname();

  // 手機鍵盤開啟時 viewport 高度縮小：把狀態掛到 <html>，
  // CSS 用 html.kbd-open 隱藏底部導覽列，避免它浮到鍵盤上方
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    function onResize() {
      const view = window.visualViewport;
      if (!view) return;
      const kbdOpen = view.height < window.innerHeight * 0.72;
      document.documentElement.classList.toggle("kbd-open", kbdOpen);
    }
    vv.addEventListener("resize", onResize);
    return () => vv.removeEventListener("resize", onResize);
  }, []);

  const items = ITEMS.filter(
    (i) => (!i.adminOnly || isAdmin) && (!i.authOnly || username)
  );

  return (
    <nav
      className="bottom-nav fixed inset-x-0 bottom-0 z-[70] flex border-t border-bd2 bg-panel2-a backdrop-blur-xl md:hidden"
      aria-label="主要導覽"
    >
      {items.map((item) => {
        const href = item.dynamic
          ? username
            ? `/users/${username}`
            : "/login"
          : item.href;
        const active = isNavActive(pathname, href);
        const showBadge = item.badge && unread > 0;
        return (
          <Link
            key={item.href}
            href={href}
            className={`bottom-nav-link${active ? " active" : ""}`}
          >
            <span className="relative">
              <span className="bottom-nav-glyph" aria-hidden="true">
                {item.glyph}
              </span>
              {showBadge && (
                <span className="absolute -top-1.5 -right-2.5 rounded-full bg-[#ff6b6b] px-1 text-[9px] font-semibold leading-4 text-white">
                  {unread > 99 ? "99+" : unread}
                </span>
              )}
            </span>
            <span className="bottom-nav-label">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}