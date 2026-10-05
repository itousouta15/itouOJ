# itouOJ 原生 CTF 模組實作計畫

- 日期：2026-10-05
- 狀態：待實作
- 目標：將 itouOJ 擴充為實作、識讀與 CTF 共用帳號的綜合練習平台。

## 1. 已確認的需求

| 項目 | 決定 |
|---|---|
| 整合方式 | 在 itouOJ 內建原生 CTF 模組，不部署獨立 CTFd 服務 |
| 路徑 | `/ctf`，使用現有 Next.js 部署與網域 |
| 帳號 | 沿用現有使用者、登入與管理員權限 |
| 第一版用途 | 常駐練習題庫，隨時可以解題 |
| 參與方式 | 個人解題 |
| 題型 | 固定 flag、Markdown 敘述、附件下載 |
| 題目計分 | 固定配分，每人每題只計分一次 |
| 全站排行 | 實作／識讀／CTF 採 42／28／30 加權 |
| CTF 分數換算 | 原始 CTF 分數除以 100 |

第一版交付完整的出題、練習、提交判定、解題紀錄、附件與排行榜流程。限時賽事、團隊、提示扣分、動態配分及容器題列入後續階段。

## 2. 現有架構與實作慣例

現有技術：

- Next.js 16 App Router、React、TypeScript。
- Prisma 7、SQLite、better-sqlite3 adapter。
- Tailwind CSS 與共用樣式。
- `src/lib/auth.ts` 的 `getSession()` 處理登入與最新角色查詢。
- zod 驗證 API 輸入，`Response.json()` 回傳 API 結果。
- SQLite BLOB 儲存現有 PDF 與頭像。
- `src/lib/rateLimit.ts` 的 `enforceRateLimit()` 提供單機帳號／IP 限流。

CTF 實作沿用上述慣例：

- Server Component 載入頁面資料。
- Client Component 處理表單與 flag 提交。
- 使用者介面訊息採繁體中文。
- 動態路由的 `params`、`searchParams` 使用 Promise。
- 需要登入資料的頁面使用動態渲染。
- 後台頁面及 API 各自檢查管理員權限。
- Prisma Client 從 `src/lib/db.ts` 取得，不手動修改產生的程式碼。

CTF 採獨立資料模型，不寫入現有 `Submission`，以維持程式判題、AC 率與 CTF 判定各自清楚的語意。

可參考的現有實作：

- `src/app/api/recognition-answers/route.ts`：登入、輸入驗證、非公開題目存取與作答交易。
- `src/components/CourseForm.tsx`：新增／編輯共用 Client Form。
- `src/app/api/user/avatar/route.ts`：multipart 上傳與 BLOB 儲存。
- `src/lib/ranking.ts`：SQL 聚合與全站排行。
- `src/lib/userStats.ts`：個人頁與設定頁共用統計。

## 3. 資料模型

### 3.1 `CtfChallenge`

| 欄位 | 用途 |
|---|---|
| `id` | 自動遞增主鍵，作為題目網址識別 |
| `title` | 題目標題 |
| `description` | Markdown 題目敘述 |
| `category` | 題型分類 |
| `difficulty` | `easy`、`medium`、`hard` |
| `points` | 正整數配分 |
| `isPublic` | 是否公開，建立時預設隱藏 |
| `order` | 列表排序 |
| `flagHash` | Flag 雜湊 |
| `flagSalt` | 每題獨立隨機 salt |
| `createdAt` | 建立時間 |
| `updatedAt` | 更新時間 |

關聯：附件、解題紀錄、提交紀錄。

分類第一版採固定清單，由共用常數與 zod schema 驗證：

- Web
- Crypto
- Reverse
- Pwn
- Forensics
- Misc

`order` 為排序值，不作為網址或唯一識別。列表以 `order`、`id` 穩定排序。

### 3.2 `CtfAttachment`

