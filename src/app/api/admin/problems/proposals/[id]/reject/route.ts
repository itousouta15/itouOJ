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
  });
  if (!proposal) {
    return Response.json({ error: "申請不存在" }, { status: 404 });
  }
  if (proposal.status === "APPROVED") {
    return Response.json({ error: "已核准的申請不能退回" }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const note = typeof body?.note === "string" ? body.note : "";

  await prisma.problemProposal.update({
    where: { id: proposalId },
    data: { status: "REJECTED", reviewNote: note },
  });

  return Response.json({ ok: true });
}
