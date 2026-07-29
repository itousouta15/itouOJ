# 發布收件程式

選手是從 GitHub Releases 下載收件程式的，所以「發布」＝把新版的 exe 和
機房佈署包放上去。伺服器端的部署是另一回事，見 `deploy/deploy.ps1`。

整個流程由 **`client/release.ps1`** 包起來，不要手動打包 —— 佈署包少放一個檔
就會讓安裝腳本半殘，而且 SHA256 必須是最後真正上傳的那顆 exe 的。

---

## 需要什麼

| 東西 | 用途 | 沒有的話 |
|---|---|---|
| .NET Framework 4.x | 編譯 exe（用 Windows 內建的 `csc.exe`） | Windows 10 / 11 都內建 |
| [gh CLI](https://cli.github.com/) | 建立 Release、上傳附件 | `winget install GitHub.cli` 後 `gh auth login` |

不需要 Visual Studio，也不需要 .NET SDK。

---

## 步驟

### 1. 先跑測試

```powershell
$csc = "$env:WINDIR\Microsoft.NET\Framework64\v4.0.30319\csc.exe"
$refs = "System.dll,System.Core.dll,System.Drawing.dll,System.Windows.Forms.dll,System.Web.Extensions.dll"
& $csc /nologo /target:exe /codepage:65001 /main:ItouOJ.TestHarness `
    /out:client\TestHarness.exe "/reference:$refs" `
    client\Theme.cs client\Core.cs client\Dialogs.cs client\MainForm.cs client\TestHarness.cs

.\client\TestHarness.exe http://localhost:3000 <帳號> <密碼>
```

測試套件跟 GUI 用**同一份原始碼**編譯，所以它驗的就是選手實際會跑到的程式。
會跑完登入、取比賽、取題目、寫 spool、上傳、去重、時間夾制、
換人使用的資料隔離整條流程。

看到 `===== 全部通過 =====` 才往下走。跑完把 `TestHarness.exe` 刪掉，
它不屬於發布內容（`.gitignore` 已經排除 `client/*.exe`）。

> 需要一台跑得起來的 itouOJ 和一組能登入的帳號。用 production 也可以，
> 但會在資料庫留下測試提交。

### 2. 決定版本號

`vX.Y.Z`：

| 什麼變了 | 動哪一位 |
|---|---|
| 只修 bug，選手的操作方式沒變 | Z |
| 加了功能、介面有變、流程有變 | Y |
| 舊版設定檔不能用了，或必須全機房重裝 | X |

**比賽當天用的版本要在賽前幾天就定下來並實機測過。** 賽前一天才發新版，
等於把沒人跑過的東西送進機房。

### 3. 寫發行說明

寫成一個 markdown 檔（放 `client/dist/` 或任何暫存位置都行，不要進 git）。

一定要寫的：

- **這一版改了什麼**，尤其是選手操作方式的變化
- **舊版有沒有非升不可的理由**（例如 v1.1.0 的就緒回報根本沒作用）
- **下載哪一個檔**：`itouOJ-lab-deploy-kit.zip` 給機房、`itouOJ-Submit.exe` 給單機
- **SmartScreen 的說明**：每一版都要留著。這是收到最多次的問題，
  而且新來的人不會回頭去翻舊版的說明
- **SHA256**：寫成 `{{SHA256}}` 佔位符就好，**不要手寫**

```
## 校驗

itouOJ-Submit.exe
SHA256  {{SHA256}}
```

> **為什麼不能手寫。** 這裡用的是 .NET Framework 內建的舊版 `csc.exe`，
> 不支援 `/deterministic` —— 同一份原始碼每次編譯出來的 exe 都不一樣
> （內嵌的 MVID 每次重新產生）。你在步驟 4 拿到的雜湊，跟步驟 5 重新建置後
> 真正上傳的那顆對不上。腳本會在上傳前把 `{{SHA256}}` 換成實際值，
> 兩者永遠一致。
>
> 附帶結果：**這個專案的 exe 無法由第三方重建驗證**。校驗值只能證明
> 「下載到的檔案跟我發布的是同一個」，不能證明「它就是這份原始碼編出來的」。

前一版的說明可以直接抄來改：

```powershell
gh release view v1.2.0 --json body | ConvertFrom-Json | Select-Object -Expand body > notes.md
```

### 4. 先打包一次，拿到 SHA256

```powershell
.\client\release.ps1
```

不給 `-Tag` 就只建置和打包，不會碰到 GitHub。產物在 `client\dist\`：

```
itouOJ-Submit.exe            單一執行檔
itouOJ-lab-deploy-kit.zip    機房佈署包
```

畫面會印出 exe 的 SHA256，把它填進發行說明。

**順手開一次 zip 確認內容**（少一個檔腳本會直接報錯，但親眼看過比較安心）：

| 檔案 | 是什麼 |
|---|---|
| `00-先看這個.txt` | 佈署包導覽，說明每個檔案的用途 |
| `install-on-this-pc.bat` | 在選手機上安裝，監考點的就是這個 |
| `setup-machine.ps1` | 上面那個 .bat 實際呼叫的腳本 |
| `itouOJ-Submit.exe` | 收件程式本體 |
| `使用說明書.html` | 給選手看的說明書，安裝時會複製到桌面 |
| `README.md` | 技術細節 |
| `sample/` | 驗證 g++ 可用、驗證非 C++ 會被擋 |

### 5. 發布

```powershell
.\client\release.ps1 -Tag v1.2.1 -NotesFile notes.md
```

腳本會重新建置、重新打包，然後建立 Release 並上傳兩個附件。

自己會擋掉的狀況：

- 版本號格式不對
- 這個 tag 已經發布過
- 找不到 `gh`
- 佈署包缺檔
- 發行說明裡沒有 `{{SHA256}}` 佔位符（會問一次）
- 工作區有未提交的變更（會問一次；發出去的東西應該對得上某個 commit）

`gh release create` 就算附件只上傳一半也可能回傳成功，所以腳本最後會
回頭確認兩個附件都在、狀態都是 `uploaded`。

### 6. 發布後確認

```powershell
gh release view v1.2.1
```

然後**實際下載一次**，在一台乾淨的機器上跑 `install-on-this-pc.bat`。
從瀏覽器下載的檔案才會有 Mark-of-the-Web，本機建置的沒有 ——
**只有真的下載下來才測得到 SmartScreen 那條路徑**。

---

## 要重發同一個版本

```powershell
gh release delete v1.2.1 --yes
git push --delete origin v1.2.1
```

然後重跑步驟 5。

已經有人下載過的版本不要這樣做，改發下一個修訂號。

---

## 只想改發行說明

```powershell
gh release edit v1.2.1 --notes-file notes.md
```

不會動到附件。
