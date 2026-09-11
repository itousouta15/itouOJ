"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RECOGNITION_CATEGORIES } from "@/lib/problemTypes";
import TagPicker from "@/components/TagPicker";

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
  type: "PROGRAMMING" | "RECOGNITION";
  title: string;
  statement: string;
  difficulty: string;
  timeLimitMs: number;
  memoryLimitMb: number;
  isPublic: boolean;
  tagIds: number[];
  subtasks: SubtaskInput[];
  testCases: TestCaseInput[];
  // 出題者的使用者名稱（選填；只對實作題顯示與聯絡）
  authorUsername: string;
  // 識別題欄位（type = RECOGNITION 才有意義）
  code: string;
  options: string[];
  answerIndex: number;
  explanation: string;
  paper: string;
  sourceNumber: number | null;
  category: string;
  // 目前伺服器上已經有的 PDF 檔名（唯讀，只給畫面顯示現況用）
  pdfFilename: string | null;
  // 目前的 PDF 是否已經設密碼保護（唯讀，只顯示現況；密碼本身不會回傳到前端）
  pdfHasPassword: boolean;
}

export interface AvailableTag {
  id: number;
  name: string;
}

const EMPTY: ProblemFormData = {
  type: "PROGRAMMING",
  title: "",
  statement:
    "## 題目描述\n\n\n\n## 輸入格式\n\n\n\n## 輸出格式\n\n",
  difficulty: "medium",
  timeLimitMs: 1000,
  memoryLimitMb: 256,
  isPublic: true,
  tagIds: [],
  subtasks: [],
  testCases: [{ input: "", output: "", isSample: true, subtaskIndex: null }],
  authorUsername: "",
  code: "",
  options: ["", ""],
  answerIndex: 0,
  explanation: "",
  paper: "",
  sourceNumber: null,
  category: RECOGNITION_CATEGORIES[0],
  pdfFilename: null,
  pdfHasPassword: false,
};

const MAX_PDF_BYTES = 10 * 1024 * 1024;

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error("讀取檔案失敗"));
    reader.onload = () => {
      const result = String(reader.result ?? "");
      // data:application/pdf;base64,JVBERi0... -> 只要逗號後面的部分
      const comma = result.indexOf(",");
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.readAsDataURL(file);
  });
}

