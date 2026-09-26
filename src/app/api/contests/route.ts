import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { contestSchema } from "@/lib/contestSchema";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "請先登入" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = contestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const { problems, joinCode, ...fields } = parsed.data;

  const available = await prisma.problem.count({
    where: { id: { in: problems.map((p) => p.problemId) }, isPublic: true },
  });
  if (available !== problems.length) {
    return Response.json({ error: "只能加入公開且存在的題目" }, { status: 400 });
  }

  const contest = await prisma.contest.create({
    data: {
      ...fields,
      ownerId: session.userId,
      joinCode: joinCode || null,
      problems: {
        create: problems.map((p, i) => ({
          problemId: p.problemId,
          label: p.label,
          order: i + 1,
        })),
      },
    },
  });
  return Response.json({ id: contest.id });
}
