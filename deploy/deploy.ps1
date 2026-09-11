# One-click deploy（伺服器位址從 .env 的 DEPLOY_SERVER 讀，不寫死在腳本裡）
# Note: deploys "committed" content (git archive HEAD) - commit first.
#
#   .\deploy\deploy.ps1          互動式（有未 commit 改動時會詢問）
#   .\deploy\deploy.ps1 -Yes     不詢問，適合非互動環境

param([switch]$Yes)

$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)

# 伺服器位址：環境變數優先，再來是 .env 的 DEPLOY_SERVER，都沒有就報錯。
# 舊伺服器 23.146.248.51 的 online-judge 已停用，別再改回去。
function Get-DeployServer {
    if ($env:DEPLOY_SERVER) { return $env:DEPLOY_SERVER }
    $envFile = Join-Path (Split-Path $PSScriptRoot -Parent) ".env"
    if (Test-Path $envFile) {
        # 一定要指定 UTF8：PS 5.1 預設用 ANSI（CP950）讀，.env 裡的
        # 中文註解會被當成雙位元組字元、把後面的換行吃掉，整段黏成一行。
        $line = Get-Content -Encoding UTF8 $envFile |
            Where-Object { $_ -match '^\s*(?:export\s+)?DEPLOY_SERVER\s*=' } |
            Select-Object -First 1
        if ($line) {
            return ($line -replace '^\s*(?:export\s+)?DEPLOY_SERVER\s*=\s*', "").Trim().Trim('"').Trim("'")
        }
    }
    throw "找不到伺服器位址：請在 .env 設定 DEPLOY_SERVER（例如 DEPLOY_SERVER=""root@23.146.248.176""）或設環境變數 DEPLOY_SERVER"
}

$Server = Get-DeployServer
$AppDir = "/opt/online-judge"

# PowerShell 5.1 把原生指令寫到 stderr 的每一行都包成 ErrorRecord，配上
# ErrorActionPreference = "Stop" 就會在指令其實成功時中斷腳本。ssh 只要印出
# 「Loaded Prisma config from prisma.config.ts.」這種正常訊息就會踩到。
#
# 之前就是這樣：腳本在 ssh 那行報錯停住，但遠端其實已經把原始碼解壓上去了，
# 只是沒跑到 build 和 restart —— 正式站於是拿著舊的編譯產物跑新的原始碼。
#
# 正確的判斷依據是結束碼，不是有沒有 stderr 輸出。
function Invoke-Native {
    param(
        [Parameter(Mandatory)][string]$What,
        [Parameter(Mandatory)][scriptblock]$Command
    )
    $previous = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    try {
        & $Command
    } finally {
        $ErrorActionPreference = $previous
    }
    if ($LASTEXITCODE -ne 0) {
        throw "$What 失敗（exit code $LASTEXITCODE）"
    }
}

# 部署的是 git archive HEAD，工作區沒 commit 的改動不會上去。
# 這裡先提醒，免得改了半天卻部署到舊版本還以為新功能沒生效。
$dirty = git status --porcelain
if ($dirty) {
    Write-Host "== 警告：有未 commit 的改動，這些不會被部署 ==" -ForegroundColor Yellow
    $dirty -split "`n" | Select-Object -First 10 | ForEach-Object { Write-Host "   $_" -ForegroundColor Yellow }

    if ($Yes) {
        Write-Host "   （-Yes 已指定，繼續以 HEAD 部署）" -ForegroundColor Yellow
    } elseif ([Environment]::UserInteractive -and $Host.UI.RawUI) {
        $answer = Read-Host "仍要以目前的 HEAD 部署嗎？(y/N)"
        if ($answer -ne "y") { Write-Host "已取消。"; exit 1 }
    } else {
        # 非互動環境（CI、自動化工具）問不到人，寧可停下來也不要默默部署到舊版本
        throw "有未 commit 的改動且無法詢問；確定要以 HEAD 部署請加上 -Yes"
    }
}

$head = (git rev-parse --short HEAD).Trim()
Write-Host "== Packaging HEAD ($head) =="
Invoke-Native "git archive" { git archive --format=tar.gz -o "$env:TEMP\oj.tar.gz" HEAD }

Write-Host "== Uploading =="
Invoke-Native "scp" { scp "$env:TEMP\oj.tar.gz" "${Server}:/tmp/oj.tar.gz" }

# 資料庫是 oj.db（.env 的 DATABASE_URL="file:./oj.db"）。目錄下那個 0 bytes 的
# dev.db 是殘留檔，備份它等於沒備份。
Write-Host "== Backing up database =="
# 遠端指令裡避免用雙引號：PowerShell 的跳脫在傳給 ssh 的過程中會被吃掉，
# bash 收到裸括號就會語法錯誤。要引用就用單引號（PowerShell 原樣傳遞）。
Invoke-Native "backup" {
    ssh $Server "cd $AppDir && BK=oj.db.bak-`$(date +%Y%m%d-%H%M%S) && cp oj.db `$BK && stat -c '   backup: %n  %s bytes' `$BK && ls -1t oj.db.bak-* | tail -n +6 | xargs -r rm -f"
}

Write-Host "== Server: extract / install / migrate / build / restart =="
Invoke-Native "remote deploy" {
    ssh $Server "cd $AppDir && tar xzf /tmp/oj.tar.gz && npm ci --silent && npx prisma migrate deploy && npm run build && chown -R oj:oj $AppDir && systemctl restart online-judge && sleep 3 && systemctl is-active online-judge"
}

# 光看 systemctl is-active 不夠：服務可能還跑著上一版的建置產物。
# 確認 .next 是剛剛才產生的，而且網站真的回得了 200。
Write-Host "== Verifying =="
Invoke-Native "verify build freshness" {
    ssh $Server "cd $AppDir && AGE=`$(( `$(date +%s) - `$(stat -c %Y .next) )) && printf '   .next built %ss ago\n' `$AGE && [ `$AGE -lt 600 ]"
}

$status = (Invoke-WebRequest -Uri "https://oj.itousouta.me/" -UseBasicParsing -TimeoutSec 30).StatusCode
if ($status -ne 200) { throw "網站回應 HTTP $status" }
Write-Host "   https://oj.itousouta.me/ -> HTTP $status"

Write-Host "== Done ($head) -> https://oj.itousouta.me ==" -ForegroundColor Green
