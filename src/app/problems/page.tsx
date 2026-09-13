import Link from "next/link";
import type { Metadata } from "next";
import { Prisma } from "@/generated/prisma/client";
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

const PAGE_SIZE = 30;

function problemsHref({
  tag,
  sort,
  page,
}: {
  tag?: string;
  sort: "order" | "difficulty";
  page?: number;
}) {
  const params = new URLSearchParams();
  if (tag) params.set("tag", tag);
  if (sort === "difficulty") params.set("sort", sort);
  if (page && page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/problems?${query}` : "/problems";
}

export default async function ProblemListPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string; page?: string; sort?: string }>;
}) {
  const { tag, page: pageParam, sort: sortParam } = await searchParams;
  const requestedPage = Number(pageParam);
  const sort = sortParam === "difficulty" ? "difficulty" : "order";
  const session = await getSession();
  const isAdmin = session?.role === "ADMIN";
  const where = {
    type: "PROGRAMMING",
    ...(isAdmin ? {} : { isPublic: true }),
    ...(tag ? { tags: { some: { tag: { name: tag } } } } : {}),
  } as const;

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

  const totalProblems = await prisma.problem.count({ where });
  const totalPages = Math.ceil(totalProblems / PAGE_SIZE);
  const currentPage =
    totalPages === 0
      ? 1
      : Math.min(
          Math.max(Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1, 1),
          totalPages,
        );
  const offset = (currentPage - 1) * PAGE_SIZE;
  const conditions = [Prisma.sql`p."type" = 'PROGRAMMING'`];
  if (!isAdmin) conditions.push(Prisma.sql`p."isPublic" = 1`);
  if (tag) {
    conditions.push(Prisma.sql`
      EXISTS (
        SELECT 1
        FROM "ProblemTag" pt
        INNER JOIN "Tag" t ON t."id" = pt."tagId"
        WHERE pt."problemId" = p."id" AND t."name" = ${tag}
      )
    `);
  }
  const orderBy =
    sort === "difficulty"
      ? Prisma.sql`
          CASE p."difficulty"
            WHEN 'easy' THEN 1
            WHEN 'medium' THEN 2
            WHEN 'hard' THEN 3
            ELSE 4
          END ASC,
          p."order" ASC
        `
      : Prisma.sql`p."order" ASC`;
  const pageRows = await prisma.$queryRaw<{ id: number }[]>`
    SELECT p."id"
    FROM "Problem" p
    WHERE ${Prisma.join(conditions, " AND ")}
    ORDER BY ${orderBy}
    LIMIT ${PAGE_SIZE} OFFSET ${offset}
  `;
  const pageProblemIds = pageRows.map((p) => p.id);
  const pageProblems = await prisma.problem.findMany({
    where: { id: { in: pageProblemIds } },
    omit: { pdfData: true },
    include: { tags: { include: { tag: true } } },
  });
  const byId = new Map(pageProblems.map((problem) => [problem.id, problem]));
  const problems = pageProblemIds.flatMap((id) => {
    const problem = byId.get(id);
    return problem ? [problem] : [];
  });
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
          <Link
            href={problemsHref({ sort })}
            className={`pill ${!tag ? "pill-active" : ""}`}
          >
            全部
          </Link>
          {allTags.map((t) => (
            <Link
              key={t.id}
              href={problemsHref({ tag: t.name, sort })}
              className={`pill ${tag === t.name ? "pill-active" : ""}`}
            >
              {t.name}
            </Link>
          ))}
        </div>
      )}
      <div className="mb-4 flex flex-wrap gap-2 text-sm">
        <span className="self-center text-dim">排序：</span>
        <Link
          href={problemsHref({ tag, sort: "order" })}
          className={`pill ${sort === "order" ? "pill-active" : ""}`}
        >
          題號
        </Link>
        <Link
          href={problemsHref({ tag, sort: "difficulty" })}
          className={`pill ${sort === "difficulty" ? "pill-active" : ""}`}
        >
          難度（易到難）
        </Link>
      </div>
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
      {totalPages > 1 && (
        <nav
          className="mt-4 flex flex-wrap items-center justify-center gap-2 text-sm"
          aria-label="Problem list pagination"
        >
          {currentPage > 1 ? (
            <Link
              href={problemsHref({ tag, sort, page: currentPage - 1 })}
              className="btn-secondary"
            >
              上一頁
            </Link>
          ) : (
            <span className="btn-secondary cursor-not-allowed opacity-50">上一頁</span>
          )}
          {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
            <Link
              key={page}
              href={problemsHref({ tag, sort, page })}
              aria-current={page === currentPage ? "page" : undefined}
              className={`pill ${page === currentPage ? "pill-active" : ""}`}
            >
              {page}
            </Link>
          ))}
          {currentPage < totalPages ? (
            <Link
              href={problemsHref({ tag, sort, page: currentPage + 1 })}
              className="btn-secondary"
            >
              下一頁
            </Link>
          ) : (
            <span className="btn-secondary cursor-not-allowed opacity-50">下一頁</span>
          )}
        </nav>
      )}
    </div>
  );
}
