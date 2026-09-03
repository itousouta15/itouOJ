"use client";

import { useEffect, useState } from "react";
import { scheduleContestReminder } from "@/lib/capacitor";

function formatRemaining(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s
    .toString()
    .padStart(2, "0")}`;
}

// startTime/endTime 用 ISO 字串傳入（server component 算好，這裡只負責每秒 tick）
export default function ContestCountdown({
  startTime,
  endTime,
  contestId,
  contestTitle,
}: {
  startTime: string;
  endTime: string;
  contestId?: number;
  contestTitle?: string;
}) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // App 內看比賽頁時，排一個「開賽前提醒」的本地通知（同一場不會重複排）
  useEffect(() => {
    if (contestId && contestTitle) {
      scheduleContestReminder({
        contestId,
        title: contestTitle,
        startTime,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contestId, contestTitle]);

  // 避免 SSR/CSR 首次渲染時間不一致，第一次 render 前不顯示
  if (now === null) return null;

  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();

  if (now < start) {
    return (
      <p className="mono text-sm text-dim">
        距離開始還有 <span className="text-tx">{formatRemaining(start - now)}</span>
      </p>
    );
  }
  if (now < end) {
    return (
      <p className="mono text-sm text-dim">
        距離結束還有 <span className="text-tx">{formatRemaining(end - now)}</span>
      </p>
    );
  }
  return <p className="mono text-sm text-mute">比賽已結束</p>;
}