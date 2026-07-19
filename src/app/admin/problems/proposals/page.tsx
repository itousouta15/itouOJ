import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import ProposalStatusBadge from "@/components/ProposalStatusBadge";

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
      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="table-head w-16">#</th>
              <th className="table-head">標題</th>
              <th className="table-head w-32">投稿人</th>
              <th className="table-head w-24">狀態</th>
              <th className="table-head w-40">送出時間</th>
              <th className="table-head w-20"></th>
            </tr>
          </thead>
          <tbody>
            {proposals.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="table-cell py-10 text-center text-mute"
                >
                  目前沒有出題申請
                </td>
              </tr>
            )}
            {proposals.map((p) => (
              <tr key={p.id} className="hover:bg-panel2">
                <td className="table-cell text-dim">{p.id}</td>
                <td className="table-cell font-medium">{p.title}</td>
                <td className="table-cell text-dim">{p.author.username}</td>
                <td className="table-cell">
                  <ProposalStatusBadge status={p.status} />
                </td>
                <td className="table-cell text-sm text-dim">
                  {p.createdAt.toLocaleString("zh-TW")}
                </td>
                <td className="table-cell">
                  <Link
                    href={`/admin/problems/proposals/${p.id}`}
                    className="text-sm text-blue hover:underline"
                  >
                    審核
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
