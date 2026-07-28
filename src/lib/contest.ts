import { prisma } from "@/lib/db";
import type { Session } from "@/lib/auth";
import { LANGUAGES, isLanguageKey } from "@/lib/languages";

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

// 空字串 = 不限制。回傳 null 代表全部語言都可以用。
export function parseAllowedLanguages(value: string): string[] | null {
  const list = value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return list.length > 0 ? list : null;
}

export function languageLabels(keys: string[]): string {
  return keys
    .map((k) => (isLanguageKey(k) ? LANGUAGES[k].label : k))
    .join("、");
}

export async function assertContestProblemAccess(
  session: Session | null,
  contestId: number,
  problemId: number,
  language?: string
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

  const allowed = parseAllowedLanguages(contest.allowedLanguages);
  if (language !== undefined && allowed && !allowed.includes(language)) {
    return {
      ok: false as const,
      error: `本比賽只開放 ${languageLabels(allowed)}`,
      status: 400,
    };
  }

  return { ok: true as const, contest, problem: contestProblem.problem };
}

export type ScoreMode = "ICPC" | "IOI";

export function toScoreMode(value: string): ScoreMode {
  return value === "IOI" ? "IOI" : "ICPC";
}

export interface ScoreboardCell {
  // ICPC：AC 之前的錯誤次數；IOI：總提交次數
  attempts: number;
  solved: boolean;
  // ICPC：該題罰時；IOI：計分那一次提交距離開賽的分鐘數
  minutes: number;
  pending: boolean; // 凍結中，結果尚未公開
  judging: boolean; // 計分的那筆還在等判題（離線比賽整批上傳後會有一段這種狀態）
}

export interface ScoreboardRow {
  userId: string;
  name: string;
  solvedCount: number;
  // ICPC：總罰時；IOI：已解題目的總用時
  totalMinutes: number;
  cells: Record<number, ScoreboardCell>;
}

export interface ScoreboardProblem {
  id: number;
  label: string;
  title: string;
}

const WRONG_VERDICTS = new Set(["WA", "TLE", "MLE", "RE"]);
const UNJUDGED = new Set(["PENDING", "JUDGING"]);

export async function buildScoreboard(
  contestId: number,
  opts: { revealAll: boolean }
): Promise<{
  problems: ScoreboardProblem[];
  rows: ScoreboardRow[];
  scoreMode: ScoreMode;
} | null> {
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

  const scoreMode = toScoreMode(contest.scoreMode);

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
    // id 當第二鍵：整批上傳時多筆時間戳可能被夾制到同一個邊界值，
    // 沒有穩定的次序 IOI 的「最後一次提交」就會變得不確定
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    select: { userId: true, problemId: true, status: true, createdAt: true },
  });

  const byUserProblem = new Map<string, typeof submissions>();
  for (const s of submissions) {
    const key = `${s.userId}:${s.problemId}`;
    const list = byUserProblem.get(key) ?? [];
    list.push(s);
    byUserProblem.set(key, list);
  }

  const minutesSinceStart = (at: Date) =>
    Math.floor((at.getTime() - contest.startTime.getTime()) / 60_000);

  const rows: ScoreboardRow[] = contest.participants.map((p) => {
    const cells: Record<number, ScoreboardCell> = {};
    let solvedCount = 0;
    let totalMinutes = 0;

    for (const problem of problems) {
      const subs = byUserProblem.get(`${p.userId}:${problem.id}`) ?? [];
      const visible = opts.revealAll
        ? subs
        : subs.filter((s) => s.createdAt < freezeStart);
      const hasFrozenAttempt = !opts.revealAll && subs.some((s) => s.createdAt >= freezeStart);

      if (scoreMode === "IOI") {
        // 只有最後一次提交算數，所以凍結期間只要有任何提交，這一格的結果就
        // 可能被它改寫，整格都不能公開（不像 ICPC 只要 AC 過就定案）。
        if (hasFrozenAttempt) {
          cells[problem.id] = {
            attempts: subs.length,
            solved: false,
            minutes: 0,
            pending: true,
            judging: false,
          };
          continue;
        }

        const counted = visible.length > 0 ? visible[visible.length - 1] : null;
        const judging = counted ? UNJUDGED.has(counted.status) : false;
        const solved = counted?.status === "AC";
        const minutes = solved && counted ? minutesSinceStart(counted.createdAt) : 0;

        cells[problem.id] = {
          attempts: visible.length,
          solved,
          minutes,
          pending: false,
          judging,
        };
        if (solved) {
          solvedCount++;
          totalMinutes += minutes;
        }
        continue;
      }

      // ICPC：首次 AC 定案，之前每次錯誤 +20 分罰時
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
        const minutes = minutesSinceStart(acAt) + 20 * wrongBeforeAc;
        cells[problem.id] = {
          attempts: wrongBeforeAc,
          solved: true,
          minutes,
          pending: false,
          judging: false,
        };
        solvedCount++;
        totalMinutes += minutes;
      } else {
        const totalAttempts = hasFrozenAttempt ? subs.length : wrongBeforeAc;
        cells[problem.id] = {
          attempts: totalAttempts,
          solved: false,
          minutes: 0,
          pending: hasFrozenAttempt,
          judging: visible.some((s) => UNJUDGED.has(s.status)),
        };
      }
    }

    return {
      userId: p.userId,
      name: p.user.displayName || p.user.username,
      solvedCount,
      totalMinutes,
      cells,
    };
  });

  rows.sort(
    (a, b) =>
      b.solvedCount - a.solvedCount ||
      a.totalMinutes - b.totalMinutes ||
      a.name.localeCompare(b.name)
  );

  return { problems, rows, scoreMode };
}
