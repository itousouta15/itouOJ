import "dotenv/config";
import Database from "better-sqlite3";

const dbPath = (process.env.DATABASE_URL ?? "file:./dev.db").replace(/^file:/, "");
const db = new Database(dbPath);
db.pragma("foreign_keys = ON");

interface TestCaseSeed {
  input: string;
  output: string;
  isSample: boolean;
}

interface ProblemSeed {
  title: string;
  statement: string;
  difficulty: "easy" | "medium" | "hard";
  timeLimitMs?: number;
  memoryLimitMb?: number;
  testCases: TestCaseSeed[];
}

interface DaySeed {
  courseTitle: string;
  courseDescription: string;
  problems: ProblemSeed[];
}

function stmt(desc: string, input: string, output: string) {
  return `## 題目描述\n\n${desc}\n\n## 輸入格式\n\n${input}\n\n## 輸出格式\n\n${output}`;
}

const days: DaySeed[] = [
  {
    courseTitle: "APCS 初級營 Day1｜資訊啟蒙",
    courseDescription: "Hello World：cin / cout 基本輸入輸出練習。",
    problems: [
      {
        title: "哈囉，資訊！",
        difficulty: "easy",
        statement: stmt(
          "請輸入一位新生的姓名與年齡，並依照指定格式印出一句自我介紹。",
          "第一行輸入一個不含空白的字串 name；第二行輸入一個整數 age（1 ≤ age ≤ 120）。",
          "輸出一行：`Hello, my name is {name}. I am {age} years old!`"
        ),
        testCases: [
          { input: "Alice\n16", output: "Hello, my name is Alice. I am 16 years old!", isSample: true },
          { input: "Bob\n15", output: "Hello, my name is Bob. I am 15 years old!", isSample: false },
          { input: "Charlie\n99", output: "Hello, my name is Charlie. I am 99 years old!", isSample: false },
        ],
      },
    ],
  },
  {
    courseTitle: "APCS 初級營 Day2｜變數與運算子",
    courseDescription: "資料型態、運算子、if / else 流程控制練習。",
    problems: [
      {
        title: "判斷奇偶數",
        difficulty: "easy",
        statement: stmt(
          "輸入一個整數，判斷它是奇數還是偶數。",
          "一行一個整數 n（−10⁹ ≤ n ≤ 10⁹）。",
          "若 n 為偶數輸出 `Even`，否則輸出 `Odd`。"
        ),
        testCases: [
          { input: "7", output: "Odd", isSample: true },
          { input: "-4", output: "Even", isSample: false },
          { input: "0", output: "Even", isSample: false },
        ],
      },
      {
        title: "三數取最大值",
        difficulty: "easy",
        statement: stmt(
          "輸入三個整數，輸出其中最大的一個。",
          "一行三個整數 a b c，以空白分隔。",
          "輸出最大值。"
        ),
        testCases: [
          { input: "3 7 5", output: "7", isSample: true },
          { input: "-1 -1 -2", output: "-1", isSample: false },
          { input: "10 2 10", output: "10", isSample: false },
        ],
      },
      {
        title: "簡易計算機",
        difficulty: "easy",
        statement: stmt(
          "輸入兩個整數與一個運算子（+、−、*、/），輸出計算結果。除法採整數除法（無條件捨去小數部分）；若除數為 0，輸出 `Error`。",
          "一行：`a op b`，中間以空白分隔，op ∈ {+, −, *, /}。",
          "輸出一行計算結果，或 `Error`。"
        ),
        testCases: [
          { input: "6 * 7", output: "42", isSample: true },
          { input: "15 - 4", output: "11", isSample: false },
          { input: "10 / 3", output: "3", isSample: false },
          { input: "8 / 0", output: "Error", isSample: false },
        ],
      },
      {
        title: "BMI 分級",
        difficulty: "medium",
        statement: stmt(
          "輸入體重（公斤，整數）與身高（公分，整數），計算 BMI = 體重 ÷ 身高(公尺)²，並依下表分級輸出：\n\nBMI < 18.5 → `過輕`；18.5 ≤ BMI < 24 → `正常`；24 ≤ BMI < 27 → `過重`；BMI ≥ 27 → `肥胖`",
          "一行兩個整數：體重 身高。",
          "輸出對應的分級文字。"
        ),
        testCases: [
          { input: "70 175", output: "正常", isSample: true },
          { input: "45 170", output: "過輕", isSample: false },
          { input: "75 170", output: "過重", isSample: false },
          { input: "90 165", output: "肥胖", isSample: false },
        ],
      },
    ],
  },
  {
    courseTitle: "APCS 初級營 Day3｜迴圈",
    courseDescription: "for / while / do-while、巢狀迴圈與圖形列印練習。",
    problems: [
      {
        title: "質數判斷",
        difficulty: "easy",
        statement: stmt(
          "輸入一個整數 n，判斷是否為質數。",
          "一行一個整數 n（2 ≤ n ≤ 10⁶）。",
          "是質數輸出 `Prime`，否則輸出 `Not Prime`。"
        ),
        testCases: [
          { input: "17", output: "Prime", isSample: true },
          { input: "20", output: "Not Prime", isSample: false },
          { input: "2", output: "Prime", isSample: false },
        ],
      },
      {
        title: "累加與累乘",
        difficulty: "easy",
        statement: stmt(
          "輸入 n，分別計算 1 加到 n 的總和，以及 1 乘到 n 的總乘積。",
          "一行一個整數 n（1 ≤ n ≤ 10）。",
          "兩行，第一行輸出總和，第二行輸出總乘積。"
        ),
        testCases: [
          { input: "5", output: "15\n120", isSample: true },
          { input: "1", output: "1\n1", isSample: false },
          { input: "10", output: "55\n3628800", isSample: false },
        ],
      },
      {
        title: "數字翻轉",
        difficulty: "easy",
        statement: stmt(
          "輸入一個正整數，將其數字順序反轉後輸出（結果不含前導零）。",
          "一行一個整數 n（1 ≤ n ≤ 10⁹）。",
          "輸出反轉後的整數。"
        ),
        testCases: [
          { input: "120", output: "21", isSample: true },
          { input: "8532", output: "2358", isSample: false },
          { input: "100", output: "1", isSample: false },
        ],
      },
      {
        title: "九九乘法表",
        difficulty: "easy",
        statement: stmt(
          "輸入 n，印出 n 的乘法表（n×1 到 n×9）。",
          "一行一個整數 n（1 ≤ n ≤ 9）。",
          "共 9 行，每行格式為 `n x i = 結果`。"
        ),
        testCases: [
          {
            input: "3",
            output:
              "3 x 1 = 3\n3 x 2 = 6\n3 x 3 = 9\n3 x 4 = 12\n3 x 5 = 15\n3 x 6 = 18\n3 x 7 = 21\n3 x 8 = 24\n3 x 9 = 27",
            isSample: true,
          },
          {
            input: "1",
            output:
              "1 x 1 = 1\n1 x 2 = 2\n1 x 3 = 3\n1 x 4 = 4\n1 x 5 = 5\n1 x 6 = 6\n1 x 7 = 7\n1 x 8 = 8\n1 x 9 = 9",
            isSample: false,
          },
          {
            input: "9",
            output:
              "9 x 1 = 9\n9 x 2 = 18\n9 x 3 = 27\n9 x 4 = 36\n9 x 5 = 45\n9 x 6 = 54\n9 x 7 = 63\n9 x 8 = 72\n9 x 9 = 81",
            isSample: false,
          },
        ],
      },
      {
        title: "直角三角形",
        difficulty: "easy",
        statement: stmt(
          "輸入 n，印出 n 行由 `*` 組成的直角三角形，第 i 行有 i 個星號。",
          "一行一個整數 n（1 ≤ n ≤ 20）。",
          "n 行圖案。"
        ),
        testCases: [
          { input: "4", output: "*\n**\n***\n****", isSample: true },
          { input: "1", output: "*", isSample: false },
          { input: "6", output: "*\n**\n***\n****\n*****\n******", isSample: false },
        ],
      },
      {
        title: "菱形圖案（進階）",
        difficulty: "medium",
        statement: stmt(
          "給定奇數 n，印出寬度為 n 的星號菱形。提前寫完其他題目的學員可以挑戰這題──重點是想清楚「每一行要印幾個空白、幾個星號」。",
          "一行一個奇數 n（1 ≤ n ≤ 19）。",
          "n 行菱形圖案，每行前方以空白對齊（行尾不要有多餘空白）。"
        ),
        testCases: [
          { input: "5", output: "  *\n ***\n*****\n ***\n  *", isSample: true },
          { input: "3", output: " *\n***\n *", isSample: false },
          { input: "1", output: "*", isSample: false },
        ],
      },
    ],
  },
  {
    courseTitle: "APCS 初級營 Day4｜陣列與字串",
    courseDescription: "一維／二維陣列與字串走訪、比對練習。",
    problems: [
      {
        title: "最大最小平均",
        difficulty: "easy",
        statement: stmt(
          "輸入 n 個整數，輸出其中的最大值、最小值，以及平均值（四捨五入至小數點後 2 位）。",
          "第一行一個整數 n（1 ≤ n ≤ 1000）；第二行 n 個整數，以空白分隔。",
          "三行，依序為最大值、最小值、平均值。"
        ),
        testCases: [
          { input: "5\n3 7 2 9 4", output: "9\n2\n5.00", isSample: true },
          { input: "4\n-2 5 -8 3", output: "5\n-8\n-0.50", isSample: false },
        ],
      },
      {
        title: "矩陣加總",
        difficulty: "easy",
        statement: stmt(
          "輸入一個 n × m 的矩陣，輸出所有元素的總和。",
          "第一行兩個整數 n m；接下來 n 行，每行 m 個整數。",
          "輸出總和。"
        ),
        testCases: [
          { input: "2 3\n1 2 3\n4 5 6", output: "21", isSample: true },
          { input: "1 4\n2 4 6 8", output: "20", isSample: false },
        ],
      },
      {
        title: "九宮格驗證",
        difficulty: "medium",
        statement: stmt(
          "輸入一個 3×3 的整數方格，判斷它是否為「幻方」──每一列、每一行、以及兩條對角線的總和是否都相等。",
          "3 行，每行 3 個整數。",
          "是幻方輸出 `Magic`，否則輸出 `Not Magic`。"
        ),
        testCases: [
          { input: "4 9 2\n3 5 7\n8 1 6", output: "Magic", isSample: true },
          { input: "1 2 3\n4 5 6\n7 8 9", output: "Not Magic", isSample: false },
        ],
      },
      {
        title: "子字串搜尋",
        difficulty: "medium",
        statement: stmt(
          "輸入字串 s 與 t（皆為小寫英文字母），判斷 t 是否為 s 中連續出現的一段（子字串）。",
          "第一行字串 s；第二行字串 t。（1 ≤ 長度 ≤ 1000）",
          "是子字串輸出 `Yes`，否則輸出 `No`。"
        ),
        testCases: [
          { input: "programming\ngram", output: "Yes", isSample: true },
          { input: "programming\ngrim", output: "No", isSample: false },
          { input: "abc\nabcd", output: "No", isSample: false },
        ],
      },
      {
        title: "迴文判斷",
        difficulty: "easy",
        statement: stmt(
          "輸入一個僅含小寫英文字母的字串，判斷它是否為迴文（正著讀和反著讀相同）。",
          "一行字串 s（1 ≤ 長度 ≤ 1000）。",
          "是迴文輸出 `Yes`，否則輸出 `No`。"
        ),
        testCases: [
          { input: "level", output: "Yes", isSample: true },
          { input: "hello", output: "No", isSample: false },
          { input: "a", output: "Yes", isSample: false },
        ],
      },
    ],
  },
  {
    courseTitle: "APCS 初級營 Day5｜總複習與實戰演練",
    courseDescription: "模擬 APCS 實作題風格的綜合應用練習。",
    problems: [
      {
        title: "成績等第統計",
        difficulty: "medium",
        statement: stmt(
          "輸入 n 位學生的成績（0–100 的整數），依 A（90 分以上）、B（80–89）、C（70–79）、D（60–69）、F（60 分以下）統計各等第人數。",
          "第一行整數 n（1 ≤ n ≤ 1000）；第二行 n 個整數。",
          "依序輸出五行：`A: x`、`B: x`、`C: x`、`D: x`、`F: x`（即使人數為 0 也要輸出該行）。"
        ),
        testCases: [
          {
            input: "6\n95 82 76 60 45 100",
            output: "A: 2\nB: 1\nC: 1\nD: 1\nF: 1",
            isSample: true,
          },
          {
            input: "3\n100 90 95",
            output: "A: 3\nB: 0\nC: 0\nD: 0\nF: 0",
            isSample: false,
          },
          {
            input: "5\n90 80 70 60 59",
            output: "A: 1\nB: 1\nC: 1\nD: 1\nF: 1",
            isSample: false,
          },
        ],
      },
      {
        title: "峰值偵測",
        difficulty: "medium",
        statement: stmt(
          "輸入 n 個整數，若某個位置的值嚴格大於它左右相鄰的值（陣列頭尾只需與唯一存在的鄰居比較），則稱為一個「峰值」。請輸出峰值的數量。相鄰數值相等時不算峰值。",
          "第一行整數 n（1 ≤ n ≤ 1000）；第二行 n 個整數。",
          "輸出峰值的數量。"
        ),
        testCases: [
          { input: "5\n1 3 2 4 1", output: "2", isSample: true },
          { input: "5\n1 2 3 4 5", output: "1", isSample: false },
          { input: "4\n5 5 5 5", output: "0", isSample: false },
        ],
      },
      {
        title: "最常見字元",
        difficulty: "hard",
        statement: stmt(
          "輸入一個僅含小寫英文字母的字串，找出出現次數最多的字元與出現次數。若有多個字元並列最多次，輸出字母順序最小的那一個。",
          "一行字串 s（1 ≤ 長度 ≤ 10000）。",
          "輸出一行：`字元 次數`，中間以一個空白分隔。"
        ),
        testCases: [
          { input: "banana", output: "a 3", isSample: true },
          { input: "abcabc", output: "a 2", isSample: false },
          { input: "zzzz", output: "z 4", isSample: false },
        ],
      },
    ],
  },
];

