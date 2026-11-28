"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMounted } from "@/lib/useMounted";

// 給監考巡場頁面（例如參賽者狀態）用的定期重新整理，不用一直按 F5。
// router.refresh() 只重跑 server component，不會整頁閃一下。
export default function AutoRefresh({
  intervalMs = 5000,
  showLabel = true,
}: {
  intervalMs?: number;
  // 聊天這種不需要「上次更新」文字的地方可以關掉，只保留定期 refresh
  showLabel?: boolean;
}) {
  const router = useRouter();
  const mounted = useMounted();
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
    let active = !document.hidden && navigator.onLine;
    const refresh = () => {
      if (document.hidden || !navigator.onLine) return;
      router.refresh();
      if (showLabel) setLastRefreshed(new Date());
    };
    const updateActivity = () => {
      const next = !document.hidden && navigator.onLine;
      if (next === active) return;
      active = next;
      clearInterval(timer);
      timer = undefined;
      if (active) {
        refresh();
        timer = setInterval(refresh, intervalMs);
      }
    };
    if (active) timer = setInterval(refresh, intervalMs);
    document.addEventListener("visibilitychange", updateActivity);
    window.addEventListener("online", updateActivity);
    window.addEventListener("offline", updateActivity);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", updateActivity);
      window.removeEventListener("online", updateActivity);
      window.removeEventListener("offline", updateActivity);
    };
  }, [router, intervalMs, showLabel]);

  // 避免 SSR/CSR 首次渲染時間不一致
  if (!mounted || !showLabel) return null;

  return (
    <p className="mono text-xs text-mute">
      每 {Math.round(intervalMs / 1000)} 秒自動更新・上次更新{" "}
      {lastRefreshed
        ? lastRefreshed.toLocaleTimeString("zh-TW", { hour12: false })
        : "剛載入"}
    </p>
  );
}
