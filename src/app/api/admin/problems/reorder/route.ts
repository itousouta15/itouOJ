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

  try {
    await prisma.$transaction([
      // order 欄位有 UNIQUE 限制，直接照新順序寫入會跟其他還沒更新到位的
      // 列暫時撞號。先把整批挪到不會用到的負數區間，讓所有列都不衝突，
      // 再照最終順序寫回正數，兩段式更新才不會在交易中途違反 UNIQUE。
      ...ids.map((id, i) =>
        prisma.problem.update({ where: { id }, data: { order: -(i + 1) } }),
      ),
      ...ids.map((id, i) =>
        prisma.problem.update({ where: { id }, data: { order: i + 1 } }),
      ),
    ]);
  } catch {
    return Response.json(
      { error: "排序更新失敗，請重新整理後再試一次" },
      { status: 500 },
    );
  }
  return Response.json({ ok: true });
}
