# HackMD 三題還原教學練習

來源：[使用者提供的 HackMD 筆記](https://hackmd.io/@cA7L_FaoR5-8HdSqXMJfkQ/B1mgpjEazx)。

匯入〈營火晚會〉、〈最短包含字串〉、〈考拉茲數字反推〉三題。這是筆記的還原教學版，不宣稱為官方原卷或官方測資。營火晚會與既有 TOI 同名題 a333 的規則不同，以完整來源前綴區分。

## 核對與匯入

```sh
node scripts/import-hackmd-three-problems.mjs --check
node scripts/import-hackmd-three-problems.mjs --db /absolute/path/to/oj.db
```

`--check` 不開啟資料庫；寫入必須明確提供既有 SQLite 檔案路徑，不讀取 `DATABASE_URL`。匯入前會建立備份，三題與測資於同一筆交易寫入。題號接續當前實作題最大代碼，不固定占用 a877–a879。重跑依完整題名跳過既有題目，保留管理員修改及原測資 ID；不會覆蓋 TOI a333。

來源的四組範例設為公開，自製邊界、隨機及最大規模測資設為隱藏。題目頁連回原筆記，並明示教學限制與非官方評測範圍。

## 驗證

```sh
npm run test:hackmd-problems
```

測試使用拋棄式記憶體資料庫。JS 參考解另以逐人模擬、窮舉候選字串、正向考拉茲枚舉做差分；Linux C++ 參考解以 set、排列 DFS、反向 BFS 與手寫二分交叉核對全部測資。

Windows 只執行 JS／SQLite 測試。C++ 編譯與執行必須用既有 WSL Linux 或 CI，產物放在 Linux `/tmp`，不得改跑 Windows `.exe`。
