import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getContestPhase } from "@/lib/contest";

// 離線收件程式設定階段用：列出我看得到的比賽，讓選手用下拉選單挑，
// 不用手動輸入比賽編號（打錯的話整場提交都會送錯地方）。
export async function GET() {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "請先登入" }, { status: 401 });
  }

  const isAdmin = session.role === "ADMIN";
  const contests = await prisma.contest.findMany({
    where: isAdmin ? {} : { isPublic: true },
    orderBy: { startTime: "desc" },
    include: {
      participants: {
        where: { userId: session.userId },
        select: { id: true },
      },
    },
  });

  return Response.json({
    contests: contests.map((c) => ({
      id: c.id,
      title: c.title,
      startTime: c.startTime,
      endTime: c.endTime,
      scoreMode: c.scoreMode,
      phase: getContestPhase(c),
      joined: c.participants.length > 0,
    })),
  });
}
