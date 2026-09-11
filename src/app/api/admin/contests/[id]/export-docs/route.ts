import JSZip from "jszip";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { renderProblemDocHtml } from "@/lib/renderProblemDoc";
import { decryptPdf } from "@/lib/pdfCrypto";

// 管理員專用：把整場題目打包成可離線開啟的 ZIP（PDF 或內嵌字型的 HTML）。
// 管理員本來就看得到全部題目，所以不套用開賽前防洩題的限制。
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
    // 有正式 PDF 就用那份（管理員自己要看，加密的一律先解密），沒有才現場產生 HTML。
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
      code: cp.problem.code,
      options: cp.problem.options
        ? JSON.parse(cp.problem.options)
        : null,
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
