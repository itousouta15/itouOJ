"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ContestRevealButton({ contestId }: { contestId: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function reveal() {
    if (!confirm("確定要公開最終成績嗎？公開後所有人都能看到完整排行榜與提交結果。"))
      return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/contests/${contestId}/reveal`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "操作失敗");
        return;
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button className="btn-primary" onClick={reveal} disabled={loading}>
        {loading ? "處理中…" : "公開最終成績"}
      </button>
      {error && <p className="mt-2 text-sm text-[#ff6b6b]">{error}</p>}
    </div>
  );
}
