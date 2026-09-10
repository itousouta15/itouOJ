import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { recognitionQuestionSchema } from "@/lib/recognitionSchema";

export async function POST(request: Request) {
  const session = await getSession();
  if (session?.role !== "ADMIN") {
    return Response.json({ error: "需要管理員權限" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = recognitionQuestionSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  if (parsed.data.answerIndex >= parsed.data.options.length) {
    return Response.json({ error: "正確答案超出選項範圍" }, { status: 400 });
  }

  const question = await prisma.recognitionQuestion.create({
    data: {
      code: parsed.data.code,
      question: parsed.data.question,
      category: parsed.data.category,
      options: JSON.stringify(parsed.data.options),
      answerIndex: parsed.data.answerIndex,
      explanation: parsed.data.explanation || null,
      isPublic: parsed.data.isPublic,
      order: parsed.data.order,
    },
  });
  return Response.json({ id: question.id });
}