import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { recognitionQuestionSchema } from "@/lib/recognitionSchema";

async function requireAdmin() {
  const session = await getSession();
  return session?.role === "ADMIN" ? session : null;
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) {
    return Response.json({ error: "需要管理員權限" }, { status: 403 });
  }
  const { id } = await params;
  const questionId = Number(id);
  if (!Number.isInteger(questionId)) {
    return Response.json({ error: "無效的題目 ID" }, { status: 400 });
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

  await prisma.recognitionQuestion
    .update({
      where: { id: questionId },
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
    })
    .catch(() => null);
  return Response.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) {
    return Response.json({ error: "需要管理員權限" }, { status: 403 });
  }
  const { id } = await params;
  await prisma.recognitionQuestion
    .delete({ where: { id: Number(id) } })
    .catch(() => null);
  return Response.json({ ok: true });
}