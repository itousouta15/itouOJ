import { apcsPastExamUnits } from "@/lib/apcsPastExamCourse";
import { getCourseLesson } from "@/lib/courseLessons";
import {
  getToiTopicForProblem,
  toiCourseTopics,
} from "@/lib/toiCourseCurriculum";

export type CourseEntry = {
  id: number;
  problemId: number;
  problem: {
    id: number;
    order: number;
    problemCode: string | null;
    title: string;
    type: string;
    isPublic: boolean;
    category: string | null;
    difficulty: string;
  };
};

export type CourseUnit = {
  id: string;
  title: string;
  intro: string;
  focus: readonly string[];
  entries: CourseEntry[];
};

export const courseDifficultyOptions = [
  {
    id: "easy",
    title: "簡單",
    intro: "讀懂輸入，建立解題節奏。先手算範例，再用條件與迴圈完成實作。",
    focus: ["輸入與輸出", "條件判斷", "迴圈與邊界"],
  },
  {
    id: "medium",
    title: "中等",
    intro:
      "整理多筆資料，追蹤必要狀態。每處理一筆資料，都能說明目前狀態代表什麼。",
    focus: ["陣列與字串", "模擬與狀態", "複雜度估算"],
  },
  {
    id: "hard",
    title: "困難",
    intro:
      "設計狀態，選擇有效率的方法。先估算方法的規模，再確認轉移順序與數值範圍。",
    focus: ["狀態設計", "演算法", "時間與記憶體限制"],
  },
  {
    id: "other",
    title: "未分類難度",
    intro: "這些題目尚未設定標準難度，仍可依課程順序練習。",
    focus: [],
  },
] as const;

export function courseEntryLesson(title: string, entry: CourseEntry) {
  return entry.problem.type === "PROGRAMMING" && entry.problem.problemCode
    ? getCourseLesson(title, entry.problem.problemCode)
    : undefined;
}

export function courseEntryHref(
  courseId: number,
  title: string,
  entry: CourseEntry,
) {
  const problem = entry.problem;
  if (problem.type === "RECOGNITION") return `/recognition/q/${problem.id}`;
  if (!problem.problemCode) return null;
  return courseEntryLesson(title, entry)
    ? `/courses/${courseId}/lessons/${problem.problemCode}`
    : `/problems/${problem.problemCode}`;
}

export function courseEntryLevel(entry: CourseEntry) {
  const level = entry.problem.difficulty;
  return ["easy", "medium", "hard"].includes(level) ? level : "other";
}

// Keep the teacher's order inside units; give every visible entry exactly one home.
export function buildCourseUnits(
  title: string,
  entries: CourseEntry[],
): CourseUnit[] {
  let units: CourseUnit[];
  if (title === "APCS 歷屆") {
    units = apcsPastExamUnits.map((unit) => ({
      id: unit.id,
      title: unit.label,
      intro: unit.intro,
      focus: unit.focus,
      entries: unit.codes.flatMap((code) =>
        entries.filter(
          (entry) =>
            entry.problem.type === "PROGRAMMING" &&
            entry.problem.problemCode === code,
        ),
      ),
    }));
  } else if (title === "TOI 新手組 練習") {
    units = toiCourseTopics.map((unit) => ({
      id: unit.id,
      title: unit.title,
      intro: unit.subtitle,
      focus: unit.focus,
      entries: entries.filter(
        (entry) =>
          entry.problem.type === "PROGRAMMING" &&
          getToiTopicForProblem(entry.problem.problemCode)?.id === unit.id,
      ),
    }));
  } else {
    const guided = title === "APCS 實作題：由簡到難";
    units = courseDifficultyOptions.map((unit) => ({
      ...unit,
      intro: guided
        ? unit.intro
        : "依課程設定順序練習；已完成的題目會以 AC 紀錄標示。",
      focus: guided ? unit.focus : [],
      entries: entries.filter((entry) => courseEntryLevel(entry) === unit.id),
    }));
  }
  const assigned = new Set<number>();
  units = units.map((unit) => ({
    ...unit,
    entries: unit.entries.filter((entry) => {
      if (assigned.has(entry.id)) return false;
      assigned.add(entry.id);
      return true;
    }),
  }));
  const remaining = entries.filter((entry) => !assigned.has(entry.id));
  if (remaining.length)
    units.push({
      id: "additional",
      title: "其他練習",
      intro: "尚未歸入主題的課程題目，可直接前往練習。",
      focus: [],
      entries: remaining,
    });
  return units.filter((unit) => unit.entries.length > 0);
}

export type CourseSearchParams = {
  q?: string | string[];
  topic?: string | string[];
  level?: string | string[];
};

export function filterCourseUnits(
  title: string,
  units: CourseUnit[],
  params: CourseSearchParams,
) {
  const first = (value: string | string[] | undefined) =>
    (Array.isArray(value) ? value[0] : value) ?? "";
  const query = first(params.q).trim();
  const topicValue = first(params.topic);
  const levelValue = first(params.level);
  const topic = units.some((unit) => unit.id === topicValue) ? topicValue : "";
  const level = courseDifficultyOptions.some((item) => item.id === levelValue)
    ? levelValue
    : "";
  const needle = query.toLocaleLowerCase();
  const filtered = units
    .filter((unit) => !topic || unit.id === topic)
    .map((unit) => ({
      ...unit,
      entries: unit.entries.filter(
        (entry) =>
          (!level || courseEntryLevel(entry) === level) &&
          (!needle ||
            [
              entry.problem.problemCode,
              entry.problem.title,
              entry.problem.category,
              courseEntryLesson(title, entry)?.concept,
              unit.title,
              ...unit.focus,
            ]
              .join(" ")
              .toLocaleLowerCase()
              .includes(needle)),
      ),
    }))
    .filter((unit) => unit.entries.length > 0);
  return {
    query,
    topic,
    level,
    units: filtered,
    active: Boolean(query || topic || level),
    count: filtered.reduce((sum, unit) => sum + unit.entries.length, 0),
  };
}
