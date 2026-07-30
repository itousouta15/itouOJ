import type { Metadata } from "next";
import "./globals.css";
import "katex/dist/katex.min.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageTransition from "@/components/PageTransition";
import SiteLoader from "@/components/SiteLoader";
import { isOfflineMode } from "@/lib/offline";

// metadataBase 給相對網址（OG 圖片、canonical）補齊網域用；沒設的話 Next.js
// 只會警告，不影響功能，但社群分享預覽、搜尋結果的網址可能會是錯的相對路徑。
export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL ?? "https://oj.itousouta.me"),
  title: { default: "itouOJ", template: "%s | itouOJ" },
  description: "itouSouta 的程式解題系統，收錄 APCS 風格的練習題與線上比賽。",
  openGraph: {
    siteName: "itouOJ",
    type: "website",
    locale: "zh_TW",
  },
};

// 在 hydration 前套用主題，避免亮→暗閃爍
const themeInit = `(function(){try{if(localStorage.getItem("oj-theme")==="light"){document.documentElement.setAttribute("data-theme","light")}}catch(e){}})();`;

// 辰宇落雁體走 emfont 的分塊 subset CSS（同 itousouta.me）。
// 先 preload、等瀏覽器閒置才真正套用，首繪不會被字體檔擋住；
// 字體就緒前 logo 由 .fonts-ready 規則隱藏（見 SiteLoader / globals.css）。
const EMFONT_CSS = "https://font.emtech.cc/css/ChenYuLuoYan";
const fontApply = `(function(){
  function apply(){var l=document.createElement('link');l.rel='stylesheet';l.href='${EMFONT_CSS}';document.head.appendChild(l);}
  if('requestIdleCallback' in window) requestIdleCallback(apply); else setTimeout(apply,0);
})();`;

const GOOGLE_FONTS_CSS =
  "https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&family=JetBrains+Mono:wght@400;500;700&family=Noto+Sans+TC:wght@400;500;700&family=Noto+Serif+TC:wght@400;600;700&family=Shippori+Mincho:wght@400;600;700&display=swap";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 斷網比賽時整組跳過外部字型：機房連不到 fonts.googleapis.com / font.emtech.cc，
  // 留著只會讓每一頁都空等到 timeout（SiteLoader 的保險是 4 秒）。
  const offline = isOfflineMode();

  return (
    <html lang="zh-Hant" className="h-full antialiased" suppressHydrationWarning>
      <head>
        {!offline && (
          <>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link
              rel="preconnect"
              href="https://fonts.gstatic.com"
              crossOrigin=""
            />
            <link rel="stylesheet" href={GOOGLE_FONTS_CSS} />
            <link rel="preconnect" href="https://font.emtech.cc" />
            <link rel="preload" as="style" href={EMFONT_CSS} />
            <script dangerouslySetInnerHTML={{ __html: fontApply }} />
            <noscript>
              <link rel="stylesheet" href={EMFONT_CSS} />
            </noscript>
          </>
        )}
      </head>
      <body className="flex min-h-full flex-col">
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
        <SiteLoader />
        <Navbar />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
          <PageTransition>{children}</PageTransition>
        </main>
        <Footer />
      </body>
    </html>
  );
}
