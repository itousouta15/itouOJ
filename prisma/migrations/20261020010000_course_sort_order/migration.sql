ALTER TABLE "Course" ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- Preserve the previous public listing's APCS-first, then ID ordering.
WITH ranked AS (
  SELECT "id", ROW_NUMBER() OVER (
    ORDER BY CASE WHEN "title" = 'APCS 實作題：由簡到難' THEN 0 ELSE 1 END, "id"
  ) AS position
  FROM "Course"
)
UPDATE "Course"
SET "sortOrder" = (SELECT position FROM ranked WHERE ranked."id" = "Course"."id");

CREATE INDEX "Course_sortOrder_idx" ON "Course"("sortOrder");
