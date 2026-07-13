import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import SubmissionRow from "@/components/SubmissionRow";

export const metadata: Metadata = { title: "紀錄" };
export const dynamic = "force-dynamic";

export default async function SubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ mine?: string }>;
}) {
  const { mine } = await searchParams;
  const session = await getSession();
  const onlyMine = mine === "1" && session;

  const submissions = await prisma.submission.findMany({
    where: onlyMine ? { userId: session!.userId } : {},
    orderBy: { id: "desc" },
    take: 100,
    include: {
      user: { select: { username: true, displayName: true } },
      problem: { select: { id: true, title: true } },
    },
  });

  return (
    <div>
      <div className="mb-4 flex items-center gap-4">
        <h1 className="page-title">紀錄</h1>
        <div className="flex gap-2 text-sm">
          <Link
            href="/submissions"
            className={`pill ${!onlyMine ? "pill-active" : ""}`}
          >
            全部
          </Link>
          {session && (
            <Link
              href="/submissions?mine=1"
              className={`pill ${onlyMine ? "pill-active" : ""}`}
            >
              只看我的
            </Link>
          )}
        </div>
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
            {submissions.map((s) => (
              <SubmissionRow
                key={s.id}
                s={{
                  id: s.id,
                  status: s.status,
                  language: s.language,
                  timeMs: s.timeMs,
                  memoryKb: s.memoryKb,
                  username: s.user.username,
                  displayName: s.user.displayName,
                  problem: s.problem,
                  createdAtLabel: s.createdAt.toLocaleString("zh-TW", {
                    timeZone: "Asia/Taipei",
                    hour12: false,
                  }),
                }}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
