import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import ProblemProposalForm from "@/components/ProblemProposalForm";

export const metadata: Metadata = { title: "編輯出題申請" };
export const dynamic = "force-dynamic";

export default async function EditProposalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  const proposal = await prisma.problemProposal.findUnique({
    where: { id: Number(id) },
    include: { testCases: { orderBy: [{ order: "asc" }, { id: "asc" }] } },
  });
  if (
    !proposal ||
    proposal.authorId !== session.userId ||
    proposal.status === "APPROVED"
  ) {
    notFound();
  }

  return (
    <div>
      <h1 className="mb-4 page-title">編輯出題申請</h1>
      <ProblemProposalForm
        initial={{
          id: proposal.id,
          title: proposal.title,
          statement: proposal.statement,
          difficulty: proposal.difficulty,
          timeLimitMs: proposal.timeLimitMs,
          memoryLimitMb: proposal.memoryLimitMb,
          testCases: proposal.testCases.map((tc) => ({
            input: tc.input,
            output: tc.output,
            isSample: tc.isSample,
          })),
        }}
      />
    </div>
  );
}
