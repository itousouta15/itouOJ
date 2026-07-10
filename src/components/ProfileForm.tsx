"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ProfileForm({
  initialDisplayName,
  initialBio,
}: {
  initialDisplayName: string;
  initialBio: string;
}) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [bio, setBio] = useState(initialBio);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setDone(false);
    setLoading(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName, bio }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "發生錯誤");
        return;
      }
      setDone(true);
      router.refresh(); // 讓 navbar 的顯示名稱即時更新
    } catch {
      setError("發生錯誤，請稍後再試");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium">顯示名稱</label>
        <input
          className="input"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="未設定時顯示使用者名稱"
          maxLength={30}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">自我介紹</label>
        <textarea
          className="input min-h-24 resize-y"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="寫點什麼吧…"
          maxLength={500}
        />
      </div>
      {error && <p className="text-sm text-[#ff6b6b]">{error}</p>}
      {done && <p className="text-sm text-[#4caf50]">個人資料已更新</p>}
      <button className="btn-primary" disabled={loading}>
        {loading ? "處理中…" : "儲存"}
      </button>
    </form>
  );
}
