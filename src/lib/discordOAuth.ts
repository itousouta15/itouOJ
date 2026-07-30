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

// Discord 的 /users/@me 給的是頭像 hash，不是網址，要自己組出 CDN 連結。
// 沒設頭像的帳號 avatar 是 null——這時回 null，讓前端退回顯示名字首字，
// 不去組 Discord 的預設頭像網址（那個要另外算 index，而我們自己的
// 首字方框跟站內其他地方長得一致，比較好）。
// hash 開頭是 a_ 代表是動態頭像，用 .gif 才動得起來。
export function discordAvatarUrl(
  userId: string,
  avatarHash: string | null | undefined
): string | null {
  if (!avatarHash) return null;
  const ext = avatarHash.startsWith("a_") ? "gif" : "png";
  return `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.${ext}?size=128`;
}
