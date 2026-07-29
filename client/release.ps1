# 打包並發布 itouOJ 收件程式
#
#   .\client\release.ps1                          只建置 + 打包，不發布
#   .\client\release.ps1 -Tag v1.2.1 -NotesFile notes.md    連同發布到 GitHub
#
# 產物放在 client\dist\ 底下：
#   itouOJ-Submit.exe            單一執行檔
#   itouOJ-lab-deploy-kit.zip    機房佈署包
#
# 為什麼要有這支：佈署包的內容（少放一個檔就會讓安裝腳本半殘）和
# SHA256 的計算時機（必須是最後那顆 exe）以前都靠手動，很容易出錯。

[CmdletBinding()]
param(
    # 要發布時給，例如 v1.2.1。不給就只建置不發布。
    [string]$Tag,
    # 發行說明的檔案路徑，跟 -Tag 一起用
    [string]$NotesFile,
    # 發行標題，不給就用 "itouOJ 收件程式 <Tag>"
    [string]$Title,
    # 略過「工作區有未提交變更」的確認
    [switch]$Yes
)

$ErrorActionPreference = "Stop"
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$repo = Split-Path -Parent $here

function Step($msg) { Write-Host "`n== $msg" -ForegroundColor Cyan }
function Ok($msg)   { Write-Host "   $msg" -ForegroundColor Green }
function Warn($msg) { Write-Host "   $msg" -ForegroundColor Yellow }

# 佈署包內容。少一個都會讓 install-on-this-pc.bat 半殘，所以集中在這裡列。
$kitFiles = @(
    "00-先看這個.txt",
    "itouOJ-Submit.exe",
    "install-on-this-pc.bat",
    "setup-machine.ps1",
    "使用說明書.html",
    "README.md"
)
$kitDirs = @("sample")

# ── 前置檢查 ────────────────────────────────────────
Step "檢查"

if ($Tag) {
    if (-not $NotesFile) { throw "有 -Tag 就必須給 -NotesFile" }
    if (-not (Test-Path $NotesFile)) { throw "找不到發行說明檔：$NotesFile" }
    if ($Tag -notmatch '^v\d+\.\d+\.\d+$') { throw "版本號格式應為 vX.Y.Z，收到：$Tag" }
    if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
        throw "找不到 gh CLI，無法發布。安裝：https://cli.github.com/"
    }
    $existing = $null
    try {
        $existing = & gh release view $Tag --json tagName 2>$null
    } catch {
        $existing = $null
    }
    if ($existing) { throw "$Tag 已經發布過了。要重發請先 gh release delete $Tag" }
}

$dirty = & git -C $repo status --porcelain
if ($dirty -and -not $Yes) {
    Warn "工作區有未提交的變更："
    $dirty | Select-Object -First 10 | ForEach-Object { Write-Host "     $_" }
    if ($Tag) {
        # 發布出去的東西應該對得上某個 commit，否則出事時追不回來
        $ans = Read-Host "   仍要繼續發布嗎？(y/N)"
        if ($ans -ne "y") { throw "已取消" }
    }
}
Ok "檢查通過"

# ── 建置 ────────────────────────────────────────────
Step "建置"
& (Join-Path $here "build.ps1")
if ($LASTEXITCODE -ne 0) { throw "建置失敗" }

$exe = Join-Path $here "itouOJ-Submit.exe"
if (-not (Test-Path $exe)) { throw "建置沒有產出 itouOJ-Submit.exe" }

# ── 打包 ────────────────────────────────────────────
Step "打包佈署包"

$dist = Join-Path $here "dist"
$staging = Join-Path $dist "kit"
if (Test-Path $staging) { Remove-Item $staging -Recurse -Force }
New-Item -ItemType Directory -Force -Path $staging | Out-Null

foreach ($f in $kitFiles) {
    $p = Join-Path $here $f
    if (-not (Test-Path $p)) { throw "佈署包缺少檔案：$f" }
    Copy-Item $p -Destination $staging -Force
}
foreach ($d in $kitDirs) {
    $p = Join-Path $here $d
    if (-not (Test-Path $p)) { throw "佈署包缺少資料夾：$d" }
    Copy-Item $p -Destination $staging -Recurse -Force
}

