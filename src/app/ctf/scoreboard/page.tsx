import type { Metadata } from "next";
import Link from "next/link";
import { getCtfRanking, ctfDate } from "@/lib/ctf";
import { ctfQuerySchema, CTF_PAGE_SIZE } from "@/lib/ctfSchema";
import CtfPagination from "@/components/CtfPagination";

export const metadata: Metadata = { title: "CTF 計分板", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export default async function CtfScoreboardPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page } = ctfQuerySchema.parse(await searchParams);
  const { rows, hasNext } = await getCtfRanking(page);
  return <div><h1 className="page-title mb-3">CTF 計分板</h1><p className="mb-5 text-sm text-dim">採計已解出的公開題目目前配分；同分時，最後解出時間較早者在前。</p>
    <div className="card overflow-x-auto"><table className="w-full"><thead><tr>{["名次", "使用者", "原始分數", "解題數", "最後解出"].map((name) => <th key={name} className="table-head">{name}</th>)}</tr></thead><tbody>
      {!rows.length && <tr><td colSpan={5} className="table-cell py-10 text-center text-mute">目前尚無解題紀錄。</td></tr>}
      {rows.map((row, index) => <tr key={row.username}><td className="table-cell">{(page - 1) * CTF_PAGE_SIZE + index + 1}</td><td className="table-cell"><Link className="text-blue hover:underline" href={`/users/${row.username}`}>{row.displayName || row.username}</Link></td><td className="table-cell mono font-semibold">{Number(row.points)}</td><td className="table-cell">{Number(row.solved)}</td><td className="table-cell whitespace-nowrap">{ctfDate(new Date(row.lastSolvedAt))}</td></tr>)}
    </tbody></table></div>
    <CtfPagination path="/ctf/scoreboard" page={page} hasNext={hasNext} />
  </div>;
}
