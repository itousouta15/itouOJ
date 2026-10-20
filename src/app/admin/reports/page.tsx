import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { listReports } from "@/lib/reportData";
import type { ReportSearchParams } from "@/lib/reportSchema";
import ReportList from "@/components/ReportList";

export const metadata: Metadata = {
  title: "錯誤回報管理",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";
export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<ReportSearchParams>;
}) {
  const session = await getSession();
  if (session?.role !== "ADMIN") redirect("/");
  const result = await listReports(session, await searchParams, true);
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="space-y-2">
        <Link
          href="/admin/problems"
          className="text-sm text-blue hover:underline"
        >
          ← 管理後台
        </Link>
        <h1 className="page-title">錯誤回報管理</h1>
        <p className="text-sm text-dim">
          集中處理教學、動畫、程式、題目與網站問題。點選回報即可回覆、更新狀態或重新開啟。
        </p>
      </header>
      <ReportList result={result} admin />
    </div>
  );
}
