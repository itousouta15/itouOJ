// 新增獨立題目「資料卡片還原」，含 30 / 30 / 40 分子題與測資。
// 用法：node scripts/add-data-card-restoration-problem.mjs [--db oj.db]
// 預設使用 DATABASE_URL（未設定時為 prisma/data/dev.db）；重跑不會重複新增。

import "dotenv/config";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import Database from "better-sqlite3";
import { nextProblemCode } from "./lib/problemCode.mjs";

const argv = process.argv.slice(2);
function flag(name, fallback) {
  const i = argv.indexOf("--" + name);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--")
    ? argv[i + 1]
    : fallback;
}

const dbPath = flag("db", (process.env.DATABASE_URL ?? "file:./prisma/data/dev.db").replace(/^file:/, ""));
if (!existsSync(dbPath)) throw new Error(`資料庫不存在：${dbPath}`);

const TITLE = "資料卡片還原";
const TAGS = ["字串", "模擬"];

const STATEMENT = `## 題目描述

研究員用一種方式打亂資料卡片上的字串。每次打亂時，他會選定一個正整數 \`k\`，並依照下列步驟操作：

1. 將字串由左到右，依序放入每排 \`k\` 個位置的展示架。放滿一排後換下一排；最後一排可以不滿。
2. 從展示架最左邊的直行開始，由上到下取出字元，再依序處理右邊的直行。沒有放字元的位置直接跳過。

例如，字串 \`ABCDEFGHIJK\` 在 \`k = 4\` 時會被排成：

\`\`\`text
A B C D
E F G H
I J K
\`\`\`

依直行取出字元後，得到 \`AEIBFJCGKDH\`。

研究員對同一張卡片連續操作了 \`m\` 次，第 \`i\` 次使用的數字是 \`k_i\`，每次操作的結果會成為下一次操作的輸入。現在你拿到了最後得到的字串，請還原卡片上**最初的字串**。

## 輸入格式

第一行有兩個正整數 \`n\`、\`m\`，分別代表字串長度與操作次數。

第二行有 \`m\` 個正整數 \`k_1, k_2, ..., k_m\`，依序代表每次操作使用的數字。

第三行有一個長度為 \`n\` 的字串，代表最後得到的字串。字串只包含大寫英文字母。

## 限制

- 1 ≤ n ≤ 100
- 1 ≤ m ≤ 100
- 1 ≤ k_i ≤ n

## 子題

- 子題一（30 分）：m = 1，且 n 是 k_1 的倍數。
- 子題二（30 分）：m = 1。
- 子題三（40 分）：無額外限制。

## 輸出格式

輸出一行，為卡片上最初的字串。

## 範例一

範例輸入：

\`\`\`text
11 1
4
AEIBFJCGKDH
\`\`\`

範例輸出：

\`\`\`text
ABCDEFGHIJK
\`\`\`

## 範例二

範例輸入：

\`\`\`text
13 2
4 3
AMJKLEBCDIFGH
\`\`\`

範例輸出：

\`\`\`text
ABCDEFGHIJKLM
\`\`\`

範例二第一次操作得到 \`AEIMBFJCGKDHL\`，第二次操作得到 \`AMJKLEBCDIFGH\`。
`;

// 用正向操作產生密文，獨立以逆向還原驗證測資。
function encode(text, k) {
  let result = "";
  for (let col = 0; col < k; col++) {
    for (let i = col; i < text.length; i += k) result += text[i];
  }
  return result;
}

function decode(text, k) {
  const n = text.length;
  const original = Array(n);
  let pos = 0;
  for (let col = 0; col < k; col++) {
    for (let i = col; i < n; i += k) original[i] = text[pos++];
  }
  return original.join("");
}

function makeRng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const rng = makeRng(20260927);
const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
function randomText(n) {
  return Array.from({ length: n }, () => letters[Math.floor(rng() * 26)]).join("");
}

const rawCases = [
  { text: "ABCDEFGH", widths: [4], subtask: 1 },
  { text: "A", widths: [1], subtask: 1 },
  { text: "ZZZZZZ", widths: [3], subtask: 1 },
  { text: "ABCDEFGHIJK", widths: [4], subtask: 2, sample: "AEIBFJCGKDH" },
  { text: "ABCDE", widths: [2], subtask: 2 },
  { text: "ABCDEFGHIJKL", widths: [11], subtask: 2 },
  { text: "ABCDEFGHIJKLM", widths: [4, 3], subtask: 3, sample: "AMJKLEBCDIFGH" },
  { text: "A", widths: Array(100).fill(1), subtask: 3 },
  { text: "ABCDEFGHI", widths: [1, 9, 2, 4], subtask: 3 },
  { text: "AABBAABBAAB", widths: [3, 5, 2], subtask: 3 },
];

