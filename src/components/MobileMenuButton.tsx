"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { navLinksFor, isNavActive } from "@/lib/navLinks";

// 同 itousouta.me 手機版選單背景飄浮的顏文字裝飾
const FACES = ["= ᗜ ω ᗜ.=", "(◕ᗜ◕✿)", "( ˘ω˘ )zzz", "ฅ^•ﻌ•^ฅ", "(´,,•ω•,,)"];

export default function MobileMenuButton({ isAdmin }: { isAdmin: boolean }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const links = navLinksFor(isAdmin);

  useEffect(() => setMounted(true), []);
  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
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
            className={`nav-overlay${open ? " is-open" : ""}`}
            role="dialog"
            aria-modal="true"
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
              {links.map((l, i) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`nav-overlay-link${
                    isNavActive(pathname, l.href) ? " active" : ""
                  }`}
                  style={{ "--i": i } as React.CSSProperties}
                  onClick={() => setOpen(false)}
                >
                  <span className="nav-overlay-index">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>,
          document.body
        )}
    </>
  );
}
