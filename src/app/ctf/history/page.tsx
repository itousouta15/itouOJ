import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ctfDate } from "@/lib/ctf";
import { ctfQuerySchema, CTF_PAGE_SIZE } from "@/lib/ctfSchema";
import CtfPagination from "@/components/CtfPagination";

export const metadata: Metadata = { title: "CTF 提交紀錄", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export default async function CtfHistoryPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login?next=/ctf/history");
  const query = ctfQuerySchema.parse(await searchParams);
  const where = { userId: session.userId, challenge: { isPublic: true } };
  const total = await prisma.ctfAttempt.count({ where });
  const page = Math.min(query.page, Math.max(1, Math.ceil(total / CTF_PAGE_SIZE)));
  const attempts = await prisma.ctfAttempt.findMany({
    where, orderBy: [{ createdAt: "desc" }, { id: "desc" }], skip: (page - 1) * CTF_PAGE_SIZE, take: CTF_PAGE_SIZE,
    select: { id: true, result: true, createdAt: true, challenge: { select: { id: true, title: true } } },
  });
  return <div><h1 className="page-title mb-5">我的 CTF 提交</h1>
    <div className="card overflow-x-auto"><table className="w-full"><thead><tr><th className="table-head">題目</th><th className="table-head">結果</th><th className="table-head">時間</th></tr></thead><tbody>
      {!attempts.length && <tr><td colSpan={3} className="table-cell py-10 text-center text-mute">尚無公開題目的提交紀錄。</td></tr>}
      {attempts.map((attempt) => <tr key={attempt.id}><td className="table-cell"><Link href={`/ctf/${attempt.challenge.id}`} className="text-blue hover:underline">{attempt.challenge.title}</Link></td><td className="table-cell">{attempt.result === "CORRECT" ? "正確" : "錯誤"}</td><td className="table-cell whitespace-nowrap">{ctfDate(attempt.createdAt)}</td></tr>)}
    </tbody></table></div>
    <CtfPagination path="/ctf/history" page={page} hasNext={page * CTF_PAGE_SIZE < total} />
  </div>;
}
