import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import TagBadge from "@/components/TagBadge";

export const metadata: Metadata = { title: "識讀群集管理" };
export const dynamic = "force-dynamic";

export default async function AdminRecognitionPage() {
  const session = await getSession();
  if (session?.role !== "ADMIN") redirect("/");

  const [clusters, uncategorized] = await Promise.all([
    prisma.recognitionCluster.findMany({
      orderBy: [{ order: "asc" }, { id: "asc" }],
      include: {
        _count: {
          select: { problems: { where: { type: "RECOGNITION" } } },
        },
        tags: { include: { tag: true } },
      },
    }),
    prisma.problem.count({
      where: { type: "RECOGNITION", clusterId: null },
    }),
  ]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-4">
          <h1 className="page-title">識讀群集管理</h1>
          <Link
            href="/admin/problems?type=RECOGNITION"
            className="text-sm text-blue hover:underline"
          >
            識別題管理 →
          </Link>
        </div>
        <Link href="/admin/recognition/new" className="btn-primary">
          ＋ 新增群集
        </Link>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="table-head w-16">#</th>
              <th className="table-head">名稱</th>
              <th className="table-head w-56">標籤</th>
              <th className="table-head w-24 text-right">題數</th>
              <th className="table-head w-24">狀態</th>
              <th className="table-head w-20"></th>
            </tr>
          </thead>
          <tbody>
            {clusters.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="table-cell py-10 text-center text-mute"
                >
                  還沒有群集，點右上角「新增群集」開始建立
                </td>
              </tr>
            )}
            {clusters.map((c, i) => (
              <tr key={c.id} className="hover:bg-panel2">
                <td className="table-cell text-dim">{i + 1}</td>
                <td className="table-cell">
                  <Link
                    href={`/recognition/${c.id}`}
                    className="font-medium text-blue hover:underline"
                  >
                    {c.title}
                  </Link>
                  {c.description && (
                    <p className="mt-0.5 text-xs text-mute">{c.description}</p>
                  )}
                </td>
                <td className="table-cell">
                  <div className="flex flex-wrap gap-1.5">
                    {c.tags.map((ct) => (
                      <TagBadge
                        key={ct.tagId}
                        name={ct.tag.name}
                        href={`/recognition?tag=${encodeURIComponent(ct.tag.name)}`}
                      />
                    ))}
                  </div>
                </td>
                <td className="table-cell text-right text-dim">
                  {c._count.problems}
                </td>
                <td className="table-cell text-sm text-dim">
                  {c.isPublic ? "公開" : "未公開"}
                </td>
                <td className="table-cell">
                  <Link
                    href={`/admin/recognition/${c.id}/edit`}
                    className="text-sm text-blue hover:underline"
                  >
                    編輯
                  </Link>
                </td>
              </tr>
            ))}
            {uncategorized > 0 && (
              <tr className="hover:bg-panel2">
                <td className="table-cell text-dim">—</td>
                <td className="table-cell text-dim">
                  未分類
                  <p className="mt-0.5 text-xs text-mute">
                    還沒加入任何群集的識別題
                  </p>
                </td>
                <td className="table-cell"></td>
                <td className="table-cell text-right text-dim">
                  {uncategorized}
                </td>
                <td className="table-cell"></td>
                <td className="table-cell"></td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
