import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { PROBLEM_TYPES, type ProblemType } from "@/lib/problemTypes";
import AdminProblemTable from "@/components/AdminProblemTable";

export const metadata: Metadata = { title: "題目管理" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

function adminProblemsHref({
  type,
  query,
  page,
  reorder,
}: {
  type: ProblemType;
  query?: string;
  page?: number;
  reorder?: boolean;
}) {
  const params = new URLSearchParams({ type });
  if (query) params.set("q", query);
  if (page && page > 1) params.set("page", String(page));
  if (reorder) params.set("reorder", "1");
  return `/admin/problems?${params.toString()}`;
}

export default async function AdminProblemsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; page?: string; q?: string; reorder?: string }>;
}) {
  const session = await getSession();
  if (session?.role !== "ADMIN") redirect("/");

  const { type: rawType, page: pageParam, q, reorder: reorderParam } = await searchParams;
  const type: ProblemType = (PROBLEM_TYPES as readonly string[]).includes(
    rawType ?? "",
  )
    ? (rawType as ProblemType)
    : "PROGRAMMING";
  const query = q?.trim() ?? "";
  // 拖曳排序會依序重編整份清單的題目代碼，所以只在「排序模式」載入完整清單；
  // 平常瀏覽用伺服器端分頁，不把全部題目送到瀏覽器。
  const reorderMode = reorderParam === "1";

  const queryNumber = /^\d+$/.test(query) ? Number(query) : null;
  const where: Prisma.ProblemWhereInput = {
    type,
    ...(query
      ? {
          OR: [
            { title: { contains: query } },
            { problemCode: { contains: query } },
            ...(queryNumber !== null ? [{ order: queryNumber }] : []),
          ],
        }
      : {}),
  };
  const total = await prisma.problem.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const requestedPage = Number(pageParam);
  const currentPage = Math.min(
    Math.max(Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1, 1),
    totalPages,
  );

  // 只選表格會顯示的欄位：statement / code / explanation / pdf 等大欄位不需要載入。
  const problems = await prisma.problem.findMany({
    where: reorderMode ? { type } : where,
    orderBy: [{ problemCode: "asc" }, { order: "asc" }, { id: "asc" }],
    ...(reorderMode ? {} : { skip: (currentPage - 1) * PAGE_SIZE, take: PAGE_SIZE }),
    select: {
      id: true,
      problemCode: true,
      order: true,
      type: true,
      title: true,
      difficulty: true,
      isPublic: true,
      paper: true,
      sourceNumber: true,
      category: true,
      _count: { select: { testCases: true, submissions: true } },
      cluster: { select: { title: true } },
      author: { select: { username: true, displayName: true } },
      tags: { select: { tag: true } },
    },
  });
  const rows = problems.map((p) => ({
    id: p.id,
    problemCode: p.problemCode,
    order: p.order,
    type: p.type,
    title: p.title,
    difficulty: p.difficulty,
    isPublic: p.isPublic,
    testCaseCount: p._count.testCases,
    submissionCount: p._count.submissions,
    clusterTitle: p.cluster?.title ?? null,
    paper: p.paper,
    sourceNumber: p.sourceNumber,
    category: p.category,
    author: p.author,
    tags: p.tags.map(({ tag }) => tag),
  }));
  const [pendingProposals, users, tags] = await Promise.all([
    prisma.problemProposal.count({ where: { status: "PENDING" } }),
    prisma.user.findMany({
      orderBy: { username: "asc" },
      select: { username: true, displayName: true },
    }),
    prisma.tag.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-4">
          <h1 className="page-title">題目管理</h1>
          <div className="flex flex-wrap gap-2 text-sm">
            <Link
              href="/admin/problems?type=PROGRAMMING"
              className={`pill ${type === "PROGRAMMING" ? "pill-active" : ""}`}
            >
              實作題
            </Link>
            <Link
              href="/admin/problems?type=RECOGNITION"
              className={`pill ${type === "RECOGNITION" ? "pill-active" : ""}`}
            >
              識別題
            </Link>
          </div>
        </div>
        <Link
          href={`/admin/problems/new?type=${type}`}
          className="btn-primary"
        >
          ＋ 新增題目
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-4">
        <Link href="/admin/judge" className="text-sm text-blue hover:underline">評測監控 →</Link>
        <Link href="/admin/ctf" className="text-sm text-blue hover:underline">CTF 管理 →</Link>
        <Link
          href="/admin/problems/proposals"
          className="text-sm text-blue hover:underline"
        >
          出題申請{pendingProposals > 0 ? ` (${pendingProposals})` : ""} →
        </Link>
        <Link
          href="/admin/recognition"
          className="text-sm text-blue hover:underline"
        >
          識讀群集 →
        </Link>
        <Link
          href="/admin/courses"
          className="text-sm text-blue hover:underline"
        >
          課程管理 →
        </Link>
        <Link
          href="/admin/announcements"
          className="text-sm text-blue hover:underline"
        >
          公告管理 →
        </Link>
        <Link
          href="/admin/contests"
          className="text-sm text-blue hover:underline"
        >
          比賽管理 →
        </Link>
        <Link
          href="/admin/tags"
          className="text-sm text-blue hover:underline"
        >
          標籤管理 →
        </Link>
        <Link
          href="/admin/users"
          className="text-sm text-blue hover:underline"
        >
          使用者 →
        </Link>
      </div>
      <p className="mono mb-2 text-[11px] text-mute sm:hidden">
        ← 左右滑動可看到更多欄位 →
      </p>
      {reorderMode ? (
        <div className="mb-4 flex flex-wrap items-center gap-3 text-sm">
          <span className="text-dim">排序模式：已載入全部 {rows.length} 題，可拖曳調整順序。</span>
          <Link href={adminProblemsHref({ type })} className="btn-secondary">離開排序模式</Link>
        </div>
      ) : (
        <form
          action="/admin/problems"
          className="mb-4 flex flex-wrap items-center gap-2"
          role="search"
        >
          <input type="hidden" name="type" value={type} />
          <input
            key={query}
            type="search"
            name="q"
            defaultValue={query}
            className="input min-w-0 flex-1"
            placeholder="搜尋題號或題目名稱"
            aria-label="搜尋管理題目的題號或名稱"
          />
          <button type="submit" className="btn-primary">搜尋</button>
          {query && (
            <Link href={adminProblemsHref({ type })} className="btn-secondary">清除搜尋</Link>
          )}
          <Link href={adminProblemsHref({ type, reorder: true })} className="btn-secondary">
            排序模式
          </Link>
          <span className="text-sm text-dim">
            {query ? `符合 ${total} 題` : `共 ${total} 題`}
          </span>
        </form>
      )}
      <div
        key={`${type}:${query}:${currentPage}:${reorderMode}`}
        className="card problem-page-switch overflow-x-auto"
      >
          <AdminProblemTable
            key={`${type}:${query}:${currentPage}:${reorderMode}`}
            problems={rows}
            type={type}
            users={users}
            tags={tags}
            reorderMode={reorderMode}
          />
      </div>
      {!reorderMode && totalPages > 1 && (
        <nav
          className="mt-4 flex flex-wrap items-center justify-center gap-2 text-sm"
          aria-label="Admin problem pagination"
        >
          {currentPage > 1 ? (
            <Link
              href={adminProblemsHref({ type, query, page: currentPage - 1 })}
              className="btn-secondary"
            >
              上一頁
            </Link>
          ) : (
            <span className="btn-secondary cursor-not-allowed opacity-50">上一頁</span>
          )}
          <span className="text-dim">
            第 {currentPage} / {totalPages} 頁
          </span>
          {currentPage < totalPages ? (
            <Link
              href={adminProblemsHref({ type, query, page: currentPage + 1 })}
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
