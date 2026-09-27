import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { PROBLEM_CODE_RE, formatProblemCode } from "@/lib/problemCode";

export const dynamic = "force-dynamic";

const MAX_RESULTS = 8;
const MAX_TAGS = 6;

// Header 搜尋的即時推薦，只搜實作題（管理員含未公開）。
// - q：文字，比對標題、題目代碼，也拿來推薦符合的標籤。
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

  // 代碼查詢：輸入 a001 直接比對代碼；輸入純數字（舊習慣）也換算成代碼。
  const lower = q.toLowerCase();
  const codeMatch: { problemCode: string }[] = [];
  if (PROBLEM_CODE_RE.test(lower)) {
    codeMatch.push({ problemCode: lower });
  } else if (/^\d+$/.test(q)) {
    const n = Number(q);
    if (n >= 1 && n <= 26 * 999) {
      codeMatch.push({ problemCode: formatProblemCode(n) });
    }
  }

  const problems = await prisma.problem.findMany({
    where: {
      ...visibleProblem,
      ...(q
        ? {
            OR: [{ title: { contains: q } }, ...codeMatch],
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
    orderBy: [{ problemCode: "asc" }, { id: "asc" }],
    take: MAX_RESULTS,
    select: {
      id: true,
      problemCode: true,
      title: true,
      difficulty: true,
    },
  });

  return Response.json({
    tags: matchedTags.map((t) => t.name),
    problems,
  });
}