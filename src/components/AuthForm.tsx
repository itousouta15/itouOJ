"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GoogleIcon, DiscordIcon } from "@/components/OAuthIcons";

export default function AuthForm({
  mode,
  googleEnabled = false,
  googleError = false,
  discordEnabled = false,
  discordError = false,
}: {
  mode: "login" | "register";
  googleEnabled?: boolean;
  googleError?: boolean;
  discordEnabled?: boolean;
  discordError?: boolean;
}) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(
    googleError
      ? "Google 登入失敗，請再試一次"
      : discordError
        ? "Discord 登入失敗，請再試一次"
        : ""
  );
  const [loading, setLoading] = useState(false);
  const isLogin = mode === "login";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
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
          {error && <p className="text-sm text-[#ff6b6b]">{error}</p>}
          <button className="btn-primary w-full" disabled={loading}>
            {loading ? "處理中…" : isLogin ? "登入" : "註冊"}
          </button>
        </form>
        {(googleEnabled || discordEnabled) && (
          <>
            <div className="my-4 flex items-center gap-3 text-xs text-mute">
              <div className="h-px flex-1 bg-bd2" />
              或
              <div className="h-px flex-1 bg-bd2" />
            </div>
            <div className="space-y-2">
              {googleEnabled && (
                <a href="/api/auth/google" className="btn-secondary w-full">
                  <GoogleIcon />
                  使用 Google {isLogin ? "登入" : "註冊"}
                </a>
              )}
              {discordEnabled && (
                <a href="/api/auth/discord" className="btn-secondary w-full">
                  <DiscordIcon />
                  使用 Discord {isLogin ? "登入" : "註冊"}
                </a>
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
