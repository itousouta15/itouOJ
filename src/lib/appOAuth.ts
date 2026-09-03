// App OAuth 登入暫存：登入流程在系統瀏覽器（Custom Tab）完成，
// 完成後 App 用一次性 code 回來換 session cookie。
// 用意：OAuth 在 WebView 內會被 Google 封鎖，改到系統瀏覽器跑；
// 但 session cookie 只設回 WebView（App 自己的 cookie jar），
// 不會污染使用者瀏覽器裡的網站登入狀態 —— 這就是「和網頁不衝突」的關鍵。
//
// 單一 server process 用 Map 即可；過期自動清理（10 分鐘）。

interface PendingLogin {
  provider: "google" | "discord";
  createdAt: number;
  userId?: string;
}

const TTL_MS = 10 * 60 * 1000;
const store = new Map<string, PendingLogin>();

function cleanup() {
  const now = Date.now();
  for (const [code, p] of store) {
    if (now - p.createdAt > TTL_MS) store.delete(code);
  }
}

export function createAppLogin(provider: "google" | "discord"): string {
  cleanup();
  const code = crypto.randomUUID().replace(/-/g, "").slice(0, 24);
  store.set(code, { provider, createdAt: Date.now() });
  return code;
}

export function isValidAppLogin(code: string | null): boolean {
  if (!code) return false;
  const p = store.get(code);
  if (!p) return false;
  if (Date.now() - p.createdAt > TTL_MS) {
    store.delete(code);
    return false;
  }
  return true;
}

// OAuth callback 完成後，把使用者寫進這個 code（App 端還沒來領）
export function completeAppLogin(code: string, userId: string): boolean {
  const p = store.get(code);
  if (!p) return false;
  p.userId = userId;
  return true;
}

// App 回來領 session；領走就刪（一次性）
export function consumeAppLogin(
  code: string
): { provider: "google" | "discord"; userId: string } | null {
  const p = store.get(code);
  if (!p || !p.userId) return null;
  if (Date.now() - p.createdAt > TTL_MS) {
    store.delete(code);
    return null;
  }
  store.delete(code);
  return { provider: p.provider, userId: p.userId };
}