"use client";

import { useSyncExternalStore } from "react";
import { SERVER_NOTICE } from "@/lib/serverNotice";

const STORAGE_KEY = "server-notice-dismissed";
const CHANGE_EVENT = "server-notice-dismissed-change";

function subscribe(callback: () => void) {
  window.addEventListener(CHANGE_EVENT, callback);
  return () => window.removeEventListener(CHANGE_EVENT, callback);
}

// 回傳使用者已關閉的公告 id；讀不到（隱私模式等）視為沒關閉。
function getDismissedId(): string | null {
  try {
    return sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export default function ServerNoticeBanner() {
  // 伺服器端先當作「已關閉」，避免水合時閃一下；客戶端再讀 sessionStorage。
  const dismissedId = useSyncExternalStore(subscribe, getDismissedId, () => SERVER_NOTICE.id);

  if (!SERVER_NOTICE.enabled || dismissedId === SERVER_NOTICE.id) return null;

  const dismiss = () => {
    try {
      sessionStorage.setItem(STORAGE_KEY, SERVER_NOTICE.id);
    } catch {
      /* 隱私模式下無法儲存，只關閉這次 */
    }
    window.dispatchEvent(new Event(CHANGE_EVENT));
  };

  return (
    <div
      role="status"
      className="border-b border-[#faa81a]/30 bg-[#faa81a]/10 px-4 py-2 text-sm text-[#faa81a]"
    >
      <div className="mx-auto flex w-full max-w-5xl items-start gap-3">
        <span aria-hidden="true">⚠</span>
        <p className="flex-1 leading-6">
          {SERVER_NOTICE.message}{" "}
          <span className="opacity-70">（錯誤代碼 {SERVER_NOTICE.code}）</span>
        </p>
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
