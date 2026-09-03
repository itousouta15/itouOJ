"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GoogleIcon, DiscordIcon } from "@/components/OAuthIcons";
import { isNativeApp } from "@/lib/capacitor";

const ERROR_MESSAGES: Record<string, string> = {
  google: "Google 連結失敗，請再試一次",
  discord: "Discord 連結失敗，請再試一次",
  google_taken: "這個 Google 帳號已經連結到別的使用者了",
  discord_taken: "這個 Discord 帳號已經連結到別的使用者了",
};

const SUCCESS_MESSAGES: Record<string, string> = {
  google: "已連結 Google 帳號",
  discord: "已連結 Discord 帳號",
};

interface Provider {
  key: "google" | "discord";
  label: string;
  icon: React.ReactNode;
  linked: boolean;
  enabled: boolean;
}

export default function LinkedAccounts({
  googleLinked,
  discordLinked,
  googleEnabled,
  discordEnabled,
  canUnlink,
  initialLinked,
  initialError,
}: {
  googleLinked: boolean;
  discordLinked: boolean;
  googleEnabled: boolean;
  discordEnabled: boolean;
  canUnlink: boolean;
  initialLinked?: string;
  initialError?: string;
}) {
  const router = useRouter();
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(
    initialError
      ? { type: "err", text: ERROR_MESSAGES[initialError] ?? "連結失敗，請再試一次" }
      : initialLinked
        ? { type: "ok", text: SUCCESS_MESSAGES[initialLinked] ?? "已連結" }
        : null
  );
  const [pending, setPending] = useState<string | null>(null);
  const isApp = typeof window !== "undefined" && isNativeApp();

  // App 內連結帳號：開系統瀏覽器跑 OAuth（同登入流程），
  // 關掉分頁後用一次性 code 確認完成
  async function linkAccount(provider: "google" | "discord") {
    setPending(provider);
    setMessage(null);
    try {
      const res = await fetch(
        `/api/auth/app/start?provider=${provider}&link=1`
      );
      const data = await res.json();
      if (!res.ok || !data.code) {
        setMessage({ type: "err", text: data.error ?? "無法開始連結" });
        return;
      }
      const { Browser } = await import("@capacitor/browser");
      const handle = await Browser.addListener("browserFinished", async () => {
        handle.remove();
        setPending(null);
        router.refresh();
      });
      await Browser.open({
        url: new URL(data.url, window.location.origin).toString(),
      });
    } catch {
      setMessage({ type: "err", text: "發生錯誤，請稍後再試" });
      setPending(null);
    }
  }

  const providers: Provider[] = [
    {
      key: "google",
      label: "Google",
      icon: <GoogleIcon />,
      linked: googleLinked,
      enabled: googleEnabled,
    },
    {
      key: "discord",
      label: "Discord",
      icon: <DiscordIcon />,
      linked: discordLinked,
      enabled: discordEnabled,
    },
  ];

  async function unlink(provider: "google" | "discord") {
    setPending(provider);
    setMessage(null);
    try {
      const res = await fetch(`/api/auth/${provider}/unlink`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "err", text: data.error ?? "發生錯誤" });
        return;
      }
      router.refresh();
    } catch {
      setMessage({ type: "err", text: "發生錯誤，請稍後再試" });
    } finally {
      setPending(null);
    }
  }

  const visibleProviders = providers.filter((p) => p.enabled || p.linked);
  if (visibleProviders.length === 0) return null;

  return (
    <div className="space-y-3">
      {visibleProviders.map((p) => (
        <div
          key={p.key}
          className="flex items-center justify-between rounded-xl bg-inset px-4 py-3"
        >
          <div className="flex items-center gap-3">
            {p.icon}
            <span className="text-sm font-medium">{p.label}</span>
            {p.linked && <span className="vbadge vbadge-blue">已連結</span>}
          </div>
          {p.linked ? (
            <button
              className="btn-danger"
              disabled={!canUnlink || pending === p.key}
              title={!canUnlink ? "至少要保留一種登入方式" : undefined}
              onClick={() => unlink(p.key)}
            >
              {pending === p.key ? "處理中…" : "解除連結"}
            </button>
          ) : p.enabled ? (
            <button
              className="btn-secondary"
              disabled={pending === p.key}
              onClick={
                isApp
                  ? () => linkAccount(p.key)
                  : () => router.push(`/api/auth/${p.key}?link=1`)
              }
            >
              {pending === p.key ? "處理中…" : "連結"}
            </button>
          ) : null}
        </div>
      ))}
      {message && (
        <p className={`text-sm ${message.type === "err" ? "text-[#ff6b6b]" : "text-[#4caf50]"}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}
