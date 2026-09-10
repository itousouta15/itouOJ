import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import RecognitionQuestionForm from "@/components/RecognitionQuestionForm";

export const metadata: Metadata = { title: "編輯程式識別題" };
export const dynamic = "force-dynamic";

export default async function EditRecognitionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (session?.role !== "ADMIN") redirect("/");

  const { id } = await params;
  const questionId = Number(id);
  if (!Number.isInteger(questionId)) notFound();

  const question = await prisma.recognitionQuestion.findUnique({
    where: { id: questionId },
  });
  if (!question) notFound();

  return (
    <div>
      <h1 className="mb-4 page-title">編輯程式識別題</h1>
      <RecognitionQuestionForm
        initial={{
          id: question.id,
          code: question.code,
          question: question.question,
          category: question.category,
          options: JSON.parse(question.options) as string[],
          answerIndex: question.answerIndex,
          explanation: question.explanation ?? "",
          isPublic: question.isPublic,
          order: question.order,
        }}
      />
    </div>
  );
}