import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import Markdown from "@/components/Markdown";
import DifficultyBadge from "@/components/DifficultyBadge";
import TagBadge from "@/components/TagBadge";
import SubmitPanel from "@/components/SubmitPanel";

export const dynamic = "force-dynamic";

export default async function ProblemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const problemOrder = Number(id);
  if (!Number.isInteger(problemOrder)) notFound();

  const session = await getSession();
  const problem = await prisma.problem.findUnique({
    where: { order: problemOrder },
    include: {
      testCases: {
        where: { isSample: true },
        orderBy: [{ order: "asc" }, { id: "asc" }],
      },
      subtasks: { orderBy: { order: "asc" } },
      tags: { include: { tag: true } },
    },
  });
  if (!problem || (!problem.isPublic && session?.role !== "ADMIN")) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="page-title">
            #{problem.order}. {problem.title}
          </h1>
          <DifficultyBadge difficulty={problem.difficulty} />
          {problem.tags.map((pt) => (
            <TagBadge key={pt.tagId} name={pt.tag.name} />
          ))}
          {session?.role === "ADMIN" && (
            <Link
              href={`/admin/problems/${problem.id}/edit`}
              className="text-sm text-blue hover:underline"
            >
              編輯題目
            </Link>
          )}
        </div>
        <p className="mt-1 text-sm text-dim">
          時間限制 {problem.timeLimitMs} ms ・ 記憶體限制{" "}
          {problem.memoryLimitMb} MB
        </p>
      </div>

      <div className="card p-6">
        <Markdown>{problem.statement}</Markdown>
      </div>

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

      {problem.testCases.length > 0 && (
        <div className="space-y-4">
          <h2 className="section-title">範例測資</h2>
          {problem.testCases.map((tc, i) => (
            <div key={tc.id} className="grid gap-4 sm:grid-cols-2">
              <div className="card p-4">
                <p className="mb-2 text-xs font-semibold text-dim">
                  範例輸入 {i + 1}
                </p>
                <pre className="overflow-x-auto rounded bg-inset p-3 font-mono text-sm whitespace-pre-wrap">
                  {tc.input}
                </pre>
              </div>
              <div className="card p-4">
                <p className="mb-2 text-xs font-semibold text-dim">
                  範例輸出 {i + 1}
                </p>
                <pre className="overflow-x-auto rounded bg-inset p-3 font-mono text-sm whitespace-pre-wrap">
                  {tc.output}
                </pre>
              </div>
            </div>
          ))}
        </div>
      )}

      {session ? (
        <SubmitPanel problemId={problem.id} />
      ) : (
        <div className="card p-6 text-center text-sm text-dim">
          請先
          <Link href="/login" className="mx-1 text-blue hover:underline">
            登入
          </Link>
          後再提交程式碼
        </div>
      )}
    </div>
  );
}
