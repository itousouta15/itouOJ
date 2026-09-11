"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// 對話頁下方的輸入框。傳送成功後用 router.refresh() 讓 server component
// 重新抓訊息，不用自己維護一份訊息 state。
export default function MessageComposer({
  to,
  initialDraft = "",
}: {
  to: string;
  initialDraft?: string;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState(initialDraft);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  async function send() {
    const content = draft.trim();
    if (!content || sending) return;
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, content }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "傳送失敗");
        return;
      }
      setDraft("");
      router.refresh();
    } catch {
      setError("傳送失敗，請稍後再試");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="card p-4">
      <textarea
        className="input h-24 text-sm"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="輸入訊息…（Ctrl + Enter 傳送）"
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            send();
          }
        }}
      />
      <div className="mt-2 flex items-center justify-between gap-3">
        {error ? (
          <p className="text-sm text-[#ff6b6b]">{error}</p>
        ) : (
          <p className="text-xs text-mute">Ctrl + Enter 也可以傳送</p>
        )}
        <button
          className="btn-primary"
          disabled={sending || !draft.trim()}
          onClick={send}
        >
          {sending ? "傳送中…" : "傳送"}
        </button>
      </div>
    </div>
  );
}
