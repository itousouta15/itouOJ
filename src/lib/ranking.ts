import { prisma } from "@/lib/db";

export interface SiteWideRankRow {
  username: string;
  displayName: string | null;
  solved: number;
  submissions: number;
  recognitionCorrect: number;
  recognitionAnswered: number;
  ctfSolved: number;
  ctfPoints: number;
  score: number;
}

// Keep distinct counts and ordering in SQLite so public ranking reads do not
// materialize every accepted user/problem pair in the Next.js process.
export async function getSiteWideRanking(limit: number): Promise<SiteWideRankRow[]> {
  return prisma.$queryRaw<SiteWideRankRow[]>`
    WITH solved AS (
      SELECT s."userId", COUNT(DISTINCT s."problemId") AS solved
      FROM "Submission" s JOIN "Problem" p ON p."id" = s."problemId"
      WHERE s."status" = 'AC' AND p."type" = 'PROGRAMMING'
      GROUP BY s."userId"
    ), submissions AS (
      SELECT s."userId", COUNT(*) AS submissions
      FROM "Submission" s JOIN "Problem" p ON p."id" = s."problemId"
      WHERE p."type" = 'PROGRAMMING'
      GROUP BY s."userId"
    ), recognition AS (
      SELECT r."userId",
        SUM(CASE WHEN r."isCorrect" = 1 THEN 1 ELSE 0 END) AS recognitionCorrect,
        COUNT(*) AS recognitionAnswered
      FROM "RecognitionAnswer" r
      INNER JOIN "Problem" p ON p."id" = r."problemId"
      WHERE p."type" = 'RECOGNITION' AND p."isPublic" = 1
      GROUP BY r."userId"
    ), ctf AS (
      SELECT s."userId", COUNT(*) AS ctfSolved, SUM(c."points") AS ctfPoints
      FROM "CtfSolve" s JOIN "CtfChallenge" c ON c."id" = s."challengeId"
      WHERE c."isPublic" = 1
      GROUP BY s."userId"
    )
    SELECT u."username" AS username,
      u."displayName" AS displayName,
      COALESCE(s.solved, 0) AS solved,
      COALESCE(sb.submissions, 0) AS submissions,
      COALESCE(r.recognitionCorrect, 0) AS recognitionCorrect,
      COALESCE(r.recognitionAnswered, 0) AS recognitionAnswered,
      COALESCE(c.ctfSolved, 0) AS ctfSolved,
      COALESCE(c.ctfPoints, 0) AS ctfPoints,
      (COALESCE(s.solved, 0) * 420 + COALESCE(r.recognitionCorrect, 0) * 280 + COALESCE(c.ctfPoints, 0) * 3) / 1000.0 AS score
    FROM "User" u
    LEFT JOIN solved s ON s."userId" = u."id"
    LEFT JOIN submissions sb ON sb."userId" = u."id"
    LEFT JOIN recognition r ON r."userId" = u."id"
    LEFT JOIN ctf c ON c."userId" = u."id"
    WHERE COALESCE(sb.submissions, 0) > 0 OR COALESCE(r.recognitionAnswered, 0) > 0 OR COALESCE(c.ctfSolved, 0) > 0
    ORDER BY score DESC, submissions ASC, username ASC
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
    INNER JOIN "Problem" p ON p."id" = s."problemId"
    WHERE s."status" = 'AC' AND p."type" = 'PROGRAMMING'
    GROUP BY s."userId"
    ORDER BY solved DESC, username ASC
    LIMIT ${limit}
  `;
}
