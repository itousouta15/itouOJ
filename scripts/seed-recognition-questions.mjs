// 新增「程式識別」練習題範例（C / Python 兩類）。
//
//   node scripts/seed-recognition-questions.mjs           加進 dev.db
//   node scripts/seed-recognition-questions.mjs --db oj.db 加進正式站資料庫
//
// 重跑會被擋掉（用題目文字判斷是否已存在），不會建立重複題目。

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

const QUESTIONS = [
  {
    category: "C",
    question: "這個程式輸出什麼？",
    code: `#include <stdio.h>

int main() {
    int sum = 0;
    for (int i = 1; i <= 5; i++) {
        sum += i;
    }
    printf("%d", sum);
    return 0;
}`,
    options: ["10", "15", "20", "25"],
    answerIndex: 1,
    explanation: "迴圈把 1 到 5 全部加起來：1+2+3+4+5 = 15。",
  },
  {
    category: "C",
    question: "這個程式在做什麼？",
    code: `#include <stdio.h>

int main() {
    int a[] = {3, 7, 2, 9, 4};
    int n = 5;
    int m = a[0];
    for (int i = 1; i < n; i++) {
        if (a[i] > m) {
            m = a[i];
        }
    }
    printf("%d", m);
    return 0;
}`,
    options: ["找陣列的最大值", "找陣列的最小值", "計算陣列總和", "把陣列排序"],
    answerIndex: 0,
    explanation: "變數 m 先記第一個元素，之後每個元素只要比 m 大就更新 m，最後 m 就是最大值。",
  },
  {
    category: "C",
    question: "這個程式會印出什麼圖形？",
    code: `#include <stdio.h>

int main() {
    for (int i = 1; i <= 3; i++) {
        for (int j = 1; j <= i; j++) {
            printf("*");
        }
        printf("\\n");
    }
    return 0;
}`,
    options: [
      "印出 1 到 3 顆星的三角形",
      "印出一個 3×3 的星號方陣",
      "印出 3 到 1 顆星的倒三角形",
      "印出 1 到 3 的數字",
    ],
    answerIndex: 0,
    explanation:
      "外層迴圈控制第幾行（1~3），內層迴圈印出對應數量的星星，所以是三角形。",
  },
  {
    category: "Python",
    question: "這個程式輸出什麼？",
    code: `total = 0
for i in range(1, 6):
    if i % 2 == 0:
        total += i
print(total)`,
    options: ["6", "9", "15", "20"],
    answerIndex: 0,
    explanation: "只把 1~5 之間的偶數加起來：2+4 = 6。",
  },
  {
    category: "Python",
    question: "這個程式在做什麼？",
    code: `s = "racecar"
left, right = 0, len(s) - 1
ok = True
while left < right:
    if s[left] != s[right]:
        ok = False
        break
    left += 1
    right -= 1
print(ok)`,
    options: ["判斷 s 是不是回文", "計算字串長度", "把字串反轉", "找字串中最長的字元"],
    answerIndex: 0,
    explanation:
      "左右兩端一字元一字元往中間比對，全部一樣才是回文。racecar 正反讀都一樣，所以印出 True。",
  },
  {
    category: "Python",
    question: "這個程式輸出什麼？",
    code: `for i in range(1, 4):
    print(i, end="")
    for j in range(i):
        print("x", end="")
    print()`,
    options: ["1x\\n2xx\\n3xxx", "123", "xxx\\nxxx\\nxxx", "1\\n22\\n333"],
    answerIndex: 0,
    explanation:
      "每一行先印數字 i，再印 i 個 x，所以依序是 1x、2xx、3xxx。",
  },
];

const insert = db.prepare(
  `INSERT INTO RecognitionQuestion
     (code, question, category, options, answerIndex, explanation, isPublic, "order", createdAt)
   VALUES (?, ?, ?, ?, ?, ?, 1, ?, datetime('now'))`
);
const exists = db.prepare("SELECT id FROM RecognitionQuestion WHERE code = ?");

let added = 0;
for (const q of QUESTIONS) {
  if (exists.get(q.code)) {
    console.log(`  略過（已存在）：${q.question}（${q.category}）`);
    continue;
  }
  insert.run(q.code, q.question, q.category, JSON.stringify(q.options), q.answerIndex, q.explanation, added);
  console.log(`  新增：${q.question}（${q.category}）`);
  added++;
}

console.log(`完成，共新增 ${added} 題。`);