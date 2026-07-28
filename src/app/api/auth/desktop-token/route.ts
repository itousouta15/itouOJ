import { z } from "zod";
import { getSession, createDesktopToken } from "@/lib/auth";

// 發放給離線收件程式的 session token。
//
// 為什麼需要這支：瀏覽器裡的 session 是 httpOnly cookie，桌面程式讀不到。
// 使用者在 /desktop-auth 頁面按下授權後，由這裡簽一張同樣身分的 token 交給它，
// 桌面程式再帶著這張 token 呼叫 API。
//
// 安全性上的取捨：
//   - 只發給「已登入」的人，而且必須是使用者在授權頁主動按下按鈕
//   - token 內容和一般 session 相同，等於把登入狀態複製一份給桌面程式；
//     真正的邊界仍在伺服器（報名檢查、語言限制、時間夾制）
//   - 回呼只允許 127.0.0.1，port 由呼叫端提供但只用於瀏覽器端導向，
//     伺服器本身不會去連那個位址
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
