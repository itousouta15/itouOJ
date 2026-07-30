import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getDiscussionAccess } from "@/lib/problemDiscussion";
import { problemSolutionSchema } from "@/lib/problemDiscussionSchema";

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
    return Response.json({ access, solutions: [], total: 0 });
  }

  // 還沒 AC 的人只給篇數，不給內容——知道「有 3 篇題解等著」是解題的動力，
  // 而篇數本身不會洩漏任何解法。
  const total = await prisma.problemSolution.count({ where: { problemId } });
  if (!access.canViewSolutions) {
    return Response.json({ access, solutions: [], total });
  }

  const solutions = await prisma.problemSolution.findMany({
    where: { problemId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      content: true,
      code: true,
      language: true,
      createdAt: true,
      authorId: true,
      author: { select: { username: true, displayName: true, role: true } },
    },
  });

  const isAdmin = session?.role === "ADMIN";
  return Response.json({
    access,
    total,
    solutions: solutions.map((s) => ({
      id: s.id,
      title: s.title,
      content: s.content,
      code: s.code,
      language: s.language,
      createdAt: s.createdAt,
      authorName: s.author.displayName || s.author.username,
      authorIsAdmin: s.author.role === "ADMIN",
      canDelete: isAdmin || s.authorId === session?.userId,
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
  if (!access.canPostSolution) {
    return Response.json(
      {
        error: access.lockedByContest
          ? "這題正在比賽中，題解區暫時關閉"
          : "要先通過這一題（AC）才能分享題解",
      },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = problemSolutionSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }
  const { title, content, code, language } = parsed.data;

  const trimmedCode = code?.trim();
  const solution = await prisma.problemSolution.create({
    data: {
      problemId,
      authorId: session.userId,
      title,
      content,
      // 沒附程式碼時 language 一起存 null，避免留下「有語言沒程式碼」的半套資料
      code: trimmedCode ? trimmedCode : null,
      language: trimmedCode ? language : null,
    },
  });
  return Response.json({ id: solution.id });
}
