import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import AdminProblemTable from "@/components/AdminProblemTable";

export const metadata: Metadata = { title: "題目管理" };
export const dynamic = "force-dynamic";

export default async function AdminProblemsPage() {
  const session = await getSession();
  if (session?.role !== "ADMIN") redirect("/");

  const problems = await prisma.problem.findMany({
    orderBy: { order: "asc" },
    include: { _count: { select: { testCases: true, submissions: true } } },
  });
  const rows = problems.map((p) => ({
    id: p.id,
    order: p.order,
    title: p.title,
    difficulty: p.difficulty,
    isPublic: p.isPublic,
    testCaseCount: p._count.testCases,
    submissionCount: p._count.submissions,
  }));
  const pendingProposals = await prisma.problemProposal.count({
    where: { status: "PENDING" },
  });

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <h1 className="page-title">題目管理</h1>
          <Link
            href="/admin/problems/proposals"
            className="text-sm text-blue hover:underline"
          >
            出題申請{pendingProposals > 0 ? ` (${pendingProposals})` : ""} →
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
        </div>
        <Link href="/admin/problems/new" className="btn-primary">
          ＋ 新增題目
        </Link>
      </div>
      <p className="mono mb-2 text-[11px] text-mute sm:hidden">
        ← 左右滑動可看到更多欄位 →
      </p>
      <div className="card overflow-x-auto">
        <AdminProblemTable problems={rows} />
      </div>
    </div>
  );
}
