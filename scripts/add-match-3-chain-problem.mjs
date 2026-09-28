// 新增獨立題目「三消連鎖」，含 40 / 60 分子題與測資。
// 用法：node scripts/add-match-3-chain-problem.mjs [--db oj.db]
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

const TITLE = "三消連鎖";
const TAGS = ["模擬", "陣列"];

const STATEMENT = `## 題目描述

快樂 TLE 牧場的羊最近迷上一款消除遊戲。遊戲盤面有 \`R\` 個橫列、\`C\` 個直行，每一格是空格（以 0 表示）或是一個方塊，方塊共有 1 到 5 五種顏色。

同一橫列中連續 **3 個以上**左右相鄰且顏色相同的方塊，或同一直行中連續 **3 個以上**上下相鄰且顏色相同的方塊，稱為一條連線。空格不屬於任何顏色，不會形成連線。

遊戲以輪為單位進行，每一輪依序執行下列三個步驟：

1. 找出目前盤面上所有屬於連線的方塊。一個方塊同時屬於橫向與直向連線時只算一次。若找不到任何這樣的方塊，遊戲結束。
2. 將步驟 1 找到的方塊**全部同時消除**，變成空格。
3. 所有方塊往下掉落，直到正下方是盤面底部或其他方塊為止；同一直行的方塊掉落後上下順序保持不變。

步驟 3 結束後若盤面又出現連線，就會接著進行下一輪，形成連鎖。

給定初始盤面，請輸出總共進行了幾輪消除、總共消除了幾個方塊，以及遊戲結束時的盤面。

## 輸入格式

第一行有兩個正整數 \`R\`、\`C\`，分別是盤面的橫列數與直行數。

接下來 \`R\` 行依序是由上而下的每一個橫列，每行有 \`C\` 個 0 到 5 的整數，由左而右排列，兩數字之間以一個空白間隔。

保證初始盤面沒有懸空的方塊，也就是若某一格是空格，它正上方的格子（若存在）也是空格。

## 限制與子題

- 1 ≤ R, C ≤ 50
- 子題一（40 分）：C = 1。
- 子題二（60 分）：無額外限制。

## 輸出格式

第一行輸出兩個整數 \`K\`、\`S\`，以一個空白間隔，\`K\` 是總共進行了幾輪消除，\`S\` 是總共消除了幾個方塊。

接下來輸出遊戲結束時的盤面，共 \`R\` 行，每行 \`C\` 個整數，以一個空白間隔。

## 範例一

範例輸入：

\`\`\`text
4 4
1 2 3 3
2 2 2 3
4 2 1 3
4 1 1 2
\`\`\`

範例輸出：

\`\`\`text
1 8
0 0 0 0
1 0 3 0
4 0 1 0
4 1 1 2
\`\`\`

第二橫列的三個 2 與第二直行的三個 2 交會，共消除 5 個方塊；第四直行的三個 3 也被消除。第一輪共消除 8 個方塊，掉落後不再有連線。

## 範例二

範例輸入：

\`\`\`text
5 3
0 2 0
0 1 0
0 1 0
2 1 2
3 3 1
\`\`\`

範例輸出：

\`\`\`text
2 6
0 0 0
0 0 0
0 0 0
0 0 0
3 3 1
\`\`\`

第一輪消除第二直行的三個 1；上方的 2 掉落後與左右兩個 2 形成橫向連線，第二輪再消除這三個 2。
`;

function solve(board) {
  const grid = board.map((row) => [...row]);
  const R = grid.length;
  const C = grid[0].length;
  let rounds = 0;
  let removed = 0;

  while (true) {
    const marked = Array.from({ length: R }, () => Array(C).fill(false));
    for (let r = 0; r < R; r++) {
      for (let c = 0; c < C;) {
        let end = c + 1;
        while (end < C && grid[r][end] === grid[r][c]) end++;
        if (grid[r][c] !== 0 && end - c >= 3) {
          for (let i = c; i < end; i++) marked[r][i] = true;
        }
        c = end;
      }
    }
    for (let c = 0; c < C; c++) {
      for (let r = 0; r < R;) {
        let end = r + 1;
        while (end < R && grid[end][c] === grid[r][c]) end++;
        if (grid[r][c] !== 0 && end - r >= 3) {
          for (let i = r; i < end; i++) marked[i][c] = true;
        }
        r = end;
      }
    }

    let count = 0;
    for (let r = 0; r < R; r++) {
      for (let c = 0; c < C; c++) {
        if (marked[r][c]) {
          grid[r][c] = 0;
          count++;
        }
      }
    }
    if (count === 0) break;
    rounds++;
    removed += count;

    for (let c = 0; c < C; c++) {
      let write = R - 1;
      for (let r = R - 1; r >= 0; r--) {
        if (grid[r][c] !== 0) grid[write--][c] = grid[r][c];
      }
      for (; write >= 0; write--) grid[write][c] = 0;
    }
  }
  return `${rounds} ${removed}\n${grid.map((row) => row.join(" ")).join("\n")}`;
}

