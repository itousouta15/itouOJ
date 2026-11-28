import { randomBytes } from "node:crypto";
import { decryptCtfLabFlag } from "@/lib/ctfLabFlag";
import { renderExtendedCtfLab } from "@/lib/ctfWebLabs";

export interface CtfLabChallenge {
  id: number;
  title: string;
  labType: string | null;
  flagHash: string;
  labFlagCiphertext: string | null;
}

export function escapeLabHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);
}

export function ctfLabCookieName(id: number): string { return `ctf_lab_${id}_role`; }
export function ctfLabCookie(id: number, role: string, secure: boolean, remove = false): string {
  return `${ctfLabCookieName(id)}=${role}; Path=/ctf/labs/${id}; Max-Age=${remove ? 0 : 3600}; SameSite=Lax${secure ? "; Secure" : ""}`;
}
function role(request: Request, id: number): "visitor" | "guest" | "admin" {
  const prefix = `${ctfLabCookieName(id)}=`;
  const value = request.headers.get("cookie")?.split(";").map((item) => item.trim()).find((item) => item.startsWith(prefix))?.slice(prefix.length);
  return value === "guest" || value === "admin" ? value : "visitor";
}

const styles = `
:root{color-scheme:dark;--bg:#101820;--panel:#18232d;--ink:#eef3f6;--dim:#a4b4c0;--accent:#8ce2c5;--line:#2c3d49}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.7 system-ui,sans-serif}
a{color:var(--accent);text-decoration:none}a:hover{text-decoration:underline}.wrap{max-width:1000px;margin:auto;padding:0 24px}
header{border-bottom:1px solid var(--line)}header .wrap{display:flex;justify-content:space-between;align-items:center;gap:20px;padding-top:20px;padding-bottom:20px;flex-wrap:wrap}
.brand{font-size:20px;font-weight:800;letter-spacing:.03em}nav{display:flex;gap:20px;flex-wrap:wrap;font-size:14px}
main{padding:50px 0 70px}h1{font-size:clamp(32px,6vw,56px);line-height:1.15;margin:14px 0 22px;overflow-wrap:anywhere}h2{font-size:24px;line-height:1.4;margin:0 0 14px}
p{margin:0 0 18px}.dim{color:var(--dim)}.eyebrow{font-size:12px;letter-spacing:.2em;text-transform:uppercase;color:var(--accent)}
.hero{padding:24px 0 36px}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin:30px 0}.split{display:grid;grid-template-columns:1.2fr 1fr;gap:32px;align-items:start}
.card{background:var(--panel);border:1px solid var(--line);padding:28px;border-radius:16px}.button,button{display:inline-block;border:0;border-radius:10px;padding:12px 20px;background:var(--accent);color:#0a231b;font:700 15px system-ui;cursor:pointer;text-decoration:none}.button:hover{text-decoration:none;filter:brightness(1.1)}
label{display:block;font-size:14px;margin:0 0 18px}input{display:block;width:100%;margin-top:7px;border:1px solid var(--line);border-radius:9px;padding:12px;background:var(--bg);color:var(--ink);font:inherit}
input:focus-visible,a:focus-visible,button:focus-visible{outline:3px solid #b8a1ff;outline-offset:4px}code{font-family:ui-monospace,monospace;overflow-wrap:anywhere}.flag{display:block;padding:18px;border:1px solid var(--accent);border-radius:10px;color:var(--accent);font-size:18px}
.error{color:#ffadad}.badge{display:inline-block;padding:4px 12px;background:#293c48;border-radius:30px;font-size:12px}.ticket{border-left:4px solid var(--accent)}footer{border-top:1px solid var(--line);padding:24px 0;color:var(--dim);font-size:13px}
@media(max-width:650px){.wrap{padding:0 18px}.grid,.split{grid-template-columns:1fr}.card{padding:22px}main{padding-top:26px}nav{gap:14px}header .wrap{align-items:flex-start}.hero{padding-top:12px}}
`;

export function ctfLabHtml(challenge: CtfLabChallenge, brand: string, content: string, options: {
  status?: number; cookie?: string; script?: string; comment?: string;
} = {}): Response {
  const nonce = randomBytes(18).toString("base64");
  const base = `/ctf/labs/${challenge.id}`;
  const header = challenge.labType === "COOKIE"
    ? `<a href="${base}">會員首頁</a><a href="${base}/admin">管理員公告</a>`
    : challenge.labType === "IDOR" ? `<a href="${base}">我的票券</a>`
    : challenge.labType === "SOURCE" ? `<a href="${base}#about">關於我們</a><a href="${base}#join">加入社團</a>` : `<a href="${base}">網站首頁</a>`;
  const html = `<!doctype html>
<html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${escapeLabHtml(brand)} · ${escapeLabHtml(challenge.title)}</title><style nonce="${nonce}">${styles}</style></head>
<body><header><div class="wrap"><a class="brand" href="${base}">${escapeLabHtml(brand)}</a><nav aria-label="網站導覽">${header}<a href="/ctf/${challenge.id}">返回題目 ↗</a></nav></div></header>
<main><div class="wrap">${content}</div></main><footer><div class="wrap">itouOJ Web Lab · 本站帳號、公告與票券都是解題用模擬資料。</div></footer>
${options.comment ? `<!-- ${escapeLabHtml(options.comment)} -->` : ""}
${options.script ? `<script nonce="${nonce}">${options.script}</script>` : ""}</body></html>`;
  return new Response(html, {
    status: options.status ?? 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8", "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff", "X-Robots-Tag": "noindex, nofollow",
      "Content-Security-Policy": `default-src 'none'; style-src 'nonce-${nonce}'; script-src 'nonce-${nonce}'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'`,
      "Referrer-Policy": "same-origin", ...(options.cookie ? { "Set-Cookie": options.cookie } : {}),
    },
  });
}

