CREATE TABLE "ManagedHost" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'PRIMARY',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "tokenHash" TEXT NOT NULL,
    "lastSeenAt" DATETIME,
    "workerState" TEXT,
    "sandboxState" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "ManagedHost_name_key" ON "ManagedHost"("name");
CREATE UNIQUE INDEX "ManagedHost_tokenHash_key" ON "ManagedHost"("tokenHash");
CREATE INDEX "ManagedHost_enabled_lastSeenAt_idx" ON "ManagedHost"("enabled", "lastSeenAt");

CREATE TABLE "HostCommand" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "hostId" TEXT NOT NULL,
    "service" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveredAt" DATETIME,
    "finishedAt" DATETIME,
    CONSTRAINT "HostCommand_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "ManagedHost" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "HostCommand_hostId_state_id_idx" ON "HostCommand"("hostId", "state", "id");
CREATE UNIQUE INDEX "HostCommand_one_open_per_host_idx" ON "HostCommand"("hostId") WHERE "state" IN ('PENDING', 'DELIVERED');
