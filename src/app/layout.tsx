import type { Metadata } from "next";
import "./globals.css";
import "katex/dist/katex.min.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: { default: "Online Judge", template: "%s | Online Judge" },
  description: "自架的程式解題系統",
};

// 在 hydration 前套用主題，避免亮→暗閃爍
const themeInit = `(function(){try{if(localStorage.getItem("oj-theme")==="light"){document.documentElement.setAttribute("data-theme","light")}}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant" className="h-full antialiased" suppressHydrationWarning>
      <body className="flex min-h-full flex-col">
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
        <Navbar />
        <main className="page-transition mx-auto w-full max-w-5xl flex-1 px-4 py-8">
          {children}
        </main>
        <footer className="mono py-8 text-center text-[11px] tracking-[0.2em] text-mute uppercase">
          Powered by Next.js + Piston
        </footer>
      </body>
    </html>
  );
}
