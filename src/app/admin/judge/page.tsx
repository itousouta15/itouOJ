import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { isJudgeMonitorAdmin } from "@/lib/judgeMonitor";
import AdminJudgeMonitor from "@/components/AdminJudgeMonitor";

export const metadata: Metadata = { title: "評測監控" };
export const dynamic = "force-dynamic";

export default async function AdminJudgePage() {
  if (!isJudgeMonitorAdmin(await getSession())) redirect("/");
  return <div>
    <div className="mb-4 flex flex-wrap items-center gap-4">
      <h1 className="page-title">評測監控</h1>
      <Link href="/admin/problems" className="text-sm text-blue hover:underline">← 回管理後台</Link>
    </div>
    <AdminJudgeMonitor />
  </div>;
}
