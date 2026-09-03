import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import AdminRoleToggle from "@/components/AdminRoleToggle";

export const metadata: Metadata = { title: "使用者管理" };
export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const session = await getSession();
  if (session?.role !== "ADMIN") redirect("/");

  const users = await prisma.user.findMany({
    orderBy: [{ role: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      username: true,
      displayName: true,
      role: true,
      createdAt: true,
      _count: { select: { submissions: true } },
    },
  });

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <h1 className="page-title">使用者管理</h1>
          <Link
            href="/admin/problems"
            className="text-sm text-blue hover:underline"
          >
            ← 回題目管理
          </Link>
        </div>
        <p className="mono text-xs text-mute">共 {users.length} 人</p>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="table-head">使用者</th>
              <th className="table-head w-32">角色</th>
              <th className="table-head w-28 text-right">提交數</th>
              <th className="table-head w-40">註冊時間</th>
              <th className="table-head w-44">操作</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-panel2">
                <td className="table-cell">
                  <Link
                    href={`/users/${u.username}`}
                    className="font-medium text-blue hover:underline"
                  >
                    {u.displayName || u.username}
                  </Link>
                  <span className="mono ml-2 text-xs text-mute">
                    @{u.username}
                  </span>
                </td>
                <td className="table-cell">
                  {u.role === "ADMIN" ? (
                    <span className="vbadge vbadge-purple">管理員</span>
                  ) : (
                    <span className="vbadge vbadge-gray">一般使用者</span>
                  )}
                </td>
                <td className="table-cell mono text-right text-dim">
                  {u._count.submissions}
                </td>
                <td className="table-cell text-dim">
                  {u.createdAt.toLocaleString("zh-TW", {
                    timeZone: "Asia/Taipei",
                    hour12: false,
                  })}
                </td>
                <td className="table-cell">
                  {u.id === session.userId ? (
                    <span className="text-xs text-mute">（自己）</span>
                  ) : (
                    <AdminRoleToggle userId={u.id} role={u.role} />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs leading-relaxed text-mute">
        權限變更後，對方需要重新登入才會生效（登入狀態存在瀏覽器 session
        裡）。不能修改自己的角色，避免站上完全沒有管理員。
      </p>
    </div>
  );
}