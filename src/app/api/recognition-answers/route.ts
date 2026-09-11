import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { nextRecognitionReview } from "@/lib/recognitionReview";

const schema = z.object({
  problemId: z.number().int().positive(),
  selectedIndex: z.number().int().min(0),
});

const deleteSchema = z.object({
  problemId: z.number().int().positive(),
});

// 識別題練習作答：只更新 RecognitionAnswer（每位使用者每題最新一次），
// 不建立 Submission、不進提交紀錄。回傳這次是否答對，前端據此顯示結果。
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "請先登入" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }
  const { problemId, selectedIndex } = parsed.data;

  const problem = await prisma.problem.findUnique({
    where: { id: problemId },
    select: { type: true, isPublic: true, options: true, answerIndex: true },
  });
  if (!problem || problem.type !== "RECOGNITION") {
    return Response.json({ error: "題目不存在" }, { status: 404 });
  }
  if (!problem.isPublic && session.role !== "ADMIN") {
    return Response.json({ error: "題目不存在" }, { status: 404 });
  }

  let options: string[];
  try {
    options = JSON.parse(problem.options ?? "[]");
  } catch {
    options = [];
  }
  if (selectedIndex < 0 || selectedIndex >= options.length) {
    return Response.json({ error: "選項超出範圍" }, { status: 400 });
  }

  const isCorrect = selectedIndex === problem.answerIndex;
  await prisma.$transaction(async (tx) => {
    await tx.recognitionAnswer.upsert({
      where: { userId_problemId: { userId: session.userId, problemId } },
      create: { userId: session.userId, problemId, selectedIndex, isCorrect },
      update: { selectedIndex, isCorrect },
    });
    const current = await tx.recognitionReview.findUnique({
      where: { userId_problemId: { userId: session.userId, problemId } },
      select: { intervalStep: true },
    });
    const review = nextRecognitionReview(isCorrect, current?.intervalStep ?? null);
    await tx.recognitionReview.upsert({
      where: { userId_problemId: { userId: session.userId, problemId } },
      create: { userId: session.userId, problemId, ...review },
      update: review,
    });
  });

  return Response.json({ correct: isCorrect });
}

// 「重新作答」：清掉這題的作答紀錄。沒有這支 API 的話，前端只是把畫面
// 恢復成未作答，重新整理後 RecognitionAnswer 又會把舊答案拉回來。
export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "請先登入" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = deleteSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  // deleteMany：紀錄不存在時也視為成功（重複按重新作答不該報錯）
  await prisma.recognitionAnswer.deleteMany({
    where: { userId: session.userId, problemId: parsed.data.problemId },
  });

  return Response.json({ ok: true });
}
