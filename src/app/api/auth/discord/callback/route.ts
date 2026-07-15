import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { createSession } from "@/lib/auth";
import {
  DISCORD_TOKEN_URL,
  DISCORD_USER_URL,
  OAUTH_STATE_COOKIE,
  appUrl,
  discordConfigured,
  redirectUri,
} from "@/lib/discordOAuth";

interface DiscordUser {
  id?: string;
  username?: string;
  global_name?: string | null;
  email?: string | null;
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
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  const cookieStore = await cookies();
  const raw = cookieStore.get(OAUTH_STATE_COOKIE)?.value;
  cookieStore.delete(OAUTH_STATE_COOKIE);

  let savedState: string | undefined;
  let linkUserId: string | undefined;
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as { state?: string; linkUserId?: string };
      savedState = parsed.state;
      linkUserId = parsed.linkUserId;
    } catch {
      savedState = raw;
    }
  }

  // 連結流程失敗要回設定頁，一般登入/註冊失敗回登入頁
  const loginError = (error = "discord") =>
    Response.redirect(
      `${appUrl(request)}/${linkUserId ? "settings" : "login"}?error=${error}`,
      302
    );

  if (!discordConfigured()) return loginError();

  if (!code || !state || !savedState || state !== savedState) {
    return loginError();
  }

  try {
    // 用授權碼換 token
    const tokenRes = await fetch(DISCORD_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.DISCORD_CLIENT_ID!,
        client_secret: process.env.DISCORD_CLIENT_SECRET!,
        redirect_uri: redirectUri(request),
        grant_type: "authorization_code",
      }),
    });
    if (!tokenRes.ok) {
      console.error("[discord-auth] token exchange failed:", await tokenRes.text());
      return loginError();
    }
    const { access_token: accessToken } = (await tokenRes.json()) as {
      access_token?: string;
    };
    if (!accessToken) return loginError();

    // Discord 不像 Google 會給 id_token，要另外打 API 拿使用者資料
    const userRes = await fetch(DISCORD_USER_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!userRes.ok) {
      console.error("[discord-auth] fetch user failed:", await userRes.text());
      return loginError();
    }
    const discordUser = (await userRes.json()) as DiscordUser;
    if (!discordUser.id) return loginError();

    const existing = await prisma.user.findUnique({
      where: { discordId: discordUser.id },
    });

    if (linkUserId) {
      // 把這個 Discord 帳號連結到目前已登入的使用者，而不是登入/建立新帳號
      if (existing && existing.id !== linkUserId) {
        return loginError("discord_taken");
      }
      if (!existing) {
        await prisma.user.update({
          where: { id: linkUserId },
          data: {
            discordId: discordUser.id,
            email: discordUser.email ?? undefined,
          },
        });
      }
      return Response.redirect(`${appUrl(request)}/settings?linked=discord`, 302);
    }

    let user = existing;
    if (!user) {
      // 第一次用這個 Discord 帳號登入 → 自動建立帳號（規則同註冊：第一個使用者是管理員）
      const base =
        discordUser.email?.split("@")[0] ||
        discordUser.global_name ||
        discordUser.username ||
        "user";
      const [username, userCount] = await Promise.all([
        uniqueUsername(base),
        prisma.user.count(),
      ]);
      user = await prisma.user.create({
        data: {
          username,
          passwordHash: null,
          discordId: discordUser.id,
          email: discordUser.email ?? null,
          displayName: discordUser.global_name ?? discordUser.username ?? null,
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
    console.error("[discord-auth] callback error:", err);
    return loginError();
  }
}
