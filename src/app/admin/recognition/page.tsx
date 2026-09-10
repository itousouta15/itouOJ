import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = { title: "程式識別管理" };
export const dynamic = "force-dynamic";

export default async function AdminRecognitionPage() {
  const session = await getSession();
  if (session?.role !== "ADMIN") redirect("/");

  const questions = await prisma.recognitionQuestion.findMany({
    orderBy: [{ order: "asc" }, { id: "asc" }],
  });

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <h1 className="page-title">程式識別管理</h1>
          <Link
            href="/admin/problems"
            className="text-sm text-blue hover:underline"
          >
            ← 回題目管理
          </Link>
        </div>
        <Link href="/admin/recognition/new" className="btn-primary">
          ＋ 新增題目
        </Link>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="table-head w-16">#</th>
              <th className="table-head">題目</th>
              <th className="table-head w-20">類別</th>
              <th className="table-head w-20">顯示</th>
              <th className="table-head w-20"></th>
            </tr>
          </thead>
          <tbody>
            {questions.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="table-cell py-10 text-center text-mute"
                >
                  還沒有題目，點右上角「新增題目」開始建立
                </td>
              </tr>
            )}
            {questions.map((q) => (
              <tr key={q.id} className="hover:bg-panel2">
                <td className="table-cell text-dim">{q.order}</td>
                <td className="table-cell font-medium">{q.question}</td>
                <td className="table-cell">
                  <span
                    className={`vbadge ${
                      q.category === "Python"
                        ? "vbadge-purple"
                        : "vbadge-blue"
                    }`}
                  >
                    {q.category}
                  </span>
                </td>
                <td className="table-cell">
                  {q.isPublic ? (
                    <span className="vbadge vbadge-green">公開</span>
                  ) : (
                    <span className="text-sm text-mute">隱藏</span>
                  )}
                </td>
                <td className="table-cell">
                  <Link
                    href={`/admin/recognition/${q.id}/edit`}
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