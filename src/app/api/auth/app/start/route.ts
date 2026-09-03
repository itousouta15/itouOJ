import { createAppLogin } from "@/lib/appOAuth";

// App 啟動 OAuth：產生一次性登入碼，回傳要開到系統瀏覽器的 URL。
// 流程：App → 此端點拿 { code, url } → Browser.open(url)（系統瀏覽器）
// → OAuth 完成後瀏覽器顯示「可以回 App 了」→ App 用 code 去 /api/auth/app/complete
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