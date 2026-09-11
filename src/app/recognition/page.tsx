import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import TagBadge from "@/components/TagBadge";
import RecognitionCredit from "@/components/RecognitionCredit";

export const metadata: Metadata = {
  title: "識讀練習",
  description: "APCS 識讀題庫，依群集練習，一次一題、選完立刻對答案。",
};
export const dynamic = "force-dynamic";

export default async function RecognitionPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string }>;
}) {
  const session = await getSession();
  const isAdmin = session?.role === "ADMIN";
  const { tag } = await searchParams;

  const [clusters, tagRows, uncategorizedCount, allProblems] = await Promise.all([
    prisma.recognitionCluster.findMany({
      where: {
        isPublic: true,
        ...(tag ? { tags: { some: { tag: { name: tag } } } } : {}),
      },
      orderBy: [{ order: "asc" }, { id: "asc" }],
      include: {
        _count: {
          select: {
            problems: { where: { isPublic: true, type: "RECOGNITION" } },
          },
        },
        tags: { include: { tag: true } },
      },
    }),
    // 篩選列只列出公開群集實際用到的標籤
    prisma.tag.findMany({
      where: { clusters: { some: { cluster: { isPublic: true } } } },
      orderBy: { name: "asc" },
    }),
    prisma.problem.count({
      where: { type: "RECOGNITION", isPublic: true, clusterId: null },
    }),
    prisma.problem.findMany({
      where: { type: "RECOGNITION", isPublic: true },
      select: { id: true, clusterId: true },
    }),
  ]);

  // 每個群集的答對進度（依 RecognitionAnswer：只記每題最新一次，不是 Submission）
  const solvedSet = new Set<number>();
  if (session) {
    const answers = await prisma.recognitionAnswer.findMany({
      where: {
        userId: session.userId,
        isCorrect: true,
        problemId: { in: allProblems.map((p) => p.id) },
      },
      select: { problemId: true },
    });
    for (const a of answers) solvedSet.add(a.problemId);
  }
  const stats = new Map<number, { total: number; solved: number }>();
  let uncategorizedSolved = 0;
  for (const p of allProblems) {
    const solved = solvedSet.has(p.id);
    if (p.clusterId == null) {
      if (solved) uncategorizedSolved++;
      continue;
    }
    const st = stats.get(p.clusterId) ?? { total: 0, solved: 0 };
    st.total++;
    if (solved) st.solved++;
    stats.set(p.clusterId, st);
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="page-title">識讀練習</h1>
          <p className="mt-1 text-sm text-dim">
            選一個群集開始練習，一次一題、選完立刻對答案。
          </p>
        </div>
        {isAdmin && (
          <Link href="/admin/recognition" className="btn-secondary">
            群集管理
          </Link>
        )}
      </div>

      {tagRows.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          <Link
            href="/recognition"
            className={`pill ${!tag ? "pill-active" : ""}`}
          >
            全部
          </Link>
          {tagRows.map((t) => (
            <Link
              key={t.id}
              href={`/recognition?tag=${encodeURIComponent(t.name)}`}
              className={`pill ${tag === t.name ? "pill-active" : ""}`}
            >
              {t.name}
            </Link>
          ))}
        </div>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="table-head w-16">#</th>
              <th className="table-head">群集</th>
              <th className="table-head w-56">標籤</th>
              <th className="table-head w-24 text-right">題數</th>
              <th className="table-head w-28 text-right">答對</th>
            </tr>
          </thead>
          <tbody>
            {clusters.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="table-cell py-10 text-center text-mute"
                >
                  {tag
                    ? "這個標籤下還沒有群集"
                    : "還沒有練習題，等管理員上架中。"}
                </td>
              </tr>
            )}
            {clusters.map((c, i) => {
              const st = stats.get(c.id) ?? { total: 0, solved: 0 };
              return (
                <tr key={c.id} className="hover:bg-panel2">
                  <td className="table-cell text-dim">{i + 1}</td>
                  <td className="table-cell">
                    <Link
                      href={`/recognition/${c.id}`}
                      className="font-medium text-blue hover:underline"
                    >
                      {c.title}
                    </Link>
                    {c.description && (
                      <p className="mt-0.5 text-xs text-mute">
                        {c.description}
                      </p>
                    )}
                  </td>
                  <td className="table-cell">
                    <div className="flex flex-wrap gap-1.5">
                      {c.tags.map((ct) => (
                        <TagBadge
                          key={ct.tagId}
                          name={ct.tag.name}
                          href={`/recognition?tag=${encodeURIComponent(ct.tag.name)}`}
                        />
                      ))}
                    </div>
                  </td>
                  <td className="table-cell text-right text-dim">
                    {c._count.problems}
                  </td>
                  <td className="table-cell text-right text-dim">
                    {session ? `${st.solved} / ${st.total}` : "—"}
                  </td>
                </tr>
              );
            })}
            {!tag && uncategorizedCount > 0 && (
              <tr className="hover:bg-panel2">
                <td className="table-cell text-dim">—</td>
                <td className="table-cell">
                  <Link
                    href="/recognition/uncategorized"
                    className="font-medium text-blue hover:underline"
                  >
                    未分類
                  </Link>
                </td>
                <td className="table-cell"></td>
                <td className="table-cell text-right text-dim">
                  {uncategorizedCount}
                </td>
                <td className="table-cell text-right text-dim">
                  {session
                    ? `${uncategorizedSolved} / ${uncategorizedCount}`
                    : "—"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <RecognitionCredit className="mt-4" />
    </div>
  );
}
