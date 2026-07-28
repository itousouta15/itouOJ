-- 保留現有題目原本以 id 排序的順序，之後才由管理員手動調整
UPDATE "Problem" SET "order" = "id" WHERE "order" = 0;