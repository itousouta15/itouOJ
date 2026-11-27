// 全站錯誤代碼登錄表：畫面上的橘色錯誤／警告都會顯示其中一個代碼。
// 使用者回報代碼後，到 docs/error-codes.md 對照原因與修法。
// 新增代碼時請同步更新 docs/error-codes.md。
export const ERROR_CODES = {
  "OJ-SRV-001": "伺服器異常公告（src/lib/serverNotice.ts 開啟時顯示）",
  "OJ-APP-500": "頁面發生未預期的執行錯誤（src/app/error.tsx 錯誤邊界）",
} as const;

export type ErrorCode = keyof typeof ERROR_CODES;
