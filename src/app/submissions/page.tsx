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
      problem: { select: { id: true, order: true, title: true } },
      contest: true,
    },
  });
  const isAdmin = session?.role === "ADMIN";

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
      <p className="mono mb-2 text-[11px] text-mute sm:hidden">
        ← 左右滑動可看到更多欄位 →
      </p>
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
    </div>
  );
}
