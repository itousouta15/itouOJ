"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ProposalReviewActions({
  proposalId,
}: {
  proposalId: number;
}) {
  const router = useRouter();
  const [isPublic, setIsPublic] = useState(true);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function approve() {
    if (!confirm("確定要核准這個申請並建立正式題目嗎？")) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `/api/admin/problems/proposals/${proposalId}/approve`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isPublic }),
        }
      );
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

  async function reject() {
    if (!confirm("確定要退回這個申請嗎？")) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `/api/admin/problems/proposals/${proposalId}/reject`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ note }),
        }
      );
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
    <div className="card space-y-4 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
          />
          核准後立即公開題目
        </label>
        <button className="btn-primary" onClick={approve} disabled={loading}>
          {loading ? "處理中…" : "核准並建立題目"}
        </button>
      </div>

      <div className="border-t border-line pt-4">
        <label className="mb-1 block text-sm font-medium">
          退回原因（會顯示給投稿人）
        </label>
        <textarea
          className="input h-24"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="例如：題敘不清楚、測資有誤等"
        />
        <div className="mt-2 flex justify-end">
          <button className="btn-danger" onClick={reject} disabled={loading}>
            {loading ? "處理中…" : "退回"}
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-[#ff6b6b]">{error}</p>}
    </div>
  );
}
