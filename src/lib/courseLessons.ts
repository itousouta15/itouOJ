import { apcsCourseLessons } from "@/lib/apcsCourseLessons";
import { apcsPastExamLessons } from "@/lib/apcsPastExamLessons";
import { getToiTopicForProblem } from "@/lib/toiCourseCurriculum";

const lessonCourseTitles = [
  "APCS 實作題：由簡到難",
  "APCS 歷屆",
  "TOI 新手組 練習",
] as const;

export function getCourseLesson(courseTitle: string, problemCode: string) {
  switch (courseTitle) {
    case "APCS 實作題：由簡到難":
      return apcsCourseLessons[problemCode];
    case "APCS 歷屆":
      return apcsPastExamLessons[problemCode];
    case "TOI 新手組 練習":
      return getToiTopicForProblem(problemCode)?.lesson;
    default:
      return undefined;
  }
}

export function getLessonCourseTitles(problemCode: string) {
  return lessonCourseTitles.filter((title) => getCourseLesson(title, problemCode));
}
