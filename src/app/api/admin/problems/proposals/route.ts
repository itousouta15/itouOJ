import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

// 管理後台（itouOJ-admin）讀取出題申請列表。
export async function GET() {
  if ((await getSession())?.role !== "ADMIN") {
    return Response.json({ error: "需要管理員權限" }, { status: 403 });
  }
  const proposals = await prisma.problemProposal.findMany({
    orderBy: [{ createdAt: "desc" }],
    select: {
      id: true,
      title: true,
      status: true,
      createdAt: true,
      author: { select: { username: true } },
    },
  });
  return Response.json({ proposals }, { headers: { "Cache-Control": "private, no-store" } });
}
