import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import Markdown from "@/components/Markdown";
import QuestionHeader from "@/components/QuestionHeader";
import StatementCard from "@/components/StatementCard";
import CodeBlock from "@/components/CodeBlock";
import AnswerOptions from "@/components/AnswerOptions";
import CategoryBadge from "@/components/CategoryBadge";
import RecognitionCredit from "@/components/RecognitionCredit";

export const metadata: Metadata = { title: "程式識別練習" };
export const dynamic = "force-dynamic";

export default async function RecognitionQuestionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const problemId = Number(id);
  if (!Number.isInteger(problemId)) notFound();

  const session = await getSession();
  const problem = await prisma.problem.findUnique({
    where: { id: problemId },
    omit: { pdfData: true },
    include: { cluster: { select: { id: true, title: true } } },
  });
  if (
    !problem ||
    problem.type !== "RECOGNITION" ||
    (!problem.isPublic && session?.role !== "ADMIN")
  ) {
    notFound();
  }

  const options = JSON.parse(problem.options ?? "[]") as string[];
  const backHref = problem.cluster
    ? `/recognition/${problem.cluster.id}`
    : "/recognition/uncategorized";
  const meta = [
    problem.paper,
    problem.sourceNumber != null ? `原題號 ${problem.sourceNumber}` : null,
    problem.cluster?.title,
  ]
    .filter(Boolean)
    .join(" ・ ");

  return (
    <div className="space-y-6">
      <QuestionHeader
        title={problem.title}
        badges={<CategoryBadge category={problem.category} />}
        sub={
          <>
            <Link href={backHref} className="text-blue hover:underline">
              ← 回練習頁
            </Link>
            {meta && <span className="ml-3 text-dim">{meta}</span>}
          </>
        }
      />

      <StatementCard>{problem.statement}</StatementCard>

      <CodeBlock code={problem.code ?? ""} language={problem.category} />

      <div className="card space-y-2 p-5">
        <AnswerOptions
          options={options}
          answerIndex={problem.answerIndex ?? 0}
          picked={problem.answerIndex ?? 0}
          revealed
        />
      </div>

      {problem.explanation && (
        <div className="card p-5">
          <p className="mb-2 text-xs font-semibold text-dim">解析</p>
          <Markdown className="prose-compact">{problem.explanation}</Markdown>
        </div>
      )}

      <RecognitionCredit />
    </div>
  );
}
