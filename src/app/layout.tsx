import type { Metadata } from "next";
import "./globals.css";
import "katex/dist/katex.min.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageTransition from "@/components/PageTransition";
import SiteLoader from "@/components/SiteLoader";

export const metadata: Metadata = {
  title: { default: "itouOJ", template: "%s | Online Judge" },
  description: "itouSouta 的程式解題系統",
};

// 在 hydration 前套用主題，避免亮→暗閃爍
const themeInit = `(function(){try{if(localStorage.getItem("oj-theme")==="light"){document.documentElement.setAttribute("data-theme","light")}}catch(e){}})();`;

// 辰宇落雁體走 emfont 的分塊 subset CSS（同 itousouta15.tw）。
// 先 preload、等瀏覽器閒置才真正套用，首繪不會被字體檔擋住；
// 字體就緒前 logo 由 .fonts-ready 規則隱藏（見 SiteLoader / globals.css）。
const EMFONT_CSS = "https://font.emtech.cc/css/ChenYuLuoYan";
const fontApply = `(function(){
  function apply(){var l=document.createElement('link');l.rel='stylesheet';l.href='${EMFONT_CSS}';document.head.appendChild(l);}
  if('requestIdleCallback' in window) requestIdleCallback(apply); else setTimeout(apply,0);
})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://font.emtech.cc" />
        <link rel="preload" as="style" href={EMFONT_CSS} />
        <script dangerouslySetInnerHTML={{ __html: fontApply }} />
        <noscript>
          <link rel="stylesheet" href={EMFONT_CSS} />
        </noscript>
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
