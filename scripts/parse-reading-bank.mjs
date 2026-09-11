// 把「程式識讀」題庫 PDF 解析成 import-recognition-questions.mjs 吃的 JSON
// （prisma/seed-data/recognition/*.json）。PDF 排版會影響抽取結果，先用
// --dump-text 抽出純文字檢查，必要時再調這裡的規則。
//
// 用法：
//   node scripts/parse-reading-bank.mjs --pdf raw.pdf --category C --source "C 程式識讀 125 題"
//   node scripts/parse-reading-bank.mjs --text extracted.txt --category Python --source "Python 程式識讀 125 題"
//   node scripts/parse-reading-bank.mjs --pdf raw.pdf --dump-text extracted.txt   # 只抽文字
//   node scripts/parse-reading-bank.mjs --pdf raw.pdf --category C --source "..." --answers answers.json
//   node scripts/parse-reading-bank.mjs --self-test
//
// 題目區塊假設（若來源 PDF 不同，先 --dump-text 看實際輸出再調整）：
//   1. 題號 1. / 1、/ (1) 開頭，之後是題目與程式碼
//   2. (A) ... (B) ... 逐行或同一行的選項，可換行續行
//   3. 答案：B（或 Ans: B）；其後為解析（含「出題用意」「難度」）
//
// 選項/答案標記允許全形。--answers 可提供 JSON（{ "1": "B", ... }）補答案，
// 適合答案另外集中在文件最後的排版。

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const argv = process.argv.slice(2);
function flag(name, fallback) {
  const i = argv.indexOf("--" + name);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--")
    ? argv[i + 1]
    : fallback;
}
const has = (name) => argv.includes("--" + name);

// ---------- 題庫文字解析 ----------

function normalizeLetter(ch) {
  const code = ch.charCodeAt(0);
  // 全形 Ａ-Ｚ → 半形 A-Z
  return String.fromCharCode(code >= 0xff21 && code <= 0xff3a ? code - 0xfee0 : code).toUpperCase();
}

const QUESTION_START =
  /^\s*[(（]?\s*(\d{1,3})\s*(?:[)）]|[.、．:：])\s*/;

function matchQuestionStart(line) {
  const m = QUESTION_START.exec(line);
  if (!m) return null;
  return { number: Number(m[1]), rest: line.slice(m[0].length) };
}

// 選項標記：行首/空白/括號後的 A-H，後接 ) ） . 、 ． : ：。限制大寫，
// 避免程式碼的 a.b、q.tail 被當成選項。
function findOptionMarkers(line) {
  const re = /(?:^|[\s(（])\s*([A-HＡ-Ｈ])\s*[)）.、．:：]/g;
  const out = [];
  let m;
  while ((m = re.exec(line)) !== null) {
    out.push({
      letter: normalizeLetter(m[1]),
      start: m.index,
      end: re.lastIndex,
    });
    if (re.lastIndex === m.index) re.lastIndex++;
  }
  return out;
}

