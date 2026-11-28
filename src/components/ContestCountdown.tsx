"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
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

// 每秒 tick 的共用時鐘。useSyncExternalStore 要求 snapshot 在兩次讀取間穩定，
// 所以在模組層級記住時間、由 interval 更新後通知訂閱者；元件 render 期間
// 不呼叫 Date.now()（React Compiler 會擋 impure function）。
let clockNow = 0;
let clockTimer: ReturnType<typeof setInterval> | null = null;
const clockListeners = new Map<() => void, number>();
let watchingVisibility = false;

function syncClockTimer() {
  if ((document.hidden || clockListeners.size === 0) && clockTimer !== null) {
    clearInterval(clockTimer);
    clockTimer = null;
  } else if (!document.hidden && clockListeners.size > 0 && clockTimer === null) {
    clockTimer = setInterval(tickClock, 1000);
  }
  if (clockListeners.size === 0 && watchingVisibility) {
    document.removeEventListener("visibilitychange", clockVisibilityChanged);
    watchingVisibility = false;
  }
}

function tickClock() {
  clockNow = Date.now();
  for (const [listener, end] of clockListeners) {
    if (clockNow >= end) clockListeners.delete(listener);
    listener();
  }
  syncClockTimer();
}

function clockVisibilityChanged() {
  if (!document.hidden) tickClock();
  else syncClockTimer();
}

function subscribeClock(cb: () => void, end: number) {
  tickClock();
  if (clockNow >= end) return () => {};
  clockListeners.set(cb, end);
  if (!watchingVisibility) {
    document.addEventListener("visibilitychange", clockVisibilityChanged);
    watchingVisibility = true;
  }
  syncClockTimer();
  return () => {
    clockListeners.delete(cb);
    syncClockTimer();
  };
}

const getClockServerSnapshot = () => 0;

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
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  const subscribe = useCallback((callback: () => void) => subscribeClock(callback, end), [end]);
  const getSnapshot = useCallback(() => clockNow === 0 ? 0 : Math.min(clockNow, end), [end]);
  const now = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getClockServerSnapshot
  );

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

  // 避免 SSR/CSR 首次渲染時間不一致，掛載完成前不顯示
  if (now === 0) return null;

  if (now < start) {
    return (
      <p className="mono text-sm text-dim">
        距離開始還有{" "}
        <span className="text-tx">{formatRemaining(start - now)}</span>
      </p>
    );
  }
  if (now < end) {
    return (
      <p className="mono text-sm text-dim">
        距離結束還有{" "}
        <span className="text-tx">{formatRemaining(end - now)}</span>
      </p>
    );
  }
  return <p className="mono text-sm text-mute">比賽已結束</p>;
}
