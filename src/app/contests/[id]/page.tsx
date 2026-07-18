import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getContestPhase } from "@/lib/contest";
import ContestStatusBadge from "@/components/ContestStatusBadge";
import ContestCountdown from "@/components/ContestCountdown";
import ContestJoinButton from "@/components/ContestJoinButton";

export const dynamic = "force-dynamic";

export default async function ContestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const contestId = Number(id);
  if (!Number.isInteger(contestId)) notFound();

  const session = await getSession();
  const isAdmin = session?.role === "ADMIN";

  const contest = await prisma.contest.findUnique({
    where: { id: contestId },
    include: {
      problems: {
        orderBy: [{ order: "asc" }, { id: "asc" }],
        include: { problem: { select: { id: true, title: true } } },
      },
      _count: { select: { participants: true } },
    },
  });
  if (!contest || (!contest.isPublic && !isAdmin)) notFound();

  const phase = getContestPhase(contest);

  let joined = false;
  if (session) {
    const membership = await prisma.contestParticipant.findUnique({
      where: { contestId_userId: { contestId, userId: session.userId } },
    });
    joined = membership !== null;
  }

  const canOpenProblems = (joined || isAdmin) && phase !== "upcoming";

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="page-title">{contest.title}</h1>
          <ContestStatusBadge contest={contest} />
          {!contest.isPublic && <span className="vbadge vbadge-gray">未公開</span>}
          {isAdmin && (
            <Link
              href={`/admin/contests/${contest.id}/edit`}
              className="text-sm text-blue hover:underline"
            >
              編輯比賽
            </Link>
          )}
        </div>
        <p className="mono mt-1 text-xs text-mute">
          {contest.startTime.toLocaleString("zh-TW", {
            timeZone: "Asia/Taipei",
            hour12: false,
          })}{" "}
          →{" "}
          {contest.endTime.toLocaleString("zh-TW", {
            timeZone: "Asia/Taipei",
            hour12: false,
          })}
          {" ・ "}
          {contest._count.participants} 位參賽者
          {contest.freezeMinutes > 0 && ` ・ 最後 ${contest.freezeMinutes} 分鐘凍結榜`}
          {contest.joinCode && " ・ 需要加入代碼"}
          {isAdmin && contest.joinCode && (
            <span className="ml-2 text-purple">代碼：{contest.joinCode}</span>
          )}
        </p>
        {contest.description && (
          <p className="mt-3 max-w-2xl text-sm leading-relaxed whitespace-pre-line text-dim">
            {contest.description}
          </p>
        )}
      </div>

      <div className="card flex flex-wrap items-center gap-5 p-5">
        <ContestCountdown
          startTime={contest.startTime.toISOString()}
          endTime={contest.endTime.toISOString()}
        />
        {session ? (
          !isAdmin && (
            <ContestJoinButton
              contestId={contest.id}
              joined={joined}
              requiresCode={Boolean(contest.joinCode)}
              disabled={phase === "ended"}
            />
          )
        ) : (
          <p className="text-sm text-dim">
            <Link href="/login" className="mx-1 text-blue hover:underline">
              登入
            </Link>
            後即可報名比賽
          </p>
        )}
        <Link href={`/contests/${contest.id}/scoreboard`} className="btn-secondary">
          排行榜
        </Link>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="table-head w-16">代號</th>
              <th className="table-head">標題</th>
            </tr>
          </thead>
          <tbody>
            {contest.problems.length === 0 && (
              <tr>
                <td colSpan={2} className="table-cell py-10 text-center text-mute">
                  這場比賽還沒有題目
                </td>
              </tr>
            )}
            {contest.problems.map((cp) => (
              <tr key={cp.id} className="hover:bg-panel2">
                <td className="table-cell mono font-semibold text-dim">
                  {cp.label}
                </td>
                <td className="table-cell">
                  {canOpenProblems ? (
                    <Link
                      href={`/contests/${contest.id}/problems/${cp.problemId}`}
                      className="font-medium text-blue hover:underline"
                    >
                      {cp.problem.title}
                    </Link>
                  ) : (
                    <span className="text-dim">
                      {cp.problem.title}
                      <span className="ml-2 text-xs text-mute">
                        {phase === "upcoming" ? "（比賽開始後可作答）" : "（報名後可作答）"}
                      </span>
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
