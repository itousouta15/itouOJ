import Link from "next/link";

export default function CtfPagination({ path, page, hasNext, query = {} }: {
  path: string; page: number; hasNext: boolean; query?: Record<string, string | undefined>;
}) {
  function href(number: number) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) if (value) params.set(key, value);
    params.set("page", String(number));
    return `${path}?${params}`;
  }
  return <nav aria-label="分頁" className="mt-5 flex items-center justify-center gap-4 text-sm">
    {page > 1 && <Link className="btn-secondary" href={href(page - 1)}>上一頁</Link>}
    <span>第 {page} 頁</span>
    {hasNext && <Link className="btn-secondary" href={href(page + 1)}>下一頁</Link>}
  </nav>;
}