| 欄位 | 用途 |
|---|---|
| `id` | 主鍵 |
| `challengeId` | 所屬題目 |
| `filename` | 下載檔名 |
| `sizeBytes` | 檔案大小 |
| `data` | SQLite BLOB |
| `createdAt` | 上傳時間 |

刪除題目時 cascade 刪除附件。

一般頁面只查詢附件 metadata；下載端點才讀取 `data`。

### 3.3 `CtfSolve`

| 欄位 | 用途 |
|---|---|
| `id` | 主鍵 |
| `userId` | 解題使用者 |
| `challengeId` | 解出的題目 |
| `solvedAt` | 首次正確提交時間 |

必要約束：

```text
UNIQUE(userId, challengeId)
```

此唯一鍵作為重複與併發提交的最終去重機制。

不在解題紀錄保存配分快照。第一版按題目目前配分計算總分，管理員調整配分後，所有已解出使用者同步採用新分數。

### 3.4 `CtfAttempt`

| 欄位 | 用途 |
|---|---|
| `id` | 主鍵 |
| `userId` | 提交使用者 |
| `challengeId` | 題目 |
| `result` | `CORRECT` 或 `INCORRECT` |
| `createdAt` | 提交時間 |

不保存提交的 flag 原文。

已解出題目再次提交時，直接回傳「已解出」，不新增提交或解題紀錄。併發請求在交易中發現已解出時也採相同行為。

### 3.5 索引與刪除語意

依列表、使用者歷史與排行查詢建立索引，例如：

- 題目公開狀態／排序。
- 附件所屬題目。
- 使用者解題紀錄。
- 題目解題紀錄。
- 使用者提交歷史。

實作時依實際查詢形狀決定複合索引，避免新增與唯一鍵重複的索引。

使用者刪除時，其 CTF 解題與提交紀錄 cascade 刪除。題目永久刪除時，附件、解題與提交紀錄一併刪除；平常停用題目使用隱藏功能。

## 4. 核心行為

### 4.1 Flag 規則

第一版採：

1. 去除輸入前後空白。
2. 保留內部空白。
3. 區分大小寫。
4. 完全比對。
5. 不限制必須使用特定 `flag{...}` 格式。

新增題目必須設定非空 flag；編輯時留空代表保留原 flag，輸入新值代表替換。建立與驗證使用相同正規化流程，並限制輸入長度與請求大小。

使用 Node `crypto` 的非同步 `scrypt` 建立雜湊，配合隨機 salt 與 `timingSafeEqual` 驗證。相關參數集中於單一 helper，避免建立與驗證邏輯不一致。

Flag、salt 與 hash 不傳入公開頁面或 Client Component；後台也不回填原 flag。伺服器錯誤紀錄不包含 flag 輸入或完整 request body。

### 4.2 提交流程

```text
檢查登入
→ 帳號／IP 限流
→ 驗證輸入
→ 檢查公開題目與既有解題紀錄
→ 驗證 flag
→ 交易內記錄判定及首次解題
→ 回傳結果
```

雜湊計算在交易外完成，避免長時間持有 SQLite 寫入交易。交易內重新確認題目仍公開且 flag 資料未變更，避免驗證期間發生隱藏、刪除或替換 flag 後仍接受舊答案；狀態已變更時不新增紀錄，要求重新載入題目再提交。

正確提交透過唯一鍵保證僅建立一筆 `CtfSolve`。交易建立 solve 與 attempt 必須一起成功或一起回滾。唯一鍵衝突應回傳已解出，而不是伺服器錯誤；不得掩蓋其他資料庫錯誤。

建議初始限流：

- 帳號：每分鐘 10 次。
- IP：每分鐘 30 次。

超限回傳 `429` 與 `Retry-After`，前端顯示等待時間。限流在執行 scrypt 前完成，重複提交也計入請求限流。

### 4.3 公開狀態

- 訪客可瀏覽公開題目及下載公開附件。
- 登入者可提交公開題目。
- 隱藏題目對一般使用者回傳 `404`。
- 管理員可預覽隱藏題目，但第一版 flag 提交仍限定公開題目。
- 隱藏題目保留紀錄，暫時排除於公開排行、進度、近期解題與歷史列表。
- 再公開後恢復採計。

