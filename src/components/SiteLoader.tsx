"use client";

import { useEffect, useState } from "react";

// 同 itousouta.me 的 SiteLoader：window load 前用全頁模糊遮罩蓋住，
// 載入完成後往上滑出，再讓 header 播放進場動畫（body.site-revealed）。
const MAX_WAIT_MS = 4000;
const SLIDE_MS = 600;

export default function SiteLoader() {
  const [hiding, setHiding] = useState(false);
  const [gone, setGone] = useState(false);
  const [blurred, setBlurred] = useState(false);

  useEffect(() => {
    let raf1 = 0;
    let raf2 = 0;
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setBlurred(true));
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = "hidden";

    let hideTimer: ReturnType<typeof setTimeout>;
    let removeTimer: ReturnType<typeof setTimeout>;
    let done = false;

    const startHide = () => {
      if (done) return;
      done = true;
      setHiding(true);
      // 畫面往上滑出結束後才讓 header／主畫面開始進場，見 globals.css 的
      // body.site-revealed 規則。
      removeTimer = setTimeout(() => {
        document.body.classList.add("site-revealed");
        setGone(true);
      }, SLIDE_MS);
    };

    if (document.readyState === "complete") {
      hideTimer = setTimeout(startHide, 150);
    } else {
      window.addEventListener("load", startHide);
      // 保險：資源載入異常緩慢時，最多等 4 秒仍讓網站顯示。
      hideTimer = setTimeout(startHide, MAX_WAIT_MS);
    }

    return () => {
      window.removeEventListener("load", startHide);
      clearTimeout(hideTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  // Logo 用的 ChenYuLuoYan 字面特別小，載入前 fallback 會先放大、載入完成才縮小（FOUT）。
  // 等字體就緒後才加 .fonts-ready 讓 logo 淡入。原站把這段放在 Header，
  // 這裡的 Navbar 是 server component，所以掛在 SiteLoader。
  useEffect(() => {
    const reveal = () => document.documentElement.classList.add("fonts-ready");
    if (!("fonts" in document)) {
      reveal();
      return;
    }
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      reveal();
    };
    document.fonts.load('45px "ChenYuLuoYan"').then(finish).catch(finish);
    // 保險：字體請求失敗或過慢時，最多等 3 秒仍顯示 logo。
    const timer = window.setTimeout(finish, 3000);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (gone) document.body.style.overflow = "";
  }, [gone]);

  if (gone) return null;

  return (
    <>
      {/* 沒有 JS 就不會觸發滑出與 site-revealed，避免遮罩擋住整個網站、
          header 也卡在進場動畫的起始幀 */}
      <noscript>
        <style>{`
          .site-loader { display: none !important; }
          .site-header {
            animation: none !important;
          }
          .logo { opacity: 1 !important; }
        `}</style>
      </noscript>
      <div
        className={`site-loader${hiding ? " site-loader--hide" : ""}${blurred ? " site-loader--blurred" : ""}`}
        role="status"
        aria-live="polite"
        aria-label="頁面載入中"
      />
    </>
  );
}
