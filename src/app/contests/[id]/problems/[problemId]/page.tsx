import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import {
  assertContestProblemAccess,
  getContestPhase,
  parseAllowedLanguages,
} from "@/lib/contest";
import QuestionHeader from "@/components/QuestionHeader";
import StatementCard from "@/components/StatementCard";
import SampleCases from "@/components/SampleCases";
import CodeBlock from "@/components/CodeBlock";
import ContestStatusBadge from "@/components/ContestStatusBadge";
import ContestCountdown from "@/components/ContestCountdown";
import SubmitPanel from "@/components/SubmitPanel";
import RecognitionAnswerPanel from "@/components/RecognitionAnswerPanel";

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
    omit: { pdfData: true },
    include: {
      testCases: {
        where: { isSample: true },
        orderBy: [{ order: "asc" }, { id: "asc" }],
      },
    },
  });
  if (!problem) notFound();
  const isRecognition = problem.type === "RECOGNITION";

  const [contestProblem, acceptedSub] = await Promise.all([
    prisma.contestProblem.findUnique({
      where: { contestId_problemId: { contestId, problemId } },
    }),
    session
      ? prisma.submission.findFirst({
          where: { userId: session.userId, problemId: problem.id, status: "AC" },
          select: { id: true },
        })
      : Promise.resolve(null),
  ]);
  const accepted = acceptedSub !== null;

  const phase = getContestPhase(contest);
  const options = isRecognition ? JSON.parse(problem.options ?? "[]") : [];

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
          contestId={contest.id}
          contestTitle={contest.title}
        />
      </div>

      <QuestionHeader
        title={`${contestProblem?.label ?? ""}. ${problem.title}`}
        sub={
          isRecognition ? undefined : (
            <>
              時間限制 {problem.timeLimitMs} ms ・ 記憶體限制{" "}
              {problem.memoryLimitMb} MB
            </>
          )
        }
      />

      <StatementCard>{problem.statement}</StatementCard>

      <CodeBlock code={problem.code ?? ""} />

      <SampleCases samples={problem.testCases} />

      {isRecognition ? (
        <RecognitionAnswerPanel
          options={options}
          explanation={problem.explanation}
          answerIndex={problem.answerIndex ?? 0}
          locked={phase === "ended"}
        />
      ) : (
        <SubmitPanel
          problemId={problem.id}
          problem={{
            order: problem.order,
            title: problem.title,
            difficulty: problem.difficulty,
            timeLimitMs: problem.timeLimitMs,
            memoryLimitMb: problem.memoryLimitMb,
            accepted,
          }}
          contestId={contest.id}
          // assertContestProblemAccess 已經擋掉 upcoming，這裡只會是 running/frozen/ended
          contestPhase={phase as "running" | "frozen" | "ended"}
          allowedLanguages={parseAllowedLanguages(contest.allowedLanguages)}
        />
      )}
    </div>
  );
}
