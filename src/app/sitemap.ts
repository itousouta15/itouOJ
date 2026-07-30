import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";

// 只列公開題目跟公告——跟 robots.ts 的收錄範圍一致，不把私人題目、比賽、
// 使用者頁這些放進來，避免搜尋引擎另外從 sitemap 發現這些網址。
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.APP_URL ?? "https://oj.itousouta.me";

  const [problems, announcements] = await Promise.all([
    prisma.problem.findMany({
      where: { isPublic: true },
      select: { order: true, createdAt: true },
      orderBy: { order: "asc" },
    }),
    prisma.announcement.findMany({
      select: { id: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/problems`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/announcements`, changeFrequency: "weekly", priority: 0.5 },
    ...problems.map((p) => ({
      url: `${base}/problems/${p.order}`,
      lastModified: p.createdAt,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...announcements.map((a) => ({
      url: `${base}/announcements/${a.id}`,
      lastModified: a.createdAt,
      changeFrequency: "monthly" as const,
      priority: 0.4,
    })),
  ];
}
