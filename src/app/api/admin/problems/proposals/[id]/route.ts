import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

// 管理後台（itouOJ-admin）讀取單筆出題申請（含測資、標籤與核准後的題號）。
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if ((await getSession())?.role !== "ADMIN") {
    return Response.json({ error: "需要管理員權限" }, { status: 403 });
  }
  const id = Number((await params).id);
  if (!Number.isSafeInteger(id) || id <= 0) {
    return Response.json({ error: "找不到申請" }, { status: 404 });
  }
  const proposal = await prisma.problemProposal.findUnique({
    where: { id },
    include: {
      author: { select: { username: true } },
      tags: { include: { tag: true } },
      testCases: { orderBy: [{ order: "asc" }, { id: "asc" }] },
    },
  });
  if (!proposal) return Response.json({ error: "找不到申請" }, { status: 404 });

  const approvedProblem = proposal.approvedProblemId
    ? await prisma.problem.findUnique({
        where: { id: proposal.approvedProblemId },
        select: { problemCode: true },
      })
    : null;

  return Response.json(
    {
      proposal: {
        id: proposal.id,
        title: proposal.title,
        difficulty: proposal.difficulty,
        status: proposal.status,
        statement: proposal.statement,
        timeLimitMs: proposal.timeLimitMs,
        memoryLimitMb: proposal.memoryLimitMb,
        author: proposal.author,
        tags: proposal.tags.map(({ tag }) => ({ id: tag.id, name: tag.name })),
        testCases: proposal.testCases.map((tc) => ({
          id: tc.id,
          input: tc.input,
          output: tc.output,
          isSample: tc.isSample,
        })),
        approvedProblemCode: approvedProblem?.problemCode ?? null,
      },
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
