# itouOJ 收件程式 v1.1.1

這一版主要修正收件程式安裝與發布流程的可靠性：

- 修正 `client/release.ps1` 的編碼問題，PowerShell 5.1 可以正確解析含中文的腳本。
- `client/install-on-this-pc.bat` 明確註記必須純 ASCII，避免 Windows cmd.exe 用 CP950 讀取 UTF-8 時亂碼。
- `client/setup-machine.ps1` 現在會在安裝時正確複製 `使用說明書.html` 並建立說明書捷徑。
- 新增 `client/00-先看這個.txt`，讓機房佈署包內容更好理解，減少安裝時漏放檔案的風險。

## 下載

| 檔案 | 用途 |
|---|---|
| `itouOJ-lab-deploy-kit.zip` | 機房佈署包，含安裝腳本與說明檔 |
| `itouOJ-Submit.exe` | 單機收件程式執行檔 |

## 注意

- 發布後請務必在乾淨機器上下載 ZIP，並執行 `install-on-this-pc.bat` 測試安裝流程。
- `install-on-this-pc.bat` 仍然建議以 ZIP 包來部署，避免 SmartScreen 路徑問題。
