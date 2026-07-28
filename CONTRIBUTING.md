# Contributing

歡迎為 itouOJ 貢獻！這裡整理常見流程與合作方式。

## 1. 開始之前

- 請先閱讀 `README.md`、`RELEASING.md` 與現有程式碼。
- 若要修正 bug，請先檢查是否已有相關 issue。若沒有，請先開 issue。
- 若要提出新功能，請先描述動機和預期行為，避免重複工作。

## 2. 建立 issue

- Bug 報告應包含：重現步驟、預期結果、實際結果、環境。
- 新功能建議應包含：目的、使用情境、預期行為、範例。
- 參考 GitHub 文件：[Setting guidelines for repository contributors](https://docs.github.com/articles/setting-guidelines-for-repository-contributors/)

## 3. 開 pull request

1. fork 並 clone 本專案。
2. 建立清楚分支名稱，例如 `fix/...`、`feature/...`。
3. 寫清楚 commit message，並保持每個提交單一目的。
4. PR 描述請包含變更說明、測試方式、關聯 issue。
5. 若修改 UI 或行為，請附上相關截圖或影片。

## 4. 代碼風格

- TypeScript / React：遵循現有專案風格。
- Tailwind / CSS：保持簡潔、避免重複。
- 請先在本機執行 `npm run lint`，並確認主要功能正常。

## 5. 測試

- 本地開發環境請確認 `npm run dev` 或 `npm run build` 正常。
- 變更後請確認沒有引入明顯錯誤。
