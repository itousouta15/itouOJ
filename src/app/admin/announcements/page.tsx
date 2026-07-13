import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = { title: "公告管理" };
export const dynamic = "force-dynamic";

export default async function AdminAnnouncementsPage() {
  const session = await getSession();
  if (session?.role !== "ADMIN") redirect("/");

  const announcements = await prisma.announcement.findMany({
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
  });

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <h1 className="page-title">公告管理</h1>
          <Link
            href="/admin/problems"
            className="text-sm text-blue hover:underline"
          >
            題目管理 →
          </Link>
          <Link
            href="/admin/courses"
            className="text-sm text-blue hover:underline"
          >
            課程管理 →
          </Link>
        </div>
        <Link href="/admin/announcements/new" className="btn-primary">
          ＋ 新增公告
        </Link>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="table-head w-16">#</th>
              <th className="table-head">標題</th>
              <th className="table-head w-20">置頂</th>
              <th className="table-head w-40">發布時間</th>
              <th className="table-head w-20"></th>
            </tr>
          </thead>
          <tbody>
            {announcements.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="table-cell py-10 text-center text-mute"
                >
                  還沒有公告，點右上角「新增公告」開始發布
                </td>
              </tr>
            )}
            {announcements.map((a) => (
              <tr key={a.id} className="hover:bg-panel2">
                <td className="table-cell text-dim">{a.id}</td>
                <td className="table-cell font-medium">
                  <Link
                    href={`/announcements/${a.id}`}
                    className="text-blue hover:underline"
                  >
                    {a.title}
                  </Link>
                </td>
                <td className="table-cell">
                  {a.isPinned ? (
                    <span className="vbadge vbadge-green">置頂</span>
                  ) : (
                    <span className="text-sm text-mute">—</span>
                  )}
                </td>
                <td className="table-cell text-sm text-dim">
                  {a.createdAt.toLocaleString("zh-TW", {
                    timeZone: "Asia/Taipei",
                    hour12: false,
                  })}
                </td>
                <td className="table-cell">
                  <Link
                    href={`/admin/announcements/${a.id}/edit`}
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
