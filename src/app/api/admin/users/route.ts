import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

// 管理後台（itouOJ-admin）讀取使用者列表。
export async function GET() {
  if ((await getSession())?.role !== "ADMIN") {
    return Response.json({ error: "需要管理員權限" }, { status: 403 });
  }
  const users = await prisma.user.findMany({
    orderBy: [{ role: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      username: true,
      displayName: true,
      role: true,
      createdAt: true,
      _count: { select: { submissions: true } },
    },
  });
  return Response.json(
    {
      users: users.map((u) => ({
        id: u.id,
        username: u.username,
        displayName: u.displayName,
        role: u.role,
        createdAt: u.createdAt,
        submissionCount: u._count.submissions,
      })),
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
