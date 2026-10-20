import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { findReport } from "@/lib/reportData";
import {
  REPORT_CATEGORIES,
  REPORT_SECTIONS,
  REPORT_STATUSES,
  type ReportSearchParams,
} from "@/lib/reportSchema";
import ReportStatusForm from "@/components/ReportStatusForm";

export const dynamic = "force-dynamic";
export default async function ReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<ReportSearchParams>;
}) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect(`/login?next=${encodeURIComponent(`/reports/${id}`)}`);
  const report = await findReport(session, Number(id));
  if (!report) notFound();
  const isAdmin = session.role === "ADMIN";
  const submitted = (await searchParams).submitted === "1";
  return (
    <>
      <Link
        href={isAdmin ? "/admin/reports" : "/reports"}
        className="text-sm text-blue hover:underline"
      >
        ← {isAdmin ? "回報管理" : "我的回報"}
      </Link>
      {submitted && (
        <p
          role="status"
          className="rounded-lg border border-green/30 bg-green/5 p-4 text-sm"
        >
          回報已送出，編號 #{report.id}。可在這裡追蹤處理狀態。
        </p>
      )}
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="mono text-sm text-mute">#{report.id}</span>
          <span className="vbadge vbadge-blue">
            {REPORT_STATUSES[report.status as keyof typeof REPORT_STATUSES]}
          </span>
          <span className="text-sm text-dim">
            {
              REPORT_CATEGORIES[
                report.category as keyof typeof REPORT_CATEGORIES
              ]
            }{" "}
            · {REPORT_SECTIONS[report.section as keyof typeof REPORT_SECTIONS]}
          </span>
        </div>
        <h1 className="page-title break-words">{report.title}</h1>
        <p className="text-xs leading-6 text-mute">
          回報者：{report.reporter.displayName || report.reporter.username} ·
          建立於{" "}
          {report.createdAt.toLocaleString("zh-TW", {
            timeZone: "Asia/Taipei",
          })}
          <br />
          最後更新：
          {report.updatedAt.toLocaleString("zh-TW", {
            timeZone: "Asia/Taipei",
          })}
        </p>
      </header>
      <section className="card space-y-5 p-4 sm:p-6">
        {report.sourcePath && (
          <div>
            <h2 className="text-sm font-semibold">來源頁面</h2>
            <Link
              href={report.sourcePath}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 block break-all text-sm text-blue hover:underline"
              prefetch={false}
            >
              {report.sourcePath} ↗
            </Link>
          </div>
        )}
        {report.context && (
          <div>
            <h2 className="text-sm font-semibold">來源補充</h2>
            <p className="mt-2 whitespace-pre-wrap break-words text-sm text-dim">
              {report.context}
            </p>
          </div>
        )}
        <div>
          <h2 className="section-title">問題說明與重現步驟</h2>
          <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-dim">
            {report.description}
          </p>
        </div>
        {report.expected && (
          <div>
            <h2 className="section-title">預期結果</h2>
            <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-dim">
              {report.expected}
            </p>
          </div>
        )}
      </section>
      <section className="card p-4 sm:p-6">
        <h2 className="section-title">處理回覆</h2>
        <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-dim">
          {report.adminReply || "管理員尚未回覆。"}
        </p>
      </section>
      {isAdmin && (
        <ReportStatusForm
          key={report.updatedAt.toISOString()}
          id={report.id}
          status={report.status}
          adminReply={report.adminReply}
          updatedAt={report.updatedAt.toISOString()}
        />
      )}
      <p className="text-xs text-mute">
        此回報僅本人與管理員可查看，不公開於題目或教學頁。
      </p>
    </>
  );
}
