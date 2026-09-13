import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

async function requireAdmin() {
  const session = await getSession();
  return session?.role === "ADMIN" ? session : null;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) {
    return Response.json({ error: "需要管理員權限" }, { status: 403 });
  }
  const { id } = await params;
  const proposalId = Number(id);

  const body = await request.json().catch(() => ({}));
  const isPublic = body?.isPublic !== false;

  const result = await prisma.$transaction(async (tx) => {
    const proposal = await tx.problemProposal.findUnique({
      where: { id: proposalId },
      include: { testCases: { orderBy: [{ order: "asc" }, { id: "asc" }] } },
    });
    if (!proposal) return { error: "申請不存在", status: 404 as const };

    // Claim before creating the Problem so another admin cannot approve the
    // same proposal between this read and the transaction commit.
    const claimed = await tx.problemProposal.updateMany({
      where: { id: proposalId, status: "PENDING" },
      data: { status: "APPROVED", reviewNote: null },
    });
    if (claimed.count !== 1) {
      return { error: "此申請已處理", status: 409 as const };
    }

    const last = await tx.problem.findFirst({
      where: { type: "PROGRAMMING" },
      orderBy: { order: "desc" },
      select: { order: true },
    });
    const created = await tx.problem.create({
      data: {
        title: proposal.title,
        statement: proposal.statement,
        type: "PROGRAMMING",
        difficulty: proposal.difficulty,
        timeLimitMs: proposal.timeLimitMs,
        memoryLimitMb: proposal.memoryLimitMb,
        isPublic,
        order: (last?.order ?? 0) + 1,
        authorId: proposal.authorId,
        testCases: {
          create: proposal.testCases.map((tc, i) => ({
            input: tc.input,
            output: tc.output,
            isSample: tc.isSample,
            order: i + 1,
          })),
        },
      },
    });
    await tx.problemProposal.update({
      where: { id: proposalId },
      data: {
        approvedProblemId: created.id,
      },
    });
    return { problem: created };
  });
  if ("error" in result) {
    return Response.json({ error: result.error }, { status: result.status });
  }

  return Response.json({ ok: true, problemId: result.problem.id });
}
