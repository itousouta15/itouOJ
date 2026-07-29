"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { fromTaipeiInputValue } from "@/lib/contestTime";
import { LANGUAGES, type LanguageKey } from "@/lib/languages";

interface ProblemOption {
  id: number;
  title: string;
  isPublic: boolean;
}

interface ContestProblemEntry {
  problemId: number;
  label: string;
}

export interface ContestFormInitial {
  id?: number;
  title: string;
  description: string;
  startTime: string; // datetime-local 格式（本地時區，無 Z）
  endTime: string;
  freezeMinutes: number;
  scoreMode: "ICPC" | "IOI";
  allowedLanguages: string; // 逗號分隔；空字串 = 不限制
  isPublic: boolean;
  joinCode: string;
  allowEarlyProblemDownload: boolean;
  problems: ContestProblemEntry[];
}

const EMPTY: ContestFormInitial = {
  title: "",
  description: "",
  startTime: "",
  endTime: "",
  freezeMinutes: 0,
  scoreMode: "ICPC",
  allowedLanguages: "",
  isPublic: true,
  joinCode: "",
  allowEarlyProblemDownload: false,
  problems: [],
};

function randomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from(
    { length: 6 },
    () => chars[Math.floor(Math.random() * chars.length)]
  ).join("");
}

function nextLabel(existing: string[]) {
  for (let i = 0; i < 26; i++) {
    const c = String.fromCharCode(65 + i);
    if (!existing.includes(c)) return c;
  }
  return "";
}

