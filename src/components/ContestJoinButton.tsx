"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ContestJoinButton({
  contestId,
  joined,
  requiresCode,
  disabled,
}: {
  contestId: number;
  joined: boolean;
  requiresCode: boolean;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function join() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/contests/${contestId}/membership`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "報名失敗");
        return;
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function leave() {
    setLoading(true);
    try {
      await fetch(`/api/contests/${contestId}/membership`, { method: "DELETE" });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (joined) {
    return (
      <button className="btn-secondary" onClick={leave} disabled={loading}>
        {loading ? "處理中…" : "取消報名"}
      </button>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {requiresCode && (
          <input
            className="input mono w-36"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="加入代碼"
            maxLength={32}
          />
        )}
        <button
          className="btn-primary"
          onClick={join}
          disabled={loading || disabled}
        >
          {loading ? "處理中…" : "報名比賽"}
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-[#ff6b6b]">{error}</p>}
    </div>
  );
}
