# 一鍵部署到 23.146.248.51
# 注意：部署的是「已 commit」的內容（git archive HEAD），改完記得先 commit
$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)

Write-Host "== 打包 HEAD =="
git archive --format=tar.gz -o "$env:TEMP\oj.tar.gz" HEAD

Write-Host "== 上傳 =="
scp "$env:TEMP\oj.tar.gz" root@23.146.248.51:/tmp/oj.tar.gz

Write-Host "== 伺服器：解壓 / 安裝 / 遷移 / build / 重啟 =="
ssh root@23.146.248.51 "cd /opt/online-judge && tar xzf /tmp/oj.tar.gz && npm ci --silent && npx prisma migrate deploy && npm run build && chown -R oj:oj /opt/online-judge && systemctl restart online-judge && sleep 3 && systemctl is-active online-judge"

Write-Host "== 完成 → https://oj.itousouta15.tw =="
