import { prisma } from "@/lib/db";
import { LANGUAGES, isLanguageKey } from "@/lib/languages";
import { pistonExecute } from "@/lib/piston";

// 單機用的循序判題佇列：用 promise chain 串起來，
// 同一時間只有一筆提交在跑，避免把 4 核心的機器壓垮。
// 存在 globalThis 上，dev 模式熱重載時不會產生多條佇列。
const globalForJudge = globalThis as unknown as { judgeChain?: Promise<void> };

export function enqueueSubmission(submissionId: number) {
  const chain = globalForJudge.judgeChain ?? Promise.resolve();
  globalForJudge.judgeChain = chain
    .then(() => judgeSubmission(submissionId))
    .catch((err) => {
      console.error(`[judge] submission ${submissionId} failed:`, err);
    });
}

// 伺服器啟動時把上次沒判完的提交撿回來（instrumentation.ts 會呼叫）
export async function resumePendingSubmissions() {
  const pending = await prisma.submission.findMany({
    where: { status: { in: ["PENDING", "JUDGING"] } },
    orderBy: { id: "asc" },
    select: { id: true },
  });
  for (const s of pending) enqueueSubmission(s.id);
  if (pending.length > 0) {
    console.log(`[judge] resumed ${pending.length} pending submission(s)`);
  }
}

// 比對輸出：每行去掉行尾空白、忽略結尾空行（一般 OJ 慣例）
function normalizeOutput(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.replace(/[ \t]+$/g, ""))
    .join("\n")
    .replace(/\n+$/g, "");
}

async function judgeSubmission(submissionId: number) {
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: {
      problem: {
        include: { testCases: { orderBy: [{ order: "asc" }, { id: "asc" }] } },
      },
    },
  });
  if (!submission) return;
  // 被重新排入但其實已判完（例如重啟後重複 enqueue）就跳過
  if (!["PENDING", "JUDGING"].includes(submission.status)) return;

  if (!isLanguageKey(submission.language)) {
    await prisma.submission.update({
      where: { id: submissionId },
      data: { status: "IE", compileError: "不支援的語言" },
    });
    return;
  }
  const lang = LANGUAGES[submission.language];
  const { problem } = submission;

  if (problem.testCases.length === 0) {
    await prisma.submission.update({
      where: { id: submissionId },
      data: { status: "IE", compileError: "此題目沒有測資" },
    });
    return;
  }

  await prisma.submission.update({
    where: { id: submissionId },
    data: { status: "JUDGING" },
  });
  await prisma.testResult.deleteMany({ where: { submissionId } });

  const timeLimitMs = problem.timeLimitMs * lang.timeMultiplier;
  const memoryLimitBytes =
    problem.memoryLimitMb * lang.memoryMultiplier * 1024 * 1024;

  let overall = "AC";
  let maxTimeMs = 0;
  let maxMemoryKb = 0;

  try {
    for (let i = 0; i < problem.testCases.length; i++) {
      const tc = problem.testCases[i];
      const result = await pistonExecute({
        language: lang.piston,
        version: lang.version,
        filename: lang.filename,
        code: submission.code,
        stdin: tc.input,
        runTimeoutMs: timeLimitMs,
        runMemoryLimitBytes: memoryLimitBytes,
      });

      // 編譯失敗 → CE，直接結束
      if (result.compile && result.compile.code !== 0) {
        await prisma.submission.update({
          where: { id: submissionId },
          data: {
            status: "CE",
            compileError:
              result.compile.stderr || result.compile.output || "編譯失敗",
          },
        });
        return;
      }

      const run = result.run;
      const timeMs = Math.round(run.cpu_time ?? run.wall_time ?? 0);
      const memoryKb = Math.round((run.memory ?? 0) / 1024);
      maxTimeMs = Math.max(maxTimeMs, timeMs);
      maxMemoryKb = Math.max(maxMemoryKb, memoryKb);

      let verdict: string;
      if (run.signal === "SIGKILL") {
        // 被沙箱砍掉：看是撞到時間還是記憶體上限
        if (run.wall_time >= timeLimitMs || run.cpu_time >= timeLimitMs) {
          verdict = "TLE";
        } else if (run.memory !== null && run.memory >= memoryLimitBytes) {
          verdict = "MLE";
        } else {
          verdict = "MLE"; // OOM killer 常常在數值到頂前就動手
        }
      } else if (run.code !== 0) {
        verdict = "RE";
      } else {
        verdict =
          normalizeOutput(run.stdout) === normalizeOutput(tc.output)
            ? "AC"
            : "WA";
      }

      await prisma.testResult.create({
        data: {
          submissionId,
          order: i + 1,
          verdict,
          timeMs,
          memoryKb,
        },
      });

      if (verdict !== "AC") {
        overall = verdict;
        break; // 慣例：遇到第一筆失敗就停
      }
    }

    await prisma.submission.update({
      where: { id: submissionId },
      data: { status: overall, timeMs: maxTimeMs, memoryKb: maxMemoryKb },
    });
  } catch (err) {
    console.error(`[judge] submission ${submissionId} internal error:`, err);
    await prisma.submission.update({
      where: { id: submissionId },
      data: { status: "IE", compileError: "評測系統內部錯誤，請稍後重新提交" },
    });
  }
}
