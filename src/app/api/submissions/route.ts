import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { enqueueSubmission } from "@/lib/judge";
import { LANGUAGE_KEYS } from "@/lib/languages";

const schema = z.object({
  problemId: z.number().int().positive(),
  language: z.enum(LANGUAGE_KEYS as [string, ...string[]]),
  code: z.string().min(1, "程式碼不能是空的").max(65536, "程式碼過長"),
});

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
  const { problemId, language, code } = parsed.data;

  const problem = await prisma.problem.findUnique({ where: { id: problemId } });
  if (!problem || (!problem.isPublic && session.role !== "ADMIN")) {
    return Response.json({ error: "題目不存在" }, { status: 404 });
  }

  const submission = await prisma.submission.create({
    data: {
      userId: session.userId,
      problemId,
      language,
      code,
      status: "PENDING",
    },
  });

  enqueueSubmission(submission.id);
  return Response.json({ id: submission.id });
}
