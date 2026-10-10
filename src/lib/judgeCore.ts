import { LANGUAGES, isLanguageKey } from "@/lib/languages";
import { executionCode } from "@/lib/itoulang";
import type { ExecutionPhase, sandboxExecute } from "@/lib/sandbox";
import { compileFailed, executionTimeMs, SandboxInfrastructureError } from "@/lib/sandboxProtocol";

export type Verdict = "AC" | "WA" | "TLE" | "MLE" | "RE";
export type JudgeResult = {
  status: Verdict | "CE" | "IE";
  score?: number | null;
  timeMs?: number | null;
  memoryKb?: number | null;
  compileError?: string | null;
};
export type JudgeTestResult = {
  order: number;
  subtaskOrder: number | null;
  verdict: Verdict;
  timeMs: number | null;
  memoryKb: number | null;
  testCaseId: number;
  actualOutput: string;
};
export type JudgeJob = {
  version: 1;
  submissionId: number;
  language: string;
  code: string;
  timeLimitMs: number;
  memoryLimitMb: number;
  recognition: { selectedIndex: number | null; answerIndex: number | null } | null;
  hasSubtasks: boolean;
  groups: {
    points: number | null;
    subtaskOrder: number | null;
    checkMode: "full" | "firstLine";
    tests: { id: number; input: string; output: string }[];
  }[];
};
export type JudgeOutcome = { result: JudgeResult; tests: JudgeTestResult[] };

function truncateOutput(text: string) {
  const notice = "\n...(輸出過長，已截斷)";
  // Control characters expand to six bytes in JSON. A character limit alone
  // can overflow the 16 MiB completion envelope with 1,000 successful tests.
  const fits = (value: string) => Buffer.byteLength(JSON.stringify(value)) <= 12_000;
  if (text.length <= 4000 && fits(text)) return text;
  let low = 0, high = Math.min(text.length, 4000);
  while (low < high) {
    const mid = Math.ceil((low + high) / 2);
    if (fits(text.slice(0, mid) + notice)) low = mid;
    else high = mid - 1;
  }
  return text.slice(0, low) + notice;
}

export function normalizeOutput(text: string): string {
  return text.replace(/\r\n/g, "\n").split("\n")
    .map((line) => line.replace(/[ \t]+$/g, "")).join("\n").replace(/\n+$/g, "");
}

export function runVerdict(
  run: ExecutionPhase, timeLimitMs: number, _memoryLimitBytes: number,
  expected: string, checkMode: "full" | "firstLine" = "full",
): Verdict {
  if (run.termination) {
    switch (run.termination.cause) {
      case "wall_timeout": return "TLE";
      case "oom_kill": return "MLE";
      case "nonzero_exit": case "sigsys": return "RE";
      case "signal":
        if (run.termination.signal_number === 9) throw new SandboxInfrastructureError("Unattributed SIGKILL");
        return "RE";
      case "exit": break;
      default: throw new SandboxInfrastructureError("Sandbox execution evidence unavailable");
    }
  } else if (run.signal === "SIGKILL") {
    // Compatibility only: old sandbox-runner has no termination evidence and
    // overloads signals/exit codes. Do not apply this heuristic to schema 1.
    return (run.wall_time !== null && run.wall_time >= timeLimitMs) ||
      (run.cpu_time !== null && run.cpu_time >= timeLimitMs) ? "TLE" : "MLE";
  }
  if (run.code !== 0) return "RE";
  const actual = normalizeOutput(run.stdout);
  const want = normalizeOutput(expected);
  return (checkMode === "firstLine" ? actual.split("\n")[0] === want.split("\n")[0] : actual === want) ? "AC" : "WA";
}

