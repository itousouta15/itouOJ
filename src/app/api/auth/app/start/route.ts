import { createAppLogin } from "@/lib/appOAuth";

// App 啟動 OAuth：發一次性 code，並回傳要開到系統瀏覽器的網址。
// OAuth 完成後 App 拿 code 去 /api/auth/app/complete 換 session。
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const provider = searchParams.get("provider");
  const link = searchParams.get("link") === "1";
  if (provider !== "google" && provider !== "discord") {
    return Response.json({ error: "不支援的登入方式" }, { status: 400 });
  }
  const code = createAppLogin(provider);
  const url = `/api/auth/${provider}?app=1&code=${code}${link ? "&link=1" : ""}`;
  return Response.json({ code, url });
}