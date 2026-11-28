-- 比賽層級：是否允許選手端在開賽前就下載題目文件（預設關閉，管理員自行評估風險後開啟）
ALTER TABLE "Contest" ADD COLUMN "allowEarlyProblemDownload" BOOLEAN NOT NULL DEFAULT false;

-- 題目層級：管理員自製的正式 PDF（沒有的話下載時退回用題敘現場產生 HTML）。
-- 掛在 Problem 不是 ContestProblem：後者每次比賽編輯存檔都會整批刪除重建。
ALTER TABLE "Problem" ADD COLUMN "pdfData" BLOB;
ALTER TABLE "Problem" ADD COLUMN "pdfFilename" TEXT;
ALTER TABLE "Problem" ADD COLUMN "pdfUploadedAt" DATETIME;
