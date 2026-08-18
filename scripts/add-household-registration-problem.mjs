// 新增單一題目「戶政事務所的四則運算」：給運算符號跟兩個整數，輸出運算結果。
// 不掛在任何課程底下（獨立題目），跟 add-p1/add-p2 的模式一樣。
//
//   node scripts/add-household-registration-problem.mjs                 加進 dev.db
//   node scripts/add-household-registration-problem.mjs --db oj.db      加進正式站資料庫
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

const TITLE = "戶政事務所的四則運算";
const TAGS = ["輸入輸出", "數學"];

const STATEMENT = `## 題目描述

小真和小志決定去戶政事務所登記結婚，卻遇上一位很愛出題的承辦人員：兩人必須在櫃檯前算出一道四則運算，才能受理申請。可惜她們的數學都不太靈光，只好求助擅長寫程式的你。

給定一個運算符號 S 與兩個整數 N、M，請計算並輸出 N S M 的結果。

## 輸入格式

第一行包含三個以單一空白分隔的資料，依序為 S、N、M。S 為運算符號，N、M 為整數。

## 限制

- S ∈ { +, -, *, / }
- 0 ≤ N ≤ 10⁵
- 0 ≤ M ≤ 10⁵
- 當 S 為 / 時，保證 M ≥ 1 且 N 為 M 的倍數（即除法必定整除）

## 輸出格式

輸出一個整數，代表運算結果，並換行。

## 範例一

範例輸入：

\`\`\`
+ 4 5
\`\`\`

範例輸出：

\`\`\`
9
\`\`\`

## 範例二

範例輸入：

\`\`\`
/ 90 45
\`\`\`

範例輸出：

\`\`\`
2
\`\`\`

## 範例三

範例輸入：

\`\`\`
- 3 10
\`\`\`

範例輸出：

\`\`\`
-7
\`\`\`

## 提示

減法的結果可能為負數。乘法的結果最大可達 10¹⁰，超過 32 位元有號整數的表示範圍；使用 C/C++ 請以 \`long long\` 儲存，Java 請用 \`long\`，Python 則不需特別處理。
`;

function solve(input) {
  const [s, nStr, mStr] = input.trim().split(/\s+/);
  const n = parseInt(nStr, 10);
  const m = parseInt(mStr, 10);
  let result;
  if (s === "+") result = n + m;
  else if (s === "-") result = n - m;
  else if (s === "*") result = n * m;
  else if (s === "/") result = n / m;
  else throw new Error(`unknown op: ${s}`);
  return String(result);
}

function makeRng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const rawCases = [
  { input: "+ 4 5", isSample: true },
  { input: "/ 90 45", isSample: true },
  { input: "- 3 10", isSample: true },
  { input: "* 100000 100000", isSample: false }, // 10^10，測 long long
  { input: "+ 0 0", isSample: false },
  { input: "- 0 100000", isSample: false },
  { input: "* 0 12345", isSample: false },
  { input: "/ 100000 1", isSample: false },
  { input: "/ 0 5", isSample: false }, // 0 是 5 的倍數
  { input: "+ 100000 100000", isSample: false },
  { input: "- 100000 0", isSample: false },
  { input: "* 99999 2", isSample: false },
];
{
  const rng = makeRng(20260819);
  const ops = ["+", "-", "*", "/"];
  for (let i = 0; i < 12; i++) {
    const op = ops[Math.floor(rng() * ops.length)];
    if (op === "/") {
      const m = 1 + Math.floor(rng() * 100000);
      const maxK = Math.floor(100000 / m);
      const k = Math.floor(rng() * (maxK + 1));
      rawCases.push({ input: `/ ${m * k} ${m}`, isSample: false });
    } else {
      const n = Math.floor(rng() * 100001);
      const m = Math.floor(rng() * 100001);
      rawCases.push({ input: `${op} ${n} ${m}`, isSample: false });
    }
  }
}
const cases = rawCases.map((c) => ({ ...c, output: solve(c.input) }));

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
