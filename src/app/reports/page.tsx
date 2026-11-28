import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { listReports } from "@/lib/reportData";
import type { ReportSearchParams } from "@/lib/reportSchema";
import ReportList from "@/components/ReportList";

export const dynamic = "force-dynamic";
export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<ReportSearchParams>;
}) {
  const session = await getSession();
  if (!session) redirect("/login?next=/reports");
  const result = await listReports(session, await searchParams);
  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="page-title">我的回報</h1>
          <p className="mt-2 text-sm text-dim">
            只顯示你提交的回報；點選可查看處理狀態與管理員回覆。
          </p>
        </div>
        <Link href="/reports/new" className="btn-primary">
          ＋ 回報錯誤
        </Link>
      </header>
      {session.role === "ADMIN" && (
        <Link
          href="/admin/reports"
          className="inline-block text-sm text-blue hover:underline"
        >
          前往回報管理 →
        </Link>
      )}
      <ReportList result={result} />
    </>
  );
}
