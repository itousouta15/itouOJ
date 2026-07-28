import Link from "next/link";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getContestPhase } from "@/lib/contest";
import ContestStatusBadge from "@/components/ContestStatusBadge";

export const metadata: Metadata = { title: "參賽者狀態" };
export const dynamic = "force-dynamic";

// 開賽前的檢查頁：一眼看出哪一台選手機還沒設定好。
// 收件程式設定完成時會呼叫 /api/contests/[id]/checkin 回報，這裡把結果攤開。
export default async function ContestStatusPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (session?.role !== "ADMIN") redirect("/");

  const { id } = await params;
  const contestId = Number(id);
  if (!Number.isInteger(contestId)) notFound();

  const contest = await prisma.contest.findUnique({
    where: { id: contestId },
    include: {
      participants: {
        include: {
          user: { select: { id: true, username: true, displayName: true } },
        },
        orderBy: { joinedAt: "asc" },
      },
      problems: { select: { problemId: true } },
    },
  });
  if (!contest) notFound();

  // 每位參賽者在這場比賽的提交數
  const counts = await prisma.submission.groupBy({
    by: ["userId"],
    where: { contestId },
    _count: { _all: true },
  });
  const countMap = new Map(counts.map((c) => [c.userId, c._count._all]));

  const rows = contest.participants.map((p) => ({
    userId: p.userId,
    username: p.user.username,
    name: p.user.displayName || p.user.username,
    readyAt: p.clientReadyAt,
    host: p.clientHost,
    submissions: countMap.get(p.userId) ?? 0,
  }));

  const ready = rows.filter((r) => r.readyAt).length;
  const phase = getContestPhase(contest);
  const fmt = (d: Date) =>
    d.toLocaleString("zh-TW", { timeZone: "Asia/Taipei", hour12: false });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/admin/contests" className="text-sm text-blue hover:underline">
          ← 比賽管理
        </Link>
        <ContestStatusBadge contest={contest} />
      </div>

      <div>
        <h1 className="page-title">參賽者狀態</h1>
        <p className="mt-1 text-sm text-dim">{contest.title}</p>
      </div>

      <div className="card grid gap-4 p-5 sm:grid-cols-3">
        <div>
          <p className="page-kicker">已報名</p>
          <p className="mt-1 text-2xl font-bold">{rows.length}</p>
        </div>
        <div>
          <p className="page-kicker">收件程式已就緒</p>
          <p
            className={`mt-1 text-2xl font-bold ${
              ready === rows.length && rows.length > 0
                ? "text-[#4caf50]"
                : "text-[#faa81a]"
            }`}
          >
            {ready} / {rows.length}
          </p>
        </div>
        <div>
          <p className="page-kicker">比賽狀態</p>
          <p className="mt-1 text-2xl font-bold">
            {phase === "upcoming"
              ? "尚未開始"
              : phase === "ended"
                ? "已結束"
                : phase === "frozen"
                  ? "凍結中"
                  : "進行中"}
          </p>
        </div>
      </div>

      {rows.length > 0 && ready < rows.length && (
        <div className="card border-[rgba(250,168,26,0.3)] p-4 text-sm text-[#faa81a]">
          還有 {rows.length - ready} 位選手的收件程式尚未回報就緒。
          開賽前請確認那幾台機器已經登入並選好比賽 —— 沒設定好的話，
          該選手整場都無法提交，而且要到賽後上傳時才會發現。
        </div>
      )}

      <p className="mono mb-2 text-[11px] text-mute sm:hidden">
        ← 左右滑動可看到更多欄位 →
      </p>
      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="table-head w-40">參賽者</th>
              <th className="table-head w-32">帳號</th>
              <th className="table-head w-28">收件程式</th>
              <th className="table-head w-44">回報時間</th>
              <th className="table-head w-36">電腦名稱</th>
              <th className="table-head w-24 text-right">提交數</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="table-cell py-10 text-center text-mute">
                  還沒有人報名這場比賽
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.userId} className="hover:bg-panel2">
                <td className="table-cell font-medium">
                  <Link
                    href={`/users/${r.username}`}
                    className="text-blue hover:underline"
                  >
                    {r.name}
                  </Link>
                </td>
                <td className="table-cell mono text-sm text-dim">{r.username}</td>
                <td className="table-cell">
                  {r.readyAt ? (
                    <span className="vbadge vbadge-green">已就緒</span>
                  ) : (
                    <span className="vbadge vbadge-red">未回報</span>
                  )}
                </td>
                <td className="table-cell mono text-sm text-dim">
                  {r.readyAt ? fmt(r.readyAt) : "—"}
                </td>
                <td className="table-cell mono text-sm text-dim">
                  {r.host || "—"}
                </td>
                <td className="table-cell text-right text-dim">
                  {r.submissions > 0 ? (
                    <Link
                      href={`/submissions?contest=${contest.id}`}
                      className="text-blue hover:underline"
                    >
                      {r.submissions}
                    </Link>
                  ) : (
                    0
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-mute">
        「已就緒」代表該選手的收件程式完成登入並選好比賽後回報過。
        這個狀態不會自動失效，換機器或重新設定會更新回報時間。
      </p>
    </div>
  );
}
