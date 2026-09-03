# itouOJ Android App 1.0

首次發布。手機版 itouOJ —— WebView 包裝網站（oj.itousouta.me），登入、
判題、計分板、討論都跟網站同一套帳號與資料。

## 功能

- 登入：帳號密碼、Google、Discord（跟網站相同）
- 判題結果通知：比賽中每 10 分鐘檢查一次，有新結果就通知
- 手機介面：底部導覽、編輯區全螢幕模式、吸底送出工具列、
  safe-area 相容（瀏海／手勢列）
- 亮色／暗色主題跟隨網站

## 安裝

- 下載 `itouOJ-1.0.apk`
- 在手機上允許「安裝未知來源應用程式」後安裝
- App 需要網路：它連的是 `https://oj.itousouta.me`，不是離線 App

## 注意

- 圖示目前是 Capacitor 預設圖示，之後會換成 itouOJ 自己的
- 判題通知是輪詢式（10 分鐘一次），不是即時推播
- iOS 版需要 macOS + Xcode 才能建，目前只有 Android

## 校驗

```
itouOJ-1.0.apk
SHA256 C1911F174955C16C06FFF938D6D3837EF3B86C1CA537A3840F8D697559C7E537
```