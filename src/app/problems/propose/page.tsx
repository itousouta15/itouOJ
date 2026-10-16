import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import ProblemProposalForm from "@/components/ProblemProposalForm";

export const metadata: Metadata = { title: "申請出題" };

export default async function ProposeProblemPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const tags = await prisma.tag.findMany({ orderBy: { name: "asc" } });

  return (
    <div>
      <h1 className="mb-4 page-title">申請出題</h1>
      <ProblemProposalForm tags={tags} />
    </div>
  );
}
