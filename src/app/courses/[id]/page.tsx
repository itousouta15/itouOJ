import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import DifficultyBadge from "@/components/DifficultyBadge";
import CourseJoinButton from "@/components/CourseJoinButton";

export const dynamic = "force-dynamic";

export default async function CoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const courseId = Number(id);
  if (!Number.isInteger(courseId)) notFound();

  const session = await getSession();
  const isAdmin = session?.role === "ADMIN";

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      problems: {
        orderBy: [{ order: "asc" }, { id: "asc" }],
        include: { problem: true },
      },
      _count: { select: { members: true } },
    },
  });
  if (!course || (!course.isPublic && !isAdmin)) notFound();

  // 一般使用者看不到課程裡未公開的題目
  const entries = course.problems.filter((cp) => isAdmin || cp.problem.isPublic);

  let joined = false;
  const solvedSet = new Set<number>();
  if (session) {
    const [membership, solved] = await Promise.all([
      prisma.courseMember.findUnique({
        where: {
          courseId_userId: { courseId, userId: session.userId },
        },
      }),
      prisma.submission.findMany({
        where: {
          userId: session.userId,
          status: "AC",
          problemId: { in: entries.map((e) => e.problemId) },
        },
        distinct: ["problemId"],
        select: { problemId: true },
      }),
    ]);
    joined = membership !== null;
    for (const s of solved) solvedSet.add(s.problemId);
  }

  const total = entries.length;
  const solvedCount = entries.filter((e) => solvedSet.has(e.problemId)).length;
  const pct = total > 0 ? Math.round((solvedCount / total) * 100) : 0;

  // 課程排行榜：成員（或管理員）才看得到，只計課程內題目的解題數
  let board: { name: string; solved: number; subs: number }[] | null = null;
  if (joined || isAdmin) {
    const members = await prisma.courseMember.findMany({
      where: { courseId },
      include: {
        user: { select: { id: true, username: true, displayName: true } },
      },
    });
    const memberIds = members.map((m) => m.user.id);
    const problemIds = entries.map((e) => e.problemId);
    const [acPairs, subCounts] = await Promise.all([
      prisma.submission.findMany({
        where: {
          userId: { in: memberIds },
          problemId: { in: problemIds },
          status: "AC",
        },
        distinct: ["userId", "problemId"],
        select: { userId: true },
      }),
      prisma.submission.groupBy({
        by: ["userId"],
        where: { userId: { in: memberIds }, problemId: { in: problemIds } },
        _count: { _all: true },
      }),
    ]);
    const solvedBy = new Map<string, number>();
    for (const { userId } of acPairs) {
      solvedBy.set(userId, (solvedBy.get(userId) ?? 0) + 1);
    }
    const subsBy = new Map(subCounts.map((g) => [g.userId, g._count._all]));
    board = members
      .map((m) => ({
        name: m.user.displayName || m.user.username,
        solved: solvedBy.get(m.user.id) ?? 0,
        subs: subsBy.get(m.user.id) ?? 0,
      }))
      .sort(
        (a, b) =>
          b.solved - a.solved || a.subs - b.subs || a.name.localeCompare(b.name)
      );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="page-title">{course.title}</h1>
          {!course.isPublic && (
            <span className="vbadge vbadge-gray">未公開</span>
          )}
          {isAdmin && (
            <Link
              href={`/admin/courses/${course.id}/edit`}
              className="text-sm text-blue hover:underline"
            >
              編輯課程
            </Link>
          )}
        </div>
        <p className="mono mt-1 text-xs text-mute">
          {total} 題 ・ {course._count.members} 位成員
          {course.joinCode && " ・ 需要加入代碼"}
          {isAdmin && course.joinCode && (
            <span className="ml-2 text-purple">代碼：{course.joinCode}</span>
          )}
        </p>
        {course.description && (
          <p className="mt-3 max-w-2xl text-sm leading-relaxed whitespace-pre-line text-dim">
            {course.description}
          </p>
        )}
      </div>

      <div className="card flex flex-wrap items-center gap-5 p-5">
        {session ? (
          <>
            <CourseJoinButton
              courseId={course.id}
              joined={joined}
              requiresCode={Boolean(course.joinCode)}
            />
            {joined && (
              <div className="min-w-40 flex-1">
                <div className="mb-1 flex justify-between text-xs text-dim">
                  <span>解題進度</span>
                  <span className="mono">
                    {solvedCount} / {total}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-inset">
                  <div
                    className="h-full rounded-full bg-[#4caf50]"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-dim">
            <Link href="/login" className="text-blue hover:underline">
              登入
            </Link>
            後即可加入課程、追蹤解題進度
          </p>
        )}
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="table-head w-12 text-center">狀態</th>
              <th className="table-head w-16">#</th>
              <th className="table-head">標題</th>
              <th className="table-head w-24">難度</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="table-cell py-10 text-center text-mute"
                >
                  這門課還沒有題目
                </td>
              </tr>
            )}
            {entries.map((e) => (
              <tr key={e.id} className="hover:bg-panel2">
                <td className="table-cell text-center text-[#4caf50]">
                  {solvedSet.has(e.problemId) ? "✓" : ""}
                </td>
                <td className="table-cell text-dim">{e.problem.id}</td>
                <td className="table-cell">
                  <Link
                    href={`/problems/${e.problem.id}`}
                    className="font-medium text-blue hover:underline"
                  >
                    {e.problem.title}
                  </Link>
                  {!e.problem.isPublic && (
                    <span className="ml-2 text-xs text-mute">（未公開）</span>
                  )}
                </td>
                <td className="table-cell">
                  <DifficultyBadge difficulty={e.problem.difficulty} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {board ? (
        <div>
          <h2 className="section-title mb-3">課程排行</h2>
          <div className="card overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-head w-20">名次</th>
                  <th className="table-head">成員</th>
                  <th className="table-head w-28 text-right">解題數</th>
                  <th className="table-head w-28 text-right">提交數</th>
                </tr>
              </thead>
              <tbody>
                {board.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="table-cell py-10 text-center text-mute"
                    >
                      還沒有成員
                    </td>
                  </tr>
                )}
                {board.map((r, i) => (
                  <tr key={r.name} className="hover:bg-panel2">
                    <td className="table-cell font-semibold text-dim">
                      {i + 1}
                    </td>
                    <td className="table-cell font-medium">{r.name}</td>
                    <td className="table-cell text-right font-semibold text-[#4caf50]">
                      {r.solved} / {total}
                    </td>
                    <td className="table-cell text-right text-dim">{r.subs}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        session && (
          <p className="text-sm text-mute">加入課程後即可查看課程內部排行。</p>
        )
      )}
    </div>
  );
}
