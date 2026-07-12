import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import SubmissionRow from "@/components/SubmissionRow";

export const dynamic = "force-dynamic";

const DIFFICULTY_META = [
  { key: "easy", label: "簡單", color: "#4caf50" },
  { key: "medium", label: "中等", color: "#faa81a" },
  { key: "hard", label: "困難", color: "#ff6b6b" },
] as const;

async function getUser(username: string) {
  return prisma.user.findUnique({ where: { username } });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const user = await getUser(username);
  return { title: user ? (user.displayName || user.username) : "使用者" };
}

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const user = await getUser(username);
  if (!user) notFound();

  const [acDistinct, totalSubmissions, acSubmissions, publicTotals, recent] =
    await Promise.all([
      prisma.submission.findMany({
        where: { userId: user.id, status: "AC" },
        distinct: ["problemId"],
        select: { problem: { select: { difficulty: true } } },
      }),
      prisma.submission.count({ where: { userId: user.id } }),
      prisma.submission.count({ where: { userId: user.id, status: "AC" } }),
      prisma.problem.groupBy({
        by: ["difficulty"],
        where: { isPublic: true },
        _count: { _all: true },
      }),
      prisma.submission.findMany({
        where: { userId: user.id },
        orderBy: { id: "desc" },
        take: 20,
        include: { problem: { select: { id: true, title: true } } },
      }),
    ]);

  const solvedByDifficulty = new Map<string, number>();
  for (const s of acDistinct) {
    solvedByDifficulty.set(
      s.problem.difficulty,
      (solvedByDifficulty.get(s.problem.difficulty) ?? 0) + 1
    );
  }
  const totalByDifficulty = new Map(
    publicTotals.map((g) => [g.difficulty, g._count._all])
  );
  const acRate =
    totalSubmissions > 0
      ? Math.round((acSubmissions / totalSubmissions) * 100)
      : 0;

  const stats = [
    { label: "解題數", value: acDistinct.length },
    { label: "提交數", value: totalSubmissions },
    { label: "Accepted", value: acSubmissions },
    { label: "AC 率", value: `${acRate}%` },
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <section className="card p-6">
        <div className="mb-4 flex items-center gap-3">
          <h1 className="page-title">{user.displayName || user.username}</h1>
          {user.role === "ADMIN" && (
            <span className="vbadge vbadge-purple">管理員</span>
          )}
        </div>
        <dl className="mb-5 space-y-3 border-b border-bd pb-5 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-dim">使用者名稱</dt>
            <dd className="mono font-medium">{user.username}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-dim">註冊時間</dt>
            <dd className="text-dim">
              {user.createdAt.toLocaleString("zh-TW", {
                timeZone: "Asia/Taipei",
                hour12: false,
              })}
            </dd>
          </div>
        </dl>
        <p className="text-sm whitespace-pre-wrap text-tx">
          {user.bio || <span className="text-mute">這個人很懶，還沒有自我介紹</span>}
        </p>
      </section>

      <section className="card p-6">
        <h2 className="section-title mb-4">解題統計</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-xl bg-inset p-4">
              <p className="page-kicker">{s.label}</p>
              <p className="mono mt-1 text-2xl font-bold text-tx">{s.value}</p>
            </div>
          ))}
        </div>
        <div className="mt-5 space-y-3">
          {DIFFICULTY_META.map((d) => {
            const solved = solvedByDifficulty.get(d.key) ?? 0;
            const total = totalByDifficulty.get(d.key) ?? 0;
            const pct = total > 0 ? Math.round((solved / total) * 100) : 0;
            return (
              <div key={d.key}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-dim">{d.label}</span>
                  <span className="mono text-xs text-dim">
                    {solved} / {total}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-inset">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, background: d.color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="card overflow-x-auto p-0">
        <h2 className="section-title p-6 pb-4">最近提交</h2>
        <table className="w-full">
          <thead>
            <tr>
              <th className="table-head w-20">#</th>
              <th className="table-head">題目</th>
              <th className="table-head w-32">使用者</th>
              <th className="table-head w-36">語言</th>
              <th className="table-head w-44">結果</th>
              <th className="table-head w-24 text-right">時間</th>
              <th className="table-head w-24 text-right">記憶體</th>
              <th className="table-head w-40">提交時間</th>
            </tr>
          </thead>
          <tbody>
            {recent.length === 0 && (
              <tr>
                <td colSpan={8} className="table-cell py-10 text-center text-mute">
                  還沒有提交紀錄
                </td>
              </tr>
            )}
            {recent.map((s) => (
              <SubmissionRow
                key={s.id}
                s={{
                  id: s.id,
                  status: s.status,
                  language: s.language,
                  timeMs: s.timeMs,
                  memoryKb: s.memoryKb,
                  username: user.username,
                  problem: s.problem,
                  createdAtLabel: s.createdAt.toLocaleString("zh-TW", {
                    timeZone: "Asia/Taipei",
                    hour12: false,
                  }),
                }}
              />
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
