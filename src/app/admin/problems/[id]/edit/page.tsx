import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import ProblemForm from "@/components/ProblemForm";

export const metadata: Metadata = { title: "編輯題目" };
export const dynamic = "force-dynamic";

export default async function EditProblemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (session?.role !== "ADMIN") redirect("/");

  const { id } = await params;
  const problem = await prisma.problem.findUnique({
    where: { id: Number(id) },
    include: { testCases: { orderBy: [{ order: "asc" }, { id: "asc" }] } },
  });
  if (!problem) notFound();

  return (
    <div>
      <h1 className="mb-4 page-title">
        編輯題目 #{problem.id}
      </h1>
      <ProblemForm
        initial={{
          id: problem.id,
          title: problem.title,
          statement: problem.statement,
          difficulty: problem.difficulty,
          timeLimitMs: problem.timeLimitMs,
          memoryLimitMb: problem.memoryLimitMb,
          isPublic: problem.isPublic,
          testCases: problem.testCases.map((tc) => ({
            input: tc.input,
            output: tc.output,
            isSample: tc.isSample,
          })),
        }}
      />
    </div>
  );
}
