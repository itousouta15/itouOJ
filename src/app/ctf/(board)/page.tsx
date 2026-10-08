import type { Metadata } from "next";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { getCtfChallenges, getCtfStats } from "@/lib/ctf";
import { CTF_CATEGORIES, CTF_DIFFICULTIES, CTF_PAGE_SIZE, ctfQuerySchema } from "@/lib/ctfSchema";
import CtfStats from "@/components/CtfStats";
import CtfPagination from "@/components/CtfPagination";

export const metadata: Metadata = { title: "CTF 題庫", description: "Web、Crypto、Reverse、Pwn、Forensics 與 Misc 個人 CTF 練習題庫。" };
export const dynamic = "force-dynamic";

export default async function CtfPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await getSession();
  const query = ctfQuerySchema.parse(await searchParams);
  const status = session ? query.status : undefined;
  const [{ challenges, total, page }, stats] = await Promise.all([
    getCtfChallenges({
      isPublic: true, category: query.category, difficulty: query.difficulty,
      ...(session && status ? { solves: status === "solved" ? { some: { userId: session.userId } } : { none: { userId: session.userId } } } : {}),
    }, query.page, session?.userId),
    session ? getCtfStats(session.userId) : Promise.resolve(null),
  ]);
  const boardParams = new URLSearchParams({ page: String(page) });
  if (query.category) boardParams.set("category", query.category);
  if (query.difficulty) boardParams.set("difficulty", query.difficulty);
  if (status) boardParams.set("status", status);
  return <div className="space-y-5">
    <div><h1 id="ctf-board-title" tabIndex={-1} className="page-title">CTF 題庫</h1><p className="mt-2 text-sm text-dim">找到 Flag，解開挑戰。每人每題只計分一次。</p></div>
    {stats && <CtfStats stats={stats} />}
    <form action="/ctf" className="card flex flex-wrap items-end gap-3 p-4">
      <label className="text-sm">分類<select name="category" className="input mt-2 block" defaultValue={query.category ?? ""} key={`category-${query.category}`}><option value="">全部</option>{CTF_CATEGORIES.map((category) => <option key={category}>{category}</option>)}</select></label>
      <label className="text-sm">難度<select name="difficulty" className="input mt-2 block" defaultValue={query.difficulty ?? ""} key={`difficulty-${query.difficulty}`}><option value="">全部</option>{Object.entries(CTF_DIFFICULTIES).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
      {session && <label className="text-sm">解題狀態<select name="status" className="input mt-2 block" defaultValue={status ?? ""} key={`status-${status}`}><option value="">全部</option><option value="solved">已解出</option><option value="unsolved">未解出</option></select></label>}
      <button className="btn-primary">篩選</button><Link className="btn-secondary" href="/ctf">清除</Link>
    </form>
    <p className="text-sm text-dim">共 {total} 題</p>
    {!challenges.length && <div className="card p-8 text-center text-mute">目前沒有符合條件的公開題目。</div>}
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{challenges.map((c) => <Link key={c.id} href={`/ctf/challenges/${c.id}?${boardParams}`} scroll={false} prefetch={false} aria-haspopup="dialog" data-ctf-challenge-id={c.id} data-solved={c.solves.length > 0 ? "true" : "false"} className={`card ctf-challenge-card block space-y-3 p-5 hover:bg-panel2${c.solves.length ? " is-solved" : ""}`}>
      <div className="flex flex-wrap items-center gap-2 text-xs text-dim"><span>{c.category}</span><span>{CTF_DIFFICULTIES[c.difficulty as keyof typeof CTF_DIFFICULTIES]}</span>{c.solves.length > 0 && <span className="text-[var(--green)]">✓ 已解出</span>}</div>
      <h2 className="break-words text-lg font-semibold">{c.title}</h2>
      <p className="text-sm text-dim"><span className="mono font-semibold text-tx">{c.points}</span> 分 ・ {c._count.solves} 人解出</p>
    </Link>)}</div>
    <CtfPagination path="/ctf" page={page} hasNext={page * CTF_PAGE_SIZE < total} query={{ category: query.category, difficulty: query.difficulty, status }} />
  </div>;
}
