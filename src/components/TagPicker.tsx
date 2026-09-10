"use client";

import { useState } from "react";

export interface TagPickerTag {
  id: number;
  name: string;
}

// 標籤選擇器（題目表單、群集表單共用）：點 pill 切換選取，
// 也可以直接在這裡新增標籤（建立後自動選取），不用另外開標籤管理頁。
export default function TagPicker({
  tags: initialTags,
  selectedIds,
  onToggle,
}: {
  tags: TagPickerTag[];
  selectedIds: number[];
  onToggle: (id: number) => void;
}) {
  const [tags, setTags] = useState(initialTags);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function closeAdd() {
    setAdding(false);
    setNewName("");
    setError("");
  }

  async function addTag() {
    const name = newName.trim();
    if (!name || saving) return;
    setError("");

    // 已經有同名標籤就直接選它，不打 API
    const existing = tags.find((t) => t.name === name);
    if (existing) {
      if (!selectedIds.includes(existing.id)) onToggle(existing.id);
      closeAdd();
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "新增失敗");
        return;
      }
      const created: TagPickerTag = { id: data.id, name: data.name };
      setTags((prev) =>
        [...prev, created].sort((a, b) => a.name.localeCompare(b.name))
      );
      onToggle(created.id);
      closeAdd();
    } catch {
      setError("新增失敗，請稍後再試");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {tags.map((tag) => {
          const active = selectedIds.includes(tag.id);
          return (
            <button
              key={tag.id}
              type="button"
              className={`pill ${active ? "pill-active" : ""}`}
              onClick={() => onToggle(tag.id)}
            >
              {tag.name}
            </button>
          );
        })}
        {!adding && (
          <button
            type="button"
            className="text-sm text-blue hover:underline"
            onClick={() => setAdding(true)}
          >
            ＋ 新增標籤
          </button>
        )}
      </div>
      {adding && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <input
            className="input w-44"
            value={newName}
            autoFocus
            maxLength={30}
            placeholder="新標籤名稱"
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTag();
              }
              if (e.key === "Escape") closeAdd();
            }}
          />
          <button
            type="button"
            className="btn-primary"
            onClick={addTag}
            disabled={saving || !newName.trim()}
          >
            {saving ? "新增中…" : "新增"}
          </button>
          <button type="button" className="btn-secondary" onClick={closeAdd}>
            取消
          </button>
          {error && <p className="text-sm text-[#ff6b6b]">{error}</p>}
        </div>
      )}
    </div>
  );
}
