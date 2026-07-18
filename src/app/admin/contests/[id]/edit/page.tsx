import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getContestPhase } from "@/lib/contest";
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
    orderBy: { id: "asc" },
    select: { id: true, title: true, isPublic: true },
  });

  const phase = getContestPhase(contest);

  return (
    <div className="space-y-6">
      <h1 className="page-title">編輯比賽</h1>

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
          isPublic: contest.isPublic,
          joinCode: contest.joinCode ?? "",
          problems: contest.problems.map((p) => ({
            problemId: p.problemId,
            label: p.label,
          })),
        }}
      />
    </div>
  );
}
