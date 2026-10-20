"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { REPORT_STATUSES } from "@/lib/reportSchema";

export default function ReportStatusForm({
  id,
  status,
  adminReply,
  updatedAt,
}: {
  id: number;
  status: string;
  adminReply: string;
  updatedAt: string;
}) {
  const router = useRouter();
  const [nextStatus, setNextStatus] = useState(status);
  const [reply, setReply] = useState(adminReply);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess(false);
    try {
      const response = await fetch(`/api/admin/reports/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: nextStatus,
          adminReply: reply,
          expectedUpdatedAt: updatedAt,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "更新失敗");
        return;
      }
      setSuccess(true);
      router.refresh();
    } catch {
      setError("更新失敗，請檢查連線後再試");
    } finally {
      setSaving(false);
    }
  }
  return (
    <form onSubmit={save} className="card space-y-4 p-4 sm:p-6">
      <h2 className="section-title">管理員處理</h2>
      <fieldset disabled={saving} className="space-y-4">
        <label className="block text-sm">
          處理狀態
          <select
            className="input mt-2 w-full"
            value={nextStatus}
            onChange={(e) => setNextStatus(e.target.value)}
          >
            {Object.entries(REPORT_STATUSES).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          給回報者的處理回覆
          <textarea
            className="input mt-2 min-h-32 w-full"
            maxLength={3000}
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="修正內容、補充說明或需要更多資料的地方（回報者看得到）"
          />
        </label>
        <button type="submit" className="btn-primary">
          {saving ? "儲存中…" : "更新回報"}
        </button>
      </fieldset>
      {error && (
        <div className="space-y-2">
          <p role="alert" className="text-sm text-[#ff6b6b]">
            {error}
          </p>
          <button
            type="button"
            className="btn-secondary"
            disabled={saving}
            onClick={() => router.refresh()}
          >
            重新整理
          </button>
        </div>
      )}
      {success && (
        <p role="status" className="text-sm text-green">
          已更新
        </p>
      )}
    </form>
  );
}
