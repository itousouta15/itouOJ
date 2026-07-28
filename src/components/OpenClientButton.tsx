"use client";

import { useState } from "react";

// 「開啟收件程式」：用 itouoj:// 通訊協定把桌面程式叫起來，並帶上伺服器網址
// 與比賽編號，選手不必自己打。協定由 client/setup-machine.ps1 在佈署時註冊。
//
// 沒安裝收件程式的話瀏覽器不會有反應，所以按下去之後補一段說明，
// 免得選手一直按而不知道發生什麼事。
export default function OpenClientButton({ contestId }: { contestId: number }) {
  const [clicked, setClicked] = useState(false);

  function open() {
    const server = window.location.origin;
    const url =
      `itouoj://start?server=${encodeURIComponent(server)}` +
      `&contest=${contestId}`;
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
