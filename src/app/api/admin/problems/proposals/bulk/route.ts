import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { nextProblemCode } from "@/lib/problemCode";

const bulkReviewSchema = z.object({
  ids: z.array(z.number().int().positive()).min(1).max(25),
  action: z.enum(["approve", "reject"]),
  isPublic: z.boolean().optional().default(true),
  reviewNote: z.string().max(2000).optional().default(""),
}).superRefine((data, ctx) => {
  if (new Set(data.ids).size !== data.ids.length) {
    ctx.addIssue({ code: "custom", message: "申請清單包含重複項目", path: ["ids"] });
  }
});

class ReviewConflict extends Error {}

export async function POST(request: Request) {
  const session = await getSession();
  if (session?.role !== "ADMIN") {
    return Response.json({ error: "需要管理員權限" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = bulkReviewSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const { ids, action, reviewNote, isPublic } = parsed.data;

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const proposals = await tx.problemProposal.findMany({
        where: { id: { in: ids }, status: "PENDING" },
        include: {
          tags: { select: { tagId: true } },
          testCases: { orderBy: [{ order: "asc" }, { id: "asc" }] },
        },
      });
      if (proposals.length !== ids.length) throw new ReviewConflict();

      const claim = await tx.problemProposal.updateMany({
        where: { id: { in: ids }, status: "PENDING" },
        data: action === "approve"
          ? { status: "APPROVED", reviewNote: null }
          : { status: "REJECTED", reviewNote },
      });
      if (claim.count !== ids.length) throw new ReviewConflict();
      if (action === "reject") return claim.count;

      const [lastCodeProblem, lastOrderProblem] = await Promise.all([
        tx.problem.findFirst({
          where: { type: "PROGRAMMING" },
          orderBy: { problemCode: "desc" },
          select: { problemCode: true },
        }),
        tx.problem.findFirst({
          where: { type: "PROGRAMMING" },
          orderBy: { order: "desc" },
          select: { order: true },
        }),
      ]);
      let nextCode = lastCodeProblem?.problemCode;
      let nextOrder = (lastOrderProblem?.order ?? -1) + 1;
      const proposalById = new Map(proposals.map((proposal) => [proposal.id, proposal]));

      // Keep the submitted selection order predictable; ties are impossible after validation.
      for (const proposalId of ids) {
        const proposal = proposalById.get(proposalId)!;
        const problem = await tx.problem.create({
          data: {
            title: proposal.title,
            statement: proposal.statement,
            type: "PROGRAMMING",
            difficulty: proposal.difficulty,
            timeLimitMs: proposal.timeLimitMs,
            memoryLimitMb: proposal.memoryLimitMb,
            isPublic,
            problemCode: nextProblemCode(nextCode),
            order: nextOrder,
            authorId: proposal.authorId,
            tags: { create: proposal.tags.map(({ tagId }) => ({ tagId })) },
            testCases: {
              create: proposal.testCases.map((testCase, index) => ({
                input: testCase.input,
                output: testCase.output,
                isSample: testCase.isSample,
                order: index + 1,
              })),
            },
          },
          select: { id: true, problemCode: true },
        });
        nextCode = problem.problemCode;
        nextOrder += 1;
        await tx.problemProposal.update({
          where: { id: proposalId },
          data: { approvedProblemId: problem.id },
        });
      }
      return proposals.length;
    });
    return Response.json({ ok: true, updated });
  } catch (error) {
    if (error instanceof ReviewConflict) {
      return Response.json(
        { error: "所選申請中有項目已被其他管理員處理，未變更任何申請；請重新整理後再試。" },
        { status: 409 },
      );
    }
    console.error("Bulk proposal review failed", error);
    return Response.json({ error: "批次審核失敗，未變更任何申請" }, { status: 500 });
  }
}
