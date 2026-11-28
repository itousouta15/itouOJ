import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { PROBLEM_TYPES } from "@/lib/problemTypes";

const bulkEditSchema = z
  .object({
    ids: z.array(z.number().int().positive()).min(1).max(500),
    type: z.enum(PROBLEM_TYPES),
    action: z.enum(["publish", "unpublish", "setDifficulty", "setAuthor", "addTags", "removeTags", "clearTags"]),
    tagIds: z.array(z.number().int().positive()).max(100).optional(),
    difficulty: z.enum(["easy", "medium", "hard"]).optional(),
    authorUsername: z.string().min(1).max(20).optional(),
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
    if (data.action === "setAuthor" && data.type !== "PROGRAMMING") {
      ctx.addIssue({ code: "custom", message: "只有實作題能設定出題者", path: ["action"] });
    }
    if (data.action === "setAuthor" && !data.authorUsername?.trim()) {
      ctx.addIssue({ code: "custom", message: "請選擇出題者", path: ["authorUsername"] });
    }
    if (["addTags", "removeTags"].includes(data.action) && !data.tagIds?.length) {
      ctx.addIssue({ code: "custom", message: "請選擇標籤", path: ["tagIds"] });
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

  const { ids, type, action, difficulty, authorUsername } = parsed.data;
  const tagIds = [...new Set(parsed.data.tagIds ?? [])];

  const updated = await prisma.$transaction(async (tx) => {
    const count = await tx.problem.count({ where: { id: { in: ids }, type } });
    if (count !== ids.length) {
      return 0;
    }
    if (action === "addTags" || action === "removeTags") {
      const tagCount = await tx.tag.count({ where: { id: { in: tagIds } } });
      if (tagCount !== tagIds.length) return -2;
      if (action === "removeTags") {
        await tx.problemTag.deleteMany({ where: { problemId: { in: ids }, tagId: { in: tagIds } } });
      } else {
        const existing = await tx.problemTag.findMany({
          where: { problemId: { in: ids }, tagId: { in: tagIds } },
        });
        const keys = new Set(existing.map(({ problemId, tagId }) => `${problemId}:${tagId}`));
        const missing = ids.flatMap((problemId) => tagIds
          .filter((tagId) => !keys.has(`${problemId}:${tagId}`))
          .map((tagId) => ({ problemId, tagId })));
        for (let i = 0; i < missing.length; i += 250) {
          await tx.problemTag.createMany({ data: missing.slice(i, i + 250) });
        }
      }
      return count;
    }
    if (action === "clearTags") {
      await tx.problemTag.deleteMany({ where: { problemId: { in: ids } } });
      return count;
    }
    const author =
      action === "setAuthor"
        ? await tx.user.findUnique({
            where: { username: authorUsername!.trim() },
            select: { id: true },
          })
        : null;
    if (action === "setAuthor" && !author) {
      return -1;
    }
    const data =
      action === "publish"
        ? { isPublic: true }
        : action === "unpublish"
          ? { isPublic: false }
          : action === "setDifficulty"
            ? { difficulty: difficulty! }
            : { authorId: author!.id };
    const result = await tx.problem.updateMany({ where: { id: { in: ids }, type }, data });
    return result.count;
  });
  if (updated === -1) {
    return Response.json({ error: "找不到指定的出題者" }, { status: 400 });
  }
  if (updated === -2) {
    return Response.json({ error: "部分標籤不存在，請重新選擇" }, { status: 400 });
  }
  if (updated !== ids.length) {
    return Response.json(
      { error: "部分題目不存在或不屬於目前的題型" },
      { status: 404 },
    );
  }

  return Response.json({ ok: true, updated });
}
