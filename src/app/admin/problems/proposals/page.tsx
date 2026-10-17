import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import AdminProposalTable from "@/components/AdminProposalTable";

export const metadata: Metadata = { title: "出題申請審核" };
export const dynamic = "force-dynamic";

export default async function AdminProposalsPage() {
  const session = await getSession();
  if (session?.role !== "ADMIN") redirect("/");

  const proposals = await prisma.problemProposal.findMany({
    orderBy: [{ createdAt: "desc" }],
    include: { author: { select: { username: true } } },
  });

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <h1 className="page-title">出題申請審核</h1>
          <Link
            href="/admin/problems"
            className="text-sm text-blue hover:underline"
          >
            ← 題目管理
          </Link>
        </div>
      </div>
      <div className="card overflow-x-auto p-4">
        <AdminProposalTable
          proposals={proposals.map((proposal) => ({
            id: proposal.id,
            title: proposal.title,
            status: proposal.status,
            createdAt: proposal.createdAt.toLocaleString("zh-TW"),
            author: proposal.author,
          }))}
        />
      </div>
    </div>
  );
}
