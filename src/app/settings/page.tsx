import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { googleConfigured } from "@/lib/googleOAuth";
import { discordConfigured } from "@/lib/discordOAuth";
import ProfileForm from "@/components/ProfileForm";
import ChangePasswordForm from "@/components/ChangePasswordForm";
import LinkedAccounts from "@/components/LinkedAccounts";
import DeleteAccountForm from "@/components/DeleteAccountForm";

export const metadata: Metadata = { title: "帳號設定" };
export const dynamic = "force-dynamic";

const DIFFICULTY_META = [
  { key: "easy", label: "簡單", color: "#4caf50" },
  { key: "medium", label: "中等", color: "#faa81a" },
  { key: "hard", label: "困難", color: "#ff6b6b" },
] as const;

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ linked?: string; error?: string }>;
}) {
  const { linked, error } = await searchParams;
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
  });
  if (!user) redirect("/login");

  const authMethodCount =
    (user.passwordHash ? 1 : 0) + (user.googleId ? 1 : 0) + (user.discordId ? 1 : 0);

  // 解題統計
  const [acDistinct, totalSubmissions, acSubmissions, publicTotals] =
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
      <h1 className="page-title">帳號設定</h1>

      <section className="card p-6">
        <h2 className="section-title mb-4">個人資料</h2>
        <dl className="mb-5 space-y-3 border-b border-bd pb-5 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-dim">使用者名稱</dt>
            <dd className="mono flex items-center gap-2 font-medium">
              {user.username}
              {user.role === "ADMIN" && (
                <span className="vbadge vbadge-purple">管理員</span>
              )}
            </dd>
          </div>
          {user.email && (
            <div className="flex items-center justify-between">
              <dt className="text-dim">Email</dt>
              <dd className="mono text-dim">{user.email}</dd>
            </div>
          )}
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
        <ProfileForm
          initialDisplayName={user.displayName ?? ""}
          initialBio={user.bio ?? ""}
        />
      </section>

      <section className="card p-6">
        <h2 className="section-title mb-4">連結帳號</h2>
        <LinkedAccounts
          googleLinked={Boolean(user.googleId)}
          discordLinked={Boolean(user.discordId)}
          googleEnabled={googleConfigured()}
          discordEnabled={discordConfigured()}
          canUnlink={authMethodCount > 1}
          initialLinked={linked}
          initialError={error}
        />
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
        <h2 className="section-title mb-4">修改密碼</h2>
        {user.passwordHash ? (
          <ChangePasswordForm />
        ) : (
          <p className="text-sm text-dim">
            此帳號透過 {user.googleId ? "Google" : "Discord"} 登入，沒有本地密碼。
          </p>
        )}
      </section>

      <section className="card p-6">
        <h2 className="section-title mb-4">危險區域</h2>
        <DeleteAccountForm
          username={user.username}
          hasPassword={Boolean(user.passwordHash)}
        />
      </section>
    </div>
  );
}
