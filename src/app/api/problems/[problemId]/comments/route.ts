import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getDiscussionAccess } from "@/lib/problemDiscussion";
import { problemCommentSchema } from "@/lib/problemDiscussionSchema";

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
  _request: Request,
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

  const comments = await prisma.problemComment.findMany({
    where: { problemId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      content: true,
      parentId: true,
      createdAt: true,
      authorId: true,
      author: { select: { username: true, displayName: true, role: true } },
    },
  });

  const isAdmin = session?.role === "ADMIN";
  const shape = (c: (typeof comments)[number]) => ({
    id: c.id,
    content: c.content,
    createdAt: c.createdAt,
    authorName: c.author.displayName || c.author.username,
    authorIsAdmin: c.author.role === "ADMIN",
    // 自己的留言可以刪，管理員可以刪任何一則
    canDelete: isAdmin || c.authorId === session?.userId,
  });

  // 一層樹：先把主留言排好，再把回覆掛到各自的父留言底下
  const roots = comments.filter((c) => c.parentId === null);
  const byParent = new Map<number, typeof comments>();
  for (const c of comments) {
    if (c.parentId === null) continue;
    const list = byParent.get(c.parentId) ?? [];
    list.push(c);
    byParent.set(c.parentId, list);
  }

  return Response.json({
    access,
    comments: roots.map((c) => ({
      ...shape(c),
      replies: (byParent.get(c.id) ?? []).map(shape),
    })),
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
