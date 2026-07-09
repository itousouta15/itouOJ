import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import DifficultyBadge from "@/components/DifficultyBadge";

export const metadata: Metadata = { title: "題目管理" };
export const dynamic = "force-dynamic";

export default async function AdminProblemsPage() {
  const session = await getSession();
  if (session?.role !== "ADMIN") redirect("/");

  const problems = await prisma.problem.findMany({
    orderBy: { id: "asc" },
    include: { _count: { select: { testCases: true, submissions: true } } },
  });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="page-title">題目管理</h1>
        <Link href="/admin/problems/new" className="btn-primary">
          ＋ 新增題目
        </Link>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="table-head w-16">#</th>
              <th className="table-head">標題</th>
              <th className="table-head w-24">難度</th>
              <th className="table-head w-20 text-right">測資</th>
              <th className="table-head w-20 text-right">提交</th>
              <th className="table-head w-24">狀態</th>
              <th className="table-head w-20"></th>
            </tr>
          </thead>
          <tbody>
            {problems.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="table-cell py-10 text-center text-mute"
                >
                  還沒有題目，點右上角「新增題目」開始出題
                </td>
              </tr>
            )}
            {problems.map((p) => (
              <tr key={p.id} className="hover:bg-panel2">
                <td className="table-cell text-dim">{p.id}</td>
                <td className="table-cell font-medium">
                  <Link
                    href={`/problems/${p.id}`}
                    className="text-blue hover:underline"
                  >
                    {p.title}
                  </Link>
                </td>
                <td className="table-cell">
                  <DifficultyBadge difficulty={p.difficulty} />
                </td>
                <td className="table-cell text-right text-dim">
                  {p._count.testCases}
                </td>
                <td className="table-cell text-right text-dim">
                  {p._count.submissions}
                </td>
                <td className="table-cell text-sm text-dim">
                  {p.isPublic ? "公開" : "未公開"}
                </td>
                <td className="table-cell">
                  <Link
                    href={`/admin/problems/${p.id}/edit`}
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
