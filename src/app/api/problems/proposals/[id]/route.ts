import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { problemProposalSchema } from "@/lib/problemProposalSchema";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "請先登入" }, { status: 401 });
  }
  const { id } = await params;
  const proposalId = Number(id);

  const existing = await prisma.problemProposal.findUnique({
    where: { id: proposalId },
  });
  if (!existing) {
    return Response.json({ error: "申請不存在" }, { status: 404 });
  }
  if (existing.authorId !== session.userId) {
    return Response.json({ error: "沒有權限" }, { status: 403 });
  }
  if (existing.status === "APPROVED") {
    return Response.json(
      { error: "已通過的申請不能再修改" },
      { status: 400 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = problemProposalSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }
  const { testCases, ...fields } = parsed.data;

  // 測資整批換新（簡單且不易出錯）
  await prisma.$transaction([
    prisma.proposalTestCase.deleteMany({ where: { proposalId } }),
    prisma.problemProposal.update({
      where: { id: proposalId },
      data: {
        ...fields,
        status: "PENDING",
        reviewNote: null,
        testCases: {
          create: testCases.map((tc, i) => ({ ...tc, order: i + 1 })),
        },
      },
    }),
  ]);
  return Response.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "請先登入" }, { status: 401 });
  }
  const { id } = await params;
  const proposalId = Number(id);

  const existing = await prisma.problemProposal.findUnique({
    where: { id: proposalId },
  });
  if (!existing) {
    return Response.json({ ok: true });
  }
  if (existing.authorId !== session.userId) {
    return Response.json({ error: "沒有權限" }, { status: 403 });
  }
  if (existing.status === "APPROVED") {
    return Response.json(
      { error: "已通過的申請不能撤回" },
      { status: 400 }
    );
  }

  await prisma.problemProposal.delete({ where: { id: proposalId } });
  return Response.json({ ok: true });
}
