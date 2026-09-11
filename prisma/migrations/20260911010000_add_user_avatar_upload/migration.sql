-- AlterTable
ALTER TABLE "User" ADD COLUMN "avatarData" BLOB;
ALTER TABLE "User" ADD COLUMN "avatarMime" TEXT;
ALTER TABLE "User" ADD COLUMN "avatarUpdatedAt" DATETIME;
