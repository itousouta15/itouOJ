import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: "排行" };
export const dynamic = "force-dynamic";

// 115 年高中部營隊＝加入 APCS 初級營 Day1~Day5 這五門課程的人。
// 用課程標題（而不是寫死 id）比對，dev / 正式站的課程 id 不保證一樣。
const CAMP_COURSE_TITLES = [
  "APCS 初級營 Day1｜資訊啟蒙",
  "APCS 初級營 Day2｜變數與運算子",
  "APCS 初級營 Day3｜迴圈",
  "APCS 初級營 Day4｜陣列與字串",
  "APCS 初級營 Day5｜總複習與實戰演練",
];

interface RankRow {
  username: string;
  displayName: string | null;
  solved: number;
  submissions: number;
}

async function siteWideRanking(): Promise<RankRow[]> {
  const acPairs = await prisma.submission.findMany({
    where: { status: "AC" },
    distinct: ["userId", "problemId"],
    select: { userId: true },
  });
  const solvedByUser = new Map<string, number>();
  for (const { userId } of acPairs) {
    solvedByUser.set(userId, (solvedByUser.get(userId) ?? 0) + 1);
  }

  const submissionCounts = await prisma.submission.groupBy({
    by: ["userId"],
    _count: { _all: true },
  });
  const subsByUser = new Map(
    submissionCounts.map((g) => [g.userId, g._count._all]),
  );

  const users = await prisma.user.findMany({
    select: { id: true, username: true, displayName: true },
  });
  return users
    .map((u) => ({
      username: u.username,
      displayName: u.displayName,
      solved: solvedByUser.get(u.id) ?? 0,
      submissions: subsByUser.get(u.id) ?? 0,
    }))
    .filter((r) => r.submissions > 0)
    .sort((a, b) => b.solved - a.solved || a.submissions - b.submissions);
}

async function campRanking(): Promise<RankRow[]> {
  const courses = await prisma.course.findMany({
    where: { title: { in: CAMP_COURSE_TITLES } },
    select: { id: true },
  });
  const courseIds = courses.map((c) => c.id);
  if (courseIds.length === 0) return [];

  const [members, courseProblems] = await Promise.all([
    prisma.courseMember.findMany({
      where: { courseId: { in: courseIds } },
      distinct: ["userId"],
      select: { userId: true },
    }),
    prisma.courseProblem.findMany({
      where: { courseId: { in: courseIds } },
      distinct: ["problemId"],
      select: { problemId: true },
    }),
  ]);
  const memberIds = members.map((m) => m.userId);
  const problemIds = courseProblems.map((cp) => cp.problemId);
  if (memberIds.length === 0 || problemIds.length === 0) return [];

  const [acPairs, submissionCounts, users] = await Promise.all([
    prisma.submission.findMany({
      where: {
        status: "AC",
        userId: { in: memberIds },
        problemId: { in: problemIds },
      },
      distinct: ["userId", "problemId"],
      select: { userId: true },
    }),
    prisma.submission.groupBy({
      by: ["userId"],
      where: { userId: { in: memberIds }, problemId: { in: problemIds } },
      _count: { _all: true },
    }),
    prisma.user.findMany({
      where: { id: { in: memberIds } },
      select: { id: true, username: true, displayName: true },
    }),
  ]);

  const solvedByUser = new Map<string, number>();
  for (const { userId } of acPairs) {
    solvedByUser.set(userId, (solvedByUser.get(userId) ?? 0) + 1);
  }
  const subsByUser = new Map(
    submissionCounts.map((g) => [g.userId, g._count._all]),
  );

  return users
    .map((u) => ({
      username: u.username,
      displayName: u.displayName,
      solved: solvedByUser.get(u.id) ?? 0,
      submissions: subsByUser.get(u.id) ?? 0,
    }))
    .filter((r) => r.submissions > 0)
    .sort((a, b) => b.solved - a.solved || a.submissions - b.submissions);
}

export default async function RankingPage({
  searchParams,
}: {
  searchParams: Promise<{ scope?: string }>;
}) {
  const { scope } = await searchParams;
  const isCamp = scope === "camp";

  const rows = (isCamp ? await campRanking() : await siteWideRanking()).slice(
    0,
    100,
  );

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <h1 className="page-title">排行</h1>
        <div className="flex flex-wrap gap-2 text-sm">
          <Link
            href="/ranking"
            className={`pill ${!isCamp ? "pill-active" : ""}`}
          >
            全站
          </Link>
          <Link
            href="/ranking?scope=camp"
            className={`pill ${isCamp ? "pill-active" : ""}`}
          >
            115 年高中部營隊
          </Link>
        </div>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="table-head w-20">名次</th>
              <th className="table-head">使用者</th>
              <th className="table-head w-28 text-right">解題數</th>
              <th className="table-head w-28 text-right">提交數</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="table-cell py-10 text-center text-mute"
                >
                  還沒有人提交過
                </td>
              </tr>
            )}
            {rows.map((r, i) => (
              <tr key={r.username} className="hover:bg-panel2">
                <td className="table-cell font-semibold text-dim">{i + 1}</td>
                <td className="table-cell font-medium">
                  <Link
                    href={`/users/${r.username}`}
                    className="text-blue hover:underline"
                  >
                    {r.displayName || r.username}
                  </Link>
                </td>
                <td className="table-cell text-right font-semibold text-[#4caf50]">
                  {r.solved}
                </td>
                <td className="table-cell text-right text-dim">
                  {r.submissions}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
