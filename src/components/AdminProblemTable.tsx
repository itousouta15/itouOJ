"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import DifficultyBadge from "@/components/DifficultyBadge";
import CategoryBadge from "@/components/CategoryBadge";
import TagBadge from "@/components/TagBadge";
import TagPicker, { type TagPickerTag } from "@/components/TagPicker";
import { problemHref } from "@/lib/problemTypes";

export interface AdminProblemRow {
  id: number;
  problemCode: string | null;
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
  tags: TagPickerTag[];
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
      <span className="flex h-4 w-4 items-center justify-center rounded border border-bd2 bg-panel transition-colors peer-checked:border-blue peer-checked:bg-blue peer-checked:[&>svg]:block peer-focus-visible:ring-2 peer-focus-visible:ring-blue/70">
        <svg
          viewBox="0 0 12 12"
          className="hidden h-3 w-3 text-white"
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
  tags,
}: {
  problems: AdminProblemRow[];
  type: "PROGRAMMING" | "RECOGNITION";
  users: { username: string; displayName: string | null }[];
  tags: TagPickerTag[];
}) {
  const router = useRouter();
  const [reorderedIds, setReorderedIds] = useState<number[] | null>(null);
  const byId = new Map(problems.map((problem) => [problem.id, problem]));
  const rows = reorderedIds
    ? reorderedIds.flatMap((id) => byId.has(id) ? [byId.get(id)!] : [])
    : problems;
  const rowIndexes = new Map(rows.map((row, index) => [row.id, index]));
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkAction, setBulkAction] = useState("publish");
  const [bulkAuthorUsername, setBulkAuthorUsername] = useState("");
  const [bulkTagIds, setBulkTagIds] = useState<number[]>([]);
  const [query, setQuery] = useState("");
  const [success, setSuccess] = useState("");

  const isRecognition = type === "RECOGNITION";
  const selected = new Set(selectedIds);
  const search = query.trim().toLocaleLowerCase();
  const visibleRows = rows.filter((row) => !search || row.title.toLocaleLowerCase().includes(search)
    || String(row.problemCode ?? row.order).toLocaleLowerCase().includes(search));
  const allSelected = visibleRows.length > 0 && visibleRows.slice(0, 500).every((row) => selected.has(row.id));
  const isTagAction = bulkAction === "addTags" || bulkAction === "removeTags";

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
    setReorderedIds(next.map((row) => row.id));
  }

  function cancelReorder() {
    setReorderedIds(null);
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
    setSelectedIds(allSelected ? [] : visibleRows.slice(0, 500).map((row) => row.id));
  }

  async function applyBulkEdit() {
    const [action, difficulty] = bulkAction.split(":");
    const author = users.find((user) => user.username === bulkAuthorUsername);
    if (isTagAction && !bulkTagIds.length) {
      setError("請選擇標籤");
      return;
    }
    if (action === "setAuthor" && !author) {
      setError("請選擇出題者");
      return;
    }
    const label = action === "addTags" ? "新增選取的標籤"
      : action === "removeTags" ? "移除選取的標籤"
      : action === "clearTags" ? "清空所有標籤"
      :
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
    setSuccess("");
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
          ...(isTagAction ? { tagIds: bulkTagIds } : {}),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "批次更新失敗");
        return;
      }
      setSelectedIds([]);
      setBulkTagIds([]);
      setSuccess(`已更新 ${data.updated} 題`);
      router.refresh();
    } catch {
      setError("批次更新失敗，請稍後再試");
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
      setReorderedIds(null);
    } catch {
      setError("儲存失敗，請稍後再試");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 p-4">
        <input
          type="search"
          className="input min-w-0 flex-1"
          placeholder="搜尋題號或題目名稱"
          aria-label="搜尋管理題目的題號或名稱"
          value={query}
          disabled={saving}
          onChange={(event) => {
            setQuery(event.target.value);
            setSelectedIds([]);
            setError("");
          }}
        />
        <span className="text-sm text-dim">{visibleRows.length} / {rows.length} 題</span>
      </div>
      {success && <p className="mb-3 px-4 text-sm text-dim" role="status">{success}</p>}
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
          <span className="text-sm text-dim">已選取 {selectedIds.length} 題（每次最多 500 題）</span>
          <select
            className="input w-auto py-1.5 text-sm"
            value={bulkAction}
            onChange={(event) => {
              setBulkAction(event.target.value);
              setBulkTagIds([]);
              setError("");
            }}
            disabled={saving}
            aria-label="批次操作"
          >
            <option value="publish">設為公開</option>
            <option value="unpublish">設為未公開</option>
            <option value="addTags">新增標籤</option>
            <option value="removeTags">移除標籤</option>
            <option value="clearTags">清空標籤</option>
            {!isRecognition && (
              <>
                <option value="setDifficulty:easy">難度設為簡單</option>
                <option value="setDifficulty:medium">難度設為中等</option>
                <option value="setDifficulty:hard">難度設為困難</option>
                <option value="setAuthor">設定出題者</option>
              </>
            )}
          </select>
          {isTagAction && (
            <div className="w-full">
              <p className="mb-2 text-sm text-dim">
                {bulkAction === "addTags" ? "新增選取的標籤，保留題目原有標籤。" : "只移除選取的標籤，保留其他標籤。"}
              </p>
              <TagPicker
                tags={tags}
                selectedIds={bulkTagIds}
                disabled={saving}
                onToggle={(id) => setBulkTagIds((current) => current.includes(id)
                  ? current.filter((tagId) => tagId !== id)
                  : [...current, id])}
              />
            </div>
          )}
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
          <button className="btn-primary" onClick={applyBulkEdit} disabled={saving || dirty || (isTagAction && !bulkTagIds.length)}>
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
          {dirty && <p className="text-sm text-dim">請先儲存或取消排序，再套用批次操作。</p>}
        </div>
      )}
      <table className="w-full">
        <thead>
          <tr>
            <th className="table-head w-10">
              <SelectionCheckbox
                checked={allSelected}
                disabled={saving || visibleRows.length === 0}
                label="選取搜尋結果（最多 500 題）"
                onChange={toggleAllSelected}
              />
            </th>
            <th className="table-head w-16">代碼</th>
            <th className="table-head">標題</th>
            <th className="table-head">標籤</th>
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
          {visibleRows.length === 0 && (
            <tr>
              <td
                colSpan={10}
                className="table-cell py-10 text-center text-mute"
              >
                {search ? "找不到符合搜尋條件的題目" : isRecognition
                  ? "還沒有識別題，點右上角「新增題目」再切到識別題即可建立"
                  : "還沒有題目，點右上角「新增題目」開始出題"}
              </td>
            </tr>
          )}
          {visibleRows.map((p) => {
            const i = rowIndexes.get(p.id)!;
            return (
            <tr
              key={p.id}
              className={`${selected.has(p.id) ? "bg-blue/10" : "hover:bg-panel2"} ${dragIndex === i ? "opacity-40" : ""} ${
                overIndex === i && dragIndex !== null && dragIndex !== i
                  ? "border-t-2 border-t-blue"
                  : ""
              }`}
              draggable={!saving && selectedIds.length === 0 && !search}
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
                  disabled={saving || (!selected.has(p.id) && selectedIds.length >= 500)}
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
                  {p.problemCode ?? p.order}
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
              <td className="table-cell">
                <div className="flex flex-wrap gap-1.5">
                  {p.tags.map((tag) => <TagBadge key={tag.id} name={tag.name} />)}
                </div>
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
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
