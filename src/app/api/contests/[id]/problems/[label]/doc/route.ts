import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getContestPhase } from "@/lib/contest";
import { renderProblemDocHtml } from "@/lib/renderProblemDoc";
import { decryptPdf } from "@/lib/pdfCrypto";

// 給離線收件程式下載題目文件（有上傳 PDF 就給 PDF，沒有就現場產生 HTML）。
// 預設等開賽才給；管理員開了 allowEarlyProblemDownload 才准已報名者賽前下載。
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
          code: true,
          options: true,
          pdfData: true,
          pdfFilename: true,
          pdfPassword: true,
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
    const filename = cp.problem.pdfFilename ?? `${label}.pdf`;

    // 管理員在網站上點開是要自己看的，一律解密後給正常的 PDF。
    if (isAdmin && cp.problem.pdfPassword) {
      const plain = decryptPdf(Buffer.from(cp.problem.pdfData), cp.problem.pdfPassword);
      return new Response(new Uint8Array(plain), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(filename)}`,
        },
      });
    }

    // 選手端不解密，把密文跟密碼一起交給收件程式快取，等開賽後才自動解密。
    // 密碼用 base64 只是避免特殊字元弄壞 HTTP header，不是額外的保護。
    if (cp.problem.pdfPassword) {
      return new Response(new Uint8Array(cp.problem.pdfData), {
        headers: {
          "Content-Type": "application/octet-stream",
          "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
          "X-Itouoj-Pdf-Password-B64": Buffer.from(cp.problem.pdfPassword, "utf8").toString(
            "base64"
          ),
        },
      });
    }

    return new Response(new Uint8Array(cp.problem.pdfData), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(filename)}`,
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
    code: cp.problem.code,
    options: cp.problem.options ? JSON.parse(cp.problem.options) : null,
  });
  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(`${label}.html`)}`,
    },
  });
}
