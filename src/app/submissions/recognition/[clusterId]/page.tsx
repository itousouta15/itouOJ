import Link from "next/link";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = { title: "識讀練習紀錄" };
export const dynamic = "force-dynamic";

// 卷別排序：A 卷在 B 卷前、第一場在第二場前（其餘照原順序）
const PAPER_RANK: Record<string, number> = {
  "A 卷": 0,
  "B 卷": 1,
  第一場: 0,
  第二場: 1,
};

export default async function RecognitionClusterRecordsPage({
  params,
}: {
  params: Promise<{ clusterId: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login?next=/submissions");

  const { clusterId: rawId } = await params;
  const isUncategorized = rawId === "uncategorized";
  const clusterId = Number(rawId);
  if (!isUncategorized && !Number.isInteger(clusterId)) notFound();

  let cluster: { id: number; title: string } | null = null;
  if (!isUncategorized) {
    cluster = await prisma.recognitionCluster.findUnique({
      where: { id: clusterId },
      select: { id: true, title: true },
    });
    if (!cluster) notFound();
  }

  const questions = await prisma.problem.findMany({
    where: {
      type: "RECOGNITION",
      isPublic: true,
      ...(isUncategorized ? { clusterId: null } : { clusterId }),
    },
    orderBy: [{ order: "asc" }, { id: "asc" }],
    select: {
      id: true,
      title: true,
      options: true,
      answerIndex: true,
      paper: true,
      sourceNumber: true,
      order: true,
    },
  });
  if (questions.length === 0) notFound();
  questions.sort(
    (a, b) =>
      (PAPER_RANK[a.paper ?? ""] ?? 0) - (PAPER_RANK[b.paper ?? ""] ?? 0) ||
      (a.sourceNumber ?? 0) - (b.sourceNumber ?? 0) ||
      a.order - b.order
  );

  const answers = await prisma.recognitionAnswer.findMany({
    where: {
      userId: session.userId,
      problemId: { in: questions.map((q) => q.id) },
    },
    select: {
      problemId: true,
      selectedIndex: true,
      isCorrect: true,
      updatedAt: true,
    },
  });
  const answerByProblem = new Map(
    answers.map((a) => [a.problemId, a])
  );
  const solvedCount = answers.filter((a) => a.isCorrect).length;

  const letter = (i: number) => String.fromCharCode(65 + i);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-4">
        <h1 className="page-title">識讀紀錄：{cluster?.title ?? "未分類"}</h1>
        <Link href="/submissions" className="text-sm text-blue hover:underline">
          ← 回紀錄
        </Link>
      </div>
      <p className="mono text-sm text-dim">
        答對 {solvedCount} / {questions.length}
      </p>

      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="table-head w-32">題號</th>
              <th className="table-head">題目</th>
              <th className="table-head">你的答案</th>
              <th className="table-head">正確答案</th>
              <th className="table-head w-20">結果</th>
              <th className="table-head w-40">作答時間</th>
            </tr>
          </thead>
          <tbody>
            {questions.map((q) => {
              const a = answerByProblem.get(q.id);
              const options = JSON.parse(q.options ?? "[]") as string[];
              const number = [
                q.paper,
                q.sourceNumber != null ? `第 ${q.sourceNumber} 題` : null,
              ]
                .filter(Boolean)
                .join(" ");
              return (
                <tr key={q.id} className="hover:bg-panel2">
                  <td className="table-cell text-dim">{number || "—"}</td>
                  <td className="table-cell">
                    <Link
                      href={`/recognition/q/${q.id}`}
                      className="font-medium text-blue hover:underline"
                    >
                      {q.title}
                    </Link>
                  </td>
                  <td className="table-cell">
                    {a ? (
                      <>
                        <span className="font-mono">{letter(a.selectedIndex)}.</span>{" "}
                        <span className="font-mono whitespace-pre-wrap">
                          {options[a.selectedIndex]}
                        </span>
                      </>
                    ) : (
                      <span className="text-mute">未作答</span>
                    )}
                  </td>
                  <td className="table-cell">
                    <span className="font-mono">
                      {letter(q.answerIndex ?? 0)}.
                    </span>{" "}
                    <span className="font-mono whitespace-pre-wrap">
                      {options[q.answerIndex ?? 0]}
                    </span>
                  </td>
                  <td className="table-cell">
                    {!a ? (
                      <span className="text-mute">—</span>
                    ) : a.isCorrect ? (
                      <span className="font-semibold text-[var(--green)]">✓</span>
                    ) : (
                      <span className="font-semibold text-[#ff6b6b]">✗</span>
                    )}
                  </td>
                  <td className="table-cell text-dim">
                    {a
                      ? a.updatedAt.toLocaleString("zh-TW", {
                          timeZone: "Asia/Taipei",
                          hour12: false,
                        })
                      : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}