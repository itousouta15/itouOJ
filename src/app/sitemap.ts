import type { MetadataRoute } from "next";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import { getNewProblemLessonHref } from "@/lib/newProblemLessons";

// Visibility changes must take effect without rebuilding the website. This also
// allows release builds before the additive CTF migration reaches the live DB.
export const dynamic = "force-dynamic";

// 爬蟲每次抓 sitemap 都會載入全部公開題目；快取 10 分鐘，可見性變更最多延遲這麼久。
// 日期經過 JSON 快取會變成字串，下面重新轉回 Date。
const getSitemapEntries = unstable_cache(
  () =>
    Promise.all([
      prisma.problem.findMany({
        where: { isPublic: true, type: "PROGRAMMING" },
        select: { problemCode: true, createdAt: true },
        orderBy: { problemCode: "asc" },
      }),
      prisma.announcement.findMany({
        select: { id: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.ctfChallenge.findMany({
        where: { isPublic: true }, select: { id: true, updatedAt: true }, orderBy: { id: "asc" },
      }),
    ]),
  ["sitemap-entries"],
  { revalidate: 600, tags: ["sitemap"] },
);

// 列出公開內容入口；個人頁、提交紀錄與需要登入的動態頁不放進 sitemap。
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.APP_URL ?? "https://oj.itousouta.me";

  const [cachedProblems, cachedAnnouncements, cachedCtf] = await getSitemapEntries();
  const problems = cachedProblems.map((p) => ({ ...p, createdAt: new Date(p.createdAt) }));
  const announcements = cachedAnnouncements.map((a) => ({ ...a, createdAt: new Date(a.createdAt) }));
  const ctfChallenges = cachedCtf.map((c) => ({ ...c, updatedAt: new Date(c.updatedAt) }));


  return [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/about`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/problems`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/recognition`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/ctf`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/courses`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/courses/practice`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/contests`, changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/ranking`, changeFrequency: "daily", priority: 0.6 },
    { url: `${base}/announcements`, changeFrequency: "weekly", priority: 0.5 },
    ...problems.map((p) => ({
      url: `${base}/problems/${p.problemCode}`,
      lastModified: p.createdAt,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...problems.flatMap((p) => {
      const href = p.problemCode ? getNewProblemLessonHref(p.problemCode) : undefined;
      return href ? [{ url: base + href, changeFrequency: "monthly" as const, priority: 0.7 }] : [];
    }),
    ...ctfChallenges.map((c) => ({
      url: `${base}/ctf/${c.id}`, lastModified: c.updatedAt,
      changeFrequency: "weekly" as const, priority: 0.7,
    })),
    ...announcements.map((a) => ({
      url: `${base}/announcements/${a.id}`,
      lastModified: a.createdAt,
      changeFrequency: "monthly" as const,
      priority: 0.4,
    })),
  ];
}
