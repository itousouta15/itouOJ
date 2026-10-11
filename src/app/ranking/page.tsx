import type { Metadata } from "next";
import Link from "next/link";
import { getSiteWideRanking } from "@/lib/ranking";

export const metadata: Metadata = { title: "排行" };
export const dynamic = "force-dynamic";

export default async function RankingPage() {
  const combinedRows = await getSiteWideRanking(100);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <h1 className="page-title">排行</h1>
      </div>
      <p className="mb-4 text-sm text-dim">全站分數＝實作解題數 × 0.42 ＋ 識讀答對數 × 0.28 ＋ CTF 原始分數 ÷ 100 × 0.30。採完整精度排序，顯示至小數第三位。</p>
      <div className="card overflow-x-auto">
        <table className="motion-table w-full">
          <thead>
            <tr>
              <th className="table-head w-20">名次</th>
              <th className="table-head">使用者</th>
              <th className="table-head w-24 text-right">解題數</th>
              <th className="table-head w-24 text-right">識讀答對</th>
              <th className="table-head w-24 text-right">CTF 分數</th>
              <th className="table-head w-24 text-right">分數</th>
              <th className="table-head w-24 text-right">程式提交數</th>
            </tr>
          </thead>
          <tbody>
            {combinedRows.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="table-cell py-10 text-center text-mute"
                >
                  還沒有人提交、練過識讀題或解出 CTF 題目
                </td>
              </tr>
            )}
            {combinedRows.map((r, i) => (
              <tr key={r.username} className="hover:bg-panel2">
                <td className="table-cell font-semibold text-dim">{i + 1}</td>
                <td className="table-cell font-medium">
                  <Link
                    href={`/users/${r.username}`}
                    className="text-blue hover:underline"
                  >
                    {r.displayName || r.username}
                  </Link>
                </td>
                <td className="table-cell text-right font-semibold text-[var(--green)]">
                  {r.solved}
                </td>
                <td className="table-cell text-right font-semibold text-[var(--green)]">
                  {r.recognitionCorrect}
                </td>
                <td className="table-cell text-right font-semibold">
                  {Number(r.ctfPoints)}
                </td>
                <td className="table-cell text-right font-semibold">
                  {Number(r.score).toFixed(3)}
                </td>
                <td className="table-cell text-right text-dim">
                  {r.submissions}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
