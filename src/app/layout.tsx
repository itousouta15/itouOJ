import type { Metadata, Viewport } from "next";
import "./globals.css";
import "katex/dist/katex.min.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BottomNav from "@/components/BottomNav";
import PageTransition from "@/components/PageTransition";
import SiteLoader from "@/components/SiteLoader";
import { isOfflineMode } from "@/lib/offline";

// viewport-fit=cover 讓畫面延伸到瀏海/圓角底下，再由 CSS 的
// env(safe-area-inset-*) 留邊（見 globals.css 的 .site-header / .bottom-nav）。
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#1b1e23" },
    { media: "(prefers-color-scheme: light)", color: "#e9e9ee" },
  ],
};

const siteUrl = process.env.APP_URL ?? "https://oj.itousouta.me";
const siteDescription =
  "itouOJ 是線上程式解題與競賽平台，提供程式題庫、即時程式評測、程式碼識讀練習與競賽功能。";

// metadataBase 給相對網址（OG 圖片、canonical）補齊網域用；沒設的話 Next.js
// 只會警告，不影響功能，但社群分享預覽、搜尋結果的網址可能會是錯的相對路徑。
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "itouOJ",
  title: {
    default: "itouOJ | 線上程式解題與競賽平台",
    template: "%s | itouOJ",
  },
  description: siteDescription,
  keywords: ["itouOJ", "online judge", "程式解題", "APCS", "程式競賽"],
  openGraph: {
    siteName: "itouOJ",
    type: "website",
    locale: "zh_TW",
    url: "/",
    title: "itouOJ | 線上程式解題與競賽平台",
    description: siteDescription,
  },
  twitter: {
    card: "summary_large_image",
    title: "itouOJ | 線上程式解題與競賽平台",
    description: siteDescription,
  },
};

const websiteStructuredData = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${siteUrl}/#website`,
  name: "itouOJ",
  alternateName: "itou OJ",
  url: siteUrl,
  description: siteDescription,
  inLanguage: "zh-Hant-TW",
  publisher: {
    "@type": "Organization",
    name: "itouOJ",
    url: siteUrl,
    logo: `${siteUrl}/brand/itouOJ.png`,
    sameAs: ["https://github.com/itousouta15/itouOJ"],
  },
}).replace(/</g, "\\u003c");

// 在 hydration 前套用主題，避免亮→暗閃爍。App（Capacitor WebView）內一律
// 深色：原生橋接在頁面載入前就會注入 window.Capacitor，這裡可同步判斷。
const themeInit = `(function(){try{
  var app=window.Capacitor&&window.Capacitor.isNativePlatform&&window.Capacitor.isNativePlatform();
  if(app){
    document.documentElement.setAttribute("data-app","1");
  }else if(localStorage.getItem("oj-theme")==="light"){
    document.documentElement.setAttribute("data-theme","light");
  }
}catch(e){}})();`;

// 辰宇落雁體走 emfont 的分塊 subset CSS，先 preload、等瀏覽器閒置才套用；
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: websiteStructuredData }}
        />
      </head>
      <body className="flex min-h-full flex-col">
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
        <SiteLoader />
        <div className="app-top-mask" aria-hidden="true" />
        <Navbar />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-8 md:pb-8">
          <PageTransition>{children}</PageTransition>
        </main>
        <Footer />
        <BottomNav />
      </body>
    </html>
  );
}
