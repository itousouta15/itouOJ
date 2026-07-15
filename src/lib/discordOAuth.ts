// Discord OAuth 2.0（授權碼流程）共用設定
export const DISCORD_AUTH_URL = "https://discord.com/api/oauth2/authorize";
export const DISCORD_TOKEN_URL = "https://discord.com/api/oauth2/token";
export const DISCORD_USER_URL = "https://discord.com/api/users/@me";
export const OAUTH_STATE_COOKIE = "oj_oauth_state";

export function discordConfigured(): boolean {
  return Boolean(
    process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET
  );
}

// 組出對外的網址：正式環境設 APP_URL（例如 https://oj.example.tw），
// 沒設就用當次請求的 origin（本地開發夠用）
export function appUrl(request: Request): string {
  return process.env.APP_URL?.replace(/\/$/, "") ?? new URL(request.url).origin;
}

export function redirectUri(request: Request): string {
  return `${appUrl(request)}/api/auth/discord/callback`;
}
