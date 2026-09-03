import { prisma } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { consumeAppLogin } from "@/lib/appOAuth";

// App 用一次性 code 回來領 session：OAuth 在系統瀏覽器跑完，
// 這裡的 fetch 是 App 的 WebView 發的（同 origin），
// Set-Cookie 只進 WebView 的 cookie jar，瀏覽器端不受影響。
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const code = typeof body?.code === "string" ? body.code : null;
  if (!code) {
    return Response.json({ error: "缺少登入碼" }, { status: 400 });
  }

  const info = consumeAppLogin(code);
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