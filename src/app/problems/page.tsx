import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import DifficultyBadge from "@/components/DifficultyBadge";
import HeaderSearch from "@/components/HeaderSearch";
import TagBadge from "@/components/TagBadge";

export const metadata: Metadata = {
  title: "題目列表",
  description: "APCS 風格的程式練習題，依難度與標籤分類，線上直接提交評測。",
};
export const dynamic = "force-dynamic";

export default async function ProblemListPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string; after?: string }>;
}) {
  const { tag, after: afterParam } = await searchParams;
  const after = Number(afterParam);
  const validAfter = Number.isInteger(after) && after >= 0 ? after : null;
  const pageSize = 30;
  const session = await getSession();
  const isAdmin = session?.role === "ADMIN";

  // 篩選列只列出（公開）實作題實際用到的標籤，不混入識讀群集專用的標籤
  const allTags = await prisma.tag.findMany({
    where: {
      problems: {
        some: {
          problem: {
            type: "PROGRAMMING",
            ...(isAdmin ? {} : { isPublic: true }),
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  const pageProblems = await prisma.problem.findMany({
    where: {
      type: "PROGRAMMING",
      ...(isAdmin ? {} : { isPublic: true }),
      ...(tag ? { tags: { some: { tag: { name: tag } } } } : {}),
      ...(validAfter === null ? {} : { order: { gt: validAfter } }),
    },
    orderBy: { order: "asc" },
    take: pageSize + 1,
    omit: { pdfData: true },
    include: { tags: { include: { tag: true } } },
  });
  const hasNextPage = pageProblems.length > pageSize;
  const problems = pageProblems.slice(0, pageSize);
  const problemIds = problems.map((p) => p.id);
  const acCounts = await prisma.submission.groupBy({
    by: ["problemId"],
    where: { status: "AC", problemId: { in: problemIds } },
    _count: { _all: true },
  });
  const allCounts = await prisma.submission.groupBy({
    by: ["problemId"],
    where: { problemId: { in: problemIds } },
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
      <div className="app-problem-search">
        <HeaderSearch variant="page" />
      </div>
      {allTags.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          <Link href="/problems" className={`pill ${!tag ? "pill-active" : ""}`}>
            全部
          </Link>
          {allTags.map((t) => (
            <Link
              key={t.id}
              href={`/problems?tag=${encodeURIComponent(t.name)}`}
              className={`pill ${tag === t.name ? "pill-active" : ""}`}
            >
              {t.name}
            </Link>
          ))}
        </div>
      )}
      {(validAfter !== null || hasNextPage) && (
        <nav className="mb-4 flex items-center justify-end gap-3 text-sm" aria-label="Problem list pagination">
          {validAfter !== null && (
            <Link href={tag ? `/problems?tag=${encodeURIComponent(tag)}` : "/problems"} className="btn-secondary">
              First page
            </Link>
          )}
          {hasNextPage && problems.length > 0 && (
            <Link
              href={`/problems?${new URLSearchParams({ ...(tag ? { tag } : {}), after: String(problems[problems.length - 1].order) })}`}
              className="btn-secondary"
            >
              Next page
            </Link>
          )}
        </nav>
      )}
      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="table-head w-16">#</th>
              <th className="table-head">標題</th>
              <th className="table-head">標籤</th>
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
                  {tag ? "這個標籤下還沒有題目" : "還沒有題目"}
                  {isAdmin && !tag && (
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
              <tr
                key={p.id}
                className={
                  solvedSet.has(p.id) ? "row-solved" : "hover:bg-panel2"
                }
              >
                <td className="table-cell text-dim">{p.order}</td>
                <td className="table-cell">
                  <Link
                    href={`/problems/${p.order}`}
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
                  <div className="flex flex-wrap gap-1.5">
                    {p.tags.map((pt) => (
                      <TagBadge key={pt.tagId} name={pt.tag.name} />
                    ))}
                  </div>
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
