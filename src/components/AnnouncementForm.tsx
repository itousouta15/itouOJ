"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export interface AnnouncementFormData {
  id?: number;
  title: string;
  content: string;
  isPinned: boolean;
}

const EMPTY: AnnouncementFormData = {
  title: "",
  content: "",
  isPinned: false,
};

export default function AnnouncementForm({
  initial,
}: {
  initial?: AnnouncementFormData;
}) {
  const router = useRouter();
  const editing = initial?.id != null;
  const [form, setForm] = useState<AnnouncementFormData>(initial ?? EMPTY);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function set<K extends keyof AnnouncementFormData>(
    key: K,
    value: AnnouncementFormData[K]
  ) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function save() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(
        editing
          ? `/api/admin/announcements/${initial!.id}`
          : "/api/admin/announcements",
        {
          method: editing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, id: undefined }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "儲存失敗");
        setSaving(false);
        return;
      }
      router.push("/admin/announcements");
      router.refresh();
    } catch {
      setError("儲存失敗，請稍後再試");
      setSaving(false);
    }
  }

  async function remove() {
    if (!confirm("確定要刪除這則公告嗎？")) return;
    await fetch(`/api/admin/announcements/${initial!.id}`, {
      method: "DELETE",
    });
    router.push("/admin/announcements");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="card space-y-4 p-6">
        <div>
          <label className="mb-1 block text-sm font-medium">標題</label>
          <input
            className="input"
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="例如：7/20 系統維護公告"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">
            內容（Markdown，支援 $...$ 數學式）
          </label>
          <textarea
            className="input h-48 font-mono text-[13px]"
            value={form.content}
            onChange={(e) => set("content", e.target.value)}
          />
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.isPinned}
            onChange={(e) => set("isPinned", e.target.checked)}
          />
          置頂（固定顯示在公告列表最上方）
        </label>
      </div>

      {error && <p className="text-sm text-[#ff6b6b]">{error}</p>}
      <div className="flex items-center gap-3">
        <button className="btn-primary" onClick={save} disabled={saving}>
          {saving ? "儲存中…" : editing ? "儲存變更" : "發布公告"}
        </button>
        {editing && (
          <button className="btn-danger" onClick={remove}>
            刪除公告
          </button>
        )}
      </div>
    </div>
  );
}