管理員提交公開題目時，依一般使用者規則計分。

### 4.4 附件

現有 `deploy/nginx-oj.conf` 設定為 `client_max_body_size 5m`。第一版採：

- 每檔上限 4 MiB。
- 每次請求上傳一個檔案。
- multipart/form-data。
- 可透過多次上傳為同題加入多個附件。
- 應用程式限制整個請求大小，不能只相信 `Content-Length`；在解析 multipart 前進行有上限的 body 讀取。
- 拒絕空檔與不合法檔名。
- 檔名僅作為下載名稱，不用來組合伺服器路徑。

CTF 附件可能包含執行檔與壓縮檔，因此不採圖片 MIME 白名單。下載統一使用：

```text
Content-Type: application/octet-stream
Content-Disposition: attachment
Cache-Control: private, no-store
```

檔名使用安全的 UTF-8 header 編碼。下載時再次檢查所屬題目權限，並沿用全站 `X-Content-Type-Options: nosniff` 設定。

題目 metadata 儲存與附件操作分開；更新題目不得整批重建附件或清除解題紀錄。

## 5. 頁面與 API

### 5.1 使用者頁面

| 路徑 | 功能 |
|---|---|
| `/ctf` | 題目列表、分類／難度／解題狀態篩選、分頁、個人進度 |
| `/ctf/[id]` | 題目敘述、配分、附件、flag 提交、解題狀態 |
| `/ctf/scoreboard` | CTF 個人排行 |
| `/ctf/history` | 本人提交紀錄，需登入 |

題目列表採固定頁面大小與穩定排序。解題狀態篩選僅對登入使用者提供，查詢參數先經驗證。歷史頁也需分頁，不一次讀取所有紀錄。

題目詳情顯示：

- 分類、難度、配分。
- Markdown 敘述。
- 附件檔名與大小。
- 已解出狀態及首次解出時間。
- 提交中的狀態、正確／錯誤訊息與限流提示。
- 訪客登入入口，登入後返回原題目。

提交成功後更新已解出狀態與相關統計；網路失敗不顯示成功，允許重試。

### 5.2 管理頁面

| 路徑 | 功能 |
|---|---|
| `/admin/ctf` | 分頁題目列表、公開狀態、配分、解題數 |
| `/admin/ctf/new` | 新增題目 |
| `/admin/ctf/[id]/edit` | 編輯 metadata、替換 flag、附件管理 |

新增題目先儲存 metadata，取得題目 ID 後進入編輯頁上傳附件。上傳失敗保留已儲存題目，允許重試。

永久刪除功能明確標示會刪除附件及相關紀錄；隱藏功能保留資料。

### 5.3 API

| 方法 | 路徑 | 用途 |
|---|---|---|
| POST | `/api/ctf/challenges/[id]/attempts` | 提交 flag |
| GET | `/api/ctf/challenges/[id]/attachments/[attachmentId]` | 下載附件 |
| POST | `/api/admin/ctf/challenges` | 建立題目 |
| PUT | `/api/admin/ctf/challenges/[id]` | 更新題目 |
| DELETE | `/api/admin/ctf/challenges/[id]` | 永久刪除題目 |
| POST | `/api/admin/ctf/challenges/[id]/attachments` | 上傳附件 |
| DELETE | `/api/admin/ctf/challenges/[id]/attachments/[attachmentId]` | 刪除附件 |

列表、歷史與排行使用 Server Component 查詢資料，第一版不額外建立重複的讀取 API。

提交的已處理結果使用一致欄位，例如：

```json
{ "result": "correct" }
```

`result` 明確區分 `correct`、`incorrect`、`already_solved`。錯誤 flag 屬於正常判定結果，不回傳伺服器錯誤。

錯誤狀態沿用專案慣例：