// Shared by execution and coordinator validation. Enforce complete, correctly
// ordered group prefixes: each group ends at its first failure, or runs fully.
export function summarizeJudgeTests(job: JudgeJob, tests: JudgeTestResult[]): JudgeResult {
  let cursor = 0;
  let status: Verdict = "AC";
  let score = job.hasSubtasks ? 0 : null;
  let timeMs: number | null = 0;
  let memoryKb: number | null = 0;
  for (const group of job.groups) {
    let passed = true;
    for (const tc of group.tests) {
      const test = tests[cursor++];
      if (!test || test.order !== cursor || test.testCaseId !== tc.id || test.subtaskOrder !== group.subtaskOrder) {
        throw new Error("Invalid test sequence");
      }
      timeMs = timeMs === null || test.timeMs === null ? null : Math.max(timeMs, test.timeMs);
      memoryKb = memoryKb === null || test.memoryKb === null ? null : Math.max(memoryKb, test.memoryKb);
      if (test.verdict !== "AC") {
        if (status === "AC") status = test.verdict;
        passed = false;
        break;
      }
    }
    if (score !== null && passed) score += group.points ?? 0;
  }
  if (cursor !== tests.length) throw new Error("Unexpected test results");
  return { status, score, timeMs, memoryKb };
}

export function immediateJudgeResult(job: JudgeJob): JudgeResult | null {
  if (job.recognition) {
    const correct = job.recognition.selectedIndex !== null &&
      job.recognition.selectedIndex === job.recognition.answerIndex;
    return { status: correct ? "AC" : "WA", score: correct ? 100 : 0 };
  }
  if (!Object.hasOwn(LANGUAGES, job.language) || !isLanguageKey(job.language)) {
    return { status: "IE", compileError: "不支援的語言" };
  }
  if (!job.groups.some((group) => group.tests.length)) return { status: "IE", compileError: "此題目沒有測資" };
  return null;
}

// No database, Next APIs, secrets or transport ownership in the evaluation core.
export async function evaluateJudgeJob(
  job: JudgeJob, execute: typeof sandboxExecute, signal?: AbortSignal,
): Promise<JudgeOutcome> {
  signal?.throwIfAborted();
  const immediate = immediateJudgeResult(job);
  if (immediate) return { result: immediate, tests: [] };
  if (!isLanguageKey(job.language)) throw new Error("Unsupported language");
  const lang = LANGUAGES[job.language];
  const timeLimitMs = job.timeLimitMs * lang.timeMultiplier;
  const memoryLimitBytes = job.memoryLimitMb * lang.memoryMultiplier * 1024 * 1024;
  const tests: JudgeTestResult[] = [];
  let compiledHandle: string | undefined;
  let compiledBinary: string | undefined;
  for (const group of job.groups) {
    for (const tc of group.tests) {
      signal?.throwIfAborted();
      const execution = await execute({
        language: lang.runtime, version: lang.version, filename: lang.filename,
        code: executionCode(job.language, job.code), stdin: tc.input, runTimeoutMs: timeLimitMs,
        runMemoryLimitBytes: memoryLimitBytes, compiledHandle,
        precompiledBinary: compiledBinary, priority: "judge", signal,
      });
      signal?.throwIfAborted();
      if (compileFailed(execution)) {
        return { result: { status: "CE", compileError:
          (execution.compile?.stderr || execution.compile?.output || "編譯失敗").slice(0, 16_000) }, tests: [] };
      }
      compiledHandle = execution.compiled_handle;
      // Legacy sandboxes return the binary after compiling, but need not echo
      // it when executing a precompiled binary on subsequent tests.
      compiledBinary = compiledHandle ? undefined : execution.compiled_binary ?? compiledBinary;
      const run = execution.run;
      const verdict = runVerdict(run, timeLimitMs, memoryLimitBytes, tc.output, group.checkMode);
      tests.push({
        order: tests.length + 1, subtaskOrder: group.subtaskOrder, testCaseId: tc.id, verdict,
        timeMs: executionTimeMs(run),
        memoryKb: run.memory === null ? null : Math.round(run.memory / 1024),
        actualOutput: truncateOutput(run.stdout),
      });
      if (verdict !== "AC") break;
    }
  }
  return { result: summarizeJudgeTests(job, tests), tests };
}
