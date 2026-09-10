import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { recognitionClusterSchema } from "@/lib/recognitionClusterSchema";

async function requireAdmin() {
  const session = await getSession();
  return session?.role === "ADMIN" ? session : null;
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) {
    return Response.json({ error: "需要管理員權限" }, { status: 403 });
  }
  const { id } = await params;
  const clusterId = Number(id);
  if (!Number.isInteger(clusterId)) {
    return Response.json({ error: "無效的群集 ID" }, { status: 400 });
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

  const existing = await prisma.recognitionCluster.findUnique({
    where: { id: clusterId },
    select: { id: true },
  });
  if (!existing) {
    return Response.json({ error: "群集不存在" }, { status: 404 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.recognitionCluster.update({
      where: { id: clusterId },
      data: { title, description, isPublic },
    });
    // 標籤整批換新
    await tx.recognitionClusterTag.deleteMany({ where: { clusterId } });
    if (tagIds.length > 0) {
      await tx.recognitionClusterTag.createMany({
        data: tagIds.map((tagId) => ({ clusterId, tagId })),
      });
    }
    // 整批換新：先把原本在這個群集的題目退掉，再掛上這次勾選的
    await tx.problem.updateMany({
      where: { clusterId },
      data: { clusterId: null },
    });
    if (problemIds.length > 0) {
      await tx.problem.updateMany({
        where: { id: { in: problemIds }, type: "RECOGNITION" },
        data: { clusterId },
      });
    }
  });

  return Response.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) {
    return Response.json({ error: "需要管理員權限" }, { status: 403 });
  }
  const { id } = await params;
  // Problem.clusterId 是 onDelete: SetNull，群集刪掉題目會留著變成未分類
  await prisma.recognitionCluster
    .delete({ where: { id: Number(id) } })
    .catch(() => null);
  return Response.json({ ok: true });
}