- `400`：輸入不合法。
- `401`：需要登入。
- `403`：需要管理員權限。
- `404`：題目／附件不存在或不可存取。
- `409`：驗證期間題目或 flag 狀態已變更，需重新載入。
- `413`：附件／請求過大。
- `429`：提交過於頻繁。

所有 ID 驗證為正整數。附件操作需同時比對 `attachmentId` 與 `challengeId`，避免跨題操作。

## 6. 計分與全站整合

### 6.1 CTF 原始分數

```text
CTF 原始分數 = 已解出的公開題目目前配分總和
```

CTF 排行順序：

1. 原始分數由高至低。
2. 最後一次公開題目解出時間由早至晚。
3. 使用者名稱作穩定排序。

公開計分板只顯示至少解出一道公開題目的使用者。第一版採確定性排序後的序號名次，排行列表需限制回傳筆數或分頁。

### 6.2 全站公式

```text
全站分數 =
    實作解題數 × 0.42
  + 識讀答對數 × 0.28
  + (CTF 原始分數 ÷ 100) × 0.30
```

例：

```text
實作解題 10 題、識讀答對 20 題、CTF 500 分
= 10 × 0.42 + 20 × 0.28 + 5 × 0.30
= 11.3
```

採完整精度排序，顯示時才四捨五入。此公式為固定換算加權，不是百分位正規化，也不保證三項實際貢獻占比固定。

### 6.3 查詢與統計

修改 `src/lib/ranking.ts`：

- 新增公開 CTF 題目的解題數與分數聚合。
- 在 SQL 端聚合、計分、排序。
- 各資料來源先依使用者聚合再 join，避免提交與解題列互相乘積而重複加總。
- 支援僅有 CTF 紀錄的使用者。
- CTF 錯誤提交不增加全站排名分數。
- 全站同分時保留現有程式提交數排序，再加穩定欄位。

實作項目應明確限定 `Problem.type = PROGRAMMING`。目前排行的 AC 聚合未限定題型，與 `getUserStats()` 的定義不同；加入新公式時需同步釐清，並在更新說明中註明此統計口徑變更。

修改排行頁：

- 顯示 CTF 原始分數。
- 顯示全站加權分數及公式。
- 「提交數」標示為程式提交數，避免與 CTF 提交混淆。
- 調整空狀態文案。

修改使用者統計：

- CTF 解題數。
- CTF 原始分數。
- 公開 CTF 題目總數與進度。
- 個人頁近期解出的公開 CTF 題目。
- 設定頁 CTF 統計摘要。

配分修改、題目隱藏、再公開及刪除後，CTF 排行、全站排行與個人頁採用相同計分規則。第一版直接聚合目前資料，不新增需要同步維護的總分欄位。

## 7. 檔案配置

### 7.1 新增共用邏輯與元件

```text
src/lib/ctf.ts
src/lib/ctfFlag.ts
src/lib/ctfSchema.ts
src/lib/ctfAttachment.ts

src/components/CtfChallengeForm.tsx
src/components/CtfFlagForm.tsx
src/components/CtfAttachmentManager.tsx
src/components/CtfStats.tsx
```

責任分工：

- `ctf.ts`：公開存取、分類、統計與 CTF 排行查詢。
- `ctfFlag.ts`：flag 正規化、雜湊、驗證。
- `ctfSchema.ts`：建立、編輯、提交與查詢參數驗證。
- `ctfAttachment.ts`：大小限制、檔名處理、受限 body 讀取與下載 headers。

### 7.2 新增頁面

```text
src/app/ctf/page.tsx
src/app/ctf/[id]/page.tsx
src/app/ctf/scoreboard/page.tsx
src/app/ctf/history/page.tsx

src/app/admin/ctf/page.tsx
src/app/admin/ctf/new/page.tsx
src/app/admin/ctf/[id]/edit/page.tsx
```

### 7.3 新增 API 與 migration

