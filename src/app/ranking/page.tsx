import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: "排行" };
export const dynamic = "force-dynamic";

export default async function RankingPage() {
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
    submissionCounts.map((g) => [g.userId, g._count._all])
  );

  const users = await prisma.user.findMany({
    select: { id: true, username: true, displayName: true },
  });
  const rows = users
    .map((u) => ({
      username: u.username,
      displayName: u.displayName,
      solved: solvedByUser.get(u.id) ?? 0,
      submissions: subsByUser.get(u.id) ?? 0,
    }))
    .filter((r) => r.submissions > 0)
    .sort((a, b) => b.solved - a.solved || a.submissions - b.submissions)
    .slice(0, 100);

  return (
    <div>
      <h1 className="mb-4 page-title">排行</h1>
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
                <td className="table-cell font-semibold text-dim">
                  {i + 1}
                </td>
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
