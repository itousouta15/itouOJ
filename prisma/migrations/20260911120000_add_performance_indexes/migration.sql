-- CreateIndex
CREATE INDEX "Submission_userId_id_idx" ON "Submission"("userId", "id");

-- CreateIndex
CREATE INDEX "Submission_problemId_status_idx" ON "Submission"("problemId", "status");

-- CreateIndex
CREATE INDEX "Submission_contestId_status_idx" ON "Submission"("contestId", "status");

-- CreateIndex
CREATE INDEX "Submission_status_idx" ON "Submission"("status");

-- CreateIndex
CREATE INDEX "TestCase_problemId_idx" ON "TestCase"("problemId");

-- CreateIndex
CREATE INDEX "TestResult_submissionId_idx" ON "TestResult"("submissionId");
