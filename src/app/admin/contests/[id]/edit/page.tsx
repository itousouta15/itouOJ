import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getContestPhase, toScoreMode } from "@/lib/contest";
import { toTaipeiInputValue } from "@/lib/contestTime";
import ContestForm from "@/components/ContestForm";
import ContestRevealButton from "@/components/ContestRevealButton";

export const metadata: Metadata = { title: "編輯比賽" };
export const dynamic = "force-dynamic";

export default async function EditContestPage({
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
      problems: { orderBy: [{ order: "asc" }, { id: "asc" }] },
    },
  });
  if (!contest) notFound();

  const problems = await prisma.problem.findMany({
    orderBy: { order: "asc" },
    select: { id: true, title: true, isPublic: true },
  });

  const phase = getContestPhase(contest);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="page-title">編輯比賽</h1>
        {contest.problems.length > 0 && (
          <a
            href={`/api/admin/contests/${contest.id}/export-docs`}
            className="btn-secondary"
          >
            下載題目文件（ZIP）
          </a>
        )}
      </div>
      <p className="-mt-4 text-xs text-mute">
        給斷網比賽用：裡面是每題一份可離線開啟的 HTML（字型已內嵌），檔名對應題目代號。
        解壓後把資料夾路徑設定到收件程式「賽前設定」的題目路徑即可，或用瀏覽器開啟後
        Ctrl+P 另存 PDF。這顆按鈕不受比賽是否已開始影響，你隨時看得到完整內容；
        選手端能不能提前下載則由下面「允許選手端在開賽前下載題目文件」控制，
        預設關閉（開賽前仍然看不到，見「開啟題目」的鎖定邏輯）。
      </p>

      {phase === "ended" && !contest.revealedAt && (
        <div className="card flex flex-wrap items-center justify-between gap-3 p-5">
          <p className="text-sm text-dim">
            比賽已結束，目前排行榜與提交結果仍對外隱藏，公開後無法收回。
          </p>
          <ContestRevealButton contestId={contest.id} />
        </div>
      )}

      <ContestForm
        problems={problems}
        initial={{
          id: contest.id,
          title: contest.title,
          description: contest.description,
          startTime: toTaipeiInputValue(contest.startTime),
          endTime: toTaipeiInputValue(contest.endTime),
          freezeMinutes: contest.freezeMinutes,
          scoreMode: toScoreMode(contest.scoreMode),
          allowedLanguages: contest.allowedLanguages,
          isPublic: contest.isPublic,
          joinCode: contest.joinCode ?? "",
          allowEarlyProblemDownload: contest.allowEarlyProblemDownload,
          problems: contest.problems.map((p) => ({
            problemId: p.problemId,
            label: p.label,
          })),
        }}
      />
    </div>
  );
}
