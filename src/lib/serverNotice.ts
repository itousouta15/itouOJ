// 純前端的伺服器狀態公告：伺服器出問題時把 enabled 設成 true 並更新 message，
// 全站最上方就會顯示提示；恢復後改回 false 即可。不需要後端或資料庫。
export const SERVER_NOTICE = {
  enabled: false,
  message: "目前 itouOJ 伺服器發生異常，部分功能（登入、提交、評測）可能變慢或暫時無法使用。我們正在處理，造成不便敬請見諒。",
  // 內容改變時換新 id，之前按過「關閉」的使用者會重新看到公告。
  id: "server-issue-1",
  // 對應 docs/error-codes.md 的代碼，使用者回報時用。
  code: "OJ-SRV-001",
} as const;