export function ctfLabAnswer(challenge: CtfLabChallenge): string {
  if (!challenge.labFlagCiphertext) throw new Error("Missing lab configuration");
  return decryptCtfLabFlag(challenge.labFlagCiphertext, challenge.flagHash);
}

export function renderCtfLab(request: Request, challenge: CtfLabChallenge, path: string[]): Response {
  const base = `/ctf/labs/${challenge.id}`;
  const secure = new URL(request.url).protocol === "https:" || request.headers.get("x-forwarded-proto") === "https";
  if (challenge.labType === "SOURCE" && path.length === 0) {
    return ctfLabHtml(challenge, "雲端研究社", `
      <section class="hero"><span class="eyebrow">Open Day / 2026</span><h1>好奇，從多看一眼開始。</h1><p class="dim">寫程式、拆解小工具、一起把問題問清楚。歡迎加入雲端研究社。</p><a class="button" href="#join">我想參加迎新</a></section>
      <section class="grid" id="about"><article class="card"><h2>動手做</h2><p class="dim">把想法做成小作品，每個人都能找到自己的第一步。</p></article><article class="card"><h2>一起想</h2><p class="dim">分享你發現的線索，換個角度也許就有答案。</p></article><article class="card"><h2>多看一眼</h2><p class="dim">看得到的畫面，只是網站的一部分。</p></article></section>
      <section class="card" id="join"><h2>迎新登記</h2><p class="dim">留下解題用暱稱，先試試網站的小功能。</p><form id="signup"><label>暱稱<input required maxlength="40" name="nickname" autocomplete="off"></label><button>登記迎新</button></form><p id="signup-result" role="status" class="dim"></p></section>`, {
      comment: `maintainer-note: ${ctfLabAnswer(challenge)}`,
      script: `document.getElementById('signup').addEventListener('submit',function(event){event.preventDefault();document.getElementById('signup-result').textContent='登記完成，迎新時見！';});`,
    });
  }
  if (challenge.labType === "COOKIE") {
    const current = role(request, challenge.id);
    if (path.length === 1 && path[0] === "admin") {
      if (current !== "admin") return ctfLabHtml(challenge, "北風社員站", `<section class="card"><span class="badge">僅限管理員</span><h1>這裡還不能進。</h1><p class="dim">目前的登入角色：${current}。管理員公告只開放給管理員。</p><a class="button" href="${base}">回到會員首頁</a></section>`, { status: 403 });
      return ctfLabHtml(challenge, "北風社員站", `<section class="card"><span class="eyebrow">Admin bulletin</span><h1>管理員公告</h1><p class="dim">站務維修用通關碼已更新，請返回題目提交：</p><code class="flag">${escapeLabHtml(ctfLabAnswer(challenge))}</code></section>`);
    }
    if (path.length === 0) return ctfLabHtml(challenge, "北風社員站", `
      <div class="split"><section class="hero"><span class="eyebrow">Members / Northwind</span><h1>歡迎回來，${current === "visitor" ? "新朋友" : "社員"}。</h1><p class="dim">網站會把登入狀態留在瀏覽器裡，重新整理後也不用再輸入一次。</p><p>目前角色：<span class="badge">${current}</span></p><a href="${base}/admin">查看管理員公告 →</a></section>
      <section class="card"><h2>社員登入</h2><p class="dim">迎新訪客帳號：<code>guest</code>，密碼：<code>guest</code>。</p><form method="post" action="${base}/login"><label>帳號<input name="username" required autocomplete="off"></label><label>密碼<input name="password" type="password" required autocomplete="off"></label><button>登入社員站</button></form>${current !== "visitor" ? `<form method="post" action="${base}/logout"><button>登出社員站</button></form>` : ""}</section></div>`, {
      cookie: current === "visitor" ? ctfLabCookie(challenge.id, "visitor", secure) : undefined,
    });
  }
  if (challenge.labType === "IDOR") {
    if (path.length === 0) return ctfLabHtml(challenge, "星港票券收藏站", `
      <section class="hero"><span class="eyebrow">My collection</span><h1>每張票，都有自己的故事。</h1><p class="dim">新手，你的迎新票券已準備好。點進票券查看詳細資料。</p></section><section class="card ticket"><span class="badge">票券 #1001</span><h2>新手的迎新入場券</h2><p class="dim">星港交流會 · 2026 年秋季</p><a class="button" href="${base}/notes/1001">查看我的票券</a></section>`);
    if (path.length === 2 && path[0] === "notes" && ["1001", "1002"].includes(path[1])) {
      const admin = path[1] === "1002";
      return ctfLabHtml(challenge, "星港票券收藏站", `<section class="card ticket"><span class="badge">票券 #${path[1]}</span><h1>${admin ? "管理員的特別票券" : "新手的迎新入場券"}</h1><p>持有人：${admin ? "管理員" : "新手"}</p><p class="dim">${admin ? "內部備註：這張票的通關碼只應該讓持有人看到。" : "你的票券編號在網址裡；網站靠這個編號找到對應資料。"}</p>${admin ? `<code class="flag">${escapeLabHtml(ctfLabAnswer(challenge))}</code>` : "<p>入場時間：18:30，請到一樓服務台報到。</p>"}<a href="${base}">← 回到我的票券</a></section>`);
    }
  }
  return renderExtendedCtfLab(request, challenge, path) ?? ctfLabHtml(challenge, "Web Lab", "<h1>找不到這個頁面</h1><p class=\"dim\">請返回網站首頁，或回到題目確認網址。</p>", { status: 404 });
}
