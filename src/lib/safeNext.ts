// 登入後要導回哪裡。
//
// 這個值來自查詢字串，等於是使用者可控的輸入，直接拿去 redirect 就會變成
// 開放重新導向（open redirect）—— 攻擊者可以做出
// https://oj.itousouta.me/login?next=https://釣魚站 這種連結，
// 網址列看起來是可信網域，登入後卻把人送到別的地方。
//
// 因此只接受「站內的絕對路徑」：必須以單一 / 開頭。
// 擋掉 //evil.com（協定相對網址，瀏覽器會當成外部網域）和 https://evil.com。
export function safeNextPath(value: string | null | undefined): string | null {
  if (!value) return null;
  if (!value.startsWith("/")) return null;
  if (value.startsWith("//")) return null;
  if (value.includes("\\")) return null; // 有些瀏覽器把 \ 正規化成 /
  return value;
}
