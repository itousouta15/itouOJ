import { randomUUID } from "node:crypto";
import type { PrismaClient, Prisma } from "@/generated/prisma/client";
import type { JudgeResult } from "@/lib/judgeCore";
export type { JudgeResult } from "@/lib/judgeCore";

// judgeClaimedAt is the last successful heartbeat (not the initial start time).
// Keep the existing 15 minute lease for compatibility with deployed databases.
export const JUDGE_LEASE_MS = 15 * 60 * 1000;
export const JUDGE_HEARTBEAT_MS = 30_000;
export type JudgeClaim = { submissionId: number; claimId: string };
export type JudgeTestResult = Omit<Prisma.TestResultCreateManyInput, "id" | "submissionId">;

async function retryContention<T>(operation: () => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try { return await operation(); }
    catch (error) {
      const code = (error as { code?: string }).code;
      // Retry whole transactions, never individual statements within them.
      // P2028 can occur when a synchronous SQLite busy wait exhausts the
      // interactive transaction deadline. All these writes are replay-safe.
      if (attempt >= 4 || !["P1008", "P2034", "P2028"].includes(code ?? "")) throw error;
      await new Promise((resolve) => setTimeout(resolve, 25 * 2 ** attempt + Math.random() * 25));
    }
  }
}

export function createJudgeQueue(db: PrismaClient, clock = () => new Date(),
  timing = { leaseMs: JUDGE_LEASE_MS, heartbeatMs: JUDGE_HEARTBEAT_MS }) {
  const cutoff = () => new Date(clock().getTime() - timing.leaseMs);
  const owned = (claim: JudgeClaim): Prisma.SubmissionWhereInput => ({
    id: claim.submissionId, status: "JUDGING", judgeClaimId: claim.claimId,
    judgeClaimedAt: { gt: cutoff() },
  });
  const expired = (): Prisma.SubmissionWhereInput => ({
    status: "JUDGING",
    OR: [{ judgeClaimedAt: null }, { judgeClaimedAt: { lte: cutoff() } }],
  });
  return {
    timing,
    async recover() {
      const result = await retryContention(() => db.submission.updateMany({
        where: expired(),
        data: { status: "PENDING", judgeClaimedAt: null, judgeClaimId: null },
      }));
      if (result.count) console.info(JSON.stringify({ event: "judge.recovered", count: result.count }));
      return result;
    },
    async claim(): Promise<JudgeClaim | null> {
      // The conditional UPDATE is the linearization point. Losing contenders
      // retry; no in-memory mutex or read transaction is used across processes.
      for (let attempt = 0; attempt < 16; attempt++) {
        const next = await db.submission.findFirst({
          where: { status: "PENDING" }, orderBy: { id: "asc" }, select: { id: true },
        });
        if (!next) return null;
        const claimId = randomUUID();
        const result = await retryContention(() => db.submission.updateMany({
          where: { id: next.id, status: "PENDING" },
          data: { status: "JUDGING", judgeClaimId: claimId, judgeClaimedAt: clock() },
        }));
        if (result.count === 1) {
          console.info(JSON.stringify({ event: "judge.claimed", submissionId: next.id, claimId }));
          return { submissionId: next.id, claimId };
        }
      }
      return null;
    },
    async heartbeat(claim: JudgeClaim) {
      const result = await retryContention(() => db.submission.updateMany({
        where: owned(claim), data: { judgeClaimedAt: clock() },
      }));
      return result.count === 1;
    },
    async release(claim: JudgeClaim) {
      const result = await retryContention(() => db.submission.updateMany({
        where: owned(claim),
        data: { status: "PENDING", judgeClaimId: null, judgeClaimedAt: null },
      }));
      return result.count === 1;
    },
    async complete(claim: JudgeClaim, result: JudgeResult, tests: JudgeTestResult[] = [],
      validate?: (tx: Prisma.TransactionClient) => Promise<void>) {
      const outcome = await retryContention(() => db.$transaction(async (tx) => {
        // Write first: SQLite serializes writers before we inspect/replace results.
        const applied = await tx.submission.updateMany({
          where: owned(claim),
          data: {
            compileError: null, timeMs: null, memoryKb: null, score: null,
            ...result, judgeClaimedAt: null,
            // Retain the winning token to acknowledge duplicate delivery.
          },
        });
        if (applied.count !== 1) {
          const current = await tx.submission.findUnique({
            where: { id: claim.submissionId }, select: { status: true, judgeClaimId: true },
          });
          return current?.judgeClaimId === claim.claimId &&
            current.status !== "JUDGING" && current.status !== "PENDING"
            ? "duplicate" as const : "stale" as const;
        }
        // Validate against the current payload under the same write transaction:
        // concurrent problem edits cannot slip between validation and commit.
        await validate?.(tx);
        await tx.testResult.deleteMany({ where: { submissionId: claim.submissionId } });
        if (tests.length) await tx.testResult.createMany({
          data: tests.map((test) => ({ ...test, submissionId: claim.submissionId })),
        });
        return "applied" as const;
      }));
      console.info(JSON.stringify({ event: `judge.completion.${outcome}`, ...claim, status: result.status }));
      return outcome;
    },
    async status() {
      const [pending, judging, expiredCount, oldest, active] = await Promise.all([
        db.submission.count({ where: { status: "PENDING" } }),
        db.submission.count({ where: { status: "JUDGING" } }),
        db.submission.count({ where: expired() }),
        db.submission.findFirst({ where: { status: "PENDING" }, orderBy: { createdAt: "asc" }, select: { createdAt: true } }),
        db.submission.findMany({ where: { status: "JUDGING" }, orderBy: { id: "asc" }, take: 100,
          select: { id: true, judgeClaimedAt: true } }),
      ]);
      return { pending, judging, expired: expiredCount, ...timing, sampledAt: clock(),
        oldestPendingAgeMs: oldest ? Math.max(0, clock().getTime() - oldest.createdAt.getTime()) : null,
        active: active.map((row) => ({ submissionId: row.id, heartbeatAt: row.judgeClaimedAt,
          leaseExpiresAt: row.judgeClaimedAt ? new Date(row.judgeClaimedAt.getTime() + timing.leaseMs) : null })),
      };
    },
  };
}

// Serialized heartbeats continue while compile/execute is awaiting the sandbox.
// A failed heartbeat fences this invocation locally; SQL remains authoritative.
export function startJudgeHeartbeat(renew: () => Promise<boolean>, intervalMs = JUDGE_HEARTBEAT_MS, onLost?: () => void) {
  let lost = false;
  let stopped = false;
  let timer: ReturnType<typeof setTimeout>;
  let pending: Promise<void> = Promise.resolve();
  const schedule = () => {
    timer = setTimeout(() => {
      pending = (async () => {
        try { lost = !(await renew()); }
        catch { lost = true; }
        if (lost) {
          console.warn(JSON.stringify({ event: "judge.heartbeat_lost" }));
          onLost?.();
        }
        if (!stopped && !lost) schedule();
      })();
    }, intervalMs);
    timer.unref?.();
  };
  schedule();
  return { isLost: () => lost, async stop() { stopped = true; clearTimeout(timer); await pending; } };
}