export default function ContestForm({
  problems,
  initial,
}: {
  problems: ProblemOption[];
  initial?: ContestFormInitial;
}) {
  const router = useRouter();
  const editing = initial?.id != null;
  const [form, setForm] = useState<ContestFormInitial>(initial ?? EMPTY);
  const [addingId, setAddingId] = useState<number | "">("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const usedIds = new Set(form.problems.map((p) => p.problemId));
  const available = problems.filter((p) => !usedIds.has(p.id));
  const problemById = new Map(problems.map((p) => [p.id, p]));

  function addProblem() {
    if (addingId === "") return;
    setForm((f) => ({
      ...f,
      problems: [
        ...f.problems,
        { problemId: addingId, label: nextLabel(f.problems.map((p) => p.label)) },
      ],
    }));
    setAddingId("");
  }

  function removeProblem(index: number) {
    setForm((f) => ({ ...f, problems: f.problems.filter((_, i) => i !== index) }));
  }

  function moveProblem(index: number, dir: -1 | 1) {
    setForm((f) => {
      const next = [...f.problems];
      const target = index + dir;
      if (target < 0 || target >= next.length) return f;
      [next[index], next[target]] = [next[target], next[index]];
      return { ...f, problems: next };
    });
  }

  function setLabel(index: number, label: string) {
    setForm((f) => {
      const next = [...f.problems];
      next[index] = { ...next[index], label };
      return { ...f, problems: next };
    });
  }

  async function save() {
    if (!form.startTime || !form.endTime) {
      setError("請填寫開始與結束時間");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch(
        editing ? `/api/admin/contests/${initial!.id}` : "/api/admin/contests",
        {
          method: editing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...form,
            id: undefined,
            startTime: fromTaipeiInputValue(form.startTime),
            endTime: fromTaipeiInputValue(form.endTime),
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "儲存失敗");
        setSaving(false);
        return;
      }
      router.push("/admin/contests");
      router.refresh();
    } catch {
      setError("儲存失敗，請稍後再試");
      setSaving(false);
    }
  }

  async function remove() {
    if (!confirm("確定要刪除這場比賽嗎？報名資料會一併刪除（不影響提交紀錄）。"))
      return;
    await fetch(`/api/admin/contests/${initial!.id}`, { method: "DELETE" });
    router.push("/admin/contests");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="card space-y-4 p-6">
        <div>
          <label className="mb-1 block text-sm font-medium">比賽標題</label>
          <input
            className="input"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="例如：社課小賽 #1"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">比賽說明</label>
          <textarea
            className="input min-h-28 resize-y"
            value={form.description}
            onChange={(e) =>
              setForm((f) => ({ ...f, description: e.target.value }))
            }
            placeholder="規則、範圍、注意事項…"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium">開始時間</label>
            <input
              type="datetime-local"
              className="input"
              value={form.startTime}
              onChange={(e) =>
                setForm((f) => ({ ...f, startTime: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">結束時間</label>
            <input
              type="datetime-local"
              className="input"
              value={form.endTime}
              onChange={(e) =>
                setForm((f) => ({ ...f, endTime: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              凍結榜時間（分鐘）
            </label>
            <input
              type="number"
              min={0}
              className="input"
              value={form.freezeMinutes}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  freezeMinutes: Number(e.target.value) || 0,
                }))
              }
            />
            <p className="mt-1 text-xs text-mute">
              0 = 不凍結，結束當下自動公開成績
            </p>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">計分方式</label>
          <select
            className="input w-auto"
            value={form.scoreMode}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                scoreMode: e.target.value as "ICPC" | "IOI",
              }))
            }
          >
            <option value="ICPC">ICPC：首次 AC 計分，錯誤提交 +20 分罰時</option>
            <option value="IOI">IOI：每題只看最後一次提交，不罰時</option>
          </select>
          <p className="mt-1 text-xs text-mute">
            斷網比賽（賽後才整批判題）請選 IOI——選手當下看不到結果，罰時會變成盲罰。
          </p>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">可用語言</label>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {(Object.keys(LANGUAGES) as LanguageKey[]).map((key) => {
              const selected = form.allowedLanguages
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean);
              return (
                <label
                  key={key}
                  className="flex cursor-pointer items-center gap-2 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(key)}
                    onChange={(e) => {
                      const next = e.target.checked
                        ? [...selected, key]
                        : selected.filter((k) => k !== key);
                      setForm((f) => ({
                        ...f,
                        allowedLanguages: next.join(","),
                      }));
                    }}
                  />
                  {LANGUAGES[key].label}
                </label>
              );
            })}
          </div>
          <p className="mt-1 text-xs text-mute">
            全部不勾 = 不限制。勾選後，網頁提交、測試執行、離線收件程式都只收這些語言。
          </p>
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
              placeholder="留空 = 開放報名"
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
            設定後，參賽者要輸入這組代碼才能報名；留空則任何人都能直接報名。
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
          公開比賽（未公開時只有管理員看得到）
        </label>
        <label className="flex cursor-pointer items-start gap-2 text-sm">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={form.allowEarlyProblemDownload}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                allowEarlyProblemDownload: e.target.checked,
              }))
            }
          />
          <span>
            允許選手端在開賽前下載題目文件
            <br />
            <span className="text-xs text-mute">
              預設關閉：題目文件平常要等開賽才能下載，避免洩題。斷網比賽如果需要在賽前設定階段就把檔案存到選手機上，才需要開啟——開啟後選手登入即可下載完整題目內容，請自行評估洩題風險。
            </span>
          </span>
        </label>
      </div>

      <div className="card p-6">
        <p className="mb-3 text-sm font-medium">
          比賽題目
          <span className="mono ml-2 text-xs text-mute">
            已加入 {form.problems.length} 題
          </span>
        </p>

        <div className="mb-3 flex gap-2">
          <select
            className="input"
            value={addingId}
            onChange={(e) =>
              setAddingId(e.target.value === "" ? "" : Number(e.target.value))
            }
          >
            <option value="">選擇題目加入…</option>
            {available.map((p) => (
              <option key={p.id} value={p.id}>
                #{p.id} {p.title}
                {!p.isPublic ? "（未公開）" : ""}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="btn-secondary shrink-0"
            onClick={addProblem}
            disabled={addingId === ""}
          >
            加入
          </button>
        </div>

        {form.problems.length === 0 ? (
          <p className="text-sm text-mute">還沒有加入題目</p>
        ) : (
          <div className="space-y-1">
            {form.problems.map((entry, i) => (
              <div
                key={entry.problemId}
                className="flex items-center gap-3 rounded-md border border-bd bg-inset px-3 py-2 text-sm"
              >
                <input
                  className="input mono w-16 text-center"
                  value={entry.label}
                  onChange={(e) => setLabel(i, e.target.value)}
                  maxLength={4}
                />
                <span className="mono w-10 text-xs text-mute">
                  #{entry.problemId}
                </span>
                <span className="flex-1 truncate">
                  {problemById.get(entry.problemId)?.title ?? "（題目已刪除）"}
                </span>
                <button
                  type="button"
                  className="text-dim hover:text-tx disabled:opacity-30"
                  onClick={() => moveProblem(i, -1)}
                  disabled={i === 0}
                  aria-label="上移"
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="text-dim hover:text-tx disabled:opacity-30"
                  onClick={() => moveProblem(i, 1)}
                  disabled={i === form.problems.length - 1}
                  aria-label="下移"
                >
                  ↓
                </button>
                <button
                  type="button"
                  className="text-[#ff6b6b] hover:underline"
                  onClick={() => removeProblem(i)}
                >
                  移除
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && <p className="text-sm text-[#ff6b6b]">{error}</p>}
      <div className="flex items-center gap-3">
        <button className="btn-primary" onClick={save} disabled={saving}>
          {saving ? "儲存中…" : editing ? "儲存變更" : "建立比賽"}
        </button>
        {editing && (
          <button className="btn-danger" onClick={remove}>
            刪除比賽
          </button>
        )}
      </div>
    </div>
  );
}
