# GitHub master 一鍵部署

管理員在 `/admin/deployment` 可比較正式站版本與 GitHub `master`，按一下排入
**當下看到的確切提交**。設定專用 GitHub Actions 權杖後，按鈕會立即觸發 workflow；
若尚未設定或即時觸發暫時失敗，工作仍會留在佇列等待 GitHub Actions
（`.github/workflows/deploy.yml`）的排程接手。Actions 有待部署版本才下載原始碼、
用 Emscripten 4.0.23 建置喵++ Wasm、將兩份壓縮檔傳至伺服器，並呼叫既有
`deploy/remote-release.sh` 做建置、測試、切換和必要時的回復。網站程序不讀取
GitHub 權杖，也不在正式站上編譯 Wasm。

站上 `online-judge-control` 只開放固定的 `/deployment` 請求，不接受從網頁指定
Git URL、指令或提交。Actions 領取後會驗證提交仍在 GitHub `master` 歷史中；
遠端腳本還會檢查原始碼壓縮檔內的 Git 提交編號是否吻合，驗證後才更新
`/var/lib/oj-git-deploy/revision`。
網站與 `nginx` 停止時，管理頁不能用，仍須從 SSH／主控台恢復。

## 首次設定

1. 設定 GitHub Actions repository secrets：
   - `OJ_DEPLOY_HOST`：目前正式站的主機位址。
   - `OJ_DEPLOY_SSH_KEY`：只用於部署的 SSH 私鑰；公鑰放入正式站 root 的
     `authorized_keys`。部署需操作 systemd 與資料庫遷移，所以這把金鑰只供受信任
     的 `master` 排程工作使用，不要放進網站 `.env`。
   - `OJ_DEPLOY_KNOWN_HOSTS`：已核對指紋的正式站 SSH 主機公鑰紀錄。
2. 先用 `deploy/deploy.ps1` 部署含此功能的提交，腳本會安裝 root-owned 的排程
   狀態程式，並於成功後寫入正式站提交編號。
3. 如需按鈕後立即執行，在 GitHub 建立**僅限此 repository**、具有 **Actions:
   Read and write** 權限的細粒度 Personal Access Token。由主機 root 將權杖存到
   `/etc/online-judge/deploy-dispatch-token`（root 擁有，`0600`；目錄 `0700`），
   不要放入網站 `.env`、Git、瀏覽器或對話內容。控制服務會用它只呼叫固定的
   `deploy.yml`、固定的 `master`；沒有權杖時管理頁會顯示排程模式。
   在正式站以 root 登入後，可用下列指令讓輸入不出現在 shell history：

   ```sh
   install -d -m 700 /etc/online-judge
   read -rs -p 'GitHub Actions token: ' DEPLOY_TOKEN; printf '\n'
   install -m 600 /dev/null /etc/online-judge/deploy-dispatch-token
   printf '%s' "$DEPLOY_TOKEN" > /etc/online-judge/deploy-dispatch-token
   unset DEPLOY_TOKEN
   ```

   權杖過期時在同一路徑更新即可，不需重啟網站。
4. 按管理頁的部署按鈕，或在 GitHub 手動執行 `Deploy requested GitHub release`
   workflow 讓已排入的工作啟動；工作沒有排入時不會部署。

GitHub Actions 的來源必須包含目前正式站版本；排入時及正式切換前都會檢查
目標提交確實比目前版本新。若兩條歷史分叉或目標較舊，部署會停止，不會
覆蓋較新的正式站。管理頁的狀態與最近 32 KB 的正式站部署輸出來自 root-owned
記錄檔；排入新版本時，會保留前一次部署結果與輸出供查閱。打包階段可從同頁連到
對應的 GitHub Actions 執行紀錄。工作區未 commit
或未推送的修改不會被當成可部署版本。

部署成功後僅保留最近三份成功的 `/opt/oj-deploy-backups/` 回復點。更多部署訊息可看
GitHub Actions 執行紀錄、`journalctl -u online-judge-control`，以及正式站部署
日誌。管理 API 授權與狀態機測試：`npm run test:deployment`。
