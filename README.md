# itouOJ

自架的程式解題系統（OJ）。前後端用 Next.js 一體開發，評測引擎用 [Piston](https://github.com/engineer-man/piston) 沙箱執行使用者程式碼。

## 功能

- 帳號註冊 / 登入（第一個註冊的使用者自動成為管理員）
- 題目列表、Markdown + KaTeX 數學式題敘、範例測資
- CodeMirror 程式碼編輯器（C++ / C / Python / Java / JavaScript），自動保存草稿
- 即時判題：AC / WA / TLE / MLE / RE / CE，逐筆測資顯示時間與記憶體
- 提交紀錄、排行榜
- 管理後台：出題、測資編輯、時間/記憶體限制、公開/隱藏題目
- 亮暗雙主題切換

## 技術架構

| 層 | 技術 |
|----|------|
| 前端 + 後端 | Next.js 16（App Router）+ TypeScript + Tailwind CSS v4 |
| 資料庫 | SQLite + Prisma 7（better-sqlite3 driver adapter） |
| 評測引擎 | Piston（Docker，cgroup v2 沙箱） |
| 判題佇列 | in-process promise chain（`src/lib/judge.ts`），伺服器重啟自動恢復未完成的提交 |

```
瀏覽器 ──> nginx ──> Next.js (:3000)
                       │  SQLite
                       └──> Piston (127.0.0.1:2000, Docker)
```

## 本地開發

```bash
npm install                 # 會自動 prisma generate
npx prisma migrate dev      # 建立 SQLite 資料庫
npm run dev
```

`.env` 設定（參考）：

```env
DATABASE_URL="file:./dev.db"
AUTH_SECRET="<openssl rand -hex 32>"
PISTON_URL="http://localhost:2000"   # Piston 位址
COOKIE_SECURE="0"                    # 上 HTTPS 後改 1

# Google 登入（選用；沒設定就不顯示 Google 按鈕）
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
# APP_URL="https://oj.example.tw"    # 正式環境對外網址（組 OAuth redirect 用）
```

Google 登入設定：到 [Google Cloud Console](https://console.cloud.google.com/apis/credentials) 建立「OAuth 用戶端 ID」（類型：網頁應用程式），授權重新導向 URI 填 `http://localhost:3000/api/auth/google/callback`。正式環境要再加一組 `https://<你的網域>/api/auth/google/callback` —— Google 不接受純 IP 或 http 的正式網址，所以正式站要先有網域 + HTTPS 才能開 Google 登入，並在 `.env` 設好 `APP_URL`。第一次用 Google 登入會自動建立帳號（沿用「第一個使用者是管理員」規則）。

Piston 不在本機時，可用 SSH tunnel 接遠端的：`ssh -N -L 2000:localhost:2000 user@server`。

## 部署

1. 伺服器啟動 Piston（**只綁 localhost，Piston 沒有認證機制**）：

   ```bash
   docker run --privileged -v /opt/piston-data:/piston --tmpfs /tmp:exec \
     -dit --restart=always -p 127.0.0.1:2000:2000 \
     -e PISTON_COMPILE_TIMEOUT=15000 -e PISTON_RUN_TIMEOUT=20000 \
     -e PISTON_OUTPUT_MAX_SIZE=33554432 \
     --name piston_api ghcr.io/engineer-man/piston
   ```

   原版 Piston 有兩個問題會弄壞大測資（>100KB），**每次重建容器後都要重新打補丁**（`docker restart` 不會弄丟，`docker rm` + `docker run` 會）：

   ```bash
   # 1) HTTP API body 上限預設 100KB，判題送不進大測資 → 調成 16MB
   docker exec piston_api sed -i \
     "s/body_parser.json()/body_parser.json({ limit: '16mb' })/; s/body_parser.urlencoded({ extended: true })/body_parser.urlencoded({ extended: true, limit: '16mb' })/" \
     /piston_api/src/index.js
   # 2) stdin 寫入後立刻 destroy()，緩衝區沒寫完就被丟掉，程式只收得到前 ~200KB → 拿掉那行
   docker exec piston_api sed -i '/proc.stdin.destroy();/d' /piston_api/src/job.js
   docker restart piston_api
   ```

2. 安裝語言（照 `src/lib/languages.ts` 的版本）：

   ```bash
   curl -X POST http://localhost:2000/api/v2/packages -H 'Content-Type: application/json' \
     -d '{"language":"python","version":"3.12.0"}'
   # gcc 10.2.0 / java 15.0.2 / node 20.11.1 同理
   ```

3. 部署本體：`npm ci && npx prisma migrate deploy && npm run build`，用 systemd 跑 `next start`（範例在 [deploy/online-judge.service](deploy/online-judge.service)），前面掛 nginx 反向代理（[deploy/nginx-oj.conf](deploy/nginx-oj.conf)）。

4. 網域與 HTTPS（正式站 `https://oj.itousouta15.tw`）：DNS 加 A 記錄指到伺服器（Cloudflare 上選 DNS only），裝 `certbot python3-certbot-nginx` 後跑 `certbot --nginx -d oj.itousouta15.tw --redirect`（自動續簽由 certbot.timer 處理）。伺服器 `.env` 記得設 `APP_URL="https://oj.itousouta15.tw"`、`COOKIE_SECURE="1"` 和 Google 憑證。

## 日常更新（改完程式碼後）

```powershell
# 1. commit 修改（部署腳本打包的是已 commit 的內容，沒 commit 的改動不會上去）
git add -A
git commit -m "說明你改了什麼"

# 2. 一鍵部署：打包 → 上傳 → npm ci → migrate → build → 重啟服務
.\deploy\deploy.ps1

# 3. 同步到 GitHub
git push
```

- 想先在本地看效果：`npm run dev` 開 http://localhost:3000
- 評測功能要先接上伺服器的 Piston：`ssh -N -L 2000:localhost:2000 root@<server>`
- 改了 `prisma/schema.prisma` 的話，先在本地跑 `npx prisma migrate dev --name <名稱>` 產生 migration 再 commit，部署腳本會自動在伺服器套用

## 新增語言

1. Piston 裝套件：`POST /api/v2/packages`
2. 在 `src/lib/languages.ts` 加一筆對應（檔名、版本、時間/記憶體倍率）
