import type { ApcsLesson } from "@/lib/apcsCourseLessons";

export const cpeTopics = [
  {
    id: "basics",
    title: "基本輸入、判斷與統計",
    intro: "從資料讀取、條件邊界與一次掃描建立解題節奏。",
  },
  {
    id: "simulation",
    title: "規則與狀態模擬",
    intro: "明確定義狀態、操作順序與停止條件，逐步驗證規則。",
  },
  {
    id: "strings",
    title: "字串與文字處理",
    intro: "練習字元分類、字串轉換、匹配與保留輸出格式。",
  },
  {
    id: "sorting",
    title: "排序與貪心",
    intro: "用排序整理資料，說明局部選擇如何得到整體答案。",
  },
  {
    id: "search",
    title: "搜尋、回溯與二分",
    intro: "辨認搜尋空間，利用單調性或剪枝縮小候選答案。",
  },
  {
    id: "math",
    title: "數學與數值計算",
    intro: "從公式推導到精度控制，理解整數與浮點數的差異。",
  },
  {
    id: "number-theory",
    title: "數論與進位",
    intro: "處理質數、因數、餘數、最大公因數與不同進位。",
  },
  {
    id: "combinatorics",
    title: "組合與計數",
    intro: "由小例子推導排列組合、遞迴關係與避免重複計數的方法。",
  },
  {
    id: "dp",
    title: "動態規劃",
    intro: "定義可重用的子問題，檢查轉移、計算順序與空間壓縮。",
  },
  {
    id: "graphs",
    title: "圖與網格走訪",
    intro: "將關係建成圖，選擇連通性、最短路或拓樸等合適工具。",
  },
  {
    id: "trees",
    title: "樹與資料結構",
    intro: "以堆疊、佇列、樹及有序資料維護反覆查詢的狀態。",
  },
  {
    id: "geometry",
    title: "幾何與座標",
    intro: "用向量、距離、面積與座標變換推導幾何答案。",
  },
] as const;

export type CpeTopicId = (typeof cpeTopics)[number]["id"];
export type CpeLesson = ApcsLesson & {
  topic: CpeTopicId;
  level: "easy" | "medium" | "hard";
};
