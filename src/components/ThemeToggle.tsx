"use client";

import { useEffect, useSyncExternalStore } from "react";
import { syncStatusBar } from "@/lib/capacitor";

// 主題掛在 <html data-theme> 上，是元件外的狀態；用 useSyncExternalStore
// 訂閱它，切換時改 DOM 後通知重繪，不需要 effect + setState。
const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function getSnapshot() {
  return document.documentElement.getAttribute("data-theme") === "light";
}

function setTheme(next: boolean) {
  if (next) {
    document.documentElement.setAttribute("data-theme", "light");
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
  try {
    localStorage.setItem("oj-theme", next ? "light" : "dark");
  } catch {}
  syncStatusBar(!next);
  for (const cb of listeners) cb();
}

export default function ThemeToggle() {
  const light = useSyncExternalStore(subscribe, getSnapshot, () => false);

  useEffect(() => {
    // App 內：啟動時讓狀態列跟上網站主題
    syncStatusBar(!getSnapshot());
  }, []);

  return (
    <button
      className="theme-btn"
      onClick={() => setTheme(!getSnapshot())}
      aria-label="切換主題"
    >
      {light ? "☀" : "☾"}
    </button>
  );
}
