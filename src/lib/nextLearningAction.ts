import { prisma } from "@/lib/db";

export type NextLearningAction = {
  href: string;
  title: string;
  detail: string;
};

export async function getNextLearningAction(userId: string): Promise<NextLearningAction | null> {
  const dueReview = await prisma.recognitionReview.findFirst({
    where: { userId, dueAt: { lte: new Date() } },
    orderBy: { dueAt: "asc" },
    include: { problem: { select: { id: true, title: true } } },
  });
  if (dueReview) {
    return {
      href: `/recognition/q/${dueReview.problem.id}`,
      title: dueReview.problem.title,
      detail: "A recognition review is due.",
    };
  }

  const membership = await prisma.courseMember.findFirst({
    where: { userId },
    orderBy: { joinedAt: "asc" },
    include: { course: { include: { problems: { orderBy: { order: "asc" }, include: { problem: { select: { id: true, order: true, title: true } } } } } } },
  });
  if (membership?.course.problems.length) {
    const problemIds = membership.course.problems.map((item) => item.problemId);
    const solved = await prisma.submission.findMany({
      where: { userId, status: "AC", problemId: { in: problemIds } },
      distinct: ["problemId"],
      select: { problemId: true },
    });
    const solvedIds = new Set(solved.map((item) => item.problemId));
    const next = membership.course.problems.find((item) => !solvedIds.has(item.problemId));
    if (next) {
      return {
        href: `/problems/${next.problem.order}`,
        title: next.problem.title,
        detail: `Continue ${membership.course.title}.`,
      };
    }
  }

  const problem = await prisma.problem.findFirst({
    where: {
      type: "PROGRAMMING",
      isPublic: true,
      submissions: { none: { userId, status: "AC" } },
    },
    orderBy: [{ difficulty: "asc" }, { order: "asc" }],
    select: { order: true, title: true },
  });
  return problem
    ? { href: `/problems/${problem.order}`, title: problem.title, detail: "A new problem picked for you." }
    : null;
}
