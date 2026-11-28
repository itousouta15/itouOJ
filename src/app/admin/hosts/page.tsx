import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import AdminHosts from "@/components/AdminHosts";

export const metadata: Metadata = { title: "Server 管理" };
export const dynamic = "force-dynamic";

export default async function AdminHostsPage() {
  if ((await getSession())?.role !== "ADMIN") redirect("/");
  return <div>
    <div className="mb-4 flex flex-wrap items-center gap-4">
      <h1 className="page-title">Server 管理</h1>
      <Link href="/admin/services" className="text-sm text-blue hover:underline">← 回伺服器服務</Link>
    </div>
    <AdminHosts />
  </div>;
}
