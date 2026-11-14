import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import type { NavInfo } from "@/lib/nav";
import { getDailyProblem, taipeiDateString } from "@/lib/dailyProblem";
import { getNextLearningAction } from "@/lib/nextLearningAction";
import { getActivityFeed } from "@/lib/activityFeed";
import { getCtfStats } from "@/lib/ctf";
import { getSiteWideRanking } from "@/lib/ranking";

async function homeFeed(userId?: string) {
  if (userId) {
    const following = await prisma.follow.findMany({ where: { followerId: userId }, select: { followingId: true } });
    if (following.length) {
      const items = await getActivityFeed(following.map((row) => row.followingId), 5);
      if (items.length) return { title: "追蹤動態", items };
    }
  }
  return { title: "社群動態", items: await getActivityFeed(null, 5) };
}

// 公開題庫統計對所有人都一樣，不需要每次請求都跑 4 個 COUNT。
const getPublicCounts = unstable_cache(
  async () => {
    const [programmingCount, recognitionCount, ctfCount, userCount] = await Promise.all([
      prisma.problem.count({ where: { isPublic: true, type: "PROGRAMMING" } }),
      prisma.problem.count({ where: { isPublic: true, type: "RECOGNITION" } }),
      prisma.ctfChallenge.count({ where: { isPublic: true } }),
      prisma.user.count(),
    ]);
    return { programmingCount, recognitionCount, ctfCount, userCount };
  },
  ["home-public-counts"],
  { revalidate: 60 },
);

// 每日一題整天不變（以台北日期為 key），快取 5 分鐘即可。
const getCachedDaily = unstable_cache(
  // date 只用來當快取 key（換日自動換題），函式本身不需要它。
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async (_date: string) => getDailyProblem(),
  ["home-daily-problem"],
  { revalidate: 300 },
);

export async function getHomeData(nav: NavInfo) {
  const userId = nav.session?.userId;
  const [{ programmingCount, recognitionCount, ctfCount, userCount }, latestCtf,
    latestProblems, ranking, announcements, daily, nextAction, ctfStats, feed] = await Promise.all([
    getPublicCounts(),
    prisma.ctfChallenge.findMany({
      where: { isPublic: true }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 3,
      select: {
        id: true, title: true, category: true, difficulty: true, points: true, labType: true,
        _count: { select: { solves: true } },
        solves: { where: { userId: userId ?? "" }, select: { id: true } },
      },
    }),
    prisma.problem.findMany({
      where: { isPublic: true, type: "PROGRAMMING" }, orderBy: { id: "desc" }, take: 4,
      select: { id: true, problemCode: true, title: true, difficulty: true },
    }),
    getSiteWideRanking(5),
    prisma.announcement.findMany({ orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }], take: 2, select: { id: true, title: true, isPinned: true, createdAt: true } }),
    getCachedDaily(taipeiDateString()),
    userId ? getNextLearningAction(userId) : Promise.resolve(null),
    userId ? getCtfStats(userId) : Promise.resolve(null),
    homeFeed(userId),
  ]);
  const dailySolved = daily && userId ? Boolean(await prisma.submission.findFirst({
    where: { userId, problemId: daily.id, status: "AC" }, select: { id: true },
  })) : false;
  return { programmingCount, recognitionCount, ctfCount, userCount, latestCtf,
    latestProblems, ranking, announcements, daily, dailySolved, nextAction, ctfStats, feed };
}

export type HomeData = Awaited<ReturnType<typeof getHomeData>>;
