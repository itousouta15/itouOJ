import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { getSession, type Session } from "@/lib/auth";
import { assertContestProblemAccess } from "@/lib/contest";
import { LANGUAGE_KEYS } from "@/lib/languages";

const keySchema = z.object({
  problemId: z.coerce.number().int().positive(),
  language: z.enum(LANGUAGE_KEYS as [string, ...string[]]),
  contestId: z.coerce.number().int().positive().optional(),
});
const saveSchema = keySchema.extend({
  code: z.string().max(65536, "程式碼過長"),
  revision: z.number().int().positive().nullable(),
});
const headers = { "Cache-Control": "private, no-store" };

async function checkAccess(
  session: Session,
  key: z.infer<typeof keySchema>
) {
  const problem = await prisma.problem.findUnique({
    where: { id: key.problemId },
    select: { type: true, isPublic: true },
  });
  if (!problem || problem.type !== "PROGRAMMING") {
    return Response.json({ error: "題目不存在" }, { status: 404, headers });
  }
  if (key.contestId !== undefined) {
    const access = await assertContestProblemAccess(
      session, key.contestId, key.problemId, key.language
    );
    if (!access.ok) {
      return Response.json({ error: access.error }, { status: access.status, headers });
    }
  } else if (!problem.isPublic && session.role !== "ADMIN") {
    return Response.json({ error: "題目不存在" }, { status: 404, headers });
  }
  return null;
}

function draftResponse(draft: { code: string; revision: number } | null, status = 200) {
  return Response.json({ draft }, { status, headers });
}

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return Response.json({ error: "請先登入" }, { status: 401, headers });

  const parsed = keySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!parsed.success) return Response.json({ error: "草稿參數錯誤" }, { status: 400, headers });
  const key = parsed.data;
  const denied = await checkAccess(session, key);
  if (denied) return denied;

  const draft = await prisma.codeDraft.findUnique({
    where: {
      userId_problemId_language: {
        userId: session.userId, problemId: key.problemId, language: key.language,
      },
    },
    select: { code: true, revision: true },
  });
  return draftResponse(draft);
}

export async function PUT(request: Request) {
  const session = await getSession();
  if (!session) return Response.json({ error: "請先登入" }, { status: 401, headers });

  const parsed = saveSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0].message }, { status: 400, headers });
  }
  const { problemId, language, contestId, code, revision } = parsed.data;
  const denied = await checkAccess(session, { problemId, language, contestId });
  if (denied) return denied;

  const where = { userId: session.userId, problemId, language };
  if (revision === null) {
    try {
      const draft = await prisma.codeDraft.create({
        data: { ...where, code },
        select: { code: true, revision: true },
      });
      return draftResponse(draft);
    } catch (error) {
      // Two devices can both try to create the first draft at once.
      if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")) {
        throw error;
      }
    }
  } else {
    const changed = await prisma.codeDraft.updateMany({
      where: { ...where, revision },
      data: { code, revision: { increment: 1 } },
    });
    if (changed.count === 1) return draftResponse({ code, revision: revision + 1 });
  }

  const current = await prisma.codeDraft.findUnique({
    where: { userId_problemId_language: where },
    select: { code: true, revision: true },
  });
  return draftResponse(current, 409);
}