```text
src/app/api/ctf/challenges/[id]/attempts/route.ts
src/app/api/ctf/challenges/[id]/attachments/[attachmentId]/route.ts

src/app/api/admin/ctf/challenges/route.ts
src/app/api/admin/ctf/challenges/[id]/route.ts
src/app/api/admin/ctf/challenges/[id]/attachments/route.ts
src/app/api/admin/ctf/challenges/[id]/attachments/[attachmentId]/route.ts

prisma/migrations/<timestamp>_add_ctf_module/migration.sql
```

### 7.4 修改現有檔案

```text
prisma/schema.prisma
src/lib/ranking.ts
src/lib/userStats.ts
src/lib/navLinks.ts
src/components/BottomNavLinks.tsx
src/app/ranking/page.tsx
src/app/users/[username]/page.tsx
src/app/settings/page.tsx
src/app/sitemap.ts
src/app/robots.ts
README.md
```

相關管理頁增加 CTF 管理入口。

桌面與手機選單共用 `navLinksFor()`；App 將 CTF 放入「更多」，同步更新 active 狀態。

Sitemap 僅列公開 CTF 題目及入口。`robots.ts` 排除 CTF 個人排行與提交歷史，符合現有使用者資料頁面的收錄政策。

## 8. 分階段實作

### 階段一：資料模型與共用規則

- [ ] 新增四個模型、User 關聯、唯一鍵與索引。
- [ ] 產生 migration 並重新 generate Prisma Client。
- [ ] 新增分類、flag 正規化、驗證及計分 helper。
- [ ] 新增建立／更新／提交的 zod schema。
- [ ] 驗證 migration 可從空資料庫與既有資料庫升級。

完成條件：既有資料不受破壞，CTF 模型可查詢，核心規則可驗證。

### 階段二：管理後台與附件

- [ ] 完成題目 CRUD API。
- [ ] 完成管理列表、新增與編輯頁。
- [ ] 完成 flag 保留／替換流程。
- [ ] 完成附件逐檔上傳、刪除及下載。
- [ ] 驗證所有後台操作的管理員權限。
- [ ] 驗證 metadata 更新保留附件與既有紀錄。

完成條件：管理員可建立、上傳附件、公開並維護一道完整題目。

### 階段三：練習與提交

- [ ] 完成題庫篩選與分頁。
- [ ] 完成詳情頁與 flag 提交元件。
- [ ] 完成提交 API、限流及交易去重。
- [ ] 完成本人提交歷史。
- [ ] 完成 CTF 個人計分板。
- [ ] 完成空狀態、訪客、限流及錯誤顯示。

完成條件：使用者可完成解題流程，重複與併發提交不重複加分。

### 階段四：全站整合

- [ ] 更新全站排行公式及欄位。
- [ ] 更新個人頁與設定頁 CTF 統計。
- [ ] 更新桌面、手機、App 與管理入口。
- [ ] 更新 metadata、sitemap、robots。
- [ ] 更新 README 功能與操作說明。

完成條件：不同頁面的 CTF 統計一致，僅參與 CTF 的使用者可進入全站排行。

### 階段五：驗證與部署準備

- [ ] 完成核心判題與計分測試。
- [ ] 完成資料庫併發去重與存取權限驗證。
- [ ] 完成桌面、手機與 App 介面檢查。
- [ ] 通過 migration、TypeScript、lint、build。
- [ ] 完成部署及更新說明。

各階段依序進行；核心規則與資料完整性驗證應在相應功能完成時執行，最後階段整合驗收。

## 9. 測試與驗收

專案目前沒有通用測試框架。針對本功能的判題、計分及資料完整性加入聚焦測試，優先採 Node 原生測試工具與拋棄式 SQLite 資料庫。測試執行方式需相容專案的 Node／TypeScript 設定，不依賴正式資料庫或外部服務。

### 9.1 核心測試

