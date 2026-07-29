// 把單一題目渲染成一份「可列印、離線可開」的自包含 HTML——不依賴外部字型檔或
// 網路資源，KaTeX 的 CSS 與字型直接內嵌成 base64，開啟就對，適合下載到選手機。
//
// 渲染管線刻意和網站一致（remark-gfm + remark-math + rehype-katex），
// 所以看起來跟選手在 OJ 上看到的題目長得一樣。這裡是 scripts/export-problems.mjs
// 的姊妹版本：那支是本機批次匯出整場比賽用的命令列工具，這裡是給網頁 API
// 用的單題版本，兩邊各自獨立維護（同樣邏輯但執行環境不同，沒有共用模組）。

import fs from "node:fs";
import path from "node:path";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkRehype from "remark-rehype";
import rehypeKatex from "rehype-katex";

// ── hast -> HTML ────────────────────────────────────
// rehype-stringify 沒有裝（react-markdown 走 React 元素路徑，不需要序列化字串），
// 這裡只要把樹轉成字串，自己寫比多裝一個套件划算。
const VOID = new Set([
  "area", "base", "br", "col", "embed", "hr", "img", "input",
  "link", "meta", "param", "source", "track", "wbr",
]);

const esc = (s: unknown) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const escAttr = (s: unknown) => esc(s).replace(/"/g, "&quot;");

function propName(key: string): string {
  if (key === "className") return "class";
  if (key === "htmlFor") return "for";
  return key.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase());
}

interface HastNode {
  type: string;
  value?: string;
  tagName?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
}

function toHtml(node: HastNode | HastNode[]): string {
  if (Array.isArray(node)) return node.map(toHtml).join("");
  if (node.type === "root") return toHtml(node.children ?? []);
  if (node.type === "text") return esc(node.value);
  if (node.type === "raw") return node.value ?? ""; // 題敘裡直接寫的 HTML
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

  if (VOID.has(node.tagName!)) return `<${node.tagName}${attrs}>`;
  return `<${node.tagName}${attrs}>${toHtml(node.children ?? [])}</${node.tagName}>`;
}

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkMath)
  .use(remarkRehype)
  .use(rehypeKatex);

async function markdownToHtml(md: string): Promise<string> {
  const tree = await processor.run(processor.parse(md ?? ""));
  return toHtml(tree as unknown as HastNode);
}

// KaTeX CSS 引用的字型（fonts/*.woff2）直接內嵌成 base64，整份 HTML 才能
// 零外部依賴地離線開啟——不用另外帶一個 fonts/ 資料夾。
let cachedKatexCss: string | null = null;
function embeddedKatexCss(): string {
  if (cachedKatexCss) return cachedKatexCss;

  const katexDir = path.join(process.cwd(), "node_modules", "katex", "dist");
  let css = fs.readFileSync(path.join(katexDir, "katex.min.css"), "utf8");
  const fontsDir = path.join(katexDir, "fonts");

  css = css.replace(/url\(fonts\/([^)]+\.woff2)\)/g, (match, filename: string) => {
    const fontPath = path.join(fontsDir, filename);
    if (!fs.existsSync(fontPath)) return match;
    const base64 = fs.readFileSync(fontPath).toString("base64");
    return `url(data:font/woff2;base64,${base64})`;
  });

  cachedKatexCss = css;
  return css;
}

export interface ProblemDocInput {
  contestTitle: string;
  label: string;
  title: string;
  timeLimitMs: number;
  memoryLimitMb: number;
  statement: string;
  samples: { input: string; output: string }[];
}

export async function renderProblemDocHtml(p: ProblemDocInput): Promise<string> {
  const body = await markdownToHtml(p.statement);
  const sampleRows = p.samples
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
<title>${esc(p.label)}. ${esc(p.title)}</title>
<style>
${embeddedKatexCss()}
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
<div class="contest">${esc(p.contestTitle)}</div>
<h1>${esc(p.label)}. ${esc(p.title)}</h1>
<div class="limits">
  <span>時間限制：${(p.timeLimitMs / 1000).toFixed(p.timeLimitMs % 1000 ? 1 : 0)} 秒</span>
  <span>記憶體限制：${p.memoryLimitMb} MB</span>
</div>
${body}
${p.samples.length ? "<h2>範例測資</h2>" + sampleRows : ""}
</body>
</html>`;
}
