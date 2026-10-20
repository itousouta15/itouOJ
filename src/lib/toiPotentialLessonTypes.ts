import type { ApcsLesson } from "@/lib/apcsCourseLessons";

export const toiPotentialTopics = [
  {
    id: "foundations",
    title: "基本計算與統計",
    intro: "整理輸入、公式與邊界，從一次掃描開始建立正確解法。",
  },
  {
    id: "simulation",
    title: "規則與狀態模擬",
    intro: "依事件順序更新狀態，練習座標、時間與同步操作。",
  },
  {
    id: "strings",
    title: "字串與格式解析",
    intro: "從字元轉換、前綴匹配到結構化文字，保留題目要求的輸出格式。",
  },
  {
    id: "greedy",
    title: "排序與貪心",
    intro: "利用順序與交換論證，理解安全的局部選擇。",
  },
  {
    id: "search",
    title: "二分、枚舉與回溯",
    intro: "估算搜尋空間，透過單調性、剪枝與狀態壓縮找出答案。",
  },
  {
    id: "math",
    title: "數學、數論與組合",
    intro: "推導公式、整除性、計數關係，注意精度與整數範圍。",
  },
  {
    id: "dp",
    title: "動態規劃",
    intro: "定義狀態與轉移，從子問題、計算順序走到空間壓縮。",
  },
  {
    id: "graphs",
    title: "圖論與網格搜尋",
    intro: "建立關係模型，選擇連通性、最短路徑、拓樸或生成樹方法。",
  },
  {
    id: "data-structures",
    title: "樹與資料結構",
    intro: "用堆疊、佇列、樹、集合與區間資料結構維護反覆查詢。",
  },
  {
    id: "geometry",
    title: "幾何、座標與區間",
    intro: "用距離、向量、掃描線與區間關係推導幾何答案。",
  },
] as const;

export type ToiPotentialTopicId = (typeof toiPotentialTopics)[number]["id"];
export type ToiPotentialLesson = ApcsLesson & {
  topic: ToiPotentialTopicId;
  level: "easy" | "medium" | "hard";
};
