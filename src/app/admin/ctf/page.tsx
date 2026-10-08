import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getCtfChallenges } from "@/lib/ctf";
import { ctfQuerySchema, CTF_PAGE_SIZE } from "@/lib/ctfSchema";
import CtfPagination from "@/components/CtfPagination";

export const metadata: Metadata = { title: "CTF 管理" };
export const dynamic = "force-dynamic";

export default async function AdminCtfPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  if ((await getSession())?.role !== "ADMIN") redirect("/");
  const query = ctfQuerySchema.parse(await searchParams);
  const { challenges, total, page } = await getCtfChallenges({}, query.page);
  return <div>
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><h1 className="page-title">CTF 管理</h1><div className="flex gap-3"><Link className="btn-secondary" href="/admin/problems">管理首頁</Link><Link className="btn-primary" href="/admin/ctf/new">＋ 新增題目</Link></div></div>
    <p className="mb-4 text-sm text-dim">共 {total} 題。取消公開會保留紀錄，並暫停採計。</p>
    <div className="card overflow-x-auto"><table className="w-full"><thead><tr>{["題目", "分類", "配分", "狀態", "解題數", "附件"].map((name) => <th key={name} className="table-head">{name}</th>)}</tr></thead><tbody>
      {!challenges.length && <tr><td colSpan={6} className="table-cell py-10 text-center text-mute">尚無 CTF 題目</td></tr>}
      {challenges.map((c) => <tr key={c.id}><td className="table-cell"><Link href={`/admin/ctf/${c.id}/edit`} className="text-blue hover:underline">{c.title}</Link></td><td className="table-cell">{c.category}</td><td className="table-cell">{c.points}</td><td className="table-cell">{c.isPublic ? "公開" : "隱藏"}</td><td className="table-cell">{c._count.solves}</td><td className="table-cell">{c._count.attachments}</td></tr>)}
    </tbody></table></div>
    <CtfPagination path="/admin/ctf" page={page} hasNext={page * CTF_PAGE_SIZE < total} />
  </div>;
}
