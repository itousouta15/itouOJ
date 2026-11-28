import { createAppLogin } from "@/lib/appOAuth";
import { z } from "zod";

const schema = z.object({
  provider: z.enum(["google", "discord"]),
  codeChallenge: z.string().regex(/^[a-f0-9]{64}$/),
});

// App 啟動 OAuth：發一次性 code，並回傳要開到系統瀏覽器的網址。
// OAuth 完成後 App 拿 code 去 /api/auth/app/complete 換 session。
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "不支援的登入方式" }, { status: 400 });
  }
  const { provider, codeChallenge } = parsed.data;
  const code = createAppLogin(provider, codeChallenge);
  const url = `/api/auth/${provider}?app=1&code=${code}`;
  return Response.json({ code, url });
}
