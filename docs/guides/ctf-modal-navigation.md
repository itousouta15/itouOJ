# CTF 題目視窗與導覽分組

## 題目視窗

題庫卡片以 Next.js soft navigation 開啟原生 `<dialog>`，版型參照 CTFd：上方分頁與關閉鈕、置中的題名與配分、分類／難度／已解出標示、Markdown 題敘、練習網站、附件按鈕及 Flag 輸入。

- 題庫點擊：在原列表上開 modal，網址更新為 `/ctf/challenges/<id>`，並攜帶已驗證的列表查詢參數。
- 關閉、Esc 或遮罩：回到原題庫，保留篩選、分頁及捲動，恢復觸發卡片的焦點。
- 瀏覽器返回／前進：關閉／重新開啟視窗。
- 直接網址、另開分頁或重新整理：顯示獨立題目頁。
- 答對：留在視窗更新狀態、進度與背景卡片；若使用未解出篩選，關閉後該卡片消失，焦點回到題庫標題。
- 切換題目：以題目 ID 重建表單與分頁，清除上一題輸入和判定。

### 路由範圍

`src/app/ctf/(board)` 是題庫專用 route group，其 layout 同時渲染 children 與 `@modal`，用 `(.)challenges/[id]` 僅攔截專用題目 namespace。原本的 `(.)[id]` 會把 `/ctf/history` 和 `/ctf/scoreboard` 的軟導覽誤判為題目；已移除這個過於廣泛的攔截。

其他 CTF 頁面與使用者頁會卸載此 group，因此不使用廣泛的 catch-all slot，避免未知 `/ctf/*` 路徑被當成成功的題庫頁。`@modal/page.tsx` 與 `default.tsx` 為空視窗；`/ctf/<id>` 舊深連結保留獨立頁，`/ctf/challenges/<id>` 直接開啟也使用相同內容，canonical 指向舊深連結。

共用資料存取在 `src/lib/ctfChallenge.ts`，共用內容在 `CtfChallengeContent.tsx`。兩種呈現各自遵守公開／隱藏權限，並只選取公開 metadata、本人 solve 狀態與附件 metadata。

載入與完成視窗可能短暫重疊。`bodyScrollLock.ts` 管理參照計數，供 modal、手機選單與 SiteLoader 共用，避免 loader 或舊視窗結束時解除仍開啟的 modal 捲動鎖；modal 群組同時保留原始焦點。

### 題目紀錄

分頁採按需讀取的 `GET /api/ctf/challenges/<id>/activity`：

- `kind=solves`：公開題目的解題者與首次解出時間。
- `kind=attempts`：目前 session 使用者的判定與提交時間，未登入回 401；不接受 caller 指定使用者。
- `page`：每頁 20 筆，固定時間／ID 排序與 hasNext。

所有查詢重新檢查題目權限，隱藏題目對非管理員回 404。API 設定 no-store／noindex；資料不包含提交 Flag、hash、salt 或網站加密副本。

## 導覽

桌面維持四個入口：

Header 使用緊湊的品牌標記、置中的膠囊導覽、淡紫 active 狀態及細線陰影。下拉練習項目各有圖示與簡短說明，帳號區保留未讀徽章；Header 底色保持不透出後方題敘，避免捲動時干擾文字閱讀。

```text
itouOJ   練習 ▾   課程   比賽   排行          搜尋   帳號 ▾
```

練習選單含實作、識讀、CTF，以及次層的全站提交紀錄。個人功能分為帳號、紀錄與動態、管理三組；本人程式／識讀紀錄使用 `/submissions?mine=1`，CTF 提交使用 `/ctf/history`。管理入口僅提供給管理員，伺服器原有權限檢查仍獨立執行。

`src/lib/navLinks.ts` 集中主導覽與群組。手機 overlay、App「更多」及帳號選單共用此配置；App 的原有底部捷徑保留。小螢幕收合註冊按鈕至手機選單，限制長會員名稱寬度，保留搜尋、登入／帳號及選單操作。

選單支援點擊、方向鍵、Home／End、Esc、外部點擊與焦點移出關閉。手機 overlay 有焦點循環與關閉鈕；關閉選單不留隱藏但仍能 Tab 到的連結。

## 已驗證

- Production build、TypeScript、修改檔案 lint。
- Modal 的開啟、Esc／遮罩／×、焦點循環、返回／前進、重新整理、獨立頁與導覽離開。
- 分類／難度／未解出篩選與捲動位置，錯誤及成功提交、背景更新、新題表單重置。
- 紀錄的權限、分頁、本人隔離、敏感欄位與未知網址 404。
- 320／390px 手機、768／1024／1280px Header，長會員名稱、未讀徽章、會員／訪客／管理員與 App 選單。
- 練習網站仍由視窗的連結開新分頁，原本的 Flag、附件及 solve 紀錄採既有規則。

本次 UI 與唯讀查詢不新增資料庫 migration。

## 正式部署紀錄（2026-10-07）

- 正式機器 production build、15 項 CTF HTTP／資料庫測試、3 項入門題測試與 5 項 Web Lab 測試通過。
- 一致性備份為 `/opt/oj-deploy-backups/20261007-105651/oj.db`；原有 migration 全部已套用，本次無新增 migration。
- 正式網址以 Chromium 驗證 1280px 與 390px 的分組選單、CTF modal、解題者分頁、關閉及直接重新整理。
- 題庫、獨立頁、三個 Web Lab 與全站排行回 200；未登入的本人紀錄回 401，未知 CTF 子路徑回 404。
- 網站、worker、沙箱與 nginx 均正常運作。入口：https://oj.itousouta.me/ctf 。

### 靜態頁面誤攔修正

已重現從題庫點擊計分板會被 `(.)[id]` 攔成不存在題目的問題。Modal 改為 `(.)challenges/[id]` 後，從題庫的計分板、我的提交，以及帳號選單的 CTF 紀錄均能正確導覽。程式提交另以測試資料驗證 profile 和 `/submissions?mine=1` 都可顯示同一筆紀錄；沒有修改既有提交或解題資料。

正式 1280px／390px 實測計分板 soft navigation、題目 modal、舊深連結及未登入歷史導覽正常。備份為 `/opt/oj-deploy-backups/20261007-163412/oj.db`。
