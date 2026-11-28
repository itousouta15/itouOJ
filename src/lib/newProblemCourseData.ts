import { cache } from "react";
import { prisma } from "@/lib/db";
import { compareNewProblemLessons, getNewProblemLesson, newProblemWhere } from "@/lib/newProblemLessons";

// The live problem remains authoritative for visibility, type and title.
// Authored data alone must never expose a removed or private problem.
export const getNewProblemCourseProblems = cache(async (isAdmin: boolean) => {
  const problems = await prisma.problem.findMany({
    where: newProblemWhere(isAdmin),
    select: { id: true, problemCode: true, title: true, isPublic: true },
  });
  return problems.flatMap((problem) => {
    const lesson = problem.problemCode ? getNewProblemLesson(problem.problemCode) : undefined;
    return lesson ? [{ ...problem, problemCode: lesson.code, lesson }] : [];
  }).sort((a, b) => compareNewProblemLessons(a.lesson, b.lesson));
});
