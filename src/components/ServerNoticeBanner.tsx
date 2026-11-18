"use client";

import { useEffect, useState } from "react";
import { SERVER_NOTICE } from "@/lib/serverNotice";

const STORAGE_KEY = "server-notice-dismissed";

export default function ServerNoticeBanner() {
  // 先假設已關閉，避免 SSR／水合時閃一下；mount 後再依 sessionStorage 決定。
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!SERVER_NOTICE.enabled) return;
    try {
      setVisible(sessionStorage.getItem(STORAGE_KEY) !== SERVER_NOTICE.id);
    } catch {
      setVisible(true);
    }
  }, []);

  if (!SERVER_NOTICE.enabled || !visible) return null;

  const dismiss = () => {
    setVisible(false);
    try {
      sessionStorage.setItem(STORAGE_KEY, SERVER_NOTICE.id);
    } catch {
      /* 隱私模式下無法儲存，只關閉這次 */
    }
  };

  return (
    <div
      role="status"
      className="border-b border-[#faa81a]/30 bg-[#faa81a]/10 px-4 py-2 text-sm text-[#faa81a]"
    >
      <div className="mx-auto flex w-full max-w-5xl items-start gap-3">
        <span aria-hidden="true">⚠</span>
        <p className="flex-1 leading-6">{SERVER_NOTICE.message}</p>
        <button
          type="button"
          onClick={dismiss}
          aria-label="關閉公告"
          className="shrink-0 px-1 leading-6 hover:opacity-70"
        >
          ×
        </button>
      </div>
    </div>
  );
}
