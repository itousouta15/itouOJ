// 把比賽題目匯出成可列印的 HTML（再用瀏覽器 Ctrl+P 另存 PDF）
//
// 為什麼不直接產 PDF：這台機器沒有 Chromium（Firefox/Zen 沒有可靠的命令列
// 轉 PDF），而產生含中文的 PDF 需要字型嵌入，得多裝相依套件。改成輸出 HTML
// 之後，用瀏覽器列印就能得到字型正確、數學排版正確的 PDF，而且零新增相依。
//
// 渲染管線刻意和網站一致（remark-gfm + remark-math + rehype-katex），
// 所以印出來的題目和選手在 OJ 上看到的長得一樣。
//
//   node scripts/export-problems.mjs                    最新一場比賽 -> ./problem-docs
//   node scripts/export-problems.mjs --contest 2
//   node scripts/export-problems.mjs --out C:\Contest\題目
//   node scripts/export-problems.mjs --db test.db

import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkRehype from "remark-rehype";
import rehypeKatex from "rehype-katex";

// ── 參數 ────────────────────────────────────────────
const argv = process.argv.slice(2);
function flag(name, fallback) {
  const i = argv.indexOf("--" + name);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--")
    ? argv[i + 1]
    : fallback;
}

const dbPath = (flag("db", process.env.DATABASE_URL ?? "file:./dev.db")).replace(
  /^file:/,
  ""
);
const outDir = path.resolve(flag("out", "./problem-docs"));

if (!fs.existsSync(dbPath)) {
  console.error(`找不到資料庫：${path.resolve(dbPath)}`);
  process.exit(1);
}

// ── hast -> HTML ────────────────────────────────────
// rehype-stringify 沒有安裝（react-markdown 輸出 React 元素，不需要序列化），
// 而這裡只要把樹轉成字串，自己寫比多裝一個套件划算。
const VOID = new Set([
  "area", "base", "br", "col", "embed", "hr", "img", "input",
  "link", "meta", "param", "source", "track", "wbr",
]);

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const escAttr = (s) => esc(s).replace(/"/g, "&quot;");

function propName(key) {
  if (key === "className") return "class";
  if (key === "htmlFor") return "for";
  // camelCase -> kebab-case（KaTeX 的 MathML 會用到 xmlns 之類的）
  return key.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase());
}

function toHtml(node) {
  if (Array.isArray(node)) return node.map(toHtml).join("");
  if (node.type === "root") return toHtml(node.children ?? []);
  if (node.type === "text") return esc(node.value);
  if (node.type === "raw") return node.value; // 題敘裡直接寫的 HTML
  if (node.type === "comment") return `<!--${node.value}-->`;
  if (node.type !== "element") return "";

  const attrs = Object.entries(node.properties ?? {})
    .filter(([, v]) => v !== null && v !== undefined && v !== false)
    .map(([k, v]) => {
      const name = propName(k);
      if (v === true) return ` ${name}`;
      const val = Array.isArray(v) ? v.join(" ") : v;
      return ` ${name}="${escAttr(val)}"`;
    })
    .join("");

  if (VOID.has(node.tagName)) return `<${node.tagName}${attrs}>`;
  return `<${node.tagName}${attrs}>${toHtml(node.children ?? [])}</${node.tagName}>`;
}

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkMath)
  .use(remarkRehype)
  .use(rehypeKatex);

async function markdownToHtml(md) {
  const tree = await processor.run(processor.parse(md ?? ""));
  return toHtml(tree);
}

