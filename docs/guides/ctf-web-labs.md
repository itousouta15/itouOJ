# Web 題練習網站

Web Lab 是掛在 `/ctf/labs/<題目 ID>` 的獨立小網站。題目頁提供入口，使用者在練習網站探索後，回到 `/ctf/<題目 ID>` 提交 Flag。

## 三種網站

| 類型 | 網站 | 解題方向 |
| --- | --- | --- |
| `SOURCE` | 雲端研究社 | 操作迎新登記、查看 HTML 原始碼裡的留言 |
| `COOKIE` | 北風社員站 | 使用 `guest / guest` 登入，觀察 Cookie 與管理員公告的權限判定 |
| `IDOR` | 星港票券收藏站 | 從自己的票券網址觀察編號，探索模擬票券的物件存取 |

Cookie 與 IDOR 的弱點是刻意設計的教學規則，只處理模板內的角色、公告及兩張模擬票券。網站不讀寫真實 User、Message、Contest 或登入 session。Cookie 名稱為 `ctf_lab_<id>_role`，Path 為 `/ctf/labs/<id>`，不設定 Domain；正式 HTTPS 使用 Secure，並設定 SameSite=Lax。此 Cookie 刻意可由學習者編輯；OJ 的登入 Cookie 仍由既有認證流程處理。

所有網站使用限制 CSP、nonce、輸出轉義、強制 no-store 與 noindex。未知子路徑回 404，登入只接受有大小上限的表單，轉址限定題目的網站首頁。題目隱藏時，一般使用者的網站入口與子頁也回 404；管理員可預覽。

## 啟用與匯入

1. 套用 `20261007090000_add_ctf_web_labs` migration，generate Prisma Client。
2. 題目分類選 Web，在後台選擇「Web 練習網站」模板。
3. 第一次啟用時提供新 Flag。若原來已有練習網站，留空保留原值；替換 Flag 會同步更新網站答案及提交判定。
4. 公開題目後，使用題目頁的子連結開啟網站。

入門題可使用：

```sh
node scripts/add-ctf-beginner-challenges.mjs
node scripts/add-ctf-web-labs.mjs
```

Web Lab 匯入會由既有 welcome.html 還原並驗證原 Flag，再啟用 `SOURCE`，保留 salt/hash、配分、公開狀態、附件與解題紀錄。新增 Cookie 與 IDOR 題各 150 分；`--hidden` 僅隱藏此次新增的題目。同名題目不覆寫。

腳本由自身位置載入應用程式 `.env`，所以伺服器可使用絕對路徑執行：

```sh
runuser -u oj -- node /opt/online-judge/scripts/add-ctf-web-labs.mjs --db /opt/online-judge/oj.db
```

## Flag 儲存與密鑰

判題繼續使用 scrypt salt/hash。網站為了在解題終點揭示答案，額外保存 AES-256-GCM 的加密副本 `labFlagCiphertext`，以 `AUTH_SECRET` 衍生加密金鑰，並把 salted hash 納入認證資料，拒絕密文竄改或跨題交換。

`labFlagCiphertext` 不在公開 metadata 或 Client Component props 中。只有原始碼題的註解、Cookie 題通過模擬角色檢查後的公告、IDOR 題指定票券會揭示答案。更換 `AUTH_SECRET` 後，既有密文需要在後台以新 Flag 重設；設定不一致時網站顯示 503，不輸出密文、hash 或 salt。

若開發期間 generate 後出現 Unknown field，Prisma 的開發模式快取會檢查建構子版本，避免 HMR 重用舊模型的 client。

## 驗證

```sh
npm run test:ctf-web-labs
npm run test:ctf
```

- Web Lab 聚焦測試驗證密鑰／認證資料、HTML 轉義、Cookie Path、模擬票券及重跑匯入。
- CTF 整合測試以真實 HTTP 驗證登入、登出、隱藏題目、403／404、OJ 管理權限隔離、Flag 保留／替換和密文不外洩。
- 選用 Chromium 測試包含題目入口新分頁、迎新登記、Cookie 操作、票券探索與 390px 手機版面。
- 部署腳本在切換正式服務前，於隔離來源及拋棄式資料庫執行 production 與 Web Lab 測試。

## 正式站紀錄（2026-10-07）

- 原始碼小站：https://oj.itousouta.me/ctf/labs/1（100 分，原 Flag 及紀錄保留）。
- Cookie 會員站：https://oj.itousouta.me/ctf/labs/7（150 分）。
- 票券收藏站：https://oj.itousouta.me/ctf/labs/8（150 分）。
- 正式套用 `20261007090000_add_ctf_web_labs`；一致性備份為 `/opt/oj-deploy-backups/20261007-033946/oj.db`。
- 正式 Linux production build、14 項 CTF HTTP／資料庫整合測試、3 項入門題測試及 5 項 Web Lab 測試通過。Chromium 的新分頁、迎新登記、Cookie 操作、票券頁與手機版面已於本機驗證。
- 正式 HTTPS 實測三個網站及題目入口，驗證 Cookie Path／Secure、公告及票券的預期解題流程、Flag 與判題 hash 一致，以及練習 Cookie 無法取得 OJ 管理權限。
