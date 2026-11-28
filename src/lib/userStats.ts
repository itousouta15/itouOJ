import { prisma } from "@/lib/db";
import { getCtfStats } from "@/lib/ctf";

export const DIFFICULTY_META = [
  { key: "easy", label: "簡單", color: "var(--green)" },
  { key: "medium", label: "中等", color: "#faa81a" },
  { key: "hard", label: "困難", color: "#ff6b6b" },
] as const;

export interface UserStats {
  solvedCount: number;
  totalSubmissions: number;
  acSubmissions: number;
  acRate: number;
  solvedByDifficulty: Map<string, number>;
  totalByDifficulty: Map<string, number>;
  // 識別題練習（RecognitionAnswer，只記每題最新一次）：只算公開題目
  recognitionAnswered: number;
  recognitionCorrect: number;
  recognitionRate: number;
  recognitionTotal: number;
  recognitionProgressRate: number;
  ctf: Awaited<ReturnType<typeof getCtfStats>>;
}

function percentage(correct: number, total: number): number {
  return total > 0 ? Math.round((correct / total) * 100) : 0;
}

// /settings 與 /users/[username] 共用的解題統計：解題數/難度只算實作題，
// 識別題另計一組（已作答數、答對數、正確率與總進度）。
export async function getUserStats(userId: string): Promise<UserStats> {
  const [
    acDistinct,
    totalSubmissions,
    acSubmissions,
    publicTotals,
    recognitionAnswered,
    recognitionCorrect,
    recognitionTotal,
    ctf,
  ] = await Promise.all([
    // SQL 端做 DISTINCT：Prisma 的 findMany({ distinct }) 會把全部 AC 列載入再去重。
    prisma.$queryRaw<{ difficulty: string; count: bigint | number }[]>`
      SELECT p."difficulty" AS difficulty, COUNT(DISTINCT s."problemId") AS count
      FROM "Submission" s
      INNER JOIN "Problem" p ON p."id" = s."problemId"
      WHERE s."userId" = ${userId} AND s."status" = 'AC' AND p."type" = 'PROGRAMMING'
      GROUP BY p."difficulty"
    `,
    prisma.submission.count({ where: { userId, problem: { type: "PROGRAMMING" } } }),
    prisma.submission.count({ where: { userId, status: "AC", problem: { type: "PROGRAMMING" } } }),
    prisma.problem.groupBy({
      by: ["difficulty"],
      where: { isPublic: true, type: "PROGRAMMING" },
      _count: { _all: true },
    }),
    prisma.recognitionAnswer.count({
      where: { userId, problem: { type: "RECOGNITION", isPublic: true } },
    }),
    prisma.recognitionAnswer.count({
      where: {
        userId,
        isCorrect: true,
        problem: { type: "RECOGNITION", isPublic: true },
      },
    }),
    prisma.problem.count({ where: { type: "RECOGNITION", isPublic: true } }),
    getCtfStats(userId),
  ]);

  const solvedByDifficulty = new Map<string, number>();
  let solvedCount = 0;
  for (const row of acDistinct) {
    const count = Number(row.count);
    solvedCount += count;
    solvedByDifficulty.set(row.difficulty, (solvedByDifficulty.get(row.difficulty) ?? 0) + count);
  }
  const totalByDifficulty = new Map(
    publicTotals.map((g) => [g.difficulty, g._count._all])
  );

  return {
    solvedCount,
    totalSubmissions,
    acSubmissions,
    acRate:
      totalSubmissions > 0
        ? Math.round((acSubmissions / totalSubmissions) * 100)
        : 0,
    solvedByDifficulty,
    totalByDifficulty,
    recognitionAnswered,
    recognitionCorrect,
    recognitionRate: percentage(recognitionCorrect, recognitionAnswered),
    recognitionTotal,
    recognitionProgressRate: percentage(recognitionCorrect, recognitionTotal),
    ctf,
  };
}
