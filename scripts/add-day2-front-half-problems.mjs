// 新增 Day2「變數與運算子」前半段（資料型態）的兩題練習：
//   1. 班級點名卡：純 int / char / string 宣告 + 輸入輸出，不需要任何運算子。
//   2. 攝氏轉華氏：練 double + 一個算術公式，不碰比較 / 邏輯運算子與 if。
// 插在 Day2 課程題單最前面（原本的判斷奇偶數等 4 題往後推兩格），
// 讓學生在還沒學到運算子 / if 之前，就有東西可以在 OJ 上練型態宣告與輸入輸出。
//
//   node scripts/add-day2-front-half-problems.mjs                 加進 dev.db
//   node scripts/add-day2-front-half-problems.mjs --db oj.db      加進正式站資料庫
//
// 重跑會被擋掉（用標題判斷是否已存在），不會建立重複題目，也不會重複搬動課程順序。
// Problem.order 是全站題號（網址 /problems/{order}），新題附加在全站最後一號之後，
// 不會動到既有題目的題號；課程列表內的先後順序另外用 CourseProblem.order 控制。

import "dotenv/config";
import Database from "better-sqlite3";

const argv = process.argv.slice(2);
function flag(name, fallback) {
  const i = argv.indexOf("--" + name);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--")
    ? argv[i + 1]
    : fallback;
}

const dbPath = flag("db", (process.env.DATABASE_URL ?? "file:./dev.db").replace(/^file:/, ""));
const db = new Database(dbPath);
db.pragma("foreign_keys = ON");

const COURSE_TITLE = "APCS 初級營 Day2｜變數與運算子";

// C++ 的 cout 預設用 6 位「有效數字」印 double（等同 printf 的 %g），
// 會去掉多餘的尾端 0（32.0 印成 "32"），這裡完整模擬同一套規則，
// 讓參考答案跟學生用預設 cout 印出來的字串一模一樣。
function cppDouble(x) {
  if (Object.is(x, -0)) x = 0;
  let s = x.toPrecision(6);
  if (s.includes(".")) {
    s = s.replace(/0+$/, "").replace(/\.$/, "");
  }
  return s;
}

function makeRng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const problems = [];

// ---------------------------------------------------------------
// 題目 A：班級點名卡（int / char / string，不用任何運算子）
// ---------------------------------------------------------------
{
  const TITLE = "班級點名卡";
  const TAGS = ["輸入輸出"];

  const STATEMENT = `## 題目描述

各班導師要做電子點名卡，請讀入一位學生的姓名、座號、以及所屬分組代號，並依照指定格式印出這位學生的點名卡內容。

## 輸入格式

輸入共 3 行，依序為：

1. 姓名 \`name\`（不含空白的英文字串）
2. 座號 \`seat\`（正整數）
3. 分組代號 \`group\`（一個大寫英文字母）

## 限制

- 1 ≤ 姓名長度 ≤ 20，只包含大小寫英文字母
- 1 ≤ seat ≤ 50
- group 為 \`'A'\` 到 \`'Z'\` 其中一個大寫字母

## 輸出格式

輸出一行，格式為 \`seat 號 name（group 組）\`，空白與括號請照下面範例排版，不要自己增減。

## 範例一

範例輸入：

\`\`\`
Amy
12
B
\`\`\`

範例輸出：

\`\`\`
12 號 Amy（B 組）
\`\`\`

## 範例二

範例輸入：

\`\`\`
Kevin
3
A
\`\`\`

範例輸出：

\`\`\`
3 號 Kevin（A 組）
\`\`\`
`;

  function solve(input) {
    const lines = input.trim().split("\n");
    const name = lines[0].trim();
    const seat = lines[1].trim();
    const group = lines[2].trim();
    return `${seat} 號 ${name}（${group} 組）`;
  }

  const rawCases = [
    { input: "Amy\n12\nB", isSample: true },
    { input: "Kevin\n3\nA", isSample: true },
    { input: "A\n1\nZ", isSample: false },
    { input: "itouSouta\n50\nC", isSample: false },
    { input: "Bob\n7\nA", isSample: false },
    { input: "Christopher\n25\nM", isSample: false },
    { input: "Zoe\n9\nY", isSample: false },
  ];
  {
    const rng = makeRng(20260818);
    const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lower = "abcdefghijklmnopqrstuvwxyz";
    for (let i = 0; i < 4; i++) {
      const len = 3 + Math.floor(rng() * 6);
      let name = upper[Math.floor(rng() * 26)];
      for (let j = 1; j < len; j++) name += lower[Math.floor(rng() * 26)];
      const seat = 1 + Math.floor(rng() * 50);
      const group = upper[Math.floor(rng() * 26)];
      rawCases.push({ input: `${name}\n${seat}\n${group}`, isSample: false });
    }
  }
  const cases = rawCases.map((c) => ({ ...c, output: solve(c.input) }));

  problems.push({ title: TITLE, statement: STATEMENT, tags: TAGS, cases, difficulty: "easy" });
}

