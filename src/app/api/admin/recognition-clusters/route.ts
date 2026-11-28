import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { recognitionClusterSchema } from "@/lib/recognitionClusterSchema";

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
