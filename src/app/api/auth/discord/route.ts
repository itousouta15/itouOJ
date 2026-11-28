import { cookies } from "next/headers";
import { getSession } from "@/lib/auth";
import { safeNextPath } from "@/lib/safeNext";
import { isValidAppLogin } from "@/lib/appOAuth";
import {
  DISCORD_AUTH_URL,
  OAUTH_STATE_COOKIE,
  appUrl,
  discordConfigured,
  redirectUri,
} from "@/lib/discordOAuth";

export async function GET(request: Request) {
  if (!discordConfigured()) {
    return Response.redirect(`${appUrl(request)}/login?error=discord`, 302);
  }

  // App 登入：OAuth 在系統瀏覽器跑，session 之後由 App 用一次性 code 領回
  const appCode = new URL(request.url).searchParams.get("code");
  const isApp = new URL(request.url).searchParams.get("app") === "1";
  if (isApp && !isValidAppLogin(appCode)) {
    return Response.redirect(`${appUrl(request)}/login?error=discord`, 302);
  }

  // ?link=1：在設定頁把 Discord 帳號連結到目前已登入的帳號，而不是登入/註冊新帳號
  const isLink = new URL(request.url).searchParams.get("link") === "1";
  let linkUserId: string | undefined;
  if (isLink) {
    const session = await getSession();
    if (!session) return Response.redirect(`${appUrl(request)}/login`, 302);
    linkUserId = session.userId;
  }

  // state 防 CSRF：存進 cookie，callback 時比對
  const next = safeNextPath(new URL(request.url).searchParams.get("next"));

  const state = crypto.randomUUID();
  const cookieStore = await cookies();
  cookieStore.set(
    OAUTH_STATE_COOKIE,
    JSON.stringify({ state, linkUserId, next, appCode }),
    {
      httpOnly: true,
      sameSite: "lax",
        secure: process.env.NODE_ENV === "production" || process.env.COOKIE_SECURE === "1",
      maxAge: 600,
      path: "/",
    }
  );

  const url = new URL(DISCORD_AUTH_URL);
  url.searchParams.set("client_id", process.env.DISCORD_CLIENT_ID!);
  url.searchParams.set("redirect_uri", redirectUri(request));
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "identify email");
  url.searchParams.set("state", state);
  url.searchParams.set("prompt", "consent");

  return Response.redirect(url, 302);
}
