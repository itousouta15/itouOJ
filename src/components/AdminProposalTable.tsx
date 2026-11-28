"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import ProposalStatusBadge from "@/components/ProposalStatusBadge";

export interface AdminProposalRow {
  id: number;
  title: string;
  status: string;
  createdAt: string;
  author: { username: string };
}

export default function AdminProposalTable({
  proposals,
}: {
  proposals: AdminProposalRow[];
}) {
  const router = useRouter();
  const pendingIds = useMemo(
    () => proposals.filter((proposal) => proposal.status === "PENDING").map(({ id }) => id),
    [proposals],
  );
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [reviewNote, setReviewNote] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const allSelected = pendingIds.length > 0 && pendingIds.every((id) => selectedIds.includes(id));

  function toggle(id: number) {
    setSelectedIds((current) => current.includes(id)
      ? current.filter((selectedId) => selectedId !== id)
      : current.length >= 25 ? current : [...current, id]);
  }

  async function review(action: "approve" | "reject") {
    const count = selectedIds.length;
    if (count === 0 || saving) return;
    const description = action === "approve" ? "核准並建立正式題目" : "退回申請";
    if (!confirm(`確定要${description}所選的 ${count} 筆申請嗎？`)) return;

    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch("/api/admin/problems/proposals/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: selectedIds,
          action,
          ...(action === "approve" ? { isPublic } : {}),
          ...(action === "reject" ? { reviewNote } : {}),
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error ?? "批次審核失敗，請稍後重試");
        return;
      }
      setSelectedIds([]);
      setReviewNote("");
      setSuccess(action === "approve" ? `已核准 ${data.updated} 筆申請` : `已退回 ${data.updated} 筆申請`);
      router.refresh();
    } catch {
      setError("批次審核失敗，請檢查連線後重試");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {selectedIds.length > 0 && (
        <div className="mb-3 space-y-3 rounded-md border border-blue/40 bg-panel2 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-dim">已選取 {selectedIds.length} 筆待審申請（最多 25 筆）</span>
            <label className="flex items-center gap-2 text-sm text-dim">
              <input type="checkbox" checked={isPublic} onChange={(event) => setIsPublic(event.target.checked)} disabled={saving} />
              核准後立即公開
            </label>
            <button className="btn-primary" onClick={() => void review("approve")} disabled={saving}>
              {saving ? "處理中…" : "批次核准"}
            </button>
            <button className="btn-danger" onClick={() => void review("reject")} disabled={saving}>
              {saving ? "處理中…" : "批次退回"}
            </button>
            <button className="btn-secondary" onClick={() => setSelectedIds([])} disabled={saving}>
              取消選取
            </button>
          </div>
          <label className="block text-sm text-dim">
            批次退回原因（選填，會套用至所有所選申請）
            <textarea
              className="input mt-1 h-20"
              value={reviewNote}
              maxLength={2000}
              onChange={(event) => setReviewNote(event.target.value)}
              disabled={saving}
            />
          </label>
          {error && <p className="text-sm text-[#ff6b6b]" role="alert">{error}</p>}
        </div>
      )}
      {success && <p className="mb-3 text-sm text-dim" role="status">{success}</p>}
      {error && selectedIds.length === 0 && <p className="mb-3 text-sm text-[#ff6b6b]" role="alert">{error}</p>}
      <table className="w-full">
        <thead>
          <tr>
            <th className="table-head w-10">
              <input
                type="checkbox"
                aria-label="選取全部待審申請"
                checked={allSelected}
                disabled={saving || pendingIds.length === 0}
                onChange={() => setSelectedIds(allSelected ? [] : pendingIds.slice(0, 25))}
              />
            </th>
            <th className="table-head w-16">#</th>
            <th className="table-head">標題</th>
            <th className="table-head w-32">投稿人</th>
            <th className="table-head w-24">狀態</th>
            <th className="table-head w-40">送出時間</th>
            <th className="table-head w-20"></th>
          </tr>
        </thead>
        <tbody>
          {proposals.length === 0 && (
            <tr>
              <td colSpan={7} className="table-cell py-10 text-center text-mute">
                目前沒有出題申請
              </td>
            </tr>
          )}
          {proposals.map((proposal) => {
            const pending = proposal.status === "PENDING";
            const selected = selectedIds.includes(proposal.id);
            return (
              <tr key={proposal.id} className={selected ? "bg-blue/10" : "hover:bg-panel2"}>
                <td className="table-cell">
                  {pending && (
                    <input
                      type="checkbox"
                      aria-label={`選取申請 ${proposal.title}`}
                      checked={selected}
                      disabled={saving || (!selected && selectedIds.length >= 25)}
                      onChange={() => toggle(proposal.id)}
                    />
                  )}
                </td>
                <td className="table-cell text-dim">{proposal.id}</td>
                <td className="table-cell font-medium">{proposal.title}</td>
                <td className="table-cell text-dim">{proposal.author.username}</td>
                <td className="table-cell"><ProposalStatusBadge status={proposal.status} /></td>
                <td className="table-cell text-sm text-dim">{proposal.createdAt}</td>
                <td className="table-cell">
                  <Link href={`/admin/problems/proposals/${proposal.id}`} className="text-sm text-blue hover:underline">
                    審核
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}
