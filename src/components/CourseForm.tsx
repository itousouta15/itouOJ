"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ProblemOption {
  id: number;
  problemCode: string | null;
  title: string;
  isPublic: boolean;
  type: string;
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
  const [problemSearch, setProblemSearch] = useState("");

  const normalizedProblemSearch = problemSearch.trim().toLocaleLowerCase();
  const visibleProblems = problems.filter((problem) => {
    if (!normalizedProblemSearch) return true;
    return (
      problem.problemCode?.toLocaleLowerCase().includes(normalizedProblemSearch) ||
      problem.title.toLocaleLowerCase().includes(normalizedProblemSearch) ||
      String(problem.id).includes(normalizedProblemSearch)
    );
  });

  function toggleProblem(id: number) {
    setForm((f) => ({
      ...f,
      problemIds: f.problemIds.includes(id)
        ? f.problemIds.filter((p) => p !== id)
        : [...f.problemIds, id],
    }));
  }

  function moveProblem(index: number, offset: number) {
    setForm((f) => {
      const problemIds = [...f.problemIds];
      const destination = index + offset;
      if (destination < 0 || destination >= problemIds.length) return f;
      [problemIds[index], problemIds[destination]] = [problemIds[destination], problemIds[index]];
      return { ...f, problemIds };
    });
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
        {form.problemIds.length > 0 && (
          <div className="mb-4">
            <p className="mb-2 text-sm text-dim">已選題目順序：使用上下按鈕調整，儲存課程後生效。新勾選的題目會加入最後。</p>
            <ol className="max-h-80 space-y-2 overflow-y-auto rounded-lg border border-bd bg-inset p-2">
              {form.problemIds.map((id, index) => {
                const problem = problems.find((item) => item.id === id);
                return (
                  <li key={id} className="flex items-center gap-2 rounded-md border border-bd p-2 text-sm">
                    <span className="mono w-6 shrink-0 text-mute">{index + 1}</span>
                    <span className="min-w-0 flex-1">
                      <span className="mono mr-2 text-xs text-mute">{problem?.problemCode ?? `#${id}`}</span>
                      {problem?.title ?? "題目不存在"}
                    </span>
                    <button type="button" className="btn-secondary px-2 py-1" disabled={saving || index === 0} aria-label={`將第 ${index + 1} 題上移`} onClick={() => moveProblem(index, -1)}>↑</button>
                    <button type="button" className="btn-secondary px-2 py-1" disabled={saving || index === form.problemIds.length - 1} aria-label={`將第 ${index + 1} 題下移`} onClick={() => moveProblem(index, 1)}>↓</button>
                    <button type="button" className="text-xs text-[#ff6b6b]" disabled={saving} onClick={() => toggleProblem(id)} aria-label={`移除第 ${index + 1} 題`}>移除</button>
                  </li>
                );
              })}
            </ol>
          </div>
        )}
        <input
          type="search"
          className="input mb-3"
          value={problemSearch}
          onChange={(event) => setProblemSearch(event.target.value)}
          placeholder="搜尋題號或題目名稱"
          aria-label="搜尋課程題目的題號或名稱"
        />
        {problems.length === 0 ? (
          <p className="text-sm text-mute">還沒有題目可以加入</p>
        ) : visibleProblems.length === 0 ? (
          <p className="rounded-lg border border-bd bg-inset p-4 text-sm text-mute">
            找不到符合的題目
          </p>
        ) : (
          <div className="max-h-72 space-y-1 overflow-y-auto rounded-lg border border-bd bg-inset p-2">
            {visibleProblems.map((p) => (
              <label
                key={p.id}
                className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-panel2"
              >
                <input
                  type="checkbox"
                  checked={form.problemIds.includes(p.id)}
                  onChange={() => toggleProblem(p.id)}
                />
                <span className="mono min-w-14 text-xs text-mute">
                  {p.problemCode ?? `#${p.id}`}
                </span>
                <span className="flex-1 truncate">{p.title}</span>
                {p.type === "RECOGNITION" && (
                  <span className="vbadge vbadge-blue">選擇題</span>
                )}
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
