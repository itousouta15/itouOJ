import { cookies } from "next/headers";
import { getSession } from "@/lib/auth";
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

  // ?link=1：在設定頁把 Discord 帳號連結到目前已登入的帳號，而不是登入/註冊新帳號
  const isLink = new URL(request.url).searchParams.get("link") === "1";
  let linkUserId: string | undefined;
  if (isLink) {
    const session = await getSession();
    if (!session) return Response.redirect(`${appUrl(request)}/login`, 302);
    linkUserId = session.userId;
  }

  // state 防 CSRF：存進 cookie，callback 時比對
  const state = crypto.randomUUID();
  const cookieStore = await cookies();
  cookieStore.set(
    OAUTH_STATE_COOKIE,
    JSON.stringify({ state, linkUserId }),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.COOKIE_SECURE === "1",
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
