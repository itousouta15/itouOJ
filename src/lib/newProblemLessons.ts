import type { ApcsLesson } from "@/lib/apcsCourseLessons";
import competition from "./newProblemLessons/data/competition.json" with { type: "json" };
import national1 from "./newProblemLessons/data/national1.json" with { type: "json" };
import national2 from "./newProblemLessons/data/national2.json" with { type: "json" };
import practice1 from "./newProblemLessons/data/practice1.json" with { type: "json" };
import practice2 from "./newProblemLessons/data/practice2.json" with { type: "json" };
import practice3 from "./newProblemLessons/data/practice3.json" with { type: "json" };
import practice4 from "./newProblemLessons/data/practice4.json" with { type: "json" };

import nov08562 from "./newProblemLessons/data/nov08-562-607.json" with { type: "json" };
import nov08608 from "./newProblemLessons/data/nov08-608-653.json" with { type: "json" };
import nov08654 from "./newProblemLessons/data/nov08-654-699.json" with { type: "json" };
import nov08700 from "./newProblemLessons/data/nov08-700-745.json" with { type: "json" };
import nov08746 from "./newProblemLessons/data/nov08-746-790.json" with { type: "json" };

export const newProblemTopics = [
  { id: "basics", title: "輸入、判斷與統計" },
  { id: "simulation", title: "規則與狀態模擬" },
  { id: "strings", title: "字串處理" },
  { id: "sorting", title: "排序" },
  { id: "search", title: "搜尋與二分" },
  { id: "greedy", title: "貪心選擇" },
  { id: "dp", title: "動態規劃" },
  { id: "graphs", title: "圖論與路徑" },
  { id: "trees", title: "樹" },
  { id: "data-structures", title: "資料結構" },
  { id: "number-theory", title: "數論與計數" },
  { id: "geometry", title: "幾何與座標" },
] as const;

export type NewProblemLesson = ApcsLesson & {
  title: string;
  topic: (typeof newProblemTopics)[number]["id"];
  level: "easy" | "medium" | "hard";
  exampleKind?: "constructed";
  performanceNote?: string;
};

const authored = [competition, national1, national2, practice1, practice2, practice3, practice4, nov08562, nov08608, nov08654, nov08700, nov08746].flat();
export const newProblemLessons: Readonly<Record<string, NewProblemLesson>> =
  Object.fromEntries(authored.map((lesson) => [lesson.code, lesson as NewProblemLesson]));

export function getNewProblemLesson(code: string) {
  return Object.hasOwn(newProblemLessons, code) ? newProblemLessons[code] : undefined;
}

export function getNewProblemLessonHref(code: string) {
  return getNewProblemLesson(code) ? `/courses/practice/lessons/${code}` : undefined;
}

export function newProblemWhere(isAdmin = false) {
  return {
    type: "PROGRAMMING" as const,
    problemCode: { in: Object.keys(newProblemLessons) },
    ...(isAdmin ? {} : { isPublic: true }),
  };
}

const topicOrder = new Map<string, number>(newProblemTopics.map((topic, index) => [topic.id, index]));
const levels = { easy: 0, medium: 1, hard: 2 };
export function compareNewProblemLessons(a: NewProblemLesson, b: NewProblemLesson) {
  return (topicOrder.get(a.topic) ?? 99) - (topicOrder.get(b.topic) ?? 99)
    || levels[a.level] - levels[b.level]
    || a.code.localeCompare(b.code);
}
