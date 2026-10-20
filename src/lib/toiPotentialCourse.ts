import type { Prisma } from "@/generated/prisma/client";
import { toiPotentialProblemCatalog } from "@/lib/toiPotentialProblemCatalog";

export const toiPotentialLessonCodes = new Set(
  toiPotentialProblemCatalog.map((problem) => problem.code),
);
export const TOI_POTENTIAL_TAG = "TOI 歷屆";

export function getToiPotentialLessonHref(
  code: string,
  tags: readonly string[],
) {
  return toiPotentialLessonCodes.has(code) && tags.includes(TOI_POTENTIAL_TAG)
    ? `/courses/toi-potential/lessons/${code}`
    : undefined;
}

// Code membership distinguishes potential-group problems from beginner-group problems
// sharing the same tag. Still check the current tag, type and visibility in the database.
export function toiPotentialProblemWhere(
  isAdmin = false,
): Prisma.ProblemWhereInput {
  return {
    type: "PROGRAMMING",
    problemCode: { in: [...toiPotentialLessonCodes] },
    tags: { some: { tag: { name: TOI_POTENTIAL_TAG } } },
    ...(isAdmin ? {} : { isPublic: true }),
  };
}
