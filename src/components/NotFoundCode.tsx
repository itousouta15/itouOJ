"use client";

import { useEffect, useRef, useState } from "react";

// 跟 itouSouta.me 同款「稍微」跟著滑鼠瞄過去的手感：位移量夾在極小範圍內，
// 用 requestAnimationFrame 節流，避免 mousemove 高頻率觸發把 React state 灌爆
const MAX_OFFSET = 10;
const FOLLOW_STRENGTH = 0.03;

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

export default function NotFoundCode() {
  const trackRef = useRef<HTMLHeadingElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    let raf = 0;
    let pending: { x: number; y: number } | null = null;

    const apply = () => {
      if (pending) setOffset(pending);
      raf = 0;
    };

    const handleMove = (e: MouseEvent) => {
      const rect = trackRef.current?.getBoundingClientRect();
      if (!rect) return;
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      pending = {
        x: clamp((e.clientX - cx) * FOLLOW_STRENGTH, -MAX_OFFSET, MAX_OFFSET),
        y: clamp((e.clientY - cy) * FOLLOW_STRENGTH, -MAX_OFFSET, MAX_OFFSET),
      };
      if (!raf) raf = requestAnimationFrame(apply);
    };

    window.addEventListener("mousemove", handleMove);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <h1
      ref={trackRef}
      className="text-[84px] leading-none font-bold text-tx transition-transform duration-150 ease-out sm:text-[128px]"
      style={{
        // .page-title / .section-title 在 globals.css 也是這樣直接寫死字型名稱，
        // 沒有對應的 Tailwind utility（@theme inline 只曝露 --font-sans/--font-mono）
        fontFamily: '"Shippori Mincho", "Noto Serif TC", serif',
        transform: `translate(${offset.x}px, ${offset.y}px)`,
      }}
    >
      4<span className="text-blue">0</span>4
    </h1>
  );
}
