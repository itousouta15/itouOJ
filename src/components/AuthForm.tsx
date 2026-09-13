"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { GoogleIcon, DiscordIcon } from "@/components/OAuthIcons";
import { isNativeApp } from "@/lib/capacitor";

const TURNSTILE_SITE_KEY = "0x4AAAAAAEyxZqhNBQsZiB0g";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          action: "login" | "register";
          size: "flexible";
        },
      ) => string;
      getResponse: (widgetId: string) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

export default function AuthForm({
  mode,
  googleEnabled = false,
  googleError = false,
  discordEnabled = false,
  discordError = false,
  turnstileEnabled = true,
  next = null,
}: {
  mode: "login" | "register";
  googleEnabled?: boolean;
  googleError?: boolean;
  discordEnabled?: boolean;
  discordError?: boolean;
  turnstileEnabled?: boolean;
  // 登入後導回的站內路徑（已由 safeNextPath 驗證過）
  next?: string | null;
}) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(
    googleError
      ? "Google 登入失敗，請再試一次"
      : discordError
        ? "Discord 登入失敗，請再試一次"
        : ""
  );
  const [loading, setLoading] = useState(false);
  const [oauthBusy, setOauthBusy] = useState(false);
  const [turnstileLoaded, setTurnstileLoaded] = useState(false);
  const turnstileContainer = useRef<HTMLDivElement>(null);
  const turnstileWidgetId = useRef<string | null>(null);
  const isLogin = mode === "login";
  const isApp = typeof window !== "undefined" && isNativeApp();
  const turnstileReady =
    turnstileLoaded || (typeof window !== "undefined" && Boolean(window.turnstile));

  useEffect(
    () => () => {
      if (turnstileWidgetId.current) {
        window.turnstile?.remove(turnstileWidgetId.current);
        turnstileWidgetId.current = null;
      }
    },
    [isLogin],
  );

  useEffect(() => {
    if (
      !turnstileEnabled ||
      !turnstileReady ||
      !turnstileContainer.current ||
      !window.turnstile ||
      turnstileWidgetId.current
    ) {
      return;
    }
    turnstileWidgetId.current = window.turnstile.render(turnstileContainer.current, {
      sitekey: TURNSTILE_SITE_KEY,
      action: isLogin ? "login" : "register",
      size: "flexible",
    });
  }, [turnstileEnabled, turnstileReady, isLogin]);

  function resetTurnstile() {
    if (turnstileWidgetId.current) {
      window.turnstile?.reset(turnstileWidgetId.current);
    }
  }

  // App 內 OAuth：開系統瀏覽器跑登入，完成後用一次性 code 換 session，
  // 不會污染瀏覽器的登入狀態，也不會被 WebView 封鎖。
  async function startAppOAuth(provider: "google" | "discord") {
    if (oauthBusy) return;
    setOauthBusy(true);
    setError("");
    try {
      const verifier = `${crypto.randomUUID()}${crypto.randomUUID()}`;
      const digest = await crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(verifier)
      );
      const codeChallenge = Array.from(new Uint8Array(digest), (byte) =>
        byte.toString(16).padStart(2, "0")
      ).join("");
      const res = await fetch("/api/auth/app/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, codeChallenge }),
      });
      const data = await res.json();
      if (!res.ok || !data.code) {
        setError(data.error ?? "無法開始登入");
        return;
      }
      const { Browser } = await import("@capacitor/browser");
      const handle = await Browser.addListener("browserFinished", async () => {
        handle.remove();
        try {
          const done = await fetch("/api/auth/app/complete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code: data.code, verifier }),
          });
          const result = await done.json();
          if (done.ok) {
            router.push(next ?? "/");
            router.refresh();
          } else {
            setError(result.error ?? "登入未完成，請再試一次");
          }
        } catch {
          setError("登入未完成，請再試一次");
        }
      });
      await Browser.open({
        url: new URL(data.url, window.location.origin).toString(),
      });
    } catch {
      setError("無法開啟登入視窗");
    } finally {
      setOauthBusy(false);
    }
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const turnstileToken = turnstileEnabled
      ? turnstileWidgetId.current
        ? window.turnstile?.getResponse(turnstileWidgetId.current)
        : ""
      : undefined;
    if (turnstileEnabled && !turnstileToken) {
      setError("請完成安全驗證");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, email: isLogin ? undefined : email, turnstileToken }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "發生錯誤");
        resetTurnstile();
        setLoading(false);
        return;
      }
      router.push(next ?? "/");
      router.refresh();
    } catch {
      setError("發生錯誤，請稍後再試");
      resetTurnstile();
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto mt-10 max-w-sm">
      <div className="card p-6">
        <h1 className="mb-4 text-xl font-bold">
          {isLogin ? "登入" : "註冊帳號"}
        </h1>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">
              使用者名稱
            </label>
            <input
              className="input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </div>
          {!isLogin && (
            <div>
              <label className="mb-1 block text-sm font-medium">Email</label>
              <input
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
              <p className="mt-1 text-xs text-mute">用於重設密碼，不會公開顯示。</p>
            </div>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium">密碼</label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={isLogin ? "current-password" : "new-password"}
              required
            />
          </div>
          {turnstileEnabled && (
            <>
              <Script
                id="cloudflare-turnstile"
                src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
                strategy="afterInteractive"
                onReady={() => setTurnstileLoaded(true)}
              />
              <div ref={turnstileContainer} className="w-full" />
            </>
          )}
          {error && <p className="text-sm text-[#ff6b6b]">{error}</p>}
          <button className="btn-primary w-full" disabled={loading}>
            {loading ? "處理中…" : isLogin ? "登入" : "註冊"}
          </button>
        </form>
        {isLogin && (
          <p className="mt-3 text-right text-sm">
            <Link href="/forgot-password" className="text-blue hover:underline">
              忘記密碼？
            </Link>
          </p>
        )}
        {(googleEnabled || discordEnabled) && (
          <>
            <div className="my-4 flex items-center gap-3 text-xs text-mute">
              <div className="h-px flex-1 bg-bd2" />
              或
              <div className="h-px flex-1 bg-bd2" />
            </div>
            <div className="space-y-2">
              {googleEnabled && (
                <button
                  type="button"
                  className="btn-secondary w-full"
                  disabled={oauthBusy}
                  onClick={
                    isApp
                      ? () => startAppOAuth("google")
                      : () => router.push(next ? `/api/auth/google?next=${encodeURIComponent(next)}` : "/api/auth/google")
                  }
                >
                  <GoogleIcon />
                  使用 Google {isLogin ? "登入" : "註冊"}
                </button>
              )}
              {discordEnabled && (
                <button
                  type="button"
                  className="btn-secondary w-full"
                  disabled={oauthBusy}
                  onClick={
                    isApp
                      ? () => startAppOAuth("discord")
                      : () => router.push(next ? `/api/auth/discord?next=${encodeURIComponent(next)}` : "/api/auth/discord")
                  }
                >
                  <DiscordIcon />
                  使用 Discord {isLogin ? "登入" : "註冊"}
                </button>
              )}
            </div>
          </>
        )}
        <p className="mt-4 text-center text-sm text-dim">
          {isLogin ? (
            <>
              還沒有帳號？
              <Link
                href="/register"
                className="ml-1 text-blue hover:underline"
              >
                註冊
              </Link>
            </>
          ) : (
            <>
              已經有帳號？
              <Link href="/login" className="ml-1 text-blue hover:underline">
                登入
              </Link>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