| 情境 | 預期 |
|---|---|
| 正確、錯誤、大小寫不同的 flag | 依既定規則判定 |
| Flag 前後空白／內部空白 | 前後空白忽略，內部空白保留 |
| 更新題目未填新 flag | 原 flag 仍有效 |
| 替換 flag | 新值有效，舊值無效 |
| 重複正確提交 | 一筆 solve，分數不增加 |
| 併發正確提交 | 一筆 solve，不回傳意外伺服器錯誤 |
| 提交期間題目隱藏或 flag 替換 | 不依舊狀態建立 solve |
| 錯誤提交 | 保存判定，不保存 flag 原文 |
| 修改配分／隱藏／再公開 | 三處排行與統計一致 |
| 只有 CTF 紀錄的使用者 | 可列入全站排行 |
| 不同使用者、題目與提交數量 | 聚合不因 join 重複加分 |
| CTF 同分使用者 | 依最後解題時間與穩定欄位排序 |
| 沒有 CTF 題目或紀錄 | 公式正確、頁面顯示空狀態 |

併發驗證需使用獨立請求／連線操作同一個拋棄式資料庫，確認實際交易及唯一鍵行為，而不只測試純函式或 mock。

### 9.2 權限與附件測試

- 未登入提交回 `401`。
- 非管理員不能新增、修改或刪除題目／附件。
- 隱藏題目與附件對一般使用者回 `404`。
- 附件 ID 與題目 ID 不匹配不能下載或刪除。
- 空檔、超過大小限制及缺少 Content-Length 的過大請求被拒絕。
- HTML、執行檔等附件使用強制下載。
- 公開頁面、API、Client Component props 不含 flag、salt 或 hash。
- 限流回應包含 `Retry-After`。
- 刪除使用者／題目後，關聯紀錄依預期清除。

### 9.3 專案檢查

使用拋棄式資料庫執行，明確設定 `DATABASE_URL`，避免將驗證指向正式資料庫：

```bash
npm run generate
npx prisma migrate deploy
npx tsc --noEmit
npm run lint
node scripts/parse-reading-bank.mjs --self-test
npm run build
```

另執行新增的 CTF 聚焦測試，並在 `.github/workflows/ci.yml` 加入其執行命令。

介面驗收包含深淺色、手機尺寸、鍵盤操作、提交 loading、網路失敗重試與登入後返回題目流程。

## 10. 部署與後續擴充

### 10.1 部署

使用現有部署流程：

1. 使用 SQLite 一致性備份方式備份正式資料庫，包含附件 BLOB。
2. 套用 additive migration。
3. Generate Prisma Client、build、重啟應用程式。
4. 建立隱藏測試題，確認後台、附件與權限；公開後驗證實際判題流程。
5. 確認 CTF 與全站排行及個人統計。

第一版 `/ctf` 由現有 Next.js 處理，維持現有 nginx 代理與 5 MB 請求限制。

若應用程式回退，保留新增 CTF 表即可；避免直接刪除已產生的使用者紀錄。舊版本回退後全站排行會恢復舊公式，需在更新說明中記錄此行為。

### 10.2 後續階段

依使用需求逐步加入：

1. 限時個人賽：賽事、報名、開賽公開、賽內紀錄與計分板。
2. 提示與扣分。
3. 動態配分。
4. 題解與討論。
5. CTF 解題動態與成就。
6. 團隊制。
7. 每人／每隊 flag。
8. 容器題服務與生命週期管理。
9. CTFd 題目匯入。

限時賽事加入時應另建賽事關聯與賽內紀錄，使常駐練習的解題狀態不會直接成為賽事成績。

## 11. 完成定義

第一版完成需同時滿足：

- 管理員可維護帶附件與固定 flag 的 CTF 題目。
- 使用者可瀏覽、下載、提交並取得即時判定。
- 每人每題只計分一次，併發提交不破壞資料。
- CTF 排行、全站排行與個人統計一致。
- 公開／隱藏題目在所有讀取與提交入口採一致權限。
- 桌面、手機及 App 都可找到 CTF 入口並完成練習。
- Migration、CTF 聚焦測試與專案既有檢查全部通過。
- README 與本計畫反映最終實作行為。
