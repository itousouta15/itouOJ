# 歷屆競賽試題原卷

- `112-zhongtou.pdf`：112 學年度中投區資訊學科能力競賽複賽，10 題。
- `113-chiayi.pdf`：113 嘉義資訊程式競賽，10 題。
- `114-national.pdf`：114 學年度（2025 年）全國資訊學科能力競賽，9 題。

每題從題敘連到對應原卷頁面；匯入資料見 `prisma/seed-data/competition-exams-112-114.mjs`。

在專案根目錄執行 `node scripts/import-competition-exams-112-114.mjs` 將 29 題匯入目前的 SQLite 題庫；
可用 `--db 路徑` 指定其他資料庫、`--check` 僅核對檔案與資料，或在修訂題敘／補範例後用 `--refresh` 更新已匯入題目。
匯入前會先備份資料庫；重跑預設略過已存在的題目。

原卷未附正式測資。額外的 127 組自製隱藏測資由
`scripts/add-competition-exam-testcases.mjs` 產生：先執行 `--check` 核對 29 題原卷範例，
再以 `--db 路徑` 匯入指定資料庫（預設本機 `dev.db`）。腳本會先備份資料庫，
重跑會保留已有的測資 ID；匯入後題敘會明確標註非官方評測。
