import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { isReactionEmoji } from "@/lib/reactions";
import { getDiscussionAccess } from "@/lib/problemDiscussion";
import { enforceRateLimit } from "@/lib/rateLimit";

const schema = z.object({
  target: z.enum(["comment", "solution"]),
  id: z.number().int().positive(),
  emoji: z.string(),
});

type ReactionTarget = "comment" | "solution";

// 找出回饋目標與它屬於哪一題，順便帶題目的公開狀態。
async function loadTarget(target: ReactionTarget, id: number) {
  if (target === "comment") {
    const comment = await prisma.problemComment.findUnique({
      where: { id },
      select: {
        problemId: true,
        problem: { select: { isPublic: true } },
      },
    });
    return comment
      ? { problemId: comment.problemId, isPublic: comment.problem.isPublic }
      : null;
  }
  const solution = await prisma.problemSolution.findUnique({
    where: { id },
    select: {
      problemId: true,
      problem: { select: { isPublic: true } },
    },
  });
  return solution
    ? { problemId: solution.problemId, isPublic: solution.problem.isPublic }
    : null;
}

// POST = 加上表情、DELETE = 取消表情；兩個方向都冪等（重複按不報錯）。
async function handle(request: Request, action: "add" | "remove") {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "請先登入" }, { status: 401 });
  }

  const limited = enforceRateLimit(`reaction:${session.userId}`, 60, 60_000);
  if (limited) return limited;

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success || !isReactionEmoji(parsed.data.emoji)) {
    return Response.json({ error: "參數錯誤" }, { status: 400 });
  }
  const { target, id, emoji } = parsed.data;

  const found = await loadTarget(target, id);
  if (!found || (!found.isPublic && session.role !== "ADMIN")) {
    return Response.json({ error: "找不到目標" }, { status: 404 });
  }

  // 跟留言/題解本身用同一套權限：比賽鎖住時不能回應，
  // 題解則要 AC 過（看得到）才能按。
  const access = await getDiscussionAccess(session, found.problemId);
  const allowed =
    target === "comment" ? access.canComment : access.canViewSolutions;
  if (!allowed) {
    return Response.json({ error: "目前無法回應" }, { status: 403 });
  }

  if (target === "comment") {
    if (action === "add") {
      await prisma.commentReaction.upsert({
        where: {
          userId_commentId_emoji: { userId: session.userId, commentId: id, emoji },
        },
        create: { userId: session.userId, commentId: id, emoji },
        update: {},
      });
    } else {
      await prisma.commentReaction.deleteMany({
        where: { userId: session.userId, commentId: id, emoji },
      });
    }
  } else if (action === "add") {
    await prisma.solutionReaction.upsert({
      where: {
        userId_solutionId_emoji: {
          userId: session.userId,
          solutionId: id,
          emoji,
        },
      },
      create: { userId: session.userId, solutionId: id, emoji },
      update: {},
    });
  } else {
    await prisma.solutionReaction.deleteMany({
      where: { userId: session.userId, solutionId: id, emoji },
    });
  }

  return Response.json({ ok: true });
}

export async function POST(request: Request) {
  return handle(request, "add");
}

export async function DELETE(request: Request) {
  return handle(request, "remove");
}
