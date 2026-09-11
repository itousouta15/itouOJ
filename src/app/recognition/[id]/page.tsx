import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import RecognitionQuiz from "@/components/RecognitionQuiz";
import RecognitionCredit from "@/components/RecognitionCredit";
import { shuffledOrder } from "@/lib/shuffle";

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
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { id: rawId } = await params;
  const { q } = await searchParams;
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
    const options = JSON.parse(q.options ?? "[]") as string[];
    return {
      id: q.id,
      title: q.title,
      statement: q.statement,
      code: q.code,
      options,
      // 每次載入重新洗牌；displayOrder[i] 是畫面第 i 個選項的原始索引
      displayOrder: shuffledOrder(options.length),
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

  // ?q=12 讓重新整理（或分享連結）回到同一題；超出範圍就從第 1 題開始
  const qNum = Number(q);
  const initialIndex =
    Number.isInteger(qNum) && qNum >= 1 && qNum <= quizQuestions.length
      ? qNum - 1
      : 0;

  return (
    <div className="space-y-5">
      <RecognitionQuiz
        questions={quizQuestions}
        loggedIn={!!session}
        clusterLabel={cluster?.title ?? "未分類"}
        backHref="/recognition"
        initialIndex={initialIndex}
      />
      <RecognitionCredit />
    </div>
  );
}