// ---------------------------------------------------------------
// 題目 B：攝氏轉華氏（double + 一個算術公式，不用 if）
// ---------------------------------------------------------------
{
  const TITLE = "攝氏轉華氏";
  const TAGS = ["輸入輸出", "數學"];

  const STATEMENT = `## 題目描述

氣象站要把測到的攝氏溫度換算成華氏溫度給國外的資料庫使用，換算公式是：

\`F = C × 9 ÷ 5 + 32\`

請讀入攝氏溫度 C，計算並輸出對應的華氏溫度 F。

## 輸入格式

輸入一行，一個實數 C，代表攝氏溫度。

## 限制

- −100 ≤ C ≤ 100
- C 最多到小數點後 1 位

## 輸出格式

輸出一行，即換算後的華氏溫度 F。用 \`double\` 存、算完直接印出即可，不需要額外設定小數位數。

## 範例一

範例輸入：

\`\`\`
0
\`\`\`

範例輸出：

\`\`\`
32
\`\`\`

## 範例二

範例輸入：

\`\`\`
37
\`\`\`

範例輸出：

\`\`\`
98.6
\`\`\`

人體體溫大約是攝氏 37 度，換算成華氏就是我們常聽到的 98.6 度。
`;

  function solve(input) {
    const c = parseFloat(input.trim());
    const f = (c * 9) / 5 + 32;
    return cppDouble(f);
  }

  const rawCases = [
    { input: "0", isSample: true },
    { input: "37", isSample: true },
    { input: "100", isSample: false },
    { input: "-40", isSample: false },
    { input: "36.5", isSample: false },
    { input: "-17.5", isSample: false },
    { input: "20", isSample: false },
    { input: "-10.5", isSample: false },
    { input: "99.9", isSample: false },
    { input: "-100", isSample: false },
  ];
  {
    const rng = makeRng(20260819);
    for (let i = 0; i < 5; i++) {
      const sign = rng() < 0.5 ? -1 : 1;
      const whole = Math.floor(rng() * 100);
      const tenth = Math.floor(rng() * 10);
      const c = sign * (whole + tenth / 10);
      rawCases.push({ input: String(c), isSample: false });
    }
  }
  const cases = rawCases.map((c) => ({ ...c, output: solve(c.input) }));

  problems.push({ title: TITLE, statement: STATEMENT, tags: TAGS, cases, difficulty: "easy" });
}

// ---------------------------------------------------------------
// 寫入資料庫
// ---------------------------------------------------------------
const existing = db
  .prepare("SELECT id FROM Problem WHERE title IN (?, ?)")
  .all(problems[0].title, problems[1].title);
if (existing.length > 0) {
  console.log(`跳過（已有同名題目存在）：${existing.map((r) => r.id).join(", ")}`);
  db.close();
  process.exit(0);
}

const course = db.prepare("SELECT id FROM Course WHERE title = ?").get(COURSE_TITLE);
if (!course) {
  console.error(`找不到課程：${COURSE_TITLE}，請確認 seed-apcs-camp.ts 已經跑過`);
  db.close();
  process.exit(1);
}

const findTag = db.prepare("SELECT id FROM Tag WHERE name = ?");
const insertProblemTag = db.prepare("INSERT INTO ProblemTag (problemId, tagId) VALUES (?, ?)");
const insertProblem = db.prepare(
  `INSERT INTO Problem (title, statement, difficulty, timeLimitMs, memoryLimitMb, isPublic, "order", createdAt)
   VALUES (@title, @statement, @difficulty, @timeLimitMs, @memoryLimitMb, 1, @order, datetime('now'))`
);
const insertTestCase = db.prepare(
  `INSERT INTO TestCase (problemId, input, output, isSample, "order")
   VALUES (@problemId, @input, @output, @isSample, @order)`
);
const bumpCourseOrder = db.prepare(
  `UPDATE CourseProblem SET "order" = "order" + 2 WHERE courseId = ?`
);
const insertCourseProblem = db.prepare(
  `INSERT INTO CourseProblem (courseId, problemId, "order") VALUES (@courseId, @problemId, @order)`
);

const run = db.transaction(() => {
  let nextOrder =
    ((db.prepare(`SELECT MAX("order") AS m FROM Problem`).get() ?? {}).m ?? 0) + 1;

  bumpCourseOrder.run(course.id);

  const created = [];
  problems.forEach((p, courseOrder) => {
    const problemId = Number(
      insertProblem.run({
        title: p.title,
        statement: p.statement,
        difficulty: p.difficulty,
        timeLimitMs: 1000,
        memoryLimitMb: 256,
        order: nextOrder++,
      }).lastInsertRowid
    );
    p.cases.forEach((c, i) => {
      insertTestCase.run({
        problemId,
        input: c.input,
        output: c.output,
        isSample: c.isSample ? 1 : 0,
        order: i,
      });
    });
    let tagged = 0;
    for (const tagName of p.tags) {
      const tag = findTag.get(tagName);
      if (tag) {
        insertProblemTag.run(problemId, tag.id);
        tagged++;
      }
    }
    insertCourseProblem.run({ courseId: course.id, problemId, order: courseOrder + 1 });
    created.push({ title: p.title, problemId, order: nextOrder - 1, tagged, tagCount: p.tags.length });
  });

  return created;
});

const created = run();
for (const c of created) {
  console.log(
    `建立題目：${c.title} (id=${c.problemId}, order=${c.order}, ${c.tagged}/${c.tagCount} 標籤)`
  );
}
console.log(`插入課程「${COURSE_TITLE}」最前面兩格，原本的題目往後推兩格`);
db.close();
