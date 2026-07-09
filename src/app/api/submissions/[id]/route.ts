import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const submissionId = Number(id);
  if (!Number.isInteger(submissionId)) {
    return Response.json({ error: "not found" }, { status: 404 });
  }

  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: {
      user: { select: { username: true } },
      problem: { select: { id: true, title: true } },
      results: { orderBy: { order: "asc" } },
    },
  });
  if (!submission) {
    return Response.json({ error: "not found" }, { status: 404 });
  }

  const session = await getSession();
  const isOwner = session?.userId === submission.userId;
  const isAdmin = session?.role === "ADMIN";

  return Response.json({
    id: submission.id,
    username: submission.user.username,
    problem: submission.problem,
    language: submission.language,
    status: submission.status,
    timeMs: submission.timeMs,
    memoryKb: submission.memoryKb,
    createdAt: submission.createdAt,
    results: submission.results.map((r) => ({
      order: r.order,
      verdict: r.verdict,
      timeMs: r.timeMs,
      memoryKb: r.memoryKb,
    })),
    // 程式碼與編譯錯誤只有本人和管理員看得到
    code: isOwner || isAdmin ? submission.code : null,
    compileError: isOwner || isAdmin ? submission.compileError : null,
  });
}
