-- 比賽可限定語言，逗號分隔（例如 'cpp'）。空字串 = 不限制，維持既有比賽的行為。
ALTER TABLE "Contest" ADD COLUMN "allowedLanguages" TEXT NOT NULL DEFAULT '';
