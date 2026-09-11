import { prisma } from "@/lib/db";

export interface AchievementStats {
  solved: number;
  recognitionCorrect: number;
  streakLongest: number;
  solutions: number;
  comments: number;
  contests: number;
  proposals: number;
}

export interface AchievementDef {
  id: string;
  glyph: string;
  name: string;
  description: string;
  target: number;
  value: (s: AchievementStats) => number;
}

// 徽章全部即時計算，不建資料表：數字都來自現有紀錄，
// 沒有「什麼時候拿到」這種需要保存的資訊。
export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: "first-ac",
    glyph: "★",
    name: "初次 AC",
    description: "通過第一題",
    target: 1,
    value: (s) => s.solved,
  },
  {
    id: "solve-10",
    glyph: "✦",
    name: "解題 10",
    description: "通過 10 題",
    target: 10,
    value: (s) => s.solved,
  },
  {
    id: "solve-50",
    glyph: "✧",
    name: "解題 50",
    description: "通過 50 題",
    target: 50,
    value: (s) => s.solved,
  },
  {
    id: "solve-100",
    glyph: "❖",
    name: "解題 100",
    description: "通過 100 題",
    target: 100,
    value: (s) => s.solved,
  },
  {
    id: "recognition-50",
    glyph: "◈",
    name: "識讀 50",
    description: "答對 50 題識讀題",
    target: 50,
    value: (s) => s.recognitionCorrect,
  },
  {
    id: "recognition-125",
    glyph: "✵",
    name: "識讀 125",
    description: "答對 125 題識讀題",
    target: 125,
    value: (s) => s.recognitionCorrect,
  },
  {
    id: "streak-3",
    glyph: "▲",
    name: "連續 3 天",
    description: "連續 3 天有解題",
    target: 3,
    value: (s) => s.streakLongest,
  },
  {
    id: "streak-7",
    glyph: "◆",
    name: "連續 7 天",
    description: "連續 7 天有解題",
    target: 7,
    value: (s) => s.streakLongest,
  },
  {
    id: "streak-30",
    glyph: "✹",
    name: "連續 30 天",
    description: "連續 30 天有解題",
    target: 30,
    value: (s) => s.streakLongest,
  },
  {
    id: "first-solution",
    glyph: "✎",
    name: "首次題解",
    description: "發表第一篇題解",
    target: 1,
    value: (s) => s.solutions,
  },
  {
    id: "commenter",
    glyph: "✉",
    name: "討論常客",
    description: "發表 10 則留言",
    target: 10,
    value: (s) => s.comments,
  },
  {
    id: "contestant",
    glyph: "⚑",
    name: "比賽參加",
    description: "參加一場比賽",
    target: 1,
    value: (s) => s.contests,
  },
  {
    id: "proposer",
    glyph: "❉",
    name: "出題新星",
    description: "出題申請通過",
    target: 1,
    value: (s) => s.proposals,
  },
];

export async function getAchievementStats(
  userId: string,
  base: {
    solvedCount: number;
    recognitionCorrect: number;
    streakLongest: number;
  }
): Promise<AchievementStats> {
  const [solutions, comments, contests, proposals] = await Promise.all([
    prisma.problemSolution.count({ where: { authorId: userId } }),
    prisma.problemComment.count({ where: { authorId: userId } }),
    prisma.contestParticipant.count({ where: { userId } }),
    prisma.problemProposal.count({
      where: { authorId: userId, status: "APPROVED" },
    }),
  ]);
  return {
    solved: base.solvedCount,
    recognitionCorrect: base.recognitionCorrect,
    streakLongest: base.streakLongest,
    solutions,
    comments,
    contests,
    proposals,
  };
}
