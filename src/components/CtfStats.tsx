import Link from "next/link";

export default function CtfStats({ stats }: { stats: { solved: number; points: number; total: number; progress: number } }) {
  return <section className="card p-6">
    <div className="mb-4 flex items-center justify-between gap-3"><h2 className="section-title">CTF 統計</h2><Link href="/ctf" className="text-sm text-blue hover:underline">去解題 →</Link></div>
    <div className="grid grid-cols-2 gap-3">
      <div className="rounded-xl bg-inset p-4"><p className="page-kicker">已解出</p><p className="mono mt-1 text-2xl font-bold">{stats.solved} / {stats.total}</p></div>
      <div className="rounded-xl bg-inset p-4"><p className="page-kicker">CTF 原始分數</p><p className="mono mt-1 text-2xl font-bold">{stats.points}</p></div>
    </div>
    <p className="mt-4 text-sm text-dim">公開題目進度：{stats.progress}%</p>
    <div className="mt-2 h-2 overflow-hidden rounded-full bg-inset"><div className="motion-progress h-full bg-[var(--green)]" style={{ width: `${stats.progress}%` }} /></div>
  </section>;
}
