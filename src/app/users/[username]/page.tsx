import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { avatarSrc } from "@/lib/avatar";
import { DIFFICULTY_META, getUserStats } from "@/lib/userStats";
import SubmissionRow from "@/components/SubmissionRow";
import Avatar from "@/components/Avatar";
import LogoutButton from "@/components/LogoutButton";

export const dynamic = "force-dynamic";

async function getUser(username: string) {
  // 不 select avatarData：這個頁面只需要知道有沒有本地頭像
  return prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      displayName: true,
      bio: true,
      role: true,
      avatarUrl: true,
      avatarUpdatedAt: true,
      createdAt: true,
    },
  });
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

  const session = await getSession();
  const isOwnProfile = session?.username === user.username;

  const [statsData, recent] = await Promise.all([
    getUserStats(user.id),
    prisma.submission.findMany({
      where: { userId: user.id },
      orderBy: { id: "desc" },
      take: 20,
      include: {
        problem: { select: { id: true, order: true, title: true, type: true } },
      },
    }),
  ]);

  const {
    solvedCount,
    totalSubmissions,
    acSubmissions,
    acRate,
    solvedByDifficulty,
    totalByDifficulty,
    recognitionAnswered,
    recognitionCorrect,
    recognitionRate,
    recognitionTotal,
    recognitionProgressRate,
  } = statsData;

  const stats = [
    { label: "解題數", value: solvedCount },
    { label: "提交數", value: totalSubmissions },
    { label: "Accepted", value: acSubmissions },
    { label: "AC 率", value: `${acRate}%` },
  ];

  const recognitionStats = [
    { label: "已作答題數", value: recognitionAnswered },
    { label: "答對", value: recognitionCorrect },
    { label: "正確率", value: `${recognitionRate}%` },
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <section className="card p-6">
        <div className="mb-4 flex items-center gap-4">
          <Avatar
            name={user.displayName || user.username}
            src={avatarSrc(user)}
            size={64}
          />
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="page-title">{user.displayName || user.username}</h1>
            {user.role === "ADMIN" && (
              <span className="vbadge vbadge-purple">管理員</span>
            )}
            {session && !isOwnProfile && (
              <Link
                href={`/messages/${user.username}`}
                className="btn-secondary"
              >
                傳訊息
              </Link>
            )}
          </div>
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

      <section className="card p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="section-title">識讀統計</h2>
          <Link href="/recognition" className="text-sm text-blue hover:underline">
            去練習 →
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {recognitionStats.map((s) => (
            <div key={s.label} className="rounded-xl bg-inset p-4">
              <p className="page-kicker">{s.label}</p>
              <p className="mono mt-1 text-2xl font-bold text-tx">{s.value}</p>
            </div>
          ))}
        </div>
        <div className="mt-5">
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="text-dim">答對進度</span>
            <span className="mono text-xs text-dim">
              {recognitionCorrect} / {recognitionTotal}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-inset">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${recognitionProgressRate}%`,
                background: "var(--green)",
              }}
            />
          </div>
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
                  displayName: user.displayName,
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

      {isOwnProfile && (
        <section className="card p-6">
          <h2 className="section-title mb-4">帳號</h2>
          <div className="account-actions flex flex-wrap items-center gap-3">
            <Link href="/settings" className="btn-secondary">
              帳號設定
            </Link>
            <LogoutButton />
          </div>
        </section>
      )}
    </div>
  );
}
