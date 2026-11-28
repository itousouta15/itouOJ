"use client";

import { useState, useSyncExternalStore } from "react";
import { isNativeApp, shareUrl } from "@/lib/capacitor";

function subscribeNativePlatform() {
  return () => {};
}

export default function AppShareButton({
  title,
  path,
}: {
  title: string;
  path: string;
}) {
  const isApp = useSyncExternalStore(
    subscribeNativePlatform,
    isNativeApp,
    () => false,
  );
  const [sharing, setSharing] = useState(false);

  if (!isApp) return null;

  async function share() {
    if (sharing) return;
    setSharing(true);
    try {
      await shareUrl({ title, path });
    } finally {
      setSharing(false);
    }
  }

  return (
    <button
      type="button"
      className="btn-secondary px-3 py-1.5 text-xs"
      onClick={share}
      disabled={sharing}
      aria-label={`分享${title}`}
    >
      {sharing ? "開啟中…" : "分享題目"}
    </button>
  );
}
