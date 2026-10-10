import { createHmac, randomBytes } from "node:crypto";
import { createRequire } from "node:module";
import { posix } from "node:path";
import { CtfRequestError, ctfDownloadHeaders, readCtfBody } from "@/lib/ctfAttachment";
import { ctfLabAnswer, ctfLabHtml, escapeLabHtml, type CtfLabChallenge } from "@/lib/ctfLab";

// Node 22.13+ supplies SQLite. This connection never opens the application's DB.
const require = createRequire(import.meta.url);
interface LabDatabase {
  exec(sql: string): void;
  prepare(sql: string): { run(...values: string[]): unknown; get(): { username?: unknown } | undefined };
  close(): void;
}
const { DatabaseSync } = require("node:sqlite") as { DatabaseSync: new (path: string) => LabDatabase };

function text(content: string, filename?: string): Response {
  return new Response(content, { headers: {
    ...(filename ? ctfDownloadHeaders(filename) : {}),
    "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff", "X-Robots-Tag": "noindex, nofollow",
    "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
  } });
}
function reward(challenge: CtfLabChallenge, brand: string, heading: string): Response {
  return ctfLabHtml(challenge, brand, `<section class="card"><span class="eyebrow">Mission complete</span><h1>${heading}</h1><p>找到通關碼了，回到題目提交吧。</p><code class="flag">${escapeLabHtml(ctfLabAnswer(challenge))}</code></section>`);
}
function cookieValue(request: Request, name: string): string {
  return request.headers.get("cookie")?.split(";").map((item) => item.trim()).find((item) => item.startsWith(`${name}=`))?.slice(name.length + 1) ?? "";
}
function tokenRole(request: Request, id: number): string {
  const token = cookieValue(request, `ctf_lab_${id}_token`);
  if (token.length > 2048) return "visitor";
  try {
    const parts = token.split(".");
    if (parts.length !== 3 || !parts.slice(0, 2).every((part) => /^[A-Za-z0-9_-]+$/.test(part))) return "visitor";
    const header = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8"));
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
    // Intentional puzzle: decode claims but never verify the signature.
    if (!["HS256", "none"].includes(header?.alg) || payload?.lab !== id) return "visitor";
    return payload.role === "admin" || payload.role === "guest" ? payload.role : "visitor";
  } catch { return "visitor"; }
}

