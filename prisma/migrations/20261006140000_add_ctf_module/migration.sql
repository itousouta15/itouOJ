CREATE TABLE "CtfChallenge" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL DEFAULT 'medium',
    "points" INTEGER NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "flagHash" TEXT NOT NULL,
    "flagSalt" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE TABLE "CtfAttachment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "challengeId" INTEGER NOT NULL,
    "filename" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "data" BLOB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CtfAttachment_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "CtfChallenge" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE "CtfSolve" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" TEXT NOT NULL,
    "challengeId" INTEGER NOT NULL,
    "solvedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CtfSolve_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CtfSolve_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "CtfChallenge" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE "CtfAttempt" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" TEXT NOT NULL,
    "challengeId" INTEGER NOT NULL,
    "result" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CtfAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CtfAttempt_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "CtfChallenge" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "CtfChallenge_isPublic_order_id_idx" ON "CtfChallenge"("isPublic", "order", "id");
CREATE INDEX "CtfAttachment_challengeId_id_idx" ON "CtfAttachment"("challengeId", "id");
CREATE UNIQUE INDEX "CtfSolve_userId_challengeId_key" ON "CtfSolve"("userId", "challengeId");
CREATE INDEX "CtfSolve_userId_solvedAt_id_idx" ON "CtfSolve"("userId", "solvedAt", "id");
CREATE INDEX "CtfSolve_challengeId_idx" ON "CtfSolve"("challengeId");
CREATE INDEX "CtfAttempt_userId_createdAt_id_idx" ON "CtfAttempt"("userId", "createdAt", "id");
CREATE INDEX "CtfAttempt_challengeId_idx" ON "CtfAttempt"("challengeId");
