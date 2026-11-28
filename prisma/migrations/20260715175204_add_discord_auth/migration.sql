-- AlterTable
ALTER TABLE "User" ADD COLUMN "discordId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_discordId_key" ON "User"("discordId");
