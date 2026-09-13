import { prisma } from "@/lib/db";
import { LANGUAGES, isLanguageKey } from "@/lib/languages";
import { execute } from "@/lib/execute";
import { randomUUID } from "node:crypto";

// Worker 透過資料庫的狀態轉換領取工作；同一筆提交只能被一個有效 claim 寫入。
const STALE_CLAIM_MS = 15 * 60 * 1000;

type JudgeClaim = { submissionId: number; claimId: string };

export async function claimNextSubmission(): Promise<JudgeClaim | null> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const next = await prisma.submission.findFirst({
      where: { status: "PENDING" },
      orderBy: { id: "asc" },
      select: { id: true },
    });
    if (!next) return null;

    const claimId = randomUUID();
    const claimed = await prisma.submission.updateMany({
      where: { id: next.id, status: "PENDING" },
      data: { status: "JUDGING", judgeClaimedAt: new Date(), judgeClaimId: claimId },
    });
    if (claimed.count === 1) return { submissionId: next.id, claimId };
  }
  return null;
}

export async function recoverStaleJudgingSubmissions(now = new Date()) {
  return prisma.submission.updateMany({
    where: {
      status: "JUDGING",
      OR: [
        { judgeClaimedAt: null },
        { judgeClaimedAt: { lt: new Date(now.getTime() - STALE_CLAIM_MS) } },
      ],
    },
    data: { status: "PENDING", judgeClaimedAt: null, judgeClaimId: null },
  });
}

export async function getQueueSnapshot(submissionId: number) {
  const [ahead, judging] = await Promise.all([
    prisma.submission.count({ where: { status: "PENDING", id: { lt: submissionId } } }),
    prisma.submission.count({ where: { status: "JUDGING" } }),
  ]);
  return { position: ahead + 1, workAhead: ahead + judging };
}

export async function claimAndJudgeOne(): Promise<number | null> {
  const claim = await claimNextSubmission();
  if (!claim) return null;
  await judgeSubmission(claim.submissionId, claim.claimId);
  return claim.submissionId;
}

// Worker 啟動與每次取工作前都會回收逾期 claim。
export async function resumePendingSubmissions() {
  return recoverStaleJudgingSubmissions();
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

// 單筆測資的判定（判題與測試執行共用）。checkMode=firstLine 只比第一行，
// 對應「只要某一行對就給分、後面明細寫錯不扣分」的子題配分規則。
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

async function refreshClaim(submissionId: number, claimId: string) {
  const result = await prisma.submission.updateMany({
    where: { id: submissionId, status: "JUDGING", judgeClaimId: claimId },
    data: { judgeClaimedAt: new Date() },
  });
  return result.count === 1;
}

export async function judgeSubmission(submissionId: number, claimId: string) {
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
  if (submission.status !== "JUDGING" || submission.judgeClaimId !== claimId) return;

  // 識別題在提交 API 就即時判定、不進判題佇列；萬一被排進來（例如舊資料
  // 重啟後被 resume 撿到），這裡直接補判，避免卡在 PENDING。
  if (submission.problem.type === "RECOGNITION") {
    const correct = submission.selectedIndex === submission.problem.answerIndex;
    await prisma.submission.updateMany({
      where: { id: submissionId, status: "JUDGING", judgeClaimId: claimId },
      data: {
        status: correct ? "AC" : "WA",
        score: correct ? 100 : 0,
        judgeClaimedAt: null,
        judgeClaimId: null,
      },
    });
    return;
  }

  if (!isLanguageKey(submission.language)) {
    await prisma.submission.updateMany({
      where: { id: submissionId, status: "JUDGING", judgeClaimId: claimId },
      data: { status: "IE", compileError: "不支援的語言", judgeClaimedAt: null, judgeClaimId: null },
    });
    return;
  }
  const lang = LANGUAGES[submission.language];
  const { problem } = submission;

  if (problem.testCases.length === 0) {
    await prisma.submission.updateMany({
      where: { id: submissionId, status: "JUDGING", judgeClaimId: claimId },
      data: { status: "IE", compileError: "此題目沒有測資", judgeClaimedAt: null, judgeClaimId: null },
    });
    return;
  }

  const started = await prisma.$transaction(async (tx) => {
    const claim = await tx.submission.updateMany({
      where: { id: submissionId, status: "JUDGING", judgeClaimId: claimId },
      data: { judgeClaimedAt: new Date() },
    });
    if (claim.count !== 1) return false;
    await tx.testResult.deleteMany({ where: { submissionId } });
    return true;
  });
  if (!started) return;

  const timeLimitMs = problem.timeLimitMs * lang.timeMultiplier;
  const memoryLimitBytes =
    problem.memoryLimitMb * lang.memoryMultiplier * 1024 * 1024;

  const hasSubtasks = problem.subtasks.length > 0;
  // 沒有子題就把所有測資當一組，第一筆失敗就整題停；有子題則各子題獨立跑，
  // 全對才拿該子題配分，最後加總成 score。
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
  // 同一筆 submission 的原始碼相同，第一筆測資編譯出來的執行檔記下來，
  // 後面測資直接重用，不用每筆重編（只有 sandbox-runner 吃這個欄位）。
  let compiledBinary: string | undefined;

  try {
    for (const group of groups) {
      let groupPassed = true;

      for (const tc of group.testCases) {
        if (!(await refreshClaim(submissionId, claimId))) return;
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
          await prisma.submission.updateMany({
            where: { id: submissionId, status: "JUDGING", judgeClaimId: claimId },
            data: {
              status: "CE",
              judgeClaimedAt: null,
              judgeClaimId: null,
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

        const persisted = await prisma.$transaction(async (tx) => {
          const claim = await tx.submission.updateMany({
            where: { id: submissionId, status: "JUDGING", judgeClaimId: claimId },
            data: { judgeClaimedAt: new Date() },
          });
          if (claim.count !== 1) return false;
          await tx.testResult.create({
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
          return true;
        });
        if (!persisted) return;

        if (verdict !== "AC") {
          groupPassed = false;
          if (overall === "AC") overall = verdict; // 只記錄最早遇到的失敗
          break; // 慣例：子題（或整題）內遇到第一筆失敗就停，換下一組
        }
      }

      if (hasSubtasks && groupPassed) score! += group.points!;
    }

    await prisma.submission.updateMany({
      where: { id: submissionId, status: "JUDGING", judgeClaimId: claimId },
      data: {
        status: overall,
        timeMs: maxTimeMs,
        memoryKb: maxMemoryKb,
        score,
        judgeClaimedAt: null,
        judgeClaimId: null,
      },
    });
  } catch (err) {
    console.error(`[judge] submission ${submissionId} internal error:`, err);
    await prisma.submission.updateMany({
      where: { id: submissionId, status: "JUDGING", judgeClaimId: claimId },
      data: {
        status: "IE",
        compileError: "評測系統內部錯誤，請稍後重新提交",
        judgeClaimedAt: null,
        judgeClaimId: null,
      },
    });
  }
}
