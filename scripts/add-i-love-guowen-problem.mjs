// 新增單一題目「我愛國文！」：判斷每位學生的國文成績有沒有低於門檻。
// 不掛在任何課程底下（獨立題目），跟 add-household-registration-problem 的模式一樣。
//
//   node scripts/add-i-love-guowen-problem.mjs                 加進 dev.db
//   node scripts/add-i-love-guowen-problem.mjs --db oj.db      加進正式站資料庫
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

const TITLE = "我愛國文！";
const TAGS = ["條件判斷", "迴圈"];

const STATEMENT = `## 題目描述

樺哥是大里高中知名國文老師，因為有著各式各樣的點子而出名。最知名的就是在走廊上大喊「我愛國文！」。而觸發這個遊戲的條件也很簡單，只要國文考試沒有達到他訂的標準就可以拿到遊戲的門票。Jason 身為一個對國文一竅不通的人也是玩過好幾次。

今天因為全班太多人想玩而樺哥忙不過來，沒辦法分辨誰需要喊「我愛國文！」。因此，想請聰明的各位幫助樺哥寫一段程式，分辨誰需要喊而誰不用喊。

## 輸入格式

第一行一個整數 Q，代表班上學生的數量。
第二行一個整數 Score，代表樺哥訂的及格標準。
第三行有 Q 個以空白分隔的整數，依序代表每位學生的國文成績。

## 限制

- 1 ≤ Q ≤ 1000
- 0 ≤ Score ≤ 100
- 每位學生的成績為 0 到 100 之間的整數

## 輸出格式

依序輸出 Q 行：若該位學生的成績大於等於 Score，輸出 \`Safe!\`；否則輸出 \`我愛國文！\`。

## 範例一

範例輸入：

\`\`\`
3
60
47 66 67
\`\`\`

範例輸出：

\`\`\`
我愛國文！
Safe!
Safe!
\`\`\`

## 提示

成績「等於」標準也算過關，不用喊「我愛國文！」。
`;

function solve(input) {
  const lines = input.trim().split("\n");
  const score = parseInt(lines[1].trim(), 10);
  const scores = lines[2].trim().split(/\s+/).map((x) => parseInt(x, 10));
  return scores
    .map((s) => (s >= score ? "Safe!" : "我愛國文！"))
    .join("\n");
}

function makeRng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const rawCases = [
  { q: 3, score: 60, scores: [47, 66, 67], isSample: true },
  { q: 1, score: 60, scores: [60], isSample: false }, // 剛好等於標準
  { q: 1, score: 60, scores: [59], isSample: false }, // 差一分
  { q: 5, score: 0, scores: [0, 0, 0, 0, 0], isSample: false }, // 標準是 0，全員過關
  { q: 5, score: 100, scores: [100, 99, 100, 0, 50], isSample: false }, // 標準是 100，幾乎全喊
  { q: 4, score: 50, scores: [100, 0, 50, 49], isSample: false },
];
{
  const rng = makeRng(20260819);
  for (let i = 0; i < 6; i++) {
    const q = 1 + Math.floor(rng() * 20);
    const score = Math.floor(rng() * 101);
    const scores = Array.from({ length: q }, () => Math.floor(rng() * 101));
    rawCases.push({ q, score, scores, isSample: false });
  }
  // 大型測資：Q 上限 1000
  for (let i = 0; i < 2; i++) {
    const q = 1000;
    const score = Math.floor(rng() * 101);
    const scores = Array.from({ length: q }, () => Math.floor(rng() * 101));
    rawCases.push({ q, score, scores, isSample: false });
  }
}
const cases = rawCases.map((c) => {
  const input = `${c.q}\n${c.score}\n${c.scores.join(" ")}`;
  return { input, output: solve(input), isSample: c.isSample };
});

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
