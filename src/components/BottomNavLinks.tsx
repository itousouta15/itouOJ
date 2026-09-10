"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { isNavActive } from "@/lib/navLinks";

// App 底部導覽列（網站版由 CSS 隱藏）。username 由父層 server component
// 傳入；null = 未登入，「我的」改連到登入頁。glyph 用幾何字形（不是
// emoji），Android / iOS / 桌面瀏覽器都能正常顯示。
const ITEMS: {
  href: string;
  label: string;
  glyph: string;
  dynamic?: boolean;
  adminOnly?: boolean;
}[] = [
  { href: "/", label: "首頁", glyph: "⌂" },
  { href: "/problems", label: "題目", glyph: "▤" },
  { href: "/recognition", label: "識別", glyph: "◈" },
  { href: "/submissions", label: "紀錄", glyph: "≣" },
  { href: "/ranking", label: "排行", glyph: "▥" },
  { href: "/admin/problems", label: "管理", glyph: "⚙", adminOnly: true },
  { href: "/me", label: "我的", glyph: "◎", dynamic: true },
];

export default function BottomNavLinks({
  username,
  isAdmin,
}: {
  username: string | null;
  isAdmin: boolean;
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

  const items = ITEMS.filter((i) => !i.adminOnly || isAdmin);

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
        return (
          <Link
            key={item.href}
            href={href}
            className={`bottom-nav-link${active ? " active" : ""}`}
          >
            <span className="bottom-nav-glyph" aria-hidden="true">
              {item.glyph}
            </span>
            <span className="bottom-nav-label">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}