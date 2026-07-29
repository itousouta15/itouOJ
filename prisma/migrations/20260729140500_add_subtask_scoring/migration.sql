-- 子題部分給分：一題可以分成多個 Subtask，各自配分與比對模式（完整比對 / 只比對第一
-- 行），測資各自歸屬一個 Subtask；沒有 Subtask 的題目維持舊制「整題 AC/WA」不受影響。

-- CreateTable
CREATE TABLE "Subtask" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "problemId" INTEGER NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "points" INTEGER NOT NULL,
    "checkMode" TEXT NOT NULL DEFAULT 'full',
    CONSTRAINT "Subtask_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Subtask_problemId_order_key" ON "Subtask"("problemId", "order");

-- AlterTable
ALTER TABLE "TestCase" ADD COLUMN "subtaskId" INTEGER REFERENCES "Subtask" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "Submission" ADD COLUMN "score" INTEGER;

-- AlterTable
ALTER TABLE "TestResult" ADD COLUMN "subtaskOrder" INTEGER;
