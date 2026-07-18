import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import ContestStatusBadge from "@/components/ContestStatusBadge";

export const metadata: Metadata = { title: "比賽管理" };
export const dynamic = "force-dynamic";

export default async function AdminContestsPage() {
  const session = await getSession();
  if (session?.role !== "ADMIN") redirect("/");

  const contests = await prisma.contest.findMany({
    orderBy: { id: "desc" },
    include: { _count: { select: { problems: true, participants: true } } },
  });

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <h1 className="page-title">比賽管理</h1>
          <Link href="/admin/problems" className="text-sm text-blue hover:underline">
            題目管理 →
          </Link>
          <Link href="/admin/courses" className="text-sm text-blue hover:underline">
            課程管理 →
          </Link>
          <Link href="/admin/announcements" className="text-sm text-blue hover:underline">
            公告管理 →
          </Link>
        </div>
        <Link href="/admin/contests/new" className="btn-primary">
          ＋ 新增比賽
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
              <th className="table-head w-24">狀態</th>
              <th className="table-head w-24 text-right">題數</th>
              <th className="table-head w-24 text-right">參賽者</th>
              <th className="table-head w-28">加入代碼</th>
              <th className="table-head w-24"></th>
            </tr>
          </thead>
          <tbody>
            {contests.length === 0 && (
              <tr>
                <td colSpan={7} className="table-cell py-10 text-center text-mute">
                  還沒有比賽
                </td>
              </tr>
            )}
            {contests.map((c) => (
              <tr key={c.id} className="hover:bg-panel2">
                <td className="table-cell text-dim">{c.id}</td>
                <td className="table-cell">
                  <Link
                    href={`/contests/${c.id}`}
                    className="font-medium text-blue hover:underline"
                  >
                    {c.title}
                  </Link>
                </td>
                <td className="table-cell">
                  <ContestStatusBadge contest={c} />
                </td>
                <td className="table-cell text-right text-dim">
                  {c._count.problems}
                </td>
                <td className="table-cell text-right text-dim">
                  {c._count.participants}
                </td>
                <td className="table-cell">
                  {c.joinCode ? (
                    <span className="mono text-sm text-purple">{c.joinCode}</span>
                  ) : (
                    <span className="text-sm text-mute">開放報名</span>
                  )}
                </td>
                <td className="table-cell">
                  <Link
                    href={`/admin/contests/${c.id}/edit`}
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
