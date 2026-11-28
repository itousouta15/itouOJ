import Link from "next/link";
import { getSession } from "@/lib/auth";

export default async function CtfLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  return <div className="space-y-5">
    <nav aria-label="CTF 功能" className="flex flex-wrap gap-3 text-sm">
      <Link className="btn-secondary" href="/ctf">題庫</Link>
      <Link className="btn-secondary" href="/ctf/scoreboard">CTF 計分板</Link>
      {session && <Link className="btn-secondary" href="/ctf/history">我的提交</Link>}
      {session?.role === "ADMIN" && <Link className="btn-secondary" href="/admin/ctf">管理題目</Link>}
    </nav>
    {children}
  </div>;
}
