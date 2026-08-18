"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import DifficultyBadge from "@/components/DifficultyBadge";

export interface AdminProblemRow {
  id: number;
  order: number;
  title: string;
  difficulty: string;
  isPublic: boolean;
  testCaseCount: number;
  submissionCount: number;
}

export default function AdminProblemTable({
  problems,
}: {
  problems: AdminProblemRow[];
}) {
  const router = useRouter();
  const [rows, setRows] = useState(problems);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const dirty = rows.some((p, i) => p.id !== problems[i]?.id);

  function handleDrop(index: number) {
    setOverIndex(null);
    if (dragIndex === null || dragIndex === index) {
      setDragIndex(null);
      return;
    }
    const next = [...rows];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(index, 0, moved);
    setDragIndex(null);
    setRows(next);
  }

  function cancelReorder() {
    setRows(problems);
    setError("");
  }

  async function saveOrder() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/problems/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: rows.map((p) => p.id) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "儲存失敗");
        return;
      }
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      {dirty && (
        <div className="mb-3 flex flex-wrap items-center gap-3 rounded-md border border-blue/40 bg-panel2 px-4 py-3">
          <span className="text-sm text-dim">排序已異動，尚未儲存</span>
          <button className="btn-primary" onClick={saveOrder} disabled={saving}>
            {saving ? "儲存中…" : "儲存排序"}
          </button>
          <button
            className="btn-secondary"
            onClick={cancelReorder}
            disabled={saving}
          >
            取消
          </button>
          {error && <p className="text-sm text-[#ff6b6b]">{error}</p>}
        </div>
      )}
      <table className="w-full">
        <thead>
          <tr>
            <th className="table-head w-16">#</th>
            <th className="table-head">標題</th>
            <th className="table-head w-24">難度</th>
            <th className="table-head w-20 text-right">測資</th>
            <th className="table-head w-20 text-right">提交</th>
            <th className="table-head w-24">狀態</th>
            <th className="table-head w-20"></th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td
                colSpan={7}
                className="table-cell py-10 text-center text-mute"
              >
                還沒有題目，點右上角「新增題目」開始出題
              </td>
            </tr>
          )}
          {rows.map((p, i) => (
            <tr
              key={p.id}
              className={`hover:bg-panel2 ${dragIndex === i ? "opacity-40" : ""} ${
                overIndex === i && dragIndex !== null && dragIndex !== i
                  ? "border-t-2 border-t-blue"
                  : ""
              }`}
              draggable={!saving}
              onDragStart={() => setDragIndex(i)}
              onDragOver={(e) => {
                e.preventDefault();
                if (overIndex !== i) setOverIndex(i);
              }}
              onDragLeave={() =>
                setOverIndex((cur) => (cur === i ? null : cur))
              }
              onDrop={(e) => {
                e.preventDefault();
                handleDrop(i);
              }}
              onDragEnd={() => {
                setDragIndex(null);
                setOverIndex(null);
              }}
            >
              <td className="table-cell text-dim">
                <div className="flex items-center gap-2">
                  <span
                    className="mono cursor-grab select-none text-mute active:cursor-grabbing"
                    aria-hidden
                  >
                    ⠿
                  </span>
                  {i + 1}
                </div>
              </td>
              <td className="table-cell font-medium">
                <Link
                  href={`/problems/${p.order}`}
                  className="text-blue hover:underline"
                >
                  {p.title}
                </Link>
              </td>
              <td className="table-cell">
                <DifficultyBadge difficulty={p.difficulty} />
              </td>
              <td className="table-cell text-right text-dim">
                {p.testCaseCount}
              </td>
              <td className="table-cell text-right text-dim">
                {p.submissionCount}
              </td>
              <td className="table-cell text-sm text-dim">
                {p.isPublic ? "公開" : "未公開"}
              </td>
              <td className="table-cell">
                <Link
                  href={`/admin/problems/${p.id}/edit`}
                  className="text-sm text-blue hover:underline"
                >
                  編輯
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
