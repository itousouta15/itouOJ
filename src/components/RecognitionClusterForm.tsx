"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import CategoryBadge from "@/components/CategoryBadge";
import TagPicker from "@/components/TagPicker";

interface ProblemOption {
  id: number;
  title: string;
  isPublic: boolean;
  category: string | null;
  clusterId: number | null;
  clusterTitle: string | null;
}

export interface RecognitionClusterFormInitial {
  id?: number;
  title: string;
  description: string;
  isPublic: boolean;
  problemIds: number[];
  tagIds: number[];
}

export interface AvailableTag {
  id: number;
  name: string;
}

const EMPTY: RecognitionClusterFormInitial = {
  title: "",
  description: "",
  isPublic: true,
  problemIds: [],
  tagIds: [],
};

export default function RecognitionClusterForm({
  problems,
  availableTags = [],
  initial,
}: {
  problems: ProblemOption[];
  availableTags?: AvailableTag[];
  initial?: RecognitionClusterFormInitial;
}) {
  const router = useRouter();
  const editing = initial?.id != null;
  const [form, setForm] = useState<RecognitionClusterFormInitial>(
    initial ?? EMPTY
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("");
  const [clusterFilter, setClusterFilter] = useState("all");

  const clusterOptions = useMemo(() => {
    const map = new Map<number, string>();
    for (const p of problems) {
      if (p.clusterId != null && p.clusterTitle) {
        map.set(p.clusterId, p.clusterTitle);
      }
    }
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [problems]);

  function toggleProblem(id: number) {
    setForm((f) => ({
      ...f,
      problemIds: f.problemIds.includes(id)
        ? f.problemIds.filter((p) => p !== id)
        : [...f.problemIds, id],
    }));
  }

  function toggleTag(id: number) {
    setForm((f) => ({
      ...f,
      tagIds: f.tagIds.includes(id)
        ? f.tagIds.filter((t) => t !== id)
        : [...f.tagIds, id],
    }));
  }

  const keyword = filter.trim().toLowerCase();
  const visible = problems.filter((p) => {
    if (keyword && !p.title.toLowerCase().includes(keyword)) return false;
    if (clusterFilter === "none" && p.clusterId != null) return false;
    if (clusterFilter.startsWith("id:")) {
      if (p.clusterId !== Number(clusterFilter.slice(3))) return false;
    }
    return true;
  });

  function selectVisible() {
    setForm((f) => ({
      ...f,
      problemIds: [...new Set([...f.problemIds, ...visible.map((p) => p.id)])],
    }));
  }

  async function save() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(
        editing
          ? `/api/admin/recognition-clusters/${initial!.id}`
          : "/api/admin/recognition-clusters",
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
      router.push("/admin/recognition");
      router.refresh();
    } catch {
      setError("儲存失敗，請稍後再試");
      setSaving(false);
    }
  }

  async function remove() {
    if (
      !confirm(
        "確定要刪除這個群集嗎？群集裡的題目會保留，變成未分類（不影響作答紀錄）。"
      )
    )
      return;
    await fetch(`/api/admin/recognition-clusters/${initial!.id}`, {
      method: "DELETE",
    });
    router.push("/admin/recognition");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="card space-y-4 p-6">
        <div>
          <label className="mb-1 block text-sm font-medium">群集名稱</label>
          <input
            className="input"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="例如：APCS 2021/01"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">說明</label>
          <textarea
            className="input min-h-24 resize-y"
            value={form.description}
            onChange={(e) =>
              setForm((f) => ({ ...f, description: e.target.value }))
            }
            placeholder="這個群集是什麼、適合什麼時候練…"
          />
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.isPublic}
            onChange={(e) =>
              setForm((f) => ({ ...f, isPublic: e.target.checked }))
            }
          />
          公開群集（未公開時只有管理員看得到）
        </label>
        <div>
          <label className="mb-1 block text-sm font-medium">標籤</label>
          <TagPicker
            tags={availableTags}
            selectedIds={form.tagIds}
            onToggle={toggleTag}
          />
        </div>
      </div>

      <div className="card p-6">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <p className="text-sm font-medium">群集題目</p>
          <span className="mono text-xs text-mute">
            已選 {form.problemIds.length} 題
          </span>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <input
              className="input w-52"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="搜尋題目…"
            />
            <select
              className="input w-44"
              value={clusterFilter}
              onChange={(e) => setClusterFilter(e.target.value)}
            >
              <option value="all">全部群集</option>
              <option value="none">未分類</option>
              {clusterOptions.map(([id, title]) => (
                <option key={id} value={`id:${id}`}>
                  {title}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-2 flex flex-wrap items-center gap-3 text-xs">
          <span className="text-mute">
            顯示 {visible.length} 題
            {keyword || clusterFilter !== "all" ? "（已篩選）" : ""}
          </span>
          <button
            type="button"
            className="text-blue hover:underline"
            onClick={selectVisible}
          >
            全選顯示中
          </button>
          {form.problemIds.length > 0 && (
            <button
              type="button"
              className="text-[#ff6b6b] hover:underline"
              onClick={() => setForm((f) => ({ ...f, problemIds: [] }))}
            >
              清除選取
            </button>
          )}
        </div>

        {problems.length === 0 ? (
          <p className="text-sm text-mute">
            還沒有識別題可以加入，先到「題目管理 → 識別題」建立題目
          </p>
        ) : (
          <div className="max-h-[60vh] overflow-y-auto rounded-lg border border-bd bg-inset p-2">
            {visible.length === 0 ? (
              <p className="px-3 py-2 text-sm text-mute">沒有符合的題目</p>
            ) : (
              <div className="grid gap-1 sm:grid-cols-2 xl:grid-cols-3">
                {visible.map((p) => {
                  const checked = form.problemIds.includes(p.id);
                  return (
                    <label
                      key={p.id}
                      className={`flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-panel2 ${
                        checked ? "bg-[rgba(76,175,80,0.10)]" : ""
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleProblem(p.id)}
                      />
                      <span
                        className="min-w-0 flex-1 truncate"
                        title={p.title}
                      >
                        {p.title}
                      </span>
                      <CategoryBadge category={p.category} />
                      <span
                        className="max-w-24 shrink-0 truncate text-xs text-mute"
                        title={p.clusterTitle ?? "未分類"}
                      >
                        {p.clusterTitle ?? "未分類"}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        )}
        <p className="mt-2 text-xs text-mute">
          一題同時只能屬於一個群集；勾選已經在別的群集的題目會把它移過來。
        </p>
      </div>

      {error && <p className="text-sm text-[#ff6b6b]">{error}</p>}
      <div className="flex items-center gap-3">
        <button className="btn-primary" onClick={save} disabled={saving}>
          {saving ? "儲存中…" : editing ? "儲存變更" : "建立群集"}
        </button>
        {editing && (
          <button className="btn-danger" onClick={remove}>
            刪除群集
          </button>
        )}
      </div>
    </div>
  );
}
