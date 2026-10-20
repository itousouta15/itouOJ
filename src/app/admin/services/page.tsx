import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import AdminServices from "@/components/AdminServices";

export const metadata: Metadata = { title: "伺服器服務" };
export const dynamic = "force-dynamic";

export default async function AdminServicesPage() {
  if ((await getSession())?.role !== "ADMIN") redirect("/");
  return <div>
    <div className="mb-4 flex flex-wrap items-center gap-4">
      <h1 className="page-title">伺服器服務</h1>
      <Link href="/admin/judge" className="text-sm text-blue hover:underline">← 回評測監控</Link>
      <Link href="/admin/hosts" className="text-sm text-blue hover:underline">設定遠端 Server →</Link>
    </div>
    <AdminServices />
  </div>;
}
