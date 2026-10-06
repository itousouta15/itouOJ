# 測資匯入與 HTTP 413

## 目前上限

`deploy/nginx-oj.conf` 的 `client_max_body_size 50m` 允許每次請求最多 **50 MiB（52,428,800 bytes）**。管理員新增／編輯題目、出題申請都把題敘與所有測資包成一份 JSON 送出；管理員上傳 PDF 時，base64 內容也包含在同一份請求內。

這不是原始 `.in`／`.out` 檔案總大小限制：換行、引號與反斜線經過 JSON 跳脫會增加大小，PDF 的 base64 約為原始大小的 4/3。因此原始測資合計不到 50 MiB，仍可能收到 413。

413 若由 Nginx 回傳，請求尚未進入題目 API，單純增加前端匯入容量不會解決。

## 同步伺服器設定

正式部署 `deploy/remote-release.sh` 在驗證應用程式後，會執行 `deploy/sync-nginx-upload-limit.sh`，只同步 OJ site 的上傳限制。腳本會備份原設定、執行 `nginx -t`、reload；驗證或 reload 失敗會還原設定。備份放在解析 symlink 後的 site 所在目錄，避免被 `sites-enabled/*` 一起載入。

若只需要更新限制，在伺服器以 root 執行：

```sh
bash /opt/online-judge/deploy/sync-nginx-upload-limit.sh /opt/online-judge/deploy/nginx-oj.conf
```

若要再調高，先修改 `deploy/nginx-oj.conf` 的 `50m`，再同步。現有部署工具使用 `git archive HEAD`，部署的是已提交版本。

## 可以調到多少？

2026-10-06 實查正式機器約有 9.7 GiB RAM、8.1 GiB 可用記憶體及 39 GiB 可用磁碟。**先採 50 MiB／請求**；如果實際題目仍超過，可把 **100 MiB 當作下一個壓測目標**，但目前沒有足夠的負載測試來宣稱它是可靠上限。

現有流程會在瀏覽器、Node JSON 解析、Prisma／SQLite 和判題時建立多份測資資料，尖峰記憶體高於請求大小，且會隨同時匯入與判題的數量增加。更大的測資集應改成分批／逐檔上傳及逐筆讀取，避免持續放大單次 JSON。

另有兩個獨立的判題限制（`sandbox-runner/src/server.c`）：

- `MAX_REQUEST_BYTES` 為 **8 MiB**：單次送到沙箱的 JSON 包含一筆輸入、程式碼及相關欄位。整題上傳成功不代表單筆大型輸入一定能判題。
- `MAX_CAPTURE_BYTES` 為 **1 MiB**：沙箱每個輸出串流的擷取上限。調大題目上傳限制不會跟著增加程式輸出容量。

目前題目 API 使用 Next.js App Router Route Handlers（`request.json()`），沒有使用 `proxy.ts`；Pages API 的 `bodyParser.sizeLimit`、Server Actions 的 `bodySizeLimit` 及 Proxy 的 `proxyClientMaxBodySize` 不適用這次的 413。
