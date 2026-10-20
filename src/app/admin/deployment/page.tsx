import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import AdminDeployment from "@/components/AdminDeployment";

export const metadata: Metadata = { title: "GitHub 部署" };
export const dynamic = "force-dynamic";

export default async function AdminDeploymentPage() {
  if ((await getSession())?.role !== "ADMIN") redirect("/");
  return <div>
    <div className="mb-4 flex flex-wrap items-center gap-4">
      <h1 className="page-title">GitHub 部署</h1>
      <Link href="/admin/services" className="text-sm text-blue hover:underline">← 回伺服器服務</Link>
    </div>
    <AdminDeployment />
  </div>;
}
