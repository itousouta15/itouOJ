-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_TestResult" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "submissionId" INTEGER NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "subtaskOrder" INTEGER,
    "verdict" TEXT NOT NULL,
    "timeMs" INTEGER,
    "memoryKb" INTEGER,
    "testCaseId" INTEGER,
    "actualOutput" TEXT,
    CONSTRAINT "TestResult_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TestResult_testCaseId_fkey" FOREIGN KEY ("testCaseId") REFERENCES "TestCase" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_TestResult" ("id", "memoryKb", "order", "submissionId", "subtaskOrder", "timeMs", "verdict") SELECT "id", "memoryKb", "order", "submissionId", "subtaskOrder", "timeMs", "verdict" FROM "TestResult";
DROP TABLE "TestResult";
ALTER TABLE "new_TestResult" RENAME TO "TestResult";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
