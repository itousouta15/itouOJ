// 新增「大里高中 初級營」P1：畢業紀念冊之外的用途？
// 部分給分：子題一（40 分，只看輸出第一行）／子題二（60 分，完整比對）。
//
//   node scripts/add-p1-problem.mjs                 加進 dev.db
//   node scripts/add-p1-problem.mjs --db oj.db       加進正式站資料庫
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

const TITLE = "畢業紀念冊之外的用途？";

const STATEMENT = `## 題目描述

小里高中為了製作畢業紀念冊，向全校學生徵求封面與內頁的美術設計投稿，共收到 N 件作品。

依照徵稿公告，每件投稿作品僅同意用於畢業紀念冊，不包含其他用途。

活動結束後，校方清查了每件作品實際被使用的情形，發現部分作品被用於畢業紀念冊以外的用途。每件作品都恰好對應一筆使用紀錄，包含：

- 該作品創作者的學生座號 \`owner\`
- 該作品實際被使用的用途代碼 \`purpose\`，代碼意義如下：

| 代碼 | 用途 |
| --- | --- |
| 1 | 畢業紀念冊 |
| 2 | 宣傳海報 |
| 3 | 社群發文 |

只要作品的 \`purpose\` 為 2 或 3，該作品即視為「超出原授權範圍使用」（以下稱違規作品）。

請寫一個程式，讀入全部 N 件作品的紀錄後，輸出：

1. 違規作品的總件數。
2. 每一位「至少有一件作品違規」的學生，其座號與違規件數，依座號由小到大輸出。

## 輸入格式

輸入共 N+1 行。

- 第 1 行：一個正整數 N，代表投稿作品件數。
- 第 2 行到第 N+1 行：第 i+1 行有兩個以恰一個空白分隔的整數 \`owner_i\` 與 \`purpose_i\`，代表第 i 件作品的創作者座號與實際用途代碼。

## 限制

- 1 ≤ N ≤ 1000
- 1 ≤ owner_i ≤ 100
- purpose_i ∈ {1, 2, 3}
- 同一位學生（同一個 owner）可能投稿多件作品，因此 owner_i 可以重複出現。

## 輸出格式

- 第 1 行：一個整數，代表違規作品的總件數（範圍為 0 到 N）。

接下來，對於每一位至少有一件作品違規的學生，依座號由小到大各輸出一行，格式為：

\`\`\`
座號 違規件數
\`\`\`

座號與違規件數之間以一個空白分隔。

若違規作品總件數為 0（即沒有任何學生違規），則第 1 行輸出 0 後，不再輸出任何後續內容（也就是只有 1 行輸出）。

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
1 2
2 1
3 1
\`\`\`

5 件作品中，第 1、3、4、5 件的用途代碼為 2 或 3，屬於違規，共 4 件；第 2 件用途為 1，合規。違規作品的擁有者分別是：學生 1（第 1、3 件，共 2 件）、學生 3（第 4 件，共 1 件）、學生 2（第 5 件，共 1 件）。依座號由小到大輸出，即為學生 1、2、3。

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

三件作品的用途皆為 1（畢業紀念冊），沒有任何違規作品，因此只輸出一行 0。
`;

// 參考解：算出每筆測資的正確輸出
function solve(input) {
  const lines = input.trim().split("\n");
  const n = parseInt(lines[0], 10);
  const counts = new Map();
  let total = 0;
  for (let i = 1; i <= n; i++) {
    const [owner, purpose] = lines[i].trim().split(/\s+/).map(Number);
    if (purpose !== 1) {
      total++;
      counts.set(owner, (counts.get(owner) ?? 0) + 1);
    }
  }
  const out = [String(total)];
  if (total > 0) {
    for (const k of [...counts.keys()].sort((a, b) => a - b)) {
      out.push(`${k} ${counts.get(k)}`);
    }
  }
  return out.join("\n");
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
  const rng = makeRng(20260729);
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

const existing = db
  .prepare("SELECT id FROM Problem WHERE title = ?")
  .get(TITLE);
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
const insertSubtask = db.prepare(
  `INSERT INTO Subtask (problemId, "order", points, checkMode) VALUES (@problemId, @order, @points, @checkMode)`
);
const insertTestCase = db.prepare(
  `INSERT INTO TestCase (problemId, subtaskId, input, output, isSample, "order")
   VALUES (@problemId, @subtaskId, @input, @output, @isSample, @order)`
);

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

  const subtask1 = Number(
    insertSubtask.run({ problemId, order: 1, points: 40, checkMode: "firstLine" }).lastInsertRowid
  );
  const subtask2 = Number(
    insertSubtask.run({ problemId, order: 2, points: 60, checkMode: "full" }).lastInsertRowid
  );

  let order = 1;
  // 子題一：只看第一行，所以拿完整輸出當期望值也沒差（比對時只取第一行）
  for (const c of cases) {
    insertTestCase.run({
      problemId,
      subtaskId: subtask1,
      input: c.input,
      output: c.output,
      isSample: 0, // 子題一這份不顯示成範例，避免跟子題二重複顯示
      order: order++,
    });
  }
  // 子題二：完整比對，官方範例只在這裡標記 isSample
  for (const c of cases) {
    insertTestCase.run({
      problemId,
      subtaskId: subtask2,
      input: c.input,
      output: c.output,
      isSample: c.isSample ? 1 : 0,
      order: order++,
    });
  }

  return problemId;
});

const problemId = run();
console.log(`建立題目：${TITLE} (id=${problemId}, order=${nextOrder})`);
console.log(`  子題一 40 分（firstLine）／子題二 60 分（full），共 ${cases.length} 筆測資 x 2 子題`);
db.close();
