import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import AdminCourseTable from "@/components/AdminCourseTable";

export const metadata: Metadata = { title: "課程管理" };
export const dynamic = "force-dynamic";

export default async function AdminCoursesPage() {
  const session = await getSession();
  if (session?.role !== "ADMIN") redirect("/");

  const courses = await prisma.course.findMany({
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    include: { _count: { select: { problems: true, members: true } } },
  });

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <h1 className="page-title">課程管理</h1>
          <Link
            href="/admin/problems"
            className="text-sm text-blue hover:underline"
          >
            題目管理 →
          </Link>
          <Link
            href="/admin/announcements"
            className="text-sm text-blue hover:underline"
          >
            公告管理 →
          </Link>
          <Link
            href="/admin/contests"
            className="text-sm text-blue hover:underline"
          >
            比賽管理 →
          </Link>
        </div>
        <Link href="/admin/courses/new" className="btn-primary">
          ＋ 新增課程
        </Link>
      </div>
      <AdminCourseTable
        key={courses.map((course) => `${course.id}:${course.sortOrder}`).join(",")}
        courses={courses}
      />
    </div>
  );
}
