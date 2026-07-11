"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ProblemOption {
  id: number;
  title: string;
  isPublic: boolean;
}

export interface CourseFormInitial {
  id?: number;
  title: string;
  description: string;
  isPublic: boolean;
  joinCode: string;
  problemIds: number[];
}

const EMPTY: CourseFormInitial = {
  title: "",
  description: "",
  isPublic: true,
  joinCode: "",
  problemIds: [],
};

// 產生好認的隨機代碼（去掉 0/O/1/I 這類容易看錯的字元）
function randomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from(
    { length: 6 },
    () => chars[Math.floor(Math.random() * chars.length)]
  ).join("");
}

export default function CourseForm({
  problems,
  initial,
}: {
  problems: ProblemOption[];
  initial?: CourseFormInitial;
}) {
  const router = useRouter();
  const editing = initial?.id != null;
  const [form, setForm] = useState<CourseFormInitial>(initial ?? EMPTY);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function toggleProblem(id: number) {
    setForm((f) => ({
      ...f,
      problemIds: f.problemIds.includes(id)
        ? f.problemIds.filter((p) => p !== id)
        : [...f.problemIds, id].sort((a, b) => a - b),
    }));
  }

  async function save() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(
        editing ? `/api/admin/courses/${initial!.id}` : "/api/admin/courses",
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
      router.push("/admin/courses");
      router.refresh();
    } catch {
      setError("儲存失敗，請稍後再試");
      setSaving(false);
    }
  }

  async function remove() {
    if (!confirm("確定要刪除這門課程嗎？成員資料會一併刪除（不影響題目與紀錄）。"))
      return;
    await fetch(`/api/admin/courses/${initial!.id}`, { method: "DELETE" });
    router.push("/admin/courses");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="card space-y-4 p-6">
        <div>
          <label className="mb-1 block text-sm font-medium">課程標題</label>
          <input
            className="input"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="例如：基礎入門"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">課程說明</label>
          <textarea
            className="input min-h-28 resize-y"
            value={form.description}
            onChange={(e) =>
              setForm((f) => ({ ...f, description: e.target.value }))
            }
            placeholder="這門課在練什麼、適合誰…"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">加入代碼</label>
          <div className="flex gap-2">
            <input
              className="input mono w-40"
              value={form.joinCode}
              onChange={(e) =>
                setForm((f) => ({ ...f, joinCode: e.target.value }))
              }
              placeholder="留空 = 開放加入"
              maxLength={32}
            />
            <button
              type="button"
              className="btn-secondary"
              onClick={() =>
                setForm((f) => ({ ...f, joinCode: randomCode() }))
              }
            >
              隨機產生
            </button>
          </div>
          <p className="mt-1 text-xs text-mute">
            設定後，成員要輸入這組代碼才能加入課程；留空則任何人都能直接加入。
          </p>
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.isPublic}
            onChange={(e) =>
              setForm((f) => ({ ...f, isPublic: e.target.checked }))
            }
          />
          公開課程（未公開時只有管理員看得到）
        </label>
      </div>

      <div className="card p-6">
        <p className="mb-3 text-sm font-medium">
          課程題目
          <span className="mono ml-2 text-xs text-mute">
            已選 {form.problemIds.length} 題
          </span>
        </p>
        {problems.length === 0 ? (
          <p className="text-sm text-mute">還沒有題目可以加入</p>
        ) : (
          <div className="max-h-72 space-y-1 overflow-y-auto rounded-lg border border-bd bg-inset p-2">
            {problems.map((p) => (
              <label
                key={p.id}
                className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-panel2"
              >
                <input
                  type="checkbox"
                  checked={form.problemIds.includes(p.id)}
                  onChange={() => toggleProblem(p.id)}
                />
                <span className="mono w-10 text-xs text-mute">#{p.id}</span>
                <span className="flex-1 truncate">{p.title}</span>
                {!p.isPublic && (
                  <span className="text-xs text-mute">（未公開）</span>
                )}
              </label>
            ))}
          </div>
        )}
      </div>

      {error && <p className="text-sm text-[#ff6b6b]">{error}</p>}
      <div className="flex items-center gap-3">
        <button className="btn-primary" onClick={save} disabled={saving}>
          {saving ? "儲存中…" : editing ? "儲存變更" : "建立課程"}
        </button>
        {editing && (
          <button className="btn-danger" onClick={remove}>
            刪除課程
          </button>
        )}
      </div>
    </div>
  );
}
