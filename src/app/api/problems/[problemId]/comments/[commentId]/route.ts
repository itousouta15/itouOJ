import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getDiscussionAccess } from "@/lib/problemDiscussion";
import { problemCommentSchema } from "@/lib/problemDiscussionSchema";

// 編輯自己的留言（管理員也不行改別人的，避免掛著原作者名字的內容被改掉）。
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ problemId: string; commentId: string }> }
) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "請先登入" }, { status: 401 });
  }

  const { problemId: rawProblem, commentId: rawComment } = await params;
  const problemId = Number(rawProblem);
  const commentId = Number(rawComment);
  if (!Number.isInteger(problemId) || !Number.isInteger(commentId)) {
    return Response.json({ error: "找不到這則留言" }, { status: 404 });
  }

  const comment = await prisma.problemComment.findUnique({
    where: { id: commentId },
    select: { id: true, problemId: true, authorId: true },
  });
  if (!comment || comment.problemId !== problemId) {
    return Response.json({ error: "找不到這則留言" }, { status: 404 });
  }
  if (comment.authorId !== session.userId) {
    return Response.json({ error: "只能編輯自己的留言" }, { status: 403 });
  }

  // 比賽進行中（含賽前）整區鎖住，不能趁改留言偷渡提示
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

  await prisma.problemComment.update({
    where: { id: commentId },
    data: { content: parsed.data.content },
  });
  return Response.json({ ok: true });
}

// 刪自己的留言，管理員可以刪任何一則。底下的回覆靠 schema 的
// onDelete: Cascade 一起刪掉。
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ problemId: string; commentId: string }> }
) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "請先登入" }, { status: 401 });
  }

  const { problemId: rawProblem, commentId: rawComment } = await params;
  const problemId = Number(rawProblem);
  const commentId = Number(rawComment);
  if (!Number.isInteger(problemId) || !Number.isInteger(commentId)) {
    return Response.json({ error: "找不到這則留言" }, { status: 404 });
  }

  const comment = await prisma.problemComment.findUnique({
    where: { id: commentId },
    select: { id: true, problemId: true, authorId: true },
  });
  if (!comment || comment.problemId !== problemId) {
    return Response.json({ error: "找不到這則留言" }, { status: 404 });
  }

  const isAdmin = session.role === "ADMIN";
  if (!isAdmin && comment.authorId !== session.userId) {
    return Response.json({ error: "只能刪除自己的留言" }, { status: 403 });
  }

  await prisma.problemComment.delete({ where: { id: commentId } });
  return Response.json({ ok: true });
}
