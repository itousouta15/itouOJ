"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface TestCaseInput {
  input: string;
  output: string;
  isSample: boolean;
  subtaskIndex: number | null;
}

interface SubtaskInput {
  points: number;
  checkMode: "full" | "firstLine";
}

export interface ProblemFormData {
  id?: number;
  title: string;
  statement: string;
  difficulty: string;
  timeLimitMs: number;
  memoryLimitMb: number;
  isPublic: boolean;
  subtasks: SubtaskInput[];
  testCases: TestCaseInput[];
}

const EMPTY: ProblemFormData = {
  title: "",
  statement:
    "## 題目描述\n\n\n\n## 輸入格式\n\n\n\n## 輸出格式\n\n",
  difficulty: "medium",
  timeLimitMs: 1000,
  memoryLimitMb: 256,
  isPublic: true,
  subtasks: [],
  testCases: [{ input: "", output: "", isSample: true, subtaskIndex: null }],
};

export default function ProblemForm({
  initial,
}: {
  initial?: ProblemFormData;
}) {
  const router = useRouter();
  const editing = initial?.id != null;
  const [form, setForm] = useState<ProblemFormData>(initial ?? EMPTY);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function set<K extends keyof ProblemFormData>(
    key: K,
    value: ProblemFormData[K]
  ) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function setTestCase(i: number, patch: Partial<TestCaseInput>) {
    setForm((f) => ({
      ...f,
      testCases: f.testCases.map((tc, j) =>
        j === i ? { ...tc, ...patch } : tc
      ),
    }));
  }

  function setSubtask(i: number, patch: Partial<SubtaskInput>) {
    setForm((f) => ({
      ...f,
      subtasks: f.subtasks.map((s, j) => (j === i ? { ...s, ...patch } : s)),
    }));
  }

  function addSubtask() {
    setForm((f) => ({
      ...f,
      subtasks: [...f.subtasks, { points: 0, checkMode: "full" }],
    }));
  }

  // 刪除子題時，指向它的測資要清空、指向後面子題的測資要往前補一格索引
  function removeSubtask(i: number) {
    setForm((f) => ({
      ...f,
      subtasks: f.subtasks.filter((_, j) => j !== i),
      testCases: f.testCases.map((tc) => {
        if (tc.subtaskIndex == null) return tc;
        if (tc.subtaskIndex === i) return { ...tc, subtaskIndex: null };
        if (tc.subtaskIndex > i)
          return { ...tc, subtaskIndex: tc.subtaskIndex - 1 };
        return tc;
      }),
    }));
  }

  const totalPoints = form.subtasks.reduce((s, x) => s + x.points, 0);

  async function save() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(
        editing ? `/api/admin/problems/${initial!.id}` : "/api/admin/problems",
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
      router.push("/admin/problems");
      router.refresh();
    } catch {
      setError("儲存失敗，請稍後再試");
      setSaving(false);
    }
  }

  async function remove() {
    if (!confirm("確定要刪除這個題目嗎？相關的紀錄也會一併刪除。")) return;
    await fetch(`/api/admin/problems/${initial!.id}`, { method: "DELETE" });
    router.push("/admin/problems");
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
            placeholder="例如：A + B Problem"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">
            題敘（Markdown，支援 $...$ 數學式）
          </label>
          <textarea
            className="input h-64 font-mono text-[13px]"
            value={form.statement}
            onChange={(e) => set("statement", e.target.value)}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-4">
          <div>
            <label className="mb-1 block text-sm font-medium">難度</label>
            <select
              className="input"
              value={form.difficulty}
              onChange={(e) => set("difficulty", e.target.value)}
            >
              <option value="easy">簡單</option>
              <option value="medium">中等</option>
              <option value="hard">困難</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              時間限制 (ms)
            </label>
            <input
              className="input"
              type="number"
              min={100}
              max={20000}
              step={100}
              value={form.timeLimitMs}
              onChange={(e) => set("timeLimitMs", Number(e.target.value))}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              記憶體限制 (MB)
            </label>
            <input
              className="input"
              type="number"
              min={16}
              max={1024}
              value={form.memoryLimitMb}
              onChange={(e) => set("memoryLimitMb", Number(e.target.value))}
            />
          </div>
          <div className="flex items-end pb-2">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={form.isPublic}
                onChange={(e) => set("isPublic", e.target.checked)}
              />
              公開題目
            </label>
          </div>
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="section-title">
            子題與配分{form.subtasks.length > 0 ? `（合計 ${totalPoints} 分）` : ""}
          </h2>
          <button className="btn-secondary" onClick={addSubtask}>
            ＋ 新增子題
          </button>
        </div>
        {form.subtasks.length === 0 ? (
          <p className="text-sm text-mute">
            沒有子題＝整題只有 AC / WA（沿用預設判法）。加了子題之後，每筆測資都要指定所屬子題，該子題測資全對才拿到配分。
          </p>
        ) : (
          <div className="space-y-3">
            {totalPoints !== 100 && (
              <p className="text-sm text-[#ff6b6b]">
                子題配分總和目前為 {totalPoints}，需為 100 才能儲存。
              </p>
            )}
            {form.subtasks.map((s, i) => (
              <div key={i} className="card flex flex-wrap items-center gap-4 p-4">
                <p className="text-sm font-semibold text-dim">子題 {i + 1}</p>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-dim">配分</label>
                  <input
                    className="input w-24"
                    type="number"
                    min={1}
                    max={100}
                    value={s.points}
                    onChange={(e) =>
                      setSubtask(i, { points: Number(e.target.value) })
                    }
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-dim">比對方式</label>
                  <select
                    className="input"
                    value={s.checkMode}
                    onChange={(e) =>
                      setSubtask(i, {
                        checkMode: e.target.value as "full" | "firstLine",
                      })
                    }
                  >
                    <option value="full">完整比對輸出</option>
                    <option value="firstLine">只比對第一行</option>
                  </select>
                </div>
                <button
                  className="ml-auto text-sm text-[#ff6b6b] hover:underline"
                  onClick={() => removeSubtask(i)}
                >
                  刪除子題
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="section-title">
            測資（{form.testCases.length} 筆）
          </h2>
          <button
            className="btn-secondary"
            onClick={() =>
              set("testCases", [
                ...form.testCases,
                { input: "", output: "", isSample: false, subtaskIndex: null },
              ])
            }
          >
            ＋ 新增測資
          </button>
        </div>
        <div className="space-y-4">
          {form.testCases.map((tc, i) => (
            <div key={i} className="card p-4">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-dim">
                  測資 #{i + 1}
                </p>
                <div className="flex items-center gap-4">
                  {form.subtasks.length > 0 && (
                    <label className="flex items-center gap-1.5 text-sm">
                      所屬子題
                      <select
                        className="input"
                        value={tc.subtaskIndex ?? ""}
                        onChange={(e) =>
                          setTestCase(i, {
                            subtaskIndex:
                              e.target.value === ""
                                ? null
                                : Number(e.target.value),
                          })
                        }
                      >
                        <option value="">請選擇</option>
                        {form.subtasks.map((s, si) => (
                          <option key={si} value={si}>
                            子題 {si + 1}（{s.points} 分）
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                  <label className="flex items-center gap-1.5 text-sm">
                    <input
                      type="checkbox"
                      checked={tc.isSample}
                      onChange={(e) =>
                        setTestCase(i, { isSample: e.target.checked })
                      }
                    />
                    範例（顯示在題目頁）
                  </label>
                  <button
                    className="text-sm text-[#ff6b6b] hover:underline"
                    onClick={() =>
                      set(
                        "testCases",
                        form.testCases.filter((_, j) => j !== i)
                      )
                    }
                    disabled={form.testCases.length <= 1}
                  >
                    刪除
                  </button>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs text-dim">
                    輸入
                  </label>
                  <textarea
                    className="input h-28 font-mono text-[13px]"
                    value={tc.input}
                    onChange={(e) => setTestCase(i, { input: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-dim">
                    期望輸出
                  </label>
                  <textarea
                    className="input h-28 font-mono text-[13px]"
                    value={tc.output}
                    onChange={(e) => setTestCase(i, { output: e.target.value })}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-[#ff6b6b]">{error}</p>}
      <div className="flex items-center justify-between">
        <div>
          {editing && (
            <button className="btn-danger" onClick={remove}>
              刪除題目
            </button>
          )}
        </div>
        <button className="btn-primary" onClick={save} disabled={saving}>
          {saving ? "儲存中…" : editing ? "儲存變更" : "建立題目"}
        </button>
      </div>
    </div>
  );
}
