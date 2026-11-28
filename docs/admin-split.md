# 管理後台拆分

`itouOJ` 維護主站、資料庫、登入、判題及管理 API。`itouOJ-admin` 獨立維護管理介面與後台服務。兩者透過同網域的反向代理共用現有登入。

目前可切換伺服器服務、遠端主機、評測監控、GitHub 部署、題庫、標籤及公告。先部署本 repo 的管理讀取 API，再依 `itouOJ-admin/deploy/nginx-admin.conf` 啟用分流。所有 `/api/*` 仍由本 repo 處理；出題申請、識讀群集、CTF 等未遷移頁和原管理頁仍可由本 repo 提供。

比賽主辦人入口已移到 `/contests/:id/manage/edit` 和 `/contests/:id/manage/status`，寫入 API 移到 `/api/contests/:id/manage` 和 `/api/contests/:id/manage/reveal`。舊頁導向新路徑，舊 API 暫時沿用同一套 handler 以支援已載入的舊版頁面。未來若把整個 `/admin` 切去新服務，Nginx 須優先將舊比賽編輯與狀態網址導到主站的新路徑。

## 本機端到端驗證

在兩個 repo 各執行 `npm run build`，然後在本 repo 執行 `node scripts/smoke-admin-split.mjs ../itouOJ-admin`。測試會用全新的暫存 SQLite、兩個 Next.js 程序（port 13200、13201）和本機反向代理，驗證伺服器管理權限、評測狀態讀取、題目與公告讀寫、資源路由以及比賽主辦人入口。正式主機上的服務啟停及部署操作需在部署環境另外驗證。
