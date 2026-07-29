import JSZip from "jszip";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { renderProblemDocHtml } from "@/lib/renderProblemDoc";
import { decryptPdf } from "@/lib/pdfCrypto";

// 管理員專用：把一場比賽的題目打包成一份 ZIP，裡面是可離線開啟的 <代號>.html
// （字型內嵌，不用另外帶字型檔）。用來取代「跑 scripts/export-problems.mjs」
// 這個命令列流程——管理員在網站上點一下就能拿到，不必自己架開發環境。
//
// 這裡刻意不管比賽是否已經開始：管理員本來就看得到全部題目內容，
// 跟 /api/contests/[id]/problems 給一般選手的版本（開賽前不給題目內容，
// 防洩題）是兩回事，不能混用同一套權限邏輯。
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (session?.role !== "ADMIN") {
    return Response.json({ error: "需要管理員權限" }, { status: 403 });
  }

  const { id } = await params;
  const contestId = Number(id);
  if (!Number.isInteger(contestId)) {
    return Response.json({ error: "比賽不存在" }, { status: 404 });
  }

  const contest = await prisma.contest.findUnique({
    where: { id: contestId },
    include: {
      problems: {
        orderBy: [{ order: "asc" }, { id: "asc" }],
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
      },
    },
  });
  if (!contest) {
    return Response.json({ error: "比賽不存在" }, { status: 404 });
  }
  if (contest.problems.length === 0) {
    return Response.json({ error: "這場比賽還沒有題目" }, { status: 400 });
  }

  const zip = new JSZip();
  for (const cp of contest.problems) {
    // 題目有上傳正式 PDF 的話用那份，跟單題下載（/api/contests/[id]/problems/[label]/doc）
    // 邏輯一致；沒有才現場產生 HTML。管理員在網站上抓下來是要自己看/列印的，
    // 有設密碼保護也要解密後才給，不然管理員自己都打不開。
    if (cp.problem.pdfData) {
      const bytes = cp.problem.pdfPassword
        ? decryptPdf(Buffer.from(cp.problem.pdfData), cp.problem.pdfPassword)
        : Buffer.from(cp.problem.pdfData);
      zip.file(`${cp.label}.pdf`, bytes);
      continue;
    }
    const html = await renderProblemDocHtml({
      contestTitle: contest.title,
      label: cp.label,
      title: cp.problem.title,
      timeLimitMs: cp.problem.timeLimitMs,
      memoryLimitMb: cp.problem.memoryLimitMb,
      statement: cp.problem.statement,
      samples: cp.problem.testCases,
    });
    zip.file(`${cp.label}.html`, html);
  }

  const buffer = await zip.generateAsync({ type: "nodebuffer" });
  const filename = `${contest.title}-題目.zip`;

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
    },
  });
}
