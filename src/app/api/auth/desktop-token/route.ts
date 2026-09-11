import { z } from "zod";
import { getSession, createDesktopToken } from "@/lib/auth";

// 發給離線收件程式的 token：瀏覽器 session 是 httpOnly cookie，桌面程式讀不到。
// 使用者在 /desktop-auth 主動授權後才簽發，內容與一般 session 相同。
const schema = z.object({
  port: z.number().int().min(1024).max(65535),
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "請先登入" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "參數錯誤" }, { status: 400 });
  }

  const token = await createDesktopToken({
    userId: session.userId,
    username: session.username,
    role: session.role,
  });

  return Response.json({ token, username: session.username });
}
