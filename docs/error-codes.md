# 錯誤代碼對照表

畫面或 GitHub Actions 上的橘色／紅色錯誤都會帶一個代碼。把代碼告訴維護者（或 Claude），
就能在這份表找到原因與修法。新增代碼時，請同步更新 `src/lib/errorCodes.ts`（網站）
或 `scripts/ci-step.sh` 的呼叫處（CI）。

## 網站（OJ-）

| 代碼 | 出現位置 | 原因 | 修法 |
| --- | --- | --- | --- |
| `OJ-SRV-001` | 全站最上方橘色公告 | `src/lib/serverNotice.ts` 的 `enabled` 為 `true`，人工開啟的伺服器異常公告 | 問題排除後把 `enabled` 改成 `false` 並部署；若公告仍需要，更新 `message` 與 `id` |
| `OJ-APP-500` | 頁面中央橘色「頁面發生錯誤」 | 頁面執行時丟出未預期例外，由 `src/app/error.tsx` 攔截；會附 `digest` | 用 `digest` 到伺服器日誌找對應的堆疊；瀏覽器 console 也會印 `[OJ-APP-500]` |

## CI（CI-）

失敗時 GitHub 會顯示 `[CI-xxx] CI 步驟失敗` 的註解（由 `scripts/ci-step.sh` 產生）。

| 代碼 | 步驟 | 常見原因 |
| --- | --- | --- |
| `CI-101` | `npm ci` | `package-lock.json` 與 `package.json` 不一致，或套件下載失敗 |
| `CI-102` | `npm run generate`（Prisma Client） | `prisma/schema.prisma` 語法錯誤 |
| `CI-103` | `prisma migrate deploy` | migration SQL 無法從空資料庫套用 |
| `CI-104` | `tsc --noEmit` | 型別錯誤 |
| `CI-105` | `npm run lint` | ESLint 規則違反 |
| `CI-106` | `npm run build` | Next.js 建置失敗（頁面收集、型別或匯入錯誤） |
| `CI-111`～`CI-117` | CTF 入門／Web Lab／Playground／課程排序／回報／CTF 整合／課程版面測試 | 對應 `scripts/test-*.mjs` 測試失敗，看該步驟日誌的 `not ok` |
| `CI-201`～`CI-206` | 服務管理／主機／部署／題目管理／評測佇列／密碼重設測試 | 同上 |
| `CI-301`～`CI-303` | itouLang 建置／測試／打包 | emsdk 或 Wasm 建置、`test:itoulang` 失敗 |

## 部署（DEPLOY-）

| 代碼 | 說明 | 修法 |
| --- | --- | --- |
| `DEPLOY-001` | `deploy.yml` 任一步驟失敗 | 看上方第一個失敗的步驟；伺服器端狀態在管理後台「部署」頁 |

## GitHub 自己產生的警告（沒有程式碼可帶）

| 代碼 | 訊息 | 處理 |
| --- | --- | --- |
| `CI-W001` | `Node.js 20 is deprecated ... actions/...` | 把 action 升級到以 Node 24 執行的版本（已於 checkout v7、setup-node v7、setup-emsdk v16 處理）。 |
