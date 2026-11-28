"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { MAIN_NAV_LINKS, PRACTICE_NAV_LINKS, PUBLIC_RECORD_NAV_LINKS, isNavActive } from "@/lib/navLinks";

export default function NavLinks() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const items = useRef<(HTMLAnchorElement | null)[]>([]);
  const links = [...PRACTICE_NAV_LINKS, ...PUBLIC_RECORD_NAV_LINKS];
  const active = links.some((link) => isNavActive(pathname, link.href));
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);

  return (
    <div className="header-main-links">
      <div ref={root} className="header-practice" onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false);
      }} onKeyDown={(event) => {
        if (event.key === "Escape" && open) { event.preventDefault(); setOpen(false); trigger.current?.focus(); }
      }}>
        <button ref={trigger} type="button" className={`nav-link header-practice-trigger${active ? " active" : ""}`}
          aria-haspopup="menu" aria-expanded={open} aria-controls="practice-navigation"
          onClick={() => setOpen((value) => !value)} onKeyDown={(event) => {
            if (event.key === "ArrowDown" || event.key === "ArrowUp") {
              event.preventDefault(); setOpen(true);
              requestAnimationFrame(() => items.current[event.key === "ArrowUp" ? links.length - 1 : 0]?.focus());
            }
          }}>
          練習
          <svg className="header-practice-chevron" width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false">
            <path d="m4.5 6.25 3.5 3.5 3.5-3.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        {open && <div id="practice-navigation" role="menu" aria-label="練習" className="header-practice-menu">
          <p className="nav-menu-heading">選一種練習方式</p>
          {links.map((link, index) => <Link key={link.href} href={link.href} role="menuitem" aria-label={link.label}
            aria-describedby={`practice-description-${index}`}
            ref={(node) => { items.current[index] = node; }}
            aria-current={isNavActive(pathname, link.href) ? "page" : undefined}
            className={`menu-item${isNavActive(pathname, link.href) ? " active" : ""}${index === PRACTICE_NAV_LINKS.length ? " practice-record-link" : ""}`} onClick={() => setOpen(false)}
            onKeyDown={(event) => {
              let next = index;
              if (event.key === "ArrowDown") next = (index + 1) % links.length;
              else if (event.key === "ArrowUp") next = (index + links.length - 1) % links.length;
              else if (event.key === "Home") next = 0;
              else if (event.key === "End") next = links.length - 1;
              else return;
              event.preventDefault(); items.current[next]?.focus();
            }}>
            <span aria-hidden="true" className="practice-menu-icon">{link.glyph}</span>
            <span className="min-w-0 flex-1"><span className="block font-medium">{link.label}</span><small id={`practice-description-${index}`} className="practice-menu-description">{link.description}</small></span>
            {isNavActive(pathname, link.href) && <span aria-hidden="true" className="practice-menu-current">✓</span>}
          </Link>)}
        </div>}
      </div>
      {MAIN_NAV_LINKS.map((l) => (
        <Link
          key={l.href}
          href={l.href}
            className={`nav-link ${isNavActive(pathname, l.href) ? "active" : ""}`}
            aria-current={isNavActive(pathname, l.href) ? "page" : undefined}
        >
          {l.label}
        </Link>
      ))}
    </div>
  );
}
