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

Write-Host "== Staging sandbox and website release =="
$release = "/tmp/oj-release-$head-$(Get-Date -Format 'yyyyMMddHHmmss')-$PID"
Invoke-Native "stage release" {
    ssh $Server "test -d /tmp && test -d $AppDir && test ! -e $release && tar tzf /tmp/oj.tar.gz >/dev/null && mkdir $release && tar xzf /tmp/oj.tar.gz -C $release && ln -s $AppDir/.env $release/.env"
}

# Git for Windows may export text entries with CRLF even when the committed
# blob is LF. Bash then reads the trailing CR as part of `pipefail` and exits
# before any preflight or rollback handler is installed.
Invoke-Native "normalize staged shell script" {
    ssh $Server "sed -i 's/\r$//' $release/deploy/remote-release.sh && bash -n $release/deploy/remote-release.sh"
}

Write-Host "== Build / test / promote / verify / rollback on failure =="
Invoke-Native "remote deploy" {
    ssh $Server "bash $release/deploy/remote-release.sh $release"
}

# Double-check the persistent database directory after promotion. A release
# built from an older HEAD may not yet contain the remote ownership fix.
Invoke-Native "verify database writable by oj" {
    ssh $Server "chown oj:oj $AppDir && runuser -u oj -- sqlite3 $AppDir/oj.db 'BEGIN IMMEDIATE; CREATE TABLE __oj_deploy_write_probe (id INTEGER); ROLLBACK;'"
}

Write-Host "== Verifying public site =="

$status = (Invoke-WebRequest -Uri "https://oj.itousouta.me/" -UseBasicParsing -TimeoutSec 30).StatusCode
if ($status -ne 200) { throw "網站回應 HTTP $status" }
Write-Host "   https://oj.itousouta.me/ -> HTTP $status"

Write-Host "== Done ($head) -> https://oj.itousouta.me ==" -ForegroundColor Green
