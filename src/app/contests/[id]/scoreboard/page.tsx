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

      {board.scoreMode === "IOI" && (
        <p className="text-sm text-dim">
          此比賽採 IOI 計分：每題只看
          <span className="text-tx">最後一次提交</span>
          的結果，錯誤提交不罰時；平手時比總用時。
        </p>
      )}

      {!revealed && contest.freezeMinutes > 0 && (
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
              <th className="table-head w-24 text-right">
                {board.scoreMode === "IOI" ? "用時" : "罰時"}
              </th>
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
                <td className="table-cell font-medium">
                  <Link
                    href={`/users/${row.username}`}
                    className="text-blue hover:underline"
                  >
                    {row.name}
                  </Link>
                </td>
                <td className="table-cell text-right font-semibold text-[#4caf50]">
                  {row.solvedCount}
                </td>
                <td className="table-cell mono text-right text-dim">
                  {row.totalMinutes}
                </td>
                {board.problems.map((p) => {
                  const cell = row.cells[p.id];
                  const isIoi = board.scoreMode === "IOI";
                  // 有對應的提交就讓整格可以點進去看那筆的判題結果。
                  // 凍結中的格子 submissionId 是 null，點不進去也看不到。
                  const inner = (
                    <>
                      {cell.pending ? (
                        <span className="mono text-mute" title="凍結中，結果尚未公開">
                          ?{cell.attempts > 0 ? ` (${cell.attempts})` : ""}
                        </span>
                      ) : cell.judging ? (
                        <span className="mono text-[#faa81a]" title="判題中">
                          ⋯{cell.attempts > 0 ? ` (${cell.attempts})` : ""}
                        </span>
                      ) : cell.solved ? (
                        <span className="mono text-[#4caf50]">
                          {isIoi
                            ? `✓${cell.attempts > 1 ? ` (${cell.attempts})` : ""}`
                            : `+${cell.attempts > 0 ? cell.attempts : ""}`}
                          <br />
                          <span className="text-xs text-dim">{cell.minutes}</span>
                        </span>
                      ) : cell.attempts > 0 ? (
                        <span className="mono text-[#ff6b6b]">
                          {isIoi ? `✗ (${cell.attempts})` : `-${cell.attempts}`}
                        </span>
                      ) : (
                        <span className="text-mute">—</span>
                      )}
                    </>
                  );
                  return (
                    <td key={p.id} className="table-cell p-0 text-center">
                      {cell.submissionId ? (
                        <Link
                          href={`/submissions/${cell.submissionId}`}
                          className="block px-4 py-[11px] hover:bg-inset"
                          title="查看這筆提交"
                        >
                          {inner}
                        </Link>
                      ) : (
                        <div className="px-4 py-[11px]">{inner}</div>
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
