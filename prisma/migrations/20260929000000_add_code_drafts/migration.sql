-- CreateTable
CREATE TABLE "CodeDraft" (
    "userId" TEXT NOT NULL,
    "problemId" INTEGER NOT NULL,
    "language" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "revision" INTEGER NOT NULL DEFAULT 1,
    "updatedAt" DATETIME NOT NULL,
    PRIMARY KEY ("userId","problemId","language"),
    CONSTRAINT "CodeDraft_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CodeDraft_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "CodeDraft_problemId_idx" ON "CodeDraft"("problemId");
