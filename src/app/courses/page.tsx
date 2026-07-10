import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = { title: "課程" };
export const dynamic = "force-dynamic";

export default async function CoursesPage() {
  const session = await getSession();
  const isAdmin = session?.role === "ADMIN";

  const courses = await prisma.course.findMany({
    where: isAdmin ? {} : { isPublic: true },
    orderBy: { id: "asc" },
    include: {
      _count: { select: { problems: true, members: true } },
    },
  });

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
          progressMap.set(
            cp.courseId,
            (progressMap.get(cp.courseId) ?? 0) + 1
          );
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

      {courses.length === 0 ? (
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
          {courses.map((c) => {
            const joined = joinedSet.has(c.id);
            const solved = progressMap.get(c.id) ?? 0;
            const total = c._count.problems;
            const pct = total > 0 ? Math.round((solved / total) * 100) : 0;
            return (
              <Link
                key={c.id}
                href={`/courses/${c.id}`}
                className="card block p-5 transition-colors hover:bg-panel2"
              >
                <div className="flex items-center gap-2">
                  <h2 className="section-title flex-1 truncate">{c.title}</h2>
                  {joined && <span className="vbadge vbadge-green">已加入</span>}
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
                        className="h-full rounded-full bg-[#4caf50]"
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
