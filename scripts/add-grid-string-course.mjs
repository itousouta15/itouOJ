// 新增「二維陣列與字串｜從基礎到挑戰」18 題與獨立題單。
// node scripts/add-grid-string-course.mjs --check 只驗證題敘、範例及測資，不修改資料庫。
// node scripts/add-grid-string-course.mjs [--db prisma/data/dev.db] 寫入資料庫；可重複執行。
// node scripts/add-grid-string-course.mjs --update-statements [--db oj.db] 只更新既有題目的題敘。
import "dotenv/config";
import assert from "node:assert/strict";
import Database from "better-sqlite3";
import { nextProblemCode } from "./lib/problemCode.mjs";
import { COURSE_TITLE, COURSE_DESCRIPTION, problems } from "./lib/grid-string-course-problems.mjs";

assert.equal(problems.length, 18);
assert.equal(new Set(problems.map((p) => p.title)).size, 18);
assert.deepEqual(problems.map((p) => p.difficulty), [
  ...Array(6).fill("easy"), ...Array(7).fill("medium"), ...Array(5).fill("hard"),
]);

const args = process.argv.slice(2);
const checkOnly = args.includes("--check");
const updateStatements = args.includes("--update-statements");
const dbFlag = args.indexOf("--db");
if ((checkOnly && updateStatements) || args.filter((arg) => arg === "--db").length > 1 ||
    args.some((arg, i) => !["--check", "--update-statements", "--db"].includes(arg) && (dbFlag === -1 || i !== dbFlag + 1)) ||
    (dbFlag !== -1 && (!args[dbFlag + 1] || args[dbFlag + 1].startsWith("--")))) {
  throw new Error("用法：node scripts/add-grid-string-course.mjs [--check | --update-statements] [--db 資料庫路徑]");
}

if (checkOnly) {
  for (const p of problems) {
    console.log(`${p.difficulty.padEnd(6)} ${p.title}：${p.testCases.length} 筆測資（${p.testCases.filter((c) => c.isSample).length} 範例）`);
  }
  console.log(`驗證完成：${problems.length} 題，${problems.reduce((sum, p) => sum + p.testCases.length, 0)} 筆測資。`);
} else {
  const dbPath = dbFlag !== -1 ? args[dbFlag + 1] :
    (process.env.DATABASE_URL ?? "file:./prisma/data/dev.db").replace(/^file:/, "");
  const db = new Database(dbPath, { fileMustExist: true });
  try {
    db.pragma("foreign_keys = ON");
    const findCourse = db.prepare("SELECT id FROM Course WHERE title = ?");
    const createCourse = db.prepare(
      "INSERT INTO Course (title, description, isPublic, createdAt) VALUES (?, ?, 1, datetime('now'))"
    );
    const findProblem = db.prepare("SELECT id, problemCode FROM Problem WHERE type = 'PROGRAMMING' AND title = ?");
    const findLink = db.prepare("SELECT 1 FROM CourseProblem WHERE courseId = ? AND problemId = ?");
    // 題單名稱可由管理員修改；若 18 題仍在同一題單，就沿用該題單，不把它改回舊標題。
    const findLinkedCourse = db.prepare(`
      SELECT cp.courseId AS id FROM CourseProblem cp
      JOIN Problem p ON p.id = cp.problemId
      WHERE p.type = 'PROGRAMMING' AND p.title IN (${problems.map(() => "?").join(", ")})
      GROUP BY cp.courseId HAVING COUNT(DISTINCT p.title) = ?
    `);
    function getCourse() {
      const linked = findLinkedCourse.all(...problems.map((p) => p.title), problems.length);
      if (linked.length > 1) throw new Error("這 18 題同時屬於多個題單，無法判斷要更新哪一個");
      return linked[0] ?? findCourse.get(COURSE_TITLE);
    }
    if (updateStatements) {
      const update = db.prepare("UPDATE Problem SET statement = ? WHERE id = ? AND statement <> ?");
      const updated = db.transaction(() => {
        const course = getCourse();
        if (!course) throw new Error("找不到包含 18 題的題單");
        let count = 0;
        for (const p of problems) {
          const existing = findProblem.get(p.title);
          if (!existing || !findLink.get(course.id, existing.id)) throw new Error(`找不到題單中的題目：${p.title}`);
          count += update.run(p.statement, existing.id, p.statement).changes;
        }
        return count;
      })();
      console.log(`題單 ${COURSE_TITLE}：更新 ${updated} 題題敘。`);
    } else {
      const findMaxCode = db.prepare("SELECT MAX(\"problemCode\") AS code FROM Problem WHERE type = 'PROGRAMMING'");
      const findMinOrder = db.prepare("SELECT MIN(\"order\") AS value FROM Problem WHERE type = 'PROGRAMMING'");
      const createProblem = db.prepare(`
        INSERT INTO Problem (title, statement, difficulty, timeLimitMs, memoryLimitMb,
                             isPublic, "problemCode", "order", createdAt)
        VALUES (?, ?, ?, 2000, 256, 1, ?, ?, datetime('now'))
      `);
      const createCase = db.prepare(
        "INSERT INTO TestCase (problemId, input, output, isSample, \"order\") VALUES (?, ?, ?, ?, ?)"
      );
      const createLink = db.prepare(
        "INSERT INTO CourseProblem (courseId, problemId, \"order\") VALUES (?, ?, ?)"
      );
      const createTag = db.prepare("INSERT OR IGNORE INTO Tag (name) VALUES (?)");
      const findTag = db.prepare("SELECT id FROM Tag WHERE name = ?");
      const attachTag = db.prepare("INSERT INTO ProblemTag (problemId, tagId) VALUES (?, ?)");

      const result = db.transaction(() => {
        const previous = getCourse();
        const courseId = previous?.id ?? Number(createCourse.run(COURSE_TITLE, COURSE_DESCRIPTION).lastInsertRowid);
        let code = nextProblemCode(findMaxCode.get().code);
        let order = Math.min(0, findMinOrder.get().value ?? 0) - 1;
        let created = 0;
        for (const [index, p] of problems.entries()) {
          const existing = findProblem.get(p.title);
          if (existing) {
            // 其他題單碰巧用了相同標題時不可把它當成自己的題目重複使用。
            if (!findLink.get(courseId, existing.id)) throw new Error(`同名題目已存在但不屬於此題單：${p.title}`);
            continue;
          }
          const id = Number(createProblem.run(p.title, p.statement, p.difficulty, code, order--).lastInsertRowid);
          p.testCases.forEach((test, i) => {
            createCase.run(id, test.input, test.output, Number(test.isSample), i + 1);
          });
          for (const tag of p.tags) {
            createTag.run(tag);
            attachTag.run(id, findTag.get(tag).id);
          }
          createLink.run(courseId, id, index + 1);
          console.log(`建立 ${p.title} (${code})：${p.testCases.length} 筆測資`);
          code = nextProblemCode(code);
          created++;
        }
        return { courseId, created };
      })();
      console.log(`題單 ${COURSE_TITLE} (id=${result.courseId})：新增 ${result.created} 題。`);
    }
  } finally {
    db.close();
  }
}
