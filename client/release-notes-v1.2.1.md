# itouOJ 收件程式 v1.2.1

這一版修正收件程式安裝與發佈流程的可靠性，讓機房佈署和 PowerShell 5.1 的處理更穩定。

## 這一版的重點

- 修正 `client/release.ps1`：PowerShell 5.1 會正確解析中文腳本，避免因缺 BOM 導致的語法錯誤。
- 明確標記 `client/install-on-this-pc.bat` 必須保持純 ASCII，避免 `cmd.exe` 以 CP950 讀取 UTF-8 時亂碼。
- 強化 `client/setup-machine.ps1`，安裝時會正確複製 `使用說明書.html` 並建立說明書捷徑。
- 新增 `client/00-先看這個.txt`，讓機房佈署包內的每個檔案用途更清楚，減少漏放檔案的風險。

## 下載

| 檔案 | 用途 |
|---|---|
| `itouOJ-lab-deploy-kit.zip` | 機房佈署包，包含收件程式、安裝腳本、說明文件與範例 |
| `itouOJ-Submit.exe` | 單機收件程式執行檔 |

## 注意

- 建議只在一台機器上下載 ZIP，然後用隨身碟或網路磁碟機分發到每台選手機。
- 在每台機器上執行 `install-on-this-pc.bat`，這樣安裝腳本會移除 SmartScreen 的 Mark-of-the-Web 標記。
- `install-on-this-pc.bat` 仍然要保持純 ASCII，避免中文編碼問題。

## 校驗

```
itouOJ-Submit.exe
SHA256 7589DB5E67AB97FDBEA417B62544E7AF060A1035C382D80971F5BE9F42D04783
```
