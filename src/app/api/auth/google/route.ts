import { cookies } from "next/headers";
import {
  GOOGLE_AUTH_URL,
  OAUTH_STATE_COOKIE,
  appUrl,
  googleConfigured,
  redirectUri,
} from "@/lib/googleOAuth";

export async function GET(request: Request) {
  if (!googleConfigured()) {
    return Response.redirect(`${appUrl(request)}/login?error=google`, 302);
  }

  // state 防 CSRF：存進 cookie，callback 時比對
  const state = crypto.randomUUID();
  const cookieStore = await cookies();
  cookieStore.set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.COOKIE_SECURE === "1",
    maxAge: 600,
    path: "/",
  });

  const url = new URL(GOOGLE_AUTH_URL);
  url.searchParams.set("client_id", process.env.GOOGLE_CLIENT_ID!);
  url.searchParams.set("redirect_uri", redirectUri(request));
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", state);
  url.searchParams.set("prompt", "select_account");

  return Response.redirect(url, 302);
}
