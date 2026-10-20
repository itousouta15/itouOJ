import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { cpeProblemWhere } from "@/lib/cpeCourse";
import { toiPotentialProblemWhere } from "@/lib/toiPotentialCourse";
import { toiPotentialTopics } from "@/lib/toiPotentialLessonTypes";

export const metadata: Metadata = {
  title: "課程",
  robots: { index: true, follow: true },
};
export const dynamic = "force-dynamic";

export default async function CoursesPage() {
  const session = await getSession();
  const isAdmin = session?.role === "ADMIN";

  const [courses, cpeCount, cpeSolved, toiPotentialCount, toiPotentialSolved] =
    await Promise.all([
      prisma.course.findMany({
        where: isAdmin ? {} : { isPublic: true },
        orderBy: { id: "asc" },
        include: {
          _count: { select: { problems: true, members: true } },
        },
      }),
      prisma.problem.count({ where: cpeProblemWhere(isAdmin) }),
      session
        ? prisma.submission.findMany({
            where: {
              userId: session.userId,
              status: "AC",
              problem: cpeProblemWhere(isAdmin),
            },
            distinct: ["problemId"],
            select: { problemId: true },
          })
        : Promise.resolve([]),
      prisma.problem.count({ where: toiPotentialProblemWhere(isAdmin) }),
      session
        ? prisma.submission.findMany({
            where: {
              userId: session.userId,
              status: "AC",
              problem: toiPotentialProblemWhere(isAdmin),
            },
            distinct: ["problemId"],
            select: { problemId: true },
          })
        : Promise.resolve([]),
    ]);
  const listedCourses = [...courses].sort(
    (a, b) =>
      Number(b.title === "APCS 實作題：由簡到難") -
      Number(a.title === "APCS 實作題：由簡到難"),
  );

  // 已加入的課程與各課程進度
  const joinedSet = new Set<number>();
  const progressMap = new Map<number, number>();
  if (session) {
    const memberships = await prisma.courseMember.findMany({
      where: { userId: session.userId },
      select: { courseId: true },
    });
    for (const m of memberships) joinedSet.add(m.courseId);

    if (joinedSet.size > 0) {
      const [courseProblems, solved] = await Promise.all([
        prisma.courseProblem.findMany({
          where: { courseId: { in: [...joinedSet] } },
          select: { courseId: true, problemId: true },
        }),
        prisma.submission.findMany({
          where: { userId: session.userId, status: "AC" },
          distinct: ["problemId"],
          select: { problemId: true },
        }),
      ]);
      const solvedSet = new Set(solved.map((s) => s.problemId));
      for (const cp of courseProblems) {
        if (solvedSet.has(cp.problemId)) {
          progressMap.set(cp.courseId, (progressMap.get(cp.courseId) ?? 0) + 1);
        }
      }
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="page-title">課程</h1>
        {isAdmin && (
          <Link href="/admin/courses" className="btn-secondary">
            課程管理
          </Link>
        )}
      </div>

      {courses.length === 0 && cpeCount === 0 && toiPotentialCount === 0 ? (
        <div className="card p-10 text-center text-sm text-mute">
          還沒有課程
          {isAdmin && (
            <>
              ，
              <Link
                href="/admin/courses/new"
                className="text-blue hover:underline"
              >
                來開第一門課
              </Link>
            </>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {toiPotentialCount > 0 && (
            <Link
              href="/courses/toi-potential"
              className="card motion-card block p-5 hover:bg-panel2"
            >
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="section-title flex-1">TOI 潛力組逐題教學</h2>
                <span className="vbadge vbadge-blue">公開學習路徑</span>
              </div>
              <p className="mt-2 text-sm text-dim">
                從統計、模擬到貪心、搜尋、圖論與動態規劃，每題提供解題推導、步驟動畫與完整
                C++ / Python 程式。
              </p>
              <p className="mono mt-3 text-xs text-mute">
                {toiPotentialCount} 題 · {toiPotentialTopics.length} 個主題
                {session
                  ? ` · ${toiPotentialSolved.length} 題已完成`
                  : " · 不需加入代碼"}
              </p>
            </Link>
          )}
          {cpeCount > 0 && (
            <Link
              href="/courses/cpe"
              className="card motion-card block p-5 hover:bg-panel2"
            >
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="section-title flex-1">CPE 逐題教學</h2>
                <span className="vbadge vbadge-blue">公開學習路徑</span>
              </div>
              <p className="mt-2 text-sm text-dim">
                依主題、方法與難度學習，每題包含解題推導、步驟動畫、完整 C++ /
                Python 程式。
              </p>
              <p className="mono mt-3 text-xs text-mute">
                {cpeCount} 題 · 12 個主題
                {session
                  ? ` · ${cpeSolved.length} 題已完成`
                  : " · 不需加入代碼"}
              </p>
            </Link>
          )}
          {listedCourses.map((c) => {
            const joined = joinedSet.has(c.id);
            const solved = progressMap.get(c.id) ?? 0;
            const total = c._count.problems;
            const pct = total > 0 ? Math.round((solved / total) * 100) : 0;
            return (
              <Link
                key={c.id}
                href={`/courses/${c.id}`}
                className="card motion-card block p-5 hover:bg-panel2"
              >
                <div className="flex items-center gap-2">
                  <h2 className="section-title flex-1 truncate">{c.title}</h2>
                  {joined && (
                    <span className="vbadge vbadge-green">已加入</span>
                  )}
                  {!joined && c.joinCode && (
                    <span className="vbadge vbadge-blue">需要代碼</span>
                  )}
                  {!c.isPublic && (
                    <span className="vbadge vbadge-gray">未公開</span>
                  )}
                </div>
                {c.description && (
                  <p className="mt-2 line-clamp-2 text-sm text-dim">
                    {c.description}
                  </p>
                )}
                <p className="mono mt-3 text-xs text-mute">
                  {total} 題 ・ {c._count.members} 位成員
                </p>
                {joined && (
                  <div className="mt-3">
                    <div className="mb-1 flex justify-between text-xs text-dim">
                      <span>進度</span>
                      <span className="mono">
                        {solved} / {total}
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-inset">
                      <div
                        className="motion-progress h-full rounded-full bg-[var(--green)]"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