function makeRng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const rng = makeRng(20260928);
function randomBoard(rows, cols, colors, maxEmpty = 0) {
  const heights = Array.from({ length: cols }, () => rows - Math.floor(rng() * (maxEmpty + 1)));
  return Array.from({ length: rows }, (_, r) =>
    heights.map((height) => r < rows - height ? 0 : 1 + Math.floor(rng() * colors))
  );
}

const rawCases = [
  { board: [[0]], subtask: 1, expected: "0 0\n0" },
  { board: [[5]], subtask: 1, expected: "0 0\n5" },
  { board: [[1], [1]], subtask: 1, expected: "0 0\n1\n1" },
  { board: [[2], [2], [2]], subtask: 1, expected: "1 3\n0\n0\n0" },
  { board: [[5], [5], [1], [1], [1], [5], [5]], subtask: 1,
    expected: "2 7\n0\n0\n0\n0\n0\n0\n0" },
  { board: [[0], [0], [2], [2], [3], [3]], subtask: 1 },
  { board: Array.from({ length: 50 }, () => [4]), subtask: 1 },
  { board: Array.from({ length: 50 }, (_, r) => [r % 2 + 1]), subtask: 1 },
  { board: Array.from({ length: 50 }, (_, r) => [r < 20 ? 0 : r < 25 ? 1 : r < 28 ? 2 : 3]), subtask: 1 },
  { board: [
    [1, 2, 3, 3], [2, 2, 2, 3], [4, 2, 1, 3], [4, 1, 1, 2],
  ], subtask: 2, isSample: true,
  expected: "1 8\n0 0 0 0\n1 0 3 0\n4 0 1 0\n4 1 1 2" },
  { board: [
    [0, 2, 0], [0, 1, 0], [0, 1, 0], [2, 1, 2], [3, 3, 1],
  ], subtask: 2, isSample: true,
  expected: "2 6\n0 0 0\n0 0 0\n0 0 0\n0 0 0\n3 3 1" },
  { board: [[1, 1, 1]], subtask: 2, expected: "1 3\n0 0 0" },
  { board: [[0, 0, 0, 0]], subtask: 2, expected: "0 0\n0 0 0 0" },
  { board: [[1, 1, 1, 1, 1, 1]], subtask: 2 },
  { board: [[1, 2, 3, 4, 5, 1]], subtask: 2 },
  { board: [[1, 2, 3], [1, 4, 5], [1, 2, 3]], subtask: 2 },
  { board: [[1, 2, 1], [1, 2, 1], [1, 2, 1]], subtask: 2, expected: "1 9\n0 0 0\n0 0 0\n0 0 0" },
  { board: Array.from({ length: 50 }, (_, r) => Array.from({ length: 50 }, (_, c) => (r + c) % 5 + 1)), subtask: 2 },
  { board: Array.from({ length: 50 }, () => Array(50).fill(5)), subtask: 2 },
];

for (let i = 0; i < 12; i++) rawCases.push({ board: randomBoard(50, 1, i % 2 ? 2 : 5, i % 3 ? 10 : 0), subtask: 1 });
for (let i = 0; i < 12; i++) rawCases.push({ board: randomBoard(50, 50, i % 2 ? 3 : 5, i % 3 ? 20 : 0), subtask: 2 });

// 確保有至少三輪的交錯連鎖測資，而非僅測官方範例的兩輪。
let longChain = null;
for (let i = 0; i < 5000 && !longChain; i++) {
  const board = randomBoard(8, 8, 3, 3);
  if (Number(solve(board).split(" ", 1)[0]) >= 3) longChain = board;
}
assert.ok(longChain, "找不到三輪連鎖的測資");
rawCases.push({ board: longChain, subtask: 2 });

const cases = rawCases.map(({ board, subtask, isSample = false, expected }) => {
  const R = board.length;
  const C = board[0].length;
  assert.ok(R >= 1 && R <= 50 && C >= 1 && C <= 50);
  if (subtask === 1) assert.equal(C, 1);
  for (let r = 0; r < R; r++) {
    assert.equal(board[r].length, C);
    for (let c = 0; c < C; c++) {
      assert.ok(Number.isInteger(board[r][c]) && board[r][c] >= 0 && board[r][c] <= 5);
      if (r > 0 && board[r][c] === 0) assert.equal(board[r - 1][c], 0);
    }
  }
  const output = solve(board);
  if (expected) assert.equal(output, expected);
  return {
    subtask, isSample: Number(isSample),
    input: `${R} ${C}\n${board.map((row) => row.join(" ")).join("\n")}`,
    output,
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
        db.prepare(`SELECT MAX("problemCode") AS m FROM Problem WHERE type = 'PROGRAMMING'`).get().m ?? null
      );
      const problemId = Number(insertProblem.run(TITLE, STATEMENT, problemCode).lastInsertRowid);
      const subtasks = new Map([[1, 40], [2, 60]].map(([order, points]) => [
        order, Number(insertSubtask.run(problemId, order, points).lastInsertRowid),
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
    console.log(`  2 個子題（40 / 60 分），${cases.length} 筆測資，${cases.filter((c) => c.isSample).length} 筆範例`);
  }
} finally {
  db.close();
}
