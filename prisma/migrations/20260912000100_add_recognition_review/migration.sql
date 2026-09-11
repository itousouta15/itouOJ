-- CreateTable
CREATE TABLE "RecognitionReview" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" TEXT NOT NULL,
    "problemId" INTEGER NOT NULL,
    "intervalStep" INTEGER NOT NULL DEFAULT 0,
    "dueAt" DATETIME NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RecognitionReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RecognitionReview_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "RecognitionReview_userId_problemId_key" ON "RecognitionReview"("userId", "problemId");
CREATE INDEX "RecognitionReview_userId_dueAt_idx" ON "RecognitionReview"("userId", "dueAt");
