import { createHash } from "node:crypto";
import { prisma } from "@/lib/db";

// 台北時區的 YYYY-MM-DD（en-CA 的日期格式剛好就是這個形狀）。
export function taipeiDateString(date = new Date()): string {
  return date.toLocaleDateString("en-CA", { timeZone: "Asia/Taipei" });
}

export interface DailyProblem {
  id: number;
  order: number;
  title: string;
  difficulty: string;
  date: string;
}

// 每日一題：用台北日期 hash 從公開實作題裡挑，不用資料表、不用管理員排程。
// 同一天所有人看到同一題，換日自動換題。
export async function getDailyProblem(): Promise<DailyProblem | null> {
  const total = await prisma.problem.count({
    where: { type: "PROGRAMMING", isPublic: true },
  });
  if (total === 0) return null;

  const date = taipeiDateString();
  const hash = createHash("sha256").update(date).digest();
  const skip = hash.readUInt32BE(0) % total;

  const problem = await prisma.problem.findFirst({
    where: { type: "PROGRAMMING", isPublic: true },
    orderBy: [{ order: "asc" }, { id: "asc" }],
    skip,
    select: { id: true, order: true, title: true, difficulty: true },
  });
  return problem ? { ...problem, date } : null;
}
