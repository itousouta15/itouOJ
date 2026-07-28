// 斷網比賽模式：機房只有區域網路、沒有對外 internet 時設 OFFLINE_MODE=1。
//
// 開啟後 Google / Discord 登入會被視為「未設定」而整組停用——這些流程需要
// 連到 accounts.google.com / discord.com，斷網時按下去只會卡住再跳回錯誤頁，
// 不如直接不顯示。選手一律用帳號密碼登入（見 scripts/contest-accounts.mjs）。
export function isOfflineMode(): boolean {
  return process.env.OFFLINE_MODE === "1";
}
