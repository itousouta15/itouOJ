// Discord OAuth 2.0（授權碼流程）共用設定
import { isOfflineMode } from "@/lib/offline";

export const DISCORD_AUTH_URL = "https://discord.com/api/oauth2/authorize";
export const DISCORD_TOKEN_URL = "https://discord.com/api/oauth2/token";
export const DISCORD_USER_URL = "https://discord.com/api/users/@me";
export const OAUTH_STATE_COOKIE = "oj_oauth_state";

export function discordConfigured(): boolean {
  if (isOfflineMode()) return false;
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

// Discord 給的是頭像 hash 不是網址，要自己組 CDN 連結；沒設頭像回 null，
// 讓前端退回首字方框。hash 開頭是 a_ 代表動態頭像，要用 .gif。
export function discordAvatarUrl(
  userId: string,
  avatarHash: string | null | undefined
): string | null {
  if (!avatarHash) return null;
  const ext = avatarHash.startsWith("a_") ? "gif" : "png";
  return `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.${ext}?size=128`;
}
