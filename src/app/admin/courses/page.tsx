import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = { title: "課程管理" };
export const dynamic = "force-dynamic";

export default async function AdminCoursesPage() {
  const session = await getSession();
  if (session?.role !== "ADMIN") redirect("/");

  const courses = await prisma.course.findMany({
    orderBy: { id: "asc" },
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
        </div>
        <Link href="/admin/courses/new" className="btn-primary">
          ＋ 新增課程
        </Link>
      </div>
      <p className="mono mb-2 text-[11px] text-mute sm:hidden">
        ← 左右滑動可看到更多欄位 →
      </p>
      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="table-head w-16">#</th>
              <th className="table-head">標題</th>
              <th className="table-head w-24 text-right">題數</th>
              <th className="table-head w-24 text-right">成員</th>
              <th className="table-head w-28">加入代碼</th>
              <th className="table-head w-24">狀態</th>
              <th className="table-head w-24"></th>
            </tr>
          </thead>
          <tbody>
            {courses.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="table-cell py-10 text-center text-mute"
                >
                  還沒有課程
                </td>
              </tr>
            )}
            {courses.map((c) => (
              <tr key={c.id} className="hover:bg-panel2">
                <td className="table-cell text-dim">{c.id}</td>
                <td className="table-cell">
                  <Link
                    href={`/courses/${c.id}`}
                    className="font-medium text-blue hover:underline"
                  >
                    {c.title}
                  </Link>
                </td>
                <td className="table-cell text-right text-dim">
                  {c._count.problems}
                </td>
                <td className="table-cell text-right text-dim">
                  {c._count.members}
                </td>
                <td className="table-cell">
                  {c.joinCode ? (
                    <span className="mono text-sm text-purple">
                      {c.joinCode}
                    </span>
                  ) : (
                    <span className="text-sm text-mute">開放加入</span>
                  )}
                </td>
                <td className="table-cell">
                  {c.isPublic ? (
                    <span className="vbadge vbadge-green">公開</span>
                  ) : (
                    <span className="vbadge vbadge-gray">未公開</span>
                  )}
                </td>
                <td className="table-cell">
                  <Link
                    href={`/admin/courses/${c.id}/edit`}
                    className="text-sm text-blue hover:underline"
                  >
                    編輯
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
