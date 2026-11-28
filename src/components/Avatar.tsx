"use client";

import { useState } from "react";

// 名字首字的備援底色。用名字算出固定的色相，同一個人在站內任何地方
// 都會是同一個顏色，不會每次重整就換一個。
function hueFrom(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  return h;
}

export default function Avatar({
  name,
  src,
  size = 32,
}: {
  name: string;
  src?: string | null;
  size?: number;
}) {
  // Google / Discord 的 CDN 偶爾會回 404（使用者換頭像、舊網址失效），
  // 這時要退回首字方框，而不是留一個破圖。
  const [failed, setFailed] = useState(false);
  const px = `${size}px`;

  if (src && !failed) {
    return (
      // 外部頭像用原生 <img> 直接抓 CDN，不用 next/image 代理。
      // referrerPolicy 是 Google 頭像的慣例，少了可能被擋。
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        width={size}
        height={size}
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className="shrink-0 rounded-full bg-inset object-cover"
        style={{ width: px, height: px }}
      />
    );
  }

  const initial = name.trim().charAt(0).toUpperCase() || "?";
  const hue = hueFrom(name);
  return (
    <span
      aria-hidden
      className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white select-none"
      style={{
        width: px,
        height: px,
        fontSize: `${Math.round(size * 0.45)}px`,
        background: `hsl(${hue} 45% 45%)`,
      }}
    >
      {initial}
    </span>
  );
}
