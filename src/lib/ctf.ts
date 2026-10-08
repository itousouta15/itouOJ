import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import { CTF_PAGE_SIZE } from "@/lib/ctfSchema";

export const ctfPublicSelect = {
  id: true, title: true, description: true, category: true, difficulty: true,
  points: true, isPublic: true, order: true, createdAt: true, updatedAt: true, labType: true,
} satisfies Prisma.CtfChallengeSelect;

export function ctfDate(date: Date) {
  return date.toLocaleString("zh-TW", { timeZone: "Asia/Taipei", hour12: false });
}

export async function getCtfStats(userId: string) {
  const [totals, rows, recent] = await Promise.all([
    prisma.ctfChallenge.aggregate({ where: { isPublic: true }, _count: { id: true }, _sum: { points: true } }),
    prisma.$queryRaw<{ solved: number; points: number }[]>`
      SELECT COUNT(*) AS solved, COALESCE(SUM(c."points"), 0) AS points
      FROM "CtfSolve" s JOIN "CtfChallenge" c ON c."id" = s."challengeId"
      WHERE s."userId" = ${userId} AND c."isPublic" = 1
    `,
    prisma.ctfSolve.findMany({
      where: { userId, challenge: { isPublic: true } },
      orderBy: [{ solvedAt: "desc" }, { id: "desc" }], take: 5,
      select: { solvedAt: true, challenge: { select: { id: true, title: true, points: true } } },
    }),
  ]);
  const solved = Number(rows[0]?.solved ?? 0);
  return {
    solved, points: Number(rows[0]?.points ?? 0), total: totals._count.id,
    totalPoints: totals._sum.points ?? 0,
    progress: totals._count.id ? Math.round(solved / totals._count.id * 100) : 0, recent,
  };
}

export interface CtfRankRow {
  username: string; displayName: string | null; points: number; solved: number; lastSolvedAt: number | string;
}

export async function getCtfRanking(page: number) {
  const rows = await prisma.$queryRaw<CtfRankRow[]>`
    SELECT u."username" AS username, u."displayName" AS displayName,
      SUM(c."points") AS points, COUNT(*) AS solved, MAX(s."solvedAt") AS lastSolvedAt
    FROM "CtfSolve" s JOIN "CtfChallenge" c ON c."id" = s."challengeId"
    JOIN "User" u ON u."id" = s."userId"
    WHERE c."isPublic" = 1
    GROUP BY s."userId"
    ORDER BY points DESC, lastSolvedAt ASC, username ASC
    LIMIT ${CTF_PAGE_SIZE + 1} OFFSET ${(page - 1) * CTF_PAGE_SIZE}
  `;
  return { rows: rows.slice(0, CTF_PAGE_SIZE), hasNext: rows.length > CTF_PAGE_SIZE };
}

export async function getCtfChallenges(where: Prisma.CtfChallengeWhereInput, page: number, userId?: string) {
  const total = await prisma.ctfChallenge.count({ where });
  const currentPage = Math.min(page, Math.max(1, Math.ceil(total / CTF_PAGE_SIZE)));
  const challenges = await prisma.ctfChallenge.findMany({
    where, select: {
      id: true, title: true, category: true, difficulty: true, points: true, isPublic: true, order: true,
      _count: { select: { solves: true, attachments: true } },
      solves: { where: { userId: userId ?? "" }, select: { solvedAt: true } },
    },
    orderBy: [{ order: "asc" }, { id: "asc" }],
    skip: (currentPage - 1) * CTF_PAGE_SIZE, take: CTF_PAGE_SIZE,
  });
  return { total, page: currentPage, challenges };
}
