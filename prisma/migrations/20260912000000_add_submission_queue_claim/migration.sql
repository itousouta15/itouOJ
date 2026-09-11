-- AlterTable
ALTER TABLE "Submission" ADD COLUMN "judgeClaimedAt" DATETIME;

-- CreateIndex
CREATE INDEX "Submission_status_judgeClaimedAt_idx" ON "Submission"("status", "judgeClaimedAt");
