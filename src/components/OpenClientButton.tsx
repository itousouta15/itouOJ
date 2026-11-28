"use client";

import { useState } from "react";

// 「開啟收件程式」：用 itouoj:// 帶入伺服器網址、比賽編號與帳號（帳號只供比對，
// 不是憑證），選手不用自己輸入。沒裝程式的話瀏覽器不會有反應，按下去會顯示提示。
export default function OpenClientButton({
  contestId,
  username,
}: {
  contestId: number;
  username: string;
}) {
  const [clicked, setClicked] = useState(false);

  function open() {
    const server = window.location.origin;
    const url =
      `itouoj://start?server=${encodeURIComponent(server)}` +
      `&contest=${contestId}` +
      `&user=${encodeURIComponent(username)}`;
    window.location.href = url;
    setClicked(true);
  }

  return (
    <div className="flex flex-col gap-2">
      <button className="btn-primary" onClick={open}>
        開啟收件程式
      </button>
      {clicked && (
        <p className="max-w-xs text-xs text-mute">
          沒有反應的話代表這台電腦還沒安裝收件程式，
          或瀏覽器擋掉了外部程式的開啟。請改從桌面捷徑開啟。
        </p>
      )}
    </div>
  );
}
