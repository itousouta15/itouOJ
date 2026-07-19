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

  const proposal = await prisma.problemProposal.findUnique({
    where: { id: proposalId },
    include: { testCases: { orderBy: [{ order: "asc" }, { id: "asc" }] } },
  });
  if (!proposal) {
    return Response.json({ error: "申請不存在" }, { status: 404 });
  }
  if (proposal.status === "APPROVED") {
    return Response.json({ error: "已經核准過了" }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const isPublic = body?.isPublic !== false;

  const problem = await prisma.$transaction(async (tx) => {
    const created = await tx.problem.create({
      data: {
        title: proposal.title,
        statement: proposal.statement,
        difficulty: proposal.difficulty,
        timeLimitMs: proposal.timeLimitMs,
        memoryLimitMb: proposal.memoryLimitMb,
        isPublic,
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
        status: "APPROVED",
        approvedProblemId: created.id,
        reviewNote: null,
      },
    });
    return created;
  });

  return Response.json({ ok: true, problemId: problem.id });
}
