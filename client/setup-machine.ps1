# 在選手機上安裝 itouOJ 收件程式：複製檔案、移除 Mark-of-the-Web（Unblock-File
# 只拿掉 Zone.Identifier 資料流，不動程式本體），並建立桌面捷徑，避免 SmartScreen 警告。
# 用法：與 itouOJ-Submit.exe 放在一起，在每台機器執行「在這台電腦安裝.bat」。

$ErrorActionPreference = "Stop"
$here = Split-Path -Parent $MyInvocation.MyCommand.Path

$source = Join-Path $here "itouOJ-Submit.exe"

# 優先裝在 C:\itouOJ，這樣同一台機器上每個使用者都看得到（機房常見的做法是
# 用管理員帳號佈署、學生用受限帳號考試）。建不起來就退回使用者自己的目錄，
# 免得因為權限不足就整個裝不起來。
$targetDir = "C:\itouOJ"
try {
    New-Item -ItemType Directory -Force -Path $targetDir -ErrorAction Stop | Out-Null
    [IO.File]::WriteAllText((Join-Path $targetDir ".probe"), "x")
    Remove-Item (Join-Path $targetDir ".probe") -Force
} catch {
    $targetDir = Join-Path $env:LOCALAPPDATA "Programs\itouOJ"
    Write-Host "  （沒有 C:\ 的寫入權限，改裝到使用者目錄）" -ForegroundColor Yellow
}
$target = Join-Path $targetDir "itouOJ-Submit.exe"

if (-not (Test-Path $source)) {
    Write-Host "找不到 itouOJ-Submit.exe" -ForegroundColor Red
    Write-Host "請確認它和這支腳本放在同一個資料夾。"
    Read-Host "按 Enter 結束"
    exit 1
}

Write-Host "== 安裝 itouOJ 收件程式 ==" -ForegroundColor Cyan
Write-Host ""

New-Item -ItemType Directory -Force -Path $targetDir | Out-Null
Copy-Item $source $target -Force
Write-Host "  已複製到 $target"

# 關鍵步驟：移除 Mark-of-the-Web，之後執行才不會跳 SmartScreen
Unblock-File -Path $target
$zone = Get-Content -Path $target -Stream Zone.Identifier -ErrorAction SilentlyContinue
if ($zone) {
    Write-Host "  警告：Mark-of-the-Web 沒有移除乾淨，執行時可能仍會跳警告" -ForegroundColor Yellow
} else {
    Write-Host "  已解除封鎖（不會再跳 SmartScreen 警告）"
}

$hash = (Get-FileHash $target -Algorithm SHA256).Hash
Write-Host "  SHA256 $hash"

# 使用說明書。機房沒有網路，線上版連不到，所以整份帶著走放到本機。
$manualSrc = Join-Path $here "使用說明書.html"
$manual = $null
if (Test-Path $manualSrc) {
    $manual = Join-Path $targetDir "使用說明書.html"
    Copy-Item $manualSrc $manual -Force
    Unblock-File -Path $manual
    Write-Host "  已複製使用說明書"
} else {
    Write-Host "  找不到使用說明書.html，略過（不影響程式使用）" -ForegroundColor Yellow
}

# 桌面捷徑優先放「所有使用者」桌面，但學校機房的受限帳號常寫不進去；以前只檢查
# 資料夾存在，存在卻沒權限時 CreateShortcut 才失敗。改成實際探測寫入權限再退回
# 目前使用者的桌面。
$desktop = [Environment]::GetFolderPath("CommonDesktopDirectory")
$canWriteCommon = $false
if ($desktop -and (Test-Path $desktop)) {
    try {
        $probe = Join-Path $desktop ".itouoj-probe"
        [IO.File]::WriteAllText($probe, "x")
        Remove-Item $probe -Force
        $canWriteCommon = $true
    } catch {
        $canWriteCommon = $false
    }
}
if (-not $canWriteCommon) {
    $desktop = [Environment]::GetFolderPath("Desktop")
    Write-Host "  （沒有共用桌面的寫入權限，改把捷徑放在目前使用者的桌面）" -ForegroundColor Yellow
}
$lnk = Join-Path $desktop "itouOJ 收件程式.lnk"
try {
    $shell = New-Object -ComObject WScript.Shell
    $shortcut = $shell.CreateShortcut($lnk)
    $shortcut.TargetPath = $target
    $shortcut.WorkingDirectory = $targetDir
    $shortcut.Description = "itouOJ 斷網比賽收件程式"
    $shortcut.Save()
    Write-Host "  已建立桌面捷徑：$lnk"

    # 說明書也放一份到桌面。選手在還沒開程式之前就會想看它。
    if ($manual) {
        $mlnk = Join-Path $desktop "itouOJ 使用說明書.lnk"
        $ms = $shell.CreateShortcut($mlnk)
        $ms.TargetPath = $manual
        $ms.Description = "itouOJ 收件程式使用說明書"
        $ms.Save()
        Write-Host "  已建立說明書桌面捷徑"
    }
} catch {
    Write-Host "  桌面捷徑建立失敗（不影響使用）：$($_.Exception.Message)" -ForegroundColor Yellow
}

# 註冊 itouoj:// 通訊協定，讓網站上的「開啟收件程式」按鈕能直接把程式叫起來。
# 寫在 HKCU 底下，不需要管理員權限。
try {
    $base = "HKCU:\Software\Classes\itouoj"
    New-Item -Path $base -Force | Out-Null
    Set-ItemProperty -Path $base -Name "(default)" -Value "URL:itouOJ Protocol"
    Set-ItemProperty -Path $base -Name "URL Protocol" -Value ""
    New-Item -Path "$base\shell\open\command" -Force | Out-Null
    Set-ItemProperty -Path "$base\shell\open\command" -Name "(default)" `
        -Value ('"' + $target + '" "%1"')
    Write-Host "  已註冊 itouoj:// 通訊協定（網站可直接開啟本程式）"
} catch {
    Write-Host "  通訊協定註冊失敗（不影響手動開啟）：$($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "安裝完成。" -ForegroundColor Green
Write-Host "接下來請在這台機器上開啟程式，到「賽前設定」分頁登入並選擇比賽。"
Write-Host ""
Read-Host "按 Enter 結束"
