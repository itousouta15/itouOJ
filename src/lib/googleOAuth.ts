// Google OAuth 2.0（授權碼流程）共用設定
export const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
export const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
export const OAUTH_STATE_COOKIE = "oj_oauth_state";

export function googleConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
  );
}

// 組出對外的網址：正式環境設 APP_URL（例如 https://oj.example.tw），
// 沒設就用當次請求的 origin（本地開發夠用）
export function appUrl(request: Request): string {
  return process.env.APP_URL?.replace(/\/$/, "") ?? new URL(request.url).origin;
}

export function redirectUri(request: Request): string {
  return `${appUrl(request)}/api/auth/google/callback`;
}
