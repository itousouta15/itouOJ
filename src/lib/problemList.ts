import { Prisma } from "@/generated/prisma/client";

// 共用計數與分頁查詢的條件；instr 將 %、_ 視為文字，不當成萬用字元。
export function problemListConditions({
  isAdmin,
  tag,
  query,
}: {
  isAdmin: boolean;
  tag?: string;
  query: string;
}) {
  const conditions = [Prisma.sql`p."type" = 'PROGRAMMING'`];
  if (!isAdmin) conditions.push(Prisma.sql`p."isPublic" = 1`);
  if (tag) {
    conditions.push(Prisma.sql`
      EXISTS (
        SELECT 1 FROM "ProblemTag" pt
        INNER JOIN "Tag" t ON t."id" = pt."tagId"
        WHERE pt."problemId" = p."id" AND t."name" = ${tag}
      )
    `);
  }
  const text = query.trim();
  if (text) {
    conditions.push(Prisma.sql`(
      instr(lower(p."problemCode"), lower(${text})) > 0
      OR instr(lower(p."title"), lower(${text})) > 0
    )`);
  }
  return Prisma.join(conditions, " AND ");
}
