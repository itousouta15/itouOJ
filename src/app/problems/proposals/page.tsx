import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import ProposalStatusBadge from "@/components/ProposalStatusBadge";

export const metadata: Metadata = { title: "我的出題申請" };
export const dynamic = "force-dynamic";

export default async function MyProposalsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const proposals = await prisma.problemProposal.findMany({
    where: { authorId: session.userId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="page-title">我的出題申請</h1>
        <Link href="/problems/propose" className="btn-primary">
          ＋ 申請出題
        </Link>
      </div>
      {proposals.length === 0 && (
        <div className="card p-10 text-center text-mute">
          還沒有出題申請，點右上角開始投稿題目
        </div>
      )}
      <div className="space-y-4">
        {proposals.map((p) => (
          <div key={p.id} className="card space-y-2 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <span className="font-medium">{p.title}</span>
                <ProposalStatusBadge status={p.status} />
              </div>
              <span className="text-xs text-dim">
                {p.createdAt.toLocaleString("zh-TW")}
              </span>
            </div>
            {p.status === "REJECTED" && p.reviewNote && (
              <p className="text-sm text-[#ff6b6b]">
                退回原因：{p.reviewNote}
              </p>
            )}
            <div className="flex gap-4 text-sm">
              {p.status !== "APPROVED" && (
                <Link
                  href={`/problems/proposals/${p.id}/edit`}
                  className="text-blue hover:underline"
                >
                  編輯
                </Link>
              )}
              {p.status === "APPROVED" && p.approvedProblemId && (
                <Link
                  href={`/problems/${p.approvedProblemId}`}
                  className="text-blue hover:underline"
                >
                  查看題目 →
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
