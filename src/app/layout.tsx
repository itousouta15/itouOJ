import type { Metadata, Viewport } from "next";
import "./globals.css";
import "katex/dist/katex.min.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BottomNav from "@/components/BottomNav";
import SiteLoader from "@/components/SiteLoader";
import { isOfflineMode } from "@/lib/offline";

// viewport-fit=cover 讓畫面延伸到瀏海/圓角底下，再由 CSS 的
// env(safe-area-inset-*) 留邊（見 globals.css 的 .site-header / .bottom-nav）。
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#1b1e23",
};

const siteUrl = process.env.APP_URL ?? "https://oj.itousouta.me";
const siteDescription =
  "itouOJ 提供程式解題、APCS 識讀與 CTF 資安練習，包含即時評測、Web Lab、課程及競賽。三種挑戰，共用一個帳號。";

// metadataBase 給相對網址（OG 圖片、canonical）補齊網域用；沒設的話 Next.js
// 只會警告，不影響功能，但社群分享預覽、搜尋結果的網址可能會是錯的相對路徑。
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "itouOJ",
  title: {
    default: "itouOJ | 實作、識讀與 CTF 練習平台",
    template: "%s | itouOJ",
  },
  description: siteDescription,
  keywords: ["itouOJ", "online judge", "程式解題", "APCS", "程式競賽", "CTF", "資安練習", "Web Lab"],
  openGraph: {
    siteName: "itouOJ",
    type: "website",
    locale: "zh_TW",
    url: "/",
    title: "itouOJ | 實作、識讀與 CTF 練習平台",
    description: siteDescription,
  },
  twitter: {
    card: "summary_large_image",
    title: "itouOJ | 實作、識讀與 CTF 練習平台",
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

// 在首繪前辨識 Capacitor WebView，套用 App 專屬的深色介面。
const appInit = `(function(){try{
  if(window.Capacitor&&window.Capacitor.isNativePlatform&&window.Capacitor.isNativePlatform()){
    document.documentElement.setAttribute("data-app","1");
  }
}catch(e){}})();`;

// 辰宇落雁體只用在品牌字樣，等瀏覽器閒置後再載入，不阻塞主要內容。
const EMFONT_CSS = "https://font.emtech.cc/css/ChenYuLuoYan";
const fontApply = `(function(){
  function apply(){var l=document.createElement('link');l.rel='stylesheet';l.href='${EMFONT_CSS}';document.head.appendChild(l);}
  if('requestIdleCallback' in window) requestIdleCallback(apply); else setTimeout(apply,0);
})();`;

const GOOGLE_FONTS_CSS =
  "https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;700&family=JetBrains+Mono:wght@400;500;700&family=Noto+Sans+TC:wght@400;500;700&family=Shippori+Mincho:wght@400;600;700&display=swap";

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
        <script dangerouslySetInnerHTML={{ __html: appInit }} />
        <SiteLoader />
        <div className="app-top-mask" aria-hidden="true" />
        <Navbar />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-8 md:pb-8">
          {children}
        </main>
        <Footer />
        <BottomNav />
      </body>
    </html>
  );
}
