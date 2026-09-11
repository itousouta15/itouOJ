"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { isNavActive } from "@/lib/navLinks";

const MAIN_ITEMS = [
  { href: "/", label: "首頁", glyph: "⌂" },
  { href: "/problems", label: "實作", glyph: "▤" },
  { href: "/recognition", label: "識讀", glyph: "◈" },
  { href: "/submissions", label: "紀錄", glyph: "≣" },
  { href: "/ranking", label: "排行", glyph: "▥" },
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
  const [moreOpen, setMoreOpen] = useState(false);
  const moreButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const wasMoreOpen = useRef(false);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    function updateKeyboardState() {
      const currentViewport = window.visualViewport;
      if (!currentViewport) return;
      const keyboardOpen = currentViewport.height < window.innerHeight * 0.72;
      document.documentElement.classList.toggle("kbd-open", keyboardOpen);
    }

    viewport.addEventListener("resize", updateKeyboardState);
    return () => viewport.removeEventListener("resize", updateKeyboardState);
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (moreOpen && !dialog.open) {
      dialog.showModal();
      requestAnimationFrame(() => closeButtonRef.current?.focus());
    } else if (!moreOpen && dialog.open) {
      dialog.close();
    }

    if (!moreOpen && wasMoreOpen.current) {
      moreButtonRef.current?.focus();
    }
    wasMoreOpen.current = moreOpen;
  }, [moreOpen]);

  const accountHref = username ? `/users/${username}` : "/login";
  const moreActive =
    pathname.startsWith("/messages") ||
    pathname.startsWith("/admin") ||
    isNavActive(pathname, accountHref);
  const closeMore = () => setMoreOpen(false);

  return (
    <>
      <nav
        className="bottom-nav fixed inset-x-0 bottom-0 z-[70] flex border-t border-bd2 bg-panel2-a backdrop-blur-xl md:hidden"
        aria-label="主要導覽"
      >
        {MAIN_ITEMS.map((item) => {
          const active = isNavActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`bottom-nav-link${active ? " active" : ""}`}
            >
              <span className="bottom-nav-glyph" aria-hidden="true">
                {item.glyph}
              </span>
              <span className="bottom-nav-label">{item.label}</span>
            </Link>
          );
        })}
        <button
          ref={moreButtonRef}
          type="button"
          className={`bottom-nav-link${moreActive ? " active" : ""}`}
          onClick={() => setMoreOpen(true)}
          aria-expanded={moreOpen}
          aria-controls="app-more-nav"
        >
          <span className="relative">
            <span className="bottom-nav-glyph bottom-nav-more-glyph" aria-hidden="true">
              ⋯
            </span>
            {unread > 0 && (
              <span className="absolute -top-1.5 -right-2.5 rounded-full bg-[#ff6b6b] px-1 text-[9px] font-semibold leading-4 text-white">
                {unread > 99 ? "99+" : unread}
              </span>
            )}
          </span>
          <span className="bottom-nav-label">更多</span>
        </button>
      </nav>

      <dialog
        ref={dialogRef}
        id="app-more-nav"
        className="app-more-dialog"
        aria-labelledby="app-more-nav-title"
        onCancel={(event) => {
          event.preventDefault();
          closeMore();
        }}
        onClose={closeMore}
        onClick={(event) => {
          if (event.target === event.currentTarget) closeMore();
        }}
      >
        <div className="app-more-sheet">
          <div className="app-more-sheet-head">
            <h2 id="app-more-nav-title">更多</h2>
            <button
              ref={closeButtonRef}
              type="button"
              className="theme-btn"
              aria-label="關閉更多選單"
              onClick={closeMore}
            >
              ×
            </button>
          </div>
          <nav aria-label="更多功能" className="app-more-links">
            {username ? (
              <>
                <Link href="/messages" onClick={closeMore} className="app-more-link">
                  <span aria-hidden="true">✉</span>
                  訊息
                  {unread > 0 && (
                    <span className="app-more-unread">
                      {unread > 99 ? "99+" : unread}
                    </span>
                  )}
                </Link>
                <Link href={accountHref} onClick={closeMore} className="app-more-link">
                  <span aria-hidden="true">◎</span>
                  我的帳號
                </Link>
                {isAdmin && (
                  <Link href="/admin/problems" onClick={closeMore} className="app-more-link">
                    <span aria-hidden="true">⚙</span>
                    管理
                  </Link>
                )}
              </>
            ) : (
              <Link href="/login" onClick={closeMore} className="app-more-link">
                <span aria-hidden="true">→</span>
                登入
              </Link>
            )}
          </nav>
        </div>
      </dialog>
    </>
  );
}
