"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Google 官方四色 G logo
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

export default function AuthForm({
  mode,
  googleEnabled = false,
  googleError = false,
}: {
  mode: "login" | "register";
  googleEnabled?: boolean;
  googleError?: boolean;
}) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(
    googleError ? "Google 登入失敗，請再試一次" : ""
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
        {googleEnabled && (
          <>
            <div className="my-4 flex items-center gap-3 text-xs text-mute">
              <div className="h-px flex-1 bg-bd2" />
              或
              <div className="h-px flex-1 bg-bd2" />
            </div>
            <a href="/api/auth/google" className="btn-secondary w-full">
              <GoogleIcon />
              使用 Google {isLogin ? "登入" : "註冊"}
            </a>
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
