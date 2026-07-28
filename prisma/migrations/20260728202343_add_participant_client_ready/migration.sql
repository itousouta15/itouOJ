-- 離線收件程式的「這台機器已就緒」回報。開賽前監考用來確認每一台都設定好了。
ALTER TABLE "ContestParticipant" ADD COLUMN "clientReadyAt" DATETIME;
ALTER TABLE "ContestParticipant" ADD COLUMN "clientHost" TEXT;
