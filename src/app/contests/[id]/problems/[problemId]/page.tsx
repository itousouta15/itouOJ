import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { assertContestProblemAccess, getContestPhase } from "@/lib/contest";
import Markdown from "@/components/Markdown";
import ContestStatusBadge from "@/components/ContestStatusBadge";
import ContestCountdown from "@/components/ContestCountdown";
import SubmitPanel from "@/components/SubmitPanel";

export const dynamic = "force-dynamic";

export default async function ContestProblemPage({
  params,
}: {
  params: Promise<{ id: string; problemId: string }>;
}) {
  const { id, problemId: problemIdParam } = await params;
  const contestId = Number(id);
  const problemId = Number(problemIdParam);
  if (!Number.isInteger(contestId) || !Number.isInteger(problemId)) notFound();

  const session = await getSession();
  const access = await assertContestProblemAccess(session, contestId, problemId);
  if (!access.ok) notFound();
  const { contest, problem: baseProblem } = access;

  const problem = await prisma.problem.findUnique({
    where: { id: baseProblem.id },
    include: {
      testCases: {
        where: { isSample: true },
        orderBy: [{ order: "asc" }, { id: "asc" }],
      },
    },
  });
  if (!problem) notFound();

  const contestProblem = await prisma.contestProblem.findUnique({
    where: { contestId_problemId: { contestId, problemId } },
  });

  const phase = getContestPhase(contest);

  return (
    <div className="space-y-6">
      <div className="card flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="flex items-center gap-3">
          <Link href={`/contests/${contest.id}`} className="text-sm text-blue hover:underline">
            ← {contest.title}
          </Link>
          <ContestStatusBadge contest={contest} />
        </div>
        <ContestCountdown
          startTime={contest.startTime.toISOString()}
          endTime={contest.endTime.toISOString()}
        />
      </div>

      <div>
        <h1 className="page-title">
          {contestProblem?.label ?? ""}. {problem.title}
        </h1>
        <p className="mt-1 text-sm text-dim">
          時間限制 {problem.timeLimitMs} ms ・ 記憶體限制 {problem.memoryLimitMb} MB
        </p>
      </div>

      <div className="card p-6">
        <Markdown>{problem.statement}</Markdown>
      </div>

      {problem.testCases.length > 0 && (
        <div className="space-y-4">
          <h2 className="section-title">範例測資</h2>
          {problem.testCases.map((tc, i) => (
            <div key={tc.id} className="grid gap-4 sm:grid-cols-2">
              <div className="card p-4">
                <p className="mb-2 text-xs font-semibold text-dim">範例輸入 {i + 1}</p>
                <pre className="overflow-x-auto rounded bg-inset p-3 font-mono text-sm whitespace-pre-wrap">
                  {tc.input}
                </pre>
              </div>
              <div className="card p-4">
                <p className="mb-2 text-xs font-semibold text-dim">範例輸出 {i + 1}</p>
                <pre className="overflow-x-auto rounded bg-inset p-3 font-mono text-sm whitespace-pre-wrap">
                  {tc.output}
                </pre>
              </div>
            </div>
          ))}
        </div>
      )}

      <SubmitPanel
        problemId={problem.id}
        contestId={contest.id}
        // assertContestProblemAccess 已經擋掉 upcoming，這裡只會是 running/frozen/ended
        contestPhase={phase as "running" | "frozen" | "ended"}
      />
    </div>
  );
}
