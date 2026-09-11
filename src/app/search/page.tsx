import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { markdownSnippet } from "@/lib/textSnippet";
import { problemHref } from "@/lib/problemTypes";
import DifficultyBadge from "@/components/DifficultyBadge";
import TagBadge from "@/components/TagBadge";
import CategoryBadge from "@/components/CategoryBadge";

export const metadata: Metadata = {
  title: "題目搜尋",
  description: "搜尋全站實作題與識讀題（標題、題敘、標籤、題號）。",
  robots: { index: false, follow: true },
};
export const dynamic = "force-dynamic";

const MAX_TERMS = 5;
const MAX_RESULTS = 50;

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q: rawQ } = await searchParams;
  const q = (rawQ ?? "").trim();
  const session = await getSession();
  const isAdmin = session?.role === "ADMIN";

  // 多關鍵字以空白分隔，全部都要命中（AND）；最多取前 5 個避免查詢爆掉
  const terms = q.split(/\s+/).filter(Boolean).slice(0, MAX_TERMS);

  const problems = terms.length
    ? await prisma.problem.findMany({
        where: {
          ...(isAdmin ? {} : { isPublic: true }),
          AND: terms.map((t) => {
            const n = Number(t);
            return {
              OR: [
                { title: { contains: t } },
                { statement: { contains: t } },
                { code: { contains: t } },
                { category: { contains: t } },
                { paper: { contains: t } },
                { tags: { some: { tag: { name: { contains: t } } } } },
                // 純數字也可以直接找題號（實作題 order、識讀題原題號）
                ...(Number.isInteger(n)
                  ? [{ order: n }, { sourceNumber: n }]
                  : []),
              ],
            };
          }),
        },
        orderBy: [{ type: "asc" }, { order: "asc" }, { id: "asc" }],
        take: MAX_RESULTS,
        omit: { pdfData: true },
        include: {
          tags: { include: { tag: true } },
          cluster: { select: { title: true } },
        },
      })
    : [];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">題目搜尋</h1>
        <p className="mt-1 text-sm text-dim">
          搜尋全站實作題與識讀題，可用標題、題敘、標籤或題號。
        </p>
      </div>

      <form action="/search" method="get" className="flex flex-wrap gap-2">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="例：費氏數列、陣列、125"
          className="input min-w-0 flex-1"
        />
        <button type="submit" className="btn-primary">
          搜尋
        </button>
      </form>

      {q &&
        (problems.length > 0 ? (
          <p className="text-sm text-dim">
            「{q}」找到 {problems.length} 筆
            {problems.length === MAX_RESULTS ? "（只顯示前 50 筆）" : ""}
          </p>
        ) : (
          <div className="card p-10 text-center text-mute">
            找不到符合「{q}」的題目
          </div>
        ))}

      <div className="space-y-2">
        {problems.map((p) => {
          const isRecognition = p.type === "RECOGNITION";
          const snippet = markdownSnippet(p.statement, 160);
          return (
            <div key={p.id} className="card p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`vbadge ${
                    isRecognition ? "vbadge-blue" : "vbadge-green"
                  }`}
                >
                  {isRecognition ? "識讀" : "實作"}
                </span>
                <Link
                  href={problemHref(p)}
                  className="font-medium text-blue hover:underline"
                >
                  {p.title}
                </Link>
                {isRecognition ? (
                  <>
                    {p.cluster && (
                      <span className="text-xs text-mute">{p.cluster.title}</span>
                    )}
                    <CategoryBadge category={p.category} />
                  </>
                ) : (
                  <DifficultyBadge difficulty={p.difficulty} />
                )}
                {!p.isPublic && (
                  <span className="text-xs text-mute">（未公開）</span>
                )}
              </div>
              {snippet && (
                <p className="mt-1.5 text-sm text-dim">{snippet}</p>
              )}
              {p.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {p.tags.map((pt) => (
                    <TagBadge key={pt.tagId} name={pt.tag.name} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
