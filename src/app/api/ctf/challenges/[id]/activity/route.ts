import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ctfIdSchema, CTF_PAGE_SIZE } from "@/lib/ctfSchema";

const querySchema = z.object({
  kind: z.enum(["solves", "attempts"]).default("solves"),
  page: z.coerce.number().int().min(1).max(100000).catch(1),
});
const headers = { "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex, nofollow" };

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = ctfIdSchema.safeParse((await params).id);
  const query = querySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!id.success || !query.success) return Response.json({ error: "查詢參數不合法" }, { status: 400, headers });
  const session = await getSession();
  if (query.data.kind === "attempts" && !session) return Response.json({ error: "請先登入" }, { status: 401, headers });
  const visibility = session?.role === "ADMIN" ? {} : { isPublic: true };
  const challenge = await prisma.ctfChallenge.findFirst({ where: { id: id.data, ...visibility }, select: { id: true } });
  if (!challenge) return Response.json({ error: "題目不存在" }, { status: 404, headers });
  const { kind, page } = query.data;
  const pagination = { skip: (page - 1) * CTF_PAGE_SIZE, take: CTF_PAGE_SIZE + 1 };
  if (kind === "attempts") {
    const rows = await prisma.ctfAttempt.findMany({
      where: { challengeId: id.data, userId: session!.userId, challenge: visibility },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }], ...pagination,
      select: { id: true, result: true, createdAt: true },
    });
    return Response.json({ page, hasNext: rows.length > CTF_PAGE_SIZE, rows: rows.slice(0, CTF_PAGE_SIZE).map((row) => ({ id: row.id, result: row.result, date: row.createdAt.toISOString() })) }, { headers });
  }
  const rows = await prisma.ctfSolve.findMany({
    where: { challengeId: id.data, challenge: visibility },
    orderBy: [{ solvedAt: "asc" }, { id: "asc" }], ...pagination,
    select: { id: true, solvedAt: true, user: { select: { username: true, displayName: true } } },
  });
  return Response.json({ page, hasNext: rows.length > CTF_PAGE_SIZE, rows: rows.slice(0, CTF_PAGE_SIZE).map((row) => ({ id: row.id, date: row.solvedAt.toISOString(), ...row.user })) }, { headers });
}
