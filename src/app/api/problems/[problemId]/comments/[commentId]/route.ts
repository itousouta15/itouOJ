import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

// 刪自己的留言；管理員可以刪任何一則（討論區總要有人能處理不當發言）。
// 底下的回覆會跟著被刪掉——schema 的 parentId 是 onDelete: Cascade，
// 否則主留言消失後回覆會變成沒有上下文的孤兒。
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
