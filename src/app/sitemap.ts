import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";

// 列出公開內容入口；個人頁、提交紀錄與需要登入的動態頁不放進 sitemap。
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.APP_URL ?? "https://oj.itousouta.me";

  const [problems, announcements] = await Promise.all([
    prisma.problem.findMany({
      where: { isPublic: true, type: "PROGRAMMING" },
      select: { problemCode: true, createdAt: true },
      orderBy: { problemCode: "asc" },
    }),
    prisma.announcement.findMany({
      select: { id: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/about`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/problems`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/recognition`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/courses`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/contests`, changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/ranking`, changeFrequency: "daily", priority: 0.6 },
    { url: `${base}/announcements`, changeFrequency: "weekly", priority: 0.5 },
    ...problems.map((p) => ({
      url: `${base}/problems/${p.problemCode}`,
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
