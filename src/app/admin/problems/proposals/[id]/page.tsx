import Link from "next/link";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import Markdown from "@/components/Markdown";
import DifficultyBadge from "@/components/DifficultyBadge";
import ProposalStatusBadge from "@/components/ProposalStatusBadge";
import ProposalReviewActions from "@/components/ProposalReviewActions";

export const metadata: Metadata = { title: "審核出題申請" };
export const dynamic = "force-dynamic";

export default async function AdminProposalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (session?.role !== "ADMIN") redirect("/");

  const { id } = await params;
  const proposal = await prisma.problemProposal.findUnique({
    where: { id: Number(id) },
    include: {
      author: { select: { username: true } },
      testCases: { orderBy: [{ order: "asc" }, { id: "asc" }] },
    },
  });
  if (!proposal) notFound();

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="page-title">{proposal.title}</h1>
          <DifficultyBadge difficulty={proposal.difficulty} />
          <ProposalStatusBadge status={proposal.status} />
        </div>
        <p className="mt-1 text-sm text-dim">
          投稿人 {proposal.author.username} ・ 時間限制{" "}
          {proposal.timeLimitMs} ms ・ 記憶體限制 {proposal.memoryLimitMb} MB
        </p>
      </div>

      <div className="card p-6">
        <Markdown>{proposal.statement}</Markdown>
      </div>

      {proposal.testCases.length > 0 && (
        <div className="space-y-4">
          <h2 className="section-title">測資（{proposal.testCases.length} 筆）</h2>
          {proposal.testCases.map((tc, i) => (
            <div key={tc.id} className="grid gap-4 sm:grid-cols-2">
              <div className="card p-4">
                <p className="mb-2 text-xs font-semibold text-dim">
                  輸入 {i + 1}
                  {tc.isSample ? "（範例）" : ""}
                </p>
                <pre className="overflow-x-auto rounded bg-inset p-3 font-mono text-sm whitespace-pre-wrap">
                  {tc.input}
                </pre>
              </div>
              <div className="card p-4">
                <p className="mb-2 text-xs font-semibold text-dim">
                  期望輸出 {i + 1}
                </p>
                <pre className="overflow-x-auto rounded bg-inset p-3 font-mono text-sm whitespace-pre-wrap">
                  {tc.output}
                </pre>
              </div>
            </div>
          ))}
        </div>
      )}

      {proposal.status === "APPROVED" ? (
        <div className="card p-6 text-sm">
          已核准，建立為{" "}
          <Link
            href={`/problems/${proposal.approvedProblemId}`}
            className="text-blue hover:underline"
          >
            #{proposal.approvedProblemId}
          </Link>
        </div>
      ) : (
        <ProposalReviewActions proposalId={proposal.id} />
      )}
    </div>
  );
}
