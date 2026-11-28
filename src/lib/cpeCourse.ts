import type { Prisma } from "@/generated/prisma/client";
import { cpeProblemCatalog } from "@/lib/cpeProblemCatalog";

export const cpeLessonCodes = new Set(
  cpeProblemCatalog.map((problem) => problem.code),
);

export function getCpeLessonHref(code: string, tags: readonly string[]) {
  return cpeLessonCodes.has(code) && tags.includes("CPE")
    ? `/courses/cpe/lessons/${code}`
    : undefined;
}

// Match both the code and its live tag. A hidden, removed, or retagged problem
// must not become accessible merely because a tutorial was bundled at build time.
export function cpeProblemWhere(isAdmin = false): Prisma.ProblemWhereInput {
  return {
    type: "PROGRAMMING",
    problemCode: { in: [...cpeLessonCodes] },
    tags: { some: { tag: { name: "CPE" } } },
    ...(isAdmin ? {} : { isPublic: true }),
  };
}
