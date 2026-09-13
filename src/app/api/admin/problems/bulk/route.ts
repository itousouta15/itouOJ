import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { PROBLEM_TYPES } from "@/lib/problemTypes";

const bulkEditSchema = z
  .object({
    ids: z.array(z.number().int().positive()).min(1).max(500),
    type: z.enum(PROBLEM_TYPES),
    action: z.enum(["publish", "unpublish", "setDifficulty"]),
    difficulty: z.enum(["easy", "medium", "hard"]).optional(),
  })
  .superRefine((data, ctx) => {
    if (new Set(data.ids).size !== data.ids.length) {
      ctx.addIssue({ code: "custom", message: "題目清單包含重複項目", path: ["ids"] });
    }
    if (data.action === "setDifficulty" && data.type !== "PROGRAMMING") {
      ctx.addIssue({ code: "custom", message: "只有實作題能批次設定難度", path: ["action"] });
    }
    if (data.action === "setDifficulty" && !data.difficulty) {
      ctx.addIssue({ code: "custom", message: "請選擇難度", path: ["difficulty"] });
    }
  });

export async function PUT(request: Request) {
  const session = await getSession();
  if (session?.role !== "ADMIN") {
    return Response.json({ error: "需要管理員權限" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = bulkEditSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { ids, type, action, difficulty } = parsed.data;
  const data =
    action === "publish"
      ? { isPublic: true }
      : action === "unpublish"
        ? { isPublic: false }
        : { difficulty: difficulty! };

  const updated = await prisma.$transaction(async (tx) => {
    const count = await tx.problem.count({ where: { id: { in: ids }, type } });
    if (count !== ids.length) {
      return 0;
    }
    const result = await tx.problem.updateMany({ where: { id: { in: ids }, type }, data });
    return result.count;
  });
  if (updated !== ids.length) {
    return Response.json(
      { error: "部分題目不存在或不屬於目前的題型" },
      { status: 404 },
    );
  }

  return Response.json({ ok: true, updated });
}
