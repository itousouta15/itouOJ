import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { LANGUAGES } from "@/lib/languages";
import { assertContestProblemAccess } from "@/lib/contest";
import { enforceRateLimit } from "@/lib/rateLimit";
import { terminalRequest } from "@/lib/terminal";

export const runtime = "nodejs";

const schema = z.object({
  problemId: z.number().int().positive(),
  contestId: z.number().int().positive().optional(),
  language: z.enum(["c", "cpp", "python", "javascript"]),
  code: z.string().min(1, "程式碼不能是空的").max(65536, "程式碼過長"),
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return Response.json({ error: "請先登入" }, { status: 401 });
  const limited = enforceRateLimit(`terminal-start:${session.userId}`, 12, 60_000);
  if (limited) return limited;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const { problemId, contestId, language, code } = parsed.data;
  if (Buffer.byteLength(code, "utf8") > 65536) {
    return Response.json({ error: "程式碼過長" }, { status: 400 });
  }
  if (contestId !== undefined) {
    const access = await assertContestProblemAccess(session, contestId, problemId, language);
    if (!access.ok) return Response.json({ error: access.error }, { status: access.status });
  }
  const problem = await prisma.problem.findUnique({
    where: { id: problemId },
    select: { isPublic: true, type: true, memoryLimitMb: true, timeLimitMs: true },
  });
  if (!problem || (contestId === undefined && !problem.isPublic && session.role !== "ADMIN")) {
    return Response.json({ error: "題目不存在" }, { status: 404 });
  }
  if (problem.type === "RECOGNITION") {
    return Response.json({ error: "識別題不支援 RUN" }, { status: 400 });
  }
  const lang = LANGUAGES[language];
  return terminalRequest(session.userId, "/sessions", {
    method: "POST",
    body: JSON.stringify({
      language, code,
      memoryMb: Math.max(4, Math.min(2048, Math.ceil(problem.memoryLimitMb * lang.memoryMultiplier))),
      cpuMs: Math.max(100, Math.min(30_000, Math.ceil(problem.timeLimitMs * lang.timeMultiplier))),
    }),
  });
}