$zip = Join-Path $dist "itouOJ-lab-deploy-kit.zip"
# 剛建置出來的 exe 常常被防毒軟體即時掃描短暫鎖住，Compress-Archive 這時候
# 讀檔會直接噴 UnauthorizedAccessException。重試幾次、每次等一下再試。
for ($i = 1; $i -le 5; $i++) {
    try {
        Compress-Archive -Path (Join-Path $staging "*") -DestinationPath $zip -Force -ErrorAction Stop
        break
    } catch {
        if ($i -eq 5) { throw }
        Start-Sleep -Seconds 2
    }
}
Copy-Item $exe -Destination $dist -Force
Remove-Item $staging -Recurse -Force

$distExe = Join-Path $dist "itouOJ-Submit.exe"
$hash = (Get-FileHash $distExe -Algorithm SHA256).Hash
Ok ("itouOJ-Submit.exe          " + [math]::Round((Get-Item $distExe).Length / 1KB, 1) + " KB")
Ok ("itouOJ-lab-deploy-kit.zip  " + [math]::Round((Get-Item $zip).Length / 1KB, 1) + " KB")
Ok ("SHA256  $hash")

# 發行說明裡的 SHA256 由這裡填，不要手寫。
#
# 這台用的是 .NET Framework 內建的舊版 csc，不支援 /deterministic —— 同一份
# 原始碼每次編譯出來的 exe 都不一樣（內嵌的 MVID 每次重新產生）。所以事先
# 手寫的校驗值必然對不上最後真的上傳的那顆，publish 出去反而是錯的資訊。
# 改成把說明裡的 {{SHA256}} 換成剛剛算出來的值，兩者永遠一致。
$notesForRelease = $NotesFile
if ($NotesFile) {
    $utf8 = New-Object Text.UTF8Encoding($false)
    $notes = [IO.File]::ReadAllText((Resolve-Path $NotesFile), $utf8)
    if ($notes.Contains("{{SHA256}}")) {
        $notesForRelease = Join-Path $dist "release-notes.md"
        [IO.File]::WriteAllText($notesForRelease, $notes.Replace("{{SHA256}}", $hash), $utf8)
        Ok "已把發行說明裡的 {{SHA256}} 換成實際校驗值"
    } elseif ($notes -match $hash) {
        Ok "發行說明已含正確的校驗值"
    } else {
        Warn "發行說明裡沒有 {{SHA256}} 佔位符，發布出去不會有校驗值"
        if (-not $Yes) {
            $ans = Read-Host "   仍要繼續嗎？(y/N)"
            if ($ans -ne "y") { throw "已取消" }
        }
    }
}

if (-not $Tag) {
    Write-Host "`n打包完成，產物在 $dist" -ForegroundColor Green
    Write-Host "要發布請加上 -Tag vX.Y.Z -NotesFile <說明檔>"
    return
}

# ── 發布 ────────────────────────────────────────────
Step "發布 $Tag"

if (-not $Title) { $Title = "itouOJ 收件程式 $Tag" }

& gh release create $Tag $zip $distExe --title $Title --notes-file $notesForRelease
if ($LASTEXITCODE -ne 0) { throw "gh release create 失敗" }

# 上傳可能部分失敗而 gh 仍然回 0，所以回頭確認兩個檔都在
$assets = (& gh release view $Tag --json assets | ConvertFrom-Json).assets
$names = $assets | ForEach-Object { $_.name }
foreach ($want in @("itouOJ-lab-deploy-kit.zip", "itouOJ-Submit.exe")) {
    if ($names -notcontains $want) { throw "發布後找不到附件：$want" }
}
$bad = $assets | Where-Object { $_.state -ne "uploaded" }
if ($bad) { throw ("附件上傳未完成：" + ($bad.name -join ", ")) }

Ok "兩個附件都上傳完成"
Write-Host "`n發布完成：https://github.com/itousouta15/itouOJ/releases/tag/$Tag" -ForegroundColor Green
