"use client";

import Link from "next/link";
import { useState } from "react";

export default function ResetPasswordForm({ token }: { token: string }) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (newPassword !== confirmPassword) {
      setError("兩次輸入的新密碼不一致");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/auth/password-reset/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "重設失敗，請重新申請連結");
        return;
      }
      setDone(true);
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setError("發生錯誤，請稍後再試");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <p className="text-sm text-[var(--green)]">
        密碼已重設，請 <Link href="/login" className="text-blue hover:underline">重新登入</Link>。
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium">新密碼</label>
        <input
          className="input"
          type="password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          autoComplete="new-password"
          required
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">確認新密碼</label>
        <input
          className="input"
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          autoComplete="new-password"
          required
        />
      </div>
      {error && <p className="text-sm text-[#ff6b6b]">{error}</p>}
      <button className="btn-primary" disabled={loading}>
        {loading ? "重設中…" : "重設密碼"}
      </button>
    </form>
  );
}
