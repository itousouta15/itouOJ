"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CTF_ATTACHMENT_MAX_BYTES } from "@/lib/ctfAttachment";

export default function CtfAttachmentManager({ challengeId, attachments }: {
  challengeId: number; attachments: { id: number; filename: string; sizeBytes: number }[];
}) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function upload(event: React.FormEvent) {
    event.preventDefault(); setError("");
    const file = input.current?.files?.[0];
    if (!file) { setError("請選擇附件"); return; }
    if (!file.size || file.size > CTF_ATTACHMENT_MAX_BYTES) { setError("附件不能是空檔，每檔最多 4 MiB"); return; }
    setBusy(true);
    try {
      const body = new FormData(); body.set("file", file);
      const res = await fetch(`/api/admin/ctf/challenges/${challengeId}/attachments`, { method: "POST", body });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? `上傳失敗（HTTP ${res.status}）`);
      if (input.current) input.current.value = "";
      router.refresh();
    } catch (err) { setError(err instanceof Error && !(err instanceof TypeError) ? err.message : "上傳失敗，題目已保留，請檢查連線後重試"); }
    finally { setBusy(false); }
  }
  async function remove(id: number) {
    if (!confirm("確定要刪除此附件嗎？")) return;
    setBusy(true); setError("");
    try {
      const res = await fetch(`/api/admin/ctf/challenges/${challengeId}/attachments/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "刪除失敗");
      router.refresh();
    } catch (err) { setError(err instanceof Error && !(err instanceof TypeError) ? err.message : "刪除失敗，請檢查連線後重試"); }
    finally { setBusy(false); }
  }
  return <section className="card space-y-4 p-6">
    <h2 className="section-title">附件</h2>
    <p className="text-sm text-dim">每檔最多 4 MiB，可逐次上傳多個附件。附件操作即時儲存。</p>
    {attachments.length === 0 && <p className="text-sm text-mute">尚無附件</p>}
    <ul className="space-y-3">{attachments.map((file) => <li key={file.id} className="flex flex-wrap items-center justify-between gap-3 text-sm">
      <a href={`/api/ctf/challenges/${challengeId}/attachments/${file.id}`} className="break-all text-blue hover:underline">{file.filename}（{(file.sizeBytes / 1024).toFixed(1)} KiB）</a>
      <button type="button" className="btn-secondary" disabled={busy} onClick={() => remove(file.id)}>刪除</button>
    </li>)}</ul>
    <form className="flex flex-wrap items-center gap-3" onSubmit={upload}>
      <label className="text-sm">選擇附件<input ref={input} type="file" className="mt-2 block w-full text-sm" disabled={busy} /></label>
      <button className="btn-primary" disabled={busy}>{busy ? "處理中…" : "上傳附件"}</button>
    </form>
    {error && <p role="alert" className="text-sm text-[#ff6b6b]">{error}</p>}
  </section>;
}
