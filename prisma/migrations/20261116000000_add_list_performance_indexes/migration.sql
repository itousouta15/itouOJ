-- CreateIndex
CREATE INDEX "Problem_type_isPublic_problemCode_idx" ON "Problem"("type", "isPublic", "problemCode");

-- CreateIndex
CREATE INDEX "Problem_type_isPublic_difficulty_idx" ON "Problem"("type", "isPublic", "difficulty");

-- CreateIndex
CREATE INDEX "ProblemTag_tagId_idx" ON "ProblemTag"("tagId");

-- CreateIndex
CREATE INDEX "CourseProblem_problemId_idx" ON "CourseProblem"("problemId");

-- CreateIndex
CREATE INDEX "ContestProblem_problemId_idx" ON "ContestProblem"("problemId");
