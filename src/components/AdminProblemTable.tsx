"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import DifficultyBadge from "@/components/DifficultyBadge";
import CategoryBadge from "@/components/CategoryBadge";
import { problemHref } from "@/lib/problemTypes";

export interface AdminProblemRow {
  id: number;
  order: number;
  type: string;
  title: string;
  difficulty: string;
  isPublic: boolean;
  testCaseCount: number;
  submissionCount: number;
  clusterTitle: string | null;
  paper: string | null;
  sourceNumber: number | null;
  category: string | null;
}

export default function AdminProblemTable({
  problems,
  type,
}: {
  problems: AdminProblemRow[];
  type: "PROGRAMMING" | "RECOGNITION";
}) {
  const router = useRouter();
  const [rows, setRows] = useState(problems);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // 切換題型分頁時，由外層 <AdminProblemTable key={type}> 重新掛載，
  // rows 會直接拿到新題型的資料，不需要在 effect 裡同步 state。

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
        body: JSON.stringify({ ids: rows.map((p) => p.id), type }),
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

  const isRecognition = type === "RECOGNITION";

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
            {isRecognition ? (
              <>
                <th className="table-head w-36">群集</th>
                <th className="table-head w-24">卷別</th>
                <th className="table-head w-20">原題號</th>
                <th className="table-head w-20">分類</th>
              </>
            ) : (
              <>
                <th className="table-head w-24">難度</th>
                <th className="table-head w-20 text-right">測資</th>
                <th className="table-head w-20 text-right">提交</th>
              </>
            )}
            <th className="table-head w-24">狀態</th>
            <th className="table-head w-20"></th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td
                colSpan={isRecognition ? 8 : 8}
                className="table-cell py-10 text-center text-mute"
              >
                {isRecognition
                  ? "還沒有識別題，點右上角「新增題目」再切到識別題即可建立"
                  : "還沒有題目，點右上角「新增題目」開始出題"}
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
                  href={problemHref(p)}
                  className="text-blue hover:underline"
                >
                  {p.title}
                </Link>
              </td>
              {isRecognition ? (
                <>
                  <td className="table-cell text-dim">
                    {p.clusterTitle ?? "未分類"}
                  </td>
                  <td className="table-cell text-dim">{p.paper ?? "—"}</td>
                  <td className="table-cell text-dim">{p.sourceNumber ?? "—"}</td>
                  <td className="table-cell">
                    <CategoryBadge category={p.category} />
                  </td>
                </>
              ) : (
                <>
                  <td className="table-cell">
                    <DifficultyBadge difficulty={p.difficulty} />
                  </td>
                  <td className="table-cell text-right text-dim">
                    {p.testCaseCount}
                  </td>
                  <td className="table-cell text-right text-dim">
                    {p.submissionCount}
                  </td>
                </>
              )}
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
