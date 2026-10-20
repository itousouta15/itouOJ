import { cache } from "react";
import { prisma } from "@/lib/db";
import { toiPotentialProblemWhere } from "@/lib/toiPotentialCourse";
import { toiPotentialLessons } from "@/lib/toiPotentialLessons";
import { toiPotentialTopics } from "@/lib/toiPotentialLessonTypes";

const topicOrder = new Map<string, number>(
  toiPotentialTopics.map((topic, index) => [topic.id, index]),
);
const levelOrder = { easy: 0, medium: 1, hard: 2 };

export const getToiPotentialCourseProblems = cache(async (isAdmin: boolean) => {
  const problems = await prisma.problem.findMany({
    where: toiPotentialProblemWhere(isAdmin),
    select: { id: true, problemCode: true, title: true, isPublic: true },
    orderBy: { problemCode: "asc" },
  });
  return problems
    .flatMap((problem) => {
      const lesson = problem.problemCode
        ? toiPotentialLessons[problem.problemCode]
        : undefined;
      return lesson ? [{ ...problem, problemCode: lesson.code, lesson }] : [];
    })
    .sort(
      (a, b) =>
        topicOrder.get(a.lesson.topic)! - topicOrder.get(b.lesson.topic)! ||
        levelOrder[a.lesson.level] - levelOrder[b.lesson.level] ||
        a.problemCode.localeCompare(b.problemCode),
    );
});
