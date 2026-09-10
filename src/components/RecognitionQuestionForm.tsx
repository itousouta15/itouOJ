"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RECOGNITION_CATEGORIES } from "@/lib/recognitionSchema";

export interface RecognitionQuestionFormData {
  id?: number;
  code: string;
  question: string;
  category: string;
  options: string[];
  answerIndex: number;
  explanation: string;
  isPublic: boolean;
  order: number;
}

const EMPTY: RecognitionQuestionFormData = {
  code: "",
  question: "",
  category: "C",
  options: ["", ""],
  answerIndex: 0,
  explanation: "",
  isPublic: true,
  order: 0,
};

export default function RecognitionQuestionForm({
  initial,
}: {
  initial?: RecognitionQuestionFormData;
}) {
  const router = useRouter();
  const editing = initial?.id != null;
  const [form, setForm] = useState<RecognitionQuestionFormData>(
    initial ?? EMPTY
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function set<K extends keyof RecognitionQuestionFormData>(
    key: K,
    value: RecognitionQuestionFormData[K]
  ) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function setOption(i: number, value: string) {
    setForm((f) => {
      const options = [...f.options];
      options[i] = value;
      return { ...f, options };
    });
  }

  function addOption() {
    setForm((f) => ({ ...f, options: [...f.options, ""] }));
  }

  function removeOption(i: number) {
    setForm((f) => ({
      ...f,
      options: f.options.filter((_, idx) => idx !== i),
      answerIndex:
        f.answerIndex === i
          ? 0
          : f.answerIndex > i
            ? f.answerIndex - 1
            : f.answerIndex,
    }));
  }

  async function save() {
    setSaving(true);
    setError("");
    try {
      const trimmed = form.options.map((o) => o.trim());
      const body = {
        code: form.code,
        question: form.question,
        category: form.category,
        options: trimmed,
        answerIndex: form.answerIndex,
        explanation: form.explanation,
        isPublic: form.isPublic,
        order: form.order,
      };
      const res = await fetch(
        editing
          ? `/api/admin/recognition/${initial!.id}`
          : "/api/admin/recognition",
        {
          method: editing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
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
    if (!confirm("確定要刪除這題嗎？")) return;
    await fetch(`/api/admin/recognition/${initial!.id}`, { method: "DELETE" });
    router.push("/admin/recognition");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="card space-y-4 p-6">
        <div>
          <label className="mb-1 block text-sm font-medium">題目文字</label>
          <input
            className="input"
            value={form.question}
            onChange={(e) => set("question", e.target.value)}
            placeholder="例如：這個程式輸出什麼？"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">類別</label>
          <div className="flex gap-2">
            {RECOGNITION_CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => set("category", c)}
                className={`pill ${form.category === c ? "pill-active" : ""}`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            程式碼（照原樣貼上）
          </label>
          <textarea
            className="input h-56 font-mono text-[13px]"
            value={form.code}
            onChange={(e) => set("code", e.target.value)}
            spellCheck={false}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            選項（一行一個）
          </label>
          <div className="space-y-2">
            {form.options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-6 shrink-0 text-sm text-dim">
                  {String.fromCharCode(65 + i)}.
                </span>
                <input
                  className="input"
                  value={opt}
                  onChange={(e) => setOption(i, e.target.value)}
                  placeholder={`選項 ${String.fromCharCode(65 + i)}`}
                />
                <button
                  type="button"
                  className="shrink-0 text-sm text-[#ff6b6b] hover:underline"
                  onClick={() => removeOption(i)}
                  disabled={form.options.length <= 2}
                >
                  刪除
                </button>
              </div>
            ))}
          </div>
          {form.options.length < 8 && (
            <button
              type="button"
              className="mt-2 text-sm text-blue hover:underline"
              onClick={addOption}
            >
              ＋ 加選項
            </button>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">正確答案</label>
          <div className="flex flex-wrap gap-2">
            {form.options.map((opt, i) => (
              <button
                key={i}
                type="button"
                onClick={() => set("answerIndex", i)}
                className={`pill ${
                  form.answerIndex === i ? "pill-active" : ""
                }`}
              >
                {String.fromCharCode(65 + i)}
                {opt.trim() ? ` · ${opt.trim()}` : ""}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            說明（作答後顯示，選填）
          </label>
          <textarea
            className="input h-24 font-mono text-[13px]"
            value={form.explanation}
            onChange={(e) => set("explanation", e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isPublic}
              onChange={(e) => set("isPublic", e.target.checked)}
            />
            對使用者顯示
          </label>
          <label className="flex items-center gap-2 text-sm">
            <span className="text-dim">順序</span>
            <input
              type="number"
              className="input w-24"
              value={form.order}
              onChange={(e) => set("order", Number(e.target.value) || 0)}
            />
          </label>
        </div>
      </div>

      {error && <p className="text-sm text-[#ff6b6b]">{error}</p>}
      <div className="flex items-center gap-3">
        <button className="btn-primary" onClick={save} disabled={saving}>
          {saving ? "儲存中…" : editing ? "儲存變更" : "新增題目"}
        </button>
        {editing && (
          <button className="btn-danger" onClick={remove}>
            刪除題目
          </button>
        )}
      </div>
    </div>
  );
}