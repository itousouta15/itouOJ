import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { isContestRevealed } from "@/lib/contest";
import SubmissionRow from "@/components/SubmissionRow";

export const metadata: Metadata = { title: "紀錄" };
export const dynamic = "force-dynamic";

export default async function SubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ mine?: string; contest?: string }>;
}) {
  const { mine, contest } = await searchParams;
  const session = await getSession();
  const onlyMine = mine === "1" && session;

  // 從比賽頁點「我的提交」進來時只列該場比賽的紀錄
  const contestId = Number(contest);
  const filterContest = Number.isInteger(contestId) && contestId > 0;
  const filteredContest = filterContest
    ? await prisma.contest.findUnique({
        where: { id: contestId },
        select: { id: true, title: true },
      })
    : null;

  const submissions = await prisma.submission.findMany({
    where: {
      ...(onlyMine ? { userId: session!.userId } : {}),
      ...(filteredContest ? { contestId: filteredContest.id } : {}),
    },
    orderBy: { id: "desc" },
    take: 100,
    include: {
      user: { select: { username: true, displayName: true } },
      problem: { select: { id: true, order: true, title: true, type: true } },
      contest: true,
    },
  });
  const isAdmin = session?.role === "ADMIN";

  // 我的識讀練習紀錄：以群集為單位（資料在 RecognitionAnswer，不是 Submission）
  let recognitionRows: {
    id: number | null; // null = 未分類
    title: string;
    total: number;
    solved: number;
    answered: number;
    lastAt: Date | null;
  }[] = [];
  if (session) {
    const [clusters, allProblems, answers] = await Promise.all([
      prisma.recognitionCluster.findMany({
        where: { isPublic: true },
        orderBy: [{ order: "asc" }, { id: "asc" }],
        include: {
          _count: {
            select: {
              problems: { where: { isPublic: true, type: "RECOGNITION" } },
            },
          },
        },
      }),
      prisma.problem.findMany({
        where: { type: "RECOGNITION", isPublic: true },
        select: { id: true, clusterId: true },
      }),
      prisma.recognitionAnswer.findMany({
        where: { userId: session.userId },
        select: { problemId: true, isCorrect: true, updatedAt: true },
      }),
    ]);
    const answerByProblem = new Map<
      number,
      { isCorrect: boolean; updatedAt: Date }
    >();
    for (const a of answers) answerByProblem.set(a.problemId, a);

    recognitionRows = clusters.map((c) => {
      let solved = 0;
      let answered = 0;
      let lastAt: Date | null = null;
      for (const p of allProblems) {
        if (p.clusterId !== c.id) continue;
        const a = answerByProblem.get(p.id);
        if (!a) continue;
        answered++;
        if (a.isCorrect) solved++;
        if (!lastAt || a.updatedAt > lastAt) lastAt = a.updatedAt;
      }
      return {
        id: c.id,
        title: c.title,
        total: c._count.problems,
        solved,
        answered,
        lastAt,
      };
    });

    let ucAnswered = 0;
    let ucSolved = 0;
    let ucLast: Date | null = null;
    for (const p of allProblems) {
      if (p.clusterId != null) continue;
      const a = answerByProblem.get(p.id);
      if (!a) continue;
      ucAnswered++;
      if (a.isCorrect) ucSolved++;
      if (!ucLast || a.updatedAt > ucLast) ucLast = a.updatedAt;
    }
    if (ucAnswered > 0) {
      recognitionRows.push({
        id: null,
        title: "未分類",
        total: allProblems.filter((p) => p.clusterId == null).length,
        solved: ucSolved,
        answered: ucAnswered,
        lastAt: ucLast,
      });
    }
    recognitionRows = recognitionRows.filter((r) => r.total > 0);
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <h1 className="page-title">紀錄</h1>
        <div className="flex flex-wrap gap-2 text-sm">
          <Link
            href={
              filteredContest ? `/submissions?contest=${filteredContest.id}` : "/submissions"
            }
            className={`pill ${!onlyMine ? "pill-active" : ""}`}
          >
            全部
          </Link>
          {session && (
            <Link
              href={
                filteredContest
                  ? `/submissions?mine=1&contest=${filteredContest.id}`
                  : "/submissions?mine=1"
              }
              className={`pill ${onlyMine ? "pill-active" : ""}`}
            >
              只看我的
            </Link>
          )}
        </div>
        {filteredContest && (
          <div className="flex items-center gap-2 text-sm text-dim">
            <span>
              比賽：
              <Link
                href={`/contests/${filteredContest.id}`}
                className="text-blue hover:underline"
              >
                {filteredContest.title}
              </Link>
            </span>
            <Link
              href={onlyMine ? "/submissions?mine=1" : "/submissions"}
              className="text-mute hover:underline"
            >
              ✕ 取消篩選
            </Link>
          </div>
        )}
      </div>
      <div className="card overflow-x-auto">
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
            {submissions.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="table-cell py-10 text-center text-mute"
                >
                  還沒有紀錄
                </td>
              </tr>
            )}
            {submissions.map((s) => {
              const isOwner = session?.userId === s.userId;
              const redacted =
                s.contest &&
                !isContestRevealed(s.contest) &&
                !isOwner &&
                !isAdmin;
              return (
                <SubmissionRow
                  key={s.id}
                  s={{
                    id: s.id,
                    status: redacted ? "CONTEST" : s.status,
                    language: s.language,
                    timeMs: redacted ? null : s.timeMs,
                    memoryKb: redacted ? null : s.memoryKb,
                    username: s.user.username,
                    displayName: s.user.displayName,
                    problem: s.problem,
                    createdAtLabel: s.createdAt.toLocaleString("zh-TW", {
                      timeZone: "Asia/Taipei",
                      hour12: false,
                    }),
                  }}
                />
              );
            })}
          </tbody>
        </table>
      </div>

      {session && recognitionRows.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 section-title">我的識讀練習紀錄</h2>
          <div className="card overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-head w-16">#</th>
                  <th className="table-head">群集</th>
                  <th className="table-head w-20 text-right">題數</th>
                  <th className="table-head w-28 text-right">答對</th>
                  <th className="table-head w-24 text-right">已答</th>
                  <th className="table-head w-40">上次作答</th>
                  <th className="table-head w-20"></th>
                </tr>
              </thead>
              <tbody>
                {recognitionRows.map((r, i) => (
                  <tr key={r.id ?? "uncategorized"} className="hover:bg-panel2">
                    <td className="table-cell text-dim">{i + 1}</td>
                    <td className="table-cell font-medium">{r.title}</td>
                    <td className="table-cell text-right text-dim">{r.total}</td>
                    <td className="table-cell text-right font-semibold text-[var(--green)]">
                      {r.solved} / {r.total}
                    </td>
                    <td className="table-cell text-right text-dim">
                      {r.answered}
                    </td>
                    <td className="table-cell text-dim">
                      {r.lastAt
                        ? r.lastAt.toLocaleString("zh-TW", {
                            timeZone: "Asia/Taipei",
                            hour12: false,
                          })
                        : "—"}
                    </td>
                    <td className="table-cell">
                      <Link
                        href={
                          r.id == null
                            ? "/submissions/recognition/uncategorized"
                            : `/submissions/recognition/${r.id}`
                        }
                        className="text-sm text-blue hover:underline"
                      >
                        檢視 →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-mute">
            識讀作答以群集為單位記錄，不列入提交紀錄與排行；重新作答會更新該題狀態。
          </p>
        </div>
      )}
    </div>
  );
}