for (let i = 0; i < 10; i++) {
  const n = 1 + Math.floor(rng() * 100);
  const divisors = Array.from({ length: n }, (_, j) => j + 1).filter((k) => n % k === 0);
  rawCases.push({ text: randomText(n), widths: [divisors[Math.floor(rng() * divisors.length)]], subtask: 1 });
}
rawCases.push({ text: randomText(100), widths: [10], subtask: 1 });

for (let i = 0; i < 12; i++) {
  const n = 3 + Math.floor(rng() * 98);
  const widths = Array.from({ length: n - 2 }, (_, j) => j + 2).filter((k) => n % k !== 0);
  rawCases.push({ text: randomText(n), widths: [widths[Math.floor(rng() * widths.length)]], subtask: 2 });
}
rawCases.push({ text: randomText(100), widths: [99], subtask: 2 });

for (let i = 0; i < 12; i++) {
  const n = 2 + Math.floor(rng() * 99);
  const m = 2 + Math.floor(rng() * 99);
  const widths = Array.from({ length: m }, () => 1 + Math.floor(rng() * n));
  rawCases.push({ text: randomText(n), widths, subtask: 3 });
}
rawCases.push({ text: randomText(100), widths: Array.from({ length: 100 }, (_, i) => (i % 3 === 0 ? 7 : i % 3 === 1 ? 100 : 3)), subtask: 3 });

const cases = rawCases.map(({ text, widths, subtask, sample }) => {
  const n = text.length;
  assert.ok(n >= 1 && n <= 100 && widths.length >= 1 && widths.length <= 100);
  assert.ok(widths.every((k) => k >= 1 && k <= n));
  if (subtask === 1) assert.ok(widths.length === 1 && n % widths[0] === 0);
  if (subtask === 2) assert.equal(widths.length, 1);
  const encrypted = widths.reduce((current, k) => encode(current, k), text);
  assert.equal(widths.reduceRight((current, k) => decode(current, k), encrypted), text);
  if (sample) assert.equal(encrypted, sample);
  return {
    subtask,
    input: `${n} ${widths.length}\n${widths.join(" ")}\n${encrypted}`,
    output: text,
    isSample: sample ? 1 : 0,
  };
});

const db = new Database(dbPath, { fileMustExist: true });
try {
  db.pragma("foreign_keys = ON");
  const existing = db.prepare("SELECT id, \"problemCode\" FROM Problem WHERE title = ? AND type = 'PROGRAMMING'").get(TITLE);
  if (existing) {
    console.log(`跳過（已存在）：${TITLE} (id=${existing.id}, problemCode=${existing.problemCode})`);
  } else {
    const insertProblem = db.prepare(
      `INSERT INTO Problem (title, statement, difficulty, timeLimitMs, memoryLimitMb, isPublic, "problemCode", createdAt)
       VALUES (?, ?, 'medium', 1000, 256, 1, ?, datetime('now'))`
    );
    const insertSubtask = db.prepare(
      `INSERT INTO Subtask (problemId, "order", points, checkMode) VALUES (?, ?, ?, 'full')`
    );
    const insertTestCase = db.prepare(
      `INSERT INTO TestCase (problemId, subtaskId, input, output, isSample, "order") VALUES (?, ?, ?, ?, ?, ?)`
    );
    const findTag = db.prepare("SELECT id FROM Tag WHERE name = ?");
    const insertTag = db.prepare("INSERT INTO ProblemTag (problemId, tagId) VALUES (?, ?)");

    const result = db.transaction(() => {
      const problemCode = nextProblemCode(
        (db.prepare(`SELECT MAX("problemCode") AS m FROM Problem WHERE type = 'PROGRAMMING'`).get().m ?? null)
      );
      const problemId = Number(insertProblem.run(TITLE, STATEMENT, problemCode).lastInsertRowid);
      const subtasks = new Map([30, 30, 40].map((points, i) => [
        i + 1, Number(insertSubtask.run(problemId, i + 1, points).lastInsertRowid),
      ]));
      cases.forEach((test, i) => {
        insertTestCase.run(problemId, subtasks.get(test.subtask), test.input, test.output, test.isSample, i + 1);
      });
      for (const name of TAGS) {
        const tag = findTag.get(name);
        if (tag) insertTag.run(problemId, tag.id);
      }
      return { problemId, problemCode };
    })();
    console.log(`建立題目：${TITLE} (id=${result.problemId}, problemCode=${result.problemCode})`);
    console.log(`  3 個子題（30 / 30 / 40 分），${cases.length} 筆測資，${cases.filter((c) => c.isSample).length} 筆範例`);
  }
} finally {
  db.close();
}
