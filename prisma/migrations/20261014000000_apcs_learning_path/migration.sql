-- Retire the two one-problem/intro courses from the public list without
-- deleting their problems, submissions, memberships, or completion history.
-- Existing members are carried into the replacement course below.

INSERT INTO "Course" ("title", "description", "isPublic", "createdAt")
SELECT
  'APCS 實作題：由簡到難',
  '依簡單、中等、困難各挑 3 題，從條件判斷與迴圈開始，逐步挑戰字串、陣列與進階演算法。',
  1,
  CURRENT_TIMESTAMP
WHERE NOT EXISTS (
  SELECT 1 FROM "Course" WHERE "title" = 'APCS 實作題：由簡到難'
)
AND (
  SELECT COUNT(*)
  FROM "Problem"
  WHERE "isPublic" = 1
    AND "type" = 'PROGRAMMING'
    AND (
      ("problemCode" = 'a006' AND "difficulty" = 'easy') OR
      ("problemCode" = 'a007' AND "difficulty" = 'easy') OR
      ("problemCode" = 'a010' AND "difficulty" = 'easy') OR
      ("problemCode" = 'a019' AND "difficulty" = 'medium') OR
      ("problemCode" = 'a023' AND "difficulty" = 'medium') OR
      ("problemCode" = 'a026' AND "difficulty" = 'medium') OR
      ("problemCode" = 'a029' AND "difficulty" = 'hard') OR
      ("problemCode" = 'a030' AND "difficulty" = 'hard') OR
      ("problemCode" = 'a031' AND "difficulty" = 'hard')
    )
) = 9;

INSERT INTO "CourseProblem" ("courseId", "problemId", "order")
SELECT
  c."id",
  p."id",
  CASE p."problemCode"
    WHEN 'a006' THEN 1
    WHEN 'a007' THEN 2
    WHEN 'a010' THEN 3
    WHEN 'a019' THEN 4
    WHEN 'a023' THEN 5
    WHEN 'a026' THEN 6
    WHEN 'a029' THEN 7
    WHEN 'a030' THEN 8
    WHEN 'a031' THEN 9
  END
FROM "Course" c
CROSS JOIN "Problem" p
WHERE c."title" = 'APCS 實作題：由簡到難'
  AND p."problemCode" IN ('a006', 'a007', 'a010', 'a019', 'a023', 'a026', 'a029', 'a030', 'a031')
  AND p."isPublic" = 1
  AND p."type" = 'PROGRAMMING'
  AND NOT EXISTS (
    SELECT 1 FROM "CourseProblem" cp WHERE cp."courseId" = c."id"
  );

-- Carry learners from the retired intro courses into the new learning path.
INSERT INTO "CourseMember" ("courseId", "userId", "joinedAt")
SELECT newCourse."id", oldMember."userId", MIN(oldMember."joinedAt")
FROM "CourseMember" oldMember
JOIN "Course" oldCourse ON oldCourse."id" = oldMember."courseId"
JOIN "Course" newCourse ON newCourse."title" = 'APCS 實作題：由簡到難'
WHERE oldCourse."title" IN ('資訊啟蒙', '變數與運算子')
GROUP BY newCourse."id", oldMember."userId"
ON CONFLICT ("courseId", "userId") DO NOTHING;

UPDATE "Course"
SET "isPublic" = 0
WHERE "title" IN ('資訊啟蒙', '變數與運算子');
