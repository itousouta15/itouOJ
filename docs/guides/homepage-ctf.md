# 因應 CTF 的首頁重整

## 首頁動線

1. **主視覺**：改回原站的置中 Logo、短標語「寫程式、讀邏輯、找出 Flag」，只保留實作、識讀、CTF 三個練習按鈕與帳號入口。
2. **平台統計**：分別列公開實作題、公開識讀題、公開 CTF 與使用者數，不再把程式提交／Accepted 當作涵蓋所有題型的統計。
3. **三種練習入口**：直接放在 Logo 下方，不使用大型用途介紹卡片。
4. **今日練習**：保留每日一題、本人解出狀態與既有繼續學習；登入者另顯示自己的 CTF 解題數、原始分數與進度。
5. **CTF**：與最新實作題並列簡單的最新挑戰清單，保留 Web Lab 小連結與計分板入口。
6. **公告與題庫**：保留公告、最新實作題、社群／追蹤動態，排行改用既有全站加權資料。
7. **工具**：Android／Windows 下載改為精簡工具區，評測環境可展開查看；App 沿用不顯示下載宣傳的規則。

首頁的題目連結維持 `/ctf/<id>` 獨立頁；從 CTF 題庫點卡片才開 routed modal。Web Lab 連結開新分頁，找到 Flag 後回題目提交。

## 資料與呈現

- 查詢集中於 `src/lib/home.ts`，由 Server Component 使用。`getNavInfo()` 與 Header／底部導覽共用 request cache。
- 互不相依的查詢以 Promise.all 載入；列表與排行都限制回傳筆數。
- CTF 統計、預覽、Web Lab 與近期 solve 都只採公開題目，並明確 select metadata，不選取題敘、附件 BLOB、flagHash、flagSalt 或 labFlagCiphertext。
- 本人 CTF 進度及已解出標示依伺服器 session 查詢，訪客沒有個人進度區。
- 全站排行使用實作／識讀／CTF 的 42／28／30 加權，支援只有 CTF 成績的使用者。
- 不使用 Hero workspace、軌道／Flag 裝飾、分類展示區或大型宣傳卡片，也不再查詢這些展示區的額外資料。
- 首頁與全站 metadata、Open Graph、Twitter 及結構化資料描述同步納入 CTF。

版型以 `.homepage-simple` 範圍的 CSS 呈現，保留既有 Header、CTF modal 及 Web Lab。使用方形面板／按鈕、原站 serif 標題和純色邊框；手機內容單欄、統計 2×2，App 保留個人進度與底部導覽。無新增 client component、資料模型或 migration。

## 驗證

`scripts/test-ctf.mjs` 包含空題庫、公開／隱藏 CTF、敏感欄位及本人進度的真實 HTTP 檢查。選用 Chromium 驗證 1280／390／320px 首頁、三個練習入口、六類 CTF 連結、Web Lab、登入者 App 進度及無橫向溢出；既有 modal、導航與解題流程持續驗證。

```sh
npm run test:ctf
npm run build
```

驗證使用拋棄式 SQLite；首頁沒有題目或 CTF 時採空狀態，不暴露隱藏題目或假資料。

## 正式部署（2026-10-07）

- 已部署至 https://oj.itousouta.me/ ，正式機器 production build、16 項 CTF／首頁 HTTP 整合測試、3 項入門題及 5 項 Web Lab 測試通過。
- 一致性備份為 `/opt/oj-deploy-backups/20261007-115620/oj.db`，無新增 migration。
- 正式 Chromium 驗證 1280／390／320px，三種入口、六個 CTF 分類、三個 Web Lab、首頁 SEO、CTF 題庫及 modal 流程正常。
- 原有課程／每日一題、公告、社群、排行與三個練習網站仍正常，網站、worker、沙箱與 nginx 均為 active。

後續已將首頁改回方形面板、按鈕及原站標題字體，保留 CTF 功能與入口。正式桌面／手機驗證主要區塊 border-radius 為 0；備份為 `/opt/oj-deploy-backups/20261007-163412/oj.db`。

再次依需求精簡為原站的置中 Logo、短標語、三個練習按鈕與方形列表，移除大型展示區及相應查詢。正式 1280／390／320px 驗證入口、無橫向溢出及 CTF 計分板導覽正常；備份為 `/opt/oj-deploy-backups/20261007-165800/oj.db`。
