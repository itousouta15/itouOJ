"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  useEffect(() => {
    setLastRefreshed(new Date());
    const timer = setInterval(() => {
      router.refresh();
      setLastRefreshed(new Date());
    }, intervalMs);
    return () => clearInterval(timer);
  }, [router, intervalMs]);

  // 避免 SSR/CSR 首次渲染時間不一致
  if (!lastRefreshed || !showLabel) return null;

  return (
    <p className="mono text-xs text-mute">
      每 {Math.round(intervalMs / 1000)} 秒自動更新・上次更新{" "}
      {lastRefreshed.toLocaleTimeString("zh-TW", { hour12: false })}
    </p>
  );
}
