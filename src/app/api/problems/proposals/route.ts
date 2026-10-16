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
  const { testCases, tagIds, ...fields } = parsed.data;
  const tagCount = await prisma.tag.count({ where: { id: { in: tagIds } } });
  if (tagCount !== tagIds.length) {
    return Response.json({ error: "部分標籤不存在，請重新選擇" }, { status: 400 });
  }

  const proposal = await prisma.problemProposal.create({
    data: {
      ...fields,
      authorId: session.userId,
      tags: { create: tagIds.map((tagId) => ({ tagId })) },
      testCases: {
        create: testCases.map((tc, i) => ({ ...tc, order: i + 1 })),
      },
    },
  });
  return Response.json({ id: proposal.id });
}
