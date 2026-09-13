import { prisma } from "@/lib/db";

const TAIPEI = "Asia/Taipei";

function dayKey(date: Date): string {
  return date.toLocaleDateString("en-CA", { timeZone: TAIPEI });
}

function shiftDay(key: string, delta: number): string {
  // 用 +08:00 的午夜當基準再位移，跨時區也不會歪掉
  const d = new Date(`${key}T00:00:00+08:00`);
  d.setUTCDate(d.getUTCDate() + delta);
  return dayKey(d);
}

export interface UserStreak {
  current: number;
  longest: number;
  winCurrent: number;
  winLongest: number;
}

// 連續解題：當天有實作題 AC 或識讀答對都算「有解題」。目前連續在
// 「今天有活動」或「今天還沒寫但昨天有」時都算延續（寬限一天），
// 不會因為今天還沒開工就顯示中斷。連勝則是依提交順序計算連續 AC，
// 中間任何非 AC 結果都會重置。
export async function getUserStreak(userId: string): Promise<UserStreak> {
  const [submissions, recognition] = await Promise.all([
    prisma.submission.findMany({
      where: { userId },
      orderBy: { id: "asc" },
      select: { status: true, createdAt: true },
    }),
    prisma.recognitionAnswer.findMany({
      where: { userId, isCorrect: true },
      select: { updatedAt: true },
    }),
  ]);

  const days = new Set<string>();
  for (const s of submissions) {
    if (s.status === "AC") days.add(dayKey(s.createdAt));
  }
  for (const r of recognition) days.add(dayKey(r.updatedAt));

  let winLongest = 0;
  let winRun = 0;
  for (const submission of submissions) {
    winRun = submission.status === "AC" ? winRun + 1 : 0;
    if (winRun > winLongest) winLongest = winRun;
  }

  let winCurrent = 0;
  for (let i = submissions.length - 1; i >= 0; i--) {
    if (submissions[i].status !== "AC") break;
    winCurrent++;
  }

  if (days.size === 0) return { current: 0, longest: 0, winCurrent, winLongest };

  const sorted = [...days].sort();

  let longest = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    if (shiftDay(sorted[i - 1], 1) === sorted[i]) run++;
    else run = 1;
    if (run > longest) longest = run;
  }

  const today = dayKey(new Date());
  let cursor = days.has(today) ? today : shiftDay(today, -1);
  let current = 0;
  while (days.has(cursor)) {
    current++;
    cursor = shiftDay(cursor, -1);
  }

  return { current, longest, winCurrent, winLongest };
}
