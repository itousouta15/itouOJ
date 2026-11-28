import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { courseOrderSchema } from "@/lib/courseSchema";

export async function PUT(request: Request) {
  const session = await getSession();
  if (session?.role !== "ADMIN") {
    return Response.json({ error: "需要管理員權限" }, { status: 403 });
  }

  const parsed = courseOrderSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) {
    return Response.json({ error: "課程順序格式錯誤" }, { status: 400 });
  }
  const { ids, expectedIds } = parsed.data;

  try {
    const saved = await prisma.$transaction(async (tx) => {
      const current = await tx.course.findMany({
        orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
        select: { id: true },
      });
      if (
        current.length !== expectedIds.length ||
        current.some((course, index) => course.id !== expectedIds[index])
      ) {
        return false;
      }
      for (const [index, id] of ids.entries()) {
        await tx.course.update({
          where: { id },
          data: { sortOrder: index + 1 },
        });
      }
      return true;
    });
    if (!saved) {
      return Response.json(
        { error: "課程列表已被更新，請重新整理後再排序" },
        { status: 409 },
      );
    }
    return Response.json({ ok: true });
  } catch {
    return Response.json(
      { error: "儲存排序失敗，請稍後再試" },
      { status: 500 },
    );
  }
}
