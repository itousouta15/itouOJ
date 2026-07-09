import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import Markdown from "@/components/Markdown";
import DifficultyBadge from "@/components/DifficultyBadge";
import SubmitPanel from "@/components/SubmitPanel";

export const dynamic = "force-dynamic";

export default async function ProblemPage({
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
    include: {
      testCases: {
        where: { isSample: true },
        orderBy: [{ order: "asc" }, { id: "asc" }],
      },
    },
  });
  if (!problem || (!problem.isPublic && session?.role !== "ADMIN")) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold">
            #{problem.id}. {problem.title}
          </h1>
          <DifficultyBadge difficulty={problem.difficulty} />
          {session?.role === "ADMIN" && (
            <Link
              href={`/admin/problems/${problem.id}/edit`}
              className="text-sm text-blue-600 hover:underline"
            >
              編輯題目
            </Link>
          )}
        </div>
        <p className="mt-1 text-sm text-zinc-500">
          時間限制 {problem.timeLimitMs} ms ・ 記憶體限制{" "}
          {problem.memoryLimitMb} MB
        </p>
      </div>

      <div className="card p-6">
        <Markdown>{problem.statement}</Markdown>
      </div>

      {problem.testCases.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">範例測資</h2>
          {problem.testCases.map((tc, i) => (
            <div key={tc.id} className="grid gap-4 sm:grid-cols-2">
              <div className="card p-4">
                <p className="mb-2 text-xs font-semibold text-zinc-500">
                  範例輸入 {i + 1}
                </p>
                <pre className="overflow-x-auto rounded bg-zinc-50 p-3 font-mono text-sm whitespace-pre-wrap">
                  {tc.input}
                </pre>
              </div>
              <div className="card p-4">
                <p className="mb-2 text-xs font-semibold text-zinc-500">
                  範例輸出 {i + 1}
                </p>
                <pre className="overflow-x-auto rounded bg-zinc-50 p-3 font-mono text-sm whitespace-pre-wrap">
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
        <div className="card p-6 text-center text-sm text-zinc-500">
          請先
          <Link href="/login" className="mx-1 text-blue-600 hover:underline">
            登入
          </Link>
          後再提交程式碼
        </div>
      )}
    </div>
  );
}
