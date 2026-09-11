import { cache } from "react";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const DEV_SECRET = "dev-secret-please-change";

// production 沒設 AUTH_SECRET 就直接讓啟動失敗：用預設值上線等於所有人的
// session 都能被偽造。next build 階段還拿不到 runtime 環境變數，所以跳過。
function resolveSecret(): Uint8Array {
  const fromEnv = process.env.AUTH_SECRET;
  if (fromEnv) return new TextEncoder().encode(fromEnv);
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return new TextEncoder().encode(DEV_SECRET);
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "AUTH_SECRET 未設定：production 環境必須設定 AUTH_SECRET 才能啟動"
    );
  }
  return new TextEncoder().encode(DEV_SECRET);
}

const secret = resolveSecret();
const COOKIE_NAME = "oj_session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 天

export interface Session {
  userId: string;
  username: string;
  role: string;
}

export async function createSession(session: Session) {
  const token = await new SignJWT({ ...session })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    // 尚未上 HTTPS 前不能開 secure，上了之後在 .env 設 COOKIE_SECURE=1
    secure: process.env.COOKIE_SECURE === "1",
    maxAge: MAX_AGE,
    path: "/",
  });
}

// 離線收件程式用的 token，不透過 cookie 發放。有效期 30 天，比網頁 session
// 長——賽前一週設定好機器後可能就沒網路了，過期會沒辦法重新登入。
export async function createDesktopToken(session: Session): Promise<string> {
  return new SignJWT({ ...session })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${60 * 60 * 24 * 30}s`) // 30 天
    .sign(secret);
}

// cache()：layout（Navbar/BottomNav）與 page 常在同一請求各呼叫一次，
// 包起來讓同一請求內只驗一次 JWT。
export const getSession = cache(async (): Promise<Session | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return {
      userId: payload.userId as string,
      username: payload.username as string,
      role: payload.role as string,
    };
  } catch {
    return null;
  }
});

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
