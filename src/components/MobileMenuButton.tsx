"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { mobileNavGroups, isNavActive } from "@/lib/navLinks";
import { useMounted } from "@/lib/useMounted";
import { lockBodyScroll } from "@/lib/bodyScrollLock";

// 同 itousouta.me 手機版選單背景飄浮的顏文字裝飾
const FACES = ["= ᗜ ω ᗜ.=", "(◕ᗜ◕✿)", "( ˘ω˘ )zzz", "ฅ^•ﻌ•^ฅ", "(´,,•ω•,,)"];

export default function MobileMenuButton({
  isAdmin,
  username,
}: {
  isAdmin: boolean;
  username: string | null;
}) {
  const [open, setOpen] = useState(false);
  const mounted = useMounted();
  const pathname = usePathname();
  const groups = mobileNavGroups(username, isAdmin);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // 導覽後由每個 Link 的 onClick 關閉選單，不需要再用 pathname 的 effect 關一次
  useEffect(() => {
    if (!open) return;
    const unlock = lockBodyScroll();
    const trigger = triggerRef.current;
    closeRef.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); setOpen(false); }
      if (e.key === "Tab") {
        const targets = overlayRef.current?.querySelectorAll<HTMLElement>('a[href], button:not(:disabled)');
        if (!targets?.length) return;
        const first = targets[0], last = targets[targets.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      unlock();
      window.removeEventListener("keydown", onKey);
      trigger?.focus({ preventScroll: true });
    };
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        className={`nav-toggle${open ? " is-open" : ""}`}
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "關閉選單" : "開啟選單"}
        aria-expanded={open}
        aria-controls="mobile-nav-overlay"
      >
        <span className="nav-toggle-bar" />
        <span className="nav-toggle-bar" />
      </button>

      {/* 用 portal 掛到 body：.site-header 有 backdrop-filter 會產生新的
          定位上下文，若遮罩放在 header 裡面，position:fixed 只會蓋滿
          header 的框框，蓋不滿整個畫面。 */}
      {mounted && open &&
        createPortal(
          <div
            id="mobile-nav-overlay"
            ref={overlayRef}
            className="nav-overlay nav-overlay--grouped is-open"
            role="dialog"
            aria-modal="true"
            aria-label="主選單"
          >
            <button ref={closeRef} type="button" className="nav-overlay-close theme-btn" aria-label="關閉主選單" onClick={() => setOpen(false)}>×</button>
            <div className="nav-overlay-faces" aria-hidden="true">
              {FACES.map((f, i) => (
                <span
                  key={i}
                  className={`nav-overlay-face nav-overlay-face--${i}`}
                >
                  {f}
                </span>
              ))}
            </div>
            <nav className="nav-overlay-links nav-overlay-links--grouped" aria-label="主要導覽">
              {groups.map((group, groupIndex) => <section key={group.label} aria-label={group.label}>
                <h2 className="nav-menu-heading">{group.label}</h2>
                <div className="flex flex-col gap-3">{group.links.map((link, index) => <Link key={link.href} href={link.href}
                  className={`nav-overlay-link${isNavActive(pathname, link.href) ? " active" : ""}`}
                  aria-current={isNavActive(pathname, link.href) ? "page" : undefined}
                  style={{ "--i": groupIndex + index } as React.CSSProperties} onClick={() => setOpen(false)}>
                  <span aria-hidden="true" className="nav-overlay-index">{link.glyph}</span>{link.label}
                </Link>)}</div>
              </section>)}
            </nav>
          </div>,
          document.body
        )}
    </>
  );
}
