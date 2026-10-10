import { createHash } from "node:crypto";
import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import type { JudgeJob } from "@/lib/judgeCore";
import { JUDGE_JOB_BYTES, judgeJobSchema } from "@/lib/judgeWire";

type JobDatabase = Prisma.TransactionClient | PrismaClient;

export const judgeJobDigest = (job: JudgeJob) => createHash("sha256").update(JSON.stringify(job)).digest("hex");
export class JudgeJobChangedError extends Error {}

export async function assertJudgeJobCurrent(db: JobDatabase, submissionId: number, digest: string) {
  let current;
  try { current = await loadJudgeJob(db, submissionId); }
  catch (error) {
    // An edit can also make a previously valid job exceed the wire limits.
    if (error instanceof RangeError) throw new JudgeJobChangedError();
    throw error;
  }
  if (!current || judgeJobDigest(current) !== digest) throw new JudgeJobChangedError();
  return current;
}

// Explicit projection: never ship user/profile data, problem statements or PDFs.
export async function loadJudgeJob(db: JobDatabase, submissionId: number): Promise<JudgeJob | null> {
  // Keep the size preflight and relation reads on one snapshot during edits.
  const client = db as PrismaClient;
  if (typeof client.$transaction === "function") return client.$transaction((tx) => readJudgeJob(tx, submissionId));
  return readJudgeJob(db, submissionId);
}

async function readJudgeJob(db: JobDatabase, submissionId: number): Promise<JudgeJob | null> {
  // Bound database-to-memory reads before selecting potentially large test data.
  const [size] = await db.$queryRaw<{ bytes: bigint | number; count: bigint | number }[]>`
    SELECT length(CAST(s.code AS BLOB)) + COALESCE((
      SELECT SUM(length(CAST(t.input AS BLOB)) + length(CAST(t.output AS BLOB)))
      FROM TestCase t WHERE t.problemId = s.problemId), 0) AS bytes,
      (SELECT COUNT(t.id) FROM TestCase t WHERE t.problemId = s.problemId) AS count
    FROM Submission s WHERE s.id = ${submissionId}`;
  if (!size) return null;
  if (Number(size.bytes) > JUDGE_JOB_BYTES || Number(size.count) > 1000) throw new RangeError("Judge job too large");
  const row = await db.submission.findUnique({ where: { id: submissionId }, select: {
    id: true, language: true, code: true, selectedIndex: true,
    problem: { select: {
      type: true, answerIndex: true, timeLimitMs: true, memoryLimitMb: true,
      testCases: { orderBy: [{ order: "asc" }, { id: "asc" }], take: 1001,
        select: { id: true, input: true, output: true, subtaskId: true } },
      subtasks: { orderBy: { order: "asc" }, take: 101,
        select: { id: true, order: true, points: true, checkMode: true } },
    } },
  } });
  if (!row) return null;
  const { problem } = row;
  const test = (tc: typeof problem.testCases[number]) => ({ id: tc.id, input: tc.input, output: tc.output });
  const job: JudgeJob = {
    version: 1, submissionId: row.id, language: row.language, code: row.code,
    timeLimitMs: problem.timeLimitMs, memoryLimitMb: problem.memoryLimitMb,
    recognition: problem.type === "RECOGNITION" ? { selectedIndex: row.selectedIndex, answerIndex: problem.answerIndex } : null,
    hasSubtasks: problem.subtasks.length > 0,
    groups: problem.subtasks.length ? problem.subtasks.map((st) => ({
      points: st.points, subtaskOrder: st.order,
      checkMode: st.checkMode === "firstLine" ? "firstLine" : "full",
      tests: problem.testCases.filter((tc) => tc.subtaskId === st.id).map(test),
    })) : [{ points: null, subtaskOrder: null, checkMode: "full", tests: problem.testCases.map(test) }],
  };
  if (!judgeJobSchema.safeParse(job).success || Buffer.byteLength(JSON.stringify(job)) > JUDGE_JOB_BYTES) {
    throw new RangeError("Judge job exceeds protocol limits");
  }
  return job;
}
