import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { contestSchema } from "@/lib/contestSchema";

// 管理後台（itouOJ-admin）讀取比賽列表。
export async function GET() {
  if ((await getSession())?.role !== "ADMIN") {
    return Response.json({ error: "需要管理員權限" }, { status: 403 });
  }
  const contests = await prisma.contest.findMany({
    orderBy: { id: "desc" },
    select: {
      id: true,
      title: true,
      joinCode: true,
      startTime: true,
      endTime: true,
      freezeMinutes: true,
      _count: { select: { problems: true, participants: true } },
    },
  });
  return Response.json({ contests }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (session?.role !== "ADMIN") {
    return Response.json({ error: "需要管理員權限" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = contestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }
  const { problems, joinCode, ...fields } = parsed.data;

  const contest = await prisma.contest.create({
    data: {
      ...fields,
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
