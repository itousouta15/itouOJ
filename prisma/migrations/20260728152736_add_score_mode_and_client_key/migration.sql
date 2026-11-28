-- Contest 計分模式：ICPC（首次 AC + 錯誤罰時）或 IOI（只看最後一次提交、不罰時）
ALTER TABLE "Contest" ADD COLUMN "scoreMode" TEXT NOT NULL DEFAULT 'ICPC';

-- 離線收件程式的去重鍵：選手重複按上傳時擋掉重複寫入。
-- 可為 NULL（網頁上的一般提交不帶），SQLite 的 UNIQUE 索引允許多個 NULL。
ALTER TABLE "Submission" ADD COLUMN "clientKey" TEXT;
CREATE UNIQUE INDEX "Submission_clientKey_key" ON "Submission"("clientKey");
