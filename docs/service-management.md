# 網頁管理主機服務

管理員登入後可在「伺服器服務」（`/admin/services`）查看網站、nginx、評測 worker、
評測 sandbox、互動終端的 systemd 狀態。worker 可啟動／設為開機自動啟動；
評測 sandbox、互動終端可啟動或重啟。nginx 可啟動，或先檢查設定再重新載入；
網站可重啟。頁面每 5 秒更新一次，網站重啟會延遲 5 秒執行，讓原請求先完成。
網站或 nginx 無法對外連線時，仍須由主機的 SSH／主控台恢復。

`GET/POST /api/admin/services` 每次都根據資料庫中的即時角色驗證管理員；POST
另檢查同站 Origin、Fetch Metadata 和固定的服務／操作清單。回應不快取，
不提供一般 shell、systemd 任意 unit、停止網站或重開整台主機的操作。
有問題時檢查 `journalctl -u online-judge`，`admin.service_action` / `admin.service_failed`
只記錄操作者 ID、固定服務與動作，不回傳系統指令的 stderr。

網站以 `oj` 身分執行，透過 sudoers 只能呼叫安裝在 `/usr/local/sbin/oj-service-control`
的 root-owned 腳本；腳本用完整路徑呼叫 systemctl/systemd-run，並自行逐一驗證參數。
不可把這支腳本放在 `oj` 可修改的 `/opt/online-judge` 下。正式站的
`deploy/remote-release.sh` 在部署時驗證腳本／sudoers、安裝兩個檔案、檢查授權，
失敗則還原先前設定。其他自行架設的 systemd 主機，請以 root 執行：

```sh
sh -n deploy/oj-service-control
visudo -cf deploy/online-judge-control.sudoers
install -o root -g root -m 755 deploy/oj-service-control /usr/local/sbin/oj-service-control
install -o root -g root -m 440 deploy/online-judge-control.sudoers /etc/sudoers.d/online-judge-control
visudo -cf /etc/sudoers.d/online-judge-control
runuser -u oj -- sudo -n -l /usr/local/sbin/oj-service-control worker start
```

服務不在同一台主機，或網站以非 `oj` 使用者執行時，需按實際部署調整此通道；
此介面只管理本機。驗證 API 與權限：`npm run test:services`。
