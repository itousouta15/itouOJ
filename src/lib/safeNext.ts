// 登入後要導回的路徑。這個值來自查詢字串，直接拿去 redirect 會變成
// open redirect（/login?next=https://釣魚站），所以只接受站內絕對路徑，
// 擋掉 //evil.com 這種協定相對網址。
export function safeNextPath(value: string | null | undefined): string | null {
  if (!value) return null;
  if (!value.startsWith("/")) return null;
  if (value.startsWith("//")) return null;
  if (value.includes("\\")) return null; // 有些瀏覽器把 \ 正規化成 /
  return value;
}
