import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

// 管理後台（itouOJ-admin）群集表單用：全部識別題與標籤。
export async function GET() {
  if ((await getSession())?.role !== "ADMIN") {
    return Response.json({ error: "需要管理員權限" }, { status: 403 });
  }
  const [problems, tags] = await Promise.all([
    prisma.problem.findMany({
      where: { type: "RECOGNITION" },
      orderBy: [{ clusterId: "asc" }, { order: "asc" }],
      select: {
        id: true,
        title: true,
        isPublic: true,
        category: true,
        cluster: { select: { id: true, title: true } },
      },
    }),
    prisma.tag.findMany({ orderBy: { name: "asc" } }),
  ]);
  return Response.json(
    {
      tags,
      problems: problems.map((p) => ({
        id: p.id,
        title: p.title,
        isPublic: p.isPublic,
        category: p.category,
        clusterId: p.cluster?.id ?? null,
        clusterTitle: p.cluster?.title ?? null,
      })),
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