const findCourse = db.prepare("SELECT id FROM Course WHERE title = ?");
const insertProblem = db.prepare(
  `INSERT INTO Problem (title, statement, difficulty, timeLimitMs, memoryLimitMb, isPublic, createdAt)
   VALUES (@title, @statement, @difficulty, @timeLimitMs, @memoryLimitMb, 1, datetime('now'))`
);
const insertTestCase = db.prepare(
  `INSERT INTO TestCase (problemId, input, output, isSample, "order")
   VALUES (@problemId, @input, @output, @isSample, @order)`
);
const insertCourse = db.prepare(
  `INSERT INTO Course (title, description, isPublic, createdAt) VALUES (@title, @description, 1, datetime('now'))`
);
const insertCourseProblem = db.prepare(
  `INSERT INTO CourseProblem (courseId, problemId, "order") VALUES (@courseId, @problemId, @order)`
);

const run = db.transaction(() => {
  for (const day of days) {
    const existing = findCourse.get(day.courseTitle) as { id: number } | undefined;
    if (existing) {
      console.log(`跳過（已存在）：${day.courseTitle}`);
      continue;
    }

    const problemIds: number[] = [];
    for (const p of day.problems) {
      const info = insertProblem.run({
        title: p.title,
        statement: p.statement,
        difficulty: p.difficulty,
        timeLimitMs: p.timeLimitMs ?? 1000,
        memoryLimitMb: p.memoryLimitMb ?? 256,
      });
      const problemId = Number(info.lastInsertRowid);
      p.testCases.forEach((tc, i) => {
        insertTestCase.run({
          problemId,
          input: tc.input,
          output: tc.output,
          isSample: tc.isSample ? 1 : 0,
          order: i,
        });
      });
      problemIds.push(problemId);
      console.log(`  建立題目：${p.title} (id=${problemId})`);
    }

    const courseInfo = insertCourse.run({
      title: day.courseTitle,
      description: day.courseDescription,
    });
    const courseId = Number(courseInfo.lastInsertRowid);
    problemIds.forEach((problemId, order) => {
      insertCourseProblem.run({ courseId, problemId, order });
    });
    console.log(`建立題單：${day.courseTitle} (id=${courseId})`);
  }
});

run();
db.close();
console.log("完成！");
