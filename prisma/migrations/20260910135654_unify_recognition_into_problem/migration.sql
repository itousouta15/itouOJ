/*
  Warnings:

  - You are about to drop the `RecognitionQuestion` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropIndex
DROP INDEX "RecognitionQuestion_category_source_idx";

-- AlterTable
ALTER TABLE "Submission" ADD COLUMN "selectedIndex" INTEGER;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "RecognitionQuestion";
PRAGMA foreign_keys=on;

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
    "source" TEXT,
    "paper" TEXT,
    "sourceNumber" INTEGER,
    "category" TEXT,
    "difficulty" TEXT NOT NULL DEFAULT 'medium',
    "timeLimitMs" INTEGER NOT NULL DEFAULT 1000,
    "memoryLimitMb" INTEGER NOT NULL DEFAULT 256,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "pdfData" BLOB,
    "pdfFilename" TEXT,
    "pdfUploadedAt" DATETIME,
    "pdfPassword" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Problem" ("createdAt", "difficulty", "id", "isPublic", "memoryLimitMb", "order", "pdfData", "pdfFilename", "pdfPassword", "pdfUploadedAt", "statement", "timeLimitMs", "title") SELECT "createdAt", "difficulty", "id", "isPublic", "memoryLimitMb", "order", "pdfData", "pdfFilename", "pdfPassword", "pdfUploadedAt", "statement", "timeLimitMs", "title" FROM "Problem";
DROP TABLE "Problem";
ALTER TABLE "new_Problem" RENAME TO "Problem";
CREATE UNIQUE INDEX "Problem_type_order_key" ON "Problem"("type", "order");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
