import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { LANGUAGES, isLanguageKey } from "@/lib/languages";
import VerdictBadge from "@/components/VerdictBadge";

export const metadata: Metadata = { title: "提交紀錄" };
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
      user: { select: { username: true } },
      problem: { select: { id: true, title: true } },
    },
  });

  return (
    <div>
      <div className="mb-4 flex items-center gap-4">
        <h1 className="text-2xl font-bold">提交紀錄</h1>
        <div className="flex gap-2 text-sm">
          <Link
            href="/submissions"
            className={`rounded-full px-3 py-1 ${!onlyMine ? "bg-zinc-900 text-white" : "bg-zinc-200 text-zinc-600 hover:bg-zinc-300"}`}
          >
            全部
          </Link>
          {session && (
            <Link
              href="/submissions?mine=1"
              className={`rounded-full px-3 py-1 ${onlyMine ? "bg-zinc-900 text-white" : "bg-zinc-200 text-zinc-600 hover:bg-zinc-300"}`}
            >
              只看我的
            </Link>
          )}
        </div>
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
                  className="table-cell py-10 text-center text-zinc-400"
                >
                  還沒有提交紀錄
                </td>
              </tr>
            )}
            {submissions.map((s) => (
              <tr key={s.id} className="hover:bg-zinc-50">
                <td className="table-cell">
                  <Link
                    href={`/submissions/${s.id}`}
                    className="text-blue-700 hover:underline"
                  >
                    {s.id}
                  </Link>
                </td>
                <td className="table-cell">
                  <Link
                    href={`/problems/${s.problem.id}`}
                    className="text-blue-700 hover:underline"
                  >
                    {s.problem.title}
                  </Link>
                </td>
                <td className="table-cell">{s.user.username}</td>
                <td className="table-cell text-zinc-500">
                  {isLanguageKey(s.language)
                    ? LANGUAGES[s.language].label
                    : s.language}
                </td>
                <td className="table-cell">
                  <VerdictBadge status={s.status} />
                </td>
                <td className="table-cell text-right text-zinc-500">
                  {s.timeMs != null ? `${s.timeMs} ms` : "—"}
                </td>
                <td className="table-cell text-right text-zinc-500">
                  {s.memoryKb != null
                    ? `${Math.round(s.memoryKb / 1024)} MB`
                    : "—"}
                </td>
                <td className="table-cell text-zinc-500">
                  {s.createdAt.toLocaleString("zh-TW", {
                    timeZone: "Asia/Taipei",
                    hour12: false,
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
