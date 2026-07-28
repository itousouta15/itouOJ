# itouOJ 收件程式

斷網比賽用的 Windows 桌面程式。比賽期間選手機沒有網路，這支程式只把程式碼存在
**本機**；等重新連網後一次上傳到伺服器，由 judge 補判，結果照常出現在網站上
各自的帳號與計分板。

## 為什麼是 23 KB

用 Windows 內建的 .NET Framework 編譯器建置，只依賴 .NET Framework 4.x
（Windows 10 / 11 都內建）。**選手機不需要安裝任何東西**，複製 exe 過去就能跑。

## 建置

```powershell
.\client\build.ps1
```

需要 `C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe`，這是 Windows
內建的，不用裝 Visual Studio 或 .NET SDK。產出 `client\itouOJ-Submit.exe`。

## 使用流程

### 1. 賽前設定（需要網路）

在每一台選手機上：

1. 執行 `itouOJ-Submit.exe`
2. 填伺服器網址（例如 `https://oj.itousouta.me`）
3. 用**選手自己的帳號密碼**登入
4. 從下拉選單選擇比賽

登入成功後程式會把 session、題目對應表（PDF 上的 A/B/C → 伺服器的 problemId）
和**時鐘校正值**存到本機。做完這一步就可以斷網了。

> 選手必須事先報名該比賽，否則清單裡會標示「※尚未報名」，上傳時會被拒絕。
> 帳號沒有密碼的（只用 Google/Discord 註冊過）要先用
> `node scripts/contest-accounts.mjs set-password` 補一組。

### 2. 比賽中（不需要網路）

選題目 → 選 `.cpp` 檔 → 按「提交」。程式會把程式碼複製一份到本機 spool，
並記下當下時間。清單會即時顯示已收件的紀錄。

可以重複提交同一題，全部都會保留。

### 3. 賽後（重新連網）

按右下角「上傳到伺服器」。程式會把所有待上傳的提交一次送出，
成功後狀態變成「已上傳」。

重複按不會造成重複提交——每筆提交都有唯一的 `clientKey`，伺服器會自動略過
已存在的。上傳失敗時提交仍保留在本機，可以直接重試。

## 資料存在哪

預設 `%LOCALAPPDATA%\itouOJ\`：

```
config.json          伺服器網址、session、比賽、題目對應、時鐘校正值
pending\<key>.json   待上傳的提交（一筆一個檔）
uploaded\<key>.json  已上傳的提交
```

設環境變數 `ITOUOJ_HOME` 可以換位置（例如放到隨身碟，方便監考統一回收）。

一筆提交一個檔是刻意的：寫到一半當掉只會壞掉那一筆，不會整包 manifest 損毀。
選手的程式碼原文都在裡面，真的出狀況時可以手動救回來。

## 幾個設計上的考量

**時鐘校正。** 機房電腦時鐘不準是常態。程式在登入時會從 HTTP 回應的 `Date`
標頭讀出伺服器時間，算出偏移量存起來，比賽中記錄提交時間時套用。沒有這層的話，
時鐘偏掉幾小時的機器交出來的提交會全部被伺服器夾制到比賽邊界，用時就錯了。

**時間戳的信任邊界。** 提交時間是選手機器給的，伺服器會夾制在比賽起訖區間內，
擋掉賽前預先寫好或賽後補交的極端情況；但區間**內**的微調擋不住，這部分要靠監考。
要更嚴謹就得改成監考統一回收 spool。

**支援的副檔名**：`.cpp` `.cc` `.cxx` → C++，`.c` → C，`.py` → Python，
`.java` → Java，`.js` → JavaScript。程式碼上限 64 KB（與伺服器一致）。

**語言限制。** 比賽可以在管理頁的「可用語言」限定語言（例如只開 C++）。
程式會在賽前設定時把限制一起抓下來，之後：

- 檔案對話框只列得出允許的副檔名
- 選到不合規的檔案會當場擋下並說明原因，不會等到賽後上傳才發現
- 提交區右上角會顯示「本比賽限用 C++」

這是選手機上的檢查，擋得住誤操作但擋不住改過的用戶端——所以伺服器端也會擋，
網頁提交、測試執行、離線上傳三條路都一樣。

## 測試

`TestHarness.cs` 會跟 `OfflineSubmit.cs` 一起編譯（用 `/main:` 換掉進入點），
所以測到的是 GUI 實際使用的同一份 `Api` / `Store` 程式碼，不是另外寫的仿冒品。

```powershell
$csc = "$env:WINDIR\Microsoft.NET\Framework64\v4.0.30319\csc.exe"
$refs = "System.dll,System.Core.dll,System.Drawing.dll,System.Windows.Forms.dll,System.Web.Extensions.dll"
& $csc /nologo /target:exe /codepage:65001 /main:ItouOJ.TestHarness `
    /out:client\TestHarness.exe "/reference:$refs" client\OfflineSubmit.cs client\TestHarness.cs

$env:ITOUOJ_HOME = "$env:TEMP\itouoj-test"
.\client\TestHarness.exe http://localhost:3000 <帳號> <密碼>
```

會跑完登入、取比賽、取題目、寫 spool、上傳、去重、錯誤處理整條流程。
**不要對正式站跑**，它會真的送出提交。
