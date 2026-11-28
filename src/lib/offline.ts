// 斷網比賽模式：機房沒有對外網路時設 OFFLINE_MODE=1。開啟後 Google / Discord
// 登入整組停用（連外只會卡住），選手一律用帳密登入（見 scripts/contest-accounts.mjs）。
export function isOfflineMode(): boolean {
  return process.env.OFFLINE_MODE === "1";
}
