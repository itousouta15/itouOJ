import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import AdminTagList from "@/components/AdminTagList";

export const metadata: Metadata = { title: "標籤管理" };
export const dynamic = "force-dynamic";

export default async function AdminTagsPage() {
  const session = await getSession();
  if (session?.role !== "ADMIN") redirect("/");

  const tags = await prisma.tag.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { problems: true } } },
  });

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <h1 className="page-title">標籤管理</h1>
          <Link
            href="/admin/problems"
            className="text-sm text-blue hover:underline"
          >
            ← 回題目管理
          </Link>
        </div>
      </div>
      <AdminTagList
        tags={tags.map((t) => ({
          id: t.id,
          name: t.name,
          problemCount: t._count.problems,
        }))}
      />
    </div>
  );
}
