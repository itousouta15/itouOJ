# 專案根目錄整理設計

## 目標與邊界

讓根目錄只保留專案入口、框架必要設定與獨立子專案；將操作文件、品牌資產、本機 SQLite 資料與可重建匯出物移到有語意的目錄。這是一次檔案組織重構，不改功能、資料模型、資料庫內容或部署架構。

以下檔案及目錄留在根目錄：`README.md`、`LICENSE`、`CONTRIBUTING.md`、`.env`、`package.json`、`package-lock.json`、Next／Prisma／Capacitor／TypeScript／ESLint／PostCSS 設定，以及 `src`、`public`、`prisma`、`android`、`deploy`、`scripts`、`docs`、`client`、`sandbox-runner`、`server-dashboard`。`CONTRIBUTING.md` 保留在根目錄，讓 GitHub 自動辨識貢獻指南。

## 文件與品牌資產

- `CONTEST-OFFLINE.md` 移至 `docs/guides/contest-offline.md`。
- `RELEASING.md` 移至 `docs/guides/releasing-windows-client.md`。
- `Hero.png`、`itouOJ.png`、`itouOJ.svg`、`port.png` 移至 `public/brand/`，檔名維持不變。

README 的圖片連結、首頁的公開資產 URL、Android icon 產生器、貢獻／離線比賽／Windows 收件程式文件中的交叉連結，都必須改為新位置。`itouOJ.svg` 保持為 Android icon 產生器的來源檔，僅改讀取位置。

## 本機資料與匯出物

`dev.db` 與 `test.db` 移到 `prisma/data/`，並保持為未追蹤的本機資料。`.env` 的 `DATABASE_URL`、應用程式 SQLite fallback、seed 與維護腳本的 fallback 都更新為 `file:./prisma/data/dev.db`。建立測試比賽的工具仍以同一資料夾旁的 `test.db` 為目標，確保不會動到開發資料庫。

根目錄的 `problem-docs/` 移到 `artifacts/problem-docs/`，並把匯出工具的預設輸出位置更新為這個目錄。`artifacts/` 與 `prisma/data/*.db`、其 journal 檔都由 `.gitignore` 排除。舊的根目錄 DB／匯出物 ignore 規則保留，避免舊檔意外被納入版本控制。

## 搬遷安全性與相容性

檔案搬遷前先確認兩個資料庫存在且目的地不含同名檔；同一磁碟內搬遷後以檔案大小與 Prisma migration status 驗證開發資料庫沒有變成空白資料庫。若目的地已有資料庫，停止而不覆寫。

所有 Git 追蹤的文件與圖片以 `git mv` 搬遷，保留歷史。SQLite 與匯出物是被忽略的本機檔案，只在確認後以同一磁碟搬遷。更新完後，掃描整個專案不得再有舊的根目錄資產、文件、資料庫或匯出路徑引用。

## 驗證與發布

- 檢查 Git 狀態和 `.gitignore`，確認資料庫與匯出物不會被追蹤。
- 執行 `npx prisma migrate status`，確認既有 migration 已套用。
- 執行 TypeScript、lint、production build。
- 檢查 README 圖片、首頁公開資產與 Android icon 產生器的新路徑。
- 成功後以既有部署腳本發布，驗證服務狀態與公開站 HTTP 200。
