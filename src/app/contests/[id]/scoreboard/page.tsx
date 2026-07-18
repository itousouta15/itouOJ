import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { buildScoreboard, isContestRevealed, getContestPhase } from "@/lib/contest";
import ContestStatusBadge from "@/components/ContestStatusBadge";

export const dynamic = "force-dynamic";

export default async function ContestScoreboardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const contestId = Number(id);
  if (!Number.isInteger(contestId)) notFound();

  const session = await getSession();
  const isAdmin = session?.role === "ADMIN";

  const contest = await prisma.contest.findUnique({ where: { id: contestId } });
  if (!contest || (!contest.isPublic && !isAdmin)) notFound();

  const revealed = isContestRevealed(contest);
  const phase = getContestPhase(contest);
  const board = await buildScoreboard(contestId, { revealAll: revealed });
  if (!board) notFound();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Link href={`/contests/${contest.id}`} className="text-sm text-blue hover:underline">
          ← {contest.title}
        </Link>
        <ContestStatusBadge contest={contest} />
      </div>
      <h1 className="page-title">排行榜</h1>

      {!revealed && (
        <div className="card border-[rgba(250,168,26,0.3)] p-4 text-sm text-[#faa81a]">
          🧊 排名已凍結{phase === "ended" ? "，比賽結束後由管理員公開最終成績" : `，最後 ${contest.freezeMinutes} 分鐘的結果暫不公開`}
          {isAdmin && (
            <Link href={`/admin/contests/${contest.id}/edit`} className="ml-2 underline">
              前往公開
            </Link>
          )}
        </div>
      )}

      <p className="mono mb-2 text-[11px] text-mute sm:hidden">
        ← 左右滑動可看到更多欄位 →
      </p>
      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="table-head w-16">名次</th>
              <th className="table-head">參賽者</th>
              <th className="table-head w-24 text-right">解題數</th>
              <th className="table-head w-24 text-right">罰時</th>
              {board.problems.map((p) => (
                <th key={p.id} className="table-head w-20 text-center" title={p.title}>
                  {p.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {board.rows.length === 0 && (
              <tr>
                <td
                  colSpan={4 + board.problems.length}
                  className="table-cell py-10 text-center text-mute"
                >
                  還沒有人報名
                </td>
              </tr>
            )}
            {board.rows.map((row, i) => (
              <tr key={row.userId} className="hover:bg-panel2">
                <td className="table-cell font-semibold text-dim">{i + 1}</td>
                <td className="table-cell font-medium">{row.name}</td>
                <td className="table-cell text-right font-semibold text-[#4caf50]">
                  {row.solvedCount}
                </td>
                <td className="table-cell mono text-right text-dim">
                  {row.totalPenalty}
                </td>
                {board.problems.map((p) => {
                  const cell = row.cells[p.id];
                  return (
                    <td key={p.id} className="table-cell text-center">
                      {cell.pending ? (
                        <span className="mono text-mute" title="凍結中，結果尚未公開">
                          ?{cell.attempts > 0 ? ` (${cell.attempts})` : ""}
                        </span>
                      ) : cell.solved ? (
                        <span className="mono text-[#4caf50]">
                          +{cell.attempts > 0 ? cell.attempts : ""}
                          <br />
                          <span className="text-xs text-dim">{cell.penaltyMinutes}</span>
                        </span>
                      ) : cell.attempts > 0 ? (
                        <span className="mono text-[#ff6b6b]">-{cell.attempts}</span>
                      ) : (
                        <span className="text-mute">—</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
