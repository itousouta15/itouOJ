import { prisma } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { consumeAppLogin } from "@/lib/appOAuth";

async function codeChallenge(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(verifier)
  );
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0")
  ).join("");
}

// App 用一次性 code 領 session。這裡的 fetch 由 WebView 發出，Set-Cookie
// 只進 App 的 cookie jar，不影響系統瀏覽器的登入狀態。
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const code = typeof body?.code === "string" ? body.code : null;
  const verifier = typeof body?.verifier === "string" ? body.verifier : null;
  if (!code || !verifier || verifier.length < 32 || verifier.length > 128) {
    return Response.json({ error: "缺少登入碼" }, { status: 400 });
  }

  const info = consumeAppLogin(code, await codeChallenge(verifier));
  if (!info) {
    return Response.json(
      { error: "登入已過期或未完成，請重新登入" },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({ where: { id: info.userId } });
  if (!user) {
    return Response.json({ error: "使用者不存在" }, { status: 404 });
  }

  await createSession({
    userId: user.id,
    username: user.username,
    role: user.role,
  });
  return Response.json({ ok: true, username: user.username });
}
