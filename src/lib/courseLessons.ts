import { apcsCourseLessons } from "@/lib/apcsCourseLessons";
import { apcsPastExamLessons } from "@/lib/apcsPastExamLessons";
import { toiBeginnerLessons } from "@/lib/toiBeginnerLessons";

const lessonCourseTitles = [
  "APCS 實作題：由簡到難",
  "APCS 歷屆",
  "TOI 新手組 練習",
] as const;

export function getCourseLesson(courseTitle: string, problemCode: string) {
  let lesson;
  switch (courseTitle) {
    case "APCS 實作題：由簡到難":
      lesson = apcsCourseLessons[problemCode];
      break;
    case "APCS 歷屆":
      lesson = apcsPastExamLessons[problemCode];
      break;
    case "TOI 新手組 練習":
      // A general topic demonstration is not a solution to each of its problems.
      lesson = Object.hasOwn(toiBeginnerLessons, problemCode)
        ? toiBeginnerLessons[problemCode]
        : undefined;
      break;
    default:
      return undefined;
  }
  // Never advertise an inherited property or a lesson for a different problem.
  return lesson?.code === problemCode ? lesson : undefined;
}

export function getLessonCourseTitles(problemCode: string) {
  return lessonCourseTitles.filter((title) =>
    getCourseLesson(title, problemCode),
  );
}
