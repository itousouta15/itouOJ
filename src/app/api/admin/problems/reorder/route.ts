import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { PROBLEM_TYPES } from "@/lib/problemTypes";
import { formatProblemCode } from "@/lib/problemCode";

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
      // 實作題的 problemCode 有 [type, problemCode] UNIQUE 限制，照新順序直接寫會
      // 暫時撞號；先把整批移到不撞號的暫存值，再依新順序寫回正式代碼。
      // 識別題沿用整數 order，同樣先移出再寫回。
      if (type === "RECOGNITION") {
        for (const id of ids) {
          await tx.problem.update({ where: { id }, data: { order: -(id + 1) } });
        }
        for (const [i, id] of ids.entries()) {
          await tx.problem.update({ where: { id }, data: { order: i } });
        }
      } else {
        for (const id of ids) {
          await tx.problem.update({ where: { id }, data: { problemCode: `__tmp__${id}` } });
        }
        for (const [i, id] of ids.entries()) {
          await tx.problem.update({ where: { id }, data: { problemCode: formatProblemCode(i + 1) } });
        }
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