export function renderExtendedCtfLab(request: Request, challenge: CtfLabChallenge, path: string[]): Response | null {
  const base = `/ctf/labs/${challenge.id}`;
  const page = path.join("/");
  if (challenge.labType === "ROBOTS") {
    if (!page) return ctfLabHtml(challenge, "晨霧觀測站", `<section class="hero"><span class="eyebrow">Morning observatory</span><h1>留住每個清晨的風景。</h1><p class="dim">觀測紀錄公開，值班備忘錄則不希望出現在搜尋結果裡。</p></section><section class="card"><h2>站務資訊</h2><p>自動索引程式請先閱讀本站的 <a href="${base}/robots.txt">爬蟲規則</a>。</p><p class="dim">本練習網站的 robots.txt 位於自己的網站目錄下。</p></section>`);
    if (page === "robots.txt") return text(`User-agent: *\nDisallow: ${base}/staff/dawn-note\n`);
    if (page === "staff/dawn-note") return reward(challenge, "晨霧觀測站", "值班備忘錄");
  }
  if (challenge.labType === "BACKUP") {
    if (!page) return ctfLabHtml(challenge, "紙鶴維護站", `<section class="hero"><span class="eyebrow">Maintenance log</span><h1>整理完，就重新開站。</h1><p class="dim">搬家中的小網站，留下了幾則維護筆記。</p></section><section class="card"><h2>最近一次修改</h2><p>設定入口：<a href="${base}/config.php">config.php</a></p><p>編輯前先複製一份，副檔名加上 <code>.bak</code>；完成後記得清理。</p><p class="dim">清理工作：尚未完成。</p></section>`);
    if (page === "config.php") return ctfLabHtml(challenge, "紙鶴維護站", "<h1>設定檔不提供直接查看</h1><p>這個入口只回傳執行結果。</p>", { status: 403 });
    if (page === "config.php.bak") return text(`<?php\n// Archived teaching configuration, not an OJ configuration.\n$maintenance_code = ${JSON.stringify(ctfLabAnswer(challenge))};\n?>\n`, "config.php.bak");
  }
  if (challenge.labType === "PRICE" && !page) return ctfLabHtml(challenge, "星砂商店", `<section class="hero"><span class="eyebrow">Stardust shop</span><h1>小小預算，大大願望。</h1><p>你的體驗錢包有 <strong>100</strong> 枚星砂。每次購買都從這個餘額開始。</p></section><section class="card"><span class="badge">限定商品</span><h2>通關收藏盒</h2><p class="dim">售價：10,000 枚星砂。購買成功後可開啟盒中的通關碼。</p><form method="post" action="${base}/buy"><input type="hidden" name="item" value="flag-box"><input type="hidden" name="price" value="10000"><button>購買收藏盒</button></form></section>`);
  if (challenge.labType === "JWT") {
    const current = tokenRole(request, challenge.id);
    if (!page) return ctfLabHtml(challenge, "月台會員站", `<div class="split"><section class="hero"><span class="eyebrow">Platform members</span><h1>下一站，管理員公告。</h1><p>目前角色：<span class="badge">${current}</span></p><p class="dim">新版會員憑證採用 JWT，保存在本題專用的 Cookie。</p><a href="${base}/admin">查看管理員公告 →</a></section><section class="card"><h2>訪客登入</h2><p>帳號與密碼都是 <code>guest</code>。</p><form method="post" action="${base}/login"><label>帳號<input name="username" required maxlength="160" autocomplete="off"></label><label>密碼<input name="password" type="password" required maxlength="160" autocomplete="off"></label><button>取得會員憑證</button></form></section></div>`);
    if (page === "admin") return current === "admin" ? reward(challenge, "月台會員站", "月台管理員公告")
      : ctfLabHtml(challenge, "月台會員站", `<h1>需要管理員憑證</h1><p>目前角色：${current}。</p><a href="${base}">回到登入頁</a>`, { status: 403 });
  }
  if (challenge.labType === "TRAVERSAL") {
    if (!page) return ctfLabHtml(challenge, "遠山文件庫", `<section class="hero"><span class="eyebrow">Mountain documents</span><h1>旅程開始前，先讀一份指南。</h1><p class="dim">下載服務以 /public 為起點尋找文件。管理員筆記存放在隔壁的 /internal 目錄。</p></section><section class="card"><h2>公開文件</h2><p><a class="button" href="${base}/download?file=guide.txt">下載旅行指南</a></p><p class="dim">備份索引顯示內部筆記檔名為 maintenance.txt。</p></section>`);
    if (page === "download") {
      const name = new URL(request.url).searchParams.get("file") ?? "";
      if (name.length > 240 || name.includes("\0")) return text("無效的文件名稱\n");
      // Intentional missing public-directory check. Only virtual files exist.
      const target = posix.resolve("/public", name);
      if (target === "/public/guide.txt") return text("旅行指南\n帶上水壺，循著路標前進。\n", "guide.txt");
      if (target === "/internal/maintenance.txt") return text(`內部維護備忘錄\n通關碼：${ctfLabAnswer(challenge)}\n`, "maintenance.txt");
      return ctfLabHtml(challenge, "遠山文件庫", "<h1>文件不存在</h1><p>文件庫只有本題的公開指南與內部筆記。</p>", { status: 404 });
    }
  }
  if (challenge.labType === "SQLI" && !page) return ctfLabHtml(challenge, "古鐘社員站", `<div class="split"><section class="hero"><span class="eyebrow">Legacy member system</span><h1>老系統，還在值班。</h1><p class="dim">登入程式把表單資料拼進 SQLite 查詢。管理員帳號叫 admin，訪客帳號與密碼都是 guest。</p><p>維護筆記：<code>SELECT username FROM members WHERE username = '輸入帳號' AND password = '輸入密碼'</code></p><p class="dim">本題支援字串、整數、比較、括號、AND／OR／NOT 與 SQL 註解，供練習 WHERE 條件注入。</p></section><section class="card"><h2>社員登入</h2><form method="post" action="${base}/login"><label>帳號<input name="username" required maxlength="160" autocomplete="off"></label><label>密碼<input name="password" type="password" required maxlength="160" autocomplete="off"></label><button>登入</button></form></section></div>`);
  return null;
}

