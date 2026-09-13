"use client";

import { useState } from "react";

export default function ForgotPasswordForm() {
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/auth/password-reset/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "發生錯誤，請稍後再試");
        return;
      }
      setDone(true);
    } catch {
      setError("發生錯誤，請稍後再試");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="text-sm leading-relaxed text-dim">
        輸入使用者名稱後，若帳號已設定 recovery email，會收到 30 分鐘有效的重設連結。
      </p>
      <div>
        <label className="mb-1 block text-sm font-medium">使用者名稱</label>
        <input
          className="input"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          autoComplete="username"
          required
        />
      </div>
      {error && <p className="text-sm text-[#ff6b6b]">{error}</p>}
      {done && (
        <p className="text-sm text-[var(--green)]">
          若帳號已設定 recovery email，重設連結將寄到該信箱。
        </p>
      )}
      <button className="btn-primary" disabled={loading}>
        {loading ? "寄送中…" : "寄送重設連結"}
      </button>
    </form>
  );
}
