"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export interface AdminTagRow {
  id: number;
  name: string;
  problemCount: number;
}

export default function AdminTagList({ tags }: { tags: AdminTagRow[] }) {
  const router = useRouter();
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function addTag() {
    if (!newName.trim()) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "新增失敗");
        return;
      }
      setNewName("");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function renameTag(id: number) {
    if (!editingName.trim()) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/tags/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editingName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "更新失敗");
        return;
      }
      setEditingId(null);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function removeTag(tag: AdminTagRow) {
    const extra =
      tag.problemCount > 0
        ? `\n（目前有 ${tag.problemCount} 題掛著這個標籤，一併會被移除）`
        : "";
    if (!confirm(`確定要刪除標籤「${tag.name}」嗎？${extra}`)) return;
    await fetch(`/api/admin/tags/${tag.id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="card flex flex-wrap items-center gap-3 p-4">
        <input
          className="input max-w-xs"
          placeholder="新標籤名稱，例如：字串"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTag()}
        />
        <button className="btn-primary" onClick={addTag} disabled={saving}>
          ＋ 新增標籤
        </button>
        {error && <p className="text-sm text-[#ff6b6b]">{error}</p>}
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="table-head">標籤</th>
              <th className="table-head w-24 text-right">題目數</th>
              <th className="table-head w-40"></th>
            </tr>
          </thead>
          <tbody>
            {tags.length === 0 && (
              <tr>
                <td colSpan={3} className="table-cell py-10 text-center text-mute">
                  還沒有標籤，上面新增一個開始用
                </td>
              </tr>
            )}
            {tags.map((tag) => (
              <tr key={tag.id} className="hover:bg-panel2">
                <td className="table-cell">
                  {editingId === tag.id ? (
                    <input
                      className="input"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && renameTag(tag.id)}
                      autoFocus
                    />
                  ) : (
                    <span className="vbadge vbadge-blue">{tag.name}</span>
                  )}
                </td>
                <td className="table-cell text-right text-dim">
                  {tag.problemCount}
                </td>
                <td className="table-cell text-right">
                  {editingId === tag.id ? (
                    <div className="flex justify-end gap-3 text-sm">
                      <button
                        className="text-blue hover:underline"
                        onClick={() => renameTag(tag.id)}
                        disabled={saving}
                      >
                        儲存
                      </button>
                      <button
                        className="text-mute hover:underline"
                        onClick={() => setEditingId(null)}
                      >
                        取消
                      </button>
                    </div>
                  ) : (
                    <div className="flex justify-end gap-3 text-sm">
                      <button
                        className="text-blue hover:underline"
                        onClick={() => {
                          setEditingId(tag.id);
                          setEditingName(tag.name);
                        }}
                      >
                        重新命名
                      </button>
                      <button
                        className="text-[#ff6b6b] hover:underline"
                        onClick={() => removeTag(tag)}
                      >
                        刪除
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
