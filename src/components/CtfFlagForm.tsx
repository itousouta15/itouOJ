"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CTF_FLAG_MAX_LENGTH } from "@/lib/ctfSchema";

export default function CtfFlagForm({ challengeId, solved, inline = false }: { challengeId: number; solved: boolean; inline?: boolean }) {
  const router = useRouter();
  const [flag, setFlag] = useState("");
  const [busy, setBusy] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [wait, setWait] = useState(0);
  useEffect(() => {
    if (!wait) return;
    const timer = setInterval(() => setWait((seconds) => Math.max(0, seconds - 1)), 1000);
    return () => clearInterval(timer);
  }, [wait]);
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    try {
      const res = await fetch(`/api/ctf/challenges/${challengeId}/attempts`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ flag }),
      });
      const data = await res.json().catch(() => null);
      if (res.status === 429) setWait(Math.max(1, Number(res.headers.get("Retry-After")) || 60));
      if (!res.ok) throw new Error(data?.error ?? `提交失敗（HTTP ${res.status}），請重試`);
      if (!["correct", "incorrect", "already_solved"].includes(data?.result)) throw new Error("未取得判定結果，請重試");
      if (data.result === "incorrect") setMessage("Flag 不正確，再試試看。");
      else { setAccepted(true); setFlag(""); setMessage(data.result === "correct" ? "答對了！" : "這題已經解出了。"); }
      router.refresh();
    } catch (err) { setError(err instanceof Error && !(err instanceof TypeError) ? err.message : "網路連線失敗，請重試"); }
    finally { setBusy(false); }
  }
  if (solved || accepted) return <p role="status" className="font-semibold text-[var(--green)]">{message || "已解出這題"}</p>;
  return <form onSubmit={submit} className="space-y-3">
    <div className={inline ? "ctf-flag-row" : "space-y-3"}>
      <label className="block min-w-0 flex-1 text-sm">Flag<input className="input mt-2 w-full" placeholder="flag{...}" required maxLength={CTF_FLAG_MAX_LENGTH} value={flag} onChange={(e) => setFlag(e.target.value)} autoComplete="off" autoCapitalize="none" spellCheck={false} disabled={busy || wait > 0} /></label>
      <button className="btn-primary" disabled={busy || wait > 0}>{busy ? "判定中…" : wait ? `請等 ${wait} 秒` : "提交 Flag"}</button>
    </div>
    <p className="text-xs text-dim">區分大小寫；只忽略前後空白。</p>
    {message && <p role="status" className="text-sm text-dim">{message}</p>}
    {error && <p role="alert" className="text-sm text-[#ff6b6b]">{error}</p>}
  </form>;
}
