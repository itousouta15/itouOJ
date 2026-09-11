import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

const MAX_RESULTS = 8;
const MAX_TAGS = 6;

// Header 搜尋的即時推薦，只搜實作題（管理員含未公開）。
// - q：文字，比對標題、題號，也拿來推薦符合的標籤。
// - tags：已選的標籤 token（逗號分隔），題目必須同時具備全部標籤（交集）。
export async function GET(request: Request) {
  const session = await getSession();
  const isAdmin = session?.role === "ADMIN";

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();
  const selected = (searchParams.get("tags") ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, MAX_TAGS);

  if (!q && selected.length === 0) {
    return Response.json({ tags: [], problems: [] });
  }

  const visibleProblem = {
    type: "PROGRAMMING" as const,
    ...(isAdmin ? {} : { isPublic: true }),
  };

  // 標籤建議：名稱含 q、至少掛在一題可見實作題、排除已選
  const matchedTags = q
    ? await prisma.tag.findMany({
        where: {
          name: {
            contains: q,
            ...(selected.length ? { notIn: selected } : {}),
          },
          problems: { some: { problem: visibleProblem } },
        },
        orderBy: { name: "asc" },
        take: MAX_TAGS,
        select: { name: true },
      })
    : [];

  const n = Number(q);
  const problems = await prisma.problem.findMany({
    where: {
      ...visibleProblem,
      ...(q
        ? {
            OR: [
              { title: { contains: q } },
              ...(Number.isInteger(n) ? [{ order: n }] : []),
            ],
          }
        : {}),
      ...(selected.length
        ? {
            AND: selected.map((name) => ({
              tags: { some: { tag: { name } } },
            })),
          }
        : {}),
    },
    orderBy: [{ order: "asc" }, { id: "asc" }],
    take: MAX_RESULTS,
    select: {
      id: true,
      order: true,
      title: true,
      difficulty: true,
    },
  });

  return Response.json({
    tags: matchedTags.map((t) => t.name),
    problems,
  });
}