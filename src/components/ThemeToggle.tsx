"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [light, setLight] = useState(false);

  useEffect(() => {
    setLight(document.documentElement.getAttribute("data-theme") === "light");
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
  }

  return (
    <button className="theme-btn" onClick={toggle} aria-label="切換主題">
      {light ? "☀" : "☾"}
    </button>
  );
}
