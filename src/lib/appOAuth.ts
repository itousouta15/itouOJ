// App OAuth 登入暫存：流程在系統瀏覽器完成（WebView 會被 Google 封鎖），
// App 再用一次性 code 換回 WebView 的 session cookie，不影響瀏覽器登入狀態。
// 單一 server process 用 Map 即可，10 分鐘過期。

interface PendingLogin {
  provider: "google" | "discord";
  createdAt: number;
  codeChallenge: string;
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

export function createAppLogin(
  provider: "google" | "discord",
  codeChallenge: string
): string {
  cleanup();
  const code = crypto.randomUUID().replace(/-/g, "").slice(0, 24);
  store.set(code, { provider, createdAt: Date.now(), codeChallenge });
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
  code: string,
  codeChallenge: string
): { provider: "google" | "discord"; userId: string } | null {
  const p = store.get(code);
  if (!p || !p.userId || p.codeChallenge !== codeChallenge) return null;
  if (Date.now() - p.createdAt > TTL_MS) {
    store.delete(code);
    return null;
  }
  store.delete(code);
  return { provider: p.provider, userId: p.userId };
}
