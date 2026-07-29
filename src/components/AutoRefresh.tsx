"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// 給監考巡場用的頁面（例如參賽者狀態）：定期重新整理，不用自己一直按 F5
// 才看得到最新的就緒回報。router.refresh() 只重新跑 server component，
// 不會整頁閃一下重載。
export default function AutoRefresh({ intervalMs = 5000 }: { intervalMs?: number }) {
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
  if (!lastRefreshed) return null;

  return (
    <p className="mono text-xs text-mute">
      每 {Math.round(intervalMs / 1000)} 秒自動更新・上次更新{" "}
      {lastRefreshed.toLocaleTimeString("zh-TW", { hour12: false })}
    </p>
  );
}
