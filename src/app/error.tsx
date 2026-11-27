"use client";

import { useEffect } from "react";

// 頁面執行時發生未預期錯誤的邊界：顯示代碼與 digest，方便回報後對照 docs/error-codes.md。
export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[OJ-APP-500]", error);
  }, [error]);

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-16 text-center">
      <div
        role="alert"
        className="rounded border border-[#faa81a]/30 bg-[#faa81a]/10 px-4 py-6 text-[#faa81a]"
      >
        <p className="text-lg font-semibold">頁面發生錯誤</p>
        <p className="mt-2 text-sm">
          錯誤代碼：<code>OJ-APP-500</code>
          {error.digest ? (
            <>
              {" "}（digest：<code>{error.digest}</code>）
            </>
          ) : null}
        </p>
        <p className="mt-2 text-sm">請把代碼告訴管理員，方便快速找出原因。</p>
        <button
          type="button"
          onClick={reset}
          className="mt-4 rounded border border-[#faa81a]/40 px-3 py-1 text-sm hover:opacity-70"
        >
          重新載入
        </button>
      </div>
    </div>
  );
}
