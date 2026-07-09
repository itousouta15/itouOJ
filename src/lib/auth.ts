import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET ?? "dev-secret-please-change"
);
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

export async function getSession(): Promise<Session | null> {
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
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
