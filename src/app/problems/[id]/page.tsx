import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import DifficultyBadge from "@/components/DifficultyBadge";
import QuestionHeader from "@/components/QuestionHeader";
import StatementCard from "@/components/StatementCard";
import SampleCases from "@/components/SampleCases";
import SubmitPanel from "@/components/SubmitPanel";
import ProblemDiscussion from "@/components/ProblemDiscussion";
import { markdownSnippet } from "@/lib/textSnippet";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const problemOrder = Number(id);
  if (!Number.isInteger(problemOrder)) return {};

  // 私人題目不給標題/摘要——頁面本身對非管理員會 404，這裡也不能讓
  // generateMetadata 把題名先洩漏到 <head> 裡。
  const problem = await prisma.problem.findFirst({
    where: { order: problemOrder, type: "PROGRAMMING" },
    select: { title: true, statement: true, isPublic: true },
  });
  if (!problem || !problem.isPublic) return {};

  return {
    title: `#${problemOrder}. ${problem.title}`,
    description: markdownSnippet(problem.statement),
  };
}

export default async function ProblemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const problemOrder = Number(id);
  if (!Number.isInteger(problemOrder)) notFound();

  const session = await getSession();
  const [problem, acceptedSub] = await Promise.all([
    prisma.problem.findFirst({
      where: { order: problemOrder, type: "PROGRAMMING" },
      omit: { pdfData: true },
      include: {
        testCases: {
          where: { isSample: true },
          orderBy: [{ order: "asc" }, { id: "asc" }],
        },
        subtasks: { orderBy: { order: "asc" } },
        tags: { include: { tag: true } },
      },
    }),
    session
      ? prisma.submission.findFirst({
          where: {
            userId: session.userId,
            problem: { order: problemOrder, type: "PROGRAMMING" },
            status: "AC",
          },
          select: { id: true },
        })
      : Promise.resolve(null),
  ]);
  if (!problem || (!problem.isPublic && session?.role !== "ADMIN")) {
    notFound();
  }
  const accepted = acceptedSub !== null;

  return (
    <div className="space-y-6">
      <QuestionHeader
        title={`#${problem.order}. ${problem.title}`}
        badges={<DifficultyBadge difficulty={problem.difficulty} />}
        tags={problem.tags.map((pt) => ({ id: pt.tagId, name: pt.tag.name }))}
        adminHref={
          session?.role === "ADMIN"
            ? `/admin/problems/${problem.id}/edit`
            : undefined
        }
        sub={
          <>
            時間限制 {problem.timeLimitMs} ms ・ 記憶體限制{" "}
            {problem.memoryLimitMb} MB
          </>
        }
      />

      <StatementCard>{problem.statement}</StatementCard>

      {problem.subtasks.length > 0 && (
        <div>
          <h2 className="mb-3 section-title">配分方式</h2>
          <div className="card overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-head w-20">子題</th>
                  <th className="table-head w-24 text-right">配分</th>
                  <th className="table-head">比對方式</th>
                </tr>
              </thead>
              <tbody>
                {problem.subtasks.map((s) => (
                  <tr key={s.id}>
                    <td className="table-cell">子題 {s.order}</td>
                    <td className="table-cell text-right">{s.points} 分</td>
                    <td className="table-cell text-dim">
                      {s.checkMode === "firstLine"
                        ? "只看輸出第一行是否正確"
                        : "完整輸出需完全正確"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <SampleCases samples={problem.testCases} />

      {session ? (
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
        />
      ) : (
        <div className="card p-6 text-center text-sm text-dim">
          請先
          <Link href="/login" className="mx-1 text-blue hover:underline">
            登入
          </Link>
          後再提交程式碼
        </div>
      )}

      <div>
        <h2 className="mb-3 section-title">討論與題解</h2>
        <ProblemDiscussion problemId={problem.id} loggedIn={!!session} />
      </div>
    </div>
  );
}
