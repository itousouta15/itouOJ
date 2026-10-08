import { randomBytes } from "node:crypto";

export const SOURCE_CHALLENGE_TITLE = "[入門] 看不見的留言";
export const SOURCE_LAB_INTRO = `## 在線練習網站

這題現在有真正可開啟的小網站。點下方的「前往練習網站」，探索社團首頁、試試迎新登記，找出藏在網站原始碼裡的留言。

找到完整 Flag 後回到本頁提交。原本的 Flag 與解題紀錄仍有效，附件也保留作為另一種查看原始碼的方式。

---

`;

export function createWebLabChallenges() {
  return [
    {
      title: "[入門] Cookie 裡的管理員", labType: "COOKIE", points: 150,
      description: `## 題目描述

北風社員站把登入狀態留在瀏覽器裡。你有一組迎新訪客帳密，可以正常登入，卻看不到管理員公告。

前往下方的練習網站，用網站提供的訪客帳號登入，觀察登入前後瀏覽器保存了什麼。想辦法進入管理員公告，找出維修通關碼。

## 作答方式

取得完整的 \`flag{...}\` 後，回到這一頁提交。

## 小提示

瀏覽器開發者工具的 Application／Storage 分頁能查看及編輯 Cookie。伺服器應該相信瀏覽器自己宣稱的角色嗎？

**練習重點：** Cookie、用戶端可修改的狀態，以及伺服器端權限驗證。

本站的社員與公告都是模擬資料，訪客帳號只用於這個練習網站。`,
    },
    {
      title: "[入門] 票券編號的另一邊", labType: "IDOR", points: 150,
      description: `## 題目描述

星港票券收藏站讓每位持有人查看自己的票券。你可以打開自己的迎新票，但管理員的特別票券藏著一段內部備註。

前往下方的練習網站，先查看自己的票券，再觀察網址裡的票券編號。看看網站是否真的有確認「這張票是不是你的」。

## 作答方式

找出管理員特別票券裡的完整 \`flag{...}\`，回到這一頁提交。

## 小提示

資料編號能找到一筆資料，但不應該單憑知道編號就取得存取權。附近的票券編號也許值得看看。

**練習重點：** 直接物件參照（IDOR）與每筆資料的存取權限。

票券與持有人都是本題的模擬資料。`,
    },
  ].map((challenge) => ({ ...challenge, category: "Web", difficulty: "easy", flag: `flag{${randomBytes(8).toString("hex")}}` }));
}
