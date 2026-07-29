import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getContestPhase } from "@/lib/contest";
import { renderProblemDocHtml } from "@/lib/renderProblemDoc";
import { decryptPdf } from "@/lib/pdfCrypto";

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

    // 選手端：有設密碼保護的話，這裡故意不解密——直接把加密過的位元組連同
    // 密碼一起交給收件程式，讓它存到本機快取。這樣賽前就算開了
    // allowEarlyProblemDownload 提早佈署，機器上放的也只是打不開的密文，
    // 收件程式要等真的開賽（Flow 判斷過了 Waiting 階段）才會自動解密開啟。
    // 密碼經 base64 包一層純粹是避免密碼裡的特殊字元讓 HTTP header 出問題，
    // 不是額外的保護——這個功能本來就假設密碼在下載當下就會落到選手機上。
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
  });
  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(`${label}.html`)}`,
    },
  });
}
