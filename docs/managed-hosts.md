# 遠端 Server 與評測備援

管理員在 `/admin/hosts` 新增 Server，填入名稱、供辨識用的位址及「主要／備援」角色。
網站只保存接入憑證的 SHA-256 雜湊；新增或重發時憑證只顯示一次，請在關閉頁面前
存入遠端主機的設定檔。位址只作標示，網站不會對它發送 SSH 或 HTTP 請求。

每台遠端主機執行一個評測 worker 和一個輕量管理 agent。兩者以同一接入憑證，
**由主機主動以 HTTPS 連回**網站；主機不需開放新的入站連接埠。agent 每 5 秒回報
評測 worker 和 sandbox 的 systemd 狀態；超過 30 秒沒有回報，後台標為離線。
管理員可停用／啟用主機、調整角色或位址、重發憑證，以及排入 worker／sandbox
的啟動或重啟操作。操作透過 agent 拉取，僅能呼叫固定的本機服務。若操作送出後
兩分鐘內沒有回報，顯示 UNKNOWN，需人工確認是否已執行，再決定是否重新操作。

「主要」與「備援」代表用途，**兩者平時都可以領取評測工作**。提交存在網站主機
的 SQLite 佇列中，多個 worker 原子領取；只要協調站仍在線，某台 worker 故障時
其他 worker 會繼續領取等待中的提交，已被中斷的提交在租約逾期（最多 15 分鐘）
後回收重試。這是評測執行器的備援，不是網站協調站或資料庫的故障切換。

## 新主機接入

先在遠端 Linux 主機安裝並驗證 `sandbox-server` 及 jail，建立 `oj` 帳號與群組，
以與協調站相同的 itouOJ 版本安裝 `/opt/online-judge` 及 `npm ci`；參考
`docs/judge-reliability.md` 的遠端執行環境。以下安裝需要在遠端主機上由 root 執行：

```sh
install -o root -g root -m 755 deploy/oj-service-control /usr/local/sbin/oj-service-control
install -o root -g root -m 644 deploy/oj-service-control-server.mjs /usr/local/sbin/oj-service-control-server.mjs
install -o root -g root -m 644 deploy/online-judge-control.service /etc/systemd/system/online-judge-control.service
install -o root -g root -m 644 deploy/online-judge-host-agent.service /etc/systemd/system/online-judge-host-agent.service
install -o root -g root -m 644 deploy/online-judge-remote@.service /etc/systemd/system/online-judge-remote@.service
install -d -o root -g root -m 700 /etc/online-judge
```

以 root 建立 `/etc/online-judge/remote-managed.env`（權限 `0600`），內容如下，
**不要把憑證提交到 Git**：

```text
JUDGE_WORKER_URL=https://oj.itousouta.me
JUDGE_WORKER_SECRET=後台新增主機時顯示的一次性憑證
SANDBOX_URL=http://127.0.0.1:8090
JUDGE_WORKER_ID=host-b
```

接著啟動服務：

```sh
systemctl daemon-reload
systemctl enable --now online-judge-control.service
systemctl enable --now online-judge-host-agent.service
systemctl enable --now online-judge-remote@managed.service
systemctl is-active sandbox-server online-judge-control online-judge-host-agent online-judge-remote@managed
```

遠端 worker 不會讀取或複製網站資料庫；評測測資只從協調站授權 API 取得。
停用主機或重發憑證會讓舊憑證立刻失效；進行中的評測若失去心跳，會在租約到期
後由其他 worker 重新接手。若要觀察連線或操作結果，查看後台主機清單及遠端
`journalctl -u online-judge-host-agent -u online-judge-remote@managed -u online-judge-control`。
