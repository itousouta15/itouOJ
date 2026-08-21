// 新增單一題目「幫 Jason 應援」：無輸入，固定輸出應援口號。
// 不掛在任何課程底下（獨立題目），跟 add-household-registration-problem 的模式一樣。
//
//   node scripts/add-cheer-for-leeseo-problem.mjs                 加進 dev.db
//   node scripts/add-cheer-for-leeseo-problem.mjs --db oj.db      加進正式站資料庫
//
// 重跑會被擋掉（用標題判斷是否已存在），不會建立重複題目。

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

const TITLE = "幫 Jason 應援";
const TAGS = ["輸入輸出"];

const STATEMENT = `## 題目描述

Jason 是一位忠實的 Dive。經過多次的嘗試，終於搶到 9/12 在台北小巨蛋的演唱會門票。

終於到了這天，他卻感冒沒了聲音，沒辦法幫自己最愛的瑞寶應援。現在他需要有心的各位幫忙他應援，請寫一個程式，代替他喊出應援口號。

## 輸入格式

本題無輸入。

## 輸出格式

輸出一行，內容為 \`Leeseo！\` 重複三次，中間以一個半形空白分隔。

## 範例一

範例輸入：

\`\`\`
\`\`\`

範例輸出：

\`\`\`
Leeseo！ Leeseo！ Leeseo！
\`\`\`

## 提示

注意「！」是全形驚嘆號，跟半形的 \`!\` 不一樣；輸出結尾記得換行。
`;

const OUTPUT = "Leeseo！ Leeseo！ Leeseo！";

const cases = [{ input: "", output: OUTPUT, isSample: true }];

const existing = db.prepare("SELECT id FROM Problem WHERE title = ?").get(TITLE);
if (existing) {
  console.log(`跳過（已存在）：${TITLE} (id=${existing.id})`);
  db.close();
  process.exit(0);
}

const nextOrder =
  ((db.prepare(`SELECT MAX("order") AS m FROM Problem`).get() ?? {}).m ?? 0) + 1;

const insertProblem = db.prepare(
  `INSERT INTO Problem (title, statement, difficulty, timeLimitMs, memoryLimitMb, isPublic, "order", createdAt)
   VALUES (@title, @statement, @difficulty, @timeLimitMs, @memoryLimitMb, 1, @order, datetime('now'))`
);
const insertTestCase = db.prepare(
  `INSERT INTO TestCase (problemId, input, output, isSample, "order")
   VALUES (@problemId, @input, @output, @isSample, @order)`
);
const findTag = db.prepare("SELECT id FROM Tag WHERE name = ?");
const insertProblemTag = db.prepare("INSERT INTO ProblemTag (problemId, tagId) VALUES (?, ?)");

const run = db.transaction(() => {
  const problemId = Number(
    insertProblem.run({
      title: TITLE,
      statement: STATEMENT,
      difficulty: "easy",
      timeLimitMs: 1000,
      memoryLimitMb: 256,
      order: nextOrder,
    }).lastInsertRowid
  );

  cases.forEach((c, i) => {
    insertTestCase.run({
      problemId,
      input: c.input,
      output: c.output,
      isSample: c.isSample ? 1 : 0,
      order: i,
    });
  });

  let tagged = 0;
  for (const tagName of TAGS) {
    const tag = findTag.get(tagName);
    if (tag) {
      insertProblemTag.run(problemId, tag.id);
      tagged++;
    }
  }

  return { problemId, tagged };
});

const { problemId, tagged } = run();
console.log(`建立題目：${TITLE} (id=${problemId}, order=${nextOrder})`);
console.log(`  ${cases.length} 筆測資，${tagged}/${TAGS.length} 個標籤`);
db.close();
