"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isNavActive } from "@/lib/navLinks";

// 手機版底部導覽列（< md 顯示，App 與手機網頁都會出現）。
// username 由父層 server component 傳入；null = 未登入，「我的」改連到登入頁。
// glyph 用幾何字形（不是 emoji），Android / iOS / 桌面瀏覽器都能正常顯示。
const ITEMS: { href: string; label: string; glyph: string; dynamic?: boolean }[] = [
  { href: "/", label: "首頁", glyph: "⌂" },
  { href: "/problems", label: "題目", glyph: "▤" },
  { href: "/submissions", label: "紀錄", glyph: "≣" },
  { href: "/ranking", label: "排行", glyph: "▥" },
  { href: "/me", label: "我的", glyph: "◎", dynamic: true },
];

export default function BottomNavLinks({
  username,
}: {
  username: string | null;
}) {
  const pathname = usePathname();

  return (
    <nav
      className="bottom-nav fixed inset-x-0 bottom-0 z-[70] flex border-t border-bd2 bg-panel2-a backdrop-blur-xl md:hidden"
      aria-label="主要導覽"
    >
      {ITEMS.map((item) => {
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