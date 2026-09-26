ALTER TABLE "Contest" ADD COLUMN "ownerId" TEXT REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Contest_ownerId_idx" ON "Contest"("ownerId");
