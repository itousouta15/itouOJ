// 簡化題目「畢業紀念冊之外的用途？」：拿掉「依座號列出每人違規件數」的部分，
// 只留「輸出違規作品總件數」，並移除子題配分（改回整題 AC/WA）。
//
//   node scripts/simplify-graduation-book-problem.mjs                 改 dev.db
//   node scripts/simplify-graduation-book-problem.mjs --db oj.db      改正式站資料庫
//
// 找不到題目就直接跳過；重跑是安全的（每次都用同一套新內容整個覆蓋舊測資/子題）。

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

const TITLE = "畢業紀念冊之外的用途？";
const TAGS = ["迴圈", "條件判斷"];

const STATEMENT = `## 題目描述

小里高中為了製作畢業紀念冊，向全校學生徵求封面與內頁的美術設計投稿，共收到 N 件作品。

依照徵稿公告，每件投稿作品僅同意用於畢業紀念冊，不包含其他用途。校方清查後，發現部分作品被挪用於畢業紀念冊以外的用途。每件作品都恰好對應一筆使用紀錄，包含：

| 代碼 | 用途 |
| --- | --- |
| 1 | 畢業紀念冊 |
| 2 | 宣傳海報 |
| 3 | 社群發文 |

只要作品的 \`purpose\` 為 2 或 3，該作品即視為「違規使用」。

請寫一個程式，讀入全部 N 件作品的紀錄後，輸出違規作品的總件數。

## 輸入格式

輸入共 N+1 行。

- 第 1 行：一個正整數 N，代表投稿作品件數。
- 第 2 行到第 N+1 行：第 i+1 行有兩個以恰一個空白分隔的整數 \`owner_i\` 與 \`purpose_i\`，依序代表第 i 件作品的創作者座號與實際用途代碼。本題不需要用到 \`owner_i\`，但輸入中仍會給出。

## 限制

- 1 ≤ N ≤ 1000
- 1 ≤ owner_i ≤ 100
- purpose_i ∈ {1, 2, 3}

## 輸出格式

輸出一個整數，代表違規作品的總件數（範圍為 0 到 N），並換行。

## 範例一

範例輸入：

\`\`\`
5
1 2
2 1
1 3
3 2
2 2
\`\`\`

範例輸出：

\`\`\`
4
\`\`\`

5 件作品中，第 1、3、4、5 件的用途代碼為 2 或 3，屬於違規，共 4 件；第 2 件用途為 1，合規。

## 範例二

範例輸入：

\`\`\`
3
5 1
7 1
9 1
\`\`\`

範例輸出：

\`\`\`
0
\`\`\`

三件作品的用途皆為 1（畢業紀念冊），沒有任何違規作品。
`;

function solve(input) {
  const lines = input.trim().split("\n");
  const n = parseInt(lines[0], 10);
  let total = 0;
  for (let i = 1; i <= n; i++) {
    const [, purpose] = lines[i].trim().split(/\s+/).map(Number);
    if (purpose !== 1) total++;
  }
  return String(total);
}

function makeRng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const rawCases = [
  { input: "5\n1 2\n2 1\n1 3\n3 2\n2 2", isSample: true },
  { input: "3\n5 1\n7 1\n9 1", isSample: true },
  { input: "1\n1 1", isSample: false },
  { input: "1\n42 2", isSample: false },
  { input: "6\n7 2\n7 3\n7 2\n7 1\n7 3\n7 2", isSample: false },
  { input: "2\n1 2\n100 3", isSample: false },
];
{
  const rng = makeRng(20260821);
  const n = 1000;
  const lines = [String(n)];
  for (let i = 0; i < n; i++) {
    const owner = 1 + Math.floor(rng() * 100);
    const purpose = 1 + Math.floor(rng() * 3);
    lines.push(`${owner} ${purpose}`);
  }
  rawCases.push({ input: lines.join("\n"), isSample: false });
}
const cases = rawCases.map((c) => ({ ...c, output: solve(c.input) }));

const problem = db.prepare("SELECT id FROM Problem WHERE title = ?").get(TITLE);
if (!problem) {
  console.log(`找不到題目：${TITLE}`);
  db.close();
  process.exit(0);
}
const problemId = problem.id;

const updateProblem = db.prepare(`UPDATE Problem SET statement = @statement WHERE id = @problemId`);
const deleteSubtasks = db.prepare(`DELETE FROM Subtask WHERE problemId = ?`); // cascade 到 TestCase
const insertTestCase = db.prepare(
  `INSERT INTO TestCase (problemId, input, output, isSample, "order")
   VALUES (@problemId, @input, @output, @isSample, @order)`
);
const deleteProblemTags = db.prepare(`DELETE FROM ProblemTag WHERE problemId = ?`);
const findTag = db.prepare("SELECT id FROM Tag WHERE name = ?");
const insertProblemTag = db.prepare("INSERT INTO ProblemTag (problemId, tagId) VALUES (?, ?)");

const run = db.transaction(() => {
  updateProblem.run({ statement: STATEMENT, problemId });
  deleteSubtasks.run(problemId);

  cases.forEach((c, i) => {
    insertTestCase.run({
      problemId,
      input: c.input,
      output: c.output,
      isSample: c.isSample ? 1 : 0,
      order: i,
    });
  });

  deleteProblemTags.run(problemId);
  let tagged = 0;
  for (const tagName of TAGS) {
    const tag = findTag.get(tagName);
    if (tag) {
      insertProblemTag.run(problemId, tag.id);
      tagged++;
    }
  }

  return tagged;
});

const tagged = run();
console.log(`簡化題目：${TITLE} (id=${problemId})`);
console.log(`  移除子題配分，改為單一整題比對，${cases.length} 筆測資，${tagged}/${TAGS.length} 個標籤`);
db.close();
