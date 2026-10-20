CREATE TABLE "BugReport" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "section" TEXT NOT NULL DEFAULT 'GENERAL',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "expected" TEXT NOT NULL DEFAULT '',
    "sourcePath" TEXT NOT NULL DEFAULT '',
    "context" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "adminReply" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BugReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "BugReport_userId_createdAt_idx" ON "BugReport"("userId", "createdAt");
CREATE INDEX "BugReport_status_category_createdAt_idx" ON "BugReport"("status", "category", "createdAt");
