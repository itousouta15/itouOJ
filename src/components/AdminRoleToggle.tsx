"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminRoleToggle({
  userId,
  role,
}: {
  userId: string;
  role: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function setRole(next: "USER" | "ADMIN") {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: next }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "變更失敗");
        return;
      }
      router.refresh();
    } catch {
      setError("變更失敗，請稍後再試");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      {role === "ADMIN" ? (
        <button
          className="btn-danger"
          disabled={busy}
          onClick={() => setRole("USER")}
        >
          {busy ? "處理中…" : "降為一般使用者"}
        </button>
      ) : (
        <button
          className="btn-secondary"
          disabled={busy}
          onClick={() => setRole("ADMIN")}
        >
          {busy ? "處理中…" : "設為管理員"}
        </button>
      )}
      {error && <p className="text-xs text-[#ff6b6b]">{error}</p>}
    </div>
  );
}