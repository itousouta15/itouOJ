"use client";

import { useState } from "react";

export default function DesktopAuthPanel({
  port,
  state,
  username,
}: {
  port: number;
  state: string;
  username: string;
}) {
  const [status, setStatus] = useState<"idle" | "working" | "done" | "error">(
    "idle"
  );
  const [error, setError] = useState("");

  async function authorize() {
    setStatus("working");
    setError("");
    try {
      const res = await fetch("/api/auth/desktop-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ port }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "授權失敗");
        setStatus("error");
        return;
      }
      setStatus("done");
      // 導回收件程式在本機開的臨時監聽埠。這一步是瀏覽器做的，
      // 伺服器不會去連 127.0.0.1（那是使用者自己的電腦）。
      window.location.href =
        `http://127.0.0.1:${port}/callback` +
        `?state=${encodeURIComponent(state)}` +
        `&token=${encodeURIComponent(data.token)}`;
    } catch {
      setError("無法連線，請稍後再試");
      setStatus("error");
    }
  }

  return (
    <div className="mx-auto mt-10 max-w-md">
      <div className="card p-6">
        <h1 className="mb-1 section-title">授權收件程式</h1>
        <p className="mb-5 text-sm text-dim">
          itouOJ 收件程式要以{" "}
          <span className="font-semibold text-tx">{username}</span>{" "}
          的身分登入這台電腦。
        </p>

        <div className="mb-5 rounded-lg border border-bd bg-inset p-4 text-sm text-dim">
          <p className="mb-2 font-medium text-tx">授權後收件程式可以</p>
          <ul className="list-inside list-disc space-y-1">
            <li>讀取你報名的比賽與題目</li>
            <li>以你的身分提交程式碼</li>
          </ul>
          <p className="mt-3 text-xs text-mute">
            如果不是你自己在收件程式裡按下登入，請直接關閉這個頁面。
          </p>
        </div>

        {status === "done" ? (
          <div className="rounded-lg border border-[rgba(76,175,80,0.35)] bg-inset p-4 text-sm">
            <p className="font-medium text-[#4caf50]">已授權</p>
            <p className="mt-1 text-dim">
              請回到收件程式，它應該已經登入完成。這個分頁可以關閉了。
            </p>
          </div>
        ) : (
          <>
            {error && <p className="mb-3 text-sm text-[#ff6b6b]">{error}</p>}
            <button
              className="btn-primary w-full"
              onClick={authorize}
              disabled={status === "working"}
            >
              {status === "working" ? "授權中…" : "授權"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
