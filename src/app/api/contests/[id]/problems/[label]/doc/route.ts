import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getContestPhase } from "@/lib/contest";
import { renderProblemDocHtml } from "@/lib/renderProblemDoc";

// 給離線收件程式在賽前設定階段下載題目文件用（有上傳 PDF 就給 PDF，沒有就
// 現場產生 HTML）。預設要等開賽才能下載，跟 /api/contests/[id]/problems 的
// 防洩題邏輯一致；管理員把 Contest.allowEarlyProblemDownload 打開後，
// 已報名的參賽者才能在開賽前就先下載——這是管理員自行評估風險後的選擇，
// 不是系統預設行為。
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; label: string }> }
) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "請先登入" }, { status: 401 });
  }

  const { id, label } = await params;
  const contestId = Number(id);
  if (!Number.isInteger(contestId)) {
    return Response.json({ error: "比賽不存在" }, { status: 404 });
  }

  const contest = await prisma.contest.findUnique({ where: { id: contestId } });
  if (!contest) {
    return Response.json({ error: "比賽不存在" }, { status: 404 });
  }

  const isAdmin = session.role === "ADMIN";

  if (!isAdmin) {
    const participant = await prisma.contestParticipant.findUnique({
      where: { contestId_userId: { contestId, userId: session.userId } },
    });
    if (!participant) {
      return Response.json({ error: "尚未報名此比賽" }, { status: 403 });
    }

    const started = getContestPhase(contest) !== "upcoming";
    if (!started && !contest.allowEarlyProblemDownload) {
      return Response.json(
        { error: "比賽尚未開始，題目文件還不能下載" },
        { status: 403 }
      );
    }
  }

  const cp = await prisma.contestProblem.findUnique({
    where: { contestId_label: { contestId, label } },
    include: {
      problem: {
        select: {
          title: true,
          statement: true,
          timeLimitMs: true,
          memoryLimitMb: true,
          pdfData: true,
          pdfFilename: true,
          testCases: {
            where: { isSample: true },
            orderBy: [{ order: "asc" }, { id: "asc" }],
            select: { input: true, output: true },
          },
        },
      },
    },
  });
  if (!cp) {
    return Response.json({ error: "找不到這一題" }, { status: 404 });
  }

  if (cp.problem.pdfData) {
    return new Response(new Uint8Array(cp.problem.pdfData), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(
          cp.problem.pdfFilename ?? `${label}.pdf`
        )}`,
      },
    });
  }

  const html = await renderProblemDocHtml({
    contestTitle: contest.title,
    label,
    title: cp.problem.title,
    timeLimitMs: cp.problem.timeLimitMs,
    memoryLimitMb: cp.problem.memoryLimitMb,
    statement: cp.problem.statement,
    samples: cp.problem.testCases,
  });
  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(`${label}.html`)}`,
    },
  });
}
