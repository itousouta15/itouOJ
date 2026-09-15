import { prisma } from "@/lib/db";

export interface SiteWideRankRow {
  username: string;
  displayName: string | null;
  solved: number;
  submissions: number;
  recognitionCorrect: number;
  recognitionAnswered: number;
  score: number;
}

// Keep distinct counts and ordering in SQLite so public ranking reads do not
// materialize every accepted user/problem pair in the Next.js process.
export async function getSiteWideRanking(limit: number): Promise<SiteWideRankRow[]> {
  return prisma.$queryRaw<SiteWideRankRow[]>`
    WITH solved AS (
      SELECT "userId", COUNT(DISTINCT "problemId") AS solved
      FROM "Submission"
      WHERE "status" = 'AC'
      GROUP BY "userId"
    ), submissions AS (
      SELECT "userId", COUNT(*) AS submissions
      FROM "Submission"
      GROUP BY "userId"
    ), recognition AS (
      SELECT r."userId",
        SUM(CASE WHEN r."isCorrect" = 1 THEN 1 ELSE 0 END) AS recognitionCorrect,
        COUNT(*) AS recognitionAnswered
      FROM "RecognitionAnswer" r
      INNER JOIN "Problem" p ON p."id" = r."problemId"
      WHERE p."type" = 'RECOGNITION' AND p."isPublic" = 1
      GROUP BY r."userId"
    )
    SELECT u."username" AS username,
      u."displayName" AS displayName,
      COALESCE(s.solved, 0) AS solved,
      COALESCE(sb.submissions, 0) AS submissions,
      COALESCE(r.recognitionCorrect, 0) AS recognitionCorrect,
      COALESCE(r.recognitionAnswered, 0) AS recognitionAnswered,
      (COALESCE(s.solved, 0) * 6 + COALESCE(r.recognitionCorrect, 0) * 4) / 10.0 AS score
    FROM "User" u
    LEFT JOIN solved s ON s."userId" = u."id"
    LEFT JOIN submissions sb ON sb."userId" = u."id"
    LEFT JOIN recognition r ON r."userId" = u."id"
    WHERE COALESCE(sb.submissions, 0) > 0 OR COALESCE(r.recognitionAnswered, 0) > 0
    ORDER BY score DESC, submissions ASC
    LIMIT ${limit}
  `;
}

export async function getTopSolvedUsers(limit: number) {
  return prisma.$queryRaw<
    { username: string; displayName: string | null; solved: number }[]
  >`
    SELECT u."username" AS username,
      u."displayName" AS displayName,
      COUNT(DISTINCT s."problemId") AS solved
    FROM "Submission" s
    INNER JOIN "User" u ON u."id" = s."userId"
    WHERE s."status" = 'AC'
    GROUP BY s."userId"
    ORDER BY solved DESC, username ASC
    LIMIT ${limit}
  `;
}
