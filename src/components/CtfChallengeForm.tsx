"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CTF_CATEGORIES, CTF_DIFFICULTIES, CTF_FLAG_MAX_LENGTH, CTF_LAB_LABELS } from "@/lib/ctfSchema";

export interface CtfChallengeFormData {
  id?: number; title: string; description: string; category: string; difficulty: string;
  points: number; isPublic: boolean; order: number;
  labType: string | null;
}

export default function CtfChallengeForm({ initial }: { initial?: CtfChallengeFormData }) {
  const router = useRouter();
  const [form, setForm] = useState<CtfChallengeFormData>(initial ?? {
    title: "", description: "", category: "Misc", difficulty: "medium", points: 100, isPublic: false, order: 0, labType: null,
  });
  const [flag, setFlag] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const editing = initial?.id != null;
  function set<K extends keyof CtfChallengeFormData>(key: K, value: CtfChallengeFormData[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }
  async function save(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const res = await fetch(editing ? `/api/admin/ctf/challenges/${initial!.id}` : "/api/admin/ctf/challenges", {
        method: editing ? "PUT" : "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, id: undefined, flag }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? `儲存失敗（HTTP ${res.status}）`);
      setFlag("");
      router.push(editing ? "/admin/ctf" : `/admin/ctf/${data.id}/edit`);
      router.refresh();
    } catch (err) { setError(err instanceof Error && !(err instanceof TypeError) ? err.message : "儲存失敗，請檢查連線後重試"); }
    finally { setBusy(false); }
  }
  async function remove() {
    if (!confirm("永久刪除會一併移除附件、解題與提交紀錄，確定要刪除嗎？若只想停用，請取消公開。")) return;
    setBusy(true); setError("");
    try {
      const res = await fetch(`/api/admin/ctf/challenges/${initial!.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "刪除失敗");
      router.push("/admin/ctf"); router.refresh();
    } catch (err) { setError(err instanceof Error && !(err instanceof TypeError) ? err.message : "刪除失敗，請檢查連線後重試"); }
    finally { setBusy(false); }
  }
  return (
    <form onSubmit={save} className="card space-y-5 p-6">
      <label className="block text-sm">標題
        <input className="input mt-2 w-full" required maxLength={200} value={form.title} onChange={(e) => set("title", e.target.value)} />
      </label>
      <label className="block text-sm">題目敘述（Markdown）
        <textarea className="input mt-2 w-full" required rows={12} maxLength={100000} value={form.description} onChange={(e) => set("description", e.target.value)} />
      </label>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <label className="text-sm">分類<select className="input mt-2 w-full" value={form.category} onChange={(e) => setForm((current) => ({ ...current, category: e.target.value, labType: e.target.value === "Web" ? current.labType : null }))}>
          {CTF_CATEGORIES.map((category) => <option key={category}>{category}</option>)}
        </select></label>
        <label className="text-sm">難度<select className="input mt-2 w-full" value={form.difficulty} onChange={(e) => set("difficulty", e.target.value)}>
          {Object.entries(CTF_DIFFICULTIES).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
        </select></label>
        <label className="text-sm">配分<input type="number" className="input mt-2 w-full" required min={1} max={1000000} value={form.points} onChange={(e) => set("points", Number(e.target.value))} /></label>
        <label className="text-sm">排序<input type="number" className="input mt-2 w-full" required min={0} max={2147483647} value={form.order} onChange={(e) => set("order", Number(e.target.value))} /></label>
      </div>
      <label className="block text-sm">Web 練習網站
        <select className="input mt-2 w-full" disabled={form.category !== "Web"} value={form.labType ?? ""} onChange={(e) => set("labType", e.target.value || null)}>
          <option value="">不使用練習網站</option>
          {Object.entries(CTF_LAB_LABELS).map(([type, label]) => <option key={type} value={type}>{label}</option>)}
        </select>
      </label>
      <p className="text-xs text-dim">練習網站使用獨立的模擬資料。第一次啟用時請設定新 Flag；後續留空可保留原值。</p>
      <label className="block text-sm">{editing ? "替換 Flag（留空保留原值）" : "Flag"}
        <input type="password" className="input mt-2 w-full" autoComplete="new-password" spellCheck={false} required={!editing} maxLength={CTF_FLAG_MAX_LENGTH} value={flag} onChange={(e) => setFlag(e.target.value)} />
      </label>
      <p className="text-xs text-dim">忽略前後空白，保留內部空白，區分大小寫。修改配分會同步更新所有已解出使用者的分數。</p>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isPublic} onChange={(e) => set("isPublic", e.target.checked)} />公開題目（取消公開會保留紀錄，並暫停採計）</label>
      {error && <p role="alert" className="text-sm text-[#ff6b6b]">{error}</p>}
      <div className="flex flex-wrap gap-3">
        <button className="btn-primary" disabled={busy}>{busy ? "處理中…" : "儲存題目"}</button>
        <Link className="btn-secondary" href="/admin/ctf">返回列表</Link>
        {editing && <button type="button" className="btn-secondary text-[#ff6b6b]" disabled={busy} onClick={remove}>永久刪除</button>}
      </div>
      {!editing && <p className="text-sm text-dim">儲存後可在編輯頁上傳附件。</p>}
    </form>
  );
}