const ANSWER_RE =
  /(?:正確答案|正確解答|答案|解答|Ans(?:wer)?)\s*[：:\-—]?\s*[（(]?\s*([A-HＡ-Ｈa-h])/i;

function findAnswer(text) {
  const m = ANSWER_RE.exec(text);
  return m ? normalizeLetter(m[1]) : null;
}

// 強訊號：出現就幾乎可斷定是程式碼（分號、大括號、函式呼叫、關鍵字…）。
// 題目文字常包含 =、c[2]、for 等弱訊號，所以只認強訊號。
const CODE_STRONG = {
  c: /;|\{|\}|#\s*(?:include|define|pragma)|\/\/|\/\*|\b(?:printf|scanf|puts|gets|strlen|strcpy|strcmp|malloc|free)\s*\(|\b(?:for|while|if|switch|return)\s*\(|\bint\s+main\b/,
  python:
    /^\s*#|\bprint\s*\(|\bdef\s|\bclass\s|\bimport\s|\bfrom\s|\bfor\s|\bwhile\s|\bif\s|\belif\s|\belse\s*:|\breturn\b|\btry\s*:|\bexcept\b|\bwith\s|\binput\s*\(/,
};

const CJK = /[\u3400-\u9fff\u3000-\u303f\uff00-\uffef]/;

// 題目文字判定：有中文、且不含明確程式碼訊號。程式碼區塊一定是題目文字
// 之後的連續段落，所以取「最後一行題目文字」的位置當分界。
function isQuestionLine(line, category) {
  const t = line.trim();
  if (!t) return false;
  const strong = CODE_STRONG[category.toLowerCase()] ?? CODE_STRONG.c;
  if (strong.test(line)) return false;
  return CJK.test(t);
}

function classifyCode(lines, category) {
  let lastQuestion = -1;
  for (let i = 0; i < lines.length; i++) {
    if (isQuestionLine(lines[i], category)) lastQuestion = i;
  }
  return lastQuestion + 1;
}

// 從選項區的文字行取出選項；同一行多個標記（(A) x (B) y）也會切開。
function extractOptions(lines) {
  const options = [];
  let started = false;
  for (const line of lines) {
    const markers = findOptionMarkers(line);
    if (!started) {
      if (markers.length === 0) continue;
      if (markers[0].letter !== "A") return null;
      started = true;
    }
    if (markers.length === 0) {
      // 上一個選項的換行續行
      if (options.length > 0) {
        const tail = line.trim();
        if (tail) options[options.length - 1] += "\n" + tail;
      }
      continue;
    }
    for (let i = 0; i < markers.length; i++) {
      const end = i + 1 < markers.length ? markers[i + 1].start : line.length;
      const text = line.slice(markers[i].end, end).trim();
      options.push(text);
    }
  }
  return started ? options.map((o) => o.trim()) : null;
}

function parseQuestion(number, lines, category, answerOverrides) {
  const before = [];
  const optionLines = [];
  const after = [];
  let phase = "before";

  for (const line of lines) {
    if (phase === "before") {
      const markers = findOptionMarkers(line);
      if (markers.length > 0 && markers[0].letter === "A") {
        phase = "options";
        optionLines.push(line);
      } else {
        before.push(line);
      }
      continue;
    }
    if (phase === "options") {
      if (findAnswer(line)) {
        phase = "after";
        after.push(line);
      } else {
        optionLines.push(line);
      }
      continue;
    }
    after.push(line);
  }

  const options = extractOptions(optionLines);
  const override = answerOverrides?.[String(number)];
  const answerLetter = findAnswer(after.join("\n")) ?? (override ? normalizeLetter(override) : null);

  const errors = [];
  const codeStart = classifyCode(before, category);
  const question = before.slice(0, codeStart);
  const code = before.slice(codeStart);

  const q = {
    number,
    category,
    question: question.join("\n").trim(),
    code: code.join("\n").trim(),
    options: options ?? [],
    answerIndex: -1,
    explanation: null,
  };

  if (options === null) errors.push("找不到 (A)...(E) 選項");
  if (!q.question) errors.push("題目內容是空的");
  if (q.options.length < 2 || q.options.length > 8)
    errors.push(`選項數 ${q.options.length} 不在 2~8 之間`);
  if (q.options.some((o) => !o)) errors.push("有選項是空的");
  if (!answerLetter) {
    errors.push("找不到答案（可用 --answers 補）");
  } else {
    const idx = answerLetter.charCodeAt(0) - 65;
    if (idx < 0 || idx >= q.options.length) {
      errors.push(`答案 ${answerLetter} 超出選項範圍`);
    } else {
      q.answerIndex = idx;
    }
  }

  const afterText = after.join("\n");
  q.explanation =
    afterText
      .replace(ANSWER_RE, "")
      .replace(/^\s*(?:解析|說明)\s*[：:]\s*/, "")
      .trim() || null;

  return { q, errors };
}

// 依題號 1,2,3... 切塊；號碼不連續時只保留前面的區塊（PDF 抽取錯行時寧可早停）
export function splitQuestions(text, firstNumber = 1) {
  const lines = text.replace(/\r\n?/g, "\n").replace(/\u00a0/g, " ").split("\n");
  const blocks = [];
  let current = null;
  let expected = firstNumber;
  for (const line of lines) {
    const m = matchQuestionStart(line);
    if (m && m.number === expected) {
      if (current) blocks.push(current);
      current = { number: m.number, lines: [] };
      if (m.rest.trim()) current.lines.push(m.rest);
      expected++;
    } else if (current) {
      current.lines.push(line);
    }
  }
  if (current) blocks.push(current);
  return blocks;
}

export function parseQuestions(text, { category, source, firstNumber, answers }) {
  const blocks = splitQuestions(text, firstNumber);
  const questions = [];
  const problems = [];
  for (const block of blocks) {
    const { q, errors } = parseQuestion(block.number, block.lines, category, answers);
    if (errors.length > 0) {
      problems.push(`第 ${block.number} 題：${errors.join("；")}`);
    }
    questions.push(q);
  }
  return { source, questions, problems, blockCount: blocks.length };
}

function validateResult(result) {
  if (result.blockCount === 0) return ["沒有解析到任何題目（用 --dump-text 檢查抽取的文字）"];
  if (result.problems.length > 0) return result.problems;
  const numbers = result.questions.map((q) => q.number);
  const expected = Array.from({ length: numbers.length }, (_, i) => i + 1);
  if (numbers.join(",") !== expected.join(",")) {
    return ["題號不連續：" + numbers.join(", ")];
  }
  return [];
}

// ---------- PDF 抽取 ----------

export async function extractPdfText(pdfPath) {
  const { PDFParse } = await import("pdf-parse");
  const data = fs.readFileSync(pdfPath);
  const parser = new PDFParse({ data });
  try {
    const result = await parser.getText();
    return result.text;
  } finally {
    await parser.destroy();
  }
}

// ---------- 自我檢查 ----------

const SELF_TEST_C = `C 程式識讀 練習
1. a,b 的值為何？
int a=5, b;
b = 3+a*2-a/2;
a = a+b;
(A) a=15.5, b=10.5
(B) a=16, b=11
(C) a=10, b=5
(D) a=10.5, b=5.5
(E) 程式錯誤
答案：B
整數除法、先乘除後加減
出題用意：變數與基本運算
難度：易
2. 輸出為何？
(A) 1
(B) 2
(C) 3
(D) 4
(E) 5
正確答案: C
說明：測試
3. 此程式片段（無程式碼）的合法選項為何？
(A) 甲 (B) 乙 (C) 丙
(D) 丁
答案：A 解析：直接判斷`;

const SELF_TEST_PY = `Python 程式識讀 練習
1. 輸出為何？
a = 5
b = 3+a*2-a//2
print(a, b)
(A) 15.5 10.5
(B) 16 11
(C) 10 5
(D) 10.5 5.5
(E) 執行錯誤
答案：B
整數除法、先乘除後加減
出題用意：變數與基本運算
難度：易`;

function selfTest() {
  const c = parseQuestions(SELF_TEST_C, {
    category: "C",
    source: "C 程式識讀 125 題",
  });
  const p = parseQuestions(SELF_TEST_PY, {
    category: "Python",
    source: "Python 程式識讀 125 題",
  });
  const failures = [...validateResult(c), ...validateResult(p)];
  if (c.questions.length !== 3) failures.push(`C 應有 3 題，實際 ${c.questions.length}`);
  if (c.questions[0]?.answerIndex !== 1) failures.push("C 第 1 題答案應為 B");
  if (c.questions[0]?.code !== "int a=5, b;\nb = 3+a*2-a/2;\na = a+b;") {
    failures.push("C 第 1 題程式碼解析錯誤");
  }
  if (c.questions[1]?.code !== "") failures.push("C 第 2 題不該有程式碼");
  if (c.questions[2]?.options.length !== 4) failures.push("C 第 3 題應有 4 個選項（同行選項）");
  if (p.questions[0]?.code !== "a = 5\nb = 3+a*2-a//2\nprint(a, b)") {
    failures.push("Python 第 1 題程式碼解析錯誤");
  }

  if (failures.length > 0) {
    console.error("自我檢查失敗：");
    for (const f of failures) console.error("  ✗ " + f);
    process.exit(1);
  }
  console.log("自我檢查通過 ✓");
}

// ---------- 主程式 ----------

async function main() {
  if (has("self-test")) return selfTest();
  if (has("help") || argv.length === 0) {
    console.log(
      [
        "用法：",
        "  --pdf <file>        來源 PDF",
        "  --text <file>       直接吃已抽好的純文字（跳過 PDF 抽取）",
        "  --category <name>   題目類別，例如 C / Python",
        "  --source <title>    群集名稱，例如 \"C 程式識讀 125 題\"",
        "  --out <file>        輸出 JSON（預設 prisma/seed-data/recognition/<category>-reading-bank.json）",
        "  --answers <file>    答案表 JSON：{ \"1\": \"B\", ... }（答案不在題目旁時使用）",
        "  --first <n>         第一題題號（預設 1）",
        "  --dump-text <file>  只抽取文字寫檔後結束（用來檢查 PDF 排版）",
        "  --dry-run           只印摘要，不寫檔",
        "  --self-test         用內建樣本驗證解析邏輯",
      ].join("\n")
    );
    return;
  }

  const pdfPath = flag("pdf");
  const textPath = flag("text");
  const category = flag("category");
  const source = flag("source");
  const firstNumber = Number(flag("first", "1"));
  const answersPath = flag("answers");
  const outPath = flag(
    "out",
    path.join(
      "prisma/seed-data/recognition",
      `${(category ?? "reading").toLowerCase()}-reading-bank.json`
    )
  );

  if (!pdfPath && !textPath) throw new Error("請給 --pdf 或 --text");
  if (!category || !source) throw new Error("請給 --category 與 --source");

  const text = textPath
    ? fs.readFileSync(textPath, "utf8")
    : await extractPdfText(pdfPath);

  const dumpPath = flag("dump-text");
  if (dumpPath) {
    fs.mkdirSync(path.dirname(dumpPath), { recursive: true });
    fs.writeFileSync(dumpPath, text);
    console.log(`已寫出抽取文字：${dumpPath}（${text.length} 字）`);
  }

  const answers = answersPath
    ? JSON.parse(fs.readFileSync(answersPath, "utf8"))
    : undefined;

  const result = parseQuestions(text, { category, source, firstNumber, answers });
  const problems = validateResult(result);
  for (const p of result.problems) console.warn("⚠ " + p);
  if (problems.length > 0) {
    console.error("解析失敗：");
    for (const p of problems) console.error("  ✗ " + p);
    process.exit(1);
  }

  const json = JSON.stringify({ source: result.source, questions: result.questions }, null, 2) + "\n";
  if (has("dry-run")) {
    console.log(`（dry-run）解析 ${result.questions.length} 題，未寫檔`);
    return;
  }
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, json);
  console.log(`已寫出 ${result.questions.length} 題：${outPath}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}
