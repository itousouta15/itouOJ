import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { createSession } from "@/lib/auth";
import {
  GOOGLE_TOKEN_URL,
  OAUTH_STATE_COOKIE,
  appUrl,
  googleConfigured,
  redirectUri,
} from "@/lib/googleOAuth";

interface GoogleIdTokenPayload {
  sub?: string;
  email?: string;
  name?: string;
}

// 產生符合站內規則（3-20 字英數底線）且不重複的 username
async function uniqueUsername(base: string): Promise<string> {
  let name = base.replace(/[^a-zA-Z0-9_]/g, "").slice(0, 15).toLowerCase();
  if (name.length < 3) name = `user${name}`;
  for (let i = 0; i < 10; i++) {
    const candidate =
      i === 0 ? name : `${name}_${Math.floor(1000 + Math.random() * 9000)}`;
    const existing = await prisma.user.findUnique({
      where: { username: candidate },
    });
    if (!existing) return candidate;
  }
  return `user_${Date.now().toString(36)}`;
}

export async function GET(request: Request) {
  const loginError = () =>
    Response.redirect(`${appUrl(request)}/login?error=google`, 302);

  if (!googleConfigured()) return loginError();

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  const cookieStore = await cookies();
  const savedState = cookieStore.get(OAUTH_STATE_COOKIE)?.value;
  cookieStore.delete(OAUTH_STATE_COOKIE);

  if (!code || !state || !savedState || state !== savedState) {
    return loginError();
  }

  try {
    // 用授權碼換 token
    const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: redirectUri(request),
        grant_type: "authorization_code",
      }),
    });
    if (!tokenRes.ok) {
      console.error("[google-auth] token exchange failed:", await tokenRes.text());
      return loginError();
    }
    const { id_token: idToken } = (await tokenRes.json()) as {
      id_token?: string;
    };
    if (!idToken) return loginError();

    // id_token 直接來自 Google 的 token endpoint（TLS），取 payload 即可
    const payload = JSON.parse(
      Buffer.from(idToken.split(".")[1], "base64url").toString("utf8")
    ) as GoogleIdTokenPayload;
    if (!payload.sub) return loginError();

    let user = await prisma.user.findUnique({
      where: { googleId: payload.sub },
    });

    if (!user) {
      // 第一次用這個 Google 帳號登入 → 自動建立帳號（規則同註冊：第一個使用者是管理員）
      const base = payload.email?.split("@")[0] || payload.name || "user";
      const [username, userCount] = await Promise.all([
        uniqueUsername(base),
        prisma.user.count(),
      ]);
      user = await prisma.user.create({
        data: {
          username,
          passwordHash: null,
          googleId: payload.sub,
          email: payload.email ?? null,
          displayName: payload.name ?? null,
          role: userCount === 0 ? "ADMIN" : "USER",
        },
      });
    }

    await createSession({
      userId: user.id,
      username: user.username,
      role: user.role,
    });
    return Response.redirect(`${appUrl(request)}/`, 302);
  } catch (err) {
    console.error("[google-auth] callback error:", err);
    return loginError();
  }
}
