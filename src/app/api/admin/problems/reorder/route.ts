import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { PROBLEM_TYPES } from "@/lib/problemTypes";

export async function PUT(request: Request) {
  const session = await getSession();
  if (session?.role !== "ADMIN") {
    return Response.json({ error: "需要管理員權限" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const ids = body?.ids;
  const type = body?.type;
  if (
    !Array.isArray(ids) ||
    ids.some((id) => typeof id !== "number") ||
    !(PROBLEM_TYPES as readonly string[]).includes(type)
  ) {
    return Response.json({ error: "格式錯誤" }, { status: 400 });
  }

  try {
    await prisma.$transaction(async (tx) => {
      // 確認送來的 id 都屬於這個題型，避免誤排到別的題型的題目
      const count = await tx.problem.count({ where: { type, id: { in: ids } } });
      if (count !== ids.length) {
        throw new Error("ids 與題型不符");
      }
      // order 欄位有 UNIQUE 限制（[type, order]），直接照新順序寫入會跟其他
      // 還沒更新到位的列暫時撞號。先把整批挪到不會用到的負數區間，讓所有列
      // 都不衝突，再照最終順序寫回正數，兩段式更新才不會在交易中途違反 UNIQUE。
      for (const [i, id] of ids.entries()) {
        await tx.problem.update({ where: { id }, data: { order: -(i + 1) } });
      }
      for (const [i, id] of ids.entries()) {
        await tx.problem.update({ where: { id }, data: { order: i + 1 } });
      }
    });
  } catch {
    return Response.json(
      { error: "排序更新失敗，請重新整理後再試一次" },
      { status: 500 },
    );
  }
  return Response.json({ ok: true });
}
