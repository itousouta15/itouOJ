-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_RecognitionQuestion" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'C',
    "source" TEXT NOT NULL DEFAULT '',
    "options" TEXT NOT NULL,
    "answerIndex" INTEGER NOT NULL,
    "explanation" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_RecognitionQuestion" ("answerIndex", "category", "code", "createdAt", "explanation", "id", "isPublic", "options", "order", "question") SELECT "answerIndex", "category", "code", "createdAt", "explanation", "id", "isPublic", "options", "order", "question" FROM "RecognitionQuestion";
DROP TABLE "RecognitionQuestion";
ALTER TABLE "new_RecognitionQuestion" RENAME TO "RecognitionQuestion";
CREATE INDEX "RecognitionQuestion_category_source_idx" ON "RecognitionQuestion"("category", "source");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
