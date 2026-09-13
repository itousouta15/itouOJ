import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { PROBLEM_TYPES, type ProblemType } from "@/lib/problemTypes";
import AdminProblemTable from "@/components/AdminProblemTable";

export const metadata: Metadata = { title: "題目管理" };
export const dynamic = "force-dynamic";

export default async function AdminProblemsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const session = await getSession();
  if (session?.role !== "ADMIN") redirect("/");

  const { type: rawType } = await searchParams;
  const type: ProblemType = (PROBLEM_TYPES as readonly string[]).includes(
    rawType ?? "",
  )
    ? (rawType as ProblemType)
    : "PROGRAMMING";

  const problems = await prisma.problem.findMany({
    where: { type },
    orderBy: { order: "asc" },
    omit: { pdfData: true },
    include: {
      _count: { select: { testCases: true, submissions: true } },
      cluster: { select: { title: true } },
      author: { select: { username: true, displayName: true } },
    },
  });
  const rows = problems.map((p) => ({
    id: p.id,
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
  }));
  const [pendingProposals, users] = await Promise.all([
    prisma.problemProposal.count({ where: { status: "PENDING" } }),
    prisma.user.findMany({
      orderBy: { username: "asc" },
      select: { username: true, displayName: true },
    }),
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
      <div className="card overflow-x-auto">
          <AdminProblemTable key={type} problems={rows} type={type} users={users} />
      </div>
    </div>
  );
}