// ── 版面 ────────────────────────────────────────────
function page({ contestTitle, label, title, timeLimitMs, memoryLimitMb, body, samples, katexCss }) {
  const sampleRows = samples
    .map(
      (s, i) => `
      <section class="sample">
        <h3>範例 ${i + 1}</h3>
        <div class="io">
          <div><div class="io-h">輸入</div><pre>${esc(s.input)}</pre></div>
          <div><div class="io-h">輸出</div><pre>${esc(s.output)}</pre></div>
        </div>
      </section>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="zh-Hant">
<head>
<meta charset="utf-8">
<title>${esc(label)}. ${esc(title)}</title>
<style>
${katexCss}
@page { size: A4; margin: 18mm 16mm; }
* { box-sizing: border-box; }
body {
  font-family: "Microsoft JhengHei", "Noto Sans TC", sans-serif;
  font-size: 11.5pt; line-height: 1.75; color: #111;
  max-width: 178mm; margin: 0 auto; padding: 10mm 4mm;
}
.contest { font-size: 10pt; color: #666; letter-spacing: .04em; }
h1 { font-size: 19pt; margin: 4px 0 6px; border-bottom: 2px solid #111; padding-bottom: 8px; }
.limits { font-size: 10pt; color: #444; margin-bottom: 18px; }
.limits span { margin-right: 18px; }
h2 { font-size: 13pt; margin: 22px 0 6px; border-left: 4px solid #111; padding-left: 8px; }
h3 { font-size: 11pt; margin: 14px 0 4px; color: #333; }
p { margin: 8px 0; }
code { font-family: Consolas, "Courier New", monospace; background: #f2f2f2;
       padding: 1px 5px; border-radius: 3px; font-size: 10.5pt; }
pre { font-family: Consolas, "Courier New", monospace; background: #f7f7f7;
      border: 1px solid #ddd; border-radius: 4px; padding: 8px 10px;
      font-size: 10.5pt; white-space: pre-wrap; word-break: break-all; margin: 0; }
pre code { background: none; padding: 0; }
blockquote { margin: 10px 0; padding: 6px 12px; border-left: 3px solid #bbb;
             background: #fafafa; color: #444; }
table { border-collapse: collapse; margin: 10px 0; }
th, td { border: 1px solid #ccc; padding: 4px 10px; }
.io { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.io-h { font-size: 9.5pt; color: #666; margin-bottom: 3px; }
.sample { margin: 12px 0; page-break-inside: avoid; }
@media print { body { padding: 0; } }
</style>
</head>
<body>
<div class="contest">${esc(contestTitle)}</div>
<h1>${esc(label)}. ${esc(title)}</h1>
<div class="limits">
  <span>時間限制：${(timeLimitMs / 1000).toFixed(timeLimitMs % 1000 ? 1 : 0)} 秒</span>
  <span>記憶體限制：${memoryLimitMb} MB</span>
</div>
${body}
${samples.length ? "<h2>範例測資</h2>" + sampleRows : ""}
</body>
</html>`;
}

// ── 主流程 ──────────────────────────────────────────
const db = new Database(dbPath, { readonly: true });

const contestId = Number(
  flag("contest", db.prepare("SELECT id FROM Contest ORDER BY id DESC LIMIT 1").get()?.id)
);
const contest = db.prepare("SELECT id, title FROM Contest WHERE id = ?").get(contestId);
if (!contest) {
  console.error(`找不到比賽 #${contestId}`);
  process.exit(1);
}

const problems = db
  .prepare(
    `SELECT cp.label, p.id, p.title, p.statement, p.timeLimitMs, p.memoryLimitMb
     FROM ContestProblem cp JOIN Problem p ON p.id = cp.problemId
     WHERE cp.contestId = ? ORDER BY cp."order", cp.id`
  )
  .all(contestId);

if (problems.length === 0) {
  console.error("這場比賽還沒有題目");
  process.exit(1);
}

const katexDir = path.join("node_modules", "katex", "dist");
const katexCss = fs.readFileSync(path.join(katexDir, "katex.min.css"), "utf8");

fs.mkdirSync(outDir, { recursive: true });

// KaTeX 的 CSS 會參照 fonts/*.woff2，要一起複製過去數學符號才會正確
const fontsSrc = path.join(katexDir, "fonts");
const fontsDst = path.join(outDir, "fonts");
fs.mkdirSync(fontsDst, { recursive: true });
let fontCount = 0;
for (const f of fs.readdirSync(fontsSrc)) {
  if (!f.endsWith(".woff2")) continue; // 現代瀏覽器只需要 woff2
  fs.copyFileSync(path.join(fontsSrc, f), path.join(fontsDst, f));
  fontCount++;
}

const sampleStmt = db.prepare(
  `SELECT input, output FROM TestCase
   WHERE problemId = ? AND isSample = 1 ORDER BY "order", id`
);

console.log(`\n比賽 #${contest.id}　${contest.title}\n`);
for (const p of problems) {
  const body = await markdownToHtml(p.statement);
  const samples = sampleStmt.all(p.id);
  const html = page({
    contestTitle: contest.title,
    label: p.label,
    title: p.title,
    timeLimitMs: p.timeLimitMs,
    memoryLimitMb: p.memoryLimitMb,
    body,
    samples,
    katexCss,
  });
  const file = path.join(outDir, `${p.label}.html`);
  fs.writeFileSync(file, html, "utf8");
  console.log(`  ${p.label}.html　${p.title}　（範例 ${samples.length} 筆）`);
}
db.close();

console.log(`
輸出位置：${outDir}
　　　　　（另含 fonts/ ${fontCount} 個字型檔，數學符號需要，不要刪）

轉成 PDF：
  用瀏覽器開啟各個 .html，Ctrl+P → 目的地選「另存為 PDF」
  版面已針對 A4 調好，直接列印即可

也可以不轉 PDF：收件程式的「開啟題目」支援 .html，
把上面這個資料夾設成題目資料夾就能直接用。
`);
