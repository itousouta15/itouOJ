import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { avatarSrc } from "@/lib/avatar";
import { getDiscussionAccess } from "@/lib/problemDiscussion";
import { problemCommentSchema } from "@/lib/problemDiscussionSchema";
import { enforceRateLimit } from "@/lib/rateLimit";
import { summarizeReactions } from "@/lib/reactions";

const PAGE_SIZE = 20;

// 這裡的 problemId 是資料庫的 Problem.id，不是網址上的題號（order）。
// 題目頁把 problem.id 傳給元件，元件再打這支 API——跟 SubmitPanel 一樣。
async function loadProblem(problemId: number, isAdmin: boolean) {
  const problem = await prisma.problem.findUnique({
    where: { id: problemId },
    select: { id: true, isPublic: true },
  });
  if (!problem) return null;
  if (!problem.isPublic && !isAdmin) return null;
  return problem;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ problemId: string }> }
) {
  const { problemId: raw } = await params;
  const problemId = Number(raw);
  if (!Number.isInteger(problemId)) {
    return Response.json({ error: "題目不存在" }, { status: 404 });
  }

  const session = await getSession();
  const problem = await loadProblem(problemId, session?.role === "ADMIN");
  if (!problem) {
    return Response.json({ error: "題目不存在" }, { status: 404 });
  }

  const access = await getDiscussionAccess(session, problemId);
  if (!access.visible) {
    return Response.json({ access, comments: [] });
  }

  const rawCursor = Number(new URL(request.url).searchParams.get("cursor"));
  const cursor = Number.isInteger(rawCursor) && rawCursor > 0 ? rawCursor : null;
  const [commentRows, total, solutionTotal] = await Promise.all([
    prisma.problemComment.findMany({
      where: { problemId, parentId: null },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      take: PAGE_SIZE + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: {
      id: true,
      content: true,
      parentId: true,
      createdAt: true,
      updatedAt: true,
      authorId: true,
      reactions: { select: { emoji: true, userId: true } },
      replies: {
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        select: {
          id: true,
          content: true,
          createdAt: true,
          updatedAt: true,
          authorId: true,
          reactions: { select: { emoji: true, userId: true } },
          author: {
            select: {
              username: true,
              displayName: true,
              role: true,
              avatarUrl: true,
              avatarUpdatedAt: true,
            },
          },
        },
      },
      author: {
        select: {
          username: true,
          displayName: true,
          role: true,
          avatarUrl: true,
          avatarUpdatedAt: true,
        },
      },
      },
    }),
    prisma.problemComment.count({ where: { problemId } }),
    prisma.problemSolution.count({ where: { problemId } }),
  ]);

  const isAdmin = session?.role === "ADMIN";
  const comments = commentRows.slice(0, PAGE_SIZE);
  const shape = (
    c: (typeof comments)[number] | (typeof comments)[number]["replies"][number],
  ) => ({
    id: c.id,
    content: c.content,
    createdAt: c.createdAt,
    authorName: c.author.displayName || c.author.username,
    // username 是個人頁的網址（/users/{username}），displayName 不保證唯一，不能拿來連
    authorUsername: c.author.username,
    authorAvatarUrl: avatarSrc(c.author),
    authorIsAdmin: c.author.role === "ADMIN",
    // 只有作者本人能編輯（管理員也不行，以免改掉別人講過的話）
    canEdit: c.authorId === session?.userId,
    // 自己的留言可以刪，管理員可以刪任何一則
    canDelete: isAdmin || c.authorId === session?.userId,
    // 建立與更新時間差超過一秒就顯示「已編輯」
    edited: c.updatedAt.getTime() - c.createdAt.getTime() > 1000,
    reactions: summarizeReactions(c.reactions, session?.userId),
  });

  return Response.json({
    access,
    comments: comments.map((c) => ({
      ...shape(c),
      replies: c.replies.map(shape),
    })),
    total,
    solutionTotal,
    nextCursor: commentRows.length > PAGE_SIZE ? comments.at(-1)?.id ?? null : null,
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ problemId: string }> }
) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "請先登入" }, { status: 401 });
  }

  const limited = enforceRateLimit(`comment:${session.userId}`, 10, 60_000);
  if (limited) return limited;

  const { problemId: raw } = await params;
  const problemId = Number(raw);
  if (!Number.isInteger(problemId)) {
    return Response.json({ error: "題目不存在" }, { status: 404 });
  }

  const problem = await loadProblem(problemId, session.role === "ADMIN");
  if (!problem) {
    return Response.json({ error: "題目不存在" }, { status: 404 });
  }

  const access = await getDiscussionAccess(session, problemId);
  if (!access.canComment) {
    return Response.json(
      { error: "這題正在比賽中，討論區暫時關閉" },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = problemCommentSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }
  const { content, parentId } = parsed.data;

  // 回覆只做一層：回覆別人的回覆時，掛到那串的最上層去，不會愈疊愈深。
  // 也順便擋掉「回覆到別題的留言」這種被竄改過的請求。
  let resolvedParentId: number | null = null;
  if (parentId != null) {
    const parent = await prisma.problemComment.findUnique({
      where: { id: parentId },
      select: { id: true, problemId: true, parentId: true },
    });
    if (!parent || parent.problemId !== problemId) {
      return Response.json({ error: "找不到要回覆的留言" }, { status: 404 });
    }
    resolvedParentId = parent.parentId ?? parent.id;
  }

  const comment = await prisma.problemComment.create({
    data: {
      problemId,
      authorId: session.userId,
      content,
      parentId: resolvedParentId,
    },
  });
  return Response.json({ id: comment.id });
}