export default function ProblemForm({
  initial,
  availableTags = [],
  defaultType = "PROGRAMMING",
}: {
  initial?: ProblemFormData;
  availableTags?: AvailableTag[];
  defaultType?: "PROGRAMMING" | "RECOGNITION";
}) {
  const router = useRouter();
  const editing = initial?.id != null;
  const [form, setForm] = useState<ProblemFormData>(
    initial ?? { ...EMPTY, type: defaultType }
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  // PDF 是三態的：不動／移除／換新檔，跟其他欄位「直接改 form 裡的值」不一樣，
  // 所以不放進 form，存檔時才轉成 problemSchema 期待的 pdfUpload 形狀。
  const [newPdf, setNewPdf] = useState<{ filename: string; base64: string } | null>(null);
  const [newPdfPassword, setNewPdfPassword] = useState("");
  const [removePdf, setRemovePdf] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  const isRecognition = form.type === "RECOGNITION";

  function set<K extends keyof ProblemFormData>(
    key: K,
    value: ProblemFormData[K]
  ) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function switchType(type: "PROGRAMMING" | "RECOGNITION") {
    if (type === form.type) return;
    setForm((f) => ({ ...f, type }));
  }

  function setTestCase(i: number, patch: Partial<TestCaseInput>) {
    setForm((f) => ({
      ...f,
      testCases: f.testCases.map((tc, j) =>
        j === i ? { ...tc, ...patch } : tc
      ),
    }));
  }

  function toggleTag(tagId: number) {
    setForm((f) => ({
      ...f,
      tagIds: f.tagIds.includes(tagId)
        ? f.tagIds.filter((id) => id !== tagId)
        : [...f.tagIds, tagId],
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

  async function onPdfSelected(file: File | null) {
    if (!file) return;
    setError("");
    if (file.size > MAX_PDF_BYTES) {
      setError(`PDF 檔案不能超過 ${MAX_PDF_BYTES / 1024 / 1024} MB`);
      return;
    }
    setPdfLoading(true);
    try {
      const base64 = await readFileAsBase64(file);
      setNewPdf({ filename: file.name, base64 });
      setRemovePdf(false);
    } catch {
      setError("讀取 PDF 檔案失敗");
    } finally {
      setPdfLoading(false);
    }
  }

  async function save() {
    setSaving(true);
    setError("");
    try {
      const pdfUpload = removePdf
        ? null
        : newPdf
          ? { ...newPdf, password: newPdfPassword.trim() || null }
          : undefined;
      const res = await fetch(
        editing ? `/api/admin/problems/${initial!.id}` : "/api/admin/problems",
        {
          method: editing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, id: undefined, pdfUpload }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "儲存失敗");
        setSaving(false);
        return;
      }
      router.push(`/admin/problems?type=${form.type}`);
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
          <label className="mb-1 block text-sm font-medium">題型</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => switchType("PROGRAMMING")}
              className={`pill ${!isRecognition ? "pill-active" : ""}`}
            >
              實作題（寫程式）
            </button>
            <button
              type="button"
              onClick={() => switchType("RECOGNITION")}
              className={`pill ${isRecognition ? "pill-active" : ""}`}
            >
              識別題（選擇題）
            </button>
          </div>
          <p className="mt-1 text-xs text-mute">
            {isRecognition
              ? "看一段程式或題敘，選出正確選項。識別題沒有測資，送出選項即時判定。"
              : "上傳程式碼交由評測系統判定的題目。"}
          </p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">標題</label>
          <input
            className="input"
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder={isRecognition ? "例如：APCS 2021/01 A 卷第 3 題" : "例如：A + B Problem"}
          />
        </div>

        {isRecognition && (
          <div className="grid gap-4 sm:grid-cols-4">
            <div>
              <label className="mb-1 block text-sm font-medium">
                卷別（例如：A 卷 / 第一場）
              </label>
              <input
                className="input"
                value={form.paper}
                onChange={(e) => set("paper", e.target.value)}
                placeholder="選填"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">原題號</label>
              <input
                className="input"
                type="number"
                min={0}
                value={form.sourceNumber ?? ""}
                onChange={(e) =>
                  set(
                    "sourceNumber",
                    e.target.value === "" ? null : Number(e.target.value)
                  )
                }
                placeholder="選填"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">分類</label>
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
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium">
            {isRecognition ? "題目（Markdown，支援 $...$ 數學式與圖片）" : "題敘（Markdown，支援 $...$ 數學式）"}
          </label>
          <textarea
            className="input h-64 font-mono text-[13px]"
            value={form.statement}
            onChange={(e) => set("statement", e.target.value)}
          />
        </div>

        {!isRecognition && (
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
        )}

        {!isRecognition && (
          <div>
            <label className="mb-1 block text-sm font-medium">
              出題者（使用者名稱，選填）
            </label>
            <input
              className="input"
              value={form.authorUsername}
              onChange={(e) => set("authorUsername", e.target.value)}
              placeholder="例如：itouSouta；留空則題目頁不顯示出題者"
            />
            <p className="mt-1 text-xs text-mute">
              題目頁會顯示出題者並提供「聯絡出題者」按鈕；送審核准的題目會自動帶入申請人。
            </p>
          </div>
        )}

        {isRecognition && (
          <>
            <div>
              <label className="mb-1 block text-sm font-medium">
                程式碼（照原樣貼上，選填）
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
                解析（作答後顯示，選填）
              </label>
              <textarea
                className="input h-24 font-mono text-[13px]"
                value={form.explanation}
                onChange={(e) => set("explanation", e.target.value)}
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={form.isPublic}
                  onChange={(e) => set("isPublic", e.target.checked)}
                />
                對使用者顯示
              </label>
            </div>
          </>
        )}

        {!isRecognition && (
          <>
            <div>
              <label className="mb-1 block text-sm font-medium">標籤</label>
              <TagPicker
                tags={availableTags}
                selectedIds={form.tagIds}
                onToggle={toggleTag}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">正式 PDF</label>
              <p className="mb-2 text-xs text-mute">
                沒有上傳的話，「下載題目文件」會用題敘現場產生排版好的 HTML；
                上傳自製的正式 PDF 後會改用這份檔案。
              </p>
              {removePdf ? (
                <p className="text-sm text-dim">
                  儲存後會移除目前的 PDF。
                  <button
                    type="button"
                    className="ml-2 text-blue hover:underline"
                    onClick={() => setRemovePdf(false)}
                  >
                    取消
                  </button>
                </p>
              ) : newPdf ? (
                <p className="text-sm text-dim">
                  已選擇新檔案：{newPdf.filename}
                  <button
                    type="button"
                    className="ml-2 text-[#ff6b6b] hover:underline"
                    onClick={() => {
                      setNewPdf(null);
                      setNewPdfPassword("");
                    }}
                  >
                    取消
                  </button>
                </p>
              ) : form.pdfFilename ? (
                <p className="text-sm text-dim">
                  目前已上傳：{form.pdfFilename}
                  {form.pdfHasPassword && "（已設密碼保護）"}
                  <button
                    type="button"
                    className="ml-2 text-[#ff6b6b] hover:underline"
                    onClick={() => setRemovePdf(true)}
                  >
                    移除
                  </button>
                </p>
              ) : (
                <p className="text-sm text-mute">尚未上傳</p>
              )}
              <input
                className="mt-2 block text-sm"
                type="file"
                accept="application/pdf"
                disabled={pdfLoading}
                onChange={(e) => onPdfSelected(e.target.files?.[0] ?? null)}
              />
              {newPdf && (
                <div className="mt-2">
                  <label className="mb-1 block text-sm font-medium">
                    PDF 密碼保護（選填）
                  </label>
                  <input
                    className="input max-w-xs"
                    type="text"
                    value={newPdfPassword}
                    onChange={(e) => setNewPdfPassword(e.target.value)}
                    placeholder="留空 = 不加密"
                  />
                  <p className="mt-1 text-xs text-mute">
                    有設密碼的話，比賽開始前就算開放提前下載，選手機上存的也是加密過的檔案，
                    打不開；收件程式會在真正開賽那一刻自動解密開啟，不需要選手手動輸入密碼。
                    密碼會明碼存在資料庫裡，記得自己留一份備份。
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {!isRecognition && (
        <>
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
        </>
      )}

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