export function acceptsExtendedCtfPost(challenge: CtfLabChallenge, path: string[]): boolean {
  return path.length === 1 && ((challenge.labType === "PRICE" && path[0] === "buy") ||
    (["JWT", "SQLI"].includes(challenge.labType ?? "") && path[0] === "login"));
}

// Restrict the exercise to small boolean predicates on two synthetic rows.
// This is not a security filter for real SQL: real applications must bind inputs.
function teachingSql(query: string): boolean {
  const tokens = query.match(/'(?:[^']|'')*'|--[^\r\n]*|\/\*[\s\S]*?\*\/|\b(?:SELECT|username|FROM|members|WHERE|password|AND|OR|NOT)\b|\b\d{1,6}\b|<>|!=|<=|>=|[=<>()]|\s+/gi);
  return !!tokens && tokens.join("") === query;
}

export async function postExtendedCtfLab(request: Request, challenge: CtfLabChallenge): Promise<Response> {
  const bytes = await readCtfBody(request, 8192);
  if (!request.headers.get("content-type")?.startsWith("application/x-www-form-urlencoded")) throw new CtfRequestError("請使用網站的表單");
  const fields = new URLSearchParams(new TextDecoder().decode(bytes));
  const base = `/ctf/labs/${challenge.id}`;
  if (challenge.labType === "PRICE") {
    const price = fields.get("price") ?? "";
    if (fields.get("item") !== "flag-box" || !/^\d{1,6}$/.test(price)) throw new CtfRequestError("商品或價格無效");
    // Intentional puzzle: trusts the browser's price instead of a product table.
    return Number(price) <= 100 ? reward(challenge, "星砂商店", "收藏盒已開啟！")
      : ctfLabHtml(challenge, "星砂商店", `<h1>星砂不足</h1><p>錢包只有 100 枚星砂，這次請求的價格是 ${Number(price)}。</p><a href="${base}">回到商店</a>`, { status: 403 });
  }
  const username = fields.get("username") ?? "", password = fields.get("password") ?? "";
  if (username.length > 160 || password.length > 160) throw new CtfRequestError("帳號及密碼最多 160 個字元");
  if (challenge.labType === "JWT") {
    if (username !== "guest" || password !== "guest") return ctfLabHtml(challenge, "月台會員站", "<h1>登入失敗</h1><p>請使用訪客帳號。</p>", { status: 403 });
    const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
    const payload = Buffer.from(JSON.stringify({ sub: "guest", role: "guest", lab: challenge.id })).toString("base64url");
    const unsigned = `${header}.${payload}`;
    const token = `${unsigned}.${createHmac("sha256", randomBytes(32)).update(unsigned).digest("base64url")}`;
    const secure = new URL(request.url).protocol === "https:" || request.headers.get("x-forwarded-proto") === "https";
    return new Response(null, { status: 303, headers: { Location: base, "Cache-Control": "private, no-store",
      "Set-Cookie": `ctf_lab_${challenge.id}_token=${token}; Path=${base}; Max-Age=3600; SameSite=Lax${secure ? "; Secure" : ""}` } });
  }
  const query = `SELECT username FROM members WHERE username = '${username}' AND password = '${password}'`;
  if (!teachingSql(query)) throw new CtfRequestError("本題僅支援 WHERE 條件中的字串、比較、邏輯運算及註解");
  const db = new DatabaseSync(":memory:");
  try {
    db.exec("CREATE TABLE members (username TEXT, password TEXT)");
    db.prepare("INSERT INTO members VALUES (?, ?)").run("guest", "guest");
    db.prepare("INSERT INTO members VALUES (?, ?)").run("admin", randomBytes(24).toString("hex"));
    db.exec("PRAGMA query_only = ON");
    let row;
    try { row = db.prepare(query).get(); }
    catch { return ctfLabHtml(challenge, "古鐘社員站", `<h1>SQL 語法錯誤</h1><p>檢查字串引號與註解的位置。</p><code>${escapeLabHtml(query)}</code>`, { status: 400 }); }
    if (row?.username === "admin") return reward(challenge, "古鐘社員站", "管理員登入成功");
    return ctfLabHtml(challenge, "古鐘社員站", `<h1>${row ? "訪客登入成功" : "帳號或密碼不正確"}</h1><p>只有管理員能查看通關公告。</p><a href="${base}">返回登入頁</a>`, { status: row ? 200 : 403 });
  } finally { db.close(); }
}
