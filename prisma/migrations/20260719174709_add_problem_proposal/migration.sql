-- CreateTable
CREATE TABLE "ProblemProposal" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "statement" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL DEFAULT 'medium',
    "timeLimitMs" INTEGER NOT NULL DEFAULT 1000,
    "memoryLimitMb" INTEGER NOT NULL DEFAULT 256,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reviewNote" TEXT,
    "authorId" TEXT NOT NULL,
    "approvedProblemId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProblemProposal_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProposalTestCase" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "proposalId" INTEGER NOT NULL,
    "input" TEXT NOT NULL,
    "output" TEXT NOT NULL,
    "isSample" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "ProposalTestCase_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "ProblemProposal" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
