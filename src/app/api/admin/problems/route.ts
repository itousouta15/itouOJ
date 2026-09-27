import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { problemSchema } from "@/lib/problemSchema";
import { pdfUpdateData, PdfUploadError } from "@/lib/problemPdf";
import { resolveAuthorId } from "@/lib/problemAuthor";
import { nextProblemCode } from "@/lib/problemCode";

export async function POST(request: Request) {
  const session = await getSession();
  if (session?.role !== "ADMIN") {
    return Response.json({ error: "需要管理員權限" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = problemSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }
  const {
    testCases,
    subtasks,
    tagIds,
    pdfUpload,
    type,
    code,
    options,
    answerIndex,
    explanation,
    paper,
    sourceNumber,
    category,
    authorUsername,
    ...base
  } = parsed.data;

  let pdf;
  try {
    pdf = pdfUpdateData(pdfUpload);
  } catch (err) {
    if (err instanceof PdfUploadError) {
      return Response.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }

  const author = await resolveAuthorId(authorUsername);
  if ("error" in author) {
    return Response.json({ error: author.error }, { status: 400 });
  }

  // The unique (type, problemCode) constraint serializes concurrent admin creates.
  // Retry a conflicting allocation rather than returning a spurious server error.
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const problem = await prisma.$transaction(async (tx) => {
        if (type === "RECOGNITION") {
          // 識別題沿用整數 order（不給代碼），挑目前最大的 +1。
          const last = await tx.problem.findFirst({
            where: { type },
            orderBy: { order: "desc" },
            select: { order: true },
          });
          return tx.problem.create({
            data: {
              ...base,
              type,
              ...pdf,
              code: code ?? null,
              options: options ? JSON.stringify(options) : null,
              answerIndex: answerIndex ?? null,
              explanation: explanation?.trim() || null,
              paper: paper?.trim() || null,
              sourceNumber: sourceNumber ?? null,
              category: category?.trim() || null,
              order: (last?.order ?? -1) + 1,
            },
          });
        }

        // 實作題配發「一碼英文＋三碼數字」代碼。
        const last = await tx.problem.findFirst({
          where: { type },
          orderBy: { problemCode: "desc" },
          select: { problemCode: true },
        });
        const problemCode = nextProblemCode(last?.problemCode);

        const created = await tx.problem.create({
          data: {
            ...base,
            type,
            ...pdf,
            authorId: author.authorId,
            problemCode,
            subtasks: {
              create: subtasks.map((s, i) => ({
                order: i + 1,
                points: s.points,
                checkMode: s.checkMode,
              })),
            },
            tags: { create: tagIds.map((tagId) => ({ tagId })) },
          },
          include: { subtasks: { orderBy: { order: "asc" } } },
        });
        await tx.testCase.createMany({
          data: testCases.map((tc, i) => ({
            problemId: created.id,
            input: tc.input,
            output: tc.output,
            isSample: tc.isSample,
            order: i + 1,
            subtaskId:
              tc.subtaskIndex != null ? created.subtasks[tc.subtaskIndex].id : null,
          })),
        });
        return created;
      });
      return Response.json({ id: problem.id });
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "P2002" &&
        attempt < 2
      ) {
        continue;
      }
      throw error;
    }
  }

  return Response.json({ error: "題目建立失敗，請再試一次" }, { status: 409 });
}
