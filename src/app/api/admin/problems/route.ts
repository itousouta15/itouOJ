import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { problemSchema } from "@/lib/problemSchema";
import { pdfUpdateData, PdfUploadError } from "@/lib/problemPdf";

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
  const { testCases, subtasks, tagIds, pdfUpload, ...fields } = parsed.data;

  let pdf;
  try {
    pdf = pdfUpdateData(pdfUpload);
  } catch (err) {
    if (err instanceof PdfUploadError) {
      return Response.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }

  const last = await prisma.problem.findFirst({
    orderBy: { order: "desc" },
    select: { order: true },
  });

  const problem = await prisma.$transaction(async (tx) => {
    const created = await tx.problem.create({
      data: {
        ...fields,
        ...pdf,
        order: (last?.order ?? 0) + 1,
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
}
