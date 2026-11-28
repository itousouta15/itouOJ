import Link from "next/link";
import { pageWindow } from "@/lib/pagination";

// 伺服器端分頁導覽：只列出首尾與目前頁附近的頁碼。
export default function ListPagination({
  currentPage,
  totalPages,
  hrefFor,
  label = "分頁",
}: {
  currentPage: number;
  totalPages: number;
  hrefFor: (page: number) => string;
  label?: string;
}) {
  if (totalPages <= 1) return null;
  return (
    <nav
      className="mt-4 flex flex-wrap items-center justify-center gap-2 text-sm"
      aria-label={label}
    >
      {currentPage > 1 ? (
        <Link href={hrefFor(currentPage - 1)} prefetch={false} className="btn-secondary">
          上一頁
        </Link>
      ) : (
        <span className="btn-secondary cursor-not-allowed opacity-50">上一頁</span>
      )}
      {pageWindow(currentPage, totalPages).map((page, index) =>
        page === null ? (
          <span key={`gap-${index}`} className="text-mute" aria-hidden="true">
            …
          </span>
        ) : (
          <Link
            key={page}
            href={hrefFor(page)}
            prefetch={false}
            aria-current={page === currentPage ? "page" : undefined}
            className={`pill ${page === currentPage ? "pill-active" : ""}`}
          >
            {page}
          </Link>
        ),
      )}
      {currentPage < totalPages ? (
        <Link href={hrefFor(currentPage + 1)} prefetch={false} className="btn-secondary">
          下一頁
        </Link>
      ) : (
        <span className="btn-secondary cursor-not-allowed opacity-50">下一頁</span>
      )}
    </nav>
  );
}
