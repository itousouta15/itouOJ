import { z } from "zod";
import { immediateJudgeResult, summarizeJudgeTests, type JudgeJob, type JudgeOutcome } from "@/lib/judgeCore";

export const JUDGE_JOB_BYTES = 16 * 1024 * 1024;
export const JUDGE_RESULT_BYTES = 16 * 1024 * 1024;
const integer = z.number().int().min(0).max(2147483647);
const id = integer.positive();
const verdict = z.enum(["AC", "WA", "TLE", "MLE", "RE"]);
export const judgeClaimSchema = z.object({ submissionId: id, claimId: z.uuid() }).strict();
export const judgeWorkerSchema = z.object({ workerId: z.string().min(1).max(128).regex(/^[\w.:-]+$/) }).strict();
export const judgeIdleSchema = z.object({ protocolVersion: z.literal(1), claim: z.null() }).strict();
export const judgeJobSchema = z.object({
  version: z.literal(1), submissionId: id, language: z.string().min(1).max(32), code: z.string().max(100_000),
  timeLimitMs: integer.min(1).max(60_000), memoryLimitMb: integer.min(1).max(4096),
  recognition: z.object({ selectedIndex: integer.nullable(), answerIndex: integer.nullable() }).strict().nullable(),
  hasSubtasks: z.boolean(),
  groups: z.array(z.object({
    points: integer.max(10000).nullable(), subtaskOrder: integer.nullable(), checkMode: z.enum(["full", "firstLine"]),
    tests: z.array(z.object({ id, input: z.string().max(JUDGE_JOB_BYTES), output: z.string().max(JUDGE_JOB_BYTES) }).strict()).max(1000),
  }).strict()).max(100),
}).strict().refine((job) => job.groups.reduce((n, group) => n + group.tests.length, 0) <= 1000);
export const judgeOutcomeSchema = z.object({
  result: z.object({
    status: z.enum(["AC", "WA", "TLE", "MLE", "RE", "CE", "IE"]),
    score: integer.nullable().optional(), timeMs: integer.nullable().optional(), memoryKb: integer.nullable().optional(),
    compileError: z.string().max(16_000).nullable().optional(),
  }).strict(),
  tests: z.array(z.object({
    order: id, subtaskOrder: integer.nullable(), verdict, timeMs: integer.nullable(), memoryKb: integer.nullable(),
    testCaseId: id, actualOutput: z.string().max(4096),
  }).strict()).max(1000),
}).strict();
export const judgeCompleteSchema = judgeClaimSchema.extend({
  jobDigest: z.string().regex(/^[a-f0-9]{64}$/), outcome: judgeOutcomeSchema,
}).strict();
export const judgeFailSchema = judgeClaimSchema.extend({
  reason: z.enum(["sandbox_unavailable", "worker_error", "shutdown"]),
  retryable: z.boolean(),
}).strict();
export const judgeAssignmentSchema = z.object({
  protocolVersion: z.literal(1), claim: judgeClaimSchema, job: judgeJobSchema,
  jobDigest: z.string().regex(/^[a-f0-9]{64}$/), leaseMs: integer.min(100), heartbeatMs: integer.min(10),
}).strict().refine((value) => value.claim.submissionId === value.job.submissionId && value.heartbeatMs < value.leaseMs / 2);

export class JudgeProtocolError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

// Stream limit applies even without Content-Length. Cancel on slow/oversize
// bodies; never echo payloads or Zod diagnostics containing hidden test data.
export async function readJudgeJson(source: Request | Response, limit: number): Promise<unknown> {
  if (Number(source.headers.get("content-length")) > limit) {
    await source.body?.cancel().catch(() => {});
    throw new JudgeProtocolError(413, "Payload too large");
  }
  const reader = source.body?.getReader();
  if (!reader) throw new JudgeProtocolError(400, "JSON body required");
  let timedOut = false;
  const timer = setTimeout(() => { timedOut = true; void reader.cancel().catch(() => {}); }, 15_000);
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (timedOut) throw new JudgeProtocolError(408, "Body timeout");
      if (done) break;
      size += value.byteLength;
      if (size > limit) throw new JudgeProtocolError(413, "Payload too large");
      chunks.push(value);
    }
    try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); }
    catch { throw new JudgeProtocolError(400, "Invalid JSON"); }
  } finally {
    clearTimeout(timer);
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}

export function validateJudgeOutcome(job: JudgeJob, outcome: JudgeOutcome) {
  const immediate = immediateJudgeResult(job);
  const terminal = outcome.result.status === "CE" || outcome.result.status === "IE";
  if ((immediate || terminal) && outcome.tests.length) throw new Error("Unexpected test results");
  const expected = immediate ?? (terminal ? { status: outcome.result.status, compileError: outcome.result.compileError }
    : summarizeJudgeTests(job, outcome.tests));
  for (const key of ["status", "score", "timeMs", "memoryKb", "compileError"] as const) {
    if ((expected[key] ?? null) !== (outcome.result[key] ?? null)) throw new Error("Inconsistent summary");
  }
}
