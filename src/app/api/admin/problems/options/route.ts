import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

// 管理後台（itouOJ-admin）的課程／比賽表單用：全部題目的精簡清單。
export async function GET() {
  if ((await getSession())?.role !== "ADMIN") {
    return Response.json({ error: "需要管理員權限" }, { status: 403 });
  }
  const problems = await prisma.problem.findMany({
    orderBy: [{ type: "asc" }, { problemCode: "asc" }],
    select: { id: true, problemCode: true, title: true, isPublic: true, type: true },
  });
  return Response.json({ problems }, { headers: { "Cache-Control": "private, no-store" } });
}
