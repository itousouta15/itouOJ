import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { enqueueSubmission } from "@/lib/judge";
import { LANGUAGE_KEYS } from "@/lib/languages";
import { assertContestProblemAccess } from "@/lib/contest";

const schema = z.object({
  problemId: z.number().int().positive(),
  language: z.enum(LANGUAGE_KEYS as [string, ...string[]]),
  code: z.string().min(1, "程式碼不能是空的").max(65536, "程式碼過長"),
  contestId: z.number().int().positive().optional(),
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
  const { problemId, language, code, contestId } = parsed.data;

  if (contestId !== undefined) {
    const access = await assertContestProblemAccess(session, contestId, problemId);
    if (!access.ok) {
      return Response.json({ error: access.error }, { status: access.status });
    }
  } else {
    const problem = await prisma.problem.findUnique({ where: { id: problemId } });
    if (!problem || (!problem.isPublic && session.role !== "ADMIN")) {
      return Response.json({ error: "題目不存在" }, { status: 404 });
    }
  }

  const submission = await prisma.submission.create({
    data: {
      userId: session.userId,
      problemId,
      language,
      code,
      status: "PENDING",
      contestId: contestId ?? null,
    },
  });

  enqueueSubmission(submission.id);
  return Response.json({ id: submission.id });
}
