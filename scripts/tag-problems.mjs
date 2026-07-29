// 幫現有題目建立標籤庫並掛上標籤（依題目標題比對）。
// 可重複執行：標籤已存在就跳過建立，題目已經掛過某標籤也不會重複掛。
//
//   node scripts/tag-problems.mjs                加進 dev.db
//   node scripts/tag-problems.mjs --db oj.db      加進正式站資料庫
//
// 之後要幫新題目補標籤，直接把 ASSIGNMENTS 加一筆、重跑一次即可。

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

const TAGS = [
  "輸入輸出",
  "條件判斷",
  "迴圈",
  "陣列",
  "字串",
  "數學",
  "動態規劃",
  "資料結構",
  "圖論",
  "模擬",
];

// 依題目標題比對，各題掛 1~2 個最貼切的標籤（依題敘實際內容分類，不是憑標題猜）
const ASSIGNMENTS = {
  "A + B Problem": ["輸入輸出", "數學"],
  "奇數還是偶數": ["條件判斷", "數學"],
  "三數最大值": ["條件判斷"],
  "字串反轉": ["字串"],
  "最大公因數": ["數學", "迴圈"],
  "費氏數列": ["動態規劃", "數學"],
  "括號配對": ["資料結構", "字串"],
  "最長遞增子序列": ["動態規劃", "陣列"],
  "0/1 背包": ["動態規劃"],
  "最短路徑": ["圖論"],
  "哈囉，資訊！": ["輸入輸出"],
  "判斷奇偶數": ["條件判斷", "數學"],
  "三數取最大值": ["條件判斷"],
  "簡易計算機": ["條件判斷"],
  "BMI 分級": ["條件判斷", "數學"],
  "質數判斷": ["數學", "迴圈"],
  "累加與累乘": ["迴圈", "數學"],
  "數字翻轉": ["迴圈", "數學"],
  "九九乘法表": ["迴圈", "模擬"],
  "直角三角形": ["迴圈", "模擬"],
  "菱形圖案（進階）": ["迴圈", "模擬"],
  "最大最小平均": ["陣列", "迴圈"],
  "矩陣加總": ["陣列", "迴圈"],
  "九宮格驗證": ["陣列", "模擬"],
  "子字串搜尋": ["字串"],
  "迴文判斷": ["字串"],
  "成績等第統計": ["陣列", "條件判斷"],
  "峰值偵測": ["陣列"],
  "最常見字元": ["字串", "陣列"],
  "畢業紀念冊之外的用途？": ["陣列", "模擬"],
};

const findTag = db.prepare("SELECT id FROM Tag WHERE name = ?");
const insertTag = db.prepare("INSERT INTO Tag (name) VALUES (?)");
const findProblem = db.prepare("SELECT id FROM Problem WHERE title = ?");
const linkExists = db.prepare(
  "SELECT 1 FROM ProblemTag WHERE problemId = ? AND tagId = ?"
);
const link = db.prepare(
  "INSERT INTO ProblemTag (problemId, tagId) VALUES (?, ?)"
);

const run = db.transaction(() => {
  const tagId = new Map();
  for (const name of TAGS) {
    const existing = findTag.get(name);
    if (existing) {
      tagId.set(name, existing.id);
      continue;
    }
    const info = insertTag.run(name);
    tagId.set(name, Number(info.lastInsertRowid));
    console.log(`建立標籤：${name}`);
  }

  let linked = 0;
  let missingProblems = [];
  for (const [title, tagNames] of Object.entries(ASSIGNMENTS)) {
    const problem = findProblem.get(title);
    if (!problem) {
      missingProblems.push(title);
      continue;
    }
    for (const tagName of tagNames) {
      const tid = tagId.get(tagName);
      if (!linkExists.get(problem.id, tid)) {
        link.run(problem.id, tid);
        linked++;
      }
    }
  }
  return { linked, missingProblems };
});

const { linked, missingProblems } = run();
console.log(`掛上 ${linked} 筆題目-標籤關聯`);
if (missingProblems.length > 0) {
  console.log(`找不到這些題目（標題不吻合，略過）：${missingProblems.join("、")}`);
}
db.close();
