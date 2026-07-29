"use client";

import { useState } from "react";

export default function ChangePasswordForm({
  hasPassword,
}: {
  hasPassword: boolean;
}) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setDone(false);
    if (newPassword !== confirmPassword) {
      setError("兩次輸入的新密碼不一致");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: hasPassword ? currentPassword : undefined,
          newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "發生錯誤");
        return;
      }
      setDone(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setError("發生錯誤，請稍後再試");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {!hasPassword && (
        <p className="text-sm text-dim">
          這個帳號目前只能用 Google／Discord 登入。設定密碼後，也可以在
          itouOJ 收件程式（離線比賽用）裡直接用帳號密碼登入，不必透過瀏覽器。
        </p>
      )}
      {hasPassword && (
        <div>
          <label className="mb-1 block text-sm font-medium">目前密碼</label>
          <input
            className="input"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>
      )}
      <div>
        <label className="mb-1 block text-sm font-medium">新密碼</label>
        <input
          className="input"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
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
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
          required
        />
      </div>
      {error && <p className="text-sm text-[#ff6b6b]">{error}</p>}
      {done && (
        <p className="text-sm text-[#4caf50]">
          {hasPassword ? "密碼已更新" : "密碼已設定，之後可以用帳號密碼登入"}
        </p>
      )}
      <button className="btn-primary" disabled={loading}>
        {loading ? "處理中…" : hasPassword ? "更新密碼" : "設定密碼"}
      </button>
    </form>
  );
}
