CREATE INDEX "ProblemComment_problemId_createdAt_id_idx" ON "ProblemComment"("problemId", "createdAt", "id");
CREATE INDEX "ProblemSolution_problemId_createdAt_id_idx" ON "ProblemSolution"("problemId", "createdAt", "id");
CREATE INDEX "Message_receiverId_senderId_createdAt_idx" ON "Message"("receiverId", "senderId", "createdAt");
