import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { problemProposalSchema } from "@/lib/problemProposalSchema";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "請先登入" }, { status: 401 });
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

  const proposal = await prisma.problemProposal.create({
    data: {
      ...fields,
      authorId: session.userId,
      testCases: {
        create: testCases.map((tc, i) => ({ ...tc, order: i + 1 })),
      },
    },
  });
  return Response.json({ id: proposal.id });
}
