"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { accountNavGroups } from "@/lib/navLinks";

export default function AccountMenu({
  name,
  username,
  unread = 0,
  isAdmin = false,
}: {
  name: string;
  username: string;
  unread?: number;
  isAdmin?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLAnchorElement | HTMLButtonElement | null)[]>([]);
  const groups = accountNavGroups(username, isAdmin);
  let itemIndex = 0;
  const itemCount = groups.reduce((count, group) => count + group.links.length, 0) + 1;
  function itemKeys(event: React.KeyboardEvent, index: number) {
    let next = index;
    if (event.key === "ArrowDown") next = (index + 1) % itemCount;
    else if (event.key === "ArrowUp") next = (index + itemCount - 1) % itemCount;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = itemCount - 1;
    else return;
    event.preventDefault(); itemRefs.current[next]?.focus();
  }

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") { setOpen(false); triggerRef.current?.focus(); }
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  async function logout() {
    setOpen(false);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <div ref={rootRef} className="relative" onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false);
    }}>
      <button
        ref={triggerRef}
        className="account-trigger flex cursor-pointer items-center gap-1.5 rounded-full border border-bd2 bg-inset py-1.5 pr-3 pl-4 transition-colors hover:border-[#8f9dc9]"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="account-navigation"
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault(); setOpen(true);
            requestAnimationFrame(() => itemRefs.current[event.key === "ArrowUp" ? itemCount - 1 : 0]?.focus());
          }
        }}
      >
        <span className="account-name mono max-w-16 truncate text-sm font-medium text-tx sm:max-w-32">
          {name}
        </span>
        {unread > 0 && (
          <span className="rounded-full bg-[#ff6b6b] px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white">
            {unread}
          </span>
        )}
        <span
          className={`text-[10px] text-mute transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        >
          ▼
        </span>
      </button>

      {open && (
        <div id="account-navigation" className="menu-panel account-navigation" role="menu" aria-label="帳號功能">
          {groups.map((group) => <div key={group.label} role="group" aria-label={group.label}>
            <p className="nav-menu-heading">{group.label}</p>
            {group.links.map((link) => {
              const index = itemIndex++;
              return <Link key={link.href} href={link.href} className="menu-item" role="menuitem"
                ref={(node) => { itemRefs.current[index] = node; }} onKeyDown={(event) => itemKeys(event, index)} onClick={() => setOpen(false)}>
                <span aria-hidden="true">{link.glyph}</span><span className="flex-1">{link.label}</span>
                {link.href === "/messages" && unread > 0 && <span className="rounded-full bg-[#ff6b6b] px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white">{unread > 99 ? "99+" : unread}</span>}
              </Link>;
            })}
          </div>)}
          <div className="menu-sep" />
          <button
            className="menu-item text-[#ff6b6b] hover:text-[#ff6b6b]"
            role="menuitem"
            ref={(node) => { itemRefs.current[itemCount - 1] = node; }}
            onKeyDown={(event) => itemKeys(event, itemCount - 1)}
            onClick={logout}
          >
            登出
          </button>
        </div>
      )}
    </div>
  );
}
