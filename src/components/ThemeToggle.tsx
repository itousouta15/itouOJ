"use client";

import { useEffect, useState } from "react";
import { syncStatusBar } from "@/lib/capacitor";

export default function ThemeToggle() {
  const [light, setLight] = useState(false);

  useEffect(() => {
    const isLight =
      document.documentElement.getAttribute("data-theme") === "light";
    setLight(isLight);
    // App 內：啟動時讓狀態列跟上網站主題
    syncStatusBar(!isLight);
  }, []);

  function toggle() {
    const next = !light;
    setLight(next);
    if (next) {
      document.documentElement.setAttribute("data-theme", "light");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
    try {
      localStorage.setItem("oj-theme", next ? "light" : "dark");
    } catch {}
    syncStatusBar(!next);
  }

  return (
    <button className="theme-btn" onClick={toggle} aria-label="切換主題">
      {light ? "☀" : "☾"}
    </button>
  );
}
