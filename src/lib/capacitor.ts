import { Capacitor } from "@capacitor/core";

// Capacitor 原生相關輔助。所有外掛都動態 import，確保 SSR / 一般瀏覽器
// 下不會被拉到（外掛模組在伺服器端 import 會踩到 window）。

export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform();
}

// 狀態列顏色跟隨網站亮暗主題（淺色狀態列配深色文字，反之亦然）
export async function syncStatusBar(dark: boolean) {
  if (!isNativeApp()) return;
  const { StatusBar, Style } = await import("@capacitor/status-bar");
  await StatusBar.setStyle({ style: dark ? Style.Dark : Style.Light });
  await StatusBar.setBackgroundColor({
    color: dark ? "#1b1e23" : "#e9e9ee",
  });
}

export async function ensureNotificationPermission(): Promise<boolean> {
  if (!isNativeApp()) return false;
  const { LocalNotifications } = await import("@capacitor/local-notifications");
  const perm = await LocalNotifications.checkPermissions();
  if (perm.display === "granted") return true;
  if (perm.display === "prompt" || perm.display === "prompt-with-rationale") {
    const req = await LocalNotifications.requestPermissions();
    return req.display === "granted";
  }
  return false;
}

export async function scheduleContestReminder(opts: {
  contestId: number;
  title: string;
  startTime: string;
  leadMinutes?: number;
}) {
  if (!isNativeApp()) return;
  const lead = opts.leadMinutes ?? 10;
  const start = new Date(opts.startTime).getTime();
  const at = start - lead * 60 * 1000;
  if (at <= Date.now()) return;

  // 同一場比賽不要重複排程
  const key = `oj-reminder-${opts.contestId}`;
  try {
    if (localStorage.getItem(key)) return;
  } catch {}

  const ok = await ensureNotificationPermission();
  if (!ok) return;

  const { LocalNotifications } = await import("@capacitor/local-notifications");
  await LocalNotifications.schedule({
    notifications: [
      {
        id: opts.contestId,
        title: `「${opts.title}」即將開始`,
        body: `再 ${lead} 分鐘就要開賽了，記得提早登入備戰！`,
        schedule: { at: new Date(at) },
        // Android 通知要設小圖示才不會掉圖（用 app 本身的 launcher icon）
        smallIcon: "ic_launcher_foreground",
        iconColor: "#94a6cc",
      },
    ],
  });
  try {
    localStorage.setItem(key, "1");
  } catch {}
}

// 判題完成通知（前景輪詢發現狀態改變時呼叫）
export async function notifyJudged(opts: {
  submissionId: number;
  problemTitle: string;
  status: string;
}) {
  if (!isNativeApp()) return;
  const statusLabels: Record<string, string> = {
    AC: "Accepted 🎉",
    WA: "Wrong Answer",
    TLE: "Time Limit Exceeded",
    MLE: "Memory Limit Exceeded",
    RE: "Runtime Error",
    CE: "Compile Error",
    IE: "系統錯誤",
  };
  const label = statusLabels[opts.status] ?? opts.status;
  const ok = await ensureNotificationPermission();
  if (!ok) return;
  const { LocalNotifications } = await import("@capacitor/local-notifications");
  await LocalNotifications.schedule({
    notifications: [
      {
        id: opts.submissionId,
        title: `提交 #${opts.submissionId}：${label}`,
        body: `「${opts.problemTitle}」的判題結果出爐了`,
        schedule: { at: new Date(Date.now() + 1000) },
        smallIcon: "ic_launcher_foreground",
        iconColor: "#94a6cc",
      },
    ],
  });
}