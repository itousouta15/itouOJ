import { randomBytes } from "node:crypto";

export function createWebExpansionChallenges() {
  return [
    {
      title: "[入門] 爬蟲不該去的地方", labType: "ROBOTS", difficulty: "easy", points: 100,
      story: "晨霧觀測站公開了清晨的觀測紀錄，卻不希望搜尋引擎收錄值班備忘錄。站長以為，只要告訴爬蟲不要去，就不會有人發現。",
      mission: "前往練習網站，閱讀爬蟲規則，沿著其中的路徑找到值班備忘錄。本站的 robots.txt 放在這個練習網站的目錄內。",
      hint: "robots.txt 是給爬蟲的建議，不是存取權限。Disallow 後面寫的是什麼？",
      focus: "網站路徑探索、robots.txt 與存取控制的差別",
    },
    {
      title: "[入門] 忘記收走的備份", labType: "BACKUP", difficulty: "easy", points: 150,
      story: "紙鶴維護站正在搬家。正式的設定入口不讓人看原始碼，維護人員卻留下了編輯習慣與一項尚未完成的清理工作。",
      mission: "前往練習網站，從維護筆記找出設定檔備份，下載後閱讀其中的通關碼。",
      hint: "原本的程式檔與加上備份副檔名的檔案，可能有不同的回應方式。留意筆記裡的 .bak。",
      focus: "備份檔外洩、檔名推理與原始碼閱讀",
    },
    {
      title: "[入門] 價格由誰決定", labType: "PRICE", difficulty: "easy", points: 150,
      story: "星砂商店送你 100 枚體驗星砂，但裝著通關碼的收藏盒要價 10,000 枚。店員說價格已經寫在購買表單裡，伺服器照著扣款就好。",
      mission: "先試著購買收藏盒，再用瀏覽器開發者工具觀察表單與購買請求。找出能讓伺服器接受購買的方式。每次操作都使用同樣的體驗餘額。",
      hint: "hidden 欄位只是沒有顯示在畫面上。商品的真正價格應該由瀏覽器，還是伺服器決定？",
      focus: "表單隱藏欄位、請求參數竄改與商業邏輯",
    },
    {
      title: "[進階] 只有解碼，沒有驗證", labType: "JWT", difficulty: "medium", points: 250,
      story: "月台會員站換上 JWT 會員憑證。訪客可以正常登入，卻無法閱讀管理員公告。開發者似乎把「能解碼」當成了「可信任」。",
      mission: "使用 guest／guest 登入，找到本題的 token Cookie，觀察 JWT 的三個部分。嘗試讓網站將你的憑證辨識為管理員，再取得公告中的 Flag。",
      hint: "JWT 的 header 與 payload 使用 Base64URL。修改 payload 後，原本的簽章仍然有效嗎？這個網站真的有檢查嗎？請保留本題的 lab 編號。",
      focus: "JWT 結構、Base64URL 與簽章驗證",
    },
    {
      title: "[進階] 下載目錄之外", labType: "TRAVERSAL", difficulty: "medium", points: 250,
      story: "遠山文件庫讓旅人下載公開指南。下載服務從 /public 開始尋找檔案，但內部維護筆記就在隔壁目錄。",
      mission: "下載一次指南，觀察網址中的 file 參數，再根據網站的索引線索，嘗試讀取內部維護筆記。",
      hint: "路徑裡的 .. 代表上一層目錄。拼接下載路徑之後，程式還應該確認最後落在哪個目錄。",
      focus: "路徑解析、目錄穿越與下載範圍檢查",
    },
    {
      title: "[進階] 登入查詢的破綻", labType: "SQLI", difficulty: "medium", points: 300,
      story: "古鐘社員站的登入系統把輸入直接拼進 SQLite 查詢。你知道管理員帳號叫 admin，卻不知道密碼；維護筆記恰好留下了查詢的寫法。",
      mission: "先使用 guest／guest 登入，觀察訪客與管理員的差別。利用字串引號、條件與註解改變查詢，讓結果選到 admin，而不只是任意一位社員。",
      hint: "輸入的單引號會如何影響 WHERE 條件？SQL 的 -- 可以讓後面的內容變成註解。注意：只用永遠成立的條件，可能先選到 guest。",
      focus: "SQL Injection、字串界線、註解與查詢結果",
    },
  ].map(({ story, mission, hint, focus, ...metadata }) => ({
    ...metadata, category: "Web", flag: `flag{${randomBytes(12).toString("hex")}}`,
    description: `## 題目描述\n\n${story}\n\n${mission}\n\n## 作答方式\n\n取得完整的 \`flag{...}\` 後，回到這一頁提交。\n\n## 小提示\n\n${hint}\n\n**練習重點：** ${focus}。\n\n網站中的帳號、商品、文件與公告都是本題的練習資料。`,
  }));
}
