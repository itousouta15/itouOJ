import { prisma } from "@/lib/db";
import type { Session } from "@/lib/auth";

export type ContestPhase = "upcoming" | "running" | "frozen" | "ended";

type ContestTiming = {
  startTime: Date;
  endTime: Date;
  freezeMinutes: number;
};

export function getContestPhase(
  contest: ContestTiming,
  now: Date = new Date()
): ContestPhase {
  if (now < contest.startTime) return "upcoming";
  if (now >= contest.endTime) return "ended";
  const freezeStart = new Date(
    contest.endTime.getTime() - contest.freezeMinutes * 60_000
  );
  return contest.freezeMinutes > 0 && now >= freezeStart ? "frozen" : "running";
}

type ContestReveal = ContestTiming & { revealedAt: Date | null };

// 排行榜/提交結果是否可以公開給非本人、非管理員的訪客看
export function isContestRevealed(
  contest: ContestReveal,
  now: Date = new Date()
): boolean {
  if (contest.revealedAt) return true;
  if (now < contest.endTime) return false;
  return contest.freezeMinutes === 0;
}

export async function assertContestProblemAccess(
  session: Session | null,
  contestId: number,
  problemId: number
) {
  if (!session) return { ok: false as const, error: "請先登入", status: 401 };

  const contest = await prisma.contest.findUnique({ where: { id: contestId } });
  if (!contest) return { ok: false as const, error: "比賽不存在", status: 404 };

  const isAdmin = session.role === "ADMIN";
  if (!isAdmin) {
    const participant = await prisma.contestParticipant.findUnique({
      where: { contestId_userId: { contestId, userId: session.userId } },
    });
    if (!participant) {
      return { ok: false as const, error: "尚未報名此比賽", status: 403 };
    }
  }

  const phase = getContestPhase(contest);
  if (phase === "upcoming") {
    return { ok: false as const, error: "比賽尚未開始", status: 403 };
  }
  if (phase === "ended" && !isAdmin) {
    return { ok: false as const, error: "比賽已結束", status: 403 };
  }

  const contestProblem = await prisma.contestProblem.findUnique({
    where: { contestId_problemId: { contestId, problemId } },
    include: { problem: true },
  });
  if (!contestProblem) {
    return { ok: false as const, error: "此題不屬於本比賽", status: 404 };
  }

  return { ok: true as const, contest, problem: contestProblem.problem };
}

export interface ScoreboardCell {
  attempts: number;
  solved: boolean;
  penaltyMinutes: number;
  pending: boolean;
}

export interface ScoreboardRow {
  userId: string;
  name: string;
  solvedCount: number;
  totalPenalty: number;
  cells: Record<number, ScoreboardCell>;
}

export interface ScoreboardProblem {
  id: number;
  label: string;
  title: string;
}

const WRONG_VERDICTS = new Set(["WA", "TLE", "MLE", "RE"]);

export async function buildScoreboard(
  contestId: number,
  opts: { revealAll: boolean }
): Promise<{ problems: ScoreboardProblem[]; rows: ScoreboardRow[] } | null> {
  const contest = await prisma.contest.findUnique({
    where: { id: contestId },
    include: {
      problems: {
        orderBy: [{ order: "asc" }, { id: "asc" }],
        include: { problem: { select: { id: true, title: true } } },
      },
      participants: {
        include: { user: { select: { id: true, username: true, displayName: true } } },
      },
    },
  });
  if (!contest) return null;

  const problems: ScoreboardProblem[] = contest.problems.map((cp) => ({
    id: cp.problemId,
    label: cp.label,
    title: cp.problem.title,
  }));

  const freezeStart = new Date(
    contest.endTime.getTime() - contest.freezeMinutes * 60_000
  );

  const submissions = await prisma.submission.findMany({
    where: {
      contestId,
      userId: { in: contest.participants.map((p) => p.userId) },
      problemId: { in: problems.map((p) => p.id) },
    },
    orderBy: { createdAt: "asc" },
    select: { userId: true, problemId: true, status: true, createdAt: true },
  });

  const byUserProblem = new Map<string, typeof submissions>();
  for (const s of submissions) {
    const key = `${s.userId}:${s.problemId}`;
    const list = byUserProblem.get(key) ?? [];
    list.push(s);
    byUserProblem.set(key, list);
  }

  const rows: ScoreboardRow[] = contest.participants.map((p) => {
    const cells: Record<number, ScoreboardCell> = {};
    let solvedCount = 0;
    let totalPenalty = 0;

    for (const problem of problems) {
      const subs = byUserProblem.get(`${p.userId}:${problem.id}`) ?? [];
      const visible = opts.revealAll
        ? subs
        : subs.filter((s) => s.createdAt < freezeStart);
      const hasFrozenAttempt = !opts.revealAll && subs.some((s) => s.createdAt >= freezeStart);

      let wrongBeforeAc = 0;
      let acAt: Date | null = null;
      for (const s of visible) {
        if (s.status === "AC") {
          acAt = s.createdAt;
          break;
        }
        if (WRONG_VERDICTS.has(s.status)) wrongBeforeAc++;
      }

      if (acAt) {
        const penaltyMinutes =
          Math.floor((acAt.getTime() - contest.startTime.getTime()) / 60_000) +
          20 * wrongBeforeAc;
        cells[problem.id] = { attempts: wrongBeforeAc, solved: true, penaltyMinutes, pending: false };
        solvedCount++;
        totalPenalty += penaltyMinutes;
      } else {
        const totalAttempts = hasFrozenAttempt ? subs.length : wrongBeforeAc;
        cells[problem.id] = {
          attempts: totalAttempts,
          solved: false,
          penaltyMinutes: 0,
          pending: hasFrozenAttempt,
        };
      }
    }

    return {
      userId: p.userId,
      name: p.user.displayName || p.user.username,
      solvedCount,
      totalPenalty,
      cells,
    };
  });

  rows.sort(
    (a, b) =>
      b.solvedCount - a.solvedCount ||
      a.totalPenalty - b.totalPenalty ||
      a.name.localeCompare(b.name)
  );

  return { problems, rows };
}
