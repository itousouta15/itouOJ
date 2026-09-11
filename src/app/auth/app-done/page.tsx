import type { Metadata } from "next";

export const metadata: Metadata = { title: "登入完成" };

// App OAuth 完成後導回的頁面（在系統瀏覽器裡），提示使用者關掉分頁回 App；
// App 偵測到分頁關閉後會用登入碼換 session。
export default function AppDonePage() {
  return (
    <div className="mx-auto mt-16 max-w-sm px-4">
      <div className="card p-8 text-center">
        <p className="mb-3 text-4xl">✅</p>
        <h1 className="mb-2 text-xl font-bold">登入完成</h1>
        <p className="text-sm leading-relaxed text-dim">
          可以關掉這個分頁回到 itouOJ App 了
        </p>
        <p className="mono mt-4 text-xs text-mute">
          if nothing happens, close this tab
        </p>
      </div>
    </div>
  );
}