import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSession } from "@/lib/auth";
import DesktopAuthPanel from "@/components/DesktopAuthPanel";

export const metadata: Metadata = { title: "授權收件程式" };
export const dynamic = "force-dynamic";

// 離線收件程式的登入流程（同 gh CLI / AWS CLI 那套 loopback 做法）：
//
//   收件程式在 127.0.0.1 開一個臨時 port，用預設瀏覽器打開這一頁
//     → 沒登入就先導去登入頁（帳密 / Google / Discord 都可以，登入後回到這裡）
//     → 使用者確認授權
//     → 瀏覽器把 token 導回 http://127.0.0.1:<port>/callback
//
// 這樣桌面程式完全不需要碰密碼，而且用 Google 註冊、根本沒有密碼的帳號
// 也能登入收件程式 —— 這是原本用帳密登入時做不到的。
export default async function DesktopAuthPage({
  searchParams,
}: {
  searchParams: Promise<{ port?: string; state?: string }>;
}) {
  const { port, state } = await searchParams;

  const portNum = Number(port);
  const validPort =
    Number.isInteger(portNum) && portNum >= 1024 && portNum <= 65535;
  // state 由收件程式產生，回呼時原樣帶回去給它比對，確認這次授權是它自己發起的
  const validState = typeof state === "string" && /^[A-Za-z0-9_-]{8,64}$/.test(state);

  const session = await getSession();
  if (!session) {
    const next = `/desktop-auth?port=${portNum}&state=${encodeURIComponent(state ?? "")}`;
    redirect(`/login?next=${encodeURIComponent(next)}`);
  }

  if (!validPort || !validState) {
    return (
      <div className="mx-auto mt-10 max-w-md">
        <div className="card p-6">
          <h1 className="mb-3 section-title">授權連結無效</h1>
          <p className="text-sm text-dim">
            這個頁面是給 itouOJ 收件程式用的。請從收件程式裡按「登入」，
            不要直接開啟這個網址。
          </p>
        </div>
      </div>
    );
  }

  return (
    <DesktopAuthPanel
      port={portNum}
      state={state!}
      username={session.username}
    />
  );
}
