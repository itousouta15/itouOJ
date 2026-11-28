-- 實作題對外識別從整數 order 改成「一碼小寫英文＋三碼數字」的 problemCode（例：a001）。
-- 識別題不改：沿用原本的整數 order（網址走 /recognition/q/{id}），problemCode 留 null。
-- 實作題依目前 order 逐題重編成連續代碼；滿 999 進位到下一字母（見 lib/problemCode.ts）。
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
    "problemCode" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "authorId" TEXT,
    "pdfData" BLOB,
    "pdfFilename" TEXT,
    "pdfUploadedAt" DATETIME,
    "pdfPassword" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Problem_clusterId_fkey" FOREIGN KEY ("clusterId") REFERENCES "RecognitionCluster" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Problem_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Problem" ("id", "title", "statement", "type", "code", "options", "answerIndex", "explanation", "paper", "sourceNumber", "category", "clusterId", "difficulty", "timeLimitMs", "memoryLimitMb", "isPublic", "problemCode", "order", "authorId", "pdfData", "pdfFilename", "pdfUploadedAt", "pdfPassword", "createdAt")
SELECT "id", "title", "statement", "type", "code", "options", "answerIndex", "explanation", "paper", "sourceNumber", "category", "clusterId", "difficulty", "timeLimitMs", "memoryLimitMb", "isPublic",
       CASE
         WHEN "type" = 'PROGRAMMING'
           THEN char(97 + (("rn" - 1) / 999)) || printf('%03d', (("rn" - 1) % 999) + 1)
         ELSE NULL
       END,
       "order", "authorId", "pdfData", "pdfFilename", "pdfUploadedAt", "pdfPassword", "createdAt"
FROM (
    SELECT *, ROW_NUMBER() OVER (PARTITION BY "type" ORDER BY "order", "id") AS "rn" FROM "Problem"
);
DROP TABLE "Problem";
ALTER TABLE "new_Problem" RENAME TO "Problem";
CREATE INDEX "Problem_clusterId_idx" ON "Problem"("clusterId");
CREATE INDEX "Problem_authorId_idx" ON "Problem"("authorId");
CREATE UNIQUE INDEX "Problem_type_order_key" ON "Problem"("type", "order");
CREATE UNIQUE INDEX "Problem_type_problemCode_key" ON "Problem"("type", "problemCode");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
