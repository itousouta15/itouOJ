# One-click deploy to 23.146.248.176
# 2026-07-20 migrated to a new server (old one's disk filled up), old server
# 23.146.248.51 has online-judge disabled now.
# Note: deploys "committed" content (git archive HEAD) - commit first.
$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)

Write-Host "== Packaging HEAD =="
git archive --format=tar.gz -o "$env:TEMP\oj.tar.gz" HEAD

Write-Host "== Uploading =="
scp "$env:TEMP\oj.tar.gz" root@23.146.248.176:/tmp/oj.tar.gz

Write-Host "== Server: extract / install / migrate / build / restart =="
ssh root@23.146.248.176 "cd /opt/online-judge && tar xzf /tmp/oj.tar.gz && npm ci --silent && npx prisma migrate deploy && npm run build && chown -R oj:oj /opt/online-judge && systemctl restart online-judge && sleep 3 && systemctl is-active online-judge"

Write-Host "== Done -> https://oj.itousouta.me =="
