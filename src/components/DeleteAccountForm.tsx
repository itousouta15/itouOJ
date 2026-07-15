"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteAccountForm({
  username,
  hasPassword,
}: {
  username: string;
  hasPassword: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmUsername, setConfirmUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/user/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, confirmUsername }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "發生錯誤");
        setLoading(false);
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("發生錯誤，請稍後再試");
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button className="btn-danger" onClick={() => setOpen(true)}>
        刪除帳號
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="text-sm text-[#ff6b6b]">
        此操作無法復原，將會永久刪除你的帳號、所有提交紀錄與課程進度。
      </p>
      {hasPassword && (
        <div>
          <label className="mb-1 block text-sm font-medium">目前密碼</label>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>
      )}
      <div>
        <label className="mb-1 block text-sm font-medium">
          請輸入使用者名稱「{username}」以確認
        </label>
        <input
          className="input"
          value={confirmUsername}
          onChange={(e) => setConfirmUsername(e.target.value)}
          autoComplete="off"
          required
        />
      </div>
      {error && <p className="text-sm text-[#ff6b6b]">{error}</p>}
      <div className="flex gap-3">
        <button
          className="btn-danger"
          disabled={loading || confirmUsername !== username}
        >
          {loading ? "處理中…" : "確認刪除帳號"}
        </button>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => setOpen(false)}
          disabled={loading}
        >
          取消
        </button>
      </div>
    </form>
  );
}
