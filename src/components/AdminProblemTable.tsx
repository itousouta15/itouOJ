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
  author: { username: string; displayName: string | null } | null;
}

function SelectionCheckbox({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  disabled: boolean;
  label: string;
}) {
  return (
    <label
      className={`inline-flex h-5 w-5 items-center justify-center ${
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
      }`}
      title={label}
    >
      <input
        type="checkbox"
        className="peer sr-only"
        aria-label={label}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
      />
      <span className="flex h-4 w-4 items-center justify-center rounded border border-bd2 bg-panel transition-colors peer-checked:border-blue peer-checked:bg-blue peer-focus-visible:ring-2 peer-focus-visible:ring-blue/70">
        <svg
          viewBox="0 0 12 12"
          className="hidden h-3 w-3 text-white peer-checked:block"
          aria-hidden
        >
          <path
            d="m2.5 6 2.1 2.1L9.5 3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </label>
  );
}

export default function AdminProblemTable({
  problems,
  type,
  users,
}: {
  problems: AdminProblemRow[];
  type: "PROGRAMMING" | "RECOGNITION";
  users: { username: string; displayName: string | null }[];
}) {
  const router = useRouter();
  const [rows, setRows] = useState(problems);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkAction, setBulkAction] = useState("publish");
  const [bulkAuthorUsername, setBulkAuthorUsername] = useState("");

  const isRecognition = type === "RECOGNITION";
  const selected = new Set(selectedIds);
  const allSelected = rows.length > 0 && rows.every((row) => selected.has(row.id));

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

  function toggleSelected(id: number) {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((selectedId) => selectedId !== id)
        : [...current, id],
    );
  }

  function toggleAllSelected() {
    setSelectedIds(allSelected ? [] : rows.map((row) => row.id));
  }

  async function applyBulkEdit() {
    const [action, difficulty] = bulkAction.split(":");
    const author = users.find((user) => user.username === bulkAuthorUsername);
    if (action === "setAuthor" && !author) {
      setError("請選擇出題者");
      return;
    }
    const label =
      action === "publish"
        ? "設為公開"
        : action === "unpublish"
          ? "設為未公開"
          : action === "setAuthor"
            ? `的出題者設為${author!.displayName || author!.username}`
            : `設為${difficulty === "easy" ? "簡單" : difficulty === "medium" ? "中等" : "困難"}`;
    if (!confirm(`確定要將 ${selectedIds.length} 題${label}嗎？`)) return;

    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/problems/bulk", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: selectedIds,
          type,
          action,
          ...(difficulty ? { difficulty } : {}),
          ...(action === "setAuthor" ? { authorUsername: bulkAuthorUsername } : {}),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "批次更新失敗");
        return;
      }
      setSelectedIds([]);
      router.refresh();
    } finally {
      setSaving(false);
    }
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
      {selectedIds.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-3 rounded-md border border-blue/40 bg-panel2 px-4 py-3">
          <span className="text-sm text-dim">已選取 {selectedIds.length} 題</span>
          <select
            className="input w-auto py-1.5 text-sm"
            value={bulkAction}
            onChange={(event) => setBulkAction(event.target.value)}
            disabled={saving}
          >
            <option value="publish">設為公開</option>
            <option value="unpublish">設為未公開</option>
            {!isRecognition && (
              <>
                <option value="setDifficulty:easy">難度設為簡單</option>
                <option value="setDifficulty:medium">難度設為中等</option>
                <option value="setDifficulty:hard">難度設為困難</option>
                <option value="setAuthor">設定出題者</option>
              </>
            )}
          </select>
          {bulkAction === "setAuthor" && (
            <select
              className="input w-auto py-1.5 text-sm"
              value={bulkAuthorUsername}
              onChange={(event) => setBulkAuthorUsername(event.target.value)}
              disabled={saving}
            >
              <option value="">選擇出題者</option>
              {users.map((user) => (
                <option key={user.username} value={user.username}>
                  {user.displayName
                    ? `${user.displayName}（@${user.username}）`
                    : user.username}
                </option>
              ))}
            </select>
          )}
          <button className="btn-primary" onClick={applyBulkEdit} disabled={saving}>
            {saving ? "更新中…" : "套用"}
          </button>
          <button
            className="btn-secondary"
            onClick={() => setSelectedIds([])}
            disabled={saving}
          >
            取消選取
          </button>
          {error && <p className="text-sm text-[#ff6b6b]">{error}</p>}
        </div>
      )}
      <table className="w-full">
        <thead>
          <tr>
            <th className="table-head w-10">
              <SelectionCheckbox
                checked={allSelected}
                disabled={saving || rows.length === 0}
                label="選取全部題目"
                onChange={toggleAllSelected}
              />
            </th>
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
                  <th className="table-head w-36">出題者</th>
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
                colSpan={9}
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
              className={`${selected.has(p.id) ? "bg-blue/10" : "hover:bg-panel2"} ${dragIndex === i ? "opacity-40" : ""} ${
                overIndex === i && dragIndex !== null && dragIndex !== i
                  ? "border-t-2 border-t-blue"
                  : ""
              }`}
              draggable={!saving && selectedIds.length === 0}
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
              <td className="table-cell">
                <SelectionCheckbox
                  checked={selected.has(p.id)}
                  disabled={saving}
                  label={`選取 ${p.title}`}
                  onChange={() => toggleSelected(p.id)}
                />
              </td>
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
                  <td className="table-cell text-sm text-dim">
                    {p.author
                      ? p.author.displayName || `@${p.author.username}`
                      : "—"}
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
