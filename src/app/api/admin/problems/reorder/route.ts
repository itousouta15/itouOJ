import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function PUT(request: Request) {
  const session = await getSession();
  if (session?.role !== "ADMIN") {
    return Response.json({ error: "需要管理員權限" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const ids = body?.ids;
  if (!Array.isArray(ids) || ids.some((id) => typeof id !== "number")) {
    return Response.json({ error: "格式錯誤" }, { status: 400 });
  }

  await prisma.$transaction(
    ids.map((id, i) =>
      prisma.problem.update({ where: { id }, data: { order: i + 1 } })
    )
  );
  return Response.json({ ok: true });
}
