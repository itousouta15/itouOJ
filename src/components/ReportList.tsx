import Link from "next/link";
import { REPORT_CATEGORIES, REPORT_STATUSES } from "@/lib/reportSchema";
import type { listReports } from "@/lib/reportData";

export default function ReportList({
  result,
  admin = false,
}: {
  result: Awaited<ReturnType<typeof listReports>>;
  admin?: boolean;
}) {
  const { reports, total, filters } = result;
  const base = admin ? "/admin/reports" : "/reports";
  function pageHref(page: number) {
    const query = new URLSearchParams({ page: String(page) });
    if (filters.status) query.set("status", filters.status);
    if (filters.category) query.set("category", filters.category);
    if (filters.query) query.set("q", filters.query);
    return `${base}?${query}`;
  }
  return (
    <div className="space-y-4">
      <form action={base} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-sm">
          狀態
          <select
            name="status"
            className="input mt-1 w-full"
            defaultValue={filters.status ?? ""}
          >
            <option value="">全部狀態</option>
            {Object.entries(REPORT_STATUSES).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          類別
          <select
            name="category"
            className="input mt-1 w-full"
            defaultValue={filters.category ?? ""}
          >
            <option value="">全部類別</option>
            {Object.entries(REPORT_CATEGORIES).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          標題／頁面搜尋
          <input
            name="q"
            type="search"
            className="input mt-1 w-full"
            maxLength={120}
            defaultValue={filters.query}
            placeholder="題號、名稱或路徑"
          />
        </label>
        <div className="flex items-end gap-3">
          <button className="btn-secondary" type="submit">
            篩選
          </button>
          <Link href={base} className="py-2 text-sm text-blue">
            清除
          </Link>
        </div>
      </form>
      <p className="text-sm text-dim">共 {total} 筆回報</p>
      <div className="card divide-y divide-bd">
        {reports.length === 0 && (
          <p className="p-6 text-dim">目前沒有符合條件的回報。</p>
        )}
        {reports.map((report) => (
          <Link
            key={report.id}
            href={`/reports/${report.id}`}
            className="block space-y-2 p-4 hover:bg-panel2 sm:p-5"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="mono text-xs text-mute">#{report.id}</span>
              <span className="vbadge vbadge-blue">
                {REPORT_STATUSES[
                  report.status as keyof typeof REPORT_STATUSES
                ] ?? report.status}
              </span>
              <span className="text-xs text-dim">
                {REPORT_CATEGORIES[
                  report.category as keyof typeof REPORT_CATEGORIES
                ] ?? report.category}
              </span>
            </div>
            <h2 className="break-words font-semibold text-blue">
              {report.title}
            </h2>
            <p className="text-xs text-mute">
              {admin &&
                `${report.reporter.displayName || report.reporter.username} · `}
              更新於{" "}
              {report.updatedAt.toLocaleString("zh-TW", {
                timeZone: "Asia/Taipei",
              })}
            </p>
          </Link>
        ))}
      </div>
      <nav
        aria-label="回報分頁"
        className="flex flex-wrap items-center justify-between gap-3 text-sm"
      >
        <span className="text-dim">
          第 {filters.page} 頁／共 {Math.max(1, Math.ceil(total / 20))} 頁
        </span>
        <div className="flex gap-3">
          {filters.page > 1 && (
            <Link href={pageHref(filters.page - 1)} className="btn-secondary">
              上一頁
            </Link>
          )}
          {filters.page * 20 < total && (
            <Link href={pageHref(filters.page + 1)} className="btn-secondary">
              下一頁
            </Link>
          )}
        </div>
      </nav>
    </div>
  );
}
