import { prisma } from "@/lib/db";
import { markdownSnippet } from "@/lib/textSnippet";

// 動態牆的一則活動：AC、新題解、新留言。userIds 給 null 代表全站，
// 空陣列代表不顯示任何人的活動。
export interface FeedItem {
  key: string;
  kind: "ac" | "solution" | "comment";
  at: Date;
  username: string;
  displayName: string | null;
  problemId: number;
  problemOrder: number;
  problemTitle: string;
  problemType: string;
  // 題解標題或留言摘要
  detail: string | null;
}

export async function getActivityFeed(
  userIds: string[] | null,
  take = 50
): Promise<FeedItem[]> {
  if (userIds !== null && userIds.length === 0) return [];

  const userFilter = userIds ? { userId: { in: userIds } } : {};
  const authorFilter = userIds ? { authorId: { in: userIds } } : {};

  const [subs, solutions, comments] = await Promise.all([
    prisma.submission.findMany({
      where: { ...userFilter, status: "AC", problem: { isPublic: true } },
      orderBy: { id: "desc" },
      take,
      include: {
        user: { select: { username: true, displayName: true } },
        problem: {
          select: { id: true, order: true, title: true, type: true },
        },
      },
    }),
    prisma.problemSolution.findMany({
      where: { ...authorFilter, problem: { isPublic: true } },
      orderBy: { id: "desc" },
      take,
      include: {
        author: { select: { username: true, displayName: true } },
        problem: {
          select: { id: true, order: true, title: true, type: true },
        },
      },
    }),
    prisma.problemComment.findMany({
      where: { ...authorFilter, problem: { isPublic: true } },
      orderBy: { id: "desc" },
      take,
      include: {
        author: { select: { username: true, displayName: true } },
        problem: {
          select: { id: true, order: true, title: true, type: true },
        },
      },
    }),
  ]);

  const items: FeedItem[] = [
    ...subs.map((s) => ({
      key: `submission-${s.id}`,
      kind: "ac" as const,
      at: s.createdAt,
      username: s.user.username,
      displayName: s.user.displayName,
      problemId: s.problem.id,
      problemOrder: s.problem.order,
      problemTitle: s.problem.title,
      problemType: s.problem.type,
      detail: null,
    })),
    ...solutions.map((s) => ({
      key: `solution-${s.id}`,
      kind: "solution" as const,
      at: s.createdAt,
      username: s.author.username,
      displayName: s.author.displayName,
      problemId: s.problem.id,
      problemOrder: s.problem.order,
      problemTitle: s.problem.title,
      problemType: s.problem.type,
      detail: s.title,
    })),
    ...comments.map((c) => ({
      key: `comment-${c.id}`,
      kind: "comment" as const,
      at: c.createdAt,
      username: c.author.username,
      displayName: c.author.displayName,
      problemId: c.problem.id,
      problemOrder: c.problem.order,
      problemTitle: c.problem.title,
      problemType: c.problem.type,
      detail: markdownSnippet(c.content, 80),
    })),
  ];

  return items.sort((a, b) => b.at.getTime() - a.at.getTime()).slice(0, take);
}
