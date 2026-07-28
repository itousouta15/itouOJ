# 建置 itouOJ 收件程式
#
# 用 Windows 內建的 .NET Framework 編譯器，不需要安裝 Visual Studio 或 .NET SDK。
# 產出的 itouOJ-Submit.exe 只依賴 .NET Framework 4.x（Windows 10/11 內建），
# 複製到選手機就能直接執行。

$ErrorActionPreference = "Stop"
$here = Split-Path -Parent $MyInvocation.MyCommand.Path

$csc = Join-Path $env:WINDIR "Microsoft.NET\Framework64\v4.0.30319\csc.exe"
if (-not (Test-Path $csc)) {
    $csc = Join-Path $env:WINDIR "Microsoft.NET\Framework\v4.0.30319\csc.exe"
}
if (-not (Test-Path $csc)) {
    throw "找不到 csc.exe，這台機器缺少 .NET Framework 4.x"
}

$src = @("Core.cs", "Dialogs.cs", "MainForm.cs") | ForEach-Object { Join-Path $here $_ }
$out = Join-Path $here "itouOJ-Submit.exe"

$refs = @(
    "System.dll",
    "System.Core.dll",
    "System.Drawing.dll",
    "System.Windows.Forms.dll",
    "System.Web.Extensions.dll"
) -join ","

# /codepage:65001 = 原始碼是 UTF-8（沒有這個選項，csc 會用系統 ANSI 讀，中文會變亂碼）
# /target:winexe  = GUI 程式，執行時不會跳出黑色主控台視窗
& $csc /nologo /target:winexe /codepage:65001 /optimize+ /platform:anycpu `
    "/out:$out" "/reference:$refs" @src

if ($LASTEXITCODE -ne 0) { throw "編譯失敗（exit $LASTEXITCODE）" }

$size = [math]::Round((Get-Item $out).Length / 1KB, 1)
Write-Output ""
Write-Output "建置完成: $out  ($size KB)"
