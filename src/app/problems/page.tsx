import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import DifficultyBadge from "@/components/DifficultyBadge";

export const metadata: Metadata = { title: "題目列表" };
export const dynamic = "force-dynamic";

export default async function ProblemListPage() {
  const session = await getSession();
  const isAdmin = session?.role === "ADMIN";

  const difficultyOrder: Record<string, number> = { easy: 0, medium: 1, hard: 2 };
  const problems = (
    await prisma.problem.findMany({
      where: isAdmin ? {} : { isPublic: true },
      orderBy: { id: "asc" },
    })
  ).sort(
    (a, b) =>
      (difficultyOrder[a.difficulty] ?? 99) -
        (difficultyOrder[b.difficulty] ?? 99) || a.id - b.id
  );
  const acCounts = await prisma.submission.groupBy({
    by: ["problemId"],
    where: { status: "AC" },
    _count: { _all: true },
  });
  const allCounts = await prisma.submission.groupBy({
    by: ["problemId"],
    _count: { _all: true },
  });
  const acMap = new Map(acCounts.map((g) => [g.problemId, g._count._all]));
  const allMap = new Map(allCounts.map((g) => [g.problemId, g._count._all]));

  const solvedSet = new Set<number>();
  if (session) {
    const solved = await prisma.submission.findMany({
      where: { userId: session.userId, status: "AC" },
      distinct: ["problemId"],
      select: { problemId: true },
    });
    for (const s of solved) solvedSet.add(s.problemId);
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="page-title">題目列表</h1>
        {session && (
          <div className="flex items-center gap-4">
            <Link
              href="/problems/proposals"
              className="text-sm text-blue hover:underline"
            >
              我的申請
            </Link>
            <Link href="/problems/propose" className="btn-secondary">
              ＋ 申請出題
            </Link>
          </div>
        )}
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="table-head w-12 text-center">狀態</th>
              <th className="table-head w-16">#</th>
              <th className="table-head">標題</th>
              <th className="table-head w-24">難度</th>
              <th className="table-head w-28 text-right">通過 / 提交</th>
            </tr>
          </thead>
          <tbody>
            {problems.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="table-cell py-10 text-center text-mute"
                >
                  還沒有題目
                  {isAdmin && (
                    <>
                      ，
                      <Link
                        href="/admin/problems/new"
                        className="text-blue hover:underline"
                      >
                        來出第一題
                      </Link>
                    </>
                  )}
                </td>
              </tr>
            )}
            {problems.map((p) => (
              <tr key={p.id} className="hover:bg-panel2">
                <td className="table-cell text-center text-[#4caf50]">
                  {solvedSet.has(p.id) ? "✓" : ""}
                </td>
                <td className="table-cell text-dim">{p.id}</td>
                <td className="table-cell">
                  <Link
                    href={`/problems/${p.id}`}
                    className="font-medium text-blue hover:underline"
                  >
                    {p.title}
                  </Link>
                  {!p.isPublic && (
                    <span className="ml-2 text-xs text-mute">
                      （未公開）
                    </span>
                  )}
                </td>
                <td className="table-cell">
                  <DifficultyBadge difficulty={p.difficulty} />
                </td>
                <td className="table-cell text-right text-dim">
                  {acMap.get(p.id) ?? 0} / {allMap.get(p.id) ?? 0}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
