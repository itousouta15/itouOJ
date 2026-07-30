import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

// 刪自己的題解；管理員可以刪任何一篇（例如有人貼了錯的解法誤導其他人）。
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ problemId: string; solutionId: string }> }
) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "請先登入" }, { status: 401 });
  }

  const { problemId: rawProblem, solutionId: rawSolution } = await params;
  const problemId = Number(rawProblem);
  const solutionId = Number(rawSolution);
  if (!Number.isInteger(problemId) || !Number.isInteger(solutionId)) {
    return Response.json({ error: "找不到這篇題解" }, { status: 404 });
  }

  const solution = await prisma.problemSolution.findUnique({
    where: { id: solutionId },
    select: { id: true, problemId: true, authorId: true },
  });
  if (!solution || solution.problemId !== problemId) {
    return Response.json({ error: "找不到這篇題解" }, { status: 404 });
  }

  const isAdmin = session.role === "ADMIN";
  if (!isAdmin && solution.authorId !== session.userId) {
    return Response.json({ error: "只能刪除自己的題解" }, { status: 403 });
  }

  await prisma.problemSolution.delete({ where: { id: solutionId } });
  return Response.json({ ok: true });
}
