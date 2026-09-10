import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { RECOGNITION_CATEGORIES } from "@/lib/recognitionSchema";
import RecognitionPractice from "@/components/RecognitionPractice";

export const metadata: Metadata = {
  title: "程式識別練習",
  description: "看一段 C / Python 程式，判斷它會輸出什麼、或在做什麼。",
};
export const dynamic = "force-dynamic";

export default async function RecognitionPracticePage() {
  const questions = await prisma.recognitionQuestion.findMany({
    where: { isPublic: true },
    orderBy: [{ order: "asc" }, { id: "asc" }],
  });

  const rows = questions.map((q) => ({
    id: q.id,
    code: q.code,
    question: q.question,
    category: q.category,
    options: JSON.parse(q.options) as string[],
    answerIndex: q.answerIndex,
    explanation: q.explanation ?? "",
    order: q.order,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">程式識別練習</h1>
        <p className="mt-1 text-sm text-dim">
          看一段程式，判斷它會輸出什麼、或這支程式在做什麼。選完立刻對答案。
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="card p-10 text-center text-mute">
          還沒有練習題，等管理員上架中。
        </div>
      ) : (
        <RecognitionPractice
          questions={rows}
          categories={["全部", ...RECOGNITION_CATEGORIES]}
        />
      )}
    </div>
  );
}