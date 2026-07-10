"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AccountMenu({ name }: { name: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
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
    <div ref={rootRef} className="relative">
      <button
        className="flex cursor-pointer items-center gap-1.5 rounded-full border border-bd2 bg-inset py-1.5 pr-3 pl-4 transition-colors hover:border-[#8f9dc9]"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="mono max-w-32 truncate text-sm font-medium text-tx">
          {name}
        </span>
        <span
          className={`text-[10px] text-mute transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        >
          ▼
        </span>
      </button>

      {open && (
        <div className="menu-panel" role="menu">
          <Link
            href="/settings"
            className="menu-item"
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            帳號設定
          </Link>
          <div className="menu-sep" />
          <button
            className="menu-item text-[#ff6b6b] hover:text-[#ff6b6b]"
            role="menuitem"
            onClick={logout}
          >
            登出
          </button>
        </div>
      )}
    </div>
  );
}
