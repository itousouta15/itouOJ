import { prisma } from "@/lib/db";

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
}

// /settings 與 /users/[username] 共用的解題統計：只算實作題，
// 識別題是練習、不進難度統計。
export async function getUserStats(userId: string): Promise<UserStats> {
  const [acDistinct, totalSubmissions, acSubmissions, publicTotals] =
    await Promise.all([
      prisma.submission.findMany({
        where: { userId, status: "AC", problem: { type: "PROGRAMMING" } },
        distinct: ["problemId"],
        select: { problem: { select: { difficulty: true } } },
      }),
      prisma.submission.count({ where: { userId } }),
      prisma.submission.count({ where: { userId, status: "AC" } }),
      prisma.problem.groupBy({
        by: ["difficulty"],
        where: { isPublic: true, type: "PROGRAMMING" },
        _count: { _all: true },
      }),
    ]);

  const solvedByDifficulty = new Map<string, number>();
  for (const s of acDistinct) {
    solvedByDifficulty.set(
      s.problem.difficulty,
      (solvedByDifficulty.get(s.problem.difficulty) ?? 0) + 1
    );
  }
  const totalByDifficulty = new Map(
    publicTotals.map((g) => [g.difficulty, g._count._all])
  );

  return {
    solvedCount: acDistinct.length,
    totalSubmissions,
    acSubmissions,
    acRate:
      totalSubmissions > 0
        ? Math.round((acSubmissions / totalSubmissions) * 100)
        : 0,
    solvedByDifficulty,
    totalByDifficulty,
  };
}
