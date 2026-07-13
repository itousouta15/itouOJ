import Link from "next/link";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { LANGUAGES, isLanguageKey } from "@/lib/languages";
import DifficultyBadge from "@/components/DifficultyBadge";
import HomeSubmissionRow from "@/components/HomeSubmissionRow";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await getSession();

  const [problemCount, userCount, submissionCount, acCount] =
    await Promise.all([
      prisma.problem.count({ where: { isPublic: true } }),
      prisma.user.count(),
      prisma.submission.count(),
      prisma.submission.count({ where: { status: "AC" } }),
    ]);

  const announcements = await prisma.announcement.findMany({
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    take: 3,
  });

  const latestProblems = await prisma.problem.findMany({
    where: { isPublic: true },
    orderBy: { id: "desc" },
    take: 5,
  });

  const latestSubmissions = await prisma.submission.findMany({
    orderBy: { id: "desc" },
    take: 8,
    include: {
      user: { select: { username: true, displayName: true } },
      problem: { select: { id: true, title: true } },
    },
  });

  // 排行前 5 名（同 /ranking 的計法：不同題目的 AC 才算解題數）
  const acPairs = await prisma.submission.findMany({
    where: { status: "AC" },
    distinct: ["userId", "problemId"],
    select: { user: { select: { username: true, displayName: true } } },
  });
  const solvedByUser = new Map<string, number>();
  const nameByUser = new Map<string, string | null>();
  for (const { user } of acPairs) {
    solvedByUser.set(user.username, (solvedByUser.get(user.username) ?? 0) + 1);
    nameByUser.set(user.username, user.displayName);
  }
  const topUsers = [...solvedByUser.entries()]
    .map(([username, solved]) => ({
      username,
      displayName: nameByUser.get(username) ?? null,
      solved,
    }))
    .sort((a, b) => b.solved - a.solved || a.username.localeCompare(b.username))
    .slice(0, 5);

  const stats = [
    { label: "題目", value: problemCount },
    { label: "使用者", value: userCount },
    { label: "提交", value: submissionCount },
    { label: "Accepted", value: acCount },
  ];

  return (
    <div className="space-y-10">
      {/* Hero */}
      <section className="pt-4">
        <p className="page-kicker mb-3">Competitive Programming · Online Judge</p>
        <h1 className="serif text-3xl font-bold leading-tight sm:text-4xl md:text-6xl">
          itouOJ (ゝ∀･)⌒☆
        </h1>
        <p className="mt-4 max-w-xl leading-relaxed text-dim">
          挑一題、寫程式、送出，逐筆測資即時回饋
        <br></br>
          —— 從第一個 AC 開始累積實力
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/problems" className="btn-primary">
            開始解題
          </Link>
          {session ? (
            <Link href="/submissions?mine=1" className="btn-secondary">
              我的提交
            </Link>
          ) : (
            <Link href="/register" className="btn-secondary">
              註冊帳號
            </Link>
          )}
        </div>
      </section>

      {/* 統計數據 */}
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="card p-5">
            <p className="page-kicker">{s.label}</p>
            <p className="mono mt-2 text-3xl font-bold text-tx">{s.value}</p>
          </div>
        ))}
      </section>

      {/* 公告 */}
      {announcements.length > 0 && (
        <section>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="section-title">公告</h2>
            <Link
              href="/announcements"
              className="mono text-xs text-blue hover:underline"
            >
              全部公告 →
            </Link>
          </div>
          <div className="card">
            {announcements.map((a) => (
              <Link
                key={a.id}
                href={`/announcements/${a.id}`}
                className="flex items-center gap-3 border-b border-bd px-4 py-3 last:border-b-0 hover:bg-panel2"
              >
                {a.isPinned && <span className="vbadge vbadge-green">置頂</span>}
                <span className="flex-1 truncate font-medium text-blue">
                  {a.title}
                </span>
                <span className="mono text-xs text-mute">
                  {a.createdAt.toLocaleDateString("zh-TW", {
                    timeZone: "Asia/Taipei",
                  })}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 最新題目 + 排行 */}
      <section className="grid gap-6 md:grid-cols-2">
        <div>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="section-title">最新題目</h2>
            <Link
              href="/problems"
              className="mono text-xs text-blue hover:underline"
            >
              全部題目 →
            </Link>
          </div>
          <div className="card">
            {latestProblems.length === 0 && (
              <p className="py-10 text-center text-sm text-mute">還沒有題目</p>
            )}
            {latestProblems.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-3 border-b border-bd px-4 py-3 last:border-b-0 hover:bg-panel2"
              >
                <span className="mono w-8 text-sm text-mute">{p.id}</span>
                <Link
                  href={`/problems/${p.id}`}
                  className="flex-1 truncate font-medium text-blue hover:underline"
                >
                  {p.title}
                </Link>
                <DifficultyBadge difficulty={p.difficulty} />
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="section-title">排行</h2>
            <Link
              href="/ranking"
              className="mono text-xs text-blue hover:underline"
            >
              完整排行 →
            </Link>
          </div>
          <div className="card">
            {topUsers.length === 0 && (
              <p className="py-10 text-center text-sm text-mute">
                還沒有人解出題目
              </p>
            )}
            {topUsers.map((u, i) => (
              <div
                key={u.username}
                className="flex items-center gap-3 border-b border-bd px-4 py-3 last:border-b-0"
              >
                <span className="mono w-8 text-sm font-bold text-mute">
                  {i + 1}
                </span>
                <span className="flex-1 truncate font-medium">
                  {u.displayName || u.username}
                </span>
                <span className="mono text-sm font-semibold text-[#4caf50]">
                  {u.solved} 題
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 最新提交 */}
      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="section-title">最新提交</h2>
          <Link
            href="/submissions"
            className="mono text-xs text-blue hover:underline"
          >
            所有提交 →
          </Link>
        </div>
        <div className="card overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-head w-16">#</th>
                <th className="table-head">題目</th>
                <th className="table-head w-32">使用者</th>
                <th className="table-head w-28">結果</th>
                <th className="table-head w-36 text-right">時間</th>
              </tr>
            </thead>
            <tbody>
              {latestSubmissions.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="table-cell py-10 text-center text-mute"
                  >
                    還沒有紀錄
                  </td>
                </tr>
              )}
              {latestSubmissions.map((s) => (
                <HomeSubmissionRow
                  key={s.id}
                  s={{
                    id: s.id,
                    status: s.status,
                    username: s.user.username,
                    displayName: s.user.displayName,
                    problem: s.problem,
                    createdAtLabel: s.createdAt.toLocaleString("zh-TW", {
                      timeZone: "Asia/Taipei",
                      hour12: false,
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    }),
                  }}
                />
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 系統資訊 */}
      <section className="card p-5">
        <h2 className="section-title mb-3">評測環境</h2>
        <div className="flex flex-wrap gap-2">
          {Object.keys(LANGUAGES).map(
            (key) =>
              isLanguageKey(key) && (
                <span
                  key={key}
                  className="mono rounded-md border border-bd bg-inset px-3 py-1.5 text-xs text-dim"
                >
                  {LANGUAGES[key].label}
                </span>
              )
          )}
        </div>
        <p className="mt-4 text-sm leading-relaxed text-dim">
          程式碼在 Piston 沙箱中編譯執行，逐筆測資回報時間與記憶體用量。
          判題結果：AC / WA / TLE / MLE / RE / CE。
          直譯式語言與 JVM 語言的時間、記憶體限制依慣例放寬。
        </p>
      </section>
    </div>
  );
}
