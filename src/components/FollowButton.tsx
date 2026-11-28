"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// 個人頁的追蹤／取消追蹤鈕。先換畫面再打 API，失敗換回來。
export default function FollowButton({
  username,
  initialFollowing,
}: {
  username: string;
  initialFollowing: boolean;
}) {
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (busy) return;
    setBusy(true);
    const next = !following;
    setFollowing(next);
    try {
      const res = await fetch(`/api/users/${username}/follow`, {
        method: next ? "POST" : "DELETE",
      });
      if (!res.ok) {
        setFollowing(!next);
        return;
      }
      // 讓 server component 重抓追蹤數
      router.refresh();
    } catch {
      setFollowing(!next);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      className={following ? "btn-secondary" : "btn-primary"}
      disabled={busy}
      onClick={toggle}
    >
      {following ? "追蹤中" : "＋ 追蹤"}
    </button>
  );
}
