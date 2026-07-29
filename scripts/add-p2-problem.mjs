// 新增「大里高中 初級營」P2：校長的口號到底多有梗？
// 部分給分：子題一（40 分，只看輸出第一行）／子題二（60 分，完整比對）。
//
//   node scripts/add-p2-problem.mjs                 加進 dev.db
//   node scripts/add-p2-problem.mjs --db oj.db       加進正式站資料庫
//
// 重跑會被擋掉（用標題判斷是否已存在），不會建立重複題目。
// 有對應的標籤（字串、陣列）存在的話會一併掛上，不存在就跳過（不負責建標籤，
// 那是 scripts/tag-problems.mjs 的事）。

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

const TITLE = "校長的口號到底多有梗？";
const TAGS = ["字串", "陣列"];

const STATEMENT = `## 題目描述

在大里高中，每年仲凱校長都宣布一句「精神口號」，例如去年是 PASSION，今年是 BELIEVE。學務處長年蒐集歷屆的精神口號紀錄，一共蒐集了 N 屆。

學務處發現，有些口號裡同一個字母出現不只一次，例如 PASSION 裡 S 出現兩次、BELIEVE 裡 E 出現三次，覺得這種「重複用字」的口號特別有記憶點，於是想統計一下歷屆的狀況。

每一屆的紀錄包含：

- 該屆的屆別 \`year\`（正整數，代表第幾屆，屆別彼此不重複）
- 該屆的精神口號 \`slogan\`（僅由大寫英文字母 A 到 Z 組成）

只要口號中，有任何一個字母出現次數達到 2 次以上（含 2 次），該屆就視為「重複用字口號」。

請寫一個程式，讀入全部 N 屆的紀錄後，輸出：

1. 「重複用字口號」的總屆數。
2. 每一屆「重複用字口號」的屆別，以及該屆口號中「出現次數最多的字母」與其出現次數，依屆別由小到大輸出。若同一屆有多個字母的出現次數並列最高，取字母順序（A 到 Z）最小的那一個。

## 輸入格式

輸入共 N+1 行。

- 第 1 行：一個正整數 N，代表蒐集的屆數。
- 第 2 行到第 N+1 行：第 i+1 行有兩個以恰一個空白分隔的資料，\`year_i\` 與 \`slogan_i\`，代表第 i 屆的屆別與該屆精神口號。

## 限制

- 1 ≤ N ≤ 1000
- 1 ≤ year_i ≤ 10000，且所有 year_i 皆不相同
- slogan_i 只包含大寫英文字母 A 到 Z，長度介於 1 到 20 之間

## 輸出格式

- 第 1 行：一個整數，代表「重複用字口號」的總屆數（範圍為 0 到 N）。

接下來，對於每一屆「重複用字口號」，依屆別由小到大各輸出一行，格式為：

\`\`\`
屆別 字母 次數
\`\`\`

三個欄位之間各以一個空白分隔。

若「重複用字口號」總屆數為 0，則第 1 行輸出 0 後，不再輸出任何後續內容。

## 範例一

範例輸入：

\`\`\`
5
1 PASSION
2 BELIEVE
3 DREAM
4 TOGETHER
5 SUCCESS
\`\`\`

範例輸出：

\`\`\`
4
1 S 2
2 E 3
4 E 2
5 S 3
\`\`\`

5 屆口號中，PASSION（S 出現 2 次）、BELIEVE（E 出現 3 次）、TOGETHER（T 與 E 皆出現 2 次，取字母順序較小的 E）、SUCCESS（S 出現 3 次）皆屬於重複用字口號，共 4 屆；DREAM 每個字母都只出現 1 次，不屬於重複用字口號。依屆別由小到大輸出，即為第 1、2、4、5 屆。

## 範例二

範例輸入：

\`\`\`
3
6 DREAM
7 UNITY
8 FOCUS
\`\`\`

範例輸出：

\`\`\`
0
\`\`\`

三屆口號都沒有任何字母重複出現，因此只輸出一行 0。
`;

// 參考解：算出每筆測資的正確輸出
function solve(input) {
  const lines = input.trim().split("\n");
  const n = parseInt(lines[0], 10);
  const results = [];
  for (let i = 1; i <= n; i++) {
    const [yearStr, slogan] = lines[i].trim().split(/\s+/);
    const year = parseInt(yearStr, 10);
    const freq = {};
    for (const ch of slogan) freq[ch] = (freq[ch] ?? 0) + 1;
    let maxCount = 0;
    for (const ch in freq) maxCount = Math.max(maxCount, freq[ch]);
    if (maxCount >= 2) {
      let bestLetter = null;
      for (let c = 65; c <= 90; c++) {
        const ch = String.fromCharCode(c);
        if (freq[ch] === maxCount) {
          bestLetter = ch;
          break;
        }
      }
      results.push({ year, letter: bestLetter, count: maxCount });
    }
  }
  results.sort((a, b) => a.year - b.year);
  const out = [String(results.length)];
  for (const r of results) out.push(`${r.year} ${r.letter} ${r.count}`);
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
  { input: "5\n1 PASSION\n2 BELIEVE\n3 DREAM\n4 TOGETHER\n5 SUCCESS", isSample: true },
  { input: "3\n6 DREAM\n7 UNITY\n8 FOCUS", isSample: true },
  { input: "1\n1 A", isSample: false },
  { input: "1\n1 AA", isSample: false },
  { input: "1\n100 ZZAABB", isSample: false },
  { input: "1\n42 " + "B".repeat(20), isSample: false },
  { input: "4\n50 XYZ\n10 AAB\n30 MNO\n20 CCD", isSample: false },
];
{
  const rng = makeRng(20260730);
  const n = 1000;
  const years = new Set();
  while (years.size < n) years.add(1 + Math.floor(rng() * 10000));
  const yearList = [...years];
  for (let i = yearList.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [yearList[i], yearList[j]] = [yearList[j], yearList[i]];
  }
  const A = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lines = [String(n)];
  for (let i = 0; i < n; i++) {
    const len = 1 + Math.floor(rng() * 20);
    let slogan = "";
    for (let j = 0; j < len; j++) slogan += A[Math.floor(rng() * 26)];
    lines.push(`${yearList[i]} ${slogan}`);
  }
  rawCases.push({ input: lines.join("\n"), isSample: false });
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
const insertSubtask = db.prepare(
  `INSERT INTO Subtask (problemId, "order", points, checkMode) VALUES (@problemId, @order, @points, @checkMode)`
);
const insertTestCase = db.prepare(
  `INSERT INTO TestCase (problemId, subtaskId, input, output, isSample, "order")
   VALUES (@problemId, @subtaskId, @input, @output, @isSample, @order)`
);
const findTag = db.prepare("SELECT id FROM Tag WHERE name = ?");
const insertProblemTag = db.prepare(
  "INSERT INTO ProblemTag (problemId, tagId) VALUES (?, ?)"
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
console.log(`  子題一 40 分（firstLine）／子題二 60 分（full），共 ${cases.length} 筆測資 x 2 子題`);
console.log(`  掛上 ${tagged}/${TAGS.length} 個標籤`);
db.close();
