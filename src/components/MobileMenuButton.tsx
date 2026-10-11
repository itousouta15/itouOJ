"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { navLinksFor, isNavActive } from "@/lib/navLinks";
import { useMounted } from "@/lib/useMounted";
import { lockBodyScroll } from "@/lib/bodyScrollLock";

// 同 itousouta.me 手機版選單背景飄浮的顏文字裝飾
const FACES = ["= ᗜ ω ᗜ.=", "(◕ᗜ◕✿)", "( ˘ω˘ )zzz", "ฅ^•ﻌ•^ฅ", "(´,,•ω•,,)"];

export default function MobileMenuButton({
  isAdmin,
}: {
  isAdmin: boolean;
}) {
  const [open, setOpen] = useState(false);
  const mounted = useMounted();
  const pathname = usePathname();
  const links = navLinksFor(isAdmin);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // 導覽後由每個 Link 的 onClick 關閉選單，不需要再用 pathname 的 effect 關一次
  useEffect(() => {
    if (!open) return;
    const unlock = lockBodyScroll();
    const trigger = triggerRef.current;
    overlayRef.current?.querySelector<HTMLElement>('a[href]')?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); setOpen(false); }
      if (e.key === "Tab") {
        const overlayTargets = overlayRef.current?.querySelectorAll<HTMLElement>('a[href]');
        if (!trigger || !overlayTargets?.length) return;
        const targets = [trigger, ...overlayTargets];
        const current = targets.findIndex((target) => target === document.activeElement);
        const next = (current + (e.shiftKey ? -1 : 1) + targets.length) % targets.length;
        e.preventDefault();
        targets[next].focus();
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
      {mounted &&
        createPortal(
          <div
            id="mobile-nav-overlay"
            ref={overlayRef}
            className={`nav-overlay${open ? " is-open" : ""}`}
            role="dialog"
            aria-modal={open ? true : undefined}
            aria-hidden={!open}
            inert={!open}
            aria-label="主選單"
          >
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
            <nav className="nav-overlay-links" aria-label="主要導覽">
              {links.map((link, index) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`nav-overlay-link${isNavActive(pathname, link.href) ? " active" : ""}`}
                  aria-current={isNavActive(pathname, link.href) ? "page" : undefined}
                  style={{ "--i": index } as React.CSSProperties}
                  onClick={() => setOpen(false)}
                >
                  <span aria-hidden="true" className="nav-overlay-index">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>,
          document.body
        )}
    </>
  );
}
