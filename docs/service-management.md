# 網頁管理主機服務

管理員登入後可在「伺服器服務」（`/admin/services`）查看網站、nginx、評測 worker、
評測 sandbox、互動終端的 systemd 狀態。worker 可啟動／設為開機自動啟動；
評測 sandbox、互動終端可啟動或重啟。nginx 可啟動，或先檢查設定再重新載入；
網站可重啟。頁面每 5 秒更新一次，網站重啟會延遲 5 秒執行，讓原請求先完成。
網站或 nginx 無法對外連線時，仍須由主機的 SSH／主控台恢復。

`GET/POST /api/admin/services` 每次都根據資料庫中的即時角色驗證管理員；POST
另檢查同站 Origin、Fetch Metadata 和固定的服務／操作清單。回應不快取，
不提供一般 shell、systemd 任意 unit、停止網站或重開整台主機的操作。
有問題時檢查 `journalctl -u online-judge -u online-judge-control`；
`admin.service_action` / `admin.service_failed` 和 `control.applied` / `control.failed`
不回傳系統指令的 stderr。

網站以 `oj` 身分執行且保留 `NoNewPrivileges=true`，無法透過 sudo 提權。
獨立的 root 控制服務只在 `/run/oj-service-control/control.sock` 接受 `oj` 群組的
本機請求；服務及操作均為固定清單，不接受指令或 unit 名稱。root-owned 控制腳本
以完整路徑呼叫 systemctl/systemd-run，並再次驗證參數。兩個控制程式不可放在
`oj` 可修改的 `/opt/online-judge` 下。正式站的 `deploy/remote-release.sh`
負責安裝控制服務和腳本、測試在 `NoNewPrivileges` 下可連線，失敗則還原先前設定。
其他自行架設的 systemd 主機，請以 root 執行：

```sh
sh -n deploy/oj-service-control
node --check deploy/oj-service-control-server.mjs
install -o root -g root -m 755 deploy/oj-service-control /usr/local/sbin/oj-service-control
install -o root -g root -m 644 deploy/oj-service-control-server.mjs /usr/local/sbin/oj-service-control-server.mjs
install -o root -g root -m 644 deploy/online-judge-control.service /etc/systemd/system/online-judge-control.service
systemctl daemon-reload
systemctl enable --now online-judge-control
runuser -u oj -- setpriv --no-new-privs curl --unix-socket /run/oj-service-control/control.sock -o /dev/null -w '%{http_code}' http://localhost/control # 405
```

服務不在同一台主機，或網站以非 `oj` 使用者執行時，需按實際部署調整此通道；
此介面只管理本機。驗證 API 與權限：`npm run test:services`。
