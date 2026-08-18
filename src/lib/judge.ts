import { prisma } from "@/lib/db";
import { LANGUAGES, isLanguageKey } from "@/lib/languages";
import { execute } from "@/lib/execute";

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

// 存進 TestResult.actualOutput 的長度上限，避免異常輸出（例如無窮迴圈狂印）
// 把資料庫灌爆——只是拿來給學生對答案用，不需要完整內容。
const MAX_ACTUAL_OUTPUT_LEN = 4000;

function truncateOutput(text: string): string {
  if (text.length <= MAX_ACTUAL_OUTPUT_LEN) return text;
  return text.slice(0, MAX_ACTUAL_OUTPUT_LEN) + "\n...(輸出過長，已截斷)";
}

// 比對輸出：每行去掉行尾空白、忽略結尾空行（一般 OJ 慣例）
export function normalizeOutput(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.replace(/[ \t]+$/g, ""))
    .join("\n")
    .replace(/\n+$/g, "");
}

// 單筆測資的判定（判題與測試執行共用）
// checkMode: full = 完整比對輸出；firstLine = 只比對輸出第一行，其餘內容忽略
// （對應子題「只要某一行對就給分、後面明細寫錯不扣分」這種配分規則）
export function runVerdict(
  run: import("@/lib/piston").PistonPhase,
  timeLimitMs: number,
  memoryLimitBytes: number,
  expected: string,
  checkMode: "full" | "firstLine" = "full",
): string {
  if (run.signal === "SIGKILL") {
    // 被沙箱砍掉：看是撞到時間還是記憶體上限
    if (run.wall_time >= timeLimitMs || run.cpu_time >= timeLimitMs) {
      return "TLE";
    }
    return "MLE"; // OOM killer 常常在數值到頂前就動手
  }
  if (run.code !== 0) return "RE";

  const actual = normalizeOutput(run.stdout);
  const want = normalizeOutput(expected);
  if (checkMode === "firstLine") {
    return actual.split("\n")[0] === want.split("\n")[0] ? "AC" : "WA";
  }
  return actual === want ? "AC" : "WA";
}

async function judgeSubmission(submissionId: number) {
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: {
      problem: {
        include: {
          testCases: { orderBy: [{ order: "asc" }, { id: "asc" }] },
          subtasks: {
            orderBy: { order: "asc" },
            include: {
              testCases: { orderBy: [{ order: "asc" }, { id: "asc" }] },
            },
          },
        },
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

  const hasSubtasks = problem.subtasks.length > 0;
  // 沒有子題就沿用舊制：所有測資當成單一群組，遇到第一筆失敗就整題停止。
  // 有子題則每個子題各自跑完自己的測資（子題內遇到失敗就跳到下一個子題），
  // 全對的子題才拿到該子題配分，最後加總成 score。
  const groups = hasSubtasks
    ? problem.subtasks.map((st) => ({
        testCases: st.testCases,
        points: st.points,
        checkMode:
          st.checkMode === "firstLine"
            ? ("firstLine" as const)
            : ("full" as const),
        subtaskOrder: st.order as number | null,
      }))
    : [
        {
          testCases: problem.testCases,
          points: null as number | null,
          checkMode: "full" as const,
          subtaskOrder: null as number | null,
        },
      ];

  let overall = "AC";
  let maxTimeMs = 0;
  let maxMemoryKb = 0;
  let score = hasSubtasks ? 0 : null;
  let resultOrder = 0;
  // 同一筆 submission、不同測資的原始碼完全相同，第一筆測資編譯出來的
  // 執行檔記下來，後面測資直接重用，不用每筆都重新編譯一次
  // （sandbox-runner 才吃這個欄位；Piston 語言就一直是 undefined，execute()
  // 會忽略它，行為跟原本一樣）。
  let compiledBinary: string | undefined;

  try {
    for (const group of groups) {
      let groupPassed = true;

      for (const tc of group.testCases) {
        resultOrder++;
        const result = await execute(submission.language, {
          language: lang.piston,
          version: lang.version,
          filename: lang.filename,
          code: submission.code,
          stdin: tc.input,
          runTimeoutMs: timeLimitMs,
          runMemoryLimitBytes: memoryLimitBytes,
          precompiledBinary: compiledBinary,
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
        if (!compiledBinary && result.compiled_binary) {
          compiledBinary = result.compiled_binary;
        }

        const run = result.run;
        const timeMs = Math.round(run.cpu_time ?? run.wall_time ?? 0);
        const memoryKb = Math.round((run.memory ?? 0) / 1024);
        maxTimeMs = Math.max(maxTimeMs, timeMs);
        maxMemoryKb = Math.max(maxMemoryKb, memoryKb);

        const verdict = runVerdict(
          run,
          timeLimitMs,
          memoryLimitBytes,
          tc.output,
          group.checkMode,
        );

        await prisma.testResult.create({
          data: {
            submissionId,
            order: resultOrder,
            subtaskOrder: group.subtaskOrder,
            verdict,
            timeMs,
            memoryKb,
            testCaseId: tc.id,
            actualOutput: truncateOutput(run.stdout),
          },
        });

        if (verdict !== "AC") {
          groupPassed = false;
          if (overall === "AC") overall = verdict; // 只記錄最早遇到的失敗
          break; // 慣例：子題（或整題）內遇到第一筆失敗就停，換下一組
        }
      }

      if (hasSubtasks && groupPassed) score! += group.points!;
    }

    await prisma.submission.update({
      where: { id: submissionId },
      data: {
        status: overall,
        timeMs: maxTimeMs,
        memoryKb: maxMemoryKb,
        score,
      },
    });
  } catch (err) {
    console.error(`[judge] submission ${submissionId} internal error:`, err);
    await prisma.submission.update({
      where: { id: submissionId },
      data: { status: "IE", compileError: "評測系統內部錯誤，請稍後重新提交" },
    });
  }
}
