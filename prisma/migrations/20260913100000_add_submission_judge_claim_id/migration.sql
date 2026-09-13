-- A claim ID prevents a reclaimed job's previous worker from writing stale results.
ALTER TABLE "Submission" ADD COLUMN "judgeClaimId" TEXT;

CREATE INDEX "Submission_status_judgeClaimId_idx" ON "Submission"("status", "judgeClaimId");
