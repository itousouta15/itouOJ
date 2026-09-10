import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import RecognitionQuiz from "@/components/RecognitionQuiz";

export const metadata: Metadata = { title: "識讀練習" };
export const dynamic = "force-dynamic";

// 卷別排序：A 卷在 B 卷前、第一場在第二場前（其餘照原順序）
const PAPER_RANK: Record<string, number> = {
  "A 卷": 0,
  "B 卷": 1,
  第一場: 0,
  第二場: 1,
};

export default async function RecognitionClusterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: rawId } = await params;
  const session = await getSession();

  const isUncategorized = rawId === "uncategorized";
  const clusterId = Number(rawId);
  if (!isUncategorized && !Number.isInteger(clusterId)) notFound();

  let cluster: { id: number; title: string; isPublic: boolean } | null = null;
  if (!isUncategorized) {
    cluster = await prisma.recognitionCluster.findUnique({
      where: { id: clusterId },
      select: { id: true, title: true, isPublic: true },
    });
    if (!cluster) notFound();
    if (!cluster.isPublic && session?.role !== "ADMIN") notFound();
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
      statement: true,
      code: true,
      options: true,
      answerIndex: true,
      explanation: true,
      paper: true,
      sourceNumber: true,
      category: true,
      order: true,
    },
  });
  if (questions.length === 0) notFound();

  const rows = [...questions].sort(
    (a, b) =>
      (PAPER_RANK[a.paper ?? ""] ?? 0) - (PAPER_RANK[b.paper ?? ""] ?? 0) ||
      (a.sourceNumber ?? 0) - (b.sourceNumber ?? 0) ||
      a.order - b.order
  );

  // 還原上次作答狀態（RecognitionAnswer；不是 Submission 紀錄）
  const latest = new Map<number, { selectedIndex: number; isCorrect: boolean }>();
  if (session) {
    const prevAnswers = await prisma.recognitionAnswer.findMany({
      where: {
        userId: session.userId,
        problemId: { in: rows.map((q) => q.id) },
      },
      select: { problemId: true, selectedIndex: true, isCorrect: true },
    });
    for (const a of prevAnswers) {
      latest.set(a.problemId, {
        selectedIndex: a.selectedIndex,
        isCorrect: a.isCorrect,
      });
    }
  }

  const quizQuestions = rows.map((q) => {
    const prev = latest.get(q.id);
    return {
      id: q.id,
      title: q.title,
      statement: q.statement,
      code: q.code,
      options: JSON.parse(q.options ?? "[]") as string[],
      answerIndex: q.answerIndex ?? 0,
      explanation: q.explanation,
      paper: q.paper?.trim() || null,
      sourceNumber: q.sourceNumber,
      category: q.category,
      initialStatus: prev
        ? prev.isCorrect
          ? ("AC" as const)
          : ("WA" as const)
        : null,
      initialPicked: prev ? prev.selectedIndex : null,
    };
  });

  return (
    <RecognitionQuiz
      questions={quizQuestions}
      loggedIn={!!session}
      clusterLabel={cluster?.title ?? "未分類"}
      backHref="/recognition"
    />
  );
}
