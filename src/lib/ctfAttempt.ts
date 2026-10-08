import type { PrismaClient } from "@/generated/prisma/client";
import { verifyCtfFlag } from "@/lib/ctfFlag";

export class CtfAttemptError extends Error {
  constructor(message: string, public readonly status: number) { super(message); }
}

// Injecting the client lets integration tests exercise the production transaction
// with separate processes/connections to the same disposable SQLite database.
export async function submitCtfAttempt(db: PrismaClient, userId: string, challengeId: number, flag: string) {
  const challenge = await db.ctfChallenge.findUnique({
    where: { id: challengeId },
    select: { isPublic: true, flagSalt: true, flagHash: true },
  });
  if (!challenge?.isPublic) throw new CtfAttemptError("題目不存在", 404);
  const key = { userId, challengeId };
  if (await db.ctfSolve.findUnique({ where: { userId_challengeId: key }, select: { id: true } })) {
    return "already_solved" as const;
  }
  const correct = await verifyCtfFlag(flag, challenge.flagSalt, challenge.flagHash);
  try {
    return await db.$transaction(async (tx) => {
      // Acquire SQLite's write lock before reading mutable state. A no-op update
      // avoids a read-to-write lock upgrade race across independent connections.
      const current = await tx.$executeRaw`
        UPDATE "CtfChallenge" SET "flagHash" = "flagHash"
        WHERE "id" = ${challengeId} AND "isPublic" = 1
          AND "flagHash" = ${challenge.flagHash} AND "flagSalt" = ${challenge.flagSalt}
      `;
      if (current !== 1) throw new CtfAttemptError("題目狀態已變更，請重新載入後再提交", 409);
      if (await tx.ctfSolve.findUnique({ where: { userId_challengeId: key }, select: { id: true } })) {
        return "already_solved" as const;
      }
      if (correct) await tx.ctfSolve.create({ data: key });
      await tx.ctfAttempt.create({ data: { ...key, result: correct ? "CORRECT" : "INCORRECT" } });
      return correct ? "correct" as const : "incorrect" as const;
    });
  } catch (error) {
    // A unique conflict is idempotent only if this exact solve now exists.
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002" &&
      await db.ctfSolve.findUnique({ where: { userId_challengeId: key }, select: { id: true } })) {
      return "already_solved" as const;
    }
    throw error;
  }
}
