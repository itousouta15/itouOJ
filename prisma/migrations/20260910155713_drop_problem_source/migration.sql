/*
  Warnings:

  - You are about to drop the column `source` on the `Problem` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Problem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "statement" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'PROGRAMMING',
    "code" TEXT,
    "options" TEXT,
    "answerIndex" INTEGER,
    "explanation" TEXT,
    "paper" TEXT,
    "sourceNumber" INTEGER,
    "category" TEXT,
    "clusterId" INTEGER,
    "difficulty" TEXT NOT NULL DEFAULT 'medium',
    "timeLimitMs" INTEGER NOT NULL DEFAULT 1000,
    "memoryLimitMb" INTEGER NOT NULL DEFAULT 256,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "pdfData" BLOB,
    "pdfFilename" TEXT,
    "pdfUploadedAt" DATETIME,
    "pdfPassword" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Problem_clusterId_fkey" FOREIGN KEY ("clusterId") REFERENCES "RecognitionCluster" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Problem" ("answerIndex", "category", "clusterId", "code", "createdAt", "difficulty", "explanation", "id", "isPublic", "memoryLimitMb", "options", "order", "paper", "pdfData", "pdfFilename", "pdfPassword", "pdfUploadedAt", "sourceNumber", "statement", "timeLimitMs", "title", "type") SELECT "answerIndex", "category", "clusterId", "code", "createdAt", "difficulty", "explanation", "id", "isPublic", "memoryLimitMb", "options", "order", "paper", "pdfData", "pdfFilename", "pdfPassword", "pdfUploadedAt", "sourceNumber", "statement", "timeLimitMs", "title", "type" FROM "Problem";
DROP TABLE "Problem";
ALTER TABLE "new_Problem" RENAME TO "Problem";
CREATE INDEX "Problem_clusterId_idx" ON "Problem"("clusterId");
CREATE UNIQUE INDEX "Problem_type_order_key" ON "Problem"("type", "order");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
