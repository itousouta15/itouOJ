import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { recognitionClusterSchema } from "@/lib/recognitionClusterSchema";

// 管理後台（itouOJ-admin）讀取識讀群集列表與未分類題數。
export async function GET() {
  if ((await getSession())?.role !== "ADMIN") {
    return Response.json({ error: "需要管理員權限" }, { status: 403 });
  }
  const [clusters, uncategorized] = await Promise.all([
    prisma.recognitionCluster.findMany({
      orderBy: [{ order: "asc" }, { id: "asc" }],
      include: {
        _count: { select: { problems: { where: { type: "RECOGNITION" } } } },
        tags: { include: { tag: true } },
      },
    }),
    prisma.problem.count({ where: { type: "RECOGNITION", clusterId: null } }),
  ]);
  return Response.json(
    {
      uncategorized,
      clusters: clusters.map((c) => ({
        id: c.id,
        title: c.title,
        description: c.description,
        isPublic: c.isPublic,
        problemCount: c._count.problems,
        tags: c.tags.map((ct) => ({ id: ct.tagId, name: ct.tag.name })),
      })),
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}

export async function POST(request: Request) {
  const session = await getSession();
  if (session?.role !== "ADMIN") {
    return Response.json({ error: "需要管理員權限" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = recognitionClusterSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }
  const { title, description, isPublic, problemIds, tagIds } = parsed.data;

  const last = await prisma.recognitionCluster.findFirst({
    orderBy: { order: "desc" },
    select: { order: true },
  });

  const cluster = await prisma.$transaction(async (tx) => {
    const created = await tx.recognitionCluster.create({
      data: {
        title,
        description,
        isPublic,
        order: (last?.order ?? -1) + 1,
        tags: { create: tagIds.map((tagId) => ({ tagId })) },
      },
    });
    if (problemIds.length > 0) {
      // 一題一群集：勾選的題目直接掛過來（原本在別的群集就移過來）
      await tx.problem.updateMany({
        where: { id: { in: problemIds }, type: "RECOGNITION" },
        data: { clusterId: created.id },
      });
    }
    return created;
  });

  return Response.json({ id: cluster.id });
}
